# 📝 FEEDBACK SYSTEM - PlantVision

## 🎯 Overview
Sistem feedback lengkap untuk PlantVision dengan support untuk 3 role:
- **Guest**: User tanpa login, bisa kirim feedback dengan tracking code
- **User (Petani)**: User terdaftar, feedback tersimpan dengan profil
- **Superadmin**: Akses penuh untuk manage semua feedback

---

## 🗂️ Database Schema

### Tabel: `Feedback`
```sql
CREATE TABLE Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,  -- NULL untuk guest
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category ENUM('umum', 'fitur', 'bug', 'desain', 'saran') NOT NULL,
    message TEXT NOT NULL,
    user_role ENUM('guest', 'user', 'superadmin') DEFAULT 'user',
    status ENUM('pending', 'in_review', 'resolved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL,
    admin_notes TEXT NULL,
    tracking_code VARCHAR(32) UNIQUE
);
```

### Tabel: `FeedbackResponse`
```sql
CREATE TABLE FeedbackResponse (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    admin_id INT NOT NULL,
    response_text TEXT NOT NULL,
    is_internal TINYINT(1) DEFAULT 0,  -- 1 = internal note, 0 = balasan ke user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES Feedback(feedback_id) ON DELETE CASCADE
);
```

---

## 🚀 Setup Instructions

### 1. Setup Database
```bash
cd backend/db
SETUP_FEEDBACK.bat
```
Atau manual:
```bash
mysql -u root -p < setup_feedback.sql
```

### 2. Verify Tables
```sql
USE plantvision_db;
DESCRIBE Feedback;
DESCRIBE FeedbackResponse;
DESCRIBE User;  -- Cek kolom role sudah support 'superadmin'
```

### 3. Create Superadmin User (Optional)
```sql
-- Ganti password hash dengan bcrypt hash yang benar
INSERT INTO User (nama, email, username, password, role, status_akun, accept_terms) 
VALUES ('Super Admin', 'admin@plantvision.com', 'superadmin', 'BCRYPT_HASH_HERE', 'superadmin', 'aktif', 1);
```

Generate bcrypt hash di Python:
```python
import bcrypt
password = "admin123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(hashed)
```

---

## 📡 API Endpoints

### PUBLIC ENDPOINTS

#### 1. Submit Feedback (Guest)
```http
POST /api/feedback/submit-guest
Content-Type: application/json

{
  "nama": "John Doe",
  "email": "john@example.com",
  "rating": 5,
  "category": "bug",
  "message": "Saya menemukan bug di..."
}
```

**Response:**
```json
{
  "message": "Feedback berhasil dikirim!",
  "feedback_id": 123,
  "tracking_code": "a1b2c3d4e5f6...",
  "info": "Simpan tracking code ini untuk mengecek status feedback Anda"
}
```

#### 2. Track Feedback (Guest)
```http
GET /api/feedback/track/{tracking_code}
```

**Response:**
```json
{
  "feedback_id": 123,
  "rating": 5,
  "category": "bug",
  "message": "...",
  "status": "resolved",
  "submitted_at": "2025-11-21T10:00:00",
  "resolved_at": "2025-11-22T15:30:00",
  "responses": [
    {
      "response": "Terima kasih laporannya, bug sudah diperbaiki!",
      "date": "2025-11-22T15:30:00"
    }
  ]
}
```

### USER ENDPOINTS (Authenticated)

#### 3. Submit Feedback (User)
```http
POST /api/feedback/submit
Content-Type: application/json

{
  "user_id": 1,
  "rating": 4,
  "category": "saran",
  "message": "Saya suggest fitur..."
}
```

**Response:**
```json
{
  "message": "Feedback berhasil dikirim!",
  "feedback_id": 124,
  "status": "pending",
  "created_at": "2025-11-21T10:30:00"
}
```

#### 4. Get My Feedbacks
```http
GET /api/feedback/my-feedbacks/{user_id}
```

**Response:**
```json
{
  "user_id": 1,
  "total": 5,
  "feedbacks": [
    {
      "feedback_id": 124,
      "rating": 4,
      "category": "saran",
      "message": "...",
      "status": "pending",
      "priority": "medium",
      "created_at": "2025-11-21T10:30:00",
      "admin_notes": null
    }
  ]
}
```

#### 5. Update Feedback (< 24 hours, status = pending)
```http
PUT /api/feedback/update/{feedback_id}
Content-Type: application/json

{
  "user_id": 1,
  "rating": 5,
  "category": "saran",
  "message": "Updated message..."
}
```

### ADMIN ENDPOINTS (Superadmin Only)

#### 6. Get All Feedbacks (with filters)
```http
GET /api/admin/feedbacks?admin_id=1&status=pending&category=bug&sort=date_desc&page=1&limit=20
```

**Response:**
```json
{
  "total": 50,
  "page": 1,
  "limit": 20,
  "total_pages": 3,
  "feedbacks": [...]
}
```

#### 7. Get Feedback Statistics
```http
GET /api/admin/feedbacks/stats?admin_id=1
```

**Response:**
```json
{
  "total": 1247,
  "by_status": {
    "pending": 156,
    "in_review": 89,
    "resolved": 423,
    "rejected": 12
  },
  "by_category": {
    "umum": 234,
    "fitur": 345,
    "bug": 123,
    "desain": 89,
    "saran": 456
  },
  "by_rating": {
    "5": 567,
    "4": 432,
    "3": 123,
    "2": 89,
    "1": 36
  },
  "by_user_role": {
    "guest": 345,
    "user": 892,
    "superadmin": 10
  },
  "avg_rating": 4.7,
  "recent_count": 89
}
```

#### 8. Update Feedback Status
```http
PUT /api/admin/feedbacks/{feedback_id}/status
Content-Type: application/json

{
  "admin_id": 1,
  "status": "resolved",
  "priority": "high",
  "admin_notes": "Bug sudah diperbaiki di versi 2.1"
}
```

#### 9. Add Response/Notes
```http
POST /api/admin/feedbacks/{feedback_id}/response
Content-Type: application/json

{
  "admin_id": 1,
  "response_text": "Terima kasih atas laporannya!",
  "is_internal": false
}
```

---

## 🎨 Frontend Routes

### Public Routes
- `/feedback/guest` - Guest feedback form (no login required)

### Protected Routes (User)
- `/feedback` - User feedback form (auto-fill user data)
- `/feedback/my` - User's feedback history

### Protected Routes (Superadmin)
- `/admin/feedbacks` - Admin dashboard with full feedback management

---

## 📦 File Structure

```
backend/
├── app.py                          # +800 lines (feedback endpoints added)
└── db/
    ├── setup_feedback.sql          # SQL schema
    └── SETUP_FEEDBACK.bat          # Setup automation

src/
├── App.tsx                         # Updated with new routes
└── components/
    ├── Feedback.tsx                # User feedback form (updated)
    ├── FeedbackGuest.tsx           # Guest feedback form (new)
    ├── MyFeedbacks.tsx             # User feedback history (new)
    └── admin/
        └── AdminFeedbackDashboard.tsx  # Admin panel (new)
```

---

## 🔐 Role System

### Guest
- ✅ Submit feedback tanpa login
- ✅ Dapatkan tracking code
- ✅ Track status via tracking code
- ❌ Tidak bisa edit feedback
- ❌ Tidak bisa lihat feedback lain

### User (Petani)
- ✅ Submit feedback dengan auto-fill data
- ✅ Lihat riwayat feedback sendiri
- ✅ Edit feedback (< 24 jam, status = pending)
- ✅ Track status feedback
- ❌ Tidak bisa lihat feedback user lain
- ❌ Tidak bisa akses admin panel

### Superadmin
- ✅ Lihat SEMUA feedback
- ✅ Filter by status, category, rating, user role
- ✅ Update status (pending → in_review → resolved/rejected)
- ✅ Set priority (low → medium → high → critical)
- ✅ Add admin notes
- ✅ Add response (public/internal)
- ✅ View statistics & analytics
- ✅ Search feedback by nama/email/message

---

## 🧪 Testing Guide

### 1. Test Guest Feedback
```bash
# Buka browser ke: http://localhost:5173/feedback/guest
# Isi form tanpa login
# Save tracking code
# Track via: http://localhost:5173/feedback/track/{code}
```

### 2. Test User Feedback
```bash
# Login sebagai user
# Navigate ke: /feedback
# Form auto-fill dengan data user
# Submit feedback
# Check history di: /feedback/my
```

### 3. Test Admin Panel
```bash
# Login sebagai superadmin
# Navigate ke: /admin/feedbacks
# Test filters: status, category, search
# Click "Edit" pada feedback
# Update status & add notes
# Add response (public/internal)
```

### 4. Test API dengan curl

**Submit Guest Feedback:**
```bash
curl -X POST http://localhost:5000/api/feedback/submit-guest \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Test User",
    "email": "test@example.com",
    "rating": 5,
    "category": "umum",
    "message": "Great app!"
  }'
```

**Get Admin Stats:**
```bash
curl "http://localhost:5000/api/admin/feedbacks/stats?admin_id=1"
```

---

## 🐛 Troubleshooting

### Error: "Koneksi database gagal"
```bash
# Check MySQL service
net start MySQL80

# Check database exists
mysql -u root -p
> USE plantvision_db;
> SHOW TABLES;
```

### Error: "Unauthorized. Superadmin access required"
```sql
-- Update user role to superadmin
UPDATE User SET role = 'superadmin' WHERE email = 'your@email.com';
```

### Error: Table doesn't exist
```bash
# Re-run setup
cd backend/db
mysql -u root -p < setup_feedback.sql
```

---

## 📊 Features Summary

✅ **Implemented:**
- Guest feedback (no login)
- User feedback (authenticated)
- Feedback history tracking
- Admin dashboard with filters
- Status management (pending → resolved)
- Priority system
- Response/notes system
- Statistics & analytics
- Search functionality
- Tracking code system

⭐ **Future Enhancements:**
- Email notifications
- Export to CSV/Excel
- Advanced analytics charts
- Feedback attachments (screenshots)
- Auto-assign feedback to admin
- SLA tracking
- Public feedback showcase

---

## 📝 Notes

1. **Security**: Admin endpoints verify superadmin role via `verify_superadmin()` helper
2. **Validation**: All inputs validated (rating 1-5, valid categories, etc.)
3. **Tracking**: Guest feedback gets unique 32-char hex tracking code
4. **History**: User can only edit feedback < 24 hours old with status = pending
5. **Privacy**: Internal admin notes (is_internal=1) tidak dikirim ke user

---

## 👥 Credits
Developed for PlantVision Project
Database: MySQL
Backend: Flask + Python
Frontend: React + TypeScript + Vite
