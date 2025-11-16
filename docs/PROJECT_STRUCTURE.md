# Project Structure (Recommended)

This project contains a React (Vite) frontend and a Flask backend with an ML model for citrus leaf disease detection. Below is a tidy layout that separates runtime API, training code, database assets, and one-off tools.

## High-level Layout

```
PlanVision-project/
├─ frontend/                     # React app (moved from current root)
│  ├─ src/ public/ index.html vite.config.ts package.json ...
│  └─ (node_modules ignored)
├─ backend/                      # Flask API and backend runtime
│  ├─ app.py                     # Main API server (runtime)
│  ├─ disease_info.py            # Domain info used by predictions (runtime)
│  ├─ requirements.txt           # (runtime) minimal deps for serving
│  ├─ uploads/                   # Saved uploaded images (ignored by Git)
│  ├─ db/                        # SQL schema + seed/maintenance scripts
│  │  ├─ setup_database.sql
│  │  ├─ setup_detection_history.sql
│  │  ├─ check_user_table.sql
│  │  └─ *.bat *.ps1 (optional wrappers)
│  ├─ scripts/                   # One-off/diagnostic utilities (not runtime)
│  │  ├─ test_inference.py
│  │  ├─ test_connection.py
│  │  ├─ check_*.py / verify_users.py / debug_*.py
│  │  └─ quick_fix_table.sql (if still needed)
│  └─ ml/                        # Training/evaluation only (optional on servers)
│     ├─ train.py  train_augmented.py  evaluate.py  create_split.py  dataset_check.py
│     ├─ requirements-ml.txt     # full training deps
│     └─ RUN_TRAINING.bat / monitor_training.ps1 (optional helpers)
├─ models/                       # Trained artifacts (ignored by Git; store elsewhere)
├─ data/                         # Datasets (ignored by Git; store elsewhere)
├─ docs/                         # Documentation
│  └─ PROJECT_STRUCTURE.md       # This guide
├─ .env.example                  # Example env vars for backend and frontend
└─ .gitignore                    # Ignores data/models/uploads/node_modules, etc.
```

Notes:
- `frontend/` is just a folder rename of current root frontend files (src, public, vite.config.ts, package.json, etc.). Keeping it separate from backend makes deployment and CI/CD easier.
- `backend/requirements.txt` should only contain runtime deps needed to serve predictions. Keep training packages in `backend/ml/requirements-ml.txt` so production servers stay lean.
- `models/` and `data/` are ignored by Git to prevent bloating the repo; keep them in cloud storage or release artifacts.

## What Is Essential for Runtime (Production)
- `backend/app.py`: Flask server
- `backend/disease_info.py`: disease metadata
- `backend/uploads/`: image storage (ignored by Git)
- `backend/requirements.txt`: minimal runtime deps (Flask, TensorFlow, SciPy, Pillow, bcrypt, mysql-connector, Flask-CORS, Werkzeug)
- Database DDL files under `backend/db/` to create/maintain schema (not always needed on the server after provisioning)

## What Belongs to Development/Training Only
- `backend/ml/`: `train.py`, `train_augmented.py`, `evaluate.py`, `create_split.py`, `dataset_check.py`, training notebooks (if any), and `requirements-ml.txt`
- `models/`: trained SavedModel or checkpoints (ignored by Git)
- `data/`: datasets (ignored by Git)

## One-off/Diagnostic Utilities (Keep but Archive Under scripts/)
Move these out of the backend root; they’re useful during development but not required in production runtime.
- `check_class_order.py`, `check_hash.py`, `check_model_output.py`, `check_table.py`, `check_user.py`, `verify_users.py`, `test_connection.py`, `debug_user_by_email.py`, `test_inference.py`
- Any `quick_fix_table.sql` or ad-hoc SQL files that aren’t part of normal schema setup

## Candidates to Delete (Only If Truly Obsolete)
- Old debug markdowns/screenshots (e.g., `DEBUG_WRONG_DETECTION.md`, `FIX_DENSE2_ERROR.md`, `training_history.png`) if their content is already captured in issues/docs.
- Any `SETUP_*.bat` duplicates once standardized scripts exist under `backend/db/`.

If unsure, prefer moving to `backend/scripts/` rather than deleting. You can prune later with confidence.

## Minimal Runtime Requirements Example
Suggested `backend/requirements.txt` (server-only):
```
flask
flask-cors
mysql-connector-python
bcrypt
pillow
scipy
tensorflow==2.15.0
werkzeug
```
Keep training-only packages (scikit-learn, opencv-python, albumentations, matplotlib, pandas) in `backend/ml/requirements-ml.txt`.

## Environment Variables
Backend (PowerShell examples):
```
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "<secret>"
$env:DB_NAME = "plantvision_db"
$env:PORT = "5000"
```
Create a `.env.example` documenting these.

## Next Steps (Safe Refactor Plan)
1) Create `backend/db/`, `backend/scripts/`, `backend/ml/` and move files accordingly.
2) Split requirements into `backend/requirements.txt` (runtime) and keep `backend/ml/requirements-ml.txt` (training).
3) Move frontend files into `frontend/` and adjust docs/README if needed.
4) Keep `models/` and `data/` out of Git; use cloud storage or releases.
5) Add a tiny README in each subfolder to explain its purpose.
