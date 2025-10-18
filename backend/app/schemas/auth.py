"""Authentication schemas."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


class LoginRequest(BaseModel):
    """Login request schema."""

    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        import re

        # Username: 3-50 alphanumeric characters, dots, dashes, underscores
        username_pattern = r'^[a-zA-Z0-9._-]{3,50}$'
        if not re.match(username_pattern, v):
            raise ValueError("Username must be 3-50 characters (letters, numbers, dots, dashes, underscores)")
        return v.lower()


class UserInfo(BaseModel):
    """User information schema."""

    id: UUID
    username: str
    email: str | None
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema."""

    user: UserInfo
    message: str = "Login successful"
