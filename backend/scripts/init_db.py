"""Initialize database with default admin user."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal, engine
from app.models.user import User, UserRole
from app.security import hash_password


async def create_admin_user():
    """Create default admin user if not exists."""
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.email == "admin@vulnmanager.local")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("Admin user already exists")
            return

        # Create admin
        admin = User(
            email="admin@vulnmanager.local",
            full_name="Admin User",
            password_hash=hash_password("admin123"),  # Change this password!
            role=UserRole.ADMIN,
            is_active=True,
        )

        session.add(admin)
        await session.commit()

        print("✓ Admin user created:")
        print(f"  Email: admin@vulnmanager.local")
        print(f"  Password: admin123")
        print(f"  Role: {UserRole.ADMIN.value}")
        print("\n⚠️  IMPORTANT: Change the admin password after first login!")


async def main():
    """Main initialization function."""
    print("Initializing database...")

    # Create tables (only needed if not using Alembic)
    # For production, use Alembic migrations instead
    # from app.database import Base
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    # Create admin user
    await create_admin_user()

    await engine.dispose()
    print("\n✓ Database initialization complete")


if __name__ == "__main__":
    asyncio.run(main())
