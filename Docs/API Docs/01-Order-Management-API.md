# Order Management API Documentation

**Version:** 1.0.0
**Last Updated:** November 19, 2025
**Module:** Order Management

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [Business Rules](#business-rules)
5. [Frontend Requirements](#frontend-requirements)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Overview

The Order Management module handles all operations related to customer orders across three business sections: **Cafe**, **Flowers**, and **Books**. This includes creating, viewing, updating, filtering, and exporting orders.

### Key Features
- Multi-section order support (Cafe, Flowers, Books)
- Payment status tracking
- Fulfillment status management
- Order search and filtering
- CSV export functionality
- Order statistics and analytics
- Customer association
- Shipping address management
- Order notes and tags

**Base Path:** All endpoints below are served under `/api/v1` in local development (see `env.API_VERSION`). Example: `GET /api/v1/orders`.

---

## Data Models

### 1. Order Model

**TypeScript Interface:**
```typescript
interface Order {
  id: string;                     // Unique order identifier
  orderNumber: string;            // Auto-generated, e.g. "#1034"
  customer: {
    id?: string;                  // Present when tied to a registered customer
    name: string;
    email: string;
    phone?: string;
  };
  date: string;                   // ISO timestamp from orderDate
  section: "CAFE" | "FLOWERS" | "BOOKS";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillmentStatus: "UNFULFILLED" | "FULFILLED" | "PARTIAL" | "SCHEDULED";
  items: OrderItem[];
  itemsCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;                  // Numeric total
  totalFormatted: string;         // e.g. "PKR 1,250"
  currency: string;               // e.g. "PKR"
  shippingAddress?: ShippingAddress;
  notes?: string;
  tags: string[];
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  guestOrder: boolean;
}
```

### 2. OrderItem Model

```typescript
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  quantity: number;
  price: number;                  // Unit price captured at order time
  total: number;                  // price × quantity
}
```

### 3. ShippingAddress Model

```typescript
interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}
```

### 4. Payment Status Enum

```typescript
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
```

### 5. Fulfillment Status Enum

```typescript
type FulfillmentStatus = "UNFULFILLED" | "FULFILLED" | "PARTIAL" | "SCHEDULED";
```

---

## API Endpoints

### 1. Get All Orders

**Endpoint:** `GET /api/v1/orders`

**Description:** Retrieve a list of all orders with optional filtering, pagination, and sorting.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 20, max: 100) | `20` |
| `search` | string | No | Search by order number, customer name, or email | `"Sarah Khan"` |
| `section` | string | No | Filter by section (`CAFE`, `FLOWERS`, `BOOKS`) | `"CAFE"` |
| `paymentStatus` | string | No | Filter by payment status (`PENDING`, `PAID`, `FAILED`, `REFUNDED`) | `"PAID"` |
| `fulfillmentStatus` | string | No | Filter by fulfillment status (`UNFULFILLED`, `PARTIAL`, `FULFILLED`, `SCHEDULED`) | `"UNFULFILLED"` |
| `customerId` | string (UUID) | No | Filter by specific customer | `"64c6b5c4-..."` |
| `sortBy` | string | No | Sort field (`orderDate`, `total`, `orderNumber`, `createdAt`, default `orderDate`) | `"total"` |
| `sortOrder` | string | No | Sort order: `asc`, `desc` (default: `desc`) | `"desc"` |
| `dateFrom` | string | No | Filter orders from date (ISO 8601) | `"2025-01-01"` |
| `dateTo` | string | No | Filter orders to date (ISO 8601) | `"2025-12-31"` |

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "1",
        "orderNumber": "#1034",
        "customer": {
          "name": "Ayesha Khan",
          "email": "ayesha.khan@email.com",
          "phone": "+92 300 1234567"
        },
        "date": "2025-11-19T14:30:00.000Z",
        "section": "CAFE",
        "paymentStatus": "PAID",
        "fulfillmentStatus": "FULFILLED",
        "items": [
          {
            "id": "item-1",
            "productId": "prod-101",
            "productName": "Cappuccino",
            "sku": "CAF-CAP-001",
            "quantity": 2,
            "price": 350,
            "total": 700
          }
        ],
        "itemsCount": 1,
        "subtotal": 1250,
        "tax": 0,
        "discount": 0,
        "shippingCost": 0,
        "total": 1250,
        "totalFormatted": "PKR 1,250",
        "currency": "PKR",
        "tags": ["urgent", "vip"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalOrders": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

> ℹ️ Use `GET /api/v1/orders/stats` for aggregated metrics (total revenue, status breakdowns, etc.).

---

### 2. Get Order by ID

**Endpoint:** `GET /api/v1/orders/:id`

**Description:** Retrieve detailed information about a specific order.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "orderNumber": "#1034",
    "customer": {
      "name": "Ayesha Khan",
      "email": "ayesha.khan@email.com",
      "phone": "+92 300 1234567"
    },
    "date": "2025-11-19T14:30:00.000Z",
    "section": "CAFE",
    "paymentStatus": "PAID",
    "fulfillmentStatus": "FULFILLED",
    "items": [
      {
        "id": "item-1",
        "productId": "prod-101",
        "productName": "Cappuccino",
        "sku": "CAF-CAP-001",
        "variantId": "variant-large",
        "quantity": 2,
        "price": 350,
        "total": 700
      },
      {
        "id": "item-2",
        "productId": "prod-102",
        "productName": "Chocolate Croissant",
        "sku": "CAF-CRO-002",
        "quantity": 1,
        "price": 550,
        "total": 550
      }
    ],
    "itemsCount": 3,
    "subtotal": 1250,
    "tax": 0,
    "shippingCost": 0,
    "discount": 0,
    "total": 1250,
    "totalFormatted": "PKR 1,250",
    "currency": "PKR",
    "shippingAddress": {
      "fullName": "Ayesha Khan",
      "phone": "+92 300 1234567",
      "email": "ayesha.khan@email.com",
      "address": "123 Main Street, Gulberg",
      "city": "Lahore",
      "state": "Punjab",
      "postalCode": "54000",
      "country": "Pakistan"
    },
    "notes": "Please deliver before 3 PM",
    "tags": ["urgent", "vip"],
    "paymentMethod": "cash",
    "createdAt": "2025-11-19T14:30:00.000Z",
    "updatedAt": "2025-11-19T15:00:00.000Z",
    "createdBy": "admin@trio.com",
    "guestOrder": false
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Order not found
- `401 Unauthorized` - Authentication required

---

### 3. Create Order

**Endpoint:** `POST /api/v1/orders`

**Authentication:** Optional. This route is wrapped with `optionalCustomerAuth`, so it accepts calls with or without the `Authorization: Bearer <customer-access-token>` header. Regardless of authentication, the request body MUST include the `customer` object. When the backend receives the payload it:
1. Validates the token (when provided) and attaches customer info to the request (used for logging/analytics only).
2. Always looks up an existing customer by the `customer.email` provided in the body.
3. If a match is found, the order is linked to that customer (`customerId` stored and `guestOrder=false`); otherwise, the order is stored as a guest order with `guestToken` populated.

**Description:** Create a new order. Frontend clients **must not** send any price-related fields (`price`, `subtotal`, `tax`, `total`, `discount`, `shippingCost`). The validator rejects them and the backend recalculates everything from authoritative product data.

**🔒 CRITICAL SECURITY NOTE:**
Never trust client-provided prices, totals, or calculations. The backend MUST:
1. Fetch current product prices from the database
2. Calculate all totals server-side
3. Ignore any price/total values sent from frontend
4. Validate quantities against available inventory

**Request Body:**

**Example 1: Single-Category Order (BOOKS only)**
```json
{
  "customer": {
    "name": "Hassan Ali",
    "email": "hassan.ali@email.com",
    "phone": "+92 321 9876543"
  },
  "section": "BOOKS",
  "items": [
    {
      "productId": "9f41980a-0a4e-4c5c-8d28-4222f2d15070",
      "variantId": "d91d1b33-607d-4bf6-8610-7eab9ee96460",
      "quantity": 2
    },
    {
      "productId": "431513b4-7f2b-4d30-8a0b-4c08a0f31767",
      "quantity": 1
    }
  ],
  "paymentStatus": "PENDING",
  "fulfillmentStatus": "UNFULFILLED",
  "discountCode": "SAVE10",
  "shippingAddress": {
    "fullName": "Hassan Ali",
    "phone": "+92 321 9876543",
    "email": "hassan.ali@email.com",
    "address": "45 Park Avenue",
    "city": "Karachi",
    "state": "Sindh",
    "postalCode": "75500"
  },
  "notes": "Gift wrap requested",
  "tags": ["gift", "BOOKS"],
  "paymentMethod": "cod"
}
```

**Example 2: Mixed-Category Order (CAFE + FLOWERS + BOOKS) ✨ NEW!**
```json
{
  "customer": {
    "name": "Sarah Ahmed",
    "email": "sarah.ahmed@email.com",
    "phone": "+92 300 5551234"
  },
  "items": [
    {
      "productId": "cafe-product-uuid-123",
      "quantity": 2
    },
    {
      "productId": "flowers-product-uuid-456",
      "quantity": 1
    },
    {
      "productId": "books-product-uuid-789",
      "quantity": 1
    }
  ],
  "paymentStatus": "PENDING",
  "fulfillmentStatus": "UNFULFILLED",
  "shippingAddress": {
    "fullName": "Sarah Ahmed",
    "phone": "+92 300 5551234",
    "address": "10 Garden Road",
    "city": "Islamabad",
    "state": "ICT",
    "postalCode": "44000"
  },
  "notes": "Mixed order: Coffee + Flowers + Book",
  "paymentMethod": "card"
}
```
> 💡 **Note:** In Example 2, the `section` field is omitted. The system will automatically use the section from the first item (CAFE).

> ⚠️ Discount codes are accepted for future compatibility, but the discount service is not wired up yet. Orders will currently be created without applying the discount amount even if a code is supplied.

**Logged-in Checkout Flow**
1. Frontend obtains a customer access token via `/api/v1/customer-auth/login` (or refresh) and includes it as `Authorization: Bearer <token>`.
2. UI pre-fills the `customer` object with the authenticated user’s profile, but the body is structurally identical to the guest flow. **The email in the payload must match the authenticated user’s email**; otherwise the API rejects the request.
3. Backend validates products/pricing, then attempts to connect the order to an existing customer by `customer.email`. When the token/email pair matches an account, the order is persisted with `customerId`, `guestOrder=false`, and the customer’s order stats are updated. Otherwise the order is stored as a guest order with `guestOrder=true` and a temporary `guestToken`.

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| `customer.name` | Required, min 2 chars | "Customer name is required" |
| `customer.email` | Required, valid email format | "Valid email address is required" |
| `customer.phone` | Optional, valid phone format | "Invalid phone number format" |
| `section` | Optional, enum: CAFE/FLOWERS/BOOKS. If not provided, uses first item's section. **Supports mixed-category orders** (CAFE + FLOWERS + BOOKS in one order) | "Invalid section" |
| `items` | Required, min 1 item | "At least one product is required" |
| `items[].productId` | Required, must exist in DB | "Product not found" |
| `items[].variantId` | Optional, must exist if provided | "Variant not found" |
| `items[].quantity` | Required, min 1, max 1000 | "Invalid quantity" |
| `paymentStatus` | Optional, enum: PENDING/PAID/FAILED/REFUNDED | "Invalid payment status" |
| `fulfillmentStatus` | Optional, enum: UNFULFILLED/FULFILLED/PARTIAL/SCHEDULED | "Invalid fulfillment status" |
| `discountCode` | Optional, must be valid if provided | "Invalid discount code" |

**🔒 BACKEND CALCULATION LOGIC (CRITICAL):**

The backend MUST perform the following calculations server-side to prevent price manipulation:

```javascript
// Backend pseudo-code for order creation
async function createOrder(requestData) {
  // 1. Validate and fetch products from database
  const orderItems = [];
  let calculatedSubtotal = 0;

  for (const item of requestData.items) {
    // Fetch current price from database (NEVER trust client)
    const product = await db.products.findById(item.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check inventory availability
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    // Get variant price if variant specified
    let itemPrice = product.price;
    if (item.variantId) {
      const variant = await db.variants.findById(item.variantId);
      if (!variant || variant.productId !== product.id) {
        throw new Error("Invalid variant");
      }
      itemPrice = variant.price;
    }

    // Calculate line item total
    const lineTotal = itemPrice * item.quantity;
    calculatedSubtotal += lineTotal;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      variantId: item.variantId,
      quantity: item.quantity,
      price: itemPrice,  // From database, NOT from request
      total: lineTotal   // Calculated, NOT from request
    });
  }

  // 2. Calculate discount (if discount code provided)
  let discountAmount = 0;
  if (requestData.discountCode) {
    const discount = await db.discounts.findByCode(requestData.discountCode);

    if (!discount || !discount.isValid()) {
      throw new Error("Invalid or expired discount code");
    }

    // Calculate discount based on type
    if (discount.type === "percentage") {
      discountAmount = (calculatedSubtotal * discount.value) / 100;
    } else if (discount.type === "fixed") {
      discountAmount = discount.value;
    }

    // Apply discount limits
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount;
    }

    // Increment usage count
    await db.discounts.incrementUsage(discount.id);
  }

  // 3. Calculate tax (server-side configuration, e.g., 18% GST)
  const taxRate = await db.settings.getTaxRate();  // e.g., 0.18
  const taxableAmount = calculatedSubtotal - discountAmount;
  const calculatedTax = taxableAmount * taxRate;

  // 4. Validate shipping cost (currently handled server-side)
  const validatedShippingCost = 0; // Future enhancement

  // 5. Calculate final total
  const calculatedTotal = calculatedSubtotal - discountAmount + calculatedTax + validatedShippingCost;

  // 6. Create order with calculated values
  const order = await db.orders.create({
    ...requestData,
    items: orderItems,
    subtotal: calculatedSubtotal,           // CALCULATED
    discount: discountAmount,               // CALCULATED
    tax: calculatedTax,                     // CALCULATED
    shippingCost: validatedShippingCost,    // VALIDATED
    total: calculatedTotal,                 // CALCULATED
    // Ignore any price/total values from request
  });

  // 7. Update inventory (reserve stock)
  for (const item of orderItems) {
    await db.inventory.reserveStock(item.productId, item.quantity);
  }

  return order;
}
```

**Why This Is Critical:**

Without server-side calculation, a malicious user could:
- ❌ Set price to $0.01 for expensive items
- ❌ Set total to $1 for a $1000 order
- ❌ Apply fake discounts
- ❌ Avoid tax calculation
- ❌ Manipulate shipping costs

**Example Attack Without Protection:**
```json
// Attacker sends this request:
{
  "items": [
    {
      "productId": "expensive-laptop",
      "quantity": 1,
      "price": 0.01  // ❌ Real price is $1000
    }
  ],
  "subtotal": 0.01,
  "tax": 0,
  "total": 0.01
}
// If backend trusts this, attacker gets laptop for 1 cent!
```

**Correct Implementation:**
```json
// Frontend sends only:
{
  "items": [
    {
      "productId": "expensive-laptop",
      "quantity": 1
      // ✅ No price sent
    }
  ]
  // ✅ No subtotal, tax, or total sent
}

// Backend calculates and returns:
{
  "items": [
    {
      "productId": "expensive-laptop",
      "quantity": 1,
      "price": 1000,  // ✅ From database
      "total": 1000   // ✅ Calculated
    }
  ],
  "subtotal": 1000,   // ✅ Calculated
  "tax": 180,         // ✅ Calculated (18%)
  "total": 1180       // ✅ Calculated
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "12",
    "orderNumber": "#1045",
    "customer": {
      "name": "Hassan Ali",
      "email": "hassan.ali@email.com",
      "phone": "+92 321 9876543"
    },
    "date": "2025-11-19T16:00:00.000Z",
    "section": "BOOKS",
    "paymentStatus": "PENDING",
    "fulfillmentStatus": "UNFULFILLED",
    "itemsCount": 3,
    "subtotal": 3800,
    "tax": 684,
    "discount": 0,
    "shippingCost": 0,
    "total": 4484,
    "totalFormatted": "PKR 4,484",
    "currency": "PKR",
    "createdAt": "2025-11-19T16:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Order created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `409 Conflict` - Duplicate order number
- `500 Internal Server Error` - Server error

---

### 4. Update Order

**Endpoint:** `PUT /api/v1/orders/:id` or `PATCH /api/v1/orders/:id`

**Description:** Update an existing order. Use `PUT` for full update, `PATCH` for partial update.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Request Body (Partial Update Example):**

```json
{
  "paymentStatus": "PAID",
  "fulfillmentStatus": "FULFILLED",
  "notes": "Order delivered successfully"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order updated successfully",
  "data": {
    "id": "1",
    "orderNumber": "#1034",
    "paymentStatus": "PAID",
    "fulfillmentStatus": "FULFILLED",
    "notes": "Order delivered successfully",
    "updatedAt": "2025-11-19T17:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Update successful
- `400 Bad Request` - Validation error
- `404 Not Found` - Order not found
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions

---

### 5. Update Payment Status

**Endpoint:** `PATCH /api/v1/orders/:id/payment-status`

**Description:** Update only the payment status of an order.

**Request Body:**

```json
{
  "paymentStatus": "PAID"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "id": "1",
    "orderNumber": "#1034",
    "paymentStatus": "PAID",
    "updatedAt": "2025-11-19T17:30:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid status
- `404 Not Found` - Order not found

---

### 6. Update Fulfillment Status

**Endpoint:** `PATCH /api/v1/orders/:id/fulfillment-status`

**Description:** Update only the fulfillment status of an order.

**Request Body:**

```json
{
  "fulfillmentStatus": "FULFILLED"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Fulfillment status updated successfully",
  "data": {
    "id": "1",
    "orderNumber": "#1034",
    "fulfillmentStatus": "FULFILLED",
    "updatedAt": "2025-11-19T17:35:00.000Z"
  }
}
```

---

### 7. Delete Order

**Endpoint:** `DELETE /api/v1/orders/:id`

**Description:** Soft delete an order (or hard delete if specified).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hard` | boolean | No | If true, permanently delete (default: false) |

**Response:**

```json
{
  "success": true,
  "message": "Order deleted successfully",
  "data": {
    "id": "1",
    "deletedAt": "2025-11-19T18:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Deletion successful
- `404 Not Found` - Order not found
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Cannot delete PAID or FULFILLED orders

---

### 8. Export Orders to CSV

**Endpoint:** `GET /api/v1/orders/export`

**Description:** Export orders to CSV format based on filters.

**Query Parameters:** (Same as Get All Orders)

**Response:**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="orders-export-2025-11-19.csv"

Order Number,Customer Name,Customer Email,Date,Section,Payment Status,Fulfillment Status,Items,Total
#1034,"Ayesha Khan",ayesha.khan@email.com,2025-11-19,CAFE,PAID,FULFILLED,3,1250
#1033,"Ahmed Ali",ahmed.ali@email.com,2025-11-19,FLOWERS,PAID,UNFULFILLED,1,3500
```

**Status Codes:**
- `200 OK` - Export successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required

---

### 9. Get Order Statistics

**Endpoint:** `GET /api/v1/orders/stats`

**Description:** Get aggregated order statistics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | No | Start date for stats (ISO 8601) |
| `dateTo` | string | No | End date for stats (ISO 8601) |
| `section` | string | No | Filter by section (`CAFE`, `FLOWERS`, `BOOKS`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 100,
      "totalRevenue": 250000,
      "averageOrderValue": 2500
    },
    "paymentStatus": {
      "PAID": 85,
      "PENDING": 10,
      "REFUNDED": 3,
      "FAILED": 2
    },
    "fulfillmentStatus": {
      "FULFILLED": 75,
      "UNFULFILLED": 20,
      "PARTIAL": 4,
      "SCHEDULED": 1
    },
    "bySection": {
      "CAFE": {
        "orders": 45,
        "revenue": 67500
      },
      "FLOWERS": {
        "orders": 30,
        "revenue": 105000
      },
      "BOOKS": {
        "orders": 25,
        "revenue": 77500
      }
    }
  }
}
```

---

### 10. Duplicate Order

**Endpoint:** `POST /api/v1/orders/:id/duplicate`

**Description:** Create a duplicate of an existing order.

**Response:**

```json
{
  "success": true,
  "message": "Order duplicated successfully",
  "data": {
    "id": "13",
    "orderNumber": "#1046",
    "originalOrderId": "1"
  }
}
```

---

## Business Rules

### 1. Order Number Generation

- Format: `#` + 4-digit incrementing number (e.g., `#1001`, `#1002`)
- Must be unique across all orders
- Auto-generated on order creation
- Cannot be manually set

### 2. Payment Status Transitions

**Valid State Transitions:**

```
PENDING → PAID
PENDING → FAILED
FAILED → PENDING (retry)
PAID → REFUNDED
```

**Invalid Transitions:**
- `REFUNDED` → any other status
- `PAID` → `FAILED`

### 3. Fulfillment Status Transitions

**Valid State Transitions:**

```
UNFULFILLED → PARTIAL → FULFILLED
UNFULFILLED → SCHEDULED → FULFILLED
UNFULFILLED → FULFILLED (direct)
PARTIAL → UNFULFILLED (rollback)
SCHEDULED → UNFULFILLED (cancel schedule)
SCHEDULED → PARTIAL/FULFILLED
FULFILLED → UNFULFILLED (returns/adjusments)
```

**Invalid Transitions:**
- Any transition not listed above (e.g., `PARTIAL` → `SCHEDULED`)

### 4. Order Deletion Rules

- Cannot delete orders with `paymentStatus: "PAID"` (must refund first)
- Cannot delete orders with `fulfillmentStatus: "FULFILLED"`
- `PARTIAL`/`UNFULFILLED` orders can be deleted when payment is not `PAID`
- Soft delete by default (add `deletedAt` timestamp)
- Hard delete only for admin users

### 5. Order Calculations

```javascript
// Line item total (calculated per product)
itemTotal = priceFromDatabase * quantity

// Subtotal calculation
subtotal = sum(itemTotal)

// Discount (if/when discount service is wired up)
discount = appliedDiscountAmount || 0

// Tax calculation (18% GST on taxable amount)
tax = (subtotal - discount) * 0.18

// Shipping (currently 0 until shipping service integration)
shippingCost = 0

// Final total
total = subtotal - discount + tax + shippingCost
```

### 6. Inventory Impact

- When an order is created the stock quantity of each product is immediately decremented to prevent overselling.
- Inventory adjustments on cancellation/refunds must currently be handled manually (automatic restock logic is still pending).

### 7. Customer Association

- Orders can be placed by guests. If no customer exists for the provided email, the order is marked as `guestOrder` and a `guestToken` is issued.
- When a customer account is later created with the same email, guest orders can be linked to that account.
- Registered customers update their order statistics (totalOrders, totalSpent, etc.) automatically on each purchase.

### 8. Mixed-Category Orders

✅ **NOW SUPPORTED:** Customers can purchase items from multiple categories in a single order!

- Orders can contain items from CAFE, FLOWERS, and BOOKS sections simultaneously
- The `section` field is **optional** when creating an order
- If `section` is not provided, the system automatically uses the first item's section
- **Example:** A customer can buy a coffee (CAFE) + flowers (FLOWERS) + a book (BOOKS) in ONE checkout
- **Benefits:**
  - Better UX - Single checkout for all items
  - Higher sales - Easier cross-category purchases
  - Simpler logistics - One order, one delivery
  - Better analytics - See complete customer purchase behavior

---

## Frontend Requirements

### 1. Orders List Page (`/orders`)

**Required Features:**
- Display orders in table format
- Sortable columns (order number, date, customer, total)
- Search by order number, customer name, or email
- Filter by:
  - Payment status (dropdown)
  - Fulfillment status (dropdown)
  - Section (dropdown)
  - Date range (date picker)
- Statistics cards showing:
  - Total orders count
  - Paid orders count
  - Fulfilled orders count
  - Pending orders count
- Pagination controls
- Export to CSV button
- Create order button
- Bulk actions (select multiple orders)

**Table Columns:**
1. Checkbox (for bulk actions)
2. Order Number (clickable link to detail page)
3. Customer Name
4. Date (formatted: "2 min ago", "15 min ago", "1 hour ago")
5. Section (badge with color: CAFE=brown, FLOWERS=pink, BOOKS=blue)
6. Payment Status (dropdown, inline editable)
7. Fulfillment Status (dropdown, inline editable)
8. Items Count
9. Total (formatted with currency)
10. Actions (dropdown menu: View, Duplicate, Delete)

**Status Colors:**

Payment Status:
- `PAID` → Green badge
- `PENDING` → Yellow badge
- `REFUNDED` → Gray badge
- `FAILED` → Red badge

Fulfillment Status:
- `FULFILLED` → Blue badge
- `UNFULFILLED` → Gray badge
- `PARTIAL` → Orange badge
- `SCHEDULED` → Purple badge

### 2. Order Detail Page (`/orders/:id`)

**Required Sections:**

**Top Action Bar:**
- Back button
- Order number with status badge
- Actions: Duplicate, Preview, Share dropdown, More menu

**Left Column (2/3 width):**
- **Customer Information Card:**
  - Customer name
  - Email
  - Phone
- **Products Card:**
  - List of items with image, name, variant, quantity, price
  - Subtotal display
- **Payment Card:**
  - Subtotal
  - Tax (18%)
  - Shipping cost
  - Total (bold)
- **Shipping Address Card:**
  - Full name
  - Phone
  - Email (optional)
  - Address, City, State, Postal code, Country

**Right Column (1/3 width):**
- **Order Details Card:**
  - Section (dropdown, disabled)
  - Order date (read-only)
- **Payment Status Card:**
  - Dropdown to update payment status
- **Fulfillment Status Card:**
  - Dropdown to update fulfillment status
- **Notes Card:**
  - Textarea for order notes
- **Tags Card:**
  - Input field for tags (comma-separated)

**Real-time Updates:**
- Auto-save notes after 2 seconds of inactivity
- Show "Saving..." indicator when updating
- Show success/error toast messages
- Update status immediately on dropdown change

### 3. Create Order Page (`/orders/new`)

**Required Sections:**

**Top Bar:**
- Back button
- "Create order" title
- Discard button (with confirmation)
- Save button (validates and creates order)

**Left Column:**
- **Customer Section:**
  - Search/create customer (autocomplete input)
  - Customer name (required, marked with *)
  - Email (required, validated)
  - Phone (optional)
- **Products Section:**
  - Dynamic list of order items
  - Each item has:
    - Product search input (autocomplete)
    - Quantity input (number, min: 1)
    - Price display (read-only, fetched from server product data)
    - Remove button (X)
  - Add product button
  - Validation: at least 1 product required
- **Payment Section:**
  - Display-only summary card that mirrors backend-calculated subtotal, tax (18%), discount, shipping (currently 0), and total
  - Provide inline hint that these numbers refresh after backend responds (do not send editable values)
- **Shipping Address Section:**
  - Full name
  - Phone
  - Email (optional)
  - Address, City, State, Postal code, Country

**Right Column:**
- **Order Details:**
  - Section dropdown (optional - auto-detected from items if not provided, supports mixed-category orders)
  - Order date (default: today)
- **Payment Status:**
  - Dropdown (default: `PENDING`)
- **Fulfillment Status:**
  - Dropdown (default: `UNFULFILLED`)
- **Notes:**
  - Textarea
- **Tags:**
  - Input (comma-separated)

**Validation:**
- Customer name and email are required
- At least one product required
- All products must be selected (not empty)
- Email format validation
- Price/tax/total fields must remain read-only on the client—the API ignores client-provided amounts
- Show error messages inline (red text below field)
- Disable save button while saving
- Confirm before discarding if form has data

### 4. State Management Requirements

**Local State (per page):**
- `orders` - List of orders
- `selectedOrders` - Array of selected order IDs
- `filters` - Object with all filter values
- `searchQuery` - Search input value
- `isLoading` - Loading state
- `error` - Error message

**API Calls:**
- Use React Query or SWR for caching
- Implement optimistic updates for status changes
- Show loading skeletons during fetch
- Retry failed requests (max 3 times)
- Cache order list for 5 minutes
- Invalidate cache on create/update/delete

### 5. Error Handling

**Display Errors:**
- Toast notifications for success/error messages
- Inline validation errors (red text, red border)
- Network error fallback UI
- 404 page for order not found
- Permission denied message

**Error Messages:**
- "Failed to load orders. Please try again."
- "Failed to create order. Please check all fields."
- "This order has already been fulfilled and cannot be modified."
- "Payment status cannot be changed from refunded."
- "You don't have permission to delete this order."

---

---

## Security Best Practices

### 1. Price Manipulation Prevention

**CRITICAL:** Always calculate prices server-side. Never trust client input for:
- Product prices
- Line item totals
- Subtotals
- Tax amounts
- Discount amounts
- Shipping costs
- Final total

**Implementation Checklist:**
- ✅ Fetch product prices from database
- ✅ Calculate all totals server-side
- ✅ Validate discount codes server-side
- ✅ Apply tax rates from server configuration
- ✅ Validate shipping costs server-side (currently locked to 0 until rates are configured)
- ✅ Ignore any price/total fields sent from frontend
- ✅ Log all order creation attempts with IP address
- ✅ Monitor for suspicious pricing patterns

### 2. Inventory Validation

**Prevent overselling and stock manipulation:**

```javascript
// Before creating order
for (const item of orderItems) {
  const availableStock = await db.inventory.getAvailable(item.productId);

  if (item.quantity > availableStock) {
    throw new Error(`Only ${availableStock} units available for ${item.productName}`);
  }

  // Prevent unreasonably large orders (potential attack)
  if (item.quantity > 1000) {
    throw new Error("Quantity exceeds maximum allowed per order");
  }
}
```

### 3. Rate Limiting for Order Creation

**Prevent abuse and automated attacks:**

```javascript
// Limit order creation per user
const recentOrders = await db.orders.countByUser(userId, last1Hour);

if (recentOrders > 10) {
  throw new Error("Too many orders. Please try again later.");
}
```

### 4. Discount Code Abuse Prevention

**Validate discount usage:**

```javascript
// Check discount code before applying
const discount = await db.discounts.findByCode(code);

// Validate expiry
if (discount.expiresAt < new Date()) {
  throw new Error("Discount code has expired");
}

// Validate usage limits
if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
  throw new Error("Discount code has reached usage limit");
}

// Validate per-user limits
if (discount.perUserLimit) {
  const userUsage = await db.discountUsage.countByUser(discount.id, userId);
  if (userUsage >= discount.perUserLimit) {
    throw new Error("You have already used this discount code");
  }
}

// Validate minimum order amount
if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
  throw new Error(`Minimum order amount of ${discount.minOrderAmount} required`);
}
```

### 5. Idempotency for Order Creation

**Prevent duplicate orders from double-clicks or retries:**

```javascript
// Use idempotency key
POST /api/v1/orders
Headers:
  Idempotency-Key: unique-uuid-from-frontend

// Backend checks:
const existingOrder = await db.orders.findByIdempotencyKey(idempotencyKey);

if (existingOrder) {
  // Return existing order instead of creating duplicate
  return existingOrder;
}

// Create new order and store idempotency key
await db.orders.create({ ...orderData, idempotencyKey });
```

### 6. Input Validation & Sanitization

**Prevent SQL injection and XSS attacks:**

```javascript
// Validate all string inputs
function validateOrderInput(data) {
  // Remove HTML tags from notes
  data.notes = sanitizeHtml(data.notes);

  // Validate email format
  if (!isValidEmail(data.customer.email)) {
    throw new Error("Invalid email format");
  }

  // Validate phone number format
  if (data.customer.phone && !isValidPhone(data.customer.phone)) {
    throw new Error("Invalid phone number format");
  }

  // Prevent SQL injection in tags
  data.tags = data.tags.map(tag => escapeSQL(tag));

  return data;
}
```

### 7. Audit Logging

**Track all order operations for security and debugging:**

```javascript
// Log every order creation
await db.auditLog.create({
  action: "ORDER_CREATED",
  userId: req.user.id,
  orderId: order.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  requestBody: req.body,
  calculatedTotal: order.total,
  timestamp: new Date()
});

// Alert on suspicious activity
if (order.total === 0 || order.total < 10) {
  await alerting.notifySecurityTeam({
    type: "SUSPICIOUS_ORDER",
    orderId: order.id,
    userId: req.user.id,
    total: order.total
  });
}
```

### 8. Payment Status Security

**Prevent unauthorized payment status changes:**

```javascript
// Only allow certain status transitions
const allowedTransitions = {
  PENDING: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: ["PENDING"],
  REFUNDED: [] // Cannot change from refunded
};

function validatePaymentStatusChange(currentStatus, newStatus) {
  const allowed = allowedTransitions[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot change payment status from ${currentStatus} to ${newStatus}`);
  }

  // Additional validation: Only admins can mark as "PAID" manually
  if (newStatus === "PAID" && req.user.role !== "admin") {
    throw new Error("Only admins can manually mark orders as PAID");
  }
}
```

### 9. Database Transaction Safety

**Ensure atomic operations:**

```javascript
// Use database transactions for order creation
async function createOrder(data) {
  const transaction = await db.beginTransaction();

  try {
    // 1. Create order
    const order = await db.orders.create(data, { transaction });

    // 2. Create order items
    await db.orderItems.bulkCreate(orderItems, { transaction });

    // 3. Reserve inventory
    for (const item of orderItems) {
      await db.inventory.reserve(item.productId, item.quantity, { transaction });
    }

    // 4. Record discount usage
    if (discountCode) {
      await db.discountUsage.create({ orderId: order.id, discountId }, { transaction });
    }

    // Commit transaction
    await transaction.commit();
    return order;

  } catch (error) {
    // Rollback on any error
    await transaction.rollback();
    throw error;
  }
}
```

### 10. Additional Security Headers

**Add security headers to API responses:**

```javascript
// Express middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "customer.email",
        "message": "Invalid email address"
      },
      {
        "field": "items",
        "message": "At least one product is required"
      }
    ]
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `ORDER_NOT_FOUND` | Order ID doesn't exist | 404 |
| `DUPLICATE_ORDER_NUMBER` | Order number already exists | 409 |
| `INVALID_STATUS_TRANSITION` | Cannot change status (business rule) | 400 |
| `INSUFFICIENT_INVENTORY` | Not enough stock for order | 400 |
| `CUSTOMER_NOT_FOUND` | Customer ID doesn't exist | 404 |
| `PRODUCT_NOT_FOUND` | Product ID doesn't exist | 404 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 |

---

## Examples

### Example 1: Create a Cafe Order

**Request:**
```bash
POST /api/v1/orders
Content-Type: application/json

{
  "customer": {
    "name": "Fatima Ahmed",
    "email": "fatima@email.com",
    "phone": "+92 300 1112222"
  },
  "section": "CAFE",
  "items": [
    {
      "productId": "prod-cafe-001",
      "quantity": 2
    },
    {
      "productId": "prod-cafe-015",
      "quantity": 1
    }
  ],
  "paymentStatus": "PAID",
  "fulfillmentStatus": "UNFULFILLED",
  "notes": "Extra sugar in coffee"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "ord-12345",
    "orderNumber": "#1047",
    "customer": {
      "name": "Fatima Ahmed",
      "email": "fatima@email.com",
      "phone": "+92 300 1112222"
    },
    "section": "CAFE",
    "paymentStatus": "PAID",
    "fulfillmentStatus": "UNFULFILLED",
    "items": [
      {
        "productId": "prod-cafe-001",
        "quantity": 2,
        "price": 350,
        "total": 700
      },
      {
        "productId": "prod-cafe-015",
        "quantity": 1,
        "price": 450,
        "total": 450
      }
    ],
    "itemsCount": 3,
    "subtotal": 1100,
    "tax": 198,
    "discount": 0,
    "shippingCost": 0,
    "total": 1298,
    "totalFormatted": "PKR 1,298",
    "currency": "PKR",
    "createdAt": "2025-11-19T18:30:00.000Z"
  }
}
```

### Example 2: Filter Orders by Section and Status

**Request:**
```bash
GET /api/v1/orders?section=FLOWERS&paymentStatus=PAID&fulfillmentStatus=UNFULFILLED&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "2",
        "orderNumber": "#1033",
        "customer": {
          "name": "Ahmed Ali",
          "email": "ahmed.ali@email.com"
        },
        "section": "FLOWERS",
        "paymentStatus": "PAID",
        "fulfillmentStatus": "UNFULFILLED",
        "itemsCount": 1,
        "total": 3500,
        "totalFormatted": "PKR 3,500",
        "date": "2025-11-19T14:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalOrders": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

### Example 3: Update Fulfillment Status

**Request:**
```bash
PATCH /api/v1/orders/2/fulfillment-status
Content-Type: application/json

{
  "fulfillmentStatus": "fulfilled"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fulfillment status updated successfully",
  "data": {
    "id": "2",
    "orderNumber": "#1033",
    "fulfillmentStatus": "FULFILLED",
    "updatedAt": "2025-11-19T19:00:00.000Z"
  }
}
```

### Example 4: Search Orders

**Request:**
```bash
GET /api/v1/orders?search=Ahmed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "2",
        "orderNumber": "#1033",
        "customer": {
          "name": "Ahmed Ali",
          "email": "ahmed.ali@email.com"
        },
        "section": "FLOWERS",
        "total": 3500,
        "totalFormatted": "PKR 3,500"
      },
      {
        "id": "5",
        "orderNumber": "#1030",
        "customer": {
          "name": "Zainab Ahmed",
          "email": "zainab.a@email.com"
        },
        "section": "FLOWERS",
        "total": 2650,
        "totalFormatted": "PKR 2,650"
      }
    ]
  }
}
```

---

## Additional Notes

### Performance Considerations

1. **Pagination:** Always implement pagination for order lists (default 20 items per page)
2. **Indexing:** Create database indexes on:
   - `orderNumber`
   - `customer.email`
   - `date`
   - `section`
   - `paymentStatus`
   - `fulfillmentStatus`
3. **Caching:** Cache order statistics for 5 minutes
4. **Lazy Loading:** Load order items only when order detail is opened

### Security Requirements

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:**
   - Regular users can only view their own orders
   - Admins can view/modify all orders
3. **Rate Limiting:**
   - 100 requests per minute per user
   - 10 order creations per hour per user
4. **Data Validation:** Sanitize all inputs to prevent SQL injection and XSS

### Webhooks (Future Enhancement)

Consider implementing webhooks for:
- Order created
- Order status changed
- Payment status changed
- Fulfillment status changed

**Webhook Payload Example:**
```json
{
  "event": "order.created",
  "timestamp": "2025-11-19T18:30:00.000Z",
  "data": {
    "orderId": "ord-12345",
    "orderNumber": "#1047"
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-19 | Initial API documentation |

---

## Contact & Support

For questions or clarifications about this API:
- **Frontend Team Lead:** [Your Name]
- **Backend Team Lead:** [Backend Lead Name]
- **Slack Channel:** #trio-api-support
- **Documentation:** [Link to full docs]

---

**End of Order Management API Documentation**
