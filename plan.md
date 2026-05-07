# ERP Development Plan - Petpooja Inventory API Integration

**Project Path:** `C:\Users\U.C\Desktop\Projects\ERP`  
**API Package:** Petpooja Inventory APIs (14+ APIs)  
**Last Updated:** May 6, 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Database Design](#3-database-design)
4. [API Integration Strategy](#4-api-integration-strategy)
5. [ERP Module Breakdown](#5-erp-module-breakdown)
6. [Development Phases](#6-development-phases)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [Security & Authentication](#8-security--authentication)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Plan](#10-deployment-plan)
11. [Risk Assessment](#11-risk-assessment)
12. [Timeline & Milestones](#12-timeline--milestones)

---

## 1. Project Overview

### 1.1 Objective
Build a complete ERP system from scratch integrating Petpooja's Inventory APIs to manage:
- **Inventory Management** (stock, raw materials, wastage)
- **Procurement** (purchase orders, invoices, returns)
- **Sales & CRM** (orders, customers, consumption tracking)
- **Financial Operations** (taxes, discounts, payments)

### 1.2 Key Stakeholders
| Role | Responsibility |
|------|-----------------|
| Admin | Full system access, user management |
| Manager | Inventory oversight, procurement approval |
| Staff | POS operations, stock updates |
| Accountant | Financial reports, tax management |
| Viewer | Read-only access to reports |

### 1.3 Success Metrics
- ✅ 100% Petpooja Inventory API coverage (14+ APIs)
- ✅ Real-time bidirectional sync with Petpooja POS
- ✅ Sub-second response times for critical operations
- ✅ 99.9% uptime SLA
- ✅ Complete audit trail for all transactions

---

## 2. Architecture & Tech Stack

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  React   │  │  React   │  │  Mobile  │              │
│  │  Web App │  │  Admin   │  │  App     │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼──────────────┼──────────────┼────────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │      API Gateway Layer       │
        │  (Authentication, Rate      │
        │   Limiting, Request Loging) │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │      Backend Services        │
        │  ┌──────────────────────┐   │
        │  │  Node.js / Express  │   │
        │  └──────────┬───────────┘   │
        │             │               │
        │  ┌──────────▼───────────┐  │
        │  │  Petpooja API Client │  │
        │  └──────────┬───────────┘  │
        └──────────────┼──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │      Database Layer          │
        │  ┌──────────────────────┐   │
        │  │  PostgreSQL (Main)   │   │
        │  └──────────┬───────────┘   │
        │             │               │
        │  ┌──────────▼───────────┐  │
        │  │  Redis (Cache)       │  │
        │  └──────────────────────┘   │
        └─────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   External Integrations     │
        │  ┌──────────────────────┐   │
        │  │  Petpooja APIs      │   │
        │  │  (14+ API Endpoints)│   │
        │  └──────────────────────┘   │
        └─────────────────────────────┘
```

### 2.2 Technology Stack
| Layer | Technology | Version | Purpose |
|-------|-------------|---------|---------|
| **Frontend** | React.js | 18.x | Web application UI |
| | React Admin | 4.x | Admin dashboard framework |
| | Tailwind CSS | 3.x | Styling system |
| | React Query | 5.x | API state management |
| **Backend** | Node.js | 24.x | Runtime environment |
| | Express.js | 4.x | Web framework |
| | TypeScript | 5.x | Type safety |
| **Database** | PostgreSQL | 16.x | Primary relational database |
| | Redis | 7.x | Caching & sessions |
| **Integration** | Axios | 1.x | HTTP client for APIs |
| | Bull Queue | 4.x | Background job processing |
| **DevOps** | Docker | 24.x | Containerization |
| | GitHub Actions | - | CI/CD pipeline |
| | Nginx | 1.25 | Reverse proxy |

### 2.3 Project Structure
```
C:\Users\U.C\Desktop\Projects\ERP\
├── backend/
│   ├── src/
│   │   ├── api/              # Petpooja API clients
│   │   │   ├── inventory/   # Inventory APIs (Push)
│   │   │   ├── procurement/ # Purchase APIs
│   │   │   └── sales/      # Sales & Consumption APIs
│   │   ├── models/          # Database models
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation, logging
│   │   └── utils/          # Helpers & constants
│   ├── prisma/             # Database schema & migrations
│   ├── tests/              # Backend test suites
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/         # Frontend utilities
│   ├── public/            # Static assets
│   └── package.json
├── shared/                 # Shared types & utilities
├── docker/                # Docker configuration
├── docs/                  # Additional documentation
├── scripts/               # Deployment & setup scripts
└── plan.md               # This file
```

---

## 3. Database Design

### 3.1 Core Entities (PostgreSQL Schema)

#### 3.1.1 Restaurants (Petpooja Outlets)
```sql
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    petpooja_rest_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    state VARCHAR(100),
    contact_info VARCHAR(50),
    menu_sharing_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurants_petpooja_id ON restaurants(petpooja_rest_id);
```

#### 3.1.2 Customers
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    petpooja_customer_id VARCHAR(50),
    restaurant_id INTEGER REFERENCES restaurants(id),
    name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    gstin VARCHAR(50),
    created_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, phone)
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
```

#### 3.1.3 Orders (From Consumption API)
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    petpooja_order_id VARCHAR(50) UNIQUE NOT NULL,
    restaurant_id INTEGER REFERENCES restaurants(id),
    customer_id INTEGER REFERENCES customers(id),
    order_type VARCHAR(50), -- Dine In, Pick Up, Delivery
    payment_type VARCHAR(50), -- Cash, Card, Online, Part Payment
    order_from VARCHAR(50), -- POS, Zomato, Swiggy
    order_from_id VARCHAR(100),
    sub_order_type VARCHAR(100),
    table_no VARCHAR(20),
    no_of_persons INTEGER,
    discount_total DECIMAL(10,2) DEFAULT 0,
    tax_total DECIMAL(10,2) DEFAULT 0,
    core_total DECIMAL(10,2),
    total DECIMAL(10,2),
    status VARCHAR(20), -- Success, Cancelled
    biller VARCHAR(100),
    assignee VARCHAR(100),
    created_on TIMESTAMP,
    raw_payload JSONB, -- Store complete API response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_restaurant_date ON orders(restaurant_id, created_on);
CREATE INDEX idx_orders_status ON orders(status);
```

#### 3.1.4 Order Items
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    petpooja_item_id VARCHAR(50),
    name VARCHAR(255),
    item_code VARCHAR(100),
    category_name VARCHAR(100),
    price DECIMAL(10,2),
    quantity INTEGER,
    total DECIMAL(10,2),
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    sap_code VARCHAR(100),
    raw_addons JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

#### 3.1.5 Inventory Items (Raw Materials)
```sql
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    petpooja_item_id VARCHAR(50),
    restaurant_id INTEGER REFERENCES restaurants(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    type CHAR(1), -- 'R' for Raw Material
    unit VARCHAR(20), -- KG, GM, L, ML, PCS
    consumption_unit VARCHAR(20),
    conversion_qty DECIMAL(10,3),
    hsn_code VARCHAR(20),
    gst_percentage DECIMAL(5,2),
    sap_code VARCHAR(100),
    is_expiry BOOLEAN DEFAULT FALSE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_items_restaurant ON inventory_items(restaurant_id);
CREATE INDEX idx_inventory_items_sap ON inventory_items(sap_code);
```

#### 3.1.6 Stock Levels
```sql
CREATE TABLE stock_levels (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER REFERENCES inventory_items(id),
    restaurant_id INTEGER REFERENCES restaurants(id),
    date DATE NOT NULL,
    quantity DECIMAL(10,3),
    unit VARCHAR(20),
    price DECIMAL(10,2),
    last_updated TIMESTAMP,
    UNIQUE(inventory_item_id, restaurant_id, date)
);

CREATE INDEX idx_stock_date ON stock_levels(date);
```

#### 3.1.7 Purchase Orders
```sql
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    petpooja_po_id VARCHAR(50) UNIQUE,
    restaurant_id INTEGER REFERENCES restaurants(id),
    receiver_type VARCHAR(50), -- Supplier, S/C
    receiver_name VARCHAR(255),
    delivery_date DATE,
    po_number VARCHAR(100),
    total_tax DECIMAL(10,2),
    total DECIMAL(10,2),
    round_off DECIMAL(10,2),
    status VARCHAR(20), -- Active, Cancelled
    raw_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_restaurant ON purchase_orders(restaurant_id, created_at);
```

#### 3.1.8 Purchase Invoices
```sql
CREATE TABLE purchase_invoices (
    id SERIAL PRIMARY KEY,
    petpooja_purchase_id VARCHAR(50) UNIQUE,
    restaurant_id INTEGER REFERENCES restaurants(id),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    receiver_name VARCHAR(255),
    receiver_type VARCHAR(50),
    sub_total DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    total_discount DECIMAL(10,2),
    delivery_charge DECIMAL(10,2),
    total DECIMAL(10,2),
    payment_status VARCHAR(20), -- Paid, Unpaid, Partial
    paid_amount DECIMAL(10,2),
    raw_payload JSONB,
    created_on TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pi_restaurant_date ON purchase_invoices(restaurant_id, invoice_date);
```

#### 3.1.9 Sales (Internal Transfers & Wastage)
```sql
CREATE TABLE internal_sales (
    id SERIAL PRIMARY KEY,
    petpooja_sale_id VARCHAR(50) UNIQUE,
    restaurant_id INTEGER REFERENCES restaurants(id),
    type VARCHAR(20), -- Normal, Transfer, Wastage
    invoice_number VARCHAR(100),
    invoice_date DATE,
    total DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    status VARCHAR(20),
    raw_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_type_date ON internal_sales(type, invoice_date);
```

### 3.2 Database Relationships Diagram
```
restaurants (1) ──── (n) customers
     │
     ├─── (1) ──── (n) orders ──── (n) order_items
     │
     ├─── (1) ──── (n) inventory_items
     │                    │
     │                    └─── (n) stock_levels
     │
     ├─── (1) ──── (n) purchase_orders ──── (n) po_items
     │
     ├─── (1) ──── (n) purchase_invoices ──── (n) pi_items
     │
     └─── (1) ──── (n) internal_sales ──── (n) sales_items
```

---

## 4. API Integration Strategy

### 4.1 Petpooja API Authentication
All APIs use the same credentials:
```typescript
const API_CREDENTIALS = {
    app_key: "rpvg7joamn421d3u0x5qhk9ze8sibtcw",
    app_secret: "c7b1e4b80a2d1bfbf67da2bc81ca9dd9bf019b3e",
    access_token: "7334c01be3a9677868cbf1402880340e79e1ea84",
    menuSharingCode: "XXXX" // Dynamic per restaurant
};
```

### 4.2 API Client Implementation
```typescript
// backend/src/api/petpooja-client.ts
import axios, { AxiosInstance } from 'axios';

export class PetpoojaClient {
    private client: AxiosInstance;
    private credentials: typeof API_CREDENTIALS;
    
    constructor(menuSharingCode: string) {
        this.credentials = {
            ...API_CREDENTIALS,
            menuSharingCode
        };
        
        this.client = axios.create({
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Inventory Push APIs (Third-Party → Petpooja)
    async createPurchase(data: PurchaseData) { /* ... */ }
    async createPurchaseReturn(data: PurchaseReturnData) { /* ... */ }
    async createSale(data: SaleData) { /* ... */ }
    async createTransfer(data: TransferData) { /* ... */ }
    async createRawMaterial(data: RawMaterialData) { /* ... */ }
    async createSalesReturn(data: SalesReturnData) { /* ... */ }
    
    // Inventory Pull APIs (Petpooja → Third-Party)
    async getStock(date: string) { /* ... */ }
    async getPurchaseOrders(fromDate: string, toDate: string) { /* ... */ }
    async getPurchases(fromDate: string, toDate: string, refId?: string) { /* ... */ }
    async getSales(fromDate: string, toDate: string, sType: string, refId?: string) { /* ... */ }
    async getConsumption(orderDate: string, refId?: string) { /* ... */ }
}
```

### 4.3 API Catalog with Integration Priority

#### High Priority (Core ERP Functions)
| API Name | Direction | Endpoint | Priority | Purpose |
|----------|-----------|-----------|----------|---------|
| Stock API | Pull | `/V1/thirdparty/get_stock_api/` | P0 | Daily stock reconciliation |
| Consumption API | Pull | `/V1/thirdparty/get_orders_api/` | P0 | Sales & customer data sync |
| Purchase API (Pull) | Pull | `/V1/thirdparty/get_purchase/` | P0 | Procurement tracking |
| Get Sales API | Pull | `/V1/thirdparty/get_sales/` | P0 | Internal transfers, wastage |
| Raw Material API | Push | `/V1/thirdparty/rawmaterial_save_api/` | P0 | Master data sync |

#### Medium Priority (Operational Functions)
| API Name | Direction | Endpoint | Priority | Purpose |
|----------|-----------|-----------|----------|---------|
| Purchase Order API | Push (Webhook) | Webhook URL | P1 | Real-time PO notifications |
| Purchase API (Push) | Push | `/inventories/purchase_save_api` | P1 | Sync purchase invoices |
| Sales API (Push) | Push | `/inventories/sale_save_api` | P1 | Sync sales invoices |
| Transfer API | Push | `/inventories/transfer_save_api` | P1 | Sync internal transfers |

#### Lower Priority (Edge Cases)
| API Name | Direction | Endpoint | Priority | Purpose |
|----------|-----------|-----------|----------|---------|
| Purchase Return API | Push | `/inventories/purchase_return_save_api` | P2 | Handle returns |
| Sales Return API | Push | `/inventories/sale_return_save_api` | P2 | Handle returns |
| Purchase Return (Pull) | Pull | `/V1/thirdparty/get_sales/` | P2 | Track returns |

### 4.4 Pagination Handling
All pull APIs return max 50 records per request. Implement pagination handler:
```typescript
async function fetchAllPages<T>(
    fetchFn: (refId?: string) => Promise<{ data: T[], nextRefId?: string }>,
    initialState: { refId?: string } = {}
): Promise<T[]> {
    let allData: T[] = [];
    let refId = initialState.refId;
    let hasMore = true;
    
    while (hasMore) {
        const { data, nextRefId } = await fetchFn(refId);
        allData = [...allData, ...data];
        
        if (data.length < 50 || !nextRefId) {
            hasMore = false;
        } else {
            refId = nextRefId;
        }
    }
    
    return allData;
}
```

### 4.5 Webhook Setup (For Real-Time PO Push)
```typescript
// Endpoint to receive Petpooja webhooks
app.post('/webhook/petpooja/purchase-order', async (req, res) => {
    const { menuSharingCode, app_key, access_token, data } = req.body;
    
    // Validate webhook authenticity
    if (app_key !== API_CREDENTIALS.app_key) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Process PO data
    await processPurchaseOrder(data);
    
    res.json({ success: true });
});
```

---

## 5. ERP Module Breakdown

### 5.1 Module 1: Dashboard & Analytics
**Priority:** P0  
**Description:** Executive dashboard with KPIs and real-time metrics

**Features:**
- Daily sales summary (from Consumption API)
- Stock level alerts (from Stock API)
- Low-stock notifications
- Top-selling items analysis
- Revenue trends (daily/weekly/monthly)
- Tax liability summary

**APIs Used:**
- Consumption API (sales data)
- Stock API (inventory levels)

---

### 5.2 Module 2: Inventory Management
**Priority:** P0  
**Description:** Complete inventory tracking and management

**Features:**
- **Stock Levels:** Real-time stock viewing by date
- **Raw Materials:** Master data management (push new items via Raw Material API)
- **Stock Movements:** Track all stock in/out movements
- **Batch Tracking:** Handle batch codes and expiry dates
- **Stock Alerts:** Low stock, expiring items, overstock
- **Stock Audit:** Reconciliation with physical counts
- **Wastage Tracking:** Log and track wastage (via Internal Sales API)

**APIs Used:**
- Stock API (pull stock levels)
- Raw Material API (push new materials)
- Internal Sales API (track wastage)
- Transfer API (internal movements)

**Database Tables:**
- `inventory_items`
- `stock_levels`
- `internal_sales` (wastage type)

---

### 5.3 Module 3: Procurement Management
**Priority:** P0  
**Description:** End-to-end purchase cycle management

**Features:**
- **Purchase Orders:** Create/manage POs (push to Petpooja)
- **PO Tracking:** Real-time PO webhook notifications
- **Purchase Invoices:** Record invoices (push to Petpooja)
- **Invoice Matching:** Match POs with invoices
- **Purchase Returns:** Handle returns (push to Petpooja)
- **Vendor Management:** Supplier master data
- **Payment Tracking:** Track paid/unpaid invoices
- **Procurement Analytics:** Spend analysis, vendor performance

**APIs Used:**
- Purchase Order API (webhook for real-time POs)
- Purchase API (push invoices, pull for sync)
- Purchase Return API (push returns)

**Database Tables:**
- `purchase_orders`
- `purchase_invoices`
- `purchase_returns`

---

### 5.4 Module 4: Sales & CRM
**Priority:** P0  
**Description:** Sales tracking and customer relationship management

**Features:**
- **Order Management:** View all orders (from Consumption API)
- **Customer Profiles:** 360° customer view with order history
- **Customer Segmentation:** By order frequency, value
- **Sales Returns:** Handle returns (push to Petpooja)
- **Internal Sales:** Track non-POS sales (B2B, etc.)
- **Sales Analytics:** By customer, item, category, time period
- **CRM Activities:** Customer follow-ups, feedback

**APIs Used:**
- Consumption API (pull order data)
- Sales Return API (push returns)
- Internal Sales API (track non-POS sales)

**Database Tables:**
- `orders`
- `order_items`
- `customers`

---

### 5.5 Module 5: Financial Management
**Priority:** P1  
**Description:** Tax, discount, and payment management

**Features:**
- **Tax Management:** CGST/SGST/IGST tracking
- **Tax Reports:** GSTR-1, GSTR-3B preparation
- **Discount Tracking:** Promotion effectiveness analysis
- **Payment Reconciliation:** Match payments with invoices
- **Expense Tracking:** All operational expenses
- **Profit & Loss:** Real-time P&L statements
- **Financial Reports:** Balance sheet, cash flow

**APIs Used:**
- All APIs (for tax/discount data in payloads)

---

### 5.6 Module 6: Reports & Analytics
**Priority:** P1  
**Description:** Comprehensive reporting suite

**Report Categories:**
1. **Sales Reports:**
   - Daily/Monthly sales summary
   - Sales by item/category
   - Sales by payment type
   - Sales by customer
   - Aggregator performance (Zomato/Swiggy)

2. **Inventory Reports:**
   - Stock status report
   - Stock movement report
   - Wastage analysis
   - Expiry report
   - Slow-moving items

3. **Procurement Reports:**
   - Purchase summary
   - Vendor-wise purchases
   - PO status report
   - Price trend analysis

4. **Financial Reports:**
   - Tax liability report
   - GSTR reports
   - Profit & Loss
   - Cash flow statement

**Implementation:**
- Use React Query for data fetching
- Export to PDF/Excel functionality
- Scheduled report generation via Bull Queue

---

## 6. Development Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Set up project structure and database

**Tasks:**
- [x] Initialize project directories
- [ ] Set up PostgreSQL database with Prisma ORM
- [ ] Create all database schemas (Section 3)
- [ ] Set up Node.js/Express backend with TypeScript
- [ ] Implement Petpooja API client (all 14+ APIs)
- [ ] Set up React frontend with Tailwind CSS
- [ ] Configure Docker for local development
- [ ] Set up GitHub repository with CI/CD

**Deliverables:**
- Working database with all tables
- API client library for all Petpooja APIs
- Basic frontend shell

---

### Phase 2: Core Modules (Weeks 3-5)
**Goal:** Implement Inventory, Procurement, and Sales modules

**Tasks:**
- [ ] **Inventory Module:**
  - Implement Stock API integration (pull stock levels)
  - Build stock viewing UI with date filter
  - Implement Raw Material API (push new materials)
  - Create raw material master UI
  
- [ ] **Procurement Module:**
  - Implement Purchase Order webhook receiver
  - Build PO tracking UI
  - Implement Purchase API (push invoices)
  - Create purchase invoice UI
  - Set up vendor management
  
- [ ] **Sales & CRM Module:**
  - Implement Consumption API (pull order data)
  - Build order listing with filters
  - Create customer profiles with order history
  - Implement customer segmentation logic

**Deliverables:**
- Working Inventory Management module
- Working Procurement Management module
- Working Sales & CRM module

---

### Phase 3: Financial & Reporting (Weeks 6-7)
**Goal:** Implement financial tracking and reports

**Tasks:**
- [ ] **Financial Module:**
  - Extract tax data from all API payloads
  - Build tax liability calculator
  - Implement payment tracking
  - Create P&L calculation engine
  
- [ ] **Reports Module:**
  - Build sales reports (daily/monthly/by item)
  - Build inventory reports (stock/wastage/expiry)
  - Build procurement reports (vendor/spend analysis)
  - Implement PDF/Excel export
  - Set up scheduled report generation

**Deliverables:**
- Financial tracking dashboard
- Complete reporting suite with exports

---

### Phase 4: Dashboard & Integration (Weeks 8-9)
**Goal:** Build executive dashboard and finalize integrations

**Tasks:**
- [ ] **Dashboard Module:**
  - Build KPI cards (sales, orders, stock value)
  - Create revenue trend charts
  - Build stock alert notifications
  - Implement real-time data refresh
  
- [ ] **Final Integration:**
  - Implement all remaining APIs (returns, transfers)
  - Set up bidirectional sync verification
  - Build data reconciliation tools
  - Implement audit logging

**Deliverables:**
- Executive dashboard with real-time KPIs
- Fully integrated system with all 14+ APIs

---

### Phase 5: Testing & Deployment (Weeks 10-12)
**Goal:** Comprehensive testing and go-live

**Tasks:**
- [ ] **Testing:**
  - Unit tests for all API clients
  - Integration tests for database operations
  - E2E tests for critical user flows
  - Load testing for API endpoints
  - Security penetration testing
  
- [ ] **Deployment:**
  - Set up production environment
  - Configure Nginx reverse proxy
  - Set up SSL certificates
  - Implement backup strategy
  - Create deployment documentation
  - User training materials

**Deliverables:**
- Production-ready ERP system
- Complete test coverage
- Deployment documentation

---

## 7. Data Flow Architecture

### 7.1 Bidirectional Sync Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    Petpooja POS System                     │
│  (Source of truth for sales, inventory, procurement)      │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
               │ Push (Webhook)          │ Pull (API Call)
               │                          │
               ▼                          ▼
┌──────────────────────┐      ┌──────────────────────────┐
│ Purchase Order       │      │ Get Sales API            │
│ Webhook Receiver    │      │ (Transfers/Wastage)     │
│ → Process PO data   │      │ → Fetch internal sales   │
└──────────┬─────────┘      └───────────┬──────────────┘
           │                            │
           └──────────┬─────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  ERP Database    │
           │  (PostgreSQL)   │
           └────────┬─────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌────────┐  ┌──────────┐
│Frontend │  │Reports │  │  APIs   │
│Dashboard│  │Engine  │  │ (Push)  │
└──────────┘  └────────┘  └────┬─────┘
                                │
                                │ Push to Petpooja
                                ▼
                    ┌──────────────────────────┐
                    │ Purchase API (Push)      │
                    │ Sales API (Push)        │
                    │ Transfer API (Push)      │
                    │ Raw Material API (Push)  │
                    └──────────────────────────┘
```

### 7.2 Data Sync Strategies

#### Real-Time Sync (Webhooks)
- **When:** Purchase Order created in Petpooja
- **Trigger:** Petpooja pushes to your webhook URL
- **Action:** Immediately insert into ERP database
- **Latency:** < 1 second

#### Scheduled Pull Sync (Cron Jobs)
- **When:** Daily stock reconciliation, sales sync
- **Schedule:** 
  - Stock levels: Every night at 2 AM
  - Consumption data: Every night at 3 AM
  - Purchase data: Every 6 hours
- **Implementation:** Bull Queue with cron patterns

#### On-Demand Sync (User Initiated)
- **When:** User clicks "Sync Now" in UI
- **Action:** Call appropriate Petpooja API and update database
- **Feedback:** Progress bar with success/error messages

### 7.3 Data Transformation Layer
```typescript
// Transform Petpooja payload to ERP database format
function transformOrder(petpoojaOrder: any) {
    return {
        petpooja_order_id: petpoojaOrder.Order.orderID.toString(),
        restaurant_id: getRestaurantId(petpoojaOrder.Restaurant.restID),
        customer_id: getOrCreateCustomer(petpoojaOrder.Customer),
        order_type: petpoojaOrder.Order.order_type,
        payment_type: petpoojaOrder.Order.payment_type,
        total: parseFloat(petpoojaOrder.Order.total),
        // ... map all fields
        raw_payload: petpoojaOrder // Store original
    };
}
```

---

## 8. Security & Authentication

### 8.1 Authentication Strategy
| Layer | Method | Implementation |
|-------|--------|----------------|
| **Web App** | JWT Tokens | Access token (15 min) + Refresh token (7 days) |
| **API** | API Keys | Petpooja credentials (stored encrypted) |
| **Database** | Connection Pool | Credentials in environment variables |
| **Webhooks** | Signature Verification | Validate `app_key` in payload |

### 8.2 Security Best Practices
```typescript
// Environment variables (never commit secrets!)
PETPOOJA_APP_KEY=encrypted_storage
PETPOOJA_APP_SECRET=encrypted_storage
JWT_SECRET=strong_random_string
DB_PASSWORD=strong_password

// API Rate Limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

// Input Validation (using Zod)
const OrderSchema = z.object({
    restaurant_id: z.number().int().positive(),
    total: z.number().positive(),
    // ...
});
```

### 8.3 Data Encryption
- **At Rest:** PostgreSQL database encryption for sensitive fields (customer phone, GST)
- **In Transit:** HTTPS/TLS 1.3 for all API communications
- **API Credentials:** Stored in HashiCorp Vault or AWS Secrets Manager

---

## 9. Testing Strategy

### 9.1 Test Pyramid
```
        ┌─────────────┐
        │   E2E Tests │  (10%) - Critical user journeys
        └──────┬──────┘
               │
      ┌────────▼────────┐
      │ Integration Tests │  (20%) - API clients, DB operations
      └────────┬─────────┘
               │
      ┌────────▼────────┐
      │   Unit Tests     │  (70%) - Functions, utilities
      └─────────────────┘
```

### 9.2 Test Implementation
```typescript
// Unit Test Example (API Client)
describe('PetpoojaClient', () => {
    it('should fetch stock levels for a date', async () => {
        const client = new PetpoojaClient('XXXXX');
        const stock = await client.getStock('2026-05-01');
        expect(stock).toBeDefined();
        expect(stock.closing_json).toBeInstanceOf(Array);
    });
});

// Integration Test Example (Database)
describe('Order Service', () => {
    it('should save order from Petpooja payload', async () => {
        const payload = { /* sample payload */ };
        const order = await OrderService.saveOrder(payload);
        expect(order.id).toBeDefined();
        expect(order.total).toBe(1158);
    });
});

// E2E Test Example (User Flow)
describe('Procurement Flow', () => {
    it('should create PO and track it', async () => {
        await page.goto('/procurement/po/create');
        await page.fill('[name="total"]', '5000');
        await page.click('button[type="submit"]');
        await expect(page.locator('.success-msg')).toHaveText('PO created');
    });
});
```

### 9.3 Test Coverage Goals
- **Unit Tests:** 80% coverage
- **Integration Tests:** All API endpoints covered
- **E2E Tests:** All critical user flows covered
- **Load Testing:** 100 concurrent users, < 200ms response time

---

## 10. Deployment Plan

### 10.1 Environment Strategy
| Environment | Purpose | URL | Database |
|-------------|---------|-----|----------|
| **Development** | Local development | localhost:3000 | Local PostgreSQL |
| **Staging** | Testing & QA | staging.erp.com | Staging DB (prod copy) |
| **Production** | Live system | erp.com | Production DB (clustered) |

### 10.2 Docker Configuration
```dockerfile
# backend/Dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]

# frontend/Dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 10.3 CI/CD Pipeline (GitHub Actions)
```yaml
name: Deploy ERP
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t erp-backend ./backend
      - run: docker push erp-backend
      - run: ./scripts/deploy.sh
```

### 10.4 Monitoring & Logging
- **Application Monitoring:** Prometheus + Grafana
- **Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Error Tracking:** Sentry
- **Uptime Monitoring:** Pingdom or UptimeRobot

---

## 11. Risk Assessment

### 11.1 Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Petpooja API downtime | High | Medium | Implement retry logic with exponential backoff |
| Data sync conflicts | High | Low | Use timestamps and Petpooja as source of truth |
| API rate limiting | Medium | Low | Implement request queuing and rate limiting |
| Database overload | Medium | Low | Connection pooling, query optimization, caching |

### 11.2 Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Incorrect inventory data | High | Medium | Daily reconciliation reports, audit trails |
| Financial miscalculations | High | Low | Double-entry validation, financial audit logs |
| User adoption failure | Medium | Low | Comprehensive training, intuitive UI |

---

## 12. Timeline & Milestones

### 12.1 Gantt Chart (12-Week Timeline)
```
Week:     1  2  3  4  5  6  7  8  9 10 11 12
          |--|--|--|--|--|--|--|--|--|--|--|--|
Foundation │██│██│  |  |  |  |  |  |  |  |  |  |
Core Modules│  │  │██│██│██│  |  |  |  |  |  |  |
Financial   │  │  │  │  │  │██│██│  |  |  |  |  |
Dashboard   │  │  │  │  │  │  │  │██│██│  |  |  |
Testing     │  │  │  │  │  │  │  │  │  │██│██│██│
Deployment  │  │  │  │  │  │  │  │  │  │  │  │██│
```

### 12.2 Key Milestones
| Milestone | Target Date | Deliverables |
|-----------|-------------|-------------|
| **M1: Database Ready** | Week 2 | All schemas created, Prisma migrations |
| **M2: API Clients Ready** | Week 3 | All 14+ Petpooja APIs integrated |
| **M3: Core Modules Live** | Week 5 | Inventory, Procurement, Sales modules |
| **M4: Financial & Reports** | Week 7 | Financial tracking, all reports |
| **M5: Dashboard Live** | Week 9 | Executive dashboard with KPIs |
| **M6: Production Launch** | Week 12 | Full system live, all tests passing |

### 12.3 Critical Path
1. Database setup → API client development → Core modules → Testing → Deployment
2. Any delay in API integration will push all subsequent milestones

---

## Appendices

### Appendix A: Petpooja API Endpoint Reference
```
Production Endpoints:
- Inventory Push APIs: https://inventory.petpooja.com/inventories/
- Inventory Pull APIs: https://api.petpooja.com/V1/thirdparty/
- Webhook URL: [Your server]/webhook/petpooja/
```

### Appendix B: Sample Data Payloads
(Reference: Original PDF files in `C:\Users\U.C\Downloads\`)

### Appendix C: Useful Commands
```bash
# Start development
cd backend && npm run dev

# Run migrations
npx prisma migrate dev

# Run tests
npm test

# Build for production
npm run build

# Deploy
./scripts/deploy.sh
```

---

**Document Version:** 1.0  
**Next Review Date:** End of Phase 1 (Week 2)  
**Document Owner:** ERP Development Team
