-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS plantvision_db;

-- Use the database
USE plantvision_db;

-- SAFE MODE: Non-destructive setup - tidak menghapus data existing
-- Jika tabel sudah ada, tidak akan di-drop. Gunakan MIGRATE_TO_DETECTION_HISTORY.sql dengan --force untuk reset paksa.

CREATE TABLE IF NOT EXISTS User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status_akun VARCHAR(20) DEFAULT 'active',
    accept_terms TINYINT(1) DEFAULT 0,
    provider VARCHAR(20) DEFAULT 'local',
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expiry DATETIME DEFAULT NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrasi aman untuk tabel yang sudah ada (lekukan kolom baru bila belum ada)
SET @dbname = DATABASE();
SET @has_provider = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='User' AND COLUMN_NAME='provider');
SET @sql = IF(@has_provider=0, 'ALTER TABLE User ADD COLUMN provider VARCHAR(20) DEFAULT ''local''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_reset_token = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='User' AND COLUMN_NAME='reset_token');
SET @sql = IF(@has_reset_token=0, 'ALTER TABLE User ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_reset_expiry = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='User' AND COLUMN_NAME='reset_token_expiry');
SET @sql = IF(@has_reset_expiry=0, 'ALTER TABLE User ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create the DetectionHistory table for storing ML detection results (aman: IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS DetectionHistory (
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
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, detection_date DESC)
);