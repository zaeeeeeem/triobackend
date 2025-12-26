import { Response, NextFunction } from 'express';
import { CustomerRequest } from '../middleware/customer-auth';
export declare class CustomerAddressController {
    /**
     * List all addresses for the authenticated customer
     * GET /api/v1/customers/addresses
     */
    listAddresses(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get a specific address by ID
     * GET /api/v1/customers/addresses/:addressId
     */
    getAddressById(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a new address
     * POST /api/v1/customers/addresses
     */
    createAddress(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update an existing address
     * PATCH /api/v1/customers/addresses/:addressId
     */
    updateAddress(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete an address
     * DELETE /api/v1/customers/addresses/:addressId
     */
    deleteAddress(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Set an address as default (shipping or billing)
     * POST /api/v1/customers/addresses/:addressId/set-default
     */
    setDefaultAddress(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const customerAddressController: CustomerAddressController;
//# sourceMappingURL=customer-address.controller.d.ts.map