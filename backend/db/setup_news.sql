-- =====================================================
-- Setup News System untuk PlantVision
-- Table: News (Berita/Artikel)
-- =====================================================

USE plantvision_db;

-- Drop existing table if exists
DROP TABLE IF EXISTS News;

-- =====================================================
-- Tabel News: Menyimpan artikel berita
-- =====================================================
CREATE TABLE News (
    news_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT,
    
    -- Categorization
    category ENUM('teknologi', 'budidaya', 'pasar', 'penelitian') NOT NULL DEFAULT 'teknologi',
    
    -- Media & Links
    image_url VARCHAR(500),
    external_url VARCHAR(500),  -- URL berita eksternal jika ada
    
    -- Author & Metadata
    author VARCHAR(100),
    read_time VARCHAR(20),  -- e.g., "5 menit"
    
    -- Publication
    is_published TINYINT(1) DEFAULT 1,
    created_by INT,  -- User ID (admin) yang membuat
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relations
    FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE SET NULL,
    
    -- Indexes untuk performance
    INDEX idx_category (category),
    INDEX idx_published (is_published, created_at DESC),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert sample news data
-- =====================================================
INSERT INTO News (title, excerpt, content, category, image_url, author, read_time, is_published) VALUES
('Teknologi AI Meningkatkan Deteksi Penyakit Citrus Greening Hingga 95%', 
 'Penelitian terbaru menunjukkan bahwa kombinasi machine learning dan sensor IoT dapat mendeteksi Huanglongbing lebih awal, memberikan waktu lebih banyak untuk penanganan.',
 'Penelitian terbaru menunjukkan bahwa kombinasi machine learning dan sensor IoT dapat mendeteksi Huanglongbing lebih awal. Teknologi ini memungkinkan petani untuk mengidentifikasi penyakit pada tahap awal dengan akurasi hingga 95%, memberikan waktu lebih banyak untuk penanganan yang efektif.',
 'teknologi',
 'https://images.unsplash.com/photo-1642519561465-d9c699d2dddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'Dr. Ahmad Suryanto',
 '5 menit',
 1),

('Harga Jeruk Lokal Naik 30% Menjelang Musim Panen Raya',
 'Petani jeruk di Kabupaten Batu optimis dengan kenaikan harga yang mencapai Rp 8.000-10.000 per kg di pasar lokal. Permintaan ekspor juga meningkat signifikan.',
 'Petani jeruk di Kabupaten Batu optimis dengan kenaikan harga yang mencapai Rp 8.000-10.000 per kg di pasar lokal. Permintaan ekspor juga meningkat signifikan terutama ke negara-negara Asia Tenggara dan Jepang.',
 'pasar',
 'https://images.unsplash.com/photo-1741012253484-43b5b9b99491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'Budi Hartono',
 '4 menit',
 1),

('Metode Pangkas Santai Tingkatkan Produktivitas Jeruk Hingga 40%',
 'Teknik pemangkasan baru yang dikembangkan IPB University terbukti meningkatkan jumlah buah per pohon tanpa mengurangi kualitas. Metode ini lebih hemat tenaga dan waktu.',
 'Teknik pemangkasan baru yang dikembangkan IPB University terbukti meningkatkan jumlah buah per pohon tanpa mengurangi kualitas. Metode ini lebih hemat tenaga dan waktu, serta dapat diterapkan oleh petani dengan mudah.',
 'budidaya',
 'https://images.unsplash.com/photo-1730810618606-9a3f016d826d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'Prof. Siti Aminah',
 '6 menit',
 1),

('Penemuan Varietas Jeruk Tahan HLB dari Hasil Penelitian 10 Tahun',
 'BPTP Jawa Timur berhasil mengembangkan varietas jeruk baru yang memiliki ketahanan tinggi terhadap penyakit Huanglongbing (HLB) yang selama ini menjadi momok petani.',
 'BPTP Jawa Timur berhasil mengembangkan varietas jeruk baru yang memiliki ketahanan tinggi terhadap penyakit Huanglongbing (HLB). Varietas ini merupakan hasil penelitian selama 10 tahun dan telah diuji di berbagai kondisi lahan.',
 'penelitian',
 'https://images.unsplash.com/photo-1741012253484-43b5b9b99491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
 'Dr. Agus Wijaya',
 '7 menit',
 1);

-- =====================================================
-- Verification queries
-- =====================================================
SELECT 'News table created successfully' AS status;
SELECT COUNT(*) as total_news FROM News;
SELECT news_id, title, category, author, created_at FROM News ORDER BY created_at DESC;
