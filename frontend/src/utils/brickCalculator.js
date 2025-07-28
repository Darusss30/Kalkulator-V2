// Utility untuk perhitungan bata yang akurat
export class BrickCalculator {
  constructor() {
    // Standard brick dimensions in mm
    this.standardBricks = {
      red_brick: { length: 230, width: 110, height: 50 },
      concrete_block: { length: 390, width: 190, height: 190 },
      light_brick: { length: 600, width: 200, height: 100 }
    };
  }

  /**
   * Calculate brick wall coverage with accurate mortar joint calculation
   * @param {Object} params - Calculation parameters
   * @param {number} params.pieces - Number of bricks per unit
   * @param {number} params.brickLength - Brick length in mm
   * @param {number} params.brickWidth - Brick width in mm  
   * @param {number} params.brickHeight - Brick height in mm
   * @param {number} params.mortarThickness - Mortar thickness in mm (default: 10)
   * @param {number} params.wasteFactor - Waste factor percentage (default: 5)
   * @param {string} params.wallType - 'single' or 'double' wall (default: 'single')
   * @returns {Object} Calculation results
   */
  calculateWallCoverage(params) {
    const {
      pieces = 0,
      brickLength = 0,
      brickWidth = 0,
      brickHeight = 0,
      mortarThickness = 10,
      wasteFactor = 0,
      wallType = 'single'
    } = params;

    // Validation
    if (pieces <= 0 || brickLength <= 0 || brickHeight <= 0) {
      throw new Error('Invalid input: pieces, length, and height must be greater than 0');
    }

    // Convert mm to meters
    const brickLengthM = brickLength / 1000;
    const brickHeightM = brickHeight / 1000;
    const brickWidthM = brickWidth / 1000;
    const mortarThicknessM = mortarThickness / 1000;

    // Calculate effective dimensions (brick + mortar joint)
    const effectiveLengthM = brickLengthM + mortarThicknessM;
    const effectiveHeightM = brickHeightM + mortarThicknessM;

    // Calculate area per brick (including mortar joint)
    const areaPerBrick = effectiveLengthM * effectiveHeightM;

    // Calculate total base area (without waste)
    const totalAreaBase = pieces * areaPerBrick;

    // Apply waste factor
    const totalAreaWithWaste = totalAreaBase * (1 + wasteFactor / 100);

    // Calculate bricks per m² (inverse of area per brick)
    const bricksPerM2 = 1 / areaPerBrick;

    // Calculate conversion factor (1 m² = berapa unit kemasan)
    const conversionFactor = 1 / totalAreaWithWaste;

    // Calculate mortar volume per m² (approximate)
    const mortarVolumePerM2 = this.calculateMortarVolume({
      brickLengthM,
      brickHeightM,
      brickWidthM,
      mortarThicknessM,
      bricksPerM2,
      wallType
    });

    return {
      // Input parameters
      input: {
        pieces,
        brickLength,
        brickWidth,
        brickHeight,
        mortarThickness,
        wasteFactor,
        wallType
      },
      
      // Calculated dimensions
      dimensions: {
        brickLengthM: parseFloat(brickLengthM.toFixed(4)),
        brickHeightM: parseFloat(brickHeightM.toFixed(4)),
        brickWidthM: parseFloat(brickWidthM.toFixed(4)),
        effectiveLengthM: parseFloat(effectiveLengthM.toFixed(4)),
        effectiveHeightM: parseFloat(effectiveHeightM.toFixed(4))
      },

      // Area calculations
      areas: {
        areaPerBrick: parseFloat(areaPerBrick.toFixed(6)),
        totalAreaBase: parseFloat(totalAreaBase.toFixed(4)),
        totalAreaWithWaste: parseFloat(totalAreaWithWaste.toFixed(4)),
        wasteArea: parseFloat((totalAreaWithWaste - totalAreaBase).toFixed(4))
      },

      // Conversion factors
      conversion: {
        bricksPerM2: parseFloat(bricksPerM2.toFixed(2)),
        conversionFactor: parseFloat(conversionFactor.toFixed(6)),
        unitsPerM2: parseFloat(conversionFactor.toFixed(6)) // Same as conversion factor
      },

      // Additional calculations
      mortar: {
        volumePerM2: parseFloat(mortarVolumePerM2.toFixed(4)),
        totalVolume: parseFloat((mortarVolumePerM2 * totalAreaWithWaste).toFixed(4))
      },

      // Formatted description
      description: this.generateDescription({
        pieces,
        brickLength,
        brickWidth,
        brickHeight,
        mortarThickness,
        wasteFactor,
        totalAreaWithWaste,
        conversionFactor,
        unit: 'truk' // Default unit, can be customized
      })
    };
  }

  /**
   * Calculate mortar volume required per m²
   */
  calculateMortarVolume({ brickLengthM, brickHeightM, brickWidthM, mortarThicknessM, bricksPerM2, wallType }) {
    // Simplified mortar calculation
    // Horizontal joints: length × thickness × width
    // Vertical joints: height × thickness × width
    
    const horizontalJointVolume = brickLengthM * mortarThicknessM * brickWidthM;
    const verticalJointVolume = brickHeightM * mortarThicknessM * brickWidthM;
    
    // Total mortar per brick
    const mortarPerBrick = horizontalJointVolume + verticalJointVolume;
    
    // Mortar per m² (considering wall type)
    const multiplier = wallType === 'double' ? 2 : 1;
    return mortarPerBrick * bricksPerM2 * multiplier;
  }

  /**
   * Generate human-readable description
   */
  generateDescription({ pieces, brickLength, brickWidth, brickHeight, mortarThickness, wasteFactor, totalAreaWithWaste, conversionFactor, unit }) {
    return `1 m² = ${conversionFactor.toFixed(4)} ${unit} (${pieces} bata @ ${brickLength}×${brickWidth}×${brickHeight}mm + mortar ${mortarThickness}mm = ${totalAreaWithWaste.toFixed(2)} m² tembok termasuk waste ${wasteFactor}%)`;
  }

  /**
   * Validate brick dimensions against common standards
   */
  validateDimensions(length, width, height) {
    const warnings = [];
    
    // Check if dimensions are reasonable
    if (length < 100 || length > 600) {
      warnings.push(`Panjang bata ${length}mm tidak umum (biasanya 200-400mm)`);
    }
    
    if (width < 50 || width > 300) {
      warnings.push(`Lebar bata ${width}mm tidak umum (biasanya 100-200mm)`);
    }
    
    if (height < 30 || height > 250) {
      warnings.push(`Tinggi bata ${height}mm tidak umum (biasanya 50-200mm)`);
    }

    return warnings;
  }

  /**
   * Get preset configurations for common brick types
   */
  getPresets() {
    return {
      bata_merah: {
        name: 'Bata Merah Standar',
        length: 230,
        width: 110,
        height: 50,
        mortarThickness: 10,
        wasteFactor: 0,
        description: 'Bata merah standar Indonesia'
      },
      bata_putih: {
        name: 'Batu Bata Kapur Putih',
        length: 370,
        width: 220,
        height: 90,
        mortarThickness: 10,
        wasteFactor: 0,
        description: 'Batu bata kapur putih 37×22×9 cm'
      },
      batako: {
        name: 'Batako/Bata Beton',
        length: 390,
        width: 190,
        height: 190,
        mortarThickness: 15,
        wasteFactor: 0,
        description: 'Batako beton hollow'
      },
      bata_ringan: {
        name: 'Bata Ringan AAC',
        length: 600,
        width: 200,
        height: 100,
        mortarThickness: 3,
        wasteFactor: 0,
        description: 'Bata ringan Autoclaved Aerated Concrete'
      }
    };
  }
}

// Export singleton instance
export const brickCalculator = new BrickCalculator();
export default brickCalculator;
