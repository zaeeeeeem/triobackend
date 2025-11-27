# TRIO Shopify Server - Codebase Birds Eye View

> **Complete file-by-file overview of the entire codebase**
>
> This document provides a comprehensive birds-eye view of every file in the codebase, including all functions, classes, exports, and their purposes.

---

## Table of Contents
1. [Controllers](#controllers)
2. [Services](#services)
3. [Routes](#routes)
4. [Middleware](#middleware)
5. [Configuration](#configuration)
6. [Utilities](#utilities)
7. [Types](#types)
8. [Validators](#validators)
9. [Jobs](#jobs)
10. [Database Schema](#database-schema)
11. [Entry Points](#entry-points)

---

## Controllers

### 1. /src/controllers/auth.controller.ts
**Lines:** 90
**Purpose:** Admin authentication endpoints

**Functions:**
- `register(req, res, next)` - Register new admin user
- `login(req, res, next)` - Admin login
- `refreshAccessToken(req, res, next)` - Refresh access token
- `logout(req, res, next)` - Logout single device
- `logoutAll(req, res, next)` - Logout all devices
- `changePassword(req, res, next)` - Change password
- `getActiveSessions(req, res, next)` - Get active sessions
- `getProfile(req, res, next)` - Get user profile

**Exports:** `authController`

**Dependencies:**
- `authService` - Business logic
- `apiResponse` - Response formatting
- `logger` - Error logging

---

### 2. /src/controllers/customer-auth.controller.ts
**Lines:** 272
**Purpose:** Customer authentication endpoints

**Functions:**
- `register(req, res, next)` - Register customer
- `login(req, res, next)` - Customer login
- `refreshAccessToken(req, res, next)` - Refresh customer access token
- `logout(req, res, next)` - Logout customer (single device)
- `logoutAll(req, res, next)` - Logout customer (all devices)
- `verifyEmail(req, res, next)` - Verify customer email
- `resendVerificationEmail(req, res, next)` - Resend verification email
- `forgotPassword(req, res, next)` - Request password reset
- `resetPassword(req, res, next)` - Reset password with code
- `getMe(req, res, next)` - Get authenticated customer info
- `generateGuestToken(req, res, next)` - Generate guest checkout token
- `convertGuestToRegistered(req, res, next)` - Convert guest to registered customer

**Exports:** `customerAuthController`

**Dependencies:**
- `customerAuthService` - Business logic
- `apiResponse` - Response formatting
- `logger` - Error logging

---

### 3. /src/controllers/customer.controller.ts
**Lines:** 251
**Purpose:** Customer profile and order management

**Functions:**
- `getProfile(req, res, next)` - Get customer profile with statistics
- `updateProfile(req, res, next)` - Update customer profile
- `changeEmail(req, res, next)` - Change customer email
- `changePassword(req, res, next)` - Change customer password
- `updatePreferences(req, res, next)` - Update email preferences
- `deleteAccount(req, res, next)` - Delete customer account
- `getOrders(req, res, next)` - Get customer orders
- `getOrderById(req, res, next)` - Get specific order
- `getStatistics(req, res, next)` - Get customer statistics

**Exports:** `customerController`

**Dependencies:**
- `customerService` - Business logic
- `apiResponse` - Response formatting
- `logger` - Error logging

---

### 4. /src/controllers/admin-customer.controller.ts
**Purpose:** Admin customer management

**Functions:**
- `listCustomers(req, res, next)` - List all customers (admin)
- `createCustomer(req, res, next)` - Create customer (admin)
- `getCustomerById(req, res, next)` - Get customer details (admin)
- `updateCustomer(req, res, next)` - Update customer (admin)
- `deleteCustomer(req, res, next)` - Delete customer (admin)

**Exports:** `adminCustomerController`

---

### 5. /src/controllers/customer-address.controller.ts
**Purpose:** Customer address management

**Functions:**
- `listAddresses(req, res, next)` - List customer addresses
- `createAddress(req, res, next)` - Create new address
- `getAddress(req, res, next)` - Get address by ID
- `updateAddress(req, res, next)` - Update address
- `deleteAddress(req, res, next)` - Delete address
- `setDefaultAddress(req, res, next)` - Set default shipping/billing address

**Exports:** `customerAddressController`

---

### 6. /src/controllers/product.controller.ts
**Lines:** 163
**Purpose:** Product management endpoints

**Functions:**
- `createProduct(req, res, next)` - Create new product
- `getProductById(req, res, next)` - Get product by ID
- `listProducts(req, res, next)` - List products with filters
- `updateProduct(req, res, next)` - Update product
- `deleteProduct(req, res, next)` - Delete product (soft/hard)
- `bulkUpdateProducts(req, res, next)` - Bulk update products
- `bulkDeleteProducts(req, res, next)` - Bulk delete products
- `uploadImages(req, res, next)` - Upload product images
- `deleteImage(req, res, next)` - Delete product image
- `reorderImages(req, res, next)` - Reorder product images

**Exports:** `productController`

**Dependencies:**
- `productService` - Business logic
- `uploadService` - Image handling
- `apiResponse` - Response formatting
- `cache` - Redis caching

---

### 7. /src/controllers/order.controller.ts
**Purpose:** Order management endpoints

**Functions:**
- `create(req, res, next)` - Create order (checkout)
- `list(req, res, next)` - List orders with filters
- `getById(req, res, next)` - Get order by ID
- `update(req, res, next)` - Update order
- `updatePaymentStatus(req, res, next)` - Update payment status
- `updateFulfillmentStatus(req, res, next)` - Update fulfillment status
- `getStats(req, res, next)` - Get order statistics
- `exportCsv(req, res, next)` - Export orders to CSV
- `duplicate(req, res, next)` - Duplicate order
- `delete(req, res, next)` - Delete order

**Exports:** `orderController`

**Dependencies:**
- `orderService` - Business logic
- `apiResponse` - Response formatting

---

### 8. /src/controllers/guest-order.controller.ts
**Purpose:** Guest order management

**Functions:**
- `createGuestOrder(req, res, next)` - Create guest order
- `trackGuestOrder(req, res, next)` - Track guest order by email
- `getGuestOrderCount(req, res, next)` - Get guest order count

**Exports:** `guestOrderController`

**Dependencies:**
- `guestOrderService` - Business logic

---

## Services

### 1. /src/services/auth.service.ts
**Lines:** 330
**Purpose:** Admin authentication business logic

**Functions:**
- `register(data)` - Register admin user
- `login(email, password)` - Admin login
- `refreshAccessToken(refreshToken)` - Refresh access token
- `logout(refreshToken)` - Logout single device
- `logoutAll(userId)` - Logout all devices
- `changePassword(userId, currentPassword, newPassword)` - Change password
- `getActiveSessions(userId)` - Get active sessions
- `generateTokens(user)` - Generate JWT tokens
- `verifyRefreshToken(token)` - Verify refresh token
- `cleanupExpiredTokens()` - Remove expired tokens
- `enforceSessionLimit(userId)` - Enforce max sessions

**Private Functions:**
- `_hashPassword(password)` - Hash password with bcrypt
- `_comparePassword(password, hash)` - Compare password
- `_generateAccessToken(payload)` - Generate access token
- `_generateRefreshToken(payload)` - Generate refresh token

**Exports:** `authService`

---

### 2. /src/services/customer-auth.service.ts
**Lines:** 663
**Purpose:** Customer authentication business logic

**Functions:**
- `register(data)` - Register customer
- `login(email, password)` - Customer login
- `refreshAccessToken(refreshToken)` - Refresh customer access token
- `logout(refreshToken)` - Logout single device
- `logoutAll(customerId)` - Logout all devices
- `verifyEmail(token)` - Verify customer email
- `resendVerificationEmail(customerId)` - Resend verification email
- `forgotPassword(email)` - Request password reset
- `resetPassword(email, token, newPassword)` - Reset password
- `generateGuestToken()` - Generate guest token
- `updateGuestCustomerWithPassword(guestId, data)` - Convert guest to registered
- `validatePasswordStrength(password)` - Validate password strength
- `generateVerificationToken(customerId)` - Generate email verification token
- `generatePasswordResetCode()` - Generate 6-digit reset code
- `linkGuestOrdersToCustomer(email, customerId)` - Link guest orders

**Exports:** `customerAuthService`

---

### 3. /src/services/customer.service.ts
**Lines:** 557
**Purpose:** Customer profile and management

**Functions:**
- `getCustomerById(customerId)` - Get customer by ID
- `getCustomerProfile(customerId)` - Get profile with statistics
- `updateCustomer(customerId, data)` - Update customer profile
- `changeEmail(customerId, newEmail, password)` - Change email
- `changePassword(customerId, currentPassword, newPassword)` - Change password
- `updatePreferences(customerId, preferences)` - Update email preferences
- `deleteCustomer(customerId, password)` - Delete customer account
- `getCustomerOrders(customerId, filters)` - Get customer orders
- `getOrderById(customerId, orderId)` - Get specific order
- `calculateStatistics(customerId)` - Calculate customer statistics
- `listCustomers(filters)` - List all customers (admin)
- `createCustomer(data)` - Create customer (admin)
- `sanitizeCustomer(customer)` - Remove sensitive fields

**Private Functions:**
- `_calculateLoyaltyTier(totalSpent)` - Calculate loyalty tier
- `_calculateOrderFrequency(orders)` - Calculate order frequency
- `_findFavoriteSection(orders)` - Find favorite section
- `_getTopProducts(customerId)` - Get top purchased products

**Exports:** `customerService`

---

### 4. /src/services/customer-address.service.ts
**Purpose:** Customer address management

**Functions:**
- `listAddresses(customerId)` - List customer addresses
- `createAddress(customerId, data)` - Create address
- `getAddress(customerId, addressId)` - Get address by ID
- `updateAddress(customerId, addressId, data)` - Update address
- `deleteAddress(customerId, addressId)` - Delete address
- `setDefaultAddress(customerId, addressId, type)` - Set default address
- `validateAddress(data)` - Validate address data

**Exports:** `customerAddressService`

---

### 5. /src/services/product.service.ts
**Lines:** 607
**Purpose:** Product management business logic

**Functions:**
- `createProduct(data, createdBy)` - Create product
- `getProductById(id)` - Get product by ID
- `listProducts(filters)` - List products with filters
- `updateProduct(id, data, updatedBy)` - Update product
- `deleteProduct(id, force)` - Delete product
- `bulkUpdateProducts(productIds, updates)` - Bulk update
- `bulkDeleteProducts(productIds, force)` - Bulk delete
- `calculateAvailability(inventory)` - Calculate availability status
- `createInventoryItem(productId, sku)` - Auto-create inventory
- `invalidateProductCache(filters?)` - Invalidate cache

**Private Functions:**
- `_buildProductFilters(filters)` - Build Prisma where clause
- `_buildSortOptions(sortBy, sortOrder)` - Build Prisma orderBy
- `_includeRelations()` - Include related data
- `_validateSectionData(section, data)` - Validate section-specific data
- `_createSectionProduct(productId, section, data)` - Create section product
- `_updateSectionProduct(productId, section, data)` - Update section product

**Exports:** `productService`

---

### 6. /src/services/upload.service.ts
**Purpose:** Image upload and processing

**Functions:**
- `uploadProductImages(productId, files)` - Upload product images
- `deleteProductImage(productId, imageId)` - Delete image
- `reorderProductImages(productId, imageOrder)` - Reorder images
- `processImage(buffer, size)` - Process image with Sharp
- `uploadToS3(key, buffer, contentType)` - Upload to S3/MinIO
- `deleteFromS3(key)` - Delete from S3/MinIO
- `generatePublicUrl(key)` - Generate public URL

**Private Functions:**
- `_validateFile(file)` - Validate file type and size
- `_generateImageSizes(buffer)` - Generate 3 sizes
- `_optimizeImage(buffer, width, height)` - Optimize with Sharp

**Exports:** `uploadService`

---

### 7. /src/services/order.service.ts
**Purpose:** Order management business logic

**Functions:**
- `create(data, createdBy)` - Create order
- `list(filters)` - List orders
- `getById(orderId)` - Get order by ID
- `update(orderId, data)` - Update order
- `updatePaymentStatus(orderId, status)` - Update payment status
- `updateFulfillmentStatus(orderId, status)` - Update fulfillment status
- `getStats(filters)` - Get order statistics
- `exportCsv(filters)` - Export to CSV
- `duplicate(orderId)` - Duplicate order
- `delete(orderId, hard)` - Delete order
- `calculateTotals(items, discountCode)` - Calculate order totals
- `validateOrderItems(items)` - Validate items
- `commitInventory(items)` - Commit stock
- `releaseInventory(items)` - Release stock

**Exports:** `orderService`

---

### 8. /src/services/guest-order.service.ts
**Purpose:** Guest order handling

**Functions:**
- `createGuestOrder(data)` - Create guest order
- `trackGuestOrder(email, orderNumber)` - Track guest order
- `getGuestOrderCount(email)` - Get guest order count
- `linkGuestOrders(email, customerId)` - Link to customer account

**Exports:** `guestOrderService`

---

### 9. /src/services/email.service.ts
**Purpose:** Email sending

**Functions:**
- `sendVerificationEmail(email, token)` - Send verification email
- `sendPasswordResetEmail(email, code)` - Send reset code
- `sendWelcomeEmail(email, name)` - Send welcome email
- `sendOrderConfirmationEmail(order)` - Send order confirmation
- `sendShippingConfirmationEmail(order, tracking)` - Send shipping update
- `sendDeliveryConfirmationEmail(order)` - Send delivery confirmation
- `renderTemplate(templateName, data)` - Render email template

**Exports:** `emailService`

---

## Routes

### 1. /src/routes/index.ts
**Purpose:** Main router - mounts all sub-routes

**Mounted Routes:**
- `/health` → Health check
- `/auth` → Admin authentication
- `/products` → Product management
- `/customer-auth` → Customer authentication
- `/customers` → Customer profile
- `/customers/addresses` → Customer addresses
- `/admin/customers` → Admin customer management
- `/orders` → Order management
- `/guest-orders` → Guest orders

**Exports:** `router`

---

### 2. /src/routes/auth.routes.ts
**Lines:** 371
**Purpose:** Admin authentication routes

**Routes:**
```
POST   /api/v1/auth/register           - Register admin
POST   /api/v1/auth/login              - Login admin
POST   /api/v1/auth/refresh            - Refresh token
POST   /api/v1/auth/logout             - Logout single device
POST   /api/v1/auth/logout-all         - Logout all devices
POST   /api/v1/auth/change-password    - Change password
GET    /api/v1/auth/sessions           - Get active sessions
GET    /api/v1/auth/me                 - Get profile
```

**Middleware:**
- `authenticate` - JWT verification
- `authorize` - Role-based access
- Validators

**Exports:** `router`

---

### 3. /src/routes/customer-auth.routes.ts
**Purpose:** Customer authentication routes

**Routes:**
```
POST   /api/v1/customer-auth/register              - Register customer
POST   /api/v1/customer-auth/login                 - Login customer
POST   /api/v1/customer-auth/refresh               - Refresh token
POST   /api/v1/customer-auth/logout                - Logout
POST   /api/v1/customer-auth/logout-all            - Logout all
GET    /api/v1/customer-auth/verify-email          - Verify email
POST   /api/v1/customer-auth/resend-verification   - Resend verification
POST   /api/v1/customer-auth/forgot-password       - Forgot password
POST   /api/v1/customer-auth/reset-password        - Reset password
GET    /api/v1/customer-auth/me                    - Get profile
POST   /api/v1/customer-auth/guest-token           - Generate guest token
POST   /api/v1/customer-auth/convert-guest         - Convert guest
```

**Exports:** `router`

---

### 4. /src/routes/customer.routes.ts
**Purpose:** Customer profile routes

**Routes:**
```
GET    /api/v1/customers/profile           - Get profile
PATCH  /api/v1/customers/profile           - Update profile
POST   /api/v1/customers/change-email      - Change email
POST   /api/v1/customers/change-password   - Change password
PATCH  /api/v1/customers/preferences       - Update preferences
DELETE /api/v1/customers/account           - Delete account
GET    /api/v1/customers/orders            - Get orders
GET    /api/v1/customers/orders/:id        - Get order
GET    /api/v1/customers/statistics        - Get statistics
```

**Middleware:** `authenticateCustomer`

**Exports:** `router`

---

### 5. /src/routes/customer-address.routes.ts
**Purpose:** Customer address routes

**Routes:**
```
GET    /api/v1/customers/addresses                 - List addresses
POST   /api/v1/customers/addresses                 - Create address
GET    /api/v1/customers/addresses/:id             - Get address
PATCH  /api/v1/customers/addresses/:id             - Update address
DELETE /api/v1/customers/addresses/:id             - Delete address
POST   /api/v1/customers/addresses/:id/default     - Set default
```

**Exports:** `router`

---

### 6. /src/routes/admin-customer.routes.ts
**Purpose:** Admin customer management routes

**Routes:**
```
GET    /api/v1/admin/customers         - List all customers
POST   /api/v1/admin/customers         - Create customer
GET    /api/v1/admin/customers/:id     - Get customer
PATCH  /api/v1/admin/customers/:id     - Update customer
DELETE /api/v1/admin/customers/:id     - Delete customer
```

**Middleware:** `authenticate`, `authorize('ADMIN')`

**Exports:** `router`

---

### 7. /src/routes/product.routes.ts
**Lines:** 1,042
**Purpose:** Product management routes with extensive Swagger docs

**Routes:**
```
POST   /api/v1/products                        - Create product
GET    /api/v1/products                        - List products
GET    /api/v1/products/:id                    - Get product
PUT    /api/v1/products/:id                    - Update product
DELETE /api/v1/products/:id                    - Delete product
PATCH  /api/v1/products/bulk                   - Bulk update
DELETE /api/v1/products/bulk                   - Bulk delete
POST   /api/v1/products/:id/images             - Upload images
DELETE /api/v1/products/:id/images/:imageId    - Delete image
PUT    /api/v1/products/:id/images/reorder     - Reorder images
```

**Middleware:**
- `authenticate` - JWT verification
- `authorize('ADMIN', 'MANAGER')` - Role check
- `checkSectionAccess(section)` - Section check
- Rate limiters

**Exports:** `router`

---

### 8. /src/routes/order.routes.ts
**Lines:** 518
**Purpose:** Order management routes

**Routes:**
```
POST   /api/v1/orders                               - Create order
GET    /api/v1/orders                               - List orders
GET    /api/v1/orders/stats                         - Get statistics
GET    /api/v1/orders/export                        - Export CSV
GET    /api/v1/orders/:id                           - Get order
PATCH  /api/v1/orders/:id                           - Update order
PATCH  /api/v1/orders/:id/payment-status           - Update payment
PATCH  /api/v1/orders/:id/fulfillment-status       - Update fulfillment
POST   /api/v1/orders/:id/duplicate                 - Duplicate order
DELETE /api/v1/orders/:id                           - Delete order
```

**Middleware:**
- `authenticate` - Admin only
- `optionalCustomerAuth` - For order creation
- Validators

**Exports:** `router`

---

### 9. /src/routes/guest-order.routes.ts
**Purpose:** Guest order routes

**Routes:**
```
POST   /api/v1/guest-orders        - Create guest order
GET    /api/v1/guest-orders/track  - Track guest order
```

**Exports:** `router`

---

## Middleware

### 1. /src/middleware/auth.ts
**Lines:** 77
**Purpose:** Admin authentication middleware

**Functions:**
- `authenticate(req, res, next)` - Verify JWT token, inject req.user
- `authorize(...roles)` - Check user role
- `checkSectionAccess(section)` - Verify section access for managers

**Exports:** `{ authenticate, authorize, checkSectionAccess }`

---

### 2. /src/middleware/customer-auth.ts
**Purpose:** Customer authentication middleware

**Functions:**
- `authenticateCustomer(req, res, next)` - Verify customer JWT, inject req.customer
- `optionalCustomerAuth(req, res, next)` - Optional auth (supports guest)

**Exports:** `{ authenticateCustomer, optionalCustomerAuth }`

---

### 3. /src/middleware/errorHandler.ts
**Purpose:** Centralized error handling

**Function:** `errorHandler(err, req, res, next)`

**Handles:**
- AppError instances
- Prisma errors (P2002, P2025, etc.)
- JWT errors
- Validation errors
- Generic errors

**Exports:** `errorHandler`

---

### 4. /src/middleware/validation.ts
**Purpose:** Input validation

**Function:** `validate(req, res, next)`

**Process:**
1. Run express-validator validations
2. Collect errors
3. Return 422 if validation fails

**Exports:** `validate`

---

### 5. /src/middleware/rateLimiter.ts
**Purpose:** Rate limiting

**Exports:**
- `generalLimiter` - 100 req/min
- `createLimiter` - 10 req/min
- `uploadLimiter` - 5 req/min
- `bulkLimiter` - 5 req/5min

---

## Configuration

### 1. /src/config/env.ts
**Purpose:** Environment variable management

**Exports:**
```typescript
{
  server: { NODE_ENV, PORT, API_VERSION },
  database: { DATABASE_URL },
  jwt: { secrets, expiry for admin and customer },
  redis: { host, port, password, db },
  aws: { S3 configuration },
  cors: { origins },
  rateLimiting: { window, max },
  fileUpload: { maxSize, maxFiles },
  pagination: { default, max },
  sessions: { maxActive }
}
```

---

### 2. /src/config/database.ts
**Purpose:** Prisma client

**Exports:** `prisma` - PrismaClient instance

---

### 3. /src/config/redis.ts
**Purpose:** Redis client with helpers

**Exports:**
```typescript
{
  redis, // Redis client
  cache: {
    get<T>(key),
    set(key, value, ttl),
    del(key),
    invalidatePattern(pattern)
  }
}
```

---

### 4. /src/config/s3.ts
**Purpose:** S3/MinIO client

**Exports:** `s3Client` - S3Client instance

---

### 5. /src/config/swagger.ts
**Purpose:** Swagger/OpenAPI configuration

**Exports:** Swagger middleware

---

## Utilities

### 1. /src/utils/apiResponse.ts
**Purpose:** Standardized API responses

**Functions:**
- `success(res, data, message?)` - Success response
- `error(res, statusCode, code, message, details?)` - Error response
- `paginated(res, data, pagination)` - Paginated response

**Exports:** `apiResponse`

---

### 2. /src/utils/errors.ts
**Purpose:** Custom error classes

**Classes:**
- `AppError` - Base error
- `ValidationError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `DatabaseError` - 500

**Exports:** All error classes

---

### 3. /src/utils/logger.ts
**Purpose:** Winston logger

**Exports:** `logger` with methods:
- `error(message, meta?)`
- `warn(message, meta?)`
- `info(message, meta?)`
- `http(message, meta?)`
- `debug(message, meta?)`

---

## Types

### 1. /src/types/product.types.ts
**Lines:** 165
**Purpose:** Product type definitions

**Exports:**
- `CreateProductDTO`
- `UpdateProductDTO`
- `ProductResponse`
- `ProductListFilters`
- `CreateCafeProductDTO`
- `CreateFlowersProductDTO`
- `CreateBooksProductDTO`
- And more...

---

### 2. /src/types/customer.types.ts
**Lines:** 4,264 bytes
**Purpose:** Customer type definitions

**Exports:**
- `CustomerDTO`
- `CustomerResponse`
- `UpdateCustomerDTO`
- `CustomerStatistics`
- And more...

---

### 3. /src/types/customer-auth.types.ts
**Lines:** 3,185 bytes
**Purpose:** Customer auth type definitions

**Exports:**
- `RegisterCustomerDTO`
- `LoginCustomerDTO`
- `CustomerAuthResponse`
- And more...

---

### 4. /src/types/address.types.ts
**Lines:** 2,949 bytes
**Purpose:** Address type definitions

**Exports:**
- `CreateAddressDTO`
- `UpdateAddressDTO`
- `AddressResponse`
- And more...

---

### 5. /src/types/order.types.ts
**Lines:** 7,955 bytes
**Purpose:** Order type definitions

**Exports:**
- `CreateOrderDTO`
- `UpdateOrderDTO`
- `OrderResponse`
- `OrderFilters`
- `OrderStatistics`
- And more...

---

## Validators

### 1. /src/validators/order.validator.ts
**Purpose:** Order validation chains

**Exports:**
- `createOrderValidator`
- `updateOrderValidator`
- `updatePaymentStatusValidator`
- `updateFulfillmentStatusValidator`
- `orderQueryValidator`
- `orderStatsQueryValidator`
- `orderIdParamValidator`
- `deleteOrderQueryValidator`

---

## Jobs

### 1. /src/jobs/tokenCleanup.job.ts
**Purpose:** Cleanup expired tokens

**Functions:**
- `cleanupExpiredTokens()` - Remove expired refresh tokens
- `startTokenCleanupJob()` - Start cron job
- `stopTokenCleanupJob()` - Stop cron job

**Schedule:** Daily at 2:00 AM

**Exports:** Job functions

---

### 2. /src/jobs/index.ts
**Purpose:** Job orchestrator

**Functions:**
- `startJobs()` - Start all scheduled jobs
- `stopJobs()` - Stop all jobs

**Exports:** `{ startJobs, stopJobs }`

---

## Database Schema

### /prisma/schema.prisma
**Lines:** 757
**Purpose:** Prisma database schema

**Models:**

**Authentication:**
- `User` - Admin users
- `RefreshToken` - Admin refresh tokens

**Products:**
- `Product` - Base product
- `CafeProduct` - Cafe-specific
- `FlowersProduct` - Flowers-specific
- `BooksProduct` - Books-specific
- `ProductImage` - Images
- `ProductVariant` - Variants

**Inventory:**
- `InventoryItem` - Stock tracking
- `InventoryAdjustment` - Adjustments

**Customers:**
- `Customer` - Customer accounts
- `CustomerAddress` - Addresses
- `CustomerRefreshToken` - Customer tokens

**Orders:**
- `Order` - Orders
- `OrderItem` - Order items
- `ShippingAddress` - Shipping info

**Other:**
- `PurchaseOrder` - Supplier orders
- `PurchaseOrderItem` - PO items
- `Supplier` - Suppliers
- `GiftCard` - Gift cards
- `GiftCardTransaction` - GC transactions
- `Discount` - Discounts

**Enums:**
- `UserRole`, `Section`, `ProductStatus`, `ProductAvailability`
- `CafeCategory`, `RoastLevel`, `CaffeineContent`
- `ArrangementType`, `FlowerColor`, `Occasion`
- `BookFormat`, `BookGenre`
- `InventoryStatus`, `AdjustmentType`
- `PaymentStatus`, `FulfillmentStatus`
- `CustomerStatus`, `CustomerType`
- `PurchaseOrderStatus`, `TransactionType`, `DiscountType`

---

## Entry Points

### 1. /src/app.ts
**Purpose:** Express app configuration

**Exports:** `app` - Configured Express application

**Middleware Stack:**
1. Helmet (security)
2. CORS
3. JSON parser
4. URL-encoded parser
5. Morgan (logging)
6. Rate limiters
7. Routes
8. Error handler

---

### 2. /src/server.ts
**Purpose:** HTTP server entry point

**Process:**
1. Load environment
2. Connect database
3. Connect Redis
4. Start jobs
5. Start HTTP server
6. Handle graceful shutdown

**Exports:** None (entry point)

---

## File Statistics

### Total Files by Category
- **Controllers:** 8 files
- **Services:** 9 files
- **Routes:** 9 files
- **Middleware:** 5 files
- **Configuration:** 7 files
- **Utilities:** 3 files
- **Types:** 7 files
- **Validators:** 2 files
- **Jobs:** 2 files
- **Entry Points:** 2 files

**Total Source Files:** 48 TypeScript files

### Lines of Code
- **Total:** ~9,820 lines
- **Controllers:** ~1,076 lines
- **Services:** ~2,157 lines
- **Routes:** ~2,931 lines
- **Other:** ~3,656 lines

---

## Module Dependencies Graph

```
server.ts (Entry)
  ├─> app.ts (Express App)
  │    ├─> routes/index.ts (Main Router)
  │    │    ├─> auth.routes.ts → auth.controller.ts → auth.service.ts
  │    │    ├─> product.routes.ts → product.controller.ts → product.service.ts
  │    │    ├─> customer-auth.routes.ts → customer-auth.controller.ts → customer-auth.service.ts
  │    │    ├─> customer.routes.ts → customer.controller.ts → customer.service.ts
  │    │    ├─> order.routes.ts → order.controller.ts → order.service.ts
  │    │    └─> guest-order.routes.ts → guest-order.controller.ts → guest-order.service.ts
  │    ├─> middleware/* (All middleware)
  │    └─> config/swagger.ts (API docs)
  ├─> config/database.ts (Prisma)
  ├─> config/redis.ts (Cache)
  ├─> config/s3.ts (Storage)
  └─> jobs/index.ts (Background jobs)
       └─> tokenCleanup.job.ts
```

---

## Key Patterns Used

### 1. MVC with Service Layer
```
Request → Router → Controller → Service → Database
```

### 2. Dependency Injection
```typescript
// Controller uses service
import { productService } from '@/services/product.service';

// Service uses database
import { prisma } from '@/config/database';
```

### 3. Middleware Chain
```typescript
router.post('/products',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  checkSectionAccess('CAFE'),
  createLimiter,
  validator,
  controller
);
```

### 4. Singleton Pattern
```typescript
// database.ts
export const prisma = new PrismaClient();

// redis.ts
export const redis = new Redis();
```

---

## Configuration Files

### package.json
**Dependencies:** 288 packages (including transitive)

**Key Scripts:**
- `dev` - Development server (tsx watch)
- `build` - Compile TypeScript
- `start` - Production server
- `prisma:studio` - Database GUI
- `prisma:migrate` - Run migrations

### tsconfig.json
**TypeScript Configuration:**
- Target: ES2020
- Module: CommonJS
- Strict mode: Enabled
- Path aliases: `@/*` → `src/*`

### .env
**Environment Variables:**
- Database connection
- JWT secrets
- Redis configuration
- S3/MinIO credentials
- SMTP settings
- API keys

---

## Documentation Files

### /Docs/Modules/
- `01-AUTHENTICATION_MODULE.md` - Admin auth documentation
- `02-PRODUCT_MANAGEMENT_MODULE.md` - Product management
- `03-CUSTOMER_AUTHENTICATION_MODULE.md` - Customer auth
- `04-CUSTOMER_MANAGEMENT_MODULE.md` - Customer management
- `05-ORDER_MANAGEMENT_MODULE.md` - Order management
- `06-INFRASTRUCTURE_MODULES.md` - Infrastructure components

### /Docs/General/
- 14 general documentation files
- Setup guides, implementation summaries, coding guidelines

### /Docs/API Docs/
- 5 API documentation files
- Project overview, security guidelines

### /Docs/Testing/
- Testing guidelines

---

## Quick Reference

### Find a Feature
- **Authentication:** `auth.service.ts`
- **Products:** `product.service.ts`
- **Customers:** `customer.service.ts`
- **Orders:** `order.service.ts`
- **Images:** `upload.service.ts`
- **Emails:** `email.service.ts`
- **Cache:** `config/redis.ts`
- **Database:** `config/database.ts`
- **Errors:** `utils/errors.ts`
- **Logging:** `utils/logger.ts`

### Add New Feature
1. Create types in `/src/types/`
2. Create service in `/src/services/`
3. Create controller in `/src/controllers/`
4. Create routes in `/src/routes/`
5. Add validators in `/src/validators/`
6. Mount in `/src/routes/index.ts`
7. Document in `/Docs/Modules/`

---

## Last Updated
**Date:** 2025-01-25
**Codebase Version:** Based on git commit `050e40f`
