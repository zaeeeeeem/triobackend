"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = exports.CustomerController = void 0;
const express_validator_1 = require("express-validator");
const customer_service_1 = require("../services/customer.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
class CustomerController {
    /**
     * Get customer profile with statistics
     * GET /api/v1/customers/profile
     */
    async getProfile(req, res, next) {
        try {
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const result = await customer_service_1.customerService.getCustomerProfile(req.customer.id);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer profile
     * PATCH /api/v1/customers/profile
     */
    async updateProfile(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const customer = await customer_service_1.customerService.updateCustomer(req.customer.id, req.body);
            logger_1.logger.info(`Customer profile updated: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Change customer email
     * POST /api/v1/customers/change-email
     */
    async changeEmail(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { newEmail, password } = req.body;
            await customer_service_1.customerService.changeEmail(req.customer.id, newEmail, password);
            logger_1.logger.info(`Customer email changed: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Email changed successfully. Please verify your new email address.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Change customer password
     * POST /api/v1/customers/change-password
     */
    async changePassword(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { currentPassword, newPassword } = req.body;
            await customer_service_1.customerService.changePassword(req.customer.id, currentPassword, newPassword);
            logger_1.logger.info(`Customer password changed: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Password changed successfully. You have been logged out from all devices.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer preferences
     * PATCH /api/v1/customers/preferences
     */
    async updatePreferences(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const customer = await customer_service_1.customerService.updatePreferences(req.customer.id, req.body);
            logger_1.logger.info(`Customer preferences updated: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Preferences updated successfully',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete customer account
     * DELETE /api/v1/customers/account
     */
    async deleteAccount(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { password } = req.body;
            await customer_service_1.customerService.deleteCustomer(req.customer.id, password);
            logger_1.logger.info(`Customer account deleted: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Account deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer orders
     * GET /api/v1/customers/orders
     */
    async getOrders(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const result = await customer_service_1.customerService.getCustomerOrders(req.customer.id, req.query);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get single order details
     * GET /api/v1/customers/orders/:orderId
     */
    async getOrderById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { orderId } = req.params;
            const order = await customer_service_1.customerService.getOrderById(req.customer.id, orderId);
            res.status(200).json({
                success: true,
                data: { order },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer statistics
     * GET /api/v1/customers/statistics
     */
    async getStatistics(req, res, next) {
        try {
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const statistics = await customer_service_1.customerService.calculateStatistics(req.customer.id);
            res.status(200).json({
                success: true,
                data: { statistics },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
exports.customerController = new CustomerController();
//# sourceMappingURL=customer.controller.js.map