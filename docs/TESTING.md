# Pengujian PlantVision

## Tes otomatis backend

Tes yang tersedia saat ini berfokus pada konfigurasi runtime dan keamanan
autentikasi/API. Dari root repository, jalankan:

```powershell
python -m pytest backend\tests -q
```

Tes menggunakan mock database dan melewati pemuatan model, sehingga tidak
menulis ke MySQL atau folder upload riil.

## Build frontend

Gunakan build produksi sebagai pemeriksaan TypeScript dan bundling:

```powershell
npm run build
```

## Pemeriksaan manual

1. Jalankan aplikasi mengikuti [panduan pengembangan](DEVELOPMENT.md).
2. Buka `http://localhost:5000/api/health` dan periksa status database/model.
3. Buka `http://localhost:3000`, lalu uji registrasi dan login.
4. Unggah citra daun jeruk dari halaman deteksi dan periksa hasil serta riwayat.
5. Uji feedback, berita, dan pembatasan halaman admin sesuai role akun.

Contoh health check PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```

Jangan mengandalkan akun/password bawaan dalam dokumentasi. Buat data uji sendiri
atau gunakan fixture yang didefinisikan di `backend/tests`.
