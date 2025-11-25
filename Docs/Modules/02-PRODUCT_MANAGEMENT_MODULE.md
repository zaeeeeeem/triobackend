# Product Management Module

## Overview
The Product Management module handles comprehensive product operations across three distinct sections: CAFE, FLOWERS, and BOOKS. It implements a Class Table Inheritance pattern for storing section-specific attributes while maintaining a common base product structure. The module includes advanced filtering, image management, caching, and inventory integration.

---

## Module Structure

### Files
- **Controller:** [src/controllers/product.controller.ts](../../src/controllers/product.controller.ts) (163 lines)
- **Service:** [src/services/product.service.ts](../../src/services/product.service.ts) (607 lines)
- **Routes:** [src/routes/product.routes.ts](../../src/routes/product.routes.ts) (1,042 lines)
- **Types:** [src/types/product.types.ts](../../src/types/product.types.ts) (165 lines)
- **Upload Service:** [src/services/upload.service.ts](../../src/services/upload.service.ts)

### Database Tables
- `products` - Base product table (common fields)
- `cafe_products` - Cafe-specific attributes
- `flowers_products` - Flowers-specific attributes
- `books_products` - Books-specific attributes
- `product_images` - Product image storage (3 sizes)
- `product_variants` - Product variants (size, color, etc.)
- `inventory_items` - Inventory tracking

### Dependencies
- `@prisma/client` - Database operations
- `ioredis` - Redis caching
- `sharp` - Image processing
- `multer` - File upload handling
- `@aws-sdk/client-s3` - S3/MinIO storage
- `express-validator` - Input validation

---

## Architecture: Class Table Inheritance

### Concept
Products have **common attributes** (name, price, SKU) and **section-specific attributes** (origin for coffee, genre for books, flower types for bouquets).

### Implementation
1. **Base Table (`products`)** - Stores common fields for all products
2. **Child Tables** - Store section-specific fields:
   - `cafe_products` - Coffee/tea attributes
   - `flowers_products` - Floral arrangement attributes
   - `books_products` - Book metadata

### Relationships
- **One-to-One:** Each product has exactly ONE section-specific record
- **Mutually Exclusive:** A product cannot be both a book AND a flower
- **Foreign Key:** Section table's `productId` references `products.id`

### Example
```
Product: Cappuccino
├─ products table: { id, name: "Cappuccino", price: 4.50, section: "CAFE" }
└─ cafe_products table: { productId, origin: "Colombia", roastLevel: "Medium", caffeineContent: "High" }

Product: Rose Bouquet
├─ products table: { id, name: "Rose Bouquet", price: 35.00, section: "FLOWERS" }
└─ flowers_products table: { productId, colors: ["Red", "Pink"], flowerTypes: ["Rose"], occasion: "Romance" }
```

---

## Features

### 1. Create Product
**Endpoint:** `POST /api/v1/products`

**Function:** `productService.createProduct()`

**Access:** ADMIN, MANAGER (with section access)

**Process:**
1. Validate common product data
2. Validate section-specific data
3. Create base product record
4. Create section-specific record
5. Create inventory item (automatic)
6. Return complete product with all relationships

**Common Fields:**
- `name` - Product name (required)
- `description` - Product description
- `price` - Product price (required, > 0)
- `compareAtPrice` - Original price for discounts
- `sku` - Stock Keeping Unit (unique)
- `section` - CAFE, FLOWERS, or BOOKS (required)
- `status` - ACTIVE, DRAFT, ARCHIVED
- `tags` - Array of tags
- `collections` - Array of collection names

**CAFE-Specific Fields:**
- `category` - COFFEE, TEA, PASTRY, SNACK, OTHER
- `origin` - Country/region of origin
- `roastLevel` - LIGHT, MEDIUM, DARK (for coffee)
- `caffeineContent` - NONE, LOW, MEDIUM, HIGH
- `flavorNotes` - Array of flavor descriptors
- `allergens` - Array of allergens
- `brewingMethod` - Recommended brewing method
- `servingSize` - Serving size description

**FLOWERS-Specific Fields:**
- `arrangementType` - BOUQUET, ARRANGEMENT, SINGLE_STEM, BASKET, VASE
- `colors` - Array of colors (RED, PINK, WHITE, YELLOW, etc.)
- `flowerTypes` - Array of flower types
- `occasion` - BIRTHDAY, WEDDING, ANNIVERSARY, SYMPATHY, etc.
- `careInstructions` - Care and maintenance instructions
- `stemCount` - Number of stems (if applicable)
- `vaseIncluded` - Boolean flag

**BOOKS-Specific Fields:**
- `title` - Book title (required)
- `author` - Author name (required)
- `isbn` - ISBN-10 or ISBN-13
- `publisher` - Publisher name
- `publicationDate` - Publication date
- `pageCount` - Number of pages
- `language` - Book language (default: "English")
- `format` - HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK
- `genre` - Array of genres (FICTION, MYSTERY, ROMANCE, etc.)
- `summary` - Book summary/description

**Sample Request (Cafe Product):**
```json
{
  "name": "Ethiopian Yirgacheffe",
  "description": "Light roast single-origin coffee with floral notes",
  "price": 18.99,
  "compareAtPrice": 22.99,
  "sku": "CAFE-ETH-001",
  "section": "CAFE",
  "status": "ACTIVE",
  "tags": ["coffee", "single-origin", "light-roast"],
  "collections": ["Premium Coffee"],
  "cafeProduct": {
    "category": "COFFEE",
    "origin": "Ethiopia",
    "roastLevel": "LIGHT",
    "caffeineContent": "MEDIUM",
    "flavorNotes": ["Floral", "Citrus", "Berry"],
    "allergens": [],
    "brewingMethod": "Pour over, French press",
    "servingSize": "12 oz bag"
  }
}
```

**Sample Request (Books Product):**
```json
{
  "name": "The Great Gatsby",
  "description": "Classic American novel by F. Scott Fitzgerald",
  "price": 14.99,
  "sku": "BOOK-GG-001",
  "section": "BOOKS",
  "status": "ACTIVE",
  "tags": ["classic", "american-literature"],
  "collections": ["Classic Novels"],
  "booksProduct": {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "publisher": "Scribner",
    "publicationDate": "1925-04-10",
    "pageCount": 180,
    "language": "English",
    "format": "PAPERBACK",
    "genre": ["FICTION", "CLASSIC"],
    "summary": "A tale of wealth, love, and the American Dream in the 1920s"
  }
}
```

**Automatic Inventory Creation:**
When a product is created, an inventory item is automatically created with:
- `productId` - Link to product
- `sku` - Same as product SKU
- `onHand` - 0 (default)
- `available` - 0
- `committed` - 0
- `incoming` - 0
- `status` - IN_STOCK

---

### 2. Get Product by ID
**Endpoint:** `GET /api/v1/products/:id`

**Function:** `productService.getProductById(id)`

**Access:** Public (no authentication required)

**Process:**
1. Fetch product from database
2. Include section-specific data
3. Include images (all 3 sizes)
4. Include variants
5. Include inventory information
6. Calculate availability status
7. Return complete product

**Availability Calculation:**
- `IN_STOCK` - Available quantity > 0
- `OUT_OF_STOCK` - Available quantity = 0
- `LOW_STOCK` - Available quantity < reorder point
- `PREORDER` - Product not yet released
- `DISCONTINUED` - No longer available

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ethiopian Yirgacheffe",
    "description": "Light roast single-origin coffee",
    "price": 18.99,
    "compareAtPrice": 22.99,
    "sku": "CAFE-ETH-001",
    "section": "CAFE",
    "status": "ACTIVE",
    "availability": "IN_STOCK",
    "tags": ["coffee", "single-origin"],
    "collections": ["Premium Coffee"],
    "images": [
      {
        "id": "uuid",
        "url": "https://s3.../original.webp",
        "mediumUrl": "https://s3.../medium.webp",
        "thumbnailUrl": "https://s3.../thumbnail.webp",
        "position": 1
      }
    ],
    "cafeProduct": {
      "category": "COFFEE",
      "origin": "Ethiopia",
      "roastLevel": "LIGHT",
      "caffeineContent": "MEDIUM",
      "flavorNotes": ["Floral", "Citrus", "Berry"],
      "allergens": [],
      "brewingMethod": "Pour over, French press",
      "servingSize": "12 oz bag"
    },
    "inventory": {
      "onHand": 50,
      "available": 45,
      "committed": 5,
      "incoming": 20
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 3. List Products (Advanced Filtering)
**Endpoint:** `GET /api/v1/products`

**Function:** `productService.listProducts(filters)`

**Access:** Public (no authentication required)

**Caching:** Redis cache with 5-minute TTL

**Query Parameters:**

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Search:**
- `search` - Search in name, title, author, description, SKU (case-insensitive)

**Common Filters:**
- `section` - CAFE, FLOWERS, BOOKS
- `status` - ACTIVE, DRAFT, ARCHIVED
- `availability` - IN_STOCK, OUT_OF_STOCK, LOW_STOCK, PREORDER, DISCONTINUED
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `tags` - Filter by tags (comma-separated)
- `collections` - Filter by collections (comma-separated)

**CAFE Filters:**
- `category` - COFFEE, TEA, PASTRY, SNACK, OTHER
- `origin` - Country/region
- `roastLevel` - LIGHT, MEDIUM, DARK
- `caffeineContent` - NONE, LOW, MEDIUM, HIGH

**FLOWERS Filters:**
- `arrangementType` - BOUQUET, ARRANGEMENT, SINGLE_STEM, etc.
- `colors` - Color filter (comma-separated)
- `occasion` - BIRTHDAY, WEDDING, ANNIVERSARY, etc.

**BOOKS Filters:**
- `author` - Author name
- `genre` - Genre filter (comma-separated)
- `format` - HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK
- `language` - Book language

**Sorting:**
- `sortBy` - Field to sort by (price, name, createdAt, updatedAt)
- `sortOrder` - ASC or DESC

**Example Request:**
```
GET /api/v1/products?section=CAFE&category=COFFEE&roastLevel=LIGHT&minPrice=10&maxPrice=25&sortBy=price&sortOrder=ASC&page=1&limit=20
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "items": [/* array of products */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

**Cache Strategy:**
- Cache key: `products:${JSON.stringify(filters)}`
- TTL: 5 minutes
- Invalidation: On any product create/update/delete

---

### 4. Update Product
**Endpoint:** `PUT /api/v1/products/:id`

**Function:** `productService.updateProduct(id, data)`

**Access:** ADMIN, MANAGER (with section access)

**Process:**
1. Fetch existing product
2. Validate updated data
3. Update base product record
4. Update section-specific record (if provided)
5. Invalidate cache
6. Return updated product

**Updatable Fields:**
- All common fields (name, price, description, etc.)
- Section-specific fields
- Status (ACTIVE, DRAFT, ARCHIVED)

**Restrictions:**
- Cannot change section (CAFE → FLOWERS)
- Cannot change SKU if inventory exists
- Managers can only update products in their section

**Sample Request:**
```json
{
  "price": 16.99,
  "compareAtPrice": 19.99,
  "status": "ACTIVE",
  "cafeProduct": {
    "caffeineContent": "HIGH"
  }
}
```

---

### 5. Delete Product
**Endpoint:** `DELETE /api/v1/products/:id?force=false`

**Function:** `productService.deleteProduct(id, force)`

**Access:** ADMIN only

**Deletion Types:**

**Soft Delete (default):**
- Sets `deletedAt` timestamp
- Product hidden from listings
- Data preserved for recovery
- Can be restored

**Hard Delete (force=true):**
- Permanently removes product
- Deletes section-specific record
- Deletes all images from S3
- Deletes inventory record
- Deletes variants
- Cannot be restored

**Process:**
1. Fetch product with images
2. If soft delete: Set `deletedAt`
3. If hard delete:
   - Delete images from S3/MinIO
   - Delete database records (cascade)
4. Invalidate cache

**Sample Request:**
```
DELETE /api/v1/products/uuid?force=true
```

---

### 6. Bulk Update Products
**Endpoint:** `PATCH /api/v1/products/bulk`

**Function:** `productService.bulkUpdateProducts(updates)`

**Access:** ADMIN only

**Use Cases:**
- Update prices for multiple products
- Change status (activate/deactivate)
- Add tags to multiple products
- Update availability

**Sample Request:**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "status": "ACTIVE",
    "tags": ["on-sale", "featured"]
  }
}
```

**Process:**
1. Validate product IDs
2. Apply updates to all specified products
3. Invalidate cache
4. Return updated count

---

### 7. Bulk Delete Products
**Endpoint:** `DELETE /api/v1/products/bulk`

**Function:** `productService.bulkDeleteProducts(productIds, force)`

**Access:** ADMIN only

**Process:**
1. Fetch all products
2. For each product:
   - Soft or hard delete
   - Delete images if hard delete
3. Invalidate cache
4. Return deleted count

**Sample Request:**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"],
  "force": false
}
```

---

## Image Management

### 8. Upload Product Images
**Endpoint:** `POST /api/v1/products/:id/images`

**Function:** `uploadService.uploadProductImages(productId, files)`

**Access:** ADMIN, MANAGER (with section access)

**Specifications:**
- **Max Files:** 10 per product
- **Max File Size:** 5 MB per file
- **Allowed Formats:** JPEG, PNG, WebP
- **Processing:** Sharp for optimization

**Image Sizes Generated:**
1. **Original:** 1200px max width/height, WebP format
2. **Medium:** 600px max width/height, WebP format
3. **Thumbnail:** 200px max width/height, WebP format

**Process:**
1. Validate file count (max 10 total images)
2. Validate file types and sizes
3. For each uploaded file:
   - Process with Sharp (resize, convert to WebP)
   - Generate 3 sizes
   - Upload to S3/MinIO (3 files per image)
   - Save URLs to database
4. Return image records

**Storage Structure:**
```
s3://bucket/products/{productId}/images/
  ├─ {imageId}_original.webp
  ├─ {imageId}_medium.webp
  └─ {imageId}_thumbnail.webp
```

**Sample Request:**
```
POST /api/v1/products/uuid/images
Content-Type: multipart/form-data

images: [File1, File2, File3]
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "uuid",
        "url": "https://s3.../original.webp",
        "mediumUrl": "https://s3.../medium.webp",
        "thumbnailUrl": "https://s3.../thumbnail.webp",
        "position": 1
      }
    ]
  }
}
```

---

### 9. Delete Product Image
**Endpoint:** `DELETE /api/v1/products/:id/images/:imageId`

**Function:** `uploadService.deleteProductImage(productId, imageId)`

**Access:** ADMIN, MANAGER (with section access)

**Process:**
1. Fetch image record
2. Delete all 3 sizes from S3/MinIO
3. Delete database record
4. Return success

**Sample Request:**
```
DELETE /api/v1/products/uuid/images/image-uuid
```

---

### 10. Reorder Product Images
**Endpoint:** `PUT /api/v1/products/:id/images/reorder`

**Function:** `uploadService.reorderProductImages(productId, imageOrder)`

**Access:** ADMIN, MANAGER (with section access)

**Purpose:** Change the display order of product images

**Sample Request:**
```json
{
  "imageOrder": [
    { "imageId": "uuid3", "position": 1 },
    { "imageId": "uuid1", "position": 2 },
    { "imageId": "uuid2", "position": 3 }
  ]
}
```

**Process:**
1. Validate all image IDs belong to product
2. Update position for each image
3. Return success

---

## Inventory Integration

### Automatic Inventory Management

**On Product Creation:**
- Inventory item automatically created
- Initial stock: 0
- Status: IN_STOCK
- SKU copied from product

**On Product Update:**
- Inventory SKU updated if product SKU changes

**On Product Delete:**
- Soft delete: Inventory preserved
- Hard delete: Inventory removed

**Availability Calculation:**
```typescript
function calculateAvailability(inventory, product) {
  if (inventory.available > 0) return 'IN_STOCK';
  if (inventory.available === 0) return 'OUT_OF_STOCK';
  if (inventory.available < inventory.reorderPoint) return 'LOW_STOCK';
  if (product.status === 'PREORDER') return 'PREORDER';
  if (product.status === 'ARCHIVED') return 'DISCONTINUED';
}
```

---

## Caching Strategy

### Redis Cache

**Cache Key Format:**
```
products:list:{hash of filters}
products:detail:{productId}
```

**TTL:** 5 minutes

**Cached Operations:**
- Product listings with filters
- Individual product details

**Cache Invalidation:**
- On product create: Invalidate all list caches
- On product update: Invalidate specific product + all list caches
- On product delete: Invalidate specific product + all list caches
- On image upload/delete: Invalidate specific product + all list caches

**Cache Miss Behavior:**
- Fetch from database
- Store in cache with TTL
- Return data

---

## Validation Rules

### Common Product Validation
- `name` - Required, 2-200 characters
- `price` - Required, must be > 0
- `compareAtPrice` - Optional, must be >= price
- `sku` - Optional, must be unique
- `section` - Required, one of: CAFE, FLOWERS, BOOKS
- `status` - Optional, one of: ACTIVE, DRAFT, ARCHIVED

### CAFE Product Validation
- `category` - Required, valid enum value
- `origin` - Optional, max 100 characters
- `roastLevel` - Optional, valid enum value
- `caffeineContent` - Optional, valid enum value
- `flavorNotes` - Optional, array of strings
- `allergens` - Optional, array of strings

### FLOWERS Product Validation
- `arrangementType` - Required, valid enum value
- `colors` - Required, array with at least 1 color
- `flowerTypes` - Required, array with at least 1 type
- `occasion` - Optional, valid enum value
- `stemCount` - Optional, must be > 0

### BOOKS Product Validation
- `title` - Required, 2-200 characters
- `author` - Required, 2-100 characters
- `isbn` - Optional, valid ISBN-10 or ISBN-13 format
- `publisher` - Optional, max 100 characters
- `pageCount` - Optional, must be > 0
- `genre` - Required, array with at least 1 genre
- `format` - Required, valid enum value

---

## Error Handling

### Common Errors

**400 Bad Request:**
- Invalid product data
- Missing required fields
- Invalid section-specific data

**404 Not Found:**
- Product ID not found
- Image ID not found

**409 Conflict:**
- Duplicate SKU
- Product already exists

**422 Validation Error:**
- Price <= 0
- Invalid enum values
- Missing section-specific data

**403 Forbidden:**
- Manager accessing different section
- Staff attempting create/update/delete

**413 Payload Too Large:**
- File size exceeds limit
- Too many files uploaded

---

## API Endpoints Summary

```
# Product CRUD
GET    /api/v1/products                     - List products (public)
POST   /api/v1/products                     - Create product (Admin/Manager)
GET    /api/v1/products/:id                 - Get product (public)
PUT    /api/v1/products/:id                 - Update product (Admin/Manager)
DELETE /api/v1/products/:id?force=false     - Delete product (Admin)

# Bulk Operations
PATCH  /api/v1/products/bulk                - Bulk update (Admin)
DELETE /api/v1/products/bulk                - Bulk delete (Admin)

# Image Management
POST   /api/v1/products/:id/images          - Upload images (Admin/Manager)
DELETE /api/v1/products/:id/images/:imageId - Delete image (Admin/Manager)
PUT    /api/v1/products/:id/images/reorder  - Reorder images (Admin/Manager)
```

---

## Database Schema

```prisma
model Product {
  id              String              @id @default(uuid())
  name            String
  description     String?
  price           Decimal             @db.Decimal(10, 2)
  compareAtPrice  Decimal?            @db.Decimal(10, 2)
  sku             String?             @unique
  section         Section
  status          ProductStatus       @default(ACTIVE)
  availability    ProductAvailability @default(IN_STOCK)
  tags            String[]
  collections     String[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  deletedAt       DateTime?

  cafeProduct     CafeProduct?
  flowersProduct  FlowersProduct?
  booksProduct    BooksProduct?
  images          ProductImage[]
  variants        ProductVariant[]
  inventoryItem   InventoryItem?
}

model CafeProduct {
  id             String         @id @default(uuid())
  productId      String         @unique
  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  category       CafeCategory
  origin         String?
  roastLevel     RoastLevel?
  caffeineContent CaffeineContent?
  flavorNotes    String[]
  allergens      String[]
  brewingMethod  String?
  servingSize    String?
}

model FlowersProduct {
  id              String           @id @default(uuid())
  productId       String           @unique
  product         Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  arrangementType ArrangementType
  colors          FlowerColor[]
  flowerTypes     String[]
  occasion        Occasion?
  careInstructions String?
  stemCount       Int?
  vaseIncluded    Boolean          @default(false)
}

model BooksProduct {
  id              String      @id @default(uuid())
  productId       String      @unique
  product         Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  title           String
  author          String
  isbn            String?
  publisher       String?
  publicationDate DateTime?
  pageCount       Int?
  language        String      @default("English")
  format          BookFormat
  genre           BookGenre[]
  summary         String?
}

model ProductImage {
  id           String   @id @default(uuid())
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url          String
  mediumUrl    String
  thumbnailUrl String
  position     Int      @default(1)
  createdAt    DateTime @default(now())

  @@index([productId])
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Indexing:**
   - Primary keys (UUID)
   - Foreign keys (productId)
   - SKU (unique index)
   - Section, status, availability (composite index)
   - Search fields (name, description)

2. **Caching:**
   - Redis for product listings (5 min TTL)
   - Individual product cache
   - Cache invalidation on updates

3. **Image Optimization:**
   - WebP format (smaller file size)
   - Multiple sizes (responsive images)
   - CDN-ready URLs

4. **Query Optimization:**
   - Include only necessary relations
   - Pagination for listings
   - Cursor-based pagination for large datasets

5. **Lazy Loading:**
   - Images loaded on-demand
   - Section-specific data loaded only when needed

---

## Testing Checklist

- [ ] Create product with all sections (CAFE, FLOWERS, BOOKS)
- [ ] Create product with missing required fields (should fail)
- [ ] Create product with duplicate SKU (should fail)
- [ ] Get product by ID (existing and non-existing)
- [ ] List products with various filters
- [ ] List products with pagination
- [ ] Update product (common and section-specific fields)
- [ ] Update product by manager in different section (should fail)
- [ ] Soft delete product
- [ ] Hard delete product
- [ ] Restore soft-deleted product
- [ ] Bulk update products
- [ ] Bulk delete products
- [ ] Upload product images (single and multiple)
- [ ] Upload images exceeding limit (should fail)
- [ ] Upload invalid file format (should fail)
- [ ] Delete product image
- [ ] Reorder product images
- [ ] Cache hit and miss scenarios
- [ ] Cache invalidation on updates
- [ ] Inventory auto-creation on product creation
- [ ] Availability calculation

---

## Future Enhancements

- [ ] Product reviews and ratings
- [ ] Product recommendations
- [ ] Advanced analytics (views, sales, conversions)
- [ ] Product variants management (size, color, etc.)
- [ ] SEO optimization (meta tags, slugs)
- [ ] Multi-language support
- [ ] Product duplication feature
- [ ] Import/export products (CSV, Excel)
- [ ] Product history tracking (audit log)
- [ ] Related products
- [ ] Product bundles
- [ ] Scheduled product publishing
- [ ] Product templates

---

## Related Modules
- [Authentication Module](./01-AUTHENTICATION_MODULE.md) - Protects product management endpoints
- [Inventory Module](./06-INVENTORY_MODULE.md) - Auto-created for each product
- [Order Module](./05-ORDER_MANAGEMENT_MODULE.md) - Uses products for order items
- [Upload Service](./07-UPLOAD_SERVICE.md) - Handles image uploads

---

## References
- [Class Table Inheritance Pattern](https://www.martinfowler.com/eaaCatalog/classTableInheritance.html)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [WebP Format Specification](https://developers.google.com/speed/webp)
- [E-commerce Data Modeling](https://www.prisma.io/dataguide/intro/database-glossary#ecommerce-data-model)
