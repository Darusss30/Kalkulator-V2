const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { param, validationResult } = require('express-validator');

// Custom validation for jobTypeId parameter
const validateJobTypeId = [
  param('jobTypeId')
    .isInt({ min: 1 })
    .withMessage('Job type ID must be a positive integer'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid job type ID',
        details: errors.array()
      });
    }
    next();
  }
];

// Get job type with labor assignments and material assignments
router.get('/:jobTypeId/details', validateJobTypeId, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    
    // Get job type info
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
    
    // Get labor assignments (if any custom assignments exist)
    const laborAssignments = await db.getMany(`
      SELECT * FROM job_type_labor 
      WHERE job_type_id = ?
      ORDER BY worker_type
    `, [jobTypeId]);
    
    // Get material assignments
    const materialAssignments = await db.getMany(`
      SELECT 
        jtm.*,
        m.name as material_name,
        m.unit as material_unit,
        m.price as material_price,
        m.conversion_factor,
        m.base_unit,
        m.conversion_description,
        m.pieces_per_unit,
        m.piece_dimensions,
        m.coverage_per_unit
      FROM job_type_materials jtm
      JOIN materials m ON jtm.material_id = m.id
      WHERE jtm.job_type_id = ?
      ORDER BY jtm.is_primary DESC, m.name ASC
    `, [jobTypeId]);
    
    res.json({
      job_type: {
        ...jobType,
        labor_assignments: laborAssignments,
        material_assignments: materialAssignments
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch job type details',
      message: 'Internal server error while fetching job type details'
    });
  }
});

// Update labor assignments for job type (no authentication required)
router.put('/:jobTypeId/labor', validateJobTypeId, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    const { labor_assignments } = req.body;
    
    // Validate input data
    if (!Array.isArray(labor_assignments)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'labor_assignments must be an array'
      });
    }
    
    if (labor_assignments.length === 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'At least one labor assignment is required'
      });
    }
    
    // Validate each assignment
    for (let i = 0; i < labor_assignments.length; i++) {
      const assignment = labor_assignments[i];
      
      if (!assignment.worker_type) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Worker type is required for assignment ${i + 1}`
        });
      }
      
      if (!assignment.daily_rate || isNaN(parseFloat(assignment.daily_rate)) || parseFloat(assignment.daily_rate) <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Valid daily rate is required for assignment ${i + 1}`
        });
      }
      
      if (!assignment.quantity || isNaN(parseInt(assignment.quantity)) || parseInt(assignment.quantity) <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Valid quantity is required for assignment ${i + 1}`
        });
      }
      
      if (!assignment.productivity_factor || isNaN(parseFloat(assignment.productivity_factor)) || parseFloat(assignment.productivity_factor) <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Valid productivity factor is required for assignment ${i + 1}`
        });
      }
    }
    
    // Check for duplicate combinations
    const combinations = labor_assignments.map(a => `${a.worker_type}-${a.skill_level || 'standard'}`);
    const duplicates = combinations.filter((item, index) => combinations.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Duplicate worker type and skill level combinations are not allowed'
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
    
    // Use transaction to ensure data consistency
    await db.transaction(async (connection) => {
      // Delete existing labor assignments
      await connection.execute('DELETE FROM job_type_labor WHERE job_type_id = ?', [jobTypeId]);
      
      // Insert new labor assignments
      for (const assignment of labor_assignments) {
        try {
          await connection.execute(`
            INSERT INTO job_type_labor (
              job_type_id, worker_type, skill_level, daily_rate, 
              quantity, productivity_factor
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            jobTypeId,
            assignment.worker_type,
            assignment.skill_level || 'standard',
            parseFloat(assignment.daily_rate),
            parseInt(assignment.quantity) || 1,
            parseFloat(assignment.productivity_factor) || 1.0
          ]);
        } catch (insertError) {
          
          // Handle specific database errors
          if (insertError.code === 'ER_DUP_ENTRY') {
            throw new Error(`Duplicate entry: ${assignment.worker_type} with ${assignment.skill_level || 'standard'} skill level already exists`);
          }
          
          throw insertError;
        }
      }
    });
    
    
    res.json({
      message: 'Labor assignments updated successfully',
      job_type_id: jobTypeId,
      assignments_count: labor_assignments.length
    });
    
  } catch (error) {
    
    // Handle specific error types
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: error.message
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        error: 'Invalid reference',
        message: 'Job type does not exist'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update labor assignments',
      message: error.message || 'Internal server error while updating labor assignments'
    });
  }
});

// Update material assignments for job type (no authentication required)
router.put('/:jobTypeId/materials', validateJobTypeId, async (req, res) => {
  try {
    const jobTypeId = req.params.jobTypeId;
    const { material_assignments } = req.body;
    
    if (!Array.isArray(material_assignments)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'material_assignments must be an array'
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
    
    // Delete existing material assignments
    await db.remove('DELETE FROM job_type_materials WHERE job_type_id = ?', [jobTypeId]);
    
    // Insert new material assignments
    for (const assignment of material_assignments) {
      await db.insert(`
        INSERT INTO job_type_materials (
          job_type_id, material_id, quantity_per_unit, 
          waste_factor, is_primary
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        jobTypeId,
        assignment.material_id,
        assignment.quantity_per_unit,
        assignment.waste_factor || 0,
        assignment.is_primary || false
      ]);
    }
    
    res.json({
      message: 'Material assignments updated successfully',
      job_type_id: jobTypeId,
      assignments_count: material_assignments.length
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update material assignments',
      message: 'Internal server error while updating material assignments'
    });
  }
});

module.exports = router;
