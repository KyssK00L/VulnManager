"""Security utilities for password hashing and token generation."""

import hashlib
import secrets
from datetime import datetime, timedelta

from passlib.context import CryptContext

from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def generate_api_token() -> str:
    """
    Generate a secure random API token.

    Format: vm_<40 random hex chars> (total 43 chars)
    The prefix 'vm_' helps identify VulnManager tokens.
    """
    random_part = secrets.token_hex(20)  # 40 hex chars
    return f"vm_{random_part}"


def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256 for storage.

    We store only the hash, never the plain token.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_session_id() -> str:
    """Generate a secure random session ID."""
    return secrets.token_urlsafe(32)


def get_default_token_expiration() -> datetime:
    """Get default expiration datetime for new tokens."""
    return datetime.utcnow() + timedelta(days=settings.token_default_lifetime_days)
