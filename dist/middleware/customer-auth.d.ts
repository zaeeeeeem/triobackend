import { Request, Response, NextFunction } from 'express';
/**
 * Extended Request interface with customer authentication
 */
export interface CustomerRequest extends Request {
    customer?: {
        id: string;
        email: string;
        name: string;
        status: string;
        emailVerified: boolean;
    };
}
/**
 * Middleware to authenticate customer JWT tokens
 * Validates the access token and attaches customer info to request
 */
export declare const authenticateCustomer: (req: CustomerRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require email verification
 * Must be used after authenticateCustomer
 */
export declare const requireEmailVerification: (req: CustomerRequest, _res: Response, next: NextFunction) => void;
/**
 * Optional customer authentication
 * Attaches customer info if token is present and valid, but doesn't fail if not
 * Useful for endpoints that work for both guests and authenticated customers
 */
export declare const optionalCustomerAuth: (req: CustomerRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=customer-auth.d.ts.map