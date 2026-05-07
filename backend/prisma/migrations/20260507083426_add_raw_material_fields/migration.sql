-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "consumption_unit" TEXT,
ADD COLUMN     "conversion_qty" DECIMAL(10,3),
ADD COLUMN     "gst_percentage" DECIMAL(5,2),
ADD COLUMN     "hsn_code" TEXT,
ADD COLUMN     "is_expiry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT;
