# Product Management API Documentation

**Version:** 2.0.0
**Last Updated:** 2025-12-04
**Module:** Product Management
**Base URL:** `/api/v1/products`
**Server URL:** `http://localhost:5000/api/v1/products` (configurable via `SERVER_URL` environment variable)

---

## 1. Overview

The Product Management module powers TRIO's multi-business catalog (Cafe, Flowers, Books) on a single unified API surface. The backend provides comprehensive SKU management, optimized search, inventory synchronization, and media workflows while keeping section-specific attributes isolated in dedicated tables.

### Key capabilities
- Multi-section create/read/update/delete with shared SKU, pricing, and inventory controls
- Section-aware search, filtering, and pagination with Redis-backed caching (5 minute TTL)
- Automatic availability calculation and inventory item creation per product
- Role-based access controls (Admin, Manager, Staff) enforced at routing and query level
- Rich media pipeline: validation, resizing (1200/600/200px), S3/MinIO upload, reordering, signed URL generation, and cleanup
- Bulk management operations (update/delete) with rate limiting for operational safety
- Signed URL generation for secure image access with configurable TTL

### What's new in v2.0.0
- Prisma Class Table Inheritance for section data (`cafe_products`, `flowers_products`, `books_products`)
- Strict SKU validation with conflict detection and deletion guards when active orders exist
- Consistent API responses through `ApiResponseHandler` (`success`, `data`, `message`/`error`)
- Advanced filters (tags/collections/min-max price & stock, section attributes) with manager scoping
- Unified media service enforcing `MAX_FILE_SIZE`, `MAX_FILES_PER_PRODUCT`, and consistent WebP output
- S3/MinIO integration with signed URL support for secure private bucket access

---

## 2. Authentication & Authorization

**Public Endpoints (No authentication required):**
- `GET /api/v1/products` - List products (open for customer browsing)
- `GET /api/v1/products/:id` - Get product details (open for customer browsing)

**Protected Endpoints (Authentication required):**
All other endpoints require authentication via JWT bearer token:

```http
Authorization: Bearer <JWT access token>
```

Decoded token payload:

```json
{
  "sub": "user-uuid",
  "email": "admin@trio.com",
  "role": "ADMIN",
  "assignedSection": "CAFE",
  "iat": 1707890000,
  "exp": 1707893600
}
```

### Role & Access matrix
| Route | Public (No Auth) | Staff | Manager | Admin |
|-------|:----------------:|:-----:|:-------:|:-----:|
| `GET /api/v1/products` | ✅ All sections | ✅ All sections | ✅ Restricted to `assignedSection` (if authenticated) | ✅ All sections |
| `GET /:id` | ✅ Full details | ✅ Full details | ✅ Full details | ✅ Full details |
| `POST /` | ❌ | ❌ | ✅ Must use own section | ✅ |
| `PUT /:id` | ❌ | ❌ | ✅ Intended for own section only | ✅ |
| `DELETE /:id` | ❌ | ❌ | ❌ | ✅ |
| `POST /:id/images` | ❌ | ❌ | ✅ | ✅ |
| `PUT /:id/images/reorder` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /:id/images/:imageId` | ❌ | ❌ | ✅ | ✅ |
| `PATCH /bulk` | ❌ | ❌ | ❌ | ✅ |
| `DELETE /bulk` | ❌ | ❌ | ❌ | ✅ |

**Important notes:**
- **Public access:** Unauthenticated users (customers) can browse all products and view details for storefront display
- **Manager scoping:** If a Manager is authenticated, list queries are automatically scoped to their `assignedSection`, regardless of supplied `section` parameter
- **Protected operations:** Only Admin and Manager roles can create/update/delete products
- Frontend should implement proper authorization checks on the client side for admin features

### Rate limits
- **Global rate limit:** `RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MS` (default: 100 requests/60 seconds)
- **Create product** (`POST /`): 10 requests/minute per client
- **Image uploads** (`POST /:id/images`): 5 requests/minute per client
- **Bulk operations** (`PATCH /bulk`, `DELETE /bulk`): 5 requests per 5 minutes per client

---

## 3. Data model

### Enumerations
- **`Section`**: `CAFE`, `FLOWERS`, `BOOKS`
- **`ProductStatus`**: `ACTIVE`, `DRAFT`
- **`ProductAvailability`**: `AVAILABLE`, `OUT_OF_STOCK`, `SEASONAL`, `PRE_ORDER`

### Base product fields
| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Generated per product |
| `sku` | `string` | Unique, validated by `/^[A-Z0-9-]+$/i`, indexed |
| `section` | `Section` | Dictates which attribute table is populated |
| `price` | `Decimal(10,2)` | Required, must be >= 0.01 and <= 999999 |
| `compareAtPrice` | `Decimal(10,2)?` | Optional strike-through price |
| `costPrice` | `Decimal(10,2)?` | Used by inventory cost tracking |
| `stockQuantity` | `integer` | Current on-hand stock, must be >= 0 |
| `trackQuantity` | `boolean` | Defaults `true` |
| `continueSellingOutOfStock` | `boolean` | Defaults `false`; if true, availability stays `AVAILABLE` even at 0 stock |
| `availability` | `ProductAvailability` | Auto-calculated by service, not user-managed |
| `status` | `ProductStatus` | Defaults `DRAFT` |
| `tags` | `string[]` | Indexed array |
| `collections` | `string[]` | Similar to Shopify collections |
| `createdAt` | `DateTime` | Auto-generated |
| `updatedAt` | `DateTime` | Auto-updated |
| `deletedAt` | `DateTime?` | Soft delete timestamp |
| `createdBy` | `uuid` | User ID from JWT token |
| `updatedBy` | `uuid?` | User ID from JWT token |

### Relations
- `images`: Array of `ProductImage` objects, sorted by `position` ascending
- `variants`: Array of `ProductVariant` objects (placeholder for future API)
- `inventory`: One-to-one relation with `InventoryItem`
- `orderItems`: Array of `OrderItem` objects
- Section-specific: One of `cafeProduct`, `flowersProduct`, or `booksProduct`

### Section-specific attributes

**Cafe (`cafe_products`)**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Display name |
| `description` | `string?` | | Optional rich text |
| `category` | `string` | ✅ | Coffee/Tea/Pastries/etc. |
| `origin` | `string?` | | Bean origin or ingredient source |
| `roastLevel` | `string?` | | Light/Medium/Dark (coffee only) |
| `caffeineContent` | `string?` | | High/Medium/Low/None |
| `size` | `string?` | | e.g., `250g`, `Large` |
| `temperature` | `string?` | | Hot/Iced/Cold Brew |
| `allergens` | `string[]` | | e.g., `['Dairy', 'Nuts']` |
| `calories` | `integer?` | | Nutritional info |

**Flowers (`flowers_products`)**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Arrangement title |
| `description` | `string?` | | Optional |
| `arrangementType` | `string` | ✅ | Bouquet/Vase/Basket/etc. |
| `occasion` | `string?` | | Birthday/Sympathy/etc. |
| `colors` | `string[]` | | Primary palette |
| `flowerTypes` | `string[]` | | Roses/Lilies/etc. |
| `size` | `string?` | | Small/Medium/Large |
| `seasonality` | `string?` | | Availability season |
| `careInstructions` | `string?` | | Text blob |
| `vaseIncluded` | `boolean` | | Defaults `false` |

**Books (`books_products`)**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | ✅ | Display title |
| `description` | `string?` | | Synopsis |
| `author` | `string` | ✅ | Author name |
| `isbn` | `string?` | | Unique when provided |
| `publisher` | `string?` | | Publisher name |
| `publishDate` | `DateTime?` | | Stored as UTC datetime |
| `language` | `string` | | Defaults to `English` |
| `pageCount` | `integer?` | | Number of pages |
| `format` | `string` | ✅ | Hardcover/Paperback/eBook |
| `genre` | `string[]` | ✅ | Array of genres, multiple allowed |
| `condition` | `string` | | Defaults to `New` (New/Like New/Good/Fair) |
| `edition` | `string?` | | Edition information |
| `dimensions` | `string?` | | Free text format |
| `weight` | `integer?` | | Weight in grams |

### Related resources
- **ProductImage**: Stores `originalUrl`, `mediumUrl`, `thumbnailUrl`, `altText`, and `position`. API responses automatically append `signedOriginalUrl`, `signedMediumUrl`, `signedThumbnailUrl` (pre-signed URLs valid for `S3_SIGNED_URL_TTL` seconds, default 600). Cascade delete is enabled when product is deleted.
- **ProductVariant**: Placeholder relation for future variant APIs; currently only read via `GET /:id`. Structure includes `title`, `options` (JSON), `price`, `sku`, and `inventory`.
- **InventoryItem**: Automatically created for each product with derived `productName`, `sku`, `section`, cost/selling price, location (`Main Warehouse`), and reorder defaults (`reorderPoint: 10`, `reorderQuantity: 50`). Stock mutations propagate availability and counts to this table.

---

## 4. Business logic & validation

### Core validation rules
- **SKU uniqueness**: Verified before insert/update. Conflicts return `409 CONFLICT` with error details.
- **SKU format**: Must match pattern `/^[A-Z0-9-]+$/i` (alphanumeric characters and hyphens only).
- **Price validation**: Must be between `0.01` and `999999`.
- **Stock quantity**: Must be integer >= 0.
- **Section-specific attributes**: Required when creating a product. The appropriate attribute object (`cafeAttributes`, `flowersAttributes`, or `booksAttributes`) must be provided based on the `section` value.

### Automatic behaviors
- **Availability calculation**: Automatically recalculated whenever `stockQuantity` or `continueSellingOutOfStock` changes:
  - If `stockQuantity > 0`: `AVAILABLE`
  - If `stockQuantity === 0` and `continueSellingOutOfStock === true`: `AVAILABLE`
  - If `stockQuantity === 0` and `continueSellingOutOfStock === false`: `OUT_OF_STOCK`
- **Inventory item creation**: Each product creation automatically triggers creation of a corresponding `InventoryItem` with:
  - `productName` derived from section-specific name/title
  - Initial `onHand` and `available` set to `stockQuantity`
  - Default `location`: `Main Warehouse`
  - Default `reorderPoint`: 10
  - Default `reorderQuantity`: 50
  - `status`: `IN_STOCK` or `OUT_OF_STOCK` based on stock

### Deletion behavior
- **Soft delete (default)**: `DELETE /:id` sets `deletedAt` timestamp. Product remains in database but excluded from queries.
- **Hard delete**: `DELETE /:id?force=true` permanently removes product and cascades deletion across:
  - Section-specific tables (`cafe_products`, `flowers_products`, `books_products`)
  - All related images (`product_images`)
  - All variants (`product_variants`)
  - Inventory item (`inventory_items`)
- **Active order guard**: Deletion fails with `409 CONFLICT` unless `force=true` when order items exist with fulfillment status `UNFULFILLED` or `PARTIAL`. Error response includes `activeOrders` count.

### Caching strategy
- **Redis caching**: List responses cached by full query signature for 5 minutes (300 seconds).
- **Cache invalidation**: Any create/update/delete/bulk operation invalidates:
  - All product list cache keys: `products:list:*`
  - Section-specific cache keys: `products:<SECTION>:*`
- **Signed URLs**: Generated on-demand for each API response, not cached.

### Image upload & processing
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Max file size**: `MAX_FILE_SIZE` (default: 5,242,880 bytes / 5 MB)
- **Min dimensions**: 800px × 800px (before resizing)
- **Max images per product**: `MAX_FILES_PER_PRODUCT` (default: 10)
- **Processing pipeline**:
  1. Validate file size and format
  2. Validate minimum dimensions
  3. Generate three variants:
     - **Original**: 1200px (max), fit inside, quality 90%, WebP
     - **Medium**: 600px × 600px, fit cover, quality 85%, WebP
     - **Thumbnail**: 200px × 200px, fit cover, quality 80%, WebP
  4. Upload to S3/MinIO at: `${AWS_S3_BASE_PREFIX}/products/<productId>/<size>-<uuid>-<timestamp>.webp`
  5. Store URLs in database with incremental `position`
- **Signed URLs**: Every API response includes pre-signed URLs (`signedOriginalUrl`, `signedMediumUrl`, `signedThumbnailUrl`) valid for `S3_SIGNED_URL_TTL` seconds (default: 600). Stored URLs remain private.

---

## 5. Query parameters & filtering

All query parameters for `GET /api/v1/products`:

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Items per page (max: 100, controlled by `MAX_PAGE_SIZE`) |
| `search` | string | - | Case-insensitive search on SKU, cafe/flowers names/descriptions, book title/author/description |
| `section` | `Section` | - | Filter by section (ignored for Managers - they see only their `assignedSection`) |
| `status` | `ProductStatus` | - | Filter by `ACTIVE` or `DRAFT` |
| `availability` | `ProductAvailability` | - | Filter by availability status |
| `minPrice` | number | - | Minimum price (inclusive) |
| `maxPrice` | number | - | Maximum price (inclusive) |
| `minStock` | integer | - | Minimum stock quantity (inclusive) |
| `maxStock` | integer | - | Maximum stock quantity (inclusive) |
| `tags` | string | - | Comma-separated tags (e.g., `organic,featured`). Performs `hasSome` match |
| `collections` | string | - | Comma-separated collections. Performs `hasSome` match |
| `sortBy` | string | `createdAt` | Sort field: `price`, `createdAt`, `updatedAt` |
| `sortOrder` | string | `desc` | Sort order: `asc` or `desc` |
| `mostDiscounted` | boolean | false | When `true`, returns top 7 products with highest discount percentage (ignores pagination) |

### Section-specific filters

**Cafe section (`section=CAFE`):**
- `cafeCategory`: Filter by category (e.g., `Coffee`, `Tea`)
- `caffeineContent`: Filter by caffeine content
- `origin`: Filter by origin

**Flowers section (`section=FLOWERS`):**
- `arrangementType`: Filter by arrangement type
- `occasion`: Filter by occasion

**Books section (`section=BOOKS`):**
- `author`: Filter by author (case-insensitive contains match)
- `genre`: Filter by genre (checks if array contains the value)
- `format`: Filter by format (e.g., `Hardcover`)
- `condition`: Filter by condition
- `language`: Filter by language

### Special filters

**Most Discounted (`mostDiscounted=true`):**
- Returns exactly 7 products sorted by discount percentage (highest discount first)
- Only includes products with `compareAtPrice` set and greater than 0
- Discount calculation: `((compareAtPrice - price) / compareAtPrice) * 100`
- Ignores pagination parameters (`page`, `limit`)
- Can be combined with other filters (`section`, `status`, etc.)
- Example: `GET /api/v1/products?mostDiscounted=true&section=BOOKS`

### Response structure
- `GET /` returns only the first image (`images[0]`) to keep payload light
- `GET /:id` returns full image gallery and inventory snapshot
- All responses include signed URLs for images

---

## 6. API Endpoints

All responses follow this structure:
```json
{
  "success": boolean,
  "data": object,
  "message": string,
  "pagination": object (for list endpoints)
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### 6.1 List products — `GET /api/v1/products`

**Access:** ✅ PUBLIC (No authentication required) - Open to all customers for storefront browsing

**Authentication:** Optional (if authenticated Manager, automatically scoped to their `assignedSection`)

**Query parameters:** See section 5 for all available filters

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "sku": "CAF-CAP-001",
        "section": "CAFE",
        "price": "3.50",
        "compareAtPrice": null,
        "costPrice": "1.50",
        "stockQuantity": 120,
        "trackQuantity": true,
        "continueSellingOutOfStock": false,
        "availability": "AVAILABLE",
        "status": "ACTIVE",
        "tags": ["featured", "hot"],
        "collections": ["winter-menu"],
        "createdAt": "2025-12-04T10:00:00Z",
        "updatedAt": "2025-12-04T10:00:00Z",
        "deletedAt": null,
        "createdBy": "user-uuid",
        "updatedBy": "user-uuid",
        "cafeProduct": {
          "id": "cafe-uuid",
          "productId": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Cappuccino",
          "description": "Classic Italian cappuccino",
          "category": "Coffee",
          "origin": "Colombia",
          "roastLevel": "Medium",
          "caffeineContent": "High",
          "size": "Medium",
          "temperature": "Hot",
          "allergens": ["Dairy"],
          "calories": 120
        },
        "flowersProduct": null,
        "booksProduct": null,
        "images": [
          {
            "id": "img-uuid",
            "productId": "550e8400-e29b-41d4-a716-446655440001",
            "originalUrl": "app/uploads/products/.../original-xxx-123456.webp",
            "mediumUrl": "app/uploads/products/.../medium-xxx-123456.webp",
            "thumbnailUrl": "app/uploads/products/.../thumb-xxx-123456.webp",
            "altText": "Cappuccino image 1",
            "position": 0,
            "createdAt": "2025-12-04T10:00:00Z",
            "signedOriginalUrl": "https://...?X-Amz-Signature=...",
            "signedMediumUrl": "https://...?X-Amz-Signature=...",
            "signedThumbnailUrl": "https://...?X-Amz-Signature=..."
          }
        ]
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 82,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 6.2 Get product by ID — `GET /api/v1/products/:id`

**Access:** ✅ PUBLIC (No authentication required) - Open to all customers for storefront browsing

**Authentication:** Optional (not required)

**Parameters:**
- `id` (path): Product UUID

**Response:** `200 OK`

Returns complete product details including:
- All base product fields
- Section-specific attributes
- Full image gallery (all images, ordered by position)
- Variants array
- Inventory item snapshot

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "sku": "CAF-CAP-001",
      "section": "CAFE",
      "price": "3.50",
      "compareAtPrice": null,
      "costPrice": "1.50",
      "stockQuantity": 120,
      "trackQuantity": true,
      "continueSellingOutOfStock": false,
      "availability": "AVAILABLE",
      "status": "ACTIVE",
      "tags": ["featured", "hot"],
      "collections": ["winter-menu"],
      "createdAt": "2025-12-04T10:00:00Z",
      "updatedAt": "2025-12-04T10:00:00Z",
      "deletedAt": null,
      "createdBy": "user-uuid",
      "updatedBy": "user-uuid",
      "cafeProduct": {
        "id": "cafe-uuid",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Cappuccino",
        "description": "Classic Italian cappuccino",
        "category": "Coffee",
        "origin": "Colombia",
        "roastLevel": "Medium",
        "caffeineContent": "High",
        "size": "Medium",
        "temperature": "Hot",
        "allergens": ["Dairy"],
        "calories": 120
      },
      "flowersProduct": null,
      "booksProduct": null,
      "images": [
        {
          "id": "img-uuid-1",
          "productId": "550e8400-e29b-41d4-a716-446655440001",
          "originalUrl": "app/uploads/products/.../original-xxx-123456.webp",
          "mediumUrl": "app/uploads/products/.../medium-xxx-123456.webp",
          "thumbnailUrl": "app/uploads/products/.../thumb-xxx-123456.webp",
          "altText": "Cappuccino image 1",
          "position": 0,
          "createdAt": "2025-12-04T10:00:00Z",
          "signedOriginalUrl": "https://...?X-Amz-Signature=...",
          "signedMediumUrl": "https://...?X-Amz-Signature=...",
          "signedThumbnailUrl": "https://...?X-Amz-Signature=..."
        },
        {
          "id": "img-uuid-2",
          "position": 1,
          "..."
        }
      ],
      "variants": [],
      "inventory": {
        "id": "inv-uuid",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "productName": "Cappuccino",
        "sku": "CAF-CAP-001",
        "section": "CAFE",
        "onHand": 120,
        "committed": 0,
        "available": 120,
        "incoming": 0,
        "location": "Main Warehouse",
        "costPrice": "1.50",
        "sellingPrice": "3.50",
        "status": "IN_STOCK",
        "reorderPoint": 10,
        "reorderQuantity": 50
      }
    }
  }
}
```

**Errors:**
- `404 NOT_FOUND`: Product not found or soft-deleted

---

### 6.3 Create product — `POST /api/v1/products`

**Access:** 🔒 PROTECTED - Admin, Manager (must use own section)

**Authentication:** Required

**Request body:**

```json
{
  "sku": "CAF-ESP-001",
  "section": "CAFE",
  "price": 8.99,
  "compareAtPrice": 9.99,
  "costPrice": 5.00,
  "stockQuantity": 200,
  "trackQuantity": true,
  "continueSellingOutOfStock": false,
  "status": "DRAFT",
  "tags": ["organic", "beans"],
  "collections": ["limited-run"],
  "cafeAttributes": {
    "name": "Espresso Blend",
    "description": "Rich, smooth blend",
    "category": "Coffee",
    "origin": "Colombia",
    "roastLevel": "Medium",
    "caffeineContent": "High",
    "size": "250g",
    "temperature": "Hot",
    "allergens": [],
    "calories": 0
  }
}
```

**Required fields:**
- `sku`
- `section`
- `price`
- `stockQuantity`
- Section-specific attributes object (`cafeAttributes`, `flowersAttributes`, or `booksAttributes`)

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "new-product-uuid",
      "sku": "CAF-ESP-001",
      "section": "CAFE",
      "price": "8.99",
      "availability": "AVAILABLE",
      "status": "DRAFT",
      "cafeProduct": {
        "name": "Espresso Blend",
        "category": "Coffee"
      },
      "images": [],
      "variants": [],
      "inventory": {
        "productId": "new-product-uuid",
        "onHand": 200,
        "available": 200,
        "status": "IN_STOCK"
      }
    }
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid input data
- `409 CONFLICT`: SKU already exists

---

### 6.4 Update product — `PUT /api/v1/products/:id`

**Access:** 🔒 PROTECTED - Admin, Manager (intended for own section only)

**Authentication:** Required

**Parameters:**
- `id` (path): Product UUID

**Request body** (all fields optional except `id`):

```json
{
  "price": 7.99,
  "stockQuantity": 150,
  "status": "ACTIVE",
  "tags": ["featured", "signature"],
  "cafeAttributes": {
    "temperature": "Hot",
    "size": "Medium"
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      // Full product object with all relations
    }
  }
}
```

**Notes:**
- Partial updates supported for both base fields and section attributes
- Changing `sku` triggers uniqueness validation
- Changing `stockQuantity` or `continueSellingOutOfStock` recalculates `availability`
- Returns full product details like `GET /:id`

**Errors:**
- `400 VALIDATION_ERROR`: Invalid input data
- `404 NOT_FOUND`: Product not found
- `409 CONFLICT`: New SKU already exists

---

### 6.5 Delete product — `DELETE /api/v1/products/:id`

**Access:** 🔒 PROTECTED - Admin only

**Authentication:** Required

**Parameters:**
- `id` (path): Product UUID
- `force` (query, optional): `true` for hard delete, default `false` (soft delete)

**Soft delete (default):**
```http
DELETE /api/v1/products/:id
```

**Hard delete:**
```http
DELETE /api/v1/products/:id?force=true
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "deletedAt": "2025-12-04T12:00:00Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND`: Product not found
- `409 CONFLICT`: Product has active orders (unless `force=true`)
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "Cannot delete product with active orders",
      "details": {
        "activeOrders": 3
      }
    }
  }
  ```

---

### 6.6 Bulk update products — `PATCH /api/v1/products/bulk`

**Access:** 🔒 PROTECTED - Admin only

**Authentication:** Required

**Rate limit:** 5 requests per 5 minutes

**Request body:**

```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"],
  "updates": {
    "status": "ACTIVE",
    "tags": ["spring", "featured"],
    "flowersAttributes": {
      "seasonality": "Spring"
    }
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "2 products updated successfully",
  "data": {
    "updated": 2,
    "failed": 1,
    "errors": [
      {
        "productId": "uuid-3",
        "error": "Product not found"
      }
    ]
  }
}
```

**Notes:**
- Each product update is processed individually
- Failures for individual products don't stop the entire operation
- Error array includes details for each failed update

---

### 6.7 Bulk delete products — `DELETE /api/v1/products/bulk`

**Access:** 🔒 PROTECTED - Admin only

**Authentication:** Required

**Rate limit:** 5 requests per 5 minutes

**Request body:**

```json
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Query parameters:**
- `force` (optional): `true` for hard delete, default `false`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "2 products deleted successfully",
  "data": {
    "deleted": 2,
    "failed": 1,
    "errors": [
      {
        "productId": "uuid-3",
        "error": "Cannot delete product with active orders"
      }
    ]
  }
}
```

---

### 6.8 Upload product images — `POST /api/v1/products/:id/images`

**Access:** 🔒 PROTECTED - Admin, Manager

**Authentication:** Required

**Rate limit:** 5 requests per minute

**Parameters:**
- `id` (path): Product UUID

**Content-Type:** `multipart/form-data`

**Request body:**
- `images[]`: Array of image files (max 10 files per request)

**Constraints:**
- Max file size: 5 MB (configurable via `MAX_FILE_SIZE`)
- Allowed formats: JPEG, PNG, WebP
- Min dimensions: 800px × 800px
- Max total images per product: 10 (configurable via `MAX_FILES_PER_PRODUCT`)

**Example using cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/v1/products/:id/images \
  -H "Authorization: Bearer <token>" \
  -F "images=@image1.jpg" \
  -F "images=@image2.png"
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "2 images uploaded successfully",
  "data": {
    "images": [
      {
        "id": "img-uuid-1",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "originalUrl": "app/uploads/products/.../original-xxx-123456.webp",
        "mediumUrl": "app/uploads/products/.../medium-xxx-123456.webp",
        "thumbnailUrl": "app/uploads/products/.../thumb-xxx-123456.webp",
        "altText": "Product image 1",
        "position": 0,
        "createdAt": "2025-12-04T10:00:00Z",
        "signedOriginalUrl": "https://...?X-Amz-Signature=...",
        "signedMediumUrl": "https://...?X-Amz-Signature=...",
        "signedThumbnailUrl": "https://...?X-Amz-Signature=..."
      },
      {
        "id": "img-uuid-2",
        "position": 1,
        "..."
      }
    ]
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: No files uploaded, file too large, invalid format, or dimensions too small
- `404 NOT_FOUND`: Product not found

---

### 6.9 Reorder product images — `PUT /api/v1/products/:id/images/reorder`

**Access:** 🔒 PROTECTED - Admin, Manager

**Authentication:** Required

**Parameters:**
- `id` (path): Product UUID

**Request body:**

```json
{
  "imageIds": ["img-uuid-2", "img-uuid-1", "img-uuid-3"]
}
```

**Notes:**
- Must include ALL existing image IDs for the product
- Array order determines new `position` values (0, 1, 2, ...)

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Images reordered successfully",
  "data": null
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Image IDs don't match product images (wrong count or invalid IDs)
- `404 NOT_FOUND`: Product not found

---

### 6.10 Delete product image — `DELETE /api/v1/products/:id/images/:imageId`

**Access:** 🔒 PROTECTED - Admin, Manager

**Authentication:** Required

**Parameters:**
- `id` (path): Product UUID
- `imageId` (path): Image UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

**Notes:**
- Deletes the database record
- Attempts to delete all three S3 objects (original, medium, thumbnail)
- Automatically reorders remaining images to compact positions

**Errors:**
- `400 VALIDATION_ERROR`: Image not found
- `404 NOT_FOUND`: Product not found

---

## 7. Error handling

### Standard error response format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error codes & HTTP status codes

| Scenario | HTTP Status | Error Code | Notes |
|----------|-------------|------------|-------|
| Missing or invalid JWT token | 401 | `UNAUTHORIZED` | Raised by `authenticate` middleware |
| Insufficient permissions | 403 | `FORBIDDEN` | Raised by `authorize` middleware |
| Validation error | 400 | `VALIDATION_ERROR` | Express Validator or service-level validation |
| Product not found | 404 | `PRODUCT_NOT_FOUND` | Product doesn't exist or is soft-deleted |
| SKU conflict | 409 | `CONFLICT` | Includes `details.sku` |
| Active orders on delete | 409 | `CONFLICT` | Includes `details.activeOrders` count |
| Image not found | 400 | `VALIDATION_ERROR` | When deleting unknown image |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | Includes retry-after info |
| No files uploaded | 400 | `NO_FILES` | When uploading images without files |
| Internal server error | 500 | `INTERNAL_SERVER_ERROR` | Unexpected errors |

### Example error responses

**Validation error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "field": "price",
          "message": "Price must be at least 0.01"
        },
        {
          "field": "sku",
          "message": "SKU format is invalid"
        }
      ]
    }
  }
}
```

**SKU conflict:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "SKU CAF-ESP-001 already exists",
    "details": {
      "sku": "CAF-ESP-001"
    }
  }
}
```

**Active orders conflict:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete product with active orders",
    "details": {
      "activeOrders": 3
    }
  }
}
```

---

## 8. Common workflows & best practices

### For frontend developers

**1. Listing products with pagination:**
```javascript
// Get first page of products
GET /api/v1/products?page=1&limit=20&section=CAFE&status=ACTIVE

// Get products with search and filters
GET /api/v1/products?search=coffee&minPrice=5&maxPrice=15&tags=organic
```

**2. Creating a new cafe product:**
```javascript
POST /api/v1/products
{
  "sku": "CAF-LAT-001",
  "section": "CAFE",
  "price": 4.50,
  "stockQuantity": 100,
  "status": "DRAFT",
  "cafeAttributes": {
    "name": "Latte",
    "category": "Coffee",
    "temperature": "Hot"
  }
}

// Then upload images
POST /api/v1/products/:id/images
FormData with images[] files
```

**3. Updating product stock:**
```javascript
PUT /api/v1/products/:id
{
  "stockQuantity": 50
}
// Availability is automatically recalculated
```

**4. Manager dashboard (auto-scoped):**
```javascript
// Manager with assignedSection="CAFE" will only see CAFE products
// even if section parameter is omitted or set to something else
GET /api/v1/products?page=1&limit=20
```

**5. Working with images:**
```javascript
// Display images using signed URLs (valid for 10 minutes by default)
<img src={product.images[0].signedThumbnailUrl} />
<img src={product.images[0].signedMediumUrl} />
<img src={product.images[0].signedOriginalUrl} />

// Reorder images after drag-and-drop
PUT /api/v1/products/:id/images/reorder
{
  "imageIds": ["img-2", "img-1", "img-3"]  // New order
}
```

**6. Bulk operations:**
```javascript
// Activate multiple products
PATCH /api/v1/products/bulk
{
  "productIds": ["uuid-1", "uuid-2", "uuid-3"],
  "updates": {
    "status": "ACTIVE",
    "tags": ["featured"]
  }
}

// Check response for any failures
if (response.data.failed > 0) {
  console.log("Some products failed:", response.data.errors);
}
```

### Important notes

- **Public read access**: Product listing and detail endpoints are publicly accessible without authentication for customer browsing. No JWT token required for `GET` requests.
- **Always use signed URLs** for image display. Stored URLs (`originalUrl`, `mediumUrl`, `thumbnailUrl`) won't work for private buckets.
- **Refresh signed URLs** after 10 minutes (default TTL). Fetch the product again to get new signed URLs.
- **Handle pagination properly**: Check `pagination.hasNextPage` and `pagination.totalPages` for navigation.
- **Manager scoping is automatic**: Managers can only see/modify products in their assigned section on list queries.
- **Cache consideration**: List results are cached for 5 minutes. If you update a product and immediately list again, you might see stale data briefly.
- **Prefer full product fetch** after create/update if you need inventory, variants, or all images. The list endpoint only returns the first image.
- **Error handling**: Always check `success` field and handle error responses appropriately.
- **Rate limits**: Implement exponential backoff for 429 responses.
- **Admin operations**: All create/update/delete operations require authentication and appropriate role permissions.

---

## 9. Environment variables

These environment variables control Product Management behavior:

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret for authentication
- `AWS_S3_BUCKET`: S3 or MinIO bucket name
- `AWS_S3_ACCESS_KEY_ID`: S3 access key
- `AWS_S3_SECRET_ACCESS_KEY`: S3 secret key

### Optional (with defaults)
- `SERVER_URL`: Base server URL (default: `http://localhost:5000`)
- `AWS_S3_REGION`: S3 region (default: `us-east-1`)
- `AWS_S3_BASE_PREFIX`: Storage prefix (default: `app/uploads`)
- `AWS_S3_ENDPOINT`: Custom S3 endpoint for MinIO/compatible services
- `AWS_S3_FORCE_PATH_STYLE`: Use path-style URLs (default: `false`, set to `true` for MinIO)
- `AWS_S3_PUBLIC_URL`: Public base URL for S3 objects (for MinIO)
- `S3_SIGNED_URL_TTL`: Signed URL expiration in seconds (default: `600`)
- `MAX_FILE_SIZE`: Max upload file size in bytes (default: `5242880` = 5MB)
- `MAX_FILES_PER_PRODUCT`: Max images per product (default: `10`)
- `DEFAULT_PAGE_SIZE`: Default pagination limit (default: `20`)
- `MAX_PAGE_SIZE`: Maximum pagination limit (default: `100`)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: `60000`)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: `100`)
- `REDIS_HOST`: Redis host (default: `localhost`)
- `REDIS_PORT`: Redis port (default: `6379`)

---

## 10. Changelog

### Version 2.0.0 (2025-12-04)
- Initial comprehensive API documentation
- Prisma Class Table Inheritance for multi-section products
- S3/MinIO integration with signed URL support
- Redis caching for list queries
- Bulk operations with detailed error reporting
- Automatic inventory item creation
- Soft delete with active order guards
- Image upload with automatic resizing and WebP conversion
- Role-based access control with manager section scoping
- Comprehensive validation and error handling

---

## 11. Support & feedback

For questions, issues, or feature requests related to the Product Management API, please contact the backend development team or create an issue in the project repository.
