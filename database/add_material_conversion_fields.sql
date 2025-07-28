-- Migration: Add Material Conversion Fields
-- This script adds the missing conversion fields to the materials table
-- to support advanced material conversion features

USE kalkulator_konstruksi;

-- Add conversion fields to materials table
ALTER TABLE materials 
ADD COLUMN conversion_factor DECIMAL(10,4) DEFAULT 1.0 COMMENT 'Factor to convert from base unit to material unit',
ADD COLUMN base_unit VARCHAR(20) DEFAULT NULL COMMENT 'Base unit for calculations (kg, m2, m3, etc)',
ADD COLUMN conversion_description TEXT DEFAULT NULL COMMENT 'Human readable conversion description',
ADD COLUMN pieces_per_package INT DEFAULT NULL COMMENT 'Number of pieces per package/unit',
ADD COLUMN piece_dimensions VARCHAR(50) DEFAULT NULL COMMENT 'Dimensions of individual pieces (e.g., 60x60cm)',
ADD COLUMN coverage_per_package DECIMAL(10,4) DEFAULT NULL COMMENT 'Coverage area per package in m2',
ADD COLUMN material_type VARCHAR(20) DEFAULT NULL COMMENT 'Type of material (brick, tile, aggregate, etc)',
ADD COLUMN brick_length DECIMAL(8,2) DEFAULT NULL COMMENT 'Brick length in mm',
ADD COLUMN brick_width DECIMAL(8,2) DEFAULT NULL COMMENT 'Brick width in mm', 
ADD COLUMN brick_height DECIMAL(8,2) DEFAULT NULL COMMENT 'Brick height in mm',
ADD COLUMN mortar_thickness DECIMAL(8,2) DEFAULT 10 COMMENT 'Mortar thickness in mm',
ADD COLUMN wall_thickness DECIMAL(8,2) DEFAULT 150 COMMENT 'Wall thickness in mm',
ADD COLUMN waste_factor DECIMAL(5,2) DEFAULT 0.0 COMMENT 'Waste factor as decimal (0.05 = 5%)';

-- Update the updated_at column to use the new fields
-- (This ensures the timestamp updates when conversion fields are modified)

-- Add indexes for better performance on conversion queries
CREATE INDEX idx_materials_material_type ON materials(material_type);
CREATE INDEX idx_materials_base_unit ON materials(base_unit);

-- Show the updated table structure
DESCRIBE materials;

-- Display success message
SELECT 'Material conversion fields added successfully!' as status;
