# Vérification des dépendances - VulnManager

## ✅ Backend (Python)

Toutes les dépendances sont correctement déclarées dans `backend/requirements.txt` :

### Production
- ✅ `fastapi==0.109.0` - Framework web
- ✅ `uvicorn[standard]==0.27.0` - Serveur ASGI
- ✅ `python-multipart==0.0.6` - Upload de fichiers
- ✅ `sqlalchemy==2.0.25` - ORM
- ✅ `alembic==1.13.1` - Migrations DB
- ✅ `psycopg2-binary==2.9.9` - Driver PostgreSQL (sync)
- ✅ `asyncpg==0.29.0` - Driver PostgreSQL (async) **[AJOUTÉ]**
- ✅ `pydantic==2.5.3` - Validation
- ✅ `pydantic-settings==2.1.0` - Configuration
- ✅ `email-validator==2.1.0` - Validation emails
- ✅ `passlib[bcrypt]==1.7.4` - Hash passwords
- ✅ `python-jose[cryptography]==3.3.0` - JWT (non utilisé actuellement)
- ✅ `itsdangerous==2.1.2` - Signatures sécurisées
- ✅ `lxml==5.1.0` - Parser XML
- ✅ `python-dateutil==2.8.2` - Manipulation dates

### Développement & Tests
- ✅ `pytest==7.4.4` - Framework de tests
- ✅ `pytest-asyncio==0.23.3` - Tests async
- ✅ `pytest-cov==4.1.0` - Coverage
- ✅ `httpx==0.26.0` - Client HTTP pour tests
- ✅ `ruff==0.1.14` - Linter/formatter

## ✅ Frontend (Node.js)

Toutes les dépendances sont correctement déclarées dans `frontend/package.json` :

### Production
- ✅ `react@^18.2.0` - Framework UI
- ✅ `react-dom@^18.2.0` - React DOM renderer
- ✅ `react-router-dom@^6.21.3` - Routing
- ✅ `@tanstack/react-query@^5.17.19` - State management
- ✅ `@tanstack/react-query-devtools@^5.17.19` - DevTools
- ✅ `axios@^1.6.5` - Client HTTP
- ✅ `react-markdown@^9.0.1` - Markdown renderer (non utilisé actuellement)
- ✅ `react-hook-form@^7.49.3` - Gestion formulaires (non utilisé actuellement)
- ✅ `date-fns@^3.2.0` - Manipulation dates
- ✅ `clsx@^2.1.0` - Utilitaire classes CSS (non utilisé actuellement)
- ✅ `lucide-react@^0.312.0` - Icônes

### Développement
- ✅ `@types/react@^18.2.48` - Types TypeScript
- ✅ `@types/react-dom@^18.2.18` - Types TypeScript
- ✅ `@vitejs/plugin-react@^4.2.1` - Plugin Vite
- ✅ `vite@^5.0.11` - Build tool
- ✅ `eslint@^8.56.0` - Linter
- ✅ `eslint-plugin-react@^7.33.2` - ESLint React
- ✅ `eslint-plugin-react-hooks@^4.6.0` - ESLint Hooks
- ✅ `eslint-plugin-react-refresh@^0.4.5` - ESLint HMR
- ✅ `prettier@^3.2.4` - Formatter
- ✅ `tailwindcss@^3.4.1` - Framework CSS
- ✅ `autoprefixer@^10.4.17` - PostCSS plugin
- ✅ `postcss@^8.4.33` - CSS processor

## 📝 Notes

### Dépendances non utilisées (à nettoyer si souhaité)
- `react-markdown` - Prévu pour afficher des descriptions Markdown
- `react-hook-form` - Prévu pour les formulaires complexes
- `clsx` - Prévu pour les classes CSS conditionnelles
- `python-jose` - Prévu pour JWT (actuellement on utilise sessions)

### Corrections apportées
1. ✅ **asyncpg** ajouté - Requis pour SQLAlchemy async avec PostgreSQL
2. ✅ **npm ci → npm install** - Pas de package-lock.json tracké dans Git

## 🧪 Vérification

Pour vérifier les dépendances :

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# OU via Docker (recommandé)
make build
```

## ⚠️ Avertissement version Docker Compose

Le fichier `docker-compose.yml` contient `version: '3.8'` qui est obsolète.
Cette directive sera ignorée par les versions récentes de Docker Compose.

**Peut être supprimée sans impact** (les versions de Docker Compose modernes ne l'utilisent plus).

## ✅ Statut final

**Toutes les dépendances sont correctement déclarées et installables.**

Le projet peut maintenant être démarré avec `make quickstart` sans erreur de dépendances manquantes.
