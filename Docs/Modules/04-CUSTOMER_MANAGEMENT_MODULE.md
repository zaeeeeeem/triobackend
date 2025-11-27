# Customer Management Module

## Overview
The Customer Management module handles customer profile management, order history, statistics, preferences, and address management. It provides separate interfaces for customers to manage their own data and for admins to manage all customers.

---

## Module Structure

### Files
- **Controllers:**
  - [src/controllers/customer.controller.ts](../../src/controllers/customer.controller.ts) (251 lines)
  - [src/controllers/admin-customer.controller.ts](../../src/controllers/admin-customer.controller.ts)
  - [src/controllers/customer-address.controller.ts](../../src/controllers/customer-address.controller.ts)

- **Services:**
  - [src/services/customer.service.ts](../../src/services/customer.service.ts) (557 lines)
  - [src/services/customer-address.service.ts](../../src/services/customer-address.service.ts)

- **Routes:**
  - [src/routes/customer.routes.ts](../../src/routes/customer.routes.ts)
  - [src/routes/admin-customer.routes.ts](../../src/routes/admin-customer.routes.ts)
  - [src/routes/customer-address.routes.ts](../../src/routes/customer-address.routes.ts)

- **Types:**
  - [src/types/customer.types.ts](../../src/types/customer.types.ts) (4,264 bytes)
  - [src/types/address.types.ts](../../src/types/address.types.ts) (2,949 bytes)

### Database Tables
- `customers` - Customer accounts
- `customer_addresses` - Shipping/billing addresses
- `orders` - Customer orders
- `order_items` - Order line items

### Dependencies
- `@prisma/client` - Database operations
- `bcryptjs` - Password hashing
- `express-validator` - Input validation

---

## Features

## Part 1: Customer Profile Management

### 1. Get Customer Profile
**Endpoint:** `GET /api/v1/customers/profile`

**Function:** `customerService.getCustomerProfile(customerId)`

**Access:** Authenticated customers only

**Returns:**
- Customer basic information
- Customer statistics
- Email preferences
- Marketing preferences

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "emailVerified": true,
      "status": "ACTIVE",
      "customerType": "REGISTERED",
      "acceptsMarketing": true,
      "acceptsSmsMarketing": false,
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "statistics": {
      "totalOrders": 15,
      "totalSpent": 542.50,
      "averageOrderValue": 36.17,
      "lastOrderDate": "2025-01-20T14:30:00Z",
      "orderFrequency": "Monthly",
      "favoriteSection": "CAFE",
      "topProducts": [
        {
          "productId": "uuid",
          "name": "Ethiopian Yirgacheffe",
          "purchaseCount": 5
        }
      ],
      "loyaltyTier": "Gold"
    },
    "preferences": {
      "newsletter": true,
      "orderUpdates": true,
      "promotions": true,
      "newProducts": false
    }
  }
}
```

**Statistics Calculated:**
- **Total Orders:** Count of all completed orders
- **Total Spent:** Sum of all order totals
- **Average Order Value:** Total spent / Total orders
- **Last Order Date:** Most recent order date
- **Order Frequency:** Based on order intervals (Daily, Weekly, Monthly, Quarterly, Yearly)
- **Favorite Section:** Section with most orders (CAFE, FLOWERS, BOOKS)
- **Top Products:** Most purchased products (top 5)
- **Loyalty Tier:** Based on total spent:
  - Bronze: $0 - $99
  - Silver: $100 - $499
  - Gold: $500 - $999
  - Platinum: $1000+

---

### 2. Update Customer Profile
**Endpoint:** `PATCH /api/v1/customers/profile`

**Function:** `customerService.updateCustomer(customerId, data)`

**Access:** Authenticated customers only

**Updatable Fields:**
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number
- `acceptsMarketing` - Marketing consent
- `acceptsSmsMarketing` - SMS marketing consent

**Restrictions:**
- Cannot update email (use change-email endpoint)
- Cannot update password (use change-password endpoint)
- Cannot update status or customerType

**Sample Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "acceptsMarketing": false
}
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+1234567890",
      "acceptsMarketing": false
    }
  }
}
```

---

### 3. Change Email
**Endpoint:** `POST /api/v1/customers/change-email`

**Function:** `customerService.changeEmail(customerId, newEmail, currentPassword)`

**Access:** Authenticated customers only

**Process:**
1. Verify current password
2. Check if new email already exists
3. Generate email verification token
4. Send verification email to new address
5. Update email (mark as unverified)
6. Send notification to old email
7. Return success message

**Required Fields:**
- `newEmail` - New email address
- `currentPassword` - Current password (for verification)

**Sample Request:**
```json
{
  "newEmail": "newemail@example.com",
  "currentPassword": "SecurePass123!"
}
```

**Security Features:**
- Requires password verification
- New email must be verified
- Notification sent to old email
- Cannot use existing email

**Sample Response:**
```json
{
  "success": true,
  "message": "Email change initiated. Please verify your new email address."
}
```

---

### 4. Change Password
**Endpoint:** `POST /api/v1/customers/change-password`

**Function:** `customerService.changePassword(customerId, currentPassword, newPassword)`

**Access:** Authenticated customers only

**Process:**
1. Verify current password
2. Validate new password strength
3. Hash new password
4. Update password
5. Optionally invalidate all sessions
6. Send confirmation email
7. Return success message

**Required Fields:**
- `currentPassword` - Current password
- `newPassword` - New password (must meet strength requirements)
- `logoutAllDevices` - Optional, logout from all devices (default: false)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Must differ from current password

**Sample Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!",
  "logoutAllDevices": true
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 5. Update Email Preferences
**Endpoint:** `PATCH /api/v1/customers/preferences`

**Function:** `customerService.updatePreferences(customerId, preferences)`

**Access:** Authenticated customers only

**Preferences:**
- `newsletter` - Subscribe to newsletter
- `orderUpdates` - Receive order status updates
- `promotions` - Receive promotional emails
- `newProducts` - Receive new product announcements
- `acceptsMarketing` - General marketing consent
- `acceptsSmsMarketing` - SMS marketing consent

**Sample Request:**
```json
{
  "newsletter": true,
  "orderUpdates": true,
  "promotions": false,
  "newProducts": true,
  "acceptsMarketing": true,
  "acceptsSmsMarketing": false
}
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "newsletter": true,
      "orderUpdates": true,
      "promotions": false,
      "newProducts": true
    }
  }
}
```

---

### 6. Delete Account
**Endpoint:** `DELETE /api/v1/customers/account`

**Function:** `customerService.deleteCustomer(customerId, password)`

**Access:** Authenticated customers only

**Process:**
1. Verify password
2. Soft delete account (set deletedAt timestamp)
3. Update status to DELETED
4. Invalidate all refresh tokens
5. Send confirmation email
6. Return success message

**Required Fields:**
- `password` - Current password (for verification)

**Data Retention:**
- Account data preserved (soft delete)
- Order history preserved
- Can be restored by admin if needed
- Personal data can be permanently deleted upon request (GDPR)

**Sample Request:**
```json
{
  "password": "SecurePass123!"
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Part 2: Order History

### 7. Get Customer Orders
**Endpoint:** `GET /api/v1/customers/orders`

**Function:** `customerService.getCustomerOrders(customerId, filters)`

**Access:** Authenticated customers only

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `status` - Filter by order status (PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED)
- `paymentStatus` - Filter by payment status (PENDING, PAID, FAILED, REFUNDED)
- `startDate` - Filter orders after this date
- `endDate` - Filter orders before this date

**Sample Request:**
```
GET /api/v1/customers/orders?page=1&limit=10&status=COMPLETED
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250115-001",
        "status": "COMPLETED",
        "paymentStatus": "PAID",
        "totalAmount": 45.99,
        "itemCount": 3,
        "createdAt": "2025-01-15T10:00:00Z",
        "items": [
          {
            "id": "uuid",
            "productName": "Ethiopian Yirgacheffe",
            "quantity": 2,
            "price": 18.99,
            "subtotal": 37.98
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasMore": true
    }
  }
}
```

---

### 8. Get Order Details
**Endpoint:** `GET /api/v1/customers/orders/:orderId`

**Function:** `customerService.getOrderById(customerId, orderId)`

**Access:** Authenticated customers only

**Returns:**
- Complete order details
- All order items with product info
- Shipping address
- Payment information
- Order timeline

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-20250115-001",
      "status": "COMPLETED",
      "paymentStatus": "PAID",
      "fulfillmentStatus": "DELIVERED",
      "subtotal": 37.98,
      "tax": 3.04,
      "shipping": 5.00,
      "totalAmount": 46.02,
      "createdAt": "2025-01-15T10:00:00Z",
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
            "images": [
              {
                "thumbnailUrl": "https://s3.../thumbnail.webp"
              }
            ]
          }
        }
      ],
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "USA"
      },
      "timeline": [
        {
          "status": "PENDING",
          "timestamp": "2025-01-15T10:00:00Z"
        },
        {
          "status": "PROCESSING",
          "timestamp": "2025-01-15T10:30:00Z"
        },
        {
          "status": "COMPLETED",
          "timestamp": "2025-01-16T14:00:00Z"
        }
      ]
    }
  }
}
```

**Security:**
- Customers can only access their own orders
- Returns 404 if order doesn't belong to customer

---

### 9. Get Customer Statistics
**Endpoint:** `GET /api/v1/customers/statistics`

**Function:** `customerService.calculateStatistics(customerId)`

**Access:** Authenticated customers only

**Calculated Metrics:**
- Total orders
- Total amount spent
- Average order value
- Last order date
- Order frequency
- Favorite section
- Top purchased products (top 5)
- Loyalty tier
- Orders by status breakdown
- Monthly spending trend (last 6 months)

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalOrders": 25,
      "totalSpent": 987.50,
      "averageOrderValue": 39.50,
      "lastOrderDate": "2025-01-20T14:30:00Z",
      "orderFrequency": "Weekly",
      "favoriteSection": "CAFE",
      "loyaltyTier": "Gold",
      "ordersByStatus": {
        "completed": 20,
        "pending": 2,
        "cancelled": 3
      },
      "topProducts": [
        {
          "productId": "uuid",
          "name": "Ethiopian Yirgacheffe",
          "purchaseCount": 8,
          "totalSpent": 151.92
        }
      ],
      "monthlySpending": [
        { "month": "2025-01", "amount": 150.00 },
        { "month": "2024-12", "amount": 200.00 }
      ]
    }
  }
}
```

---

## Part 3: Address Management

### 10. List Customer Addresses
**Endpoint:** `GET /api/v1/customers/addresses`

**Function:** `customerAddressService.listAddresses(customerId)`

**Access:** Authenticated customers only

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "company": "Acme Corp",
        "address1": "123 Main St",
        "address2": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "USA",
        "phone": "+1234567890",
        "isDefaultShipping": true,
        "isDefaultBilling": false,
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 11. Create Address
**Endpoint:** `POST /api/v1/customers/addresses`

**Function:** `customerAddressService.createAddress(customerId, data)`

**Access:** Authenticated customers only

**Required Fields:**
- `firstName` - First name
- `lastName` - Last name
- `address1` - Street address
- `city` - City
- `state` - State/Province
- `zip` - Postal code
- `country` - Country

**Optional Fields:**
- `company` - Company name
- `address2` - Apartment/Suite number
- `phone` - Contact phone
- `isDefaultShipping` - Set as default shipping address
- `isDefaultBilling` - Set as default billing address

**Sample Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  "address2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "isDefaultShipping": true
}
```

**Automatic Default Handling:**
- If first address: Automatically set as default shipping and billing
- If `isDefaultShipping: true`: Remove default flag from other addresses
- If `isDefaultBilling: true`: Remove default flag from other addresses

---

### 12. Get Address Details
**Endpoint:** `GET /api/v1/customers/addresses/:addressId`

**Function:** `customerAddressService.getAddress(customerId, addressId)`

**Access:** Authenticated customers only

**Security:**
- Customers can only access their own addresses
- Returns 404 if address doesn't belong to customer

---

### 13. Update Address
**Endpoint:** `PATCH /api/v1/customers/addresses/:addressId`

**Function:** `customerAddressService.updateAddress(customerId, addressId, data)`

**Access:** Authenticated customers only

**Updatable Fields:**
- All address fields
- `isDefaultShipping` flag
- `isDefaultBilling` flag

**Sample Request:**
```json
{
  "address1": "456 New St",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "90001"
}
```

---

### 14. Delete Address
**Endpoint:** `DELETE /api/v1/customers/addresses/:addressId`

**Function:** `customerAddressService.deleteAddress(customerId, addressId)`

**Access:** Authenticated customers only

**Restrictions:**
- Cannot delete if it's the only address
- Cannot delete if used in pending orders
- Warning if deleting default address

**Sample Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### 15. Set Default Address
**Endpoint:** `POST /api/v1/customers/addresses/:addressId/default`

**Function:** `customerAddressService.setDefaultAddress(customerId, addressId, type)`

**Access:** Authenticated customers only

**Request Body:**
```json
{
  "type": "shipping" // or "billing" or "both"
}
```

**Process:**
1. Remove default flag from other addresses (for specified type)
2. Set address as default
3. Return success

---

## Part 4: Admin Customer Management

### 16. List All Customers (Admin)
**Endpoint:** `GET /api/v1/admin/customers`

**Function:** `customerService.listCustomers(filters)`

**Access:** ADMIN only

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name, email, phone
- `status` - Filter by status (ACTIVE, SUSPENDED, DELETED)
- `customerType` - Filter by type (REGISTERED, GUEST)
- `emailVerified` - Filter by verification status
- `minTotalSpent` - Minimum total spent
- `maxTotalSpent` - Maximum total spent
- `loyaltyTier` - Filter by tier (Bronze, Silver, Gold, Platinum)
- `sortBy` - Sort field (createdAt, totalSpent, lastOrderDate)
- `sortOrder` - ASC or DESC

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "emailVerified": true,
        "status": "ACTIVE",
        "totalOrders": 15,
        "totalSpent": 542.50,
        "loyaltyTier": "Gold",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 17. Create Customer (Admin)
**Endpoint:** `POST /api/v1/admin/customers`

**Function:** `customerService.createCustomer(data)`

**Access:** ADMIN only

**Purpose:** Allow admin to create customer accounts (for in-person sales, phone orders, etc.)

**Required Fields:**
- `email` - Customer email
- `firstName` - First name
- `lastName` - Last name
- `password` - Initial password (optional, can be generated)

**Sample Request:**
```json
{
  "email": "newcustomer@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "TempPass123!",
  "phone": "+1234567890",
  "acceptsMarketing": true,
  "emailVerified": true
}
```

---

### 18. Get Customer Details (Admin)
**Endpoint:** `GET /api/v1/admin/customers/:customerId`

**Function:** `customerService.getCustomerById(customerId)`

**Access:** ADMIN only

**Returns:**
- Complete customer profile
- All addresses
- Order statistics
- Order history
- Payment methods
- Activity log

---

### 19. Update Customer (Admin)
**Endpoint:** `PATCH /api/v1/admin/customers/:customerId`

**Function:** `customerService.updateCustomer(customerId, data)`

**Access:** ADMIN only

**Updatable Fields:**
- All profile fields
- `status` (ACTIVE, SUSPENDED, DELETED)
- `emailVerified` flag
- `customerType`
- Tags and notes

**Sample Request:**
```json
{
  "status": "SUSPENDED",
  "adminNotes": "Suspected fraudulent activity"
}
```

---

### 20. Delete Customer (Admin)
**Endpoint:** `DELETE /api/v1/admin/customers/:customerId`

**Function:** `customerService.deleteCustomer(customerId)`

**Access:** ADMIN only

**Types:**
- **Soft Delete:** Set deletedAt, status = DELETED (default)
- **Hard Delete:** Permanently remove data (with ?force=true)

**Considerations:**
- Order history preservation
- GDPR compliance (right to be forgotten)
- Data retention policies

---

## Data Sanitization

### Customer Data Sanitization
**Function:** `customerService.sanitizeCustomer(customer)`

**Purpose:** Remove sensitive fields before sending to client

**Removed Fields:**
- `password`
- `passwordResetToken`
- `passwordResetExpires`
- `adminNotes` (unless admin)

**Used In:**
- All API responses
- Profile endpoints
- List endpoints

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Invalid input data
- Missing required fields

**401 Unauthorized:**
- Not authenticated
- Invalid token

**403 Forbidden:**
- Account suspended
- Insufficient permissions

**404 Not Found:**
- Customer not found
- Address not found
- Order not found

**409 Conflict:**
- Email already exists
- Cannot delete default address
- Cannot delete last address

**422 Validation Error:**
- Invalid email format
- Weak password
- Invalid phone number
- Invalid address fields

---

## Database Schema

```prisma
model Customer {
  id                    String             @id @default(uuid())
  email                 String?            @unique
  password              String?
  firstName             String?
  lastName              String?
  phone                 String?
  emailVerified         Boolean            @default(false)
  verifiedAt            DateTime?
  passwordResetToken    String?
  passwordResetExpires  DateTime?
  status                CustomerStatus     @default(ACTIVE)
  customerType          CustomerType       @default(REGISTERED)
  acceptsMarketing      Boolean            @default(false)
  acceptsSmsMarketing   Boolean            @default(false)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  deletedAt             DateTime?

  refreshTokens         CustomerRefreshToken[]
  orders                Order[]
  addresses             CustomerAddress[]
}

model CustomerAddress {
  id                  String    @id @default(uuid())
  customerId          String
  customer            Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  firstName           String
  lastName            String
  company             String?
  address1            String
  address2            String?
  city                String
  state               String
  zip                 String
  country             String
  phone               String?
  isDefaultShipping   Boolean   @default(false)
  isDefaultBilling    Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([customerId])
  @@index([customerId, isDefaultShipping])
  @@index([customerId, isDefaultBilling])
}

enum CustomerStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum CustomerType {
  REGISTERED
  GUEST
}
```

---

## API Endpoints Summary

```
# Customer Profile
GET    /api/v1/customers/profile              - Get customer profile
PATCH  /api/v1/customers/profile              - Update profile
POST   /api/v1/customers/change-email         - Change email
POST   /api/v1/customers/change-password      - Change password
PATCH  /api/v1/customers/preferences          - Update preferences
DELETE /api/v1/customers/account              - Delete account

# Order History
GET    /api/v1/customers/orders               - List orders
GET    /api/v1/customers/orders/:orderId      - Get order details
GET    /api/v1/customers/statistics           - Get statistics

# Address Management
GET    /api/v1/customers/addresses            - List addresses
POST   /api/v1/customers/addresses            - Create address
GET    /api/v1/customers/addresses/:id        - Get address
PATCH  /api/v1/customers/addresses/:id        - Update address
DELETE /api/v1/customers/addresses/:id        - Delete address
POST   /api/v1/customers/addresses/:id/default - Set default address

# Admin Customer Management
GET    /api/v1/admin/customers                - List all customers
POST   /api/v1/admin/customers                - Create customer
GET    /api/v1/admin/customers/:id            - Get customer details
PATCH  /api/v1/admin/customers/:id            - Update customer
DELETE /api/v1/admin/customers/:id            - Delete customer
```

---

## Testing Checklist

- [ ] Get customer profile with statistics
- [ ] Update profile information
- [ ] Change email with verification
- [ ] Change password with current password verification
- [ ] Update email preferences
- [ ] Delete account with password verification
- [ ] Get customer orders with filters
- [ ] Get specific order details
- [ ] Customer can only access own orders
- [ ] Get customer statistics
- [ ] List customer addresses
- [ ] Create new address
- [ ] Set first address as default automatically
- [ ] Update address
- [ ] Delete address
- [ ] Cannot delete last address
- [ ] Set default shipping/billing address
- [ ] Admin list all customers with filters
- [ ] Admin create customer
- [ ] Admin update customer status
- [ ] Admin delete customer
- [ ] Data sanitization (password not returned)

---

## Future Enhancements

- [ ] Customer segmentation and tagging
- [ ] Loyalty points system
- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Customer support tickets
- [ ] Live chat integration
- [ ] Order tracking with notifications
- [ ] Subscription management
- [ ] Saved payment methods
- [ ] Gift card balance
- [ ] Referral program
- [ ] Social media integration
- [ ] Customer activity timeline
- [ ] Advanced analytics dashboard
- [ ] Export customer data (GDPR)

---

## Related Modules
- [Customer Authentication Module](./03-CUSTOMER_AUTHENTICATION_MODULE.md) - Registration and login
- [Order Management Module](./05-ORDER_MANAGEMENT_MODULE.md) - Order creation and tracking
- [Email Service](./08-EMAIL_SERVICE.md) - Email notifications

---

## References
- [GDPR Compliance](https://gdpr.eu/)
- [Customer Data Management Best Practices](https://www.segment.com/customer-data-platform/)
- [Address Validation Standards](https://www.ups.com/us/en/help-center/sri/address-validation.page)
