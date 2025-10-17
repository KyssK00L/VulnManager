"""Utilities for managing signed user sessions."""

from __future__ import annotations

import base64
import hmac
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.session import Session
from app.models.user import User
from app.security import generate_session_id, hash_token


@dataclass(slots=True)
class SessionContext:
    """Result of validating a session cookie."""

    session: Session
    user: User


def _sign(token: str) -> str:
    signature = hmac.new(
        settings.secret_key.encode("utf-8"), token.encode("utf-8"), digestmod="sha256"
    ).digest()
    encoded = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{token}.{encoded}"


def _verify_signature(signed_token: str) -> str:
    try:
        token, encoded_sig = signed_token.rsplit(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc

    expected = _sign(token).rsplit(".", 1)[1]
    # Pad encoded signature for comparison
    padded = encoded_sig + "=" * ((4 - len(encoded_sig) % 4) % 4)
    expected_padded = expected + "=" * ((4 - len(expected) % 4) % 4)
    if not hmac.compare_digest(padded, expected_padded):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session signature")

    return token


async def create_session(
    db: AsyncSession,
    user: User,
    *,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[str, Session]:
    """Create a persistent session for the given user and return the signed token and model."""

    token = generate_session_id()
    token_hash = hash_token(token)
    lifetime = timedelta(hours=settings.session_lifetime_hours)
    session = Session(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + lifetime,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    await db.flush()
    return _sign(token), session


async def invalidate_session(db: AsyncSession, signed_token: str | None) -> Session | None:
    """Deactivate the session corresponding to the signed token and return it if found."""

    if not signed_token:
        return None

    try:
        token = _verify_signature(signed_token)
    except HTTPException:
        return None

    token_hash = hash_token(token)
    result = await db.execute(
        select(Session).where(Session.token_hash == token_hash, Session.is_active.is_(True))
    )
    session = result.scalar_one_or_none()
    if session:
        session.is_active = False
        await db.flush()
    return session


async def validate_session(
    db: AsyncSession,
    signed_token: str,
) -> SessionContext:
    """Validate a signed session token and return the associated session and user."""

    token = _verify_signature(signed_token)
    token_hash = hash_token(token)

    result = await db.execute(
        select(Session).where(Session.token_hash == token_hash, Session.is_active.is_(True))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        session.is_active = False
        await db.flush()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

    session.touch()
    await db.flush()

    return SessionContext(session=session, user=user)


def sign_session_token(raw_token: str) -> str:
    """Expose signing for testing purposes."""

    return _sign(raw_token)
