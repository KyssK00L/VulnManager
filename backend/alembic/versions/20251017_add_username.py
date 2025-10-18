"""Add username column to users table

Revision ID: 20251017_add_username
Revises: 20250212_add_sessions
Create Date: 2025-10-17 22:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251017_add_username'
down_revision = '20250212_add_sessions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add username column
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=True))

    # Populate username from email (take part before @)
    op.execute("UPDATE users SET username = SPLIT_PART(email, '@', 1)")

    # Make username NOT NULL and unique
    op.alter_column('users', 'username', nullable=False)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Make email nullable (optional now that we have username)
    op.alter_column('users', 'email', nullable=True)


def downgrade() -> None:
    # Remove username column and index
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'username')

    # Make email NOT NULL again
    op.alter_column('users', 'email', nullable=False)
