-- AlterTable: Customer - Add authentication and profile fields
-- Step 1: Add new columns with defaults where needed
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_verification_expiry" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password_reset_expiry" TIMESTAMP(3);

-- Step 2: Add name column by combining first_name and last_name for existing records
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" TEXT;
UPDATE "customers" SET "name" = CONCAT("first_name", ' ', "last_name") WHERE "name" IS NULL;
ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL;

-- Step 3: Add location and preference fields
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Asia/Karachi';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en';

-- Step 4: Replace is_active with status enum
-- First create the enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column with default mapping from is_active
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "status" "CustomerStatus" DEFAULT 'ACTIVE';
UPDATE "customers" SET "status" = CASE
  WHEN "is_active" = true THEN 'ACTIVE'::"CustomerStatus"
  ELSE 'INACTIVE'::"CustomerStatus"
END WHERE "status" IS NULL OR "status"::text = 'ACTIVE';

-- Drop is_active after data migration
ALTER TABLE "customers" DROP COLUMN IF EXISTS "is_active";

-- Step 5: Rename total_orders column (was named "orders")
ALTER TABLE "customers" RENAME COLUMN "total_orders" TO "total_orders_old";
ALTER TABLE "customers" ADD COLUMN "total_orders" INTEGER NOT NULL DEFAULT 0;
UPDATE "customers" SET "total_orders" = COALESCE("total_orders_old", 0);
ALTER TABLE "customers" DROP COLUMN "total_orders_old";

-- Step 6: Add average_order_value and other metrics
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "average_order_value" DECIMAL(10,2) DEFAULT 0;

-- Step 7: Create CustomerType enum
DO $$ BEGIN
  CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'WHOLESALE', 'CORPORATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "customer_type" "CustomerType";

-- Step 8: Add preference columns
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "marketing_consent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_consent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_preferences" JSONB DEFAULT '{"newsletter": true, "orderUpdates": true, "promotions": false}';

-- Step 9: Add account origin fields
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "created_from_guest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "registration_source" TEXT;

-- Step 10: Add metadata fields
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_order_date" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Step 11: Create indexes
CREATE INDEX IF NOT EXISTS "customers_status_idx" ON "customers"("status");
CREATE INDEX IF NOT EXISTS "customers_created_at_idx" ON "customers"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "customers_deleted_at_idx" ON "customers"("deleted_at");

-- CreateTable: CustomerAddress
CREATE TABLE IF NOT EXISTS "customer_addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company" TEXT,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_default_billing" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomerRefreshToken
CREATE TABLE IF NOT EXISTS "customer_refresh_tokens" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CustomerAddress
CREATE INDEX IF NOT EXISTS "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");
CREATE INDEX IF NOT EXISTS "customer_addresses_customer_id_is_default_idx" ON "customer_addresses"("customer_id", "is_default");

-- CreateIndex: CustomerRefreshToken
CREATE UNIQUE INDEX IF NOT EXISTS "customer_refresh_tokens_token_key" ON "customer_refresh_tokens"("token");
CREATE INDEX IF NOT EXISTS "customer_refresh_tokens_customer_id_idx" ON "customer_refresh_tokens"("customer_id");
CREATE INDEX IF NOT EXISTS "customer_refresh_tokens_token_idx" ON "customer_refresh_tokens"("token");

-- AddForeignKey: CustomerAddress
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CustomerRefreshToken
ALTER TABLE "customer_refresh_tokens" ADD CONSTRAINT "customer_refresh_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Order - Add guest order support
-- Step 1: Make customerId nullable and add guest fields
ALTER TABLE "orders" ALTER COLUMN "customer_id" DROP NOT NULL;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_email" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_name" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_order" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_token" TEXT;

-- Step 2: Populate customer_email and customer_name from existing customer data
UPDATE "orders" o
SET
  "customer_email" = c."email",
  "customer_name" = c."name"
FROM "customers" c
WHERE o."customer_id" = c."id"
  AND o."customer_email" IS NULL;

-- Step 3: Make customer_email and customer_name NOT NULL after population
ALTER TABLE "orders" ALTER COLUMN "customer_email" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "customer_name" SET NOT NULL;

-- Step 4: Create indexes for guest order lookups
CREATE INDEX IF NOT EXISTS "orders_customer_email_idx" ON "orders"("customer_email");
CREATE INDEX IF NOT EXISTS "orders_guest_token_idx" ON "orders"("guest_token");
