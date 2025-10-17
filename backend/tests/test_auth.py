import pytest
from sqlalchemy import select

from app import security
from app.config import settings
from app.dependencies import rate_limiter
from app.models.session import Session
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_login_creates_persistent_session(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = User(
            email='admin@example.com',
            full_name='Admin User',
            password_hash=security.hash_password('secret123'),
            role=UserRole.ADMIN,
        )
        session.add(user)
        await session.commit()

    response = await test_client.post(
        '/api/auth/login',
        json={'email': 'admin@example.com', 'password': 'secret123'},
    )

    assert response.status_code == 200
    session_cookie = response.cookies.get('session_id')
    assert session_cookie and session_cookie.count('.') == 1

    async with session_factory() as session:
        result = await session.execute(select(Session))
        sessions = result.scalars().all()
        assert len(sessions) == 1
        assert sessions[0].user_id == user.id
        assert sessions[0].is_active is True


@pytest.mark.asyncio
async def test_logout_marks_session_inactive(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = User(
            email='editor@example.com',
            full_name='Editor',
            password_hash=security.hash_password('secret123'),
            role=UserRole.EDITOR,
        )
        session.add(user)
        await session.commit()

    login_resp = await test_client.post(
        '/api/auth/login',
        json={'email': 'editor@example.com', 'password': 'secret123'},
    )
    assert login_resp.status_code == 200

    logout_resp = await test_client.post('/api/auth/logout')
    assert logout_resp.status_code == 200

    async with session_factory() as session:
        result = await session.execute(select(Session))
        persisted = result.scalar_one()
        assert persisted.is_active is False


@pytest.mark.asyncio
async def test_login_rate_limited(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = User(
            email='limited@example.com',
            full_name='Limited User',
            password_hash=security.hash_password('secret123'),
            role=UserRole.ADMIN,
        )
        session.add(user)
        await session.commit()

    original_limit = settings.rate_limit_per_minute
    settings.rate_limit_per_minute = 1
    rate_limiter.requests.clear()

    try:
        first = await test_client.post(
            '/api/auth/login',
            json={'email': 'limited@example.com', 'password': 'secret123'},
        )
        assert first.status_code == 200

        second = await test_client.post(
            '/api/auth/login',
            json={'email': 'limited@example.com', 'password': 'secret123'},
        )
        assert second.status_code == 429
        assert second.json()['detail'] == 'Too many requests. Please try again later.'
    finally:
        settings.rate_limit_per_minute = original_limit
        rate_limiter.requests.clear()


@pytest.mark.asyncio
async def test_login_emits_audit_log(client, caplog):
    test_client, session_factory = client

    async with session_factory() as session:
        user = User(
            email='audit@example.com',
            full_name='Audit User',
            password_hash=security.hash_password('secret123'),
            role=UserRole.ADMIN,
        )
        session.add(user)
        await session.commit()

    with caplog.at_level('INFO', logger='vulnmanager.audit'):
        response = await test_client.post(
            '/api/auth/login',
            json={'email': 'audit@example.com', 'password': 'secret123'},
        )

    assert response.status_code == 200
    assert any('"action": "auth.login"' in record.message for record in caplog.records)
