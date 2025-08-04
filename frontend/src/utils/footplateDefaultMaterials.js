// Default materials for footplate calculator based on concrete quality and other parameters
export const getFootplateDefaultMaterials = (concreteQuality, reinforcementX, reinforcementY) => {
  // Base materials for different concrete qualities (per m³ of concrete) - 4 significant figures
  const concreteBaseMaterials = {
    'K125': {
      semen: { quantity: 5.500, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.06140, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2067, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K175': {
      semen: { quantity: 6.000, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.06430, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2167, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K200': {
      semen: { quantity: 6.500, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.06710, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2233, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K225': {
      semen: { quantity: 7.000, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.06860, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2267, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K250': {
      semen: { quantity: 7.500, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.07140, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2333, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K300': {
      semen: { quantity: 8.500, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.07430, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2400, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K350': {
      semen: { quantity: 9.000, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.07710, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2467, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    },
    'K400': {
      semen: { quantity: 10.00, unit: 'SAK', name: 'SEMEN WEATHERSHIELD / MERAH PUTIH', price: 52000 },
      pasir: { quantity: 0.08000, unit: 'TRUK', name: 'PASIR PASIRIAN', price: 2650000 },
      kerikil: { quantity: 0.2533, unit: 'DUM', name: 'KERIKIL', price: 1200000 }
    }
  };

  // Bekisting materials (per m² of formwork area) - 4 significant figures
  // Based on field data: sloof 380cm needs 4 batang KAYU AKASIA 4X6 + 1 batang KAYU AKASIA 3X5
  // For footplate bekisting, estimated needs per m²:
  const bekistingMaterials = {
    triplek: { quantity: 1.200, unit: 'LEMBAR', name: 'TRIPLEK', price: 85000 },
    kayu_akasia_3x5: { quantity: 0.2000, unit: 'BENDEL', name: 'KAYU AKASIA 3X5', price: 170000 },
    kayu_akasia_4x6: { quantity: 0.3000, unit: 'BENDEL', name: 'KAYU AKASIA 4X6', price: 180000 }
  };

  // Reinforcement materials based on bar type (per LONJOR)
  // Base price: D12 = Rp 110,000/LONJOR, others calculated proportionally by weight
  const reinforcementPrices = {
    'D8': 49000,   // 4.74 kg/lonjor
    'D10': 76000,  // 7.40 kg/lonjor  
    'D12': 110000, // 10.66 kg/lonjor
    'D16': 195000, // 18.94 kg/lonjor
    'D19': 230000, // 22.26 kg/lonjor
    'D22': 308000, // 29.84 kg/lonjor
    'D25': 398000  // 38.53 kg/lonjor
  };

  // Weight per meter for each reinforcement diameter (kg/m) - 4 significant figures
  const reinforcementWeights = {
    'D8': 0.3950,
    'D10': 0.6170,
    'D12': 0.8880,
    'D16': 1.578,
    'D19': 2.226,
    'D22': 2.984,
    'D25': 3.853
  };

  // Calculate weight per lonjor (12 meters) for each diameter
  const getWeightPerLonjor = (diameter) => {
    return (reinforcementWeights[diameter] || 0.888) * 12; // 12 meters per lonjor
  };

  const besiMaterials = {
    tulangan_utama_x: { 
      quantity: parseFloat((1 / getWeightPerLonjor(reinforcementX)).toFixed(4)), // LONJOR per kg - 4 significant figures
      unit: 'LONJOR', 
      name: `BESI TULANGAN ${reinforcementX}`, 
      price: reinforcementPrices[reinforcementX] || 110000 
    },
    tulangan_utama_y: { 
      quantity: parseFloat((1 / getWeightPerLonjor(reinforcementY)).toFixed(4)), // LONJOR per kg - 4 significant figures
      unit: 'LONJOR', 
      name: `BESI TULANGAN ${reinforcementY}`, 
      price: reinforcementPrices[reinforcementY] || 110000 
    },
    kawat_bendrat: { quantity: 0.1000, unit: 'BENDEL', name: 'KAWAT BENDRAT', price: 25000 }
  };

  // Get materials for selected concrete quality
  const selectedConcreteMaterials = concreteBaseMaterials[concreteQuality] || concreteBaseMaterials['K225'];

  // Transform to the format expected by the calculator
  const transformMaterials = (materials, type) => {
    return Object.entries(materials).map(([key, material], index) => {
      // Handle special conversion for BENDEL to kg and LONJOR to kg
      let siUnit = material.unit;
      let siPrice = material.price;
      let conversionFactor = 1;
      
      if (material.unit === 'BENDEL' && material.name === 'KAWAT BENDRAT') {
        siUnit = 'kg';
        siPrice = material.price / 5; // 1 BENDEL = 5 kg
        conversionFactor = 5;
      } else if (material.unit === 'BENDEL' && material.name === 'KAYU AKASIA 3X5') {
        siUnit = 'BATANG';
        siPrice = material.price / 10; // 1 BENDEL = 10 BATANG
        conversionFactor = 10;
      } else if (material.unit === 'BENDEL' && material.name === 'KAYU AKASIA 4X6') {
        siUnit = 'BATANG';
        siPrice = material.price / 6; // 1 BENDEL = 6 BATANG
        conversionFactor = 6;
      } else if (material.unit === 'LONJOR') {
        // Extract diameter from material name for weight calculation
        const diameterMatch = material.name.match(/D(\d+)/);
        const diameter = diameterMatch ? `D${diameterMatch[1]}` : 'D12';
        const weightPerLonjor = getWeightPerLonjor(diameter);
        
        siUnit = 'kg';
        siPrice = material.price / weightPerLonjor; // Price per kg
        conversionFactor = weightPerLonjor; // kg per lonjor
      } else if (material.unit === 'TRUK') {
        siUnit = 'm³';
        siPrice = material.price / 7; // 1 TRUK = 7 m³
        conversionFactor = 7;
      } else if (material.unit === 'DUM') {
        siUnit = 'm³';
        siPrice = material.price / 3; // 1 DUM = 3 m³
        conversionFactor = 3;
      }
      
      return {
        id: `${type}_${key}_${index}`,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
        marketUnit: material.unit,
        marketPrice: material.price,
        siUnit: siUnit,
        siPrice: siPrice,
        conversionFactor: conversionFactor,
        supplier: 'Default',
        is_primary: true,
        quantity_per_unit: material.quantity
      };
    });
  };

  return {
    beton: transformMaterials(selectedConcreteMaterials, 'beton'),
    bekisting: transformMaterials(bekistingMaterials, 'bekisting'),
    besi: transformMaterials(besiMaterials, 'besi')
  };
};

// Function to get material adjustment factor based on concrete quality change
export const getMaterialAdjustmentFactor = (fromQuality, toQuality, materialType) => {
  const qualityFactors = {
    'K125': { cement: 1.0, aggregate: 1.0 },
    'K175': { cement: 1.09, aggregate: 1.05 },
    'K200': { cement: 1.18, aggregate: 1.10 },
    'K225': { cement: 1.27, aggregate: 1.15 },
    'K250': { cement: 1.36, aggregate: 1.20 },
    'K300': { cement: 1.55, aggregate: 1.30 },
    'K350': { cement: 1.64, aggregate: 1.35 },
    'K400': { cement: 1.82, aggregate: 1.40 }
  };

  const fromFactor = qualityFactors[fromQuality] || qualityFactors['K225'];
  const toFactor = qualityFactors[toQuality] || qualityFactors['K225'];

  if (materialType === 'cement') {
    return toFactor.cement / fromFactor.cement;
  } else if (materialType === 'aggregate') {
    return toFactor.aggregate / fromFactor.aggregate;
  }
  
  return 1.0; // No adjustment for other materials
};

// Function to determine material type for adjustment
export const getMaterialType = (materialName) => {
  const name = materialName.toLowerCase();
  if (name.includes('semen')) return 'cement';
  if (name.includes('pasir') || name.includes('kerikil') || name.includes('split')) return 'aggregate';
  return 'other';
};
