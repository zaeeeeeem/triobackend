# API Security Guidelines
## Critical Security Requirements for TRIO Backend

**Version:** 1.0.0
**Priority:** 🔴 CRITICAL
**Last Updated:** November 19, 2025

---

## Overview

This document outlines **critical security requirements** that MUST be implemented in the backend API to prevent financial fraud, data breaches, and system abuse.

**⚠️ WARNING:** Failure to implement these security measures could result in:
- Financial losses (price manipulation attacks)
- Data breaches (customer information exposed)
- Inventory fraud (overselling, stock manipulation)
- Legal liability (GDPR violations, financial fraud)
- Reputation damage

---

## Table of Contents

1. [Price Manipulation Prevention](#price-manipulation-prevention)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting & Abuse Prevention](#rate-limiting--abuse-prevention)
5. [Database Security](#database-security)
6. [API Security Headers](#api-security-headers)
7. [Logging & Monitoring](#logging--monitoring)
8. [Encryption & Data Protection](#encryption--data-protection)
9. [Security Testing Checklist](#security-testing-checklist)

---

## 1. Price Manipulation Prevention

### 🚨 CRITICAL: Never Trust Client Prices

**The Problem:**
Frontend sends order data that could be manipulated by malicious users to change prices, totals, or discounts.

**The Attack:**
```javascript
// Attacker intercepts request and changes:
{
  "items": [
    {
      "productId": "expensive-product",
      "quantity": 1,
      "price": 0.01  // ❌ Changed from $1000 to $0.01
    }
  ],
  "total": 0.01  // ❌ Manipulated total
}
```

### ✅ Solution: Server-Side Price Calculation

**What Frontend Should Send:**
```json
{
  "items": [
    {
      "productId": "prod-123",
      "variantId": "var-456",  // Optional
      "quantity": 2
      // ❌ NO price, NO total
    }
  ]
  // ❌ NO subtotal, NO tax, NO total
}
```

**What Backend Must Do:**

```javascript
async function createOrder(requestData) {
  const orderItems = [];
  let calculatedSubtotal = 0;

  // 1. Fetch CURRENT prices from database
  for (const item of requestData.items) {
    const product = await db.products.findById(item.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // Get price from DATABASE, not from request
    let price = product.price;

    // Handle variants
    if (item.variantId) {
      const variant = await db.variants.findById(item.variantId);
      price = variant.price;
    }

    // Calculate line total
    const lineTotal = price * item.quantity;
    calculatedSubtotal += lineTotal;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: price,        // ✅ From database
      total: lineTotal     // ✅ Calculated
    });
  }

  // 2. Calculate tax (from server config)
  const taxRate = 0.18;  // 18% GST
  const tax = calculatedSubtotal * taxRate;

  // 3. Calculate shipping (validate if provided)
  const shipping = await calculateShipping(requestData.address);

  // 4. Calculate final total
  const total = calculatedSubtotal + tax + shipping;

  // 5. Create order with CALCULATED values
  return await db.orders.create({
    ...requestData,
    items: orderItems,
    subtotal: calculatedSubtotal,  // ✅ Calculated
    tax: tax,                       // ✅ Calculated
    shipping: shipping,             // ✅ Calculated/Validated
    total: total                    // ✅ Calculated
  });
}
```

### Additional Price Security Measures

**1. Discount Code Validation:**
```javascript
async function validateDiscount(code, subtotal, userId) {
  const discount = await db.discounts.findByCode(code);

  // Check if discount exists
  if (!discount) {
    throw new Error("Invalid discount code");
  }

  // Check expiry
  if (discount.expiresAt < new Date()) {
    throw new Error("Discount code expired");
  }

  // Check usage limits
  if (discount.usageCount >= discount.usageLimit) {
    throw new Error("Discount code usage limit reached");
  }

  // Check per-user limit
  const userUsage = await db.discountUsage.countForUser(discount.id, userId);
  if (userUsage >= discount.perUserLimit) {
    throw new Error("You've already used this discount");
  }

  // Check minimum order amount
  if (subtotal < discount.minOrderAmount) {
    throw new Error(`Minimum order of ${discount.minOrderAmount} required`);
  }

  return discount;
}
```

**2. Price Change Monitoring:**
```javascript
// Before creating order, log the prices being used
await db.auditLog.create({
  action: "ORDER_PRICE_CALCULATION",
  orderId: order.id,
  items: orderItems.map(item => ({
    productId: item.productId,
    priceUsed: item.price,
    priceSource: "database",
    timestamp: new Date()
  }))
});

// Alert on suspiciously low totals
if (total < 10 && orderItems.length > 0) {
  await alertSecurity({
    type: "SUSPICIOUS_LOW_TOTAL",
    orderId: order.id,
    total: total,
    items: orderItems.length
  });
}
```

---

## 2. Authentication & Authorization

### JWT Token Implementation

**Access Token (Short-lived):**
- Expiry: 15 minutes
- Storage: Frontend memory/state (NOT localStorage)
- Payload: User ID, email, role, permissions

**Refresh Token (Long-lived):**
- Expiry: 7 days
- Storage: HTTP-only cookie
- One-time use (rotate on refresh)
- Store hash in database

**Implementation:**

```javascript
// Login endpoint
async function login(email, password) {
  // 1. Find user
  const user = await db.users.findByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // 2. Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // 3. Generate tokens
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = generateRandomToken();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // 4. Store refresh token in database
  await db.refreshTokens.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return {
    accessToken,
    refreshToken  // Send as HTTP-only cookie
  };
}
```

### Role-Based Access Control (RBAC)

**Roles:**
- `admin` - Full access
- `manager` - Section-specific access
- `staff` - Read-only + limited write

**Middleware:**

```javascript
function authorize(requiredPermission) {
  return async (req, res, next) => {
    // 1. Verify JWT
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 2. Check permission
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Usage
app.post("/api/orders", authorize("orders:create"), createOrder);
app.get("/api/orders", authorize("orders:read"), getOrders);
app.delete("/api/orders/:id", authorize("orders:delete"), deleteOrder);
```

### Password Security

```javascript
// Password hashing (NEVER store plain text)
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;  // Minimum 10, recommended 12

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Password validation rules
function validatePassword(password) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain number");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    throw new Error("Password must contain special character");
  }

  return true;
}
```

---

## 3. Input Validation & Sanitization

### Prevent SQL Injection

**❌ NEVER do this:**
```javascript
// Vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**✅ Always do this:**
```javascript
// Use parameterized queries
const query = "SELECT * FROM users WHERE email = ?";
const result = await db.query(query, [email]);

// Or use ORM (Prisma, TypeORM)
const user = await prisma.user.findUnique({
  where: { email }
});
```

### Prevent XSS Attacks

```javascript
const sanitizeHtml = require("sanitize-html");

function sanitizeInput(data) {
  // Remove HTML tags from text inputs
  if (data.notes) {
    data.notes = sanitizeHtml(data.notes, {
      allowedTags: [],  // No HTML allowed
      allowedAttributes: {}
    });
  }

  // Sanitize customer name (allow only letters, spaces, hyphens)
  if (data.customer?.name) {
    data.customer.name = data.customer.name.replace(/[^a-zA-Z\s\-]/g, "");
  }

  // Sanitize tags
  if (data.tags) {
    data.tags = data.tags.map(tag =>
      tag.replace(/[^a-zA-Z0-9\s\-_]/g, "").slice(0, 50)
    );
  }

  return data;
}
```

### Input Validation Schema

```javascript
const Joi = require("joi");

const orderSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
  }).required(),

  section: Joi.string().valid("cafe", "flowers", "books").required(),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        variantId: Joi.string().uuid().optional(),
        quantity: Joi.number().integer().min(1).max(1000).required()
      })
    )
    .min(1)
    .required(),

  shippingAddress: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    address: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    postalCode: Joi.string().min(4).max(10).required()
  }).optional(),

  notes: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
});

// Usage
async function createOrder(req, res) {
  const { error, value } = orderSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.details[0].message
      }
    });
  }

  // Proceed with validated data
  const order = await orderService.create(value);
  res.status(201).json({ success: true, data: order });
}
```

---

## 4. Rate Limiting & Abuse Prevention

### Implement Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,  // 100 requests per minute
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later"
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for order creation
const orderCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,  // 10 orders per hour
  message: {
    success: false,
    error: {
      code: "ORDER_LIMIT_EXCEEDED",
      message: "Maximum orders per hour exceeded"
    }
  }
});

// Login rate limit (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 login attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Account locked. Try again in 15 minutes"
    }
  }
});

// Apply limiters
app.use("/api", apiLimiter);
app.post("/api/orders", orderCreationLimiter, createOrder);
app.post("/api/auth/login", loginLimiter, login);
```

### Prevent Duplicate Orders (Idempotency)

```javascript
async function createOrder(req, res) {
  // 1. Get idempotency key from header
  const idempotencyKey = req.headers["idempotency-key"];

  if (!idempotencyKey) {
    return res.status(400).json({
      error: "Idempotency-Key header required"
    });
  }

  // 2. Check if order with this key already exists
  const existingOrder = await db.orders.findByIdempotencyKey(idempotencyKey);

  if (existingOrder) {
    // Return existing order (prevents duplicate)
    return res.status(200).json({
      success: true,
      data: existingOrder,
      message: "Order already created"
    });
  }

  // 3. Create new order with idempotency key
  const order = await db.orders.create({
    ...orderData,
    idempotencyKey
  });

  res.status(201).json({ success: true, data: order });
}
```

### Prevent Inventory Manipulation

```javascript
async function validateInventory(items) {
  for (const item of items) {
    // 1. Get available stock
    const inventory = await db.inventory.findByProductId(item.productId);

    if (!inventory) {
      throw new Error(`Product ${item.productId} not found in inventory`);
    }

    // 2. Check available quantity
    const available = inventory.onHand - inventory.committed;

    if (item.quantity > available) {
      throw new Error(
        `Only ${available} units available for ${inventory.productName}`
      );
    }

    // 3. Prevent unreasonably large orders
    if (item.quantity > 1000) {
      throw new Error("Quantity exceeds maximum allowed (1000)");
    }

    // 4. Check for suspicious patterns
    const recentOrdersForProduct = await db.orders.countRecent(
      item.productId,
      req.user.id,
      "1 hour"
    );

    if (recentOrdersForProduct > 5) {
      await alertSecurity({
        type: "SUSPICIOUS_ORDER_PATTERN",
        userId: req.user.id,
        productId: item.productId,
        count: recentOrdersForProduct
      });
    }
  }
}
```

---

## 5. Database Security

### Use Database Transactions

```javascript
async function createOrder(orderData) {
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Create order
    const order = await db.orders.create(orderData, { transaction });

    // 2. Create order items
    await db.orderItems.bulkCreate(order.items, { transaction });

    // 3. Reserve inventory
    for (const item of order.items) {
      await db.inventory.update(
        {
          committed: db.sequelize.literal(`committed + ${item.quantity}`)
        },
        {
          where: { productId: item.productId },
          transaction
        }
      );
    }

    // 4. Update discount usage
    if (orderData.discountCode) {
      await db.discounts.increment("usageCount", {
        where: { code: orderData.discountCode },
        transaction
      });
    }

    // Commit all changes
    await transaction.commit();
    return order;

  } catch (error) {
    // Rollback on any error
    await transaction.rollback();
    throw error;
  }
}
```

### Database Connection Security

```javascript
// Use environment variables for credentials
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: "postgres",

  // SSL/TLS for production
  dialectOptions: {
    ssl: process.env.NODE_ENV === "production" ? {
      require: true,
      rejectUnauthorized: true
    } : false
  },

  // Connection pooling
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
};
```

### Sensitive Data Encryption

```javascript
const crypto = require("crypto");

// Encrypt sensitive data at rest
function encrypt(text) {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

// Example: Encrypt credit card info (if stored)
const user = await db.users.create({
  email: "user@example.com",
  // Encrypt sensitive data
  creditCard: encrypt(creditCardNumber)
});
```

---

## 6. API Security Headers

```javascript
const helmet = require("helmet");
const cors = require("cors");

app.use(helmet());  // Sets multiple security headers

// Custom security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // HSTS (force HTTPS)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'"
  );

  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,  // Only allow your frontend
  credentials: true,  // Allow cookies
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## 7. Logging & Monitoring

### Audit Logging

```javascript
async function auditLog(action, req, data) {
  await db.auditLogs.create({
    action,
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    endpoint: req.originalUrl,
    method: req.method,
    requestBody: JSON.stringify(req.body),
    responseData: JSON.stringify(data),
    timestamp: new Date()
  });
}

// Log all order operations
app.post("/api/orders", async (req, res) => {
  const order = await createOrder(req.body);

  await auditLog("ORDER_CREATED", req, {
    orderId: order.id,
    total: order.total
  });

  res.json({ success: true, data: order });
});
```

### Security Monitoring & Alerts

```javascript
async function detectSuspiciousActivity(order, req) {
  const alerts = [];

  // 1. Check for unusually low total
  if (order.total < 10 && order.items.length > 0) {
    alerts.push({
      type: "LOW_TOTAL",
      severity: "HIGH",
      message: `Order total (${order.total}) suspiciously low`
    });
  }

  // 2. Check for high quantity orders
  const highQuantity = order.items.find(item => item.quantity > 100);
  if (highQuantity) {
    alerts.push({
      type: "HIGH_QUANTITY",
      severity: "MEDIUM",
      message: `High quantity order: ${highQuantity.quantity} units`
    });
  }

  // 3. Check for rapid order creation
  const recentOrders = await db.orders.count({
    where: {
      userId: req.user.id,
      createdAt: {
        $gte: new Date(Date.now() - 60 * 60 * 1000)  // Last hour
      }
    }
  });

  if (recentOrders > 5) {
    alerts.push({
      type: "RAPID_ORDERS",
      severity: "HIGH",
      message: `${recentOrders} orders in last hour`
    });
  }

  // Send alerts if any
  if (alerts.length > 0) {
    await sendSecurityAlert({
      orderId: order.id,
      userId: req.user.id,
      ipAddress: req.ip,
      alerts
    });
  }
}
```

---

## 8. Encryption & Data Protection

### HTTPS Only

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header("x-forwarded-proto") !== "https" && process.env.NODE_ENV === "production") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});
```

### Environment Variables

```bash
# .env file (NEVER commit to Git)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trio_production
DB_USER=trio_user
DB_PASSWORD=super_secure_password_here

JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

ENCRYPTION_KEY=your_encryption_key_here_32_bytes

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

SENDGRID_API_KEY=your_sendgrid_key

FRONTEND_URL=https://admin.trio.com
```

```javascript
// Load environment variables
require("dotenv").config();

// Validate required env vars on startup
const requiredEnvVars = [
  "DB_HOST",
  "DB_PASSWORD",
  "JWT_SECRET",
  "ENCRYPTION_KEY"
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
```

---

## 9. Security Testing Checklist

### Before Deployment

- [ ] **Authentication**
  - [ ] JWT tokens expire correctly (15 min)
  - [ ] Refresh tokens rotate properly
  - [ ] Invalid tokens are rejected
  - [ ] Password hashing uses bcrypt with salt rounds ≥ 10
  - [ ] Login rate limiting works (5 attempts per 15 min)

- [ ] **Authorization**
  - [ ] Role-based access control enforced
  - [ ] Admin-only endpoints reject non-admin users
  - [ ] Users cannot access other users' orders
  - [ ] Permission checks on all protected routes

- [ ] **Price Security**
  - [ ] Order totals calculated server-side
  - [ ] Client-provided prices are ignored
  - [ ] Product prices fetched from database
  - [ ] Discount validation works correctly
  - [ ] Tax calculation is server-controlled

- [ ] **Input Validation**
  - [ ] All inputs validated with schema (Joi/Yup)
  - [ ] SQL injection attempts blocked
  - [ ] XSS attacks prevented (HTML sanitized)
  - [ ] File upload validation (if applicable)
  - [ ] Maximum string lengths enforced

- [ ] **Rate Limiting**
  - [ ] API rate limit: 100 req/min per user
  - [ ] Order creation limit: 10 per hour
  - [ ] Login attempts limited
  - [ ] Export operations limited

- [ ] **Database Security**
  - [ ] Parameterized queries used (no string concatenation)
  - [ ] Transactions used for multi-step operations
  - [ ] Database credentials in environment variables
  - [ ] SSL/TLS enabled for DB connections in production
  - [ ] Sensitive data encrypted at rest

- [ ] **API Security**
  - [ ] HTTPS enforced in production
  - [ ] Security headers set (Helmet.js)
  - [ ] CORS configured correctly
  - [ ] Idempotency keys working
  - [ ] Error messages don't leak sensitive info

- [ ] **Monitoring**
  - [ ] Audit logging implemented
  - [ ] Security alerts configured
  - [ ] Suspicious activity detection active
  - [ ] Error logging (not exposing sensitive data)

### Penetration Testing Scenarios

**Test 1: Price Manipulation**
```bash
# Try to create order with $0.01 total
curl -X POST https://api.trio.com/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"productId": "prod-123", "quantity": 1, "price": 0.01}
    ],
    "total": 0.01
  }'

# Expected: Backend ignores price, calculates correctly
```

**Test 2: SQL Injection**
```bash
# Try SQL injection in search
curl "https://api.trio.com/api/orders?search=' OR 1=1--"

# Expected: Query parameterized, no injection
```

**Test 3: Unauthorized Access**
```bash
# Try accessing admin endpoint as regular user
curl https://api.trio.com/api/users \
  -H "Authorization: Bearer $USER_TOKEN"

# Expected: 403 Forbidden
```

**Test 4: Rate Limit**
```bash
# Make 101 requests in 1 minute
for i in {1..101}; do
  curl https://api.trio.com/api/orders
done

# Expected: 429 Too Many Requests after 100
```

---

## Security Incident Response Plan

### If Security Breach Detected:

1. **Immediate Actions:**
   - Revoke all active JWT tokens
   - Lock affected user accounts
   - Take affected endpoints offline if necessary
   - Alert development team

2. **Investigation:**
   - Review audit logs
   - Identify attack vector
   - Determine scope of breach
   - Check for data exfiltration

3. **Remediation:**
   - Patch vulnerability
   - Deploy security fix
   - Force password resets if needed
   - Notify affected users (if required by law)

4. **Post-Mortem:**
   - Document incident
   - Update security measures
   - Add new security tests
   - Train team on prevention

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Document Version:** 1.0.0
**Last Updated:** November 19, 2025
**Review Frequency:** Monthly
**Next Review:** December 19, 2025

---

**⚠️ CRITICAL REMINDER:**
Security is not optional. Every point in this document MUST be implemented before production deployment.
