import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ConstructionReportGenerator {
  constructor(calculation) {
    this.calculation = calculation;
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.calculatorType = this.detectCalculatorType();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 20;
  }

  detectCalculatorType() {
    if (this.calculation.beamDimensions) return 'beam';
    if (this.calculation.footplateDimensions) return 'footplate';
    if (this.calculation.shape) return this.calculation.shape === 'rectangle' || this.calculation.shape === 'square' || this.calculation.shape === 'triangle' || this.calculation.shape === 'circle' ? 'area' : 'volume';
    if (this.calculation.volume !== undefined && this.calculation.area === undefined) return 'length';
    return 'generic';
  }

  generateDetailedReport() {
    try {
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Create a simple error PDF
      this.doc = new jsPDF('p', 'mm', 'a4');
      this.doc.setFontSize(16);
      this.doc.text('Error generating detailed report', 20, 30);
      this.doc.setFontSize(12);
      this.doc.text('Please try again or contact support', 20, 50);
      return this.doc;
    }
  }

  addHeader() {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LAPORAN KALKULASI STRUKTUR', this.pageWidth / 2, 20, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 35);
    this.doc.text(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, 20, 42);
    
    this.currentY = 55;
  }

  addProjectInfo() {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INFORMASI PROYEK', 20, this.currentY);
    
    this.currentY += 10;
    
    let projectInfo = [];
    
    if (this.calculatorType === 'beam') {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Dimensi Balok', `${this.calculation.beamDimensions?.length || 0}m × ${this.calculation.beamDimensions?.width || 0}m × ${this.calculation.beamDimensions?.height || 0}m`],
        ['Volume Beton', `${(this.calculation.quantities?.concreteVolume || 0).toFixed(3)} m³`],
        ['Luas Bekisting', `${(this.calculation.quantities?.formworkArea || 0).toFixed(2)} m²`],
        ['Kualitas Beton', this.getConcreteQualityLabel()],
        ['Estimasi Durasi', `${Math.round(this.calculation.totals?.days || 0)} hari kerja`]
      ];
    } else if (this.calculatorType === 'footplate') {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Dimensi Footplate', `${this.calculation.footplateDimensions?.length || 0}m × ${this.calculation.footplateDimensions?.width || 0}m × ${this.calculation.footplateDimensions?.thickness || 0}mm`],
        ['Volume Beton', `${(this.calculation.footplateQuantities?.concreteVolume || 0).toFixed(3)} m³`],
        ['Luas Bekisting', `${(this.calculation.footplateQuantities?.formworkArea || 0).toFixed(2)} m²`],
        ['Kualitas Beton', this.getConcreteQualityLabel()],
        ['Selimut Beton', `${this.calculation.footplateDimensions?.cover || 0}mm`],
        ['Estimasi Durasi', `${Math.round(this.calculation.totals?.days || 0)} hari kerja`]
      ];
    } else {
      projectInfo = [
        ['Nama Proyek', this.calculation.projectName || 'Tidak disebutkan'],
        ['Estimasi Durasi', `${Math.round(this.calculation.totals?.days || 0)} hari kerja`]
      ];
    }

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Parameter', 'Nilai']],
      body: projectInfo,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  addBeamSpecifications() {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SPESIFIKASI TULANGAN', 20, this.currentY);
    
    const reinforcement = this.calculation.reinforcement || {};
    const reinforcementData = [
      ['Tulangan Utama', reinforcement.main || '-', `${(reinforcement.mainLength || 0).toFixed(2)} m`, `${(reinforcement.mainWeight || 0).toFixed(2)} kg`],
      ['Tulangan Sengkang', reinforcement.stirrup || '-', `${(reinforcement.stirrupLength || 0).toFixed(2)} m`, `${(reinforcement.stirrupWeight || 0).toFixed(2)} kg`],
      ['Jarak Sengkang', `${reinforcement.stirrupSpacing || 0} mm`, '-', '-'],
      ['Jumlah Sengkang', `${reinforcement.numberOfStirrups || 0} buah`, '-', '-'],
      ['Selimut Beton', `${this.calculation.beamDimensions?.cover || 0} mm`, '-', '-']
    ];

    this.doc.autoTable({
      startY: this.currentY + 5,
      head: [['Komponen', 'Spesifikasi', 'Panjang/Jumlah', 'Berat']],
      body: reinforcementData,
      theme: 'grid',
      headStyles: { 
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  addFootplateSpecifications() {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SPESIFIKASI TULANGAN FOOTPLATE', 20, this.currentY);
    
    const reinforcement = this.calculation.reinforcement || {};
    const reinforcementData = [
      ['Tulangan Arah X', reinforcement.xDirection || '-', `${(reinforcement.xLength || 0).toFixed(2)} m`, `${(reinforcement.xWeight || 0).toFixed(2)} kg`],
      ['Tulangan Arah Y', reinforcement.yDirection || '-', `${(reinforcement.yLength || 0).toFixed(2)} m`, `${(reinforcement.yWeight || 0).toFixed(2)} kg`],
      ['Jarak Tulangan X', `${reinforcement.spacingX || 0} mm`, '-', '-'],
      ['Jarak Tulangan Y', `${reinforcement.spacingY || 0} mm`, '-', '-'],
      ['Jumlah Batang X', `${reinforcement.numberOfBarsX || 0} batang`, '-', '-'],
      ['Jumlah Batang Y', `${reinforcement.numberOfBarsY || 0} batang`, '-', '-'],
      ['Total Berat Tulangan', '-', '-', `${(reinforcement.totalWeight || 0).toFixed(2)} kg`]
    ];

    this.doc.autoTable({
      startY: this.currentY + 5,
      head: [['Komponen', 'Spesifikasi', 'Panjang/Jumlah', 'Berat']],
      body: reinforcementData,
      theme: 'grid',
      headStyles: { 
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  addCalculationDetails() {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETAIL KALKULASI', 20, this.currentY);
    
    this.currentY += 15;
  }

  addMaterialBreakdown() {
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RINCIAN MATERIAL', 20, this.currentY);
    
    const materialData = [];
    
    // Handle subPekerjaan structure (from beam and footplate calculators)
    if (this.calculation.subPekerjaan && this.calculation.subPekerjaan.length > 0) {
      this.calculation.subPekerjaan.forEach(sub => {
        materialData.push([{
          content: (sub.name || 'Unknown').toUpperCase(),
          colSpan: 5,
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        }]);
        
        if (sub.materials && sub.materials.length > 0) {
          sub.materials.forEach(material => {
            materialData.push([
              material.name || 'Unknown Material',
              `${(material.quantity || 0).toFixed(4)} ${material.unit || ''}`,
              this.formatCurrency(material.price || 0),
              this.formatCurrency(material.cost || 0),
              material.siQuantity ? `${(material.siQuantity || 0).toFixed(4)} ${material.siUnit || ''}` : '-'
            ]);
          });
        } else {
          materialData.push([
            'Tidak ada material',
            '-',
            '-',
            '-',
            '-'
          ]);
        }
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
      startY: this.currentY + 5,
      head: [['Material', 'Kuantitas', 'Harga Satuan', 'Total Biaya', 'Konversi SI']],
      body: materialData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 152, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: { 
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  addLaborAnalysis() {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ANALISIS TENAGA KERJA', 20, this.currentY);
    
    const laborData = [];
    
    // Handle workers structure (from beam and footplate calculators)
    if (this.calculation.workers && 
        this.calculation.workers.beton && 
        this.calculation.workers.bekisting && 
        this.calculation.workers.besi) {
      
      laborData.push([
        'Beton', 
        `${this.calculation.workers.beton.tukang || 0} tukang, ${this.calculation.workers.beton.pekerja || 0} pekerja`, 
        this.calculation.workers.beton.ratio || '-', 
        `${this.calculation.workers.beton.teams || 0} tim`, 
        this.formatCurrency(this.calculation.workers.beton.dailyCost || 0)
      ]);
      
      laborData.push([
        'Bekisting', 
        `${this.calculation.workers.bekisting.tukang || 0} tukang, ${this.calculation.workers.bekisting.pekerja || 0} pekerja`, 
        this.calculation.workers.bekisting.ratio || '-', 
        `${this.calculation.workers.bekisting.teams || 0} tim`, 
        this.formatCurrency(this.calculation.workers.bekisting.dailyCost || 0)
      ]);
      
      laborData.push([
        'Besi', 
        `${this.calculation.workers.besi.tukang || 0} tukang, ${this.calculation.workers.besi.pekerja || 0} pekerja`, 
        this.calculation.workers.besi.ratio || '-', 
        `${this.calculation.workers.besi.teams || 0} tim`, 
        this.formatCurrency(this.calculation.workers.besi.dailyCost || 0)
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
      startY: this.currentY + 5,
      head: [['Pekerjaan', 'Komposisi', 'Rasio', 'Tim Kerja', 'Biaya/Hari']],
      body: laborData,
      theme: 'grid',
      headStyles: { 
        fillColor: [156, 39, 176],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: { 4: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  addCostSummary() {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RINGKASAN BIAYA', 20, this.currentY);
    
    const totals = this.calculation.totals || {};
    const costData = [
      ['Total Biaya Material', this.formatCurrency(totals.materialCost || 0)],
      ['Total Biaya Tenaga Kerja', this.formatCurrency(totals.laborCost || 0)],
      ['Total HPP (Harga Pokok Produksi)', this.formatCurrency(totals.hpp || 0)],
      ['Keuntungan (' + (this.calculation.profitPercentage || 0) + '%)', this.formatCurrency(totals.keuntungan || 0)],
      ['Total RAB (Rencana Anggaran Biaya)', this.formatCurrency(totals.rab || 0)]
    ];

    this.doc.autoTable({
      startY: this.currentY + 5,
      head: [['Komponen Biaya', 'Jumlah (IDR)']],
      body: costData,
      theme: 'grid',
      headStyles: { 
        fillColor: [244, 67, 54],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: { 
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  getConcreteQualityLabel() {
    const qualityMap = {
      'K125': 'K-125 (fc\' = 10.4 MPa)',
      'K175': 'K-175 (fc\' = 14.5 MPa)',
      'K200': 'K-200 (fc\' = 16.6 MPa)',
      'K225': 'K-225 (fc\' = 18.7 MPa)',
      'K250': 'K-250 (fc\' = 20.8 MPa)',
      'K300': 'K-300 (fc\' = 25 MPa)',
      'K350': 'K-350 (fc\' = 29.2 MPa)',
      'K400': 'K-400 (fc\' = 33.2 MPa)'
    };
    // Handle both concrete_quality and concreteQuality properties
    const quality = this.calculation.concrete_quality || this.calculation.concreteQuality;
    return qualityMap[quality] || 'Tidak diketahui';
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  save(filename = 'laporan-kalkulasi-struktur.pdf') {
    try {
      this.doc.save(filename);
    } catch (error) {
      console.error('Error saving PDF:', error);
      // Fallback: try to save with a simple name
      this.doc.save('laporan-kalkulasi.pdf');
    }
  }
}

// Excel export functionality (requires ExcelJS to be installed)
export const exportToExcel = async (calculation) => {
  try {
    // Dynamic import to avoid bundle issues
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kalkulasi Struktur');
    
    // Add headers and data
    worksheet.addRow(['LAPORAN KALKULASI STRUKTUR']);
    worksheet.addRow([]);
    worksheet.addRow(['Tanggal:', new Date().toLocaleDateString('id-ID')]);
    worksheet.addRow(['Proyek:', calculation.projectName || 'Tidak disebutkan']);
    
    // Add detailed breakdown based on calculator type
    if (calculation.beamDimensions) {
      worksheet.addRow([]);
      worksheet.addRow(['DIMENSI BALOK']);
      worksheet.addRow(['Panjang:', `${calculation.beamDimensions.length} m`]);
      worksheet.addRow(['Lebar:', `${calculation.beamDimensions.width} m`]);
      worksheet.addRow(['Tinggi:', `${calculation.beamDimensions.height} m`]);
    } else if (calculation.footplateDimensions) {
      worksheet.addRow([]);
      worksheet.addRow(['DIMENSI FOOTPLATE']);
      worksheet.addRow(['Panjang:', `${calculation.footplateDimensions.length} m`]);
      worksheet.addRow(['Lebar:', `${calculation.footplateDimensions.width} m`]);
      worksheet.addRow(['Tebal:', `${calculation.footplateDimensions.thickness} mm`]);
    }
    
    return workbook;
  } catch (error) {
    console.warn('ExcelJS not available, skipping Excel export');
    return null;
  }
};
