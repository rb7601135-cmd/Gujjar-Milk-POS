# 🥛 Gujjar Milk (گجر ملک شاپ) — Modern Dairy Operations & POS System
## Comprehensive System Redesign & Engineering Specification Plan

---

## 1. Executive Summary

### 1.1 Project Mission
To transform **Gujjar Milk (گجر ملک شاپ)** from a generic retail cashier terminal into a **state-of-the-art Commercial Dairy Operations & Smart POS Platform**. The updated platform addresses the unique operational, biological, financial, and logistical challenges of high-volume dairy enterprises in South Asia (Pakistan / India).

### 1.2 Core Pillars of the Redesign
1. **Shift-Based Supply Chain**: Dual-shift operations (Morning صبح & Evening شام) with dedicated opening, collection, and closing logs.
2. **Gawala / Farmer Procurement**: Shift-wise milk intake tracking with Volume, Lactometer Reading (LR), and Fat % tiered pricing.
3. **Milk By-Product Processing (دودھ پراسیسنگ)**: Raw milk conversion tracking into Dahi (دہی), Malai/Cream, Butter (مکھن), Desi Ghee (دیسی گھی), and Khoya.
4. **Monthly Customer Milk Cards & Nagha Register (ماہانہ کھاتہ و ناغہ)**: Regular household subscriptions, daily delivery/skip tracking, and 1-click WhatsApp billing statements.
5. **Ultra-Fast Touch Counter POS**: Rush-hour ergonomic cashier interface with tare container weighing, pouch fees, and rapid cash tender shortcuts.
6. **Day-End Milk Litre Balancing (دودھ کا میزان)**: Physical inventory reconciliation comparing total incoming milk against sales, processing, chiller stock, and shrinkage/leakage.

---

## 2. Gap Analysis: Current System vs. Real Dairy Operations

```
CURRENT ARCHITECTURE (Generic Retail)
┌────────────────────────────────────────────────────────┐
│ Fixed Products ──> One-Off Sales ──> Basic Daily Cash  │
│ (Assumes static pre-packaged items & no suppliers)     │
└────────────────────────────────────────────────────────┘

MODERN DAIRY ARCHITECTURE (V2 Domain-Driven)
┌──────────────────────────────────────────────────────────────────────────┐
│  RAW INTAKE (Farmers/Gawalas) ──> Morning / Evening Shifts (Fat % / LR)  │
│         │                                                                │
│         ▼                                                                │
│  DAIRY PROCESSING ──────────────> Dahi, Malai, Ghee, Khoya Batches       │
│         │                                                                │
│         ▼                                                                │
│  OMNI-SALES DISPATCH ───────────> 1. Fast Touch Retail Counter           │
│         │                         2. Monthly Card Subscriptions (Nagha)  │
│         │                         3. Wholesale / Restaurant Bulk Supply  │
│         ▼                                                                │
│  CLOSING RECONCILIATION ────────> Milk Litres In = Litres Out + Chiller  │
│                                   (Zero Unaccounted Leakage)             │
└──────────────────────────────────────────────────────────────────────────┘
```

| Operational Area | Current Implementation | Real-World Dairy Bottleneck | Redesigned Solution |
| :--- | :--- | :--- | :--- |
| **Procurement** | None (items manually edited). | Fresh milk is bought twice daily from 10–30 local Gawalas. | **Farmer / Gawala Khata**: Daily intake register, Fat/LR price tiers, cattle feed deductions, and payouts. |
| **Perishability & Batching** | Assumes stock stays on shelf indefinitely. | Raw milk spoils or must be boiled and converted within hours. | **Production Batches & Spoilage Matrix**: Allocate milk to Dahi/Khoya; log sour milk into Paneer salvage. |
| **Household Customer Billing** | Only walk-in POS transactions. | 70%+ of steady revenue comes from monthly home delivery/pickup cards. | **Monthly Milk Card & Nagha Sheet**: Daily morning/evening quota, skip calendar, and automated WhatsApp invoices. |
| **Rush Hour Speed** | Requires multi-click item selection. | 6:00–9:00 AM & 5:00–9:00 PM see queues of 50+ customers buying milk/dahi. | **1-Tap Quick Presets**: `250g (پاؤ)`, `500g (آدھا کلو)`, `1kg`, `2kg`, tare container toggle, fast cash bills. |
| **Container / Packaging** | Ignores packaging. | Customers bring steel containers (ڈول) or request plastic pouches (شاپر). | **Packaging & Tare Weight Toggle**: Auto-deduct tare or add packaging fee with one tap. |
| **Inventory Accuracy** | Only tracks product count. | Money can balance while milk litres are stolen or wasted. | **Daily Milk Litre Balance Sheet (دودھ کا میزان)**: Physical intake vs sold vs chiller leftover = shortage. |

---

## 3. Detailed Module Specifications

### Module 1: Gawala Milk Procurement & Quality Testing (گوالہ و فارمر ڈیسک)
- **Shift Selection**: Morning (صبح) / Evening (شام).
- **Intake Entry**:
  - Farmer / Gawala Name & Code.
  - Milk Type (Buffalo بھینس / Cow گائے).
  - Quantity (Litres / Kilograms).
  - Quality Metrics: Fat % (3.0% – 9.0%) and Lactometer Reading (LR 24 – 32).
  - Rate Engine: Fixed rate per litre OR Fat/LR formula rate.
- **Supplier Ledger (گوالہ کھاتہ)**:
  - Advance Payments given (پیشگی رقم).
  - Feed & Supplies delivered (کھل، چوکر، ونڈا ادھار).
  - Net Payable Calculation and Weekly Settlement Slips.

---

### Module 2: Monthly Customer Subscriptions & Nagha Register (ماہانہ دودھ کارڈ)
- **Customer Profiles**: Name, mobile number, home delivery address, active status.
- **Subscription Setup**:
  - Daily Morning Quota (e.g. 2.0 Litres Buffalo Milk).
  - Daily Evening Quota (e.g. 1.0 Litre Cow Milk + 0.5 Kg Dahi).
  - Rate agreement (standard or contracted discount).
- **Daily Nagha / Skip Attendance Matrix (ناغہ شیٹ)**:
  - High-speed interactive grid for delivery riders or shop counter.
  - One-tap status toggle: `Delivered (مکمل)`, `Nagha / Skipped (ناغہ)`, `Extra Litres (+ اضافی)`.
- **Monthly Billing & 1-Click WhatsApp Sharing**:
  - Automatically aggregates bill on the 1st of every month:
    $$\text{Bill} = (\text{Total Days} - \text{Naghas}) \times \text{Daily Quota} \times \text{Rate} + \text{Extra Items}$$
  - Generates downloadable PDF ledger statement.
  - **WhatsApp Deep Link**: Direct message link formatted with Urdu greeting and breakdown.

---

### Module 3: Dairy Production & By-Product Processing (دودھ پراسیسنگ و دہی جمانا)
- **Raw Milk Splitting Wizard**:
  - Raw Buffalo/Cow Intake Pool (e.g., 500 Litres).
  - Allocation Breakdown:
    - Counter Retail Sales: 250 Litres.
    - Dahi (Curd) Fermentation Tank: 120 Litres $\rightarrow$ Est. Yield: 115 Kg Dahi.
    - Boiling / Cream Skimming: 80 Litres $\rightarrow$ Est. Yield: 7 Kg Malai $\rightarrow$ Butter $\rightarrow$ Desi Ghee.
    - Khoya / Kheer Sweets: 50 Litres.
- **Spoilage / Phata Doodh Log**:
  - Curdled / Sour Milk registration with timestamp and reason.
  - Salvage conversion into Desi Paneer (پنیر) or write-off loss tracking.

---

### Module 4: High-Speed Counter POS (کاؤنٹر سیلز ٹرمینل)
- **Ergonomic Speed-Grid**:
  - Sticky rapid-presets: `250g (پاؤ)`, `500g (آدھا کلو)`, `1 Kg`, `1.5 Kg`, `2 Kg`, `5 Kg`.
- **Container / Packaging Toggle**:
  - `Customer Vessel (گاہک کا برتن)`: Automatically zeros container tare weight.
  - `Shop Pouch / Polythene (شاپر تھیلی)`: Automatically attaches small packaging charge (e.g., Rs. 5 / 10).
  - `Plastic Bottle (دودھ کی بوتل)`: Attaches bottle deposit/cost.
- **Quick Cash Tender Bar**:
  - Fast buttons: `Exact`, `Rs 100`, `Rs 500`, `Rs 1,000`, `Rs 5,000`.
  - Prominent emerald change due calculation banner.
- **Multi-Cart Park / Hold**:
  - Park active cart if customer steps aside to fetch a vessel or money without holding the queue.

---

### Module 5: Day-End Milk Reconciliation & Shift Closing (میزان و کلوزنگ)
- **Litres Balance Audit Formula**:
  $$\text{Opening Chiller} + \text{Total Intake} = \text{Counter Sold} + \text{Subscriptions} + \text{Processed} + \text{Closing Chiller} + \Delta\text{ (Leakage / Variance)}$$
- **Variance Warning Threshold**: Flags shortages exceeding allowable evaporation/handling tolerance (e.g., > 1.5%).
- **Shift Handover Ledger**:
  - Cash in Drawer + Online Payments (JazzCash / EasyPaisa / Bank Transfer).
  - Minus Gawala Cash Disbursed = Net Physical Drawer Total.

---

## 6. Enhanced Database Schema (SQLite)

```sql
-- 1. Shifts Management
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date DATE NOT NULL,
  shift_type TEXT CHECK(shift_type IN ('morning', 'evening')) NOT NULL,
  cashier_name TEXT NOT NULL,
  opening_cash REAL NOT NULL DEFAULT 0,
  closing_cash REAL DEFAULT 0,
  opening_milk_chiller REAL NOT NULL DEFAULT 0,
  closing_milk_chiller REAL DEFAULT 0,
  status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  notes TEXT
);

-- 2. Gawala / Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village_area TEXT,
  milk_type TEXT CHECK(milk_type IN ('buffalo', 'cow', 'mixed')) DEFAULT 'buffalo',
  default_rate REAL NOT NULL,
  rate_type TEXT CHECK(rate_type IN ('fixed', 'fat_based')) DEFAULT 'fixed',
  current_balance REAL DEFAULT 0, -- Positive = payable to farmer, Negative = advance
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Milk Intake Log
CREATE TABLE IF NOT EXISTS milk_procurement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER REFERENCES shifts(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  entry_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  milk_type TEXT NOT NULL,
  quantity_litres REAL NOT NULL,
  fat_percentage REAL DEFAULT 0,
  lactometer_reading REAL DEFAULT 0,
  rate_per_litre REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_status TEXT CHECK(payment_status IN ('credit_khata', 'cash_paid')) DEFAULT 'credit_khata',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Subscriptions (Monthly Milk Card)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  morning_quota_litres REAL DEFAULT 0,
  evening_quota_litres REAL DEFAULT 0,
  milk_type TEXT DEFAULT 'buffalo',
  custom_rate REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Daily Subscription Delivery & Nagha Log
CREATE TABLE IF NOT EXISTS subscription_daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  log_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  scheduled_litres REAL NOT NULL,
  delivered_litres REAL NOT NULL,
  is_nagha INTEGER DEFAULT 0, -- 1 = Skip / Nagha
  extra_litres REAL DEFAULT 0,
  unit_rate REAL NOT NULL,
  total_charge REAL NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, log_date, shift_type)
);

-- 6. Processing & Batch Conversion Log
CREATE TABLE IF NOT EXISTS processing_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER REFERENCES shifts(id),
  batch_date DATE NOT NULL,
  source_milk_type TEXT NOT NULL,
  source_litres REAL NOT NULL,
  target_product_code TEXT NOT NULL, -- 'DAHI', 'MALAI', 'KHOYA', 'GHEE'
  target_quantity_produced REAL NOT NULL,
  target_unit TEXT NOT NULL,
  spoilage_litres REAL DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. UI/UX Design System Specifications

### 7.1 Color Palette & Theme
- **Surface Crisp**: `#FFFFFF` (Pure pristine white) with `#F8FAFC` (ultra-light cool slate container backgrounds).
- **Dairy Fresh Emerald**: `#15803D` (Primary Action & Safe Status) / `#16A34A` (Hover Accent).
- **Pure Milk Cream / Butter Amber**: `#F59E0B` / `#D97706` (Notifications, Badges & Shifts).
- **Deep Obsidian Slate**: `#0F172A` (Text, titles, high contrast under bright fluorescent lighting).
- **Subtle Glass Borders**: `rgba(226, 232, 240, 0.8)` with soft card elevation shadows.

### 7.2 Bilingual Typography
- **Primary Latin Font**: Inter / Plus Jakarta Sans (ultra-clean numeric legibility for decimals and rupees).
- **Primary Urdu Font**: Noto Nastaliq Urdu / Noto Sans Arabic (for clear, authentic Urdu counter terminology).

### 7.3 Audio-Haptic Feedback
- High-tone pleasant chime on item add.
- Low-tone feedback on clear/void.
- Affirmative double-tone on successful receipt generation and cash drawer open.

---

## 8. Phased Implementation Roadmap

```
Phase 1: Foundation & Data Architecture
├── Update SQLite schema & migrations
└── Build REST API endpoints for Shifts, Gawalas, and Subscriptions

Phase 2: High-Speed POS Overhaul
├── Add 1-tap quick weight presets (250g, 500g, 1kg, 2kg)
├── Implement Tare weight container toggle & pouch fee
└── Add rapid cash denomination buttons & multi-cart park

Phase 3: Monthly Customer Khata & Nagha Sheet
├── Customer registration with morning/evening quotas
├── Monthly calendar/grid for 1-tap Nagha marking
└── PDF invoice generator & WhatsApp share link

Phase 4: Gawala Procurement Desk
├── Shift intake terminal (Morning/Evening)
├── Fat % / Lactometer rate engine
└── Supplier balance ledger & payout slips

Phase 5: Processing & Milk Litre Balancing
├── Raw milk to Dahi/Khoya batch conversion wizard
├── Spoilage & Chiller overnight register
└── Complete Day-End Litre Reconciliation Sheet (میزان)
```
