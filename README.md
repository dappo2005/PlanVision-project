# PlantVision

Web application for citrus leaf disease detection using deep learning. Built with React/TypeScript frontend and Flask/Python backend with TensorFlow EfficientNet model.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Flask, Python, TensorFlow, MySQL
- **ML Model**: EfficientNet for 5-class citrus disease classification

## Project Structure

```
PlanVision-project-1/
├── src/                    # React frontend source
│   ├── components/         # UI components
│   ├── guidelines/         # Development guidelines
│   └── Attributions.md     # Credits & attributions
├── backend/
│   ├── app.py              # Main Flask API
│   ├── disease_info.py     # Disease metadata
│   ├── db/                 # Database schema & setup
│   ├── ml/                 # ML training scripts
│   ├── scripts/            # Diagnostic utilities
│   ├── uploads/            # Uploaded images (gitignored)
│   └── requirements.txt    # Python dependencies
├── public/                 # Static assets
├── docs/                   # Documentation
├── data/                   # Training datasets (gitignored)
├── models/                 # Trained ML models (gitignored)
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
└── railway.json            # Railway deployment config
```

## Prerequisites

- Python 3.8-3.11 (TensorFlow compatibility)
- Node.js 18+
- MySQL 8.0+ (optional, mock DB available)

## Setup & Run Locally

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database (Optional)

If using real MySQL instead of mock database:

```bash
cd db
# Windows
.\SETUP_DATABASE.bat
# Linux/Mac
bash setup_database.sh
```

### 3. Start Backend

```bash
cd backend
python app.py
```

Backend runs on `http://localhost:5000`.

### 4. Start Frontend

Open a new terminal:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 5. Test the App

1. Open `http://localhost:5173` in browser
2. Register or login with test credentials
3. Navigate to Disease Detector
4. Upload a citrus leaf image
5. View detection results with recommendations

## Environment Variables

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=plantvision_db
PORT=5000

# Mock mode (no MySQL required)
USE_MOCK_DB=1
SKIP_MODEL_LOAD=1
```

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/register` | Register new user |
| POST | `/api/login` | User login |
| GET | `/api/news` | Get all news |
| POST | `/api/feedback/submit-guest` | Submit guest feedback |

### Protected (User Login Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Disease detection |
| GET | `/api/detection-history/<user_id>` | Detection history |
| POST | `/api/feedback/submit` | Submit feedback |
| GET | `/api/feedback/public` | Get approved feedback |

### Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/feedback/pending` | Pending feedbacks |
| POST | `/api/admin/feedback/<id>/response` | Respond to feedback |
| POST | `/api/news/create` | Create news |
| PUT | `/api/news/<id>` | Update news |
| DELETE | `/api/news/<id>` | Delete news |

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed API testing instructions.

Quick test with PowerShell:

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET

# Register
Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST `
  -Body '{"nama":"Test","email":"test@test.com","password":"pass123","acceptTerms":true}' `
  -ContentType "application/json"

# Login
Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST `
  -Body '{"username":"testuser","password":"pass123"}' `
  -ContentType "application/json"
```

## Troubleshooting

### Backend won't start
- Ensure Python 3.8-3.11 is installed (`python --version`)
- Install dependencies: `pip install -r backend/requirements.txt`

### Port 5000 already in use
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS settings in `backend/app.py`
- Verify `VITE_API_URL` in frontend `.env`

### Model not found
- Set `SKIP_MODEL_LOAD=1` in `backend/.env` for testing without ML model
- Or train a model: `cd backend/ml && python train.py --epochs 20`

## Team

- Daffa - Developer
- Aisyah - Developer
- Refael - Developer
- Imam - Developer

## Credits

- [shadcn/ui](https://ui.shadcn.com/) - UI components (MIT License)
- [Unsplash](https://unsplash.com) - Photos used in design
