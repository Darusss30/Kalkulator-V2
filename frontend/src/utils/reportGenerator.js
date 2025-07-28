import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ConstructionReportGenerator {
  constructor(calculation) {
    this.calculation = calculation;
    this.doc = new jsPDF();
    this.calculatorType = this.detectCalculatorType();
  }

  detectCalculatorType() {
    if (this.calculation.beamDimensions) return 'beam';
    if (this.calculation.footplateDimensions) return 'footplate';
    if (this.calculation.shape) return this.calculation.shape === 'rectangle' || this.calculation.shape === 'square' || this.calculation.shape === 'triangle' || this.calculation.shape === 'circle' ? 'area' : 'volume';
    if (this.calculation.volume !== undefined && this.calculation.area === undefined) return 'length';
    return 'generic';
  }

  generateDetailedReport() {
    this.addHeader();
    this.addProjectInfo();
    
    if (this.calculatorType === 'beam') {
      this.addBeamSpecifications();
    } else if (this.calculatorType === 'footplate') {
      this.addFootplateSpecifications();
    } else {
      this.addCalculationDetails();
    }
    
    this.addMaterialBreakdown();
    this.addLaborAnalysis();
    this.addCostSummary();
    
    return this.doc;
  }

  addHeader() {
    this.doc.setFontSize(20);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('LAPORAN KALKULASI STRUKTUR', 105, 20, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 35);
    this.doc.text(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, 20, 42);
  }

  addProjectInfo() {
    let yPos = 55;
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('INFORMASI PROYEK', 20, yPos);
    
    yPos += 10;
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    
    let projectInfo = [];
    
    if (this.calculatorType === 'beam') {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Dimensi Balok', `${this.calculation.beamDimensions.length}m × ${this.calculation.beamDimensions.width}m × ${this.calculation.beamDimensions.height}m`],
        ['Volume Beton', `${this.calculation.quantities.concreteVolume.toFixed(3)} m³`],
        ['Luas Bekisting', `${this.calculation.quantities.formworkArea.toFixed(2)} m²`],
        ['Kualitas Beton', this.getConcreteQualityLabel()],
        ['Estimasi Durasi', `${this.calculation.totals.days.toFixed(1)} hari kerja`]
      ];
    } else if (this.calculatorType === 'footplate') {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Dimensi Footplate', `${this.calculation.footplateDimensions.length}m × ${this.calculation.footplateDimensions.width}m × ${this.calculation.footplateDimensions.thickness}m`],
        ['Volume Beton', `${this.calculation.quantities.concreteVolume.toFixed(3)} m³`],
        ['Luas Bekisting', `${this.calculation.quantities.formworkArea.toFixed(2)} m²`],
        ['Kualitas Beton', this.getConcreteQualityLabel()],
        ['Selimut Beton', `${this.calculation.footplateDimensions.cover}m`],
        ['Estimasi Durasi', `${this.calculation.totals.days.toFixed(1)} hari kerja`]
      ];
    } else {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Estimasi Durasi', `${this.calculation.totals?.days?.toFixed(1) || 'N/A'} hari kerja`]
      ];
    }

    this.doc.autoTable({
      startY: yPos,
      head: [['Parameter', 'Nilai']],
      body: projectInfo,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });
  }

  addBeamSpecifications() {
    const finalY = this.doc.lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('SPESIFIKASI TULANGAN', 20, finalY);
    
    const reinforcementData = [
      ['Tulangan Utama', this.calculation.reinforcement.main, `${this.calculation.reinforcement.mainLength.toFixed(2)} m`, `${this.calculation.reinforcement.mainWeight.toFixed(2)} kg`],
      ['Tulangan Sengkang', this.calculation.reinforcement.stirrup, `${this.calculation.reinforcement.stirrupLength.toFixed(2)} m`, `${this.calculation.reinforcement.stirrupWeight.toFixed(2)} kg`],
      ['Jarak Sengkang', `${this.calculation.reinforcement.stirrupSpacing} mm`, '-', '-'],
      ['Jumlah Sengkang', `${this.calculation.reinforcement.numberOfStirrups} buah`, '-', '-'],
      ['Selimut Beton', `${this.calculation.beamDimensions.cover} mm`, '-', '-']
    ];

    this.doc.autoTable({
      startY: finalY + 5,
      head: [['Komponen', 'Spesifikasi', 'Panjang/Jumlah', 'Berat']],
      body: reinforcementData,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] }
    });
  }

  addFootplateSpecifications() {
    const finalY = this.doc.lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('SPESIFIKASI TULANGAN FOOTPLATE', 20, finalY);
    
    const reinforcementData = [
      ['Tulangan Arah X', this.calculation.reinforcement.xDirection, `${this.calculation.reinforcement.xLength.toFixed(2)} m`, `${this.calculation.reinforcement.xWeight.toFixed(2)} kg`],
      ['Tulangan Arah Y', this.calculation.reinforcement.yDirection, `${this.calculation.reinforcement.yLength.toFixed(2)} m`, `${this.calculation.reinforcement.yWeight.toFixed(2)} kg`],
      ['Jarak Tulangan X', `${this.calculation.reinforcement.spacingX} m`, '-', '-'],
      ['Jarak Tulangan Y', `${this.calculation.reinforcement.spacingY} m`, '-', '-'],
      ['Jumlah Batang X', `${this.calculation.reinforcement.numberOfBarsX} batang`, '-', '-'],
      ['Jumlah Batang Y', `${this.calculation.reinforcement.numberOfBarsY} batang`, '-', '-'],
      ['Total Berat Tulangan', '-', '-', `${this.calculation.reinforcement.totalWeight.toFixed(2)} kg`]
    ];

    this.doc.autoTable({
      startY: finalY + 5,
      head: [['Komponen', 'Spesifikasi', 'Panjang/Jumlah', 'Berat']],
      body: reinforcementData,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] }
    });
  }

  addMaterialBreakdown() {
    const finalY = this.doc.lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('RINCIAN MATERIAL', 20, finalY);
    
    const materialData = [];
    
    // Handle subPekerjaan structure (from beam and footplate calculators)
    if (this.calculation.subPekerjaan && this.calculation.subPekerjaan.length > 0) {
      this.calculation.subPekerjaan.forEach(sub => {
        materialData.push([{
          content: sub.name.toUpperCase(),
          colSpan: 5,
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        }]);
        
        sub.materials.forEach(material => {
          materialData.push([
            material.name,
            `${material.quantity.toFixed(2)} ${material.unit}`,
            this.formatCurrency(material.price),
            this.formatCurrency(material.cost),
            material.siQuantity ? `${material.siQuantity.toFixed(2)} ${material.siUnit}` : '-'
          ]);
        });
      });
    } else {
      // Fallback for other calculator types
      materialData.push([
        'Material tidak tersedia',
        '-',
        '-',
        '-',
        '-'
      ]);
    }

    this.doc.autoTable({
      startY: finalY + 5,
      head: [['Material', 'Kuantitas', 'Harga Satuan', 'Total Biaya', 'Konversi SI']],
      body: materialData,
      theme: 'grid',
      headStyles: { fillColor: [255, 152, 0] },
      columnStyles: { 
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
  }

  addLaborAnalysis() {
    const finalY = this.doc.lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('ANALISIS TENAGA KERJA', 20, finalY);
    
    const laborData = [];
    
    // Handle workers structure (from beam and footplate calculators)
    if (this.calculation.workers && 
        this.calculation.workers.beton && 
        this.calculation.workers.bekisting && 
        this.calculation.workers.besi) {
      
      laborData.push([
        'Beton', 
        `${this.calculation.workers.beton.tukang} tukang, ${this.calculation.workers.beton.pekerja} pekerja`, 
        this.calculation.workers.beton.ratio, 
        `${this.calculation.workers.beton.teams} tim`, 
        this.formatCurrency(this.calculation.workers.beton.dailyCost)
      ]);
      
      laborData.push([
        'Bekisting', 
        `${this.calculation.workers.bekisting.tukang} tukang, ${this.calculation.workers.bekisting.pekerja} pekerja`, 
        this.calculation.workers.bekisting.ratio, 
        `${this.calculation.workers.bekisting.teams} tim`, 
        this.formatCurrency(this.calculation.workers.bekisting.dailyCost)
      ]);
      
      laborData.push([
        'Besi', 
        `${this.calculation.workers.besi.tukang} tukang, ${this.calculation.workers.besi.pekerja} pekerja`, 
        this.calculation.workers.besi.ratio, 
        `${this.calculation.workers.besi.teams} tim`, 
        this.formatCurrency(this.calculation.workers.besi.dailyCost)
      ]);
    } else {
      // Fallback for other calculator types
      laborData.push([
        'Data tenaga kerja tidak tersedia',
        '-',
        '-',
        '-',
        '-'
      ]);
    }

    this.doc.autoTable({
      startY: finalY + 5,
      head: [['Pekerjaan', 'Komposisi', 'Rasio', 'Tim Kerja', 'Biaya/Hari']],
      body: laborData,
      theme: 'grid',
      headStyles: { fillColor: [156, 39, 176] },
      columnStyles: { 4: { halign: 'right' } }
    });
  }

  addCostSummary() {
    const finalY = this.doc.lastAutoTable.finalY + 15;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('RINGKASAN BIAYA', 20, finalY);
    
    const costData = [
      ['Total Biaya Material', this.formatCurrency(this.calculation.totals.materialCost)],
      ['Total Biaya Tenaga Kerja', this.formatCurrency(this.calculation.totals.laborCost)],
      ['Total HPP (Harga Pokok Produksi)', this.formatCurrency(this.calculation.totals.hpp)],
      ['Keuntungan (' + this.calculation.profitPercentage + '%)', this.formatCurrency(this.calculation.totals.keuntungan)],
      ['Total RAB (Rencana Anggaran Biaya)', this.formatCurrency(this.calculation.totals.rab)]
    ];

    this.doc.autoTable({
      startY: finalY + 5,
      head: [['Komponen Biaya', 'Jumlah (IDR)']],
      body: costData,
      theme: 'grid',
      headStyles: { fillColor: [244, 67, 54] },
      columnStyles: { 
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  getConcreteQualityLabel() {
    const qualityMap = {
      'K175': 'K-175 (fc\' = 14.5 MPa)',
      'K200': 'K-200 (fc\' = 16.6 MPa)',
      'K225': 'K-225 (fc\' = 18.7 MPa)',
      'K250': 'K-250 (fc\' = 20.8 MPa)',
      'K300': 'K-300 (fc\' = 25 MPa)',
      'K350': 'K-350 (fc\' = 29.2 MPa)'
    };
    // Handle both concrete_quality and concreteQuality properties
    const quality = this.calculation.concrete_quality || this.calculation.concreteQuality;
    return qualityMap[quality] || 'Tidak diketahui';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  save(filename = 'laporan-kalkulasi-balok.pdf') {
    this.doc.save(filename);
  }
}

// Excel export functionality (requires ExcelJS to be installed)
export const exportToExcel = async (calculation) => {
  try {
    // Dynamic import to avoid bundle issues
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kalkulasi Balok');
    
    // Add headers and data
    worksheet.addRow(['LAPORAN KALKULASI STRUKTUR']);
    worksheet.addRow([]);
    worksheet.addRow(['Tanggal:', new Date().toLocaleDateString('id-ID')]);
    worksheet.addRow(['Proyek:', calculation.projectName || 'Tidak disebutkan']);
    
    // Add detailed breakdown
    worksheet.addRow([]);
    worksheet.addRow(['DIMENSI BALOK']);
    worksheet.addRow(['Panjang:', `${calculation.beamDimensions.length} m`]);
    worksheet.addRow(['Lebar:', `${calculation.beamDimensions.width} m`]);
    worksheet.addRow(['Tinggi:', `${calculation.beamDimensions.height} m`]);
    
    return workbook;
  } catch (error) {
    console.warn('ExcelJS not available, skipping Excel export');
    return null;
  }
};
