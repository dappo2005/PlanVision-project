# backend/db - Database Schema & Setup

This folder contains SQL schema definitions and setup scripts for the PlanVision MySQL database.

## Contents

### SQL Schema Files
- `setup_database.sql`: Main User table schema
- `setup_detection_history.sql`: DetectionHistory table for storing prediction results
- `check_user_table.sql`: Quick query to verify User table structure
- `quick_fix_table.sql`: Emergency fixes (if needed)

### Batch Scripts
- `SETUP_DATABASE.bat`: Windows batch script to create database and tables
- `SETUP_DETECTION_TABLE.bat`: Setup DetectionHistory table

## Usage

### Initial Setup (Windows)
From `backend/db/`:
```powershell
.\SETUP_DATABASE.bat
```

This will:
1. Create `plantvision_db` database (if not exists)
2. Run `setup_database.sql` to create User table
3. Verify tables

### Manual Setup
```powershell
mysql -u root -p plantvision_db < setup_database.sql
mysql -u root -p plantvision_db < setup_detection_history.sql
```

## Database Configuration
Backend reads from environment variables (see `backend/app.py`):
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_USER` (default: `root`)
- `DB_PASSWORD` (default: hardcoded; use env var in production!)
- `DB_NAME` (default: `plantvision_db`)

## Notes
- Ensure MySQL server is running before setup.
- Update credentials in batch files or use environment variables.
- For schema migrations, see `backend/scripts/update_database.py`.
