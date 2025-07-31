-- Fix Material Conversion Data
-- This script fixes the conversion data for materials like cement (semen)
-- to show correct price per base unit

USE kalkulator_konstruksi;

-- Update cement materials with correct conversion
-- Example: Semen Portland 53,000/sak where 1 sak = 40kg
UPDATE materials 
SET 
    conversion_factor = 40.0,
    base_unit = 'kg',
    conversion_description = '1 sak = 40 kg',
    material_type = 'cement'
WHERE name LIKE '%semen%' OR name LIKE '%cement%';

-- Update other common materials with conversions
-- Pasir: typically sold per m3 but calculated per kg
UPDATE materials 
SET 
    conversion_factor = 1600.0, -- 1 m3 = ~1600 kg
    base_unit = 'kg',
    conversion_description = '1 m³ ≈ 1600 kg',
    material_type = 'aggregate'
WHERE name LIKE '%pasir%' AND unit = 'm3';

-- Kerikil/Koral: typically sold per m3 but calculated per kg  
UPDATE materials 
SET 
    conversion_factor = 1500.0, -- 1 m3 = ~1500 kg
    base_unit = 'kg',
    conversion_description = '1 m³ ≈ 1500 kg',
    material_type = 'aggregate'
WHERE (name LIKE '%kerikil%' OR name LIKE '%koral%') AND unit = 'm3';

-- Besi beton: sold per batang but calculated per kg
UPDATE materials 
SET 
    conversion_factor = 12.0, -- 1 batang 12m = weight depends on diameter
    base_unit = 'kg',
    conversion_description = '1 batang (12m)',
    material_type = 'steel'
WHERE name LIKE '%besi%' AND unit = 'batang';

-- Update specific steel weights based on diameter
UPDATE materials 
SET conversion_factor = 12.0 * 0.617 -- 12m * 0.617 kg/m for 10mm
WHERE name LIKE '%besi%' AND name LIKE '%10%' AND unit = 'batang';

UPDATE materials 
SET conversion_factor = 12.0 * 0.888 -- 12m * 0.888 kg/m for 12mm
WHERE name LIKE '%besi%' AND name LIKE '%12%' AND unit = 'batang';

UPDATE materials 
SET conversion_factor = 12.0 * 1.578 -- 12m * 1.578 kg/m for 16mm
WHERE name LIKE '%besi%' AND name LIKE '%16%' AND unit = 'batang';

-- Kawat bendrat: sold per bendel but calculated per kg
UPDATE materials 
SET 
    conversion_factor = 25.0, -- 1 bendel = ~25 kg
    base_unit = 'kg',
    conversion_description = '1 bendel ≈ 25 kg',
    material_type = 'steel'
WHERE name LIKE '%kawat%' AND unit = 'bendel';

-- Show updated materials with conversions
SELECT 
    id,
    name,
    price,
    unit,
    conversion_factor,
    base_unit,
    conversion_description,
    ROUND(price / conversion_factor, 0) as price_per_base_unit
FROM materials 
WHERE conversion_factor IS NOT NULL AND conversion_factor != 1.0
ORDER BY material_type, name;

SELECT 'Material conversion data updated successfully!' as status;
