"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAuthService = exports.CustomerAuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const database_1 = __importDefault(require("../config/database"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const email_service_1 = require("./email.service");
const guest_order_service_1 = require("./guest-order.service");
class CustomerAuthService {
    SALT_ROUNDS = 12;
    /**
     * Register a new customer
     */
    async register(data) {
        try {
            // Check if email already exists
            const existingCustomer = await database_1.default.customer.findUnique({
                where: { email: data.email },
            });
            if (existingCustomer && existingCustomer.passwordHash) {
                throw new errors_1.ConflictError('An account with this email already exists. Please login.');
            }
            // If customer exists without password (guest-converted), update with password
            if (existingCustomer && !existingCustomer.passwordHash) {
                return await this.updateGuestCustomerWithPassword(existingCustomer.id, data);
            }
            // Validate password strength
            this.validatePasswordStrength(data.password);
            // Hash password
            const passwordHash = await bcryptjs_1.default.hash(data.password, this.SALT_ROUNDS);
            // Generate email verification token
            const emailVerificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            // Create customer
            const customer = await database_1.default.customer.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    marketingConsent: data.marketingConsent || false,
                    smsConsent: data.smsConsent || false,
                    emailVerificationToken,
                    emailVerificationExpiry,
                    registrationSource: 'web',
                },
            });
            logger_1.logger.info(`New customer registered: ${customer.id} (${customer.email})`);
            // Link any existing guest orders
            const guestOrdersLinked = await guest_order_service_1.guestOrderService.linkGuestOrdersToCustomer(customer.id, customer.email);
            // Generate tokens
            const tokens = await this.generateTokens(customer);
            // Send verification email
            await email_service_1.emailService.sendVerificationEmail(customer.email, customer.name, emailVerificationToken);
            // Prepare response
            const customerResponse = this.sanitizeCustomer(customer);
            return {
                customer: customerResponse,
                tokens,
                guestOrdersLinked: guestOrdersLinked > 0 ? guestOrdersLinked : undefined,
            };
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            throw error;
        }
    }
    /**
     * Update a guest-converted customer with password
     */
    async updateGuestCustomerWithPassword(customerId, data) {
        this.validatePasswordStrength(data.password);
        const passwordHash = await bcryptjs_1.default.hash(data.password, this.SALT_ROUNDS);
        const emailVerificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const customer = await database_1.default.customer.update({
            where: { id: customerId },
            data: {
                passwordHash,
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                marketingConsent: data.marketingConsent || false,
                smsConsent: data.smsConsent || false,
                emailVerificationToken,
                emailVerificationExpiry,
                registrationSource: 'guest_conversion',
            },
        });
        const tokens = await this.generateTokens(customer);
        await email_service_1.emailService.sendVerificationEmail(customer.email, customer.name, emailVerificationToken);
        const guestOrdersLinked = await guest_order_service_1.guestOrderService.linkGuestOrdersToCustomer(customer.id, customer.email);
        return {
            customer: this.sanitizeCustomer(customer),
            tokens,
            guestOrdersLinked: guestOrdersLinked > 0 ? guestOrdersLinked : undefined,
        };
    }
    /**
     * Login customer
     */
    async login(data) {
        try {
            // Find customer by email
            const customer = await database_1.default.customer.findUnique({
                where: { email: data.email },
            });
            if (!customer || !customer.passwordHash) {
                throw new errors_1.UnauthorizedError('Invalid email or password');
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(data.password, customer.passwordHash);
            if (!isPasswordValid) {
                throw new errors_1.UnauthorizedError('Invalid email or password');
            }
            // Check if account is suspended
            if (customer.status === 'SUSPENDED') {
                throw new errors_1.UnauthorizedError('Your account has been suspended. Please contact support.');
            }
            // Update last login timestamp
            await database_1.default.customer.update({
                where: { id: customer.id },
                data: { lastLogin: new Date() },
            });
            // Clean up expired tokens before generating new ones
            await this.cleanupExpiredTokens(customer.id);
            // Enforce session limit
            await this.enforceSessionLimit(customer.id);
            // Generate tokens
            const tokens = await this.generateTokens(customer);
            logger_1.logger.info(`Customer logged in: ${customer.id} (${customer.email})`);
            return {
                customer: this.sanitizeCustomer(customer),
                tokens,
            };
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            throw error;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.CUSTOMER_JWT_SECRET);
            // Find stored refresh token
            const storedToken = await database_1.default.customerRefreshToken.findUnique({
                where: { token: refreshToken },
                include: { customer: true },
            });
            if (!storedToken || storedToken.customerId !== decoded.sub) {
                // Reuse detection: if token was already used (deleted), invalidate all user tokens
                if (!storedToken && decoded.sub) {
                    await database_1.default.customerRefreshToken.deleteMany({
                        where: { customerId: decoded.sub },
                    });
                    logger_1.logger.warn(`Token reuse detected for customer: ${decoded.sub}`);
                }
                throw new errors_1.UnauthorizedError('Invalid refresh token');
            }
            // Check if token expired
            if (storedToken.expiresAt < new Date()) {
                await database_1.default.customerRefreshToken.delete({
                    where: { id: storedToken.id },
                });
                throw new errors_1.UnauthorizedError('Refresh token expired');
            }
            // Generate new tokens (token rotation)
            const newTokens = await this.generateTokens(storedToken.customer);
            // Delete old refresh token (rotation)
            await database_1.default.customerRefreshToken.delete({
                where: { id: storedToken.id },
            });
            logger_1.logger.info(`Access token refreshed for customer: ${storedToken.customerId}`);
            return newTokens;
        }
        catch (error) {
            if (error instanceof errors_1.UnauthorizedError) {
                throw error;
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
    }
    /**
     * Logout customer (invalidate refresh token)
     */
    async logout(customerId, refreshToken) {
        const storedToken = await database_1.default.customerRefreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!storedToken || storedToken.customerId !== customerId) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        await database_1.default.customerRefreshToken.delete({
            where: { id: storedToken.id },
        });
        logger_1.logger.info(`Customer logged out: ${customerId}`);
    }
    /**
     * Logout from all devices
     */
    async logoutAll(customerId) {
        await database_1.default.customerRefreshToken.deleteMany({
            where: { customerId },
        });
        logger_1.logger.info(`Customer logged out from all devices: ${customerId}`);
    }
    /**
     * Request password reset
     */
    async forgotPassword(email) {
        try {
            const customer = await database_1.default.customer.findUnique({
                where: { email },
            });
            // Always return success to prevent email enumeration
            if (!customer) {
                logger_1.logger.info(`Password reset requested for non-existent email: ${email}`);
                return;
            }
            // Generate password reset token
            const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await database_1.default.customer.update({
                where: { id: customer.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpiry: resetExpiry,
                },
            });
            // Send password reset email
            await email_service_1.emailService.sendPasswordResetEmail(customer.email, customer.name, resetToken);
            logger_1.logger.info(`Password reset email sent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error('Forgot password error:', error);
            // Don't throw error to prevent email enumeration
        }
    }
    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            const customer = await database_1.default.customer.findFirst({
                where: {
                    passwordResetToken: token,
                    passwordResetExpiry: { gt: new Date() },
                },
            });
            if (!customer) {
                throw new errors_1.ValidationError('Password reset token is invalid or has expired. Please request a new reset link.');
            }
            // Validate password strength
            this.validatePasswordStrength(newPassword);
            // Hash new password
            const passwordHash = await bcryptjs_1.default.hash(newPassword, this.SALT_ROUNDS);
            // Update password and clear reset token
            await database_1.default.customer.update({
                where: { id: customer.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpiry: null,
                },
            });
            // Invalidate all refresh tokens (force re-login on all devices)
            await database_1.default.customerRefreshToken.deleteMany({
                where: { customerId: customer.id },
            });
            // Send confirmation email
            await email_service_1.emailService.sendPasswordChangedEmail(customer.email, customer.name);
            logger_1.logger.info(`Password reset successful for customer: ${customer.id}`);
        }
        catch (error) {
            logger_1.logger.error('Reset password error:', error);
            throw error;
        }
    }
    /**
     * Verify email address
     */
    async verifyEmail(token) {
        try {
            const customer = await database_1.default.customer.findFirst({
                where: {
                    emailVerificationToken: token,
                    emailVerificationExpiry: { gt: new Date() },
                },
            });
            if (!customer) {
                throw new errors_1.ValidationError('Email verification token is invalid or has expired. Please request a new verification email.');
            }
            await database_1.default.customer.update({
                where: { id: customer.id },
                data: {
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpiry: null,
                },
            });
            // Send welcome email after verification
            const guestOrderCount = await guest_order_service_1.guestOrderService.getGuestOrderCount(customer.email);
            await email_service_1.emailService.sendWelcomeEmail(customer.email, customer.name, guestOrderCount > 0 ? guestOrderCount : undefined);
            logger_1.logger.info(`Email verified for customer: ${customer.id}`);
        }
        catch (error) {
            logger_1.logger.error('Verify email error:', error);
            throw error;
        }
    }
    /**
     * Resend verification email
     */
    async resendVerificationEmail(email) {
        try {
            const customer = await database_1.default.customer.findUnique({
                where: { email },
            });
            if (!customer) {
                throw new errors_1.ValidationError('Customer not found');
            }
            if (customer.emailVerified) {
                throw new errors_1.ValidationError('Email is already verified');
            }
            // Generate new verification token
            const emailVerificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await database_1.default.customer.update({
                where: { id: customer.id },
                data: {
                    emailVerificationToken,
                    emailVerificationExpiry,
                },
            });
            await email_service_1.emailService.sendVerificationEmail(customer.email, customer.name, emailVerificationToken);
            logger_1.logger.info(`Verification email resent to customer: ${customer.id}`);
        }
        catch (error) {
            logger_1.logger.error('Resend verification error:', error);
            throw error;
        }
    }
    /**
     * Get active sessions for a customer
     */
    async getActiveSessions(customerId) {
        const sessions = await database_1.default.customerRefreshToken.findMany({
            where: {
                customerId,
                expiresAt: { gte: new Date() },
            },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return sessions;
    }
    // ==================== PRIVATE HELPER METHODS ====================
    /**
     * Generate access and refresh tokens
     */
    async generateTokens(customer) {
        const payload = {
            sub: customer.id,
            email: customer.email,
            type: 'customer',
            name: customer.name,
            status: customer.status,
            emailVerified: customer.emailVerified,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.CUSTOMER_JWT_SECRET, { expiresIn: env_1.env.CUSTOMER_JWT_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: customer.id }, env_1.env.CUSTOMER_JWT_SECRET, { expiresIn: env_1.env.CUSTOMER_REFRESH_EXPIRES_IN });
        // Store refresh token
        const expiresAt = this.calculateTokenExpiration(env_1.env.CUSTOMER_REFRESH_EXPIRES_IN || '30d');
        await database_1.default.customerRefreshToken.create({
            data: {
                customerId: customer.id,
                token: refreshToken,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpirationToSeconds(env_1.env.CUSTOMER_JWT_EXPIRES_IN || '24h'),
        };
    }
    /**
     * Clean up expired refresh tokens
     */
    async cleanupExpiredTokens(customerId) {
        await database_1.default.customerRefreshToken.deleteMany({
            where: {
                customerId,
                expiresAt: { lt: new Date() },
            },
        });
    }
    /**
     * Enforce session limit (max active sessions per customer)
     */
    async enforceSessionLimit(customerId) {
        const maxSessions = env_1.env.MAX_CUSTOMER_SESSIONS || 5;
        const activeTokens = await database_1.default.customerRefreshToken.findMany({
            where: {
                customerId,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });
        if (activeTokens.length >= maxSessions) {
            // Delete oldest tokens to make room
            const tokensToDelete = activeTokens.slice(maxSessions - 1);
            await database_1.default.customerRefreshToken.deleteMany({
                where: {
                    id: { in: tokensToDelete.map((t) => t.id) },
                },
            });
        }
    }
    /**
     * Calculate token expiration date
     */
    calculateTokenExpiration(expiresIn) {
        const expiresAt = new Date();
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            expiresAt.setDate(expiresAt.getDate() + 30); // Default 30 days
            return expiresAt;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                expiresAt.setSeconds(expiresAt.getSeconds() + value);
                break;
            case 'm':
                expiresAt.setMinutes(expiresAt.getMinutes() + value);
                break;
            case 'h':
                expiresAt.setHours(expiresAt.getHours() + value);
                break;
            case 'd':
                expiresAt.setDate(expiresAt.getDate() + value);
                break;
            default:
                expiresAt.setDate(expiresAt.getDate() + 30);
        }
        return expiresAt;
    }
    /**
     * Parse expiration string to seconds
     */
    parseExpirationToSeconds(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 86400; // Default 24 hours
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                return 86400;
        }
    }
    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const errors = [];
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUppercase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowercase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumber) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }
        if (errors.length > 0) {
            throw new errors_1.ValidationError('Password does not meet security requirements', {
                requirements: errors,
            });
        }
    }
    /**
     * Sanitize customer object (remove sensitive fields)
     */
    sanitizeCustomer(customer) {
        const { passwordHash, emailVerificationToken, emailVerificationExpiry, passwordResetToken, passwordResetExpiry, ...sanitized } = customer;
        return sanitized;
    }
}
exports.CustomerAuthService = CustomerAuthService;
exports.customerAuthService = new CustomerAuthService();
//# sourceMappingURL=customer-auth.service.js.map