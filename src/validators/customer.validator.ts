import { body, query, param } from 'express-validator';

/**
 * Validation schemas for customer-related endpoints
 */

export const registerCustomerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),

  body('marketingConsent')
    .optional()
    .isBoolean()
    .withMessage('Marketing consent must be a boolean'),

  body('smsConsent')
    .optional()
    .isBoolean()
    .withMessage('SMS consent must be a boolean'),
];

export const loginCustomerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
];

export const verifyEmailValidator = [
  query('token')
    .notEmpty()
    .withMessage('Verification token is required'),
];

export const resendVerificationValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export const updateCustomerValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),

  body('timezone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timezone is required'),

  body('language')
    .optional()
    .isIn(['en', 'ur', 'ar'])
    .withMessage('Language must be one of: en, ur, ar'),
];

export const changeEmailValidator = [
  body('newEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
];

export const updatePreferencesValidator = [
  body('marketingConsent')
    .optional()
    .isBoolean()
    .withMessage('Marketing consent must be a boolean'),

  body('smsConsent')
    .optional()
    .isBoolean()
    .withMessage('SMS consent must be a boolean'),

  body('emailPreferences')
    .optional()
    .isObject()
    .withMessage('Email preferences must be an object'),

  body('emailPreferences.newsletter')
    .optional()
    .isBoolean()
    .withMessage('Newsletter preference must be a boolean'),

  body('emailPreferences.orderUpdates')
    .optional()
    .isBoolean()
    .withMessage('Order updates preference must be a boolean'),

  body('emailPreferences.promotions')
    .optional()
    .isBoolean()
    .withMessage('Promotions preference must be a boolean'),
];

export const deleteAccountValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),
];

export const listCustomersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Search query is required'),

  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .withMessage('Status must be one of: ACTIVE, INACTIVE, SUSPENDED'),

  query('customerType')
    .optional()
    .isIn(['RETAIL', 'WHOLESALE', 'CORPORATE'])
    .withMessage('Customer type must be one of: RETAIL, WHOLESALE, CORPORATE'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'email', 'totalOrders', 'totalSpent', 'lastOrderDate'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const getOrdersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('section')
    .optional()
    .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
    .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),

  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Invalid payment status'),

  query('orderStatus')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid order status'),
];

export const guestOrderLookupValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('Order number is required'),
];

export const customerIdParamValidator = [
  param('customerId')
    .isUUID()
    .withMessage('Invalid customer ID'),
];

export const orderIdParamValidator = [
  param('orderId')
    .isUUID()
    .withMessage('Invalid order ID'),
];
