"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestOrderController = exports.GuestOrderController = void 0;
const express_validator_1 = require("express-validator");
const guest_order_service_1 = require("../services/guest-order.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Controller for guest order operations
 */
class GuestOrderController {
    /**
     * Lookup guest order by email and order number
     * POST /api/v1/guest-orders/lookup
     */
    async lookupOrder(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { email, orderNumber } = req.body;
            const result = await guest_order_service_1.guestOrderService.lookupGuestOrder(email, orderNumber);
            if (!result) {
                throw new errors_1.NotFoundError('Order', `with email ${email} and order number ${orderNumber}`);
            }
            logger_1.logger.info(`Guest order lookup: ${orderNumber} for ${email}`);
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
     * Check if email has guest orders
     * POST /api/v1/guest-orders/check-email
     */
    async checkEmail(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                throw new errors_1.ValidationError('Email is required');
            }
            const hasOrders = await guest_order_service_1.guestOrderService.hasGuestOrders(email);
            const orderCount = hasOrders ? await guest_order_service_1.guestOrderService.getGuestOrderCount(email) : 0;
            res.status(200).json({
                success: true,
                data: {
                    hasGuestOrders: hasOrders,
                    guestOrderCount: orderCount,
                    message: hasOrders
                        ? `You have ${orderCount} previous order(s). Create an account to track all your orders!`
                        : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GuestOrderController = GuestOrderController;
exports.guestOrderController = new GuestOrderController();
//# sourceMappingURL=guest-order.controller.js.map