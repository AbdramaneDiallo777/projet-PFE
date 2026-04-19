# Service ML — Scan IA (feuilles / maladies)

API Flask utilisée par **FastAPI** (`/api/v1/ml/*`) puis l’app mobile (`scan.tsx`).

## Prérequis

- Python **3.10+**
- Fichiers présents dans ce dossier :
  - `models/labels.json` — classes PlantVillage (déjà fourni)
  - `models/agroconnect_model.tflite` — **à générer** (voir ci-dessous)

## Démarrage rapide (Windows)

Depuis la racine du repo AgroConnect Africa :

```powershell
npm run ml
```

Ou manuellement :

```powershell
cd ml-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py app.py
```

Le service écoute sur **http://127.0.0.1:5000** (variable d’environnement `ML_FLASK_PORT` pour changer).

Dans `.env` du backend :

```env
ML_FLASK_URL=http://127.0.0.1:5000
```

Puis lancer FastAPI (`npm run api`). L’app appelle `GET /api/v1/ml/health` et `POST /api/v1/ml/predict`.

## Fichier `agroconnect_model.tflite`

Le dépôt peut inclure un **modèle stub** (petit réseau, poids aléatoires) pour tester la chaîne — les prédictions ne sont **pas** fiables tant que vous n’avez pas entraîné sur PlantVillage.

**Régénérer le stub** (à la racine du repo) :

```powershell
.\scripts\build-ml-model.ps1
```

Ou manuellement : `py build_stub_model.py` avec TensorFlow disponible (voir script si erreur de chemins longs sous Windows).

**Modèle sérieux (production)** :

1. Télécharger le jeu **PlantVillage** (images classées par maladie ; organiser `train/` et `val/`) sous `ml-service/PlantVillage/`.
2. `py train_model.py` → `models/agroconnect_model.h5`.
3. `py convert_to_tflite.py` → `models/agroconnect_model.tflite`.
4. Redémarrer `py app.py` : `GET /health` doit indiquer `"model_loaded": true`.

Sans fichier `.tflite`, le service démarre quand même : `/health` signale l’absence du fichier ; `/predict` répond **503** avec un message explicite.

## Endpoints Flask

| Méthode | Chemin     | Rôle                          |
|---------|------------|-------------------------------|
| GET     | `/health`  | État du modèle + chemins      |
| POST    | `/predict` | Corps multipart, champ `file` (image) |

Réponse prédiction (exemple) : `maladie`, `maladie_code`, `confiance`, `status`.

## Fichiers d’origine

Scripts issus du dépôt **projet-data-main** (entraînement, conversion, estimation rendement), intégrés et chemins rendus relatifs à `ml-service/`.
