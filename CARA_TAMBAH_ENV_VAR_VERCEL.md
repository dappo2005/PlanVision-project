# 📝 Cara Tambah Environment Variable di Vercel

## 🎯 **Langkah Detail**

### **STEP 1: Isi Key dan Value**

Di halaman Environment Variables yang Anda lihat:

1. **Di bagian "Key"** (kolom pertama):
   - Klik field yang kosong atau field yang ada "CLIENT_KEY..."
   - Ketik: `VITE_API_URL`
   - **Hapus** "CLIENT_KEY..." jika ada

2. **Di bagian "Value"** (kolom kedua):
   - Klik field Value yang kosong
   - Ketik: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`
   - **PENTING**: 
     - Pastikan tidak ada spasi di awal/akhir
     - Pastikan pakai `https://` (bukan `http://`)
     - Tidak ada trailing slash (`/`)

---

### **STEP 2: Set Environment (Opsional)**

**Di dropdown "Environments"**:
- Biarkan **"All Environments"** (default)
- ATAU pilih **"Production"** jika hanya untuk production

---

### **STEP 3: Save**

1. **Scroll ke bawah** (jika perlu)
2. **Klik tombol "Save"** (di kanan bawah)
3. **Tunggu sampai tersimpan**

---

### **STEP 4: Redeploy**

Setelah save, Vercel akan menampilkan:
> "A new Deployment is required for your changes to take effect."

**Redeploy frontend**:
1. **Buka tab "Deployments"** (di navigation bar atas)
2. **Klik "..."** pada deployment terbaru
3. **Pilih "Redeploy"**
4. **Tunggu sampai deployment selesai**

---

## 📋 **Langkah Visual**

```
1. Key field: Ketik "VITE_API_URL"
2. Value field: Ketik "https://scarlett-blackish-semiautomatically.ngrok-free.dev"
3. Environments: Biarkan "All Environments" (atau pilih "Production")
4. Klik "Save"
5. Redeploy frontend
```

---

## ✅ **Verifikasi**

Setelah save, cek apakah variable sudah muncul:
- Di list Environment Variables, harus ada `VITE_API_URL`
- Value harus: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`

---

## 🆘 **Jika Tidak Ada Field Kosong**

Jika semua field sudah terisi:

1. **Klik tombol "Add Another"** (dengan icon +)
2. **Field baru akan muncul**
3. **Isi Key dan Value** seperti di atas

---

## ⚠️ **Catatan Penting**

1. **Nama variable harus**: `VITE_API_URL` (huruf besar semua)
2. **Value harus lengkap**: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`
3. **Tidak ada trailing slash**: Jangan tambahkan `/` di akhir
4. **Harus redeploy**: Setelah save, harus redeploy frontend

---

**Isi Key: `VITE_API_URL` dan Value: `https://scarlett-blackish-semiautomatically.ngrok-free.dev`, lalu klik Save!** 🚀


