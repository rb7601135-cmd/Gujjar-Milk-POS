const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dairy.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  // 1. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ur TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      stock REAL NOT NULL DEFAULT 50,
      min_stock REAL NOT NULL DEFAULT 10,
      is_decimal INTEGER NOT NULL DEFAULT 1,
      icon TEXT DEFAULT '🥛',
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      customer_name TEXT DEFAULT 'Walk-in Customer',
      customer_phone TEXT DEFAULT '',
      cashier_name TEXT DEFAULT 'Muhammad Bilal',
      subtotal REAL NOT NULL,
      discount_type TEXT DEFAULT 'fixed',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      cash_paid REAL NOT NULL,
      change_returned REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      items_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_voided INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name_en TEXT NOT NULL,
      product_name_ur TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Ensure image_url column exists if table was created in an earlier migration
  const columns = db.prepare(`PRAGMA table_info(products)`).all();
  const hasImageUrl = columns.some((col) => col.name === 'image_url');
  if (!hasImageUrl) {
    db.exec(`ALTER TABLE products ADD COLUMN image_url TEXT;`);
  }

  // 2. Pre-populate Settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['shop_name', 'Gujjar Milk (گجر ملک شاپ)'],
      ['shop_name_ur', 'گجر ملک شاپ'],
      ['tagline', 'Pure & Fresh Dairy Products — 100% Khales Guarantee'],
      ['address', 'Shop #12, Main Dairy Market, Near Gate 4, G.T Road'],
      ['phone', '+92 300 8765432 / +92 321 9876543'],
      ['currency', 'Rs'],
      ['currency_symbol', '₨'],
      ['default_tax_rate', '0'],
      ['cashier_name', 'Muhammad Bilal'],
      ['cashier_shift', 'Shift #1 (Morning/Afternoon)'],
      ['footer_note', 'Thank you for visiting Gujjar Milk! Pure quality guaranteed. جزاک اللہ خیراً'],
      ['thermal_paper_size', '80mm'],
      ['enable_sound', 'true'],
      ['invoice_prefix', 'GM-2026-']
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const insertMany = db.transaction((settings) => {
      for (const [k, v] of settings) {
        insertSetting.run(k, v);
      }
    });
    insertMany(defaultSettings);
  }

  // 3. Pre-configured, high-resolution authentic local dairy imagery (20 canonical items)
  const canonicalDairyProducts = [
    {
      code: 'GM-01',
      name_en: 'Fresh Buffalo Milk',
      name_ur: 'بھینس کا دودھ',
      category: 'Fresh Milk',
      price: 220,
      unit: 'Litre',
      stock: 250,
      min_stock: 30,
      is_decimal: 1,
      icon: '🥛',
      image_url: '/products/gm-01-buffalo-milk.jpg'
    },
    {
      code: 'GM-02',
      name_en: 'Pure Cow Milk',
      name_ur: 'گائے کا دودھ',
      category: 'Fresh Milk',
      price: 200,
      unit: 'Litre',
      stock: 180,
      min_stock: 25,
      is_decimal: 1,
      icon: '🥛',
      image_url: '/products/gm-02-cow-milk.jpg'
    },
    {
      code: 'GM-03',
      name_en: 'Pure Desi Ghee 1kg',
      name_ur: 'خالص دیسی گھی (1 کلو)',
      category: 'Desi Ghee',
      price: 2600,
      unit: 'Jar',
      stock: 45,
      min_stock: 10,
      is_decimal: 0,
      icon: '🏺',
      image_url: '/products/gm-03-desi-ghee-1kg.jpg'
    },
    {
      code: 'GM-04',
      name_en: 'Desi Ghee 500g Jar',
      name_ur: 'دیسی گھی 500 گرام جار',
      category: 'Desi Ghee',
      price: 1350,
      unit: 'Jar',
      stock: 60,
      min_stock: 10,
      is_decimal: 0,
      icon: '🏺',
      image_url: '/products/gm-04-desi-ghee-500g.jpg'
    },
    {
      code: 'GM-05',
      name_en: 'Fresh Sweet Dahi / Curd',
      name_ur: 'میٹھا دہی',
      category: 'Dahi & Creams',
      price: 260,
      unit: 'Kg',
      stock: 100,
      min_stock: 20,
      is_decimal: 1,
      icon: '🥣',
      image_url: '/products/gm-05-sweet-dahi.jpg'
    },
    {
      code: 'GM-06',
      name_en: 'Plain Desi Dahi',
      name_ur: 'سادہ دہی',
      category: 'Dahi & Creams',
      price: 240,
      unit: 'Kg',
      stock: 120,
      min_stock: 20,
      is_decimal: 1,
      icon: '🥣',
      image_url: '/products/gm-06-plain-dahi.jpg'
    },
    {
      code: 'GM-07',
      name_en: 'Thick Malai / Fresh Cream',
      name_ur: 'تازہ بالائی / ملائی',
      category: 'Dahi & Creams',
      price: 900,
      unit: 'Kg',
      stock: 35,
      min_stock: 8,
      is_decimal: 1,
      icon: '🥛',
      image_url: '/products/gm-07-thick-malai.jpg'
    },
    {
      code: 'GM-08',
      name_en: 'Fresh White Butter',
      name_ur: 'تازہ سفید مکھن',
      category: 'Desi Ghee',
      price: 450,
      unit: '250g',
      stock: 55,
      min_stock: 10,
      is_decimal: 0,
      icon: '🧈',
      image_url: '/products/gm-08-white-butter.jpg'
    },
    {
      code: 'GM-09',
      name_en: 'Desi Paneer / Cottage Cheese',
      name_ur: 'دیسی پنیر',
      category: 'Dahi & Creams',
      price: 1100,
      unit: 'Kg',
      stock: 30,
      min_stock: 6,
      is_decimal: 1,
      icon: '🧀',
      image_url: '/products/gm-09-desi-paneer.jpg'
    },
    {
      code: 'GM-10',
      name_en: 'Full Cream Khoya / Mawa',
      name_ur: 'کھویا / ماوا',
      category: 'Sweets & Kheer',
      price: 1200,
      unit: 'Kg',
      stock: 40,
      min_stock: 8,
      is_decimal: 1,
      icon: '🧈',
      image_url: '/products/gm-10-khoya-mawa.jpg'
    },
    {
      code: 'GM-11',
      name_en: 'Traditional Sweet Lassi',
      name_ur: 'میٹھی لسی',
      category: 'Lassi & Drinks',
      price: 140,
      unit: 'Glass',
      stock: 100,
      min_stock: 15,
      is_decimal: 0,
      icon: '🥤',
      image_url: '/products/gm-11-sweet-lassi.jpg'
    },
    {
      code: 'GM-12',
      name_en: 'Namkeen Jeera Lassi',
      name_ur: 'نمکین زیرہ لسی',
      category: 'Lassi & Drinks',
      price: 120,
      unit: 'Glass',
      stock: 80,
      min_stock: 15,
      is_decimal: 0,
      icon: '🥤',
      image_url: '/products/gm-12-namkeen-jeera-lassi.jpg'
    },
    {
      code: 'GM-13',
      name_en: 'Paira Malai Lassi Special',
      name_ur: 'پیڑا ملائی لسی سپیشل',
      category: 'Lassi & Drinks',
      price: 220,
      unit: 'Glass',
      stock: 65,
      min_stock: 10,
      is_decimal: 0,
      icon: '🥤',
      image_url: '/products/gm-13-paira-malai-lassi.jpg'
    },
    {
      code: 'GM-14',
      name_en: 'Badam Zafran Rabri Milk Bottle',
      name_ur: 'بادام زعفران ربڑی دودھ بوتل',
      category: 'Lassi & Drinks',
      price: 280,
      unit: '500ml',
      stock: 75,
      min_stock: 15,
      is_decimal: 0,
      icon: '🍼',
      image_url: '/products/gm-14-badam-zafran-rabri.jpg'
    },
    {
      code: 'GM-15',
      name_en: 'Special Khoya Gulab Jamun',
      name_ur: 'کھویا گلاب جامن',
      category: 'Sweets & Kheer',
      price: 950,
      unit: 'Kg',
      stock: 45,
      min_stock: 10,
      is_decimal: 1,
      icon: '🍩',
      image_url: '/products/gm-15-gulab-jamun.jpg'
    },
    {
      code: 'GM-16',
      name_en: 'Fresh Rasgulla',
      name_ur: 'تازہ رس گلہ',
      category: 'Sweets & Kheer',
      price: 900,
      unit: 'Kg',
      stock: 40,
      min_stock: 8,
      is_decimal: 1,
      icon: '🍬',
      image_url: '/products/gm-16-rasgulla.jpg'
    },
    {
      code: 'GM-17',
      name_en: 'Traditional Khoya Barfi',
      name_ur: 'روایتی کھویا برفی',
      category: 'Sweets & Kheer',
      price: 1100,
      unit: 'Kg',
      stock: 35,
      min_stock: 8,
      is_decimal: 1,
      icon: '🍬',
      image_url: '/products/gm-17-khoya-barfi.jpg'
    },
    {
      code: 'GM-18',
      name_en: 'Matka Kulfa / Kulfi Cup',
      name_ur: 'مٹکا قلفہ / قلفی کپ',
      category: 'Sweets & Kheer',
      price: 150,
      unit: 'Pc',
      stock: 85,
      min_stock: 15,
      is_decimal: 0,
      icon: '🍧',
      image_url: '/products/gm-18-matka-kulfa.jpg'
    },
    {
      code: 'GM-19',
      name_en: 'Zafrani Kheer Cup',
      name_ur: 'زعفرانی کھیر کپ',
      category: 'Sweets & Kheer',
      price: 180,
      unit: 'Cup',
      stock: 70,
      min_stock: 12,
      is_decimal: 0,
      icon: '🍮',
      image_url: '/products/gm-19-zafrani-kheer.jpg'
    },
    {
      code: 'GM-20',
      name_en: 'Skimmed Milk Powder Pack',
      name_ur: 'سکمڈ ملک پاؤڈر پیک',
      category: 'Fresh Milk',
      price: 1600,
      unit: 'Kg',
      stock: 30,
      min_stock: 5,
      is_decimal: 0,
      icon: '📦',
      image_url: '/products/gm-20-milk-powder.jpg'
    }
  ];

  // Upsert products to ensure 20 high-quality dairy items are present and updated with imagery
  const upsertProductStmt = db.prepare(`
    INSERT INTO products (code, name_en, name_ur, category, price, unit, stock, min_stock, is_decimal, icon, image_url, is_active)
    VALUES (@code, @name_en, @name_ur, @category, @price, @unit, @stock, @min_stock, @is_decimal, @icon, @image_url, 1)
    ON CONFLICT(code) DO UPDATE SET
      name_en = excluded.name_en,
      name_ur = excluded.name_ur,
      category = excluded.category,
      price = excluded.price,
      unit = excluded.unit,
      is_decimal = excluded.is_decimal,
      icon = excluded.icon,
      image_url = excluded.image_url,
      is_active = 1,
      updated_at = CURRENT_TIMESTAMP
  `);

  const syncProductsTx = db.transaction((items) => {
    for (const item of items) {
      upsertProductStmt.run(item);
    }
  });
  syncProductsTx(canonicalDairyProducts);

  // 4. Pre-populate Demo Sales if empty to give lively reporting out of the box
  const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get();
  if (salesCount.count === 0) {
    seedDemoSales();
  }
}

function seedDemoSales() {
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
  if (products.length === 0) return;

  const demoCustomers = [
    { name: 'Chaudhry Akram', phone: '0300-5544332' },
    { name: 'Haji Aslam', phone: '0321-4433221' },
    { name: 'Rana Tariq', phone: '0333-1122334' },
    { name: 'Malik Zeeshan', phone: '0345-9988776' },
    { name: 'Walk-in Customer', phone: '' },
    { name: 'Sheikh Rizwan', phone: '0312-7766554' },
    { name: 'Mian Usman', phone: '0302-3344556' },
    { name: 'Walk-in Customer', phone: '' },
    { name: 'Kashif Gujjar', phone: '0322-8877665' },
    { name: 'Dr. Shahzad', phone: '0334-2211998' }
  ];

  const paymentMethods = ['Cash', 'Cash', 'Cash', 'EasyPaisa', 'JazzCash', 'Card'];
  const now = new Date();

  // Create 16 realistic sales across the last 3 days
  const insertSale = db.prepare(`
    INSERT INTO sales (
      invoice_no, customer_name, customer_phone, cashier_name,
      subtotal, discount_type, discount_value, discount_amount,
      tax_rate, tax_amount, total_amount, payment_method,
      cash_paid, change_returned, notes, items_count, created_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO sale_items (
      sale_id, product_id, product_name_en, product_name_ur,
      unit, quantity, unit_price, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createSalesTx = db.transaction(() => {
    let invoiceCounter = 1;

    for (let i = 0; i < 16; i++) {
      const cust = demoCustomers[i % demoCustomers.length];
      const payMethod = paymentMethods[i % paymentMethods.length];

      // Select 1 to 3 products
      const p1 = products[i % products.length];
      const p2 = products[(i + 4) % products.length];

      let itemsList = [];
      const q1 = p1.is_decimal ? (i % 2 === 0 ? 2 : 1.5) : (i % 3 === 0 ? 2 : 1);
      itemsList.push({
        product: p1,
        qty: q1,
        total: q1 * p1.price
      });

      if (i % 2 === 0) {
        const q2 = p2.is_decimal ? 1 : 2;
        itemsList.push({
          product: p2,
          qty: q2,
          total: q2 * p2.price
        });
      }

      const subtotal = itemsList.reduce((acc, it) => acc + it.total, 0);
      const discount = i === 3 ? 50 : 0;
      const total = subtotal - discount;
      const cashPaid = payMethod === 'Cash' ? Math.ceil(total / 100) * 100 : total;
      const change = cashPaid - total;

      // Spread dates: some today, some yesterday, some 2 days ago
      const dayOffset = i < 7 ? 0 : (i < 11 ? 1 : 2);
      const saleDate = new Date(now.getTime() - (dayOffset * 86400000) - (i * 3600000));
      const dateStr = saleDate.toISOString().replace('T', ' ').substring(0, 19);

      const invNo = `GM-2026-${String(invoiceCounter++).padStart(4, '0')}`;

      const res = insertSale.run(
        invNo,
        cust.name,
        cust.phone,
        'Muhammad Bilal',
        subtotal,
        'fixed',
        discount,
        discount,
        0,
        0,
        total,
        payMethod,
        cashPaid,
        change,
        i === 3 ? 'Regular customer discount' : '',
        itemsList.length,
        dateStr
      );

      const saleId = res.lastInsertRowid;
      for (const it of itemsList) {
        insertItem.run(
          saleId,
          it.product.id,
          it.product.name_en,
          it.product.name_ur,
          it.product.unit,
          it.qty,
          it.product.price,
          it.total
        );
      }
    }
  });

  createSalesTx();
}

function initModernDairyDb() {
  db.exec(`
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
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Milk Procurement (Daily Intake)
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
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Supplier Ledger Transactions (Advances, feed, payouts)
    CREATE TABLE IF NOT EXISTS supplier_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      date DATE NOT NULL,
      type TEXT CHECK(type IN ('milk_intake', 'advance_payment', 'feed_purchase', 'cash_payout')) NOT NULL,
      amount REAL NOT NULL,
      reference_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Monthly Subscription Customers (دودھ کارڈ کھاتہ)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      morning_quota_litres REAL DEFAULT 0,
      evening_quota_litres REAL DEFAULT 0,
      milk_type TEXT DEFAULT 'buffalo',
      custom_rate REAL DEFAULT 220,
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Subscription Daily Attendance / Nagha Log (ناغہ شیٹ)
    CREATE TABLE IF NOT EXISTS subscription_daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      log_date DATE NOT NULL,
      shift_type TEXT NOT NULL,
      scheduled_litres REAL NOT NULL,
      delivered_litres REAL NOT NULL,
      is_nagha INTEGER DEFAULT 0,
      extra_litres REAL DEFAULT 0,
      unit_rate REAL NOT NULL,
      total_charge REAL NOT NULL,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(customer_id, log_date, shift_type)
    );

    -- 7. Customer Transactions / Khata (Payments, recoveries, billing)
    CREATE TABLE IF NOT EXISTS customer_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      date DATE NOT NULL,
      type TEXT CHECK(type IN ('milk_delivery', 'cash_payment', 'online_payment', 'adjustment')) NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Processing & By-Product Batches (دودھ پروسیسنگ و دہی جمانا)
    CREATE TABLE IF NOT EXISTS processing_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER REFERENCES shifts(id),
      batch_date DATE NOT NULL,
      source_milk_type TEXT NOT NULL,
      source_litres REAL NOT NULL,
      target_product_code TEXT NOT NULL,
      target_product_name TEXT NOT NULL,
      target_quantity_produced REAL NOT NULL,
      target_unit TEXT NOT NULL,
      spoilage_litres REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT 'Head Dairyman',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed sample suppliers if empty
  const suppliersCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  if (suppliersCount.count === 0) {
    const defaultSuppliers = [
      { code: 'GW-01', name: 'Chaudhry Aslam Gawala', phone: '0300-8472911', village_area: 'Phoolnagar Farm #4', milk_type: 'buffalo', default_rate: 180, rate_type: 'fat_based', balance: 14500 },
      { code: 'GW-02', name: 'Malik Tariq Dairy Farm', phone: '0321-4589201', village_area: 'Chung Manga Mandi', milk_type: 'buffalo', default_rate: 185, rate_type: 'fixed', balance: 8200 },
      { code: 'GW-03', name: 'Haji Pehlwan Gujjar', phone: '0312-9843210', village_area: 'Raiwind Road Phatak', milk_type: 'cow', default_rate: 165, rate_type: 'fixed', balance: -5000 },
      { code: 'GW-04', name: 'Rana Bashir Cattle Yard', phone: '0345-7761234', village_area: 'Kasur Canal Road', milk_type: 'buffalo', default_rate: 182, rate_type: 'fat_based', balance: 22000 }
    ];

    const insertSup = db.prepare(`
      INSERT INTO suppliers (code, name, phone, village_area, milk_type, default_rate, rate_type, current_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of defaultSuppliers) {
      insertSup.run(s.code, s.name, s.phone, s.village_area, s.milk_type, s.default_rate, s.rate_type, s.balance);
    }
  }

  // Seed sample subscription customers if empty
  const customersCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  if (customersCount.count === 0) {
    const defaultCustomers = [
      { account_no: 'MK-101', name: 'Dr. Imran Farooq', phone: '0300-5544332', address: 'House 42-B, Model Town', morning_quota: 3.0, evening_quota: 1.5, milk_type: 'buffalo', custom_rate: 220, balance: 4800 },
      { account_no: 'MK-102', name: 'Advocate Bilal Shah', phone: '0322-9988771', address: 'Plot 18, Judicial Colony', morning_quota: 2.0, evening_quota: 0.0, milk_type: 'buffalo', custom_rate: 220, balance: 2200 },
      { account_no: 'MK-103', name: 'Professor Tariq Jameel', phone: '0315-7766554', address: 'B-6, Officers Society', morning_quota: 1.5, evening_quota: 1.5, milk_type: 'cow', custom_rate: 200, balance: -1000 },
      { account_no: 'MK-104', name: 'Baji Zainab Bibi', phone: '0333-1122334', address: 'Street 4, Mohallah Gujjarpura', morning_quota: 4.0, evening_quota: 2.0, milk_type: 'buffalo', custom_rate: 215, balance: 9600 },
      { account_no: 'MK-105', name: 'Muhammad Naeem Akhtar', phone: '0346-4433221', address: 'Al-Madina Colony, G.T Road', morning_quota: 2.0, evening_quota: 1.0, milk_type: 'buffalo', custom_rate: 220, balance: 3400 }
    ];

    const insertCust = db.prepare(`
      INSERT INTO customers (account_no, name, phone, address, morning_quota_litres, evening_quota_litres, milk_type, custom_rate, current_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of defaultCustomers) {
      insertCust.run(c.account_no, c.name, c.phone, c.address, c.morning_quota, c.evening_quota, c.milk_type, c.custom_rate, c.balance);
    }
  }

  // Ensure an active shift exists
  const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open' LIMIT 1").get();
  if (!activeShift) {
    const todayStr = new Date().toISOString().substring(0, 10);
    db.prepare(`
      INSERT INTO shifts (shift_date, shift_type, cashier_name, opening_cash, opening_milk_chiller, status, notes)
      VALUES (?, 'morning', 'Muhammad Bilal', 15000, 120, 'open', 'Morning operational shift started with 120L chiller buffer.')
    `).run(todayStr);
  }

  // Seed sample milk procurement entries for today if empty
  const procCount = db.prepare('SELECT COUNT(*) as count FROM milk_procurement').get();
  if (procCount.count === 0) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShiftRow = db.prepare("SELECT id FROM shifts ORDER BY id DESC LIMIT 1").get();
    const activeShiftId = activeShiftRow ? activeShiftRow.id : 1;
    
    db.prepare(`
      INSERT INTO milk_procurement (shift_id, supplier_id, entry_date, shift_type, milk_type, quantity_litres, fat_percentage, lactometer_reading, rate_per_litre, total_amount, payment_status, notes)
      VALUES 
        (?, 1, ?, 'morning', 'buffalo', 85, 6.8, 28.5, 185, 15725, 'credit_khata', 'First morning can delivery. Pure buffalo milk.'),
        (?, 2, ?, 'morning', 'buffalo', 110, 6.4, 28.0, 180, 19800, 'credit_khata', 'Morning batch - direct from dairy sheds.'),
        (?, 3, ?, 'morning', 'cow', 65, 4.2, 30.0, 165, 10725, 'cash_paid', 'Cow milk batch for tea & sweet counters.')
    `).run(activeShiftId, todayStr, activeShiftId, todayStr, activeShiftId, todayStr);
  }

  // Seed daily subscription logs for today if empty
  const subLogsCount = db.prepare('SELECT COUNT(*) as count FROM subscription_daily_logs').get();
  if (subLogsCount.count === 0) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const customers = db.prepare('SELECT * FROM customers').all();
    const insertSubLog = db.prepare(`
      INSERT OR IGNORE INTO subscription_daily_logs (customer_id, log_date, shift_type, scheduled_litres, delivered_litres, is_nagha, extra_litres, unit_rate, total_charge, notes)
      VALUES (?, ?, 'morning', ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      if (c.morning_quota_litres > 0) {
        const isNagha = i === 1 ? 1 : 0;
        const delivered = isNagha ? 0 : c.morning_quota_litres;
        const extra = i === 3 ? 1.0 : 0;
        const totalDelivered = delivered + extra;
        const charge = totalDelivered * c.custom_rate;
        insertSubLog.run(
          c.id,
          todayStr,
          c.morning_quota_litres,
          totalDelivered,
          isNagha,
          extra,
          c.custom_rate,
          charge,
          isNagha ? 'Informed skip (ناغہ) via phone' : (extra > 0 ? 'Guest visiting - extra 1L' : 'Delivered on time')
        );
      }
    }
  }

  // Seed sample processing batch if empty
  const batchCount = db.prepare('SELECT COUNT(*) as count FROM processing_batches').get();
  if (batchCount.count === 0) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShiftRow = db.prepare("SELECT id FROM shifts ORDER BY id DESC LIMIT 1").get();
    const activeShiftId = activeShiftRow ? activeShiftRow.id : 1;
    db.prepare(`
      INSERT INTO processing_batches (shift_id, batch_date, source_milk_type, source_litres, target_product_code, target_product_name, target_quantity_produced, target_unit, spoilage_litres, notes, created_by)
      VALUES 
        (?, ?, 'buffalo', 70, 'GM-05', 'Sweet Dahi / Curd (میٹھا دہی)', 68, 'Kg', 0, 'Morning Dahi fermentation batch set at 38°C.', 'Ustad Kareem'),
        (?, ?, 'buffalo', 40, 'GM-07', 'Thick Malai / Fresh Cream', 3.8, 'Kg', 0.5, 'Slow boiled buffalo milk skimming.', 'Ustad Kareem')
    `).run(activeShiftId, todayStr, activeShiftId, todayStr);
  }
}

// Call initializations on module load
initDb();
initModernDairyDb();

module.exports = db;
