const db = require('./db');

const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
const buffalo = products.find(p => p.code === 'GM-01') || products[0];
const cow = products.find(p => p.code === 'GM-02') || products[1];
const ghee = products.find(p => p.code === 'GM-03') || products[2];
const dahi = products.find(p => p.code === 'GM-05') || products[4];
const lassi = products.find(p => p.code === 'GM-11') || products[10];

const now = new Date();
const todayStr = now.toISOString().replace('T', ' ').substring(0, 19);

const insertSale = db.prepare(`
  INSERT INTO sales (
    invoice_no, customer_name, customer_phone, cashier_name,
    subtotal, discount_type, discount_value, discount_amount,
    tax_rate, tax_amount, total_amount, payment_method,
    cash_paid, change_returned, notes, items_count, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertItem = db.prepare(`
  INSERT INTO sale_items (
    sale_id, product_id, product_name_en, product_name_ur,
    unit, quantity, unit_price, total_price
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const last = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
let seq = (last ? last.id : 0) + 1;

// Sale 1: Buffalo milk 5 Litres, Cash
let res1 = insertSale.run('GM-2026-' + String(seq++).padStart(4, '0'), 'Chaudhry Akram', '0300-5544332', 'Muhammad Bilal', 1100, 'fixed', 0, 0, 0, 0, 1100, 'Cash', 1500, 400, 'Fresh morning milk', 1, todayStr);
insertItem.run(res1.lastInsertRowid, buffalo.id, buffalo.name_en, buffalo.name_ur, buffalo.unit, 5, buffalo.price, 1100);

// Sale 2: Cow Milk 3 Litres + Sweet Dahi 1.5kg, Cash
let res2 = insertSale.run('GM-2026-' + String(seq++).padStart(4, '0'), 'Haji Aslam', '0321-4433221', 'Muhammad Bilal', 990, 'fixed', 0, 0, 0, 0, 990, 'Cash', 1000, 10, '', 2, todayStr);
insertItem.run(res2.lastInsertRowid, cow.id, cow.name_en, cow.name_ur, cow.unit, 3, cow.price, 600);
insertItem.run(res2.lastInsertRowid, dahi.id, dahi.name_en, dahi.name_ur, dahi.unit, 1.5, dahi.price, 390);

// Sale 3: Desi Ghee 1kg, Card
let res3 = insertSale.run('GM-2026-' + String(seq++).padStart(4, '0'), 'Malik Zeeshan', '0345-9988776', 'Muhammad Bilal', 2600, 'fixed', 0, 0, 0, 0, 2600, 'Card', 2600, 0, '', 1, todayStr);
insertItem.run(res3.lastInsertRowid, ghee.id, ghee.name_en, ghee.name_ur, ghee.unit, 1, ghee.price, 2600);

// Sale 4: Sweet Lassi 4 Glasses, EasyPaisa
let res4 = insertSale.run('GM-2026-' + String(seq++).padStart(4, '0'), 'Rana Tariq', '0333-1122334', 'Muhammad Bilal', 560, 'fixed', 0, 0, 0, 0, 560, 'EasyPaisa', 560, 0, '', 1, todayStr);
insertItem.run(res4.lastInsertRowid, lassi.id, lassi.name_en, lassi.name_ur, lassi.unit, 4, lassi.price, 560);

// Sale 5: Buffalo Milk 4 Litres, Cash
let res5 = insertSale.run('GM-2026-' + String(seq++).padStart(4, '0'), 'Walk-in Customer', '', 'Muhammad Bilal', 880, 'fixed', 0, 0, 0, 0, 880, 'Cash', 1000, 120, '', 1, todayStr);
insertItem.run(res5.lastInsertRowid, buffalo.id, buffalo.name_en, buffalo.name_ur, buffalo.unit, 4, buffalo.price, 880);

console.log('Today sales seeded successfully!');
