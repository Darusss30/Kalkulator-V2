-- MASTER SETUP FILE UNTUK SEMUA KALKULATOR KONSTRUKSI
-- Menjalankan semua file SQL untuk setup lengkap 11 kategori kalkulator baru
-- 
-- URUTAN EKSEKUSI:
-- 1. Kategori Pekerjaan
-- 2. Job Types dengan Input Config
-- 3. Materials
-- 4. Job Type Materials Relations
--
-- Jalankan file ini untuk setup lengkap semua kalkulator konstruksi

USE kalkulator_konstruksi;

-- =====================================================
-- 1. SETUP KATEGORI PEKERJAAN BARU
-- =====================================================

-- Menambahkan 11 Kategori Pekerjaan Konstruksi Baru
INSERT INTO job_categories (name, description, icon) VALUES
('Pekerjaan Persiapan', 'Pembersihan lahan, pemasangan pagar kerja, scaffolding, dan gudang material', 'hammer'),
('Pekerjaan Galian & Urugan', 'Galian tanah, urugan, dan pekerjaan tanah lainnya', 'mountain'),
('Pekerjaan Pasangan & Finishing', 'Pasangan bata, plester, aci, dan finishing dinding', 'building'),
('Pekerjaan Atap', 'Rangka atap, genteng, dan aksesoris atap', 'home'),
('Pekerjaan Plafond', 'Plafond gypsum, rangka, dan list plafond', 'layers'),
('Pekerjaan Kusen & Kaca', 'Kusen pintu, jendela, dan pemasangan kaca', 'door-open'),
('Pekerjaan Kanopi', 'Kanopi baja ringan dan penutup atap kanopi', 'umbrella'),
('Pekerjaan Pengecatan', 'Pengecatan interior, eksterior, dan plafond', 'palette'),
('Pekerjaan Mekanikal Elektrikal', 'Instalasi listrik, titik lampu, dan stop kontak', 'zap'),
('Pekerjaan Sanitair', 'Instalasi pipa, perangkat sanitair, dan septictank', 'droplets'),
('Pekerjaan Lantai', 'Pemasangan keramik, granit, dan finishing lantai', 'layers');

-- =====================================================
-- 2. SETUP MATERIALS UNTUK SEMUA KATEGORI
-- =====================================================

-- A. MATERIAL UNTUK PEKERJAAN PERSIAPAN
INSERT INTO materials (name, unit, price, supplier, description) VALUES
-- Pembersihan & Persiapan
('Upah Pembersihan Lahan', 'm2', 5000, 'Tenaga Kerja', 'Upah pembersihan dan pemerataan lahan per m²'),
('Bambu Pagar Kerja', 'batang', 15000, 'Toko Material', 'Bambu untuk pagar sementara, panjang 4m'),
('Kawat Bendrat', 'kg', 18000, 'Toko Material', 'Kawat bendrat untuk pengikat pagar'),
('Sewa Scaffolding', 'm3/bulan', 25000, 'Rental Alat', 'Sewa scaffolding per m³ per bulan'),
('Terpal Plastik', 'm2', 8000, 'Toko Material', 'Terpal plastik untuk penutup gudang'),
('Kayu Kaso 5/7', 'batang', 35000, 'Toko Kayu', 'Kayu kaso 5x7 cm panjang 4m untuk rangka gudang'),
('Paku Biasa 2-12', 'kg', 16000, 'Toko Material', 'Paku biasa ukuran 2-12 cm'),

-- B. MATERIAL UNTUK GALIAN & URUGAN
('Upah Galian Tanah Manual', 'm3', 35000, 'Tenaga Kerja', 'Upah galian tanah manual per m³'),
('Sewa Excavator', 'jam', 350000, 'Rental Alat', 'Sewa excavator PC 200 per jam'),
('Tanah Urug', 'm3', 45000, 'Supplier Material', 'Tanah urug berkualitas per m³'),
('Pasir Urug', 'm3', 180000, 'Supplier Pasir', 'Pasir urug untuk lantai kerja per m³'),
('Batu Kali', 'm3', 220000, 'Supplier Batu', 'Batu kali untuk pondasi per m³'),
('Upah Pemadatan Tanah', 'm3', 15000, 'Tenaga Kerja', 'Upah pemadatan tanah per m³'),
('Sewa Stamper', 'hari', 75000, 'Rental Alat', 'Sewa stamper untuk pemadatan per hari'),

-- C. MATERIAL UNTUK PASANGAN & FINISHING
('Bata Merah', 'biji', 800, 'Toko Material', 'Bata merah press berkualitas per biji'),
('Semen Portland', 'sak', 62000, 'Toko Material', 'Semen portland 50kg per sak'),
('Pasir Pasang', 'm3', 160000, 'Supplier Pasir', 'Pasir pasang untuk adukan per m³'),
('Kapur Sirih', 'kg', 3500, 'Toko Material', 'Kapur sirih untuk campuran plester'),
('Upah Pasang Bata', 'm2', 45000, 'Tenaga Kerja', 'Upah pasang bata per m²'),
('Upah Plester', 'm2', 25000, 'Tenaga Kerja', 'Upah plester dinding per m²'),
('Upah Aci', 'm2', 18000, 'Tenaga Kerja', 'Upah aci halus per m²'),
('Pasir Halus', 'm3', 170000, 'Supplier Pasir', 'Pasir halus untuk aci per m³'),

-- D. MATERIAL UNTUK ATAP
('Baja Ringan C75', 'batang', 45000, 'Supplier Baja Ringan', 'Baja ringan C75 panjang 6m'),
('Baja Ringan Reng', 'batang', 28000, 'Supplier Baja Ringan', 'Baja ringan reng panjang 6m'),
('Sekrup Baja Ringan', 'kg', 22000, 'Toko Material', 'Sekrup khusus baja ringan per kg'),
('Genteng Keramik', 'biji', 3500, 'Toko Genteng', 'Genteng keramik berkualitas per biji'),
('Genteng Metal', 'lembar', 85000, 'Toko Genteng', 'Genteng metal ukuran 78x80 cm'),
('Nok Genteng', 'biji', 8500, 'Toko Genteng', 'Nok genteng keramik per biji'),
('Wuwung Genteng', 'biji', 12000, 'Toko Genteng', 'Wuwung genteng keramik per biji'),
('Upah Pasang Rangka Atap', 'm2', 35000, 'Tenaga Kerja', 'Upah pasang rangka atap per m²'),
('Upah Pasang Genteng', 'm2', 28000, 'Tenaga Kerja', 'Upah pasang genteng per m²'),

-- E. MATERIAL UNTUK PLAFOND
('Gypsum Board 9mm', 'lembar', 45000, 'Toko Material', 'Gypsum board 9mm ukuran 120x240 cm'),
('Rangka Metal Ceiling', 'm', 18000, 'Toko Material', 'Rangka metal untuk plafond per meter'),
('Sekrup Gypsum', 'kg', 25000, 'Toko Material', 'Sekrup khusus gypsum per kg'),
('List Plafond PVC', 'm', 12000, 'Toko Material', 'List plafond PVC per meter'),
('Compound Gypsum', 'kg', 8500, 'Toko Material', 'Compound untuk sambungan gypsum'),
('Upah Pasang Plafond', 'm2', 32000, 'Tenaga Kerja', 'Upah pasang plafond per m²'),
('Upah Pasang List', 'm', 8000, 'Tenaga Kerja', 'Upah pasang list plafond per meter'),

-- F. MATERIAL UNTUK KUSEN & KACA
('Kusen Kayu Kamper', 'm3', 4500000, 'Toko Kayu', 'Kayu kamper untuk kusen per m³'),
('Kusen Aluminium', 'batang', 125000, 'Toko Aluminium', 'Profil aluminium untuk kusen per batang 6m'),
('Kaca Bening 5mm', 'm2', 85000, 'Toko Kaca', 'Kaca bening tebal 5mm per m²'),
('Kaca Tempered 8mm', 'm2', 185000, 'Toko Kaca', 'Kaca tempered 8mm per m²'),
('Engsel Pintu', 'buah', 25000, 'Toko Material', 'Engsel pintu stainless steel'),
('Handle Pintu', 'set', 45000, 'Toko Material', 'Handle pintu lengkap dengan kunci'),
('Kunci Pintu', 'buah', 85000, 'Toko Material', 'Kunci pintu cylinder berkualitas'),
('Upah Pasang Kusen', 'unit', 150000, 'Tenaga Kerja', 'Upah pasang kusen per unit'),
('Upah Pasang Kaca', 'm2', 35000, 'Tenaga Kerja', 'Upah pasang kaca per m²'),

-- G. MATERIAL UNTUK KANOPI
('Besi Hollow 4x4', 'batang', 85000, 'Toko Besi', 'Besi hollow 4x4 cm panjang 6m'),
('Solartuff', 'lembar', 165000, 'Toko Material', 'Solartuff ukuran 105x210 cm'),
('Spandek', 'lembar', 95000, 'Toko Material', 'Spandek ukuran 78x240 cm'),
('Baut Besi', 'kg', 18000, 'Toko Material', 'Baut untuk konstruksi besi per kg'),
('Cat Besi', 'kg', 45000, 'Toko Cat', 'Cat khusus besi anti karat per kg'),
('Upah Las Kanopi', 'm2', 45000, 'Tenaga Kerja', 'Upah las dan pasang kanopi per m²'),

-- H. MATERIAL UNTUK PENGECATAN
('Cat Tembok Interior', 'kg', 85000, 'Toko Cat', 'Cat tembok interior berkualitas per kg'),
('Cat Tembok Eksterior', 'kg', 95000, 'Toko Cat', 'Cat tembok eksterior tahan cuaca per kg'),
('Cat Plafond', 'kg', 78000, 'Toko Cat', 'Cat khusus plafond per kg'),
('Plamir Tembok', 'kg', 25000, 'Toko Cat', 'Plamir untuk meratakan tembok per kg'),
('Kuas Cat 4 inch', 'buah', 35000, 'Toko Cat', 'Kuas cat berkualitas 4 inch'),
('Roll Cat', 'buah', 28000, 'Toko Cat', 'Roll cat untuk tembok'),
('Thinner', 'liter', 18000, 'Toko Cat', 'Thinner untuk pengencer cat'),
('Upah Cat Tembok', 'm2', 12000, 'Tenaga Kerja', 'Upah cat tembok per m²'),

-- I. MATERIAL UNTUK INSTALASI LISTRIK
('Kabel NYM 2x2.5', 'm', 8500, 'Toko Listrik', 'Kabel NYM 2x2.5 mm per meter'),
('Kabel NYM 3x2.5', 'm', 12000, 'Toko Listrik', 'Kabel NYM 3x2.5 mm per meter'),
('Fitting Lampu', 'buah', 15000, 'Toko Listrik', 'Fitting lampu E27 berkualitas'),
('Stop Kontak', 'buah', 25000, 'Toko Listrik', 'Stop kontak universal'),
('Saklar Tunggal', 'buah', 18000, 'Toko Listrik', 'Saklar tunggal berkualitas'),
('MCB 2A', 'buah', 35000, 'Toko Listrik', 'MCB 2 ampere'),
('Panel Listrik', 'unit', 450000, 'Toko Listrik', 'Panel listrik 12 group'),
('Pipa PVC 3/4', 'm', 8500, 'Toko Listrik', 'Pipa PVC 3/4 inch untuk kabel'),
('Upah Instalasi Listrik', 'titik', 45000, 'Tenaga Kerja', 'Upah instalasi per titik'),

-- J. MATERIAL UNTUK SANITAIR
('Pipa PVC 1/2 inch', 'm', 12000, 'Toko Material', 'Pipa PVC 1/2 inch per meter'),
('Pipa PVC 3/4 inch', 'm', 18000, 'Toko Material', 'Pipa PVC 3/4 inch per meter'),
('Pipa PVC 4 inch', 'm', 45000, 'Toko Material', 'Pipa PVC 4 inch untuk air kotor'),
('Knee PVC', 'buah', 8500, 'Toko Material', 'Knee PVC berbagai ukuran'),
('Tee PVC', 'buah', 12000, 'Toko Material', 'Tee PVC berbagai ukuran'),
('Kloset Duduk', 'unit', 850000, 'Toko Sanitair', 'Kloset duduk berkualitas'),
('Wastafel', 'unit', 450000, 'Toko Sanitair', 'Wastafel keramik'),
('Shower', 'set', 285000, 'Toko Sanitair', 'Shower set lengkap'),
('Semen Instan', 'sak', 45000, 'Toko Material', 'Semen instan untuk septictank'),
('Upah Instalasi Pipa', 'm', 15000, 'Tenaga Kerja', 'Upah instalasi pipa per meter'),
('Upah Pasang Sanitair', 'unit', 125000, 'Tenaga Kerja', 'Upah pasang perangkat sanitair'),

-- K. MATERIAL UNTUK LANTAI
('Keramik 40x40', 'dus', 185000, 'Toko Keramik', 'Keramik lantai 40x40 cm per dus (11 pcs)'),
('Keramik 60x60', 'dus', 285000, 'Toko Keramik', 'Keramik lantai 60x60 cm per dus (6 pcs)'),
('Granit 60x60', 'dus', 485000, 'Toko Keramik', 'Granit lantai 60x60 cm per dus (4 pcs)'),
('Semen Instan Keramik', 'sak', 55000, 'Toko Material', 'Semen instan untuk keramik 25kg'),
('Nat Keramik', 'kg', 18000, 'Toko Material', 'Nat keramik berbagai warna per kg'),
('Waterproofing', 'kg', 85000, 'Toko Material', 'Waterproofing untuk lantai basah'),
('Upah Pasang Keramik', 'm2', 45000, 'Tenaga Kerja', 'Upah pasang keramik per m²'),
('Upah Pasang Granit', 'm2', 65000, 'Tenaga Kerja', 'Upah pasang granit per m²'),
('Upah Rabat Beton', 'm2', 35000, 'Tenaga Kerja', 'Upah rabat beton lantai per m²');

-- =====================================================
-- 3. SETUP JOB TYPES DENGAN INPUT CONFIGURATION
-- =====================================================

-- Dapatkan ID kategori yang baru ditambahkan
SET @prep_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Persiapan');
SET @excavation_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Galian & Urugan');
SET @masonry_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Pasangan & Finishing');
SET @roofing_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Atap');
SET @ceiling_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Plafond');
SET @door_window_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Kusen & Kaca');
SET @canopy_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Kanopi');
SET @painting_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Pengecatan');
SET @electrical_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Mekanikal Elektrikal');
SET @plumbing_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Sanitair');
SET @flooring_cat_id = (SELECT id FROM job_categories WHERE name = 'Pekerjaan Lantai');

-- A. PEKERJAAN PERSIAPAN
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@prep_cat_id, 'Pembersihan Lahan', 'm2', 'Pembersihan dan pemerataan lahan', 50.00, JSON_OBJECT(
  'type', 'preparation',
  'calculation', 'area',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'area', 'label', 'Luas Lahan', 'unit', 'm²', 'required', true)
  )
)),
(@prep_cat_id, 'Pemasangan Pagar Kerja', 'm', 'Pemasangan pagar sementara di area kerja', 25.00, JSON_OBJECT(
  'type', 'preparation',
  'calculation', 'fence_length',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'fence_length', 'label', 'Panjang Pagar', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'fence_height', 'label', 'Tinggi Pagar', 'unit', 'm', 'required', true)
  )
));

-- B. PEKERJAAN GALIAN & URUGAN
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@excavation_cat_id, 'Galian Tanah Biasa', 'm3', 'Galian tanah untuk pondasi dan basement', 3.50, JSON_OBJECT(
  'type', 'excavation',
  'calculation', 'length * width * depth',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Galian', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Galian', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'depth', 'label', 'Kedalaman Galian', 'unit', 'm', 'required', true)
  )
)),
(@excavation_cat_id, 'Urugan Tanah', 'm3', 'Urugan tanah untuk pemerataan dan penimbunan', 5.00, JSON_OBJECT(
  'type', 'excavation',
  'calculation', 'length * width * depth',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Urugan', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Urugan', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'depth', 'label', 'Tebal Urugan', 'unit', 'm', 'required', true)
  )
));

-- C. PEKERJAAN PASANGAN & FINISHING
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@masonry_cat_id, 'Pasangan Bata Merah', 'm2', 'Pasangan bata merah untuk dinding', 8.00, JSON_OBJECT(
  'type', 'masonry',
  'calculation', '(length * height) - door_area - window_area',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Dinding', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'height', 'label', 'Tinggi Dinding', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'door_area', 'label', 'Luas Pintu', 'unit', 'm²', 'required', false),
    JSON_OBJECT('name', 'window_area', 'label', 'Luas Jendela', 'unit', 'm²', 'required', false)
  )
)),
(@masonry_cat_id, 'Plester Dinding', 'm2', 'Plester dinding dengan mortar', 12.00, JSON_OBJECT(
  'type', 'masonry',
  'calculation', '(length * height) - door_area - window_area',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Dinding', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'height', 'label', 'Tinggi Dinding', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'door_area', 'label', 'Luas Pintu', 'unit', 'm²', 'required', false),
    JSON_OBJECT('name', 'window_area', 'label', 'Luas Jendela', 'unit', 'm²', 'required', false)
  )
));

-- D. PEKERJAAN ATAP
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@roofing_cat_id, 'Rangka Atap Baja Ringan', 'm2', 'Pemasangan rangka atap baja ringan', 6.00, JSON_OBJECT(
  'type', 'roofing',
  'calculation', 'length * width * slope_factor',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Atap', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Atap', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'slope_factor', 'label', 'Faktor Kemiringan', 'unit', '', 'required', false)
  )
)),
(@roofing_cat_id, 'Genteng Keramik', 'm2', 'Pemasangan genteng keramik', 10.00, JSON_OBJECT(
  'type', 'roofing',
  'calculation', 'length * width * slope_factor',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Atap', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Atap', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'slope_factor', 'label', 'Faktor Kemiringan', 'unit', '', 'required', false)
  )
));

-- E. PEKERJAAN PLAFOND
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@ceiling_cat_id, 'Plafond Gypsum 9mm', 'm2', 'Pemasangan plafond gypsum 9mm', 8.00, JSON_OBJECT(
  'type', 'ceiling',
  'calculation', 'length * width',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Ruangan', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Ruangan', 'unit', 'm', 'required', true)
  )
));

-- F. PEKERJAAN KUSEN & KACA
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@door_window_cat_id, 'Kusen Pintu Kayu', 'unit', 'Pemasangan kusen pintu kayu', 2.00, JSON_OBJECT(
  'type', 'door_window',
  'calculation', 'door_qty',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'door_qty', 'label', 'Jumlah Pintu', 'unit', 'unit', 'required', true),
    JSON_OBJECT('name', 'door_width', 'label', 'Lebar Pintu', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'door_height', 'label', 'Tinggi Pintu', 'unit', 'm', 'required', true)
  )
));

-- G. PEKERJAAN KANOPI
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@canopy_cat_id, 'Kanopi Baja Ringan + Solartuff', 'm2', 'Pemasangan kanopi baja ringan dengan atap solartuff', 4.00, JSON_OBJECT(
  'type', 'canopy',
  'calculation', 'length * width',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Kanopi', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Kanopi', 'unit', 'm', 'required', true)
  )
));

-- H. PEKERJAAN PENGECATAN
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@painting_cat_id, 'Cat Dinding Interior', 'm2', 'Pengecatan dinding interior', 15.00, JSON_OBJECT(
  'type', 'painting',
  'calculation', 'wall_area * layers',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'wall_area', 'label', 'Luas Dinding', 'unit', 'm²', 'required', true),
    JSON_OBJECT('name', 'layers', 'label', 'Jumlah Lapisan', 'unit', 'lapis', 'required', true)
  )
));

-- I. PEKERJAAN MEKANIKAL ELEKTRIKAL
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@electrical_cat_id, 'Instalasi Titik Lampu', 'titik', 'Instalasi titik lampu lengkap dengan kabel', 8.00, JSON_OBJECT(
  'type', 'electrical',
  'calculation', 'light_points',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'light_points', 'label', 'Jumlah Titik Lampu', 'unit', 'titik', 'required', true)
  )
));

-- J. PEKERJAAN SANITAIR
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@plumbing_cat_id, 'Instalasi Pipa Air Bersih', 'm', 'Instalasi pipa air bersih PVC', 15.00, JSON_OBJECT(
  'type', 'plumbing',
  'calculation', 'pipe_length',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'pipe_length', 'label', 'Panjang Pipa', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'pipe_diameter', 'label', 'Diameter Pipa', 'unit', 'inch', 'required', true)
  )
));

-- K. PEKERJAAN LANTAI
INSERT INTO job_types (category_id, name, unit, description, base_productivity, input_config) VALUES
(@flooring_cat_id, 'Keramik Lantai 40x40', 'm2', 'Pemasangan keramik lantai 40x40 cm', 10.00, JSON_OBJECT(
  'type', 'flooring',
  'calculation', 'length * width',
  'fields', JSON_ARRAY(
    JSON_OBJECT('name', 'length', 'label', 'Panjang Ruangan', 'unit', 'm', 'required', true),
    JSON_OBJECT('name', 'width', 'label', 'Lebar Ruangan', 'unit', 'm', 'required', true)
  )
));
