"""Vulnerability CRUD and search routes."""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import (
    get_current_active_user,
    require_editor,
    require_scope,
)
from app.models.api_token import ApiToken
from app.models.user import User
from app.models.vulnerability import Vulnerability, VulnerabilityHistory, VulnerabilityLevel, VulnerabilityType
from app.schemas.vulnerability import (
    VulnerabilityCreate,
    VulnerabilityExportDoc,
    VulnerabilityInfo,
    VulnerabilityUpdate,
)
from app.utils.xml_parser import parse_vulnerabilities_xml, export_vulnerabilities_xml

router = APIRouter(prefix="/api/vulns", tags=["vulnerabilities"])


@router.get("", response_model=list[VulnerabilityInfo])
async def search_vulnerabilities(
    q: str | None = Query(None, description="Search query (name, description, risk)"),
    level: VulnerabilityLevel | None = Query(None, description="Filter by severity level"),
    scope: str | None = Query(None, description="Filter by scope (substring)"),
    protocol: str | None = Query(None, description="Filter by protocol/interface (substring)"),
    vuln_type: VulnerabilityType | None = Query(None, alias="type", description="Filter by type"),
    min_score: float | None = Query(None, ge=0.0, le=10.0, description="Minimum CVSS score"),
    max_score: float | None = Query(None, ge=0.0, le=10.0, description="Maximum CVSS score"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    sort: str = Query("updated_at", description="Sort field (name, level, cvss_score, updated_at)"),
    order: str = Query("desc", description="Sort order (asc, desc)"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """
    Search and filter vulnerabilities.

    Supports full-text search, filtering, pagination, and sorting.
    """
    # Build query
    query = select(Vulnerability)

    # Text search
    if q:
        search_filter = or_(
            Vulnerability.name.ilike(f"%{q}%"),
            Vulnerability.description.ilike(f"%{q}%"),
            Vulnerability.risk.ilike(f"%{q}%"),
            Vulnerability.recommendation.ilike(f"%{q}%"),
        )
        query = query.where(search_filter)

    # Filters
    if level:
        query = query.where(Vulnerability.level == level)

    if scope:
        query = query.where(Vulnerability.scope.ilike(f"%{scope}%"))

    if protocol:
        query = query.where(Vulnerability.protocol_interface.ilike(f"%{protocol}%"))

    if vuln_type:
        query = query.where(Vulnerability.vuln_type == vuln_type)

    if min_score is not None:
        query = query.where(Vulnerability.cvss_score >= min_score)

    if max_score is not None:
        query = query.where(Vulnerability.cvss_score <= max_score)

    # Count total (before pagination)
    count_query = select(func.count()).select_from(query.subquery())
    total_count = await db.scalar(count_query)

    # Sorting
    sort_field = getattr(Vulnerability, sort, Vulnerability.updated_at)
    if order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    # Execute
    result = await db.execute(query)
    vulnerabilities = result.scalars().all()

    # Note: In a real app, you'd return pagination metadata
    # For now, just return the results
    return [VulnerabilityInfo.model_validate(v) for v in vulnerabilities]


@router.get("/{vuln_id}", response_model=VulnerabilityInfo)
async def get_vulnerability(
    vuln_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get a specific vulnerability by ID."""
    result = await db.execute(select(Vulnerability).where(Vulnerability.id == vuln_id))
    vuln = result.scalar_one_or_none()

    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found",
        )

    return VulnerabilityInfo.model_validate(vuln)


@router.post("", response_model=VulnerabilityInfo, status_code=status.HTTP_201_CREATED)
async def create_vulnerability(
    vuln_data: VulnerabilityCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_editor),
):
    """Create a new vulnerability (requires editor or admin role)."""
    vuln = Vulnerability(
        **vuln_data.model_dump(exclude={"type"}),
        vuln_type=vuln_data.vuln_type,
        created_by=user.id,
        updated_by=user.id,
    )

    db.add(vuln)
    await db.commit()
    await db.refresh(vuln)

    # Create history entry
    history = VulnerabilityHistory(
        vulnerability_id=vuln.id,
        snapshot=vuln_data.model_dump(mode="json"),
        changed_by=user.id,
        change_type="created",
    )
    db.add(history)
    await db.commit()

    return VulnerabilityInfo.model_validate(vuln)


@router.put("/{vuln_id}", response_model=VulnerabilityInfo)
async def update_vulnerability(
    vuln_id: UUID,
    vuln_data: VulnerabilityUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_editor),
):
    """Update an existing vulnerability (requires editor or admin role)."""
    result = await db.execute(select(Vulnerability).where(Vulnerability.id == vuln_id))
    vuln = result.scalar_one_or_none()

    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found",
        )

    # Update fields
    update_data = vuln_data.model_dump(exclude_unset=True, exclude={"type"})
    if "vuln_type" in vuln_data.model_dump(exclude_unset=True):
        update_data["vuln_type"] = vuln_data.vuln_type

    for field, value in update_data.items():
        setattr(vuln, field, value)

    vuln.updated_by = user.id
    vuln.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(vuln)

    # Create history entry
    history = VulnerabilityHistory(
        vulnerability_id=vuln.id,
        snapshot=VulnerabilityInfo.model_validate(vuln).model_dump(mode="json"),
        changed_by=user.id,
        change_type="updated",
    )
    db.add(history)
    await db.commit()

    return VulnerabilityInfo.model_validate(vuln)


@router.delete("/{vuln_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vulnerability(
    vuln_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_editor),
):
    """Delete a vulnerability (requires editor or admin role)."""
    result = await db.execute(select(Vulnerability).where(Vulnerability.id == vuln_id))
    vuln = result.scalar_one_or_none()

    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found",
        )

    # Create history entry before deletion
    history = VulnerabilityHistory(
        vulnerability_id=vuln.id,
        snapshot=VulnerabilityInfo.model_validate(vuln).model_dump(mode="json"),
        changed_by=user.id,
        change_type="deleted",
    )
    db.add(history)

    # Delete
    await db.delete(vuln)
    await db.commit()

    return None


@router.get("/{vuln_id}/history", response_model=list[dict])
async def get_vulnerability_history(
    vuln_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Get history of changes for a vulnerability."""
    result = await db.execute(
        select(VulnerabilityHistory)
        .where(VulnerabilityHistory.vulnerability_id == vuln_id)
        .order_by(VulnerabilityHistory.changed_at.desc())
    )
    history = result.scalars().all()

    return [
        {
            "id": str(h.id),
            "changed_at": h.changed_at.isoformat(),
            "changed_by": str(h.changed_by) if h.changed_by else None,
            "change_type": h.change_type,
            "snapshot": h.snapshot,
        }
        for h in history
    ]


# =============================================================================
# Word Integration Endpoints (use API token auth)
# =============================================================================


@router.get("/bulk", response_model=list[VulnerabilityInfo])
async def get_bulk_vulnerabilities(
    updated_since: str | None = Query(None, description="ISO 8601 datetime"),
    db: AsyncSession = Depends(get_db),
    token: ApiToken = Depends(require_scope("read:vulns")),
):
    """
    Get all vulnerabilities for Word macro cache (requires API token with read:vulns scope).

    Optionally filter by updated_since to get only recent changes.
    """
    query = select(Vulnerability)

    # Filter by updated_since if provided
    if updated_since:
        try:
            since_dt = datetime.fromisoformat(updated_since.replace("Z", "+00:00"))
            query = query.where(Vulnerability.updated_at >= since_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid datetime format. Use ISO 8601 (e.g., 2024-01-01T00:00:00Z)",
            )

    query = query.order_by(Vulnerability.name.asc())

    result = await db.execute(query)
    vulnerabilities = result.scalars().all()

    return [VulnerabilityInfo.model_validate(v) for v in vulnerabilities]


@router.get("/{vuln_id}/exportdoc", response_model=VulnerabilityExportDoc)
async def export_vulnerability_for_doc(
    vuln_id: UUID,
    format: str = Query("json", description="Export format (json or xml)"),
    db: AsyncSession = Depends(get_db),
    token: ApiToken = Depends(require_scope("export:doc")),
):
    """
    Export a specific vulnerability for Word document insertion (requires API token with export:doc scope).

    Returns the vulnerability in a format suitable for Word macro insertion.
    """
    result = await db.execute(select(Vulnerability).where(Vulnerability.id == vuln_id))
    vuln = result.scalar_one_or_none()

    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found",
        )

    # Convert to export format
    export_data = VulnerabilityExportDoc(
        id=vuln.id,
        name=vuln.name,
        level=vuln.level.value,
        scope=vuln.scope,
        protocol_interface=vuln.protocol_interface,
        cvss_score=vuln.cvss_score,
        cvss_vector=vuln.cvss_vector,
        description=vuln.description,
        risk=vuln.risk,
        recommendation=vuln.recommendation,
        type=vuln.vuln_type.value,
        tag_order=vuln.tag_order,
    )

    # For now, always return JSON (XML export can be added later)
    return export_data


# =============================================================================
# XML Import/Export
# =============================================================================


@router.post("/import/xml", status_code=status.HTTP_200_OK)
async def import_vulnerabilities_xml(
    file: UploadFile = File(..., description="XML file containing vulnerabilities"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_editor),
):
    """
    Import vulnerabilities from XML file (requires editor or admin role).

    Creates new vulnerabilities or updates existing ones based on name matching.
    """
    if not file.filename or not file.filename.endswith(".xml"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an XML file",
        )

    # Read file content
    content = await file.read()

    try:
        # Parse XML
        vulnerabilities_data = parse_vulnerabilities_xml(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse XML: {str(e)}",
        )

    imported_count = 0
    updated_count = 0

    for vuln_data in vulnerabilities_data:
        # Check if vulnerability with same name exists
        result = await db.execute(
            select(Vulnerability).where(Vulnerability.name == vuln_data["name"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing
            for field, value in vuln_data.items():
                if field != "tag_order":  # Handle tag_order separately
                    setattr(existing, field if field != "type" else "vuln_type", value)
                else:
                    existing.tag_order = value

            existing.updated_by = user.id
            existing.updated_at = datetime.now(timezone.utc)
            updated_count += 1
        else:
            # Create new
            vuln = Vulnerability(
                **{k: v for k, v in vuln_data.items() if k not in ["type", "tag_order"]},
                vuln_type=vuln_data["type"],
                tag_order=vuln_data.get("tag_order"),
                created_by=user.id,
                updated_by=user.id,
            )
            db.add(vuln)
            imported_count += 1

    await db.commit()

    return {
        "message": "Import successful",
        "imported": imported_count,
        "updated": updated_count,
        "total": imported_count + updated_count,
    }


@router.post("/export/xml")
async def export_vulnerabilities_to_xml(
    ids: list[UUID] | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """
    Export vulnerabilities to XML format.

    If ids are provided, only export those vulnerabilities.
    Otherwise, export all vulnerabilities.
    """
    query = select(Vulnerability)

    if ids:
        query = query.where(Vulnerability.id.in_(ids))

    query = query.order_by(Vulnerability.name.asc())

    result = await db.execute(query)
    vulnerabilities = result.scalars().all()

    if not vulnerabilities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No vulnerabilities found",
        )

    # Convert to XML
    xml_content = export_vulnerabilities_xml(vulnerabilities)

    # Return as XML response
    from fastapi.responses import Response

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": f"attachment; filename=vulnerabilities_{timestamp}.xml"
        },
    )
