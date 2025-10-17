import pytest
from sqlalchemy import select

from app import security
from app.dependencies import rate_limiter
from app.models.api_token import ApiToken
from app.models.user import User, UserRole


async def _create_admin(session, email: str = 'admin@example.com') -> User:
    admin = User(
        email=email,
        full_name='Admin User',
        password_hash=security.hash_password('secret123'),
        role=UserRole.ADMIN,
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)
    return admin


@pytest.mark.asyncio
async def test_token_creation_rate_limited(client):
    test_client, session_factory = client

    async with session_factory() as session:
        await _create_admin(session)

    login = await test_client.post(
        '/api/auth/login',
        json={'email': 'admin@example.com', 'password': 'secret123'},
    )
    assert login.status_code == 200

    rate_limiter.requests.clear()

    for index in range(10):
        response = await test_client.post(
            '/api/tokens',
            json={'label': f'token {index}', 'scopes': ['export:doc']},
        )
        assert response.status_code == 201

    blocked = await test_client.post(
        '/api/tokens',
        json={'label': 'token blocked', 'scopes': ['export:doc']},
    )
    assert blocked.status_code == 429
    assert blocked.json()['detail'] == 'Too many requests. Please try again later.'


@pytest.mark.asyncio
async def test_token_creation_emits_audit_log(client, caplog):
    test_client, session_factory = client

    async with session_factory() as session:
        await _create_admin(session, email='auditor@example.com')

    login = await test_client.post(
        '/api/auth/login',
        json={'email': 'auditor@example.com', 'password': 'secret123'},
    )
    assert login.status_code == 200

    rate_limiter.requests.clear()

    with caplog.at_level('INFO', logger='vulnmanager.audit'):
        response = await test_client.post(
            '/api/tokens',
            json={'label': 'audited token', 'scopes': ['export:doc']},
        )

    assert response.status_code == 201
    assert any('"action": "token.create"' in record.message for record in caplog.records)

    async with session_factory() as session:
        result = await session.execute(select(ApiToken))
        token = result.scalar_one()
        assert token.label == 'audited token'
        assert token.scopes == ['export:doc']
