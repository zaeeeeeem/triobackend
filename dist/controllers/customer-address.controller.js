"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAddressController = exports.CustomerAddressController = void 0;
const express_validator_1 = require("express-validator");
const customer_address_service_1 = require("../services/customer-address.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
class CustomerAddressController {
    /**
     * List all addresses for the authenticated customer
     * GET /api/v1/customers/addresses
     */
    async listAddresses(req, res, next) {
        try {
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const result = await customer_address_service_1.customerAddressService.listAddresses(req.customer.id);
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
     * Get a specific address by ID
     * GET /api/v1/customers/addresses/:addressId
     */
    async getAddressById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { addressId } = req.params;
            const address = await customer_address_service_1.customerAddressService.getAddressById(req.customer.id, addressId);
            res.status(200).json({
                success: true,
                data: { address },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new address
     * POST /api/v1/customers/addresses
     */
    async createAddress(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const address = await customer_address_service_1.customerAddressService.createAddress(req.customer.id, req.body);
            logger_1.logger.info(`Address created: ${address.id} for customer ${req.customer.id}`);
            res.status(201).json({
                success: true,
                message: 'Address created successfully',
                data: { address },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update an existing address
     * PATCH /api/v1/customers/addresses/:addressId
     */
    async updateAddress(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { addressId } = req.params;
            const address = await customer_address_service_1.customerAddressService.updateAddress(req.customer.id, addressId, req.body);
            logger_1.logger.info(`Address updated: ${addressId}`);
            res.status(200).json({
                success: true,
                message: 'Address updated successfully',
                data: { address },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete an address
     * DELETE /api/v1/customers/addresses/:addressId
     */
    async deleteAddress(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { addressId } = req.params;
            await customer_address_service_1.customerAddressService.deleteAddress(req.customer.id, addressId);
            logger_1.logger.info(`Address deleted: ${addressId}`);
            res.status(200).json({
                success: true,
                message: 'Address deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Set an address as default (shipping or billing)
     * POST /api/v1/customers/addresses/:addressId/set-default
     */
    async setDefaultAddress(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { addressId } = req.params;
            const { type } = req.body;
            await customer_address_service_1.customerAddressService.setDefaultAddress(req.customer.id, addressId, type || 'shipping');
            logger_1.logger.info(`Default ${type || 'shipping'} address set: ${addressId}`);
            res.status(200).json({
                success: true,
                message: `Default ${type || 'shipping'} address set successfully`,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerAddressController = CustomerAddressController;
exports.customerAddressController = new CustomerAddressController();
//# sourceMappingURL=customer-address.controller.js.map