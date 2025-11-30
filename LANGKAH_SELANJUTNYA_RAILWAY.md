# 🚀 Langkah Selanjutnya Setelah Build Selesai

## ✅ **Status Saat Ini**
- ✅ Repository sudah terhubung ke Railway
- ✅ Service "PlanVision-project" sedang building
- ⏳ Tunggu build selesai dulu...

---

## 📋 **Langkah Setelah Build Selesai**

### **STEP 1: Tunggu Build Selesai (1-3 menit)**

- Lihat status di card "PlanVision-project"
- Status akan berubah dari "Building" → "Deployed" atau "Running"
- Jika ada error, cek tab "Logs"

---

### **STEP 2: Configure Root Directory**

Setelah build selesai:

1. **Klik service "PlanVision-project"** (card di tengah)
2. Buka tab **"Settings"** (di sidebar kiri)
3. Scroll ke bagian **"Root Directory"**
4. **Ubah dari kosong/`.` menjadi**: `backend`
   - Ini memberitahu Railway: "deploy hanya folder backend/"
5. Klik **"Save"**
6. Railway akan otomatis **redeploy** dengan konfigurasi baru

**Kenapa perlu ini?**
- Repository Anda berisi frontend + backend
- Kita hanya mau deploy backend saja
- Root Directory = `backend` berarti Railway hanya baca folder `backend/`

---

### **STEP 3: Set Start Command**

Masih di Settings:

1. Scroll ke bagian **"Start Command"**
2. Set ke: `python app.py`
3. Klik **"Save"**
4. Railway akan redeploy lagi

---

### **STEP 4: Setup MySQL Database**

1. Di Railway dashboard (halaman Architecture)
2. Klik tombol **"Create"** (di kanan atas)
3. Pilih **"Database"** → **"MySQL"**
4. Railway akan create database baru
5. **Copy connection details**:
   - Klik database yang baru dibuat
   - Buka tab **"Variables"** atau **"Connect"**
   - Copy semua:
     - `MYSQLHOST`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`
     - `MYSQLDATABASE`
     - `MYSQLPORT`

---

### **STEP 5: Set Environment Variables**

1. **Klik service "PlanVision-project"** (backend service)
2. Buka tab **"Variables"**
3. Klik **"New Variable"** dan tambahkan satu per satu:

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
   DB_HOST=<paste MYSQLHOST dari database>
   ```

   ```
   DB_PORT=3306
   ```

   ```
   DB_USER=<paste MYSQLUSER dari database>
   ```

   ```
   DB_PASSWORD=<paste MYSQLPASSWORD dari database>
   ```

   ```
   DB_NAME=<paste MYSQLDATABASE dari database>
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

---

### **STEP 6: Import Database**

**Di Laptop Teman** (yang punya database):

1. **Export Database**:
   - Buka MySQL Workbench
   - Connect ke database lokal
   - **Tools** → **Data Export**
   - Pilih semua tables
   - Export to Self-Contained File
   - Save sebagai `backup.sql`

2. **Import ke Railway MySQL**:
   - Di MySQL Workbench, buat connection baru
   - Host: `<MYSQLHOST dari Railway>`
   - Port: `3306`
   - User: `<MYSQLUSER>`
   - Password: `<MYSQLPASSWORD>`
   - Database: `<MYSQLDATABASE>`
   - Test connection → OK
   - **File** → **Run SQL Script**
   - Pilih `backup.sql`
   - Run

---

### **STEP 7: Dapatkan Backend URL**

1. Klik service "PlanVision-project"
2. Buka tab **"Settings"**
3. Scroll ke bagian **"Domains"**
4. Railway akan generate domain seperti: `xxx.railway.app`
5. **Copy URL ini!** (contoh: `https://xxx.railway.app`)

---

### **STEP 8: Update Vercel**

1. Buka Vercel Dashboard
2. Project → Settings → Environment Variables
3. Tambahkan/Update: `VITE_API_URL=https://xxx.railway.app`
4. **Redeploy** frontend

---

### **STEP 9: Test**

1. Test backend: `https://xxx.railway.app/api/health`
2. Test frontend: Buka website Vercel, coba login

---

## ⚠️ **Jika Build Error**

Cek tab **"Logs"**:
- Pastikan `requirements.txt` lengkap
- Pastikan `Procfile` ada di folder `backend/`
- Pastikan Python version compatible

---

## 🎉 **Selesai!**

Setelah semua langkah, backend Anda akan online di Railway! 🚀

