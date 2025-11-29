# 🔐 Cara Login ke PlantVision

## Masalah: Tidak Bisa Login

Jika Anda tidak bisa login, kemungkinan penyebabnya:

1. **User belum terdaftar di database** - Anda perlu register dulu atau membuat user default
2. **Database tidak terhubung** - Pastikan MySQL server berjalan
3. **Backend menggunakan database** - Pastikan backend yang benar sedang berjalan

---

## ✅ Solusi 1: Buat User Default (Paling Mudah)

### Langkah 1: Pastikan MySQL Berjalan
```powershell
# Cek apakah MySQL service berjalan
net start MySQL80
```

### Langkah 2: Jalankan Script untuk Membuat User Default
```powershell
cd "C:\Users\ASUS\Downloads\Desain Website PlantVision\backend\scripts"
python create_default_user.py
```

Script ini akan membuat user dengan:
- **Email:** `cobasaja@example.com`
- **Password:** `admin123`
- **Username:** `cobasaja`

### Langkah 3: Login dengan Kredensial Tersebut
Gunakan email dan password di atas untuk login.

---

## ✅ Solusi 2: Register Akun Baru

Jika Anda ingin membuat akun baru:

1. Klik tab **"Daftar"** di modal login
2. Isi form registrasi:
   - Nama lengkap
   - Email
   - Nomor telepon (opsional)
   - Password (minimal 6 karakter)
   - Centang "Saya menyetujui syarat & ketentuan"
3. Klik **"Daftar"**
4. Setelah berhasil, login dengan email dan password yang baru dibuat

---

## ✅ Solusi 3: Gunakan Dev Server (Tanpa Database)

Jika Anda hanya ingin testing tanpa database:

### Langkah 1: Jalankan Dev Server
```powershell
cd "C:\Users\ASUS\Downloads\Desain Website PlantVision\backend"
python dev_server.py
```

### Langkah 2: Login dengan Email/Password Apapun
Dev server akan menerima login dengan email dan password apapun (untuk testing saja).

**Catatan:** Dev server tidak menyimpan data, hanya untuk development/testing.

---

## 🔍 Cek User yang Ada di Database

Untuk melihat user yang sudah terdaftar:

```powershell
cd "C:\Users\ASUS\Downloads\Desain Website PlantVision\backend\scripts"
python check_user.py
```

Script ini akan menampilkan semua user yang ada di database.

---

## ⚠️ Troubleshooting

### Error: "Koneksi database gagal"
- Pastikan MySQL server berjalan: `net start MySQL80`
- Pastikan database `plantvision_db` sudah dibuat
- Cek konfigurasi database di `backend/app.py`

### Error: "Username atau password salah"
- Pastikan user sudah terdaftar di database
- Gunakan script `create_default_user.py` untuk membuat user default
- Atau register akun baru melalui form registrasi

### Error: "Invalid request data"
- Pastikan semua field diisi dengan benar
- Email harus valid (mengandung @)
- Password minimal 6 karakter

---

## 📝 Informasi Login Default

Setelah menjalankan `create_default_user.py`, gunakan:

- **Email:** `cobasaja@example.com`
- **Password:** `admin123`

Atau register akun baru melalui form registrasi di website.

