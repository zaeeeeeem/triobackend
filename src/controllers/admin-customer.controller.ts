import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { customerService } from '../services/customer.service';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Admin controller for managing customers
 * These endpoints are for admin users to manage customer accounts
 */
export class AdminCustomerController {
  /**
   * List all customers with filtering and pagination
   * GET /api/v1/admin/customers
   */
  async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const result = await customerService.listCustomers(req.query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer by ID with full details
   * GET /api/v1/admin/customers/:customerId
   */
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { customerId } = req.params;
      const customer = await customerService.getCustomerById(customerId);

      res.status(200).json({
        success: true,
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer profile with statistics
   * GET /api/v1/admin/customers/:customerId/profile
   */
  async getCustomerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { customerId } = req.params;
      const result = await customerService.getCustomerProfile(customerId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new customer (admin)
   * POST /api/v1/admin/customers
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const customer = await customerService.createCustomer(req.body);

      logger.info(`Customer created by admin: ${customer.id}`);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer (admin)
   * PATCH /api/v1/admin/customers/:customerId
   */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { customerId } = req.params;
      const customer = await customerService.updateCustomer(customerId, req.body);

      logger.info(`Customer updated by admin: ${customerId}`);

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer orders (admin)
   * GET /api/v1/admin/customers/:customerId/orders
   */
  async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { customerId } = req.params;
      const result = await customerService.getCustomerOrders(customerId, req.query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer statistics (admin)
   * GET /api/v1/admin/customers/:customerId/statistics
   */
  async getCustomerStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { customerId } = req.params;
      const statistics = await customerService.calculateStatistics(customerId);

      res.status(200).json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminCustomerController = new AdminCustomerController();
