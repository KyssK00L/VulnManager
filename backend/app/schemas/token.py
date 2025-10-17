"""API Token schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ApiTokenCreate(BaseModel):
    """Schema for creating a new API token."""

    label: str = Field(..., min_length=1, max_length=128, description="Human-readable label for the token")
    scopes: list[str] = Field(..., min_items=1, description="List of scopes (e.g., read:vulns, export:doc)")
    expires_at: datetime | None = Field(None, description="Optional expiration date (UTC)")

    @field_validator("scopes")
    @classmethod
    def validate_scopes(cls, v: list[str]) -> list[str]:
        """Validate that scopes are in the allowed list."""
        allowed_scopes = {"read:vulns", "export:doc", "write:vulns"}
        for scope in v:
            if scope not in allowed_scopes:
                raise ValueError(f"Invalid scope: {scope}. Allowed: {allowed_scopes}")
        return v


class ApiTokenInfo(BaseModel):
    """Schema for API token information (without secret)."""

    id: UUID
    owner_user_id: UUID
    label: str
    scopes: list[str]
    expires_at: datetime | None
    revoked_at: datetime | None
    last_used_at: datetime | None
    last_used_ip: str | None
    created_at: datetime
    is_valid: bool

    class Config:
        from_attributes = True


class ApiTokenWithSecret(ApiTokenInfo):
    """Schema for API token with secret (only returned once on creation)."""

    token: str | None = Field(
        None, description="The actual bearer token (only shown once)"
    )


class ApiTokenRotate(BaseModel):
    """Schema for rotating an API token."""

    pass  # No additional fields needed; rotation is a POST action
