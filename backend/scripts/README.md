# backend/scripts - Diagnostic & Development Utilities

This folder contains one-off scripts and utilities for debugging, testing, and database maintenance. These are **not** required for production runtime.

## Contents

### Model/Inference Testing
- `test_inference.py`: Test trained model on single images
- `check_model_output.py`: Inspect SavedModel signature and output keys
- `check_class_order.py`: Verify class name ordering matches training dataset

### Database Utilities
- `test_connection.py`: Test MySQL connection and basic setup
- `check_user.py`: Inspect user records in database
- `check_table.py`: Show User table structure (DESCRIBE)
- `verify_users.py`: List recent users with all fields
- `debug_user_by_email.py`: Debug user lookup by email
- `update_database.py`: Apply schema migrations (add phone, accept_terms, etc.)

### Misc
- `check_hash.py`: Test bcrypt password hashing (env vars HASH and PASS)

## Usage Examples

### Test model inference
From `backend/scripts/`:
```powershell
python test_inference.py "../../Citrus Leaf Disease Image/Canker/1.jpg"
```

### Check database connection
```powershell
python test_connection.py
```

### Verify users in DB
```powershell
python verify_users.py
```

### Debug user by email
```powershell
$env:EMAIL = "user@example.com"
python debug_user_by_email.py
```

## Notes
- These scripts are for **development/debugging only**.
- They are safe to exclude from production deployments.
- Most use hardcoded DB credentials or env vars (see `backend/app.py` for canonical config).
