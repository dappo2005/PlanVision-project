# ✅ Ngrok Sudah Running - Langkah Selanjutnya

## 🎉 **Status Saat Ini**
- ✅ Ngrok sudah running
- ✅ URL ngrok: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`
- ✅ Forwarding ke: `http://localhost:5000`

---

## 📋 **Langkah Selanjutnya**

### **STEP 1: Pastikan Flask Sudah Running**

**Buka terminal baru** (jangan tutup terminal ngrok), jalankan:

```bash
cd backend
python app.py
```

**Tunggu sampai Flask running**:
```
* Running on http://0.0.0.0:5000
```

**Jangan tutup terminal Flask ini!** Biarkan running.

---

### **STEP 2: Test Ngrok (Opsional)**

**Buka browser**, akses:
```
https://scarlett-blackish-semiautomatically.ngrok-free.dev/api/health
```

**Seharusnya return JSON** dengan status "healthy" (jika endpoint `/api/health` ada).

**ATAU** test endpoint lain:
```
https://scarlett-blackish-semiautomatically.ngrok-free.dev/api/login
```

---

### **STEP 3: Update Vercel**

1. **Buka Vercel Dashboard**:
   - https://vercel.com
   - Login → Pilih project Anda

2. **Update Environment Variable**:
   - Settings → Environment Variables
   - Cari atau tambahkan: `VITE_API_URL`
   - **Value**: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`
   - **PENTING**: 
     - Pastikan tidak ada trailing slash (`/`)
     - Pastikan pakai `https://` (bukan `http://`)
   - Klik **"Save"**

3. **Redeploy Frontend**:
   - Tab "Deployments"
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - Atau push commit baru (auto-deploy)

---

### **STEP 4: Update CORS di Backend**

**Di laptop teman**, edit `backend/app.py`:

**Cari bagian CORS** (sekitar line 24-28), update menjadi:

```python
# Update ALLOWED_ORIGINS dengan URL ngrok dan Vercel
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://scarlett-blackish-semiautomatically.ngrok-free.dev,https://plant-vision-ten.vercel.app').split(',')
```

**Ganti `plant-vision-ten.vercel.app`** dengan URL Vercel Anda yang sebenarnya.

**Restart Flask** setelah edit:
- Di terminal Flask, tekan `Ctrl+C` untuk stop
- Jalankan lagi: `python app.py`

---

### **STEP 5: Test Website**

1. **Buka website Vercel Anda**:
   - https://plant-vision-ten.vercel.app (atau URL Vercel Anda)

2. **Coba login**:
   - Seharusnya sudah bisa connect ke backend via ngrok!

3. **Test fitur lain**:
   - Disease detection
   - Dashboard
   - dll

---

## ✅ **Checklist**

- [ ] Flask sudah running di port 5000
- [ ] Ngrok sudah running (jangan tutup terminal!)
- [ ] URL ngrok sudah di-copy: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] Frontend sudah di-redeploy
- [ ] CORS sudah di-update di backend
- [ ] Flask sudah di-restart
- [ ] Test website berhasil

---

## ⚠️ **Catatan Penting**

1. **Jangan tutup terminal ngrok dan Flask**:
   - Keduanya harus tetap running
   - Jika ditutup, backend tidak bisa diakses

2. **URL ngrok berubah setiap restart** (free plan):
   - Setiap restart ngrok, URL akan berubah
   - Harus update `VITE_API_URL` di Vercel lagi

3. **Ngrok session timeout** (free plan):
   - Session akan auto-disconnect setelah beberapa waktu
   - Harus restart ngrok jika disconnect

---

## 🎉 **Selesai!**

Setelah semua langkah, website Anda akan jalan:
- ✅ **Frontend**: https://plant-vision-ten.vercel.app
- ✅ **Backend**: https://scarlett-blackish-semiautomatically.ngrok-free.dev (via ngrok)
- ✅ **Database**: MySQL Workbench di laptop teman

**Lanjutkan ke STEP 1: Pastikan Flask sudah running!** 🚀


