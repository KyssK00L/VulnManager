"""Authentication schemas."""

from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class UserInfo(BaseModel):
    """User information schema."""

    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema."""

    user: UserInfo
    message: str = "Login successful"
