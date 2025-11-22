# TRIO API Quick Reference

Quick reference guide for the most commonly used API endpoints.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

### Login

```bash
POST /auth/login

{
  "email": "admin@trio.com",
  "password": "Admin@123"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "ADMIN" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Using the Token

Add to all requests:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Product Management

### Create Product - Cafe

```bash
POST /products

{
  "name": "Cappuccino",
  "description": "Classic Italian coffee",
  "section": "CAFE",
  "price": 350,
  "sku": "CAF-CAP-001",
  "stockQuantity": 100,
  "status": "ACTIVE",
  "cafeAttributes": {
    "category": "coffee",
    "caffeineContent": "high",
    "sizes": ["Small", "Medium", "Large"],
    "temperatureOptions": ["hot", "iced"],
    "ingredients": ["Espresso", "Milk", "Foam"],
    "allergens": ["Dairy"],
    "calories": 120,
    "preparationTime": "5 mins"
  }
}
```

### Create Product - Flowers

```bash
POST /products

{
  "name": "Rose Bouquet",
  "description": "Beautiful red roses",
  "section": "FLOWERS",
  "price": 2500,
  "sku": "FLO-ROS-001",
  "stockQuantity": 25,
  "status": "ACTIVE",
  "flowersAttributes": {
    "flowerTypes": ["Roses"],
    "colors": ["Red"],
    "arrangementType": "bouquet",
    "stemCount": 12,
    "vaseIncluded": false,
    "occasions": ["Anniversary", "Birthday"],
    "careInstructions": "Keep in cool water",
    "deliveryOptions": ["standard", "express"]
  }
}
```

### Create Product - Books

```bash
POST /products

{
  "title": "Atomic Habits",
  "description": "Build good habits",
  "section": "BOOKS",
  "price": 1450,
  "sku": "BOO-SEL-001",
  "stockQuantity": 40,
  "status": "ACTIVE",
  "booksAttributes": {
    "author": "James Clear",
    "isbn": "978-0735211292",
    "publisher": "Avery",
    "publicationDate": "2018-10-16",
    "pages": 320,
    "language": "English",
    "format": "hardcover",
    "condition": "new",
    "genre": ["Self-Help", "Business"]
  }
}
```

### List Products

```bash
# All products
GET /products

# Filter by section
GET /products?section=CAFE

# Search
GET /products?search=coffee

# Advanced filters
GET /products?section=CAFE&category=coffee&minPrice=300&maxPrice=500&page=1&limit=20

# Sort
GET /products?sortBy=price&sortOrder=asc
```

### Get Single Product

```bash
GET /products/:id
```

### Update Product

```bash
PUT /products/:id

{
  "price": 400,
  "stockQuantity": 80
}
```

### Delete Product

```bash
# Soft delete
DELETE /products/:id

# Hard delete (admin only)
DELETE /products/:id?force=true
```

### Upload Images

```bash
POST /products/:id/images
Content-Type: multipart/form-data

Form fields:
- images: [file1.jpg, file2.jpg]

# Using curl:
curl -X POST http://localhost:5000/api/v1/products/PRODUCT_ID/images \
  -H "Authorization: Bearer TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### Delete Image

```bash
DELETE /products/:productId/images/:imageId
```

### Reorder Images

```bash
PUT /products/:id/images/reorder

{
  "imageIds": ["img-3", "img-1", "img-2"]
}
```

### Bulk Update

```bash
PATCH /products/bulk

{
  "productIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "ACTIVE",
    "tags": ["featured"]
  }
}
```

### Bulk Delete

```bash
DELETE /products/bulk

{
  "productIds": ["id1", "id2", "id3"]
}
```

## Query Parameters Reference

### List Products

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `search` | string | `coffee` | Search in name/description/SKU |
| `section` | enum | `CAFE` | CAFE, FLOWERS, BOOKS |
| `status` | enum | `ACTIVE` | ACTIVE, DRAFT |
| `availability` | enum | `AVAILABLE` | AVAILABLE, OUT_OF_STOCK, SEASONAL |
| `sortBy` | string | `price` | createdAt, price, name, title |
| `sortOrder` | string | `asc` | asc, desc |
| `minPrice` | number | `100` | Minimum price |
| `maxPrice` | number | `500` | Maximum price |
| `minStock` | number | `10` | Minimum stock |
| `maxStock` | number | `100` | Maximum stock |
| `tags` | string | `coffee,hot` | Comma-separated |
| `collections` | string | `bestseller` | Comma-separated |

### Cafe-Specific Filters

| Parameter | Example | Values |
|-----------|---------|--------|
| `category` | `coffee` | coffee, tea, pastry, sandwich, dessert |
| `caffeineContent` | `high` | none, low, medium, high |

### Flowers-Specific Filters

| Parameter | Example | Values |
|-----------|---------|--------|
| `arrangementType` | `bouquet` | bouquet, vase, basket, box, single_stem |
| `colors` | `red,white` | Comma-separated colors |

### Books-Specific Filters

| Parameter | Example | Values |
|-----------|---------|--------|
| `author` | `James Clear` | Author name (partial match) |
| `genre` | `Fiction` | Comma-separated genres |
| `format` | `hardcover` | hardcover, paperback, ebook |
| `condition` | `new` | new, used_like_new, used_good |
| `language` | `English` | Language name |

## Common cURL Examples

### Login and Save Token

```bash
# Login
response=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trio.com","password":"Admin@123"}')

# Extract token (requires jq)
token=$(echo $response | jq -r '.data.accessToken')

# Use token
curl http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $token"
```

### Create Product with All Fields

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "name": "Iced Latte",
    "description": "Refreshing cold coffee",
    "section": "CAFE",
    "price": 400,
    "compareAtPrice": 450,
    "costPrice": 200,
    "sku": "CAF-ICL-001",
    "stockQuantity": 75,
    "trackQuantity": true,
    "continueSellingOutOfStock": false,
    "status": "ACTIVE",
    "tags": ["coffee", "cold", "popular"],
    "collections": ["Cold Beverages"],
    "cafeAttributes": {
      "category": "coffee",
      "caffeineContent": "high",
      "sizes": ["Small", "Medium", "Large"],
      "temperatureOptions": ["iced"],
      "ingredients": ["Espresso", "Milk", "Ice"],
      "allergens": ["Dairy"],
      "calories": 140,
      "preparationTime": "4 mins"
    }
  }'
```

### Complex Query

```bash
curl "http://localhost:5000/api/v1/products?\
section=CAFE&\
category=coffee&\
caffeineContent=high&\
minPrice=300&\
maxPrice=500&\
availability=AVAILABLE&\
status=ACTIVE&\
sortBy=price&\
sortOrder=asc&\
page=1&\
limit=10" \
  -H "Authorization: Bearer $token"
```

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { /* your data */ },
  "message": "Operation successful"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ /* products */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 95,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0",
        "value": -100
      }
    ]
  }
}
```

## User Roles & Permissions

| Role | Products Read | Products Write | Products Delete | Scope |
|------|--------------|----------------|-----------------|-------|
| ADMIN | ✅ | ✅ | ✅ | All sections |
| MANAGER | ✅ | ✅ | ❌ | Assigned section only |
| STAFF | ✅ | ❌ | ❌ | Read-only |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General | 100 requests/minute |
| Create (POST) | 10 requests/minute |
| Upload | 5 requests/minute |
| Bulk operations | 5 requests/5 minutes |

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `DUPLICATE_ENTRY` | 409 | SKU/email already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Testing with Postman

1. Import this collection URL (create one using Postman)
2. Set environment variable `baseUrl` = `http://localhost:5000/api/v1`
3. Set environment variable `token` = `YOUR_ACCESS_TOKEN`
4. Use `{{baseUrl}}` and `{{token}}` in requests

---

**For full API documentation, see [API Docs folder](./API%20Docs/)**
