# ERP Project Memory

## Project Overview
Building an ERP system using Petpooja Inventory APIs (14+ APIs) with PostgreSQL database and React frontend.

## What Works ✅

### Database
- **PostgreSQL 18** on localhost:5432, database: `erp`
- **Prisma ORM** with 11 tables created and migrated
- **Connection**: `postgresql://postgres:123@localhost:5432/erp?schema=public`
- **Tables**: restaurants, customers, orders, order_items, order_taxes, order_discounts, inventory_items, stock_levels, purchase_orders, purchase_invoices, internal_sales

### Backend Server
- **Running on**: `http://localhost:4000`
- **Health check**: `GET /health` returns 200 with `{"status": "healthy", "database": "connected"}`
- **TypeScript**: Compiles cleanly with `npx tsc`
- **Sample data**: Available in `C:\Users\U.C\Desktop\Projects\ERP\sample_*.json`

### Working Endpoints
- ✅ `GET /health` - Server health check
- ✅ `POST /api/inventory/stock/sync` - Syncs 1564 stock items from Petpooja
- ✅ `GET /api/inventory/stock?date=2026-05-05` - Returns stock from DB (1353 items)

## Critical Issues to Fix ❌

### 1. Order Sync Failing (HIGH PRIORITY)
**Error**: `Unique constraint failed on the fields: (petpooja_customer_id)`

**Root Cause**: The `petpoojaCustomerId` field has a unique constraint, but the API sometimes returns empty string for `customer_id`. When trying to upsert multiple customers with `petpoojaCustomerId: ''`, it violates the unique constraint.

**Fix Options**:
1. Remove unique constraint from `petpoojaCustomerId` in schema
2. Use `phone` field as unique identifier (already unique)
3. Skip upsert if `petpoojaCustomerId` is empty

**File to Fix**: `backend/src/routes/order.routes.ts` (around line 112)

### 2. Field Name Mismatches (LEARNED)
When working with Petpooja APIs, always verify field names from sample data:
- Stock API: `qty` (not `quantity`), `sapcode` (not `sapCode`)
- Consumption API: `delivery_charges` (underscore), `container_charges` (underscore)
- Order fields: `orderID` → `petpoojaOrderId`, `order_type` → `orderType`

## API Credentials (Verified Working ✅)
```
app_key: rpvg7joamn421d3u0x5qhk9ze8sibtcw
app_secret: c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e
access_token: 7334c01be3a9677868cbf1402880340e79e1ea84
menuSharingCode: uvhn3bim (ID: 340305), t2jrg8ez (ID: 340304)
```

## Date Format Rules (IMPORTANT ⚠️)
- **Stock/Consumption APIs**: `YYYY-MM-DD` (T-1 rule - API returns yesterday's data)
- **Purchase/Sales APIs**: `DD-MM-YYYY`
- Always verify date format in `syntax.md` before making API calls

## Sample Data Available
Use these for testing without live API calls:
- `sample_stock.json` - 1564 items (Stock API response)
- `sample_consumption.json` - 200 orders (Consumption API response)
- `sample_purchase.json` - Purchase data
- `sample_sales.json` - Sales data
- `sample_transfer.json` - Transfer data

## Next Session Tasks (From plan.md Phase 1)

### Immediate Fixes
1. Fix customer upsert issue in `order.routes.ts`
2. Test `POST /api/orders/sync` with date `2026-05-05`
3. Verify orders saved to database

### Phase 1 Continuation
4. Implement purchase sync: `POST /api/procurement/purchase/sync`
5. Implement sales sync: `POST /api/procurement/sales/sync`
6. Implement webhook endpoints for real-time updates
7. Create React frontend with Vite + TypeScript

## Useful Commands
```powershell
# Start PostgreSQL service
Start-Service -Name "postgresql-x64-18"

# Check PostgreSQL is running
Get-Service -Name "*postgres*" | Select-Object Name, Status

# Compile TypeScript
cmd /c "cd C:\Users\U.C\Desktop\Projects\ERP\backend && npx tsc"

# Start server (background)
Start-Job -ScriptBlock { Set-Location "C:\Users\U.C\Desktop\Projects\ERP\backend"; node dist/server.js" }

# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get

# Check database tables
$env:PGPASSWORD="123"; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d erp -c "\dt"

# Run test script
cmd /c "cd C:\Users\U.C\Desktop\Projects\ERP\backend && node test-server.js"
```

## File Structure
```
C:\Users\U.C\Desktop\Projects\ERP\
├── plan.md (37KB - 12-section development plan)
├── syntax.md (21KB - API syntax reference)
├── CREDENTIALS.md (10KB - API credentials)
├── SESSION_PROGRESS_2026-05-06.md (session summary)
├── sample_*.json (API response samples)
├── backend\
│   ├── .env (PostgreSQL connection)
│   ├── prisma\
│   │   ├── schema.prisma (database schema)
│   │   └── migrations\ (2 migrations applied)
│   ├── src\
│   │   ├── server.ts (Express server)
│   │   ├── api\petpooja-client.ts (14+ API methods)
│   │   └── routes\ (order, inventory, customer, etc.)
│   └── dist\ (compiled JavaScript)
└── frontend\ (TODO - create with React + Vite)
```

## Key Learnings
1. **Always use real API samples** to verify field names before coding
2. **PowerShell quirks**: No `&&` chaining, use `cmd /c` for npm/npx commands
3. **Decimal precision**: PostgreSQL `Decimal(10,3)` overflows with large numbers, use `Decimal(12,3)`
4. **Prisma unique constraints**: Be careful with unique fields that might be empty
5. **Background jobs in PowerShell**: Use `Start-Job` not `&` (not supported)
