-- Migration: Add volume job requirement fields to materials table
-- Date: 2024
-- Purpose: Add support for "📐 Kebutuhan per Volume Job" functionality

USE kalkulator_konstruksi;

-- Add new fields to materials table for volume job requirements
ALTER TABLE materials 
ADD COLUMN usage_per_unit DECIMAL(10,4) NULL COMMENT 'Kebutuhan material per satuan pekerjaan (contoh: 0.0250 sak/m³)',
ADD COLUMN job_unit VARCHAR(10) DEFAULT 'm³' COMMENT 'Satuan pekerjaan (m³, m², m, unit)';

-- Add conversion fields if they don't exist yet
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS conversion_factor DECIMAL(10,4) DEFAULT 1.0 COMMENT 'Faktor konversi dari satuan pasar ke satuan dasar',
ADD COLUMN IF NOT EXISTS base_unit VARCHAR(20) NULL COMMENT 'Satuan dasar untuk kalkulasi',
ADD COLUMN IF NOT EXISTS conversion_description TEXT NULL COMMENT 'Deskripsi lengkap konversi material',
ADD COLUMN IF NOT EXISTS pieces_per_unit INT NULL COMMENT 'Jumlah keping per unit kemasan',
ADD COLUMN IF NOT EXISTS piece_dimensions VARCHAR(50) NULL COMMENT 'Dimensi per keping (contoh: 60x60cm)',
ADD COLUMN IF NOT EXISTS coverage_per_unit DECIMAL(10,4) NULL COMMENT 'Luas tutupan per unit kemasan',
ADD COLUMN IF NOT EXISTS material_type VARCHAR(50) NULL COMMENT 'Jenis material (powder, aggregate, tile, brick, etc)',
ADD COLUMN IF NOT EXISTS brick_length DECIMAL(8,2) NULL COMMENT 'Panjang bata (mm)',
ADD COLUMN IF NOT EXISTS brick_width DECIMAL(8,2) NULL COMMENT 'Lebar bata (mm)', 
ADD COLUMN IF NOT EXISTS brick_height DECIMAL(8,2) NULL COMMENT 'Tinggi bata (mm)',
ADD COLUMN IF NOT EXISTS mortar_thickness DECIMAL(8,2) DEFAULT 10 COMMENT 'Tebal mortar (mm)',
ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(8,2) DEFAULT 150 COMMENT 'Tebal dinding (mm)',
ADD COLUMN IF NOT EXISTS waste_factor DECIMAL(5,4) DEFAULT 0.0500 COMMENT 'Faktor pemborosan material (0.05 = 5%)';

-- Update existing materials with default values for new fields
UPDATE materials 
SET 
    job_unit = 'm³',
    conversion_factor = 1.0,
    base_unit = unit,
    waste_factor = 0.0500
WHERE 
    job_unit IS NULL 
    OR conversion_factor IS NULL 
    OR base_unit IS NULL 
    OR waste_factor IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_usage_per_unit ON materials(usage_per_unit);
CREATE INDEX IF NOT EXISTS idx_materials_job_unit ON materials(job_unit);
CREATE INDEX IF NOT EXISTS idx_materials_material_type ON materials(material_type);

-- Show the updated table structure
DESCRIBE materials;

-- Show sample data to verify the migration
SELECT 
    id, 
    name, 
    unit, 
    price, 
    conversion_factor, 
    base_unit, 
    usage_per_unit, 
    job_unit,
    conversion_description
FROM materials 
LIMIT 5;
