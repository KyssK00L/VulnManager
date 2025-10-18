"""Pydantic schemas for user management."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = Field(default=UserRole.VIEWER)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v.lower()


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    is_active: bool


class PasswordChange(BaseModel):
    """Schema for admin changing user password."""

    new_password: str = Field(..., min_length=8)


class PasswordChangeMe(BaseModel):
    """Schema for user changing their own password."""

    current_password: str
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    """Schema for user information in responses."""

    id: UUID
    username: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Schema for list of users."""

    users: list[UserResponse]
    total: int
