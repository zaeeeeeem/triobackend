# Order Management Module

## Overview
The Order Management module handles order creation, tracking, fulfillment, and payment processing. It supports both registered customer orders and guest checkout, with comprehensive order management features for admins including status tracking, statistics, and CSV export.

---

## Module Structure

### Files
- **Controller:** [src/controllers/order.controller.ts](../../src/controllers/order.controller.ts)
- **Service:** [src/services/order.service.ts](../../src/services/order.service.ts)
- **Routes:** [src/routes/order.routes.ts](../../src/routes/order.routes.ts)
- **Types:** [src/types/order.types.ts](../../src/types/order.types.ts) (7,955 bytes)
- **Validator:** [src/validators/order.validator.ts](../../src/validators/order.validator.ts)
- **Guest Order Controller:** [src/controllers/guest-order.controller.ts](../../src/controllers/guest-order.controller.ts)
- **Guest Order Service:** [src/services/guest-order.service.ts](../../src/services/guest-order.service.ts)
- **Guest Order Routes:** [src/routes/guest-order.routes.ts](../../src/routes/guest-order.routes.ts)

### Database Tables
- `orders` - Order records
- `order_items` - Order line items
- `shipping_addresses` - Shipping information
- `customers` - Customer accounts (linked)
- `products` - Product information (linked)

### Dependencies
- `@prisma/client` - Database operations
- `express-validator` - Input validation
- `uuid` - Order number generation

---

## Implementation Status

⚠️ **Status: Partially Implemented**

According to git commit history:
- Basic structure exists
- Has bugs and incomplete features
- Mentioned in commit: "Tested and fix few errors in customer module but still not completely fixed"
- Requires testing and bug fixes

---

## Features

### 1. Create Order (Checkout)
**Endpoint:** `POST /api/v1/orders`

**Function:** `orderService.create()`

**Access:**
- Authenticated customers
- Guest customers (with guest token)
- Optional customer auth (supports both)

**Process:**
1. Validate order items
2. Fetch products and verify availability
3. Calculate totals (subtotal, tax, shipping)
4. Apply discount code (if provided)
5. Create order record
6. Create order items
7. Create/link shipping address
8. Update inventory (commit stock)
9. Send order confirmation email
10. Return order details

**Required Fields:**
- `customer` - Customer information (name, email, phone)
- `section` - Order section (CAFE, FLOWERS, BOOKS)
- `items` - Array of order items (productId, quantity, variantId)

**Optional Fields:**
- `discountCode` - Discount/promo code
- `shippingAddress` - Shipping address details
- `paymentStatus` - Initial payment status (default: PENDING)
- `fulfillmentStatus` - Initial fulfillment status (default: UNFULFILLED)
- `notes` - Order notes
- `tags` - Order tags
- `paymentMethod` - Payment method (cash, card, online)

**Sample Request:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92 300 1234567"
  },
  "section": "CAFE",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    },
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "variantId": "variant-uuid",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+92 300 1234567",
    "email": "john@example.com",
    "address": "123 Main St, Apt 4",
    "city": "Lahore",
    "state": "Punjab",
    "postalCode": "54000",
    "country": "Pakistan"
  },
  "discountCode": "SAVE10",
  "paymentMethod": "cash",
  "notes": "Please deliver before 5 PM"
}
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-20250125-001",
      "section": "CAFE",
      "paymentStatus": "PENDING",
      "fulfillmentStatus": "UNFULFILLED",
      "subtotal": 45.98,
      "tax": 3.68,
      "shipping": 5.00,
      "discount": 4.60,
      "totalAmount": 50.06,
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+92 300 1234567"
      },
      "items": [
        {
          "id": "uuid",
          "productId": "550e8400-e29b-41d4-a716-446655440000",
          "productName": "Ethiopian Yirgacheffe",
          "sku": "CAFE-ETH-001",
          "quantity": 2,
          "price": 18.99,
          "subtotal": 37.98
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "address": "123 Main St, Apt 4",
        "city": "Lahore",
        "state": "Punjab",
        "postalCode": "54000",
        "country": "Pakistan"
      },
      "createdAt": "2025-01-25T10:00:00Z"
    }
  }
}
```

**Order Number Format:** `ORD-YYYYMMDD-###`
- ORD: Prefix
- YYYYMMDD: Date
- ###: Sequential number for the day

**Calculations:**
```typescript
subtotal = sum(item.price * item.quantity)
tax = subtotal * TAX_RATE (e.g., 0.08 for 8%)
shipping = calculated based on location/weight
discount = calculated from discount code
totalAmount = subtotal + tax + shipping - discount
```

---

### 2. List Orders (Admin)
**Endpoint:** `GET /api/v1/orders`

**Function:** `orderService.list(filters)`

**Access:** Admin only (authenticate middleware)

**Query Parameters:**

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Filters:**
- `search` - Search by order number, customer name, or email
- `section` - Filter by section (CAFE, FLOWERS, BOOKS)
- `paymentStatus` - Filter by payment status (PENDING, PAID, FAILED, REFUNDED)
- `fulfillmentStatus` - Filter by fulfillment status (UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `customerId` - Filter by customer ID
- `dateFrom` - Filter orders after this date
- `dateTo` - Filter orders before this date

**Sorting:**
- `sortBy` - Sort field (orderDate, total, orderNumber, createdAt)
- `sortOrder` - Sort order (asc, desc)

**Sample Request:**
```
GET /api/v1/orders?page=1&limit=20&section=CAFE&paymentStatus=PAID&sortBy=createdAt&sortOrder=desc
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250125-001",
        "section": "CAFE",
        "paymentStatus": "PAID",
        "fulfillmentStatus": "PROCESSING",
        "totalAmount": 50.06,
        "itemCount": 3,
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "createdAt": "2025-01-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
```

---

### 3. Get Order by ID
**Endpoint:** `GET /api/v1/orders/:orderId`

**Function:** `orderService.getById(orderId)`

**Access:** Admin only

**Returns:**
- Complete order details
- All order items with product information
- Shipping address
- Customer information
- Payment and fulfillment status
- Order timeline/history

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-20250125-001",
      "section": "CAFE",
      "paymentStatus": "PAID",
      "fulfillmentStatus": "SHIPPED",
      "paymentMethod": "cash",
      "subtotal": 45.98,
      "tax": 3.68,
      "shipping": 5.00,
      "discount": 4.60,
      "totalAmount": 50.06,
      "notes": "Please deliver before 5 PM",
      "tags": ["urgent", "gift"],
      "customer": {
        "id": "customer-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+92 300 1234567"
      },
      "items": [
        {
          "id": "uuid",
          "productId": "product-uuid",
          "productName": "Ethiopian Yirgacheffe",
          "sku": "CAFE-ETH-001",
          "quantity": 2,
          "price": 18.99,
          "subtotal": 37.98,
          "product": {
            "name": "Ethiopian Yirgacheffe",
            "section": "CAFE",
            "images": [
              {
                "thumbnailUrl": "https://s3.../thumbnail.webp"
              }
            ]
          }
        }
      ],
      "shippingAddress": {
        "id": "uuid",
        "fullName": "John Doe",
        "phone": "+92 300 1234567",
        "email": "john@example.com",
        "address": "123 Main St, Apt 4",
        "city": "Lahore",
        "state": "Punjab",
        "postalCode": "54000",
        "country": "Pakistan"
      },
      "createdAt": "2025-01-25T10:00:00Z",
      "updatedAt": "2025-01-25T14:00:00Z"
    }
  }
}
```

---

### 4. Update Order
**Endpoint:** `PATCH /api/v1/orders/:orderId`

**Function:** `orderService.update(orderId, data)`

**Access:** Admin only

**Updatable Fields:**
- `paymentStatus` - Update payment status
- `fulfillmentStatus` - Update fulfillment status
- `notes` - Update order notes
- `tags` - Update order tags
- `paymentMethod` - Update payment method

**Restrictions:**
- Cannot update items after order is created
- Some status changes have validation rules

**Sample Request:**
```json
{
  "paymentStatus": "PAID",
  "fulfillmentStatus": "PROCESSING",
  "notes": "Payment received via cash",
  "tags": ["paid", "processing"]
}
```

---

### 5. Update Payment Status
**Endpoint:** `PATCH /api/v1/orders/:orderId/payment-status`

**Function:** `orderService.updatePaymentStatus(orderId, paymentStatus)`

**Access:** Admin only

**Payment Statuses:**
- `PENDING` - Payment not yet received
- `PAID` - Payment completed
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

**Status Transition Rules:**
- PENDING → PAID (allowed)
- PENDING → FAILED (allowed)
- PAID → REFUNDED (allowed)
- FAILED → PAID (not allowed without admin override)
- REFUNDED → PAID (not allowed)

**Sample Request:**
```json
{
  "paymentStatus": "PAID"
}
```

**Actions Triggered:**
- Email notification to customer
- Inventory commitment (if PAID)
- Order history log entry

---

### 6. Update Fulfillment Status
**Endpoint:** `PATCH /api/v1/orders/:orderId/fulfillment-status`

**Function:** `orderService.updateFulfillmentStatus(orderId, fulfillmentStatus)`

**Access:** Admin only

**Fulfillment Statuses:**
- `UNFULFILLED` - Not yet started
- `PROCESSING` - Being prepared
- `SHIPPED` - Shipped to customer
- `DELIVERED` - Delivered to customer
- `CANCELLED` - Order cancelled

**Status Flow:**
```
UNFULFILLED → PROCESSING → SHIPPED → DELIVERED
     ↓
  CANCELLED (can cancel at any stage before DELIVERED)
```

**Sample Request:**
```json
{
  "fulfillmentStatus": "SHIPPED"
}
```

**Actions Triggered:**
- Email notification to customer (shipping confirmation, tracking info)
- SMS notification (if enabled)
- Inventory update (release committed stock if cancelled)
- Order history log entry

---

### 7. Get Order Statistics
**Endpoint:** `GET /api/v1/orders/stats`

**Function:** `orderService.getStats(filters)`

**Access:** Admin only

**Query Parameters:**
- `dateFrom` - Start date for statistics
- `dateTo` - End date for statistics
- `section` - Filter by section

**Calculated Statistics:**
- Total orders
- Total revenue
- Average order value
- Orders by status breakdown
- Orders by section breakdown
- Revenue by section
- Top products
- Top customers
- Daily/weekly/monthly trends

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalOrders": 1250,
      "totalRevenue": 45678.90,
      "averageOrderValue": 36.54,
      "ordersByPaymentStatus": {
        "PENDING": 45,
        "PAID": 1150,
        "FAILED": 30,
        "REFUNDED": 25
      },
      "ordersByFulfillmentStatus": {
        "UNFULFILLED": 20,
        "PROCESSING": 35,
        "SHIPPED": 80,
        "DELIVERED": 1095,
        "CANCELLED": 20
      },
      "ordersBySection": {
        "CAFE": 650,
        "FLOWERS": 350,
        "BOOKS": 250
      },
      "revenueBySection": {
        "CAFE": 25000.00,
        "FLOWERS": 15000.00,
        "BOOKS": 5678.90
      },
      "topProducts": [
        {
          "productId": "uuid",
          "productName": "Ethiopian Yirgacheffe",
          "orderCount": 250,
          "revenue": 4747.50
        }
      ],
      "topCustomers": [
        {
          "customerId": "uuid",
          "customerName": "John Doe",
          "orderCount": 25,
          "totalSpent": 987.50
        }
      ],
      "dailyRevenue": [
        {
          "date": "2025-01-25",
          "orders": 35,
          "revenue": 1250.00
        }
      ]
    }
  }
}
```

---

### 8. Export Orders to CSV
**Endpoint:** `GET /api/v1/orders/export`

**Function:** `orderService.exportCsv(filters)`

**Access:** Admin only

**Query Parameters:**
- Same as list orders (search, section, statuses, dates)

**CSV Columns:**
- Order Number
- Order Date
- Customer Name
- Customer Email
- Section
- Payment Status
- Fulfillment Status
- Subtotal
- Tax
- Shipping
- Discount
- Total Amount
- Items Count
- Notes

**Sample Request:**
```
GET /api/v1/orders/export?section=CAFE&paymentStatus=PAID&dateFrom=2025-01-01&dateTo=2025-01-31
```

**Response:**
- Content-Type: text/csv
- CSV file download

---

### 9. Duplicate Order
**Endpoint:** `POST /api/v1/orders/:orderId/duplicate`

**Function:** `orderService.duplicate(orderId)`

**Access:** Admin only

**Purpose:** Quickly reorder or create similar order

**Process:**
1. Fetch original order
2. Create new order with same items
3. Reset payment and fulfillment status
4. Generate new order number
5. Return new order

**Use Cases:**
- Customer wants to reorder
- Create template orders
- Repeat orders

---

### 10. Delete Order
**Endpoint:** `DELETE /api/v1/orders/:orderId?hard=false`

**Function:** `orderService.delete(orderId, hard)`

**Access:** Admin only

**Deletion Types:**

**Soft Delete (default):**
- Sets `deletedAt` timestamp
- Order hidden from listings
- Data preserved
- Can be restored

**Hard Delete (hard=true):**
- Permanently removes order
- Deletes order items
- Cannot be restored
- Admin only

**Restrictions:**
- Cannot delete PAID orders (must refund first)
- Cannot delete SHIPPED/DELIVERED orders
- Can only delete PENDING/CANCELLED orders

**Sample Request:**
```
DELETE /api/v1/orders/uuid?hard=false
```

---

## Guest Checkout

### 11. Create Guest Order
**Endpoint:** `POST /api/v1/guest-orders`

**Access:** Public (no authentication)

**Process:**
1. Generate guest customer ID
2. Create order with guest flag
3. Send confirmation email
4. Return order details and guest token

**Guest Token:**
- Allows tracking order by guest
- Can be used to convert to registered customer
- Limited access (only their order)

---

### 12. Track Guest Order
**Endpoint:** `GET /api/v1/guest-orders/track?email={email}&orderNumber={orderNumber}`

**Access:** Public

**Parameters:**
- `email` - Customer email
- `orderNumber` - Order number

**Purpose:** Allow guests to track their order without login

---

### 13. Link Guest Orders to Customer
**Function:** `guestOrderService.linkGuestOrdersToCustomer(email, customerId)`

**Triggered:** Automatically when guest creates account

**Process:**
1. Find all orders with guest email
2. Update customerId to registered customer
3. Link orders to customer account
4. Customer can now see order history

---

## Order Status Workflow

### Payment Status Flow
```
PENDING (initial)
   ↓
PAID (payment received)
   ↓
REFUNDED (if refund issued)

OR

PENDING → FAILED (payment failed)
```

### Fulfillment Status Flow
```
UNFULFILLED (initial)
   ↓
PROCESSING (preparing order)
   ↓
SHIPPED (in transit)
   ↓
DELIVERED (completed)

OR

Any status → CANCELLED (order cancelled)
```

### Combined Workflow Example
```
1. Order Created: PENDING / UNFULFILLED
2. Payment Received: PAID / UNFULFILLED
3. Start Preparing: PAID / PROCESSING
4. Ship Order: PAID / SHIPPED
5. Delivery: PAID / DELIVERED
```

---

## Inventory Integration

### Stock Management

**On Order Creation:**
- Check product availability
- Reserve stock (commit stock)
- Update `committed` quantity in inventory

**On Payment Confirmation:**
- Deduct from `onHand` quantity
- Deduct from `committed` quantity
- Update `available` quantity

**On Order Cancellation:**
- Release committed stock
- Return to available quantity

**Inventory Calculations:**
```typescript
available = onHand - committed
committed = sum of pending order quantities
onHand = physical stock in warehouse
```

---

## Discount Code Integration

### Apply Discount
**Function:** `orderService.applyDiscountCode(code, orderSubtotal)`

**Discount Types:**
- Percentage discount (e.g., 10% off)
- Fixed amount discount (e.g., $5 off)
- Free shipping
- Buy X get Y free

**Validation:**
- Code must be active
- Check expiry date
- Check usage limit
- Check minimum order value
- Check section restrictions

---

## Email Notifications

### Order Confirmation Email
**Triggered:** Order created
**Recipients:** Customer
**Content:**
- Order number
- Order summary
- Items ordered
- Total amount
- Shipping address
- Estimated delivery date

### Payment Confirmation Email
**Triggered:** Payment status → PAID
**Recipients:** Customer
**Content:**
- Payment received confirmation
- Receipt details
- Next steps

### Shipping Confirmation Email
**Triggered:** Fulfillment status → SHIPPED
**Recipients:** Customer
**Content:**
- Tracking number
- Carrier information
- Estimated delivery date
- Tracking link

### Delivery Confirmation Email
**Triggered:** Fulfillment status → DELIVERED
**Recipients:** Customer
**Content:**
- Order delivered confirmation
- Request for review
- Support contact information

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Invalid order data
- Missing required fields
- Invalid product IDs
- Quantity exceeds stock

**404 Not Found:**
- Order ID not found
- Product not found

**409 Conflict:**
- Product out of stock
- Invalid status transition

**422 Validation Error:**
- Invalid discount code
- Minimum order value not met
- Invalid shipping address

---

## Database Schema

```prisma
model Order {
  id                 String            @id @default(uuid())
  orderNumber        String            @unique
  customerId         String?
  customer           Customer?         @relation(fields: [customerId], references: [id])
  section            Section
  paymentStatus      PaymentStatus     @default(PENDING)
  fulfillmentStatus  FulfillmentStatus @default(UNFULFILLED)
  paymentMethod      String?
  subtotal           Decimal           @db.Decimal(10, 2)
  tax                Decimal           @db.Decimal(10, 2)
  shipping           Decimal           @db.Decimal(10, 2)
  discount           Decimal           @db.Decimal(10, 2) @default(0)
  totalAmount        Decimal           @db.Decimal(10, 2)
  notes              String?
  tags               String[]
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  deletedAt          DateTime?

  items              OrderItem[]
  shippingAddress    ShippingAddress?

  @@index([orderNumber])
  @@index([customerId])
  @@index([paymentStatus])
  @@index([fulfillmentStatus])
  @@index([section])
  @@index([createdAt])
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  variantId   String?
  productName String
  sku         String
  quantity    Int
  price       Decimal  @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([productId])
}

model ShippingAddress {
  id          String  @id @default(uuid())
  orderId     String  @unique
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fullName    String
  phone       String
  email       String?
  address     String
  city        String
  state       String
  postalCode  String
  country     String
  createdAt   DateTime @default(now())

  @@index([orderId])
}

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
```

---

## API Endpoints Summary

```
# Order Management (Admin)
POST   /api/v1/orders                           - Create order (checkout)
GET    /api/v1/orders                           - List orders
GET    /api/v1/orders/stats                     - Get statistics
GET    /api/v1/orders/export                    - Export to CSV
GET    /api/v1/orders/:orderId                  - Get order by ID
PATCH  /api/v1/orders/:orderId                  - Update order
PATCH  /api/v1/orders/:orderId/payment-status   - Update payment status
PATCH  /api/v1/orders/:orderId/fulfillment-status - Update fulfillment status
POST   /api/v1/orders/:orderId/duplicate        - Duplicate order
DELETE /api/v1/orders/:orderId                  - Delete order

# Guest Orders (Public)
POST   /api/v1/guest-orders                     - Create guest order
GET    /api/v1/guest-orders/track               - Track guest order
```

---

## Testing Checklist

- [ ] Create order with registered customer
- [ ] Create order with guest customer
- [ ] Create order with discount code
- [ ] Create order with out-of-stock product (should fail)
- [ ] List orders with various filters
- [ ] Get order by ID
- [ ] Update order details
- [ ] Update payment status (all transitions)
- [ ] Update fulfillment status (all transitions)
- [ ] Get order statistics
- [ ] Export orders to CSV
- [ ] Duplicate order
- [ ] Delete order (soft and hard)
- [ ] Cannot delete paid order
- [ ] Guest order tracking
- [ ] Link guest orders to registered customer
- [ ] Email notifications sent correctly
- [ ] Inventory updated correctly

---

## Known Issues (Per Git History)

⚠️ **Current Status:** Module has bugs and incomplete features

**Mentioned Issues:**
- Not completely tested
- Has errors and bugs
- Customer module integration issues
- Requires comprehensive testing

**TODO:**
- [ ] Complete testing of all endpoints
- [ ] Fix bugs mentioned in commits
- [ ] Complete guest order integration
- [ ] Test inventory integration
- [ ] Test email notifications
- [ ] Add order cancellation workflow
- [ ] Add refund workflow

---

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Partial refunds
- [ ] Order returns and exchanges
- [ ] Order tracking with carrier integration
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Order history export (PDF invoices)
- [ ] Recurring orders/subscriptions
- [ ] Gift wrapping options
- [ ] Delivery scheduling
- [ ] Order notes/comments thread
- [ ] Order status webhooks
- [ ] Multi-currency support
- [ ] Tax calculation by location
- [ ] Shipping rate calculation by carrier

---

## Related Modules
- [Product Management Module](./02-PRODUCT_MANAGEMENT_MODULE.md) - Products for order items
- [Customer Management Module](./04-CUSTOMER_MANAGEMENT_MODULE.md) - Customer profiles and orders
- [Inventory Module](./06-INVENTORY_MODULE.md) - Stock management
- [Discount Module](./09-DISCOUNT_MODULE.md) - Discount codes (planned)
- [Email Service](./08-EMAIL_SERVICE.md) - Order notifications

---

## References
- [E-commerce Order Management Best Practices](https://www.shopify.com/enterprise/order-management-system)
- [Order Fulfillment Workflow](https://www.shipbob.com/blog/order-fulfillment/)
- [Payment Processing Best Practices](https://stripe.com/docs/payments)
