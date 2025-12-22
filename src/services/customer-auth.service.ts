import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { UnauthorizedError, ConflictError, ValidationError } from '../utils/errors';
import { emailService } from './email.service';
import { guestOrderService } from './guest-order.service';
import {
  RegisterCustomerDto,
  LoginCustomerDto,
  CustomerJwtPayload,
  AuthTokens,
  CustomerAuthResponse,
} from '../types/customer-auth.types';

export class CustomerAuthService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Register a new customer
   */
  async register(data: RegisterCustomerDto): Promise<CustomerAuthResponse> {
    try {
      // Check if email already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existingCustomer && existingCustomer.passwordHash) {
        throw new ConflictError('An account with this email already exists. Please login.');
      }

      // If customer exists without password (guest-converted), update with password
      if (existingCustomer && !existingCustomer.passwordHash) {
        return await this.updateGuestCustomerWithPassword(existingCustomer.id, data);
      }

      // Validate password strength
      this.validatePasswordStrength(data.password);

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Generate email verification token
      const emailVerificationToken = randomBytes(32).toString('hex');
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create customer
      const customer = await prisma.customer.create({
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

      logger.info(`New customer registered: ${customer.id} (${customer.email})`);

      // Link any existing guest orders
      const guestOrdersLinked = await guestOrderService.linkGuestOrdersToCustomer(
        customer.id,
        customer.email
      );

      // Generate tokens
      const tokens = await this.generateTokens(customer);

      // Send verification email
      await emailService.sendVerificationEmail(
        customer.email,
        customer.name,
        emailVerificationToken
      );

      // Prepare response
      const customerResponse = this.sanitizeCustomer(customer);

      return {
        customer: customerResponse,
        tokens,
        guestOrdersLinked: guestOrdersLinked > 0 ? guestOrdersLinked : undefined,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Update a guest-converted customer with password
   */
  private async updateGuestCustomerWithPassword(
    customerId: string,
    data: RegisterCustomerDto
  ): Promise<CustomerAuthResponse> {
    this.validatePasswordStrength(data.password);

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const customer = await prisma.customer.update({
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

    await emailService.sendVerificationEmail(
      customer.email,
      customer.name,
      emailVerificationToken
    );

    const guestOrdersLinked = await guestOrderService.linkGuestOrdersToCustomer(
      customer.id,
      customer.email
    );

    return {
      customer: this.sanitizeCustomer(customer),
      tokens,
      guestOrdersLinked: guestOrdersLinked > 0 ? guestOrdersLinked : undefined,
    };
  }

  /**
   * Login customer
   */
  async login(data: LoginCustomerDto): Promise<CustomerAuthResponse> {
    try {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (!customer || !customer.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, customer.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if account is suspended
      if (customer.status === 'SUSPENDED') {
        throw new UnauthorizedError(
          'Your account has been suspended. Please contact support.'
        );
      }

      // Update last login timestamp
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastLogin: new Date() },
      });

      // Clean up expired tokens before generating new ones
      await this.cleanupExpiredTokens(customer.id);

      // Enforce session limit
      await this.enforceSessionLimit(customer.id);

      // Generate tokens
      const tokens = await this.generateTokens(customer);

      logger.info(`Customer logged in: ${customer.id} (${customer.email})`);

      return {
        customer: this.sanitizeCustomer(customer),
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.CUSTOMER_JWT_SECRET) as CustomerJwtPayload;

      // Find stored refresh token
      const storedToken = await prisma.customerRefreshToken.findUnique({
        where: { token: refreshToken },
        include: { customer: true },
      });

      if (!storedToken || storedToken.customerId !== decoded.sub) {
        // Reuse detection: if token was already used (deleted), invalidate all user tokens
        if (!storedToken && decoded.sub) {
          await prisma.customerRefreshToken.deleteMany({
            where: { customerId: decoded.sub },
          });
          logger.warn(`Token reuse detected for customer: ${decoded.sub}`);
        }
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token expired
      if (storedToken.expiresAt < new Date()) {
        await prisma.customerRefreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new tokens (token rotation)
      const newTokens = await this.generateTokens(storedToken.customer);

      // Delete old refresh token (rotation)
      await prisma.customerRefreshToken.delete({
        where: { id: storedToken.id },
      });

      logger.info(`Access token refreshed for customer: ${storedToken.customerId}`);

      return newTokens;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Logout customer (invalidate refresh token)
   */
  async logout(customerId: string, refreshToken: string): Promise<void> {
    const storedToken = await prisma.customerRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.customerId !== customerId) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    await prisma.customerRefreshToken.delete({
      where: { id: storedToken.id },
    });

    logger.info(`Customer logged out: ${customerId}`);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(customerId: string): Promise<void> {
    await prisma.customerRefreshToken.deleteMany({
      where: { customerId },
    });

    logger.info(`Customer logged out from all devices: ${customerId}`);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!customer) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate password reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry,
        },
      });

      // Send password reset email
      await emailService.sendPasswordResetEmail(customer.email, customer.name, resetToken);

      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Forgot password error:', error);
      // Don't throw error to prevent email enumeration
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: { gt: new Date() },
        },
      });

      if (!customer) {
        throw new ValidationError(
          'Password reset token is invalid or has expired. Please request a new reset link.'
        );
      }

      // Validate password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password and clear reset token
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      // Invalidate all refresh tokens (force re-login on all devices)
      await prisma.customerRefreshToken.deleteMany({
        where: { customerId: customer.id },
      });

      // Send confirmation email
      await emailService.sendPasswordChangedEmail(customer.email, customer.name);

      logger.info(`Password reset successful for customer: ${customer.id}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiry: { gt: new Date() },
        },
      });

      if (!customer) {
        throw new ValidationError(
          'Email verification token is invalid or has expired. Please request a new verification email.'
        );
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });

      // Send welcome email after verification
      const guestOrderCount = await guestOrderService.getGuestOrderCount(customer.email);
      await emailService.sendWelcomeEmail(
        customer.email,
        customer.name,
        guestOrderCount > 0 ? guestOrderCount : undefined
      );

      logger.info(`Email verified for customer: ${customer.id}`);
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        throw new ValidationError('Customer not found');
      }

      if (customer.emailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Generate new verification token
      const emailVerificationToken = randomBytes(32).toString('hex');
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          emailVerificationToken,
          emailVerificationExpiry,
        },
      });

      await emailService.sendVerificationEmail(
        customer.email,
        customer.name,
        emailVerificationToken
      );

      logger.info(`Verification email resent to customer: ${customer.id}`);
    } catch (error) {
      logger.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a customer
   */
  async getActiveSessions(customerId: string) {
    const sessions = await prisma.customerRefreshToken.findMany({
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
  private async generateTokens(customer: any): Promise<AuthTokens> {
    const payload: CustomerJwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      name: customer.name,
      status: customer.status,
      emailVerified: customer.emailVerified,
    };

    const accessToken = jwt.sign(
      payload,
      env.CUSTOMER_JWT_SECRET,
      { expiresIn: env.CUSTOMER_JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { sub: customer.id },
      env.CUSTOMER_JWT_SECRET,
      { expiresIn: env.CUSTOMER_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );

    // Store refresh token
    const expiresAt = this.calculateTokenExpiration(env.CUSTOMER_REFRESH_EXPIRES_IN || '30d');

    await prisma.customerRefreshToken.create({
      data: {
        customerId: customer.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationToSeconds(env.CUSTOMER_JWT_EXPIRES_IN || '24h'),
    };
  }

  /**
   * Clean up expired refresh tokens
   */
  private async cleanupExpiredTokens(customerId: string): Promise<void> {
    await prisma.customerRefreshToken.deleteMany({
      where: {
        customerId,
        expiresAt: { lt: new Date() },
      },
    });
  }

  /**
   * Enforce session limit (max active sessions per customer)
   */
  private async enforceSessionLimit(customerId: string): Promise<void> {
    const maxSessions = env.MAX_CUSTOMER_SESSIONS || 5;

    const activeTokens = await prisma.customerRefreshToken.findMany({
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
      await prisma.customerRefreshToken.deleteMany({
        where: {
          id: { in: tokensToDelete.map((t) => t.id) },
        },
      });
    }
  }

  /**
   * Calculate token expiration date
   */
  private calculateTokenExpiration(expiresIn: string): Date {
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
  private parseExpirationToSeconds(expiresIn: string): number {
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
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

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
      throw new ValidationError('Password does not meet security requirements', {
        requirements: errors,
      });
    }
  }

  /**
   * Sanitize customer object (remove sensitive fields)
   */
  private sanitizeCustomer(customer: any) {
    const {
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiry,
      passwordResetToken,
      passwordResetExpiry,
      ...sanitized
    } = customer;

    return sanitized;
  }
}

export const customerAuthService = new CustomerAuthService();
