import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class GenericReportGenerator {
  constructor(calculation, calculatorType = 'generic', jobType = null) {
    this.calculation = calculation;
    this.calculatorType = calculatorType;
    this.jobType = jobType;
    this.doc = new jsPDF();
    
    // Define consistent margins
    this.margins = {
      left: 10,
      right: 10,
      top: 20,
      bottom: 20
    };
    
    // Calculate usable width
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.usableWidth = this.pageWidth - this.margins.left - this.margins.right;
  }

  // Default prices for placeholder materials (in IDR)
  getDefaultPrice(materialName, unit) {
    const name = materialName.toLowerCase();
    
    if (name.includes('adamix')) {
      return unit === 'sak' ? 95000 : 95000; // Rp 95,000 per sak
    }
    
    if (name.includes('giant')) {
      return unit === 'sak' ? 80000 : 80000; // Rp 80,000 per sak
    }
    
    if (name.includes('lem rajawali')) {
      return unit === 'BOX' ? 1010000 : 16833; // Rp 1,010,000 per BOX (60 pcs) or Rp 16,833 per pcs
    }
    
    // Default fallback price
    return 50000;
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
    this.doc.text('LAPORAN KALKULASI KONSTRUKSI', this.pageWidth / 2, this.margins.top + 15, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, this.margins.left, this.margins.top + 30);
    this.doc.text(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, this.margins.left, this.margins.top + 37);
    
    let yPos = this.margins.top + 55;
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('HASIL KALKULASI', this.margins.left, yPos);
    
    yPos += 15;
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    
    // Add basic calculation info
    if (this.calculation.hpp) {
      this.doc.text(`HPP: ${this.formatCurrency(this.calculation.hpp)}`, this.margins.left, yPos);
      yPos += 8;
    }
    if (this.calculation.rab) {
      this.doc.text(`RAB: ${this.formatCurrency(this.calculation.rab)}`, this.margins.left, yPos);
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
        footplate: 'LAPORAN KALKULASI STRUKTUR',
        plaster: 'LAPORAN KALKULASI PLAMIRAN',
        generic: 'LAPORAN KALKULASI KONSTRUKSI'
      };
      title = titles[this.calculatorType] || titles.generic;
    }
    
    this.doc.setFontSize(18);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.pageWidth / 2, this.margins.top + 15, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, this.margins.left, this.margins.top + 30);
    this.doc.text(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, this.margins.left, this.margins.top + 37);
  }

  addProjectInfo() {
    let yPos = this.margins.top + 50;
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('INFORMASI PROYEK', this.margins.left, yPos);
    
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
    
    // Area for plaster calculator
    if (this.calculation.area && this.calculatorType === 'plaster') {
      projectInfo.push(['Luas Pekerjaan', `${this.calculation.area} m²`]);
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
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: this.margins.left, right: this.margins.right },
        tableWidth: this.usableWidth
      });
    }
  }

  addMaterialBreakdown() {
    const materialData = [];
    
    // Check for plaster calculator structure with subPekerjaan
    if (this.calculation.subPekerjaan && this.calculation.subPekerjaan.length > 0) {
      this.calculation.subPekerjaan.forEach(sub => {
        if (sub.materials && sub.materials.length > 0) {
          // Add sub-pekerjaan header
          materialData.push([
            `${sub.name.toUpperCase()}`,
            '',
            '',
            '',
            ''
          ]);
          
          sub.materials.forEach(material => {
            let quantityDisplay = `${(material.quantity || 0).toFixed(2)} ${material.unit || 'unit'}`;
            
            // Add pcs conversion for lem rajawali
            if (material.name.toLowerCase().includes('lem rajawali') && material.unit === 'BOX') {
              const pcsQuantity = (material.quantity * 60).toFixed(0);
              quantityDisplay += ` (${pcsQuantity} pcs)`;
            }
            
            // For PlasterCalculator, material.price should already be valid
            // But ensure we always have a valid price for PDF display
            let validPrice = material.price;
            
            if (!validPrice || validPrice <= 0) {
              validPrice = this.getDefaultPrice(material.name, material.unit);
            }
            
            // Convert to number to ensure formatCurrency works properly
            validPrice = parseFloat(validPrice) || 0;
            
            const formattedPrice = this.formatCurrency(validPrice);
            
            materialData.push([
              `  • ${material.name}`,
              quantityDisplay,
              formattedPrice,
              this.formatCurrency(material.cost || 0),
              this.formatCurrency((material.cost || 0) * (1 + (this.calculation.profitPercentage || 20) / 100))
            ]);
          });
        }
      });
    }
    // Check if materials exist in calculation (other calculators)
    else if (this.calculation.bahan && this.calculation.bahan.length > 0) {
      this.calculation.bahan.forEach(material => {
        let validPrice = (material.price && material.price > 0) ? 
          material.price : 
          this.getDefaultPrice(material.name || 'Material', material.unit || 'unit');
        
        // Convert to number to ensure formatCurrency works properly
        validPrice = parseFloat(validPrice) || 0;
        
        materialData.push([
          material.name || 'Material',
          `${(material.quantityWithWaste || material.quantity || 0).toFixed(2)} ${material.unit || 'unit'}`,
          this.formatCurrency(validPrice),
          this.formatCurrency(material.materialCost || material.hppBahan || 0),
          this.formatCurrency(material.rabBahan || (material.materialCost || 0) * 1.2)
        ]);
      });
    } else if (this.calculation.materials && this.calculation.materials.length > 0) {
      this.calculation.materials.forEach(material => {
        let validPrice = (material.price && material.price > 0) ? 
          material.price : 
          this.getDefaultPrice(material.name || 'Material', material.unit || 'unit');
        
        // Convert to number to ensure formatCurrency works properly
        validPrice = parseFloat(validPrice) || 0;
        
        materialData.push([
          material.name || 'Material',
          `${(material.quantity || 0).toFixed(2)} ${material.unit || 'unit'}`,
          this.formatCurrency(validPrice),
          this.formatCurrency(material.cost || 0),
          this.formatCurrency((material.cost || 0) * 1.2)
        ]);
      });
    }

    // Only add material breakdown section if there are materials
    if (materialData.length > 0) {
      const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : this.margins.top + 120;
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('RINCIAN MATERIAL', this.margins.left, finalY);
      
      // Use yellow header for plaster calculator, blue for others
      const headerColor = this.calculatorType === 'plaster' ? [255, 235, 59] : [41, 128, 185];
      
      this.doc.autoTable({
        startY: finalY + 5,
        head: [['Material', 'Kuantitas', 'Harga Satuan', 'HPP Material', 'RAB Material']],
        body: materialData,
        theme: 'grid',
        headStyles: { 
          fillColor: headerColor,
          textColor: this.calculatorType === 'plaster' ? [0, 0, 0] : [255, 255, 255] // Black text for yellow, white for blue
        },
        columnStyles: { 
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        margin: { left: this.margins.left, right: this.margins.right },
        tableWidth: this.usableWidth,
        didParseCell: function (data) {
          // Style sub-pekerjaan headers with yellow background for plaster calculator
          if (data.row.index < materialData.length && 
              materialData[data.row.index][0].includes('LAPIS') && 
              !materialData[data.row.index][0].includes('•')) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 235, 59]; // Yellow background
            data.cell.styles.textColor = [0, 0, 0]; // Black text for better contrast
          }
        }
      });
    }
    // If no materials, skip this section entirely
  }

  addLaborAnalysis() {
    const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : this.margins.top + 160;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('ANALISIS TENAGA KERJA', this.margins.left, finalY);
    
    const laborData = [];
    
    // Check for plaster calculator structure with totals
    if (this.calculation.totals && this.calculation.tukang && this.calculation.pekerja) {
      // PlasterCalculator structure
      const tukangTotal = (this.calculation.tukang.count || 0) * (this.calculation.tukang.rate || 150000) * (this.calculation.totals.days || 0);
      const pekerjaTotal = (this.calculation.pekerja.count || 0) * (this.calculation.pekerja.rate || 135000) * (this.calculation.totals.days || 0);
      
      if (this.calculation.tukang.count > 0) {
        laborData.push([
          'Tukang',
          `${this.calculation.tukang.count} orang`,
          this.formatCurrency(this.calculation.tukang.rate || 150000),
          `${Math.round(this.calculation.totals.days || 0)} hari`,
          this.formatCurrency(tukangTotal)
        ]);
      }
      
      if (this.calculation.pekerja.count > 0) {
        laborData.push([
          'Pekerja',
          `${this.calculation.pekerja.count} orang`,
          this.formatCurrency(this.calculation.pekerja.rate || 135000),
          `${Math.round(this.calculation.totals.days || 0)} hari`,
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
      
      // Add total labor cost
      laborData.push([
        'TOTAL TENAGA KERJA',
        `${(this.calculation.tukang.count || 0) + (this.calculation.pekerja.count || 0)} orang`,
        '-',
        `${Math.round(this.calculation.totals.days || 0)} hari`,
        this.formatCurrency(this.calculation.totals.laborCost || 0)
      ]);
    }
    // Check different labor data structures
    else if (this.calculation.tukang && this.calculation.pekerja) {
      // Structure from Volume/Area/Length calculators
      const tukangTotal = (this.calculation.tukang.count || 0) * (this.calculation.tukang.rate || 150000) * (this.calculation.tukang.days || 0);
      const pekerjaTotal = (this.calculation.pekerja.count || 0) * (this.calculation.pekerja.rate || 135000) * (this.calculation.pekerja.days || 0);
      
      if (this.calculation.tukang.count > 0) {
        laborData.push([
          'Tukang',
          `${this.calculation.tukang.count} orang`,
          this.formatCurrency(this.calculation.tukang.rate || 150000),
          `${Math.round(this.calculation.tukang.days || 0)} hari`,
          this.formatCurrency(tukangTotal)
        ]);
      }
      
      if (this.calculation.pekerja.count > 0) {
        laborData.push([
          'Pekerja',
          `${this.calculation.pekerja.count} orang`,
          this.formatCurrency(this.calculation.pekerja.rate || 135000),
          `${Math.round(this.calculation.pekerja.days || 0)} hari`,
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
            `${Math.round(worker.days || 0)} hari`,
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
        },
        margin: { left: this.margins.left, right: this.margins.right },
        tableWidth: this.usableWidth,
        didParseCell: function (data) {
          // Style total row
          if (data.row.index < laborData.length && 
              laborData[data.row.index][0].includes('TOTAL')) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
    } else {
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'italic');
      this.doc.text('Tidak ada data tenaga kerja dalam kalkulasi ini', this.margins.left, finalY + 10);
    }
  }

  addCostSummary() {
    const finalY = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY + 15 : this.margins.top + 200;
    
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('RINGKASAN BIAYA', this.margins.left, finalY);
    
    const costData = [];
    
    // Check for plaster calculator structure with totals
    if (this.calculation.totals) {
      // Material costs
      if (this.calculation.totals.materialCost) {
        costData.push(['Total Biaya Material', this.formatCurrency(this.calculation.totals.materialCost)]);
      }
      
      // Labor costs
      if (this.calculation.totals.laborCost) {
        costData.push(['Total Biaya Tenaga Kerja', this.formatCurrency(this.calculation.totals.laborCost)]);
      }
      
      // HPP
      if (this.calculation.totals.hpp) {
        costData.push(['Total HPP (Harga Pokok Produksi)', this.formatCurrency(this.calculation.totals.hpp)]);
      }
      
      // Profit
      if (this.calculation.totals.keuntungan) {
        const profitText = this.calculation.profitPercentage ? 
          `Keuntungan (${this.calculation.profitPercentage}%)` : 'Keuntungan';
        costData.push([profitText, this.formatCurrency(this.calculation.totals.keuntungan)]);
      }
      
      // RAB
      if (this.calculation.totals.rab) {
        costData.push(['Total RAB (Rencana Anggaran Biaya)', this.formatCurrency(this.calculation.totals.rab)]);
      }
      
      // Duration
      if (this.calculation.totals.days) {
        costData.push(['Estimasi Durasi Kerja', `${Math.round(this.calculation.totals.days)} hari`]);
      }
      
      // Area for plaster calculator
      if (this.calculation.area) {
        costData.push(['Luas Pekerjaan', `${this.calculation.area} m²`]);
      }
      
      // Waste factor and profit percentage
      if (this.calculation.wasteFactor) {
        costData.push(['Faktor Pemborosan', `${this.calculation.wasteFactor}%`]);
      }
    }
    // Other calculator structures
    else {
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
        costData.push(['Estimasi Durasi Kerja', `${Math.round(this.calculation.tukang.days)} hari`]);
      }
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
        },
        margin: { left: this.margins.left, right: this.margins.right },
        tableWidth: this.usableWidth
      });
    }
  }

  addFooter() {
    // Footer removed as per user request
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') {
      return 'Rp 0';
    }
    
    if (amount === 0 || isNaN(amount)) {
      return 'Rp 0';
    }
    
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      console.error(`formatCurrency error:`, error);
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
  }

  save(filename = 'laporan-kalkulasi.pdf') {
    this.doc.save(filename);
  }
}
