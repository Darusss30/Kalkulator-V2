const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');
const { 
  validateJobCategory, 
  validateJobType, 
  validatePagination, 
  validateId,
  validateCategoryId,
  validateSearch 
} = require('../middleware/validation');
const {
  resetTableAutoIncrement,
  isTableEmpty,
  resetIfEmpty,
  getCurrentAutoIncrement,
  isValidTableName
} = require('../utils/autoIncrementReset');

// Get all job categories
router.get('/categories', validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.q || '';
    const sort = req.query.sort || 'id';
    const order = req.query.order || 'ASC';
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM job_categories ${whereClause}`;
    const totalCount = await db.getCount(countQuery, params);
    
    // Get categories with pagination
    const baseQuery = `SELECT * FROM job_categories ${whereClause}`;
    const query = db.buildPaginationQuery(baseQuery, page, limit, sort, order);
    const categories = await db.getMany(query, params);
    
    // Get job types count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const jobTypesCount = await db.getOne(
          'SELECT COUNT(*) as count FROM job_types WHERE category_id = ?',
          [category.id]
        );
        return {
          ...category,
          job_types_count: jobTypesCount.count
        };
      })
    );
    
    res.json({
      categories: categoriesWithCounts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'Internal server error while fetching job categories'
    });
  }
});

// Get single job category
router.get('/categories/:id', validateId, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const category = await db.getOne(
      'SELECT * FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Get job types for this category
    const jobTypes = await db.getMany(
      'SELECT * FROM job_types WHERE category_id = ? ORDER BY name ASC',
      [categoryId]
    );
    
    res.json({
      category: {
        ...category,
        job_types: jobTypes
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch category',
      message: 'Internal server error while fetching job category'
    });
  }
});

// Create new job category (no authentication required)
router.post('/categories', validateJobCategory, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    // Check if category name already exists
    const existingCategory = await db.getOne(
      'SELECT id FROM job_categories WHERE name = ?',
      [name]
    );
    
    if (existingCategory) {
      return res.status(409).json({
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }
    
    // Insert new category
    const categoryId = await db.insert(
      'INSERT INTO job_categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description || null, icon || null]
    );
    
    // Get created category
    const newCategory = await db.getOne(
      'SELECT * FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create category',
      message: 'Internal server error while creating job category'
    });
  }
});

// Update job category (no authentication required)
router.put('/categories/:id', validateId, validateJobCategory, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, icon } = req.body;
    
    // Check if category exists
    const existingCategory = await db.getOne(
      'SELECT * FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    if (!existingCategory) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Check if name is being changed and if it already exists
    if (name !== existingCategory.name) {
      const duplicateName = await db.getOne(
        'SELECT id FROM job_categories WHERE name = ? AND id != ?',
        [name, categoryId]
      );
      
      if (duplicateName) {
        return res.status(409).json({
          error: 'Category name already exists',
          message: 'Another category with this name already exists'
        });
      }
    }
    
    // Update category
    const affectedRows = await db.update(
      'UPDATE job_categories SET name = ?, description = ?, icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description || null, icon || null, categoryId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Get updated category
    const updatedCategory = await db.getOne(
      'SELECT * FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update category',
      message: 'Internal server error while updating job category'
    });
  }
});

// Delete job category (no authentication required)
router.delete('/categories/:id', validateId, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category has job types
    const jobTypesCount = await db.getOne(
      'SELECT COUNT(*) as count FROM job_types WHERE category_id = ?',
      [categoryId]
    );
    
    if (jobTypesCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot delete category',
        message: 'Category has associated job types. Delete job types first.'
      });
    }
    
    // Delete category
    const affectedRows = await db.remove(
      'DELETE FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    res.json({
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete category',
      message: 'Internal server error while deleting job category'
    });
  }
});

// Get job types by category
router.get('/types/:categoryId', validateCategoryId, validatePagination, validateSearch, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.q || '';
    const sort = req.query.sort || 'name';
    const order = req.query.order || 'ASC';
    
    // Check if category exists
    const category = await db.getOne(
      'SELECT * FROM job_categories WHERE id = ?',
      [categoryId]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    let whereClause = 'WHERE category_id = ?';
    let params = [categoryId];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM job_types ${whereClause}`;
    const totalCount = await db.getCount(countQuery, params);
    
    // Get job types with pagination
    const baseQuery = `SELECT * FROM job_types ${whereClause}`;
    const query = db.buildPaginationQuery(baseQuery, page, limit, sort, order);
    const jobTypes = await db.getMany(query, params);
    
    res.json({
      category,
      job_types: jobTypes,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch job types',
      message: 'Internal server error while fetching job types'
    });
  }
});

// Get single job type with materials
router.get('/type/:id', validateId, async (req, res) => {
  try {
    const jobTypeId = req.params.id;
    
    // Get job type with category info
    const jobType = await db.getOne(`
      SELECT 
        jt.*,
        jc.name as category_name,
        jc.description as category_description
      FROM job_types jt
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE jt.id = ?
    `, [jobTypeId]);
    
    if (!jobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Get materials for this job type
    const materials = await db.getMany(`
      SELECT 
        jtm.*,
        m.name as material_name,
        m.unit as material_unit,
        m.price as material_price,
        m.supplier,
        m.conversion_factor,
        m.base_unit,
        m.conversion_description,
        (jtm.quantity_per_unit * (1 + jtm.waste_factor)) as total_quantity_per_unit,
        (jtm.quantity_per_unit * (1 + jtm.waste_factor) * m.price) as cost_per_unit
      FROM job_type_materials jtm
      JOIN materials m ON jtm.material_id = m.id
      WHERE jtm.job_type_id = ?
      ORDER BY jtm.is_primary DESC, m.name ASC
    `, [jobTypeId]);
    
    
    res.json({
      job_type: {
        ...jobType,
        materials,
        material_assignments: materials  // Add this for frontend compatibility
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch job type',
      message: 'Internal server error while fetching job type'
    });
  }
});

// Create new job type (public access)
router.post('/types/public', validateJobType, async (req, res) => {
  try {
    const { category_id, name, unit, description, base_productivity } = req.body;
    
    // Check if category exists
    const category = await db.getOne(
      'SELECT id FROM job_categories WHERE id = ?',
      [category_id]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Check if job type name already exists in this category
    const existingJobType = await db.getOne(
      'SELECT id FROM job_types WHERE name = ? AND category_id = ?',
      [name, category_id]
    );
    
    if (existingJobType) {
      return res.status(409).json({
        error: 'Job type already exists',
        message: 'A job type with this name already exists in this category'
      });
    }
    
    // Insert new job type
    const jobTypeId = await db.insert(
      'INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, unit, description || null, base_productivity || null]
    );
    
    // Get created job type
    const newJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    res.status(201).json({
      message: 'Job type created successfully',
      job_type: newJobType
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create job type',
      message: 'Internal server error while creating job type'
    });
  }
});

// Create new job type (no authentication required)
router.post('/types', validateJobType, async (req, res) => {
  try {
    const { category_id, name, unit, description, base_productivity } = req.body;
    
    // Check if category exists
    const category = await db.getOne(
      'SELECT id FROM job_categories WHERE id = ?',
      [category_id]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Check if job type name already exists in this category
    const existingJobType = await db.getOne(
      'SELECT id FROM job_types WHERE name = ? AND category_id = ?',
      [name, category_id]
    );
    
    if (existingJobType) {
      return res.status(409).json({
        error: 'Job type already exists',
        message: 'A job type with this name already exists in this category'
      });
    }
    
    // Insert new job type
    const jobTypeId = await db.insert(
      'INSERT INTO job_types (category_id, name, unit, description, base_productivity) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, unit, description || null, base_productivity || null]
    );
    
    // Get created job type
    const newJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    res.status(201).json({
      message: 'Job type created successfully',
      job_type: newJobType
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create job type',
      message: 'Internal server error while creating job type'
    });
  }
});

// Update job type (public access for basic editing)
router.put('/type/:id/public', validateId, async (req, res) => {
  try {
    const jobTypeId = req.params.id;
    const { category_id, name, unit, description, base_productivity, input_config, calculator_configured } = req.body;
    
    // Check if job type exists
    const existingJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    if (!existingJobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // If only calculator configuration is being updated
    const calculatorConfigFields = ['input_config', 'calculator_configured'];
    const isCalculatorConfigUpdate = Object.keys(req.body).every(key => calculatorConfigFields.includes(key));
    
    if (isCalculatorConfigUpdate && (input_config !== undefined || calculator_configured !== undefined)) {
      
      try {
        // First, check if calculator_configured column exists by describing the table
        let hasCalculatorConfiguredColumn = false;
        try {
          const tableDescription = await db.getMany('DESCRIBE job_types');
          hasCalculatorConfiguredColumn = tableDescription.some(column => column.Field === 'calculator_configured');
        } catch (describeError) {
          // Fallback: try to select the column
          try {
            await db.getOne('SELECT calculator_configured FROM job_types WHERE id = ? LIMIT 1', [jobTypeId]);
            hasCalculatorConfiguredColumn = true;
          } catch (selectError) {
            hasCalculatorConfiguredColumn = false;
          }
        }
        
        // Build update query based on available columns
        let updateQuery, updateParams;
        
        if (hasCalculatorConfiguredColumn && calculator_configured !== undefined) {
          updateQuery = 'UPDATE job_types SET input_config = ?, calculator_configured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateParams = [input_config || null, calculator_configured || false, jobTypeId];
        } else {
          updateQuery = 'UPDATE job_types SET input_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateParams = [input_config || null, jobTypeId];
        }
        
        
        const affectedRows = await db.update(updateQuery, updateParams);
        
        if (affectedRows === 0) {
          return res.status(404).json({
            error: 'Job type not found',
            message: 'Job type not found'
          });
        }
        
        // Get updated job type
        const updatedJobType = await db.getOne(
          'SELECT * FROM job_types WHERE id = ?',
          [jobTypeId]
        );
        
        
        return res.json({
          message: 'Calculator configuration updated successfully',
          job_type: updatedJobType
        });
      } catch (dbError) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to update calculator configuration',
          details: dbError.message,
          sqlMessage: dbError.sqlMessage || 'No SQL message available'
        });
      }
    }
    
    // Full job type update - validate required fields
    if (!category_id || !name || !unit) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: [
          { param: 'category_id', msg: 'Category ID is required' },
          { param: 'name', msg: 'Name is required' },
          { param: 'unit', msg: 'Unit is required' }
        ]
      });
    }
    
    // Check if category exists
    const category = await db.getOne(
      'SELECT id FROM job_categories WHERE id = ?',
      [category_id]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Check if name is being changed and if it already exists
    if (name !== existingJobType.name || category_id !== existingJobType.category_id) {
      const duplicateName = await db.getOne(
        'SELECT id FROM job_types WHERE name = ? AND category_id = ? AND id != ?',
        [name, category_id, jobTypeId]
      );
      
      if (duplicateName) {
        return res.status(409).json({
          error: 'Job type name already exists',
          message: 'Another job type with this name already exists in this category'
        });
      }
    }
    
    // For full updates, also check if calculator_configured column exists
    let hasCalculatorConfiguredColumn = false;
    try {
      const tableDescription = await db.getMany('DESCRIBE job_types');
      hasCalculatorConfiguredColumn = tableDescription.some(column => column.Field === 'calculator_configured');
    } catch (describeError) {
      hasCalculatorConfiguredColumn = false;
    }
    
    // Update job type with all fields, conditionally including calculator_configured
    let fullUpdateQuery, fullUpdateParams;
    
    if (hasCalculatorConfiguredColumn) {
      fullUpdateQuery = 'UPDATE job_types SET category_id = ?, name = ?, unit = ?, description = ?, base_productivity = ?, input_config = ?, calculator_configured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      fullUpdateParams = [category_id, name, unit, description || null, base_productivity || null, input_config || null, calculator_configured || false, jobTypeId];
    } else {
      fullUpdateQuery = 'UPDATE job_types SET category_id = ?, name = ?, unit = ?, description = ?, base_productivity = ?, input_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      fullUpdateParams = [category_id, name, unit, description || null, base_productivity || null, input_config || null, jobTypeId];
    }
    
    const affectedRows = await db.update(fullUpdateQuery, fullUpdateParams);
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Get updated job type
    const updatedJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    res.json({
      message: 'Job type updated successfully',
      job_type: updatedJobType
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update job type',
      message: 'Internal server error while updating job type',
      details: error.message
    });
  }
});

// Update job type (no authentication required)
router.put('/type/:id', validateId, validateJobType, async (req, res) => {
  try {
    const jobTypeId = req.params.id;
    const { category_id, name, unit, description, base_productivity } = req.body;
    
    // Check if job type exists
    const existingJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    if (!existingJobType) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Check if category exists
    const category = await db.getOne(
      'SELECT id FROM job_categories WHERE id = ?',
      [category_id]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Job category not found'
      });
    }
    
    // Check if name is being changed and if it already exists
    if (name !== existingJobType.name || category_id !== existingJobType.category_id) {
      const duplicateName = await db.getOne(
        'SELECT id FROM job_types WHERE name = ? AND category_id = ? AND id != ?',
        [name, category_id, jobTypeId]
      );
      
      if (duplicateName) {
        return res.status(409).json({
          error: 'Job type name already exists',
          message: 'Another job type with this name already exists in this category'
        });
      }
    }
    
    // Update job type
    const affectedRows = await db.update(
      'UPDATE job_types SET category_id = ?, name = ?, unit = ?, description = ?, base_productivity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [category_id, name, unit, description || null, base_productivity || null, jobTypeId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    // Get updated job type
    const updatedJobType = await db.getOne(
      'SELECT * FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    res.json({
      message: 'Job type updated successfully',
      job_type: updatedJobType
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update job type',
      message: 'Internal server error while updating job type'
    });
  }
});

// Delete job type (no authentication required)
router.delete('/type/:id', validateId, async (req, res) => {
  try {
    const jobTypeId = req.params.id;
    const force = req.query.force === 'true';
    
    // Check if job type exists first
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
    
    // Check if job type has calculations
    const calculationsCount = await db.getOne(
      'SELECT COUNT(*) as count FROM calculations WHERE job_type_id = ?',
      [jobTypeId]
    );
    
    if (calculationsCount.count > 0) {
      if (!force) {
        // Return 409 with detailed information about associated calculations
        return res.status(409).json({
          error: 'Cannot delete job type',
          message: 'Job type has associated calculations. Cannot delete.',
          details: {
            job_type_name: jobType.name,
            calculations_count: calculationsCount.count,
            suggestion: 'Use force=true parameter to delete job type and all associated calculations'
          }
        });
      } else {
        // Force delete: First delete all associated calculations
        console.log(`Force deleting job type ${jobTypeId} with ${calculationsCount.count} associated calculations`);
        
        const deletedCalculations = await db.remove(
          'DELETE FROM calculations WHERE job_type_id = ?',
          [jobTypeId]
        );
        
        console.log(`Deleted ${deletedCalculations} calculations for job type ${jobTypeId}`);
      }
    }
    
    // Delete job type (this will cascade delete job_type_materials)
    const affectedRows = await db.remove(
      'DELETE FROM job_types WHERE id = ?',
      [jobTypeId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'Job type not found',
        message: 'Job type not found'
      });
    }
    
    const responseMessage = force && calculationsCount.count > 0 
      ? `Job type deleted successfully along with ${calculationsCount.count} associated calculations`
      : 'Job type deleted successfully';
    
    res.json({
      message: responseMessage,
      deleted_calculations: force ? calculationsCount.count : 0
    });
    
  } catch (error) {
    console.error('Error deleting job type:', error);
    res.status(500).json({
      error: 'Failed to delete job type',
      message: 'Internal server error while deleting job type'
    });
  }
});

// Reset AUTO_INCREMENT for job_categories table (admin only)
router.post('/categories/reset-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    // Reset AUTO_INCREMENT counter to 1
    await resetTableAutoIncrement('job_categories', 1);
    
    res.json({
      message: 'Job categories AUTO_INCREMENT counter reset successfully',
      table: 'job_categories',
      info: 'Next inserted job category will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT',
      message: 'Internal server error while resetting job categories AUTO_INCREMENT counter'
    });
  }
});

// Reset AUTO_INCREMENT for job_types table (admin only)
router.post('/types/reset-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    // Reset AUTO_INCREMENT counter to 1
    await resetTableAutoIncrement('job_types', 1);
    
    res.json({
      message: 'Job types AUTO_INCREMENT counter reset successfully',
      table: 'job_types',
      info: 'Next inserted job type will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT',
      message: 'Internal server error while resetting job types AUTO_INCREMENT counter'
    });
  }
});

// Clear all job categories and reset counter (admin only)
router.delete('/categories/clear-all', authenticate, adminOnly, async (req, res) => {
  try {
    // Check if any categories have job types
    const jobTypesCount = await db.getOne(
      'SELECT COUNT(*) as count FROM job_types'
    );
    
    if (jobTypesCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot clear job categories',
        message: 'Some categories have job types. Delete job types first.',
        job_types_count: jobTypesCount.count
      });
    }
    
    // Delete all job categories
    const deletedCount = await db.remove('DELETE FROM job_categories');
    
    // Reset AUTO_INCREMENT counter
    await resetTableAutoIncrement('job_categories', 1);
    
    res.json({
      message: 'All job categories cleared and AUTO_INCREMENT reset successfully',
      table: 'job_categories',
      deleted_count: deletedCount,
      info: 'Next inserted job category will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear job categories',
      message: 'Internal server error while clearing job categories'
    });
  }
});

// Clear all job types and reset counter (admin only)
router.delete('/types/clear-all', authenticate, adminOnly, async (req, res) => {
  try {
    // Check if any job types have calculations
    const calculationsCount = await db.getOne(
      'SELECT COUNT(*) as count FROM calculations'
    );
    
    if (calculationsCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot clear job types',
        message: 'Some job types have calculations. Delete calculations first.',
        calculations_count: calculationsCount.count
      });
    }
    
    // Delete all job types (this will cascade delete job_type_materials)
    const deletedCount = await db.remove('DELETE FROM job_types');
    
    // Reset AUTO_INCREMENT counters for both tables
    await resetTableAutoIncrement('job_types', 1);
    await resetTableAutoIncrement('job_type_materials', 1);
    
    res.json({
      message: 'All job types cleared and AUTO_INCREMENT reset successfully',
      tables: ['job_types', 'job_type_materials'],
      deleted_count: deletedCount,
      info: 'Next inserted job type and job type material will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear job types',
      message: 'Internal server error while clearing job types'
    });
  }
});

// Get AUTO_INCREMENT status for job-related tables (admin only)
router.get('/auto-increment-status', authenticate, adminOnly, async (req, res) => {
  try {
    const tables = ['job_categories', 'job_types', 'job_type_materials'];
    const status = [];
    
    for (const tableName of tables) {
      try {
        const isEmpty = await isTableEmpty(tableName);
        const currentAutoIncrement = await getCurrentAutoIncrement(tableName);
        const rowCount = await db.getOne(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        status.push({
          table: tableName,
          is_empty: isEmpty,
          row_count: rowCount.count,
          current_auto_increment: currentAutoIncrement,
          needs_reset: isEmpty && currentAutoIncrement > 1
        });
      } catch (error) {
        status.push({
          table: tableName,
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'AUTO_INCREMENT status retrieved successfully',
      status
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get AUTO_INCREMENT status',
      message: 'Internal server error while getting AUTO_INCREMENT status'
    });
  }
});

// Bulk import job categories with AUTO_INCREMENT reset (admin only)
router.post('/categories/bulk-import', authenticate, adminOnly, async (req, res) => {
  try {
    const { categories_data, update_existing = false } = req.body;
    
    if (!categories_data || !Array.isArray(categories_data)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'categories_data must be an array'
      });
    }
    
    // Check if database is empty and reset AUTO_INCREMENT if needed
    const categoryCount = await db.getOne('SELECT COUNT(*) as count FROM job_categories');
    const shouldResetAutoIncrement = categoryCount.count === 0;
    
    if (shouldResetAutoIncrement) {
      await resetTableAutoIncrement('job_categories', 1);
    }
    
    const results = {
      success: [],
      errors: [],
      updated: [],
      skipped: []
    };
    
    for (let i = 0; i < categories_data.length; i++) {
      const categoryData = categories_data[i];
      const rowNumber = i + 1;
      
      try {
        // Validate required fields
        if (!categoryData.name) {
          results.errors.push({
            row: rowNumber,
            data: categoryData,
            error: 'Missing required field: name'
          });
          continue;
        }
        
        const cleanData = {
          name: String(categoryData.name).trim(),
          description: categoryData.description ? String(categoryData.description).trim() : null,
          icon: categoryData.icon ? String(categoryData.icon).trim() : null
        };
        
        // Check if category already exists
        const existingCategory = await db.getOne(
          'SELECT id, name FROM job_categories WHERE name = ?',
          [cleanData.name]
        );
        
        if (existingCategory) {
          if (update_existing) {
            // Update existing category
            await db.update(
              'UPDATE job_categories SET description = ?, icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [cleanData.description, cleanData.icon, existingCategory.id]
            );
            
            results.updated.push({
              row: rowNumber,
              category_id: existingCategory.id,
              name: cleanData.name
            });
          } else {
            // Skip existing category
            results.skipped.push({
              row: rowNumber,
              name: cleanData.name,
              reason: 'Category already exists'
            });
          }
        } else {
          // Insert new category
          const categoryId = await db.insert(
            'INSERT INTO job_categories (name, description, icon) VALUES (?, ?, ?)',
            [cleanData.name, cleanData.description, cleanData.icon]
          );
          
          results.success.push({
            row: rowNumber,
            category_id: categoryId,
            name: cleanData.name
          });
        }
        
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: categoryData,
          error: error.message
        });
      }
    }
    

    res.json({
      message: 'Job categories bulk import completed',
      summary: {
        total_processed: categories_data.length,
        successful_imports: results.success.length,
        updates: results.updated.length,
        errors: results.errors.length,
        skipped: results.skipped.length,
        total_saved: results.success.length + results.updated.length,
        auto_increment_reset: shouldResetAutoIncrement
      },
      results
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to import job categories',
      message: 'Internal server error during bulk import'
    });
  }
});

module.exports = router;
