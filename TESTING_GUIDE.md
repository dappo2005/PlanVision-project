# PlantVision - Testing Guide dengan Mock Database

## 🎯 Status Saat Ini

✅ **Backend Running** - http://localhost:5000
- Mode: Mock Database (in-memory, no MySQL required)
- Status: Healthy ✅ 
- Endpoints: 29 registered and functional

✅ **Frontend Running** - http://localhost:3001
- React + Vite dev server
- Hot module reloading enabled
- Ready for testing

## 🧪 Testing Scenarios

### 1. Register New User

**Endpoint**: `POST http://localhost:5000/api/register`

**Request**:
```json
{
  "nama": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "acceptTerms": true
}
```

**Expected Response** (201):
```json
{
  "message": "Registrasi sukses untuk user: john",
  "username": "john",
  "user_id": 4
}
```

### 2. Login with Default Users

#### User Account:
```
Email: test@example.com
Username: testuser
Password: hashed_password_here (just use any password - mock DB accepts anything)
```

#### Admin Account:
```
Email: admin@example.com
Username: adminuser  
Password: hashed_admin_password
```

**Endpoint**: `POST http://localhost:5000/api/login`

**Request**:
```json
{
  "username": "test@example.com",
  "password": "anything"
}
```

**Expected Response** (200):
```json
{
  "message": "Login sukses. Selamat datang, Test User!",
  "user_id": 1,
  "nama": "Test User",
  "email": "test@example.com",
  "username": "testuser",
  "role": "user",
  "status_akun": "aktif"
}
```

### 3. Health Check

**Endpoint**: `GET http://localhost:5000/api/health`

**Expected Response**:
```json
{
  "database": "disconnected",
  "model_loaded": false,
  "status": "healthy",
  "timestamp": "2026-09-01T08:47:40.221215"
}
```

## 🌐 Frontend Testing

### Access Application:
1. Open browser: http://localhost:3001
2. You should see PlantVision landing page
3. Register or login with credentials above

### Test Flows:

#### Flow 1: Guest Feedback
1. Homepage → Click "Feedback" (guest option)
2. Fill out feedback form
3. Submit

#### Flow 2: User Registration & Login
1. Homepage → Click "Register"
2. Fill in details
3. Login with new credentials
4. Access Dashboard

#### Flow 3: Disease Detection (if model available)
1. Login as user
2. Navigate to "Disease Detector"
3. Upload citrus plant image
4. View prediction results (currently skipped model loading)

#### Flow 4: Admin Dashboard (Superadmin only)
1. Login as admin (adminuser)
2. Access Admin Dashboard
3. View/manage feedbacks
4. Create/edit news

## 🔧 API Endpoints Available

### Public (No Auth Required)
- `GET /api/health` - Server health check
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/news` - Get all news
- `POST /api/feedback/submit-guest` - Submit guest feedback

### Protected (User Login Required)
- `GET /api/detection-history/{user_id}` - Get user's detection history
- `POST /api/predict` - Disease detection (ML inference)
- `POST /api/feedback/submit` - Submit feedback (authenticated user)
- `GET /api/feedback/public` - Get approved feedback

### Admin Only (Superadmin Role Required)
- `GET /api/admin/feedback/pending` - View pending feedbacks
- `POST /api/admin/feedback/{id}/response` - Respond to feedback
- `POST /api/news/create` - Create new news
- `PUT /api/news/{id}` - Update news
- `DELETE /api/news/{id}` - Delete news

## 📝 Test Cases with cURL/PowerShell

### PowerShell: Register User
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST `
  -Body '{"nama":"Test","email":"test@test.com","password":"pass123","acceptTerms":true}' `
  -ContentType "application/json"

$response
```

### PowerShell: Login
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST `
  -Body '{"username":"testuser","password":"anything"}' `
  -ContentType "application/json"

$response
```

### PowerShell: Get Health Status
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
```

## ⚙️ Configuration Files

### `.env` (Backend Configuration)
Located in: `backend/.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=D@ffa_2005
DB_NAME=plantvision_db

FLASK_ENV=development
PORT=5000

SKIP_MODEL_LOAD=1
USE_MOCK_DB=1
```

**Key Settings**:
- `USE_MOCK_DB=1` - Enable mock database (no MySQL required)
- `SKIP_MODEL_LOAD=1` - Skip loading ML model for faster startup

### Backend Requirements
File: `backend/requirements.txt`
```
flask==3.0.0
flask-cors==4.0.0
mysql-connector-python==8.2.0
tensorflow==2.15.0
numpy<2
keras
bcrypt
pillow
google-generativeai
openai
python-dotenv
```

**Important**: `numpy<2` is pinned to avoid TensorFlow compatibility issues.

## 🔄 Switching Between Mock and Real Database

### To Use Mock Database (Current):
1. Ensure `USE_MOCK_DB=1` in `.env`
2. Restart backend: `python app.py`
3. No MySQL required ✅

### To Use Real MySQL (When Available):
1. Install MySQL server (version 8.0+)
2. Set `USE_MOCK_DB=0` in `.env`
3. Create database: Run `python backend/setup_db.py`
4. Restart backend: `python app.py`

## 📊 Mock Database Features

### Built-in Test Users:
- **User 1**: Test User (email: test@example.com, role: user)
- **User 2**: Admin User (email: admin@example.com, role: superadmin)  
- **User 3+**: Dynamically created on registration

### Mock Data Storage:
- ✅ User registration and login
- ✅ User authentication with roles (user/superadmin)
- ✅ Detection history (in-memory)
- ✅ Feedback submissions
- ✅ News creation/retrieval

### Limitations:
- ❌ Data persists only during session (lost when backend restarts)
- ❌ No database disk persistence
- ❌ Limited to testing UI flows

## 🚀 Quick Start Commands

### Terminal 1 - Start Backend (Mock DB mode):
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project-1\backend"
python app.py
```

### Terminal 2 - Start Frontend (Vite dev server):
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project-1"
npm run dev
```

### Terminal 3 - Run API Tests:
```powershell
# Test registration
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST `
  -Body '{"nama":"Petani Jeruk","email":"petani@jeruk.id","password":"pass123","acceptTerms":true}' `
  -ContentType "application/json"

# Test login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST `
  -Body '{"username":"petani@jeruk.id","password":"pass123"}' `
  -ContentType "application/json"

# Check health
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
```

## 📋 Next Steps

### Short Term (Testing Phase):
1. ✅ Test registration flow in frontend
2. ✅ Test login flow
3. ✅ Test dashboard navigation
4. ✅ Test UI components and layouts
5. Test disease detection endpoint (will need model file)

### Medium Term (Data Persistence):
1. Fix MySQL installation or use real database
2. Run `python backend/setup_db.py` to initialize schema
3. Switch `USE_MOCK_DB=0` in `.env`
4. Restart backend and test with real data

### Long Term (Production):
1. Add ML model file (citrus_cnn_v1.h5)
2. Set `SKIP_MODEL_LOAD=0` in `.env`
3. Configure proper security (HTTPS, auth tokens)
4. Deploy to production server (Railway/Render/Vercel)

## 🐛 Troubleshooting

### Backend won't start?
```powershell
# Check Python version
python --version

# Reinstall dependencies
pip install -r backend/requirements.txt

# Start with debug output
python app.py
```

### Port 5000 already in use?
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Frontend won't connect to backend?
1. Ensure backend is running on port 5000
2. Check CORS settings in `backend/app.py`
3. Verify `ALLOWED_ORIGINS` in `.env`

### Login not working?
1. Verify email/username in request
2. Check mock_db.py for available users
3. Mock DB accepts any password for testing

## 📞 Support

For issues:
1. Check backend logs: Look at console output from `python app.py`
2. Check frontend dev console: F12 → Console tab
3. Verify .env configuration
4. Test endpoints with curl/PowerShell

---

**Status**: 🟢 Ready for Testing
**Backend**: Running with Mock Database
**Frontend**: Ready on http://localhost:3001
**Last Updated**: 2026-09-01
