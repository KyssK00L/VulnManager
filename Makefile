# VulnManager Makefile
# Commandes utiles pour le développement et le déploiement

.PHONY: help
help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker commands
.PHONY: up
up: ## Démarrer tous les services
	docker-compose up -d

.PHONY: down
down: ## Arrêter tous les services
	docker-compose down

.PHONY: restart
restart: ## Redémarrer tous les services
	docker-compose restart

.PHONY: logs
logs: ## Voir les logs (use CTRL+C to exit)
	docker-compose logs -f

.PHONY: build
build: ## Rebuild les images Docker
	docker-compose build

.PHONY: clean
clean: ## Supprimer tous les conteneurs et volumes
	docker-compose down -v
	@echo "⚠️  Attention: Toutes les données ont été supprimées!"

.PHONY: clean-local
clean-local: ## Nettoyer fichiers générés localement (cache, node_modules, etc.)
	@./clean.sh

.PHONY: clean-all
clean-all: clean-local clean ## Nettoyage complet (local + Docker)

# Database commands
.PHONY: db-init
db-init: ## Initialiser la base de données
	docker-compose exec api alembic upgrade head
	docker-compose exec api python scripts/init_db.py

.PHONY: db-migrate
db-migrate: ## Créer une nouvelle migration (use MSG="description")
	docker-compose exec api alembic revision --autogenerate -m "$(MSG)"

.PHONY: db-upgrade
db-upgrade: ## Appliquer les migrations
	docker-compose exec api alembic upgrade head

.PHONY: db-downgrade
db-downgrade: ## Revenir à la migration précédente
	docker-compose exec api alembic downgrade -1

.PHONY: db-shell
db-shell: ## Ouvrir un shell PostgreSQL
	docker-compose exec db psql -U vulnmanager vulnmanager

# Development commands
.PHONY: dev-backend
dev-backend: ## Lancer le backend en mode dev (local)
	cd backend && uvicorn app.main:app --reload

.PHONY: dev-frontend
dev-frontend: ## Lancer le frontend en mode dev (local)
	cd frontend && npm run dev

.PHONY: test-backend
test-backend: ## Lancer les tests backend
	cd backend && pytest

.PHONY: test-frontend
test-frontend: ## Lancer les tests frontend
	cd frontend && npm test

.PHONY: lint-backend
lint-backend: ## Linter le backend
	cd backend && ruff check . && ruff format .

.PHONY: lint-frontend
lint-frontend: ## Linter le frontend
	cd frontend && npm run lint

# Quick start
.PHONY: quickstart
quickstart: ## Installation complète (⚡ Quick Start)
	@echo "🚀 VulnManager Quick Start"
	@echo "=========================="
	@echo ""
	@echo "1. Copie du fichier .env..."
	@test -f .env || cp .env.example .env
	@echo "✅ Fichier .env créé"
	@echo ""
	@echo "2. Démarrage des services..."
	@make up
	@echo "✅ Services démarrés"
	@echo ""
	@echo "3. Attente de PostgreSQL (10 secondes)..."
	@sleep 10
	@echo ""
	@echo "4. Initialisation de la base de données..."
	@make db-init
	@echo "✅ Base de données initialisée"
	@echo ""
	@echo "🎉 Installation terminée!"
	@echo ""
	@echo "📝 Credentials par défaut:"
	@echo "   Email: admin@vulnmanager.local"
	@echo "   Password: admin123"
	@echo ""
	@echo "🌐 URLs:"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:8000"
	@echo "   API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "⚠️  N'oubliez pas de changer le mot de passe admin!"

# Import sample data
.PHONY: import-samples
import-samples: ## Importer les vulnérabilités d'exemple
	@echo "📥 Import des vulnérabilités d'exemple..."
	@docker-compose exec -T api python -c "import requests; requests.post('http://localhost:8000/api/vulns/import/xml', files={'file': open('/app/../examples/sample_vulnerabilities.xml', 'rb')})"
	@echo "✅ Import terminé"

# Status
.PHONY: status
status: ## Afficher le statut des services
	@docker-compose ps
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:8000/health | python -m json.tool || echo "❌ API non accessible"

# Maintenance
.PHONY: backup-db
backup-db: ## Sauvegarder la base de données
	@mkdir -p backups
	@docker-compose exec -T db pg_dump -U vulnmanager vulnmanager > backups/vulnmanager_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup créé dans backups/"

.PHONY: restore-db
restore-db: ## Restaurer la base de données (use FILE=backup.sql)
	@docker-compose exec -T db psql -U vulnmanager vulnmanager < $(FILE)
	@echo "✅ Base de données restaurée"
