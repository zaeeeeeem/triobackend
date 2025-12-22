"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCustomerController = exports.AdminCustomerController = void 0;
const express_validator_1 = require("express-validator");
const customer_service_1 = require("../services/customer.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Admin controller for managing customers
 * These endpoints are for admin users to manage customer accounts
 */
class AdminCustomerController {
    /**
     * List all customers with filtering and pagination
     * GET /api/v1/admin/customers
     */
    async listCustomers(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const result = await customer_service_1.customerService.listCustomers(req.query);
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
     * Get customer by ID with full details
     * GET /api/v1/admin/customers/:customerId
     */
    async getCustomerById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { customerId } = req.params;
            const customer = await customer_service_1.customerService.getCustomerById(customerId);
            res.status(200).json({
                success: true,
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer profile with statistics
     * GET /api/v1/admin/customers/:customerId/profile
     */
    async getCustomerProfile(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { customerId } = req.params;
            const result = await customer_service_1.customerService.getCustomerProfile(customerId);
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
     * Create a new customer (admin)
     * POST /api/v1/admin/customers
     */
    async createCustomer(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const customer = await customer_service_1.customerService.createCustomer(req.body);
            logger_1.logger.info(`Customer created by admin: ${customer.id}`);
            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer (admin)
     * PATCH /api/v1/admin/customers/:customerId
     */
    async updateCustomer(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { customerId } = req.params;
            const customer = await customer_service_1.customerService.updateCustomer(customerId, req.body);
            logger_1.logger.info(`Customer updated by admin: ${customerId}`);
            res.status(200).json({
                success: true,
                message: 'Customer updated successfully',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer orders (admin)
     * GET /api/v1/admin/customers/:customerId/orders
     */
    async getCustomerOrders(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { customerId } = req.params;
            const result = await customer_service_1.customerService.getCustomerOrders(customerId, req.query);
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
     * Get customer statistics (admin)
     * GET /api/v1/admin/customers/:customerId/statistics
     */
    async getCustomerStatistics(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { customerId } = req.params;
            const statistics = await customer_service_1.customerService.calculateStatistics(customerId);
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
exports.AdminCustomerController = AdminCustomerController;
exports.adminCustomerController = new AdminCustomerController();
//# sourceMappingURL=admin-customer.controller.js.map