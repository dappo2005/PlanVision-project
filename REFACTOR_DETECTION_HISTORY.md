# 📊 REFACTOR: DETECTION HISTORY SYSTEM

## 🎯 Ringkasan Perubahan

Sistem penyimpanan hasil deteksi telah **di-refactor** dari pola `DaunJeruk + Diagnosa` (2 tabel, data terbatas) ke **DetectionHistory** (1 tabel, data lengkap).

---

## ✅ Keuntungan Refactor Ini

### 1. **Data Lebih Lengkap**
DetectionHistory menyimpan:
- ✅ **Disease name** (nama penyakit)
- ✅ **Confidence** (persentase akurasi deteksi)
- ✅ **Severity** (tingkat keparahan: tinggi/sedang/rendah)
- ✅ **Description** (deskripsi penyakit lengkap)
- ✅ **Symptoms** (gejala-gejala dalam format JSON array)
- ✅ **Treatment** (cara penanganan dalam format JSON array)
- ✅ **Prevention** (cara pencegahan dalam format JSON array)
- ✅ **Image path** (path gambar yang diupload)
- ✅ **Detection date** (tanggal & waktu deteksi)

**Bandingkan dengan sistem lama:**
- DaunJeruk: hanya `user_id` + `citra` (path gambar)
- Diagnosa: hanya `hasil_deteksi` (misal: "Canker (85.3%)")

### 2. **Lebih Efisien**
- ❌ **Sistem lama:** 2 tabel dengan 2x INSERT query + JOIN untuk query
- ✅ **Sistem baru:** 1 tabel dengan 1x INSERT + 1x SELECT langsung

### 3. **Fitur Riwayat Deteksi yang Komprehensif**
User bisa melihat:
- 📸 Foto daun yang pernah dideteksi
- 🩺 Hasil deteksi (penyakit + confidence)
- ⚠️ Severity level dengan color coding
- 📋 Detail lengkap (deskripsi, gejala, treatment, prevention)
- 📅 Tanggal deteksi
- 🔍 Filter berdasarkan severity

### 4. **Tidak Mengubah Akurasi ML**
⚠️ **PENTING:** Refactor ini **HANYA mengubah penyimpanan data**, bukan logika ML detection.
- Model TensorFlow tetap sama
- Preprocessing tetap sama
- Inference logic tetap sama
- **Yang berubah:** Cara menyimpan hasil ke database

---

## 📁 File yang Diubah

### 1. **Backend**

#### `backend/app.py`
**Perubahan:** Endpoint `/api/predict` sekarang simpan ke DetectionHistory dengan fallback ke DaunJeruk+Diagnosa

**Sebelum:**
```python
# Simpan ke DaunJeruk
sql_daun = "INSERT INTO DaunJeruk (user_id, citra) VALUES (%s, %s)"
cursor.execute(sql_daun, (user_id, filename))

# Simpan ke Diagnosa
hasil_text = f"{top_class} ({top_prob*100:.1f}%)"
sql_diag = "INSERT INTO Diagnosa (daun_id, hasil_deteksi) VALUES (%s, %s)"
cursor.execute(sql_diag, (daun_id, hasil_text))
```

**Sesudah:**
```python
# Simpan ke DetectionHistory dengan data lengkap
sql_history = """
    INSERT INTO DetectionHistory 
    (user_id, image_path, disease_name, confidence, severity, 
     description, symptoms, treatment, prevention)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
"""
cursor.execute(sql_history, (
    user_id, filename, top_class, top_prob * 100, severity,
    description, symptoms_json, treatment_json, prevention_json
))

# Fallback ke DaunJeruk+Diagnosa jika DetectionHistory gagal
```

**Status:** ✅ Sudah diimplementasi dengan try-except untuk backward compatibility

#### `backend/db/setup_database.sql`
**Perubahan:** Fix kolom `user_id` di tabel User (sebelumnya `id`)

**Status:** ✅ Sudah diperbaiki

#### `backend/db/MIGRATE_TO_DETECTION_HISTORY.sql` *(NEW)*
**Fungsi:** Script SQL untuk membuat tabel DetectionHistory dan (opsional) migrate data lama

**Status:** ✅ Sudah dibuat

#### `backend/db/RUN_MIGRATION.bat` *(NEW)*
**Fungsi:** Batch file untuk menjalankan migration dengan mudah (deteksi MySQL path otomatis)

**Status:** ✅ Sudah dibuat

---

### 2. **Frontend**

#### `src/components/DetectionHistory.tsx` *(NEW)*
**Fungsi:** Komponen React untuk menampilkan riwayat deteksi user

**Fitur:**
- ✅ Grid view dengan thumbnail gambar
- ✅ Badge untuk disease name dengan color coding
- ✅ Severity indicator (tinggi/sedang/rendah)
- ✅ Confidence percentage
- ✅ Filter by severity
- ✅ Modal detail dengan:
  - Gambar full size
  - Deskripsi lengkap penyakit
  - Gejala (bullet list)
  - Penanganan (checklist style)
  - Pencegahan (arrow list)
  - Tanggal deteksi

**Status:** ✅ Sudah dibuat

#### `src/App.tsx`
**Perubahan:** Tambah route `/detection-history`

```tsx
<Route 
  path="/detection-history" 
  element={
    <ProtectedRoute>
      <DetectionHistory />
    </ProtectedRoute>
  } 
/>
```

**Status:** ✅ Sudah ditambahkan

#### `src/components/Dashboard.tsx`
**Perubahan:** Tambah button "Riwayat Deteksi" di Quick Actions

**Status:** ✅ Sudah ditambahkan (dengan icon History dan gradient indigo)

---

## 🚀 Cara Menggunakan

### Step 1: Jalankan Migration Database

**Opsi A: Via Batch File (Recommended)**
```powershell
cd backend\db
.\RUN_MIGRATION.bat
```
Script akan otomatis cari MySQL di lokasi umum (XAMPP, WAMP, MySQL Server, atau PATH).

**Opsi B: Manual via MySQL Command Line**
```powershell
mysql -u root -p plantvision_db < backend\db\MIGRATE_TO_DETECTION_HISTORY.sql
```

**Apa yang Dilakukan Migration:**
1. ✅ Drop tabel DetectionHistory lama (jika ada)
2. ✅ Create tabel DetectionHistory baru dengan schema lengkap
3. ✅ Setup foreign key ke tabel User
4. ✅ Setup index untuk query yang efisien (`user_id + detection_date`)
5. ⚠️ *Opsional:* Uncomment script untuk migrate data dari DaunJeruk+Diagnosa

---

### Step 2: Restart Backend Server

```powershell
cd backend
conda activate planvision-ml
python app.py
```

Backend akan otomatis:
- ✅ Load model ML (citrus_cnn_v1.h5 atau MobileNetV2)
- ✅ Connect ke database `plantvision_db`
- ✅ Siap terima request `/api/predict` dan `/api/detection-history/<user_id>`

---

### Step 3: Test Frontend

```powershell
cd .. # kembali ke root project
npm run dev
```

**Flow Testing:**
1. Login sebagai user
2. Go to **Dashboard** → Click **"Deteksi Penyakit"**
3. Upload gambar daun jeruk
4. Submit → Lihat hasil deteksi
5. Go to **Dashboard** → Click **"Riwayat Deteksi"** (button baru warna ungu)
6. Lihat card dengan thumbnail, disease name, confidence, severity
7. Click card → Modal muncul dengan detail lengkap

**Test Filter Severity:**
- Filter "Semua" → Show all records
- Filter "Tinggi" → Show only confidence ≥ 90%
- Filter "Sedang" → Show only confidence 70-89%
- Filter "Rendah" → Show only confidence < 70%

---

## 📊 Database Schema

### DetectionHistory Table
```sql
CREATE TABLE DetectionHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                  -- FK ke User.user_id
    image_path VARCHAR(255) NOT NULL,      -- Nama file gambar
    disease_name VARCHAR(100) NOT NULL,    -- Black spot/Canker/Greening/Healthy/Melanose
    confidence DECIMAL(5, 2) NOT NULL,     -- 0.00 - 100.00
    severity VARCHAR(20) NOT NULL,         -- tinggi/sedang/rendah
    description TEXT,                      -- Deskripsi penyakit
    symptoms TEXT,                         -- JSON array gejala
    treatment TEXT,                        -- JSON array penanganan
    prevention TEXT,                       -- JSON array pencegahan
    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, detection_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Contoh Data:**
```json
{
  "id": 1,
  "user_id": 3,
  "image_path": "20251129_143052_leaf.jpg",
  "disease_name": "Canker",
  "confidence": 87.35,
  "severity": "sedang",
  "description": "Citrus Canker adalah penyakit bakteri...",
  "symptoms": ["Bercak cokelat pada daun", "Lesi berlekuk"],
  "treatment": ["Semprot bakterisida", "Buang daun terinfeksi"],
  "prevention": ["Sterilisasi alat", "Karantina tanaman baru"],
  "detection_date": "2025-11-29T14:30:52.000Z"
}
```

---

## 🔄 Backward Compatibility

### Fallback Mechanism
Jika INSERT ke `DetectionHistory` gagal (misalnya tabel belum di-migrate), backend **otomatis fallback** ke sistem lama:
```python
try:
    # INSERT to DetectionHistory
except Exception as e:
    print(f"[DetectionHistory] Error: {e}")
    # FALLBACK: INSERT to DaunJeruk + Diagnosa
```

### Tabel Lama (DaunJeruk + Diagnosa)
- ✅ **Tetap ada** di database (tidak dihapus)
- ⚠️ **Tidak digunakan** sebagai primary storage (kecuali fallback)
- 🗄️ **Opsional:** Bisa dihapus setelah yakin DetectionHistory stabil

**Rekomendasi:**
- Keep selama 1-2 minggu untuk monitoring
- Jika tidak ada error, bisa drop dengan:
  ```sql
  DROP TABLE IF EXISTS Diagnosa;
  DROP TABLE IF EXISTS DaunJeruk;
  ```

---

## 🧪 Testing Checklist

### Backend API
- [ ] `/api/predict` simpan ke DetectionHistory dengan data lengkap
- [ ] Response `/api/predict` tetap return `disease_info` dan `history_id`
- [ ] `/api/detection-history/<user_id>` return array history user
- [ ] History diurutkan dari terbaru (DESC)
- [ ] Symptoms/treatment/prevention di-parse dari JSON ke array

### Frontend UI
- [ ] Button "Riwayat Deteksi" muncul di Dashboard Quick Actions
- [ ] Route `/detection-history` accessible via button
- [ ] Grid view menampilkan cards dengan thumbnail
- [ ] Disease name badge dengan warna sesuai penyakit
- [ ] Severity badge dengan warna: merah (tinggi), kuning (sedang), hijau (rendah)
- [ ] Confidence percentage ditampilkan
- [ ] Filter severity berfungsi
- [ ] Modal detail muncul saat click card
- [ ] Modal menampilkan semua field lengkap
- [ ] Button "Kembali" redirect ke Dashboard

### Integration Test
- [ ] User bisa upload gambar → Deteksi → Lihat hasil
- [ ] Hasil deteksi tersimpan di DetectionHistory
- [ ] User bisa buka Riwayat Deteksi → Lihat history
- [ ] Click history card → Modal detail lengkap
- [ ] Filter severity → Hasil sesuai filter

---

## 📝 API Endpoints

### POST /api/predict
**Request:**
```form-data
image: file (jpg/png)
user_id: int
```

**Response:**
```json
{
  "class": "Canker",
  "confidence": "87.3%",
  "inference_time": "245.67 ms",
  "image_url": "/api/uploads/20251129_143052_leaf.jpg",
  "disease_info": {
    "description": "Citrus Canker adalah penyakit bakteri...",
    "symptoms": ["Bercak cokelat", "Lesi berlekuk"],
    "treatment": ["Semprot bakterisida", "Buang daun terinfeksi"],
    "prevention": ["Sterilisasi alat", "Karantina tanaman baru"]
  },
  "history_id": 15
}
```

### GET /api/detection-history/{user_id}
**Response:**
```json
{
  "user_id": 3,
  "total": 12,
  "history": [
    {
      "id": 15,
      "user_id": 3,
      "image_url": "/api/uploads/20251129_143052_leaf.jpg",
      "disease_name": "Canker",
      "confidence": 87.35,
      "severity": "sedang",
      "description": "Citrus Canker adalah...",
      "symptoms": ["Bercak cokelat", "Lesi berlekuk"],
      "treatment": ["Semprot bakterisida", "Buang daun terinfeksi"],
      "prevention": ["Sterilisasi alat", "Karantina tanaman baru"],
      "detection_date": "2025-11-29T14:30:52.000Z"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Error: "Table 'DetectionHistory' doesn't exist"
**Solusi:** Jalankan migration script
```powershell
cd backend\db
.\RUN_MIGRATION.bat
```

### Error: "Unknown column 'user_id' in 'field list'"
**Solusi:** Tabel User masih pakai kolom `id`, bukan `user_id`. Fix dengan:
```sql
ALTER TABLE User CHANGE COLUMN id user_id INT AUTO_INCREMENT;
```
Atau jalankan `setup_database.sql` ulang (⚠️ data akan hilang!)

### Riwayat Deteksi Kosong (padahal sudah deteksi)
**Kemungkinan:**
1. Deteksi dilakukan sebelum migration → Data masih di DaunJeruk+Diagnosa
2. user_id tidak match → Cek localStorage user_id sama dengan database

**Solusi:**
- Lakukan deteksi baru setelah migration
- Atau migrate data lama dengan uncomment script di `MIGRATE_TO_DETECTION_HISTORY.sql`

### Frontend error "Cannot read properties of undefined (reading 'symptoms')"
**Kemungkinan:** Backend return symptoms sebagai string, bukan array

**Solusi:** Pastikan backend parse JSON:
```python
symptoms = json.loads(row_data['symptoms']) if row_data['symptoms'] else []
```
(Sudah ada di code)

---

## 🎨 UI/UX Highlights

### Color Scheme untuk Disease
- **Black spot:** `bg-gray-800` (Hitam)
- **Canker:** `bg-orange-600` (Oranye)
- **Greening:** `bg-yellow-600` (Kuning)
- **Healthy:** `bg-green-600` (Hijau)
- **Melanose:** `bg-purple-600` (Ungu)

### Color Scheme untuk Severity
- **Tinggi (≥90%):** `bg-red-100 text-red-800 border-red-300`
- **Sedang (70-89%):** `bg-yellow-100 text-yellow-800 border-yellow-300`
- **Rendah (<70%):** `bg-green-100 text-green-800 border-green-300`

### Animations
- ✨ Hover card: `transform hover:-translate-y-1` + `hover:shadow-xl`
- ✨ Loading: `animate-spin` untuk spinner
- ✨ Modal: `backdrop-blur-sm` untuk blur background

---

## 📌 Next Steps (Optional Improvements)

### 1. Export History ke PDF/Excel
```tsx
// Button "Export ke PDF" di DetectionHistory.tsx
<button onClick={exportToPDF}>
  <FileText /> Export Riwayat
</button>
```

### 2. Statistics Dashboard
- Chart: Jumlah deteksi per penyakit (Pie chart)
- Chart: Confidence trend over time (Line chart)
- Badge: Most detected disease

### 3. Comparison Mode
- Pilih 2+ history → Compare side-by-side
- Lihat perbedaan symptoms, treatment, dll

### 4. Sharing History
- Generate shareable link untuk history tertentu
- Public view (tanpa login) untuk tracking code

### 5. Mobile Responsive
- Sudah responsive dengan `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Bisa ditingkatkan dengan mobile-first design

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Cek documentation ini terlebih dahulu
2. Cek console log di browser (F12)
3. Cek terminal backend untuk error message
4. Cek database dengan query:
   ```sql
   SELECT * FROM DetectionHistory ORDER BY detection_date DESC LIMIT 10;
   ```

---

## ✅ Summary

**Apa yang Berubah:**
- ✅ Penyimpanan hasil deteksi dari DaunJeruk+Diagnosa → DetectionHistory
- ✅ Data yang disimpan jauh lebih lengkap (symptoms, treatment, prevention)
- ✅ UI baru untuk melihat riwayat deteksi dengan detail lengkap
- ✅ Filter by severity untuk analisis cepat

**Apa yang TIDAK Berubah:**
- ✅ Model ML tetap sama (citrus_cnn_v1.h5 atau MobileNetV2)
- ✅ Preprocessing & inference logic tetap sama
- ✅ Akurasi deteksi tetap sama
- ✅ API response format tetap kompatibel

**Impact:**
- ✅ User experience lebih baik (riwayat lengkap & informatif)
- ✅ Database lebih efisien (1 tabel vs 2 tabel)
- ✅ Scalable untuk fitur future (analytics, export, dll)

---

**🎉 REFACTOR COMPLETED!** 🎉
