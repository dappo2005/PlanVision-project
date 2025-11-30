# 🚀 Panduan Hosting Website PlantVision

Proyek ini terdiri dari:
- **Frontend**: React + Vite (TypeScript)
- **Backend**: Flask (Python) dengan TensorFlow untuk ML
- **Database**: MySQL

## ⚠️ **Frontend Sudah di Vercel, Backend Masih di Laptop?**

Jika frontend Anda sudah di-deploy di Vercel tapi backend masih di laptop teman, lihat:
- **`SOLUSI_BACKEND_REMOTE.md`** - Panduan lengkap semua opsi
- **`QUICK_FIX_BACKEND.md`** - Quick fix pakai ngrok (5 menit)

## 📋 Opsi Hosting

### **Opsi 1: Hosting Terpisah (Recommended untuk Production)**

#### **Frontend → Vercel/Netlify (GRATIS)**
#### **Backend → Railway/Render (GRATIS dengan limit)**

---

## 🎯 **OPSI 1: Vercel (Frontend) + Railway (Backend)**

### **A. Deploy Frontend ke Vercel**

1. **Persiapkan Build**
   ```bash
   npm run build
   ```
   Pastikan folder `build` sudah ada dan berisi file HTML, CSS, JS.

2. **Install Vercel CLI** (opsional, bisa pakai website)
   ```bash
   npm install -g vercel
   ```

3. **Deploy via Website Vercel**:
   - Buka https://vercel.com
   - Login dengan GitHub/GitLab/Bitbucket
   - Klik "Add New Project"
   - Import repository GitHub Anda
   - **Settings penting**:
     - **Framework Preset**: Vite
     - **Root Directory**: `.` (root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `build` ⚠️ **PENTING**: Pastikan set ke `build` bukan `dist`
     - **Install Command**: `npm install`
   
   **ATAU** gunakan file `vercel.json` yang sudah dibuat (akan auto-detect):
   - File `vercel.json` sudah ada di root project
   - Vercel akan otomatis membaca konfigurasi dari file ini
   - Tidak perlu set manual di dashboard

4. **Environment Variables** (jika ada):
   - Tambahkan di Vercel Dashboard → Settings → Environment Variables
   - Contoh: `VITE_API_URL=https://your-backend.railway.app`

5. **Update API URL di Frontend**:
   - Pastikan semua API calls menggunakan URL backend yang sudah di-deploy
   - Bisa pakai environment variable: `import.meta.env.VITE_API_URL`

---

### **B. Deploy Backend ke Railway**

1. **Persiapkan Backend**:
   - Pastikan ada file `Procfile` atau `railway.json` (akan dibuat)
   - Pastikan `requirements.txt` sudah lengkap

2. **Buat file `Procfile`** di folder `backend/`:
   ```
   web: python app.py
   ```

3. **Buat file `railway.json`** di root (opsional):
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd backend && python app.py",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

4. **Deploy ke Railway**:
   - Buka https://railway.app
   - Login dengan GitHub
   - Klik "New Project" → "Deploy from GitHub repo"
   - Pilih repository Anda
   - **Settings**:
     - **Root Directory**: `backend`
     - **Start Command**: `python app.py`
     - Railway akan auto-detect Python dan install dependencies

5. **Setup Database MySQL**:
   - Di Railway Dashboard, klik "New" → "Database" → "MySQL"
   - Railway akan generate connection string
   - Copy connection details

6. **Environment Variables di Railway**:
   - Buka project → Variables
   - Tambahkan:
     ```
     FLASK_ENV=production
     FLASK_DEBUG=False
     DATABASE_URL=<dari Railway MySQL>
     DB_HOST=<host dari Railway>
     DB_USER=<user dari Railway>
     DB_PASSWORD=<password dari Railway>
     DB_NAME=<database name>
     GOOGLE_API_KEY=<jika pakai Gemini AI>
     ```

7. **Setup Database**:
   - Jalankan SQL script dari `backend/db/setup_database.sql` di Railway MySQL
   - Bisa via Railway MySQL dashboard atau MySQL client

8. **Upload Model ML**:
   - Model harus di-upload ke Railway
   - Bisa via Railway Volume atau simpan di repo (jika < 100MB)
   - Update path di `app.py` jika perlu

9. **Dapatkan Backend URL**:
   - Railway akan generate URL seperti: `https://your-app.railway.app`
   - Update frontend untuk menggunakan URL ini

---

## 🎯 **OPSI 2: Netlify (Frontend) + Render (Backend)**

### **A. Deploy Frontend ke Netlify**

1. **Build project**:
   ```bash
   npm run build
   ```

2. **Deploy via Netlify**:
   - Buka https://netlify.com
   - Login dengan GitHub
   - Klik "Add new site" → "Import an existing project"
   - Pilih repository
   - **Build settings**:
     - **Build command**: `npm run build`
     - **Publish directory**: `build`
   - Klik "Deploy site"

3. **Environment Variables**:
   - Site settings → Environment variables
   - Tambahkan `VITE_API_URL`

---

### **B. Deploy Backend ke Render**

1. **Persiapkan Backend**:
   - Pastikan `requirements.txt` ada di `backend/`

2. **Deploy ke Render**:
   - Buka https://render.com
   - Login dengan GitHub
   - Klik "New" → "Web Service"
   - Connect repository
   - **Settings**:
     - **Name**: plantvision-backend
     - **Environment**: Python 3
     - **Build Command**: `cd backend && pip install -r requirements.txt`
     - **Start Command**: `cd backend && python app.py`
     - **Root Directory**: `backend`

3. **Setup Database**:
   - Render → "New" → "PostgreSQL" (atau MySQL jika tersedia)
   - Atau gunakan external MySQL (PlanetScale, Aiven, dll)

4. **Environment Variables**:
   - Tambahkan di Render Dashboard → Environment

---

## 🎯 **OPSI 3: VPS (DigitalOcean, AWS EC2, dll)**

### **Setup di VPS Ubuntu**

1. **SSH ke VPS**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Dependencies**:
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs

   # Install Python & pip
   apt install -y python3 python3-pip python3-venv

   # Install MySQL
   apt install -y mysql-server
   mysql_secure_installation

   # Install Nginx
   apt install -y nginx
   ```

3. **Setup Database**:
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE plantvision;
   CREATE USER 'plantvision_user'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON plantvision.* TO 'plantvision_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Clone & Setup Project**:
   ```bash
   # Install Git
   apt install -y git

   # Clone repository
   git clone <your-repo-url>
   cd "Desain Website PlantVision"

   # Setup Frontend
   npm install
   npm run build

   # Setup Backend
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Setup Nginx untuk Frontend**:
   ```bash
   nano /etc/nginx/sites-available/plantvision
   ```
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /root/Desain\ Website\ PlantVision/build;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   ```bash
   ln -s /etc/nginx/sites-available/plantvision /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

6. **Setup Systemd Service untuk Backend**:
   ```bash
   nano /etc/systemd/system/plantvision-backend.service
   ```
   ```ini
   [Unit]
   Description=PlantVision Flask Backend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/root/Desain Website PlantVision/backend
   Environment="PATH=/root/Desain Website PlantVision/backend/venv/bin"
   ExecStart=/root/Desain Website PlantVision/backend/venv/bin/python app.py

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   systemctl daemon-reload
   systemctl enable plantvision-backend
   systemctl start plantvision-backend
   ```

7. **Setup SSL dengan Let's Encrypt**:
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## 🔧 **Konfigurasi Penting**

### **1. Update API URL di Frontend**

Buat file `.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

Update `vite.config.ts` jika perlu untuk handle environment variables.

### **2. CORS di Backend**

Pastikan `CORS(app)` sudah ada di `app.py` dan allow origin frontend:
```python
CORS(app, resources={r"/*": {"origins": ["https://your-frontend.vercel.app"]}})
```

### **3. Database Migration**

Jalankan semua SQL scripts di `backend/db/`:
- `setup_database.sql`
- `setup_detection_history.sql`
- `setup_feedback.sql`

### **4. Model ML**

- Upload model ke server/cloud storage
- Update path di `app.py`
- Pastikan TensorFlow compatible dengan server

---

## 📝 **Checklist Sebelum Deploy**

- [ ] Build frontend berhasil (`npm run build`)
- [ ] Backend bisa jalan lokal (`python app.py`)
- [ ] Database sudah setup dan bisa connect
- [ ] Environment variables sudah diset
- [ ] Model ML sudah di-upload
- [ ] CORS sudah dikonfigurasi
- [ ] API URL di frontend sudah di-update
- [ ] File upload folder (`uploads/`) sudah ada permission write

---

## 🆘 **Troubleshooting**

### **Frontend tidak load**
- Cek build output di folder `build/`
- Cek console browser untuk error
- Pastikan base URL benar

### **Backend error 500**
- Cek logs di Railway/Render/VPS
- Pastikan database connection string benar
- Pastikan semua dependencies terinstall

### **CORS Error**
- Update CORS di `app.py` dengan frontend URL
- Pastikan headers benar

### **Model tidak load**
- Cek path model di server
- Pastikan file model ada dan readable
- Cek TensorFlow version compatibility

---

## 💡 **Rekomendasi**

**Untuk Production:**
- ✅ Vercel (Frontend) + Railway (Backend) → **Paling mudah & gratis**
- ✅ Netlify (Frontend) + Render (Backend) → Alternatif bagus
- ✅ VPS → Lebih kontrol, tapi perlu maintenance

**Untuk Development:**
- Pakai local development seperti biasa
- Gunakan ngrok untuk testing webhook/API

---

## 📚 **Resources**

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Netlify Docs](https://docs.netlify.com)
- [Render Docs](https://render.com/docs)

---

**Selamat Deploy! 🎉**

