# 🚀 Solusi Sederhana: Vercel + Backend di Laptop Teman

## ✅ **Solusi Paling Sederhana**

Karena Render dan Railway gagal, **solusi paling mudah** adalah:

1. **Frontend tetap di Vercel** (sudah ada)
2. **Backend tetap di laptop teman** (Flask + MySQL Workbench)
3. **Pakai ngrok** untuk expose backend ke internet

---

## 🎯 **Setup Ngrok (5 Menit)**

### **Di Laptop Teman** (yang punya backend):

1. **Install ngrok**:
   - Download dari https://ngrok.com/download
   - Atau via package manager

2. **Daftar ngrok** (gratis):
   - Buat akun di https://ngrok.com
   - Dapatkan auth token

3. **Setup ngrok**:
   ```bash
   ngrok config add-authtoken <token-anda>
   ```

4. **Start ngrok untuk Flask**:
   ```bash
   ngrok http 5000
   ```

5. **Dapatkan Public URL**:
   - Ngrok akan generate: `https://abc123.ngrok-free.app`
   - **Copy URL ini!**

---

## 🌐 **Update Vercel**

1. **Buka Vercel Dashboard**:
   - Settings → Environment Variables

2. **Set `VITE_API_URL`**:
   ```
   VITE_API_URL=https://abc123.ngrok-free.app
   ```

3. **Redeploy frontend**

---

## 🔧 **Update CORS di Backend**

**Di laptop teman**, edit `backend/app.py`:

```python
# Update ALLOWED_ORIGINS dengan URL ngrok dan Vercel
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://abc123.ngrok-free.app,https://plant-vision-ten.vercel.app').split(',')
```

**Restart Flask**

---

## ✅ **Selesai!**

Website akan jalan:
- ✅ **Frontend**: https://plant-vision-ten.vercel.app
- ✅ **Backend**: https://abc123.ngrok-free.app (via ngrok)
- ✅ **Database**: MySQL Workbench di laptop teman

---

## ⚠️ **Catatan**

1. **URL ngrok berubah setiap restart** (free plan):
   - Setiap restart ngrok, harus update `VITE_API_URL` di Vercel
   - Solusi: Pakai ngrok paid plan untuk static URL

2. **Laptop teman harus selalu online**:
   - Flask harus running
   - ngrok harus running

3. **Ini untuk testing/development**:
   - Untuk production, lebih baik deploy backend ke cloud

---

## 🎯 **Alternatif: Pakai ngrok dengan Static URL**

**Ngrok paid plan** ($8/month) punya static URL:
- URL tidak berubah setiap restart
- Lebih stabil untuk production

---

**Ini solusi paling sederhana jika Render/Railway gagal!** 🚀


