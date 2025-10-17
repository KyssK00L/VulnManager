"""Authentication routes."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.security import generate_session_id, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and create session.

    Sets an HttpOnly session cookie on successful login.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Create session (simplified - in production use proper session management)
    session_id = f"{user.id}:{datetime.now(timezone.utc).timestamp()}:{generate_session_id()}"

    # Set session cookie
    max_age = settings.session_lifetime_hours * 3600
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=max_age,
        secure=settings.is_production,  # HTTPS only in production
    )

    return LoginResponse(
        user=UserInfo.model_validate(user),
        message="Login successful",
    )


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing session cookie.
    """
    response.delete_cookie(key="session_id")
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user information."""
    return UserInfo.model_validate(current_user)
