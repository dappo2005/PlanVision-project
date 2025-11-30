# ⚡ Quick Fix: Backend di Laptop Teman

## 🎯 Solusi Cepat (5 Menit)

### **Pakai Ngrok untuk Testing**

1. **Di Laptop Teman** (yang punya backend):
   ```bash
   # Install ngrok (jika belum)
   # Download dari https://ngrok.com/download
   
   # Login (daftar dulu di ngrok.com untuk dapat token)
   ngrok config add-authtoken <token-anda>
   
   # Start tunnel
   ngrok http 5000
   ```

2. **Copy URL Ngrok**:
   - Akan muncul seperti: `https://abc123.ngrok-free.app`
   - **Copy URL ini!**

3. **Update Vercel Environment Variable**:
   - Buka Vercel Dashboard → Project → Settings → Environment Variables
   - Tambahkan/Update:
     ```
     VITE_API_URL=https://abc123.ngrok-free.app
     ```
   - Klik Save
   - **Redeploy** (atau push commit baru)

4. **Update CORS di Backend** (di laptop teman):
   - Edit `backend/app.py`
   - Pastikan CORS allow origin Vercel:
     ```python
     # Di bagian atas, setelah load_dotenv()
     ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://abc123.ngrok-free.app,https://plant-vision-ten.vercel.app').split(',')
     ```
   - Restart Flask

5. **Test**:
   - Buka website Vercel Anda
   - Coba login
   - Seharusnya sudah bisa connect!

---

## ⚠️ **Catatan Penting**

- **URL ngrok berubah setiap restart** (free plan)
- Setiap restart ngrok, harus update `VITE_API_URL` di Vercel lagi
- **Laptop teman harus selalu online** dan Flask harus running
- **Ini hanya untuk testing**, tidak untuk production!

---

## ✅ **Solusi Permanen (Recommended)**

Untuk production, **deploy backend ke Railway**:
- Lihat file `SOLUSI_BACKEND_REMOTE.md` untuk panduan lengkap
- Backend akan selalu online
- Database juga di cloud
- Tidak perlu laptop teman selalu online

---

**Butuh bantuan lebih lanjut?** Lihat `SOLUSI_BACKEND_REMOTE.md` untuk opsi lengkap.

