"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const customer_auth_1 = require("../middleware/customer-auth");
const customer_validator_1 = require("../validators/customer.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(customer_auth_1.authenticateCustomer);
/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Get customer profile with statistics
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', customer_controller_1.customerController.getProfile);
/**
 * @swagger
 * /customers/profile:
 *   patch:
 *     summary: Update customer profile
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, ur, ar]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.patch('/profile', customer_validator_1.updateCustomerValidator, customer_controller_1.customerController.updateProfile);
/**
 * @swagger
 * /customers/change-email:
 *   post:
 *     summary: Change customer email
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email changed successfully
 *       401:
 *         description: Invalid password
 *       409:
 *         description: Email already in use
 */
router.post('/change-email', customer_validator_1.changeEmailValidator, customer_controller_1.customerController.changeEmail);
/**
 * @swagger
 * /customers/change-password:
 *   post:
 *     summary: Change customer password
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid current password
 */
router.post('/change-password', customer_validator_1.changePasswordValidator, customer_controller_1.customerController.changePassword);
/**
 * @swagger
 * /customers/preferences:
 *   patch:
 *     summary: Update customer preferences
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marketingConsent:
 *                 type: boolean
 *               smsConsent:
 *                 type: boolean
 *               emailPreferences:
 *                 type: object
 *                 properties:
 *                   newsletter:
 *                     type: boolean
 *                   orderUpdates:
 *                     type: boolean
 *                   promotions:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.patch('/preferences', customer_validator_1.updatePreferencesValidator, customer_controller_1.customerController.updatePreferences);
/**
 * @swagger
 * /customers/account:
 *   delete:
 *     summary: Delete customer account (soft delete)
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Invalid password
 */
router.delete('/account', customer_validator_1.deleteAccountValidator, customer_controller_1.customerController.deleteAccount);
/**
 * @swagger
 * /customers/orders:
 *   get:
 *     summary: Get customer orders with filtering and pagination
 *     tags: [Customer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
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
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders', customer_validator_1.getOrdersValidator, customer_controller_1.customerController.getOrders);
/**
 * @swagger
 * /customers/orders/{orderId}:
 *   get:
 *     summary: Get single order details
 *     tags: [Customer Orders]
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
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/orders/:orderId', customer_validator_1.orderIdParamValidator, customer_controller_1.customerController.getOrderById);
/**
 * @swagger
 * /customers/statistics:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', customer_controller_1.customerController.getStatistics);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map