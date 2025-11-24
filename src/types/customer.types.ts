import { CustomerStatus, CustomerType } from '@prisma/client';

// =====================================================
// Customer Model Types
// =====================================================

export interface Customer {
  id: string;
  email: string;

  // Authentication
  passwordHash?: string | null;
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiry?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;

  // Basic Information
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;

  // Location
  location?: string | null;
  timezone?: string | null;
  language?: string | null;

  // Status & Metrics
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;

  // Segmentation
  tags: string[];
  customerType?: CustomerType | null;

  // Preferences
  marketingConsent: boolean;
  smsConsent: boolean;
  emailPreferences: {
    newsletter: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };

  // Account Origin
  createdFromGuest: boolean;
  registrationSource?: string | null;

  // Metadata
  notes?: string | null;
  lastLogin?: Date | null;
  lastOrderDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// =====================================================
// Customer Statistics
// =====================================================

export interface CustomerStatistics {
  customerId: string;

  // Order Metrics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;

  // Engagement
  lastOrderDate?: Date | null;
  daysSinceLastOrder?: number | null;
  orderFrequency: number; // Orders per month

  // Product Preferences
  favoriteSection?: 'CAFE' | 'FLOWERS' | 'BOOKS';
  topProducts: {
    productId: string;
    productName: string;
    purchaseCount: number;
  }[];

  // Loyalty
  lifetimeValue: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardPoints?: number;

  // Timestamps
  customerSince: Date;
  lastUpdated: Date;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

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

// =====================================================
// Query Parameters
// =====================================================

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Search by name, email, phone
  status?: CustomerStatus;
  tags?: string; // Comma-separated tags
  customerType?: CustomerType;
  sortBy?: 'createdAt' | 'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'name';
  sortOrder?: 'asc' | 'desc';
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// =====================================================
// Response Types
// =====================================================

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
