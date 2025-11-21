-- =====================================================
-- Setup Feedback System untuk PlantVision
-- Includes: Feedback table, FeedbackResponse table
-- Supports: guest, user, superadmin roles
-- =====================================================

USE plantvision_db;

-- Drop existing tables if they exist (untuk clean setup)
DROP TABLE IF EXISTS FeedbackResponse;
DROP TABLE IF EXISTS Feedback;

-- =====================================================
-- Tabel Feedback: Menyimpan semua feedback dari user & guest
-- =====================================================
CREATE TABLE Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User Information
    user_id INT NULL,  -- NULL jika guest (tidak login)
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    
    -- Feedback Content
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category ENUM('umum', 'fitur', 'bug', 'desain', 'saran') NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    user_role ENUM('guest', 'user', 'superadmin') DEFAULT 'user',
    status ENUM('pending', 'in_review', 'resolved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL,  -- superadmin user_id yang resolve
    admin_notes TEXT NULL,  -- Catatan internal dari admin
    
    -- Tracking Code (untuk guest bisa cek status tanpa login)
    tracking_code VARCHAR(32) UNIQUE,
    
    -- Relations
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES User(user_id) ON DELETE SET NULL,
    
    -- Indexes untuk performance
    INDEX idx_user_feedback (user_id, created_at DESC),
    INDEX idx_status (status, created_at DESC),
    INDEX idx_category (category),
    INDEX idx_email (email),
    INDEX idx_tracking (tracking_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabel FeedbackResponse: Response/Notes dari Admin
-- =====================================================
CREATE TABLE FeedbackResponse (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    admin_id INT NOT NULL,
    response_text TEXT NOT NULL,
    is_internal TINYINT(1) DEFAULT 0,  -- 1 = catatan internal, 0 = balasan ke user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feedback_id) REFERENCES Feedback(feedback_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES User(user_id) ON DELETE CASCADE,
    
    INDEX idx_feedback (feedback_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Update User table untuk support role 'superadmin'
-- =====================================================
-- User table menggunakan VARCHAR, jadi tidak perlu ALTER
-- Role bisa langsung diset ke 'guest', 'user', atau 'superadmin'

-- =====================================================
-- Insert sample superadmin user (optional - untuk testing)
-- Password: admin123 (hash ini harus diganti dengan bcrypt hash yang benar)
-- =====================================================
-- INSERT INTO User (nama, email, username, password, role, status_akun, accept_terms) 
-- VALUES ('Super Admin', 'admin@plantvision.com', 'superadmin', '$2b$12$...hash...', 'superadmin', 'aktif', 1);

-- =====================================================
-- Query untuk verifikasi setup
-- =====================================================
SELECT 'Feedback table created' AS status;
SELECT 'FeedbackResponse table created' AS status;
SELECT 'User role updated to support superadmin' AS status;

-- Tampilkan struktur tabel
DESCRIBE Feedback;
DESCRIBE FeedbackResponse;
DESCRIBE User;
