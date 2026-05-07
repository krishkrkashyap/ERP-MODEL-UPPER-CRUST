# ERP Project Memory

## Project Overview
- **Path:** `C:\Users\U.C\Desktop\Projects\ERP`
- **Repository:** `https://github.com/krishkrkashyap/ERP-MODEL-UPPER-CRUST.git`
- **Branch:** `main`
- **Stack:** PostgreSQL + Prisma ORM, Node.js/Express, React/TypeScript, Tailwind CSS

## Completed Phases

### Phase 1: Foundation ✅ (Commits v0.1.0)
- PostgreSQL database with Prisma ORM
- All database schemas (Section 3 of plan.md)
- Node.js/Express backend with TypeScript
- Petpooja API client (14+ APIs)
- React frontend with Tailwind CSS
- Fixed API field mappings (name, quantity, itemsapcode)
- Orders & Inventory pages with outlet filtering
- View Details feature for orders and inventory
- Multi-outlet support (UC - Vastrapur, UC - Bodakdev)
- Error handling and ErrorBoundary

### Phase 2: Core Modules ✅ (Commits v0.2.0 - v0.4.0)
- **Inventory Module:**
  - Stock levels viewing with date filter
  - Raw Material API (push new materials) - v0.2.0
  - Wastage Tracking (Internal Sales API) - v0.3.0
- **Procurement Module:**
  - Purchase Order webhook receiver (webhook.routes.ts)
  - Purchase API (push invoices) - procurement.routes.ts
- **Sales & CRM Module:**
  - Orders page with sync, pagination, View Details
  - Customer Profiles with order history - v0.4.0

### Phase 3: Financial & Reports 🔄 (Commit v0.5.0 - pending)
- **Financial Module:**
  - Tax liability calculator (Financial.tsx + financial.routes.ts)
  - P&L statement endpoint
  - Summary cards (Total Tax, CGST+SGST, IGST)
- **Reports Module:** (in progress)
  - Reports page with Sales/Inventory/Financial reports
  - Table views with date filtering

## API Field Mappings (Verified ✅)

### Order Items (API → Database)
| API Field | Database Field | Status |
|------------|----------------|--------|
| `name` | `name` | ✅ Fixed |
| `quantity` | `quantity` | ✅ Fixed |
| `itemsapcode` | `sapCode` | ✅ Fixed |
| `itemcode` | `itemCode` | ✅ Working |
| `categoryname` | `categoryName` | ✅ Working |

### Taxes (API → Database)
| API Field | Database Field | Status |
|------------|----------------|--------|
| `title` | `title` | ✅ Fixed |
| `rate` | `rate` | ✅ Fixed |
| `amount` | `amount` | ✅ Working |

## Git Commits Summary
| Version | Description | Date |
|---------|-------------|------|
| v0.1.0 | Phase 1 complete (Orders & Inventory) | 2026-05-07 |
| v0.2.0 | Raw Material API integration | 2026-05-07 |
| v0.3.0 | Wastage Tracking (Internal Sales API) | 2026-05-07 |
| v0.4.0 | Customer Profiles with order history | 2026-05-07 |
| v0.5.0 | Financial Module + Reports page | 2026-05-07 (pending commit) |

## How to Run

### Backend
```bash
cd C:\Users\U.C\Desktop\Projects\ERP\backend
npm run dev
# Runs on http://localhost:4000
```

### Frontend
```bash
cd C:\Users\U.C\Desktop\Projects\ERP\frontend
npm run dev
# Runs on http://localhost:3000
```

### Database
```bash
cd C:\Users\U.C\Desktop\Projects\ERP\backend
npx prisma studio
# Opens Prisma Studio for DB viewing
```

## Petpooja API Credentials
- **App Key:** `rpvg7joamn421d3u0x5qhk9ze8sibtcw`
- **App Secret:** `c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e`
- **Access Token:** `7334c01be3a9677868cbf1402880340e79e1ea84`
- **Outlets:**
  - `uvhn3bim` → UC - Vastrapur (ID: 340305)
  - `t2jrg8ez` → UC - Bodakdev (ID: 340304)

## Pages Created
| Page | Path | Status |
|------|------|--------|
| Dashboard | `/` | ✅ Done |
| Orders | `/orders` | ✅ Done |
| Inventory | `/inventory` | ✅ Done |
| Raw Materials | `/raw-materials` | ✅ Done |
| Wastage Tracking | `/wastage` | ✅ Done |
| Customer Profiles | `/customers` | ✅ Done |
| Financial | `/financial` | ✅ Done |
| Reports | `/reports` | 🔄 In Progress |

## Next Steps (After Break)
1. ✅ Complete Reports Module (Sales/Inventory/Financial reports)
2. ⏳️ Phase 4: Dashboard Module - KPI cards and real-time data
3. Testing & Debugging
4. Deployment prep

## Important Notes
- Backend runs on port 4000, Frontend on 3000
- All API field mappings have been VERIFIED and FIXED
- Prisma migrations are up to date (5 migrations total)
- Raw Materials use type="R" in InventoryItem model
- Wastage uses Internal Sales API with type="Wastage"
- Customer Profiles show order history from raw payload
- Financial module calculates tax liability from OrderTax table

---
**Last Updated:** 2026-05-07  
**Next Session:** Complete Reports Module, then move to Phase 4 (Dashboard)
