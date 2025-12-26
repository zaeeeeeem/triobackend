"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const customer_auth_1 = require("../middleware/customer-auth");
const order_validator_1 = require("../validators/order.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (checkout) - Supports mixed-category orders
 *     description: >
 *       Works for both guests and authenticated customers. If `Authorization: Bearer <customer-token>` is supplied it is validated,
 *       but the payload must still include the `customer` object. The backend links the order to an existing customer by `customer.email`
 *       when possible; otherwise it stores it as a guest order. Items can come from CAFE, FLOWERS, and/or BOOKS sections (the section field is optional and auto-detects from the first item if omitted).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *             properties:
 *               customer:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "john@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+92 300 1234567"
 *               section:
 *                 type: string
 *                 enum: [CAFE, FLOWERS, BOOKS]
 *                 description: "Optional - If not provided, uses first item's section. Supports mixed-category orders (CAFE + FLOWERS + BOOKS in one order)."
 *                 example: "CAFE"
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     variantId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 1000
 *                       example: 2
 *               discountCode:
 *                 type: string
 *                 example: "SAVE10"
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "John Doe"
 *                   phone:
 *                     type: string
 *                     example: "+92 300 1234567"
 *                   email:
 *                     type: string
 *                     format: email
 *                   address:
 *                     type: string
 *                     example: "123 Main St, Apt 4"
 *                   city:
 *                     type: string
 *                     example: "Lahore"
 *                   state:
 *                     type: string
 *                     example: "Punjab"
 *                   postalCode:
 *                     type: string
 *                     example: "54000"
 *                   country:
 *                     type: string
 *                     example: "Pakistan"
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED]
 *               orderStatus:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["urgent", "gift"]
 *               paymentMethod:
 *                 type: string
 *                 example: "cash"
 *           examples:
 *             singleCategory:
 *               summary: Single-category order (CAFE only)
 *               value:
 *                 customer:
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   phone: "+92 300 1234567"
 *                 section: "CAFE"
 *                 items:
 *                   - productId: "550e8400-e29b-41d4-a716-446655440000"
 *                     quantity: 2
 *                 paymentMethod: "cash"
 *             mixedCategory:
 *               summary: Mixed-category order (CAFE + FLOWERS + BOOKS) ✨ NEW
 *               value:
 *                 customer:
 *                   name: "Sarah Ahmed"
 *                   email: "sarah@example.com"
 *                   phone: "+92 321 5551234"
 *                 items:
 *                   - productId: "cafe-product-uuid-123"
 *                     quantity: 2
 *                   - productId: "flowers-product-uuid-456"
 *                     quantity: 1
 *                   - productId: "books-product-uuid-789"
 *                     quantity: 1
 *                 shippingAddress:
 *                   fullName: "Sarah Ahmed"
 *                   phone: "+92 321 5551234"
 *                   address: "10 Garden Road"
 *                   city: "Islamabad"
 *                   state: "ICT"
 *                   postalCode: "44000"
 *                   country: "Pakistan"
 *                 notes: "Mixed order - Coffee, Flowers, and Book"
 *                 paymentMethod: "card"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', customer_auth_1.optionalCustomerAuth, order_validator_1.createOrderValidator, order_controller_1.orderController.create);
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders with filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number, customer name, or email
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [CAFE, FLOWERS, BOOKS]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [orderDate, total, orderNumber, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth_1.authenticate, order_validator_1.orderQueryValidator, order_controller_1.orderController.list);
/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [CAFE, FLOWERS, BOOKS]
 *     responses:
 *       200:
 *         description: Order statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', auth_1.authenticate, order_validator_1.orderStatsQueryValidator, order_controller_1.orderController.getStats);
/**
 * @swagger
 * /orders/export:
 *   get:
 *     summary: Export orders to CSV
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [CAFE, FLOWERS, BOOKS]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/export', auth_1.authenticate, order_validator_1.orderQueryValidator, order_controller_1.orderController.exportCsv);
/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_controller_1.orderController.getById);
/**
 * @swagger
 * /orders/{orderId}:
 *   patch:
 *     summary: Update order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED]
 *               orderStatus:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
router.patch('/:orderId', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_validator_1.updateOrderValidator, order_controller_1.orderController.update);
/**
 * @swagger
 * /orders/{orderId}/payment-status:
 *   patch:
 *     summary: Update payment status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       400:
 *         description: Invalid status transition
 */
router.patch('/:orderId/payment-status', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_validator_1.updatePaymentStatusValidator, order_controller_1.orderController.updatePaymentStatus);
/**
 * @swagger
 * /orders/{orderId}/fulfillment-status:
 *   patch:
 *     summary: Update fulfillment status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fulfillmentStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Fulfillment status updated
 *       400:
 *         description: Invalid status transition
 */
router.patch('/:orderId/order-status', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_validator_1.updateOrderStatusValidator, order_controller_1.orderController.updateOrderStatus);
/**
 * @swagger
 * /orders/{orderId}/duplicate:
 *   post:
 *     summary: Duplicate an existing order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Order duplicated successfully
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/duplicate', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_controller_1.orderController.duplicate);
/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Delete order (soft delete by default)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: hard
 *         schema:
 *           type: boolean
 *         description: Permanently delete order (admin only)
 *     responses:
 *       200:
 *         description: Order deleted
 *       400:
 *         description: Cannot delete paid/fulfilled orders
 *       404:
 *         description: Order not found
 */
router.delete('/:orderId', auth_1.authenticate, order_validator_1.orderIdParamValidator, order_validator_1.deleteOrderQueryValidator, order_controller_1.orderController.delete);
exports.default = router;
//# sourceMappingURL=order.routes.js.map