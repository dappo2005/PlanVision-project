# Backend PlantVision

Backend adalah API Flask untuk autentikasi, inference model, riwayat deteksi,
feedback, berita, chat AI, dan administrasi pengguna.

## Struktur

```text
backend/
├── app.py                 aplikasi Flask dan endpoint API
├── auth_security.py       sesi bearer token dan proteksi role/ownership
├── runtime_config.py      validasi konfigurasi runtime
├── disease_info.py        metadata dan rekomendasi penyakit
├── mock_db.py             penyimpanan in-memory untuk development/test
├── setup_db.py            runner schema MySQL
├── db/                    schema dan migration SQL
├── scripts/               utilitas diagnostik/administrasi
├── tests/                 tes otomatis pytest
└── requirements.txt       dependencies runtime Python
```

## Menjalankan

Dari root repository:

```powershell
python -m pip install -r backend\requirements.txt
python backend\app.py
```

Backend berjalan di `http://localhost:5000`. Untuk mock database atau startup
tanpa model, lihat [panduan pengembangan](../docs/DEVELOPMENT.md).

## Endpoint penting

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/health` | Status aplikasi, database, dan model |
| `POST` | `/api/register` | Registrasi akun |
| `POST` | `/api/login` | Login dan penerbitan access token |
| `GET` | `/api/auth/me` | Profil sesi aktif |
| `POST` | `/api/logout` | Mengakhiri sesi |
| `POST` | `/api/predict` | Deteksi dari citra daun |
| `GET` | `/api/detection-history/<user_id>` | Riwayat milik pengguna |
| `GET` | `/api/news` | Daftar berita |
| `POST` | `/api/chat` | Chat AI (memerlukan konfigurasi provider) |

Endpoint admin, feedback, statistik, dan CRUD berita dapat dilihat langsung pada
route di `app.py`. Endpoint terproteksi memerlukan header
`Authorization: Bearer <access_token>` dan tetap memvalidasi role atau kepemilikan
data di server.

## Database

Siapkan kredensial melalui environment variable, pastikan database sudah ada,
lalu jalankan:

```powershell
python backend\setup_db.py
```

Script memproses schema dalam `backend/db/` dengan safe mode. Jangan menggunakan
`--force` pada database yang berisi data penting.

## Pengujian

```powershell
python -m pytest backend\tests -q
```

Lihat [panduan pengujian](../docs/TESTING.md) untuk pemeriksaan tambahan.
