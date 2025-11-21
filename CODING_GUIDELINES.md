# TRIO E-Commerce - Coding Guidelines & Best Practices

This document outlines critical coding practices and lessons learned from our development process to prevent common errors and maintain code quality.

## Table of Contents
1. [TypeScript Best Practices](#typescript-best-practices)
2. [Express Controller Patterns](#express-controller-patterns)
3. [Authentication & Security](#authentication--security)
4. [Error Handling](#error-handling)
5. [API Documentation](#api-documentation)
6. [ESLint Configuration](#eslint-configuration)
7. [Database & Prisma](#database--prisma)
8. [CORS Configuration](#cors-configuration)

---

## TypeScript Best Practices

### 1. Never Use `any` Type
**❌ Bad:**
```typescript
function processData(data: any): any {
  return data;
}
```

**✅ Good:**
```typescript
function processData(data: unknown): Record<string, unknown> {
  return data as Record<string, unknown>;
}
```

**Guidelines:**
- Use `unknown` for values of truly unknown type
- Use `Record<string, unknown>` for generic objects
- Use proper interfaces/types when structure is known
- Use type guards for narrowing unknown types

### 2. Explicit Return Types for Controllers
All Express controller methods must have explicit `Promise<void>` return type.

**❌ Bad:**
```typescript
async register(req: Request, res: Response, next: NextFunction) {
  // TypeScript error: Not all code paths return a value
  try {
    const user = await authService.register(req.body);
    ApiResponseHandler.success(res, { user }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
}
```

**✅ Good:**
```typescript
async register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.register(req.body);
    ApiResponseHandler.success(res, { user }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
}
```

### 3. JWT Signing with Proper Types
Always import and use `SignOptions` type for JWT signing options.

**❌ Bad:**
```typescript
import jwt from 'jsonwebtoken';

return jwt.sign(payload, secret, {
  expiresIn: '1h',
}); // TypeScript error
```

**✅ Good:**
```typescript
import jwt, { SignOptions } from 'jsonwebtoken';

return jwt.sign(payload, secret, {
  expiresIn: '1h',
} as SignOptions);
```

### 4. Handle Null vs Undefined in Prisma
Prisma returns `null` for optional fields, but TypeScript interfaces often use `undefined`. Convert appropriately.

**❌ Bad:**
```typescript
const userPayload = {
  id: user.id,
  assignedSection: user.assignedSection, // might be null
};
```

**✅ Good:**
```typescript
const userPayload = {
  id: user.id,
  assignedSection: user.assignedSection ?? undefined,
};
```

### 5. Proper Error Type Checking
Always check error types before accessing properties.

**❌ Bad:**
```typescript
catch (error) {
  logger.error('Error:', error.message); // TypeScript error
}
```

**✅ Good:**
```typescript
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Error:', message);
}
```

---

## Express Controller Patterns

### 1. Standard Controller Method Structure
All controller methods should follow this pattern:

```typescript
async methodName(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract and validate input
    const { param1, param2 } = req.body;

    // 2. Call service layer
    const result = await service.doSomething(param1, param2);

    // 3. Send success response (no return needed)
    ApiResponseHandler.success(res, result, 'Success message');
  } catch (error) {
    // 4. Pass errors to error handler middleware
    next(error);
  }
}
```

**Key Points:**
- Always declare return type as `Promise<void>`
- Never return the response - `ApiResponseHandler` sends it
- Always catch errors and pass to `next()`
- Keep controllers thin - business logic belongs in services

### 2. File Upload Validation
Always validate file uploads before processing.

**❌ Bad:**
```typescript
async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      ApiResponseHandler.error(res, 'NO_FILES', 'No files uploaded', 400);
      // Missing return - code continues executing!
    }
    const images = await uploadService.uploadProductImages(req.params.id, req.files);
    // ...
  }
}
```

**✅ Good:**
```typescript
async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      ApiResponseHandler.error(res, 'NO_FILES', 'No files uploaded', 400);
      return; // Stop execution
    }
    const images = await uploadService.uploadProductImages(req.params.id, req.files);
    ApiResponseHandler.success(res, { images }, `${images.length} images uploaded`, 201);
  } catch (error) {
    next(error);
  }
}
```

---

## Authentication & Security

### 1. Refresh Token Storage
Always store refresh tokens in database with expiration dates.

```typescript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

await prisma.refreshToken.create({
  data: {
    token: refreshToken,
    userId: user.id,
    expiresAt,
  },
});
```

### 2. Token Payload Structure
Keep access tokens minimal, refresh tokens even more minimal.

**Access Token Payload:**
```typescript
{
  sub: user.id,           // Subject (user ID)
  email: user.email,      // For convenience
  role: user.role,        // For authorization
  assignedSection: user.assignedSection, // Optional business logic
}
```

**Refresh Token Payload:**
```typescript
{
  sub: user.id,           // Only user ID needed
}
```

### 3. Password Hashing
Always use bcrypt with appropriate salt rounds.

```typescript
import bcrypt from 'bcryptjs';

// Hashing (10 rounds is standard)
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

---

## Error Handling

### 1. Custom Error Classes
Use custom error classes with proper status codes.

```typescript
// Always extend AppError
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

// Usage
if (existingUser) {
  throw new ValidationError('User with this email already exists');
}
```

### 2. Error Response Format
All errors should follow the standard format:

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details?: { /* optional additional info */ }
  }
}
```

### 3. Generic Error Handling in Services
Always catch and rethrow with meaningful messages.

```typescript
try {
  await redis.setex(key, ttl, JSON.stringify(value));
} catch (error) {
  logger.error(`Cache set error for key ${key}:`, error);
  // Don't throw - cache failures shouldn't break app
}
```

---

## API Documentation

### 1. Swagger Annotations
Every route must have complete Swagger documentation.

```typescript
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authValidation.register, validate, authController.register);
```

### 2. API Contract Consistency
**CRITICAL:** Swagger documentation MUST match actual API implementation.

**❌ Wrong:**
```typescript
// Swagger says: { name: string }
// Validation expects: { firstName: string, lastName: string }
```

**✅ Correct:**
```typescript
// Both Swagger and validation expect:
// { firstName: string, lastName: string }
```

### 3. Authentication Documentation
Document BOTH Bearer token AND body parameters when needed.

```typescript
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     security:
 *       - bearerAuth: []    # Shows lock icon in Swagger UI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               refreshToken:
 *                 type: string
 */
```

---

## ESLint Configuration

### 1. Node.js Globals
Always configure ESLint to recognize Node.js built-in globals.

**File: `eslint.config.mjs`**
```javascript
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,  // Includes process, Buffer, __dirname, etc.
      },
    },
  },
];
```

This prevents errors like:
- `'process' is not defined.eslintno-undef`
- `'Buffer' is not defined.eslintno-undef`

### 2. TypeScript-Specific Rules
```javascript
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',        // Warn on any usage
    '@typescript-eslint/explicit-function-return-type': 'off',  // Too verbose
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

---

## Database & Prisma

### 1. Query Event Logging
Use proper TypeScript types for Prisma events.

**❌ Bad:**
```typescript
prisma.$on('query', (e: any) => {
  logger.debug(e.query);
});
```

**✅ Good:**
```typescript
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}
```

### 2. Unique Constraint Handling
Always check for existing records before creating.

```typescript
const existingUser = await prisma.user.findUnique({
  where: { email: data.email },
});

if (existingUser) {
  throw new ValidationError('User with this email already exists');
}
```

### 3. Select Sensitive Fields Carefully
Never return password hashes or sensitive data.

```typescript
const user = await prisma.user.create({
  data: userData,
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    // password: false (excluded by default when using select)
  },
});
```

---

## CORS Configuration

### 1. Multiple Origin Support
Support frontend, Swagger UI, and development tools.

```typescript
const allowedOrigins = [
  ...env.ALLOWED_ORIGINS,              // From .env
  `http://localhost:${env.PORT}`,      // For Swagger UI (same-origin)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### 2. Development vs Production
```typescript
// .env.development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

// .env.production
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

---

## Common Pitfalls Checklist

Before committing code, verify:

- [ ] No `any` types used (use `unknown` or `Record<string, unknown>`)
- [ ] All controller methods have `Promise<void>` return type
- [ ] All routes have Swagger documentation
- [ ] Swagger docs match actual API contract
- [ ] JWT signing uses `SignOptions` type assertion
- [ ] Error handling uses custom error classes
- [ ] Prisma null values converted to undefined where needed
- [ ] File upload validation includes early return
- [ ] ESLint recognizes Node.js globals
- [ ] CORS allows necessary origins including same-origin for Swagger
- [ ] Password fields excluded from API responses
- [ ] Refresh tokens stored in database with expiration

---

## Project-Specific Conventions

### 1. File Structure
```
src/
├── config/          # Configuration (database, redis, s3, swagger)
├── controllers/     # Express route handlers (thin layer)
├── services/        # Business logic
├── middleware/      # Express middleware (auth, validation, error handling)
├── routes/          # Route definitions with Swagger annotations
├── utils/           # Utilities (errors, apiResponse, logger)
└── types/           # TypeScript type definitions
```

### 2. Service Layer Pattern
Controllers should ONLY:
- Extract request data
- Call service methods
- Send responses
- Pass errors to error handler

Services should:
- Contain all business logic
- Interact with database
- Handle complex operations
- Throw custom errors

### 3. Response Format
All API responses use `ApiResponseHandler`:

```typescript
// Success
ApiResponseHandler.success(res, data, 'Success message', statusCode);

// Error (rarely needed - use custom error classes instead)
ApiResponseHandler.error(res, 'ERROR_CODE', 'Error message', statusCode);

// Paginated
ApiResponseHandler.paginated(res, items, page, limit, totalItems);
```

---

## Testing Best Practices

### 1. Use Swagger UI for Testing
- Access at `http://localhost:5000/api-docs`
- Test authentication flow: Register → Login → Use token
- Verify all response schemas match documentation

### 2. Authentication Testing Flow
```
1. POST /api/v1/auth/register → Get user object
2. POST /api/v1/auth/login → Get accessToken & refreshToken
3. Click "Authorize" button in Swagger UI
4. Enter: Bearer <accessToken>
5. Test protected endpoints
6. POST /api/v1/auth/refresh → Get new accessToken
7. POST /api/v1/auth/logout → Invalidate refreshToken
```

---

## Security Considerations

### 1. Environment Variables
Never commit sensitive values:
```
JWT_SECRET=          # Generate with: openssl rand -base64 32
JWT_REFRESH_SECRET=  # Generate with: openssl rand -base64 32
DATABASE_URL=        # PostgreSQL connection string
AWS_S3_ACCESS_KEY_ID=
AWS_S3_SECRET_ACCESS_KEY=
```

### 2. Rate Limiting
Applied globally and per-route as needed:
```typescript
// General rate limit: 100 requests per 15 minutes
app.use(generalLimiter);

// Stricter for auth: 5 login attempts per 15 minutes
router.post('/login', authLimiter, authController.login);
```

### 3. Input Validation
Always use express-validator:
```typescript
export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
};
```

---

## Maintenance & Updates

### Update This Document When:
1. New patterns emerge from debugging
2. TypeScript best practices change
3. New security vulnerabilities discovered
4. API structure changes significantly
5. Development tools updated (ESLint, TypeScript, etc.)

### Review Frequency:
- After each major debugging session
- Before onboarding new developers
- During quarterly code quality reviews

---

**Last Updated:** 2025-11-21
**Version:** 1.0.0
