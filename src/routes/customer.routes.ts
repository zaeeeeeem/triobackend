import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticateCustomer } from '../middleware/customer-auth';
import {
  updateCustomerValidator,
  changeEmailValidator,
  changePasswordValidator,
  updatePreferencesValidator,
  deleteAccountValidator,
  getOrdersValidator,
  orderIdParamValidator,
} from '../validators/customer.validator';

const router = Router();

// All routes require authentication
router.use(authenticateCustomer);

/**
 * @swagger
 * /api/v1/customers/profile:
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
router.get('/profile', customerController.getProfile);

/**
 * @swagger
 * /api/v1/customers/profile:
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
router.patch('/profile', updateCustomerValidator, customerController.updateProfile);

/**
 * @swagger
 * /api/v1/customers/change-email:
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
router.post('/change-email', changeEmailValidator, customerController.changeEmail);

/**
 * @swagger
 * /api/v1/customers/change-password:
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
router.post('/change-password', changePasswordValidator, customerController.changePassword);

/**
 * @swagger
 * /api/v1/customers/preferences:
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
router.patch('/preferences', updatePreferencesValidator, customerController.updatePreferences);

/**
 * @swagger
 * /api/v1/customers/account:
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
router.delete('/account', deleteAccountValidator, customerController.deleteAccount);

/**
 * @swagger
 * /api/v1/customers/orders:
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
router.get('/orders', getOrdersValidator, customerController.getOrders);

/**
 * @swagger
 * /api/v1/customers/orders/{orderId}:
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
router.get('/orders/:orderId', orderIdParamValidator, customerController.getOrderById);

/**
 * @swagger
 * /api/v1/customers/statistics:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', customerController.getStatistics);

export default router;
