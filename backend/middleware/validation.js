const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
}

// User registration validation
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Calculation input validation
const validateCalculationInput = [
  param('jobTypeId')
    .isInt({ min: 1 })
    .withMessage('Job type ID must be a positive integer'),
  
  body('volume')
    .isFloat({ min: 0.01 })
    .withMessage('Volume must be a positive number'),
  
  body('productivity')
    .isFloat({ min: 0.01 })
    .withMessage('Productivity must be a positive number'),
  
  body('worker_ratio')
    .matches(/^\d+:\d+$/)
    .withMessage('Worker ratio must be in format "number:number" (e.g., "1:1", "1:2", "0:2")')
    .custom((value) => {
      const [tukang, pekerja] = value.split(':').map(Number);
      if (tukang === 0 && pekerja === 0) {
        throw new Error('At least one worker (tukang or pekerja) must be present');
      }
      return true;
    }),
  
  body('num_workers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Number of workers must be a non-negative integer'),
  
  body('material_specs')
    .optional()
    .isArray()
    .withMessage('Material specifications must be an array'),
  
  body('material_specs.*.material_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Material ID must be a positive integer'),
  
  body('material_specs.*.quantity_override')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity override must be a non-negative number'),
  
  handleValidationErrors
];

// Calculation update validation (without jobTypeId parameter)
const validateCalculationUpdate = [
  body('volume')
    .isFloat({ min: 0.01 })
    .withMessage('Volume must be a positive number'),
  
  body('productivity')
    .isFloat({ min: 0.01 })
    .withMessage('Productivity must be a positive number'),
  
  body('worker_ratio')
    .matches(/^\d+:\d+$/)
    .withMessage('Worker ratio must be in format "number:number" (e.g., "1:1", "1:2", "0:2")')
    .custom((value) => {
      const [tukang, pekerja] = value.split(':').map(Number);
      if (tukang === 0 && pekerja === 0) {
        throw new Error('At least one worker (tukang or pekerja) must be present');
      }
      return true;
    }),
  
  body('num_workers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Number of workers must be a non-negative integer'),
  
  body('material_specs')
    .optional()
    .isArray()
    .withMessage('Material specifications must be an array'),
  
  body('material_specs.*.material_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Material ID must be a positive integer'),
  
  body('material_specs.*.quantity_override')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity override must be a non-negative number'),
  
  body('profit_percentage')
    .optional()
    .isFloat({ min: 0, max: 99.9 })
    .withMessage('Profit percentage must be between 0 and 99.9'),
  
  body('project_name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Project name must not exceed 200 characters'),
  
  body('custom_waste_factor')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Custom waste factor must be between 0 and 50'),
  
  body('edit_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Edit notes must not exceed 500 characters'),
  
  handleValidationErrors
];

// Job category validation
const validateJobCategory = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Category name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon name must not exceed 50 characters'),
  
  handleValidationErrors
];

// Job type validation
const validateJobType = [
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Job type name must be between 3 and 100 characters'),
  
  body('unit')
    .isIn(['m2', 'm3', 'm', 'unit', 'ls', 'kg', 'ton', 'pcs'])
    .withMessage('Unit must be one of: m2, m3, m, unit, ls, kg, ton, pcs'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('base_productivity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Base productivity must be a positive number'),
  
  handleValidationErrors
];

// Material validation
const validateMaterial = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Material name must be between 3 and 100 characters'),
  
  body('unit')
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  
  body('supplier')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Supplier name must not exceed 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  handleValidationErrors
];

// Labor rate validation
const validateLaborRate = [
  body('worker_type')
    .isLength({ min: 3, max: 50 })
    .withMessage('Worker type must be between 3 and 50 characters'),
  
  body('daily_rate')
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a non-negative number'),
  
  body('skill_level')
    .optional()
    .isIn(['standard', 'expert', 'senior'])
    .withMessage('Skill level must be one of: standard, expert, senior'),
  
  body('location')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Location must not exceed 50 characters'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }) // Increased limit to support material selection
    .withMessage('Limit must be between 1 and 500'),
  
  query('sort')
    .optional()
    .isIn(['id', 'name', 'created_at', 'updated_at', 'price'])
    .withMessage('Sort field must be one of: id, name, created_at, updated_at, price'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be ASC or DESC'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Category ID parameter validation
const validateCategoryId = [
  param('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 0, max: 100 })
    .withMessage('Search query must not exceed 100 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCalculationInput,
  validateCalculationUpdate,
  validateJobCategory,
  validateJobType,
  validateMaterial,
  validateLaborRate,
  validatePagination,
  validateId,
  validateCategoryId,
  validateSearch
};
