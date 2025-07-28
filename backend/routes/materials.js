
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const db = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { 
  validateMaterial, 
  validateLaborRate, 
  validatePagination, 
  validateId,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation');
const {
  resetAllTablesAutoIncrement,
  getAllTablesAutoIncrementStatus
} = require('../utils/autoIncrementReset');

// Get all materials
router.get('/', validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.q || '';
    const sort = req.query.sort || 'id';
    const order = req.query.order || 'ASC';
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ? OR supplier LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM materials ${whereClause}`;
    const totalCount = await db.getCount(countQuery, params);
    
    // Get materials with pagination
    const baseQuery = `SELECT * FROM materials ${whereClause}`;
    const query = db.buildPaginationQuery(baseQuery, page, limit, sort, order);
    const materials = await db.getMany(query, params);
    
    res.json({
      materials,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch materials',
      message: 'Internal server error while fetching materials'
    });
  }
});

// Get materials by job type
router.get('/job-type/:jobTypeId', [
  param('jobTypeId')
    .isInt({ min: 1 })
    .withMessage('Job type ID must be a positive integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    
    // Check if job type exists
    const jobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Get materials for this job type
    const rawMaterials = await db.getMany(`
      SELECT 
        m.*,
        jtm.quantity_per_unit,
        jtm.waste_factor,
        jtm.is_primary,
        (jtm.quantity_per_unit * (1 + jtm.waste_factor)) as total_quantity_per_unit,
        (jtm.quantity_per_unit * (1 + jtm.waste_factor) * m.price) as cost_per_unit
      FROM materials m
      JOIN job_type_materials jtm ON m.id = jtm.material_id
      WHERE jtm.job_type_id = ?
      ORDER BY jtm.is_primary DESC, m.name ASC
    `, [jobTypeId]);
    
    // Normalize waste factors for consistent display
    const materials = rawMaterials.map(material => {
      let normalizedWasteFactor = material.waste_factor || 0;
      
      // Normalize waste factor to decimal format (if > 1, assume it's in percentage format)
      if (normalizedWasteFactor > 1) {
        normalizedWasteFactor = normalizedWasteFactor / 100;
      }
      
      return {
        ...material,
        waste_factor: normalizedWasteFactor, // Always return normalized decimal value
        waste_factor_percentage: normalizedWasteFactor * 100 // Add percentage for display
      };
    });
    
    res.json({
      job_type: jobType,
      materials
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch materials',
      message: 'Internal server error while fetching materials for job type'
    });
  }
});

// Get single material
router.get('/:id', validateId, async (req, res) => {
  try {
    const materialId = req.params.id;
    
    const material = await db.getOne(
      'SELECT * FROM materials WHERE id = ?',
      [materialId]
    );
    
    if (!material) {
      return res.status(404).json({
        error: 'Material not found',
        message: 'Material not found'
      });
    }
    
    // Get job types that use this material
    const jobTypes = await db.getMany(`
      SELECT 
        jt.id,
        jt.name,
        jt.unit,
        jc.name as category_name,
        jtm.quantity_per_unit,
        jtm.waste_factor,
        jtm.is_primary
      FROM job_types jt
      JOIN job_categories jc ON jt.category_id = jc.id
      JOIN job_type_materials jtm ON jt.id = jtm.job_type_id
      WHERE jtm.material_id = ?
      ORDER BY jc.name, jt.name
    `, [materialId]);
    
    res.json({
      material: {
        ...material,
        used_in_job_types: jobTypes
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch material',
      message: 'Internal server error while fetching material'
    });
  }
});

// Create new material (public access)
router.post('/public', validateMaterial, async (req, res) => {
  try {
    const { 
      name, 
      unit, 
      price, 
      supplier, 
      description,
      // New conversion fields
      conversion_factor,
      base_unit,
      conversion_description,
      pieces_per_package,
      piece_dimensions,
      coverage_per_package
    } = req.body;
    
    // Check if material with same name and unit already exists
    const existingMaterial = await db.getOne(
      'SELECT id FROM materials WHERE name = ? AND unit = ?',
      [name, unit]
    );
    
    if (existingMaterial) {
      return res.status(409).json({
        error: 'Material already exists',
        message: 'A material with this name and unit combination already exists'
      });
    }
    
    // Insert new material with conversion fields
    const materialId = await db.insert(
      `INSERT INTO materials (
        name, unit, price, supplier, description,
        conversion_factor, base_unit, conversion_description,
        pieces_per_package, piece_dimensions, coverage_per_package
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        unit, 
        price, 
        supplier || null, 
        description || null,
        conversion_factor || 1.0,
        base_unit || unit,
        conversion_description || null,
        pieces_per_package || null,
        piece_dimensions || null,
        coverage_per_package || null
      ]
    );
    
    // Get created material
    const newMaterial = await db.getOne(
      'SELECT * FROM materials WHERE id = ?',
      [materialId]
    );
    
    res.status(201).json({
      message: 'Material created successfully',
      material: newMaterial
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create material',
      message: 'Internal server error while creating material'
    });
  }
});

// Create new material (no authentication required)
router.post('/', validateMaterial, async (req, res) => {
  try {
    const { 
      name, 
      unit, 
      price, 
      supplier, 
      description,
      conversion_factor,
      base_unit,
      conversion_description,
      pieces_per_unit,
      piece_dimensions,
      coverage_per_unit,
      // New fields for enhanced conversion
      material_type,
      brick_length,
      brick_width,
      brick_height,
      mortar_thickness,
      wall_thickness,
      waste_factor
    } = req.body;
    
    // Check if material with same name and unit already exists
    const existingMaterial = await db.getOne(
      'SELECT id FROM materials WHERE name = ? AND unit = ?',
      [name, unit]
    );
    
    if (existingMaterial) {
      return res.status(409).json({
        error: 'Material already exists',
        message: 'A material with this name and unit combination already exists'
      });
    }
    
    // Insert new material with all conversion fields
    const materialId = await db.insert(
      `INSERT INTO materials (
        name, unit, price, supplier, description,
        conversion_factor, base_unit, conversion_description,
        pieces_per_unit, piece_dimensions, coverage_per_unit,
        material_type, brick_length, brick_width, brick_height,
        mortar_thickness, wall_thickness, waste_factor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        unit, 
        price, 
        supplier || null, 
        description || null,
        conversion_factor || 1.0,
        base_unit || null,
        conversion_description || null,
        pieces_per_unit || null,
        piece_dimensions || null,
        coverage_per_unit || null,
        material_type || null,
        brick_length || null,
        brick_width || null,
        brick_height || null,
        mortar_thickness || 10,
        wall_thickness || 150,
        waste_factor || 0.0
      ]
    );
    
    // Get created material
    const newMaterial = await db.getOne(
      'SELECT * FROM materials WHERE id = ?',
      [materialId]
    );
    
    res.status(201).json({
      message: 'Material created successfully',
      material: newMaterial
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create material',
      message: 'Internal server error while creating material'
    });
  }
});

// Update material (no authentication required)
router.put('/:id', validateId, validateMaterial, async (req, res) => {
  try {
    const materialId = req.params.id;
    const { 
      name, 
      unit, 
      price, 
      supplier, 
      description,
      conversion_factor,
      base_unit,
      conversion_description,
      pieces_per_unit,
      piece_dimensions,
      coverage_per_unit,
      // New fields for enhanced conversion
      material_type,
      brick_length,
      brick_width,
      brick_height,
      mortar_thickness,
      wall_thickness,
      waste_factor
    } = req.body;
    
    // Check if material exists
    const existingMaterial = await db.getOne(
      'SELECT * FROM materials WHERE id = ?',
      [materialId]
    );
    
    if (!existingMaterial) {
      return res.status(404).json({
        error: 'Material not found',
        message: 'Material not found'
      });
    }
    
    // Check if name or unit is being changed and if the combination already exists
    if (name !== existingMaterial.name || unit !== existingMaterial.unit) {
      const duplicateNameUnit = await db.getOne(
        'SELECT id FROM materials WHERE name = ? AND unit = ? AND id != ?',
        [name, unit, materialId]
      );
      
      if (duplicateNameUnit) {
        return res.status(409).json({
          error: 'Material combination already exists',
          message: 'Another material with this name and unit combination already exists'
        });
      }
    }
    
    // Update material with all conversion fields
    const affectedRows = await db.update(
      `UPDATE materials SET 
        name = ?, 
        unit = ?, 
        price = ?, 
        supplier = ?, 
        description = ?,
        conversion_factor = ?,
        base_unit = ?,
        conversion_description = ?,
        pieces_per_unit = ?,
        piece_dimensions = ?,
        coverage_per_unit = ?,
        material_type = ?,
        brick_length = ?,
        brick_width = ?,
        brick_height = ?,
        mortar_thickness = ?,
        wall_thickness = ?,
        waste_factor = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        name, 
        unit, 
        price, 
        supplier || null, 
        description || null,
        conversion_factor || 1.0,
        base_unit || null,
        conversion_description || null,
        pieces_per_unit || null,
        piece_dimensions || null,
        coverage_per_unit || null,
        material_type || null,
        brick_length || null,
        brick_width || null,
        brick_height || null,
        mortar_thickness || 10,
        wall_thickness || 150,
        waste_factor || 0.0,
        materialId
      ]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Material not found',
        message: 'Material not found'
      });
    }
    
    // Get updated material
    const updatedMaterial = await db.getOne(
      'SELECT * FROM materials WHERE id = ?',
      [materialId]
    );
    
    res.json({
      message: 'Material updated successfully',
      material: updatedMaterial
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update material',
      message: 'Internal server error while updating material'
    });
  }
});

// Delete material (no authentication required)
router.delete('/:id', validateId, async (req, res) => {
  try {
    const materialId = req.params.id;
    
    // Check if material is used in job types
    const usageCount = await db.getOne(
      'SELECT COUNT(*) as count FROM job_type_materials WHERE material_id = ?',
      [materialId]
    );
    
    if (usageCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot delete material',
        message: 'Material is used in job types. Remove from job types first.'
      });
    }
    
    // Delete material
    const affectedRows = await db.remove(
      'DELETE FROM materials WHERE id = ?',
      [materialId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Material not found',
        message: 'Material not found'
      });
    }
    
    res.json({
      message: 'Material deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete material',
      message: 'Internal server error while deleting material'
    });
  }
});

// Get all labor rates
router.get('/labor/rates', validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.q || '';
    const sort = req.query.sort || 'worker_type';
    const order = req.query.order || 'ASC';
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE worker_type LIKE ? OR skill_level LIKE ? OR location LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM labor_rates ${whereClause}`;
    const totalCount = await db.getCount(countQuery, params);
    
    // Get labor rates with pagination
    const baseQuery = `SELECT * FROM labor_rates ${whereClause}`;
    const query = db.buildPaginationQuery(baseQuery, page, limit, sort, order);
    const laborRates = await db.getMany(query, params);
    
    res.json({
      labor_rates: laborRates,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch labor rates',
      message: 'Internal server error while fetching labor rates'
    });
  }
});

// Get single labor rate
router.get('/labor/:id', validateId, async (req, res) => {
  try {
    const laborRateId = req.params.id;
    
    const laborRate = await db.getOne(
      'SELECT * FROM labor_rates WHERE id = ?',
      [laborRateId]
    );
    
    if (!laborRate) {
      return res.status(404).json({
        error: 'Labor rate not found',
        message: 'Labor rate not found'
      });
    }
    
    res.json({
      labor_rate: laborRate
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch labor rate',
      message: 'Internal server error while fetching labor rate'
    });
  }
});

// Create new labor rate (admin only)
router.post('/labor', authenticate, adminOnly, validateLaborRate, async (req, res) => {
  try {
    const { worker_type, daily_rate, skill_level, location } = req.body;
    
    // Check if similar labor rate already exists
    const existingRate = await db.getOne(
      'SELECT id FROM labor_rates WHERE worker_type = ? AND skill_level = ? AND location = ?',
      [worker_type, skill_level || 'standard', location || 'general']
    );
    
    if (existingRate) {
      return res.status(409).json({
        error: 'Labor rate already exists',
        message: 'A similar labor rate already exists'
      });
    }
    
    // Insert new labor rate
    const laborRateId = await db.insert(
      'INSERT INTO labor_rates (worker_type, daily_rate, skill_level, location) VALUES (?, ?, ?, ?)',
      [worker_type, daily_rate, skill_level || 'standard', location || 'general']
    );
    
    // Get created labor rate
    const newLaborRate = await db.getOne(
      'SELECT * FROM labor_rates WHERE id = ?',
      [laborRateId]
    );
    
    res.status(201).json({
      message: 'Labor rate created successfully',
      labor_rate: newLaborRate
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create labor rate',
      message: 'Internal server error while creating labor rate'
    });
  }
});

// Update labor rate (admin only)
router.put('/labor/:id', authenticate, adminOnly, validateId, validateLaborRate, async (req, res) => {
  try {
    const laborRateId = req.params.id;
    const { worker_type, daily_rate, skill_level, location } = req.body;
    
    // Check if labor rate exists
    const existingRate = await db.getOne(
      'SELECT * FROM labor_rates WHERE id = ?',
      [laborRateId]
    );
    
    if (!existingRate) {
      return res.status(404).json({
        error: 'Labor rate not found',
        message: 'Labor rate not found'
      });
    }
    
    // Update labor rate
    const affectedRows = await db.update(
      'UPDATE labor_rates SET worker_type = ?, daily_rate = ?, skill_level = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [worker_type, daily_rate, skill_level || 'standard', location || 'general', laborRateId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Labor rate not found',
        message: 'Labor rate not found'
      });
    }
    
    // Get updated labor rate
    const updatedLaborRate = await db.getOne(
      'SELECT * FROM labor_rates WHERE id = ?',
      [laborRateId]
    );
    
    res.json({
      message: 'Labor rate updated successfully',
      labor_rate: updatedLaborRate
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update labor rate',
      message: 'Internal server error while updating labor rate'
    });
  }
});

// Delete labor rate (admin only)
router.delete('/labor/:id', authenticate, adminOnly, validateId, async (req, res) => {
  try {
    const laborRateId = req.params.id;
    
    // Delete labor rate
    const affectedRows = await db.remove(
      'DELETE FROM labor_rates WHERE id = ?',
      [laborRateId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Labor rate not found',
        message: 'Labor rate not found'
      });
    }
    
    res.json({
      message: 'Labor rate deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete labor rate',
      message: 'Internal server error while deleting labor rate'
    });
  }
});

// Bulk import materials (no authentication required)
router.post('/bulk-import', async (req, res) => {
  try {
    const { materials_data, update_existing = false } = req.body;
    
    if (!materials_data || !Array.isArray(materials_data)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'materials_data must be an array'
      });
    }
    
    // Check if database is empty and reset AUTO_INCREMENT if needed
    const materialCount = await db.getOne('SELECT COUNT(*) as count FROM materials');
    const shouldResetAutoIncrement = materialCount.count === 0;
    
    if (shouldResetAutoIncrement) {
      await db.execute('ALTER TABLE materials AUTO_INCREMENT = 1');
    }
    
    const results = {
      success: [],
      errors: [],
      updated: [],
      skipped: []
    };
    
    for (let i = 0; i < materials_data.length; i++) {
      const materialData = materials_data[i];
      const rowNumber = i + 1;
      
      try {
        // Validate required fields
        if (!materialData.name || !materialData.unit || !materialData.price) {
          results.errors.push({
            row: rowNumber,
            data: materialData,
            error: 'Missing required fields (name, unit, price)'
          });
          continue;
        }
        
        // Clean and validate data
        const rawPrice = String(materialData.price);
        const cleanedPrice = rawPrice.replace(/[^\d.-]/g, '');
        const numericPrice = parseFloat(cleanedPrice);
        
        // Debug logging
        
        const cleanData = {
          name: String(materialData.name).trim(),
          unit: String(materialData.unit).trim(),
          price: numericPrice,
          supplier: materialData.supplier ? String(materialData.supplier).trim() : null,
          description: materialData.description ? String(materialData.description).trim() : null
        };
        
        // Validate price
        if (isNaN(cleanData.price) || cleanData.price <= 0) {
          results.errors.push({
            row: rowNumber,
            data: materialData,
            error: 'Invalid price format'
          });
          continue;
        }
        
        // Check if material with same name and unit already exists
        const existingMaterial = await db.getOne(
          'SELECT id, name, unit, price, supplier FROM materials WHERE name = ? AND unit = ?',
          [cleanData.name, cleanData.unit]
        );
        
        if (existingMaterial) {
          if (update_existing) {
            // Update existing material
            await db.update(
              'UPDATE materials SET price = ?, supplier = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [cleanData.price, cleanData.supplier, cleanData.description, existingMaterial.id]
            );
            
            results.updated.push({
              row: rowNumber,
              material_id: existingMaterial.id,
              name: cleanData.name,
              unit: cleanData.unit,
              old_price: existingMaterial.price,
              new_price: cleanData.price
            });
          } else {
            // Skip existing material
            results.skipped.push({
              row: rowNumber,
              name: cleanData.name,
              unit: cleanData.unit,
              reason: 'Material with same name and unit already exists'
            });
          }
        } else {
          // Insert new material
          const materialId = await db.insert(
            'INSERT INTO materials (name, unit, price, supplier, description) VALUES (?, ?, ?, ?, ?)',
            [cleanData.name, cleanData.unit, cleanData.price, cleanData.supplier, cleanData.description]
          );
          
          results.success.push({
            row: rowNumber,
            material_id: materialId,
            name: cleanData.name,
            unit: cleanData.unit,
            price: cleanData.price
          });
        }
        
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: materialData,
          error: error.message
        });
      }
    }
    
    // Enhanced response with detailed debugging info
    
    if (results.errors.length > 0) {
      results.errors.forEach(error => {
      });
    }
    
    if (results.skipped.length > 0) {
      results.skipped.forEach(skipped => {
      });
    }

    res.json({
      message: 'Bulk import completed',
      summary: {
        total_processed: materials_data.length,
        successful_imports: results.success.length,
        updates: results.updated.length,
        errors: results.errors.length,
        skipped: results.skipped.length,
        total_saved: results.success.length + results.updated.length,
        auto_increment_reset: shouldResetAutoIncrement
      },
      results,
      debug_info: {
        received_count: materials_data.length,
        processed_count: results.success.length + results.updated.length + results.errors.length + results.skipped.length,
        saved_count: results.success.length + results.updated.length,
        database_was_empty: shouldResetAutoIncrement
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to import materials',
      message: 'Internal server error during bulk import'
    });
  }
});

// Parse pasted data from Excel/CSV format (no authentication required)
router.post('/parse-paste', async (req, res) => {
  try {
    const { pasted_data } = req.body;
    
    if (!pasted_data || typeof pasted_data !== 'string') {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'pasted_data must be a string'
      });
    }
    
    const lines = pasted_data.trim().split('\n');
    const parsedMaterials = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const rowNumber = i + 1;
      
      // Split by tab or comma (Excel copy-paste usually uses tabs)
      let columns = line.split('\t');
      if (columns.length === 1) {
        columns = line.split(',');
      }
      
      // Expected format: NO. | NAMA BARANG | QTY | SATUAN | HARGA
      // We'll be flexible with column count
      if (columns.length < 3) {
        errors.push({
          row: rowNumber,
          line: line,
          error: 'Insufficient columns (minimum: name, unit, price)'
        });
        continue;
      }
      
      try {
        let name, unit, price, qty, supplier;
        
        if (columns.length >= 5) {
          // Full format: NO. | NAMA BARANG | QTY | SATUAN | HARGA
          const [no, namaBarang, qtyCol, satuanCol, hargaCol] = columns;
          name = namaBarang;
          unit = satuanCol;
          price = hargaCol;
          qty = qtyCol;
        } else if (columns.length === 4) {
          // Format: NAMA BARANG | QTY | SATUAN | HARGA
          const [namaBarang, qtyCol, satuanCol, hargaCol] = columns;
          name = namaBarang;
          unit = satuanCol;
          price = hargaCol;
          qty = qtyCol;
        } else if (columns.length === 3) {
          // Format: NAMA BARANG | SATUAN | HARGA
          const [namaBarang, satuanCol, hargaCol] = columns;
          name = namaBarang;
          unit = satuanCol;
          price = hargaCol;
        }
        
        // Clean the data
        name = name ? name.trim() : '';
        unit = unit ? unit.trim() : '';
        price = price ? price.trim() : '';
        
        if (!name || !unit || !price) {
          errors.push({
            row: rowNumber,
            line: line,
            error: 'Missing required data (name, unit, or price)'
          });
          continue;
        }
        
        // Clean price (remove currency symbols, commas, etc.)
        const cleanPrice = price.replace(/[^\d.-]/g, '');
        const numericPrice = parseFloat(cleanPrice);
        
        if (isNaN(numericPrice) || numericPrice <= 0) {
          errors.push({
            row: rowNumber,
            line: line,
            error: `Invalid price format: ${price}`
          });
          continue;
        }
        
        parsedMaterials.push({
          name: name,
          unit: unit,
          price: numericPrice,
          supplier: supplier || null,
          description: qty ? `Qty: ${qty}` : null
        });
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          line: line,
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Data parsed successfully',
      summary: {
        total_lines: lines.length,
        parsed_materials: parsedMaterials.length,
        errors: errors.length
      },
      parsed_materials: parsedMaterials,
      errors: errors
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to parse data',
      message: 'Internal server error while parsing pasted data'
    });
  }
});

// Add material to job type (admin only)
router.post('/job-type/:jobTypeId/materials', authenticate, adminOnly, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    const { material_id, quantity_per_unit, waste_factor, is_primary } = req.body;
    
    // Validate input
    if (!material_id || !quantity_per_unit) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Material ID and quantity per unit are required'
      });
    }
    
    // Check if job type exists
    const jobType = await db.getOne(
      'SELECT id FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Check if material exists
    const material = await db.getOne(
      'SELECT id FROM materials WHERE id = ?',
      [material_id]
    );
    
    if (!material) {
      return res.status(404).json({
        error: 'Material not found',
        message: 'Material not found'
      });
    }
    
    // Check if relationship already exists
    const existingRelation = await db.getOne(
      'SELECT id FROM job_type_materials WHERE job_type_id = ? AND material_id = ?',
      [jobTypeId, material_id]
    );
    
    if (existingRelation) {
      return res.status(409).json({
        error: 'Material already added',
        message: 'This material is already added to this job type'
      });
    }
    
    // Insert new relationship
    const relationId = await db.insert(
      'INSERT INTO job_type_materials (job_type_id, material_id, quantity_per_unit, waste_factor, is_primary) VALUES (?, ?, ?, ?, ?)',
      [jobTypeId, material_id, quantity_per_unit, waste_factor || 0, is_primary || false]
    );
    
    // Get created relationship with material info
    const newRelation = await db.getOne(`
      SELECT 
        jtm.*,
        m.name as material_name,
        m.unit as material_unit,
        m.price as material_price
      FROM job_type_materials jtm
      JOIN materials m ON jtm.material_id = m.id
      WHERE jtm.id = ?
    `, [relationId]);
    
    res.status(201).json({
      message: 'Material added to job type successfully',
      relation: newRelation
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add material to job type',
      message: 'Internal server error while adding material to job type'
    });
  }
});

// Remove material from job type (admin only)
router.delete('/job-type/:jobTypeId/materials/:materialId', authenticate, adminOnly, async (req, res) => {
  try {
    const { jobTypeId, materialId } = req.params;
    
    // Delete relationship
    const affectedRows = await db.remove(
      'DELETE FROM job_type_materials WHERE job_type_id = ? AND material_id = ?',
      [jobTypeId, materialId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Relationship not found',
        message: 'Material is not associated with this job type'
      });
    }
    
    res.json({
      message: 'Material removed from job type successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove material from job type',
      message: 'Internal server error while removing material from job type'
    });
  }
});

// Reset AUTO_INCREMENT counter (admin only)
router.post('/reset-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    // Reset AUTO_INCREMENT counter to 1
    await db.execute('ALTER TABLE materials AUTO_INCREMENT = 1');
    
    res.json({
      message: 'AUTO_INCREMENT counter reset successfully',
      info: 'Next inserted material will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT',
      message: 'Internal server error while resetting AUTO_INCREMENT counter'
    });
  }
});

// Reset AUTO_INCREMENT counter (no authentication - for bulk import)
router.post('/reset-auto-increment-bulk', async (req, res) => {
  try {
    // Check if database is empty first
    const materialCount = await db.getOne('SELECT COUNT(*) as count FROM materials');
    
    if (materialCount.count > 0) {
      return res.status(400).json({
        error: 'Database not empty',
        message: 'Cannot reset AUTO_INCREMENT when materials exist'
      });
    }
    
    // Reset AUTO_INCREMENT counter to 1
    await db.execute('ALTER TABLE materials AUTO_INCREMENT = 1');
    
    res.json({
      message: 'AUTO_INCREMENT counter reset successfully for bulk import',
      info: 'Next inserted material will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT',
      message: 'Internal server error while resetting AUTO_INCREMENT counter'
    });
  }
});

// Master AUTO_INCREMENT status for all tables (admin only)
router.get('/master/auto-increment-status', authenticate, adminOnly, async (req, res) => {
  try {
    const { 
      getAllTablesAutoIncrementStatus,
      isTableEmpty,
      getCurrentAutoIncrement
    } = require('../utils/autoIncrementReset');
    
    // Get status for all tables
    const tablesStatus = await getAllTablesAutoIncrementStatus();
    
    // Process status into summary
    let totalTables = 0;
    let emptyTables = 0;
    let tablesNeedingReset = 0;
    let tablesWithData = 0;
    
    const processedStatus = {};
    
    for (const tableInfo of tablesStatus) {
      if (tableInfo.error) {
        processedStatus[tableInfo.table] = {
          error: tableInfo.error,
          row_count: 0,
          auto_increment: 1,
          is_empty: true,
          needs_reset: false
        };
      } else {
        processedStatus[tableInfo.table] = {
          row_count: tableInfo.row_count,
          auto_increment: tableInfo.current_auto_increment || 1,
          is_empty: tableInfo.is_empty,
          needs_reset: tableInfo.needs_reset
        };
        
        totalTables++;
        
        if (tableInfo.is_empty) {
          emptyTables++;
        } else {
          tablesWithData++;
        }
        
        if (tableInfo.needs_reset) {
          tablesNeedingReset++;
        }
      }
    }
    
    res.json({
      message: 'Master AUTO_INCREMENT status retrieved successfully',
      summary: {
        total_tables: totalTables,
        empty_tables: emptyTables,
        tables_needing_reset: tablesNeedingReset,
        tables_with_data: tablesWithData
      },
      tables: processedStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get master AUTO_INCREMENT status',
      message: 'Internal server error while getting status'
    });
  }
});

// Master reset all AUTO_INCREMENT counters (admin only)
router.post('/master/reset-all-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    const { resetAllTablesAutoIncrement } = require('../utils/autoIncrementReset');
    const { only_empty = true, force_reset = false } = req.body;
    
    
    // Use the utility function to reset all tables
    const results = await resetAllTablesAutoIncrement(!force_reset, 1);
    
    
    res.json({
      message: 'Master AUTO_INCREMENT reset completed',
      summary: {
        total_tables: results.success.length + results.skipped.length + results.errors.length,
        successful_resets: results.success.length,
        skipped_tables: results.skipped.length,
        errors: results.errors.length,
        only_empty_tables: !force_reset,
        force_reset: force_reset
      },
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT counters',
      message: 'Internal server error during master reset'
    });
  }
});

// Master clear all data and reset (admin only) - DANGEROUS
router.delete('/master/clear-all-data', authenticate, adminOnly, async (req, res) => {
  try {
    const { confirm_clear = false } = req.body;
    
    if (!confirm_clear) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'This operation will delete ALL data. Set confirm_clear: true to proceed.',
        warning: 'This action cannot be undone!'
      });
    }
    
    
    const results = {
      cleared: [],
      errors: [],
      preserved: []
    };
    
    // Clear tables in order (respecting foreign key constraints)
    const clearOrder = [
      'calculations',
      'job_type_materials', 
      'job_types',
      'job_categories',
      'materials',
      'labor_rates'
      // Note: users table handled separately to preserve admin
    ];
    
    // Clear tables
    for (const table of clearOrder) {
      try {
        const deletedCount = await db.remove(`DELETE FROM ${table}`);
        await db.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        
        results.cleared.push({
          table: table,
          deleted_rows: deletedCount,
          auto_increment_reset: true
        });
        
      } catch (error) {
        results.errors.push({
          table: table,
          error: error.message
        });
      }
    }
    
    // Handle users table - preserve admin users
    try {
      const adminUsers = await db.getMany('SELECT id, username FROM users WHERE role = ?', ['admin']);
      const deletedUsers = await db.remove('DELETE FROM users WHERE role != ?', ['admin']);
      
      // Only reset AUTO_INCREMENT if no admin users exist
      if (adminUsers.length === 0) {
        await db.execute('ALTER TABLE users AUTO_INCREMENT = 1');
      }
      
      results.preserved.push({
        table: 'users',
        preserved_admins: adminUsers.length,
        deleted_regular_users: deletedUsers,
        admin_users: adminUsers.map(u => u.username)
      });
      
    } catch (error) {
      results.errors.push({
        table: 'users',
        error: error.message
      });
    }
    
    
    res.json({
      message: 'Master clear all data completed',
      warning: 'All data has been deleted except admin users',
      summary: {
        cleared_tables: results.cleared.length,
        preserved_tables: results.preserved.length,
        errors: results.errors.length,
        total_tables_processed: clearOrder.length + 1
      },
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear all data',
      message: 'Internal server error during master clear operation'
    });
  }
});

// Clear all materials and reset counter (admin only)
router.delete('/clear-all', authenticate, adminOnly, async (req, res) => {
  try {
    // Check if any materials are used in job types
    const usageCount = await db.getOne(
      'SELECT COUNT(*) as count FROM job_type_materials'
    );
    
    if (usageCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot clear materials',
        message: 'Some materials are used in job types. Remove from job types first.',
        used_count: usageCount.count
      });
    }
    
    // Delete all materials
    const deletedCount = await db.remove('DELETE FROM materials');
    
    // Reset AUTO_INCREMENT counter
    await db.execute('ALTER TABLE materials AUTO_INCREMENT = 1');
    
    res.json({
      message: 'All materials cleared and AUTO_INCREMENT reset successfully',
      deleted_count: deletedCount,
      info: 'Next inserted material will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear materials',
      message: 'Internal server error while clearing materials'
    });
  }
});

// Master reset - Reset AUTO_INCREMENT for all tables (admin only)
router.post('/master/reset-all-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    const { force_reset = false, only_empty = true } = req.body;
    
    
    // Reset all tables
    const results = await resetAllTablesAutoIncrement(!force_reset && only_empty, 1);
    
    
    res.json({
      message: 'Master AUTO_INCREMENT reset completed',
      summary: {
        total_tables: results.success.length + results.skipped.length + results.errors.length,
        successful_resets: results.success.length,
        skipped_tables: results.skipped.length,
        errors: results.errors.length
      },
      results,
      info: 'All applicable tables have been reset to AUTO_INCREMENT = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT for all tables',
      message: 'Internal server error during master reset operation'
    });
  }
});

// Get AUTO_INCREMENT status for all tables (admin only)
router.get('/master/auto-increment-status', authenticate, adminOnly, async (req, res) => {
  try {
    const status = await getAllTablesAutoIncrementStatus();
    
    const summary = {
      total_tables: status.length,
      empty_tables: status.filter(s => s.is_empty).length,
      tables_needing_reset: status.filter(s => s.needs_reset).length,
      tables_with_data: status.filter(s => !s.is_empty).length
    };
    
    res.json({
      message: 'AUTO_INCREMENT status retrieved for all tables',
      summary,
      tables: status
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get AUTO_INCREMENT status',
      message: 'Internal server error while getting AUTO_INCREMENT status for all tables'
    });
  }
});

// Master clear - Clear all data and reset AUTO_INCREMENT (admin only) - DANGEROUS!
router.delete('/master/clear-all-data', authenticate, adminOnly, async (req, res) => {
  try {
    const { confirm_clear = false } = req.body;
    
    if (!confirm_clear) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'This operation will delete ALL data from ALL tables. Set confirm_clear: true to proceed.',
        warning: 'THIS ACTION CANNOT BE UNDONE!'
      });
    }
    
    
    const results = {
      cleared_tables: [],
      errors: []
    };
    
    // Clear tables in reverse dependency order to avoid foreign key constraints
    const tablesToClear = [
      'calculations',
      'job_type_materials', 
      'job_types',
      'job_categories',
      'materials',
      'labor_rates'
      // Note: We don't clear users table to preserve admin access
    ];
    
    for (const tableName of tablesToClear) {
      try {
        const deletedCount = await db.remove(`DELETE FROM ${tableName}`);
        await db.execute(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
        
        results.cleared_tables.push({
          table: tableName,
          deleted_count: deletedCount,
          auto_increment_reset: true
        });
        
      } catch (error) {
        results.errors.push({
          table: tableName,
          error: error.message
        });
      }
    }
    
    
    res.json({
      message: 'Master clear operation completed',
      warning: 'ALL DATA HAS BEEN DELETED (except users)',
      summary: {
        tables_cleared: results.cleared_tables.length,
        total_rows_deleted: results.cleared_tables.reduce((sum, t) => sum + t.deleted_count, 0),
        errors: results.errors.length
      },
      results,
      info: 'All tables have been cleared and AUTO_INCREMENT reset to 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear all data',
      message: 'Internal server error during master clear operation'
    });
  }
});

module.exports = router;
