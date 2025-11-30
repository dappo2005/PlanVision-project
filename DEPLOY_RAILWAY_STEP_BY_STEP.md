# 🚂 Deploy Backend ke Railway - Step by Step

Panduan lengkap deploy backend Flask ke Railway (solusi permanen).

---

## 📋 **Persiapan**

### **1. Pastikan Backend Sudah di GitHub**

Backend harus sudah di-push ke GitHub repository:
```bash
# Di laptop teman (yang punya backend)
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

**Pastikan file-file ini ada di repo:**
- ✅ `backend/app.py`
- ✅ `backend/requirements.txt`
- ✅ `backend/Procfile` (sudah dibuat sebelumnya)
- ✅ `backend/db/setup_database.sql` (dan SQL scripts lainnya)

---

## 🚀 **STEP 1: Setup Railway Account**

1. **Buka Railway**: https://railway.app
2. **Login dengan GitHub** (klik "Login with GitHub")
3. **Authorize Railway** untuk akses repository GitHub Anda

---

## 🚀 **STEP 2: Deploy Backend Service**

1. **Create New Project**:
   - Klik "New Project" di Railway dashboard
   - **Accept Terms of Service** (jika muncul modal):
     - Centang semua checkbox untuk agree
     - Klik "I Agree" atau tombol accept
   - Setelah itu, Anda akan melihat beberapa opsi:
     - **"GitHub Repository"** ← **PILIH INI!**
     - Database
     - Template
     - Docker Image
     - Function
     - Empty Project
   - Klik **"GitHub Repository"**
   - Railway akan meminta akses ke GitHub (jika belum)
   - **Pilih repository GitHub yang LENGKAP** (yang berisi frontend + backend)
     - ⚠️ **PENTING**: Pilih repository UTUH, bukan hanya folder backend
     - Railway akan deploy dari repository ini, tapi nanti kita set Root Directory ke `backend`
   - Klik "Deploy" atau "Add"

2. **Railway akan Auto-Deploy**:
   - Railway akan otomatis detect repository
   - Akan mulai build dan deploy
   - Tunggu sampai selesai (bisa lihat di tab "Deployments" atau "Logs")

3. **Configure Service - Set Root Directory**:
   - Klik service yang baru dibuat (biasanya nama repository Anda)
   - Buka tab **"Settings"** (di sidebar kiri)
   - Scroll ke bagian **"Root Directory"**
   - **Ubah dari kosong/`.` menjadi**: `backend`
     - Ini memberitahu Railway untuk hanya deploy folder `backend/` saja
     - Frontend tidak akan di-deploy karena kita hanya fokus ke backend
   - Klik **"Save"**
   - Railway akan otomatis redeploy dengan konfigurasi baru

4. **Set Start Command**:
   - Masih di Settings
   - Scroll ke **"Start Command"**
   - Set ke: `python app.py`
   - Klik "Save"

5. **Railway akan otomatis:**
   - Detect Python
   - Install dependencies dari `requirements.txt`
   - Start aplikasi

---

## 🗄️ **STEP 3: Setup MySQL Database**

1. **Add Database**:
   - Di Railway project dashboard
   - Klik **"New"** → **"Database"** → **"MySQL"**
   - Railway akan create MySQL database baru

2. **Dapatkan Connection Details**:
   - Klik database yang baru dibuat
   - Buka tab **"Connect"** atau **"Variables"**
   - **Copy semua connection details:**
     - `MYSQLHOST` (host)
     - `MYSQLUSER` (user)
     - `MYSQLPASSWORD` (password)
     - `MYSQLDATABASE` (database name)
     - `MYSQLPORT` (port, biasanya 3306)

   **ATAU** Railway akan generate connection string seperti:
   ```
   mysql://user:password@host:port/database
   ```

---

## ⚙️ **STEP 4: Set Environment Variables**

1. **Buka Backend Service** di Railway:
   - Klik service backend (bukan database)
   - Buka tab **"Variables"**

2. **Add Environment Variables**:
   Klik **"New Variable"** dan tambahkan satu per satu:

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
   DB_HOST=<MYSQLHOST dari database>
   ```
   
   ```
   DB_PORT=3306
   ```
   
   ```
   DB_USER=<MYSQLUSER dari database>
   ```
   
   ```
   DB_PASSWORD=<MYSQLPASSWORD dari database>
   ```
   
   ```
   DB_NAME=<MYSQLDATABASE dari database>
   ```
   
   ```
   ALLOWED_ORIGINS=https://plant-vision-ten.vercel.app
   ```
   
   (Ganti dengan URL Vercel Anda yang sebenarnya)
   
   ```
   GEMINI_API_KEY=<jika pakai Chat AI, isi dengan API key>
   ```
   
   (Opsional, bisa skip jika tidak pakai)

3. **Save semua variables**

---

## 📦 **STEP 5: Setup Database Schema**

Anda perlu import schema dan data dari laptop teman ke Railway MySQL.

### **Opsi A: Via MySQL Workbench (Recommended)**

1. **Export dari Laptop Teman**:
   - Buka MySQL Workbench di laptop teman
   - Connect ke database lokal
   - **Tools** → **Data Export**
   - Pilih semua tables
   - **Export to Self-Contained File**
   - Pilih lokasi save (contoh: `backup.sql`)
   - Klik **"Start Export"**

2. **Connect ke Railway MySQL**:
   - Di Railway, buka database MySQL
   - Tab **"Connect"** → Copy connection string atau details
   - Di MySQL Workbench, klik **"+"** untuk connection baru
   - Isi dengan details dari Railway:
     - Hostname: `<MYSQLHOST>`
     - Port: `3306`
     - Username: `<MYSQLUSER>`
     - Password: `<MYSQLPASSWORD>`
     - Default Schema: `<MYSQLDATABASE>`
   - Test connection → OK

3. **Import ke Railway**:
   - Connect ke Railway MySQL di MySQL Workbench
   - **File** → **Run SQL Script**
   - Pilih file `backup.sql` yang sudah di-export
   - Klik **"Run"**
   - Tunggu sampai selesai

### **Opsi B: Via Command Line (Alternatif)**

1. **Export dari Laptop Teman**:
   ```bash
   mysqldump -u root -p plantvision_db > backup.sql
   ```

2. **Import ke Railway**:
   ```bash
   mysql -h <MYSQLHOST> -u <MYSQLUSER> -p <MYSQLDATABASE> < backup.sql
   ```

### **Opsi C: Run SQL Scripts Manual**

Jika tidak ada data penting, bisa run SQL scripts dari `backend/db/`:

1. Connect ke Railway MySQL via MySQL Workbench
2. Run script satu per satu:
   - `setup_database.sql`
   - `setup_detection_history.sql`
   - `setup_feedback.sql`

---

## 🤖 **STEP 6: Upload Model ML**

Model ML harus ada di server Railway. Ada beberapa cara:

### **Opsi A: Commit ke GitHub (Jika < 100MB)**

1. **Pastikan model ada di repo**:
   - Model harus di folder `models/` di root project
   - Path di `app.py`: `../models/citrus_cnn_v1.h5`
   - Commit dan push ke GitHub:
     ```bash
     git add models/
     git commit -m "Add ML model"
     git push
     ```

2. **Railway akan otomatis pull** dari GitHub

### **Opsi B: Upload via Railway Volume (Jika > 100MB)**

1. **Create Volume**:
   - Di Railway project, klik **"New"** → **"Volume"**
   - Name: `models`
   - Size: sesuai kebutuhan (minimal 1GB)

2. **Mount Volume**:
   - Buka backend service → Settings
   - Scroll ke **"Volumes"**
   - Add volume: `/models` → mount ke volume `models`

3. **Update Model Path di app.py**:
   ```python
   MODEL_PATH = os.path.join('/models', 'citrus_cnn_v1.h5')
   ```

4. **Upload Model**:
   - Via Railway CLI atau
   - Via Railway dashboard (jika ada file upload feature)

### **Opsi C: Cloud Storage (Recommended untuk Model Besar)**

1. Upload model ke:
   - Google Cloud Storage
   - AWS S3
   - Cloudinary
   - Atau storage lainnya

2. Update `app.py` untuk download model saat startup:
   ```python
   import requests
   
   def download_model():
       if not os.path.exists(MODEL_PATH):
           print("Downloading model from cloud storage...")
           url = "https://your-storage.com/model.h5"
           response = requests.get(url)
           with open(MODEL_PATH, 'wb') as f:
               f.write(response.content)
   ```

---

## 🔗 **STEP 7: Dapatkan Backend URL**

1. **Buka Backend Service** di Railway
2. Klik tab **"Settings"**
3. Scroll ke **"Domains"**
4. Railway akan generate domain seperti: `your-app.railway.app`
5. **Copy URL ini!** (contoh: `https://your-app.railway.app`)

**ATAU** bisa generate custom domain:
- Klik **"Generate Domain"**
- Railway akan create: `your-app-production.up.railway.app`

---

## 🌐 **STEP 8: Update Frontend di Vercel**

1. **Buka Vercel Dashboard**:
   - https://vercel.com
   - Login dan pilih project Anda

2. **Update Environment Variable**:
   - Buka **Settings** → **Environment Variables**
   - Cari atau tambahkan: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (URL dari Railway)
   - **PENTING**: Pastikan tidak ada trailing slash (`/`)
   - Klik **Save**

3. **Redeploy Frontend**:
   - Buka tab **"Deployments"**
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - Atau push commit baru ke GitHub (auto-deploy)

---

## ✅ **STEP 9: Test Deployment**

1. **Test Backend Health**:
   - Buka: `https://your-app.railway.app/api/health`
   - Seharusnya return JSON dengan status "healthy"

2. **Test Frontend**:
   - Buka website Vercel Anda
   - Coba login
   - Seharusnya sudah bisa connect ke backend!

3. **Check Logs**:
   - Di Railway, buka backend service → tab **"Logs"**
   - Cek apakah ada error
   - Pastikan model loaded (jika ada)

---

## 🆘 **Troubleshooting**

### **Backend tidak start**
- Cek logs di Railway → tab "Logs"
- Pastikan `requirements.txt` lengkap
- Pastikan `Procfile` ada dan benar
- Pastikan Python version compatible

### **Database connection error**
- Cek environment variables (DB_HOST, DB_USER, dll)
- Pastikan database sudah dibuat di Railway
- Test connection string di MySQL Workbench

### **CORS Error**
- Update `ALLOWED_ORIGINS` dengan URL Vercel yang benar
- Format: `https://plant-vision-ten.vercel.app` (tanpa trailing slash)
- Redeploy backend setelah update

### **Model tidak load**
- Cek path model di `app.py`
- Pastikan file model ada di server
- Cek logs untuk error detail
- Pastikan model file size tidak melebihi limit

### **404 Error di API**
- Pastikan backend URL benar (tanpa trailing slash)
- Cek apakah route `/api/health` bisa diakses
- Pastikan CORS sudah dikonfigurasi

---

## 📝 **Checklist Final**

- [ ] Backend terdeploy di Railway
- [ ] MySQL database sudah dibuat di Railway
- [ ] Environment variables sudah di-set
- [ ] Database schema sudah di-import
- [ ] Model ML sudah di-upload
- [ ] Backend URL sudah didapat
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] Frontend sudah di-redeploy
- [ ] Health check endpoint berfungsi (`/api/health`)
- [ ] Login berhasil
- [ ] Semua fitur berfungsi

---

## 🎉 **Selesai!**

Sekarang backend dan database sudah di cloud:
- ✅ **Backend**: `https://your-app.railway.app`
- ✅ **Database**: Railway MySQL (managed)
- ✅ **Frontend**: `https://plant-vision-ten.vercel.app`

**Tidak perlu laptop teman selalu online lagi!** 🚀

---

## 💡 **Tips**

1. **Monitor Usage**:
   - Railway free tier punya limit
   - Cek usage di Railway dashboard
   - Upgrade jika perlu

2. **Backup Database**:
   - Export database secara berkala
   - Railway bisa auto-backup (paid plan)

3. **Custom Domain**:
   - Bisa setup custom domain di Railway
   - Atau pakai domain dari Vercel

4. **Environment Variables**:
   - Jangan commit `.env` ke GitHub
   - Set semua di Railway dashboard

---

**Butuh bantuan?** Cek logs di Railway atau lihat dokumentasi Railway: https://docs.railway.app

