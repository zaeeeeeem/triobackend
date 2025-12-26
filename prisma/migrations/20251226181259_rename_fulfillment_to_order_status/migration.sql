-- CreateEnum: Create new OrderStatus enum with expanded values for food delivery workflow
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- AlterTable: Add new order_status column
ALTER TABLE "orders" ADD COLUMN "order_status" "OrderStatus";

-- DataMigration: Migrate existing data from fulfillment_status to order_status
UPDATE "orders"
SET "order_status" = CASE
  WHEN "fulfillment_status" = 'UNFULFILLED' THEN 'PENDING'::"OrderStatus"
  WHEN "fulfillment_status" = 'SCHEDULED' THEN 'CONFIRMED'::"OrderStatus"
  WHEN "fulfillment_status" = 'PARTIAL' THEN 'PREPARING'::"OrderStatus"
  WHEN "fulfillment_status" = 'FULFILLED' THEN 'DELIVERED'::"OrderStatus"
  ELSE 'PENDING'::"OrderStatus"
END;

-- AlterTable: Make new column non-nullable and set default
ALTER TABLE "orders" ALTER COLUMN "order_status" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'PENDING';

-- CreateIndex: Create index on new column
CREATE INDEX "orders_order_status_idx" ON "orders"("order_status");

-- DropIndex: Drop old index
DROP INDEX IF EXISTS "orders_fulfillment_status_idx";

-- AlterTable: Drop old column
ALTER TABLE "orders" DROP COLUMN "fulfillment_status";

-- DropEnum: Drop old enum
DROP TYPE "FulfillmentStatus";
