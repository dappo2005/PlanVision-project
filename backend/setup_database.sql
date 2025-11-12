-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS plantvision_db;

-- Use the database
USE plantvision_db;

-- Create the User table
CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status_akun VARCHAR(20) DEFAULT 'active',
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);