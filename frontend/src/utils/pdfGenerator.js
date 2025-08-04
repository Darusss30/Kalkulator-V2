import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Utility functions for formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate PDF for single calculation
export const generateSingleCalculationPDF = (calculation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KALKULASI KONSTRUKSI', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Project Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI PROYEK', margin, yPosition);
  yPosition += 10;

  const projectInfo = [
    ['Nama Proyek', calculation.project_name || calculation.calculation_data?.input?.project_name || 'Tidak ada'],
    ['Jenis Pekerjaan', calculation.job_type_name || calculation.job_type?.name || 'Tidak diketahui'],
    ['Kategori', calculation.category_name || calculation.job_type?.category_name || 'Tidak diketahui'],
    ['Volume', `${formatNumber(calculation.volume || calculation.calculation_data?.input?.volume || 0, 2)} ${calculation.job_type_unit || calculation.job_type?.unit || ''}`],
    ['Produktivitas', `${formatNumber(calculation.productivity || calculation.calculation_data?.input?.productivity || 0, 2)} ${calculation.job_type_unit || calculation.job_type?.unit || ''}/hari`],
    ['Estimasi Hari Kerja', `${Math.round(calculation.calculation_data?.input?.estimated_days || 0)} hari`],
    ['Persentase Keuntungan', `${calculation.profit_percentage || calculation.calculation_data?.input?.profit_percentage || 0}%`]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Item', 'Keterangan']],
    body: projectInfo,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Labor Cost Details
  if (calculation.calculation_data?.labor) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL BIAYA TENAGA KERJA', margin, yPosition);
    yPosition += 10;

    const laborData = [];
    const labor = calculation.calculation_data.labor;

    if (labor.num_tukang > 0) {
      laborData.push([
        'Tukang',
        `${labor.num_tukang} orang`,
        formatCurrency(labor.tukang_daily_rate || 0),
        `${Math.round(calculation.calculation_data?.input?.estimated_days || 0)} hari`,
        formatCurrency((labor.num_tukang || 0) * (labor.tukang_daily_rate || 0) * (calculation.calculation_data?.input?.estimated_days || 0))
      ]);
    }

    if (labor.num_pekerja > 0) {
      laborData.push([
        'Pekerja',
        `${labor.num_pekerja} orang`,
        formatCurrency(labor.pekerja_daily_rate || 0),
        `${Math.round(calculation.calculation_data?.input?.estimated_days || 0)} hari`,
        formatCurrency((labor.num_pekerja || 0) * (labor.pekerja_daily_rate || 0) * (calculation.calculation_data?.input?.estimated_days || 0))
      ]);
    }

    // Total labor cost
    const totalLaborCost = calculation.is_local 
      ? (calculation.summary?.total_labor_cost || 0)
      : (calculation.labor_cost || 0);

    laborData.push([
      { content: 'TOTAL BIAYA TENAGA KERJA', styles: { fontStyle: 'bold' } },
      '',
      '',
      '',
      { content: formatCurrency(totalLaborCost), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Jenis', 'Jumlah', 'Upah/Hari', 'Durasi', 'Total']],
      body: laborData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Material Cost Details
  if (calculation.calculation_data?.materials?.details?.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL BIAYA MATERIAL', margin, yPosition);
    yPosition += 10;

    const materialData = calculation.calculation_data.materials.details.map(material => [
      material.material_name,
      `${formatNumber(material.quantity_per_unit, 2)} ${material.material_unit}`,
      formatCurrency(material.material_price),
      `${formatNumber(material.total_quantity, 0)} ${material.material_unit}`,
      formatCurrency(material.material_cost)
    ]);

    // Total material cost
    const totalMaterialCost = calculation.is_local 
      ? (calculation.summary?.total_material_cost || 0)
      : (calculation.material_cost || 0);

    materialData.push([
      { content: 'TOTAL BIAYA MATERIAL', styles: { fontStyle: 'bold' } },
      '',
      '',
      '',
      { content: formatCurrency(totalMaterialCost), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Material', 'Kebutuhan/Unit', 'Harga Satuan', 'Total Kebutuhan', 'Total Biaya']],
      body: materialData,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Summary Section
  if (yPosition > 220) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN BIAYA', margin, yPosition);
  yPosition += 10;

  // Calculate values
  const laborCost = calculation.is_local 
    ? (calculation.summary?.total_labor_cost || 0)
    : (calculation.labor_cost || 0);
  
  const materialCost = calculation.is_local 
    ? (calculation.summary?.total_material_cost || 0)
    : (calculation.material_cost || 0);
  
  const totalHPP = calculation.is_local 
    ? (calculation.summary?.total_cost || 0)
    : (laborCost + materialCost);
  
  const profitPercentage = calculation.profit_percentage || calculation.calculation_data?.input?.profit_percentage || 0;
  const totalRAB = calculation.is_local 
    ? (calculation.summary?.rab_total || 0)
    : (calculation.total_rab || 0);
  
  const profitAmount = totalRAB - totalHPP;
  const volume = calculation.volume || calculation.calculation_data?.input?.volume || 1;

  const summaryData = [
    ['HPP Tenaga Kerja', formatCurrency(laborCost)],
    ['HPP Material', formatCurrency(materialCost)],
    [{ content: 'TOTAL HPP', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalHPP), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
    ['', ''],
    ['HPP per Unit', formatCurrency(totalHPP / volume)],
    ['Margin Keuntungan', `${profitPercentage}%`],
    ['Nilai Keuntungan', formatCurrency(profitAmount)],
    [{ content: 'TOTAL RAB', styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } }, { content: formatCurrency(totalRAB), styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } }],
    ['RAB per Unit', formatCurrency(totalRAB / volume)]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Komponen', 'Nilai']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [231, 76, 60], textColor: 255 },
    styles: { fontSize: 11 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
    doc.text('Dibuat oleh Kalkulator Konstruksi', margin, doc.internal.pageSize.height - 10);
  }

  return doc;
};

// Generate PDF for bulk calculations
export const generateBulkCalculationsPDF = (calculations, projectName = 'Multiple Projects') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KALKULASI BULK', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proyek: ${projectName}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.text(`Tanggal: ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Total Kalkulasi: ${calculations.length}`, pageWidth / 2, yPosition + 8, { align: 'center' });
  yPosition += 25;

  // Summary table
  const summaryData = calculations.map((calc, index) => {
    const laborCost = calc.is_local 
      ? (calc.summary?.total_labor_cost || 0)
      : (calc.labor_cost || 0);
    
    const materialCost = calc.is_local 
      ? (calc.summary?.total_material_cost || 0)
      : (calc.material_cost || 0);
    
    const totalHPP = calc.is_local 
      ? (calc.summary?.total_cost || 0)
      : (laborCost + materialCost);
    
    const totalRAB = calc.is_local 
      ? (calc.summary?.rab_total || 0)
      : (calc.total_rab || 0);

    return [
      index + 1,
      calc.job_type_name || calc.job_type?.name || 'Tidak diketahui',
      `${formatNumber(calc.volume || calc.calculation_data?.input?.volume || 0, 1)} ${calc.job_type_unit || calc.job_type?.unit || ''}`,
      formatCurrency(laborCost),
      formatCurrency(materialCost),
      formatCurrency(totalHPP),
      formatCurrency(totalRAB)
    ];
  });

  // Calculate totals
  const totalLaborCost = calculations.reduce((sum, calc) => {
    const laborCost = calc.is_local 
      ? (calc.summary?.total_labor_cost || 0)
      : (calc.labor_cost || 0);
    return sum + laborCost;
  }, 0);

  const totalMaterialCost = calculations.reduce((sum, calc) => {
    const materialCost = calc.is_local 
      ? (calc.summary?.total_material_cost || 0)
      : (calc.material_cost || 0);
    return sum + materialCost;
  }, 0);

  const totalHPP = calculations.reduce((sum, calc) => {
    const hpp = calc.is_local 
      ? (calc.summary?.total_cost || 0)
      : ((calc.labor_cost || 0) + (calc.material_cost || 0));
    return sum + hpp;
  }, 0);

  const totalRAB = calculations.reduce((sum, calc) => {
    const rab = calc.is_local 
      ? (calc.summary?.rab_total || 0)
      : (calc.total_rab || 0);
    return sum + rab;
  }, 0);

  // Add totals row
  summaryData.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } },
    { content: '', styles: { fillColor: [52, 152, 219] } },
    { content: '', styles: { fillColor: [52, 152, 219] } },
    { content: formatCurrency(totalLaborCost), styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } },
    { content: formatCurrency(totalMaterialCost), styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } },
    { content: formatCurrency(totalHPP), styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } },
    { content: formatCurrency(totalRAB), styles: { fontStyle: 'bold', fillColor: [52, 152, 219], textColor: 255 } }
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['No', 'Pekerjaan', 'Volume', 'HPP Jasa', 'HPP Bahan', 'Total HPP', 'Total RAB']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 20;

  // Summary statistics
  if (yPosition > 220) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN STATISTIK', margin, yPosition);
  yPosition += 10;

  const profitAmount = totalRAB - totalHPP;
  const avgProfitPercentage = calculations.length > 0 
    ? calculations.reduce((sum, calc) => sum + (calc.profit_percentage || calc.calculation_data?.input?.profit_percentage || 0), 0) / calculations.length
    : 0;

  const statsData = [
    ['Total Kalkulasi', `${calculations.length} item`],
    ['Total HPP Tenaga Kerja', formatCurrency(totalLaborCost)],
    ['Total HPP Material', formatCurrency(totalMaterialCost)],
    ['Total HPP Keseluruhan', formatCurrency(totalHPP)],
    ['Total RAB Keseluruhan', formatCurrency(totalRAB)],
    ['Total Keuntungan', formatCurrency(profitAmount)],
    ['Rata-rata Margin Keuntungan', `${avgProfitPercentage.toFixed(1)}%`]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Komponen', 'Nilai']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [231, 76, 60], textColor: 255 },
    styles: { fontSize: 11 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
    doc.text('Dibuat oleh Kalkulator Konstruksi', margin, doc.internal.pageSize.height - 10);
  }

  return doc;
};

// Export functions
export const downloadSingleCalculationPDF = (calculation) => {
  const doc = generateSingleCalculationPDF(calculation);
  const filename = `kalkulasi-${(calculation.job_type_name || calculation.job_type?.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const downloadBulkCalculationsPDF = (calculations, projectName = 'Multiple Projects') => {
  const doc = generateBulkCalculationsPDF(calculations, projectName);
  const filename = `bulk-kalkulasi-${projectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
