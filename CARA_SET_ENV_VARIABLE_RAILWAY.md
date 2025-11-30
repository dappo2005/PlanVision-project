# 📍 Cara Set Environment Variable di Railway

## 🎯 **Langkah Detail dengan Screenshot**

### **STEP 1: Buka Railway Dashboard**

1. Buka https://railway.app
2. Login dengan akun GitHub Anda
3. Pilih project **"trustworthy-fascination"** (atau nama project Anda)

---

### **STEP 2: Buka Service "PlanVision-project"**

1. Di halaman **"Architecture"**, Anda akan melihat card **"PlanVision-project"**
2. **Klik card "PlanVision-project"** (bukan tombol "Create" atau yang lain)
3. Atau klik nama service di sidebar kiri jika ada

---

### **STEP 3: Buka Tab "Variables"**

Setelah klik service "PlanVision-project", Anda akan melihat beberapa tab di **sidebar kiri**:

- **Deployments** ← (tab ini)
- **Variables** ← **KLIK INI!** ⭐
- **Metrics**
- **Settings**

**Klik tab "Variables"** (di sidebar kiri, bukan di atas)

---

### **STEP 4: Tambahkan Environment Variable**

Di halaman Variables, Anda akan melihat:

1. **List environment variables** yang sudah ada (jika ada)
2. **Tombol "New Variable"** atau **"+"** atau **"Add Variable"**
   - Biasanya di kanan atas atau di tengah halaman

3. **Klik "New Variable"**

4. **Form akan muncul**, isi:
   - **Key**: `PYTHON_VERSION`
   - **Value**: `3.11.9`
   - **Klik "Add"** atau **"Save"**

---

### **STEP 5: Verifikasi**

Setelah add, Anda akan melihat:
- Environment variable `PYTHON_VERSION=3.11.9` muncul di list
- Railway akan **otomatis trigger deployment baru**

---

## ✅ **Apakah Railway Otomatis Redeploy?**

**YA!** Railway akan **otomatis redeploy** setelah Anda:
- ✅ Add environment variable baru
- ✅ Update environment variable
- ✅ Delete environment variable

**Tidak perlu klik "Redeploy" manual!**

---

## 🔍 **Jika Tidak Ada Tab "Variables"**

Jika Anda tidak melihat tab "Variables", kemungkinan:

1. **Anda belum klik service yang benar**
   - Pastikan klik **card "PlanVision-project"** di Architecture view
   - Bukan klik project name di atas

2. **Coba refresh halaman**
   - Tekan `F5` atau reload browser

3. **Cek di Settings**
   - Kadang environment variables ada di **Settings** → **Variables**
   - Coba buka tab **"Settings"** → scroll ke bagian **"Variables"**

---

## 📝 **Alternatif: Via Settings Tab**

Jika tidak menemukan tab "Variables" yang terpisah:

1. **Klik service "PlanVision-project"**
2. **Buka tab "Settings"** (di sidebar kiri)
3. **Scroll ke bawah** → cari bagian **"Environment Variables"** atau **"Variables"**
4. **Klik "New Variable"** atau **"+"**
5. **Isi Key dan Value** seperti di atas

---

## 🎯 **Lokasi Visual**

```
Railway Dashboard
├── Project: trustworthy-fascination
│   └── Service: PlanVision-project ← KLIK INI
│       ├── Deployments (tab)
│       ├── Variables ← KLIK INI! ⭐
│       ├── Metrics (tab)
│       └── Settings (tab)
```

---

## ⚠️ **Catatan Penting**

1. **Trial Expired Warning**:
   - Jika muncul "Trial expired", Anda mungkin perlu upgrade plan
   - Tapi biasanya masih bisa set environment variables
   - Coba dulu, jika tidak bisa, mungkin perlu upgrade

2. **Setelah Add Variable**:
   - Railway akan otomatis trigger deployment
   - Cek tab **"Deployments"** untuk lihat deployment baru
   - Tunggu build selesai (1-3 menit)

3. **Verifikasi Python Version**:
   - Setelah deployment baru, cek **"Build Logs"**
   - Harus muncul: `python 3.11.9` (bukan 3.13.9)

---

## 🆘 **Troubleshooting**

### **Tidak bisa add variable karena "Trial expired"**
- Railway free trial mungkin sudah habis
- Coba upgrade ke paid plan (ada free tier juga)
- Atau coba platform lain (Render.com gratis)

### **Variable sudah di-add tapi masih Python 3.13**
- Pastikan variable name: `PYTHON_VERSION` (huruf besar semua)
- Pastikan value: `3.11.9` (dengan titik, bukan koma)
- Tunggu deployment baru selesai
- Cek build logs untuk konfirmasi

---

**Setelah add `PYTHON_VERSION=3.11.9`, Railway akan otomatis redeploy dengan Python 3.11!** 🚀

