# Deploy PlantVision ke Hugging Face Spaces (Docker SDK)

Panduan men-deploy aplikasi **PlantVision** (React/Vite + Flask/TensorFlow) ke
Hugging Face Spaces menggunakan **Docker SDK**. Satu container menangani frontend
(build React) dan backend API Flask.

---

## 1. Prasyarat

- Akun [Hugging Face](https://huggingface.co/join) (free tier sudah cukup).
- MySQL **eksternal** yang bisa diakses publik. Contoh gratis:
  - [freesqldatabase.com](https://www.freesqldatabase.com) (host `sql*.freesqldatabase.com`, port `3306`)
  - [aiven.io](https://aiven.io) / [Railway](https://railway.app) MySQL
- Repo git lokal ini harus berisi semua yang dibutuhkan:
  - `Dockerfile` (multi-stage: build frontend + runtime Flask/TensorFlow CPU)
  - Model ML yang dipilih sudah di-commit dalam folder `models/`.

---

## 2. Buat Space baru di Hugging Face

1. Buka https://huggingface.co/new-space
2. Isi:
   - **Space name**: `plantvision`
   - **License**: gunakan Apache-2.0 (atau lain)
   - **SDK**: pilih **Docker**
   - **Hardware**: pilih **CPU basic** (2 vCPU · 16 GB → gratis)
   - **Space storage**: **50GB - Small** (medel ML ±64 MB, cukup)
3. Klik **Create Space**.

> Catatan: Space ber-SDK Docker berarti **seluruh folder repo ini** akan
> dikirim ke HF dan di-build dari `Dockerfile`. Karena itu model ML harus ada
> di git (sudah di-commit).

---

## 3. Siapkan database MySQL eksternal

1. Buat database di penyedia MySQL eksternal, contoh nama `plantvision_db`.
2. Simpan kredensial: **host, port, user, password, nama database**.
3. Inisialisasi schema — jalankan sekali dari lokal:

   ```powershell
   cd backend
   $env:DB_HOST="<host>"; $env:DB_PORT="3306"; $env:DB_USER="<user>"; $env:DB_PASSWORD="<password>"; $env:DB_NAME="plantvision_db"
   python setup_db.py
   ```

   Script ini membuat semua tabel + user admin/superadmin awal.

---

## 4. Push repo ke Space

Hubungkan repo lokal sebagai remote HF:

```powershell
# Ganti dengan nama user HF dan nama Space kamu
git remote add hf https://huggingface.co/spaces/<USERNAME>/plantvision
git push hf main
```

Setiap `git push hf main` berikutnya akan memicu **build ulang image** di HF.

---

## 5. Set Secrets di HF (variabel lingkungan)

Di halaman Space: **Settings → Variables and secrets** → **New secret**:

| Key                     | Nilai contoh                          | Keterangan                              |
|-------------------------|----------------------------------------|-----------------------------------------|
| `APP_ENV`               | `production`                            | Mode runtime produksi                   |
| `FLASK_ENV`             | `production`                            | Mode Flask produksi                     |
| `SECRET_KEY`            | secret acak minimal 32 karakter         | Kunci sesi aplikasi                     |
| `DB_HOST`               | `sqlXXXX.freesqldatabase.com`           | Host MySQL eksternal                    |
| `DB_PORT`               | `3306`                                 | Port MySQL                              |
| `DB_USER`               | `user`                                 | User MySQL                              |
| `DB_PASSWORD`           | `***`                                  | Password MySQL                          |
| `DB_NAME`               | `plantvision_db`                       | Nama database                           |
| `GEMINI_API_KEY`        | *(opsional)*                           | Kunci Google AI Studio untuk Chat AI    |
| `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET` | *(opsional)* | Login Google           |
| `OAUTH_REDIRECT_URI`    | `https://<USERNAME>-plantvision.hf.space/auth/google/callback` | Redirect OAuth |
| `FRONTEND_URL`          | `https://<USERNAME>-plantvision.hf.space` | URL Space untuk frontend            |
| `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_HOST` / `SMTP_PORT` | *(opsional)* | Email untuk reset password |

Tambahkan `FRONTEND_URL` juga ke daftar `ALLOWED_ORIGINS` (dipisahkan koma jika
ada lebih dari satu origin). Jangan set `USE_MOCK_DB` atau `SKIP_MODEL_LOAD` pada
produksi.

---

## 6. Verifikasi deployment

URL aplikasi: `https://<USERNAME>-plantvision.hf.space`

1. Buka `/` → halaman Landing PlantVision muncul.
2. Buka `/api/health` → harus tampil:
   ```json
   {"database":"connected","model_loaded":true,"status":"healthy",...}
   ```
   - `database: connected` artinya MySQL berhasil dihubungkan.
   - `model_loaded: true` artinya model ML termuat.
3. Login dengan akun admin yang dibuat di langkah 3, lalu coba fitur deteksi.

### Troubleshooting umum

| Gejala                        | Cek                                                             |
|-------------------------------|-----------------------------------------------------------------|
| Situs down / 500              | **Logs** di tab *Logs* Space. Gunicorn menampilkan traceback-nya. |
| `database: disconnected`      | Secrets DB salah / host tidak bisa diakses publik / IP tidak di-allowlist. |
| Build gagal                  | Telusuri log build di tab *Settings → Repo* / *Logs* Space. Model wajib ada di git (sudah di-commit). |

---

## 7. Update aplikasi berikutnya

```powershell
git push hf main
```

HF otomatis rebuild. Untuk perubahan hanya model/backend tanpa frontend,
bisa juga repack dengan `docker build` lokal lalu `docker push hf/...` — tetapi
`git push` lebih sederhana dan direkomendasikan.

---

## Informasi arsitektur (untuk debugging)

- **Frontend**: build React diproduksi ke folder `build/` saat image di-build,
  diserve oleh Flask lewat route `serve_index` (`/`) dan `serve_spa` (catch-all).
  Semua fallback API di frontend memakai URL relatif (`|| ""`), jadi tidak perlu
  `VITE_API_URL` di HF.
- **Backend**: Flask + gunicorn di `0.0.0.0:${PORT:-7860}` (HF expose port 7860).
  1 worker + 8 threads agar model (MOBILENETV2, ±25 MB) dimuat sekali.
- **Model**: `models/citrus_mobilenetv2_finetuned.h5` adalah default
  (`MODEL_FILENAME`). Ganti dengan
  `models/citrus_efficientnet_finetuned.h5` lewat secret `MODEL_FILENAME`.
- **Storage**: gambar upload disimpan di `/app/backend/uploads` di dalam container
  (EPHEMERAL — hilang saat restart Space). Gunakan Space Persistent Storage jika
  ingin menyimpan DB/citra permanen.
