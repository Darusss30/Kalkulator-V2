-- Sample Data untuk Kalkulator Biaya Konstruksi Modular
USE kalkulator_konstruksi;

-- Insert job_categories (10 kategori pekerjaan)
INSERT INTO job_categories (name, description, icon) VALUES
('Pekerjaan Persiapan', 'Pekerjaan persiapan lahan dan pembersihan', 'preparation'),
('Pekerjaan Galian, Urugan & Pondasi', 'Pekerjaan tanah, galian, urugan dan pondasi', 'foundation'),
('Pekerjaan Struktur', 'Pekerjaan struktur beton, kolom, balok, plat', 'structure'),
('Pekerjaan Pasangan & Finishing', 'Pekerjaan pasangan bata, plester, finishing', 'masonry'),
('Pekerjaan Atap', 'Pekerjaan rangka atap, genteng, dan penutup atap', 'roof'),
('Pekerjaan Plafond', 'Pekerjaan plafond gypsum, kalsiboard, dan finishing', 'ceiling'),
('Pekerjaan Pemasangan Kusen', 'Pekerjaan kusen pintu, jendela, dan hardware', 'door-window'),
('Pekerjaan Pengecatan', 'Pekerjaan cat tembok, kayu, dan finishing', 'painting'),
('Pekerjaan Mekanikal Elektrikal', 'Pekerjaan instalasi listrik, AC, dan mekanikal', 'electrical'),
('Pekerjaan Sanitair', 'Pekerjaan plumbing, sanitair, dan air bersih', 'plumbing');

-- Insert job_types (sub-item pekerjaan per kategori)
-- Pekerjaan Persiapan
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(1, 'Pembersihan Lahan', 'm2', 'Pembersihan lahan dari rumput dan semak', 100.00),
(1, 'Pengukuran dan Pematokan', 'm2', 'Pengukuran dan pematokan bangunan', 200.00),
(1, 'Pembuatan Bouwplank', 'm', 'Pembuatan bouwplank keliling bangunan', 20.00);

-- Pekerjaan Galian, Urugan & Pondasi
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(2, 'Galian Tanah Pondasi', 'm3', 'Galian tanah untuk pondasi footplate', 8.00),
(2, 'Urugan Pasir Bawah Pondasi', 'm3', 'Urugan pasir urug bawah pondasi', 12.00),
(2, 'Beton Sloff', 'm3', 'Beton sloff K-175 tebal 5-10 cm', 6.00),
(2, 'Pondasi Footplate', 'm3', 'Pondasi footplate beton K-225', 4.00);

-- Pekerjaan Struktur
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(3, 'Kolom Struktur', 'm3', 'Kolom struktur beton K-300', 3.00),
(3, 'Balok Struktur', 'm3', 'Balok struktur beton K-300', 3.50),
(3, 'Plat Lantai', 'm3', 'Plat lantai beton K-300', 4.00),
(3, 'Tangga Beton', 'm3', 'Tangga beton bertulang K-300', 2.50);

-- Pekerjaan Pasangan & Finishing
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(4, 'Pemasangan Bata', 'm2', 'Pemasangan bata 1/2 batu (pilih jenis bata)', 8.00),
(4, 'Plester Halus', 'm2', 'Plester halus 1:3 tebal 15mm', 15.00),
(4, 'Keramik Lantai', 'm2', 'Pemasangan keramik lantai 40x40', 12.00),
(4, 'Granite Tile', 'm2', 'Pemasangan granite tile 60x60', 10.00);

-- Pekerjaan Atap
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(5, 'Rangka Atap Kayu', 'm2', 'Rangka atap kayu kelas II', 6.00),
(5, 'Genteng Beton', 'm2', 'Pemasangan genteng beton flat', 25.00),
(5, 'Genteng Metal', 'm2', 'Pemasangan genteng metal multiroof', 30.00);

-- Pekerjaan Plafond
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(6, 'Plafond Gypsum', 'm2', 'Plafond gypsum 9mm + rangka hollow', 12.00),
(6, 'Plafond Kalsiboard', 'm2', 'Plafond kalsiboard 6mm + rangka hollow', 15.00);

-- Pekerjaan Pemasangan Kusen
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(7, 'Kusen Pintu Kayu', 'unit', 'Kusen pintu kayu kamper 6/12', 1.00),
(7, 'Kusen Jendela Aluminium', 'unit', 'Kusen jendela aluminium + kaca', 1.50);

-- Pekerjaan Pengecatan
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(8, 'Cat Tembok Interior', 'm2', 'Cat tembok interior 2 lapis', 25.00),
(8, 'Cat Kayu/Besi', 'm2', 'Cat kayu/besi 3 lapis', 15.00);

-- Pekerjaan Mekanikal Elektrikal
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(9, 'Instalasi Listrik', 'titik', 'Instalasi listrik per titik lampu/stop kontak', 8.00),
(9, 'Pipa PVC Listrik', 'm', 'Pemasangan pipa PVC listrik', 25.00);

-- Pekerjaan Sanitair
INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(10, 'Pipa PVC Air Bersih', 'm', 'Pemasangan pipa PVC air bersih', 20.00),
(10, 'Pipa PVC Air Kotor', 'm', 'Pemasangan pipa PVC air kotor', 15.00);

-- Insert materials (database material dan harga)
INSERT INTO materials (name, unit, price, supplier, description) VALUES
-- Material untuk Beton
('Semen Portland', 'zak', 65000, 'Semen Gresik', 'Semen portland 40kg'),
('Pasir Beton', 'm3', 350000, 'Supplier Lokal', 'Pasir beton cor kualitas baik'),
('Kerikil/Split', 'm3', 400000, 'Supplier Lokal', 'Kerikil split 1-2 cm'),
('Besi Beton 10mm', 'kg', 16000, 'Krakatau Steel', 'Besi beton ulir 10mm'),
('Besi Beton 12mm', 'kg', 16000, 'Krakatau Steel', 'Besi beton ulir 12mm'),
('Kawat Bendrat', 'kg', 25000, 'Supplier Lokal', 'Kawat bendrat untuk pengikat besi'),

-- Material untuk Pasangan
('Bata Merah', 'pcs', 1200, 'Supplier Lokal', 'Bata merah press kualitas baik'),
('Bata Putih', 'pcs', 1800, 'Supplier Lokal', 'Bata putih/hebel ringan'),
('Bata Ringan', 'pcs', 2200, 'Supplier Lokal', 'Bata ringan AAC/CLC'),
('Semen Instan', 'zak', 45000, 'Mortar Utama', 'Semen instan untuk plester'),
('Pasir Pasang', 'm3', 300000, 'Supplier Lokal', 'Pasir pasang untuk plester'),

-- Material untuk Keramik/Granite
('Keramik 40x40', 'm2', 85000, 'Roman/Platinum', 'Keramik lantai 40x40 grade A'),
('Granite Tile 60x60', 'm2', 180000, 'Granito/Roman', 'Granite tile 60x60 premium'),
('Semen Lem Keramik', 'zak', 55000, 'MU/Sika', 'Semen lem keramik 25kg'),
('Nat Keramik', 'kg', 15000, 'Supplier Lokal', 'Nat keramik warna putih'),

-- Material untuk Atap
('Kayu Kelas II', 'm3', 4500000, 'Supplier Kayu', 'Kayu meranti kelas II'),
('Genteng Beton', 'pcs', 8500, 'Monier/Kanmuri', 'Genteng beton flat warna natural'),
('Genteng Metal', 'm2', 85000, 'Multiroof/Sakura', 'Genteng metal multiroof'),
('Paku Kayu', 'kg', 18000, 'Supplier Lokal', 'Paku kayu 5-12 cm'),

-- Material untuk Plafond
('Gypsum Board 9mm', 'lembar', 85000, 'Jayaboard/Elephant', 'Gypsum board 9mm 120x240'),
('Kalsiboard 6mm', 'lembar', 95000, 'Jayaboard/Elephant', 'Kalsiboard 6mm 120x240'),
('Hollow Galvanis 4x4', 'batang', 85000, 'Supplier Lokal', 'Hollow galvanis 4x4x6m'),
('Sekrup Gypsum', 'kg', 25000, 'Supplier Lokal', 'Sekrup gypsum 25mm'),

-- Material untuk Cat
('Cat Tembok Interior', 'galon', 350000, 'Dulux/Nippon', 'Cat tembok interior premium'),
('Cat Kayu/Besi', 'galon', 450000, 'Dulux/Nippon', 'Cat kayu/besi weather shield'),
('Dempul Tembok', 'kg', 15000, 'Supplier Lokal', 'Dempul tembok siap pakai'),

-- Material untuk Listrik
('Kabel NYM 2x2.5', 'm', 8500, 'Eterna/Supreme', 'Kabel NYM 2x2.5mm'),
('Pipa PVC Listrik 3/4"', 'batang', 25000, 'Rucika/Wavin', 'Pipa PVC listrik 3/4" x 4m'),
('Stop Kontak', 'pcs', 35000, 'Broco/Panasonic', 'Stop kontak arde'),

-- Material untuk Plumbing
('Pipa PVC 3/4"', 'batang', 45000, 'Rucika/Wavin', 'Pipa PVC air bersih 3/4" x 4m'),
('Pipa PVC 4"', 'batang', 85000, 'Rucika/Wavin', 'Pipa PVC air kotor 4" x 4m'),
('Elbow PVC 3/4"', 'pcs', 8500, 'Rucika/Wavin', 'Elbow PVC 3/4"'),
('Tee PVC 3/4"', 'pcs', 12000, 'Rucika/Wavin', 'Tee PVC 3/4"');

-- Insert labor_rates (upah pekerja)
INSERT INTO labor_rates (worker_type, daily_rate, skill_level, location) VALUES
('Tukang Batu', 150000, 'standard', 'general'),
('Tukang Besi', 160000, 'standard', 'general'),
('Tukang Kayu', 155000, 'standard', 'general'),
('Tukang Cat', 140000, 'standard', 'general'),
('Tukang Listrik', 170000, 'standard', 'general'),
('Tukang Pipa', 160000, 'standard', 'general'),
('Pekerja/Pekerja', 120000, 'standard', 'general'),
('Mandor', 200000, 'standard', 'general');

-- Insert job_type_materials (relasi pekerjaan dan material)
-- Beton Sloff (job_type_id = 3)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(3, 1, 7.0, 0.05, TRUE),  -- Semen 7 zak per m3
(3, 2, 0.5, 0.10, TRUE),  -- Pasir 0.5 m3 per m3
(3, 3, 0.8, 0.10, TRUE),  -- Kerikil 0.8 m3 per m3
(3, 4, 80.0, 0.10, TRUE); -- Besi beton 80 kg per m3

-- Pondasi Footplate (job_type_id = 4)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(4, 1, 8.5, 0.05, TRUE),  -- Semen 8.5 zak per m3
(4, 2, 0.5, 0.10, TRUE),  -- Pasir 0.5 m3 per m3
(4, 3, 0.8, 0.10, TRUE),  -- Kerikil 0.8 m3 per m3
(4, 5, 120.0, 0.10, TRUE), -- Besi beton 12mm, 120 kg per m3
(4, 6, 5.0, 0.05, FALSE); -- Kawat bendrat 5 kg per m3

-- Kolom Struktur (job_type_id = 5)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(5, 1, 9.0, 0.05, TRUE),   -- Semen 9 zak per m3
(5, 2, 0.5, 0.10, TRUE),   -- Pasir 0.5 m3 per m3
(5, 3, 0.8, 0.10, TRUE),   -- Kerikil 0.8 m3 per m3
(5, 5, 150.0, 0.10, TRUE), -- Besi beton 12mm, 150 kg per m3
(5, 6, 8.0, 0.05, FALSE);  -- Kawat bendrat 8 kg per m3

-- Pemasangan Bata (job_type_id = 8) - Default dengan bata merah
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(8, 7, 70.0, 0.05, TRUE),  -- Bata merah 70 pcs per m2 (default)
(8, 10, 0.5, 0.05, TRUE),   -- Semen instan 0.5 zak per m2
(8, 11, 0.04, 0.10, TRUE);  -- Pasir pasang 0.04 m3 per m2

-- Alternative materials untuk Pemasangan Bata
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(8, 8, 70.0, 0.05, FALSE),  -- Bata putih 70 pcs per m2 (alternatif)
(8, 9, 55.0, 0.05, FALSE);  -- Bata ringan 55 pcs per m2 (alternatif)

-- Keramik Lantai (job_type_id = 10)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(10, 10, 1.0, 0.10, TRUE), -- Keramik 40x40, 1 m2 per m2
(10, 12, 0.04, 0.05, TRUE), -- Semen lem 0.04 zak per m2
(10, 13, 0.5, 0.05, FALSE); -- Nat keramik 0.5 kg per m2

-- Granite Tile (job_type_id = 11)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(11, 11, 1.0, 0.10, TRUE), -- Granite tile 60x60, 1 m2 per m2
(11, 12, 0.04, 0.05, TRUE), -- Semen lem 0.04 zak per m2
(11, 13, 0.5, 0.05, FALSE); -- Nat keramik 0.5 kg per m2

-- Genteng Beton (job_type_id = 13)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(13, 15, 10.0, 0.10, TRUE); -- Genteng beton 10 pcs per m2

-- Plafond Gypsum (job_type_id = 15)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(15, 17, 0.35, 0.10, TRUE), -- Gypsum board 0.35 lembar per m2
(15, 19, 0.8, 0.05, TRUE),  -- Hollow galvanis 0.8 batang per m2
(15, 20, 0.1, 0.05, FALSE); -- Sekrup gypsum 0.1 kg per m2

-- Cat Tembok Interior (job_type_id = 17)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(17, 21, 0.08, 0.05, TRUE), -- Cat tembok 0.08 galon per m2
(17, 23, 0.2, 0.05, FALSE); -- Dempul 0.2 kg per m2

-- Pipa PVC Air Bersih (job_type_id = 21)
INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES
(21, 26, 0.25, 0.10, TRUE), -- Pipa PVC 3/4" 0.25 batang per m
(21, 27, 0.1, 0.05, FALSE), -- Elbow PVC 0.1 pcs per m
(21, 28, 0.05, 0.05, FALSE); -- Tee PVC 0.05 pcs per m

-- Insert sample user
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@kalkulator.com', '$2b$10$rQZ8kHWfE.vQxPzjKGJ0/.vJ0OwGJ0J0J0J0J0J0J0J0J0J0J0J0J0', 'Administrator', 'admin'),
('user1', 'user1@example.com', '$2b$10$rQZ8kHWfE.vQxPzjKGJ0/.vJ0OwGJ0J0J0J0J0J0J0J0J0J0J0J0J0', 'User Demo', 'user');
