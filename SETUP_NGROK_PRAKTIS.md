# 🚀 Setup Ngrok - Panduan Praktis

## 📋 **Langkah Setup Ngrok**

### **STEP 1: Install Ngrok**

**Di Laptop Teman** (yang punya backend Flask):

#### **Windows:**
1. **Download ngrok**:
   - Buka https://ngrok.com/download
   - Download untuk Windows
   - Extract file `ngrok.exe`

2. **Tambahkan ke PATH** (opsional):
   - Copy `ngrok.exe` ke folder seperti `C:\ngrok\`
   - Atau simpan di folder project

#### **Atau via Package Manager:**
```bash
# Via Chocolatey (jika sudah install)
choco install ngrok

# Atau via Scoop
scoop install ngrok
```

---

### **STEP 2: Daftar & Dapatkan Auth Token**

1. **Buka https://ngrok.com**
2. **Sign Up** (gratis):
   - Klik "Sign up"
   - Buat akun (bisa pakai email atau GitHub)
3. **Dapatkan Auth Token**:
   - Setelah login, buka https://dashboard.ngrok.com/get-started/your-authtoken
   - **Copy auth token** (contoh: `2abc123def456ghi789jkl012mno345pq`)

---

### **STEP 3: Setup Ngrok dengan Auth Token**

**Buka Command Prompt atau PowerShell** di laptop teman:

```bash
# Setup auth token
ngrok config add-authtoken <token-anda>

# Contoh:
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq
```

**Output yang benar:**
```
Authtoken saved to configuration file: C:\Users\...\AppData\Local\ngrok\ngrok.yml
```

---

### **STEP 4: Start Ngrok untuk Flask**

**Pastikan Flask sudah running** di port 5000:

```bash
# Di laptop teman, jalankan Flask dulu
cd backend
python app.py
```

**Di terminal/command prompt baru**, jalankan ngrok:

```bash
# Start ngrok untuk expose port 5000
ngrok http 5000
```

**Output yang akan muncul:**
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy URL "Forwarding"**: `https://abc123.ngrok-free.app` ← **INI YANG DIPAKAI!**

---

### **STEP 5: Update Vercel**

1. **Buka Vercel Dashboard**:
   - https://vercel.com
   - Login → Pilih project Anda

2. **Update Environment Variable**:
   - Settings → Environment Variables
   - Cari atau tambahkan: `VITE_API_URL`
   - **Value**: `https://abc123.ngrok-free.app` (URL dari ngrok)
   - **PENTING**: Pastikan tidak ada trailing slash (`/`)
   - Klik **"Save"**

3. **Redeploy Frontend**:
   - Tab "Deployments"
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**

---

### **STEP 6: Update CORS di Backend**

**Di laptop teman**, edit `backend/app.py`:

Cari bagian CORS (sekitar line 24-28), update menjadi:

```python
# Update ALLOWED_ORIGINS dengan URL ngrok dan Vercel
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://abc123.ngrok-free.app,https://plant-vision-ten.vercel.app').split(',')
```

**Atau set via environment variable** (lebih fleksibel):

```python
# Di bagian atas app.py, setelah load_dotenv()
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')

# Di bagian CORS
if '*' in ALLOWED_ORIGINS or os.getenv('FLASK_ENV') == 'development':
    CORS(app)
else:
    CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})
```

**Restart Flask** setelah edit.

---

### **STEP 7: Test Koneksi**

1. **Test Backend via Ngrok**:
   - Buka browser
   - Akses: `https://abc123.ngrok-free.app/api/health`
   - Seharusnya return JSON dengan status "healthy"

2. **Test Frontend**:
   - Buka website Vercel Anda
   - Coba login
   - Seharusnya sudah bisa connect ke backend!

---

## 🔍 **Ngrok Web Interface**

Ngrok punya web interface untuk monitoring:

- **URL**: http://127.0.0.1:4040
- Buka di browser untuk lihat:
  - Request/response logs
  - Traffic monitoring
  - Connection status

---

## ⚠️ **Catatan Penting**

### **1. URL Ngrok Berubah Setiap Restart (Free Plan)**

**Masalah**: Setiap restart ngrok, URL akan berubah.

**Solusi**:
- **Update `VITE_API_URL` di Vercel** setiap kali restart ngrok
- **ATAU** pakai ngrok paid plan ($8/month) untuk static URL

### **2. Ngrok Free Plan Limitations**

- **Session timeout**: 2 jam (akan auto-disconnect)
- **URL berubah** setiap restart
- **Rate limiting**: Ada limit request per menit

### **3. Laptop Teman Harus Selalu Online**

- Flask harus running (`python app.py`)
- Ngrok harus running (`ngrok http 5000`)
- Jika laptop mati/offline, backend tidak bisa diakses

---

## 🎯 **Tips**

1. **Jalankan ngrok di background**:
   ```bash
   # Windows (PowerShell)
   Start-Process ngrok -ArgumentList "http 5000"
   ```

2. **Buat script untuk auto-start**:
   ```batch
   @echo off
   echo Starting Flask...
   cd backend
   start "Flask" python app.py
   timeout /t 3
   echo Starting ngrok...
   start "Ngrok" ngrok http 5000
   ```

3. **Monitor ngrok status**:
   - Buka http://127.0.0.1:4040
   - Cek apakah masih connected

---

## ✅ **Checklist**

- [ ] Ngrok sudah di-install
- [ ] Auth token sudah di-set
- [ ] Ngrok sudah running (`ngrok http 5000`)
- [ ] URL ngrok sudah di-copy
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] CORS sudah di-update di backend
- [ ] Flask sudah di-restart
- [ ] Frontend sudah di-redeploy
- [ ] Test koneksi berhasil

---

## 🆘 **Troubleshooting**

### **Ngrok tidak connect**
- Cek apakah Flask sudah running di port 5000
- Cek apakah port 5000 tidak dipakai aplikasi lain
- Cek firewall Windows

### **CORS Error**
- Pastikan `ALLOWED_ORIGINS` sudah di-update dengan URL ngrok dan Vercel
- Pastikan format benar (tanpa trailing slash)
- Restart Flask setelah update

### **URL ngrok tidak bisa diakses**
- Cek apakah ngrok masih running
- Cek ngrok web interface (http://127.0.0.1:4040)
- Restart ngrok jika perlu

---

## 🎉 **Selesai!**

Setelah semua langkah, website Anda akan jalan:
- ✅ **Frontend**: https://plant-vision-ten.vercel.app
- ✅ **Backend**: https://abc123.ngrok-free.app (via ngrok)
- ✅ **Database**: MySQL Workbench di laptop teman

**Ini solusi paling sederhana jika Render/Railway gagal!** 🚀

---

**Mulai dari STEP 1: Install ngrok di laptop teman!**


