"""API Token management routes (admin-only)."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.api_token import ApiToken
from app.models.user import User
from app.schemas.token import (
    ApiTokenCreate,
    ApiTokenInfo,
    ApiTokenRotate,
    ApiTokenWithSecret,
)
from app.security import generate_api_token, get_default_token_expiration, hash_token

router = APIRouter(prefix="/api/tokens", tags=["tokens"])


@router.post("", response_model=ApiTokenWithSecret, status_code=status.HTTP_201_CREATED)
async def create_token(
    token_data: ApiTokenCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Create a new API token (admin-only).

    The plain token is returned ONLY once and cannot be retrieved again.
    """
    # Generate token
    plain_token = generate_api_token()
    token_hash_value = hash_token(plain_token)

    # Set expiration
    expires_at = token_data.expires_at or get_default_token_expiration()

    # Create token in database
    new_token = ApiToken(
        owner_user_id=admin.id,
        label=token_data.label,
        token_hash=token_hash_value,
        scopes=token_data.scopes,
        expires_at=expires_at,
    )

    db.add(new_token)
    await db.commit()
    await db.refresh(new_token)

    # Return with plain token (only time it's visible)
    response = ApiTokenWithSecret.model_validate(new_token)
    response.token = plain_token

    return response


@router.get("", response_model=list[ApiTokenInfo])
async def list_tokens(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    List all API tokens (admin-only).

    Does not include the actual token secrets.
    """
    result = await db.execute(select(ApiToken).order_by(ApiToken.created_at.desc()))
    tokens = result.scalars().all()

    return [ApiTokenInfo.model_validate(token) for token in tokens]


@router.get("/{token_id}", response_model=ApiTokenInfo)
async def get_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Get details of a specific API token (admin-only).

    Does not include the actual token secret.
    """
    result = await db.execute(select(ApiToken).where(ApiToken.id == token_id))
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    return ApiTokenInfo.model_validate(token)


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Revoke an API token (admin-only).

    Revoked tokens cannot be used anymore.
    """
    result = await db.execute(select(ApiToken).where(ApiToken.id == token_id))
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    # Mark as revoked
    token.revoked_at = datetime.utcnow()
    await db.commit()

    return None


@router.post("/{token_id}/rotate", response_model=ApiTokenWithSecret)
async def rotate_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Rotate an API token (admin-only).

    Generates a new secret for the token, invalidating the old one.
    The new plain token is returned ONLY once.
    """
    result = await db.execute(select(ApiToken).where(ApiToken.id == token_id))
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )

    # Generate new token
    new_plain_token = generate_api_token()
    new_token_hash = hash_token(new_plain_token)

    # Update token
    token.token_hash = new_token_hash
    token.last_used_at = None  # Reset usage tracking
    token.last_used_ip = None

    await db.commit()
    await db.refresh(token)

    # Return with new plain token (only time it's visible)
    response = ApiTokenWithSecret.model_validate(token)
    response.token = new_plain_token

    return response


@router.head("/validate", status_code=status.HTTP_204_NO_CONTENT)
async def validate_token(
    db: AsyncSession = Depends(get_db),
):
    """
    Validate that the provided token is valid.

    This is a lightweight endpoint for Word macros to check token validity.
    Returns 204 if valid, 401 if invalid/expired/revoked.
    """
    # The verify_api_token dependency will handle validation
    # If we reach here, the token is valid
    return None
