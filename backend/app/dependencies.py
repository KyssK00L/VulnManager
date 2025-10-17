"""FastAPI dependencies for auth, permissions, and rate limiting."""

from datetime import datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.api_token import ApiToken
from app.models.user import User, UserRole
from app.security import hash_token


class RateLimiter:
    """Simple in-memory rate limiter (for production, use Redis)."""

    def __init__(self):
        self.requests: dict[str, list[datetime]] = {}

    def check_rate_limit(self, identifier: str, limit: int = 60, window: int = 60) -> bool:
        """
        Check if identifier has exceeded rate limit.

        Args:
            identifier: Unique identifier (IP, user ID, etc.)
            limit: Max requests per window
            window: Time window in seconds

        Returns:
            True if under limit, False if exceeded
        """
        now = datetime.utcnow()
        cutoff = now.timestamp() - window

        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [
                req for req in self.requests[identifier]
                if req.timestamp() > cutoff
            ]
        else:
            self.requests[identifier] = []

        # Check limit
        if len(self.requests[identifier]) >= limit:
            return False

        # Add new request
        self.requests[identifier].append(now)
        return True


rate_limiter = RateLimiter()


async def get_current_user_from_session(
    session_id: Annotated[str | None, Cookie(alias="session_id")] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get current user from session cookie.

    This is a simplified session implementation.
    In production, use a proper session store (Redis, database).
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # For this MVP, we'll use a simple session format: "user_id:timestamp:signature"
    # In production, use proper session management with Redis or similar
    try:
        parts = session_id.split(":")
        if len(parts) < 2:
            raise ValueError("Invalid session format")

        user_id = parts[0]

        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session or user inactive",
            )

        return user

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user_from_session),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Require admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def require_editor(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Require editor or admin role."""
    if current_user.role not in (UserRole.EDITOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor or admin privileges required",
        )
    return current_user


async def verify_api_token(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> tuple[ApiToken, str | None]:
    """
    Verify API token from Authorization header.

    Returns:
        Tuple of (ApiToken, ip_address)
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Parse Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # Hash token for lookup
    token_hash = hash_token(token)

    # Find token in database
    result = await db.execute(
        select(ApiToken).where(ApiToken.token_hash == token_hash)
    )
    api_token = result.scalar_one_or_none()

    if not api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if token is valid
    if not api_token.is_valid:
        if api_token.revoked_at:
            detail = "Token has been revoked"
        elif api_token.expires_at and api_token.expires_at < datetime.utcnow():
            detail = "Token has expired"
        else:
            detail = "Token is invalid"

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last used timestamp (fire and forget, don't await)
    api_token.last_used_at = datetime.utcnow()
    # In a real app, you'd also capture the IP address from the request

    return api_token, None


async def require_scope(
    required_scope: str,
) -> callable:
    """
    Create a dependency that requires a specific token scope.

    Usage:
        @app.get("/api/vulns/bulk")
        async def bulk(token: ApiToken = Depends(require_scope("read:vulns"))):
            ...
    """
    async def check_scope(
        token_info: tuple[ApiToken, str | None] = Depends(verify_api_token),
    ) -> ApiToken:
        api_token, _ = token_info

        if not api_token.has_scope(required_scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Token missing required scope: {required_scope}",
            )

        return api_token

    return check_scope
