import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { guestOrderService } from '../services/guest-order.service';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Controller for guest order operations
 */
export class GuestOrderController {
  /**
   * Lookup guest order by email and order number
   * POST /api/v1/guest-orders/lookup
   */
  async lookupOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { email, orderNumber } = req.body;
      const result = await guestOrderService.lookupGuestOrder(email, orderNumber);

      if (!result) {
        throw new NotFoundError('Order', `with email ${email} and order number ${orderNumber}`);
      }

      logger.info(`Guest order lookup: ${orderNumber} for ${email}`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if email has guest orders
   * POST /api/v1/guest-orders/check-email
   */
  async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const hasOrders = await guestOrderService.hasGuestOrders(email);
      const orderCount = hasOrders ? await guestOrderService.getGuestOrderCount(email) : 0;

      res.status(200).json({
        success: true,
        data: {
          hasGuestOrders: hasOrders,
          guestOrderCount: orderCount,
          message: hasOrders
            ? `You have ${orderCount} previous order(s). Create an account to track all your orders!`
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const guestOrderController = new GuestOrderController();
