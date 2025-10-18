# VulnManager Word Macro - Documentation Développeur

> **Audience** : Développeurs VBA intégrant les macros VulnManager dans un template Word de rapport de pentest.

Cette documentation technique explique comment installer, configurer et personnaliser les macros Word qui permettent d'insérer des vulnérabilités depuis l'API VulnManager directement dans un document Word.

---

## Table des matières

1. [Architecture](#architecture)
2. [Fichiers fournis](#fichiers-fournis)
3. [Dépendances externes](#dépendances-externes)
4. [Installation complète](#installation-complète)
5. [Création du UserForm](#création-du-userform)
6. [Configuration du ruban Word](#configuration-du-ruban-word)
7. [Flux de données](#flux-de-données)
8. [Référence API](#référence-api)
9. [Personnalisation](#personnalisation)
10. [Débogage](#débogage)
11. [Sécurité](#sécurité)

---

## Architecture

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                VulnManager API                      │
│  FastAPI Backend + PostgreSQL                       │
│  - Authentication: Bearer Token (API Token)         │
│  - Endpoints: /api/vulns/bulk, /exportdoc, etc.     │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS (JSON)
                 │
┌────────────────▼────────────────────────────────────┐
│            Microsoft Word + VBA Macros              │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Settings.bas│  │   Api.bas    │  │Cache.bas  │ │
│  │ - Config    │  │ - HTTP calls │  │ - Local   │ │
│  │ - Token     │  │ - Auth       │  │   storage │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐                │
│  │ Insert.bas  │  │ VulnForm.frm │                │
│  │ - Format    │  │ - UI Search  │                │
│  │ - Cartouche │  │ - Selection  │                │
│  └─────────────┘  └──────────────┘                │
│                                                     │
│  Storage:                                           │
│  - Document.Variables (API URL + Token)            │
│  - CustomXMLParts (Cache JSON)                     │
└─────────────────────────────────────────────────────┘
```

### Principe de fonctionnement

1. **Configuration initiale** : L'utilisateur configure l'URL API et le token via `Settings.bas`
2. **Synchronisation** : `Cache.bas` télécharge toutes les vulnérabilités via `/api/vulns/bulk` et les stocke localement
3. **Recherche** : `VulnForm.frm` (UserForm) permet de rechercher dans le cache local
4. **Insertion** : `Insert.bas` récupère les détails via `/api/vulns/{id}/exportdoc` et insère une cartouche formatée

---

## Fichiers fournis

Ce dépôt contient les modules VBA suivants :

| Fichier | Type | Description | Lignes |
|---------|------|-------------|--------|
| `Settings.bas` | Module standard | Gestion de la configuration (URL API, Token) | 72 |
| `Api.bas` | Module standard | Communication HTTP avec l'API (GET requests, Bearer auth) | 105 |
| `Cache.bas` | Module standard | Cache local avec CustomXMLParts, sync incrémentale | 194 |
| `Insert.bas` | Module standard | Insertion de cartouches formatées dans le document | 166 |

**Total** : ~537 lignes de code VBA

---

## Dépendances externes

### ⚠️ Dépendances manquantes (à ajouter)

Les fichiers suivants sont **requis** mais **non inclus** dans ce dépôt :

#### 1. VBA-JSON (Parser JSON)

**Pourquoi** : VBA ne dispose pas de parser JSON natif. `Insert.bas` ligne 23 appelle `ParseJson(jsonData)`.

**Source** : https://github.com/VBA-tools/VBA-JSON

**Installation** :
```bash
# Télécharger
wget https://raw.githubusercontent.com/VBA-tools/VBA-JSON/master/JsonConverter.bas

# Renommer
mv JsonConverter.bas VBA-JSON.bas
```

**Dans VBA Editor** :
1. File → Import File
2. Sélectionner `VBA-JSON.bas`
3. Le module `JsonConverter` est ajouté au projet

**Utilisation dans le code** :
```vba
' Insert.bas ligne 23
Set vuln = JsonConverter.ParseJson(jsonData)

' Accès aux propriétés
Debug.Print vuln("name")        ' Nom de la vulnérabilité
Debug.Print vuln("level")       ' Critical/High/Medium/Low
Debug.Print vuln("cvss_score")  ' Float
```

#### 2. VulnForm.frm (UserForm principal)

**Pourquoi** : Interface graphique pour rechercher et sélectionner les vulnérabilités.

**Statut** : ⚠️ **À créer** (voir section [Création du UserForm](#création-du-userform))

---

## Installation complète

### Prérequis

- Microsoft Word 2016 ou supérieur (Windows/macOS)
- Accès aux paramètres de sécurité des macros
- Connexion à une instance VulnManager API

### Étape 1 : Activer l'onglet Développeur

1. **Fichier** → **Options** → **Personnaliser le ruban**
2. Cocher **☑ Développeur** dans la colonne de droite
3. **OK**

### Étape 2 : Créer un nouveau template

1. **Fichier** → **Nouveau** → **Document vierge**
2. Construire la structure du rapport (logos, en-têtes, sections, etc.)
3. **Fichier** → **Enregistrer sous**
4. Format : **Modèle Word prenant en charge les macros (*.dotm)**
5. Nom : `Rapport_Pentest_VulnManager.dotm`

### Étape 3 : Ouvrir VBA Editor

1. Cliquer sur **Développeur** → **Visual Basic**
2. Ou raccourci : **Alt+F11** (Windows) / **Option+F11** (macOS)

### Étape 4 : Importer les modules fournis

Dans VBA Editor :

1. Clic droit sur **VBAProject (Rapport_Pentest_VulnManager.dotm)**
2. **Importer un fichier...**
3. Naviguer vers le dossier `Office/` du projet VulnManager
4. Importer **dans cet ordre** :
   - `Settings.bas`
   - `Api.bas`
   - `Cache.bas`
   - `Insert.bas`

Résultat dans l'explorateur de projet :
```
VBAProject (Rapport_Pentest_VulnManager.dotm)
├── Microsoft Word Objects
│   └── ThisDocument
└── Modules
    ├── Settings
    ├── Api
    ├── Cache
    └── Insert
```

### Étape 5 : Ajouter VBA-JSON

1. Télécharger `JsonConverter.bas` depuis https://github.com/VBA-tools/VBA-JSON
2. **Importer un fichier...** → Sélectionner `JsonConverter.bas`
3. Le module `JsonConverter` apparaît dans **Modules**

### Étape 6 : Créer le UserForm

Voir section détaillée : [Création du UserForm](#création-du-userform)

### Étape 7 : Tester l'installation

1. Dans VBA Editor, placer un point d'arrêt dans `Settings.ShowSettingsForm` (ligne 51)
2. Appuyer sur **F5** (Exécuter)
3. Vérifier que les InputBox s'affichent
4. Entrer une URL de test et un faux token
5. Vérifier dans l'Inspecteur de variables que les données sont sauvegardées

### Étape 8 : Configurer la sécurité des macros

1. **Fichier** → **Options** → **Centre de gestion de la confidentialité**
2. **Paramètres du Centre de gestion de la confidentialité...**
3. **Paramètres des macros**
4. Sélectionner : **☑ Désactiver toutes les macros avec notification**
5. Cocher : **☑ Faire confiance à l'accès au modèle d'objet du projet VBA**

---

## Création du UserForm

Le UserForm `VulnForm.frm` n'est pas inclus dans ce dépôt. Voici comment le créer.

### Architecture du UserForm

```
┌────────────────────────────────────────────────────┐
│  VulnManager - Insert Vulnerability           [X]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Search: [________________________] [🔍 Search]    │
│                                                    │
│  Type: [All Types          ▼]  Level: [All    ▼]  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Name                     │ Level │ CVSS      │ │
│  ├──────────────────────────┼───────┼───────────┤ │
│  │ Injection SQL            │ High  │ 6.5       │ │
│  │ XSS Réfléchi             │ High  │ 7.1       │ │
│  │ CSRF                     │ Medium│ 5.4       │ │
│  │ ...                      │ ...   │ ...       │ │
│  └──────────────────────────────────────────────┘ │
│                                           [↑] [↓]  │
│                                                    │
│  Preview:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ Name: Injection SQL                           │ │
│  │ Level: High                                   │ │
│  │ Scope: Application web - Module auth          │ │
│  │ CVSS: 6.5 (CVSS:3.1/AV:N/AC:L/PR:L/...)      │ │
│  │                                               │ │
│  │ Description: [300 premiers caractères...]     │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│        [Insert]  [Refresh Cache]  [Close]         │
└────────────────────────────────────────────────────┘
```

### Étapes de création

#### 1. Créer le UserForm

1. Dans VBA Editor : **Insertion** → **UserForm**
2. Propriétés (F4) :
   - `(Name)` : `VulnForm`
   - `Caption` : `VulnManager - Insert Vulnerability`
   - `Width` : 480
   - `Height` : 520

#### 2. Ajouter les contrôles

**Barre de recherche** :
- **Label1** : Caption = "Search:"
- **txtSearch** (TextBox) : Width = 300
- **btnSearch** (CommandButton) : Caption = "🔍 Search"

**Filtres** :
- **Label2** : Caption = "Type:"
- **cboType** (ComboBox) : RowSource = "All Types;Web Application;Network;..."
- **Label3** : Caption = "Level:"
- **cboLevel** (ComboBox) : RowSource = "All;Critical;High;Medium;Low;Informational"

**Liste de résultats** :
- **lstVulns** (ListBox) :
  - ColumnCount = 3
  - ColumnWidths = "250;60;50"
  - ColumnHeads = True

**Zone de prévisualisation** :
- **lblPreview** (Label) : Caption = "Preview:"
- **txtPreview** (TextBox) :
  - MultiLine = True
  - ScrollBars = 2 (Vertical)
  - Height = 150
  - Locked = True

**Boutons d'action** :
- **btnInsert** (CommandButton) : Caption = "Insert"
- **btnRefresh** (CommandButton) : Caption = "Refresh Cache"
- **btnClose** (CommandButton) : Caption = "Close"

#### 3. Code du UserForm

Créer le fichier `VulnForm.frm` (ou le coder directement) :

```vba
Private Sub UserForm_Initialize()
    ' Load vulnerabilities from cache
    LoadVulnerabilitiesFromCache

    ' Populate type filter
    PopulateTypeFilter

    ' Set default selections
    cboType.Value = "All Types"
    cboLevel.Value = "All"
End Sub

Private Sub LoadVulnerabilitiesFromCache()
    On Error GoTo ErrorHandler

    Dim jsonData As String
    Dim vulns As Collection
    Dim vuln As Object

    ' Check if cache needs refresh
    If Cache.NeedsRefresh() Then
        If MsgBox("Cache is outdated. Refresh now?", vbYesNo) = vbYes Then
            Cache.SyncCache
        End If
    End If

    ' Load from cache
    jsonData = Cache.LoadCache()
    If Len(jsonData) = 0 Then
        MsgBox "No cache found. Please refresh.", vbExclamation
        Exit Sub
    End If

    ' Parse JSON array
    Set vulns = JsonConverter.ParseJson(jsonData)

    ' Populate ListBox
    lstVulns.Clear
    For Each vuln In vulns
        lstVulns.AddItem vuln("name") & Chr(9) & _
                         vuln("level") & Chr(9) & _
                         vuln("cvss_score")
        lstVulns.List(lstVulns.ListCount - 1, 3) = vuln("id") ' Hidden column for ID
    Next vuln

    Exit Sub

ErrorHandler:
    MsgBox "Error loading cache: " & Err.Description, vbCritical
End Sub

Private Sub btnSearch_Click()
    ' Filter list based on search term
    ApplyFilters
End Sub

Private Sub btnRefresh_Click()
    ' Force cache sync
    Cache.SyncCache
    LoadVulnerabilitiesFromCache
End Sub

Private Sub btnInsert_Click()
    ' Insert selected vulnerability
    If lstVulns.ListIndex < 0 Then
        MsgBox "Please select a vulnerability.", vbExclamation
        Exit Sub
    End If

    Dim vulnId As String
    vulnId = lstVulns.List(lstVulns.ListIndex, 3) ' Get ID from hidden column

    ' Call Insert module
    Insert.InsertVulnerability vulnId

    ' Close form
    Me.Hide
End Sub

Private Sub btnClose_Click()
    Me.Hide
End Sub

Private Sub lstVulns_Click()
    ' Update preview when selection changes
    UpdatePreview
End Sub

Private Sub UpdatePreview()
    ' Load details from cache and display in txtPreview
    ' TODO: Implement preview logic
End Sub

Private Sub ApplyFilters()
    ' Filter lstVulns based on txtSearch, cboType, cboLevel
    ' TODO: Implement filtering logic
End Sub

Private Sub PopulateTypeFilter()
    ' Load vulnerability types from API or hardcode
    cboType.AddItem "All Types"
    cboType.AddItem "Web Application"
    cboType.AddItem "Network"
    cboType.AddItem "Linux"
    cboType.AddItem "Windows"
    ' ... etc.
End Sub
```

#### 4. Créer une macro publique pour ouvrir le UserForm

Dans un nouveau module `Main.bas` :

```vba
Attribute VB_Name = "Main"
Option Explicit

' Show VulnManager UserForm
Public Sub ShowVulnManager()
    VulnForm.Show
End Sub

' Quick settings access
Public Sub ShowSettings()
    Settings.ShowSettingsForm
End Sub

' Force cache refresh
Public Sub RefreshCache()
    Cache.SyncCache
    MsgBox "Cache refreshed successfully!", vbInformation
End Sub
```

---

## Configuration du ruban Word

Pour ajouter des boutons dans le ruban Word (optionnel mais recommandé).

### Option 1 : Quick Access Toolbar (simple)

1. **Fichier** → **Options** → **Barre d'outils Accès rapide**
2. Dans "Choisir les commandes dans" : **Macros**
3. Sélectionner `ShowVulnManager` → **Ajouter >>**
4. Répéter pour `ShowSettings` et `RefreshCache`
5. **OK**

### Option 2 : Custom Ribbon Tab (avancé)

Nécessite de modifier le XML du template. Créer `customUI14.xml` :

```xml
<customUI xmlns="http://schemas.microsoft.com/office/2009/07/customui">
  <ribbon>
    <tabs>
      <tab id="tabVulnManager" label="VulnManager">
        <group id="grpMain" label="Vulnerabilities">
          <button id="btnInsert"
                  label="Insert Vulnerability"
                  imageMso="DatabaseInsertTableWord"
                  size="large"
                  onAction="ShowVulnManager"/>
          <button id="btnRefresh"
                  label="Refresh Cache"
                  imageMso="RefreshAllPivotTables"
                  size="normal"
                  onAction="RefreshCache"/>
        </group>
        <group id="grpSettings" label="Configuration">
          <button id="btnSettings"
                  label="Settings"
                  imageMso="AdministrationHome"
                  size="normal"
                  onAction="ShowSettings"/>
        </group>
      </tab>
    </tabs>
  </ribbon>
</customUI>
```

Intégrer dans le `.dotm` avec l'outil **Custom UI Editor** ou manuellement en décompressant le fichier.

---

## Flux de données

### 1. Configuration initiale

```
User → ShowSettingsForm()
  ↓
InputBox("API URL") → SetApiBase(url)
  ↓
InputBox("Token") → SetVulnToken(token)
  ↓
Document.Variables("VulnManager_ApiBase") = url
Document.Variables("VulnManager_Token") = token
  ↓
Document.Save
```

### 2. Synchronisation du cache

```
User → ShowVulnManager()
  ↓
VulnForm.Initialize()
  ↓
Cache.NeedsRefresh() ?
  ↓ YES
Cache.SyncCache()
  ↓
GetLastSync() → "2025-10-18T15:30:00Z"
  ↓
Api.GetBulk("2025-10-18T15:30:00Z")
  ↓
HTTP GET /api/vulns/bulk?updated_since=2025-10-18T15:30:00Z
Header: Authorization: Bearer vm_xxx
  ↓
API Response: [{"id": "...", "name": "...", ...}, {...}]
  ↓
SaveCache(jsonData)
  ↓
CustomXMLParts.Add("<cache lastSync='...'><![CDATA[...json...]]></cache>")
```

### 3. Insertion de vulnérabilité

```
User → Selects "Injection SQL" in ListBox
  ↓
btnInsert_Click()
  ↓
vulnId = "3eb211f1-1b9b-4a1c-ab7e-2996a68285a7"
  ↓
Insert.InsertVulnerability(vulnId)
  ↓
Api.GetCardJson(vulnId)
  ↓
HTTP GET /api/vulns/3eb211f1.../exportdoc?format=json
Header: Authorization: Bearer vm_xxx
  ↓
API Response: {"id": "...", "name": "Injection SQL", "level": "High", ...}
  ↓
JsonConverter.ParseJson(jsonData)
  ↓
InsertCartouche(vuln)
  ↓
Selection.Range.Text = vuln("name") + formatting
  ↓
Document updated with formatted cartouche
```

---

## Référence API

### Endpoints utilisés

| Endpoint | Méthode | Authentification | Usage |
|----------|---------|------------------|-------|
| `/api/vulns/bulk` | GET | Bearer Token | Récupération de toutes les vulnérabilités (avec `?updated_since` pour sync incrémentale) |
| `/api/vulns/{id}/exportdoc` | GET | Bearer Token | Détails d'une vulnérabilité spécifique (param `?format=json`) |
| `/api/tokens/validate` | HEAD | Bearer Token | Validation du token API |

### Format de requête

```http
GET /api/vulns/bulk?updated_since=2025-10-18T15:30:00Z HTTP/1.1
Host: api.vulnmanager.example.com
Authorization: Bearer vm_4154ef1ab3f960ae64b415436e0b6d1df1fb5f50
Content-Type: application/json
```

### Format de réponse (GET /api/vulns/bulk)

```json
[
  {
    "id": "3eb211f1-1b9b-4a1c-ab7e-2996a68285a7",
    "name": "Injection SQL",
    "level": "High",
    "scope": "Application web - Module d'authentification",
    "protocol_interface": "HTTPS/443",
    "cvss_score": 6.5,
    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:L",
    "description": "Une vulnérabilité d'injection SQL...",
    "risk": "Un attaquant peut exploiter...",
    "recommendation": "1. Implémenter des requêtes préparées...",
    "type": "Web Application",
    "tag_order": ["Name", "Level", "Scope", ...],
    "created_at": "2025-10-17T21:40:53.400585Z",
    "updated_at": "2025-10-18T09:08:06.254160Z",
    "created_by": "3aee1072-d1ed-4f80-b595-4a53ba610ea2",
    "updated_by": "3aee1072-d1ed-4f80-b595-4a53ba610ea2"
  },
  ...
]
```

### Gestion des erreurs API

Les macros gèrent les codes HTTP suivants :

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Traitement normal |
| 204 | No Content | Token valide (pour `/validate`) |
| 401 | Unauthorized | "Token invalide, expiré ou révoqué" |
| 403 | Forbidden | "Token invalide, expiré ou révoqué" |
| 404 | Not Found | "Vulnérabilité non trouvée" |
| Autre | Server Error | "Erreur API: {status} - {statusText}" |

---

## Personnalisation

### Modifier le format de la cartouche

Éditer `Insert.bas` → `InsertCartouche()` :

```vba
' Exemple : Ajouter le vecteur CVSS
Set rng = Selection.Range
With rng
    .Font.Bold = False
    .Font.Size = 9
    .Font.Color = RGB(107, 114, 128)
    .Text = "Vecteur: " & vuln("cvss_vector") & vbCrLf
    .Collapse wdCollapseEnd
End With
```

### Personnaliser les couleurs de criticité

Dans `Insert.bas` lignes 58-69 :

```vba
Select Case vuln("level")
    Case "Critical"
        .Font.Color = RGB(139, 0, 0)     ' Dark Red
    Case "High"
        .Font.Color = RGB(255, 69, 0)    ' Orange Red
    Case "Medium"
        .Font.Color = RGB(255, 165, 0)   ' Orange
    Case "Low"
        .Font.Color = RGB(65, 105, 225)  ' Royal Blue
    Case Else
        .Font.Color = RGB(128, 128, 128) ' Gray
End Select
```

### Modifier l'intervalle de cache

Dans `Cache.bas` ligne 8 :

```vba
Private Const CACHE_MAX_AGE_HOURS As Integer = 48  ' 48h au lieu de 24h
```

### Ajouter des logs de debug

```vba
' Dans Api.bas
Private Sub DebugLog(msg As String)
    Debug.Print "[VulnManager] " & Now & " - " & msg
End Sub

' Appeler dans les fonctions
Public Function GetBulk(...) As String
    DebugLog "GetBulk called with updatedSince=" & updatedSince
    ' ...
    DebugLog "GetBulk returned " & Len(ApiGet(url, token)) & " chars"
End Function
```

---

## Débogage

### Activer l'Inspecteur

1. VBA Editor → **Affichage** → **Fenêtre Exécution** (Ctrl+G)
2. Utiliser `Debug.Print` pour tracer l'exécution

### Points d'arrêt courants

| Module | Fonction | Ligne | Vérification |
|--------|----------|-------|--------------|
| Settings | `GetApiBase()` | 10 | Variables du document existent ? |
| Api | `GetBulk()` | 58 | URL construite correctement ? |
| Api | `ApiGet()` | 24 | Statut HTTP retourné |
| Cache | `SaveCache()` | 46 | JSON bien formé ? |
| Insert | `InsertCartouche()` | 42 | Objet `vuln` contient les bonnes clés ? |

### Erreurs courantes

#### "Subscript out of range" dans Insert.bas

**Cause** : Clé JSON manquante (ex: `vuln("cvss_score")` = Null)

**Solution** :
```vba
' Vérifier avant d'accéder
If Not IsNull(vuln("cvss_score")) And Not IsEmpty(vuln("cvss_score")) Then
    .Text = "CVSS: " & vuln("cvss_score") & vbCrLf
End If
```

#### "Object variable not set" dans VulnForm

**Cause** : `JsonConverter.ParseJson()` retourne Nothing (JSON invalide)

**Solution** :
```vba
Set vulns = JsonConverter.ParseJson(jsonData)
If vulns Is Nothing Then
    MsgBox "Invalid JSON in cache", vbCritical
    Exit Sub
End If
```

#### "Run-time error '5' : Invalid procedure call"

**Cause** : CustomXMLParts vide ou namespace incorrect

**Solution** : Vérifier dans `Cache.bas` ligne 7 que `CACHE_NAMESPACE` est unique.

### Tester sans API

Pour tester hors ligne, créer un mock :

```vba
' Dans Api.bas, remplacer temporairement GetBulk()
Public Function GetBulk(Optional ByVal updatedSince As String = "") As String
    ' Mock data
    GetBulk = "[{""id"":""123"",""name"":""Test"",""level"":""High"",""cvss_score"":7.5}]"
End Function
```

---

## Sécurité

### Stockage du token

Le token est stocké dans `Document.Variables`, **pas dans le code VBA**. Cela signifie :

✅ **Avantages** :
- Pas de token hardcodé dans les macros
- Chaque document peut avoir son propre token
- Token révocable côté serveur

⚠️ **Risques** :
- Le token est stocké **en clair** dans le fichier `.docx` / `.dotm`
- Toute personne avec accès au fichier peut extraire le token

### Bonnes pratiques

1. **Ne jamais partager le template avec le token configuré**
   ```vba
   ' Créer une fonction pour nettoyer le template
   Public Sub CleanTemplate()
       On Error Resume Next
       ActiveDocument.Variables("VulnManager_ApiBase").Delete
       ActiveDocument.Variables("VulnManager_Token").Delete
       Cache.GetCachePart().Delete
       MsgBox "Template cleaned!", vbInformation
   End Sub
   ```

2. **Utiliser des tokens à durée limitée**
   - Dans VulnManager Web, créer des tokens expirant après 30-90 jours
   - Régénérer les tokens pour chaque mission

3. **Révoquer les tokens après usage**
   - Après livraison du rapport, révoquer le token dans l'interface admin

4. **Vérifier les scopes**
   - Les macros n'ont besoin que de `read:vulns` et `export:doc`
   - **Ne jamais donner** `write:vulns` ou `admin:*`

5. **Utiliser HTTPS obligatoirement**
   - L'URL API doit toujours commencer par `https://`
   - Ajouter une validation dans `Settings.bas` :
   ```vba
   Public Sub SetApiBase(ByVal url As String)
       If Left(LCase(url), 8) <> "https://" Then
           MsgBox "HTTPS is required for security!", vbCritical
           Exit Sub
       End If
       ' ... rest of code
   End Sub
   ```

### Audit trail

Côté API, tous les accès via token sont loggés :
- Timestamp
- IP source
- Action (GET /api/vulns/bulk, etc.)
- Token utilisé (identifié par son ID)

Cela permet de tracer l'utilisation en cas de compromission.

---

## Checklist de déploiement

Avant de distribuer le template `.dotm` :

- [ ] Tous les modules sont importés (Settings, Api, Cache, Insert)
- [ ] VBA-JSON (JsonConverter) est installé
- [ ] VulnForm.frm est créé et fonctionnel
- [ ] Le bouton "VulnManager" est dans le ruban ou la barre d'accès rapide
- [ ] Les macros sont signées numériquement (optionnel mais recommandé)
- [ ] Le template est testé avec un vrai token API
- [ ] La synchronisation cache fonctionne
- [ ] L'insertion d'une cartouche fonctionne
- [ ] Le token est **supprimé** du template distribué (`CleanTemplate()`)
- [ ] La documentation utilisateur est fournie

---

## Support et contribution

### Logs de support

Pour aider au débogage, créer une fonction de diagnostic :

```vba
Public Sub DiagnosticInfo()
    Dim msg As String
    msg = "=== VulnManager Diagnostic ===" & vbCrLf & vbCrLf
    msg = msg & "Word Version: " & Application.Version & vbCrLf
    msg = msg & "API URL: " & GetApiBase() & vbCrLf
    msg = msg & "Token configured: " & (Len(GetVulnToken()) > 0) & vbCrLf
    msg = msg & "Cache exists: " & (Not GetCachePart() Is Nothing) & vbCrLf
    msg = msg & "Last sync: " & GetLastSync() & vbCrLf
    msg = msg & "Cache needs refresh: " & NeedsRefresh() & vbCrLf

    MsgBox msg, vbInformation, "Diagnostic"
End Sub
```

### Logs API

Pour activer les logs détaillés, modifier `Api.bas` :

```vba
' Activer logging
Private Const DEBUG_MODE As Boolean = True

Private Function ApiGet(ByVal url As String, ByVal token As String) As String
    If DEBUG_MODE Then Debug.Print "API GET: " & url

    ' ... code existant ...

    If DEBUG_MODE Then Debug.Print "Status: " & http.Status
    If DEBUG_MODE Then Debug.Print "Response length: " & Len(http.responseText)
End Function
```

---

## Ressources

- **API VulnManager** : Voir `/backend/app/routers/vulnerabilities.py`
- **VBA-JSON** : https://github.com/VBA-tools/VBA-JSON
- **Custom UI Editor** : https://github.com/OfficeDev/office-custom-ui-editor
- **Word VBA Reference** : https://learn.microsoft.com/en-us/office/vba/api/overview/word

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-10-18
**Auteur** : VulnManager Team
