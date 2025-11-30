-- Fix News table column sizes
-- Perbesar image_url dan external_url untuk menampung URL yang lebih panjang

USE plantvision_db;

-- Ubah image_url dari VARCHAR(500) ke TEXT
ALTER TABLE News MODIFY COLUMN image_url TEXT NULL;

-- Ubah external_url dari VARCHAR(500) ke TEXT (opsional, preventif)
ALTER TABLE News MODIFY COLUMN external_url TEXT NULL;

SELECT 'News table columns successfully updated!' as status;
