import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class GenericReportGenerator {
  constructor(calculation, calculatorType = 'generic', jobType = null) {
    this.calculation = calculation;
    this.calculatorType = calculatorType;
    this.jobType = jobType;
    this.doc = new jsPDF();
  }

  generateReport() {
    try {
      this.addHeader();
      this.addProjectInfo();
      this.addMaterialBreakdown();
      this.addLaborAnalysis();
      this.addCostSummary();
      this.addFooter();
      
      return this.doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return this.generateFallbackReport();
    }
  }

  generateFallbackReport() {
    this.doc = new jsPDF();
    
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('LAPORAN KALKULASI KONSTRUKSI', 105, 20, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 35);
    this.doc.text(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, 20, 42);
    
    let yPos = 60;
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('HASIL KALKULASI', 20, yPos);
    
    yPos += 15;
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    
    // Add basic calculation info
    if (this.calculation.hpp) {
      this.doc.text(`HPP: ${this.formatCurrency(this.calculation.hpp)}`, 20, yPos);
      yPos += 8;
    }
    if (this.calculation.rab) {
      this.doc.text(`RAB: ${this.formatCurrency(this.calculation.rab)}`, 20, yPos);
      yPos += 8;
    }
    
    return this.doc;
  }

  addHeader() {
    // Use job type name if available, otherwise use default titles
    let title = 'LAPORAN KALKULASI KONSTRUKSI';
    
    if (this.jobType && this.jobType.name) {
      title = `LAPORAN KALKULASI ${this.jobType.name.toUpperCase()}`;
    } else {
      const titles = {
        volume: 'LAPORAN KALKULASI VOLUME',
        area: 'LAPORAN KALKULASI LUAS',
        length: 'LAPORAN KALKULASI PANJANG',
        beam: 'LAPORAN KALKULASI STRUKTUR',
        generic: 'LAPORAN KALKULASI KONSTRUKSI'
      };
      title = titles[this.calculatorType] || titles.generic;
    }
    
    this.doc.setFontSize(18);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, 105, 20, { align: 'center' });
    
    this.doc.setFontSize(10);
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
    
    const projectInfo = [];
    
    // Project name
    if (this.calculation.projectName || this.calculation.project_name) {
      projectInfo.push(['Nama Proyek', this.calculation.projectName || this.calculation.project_name]);
    }
    
    // Volume/Area/Length
    if (this.calculation.volume) {
      const unit = this.calculatorType === 'volume' ? 'm³' : 
                   this.calculatorType === 'area' ? 'm²' : 'm';
      const label = this.calculatorType === 'volume' ? 'Volume' : 
                    this.calculatorType === 'area' ? 'Luas' : 'Panjang';
      projectInfo.push([label, `${this.calculation.volume} ${unit}`]);
    }
    
    // Shape info
    if (this.calculation.shape) {
      const shapeNames = {
        rectangle: 'Persegi Panjang',
        square: 'Persegi',
        triangle: 'Segitiga',
        circle: 'Lingkaran',
        cube: 'Kubus/Balok',
        cylinder: 'Silinder',
        sphere: 'Bola',
        cone: 'Kerucut',
        pyramid: 'Limas',
        trapezoid: 'Prisma Trapesium'
      };
      projectInfo.push(['Bentuk', shapeNames[this.calculation.shape] || this.calculation.shape]);
    }
    
    // Productivity
    if (this.calculation.productivity) {
      const unit = this.calculatorType === 'volume' ? 'm³/hari' : 
                   this.calculatorType === 'area' ? 'm²/hari' : 'm/hari';
      projectInfo.push(['Produktivitas', `${this.calculation.productivity} ${unit}`]);
    }
    
    // Worker ratio
    if (this.calculation.workerRatio) {
      projectInfo.push(['Rasio Pekerja', this.calculation.workerRatio]);
    }
    
    // Profit and waste factor
    if (this.calculation.profitPercentage) {
      projectInfo.push(['Keuntungan', `${this.calculation.profitPercentage}%`]);
    }
    
    if (this.calculation.wasteFactor) {
      projectInfo.push(['Faktor Pemborosan', `${this.calculation.wasteFactor}%`]);
    }

    if (projectInfo.length > 0) {
      this.doc.autoTable({
        startY: yPos,
        head: [['Parameter', 'Nilai']],
        body: projectInfo,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      });
    }
  }

  addMaterialBreakdown() {
    const materialData = [];
    
    // Check if materials exist in calculation
    if (this.calculation.bahan && this.calculation.bahan.length > 0) {
      this.calculation.bahan.forEach(material => {
        materialData.push([
          material.name || 'Material',
          `${(material.quantityWithWaste || material.quantity || 0).toFixed(2)} ${material.unit || 'unit'}`,
          this.formatCurrency(material.price || 0),
          this.formatCurrency(material.materialCost || material.hppBahan || 0),
          this.formatCurrency(material.rabBahan || (material.materialCost || 0) * 1.2)
        ]);
      });
    } else if (this.calculation.materials && this.calculation.materials.length > 0) {
      this.calculation.materials.forEach(material => {
        materialData.push([
          material.name || 'Material',
          `${(material.quantity || 0).toFixed(2)} ${material.unit || 'unit'}`,
          this.formatCurrency(material.price || 0),
          this.formatCurrency(material.cost || 0),
          this.formatCurrency((material.cost || 0) * 1.2)
        ]);
      });
    }

    // Only add material breakdown section if there are materials
    if (materialData.length > 0) {
      const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : 120;
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('RINCIAN MATERIAL', 20, finalY);
      
      this.doc.autoTable({
        startY: finalY + 5,
        head: [['Material', 'Kuantitas', 'Harga Satuan', 'HPP Material', 'RAB Material']],
        body: materialData,
        theme: 'grid',
        headStyles: { fillColor: [255, 152, 0] },
        columnStyles: { 
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
    }
    // If no materials, skip this section entirely
  }

  addLaborAnalysis() {
    const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : 160;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('ANALISIS TENAGA KERJA', 20, finalY);
    
    const laborData = [];
    
    // Check different labor data structures
    if (this.calculation.tukang && this.calculation.pekerja) {
      // Structure from Volume/Area/Length calculators
      const tukangTotal = (this.calculation.tukang.count || 0) * (this.calculation.tukang.rate || 150000) * (this.calculation.tukang.days || 0);
      const pekerjaTotal = (this.calculation.pekerja.count || 0) * (this.calculation.pekerja.rate || 135000) * (this.calculation.pekerja.days || 0);
      
      if (this.calculation.tukang.count > 0) {
        laborData.push([
          'Tukang',
          `${this.calculation.tukang.count} orang`,
          this.formatCurrency(this.calculation.tukang.rate || 150000),
          `${(this.calculation.tukang.days || 0).toFixed(1)} hari`,
          this.formatCurrency(tukangTotal)
        ]);
      }
      
      if (this.calculation.pekerja.count > 0) {
        laborData.push([
          'Pekerja',
          `${this.calculation.pekerja.count} orang`,
          this.formatCurrency(this.calculation.pekerja.rate || 135000),
          `${(this.calculation.pekerja.days || 0).toFixed(1)} hari`,
          this.formatCurrency(pekerjaTotal)
        ]);
      }
      
      if (this.calculation.workerRatio) {
        laborData.push([
          'Rasio Pekerja',
          this.calculation.workerRatio,
          '-',
          '-',
          '-'
        ]);
      }
    } else if (this.calculation.workers) {
      // Alternative structure
      Object.keys(this.calculation.workers).forEach(workerType => {
        const worker = this.calculation.workers[workerType];
        if (worker && typeof worker === 'object') {
          laborData.push([
            workerType.charAt(0).toUpperCase() + workerType.slice(1),
            `${worker.count || 0} orang`,
            this.formatCurrency(worker.rate || 0),
            `${(worker.days || 0).toFixed(1)} hari`,
            this.formatCurrency(worker.total || 0)
          ]);
        }
      });
    }

    if (laborData.length > 0) {
      this.doc.autoTable({
        startY: finalY + 5,
        head: [['Jenis Pekerja', 'Jumlah', 'Upah/Hari', 'Durasi', 'Total Biaya']],
        body: laborData,
        theme: 'grid',
        headStyles: { fillColor: [156, 39, 176] },
        columnStyles: { 
          2: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
    } else {
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'italic');
      this.doc.text('Tidak ada data tenaga kerja dalam kalkulasi ini', 20, finalY + 10);
    }
  }

  addCostSummary() {
    const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : 200;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('RINGKASAN BIAYA', 20, finalY);
    
    const costData = [];
    
    // Material costs
    if (this.calculation.hppBahan || this.calculation.materialCost) {
      costData.push(['Total Biaya Material', this.formatCurrency(this.calculation.hppBahan || this.calculation.materialCost || 0)]);
    }
    
    // Labor costs
    if (this.calculation.hppTukang || this.calculation.laborCost) {
      costData.push(['Total Biaya Tenaga Kerja', this.formatCurrency(this.calculation.hppTukang || this.calculation.laborCost || 0)]);
    }
    
    // HPP
    if (this.calculation.hpp) {
      costData.push(['Total HPP (Harga Pokok Produksi)', this.formatCurrency(this.calculation.hpp)]);
    }
    
    // Profit
    if (this.calculation.keuntungan) {
      const profitText = this.calculation.profitPercentage ? 
        `Keuntungan (${this.calculation.profitPercentage}%)` : 'Keuntungan';
      costData.push([profitText, this.formatCurrency(this.calculation.keuntungan)]);
    }
    
    // RAB
    if (this.calculation.rab) {
      costData.push(['Total RAB (Rencana Anggaran Biaya)', this.formatCurrency(this.calculation.rab)]);
    }
    
    // Duration
    if (this.calculation.tukang && this.calculation.tukang.days) {
      costData.push(['Estimasi Durasi Kerja', `${this.calculation.tukang.days.toFixed(1)} hari`]);
    }

    if (costData.length > 0) {
      this.doc.autoTable({
        startY: finalY + 5,
        head: [['Komponen Biaya', 'Jumlah']],
        body: costData,
        theme: 'grid',
        headStyles: { fillColor: [244, 67, 54] },
        columnStyles: { 
          0: { fontStyle: 'bold' },
          1: { halign: 'right', fontStyle: 'bold' }
        }
      });
    }
  }

  addFooter() {
    // Footer removed as per user request
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  save(filename = 'laporan-kalkulasi.pdf') {
    this.doc.save(filename);
  }
}
