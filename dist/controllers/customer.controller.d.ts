import { Response, NextFunction } from 'express';
import { CustomerRequest } from '../middleware/customer-auth';
export declare class CustomerController {
    /**
     * Get customer profile with statistics
     * GET /api/v1/customers/profile
     */
    getProfile(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update customer profile
     * PATCH /api/v1/customers/profile
     */
    updateProfile(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Change customer email
     * POST /api/v1/customers/change-email
     */
    changeEmail(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Change customer password
     * POST /api/v1/customers/change-password
     */
    changePassword(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update customer preferences
     * PATCH /api/v1/customers/preferences
     */
    updatePreferences(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete customer account
     * DELETE /api/v1/customers/account
     */
    deleteAccount(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer orders
     * GET /api/v1/customers/orders
     */
    getOrders(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get single order details
     * GET /api/v1/customers/orders/:orderId
     */
    getOrderById(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer statistics
     * GET /api/v1/customers/statistics
     */
    getStatistics(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const customerController: CustomerController;
//# sourceMappingURL=customer.controller.d.ts.map