# 🥛 Gujjar Milk (گجر ملک شاپ) — Modern Commercial Dairy POS & Management System

An ultra-modern, production-grade Point of Sale (POS), Inventory, Sales Archive, and Analytics Web Application architected with a **"Bright, Pure & Clean White" Apple Store / Modern Shopify POS aesthetic**, designed specifically for modern dairy enterprises, milk shops, and sweet counters.

---

## 🌟 Upgraded Highlights & Core Features

### 1. 🎨 Visual Design & Theme (Bright, Crisp White & Minimalist)
- **Aesthetic**: Apple Store / Shopify POS modern clean white interface.
- **Palette**:
  - Background: Crisp Pure White (`#FFFFFF`) & ultra-light slate neutral (`#F8FAFC`).
  - Card & Container Surfaces: Bright pure white with soft glassmorphism borders (`border border-slate-200/80`) and subtle elevation shadows (`card-elevation`).
  - Accent Colors: Fresh Dairy Green (`#16A34A` / Emerald-600) and Warm Golden Butter (`#F59E0B`).
  - Typography: Clean sans-serif (Inter / Plus Jakarta Sans) with crisp dark slate headers (`#0F172A`) and Urdu typography (`Noto Nastaliq Urdu`).
- **Top Navigation Bar**:
  - High-end dairy branding badge with pure milk container icon.
  - Live digital clock with seconds and current date.
  - Cashier Shift indicator with active pulse dot.
  - Quick **Today's Revenue pill badge** with live order count.
  - **Global quick-search input** with hotkey shortcut (`Ctrl + K` or `/`).
- **Left Modern Sidebar**:
  - Slim modern navigation with active state glow:
    1. POS Cashier Terminal
    2. Product Catalog & Inventory
    3. Sales Archive & Invoices
    4. Business Analytics & Reports
    5. Settings & Receipt Configurator

---

### 2. 🥛 20+ Dairy Products with High-Resolution Imagery
All 20 canonical dairy items are pre-populated with direct Unsplash high-resolution imagery, English & Urdu names, accurate pricing, units, and decimal weight support:

1. **Fresh Buffalo Milk (بھینس کا دودھ)** — Rs. 220/Litre (`Fresh Milk`)
2. **Pure Cow Milk (گائے کا دودھ)** — Rs. 200/Litre (`Fresh Milk`)
3. **Pure Desi Ghee 1kg (خالص دیسی گھی)** — Rs. 2,600/Jar (`Desi Ghee`)
4. **Desi Ghee 500g Jar** — Rs. 1,350/Jar (`Desi Ghee`)
5. **Fresh Sweet Dahi / Curd (میٹھا دہی)** — Rs. 260/Kg (`Dahi & Creams`)
6. **Plain Desi Dahi (سادہ دہی)** — Rs. 240/Kg (`Dahi & Creams`)
7. **Thick Malai / Fresh Cream** — Rs. 900/Kg (`Dahi & Creams`)
8. **Fresh White Butter (مکھن)** — Rs. 450/250g (`Desi Ghee`)
9. **Desi Paneer / Cottage Cheese** — Rs. 1,100/Kg (`Dahi & Creams`)
10. **Full Cream Khoya / Mawa** — Rs. 1,200/Kg (`Sweets & Kheer`)
11. **Traditional Sweet Lassi (میٹھی لسی)** — Rs. 140/Glass (`Lassi & Drinks`)
12. **Namkeen Jeera Lassi** — Rs. 120/Glass (`Lassi & Drinks`)
13. **Paira Malai Lassi Special** — Rs. 220/Glass (`Lassi & Drinks`)
14. **Badam Zafran Rabri Milk Bottle** — Rs. 280/500ml (`Lassi & Drinks`)
15. **Special Khoya Gulab Jamun** — Rs. 950/Kg (`Sweets & Kheer`)
16. **Fresh Rasgulla** — Rs. 900/Kg (`Sweets & Kheer`)
17. **Traditional Khoya Barfi** — Rs. 1,100/Kg (`Sweets & Kheer`)
18. **Matka Kulfa / Kulfi Cup** — Rs. 150/Pc (`Sweets & Kheer`)
19. **Zafrani Kheer Cup** — Rs. 180/Cup (`Sweets & Kheer`)
20. **Skimmed Milk Powder Pack** — Rs. 1,600/Kg (`Fresh Milk`)

---

### 3. ⚡ Rapid POS Cashier Billing Terminal
- **Category Filter Pills**: `All`, `Fresh Milk`, `Dahi & Creams`, `Desi Ghee`, `Lassi & Drinks`, `Sweets & Kheer`.
- **Card Features**: Crisp product photography, stock pills, unit tags, one-tap "+ Add" button.
- **Decimal Weight / Litre Stepper**: Quick fraction increments (`+0.5`, `+1.0`, `+1.5`, `+2.0`) for measuring liquid milk or dahi.
- **Interactive Bill Panel**:
  - Live subtotal, discounts (`%` or fixed `Rs`), and bold PKR Grand Total.
  - Payment options: `Cash`, `Card`, `EasyPaisa / JazzCash`.
  - Cash Tendered input with instant **Change Due calculation** in bold emerald text (`text-emerald-600 font-black`).
  - Park / Hold bill functionality and recall tray.

---

### 4. 🖨️ Instant 80mm Thermal Receipt & Client-Side PDF
- Client-side instant generation using `jsPDF`.
- Dual preview formats: **80mm thermal receipt roll** and clean printable **A4 Invoice**.
- Details:
  - Header: Shop name (English & Urdu), tagline, address, phone.
  - Metadata: Invoice number, date/time, cashier name, customer name & phone.
  - Table: Line items, quantity/weight, unit rate, and line total.
  - Total: Grand total in bold PKR / Rs.
  - Barcode and QR code mockup with *"Thank you for buying pure!"* note.
- **"Print Receipt"** (direct browser thermal print without page headers/footers) and **"Download PDF"** buttons.

---

### 5. 📊 Sales Archive & Daily Business Summary
- Persistent SQLite storage with transactions, items breakdown, payment mode, cashier, and timestamps.
- **Daily Summary Metric Cards**:
  1. **Total Sales (PKR)** today
  2. **Cash in Drawer** today (calculated from cash transactions)
  3. **Total Milk Litres Sold** today (calculated from milk dispatches)
- Search sales by invoice number (e.g. `GM-2026-0001`) or customer name.
- 1-click "Reprint / View Slip" and "Download PDF" for any past bill.
- Void invoice with automatic inventory stock replenishment.
- Export all transactions to CSV/Excel.

---

### 6. 📦 Inventory Management & Shop Configuration
- Live stock tracking with low-stock alerts.
- Add/Edit product modal supporting direct Image URLs with live preview.
- Quick restock modal for morning milk deliveries (`+20L`, `+50L`, `+100L`).
- Full receipt configurator (change shop name, tagline, address, phone, footer notes, and paper size).

---

## 🚀 Running the Project

```bash
# 1. Start the backend server & client dev server concurrently:
npm run dev

# 2. Or start backend server (serves the production build on port 5000):
npm start
```

- **Backend API**: `http://localhost:5000/api`
- **Vite Client**: `http://localhost:5173`
- **Production Server**: `http://localhost:5000`
