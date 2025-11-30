# 📝 Isi Environment Variables di Render.com

## ❌ **BUKAN untuk Python Version!**

**Environment Variables** ini untuk konfigurasi aplikasi Anda, **BUKAN** untuk set Python version.

---

## ✅ **Python Version Di-Set Di Halaman Sebelumnya**

Python version biasanya di-set di halaman **"Build Settings"** atau **"Environment"** (sebelum halaman Environment Variables).

### **Cara Cek/Set Python Version:**

1. **Scroll ke atas** atau **kembali ke halaman sebelumnya**
2. **Cari bagian "Environment"** atau **"Build Settings"**
3. **Pilih "Python 3"** dari dropdown
4. **Pilih Python Version**: **3.11** atau **3.11.9** dari dropdown

**Jika tidak ada opsi Python version:**
- Render akan auto-detect dari `requirements.txt` atau `runtime.txt`
- Atau bisa set di bagian "Build Command"

---

## ✅ **Yang Harus Diisi di Environment Variables:**

Environment Variables ini untuk konfigurasi aplikasi Flask Anda. **Tambah satu per satu:**

### **1. Flask Configuration:**
```
FLASK_ENV
value: production
```

```
FLASK_DEBUG
value: False
```

```
PORT
value: 5000
```

### **2. Database Configuration** (setelah database dibuat):
```
DB_HOST
value: <host dari database>
```

```
DB_PORT
value: 5432
```
(5432 untuk PostgreSQL, atau 3306 untuk MySQL)

```
DB_USER
value: <user dari database>
```

```
DB_PASSWORD
value: <password dari database>
```

```
DB_NAME
value: <database name>
```

### **3. CORS Configuration:**
```
ALLOWED_ORIGINS
value: https://plant-vision-ten.vercel.app
```
(Ganti dengan URL Vercel Anda yang sebenarnya)

### **4. Optional (jika pakai Chat AI):**
```
GEMINI_API_KEY
value: <API key Anda>
```

---

## 📋 **Cara Tambah Environment Variable:**

1. **Klik "Add Environment Variable"** (tombol dengan icon +)
2. **Isi NAME**: contoh `FLASK_ENV`
3. **Isi value**: contoh `production`
4. **Klik "Add"** atau biarkan auto-save
5. **Ulangi** untuk setiap variable

---

## 🔍 **Cara Cek Python Version Sudah Di-Set:**

1. **Scroll ke atas** halaman ini
2. **Cari bagian "Environment"** atau **"Build Settings"**
3. **Pastikan ada**: 
   - Environment: **Python 3**
   - Python Version: **3.11** atau **3.11.9**

**Jika tidak ada:**
- Klik **"Back"** atau **"Previous"** untuk kembali ke halaman sebelumnya
- Atau cari di bagian **"Advanced"** (expand section)

---

## ⚠️ **Catatan Penting:**

1. **Python Version ≠ Environment Variables**
   - Python version di-set di Build Settings
   - Environment Variables untuk konfigurasi aplikasi

2. **Database Variables:**
   - Set database variables **SETELAH** database dibuat
   - Bisa set sekarang atau nanti (bisa update setelah deploy)

3. **Bisa Skip Dulu:**
   - Jika belum punya database, bisa skip database variables dulu
   - Bisa tambah nanti setelah database dibuat

---

## 🚀 **Langkah Selanjutnya:**

1. **Set Python Version** (di halaman sebelumnya atau Advanced)
2. **Isi Environment Variables** (yang di atas)
3. **Klik "Deploy Web Service"** (tombol hitam di bawah)
4. **Tunggu build selesai** (2-5 menit)

---

**Isi Environment Variables dengan konfigurasi aplikasi, BUKAN Python version!** 🚀

