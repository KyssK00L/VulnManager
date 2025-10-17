import pytest
from sqlalchemy import select

from app import security
from app.models.api_token import ApiToken
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, VulnerabilityLevel, VulnerabilityType


async def _create_user(session, *, role=UserRole.EDITOR, email='editor@example.com'):
    user = User(
        email=email,
        full_name='Editor User',
        password_hash=security.hash_password('secret123'),
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_search_returns_metadata(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = await _create_user(session)
        for index in range(3):
            vuln = Vulnerability(
                name=f'Vuln {index}',
                level=VulnerabilityLevel.HIGH,
                scope='Global',
                protocol_interface='HTTPS',
                cvss_score=7.5,
                cvss_vector='CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
                description='Description',
                risk='Risk',
                recommendation='Recommendation',
                vuln_type=VulnerabilityType.TECHNICAL,
                created_by=user.id,
                updated_by=user.id,
            )
            session.add(vuln)
        await session.commit()

    login_resp = await test_client.post(
        '/api/auth/login',
        json={'email': 'editor@example.com', 'password': 'secret123'},
    )
    assert login_resp.status_code == 200

    response = await test_client.get('/api/vulns')
    assert response.status_code == 200
    payload = response.json()
    assert payload['total'] == 3
    assert payload['page'] == 1
    assert payload['per_page'] == 50
    assert len(payload['items']) == 3


@pytest.mark.asyncio
async def test_import_xml_updates_and_creates(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = await _create_user(session)
        existing = Vulnerability(
            name='Legacy Vulnerability',
            level=VulnerabilityLevel.LOW,
            scope='Legacy scope',
            protocol_interface='SSH',
            cvss_score=3.1,
            cvss_vector='CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:L/A:N',
            description='Old description',
            risk='Low risk',
            recommendation='Old recommendation',
            vuln_type=VulnerabilityType.ORGANIZATIONAL,
            created_by=user.id,
            updated_by=user.id,
        )
        session.add(existing)
        await session.commit()
        await session.refresh(existing)

    await test_client.post(
        '/api/auth/login',
        json={'email': 'editor@example.com', 'password': 'secret123'},
    )

    xml_payload = f'''
    <vulnerabilities>
      <vulnerability>
        <Id>{existing.id}</Id>
        <Name>Legacy Vulnerability</Name>
        <Level>High</Level>
        <Scope>Updated scope</Scope>
        <Protocol-Interface>SSH</Protocol-Interface>
        <CVSS3.1_Score>6.2</CVSS3.1_Score>
        <CVSS3.1_VectorString>CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N</CVSS3.1_VectorString>
        <Description>New description</Description>
        <Risk>Elevated risk</Risk>
        <Recommendation>New recommendation</Recommendation>
        <Type>Organizational</Type>
      </vulnerability>
      <vulnerability>
        <Name>Fresh Vulnerability</Name>
        <Level>Medium</Level>
        <Scope>Datacenter</Scope>
        <Protocol-Interface>HTTPS</Protocol-Interface>
        <CVSS3.1_Score>5.0</CVSS3.1_Score>
        <CVSS3.1_VectorString>CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N</CVSS3.1_VectorString>
        <Description>Brand new</Description>
        <Risk>Medium risk</Risk>
        <Recommendation>Mitigate quickly</Recommendation>
        <Type>Technical</Type>
      </vulnerability>
    </vulnerabilities>
    '''.strip()

    response = await test_client.post(
        '/api/vulns/import/xml',
        files={'file': ('import.xml', xml_payload.encode('utf-8'), 'application/xml')},
    )
    assert response.status_code == 200
    summary = response.json()['summary']
    assert summary == {'created': 1, 'updated': 1, 'skipped': 0, 'total': 2}

    async with session_factory() as session:
        result = await session.execute(select(Vulnerability).where(Vulnerability.name == 'Legacy Vulnerability'))
        updated = result.scalar_one()
        assert updated.level == VulnerabilityLevel.HIGH
        assert updated.scope == 'Updated scope'

        result = await session.execute(select(Vulnerability).where(Vulnerability.name == 'Fresh Vulnerability'))
        created = result.scalar_one()
        assert created.vuln_type == VulnerabilityType.TECHNICAL


@pytest.mark.asyncio
async def test_import_xml_rolls_back_on_error(client):
    test_client, session_factory = client

    async with session_factory() as session:
        user = await _create_user(session)

    await test_client.post(
        '/api/auth/login',
        json={'email': 'editor@example.com', 'password': 'secret123'},
    )

    bad_xml = '''
    <vulnerabilities>
      <vulnerability>
        <Name>Invalid Vuln</Name>
        <Level>High</Level>
        <Scope>Scope</Scope>
        <Protocol-Interface>HTTP</Protocol-Interface>
        <CVSS3.1_Score>7.0</CVSS3.1_Score>
        <CVSS3.1_VectorString>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</CVSS3.1_VectorString>
        <Description>Desc</Description>
        <Risk>Risk</Risk>
        <Recommendation>Recommendation</Recommendation>
        <Type>Technical</Type>
      </vulnerability>
      <vulnerability>
        <Id>not-a-uuid</Id>
        <Name>Broken UUID</Name>
        <Level>Low</Level>
        <Scope>Scope</Scope>
        <Protocol-Interface>HTTP</Protocol-Interface>
        <CVSS3.1_Score>3.0</CVSS3.1_Score>
        <CVSS3.1_VectorString>CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:L/A:N</CVSS3.1_VectorString>
        <Description>Desc</Description>
        <Risk>Risk</Risk>
        <Recommendation>Recommendation</Recommendation>
        <Type>Technical</Type>
      </vulnerability>
    </vulnerabilities>
    '''.strip()

    response = await test_client.post(
        '/api/vulns/import/xml',
        files={'file': ('bad.xml', bad_xml.encode('utf-8'), 'application/xml')},
    )
    assert response.status_code == 400

    async with session_factory() as session:
        result = await session.execute(select(Vulnerability))
        assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_export_doc_xml_response(client):
    test_client, session_factory = client

    plain_token = 'vm_testtoken1234567890'

    async with session_factory() as session:
        user = await _create_user(session, role=UserRole.ADMIN, email='admin@example.com')
        vulnerability = Vulnerability(
            name='Doc Vuln',
            level=VulnerabilityLevel.MEDIUM,
            scope='Scope',
            protocol_interface='HTTPS',
            cvss_score=5.5,
            cvss_vector='CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N',
            description='Desc',
            risk='Risk',
            recommendation='Recommendation',
            vuln_type=VulnerabilityType.TECHNICAL,
            created_by=user.id,
            updated_by=user.id,
        )
        session.add(vulnerability)
        await session.commit()
        await session.refresh(vulnerability)

        token = ApiToken(
            owner_user_id=user.id,
            label='doc token',
        token_hash=security.hash_token(plain_token),
            scopes=['export:doc'],
        )
        session.add(token)
        await session.commit()
        await session.refresh(token)

    response = await test_client.get(
        f'/api/vulns/{vulnerability.id}/exportdoc',
        params={'format': 'xml'},
        headers={'Authorization': f'Bearer {plain_token}'},
    )

    assert response.status_code == 200
    assert response.headers['content-type'].startswith('application/xml')
    assert b'<vulnerability>' in response.content
