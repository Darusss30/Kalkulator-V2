-- Add specific materials for brick calculator
USE kalkulator_konstruksi;

-- Add BATA MERAH ISI 6000 PCS
INSERT INTO materials (name, unit, price, supplier, description) VALUES
('BATA MERAH ISI 6000 PCS', 'truk', 5900000, 'Supplier Lokal', 'Bata merah isi 6000 pcs per truk'),
('SEMEN TIGA RODA', 'zak', 65000, 'Tiga Roda', 'Semen Tiga Roda 40kg'),
('PASIR JAPANAN TRUK', 'truk', 1700000, 'Supplier Lokal', 'Pasir Japanan halus per truk');

-- Add more brick variants
INSERT INTO materials (name, unit, price, supplier, description) VALUES
('BATA PUTIH ISI 2000 PCS', 'dum', 1350000, 'Supplier Lokal', 'Bata putih/hebel isi 2000 pcs per dum'),
('BATA PUTIH ISI 500 PCS', 'pickup', 450000, 'Supplier Lokal', 'Bata putih/hebel isi 500 pcs per pickup'),
('BATA RINGAN', 'm3', 600000, 'Supplier Lokal', 'Bata ringan AAC per m3');
