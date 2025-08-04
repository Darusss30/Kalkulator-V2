/**
 * Job-Specific Material Converter
 * Sistem konversi material yang spesifik untuk setiap jenis pekerjaan konstruksi
 * Berdasarkan data riset lokal dan standar konstruksi Indonesia
 */

// Data riset material konstruksi lokal
const CONSTRUCTION_MATERIAL_DATA = {
  // Semen berdasarkan mutu beton
  cement: {
    // Data riset: 1 sak = 40kg (bukan 50kg seperti standar lama)
    baseUnit: 'kg',
    packageUnit: 'sak',
    packageWeight: 40, // kg per sak
    
    // Kebutuhan semen per m³ berdasarkan mutu beton
    requirements: {
      'K-175': { quantity: 0.0225, unit: 'sak/m³' }, // 225 kg/m³ = 0.0225 sak/m³
      'K-200': { quantity: 0.0250, unit: 'sak/m³' }, // 250 kg/m³ = 0.0250 sak/m³  
      'K-225': { quantity: 0.0275, unit: 'sak/m³' }, // 275 kg/m³ = 0.0275 sak/m³
      'K-250': { quantity: 0.0300, unit: 'sak/m³' }, // 300 kg/m³ = 0.0300 sak/m³
      'K-275': { quantity: 0.0325, unit: 'sak/m³' }, // 325 kg/m³ = 0.0325 sak/m³
      'K-300': { quantity: 0.0350, unit: 'sak/m³' }, // 350 kg/m³ = 0.0350 sak/m³
      'K-350': { quantity: 0.0400, unit: 'sak/m³' }, // 400 kg/m³ = 0.0400 sak/m³
      
      // Untuk pekerjaan plesteran/acian
      'plesteran': { quantity: 0.0125, unit: 'sak/m²' }, // 12.5 kg/m² = 0.3125 sak/m²
      'acian': { quantity: 0.0075, unit: 'sak/m²' }      // 7.5 kg/m² = 0.1875 sak/m²
    }
  },

  // Pasir berdasarkan jenis pekerjaan
  sand: {
    baseUnit: 'm³',
    packageUnit: 'truk',
    packageVolume: 7, // m³ per truk (data riset lokal)
    
    requirements: {
      // Untuk beton
      'K-175': { quantity: 0.0514, unit: 'm³/m³' }, // 0.514 m³ per m³ beton
      'K-200': { quantity: 0.0500, unit: 'm³/m³' },
      'K-225': { quantity: 0.0486, unit: 'm³/m³' },
      'K-250': { quantity: 0.0471, unit: 'm³/m³' },
      'K-275': { quantity: 0.0457, unit: 'm³/m³' },
      'K-300': { quantity: 0.0443, unit: 'm³/m³' },
      
      // Untuk pekerjaan lain
      'plesteran': { quantity: 0.0180, unit: 'm³/m²' }, // 18 liter per m²
      'pasangan_bata': { quantity: 0.0240, unit: 'm³/m²' }, // 24 liter per m²
      'lantai_granit': { quantity: 0.0343, unit: 'm³/m²' } // Data riset: 0.0343 m³/m² untuk granit
    }
  },

  // Kerikil/Split berdasarkan mutu beton
  gravel: {
    baseUnit: 'm³',
    packageUnit: 'truk',
    packageVolume: 7, // m³ per truk
    
    requirements: {
      'K-175': { quantity: 0.0771, unit: 'm³/m³' },
      'K-200': { quantity: 0.0750, unit: 'm³/m³' },
      'K-225': { quantity: 0.0729, unit: 'm³/m³' },
      'K-250': { quantity: 0.0707, unit: 'm³/m³' },
      'K-275': { quantity: 0.0686, unit: 'm³/m³' },
      'K-300': { quantity: 0.0664, unit: 'm³/m³' }
    }
  },

  // Granit/Keramik berdasarkan ukuran
  granite: {
    baseUnit: 'm²',
    packageUnit: 'dus',
    
    // Konfigurasi standar berdasarkan ukuran
    configurations: {
      '60x60': { piecesPerBox: 4, areaPerBox: 1.44, conversionFactor: 0.6944 }, // 1 m² = 0.6944 dus
      '50x50': { piecesPerBox: 4, areaPerBox: 1.00, conversionFactor: 1.0000 }, // 1 m² = 1.0000 dus
      '40x40': { piecesPerBox: 6, areaPerBox: 0.96, conversionFactor: 1.0417 }, // 1 m² = 1.0417 dus
      '30x30': { piecesPerBox: 11, areaPerBox: 0.99, conversionFactor: 1.0101 }, // 1 m² = 1.0101 dus
      '25x25': { piecesPerBox: 16, areaPerBox: 1.00, conversionFactor: 1.0000 }  // 1 m² = 1.0000 dus
    },
    
    requirements: {
      'lantai': { quantity: 1.0, unit: 'm²/m²', wasteFactor: 0.05 }, // 5% waste
      'dinding': { quantity: 1.0, unit: 'm²/m²', wasteFactor: 0.10 }  // 10% waste
    }
  },

  // Bata Merah berdasarkan ukuran dan jenis dinding
  brick: {
    baseUnit: 'm²',
    packageUnit: 'truk',
    
    // Konfigurasi berdasarkan ukuran bata
    configurations: {
      'standard': { 
        length: 230, width: 110, height: 50, // mm
        piecesPerTruck: 6000,
        areaPerTruck: 90.72, // m² (dengan mortar 10mm)
        conversionFactor: 0.0110 // 1 m² = 0.0110 truk
      },
      'jumbo': {
        length: 250, width: 120, height: 55, // mm
        piecesPerTruck: 5000,
        areaPerTruck: 95.20, // m² (dengan mortar 10mm)
        conversionFactor: 0.0105 // 1 m² = 0.0105 truk
      }
    },
    
    requirements: {
      'dinding_1_bata': { quantity: 1.0, unit: 'm²/m²', thickness: 230 },
      'dinding_setengah_bata': { quantity: 1.0, unit: 'm²/m²', thickness: 110 }
    }
  }
};

// Job category specific material requirements
const JOB_CATEGORY_MATERIALS = {
  'struktur_beton': {
    name: 'Struktur Beton',
    materials: ['cement', 'sand', 'gravel'],
    defaultGrade: 'K-250'
  },
  'pekerjaan_lantai': {
    name: 'Pekerjaan Lantai',
    materials: ['granite', 'sand', 'cement'],
    defaultGraniteSize: '60x60'
  },
  'pekerjaan_dinding': {
    name: 'Pekerjaan Dinding',
    materials: ['brick', 'sand', 'cement'],
    defaultBrickType: 'standard'
  },
  'finishing': {
    name: 'Finishing',
    materials: ['cement', 'sand'],
    defaultWorkType: 'plesteran'
  }
};

/**
 * Generate material conversion suggestions based on job type
 */
export const generateJobSpecificConversion = (jobTypeName, materialName, materialUnit) => {
  const jobName = jobTypeName.toLowerCase();
  const matName = materialName.toLowerCase();
  
  // Detect job category
  let jobCategory = null;
  let workGrade = null;
  
  // Detect concrete grade from job name
  const gradeMatch = jobName.match(/k[-\s]?(\d+)/i);
  if (gradeMatch) {
    workGrade = `K-${gradeMatch[1]}`;
  }
  
  // Detect job category
  if (jobName.includes('beton') || jobName.includes('struktur') || jobName.includes('balok') || jobName.includes('kolom') || jobName.includes('footplate')) {
    jobCategory = 'struktur_beton';
    workGrade = workGrade || 'K-250'; // Default grade
  } else if (jobName.includes('lantai') || jobName.includes('granit') || jobName.includes('keramik')) {
    jobCategory = 'pekerjaan_lantai';
  } else if (jobName.includes('dinding') || jobName.includes('bata') || jobName.includes('tembok')) {
    jobCategory = 'pekerjaan_dinding';
  } else if (jobName.includes('plester') || jobName.includes('acian') || jobName.includes('finishing')) {
    jobCategory = 'finishing';
    workGrade = workGrade || 'plesteran';
  }
  
  // Generate conversion based on material type
  let conversion = null;
  
  // Semen conversion
  if (matName.includes('semen') || matName.includes('cement') || matName.includes('adamix')) {
    if (materialUnit.toLowerCase().includes('sak')) {
      const cementData = CONSTRUCTION_MATERIAL_DATA.cement;
      const requirement = cementData.requirements[workGrade] || cementData.requirements['K-250'];
      
      conversion = {
        conversion_factor: cementData.packageWeight, // 40 kg per sak
        base_unit: 'kg',
        conversion_description: `1 sak = ${cementData.packageWeight} kg, kebutuhan ${workGrade}: ${requirement.quantity} ${requirement.unit}`,
        material_type: 'powder',
        job_specific_data: {
          category: jobCategory,
          grade: workGrade,
          requirement: requirement
        }
      };
    }
  }
  
  // Pasir conversion
  else if (matName.includes('pasir') || matName.includes('sand')) {
    if (materialUnit.toLowerCase().includes('truk')) {
      const sandData = CONSTRUCTION_MATERIAL_DATA.sand;
      const requirement = sandData.requirements[workGrade] || sandData.requirements['K-250'];
      
      conversion = {
        conversion_factor: sandData.packageVolume, // 7 m³ per truk
        base_unit: 'm3',
        conversion_description: `1 truk = ${sandData.packageVolume} m³, kebutuhan ${workGrade}: ${requirement.quantity} ${requirement.unit}`,
        material_type: 'aggregate',
        job_specific_data: {
          category: jobCategory,
          grade: workGrade,
          requirement: requirement
        }
      };
    }
  }
  
  // Kerikil/Split conversion
  else if (matName.includes('kerikil') || matName.includes('split') || matName.includes('koral')) {
    if (materialUnit.toLowerCase().includes('truk')) {
      const gravelData = CONSTRUCTION_MATERIAL_DATA.gravel;
      const requirement = gravelData.requirements[workGrade] || gravelData.requirements['K-250'];
      
      conversion = {
        conversion_factor: gravelData.packageVolume, // 7 m³ per truk
        base_unit: 'm3',
        conversion_description: `1 truk = ${gravelData.packageVolume} m³, kebutuhan ${workGrade}: ${requirement.quantity} ${requirement.unit}`,
        material_type: 'aggregate',
        job_specific_data: {
          category: jobCategory,
          grade: workGrade,
          requirement: requirement
        }
      };
    }
  }
  
  // Granit/Keramik conversion
  else if (matName.includes('granit') || matName.includes('keramik') || matName.includes('tile')) {
    if (materialUnit.toLowerCase().includes('dus') || materialUnit.toLowerCase().includes('box')) {
      const graniteData = CONSTRUCTION_MATERIAL_DATA.granite;
      const config = graniteData.configurations['60x60']; // Default size
      
      conversion = {
        conversion_factor: config.conversionFactor,
        base_unit: 'm2',
        conversion_description: `1 m² = ${config.conversionFactor.toFixed(4)} dus (${config.piecesPerBox} keping @ 60x60cm = ${config.areaPerBox} m²)`,
        material_type: 'tile',
        pieces_per_unit: config.piecesPerBox.toString(),
        piece_dimensions: '60x60cm',
        coverage_per_unit: config.areaPerBox.toString(),
        job_specific_data: {
          category: jobCategory,
          size: '60x60',
          requirement: graniteData.requirements['lantai']
        }
      };
    }
  }
  
  // Bata conversion
  else if (matName.includes('bata') || matName.includes('brick')) {
    if (materialUnit.toLowerCase().includes('truk')) {
      const brickData = CONSTRUCTION_MATERIAL_DATA.brick;
      const config = brickData.configurations['standard'];
      
      conversion = {
        conversion_factor: config.conversionFactor,
        base_unit: 'm2',
        conversion_description: `1 m² = ${config.conversionFactor.toFixed(4)} truk (${config.piecesPerTruck} bata @ ${config.length}×${config.width}×${config.height}mm = ${config.areaPerTruck} m²)`,
        material_type: 'brick',
        pieces_per_unit: config.piecesPerTruck.toString(),
        brick_length: config.length.toString(),
        brick_width: config.width.toString(),
        brick_height: config.height.toString(),
        mortar_thickness: '10',
        coverage_per_unit: config.areaPerTruck.toString(),
        job_specific_data: {
          category: jobCategory,
          brickType: 'standard',
          requirement: brickData.requirements['dinding_1_bata']
        }
      };
    }
  }
  
  return conversion;
};

/**
 * Get material requirements for specific job type
 */
export const getJobTypeMaterialRequirements = (jobTypeName, jobTypeUnit) => {
  const jobName = jobTypeName.toLowerCase();
  const requirements = [];
  
  // Detect concrete grade
  const gradeMatch = jobName.match(/k[-\s]?(\d+)/i);
  const concreteGrade = gradeMatch ? `K-${gradeMatch[1]}` : 'K-250';
  
  // Struktur beton requirements
  if (jobName.includes('beton') || jobName.includes('struktur') || jobName.includes('balok') || jobName.includes('kolom') || jobName.includes('footplate')) {
    const cementReq = CONSTRUCTION_MATERIAL_DATA.cement.requirements[concreteGrade];
    const sandReq = CONSTRUCTION_MATERIAL_DATA.sand.requirements[concreteGrade];
    const gravelReq = CONSTRUCTION_MATERIAL_DATA.gravel.requirements[concreteGrade];
    
    if (cementReq) {
      requirements.push({
        material_type: 'Semen Portland',
        unit: 'sak',
        quantity_per_unit: cementReq.quantity,
        description: `Kebutuhan semen untuk beton ${concreteGrade}`,
        conversion_info: `1 sak = 40 kg, ${cementReq.quantity} sak per ${jobTypeUnit}`
      });
    }
    
    if (sandReq) {
      requirements.push({
        material_type: 'Pasir Halus',
        unit: 'truk',
        quantity_per_unit: (sandReq.quantity / 7).toFixed(4), // Convert m³ to truk
        description: `Kebutuhan pasir untuk beton ${concreteGrade}`,
        conversion_info: `1 truk = 7 m³, ${sandReq.quantity} m³ per ${jobTypeUnit}`
      });
    }
    
    if (gravelReq) {
      requirements.push({
        material_type: 'Kerikil/Split',
        unit: 'truk',
        quantity_per_unit: (gravelReq.quantity / 7).toFixed(4), // Convert m³ to truk
        description: `Kebutuhan kerikil untuk beton ${concreteGrade}`,
        conversion_info: `1 truk = 7 m³, ${gravelReq.quantity} m³ per ${jobTypeUnit}`
      });
    }
  }
  
  // Lantai granit requirements
  else if (jobName.includes('lantai') && jobName.includes('granit')) {
    const sandReq = CONSTRUCTION_MATERIAL_DATA.sand.requirements['lantai_granit'];
    
    requirements.push({
      material_type: 'Granit 60x60cm',
      unit: 'dus',
      quantity_per_unit: '0.6944',
      description: 'Kebutuhan granit untuk lantai',
      conversion_info: '1 dus = 4 keping @ 60x60cm = 1.44 m², 1 m² = 0.6944 dus'
    });
    
    if (sandReq) {
      requirements.push({
        material_type: 'Pasir Japanan',
        unit: 'truk',
        quantity_per_unit: (sandReq.quantity / 7).toFixed(4),
        description: 'Kebutuhan pasir untuk pemasangan granit',
        conversion_info: `1 truk = 7 m³, ${sandReq.quantity} m³ per m²`
      });
    }
  }
  
  return requirements;
};

/**
 * Calculate material cost with job-specific conversion
 */
export const calculateJobSpecificMaterialCost = (material, quantity, jobType) => {
  const conversion = generateJobSpecificConversion(jobType.name, material.name, material.unit);
  
  if (!conversion) {
    // Fallback to standard calculation
    return {
      quantity: quantity,
      unit: material.unit,
      unitPrice: material.price,
      totalCost: quantity * material.price,
      conversion: null
    };
  }
  
  // Calculate with conversion
  const baseQuantity = quantity * (conversion.conversion_factor || 1);
  const baseUnitPrice = material.price / (conversion.conversion_factor || 1);
  
  return {
    quantity: quantity,
    unit: material.unit,
    baseQuantity: baseQuantity,
    baseUnit: conversion.base_unit,
    unitPrice: material.price,
    baseUnitPrice: baseUnitPrice,
    totalCost: quantity * material.price,
    conversion: conversion,
    jobSpecificData: conversion.job_specific_data
  };
};

export default {
  generateJobSpecificConversion,
  getJobTypeMaterialRequirements,
  calculateJobSpecificMaterialCost,
  CONSTRUCTION_MATERIAL_DATA,
  JOB_CATEGORY_MATERIALS
};
