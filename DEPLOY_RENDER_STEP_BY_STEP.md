# 🚀 Deploy Backend ke Render.com - Step by Step

Panduan lengkap deploy backend Flask ke Render.com (lebih mudah dari Railway!).

---

## 🎯 **Kenapa Render.com?**

✅ **Lebih mudah set Python version** (langsung pilih dari dropdown)  
✅ **Gratis** (free tier tersedia)  
✅ **Tidak ada masalah trial expired**  
✅ **Lebih reliable** untuk Python projects  

---

## 📋 **Persiapan**

### **1. Pastikan Backend Sudah di GitHub**

Backend harus sudah di-push ke GitHub repository:
```bash
# Pastikan semua file sudah di-push
git status
git push origin main
```

**Pastikan file-file ini ada di repo:**
- ✅ `backend/app.py`
- ✅ `backend/requirements.txt`
- ✅ `backend/Procfile` (opsional, tapi bagus ada)

---

## 🚀 **STEP 1: Setup Render.com Account**

1. **Buka Render.com**: https://render.com
2. **Klik "Get Started for Free"** atau **"Sign Up"**
3. **Login dengan GitHub** (pilih "Continue with GitHub")
4. **Authorize Render** untuk akses repository GitHub Anda

---

## 🚀 **STEP 2: Create Web Service**

1. **Di Render Dashboard**, klik **"New +"** (di kanan atas)
2. **Pilih "Web Service"**
3. **Connect repository**:
   - Pilih **"Connect account"** (jika belum)
   - Pilih repository **"PlanVision-project"** (atau nama repo Anda)
   - Klik **"Connect"**

---

## 🚀 **STEP 3: Configure Service**

Setelah connect repository, Anda akan masuk ke halaman **"Create Web Service"**. Isi form berikut:

### **Basic Settings:**

1. **Name**: 
   - Isi: `plantvision-backend` (atau nama lain)
   - Ini nama service di Render

2. **Region**: 
   - Pilih region terdekat (misalnya: **Singapore** atau **Oregon**)

3. **Branch**: 
   - Pilih branch: `main` (atau branch yang berisi backend)

4. **Root Directory**: 
   - Isi: `backend`
   - Ini memberitahu Render untuk deploy dari folder `backend/`

### **Build & Deploy Settings:**

5. **Environment**: 
   - Pilih: **Python 3** ← **PENTING!**

6. **Python Version**: 
   - Pilih: **3.11.9** atau **3.11** ← **MUDAH! Langsung pilih dari dropdown!**
   - Ini yang membuat Render lebih mudah dari Railway!

7. **Build Command**: 
   - Isi: `pip install -r requirements.txt`
   - Atau: `cd backend && pip install -r requirements.txt` (jika root directory tidak di-set)

8. **Start Command**: 
   - Isi: `python app.py`
   - Atau: `cd backend && python app.py` (jika root directory tidak di-set)

### **Advanced Settings (Opsional):**

9. **Auto-Deploy**: 
   - Biarkan **"Yes"** (auto-deploy saat push ke GitHub)

10. **Health Check Path**: 
    - Isi: `/api/health` (untuk monitoring)

---

## 🚀 **STEP 4: Create Service**

1. **Scroll ke bawah** form
2. **Klik "Create Web Service"**
3. **Render akan mulai build** (tunggu 2-5 menit)

---

## 🚀 **STEP 5: Setup MySQL Database**

Setelah service dibuat:

1. **Kembali ke Render Dashboard**
2. **Klik "New +"** → **"PostgreSQL"** atau **"MySQL"**
   - **Note**: Render free tier biasanya hanya PostgreSQL
   - Jika perlu MySQL, bisa pakai external MySQL (PlanetScale, Aiven, dll)

3. **Jika pilih PostgreSQL**:
   - Name: `plantvision-db`
   - Database: `plantvision_db`
   - User: `plantvision_user`
   - Region: sama dengan service
   - Plan: **Free** (jika tersedia)
   - Klik **"Create Database"**

4. **Dapatkan Connection Details**:
   - Klik database yang baru dibuat
   - Buka tab **"Connections"** atau **"Info"**
   - **Copy connection string** atau details:
     - Host
     - Port
     - Database name
     - User
     - Password

---

## 🚀 **STEP 6: Set Environment Variables**

1. **Klik service "plantvision-backend"** (yang baru dibuat)

2. **Buka tab "Environment"** (di sidebar kiri)

3. **Klik "Add Environment Variable"** dan tambahkan satu per satu:

   ```
   FLASK_ENV=production
   ```

   ```
   FLASK_DEBUG=False
   ```

   ```
   PORT=5000
   ```

   ```
   DB_HOST=<host dari database>
   ```

   ```
   DB_PORT=5432
   ```
   (Port 5432 untuk PostgreSQL, atau 3306 untuk MySQL)

   ```
   DB_USER=<user dari database>
   ```

   ```
   DB_PASSWORD=<password dari database>
   ```

   ```
   DB_NAME=<database name>
   ```

   ```
   ALLOWED_ORIGINS=https://plant-vision-ten.vercel.app
   ```
   (Ganti dengan URL Vercel Anda yang sebenarnya)

   ```
   GEMINI_API_KEY=<jika pakai Chat AI>
   ```
   (Opsional)

4. **Save semua variables**

5. **Render akan otomatis redeploy** dengan environment variables baru

---

## 🚀 **STEP 7: Import Database**

**Di Laptop Teman** (yang punya database lokal):

### **Jika Render pakai PostgreSQL:**

1. **Export dari MySQL** (di laptop teman):
   - MySQL Workbench → Tools → Data Export
   - Export semua tables
   - Save sebagai `backup.sql`

2. **Convert MySQL ke PostgreSQL** (jika perlu):
   - Bisa pakai tool online atau manual convert
   - ATAU langsung import ke PostgreSQL (jika compatible)

3. **Import ke Render PostgreSQL**:
   - Connect ke Render PostgreSQL via psql atau pgAdmin
   - Import file yang sudah di-convert

### **Jika Pakai External MySQL (PlanetScale, Aiven, dll):**

1. **Buat MySQL database** di external provider
2. **Copy connection details**
3. **Update environment variables** di Render dengan connection details baru
4. **Import database** dari laptop teman ke external MySQL

---

## 🚀 **STEP 8: Dapatkan Backend URL**

1. **Klik service "plantvision-backend"**

2. **Di halaman service**, Anda akan melihat:
   - **URL**: `https://plantvision-backend.onrender.com` (atau custom domain)
   - **Copy URL ini!**

3. **Custom Domain** (opsional):
   - Buka tab **"Settings"**
   - Scroll ke **"Custom Domains"**
   - Bisa add custom domain jika punya

---

## 🚀 **STEP 9: Update Vercel dengan Backend URL**

1. **Buka Vercel Dashboard**:
   - https://vercel.com
   - Login dan pilih project Anda

2. **Update Environment Variable**:
   - Buka **Settings** → **Environment Variables**
   - Cari atau tambahkan: `VITE_API_URL`
   - **Value**: `https://plantvision-backend.onrender.com` (URL dari Render)
   - Klik **"Save"**

3. **Redeploy Frontend**:
   - Buka tab **"Deployments"**
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - Atau push commit baru ke GitHub (auto-deploy)

---

## 🚀 **STEP 10: Test Deployment**

1. **Test Backend Health**:
   - Buka: `https://plantvision-backend.onrender.com/api/health`
   - Seharusnya return JSON dengan status "healthy"

2. **Test Frontend**:
   - Buka website Vercel Anda
   - Coba login
   - Seharusnya sudah bisa connect ke backend!

3. **Test Fitur Lain**:
   - Test disease detection
   - Test dashboard
   - Test semua fitur

---

## ✅ **Checklist Final**

- [ ] Account Render.com sudah dibuat
- [ ] Web service sudah dibuat dengan Python 3.11
- [ ] Database sudah dibuat (PostgreSQL atau external MySQL)
- [ ] Environment variables sudah di-set
- [ ] Database sudah di-import
- [ ] Backend URL sudah didapat
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] Frontend sudah di-redeploy
- [ ] Health check endpoint berfungsi (`/api/health`)
- [ ] Login berhasil
- [ ] Semua fitur berfungsi

---

## 🆘 **Troubleshooting**

### **Build gagal**
- Cek build logs di Render dashboard
- Pastikan Python version sudah di-set ke 3.11
- Pastikan `requirements.txt` lengkap
- Pastikan root directory benar (`backend`)

### **Database connection error**
- Cek environment variables (DB_HOST, DB_USER, dll)
- Pastikan semua sudah di-set dengan benar
- Test connection di database client

### **CORS Error**
- Update `ALLOWED_ORIGINS` dengan URL Vercel yang benar
- Format: `https://plant-vision-ten.vercel.app` (tanpa trailing slash)
- Redeploy backend setelah update

### **Service sleep (Free tier)**
- Render free tier akan sleep setelah 15 menit tidak aktif
- Request pertama setelah sleep akan lambat (cold start)
- Upgrade ke paid plan untuk menghindari sleep

---

## 💡 **Tips**

1. **Free Tier Limitations**:
   - Service akan sleep setelah 15 menit tidak aktif
   - Cold start bisa 30-60 detik
   - Untuk production, pertimbangkan upgrade ke paid plan

2. **Database**:
   - Render free tier biasanya hanya PostgreSQL
   - Jika perlu MySQL, pakai external (PlanetScale, Aiven, dll)

3. **Environment Variables**:
   - Jangan commit `.env` ke GitHub
   - Set semua di Render dashboard

4. **Auto-Deploy**:
   - Render akan auto-deploy saat push ke GitHub
   - Bisa disable di Settings jika tidak mau auto-deploy

---

## 🎉 **Selesai!**

Setelah semua langkah, website Anda akan fully functional:
- ✅ **Frontend**: https://plant-vision-ten.vercel.app
- ✅ **Backend**: https://plantvision-backend.onrender.com
- ✅ **Database**: Render PostgreSQL atau external MySQL

**Tidak perlu laptop teman selalu online lagi!** 🚀

---

**Mulai dari STEP 1: Buat account Render.com dan create web service!**

