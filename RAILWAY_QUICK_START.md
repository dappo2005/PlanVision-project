# ⚡ Railway Quick Start - 10 Menit

Panduan super cepat deploy backend ke Railway.

---

## 🚀 **Langkah Cepat**

### **1. Setup Railway (2 menit)**
- Buka https://railway.app
- Login dengan GitHub
- New Project → Deploy from GitHub repo
- Pilih repository Anda

### **2. Configure Backend (1 menit)**
- Klik service → Settings
- Root Directory: `backend`
- Start Command: `python app.py`
- Save

### **3. Add MySQL Database (1 menit)**
- New → Database → MySQL
- Copy connection details (MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE)

### **4. Set Environment Variables (2 menit)**
Di backend service → Variables, tambahkan:
```
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
DB_HOST=<MYSQLHOST>
DB_PORT=3306
DB_USER=<MYSQLUSER>
DB_PASSWORD=<MYSQLPASSWORD>
DB_NAME=<MYSQLDATABASE>
ALLOWED_ORIGINS=https://plant-vision-ten.vercel.app
```

### **5. Import Database (3 menit)**
- Export dari laptop teman (MySQL Workbench → Data Export)
- Connect ke Railway MySQL
- Import file backup.sql

### **6. Get Backend URL (30 detik)**
- Backend service → Settings → Domains
- Copy URL (contoh: `https://xxx.railway.app`)

### **7. Update Vercel (1 menit)**
- Vercel Dashboard → Settings → Environment Variables
- Set `VITE_API_URL=https://xxx.railway.app`
- Redeploy

### **8. Test (30 detik)**
- Buka `https://xxx.railway.app/api/health`
- Buka website Vercel
- Test login

---

## ✅ **Selesai!**

**Butuh detail lebih lengkap?** Lihat `DEPLOY_RAILWAY_STEP_BY_STEP.md`

