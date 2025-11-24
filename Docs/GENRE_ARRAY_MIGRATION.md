# Genre Field Migration: String to Array

## Overview

Migrated the `genre` field in the `BooksProduct` model from `String` to `String[]` to properly support books with multiple genres.

## Problem

The `genre` field was defined as a `String` in the schema, but data was being stored as JSON string arrays (e.g., `'["Self-Help", "Psychology", "Business"]'`). This caused filtering issues:

- ❌ Query `?genre=Business` returned 0 results
- ✅ Query `?genre=["Self-Help", "Psychology", "Business"]` worked (exact string match)

The query was trying to match the literal string `"Business"`, but the database contained `'["Self-Help", "Psychology", "Business"]'` as a string.

## Solution

Changed the `genre` field to a proper PostgreSQL array type (`String[]`), allowing books to have multiple genres and enabling proper filtering with array operations.

---

## Changes Made

### 1. Schema Update

**File:** `prisma/schema.prisma`

```diff
model BooksProduct {
  // ... other fields ...
- genre       String    // Fiction, Non-Fiction, Biography, etc.
+ genre       String[]  // Fiction, Non-Fiction, Biography, etc. (can have multiple genres)
  // ... other fields ...
}
```

### 2. Type Definition Update

**File:** `src/types/product.types.ts`

```diff
export interface BooksProductAttributes {
  // ... other fields ...
- genre: string; // Fiction, Non-Fiction, Biography, etc.
+ genre: string[]; // Fiction, Non-Fiction, Biography, etc. (can have multiple genres)
  // ... other fields ...
}
```

### 3. Query Logic Update

**File:** `src/services/product.service.ts`

```diff
if (params.section === Section.BOOKS) {
  const booksWhere: Record<string, unknown> = {};
  if (params.author) {
    booksWhere.author = { contains: params.author, mode: 'insensitive' };
  }
  if (params.genre) {
-   booksWhere.genre = params.genre;
+   // Check if genre array contains the specified genre
+   booksWhere.genre = { has: params.genre };
  }
  if (params.format) {
    booksWhere.format = params.format;
  }
  if (Object.keys(booksWhere).length > 0) {
    (where as Record<string, unknown>).booksProduct = booksWhere;
  }
}
```

### 4. Database Migration

**File:** `prisma/migrations/20251122000000_change_books_genre_to_array/migration.sql`

The migration safely converts existing data:
- JSON string arrays like `'["Fiction", "Historical", "Drama"]'` → PostgreSQL array `{'Fiction', 'Historical', 'Drama'}`
- Simple strings like `'Fiction'` → Single-element array `{'Fiction'}`

```sql
-- Create temporary column
ALTER TABLE "books_products" ADD COLUMN "genre_new" TEXT[];

-- Convert existing data
UPDATE "books_products"
SET "genre_new" = CASE
  WHEN "genre" LIKE '[%' THEN
    ARRAY(SELECT json_array_elements_text("genre"::json))
  ELSE
    ARRAY["genre"]
END;

-- Replace old column
ALTER TABLE "books_products" DROP COLUMN "genre";
ALTER TABLE "books_products" RENAME COLUMN "genre_new" TO "genre";
ALTER TABLE "books_products" ALTER COLUMN "genre" SET NOT NULL;
```

---

## Query Examples

### Before Migration

```http
# This returned 0 results
GET /api/v1/products?section=BOOKS&genre=Business

# This worked (exact match of JSON string)
GET /api/v1/products?section=BOOKS&genre=["Self-Help", "Psychology", "Business"]
```

### After Migration

```http
# Now works correctly - finds books with "Business" in genre array
GET /api/v1/products?section=BOOKS&genre=Business

# Also works - finds books with "Fiction" in genre array
GET /api/v1/products?section=BOOKS&genre=Fiction
```

---

## Data Verification

### Before Migration

```javascript
{
  title: "Atomic Habits",
  genre: '["Self-Help", "Psychology", "Business"]', // String
  genreType: 'string',
  isArray: false
}
```

### After Migration

```javascript
{
  title: "Atomic Habits",
  genre: ['Self-Help', 'Psychology', 'Business'], // Array
  genreType: 'object',
  isArray: true
}
```

---

## Testing

### Test Query 1: Single Genre Match

```http
GET /api/v1/products?section=BOOKS&genre=Business&sortBy=createdAt&sortOrder=desc
```

**Expected Result:** Returns "Atomic Habits" (has genre array containing "Business")

### Test Query 2: Different Genre Match

```http
GET /api/v1/products?section=BOOKS&genre=Fiction&sortBy=createdAt&sortOrder=desc
```

**Expected Result:** Returns "The Kite Runner" (has genre array containing "Fiction")

### Database Query

```sql
-- Check that genre is now a proper array
SELECT title, genre, pg_typeof(genre)
FROM books_products;

-- Find books with specific genre
SELECT p.sku, b.title, b.genre
FROM products p
JOIN books_products b ON b.product_id = p.id
WHERE 'Business' = ANY(b.genre)
  AND p.deleted_at IS NULL;
```

---

## Impact

### Benefits

1. ✅ **Proper Data Model**: Books can have multiple genres
2. ✅ **Better Filtering**: Users can filter by individual genres
3. ✅ **PostgreSQL Arrays**: Leverage native array operations (`@>`, `&&`, `has`)
4. ✅ **No Data Loss**: Migration preserves all existing data

### Breaking Changes

⚠️ **API Request Changes:**
- **Before**: Creating a book required `genre: string`
- **After**: Creating a book requires `genre: string[]` (array)

**Example:**

```diff
POST /api/v1/products
{
  "section": "BOOKS",
  "booksAttributes": {
    "title": "Atomic Habits",
-   "genre": "Self-Help",
+   "genre": ["Self-Help", "Psychology", "Business"],
    // ... other fields
  }
}
```

### Frontend Changes Needed

If you have a frontend, update the book creation/edit forms:
- Change genre input from single select → multi-select
- Change genre input from text field → tag input
- Update TypeScript types to expect `genre: string[]`

---

## Rollback

If needed, you can rollback this migration:

```sql
-- Create temporary column
ALTER TABLE "books_products" ADD COLUMN "genre_old" TEXT;

-- Convert array back to JSON string (for arrays with multiple items)
-- or simple string (for single-item arrays)
UPDATE "books_products"
SET "genre_old" = CASE
  WHEN array_length("genre", 1) = 1 THEN
    "genre"[1]
  ELSE
    array_to_json("genre")::text
END;

-- Replace column
ALTER TABLE "books_products" DROP COLUMN "genre";
ALTER TABLE "books_products" RENAME COLUMN "genre_old" TO "genre";
ALTER TABLE "books_products" ALTER COLUMN "genre" SET NOT NULL;
```

---

## Summary

**Problem:** Genre filtering didn't work because data was stored as JSON strings

**Solution:** Changed `genre` field from `String` to `String[]` with safe data migration

**Result:** Genre filtering now works correctly with `?genre=Business`

✅ **Migration completed successfully - all existing data preserved**
