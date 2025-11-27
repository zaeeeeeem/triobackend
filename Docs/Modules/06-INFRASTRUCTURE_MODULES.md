# Infrastructure Modules

## Overview
This document covers all infrastructure and support modules including configuration, middleware, utilities, and background jobs that support the main business logic modules.

---

## 1. Configuration Modules

### 1.1 Environment Configuration
**File:** [src/config/env.ts](../../src/config/env.ts)

**Purpose:** Centralized environment variable management with validation

**Configuration Groups:**
```typescript
{
  server: {
    NODE_ENV: 'development' | 'production',
    PORT: 5000,
    API_VERSION: 'v1'
  },
  database: {
    DATABASE_URL: string
  },
  jwt: {
    // Admin JWT
    JWT_SECRET: string,
    JWT_REFRESH_SECRET: string,
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',

    // Customer JWT (separate)
    CUSTOMER_JWT_SECRET: string,
    CUSTOMER_JWT_REFRESH_SECRET: string,
    CUSTOMER_JWT_ACCESS_EXPIRES_IN: '24h',
    CUSTOMER_JWT_REFRESH_EXPIRES_IN: '30d'
  },
  redis: {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: string | undefined,
    REDIS_DB: 0
  },
  aws: {
    AWS_S3_BUCKET: string,
    AWS_S3_ACCESS_KEY_ID: string,
    AWS_S3_SECRET_ACCESS_KEY: string,
    AWS_S3_REGION: string,
    AWS_S3_ENDPOINT: string | undefined,
    AWS_S3_PUBLIC_URL: string
  },
  cors: {
    CORS_ORIGIN: string[]
  },
  rateLimiting: {
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100
  },
  fileUpload: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES_PER_PRODUCT: 10
  },
  pagination: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },
  sessions: {
    MAX_ACTIVE_SESSIONS: 5
  }
}
```

**Validation:**
- Validates required variables on startup
- Throws error if critical variables missing
- Provides defaults for optional variables

---

### 1.2 Database Configuration
**File:** [src/config/database.ts](../../src/config/database.ts)

**Purpose:** Prisma ORM client initialization

**Features:**
- Singleton pattern (single client instance)
- Connection pooling
- Query logging in development mode
- Graceful shutdown handling

**Usage:**
```typescript
import { prisma } from '@/config/database';

const users = await prisma.user.findMany();
```

---

### 1.3 Redis Configuration
**File:** [src/config/redis.ts](../../src/config/redis.ts)

**Purpose:** Redis cache client with helper functions

**Client Setup:**
```typescript
const redis = new Redis({
  host: env.redis.REDIS_HOST,
  port: env.redis.REDIS_PORT,
  password: env.redis.REDIS_PASSWORD,
  db: env.redis.REDIS_DB,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});
```

**Helper Functions:**
```typescript
// Get cached data
async get<T>(key: string): Promise<T | null>

// Set cached data with TTL
async set(key: string, value: any, ttl: number): Promise<void>

// Delete cached data
async del(key: string): Promise<void>

// Invalidate by pattern
async invalidatePattern(pattern: string): Promise<void>
```

**Usage:**
```typescript
import { cache } from '@/config/redis';

// Cache product list
await cache.set('products:list', products, 300); // 5 min TTL

// Retrieve cached data
const products = await cache.get<Product[]>('products:list');

// Clear cache
await cache.invalidatePattern('products:*');
```

---

### 1.4 S3/MinIO Configuration
**File:** [src/config/s3.ts](../../src/config/s3.ts)

**Purpose:** AWS S3 or MinIO client for file storage

**Client Setup:**
```typescript
const s3Client = new S3Client({
  region: env.aws.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.aws.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.aws.AWS_S3_SECRET_ACCESS_KEY
  },
  endpoint: env.aws.AWS_S3_ENDPOINT, // For MinIO
  forcePathStyle: true // Required for MinIO
});
```

**Features:**
- Support for AWS S3 and MinIO
- Public URL generation
- Multipart upload support
- File deletion

---

### 1.5 Swagger Configuration
**File:** [src/config/swagger.ts](../../src/config/swagger.ts)

**Purpose:** API documentation generation

**Features:**
- Auto-generates OpenAPI spec from JSDoc comments
- Interactive API explorer at `/api-docs`
- JSON specification at `/api-docs.json`
- Security definitions (Bearer token)

**Swagger Definition:**
```typescript
{
  openapi: '3.0.0',
  info: {
    title: 'TRIO Shopify Server API',
    version: '1.0.0',
    description: 'Multi-section E-commerce API'
  },
  servers: [
    { url: '/api/v1' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}
```

---

## 2. Middleware

### 2.1 Authentication Middleware
**File:** [src/middleware/auth.ts](../../src/middleware/auth.ts)

**Functions:**

**authenticate()**
```typescript
// Verify admin JWT token
// Inject user into req.user
router.get('/protected', authenticate, controller);
```

**authorize(...roles)**
```typescript
// Check user role
router.post('/admin-only', authenticate, authorize('ADMIN'), controller);
```

**checkSectionAccess(section)**
```typescript
// Verify section access for managers
router.post('/cafe-products', authenticate, checkSectionAccess('CAFE'), controller);
```

---

### 2.2 Customer Authentication Middleware
**File:** [src/middleware/customer-auth.ts](../../src/middleware/customer-auth.ts)

**Functions:**

**authenticateCustomer()**
```typescript
// Verify customer JWT token
// Inject customer into req.customer
router.get('/profile', authenticateCustomer, controller);
```

**optionalCustomerAuth()**
```typescript
// Optional customer authentication (supports guest)
router.post('/orders', optionalCustomerAuth, controller);
```

---

### 2.3 Error Handler Middleware
**File:** [src/middleware/errorHandler.ts](../../src/middleware/errorHandler.ts)

**Purpose:** Centralized error handling

**Handled Error Types:**
- Custom AppError instances
- Prisma errors (P2002, P2025, etc.)
- JWT errors (TokenExpiredError, JsonWebTokenError)
- Validation errors
- Generic server errors

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  }
}
```

**Prisma Error Mapping:**
- P2002: Unique constraint violation → 409 Conflict
- P2025: Record not found → 404 Not Found
- P2003: Foreign key constraint → 400 Bad Request

---

### 2.4 Validation Middleware
**File:** [src/middleware/validation.ts](../../src/middleware/validation.ts)

**Purpose:** Input validation using express-validator

**Usage:**
```typescript
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const createUserValidator = [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  validate // Execute validation
];

router.post('/users', createUserValidator, controller);
```

**Validation Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

---

### 2.5 Rate Limiter Middleware
**File:** [src/middleware/rateLimiter.ts](../../src/middleware/rateLimiter.ts)

**Purpose:** API rate limiting to prevent abuse

**Limiters:**

**generalLimiter**
- 100 requests per minute
- Applied to most routes

**createLimiter**
- 10 create requests per minute
- Applied to POST/PUT endpoints

**uploadLimiter**
- 5 upload requests per minute
- Applied to file upload endpoints

**bulkLimiter**
- 5 bulk operations per 5 minutes
- Applied to bulk update/delete endpoints

**Usage:**
```typescript
import { generalLimiter, uploadLimiter } from '@/middleware/rateLimiter';

router.get('/products', generalLimiter, controller);
router.post('/products/images', uploadLimiter, controller);
```

**Rate Limit Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## 3. Utilities

### 3.1 API Response Handler
**File:** [src/utils/apiResponse.ts](../../src/utils/apiResponse.ts)

**Purpose:** Standardized API response formatting

**Methods:**

**success(res, data, message?)**
```typescript
return apiResponse.success(res, { user }, 'User created successfully');
// Output:
{
  "success": true,
  "data": { "user": {...} },
  "message": "User created successfully"
}
```

**error(res, statusCode, code, message, details?)**
```typescript
return apiResponse.error(res, 404, 'NOT_FOUND', 'User not found');
// Output:
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

**paginated(res, data, pagination)**
```typescript
return apiResponse.paginated(res, { items }, {
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
  hasMore: true
});
// Output:
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

---

### 3.2 Custom Errors
**File:** [src/utils/errors.ts](../../src/utils/errors.ts)

**Purpose:** Custom error classes for different scenarios

**Error Classes:**

```typescript
class AppError extends Error {
  statusCode: number;
  code: string;
}

class ValidationError extends AppError {
  // 400 Bad Request
}

class UnauthorizedError extends AppError {
  // 401 Unauthorized
}

class ForbiddenError extends AppError {
  // 403 Forbidden
}

class NotFoundError extends AppError {
  // 404 Not Found
}

class ConflictError extends AppError {
  // 409 Conflict
}

class DatabaseError extends AppError {
  // 500 Internal Server Error
}
```

**Usage:**
```typescript
import { NotFoundError } from '@/utils/errors';

if (!user) {
  throw new NotFoundError('User not found');
}
```

---

### 3.3 Logger
**File:** [src/utils/logger.ts](../../src/utils/logger.ts)

**Purpose:** Winston-based logging system

**Log Levels:**
- error
- warn
- info
- http
- debug

**Outputs:**
- Console (colorized)
- `logs/error.log` - Error logs only
- `logs/all.log` - All logs

**Usage:**
```typescript
import logger from '@/utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err.message });
logger.debug('Request payload', { body: req.body });
```

**Log Format:**
```
2025-01-25 10:30:45 [INFO]: User logged in {"userId":"uuid"}
2025-01-25 10:31:12 [ERROR]: Database error {"error":"Connection timeout"}
```

---

## 4. Background Jobs

### 4.1 Token Cleanup Job
**File:** [src/jobs/tokenCleanup.job.ts](../../src/jobs/tokenCleanup.job.ts)

**Purpose:** Automatic cleanup of expired refresh tokens

**Schedule:** Daily at 2:00 AM (configurable via cron)

**Process:**
1. Query all refresh tokens with `expiresAt < now()`
2. Delete expired tokens from database
3. Log deleted count
4. Free up database space

**Cron Expression:**
```typescript
// Every day at 2:00 AM
'0 2 * * *'
```

**Manual Execution:**
```typescript
import { cleanupExpiredTokens } from '@/jobs/tokenCleanup.job';

await cleanupExpiredTokens();
```

**Configuration:**
```env
ENABLE_TOKEN_CLEANUP=true
TOKEN_CLEANUP_SCHEDULE='0 2 * * *'
```

---

### 4.2 Job Orchestrator
**File:** [src/jobs/index.ts](../../src/jobs/index.ts)

**Purpose:** Manage and schedule all background jobs

**Features:**
- Start all scheduled jobs
- Stop all jobs on shutdown
- Manual job execution
- Job status monitoring

**Usage:**
```typescript
import { startJobs, stopJobs } from '@/jobs';

// On server start
await startJobs();

// On server shutdown
await stopJobs();
```

---

## 5. Upload Service

**File:** [src/services/upload.service.ts](../../src/services/upload.service.ts)

**Purpose:** Image upload and processing

**Features:**
- Image upload to S3/MinIO
- Image optimization with Sharp
- Multi-size generation (original, medium, thumbnail)
- WebP format conversion
- Image reordering
- Image deletion

**Functions:**

**uploadProductImages(productId, files)**
```typescript
// Upload multiple images
// Generate 3 sizes per image
// Store URLs in database
```

**deleteProductImage(productId, imageId)**
```typescript
// Delete all 3 sizes from S3
// Remove database record
```

**reorderProductImages(productId, imageOrder)**
```typescript
// Update position field
// Change display order
```

**Image Sizes:**
- Original: 1200px max dimension, WebP, high quality
- Medium: 600px max dimension, WebP, medium quality
- Thumbnail: 200px max dimension, WebP, low quality

**Storage Path:**
```
s3://bucket/products/{productId}/images/
  ├─ {imageId}_original.webp
  ├─ {imageId}_medium.webp
  └─ {imageId}_thumbnail.webp
```

---

## 6. Email Service

**File:** [src/services/email.service.ts](../../src/services/email.service.ts)

**Purpose:** Email sending via SMTP

**Email Types:**
- Welcome emails
- Email verification
- Password reset
- Order confirmation
- Shipping notification
- Delivery confirmation

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=password
SMTP_FROM=TRIO Shop <noreply@example.com>
```

**Functions:**

**sendVerificationEmail(email, token)**
```typescript
// Send email verification link
// Token expires in 24 hours
```

**sendPasswordResetEmail(email, code)**
```typescript
// Send 6-digit reset code
// Code expires in 1 hour
```

**sendOrderConfirmationEmail(order)**
```typescript
// Send order summary
// Include order number and items
```

---

## 7. Validators

**Location:** [src/validators/](../../src/validators/)

**Files:**
- `order.validator.ts` - Order validation rules

**Purpose:** Reusable validation chains using express-validator

**Example:**
```typescript
export const createOrderValidator = [
  body('customer.name').trim().notEmpty(),
  body('customer.email').isEmail(),
  body('section').isIn(['CAFE', 'FLOWERS', 'BOOKS']),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isUUID(),
  body('items.*.quantity').isInt({ min: 1, max: 1000 }),
  validate
];
```

---

## 8. Type Definitions

**Location:** [src/types/](../../src/types/)

**Files:**
- `product.types.ts` - Product DTOs and interfaces
- `customer.types.ts` - Customer DTOs
- `customer-auth.types.ts` - Customer auth DTOs
- `address.types.ts` - Address DTOs
- `order.types.ts` - Order DTOs

**Purpose:**
- Type safety for TypeScript
- Request/response interfaces
- Service method signatures
- DTO (Data Transfer Object) definitions

**Example:**
```typescript
// product.types.ts
export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  section: Section;
  cafeProduct?: CreateCafeProductDTO;
}

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  // ... other fields
}
```

---

## 9. Application Entry Points

### 9.1 Express App Setup
**File:** [src/app.ts](../../src/app.ts)

**Purpose:** Configure Express application

**Middleware Stack:**
1. Helmet (security headers)
2. CORS
3. JSON body parser
4. URL-encoded body parser
5. Request logging (Morgan)
6. Rate limiters
7. Routes
8. Error handler

**Features:**
- Security headers
- CORS configuration
- Request logging
- API versioning
- Health check endpoint
- Swagger documentation

---

### 9.2 Server Entry Point
**File:** [src/server.ts](../../src/server.ts)

**Purpose:** Start HTTP server

**Process:**
1. Load environment variables
2. Connect to database
3. Connect to Redis
4. Start background jobs
5. Start HTTP server
6. Handle graceful shutdown

**Graceful Shutdown:**
```typescript
process.on('SIGTERM', async () => {
  await stopJobs();
  await prisma.$disconnect();
  await redis.quit();
  server.close();
});
```

---

## 10. Health Check

**Endpoint:** `GET /api/v1/health`

**Purpose:** Monitor service health

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-25T10:30:00Z",
    "uptime": 3600,
    "database": "connected",
    "redis": "connected",
    "version": "1.0.0"
  }
}
```

**Checks:**
- Server running
- Database connection
- Redis connection
- Memory usage

---

## Configuration Summary

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trio_db

# JWT (Admin)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# JWT (Customer)
CUSTOMER_JWT_SECRET=customer-secret-key
CUSTOMER_JWT_REFRESH_SECRET=customer-refresh-secret

# S3/MinIO
AWS_S3_BUCKET=trio-shop
AWS_S3_ACCESS_KEY_ID=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-password
```

### Optional Environment Variables
```env
NODE_ENV=development
PORT=5000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CORS_ORIGIN=http://localhost:3000
```

---

## Performance Considerations

### Caching Strategy
- Redis for product listings (5 min TTL)
- Cache invalidation on updates
- Cache key patterns for easy invalidation

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization

### File Storage
- CDN-ready URLs
- Image optimization (WebP format)
- Multiple image sizes for responsive design

### Rate Limiting
- Prevent abuse
- Different limits for different operations
- IP-based rate limiting

---

## Security Features

### CORS
- Whitelist-based origin control
- Credentials support
- Pre-flight request handling

### Helmet
- XSS protection
- Content Security Policy
- DNS prefetch control
- Frameguard
- HSTS

### Rate Limiting
- Prevent brute force attacks
- DDoS protection
- Resource exhaustion prevention

### Input Validation
- Express-validator
- Sanitization
- Type checking

### JWT Security
- Short-lived access tokens
- Refresh token rotation
- Token reuse detection
- Secure token storage

---

## Monitoring and Logging

### Logging Levels
- Production: info, warn, error
- Development: all levels including debug

### Log Rotation
- Daily log rotation
- Maximum file size: 20MB
- Keep last 14 days

### Error Tracking
- Stack traces in development
- Sanitized errors in production
- Error correlation IDs

---

## Related Documentation
- [Authentication Module](./01-AUTHENTICATION_MODULE.md)
- [Product Management Module](./02-PRODUCT_MANAGEMENT_MODULE.md)
- [Complete Setup Guide](../General/COMPLETE_SETUP_GUIDE.md)
- [Security Guidelines](../API%20Docs/Security-Guidelines.md)
