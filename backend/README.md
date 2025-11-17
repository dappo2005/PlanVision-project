# PlanVision Backend - Organized Structure

This is the Flask backend API for PlanVision, serving disease detection predictions and managing user authentication.

## Structure

```
backend/
├── app.py                     # Main Flask API (runtime)
├── disease_info.py            # Disease metadata (runtime)
├── requirements.txt           # Production runtime dependencies
├── uploads/                   # User-uploaded images (ignored by Git)
├── db/                        # Database schema & setup scripts
│   ├── setup_database.sql
│   ├── setup_detection_history.sql
│   └── README.md
├── ml/                        # ML training & evaluation (dev only)
│   ├── train.py, train_augmented.py
│   ├── evaluate.py, create_split.py, dataset_check.py
│   ├── requirements-ml.txt
│   └── README.md
└── scripts/                   # Diagnostic utilities (dev only)
    ├── test_inference.py, test_connection.py
    ├── check_user.py, update_database.py
    └── README.md
```

## Quick Start

### 1. Install Runtime Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Setup Database
```powershell
cd db
.\SETUP_DATABASE.bat
cd ..
```

### 3. Start Backend Server
```powershell
python app.py
```

Backend runs on http://localhost:5000 by default.

### 4. Environment Variables (Optional)
```powershell
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "your_password"
$env:DB_NAME = "plantvision_db"
$env:PORT = "5000"
```

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/predict` - Disease detection (requires image upload)
- `GET /api/detection-history/<user_id>` - Get user's detection history
- `GET /api/uploads/<filename>` - Serve uploaded images

## Development Tools

### Train New Model
```powershell
cd ml
python train.py --epochs 20 --batch_size 32
```

### Test Model Inference
```powershell
cd scripts
python test_inference.py "../../Citrus Leaf Disease Image/Canker/1.jpg"
```

### Database Diagnostics
```powershell
cd scripts
python verify_users.py
python test_connection.py
```

## Notes

- **Production**: Only need `app.py`, `disease_info.py`, `requirements.txt`, and `uploads/`
- **Development**: Use `ml/` for training, `scripts/` for debugging
- **Database**: Schema in `db/`, one-time setup required
- **Models**: Stored in `../../models/` (ignored by Git)
- **Data**: Training datasets in `../../data/` (ignored by Git)

See individual folder READMEs for detailed documentation.
