"""Authentication routes."""

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_active_user, rate_limited
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.security import verify_password
from app.utils.audit import audit_log
from app.utils.session_manager import create_session, invalidate_session

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    request: Request,
    _: None = Depends(rate_limited("auth:login", window=60)),
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and create session.

    Sets an HttpOnly session cookie on successful login.
    """
    # Find user by username
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    signed_session, session = await create_session(
        db,
        user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    max_age = settings.session_lifetime_hours * 3600
    response.set_cookie(
        key="session_id",
        value=signed_session,
        httponly=True,
        samesite="lax",
        max_age=max_age,
        secure=settings.is_production,
        path="/",
    )

    audit_log(
        "auth.login",
        actor_id=str(user.id),
        request=request,
        extra={
            "session_id": str(session.id),
            "session_expires_at": session.expires_at.isoformat(),
        },
    )

    return LoginResponse(
        user=UserInfo.model_validate(user),
        message="Login successful",
    )


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    session_id: str | None = Cookie(default=None, alias="session_id"),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user by clearing session cookie.
    """
    session = await invalidate_session(db, session_id)
    response.delete_cookie(key="session_id", path="/")
    audit_log(
        "auth.logout",
        actor_id=str(session.user_id) if session else None,
        request=request,
        extra={"session_id": str(session.id)} if session else None,
    )
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user information."""
    return UserInfo.model_validate(current_user)
