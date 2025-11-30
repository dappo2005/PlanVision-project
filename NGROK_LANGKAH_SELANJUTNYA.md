# 🚀 Ngrok - Langkah Setelah Install

## ✅ **Status Saat Ini**
- ✅ Ngrok sudah di-install
- ✅ Terminal sudah terbuka
- ⏳ Langkah selanjutnya...

---

## 📋 **Langkah Selanjutnya**

### **STEP 1: Dapatkan Auth Token**

1. **Buka browser** → https://ngrok.com
2. **Login** (atau Sign Up jika belum punya akun)
3. **Dapatkan Auth Token**:
   - Setelah login, buka: https://dashboard.ngrok.com/get-started/your-authtoken
   - **Copy auth token** (contoh: `2abc123def456ghi789jkl012mno345pq`)

---

### **STEP 2: Setup Auth Token di Terminal**

**Di terminal ngrok**, ketik:

```bash
ngrok config add-authtoken <token-anda>
```

**Contoh:**
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq
```

**Tekan Enter**

**Output yang benar:**
```
Authtoken saved to configuration file: C:\Users\...\AppData\Local\ngrok\ngrok.yml
```

**Jika muncul error**, pastikan:
- Token sudah di-copy dengan benar
- Tidak ada spasi di awal/akhir token

---

### **STEP 3: Pastikan Flask Sudah Running**

**Sebelum start ngrok**, pastikan Flask backend sudah jalan:

1. **Buka terminal/command prompt baru** (jangan tutup terminal ngrok)
2. **Jalankan Flask**:
   ```bash
   cd backend
   python app.py
   ```

3. **Tunggu sampai Flask running**:
   ```
   * Running on http://0.0.0.0:5000
   ```

**Jangan tutup terminal Flask ini!** Biarkan running.

---

### **STEP 4: Start Ngrok**

**Kembali ke terminal ngrok**, ketik:

```bash
ngrok http 5000
```

**Tekan Enter**

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

**Jangan tutup terminal ini!** Biarkan ngrok running.

---

### **STEP 5: Copy URL Ngrok**

**Dari output di atas**, copy URL di bagian **"Forwarding"**:

```
https://abc123.ngrok-free.app
```

**Simpan URL ini!** Akan dipakai di step berikutnya.

**Contoh URL ngrok:**
- `https://abc123.ngrok-free.app`
- `https://xyz789.ngrok-free.app`
- dll

---

### **STEP 6: Test Ngrok (Opsional)**

**Buka browser**, akses:
```
https://abc123.ngrok-free.app/api/health
```

**Seharusnya return JSON** dengan status "healthy" (jika endpoint `/api/health` ada).

**ATAU** test endpoint lain:
```
https://abc123.ngrok-free.app/api/login
```

---

### **STEP 7: Update Vercel**

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

### **STEP 8: Update CORS di Backend**

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

### **STEP 9: Test Website**

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

- [ ] Auth token sudah di-set (`ngrok config add-authtoken`)
- [ ] Flask sudah running di port 5000
- [ ] Ngrok sudah running (`ngrok http 5000`)
- [ ] URL ngrok sudah di-copy
- [ ] `VITE_API_URL` sudah di-update di Vercel
- [ ] CORS sudah di-update di backend
- [ ] Flask sudah di-restart
- [ ] Frontend sudah di-redeploy
- [ ] Test website berhasil

---

## 🔍 **Ngrok Web Interface**

**Buka di browser**: http://127.0.0.1:4040

**Untuk monitoring:**
- Request/response logs
- Traffic monitoring
- Connection status

---

## ⚠️ **Catatan Penting**

1. **Jangan tutup terminal ngrok dan Flask**:
   - Keduanya harus tetap running
   - Jika ditutup, backend tidak bisa diakses

2. **URL ngrok berubah setiap restart** (free plan):
   - Setiap restart ngrok, URL akan berubah
   - Harus update `VITE_API_URL` di Vercel lagi

3. **Ngrok session timeout** (free plan):
   - Session akan auto-disconnect setelah 2 jam
   - Harus restart ngrok

---

## 🆘 **Troubleshooting**

### **Ngrok tidak connect**
- Pastikan Flask sudah running di port 5000
- Cek apakah port 5000 tidak dipakai aplikasi lain
- Cek firewall Windows

### **Error "authtoken"**
- Pastikan token sudah di-copy dengan benar
- Tidak ada spasi di awal/akhir token
- Coba setup lagi: `ngrok config add-authtoken <token>`

### **CORS Error**
- Pastikan `ALLOWED_ORIGINS` sudah di-update
- Pastikan format benar (tanpa trailing slash)
- Restart Flask setelah update

---

## 🎉 **Selesai!**

Setelah semua langkah, website Anda akan jalan:
- ✅ **Frontend**: https://plant-vision-ten.vercel.app
- ✅ **Backend**: https://abc123.ngrok-free.app (via ngrok)
- ✅ **Database**: MySQL Workbench di laptop teman

**Mulai dari STEP 1: Dapatkan auth token dari ngrok.com!** 🚀


