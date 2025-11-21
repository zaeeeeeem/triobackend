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

---

## Data Models

### 1. Order Model

**TypeScript Interface:**
```typescript
interface Order {
  id: string;                    // Unique order identifier
  orderNumber: string;            // Human-readable order number (e.g., "#1034")
  customer: {
    name: string;                 // Customer full name
    email: string;                // Customer email address
    phone?: string;               // Optional phone number
  };
  date: Date;                     // Order creation date/time
  section: "cafe" | "flowers" | "books";  // Business section
  paymentStatus: "paid" | "pending" | "refunded" | "failed";
  fulfillmentStatus: "fulfilled" | "unfulfilled" | "partial" | "scheduled";
  items: OrderItem[];             // Array of order items
  itemsCount: number;             // Total number of items
  subtotal: number;               // Subtotal amount (before tax/shipping)
  tax: number;                    // Tax amount
  shippingCost: number;           // Shipping cost
  total: string;                  // Total amount (formatted, e.g., "Rs 1,250")
  totalNumeric: number;           // Total amount (numeric for calculations)
  shippingAddress?: ShippingAddress;
  notes?: string;                 // Order notes
  tags?: string[];                // Order tags
  createdAt: Date;                // Record creation timestamp
  updatedAt?: Date;               // Last update timestamp
  createdBy?: string;             // User who created the order
}
```

### 2. OrderItem Model

```typescript
interface OrderItem {
  id: string;                     // Unique item identifier
  productId: string;              // Reference to product
  productName: string;            // Product name
  sku?: string;                   // Product SKU
  variant?: string;               // Product variant (e.g., size, color)
  quantity: number;               // Item quantity
  price: number;                  // Unit price
  total: number;                  // Line total (quantity × price)
  image?: string;                 // Product image URL
  section: "cafe" | "flowers" | "books";
}
```

### 3. ShippingAddress Model

```typescript
interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;                // Street address
  city: string;
  state: string;                  // State/Province
  postalCode: string;             // ZIP/Postal code
  country?: string;               // Country (default: Pakistan)
}
```

### 4. Payment Status Enum

```typescript
enum PaymentStatus {
  PAID = "paid",           // Payment completed
  PENDING = "pending",     // Payment awaiting
  REFUNDED = "refunded",   // Payment refunded
  FAILED = "failed"        // Payment failed
}
```

### 5. Fulfillment Status Enum

```typescript
enum FulfillmentStatus {
  FULFILLED = "fulfilled",       // All items shipped/delivered
  UNFULFILLED = "unfulfilled",   // No items shipped
  PARTIAL = "partial",           // Some items shipped
  SCHEDULED = "scheduled"        // Scheduled for future fulfillment
}
```

---

## API Endpoints

### 1. Get All Orders

**Endpoint:** `GET /api/orders`

**Description:** Retrieve a list of all orders with optional filtering, pagination, and sorting.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 20, max: 100) | `20` |
| `search` | string | No | Search by order number, customer name, or email | `"Sarah Khan"` |
| `section` | string | No | Filter by section: `cafe`, `flowers`, `books` | `"cafe"` |
| `paymentStatus` | string | No | Filter by payment status | `"paid"` |
| `fulfillmentStatus` | string | No | Filter by fulfillment status | `"unfulfilled"` |
| `sortBy` | string | No | Sort field (default: `date`) | `"total"` |
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
        "section": "cafe",
        "paymentStatus": "paid",
        "fulfillmentStatus": "fulfilled",
        "itemsCount": 3,
        "total": "Rs 1,250",
        "totalNumeric": 1250,
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
    },
    "stats": {
      "totalOrders": 100,
      "paidOrders": 85,
      "pendingOrders": 10,
      "fulfilledOrders": 75,
      "unfulfilledOrders": 20
    }
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

---

### 2. Get Order by ID

**Endpoint:** `GET /api/orders/:id`

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
    "section": "cafe",
    "paymentStatus": "paid",
    "fulfillmentStatus": "fulfilled",
    "items": [
      {
        "id": "item-1",
        "productId": "prod-101",
        "productName": "Cappuccino",
        "sku": "CAF-CAP-001",
        "variant": "Large",
        "quantity": 2,
        "price": 350,
        "total": 700,
        "image": "/images/cappuccino.jpg",
        "section": "cafe"
      },
      {
        "id": "item-2",
        "productId": "prod-102",
        "productName": "Chocolate Croissant",
        "sku": "CAF-CRO-002",
        "quantity": 1,
        "price": 550,
        "total": 550,
        "image": "/images/croissant.jpg",
        "section": "cafe"
      }
    ],
    "itemsCount": 3,
    "subtotal": 1250,
    "tax": 0,
    "shippingCost": 0,
    "total": "Rs 1,250",
    "totalNumeric": 1250,
    "shippingAddress": {
      "firstName": "Ayesha",
      "lastName": "Khan",
      "address": "123 Main Street, Gulberg",
      "city": "Lahore",
      "state": "Punjab",
      "postalCode": "54000",
      "country": "Pakistan"
    },
    "notes": "Please deliver before 3 PM",
    "tags": ["urgent", "vip"],
    "createdAt": "2025-11-19T14:30:00.000Z",
    "updatedAt": "2025-11-19T15:00:00.000Z",
    "createdBy": "admin@trio.com"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Order not found
- `401 Unauthorized` - Authentication required

---

### 3. Create Order

**Endpoint:** `POST /api/orders`

**Description:** Create a new order.

**🔒 CRITICAL SECURITY NOTE:**
Never trust client-provided prices, totals, or calculations. The backend MUST:
1. Fetch current product prices from the database
2. Calculate all totals server-side
3. Ignore any price/total values sent from frontend
4. Validate quantities against available inventory

**Request Body:**

```json
{
  "customer": {
    "name": "Hassan Ali",
    "email": "hassan.ali@email.com",
    "phone": "+92 321 9876543"
  },
  "section": "books",
  "items": [
    {
      "productId": "prod-301",
      "variantId": "variant-501",  // Optional, if product has variants
      "quantity": 2
      // ❌ DO NOT SEND: price, total (backend calculates these)
    },
    {
      "productId": "prod-302",
      "quantity": 1
      // ❌ DO NOT SEND: price, total (backend calculates these)
    }
  ],
  "paymentStatus": "pending",
  "fulfillmentStatus": "unfulfilled",
  "shippingCost": 200,  // Can be sent if calculated by shipping API, but should be validated
  "discountCode": "SAVE10",  // Optional discount code to apply
  "shippingAddress": {
    "firstName": "Hassan",
    "lastName": "Ali",
    "address": "45 Park Avenue",
    "city": "Karachi",
    "state": "Sindh",
    "postalCode": "75500"
  },
  "notes": "Gift wrap requested",
  "tags": ["gift", "books"]
}
```

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| `customer.name` | Required, min 2 chars | "Customer name is required" |
| `customer.email` | Required, valid email format | "Valid email address is required" |
| `customer.phone` | Optional, valid phone format | "Invalid phone number format" |
| `section` | Required, enum: cafe/flowers/books | "Invalid section" |
| `items` | Required, min 1 item | "At least one product is required" |
| `items[].productId` | Required, must exist in DB | "Product not found" |
| `items[].variantId` | Optional, must exist if provided | "Variant not found" |
| `items[].quantity` | Required, min 1, max 1000 | "Invalid quantity" |
| `paymentStatus` | Required, valid enum | "Invalid payment status" |
| `fulfillmentStatus` | Required, valid enum | "Invalid fulfillment status" |
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

  // 4. Validate shipping cost
  let validatedShippingCost = 0;
  if (requestData.shippingCost) {
    // Option A: If you have a shipping API, validate with it
    // validatedShippingCost = await shippingAPI.calculateCost(address);

    // Option B: If shipping costs are fixed, validate against your rates
    const shippingRates = await db.settings.getShippingRates();
    const expectedShipping = shippingRates[requestData.section];

    if (Math.abs(requestData.shippingCost - expectedShipping) > 1) {
      // Allow small rounding differences but reject large discrepancies
      throw new Error("Invalid shipping cost");
    }
    validatedShippingCost = expectedShipping;
  }

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
    "section": "books",
    "paymentStatus": "pending",
    "fulfillmentStatus": "unfulfilled",
    "itemsCount": 3,
    "total": "Rs 4,035",
    "totalNumeric": 4035,
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

**Endpoint:** `PUT /api/orders/:id` or `PATCH /api/orders/:id`

**Description:** Update an existing order. Use `PUT` for full update, `PATCH` for partial update.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Order ID |

**Request Body (Partial Update Example):**

```json
{
  "paymentStatus": "paid",
  "fulfillmentStatus": "fulfilled",
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
    "paymentStatus": "paid",
    "fulfillmentStatus": "fulfilled",
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

**Endpoint:** `PATCH /api/orders/:id/payment-status`

**Description:** Update only the payment status of an order.

**Request Body:**

```json
{
  "paymentStatus": "paid"
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
    "paymentStatus": "paid",
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

**Endpoint:** `PATCH /api/orders/:id/fulfillment-status`

**Description:** Update only the fulfillment status of an order.

**Request Body:**

```json
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
    "id": "1",
    "orderNumber": "#1034",
    "fulfillmentStatus": "fulfilled",
    "updatedAt": "2025-11-19T17:35:00.000Z"
  }
}
```

---

### 7. Delete Order

**Endpoint:** `DELETE /api/orders/:id`

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
- `403 Forbidden` - Cannot delete fulfilled orders

---

### 8. Export Orders to CSV

**Endpoint:** `GET /api/orders/export`

**Description:** Export orders to CSV format based on filters.

**Query Parameters:** (Same as Get All Orders)

**Response:**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="orders-export-2025-11-19.csv"

Order Number,Customer Name,Customer Email,Date,Section,Payment Status,Fulfillment Status,Items,Total
#1034,"Ayesha Khan",ayesha.khan@email.com,2025-11-19,cafe,paid,fulfilled,3,1250
#1033,"Ahmed Ali",ahmed.ali@email.com,2025-11-19,flowers,paid,unfulfilled,1,3500
```

**Status Codes:**
- `200 OK` - Export successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required

---

### 9. Get Order Statistics

**Endpoint:** `GET /api/orders/stats`

**Description:** Get aggregated order statistics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | No | Start date for stats (ISO 8601) |
| `dateTo` | string | No | End date for stats (ISO 8601) |
| `section` | string | No | Filter by section |

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
      "paid": 85,
      "pending": 10,
      "refunded": 3,
      "failed": 2
    },
    "fulfillmentStatus": {
      "fulfilled": 75,
      "unfulfilled": 20,
      "partial": 4,
      "scheduled": 1
    },
    "bySection": {
      "cafe": {
        "orders": 45,
        "revenue": 67500
      },
      "flowers": {
        "orders": 30,
        "revenue": 105000
      },
      "books": {
        "orders": 25,
        "revenue": 77500
      }
    }
  }
}
```

---

### 10. Duplicate Order

**Endpoint:** `POST /api/orders/:id/duplicate`

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
pending → paid
pending → failed
paid → refunded
failed → pending (retry)
```

**Invalid Transitions:**
- `refunded` → any other status
- `paid` → `failed`

### 3. Fulfillment Status Transitions

**Valid State Transitions:**

```
unfulfilled → partial → fulfilled
unfulfilled → scheduled → fulfilled
unfulfilled → fulfilled (direct)
scheduled → unfulfilled (cancel schedule)
```

**Invalid Transitions:**
- `fulfilled` → `unfulfilled` (cannot unful fill)
- `fulfilled` → `partial`

### 4. Order Deletion Rules

- Cannot delete orders with `paymentStatus: "paid"` (must refund first)
- Cannot delete orders with `fulfillmentStatus: "fulfilled"` or `"partial"`
- Only orders with status `pending` + `unfulfilled` can be deleted
- Soft delete by default (add `deletedAt` timestamp)
- Hard delete only for admin users

### 5. Order Calculations

```javascript
// Tax calculation (18% in Pakistan)
tax = subtotal * 0.18

// Total calculation
total = subtotal + tax + shippingCost

// Line item total
itemTotal = quantity * price

// Subtotal calculation
subtotal = sum of all itemTotal
```

### 6. Inventory Impact

- When order is created with `fulfillmentStatus: "unfulfilled"`:
  - Reserve inventory (mark as "committed")
- When `fulfillmentStatus` changes to `"fulfilled"`:
  - Deduct from inventory
  - Unreserve committed stock
- When order is cancelled:
  - Unreserve inventory

### 7. Customer Association

- Customer must exist in database before order creation
- If customer doesn't exist, create customer first
- Customer email must be unique
- Link order to customer via `customerId`

### 8. Multi-Section Validation

- All items in an order must belong to the same section
- Cannot mix cafe, flowers, and books items in one order
- `section` field on order must match all items' sections

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
5. Section (badge with color: cafe=brown, flowers=pink, books=blue)
6. Payment Status (dropdown, inline editable)
7. Fulfillment Status (dropdown, inline editable)
8. Items Count
9. Total (formatted with currency)
10. Actions (dropdown menu: View, Duplicate, Delete)

**Status Colors:**

Payment Status:
- `paid` → Green badge
- `pending` → Yellow badge
- `refunded` → Gray badge
- `failed` → Red badge

Fulfillment Status:
- `fulfilled` → Blue badge
- `unfulfilled` → Gray badge
- `partial` → Orange badge
- `scheduled` → Purple badge

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
  - First name, Last name
  - Address, City, State, Postal code

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
    - Price input (auto-filled from product)
    - Remove button (X)
  - Add product button
  - Validation: at least 1 product required
- **Payment Section:**
  - Subtotal input (auto-calculated or manual)
  - Tax input (18% default or manual)
  - Shipping input (manual)
  - Total display (bold, calculated)
- **Shipping Address Section:**
  - First name, Last name
  - Address
  - City, State, ZIP

**Right Column:**
- **Order Details:**
  - Section dropdown (required)
  - Order date (default: today)
- **Payment Status:**
  - Dropdown (default: pending)
- **Fulfillment Status:**
  - Dropdown (default: unfulfilled)
- **Notes:**
  - Textarea
- **Tags:**
  - Input (comma-separated)

**Validation:**
- Customer name and email are required
- At least one product required
- All products must be selected (not empty)
- Email format validation
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
- ✅ Validate shipping costs against shipping API or rate table
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
POST /api/orders
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
  "pending": ["paid", "failed"],
  "paid": ["refunded"],
  "failed": ["pending"],
  "refunded": [] // Cannot change from refunded
};

function validatePaymentStatusChange(currentStatus, newStatus) {
  const allowed = allowedTransitions[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot change payment status from ${currentStatus} to ${newStatus}`);
  }

  // Additional validation: Only admins can mark as "paid" manually
  if (newStatus === "paid" && req.user.role !== "admin") {
    throw new Error("Only admins can manually mark orders as paid");
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
POST /api/orders
Content-Type: application/json

{
  "customer": {
    "name": "Fatima Ahmed",
    "email": "fatima@email.com",
    "phone": "+92 300 1112222"
  },
  "section": "cafe",
  "items": [
    {
      "productId": "prod-cafe-001",
      "quantity": 2,
      "price": 350
    },
    {
      "productId": "prod-cafe-015",
      "quantity": 1,
      "price": 450
    }
  ],
  "paymentStatus": "paid",
  "fulfillmentStatus": "unfulfilled",
  "subtotal": 1150,
  "tax": 207,
  "shippingCost": 0,
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
    "section": "cafe",
    "paymentStatus": "paid",
    "fulfillmentStatus": "unfulfilled",
    "itemsCount": 3,
    "total": "Rs 1,357",
    "totalNumeric": 1357,
    "createdAt": "2025-11-19T18:30:00.000Z"
  }
}
```

### Example 2: Filter Orders by Section and Status

**Request:**
```bash
GET /api/orders?section=flowers&paymentStatus=paid&fulfillmentStatus=unfulfilled&page=1&limit=10
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
        "section": "flowers",
        "paymentStatus": "paid",
        "fulfillmentStatus": "unfulfilled",
        "itemsCount": 1,
        "total": "Rs 3,500",
        "date": "2025-11-19T14:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalOrders": 1
    }
  }
}
```

### Example 3: Update Fulfillment Status

**Request:**
```bash
PATCH /api/orders/2/fulfillment-status
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
    "fulfillmentStatus": "fulfilled",
    "updatedAt": "2025-11-19T19:00:00.000Z"
  }
}
```

### Example 4: Search Orders

**Request:**
```bash
GET /api/orders?search=Ahmed
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
        "section": "flowers",
        "total": "Rs 3,500"
      },
      {
        "id": "5",
        "orderNumber": "#1030",
        "customer": {
          "name": "Zainab Ahmed",
          "email": "zainab.a@email.com"
        },
        "section": "flowers",
        "total": "Rs 2,650"
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
