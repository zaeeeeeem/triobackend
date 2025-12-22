import { GuestJwtPayload } from '../types/customer-auth.types';
export declare class GuestOrderService {
    /**
     * Link all guest orders with matching email to a customer account
     * This is called automatically during customer registration
     */
    linkGuestOrdersToCustomer(customerId: string, email: string): Promise<number>;
    /**
     * Calculate order statistics for a customer
     */
    private calculateOrderStatistics;
    /**
     * Lookup a guest order by email and order number
     * Used by guest customers to track their orders without an account
     */
    lookupGuestOrder(email: string, orderNumber: string): Promise<{
        order: {
            orderNumber: string;
            date: Date;
            total: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
            items: {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                productName: string;
                total: import("@prisma/client/runtime/library").Decimal;
                quantity: number;
            }[];
            shippingAddress: {
                fullName: string;
                address: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | null;
        };
        hasAccount: boolean;
    } | null>;
    /**
     * Generate a temporary guest token for cart/session tracking
     */
    generateGuestToken(deviceId?: string): {
        guestToken: string;
        expiresIn: number;
    };
    /**
     * Verify a guest token
     */
    verifyGuestToken(token: string): GuestJwtPayload | null;
    /**
     * Check if there are any guest orders for a given email
     * Used to suggest account creation during checkout
     */
    hasGuestOrders(email: string): Promise<boolean>;
    /**
     * Get count of guest orders for an email
     */
    getGuestOrderCount(email: string): Promise<number>;
}
export declare const guestOrderService: GuestOrderService;
//# sourceMappingURL=guest-order.service.d.ts.map