import { Response, NextFunction } from 'express';
import { CustomerRequest } from '../middleware/customer-auth';
export declare class CustomerAuthController {
    /**
     * Register a new customer account
     * POST /api/v1/customer-auth/register
     */
    register(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Login with email and password
     * POST /api/v1/customer-auth/login
     */
    login(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Refresh access token using refresh token
     * POST /api/v1/customer-auth/refresh
     */
    refreshToken(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Logout - invalidate refresh token
     * POST /api/v1/customer-auth/logout
     */
    logout(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Logout from all devices
     * POST /api/v1/customer-auth/logout-all
     */
    logoutAll(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Request password reset
     * POST /api/v1/customer-auth/forgot-password
     */
    forgotPassword(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Reset password with token
     * POST /api/v1/customer-auth/reset-password
     */
    resetPassword(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Verify email with token
     * GET /api/v1/customer-auth/verify-email?token=...
     */
    verifyEmail(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Resend verification email
     * POST /api/v1/customer-auth/resend-verification
     */
    resendVerification(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current authenticated customer's info
     * GET /api/v1/customer-auth/me
     */
    getMe(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate guest token for anonymous checkout
     * POST /api/v1/customer-auth/guest-token
     */
    generateGuestToken(req: CustomerRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const customerAuthController: CustomerAuthController;
//# sourceMappingURL=customer-auth.controller.d.ts.map