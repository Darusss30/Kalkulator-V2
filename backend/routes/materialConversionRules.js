const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult, query } = require('express-validator');

// Get all conversion rules with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ max: 100 }),
  query('material_type').optional().isLength({ max: 20 }),
  query('active_only').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const materialType = req.query.material_type || '';
    const activeOnly = req.query.active_only === 'true';

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push('(rule_name LIKE ? OR material_pattern LIKE ? OR unit_pattern LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (materialType) {
      whereConditions.push('material_type = ?');
      queryParams.push(materialType);
    }

    if (activeOnly) {
      whereConditions.push('is_active = TRUE');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM material_conversion_rules 
      ${whereClause}
    `;
    const countResult = await db.getMany(countQuery, queryParams);
    const total = countResult[0].total;

    // Get rules with pagination
    const rulesQuery = `
      SELECT 
        id,
        rule_name,
        material_pattern,
        unit_pattern,
        conversion_factor,
        base_unit,
        conversion_description,
        material_type,
        conversion_data,
        job_category_pattern,
        priority,
        is_active,
        notes,
        created_at,
        updated_at
      FROM material_conversion_rules 
      ${whereClause}
      ORDER BY priority ASC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const rules = await db.getMany(rulesQuery, [...queryParams, limit, offset]);

    // Parse JSON data
    const processedRules = rules.map(rule => ({
      ...rule,
      conversion_data: rule.conversion_data ? JSON.parse(rule.conversion_data) : null
    }));

    res.json({
      success: true,
      data: {
        rules: processedRules,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversion rules:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversion presets
router.get('/presets', [
  query('category').optional().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const category = req.query.category || '';

    let whereClause = 'WHERE is_active = TRUE';
    let queryParams = [];

    if (category) {
      whereClause += ' AND category = ?';
      queryParams.push(category);
    }

    const presetsQuery = `
      SELECT 
        id,
        preset_name,
        category,
        description,
        conversion_factor,
        base_unit,
        conversion_description,
        material_type,
        preset_data,
        usage_count
      FROM material_conversion_presets 
      ${whereClause}
      ORDER BY category, usage_count DESC
    `;

    const presets = await db.getMany(presetsQuery, queryParams);

    // Parse JSON data
    const processedPresets = presets.map(preset => ({
      ...preset,
      preset_data: preset.preset_data ? JSON.parse(preset.preset_data) : null
    }));

    res.json({
      success: true,
      data: {
        presets: processedPresets
      }
    });

  } catch (error) {
    console.error('Error fetching conversion presets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new conversion rule
router.post('/', [
  body('rule_name').isLength({ min: 1, max: 100 }).withMessage('Rule name is required (max 100 chars)'),
  body('material_pattern').isLength({ min: 1, max: 100 }).withMessage('Material pattern is required (max 100 chars)'),
  body('unit_pattern').isLength({ min: 1, max: 50 }).withMessage('Unit pattern is required (max 50 chars)'),
  body('conversion_factor').isFloat({ min: 0.0001 }).withMessage('Conversion factor must be a positive number'),
  body('base_unit').isLength({ min: 1, max: 20 }).withMessage('Base unit is required (max 20 chars)'),
  body('conversion_description').isLength({ min: 1, max: 500 }).withMessage('Conversion description is required (max 500 chars)'),
  body('material_type').optional().isLength({ max: 20 }),
  body('job_category_pattern').optional().isLength({ max: 100 }),
  body('priority').optional().isInt({ min: 1, max: 1000 }),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      rule_name,
      material_pattern,
      unit_pattern,
      conversion_factor,
      base_unit,
      conversion_description,
      material_type,
      conversion_data,
      job_category_pattern,
      priority,
      notes
    } = req.body;

    const insertQuery = `
      INSERT INTO material_conversion_rules (
        rule_name,
        material_pattern,
        unit_pattern,
        conversion_factor,
        base_unit,
        conversion_description,
        material_type,
        conversion_data,
        job_category_pattern,
        priority,
        notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const ruleId = await db.insert(insertQuery, [
      rule_name,
      material_pattern,
      unit_pattern,
      parseFloat(conversion_factor),
      base_unit,
      conversion_description,
      material_type || null,
      conversion_data ? JSON.stringify(conversion_data) : null,
      job_category_pattern || null,
      priority || 100,
      notes || null,
      req.user?.id || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Conversion rule created successfully',
      data: {
        id: ruleId
      }
    });

  } catch (error) {
    console.error('Error creating conversion rule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update conversion rule
router.put('/:id', [
  body('rule_name').isLength({ min: 1, max: 100 }).withMessage('Rule name is required (max 100 chars)'),
  body('material_pattern').isLength({ min: 1, max: 100 }).withMessage('Material pattern is required (max 100 chars)'),
  body('unit_pattern').isLength({ min: 1, max: 50 }).withMessage('Unit pattern is required (max 50 chars)'),
  body('conversion_factor').isFloat({ min: 0.0001 }).withMessage('Conversion factor must be a positive number'),
  body('base_unit').isLength({ min: 1, max: 20 }).withMessage('Base unit is required (max 20 chars)'),
  body('conversion_description').isLength({ min: 1, max: 500 }).withMessage('Conversion description is required (max 500 chars)'),
  body('material_type').optional().isLength({ max: 20 }),
  body('job_category_pattern').optional().isLength({ max: 100 }),
  body('priority').optional().isInt({ min: 1, max: 1000 }),
  body('is_active').optional().isBoolean(),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const ruleId = req.params.id;
    const {
      rule_name,
      material_pattern,
      unit_pattern,
      conversion_factor,
      base_unit,
      conversion_description,
      material_type,
      conversion_data,
      job_category_pattern,
      priority,
      is_active,
      notes
    } = req.body;

    const updateQuery = `
      UPDATE material_conversion_rules SET
        rule_name = ?,
        material_pattern = ?,
        unit_pattern = ?,
        conversion_factor = ?,
        base_unit = ?,
        conversion_description = ?,
        material_type = ?,
        conversion_data = ?,
        job_category_pattern = ?,
        priority = ?,
        is_active = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const affectedRows = await db.update(updateQuery, [
      rule_name,
      material_pattern,
      unit_pattern,
      parseFloat(conversion_factor),
      base_unit,
      conversion_description,
      material_type || null,
      conversion_data ? JSON.stringify(conversion_data) : null,
      job_category_pattern || null,
      priority || 100,
      is_active !== undefined ? is_active : true,
      notes || null,
      ruleId
    ]);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversion rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversion rule updated successfully'
    });

  } catch (error) {
    console.error('Error updating conversion rule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete conversion rule
router.delete('/:id', async (req, res) => {
  try {
    const ruleId = req.params.id;

    const deleteQuery = 'DELETE FROM material_conversion_rules WHERE id = ?';
    const affectedRows = await db.remove(deleteQuery, [ruleId]);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversion rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversion rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversion rule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversion suggestions for material and unit
router.post('/suggest', [
  body('material_name').isLength({ min: 1, max: 100 }).withMessage('Material name is required'),
  body('unit').isLength({ min: 1, max: 50 }).withMessage('Unit is required'),
  body('job_type_name').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { material_name, unit, job_type_name } = req.body;

    // Get matching conversion rules
    const rulesQuery = `
      SELECT 
        id,
        rule_name,
        material_pattern,
        unit_pattern,
        conversion_factor,
        base_unit,
        conversion_description,
        material_type,
        conversion_data,
        priority
      FROM material_conversion_rules 
      WHERE is_active = TRUE
      ORDER BY priority ASC
    `;

    const rules = await db.getMany(rulesQuery);

    // Find matching rules
    const matchingRules = [];
    
    for (const rule of rules) {
      const materialMatch = new RegExp(rule.material_pattern, 'i').test(material_name);
      const unitMatch = new RegExp(rule.unit_pattern, 'i').test(unit);
      
      if (materialMatch && unitMatch) {
        matchingRules.push({
          ...rule,
          conversion_data: rule.conversion_data ? JSON.parse(rule.conversion_data) : null
        });
      }
    }

    // If no exact match, try partial matches
    if (matchingRules.length === 0) {
      for (const rule of rules) {
        const materialPartialMatch = material_name.toLowerCase().includes(rule.material_pattern.toLowerCase()) ||
                                   rule.material_pattern.toLowerCase().includes(material_name.toLowerCase());
        const unitPartialMatch = unit.toLowerCase().includes(rule.unit_pattern.toLowerCase()) ||
                               rule.unit_pattern.toLowerCase().includes(unit.toLowerCase());
        
        if (materialPartialMatch && unitPartialMatch) {
          matchingRules.push({
            ...rule,
            conversion_data: rule.conversion_data ? JSON.parse(rule.conversion_data) : null,
            match_type: 'partial'
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        suggestions: matchingRules.slice(0, 5), // Return top 5 matches
        total_matches: matchingRules.length
      }
    });

  } catch (error) {
    console.error('Error getting conversion suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update preset usage count
router.post('/presets/:id/use', async (req, res) => {
  try {
    const presetId = req.params.id;

    const updateQuery = `
      UPDATE material_conversion_presets 
      SET usage_count = usage_count + 1 
      WHERE id = ? AND is_active = TRUE
    `;

    const affectedRows = await db.update(updateQuery, [presetId]);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found or inactive'
      });
    }

    res.json({
      success: true,
      message: 'Preset usage updated'
    });

  } catch (error) {
    console.error('Error updating preset usage:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
