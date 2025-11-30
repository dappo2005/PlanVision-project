# 🔧 Fix: Ngrok Command - Typo

## ❌ **Error yang Terjadi**

Anda mengetik:
```bash
ngrok htto 5000  ❌ SALAH (typo: "htto")
```

**Seharusnya**:
```bash
ngrok http 5000  ✅ BENAR
```

---

## ✅ **Command yang Benar**

**Di terminal**, ketik:

```bash
ngrok http 5000
```

**Tekan Enter**

---

## 📋 **Output yang Akan Muncul**

Setelah jalankan `ngrok http 5000`, akan muncul:

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

**Copy URL di bagian "Forwarding"**: `https://abc123.ngrok-free.app` ← **INI YANG DIPAKAI!**

---

## ⚠️ **Pastikan Flask Sudah Running**

**Sebelum jalankan ngrok**, pastikan Flask sudah running:

1. **Buka terminal lain** (jangan tutup terminal ngrok)
2. **Jalankan Flask**:
   ```bash
   cd backend
   python app.py
   ```
3. **Tunggu sampai Flask running**:
   ```
   * Running on http://0.0.0.0:5000
   ```

**Flask harus running dulu sebelum ngrok bisa connect!**

---

## 🎯 **Langkah Lengkap**

1. **Jalankan Flask** (di terminal 1):
   ```bash
   cd backend
   python app.py
   ```

2. **Jalankan ngrok** (di terminal 2):
   ```bash
   ngrok http 5000
   ```

3. **Copy URL ngrok** dari output

4. **Update Vercel** dengan URL ngrok

---

## ✅ **Setelah Ngrok Running**

1. **Jangan tutup terminal ngrok!** Biarkan running
2. **Copy URL ngrok** (contoh: `https://abc123.ngrok-free.app`)
3. **Update Vercel**:
   - Settings → Environment Variables
   - Set `VITE_API_URL=https://abc123.ngrok-free.app`
   - Redeploy frontend

---

**Coba lagi dengan command yang benar: `ngrok http 5000`** 🚀


