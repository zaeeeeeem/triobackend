import { Request, Response, NextFunction } from 'express';
/**
 * Admin controller for managing customers
 * These endpoints are for admin users to manage customer accounts
 */
export declare class AdminCustomerController {
    /**
     * List all customers with filtering and pagination
     * GET /api/v1/admin/customers
     */
    listCustomers(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer by ID with full details
     * GET /api/v1/admin/customers/:customerId
     */
    getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer profile with statistics
     * GET /api/v1/admin/customers/:customerId/profile
     */
    getCustomerProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a new customer (admin)
     * POST /api/v1/admin/customers
     */
    createCustomer(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update customer (admin)
     * PATCH /api/v1/admin/customers/:customerId
     */
    updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer orders (admin)
     * GET /api/v1/admin/customers/:customerId/orders
     */
    getCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer statistics (admin)
     * GET /api/v1/admin/customers/:customerId/statistics
     */
    getCustomerStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminCustomerController: AdminCustomerController;
//# sourceMappingURL=admin-customer.controller.d.ts.map