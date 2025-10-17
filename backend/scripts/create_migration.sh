#!/bin/bash
# Create a new Alembic migration

if [ -z "$1" ]; then
    echo "Usage: ./create_migration.sh <migration_message>"
    exit 1
fi

cd "$(dirname "$0")/.." || exit

alembic revision --autogenerate -m "$1"

echo "Migration created successfully!"
echo "Review the migration file in alembic/versions/"
echo "Then run: alembic upgrade head"
