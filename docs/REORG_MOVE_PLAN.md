# Reorganization Move Plan (No Files Moved Yet)

This plan maps current files to the recommended structure and highlights path impacts. No files have been moved; this is a checklist to execute once you approve whether code updates are allowed.

Legend:
- SAFE: moving will not break code because paths are dynamic or not referenced by code
- NEEDS-UPDATE: moving will change relative path assumptions in scripts; requires small code edits or run-cwd changes

## Backend Runtime (keep paths stable)
- backend/app.py → backend/app.py (KEEP)
  - Reason: uses `os.path.dirname(__file__)` and assumes `../models/...` and `backend/uploads/`. Moving it would break.
- backend/disease_info.py → backend/disease_info.py (KEEP)
- backend/uploads/ → backend/uploads/ (KEEP, ignored by Git)

## Backend: Database assets (SAFE)
Move the following to `backend/db/` (no imports depend on their location):
- backend/setup_database.sql → backend/db/setup_database.sql (SAFE)
- backend/setup_detection_history.sql → backend/db/setup_detection_history.sql (SAFE)
- backend/check_user_table.sql → backend/db/check_user_table.sql (SAFE)
- backend/SETUP_DATABASE.bat → backend/db/SETUP_DATABASE.bat (SAFE)
- backend/SETUP_DETECTION_TABLE.bat → backend/db/SETUP_DETECTION_TABLE.bat (SAFE)
- backend/quick_fix_table.sql → backend/db/quick_fix_table.sql (SAFE)

Optional wrappers:
- backend/START_BACKEND.bat (leave or move to project root `scripts/`; SAFE)
- backend/run_training.ps1, backend/RUN_TRAINING.bat, backend/monitor_training.ps1 (consider under `backend/ml/` below; NEEDS-UPDATE if they assume current locations)

## Backend: Training/ML (NEEDS-UPDATE if moved)
Move to `backend/ml/` only if we can adjust defaults that use `..` relative paths:
- backend/train.py → backend/ml/train.py (NEEDS-UPDATE)
  - Defaults use `os.path.join('..','data',...)` and `..\models\...`.
- backend/train_augmented.py → backend/ml/train_augmented.py (NEEDS-UPDATE)
- backend/evaluate.py → backend/ml/evaluate.py (LIKELY needs dataset/model paths)
- backend/create_split.py → backend/ml/create_split.py (LIKELY)
- backend/dataset_check.py → backend/ml/dataset_check.py (LIKELY)
- backend/requirements-ml.txt → backend/ml/requirements-ml.txt (SAFE)

## Backend: Diagnostics/Utilities (NEEDS-UPDATE if moved)
Move to `backend/scripts/`:
- backend/test_inference.py → backend/scripts/test_inference.py (NEEDS-UPDATE; uses `..\models\...`)
- backend/test_connection.py → backend/scripts/test_connection.py (SAFE; direct connection values)
- backend/check_user.py → backend/scripts/check_user.py (SAFE)
- backend/verify_users.py → backend/scripts/verify_users.py (SAFE)
- backend/debug_user_by_email.py → backend/scripts/debug_user_by_email.py (SAFE)
- backend/check_hash.py, check_table.py, check_class_order.py, check_model_output.py → backend/scripts/ (LIKELY SAFE; verify for relative paths)

## Frontend (OPTIONAL, would change run commands)
Move to `frontend/` only if you’re okay updating `package.json` scripts:
- index.html, vite.config.ts, package.json, src/, public/ → frontend/* (NEEDS-UPDATE to scripts and docs)

## Models & Data (KEEP PATHS)
- models/ (KEEP at repo root; ignored by Git)
- data/ (KEEP at repo root; ignored by Git)
- "Citrus Leaf Disease Image/" (KEEP; ignored by Git)

## Files you may archive or delete later
- backend/DEBUG_WRONG_DETECTION.md, backend/FIX_DENSE2_ERROR.md, training_history.png (archive to docs/ or delete if obsolete)

## Why some moves need updates
The following files contain relative paths that assume current locations (detected from quick grep):
- backend/app.py: `../models/efficientnet_saved/saved_model` and `backend/uploads/`
- backend/train.py: defaults to `../data/plantvision_dataset` and `../models/efficientnet_saved`
- backend/train_augmented.py: same patterns
- backend/test_inference.py: loads model from `../models/...`

For these, we can either:
1) Keep them in place (no code changes), or
2) Move them and tweak a few default paths (1-3 lines per file) to preserve behavior.

## Recommended next action
- Phase 1 (Zero-risk): Move only SQL and admin scripts to `backend/db/` (SAFE). Keep everything else as-is. No code changes required.
- Phase 2 (Optional): Move `scripts/` and `ml/` with small path fixes; I can prepare patches if you approve code changes.
