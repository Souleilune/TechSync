const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Validation middleware
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

// Register validation rules - Updated to match your database schema
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters')
    .trim(),
  
  body('github_username')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('GitHub username must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('GitHub username can only contain letters, numbers, and hyphens'),
  
  body('linkedin_url')
    .optional()
    .isLength({ max: 255 })
    .withMessage('LinkedIn URL must be less than 255 characters')
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),
  
  body('years_experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be 0 or greater')
    .toInt()
];

// Login validation rules
const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation rules
const updateProfileValidation = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters')
    .trim(),
  
  body('github_username')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('GitHub username must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('GitHub username can only contain letters, numbers, and hyphens'),
  
  body('linkedin_url')
    .optional()
    .isLength({ max: 255 })
    .withMessage('LinkedIn URL must be less than 255 characters')
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),
  
  body('years_experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be 0 or greater')
    .toInt()
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Routes
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, handleValidationErrors, authController.updateProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, handleValidationErrors, authController.changePassword);

module.exports = router;