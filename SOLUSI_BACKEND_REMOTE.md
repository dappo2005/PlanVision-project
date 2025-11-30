# 🔧 Solusi: Frontend di Vercel, Backend di Laptop Teman

## 📋 Situasi Saat Ini
- ✅ Frontend: Sudah di-deploy di Vercel (public URL)
- ❌ Backend: Masih di laptop teman (localhost:5000)
- ❌ Database: MySQL Workbench di laptop teman

**Masalah**: Frontend di Vercel tidak bisa akses `localhost:5000` karena itu adalah alamat lokal.

---

## 🎯 **OPSI 1: Deploy Backend ke Cloud (RECOMMENDED ⭐)**

Ini solusi terbaik untuk production. Backend dan database di cloud, bisa diakses dari mana saja.

### **A. Deploy Backend ke Railway (Gratis)**

📖 **Untuk panduan lengkap step-by-step, lihat: `DEPLOY_RAILWAY_STEP_BY_STEP.md`**

**Quick Summary:**

1. **Persiapkan Backend**:
   - Pastikan teman Anda sudah commit semua file backend ke GitHub
   - File `backend/Procfile` sudah ada (sudah dibuat sebelumnya)

2. **Setup Railway**:
   - Buka https://railway.app
   - Login dengan GitHub
   - Klik "New Project" → "Deploy from GitHub repo"
   - Pilih repository yang sama dengan frontend
   - **Settings**:
     - **Root Directory**: `backend`
     - **Start Command**: `python app.py`

3. **Setup MySQL di Railway**:
   - Di Railway Dashboard, klik "New" → "Database" → "MySQL"
   - Railway akan generate connection string otomatis
   - **Copy connection details**:
     - Host
     - User
     - Password
     - Database name
     - Port

4. **Export Database dari Laptop Teman**:
   - Di MySQL Workbench, export semua data:
     ```sql
     -- Export structure + data
     -- Tools → Data Export → Select All Tables → Export to Self-Contained File
     ```
   - Atau jalankan semua SQL scripts dari `backend/db/` di Railway MySQL

5. **Set Environment Variables di Railway**:
   ```
   FLASK_ENV=production
   FLASK_DEBUG=False
   PORT=5000
   DB_HOST=<dari Railway MySQL>
   DB_USER=<dari Railway MySQL>
   DB_PASSWORD=<dari Railway MySQL>
   DB_NAME=<dari Railway MySQL>
   DB_PORT=3306
   ALLOWED_ORIGINS=https://plant-vision-ten.vercel.app
   GEMINI_API_KEY=<jika pakai Chat AI>
   ```

6. **Upload Model ML**:
   - Model harus ada di folder `models/` di root project
   - Atau upload via Railway Volume
   - Pastikan path di `app.py` benar

7. **Dapatkan Backend URL**:
   - Railway akan generate: `https://your-app.railway.app`
   - **Simpan URL ini!**

8. **Update Frontend di Vercel**:
   - Buka Vercel Dashboard → Project → Settings → Environment Variables
   - Tambahkan:
     ```
     VITE_API_URL=https://your-app.railway.app
     ```
   - **Redeploy** frontend (atau push commit baru)

### **B. Import Database ke Railway MySQL**

**Opsi 1: Via MySQL Workbench**
1. Di MySQL Workbench laptop teman:
   - Tools → Data Export
   - Pilih semua tables
   - Export to Self-Contained File
   - Simpan file `.sql`

2. Di Railway MySQL:
   - Buka Railway MySQL dashboard
   - Connect via MySQL Workbench dengan connection string dari Railway
   - File → Run SQL Script
   - Pilih file `.sql` yang sudah di-export

**Opsi 2: Via Command Line** (jika teman Anda pakai command line)
```bash
# Export dari laptop teman
mysqldump -u root -p plantvision_db > backup.sql

# Import ke Railway (via Railway MySQL connection)
mysql -h <railway-host> -u <railway-user> -p <railway-db> < backup.sql
```

---

## 🎯 **OPSI 2: Pakai Ngrok (QUICK FIX untuk Testing)**

Ini solusi cepat untuk testing, tapi **tidak recommended untuk production** karena:
- URL ngrok berubah setiap restart (kecuali pakai paid plan)
- Laptop teman harus selalu nyala dan online
- Tidak stabil untuk production

### **Setup Ngrok di Laptop Teman**:

1. **Install Ngrok**:
   - Download dari https://ngrok.com/download
   - Atau via package manager:
     ```bash
     # Windows (via Chocolatey)
     choco install ngrok
     
     # Atau download manual
     ```

2. **Daftar Ngrok** (gratis):
   - Buat akun di https://ngrok.com
   - Dapatkan auth token

3. **Setup Ngrok**:
   ```bash
   # Login dengan token
   ngrok config add-authtoken <your-token>
   
   # Start tunnel ke Flask (port 5000)
   ngrok http 5000
   ```

4. **Dapatkan Public URL**:
   - Ngrok akan generate URL seperti: `https://abc123.ngrok.io`
   - **Copy URL ini!**

5. **Update CORS di Backend** (di laptop teman):
   - Edit `backend/app.py`
   - Update `ALLOWED_ORIGINS` dengan URL ngrok dan Vercel:
     ```python
     ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://abc123.ngrok.io,https://plant-vision-ten.vercel.app').split(',')
     ```

6. **Update Frontend di Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Set `VITE_API_URL=https://abc123.ngrok.io`
   - Redeploy

**⚠️ Catatan**: 
- URL ngrok berubah setiap restart (free plan)
- Harus update `VITE_API_URL` setiap kali restart ngrok
- Laptop teman harus selalu online

---

## 🎯 **OPSI 3: Pakai IP Public + Port Forwarding**

Ini lebih kompleks dan butuh akses router. Tidak recommended kecuali Anda punya kontrol penuh.

### **Setup**:

1. **Dapatkan IP Public**:
   - Cek di https://whatismyipaddress.com
   - Atau dari router admin panel

2. **Port Forwarding di Router**:
   - Login ke router admin (biasanya 192.168.1.1)
   - Setup port forwarding: External Port 5000 → Internal IP laptop teman:5000
   - Pastikan firewall laptop teman allow port 5000

3. **Update Backend**:
   - Pastikan Flask bind ke `0.0.0.0` (sudah ada di `app.py`)
   - Update CORS dengan IP public

4. **Update Frontend**:
   - Set `VITE_API_URL=http://<ip-public>:5000`

**⚠️ Catatan**: 
- IP public bisa berubah (dynamic IP)
- Security risk: expose backend langsung ke internet
- Tidak recommended untuk production

---

## ✅ **Rekomendasi**

### **Untuk Production**:
1. ✅ **Deploy backend ke Railway** (Opsi 1)
2. ✅ **Deploy database ke Railway MySQL**
3. ✅ **Update `VITE_API_URL` di Vercel**

### **Untuk Testing Cepat**:
1. ⚡ **Pakai ngrok** (Opsi 2) - cepat tapi temporary

---

## 📝 **Checklist Setelah Deploy Backend**

- [ ] Backend terdeploy di Railway
- [ ] Database MySQL sudah di-setup di Railway
- [ ] Data sudah di-import dari laptop teman
- [ ] Environment variables sudah di-set di Railway
- [ ] Model ML sudah di-upload
- [ ] Backend URL sudah didapat (contoh: `https://xxx.railway.app`)
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] Frontend sudah di-redeploy
- [ ] Test login berhasil
- [ ] Test semua fitur berfungsi

---

## 🆘 **Troubleshooting**

### **Backend tidak bisa connect ke database**
- Cek connection string di Railway
- Pastikan database name, user, password benar
- Pastikan database sudah dibuat di Railway

### **CORS Error**
- Update `ALLOWED_ORIGINS` di Railway dengan frontend URL
- Format: `https://plant-vision-ten.vercel.app` (tanpa trailing slash)

### **Model tidak load**
- Cek path model di `app.py`
- Pastikan file model ada di server
- Cek logs di Railway untuk error detail

### **Data tidak muncul**
- Pastikan export/import database berhasil
- Cek apakah semua tables sudah dibuat
- Test query langsung di Railway MySQL

---

## 🎉 **Setelah Selesai**

Website Anda akan fully functional:
- **Frontend**: https://plant-vision-ten.vercel.app
- **Backend**: https://your-app.railway.app
- **Database**: Railway MySQL (managed)

Semua bisa diakses dari mana saja, tidak perlu laptop teman selalu online! 🚀

