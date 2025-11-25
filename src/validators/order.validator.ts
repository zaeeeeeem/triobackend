import { body, query, param } from 'express-validator';

/**
 * Validation schemas for order-related endpoints
 */

// ============================================
// CREATE ORDER VALIDATION
// ============================================

export const createOrderValidator = [
  // Customer information
  body('customer.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),

  body('customer.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),

  body('customer.phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),

  // Section
  body('section')
    .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
    .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),

  // Items array
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),

  body('items.*.productId')
    .isUUID()
    .withMessage('Invalid product ID'),

  body('items.*.variantId')
    .optional()
    .isUUID()
    .withMessage('Invalid variant ID'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),

  // SECURITY: Ensure frontend doesn't send prices
  body('items.*.price')
    .not()
    .exists()
    .withMessage('Price should not be provided - calculated by server'),

  body('items.*.total')
    .not()
    .exists()
    .withMessage('Total should not be provided - calculated by server'),

  // Discount code
  body('discountCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Discount code must be between 3 and 50 characters'),

  // Shipping address (optional)
  body('shippingAddress.fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('shippingAddress.phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),

  body('shippingAddress.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  body('shippingAddress.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('shippingAddress.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('shippingAddress.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),

  body('shippingAddress.postalCode')
    .optional()
    .trim()
    .matches(/^[\d\s\-A-Za-z]+$/)
    .withMessage('Invalid postal code format')
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),

  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),

  // Payment status
  body('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Invalid payment status'),

  // Fulfillment status
  body('fulfillmentStatus')
    .optional()
    .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid fulfillment status'),

  // Notes
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  // Tags
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),

  // Payment method
  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Payment method must be between 2 and 50 characters'),

  // SECURITY: Block any price-related fields
  body('subtotal')
    .not()
    .exists()
    .withMessage('Subtotal should not be provided - calculated by server'),

  body('tax')
    .not()
    .exists()
    .withMessage('Tax should not be provided - calculated by server'),

  body('discount')
    .not()
    .exists()
    .withMessage('Discount should not be provided - calculated by server'),

  body('total')
    .not()
    .exists()
    .withMessage('Total should not be provided - calculated by server'),
];

// ============================================
// UPDATE ORDER VALIDATION
// ============================================

export const updateOrderValidator = [
  body('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Invalid payment status'),

  body('fulfillmentStatus')
    .optional()
    .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid fulfillment status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),

  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Payment method must be between 2 and 50 characters'),
];

// ============================================
// UPDATE PAYMENT STATUS VALIDATION
// ============================================

export const updatePaymentStatusValidator = [
  body('paymentStatus')
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Payment status must be one of: PENDING, PAID, FAILED, REFUNDED'),
];

// ============================================
// UPDATE FULFILLMENT STATUS VALIDATION
// ============================================

export const updateFulfillmentStatusValidator = [
  body('fulfillmentStatus')
    .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Fulfillment status must be one of: UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED'),
];

// ============================================
// ORDER QUERY PARAMS VALIDATION
// ============================================

export const orderQueryValidator = [
  // Pagination
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search
  query('search')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Search query cannot be empty'),

  // Filters
  query('section')
    .optional()
    .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
    .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),

  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
    .withMessage('Invalid payment status'),

  query('fulfillmentStatus')
    .optional()
    .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid fulfillment status'),

  query('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),

  // Sorting
  query('sortBy')
    .optional()
    .isIn(['orderDate', 'total', 'orderNumber', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // Date range
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom (use ISO 8601)'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo (use ISO 8601)'),
];

// ============================================
// ORDER STATS QUERY VALIDATION
// ============================================

export const orderStatsQueryValidator = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom (use ISO 8601)'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo (use ISO 8601)'),

  query('section')
    .optional()
    .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
    .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),
];

// ============================================
// PARAM VALIDATORS
// ============================================

export const orderIdParamValidator = [
  param('orderId').isUUID().withMessage('Invalid order ID'),
];

export const deleteOrderQueryValidator = [
  query('hard')
    .optional()
    .isBoolean()
    .withMessage('Hard delete flag must be a boolean'),
];
