# Testing Guidelines

## Testing Methodology

### Test Categories

1. **Happy Path** - Expected successful scenarios with valid data
2. **Validation Errors** - Invalid input, missing required fields, format errors
3. **Authentication/Authorization** - Token issues, permission problems
4. **Edge Cases** - Boundary values, special characters, maximum lengths
5. **Error Cases** - Resource not found, conflicts, duplicates

### Testing Tool: Swagger UI

**Location:** `http://localhost:3000/api-docs`

**Advantages:**
- Visual interface for all endpoints
- Built-in request/response validation
- Easy authentication management
- Auto-generated from code

### How to Use Swagger UI

1. **Navigate to endpoint** - Expand the route you want to test
2. **Click "Try it out"** - Enables the request editor
3. **Fill in parameters** - Enter request body, path params, query params
4. **Authorize (if needed)** - Click the lock icon, enter `Bearer <token>`
5. **Execute** - Click "Execute" button
6. **Review response** - Check status code, response body, headers

### Authentication in Swagger

For protected endpoints:

1. First, login via `/auth/login` to get access token
2. Copy the `accessToken` from response
3. Click "Authorize" button (lock icon at top)
4. Enter: `Bearer <your-access-token>`
5. Click "Authorize", then "Close"
6. Now all requests will include the token

### Test Result Symbols

- ✅ **PASS** - Works as expected
- ❌ **FAIL** - Error or unexpected behavior
- ⚠️ **WARNING** - Works but has issues (unclear errors, performance, etc.)
- 📝 **NOTE** - Important observation

### HTTP Status Codes Reference

| Code | Meaning | When to Expect |
|------|---------|----------------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation errors, invalid JSON |
| 401 | Unauthorized | Missing/invalid token, wrong password |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, SKU, ISBN) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server bug |

## Testing Workflow

### Phase 1: Authentication Module
1. Test all auth endpoints first
2. Create test users for each role (ADMIN, MANAGER, VIEWER)
3. Save tokens for use in other modules
4. Document any issues found

### Phase 2: Products Module
1. Use tokens from Phase 1
2. Test with different user roles
3. Test all CRUD operations
4. Test section-specific attributes (CAFE, FLOWERS, BOOKS)
5. Test edge cases and error scenarios

### Phase 3: Documentation
1. Record all test results in TESTING_RESULTS.md
2. Create bug reports for failures
3. Note warnings and improvement areas
4. Verify all critical issues are fixed before proceeding

## Test Data Guidelines

### Valid Test Data Examples

**Cafe Product:**
```json
{
  "section": "CAFE",
  "sku": "CAFE-TEST-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Test Espresso",
    "description": "Test description",
    "category": "Coffee Beans",
    "origin": "Colombia",
    "roastLevel": "Medium"
  }
}
```

**Flowers Product:**
```json
{
  "section": "FLOWERS",
  "sku": "FLW-TEST-001",
  "price": 45.00,
  "stockQuantity": 50,
  "flowersAttributes": {
    "name": "Test Bouquet",
    "description": "Beautiful test arrangement",
    "arrangementType": "Bouquet",
    "colors": ["red", "white"],
    "flowerTypes": ["roses", "lilies"]
  }
}
```

**Books Product:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-TEST-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Test Novel",
    "description": "An interesting test book",
    "author": "Test Author",
    "format": "Hardcover",
    "genre": "Fiction",
    "isbn": "978-1234567890"
  }
}
```

### Invalid Test Data Examples

**Missing Required Fields:**
```json
{
  "section": "CAFE",
  "sku": "INVALID-001"
  // Missing: price, stockQuantity, cafeAttributes
}
```

**Wrong Section Attributes:**
```json
{
  "section": "CAFE",
  "sku": "WRONG-001",
  "price": 10.00,
  "stockQuantity": 50,
  "booksAttributes": {  // Wrong! Should be cafeAttributes
    "title": "Test"
  }
}
```

**Invalid Data Types:**
```json
{
  "section": "CAFE",
  "sku": "TYPE-ERR-001",
  "price": "not a number",  // Should be number
  "stockQuantity": 50,
  "cafeAttributes": {
    "name": "Test",
    "category": "Coffee"
  }
}
```

## Common Issues to Watch For

1. **Token Expiration** - Access tokens expire after 15 minutes
2. **Missing Bearer Prefix** - Must use `Bearer <token>`, not just `<token>`
3. **JSON Formatting** - Ensure valid JSON (no trailing commas, proper quotes)
4. **UUID Format** - Product IDs must be valid UUIDs
5. **Section Mismatch** - CAFE products need cafeAttributes, not flowersAttributes or booksAttributes
6. **Rate Limiting** - Bulk operations have stricter rate limits
7. **Soft vs Hard Delete** - Default is soft delete; use `force=true` for permanent deletion

## Best Practices

1. **Test in Order** - Start with happy paths, then edge cases
2. **One Change at a Time** - When testing validation, change one field at a time
3. **Document Everything** - Record both successes and failures
4. **Use Realistic Data** - Test with production-like data
5. **Test All Roles** - Verify ADMIN, MANAGER, and VIEWER permissions
6. **Clean Up** - Delete test data after testing to avoid clutter
7. **Retest Fixes** - After fixing bugs, retest the entire flow

## Next Steps

1. Complete [AUTH_TESTING.md](./AUTH_TESTING.md) test cases
2. Complete [PRODUCTS_TESTING.md](./PRODUCTS_TESTING.md) test cases
3. Document results in [TESTING_RESULTS.md](./TESTING_RESULTS.md)
4. Fix critical bugs before Customer module
