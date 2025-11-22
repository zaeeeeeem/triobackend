# Testing Documentation

## Overview

This folder contains comprehensive testing guidelines for all TRIO Shopify Server API modules. All endpoints should be tested thoroughly before proceeding to new modules.

## Current Modules Status

- ✅ **Authentication Module** - Ready for Testing
- ✅ **Products Module** - Ready for Testing
- ⏳ **Customer Module** - Upcoming

## Testing Files

- [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md) - General testing approach and methodology
- [AUTH_TESTING.md](./AUTH_TESTING.md) - Authentication module test cases
- [PRODUCTS_TESTING.md](./PRODUCTS_TESTING.md) - Products module test cases
- [TESTING_RESULTS.md](./TESTING_RESULTS.md) - Document test results and bugs found

## Quick Start

1. Start the development server: `npm run dev`
2. Open Swagger UI: `http://localhost:3000/api-docs`
3. Follow test cases in order: Auth → Products
4. Document results in TESTING_RESULTS.md

## Test User Credentials

```json
{
  "admin": {
    "email": "zaeem@trio.com",
    "password": "password123",
    "role": "ADMIN"
  }
}
```

Create additional test users (MANAGER, VIEWER) during authentication testing.
