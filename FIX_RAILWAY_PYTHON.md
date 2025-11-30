# 🔧 Fix: Railway Masih Pakai Python 3.13

## ❌ **Masalah**
Railway masih menggunakan Python 3.13.9 meskipun sudah ada `runtime.txt`. Railway Nixpacks kadang tidak membaca `runtime.txt` dengan benar.

---

## ✅ **Solusi: Set Environment Variable di Railway**

Cara paling reliable adalah set langsung di Railway Dashboard:

### **Langkah:**

1. **Buka Railway Dashboard**
   - Klik service "PlanVision-project"

2. **Buka tab "Variables"** (di sidebar kiri)

3. **Klik "New Variable"**

4. **Tambahkan Environment Variable:**
   - **Key**: `PYTHON_VERSION`
   - **Value**: `3.11.9`
   - Klik **"Add"**

5. **Railway akan otomatis redeploy** dengan Python 3.11.9

---

## ✅ **Alternatif: File `.python-version`**

File `backend/.python-version` sudah dibuat dengan isi `3.11.9`.

**Commit dan push:**
```bash
git add backend/.python-version
git commit -m "Fix: Add .python-version for Railway"
git push
```

Tapi cara **paling reliable tetap set environment variable** di Railway dashboard.

---

## 📝 **Setelah Set Environment Variable**

1. **Railway akan auto-redeploy**
2. **Cek build logs** - harus muncul: `python 3.11.9` (bukan 3.13.9)
3. **TensorFlow seharusnya bisa di-install**
4. **Build seharusnya berhasil**

---

## 🆘 **Jika Masih Error**

1. **Pastikan environment variable `PYTHON_VERSION=3.11.9` sudah di-set**
2. **Cek di tab "Variables"** - harus ada `PYTHON_VERSION`
3. **Manual redeploy** jika perlu (klik "Redeploy" di tab "Deployments")
4. **Cek logs** untuk konfirmasi Python version

---

**Cara tercepat: Set `PYTHON_VERSION=3.11.9` di Railway Variables!** 🚀

