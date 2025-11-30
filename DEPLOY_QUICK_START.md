# 🚀 Quick Start Deployment Guide

Panduan cepat untuk deploy PlantVision ke production.

## ⚡ Pilihan Tercepat: Vercel + Railway

### **Step 1: Deploy Frontend ke Vercel (5 menit)**

1. **Push code ke GitHub** (jika belum):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy ke Vercel**:
   - Buka https://vercel.com
   - Login dengan GitHub
   - Klik "Add New Project"
   - Import repository
   - **Settings**:
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `build`
   - Klik "Deploy"

3. **Dapatkan Frontend URL**: 
   - Contoh: `https://plantvision.vercel.app`
   - Simpan URL ini untuk step berikutnya

---

### **Step 2: Deploy Backend ke Railway (10 menit)**

1. **Buka Railway**: https://railway.app
   - Login dengan GitHub

2. **Create New Project**:
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih repository Anda

3. **Configure Service**:
   - Railway akan auto-detect Python
   - **Root Directory**: `backend`
   - **Start Command**: `python app.py`

4. **Setup MySQL Database**:
   - Di Railway Dashboard, klik "New" → "Database" → "MySQL"
   - Railway akan generate connection string otomatis

5. **Set Environment Variables**:
   - Buka project → Variables tab
   - Tambahkan:
     ```
     FLASK_ENV=production
     FLASK_DEBUG=False
     PORT=5000
     DB_HOST=<dari Railway MySQL>
     DB_USER=<dari Railway MySQL>
     DB_PASSWORD=<dari Railway MySQL>
     DB_NAME=<dari Railway MySQL>
     DB_PORT=3306
     ALLOWED_ORIGINS=https://plantvision.vercel.app
     GEMINI_API_KEY=<jika pakai Chat AI>
     ```

6. **Setup Database**:
   - Buka Railway MySQL dashboard
   - Jalankan SQL dari `backend/db/setup_database.sql`
   - Jalankan juga `setup_detection_history.sql` dan `setup_feedback.sql`

7. **Upload Model ML**:
   - Model harus ada di folder `models/` di root project
   - Atau upload via Railway Volume
   - Pastikan path di `app.py` benar

8. **Dapatkan Backend URL**:
   - Railway akan generate: `https://your-app.railway.app`
   - Simpan URL ini

---

### **Step 3: Update Frontend API URL**

1. **Di Vercel Dashboard**:
   - Buka project → Settings → Environment Variables
   - Tambahkan:
     ```
     VITE_API_URL=https://your-app.railway.app
     ```

2. **Redeploy Frontend**:
   - Klik "Redeploy" di Vercel
   - Atau push commit baru ke GitHub (auto-deploy)

---

### **Step 4: Test Deployment**

1. **Test Frontend**: Buka URL Vercel Anda
2. **Test Backend Health**: `https://your-app.railway.app/api/health`
3. **Test Login**: Coba login di frontend

---

## ✅ Checklist Final

- [ ] Frontend terdeploy di Vercel
- [ ] Backend terdeploy di Railway
- [ ] Database MySQL sudah setup
- [ ] Environment variables sudah di-set
- [ ] Model ML sudah di-upload
- [ ] API URL di frontend sudah di-update
- [ ] CORS sudah dikonfigurasi
- [ ] Health check endpoint berfungsi

---

## 🆘 Troubleshooting

### **Frontend tidak bisa connect ke backend**
- Cek `VITE_API_URL` di Vercel environment variables
- Pastikan backend URL benar (tanpa trailing slash)
- Redeploy frontend setelah update env vars

### **CORS Error**
- Update `ALLOWED_ORIGINS` di Railway dengan frontend URL
- Format: `https://plantvision.vercel.app` (tanpa trailing slash)

### **Database Error**
- Pastikan semua SQL scripts sudah dijalankan
- Cek connection string di Railway
- Pastikan database name, user, password benar

### **Model tidak load**
- Cek path model di `app.py`
- Pastikan file model ada di server
- Cek logs di Railway untuk error detail

---

## 📝 Catatan Penting

1. **Model ML**: File model bisa besar (>100MB). Railway free tier punya limit storage. Pertimbangkan:
   - Upload ke cloud storage (AWS S3, Google Cloud Storage)
   - Atau upgrade Railway plan

2. **Database**: Railway MySQL free tier punya limit. Untuk production, pertimbangkan:
   - PlanetScale (free tier bagus)
   - Aiven MySQL
   - Atau VPS dengan MySQL sendiri

3. **Environment Variables**: Jangan commit `.env` ke GitHub!

---

## 🎉 Selesai!

Website Anda sekarang sudah online! 🚀

**Frontend**: https://your-app.vercel.app  
**Backend**: https://your-app.railway.app

---

Untuk panduan lengkap, lihat `PANDUAN_HOSTING.md`

