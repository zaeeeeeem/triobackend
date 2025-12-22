import { UpdateCustomerDto, UpdateCustomerPreferencesDto, CustomerQueryParams, CustomerStatistics } from '../types/customer.types';
export declare class CustomerService {
    /**
     * Get customer by ID
     */
    getCustomerById(customerId: string): Promise<any>;
    /**
     * Get customer profile with statistics
     */
    getCustomerProfile(customerId: string): Promise<{
        customer: any;
        statistics: CustomerStatistics;
    }>;
    /**
     * Update customer profile
     */
    updateCustomer(customerId: string, data: UpdateCustomerDto): Promise<any>;
    /**
     * Change customer email (requires verification)
     */
    changeEmail(customerId: string, newEmail: string, password: string): Promise<void>;
    /**
     * Change customer password
     */
    changePassword(customerId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Update customer preferences
     */
    updatePreferences(customerId: string, data: UpdateCustomerPreferencesDto): Promise<any>;
    /**
     * Delete customer account (soft delete)
     */
    deleteCustomer(customerId: string, password: string): Promise<void>;
    /**
     * Get customer orders
     */
    getCustomerOrders(customerId: string, params?: any): Promise<{
        orders: ({
            items: {
                price: import("@prisma/client/runtime/library").Decimal;
                productName: string;
                quantity: number;
            }[];
            shippingAddress: {
                email: string | null;
                id: string;
                phone: string;
                orderId: string;
                fullName: string;
                address: string;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            section: import(".prisma/client").$Enums.Section;
            tags: string[];
            deletedAt: Date | null;
            createdBy: string | null;
            discount: import("@prisma/client/runtime/library").Decimal;
            orderNumber: string;
            customerId: string | null;
            customerEmail: string;
            customerName: string;
            customerPhone: string | null;
            guestOrder: boolean;
            guestToken: string | null;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            shippingCost: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            paymentMethod: string | null;
            notes: string | null;
            orderDate: Date;
        })[];
        pagination: {
            page: any;
            limit: number;
            totalPages: number;
            totalItems: number;
        };
    }>;
    /**
     * Get single order details
     */
    getOrderById(customerId: string, orderId: string): Promise<{
        items: {
            id: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            productName: string;
            total: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            variantId: string | null;
            quantity: number;
        }[];
        shippingAddress: {
            email: string | null;
            id: string;
            phone: string;
            orderId: string;
            fullName: string;
            address: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        section: import(".prisma/client").$Enums.Section;
        tags: string[];
        deletedAt: Date | null;
        createdBy: string | null;
        discount: import("@prisma/client/runtime/library").Decimal;
        orderNumber: string;
        customerId: string | null;
        customerEmail: string;
        customerName: string;
        customerPhone: string | null;
        guestOrder: boolean;
        guestToken: string | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        shippingCost: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: string | null;
        notes: string | null;
        orderDate: Date;
    }>;
    /**
     * Calculate customer statistics
     */
    calculateStatistics(customerId: string): Promise<CustomerStatistics>;
    /**
     * List all customers (admin)
     */
    listCustomers(params: CustomerQueryParams): Promise<{
        customers: any[];
        totalItems: number;
        page: number;
        limit: number;
        totalPages: number;
        statistics: {
            totalCustomers: number;
            activeCustomers: number;
            inactiveCustomers: number;
            suspendedCustomers: number;
            totalOrders: number;
            totalRevenue: number;
        };
    }>;
    /**
     * Create customer (admin)
     */
    createCustomer(data: any): Promise<any>;
    /**
     * Sanitize customer object (remove sensitive fields)
     */
    private sanitizeCustomer;
}
export declare const customerService: CustomerService;
//# sourceMappingURL=customer.service.d.ts.map