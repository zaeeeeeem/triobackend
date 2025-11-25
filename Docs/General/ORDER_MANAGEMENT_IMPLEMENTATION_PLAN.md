# Order Management Module - Implementation Plan

**Date**: November 24, 2024
**Module**: Order Management
**Frontend Cart**: Managed by frontend (we receive checkout data directly)

---

## Executive Summary

The Order Management module will handle all order operations across three sections (Cafe, Flowers, Books). Frontend manages the cart UI/state, and sends order data to backend on checkout. Backend is responsible for **server-side price calculation, inventory validation, and security**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema (Already Exists)](#database-schema-already-exists)
3. [Type Definitions](#type-definitions)
4. [Service Layer](#service-layer)
5. [API Endpoints](#api-endpoints)
6. [Security Implementation](#security-implementation)
7. [Business Rules](#business-rules)
8. [Implementation Phases](#implementation-phases)
9. [Testing Requirements](#testing-requirements)

---

## Architecture Overview

### Flow: Frontend Cart → Backend Order Creation

```
┌─────────────┐
│  Frontend   │
│   (Cart)    │ User adds items, manages quantities
└──────┬──────┘
       │
       │ User clicks "Checkout"
       ▼
┌─────────────────────────────────────────┐
│ Frontend sends checkout request:        │
│ {                                       │
│   items: [                              │
│     { productId, variantId?, quantity } │
│   ],                                    │
│   customer, shippingAddress,            │
│   discountCode?, section                │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Backend Order Service:                  │
│ 1. Fetch product prices from DB         │
│ 2. Validate inventory availability      │
│ 3. Calculate subtotal (NEVER trust FE)  │
│ 4. Apply discount (validate code)       │
│ 5. Calculate tax (18% GST)              │
│ 6. Validate shipping cost               │
│ 7. Calculate total                      │
│ 8. Create order + order items           │
│ 9. Reserve inventory                    │
│ 10. Update customer stats               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Order     │
│  Created    │ Return order with calculated prices
└─────────────┘
```

---

## Database Schema (Already Exists)

### ✅ Models Already Defined in Prisma

#### 1. Order Model
Located at: `prisma/schema.prisma:343-402`

```prisma
model Order {
  id          String   @id @default(uuid())
  orderNumber String   @unique @map("order_number")

  // Customer Link (NULL for guest orders)
  customerId  String?  @map("customer_id")
  customerEmail String  @map("customer_email")
  customerName  String  @map("customer_name")
  customerPhone String? @map("customer_phone")

  // Guest Tracking
  guestOrder Boolean @default(false) @map("guest_order")
  guestToken String? @map("guest_token")

  section     Section

  // Status
  paymentStatus     PaymentStatus     @default(PENDING)
  fulfillmentStatus FulfillmentStatus @default(UNFULFILLED)

  // Pricing
  subtotal     Decimal @db.Decimal(10, 2)
  tax          Decimal @default(0) @db.Decimal(10, 2)
  shippingCost Decimal @default(0) @db.Decimal(10, 2)
  discount     Decimal @default(0) @db.Decimal(10, 2)
  total        Decimal @db.Decimal(10, 2)
  currency     String  @default("PKR")

  // Payment details
  paymentMethod String? @map("payment_method")

  // Metadata
  notes String? @db.Text
  tags  String[]

  // Timestamps
  orderDate DateTime  @default(now()) @map("order_date")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  createdBy String

  // Relations
  customer        Customer?        @relation(...)
  creator         User             @relation(...)
  items           OrderItem[]
  shippingAddress ShippingAddress?
}
```

#### 2. OrderItem Model
```prisma
model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String

  productName String
  sku         String
  variantId   String?

  price    Decimal @db.Decimal(10, 2)
  quantity Int
  total    Decimal @db.Decimal(10, 2)

  order   Order   @relation(...)
  product Product @relation(...)
}
```

#### 3. ShippingAddress Model
```prisma
model ShippingAddress {
  id       String  @id @default(uuid())
  orderId  String  @unique

  fullName    String
  phone       String
  email       String?
  address     String
  city        String
  state       String
  postalCode  String
  country     String  @default("Pakistan")

  order Order @relation(...)
}
```

#### 4. Enums
```prisma
enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum FulfillmentStatus {
  UNFULFILLED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum Section {
  CAFE
  FLOWERS
  BOOKS
}
```

**Status**: ✅ **No database changes needed!**

---

## Type Definitions

### Phase 1: Create Order Types

**File**: `src/types/order.types.ts`

```typescript
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentStatus, FulfillmentStatus, Section } from '@prisma/client';

// ============================================
// REQUEST DTOs (What Frontend Sends)
// ============================================

export interface CreateOrderDto {
  // Customer info (required for all orders)
  customer: {
    name: string;
    email: string;
    phone?: string;
  };

  // Section (required)
  section: Section;

  // Items (ONLY productId, variantId, quantity - NO PRICES)
  items: CreateOrderItemDto[];

  // Optional discount code
  discountCode?: string;

  // Shipping address (required for physical goods)
  shippingAddress?: CreateShippingAddressDto;

  // Initial statuses (default: PENDING, UNFULFILLED)
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;

  // Optional metadata
  notes?: string;
  tags?: string[];

  // Payment method (e.g., "cash", "card", "jazzcash")
  paymentMethod?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  variantId?: string;  // Optional, for products with variants
  quantity: number;    // Min: 1, Max: 1000
  // ❌ NO price, NO total - backend calculates these
}

export interface CreateShippingAddressDto {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;  // Default: "Pakistan"
}

// ============================================
// UPDATE DTOs
// ============================================

export interface UpdateOrderDto {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  notes?: string;
  tags?: string[];
  paymentMethod?: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
}

export interface UpdateFulfillmentStatusDto {
  fulfillmentStatus: FulfillmentStatus;
}

// ============================================
// QUERY PARAMS
// ============================================

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;  // Search by order number, customer name, email
  section?: Section;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  sortBy?: 'orderDate' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;  // ISO date string
  dateTo?: string;    // ISO date string
  customerId?: string;  // Filter by customer
}

// ============================================
// RESPONSE TYPES
// ============================================

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
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItemResponse[];
  itemsCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
  totalFormatted: string;  // e.g., "Rs 1,250"
  shippingAddress?: ShippingAddressResponse;
  notes?: string;
  tags: string[];
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  guestOrder: boolean;
}

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

export interface OrderStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  unfulfilledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrderStatsBySection {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  paymentStatus: Record<PaymentStatus, number>;
  fulfillmentStatus: Record<FulfillmentStatus, number>;
  bySection: Record<Section, {
    orders: number;
    revenue: number;
  }>;
}

// ============================================
// INTERNAL TYPES (Service Layer)
// ============================================

export interface CalculatedOrderPricing {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
}

export interface ValidatedOrderItem {
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  quantity: number;
  price: number;  // From database
  total: number;  // Calculated
  section: Section;
}

export interface DiscountCalculation {
  code: string;
  discountId: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliedAmount: number;
}
```

---

## Service Layer

### Phase 2: Core Services

#### A. Order Service (`src/services/order.service.ts`)

**Responsibilities:**
- Create orders with server-side price calculation
- Validate inventory availability
- Apply discount codes
- Calculate tax and shipping
- Update order statuses
- Manage order lifecycle
- Generate order statistics

**Key Methods:**

```typescript
export class OrderService {
  /**
   * Create a new order
   * CRITICAL: All prices calculated server-side
   */
  async createOrder(
    data: CreateOrderDto,
    createdBy: string
  ): Promise<OrderResponse> {
    // 1. Validate section consistency
    // 2. Fetch and validate products
    // 3. Check inventory availability
    // 4. Calculate prices (NEVER trust client)
    // 5. Apply discount code (if provided)
    // 6. Calculate tax (18% GST)
    // 7. Validate shipping cost
    // 8. Generate order number
    // 9. Create order in transaction
    // 10. Reserve inventory
    // 11. Update customer statistics
    // 12. Return order with calculated prices
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderResponse> { }

  /**
   * List orders with filters and pagination
   */
  async listOrders(params: OrderQueryParams): Promise<OrderListResponse> { }

  /**
   * Update order
   */
  async updateOrder(
    orderId: string,
    data: UpdateOrderDto
  ): Promise<OrderResponse> { }

  /**
   * Update payment status with validation
   */
  async updatePaymentStatus(
    orderId: string,
    newStatus: PaymentStatus
  ): Promise<OrderResponse> { }

  /**
   * Update fulfillment status with validation
   */
  async updateFulfillmentStatus(
    orderId: string,
    newStatus: FulfillmentStatus
  ): Promise<OrderResponse> { }

  /**
   * Soft delete order
   */
  async deleteOrder(orderId: string, hard?: boolean): Promise<void> { }

  /**
   * Duplicate order
   */
  async duplicateOrder(orderId: string): Promise<OrderResponse> { }

  /**
   * Get order statistics
   */
  async getOrderStats(params: {
    dateFrom?: Date;
    dateTo?: Date;
    section?: Section;
  }): Promise<OrderStatsBySection> { }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCsv(params: OrderQueryParams): Promise<string> { }

  // ============================================
  // PRIVATE HELPER METHODS (CRITICAL)
  // ============================================

  /**
   * Validate and fetch products with current prices
   * NEVER trust client-provided prices
   */
  private async validateAndFetchProducts(
    items: CreateOrderItemDto[],
    section: Section
  ): Promise<ValidatedOrderItem[]> {
    // 1. Fetch products from database
    // 2. Validate all products exist
    // 3. Validate section consistency
    // 4. Check inventory availability
    // 5. Get variant prices if applicable
    // 6. Calculate line totals
    // 7. Return validated items with DB prices
  }

  /**
   * Apply discount code with validation
   */
  private async applyDiscountCode(
    code: string,
    subtotal: number,
    customerId?: string
  ): Promise<DiscountCalculation> {
    // 1. Find discount code
    // 2. Validate expiry date
    // 3. Validate usage limits
    // 4. Validate per-user limits
    // 5. Validate minimum order amount
    // 6. Calculate discount amount
    // 7. Apply max discount limits
    // 8. Return discount calculation
  }

  /**
   * Calculate tax (18% GST for Pakistan)
   */
  private calculateTax(
    subtotal: number,
    discount: number
  ): number {
    const taxableAmount = subtotal - discount;
    const TAX_RATE = 0.18;  // 18% GST
    return Math.round(taxableAmount * TAX_RATE * 100) / 100;
  }

  /**
   * Validate shipping cost
   */
  private async validateShippingCost(
    providedCost: number,
    section: Section,
    city: string
  ): Promise<number> {
    // Option A: Validate against shipping rate table
    // Option B: Integrate with shipping API
    // For now: Simple validation
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    // Format: #1001, #1002, etc.
    // Get last order number and increment
  }

  /**
   * Reserve inventory for order items
   */
  private async reserveInventory(
    items: ValidatedOrderItem[]
  ): Promise<void> {
    // Mark stock as "committed" (not available for sale)
  }

  /**
   * Update customer order statistics
   */
  private async updateCustomerStats(
    customerId: string,
    orderTotal: number
  ): Promise<void> {
    // Increment totalOrders
    // Add to totalSpent
    // Recalculate averageOrderValue
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: PaymentStatus | FulfillmentStatus,
    newStatus: PaymentStatus | FulfillmentStatus,
    type: 'payment' | 'fulfillment'
  ): void {
    // Check if transition is allowed
    // Throw error if invalid
  }
}
```

#### B. Discount Service (`src/services/discount.service.ts`)

**Responsibilities:**
- Validate discount codes
- Calculate discount amounts
- Track discount usage
- Manage discount lifecycle

**Key Methods:**

```typescript
export class DiscountService {
  async validateDiscount(
    code: string,
    subtotal: number,
    customerId?: string
  ): Promise<DiscountCalculation> { }

  async incrementUsage(discountId: string, orderId: string): Promise<void> { }

  async getDiscountByCode(code: string): Promise<Discount | null> { }
}
```

#### C. Inventory Service (Update Existing)

**File**: `src/services/inventory.service.ts`

**New Methods:**

```typescript
export class InventoryService {
  /**
   * Check if stock is available for multiple items
   */
  async checkAvailability(
    items: { productId: string; quantity: number }[]
  ): Promise<{ available: boolean; errors: string[] }> { }

  /**
   * Reserve stock for order
   */
  async reserveStock(
    items: { productId: string; quantity: number }[]
  ): Promise<void> { }

  /**
   * Release reserved stock (order cancelled)
   */
  async releaseStock(
    items: { productId: string; quantity: number }[]
  ): Promise<void> { }

  /**
   * Commit stock (order fulfilled)
   */
  async commitStock(
    items: { productId: string; quantity: number }[]
  ): Promise<void> { }
}
```

---

## API Endpoints

### Phase 3: Routes and Controllers

#### Order Routes (`src/routes/order.routes.ts`)

```typescript
// Public routes (customer access)
POST   /api/v1/orders                    - Create order (checkout)
GET    /api/v1/orders/:id                - Get order details
GET    /api/v1/customers/orders          - Get my orders (customer auth)

// Admin routes (require admin auth)
GET    /api/v1/admin/orders              - List all orders
GET    /api/v1/admin/orders/:id          - Get order by ID
PATCH  /api/v1/admin/orders/:id          - Update order
PATCH  /api/v1/admin/orders/:id/payment-status      - Update payment status
PATCH  /api/v1/admin/orders/:id/fulfillment-status  - Update fulfillment status
DELETE /api/v1/admin/orders/:id          - Delete order
POST   /api/v1/admin/orders/:id/duplicate - Duplicate order
GET    /api/v1/admin/orders/stats        - Get order statistics
GET    /api/v1/admin/orders/export       - Export orders to CSV
```

#### Order Controller (`src/controllers/order.controller.ts`)

```typescript
export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) { }
  async getById(req: Request, res: Response, next: NextFunction) { }
  async list(req: Request, res: Response, next: NextFunction) { }
  async update(req: Request, res: Response, next: NextFunction) { }
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction) { }
  async updateFulfillmentStatus(req: Request, res: Response, next: NextFunction) { }
  async delete(req: Request, res: Response, next: NextFunction) { }
  async duplicate(req: Request, res: Response, next: NextFunction) { }
  async getStats(req: Request, res: Response, next: NextFunction) { }
  async exportCsv(req: Request, res: Response, next: NextFunction) { }
}
```

---

## Security Implementation

### Critical Security Rules (FROM API DOCS)

#### 1. **Server-Side Price Calculation**

```typescript
// ❌ NEVER DO THIS (Client can manipulate)
const order = await prisma.order.create({
  data: {
    subtotal: req.body.subtotal,  // ❌ Trusting client
    total: req.body.total,         // ❌ Trusting client
  },
});

// ✅ ALWAYS DO THIS (Server calculates)
const items = await this.validateAndFetchProducts(req.body.items);
const subtotal = items.reduce((sum, item) => sum + item.total, 0);
const discount = await this.applyDiscount(req.body.discountCode, subtotal);
const tax = this.calculateTax(subtotal, discount);
const total = subtotal - discount + tax + shippingCost;

const order = await prisma.order.create({
  data: {
    subtotal,  // ✅ Calculated by server
    tax,       // ✅ Calculated by server
    discount,  // ✅ Calculated by server
    total,     // ✅ Calculated by server
  },
});
```

#### 2. **Inventory Validation**

```typescript
// Check stock before creating order
for (const item of items) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
  });

  if (product.stockQuantity < item.quantity) {
    throw new ValidationError(
      `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available.`
    );
  }

  // Prevent unreasonably large orders (potential attack)
  if (item.quantity > 1000) {
    throw new ValidationError('Quantity exceeds maximum allowed per order');
  }
}
```

#### 3. **Status Transition Validation**

```typescript
const PAYMENT_TRANSITIONS = {
  PENDING: ['PAID', 'FAILED'],
  PAID: ['REFUNDED'],
  FAILED: ['PENDING'],
  REFUNDED: [],  // Cannot change from refunded
};

function validatePaymentTransition(current: PaymentStatus, next: PaymentStatus) {
  const allowed = PAYMENT_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new ValidationError(
      `Cannot change payment status from ${current} to ${next}`
    );
  }
}
```

#### 4. **Discount Code Validation**

```typescript
async applyDiscountCode(code: string, subtotal: number, customerId?: string) {
  const discount = await prisma.discount.findUnique({ where: { code } });

  if (!discount) {
    throw new NotFoundError('Invalid discount code');
  }

  // Check expiry
  if (discount.expiresAt < new Date()) {
    throw new ValidationError('Discount code has expired');
  }

  // Check usage limits
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    throw new ValidationError('Discount code has reached usage limit');
  }

  // Check per-user limits
  if (customerId && discount.perUserLimit) {
    const usage = await prisma.discountUsage.count({
      where: { discountId: discount.id, customerId },
    });
    if (usage >= discount.perUserLimit) {
      throw new ValidationError('You have already used this discount code');
    }
  }

  // Check minimum order amount
  if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
    throw new ValidationError(
      `Minimum order amount of Rs ${discount.minOrderAmount} required`
    );
  }

  return discount;
}
```

#### 5. **Transaction Safety**

```typescript
async createOrder(data: CreateOrderDto, createdBy: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create order
    const order = await tx.order.create({ data: orderData });

    // 2. Create order items
    await tx.orderItem.createMany({ data: orderItems });

    // 3. Create shipping address
    if (shippingAddress) {
      await tx.shippingAddress.create({ data: { orderId: order.id, ...shippingAddress } });
    }

    // 4. Reserve inventory
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    // 5. Record discount usage
    if (discountCode) {
      await tx.discountUsage.create({ data: { orderId: order.id, discountId } });
      await tx.discount.update({
        where: { id: discountId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // 6. Update customer stats
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: order.total },
        },
      });
    }

    return order;
  });
}
```

---

## Business Rules

### 1. Order Number Generation

```typescript
private async generateOrderNumber(): Promise<string> {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  let nextNumber = 1001;  // Starting number
  if (lastOrder && lastOrder.orderNumber) {
    const lastNumber = parseInt(lastOrder.orderNumber.replace('#', ''));
    nextNumber = lastNumber + 1;
  }

  return `#${nextNumber}`;
}
```

### 2. Section Consistency Validation

```typescript
private validateSectionConsistency(
  items: CreateOrderItemDto[],
  orderSection: Section
): void {
  // All items must belong to the same section as the order
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (product.section !== orderSection) {
      throw new ValidationError(
        `All items must belong to the ${orderSection} section. ` +
        `Found item from ${product.section} section.`
      );
    }
  }
}
```

### 3. Tax Calculation (18% GST Pakistan)

```typescript
private calculateTax(subtotal: number, discount: number): number {
  const taxableAmount = subtotal - discount;
  const TAX_RATE = 0.18;  // 18% GST
  return Math.round(taxableAmount * TAX_RATE * 100) / 100;
}
```

### 4. Deletion Rules

```typescript
async deleteOrder(orderId: string, hard: boolean = false): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Cannot delete paid orders
  if (order.paymentStatus === 'PAID') {
    throw new ValidationError('Cannot delete paid orders. Refund first.');
  }

  // Cannot delete fulfilled orders
  if (order.fulfillmentStatus === 'FULFILLED' || order.fulfillmentStatus === 'PARTIAL') {
    throw new ValidationError('Cannot delete fulfilled orders');
  }

  if (hard) {
    // Hard delete (admin only)
    await prisma.order.delete({ where: { id: orderId } });
  } else {
    // Soft delete
    await prisma.order.update({
      where: { id: orderId },
      data: { deletedAt: new Date() },
    });
  }
}
```

---

## Implementation Phases

### **Phase 1: Type Definitions and Validators** (1-2 hours)

**Tasks:**
1. ✅ Create `src/types/order.types.ts`
2. ✅ Create `src/validators/order.validator.ts`
   - `createOrderValidator`
   - `updateOrderValidator`
   - `updatePaymentStatusValidator`
   - `updateFulfillmentStatusValidator`
   - `orderQueryValidator`
3. ✅ Export all types from `src/types/index.ts`

**Deliverables:**
- Complete TypeScript interfaces
- Validation schemas for all endpoints
- Input sanitization rules

---

### **Phase 2: Service Layer - Part A (Price Calculation)** (2-3 hours)

**Tasks:**
1. ✅ Create `src/services/order.service.ts`
2. ✅ Implement price calculation methods:
   - `validateAndFetchProducts()` - Fetch DB prices
   - `calculateTax()` - 18% GST
   - `validateShippingCost()` - Validate shipping
3. ✅ Implement order number generation
4. ✅ Write unit tests for calculations

**Deliverables:**
- Secure price calculation logic
- Server-side validation
- Test coverage for critical calculations

---

### **Phase 3: Service Layer - Part B (Order Creation)** (3-4 hours)

**Tasks:**
1. ✅ Implement `createOrder()` method
2. ✅ Add inventory validation
3. ✅ Add discount code support
4. ✅ Implement transaction-safe order creation
5. ✅ Add customer statistics updates
6. ✅ Handle guest vs customer orders

**Deliverables:**
- Complete order creation flow
- Transaction safety
- Inventory management
- Customer linking

---

### **Phase 4: Service Layer - Part C (Order Management)** (2-3 hours)

**Tasks:**
1. ✅ Implement `getOrderById()`
2. ✅ Implement `listOrders()` with filters
3. ✅ Implement `updateOrder()`
4. ✅ Implement `updatePaymentStatus()`
5. ✅ Implement `updateFulfillmentStatus()`
6. ✅ Implement `deleteOrder()`
7. ✅ Implement status transition validation

**Deliverables:**
- CRUD operations
- Status management
- Filtering and pagination
- Soft delete support

---

### **Phase 5: Service Layer - Part D (Analytics & Export)** (1-2 hours)

**Tasks:**
1. ✅ Implement `getOrderStats()`
2. ✅ Implement `exportOrdersToCsv()`
3. ✅ Implement `duplicateOrder()`

**Deliverables:**
- Order statistics aggregation
- CSV export functionality
- Order duplication

---

### **Phase 6: Discount Service** (1-2 hours)

**Tasks:**
1. ✅ Create Discount model in Prisma (if not exists)
2. ✅ Create `src/services/discount.service.ts`
3. ✅ Implement discount validation
4. ✅ Implement usage tracking

**Deliverables:**
- Discount code system
- Usage limits
- Validation rules

---

### **Phase 7: Controllers** (2-3 hours)

**Tasks:**
1. ✅ Create `src/controllers/order.controller.ts`
2. ✅ Create `src/controllers/admin-order.controller.ts`
3. ✅ Implement all controller methods
4. ✅ Add error handling
5. ✅ Add request validation

**Deliverables:**
- Request handlers
- Error responses
- Validation integration

---

### **Phase 8: Routes** (2-3 hours)

**Tasks:**
1. ✅ Create `src/routes/order.routes.ts`
2. ✅ Create `src/routes/admin-order.routes.ts`
3. ✅ Add Swagger documentation
4. ✅ Configure middleware (auth, validation)
5. ✅ Register routes in main app

**Deliverables:**
- API endpoints
- Swagger docs
- Route protection

---

### **Phase 9: Testing** (2-3 hours)

**Tasks:**
1. ✅ Test order creation flow
2. ✅ Test price calculation
3. ✅ Test inventory validation
4. ✅ Test discount codes
5. ✅ Test status transitions
6. ✅ Test error cases

**Deliverables:**
- Manual testing results
- Bug fixes
- Documentation updates

---

## Testing Requirements

### Manual Testing Checklist

#### Order Creation Tests:
- [ ] Create order with valid data
- [ ] Create order without prices (backend calculates)
- [ ] Create order with discount code
- [ ] Create order with invalid product ID
- [ ] Create order with insufficient stock
- [ ] Create order with mixed sections (should fail)
- [ ] Create guest order
- [ ] Create customer order
- [ ] Create order with shipping address

#### Price Calculation Tests:
- [ ] Verify subtotal calculation
- [ ] Verify tax calculation (18%)
- [ ] Verify discount application
- [ ] Verify total calculation
- [ ] Attempt price manipulation (should fail)

#### Status Management Tests:
- [ ] Update payment status (valid transition)
- [ ] Update payment status (invalid transition - should fail)
- [ ] Update fulfillment status
- [ ] Delete pending order
- [ ] Delete paid order (should fail)

#### Query Tests:
- [ ] List all orders
- [ ] Filter by section
- [ ] Filter by payment status
- [ ] Filter by fulfillment status
- [ ] Search by customer name
- [ ] Search by order number
- [ ] Pagination

#### Security Tests:
- [ ] Attempt to set price to $0 (should use DB price)
- [ ] Attempt to use expired discount code (should fail)
- [ ] Attempt to exceed stock (should fail)
- [ ] Attempt invalid status transition (should fail)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 1-2 hours | None |
| Phase 2 | 2-3 hours | Phase 1 |
| Phase 3 | 3-4 hours | Phase 1, 2 |
| Phase 4 | 2-3 hours | Phase 3 |
| Phase 5 | 1-2 hours | Phase 4 |
| Phase 6 | 1-2 hours | Phase 1 |
| Phase 7 | 2-3 hours | Phase 1-6 |
| Phase 8 | 2-3 hours | Phase 7 |
| Phase 9 | 2-3 hours | Phase 8 |

**Total Estimated Time**: 16-25 hours

---

## Success Criteria

- ✅ All prices calculated server-side
- ✅ Inventory validated before order creation
- ✅ Discount codes validated and tracked
- ✅ Guest and customer orders supported
- ✅ Order statistics accurate
- ✅ CSV export working
- ✅ Status transitions validated
- ✅ All endpoints documented with Swagger
- ✅ Zero price manipulation vulnerabilities
- ✅ Transaction safety for order creation

---

## Next Steps

1. **Review and approve this plan**
2. **Start with Phase 1** (Type definitions)
3. **Proceed sequentially** through phases
4. **Test after each phase** to catch issues early
5. **Update documentation** as we implement

---

**Document Version**: 1.0
**Last Updated**: November 24, 2024
**Status**: Ready for Implementation