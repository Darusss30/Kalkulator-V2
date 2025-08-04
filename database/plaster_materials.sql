-- Additional materials for Plaster Calculator
-- Insert missing materials for plaster work

-- Check if materials already exist, if not insert them
INSERT IGNORE INTO materials (name, unit, price, supplier, description) VALUES
-- Material untuk Plamiran
('ADAMIX PLESTER INSTAN', 'sak', 48000, 'Supplier Lokal', 'Adamix plester instan 40kg untuk plamiran'),
('GIANT SEMEN PUTIH', 'sak', 52000, 'Supplier Lokal', 'Giant semen putih 40kg untuk finishing'),
('LEM RAJAWALI ISI 60 PCS', 'BOX', 1010000, 'Supplier Lokal', 'Lem rajawali isi 60 pcs per box untuk plamiran');

-- Alternative: Update existing Semen Instan to be more specific for plaster work
-- UPDATE materials SET description = 'Semen instan untuk plester dan plamiran' WHERE name = 'Semen Instan';

-- Add plaster job type to Pekerjaan Pasangan & Finishing category (category_id = 4)
INSERT IGNORE INTO job_types (category_id, name, unit, description, base_productivity) VALUES
(4, 'Plamiran 3 Lapis', 'm2', 'Pekerjaan plamiran 3 lapis (dasar, tengah, finishing)', 12.00);

-- Note: The PlasterCalculator will automatically match materials based on:
-- 1. "Adamix" -> matches "ADAMIX PLESTER INSTAN" or falls back to "Semen Instan"
-- 2. "Giant" -> matches "GIANT SEMEN PUTIH" or falls back to "Semen Instan" 
-- 3. "Lem rajawali" -> matches "LEM RAJAWALI ISI 60 PCS"

-- If the specific materials are not available, the calculator will use existing materials:
-- - Semen Instan (existing in database) as fallback for Adamix/Giant
-- - Will create placeholder for Lem rajawali if not found
