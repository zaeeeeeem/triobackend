import { CustomerStatus, CustomerType } from '@prisma/client';
export interface Customer {
    id: string;
    email: string;
    passwordHash?: string | null;
    emailVerified: boolean;
    emailVerificationToken?: string | null;
    emailVerificationExpiry?: Date | null;
    passwordResetToken?: string | null;
    passwordResetExpiry?: Date | null;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    location?: string | null;
    timezone?: string | null;
    language?: string | null;
    status: CustomerStatus;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    tags: string[];
    customerType?: CustomerType | null;
    marketingConsent: boolean;
    smsConsent: boolean;
    emailPreferences: {
        newsletter: boolean;
        orderUpdates: boolean;
        promotions: boolean;
    };
    createdFromGuest: boolean;
    registrationSource?: string | null;
    notes?: string | null;
    lastLogin?: Date | null;
    lastOrderDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface CustomerStatistics {
    customerId: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date | null;
    daysSinceLastOrder?: number | null;
    orderFrequency: number;
    favoriteSection?: 'CAFE' | 'FLOWERS' | 'BOOKS';
    topProducts: {
        productId: string;
        productName: string;
        purchaseCount: number;
    }[];
    lifetimeValue: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    rewardPoints?: number;
    customerSince: Date;
    lastUpdated: Date;
}
export interface CreateCustomerDto {
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    status?: CustomerStatus;
    tags?: string[];
    customerType?: CustomerType;
    notes?: string;
    sendWelcomeEmail?: boolean;
}
export interface UpdateCustomerDto {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    timezone?: string;
    language?: string;
    status?: CustomerStatus;
    tags?: string[];
    customerType?: CustomerType;
    notes?: string;
}
export interface UpdateCustomerPreferencesDto {
    marketingConsent?: boolean;
    smsConsent?: boolean;
    emailPreferences?: {
        newsletter?: boolean;
        orderUpdates?: boolean;
        promotions?: boolean;
    };
}
export interface CustomerQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: CustomerStatus;
    tags?: string;
    customerType?: CustomerType;
    sortBy?: 'createdAt' | 'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'name';
    sortOrder?: 'asc' | 'desc';
    createdFrom?: Date | string;
    createdTo?: Date | string;
}
export interface CustomerListResult {
    customers: Customer[];
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    statistics?: {
        totalCustomers: number;
        activeCustomers: number;
        inactiveCustomers: number;
        suspendedCustomers: number;
        totalOrders: number;
        totalRevenue: number;
    };
}
export interface CustomerProfileResponse {
    customer: Customer;
    statistics?: CustomerStatistics;
    recentOrders?: Array<{
        orderNumber: string;
        date: Date;
        total: number;
        status: string;
    }>;
}
//# sourceMappingURL=customer.types.d.ts.map