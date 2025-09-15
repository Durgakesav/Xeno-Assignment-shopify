const { body, param, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Tenant validation rules
const validateTenant = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be 2-100 characters'),
  body('shopifyUrl')
    .trim()
    .isURL({ require_protocol: false, require_tld: true })
    .withMessage('Valid Shopify domain is required (e.g., your-store.myshopify.com)'),
  body('accessToken')
    .notEmpty()
    .withMessage('Access token is required'),
  handleValidationErrors
];

// Parameter validation
const validateTenantId = [
  param('tenantId')
    .matches(/^c[0-9a-z]{24,}$/i)
    .withMessage('Valid tenant ID is required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTenant,
  validateTenantId,
  handleValidationErrors
};



