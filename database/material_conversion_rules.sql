-- Material Conversion Rules Database Schema
-- Sistem konversi material yang dinamis dan dapat dikonfigurasi

USE kalkulator_konstruksi;

-- Table: material_conversion_rules
-- Menyimpan aturan konversi material yang dapat dikonfigurasi oleh admin
CREATE TABLE material_conversion_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL COMMENT 'Nama aturan konversi',
    material_pattern VARCHAR(100) NOT NULL COMMENT 'Pattern nama material (regex atau keyword)',
    unit_pattern VARCHAR(50) NOT NULL COMMENT 'Pattern satuan (regex atau keyword)',
    conversion_factor DECIMAL(10,4) NOT NULL COMMENT 'Faktor konversi',
    base_unit VARCHAR(20) NOT NULL COMMENT 'Satuan dasar untuk kalkulasi',
    conversion_description TEXT NOT NULL COMMENT 'Deskripsi konversi',
    material_type VARCHAR(20) COMMENT 'Jenis material (brick, tile, aggregate, dll)',
    
    -- Additional conversion data (JSON for flexibility)
    conversion_data JSON COMMENT 'Data tambahan untuk konversi kompleks',
    
    -- Rule conditions
    job_category_pattern VARCHAR(100) COMMENT 'Pattern kategori job (opsional)',
    priority INT DEFAULT 100 COMMENT 'Prioritas aturan (semakin kecil semakin tinggi)',
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif aturan',
    created_by INT COMMENT 'User yang membuat aturan',
    notes TEXT COMMENT 'Catatan tambahan',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_material_pattern (material_pattern),
    INDEX idx_unit_pattern (unit_pattern),
    INDEX idx_priority (priority),
    INDEX idx_active (is_active),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table: material_conversion_presets
-- Menyimpan preset konversi yang umum digunakan
CREATE TABLE material_conversion_presets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    preset_name VARCHAR(100) NOT NULL COMMENT 'Nama preset',
    category VARCHAR(50) NOT NULL COMMENT 'Kategori preset (cement, aggregate, tile, dll)',
    description TEXT COMMENT 'Deskripsi preset',
    
    -- Preset data
    conversion_factor DECIMAL(10,4) NOT NULL,
    base_unit VARCHAR(20) NOT NULL,
    conversion_description TEXT NOT NULL,
    material_type VARCHAR(20),
    
    -- Additional preset data
    preset_data JSON COMMENT 'Data tambahan preset',
    
    -- Usage tracking
    usage_count INT DEFAULT 0 COMMENT 'Jumlah penggunaan preset',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- Insert conversion rules berdasarkan tabel spesifikasi yang diberikan
INSERT INTO material_conversion_rules (
    rule_name, 
    material_pattern, 
    unit_pattern, 
    conversion_factor, 
    base_unit, 
    conversion_description, 
    material_type,
    conversion_data,
    job_category_pattern,
    priority,
    notes
) VALUES 
-- === BETON K225 CONVERSION RULES ===
-- Semen untuk Beton K225 (Data dari tabel spesifikasi)
(
    'Semen untuk Beton K225', 
    'semen|cement', 
    'sak|zak', 
    1.0000, 
    'sak', 
    '1 m³ beton K225 butuh 0.0250 sak semen', 
    'powder',
    JSON_OBJECT(
        'usage_per_m3_concrete', JSON_OBJECT(
            'K-225', 0.0250
        ),
        'specification_data', true,
        'job_specific', true
    ),
    'beton.*k225|cor.*k225',
    5,
    'Kebutuhan semen spesifik untuk beton K225 sesuai tabel spesifikasi'
),

-- Pasir untuk Beton K225 (Data dari tabel spesifikasi)
(
    'Pasir untuk Beton K225', 
    'pasir(?!.*japanan)', 
    'm3|m³', 
    1.0000, 
    'm³', 
    '1 m³ beton K225 butuh 0.4 m³ pasir', 
    'aggregate',
    JSON_OBJECT(
        'usage_per_m3_concrete', JSON_OBJECT(
            'K-225', 0.4
        ),
        'specification_data', true,
        'job_specific', true
    ),
    'beton.*k225|cor.*k225',
    5,
    'Kebutuhan pasir spesifik untuk beton K225 sesuai tabel spesifikasi'
),

-- Kerikil untuk Beton K225 (Data dari tabel spesifikasi)
(
    'Kerikil untuk Beton K225', 
    'kerikil|split|koral', 
    'm3|m³', 
    1.0000, 
    'm³', 
    '1 m³ beton K225 butuh 0.7 m³ kerikil', 
    'aggregate',
    JSON_OBJECT(
        'usage_per_m3_concrete', JSON_OBJECT(
            'K-225', 0.7
        ),
        'specification_data', true,
        'job_specific', true
    ),
    'beton.*k225|cor.*k225',
    5,
    'Kebutuhan kerikil spesifik untuk beton K225 sesuai tabel spesifikasi'
),

-- === GRANIT 60x60cm CONVERSION RULES ===
-- Granit 60x60cm (Data dari tabel spesifikasi)
(
    'Granit 60x60cm untuk Pasang', 
    'granit.*60x60|granit 60x60', 
    'dus|box', 
    0.6944, 
    'dus', 
    '1 m² = 0.6944 dus granit 60x60cm', 
    'tile',
    JSON_OBJECT(
        'usage_per_m2', 0.6944,
        'specification_data', true,
        'job_specific', true,
        'pieces_per_box', 4,
        'piece_dimensions', '60x60cm',
        'area_per_box', 1.44
    ),
    'granit.*60x60|pasang.*60x60',
    5,
    'Kebutuhan granit 60x60cm sesuai tabel spesifikasi: 1 m² = 0.6944 dus'
),

-- Pasir Japanan untuk Granit 60x60cm (Data dari tabel spesifikasi)
(
    'Pasir Japanan untuk Granit 60x60cm', 
    'pasir.*japanan', 
    'm3|m³', 
    1.0000, 
    'm³', 
    '1 m² granit 60x60cm butuh 0.0343 m³ pasir japanan', 
    'aggregate',
    JSON_OBJECT(
        'usage_per_m2_granite', JSON_OBJECT(
            '60x60', 0.0343
        ),
        'specification_data', true,
        'job_specific', true
    ),
    'granit.*60x60|pasang.*60x60',
    5,
    'Kebutuhan pasir japanan spesifik untuk granit 60x60cm sesuai tabel spesifikasi'
),

-- Lem Granit untuk Granit 60x60cm (Data dari tabel spesifikasi)
(
    'Lem Granit untuk Pasang 60x60cm', 
    'lem.*granit|lem granit', 
    'kg', 
    1.0000, 
    'kg', 
    '1 m² granit 60x60cm butuh 1.5 kg lem granit', 
    'adhesive',
    JSON_OBJECT(
        'usage_per_m2_granite', JSON_OBJECT(
            '60x60', 1.5
        ),
        'specification_data', true,
        'job_specific', true
    ),
    'granit.*60x60|pasang.*60x60',
    5,
    'Kebutuhan lem granit spesifik untuk granit 60x60cm sesuai tabel spesifikasi'
),

-- === GENERAL CONVERSION RULES (Existing data) ===
-- Semen (Data Riset: 40kg per sak) - General rule
(
    'Semen Portland 40kg', 
    'semen|cement|adamix', 
    'sak|zak', 
    40.0000, 
    'kg', 
    '1 sak semen = 40 kg (data riset lokal)', 
    'powder',
    JSON_OBJECT(
        'research_data', true,
        'usage_per_m3', JSON_OBJECT(
            'K-175', 0.0225,
            'K-200', 0.0250,
            'K-225', 0.0275,
            'K-250', 0.0300,
            'K-275', 0.0325,
            'K-300', 0.0350
        )
    ),
    null,
    10,
    'Berdasarkan riset lokal, 1 sak = 40kg bukan 50kg'
),

-- Pasir (Data Riset: 7 m³ per truk) - General rule
(
    'Pasir Truk 7m³', 
    'pasir|sand', 
    'truk', 
    7.0000, 
    'm3', 
    '1 truk pasir = 7 m³ (data riset lokal)', 
    'aggregate',
    JSON_OBJECT(
        'research_data', true,
        'truck_capacity', 7,
        'usage_per_m3_concrete', JSON_OBJECT(
            'K-175', 0.0514,
            'K-200', 0.0500,
            'K-225', 0.0486,
            'K-250', 0.0471
        )
    ),
    null,
    20,
    'Kapasitas truk standar berdasarkan riset lokal'
),

-- Pasir Japanan Truk (Data Riset Spesifik) - General rule
(
    'Pasir Japanan Truk', 
    'pasir.*japanan', 
    'truk', 
    7.0000, 
    'm3', 
    '1 truk = 7 m³, kebutuhan 0.0343 m³ per m² granite', 
    'aggregate',
    JSON_OBJECT(
        'research_data', true,
        'specific_usage', JSON_OBJECT(
            'granite_per_m2', 0.0343
        )
    ),
    null,
    15,
    'Data riset khusus untuk pekerjaan granite'
),

-- Kerikil/Split (Data Riset: 7 m³ per truk) - General rule
(
    'Kerikil Split Truk', 
    'kerikil|split|koral|batu', 
    'truk', 
    7.0000, 
    'm3', 
    '1 truk kerikil = 7 m³ (data riset lokal)', 
    'aggregate',
    JSON_OBJECT(
        'research_data', true,
        'usage_per_m3_concrete', JSON_OBJECT(
            'K-175', 0.0771,
            'K-200', 0.0750,
            'K-225', 0.0729,
            'K-250', 0.0707
        )
    ),
    null,
    20,
    'Kapasitas truk standar untuk agregat kasar'
),

-- Granit 60x60cm (Data Riset: 4 keping = 1.44 m²) - General rule
(
    'Granit 60x60cm Standard', 
    'granit|keramik|tile', 
    'dus|box', 
    0.6944, 
    'm2', 
    '1 m² = 0.6944 dus (4 keping @ 60x60cm = 1.44 m²)', 
    'tile',
    JSON_OBJECT(
        'research_data', true,
        'pieces_per_box', 4,
        'piece_dimensions', '60x60cm',
        'area_per_box', 1.44,
        'sizes', JSON_OBJECT(
            '60x60', JSON_OBJECT('pieces', 4, 'area', 1.44, 'factor', 0.6944),
            '50x50', JSON_OBJECT('pieces', 4, 'area', 1.00, 'factor', 1.0000),
            '40x40', JSON_OBJECT('pieces', 6, 'area', 0.96, 'factor', 1.0417),
            '30x30', JSON_OBJECT('pieces', 11, 'area', 0.99, 'factor', 1.0101)
        )
    ),
    null,
    30,
    'Data riset untuk granit ukuran standar'
),

-- Bata Merah Truk (Data Riset: 6000 pcs)
(
    'Bata Merah Truk 6000pcs', 
    'bata.*merah|brick.*red', 
    'truk', 
    0.0110, 
    'm2', 
    '1 m² = 0.0110 truk (6000 bata @ 230×110×50mm)', 
    'brick',
    JSON_OBJECT(
        'research_data', true,
        'pieces_per_truck', 6000,
        'brick_dimensions', JSON_OBJECT(
            'length', 230,
            'width', 110,
            'height', 50
        ),
        'mortar_thickness', 10,
        'area_per_truck', 90.72,
        'waste_factor', 0.05
    ),
    null,
    40,
    'Data riset bata merah standar'
);

-- Insert conversion presets
INSERT INTO material_conversion_presets (
    preset_name, 
    category, 
    description, 
    conversion_factor, 
    base_unit, 
    conversion_description, 
    material_type,
    preset_data
) VALUES 
(
    'Beton K225 - Semen', 
    'concrete', 
    'Preset semen untuk beton K225', 
    0.0250, 
    'sak', 
    '1 m³ beton K225 butuh 0.0250 sak semen', 
    'powder',
    JSON_OBJECT('specification_based', true, 'concrete_grade', 'K-225')
),
(
    'Beton K225 - Pasir', 
    'concrete', 
    'Preset pasir untuk beton K225', 
    0.4, 
    'm³', 
    '1 m³ beton K225 butuh 0.4 m³ pasir', 
    'aggregate',
    JSON_OBJECT('specification_based', true, 'concrete_grade', 'K-225')
),
(
    'Beton K225 - Kerikil', 
    'concrete', 
    'Preset kerikil untuk beton K225', 
    0.7, 
    'm³', 
    '1 m³ beton K225 butuh 0.7 m³ kerikil', 
    'aggregate',
    JSON_OBJECT('specification_based', true, 'concrete_grade', 'K-225')
),
(
    'Granit 60x60cm', 
    'tile', 
    'Preset granit 60x60cm', 
    0.6944, 
    'dus', 
    '1 m² = 0.6944 dus granit 60x60cm', 
    'tile',
    JSON_OBJECT('specification_based', true, 'tile_size', '60x60cm')
),
(
    'Pasir Japanan untuk Granit 60x60cm', 
    'tile', 
    'Preset pasir japanan untuk granit 60x60cm', 
    0.0343, 
    'm³', 
    '1 m² granit 60x60cm butuh 0.0343 m³ pasir japanan', 
    'aggregate',
    JSON_OBJECT('specification_based', true, 'tile_size', '60x60cm')
),
(
    'Lem Granit untuk 60x60cm', 
    'tile', 
    'Preset lem granit untuk granit 60x60cm', 
    1.5, 
    'kg', 
    '1 m² granit 60x60cm butuh 1.5 kg lem granit', 
    'adhesive',
    JSON_OBJECT('specification_based', true, 'tile_size', '60x60cm')
),
(
    'Semen 40kg (Riset Lokal)', 
    'cement', 
    'Preset semen berdasarkan data riset lokal', 
    40.0000, 
    'kg', 
    '1 sak semen = 40 kg (data riset lokal)', 
    'powder',
    JSON_OBJECT('research_based', true, 'source', 'local_research')
),
(
    'Truk Agregat 7m³', 
    'aggregate', 
    'Preset truk agregat berdasarkan data riset', 
    7.0000, 
    'm3', 
    '1 truk = 7 m³ (data riset lokal)', 
    'aggregate',
    JSON_OBJECT('research_based', true, 'truck_type', 'standard')
);

-- Create view for active conversion rules
CREATE VIEW v_active_conversion_rules AS
SELECT 
    id,
    rule_name,
    material_pattern,
    unit_pattern,
    conversion_factor,
    base_unit,
    conversion_description,
    material_type,
    conversion_data,
    job_category_pattern,
    priority,
    notes,
    created_at,
    updated_at
FROM material_conversion_rules 
WHERE is_active = TRUE 
ORDER BY priority ASC, created_at DESC;

-- Create view for conversion presets
CREATE VIEW v_active_conversion_presets AS
SELECT 
    id,
    preset_name,
    category,
    description,
    conversion_factor,
    base_unit,
    conversion_description,
    material_type,
    preset_data,
    usage_count,
    created_at
FROM material_conversion_presets 
WHERE is_active = TRUE 
ORDER BY category, usage_count DESC;

SELECT 'Material conversion rules database created successfully!' as status;
