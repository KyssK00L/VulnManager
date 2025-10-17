"""Database configuration and session management."""

from collections.abc import AsyncGenerator
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

database_url = str(settings.database_url)

try:  # pragma: no cover - optional dependency check
    import asyncpg  # noqa: F401
except ModuleNotFoundError:  # pragma: no cover - exercised in environments without asyncpg
    engine_kwargs: dict[str, Any] = {"async_fallback": True}
    logger.warning(
        "asyncpg not installed; falling back to psycopg2 driver for database connections"
    )
else:
    engine_kwargs = {}
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    database_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    **engine_kwargs,
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
