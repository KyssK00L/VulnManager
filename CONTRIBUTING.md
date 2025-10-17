# Guide de contribution - VulnManager

## Gestion des fichiers générés

Ce projet est configuré pour que **seul le code source** soit tracké par Git. Les fichiers générés par les builds, caches, et dépendances restent dans les conteneurs Docker.

### Configuration

#### 1. `.gitignore`
Ignore tous les fichiers générés :
- Python : `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`
- Node : `node_modules/`, `dist/`, `.vite/`
- Logs, backups, IDE files

#### 2. `docker-compose.yml`
Les volumes nommés isolent les fichiers générés :
- `api_cache`, `api_mypy`, `api_ruff` : Caches Python
- `api_pycache`, `api_alembic_cache` : __pycache__
- `/app/node_modules` : Dépendances Node (volume anonyme)

#### 3. `.dockerignore`
Empêche la copie de fichiers inutiles dans les images Docker.

### Vérification

Après avoir lancé `docker-compose up`, vérifiez que Git ne détecte que le code source :

```bash
git status
```

Vous devriez voir **uniquement** vos modifications de code, pas de :
- ❌ `__pycache__/`
- ❌ `node_modules/`
- ❌ `.pytest_cache/`
- ❌ `dist/`
- ❌ etc.

### Nettoyage

Si des fichiers générés apparaissent dans votre workspace :

```bash
# Nettoyer les fichiers locaux
make clean-local

# ou directement
./clean.sh

# Nettoyer aussi Docker
./clean.sh --docker
```

### Workflow de développement

1. **Démarrage**
   ```bash
   make quickstart
   ```

2. **Développement**
   - Modifiez le code dans `backend/` ou `frontend/`
   - Les changements sont auto-rechargés (hot-reload)
   - Les fichiers générés restent dans les conteneurs

3. **Avant un commit**
   ```bash
   # Vérifier qu'il n'y a que du code source
   git status

   # Nettoyer si nécessaire
   make clean-local

   # Commit
   git add .
   git commit -m "Description"
   ```

4. **Si vous avez des fichiers indésirables**
   ```bash
   # Lister les fichiers non-trackés
   git clean -n

   # Supprimer les fichiers non-trackés (attention!)
   git clean -fd
   ```

### Structure des volumes Docker

```yaml
volumes:
  # Données persistantes
  postgres_data:          # Base de données PostgreSQL

  # Caches Python (temporaires, non-trackés)
  api_cache:              # .pytest_cache
  api_mypy:               # .mypy_cache
  api_ruff:               # .ruff_cache
  api_pycache:            # app/__pycache__
  api_alembic_cache:      # alembic/__pycache__
```

Les volumes nommés sont gérés par Docker et n'apparaissent jamais dans votre workspace local.

### Bonnes pratiques

#### ✅ À FAIRE
- Modifier le code dans `backend/` et `frontend/`
- Commiter uniquement les fichiers source (`.py`, `.jsx`, `.css`, etc.)
- Utiliser `make clean-local` régulièrement
- Vérifier `git status` avant chaque commit

#### ❌ À ÉVITER
- Ne pas installer les dépendances Python/Node localement (utilisez Docker)
- Ne pas commiter `__pycache__/`, `node_modules/`, etc.
- Ne pas modifier manuellement les volumes Docker
- Ne pas stocker de credentials dans le code

### Dépannage

**Problème** : Des fichiers `__pycache__/` apparaissent dans Git

**Solution** :
```bash
# 1. Nettoyer
make clean-local

# 2. Si déjà commités par erreur
git rm -r --cached backend/**/__pycache__
git commit -m "Remove cached files"

# 3. Relancer les services
make restart
```

**Problème** : `node_modules/` apparaît localement

**Solution** :
```bash
# 1. Supprimer
rm -rf frontend/node_modules

# 2. Reconstruire le conteneur
docker-compose build web
docker-compose up -d web
```

**Problème** : Permissions root sur les fichiers générés

**Solution** :
```bash
# Nettoyer avec sudo si nécessaire
sudo ./clean.sh

# Puis relancer sans sudo
make restart
```

### Tests en CI/CD

Le `.gitignore` et `.dockerignore` garantissent que :
- Les builds CI/CD partent d'un état propre
- Pas de conflits avec des caches locaux
- Images Docker optimales (taille minimale)

### Questions ?

- Voir `README.md` pour la documentation complète
- Voir `QUICKSTART.md` pour démarrer rapidement
- Ouvrir une issue sur GitHub pour les bugs
