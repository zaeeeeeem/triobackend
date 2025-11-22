# Product Management API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-20
**Module:** Product Management
**Base URL:** `/api/products`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
   - [Product CRUD Operations](#product-crud-operations)
   - [Product Search & Filtering](#product-search--filtering)
   - [Product Variants](#product-variants)
   - [Product Images](#product-images)
   - [Bulk Operations](#bulk-operations)
5. [Business Logic & Validation](#business-logic--validation)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Overview

The Product Management module handles all product-related operations for the TRIO Shopify platform, supporting three distinct business sections:
- **Cafe** - Coffee, tea, pastries, and other food items
- **Flowers** - Bouquets, arrangements, and floral products
- **Books** - Physical and digital books

Each section has unique attributes while sharing common product functionality.

### Key Features
- Multi-section product management (Cafe, Flowers, Books)
- Advanced search and filtering
- Inventory tracking and management
- Product variants support
- Image upload and management
- Role-based access control
- Real-time availability calculation

---

## Authentication & Authorization

### Authentication

All Product API endpoints require JWT authentication via Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "admin@trio.com",
  "role": "admin",
  "permissions": [
    "products:read",
    "products:write",
    "products:delete",
    "inventory:read",
    "inventory:write"
  ],
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Role-Based Access Control (RBAC)

| Role | Read | Create | Update | Delete | Scope |
|------|------|--------|--------|--------|-------|
| **admin** | ✅ | ✅ | ✅ | ✅ | All sections |
| **manager** | ✅ | ✅ | ✅ | ⚠️ Limited | Assigned section only |
| **staff** | ✅ | ❌ | ❌ | ❌ | Read-only |

### Required Permissions

- `GET /api/products` → `products:read`
- `POST /api/products` → `products:write`
- `PUT /api/products/:id` → `products:write`
- `DELETE /api/products/:id` → `products:delete`
- `POST /api/products/:id/images` → `products:write`

### Section-Based Authorization

Managers can only access products in their assigned section:
- **Cafe Manager** → Can only manage cafe products
- **Flowers Manager** → Can only manage flower products
- **Books Manager** → Can only manage book products

The backend must validate:
```javascript
if (user.role === 'manager' && product.section !== user.assignedSection) {
  return 403 Forbidden;
}
```

---

## Data Models

### Base Product Interface

All products share these common fields:

```typescript
interface BaseProduct {
  // Identifiers
  id: string;                    // UUID
  sku: string;                   // Unique SKU (e.g., "CAF-CAP-001")

  // Basic Information
  name?: string;                 // Used for cafe & flowers
  title?: string;                // Used for books
  description: string;
  section: "cafe" | "flowers" | "books";

  // Pricing
  price: number;                 // In PKR (e.g., 350 for Rs 350)
  compareAtPrice?: number;       // Original price for sale items
  costPrice?: number;            // Cost to business

  // Inventory
  stockQuantity: number;
  trackQuantity: boolean;
  continueSellingOutOfStock: boolean;
  availability: "available" | "out_of_stock" | "seasonal" | "pre_order";

  // Media
  images: ProductImage[];

  // Organization
  tags: string[];
  collections: string[];
  status: "active" | "draft";

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete timestamp
  createdBy: string;             // User ID
  updatedBy: string;             // User ID
}
```

### Section-Specific Models

#### 1. Cafe Product

```typescript
interface CafeProduct extends BaseProduct {
  section: "cafe";
  name: string;                  // Required (e.g., "Cappuccino")

  cafeAttributes: {
    // Category
    category: "coffee" | "tea" | "pastry" | "sandwich" | "dessert" | "smoothie";

    // Beverage-specific
    caffeineContent: "none" | "low" | "medium" | "high";
    sizes: string[];             // ["Small", "Medium", "Large"]
    temperatureOptions: ("hot" | "iced" | "room")[];

    // Nutritional & Ingredients
    ingredients: string[];       // ["Espresso", "Milk", "Foam"]
    allergens: string[];         // ["Dairy", "Nuts"]
    calories?: number;           // Nutritional info

    // Operations
    preparationTime: string;     // "5 mins"
  };
}
```

**Example Cafe Product:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Cappuccino",
  "description": "Classic Italian espresso with steamed milk and foam",
  "section": "cafe",
  "price": 350,
  "sku": "CAF-CAP-001",
  "stockQuantity": 100,
  "availability": "available",
  "cafeAttributes": {
    "category": "coffee",
    "caffeineContent": "high",
    "sizes": ["Small", "Medium", "Large"],
    "temperatureOptions": ["hot", "iced"],
    "ingredients": ["Espresso", "Milk", "Foam"],
    "allergens": ["Dairy"],
    "calories": 120,
    "preparationTime": "5 mins"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### 2. Flowers Product

```typescript
interface FlowersProduct extends BaseProduct {
  section: "flowers";
  name: string;                  // Required (e.g., "Rose Elegance Bouquet")

  flowersAttributes: {
    // Product Details
    flowerTypes: string[];       // ["Roses", "Tulips"]
    colors: string[];            // ["Red", "White", "Pink"]
    arrangementType: "bouquet" | "vase" | "basket" | "box" | "single_stem";

    // Specifications
    stemCount: number;           // Number of stems
    vaseIncluded: boolean;

    // Care & Occasions
    occasions: string[];         // ["Wedding", "Birthday", "Anniversary"]
    careInstructions: string;    // Care guide text
    freshnessDate?: Date;        // Expected freshness until

    // Delivery
    deliveryOptions: ("standard" | "express" | "same_day")[];
  };
}
```

**Example Flowers Product:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Rose Elegance Bouquet",
  "description": "A stunning arrangement of premium red roses",
  "section": "flowers",
  "price": 2500,
  "sku": "FLO-ROS-001",
  "stockQuantity": 25,
  "availability": "available",
  "flowersAttributes": {
    "flowerTypes": ["Roses"],
    "colors": ["Red"],
    "arrangementType": "bouquet",
    "stemCount": 12,
    "vaseIncluded": false,
    "occasions": ["Anniversary", "Birthday", "Apology"],
    "careInstructions": "Keep in cool water, change water daily, trim stems at an angle",
    "freshnessDate": "2025-11-27T00:00:00Z",
    "deliveryOptions": ["standard", "express", "same_day"]
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### 3. Books Product

```typescript
interface BooksProduct extends BaseProduct {
  section: "books";
  title: string;                 // Required (e.g., "The Kite Runner")

  booksAttributes: {
    // Author & Publishing
    author: string;              // "Khaled Hosseini"
    isbn: string;                // "978-1594631931"
    publisher: string;           // "Riverhead Books"
    publicationDate: Date;

    // Physical Details
    pages: number;
    language: string;            // "English", "Urdu"
    format: "hardcover" | "paperback" | "ebook";
    condition: "new" | "used_like_new" | "used_good" | "used_acceptable";

    // Categories
    genre: string[];             // ["Fiction", "Historical", "Drama"]
  };
}
```

**Example Books Product:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "title": "The Kite Runner",
  "description": "A powerful story of friendship, betrayal, and redemption",
  "section": "books",
  "price": 950,
  "sku": "BOO-FIC-001",
  "stockQuantity": 35,
  "availability": "available",
  "booksAttributes": {
    "author": "Khaled Hosseini",
    "isbn": "978-1594631931",
    "publisher": "Riverhead Books",
    "publicationDate": "2003-05-29T00:00:00Z",
    "pages": 371,
    "language": "English",
    "format": "paperback",
    "condition": "new",
    "genre": ["Fiction", "Historical", "Drama"]
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Product Image Model

```typescript
interface ProductImage {
  id: string;
  productId: string;

  // Image URLs
  original: string;              // Full size (e.g., 1200x1200)
  medium: string;                // Medium size (600x600)
  thumbnail: string;             // Thumbnail (200x200)

  // Metadata
  alt?: string;                  // Alt text for accessibility
  position: number;              // Display order (0-indexed)

  createdAt: Date;
}
```

### Product Variant Model

```typescript
interface ProductVariant {
  id: string;
  productId: string;

  // Variant Details
  title: string;                 // "Large / Red"
  options: {
    size?: string;
    color?: string;
    [key: string]: string;
  };

  // Pricing & Inventory
  price: number;
  sku: string;
  inventory: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### Inventory Item Model

```typescript
interface InventoryItem {
  id: string;
  productId: string;

  // Product Info
  productName: string;
  sku: string;
  section: "cafe" | "flowers" | "books";
  variant?: string;

  // Stock Quantities
  onHand: number;                // Physical stock in location
  committed: number;             // Reserved for pending orders
  available: number;             // Calculated: onHand - committed
  incoming: number;              // Expected from purchase orders

  // Location & Supplier
  location: string;              // "Main Warehouse", "Cafe Location"
  supplier?: string;

  // Pricing
  costPrice: string;             // Cost from supplier
  sellingPrice: string;          // Retail price

  // Status
  status: "in_stock" | "low_stock" | "out_of_stock" | "discontinued";

  // Reorder Management
  reorderPoint: number;          // Trigger reorder when stock drops below
  reorderQuantity: number;       // Suggested order quantity
  lastRestocked?: Date;

  // Metadata
  unit: string;                  // "units", "kg", "boxes"
  barcode?: string;
}
```

---

## API Endpoints

### Product CRUD Operations

#### 1. Create Product

**Endpoint:** `POST /api/products`

**Permission Required:** `products:write`

**Request Body:**

```typescript
{
  // Common fields
  name?: string;                 // Required for cafe & flowers
  title?: string;                // Required for books
  description: string;
  section: "cafe" | "flowers" | "books";
  price: number;
  sku: string;

  // Inventory
  stockQuantity: number;
  trackQuantity?: boolean;       // default: true
  continueSellingOutOfStock?: boolean;

  // Optional fields
  compareAtPrice?: number;
  costPrice?: number;
  tags?: string[];
  collections?: string[];
  status?: "active" | "draft";   // default: "draft"

  // Section-specific attributes
  cafeAttributes?: CafeAttributes;
  flowersAttributes?: FlowersAttributes;
  booksAttributes?: BooksAttributes;
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Cappuccino",
      "section": "cafe",
      "price": 350,
      "sku": "CAF-CAP-001",
      "stockQuantity": 100,
      "availability": "available",
      "status": "draft",
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-20T10:30:00Z"
    }
  },
  "message": "Product created successfully"
}
```

**Validation Rules:**
- `name` or `title`: Required, 2-255 characters
- `description`: Optional, max 2000 characters
- `price`: Required, must be > 0, max 999999
- `section`: Required, must be one of: cafe, flowers, books
- `sku`: Required, unique, alphanumeric with hyphens
- `stockQuantity`: Required, >= 0

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "sku",
        "message": "SKU already exists"
      },
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  }
}

// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

#### 2. Get Product by ID

**Endpoint:** `GET /api/products/:id`

**Permission Required:** `products:read`

**URL Parameters:**
- `id` (string, required) - Product UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Cappuccino",
      "description": "Classic Italian espresso with steamed milk and foam",
      "section": "cafe",
      "price": 350,
      "compareAtPrice": 420,
      "costPrice": 150,
      "sku": "CAF-CAP-001",
      "stockQuantity": 100,
      "trackQuantity": true,
      "continueSellingOutOfStock": false,
      "availability": "available",
      "status": "active",
      "images": [
        {
          "id": "img-001",
          "original": "https://cdn.trio.com/products/cappuccino-original.jpg",
          "medium": "https://cdn.trio.com/products/cappuccino-medium.jpg",
          "thumbnail": "https://cdn.trio.com/products/cappuccino-thumb.jpg",
          "alt": "Cappuccino with latte art",
          "position": 0
        }
      ],
      "cafeAttributes": {
        "category": "coffee",
        "caffeineContent": "high",
        "sizes": ["Small", "Medium", "Large"],
        "temperatureOptions": ["hot", "iced"],
        "ingredients": ["Espresso", "Milk", "Foam"],
        "allergens": ["Dairy"],
        "calories": 120,
        "preparationTime": "5 mins"
      },
      "tags": ["coffee", "espresso", "popular"],
      "collections": ["Hot Beverages", "Bestsellers"],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-11-20T10:30:00Z",
      "createdBy": "user-uuid-123"
    }
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 550e8400-e29b-41d4-a716-446655440001 not found"
  }
}
```

---

#### 3. Update Product

**Endpoint:** `PUT /api/products/:id`

**Permission Required:** `products:write`

**Request Body:** (All fields optional, only include fields to update)

```typescript
{
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  trackQuantity?: boolean;
  continueSellingOutOfStock?: boolean;
  status?: "active" | "draft";
  tags?: string[];
  collections?: string[];

  // Section-specific attributes
  cafeAttributes?: Partial<CafeAttributes>;
  flowersAttributes?: Partial<FlowersAttributes>;
  booksAttributes?: Partial<BooksAttributes>;
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Cappuccino",
      "price": 380,
      "updatedAt": "2025-11-20T14:30:00Z"
    }
  },
  "message": "Product updated successfully"
}
```

**Business Logic:**
- Automatically recalculate `availability` based on `stockQuantity`
- Update `updatedAt` timestamp
- Set `updatedBy` to current user ID
- Validate section-specific attributes if provided
- Prevent changing `section` after creation

**Error Responses:**

```json
// 400 Bad Request - Cannot change section
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Product section cannot be changed after creation"
  }
}

// 409 Conflict - SKU already exists
{
  "success": false,
  "error": {
    "code": "DUPLICATE_SKU",
    "message": "SKU CAF-CAP-002 already exists for another product"
  }
}
```

---

#### 4. Delete Product

**Endpoint:** `DELETE /api/products/:id`

**Permission Required:** `products:delete`

**Implementation:** Soft delete (set `deletedAt` timestamp)

**Query Parameters:**
- `force` (boolean, optional) - If true, permanently delete (admin only)

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "deletedAt": "2025-11-20T15:00:00Z"
  }
}
```

**Business Logic:**
- Default: Soft delete by setting `deletedAt` timestamp
- Check for active orders: Cannot delete if product is in pending/processing orders
- If `force=true` and user is admin: Permanently delete from database
- Cascade delete related images and variants (or archive them)

**Error Responses:**

```json
// 409 Conflict - Product in use
{
  "success": false,
  "error": {
    "code": "PRODUCT_IN_USE",
    "message": "Cannot delete product with active orders",
    "details": {
      "activeOrders": 5
    }
  }
}
```

---

### Product Search & Filtering

#### 5. List Products with Filters

**Endpoint:** `GET /api/products`

**Permission Required:** `products:read`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `limit` | integer | No | 20 | Items per page (max: 100) |
| `search` | string | No | - | Search in name, title, description, SKU |
| `section` | string | No | - | Filter by section: cafe, flowers, books |
| `status` | string | No | - | Filter by status: active, draft |
| `availability` | string | No | - | Filter by availability status |
| `sortBy` | string | No | createdAt | Sort field: createdAt, updatedAt, price, name, title |
| `sortOrder` | string | No | desc | Sort order: asc, desc |
| `minPrice` | number | No | - | Minimum price filter |
| `maxPrice` | number | No | - | Maximum price filter |
| `minStock` | number | No | - | Minimum stock quantity |
| `maxStock` | number | No | - | Maximum stock quantity |
| `tags` | string | No | - | Comma-separated tags |
| `collections` | string | No | - | Comma-separated collections |

**Section-Specific Query Parameters:**

**For Cafe (`section=cafe`):**
- `category` - coffee, tea, pastry, sandwich, dessert, smoothie
- `caffeineContent` - none, low, medium, high

**For Flowers (`section=flowers`):**
- `arrangementType` - bouquet, vase, basket, box, single_stem
- `colors` - Comma-separated colors
- `vaseIncluded` - true, false

**For Books (`section=books`):**
- `author` - Author name (partial match)
- `genre` - Comma-separated genres
- `format` - hardcover, paperback, ebook
- `condition` - new, used_like_new, used_good, used_acceptable
- `language` - English, Urdu, etc.

**Example Request:**

```http
GET /api/products?section=cafe&category=coffee&minPrice=300&maxPrice=500&page=1&limit=20&sortBy=price&sortOrder=asc
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Cappuccino",
        "section": "cafe",
        "price": 350,
        "sku": "CAF-CAP-001",
        "stockQuantity": 100,
        "availability": "available",
        "status": "active",
        "images": [
          {
            "thumbnail": "https://cdn.trio.com/products/cappuccino-thumb.jpg",
            "alt": "Cappuccino"
          }
        ],
        "cafeAttributes": {
          "category": "coffee",
          "caffeineContent": "high"
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Latte",
        "section": "cafe",
        "price": 380,
        "sku": "CAF-LAT-001",
        "stockQuantity": 85,
        "availability": "available",
        "status": "active",
        "cafeAttributes": {
          "category": "coffee",
          "caffeineContent": "high"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "totalProducts": 45,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "applied": {
        "section": "cafe",
        "category": "coffee",
        "minPrice": 300,
        "maxPrice": 500
      }
    }
  }
}
```

**Implementation Notes:**

1. **Search Logic:**
   - Search is case-insensitive
   - Search across: name, title, description, SKU
   - For books: Also search author, ISBN
   - Use full-text search or ILIKE for PostgreSQL

2. **Filtering:**
   - Apply filters using WHERE clauses
   - Section-specific filters query JSONB columns
   - Multiple values (tags, collections) use AND logic

3. **Sorting:**
   - Default sort: Most recent first (createdAt DESC)
   - Support sorting by: createdAt, updatedAt, price, name/title, stockQuantity

4. **Pagination:**
   - Calculate `totalPages = Math.ceil(totalProducts / limit)`
   - Return `hasNextPage` and `hasPrevPage` for UI

5. **Performance:**
   - Add database indexes on: section, status, availability, createdAt, price
   - For JSONB queries, add GIN indexes on section-specific attribute columns

---

#### 6. Advanced Product Search

**Endpoint:** `GET /api/products/search`

**Permission Required:** `products:read`

**Query Parameters:**
- `q` (string, required) - Search query
- All other parameters from List Products endpoint

**Features:**
- Full-text search with relevance ranking
- Fuzzy matching for typos
- Keyword highlighting in results

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Cappuccino",
        "relevance": 0.95,
        "highlights": {
          "name": "<mark>Cappuccino</mark>",
          "description": "Classic Italian espresso with steamed milk..."
        }
      }
    ],
    "pagination": { /* ... */ },
    "searchMetadata": {
      "query": "cappuccino",
      "executionTime": "45ms",
      "totalResults": 12
    }
  }
}
```

---

### Product Variants

#### 7. Get Product Variants

**Endpoint:** `GET /api/products/:id/variants`

**Permission Required:** `products:read`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": "var-001",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Small / Hot",
        "options": {
          "size": "Small",
          "temperature": "Hot"
        },
        "price": 300,
        "sku": "CAF-CAP-001-S-H",
        "inventory": 50,
        "createdAt": "2025-01-15T10:30:00Z"
      },
      {
        "id": "var-002",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Large / Iced",
        "options": {
          "size": "Large",
          "temperature": "Iced"
        },
        "price": 420,
        "sku": "CAF-CAP-001-L-I",
        "inventory": 30,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

#### 8. Create Product Variant

**Endpoint:** `POST /api/products/:id/variants`

**Permission Required:** `products:write`

**Request Body:**

```json
{
  "title": "Large / Iced",
  "options": {
    "size": "Large",
    "temperature": "Iced"
  },
  "price": 420,
  "sku": "CAF-CAP-001-L-I",
  "inventory": 30
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "variant": {
      "id": "var-003",
      "productId": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Large / Iced",
      "price": 420,
      "sku": "CAF-CAP-001-L-I",
      "inventory": 30,
      "createdAt": "2025-11-20T10:30:00Z"
    }
  },
  "message": "Variant created successfully"
}
```

**Validation:**
- `sku` must be unique across all products and variants
- `price` must be > 0
- `inventory` must be >= 0

---

#### 9. Update Product Variant

**Endpoint:** `PUT /api/products/:id/variants/:variantId`

**Permission Required:** `products:write`

**Request Body:**

```json
{
  "price": 450,
  "inventory": 25
}
```

**Response:** `200 OK`

---

#### 10. Delete Product Variant

**Endpoint:** `DELETE /api/products/:id/variants/:variantId`

**Permission Required:** `products:write`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

---

### Product Images

#### 11. Upload Product Images

**Endpoint:** `POST /api/products/:id/images`

**Permission Required:** `products:write`

**Content-Type:** `multipart/form-data`

**Request:**

```http
POST /api/products/550e8400-e29b-41d4-a716-446655440001/images
Content-Type: multipart/form-data

---boundary
Content-Disposition: form-data; name="images"; filename="cappuccino.jpg"
Content-Type: image/jpeg

[binary data]
---boundary
Content-Disposition: form-data; name="alt"

Cappuccino with latte art
---boundary--
```

**File Validation:**
- **Supported formats:** JPG, PNG, WEBP
- **Maximum file size:** 5 MB per image
- **Minimum dimensions:** 800x800px
- **Recommended dimensions:** 1200x1200px
- **Maximum images per product:** 10

**Processing:**
1. Validate file type and size
2. Scan for malware
3. Generate 3 versions:
   - **Original:** As uploaded (max 1200x1200)
   - **Medium:** 600x600px
   - **Thumbnail:** 200x200px
4. Upload to CDN
5. Store URLs in database

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "img-001",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "original": "https://cdn.trio.com/products/cappuccino-original.jpg",
        "medium": "https://cdn.trio.com/products/cappuccino-medium.jpg",
        "thumbnail": "https://cdn.trio.com/products/cappuccino-thumb.jpg",
        "alt": "Cappuccino with latte art",
        "position": 0,
        "createdAt": "2025-11-20T10:30:00Z"
      }
    ]
  },
  "message": "Images uploaded successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid file
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File type not supported. Only JPG, PNG, WEBP allowed."
  }
}

// 413 Payload Too Large
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5 MB limit"
  }
}

// 400 Bad Request - Too many images
{
  "success": false,
  "error": {
    "code": "MAX_IMAGES_EXCEEDED",
    "message": "Maximum 10 images allowed per product"
  }
}
```

---

#### 12. Update Image Order

**Endpoint:** `PUT /api/products/:id/images/reorder`

**Permission Required:** `products:write`

**Request Body:**

```json
{
  "imageIds": ["img-003", "img-001", "img-002"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Image order updated successfully"
}
```

---

#### 13. Delete Product Image

**Endpoint:** `DELETE /api/products/:id/images/:imageId`

**Permission Required:** `products:write`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Business Logic:**
- Remove all versions (original, medium, thumbnail) from CDN
- Delete database record
- Update position numbers for remaining images

---

### Bulk Operations

#### 14. Bulk Update Products

**Endpoint:** `PATCH /api/products/bulk`

**Permission Required:** `products:write`

**Request Body:**

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "updates": {
    "status": "active",
    "tags": ["featured"]
  }
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "updated": 2,
    "failed": 0
  },
  "message": "2 products updated successfully"
}
```

---

#### 15. Bulk Delete Products

**Endpoint:** `DELETE /api/products/bulk`

**Permission Required:** `products:delete`

**Request Body:**

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "deleted": 2,
    "failed": 0,
    "errors": []
  },
  "message": "2 products deleted successfully"
}
```

---

#### 16. Export Products

**Endpoint:** `GET /api/products/export`

**Permission Required:** `products:read`

**Query Parameters:**
- `format` - csv, json, xlsx (default: csv)
- `section` - Filter by section
- All filter parameters from List Products

**Response:** File download

```http
Content-Type: text/csv
Content-Disposition: attachment; filename="products-export-2025-11-20.csv"

id,name,section,sku,price,stock,availability
550e8400-e29b-41d4-a716-446655440001,Cappuccino,cafe,CAF-CAP-001,350,100,available
...
```

---

#### 17. Import Products

**Endpoint:** `POST /api/products/import`

**Permission Required:** `products:write`

**Content-Type:** `multipart/form-data`

**Request:**

```http
POST /api/products/import
Content-Type: multipart/form-data

---boundary
Content-Disposition: form-data; name="file"; filename="products.csv"
Content-Type: text/csv

[CSV data]
---boundary--
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "imported": 45,
    "failed": 2,
    "errors": [
      {
        "row": 12,
        "sku": "CAF-TEA-005",
        "error": "SKU already exists"
      },
      {
        "row": 28,
        "sku": "FLO-ROS-020",
        "error": "Invalid price value"
      }
    ]
  },
  "message": "45 products imported successfully, 2 failed"
}
```

**CSV Format Requirements:**
- Headers must match field names
- Required fields: name/title, section, price, sku
- Section-specific fields in separate columns
- Date format: ISO 8601 (YYYY-MM-DD)

---

## Business Logic & Validation

### Availability Calculation

The `availability` field is automatically calculated based on stock:

```javascript
function calculateAvailability(stockQuantity, manualStatus, continueSellingOutOfStock) {
  // Manual statuses override calculation
  if (manualStatus === 'seasonal' || manualStatus === 'pre_order') {
    return manualStatus;
  }

  // Stock-based calculation
  if (stockQuantity > 0) {
    return 'available';
  } else if (stockQuantity === 0) {
    return continueSellingOutOfStock ? 'available' : 'out_of_stock';
  }
}
```

### Inventory Reservation Logic

When an order is placed:

```javascript
// 1. Reserve stock (commit)
available = onHand - committed;
committed += orderQuantity;
available -= orderQuantity;

// 2. Order fulfilled
onHand -= orderQuantity;
committed -= orderQuantity;
// available stays the same

// 3. Order cancelled
committed -= orderQuantity;
available += orderQuantity;
```

### Low Stock Alerts

Trigger alerts when stock drops below reorder point:

```javascript
if (availableQuantity <= reorderPoint) {
  createAlert({
    type: 'LOW_STOCK',
    productId: product.id,
    productName: product.name,
    currentStock: availableQuantity,
    reorderPoint: reorderPoint,
    suggestedOrderQty: reorderQuantity
  });
}
```

### Price Validation

```javascript
// Price constraints
price > 0
price <= 999999
price % 0.01 === 0  // Two decimal places max

// Compare-at price
if (compareAtPrice) {
  compareAtPrice > price  // Must be higher than selling price
}

// Cost price
if (costPrice) {
  costPrice < price  // Cost should be less than selling price
}
```

### SKU Generation & Validation

**Format:** `{SECTION}-{CATEGORY}-{NUMBER}`

**Examples:**
- Cafe: `CAF-CAP-001`, `CAF-TEA-042`
- Flowers: `FLO-ROS-001`, `FLO-MIX-015`
- Books: `BOO-FIC-001`, `BOO-BIO-023`

**Validation:**
- Must be unique across all products and variants
- Alphanumeric with hyphens only
- 5-50 characters
- Case-insensitive uniqueness check

### Section-Specific Validation

#### Cafe Products

```javascript
// Required fields
cafeAttributes.category: Required
cafeAttributes.caffeineContent: Required
cafeAttributes.sizes: Array, min 1 item
cafeAttributes.temperatureOptions: Array, min 1 item
cafeAttributes.preparationTime: Required

// Optional validation
if (cafeAttributes.calories) {
  cafeAttributes.calories > 0
}
```

#### Flowers Products

```javascript
// Required fields
flowersAttributes.flowerTypes: Array, min 1 item
flowersAttributes.colors: Array, min 1 item
flowersAttributes.arrangementType: Required
flowersAttributes.stemCount: Required, > 0
flowersAttributes.careInstructions: Required

// Date validation
if (flowersAttributes.freshnessDate) {
  freshnessDate >= today
}
```

#### Books Products

```javascript
// Required fields
booksAttributes.author: Required, min 2 chars
booksAttributes.publisher: Required
booksAttributes.pages: Required, > 0
booksAttributes.language: Required
booksAttributes.format: Required
booksAttributes.condition: Required
booksAttributes.genre: Array, min 1 item

// ISBN validation (optional field)
if (booksAttributes.isbn) {
  validateISBN(isbn)  // ISBN-10 or ISBN-13 format
  isUnique(isbn)      // Must be unique
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional information
  }
}
```

### HTTP Status Codes

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate SKU, product in use |
| 413 | Payload Too Large | File upload too large |
| 422 | Unprocessable Entity | Business logic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `PRODUCT_NOT_FOUND` | Product doesn't exist |
| `DUPLICATE_SKU` | SKU already exists |
| `PRODUCT_IN_USE` | Cannot delete (has active orders) |
| `INVALID_FILE` | Invalid file type or format |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `MAX_IMAGES_EXCEEDED` | Too many images |
| `INVALID_OPERATION` | Operation not allowed |
| `INSUFFICIENT_STOCK` | Not enough inventory |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | CDN/third-party service error |

### Validation Error Details

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
      },
      {
        "field": "sku",
        "message": "SKU already exists",
        "value": "CAF-CAP-001"
      },
      {
        "field": "cafeAttributes.category",
        "message": "Invalid category. Must be one of: coffee, tea, pastry, sandwich, dessert, smoothie",
        "value": "beverage"
      }
    ]
  }
}
```

---

## Examples

### Example 1: Create Cafe Product (Full)

**Request:**

```http
POST /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Caramel Macchiato",
  "description": "Smooth espresso with vanilla syrup, steamed milk, and caramel drizzle",
  "section": "cafe",
  "price": 420,
  "compareAtPrice": 500,
  "costPrice": 180,
  "sku": "CAF-MAC-001",
  "stockQuantity": 75,
  "trackQuantity": true,
  "continueSellingOutOfStock": false,
  "status": "active",
  "tags": ["coffee", "sweet", "popular"],
  "collections": ["Hot Beverages", "Specialty Coffee"],
  "cafeAttributes": {
    "category": "coffee",
    "caffeineContent": "high",
    "sizes": ["Small", "Medium", "Large"],
    "temperatureOptions": ["hot", "iced"],
    "ingredients": ["Espresso", "Milk", "Vanilla Syrup", "Caramel Sauce"],
    "allergens": ["Dairy"],
    "calories": 250,
    "preparationTime": "6 mins"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Caramel Macchiato",
      "section": "cafe",
      "price": 420,
      "sku": "CAF-MAC-001",
      "stockQuantity": 75,
      "availability": "available",
      "status": "active",
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-20T10:30:00Z"
    }
  },
  "message": "Product created successfully"
}
```

---

### Example 2: Create Flowers Product (Full)

**Request:**

```http
POST /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Spring Mix Vase",
  "description": "A delightful mix of seasonal spring flowers in an elegant glass vase",
  "section": "flowers",
  "price": 3800,
  "sku": "FLO-MIX-001",
  "stockQuantity": 15,
  "trackQuantity": true,
  "status": "active",
  "tags": ["seasonal", "spring", "gift"],
  "collections": ["Spring Collection", "Vase Arrangements"],
  "flowersAttributes": {
    "flowerTypes": ["Tulips", "Daffodils", "Hyacinths", "Freesias"],
    "colors": ["Yellow", "Pink", "White", "Purple"],
    "arrangementType": "vase",
    "stemCount": 20,
    "vaseIncluded": true,
    "occasions": ["Birthday", "Thank You", "Get Well"],
    "careInstructions": "Keep in cool location away from direct sunlight. Change water every 2 days. Trim stems at an angle weekly.",
    "freshnessDate": "2025-11-27T00:00:00Z",
    "deliveryOptions": ["standard", "express", "same_day"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Spring Mix Vase",
      "section": "flowers",
      "price": 3800,
      "sku": "FLO-MIX-001",
      "stockQuantity": 15,
      "availability": "available",
      "status": "active",
      "createdAt": "2025-11-20T10:30:00Z"
    }
  },
  "message": "Product created successfully"
}
```

---

### Example 3: Create Books Product (Full)

**Request:**

```http
POST /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Atomic Habits",
  "description": "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.",
  "section": "books",
  "price": 1450,
  "sku": "BOO-SEL-001",
  "stockQuantity": 40,
  "trackQuantity": true,
  "status": "active",
  "tags": ["bestseller", "self-help", "productivity"],
  "collections": ["Bestsellers", "Self Improvement"],
  "booksAttributes": {
    "author": "James Clear",
    "isbn": "978-0735211292",
    "publisher": "Avery",
    "publicationDate": "2018-10-16T00:00:00Z",
    "pages": 320,
    "language": "English",
    "format": "hardcover",
    "condition": "new",
    "genre": ["Self-Help", "Psychology", "Business"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "title": "Atomic Habits",
      "section": "books",
      "price": 1450,
      "sku": "BOO-SEL-001",
      "stockQuantity": 40,
      "availability": "available",
      "status": "active",
      "createdAt": "2025-11-20T10:30:00Z"
    }
  },
  "message": "Product created successfully"
}
```

---

### Example 4: Search Cafe Products with Filters

**Request:**

```http
GET /api/products?section=cafe&category=coffee&caffeineContent=high&minPrice=300&maxPrice=500&availability=available&sortBy=price&sortOrder=asc&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Cappuccino",
        "section": "cafe",
        "price": 350,
        "sku": "CAF-CAP-001",
        "stockQuantity": 100,
        "availability": "available",
        "images": [
          {
            "thumbnail": "https://cdn.trio.com/products/cappuccino-thumb.jpg"
          }
        ],
        "cafeAttributes": {
          "category": "coffee",
          "caffeineContent": "high"
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "name": "Latte",
        "section": "cafe",
        "price": 380,
        "sku": "CAF-LAT-001",
        "stockQuantity": 85,
        "availability": "available",
        "cafeAttributes": {
          "category": "coffee",
          "caffeineContent": "high"
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Caramel Macchiato",
        "section": "cafe",
        "price": 420,
        "sku": "CAF-MAC-001",
        "stockQuantity": 75,
        "availability": "available",
        "cafeAttributes": {
          "category": "coffee",
          "caffeineContent": "high"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalProducts": 3,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "filters": {
      "applied": {
        "section": "cafe",
        "category": "coffee",
        "caffeineContent": "high",
        "minPrice": 300,
        "maxPrice": 500,
        "availability": "available"
      }
    }
  }
}
```

---

### Example 5: Upload Product Images

**Request:**

```http
POST /api/products/550e8400-e29b-41d4-a716-446655440001/images
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="images"; filename="cappuccino-1.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="images"; filename="cappuccino-2.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="alt"

Cappuccino with latte art
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response:**

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "img-001",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "original": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-1-original.jpg",
        "medium": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-1-medium.jpg",
        "thumbnail": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-1-thumb.jpg",
        "alt": "Cappuccino with latte art",
        "position": 0,
        "createdAt": "2025-11-20T10:35:00Z"
      },
      {
        "id": "img-002",
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "original": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-2-original.jpg",
        "medium": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-2-medium.jpg",
        "thumbnail": "https://cdn.trio.com/products/550e8400-e29b-41d4-a716-446655440001/cappuccino-2-thumb.jpg",
        "alt": "Cappuccino with latte art",
        "position": 1,
        "createdAt": "2025-11-20T10:35:00Z"
      }
    ]
  },
  "message": "2 images uploaded successfully"
}
```

---

### Example 6: Update Product (Partial Update)

**Request:**

```http
PUT /api/products/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "price": 380,
  "stockQuantity": 85,
  "tags": ["coffee", "espresso", "popular", "featured"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Cappuccino",
      "price": 380,
      "stockQuantity": 85,
      "availability": "available",
      "tags": ["coffee", "espresso", "popular", "featured"],
      "updatedAt": "2025-11-20T14:30:00Z"
    }
  },
  "message": "Product updated successfully"
}
```

---

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,

  -- Basic Information
  name VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  section VARCHAR(20) NOT NULL CHECK (section IN ('cafe', 'flowers', 'books')),

  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price > price),
  cost_price DECIMAL(10, 2) CHECK (cost_price < price),

  -- Inventory
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  track_quantity BOOLEAN DEFAULT true,
  continue_selling_out_of_stock BOOLEAN DEFAULT false,
  availability VARCHAR(20) DEFAULT 'available',

  -- Status & Organization
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
  tags TEXT[],
  collections TEXT[],

  -- Section-specific attributes (JSONB for flexibility)
  cafe_attributes JSONB,
  flowers_attributes JSONB,
  books_attributes JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Indexes
  CONSTRAINT valid_section_attributes CHECK (
    (section = 'cafe' AND cafe_attributes IS NOT NULL) OR
    (section = 'flowers' AND flowers_attributes IS NOT NULL) OR
    (section = 'books' AND books_attributes IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_products_section ON products(section);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- GIN indexes for JSONB columns (for section-specific queries)
CREATE INDEX idx_cafe_attributes ON products USING GIN (cafe_attributes);
CREATE INDEX idx_flowers_attributes ON products USING GIN (flowers_attributes);
CREATE INDEX idx_books_attributes ON products USING GIN (books_attributes);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(title, '') || ' ' || COALESCE(description, ''))
);
```

### Product Images Table

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Image URLs
  original_url VARCHAR(500) NOT NULL,
  medium_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,

  -- Metadata
  alt_text VARCHAR(255),
  position INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure position uniqueness per product
  UNIQUE(product_id, position)
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

### Product Variants Table

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  options JSONB NOT NULL,

  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  sku VARCHAR(100) UNIQUE NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0 CHECK (inventory >= 0),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
```

---

## Security Considerations

### 1. Price Manipulation Prevention

```javascript
// NEVER trust client prices for order calculations
// Always fetch from database
async function createOrder(orderData) {
  // ❌ WRONG - Using client-provided price
  const total = orderData.items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );

  // ✅ CORRECT - Fetch prices from database
  const products = await db.products.findMany({
    where: { id: { in: orderData.items.map(i => i.productId) } }
  });

  const total = orderData.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product.price * item.quantity);
  }, 0);
}
```

### 2. Image Upload Security

- **File type validation:** Only allow JPG, PNG, WEBP
- **File size limits:** Max 5 MB per file
- **Malware scanning:** Scan all uploads
- **Storage:** Store outside web root, serve via CDN
- **Rate limiting:** Limit uploads per user per time period

### 3. Inventory Concurrency

```javascript
// Use database transactions for atomic inventory updates
async function reserveInventory(productId, quantity) {
  return await db.$transaction(async (tx) => {
    // Lock the row for update
    const product = await tx.products.findUnique({
      where: { id: productId },
      lock: 'FOR UPDATE'
    });

    if (product.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update inventory atomically
    await tx.products.update({
      where: { id: productId },
      data: {
        stockQuantity: product.stockQuantity - quantity
      }
    });
  });
}
```

### 4. Input Sanitization

```javascript
// Sanitize all text inputs
import sanitizeHtml from 'sanitize-html';

function sanitizeProductInput(data) {
  return {
    ...data,
    name: sanitizeHtml(data.name, { allowedTags: [] }),
    description: sanitizeHtml(data.description, {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br']
    })
  };
}
```

### 5. Audit Logging

Log all critical product operations:

```javascript
await auditLog.create({
  userId: req.user.id,
  action: 'PRODUCT_UPDATE',
  resourceType: 'product',
  resourceId: productId,
  changes: {
    before: oldProduct,
    after: newProduct
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});
```

---

## Rate Limiting

Implement rate limits to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/products` | 10 requests | 1 minute |
| `PUT /api/products/:id` | 30 requests | 1 minute |
| `POST /api/products/:id/images` | 5 requests | 1 minute |
| `GET /api/products` | 100 requests | 1 minute |
| `POST /api/products/bulk` | 5 requests | 5 minutes |

---

## Performance Optimization

### 1. Database Query Optimization

```javascript
// Use select to fetch only needed fields
const products = await db.products.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    stockQuantity: true,
    availability: true,
    images: {
      select: { thumbnail: true, alt: true },
      take: 1
    }
  },
  where: { section: 'cafe' },
  take: 20
});
```

### 2. Caching Strategy

```javascript
// Cache product list responses
const cacheKey = `products:${section}:${page}:${filters}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const products = await fetchProducts();
await redis.setex(cacheKey, 300, JSON.stringify(products)); // 5 min TTL
return products;
```

### 3. Image Optimization

- Use CDN for all image delivery
- Implement lazy loading on frontend
- Generate WebP versions for modern browsers
- Use appropriate image sizes based on context

---

## Testing Recommendations

### Unit Tests

- Validation logic for all product types
- Availability calculation
- SKU generation and uniqueness
- Price validation

### Integration Tests

- Full CRUD operations for each section
- Image upload and processing
- Variant management
- Bulk operations

### Load Tests

- List products with filters (100 concurrent requests)
- Create products (10 concurrent requests)
- Image uploads (5 concurrent uploads)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-20 | Initial API documentation |

---

## Support

For questions or issues related to the Product Management API:

- **Documentation:** [Project Overview](/API%20Docs/00-Project-Overview-For-Backend.md)
- **Related APIs:** [Order Management](/API%20Docs/01-Order-Management-API.md)
- **Security:** [Security Guidelines](/API%20Docs/Security-Guidelines.md)

---

**End of Product Management API Documentation**
