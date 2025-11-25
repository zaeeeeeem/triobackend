import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { customerAuthService } from '../services/customer-auth.service';
import { guestOrderService } from '../services/guest-order.service';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CustomerRequest } from '../middleware/customer-auth';

export class CustomerAuthController {
  /**
   * Register a new customer account
   * POST /api/v1/customer-auth/register
   */
  async register(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const result = await customerAuthService.register(req.body);

      logger.info(`Customer registered: ${result.customer.id} (${result.customer.email})`);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with email and password
   * POST /api/v1/customer-auth/login
   */
  async login(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const result = await customerAuthService.login(req.body);

      logger.info(`Customer logged in: ${result.customer.id} (${result.customer.email})`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/v1/customer-auth/refresh
   */
  async refreshToken(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { refreshToken } = req.body;
      const tokens = await customerAuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout - invalidate refresh token
   * POST /api/v1/customer-auth/logout
   */
  async logout(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { refreshToken } = req.body;

      await customerAuthService.logout(req.customer.id, refreshToken);

      logger.info(`Customer logged out: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/v1/customer-auth/logout-all
   */
  async logoutAll(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      await customerAuthService.logoutAll(req.customer.id);

      logger.info(`Customer logged out from all devices: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/v1/customer-auth/forgot-password
   */
  async forgotPassword(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { email } = req.body;
      await customerAuthService.forgotPassword(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/customer-auth/reset-password
   */
  async resetPassword(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { token, newPassword } = req.body;
      await customerAuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email with token
   * GET /api/v1/customer-auth/verify-email?token=...
   */
  async verifyEmail(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { token } = req.query;
      await customerAuthService.verifyEmail(token as string);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Welcome to TRIO!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   * POST /api/v1/customer-auth/resend-verification
   */
  async resendVerification(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { email } = req.body;
      await customerAuthService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated customer's info
   * GET /api/v1/customer-auth/me
   */
  async getMe(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      res.status(200).json({
        success: true,
        data: {
          customer: req.customer,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate guest token for anonymous checkout
   * POST /api/v1/customer-auth/guest-token
   */
  async generateGuestToken(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.body;
      const result = guestOrderService.generateGuestToken(deviceId);

      res.status(200).json({
        success: true,
        message: 'Guest token generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerAuthController = new CustomerAuthController();
