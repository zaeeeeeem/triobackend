"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderIdParamValidator = exports.customerIdParamValidator = exports.guestOrderLookupValidator = exports.getOrdersValidator = exports.listCustomersValidator = exports.deleteAccountValidator = exports.updatePreferencesValidator = exports.changePasswordValidator = exports.changeEmailValidator = exports.updateCustomerValidator = exports.resendVerificationValidator = exports.verifyEmailValidator = exports.resetPasswordValidator = exports.forgotPasswordValidator = exports.refreshTokenValidator = exports.loginCustomerValidator = exports.registerCustomerValidator = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation schemas for customer-related endpoints
 */
exports.registerCustomerValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
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
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('marketingConsent')
        .optional()
        .isBoolean()
        .withMessage('Marketing consent must be a boolean'),
    (0, express_validator_1.body)('smsConsent')
        .optional()
        .isBoolean()
        .withMessage('SMS consent must be a boolean'),
];
exports.loginCustomerValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
exports.refreshTokenValidator = [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
];
exports.forgotPasswordValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword')
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
exports.verifyEmailValidator = [
    (0, express_validator_1.query)('token')
        .notEmpty()
        .withMessage('Verification token is required'),
];
exports.resendVerificationValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
];
exports.updateCustomerValidator = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    (0, express_validator_1.body)('timezone')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Timezone is required'),
    (0, express_validator_1.body)('language')
        .optional()
        .isIn(['en', 'ur', 'ar'])
        .withMessage('Language must be one of: en, ur, ar'),
];
exports.changeEmailValidator = [
    (0, express_validator_1.body)('newEmail')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
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
exports.updatePreferencesValidator = [
    (0, express_validator_1.body)('marketingConsent')
        .optional()
        .isBoolean()
        .withMessage('Marketing consent must be a boolean'),
    (0, express_validator_1.body)('smsConsent')
        .optional()
        .isBoolean()
        .withMessage('SMS consent must be a boolean'),
    (0, express_validator_1.body)('emailPreferences')
        .optional()
        .isObject()
        .withMessage('Email preferences must be an object'),
    (0, express_validator_1.body)('emailPreferences.newsletter')
        .optional()
        .isBoolean()
        .withMessage('Newsletter preference must be a boolean'),
    (0, express_validator_1.body)('emailPreferences.orderUpdates')
        .optional()
        .isBoolean()
        .withMessage('Order updates preference must be a boolean'),
    (0, express_validator_1.body)('emailPreferences.promotions')
        .optional()
        .isBoolean()
        .withMessage('Promotions preference must be a boolean'),
];
exports.deleteAccountValidator = [
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required to delete account'),
];
exports.listCustomersValidator = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Search query is required'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
        .withMessage('Status must be one of: ACTIVE, INACTIVE, SUSPENDED'),
    (0, express_validator_1.query)('customerType')
        .optional()
        .isIn(['RETAIL', 'WHOLESALE', 'CORPORATE'])
        .withMessage('Customer type must be one of: RETAIL, WHOLESALE, CORPORATE'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['createdAt', 'name', 'email', 'totalOrders', 'totalSpent', 'lastOrderDate'])
        .withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
];
exports.getOrdersValidator = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('section')
        .optional()
        .isIn(['CAFE', 'FLOWERS', 'BOOKS'])
        .withMessage('Section must be one of: CAFE, FLOWERS, BOOKS'),
    (0, express_validator_1.query)('paymentStatus')
        .optional()
        .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.query)('orderStatus')
        .optional()
        .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid order status'),
];
exports.guestOrderLookupValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('orderNumber')
        .trim()
        .notEmpty()
        .withMessage('Order number is required'),
];
exports.customerIdParamValidator = [
    (0, express_validator_1.param)('customerId')
        .isUUID()
        .withMessage('Invalid customer ID'),
];
exports.orderIdParamValidator = [
    (0, express_validator_1.param)('orderId')
        .isUUID()
        .withMessage('Invalid order ID'),
];
//# sourceMappingURL=customer.validator.js.map