# ✅ Install Selesai - Langkah Selanjutnya

## 🎉 **Status Saat Ini**
- ✅ Dependencies sudah terinstall (tensorflow, flask, dll)
- ✅ Virtual environment aktif (`(venv)` terlihat)
- ✅ Siap untuk jalankan Flask!

---

## 🚀 **Langkah Selanjutnya**

### **STEP 1: Jalankan Flask**

**Di terminal yang sama** (masih di folder `backend`), ketik:

```bash
python app.py
```

**Tekan Enter**

**Seharusnya Flask akan running**:
```
* Running on http://0.0.0.0:5000
```

**Jangan tutup terminal ini!** Biarkan Flask running.

---

### **STEP 2: Buka Terminal Baru untuk Ngrok**

1. **Buka terminal baru** di VSCode:
   - Klik **"+"** di tab terminal (di kanan atas terminal)
   - ATAU: `Terminal` → `New Terminal` (di menu bar)

2. **Jalankan ngrok** (di terminal baru):
   ```bash
   ngrok http 5000
   ```

3. **Copy URL ngrok** dari output:
   - Akan muncul seperti: `https://abc123.ngrok-free.app`
   - **Copy URL ini!**

---

### **STEP 3: Update Vercel**

1. **Buka Vercel Dashboard**:
   - https://vercel.com
   - Login → Pilih project Anda

2. **Update Environment Variable**:
   - Settings → Environment Variables
   - Cari atau tambahkan: `VITE_API_URL`
   - **Value**: `https://abc123.ngrok-free.app` (URL dari ngrok)
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
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://abc123.ngrok-free.app,https://plant-vision-ten.vercel.app').split(',')
```

**Ganti `abc123.ngrok-free.app`** dengan URL ngrok Anda yang sebenarnya.

**Restart Flask** setelah edit:
- Di terminal Flask, tekan `Ctrl+C` untuk stop
- Jalankan lagi: `python app.py`

---

### **STEP 5: Test Website**

1. **Buka website Vercel Anda**:
   - https://plant-vision-ten.vercel.app

2. **Coba login**:
   - Seharusnya sudah bisa connect ke backend via ngrok!

3. **Test fitur lain**:
   - Disease detection
   - Dashboard
   - dll

---

## ✅ **Checklist**

- [ ] Flask sudah running (`python app.py`)
- [ ] Flask running di port 5000
- [ ] Ngrok sudah running (`ngrok http 5000`)
- [ ] URL ngrok sudah di-copy
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] Frontend sudah di-redeploy
- [ ] CORS sudah di-update di backend
- [ ] Flask sudah di-restart
- [ ] Test website berhasil

---

## 🎯 **Sekarang**

**Mulai dari STEP 1: Jalankan Flask!**

```bash
python app.py
```

**Setelah Flask running, lanjutkan ke STEP 2: Buka terminal baru untuk ngrok!** 🚀


