"""Vulnerability types routes."""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.vulnerability_types import VULNERABILITY_TYPES, get_types_by_category
from app.dependencies import require_admin, get_db
from app.models.user import User
from app.models.custom_type import CustomVulnerabilityType

router = APIRouter(prefix="/api/types", tags=["types"])


class TypeMetadataUpdate(BaseModel):
    """Schema for updating type metadata."""
    icon: str
    color: str
    description: str


class TypeMetadataCreate(BaseModel):
    """Schema for creating custom type."""
    name: str
    category: str
    icon: str
    color: str
    description: str


@router.get("")
async def get_vulnerability_types(db: AsyncSession = Depends(get_db)):
    """
    Get all vulnerability types with their metadata (icons, colors, descriptions).

    Returns types organized by category for easy display in dropdowns.
    Includes both built-in ENUM types and custom user-created types.
    """
    # Get built-in types
    all_types = list(VULNERABILITY_TYPES.values())

    # Get custom types from database
    result = await db.execute(select(CustomVulnerabilityType))
    custom_types = result.scalars().all()

    # Add custom types to the list
    for custom_type in custom_types:
        all_types.append({
            "name": custom_type.name,
            "category": custom_type.category,
            "icon": custom_type.icon,
            "color": custom_type.color,
            "description": custom_type.description,
            "is_custom": True
        })

    # Organize by category
    by_category = {}
    for type_data in all_types:
        category = type_data["category"]
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(type_data)

    return {
        "types": all_types,
        "by_category": by_category,
    }


@router.get("/{type_name}")
async def get_vulnerability_type(type_name: str, db: AsyncSession = Depends(get_db)):
    """Get metadata for a specific vulnerability type (built-in or custom)."""
    # Check built-in types first
    type_meta = VULNERABILITY_TYPES.get(type_name)
    if type_meta:
        return type_meta

    # Check custom types
    result = await db.execute(
        select(CustomVulnerabilityType).where(CustomVulnerabilityType.name == type_name)
    )
    custom_type = result.scalar_one_or_none()
    if custom_type:
        return {
            "name": custom_type.name,
            "category": custom_type.category,
            "icon": custom_type.icon,
            "color": custom_type.color,
            "description": custom_type.description,
            "is_custom": True
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Type '{type_name}' not found"
    )


@router.post("")
async def create_custom_type(
    type_data: TypeMetadataCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin)
):
    """
    Create a new custom vulnerability type (admin only).

    Custom types are stored persistently in the database.
    """
    # Check if name already exists in built-in types
    if type_data.name in VULNERABILITY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type '{type_data.name}' already exists as a built-in type"
        )

    # Check if custom type already exists
    result = await db.execute(
        select(CustomVulnerabilityType).where(CustomVulnerabilityType.name == type_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Custom type '{type_data.name}' already exists"
        )

    # Create new custom type
    custom_type = CustomVulnerabilityType(
        name=type_data.name,
        category=type_data.category,
        icon=type_data.icon,
        color=type_data.color,
        description=type_data.description
    )
    db.add(custom_type)
    await db.commit()
    await db.refresh(custom_type)

    return {
        "message": f"Custom type '{type_data.name}' created successfully",
        "type": {
            "name": custom_type.name,
            "category": custom_type.category,
            "icon": custom_type.icon,
            "color": custom_type.color,
            "description": custom_type.description,
            "is_custom": True
        }
    }


@router.put("/{type_name}")
async def update_vulnerability_type(
    type_name: str,
    update: TypeMetadataUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin)
):
    """
    Update metadata for a vulnerability type (admin only).

    Built-in types: Updates in-memory only (not persisted).
    Custom types: Updates are saved to database (persistent).
    """
    # Check if it's a built-in type
    if type_name in VULNERABILITY_TYPES:
        # Update in-memory (non-persistent)
        VULNERABILITY_TYPES[type_name]["icon"] = update.icon
        VULNERABILITY_TYPES[type_name]["color"] = update.color
        VULNERABILITY_TYPES[type_name]["description"] = update.description

        return {
            "message": f"Built-in type '{type_name}' updated successfully (in-memory only)",
            "type": VULNERABILITY_TYPES[type_name],
            "warning": "Changes are not persisted. Update the source code for permanent changes."
        }

    # Check if it's a custom type
    result = await db.execute(
        select(CustomVulnerabilityType).where(CustomVulnerabilityType.name == type_name)
    )
    custom_type = result.scalar_one_or_none()
    if not custom_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Type '{type_name}' not found"
        )

    # Update custom type (persistent)
    custom_type.icon = update.icon
    custom_type.color = update.color
    custom_type.description = update.description
    await db.commit()
    await db.refresh(custom_type)

    return {
        "message": f"Custom type '{type_name}' updated successfully",
        "type": {
            "name": custom_type.name,
            "category": custom_type.category,
            "icon": custom_type.icon,
            "color": custom_type.color,
            "description": custom_type.description,
            "is_custom": True
        }
    }


@router.delete("/{type_name}")
async def delete_custom_type(
    type_name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin)
):
    """
    Delete a custom vulnerability type (admin only).

    Built-in types cannot be deleted.
    """
    # Check if it's a built-in type (cannot delete)
    if type_name in VULNERABILITY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete built-in types"
        )

    # Find custom type
    result = await db.execute(
        select(CustomVulnerabilityType).where(CustomVulnerabilityType.name == type_name)
    )
    custom_type = result.scalar_one_or_none()
    if not custom_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Custom type '{type_name}' not found"
        )

    # Delete
    await db.delete(custom_type)
    await db.commit()

    return {"message": f"Custom type '{type_name}' deleted successfully"}
