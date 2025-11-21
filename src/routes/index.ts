import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';

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

export default router;
