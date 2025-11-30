# 🔧 Fix: Python Version Error di Railway

## ❌ **Error yang Terjadi**

```
ERROR: Could not find a version that satisfies the requirement tensorflow==2.15.0
ERROR: No matching distribution found for tensorflow==2.15.0
```

**Penyebab**: Railway menggunakan Python 3.13.9, tapi TensorFlow 2.15.0 hanya support Python < 3.12

---

## ✅ **Solusi: Set Python ke 3.11**

### **Opsi 1: Pakai File `runtime.txt` (Recommended)**

File `backend/runtime.txt` sudah dibuat dengan isi:
```
python-3.11.9
```

**Langkah:**
1. **Commit dan push file ini**:
   ```bash
   git add backend/runtime.txt
   git commit -m "Fix: Set Python 3.11 for Railway"
   git push origin main
   ```

2. **Railway akan otomatis detect** dan menggunakan Python 3.11
3. **Railway akan auto-redeploy** dengan Python 3.11

---

### **Opsi 2: Set di Railway Settings (Alternatif)**

Jika tidak mau commit file, bisa set langsung di Railway:

1. **Buka Railway Dashboard**
2. **Klik service "PlanVision-project"**
3. **Buka tab "Settings"**
4. **Scroll ke "Build & Deploy"**
5. **Cari "Python Version" atau "Build Command"**
6. **Set Python version**:
   - Tambahkan environment variable: `PYTHON_VERSION=3.11.9`
   - Atau di build command: `python3.11 -m venv ...`

**Tapi lebih mudah pakai Opsi 1 (runtime.txt)**

---

## 📝 **Setelah Fix**

1. **Commit `runtime.txt`**:
   ```bash
   git add backend/runtime.txt
   git commit -m "Fix: Set Python 3.11 for Railway"
   git push
   ```

2. **Railway akan auto-redeploy**
3. **Cek logs** - seharusnya sekarang pakai Python 3.11
4. **Build seharusnya berhasil**

---

## ✅ **Verifikasi**

Setelah redeploy, cek build logs:
- Harus muncul: `python 3.11.9` (bukan 3.13.9)
- TensorFlow seharusnya bisa di-install
- Build seharusnya berhasil

---

## 🆘 **Jika Masih Error**

1. **Cek file `runtime.txt`** sudah di-push ke GitHub
2. **Pastikan path benar**: `backend/runtime.txt` (bukan di root)
3. **Cek Railway logs** untuk konfirmasi Python version
4. **Coba manual redeploy** di Railway dashboard

---

**Setelah fix ini, deployment seharusnya berhasil!** 🚀

