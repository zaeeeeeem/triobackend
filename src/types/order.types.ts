// import { Decimal } from '@prisma/client/runtime/library';
import { PaymentStatus, FulfillmentStatus, Section } from '@prisma/client';

// ============================================
// REQUEST DTOs (What Frontend Sends)
// ============================================

/**
 * DTO for creating a new order
 * SECURITY: Frontend should NOT send prices - backend calculates all prices
 */
export interface CreateOrderDto {
  // Customer info (required for all orders)
  customer: {
    name: string;
    email: string;
    phone?: string;
  };

  // Section (required) - all items must belong to this section
  section: Section;

  // Items (ONLY productId, variantId, quantity - NO PRICES)
  items: CreateOrderItemDto[];

  // Optional discount code to apply
  discountCode?: string;

  // Shipping address (required for physical goods delivery)
  shippingAddress?: CreateShippingAddressDto;

  // Initial statuses (default: PENDING, UNFULFILLED)
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;

  // Optional metadata
  notes?: string;
  tags?: string[];

  // Payment method (e.g., "cash", "card", "jazzcash", "easypaisa")
  paymentMethod?: string;
}

/**
 * DTO for order item creation
 * CRITICAL: NO price or total fields - backend calculates these from database
 */
export interface CreateOrderItemDto {
  productId: string;
  variantId?: string; // Optional, for products with variants (size, color, etc.)
  quantity: number; // Min: 1, Max: 1000
  // ❌ NO price field
  // ❌ NO total field
  // Backend fetches current price from database to prevent manipulation
}

/**
 * DTO for shipping address creation
 */
export interface CreateShippingAddressDto {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string; // Default: "Pakistan"
}

// ============================================
// UPDATE DTOs
// ============================================

/**
 * DTO for updating an existing order
 * Only modifiable fields (not prices or calculated values)
 */
export interface UpdateOrderDto {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  notes?: string;
  tags?: string[];
  paymentMethod?: string;
}

/**
 * DTO for updating payment status only
 */
export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
}

/**
 * DTO for updating fulfillment status only
 */
export interface UpdateFulfillmentStatusDto {
  fulfillmentStatus: FulfillmentStatus;
}

// ============================================
// QUERY PARAMS
// ============================================

/**
 * Query parameters for listing/filtering orders
 */
export interface OrderQueryParams {
  // Pagination
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100

  // Search
  search?: string; // Search by order number, customer name, or email

  // Filters
  section?: Section;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  customerId?: string; // Filter by specific customer

  // Sorting
  sortBy?: 'orderDate' | 'total' | 'orderNumber' | 'createdAt';
  sortOrder?: 'asc' | 'desc'; // Default: desc

  // Date range
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Complete order response with all details
 */
export interface OrderResponse {
  id: string;
  orderNumber: string;

  // Customer information
  customer: {
    id?: string; // Present if customer account exists
    name: string;
    email: string;
    phone?: string;
  };

  // Order details
  date: Date;
  section: Section;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Items
  items: OrderItemResponse[];
  itemsCount: number;

  // Pricing (all calculated by backend)
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
  totalFormatted: string; // e.g., "Rs 1,250"
  currency: string; // Default: "PKR"

  // Shipping
  shippingAddress?: ShippingAddressResponse;

  // Metadata
  notes?: string;
  tags: string[];
  paymentMethod?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;

  // Guest order flag
  guestOrder: boolean;
}

/**
 * Order item in response
 */
export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  quantity: number;
  price: number; // Price at time of order (snapshot)
  total: number; // Calculated: price × quantity
}

/**
 * Shipping address in response
 */
export interface ShippingAddressResponse {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Order list response with pagination
 */
export interface OrderListResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalOrders: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  stats?: OrderStats;
}

/**
 * Order statistics
 */
export interface OrderStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  unfulfilledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

/**
 * Detailed order statistics by section
 */
export interface OrderStatsBySection {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  paymentStatus: Record<PaymentStatus, number>;
  fulfillmentStatus: Record<FulfillmentStatus, number>;
  bySection: Record<
    Section,
    {
      orders: number;
      revenue: number;
    }
  >;
}

// ============================================
// INTERNAL TYPES (Service Layer Only)
// ============================================

/**
 * Calculated pricing for an order
 * Used internally during order creation
 */
export interface CalculatedOrderPricing {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
}

/**
 * Validated order item with prices from database
 * Used internally after fetching product data
 */
export interface ValidatedOrderItem {
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  quantity: number;
  price: number; // Fetched from database
  total: number; // Calculated: price × quantity
  section: Section;
}

/**
 * Discount calculation result
 * Used internally when applying discount codes
 */
export interface DiscountCalculation {
  code: string;
  discountId: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // Percentage (0-100) or fixed amount
  appliedAmount: number; // Actual discount amount applied
}

/**
 * Customer data for order creation
 * Used when linking/creating customer
 */
export interface OrderCustomerData {
  customerId?: string;
  name: string;
  email: string;
  phone?: string;
  isGuest: boolean;
}

/**
 * Order creation data prepared for database
 * Used in service layer before creating order
 */
export interface PreparedOrderData {
  orderNumber: string;
  customer: OrderCustomerData;
  section: Section;
  items: ValidatedOrderItem[];
  pricing: CalculatedOrderPricing;
  shippingAddress?: CreateShippingAddressDto;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  notes?: string;
  tags: string[];
  paymentMethod?: string;
  discountCode?: string;
  createdBy: string;
}

// ============================================
// EXPORT HELPER TYPES
// ============================================

/**
 * CSV export column mapping
 */
export interface OrderCsvRow {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  section: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  itemsCount: number;
  total: number;
}
