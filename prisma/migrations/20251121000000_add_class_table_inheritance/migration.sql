-- Create new section-specific tables
CREATE TABLE "cafe_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "origin" TEXT,
    "roast_level" TEXT,
    "caffeine_content" TEXT,
    "size" TEXT,
    "temperature" TEXT,
    "allergens" TEXT[],
    "calories" INTEGER,

    CONSTRAINT "cafe_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flowers_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "arrangement_type" TEXT NOT NULL,
    "occasion" TEXT,
    "colors" TEXT[],
    "flower_types" TEXT[],
    "size" TEXT,
    "seasonality" TEXT,
    "care_instructions" TEXT,
    "vase_included" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "flowers_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "books_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "publisher" TEXT,
    "publish_date" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'English',
    "page_count" INTEGER,
    "format" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'New',
    "edition" TEXT,
    "dimensions" TEXT,
    "weight" INTEGER,

    CONSTRAINT "books_products_pkey" PRIMARY KEY ("id")
);

-- Migrate data from products table to section-specific tables
-- Cafe products
INSERT INTO "cafe_products" (
    "id",
    "product_id",
    "name",
    "description",
    "category",
    "origin",
    "roast_level",
    "caffeine_content",
    "size",
    "temperature",
    "allergens",
    "calories"
)
SELECT
    gen_random_uuid()::text,
    p.id,
    p.name,
    p.description,
    COALESCE((p.cafe_attributes->>'category')::text, 'Uncategorized'),
    (p.cafe_attributes->>'origin')::text,
    (p.cafe_attributes->>'roastLevel')::text,
    (p.cafe_attributes->>'caffeineContent')::text,
    (p.cafe_attributes->>'size')::text,
    (p.cafe_attributes->>'temperature')::text,
    CASE
        WHEN p.cafe_attributes->'allergens' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(p.cafe_attributes->'allergens'))
        ELSE ARRAY[]::text[]
    END,
    (p.cafe_attributes->>'calories')::integer
FROM products p
WHERE p.section = 'CAFE'
AND p.cafe_attributes IS NOT NULL;

-- Flowers products
INSERT INTO "flowers_products" (
    "id",
    "product_id",
    "name",
    "description",
    "arrangement_type",
    "occasion",
    "colors",
    "flower_types",
    "size",
    "seasonality",
    "care_instructions",
    "vase_included"
)
SELECT
    gen_random_uuid()::text,
    p.id,
    p.name,
    p.description,
    COALESCE((p.flowers_attributes->>'arrangementType')::text, 'Bouquet'),
    (p.flowers_attributes->>'occasion')::text,
    CASE
        WHEN p.flowers_attributes->'colors' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(p.flowers_attributes->'colors'))
        ELSE ARRAY[]::text[]
    END,
    CASE
        WHEN p.flowers_attributes->'flowerTypes' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(p.flowers_attributes->'flowerTypes'))
        ELSE ARRAY[]::text[]
    END,
    (p.flowers_attributes->>'size')::text,
    (p.flowers_attributes->>'seasonality')::text,
    (p.flowers_attributes->>'careInstructions')::text,
    COALESCE((p.flowers_attributes->>'vaseIncluded')::boolean, false)
FROM products p
WHERE p.section = 'FLOWERS'
AND p.flowers_attributes IS NOT NULL;

-- Books products
INSERT INTO "books_products" (
    "id",
    "product_id",
    "title",
    "description",
    "author",
    "isbn",
    "publisher",
    "publish_date",
    "language",
    "page_count",
    "format",
    "genre",
    "condition",
    "edition",
    "dimensions",
    "weight"
)
SELECT
    gen_random_uuid()::text,
    p.id,
    p.title,
    p.description,
    COALESCE((p.books_attributes->>'author')::text, 'Unknown Author'),
    (p.books_attributes->>'isbn')::text,
    (p.books_attributes->>'publisher')::text,
    (p.books_attributes->>'publishDate')::timestamp,
    COALESCE((p.books_attributes->>'language')::text, 'English'),
    (p.books_attributes->>'pageCount')::integer,
    COALESCE((p.books_attributes->>'format')::text, 'Paperback'),
    COALESCE((p.books_attributes->>'genre')::text, 'General'),
    COALESCE((p.books_attributes->>'condition')::text, 'New'),
    (p.books_attributes->>'edition')::text,
    (p.books_attributes->>'dimensions')::text,
    (p.books_attributes->>'weight')::integer
FROM products p
WHERE p.section = 'BOOKS'
AND p.books_attributes IS NOT NULL;

-- Create unique constraints
CREATE UNIQUE INDEX "cafe_products_product_id_key" ON "cafe_products"("product_id");
CREATE UNIQUE INDEX "flowers_products_product_id_key" ON "flowers_products"("product_id");
CREATE UNIQUE INDEX "books_products_product_id_key" ON "books_products"("product_id");
CREATE UNIQUE INDEX "books_products_isbn_key" ON "books_products"("isbn");

-- Create indexes
CREATE INDEX "cafe_products_product_id_idx" ON "cafe_products"("product_id");
CREATE INDEX "cafe_products_category_idx" ON "cafe_products"("category");
CREATE INDEX "flowers_products_product_id_idx" ON "flowers_products"("product_id");
CREATE INDEX "flowers_products_arrangement_type_idx" ON "flowers_products"("arrangement_type");
CREATE INDEX "books_products_product_id_idx" ON "books_products"("product_id");
CREATE INDEX "books_products_author_idx" ON "books_products"("author");
CREATE INDEX "books_products_isbn_idx" ON "books_products"("isbn");
CREATE INDEX "books_products_genre_idx" ON "books_products"("genre");

-- Add foreign key constraints
ALTER TABLE "cafe_products" ADD CONSTRAINT "cafe_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flowers_products" ADD CONSTRAINT "flowers_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "books_products" ADD CONSTRAINT "books_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old columns from products table
ALTER TABLE "products" DROP COLUMN "name";
ALTER TABLE "products" DROP COLUMN "title";
ALTER TABLE "products" DROP COLUMN "description";
ALTER TABLE "products" DROP COLUMN "cafe_attributes";
ALTER TABLE "products" DROP COLUMN "flowers_attributes";
ALTER TABLE "products" DROP COLUMN "books_attributes";
