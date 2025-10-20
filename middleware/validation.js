const { body, validationResult } = require('express-validator');

// Helper function for validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation for Activity
const validateActivity = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category_id').isMongoId().withMessage('Valid category ID is required'),
  body('priority_level').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Canceled']).withMessage('Invalid status'),
  handleValidationErrors
];

// Validation for ActivityMeta
const validateActivityMeta = [
  body('activity_id').isMongoId().withMessage('Valid activity ID is required'),
  body('activity_location').optional().isLength({ max: 255 }).withMessage('Location too long'),
  body('external_focal_person').optional().isLength({ max: 100 }).withMessage('External focal person name too long'),
  body('external_email').optional().isEmail().withMessage('Invalid email format'),
  body('external_phone').optional().isLength({ max: 20 }).withMessage('Phone number too long'),
  handleValidationErrors
];

// Validation for Category
const validateCategory = [
  body('name').notEmpty().isLength({ max: 50 }).withMessage('Name is required and must be less than 50 characters'),
  body('description').optional().isLength({ max: 255 }).withMessage('Description too long'),
  handleValidationErrors
];

// Validation for ActivityInstance
const validateActivityInstance = [
  body('activity_id').isMongoId().withMessage('Valid activity ID is required'),
  body('start_time').isISO8601().withMessage('Valid start time is required'),
  body('end_time').isISO8601().withMessage('Valid end time is required'),
  body('actual_start_time').optional().isISO8601().withMessage('Invalid actual start time format'),
  body('actual_end_time').optional().isISO8601().withMessage('Invalid actual end time format'),
  handleValidationErrors
];

// Validation for user registration
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  handleValidationErrors
];

// Validation for user login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

module.exports = {
  validateActivity,
  validateActivityMeta,
  validateCategory,
  validateActivityInstance,
  validateRegistration,
  validateLogin
};