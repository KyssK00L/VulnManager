import asyncio
import os
import sys
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

os.environ.setdefault('DATABASE_URL', 'postgresql://user:pass@localhost:5432/testdb')
os.environ.setdefault('SECRET_KEY', 'test-secret-key')

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app import security as security_module  # noqa: E402
from app.dependencies import rate_limiter  # noqa: E402
from app.models.api_token import ApiToken  # noqa: E402
from app.models.session import Session  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.vulnerability import Vulnerability, VulnerabilityHistory  # noqa: E402
from app.routers import auth as auth_router  # noqa: E402


@pytest.fixture(scope='session')
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@compiles(PGUUID, 'sqlite')
def compile_uuid(_element, _compiler, **_kw):
    return 'CHAR(36)'


@compiles(ARRAY, 'sqlite')
def compile_array(_element, _compiler, **_kw):
    return 'TEXT'


@pytest.fixture
async def client():
    engine = create_async_engine('sqlite+aiosqlite:///:memory:', future=True)
    async with engine.begin() as conn:
        tables = [
            User.__table__,
            Session.__table__,
            ApiToken.__table__,
            Vulnerability.__table__,
            VulnerabilityHistory.__table__,
        ]
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, tables=tables))

    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    rate_limiter.requests.clear()

    original_hash_password = security_module.hash_password
    original_verify_password = security_module.verify_password
    original_auth_verify = auth_router.verify_password

    def fake_hash_password(password: str) -> str:
        return f'hashed:{password}'

    def fake_verify_password(plain: str, hashed: str) -> bool:
        return hashed == fake_hash_password(plain)

    security_module.hash_password = fake_hash_password
    security_module.verify_password = fake_verify_password
    auth_router.verify_password = fake_verify_password

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url='http://testserver') as test_client:
        yield test_client, session_factory

    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()

    security_module.hash_password = original_hash_password
    security_module.verify_password = original_verify_password
    auth_router.verify_password = original_auth_verify
