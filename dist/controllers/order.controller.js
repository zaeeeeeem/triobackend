"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.OrderController = void 0;
const express_validator_1 = require("express-validator");
const order_service_1 = require("../services/order.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Order Controller
 * Handles all order-related HTTP requests
 */
class OrderController {
    /**
     * Create a new order
     * POST /api/v1/orders
     */
    async create(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const data = req.body;
            const createdBy = req.user?.id; // Optional (guest/system)
            const customerContext = req.customer
                ? {
                    id: req.customer.id,
                    email: req.customer.email,
                }
                : undefined;
            const order = await order_service_1.orderService.createOrder(data, createdBy, customerContext);
            logger_1.logger.info(`Order created: ${order.orderNumber} by ${createdBy ?? 'system'}`);
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get order by ID
     * GET /api/v1/orders/:orderId
     */
    async getById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const order = await order_service_1.orderService.getOrderById(orderId);
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get order by order number
     * GET /api/v1/orders/number/:orderNumber
     */
    async getByNumber(req, res, next) {
        try {
            const { orderNumber } = req.params;
            const order = await order_service_1.orderService.getOrderByNumber(orderNumber);
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List all orders with filters
     * GET /api/v1/orders
     */
    async list(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const params = {
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                search: req.query.search,
                section: req.query.section,
                paymentStatus: req.query.paymentStatus,
                orderStatus: req.query.orderStatus,
                customerId: req.query.customerId,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
            };
            const result = await order_service_1.orderService.listOrders(params);
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
     * Update order
     * PATCH /api/v1/orders/:orderId
     */
    async update(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const data = req.body;
            const order = await order_service_1.orderService.updateOrder(orderId, data);
            logger_1.logger.info(`Order updated: ${order.orderNumber}`);
            res.status(200).json({
                success: true,
                message: 'Order updated successfully',
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update payment status
     * PATCH /api/v1/orders/:orderId/payment-status
     */
    async updatePaymentStatus(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const { paymentStatus } = req.body;
            const order = await order_service_1.orderService.updatePaymentStatus(orderId, paymentStatus);
            logger_1.logger.info(`Payment status updated for ${order.orderNumber}: ${paymentStatus}`);
            res.status(200).json({
                success: true,
                message: 'Payment status updated successfully',
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update order status
     * PATCH /api/v1/orders/:orderId/order-status
     */
    async updateOrderStatus(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const { orderStatus } = req.body;
            const order = await order_service_1.orderService.updateOrderStatus(orderId, orderStatus);
            logger_1.logger.info(`Order status updated for ${order.orderNumber}: ${orderStatus}`);
            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete order
     * DELETE /api/v1/orders/:orderId
     */
    async delete(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const hard = req.query.hard === 'true';
            await order_service_1.orderService.deleteOrder(orderId, hard);
            logger_1.logger.info(`Order ${hard ? 'hard' : 'soft'} deleted: ${orderId}`);
            res.status(200).json({
                success: true,
                message: 'Order deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Duplicate order
     * POST /api/v1/orders/:orderId/duplicate
     */
    async duplicate(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { orderId } = req.params;
            const createdBy = req.user?.id;
            const newOrder = await order_service_1.orderService.duplicateOrder(orderId, createdBy);
            logger_1.logger.info(`Order duplicated: ${orderId} → ${newOrder.orderNumber} by ${createdBy ?? 'system'}`);
            res.status(201).json({
                success: true,
                message: 'Order duplicated successfully',
                data: newOrder,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get order statistics
     * GET /api/v1/orders/stats
     */
    async getStats(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const params = {
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                section: req.query.section,
            };
            const stats = await order_service_1.orderService.getOrderStats(params);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Export orders to CSV
     * GET /api/v1/orders/export
     */
    async exportCsv(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const params = {
                search: req.query.search,
                section: req.query.section,
                paymentStatus: req.query.paymentStatus,
                orderStatus: req.query.orderStatus,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
            };
            const csv = await order_service_1.orderService.exportOrdersToCsv(params);
            const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(csv);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrderController = OrderController;
// Export singleton instance
exports.orderController = new OrderController();
//# sourceMappingURL=order.controller.js.map