// Utility untuk perhitungan campuran beton yang akurat berdasarkan data riset lokal
export class ConcreteCalculator {
  constructor() {
    // Data campuran beton berdasarkan riset lokal - SEMEN 40KG per SAK
    this.concreteMixes = {
      'K-225': {
        name: 'K-225 (fc\' = 18.7 MPa)',
        ratio: 'Berdasarkan data riset lokal',
        materials: {
          cement: { 
            quantity_sak: 0.0250, // sak per m³ berdasarkan data riset
            quantity_kg: 1.0, // 0.0250 sak × 40kg = 1.0 kg per m³
            unit: 'sak',
            sack_weight: 40 // kg per sak
          },
          // Data material lain akan ditambahkan sesuai riset selanjutnya
          sand: { quantity: null, unit: 'm³', note: 'Data akan ditambahkan' },
          gravel: { quantity: null, unit: 'm³', note: 'Data akan ditambahkan' },
          water: { quantity: null, unit: 'liter', note: 'Data akan ditambahkan' }
        },
        usage: 'Beton struktural, kolom, balok, plat lantai',
        data_source: 'Riset lokal'
      }
      // Mutu lain akan ditambahkan berdasarkan data riset selanjutnya
    };

    // Data material khusus berdasarkan riset lokal
    this.specialMaterials = {
      'pasir_japanan_granite': {
        name: 'Pasir Japanan untuk Granite',
        market_unit: 'truk',
        market_quantity: 7, // m³ per truk
        usage_per_m2: 0.0343, // m³ per m² granite
        conversion_factor: 7, // 1 truk = 7 m³
        base_unit: 'm³',
        description: '1 truk = 7 m³, kebutuhan 0.0343 m³ per m² granite'
      }
    };

    // Template untuk granit dengan ukuran dinamis
    this.graniteTemplate = {
      default_60x60: {
        pieces_per_box: 4,
        piece_width: 60, // cm
        piece_height: 60, // cm
        coverage_per_box: 1.44, // m²
        boxes_per_m2: 0.6944
      }
    };

    // Common cement types - disesuaikan dengan standar lokal 40kg
    this.cementTypes = {
      'OPC': {
        name: 'Ordinary Portland Cement',
        sack_weights: [40], // hanya 40kg berdasarkan data lokal
        typical_usage: 'Beton struktural umum'
      },
      'PPC': {
        name: 'Portland Pozzolan Cement', 
        sack_weights: [40],
        typical_usage: 'Beton tahan sulfat, mass concrete'
      }
    };
  }

  /**
   * Get concrete mix data for specific grade
   * @param {string} grade - Concrete grade (K-175, K-225, etc.)
   * @returns {Object} Mix data
   */
  getMixData(grade) {
    const normalizedGrade = grade.toUpperCase();
    if (!this.concreteMixes[normalizedGrade]) {
      throw new Error(`Concrete grade ${grade} not found`);
    }
    return this.concreteMixes[normalizedGrade];
  }

  /**
   * Calculate granite conversion with dynamic dimensions
   * @param {Object} params - Calculation parameters
   * @param {number} params.pieces_per_box - Number of pieces per box
   * @param {number} params.piece_width - Width in cm
   * @param {number} params.piece_height - Height in cm
   * @returns {Object} Conversion data
   */
  calculateGraniteConversion(params) {
    const {
      pieces_per_box = 4,
      piece_width = 60,
      piece_height = 60
    } = params;

    if (pieces_per_box <= 0 || piece_width <= 0 || piece_height <= 0) {
      throw new Error('Invalid input: all values must be greater than 0');
    }

    // Convert cm to m²
    const area_per_piece = (piece_width * piece_height) / 10000; // cm² to m²
    const coverage_per_box = pieces_per_box * area_per_piece;
    const boxes_per_m2 = 1 / coverage_per_box;

    return {
      input: {
        pieces_per_box,
        piece_width,
        piece_height
      },
      calculations: {
        area_per_piece_cm2: piece_width * piece_height,
        area_per_piece_m2: parseFloat(area_per_piece.toFixed(6)),
        coverage_per_box_m2: parseFloat(coverage_per_box.toFixed(4)),
        boxes_per_m2: parseFloat(boxes_per_m2.toFixed(6))
      },
      conversion: {
        market_unit: 'dus',
        calculation_unit: 'm²',
        conversion_factor: parseFloat(boxes_per_m2.toFixed(6)), // 1 m² = X dus
        base_unit: 'm²',
        conversion_description: `1 m² = ${boxes_per_m2.toFixed(4)} dus (${pieces_per_box} keping @ ${piece_width}×${piece_height}cm = ${coverage_per_box.toFixed(4)} m²)`
      }
    };
  }

  /**
   * Calculate cement conversion based on local research data (40kg sacks)
   * @param {Object} params - Parameters
   * @param {string} params.grade - Concrete grade
   * @param {number} params.volume - Volume in m³
   * @returns {Object} Conversion data
   */
  calculateCementConversion(params) {
    const { grade = 'K-225', volume = 1 } = params;

    const mixData = this.getMixData(grade);
    if (!mixData) {
      throw new Error(`Concrete grade ${grade} not found in research data`);
    }

    const cementData = mixData.materials.cement;
    const sacks_needed = cementData.quantity_sak * volume;
    const kg_needed = sacks_needed * cementData.sack_weight;

    return {
      grade: grade,
      volume: volume,
      cement_requirements: {
        sacks_needed: parseFloat(sacks_needed.toFixed(4)),
        kg_needed: parseFloat(kg_needed.toFixed(2)),
        sack_weight: cementData.sack_weight
      },
      conversion: {
        market_unit: 'sak',
        calculation_unit: 'kg',
        conversion_factor: cementData.sack_weight, // 1 sak = 40 kg
        base_unit: 'kg',
        usage_per_m3: {
          saks: cementData.quantity_sak,
          kg: cementData.quantity_kg
        },
        conversion_description: `1 sak = ${cementData.sack_weight} kg | Kebutuhan ${grade}: ${cementData.quantity_sak} sak/m³ (${cementData.quantity_kg} kg/m³)`
      }
    };
  }

  /**
   * Calculate special material conversion (like pasir japanan)
   * @param {Object} params - Parameters
   * @param {string} params.material_type - Type of special material
   * @param {number} params.area - Area in m² (for granite work)
   * @returns {Object} Conversion data
   */
  calculateSpecialMaterialConversion(params) {
    const { material_type, area = 1 } = params;

    if (material_type === 'pasir_japanan_granite') {
      const materialData = this.specialMaterials.pasir_japanan_granite;
      const volume_needed = materialData.usage_per_m2 * area;
      const trucks_needed = volume_needed / materialData.market_quantity;

      return {
        material: materialData.name,
        area: area,
        requirements: {
          volume_m3: parseFloat(volume_needed.toFixed(4)),
          trucks_needed: parseFloat(trucks_needed.toFixed(4)),
          trucks_rounded: Math.ceil(trucks_needed)
        },
        conversion: {
          market_unit: materialData.market_unit,
          calculation_unit: materialData.base_unit,
          conversion_factor: materialData.conversion_factor,
          usage_per_m2: materialData.usage_per_m2,
          conversion_description: materialData.description
        }
      };
    }

    throw new Error(`Special material type ${material_type} not found`);
  }

  /**
   * Generate material conversion data for database storage
   * @param {Object} params - Parameters
   * @param {string} params.material_name - Material name
   * @param {string} params.material_type - Type (cement, granite, special)
   * @param {Object} params.specifications - Material specifications
   * @param {number} params.price - Price per unit
   * @returns {Object} Conversion data for database
   */
  generateMaterialConversion(params) {
    const {
      material_name,
      material_type,
      specifications = {},
      price = 0
    } = params;

    if (material_type === 'cement') {
      const grade = specifications.grade || 'K-225';
      const conversion = this.calculateCementConversion({ grade });

      return {
        name: material_name,
        unit: 'sak',
        price: price,
        conversion_factor: 40, // 1 sak = 40 kg
        base_unit: 'kg',
        market_unit: 'sak',
        calculation_unit: 'kg',
        conversion_description: conversion.conversion.conversion_description,
        material_type: 'powder',
        grade_usage: JSON.stringify({
          [grade]: {
            saks_per_m3: conversion.conversion.usage_per_m3.saks,
            kg_per_m3: conversion.conversion.usage_per_m3.kg
          }
        })
      };
    }

    if (material_type === 'granite') {
      const pieces = specifications.pieces_per_box || 4;
      const width = specifications.piece_width || 60;
      const height = specifications.piece_height || 60;
      
      const conversion = this.calculateGraniteConversion({
        pieces_per_box: pieces,
        piece_width: width,
        piece_height: height
      });

      return {
        name: material_name,
        unit: 'dus',
        price: price,
        conversion_factor: conversion.conversion.conversion_factor,
        base_unit: 'm²',
        market_unit: 'dus',
        calculation_unit: 'm²',
        pieces_per_unit: pieces,
        piece_dimensions: `${width}x${height}cm`,
        coverage_per_unit: conversion.calculations.coverage_per_box_m2,
        conversion_description: conversion.conversion.conversion_description,
        material_type: 'tile'
      };
    }

    if (material_type === 'pasir_japanan') {
      const materialData = this.specialMaterials.pasir_japanan_granite;
      
      return {
        name: material_name,
        unit: 'truk',
        price: price,
        conversion_factor: materialData.conversion_factor, // 1 truk = 7 m³
        base_unit: 'm³',
        market_unit: 'truk',
        calculation_unit: 'm³',
        conversion_description: materialData.description,
        material_type: 'aggregate',
        usage_per_m2: materialData.usage_per_m2
      };
    }

    return null;
  }

  /**
   * Add new concrete grade data
   * @param {Object} gradeData - Grade data
   */
  addConcreteGrade(gradeData) {
    const { grade_code, materials } = gradeData;
    this.concreteMixes[grade_code] = {
      ...gradeData,
      data_source: 'User research data'
    };
  }

  /**
   * Get available concrete grades from research data
   * @returns {Array} List of grades
   */
  getAvailableGrades() {
    return Object.entries(this.concreteMixes).map(([grade, data]) => ({
      grade: grade,
      name: data.name,
      ratio: data.ratio,
      usage: data.usage,
      data_source: data.data_source,
      cement_saks_per_m3: data.materials.cement.quantity_sak,
      cement_kg_per_m3: data.materials.cement.quantity_kg
    }));
  }

  /**
   * Validate and suggest conversion for material name
   * @param {string} materialName - Material name
   * @param {string} unit - Unit
   * @returns {Object} Suggestion
   */
  suggestConversion(materialName, unit) {
    const name = materialName.toLowerCase();
    const unitLower = unit.toLowerCase();

    // Cement detection
    if (name.includes('semen') || name.includes('cement')) {
      if (unitLower.includes('sak') || unitLower.includes('zak')) {
        return this.generateMaterialConversion({
          material_name: materialName,
          material_type: 'cement',
          specifications: { grade: 'K-225' }
        });
      }
    }

    // Granite detection
    if (name.includes('granit') || name.includes('keramik') || name.includes('tile')) {
      if (unitLower.includes('dus') || unitLower.includes('box')) {
        return this.generateMaterialConversion({
          material_name: materialName,
          material_type: 'granite',
          specifications: {
            pieces_per_box: 4,
            piece_width: 60,
            piece_height: 60
          }
        });
      }
    }

    // Pasir japanan detection
    if (name.includes('pasir') && name.includes('japanan')) {
      if (unitLower.includes('truk')) {
        return this.generateMaterialConversion({
          material_name: materialName,
          material_type: 'pasir_japanan'
        });
      }
    }

    return null;
  }

  /**
   * Validate concrete grade
   * @param {string} grade - Grade to validate
   * @returns {boolean} Is valid
   */
  isValidGrade(grade) {
    return Object.keys(this.concreteMixes).includes(grade.toUpperCase());
  }
}

// Export singleton instance
export const concreteCalculator = new ConcreteCalculator();
export default concreteCalculator;
