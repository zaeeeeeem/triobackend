import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { optionalCustomerAuth } from '../middleware/customer-auth';
import {
  createOrderValidator,
  updateOrderValidator,
  updatePaymentStatusValidator,
  updateFulfillmentStatusValidator,
  orderQueryValidator,
  orderStatsQueryValidator,
  orderIdParamValidator,
  deleteOrderQueryValidator,
} from '../validators/order.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order (checkout)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - section
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
 *               fulfillmentStatus:
 *                 type: string
 *                 enum: [UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
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
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', optionalCustomerAuth, createOrderValidator, orderController.create);

/**
 * @swagger
 * /api/v1/orders:
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
 *         name: fulfillmentStatus
 *         schema:
 *           type: string
 *           enum: [UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
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
router.get('/', authenticate, orderQueryValidator, orderController.list);

/**
 * @swagger
 * /api/v1/orders/stats:
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
router.get('/stats', authenticate, orderStatsQueryValidator, orderController.getStats);

/**
 * @swagger
 * /api/v1/orders/export:
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
 *         name: fulfillmentStatus
 *         schema:
 *           type: string
 *           enum: [UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
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
router.get('/export', authenticate, orderQueryValidator, orderController.exportCsv);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
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
router.get('/:orderId', authenticate, orderIdParamValidator, orderController.getById);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
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
 *               fulfillmentStatus:
 *                 type: string
 *                 enum: [UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
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
router.patch(
  '/:orderId',
  authenticate,
  orderIdParamValidator,
  updateOrderValidator,
  orderController.update
);

/**
 * @swagger
 * /api/v1/orders/{orderId}/payment-status:
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
router.patch(
  '/:orderId/payment-status',
  authenticate,
  orderIdParamValidator,
  updatePaymentStatusValidator,
  orderController.updatePaymentStatus
);

/**
 * @swagger
 * /api/v1/orders/{orderId}/fulfillment-status:
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
 *               fulfillmentStatus:
 *                 type: string
 *                 enum: [UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Fulfillment status updated
 *       400:
 *         description: Invalid status transition
 */
router.patch(
  '/:orderId/fulfillment-status',
  authenticate,
  orderIdParamValidator,
  updateFulfillmentStatusValidator,
  orderController.updateFulfillmentStatus
);

/**
 * @swagger
 * /api/v1/orders/{orderId}/duplicate:
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
router.post(
  '/:orderId/duplicate',
  authenticate,
  orderIdParamValidator,
  orderController.duplicate
);

/**
 * @swagger
 * /api/v1/orders/{orderId}:
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
router.delete(
  '/:orderId',
  authenticate,
  orderIdParamValidator,
  deleteOrderQueryValidator,
  orderController.delete
);

export default router;
