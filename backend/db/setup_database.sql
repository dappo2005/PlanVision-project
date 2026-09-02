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
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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