const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');
const { validateCalculationInput, validatePagination, validateId } = require('../middleware/validation');

// Calculate construction costs
router.post('/:jobTypeId', validateCalculationInput, optionalAuth, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    const { 
      volume, 
      productivity, 
      worker_ratio, 
      num_workers,
      num_tukang, // Add this
      num_pekerja, // Add this
      material_specs = [],
      profit_percentage = 20, // Default 20% profit
      project_name = null, // New: Project/client name
      custom_waste_factor = null // New: Custom waste factor percentage
    } = req.body;
    
    // Get job type with category info
    const jobType = await db.getOne(`
      SELECT 
        jt.*,
        jc.name as category_name
      FROM job_types jt
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE jt.id = ?
    `, [jobTypeId]);
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'The specified job type does not exist'
      });
    }
    
    // Parse worker ratio (e.g., "1:2" means 1 tukang : 2 pekerja)
    const [tukangRatio, pekerjaRatio] = worker_ratio.split(':').map(Number);
    
    if (isNaN(tukangRatio) || isNaN(pekerjaRatio)) {
      return res.status(400).json({
        error: 'Invalid worker ratio',
        message: 'Worker ratio must be in format "number:number"'
      });
    }
    
    // Validate that at least one worker type is present
    if (tukangRatio === 0 && pekerjaRatio === 0) {
      return res.status(400).json({
        error: 'Invalid worker ratio',
        message: 'At least one worker (tukang or pekerja) must be present'
      });
    }
    
    // Calculate number of workers - prioritize explicit num_tukang/num_pekerja from frontend
    let numTukang, numPekerja;
    if (num_tukang !== undefined && num_pekerja !== undefined) {
      // Use explicit worker counts from frontend
      numTukang = parseInt(num_tukang) || 0;
      numPekerja = parseInt(num_pekerja) || 0;
    } else if (num_workers) {
      // If total workers provided, distribute based on ratio
      const totalRatio = tukangRatio + pekerjaRatio;
      if (totalRatio > 0) {
        numTukang = Math.ceil((num_workers * tukangRatio) / totalRatio);
        numPekerja = Math.ceil((num_workers * pekerjaRatio) / totalRatio);
      } else {
        numTukang = tukangRatio;
        numPekerja = pekerjaRatio;
      }
    } else {
      // Use ratio directly (allow 0 for either type)
      numTukang = tukangRatio;
      numPekerja = pekerjaRatio;
    }
    
    const totalWorkers = numTukang + numPekerja;
    
    // Ensure at least one worker
    if (totalWorkers === 0) {
      return res.status(400).json({
        error: 'Invalid worker count',
        message: 'At least one worker (tukang or pekerja) must be present'
      });
    }
    
    // FIXED: Use new workforce calculator with proper team formation logic
    const { hitungDurasiPekerjaan } = require('../utils/workforceCalculator');
    
    let estimatedDays, totalProjectProductivity, numberOfTeams, workforceResult;
    
    try {
      workforceResult = hitungDurasiPekerjaan({
        volume_pekerjaan: volume,
        jumlah_tukang: numTukang,
        jumlah_pekerja: numPekerja,
        rasio_tukang_pekerja: worker_ratio,
        produktivitas_per_tim: productivity
      });
      
      // Use results from workforce calculator
      estimatedDays = workforceResult.durasi_kerja_dalam_hari;
      totalProjectProductivity = workforceResult.produktivitas_per_hari;
      numberOfTeams = workforceResult.jumlah_tim_kerja;
      
    } catch (calculationError) {
      // If workforce calculator fails, throw error instead of fallback
      throw new Error('Workforce calculation failed: ' + calculationError.message);
    }
    
    // Get labor rates from job_type_labor table, use default rates if not found
    let tukangRate = { daily_rate: 150000 }; // Default tukang rate
    let pekerjaRate = { daily_rate: 135000 }; // Default pekerja rate
    
    // Get specific labor rates for this job type
    const jobTypeLaborRates = await db.getMany(
      'SELECT worker_type, daily_rate FROM job_type_labor WHERE job_type_id = ?',
      [jobTypeId]
    );
    
    // Update rates if found in job_type_labor table
    if (jobTypeLaborRates.length > 0) {
      for (const rate of jobTypeLaborRates) {
        if (rate.worker_type === 'tukang') {
          tukangRate.daily_rate = rate.daily_rate;
        } else if (rate.worker_type === 'pekerja') {
          pekerjaRate.daily_rate = rate.daily_rate;
        }
      }
    }
    
    // Calculate labor costs (handle zero workers gracefully)
    const tukangCost = numTukang > 0 ? (numTukang * tukangRate.daily_rate) : 0;
    const pekerjaCost = numPekerja > 0 ? (numPekerja * pekerjaRate.daily_rate) : 0;
    const dailyLaborCost = tukangCost + pekerjaCost;
    const totalLaborCost = dailyLaborCost * estimatedDays;
    const laborCostPerUnit = totalLaborCost / volume; // Labor cost per unit volume
    
    // Calculate material costs
    let totalMaterialCost = 0;
    const materialDetails = [];
    
    // Check if user has specified custom materials with quantities
    const validMaterialSpecs = material_specs.filter(spec => 
      spec.material_id && 
      spec.quantity_override && 
      !isNaN(parseFloat(spec.quantity_override)) && 
      parseFloat(spec.quantity_override) > 0
    );
    
    // Determine calculation mode
    let useCustomMaterials = validMaterialSpecs.length > 0;
    let materialsToProcess = [];
    
    if (useCustomMaterials) {
      materialsToProcess = validMaterialSpecs.map(spec => ({
        ...spec,
        isCustom: true
      }));
    } else {
      // Don't process any materials if user hasn't selected any
      materialsToProcess = [];
    }
    
    // Process materials (either custom or template)
    for (const spec of materialsToProcess) {
      try {
        // Get material details with conversion info from database
        const material = await db.getOne(`
          SELECT id, name, unit, price, supplier, description,
                 conversion_factor, base_unit, conversion_description,
                 pieces_per_unit, piece_dimensions, coverage_per_unit,
                 material_type, brick_length, brick_width, brick_height,
                 mortar_thickness, wall_thickness, waste_factor
          FROM materials 
          WHERE id = ?
        `, [spec.material_id]);
        
        if (!material) {
          continue;
        }
        
        // Calculate material requirement with FIXED conversion logic
        let quantityPerUnit = parseFloat(spec.quantity_override);
        let totalQuantityNeeded, materialCost;
        let conversionInfo = '';
        let hasConversion = false;
        
        // Apply waste factor with priority: custom_waste_factor > material waste factor > template waste factor
        // Database stores waste_factor as percentage (e.g., 5.0 for 5%)
        let materialWasteFactorPercent = material.waste_factor || 0.0;
        let templateWasteFactorPercent = spec.template_waste_factor || 0.0;
        
        // Priority order: custom_waste_factor > material-specific > template
        let wasteFactorPercent;
        if (custom_waste_factor !== null && custom_waste_factor !== undefined) {
          // Use custom waste factor if provided by user
          wasteFactorPercent = parseFloat(custom_waste_factor);
        } else if (spec.isCustom) {
          // Use material-specific waste factor for custom materials
          wasteFactorPercent = materialWasteFactorPercent;
        } else {
          // Use template waste factor for auto materials
          wasteFactorPercent = templateWasteFactorPercent;
        }
        
        // Ensure wasteFactorPercent is a number and within reasonable bounds
        const wasteFactorPercentNum = Math.max(0, parseFloat(wasteFactorPercent) || 0.0);
        
        // Convert to decimal for calculation (5% = 0.05)
        const wasteFactorDecimal = wasteFactorPercentNum / 100;
        
        // Check if material has conversion info
        if (material.conversion_factor && material.base_unit && material.conversion_factor !== 1.0) {
          // Material has conversion
          hasConversion = true;
          
          // FIXED CALCULATION: Apply conversion factor correctly
          // Step 1: Calculate quantity per unit with waste
          const quantityPerUnitWithWaste = quantityPerUnit * (1 + wasteFactorDecimal);
          
          // Step 2: Calculate total quantity needed directly
          // The conversion_factor represents the quantity needed per base unit
          // For example: 0.6944 dus per m² means we need 0.6944 dus for each 1 m²
          totalQuantityNeeded = quantityPerUnitWithWaste * volume;
          
          materialCost = totalQuantityNeeded * material.price;
          
          conversionInfo = material.conversion_description || 
            `1 ${material.unit} = ${material.conversion_factor} ${material.base_unit}`;
        } else {
          // No conversion - use direct calculation
          // (Kebutuhan + waste per m²) × Volume pekerjaan
          const quantityPerUnitWithWaste = quantityPerUnit * (1 + wasteFactorDecimal);
          totalQuantityNeeded = quantityPerUnitWithWaste * volume;
          materialCost = totalQuantityNeeded * material.price;
        }
        
        totalMaterialCost += materialCost;
        
        materialDetails.push({
          material_id: material.id,
          material_name: material.name,
          material_unit: material.unit,
          material_price: material.price,
          supplier: material.supplier,
          quantity_per_unit: quantityPerUnit, // Original user input
          waste_factor: wasteFactorDecimal, // Waste factor in decimal format for calculation
          waste_factor_percentage: wasteFactorPercentNum, // Waste factor in percentage for display
          quantity_per_unit_with_waste: quantityPerUnit * (1 + wasteFactorDecimal), // Add this for display
          conversion_factor: material.conversion_factor,
          base_unit: material.base_unit,
          conversion_description: conversionInfo,
          pieces_per_unit: material.pieces_per_unit,
          piece_dimensions: material.piece_dimensions,
          coverage_per_unit: material.coverage_per_unit,
          material_type: material.material_type,
          brick_length: material.brick_length,
          brick_width: material.brick_width,
          brick_height: material.brick_height,
          mortar_thickness: material.mortar_thickness,
          wall_thickness: material.wall_thickness,
          total_quantity: Math.ceil(totalQuantityNeeded), // Purchase quantity
          material_cost: Math.round(materialCost),
          is_primary: spec.is_primary || false,
          is_custom: spec.isCustom,
          volume_unit: jobType.unit, // Add volume unit for display
          has_conversion: hasConversion,
          calculation_mode: useCustomMaterials ? 'custom' : 'auto',
          // Additional fields for debugging and display
          base_quantity_per_unit: hasConversion ? quantityPerUnit : quantityPerUnit,
          total_base_quantity: hasConversion ? (quantityPerUnit * (1 + wasteFactorDecimal) * volume) : (quantityPerUnit * (1 + wasteFactorDecimal) * volume)
        });
      } catch (materialError) {
        // Continue processing other materials instead of failing completely
        continue;
      }
    }
    
    // Calculate HPP per unit and Total HPP
    const totalCost = totalLaborCost + totalMaterialCost;
    const hppPerUnit = Math.round(totalCost / volume);
    const TotalHPP = Math.round(totalCost);
    
    // Calculate RAB (Rencana Anggaran Biaya) from HPP and profit percentage
    // Formula: RAB = HPP / (100% - profit%)
    const profitPercentageDecimal = parseFloat(profit_percentage) / 100;
    const rabTotal = profitPercentageDecimal >= 1 ? 0 : Math.round(TotalHPP / (1 - profitPercentageDecimal));
    const rabPerUnit = profitPercentageDecimal >= 1 ? 0 : Math.round(hppPerUnit / (1 - profitPercentageDecimal));
    const profitAmount = rabTotal - TotalHPP;
    
    // Prepare calculation result
    const calculationResult = {
      job_type: {
        id: jobType.id,
        name: jobType.name,
        category_name: jobType.category_name,
        unit: jobType.unit
      },
      input: {
        volume,
        productivity,
        worker_ratio,
        estimated_days: estimatedDays, // FIXED: Use exact result from workforce calculator
        profit_percentage: parseFloat(profit_percentage),
        project_name: project_name, // New: Include project name in result
        custom_waste_factor: custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null // New: Include custom waste factor
      },
      labor: {
        num_tukang: numTukang,
        num_pekerja: numPekerja,
        total_workers: totalWorkers,
        tukang_daily_rate: tukangRate.daily_rate,
        pekerja_daily_rate: pekerjaRate.daily_rate,
        daily_labor_cost: Math.round(dailyLaborCost),
        total_labor_cost: Math.round(totalLaborCost),
        labor_cost_per_unit: Math.round(laborCostPerUnit)
      },
      workforce: {
        estimated_days: estimatedDays,
        total_productivity: totalProjectProductivity,
        num_teams: numberOfTeams,
        workforce_details: workforceResult ? workforceResult.detail : null
      },
      materials: {
        details: materialDetails,
        total_material_cost: Math.round(totalMaterialCost)
      },
      summary: {
        total_labor_cost: Math.round(totalLaborCost),
        total_material_cost: Math.round(totalMaterialCost),
        total_cost: TotalHPP,
        hpp_per_unit: hppPerUnit,
        total_rab: rabTotal,  // FIXED: Use rabTotal instead of TotalHPP
        // RAB calculations
        rab_total: rabTotal,
        rab_per_unit: rabPerUnit,
        profit_percentage: parseFloat(profit_percentage),
        profit_amount: profitAmount
      },
      calculation_date: new Date().toISOString()
    };
    
    // Save calculation if user is authenticated
    if (req.user) {
      try {
        const insertId = await db.insert(`
          INSERT INTO calculations (
            user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
            labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, calculation_data,
            profit_percentage, rab_total, project_name, custom_waste_factor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user.id,
          jobTypeId,
          volume,
          productivity,
          worker_ratio,
          totalWorkers,
          totalLaborCost,
          totalMaterialCost,
          hppPerUnit,
          rabTotal,  // ← FIXED: total_rab should store rabTotal, not TotalHPP
          estimatedDays,
          JSON.stringify(calculationResult),
          parseFloat(profit_percentage),
          rabTotal,
          project_name, // New: Save project name
          custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null // New: Save custom waste factor
        ]);
        
      } catch (saveError) {
        // Don't fail the request if saving fails, but log the error clearly
      }
    }
    
    res.json({
      message: 'Calculation completed successfully',
      calculation: calculationResult
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Calculation failed',
      message: 'Internal server error during calculation'
    });
  }
});

// Save calculation manually (separate from calculate)
router.post('/:jobTypeId/save', validateCalculationInput, authenticate, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    const { 
      volume, 
      productivity, 
      worker_ratio, 
      num_workers,
      num_tukang,
      num_pekerja,
      material_specs = [],
      profit_percentage = 20,
      project_name = null,
      custom_waste_factor = null,
      calculation_data = null // Accept pre-calculated data
    } = req.body;
    
    // Get job type with category info
    const jobType = await db.getOne(`
      SELECT 
        jt.*,
        jc.name as category_name
      FROM job_types jt
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE jt.id = ?
    `, [jobTypeId]);
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'The specified job type does not exist'
      });
    }
    
    // If calculation_data is provided, use it directly (for manual saves after calculation)
    let calculationResult = calculation_data;
    let totalLaborCost = 0;
    let totalMaterialCost = 0;
    let hppPerUnit = 0;
    let rabTotal = 0;
    let estimatedDays = 0;
    let totalWorkers = 0;
    
    if (calculationResult) {
      // Extract values from provided calculation data
      totalLaborCost = calculationResult.summary?.total_labor_cost || 0;
      totalMaterialCost = calculationResult.summary?.total_material_cost || 0;
      hppPerUnit = calculationResult.summary?.hpp_per_unit || 0;
      rabTotal = calculationResult.summary?.rab_total || 0;
      estimatedDays = calculationResult.input?.estimated_days || 0;
      totalWorkers = calculationResult.labor?.total_workers || 0;
    } else {
      // If no calculation_data provided, perform calculation
      // Parse worker ratio
      const [tukangRatio, pekerjaRatio] = worker_ratio.split(':').map(Number);
      
      if (isNaN(tukangRatio) || isNaN(pekerjaRatio)) {
        return res.status(400).json({
          error: 'Invalid worker ratio',
          message: 'Worker ratio must be in format "number:number"'
        });
      }
      
      // Calculate number of workers
      let numTukang, numPekerja;
      if (num_tukang !== undefined && num_pekerja !== undefined) {
        numTukang = parseInt(num_tukang) || 0;
        numPekerja = parseInt(num_pekerja) || 0;
      } else if (num_workers) {
        const totalRatio = tukangRatio + pekerjaRatio;
        if (totalRatio > 0) {
          numTukang = Math.ceil((num_workers * tukangRatio) / totalRatio);
          numPekerja = Math.ceil((num_workers * pekerjaRatio) / totalRatio);
        } else {
          numTukang = tukangRatio;
          numPekerja = pekerjaRatio;
        }
      } else {
        numTukang = tukangRatio;
        numPekerja = pekerjaRatio;
      }
      
      totalWorkers = numTukang + numPekerja;
      
      if (totalWorkers === 0) {
        return res.status(400).json({
          error: 'Invalid worker count',
          message: 'At least one worker (tukang or pekerja) must be present'
        });
      }
      
      // Use workforce calculator
      const { hitungDurasiPekerjaan } = require('../utils/workforceCalculator');
      
      try {
        const workforceResult = hitungDurasiPekerjaan({
          volume_pekerjaan: volume,
          jumlah_tukang: numTukang,
          jumlah_pekerja: numPekerja,
          rasio_tukang_pekerja: worker_ratio,
          produktivitas_per_tim: productivity
        });
        
        estimatedDays = workforceResult.durasi_kerja_dalam_hari;
      } catch (calculationError) {
        throw new Error('Workforce calculation failed: ' + calculationError.message);
      }
      
      // Get labor rates
      let tukangRate = { daily_rate: 150000 };
      let pekerjaRate = { daily_rate: 135000 };
      
      const jobTypeLaborRates = await db.getMany(
        'SELECT worker_type, daily_rate FROM job_type_labor WHERE job_type_id = ?',
        [jobTypeId]
      );
      
      if (jobTypeLaborRates.length > 0) {
        for (const rate of jobTypeLaborRates) {
          if (rate.worker_type === 'tukang') {
            tukangRate.daily_rate = rate.daily_rate;
          } else if (rate.worker_type === 'pekerja') {
            pekerjaRate.daily_rate = rate.daily_rate;
          }
        }
      }
      
      // Calculate labor costs
      const tukangCost = numTukang > 0 ? (numTukang * tukangRate.daily_rate) : 0;
      const pekerjaCost = numPekerja > 0 ? (numPekerja * pekerjaRate.daily_rate) : 0;
      const dailyLaborCost = tukangCost + pekerjaCost;
      totalLaborCost = dailyLaborCost * estimatedDays;
      
      // Calculate material costs (simplified for save endpoint)
      totalMaterialCost = 0;
      const validMaterialSpecs = material_specs.filter(spec => 
        spec.material_id && 
        spec.quantity_override && 
        !isNaN(parseFloat(spec.quantity_override)) && 
        parseFloat(spec.quantity_override) > 0
      );
      
      for (const spec of validMaterialSpecs) {
        try {
          const material = await db.getOne(`
            SELECT id, name, unit, price, waste_factor
            FROM materials 
            WHERE id = ?
          `, [spec.material_id]);
          
          if (!material) continue;
          
          let quantityPerUnit = parseFloat(spec.quantity_override);
          let wasteFactorPercent = custom_waste_factor !== null ? parseFloat(custom_waste_factor) : (material.waste_factor || 0.0);
          const wasteFactorDecimal = Math.max(0, parseFloat(wasteFactorPercent) || 0.0) / 100;
          
          const quantityPerUnitWithWaste = quantityPerUnit * (1 + wasteFactorDecimal);
          const totalQuantityNeeded = quantityPerUnitWithWaste * volume;
          const materialCost = totalQuantityNeeded * material.price;
          
          totalMaterialCost += materialCost;
        } catch (materialError) {
          continue;
        }
      }
      
      // Calculate totals
      const totalCost = totalLaborCost + totalMaterialCost;
      hppPerUnit = Math.round(totalCost / volume);
      const TotalHPP = Math.round(totalCost);
      
      // Calculate RAB
      const profitPercentageDecimal = parseFloat(profit_percentage) / 100;
      rabTotal = profitPercentageDecimal >= 1 ? 0 : Math.round(TotalHPP / (1 - profitPercentageDecimal));
      
      // Create basic calculation result if not provided
      calculationResult = {
        job_type: {
          id: jobType.id,
          name: jobType.name,
          category_name: jobType.category_name,
          unit: jobType.unit
        },
        input: {
          volume,
          productivity,
          worker_ratio,
          estimated_days: estimatedDays,
          profit_percentage: parseFloat(profit_percentage),
          project_name: project_name,
          custom_waste_factor: custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null
        },
        summary: {
          total_labor_cost: Math.round(totalLaborCost),
          total_material_cost: Math.round(totalMaterialCost),
          total_cost: TotalHPP,
          hpp_per_unit: hppPerUnit,
          rab_total: rabTotal,
          profit_percentage: parseFloat(profit_percentage)
        },
        calculation_date: new Date().toISOString()
      };
    }
    
    // Save calculation to database
    const insertId = await db.insert(`
      INSERT INTO calculations (
        user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
        labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, calculation_data,
        profit_percentage, rab_total, project_name, custom_waste_factor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      jobTypeId,
      volume,
      productivity,
      worker_ratio,
      totalWorkers,
      totalLaborCost,
      totalMaterialCost,
      hppPerUnit,
      rabTotal,
      estimatedDays,
      JSON.stringify(calculationResult),
      parseFloat(profit_percentage),
      rabTotal,
      project_name,
      custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null
    ]);
    
    // Get the saved calculation with job type info
    const savedCalculation = await db.getOne(`
      SELECT 
        c.*,
        jt.name as job_type_name,
        jt.unit as job_type_unit,
        jc.name as category_name
      FROM calculations c
      JOIN job_types jt ON c.job_type_id = jt.id
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE c.id = ?
    `, [insertId]);
    
    // Parse calculation_data JSON
    savedCalculation.calculation_data = savedCalculation.calculation_data ? 
      JSON.parse(savedCalculation.calculation_data) : null;
    
    res.json({
      message: 'Calculation saved successfully',
      data: {
        calculation: savedCalculation
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save calculation',
      message: 'Internal server error while saving calculation'
    });
  }
});

// Get calculation history for authenticated user
router.get('/history', authenticate, validatePagination, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get total count
    const totalCount = await db.getOne(
      'SELECT COUNT(*) as total FROM calculations WHERE user_id = ?',
      [userId]
    );
    
    // Get calculations with job type info
    const calculations = await db.getMany(`
      SELECT 
        c.*,
        jt.name as job_type_name,
        jt.unit as job_type_unit,
        jc.name as category_name
      FROM calculations c
      JOIN job_types jt ON c.job_type_id = jt.id
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);
    
    // Parse calculation_data JSON for each calculation
    const calculationsWithData = calculations.map(calc => ({
      ...calc,
      calculation_data: calc.calculation_data ? JSON.parse(calc.calculation_data) : null
    }));
    
    const totalPages = Math.ceil(totalCount.total / limit);
    
    res.json({
      message: 'Calculation history retrieved successfully',
      data: {
        calculations: calculationsWithData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.total,
          pages: totalPages
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch calculation history',
      message: 'Internal server error while fetching calculation history'
    });
  }
});

// Get single calculation by ID
router.get('/history/:id', authenticate, validateId, async (req, res) => {
  try {
    const calculationId = req.params.id;
    const userId = req.user.id;
    
    const calculation = await db.getOne(`
      SELECT 
        c.*,
        jt.name as job_type_name,
        jt.unit as job_type_unit,
        jc.name as category_name
      FROM calculations c
      JOIN job_types jt ON c.job_type_id = jt.id
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE c.id = ? AND c.user_id = ?
    `, [calculationId, userId]);
    
    if (!calculation) {
      return res.status(404).json({
        error: 'Calculation not found',
        message: 'Calculation not found or you do not have permission to access it'
      });
    }
    
    // Parse calculation_data JSON
    calculation.calculation_data = calculation.calculation_data ? 
      JSON.parse(calculation.calculation_data) : null;
    
    res.json({
      message: 'Calculation retrieved successfully',
      data: {
        calculation
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch calculation',
      message: 'Internal server error while fetching calculation'
    });
  }
});

// Update calculation by ID
router.put('/history/:id', authenticate, validateId, async (req, res) => {
  try {
    const calculationId = req.params.id;
    const userId = req.user.id;
    const { 
      volume, 
      productivity, 
      worker_ratio, 
      num_workers,
      num_tukang,
      num_pekerja,
      material_specs = [],
      profit_percentage = 20,
      project_name = null,
      custom_waste_factor = null
    } = req.body;
    
    // Check if calculation exists and belongs to user
    const existingCalculation = await db.getOne(
      'SELECT * FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );
    
    if (!existingCalculation) {
      return res.status(404).json({
        error: 'Calculation not found',
        message: 'Calculation not found or you do not have permission to update it'
      });
    }
    
    // Get job type info for recalculation
    const jobType = await db.getOne(`
      SELECT 
        jt.*,
        jc.name as category_name
      FROM job_types jt
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE jt.id = ?
    `, [existingCalculation.job_type_id]);
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'The job type for this calculation no longer exists'
      });
    }
    
    // Validate input data
    if (!volume || volume <= 0) {
      return res.status(400).json({
        error: 'Invalid volume',
        message: 'Volume must be greater than 0'
      });
    }
    
    if (!productivity || productivity <= 0) {
      return res.status(400).json({
        error: 'Invalid productivity',
        message: 'Productivity must be greater than 0'
      });
    }
    
    // Parse worker ratio
    const [tukangRatio, pekerjaRatio] = worker_ratio.split(':').map(Number);
    
    if (isNaN(tukangRatio) || isNaN(pekerjaRatio)) {
      return res.status(400).json({
        error: 'Invalid worker ratio',
        message: 'Worker ratio must be in format "number:number"'
      });
    }
    
    // Calculate number of workers
    let numTukang, numPekerja;
    if (num_tukang !== undefined && num_pekerja !== undefined) {
      numTukang = parseInt(num_tukang) || 0;
      numPekerja = parseInt(num_pekerja) || 0;
    } else if (num_workers) {
      const totalRatio = tukangRatio + pekerjaRatio;
      if (totalRatio > 0) {
        numTukang = Math.ceil((num_workers * tukangRatio) / totalRatio);
        numPekerja = Math.ceil((num_workers * pekerjaRatio) / totalRatio);
      } else {
        numTukang = tukangRatio;
        numPekerja = pekerjaRatio;
      }
    } else {
      numTukang = tukangRatio;
      numPekerja = pekerjaRatio;
    }
    
    const totalWorkers = numTukang + numPekerja;
    
    if (totalWorkers === 0) {
      return res.status(400).json({
        error: 'Invalid worker count',
        message: 'At least one worker (tukang or pekerja) must be present'
      });
    }
    
    // Recalculate using workforce calculator
    const { hitungDurasiPekerjaan } = require('../utils/workforceCalculator');
    
    let estimatedDays, totalProjectProductivity, numberOfTeams, workforceResult;
    
    try {
      workforceResult = hitungDurasiPekerjaan({
        volume_pekerjaan: volume,
        jumlah_tukang: numTukang,
        jumlah_pekerja: numPekerja,
        rasio_tukang_pekerja: worker_ratio,
        produktivitas_per_tim: productivity
      });
      
      estimatedDays = workforceResult.durasi_kerja_dalam_hari;
      totalProjectProductivity = workforceResult.produktivitas_per_hari;
      numberOfTeams = workforceResult.jumlah_tim_kerja;
      
    } catch (calculationError) {
      throw new Error('Workforce calculation failed: ' + calculationError.message);
    }
    
    // Get labor rates
    let tukangRate = { daily_rate: 150000 };
    let pekerjaRate = { daily_rate: 135000 };
    
    const jobTypeLaborRates = await db.getMany(
      'SELECT worker_type, daily_rate FROM job_type_labor WHERE job_type_id = ?',
      [existingCalculation.job_type_id]
    );
    
    if (jobTypeLaborRates.length > 0) {
      for (const rate of jobTypeLaborRates) {
        if (rate.worker_type === 'tukang') {
          tukangRate.daily_rate = rate.daily_rate;
        } else if (rate.worker_type === 'pekerja') {
          pekerjaRate.daily_rate = rate.daily_rate;
        }
      }
    }
    
    // Calculate labor costs
    const tukangCost = numTukang > 0 ? (numTukang * tukangRate.daily_rate) : 0;
    const pekerjaCost = numPekerja > 0 ? (numPekerja * pekerjaRate.daily_rate) : 0;
    const dailyLaborCost = tukangCost + pekerjaCost;
    const totalLaborCost = dailyLaborCost * estimatedDays;
    const laborCostPerUnit = totalLaborCost / volume;
    
    // Calculate material costs
    let totalMaterialCost = 0;
    const materialDetails = [];
    
    const validMaterialSpecs = material_specs.filter(spec => 
      spec.material_id && 
      spec.quantity_override && 
      !isNaN(parseFloat(spec.quantity_override)) && 
      parseFloat(spec.quantity_override) > 0
    );
    
    // Process materials
    for (const spec of validMaterialSpecs) {
      try {
        const material = await db.getOne(`
          SELECT id, name, unit, price, supplier, description,
                 conversion_factor, base_unit, conversion_description,
                 pieces_per_unit, piece_dimensions, coverage_per_unit,
                 material_type, brick_length, brick_width, brick_height,
                 mortar_thickness, wall_thickness, waste_factor
          FROM materials 
          WHERE id = ?
        `, [spec.material_id]);
        
        if (!material) {
          continue;
        }
        
        let quantityPerUnit = parseFloat(spec.quantity_override);
        let totalQuantityNeeded, materialCost;
        let conversionInfo = '';
        let hasConversion = false;
        
        // Apply waste factor
        let materialWasteFactorPercent = material.waste_factor || 0.0;
        let wasteFactorPercent;
        
        if (custom_waste_factor !== null && custom_waste_factor !== undefined) {
          wasteFactorPercent = parseFloat(custom_waste_factor);
        } else {
          wasteFactorPercent = materialWasteFactorPercent;
        }
        
        const wasteFactorPercentNum = Math.max(0, parseFloat(wasteFactorPercent) || 0.0);
        const wasteFactorDecimal = wasteFactorPercentNum / 100;
        
        // Check conversion
        if (material.conversion_factor && material.base_unit && material.conversion_factor !== 1.0) {
          hasConversion = true;
          const quantityPerUnitWithWaste = quantityPerUnit * (1 + wasteFactorDecimal);
          totalQuantityNeeded = quantityPerUnitWithWaste * volume;
          materialCost = totalQuantityNeeded * material.price;
          conversionInfo = material.conversion_description || 
            `1 ${material.unit} = ${material.conversion_factor} ${material.base_unit}`;
        } else {
          const quantityPerUnitWithWaste = quantityPerUnit * (1 + wasteFactorDecimal);
          totalQuantityNeeded = quantityPerUnitWithWaste * volume;
          materialCost = totalQuantityNeeded * material.price;
        }
        
        totalMaterialCost += materialCost;
        
        materialDetails.push({
          material_id: material.id,
          material_name: material.name,
          material_unit: material.unit,
          material_price: material.price,
          supplier: material.supplier,
          quantity_per_unit: quantityPerUnit,
          waste_factor: wasteFactorDecimal,
          waste_factor_percentage: wasteFactorPercentNum,
          quantity_per_unit_with_waste: quantityPerUnit * (1 + wasteFactorDecimal),
          conversion_factor: material.conversion_factor,
          base_unit: material.base_unit,
          conversion_description: conversionInfo,
          pieces_per_unit: material.pieces_per_unit,
          piece_dimensions: material.piece_dimensions,
          coverage_per_unit: material.coverage_per_unit,
          material_type: material.material_type,
          brick_length: material.brick_length,
          brick_width: material.brick_width,
          brick_height: material.brick_height,
          mortar_thickness: material.mortar_thickness,
          wall_thickness: material.wall_thickness,
          total_quantity: Math.ceil(totalQuantityNeeded),
          material_cost: Math.round(materialCost),
          is_primary: spec.is_primary || false,
          is_custom: true,
          volume_unit: jobType.unit,
          has_conversion: hasConversion,
          calculation_mode: 'custom'
        });
      } catch (materialError) {
        continue;
      }
    }
    
    // Calculate totals
    const totalCost = totalLaborCost + totalMaterialCost;
    const hppPerUnit = Math.round(totalCost / volume);
    const TotalHPP = Math.round(totalCost);
    
    // Calculate RAB
    const profitPercentageDecimal = parseFloat(profit_percentage) / 100;
    const rabTotal = profitPercentageDecimal >= 1 ? 0 : Math.round(TotalHPP / (1 - profitPercentageDecimal));
    const rabPerUnit = profitPercentageDecimal >= 1 ? 0 : Math.round(hppPerUnit / (1 - profitPercentageDecimal));
    const profitAmount = rabTotal - TotalHPP;
    
    // Prepare updated calculation result
    const updatedCalculationResult = {
      job_type: {
        id: jobType.id,
        name: jobType.name,
        category_name: jobType.category_name,
        unit: jobType.unit
      },
      input: {
        volume,
        productivity,
        worker_ratio,
        estimated_days: estimatedDays,
        profit_percentage: parseFloat(profit_percentage),
        project_name: project_name,
        custom_waste_factor: custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null
      },
      labor: {
        num_tukang: numTukang,
        num_pekerja: numPekerja,
        total_workers: totalWorkers,
        tukang_daily_rate: tukangRate.daily_rate,
        pekerja_daily_rate: pekerjaRate.daily_rate,
        daily_labor_cost: Math.round(dailyLaborCost),
        total_labor_cost: Math.round(totalLaborCost),
        labor_cost_per_unit: Math.round(laborCostPerUnit)
      },
      workforce: {
        estimated_days: estimatedDays,
        total_productivity: totalProjectProductivity,
        num_teams: numberOfTeams,
        workforce_details: workforceResult ? workforceResult.detail : null
      },
      materials: {
        details: materialDetails,
        total_material_cost: Math.round(totalMaterialCost)
      },
      summary: {
        total_labor_cost: Math.round(totalLaborCost),
        total_material_cost: Math.round(totalMaterialCost),
        total_cost: TotalHPP,
        hpp_per_unit: hppPerUnit,
        total_rab: rabTotal,
        rab_total: rabTotal,
        rab_per_unit: rabPerUnit,
        profit_percentage: parseFloat(profit_percentage),
        profit_amount: profitAmount
      },
      calculation_date: new Date().toISOString()
    };
    
    // Update the calculation in database
    await db.update(`
      UPDATE calculations SET
        volume = ?, productivity = ?, worker_ratio = ?, num_workers = ?,
        labor_cost = ?, material_cost = ?, hpp_per_unit = ?, total_rab = ?, 
        estimated_days = ?, calculation_data = ?, profit_percentage = ?, 
        rab_total = ?, project_name = ?, custom_waste_factor = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [
      volume,
      productivity,
      worker_ratio,
      totalWorkers,
      totalLaborCost,
      totalMaterialCost,
      hppPerUnit,
      rabTotal,
      estimatedDays,
      JSON.stringify(updatedCalculationResult),
      parseFloat(profit_percentage),
      rabTotal,
      project_name,
      custom_waste_factor !== null ? parseFloat(custom_waste_factor) : null,
      calculationId,
      userId
    ]);
    
    // Get the updated calculation with job type info
    const updatedCalculation = await db.getOne(`
      SELECT 
        c.*,
        jt.name as job_type_name,
        jt.unit as job_type_unit,
        jc.name as category_name
      FROM calculations c
      JOIN job_types jt ON c.job_type_id = jt.id
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE c.id = ? AND c.user_id = ?
    `, [calculationId, userId]);
    
    // Parse calculation_data JSON
    updatedCalculation.calculation_data = updatedCalculation.calculation_data ? 
      JSON.parse(updatedCalculation.calculation_data) : null;
    
    res.json({
      message: 'Calculation updated successfully',
      data: {
        calculation: updatedCalculation
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update calculation',
      message: 'Internal server error while updating calculation'
    });
  }
});

// Delete calculation by ID
router.delete('/history/:id', authenticate, validateId, async (req, res) => {
  try {
    const calculationId = req.params.id;
    const userId = req.user.id;
    
    // Check if calculation exists and belongs to user
    const calculation = await db.getOne(
      'SELECT id FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );
    
    if (!calculation) {
      return res.status(404).json({
        error: 'Calculation not found',
        message: 'Calculation not found or you do not have permission to delete it'
      });
    }
    
    // Delete the calculation
    const result = await db.remove(
      'DELETE FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );
    
    if (result === 0) {
      return res.status(404).json({
        error: 'Calculation not found',
        message: 'Calculation not found or already deleted'
      });
    }
    
    res.json({
      message: 'Calculation deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete calculation',
      message: 'Internal server error while deleting calculation'
    });
  }
});

// Delete multiple calculations by IDs
router.delete('/history/bulk', authenticate, async (req, res) => {
  try {
    const { calculation_ids } = req.body;
    const userId = req.user.id;
    
    if (!calculation_ids || !Array.isArray(calculation_ids) || calculation_ids.length === 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'calculation_ids must be a non-empty array'
      });
    }
    
    // Validate all IDs are numbers
    const validIds = calculation_ids.filter(id => Number.isInteger(Number(id)));
    if (validIds.length !== calculation_ids.length) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'All calculation_ids must be valid integers'
      });
    }
    
    // Create placeholders for IN clause
    const placeholders = validIds.map(() => '?').join(',');
    
    // Delete calculations that belong to the user
    const result = await db.remove(
      `DELETE FROM calculations WHERE id IN (${placeholders}) AND user_id = ?`,
      [...validIds, userId]
    );
    
    res.json({
      message: `${result} calculation(s) deleted successfully`,
      deleted_count: result
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete calculations',
      message: 'Internal server error while deleting calculations'
    });
  }
});

module.exports = router;
