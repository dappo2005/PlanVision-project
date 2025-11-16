-- Quick Fix: Buat tabel DetectionHistory
-- AMAN: Tidak akan hapus data User yang sudah ada

USE plantvision_db;

-- Drop table lama jika ada
DROP TABLE IF EXISTS DetectionHistory;

-- Buat tabel baru (TANPA foreign key dulu, lebih aman)
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
    INDEX idx_user_date (user_id, detection_date DESC)
);

-- Verifikasi
SELECT 'Tabel berhasil dibuat!' AS Status;
SHOW TABLES;
DESCRIBE DetectionHistory;
