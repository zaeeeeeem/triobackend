# Authentication Module (Admin Users)

## Overview
The Authentication module handles secure authentication and authorization for admin panel users with three distinct roles: ADMIN, MANAGER, and STAFF. It implements JWT-based authentication with refresh token rotation and comprehensive session management.

---

## Module Structure

### Files
- **Controller:** [src/controllers/auth.controller.ts](../../src/controllers/auth.controller.ts) (90 lines)
- **Service:** [src/services/auth.service.ts](../../src/services/auth.service.ts) (330 lines)
- **Routes:** [src/routes/auth.routes.ts](../../src/routes/auth.routes.ts) (371 lines)
- **Middleware:** [src/middleware/auth.ts](../../src/middleware/auth.ts) (77 lines)

### Database Tables
- `users` - Admin user accounts
- `refresh_tokens` - JWT refresh token storage with reuse detection

### Dependencies
- `bcryptjs` - Password hashing (10 rounds)
- `jsonwebtoken` - JWT token generation and verification
- `@prisma/client` - Database operations
- `express-validator` - Input validation

---

## Features

### 1. User Registration
**Endpoint:** `POST /api/v1/auth/register`

**Function:** `authService.register()`

**Process:**
1. Validate email format and password strength
2. Check for existing user with same email
3. Hash password using bcrypt (10 rounds)
4. Create user record in database
5. Return user details (password excluded)

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 8 characters, includes uppercase, lowercase, number, special character
- Name: Required, 2-100 characters
- Role: ADMIN, MANAGER, or STAFF
- Section: Required if role is MANAGER (CAFE, FLOWERS, BOOKS)

**Access:** Public (no authentication required)

**Sample Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "ADMIN"
}
```

---

### 2. User Login
**Endpoint:** `POST /api/v1/auth/login`

**Function:** `authService.login()`

**Process:**
1. Find user by email
2. Verify password using bcrypt
3. Enforce maximum active sessions (5)
4. Generate access token (15 min expiry)
5. Generate refresh token (7 day expiry)
6. Store refresh token in database
7. Return tokens and user details

**Token Details:**
- **Access Token:** JWT with user payload (id, email, role, section), expires in 15 minutes
- **Refresh Token:** JWT with token ID, stored in database, expires in 7 days
- **Token Payload:** `{ userId, email, role, section }`

**Session Management:**
- Maximum 5 active sessions per user
- Oldest session automatically removed when limit exceeded
- Each refresh token represents one active session/device

**Access:** Public

**Sample Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "John Doe",
      "role": "ADMIN",
      "section": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 3. Refresh Access Token
**Endpoint:** `POST /api/v1/auth/refresh`

**Function:** `authService.refreshAccessToken()`

**Process:**
1. Verify refresh token JWT
2. Check if token exists in database
3. Detect token reuse (security feature)
4. Generate new access token
5. Rotate refresh token (issue new one)
6. Delete old refresh token
7. Return new tokens

**Token Reuse Detection:**
- If used refresh token is not found in database → likely reused
- All tokens for that user are invalidated
- User must log in again

**Access:** Public (requires valid refresh token)

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 4. Logout (Single Device)
**Endpoint:** `POST /api/v1/auth/logout`

**Function:** `authService.logout()`

**Process:**
1. Verify authentication
2. Delete specific refresh token from database
3. Invalidate current session
4. Other sessions remain active

**Access:** Authenticated users only

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 5. Logout All Devices
**Endpoint:** `POST /api/v1/auth/logout-all`

**Function:** `authService.logoutAll()`

**Process:**
1. Verify authentication
2. Delete all refresh tokens for user
3. Invalidate all sessions
4. User must log in on all devices

**Use Cases:**
- Security breach suspected
- Lost device
- Reset all sessions

**Access:** Authenticated users only

---

### 6. Change Password
**Endpoint:** `POST /api/v1/auth/change-password`

**Function:** `authService.changePassword()`

**Process:**
1. Verify authentication
2. Verify current password
3. Validate new password strength
4. Hash new password
5. Update user record
6. Optionally invalidate all sessions

**Validation:**
- Current password must be correct
- New password must meet strength requirements
- New password must differ from current password

**Access:** Authenticated users only

**Sample Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

---

### 7. Get Active Sessions
**Endpoint:** `GET /api/v1/auth/sessions`

**Function:** `authService.getActiveSessions()`

**Process:**
1. Verify authentication
2. Fetch all active refresh tokens for user
3. Return session details (created date, last used)

**Access:** Authenticated users only

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "createdAt": "2025-01-15T10:30:00Z",
        "expiresAt": "2025-01-22T10:30:00Z"
      }
    ],
    "totalSessions": 1
  }
}
```

---

## Middleware

### 1. authenticate()
**Purpose:** Verify JWT access token and inject user into request

**Process:**
1. Extract Bearer token from Authorization header
2. Verify JWT signature and expiry
3. Fetch user from database
4. Inject user payload into `req.user`
5. Continue to next middleware

**Errors:**
- 401: No token provided
- 401: Invalid or expired token
- 401: User not found

**Usage:**
```typescript
router.get('/protected', authenticate, controller);
```

---

### 2. authorize(...roles)
**Purpose:** Check if authenticated user has required role

**Roles:**
- `ADMIN` - Full system access
- `MANAGER` - Section-specific access
- `STAFF` - Read-only access

**Process:**
1. Check if `req.user.role` matches allowed roles
2. Return 403 if unauthorized

**Usage:**
```typescript
router.post('/products', authenticate, authorize('ADMIN', 'MANAGER'), controller);
```

---

### 3. checkSectionAccess(section)
**Purpose:** Verify section-based access for managers

**Process:**
1. If user is ADMIN → allow access
2. If user is MANAGER → check if section matches
3. Return 403 if section doesn't match

**Sections:**
- `CAFE` - Coffee, tea, pastries
- `FLOWERS` - Bouquets, arrangements
- `BOOKS` - Physical and digital books

**Usage:**
```typescript
router.post('/products', authenticate, authorize('ADMIN', 'MANAGER'), checkSectionAccess('CAFE'), controller);
```

---

## Security Features

### 1. Password Security
- **Hashing Algorithm:** bcrypt with 10 salt rounds
- **Strength Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Storage:** Only hashed passwords stored in database

---

### 2. JWT Token Security
- **Access Token:**
  - Short-lived (15 minutes)
  - Stateless (not stored in database)
  - Used for API authentication
  - Payload: userId, email, role, section

- **Refresh Token:**
  - Long-lived (7 days)
  - Stored in database
  - Used to generate new access tokens
  - Rotation on each refresh
  - Reuse detection

---

### 3. Token Reuse Detection
**Purpose:** Detect and prevent security breaches

**How it works:**
1. User logs in → Refresh token stored in DB
2. User refreshes → Old token deleted, new token stored
3. If old token used again → Token not found in DB
4. System detects reuse → All user tokens invalidated
5. User must log in again on all devices

**Why it matters:**
- Prevents stolen token usage
- Detects compromised sessions
- Automatic security response

---

### 4. Session Management
- **Maximum Sessions:** 5 per user
- **Session Tracking:** Each refresh token = one session
- **Automatic Cleanup:** Oldest session removed when limit exceeded
- **Manual Control:** User can logout single or all devices

---

### 5. Rate Limiting
- **General API:** 100 requests per minute
- **Login Endpoint:** Separate rate limiter
- **Create Operations:** 10 requests per minute
- **Protection:** Prevents brute force attacks

---

## Error Handling

### Common Errors

**401 Unauthorized:**
- No token provided
- Invalid token
- Expired token
- User not found
- Invalid credentials

**403 Forbidden:**
- Insufficient role permissions
- Section access denied

**409 Conflict:**
- Email already exists

**422 Validation Error:**
- Invalid email format
- Weak password
- Missing required fields

---

## Database Schema

### Users Table
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String
  role         UserRole  @default(STAFF)
  section      Section?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  refreshTokens RefreshToken[]
}

enum UserRole {
  ADMIN
  MANAGER
  STAFF
}

enum Section {
  CAFE
  FLOWERS
  BOOKS
}
```

### RefreshTokens Table
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## Configuration

### Environment Variables
```env
# JWT Secrets
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# Token Expiry
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Management
MAX_ACTIVE_SESSIONS=5
```

---

## Usage Examples

### Example 1: Admin Registration
```typescript
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePass123!',
    name: 'Admin User',
    role: 'ADMIN'
  })
});
```

### Example 2: Manager Registration (Section-Specific)
```typescript
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'cafe-manager@example.com',
    password: 'SecurePass123!',
    name: 'Cafe Manager',
    role: 'MANAGER',
    section: 'CAFE'
  })
});
```

### Example 3: Login and Store Tokens
```typescript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePass123!'
  })
});

const { accessToken, refreshToken } = await response.json();
// Store tokens securely (httpOnly cookies recommended)
```

### Example 4: Authenticated Request
```typescript
const response = await fetch('/api/v1/products', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Example 5: Refresh Token
```typescript
const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: refreshToken
  })
});

const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
// Update stored tokens
```

---

## Testing Checklist

- [ ] User registration with valid data
- [ ] User registration with duplicate email (should fail)
- [ ] User registration with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Access protected route with valid token
- [ ] Access protected route with expired token (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Refresh access token with valid refresh token
- [ ] Refresh access token with invalid refresh token (should fail)
- [ ] Refresh access token reuse detection
- [ ] Logout single device
- [ ] Logout all devices
- [ ] Change password with correct current password
- [ ] Change password with incorrect current password (should fail)
- [ ] Role-based access control (ADMIN, MANAGER, STAFF)
- [ ] Section-based access control for managers
- [ ] Maximum session limit enforcement
- [ ] Get active sessions list

---

## Known Issues & Future Enhancements

### Current Limitations
- No password reset via email (implemented in Customer Auth module)
- No email verification
- No two-factor authentication
- No account lockout after failed attempts

### Planned Enhancements
- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Add two-factor authentication (2FA)
- [ ] Account lockout after 5 failed login attempts
- [ ] Device fingerprinting for better session tracking
- [ ] IP-based security alerts
- [ ] Audit log for authentication events

---

## Related Modules
- [Customer Authentication Module](./03-CUSTOMER_AUTHENTICATION_MODULE.md) - Separate authentication for customers
- [Product Management Module](./02-PRODUCT_MANAGEMENT_MODULE.md) - Uses auth middleware for protection
- [Customer Management Module](./04-CUSTOMER_MANAGEMENT_MODULE.md) - Admin management of customers

---

## References
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
