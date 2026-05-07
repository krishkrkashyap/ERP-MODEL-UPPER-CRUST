-- CreateTable
CREATE TABLE "restaurants" (
    "id" SERIAL NOT NULL,
    "petpooja_rest_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "state" TEXT,
    "contact_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "petpooja_customer_id" TEXT,
    "restaurant_id" INTEGER NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "created_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "petpooja_order_id" TEXT NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "order_type" TEXT,
    "payment_type" TEXT,
    "order_from" TEXT,
    "order_from_id" TEXT,
    "sub_order_type" TEXT,
    "table_no" TEXT,
    "no_of_persons" INTEGER,
    "address" TEXT,
    "delivery_charges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "container_charges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "core_total" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" TEXT,
    "biller" TEXT,
    "assignee" TEXT,
    "created_on" TIMESTAMP(3),
    "order_date" TIMESTAMP(3),
    "advance_order" BOOLEAN,
    "is_food_res" TEXT,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "service_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "group_ids" TEXT,
    "group_names" TEXT,
    "online_order_id" TEXT,
    "raw_payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "petpooja_item_id" TEXT,
    "name" TEXT,
    "item_code" TEXT,
    "category_id" TEXT,
    "category_name" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "addon" TEXT,
    "addon_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "consumed" TEXT,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sap_code" TEXT,
    "item_tax_info" TEXT,
    "total_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_ids" TEXT,
    "tax_inclusive" INTEGER,
    "discount_id" TEXT,
    "item_discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_taxes" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "taxid" TEXT,

    CONSTRAINT "order_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discounts" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "discountid" TEXT,

    CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" SERIAL NOT NULL,
    "petpooja_item_id" TEXT,
    "restaurant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "sap_code" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" SERIAL NOT NULL,
    "inventory_item_id" INTEGER NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "petpooja_po_id" TEXT,
    "restaurant_id" INTEGER NOT NULL,
    "receiver_type" TEXT,
    "receiver_name" TEXT,
    "delivery_date" TIMESTAMP(3),
    "po_number" TEXT,
    "total_tax" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "round_off" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT,
    "charge_details" TEXT,
    "from_department_id" INTEGER,
    "to_department_id" INTEGER,
    "raw_payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" SERIAL NOT NULL,
    "petpooja_purchase_id" TEXT,
    "restaurant_id" INTEGER NOT NULL,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "receiver_name" TEXT,
    "receiver_type" TEXT,
    "sub_total" DECIMAL(10,2) NOT NULL,
    "total_tax" DECIMAL(10,2) NOT NULL,
    "total_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_status" TEXT,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mrn_no" TEXT,
    "gst_no" TEXT,
    "action_status" TEXT,
    "receiver_gst" TEXT,
    "sender_details" TEXT,
    "receiver_details" TEXT,
    "raw_payload" TEXT,
    "created_on" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_sales" (
    "id" SERIAL NOT NULL,
    "petpooja_sale_id" TEXT,
    "restaurant_id" INTEGER NOT NULL,
    "type" TEXT,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "mrn_no" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "total_tax" DECIMAL(10,2) NOT NULL,
    "delivery_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "round_off_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT,
    "action_status" TEXT,
    "payment" TEXT,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sender_id" TEXT,
    "sender_type" TEXT,
    "address" TEXT,
    "restaurant_details" TEXT,
    "ratecard" TEXT,
    "module_type" TEXT,
    "freeze_stock" BOOLEAN,
    "unique_form_id" TEXT,
    "item_details" TEXT,
    "account_details" TEXT,
    "paid_amount_details" TEXT,
    "tcs" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "raw_payload" TEXT,
    "created_on" TIMESTAMP(3),
    "modified_on" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_petpooja_rest_id_key" ON "restaurants"("petpooja_rest_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_petpooja_customer_id_key" ON "customers"("petpooja_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_restaurant_id_idx" ON "customers"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_restaurant_id_phone_key" ON "customers"("restaurant_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "orders_petpooja_order_id_key" ON "orders"("petpooja_order_id");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_created_on_idx" ON "orders"("restaurant_id", "created_on");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_taxes_order_id_idx" ON "order_taxes"("order_id");

-- CreateIndex
CREATE INDEX "order_discounts_order_id_idx" ON "order_discounts"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_petpooja_item_id_key" ON "inventory_items"("petpooja_item_id");

-- CreateIndex
CREATE INDEX "inventory_items_restaurant_id_idx" ON "inventory_items"("restaurant_id");

-- CreateIndex
CREATE INDEX "inventory_items_sap_code_idx" ON "inventory_items"("sap_code");

-- CreateIndex
CREATE INDEX "stock_levels_date_idx" ON "stock_levels"("date");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_inventory_item_id_restaurant_id_date_key" ON "stock_levels"("inventory_item_id", "restaurant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_petpooja_po_id_key" ON "purchase_orders"("petpooja_po_id");

-- CreateIndex
CREATE INDEX "purchase_orders_restaurant_id_created_at_idx" ON "purchase_orders"("restaurant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_petpooja_purchase_id_key" ON "purchase_invoices"("petpooja_purchase_id");

-- CreateIndex
CREATE INDEX "purchase_invoices_restaurant_id_invoice_date_idx" ON "purchase_invoices"("restaurant_id", "invoice_date");

-- CreateIndex
CREATE UNIQUE INDEX "internal_sales_petpooja_sale_id_key" ON "internal_sales"("petpooja_sale_id");

-- CreateIndex
CREATE INDEX "internal_sales_type_invoice_date_idx" ON "internal_sales"("type", "invoice_date");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_taxes" ADD CONSTRAINT "order_taxes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_sales" ADD CONSTRAINT "internal_sales_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
