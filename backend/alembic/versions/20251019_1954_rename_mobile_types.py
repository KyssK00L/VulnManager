"""rename_mobile_types

Revision ID: rename_mobile_types
Revises: 0a5cfbab3db9
Create Date: 2025-10-19 19:54:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'rename_mobile_types'
down_revision = '0a5cfbab3db9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Create new ENUM type with renamed mobile types
    op.execute("""
        CREATE TYPE vulnerabilitytype_new AS ENUM (
            'Network',
            'Active Directory',
            'LDAP',
            'DNS',
            'Mail Server',
            'VPN',
            'Firewall',
            'Windows',
            'Linux',
            'Unix',
            'macOS',
            'Web Application',
            'API',
            'Android APK',
            'iOS IPA',
            'Thick Client',
            'Database',
            'MS SQL Server',
            'MySQL/MariaDB',
            'PostgreSQL',
            'MongoDB',
            'Oracle',
            'AWS',
            'Azure',
            'GCP',
            'Cloud',
            'Authentication',
            'Authorization',
            'Cryptography',
            'Hardware',
            'Embedded System',
            'Firmware',
            'JTAG',
            'UART',
            'SPI',
            'I2C',
            'Bootloader',
            'Secure Boot',
            'Chip-Off Analysis',
            'Side-Channel Attack',
            'Fault Injection',
            'PCB Analysis',
            'Bluetooth Low Energy',
            'RFID/NFC',
            'USB/HID',
            'IoT',
            'SCADA/ICS',
            'Physical Security',
            'Social Engineering',
            'Wireless',
            'VoIP',
            'Container/Docker',
            'Kubernetes',
            'CI/CD',
            'Configuration',
            'Other'
        )
    """)

    # Step 2: Alter column to text temporarily
    op.execute("""
        ALTER TABLE vulnerabilities
        ALTER COLUMN type TYPE text
        USING type::text
    """)

    # Step 3: Update existing data - rename Android to Android APK and iOS to iOS IPA
    op.execute("""
        UPDATE vulnerabilities
        SET type = CASE
            WHEN type = 'Android' THEN 'Android APK'
            WHEN type = 'iOS' THEN 'iOS IPA'
            ELSE type
        END
    """)

    # Step 4: Alter column to use new ENUM type
    op.execute("""
        ALTER TABLE vulnerabilities
        ALTER COLUMN type TYPE vulnerabilitytype_new
        USING type::vulnerabilitytype_new
    """)

    # Step 5: Drop old ENUM type
    op.execute("DROP TYPE vulnerabilitytype")

    # Step 6: Rename new type to original name
    op.execute("ALTER TYPE vulnerabilitytype_new RENAME TO vulnerabilitytype")


def downgrade() -> None:
    # Step 1: Create old ENUM type (with old names)
    op.execute("""
        CREATE TYPE vulnerabilitytype_old AS ENUM (
            'Network',
            'Active Directory',
            'LDAP',
            'DNS',
            'Mail Server',
            'VPN',
            'Firewall',
            'Windows',
            'Linux',
            'Unix',
            'macOS',
            'Web Application',
            'API',
            'Android',
            'iOS',
            'Thick Client',
            'Database',
            'MS SQL Server',
            'MySQL/MariaDB',
            'PostgreSQL',
            'MongoDB',
            'Oracle',
            'AWS',
            'Azure',
            'GCP',
            'Cloud',
            'Authentication',
            'Authorization',
            'Cryptography',
            'Hardware',
            'Embedded System',
            'Firmware',
            'JTAG',
            'UART',
            'SPI',
            'I2C',
            'Bootloader',
            'Secure Boot',
            'Chip-Off Analysis',
            'Side-Channel Attack',
            'Fault Injection',
            'PCB Analysis',
            'Bluetooth Low Energy',
            'RFID/NFC',
            'USB/HID',
            'IoT',
            'SCADA/ICS',
            'Physical Security',
            'Social Engineering',
            'Wireless',
            'VoIP',
            'Container/Docker',
            'Kubernetes',
            'CI/CD',
            'Configuration',
            'Other'
        )
    """)

    # Step 2: Alter column to text
    op.execute("""
        ALTER TABLE vulnerabilities
        ALTER COLUMN type TYPE text
        USING type::text
    """)

    # Step 3: Update data - revert Android APK to Android and iOS IPA to iOS
    op.execute("""
        UPDATE vulnerabilities
        SET type = CASE
            WHEN type = 'Android APK' THEN 'Android'
            WHEN type = 'iOS IPA' THEN 'iOS'
            ELSE type
        END
    """)

    # Step 4: Alter column back
    op.execute("""
        ALTER TABLE vulnerabilities
        ALTER COLUMN type TYPE vulnerabilitytype_old
        USING type::vulnerabilitytype_old
    """)

    # Step 5: Drop new type
    op.execute("DROP TYPE vulnerabilitytype")

    # Step 6: Rename old type back
    op.execute("ALTER TYPE vulnerabilitytype_old RENAME TO vulnerabilitytype")
