import { Router } from 'express';
import { adminCustomerController } from '../controllers/admin-customer.controller';
import { authenticate, authorize } from '../middleware/auth';
import {
  listCustomersValidator,
  customerIdParamValidator,
  updateCustomerValidator,
  getOrdersValidator,
} from '../validators/customer.validator';

const router = Router();

// All routes require admin authentication and authorization
router.use(authenticate);
router.use(authorize(['admin', 'manager']));

/**
 * @swagger
 * /api/v1/admin/customers:
 *   get:
 *     summary: List all customers with filtering and pagination (Admin)
 *     tags: [Admin - Customer Management]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [RETAIL, WHOLESALE, CORPORATE]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email, totalOrders, totalSpent, lastOrderDate]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', listCustomersValidator, adminCustomerController.listCustomers);

/**
 * @swagger
 * /api/v1/admin/customers:
 *   post:
 *     summary: Create a new customer (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               customerType:
 *                 type: string
 *                 enum: [RETAIL, WHOLESALE, CORPORATE]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               sendWelcomeEmail:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/', adminCustomerController.createCustomer);

/**
 * @swagger
 * /api/v1/admin/customers/{customerId}:
 *   get:
 *     summary: Get customer by ID (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get('/:customerId', customerIdParamValidator, adminCustomerController.getCustomerById);

/**
 * @swagger
 * /api/v1/admin/customers/{customerId}/profile:
 *   get:
 *     summary: Get customer profile with statistics (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get(
  '/:customerId/profile',
  customerIdParamValidator,
  adminCustomerController.getCustomerProfile
);

/**
 * @swagger
 * /api/v1/admin/customers/{customerId}:
 *   patch:
 *     summary: Update customer (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               customerType:
 *                 type: string
 *                 enum: [RETAIL, WHOLESALE, CORPORATE]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.patch(
  '/:customerId',
  customerIdParamValidator,
  updateCustomerValidator,
  adminCustomerController.updateCustomer
);

/**
 * @swagger
 * /api/v1/admin/customers/{customerId}/orders:
 *   get:
 *     summary: Get customer orders (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [CAFE, FLOWERS, BOOKS]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get(
  '/:customerId/orders',
  customerIdParamValidator,
  getOrdersValidator,
  adminCustomerController.getCustomerOrders
);

/**
 * @swagger
 * /api/v1/admin/customers/{customerId}/statistics:
 *   get:
 *     summary: Get customer statistics (Admin)
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get(
  '/:customerId/statistics',
  customerIdParamValidator,
  adminCustomerController.getCustomerStatistics
);

export default router;
