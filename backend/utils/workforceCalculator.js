/**
 * Fungsi untuk menghitung lama waktu pekerjaan konstruksi
 * berdasarkan komposisi tenaga kerja dan produktivitas
 */

/**
 * Menghitung produktivitas aktual berdasarkan komposisi tim kerja
 * SIMPLIFIED: Logika sederhana yang lebih intuitif
 * @param {number} jumlahTukang - Jumlah tukang yang tersedia
 * @param {number} jumlahPekerja - Jumlah pekerja yang tersedia
 * @param {number} rasioTukang - Rasio tukang per tim standar
 * @param {number} rasioPekerja - Rasio pekerja per tim standar
 * @param {number} produktivitasStandar - Produktivitas standar per tim
 * @returns {Object} Hasil perhitungan produktivitas aktual
 */
function hitungProduktivitasAktual(jumlahTukang, jumlahPekerja, rasioTukang, rasioPekerja, produktivitasStandar) {
  // SIMPLIFIED: Logika sederhana yang lebih intuitif
  // Contoh: Rasio 1:1 dengan 2 tukang + 2 pekerja = 2 tim = produktivitas 2x lipat
  
  let jumlahTim = 0;
  
  if (rasioTukang > 0 && rasioPekerja > 0) {
    // Kedua jenis pekerja dibutuhkan
    // Hitung berapa tim yang bisa dibentuk berdasarkan rasio
    const timDariTukang = Math.floor(jumlahTukang / rasioTukang);
    const timDariPekerja = Math.floor(jumlahPekerja / rasioPekerja);
    jumlahTim = Math.min(timDariTukang, timDariPekerja);
  } else if (rasioTukang > 0 && rasioPekerja === 0) {
    // Hanya tukang yang dibutuhkan
    jumlahTim = Math.floor(jumlahTukang / rasioTukang);
  } else if (rasioTukang === 0 && rasioPekerja > 0) {
    // Hanya pekerja yang dibutuhkan
    jumlahTim = Math.floor(jumlahPekerja / rasioPekerja);
  }
  
  // Hitung sisa pekerja
  const tukangDigunakan = jumlahTim * rasioTukang;
  const pekerjaDigunakan = jumlahTim * rasioPekerja;
  const tukangSisa = jumlahTukang - tukangDigunakan;
  const pekerjaSisa = jumlahPekerja - pekerjaDigunakan;
  
  // SIMPLIFIED: Tidak ada tim parsial, hanya hitung berdasarkan jumlah tim yang terbentuk
  // Produktivitas = jumlah tim × produktivitas standar per tim
  const totalProduktivitas = produktivitasStandar * jumlahTim;
  
  return {
    timIdeal: jumlahTim,
    tukangSisa,
    pekerjaSisa,
    timParsial: 0, // Tidak ada tim parsial dalam logika sederhana
    totalProduktivitas,
    totalTim: jumlahTim,
    detail: {
      timIdealFormed: jumlahTim,
      partialTeamEfficiency: 0,
      tukangUsedIdeal: tukangDigunakan,
      pekerjaUsedIdeal: pekerjaDigunakan,
      tukangRemaining: tukangSisa,
      pekerjaRemaining: pekerjaSisa,
      timDariTukangSisa: 0,
      timDariPekerjaSisa: 0
    }
  };
}

/**
 * Menghitung durasi pekerjaan berdasarkan komposisi tim kerja
 * @param {Object} params - Parameter input
 * @param {number} params.volume_pekerjaan - Volume pekerjaan dalam m²
 * @param {number} params.jumlah_tukang - Jumlah tukang yang tersedia
 * @param {number} params.jumlah_pekerja - Jumlah pekerja yang tersedia
 * @param {string} params.rasio_tukang_pekerja - Rasio dalam format "1:2"
 * @param {number} params.produktivitas_per_tim - Produktivitas per tim dalam m²/hari (default: 10)
 * @returns {Object} Hasil perhitungan
 */
function hitungDurasiPekerjaan({
  volume_pekerjaan,
  jumlah_tukang,
  jumlah_pekerja,
  rasio_tukang_pekerja,
  produktivitas_per_tim
}) {
  // Validasi input
  if (!volume_pekerjaan || volume_pekerjaan <= 0) {
    throw new Error('Volume pekerjaan harus lebih dari 0');
  }
  
  // FIXED: Allow 0 workers for edge case handling
  if (jumlah_tukang === undefined || jumlah_tukang === null || jumlah_tukang < 0) {
    throw new Error('Jumlah tukang tidak valid');
  }
  
  if (jumlah_pekerja === undefined || jumlah_pekerja === null || jumlah_pekerja < 0) {
    throw new Error('Jumlah pekerja tidak valid');
  }
  
  // FIXED: Allow edge case where both workers are 0 (will result in 0 teams)
  if (jumlah_tukang === 0 && jumlah_pekerja === 0) {
    return {
      jumlah_tim_kerja: 0,
      produktivitas_per_hari: 0,
      durasi_kerja_dalam_hari: 0,
      detail: {
        rasio_tukang: 0,
        rasio_pekerja: 0,
        tukang_digunakan: 0,
        pekerja_digunakan: 0,
        tukang_sisa: 0,
        pekerja_sisa: 0,
        tim_dari_tukang: 0,
        tim_dari_pekerja: 0,
        produktivitas_per_tim: produktivitas_per_tim
      }
    };
  }
  
  if (!rasio_tukang_pekerja) {
    throw new Error('Rasio tukang:pekerja harus diisi');
  }
  
  if (!produktivitas_per_tim || produktivitas_per_tim <= 0) {
    throw new Error('Produktivitas per tim harus lebih dari 0');
  }
  
  // Parse rasio (contoh: "1:2" -> [1, 2])
  const [rasio_tukang, rasio_pekerja] = rasio_tukang_pekerja.split(':').map(Number);
  
  // FIXED: Allow 0 in ratio for edge cases, but both cannot be 0
  if (isNaN(rasio_tukang) || isNaN(rasio_pekerja) || rasio_tukang < 0 || rasio_pekerja < 0) {
    throw new Error('Format rasio tidak valid. Gunakan format "1:2"');
  }
  
  if (rasio_tukang === 0 && rasio_pekerja === 0) {
    throw new Error('Rasio tidak boleh 0:0. Minimal salah satu harus lebih dari 0');
  }
  
  // UPDATED: Gunakan fungsi hitungProduktivitasAktual yang baru
  const produktivitasResult = hitungProduktivitasAktual(
    jumlah_tukang,
    jumlah_pekerja,
    rasio_tukang,
    rasio_pekerja,
    produktivitas_per_tim
  );
  
  // Extract hasil dari fungsi baru
  const jumlah_tim_kerja = produktivitasResult.timIdeal;
  const produktivitas_per_hari = produktivitasResult.totalProduktivitas;
  const tukang_digunakan = produktivitasResult.detail.tukangUsedIdeal;
  const pekerja_digunakan = produktivitasResult.detail.pekerjaUsedIdeal;
  const tukang_sisa = produktivitasResult.tukangSisa;
  const pekerja_sisa = produktivitasResult.pekerjaSisa;
  
  // Informasi tambahan dari perhitungan baru
  const tim_parsial = produktivitasResult.timParsial;
  const total_tim_efektif = produktivitasResult.totalTim;
  
  // Hitung durasi kerja (bulatkan ke atas)
  const durasi_kerja_dalam_hari = produktivitas_per_hari > 0 
    ? Math.ceil(volume_pekerjaan / produktivitas_per_hari)
    : 0;
  
  
  return {
    jumlah_tim_kerja: Math.floor(total_tim_efektif), // Tim utama untuk display
    produktivitas_per_hari,
    durasi_kerja_dalam_hari,
    detail: {
      rasio_tukang,
      rasio_pekerja,
      tukang_digunakan,
      pekerja_digunakan,
      tukang_sisa,
      pekerja_sisa,
      tim_ideal: jumlah_tim_kerja,
      tim_parsial: tim_parsial,
      total_tim_efektif: total_tim_efektif,
      produktivitas_per_tim,
      // Informasi tambahan untuk debugging
      produktivitas_breakdown: {
        dari_tim_ideal: jumlah_tim_kerja * produktivitas_per_tim,
        dari_tim_parsial: tim_parsial * produktivitas_per_tim,
        total: produktivitas_per_hari
      }
    }
  };
}

/**
 * Fungsi untuk testing dengan contoh yang diberikan
 */
function testCalculation() {
  const testCase = {
    volume_pekerjaan: 60,
    jumlah_tukang: 2,
    jumlah_pekerja: 4,
    rasio_tukang_pekerja: '1:2',
    produktivitas_per_tim: 10
  };
  
  const result = hitungDurasiPekerjaan(testCase);
  
  const isCorrect = (
    result.jumlah_tim_kerja === 2 &&
    result.produktivitas_per_hari === 20 &&
    result.durasi_kerja_dalam_hari === 3
  );
  
  return result;
}

module.exports = {
  hitungDurasiPekerjaan,
  hitungProduktivitasAktual,
  testCalculation
};
