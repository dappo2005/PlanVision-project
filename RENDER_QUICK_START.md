# ⚡ Render.com Quick Start - 10 Menit

Panduan super cepat deploy backend ke Render.com.

---

## 🚀 **Langkah Cepat**

### **1. Buat Account (1 menit)**
- Buka https://render.com
- Login dengan GitHub
- Authorize Render

### **2. Create Web Service (2 menit)**
- New + → Web Service
- Connect repository (PlanVision-project)
- **Settings**:
  - **Name**: `plantvision-backend`
  - **Root Directory**: `backend`
  - **Environment**: Python 3
  - **Python Version**: Pilih **3.11** dari dropdown ← **MUDAH!**
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `python app.py`
- Klik "Create Web Service"

### **3. Setup Database (2 menit)**
- New + → PostgreSQL (atau MySQL external)
- Copy connection details

### **4. Set Environment Variables (2 menit)**
Di service → Environment, tambahkan:
```
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
DB_HOST=<dari database>
DB_PORT=5432
DB_USER=<dari database>
DB_PASSWORD=<dari database>
DB_NAME=<dari database>
ALLOWED_ORIGINS=https://plant-vision-ten.vercel.app
```

### **5. Import Database (2 menit)**
- Export dari laptop teman
- Import ke Render database

### **6. Get Backend URL (30 detik)**
- Service → Copy URL (contoh: `https://xxx.onrender.com`)

### **7. Update Vercel (1 menit)**
- Vercel → Settings → Environment Variables
- Set `VITE_API_URL=https://xxx.onrender.com`
- Redeploy

### **8. Test (30 detik)**
- Buka `https://xxx.onrender.com/api/health`
- Buka website Vercel
- Test login

---

## ✅ **Selesai!**

**Butuh detail lebih lengkap?** Lihat `DEPLOY_RENDER_STEP_BY_STEP.md`

---

**Keuntungan Render.com:**
- ✅ Langsung pilih Python 3.11 dari dropdown
- ✅ Tidak ada masalah trial expired
- ✅ Gratis (free tier)
- ✅ Lebih mudah dari Railway

