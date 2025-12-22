"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestOrderService = exports.GuestOrderService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const crypto_1 = require("crypto");
class GuestOrderService {
    /**
     * Link all guest orders with matching email to a customer account
     * This is called automatically during customer registration
     */
    async linkGuestOrdersToCustomer(customerId, email) {
        try {
            logger_1.logger.info(`Linking guest orders for email: ${email} to customer: ${customerId}`);
            // Find all guest orders with this email
            const guestOrders = await database_1.default.order.findMany({
                where: {
                    customerEmail: email,
                    customerId: null,
                    guestOrder: true,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                },
            });
            if (guestOrders.length === 0) {
                logger_1.logger.info(`No guest orders found for email: ${email}`);
                return 0;
            }
            logger_1.logger.info(`Found ${guestOrders.length} guest orders to link`);
            // Update all guest orders to link to customer
            await database_1.default.order.updateMany({
                where: {
                    customerEmail: email,
                    customerId: null,
                    guestOrder: true,
                },
                data: {
                    customerId: customerId,
                    guestOrder: false,
                },
            });
            // Calculate statistics for the customer
            const orderStats = await this.calculateOrderStatistics(customerId);
            // Update customer with order statistics
            await database_1.default.customer.update({
                where: { id: customerId },
                data: {
                    totalOrders: orderStats.totalOrders,
                    totalSpent: orderStats.totalSpent,
                    averageOrderValue: orderStats.averageOrderValue,
                    lastOrderDate: orderStats.lastOrderDate,
                    createdFromGuest: true,
                },
            });
            logger_1.logger.info(`Successfully linked ${guestOrders.length} guest orders to customer ${customerId}`);
            return guestOrders.length;
        }
        catch (error) {
            logger_1.logger.error('Error linking guest orders:', error);
            throw error;
        }
    }
    /**
     * Calculate order statistics for a customer
     */
    async calculateOrderStatistics(customerId) {
        const orders = await database_1.default.order.findMany({
            where: {
                customerId: customerId,
                deletedAt: null,
            },
            select: {
                total: true,
                orderDate: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrderDate = orders[0]?.orderDate || null;
        return {
            totalOrders,
            totalSpent,
            averageOrderValue,
            lastOrderDate,
        };
    }
    /**
     * Lookup a guest order by email and order number
     * Used by guest customers to track their orders without an account
     */
    async lookupGuestOrder(email, orderNumber) {
        try {
            const order = await database_1.default.order.findFirst({
                where: {
                    customerEmail: email,
                    orderNumber: orderNumber,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    orderDate: true,
                    total: true,
                    paymentStatus: true,
                    fulfillmentStatus: true,
                    customerId: true,
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            quantity: true,
                            price: true,
                            total: true,
                        },
                    },
                    shippingAddress: {
                        select: {
                            fullName: true,
                            address: true,
                            city: true,
                            state: true,
                            postalCode: true,
                            country: true,
                        }
                    },
                },
            });
            if (!order) {
                return null;
            }
            // Check if customer has an account
            const hasAccount = order.customerId !== null;
            return {
                order: {
                    orderNumber: order.orderNumber,
                    date: order.orderDate,
                    total: order.total,
                    paymentStatus: order.paymentStatus,
                    fulfillmentStatus: order.fulfillmentStatus,
                    items: order.items,
                    shippingAddress: order.shippingAddress,
                },
                hasAccount,
            };
        }
        catch (error) {
            logger_1.logger.error('Error looking up guest order:', error);
            throw error;
        }
    }
    /**
     * Generate a temporary guest token for cart/session tracking
     */
    generateGuestToken(deviceId) {
        const guestId = `guest-${(0, crypto_1.randomBytes)(16).toString('hex')}`;
        const payload = {
            sub: guestId,
            type: 'guest',
            deviceId,
        };
        const expiresIn = env_1.env.GUEST_TOKEN_EXPIRES_IN || 604800; // 7 days in seconds
        const guestToken = jsonwebtoken_1.default.sign(payload, env_1.env.CUSTOMER_JWT_SECRET, {
            expiresIn,
        });
        return {
            guestToken,
            expiresIn,
        };
    }
    /**
     * Verify a guest token
     */
    verifyGuestToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.CUSTOMER_JWT_SECRET);
            if (decoded.type !== 'guest') {
                return null;
            }
            return decoded;
        }
        catch (error) {
            logger_1.logger.debug('Invalid guest token:', error);
            return null;
        }
    }
    /**
     * Check if there are any guest orders for a given email
     * Used to suggest account creation during checkout
     */
    async hasGuestOrders(email) {
        const count = await database_1.default.order.count({
            where: {
                customerEmail: email,
                customerId: null,
                guestOrder: true,
            },
        });
        return count > 0;
    }
    /**
     * Get count of guest orders for an email
     */
    async getGuestOrderCount(email) {
        return await database_1.default.order.count({
            where: {
                customerEmail: email,
                customerId: null,
                guestOrder: true,
            },
        });
    }
}
exports.GuestOrderService = GuestOrderService;
exports.guestOrderService = new GuestOrderService();
//# sourceMappingURL=guest-order.service.js.map