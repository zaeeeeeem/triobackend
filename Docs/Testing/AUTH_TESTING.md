# Authentication Module Testing

## Endpoints Overview

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| POST | /auth/register | No | All | Register new user |
| POST | /auth/login | No | All | Login user |
| POST | /auth/refresh | No | All | Refresh access token |
| POST | /auth/logout | Yes | All | Logout user |
| POST | /auth/change-password | Yes | All | Change password |

---

## Test Case 1: POST /auth/register

### 1.1 Happy Path - Register Admin User

**Purpose:** Create a new admin user successfully

**Request:**
```json
{
  "email": "testadmin@trio.com",
  "password": "AdminPass123!",
  "firstName": "Test",
  "lastName": "Admin",
  "role": "ADMIN"
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "testadmin@trio.com",
      "firstName": "Test",
      "lastName": "Admin",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "<timestamp>",
      "updatedAt": "<timestamp>"
    },
    "tokens": {
      "accessToken": "<jwt-token>",
      "refreshToken": "<jwt-token>"
    }
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.2 Happy Path - Register Manager User

**Request:**
```json
{
  "email": "testmanager@trio.com",
  "password": "ManagerPass123!",
  "firstName": "Test",
  "lastName": "Manager",
  "role": "MANAGER"
}
```

**Expected Response:** `201 Created`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.3 Happy Path - Register Viewer User

**Request:**
```json
{
  "email": "testviewer@trio.com",
  "password": "ViewerPass123!",
  "firstName": "Test",
  "lastName": "Viewer",
  "role": "STAFF"
}
```

**Expected Response:** `201 Created`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.4 Happy Path - Register Without Role (Default)

**Purpose:** Verify default role is assigned when not specified

**Request:**
```json
{
  "email": "defaultuser@trio.com",
  "password": "DefaultPass123!",
  "firstName": "Default",
  "lastName": "User"
}
```

**Expected Response:** `201 Created` with `role: "VIEWER"`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.5 Validation Error - Missing Email

**Request:**
```json
{
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected Response:** `400 Bad Request`
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
          "message": "Required"
        }
      ]
    }
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.6 Validation Error - Invalid Email Format

**Request:**
```json
{
  "email": "not-an-email",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected Response:** `400 Bad Request` with email format error

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.7 Validation Error - Password Too Short

**Request:**
```json
{
  "email": "test@trio.com",
  "password": "short",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected Response:** `400 Bad Request` with password minimum length error

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.8 Validation Error - Missing First Name

**Request:**
```json
{
  "email": "test@trio.com",
  "password": "TestPass123!",
  "lastName": "User"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.9 Validation Error - Missing Last Name

**Request:**
```json
{
  "email": "test@trio.com",
  "password": "TestPass123!",
  "firstName": "Test"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.10 Conflict Error - Duplicate Email

**Purpose:** Attempt to register with an already existing email

**Request:**
```json
{
  "email": "testadmin@trio.com",
  "password": "DuplicatePass123!",
  "firstName": "Duplicate",
  "lastName": "User"
}
```

**Expected Response:** `409 Conflict`
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "User already exists"
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.11 Edge Case - Very Long Email

**Request:**
```json
{
  "email": "verylongemailaddressthatexceedsnormallimits@verylongdomainnamethatisunusuallylong.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected Response:** `400 Bad Request` or `201 Created` (depending on email length validation)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.12 Edge Case - Special Characters in Name

**Request:**
```json
{
  "email": "special@trio.com",
  "password": "TestPass123!",
  "firstName": "O'Brien-Smith",
  "lastName": "José-María"
}
```

**Expected Response:** `201 Created` (names should allow hyphens, apostrophes, accents)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.13 Edge Case - Invalid Role

**Request:**
```json
{
  "email": "invalidrole@trio.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User",
  "role": "SUPERADMIN"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 2: POST /auth/login

### 2.1 Happy Path - Login with Valid Credentials

**Request:**
```json
{
  "email": "testadmin@trio.com",
  "password": "AdminPass123!"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "testadmin@trio.com",
      "firstName": "Test",
      "lastName": "Admin",
      "role": "ADMIN",
      "isActive": true
    },
    "tokens": {
      "accessToken": "<jwt-token>",
      "refreshToken": "<jwt-token>"
    }
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.2 Error - Invalid Password

**Request:**
```json
{
  "email": "testadmin@trio.com",
  "password": "WrongPassword123!"
}
```

**Expected Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.3 Error - Non-existent Email

**Request:**
```json
{
  "email": "nonexistent@trio.com",
  "password": "SomePass123!"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.4 Validation Error - Missing Email

**Request:**
```json
{
  "password": "TestPass123!"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.5 Validation Error - Missing Password

**Request:**
```json
{
  "email": "testadmin@trio.com"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.6 Edge Case - Case Sensitivity in Email

**Request:**
```json
{
  "email": "TESTADMIN@TRIO.COM",
  "password": "AdminPass123!"
}
```

**Expected Response:** `200 OK` (emails should be case-insensitive)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.7 Edge Case - Whitespace in Credentials

**Request:**
```json
{
  "email": " testadmin@trio.com ",
  "password": " AdminPass123! "
}
```

**Expected Response:** Should trim whitespace and succeed or reject

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 3: POST /auth/refresh

### 3.1 Happy Path - Refresh with Valid Token

**Prerequisites:** Login first to get refresh token

**Request:**
```json
{
  "refreshToken": "<valid-refresh-token-from-login>"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "<new-jwt-token>",
    "refreshToken": "<new-refresh-token>"
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.2 Error - Invalid Refresh Token

**Request:**
```json
{
  "refreshToken": "invalid.token.here"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.3 Error - Expired Refresh Token

**Purpose:** Test with an old/expired refresh token (if available)

**Request:**
```json
{
  "refreshToken": "<expired-refresh-token>"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.4 Validation Error - Missing Refresh Token

**Request:**
```json
{}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.5 Error - Using Access Token Instead of Refresh Token

**Purpose:** Verify that access tokens can't be used to refresh

**Request:**
```json
{
  "refreshToken": "<access-token-instead-of-refresh>"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 4: POST /auth/logout

### 4.1 Happy Path - Logout with Valid Tokens

**Prerequisites:**
1. Login to get access and refresh tokens
2. Add Bearer token to Swagger authorization

**Request:**
```json
{
  "refreshToken": "<valid-refresh-token>"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.2 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token from Swagger authorization

**Request:**
```json
{
  "refreshToken": "<valid-refresh-token>"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.3 Error - Missing Refresh Token in Body

**Request:**
```json
{}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.4 Error - Invalid Refresh Token

**Request:**
```json
{
  "refreshToken": "invalid.token.here"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.5 Edge Case - Logout Twice with Same Token

**Purpose:** Verify token is invalidated after first logout

**Steps:**
1. Logout successfully
2. Try to logout again with same refresh token

**Expected Response:** Second logout should fail with `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 5: POST /auth/change-password

### 5.1 Happy Path - Change Password Successfully

**Prerequisites:** Login and add Bearer token

**Request:**
```json
{
  "currentPassword": "AdminPass123!",
  "newPassword": "NewAdminPass456!"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.2 Verification - Login with New Password

**Purpose:** Verify new password works

**Request:**
```json
{
  "email": "testadmin@trio.com",
  "password": "NewAdminPass456!"
}
```

**Expected Response:** `200 OK` with tokens

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.3 Error - Wrong Current Password

**Request:**
```json
{
  "currentPassword": "WrongOldPass123!",
  "newPassword": "NewPass789!"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.4 Validation Error - New Password Too Short

**Request:**
```json
{
  "currentPassword": "NewAdminPass456!",
  "newPassword": "short"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.5 Validation Error - Missing Current Password

**Request:**
```json
{
  "newPassword": "NewPass789!"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.6 Validation Error - Missing New Password

**Request:**
```json
{
  "currentPassword": "NewAdminPass456!"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.7 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:**
```json
{
  "currentPassword": "NewAdminPass456!",
  "newPassword": "AnotherPass789!"
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.8 Edge Case - Same Password as Current

**Request:**
```json
{
  "currentPassword": "NewAdminPass456!",
  "newPassword": "NewAdminPass456!"
}
```

**Expected Response:** Should accept or reject based on business logic

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Summary

### Test Results Overview

| Endpoint | Total Tests | Passed | Failed | Warnings |
|----------|-------------|--------|--------|----------|
| /auth/register | 13 | | | |
| /auth/login | 7 | | | |
| /auth/refresh | 5 | | | |
| /auth/logout | 5 | | | |
| /auth/change-password | 8 | | | |
| **TOTAL** | **38** | | | |

### Critical Issues Found

1.
2.
3.

### Non-Critical Issues / Improvements

1.
2.
3.

### Notes for Development Team

___________________________________________
___________________________________________
___________________________________________
