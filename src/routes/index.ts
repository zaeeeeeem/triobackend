import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import customerAuthRoutes from './customer-auth.routes';
import customerRoutes from './customer.routes';
import customerAddressRoutes from './customer-address.routes';
import adminCustomerRoutes from './admin-customer.routes';
import guestOrderRoutes from './guest-order.routes';

const router = Router();

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
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

// Customer authentication and management routes
router.use('/customer-auth', customerAuthRoutes);
router.use('/customers', customerRoutes);
router.use('/customers/addresses', customerAddressRoutes);

// Guest order routes
router.use('/guest-orders', guestOrderRoutes);

// Admin customer management routes
router.use('/admin/customers', adminCustomerRoutes);

export default router;
