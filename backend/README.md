# Backend PlantVision

Backend PlantVision adalah API Flask untuk autentikasi, prediksi penyakit daun
jeruk, riwayat deteksi, feedback, berita, chat AI, dan administrasi.

## Peta kode

```text
backend/
├── app.py                         entrypoint WSGI: mengekspor app
├── plantvision/
│   ├── application.py             application factory dan pemasangan blueprint
│   ├── services.py                database, model, upload, email, token, OAuth
│   └── routes/
│       ├── auth.py                akun, login, OAuth, dan reset password
│       ├── detection.py           dashboard, prediksi, riwayat, dan gambar
│       ├── feedback.py            feedback pengguna/admin dan chat AI
│       ├── admin.py               user, statistik, audit, dan aktivitas
│       ├── news.py                berita publik dan CRUD superadmin
│       └── system.py              health check dan React SPA
├── auth_security.py               sesi Bearer, role, dan ownership
├── request_security.py            rate limit dan security headers
├── runtime_config.py              satu sumber konfigurasi environment
├── disease_info.py                metadata penyakit dan rekomendasi
├── mock_db.py                     database in-memory untuk development/test
└── tests/                         pengujian kontrak dan keamanan
```

Mulailah membaca dari `app.py`, lanjut ke `plantvision/application.py`, lalu buka
modul route fitur yang ingin dipahami. Route hanya mengatur request dan response;
fungsi yang dipakai bersama berada di `plantvision/services.py`.

## Alur request

```text
Frontend
   │ HTTP request
   ▼
Flask application
   │
   ├── Security.guard()       validasi Bearer token, role, dan ownership
   ├── RequestSecurity        rate limit
   ▼
Blueprint fitur              validasi input dan jalankan use case
   ▼
Service/model/database       proses data
   ▼
JSON response + security headers
```

Endpoint terproteksi memakai header berikut:

```http
Authorization: Bearer <access_token>
```

Token diterbitkan oleh `POST /api/login`. Identitas pengguna selalu diambil dari
sesi server; field `user_id` atau `admin_id` dari client harus cocok dengan sesi.

## Alur prediksi gambar

`POST /api/predict` menerima multipart field `image`, kemudian menjalankan urutan:

1. Verifikasi ekstensi, MIME, format asli, dan batas resolusi.
2. Terapkan orientasi EXIF dan simpan ulang sebagai JPEG tanpa metadata.
3. Center-crop, resize menjadi 256 × 256, lalu ubah menjadi array model.
4. Jalankan model dan pilih probabilitas terbesar dari lima kelas.
5. Ambil deskripsi, gejala, penanganan, dan pencegahan penyakit.
6. Simpan hasil ke `DetectionHistory` dan kembalikan JSON ke frontend.

Kelas model: `Black spot`, `Canker`, `Greening`, `Healthy`, dan `Melanose`.

## Menjalankan

Dari root repository:

```powershell
python -m pip install -r backend\requirements.txt
python backend\app.py
```

Backend development berjalan pada `http://localhost:5000`. Entrypoint produksi
tetap `app:app`, sehingga konfigurasi Waitress, Gunicorn, Docker, Railway, dan
Render tidak perlu diubah.

Untuk startup development tanpa MySQL dan model besar:

```powershell
$env:APP_ENV = 'development'
$env:USE_MOCK_DB = '1'
$env:SKIP_MODEL_LOAD = '1'
python backend\app.py
```

## Endpoint utama

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/api/register` | Registrasi pengguna |
| `POST` | `/api/login` | Login dan penerbitan access token |
| `GET` | `/api/auth/me` | Profil sesi aktif |
| `POST` | `/api/logout` | Mencabut sesi |
| `POST` | `/api/predict` | Prediksi citra daun |
| `GET` | `/api/detection-history/<user_id>` | Riwayat deteksi pengguna |
| `POST` | `/api/feedback/submit` | Feedback pengguna login |
| `GET` | `/api/news` | Daftar berita |
| `POST` | `/api/chat` | Chat agronomi melalui Gemini |
| `GET` | `/api/health` | Kesiapan database dan model |

Route dengan prefix `/api/admin/` memerlukan akun `superadmin`.

## Database dan konfigurasi

`runtime_config.py` membaca dan memvalidasi seluruh environment variable sebelum
route didaftarkan. Pada staging/production, secret, database, origin, dan URL
frontend wajib valid serta mock database/debug/skip-model tidak diperbolehkan.

Siapkan database dengan:

```powershell
python backend\setup_db.py
```

## Pengujian

Gunakan virtual environment backend agar dependensi test tersedia:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
```

Tes mencakup konfigurasi fail-closed, autentikasi, role/ownership, upload,
security headers, rate limit, inventaris route, serta smoke flow
login → prediksi → riwayat.
