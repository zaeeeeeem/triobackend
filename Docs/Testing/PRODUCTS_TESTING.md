# Products Module Testing

## Endpoints Overview

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | /products | Yes | All | List products with filters/pagination |
| POST | /products | Yes | ADMIN, MANAGER | Create new product |
| PATCH | /products/bulk | Yes | ADMIN | Bulk update products |
| DELETE | /products/bulk | Yes | ADMIN | Bulk delete products |
| GET | /products/:id | Yes | All | Get single product |
| PUT | /products/:id | Yes | ADMIN, MANAGER | Update product |
| DELETE | /products/:id | Yes | ADMIN | Delete product |
| POST | /products/:id/images | Yes | ADMIN, MANAGER | Upload product images |
| PUT | /products/:id/images/reorder | Yes | ADMIN, MANAGER | Reorder images |
| DELETE | /products/:id/images/:imageId | Yes | ADMIN, MANAGER | Delete image |

---

## Prerequisites

Before testing Products module:

1. Complete Authentication testing
2. Have valid tokens for ADMIN, MANAGER, and VIEWER roles
3. Note down product IDs created during testing for update/delete operations

---

## Test Case 1: GET /products

### 1.1 Happy Path - List All Products (No Filters)

**Prerequisites:** Add Bearer token (any role)

**Request:** GET `/products`

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "<uuid>",
        "sku": "CAFE-ESP-001",
        "price": 15.99,
        "section": "CAFE",
        "cafeProduct": {
          "name": "Espresso Blend",
          "category": "Coffee Beans"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.2 Happy Path - List with Pagination

**Request:** GET `/products?page=1&limit=5`

**Expected Response:** `200 OK` with 5 products max

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.3 Happy Path - Filter by Section (CAFE)

**Request:** GET `/products?section=CAFE`

**Expected Response:** `200 OK` with only CAFE products

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.4 Happy Path - Filter by Section (FLOWERS)

**Request:** GET `/products?section=FLOWERS`

**Expected Response:** `200 OK` with only FLOWERS products

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.5 Happy Path - Filter by Section (BOOKS)

**Request:** GET `/products?section=BOOKS`

**Expected Response:** `200 OK` with only BOOKS products

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.6 Happy Path - Search Products

**Request:** GET `/products?search=espresso`

**Expected Response:** `200 OK` with products matching "espresso" in name, title, author, description, or SKU

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.7 Happy Path - Filter by Cafe Category

**Request:** GET `/products?section=CAFE&cafeCategory=Coffee Beans`

**Expected Response:** `200 OK` with cafe products in "Coffee Beans" category

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.8 Happy Path - Filter by Author (Books)

**Request:** GET `/products?section=BOOKS&author=Jane Doe`

**Expected Response:** `200 OK` with books by "Jane Doe"

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.9 Happy Path - Filter by Genre (Books)

**Request:** GET `/products?section=BOOKS&genre=Fiction`

**Expected Response:** `200 OK` with fiction books

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.10 Happy Path - Filter by Arrangement Type (Flowers)

**Request:** GET `/products?section=FLOWERS&arrangementType=Bouquet`

**Expected Response:** `200 OK` with bouquet arrangements

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.11 Happy Path - Filter by Price Range

**Request:** GET `/products?minPrice=10&maxPrice=50`

**Expected Response:** `200 OK` with products between $10-$50

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.12 Happy Path - Sort by Price Ascending

**Request:** GET `/products?sortBy=price&sortOrder=asc`

**Expected Response:** `200 OK` with products sorted from lowest to highest price

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.13 Happy Path - Sort by Price Descending

**Request:** GET `/products?sortBy=price&sortOrder=desc`

**Expected Response:** `200 OK` with products sorted from highest to lowest price

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.14 Happy Path - Filter Active Products

**Request:** GET `/products?isActive=true`

**Expected Response:** `200 OK` with only active products

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.15 Happy Path - Filter Featured Products

**Request:** GET `/products?isFeatured=true`

**Expected Response:** `200 OK` with only featured products

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.16 Happy Path - Combined Filters

**Request:** GET `/products?section=CAFE&isActive=true&minPrice=10&maxPrice=30&sortBy=price&sortOrder=asc`

**Expected Response:** `200 OK` with filtered and sorted results

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.17 Edge Case - Empty Result Set

**Request:** GET `/products?search=nonexistentproduct12345`

**Expected Response:** `200 OK` with empty products array

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.18 Edge Case - Invalid Page Number

**Request:** GET `/products?page=0`

**Expected Response:** `400 Bad Request` or default to page 1

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.19 Edge Case - Excessive Limit

**Request:** GET `/products?limit=1000`

**Expected Response:** `400 Bad Request` (max limit is 100)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 1.20 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:** GET `/products`

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 2: POST /products

### 2.1 Happy Path - Create CAFE Product (ADMIN)

**Prerequisites:** Login as ADMIN, add Bearer token

**Request:**
```json
{
  "section": "CAFE",
  "sku": "CAFE-TEST-001",
  "price": 15.99,
  "compareAtPrice": 19.99,
  "costPrice": 8.50,
  "stockQuantity": 100,
  "trackQuantity": true,
  "continueSellingOutOfStock": false,
  "tags": ["organic", "fair-trade"],
  "collections": ["limited-run"],
  "status": "ACTIVE",
  "cafeAttributes": {
    "name": "Test Espresso Blend",
    "description": "Rich and smooth test espresso",
    "category": "Coffee Beans",
    "origin": "Colombia",
    "roastLevel": "Medium",
    "caffeineContent": "High",
    "size": "250g",
    "temperature": "Hot",
    "allergens": ["nuts"],
    "calories": 150
  }
}
```

**Expected Response:** `201 Created`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Product ID Created:** ___________________________________________

**Notes:**
___________________________________________

---

### 2.2 Happy Path - Create FLOWERS Product (MANAGER)

**Prerequisites:** Login as MANAGER, add Bearer token

**Request:**
```json
{
  "section": "FLOWERS",
  "sku": "FLW-TEST-001",
  "price": 45.00,
  "stockQuantity": 50,
  "flowersAttributes": {
    "name": "Test Spring Bouquet",
    "description": "Beautiful test arrangement",
    "arrangementType": "Bouquet",
    "occasion": "Birthday",
    "colors": ["red", "pink", "white"],
    "flowerTypes": ["roses", "tulips", "lilies"],
    "size": "Medium",
    "seasonality": "Spring",
    "careInstructions": "Keep in cool water, change daily",
    "vaseIncluded": true
  }
}
```

**Expected Response:** `201 Created`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Product ID Created:** ___________________________________________

**Notes:**
___________________________________________

---

### 2.3 Happy Path - Create BOOKS Product (ADMIN)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-TEST-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Test Novel: The Great Adventure",
    "description": "An epic test tale",
    "author": "Test Author",
    "isbn": "978-1234567890",
    "publisher": "Test Publishing",
    "publishDate": "2024-01-15T00:00:00Z",
    "language": "English",
    "pageCount": 350,
    "format": "Hardcover",
    "genre": "Fiction",
    "condition": "New",
    "edition": "First Edition",
    "dimensions": "8.5 x 5.5 x 1.2 inches",
    "weight": 500
  }
}
```

**Expected Response:** `201 Created`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Product ID Created:** ___________________________________________

**Notes:**
___________________________________________

---

### 2.4 Validation Error - Missing Required Field (section)

**Request:**
```json
{
  "sku": "MISSING-SECTION-001",
  "price": 15.99,
  "stockQuantity": 100
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.5 Validation Error - Missing Required Field (sku)

**Request:**
```json
{
  "section": "CAFE",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.6 Validation Error - Missing Required Field (price)

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-PRICE-001",
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.7 Validation Error - Missing Required Field (stockQuantity)

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-STOCK-001",
  "price": 15.99,
  "cafeAttributes": {
    "name": "Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.8 Validation Error - Missing Section-Specific Attributes (CAFE)

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-ATTRS-001",
  "price": 15.99,
  "stockQuantity": 100
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.9 Validation Error - Wrong Section Attributes

**Request:**
```json
{
  "section": "CAFE",
  "sku": "WRONG-ATTRS-001",
  "price": 15.99,
  "stockQuantity": 100,
  "booksAttributes": {
    "title": "Wrong",
    "author": "Wrong",
    "format": "Hardcover",
    "genre": "Fiction"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.10 Validation Error - Missing Required Cafe Attribute (name)

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-NAME-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "category": "Coffee Beans"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.11 Validation Error - Missing Required Cafe Attribute (category)

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-CAT-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Test Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.12 Validation Error - Missing Required Flowers Attribute (name)

**Request:**
```json
{
  "section": "FLOWERS",
  "sku": "FLW-NO-NAME-001",
  "price": 45.00,
  "stockQuantity": 50,
  "flowersAttributes": {
    "arrangementType": "Bouquet"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.13 Validation Error - Missing Required Flowers Attribute (arrangementType)

**Request:**
```json
{
  "section": "FLOWERS",
  "sku": "FLW-NO-TYPE-001",
  "price": 45.00,
  "stockQuantity": 50,
  "flowersAttributes": {
    "name": "Test Bouquet"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.14 Validation Error - Missing Required Books Attribute (title)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-NO-TITLE-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "author": "Test Author",
    "format": "Hardcover",
    "genre": "Fiction"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.15 Validation Error - Missing Required Books Attribute (author)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-NO-AUTHOR-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Test Book",
    "format": "Hardcover",
    "genre": "Fiction"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.16 Validation Error - Missing Required Books Attribute (format)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-NO-FORMAT-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Test Book",
    "author": "Test Author",
    "genre": "Fiction"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.17 Validation Error - Missing Required Books Attribute (genre)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-NO-GENRE-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Test Book",
    "author": "Test Author",
    "format": "Hardcover"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.18 Conflict Error - Duplicate SKU

**Request:**
```json
{
  "section": "CAFE",
  "sku": "CAFE-TEST-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Duplicate SKU Product",
    "category": "Coffee"
  }
}
```

**Expected Response:** `409 Conflict`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.19 Conflict Error - Duplicate ISBN (Books)

**Request:**
```json
{
  "section": "BOOKS",
  "sku": "BOOK-DUP-ISBN-001",
  "price": 24.99,
  "stockQuantity": 75,
  "booksAttributes": {
    "title": "Another Book",
    "author": "Another Author",
    "isbn": "978-1234567890",
    "format": "Hardcover",
    "genre": "Fiction"
  }
}
```

**Expected Response:** `409 Conflict`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.20 Edge Case - Negative Price

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NEG-PRICE-001",
  "price": -10.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Negative Price Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.21 Edge Case - Zero Price

**Request:**
```json
{
  "section": "CAFE",
  "sku": "ZERO-PRICE-001",
  "price": 0,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Free Product",
    "category": "Coffee"
  }
}
```

**Expected Response:** Should accept or reject based on business logic

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.22 Edge Case - Negative Stock Quantity

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NEG-STOCK-001",
  "price": 15.99,
  "stockQuantity": -10,
  "cafeAttributes": {
    "name": "Negative Stock Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.23 Edge Case - Very Long Product Name

**Request:**
```json
{
  "section": "CAFE",
  "sku": "LONG-NAME-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "This is an extremely long product name that goes on and on and on to test the maximum length validation for product names in the database and application",
    "category": "Coffee"
  }
}
```

**Expected Response:** Depends on validation rules

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.24 Edge Case - Special Characters in Name

**Request:**
```json
{
  "section": "CAFE",
  "sku": "SPECIAL-CHAR-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Café Olé™ - Premium Espresso (100% Organic)",
    "category": "Coffee Beans"
  }
}
```

**Expected Response:** `201 Created` (should accept special characters)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.25 Edge Case - Invalid Status Value

**Request:**
```json
{
  "section": "CAFE",
  "sku": "INVALID-STATUS-001",
  "price": 15.99,
  "stockQuantity": 100,
  "status": "PUBLISHED",
  "cafeAttributes": {
    "name": "Test Coffee",
    "category": "Coffee"
  }
}
```

**Expected Response:** `400 Bad Request` (valid values: ACTIVE, DRAFT, ARCHIVED)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.26 Authorization Error - VIEWER Role Attempts Create

**Prerequisites:** Login as VIEWER, add Bearer token

**Request:**
```json
{
  "section": "CAFE",
  "sku": "VIEWER-TEST-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "Viewer Attempt",
    "category": "Coffee"
  }
}
```

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 2.27 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:**
```json
{
  "section": "CAFE",
  "sku": "NO-AUTH-001",
  "price": 15.99,
  "stockQuantity": 100,
  "cafeAttributes": {
    "name": "No Auth Test",
    "category": "Coffee"
  }
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 3: GET /products/:id

### 3.1 Happy Path - Get Product by Valid ID

**Prerequisites:** Use a product ID created in previous tests

**Request:** GET `/products/<valid-product-id>`

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "sku": "CAFE-TEST-001",
    "price": 15.99,
    "section": "CAFE",
    "cafeProduct": {
      "name": "Test Espresso Blend",
      "category": "Coffee Beans",
      "origin": "Colombia"
    }
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.2 Error - Non-existent Product ID

**Request:** GET `/products/00000000-0000-0000-0000-000000000000`

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.3 Validation Error - Invalid UUID Format

**Request:** GET `/products/invalid-uuid-format`

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 3.4 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:** GET `/products/<valid-product-id>`

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 4: PUT /products/:id

### 4.1 Happy Path - Update Product Base Fields (ADMIN)

**Prerequisites:** Use product ID from Test 2.1

**Request:** PUT `/products/<cafe-product-id>`
```json
{
  "price": 17.99,
  "stockQuantity": 150,
  "tags": ["organic", "fair-trade", "premium"]
}
```

**Expected Response:** `200 OK` with updated product

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.2 Happy Path - Update Cafe Attributes (MANAGER)

**Prerequisites:** Login as MANAGER

**Request:** PUT `/products/<cafe-product-id>`
```json
{
  "cafeAttributes": {
    "name": "Updated Espresso Blend",
    "description": "Now even more delicious",
    "roastLevel": "Dark"
  }
}
```

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.3 Happy Path - Update Flowers Product

**Prerequisites:** Use product ID from Test 2.2

**Request:** PUT `/products/<flowers-product-id>`
```json
{
  "price": 49.99,
  "flowersAttributes": {
    "name": "Updated Spring Bouquet",
    "colors": ["red", "pink", "white", "yellow"]
  }
}
```

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.4 Happy Path - Update Books Product

**Prerequisites:** Use product ID from Test 2.3

**Request:** PUT `/products/<books-product-id>`
```json
{
  "price": 22.99,
  "booksAttributes": {
    "title": "Updated Novel Title",
    "condition": "Used - Like New"
  }
}
```

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.5 Happy Path - Change Product Status

**Request:** PUT `/products/<valid-product-id>`
```json
{
  "status": "ARCHIVED"
}
```

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.6 Error - Update Non-existent Product

**Request:** PUT `/products/00000000-0000-0000-0000-000000000000`
```json
{
  "price": 99.99
}
```

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.7 Edge Case - Update with Wrong Section Attributes

**Purpose:** Try to update CAFE product with flowersAttributes

**Request:** PUT `/products/<cafe-product-id>`
```json
{
  "flowersAttributes": {
    "name": "Wrong Section",
    "arrangementType": "Bouquet"
  }
}
```

**Expected Response:** `400 Bad Request` or ignored (depending on implementation)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.8 Validation Error - Invalid Data Type

**Request:** PUT `/products/<valid-product-id>`
```json
{
  "price": "not a number"
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.9 Authorization Error - VIEWER Attempts Update

**Prerequisites:** Login as VIEWER

**Request:** PUT `/products/<valid-product-id>`
```json
{
  "price": 99.99
}
```

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 4.10 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:** PUT `/products/<valid-product-id>`
```json
{
  "price": 99.99
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 5: DELETE /products/:id

### 5.1 Happy Path - Soft Delete Product (ADMIN)

**Prerequisites:** Create a test product to delete

**Request:** DELETE `/products/<test-product-id>`

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.2 Verification - Soft Deleted Product Not in List

**Purpose:** Verify soft-deleted product doesn't appear in GET /products

**Request:** GET `/products`

**Expected Response:** Deleted product should not be in the list

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.3 Happy Path - Hard Delete Product (force=true)

**Prerequisites:** Create another test product

**Request:** DELETE `/products/<test-product-id>?force=true`

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.4 Error - Delete Non-existent Product

**Request:** DELETE `/products/00000000-0000-0000-0000-000000000000`

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.5 Authorization Error - MANAGER Attempts Delete

**Prerequisites:** Login as MANAGER

**Request:** DELETE `/products/<valid-product-id>`

**Expected Response:** `403 Forbidden` (only ADMIN can delete)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.6 Authorization Error - VIEWER Attempts Delete

**Prerequisites:** Login as VIEWER

**Request:** DELETE `/products/<valid-product-id>`

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 5.7 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:** DELETE `/products/<valid-product-id>`

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 6: PATCH /products/bulk

### 6.1 Happy Path - Bulk Update Multiple Products (ADMIN)

**Prerequisites:** Have at least 3 product IDs

**Request:**
```json
{
  "productIds": ["<id1>", "<id2>", "<id3>"],
  "updates": {
    "isActive": true,
    "isFeatured": true,
    "tags": ["bulk-updated", "special-offer"]
  }
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.2 Validation Error - Missing productIds

**Request:**
```json
{
  "updates": {
    "isActive": true
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.3 Validation Error - Missing updates

**Request:**
```json
{
  "productIds": ["<id1>", "<id2>"]
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.4 Validation Error - Empty productIds Array

**Request:**
```json
{
  "productIds": [],
  "updates": {
    "isActive": true
  }
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.5 Edge Case - Some Invalid Product IDs

**Request:**
```json
{
  "productIds": ["<valid-id>", "00000000-0000-0000-0000-000000000000"],
  "updates": {
    "isActive": false
  }
}
```

**Expected Response:** Update valid ones only, or fail entirely (depends on implementation)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.6 Authorization Error - MANAGER Attempts Bulk Update

**Prerequisites:** Login as MANAGER

**Request:**
```json
{
  "productIds": ["<id1>", "<id2>"],
  "updates": {
    "isActive": true
  }
}
```

**Expected Response:** `403 Forbidden` (only ADMIN)

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 6.7 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:**
```json
{
  "productIds": ["<id1>"],
  "updates": {
    "isActive": true
  }
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 7: DELETE /products/bulk

### 7.1 Happy Path - Bulk Soft Delete (ADMIN)

**Prerequisites:** Create multiple test products for deletion

**Request:**
```json
{
  "productIds": ["<test-id1>", "<test-id2>", "<test-id3>"],
  "force": false
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "deletedCount": 3
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 7.2 Happy Path - Bulk Hard Delete (force=true)

**Prerequisites:** Create test products

**Request:**
```json
{
  "productIds": ["<test-id1>", "<test-id2>"],
  "force": true
}
```

**Expected Response:** `200 OK`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 7.3 Validation Error - Missing productIds

**Request:**
```json
{
  "force": false
}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 7.4 Authorization Error - MANAGER Attempts Bulk Delete

**Prerequisites:** Login as MANAGER

**Request:**
```json
{
  "productIds": ["<id1>", "<id2>"]
}
```

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 7.5 Error - Missing Authorization Header

**Prerequisites:** Remove Bearer token

**Request:**
```json
{
  "productIds": ["<id1>"]
}
```

**Expected Response:** `401 Unauthorized`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 8: POST /products/:id/images

### 8.1 Happy Path - Upload Single Image (ADMIN)

**Prerequisites:** Have a valid product ID and test image file

**Request:** POST `/products/<product-id>/images`
- Form Data: `images` = [select image file]

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "uploadedImages": [
      {
        "id": "<uuid>",
        "url": "<image-url>",
        "position": 0
      }
    ]
  }
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 8.2 Happy Path - Upload Multiple Images

**Request:** POST `/products/<product-id>/images`
- Form Data: `images` = [select 3 image files]

**Expected Response:** `200 OK` with 3 uploaded images

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 8.3 Validation Error - Exceed Max Images (10)

**Request:** POST `/products/<product-id>/images`
- Form Data: `images` = [select 11 image files]

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 8.4 Error - Upload to Non-existent Product

**Request:** POST `/products/00000000-0000-0000-0000-000000000000/images`

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 8.5 Authorization Error - VIEWER Attempts Upload

**Prerequisites:** Login as VIEWER

**Request:** POST `/products/<product-id>/images`

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 9: PUT /products/:id/images/reorder

### 9.1 Happy Path - Reorder Images (ADMIN)

**Prerequisites:** Product with multiple images uploaded

**Request:** PUT `/products/<product-id>/images/reorder`
```json
{
  "imageOrder": ["<image-id-2>", "<image-id-1>", "<image-id-3>"]
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Images reordered successfully"
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 9.2 Validation Error - Missing imageOrder

**Request:** PUT `/products/<product-id>/images/reorder`
```json
{}
```

**Expected Response:** `400 Bad Request`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 9.3 Error - Invalid Image IDs

**Request:** PUT `/products/<product-id>/images/reorder`
```json
{
  "imageOrder": ["invalid-id-1", "invalid-id-2"]
}
```

**Expected Response:** `400 Bad Request` or `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Test Case 10: DELETE /products/:id/images/:imageId

### 10.1 Happy Path - Delete Image (ADMIN)

**Prerequisites:** Product with uploaded images

**Request:** DELETE `/products/<product-id>/images/<image-id>`

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 10.2 Error - Delete Non-existent Image

**Request:** DELETE `/products/<product-id>/images/00000000-0000-0000-0000-000000000000`

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 10.3 Error - Delete from Non-existent Product

**Request:** DELETE `/products/00000000-0000-0000-0000-000000000000/images/<image-id>`

**Expected Response:** `404 Not Found`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

### 10.4 Authorization Error - VIEWER Attempts Delete

**Prerequisites:** Login as VIEWER

**Request:** DELETE `/products/<product-id>/images/<image-id>`

**Expected Response:** `403 Forbidden`

**Test Result:** [ ] ✅ PASS  [ ] ❌ FAIL  [ ] ⚠️ WARNING

**Notes:**
___________________________________________

---

## Summary

### Test Results Overview

| Endpoint | Total Tests | Passed | Failed | Warnings |
|----------|-------------|--------|--------|----------|
| GET /products | 20 | | | |
| POST /products | 27 | | | |
| GET /products/:id | 4 | | | |
| PUT /products/:id | 10 | | | |
| DELETE /products/:id | 7 | | | |
| PATCH /products/bulk | 7 | | | |
| DELETE /products/bulk | 5 | | | |
| POST /products/:id/images | 5 | | | |
| PUT /products/:id/images/reorder | 3 | | | |
| DELETE /products/:id/images/:imageId | 4 | | | |
| **TOTAL** | **92** | | | |

### Critical Issues Found

1.
2.
3.

### Non-Critical Issues / Improvements

1.
2.
3.

### Section-Specific Observations

**CAFE Products:**
___________________________________________

**FLOWERS Products:**
___________________________________________

**BOOKS Products:**
___________________________________________

### Notes for Development Team

___________________________________________
___________________________________________
___________________________________________
