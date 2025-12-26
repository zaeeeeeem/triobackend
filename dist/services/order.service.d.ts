import { CreateOrderDto, UpdateOrderDto, OrderQueryParams, OrderResponse, OrderListResponse, OrderStatsBySection } from '../types/order.types';
import { PaymentStatus, OrderStatus, Section } from '@prisma/client';
interface AuthenticatedCustomerContext {
    id: string;
    email: string;
}
/**
 * Order Service
 *
 * CRITICAL SECURITY:
 * - ALL prices are calculated server-side
 * - NEVER trust client-provided prices
 * - Always fetch current prices from database
 * - Validate inventory before creating orders
 * - Use transactions for data consistency
 */
export declare class OrderService {
    private readonly TAX_RATE;
    private readonly DEFAULT_CURRENCY;
    private readonly MAX_ITEMS_PER_ORDER;
    private readonly DEFAULT_PAGE;
    private readonly DEFAULT_LIMIT;
    private readonly MAX_LIMIT;
    /**
     * Generate unique order number
     * Format: #1001, #1002, etc.
     */
    private generateOrderNumber;
    /**
     * Validate and fetch products with current prices from database
     *
     * SECURITY CRITICAL:
     * - Fetches prices from DB (NEVER trusts client)
     * - Validates inventory availability
     * - Prevents overselling
     * - Supports mixed-category orders (CAFE + FLOWERS + BOOKS in one order)
     */
    private validateAndFetchProducts;
    /**
     * Calculate tax (18% GST for Pakistan)
     * Applied to taxable amount (subtotal - discount)
     */
    private calculateTax;
    /**
     * Validate shipping cost
     * For now, accepts the provided cost
     * TODO: Integrate with shipping API or validate against rate table
     */
    private validateShippingCost;
    /**
     * Calculate complete order pricing
     */
    private calculateOrderPricing;
    /**
     * Format price for display
     */
    private formatPrice;
    /**
     * Reserve inventory for order items
     * Decrements stockQuantity to prevent overselling
     */
    private reserveInventory;
    /**
     * Update customer order statistics
     * Increments totalOrders, totalSpent, and recalculates averageOrderValue
     */
    private updateCustomerStats;
    /**
     * Validate payment status transition
     */
    private validatePaymentStatusTransition;
    /**
     * Validate order status transition for food delivery workflow
     */
    private validateOrderStatusTransition;
    /**
     * Transform database order to response format
     */
    private transformOrderToResponse;
    /**
     * Create a new order
     *
     * CRITICAL SECURITY:
     * - All prices calculated server-side from database
     * - Inventory validated before creation
     * - Uses database transaction for consistency
     * - Guest orders supported
     */
    createOrder(data: CreateOrderDto, createdBy?: string, authCustomer?: AuthenticatedCustomerContext): Promise<OrderResponse>;
    /**
     * Get order by ID
     */
    getOrderById(orderId: string): Promise<OrderResponse>;
    /**
     * Get order by order number
     */
    getOrderByNumber(orderNumber: string): Promise<OrderResponse>;
    /**
     * List orders with filtering, pagination, and search
     */
    listOrders(params: OrderQueryParams): Promise<OrderListResponse>;
    /**
     * Update order
     */
    updateOrder(orderId: string, data: UpdateOrderDto): Promise<OrderResponse>;
    /**
     * Update payment status only
     */
    updatePaymentStatus(orderId: string, newStatus: PaymentStatus): Promise<OrderResponse>;
    /**
     * Update order status only
     */
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<OrderResponse>;
    /**
     * Delete order (soft delete by default)
     */
    deleteOrder(orderId: string, hard?: boolean): Promise<void>;
    /**
     * Duplicate order
     * Creates a new order with same items and customer
     */
    duplicateOrder(orderId: string, createdBy?: string): Promise<OrderResponse>;
    /**
     * Get order statistics
     */
    getOrderStats(params: {
        dateFrom?: Date;
        dateTo?: Date;
        section?: Section;
    }): Promise<OrderStatsBySection>;
    /**
     * Export orders to CSV
     */
    exportOrdersToCsv(params: OrderQueryParams): Promise<string>;
}
export declare const orderService: OrderService;
export {};
//# sourceMappingURL=order.service.d.ts.map