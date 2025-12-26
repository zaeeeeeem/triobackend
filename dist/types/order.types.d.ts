import { PaymentStatus, OrderStatus, Section } from '@prisma/client';
/**
 * DTO for creating a new order
 * SECURITY: Frontend should NOT send prices - backend calculates all prices
 */
export interface CreateOrderDto {
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    section?: Section;
    items: CreateOrderItemDto[];
    discountCode?: string;
    shippingAddress?: CreateShippingAddressDto;
    paymentStatus?: PaymentStatus;
    orderStatus?: OrderStatus;
    notes?: string;
    tags?: string[];
    paymentMethod?: string;
}
/**
 * DTO for order item creation
 * CRITICAL: NO price or total fields - backend calculates these from database
 */
export interface CreateOrderItemDto {
    productId: string;
    variantId?: string;
    quantity: number;
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
    country?: string;
}
/**
 * DTO for updating an existing order
 * Only modifiable fields (not prices or calculated values)
 */
export interface UpdateOrderDto {
    paymentStatus?: PaymentStatus;
    orderStatus?: OrderStatus;
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
 * DTO for updating order status only
 */
export interface UpdateOrderStatusDto {
    orderStatus: OrderStatus;
}
/**
 * Query parameters for listing/filtering orders
 */
export interface OrderQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    section?: Section;
    paymentStatus?: PaymentStatus;
    orderStatus?: OrderStatus;
    customerId?: string;
    sortBy?: 'orderDate' | 'total' | 'orderNumber' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
}
/**
 * Complete order response with all details
 */
export interface OrderResponse {
    id: string;
    orderNumber: string;
    customer: {
        id?: string;
        name: string;
        email: string;
        phone?: string;
    };
    date: Date;
    section: Section;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    items: OrderItemResponse[];
    itemsCount: number;
    subtotal: number;
    tax: number;
    discount: number;
    shippingCost: number;
    total: number;
    totalFormatted: string;
    currency: string;
    shippingAddress?: ShippingAddressResponse;
    notes?: string;
    tags: string[];
    paymentMethod?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
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
    price: number;
    total: number;
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
    pendingPaymentOrders: number;
    ordersByStatus: Record<OrderStatus, number>;
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
    orderStatus: Record<OrderStatus, number>;
    bySection: Record<Section, {
        orders: number;
        revenue: number;
    }>;
}
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
    price: number;
    total: number;
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
    value: number;
    appliedAmount: number;
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
    orderStatus: OrderStatus;
    notes?: string;
    tags: string[];
    paymentMethod?: string;
    discountCode?: string;
    createdBy?: string;
}
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
    orderStatus: string;
    itemsCount: number;
    total: number;
}
//# sourceMappingURL=order.types.d.ts.map