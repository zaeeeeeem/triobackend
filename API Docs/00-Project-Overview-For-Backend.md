# TRIO - Shopify Admin Panel
## Complete Project Overview for Backend Engineers

**Version:** 1.0.0
**Last Updated:** November 19, 2025
**Project Status:** Frontend Complete | Backend Required
**Target Database:** PostgreSQL (Recommended) / MySQL / MongoDB

---

## Table of Contents

1. [Project Introduction](#project-introduction)
2. [Business Context](#business-context)
3. [Technical Stack](#technical-stack)
4. [System Architecture](#system-architecture)
5. [Module Overview](#module-overview)
6. [Database Schema Requirements](#database-schema-requirements)
7. [API Requirements Summary](#api-requirements-summary)
8. [Authentication & Authorization](#authentication--authorization)
9. [File Upload Requirements](#file-upload-requirements)
10. [Third-Party Integrations](#third-party-integrations)
11. [Backend Development Priorities](#backend-development-priorities)
12. [Deployment Architecture](#deployment-architecture)
13. [Performance Requirements](#performance-requirements)
14. [Security Requirements](#security-requirements)
15. [Testing Requirements](#testing-requirements)
16. [Development Timeline](#development-timeline)

---

## Project Introduction

### What is TRIO?

TRIO is a multi-section e-commerce business operating three distinct product categories under one unified platform:

1. **☕ Cafe** - Coffee, tea, pastries, desserts, and cafe items
2. **🌸 Flowers** - Bouquets, arrangements, and floral designs
3. **📚 Books** - Fiction, non-fiction, biography, self-help books

### Project Goal

Build a comprehensive admin panel (similar to Shopify) that allows TRIO staff to manage all three business sections from a single unified interface. The frontend is **100% complete** and needs a robust backend API to function.

### Current Status

✅ **Frontend:** Complete (Next.js 15, TypeScript, Tailwind CSS)
🔄 **Backend:** Not Started (Your Responsibility)
📊 **Data:** Mock data in frontend (needs to be moved to database)
🎨 **Design:** Shopify-inspired, production-ready UI

---

## Business Context

### Target Users

1. **Admin Users**
   - Full access to all features
   - Can manage orders, products, inventory, customers
   - Can configure store settings
   - Can view analytics and reports

2. **Manager Users**
   - Section-specific access (Cafe OR Flowers OR Books)
   - Can manage orders and inventory for their section
   - Can view customers
   - Cannot modify store settings

3. **Staff Users**
   - Read-only access
   - Can view orders and products
   - Can update order statuses
   - Cannot create/delete records

### Business Operations

**Daily Operations:**
- Process 50-100 orders per day across all sections
- Manage 500+ products (200 cafe, 150 flowers, 150 books)
- Track inventory across multiple locations
- Handle customer inquiries and order updates
- Issue gift cards and manage discounts
- Create purchase orders for suppliers

**Peak Times:**
- Holidays (Eid, Christmas, Valentine's Day)
- Weekend mornings (cafe)
- Event seasons (weddings for flowers)

**Business Rules:**
- Multi-currency support: Pakistani Rupees (Rs) primary
- Tax rate: 18% (Pakistan GST)
- Same-day delivery available for cafe and flowers
- Book orders typically ship within 2-3 days
- Gift cards valid for 1 year
- Inventory tracked per location

---

## Technical Stack

### Frontend (Already Built)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.0.3 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.6.3 | Type safety |
| **Tailwind CSS** | 3.4.14 | Styling |
| **Lucide React** | 0.454.0 | Icons (2000+ icons) |
| **Recharts** | 3.4.1 | Charts and analytics |
| **clsx** | 2.1.1 | Class name utilities |
| **tailwind-merge** | 2.5.4 | Tailwind class merging |

**Total Files:** 66+ TypeScript/TSX files
**Lines of Code:** ~8,000 lines
**Components:** 44 components
**Pages:** 16 routes

### Backend (To Be Built)

**Recommended Stack:**

#### Node.js (Recommended)
```
- Runtime: Node.js 20+
- Framework: Express.js / Fastify / NestJS
- ORM: Prisma / TypeORM / Sequelize
- Database: PostgreSQL 15+
- Auth: JWT with refresh tokens
- File Storage: AWS S3 / Cloudinary
- Email: SendGrid / AWS SES
- Cache: Redis
- Queue: Bull / BullMQ
```
---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 15)                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Orders     │  │   Products   │  │  Inventory   │      │
│  │   Module     │  │   Module     │  │   Module     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Customers   │  │ Gift Cards   │  │  Analytics   │      │
│  │   Module     │  │   Module     │  │   Module     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Server(s)                    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Orders     │  │   Products   │  │  Inventory   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Customers   │  │ Gift Cards   │  │  Analytics   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │   AWS S3     │
│   Database   │    │    Cache     │    │ File Storage │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────┐
│   Database   │    │  Background  │
│   Backups    │    │    Jobs      │
└──────────────┘    └──────────────┘
```

### API Architecture Pattern

**Recommended: RESTful API with Resource-Based URLs**

```
/api/v1/
├── /auth
│   ├── POST   /login
│   ├── POST   /register
│   ├── POST   /refresh
│   └── POST   /logout
├── /orders
│   ├── GET    /orders
│   ├── POST   /orders
│   ├── GET    /orders/:id
│   ├── PUT    /orders/:id
│   └── DELETE /orders/:id
├── /products
│   ├── GET    /products
│   ├── POST   /products
│   ├── GET    /products/:id
│   └── ...
└── /analytics
    ├── GET    /analytics/revenue
    ├── GET    /analytics/orders
    └── ...
```

---

## Module Overview

### Summary of All Modules

| # | Module | Pages | API Endpoints | Priority | Status |
|---|--------|-------|---------------|----------|--------|
| 1 | **Order Management** | 4 | 10 | 🔴 Critical | ✅ Documented |
| 2 | **Product Management** | 3 | 12 | 🔴 Critical | 🔄 Pending |
| 3 | **Inventory Management** | 1 | 8 | 🔴 Critical | 🔄 Pending |
| 4 | **Customer Management** | 2 | 8 | 🟡 High | 🔄 Pending |
| 5 | **Purchase Orders** | 1 | 7 | 🟡 High | 🔄 Pending |
| 6 | **Gift Cards** | 1 | 6 | 🟢 Medium | 🔄 Pending |
| 7 | **Discounts** | 1 | 6 | 🟢 Medium | 🔄 Pending |
| 8 | **Analytics** | 1 | 5 | 🟡 High | 🔄 Pending |
| 9 | **Settings** | 1 | 4 | 🟢 Medium | 🔄 Pending |
| 10 | **Authentication** | - | 5 | 🔴 Critical | 🔄 Pending |

**Total API Endpoints Required:** ~71 endpoints

---

## Module Breakdown

### 1. 📦 Order Management Module

**Status:** ✅ Documentation Complete ([View Docs](./01-Order-Management-API.md))

**Features:**
- Create, read, update, delete orders
- Payment status tracking (paid, pending, refunded, failed)
- Fulfillment status tracking (fulfilled, unfulfilled, partial, scheduled)
- Order search and filtering
- CSV export
- Order statistics
- Multi-section support (cafe, flowers, books)

**Frontend Pages:**
- `/orders` - Orders list with filters
- `/orders/new` - Create new order
- `/orders/[id]` - Order detail view

**API Endpoints:** 10 endpoints
- GET `/api/orders` - List orders with filters
- POST `/api/orders` - Create order
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id` - Update order
- PATCH `/api/orders/:id/payment-status` - Update payment
- PATCH `/api/orders/:id/fulfillment-status` - Update fulfillment
- DELETE `/api/orders/:id` - Delete order
- GET `/api/orders/export` - Export to CSV
- GET `/api/orders/stats` - Get statistics
- POST `/api/orders/:id/duplicate` - Duplicate order

**Database Tables Required:**
- `orders`
- `order_items`
- `shipping_addresses`

---

### 2. 🏷️ Product Management Module

**Features:**
- Multi-section products (Cafe, Flowers, Books)
- Product variants (size, color, type)
- Image management (multiple images per product)
- SKU tracking
- Price management
- Product availability status
- Category/collection assignment
- Section-specific attributes:
  - **Cafe:** Temperature options, caffeine content, ingredients, allergens, calories
  - **Flowers:** Flower types, colors, arrangement type, stem count, care instructions
  - **Books:** ISBN, author, publisher, genre, format, condition

**Frontend Pages:**
- `/products` - Products list (all sections with tabs)
- `/products/new` - Create new product
- `/products/[id]` - Product detail/edit view

**API Endpoints Required:** ~12 endpoints
- GET `/api/products` - List products (with section filter)
- POST `/api/products` - Create product
- GET `/api/products/:id` - Get product details
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product
- GET `/api/products/:id/variants` - Get product variants
- POST `/api/products/:id/variants` - Add variant
- PUT `/api/products/:id/variants/:variantId` - Update variant
- DELETE `/api/products/:id/variants/:variantId` - Delete variant
- POST `/api/products/:id/images` - Upload images
- DELETE `/api/products/:id/images/:imageId` - Delete image
- GET `/api/products/search` - Search products

**Database Tables Required:**
- `products`
- `product_variants`
- `product_images`
- `product_categories`
- `cafe_product_details`
- `flowers_product_details`
- `books_product_details`

---

### 3. 📊 Inventory Management Module

**Features:**
- Real-time stock tracking
- Multiple location support
- Reorder points and quantities
- Stock adjustments (add, remove, transfer)
- Low stock alerts
- Stock history/audit trail
- Supplier information
- Cost price vs selling price

**Frontend Pages:**
- `/inventory` - Inventory list with filters and alerts

**API Endpoints Required:** ~8 endpoints
- GET `/api/inventory` - List inventory items
- GET `/api/inventory/:id` - Get inventory details
- POST `/api/inventory/adjust` - Adjust stock
- GET `/api/inventory/alerts` - Get low stock alerts
- GET `/api/inventory/history/:id` - Get stock history
- POST `/api/inventory/transfer` - Transfer between locations
- GET `/api/inventory/locations` - Get all locations
- GET `/api/inventory/stats` - Get inventory statistics

**Database Tables Required:**
- `inventory_items`
- `inventory_locations`
- `inventory_adjustments`
- `inventory_transfers`

---

### 4. 👥 Customer Management Module

**Features:**
- Customer profiles
- Contact information
- Order history
- Total spending tracking
- Customer status (active/inactive)
- Customer tags
- Notes
- Email communication

**Frontend Pages:**
- `/customers` - Customer list
- `/customers/new` - Add new customer

**API Endpoints Required:** ~8 endpoints
- GET `/api/customers` - List customers
- POST `/api/customers` - Create customer
- GET `/api/customers/:id` - Get customer details
- PUT `/api/customers/:id` - Update customer
- DELETE `/api/customers/:id` - Delete customer
- GET `/api/customers/:id/orders` - Get customer orders
- POST `/api/customers/:id/tags` - Add tags
- GET `/api/customers/search` - Search customers

**Database Tables Required:**
- `customers`
- `customer_tags`
- `customer_notes`

---

### 5. 📋 Purchase Orders Module

**Features:**
- Create purchase orders to suppliers
- Track order status (draft, pending, ordered, receiving, received, cancelled)
- Receive stock (full or partial)
- Link to inventory
- Cost tracking
- Expected delivery dates

**Frontend Pages:**
- `/purchase-orders` - PO list

**API Endpoints Required:** ~7 endpoints
- GET `/api/purchase-orders` - List POs
- POST `/api/purchase-orders` - Create PO
- GET `/api/purchase-orders/:id` - Get PO details
- PUT `/api/purchase-orders/:id` - Update PO
- POST `/api/purchase-orders/:id/receive` - Receive stock
- DELETE `/api/purchase-orders/:id` - Cancel PO
- GET `/api/purchase-orders/stats` - Get statistics

**Database Tables Required:**
- `purchase_orders`
- `purchase_order_items`
- `suppliers`

---

### 6. 🎁 Gift Cards Module

**Features:**
- Issue gift cards with custom amounts
- Multiple designs/templates
- Balance tracking
- Usage history
- Expiry date management
- Gift card codes (unique generation)

**Frontend Pages:**
- `/gift-cards` - Gift cards list

**API Endpoints Required:** ~6 endpoints
- GET `/api/gift-cards` - List gift cards
- POST `/api/gift-cards` - Issue gift card
- GET `/api/gift-cards/:code` - Get gift card details
- PUT `/api/gift-cards/:code` - Update gift card
- POST `/api/gift-cards/:code/use` - Use gift card balance
- GET `/api/gift-cards/:code/history` - Get usage history

**Database Tables Required:**
- `gift_cards`
- `gift_card_transactions`

---

### 7. 💰 Discounts Module

**Features:**
- Multiple discount types:
  - Percentage off
  - Fixed amount off
  - Free shipping
  - Buy one get one (BOGO)
- Discount codes
- Usage limits
- Date-based scheduling
- Apply to specific products/collections/customer groups
- Usage tracking

**Frontend Pages:**
- `/discounts` - Discounts list

**API Endpoints Required:** ~6 endpoints
- GET `/api/discounts` - List discounts
- POST `/api/discounts` - Create discount
- GET `/api/discounts/:id` - Get discount details
- PUT `/api/discounts/:id` - Update discount
- DELETE `/api/discounts/:id` - Delete discount
- POST `/api/discounts/validate` - Validate discount code

**Database Tables Required:**
- `discounts`
- `discount_usage`

---

### 8. 📈 Analytics Module

**Features:**
- Revenue analytics (daily, weekly, monthly)
- Section performance comparison
- Top products
- Customer acquisition metrics
- Hourly traffic patterns
- Order statistics
- Date range filtering

**Frontend Pages:**
- `/analytics` - Analytics dashboard

**API Endpoints Required:** ~5 endpoints
- GET `/api/analytics/revenue` - Revenue data
- GET `/api/analytics/sections` - Section performance
- GET `/api/analytics/products` - Top products
- GET `/api/analytics/customers` - Customer metrics
- GET `/api/analytics/traffic` - Traffic patterns

**Database Tables Required:**
- Analytics can use existing tables with aggregation queries

---

### 9. ⚙️ Settings Module

**Features:**
- Store configuration (name, email, phone, address)
- Tax settings
- Currency settings
- User profile management
- Notification preferences
- Security settings (2FA, session timeout)
- Appearance/theme
- Localization (language, timezone, date format)

**Frontend Pages:**
- `/settings` - Settings page with tabs

**API Endpoints Required:** ~4 endpoints
- GET `/api/settings` - Get all settings
- PUT `/api/settings/store` - Update store settings
- PUT `/api/settings/user` - Update user settings
- PUT `/api/settings/notifications` - Update notification settings

**Database Tables Required:**
- `store_settings`
- `user_settings`

---

### 10. 🔐 Authentication Module

**Features:**
- User login/logout
- JWT token-based authentication
- Refresh token mechanism
- Role-based access control (admin, manager, staff)
- Password reset
- Session management

**API Endpoints Required:** ~5 endpoints
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration (admin only)
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - User logout
- POST `/api/auth/reset-password` - Password reset

**Database Tables Required:**
- `users`
- `roles`
- `permissions`
- `refresh_tokens`

---

## Database Schema Requirements

### Database Choice Recommendation

**Recommended: PostgreSQL 15+**

**Reasons:**
1. Excellent support for JSON data (product attributes)
2. Strong ACID compliance
3. Advanced indexing capabilities
4. Full-text search
5. Excellent ORM support (Prisma, TypeORM)
6. Scalability
7. Open-source and free

### Core Tables Overview

**Total Tables Required:** ~25 tables

#### Essential Tables (Priority 1)

```sql
-- Authentication & Users
users
roles
permissions
user_roles
refresh_tokens

-- Orders
orders
order_items
shipping_addresses

-- Products
products
product_variants
product_images
product_categories

-- Inventory
inventory_items
inventory_locations
inventory_adjustments
inventory_transfers

-- Customers
customers
customer_tags
customer_notes
```

#### Secondary Tables (Priority 2)

```sql
-- Purchase Orders
purchase_orders
purchase_order_items
suppliers

-- Gift Cards & Discounts
gift_cards
gift_card_transactions
discounts
discount_usage

-- Settings
store_settings
user_settings
```

### Sample Schema: Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    section VARCHAR(20) NOT NULL CHECK (section IN ('cafe', 'flowers', 'books')),

    -- Status
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('paid', 'pending', 'refunded', 'failed')),
    fulfillment_status VARCHAR(20) NOT NULL CHECK (fulfillment_status IN ('fulfilled', 'unfulfilled', 'partial', 'scheduled')),

    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',

    -- Metadata
    notes TEXT,
    tags TEXT[],

    -- Timestamps
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID REFERENCES users(id),

    -- Indexes
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_section (section),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_fulfillment_status (fulfillment_status),
    INDEX idx_orders_order_date (order_date DESC),
    INDEX idx_orders_order_number (order_number)
);
```

### Sample Schema: Products Table

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    section VARCHAR(20) NOT NULL CHECK (section IN ('cafe', 'flowers', 'books')),

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2),

    -- Inventory
    sku VARCHAR(100) UNIQUE,
    track_inventory BOOLEAN DEFAULT true,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'out_of_stock', 'seasonal')),

    -- Section-specific data (JSONB for flexibility)
    cafe_attributes JSONB,  -- temperature, caffeine, ingredients, allergens
    flowers_attributes JSONB,  -- flower_types, colors, stem_count
    books_attributes JSONB,  -- isbn, author, publisher, genre

    -- SEO
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Indexes
    INDEX idx_products_section (section),
    INDEX idx_products_sku (sku),
    INDEX idx_products_status (status),
    INDEX idx_products_slug (slug),
    FULLTEXT INDEX idx_products_search (name, description)
);
```

### Relationships Diagram

```
users (1) ──── (N) orders
customers (1) ──── (N) orders
orders (1) ──── (N) order_items
orders (1) ──── (1) shipping_addresses
products (1) ──── (N) product_variants
products (1) ──── (N) product_images
products (1) ──── (N) inventory_items
inventory_items (1) ──── (N) inventory_adjustments
customers (1) ──── (N) customer_tags
purchase_orders (1) ──── (N) purchase_order_items
suppliers (1) ──── (N) purchase_orders
gift_cards (1) ──── (N) gift_card_transactions
discounts (1) ──── (N) discount_usage
```

---

## API Requirements Summary

### API Design Principles

1. **RESTful Design**: Use standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
2. **Versioning**: All endpoints under `/api/v1/`
3. **Consistent Response Format**: Always return `{ success, data, error }`
4. **Pagination**: Default 20 items, max 100 per page
5. **Filtering**: Support query parameters for all list endpoints
6. **Sorting**: Support `sortBy` and `sortOrder` parameters
7. **Authentication**: JWT Bearer token on all protected endpoints
8. **Rate Limiting**: 100 requests/minute per user
9. **Error Handling**: Standardized error codes and messages
10. **Documentation**: OpenAPI/Swagger documentation

### Request/Response Standards

**Success Response:**
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 10,
      "totalItems": 200,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Common Query Parameters

All list endpoints should support:

```
?page=1
?limit=20
?search=keyword
?sortBy=createdAt
?sortOrder=desc
?dateFrom=2025-01-01
?dateTo=2025-12-31
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request / Validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable entity |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Authentication & Authorization

### Authentication Flow

```
1. User logs in with email/password
   POST /api/auth/login

2. Backend validates credentials
   - Check user exists
   - Verify password hash

3. Backend generates tokens
   - Access Token (JWT, expires in 15 minutes)
   - Refresh Token (expires in 7 days)

4. Frontend stores tokens
   - Access Token: Memory/State
   - Refresh Token: HTTP-only cookie

5. Frontend includes access token in requests
   Authorization: Bearer <access_token>

6. When access token expires:
   POST /api/auth/refresh
   - Send refresh token
   - Get new access token

7. User logs out
   POST /api/auth/logout
   - Invalidate refresh token
```

### JWT Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@trio.com",
  "role": "admin",
  "permissions": ["orders:read", "orders:write", "products:read"],
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Role-Based Access Control (RBAC)

**Roles:**

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **admin** | Full access | All modules, all operations |
| **manager** | Section-specific | Orders, Products, Inventory for assigned section |
| **staff** | Read + limited write | View orders, update order status only |

**Permission Format:** `resource:action`

Examples:
- `orders:read`
- `orders:write`
- `orders:delete`
- `products:read`
- `products:write`
- `inventory:read`
- `inventory:write`

### Middleware Implementation

```javascript
// Pseudo-code for auth middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }

  try {
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
}

function authorize(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    next();
  };
}

// Usage
app.get('/api/orders', authenticate, authorize('orders:read'), getOrders);
app.post('/api/orders', authenticate, authorize('orders:write'), createOrder);
```

---

## File Upload Requirements

### Image Upload for Products

**Requirements:**
- Support multiple images per product
- Maximum 10 images per product
- Supported formats: JPG, PNG, WEBP
- Maximum file size: 5 MB per image
- Minimum dimensions: 800x800px
- Recommended dimensions: 1200x1200px

**Upload Flow:**
1. Frontend uploads image to backend endpoint
2. Backend validates file (size, format, dimensions)
3. Backend processes image:
   - Generate thumbnail (200x200px)
   - Generate medium size (600x600px)
   - Optimize original image
4. Backend uploads to cloud storage (AWS S3/Cloudinary)
5. Backend saves URLs to database
6. Backend returns image URLs to frontend

**Endpoint:**
```
POST /api/products/:id/images
Content-Type: multipart/form-data

Body:
- image: File (binary)
- alt: String (optional)
- position: Number (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "img-uuid",
    "productId": "prod-uuid",
    "original": "https://cdn.trio.com/products/original/image.jpg",
    "medium": "https://cdn.trio.com/products/medium/image.jpg",
    "thumbnail": "https://cdn.trio.com/products/thumb/image.jpg",
    "alt": "Product image",
    "position": 0
  }
}
```

### CSV Export

**Requirements:**
- Export orders to CSV format
- Include filters from frontend
- Maximum 10,000 rows per export
- Column headers in English
- UTF-8 encoding

**Endpoint:**
```
GET /api/orders/export?section=cafe&paymentStatus=paid
Content-Type: text/csv
```

---

## Third-Party Integrations

### Required Integrations

#### 1. Email Service (Required)
**Purpose:** Order confirmations, password reset, notifications

**Options:**
- SendGrid (Recommended)
- AWS SES
- Mailgun

**Features Needed:**
- Transactional emails
- Email templates
- Delivery tracking

#### 2. Cloud Storage (Required)
**Purpose:** Product images, document storage

**Options:**
- AWS S3

**Features Needed:**
- Image upload
- CDN delivery
- Image optimization

#### 3. Payment Gateway (Future)
**Purpose:** Online payment processing

**Options:**
- JazzCash (Pakistan)
- EasyPaisa (Pakistan)

**Features Needed:**
- Payment processing
- Refunds
- Webhooks

#### 4. SMS Service (Optional)
**Purpose:** Order notifications via SMS

**Options:**
- Twilio
- MSG91 (for Pakistan)

---

## Backend Development Priorities

### Phase 1: Foundation (Week 1-2)

**Priority: Critical 🔴**

1. ✅ Setup project structure
   - Initialize Node.js/NestJS project
   - Configure TypeScript
   - Setup ESLint and Prettier
   - Configure environment variables

2. ✅ Setup database
   - Create PostgreSQL database
   - Setup ORM (Prisma recommended)
   - Create migration scripts
   - Seed initial data

3. ✅ Authentication system
   - User registration (admin only)
   - User login
   - JWT token generation
   - Refresh token mechanism
   - Password hashing (bcrypt)
   - Auth middleware

4. ✅ Basic API structure
   - Setup Express/NestJS routes
   - Configure CORS
   - Setup request validation
   - Setup error handling middleware
   - Setup logging (Winston/Pino)

**Deliverable:** Working authentication system + database

---

### Phase 2: Core Modules (Week 3-4)

**Priority: Critical 🔴**

5. ✅ Orders API (10 endpoints)
   - See [Order Management API Documentation](./01-Order-Management-API.md)
   - All CRUD operations
   - Status management
   - Filtering and search
   - Export to CSV

6. ✅ Products API (12 endpoints)
   - CRUD operations
   - Variant management
   - Multi-section support
   - Product search

7. ✅ Inventory API (8 endpoints)
   - Stock tracking
   - Adjustments
   - Alerts

**Deliverable:** Orders, Products, and Inventory fully functional

---

### Phase 3: Secondary Modules (Week 5-6)

**Priority: High 🟡**

8. ✅ Customers API (8 endpoints)
   - Customer management
   - Order history
   - Tags and notes

9. ✅ Purchase Orders API (7 endpoints)
   - PO creation
   - Receiving workflow
   - Status tracking

10. ✅ Analytics API (5 endpoints)
    - Revenue analytics
    - Performance metrics
    - Customer insights

**Deliverable:** Complete management system

---

### Phase 4: Additional Features (Week 7-8)

**Priority: Medium 🟢**

11. ✅ Gift Cards API (6 endpoints)
12. ✅ Discounts API (6 endpoints)
13. ✅ Settings API (4 endpoints)
14. ✅ File upload system
15. ✅ Email notifications

**Deliverable:** Full-featured admin panel

---

### Phase 5: Testing & Optimization (Week 9-10)

**Priority: High 🟡**

16. ✅ Unit tests (80%+ coverage)
17. ✅ Integration tests
18. ✅ Performance optimization
19. ✅ Security audit
20. ✅ API documentation (Swagger)

**Deliverable:** Production-ready backend

---

## Deployment Architecture

### Recommended Deployment

**Infrastructure:**

```
┌─────────────────────────────────────────────┐
│            Cloudflare / Route53              │
│                 (DNS + CDN)                  │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              Load Balancer                   │
│            (AWS ALB / Nginx)                 │
└─────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│   Frontend       │  │    Backend       │
│   (Vercel)       │  │  (AWS EC2/ECS)   │
│   Next.js 15     │  │  Node.js API     │
└──────────────────┘  └──────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
            ┌────────┐  ┌────────┐  ┌────────┐
            │PostgreSQL Redis │  AWS S3 │
            │  (RDS)   Cache  │  Images │
            └────────┘  └────────┘  └────────┘
```

**Environments:**

1. **Development**
   - Local database
   - Local Redis
   - Local file storage

2. **Staging**
   - AWS RDS PostgreSQL (small instance)
   - AWS ElastiCache Redis
   - AWS S3
   - Separate database from production

3. **Production**
   - AWS RDS PostgreSQL (production instance)
   - AWS ElastiCache Redis (multi-AZ)
   - AWS S3 with CloudFront CDN
   - Auto-scaling enabled
   - Daily backups

### Server Requirements

**Minimum (Staging):**
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 50 GB SSD
- Database: PostgreSQL 15 (20 GB storage)
- Redis: 1 GB memory

**Recommended (Production):**
- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 100 GB SSD
- Database: PostgreSQL 15 (100 GB storage, read replica)
- Redis: 2 GB memory

---

## Performance Requirements

### Response Time Targets

| Endpoint Type | Target | Maximum |
|---------------|--------|---------|
| List endpoints (GET) | < 200ms | < 500ms |
| Single record (GET) | < 100ms | < 300ms |
| Create (POST) | < 300ms | < 1s |
| Update (PUT/PATCH) | < 200ms | < 500ms |
| Delete (DELETE) | < 200ms | < 500ms |
| Analytics | < 1s | < 3s |
| Export (CSV) | < 5s | < 10s |

### Optimization Strategies

1. **Database Indexing**
   - Index all foreign keys
   - Index frequently queried fields
   - Composite indexes for common filters

2. **Caching**
   - Cache product lists (5 minutes)
   - Cache analytics data (1 hour)
   - Cache settings (until changed)
   - Use Redis for caching

3. **Pagination**
   - Default 20 items per page
   - Maximum 100 items per page
   - Use cursor-based pagination for large datasets

4. **Query Optimization**
   - Use JOIN instead of N+1 queries
   - Select only needed fields
   - Use database views for complex queries

5. **API Rate Limiting**
   - 100 requests per minute per user
   - 10 create operations per hour
   - 5 export operations per hour

---

## Security Requirements

### Security Checklist

#### Authentication & Authorization
- ✅ Implement JWT with short expiration (15 minutes)
- ✅ Use refresh tokens with HTTP-only cookies
- ✅ Hash passwords with bcrypt (min 10 rounds)
- ✅ Implement role-based access control
- ✅ Validate all user inputs
- ✅ Implement rate limiting
- ✅ Setup CORS properly
- ✅ Use HTTPS in production
- ✅ Implement 2FA (future enhancement)

#### Data Protection
- ✅ Encrypt sensitive data at rest
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Sanitize all inputs (prevent XSS)
- ✅ Implement CSRF protection
- ✅ Setup database backups (daily)
- ✅ Log all API requests
- ✅ Implement audit trail for critical operations

#### Infrastructure
- ✅ Use environment variables for secrets
- ✅ Never commit secrets to Git
- ✅ Implement firewall rules
- ✅ Setup SSL/TLS certificates
- ✅ Regular security updates
- ✅ Implement DDoS protection
- ✅ Setup monitoring and alerts

#### Compliance
- ✅ GDPR compliance (if applicable)
- ✅ Data retention policies
- ✅ Privacy policy
- ✅ Terms of service

---

## Testing Requirements

### Test Coverage Targets

| Test Type | Target Coverage |
|-----------|-----------------|
| Unit Tests | 80%+ |
| Integration Tests | 70%+ |
| E2E Tests | Critical flows |

### Testing Strategy

#### 1. Unit Tests
Test individual functions and methods

**Tools:** Jest, Mocha, Chai

**Examples:**
- Test password hashing
- Test JWT token generation
- Test validation functions
- Test utility functions

#### 2. Integration Tests
Test API endpoints

**Tools:** Supertest, Jest

**Examples:**
```javascript
describe('POST /api/orders', () => {
  it('should create a new order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer: { /* ... */ },
        items: [ /* ... */ ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('orderNumber');
  });
});
```

#### 3. End-to-End Tests
Test complete user flows

**Tools:** Cypress, Playwright

**Examples:**
- User login → Create order → View order
- Create product → Add to inventory → Create order

#### 4. Load Testing
Test performance under load

**Tools:** Apache JMeter, k6

**Targets:**
- 100 concurrent users
- 1000 requests per minute
- < 500ms average response time

---

## Development Timeline

### 10-Week Development Plan

| Week | Phase | Tasks | Deliverable |
|------|-------|-------|-------------|
| 1-2 | Foundation | Project setup, database, auth | Working auth system |
| 3-4 | Core Modules | Orders, Products, Inventory APIs | Core functionality |
| 5-6 | Secondary | Customers, POs, Analytics | Management system |
| 7-8 | Features | Gift cards, Discounts, Settings | Full features |
| 9-10 | Testing | Tests, optimization, docs | Production ready |

**Total Time:** 10 weeks (2.5 months)

---

## Getting Started

### Step 1: Environment Setup

```bash
# Clone frontend repo
git clone <repo-url>

# Install dependencies
npm install

# Run frontend
npm run dev
```

### Step 2: Review Documentation

1. Read this overview document
2. Review [Order Management API Documentation](./01-Order-Management-API.md)
3. Review [API Standards README](./README.md)

### Step 3: Backend Setup

```bash
# Create backend project
mkdir trio-backend
cd trio-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express typescript @types/node @types/express
npm install prisma @prisma/client
npm install jsonwebtoken bcrypt
npm install dotenv cors helmet

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

### Step 4: Database Setup

```bash
# Create .env file
DATABASE_URL="postgresql://user:password@localhost:5432/trio"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Create database schema
# Edit prisma/schema.prisma

# Run migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### Step 5: Start Development

1. Implement authentication endpoints
2. Implement orders API (use documentation)
3. Test with frontend
4. Continue with other modules

---

## Support & Communication

### Team Structure

**Roles Needed:**

1. **Backend Lead** (1 person)
   - Architecture decisions
   - Code review
   - Database design

2. **Backend Developers** (2-3 people)
   - API implementation
   - Testing
   - Documentation

3. **DevOps Engineer** (1 person)
   - Infrastructure setup
   - Deployment
   - Monitoring

### Communication Channels

- **Daily Standups:** 15 minutes
- **Code Reviews:** Required for all PRs
- **Documentation:** Update as you build
- **Testing:** Write tests with code

### Questions & Clarifications

For any questions about:
- **Frontend features:** Check existing frontend code
- **API specifications:** Refer to module-specific docs
- **Business logic:** Check business rules sections
- **Technical decisions:** Discuss with team lead

---

## Appendix

### Useful Resources

1. **Next.js Documentation:** https://nextjs.org/docs
2. **Prisma Documentation:** https://www.prisma.io/docs
3. **PostgreSQL Documentation:** https://www.postgresql.org/docs/
4. **JWT Best Practices:** https://jwt.io/introduction
5. **REST API Design:** https://restfulapi.net/

### Mock Data Location

All mock data currently used by frontend is located in:
- `/lib/data.ts` - Orders, Products, Customers, Inventory
- `/lib/discount-data.ts` - Discounts
- `/lib/analytics-data.ts` - Analytics data
- `/lib/notification-data.ts` - Notifications

**Action Required:** Migrate this data structure to database schema.

### TypeScript Types

All TypeScript interfaces are defined in:
- `/types/index.ts` - Core types
- `/lib/data.ts` - Module-specific types

**Recommendation:** Share these types between frontend and backend using a shared package or copy to backend.

---

## Conclusion

This document provides a complete overview of the TRIO Admin Panel project from a backend perspective. The frontend is fully functional and waiting for backend API integration.

**Key Takeaways:**

✅ Frontend is 100% complete
✅ All UI components are ready
✅ Mock data shows expected data structures
✅ API documentation is detailed and clear
✅ Database schema guidelines provided
✅ Security requirements specified
✅ Development timeline is realistic

**Next Steps:**

1. Setup backend development environment
2. Create database schema
3. Implement authentication
4. Build Order Management API (highest priority)
5. Continue with other modules
6. Test integration with frontend
7. Deploy to staging
8. Production launch

---

**Document Version:** 1.0.0
**Last Updated:** November 19, 2025
**Maintained By:** TRIO Development Team
**Status:** Ready for Backend Development

---

**Good luck with the backend development! 🚀**
