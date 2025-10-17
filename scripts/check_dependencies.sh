#!/bin/bash
# Script to check if all Python dependencies are correctly declared

set -e

echo "🔍 Vérification des dépendances Python..."
echo ""

cd backend

# Liste des imports externes utilisés dans le code
USED_PACKAGES=(
    "fastapi"
    "uvicorn"
    "sqlalchemy"
    "alembic"
    "psycopg2"
    "asyncpg"
    "pydantic"
    "pydantic_settings"
    "email_validator"
    "passlib"
    "python_jose"
    "itsdangerous"
    "lxml"
    "python_dateutil"
    "pytest"
    "pytest_asyncio"
    "pytest_cov"
    "httpx"
    "ruff"
)

MISSING=()

echo "Packages utilisés dans le code:"
for pkg in "${USED_PACKAGES[@]}"; do
    if grep -q "$pkg" requirements.txt 2>/dev/null; then
        echo "  ✅ $pkg"
    else
        echo "  ❌ $pkg (MANQUANT)"
        MISSING+=("$pkg")
    fi
done

echo ""

if [ ${#MISSING[@]} -eq 0 ]; then
    echo "✅ Toutes les dépendances sont déclarées!"
    exit 0
else
    echo "⚠️  Dépendances manquantes détectées: ${MISSING[*]}"
    exit 1
fi
