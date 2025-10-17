# VulnManager

**VulnManager** est une application web complète de gestion de vulnérabilités avec intégration Microsoft Word. L'application permet de gérer une base de vulnérabilités (CRUD, recherche, filtres, import/export XML) et d'insérer automatiquement des vulnérabilités dans des rapports Word via une macro VBA.

## Caractéristiques principales

### Backend (FastAPI + PostgreSQL)
- API REST complète pour la gestion de vulnérabilités
- Authentification web par login/password (session HttpOnly)
- Système de tokens API (PAT) pour l'authentification des macros Word
- Import/export XML avec préservation de l'ordre des tags
- Recherche et filtrage avancés
- Historique des modifications
- Gestion des scopes et expiration des tokens

### Frontend (React + Vite)
- Interface responsive mobile-first (iOS, Android, Desktop)
- Design inspiré d'OpenWebUI avec Tailwind CSS
- Recherche et filtres en temps réel
- Page d'administration des tokens (admin-only)
- Import/export XML via l'interface
- Gestion des utilisateurs et des rôles (viewer, editor, admin)

### Intégration Word (VBA)
- Macro VBA avec UserForm interactive
- Cache local des vulnérabilités (CustomXMLParts)
- Authentification par token API (pas de hardcode)
- Prévisualisation avant insertion
- Insertion de cartouches formatées dans les rapports
- Synchronisation incrémentale

## Architecture

```
VulnManager/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routers/     # API routes
│   │   ├── utils/       # Utilities (XML parser, etc.)
│   │   ├── config.py    # Configuration
│   │   ├── database.py  # Database setup
│   │   ├── security.py  # Security utilities
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   └── main.py      # Main application
│   ├── alembic/         # Database migrations
│   ├── scripts/         # Utility scripts
│   └── tests/           # Tests
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Pages
│   │   ├── contexts/    # React contexts
│   │   ├── lib/         # API client
│   │   └── main.jsx     # Entry point
│   └── package.json
│
├── office/              # Word VBA macro
│   ├── Settings.bas     # Configuration
│   ├── Api.bas          # API communication
│   ├── Cache.bas        # Local cache
│   ├── Insert.bas       # Insertion logic
│   └── README.md        # Installation guide
│
└── docker-compose.yml   # Docker orchestration
```

## Installation et déploiement

### Prérequis

- Docker et Docker Compose
- (Optionnel) Node.js 20+ et Python 3.11+ pour développement local

### Déploiement avec Docker

1. **Cloner le repository**

```bash
git clone <repository-url>
cd VulnManager
```

2. **Créer le fichier `.env`**

```bash
cp .env.example .env
```

Éditer `.env` et configurer :
- `SECRET_KEY`: Clé secrète pour les sessions (minimum 32 caractères)
- `DATABASE_URL`: URL de la base de données PostgreSQL
- `CORS_ORIGINS`: Origines autorisées pour CORS

3. **Démarrer les services**

```bash
docker-compose up -d
```

Les services seront disponibles :
- **Backend API**: http://localhost:8000
- **Frontend Web**: http://localhost:5173
- **PostgreSQL**: localhost:5432

4. **Initialiser la base de données**

```bash
# Créer les migrations
docker-compose exec api alembic upgrade head

# Créer l'utilisateur admin par défaut
docker-compose exec api python scripts/init_db.py
```

Credentials par défaut :
- Email: `admin@vulnmanager.local`
- Password: `admin123`

**⚠️ IMPORTANT**: Changez le mot de passe admin après la première connexion !

### Configuration de la macro Word

1. Connectez-vous en tant qu'admin sur http://localhost:5173
2. Allez dans "API Tokens"
3. Créez un nouveau token avec les scopes `read:vulns` et `export:doc`
4. **Copiez le token immédiatement** (il ne sera plus visible)
5. Ouvrez Microsoft Word
6. Importez les fichiers VBA depuis `office/`:
   - `Settings.bas`
   - `Api.bas`
   - `Cache.bas`
   - `Insert.bas`
7. Lancez `ShowSettingsForm` (Alt+F8)
8. Entrez l'URL de l'API : `http://localhost:8000`
9. Collez le token API
10. Cliquez "Save"

La macro est maintenant configurée !

## Utilisation

### Interface web

1. **Connexion**: Accédez à http://localhost:5173 et connectez-vous
2. **Gestion des vulnérabilités**:
   - Rechercher, filtrer, trier
   - Créer, modifier, supprimer (rôles editor/admin)
   - Importer/exporter XML
3. **Gestion des tokens** (admin uniquement):
   - Créer des tokens pour les macros Word
   - Révoquer ou rotater les tokens
   - Voir l'historique d'utilisation

### Macro Word

1. Ouvrez un document Word
2. Lancez la macro VulnManager (Alt+F8 ou bouton du ruban)
3. La macro synchronise automatiquement le cache
4. Recherchez et filtrez les vulnérabilités
5. Sélectionnez une vulnérabilité pour la prévisualiser
6. Cliquez "Insert" pour l'insérer dans le document

## Sécurité

### Authentification web
- Sessions HttpOnly avec SameSite=Lax
- Mots de passe hashés avec bcrypt
- Rôles et permissions (viewer, editor, admin)

### Tokens API
- Tokens générés aléatoirement (format: `vm_<40 hex chars>`)
- Stockage des hash uniquement (SHA-256)
- Scopes granulaires (read:vulns, export:doc, write:vulns)
- Expiration configurable
- Révocation et rotation
- Journalisation d'utilisation (last_used_at, IP)

### Bonnes pratiques
- HTTPS obligatoire en production
- Rate limiting sur les endpoints sensibles
- CORS restreint
- Tokens jamais dans les URLs
- Sanitation des entrées Markdown→HTML

## Développement

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # ou `venv\Scripts\activate` sur Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur de développement
uvicorn app.main:app --reload

# Créer une migration
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head

# Lancer les tests
pytest

# Linter
ruff check .
ruff format .
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build

# Linter
npm run lint
```

## Tests

```bash
# Backend
cd backend
pytest --cov=app --cov-report=html

# Frontend
cd frontend
npm test
```

## Schéma XML

Format d'import/export :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<vulnerabilities>
  <vulnerability>
    <Name>Exemple de vulnérabilité</Name>
    <Level>Critical|High|Medium|Low|Informational</Level>
    <Scope>Périmètre de la vulnérabilité</Scope>
    <Protocol-Interface>HTTP/HTTPS</Protocol-Interface>
    <CVSS3.1_Score>9.8</CVSS3.1_Score>
    <CVSS3.1_VectorString>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</CVSS3.1_VectorString>
    <Description>Description de la vulnérabilité</Description>
    <Risk>Analyse du risque</Risk>
    <Recommendation>Recommandations de remediation</Recommendation>
    <Type>Technical|Organizational|Physical</Type>
  </vulnerability>
</vulnerabilities>
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Informations utilisateur

### Tokens (admin)
- `POST /api/tokens` - Créer un token
- `GET /api/tokens` - Lister les tokens
- `GET /api/tokens/{id}` - Détails d'un token
- `DELETE /api/tokens/{id}` - Révoquer un token
- `POST /api/tokens/{id}/rotate` - Rotater un token
- `HEAD /api/tokens/validate` - Valider un token

### Vulnérabilités
- `GET /api/vulns` - Rechercher/filtrer
- `GET /api/vulns/{id}` - Détails
- `POST /api/vulns` - Créer (editor+)
- `PUT /api/vulns/{id}` - Modifier (editor+)
- `DELETE /api/vulns/{id}` - Supprimer (editor+)
- `GET /api/vulns/{id}/history` - Historique
- `POST /api/vulns/import/xml` - Importer XML (editor+)
- `POST /api/vulns/export/xml` - Exporter XML

### Word Integration (token auth)
- `GET /api/vulns/bulk` - Cache pour macro (scope: read:vulns)
- `GET /api/vulns/{id}/exportdoc` - Export pour insertion (scope: export:doc)

## Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Support

Pour les bugs et feature requests, ouvrez une issue sur GitHub.

## Changelog

### v1.0.0 (2024-01-XX)
- Version initiale
- API REST complète
- Interface web responsive
- Intégration Word via VBA
- Système de tokens API
- Import/export XML