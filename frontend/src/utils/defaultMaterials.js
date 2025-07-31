// Default materials configuration for all calculators
// These materials will be used automatically without user selection

export const DEFAULT_MATERIALS = {
  // Beton materials (concrete-related)
  beton: [
    {
      id: 'default_semen',
      name: 'Semen Portland (Default)',
      unit: 'sak',
      siUnit: 'kg',
      price: 65000, // per sak
      siPrice: 1300, // per kg (65000/50)
      conversionFactor: 50, // 1 sak = 50 kg
      quantity: 7.5, // sak per m³ (for K225)
      type: 'cement',
      description: 'Semen Portland Type I - 50kg per sak'
    },
    {
      id: 'default_pasir',
      name: 'Pasir Halus (Default)',
      unit: 'm³',
      siUnit: 'm³',
      price: 350000, // per m³
      siPrice: 350000,
      conversionFactor: 1,
      quantity: 0.48, // m³ per m³ beton (for K225)
      type: 'sand',
      description: 'Pasir halus untuk campuran beton'
    },
    {
      id: 'default_kerikil',
      name: 'Kerikil (Default)',
      unit: 'm³',
      siUnit: 'm³',
      price: 400000, // per m³
      siPrice: 400000,
      conversionFactor: 1,
      quantity: 0.68, // m³ per m³ beton (for K225)
      type: 'gravel',
      description: 'Kerikil/agregat kasar untuk campuran beton'
    }
  ],

  // Bekisting materials (formwork-related)
  bekisting: [
    {
      id: 'default_kayu',
      name: 'Kayu Bekisting 3x5 (Default)',
      unit: 'bendel',
      siUnit: 'lembar',
      price: 850000, // per bendel (10 lembar)
      siPrice: 85000, // per lembar
      conversionFactor: 10, // 1 bendel = 10 lembar
      quantity: 0.1, // bendel per m² (1 lembar per m², 1 bendel = 10 lembar)
      type: 'wood',
      description: 'Kayu bekisting ukuran 3x5 cm - 1 bendel = 10 lembar'
    },
    {
      id: 'default_paku',
      name: 'Paku (Default)',
      unit: 'kg',
      siUnit: 'kg',
      price: 18000, // per kg
      siPrice: 18000,
      conversionFactor: 1,
      quantity: 0.5, // kg per m²
      type: 'nail',
      description: 'Paku untuk pemasangan bekisting'
    }
  ],

  // Besi materials (reinforcement-related)
  besi: [
    {
      id: 'default_besi',
      name: 'Besi Tulangan (Default)',
      unit: 'kg',
      siUnit: 'kg',
      price: 15000, // per kg
      siPrice: 15000,
      conversionFactor: 1,
      quantity: 1.05, // kg per kg tulangan (termasuk waste)
      type: 'iron',
      description: 'Besi tulangan berbagai diameter'
    },
    {
      id: 'default_kawat',
      name: 'Kawat Bendrat (Default)',
      unit: 'kg',
      siUnit: 'kg',
      price: 25000, // per kg
      siPrice: 25000,
      conversionFactor: 1,
      quantity: 0.05, // kg per kg tulangan
      type: 'wire',
      description: 'Kawat bendrat untuk mengikat tulangan'
    }
  ]
};

// Get all default materials as a flat array
export const getAllDefaultMaterials = () => {
  return [
    ...DEFAULT_MATERIALS.beton,
    ...DEFAULT_MATERIALS.bekisting,
    ...DEFAULT_MATERIALS.besi
  ];
};

// Get default materials by type
export const getDefaultMaterialsByType = (type) => {
  return DEFAULT_MATERIALS[type] || [];
};

// Concrete quality ratios for adjusting cement, sand, gravel quantities
export const CONCRETE_QUALITY_RATIOS = {
  K175: {
    cementRatio: 6.5,
    sandRatio: 0.45,
    gravelRatio: 0.65,
    waterCementRatio: 0.65
  },
  K200: {
    cementRatio: 7,
    sandRatio: 0.47,
    gravelRatio: 0.67,
    waterCementRatio: 0.60
  },
  K225: {
    cementRatio: 7.5,
    sandRatio: 0.48,
    gravelRatio: 0.68,
    waterCementRatio: 0.58
  },
  K250: {
    cementRatio: 8,
    sandRatio: 0.50,
    gravelRatio: 0.70,
    waterCementRatio: 0.55
  },
  K300: {
    cementRatio: 8.5,
    sandRatio: 0.52,
    gravelRatio: 0.72,
    waterCementRatio: 0.50
  },
  K350: {
    cementRatio: 9,
    sandRatio: 0.54,
    gravelRatio: 0.74,
    waterCementRatio: 0.45
  }
};

// Adjust material quantities based on concrete quality
export const adjustMaterialForConcreteQuality = (material, concreteQuality = 'K225') => {
  const baseQuality = CONCRETE_QUALITY_RATIOS.K225;
  const targetQuality = CONCRETE_QUALITY_RATIOS[concreteQuality] || baseQuality;
  
  let adjustmentFactor = 1.0;
  
  if (material.type === 'cement') {
    adjustmentFactor = targetQuality.cementRatio / baseQuality.cementRatio;
  } else if (material.type === 'sand') {
    adjustmentFactor = targetQuality.sandRatio / baseQuality.sandRatio;
  } else if (material.type === 'gravel') {
    adjustmentFactor = targetQuality.gravelRatio / baseQuality.gravelRatio;
  }
  
  return {
    ...material,
    quantity: material.quantity * adjustmentFactor,
    adjustmentFactor
  };
};

// Get processed default materials with waste factor applied
export const getProcessedDefaultMaterials = (type, volume, wasteFactor = 0.05, concreteQuality = 'K225') => {
  const materials = getDefaultMaterialsByType(type);
  
  return materials.map(material => {
    // Adjust for concrete quality if applicable
    const adjustedMaterial = adjustMaterialForConcreteQuality(material, concreteQuality);
    
    // Calculate quantities
    const baseQuantity = adjustedMaterial.quantity * volume;
    const quantityWithWaste = baseQuantity * (1 + wasteFactor);
    const materialCost = quantityWithWaste * adjustedMaterial.price;
    
    return {
      ...adjustedMaterial,
      baseQuantity,
      quantityWithWaste,
      materialCost,
      volume,
      wasteFactor
    };
  });
};

export default DEFAULT_MATERIALS;
