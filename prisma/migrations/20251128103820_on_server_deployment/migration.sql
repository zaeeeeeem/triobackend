/*
  Warnings:

  - Made the column `status` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `average_order_value` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email_preferences` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "average_order_value" SET NOT NULL,
ALTER COLUMN "email_preferences" SET NOT NULL;

-- CreateIndex
CREATE INDEX "books_products_genre_idx" ON "books_products"("genre");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
