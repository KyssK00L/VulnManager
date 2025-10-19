# VulnManager

**VulnManager** is a comprehensive vulnerability management web application with Microsoft Word integration. The application allows you to manage a vulnerability database (CRUD, search, filters, XML import/export) and automatically insert vulnerabilities into Word reports via a VBA macro.

## Key Features

### Backend (FastAPI + PostgreSQL)
- Complete REST API for vulnerability management
- Web authentication via login/password (HttpOnly session)
- API token system (PAT) for Word macro authentication
- XML import/export with tag order preservation
- Advanced search and filtering
- Change history tracking
- Token scope management and expiration

### Frontend (React + Vite)
- Mobile-first responsive interface (iOS, Android, Desktop)
- Design inspired by OpenWebUI with Tailwind CSS
- Real-time search and filters
- Token administration page (admin-only)
- XML import/export via the interface
- User and role management (viewer, editor, admin)
- **Integrated CVSS 3.1 calculator** with interactive interface

### Word Integration (VBA)
- VBA macro with interactive UserForm
- Local vulnerability cache (CustomXMLParts)
- API token authentication (no hardcoding)
- Preview before insertion
- Insertion of formatted vulnerability cards in reports
- Incremental synchronization

## Architecture

```
VulnManager/
├── backend/              # FastAPI API
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

## Installation and Deployment

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 20+ and Python 3.11+ for local development

### Deployment with Docker

1. **Clone the repository**

```bash
git clone <repository-url>
cd VulnManager
```

2. **Create the `.env` file**

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `SECRET_KEY`: Secret key for sessions (minimum 32 characters)
- `DATABASE_URL`: PostgreSQL database URL
- `CORS_ORIGINS`: Allowed origins for CORS

3. **Start the services**

```bash
docker-compose up -d
```

Services will be available at:
- **Backend API**: http://localhost:8000
- **Frontend Web**: http://localhost:5173
- **PostgreSQL**: localhost:5432

4. **Initialize the database**

```bash
# Create migrations
docker-compose exec api alembic upgrade head

# Create default admin user
docker-compose exec api python scripts/init_db.py
```

Default credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT**: Change the admin password after first login!

### Word Macro Configuration

1. Log in as admin at http://localhost:5173
2. Go to "API Tokens"
3. Create a new token with `read:vulns` and `export:doc` scopes
4. **Copy the token immediately** (it won't be visible again)
5. Open Microsoft Word
6. Import VBA files from `office/`:
   - `Settings.bas`
   - `Api.bas`
   - `Cache.bas`
   - `Insert.bas`
7. Run `ShowSettingsForm` (Alt+F8)
8. Enter the API URL: `http://localhost:8000`
9. Paste the API token
10. Click "Save"

The macro is now configured!

## Usage

### Web Interface

1. **Login**: Access http://localhost:5173 and log in
2. **Vulnerability Management**:
   - Search, filter, sort
   - Create, edit, delete (editor/admin roles)
   - Import/export XML
3. **CVSS Calculator**:
   - Calculate CVSS 3.1 scores by selecting metrics
   - Copy generated CVSS vector
   - Export results to JSON
   - Contextual help for each metric
4. **Token Management** (admin only):
   - Create tokens for Word macros
   - Revoke or rotate tokens
   - View usage history

### Word Macro

1. Open a Word document
2. Launch the VulnManager macro (Alt+F8 or ribbon button)
3. The macro automatically synchronizes the cache
4. Search and filter vulnerabilities
5. Select a vulnerability to preview it
6. Click "Insert" to insert it into the document

## Security

### Web Authentication
- HttpOnly sessions with SameSite=Lax
- Passwords hashed with bcrypt
- Roles and permissions (viewer, editor, admin)

### API Tokens
- Randomly generated tokens (format: `vm_<40 hex chars>`)
- Hash-only storage (SHA-256)
- Granular scopes (read:vulns, export:doc, write:vulns)
- Configurable expiration
- Revocation and rotation
- Usage logging (last_used_at, IP)

### Best Practices
- HTTPS mandatory in production
- Rate limiting on sensitive endpoints
- Restricted CORS
- Tokens never in URLs
- Markdown→HTML input sanitization

## Development

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Create a migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Run tests
pytest

# Linter
ruff check .
ruff format .
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
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

## XML Schema

Import/export format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<vulnerabilities>
  <vulnerability>
    <Name>Example vulnerability</Name>
    <Level>Critical|High|Medium|Low|Informational</Level>
    <Scope>Vulnerability scope</Scope>
    <Protocol-Interface>HTTP/HTTPS</Protocol-Interface>
    <CVSS3.1_Score>9.8</CVSS3.1_Score>
    <CVSS3.1_VectorString>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</CVSS3.1_VectorString>
    <Description>Vulnerability description</Description>
    <Risk>Risk analysis</Risk>
    <Recommendation>Remediation recommendations</Recommendation>
    <Type>Technical|Organizational|Physical</Type>
  </vulnerability>
</vulnerabilities>
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - User information

### Tokens (admin)
- `POST /api/tokens` - Create token
- `GET /api/tokens` - List tokens
- `GET /api/tokens/{id}` - Token details
- `DELETE /api/tokens/{id}` - Revoke token
- `DELETE /api/tokens/{id}/permanent` - Permanently delete revoked token
- `POST /api/tokens/{id}/rotate` - Rotate token
- `HEAD /api/tokens/validate` - Validate token

### Vulnerabilities
- `GET /api/vulns` - Search/filter
- `GET /api/vulns/{id}` - Details
- `POST /api/vulns` - Create (editor+)
- `PUT /api/vulns/{id}` - Update (editor+)
- `DELETE /api/vulns/{id}` - Delete (editor+)
- `GET /api/vulns/{id}/history` - History
- `POST /api/vulns/import/xml` - Import XML (editor+)
- `POST /api/vulns/export/xml` - Export XML

### Word Integration (token auth)
- `GET /api/vulns/bulk` - Cache for macro (scope: read:vulns)
- `GET /api/vulns/{id}/exportdoc` - Export for insertion (scope: export:doc)

### CVSS Calculator
- `POST /api/cvss/calculate` - Calculate score from CVSS vector
- `POST /api/cvss/build` - Build vector and calculate from metrics
- `GET /api/cvss/metrics` - Get CVSS 3.1 metric definitions

### Types
- `GET /api/types` - List all vulnerability types (built-in + custom)
- `GET /api/types/{type_name}` - Type details
- `POST /api/types` - Create custom type (editor+)
- `PUT /api/types/{type_name}` - Update type (editor+)
- `DELETE /api/types/{type_name}` - Delete custom type (editor+)

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Support

For bugs and feature requests, please open an issue on GitHub.

## Changelog

### v1.2.0 (2025-01-XX)
- Added permanent deletion of revoked tokens
- Fixed Escape key conflict between CVSS calculator and form
- Improved z-index for sidebar and modals
- Added `frontend/package-lock.json` to lock dependency versions

### v1.1.0 (2024-12-XX)
- Refactored infinite scroll and reorganized vulnerability types
- Added collapsible sidebar for desktop
- Improved mobile UI (header, buttons, alignment)
- Added compact theme toggle
- Complete database with 121 vulnerabilities
- Complete technical documentation for Office macros
- Improved API routing and duplicate detection
- Added custom Shield favicon
- Multi-type vulnerability filtering
- Close modals with Escape key
- Safari iOS support (crypto.randomUUID fallback)

### v1.0.0 (2024-01-XX)
- Initial release
- Complete REST API with FastAPI
- Responsive web interface (React + Vite + Tailwind CSS)
- Word integration via VBA
- API token system with scopes
- XML import/export
- Integrated CVSS 3.1 calculator
- HttpOnly session authentication
- User and role management (viewer, editor, admin)
- Vulnerability change history
