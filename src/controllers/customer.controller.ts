import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { customerService } from '../services/customer.service';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CustomerRequest } from '../middleware/customer-auth';

export class CustomerController {
  /**
   * Get customer profile with statistics
   * GET /api/v1/customers/profile
   */
  async getProfile(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const result = await customerService.getCustomerProfile(req.customer.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer profile
   * PATCH /api/v1/customers/profile
   */
  async updateProfile(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const customer = await customerService.updateCustomer(req.customer.id, req.body);

      logger.info(`Customer profile updated: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change customer email
   * POST /api/v1/customers/change-email
   */
  async changeEmail(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { newEmail, password } = req.body;
      await customerService.changeEmail(req.customer.id, newEmail, password);

      logger.info(`Customer email changed: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Email changed successfully. Please verify your new email address.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change customer password
   * POST /api/v1/customers/change-password
   */
  async changePassword(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { currentPassword, newPassword } = req.body;
      await customerService.changePassword(req.customer.id, currentPassword, newPassword);

      logger.info(`Customer password changed: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. You have been logged out from all devices.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer preferences
   * PATCH /api/v1/customers/preferences
   */
  async updatePreferences(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const customer = await customerService.updatePreferences(req.customer.id, req.body);

      logger.info(`Customer preferences updated: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete customer account
   * DELETE /api/v1/customers/account
   */
  async deleteAccount(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { password } = req.body;
      await customerService.deleteCustomer(req.customer.id, password);

      logger.info(`Customer account deleted: ${req.customer.id}`);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer orders
   * GET /api/v1/customers/orders
   */
  async getOrders(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const result = await customerService.getCustomerOrders(req.customer.id, req.query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single order details
   * GET /api/v1/customers/orders/:orderId
   */
  async getOrderById(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { orderId } = req.params;
      const order = await customerService.getOrderById(req.customer.id, orderId);

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer statistics
   * GET /api/v1/customers/statistics
   */
  async getStatistics(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const statistics = await customerService.calculateStatistics(req.customer.id);

      res.status(200).json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
