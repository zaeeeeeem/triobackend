# Customer Authentication Module

## Overview
The Customer Authentication module provides secure authentication and account management for customer-facing users. It implements a separate JWT system from admin authentication, with email verification, password reset, guest-to-customer conversion, and enhanced security features.

---

## Module Structure

### Files
- **Controller:** [src/controllers/customer-auth.controller.ts](../../src/controllers/customer-auth.controller.ts) (272 lines)
- **Service:** [src/services/customer-auth.service.ts](../../src/services/customer-auth.service.ts) (663 lines)
- **Routes:** [src/routes/customer-auth.routes.ts](../../src/routes/customer-auth.routes.ts)
- **Middleware:** [src/middleware/customer-auth.ts](../../src/middleware/customer-auth.ts)
- **Types:** [src/types/customer-auth.types.ts](../../src/types/customer-auth.types.ts) (3,185 bytes)

### Database Tables
- `customers` - Customer accounts
- `customer_refresh_tokens` - Customer JWT refresh tokens (separate from admin)

### Dependencies
- `bcryptjs` - Password hashing (10 rounds)
- `jsonwebtoken` - JWT token generation
- `@prisma/client` - Database operations
- `nodemailer` - Email sending
- `express-validator` - Input validation

---

## Key Differences from Admin Authentication

| Feature | Admin Auth | Customer Auth |
|---------|-----------|---------------|
| **Token Secret** | `JWT_SECRET` | `CUSTOMER_JWT_SECRET` |
| **Access Token Expiry** | 15 minutes | 24 hours |
| **Refresh Token Expiry** | 7 days | 30 days |
| **Email Verification** | Not required | Required |
| **Password Reset** | Not implemented | Implemented |
| **Guest Support** | No | Yes |
| **Profile Management** | Minimal | Extensive |
| **Max Sessions** | 5 | 5 |

---

## Features

### 1. Customer Registration
**Endpoint:** `POST /api/v1/customer-auth/register`

**Function:** `customerAuthService.register()`

**Access:** Public

**Process:**
1. Validate email and password
2. Check if email already exists
3. Validate password strength
4. Hash password (bcrypt, 10 rounds)
5. Create customer record
6. Generate email verification token
7. Link any existing guest orders to customer
8. Send verification email
9. Generate JWT tokens
10. Return customer data with tokens

**Required Fields:**
- `email` - Valid email format
- `password` - Strong password (8+ chars, uppercase, lowercase, number, special char)
- `firstName` - First name (required)
- `lastName` - Last name (required)

**Optional Fields:**
- `phone` - Phone number
- `acceptsMarketing` - Marketing consent (default: false)
- `acceptsSmsMarketing` - SMS marketing consent (default: false)

**Password Strength Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Sample Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "acceptsMarketing": true
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
      "lastName": "Doe",
      "emailVerified": false,
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "message": "Registration successful. Please verify your email."
  }
}
```

**Email Sent:**
- Subject: "Verify your email"
- Contains verification link with token
- Token expires in 24 hours

---

### 2. Customer Login
**Endpoint:** `POST /api/v1/customer-auth/login`

**Function:** `customerAuthService.login()`

**Access:** Public

**Process:**
1. Find customer by email
2. Verify password
3. Check account status (must be ACTIVE)
4. Enforce max session limit (5)
5. Generate access token (24h expiry)
6. Generate refresh token (30d expiry)
7. Store refresh token in database
8. Return tokens and customer data

**Required Fields:**
- `email` - Customer email
- `password` - Customer password

**Token Details:**
- **Access Token:** JWT with customer payload, expires in 24 hours
- **Refresh Token:** JWT with token ID, stored in DB, expires in 30 days
- **Token Payload:** `{ customerId, email, firstName, lastName, emailVerified }`

**Sample Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
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
      "lastName": "Doe",
      "emailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Login Restrictions:**
- Account must be ACTIVE (not SUSPENDED or DELETED)
- Maximum 5 active sessions
- Oldest session removed if limit exceeded

---

### 3. Email Verification
**Endpoint:** `GET /api/v1/customer-auth/verify-email?token={verificationToken}`

**Function:** `customerAuthService.verifyEmail(token)`

**Access:** Public (requires verification token)

**Process:**
1. Verify token JWT
2. Find customer by ID
3. Check if already verified
4. Update `emailVerified` to true
5. Update `verifiedAt` timestamp
6. Return success message

**Token Generation:**
- Signed with `CUSTOMER_JWT_SECRET`
- Contains customer ID
- Expires in 24 hours

**Sample Request:**
```
GET /api/v1/customer-auth/verify-email?token=eyJhbGciOiJIUzI1NiIs...
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Cases:**
- Token expired (422)
- Token invalid (422)
- Customer not found (404)
- Email already verified (409)

---

### 4. Resend Verification Email
**Endpoint:** `POST /api/v1/customer-auth/resend-verification`

**Function:** `customerAuthService.resendVerificationEmail(customerId)`

**Access:** Authenticated customers only

**Process:**
1. Verify authentication
2. Check if already verified
3. Generate new verification token
4. Send new verification email
5. Return success message

**Sample Request:**
```
POST /api/v1/customer-auth/resend-verification
Authorization: Bearer {accessToken}
```

**Rate Limiting:**
- Prevent abuse by limiting requests
- Cooldown period between resends

---

### 5. Forgot Password
**Endpoint:** `POST /api/v1/customer-auth/forgot-password`

**Function:** `customerAuthService.forgotPassword(email)`

**Access:** Public

**Process:**
1. Find customer by email
2. Generate password reset token (6-digit code)
3. Store reset token with expiry (1 hour)
4. Send password reset email
5. Return success message (even if email doesn't exist for security)

**Reset Token:**
- 6-digit numeric code
- Stored in `passwordResetToken` field
- Expires in 1 hour (`passwordResetExpires`)
- One-time use

**Sample Request:**
```json
{
  "email": "customer@example.com"
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "If your email exists, you will receive a password reset code"
}
```

**Email Sent:**
- Subject: "Password Reset Code"
- Contains 6-digit code
- Code expires in 1 hour

**Security Features:**
- Generic response (doesn't reveal if email exists)
- Rate limited to prevent abuse
- Token expires after 1 hour
- One-time use token

---

### 6. Reset Password
**Endpoint:** `POST /api/v1/customer-auth/reset-password`

**Function:** `customerAuthService.resetPassword(email, token, newPassword)`

**Access:** Public (requires reset token)

**Process:**
1. Find customer by email
2. Verify reset token matches
3. Check token hasn't expired
4. Validate new password strength
5. Hash new password
6. Clear reset token fields
7. Invalidate all refresh tokens (logout all devices)
8. Return success message

**Required Fields:**
- `email` - Customer email
- `token` - 6-digit reset code
- `newPassword` - New password (must meet strength requirements)

**Sample Request:**
```json
{
  "email": "customer@example.com",
  "token": "123456",
  "newPassword": "NewSecurePass456!"
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Password reset successful. Please log in with your new password."
}
```

**Security Measures:**
- All sessions invalidated after password reset
- Reset token cleared after use
- New password must meet strength requirements
- Customer must log in again on all devices

---

### 7. Refresh Access Token
**Endpoint:** `POST /api/v1/customer-auth/refresh`

**Function:** `customerAuthService.refreshAccessToken(refreshToken)`

**Access:** Public (requires valid refresh token)

**Process:**
1. Verify refresh token JWT
2. Check token exists in database
3. Detect token reuse (security feature)
4. Generate new access token (24h)
5. Rotate refresh token (30d)
6. Delete old refresh token
7. Store new refresh token
8. Return new tokens

**Token Reuse Detection:**
- If refresh token not found in DB → likely reused
- All customer tokens invalidated
- Customer must log in again

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 8. Logout (Single Device)
**Endpoint:** `POST /api/v1/customer-auth/logout`

**Function:** `customerAuthService.logout(refreshToken)`

**Access:** Authenticated customers only

**Process:**
1. Verify authentication
2. Delete specific refresh token
3. Return success message

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 9. Logout All Devices
**Endpoint:** `POST /api/v1/customer-auth/logout-all`

**Function:** `customerAuthService.logoutAll(customerId)`

**Access:** Authenticated customers only

**Process:**
1. Verify authentication
2. Delete all refresh tokens for customer
3. Return success message

**Use Cases:**
- Security breach suspected
- Lost phone/device
- Reset all sessions

---

### 10. Get Authenticated Customer Info
**Endpoint:** `GET /api/v1/customer-auth/me`

**Function:** Returns authenticated customer information

**Access:** Authenticated customers only

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
      "emailVerified": true,
      "phone": "+1234567890",
      "status": "ACTIVE"
    }
  }
}
```

---

### 11. Generate Guest Token
**Endpoint:** `POST /api/v1/customer-auth/guest-token`

**Function:** `customerAuthService.generateGuestToken()`

**Access:** Public

**Purpose:** Allow guest checkout without registration

**Process:**
1. Create temporary customer record with `customerType: GUEST`
2. Generate guest access token
3. Return token

**Guest Token:**
- Limited access (checkout only)
- No refresh token
- Can be converted to registered account later

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "guestToken": "eyJhbGciOiJIUzI1NiIs...",
    "customerId": "uuid"
  }
}
```

---

### 12. Convert Guest to Registered Customer
**Endpoint:** `POST /api/v1/customer-auth/convert-guest`

**Function:** `customerAuthService.updateGuestCustomerWithPassword()`

**Access:** Guest token required

**Process:**
1. Verify guest token
2. Update customer record with email and password
3. Link all guest orders to new customer account
4. Change `customerType` from GUEST to REGISTERED
5. Send verification email
6. Return customer data with tokens

**Required Fields:**
- `email` - Customer email
- `password` - Strong password
- `firstName` - First name
- `lastName` - Last name

**Sample Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## Middleware

### authenticateCustomer()
**Purpose:** Verify customer JWT access token

**Process:**
1. Extract Bearer token from Authorization header
2. Verify JWT with `CUSTOMER_JWT_SECRET`
3. Fetch customer from database
4. Check account status (must be ACTIVE)
5. Inject customer into `req.customer`
6. Continue to next middleware

**Usage:**
```typescript
router.get('/profile', authenticateCustomer, controller);
```

**Errors:**
- 401: No token provided
- 401: Invalid or expired token
- 401: Customer not found
- 403: Account suspended or deleted

---

## Security Features

### 1. Password Strength Validation
**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Implementation:**
```typescript
function validatePasswordStrength(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
}
```

---

### 2. Email Verification Workflow

**Registration:**
1. Customer registers → Email marked unverified
2. Verification token generated
3. Email sent with verification link
4. Customer clicks link
5. Email marked as verified

**Benefits:**
- Prevents fake email registrations
- Ensures valid contact information
- Reduces spam accounts

**Resend Verification:**
- Available for unverified customers
- Rate limited to prevent abuse

---

### 3. Password Reset Security

**Features:**
- 6-digit random code (not predictable)
- 1-hour expiration
- One-time use
- All sessions invalidated after reset
- Generic error messages (security)

**Process Flow:**
```
1. Customer requests reset → Email sent
2. Customer receives 6-digit code
3. Customer enters code + new password
4. Token validated and cleared
5. All devices logged out
6. Customer must log in with new password
```

---

### 4. Token Reuse Detection

**Purpose:** Detect stolen/compromised tokens

**How it works:**
1. Refresh token used → New token issued, old deleted
2. Old token used again → Not found in DB
3. System detects reuse → All tokens invalidated
4. Customer notified and must log in again

**Why it matters:**
- Prevents token theft exploitation
- Automatic security response
- No manual intervention needed

---

### 5. Session Management
- **Max Sessions:** 5 per customer
- **Session Tracking:** Each refresh token = one device/session
- **Automatic Cleanup:** Oldest session removed when limit exceeded
- **Manual Control:** Logout single device or all devices

---

### 6. Account Status Enforcement
**Status Types:**
- `ACTIVE` - Normal account (can login)
- `SUSPENDED` - Temporarily disabled (cannot login)
- `DELETED` - Soft deleted (cannot login)

**Login Restrictions:**
- Only ACTIVE customers can log in
- SUSPENDED/DELETED accounts rejected with 403

---

## Email Service Integration

### Email Templates

**1. Welcome Email:**
- Sent after registration
- Includes verification link
- Branded template

**2. Verification Email:**
- Contains verification token
- Expires in 24 hours
- Clear call-to-action button

**3. Password Reset Email:**
- Contains 6-digit code
- Expires in 1 hour
- Security warnings

**4. Password Changed Email:**
- Confirmation of password change
- Security alert
- Instructions if not initiated by user

---

## Guest Order Integration

### Guest Checkout Flow
1. Customer initiates checkout without account
2. Request guest token
3. Use guest token to create order
4. Order linked to guest customer ID

### Guest-to-Registered Conversion
1. Guest completes checkout
2. Option to create account
3. Guest converts to registered customer
4. All guest orders linked to new account
5. Customer can view order history

**Benefits:**
- Reduced friction for first-time buyers
- Seamless conversion to registered account
- Preserved order history

---

## Error Handling

### Common Errors

**401 Unauthorized:**
- Invalid credentials
- Token expired
- No token provided

**403 Forbidden:**
- Account suspended
- Account deleted
- Email not verified (optional enforcement)

**409 Conflict:**
- Email already exists
- Email already verified

**422 Validation Error:**
- Invalid email format
- Weak password
- Missing required fields
- Invalid reset token
- Reset token expired

**429 Too Many Requests:**
- Rate limit exceeded
- Too many verification emails
- Too many password reset requests

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

model CustomerRefreshToken {
  id         String    @id @default(uuid())
  token      String    @unique
  customerId String
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  @@index([customerId])
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

## Configuration

### Environment Variables
```env
# Customer JWT Secrets (separate from admin)
CUSTOMER_JWT_SECRET=your-customer-access-token-secret
CUSTOMER_JWT_REFRESH_SECRET=your-customer-refresh-token-secret

# Token Expiry
CUSTOMER_JWT_ACCESS_EXPIRES_IN=24h
CUSTOMER_JWT_REFRESH_EXPIRES_IN=30d

# Email Verification
EMAIL_VERIFICATION_EXPIRES_IN=24h

# Password Reset
PASSWORD_RESET_EXPIRES_IN=1h

# Session Management
MAX_CUSTOMER_SESSIONS=5

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=password
```

---

## API Endpoints Summary

```
# Registration & Login
POST   /api/v1/customer-auth/register           - Register customer
POST   /api/v1/customer-auth/login              - Login customer
POST   /api/v1/customer-auth/refresh            - Refresh access token
POST   /api/v1/customer-auth/logout             - Logout (single device)
POST   /api/v1/customer-auth/logout-all         - Logout all devices
GET    /api/v1/customer-auth/me                 - Get authenticated customer

# Email Verification
GET    /api/v1/customer-auth/verify-email       - Verify email
POST   /api/v1/customer-auth/resend-verification - Resend verification email

# Password Reset
POST   /api/v1/customer-auth/forgot-password    - Request password reset
POST   /api/v1/customer-auth/reset-password     - Reset password with code

# Guest Checkout
POST   /api/v1/customer-auth/guest-token        - Generate guest token
POST   /api/v1/customer-auth/convert-guest      - Convert guest to registered
```

---

## Testing Checklist

- [ ] Customer registration with valid data
- [ ] Registration with duplicate email (should fail)
- [ ] Registration with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should fail)
- [ ] Login with suspended account (should fail)
- [ ] Email verification with valid token
- [ ] Email verification with expired token (should fail)
- [ ] Resend verification email
- [ ] Forgot password flow (email sent)
- [ ] Reset password with valid code
- [ ] Reset password with expired code (should fail)
- [ ] Refresh access token
- [ ] Token reuse detection
- [ ] Logout single device
- [ ] Logout all devices
- [ ] Guest token generation
- [ ] Guest-to-registered conversion
- [ ] Max session limit enforcement

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Facebook, Apple)
- [ ] Magic link authentication (passwordless)
- [ ] Account lockout after failed attempts
- [ ] IP-based security alerts
- [ ] Device fingerprinting
- [ ] Security audit log
- [ ] Email change verification
- [ ] Phone number verification (SMS)
- [ ] Biometric authentication support

---

## Related Modules
- [Customer Management Module](./04-CUSTOMER_MANAGEMENT_MODULE.md) - Customer profile and preferences
- [Customer Address Module](./04-CUSTOMER_MANAGEMENT_MODULE.md#address-management) - Address management
- [Order Module](./05-ORDER_MANAGEMENT_MODULE.md) - Customer orders
- [Guest Order Module](./05-ORDER_MANAGEMENT_MODULE.md#guest-checkout) - Guest checkout integration

---

## References
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Email Verification Best Practices](https://postmarkapp.com/guides/email-verification)
- [Password Reset Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
