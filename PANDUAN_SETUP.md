# 🚀 PANDUAN SETUP & MENJALANKAN PLANVISION

## ✅ YANG SUDAH SELESAI:

1. ✅ **Database Schema** - Tabel `DetectionHistory` sudah dibuat
2. ✅ **Backend API** - Endpoint `/api/predict` & `/api/detection-history` sudah siap
3. ✅ **Disease Info** - Mapping rekomendasi penyakit sudah lengkap
4. ✅ **Frontend Integration** - DiseaseDetector sudah connect ke backend real API
5. ✅ **Upload Folder** - `backend/uploads/` untuk simpan gambar sudah ada

---

## 📋 LANGKAH-LANGKAH MENJALANKAN:

### **STEP 1: Setup Database**

Jalankan script SQL untuk membuat tabel baru:

```powershell
# Masuk ke MySQL
mysql -u root -p

# Pilih database
USE plantvision_db;

# Jalankan setup_database.sql
SOURCE "d:/daffa/SMT 5/RPL/PlanVision-project/backend/setup_database.sql";

# Verifikasi tabel sudah dibuat
SHOW TABLES;
DESCRIBE DetectionHistory;

# Exit MySQL
exit;
```

**ATAU** jalankan langsung dari PowerShell:

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"
mysql -u root -pD@ffa_2005 plantvision_db < setup_database.sql
```

---

### **STEP 2: Cek Model ML Sudah Ada**

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project"

# Cek apakah model sudah terlatih
ls models\efficientnet_saved\saved_model\
```

**Expected output:**
```
saved_model.pb
fingerprint.pb
keras_metadata.pb
assets/
variables/
```

✅ **Jika file-file di atas ADA** → Model siap digunakan!  
❌ **Jika TIDAK ADA** → Jalankan training dulu (lihat STEP OPSIONAL di bawah)

---

### **STEP 3: Jalankan Backend Flask**

```powershell
# Pastikan di folder backend
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"

# Activate Python environment (conda/venv)
conda activate planvision-ml
# ATAU jika pakai venv:
# ..\venv\Scripts\Activate.ps1

# Jalankan Flask
python app.py
```

**Expected output:**
```
Loading model from d:\daffa\SMT 5\RPL\PlanVision-project\models\efficientnet_saved\saved_model
Model loaded successfully!
[Backend] Connecting to MySQL DB='plantvision_db' on localhost:3306 as root
 * Running on http://127.0.0.1:5000
```

✅ **Jika muncul "Model loaded successfully!"** → Backend siap!

🚨 **Jika error:**
- `ModuleNotFoundError: No module named 'tensorflow'` → Install TF: `pip install tensorflow==2.15.0`
- `ModuleNotFoundError: No module named 'scipy'` → Install: `pip install scipy`
- Model not found → Jalankan training dulu

---

### **STEP 4: Jalankan Frontend React**

Buka terminal BARU (jangan tutup terminal Flask!):

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project"

# Install dependencies (jika belum)
npm install

# Jalankan dev server
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### **STEP 5: Test Upload & Deteksi**

1. **Buka browser:** `http://localhost:5173`
2. **Login** dengan akun yang sudah terdaftar
3. **Navigasi ke "Deteksi Penyakit"**
4. **Upload foto daun jeruk** dari folder `Citrus Leaf Disease Image/`
5. **Klik "Deteksi Penyakit"**
6. **Tunggu 2-5 detik** → Hasil akan muncul dengan rekomendasi lengkap!

---

## 🧪 TEST API MANUAL (Optional)

### Test Predict API:

```powershell
# Test dengan cURL (ganti path image sesuai lokasi Anda)
$imagePath = "d:\daffa\SMT 5\RPL\PlanVision-project\Citrus Leaf Disease Image\Canker\1.jpg"

curl.exe -X POST -F "image=@$imagePath" -F "user_id=1" http://localhost:5000/api/predict
```

### Test History API:

```powershell
# Get history untuk user_id 1
curl http://localhost:5000/api/predict/1
```

---

## 📊 FITUR YANG SUDAH BERFUNGSI:

✅ **Upload Image** → Gambar disimpan di `backend/uploads/`  
✅ **ML Detection** → Model EfficientNet prediksi 5 kelas penyakit  
✅ **Save to Database** → Histori deteksi tersimpan dengan user_id  
✅ **Disease Info** → Gejala, pengobatan, pencegahan lengkap  
✅ **Export PDF** → Laporan hasil deteksi bisa di-download  
✅ **History API** → Bisa ambil riwayat deteksi per user  

---

## 🔧 TROUBLESHOOTING:

### 1. **Backend Error: "ModuleNotFoundError"**

```powershell
# Install semua dependencies ML
cd backend
pip install -r requirements-ml.txt
```

### 2. **Frontend Error: CORS**

Sudah di-handle di backend dengan `flask_cors`. Pastikan Flask running di port 5000.

### 3. **Database Connection Failed**

Cek kredensial database di `backend/app.py` line 29-33:

```python
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_USER = 'root'
DB_PASSWORD = 'D@ffa_2005'  # Sesuaikan dengan password MySQL Anda
DB_NAME = 'plantvision_db'
```

### 4. **Model Not Found**

Jalankan training:

```powershell
cd backend
python train.py --epochs 20 --batch_size 32
```

Training займет ~10-30 menit tergantung hardware.

---

## 📂 STRUKTUR FILE BARU:

```
backend/
├── app.py                    # ✅ Updated: API predict + history
├── disease_info.py           # ✅ New: Disease recommendations mapping
├── setup_database.sql        # ✅ Updated: Added DetectionHistory table
├── uploads/                  # ✅ New: Folder untuk simpan uploaded images
└── requirements-ml.txt       # Dependencies

src/components/
└── DiseaseDetector.tsx       # ✅ Updated: Connect to real backend API
```

---

## 🎯 NEXT STEPS (Enhancement Ideas):

1. **Dashboard Histori** - Tampilkan riwayat deteksi user di Dashboard
2. **Filter & Search** - Filter histori berdasarkan tanggal/penyakit
3. **Statistics** - Chart untuk distribusi penyakit yang terdeteksi
4. **Multi-Image Upload** - Upload beberapa foto sekaligus
5. **Mobile App** - Buat versi mobile dengan React Native
6. **Real-time Notification** - Notifikasi jika terdeteksi penyakit tinggi

---

## 📞 BANTUAN:

Jika ada error, cek:
1. **Backend logs** di terminal Flask
2. **Browser console** (F12) untuk error frontend
3. **MySQL logs** jika ada masalah database

---

**Good luck! 🚀 Silakan mulai dari STEP 1 dan ikuti urutan sampai STEP 5.**
