# Setup Frontend untuk Connect ke Backend Remote

Backend di-host oleh: **Daffa** di IP `192.168.18.65`

## Untuk Teman-teman (Frontend Developer)

### Prerequisites
1. Pastikan terhubung ke **WiFi yang sama** dengan laptop Daffa
2. Sudah clone repository PlanVision-project
3. Sudah install Node.js dan dependencies (`npm install`)

### Cara Setup

#### Opsi 1: Ubah Base URL di Code (Manual)

Cari semua file yang menggunakan `localhost:5000` dan ganti dengan IP Daffa:

**File yang perlu diubah:**
- `src/components/DiseaseDetector.tsx`
- File komponen lain yang memanggil API

**Contoh perubahan:**
```typescript
// SEBELUM
const API_URL = "http://localhost:5000/api";

// SESUDAH (gunakan IP Daffa)
const API_URL = "http://192.168.18.65:5000/api";
```

#### Opsi 2: Gunakan Environment Variable (Recommended)

1. Buat file `.env` di root project:
```
VITE_API_URL=http://192.168.18.65:5000
```

2. Update code untuk menggunakan env variable:
```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

### Cara Menjalankan Frontend

```powershell
# Di folder root project
npm run dev
```

Frontend akan jalan di `http://localhost:5173` tapi akan connect ke backend Daffa di `192.168.18.65:5000`

### Testing Connection

Buka browser dan test endpoint:
```
http://192.168.18.65:5000/api/login
```

Jika muncul error atau tidak bisa akses, cek:
1. Apakah backend Daffa sudah jalan?
2. Apakah kita di WiFi yang sama?
3. Apakah firewall sudah diallow?

### Troubleshooting

**Error: "Network Error" atau "Failed to fetch"**
- Pastikan backend host (Daffa) sudah menjalankan `python app.py`
- Cek apakah bisa ping ke IP: `ping 192.168.18.65`
- Pastikan firewall sudah diallow (Daffa harus run `ALLOW_FIREWALL.bat` as Admin)

**CORS Error**
- Backend sudah setup CORS, harusnya tidak ada masalah
- Jika masih ada, beri tahu Daffa untuk update CORS config

**Gambar upload tidak muncul**
- Pastikan path image URL menggunakan IP remote: `http://192.168.18.65:5000/api/uploads/...`

---

## Notes untuk Collaboration

- **Backend host (Daffa)**: Harus keep laptop nyala dan backend jalan selama development
- **Database**: Semua pakai database MySQL di laptop Daffa
- **Uploads**: File upload akan tersimpan di laptop Daffa (`backend/uploads/`)
- **WiFi**: Harus selalu di network yang sama (IP akan berubah jika ganti WiFi)

**Tip:** Jika IP berubah (ganti WiFi), Daffa perlu inform IP baru dan semua update di code
