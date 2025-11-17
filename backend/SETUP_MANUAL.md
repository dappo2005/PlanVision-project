# 🔧 CARA SETUP DATABASE (Manual - Paling Mudah!)

## Problem:
MySQL command tidak ada di PATH Windows → Script .bat error

## ✅ SOLUSI TERMUDAH: Gunakan MySQL Workbench

### **STEP 1: Buka MySQL Workbench**
1. Buka aplikasi **MySQL Workbench**
2. Connect ke database lokal Anda (root@localhost)
3. Masukkan password: `D@ffa_2005`

### **STEP 2: Pilih Database**
Di query editor, jalankan:
```sql
USE plantvision_db;
```

### **STEP 3: Copy-Paste Query Berikut**

```sql
-- Drop tabel lama jika ada (aman, tabel baru)
DROP TABLE IF EXISTS DetectionHistory;

-- Buat tabel DetectionHistory
CREATE TABLE DetectionHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    disease_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, detection_date DESC)
);

-- Verifikasi
SHOW TABLES;
DESCRIBE DetectionHistory;
```

### **STEP 4: Execute (Ctrl+Shift+Enter)**
Klik tombol ⚡ **Execute** atau tekan `Ctrl+Shift+Enter`

### **Expected Output:**
```
Query OK, 0 rows affected
Query OK, 0 rows affected

Tables_in_plantvision_db
------------------------
User
DetectionHistory

Field            Type          Null  Key  Default
----------------------------------------------------
id               int           NO    PRI  NULL
user_id          int           NO    MUL  NULL
image_path       varchar(255)  NO         NULL
disease_name     varchar(100)  NO         NULL
confidence       decimal(5,2)  NO         NULL
severity         varchar(20)   NO         NULL
...
```

---

## ✅ ALTERNATIF: Gunakan Command Line (jika mau repot)

### **Opsi A: Tambah MySQL ke PATH**

1. **Buka System Properties:**
   - Tekan `Win + R`
   - Ketik: `sysdm.cpl`
   - Tab "Advanced" → "Environment Variables"

2. **Edit PATH:**
   - Di "System variables", pilih `Path`
   - Klik "Edit"
   - Klik "New"
   - Tambahkan: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
   - Klik OK semua

3. **Restart PowerShell** (tutup dan buka lagi)

4. **Test:**
   ```powershell
   mysql --version
   ```

5. **Jalankan script:**
   ```powershell
   cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"
   .\SETUP_DETECTION_TABLE.bat
   ```

---

### **Opsi B: Gunakan Full Path (tanpa tambah PATH)**

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"

# Run setup
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -hlocalhost -uroot -pD@ffa_2005 plantvision_db < setup_detection_history.sql

# Verify
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -hlocalhost -uroot -pD@ffa_2005 plantvision_db -e "SHOW TABLES;"
```

---

## 🎯 SETELAH TABEL DIBUAT:

### **Verify berhasil:**
```sql
USE plantvision_db;
SELECT COUNT(*) FROM DetectionHistory;  -- Should return 0 (empty table)
```

### **Lanjut ke langkah berikutnya:**
1. ✅ Tabel database sudah siap
2. 🚀 Jalankan backend Flask:
   ```powershell
   cd backend
   conda activate planvision-ml
   python app.py
   ```
3. 🎨 Jalankan frontend React:
   ```powershell
   npm run dev
   ```
4. 📸 Test upload foto di browser!

---

## ❓ Troubleshooting:

### Error: "Unknown column 'id' in User table"
Artinya tabel User punya primary key dengan nama lain (misal `user_id`).

**Fix:**
```sql
-- Cek struktur User
DESCRIBE User;

-- Jika primary key namanya 'user_id', ubah foreign key:
ALTER TABLE DetectionHistory 
DROP FOREIGN KEY detecthistory_ibfk_1;

ALTER TABLE DetectionHistory 
ADD FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE;
```

### Error: "Table User doesn't exist"
Artinya tabel User belum dibuat.

**Fix:**
```sql
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status_akun VARCHAR(20) DEFAULT 'active',
    accept_terms TINYINT(1) DEFAULT 0,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**Rekomendasi: Pakai MySQL Workbench (paling gampang!)** 🎯
