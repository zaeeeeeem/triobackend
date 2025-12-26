"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const customer_auth_routes_1 = __importDefault(require("./customer-auth.routes"));
const customer_routes_1 = __importDefault(require("./customer.routes"));
const customer_address_routes_1 = __importDefault(require("./customer-address.routes"));
const admin_customer_routes_1 = __importDefault(require("./admin-customer.routes"));
const guest_order_routes_1 = __importDefault(require("./guest-order.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: TRIO API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: v1
 */
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'TRIO API is running',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || 'v1',
    });
});
// API routes
router.use('/auth', auth_routes_1.default);
router.use('/products', product_routes_1.default);
// Customer authentication and management routes
router.use('/customer-auth', customer_auth_routes_1.default);
router.use('/customers', customer_routes_1.default);
router.use('/customers/addresses', customer_address_routes_1.default);
// Guest order routes
router.use('/guest-orders', guest_order_routes_1.default);
// Order management routes
router.use('/orders', order_routes_1.default);
// Admin customer management routes
router.use('/admin/customers', admin_customer_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map