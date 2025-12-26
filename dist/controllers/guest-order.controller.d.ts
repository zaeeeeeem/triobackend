import { Request, Response, NextFunction } from 'express';
/**
 * Controller for guest order operations
 */
export declare class GuestOrderController {
    /**
     * Lookup guest order by email and order number
     * POST /api/v1/guest-orders/lookup
     */
    lookupOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Check if email has guest orders
     * POST /api/v1/guest-orders/check-email
     */
    checkEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const guestOrderController: GuestOrderController;
//# sourceMappingURL=guest-order.controller.d.ts.map