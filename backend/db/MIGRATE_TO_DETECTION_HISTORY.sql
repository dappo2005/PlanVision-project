-- ===================================================================
-- MIGRATION SCRIPT: REFACTOR KE DETECTION HISTORY
-- ===================================================================
-- Script ini akan:
-- 1. Fix kolom user_id di tabel User (jika masih id)
-- 2. Recreate tabel DetectionHistory dengan schema yang benar
-- 3. Backup data dari DaunJeruk+Diagnosa (optional)
-- ===================================================================

USE plantvision_db;

-- 1. Backup existing User table (optional, skip jika sudah ada user_id)
-- ALTER TABLE User CHANGE COLUMN id user_id INT AUTO_INCREMENT;

-- 2. Drop dan Recreate DetectionHistory dengan schema yang benar
DROP TABLE IF EXISTS DetectionHistory;

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
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, detection_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. (Optional) Migrate data dari DaunJeruk+Diagnosa ke DetectionHistory
-- Uncomment jika ingin migrate data lama:
-- 
-- INSERT INTO DetectionHistory (user_id, image_path, disease_name, confidence, severity, description, detection_date)
-- SELECT 
--     d.user_id,
--     d.citra,
--     SUBSTRING_INDEX(SUBSTRING_INDEX(dg.hasil_deteksi, '(', 1), ' ', 1) as disease_name,
--     CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(dg.hasil_deteksi, '(', -1), '%', 1) as DECIMAL(5,2)) as confidence,
--     CASE 
--         WHEN CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(dg.hasil_deteksi, '(', -1), '%', 1) as DECIMAL(5,2)) >= 90 THEN 'tinggi'
--         WHEN CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(dg.hasil_deteksi, '(', -1), '%', 1) as DECIMAL(5,2)) >= 70 THEN 'sedang'
--         ELSE 'rendah'
--     END as severity,
--     'Migrated from old system' as description,
--     dg.created_at as detection_date
-- FROM DaunJeruk d
-- JOIN Diagnosa dg ON d.daun_id = dg.daun_id
-- WHERE d.user_id IS NOT NULL
-- ORDER BY dg.created_at DESC;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Check tabel structure:
DESCRIBE DetectionHistory;

-- Check total records:
SELECT COUNT(*) as total_history FROM DetectionHistory;

-- Check recent history:
SELECT user_id, disease_name, confidence, severity, detection_date 
FROM DetectionHistory 
ORDER BY detection_date DESC 
LIMIT 10;

SELECT "Migration script executed successfully!" as Status;
