import { Router } from 'express';
import { customerAuthController } from '../controllers/customer-auth.controller';
import { authenticateCustomer } from '../middleware/customer-auth';
import {
  registerCustomerValidator,
  loginCustomerValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} from '../validators/customer.validator';

const router = Router();

/**
 * @swagger
 * /api/v1/customer-auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               marketingConsent:
 *                 type: boolean
 *               smsConsent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', registerCustomerValidator, customerAuthController.register);

/**
 * @swagger
 * /api/v1/customer-auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginCustomerValidator, customerAuthController.login);

/**
 * @swagger
 * /api/v1/customer-auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refreshTokenValidator, customerAuthController.refreshToken);

/**
 * @swagger
 * /api/v1/customer-auth/logout:
 *   post:
 *     summary: Logout - invalidate refresh token
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticateCustomer, customerAuthController.logout);

/**
 * @swagger
 * /api/v1/customer-auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 */
router.post('/logout-all', authenticateCustomer, customerAuthController.logoutAll);

/**
 * @swagger
 * /api/v1/customer-auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Customer Authentication]
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
 *         description: Password reset email sent if account exists
 */
router.post('/forgot-password', forgotPasswordValidator, customerAuthController.forgotPassword);

/**
 * @swagger
 * /api/v1/customer-auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordValidator, customerAuthController.resetPassword);

/**
 * @swagger
 * /api/v1/customer-auth/verify-email:
 *   get:
 *     summary: Verify email with token
 *     tags: [Customer Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', verifyEmailValidator, customerAuthController.verifyEmail);

/**
 * @swagger
 * /api/v1/customer-auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Customer Authentication]
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
 *         description: Verification email sent
 */
router.post(
  '/resend-verification',
  resendVerificationValidator,
  customerAuthController.resendVerification
);

/**
 * @swagger
 * /api/v1/customer-auth/me:
 *   get:
 *     summary: Get current authenticated customer's info
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current customer info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateCustomer, customerAuthController.getMe);

/**
 * @swagger
 * /api/v1/customer-auth/guest-token:
 *   post:
 *     summary: Generate guest token for anonymous checkout
 *     tags: [Customer Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guest token generated successfully
 */
router.post('/guest-token', customerAuthController.generateGuestToken);

export default router;
