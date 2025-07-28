-- Kalkulator Biaya Konstruksi Modular Database Schema
-- Created: 2024

DROP DATABASE IF EXISTS kalkulator_konstruksi;
CREATE DATABASE kalkulator_konstruksi;
USE kalkulator_konstruksi;

-- Table: job_categories (10 kategori pekerjaan utama)
CREATE TABLE job_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: job_types (sub-item pekerjaan per kategori)
CREATE TABLE job_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- m2, m3, m, unit, ls
    description TEXT,
    base_productivity DECIMAL(10,2), -- produktivitas dasar per hari
    input_config JSON, -- ADDED: Konfigurasi input untuk kalkulator dinamis
    calculator_configured BOOLEAN DEFAULT FALSE, -- ADDED: Apakah kalkulator sudah dikonfigurasi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES job_categories(id) ON DELETE CASCADE
);

-- Table: materials (database material dan harga)
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, m3, m2, pcs, dll
    price DECIMAL(15,2) NOT NULL,
    supplier VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: labor_rates (upah pekerja dan produktivitas)
CREATE TABLE labor_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    worker_type VARCHAR(50) NOT NULL, -- tukang, pekerja, mandor
    daily_rate DECIMAL(10,2) NOT NULL, -- upah per hari
    skill_level VARCHAR(20) DEFAULT 'standard', -- standard, expert, senior
    location VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: job_type_materials (relasi pekerjaan dan material yang dibutuhkan)
CREATE TABLE job_type_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_type_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity_per_unit DECIMAL(10,4) NOT NULL, -- kebutuhan material per satuan volume
    waste_factor DECIMAL(5,2) DEFAULT 0.05, -- faktor pemborosan (5% default)
    is_primary BOOLEAN DEFAULT FALSE, -- material utama atau pendukung
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    UNIQUE KEY unique_job_material (job_type_id, material_id)
);

-- Table: users (untuk authentication)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: calculations (menyimpan history kalkulasi)
CREATE TABLE calculations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    job_type_id INT NOT NULL,
    volume DECIMAL(10,2) NOT NULL,
    productivity DECIMAL(10,2) NOT NULL,
    worker_ratio VARCHAR(20) NOT NULL, -- contoh: "1:1", "1:2"
    num_workers INT,
    labor_cost DECIMAL(15,2) NOT NULL,
    material_cost DECIMAL(15,2) NOT NULL,
    hpp_per_unit DECIMAL(15,2) NOT NULL,
    total_rab DECIMAL(15,2) NOT NULL,
    estimated_days DECIMAL(5,1) NOT NULL,
    calculation_data JSON, -- menyimpan detail kalkulasi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE CASCADE
);

-- Indexes untuk performa
CREATE INDEX idx_job_types_category ON job_types(category_id);
CREATE INDEX idx_job_type_materials_job_type ON job_type_materials(job_type_id);
CREATE INDEX idx_job_type_materials_material ON job_type_materials(material_id);
CREATE INDEX idx_calculations_user ON calculations(user_id);
CREATE INDEX idx_calculations_job_type ON calculations(job_type_id);
CREATE INDEX idx_calculations_created ON calculations(created_at);

-- Views untuk kemudahan query
CREATE VIEW v_job_types_with_category AS
SELECT 
    jt.*,
    jc.name as category_name,
    jc.description as category_description
FROM job_types jt
JOIN job_categories jc ON jt.category_id = jc.id;

CREATE VIEW v_job_materials AS
SELECT 
    jtm.*,
    jt.name as job_type_name,
    jt.unit as job_unit,
    m.name as material_name,
    m.unit as material_unit,
    m.price as material_price,
    (jtm.quantity_per_unit * (1 + jtm.waste_factor)) as total_quantity_per_unit,
    (jtm.quantity_per_unit * (1 + jtm.waste_factor) * m.price) as cost_per_unit
FROM job_type_materials jtm
JOIN job_types jt ON jtm.job_type_id = jt.id
JOIN materials m ON jtm.material_id = m.id;
