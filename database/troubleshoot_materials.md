# Troubleshooting: Material Tidak Ditemukan di Database

## Langkah-langkah untuk mengatasi masalah "material tidak ditemukan di database":

### 1. Buka Browser Console
1. Buka PlasterCalculator di browser (`http://localhost:3000/plaster-calculator`)
2. Tekan F12 atau klik kanan → Inspect Element
3. Pilih tab "Console"
4. Refresh halaman atau buka PlasterCalculator

### 2. Periksa Debug Output
Anda akan melihat output seperti ini:
```
📋 SEMUA MATERIAL DI DATABASE:
  1. "Semen Portland" - zak - Rp65.000 - Semen Gresik
  2. "Pasir Beton" - m3 - Rp350.000 - Supplier Lokal
  3. "Semen Instan" - zak - Rp45.000 - Mortar Utama
  ...

🔍 Mencari material: "Adamix"
  - Memeriksa: "Semen Portland" (zak)
    Adamix check: false (semen+instan: false, plester: false)
  - Memeriksa: "Semen Instan" (zak)
    Adamix check: true (semen+instan: true, plester: false)
✅ Material "Adamix" ditemukan: "Semen Instan" (Rp45.000/zak)

📊 HASIL MATCHING:
  - Adamix: ✅ DITEMUKAN (Rp45.000/zak)
  - Giant: ❌ PLACEHOLDER (Rp0/sak)
  - Lem rajawali: ❌ PLACEHOLDER (Rp0/BOX)
```

### 3. Solusi Berdasarkan Output Console

#### Jika Material Tidak Ada di Database:
Jalankan SQL berikut untuk menambahkan material:

```sql
-- Tambahkan material yang hilang
INSERT IGNORE INTO materials (name, unit, price, supplier, description) VALUES
('ADAMIX PLESTER INSTAN', 'sak', 48000, 'Supplier Lokal', 'Adamix plester instan 40kg untuk plamiran'),
('GIANT SEMEN PUTIH', 'sak', 52000, 'Supplier Lokal', 'Giant semen putih 40kg untuk finishing'),
('LEM RAJAWALI ISI 60 PCS', 'BOX', 1010000, 'Supplier Lokal', 'Lem rajawali isi 60 pcs per box untuk plamiran');
```

#### Jika Material Ada tapi Tidak Cocok:
Periksa nama material di database dan sesuaikan dengan logika matching:

**Untuk Adamix:**
- Harus mengandung kata "semen" DAN "instan", ATAU
- Harus mengandung kata "plester"

**Untuk Giant:**
- Harus mengandung kata "semen" DAN ("putih" ATAU "instan")

**Untuk Lem rajawali:**
- Harus mengandung kata "lem" DAN "rajawali"

### 4. Verifikasi Setelah Perbaikan
1. Refresh halaman PlasterCalculator
2. Periksa console lagi
3. Pastikan semua material menunjukkan "✅ DITEMUKAN"

### 5. Jika Masih Bermasalah
1. Periksa koneksi database
2. Pastikan API `/api/materials` berjalan dengan benar
3. Test API dengan: `curl http://localhost:3001/api/materials`
4. Periksa apakah ada error di server console

### 6. Contoh Material Database yang Benar
```sql
-- Material yang akan cocok dengan PlasterCalculator
INSERT INTO materials (name, unit, price, supplier, description) VALUES
('Semen Instan', 'zak', 45000, 'Mortar Utama', 'Semen instan untuk plester'),           -- Cocok untuk Adamix
('GIANT SEMEN PUTIH', 'sak', 52000, 'Supplier Lokal', 'Giant semen putih'),            -- Cocok untuk Giant
('LEM RAJAWALI ISI 60 PCS', 'BOX', 1010000, 'Supplier Lokal', 'Lem rajawali 60 pcs'); -- Cocok untuk Lem rajawali
```

### 7. Quick Fix: Update Existing Materials
Jika tidak ingin menambah material baru, update material existing:
```sql
-- Update material existing agar cocok
UPDATE materials SET name = 'SEMEN INSTAN PLESTER' WHERE name = 'Semen Instan';
