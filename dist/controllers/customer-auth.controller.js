"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAuthController = exports.CustomerAuthController = void 0;
const express_validator_1 = require("express-validator");
const customer_auth_service_1 = require("../services/customer-auth.service");
const guest_order_service_1 = require("../services/guest-order.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
class CustomerAuthController {
    /**
     * Register a new customer account
     * POST /api/v1/customer-auth/register
     */
    async register(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const result = await customer_auth_service_1.customerAuthService.register(req.body);
            logger_1.logger.info(`Customer registered: ${result.customer.id} (${result.customer.email})`);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login with email and password
     * POST /api/v1/customer-auth/login
     */
    async login(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const result = await customer_auth_service_1.customerAuthService.login(req.body);
            logger_1.logger.info(`Customer logged in: ${result.customer.id} (${result.customer.email})`);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refresh access token using refresh token
     * POST /api/v1/customer-auth/refresh
     */
    async refreshToken(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { refreshToken } = req.body;
            const tokens = await customer_auth_service_1.customerAuthService.refreshAccessToken(refreshToken);
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: tokens,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout - invalidate refresh token
     * POST /api/v1/customer-auth/logout
     */
    async logout(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            const { refreshToken } = req.body;
            await customer_auth_service_1.customerAuthService.logout(req.customer.id, refreshToken);
            logger_1.logger.info(`Customer logged out: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout from all devices
     * POST /api/v1/customer-auth/logout-all
     */
    async logoutAll(req, res, next) {
        try {
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            await customer_auth_service_1.customerAuthService.logoutAll(req.customer.id);
            logger_1.logger.info(`Customer logged out from all devices: ${req.customer.id}`);
            res.status(200).json({
                success: true,
                message: 'Logged out from all devices successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Request password reset
     * POST /api/v1/customer-auth/forgot-password
     */
    async forgotPassword(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { email } = req.body;
            await customer_auth_service_1.customerAuthService.forgotPassword(email);
            // Always return success to prevent email enumeration
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reset password with token
     * POST /api/v1/customer-auth/reset-password
     */
    async resetPassword(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { token, newPassword } = req.body;
            await customer_auth_service_1.customerAuthService.resetPassword(token, newPassword);
            res.status(200).json({
                success: true,
                message: 'Password reset successful. Please login with your new password.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verify email with token
     * GET /api/v1/customer-auth/verify-email?token=...
     */
    async verifyEmail(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { token } = req.query;
            await customer_auth_service_1.customerAuthService.verifyEmail(token);
            res.status(200).json({
                success: true,
                message: 'Email verified successfully. Welcome to TRIO!',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Resend verification email
     * POST /api/v1/customer-auth/resend-verification
     */
    async resendVerification(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errors_1.ValidationError('Validation failed', { errors: errors.array() });
            }
            const { email } = req.body;
            await customer_auth_service_1.customerAuthService.resendVerificationEmail(email);
            res.status(200).json({
                success: true,
                message: 'Verification email sent successfully. Please check your inbox.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current authenticated customer's info
     * GET /api/v1/customer-auth/me
     */
    async getMe(req, res, next) {
        try {
            if (!req.customer) {
                throw new errors_1.ValidationError('Authentication required');
            }
            res.status(200).json({
                success: true,
                data: {
                    customer: req.customer,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate guest token for anonymous checkout
     * POST /api/v1/customer-auth/guest-token
     */
    async generateGuestToken(req, res, next) {
        try {
            const { deviceId } = req.body;
            const result = guest_order_service_1.guestOrderService.generateGuestToken(deviceId);
            res.status(200).json({
                success: true,
                message: 'Guest token generated successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerAuthController = CustomerAuthController;
exports.customerAuthController = new CustomerAuthController();
//# sourceMappingURL=customer-auth.controller.js.map