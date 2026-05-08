# ERP Project Memory - COMPLETE STATE (Last Updated: 2026-05-07, Session 2)

## 🎉 Project Overview
- **Path:** `C:\Users\U.C\Desktop\Projects\ERP`
- **Repository:** `https://github.com/krishkrkashyap/ERP-MODEL-UPPER-CRUST.git`
- **Branch:** `main` | **Commits:** 5 (v0.1.0 → v0.5.0) | **Pushed ✅**
- **Stack:** PostgreSQL + Prisma ORM, Node.js/Express, React/TypeScript, recharts, Ant Design
- **Running:** Backend on `:4000` (live Petpooja API), Frontend on `:3000` (Vite dev proxy `/api`→`:4000`)

## ✅ COMPLETED PHASES

### Phase 1: Foundation ✅ (v0.1.0)
- PostgreSQL database with Prisma ORM
- All database schemas (Section 3 of plan.md)
- Node.js/Express backend with TypeScript
- Petpooja API client (14+ APIs)
- React frontend with Ant Design
- **Fixed:** API field mappings (CRITICAL FIXES)
- Orders & Inventory pages with outlet filtering
- View Details feature (tables parsing raw JSON payload)
- Multi-outlet support (UC - Vastrapur, UC - Another Outlet)
- ErrorBoundary component added

### Phase 2: Core Modules ✅ (v0.2.0 - v0.4.0)
- Raw Materials, Wastage Tracking, Customer Profiles

### Phase 3: Financial & Reports ✅ (v0.5.0)
- Tax Liability + P&L, 22 Report Types with smart per-report filters

### Phase 4: Dashboard & Charts ✅ (Current Session)
- **Dashboard:** 4 stat cards (Orders, Revenue, Customers, Inventory)
- **Dashboard Charts:** Sales Trend bar chart (daily/monthly/hourly), Order Summary sidebar, Category donut, Platform bar chart
- **Recent Orders** + **Low Stock Alerts** tables
- **Backend:** `/api/reports/platform-summary` endpoint added
- **Order sort fixed:** `createdAt`→`createdOn` for Petpooja order date sorting
- **Installed:** `recharts` charting library
- **All builds pass** (tsc + vite for frontend, tsc for backend)

## 📂 CURRENT STATE

### Git Status ✅
- All code PUSHED to GitHub, 5 commits
- **Working tree has uncommitted changes** (Dashboard charts + platform-summary + recharts + order sort fix)

### Pages & OutletSelector Status
| Page | OutletSelector | DatePicker | menuSharingCodes Backend |
|------|---------------|------------|--------------------------|
| Dashboard `/` | ❌ Planned | ❌ Planned | ❌ Not needed (uses /api/reports) |
| Orders `/orders` | ✅ Done | ✅ Done | ✅ `order.routes.ts` |
| Inventory `/inventory` | ✅ Done | ✅ Done | ✅ `inventory.routes.ts` |
| Raw Materials `/raw-materials` | ❌ Planned | ❌ N/A | ❌ `raw-material.routes.ts` |
| Wastage Tracking `/wastage` | ❌ Planned | ✅ Done | ❌ `wastage.routes.ts` |
| Customer Profiles `/customers` | ❌ Planned | ❌ N/A | ❌ `customer.routes.ts` |
| Financial `/financial` | ❌ Planned | ✅ RangePicker | ❌ `financial.routes.ts` |
| Reports `/reports` | ❌ Planned | ✅ RangePicker | ❌ `report.routes.ts` |

### Critical Notes
- `inventoryRes.data` is object `{date, count, data}` — all `.filter()`/`.length` calls use `.data?.data` sub-property
- Dashboard currently hardcodes `date=2026-05-05` for inventory — must become dynamic
- CustomerProfiles sync has hardcoded `restaurantId:2` and `menuSharingCode:'uvhn3bim'`
- OutletSelector hardcoded outlets: `[{menuSharingCode:'uvhn3bim', name:'UC - Vastrapur (340305)'}, {menuSharingCode:'t2jrg8ez', name:'UC - Another Outlet (340304)'}]`
- Order sort fixed from `createdAt`→`createdOn` to show latest Petpooja orders (not DB import time)

## 🚀 NEXT SESSION RESUME POINT

### Pre-requisites
```bash
# Terminal 1 - Backend
cd C:\Users\U.C\Desktop\Projects\ERP\backend && npm run dev

# Terminal 2 - Frontend
cd C:\Users\U.C\Desktop\Projects\ERP\frontend && npm run dev
```

### Immediate Next Steps (in order)
1. **Add `menuSharingCodes` to `report.routes.ts`** — query param support in main `:type` handler + all 4 filter endpoints (categories, items, payment-types, platforms). Convert codes→restaurantIds via Prisma lookup.
2. **Add `menuSharingCodes` to `raw-material.routes.ts` GET** — same pattern as order/inventory routes.
3. **Add `menuSharingCodes` to `wastage.routes.ts` GET** — same pattern.
4. **Add `menuSharingCodes` to `customer.routes.ts` GET** — same pattern.
5. **Add `menuSharingCodes` to `financial.routes.ts`** — both tax-liability and pnl endpoints.
6. **Update `Dashboard.tsx`** — add OutletSelector + DatePicker for inventory date, wire into all 7 query keys.
7. **Add OutletSelector to `RawMaterials.tsx`** — in action bar, wire into query.
8. **Add OutletSelector to `WastageTracking.tsx`** — in action bar, wire into query.
9. **Add OutletSelector to `CustomerProfiles.tsx`** — in action bar, wire into query.
10. **Add OutletSelector to `Financial.tsx`** — in filter bar, wire into queries.
11. **Add OutletSelector to `Reports.tsx`** — in smart filter bar, wire into reports fetch.
12. **Rebuild both projects** (`npm run build`), restart backend, test all pages.

### Build Verification
```bash
cd C:\Users\U.C\Desktop\Projects\ERP\backend && npm run build
cd C:\Users\U.C\Desktop\Projects\ERP\frontend && npm run build
```

### Files to Modify (complete list)
| File | Change |
|------|--------|
| `backend/src/routes/report.routes.ts` | Add `menuSharingCodes` to `:type` route + all filter endpoints |
| `backend/src/routes/raw-material.routes.ts` | Add `menuSharingCodes` to GET `/` |
| `backend/src/routes/wastage.routes.ts` | Add `menuSharingCodes` to GET `/` |
| `backend/src/routes/customer.routes.ts` | Add `menuSharingCodes` to GET `/` |
| `backend/src/routes/financial.routes.ts` | Add `menuSharingCodes` to tax-liability & pnl |
| `frontend/src/pages/Dashboard.tsx` | Add OutletSelector + DatePicker |
| `frontend/src/pages/RawMaterials.tsx` | Add OutletSelector |
| `frontend/src/pages/WastageTracking.tsx` | Add OutletSelector |
| `frontend/src/pages/CustomerProfiles.tsx` | Add OutletSelector |
| `frontend/src/pages/Financial.tsx` | Add OutletSelector |
| `frontend/src/pages/Reports.tsx` | Add OutletSelector |

## 🔑 KEY CONTEXT

### Database Schema (relevant)
- **Restaurant:** `{id, name, petpoojaRestId}` — id=1 "Default Restaurant", id=2 "UC - Vastrapur" (`uvhn3bim`), id=3 "UC - Another Outlet" (`t2jrg8ez`)
- **Order:** `{id, petpoojaOrderId, restaurantId, total, status, createdOn, orderFrom, paymentType, ...}`
- **OrderItem:** `{id, orderId, name, quantity, total, categoryName, sapCode, ...}`
- **StockLevel:** `{id, inventoryItemId, restaurantId, date, quantity, unit, price}` — unique on `(inventoryItemId, restaurantId, date)`
- **InventoryItem:** `{id, name, category, sapCode, unit, type ('R'=raw), restaurantId, ...}`

### Pattern for menuSharingCodes in where clause (from order.routes.ts)
```typescript
if (menuSharingCodes) {
    const codes = (menuSharingCodes as string).split(',');
    const restaurants = await prisma.restaurant.findMany({
        where: { petpoojaRestId: { in: codes } }
    });
    if (restaurants.length > 0) {
        where.restaurantId = { in: restaurants.map(r => r.id) };
    }
} else if (restaurantId) {
    where.restaurantId = parseInt(restaurantId as string);
}
```

### Dashboard Query Keys (7 total)
1. `['dashboard-stats']` — stats aggregation
2. `['recent-orders']` — `/api/orders?page=1&limit=10&sort=createdOn&order=desc`
3. `['low-stock']` — `/api/inventory/stock?date=${today}`
4. `['sales-trend', trendPeriod]` — hourly or daily/monthly
5. `['category-sales']` — `/api/reports/category-wise`
6. `['platform-sales']` — `/api/reports/platform-summary`

### Dashboard Charts
- Sales Trend → `BarChart` (BarChartOutlined), switch daily/monthly/hourly
- Order Summary sidebar → 4 mini-stat cards + platform breakdown list
- Category → `PieChart` donut (top 10)
- Platform → `BarChart` horizontal
- Recent Orders → `Table`
- Low Stock → `Table`

---
**Last Session:** 2026-05-07 Session 2 (afternoon)  
**Duration:** ~3 hours  
**Status:** Phase 4 started (Dashboard charts built ✅, outlet filtering across all pages: ⏳️ pending)  
**Git:** Uncommitted changes (Dashboard, recharts, order sort fix, platform-summary)  
**Next Step:** Backend `menuSharingCodes` support in 5 routes → Frontend OutletSelector on 6 pages → Rebuild → Test  
