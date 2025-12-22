import { RegisterCustomerDto, LoginCustomerDto, AuthTokens, CustomerAuthResponse } from '../types/customer-auth.types';
export declare class CustomerAuthService {
    private readonly SALT_ROUNDS;
    /**
     * Register a new customer
     */
    register(data: RegisterCustomerDto): Promise<CustomerAuthResponse>;
    /**
     * Update a guest-converted customer with password
     */
    private updateGuestCustomerWithPassword;
    /**
     * Login customer
     */
    login(data: LoginCustomerDto): Promise<CustomerAuthResponse>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(refreshToken: string): Promise<AuthTokens>;
    /**
     * Logout customer (invalidate refresh token)
     */
    logout(customerId: string, refreshToken: string): Promise<void>;
    /**
     * Logout from all devices
     */
    logoutAll(customerId: string): Promise<void>;
    /**
     * Request password reset
     */
    forgotPassword(email: string): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Verify email address
     */
    verifyEmail(token: string): Promise<void>;
    /**
     * Resend verification email
     */
    resendVerificationEmail(email: string): Promise<void>;
    /**
     * Get active sessions for a customer
     */
    getActiveSessions(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
    }[]>;
    /**
     * Generate access and refresh tokens
     */
    private generateTokens;
    /**
     * Clean up expired refresh tokens
     */
    private cleanupExpiredTokens;
    /**
     * Enforce session limit (max active sessions per customer)
     */
    private enforceSessionLimit;
    /**
     * Calculate token expiration date
     */
    private calculateTokenExpiration;
    /**
     * Parse expiration string to seconds
     */
    private parseExpirationToSeconds;
    /**
     * Validate password strength
     */
    private validatePasswordStrength;
    /**
     * Sanitize customer object (remove sensitive fields)
     */
    private sanitizeCustomer;
}
export declare const customerAuthService: CustomerAuthService;
//# sourceMappingURL=customer-auth.service.d.ts.map