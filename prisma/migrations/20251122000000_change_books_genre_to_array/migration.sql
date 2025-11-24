-- AlterTable: Change genre from String to String[] (TEXT to TEXT[])
-- This migration safely converts existing JSON string data to proper PostgreSQL arrays

-- Step 1: Create a temporary column to hold the array data
ALTER TABLE "books_products" ADD COLUMN "genre_new" TEXT[];

-- Step 2: Convert existing JSON string data to array
-- For values like '["Fiction", "Historical", "Drama"]', extract and convert to array
-- For simple string values like 'Fiction', convert to single-element array
UPDATE "books_products"
SET "genre_new" = CASE
  -- Check if genre starts with '[' (is JSON array)
  WHEN "genre" LIKE '[%' THEN
    -- Parse JSON array and convert to PostgreSQL array
    ARRAY(SELECT json_array_elements_text("genre"::json))
  ELSE
    -- Simple string, convert to single-element array
    ARRAY["genre"]
END;

-- Step 3: Drop the old genre column
ALTER TABLE "books_products" DROP COLUMN "genre";

-- Step 4: Rename the new column to genre
ALTER TABLE "books_products" RENAME COLUMN "genre_new" TO "genre";

-- Step 5: Make genre NOT NULL (since all books must have at least one genre)
ALTER TABLE "books_products" ALTER COLUMN "genre" SET NOT NULL;
