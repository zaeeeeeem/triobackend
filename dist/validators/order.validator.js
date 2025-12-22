"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrderQueryValidator = exports.orderIdParamValidator = exports.orderStatsQueryValidator = exports.orderQueryValidator = exports.updateFulfillmentStatusValidator = exports.updatePaymentStatusValidator = exports.updateOrderValidator = exports.createOrderValidator = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation schemas for order-related endpoints
 */
// ============================================
// CREATE ORDER VALIDATION
// ============================================
exports.createOrderValidator = [
    // Customer information
    (0, express_validator_1.body)('customer.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Customer name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('customer.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address is required'),
    (0, express_validator_1.body)('customer.phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    // Section (optional - will use first item's section if not provided)
    (0, express_validator_1.body)('section')
        .optional()
        .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
        .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),
    // Items array
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('At least one product is required'),
    (0, express_validator_1.body)('items.*.productId')
        .isUUID()
        .withMessage('Invalid product ID'),
    (0, express_validator_1.body)('items.*.variantId')
        .optional()
        .isUUID()
        .withMessage('Invalid variant ID'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Quantity must be between 1 and 1000'),
    // SECURITY: Ensure frontend doesn't send prices
    (0, express_validator_1.body)('items.*.price')
        .not()
        .exists()
        .withMessage('Price should not be provided - calculated by server'),
    (0, express_validator_1.body)('items.*.total')
        .not()
        .exists()
        .withMessage('Total should not be provided - calculated by server'),
    // Discount code
    (0, express_validator_1.body)('discountCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Discount code must be between 3 and 50 characters'),
    // Shipping address (optional)
    (0, express_validator_1.body)('shippingAddress.fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('shippingAddress.phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('shippingAddress.email')
        .optional({ checkFalsy: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    (0, express_validator_1.body)('shippingAddress.address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),
    (0, express_validator_1.body)('shippingAddress.city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('shippingAddress.state')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters'),
    (0, express_validator_1.body)('shippingAddress.postalCode')
        .optional()
        .trim()
        .matches(/^[\d\s\-A-Za-z]+$/)
        .withMessage('Invalid postal code format')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('shippingAddress.country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    // Payment status
    (0, express_validator_1.body)('paymentStatus')
        .optional()
        .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .withMessage('Invalid payment status'),
    // Fulfillment status
    (0, express_validator_1.body)('fulfillmentStatus')
        .optional()
        .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid fulfillment status'),
    // Notes
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be less than 1000 characters'),
    // Tags
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    (0, express_validator_1.body)('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters'),
    // Payment method
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Payment method must be between 2 and 50 characters'),
    // SECURITY: Block any price-related fields
    (0, express_validator_1.body)('subtotal')
        .not()
        .exists()
        .withMessage('Subtotal should not be provided - calculated by server'),
    (0, express_validator_1.body)('tax')
        .not()
        .exists()
        .withMessage('Tax should not be provided - calculated by server'),
    (0, express_validator_1.body)('discount')
        .not()
        .exists()
        .withMessage('Discount should not be provided - calculated by server'),
    (0, express_validator_1.body)('total')
        .not()
        .exists()
        .withMessage('Total should not be provided - calculated by server'),
];
// ============================================
// UPDATE ORDER VALIDATION
// ============================================
exports.updateOrderValidator = [
    (0, express_validator_1.body)('paymentStatus')
        .optional()
        .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.body)('fulfillmentStatus')
        .optional()
        .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid fulfillment status'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be less than 1000 characters'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    (0, express_validator_1.body)('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Payment method must be between 2 and 50 characters'),
];
// ============================================
// UPDATE PAYMENT STATUS VALIDATION
// ============================================
exports.updatePaymentStatusValidator = [
    (0, express_validator_1.body)('paymentStatus')
        .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .withMessage('Payment status must be one of: PENDING, PAID, FAILED, REFUNDED'),
];
// ============================================
// UPDATE FULFILLMENT STATUS VALIDATION
// ============================================
exports.updateFulfillmentStatusValidator = [
    (0, express_validator_1.body)('fulfillmentStatus')
        .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Fulfillment status must be one of: UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED'),
];
// ============================================
// ORDER QUERY PARAMS VALIDATION
// ============================================
exports.orderQueryValidator = [
    // Pagination
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    // Search
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Search query cannot be empty'),
    // Filters
    (0, express_validator_1.query)('section')
        .optional()
        .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
        .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),
    (0, express_validator_1.query)('paymentStatus')
        .optional()
        .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.query)('fulfillmentStatus')
        .optional()
        .isIn(['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid fulfillment status'),
    (0, express_validator_1.query)('customerId')
        .optional()
        .isUUID()
        .withMessage('Invalid customer ID'),
    // Sorting
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['orderDate', 'total', 'orderNumber', 'createdAt'])
        .withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    // Date range
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format for dateFrom (use ISO 8601)'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format for dateTo (use ISO 8601)'),
];
// ============================================
// ORDER STATS QUERY VALIDATION
// ============================================
exports.orderStatsQueryValidator = [
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format for dateFrom (use ISO 8601)'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format for dateTo (use ISO 8601)'),
    (0, express_validator_1.query)('section')
        .optional()
        .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
        .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),
];
// ============================================
// PARAM VALIDATORS
// ============================================
exports.orderIdParamValidator = [
    (0, express_validator_1.param)('orderId').isUUID().withMessage('Invalid order ID'),
];
exports.deleteOrderQueryValidator = [
    (0, express_validator_1.query)('hard')
        .optional()
        .isBoolean()
        .withMessage('Hard delete flag must be a boolean'),
];
//# sourceMappingURL=order.validator.js.map