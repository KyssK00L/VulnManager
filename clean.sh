#!/bin/bash
# Script de nettoyage pour VulnManager
# Supprime tous les fichiers générés par le build/runtime

set -e

echo "🧹 Nettoyage de VulnManager..."
echo ""

# Backend Python
echo "🐍 Nettoyage backend Python..."
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
find backend -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
find backend -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
find backend -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
find backend -type f -name "*.pyc" -delete 2>/dev/null || true
find backend -type f -name "*.pyo" -delete 2>/dev/null || true
rm -rf backend/htmlcov 2>/dev/null || true
rm -f backend/.coverage* 2>/dev/null || true

# Frontend Node
echo "📦 Nettoyage frontend Node..."
rm -rf frontend/node_modules 2>/dev/null || true
rm -rf frontend/dist 2>/dev/null || true
rm -rf frontend/build 2>/dev/null || true
rm -rf frontend/.vite 2>/dev/null || true
rm -f frontend/npm-debug.log* 2>/dev/null || true
rm -f frontend/yarn-debug.log* 2>/dev/null || true
rm -f frontend/yarn-error.log* 2>/dev/null || true

# Logs
echo "📝 Nettoyage logs..."
rm -f *.log 2>/dev/null || true
rm -rf logs/ 2>/dev/null || true

# IDE files
echo "💻 Nettoyage fichiers IDE..."
find . -type f -name ".DS_Store" -delete 2>/dev/null || true
find . -type f -name "*.swp" -delete 2>/dev/null || true
find . -type f -name "*.swo" -delete 2>/dev/null || true
find . -type f -name "*~" -delete 2>/dev/null || true

# Docker volumes (optionnel)
if [ "$1" = "--docker" ]; then
    echo "🐳 Nettoyage volumes Docker..."
    docker-compose down -v 2>/dev/null || true
fi

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "💡 Conseil: Lancer 'git status' pour vérifier qu'il ne reste que du code source."
echo ""
echo "📌 Options:"
echo "   ./clean.sh          - Nettoie les fichiers locaux uniquement"
echo "   ./clean.sh --docker - Nettoie aussi les volumes Docker"
