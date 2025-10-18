# VulnManager - Quick Start Guide

Ce guide vous permet de démarrer rapidement avec VulnManager.

## Installation en 5 minutes

### 1. Prérequis
- Docker et Docker Compose installés
- Git

### 2. Cloner et configurer

```bash
git clone <repository-url>
cd VulnManager
cp .env.example .env
```

### 3. Démarrer l'application

```bash
docker-compose up -d
```

### 4. Initialiser la base de données

```bash
docker-compose exec api alembic upgrade head
docker-compose exec api python scripts/init_db.py
```

### 5. Accéder à l'application

Ouvrez votre navigateur et allez sur : http://localhost:5173

Credentials par défaut :
- **Username**: `admin`
- **Password**: `admin123`

## Premiers pas

### 1. Créer un token pour Word

1. Connectez-vous à l'interface web
2. Cliquez sur "API Tokens" dans le menu
3. Cliquez "Create Token"
4. Remplissez :
   - Label: "Mon token Word"
   - Scopes: Cochez `read:vulns` et `export:doc`
   - Expires in: 90 jours
5. Cliquez "Create Token"
6. **IMPORTANT**: Copiez le token immédiatement !

### 2. Importer des vulnérabilités

Option A - Via l'interface web :
1. Cliquez sur "Import" dans le dashboard
2. Sélectionnez le fichier `examples/sample_vulnerabilities.xml`
3. Attendez la confirmation

Option B - Via curl :
```bash
curl -X POST http://localhost:8000/api/vulns/import/xml \
  -H "Cookie: session_id=YOUR_SESSION" \
  -F "file=@examples/sample_vulnerabilities.xml"
```

### 3. Configurer la macro Word

1. Ouvrez Microsoft Word
2. Appuyez sur Alt+F11 pour ouvrir l'éditeur VBA
3. Allez dans File > Import File
4. Importez les fichiers depuis `office/` :
   - Settings.bas
   - Api.bas
   - Cache.bas
   - Insert.bas
5. Fermez l'éditeur VBA
6. Dans Word, appuyez sur Alt+F8
7. Sélectionnez `ShowSettingsForm` et cliquez "Run"
8. Entrez :
   - API Base URL: `http://localhost:8000`
   - API Token: (collez le token copié à l'étape 1)
9. Cliquez OK

### 4. Utiliser la macro

1. Dans Word, appuyez sur Alt+F8
2. Sélectionnez `SyncCache` et cliquez "Run"
3. Les vulnérabilités sont maintenant disponibles !

## Commandes utiles

### Docker

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer les services
docker-compose restart

# Arrêter les services
docker-compose down

# Supprimer tout (données incluses)
docker-compose down -v
```

### Base de données

```bash
# Créer une nouvelle migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Appliquer les migrations
docker-compose exec api alembic upgrade head

# Revenir en arrière
docker-compose exec api alembic downgrade -1
```

### Développement

```bash
# Lancer le backend en mode dev (sans Docker)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Lancer le frontend en mode dev (sans Docker)
cd frontend
npm install
npm run dev
```

## Vérification

### Test de l'API

```bash
# Santé de l'API
curl http://localhost:8000/health

# Liste des vulnérabilités (avec authentification)
curl http://localhost:8000/api/vulns \
  -H "Cookie: session_id=YOUR_SESSION"

# Avec un token API
curl http://localhost:8000/api/vulns/bulk \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test du frontend

1. Ouvrez http://localhost:5173
2. Connectez-vous
3. Vérifiez que les vulnérabilités s'affichent
4. Testez la recherche et les filtres

## Problèmes courants

### Le backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs api

# Vérifier que PostgreSQL est prêt
docker-compose exec db pg_isready -U vulnmanager
```

### Le frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_URL` dans `.env` pointe vers `http://localhost:8000`
- Vérifiez les CORS dans `backend/.env`

### La macro Word ne se connecte pas
- Vérifiez que l'URL de l'API est correcte (avec http://)
- Vérifiez que le token n'est pas expiré ou révoqué
- Testez le token avec curl :
```bash
curl -I http://localhost:8000/api/tokens/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Prochaines étapes

1. **Sécurité** : Changez le mot de passe admin par défaut
2. **Utilisateurs** : Créez d'autres utilisateurs avec différents rôles
3. **Personnalisation** : Adaptez les styles de la macro Word à vos besoins
4. **Production** : Configurez HTTPS et des secrets forts

## Support

- Documentation complète : voir `README.md`
- Issues GitHub : ouvrez un ticket pour les bugs
- Exemples : dossier `examples/`

Bon usage de VulnManager ! 🛡️
