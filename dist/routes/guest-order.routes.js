"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guest_order_controller_1 = require("../controllers/guest-order.controller");
const customer_validator_1 = require("../validators/customer.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /guest-orders/lookup:
 *   post:
 *     summary: Lookup guest order by email and order number
 *     tags: [Guest Orders]
 *     description: Allows guests to track their orders without creating an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - orderNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address used during checkout
 *               orderNumber:
 *                 type: string
 *                 description: Order number (e.g., ORD-20231201-ABC123)
 *     responses:
 *       200:
 *         description: Order found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       description: Order details
 *                     hasAccount:
 *                       type: boolean
 *                       description: Whether this email has a registered account
 *       404:
 *         description: Order not found
 *       400:
 *         description: Validation error
 */
router.post('/lookup', customer_validator_1.guestOrderLookupValidator, guest_order_controller_1.guestOrderController.lookupOrder);
/**
 * @swagger
 * /guest-orders/check-email:
 *   post:
 *     summary: Check if email has guest orders
 *     tags: [Guest Orders]
 *     description: Used during checkout to suggest account creation if user has previous orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasGuestOrders:
 *                       type: boolean
 *                     guestOrderCount:
 *                       type: integer
 *                     message:
 *                       type: string
 *                       nullable: true
 */
router.post('/check-email', guest_order_controller_1.guestOrderController.checkEmail);
exports.default = router;
//# sourceMappingURL=guest-order.routes.js.map