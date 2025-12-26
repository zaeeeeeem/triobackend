"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressIdParamValidator = exports.setDefaultAddressValidator = exports.updateAddressValidator = exports.createAddressValidator = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation schemas for customer address endpoints
 */
exports.createAddressValidator = [
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company name must be less than 100 characters'),
    (0, express_validator_1.body)('addressLine1')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address line 1 must be between 5 and 200 characters'),
    (0, express_validator_1.body)('addressLine2')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address line 2 must be less than 200 characters'),
    (0, express_validator_1.body)('city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),
    (0, express_validator_1.body)('postalCode')
        .trim()
        .matches(/^[\d\s\-A-Za-z]+$/)
        .withMessage('Invalid postal code format')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('country')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
    (0, express_validator_1.body)('isDefaultBilling')
        .optional()
        .isBoolean()
        .withMessage('isDefaultBilling must be a boolean'),
    (0, express_validator_1.body)('label')
        .optional()
        .trim()
        .isIn(['home', 'work', 'other'])
        .withMessage('Label must be one of: home, work, other'),
];
exports.updateAddressValidator = [
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
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company name must be less than 100 characters'),
    (0, express_validator_1.body)('addressLine1')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address line 1 must be between 5 and 200 characters'),
    (0, express_validator_1.body)('addressLine2')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address line 2 must be less than 200 characters'),
    (0, express_validator_1.body)('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),
    (0, express_validator_1.body)('postalCode')
        .optional()
        .trim()
        .matches(/^[\d\s\-A-Za-z]+$/)
        .withMessage('Invalid postal code format')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
    (0, express_validator_1.body)('isDefaultBilling')
        .optional()
        .isBoolean()
        .withMessage('isDefaultBilling must be a boolean'),
    (0, express_validator_1.body)('label')
        .optional()
        .trim()
        .isIn(['home', 'work', 'other'])
        .withMessage('Label must be one of: home, work, other'),
];
exports.setDefaultAddressValidator = [
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['shipping', 'billing'])
        .withMessage('Type must be either shipping or billing'),
];
exports.addressIdParamValidator = [
    (0, express_validator_1.param)('addressId')
        .isUUID()
        .withMessage('Invalid address ID'),
];
//# sourceMappingURL=address.validator.js.map