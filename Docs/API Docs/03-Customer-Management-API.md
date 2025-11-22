# Customer Management & Authentication API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-21
**Module:** Customer Management & Authentication
**Base URL:** `/api/customers`, `/api/auth`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [Guest vs Registered Users](#guest-vs-registered-users)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Customer Management](#customer-management)
   - [Customer Profile](#customer-profile)
   - [Address Management](#address-management)
   - [Order History](#order-history)
   - [Guest Conversion](#guest-conversion)
6. [Business Logic](#business-logic)
7. [Security & Privacy](#security--privacy)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Overview

The Customer Management system handles three distinct user types and their interactions:

### User Types

1. **Guest Users** (Anonymous)
   - Can browse products
   - Can place orders without registration
   - Orders stored with email only
   - No password required
   - Session tracked via temporary token

2. **Registered Customers** (Authenticated)
   - Full account with password
   - Order history
   - Saved addresses
   - Profile management
   - Personalized experience

3. **Admin Users** (Staff)
   - Full customer management capabilities
   - Order management
   - Access to admin dashboard
   - Customer support functions

### Key Features

- **Guest Checkout:** Allow purchases without account creation
- **Seamless Conversion:** Link guest orders when user registers with same email
- **Order History Linking:** Automatic merge of guest orders into registered account
- **Single Sign-On Ready:** JWT-based authentication
- **Privacy Compliant:** GDPR/data protection ready

---

## Authentication System

### JWT Token Structure

All authenticated requests use JWT tokens in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Payload

```json
{
  "sub": "customer-uuid",
  "email": "customer@example.com",
  "type": "customer",
  "name": "John Doe",
  "status": "active",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### Token Types

| Token Type | Purpose | Expiry |
|------------|---------|--------|
| **Access Token** | API authentication | 24 hours |
| **Refresh Token** | Renew access token | 30 days |
| **Guest Token** | Track anonymous users | 7 days |
| **Email Verification Token** | Verify email address | 24 hours |
| **Password Reset Token** | Reset password | 1 hour |

### Authentication Flow

```
┌─────────────┐
│ Guest User  │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
  Browse/Shop    Place Order
       │              │
       │         ┌────┴────┐
       │         │ Email   │
       │         │ Captured│
       │         └────┬────┘
       │              │
       ▼              ▼
  Register     Link Guest Orders
       │              │
       └──────┬───────┘
              │
              ▼
    ┌──────────────────┐
    │ Registered User  │
    │ (All Orders)     │
    └──────────────────┘
```

---

## Guest vs Registered Users

### Guest Order Flow

**Step 1: Guest Places Order**
```json
POST /api/orders
{
  "customer": {
    "email": "guest@example.com",
    "name": "John Doe",
    "phone": "+92-300-1234567"
  },
  "items": [...],
  "shipping_address": {...},
  "guest": true
}
```

**Backend Action:**
- Check if email exists in customers table
- If NO: Create guest order with `customer_id = NULL`
- If YES: Link order to existing customer_id
- Store email in orders table

**Step 2: Guest Tries to Register Later**
```json
POST /api/auth/register
{
  "email": "guest@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Backend Action:**
1. Create customer account
2. Query orders table for matching email + `customer_id = NULL`
3. Update all matching orders with new `customer_id`
4. User now sees order history in account

### Data Structure

**Orders Table:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES customers(id),  -- NULL for guest orders
  customer_email VARCHAR(255) NOT NULL,       -- Always stored
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  guest_order BOOLEAN DEFAULT false,          -- Flag for guest orders
  guest_token VARCHAR(255),                   -- Temporary guest tracking
  -- ... other order fields
);

-- Index for guest order lookup
CREATE INDEX idx_orders_guest_email ON orders(customer_email) WHERE customer_id IS NULL;
```

**Customers Table:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                 -- NULL for guest-converted users until they set password
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  created_from_guest BOOLEAN DEFAULT false,   -- Track if account was auto-created from guest order
  -- ... other customer fields
);
```

---

## Data Models

### Customer Model

```typescript
interface Customer {
  // Identifiers
  id: string;                           // UUID
  email: string;                        // Unique, required

  // Authentication
  passwordHash?: string;                // Hashed password (NULL if created from guest order)
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;

  // Basic Information
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Location
  location?: string;                    // City, Country
  timezone?: string;
  language?: string;                    // Default: "en"

  // Status & Metrics
  status: "active" | "inactive" | "suspended";
  orders: number;                       // Total order count
  totalSpent: number;                   // Total lifetime value
  averageOrderValue: number;

  // Segmentation
  tags: string[];                       // ["VIP", "Cafe Regular", etc.]
  customerType?: "retail" | "wholesale" | "corporate";

  // Preferences
  marketingConsent: boolean;
  smsConsent: boolean;
  emailPreferences: {
    newsletter: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };

  // Account Origin
  createdFromGuest: boolean;            // True if account was auto-created from guest order
  registrationSource?: string;          // "web", "mobile", "admin", "guest_conversion"

  // Metadata
  notes?: string;                       // Admin notes
  lastLogin?: Date;
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;                     // Soft delete
}
```

### Customer Address Model

```typescript
interface CustomerAddress {
  id: string;                           // UUID
  customerId: string;

  // Address Details
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;                       // State/Province
  postalCode: string;
  country: string;                      // ISO country code

  // Contact
  phone?: string;

  // Flags
  isDefault: boolean;                   // Default shipping address
  isDefaultBilling: boolean;            // Default billing address

  // Metadata
  label?: string;                       // "Home", "Office", etc.
  createdAt: Date;
  updatedAt: Date;
}
```

### Guest Order Model

```typescript
interface GuestOrder {
  id: string;
  orderNumber: string;

  // Guest Information
  customerId: null;                     // NULL for guest orders
  customerEmail: string;                // Always captured
  customerName: string;
  customerPhone?: string;
  guestOrder: boolean;                  // true
  guestToken?: string;                  // Temporary session token

  // Order Details
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;

  // Shipping
  shippingAddress: Address;

  // Status
  paymentStatus: string;
  fulfillmentStatus: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Customer Statistics Model

```typescript
interface CustomerStatistics {
  customerId: string;

  // Order Metrics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;

  // Engagement
  lastOrderDate?: Date;
  daysSinceLastOrder?: number;
  orderFrequency: number;               // Orders per month

  // Product Preferences
  favoriteSection: "cafe" | "flowers" | "books";
  topProducts: {
    productId: string;
    productName: string;
    purchaseCount: number;
  }[];

  // Loyalty
  lifetimeValue: number;
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  rewardPoints?: number;

  // Timestamps
  customerSince: Date;
  lastUpdated: Date;
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register New Customer

**Endpoint:** `POST /api/auth/register`

**Public Access:** Yes (no authentication required)

**Request Body:**

```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+92-300-1234567",
  "marketingConsent": false
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "customer@example.com",
      "name": "John Doe",
      "emailVerified": false,
      "status": "active",
      "createdAt": "2025-11-21T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    },
    "guestOrdersLinked": 2
  },
  "message": "Registration successful. 2 previous orders have been linked to your account."
}
```

**Business Logic:**

1. **Email Validation**
   - Check if email already exists
   - If exists and has password → Return error
   - If exists without password (guest-converted) → Update with password

2. **Guest Order Linking**
   ```sql
   -- Find all guest orders with this email
   SELECT * FROM orders
   WHERE customer_email = $1
   AND customer_id IS NULL;

   -- Link to new customer
   UPDATE orders
   SET customer_id = $2, guest_order = false
   WHERE customer_email = $1
   AND customer_id IS NULL;
   ```

3. **Send Verification Email**
   - Generate email verification token
   - Send verification link
   - Token expires in 24 hours

4. **Update Customer Stats**
   - Calculate total orders (including linked guest orders)
   - Calculate total spent
   - Update `createdFromGuest` flag if orders were linked

**Error Responses:**

```json
// 400 Bad Request - Email already registered
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists. Please login."
  }
}

// 400 Bad Request - Weak password
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password does not meet security requirements",
    "details": {
      "requirements": [
        "Minimum 8 characters",
        "At least 1 uppercase letter",
        "At least 1 number",
        "At least 1 special character"
      ]
    }
  }
}
```

---

#### 2. Login

**Endpoint:** `POST /api/auth/login`

**Public Access:** Yes

**Request Body:**

```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "customer@example.com",
      "name": "John Doe",
      "phone": "+92-300-1234567",
      "status": "active",
      "emailVerified": true,
      "orders": 5,
      "totalSpent": 12500
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  },
  "message": "Login successful"
}
```

**Business Logic:**
1. Verify email exists
2. Verify password hash matches
3. Check account status (not suspended)
4. Update `lastLogin` timestamp
5. Generate JWT tokens
6. Return customer profile with tokens

**Error Responses:**

```json
// 401 Unauthorized - Invalid credentials
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

// 403 Forbidden - Account suspended
{
  "success": false,
  "error": {
    "code": "ACCOUNT_SUSPENDED",
    "message": "Your account has been suspended. Please contact support."
  }
}
```

---

#### 3. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Public Access:** Yes (requires refresh token)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

---

#### 4. Logout

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Business Logic:**
- Add refresh token to blacklist
- Clear session data
- Log logout event

---

#### 5. Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Public Access:** Yes

**Request Body:**

```json
{
  "email": "customer@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

**Business Logic:**
1. Check if email exists
2. Generate password reset token (1-hour expiry)
3. Send email with reset link
4. Always return success (prevent email enumeration)

**Email Content:**
```
Subject: Reset Your Password

Click the link below to reset your password:
https://trio.com/reset-password?token=abc123...

This link expires in 1 hour.

If you didn't request this, please ignore this email.
```

---

#### 6. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Public Access:** Yes (requires valid reset token)

**Request Body:**

```json
{
  "token": "password-reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid/expired token
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Password reset token is invalid or has expired. Please request a new reset link."
  }
}
```

---

#### 7. Verify Email

**Endpoint:** `POST /api/auth/verify-email`

**Public Access:** Yes (requires verification token)

**Request Body:**

```json
{
  "token": "email-verification-token"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Business Logic:**
1. Validate token
2. Check token not expired (24 hours)
3. Update `emailVerified = true`
4. Clear verification token
5. Send welcome email

---

#### 8. Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Rate Limit:** 1 request per 5 minutes per user

---

#### 9. Guest Token Generation

**Endpoint:** `POST /api/auth/guest-token`

**Public Access:** Yes

**Request Body:**

```json
{
  "deviceId": "optional-device-identifier"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "guestToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**Use Case:** Generate temporary token for guest users to track cart/session

---

### Customer Management

#### 10. Get Customer Profile

**Endpoint:** `GET /api/customers/me`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "customer@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+92-300-1234567",
      "location": "Karachi, Pakistan",
      "status": "active",
      "emailVerified": true,
      "orders": 5,
      "totalSpent": 12500,
      "averageOrderValue": 2500,
      "tags": ["VIP", "Cafe Regular"],
      "customerType": "retail",
      "marketingConsent": true,
      "emailPreferences": {
        "newsletter": true,
        "orderUpdates": true,
        "promotions": false
      },
      "createdAt": "2025-01-15T10:30:00Z",
      "lastOrderDate": "2025-11-18T14:20:00Z"
    },
    "statistics": {
      "daysSinceLastOrder": 3,
      "orderFrequency": 1.5,
      "favoriteSection": "cafe",
      "loyaltyTier": "gold",
      "rewardPoints": 1250
    }
  }
}
```

---

#### 11. Update Customer Profile

**Endpoint:** `PUT /api/customers/me`

**Authentication:** Required

**Request Body:** (All fields optional)

```json
{
  "name": "John Smith",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+92-300-9876543",
  "location": "Lahore, Pakistan",
  "language": "en",
  "timezone": "Asia/Karachi"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Smith",
      "phone": "+92-300-9876543",
      "updatedAt": "2025-11-21T10:30:00Z"
    }
  },
  "message": "Profile updated successfully"
}
```

**Validation:**
- Email cannot be changed via this endpoint (use separate email change flow)
- Phone number format validation
- Name minimum 2 characters

---

#### 12. Change Email

**Endpoint:** `POST /api/customers/me/change-email`

**Authentication:** Required

**Request Body:**

```json
{
  "newEmail": "newemail@example.com",
  "password": "CurrentPassword123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "A verification email has been sent to newemail@example.com. Please verify to complete the email change."
}
```

**Business Logic:**
1. Verify current password
2. Check new email not already in use
3. Send verification email to new address
4. Store pending email change in database
5. Update email only after verification
6. Migrate all orders to new email

---

#### 13. Change Password

**Endpoint:** `POST /api/customers/me/change-password`

**Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Business Logic:**
1. Verify current password
2. Validate new password meets requirements
3. Hash new password
4. Update password hash
5. Invalidate all refresh tokens (force re-login on other devices)
6. Send email notification of password change

---

#### 14. Update Email Preferences

**Endpoint:** `PUT /api/customers/me/preferences`

**Authentication:** Required

**Request Body:**

```json
{
  "marketingConsent": true,
  "smsConsent": false,
  "emailPreferences": {
    "newsletter": true,
    "orderUpdates": true,
    "promotions": false
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

---

#### 15. Delete Account

**Endpoint:** `DELETE /api/customers/me`

**Authentication:** Required

**Request Body:**

```json
{
  "password": "CurrentPassword123!",
  "reason": "optional-deletion-reason"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Your account has been scheduled for deletion. You have 30 days to cancel this request."
}
```

**Business Logic:**
1. Verify password
2. Soft delete (set `deletedAt` timestamp)
3. Schedule permanent deletion after 30 days
4. Anonymize personal data but keep order history (GDPR compliance)
5. Send confirmation email with cancellation link
6. Revoke all tokens

---

### Address Management

#### 16. List Customer Addresses

**Endpoint:** `GET /api/customers/me/addresses`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "addr-001",
        "firstName": "John",
        "lastName": "Doe",
        "company": "Acme Corp",
        "addressLine1": "123 Main Street",
        "addressLine2": "Apt 4B",
        "city": "Karachi",
        "state": "Sindh",
        "postalCode": "75500",
        "country": "PK",
        "phone": "+92-300-1234567",
        "isDefault": true,
        "isDefaultBilling": true,
        "label": "Home",
        "createdAt": "2025-01-15T10:30:00Z"
      },
      {
        "id": "addr-002",
        "firstName": "John",
        "lastName": "Doe",
        "addressLine1": "456 Business Ave",
        "city": "Lahore",
        "state": "Punjab",
        "postalCode": "54000",
        "country": "PK",
        "phone": "+92-300-1234567",
        "isDefault": false,
        "isDefaultBilling": false,
        "label": "Office",
        "createdAt": "2025-02-20T14:20:00Z"
      }
    ]
  }
}
```

---

#### 17. Create Address

**Endpoint:** `POST /api/customers/me/addresses`

**Authentication:** Required

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Karachi",
  "state": "Sindh",
  "postalCode": "75500",
  "country": "PK",
  "phone": "+92-300-1234567",
  "isDefault": false,
  "label": "Home"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "address": {
      "id": "addr-003",
      "firstName": "John",
      "lastName": "Doe",
      "addressLine1": "123 Main Street",
      "city": "Karachi",
      "isDefault": false,
      "createdAt": "2025-11-21T10:30:00Z"
    }
  },
  "message": "Address created successfully"
}
```

**Validation:**
- firstName, lastName: Required, 2-100 characters
- addressLine1: Required, max 255 characters
- city: Required, max 100 characters
- postalCode: Required, format validation by country
- country: Required, valid ISO code
- If `isDefault = true`, unset default flag on other addresses

---

#### 18. Update Address

**Endpoint:** `PUT /api/customers/me/addresses/:addressId`

**Authentication:** Required

**Request Body:** (All fields optional)

```json
{
  "addressLine1": "789 New Street",
  "city": "Islamabad",
  "isDefault": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "address": {
      "id": "addr-003",
      "addressLine1": "789 New Street",
      "city": "Islamabad",
      "isDefault": true,
      "updatedAt": "2025-11-21T10:35:00Z"
    }
  },
  "message": "Address updated successfully"
}
```

---

#### 19. Delete Address

**Endpoint:** `DELETE /api/customers/me/addresses/:addressId`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Business Logic:**
- Cannot delete if it's the only address
- If deleting default address, automatically set another address as default
- Check address not used in pending orders

---

#### 20. Set Default Address

**Endpoint:** `POST /api/customers/me/addresses/:addressId/set-default`

**Authentication:** Required

**Query Parameters:**
- `type` (string, optional) - "shipping" or "billing" (default: "shipping")

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Default shipping address updated"
}
```

---

### Order History

#### 21. Get Customer Orders

**Endpoint:** `GET /api/customers/me/orders`

**Authentication:** Required

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `status` (string) - Filter by payment/fulfillment status
- `section` (string) - Filter by section: cafe, flowers, books
- `dateFrom` (date) - Filter orders from date
- `dateTo` (date) - Filter orders to date

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord-001",
        "orderNumber": "ORD-2025-001",
        "date": "2025-11-18T14:20:00Z",
        "section": "cafe",
        "items": 3,
        "total": 1200,
        "paymentStatus": "paid",
        "fulfillmentStatus": "fulfilled",
        "shippingAddress": {
          "addressLine1": "123 Main Street",
          "city": "Karachi",
          "country": "PK"
        },
        "itemsPreview": [
          {
            "productName": "Cappuccino",
            "quantity": 2,
            "price": 350
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "totalOrders": 45
    },
    "summary": {
      "totalOrders": 45,
      "totalSpent": 112500,
      "averageOrderValue": 2500
    }
  }
}
```

**Business Logic:**
- Include all orders (both placed as registered user AND linked guest orders)
- Sort by date descending (most recent first)
- Return summary statistics

---

#### 22. Get Single Order Detail

**Endpoint:** `GET /api/customers/me/orders/:orderId`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord-001",
      "orderNumber": "ORD-2025-001",
      "date": "2025-11-18T14:20:00Z",
      "section": "cafe",
      "paymentStatus": "paid",
      "fulfillmentStatus": "fulfilled",
      "items": [
        {
          "id": "item-001",
          "productId": "550e8400-e29b-41d4-a716-446655440001",
          "productName": "Cappuccino",
          "sku": "CAF-CAP-001",
          "quantity": 2,
          "price": 350,
          "subtotal": 700,
          "image": "https://cdn.trio.com/products/cappuccino-thumb.jpg"
        }
      ],
      "subtotal": 1000,
      "tax": 100,
      "shipping": 100,
      "total": 1200,
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "addressLine1": "123 Main Street",
        "city": "Karachi",
        "state": "Sindh",
        "postalCode": "75500",
        "country": "PK"
      },
      "trackingNumber": "TRK123456789",
      "estimatedDelivery": "2025-11-25T00:00:00Z",
      "statusHistory": [
        {
          "status": "placed",
          "timestamp": "2025-11-18T14:20:00Z"
        },
        {
          "status": "paid",
          "timestamp": "2025-11-18T14:21:00Z"
        },
        {
          "status": "fulfilled",
          "timestamp": "2025-11-19T10:30:00Z"
        }
      ]
    }
  }
}
```

**Authorization:**
- Verify order belongs to authenticated customer
- Return 403 if trying to access another customer's order

---

#### 23. Reorder

**Endpoint:** `POST /api/customers/me/orders/:orderId/reorder`

**Authentication:** Required

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "cart": {
      "items": [
        {
          "productId": "550e8400-e29b-41d4-a716-446655440001",
          "quantity": 2
        }
      ]
    }
  },
  "message": "Items added to cart successfully"
}
```

**Business Logic:**
1. Fetch original order items
2. Verify products still available
3. Add items to customer's cart
4. Update prices to current prices (not historical)
5. Flag any unavailable items

---

### Guest Conversion

#### 24. Link Guest Orders (Manual)

**Endpoint:** `POST /api/customers/me/link-guest-orders`

**Authentication:** Required

**Request Body:**

```json
{
  "email": "alternative@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "ordersLinked": 3,
    "orders": [
      {
        "orderNumber": "ORD-2025-042",
        "date": "2025-10-15T10:00:00Z",
        "total": 850
      },
      {
        "orderNumber": "ORD-2025-053",
        "date": "2025-11-02T14:30:00Z",
        "total": 1200
      }
    ]
  },
  "message": "3 orders have been linked to your account"
}
```

**Use Case:** If user registered with different email than they used for guest orders

**Business Logic:**
1. Verify email ownership (send verification code)
2. Find orders with that email where `customer_id = NULL`
3. Link to current customer
4. Update order statistics

---

#### 25. Check Guest Orders

**Endpoint:** `POST /api/orders/guest/lookup`

**Public Access:** Yes

**Request Body:**

```json
{
  "email": "guest@example.com",
  "orderNumber": "ORD-2025-042"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "order": {
      "orderNumber": "ORD-2025-042",
      "date": "2025-11-10T10:00:00Z",
      "total": 850,
      "paymentStatus": "paid",
      "fulfillmentStatus": "fulfilled",
      "trackingNumber": "TRK987654321"
    },
    "hasAccount": false,
    "message": "Create an account with this email to track all your orders in one place!"
  }
}
```

**Use Case:** Allow guest users to look up their orders

**Business Logic:**
- Verify email + order number combination
- Return limited order details (no admin notes, etc.)
- Suggest account creation if `customer_id = NULL`

---

### Admin Customer Management

#### 26. List All Customers (Admin)

**Endpoint:** `GET /api/admin/customers`

**Authentication:** Required (Admin only)

**Permission:** `customers:read`

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `search` (string) - Search by name, email, phone
- `status` (string) - Filter by status
- `tags` (string) - Comma-separated tags
- `sortBy` (string) - Sort field
- `sortOrder` (string) - asc or desc

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe",
        "email": "customer@example.com",
        "phone": "+92-300-1234567",
        "location": "Karachi, Pakistan",
        "orders": 5,
        "totalSpent": 12500,
        "status": "active",
        "tags": ["VIP", "Cafe Regular"],
        "createdAt": "2025-01-15T10:30:00Z",
        "lastOrderDate": "2025-11-18T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 15,
      "totalCustomers": 284
    },
    "statistics": {
      "totalCustomers": 284,
      "activeCustomers": 256,
      "inactiveCustomers": 28,
      "totalOrders": 1842,
      "totalRevenue": 4620000
    }
  }
}
```

---

#### 27. Get Customer Details (Admin)

**Endpoint:** `GET /api/admin/customers/:customerId`

**Authentication:** Required (Admin only)

**Permission:** `customers:read`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "customer@example.com",
      "name": "John Doe",
      "phone": "+92-300-1234567",
      "location": "Karachi, Pakistan",
      "status": "active",
      "emailVerified": true,
      "orders": 5,
      "totalSpent": 12500,
      "averageOrderValue": 2500,
      "tags": ["VIP", "Cafe Regular"],
      "notes": "Prefers almond milk",
      "createdFromGuest": false,
      "lastLogin": "2025-11-20T09:15:00Z",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "statistics": {
      "daysSinceLastOrder": 3,
      "orderFrequency": 1.5,
      "favoriteSection": "cafe",
      "loyaltyTier": "gold"
    },
    "recentOrders": [
      {
        "orderNumber": "ORD-2025-123",
        "date": "2025-11-18T14:20:00Z",
        "total": 1200,
        "status": "fulfilled"
      }
    ],
    "addresses": [
      {
        "id": "addr-001",
        "addressLine1": "123 Main Street",
        "city": "Karachi",
        "isDefault": true
      }
    ]
  }
}
```

---

#### 28. Create Customer (Admin)

**Endpoint:** `POST /api/admin/customers`

**Authentication:** Required (Admin only)

**Permission:** `customers:write`

**Request Body:**

```json
{
  "email": "newcustomer@example.com",
  "name": "Jane Smith",
  "phone": "+92-300-9876543",
  "location": "Lahore, Pakistan",
  "status": "active",
  "tags": ["Corporate"],
  "notes": "Large volume orders",
  "sendWelcomeEmail": false
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440099",
      "email": "newcustomer@example.com",
      "name": "Jane Smith",
      "status": "active",
      "createdAt": "2025-11-21T10:30:00Z"
    }
  },
  "message": "Customer created successfully"
}
```

**Business Logic:**
- Admin can create customers without password
- Customer can claim account later by requesting password reset
- Optionally send invitation email

---

#### 29. Update Customer (Admin)

**Endpoint:** `PUT /api/admin/customers/:customerId`

**Authentication:** Required (Admin only)

**Permission:** `customers:write`

**Request Body:**

```json
{
  "name": "John Smith",
  "phone": "+92-300-1111111",
  "status": "inactive",
  "tags": ["VIP", "Cafe Regular", "Birthday-March"],
  "notes": "Updated notes about preferences"
}
```

**Response:** `200 OK`

---

#### 30. Delete Customer (Admin)

**Endpoint:** `DELETE /api/admin/customers/:customerId`

**Authentication:** Required (Admin only)

**Permission:** `customers:delete`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

**Business Logic:**
- Soft delete by default
- Cannot delete if customer has pending orders
- Anonymize personal data
- Keep order history for records

---

#### 31. Add Customer Note (Admin)

**Endpoint:** `POST /api/admin/customers/:customerId/notes`

**Authentication:** Required (Admin only)

**Permission:** `customers:write`

**Request Body:**

```json
{
  "note": "Customer called about delivery preferences"
}
```

**Response:** `201 Created`

---

#### 32. Export Customers (Admin)

**Endpoint:** `GET /api/admin/customers/export`

**Authentication:** Required (Admin only)

**Permission:** `customers:read`

**Query Parameters:**
- `format` (string) - csv, json, xlsx (default: csv)
- All filter parameters from List Customers

**Response:** File download

```csv
id,name,email,phone,location,orders,total_spent,status,created_at
550e8400-e29b-41d4-a716-446655440001,John Doe,customer@example.com,+92-300-1234567,Karachi,5,12500,active,2025-01-15
...
```

---

## Business Logic

### Guest Order Linking Algorithm

```javascript
async function linkGuestOrders(customerId, email) {
  // Find all guest orders with matching email
  const guestOrders = await db.orders.findMany({
    where: {
      customerEmail: email,
      customerId: null,
      guestOrder: true
    }
  });

  if (guestOrders.length === 0) {
    return { ordersLinked: 0, orders: [] };
  }

  // Update all guest orders with customer ID
  await db.orders.updateMany({
    where: {
      customerEmail: email,
      customerId: null
    },
    data: {
      customerId: customerId,
      guestOrder: false
    }
  });

  // Recalculate customer statistics
  const totalOrders = await db.orders.count({
    where: { customerId: customerId }
  });

  const totalSpent = await db.orders.aggregate({
    where: { customerId: customerId },
    _sum: { total: true }
  });

  await db.customers.update({
    where: { id: customerId },
    data: {
      orders: totalOrders,
      totalSpent: totalSpent._sum.total,
      createdFromGuest: true
    }
  });

  return {
    ordersLinked: guestOrders.length,
    orders: guestOrders
  };
}
```

### Customer Statistics Calculation

```javascript
async function calculateCustomerStatistics(customerId) {
  const orders = await db.orders.findMany({
    where: { customerId: customerId },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const lastOrderDate = orders[0]?.createdAt;
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
    : null;

  const firstOrderDate = orders[orders.length - 1]?.createdAt;
  const daysSinceFirstOrder = firstOrderDate
    ? Math.floor((Date.now() - firstOrderDate) / (1000 * 60 * 60 * 24))
    : 0;

  const orderFrequency = daysSinceFirstOrder > 0
    ? (totalOrders / daysSinceFirstOrder) * 30  // Orders per month
    : 0;

  // Favorite section
  const sectionCounts = {};
  orders.forEach(order => {
    sectionCounts[order.section] = (sectionCounts[order.section] || 0) + 1;
  });
  const favoriteSection = Object.keys(sectionCounts).reduce((a, b) =>
    sectionCounts[a] > sectionCounts[b] ? a : b, 'cafe'
  );

  // Loyalty tier
  let loyaltyTier = 'bronze';
  if (totalSpent >= 50000) loyaltyTier = 'platinum';
  else if (totalSpent >= 25000) loyaltyTier = 'gold';
  else if (totalSpent >= 10000) loyaltyTier = 'silver';

  return {
    totalOrders,
    totalSpent,
    averageOrderValue,
    lastOrderDate,
    daysSinceLastOrder,
    orderFrequency,
    favoriteSection,
    loyaltyTier
  };
}
```

### Email Verification Flow

```javascript
async function sendVerificationEmail(email, name, customerId) {
  // Generate verification token
  const token = generateSecureToken();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store token in database
  await db.customers.update({
    where: { id: customerId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiry: expiry
    }
  });

  // Send email
  const verificationUrl = `https://trio.com/verify-email?token=${token}`;

  await emailService.send({
    to: email,
    subject: 'Verify Your Email - TRIO',
    html: `
      <h2>Welcome to TRIO, ${name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  });
}

async function verifyEmail(token) {
  const customer = await db.customers.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: { gt: new Date() }
    }
  });

  if (!customer) {
    throw new Error('Invalid or expired verification token');
  }

  await db.customers.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null
    }
  });

  return customer;
}
```

---

## Security & Privacy

### Password Security

**Hashing Algorithm:** bcrypt with salt rounds = 12

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

### JWT Token Security

**Token Storage:**
- Access Token: Store in memory (not localStorage)
- Refresh Token: Store in httpOnly cookie

**Token Rotation:**
- Rotate refresh tokens on each use
- Invalidate old refresh tokens

**Token Blacklisting:**
```javascript
// Add to Redis blacklist on logout
async function blacklistToken(token) {
  const decoded = jwt.decode(token);
  const expiry = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`blacklist:${token}`, expiry, '1');
}

// Check if token is blacklisted
async function isTokenBlacklisted(token) {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
}
```

### Data Privacy (GDPR Compliance)

**Right to Access:**
- Endpoint: `GET /api/customers/me/data-export`
- Returns all customer data in JSON format

**Right to Deletion:**
- Endpoint: `DELETE /api/customers/me`
- 30-day grace period before permanent deletion
- Anonymize data after deletion

**Right to Rectification:**
- Endpoint: `PUT /api/customers/me`
- Allow customers to update their data

**Data Minimization:**
- Only collect necessary data
- Clear purpose for each data field
- Regular data audits

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5 requests | 15 minutes |
| `POST /api/auth/register` | 3 requests | 1 hour |
| `POST /api/auth/forgot-password` | 3 requests | 1 hour |
| `POST /api/auth/resend-verification` | 1 request | 5 minutes |
| `GET /api/customers/me` | 100 requests | 1 minute |

### Security Headers

```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_EXISTS` | 400 | Email already registered |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended by admin |
| `INVALID_TOKEN` | 401 | Invalid/expired JWT token |
| `INVALID_RESET_TOKEN` | 400 | Invalid password reset token |
| `CUSTOMER_NOT_FOUND` | 404 | Customer doesn't exist |
| `ADDRESS_NOT_FOUND` | 404 | Address doesn't exist |
| `ORDER_NOT_FOUND` | 404 | Order doesn't exist |
| `UNAUTHORIZED_ACCESS` | 403 | Accessing another customer's resource |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

---

## Examples

### Example 1: Complete Registration Flow

**Step 1: Guest places order**

```http
POST /api/orders
Content-Type: application/json

{
  "customer": {
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+92-300-1234567"
  },
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "Karachi",
    "postalCode": "75500",
    "country": "PK"
  },
  "guest": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord-001",
      "orderNumber": "ORD-2025-001",
      "total": 700,
      "guestOrder": true
    }
  },
  "message": "Order placed successfully. Create an account to track your orders!"
}
```

**Step 2: Guest registers (1 week later)**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+92-300-1234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "john@example.com",
      "name": "John Doe",
      "orders": 1,
      "totalSpent": 700
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "guestOrdersLinked": 1
  },
  "message": "Registration successful. 1 previous order has been linked to your account."
}
```

**Step 3: View order history**

```http
GET /api/customers/me/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderNumber": "ORD-2025-001",
        "date": "2025-11-14T10:00:00Z",
        "total": 700,
        "status": "fulfilled",
        "wasGuestOrder": true
      }
    ]
  }
}
```

---

### Example 2: Password Reset Flow

**Step 1: Request reset**

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

**Step 2: User receives email with token**

```
Subject: Reset Your Password

Click here to reset your password:
https://trio.com/reset-password?token=abc123def456...

This link expires in 1 hour.
```

**Step 3: Reset password**

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

---

### Example 3: Admin Creates Customer

```http
POST /api/admin/customers
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "corporate@company.com",
  "name": "Jane Smith",
  "phone": "+92-300-9999999",
  "location": "Islamabad, Pakistan",
  "status": "active",
  "tags": ["Corporate", "Bulk Orders"],
  "notes": "Large volume customer, net-30 payment terms",
  "sendWelcomeEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440099",
      "email": "corporate@company.com",
      "name": "Jane Smith",
      "status": "active",
      "createdAt": "2025-11-21T10:30:00Z"
    }
  },
  "message": "Customer created successfully. Welcome email sent."
}
```

---

## Database Schema

### Customers Table

```sql
CREATE TABLE customers (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,

  -- Authentication
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expiry TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expiry TIMESTAMP,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),

  -- Location
  location VARCHAR(255),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',

  -- Status & Metrics
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,

  -- Segmentation
  tags TEXT[],
  customer_type VARCHAR(20),

  -- Preferences
  marketing_consent BOOLEAN DEFAULT false,
  sms_consent BOOLEAN DEFAULT false,
  email_preferences JSONB DEFAULT '{"newsletter": true, "orderUpdates": true, "promotions": false}',

  -- Account Origin
  created_from_guest BOOLEAN DEFAULT false,
  registration_source VARCHAR(50),

  -- Metadata
  notes TEXT,
  last_login TIMESTAMP,
  last_order_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
```

### Customer Addresses Table

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Address Details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(255),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL,

  -- Contact
  phone VARCHAR(50),

  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_default_billing BOOLEAN DEFAULT false,

  -- Metadata
  label VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_addresses_default ON customer_addresses(customer_id, is_default);
```

### Orders Table (Guest Support)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Customer Link (NULL for guest orders)
  customer_id UUID REFERENCES customers(id),

  -- Always Store Email (for guest linking)
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Guest Tracking
  guest_order BOOLEAN DEFAULT false,
  guest_token VARCHAR(255),

  -- Order Details
  section VARCHAR(20) NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Status
  payment_status VARCHAR(20) DEFAULT 'pending',
  fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled',

  -- Shipping
  shipping_address JSONB NOT NULL,
  tracking_number VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for guest order lookup
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_guest_email ON orders(customer_email) WHERE customer_id IS NULL;
CREATE INDEX idx_orders_guest_token ON orders(guest_token);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_customer ON refresh_tokens(customer_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Testing Checklist

### Authentication Tests

- [ ] Register new customer
- [ ] Register with existing email (should fail)
- [ ] Register with weak password (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Refresh access token
- [ ] Logout and verify token invalidated
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with expired token (should fail)
- [ ] Verify email with valid token
- [ ] Verify email with expired token (should fail)

### Guest Order Flow Tests

- [ ] Place order as guest
- [ ] Register with same email as guest order
- [ ] Verify guest order appears in order history
- [ ] Place multiple guest orders with same email
- [ ] Register and verify all orders linked
- [ ] Guest order lookup without account

### Customer Management Tests

- [ ] Get customer profile
- [ ] Update customer profile
- [ ] Change email (with verification)
- [ ] Change password
- [ ] Update email preferences
- [ ] Delete account (soft delete)
- [ ] Cancel account deletion within 30 days

### Address Management Tests

- [ ] Create new address
- [ ] List all addresses
- [ ] Update address
- [ ] Delete address
- [ ] Set default address
- [ ] Cannot delete only address

### Admin Tests

- [ ] List all customers
- [ ] Search customers
- [ ] Filter customers by status/tags
- [ ] Create customer manually
- [ ] Update customer details
- [ ] Add admin notes
- [ ] Delete customer
- [ ] Export customers to CSV

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-21 | Initial Customer Management API documentation |

---

**End of Customer Management & Authentication API Documentation**
