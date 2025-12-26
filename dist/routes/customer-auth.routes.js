"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_auth_controller_1 = require("../controllers/customer-auth.controller");
const customer_auth_1 = require("../middleware/customer-auth");
const customer_validator_1 = require("../validators/customer.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /customer-auth/register:
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
router.post('/register', customer_validator_1.registerCustomerValidator, customer_auth_controller_1.customerAuthController.register);
/**
 * @swagger
 * /customer-auth/login:
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
router.post('/login', customer_validator_1.loginCustomerValidator, customer_auth_controller_1.customerAuthController.login);
/**
 * @swagger
 * /customer-auth/refresh:
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
router.post('/refresh', customer_validator_1.refreshTokenValidator, customer_auth_controller_1.customerAuthController.refreshToken);
/**
 * @swagger
 * /customer-auth/logout:
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
router.post('/logout', customer_auth_1.authenticateCustomer, customer_validator_1.refreshTokenValidator, customer_auth_controller_1.customerAuthController.logout);
/**
 * @swagger
 * /customer-auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 */
router.post('/logout-all', customer_auth_1.authenticateCustomer, customer_auth_controller_1.customerAuthController.logoutAll);
/**
 * @swagger
 * /customer-auth/forgot-password:
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
router.post('/forgot-password', customer_validator_1.forgotPasswordValidator, customer_auth_controller_1.customerAuthController.forgotPassword);
/**
 * @swagger
 * /customer-auth/reset-password:
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
router.post('/reset-password', customer_validator_1.resetPasswordValidator, customer_auth_controller_1.customerAuthController.resetPassword);
/**
 * @swagger
 * /customer-auth/verify-email:
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
router.get('/verify-email', customer_validator_1.verifyEmailValidator, customer_auth_controller_1.customerAuthController.verifyEmail);
/**
 * @swagger
 * /customer-auth/resend-verification:
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
router.post('/resend-verification', customer_validator_1.resendVerificationValidator, customer_auth_controller_1.customerAuthController.resendVerification);
/**
 * @swagger
 * /customer-auth/me:
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
router.get('/me', customer_auth_1.authenticateCustomer, customer_auth_controller_1.customerAuthController.getMe);
/**
 * @swagger
 * /customer-auth/guest-token:
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
router.post('/guest-token', customer_auth_controller_1.customerAuthController.generateGuestToken);
exports.default = router;
//# sourceMappingURL=customer-auth.routes.js.map