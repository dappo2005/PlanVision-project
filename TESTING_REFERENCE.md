# PlantVision Quick Testing Reference

## 🟢 Current Status: READY FOR TESTING

```
✅ Backend: http://localhost:5000 (Mock Database Mode)
✅ Frontend: http://localhost:3001 (Vite Dev Server)
✅ 29 API Endpoints: Registered and Functional
✅ No MySQL Required: Using In-Memory Mock Database
```

---

## 🔑 Default Test Credentials

| Role | Email | Username | Password | 
|------|-------|----------|----------|
| User | test@example.com | testuser | (any) |
| Admin | admin@example.com | adminuser | hashed_admin_password |

*Note: Mock DB accepts any password for testing*

---

## 📱 Frontend Testing URL

```
http://localhost:3001
```

### Quick Actions:
- **Register**: Click "Daftar Akun"
- **Login**: Click "Masuk"  
- **Guest Feedback**: Click "Feedback" (no login needed)
- **Admin Dashboard**: Login as admin, click "Admin Panel"

---

## 🔌 API Testing Examples

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
```

**Expected**: `{"status": "healthy", "database": "disconnected", "model_loaded": false}`

### 2. User Registration
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST `
  -Body '{"nama":"Petani Jeruk","email":"petani@example.com","password":"Password123","acceptTerms":true}' `
  -ContentType "application/json"
```

**Expected**: 
```
message   : Registrasi sukses untuk user: petani
user_id   : 4
username  : petani
```

### 3. User Login
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST `
  -Body '{"username":"petani@example.com","password":"Password123"}' `
  -ContentType "application/json"
```

**Expected**:
```
message     : Login sukses. Selamat datang, Petani Jeruk!
user_id     : 4
role        : user
status_akun : aktif
```

### 4. Admin Login
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST `
  -Body '{"username":"admin@example.com","password":"anything"}' `
  -ContentType "application/json"
```

**Expected**:
```
message     : Login sukses. Selamat datang, Admin User!
user_id     : 2
role        : superadmin
```

### 5. Get All News
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/news" -Method GET
```

### 6. Submit Guest Feedback
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/feedback/submit-guest" -Method POST `
  -Body '{"category":"bug","rating":4,"message":"Aplikasi bagus tapi agak lambat"}' `
  -ContentType "application/json"
```

---

## 🧑‍💻 Development Server Commands

### Start Backend (Terminal 1):
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project-1\backend"
python app.py
```

**Wait for message**:
```
[Database] ⚠️  MOCK DATABASE MODE ENABLED
 * Running on http://127.0.0.1:5000
```

### Start Frontend (Terminal 2):
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project-1"
npm run dev
```

**Wait for message**:
```
  ➜  Local:   http://localhost:3001/
```

### Build Frontend (Production):
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project-1"
npm run build
```

**Output**: Will be in `build/` folder

---

## 📊 Available Test Users

### User Account (Regular)
```
Email: test@example.com
Username: testuser
Password: (any password works in mock mode)
Role: user
```

### Admin Account (Superadmin)
```
Email: admin@example.com
Username: adminuser
Password: (any password works in mock mode)
Role: superadmin
```

### New Account (Created during testing)
```
Email: daffa@example.com
Username: daffa
Password: TestPassword123
Role: user
```

---

## 🔄 Database Mode Configuration

### Using Mock Database (Current - No MySQL Needed):
```
File: backend/.env
USE_MOCK_DB=1
SKIP_MODEL_LOAD=1
```

### Switching to Real MySQL (When Available):
```
File: backend/.env
USE_MOCK_DB=0
SKIP_MODEL_LOAD=1
```
Then run: `python backend/setup_db.py`

---

## ✨ Features Currently Working

✅ User Registration  
✅ User Authentication (Login)  
✅ Role-Based Access Control (user/superadmin)  
✅ News Creation & Retrieval  
✅ Feedback Submission (Guest & Authenticated)  
✅ Admin Dashboard Access  
✅ Health Status Endpoint  
✅ CORS Enabled for Frontend  

⏳ Pending (Need Model File):
- Disease Detection (ML Inference)
- Plant Image Analysis

❌ Requires MySQL Setup:
- Database Persistence (data lost on restart)
- Real User Database
- Detection History Persistence

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**:
```powershell
# Check if backend is running
curl http://localhost:5000/api/health

# If not, start it
cd backend && python app.py
```

### Issue: Frontend loads but shows blank page
**Solution**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure backend is running
- Check browser console for errors (F12)

### Issue: Login returns "Koneksi database gagal"
**Solution**:
- This means USE_MOCK_DB is not enabled
- Check backend/.env has `USE_MOCK_DB=1`
- Restart backend: `python app.py`

### Issue: Port 5000 or 3001 already in use
**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID <PID> /F

# Restart application
```

---

## 📚 Project Structure

```
├── backend/
│   ├── app.py                 ← Main Flask API server
│   ├── mock_db.py             ← Mock database (NEW!)
│   ├── disease_info.py        ← Disease information
│   ├── .env                   ← Configuration (USE_MOCK_DB=1)
│   ├── requirements.txt        ← Python dependencies
│   ├── db/
│   │   └── setup_database.sql ← Schema (for real MySQL)
│   └── uploads/               ← User uploaded images
│
├── src/
│   ├── App.tsx                ← React router & auth
│   ├── components/            ← React components
│   ├── pages/                 ← Page components
│   └── styles/                ← CSS & Tailwind
│
├── package.json               ← Node dependencies
├── vite.config.ts             ← Vite build config
├── TESTING_GUIDE.md           ← Detailed testing guide (NEW!)
└── TESTING_REFERENCE.md       ← This file (NEW!)
```

---

## 🎯 Next Steps

1. **Open Frontend**: http://localhost:3001
2. **Register a New User**: Fill in form and submit
3. **Login**: Use registered credentials
4. **Explore Dashboard**: Navigate to different pages
5. **Test Admin Panel**: Login as admin to test admin features
6. **Check API Docs**: See all available endpoints in app.py

---

## 📞 Troubleshooting Commands

```powershell
# Check backend health
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET

# Check if port 5000 is used
netstat -ano | findstr :5000

# See what's using port 3001
netstat -ano | findstr :3001

# Kill process using port
taskkill /PID 1234 /F

# Check Python version
python --version

# List running Python processes
Get-Process python
```

---

## 🎉 Ready to Test!

**Everything is working with Mock Database mode!**

1. Backend is running ✅
2. Frontend is running ✅  
3. No MySQL needed ✅
4. All test users ready ✅

**Start testing now**: http://localhost:3001

Last Updated: 2026-09-01
