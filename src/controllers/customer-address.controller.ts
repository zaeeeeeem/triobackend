import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { customerAddressService } from '../services/customer-address.service';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CustomerRequest } from '../middleware/customer-auth';

export class CustomerAddressController {
  /**
   * List all addresses for the authenticated customer
   * GET /api/v1/customers/addresses
   */
  async listAddresses(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const result = await customerAddressService.listAddresses(req.customer.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific address by ID
   * GET /api/v1/customers/addresses/:addressId
   */
  async getAddressById(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { addressId } = req.params;
      const address = await customerAddressService.getAddressById(req.customer.id, addressId);

      res.status(200).json({
        success: true,
        data: { address },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new address
   * POST /api/v1/customers/addresses
   */
  async createAddress(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const address = await customerAddressService.createAddress(req.customer.id, req.body);

      logger.info(`Address created: ${address.id} for customer ${req.customer.id}`);

      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: { address },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing address
   * PATCH /api/v1/customers/addresses/:addressId
   */
  async updateAddress(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { addressId } = req.params;
      const address = await customerAddressService.updateAddress(
        req.customer.id,
        addressId,
        req.body
      );

      logger.info(`Address updated: ${addressId}`);

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: { address },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an address
   * DELETE /api/v1/customers/addresses/:addressId
   */
  async deleteAddress(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { addressId } = req.params;
      await customerAddressService.deleteAddress(req.customer.id, addressId);

      logger.info(`Address deleted: ${addressId}`);

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set an address as default (shipping or billing)
   * POST /api/v1/customers/addresses/:addressId/set-default
   */
  async setDefaultAddress(req: CustomerRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      if (!req.customer) {
        throw new ValidationError('Authentication required');
      }

      const { addressId } = req.params;
      const { type } = req.body;

      await customerAddressService.setDefaultAddress(
        req.customer.id,
        addressId,
        type || 'shipping'
      );

      logger.info(`Default ${type || 'shipping'} address set: ${addressId}`);

      res.status(200).json({
        success: true,
        message: `Default ${type || 'shipping'} address set successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerAddressController = new CustomerAddressController();
