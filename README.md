# ERP-MODEL-UPPER-CRUST

Enterprise Resource Planning System with Petpooja Inventory API Integration

## Phase 1 Complete ✅
- PostgreSQL database with Prisma ORM
- All database schemas implemented
- Node.js/Express backend with TypeScript
- Petpooja API client (14+ APIs)
- React frontend with Tailwind CSS
- Order & Inventory pages with outlet filtering
- View Details feature for orders and inventory
- Fixed API field mapping (name, quantity, itemsapcode)

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Ant Design
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **APIs:** Petpooja Inventory APIs (14+ endpoints)

## Current Status
- ✅ Orders page with sync, pagination, View Details
- ✅ Inventory page with stock levels, sync, View Details  
- ✅ Multi-outlet support (UC - Vastrapur, UC - Bodakdev)
- ✅ Error handling and ErrorBoundary
- ✅ Fixed backend field mappings (API → Database)

## Next Steps (Phase 2)
- [ ] Raw Material API integration
- [ ] Purchase Order webhook receiver
- [ ] Customer profiles with order history
- [ ] Wastage tracking (Internal Sales API)

## Project Structure
```
C:\Users\U.C\Desktop\Projects\ERP\
├── backend/          # Node.js + Express + Prisma
├── frontend/         # React + TypeScript + Tailwind
├── plan.md          # Complete development plan
├── syntax.md        # Petpooja API reference
└── sample_*.json     # API response samples
```

## Setup
```bash
# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Frontend  
cd frontend && npm install && npm run dev
```

## API Credentials (Petpooja)
- App Key: `rpvg7joamn421d3u0x5qhk9ze8sibtcw`
- Access Token: `7334c01be3a9677868cbf1402880340e79e1ea84`
- Outlets: `uvhn3bim` (UC - Vastrapur), `t2jrg8ez` (UC - Bodakdev)

---
**Last Updated:** May 7, 2026  
**Version:** 0.1.0 (Phase 1 Complete)
