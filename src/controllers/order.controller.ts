import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { validationResult } from 'express-validator';
import { orderService } from '../services/order.service';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CustomerRequest } from '../middleware/customer-auth';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdatePaymentStatusDto,
  UpdateOrderStatusDto,
  OrderQueryParams,
} from '../types/order.types';

/**
 * Order Controller
 * Handles all order-related HTTP requests
 */
export class OrderController {
  /**
   * Create a new order
   * POST /api/v1/orders
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const data: CreateOrderDto = req.body;
      const createdBy = (req as any).user?.id; // Optional (guest/system)
      const customerContext = (req as CustomerRequest).customer
        ? {
            id: (req as CustomerRequest).customer!.id,
            email: (req as CustomerRequest).customer!.email,
          }
        : undefined;

      const order = await orderService.createOrder(data, createdBy, customerContext);

      logger.info(`Order created: ${order.orderNumber} by ${createdBy ?? 'system'}`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by ID
   * GET /api/v1/orders/:orderId
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by order number
   * GET /api/v1/orders/number/:orderNumber
   */
  async getByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber } = req.params;

      const order = await orderService.getOrderByNumber(orderNumber);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all orders with filters
   * GET /api/v1/orders
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const params: OrderQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        section: req.query.section as any,
        paymentStatus: req.query.paymentStatus as any,
        orderStatus: req.query.orderStatus as any,
        customerId: req.query.customerId as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const result = await orderService.listOrders(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order
   * PATCH /api/v1/orders/:orderId
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;
      const data: UpdateOrderDto = req.body;

      const order = await orderService.updateOrder(orderId, data);

      logger.info(`Order updated: ${order.orderNumber}`);

      res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment status
   * PATCH /api/v1/orders/:orderId/payment-status
   */
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;
      const { paymentStatus }: UpdatePaymentStatusDto = req.body;

      const order = await orderService.updatePaymentStatus(orderId, paymentStatus);

      logger.info(`Payment status updated for ${order.orderNumber}: ${paymentStatus}`);

      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status
   * PATCH /api/v1/orders/:orderId/order-status
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;
      const { orderStatus }: UpdateOrderStatusDto = req.body;

      const order = await orderService.updateOrderStatus(orderId, orderStatus);

      logger.info(
        `Order status updated for ${order.orderNumber}: ${orderStatus}`
      );

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete order
   * DELETE /api/v1/orders/:orderId
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;
      const hard = req.query.hard === 'true';

      await orderService.deleteOrder(orderId, hard);

      logger.info(`Order ${hard ? 'hard' : 'soft'} deleted: ${orderId}`);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate order
   * POST /api/v1/orders/:orderId/duplicate
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const { orderId } = req.params;
      const createdBy = (req as any).user?.id;

      const newOrder = await orderService.duplicateOrder(orderId, createdBy);

      logger.info(
        `Order duplicated: ${orderId} → ${newOrder.orderNumber} by ${createdBy ?? 'system'}`
      );

      res.status(201).json({
        success: true,
        message: 'Order duplicated successfully',
        data: newOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order statistics
   * GET /api/v1/orders/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const params = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        section: req.query.section as any,
      };

      const stats = await orderService.getOrderStats(params);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export orders to CSV
   * GET /api/v1/orders/export
   */
  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', { errors: errors.array() });
      }

      const params: OrderQueryParams = {
        search: req.query.search as string,
        section: req.query.section as any,
        paymentStatus: req.query.paymentStatus as any,
        orderStatus: req.query.orderStatus as any,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const csv = await orderService.exportOrdersToCsv(params);

      const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const orderController = new OrderController();
