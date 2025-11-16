-- Setup Database untuk PlanVision
-- Script ini AMAN - tidak akan hapus data user yang sudah ada

-- Use the database
USE plantvision_db;

-- Drop DetectionHistory table if exists (safe, karena table baru)
DROP TABLE IF EXISTS DetectionHistory;

-- Create the DetectionHistory table
-- Note: Assumes User table already exists with 'id' as primary key
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

-- Show tables to verify
SHOW TABLES;

-- Show structure
DESCRIBE DetectionHistory;
