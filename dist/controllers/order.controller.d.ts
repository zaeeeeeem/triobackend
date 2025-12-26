import { Response, NextFunction } from 'express';
import { Request } from 'express';
/**
 * Order Controller
 * Handles all order-related HTTP requests
 */
export declare class OrderController {
    /**
     * Create a new order
     * POST /api/v1/orders
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get order by ID
     * GET /api/v1/orders/:orderId
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get order by order number
     * GET /api/v1/orders/number/:orderNumber
     */
    getByNumber(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List all orders with filters
     * GET /api/v1/orders
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update order
     * PATCH /api/v1/orders/:orderId
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update payment status
     * PATCH /api/v1/orders/:orderId/payment-status
     */
    updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update order status
     * PATCH /api/v1/orders/:orderId/order-status
     */
    updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete order
     * DELETE /api/v1/orders/:orderId
     */
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Duplicate order
     * POST /api/v1/orders/:orderId/duplicate
     */
    duplicate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get order statistics
     * GET /api/v1/orders/stats
     */
    getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Export orders to CSV
     * GET /api/v1/orders/export
     */
    exportCsv(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const orderController: OrderController;
//# sourceMappingURL=order.controller.d.ts.map