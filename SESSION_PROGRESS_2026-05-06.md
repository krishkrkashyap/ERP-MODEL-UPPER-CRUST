# ERP Development Session Progress - 2026-05-06

## Goal
Build a complete ERP system from scratch using Petpooja Inventory APIs (14+ APIs) with proper database schema based on actual API response structures.

## What We Accomplished Today

### 1. Database Setup (COMPLETED ✅)
- **PostgreSQL database created**: `erp` database on PostgreSQL 18
- **Prisma migrations**: Successfully ran 2 migrations:
  1. `init_erp_schema` - Initial schema with all tables
  2. `increase_decimal_precision` - Fixed numeric overflow by changing Decimal(10,3) to Decimal(12,3)
- **Schema file**: `backend/prisma/schema.prisma` - PostgreSQL-compatible with proper Decimal types
- **Tables created** (11 tables):
  - restaurants, customers, orders, order_items, order_taxes, order_discounts
  - inventory_items, stock_levels, purchase_orders, purchase_invoices, internal_sales

### 2. Backend Server (COMPLETED ✅)
- **Health endpoint working**: `GET /health` returns 200 with database connected status
- **TypeScript compilation**: Clean build with no errors
- **Server runs on**: `http://localhost:4000`
- **Dependencies installed**: express, cors, dotenv, axios, prisma, typescript, etc.

### 3. API Endpoints Tested (PARTIALLY WORKING ⚠️)
- ✅ `GET /health` - Working (200)
- ✅ `POST /api/inventory/stock/sync` - Working (synced 1564 items)
- ✅ `GET /api/inventory/stock?date=2026-05-05` - Working (returns 1353 items from DB)
- ❌ `POST /api/orders/sync` - Failing with unique constraint error on `petpooja_customer_id`

### 4. Sample Data Available
We have real API response samples saved:
- `sample_stock.json` - 1564 items (Stock API)
- `sample_consumption.json` - 200 orders (Consumption API)
- `sample_purchase.json` - Purchase data
- `sample_sales.json` - Sales data
- `sample_transfer.json` - Transfer data

### 5. API Client Implementation
- **File**: `backend/src/api/petpooja-client.ts`
- **Methods implemented**: 
  - `getStock(date)` - Stock API ✅
  - `getConsumption(orderDate, refId)` - Consumption API ✅
  - `getPurchases(date, refId)` - Purchase API ✅
  - `getSales(date, refId)` - Sales API ✅
  - `fetchAllPages()` - Pagination helper ✅

## Issues Found & Fix Needed

### Critical Issue: Order Sync Failing
**Problem**: `POST /api/orders/sync` fails with error:
```
Unique constraint failed on the fields: (`petpooja_customer_id`)
```

**Root Cause**: The `customer.upsert()` is trying to create customers with `petpoojaCustomerId: ''` (empty string) when the API doesn't return `customer_id`. The unique constraint on `petpooja_customer_id` is violated.

**Fix Needed**: 
- Make `petpoojaCustomerId` optional (remove unique constraint or handle empty strings)
- OR use a different unique identifier (phone number is already unique)
- OR don't try to upsert if `petpoojaCustomerId` is empty

### Data Type Issues Fixed
- ✅ Changed `Decimal(10,3)` to `Decimal(12,3)` in StockLevel to avoid numeric overflow
- ✅ Fixed `deliveryCharges` field name (API returns `delivery_charges` with underscore)
- ✅ Fixed `containerCharges` field name (API returns `container_charges`)

## Next Steps (From plan.md Phase 1)

### Immediate Fixes Needed (Before Continuing)
1. **Fix customer sync issue**:
   - Modify `order.routes.ts` to handle empty `petpoojaCustomerId`
   - Consider using phone as unique identifier (already have unique constraint on phone)
   - Test with live API data (Consumption API returns 200 orders)

2. **Complete Order Sync**:
   - Test with live API: `POST /api/orders/sync` with `{ "orderDate": "2026-05-05" }`
   - Verify orders are saved to database
   - Test `GET /api/orders` to retrieve synced orders

### Phase 1 Continuation (As per plan.md)
3. **Procurement Endpoints**:
   - Implement `POST /api/procurement/purchase/sync` using sample_purchase.json
   - Implement `POST /api/procurement/sales/sync` using sample_sales.json
   - Test purchase order and invoice creation

4. **Webhook Endpoints**:
   - Implement `POST /webhook/petpooja/purchase-order` for real-time updates
   - Test webhook reception

5. **Frontend Setup** (plan.md Section 5):
   - Create React + Vite project in `frontend/` directory
   - Install dependencies: antd, axios, react-query, zustand
   - Setup routing and basic layout

## Critical Context to Remember

### API Credentials (Working ✅)
- app_key: `rpvg7joamn421d3u0x5qhk9ze8sibtcw`
- app_secret: `c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e`
- access_token: `7334c01be3a9677868cbf1402880340e79e1ea84`
- menuSharingCode: `uvhn3bim` (ID: 340305), `t2jrg8ez` (ID: 340304)

### Database Connection (Working ✅)
- PostgreSQL 18 on localhost:5432
- Database: `erp`
- User: `postgres`, Password: `123`
- Connection string: `postgresql://postgres:123@localhost:5432/erp?schema=public`

### Field Name Gotchas (Learned the Hard Way)
- Stock API: `qty` not `quantity`, `sapcode` not `sapCode`
- Consumption API: `delivery_charges` (underscore), `container_charges` (underscore)
- Order fields: `orderID` (API) → `petpoojaOrderId` (DB), `order_type` → `orderType`
- Tax: `tax_total` (underscore in API), `total_tax` in InternalSale
- Customer: `phone` is unique, `customer_id` may be empty in API

### Date Format Rules (IMPORTANT ⚠️)
- Stock/Consumption APIs: `YYYY-MM-DD` (T-1 rule - API returns yesterday's data)
- Purchase/Sales APIs: `DD-MM-YYYY`
- Always verify date format before making API calls

## Files Modified Today
1. `backend/.env` - Updated to PostgreSQL with password 123
2. `backend/prisma/schema.prisma` - Fixed Decimal precision, matched API field names
3. `backend/src/routes/inventory.routes.ts` - Rewritten to handle API data correctly
4. `backend/src/routes/order.routes.ts` - Rewritten (had corruption issue)
5. `backend/src/routes/customer.routes.ts` - Created new file
6. `backend/src/server.ts` - Verified working
7. `backend/test-server.js` - Created for endpoint testing

## Session End Note
- Server tested successfully on port 4000
- Database has 1353 inventory items and 1353 stock levels (from 2026-05-05 sync)
- Order sync needs fix before proceeding
- All sample API data available in `C:\Users\U.C\Desktop\Projects\ERP\sample_*.json`
