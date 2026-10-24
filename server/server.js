const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files for production built client if present
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Serve local product imagery
const publicProductsPath = path.join(__dirname, '..', 'client', 'public', 'products');
app.use('/products', express.static(publicProductsPath));

// --- API ROUTES ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Gujjar Milk POS API', time: new Date() });
});

// 2. Settings Endpoints
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateTx = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        updateStmt.run(k, String(v));
      }
    });

    updateTx(updates);

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 3. Products Endpoints
app.get('/api/products', (req, res) => {
  try {
    const { category, search, activeOnly } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (activeOnly !== 'false') {
      query += ' AND is_active = 1';
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (name_en LIKE ? OR name_ur LIKE ? OR code LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY id ASC';

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const {
      code,
      name_en,
      name_ur,
      category,
      price,
      unit,
      stock = 0,
      min_stock = 5,
      is_decimal = 1,
      icon = '🥛',
      image_url = ''
    } = req.body;

    if (!name_en || !price || !unit) {
      return res.status(400).json({ error: 'Name, price, and unit are required.' });
    }

    // Auto-generate code if missing
    let finalCode = code;
    if (!finalCode) {
      const last = db.prepare('SELECT id FROM products ORDER BY id DESC LIMIT 1').get();
      const nextId = (last ? last.id : 0) + 1;
      finalCode = `GM-${String(nextId).padStart(2, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO products (code, name_en, name_ur, category, price, unit, stock, min_stock, is_decimal, icon, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      finalCode,
      name_en,
      name_ur || name_en,
      category || 'Fresh Milk',
      Number(price),
      unit,
      Number(stock),
      Number(min_stock),
      is_decimal ? 1 : 0,
      icon || '🥛',
      image_url || null
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const {
      name_en,
      name_ur,
      category,
      price,
      unit,
      stock,
      min_stock,
      is_decimal,
      icon,
      image_url,
      is_active
    } = req.body;

    const stmt = db.prepare(`
      UPDATE products SET
        name_en = COALESCE(?, name_en),
        name_ur = COALESCE(?, name_ur),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        unit = COALESCE(?, unit),
        stock = COALESCE(?, stock),
        min_stock = COALESCE(?, min_stock),
        is_decimal = COALESCE(?, is_decimal),
        icon = COALESCE(?, icon),
        image_url = COALESCE(?, image_url),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name_en,
      name_ur,
      category,
      price !== undefined ? Number(price) : null,
      unit,
      stock !== undefined ? Number(stock) : null,
      min_stock !== undefined ? Number(min_stock) : null,
      is_decimal !== undefined ? (is_decimal ? 1 : 0) : null,
      icon,
      image_url,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.patch('/api/products/:id/stock', (req, res) => {
  try {
    const id = req.params.id;
    const { delta, setStock } = req.body;

    if (setStock !== undefined) {
      db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(setStock), id);
    } else if (delta !== undefined) {
      db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(delta), id);
    } else {
      return res.status(400).json({ error: 'delta or setStock required' });
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error modifying stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    // Soft delete to protect sales historical references
    db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error('Error archiving product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 4. Sales & Invoicing Endpoints
app.get('/api/sales', (req, res) => {
  try {
    const { period, search, paymentMethod, limit = 100, page = 1 } = req.query;
    let query = 'SELECT * FROM sales WHERE is_voided = 0';
    const params = [];

    if (period === 'today') {
      query += " AND date(created_at, 'localtime') = date('now', 'localtime')";
    } else if (period === 'yesterday') {
      query += " AND date(created_at, 'localtime') = date('now', '-1 day', 'localtime')";
    } else if (period === 'week') {
      query += " AND date(created_at, 'localtime') >= date('now', '-7 days', 'localtime')";
    } else if (period === 'month') {
      query += " AND date(created_at, 'localtime') >= date('now', '-30 days', 'localtime')";
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query += ' AND payment_method = ?';
      params.push(paymentMethod);
    }

    if (search && search.trim() !== '') {
      query += ' AND (invoice_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const sales = db.prepare(query).all(...params);

    // Fetch items for each sale
    const getItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    const enrichedSales = sales.map(s => {
      const items = getItems.all(s.id);
      return { ...s, items };
    });

    res.json(enrichedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
});

app.get('/api/sales/:id', (req, res) => {
  try {
    const id = req.params.id;
    const sale = db.prepare('SELECT * FROM sales WHERE id = ? OR invoice_no = ?').get(id, id);
    if (!sale) {
      return res.status(400).json({ error: 'Invoice not found' });
    }
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
    res.json({ ...sale, items });
  } catch (error) {
    console.error('Error fetching sale details:', error);
    res.status(500).json({ error: 'Failed to fetch sale details' });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const {
      customer_name = 'Walk-in Customer',
      customer_phone = '',
      cashier_name = 'Muhammad Bilal',
      items,
      subtotal,
      discount_type = 'fixed',
      discount_value = 0,
      discount_amount = 0,
      tax_rate = 0,
      tax_amount = 0,
      total_amount,
      payment_method = 'Cash',
      cash_paid,
      change_returned = 0,
      notes = ''
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items to checkout.' });
    }

    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than zero.' });
    }

    // Auto-generate sequential invoice number: GM-2026-XXXX
    const lastSale = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
    const nextSeq = (lastSale ? lastSale.id : 0) + 1;
    const currentYear = new Date().getFullYear();
    const invoice_no = `GM-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    // Execute within a safe SQLite transaction
    const insertSaleStmt = db.prepare(`
      INSERT INTO sales (
        invoice_no, customer_name, customer_phone, cashier_name,
        subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, total_amount, payment_method,
        cash_paid, change_returned, notes, items_count
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const insertItemStmt = db.prepare(`
      INSERT INTO sale_items (
        sale_id, product_id, product_name_en, product_name_ur,
        unit, quantity, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const checkoutTx = db.transaction(() => {
      const saleResult = insertSaleStmt.run(
        invoice_no,
        customer_name || 'Walk-in Customer',
        customer_phone || '',
        cashier_name || 'Muhammad Bilal',
        Number(subtotal),
        discount_type,
        Number(discount_value),
        Number(discount_amount),
        Number(tax_rate),
        Number(tax_amount),
        Number(total_amount),
        payment_method,
        Number(cash_paid !== undefined ? cash_paid : total_amount),
        Number(change_returned || 0),
        notes || '',
        items.length
      );

      const saleId = saleResult.lastInsertRowid;

      for (const item of items) {
        insertItemStmt.run(
          saleId,
          item.product_id || item.id,
          item.name_en,
          item.name_ur || item.name_en,
          item.unit,
          Number(item.quantity),
          Number(item.price || item.unit_price),
          Number(item.total || (item.quantity * item.price))
        );

        // Deduct inventory
        updateStockStmt.run(Number(item.quantity), item.product_id || item.id);
      }

      return saleId;
    });

    const newSaleId = checkoutTx();

    const createdSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(newSaleId);
    const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(newSaleId);

    res.status(201).json({
      message: 'Sale completed successfully',
      sale: { ...createdSale, items: saleItems }
    });
  } catch (error) {
    console.error('Error during checkout sale:', error);
    res.status(500).json({ error: error.message || 'Failed to complete sale transaction' });
  }
});

// Void sale & restore inventory
app.post('/api/sales/:id/void', (req, res) => {
  try {
    const id = req.params.id;
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (!sale) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (sale.is_voided) {
      return res.status(400).json({ error: 'Invoice is already voided' });
    }

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);

    const voidTx = db.transaction(() => {
      // Mark voided
      db.prepare('UPDATE sales SET is_voided = 1 WHERE id = ?').run(id);

      // Restore inventory
      const restoreStockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of items) {
        restoreStockStmt.run(item.quantity, item.product_id);
      }
    });

    voidTx();

    res.json({ message: 'Invoice voided and inventory stock restored successfully' });
  } catch (error) {
    console.error('Error voiding sale:', error);
    res.status(500).json({ error: 'Failed to void invoice' });
  }
});

// 5. Reports & Analytics Summary
app.get('/api/reports/summary', (req, res) => {
  try {
    // Today's Revenue, Orders, and AOV
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as today_orders,
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COALESCE(AVG(total_amount), 0) as today_aov
      FROM sales 
      WHERE is_voided = 0 AND date(created_at, 'localtime') = date('now', 'localtime')
    `).get();

    // Today's Cash in Drawer (Cash payment method sales today)
    const todayCashStats = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as cash_in_drawer
      FROM sales
      WHERE is_voided = 0 AND date(created_at, 'localtime') = date('now', 'localtime') AND payment_method = 'Cash'
    `).get();

    // Today's Total Milk Litres Sold (products measured in Litres or fresh milk category)
    const todayMilkStats = db.prepare(`
      SELECT COALESCE(SUM(si.quantity), 0) as milk_litres_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.is_voided = 0 AND date(s.created_at, 'localtime') = date('now', 'localtime')
        AND (si.unit = 'Litre' OR p.category = 'Fresh Milk' OR p.name_en LIKE '%Milk%')
    `).get();

    // Attach to today object
    todayStats.cash_in_drawer = todayCashStats.cash_in_drawer;
    todayStats.milk_litres_sold_today = Number(todayMilkStats.milk_litres_sold).toFixed(1);

    // Yesterday's Revenue
    const yesterdayStats = db.prepare(`
      SELECT 
        COUNT(*) as yesterday_orders,
        COALESCE(SUM(total_amount), 0) as yesterday_revenue
      FROM sales 
      WHERE is_voided = 0 AND date(created_at, 'localtime') = date('now', '-1 day', 'localtime')
    `).get();

    // All-time Revenue and Orders
    const allTimeStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as overall_aov
      FROM sales
      WHERE is_voided = 0
    `).get();

    // Low stock items count
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND stock <= min_stock
    `).get().count;

    // Payment Methods breakdown
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method, 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE is_voided = 0
      GROUP BY payment_method
    `).all();

    // Top 5 Best Selling Dairy Items (All-Time and Today)
    const topItems = db.prepare(`
      SELECT 
        p.id,
        p.name_en,
        p.name_ur,
        p.unit,
        p.icon,
        p.image_url,
        COALESCE(SUM(si.quantity), 0) as total_qty,
        COALESCE(SUM(si.total_price), 0) as total_sales
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.is_voided = 0
      GROUP BY p.id
      ORDER BY total_sales DESC
      LIMIT 6
    `).all();

    // Last 7 Days Daily Revenue Trend for Charts
    const last7DaysTrend = db.prepare(`
      SELECT 
        date(created_at, 'localtime') as sale_date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as daily_revenue
      FROM sales
      WHERE is_voided = 0 AND date(created_at, 'localtime') >= date('now', '-6 days', 'localtime')
      GROUP BY date(created_at, 'localtime')
      ORDER BY sale_date ASC
    `).all();

    // Hourly Distribution for rush analysis
    const hourlyStats = db.prepare(`
      SELECT 
        strftime('%H', created_at, 'localtime') as hour,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE is_voided = 0
      GROUP BY hour
      ORDER BY hour ASC
    `).all();

    res.json({
      today: todayStats,
      yesterday: yesterdayStats,
      allTime: allTimeStats,
      lowStockCount,
      paymentMethods,
      topItems,
      last7DaysTrend,
      hourlyStats
    });
  } catch (error) {
    console.error('Error generating reports summary:', error);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

// ============================================================================
// MODERN DAIRY OPERATIONS API ROUTES
// ============================================================================

// --- 1. SHIFTS MANAGEMENT ---
app.get('/api/shifts/current', (req, res) => {
  try {
    const shift = db.prepare("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
    if (!shift) {
      return res.json({ active: false, shift: null });
    }

    const todayStr = shift.shift_date;
    const shiftType = shift.shift_type;

    const procTotal = db.prepare(`
      SELECT COALESCE(SUM(quantity_litres), 0) as total_procured, COALESCE(SUM(total_amount), 0) as total_cost
      FROM milk_procurement WHERE shift_id = ?
    `).get(shift.id);

    const salesTotal = db.prepare(`
      SELECT COALESCE(SUM(si.quantity), 0) as total_counter_litres, COALESCE(SUM(si.total_price), 0) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.is_voided = 0 AND date(s.created_at, 'localtime') = ? AND si.unit = 'Litre'
    `).get(todayStr);

    const subTotal = db.prepare(`
      SELECT COALESCE(SUM(delivered_litres), 0) as total_sub_litres, COALESCE(SUM(total_charge), 0) as total_sub_billed
      FROM subscription_daily_logs WHERE log_date = ? AND shift_type = ?
    `).get(todayStr, shiftType);

    const procBatchTotal = db.prepare(`
      SELECT COALESCE(SUM(source_litres), 0) as total_processed_litres, COALESCE(SUM(spoilage_litres), 0) as total_spoilage_litres
      FROM processing_batches WHERE shift_id = ?
    `).get(shift.id);

    const expectedChiller = Number((
      shift.opening_milk_chiller +
      procTotal.total_procured -
      salesTotal.total_counter_litres -
      subTotal.total_sub_litres -
      procBatchTotal.total_processed_litres -
      procBatchTotal.total_spoilage_litres
    ).toFixed(2));

    const cashSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total_cash_sales
      FROM sales WHERE is_voided = 0 AND date(created_at, 'localtime') = ? AND payment_method = 'Cash'
    `).get(todayStr);

    const cashPayouts = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total_payouts
      FROM milk_procurement WHERE shift_id = ? AND payment_status = 'cash_paid'
    `).get(shift.id);

    const expectedCash = Number((shift.opening_cash + cashSales.total_cash_sales - cashPayouts.total_payouts).toFixed(2));

    res.json({
      active: true,
      shift,
      metrics: {
        opening_cash: shift.opening_cash,
        opening_chiller: shift.opening_milk_chiller,
        procured_litres: procTotal.total_procured,
        counter_litres: salesTotal.total_counter_litres,
        subscription_litres: subTotal.total_sub_litres,
        processed_litres: procBatchTotal.total_processed_litres,
        spoilage_litres: procBatchTotal.total_spoilage_litres,
        expected_chiller_litres: expectedChiller,
        cash_sales: cashSales.total_cash_sales,
        cash_payouts: cashPayouts.total_payouts,
        expected_cash: expectedCash
      }
    });
  } catch (error) {
    console.error('Error fetching current shift:', error);
    res.status(500).json({ error: 'Failed to fetch active shift' });
  }
});

app.post('/api/shifts/open', (req, res) => {
  try {
    const {
      shift_type = 'morning',
      cashier_name = 'Muhammad Bilal',
      opening_cash = 10000,
      opening_milk_chiller = 100,
      notes = ''
    } = req.body;

    const todayStr = new Date().toISOString().substring(0, 10);

    db.prepare(`
      UPDATE shifts SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE status = 'open'
    `).run();

    const insert = db.prepare(`
      INSERT INTO shifts (shift_date, shift_type, cashier_name, opening_cash, opening_milk_chiller, status, notes)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `).run(todayStr, shift_type, cashier_name, opening_cash, opening_milk_chiller, notes);

    const newShift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(insert.lastInsertRowid);
    res.json({ message: 'Shift opened successfully', shift: newShift });
  } catch (error) {
    console.error('Error opening shift:', error);
    res.status(500).json({ error: 'Failed to open shift' });
  }
});

app.post('/api/shifts/close', (req, res) => {
  try {
    const { shift_id, closing_cash, closing_milk_chiller, notes = '' } = req.body;
    if (!shift_id) {
      return res.status(400).json({ error: 'Shift ID is required to close shift.' });
    }

    db.prepare(`
      UPDATE shifts 
      SET status = 'closed', closing_cash = ?, closing_milk_chiller = ?, closed_at = CURRENT_TIMESTAMP, notes = COALESCE(notes || ' | ', '') || ?
      WHERE id = ?
    `).run(closing_cash, closing_milk_chiller, notes, shift_id);

    const closed = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shift_id);
    res.json({ message: 'Shift closed successfully', shift: closed });
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

app.get('/api/shifts', (req, res) => {
  try {
    const shifts = db.prepare('SELECT * FROM shifts ORDER BY id DESC LIMIT 30').all();
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts history:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// --- 2. GAWALA / SUPPLIER PROCUREMENT ---
app.get('/api/suppliers', (req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY id ASC').all();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { id, code, name, phone, village_area, milk_type = 'buffalo', default_rate = 180, rate_type = 'fixed', current_balance = 0 } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    if (id) {
      db.prepare(`
        UPDATE suppliers SET name = ?, phone = ?, village_area = ?, milk_type = ?, default_rate = ?, rate_type = ?, current_balance = ?
        WHERE id = ?
      `).run(name, phone, village_area, milk_type, default_rate, rate_type, current_balance, id);
      const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
      return res.json({ message: 'Supplier updated', supplier: updated });
    } else {
      const generatedCode = code || `GW-${String(Date.now()).slice(-4)}`;
      const result = db.prepare(`
        INSERT INTO suppliers (code, name, phone, village_area, milk_type, default_rate, rate_type, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(generatedCode, name, phone, village_area, milk_type, default_rate, rate_type, current_balance);
      const created = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
      return res.json({ message: 'Supplier created', supplier: created });
    }
  } catch (error) {
    console.error('Error saving supplier:', error);
    res.status(500).json({ error: 'Failed to save supplier' });
  }
});

app.get('/api/procurement', (req, res) => {
  try {
    const { date, shift_type } = req.query;
    let query = `
      SELECT p.*, s.name as supplier_name, s.code as supplier_code, s.phone as supplier_phone, s.village_area
      FROM milk_procurement p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (date) {
      query += ' AND p.entry_date = ?';
      params.push(date);
    }
    if (shift_type && shift_type !== 'all') {
      query += ' AND p.shift_type = ?';
      params.push(shift_type);
    }
    query += ' ORDER BY p.id DESC';

    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching procurement entries:', error);
    res.status(500).json({ error: 'Failed to fetch milk procurement entries' });
  }
});

app.post('/api/procurement', (req, res) => {
  try {
    const {
      supplier_id,
      shift_type = 'morning',
      milk_type = 'buffalo',
      quantity_litres,
      fat_percentage = 0,
      lactometer_reading = 0,
      rate_per_litre,
      payment_status = 'credit_khata',
      notes = ''
    } = req.body;

    if (!supplier_id || !quantity_litres || !rate_per_litre) {
      return res.status(400).json({ error: 'Supplier, quantity in litres, and rate per litre are required.' });
    }

    const qty = parseFloat(quantity_litres);
    const rate = parseFloat(rate_per_litre);
    const total_amount = Number((qty * rate).toFixed(2));
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShift = db.prepare("SELECT id FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
    const shift_id = activeShift ? activeShift.id : null;

    const tx = db.transaction(() => {
      const ins = db.prepare(`
        INSERT INTO milk_procurement (
          shift_id, supplier_id, entry_date, shift_type, milk_type,
          quantity_litres, fat_percentage, lactometer_reading, rate_per_litre,
          total_amount, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shift_id,
        supplier_id,
        todayStr,
        shift_type,
        milk_type,
        qty,
        parseFloat(fat_percentage) || 0,
        parseFloat(lactometer_reading) || 0,
        rate,
        total_amount,
        payment_status,
        notes
      );

      // If credit, add to supplier balance
      if (payment_status === 'credit_khata') {
        db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?').run(total_amount, supplier_id);
        db.prepare(`
          INSERT INTO supplier_transactions (supplier_id, date, type, amount, reference_id, description)
          VALUES (?, ?, 'milk_intake', ?, ?, ?)
        `).run(supplier_id, todayStr, total_amount, ins.lastInsertRowid, `${qty}L ${milk_type} milk intake @ Rs.${rate}/L`);
      }

      // Automatically increase raw milk inventory stock on counter
      const targetCode = milk_type === 'cow' ? 'GM-02' : 'GM-01';
      db.prepare('UPDATE products SET stock = stock + ? WHERE code = ?').run(qty, targetCode);

      return ins.lastInsertRowid;
    });

    const entryId = tx();
    const entry = db.prepare(`
      SELECT p.*, s.name as supplier_name, s.code as supplier_code
      FROM milk_procurement p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(entryId);

    res.json({ message: 'Milk intake recorded successfully', entry });
  } catch (error) {
    console.error('Error recording procurement:', error);
    res.status(500).json({ error: 'Failed to record milk procurement' });
  }
});

app.get('/api/suppliers/:id/ledger', (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const intakes = db.prepare(`
      SELECT * FROM milk_procurement WHERE supplier_id = ? ORDER BY id DESC LIMIT 50
    `).all(supplierId);

    const transactions = db.prepare(`
      SELECT * FROM supplier_transactions WHERE supplier_id = ? ORDER BY id DESC LIMIT 50
    `).all(supplierId);

    res.json({ supplier, intakes, transactions });
  } catch (error) {
    console.error('Error fetching supplier ledger:', error);
    res.status(500).json({ error: 'Failed to fetch supplier ledger' });
  }
});

app.post('/api/suppliers/:id/payout', (req, res) => {
  try {
    const supplierId = req.params.id;
    const { type, amount, description = '' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const todayStr = new Date().toISOString().substring(0, 10);
    const amt = parseFloat(amount);

    const tx = db.transaction(() => {
      db.prepare('UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?').run(amt, supplierId);
      db.prepare(`
        INSERT INTO supplier_transactions (supplier_id, date, type, amount, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(supplierId, todayStr, type, amt, description || `Farmer payment/deduction (${type})`);
    });

    tx();
    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId);
    res.json({ message: 'Payment recorded successfully', supplier: updated });
  } catch (error) {
    console.error('Error recording supplier payout:', error);
    res.status(500).json({ error: 'Failed to process supplier payout' });
  }
});

// --- 3. MONTHLY CUSTOMER SUBSCRIPTIONS & NAGHA REGISTER ---
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY id ASC').all();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const {
      id,
      account_no,
      name,
      phone,
      address,
      morning_quota_litres = 0,
      evening_quota_litres = 0,
      milk_type = 'buffalo',
      custom_rate = 220,
      current_balance = 0
    } = req.body;

    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    if (id) {
      db.prepare(`
        UPDATE customers 
        SET name = ?, phone = ?, address = ?, morning_quota_litres = ?, evening_quota_litres = ?, milk_type = ?, custom_rate = ?, current_balance = ?
        WHERE id = ?
      `).run(name, phone, address, morning_quota_litres, evening_quota_litres, milk_type, custom_rate, current_balance, id);
      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return res.json({ message: 'Customer updated', customer: updated });
    } else {
      const generatedAcc = account_no || `MK-${String(Date.now()).slice(-4)}`;
      const result = db.prepare(`
        INSERT INTO customers (account_no, name, phone, address, morning_quota_litres, evening_quota_litres, milk_type, custom_rate, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(generatedAcc, name, phone, address, morning_quota_litres, evening_quota_litres, milk_type, custom_rate, current_balance);
      const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
      return res.json({ message: 'Customer created', customer: created });
    }
  } catch (error) {
    console.error('Error saving customer:', error);
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

app.get('/api/subscriptions/daily', (req, res) => {
  try {
    const { date, shift_type = 'morning' } = req.query;
    const queryDate = date || new Date().toISOString().substring(0, 10);

    const customers = db.prepare('SELECT * FROM customers WHERE is_active = 1 ORDER BY id ASC').all();
    const logs = db.prepare(`
      SELECT * FROM subscription_daily_logs WHERE log_date = ? AND shift_type = ?
    `).all(queryDate, shift_type);

    const logMap = {};
    for (const l of logs) {
      logMap[l.customer_id] = l;
    }

    const roster = customers.map((c) => {
      const scheduled = shift_type === 'morning' ? c.morning_quota_litres : c.evening_quota_litres;
      const log = logMap[c.id];
      return {
        customer_id: c.id,
        account_no: c.account_no,
        customer_name: c.name,
        phone: c.phone,
        address: c.address,
        milk_type: c.milk_type,
        custom_rate: c.custom_rate,
        scheduled_litres: scheduled,
        delivered_litres: log ? log.delivered_litres : scheduled,
        is_nagha: log ? log.is_nagha : 0,
        extra_litres: log ? log.extra_litres : 0,
        total_charge: log ? log.total_charge : Number((scheduled * c.custom_rate).toFixed(2)),
        notes: log ? log.notes : '',
        logged: !!log
      };
    });

    res.json({ date: queryDate, shift_type, roster });
  } catch (error) {
    console.error('Error fetching subscription daily roster:', error);
    res.status(500).json({ error: 'Failed to fetch subscription roster' });
  }
});

app.post('/api/subscriptions/mark-delivery', (req, res) => {
  try {
    const {
      customer_id,
      log_date,
      shift_type = 'morning',
      delivered_litres,
      is_nagha = 0,
      extra_litres = 0,
      notes = ''
    } = req.body;

    const queryDate = log_date || new Date().toISOString().substring(0, 10);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const scheduled = shift_type === 'morning' ? customer.morning_quota_litres : customer.evening_quota_litres;
    const finalDelivered = is_nagha ? 0 : parseFloat(delivered_litres || scheduled) + parseFloat(extra_litres || 0);
    const rate = customer.custom_rate;
    const totalCharge = Number((finalDelivered * rate).toFixed(2));

    const tx = db.transaction(() => {
      const existing = db.prepare(`
        SELECT * FROM subscription_daily_logs WHERE customer_id = ? AND log_date = ? AND shift_type = ?
      `).get(customer_id, queryDate, shift_type);

      const prevCharge = existing ? existing.total_charge : 0;
      const prevDelivered = existing ? existing.delivered_litres : 0;
      const chargeDiff = totalCharge - prevCharge;
      const stockDiff = finalDelivered - prevDelivered;

      db.prepare(`
        INSERT INTO subscription_daily_logs (
          customer_id, log_date, shift_type, scheduled_litres, delivered_litres,
          is_nagha, extra_litres, unit_rate, total_charge, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(customer_id, log_date, shift_type) DO UPDATE SET
          delivered_litres = excluded.delivered_litres,
          is_nagha = excluded.is_nagha,
          extra_litres = excluded.extra_litres,
          unit_rate = excluded.unit_rate,
          total_charge = excluded.total_charge,
          notes = excluded.notes
      `).run(customer_id, queryDate, shift_type, scheduled, finalDelivered, is_nagha, extra_litres, rate, totalCharge, notes);

      if (chargeDiff !== 0) {
        db.prepare('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?').run(chargeDiff, customer_id);
      }

      if (stockDiff !== 0) {
        const targetCode = customer.milk_type === 'cow' ? 'GM-02' : 'GM-01';
        db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE code = ?').run(stockDiff, targetCode);
      }
    });

    tx();
    const updatedCust = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    res.json({ message: 'Delivery status marked', customer: updatedCust, total_charge: totalCharge });
  } catch (error) {
    console.error('Error marking delivery:', error);
    res.status(500).json({ error: 'Failed to record subscription status' });
  }
});

app.get('/api/customers/:id/statement', (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const logs = db.prepare(`
      SELECT * FROM subscription_daily_logs WHERE customer_id = ? ORDER BY log_date ASC
    `).all(customerId);

    const payments = db.prepare(`
      SELECT * FROM customer_transactions WHERE customer_id = ? ORDER BY date ASC
    `).all(customerId);

    const totalLitres = logs.reduce((acc, l) => acc + l.delivered_litres, 0);
    const totalBilled = logs.reduce((acc, l) => acc + l.total_charge, 0);
    const totalNaghas = logs.filter((l) => l.is_nagha === 1).length;
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    const whatsappText = `🥛 *گجر ملک شاپ (Gujjar Milk)*
محترم گاہک: ${customer.name}
کھاتہ نمبر: ${customer.account_no}
----------------------------------------
کل سپلائی شدہ دودھ: ${totalLitres.toFixed(1)} لیٹر
ناغہ کی تعداد: ${totalNaghas} دن
کل بل: Rs. ${totalBilled.toLocaleString()}
سابقہ بقایا / ادھار: Rs. ${customer.current_balance.toLocaleString()}
----------------------------------------
برائے مہربانی اپنا ماہانہ دودھ کا بل ادا فرما کر رسید حاصل کریں۔ شکریہ!
رابطہ: +92 300 8765432`;

    res.json({
      customer,
      summary: {
        totalLitres,
        totalBilled,
        totalNaghas,
        totalPaid,
        currentBalance: customer.current_balance
      },
      logs,
      payments,
      whatsappText,
      whatsappUrl: `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappText)}`
    });
  } catch (error) {
    console.error('Error fetching customer statement:', error);
    res.status(500).json({ error: 'Failed to generate statement' });
  }
});

app.post('/api/customers/:id/payment', (req, res) => {
  try {
    const customerId = req.params.id;
    const { amount, description = 'Cash payment received' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid payment amount required' });

    const amt = parseFloat(amount);
    const todayStr = new Date().toISOString().substring(0, 10);

    const tx = db.transaction(() => {
      db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE id = ?').run(amt, customerId);
      db.prepare(`
        INSERT INTO customer_transactions (customer_id, date, type, amount, description)
        VALUES (?, ?, 'cash_payment', ?, ?)
      `).run(customerId, todayStr, amt, description);
    });

    tx();
    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    res.json({ message: 'Customer payment recorded', customer: updated });
  } catch (error) {
    console.error('Error recording customer payment:', error);
    res.status(500).json({ error: 'Failed to record customer payment' });
  }
});

// --- 4. DAIRY BATCH PROCESSING & SPOILAGE CONVERSION ---
app.get('/api/processing/batches', (req, res) => {
  try {
    const batches = db.prepare('SELECT * FROM processing_batches ORDER BY id DESC LIMIT 50').all();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching processing batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

app.post('/api/processing/batches', (req, res) => {
  try {
    const {
      source_milk_type = 'buffalo',
      source_litres,
      target_product_code,
      target_product_name,
      target_quantity_produced,
      target_unit,
      spoilage_litres = 0,
      notes = '',
      created_by = 'Head Dairyman'
    } = req.body;

    if (!source_litres || !target_product_code || !target_quantity_produced) {
      return res.status(400).json({ error: 'Source milk litres, target product code, and quantity produced are required.' });
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShift = db.prepare("SELECT id FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
    const shift_id = activeShift ? activeShift.id : null;

    const srcQty = parseFloat(source_litres);
    const targetQty = parseFloat(target_quantity_produced);
    const spoilQty = parseFloat(spoilage_litres) || 0;

    const tx = db.transaction(() => {
      const ins = db.prepare(`
        INSERT INTO processing_batches (
          shift_id, batch_date, source_milk_type, source_litres,
          target_product_code, target_product_name, target_quantity_produced, target_unit,
          spoilage_litres, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shift_id,
        todayStr,
        source_milk_type,
        srcQty,
        target_product_code,
        target_product_name,
        targetQty,
        target_unit,
        spoilQty,
        notes,
        created_by
      );

      // Deduct raw milk stock from counter
      const rawMilkCode = source_milk_type === 'cow' ? 'GM-02' : 'GM-01';
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE code = ?').run(srcQty, rawMilkCode);

      // Add finished product stock to catalog
      db.prepare('UPDATE products SET stock = stock + ? WHERE code = ?').run(targetQty, target_product_code);

      return ins.lastInsertRowid;
    });

    const batchId = tx();
    const createdBatch = db.prepare('SELECT * FROM processing_batches WHERE id = ?').get(batchId);
    res.json({ message: 'Dairy processing batch recorded and stock updated', batch: createdBatch });
  } catch (error) {
    console.error('Error creating processing batch:', error);
    res.status(500).json({ error: 'Failed to record processing batch' });
  }
});

// --- 5. DAY-END MILK LITRE BALANCING (دودھ کا میزان) ---
app.get('/api/reconciliation/today', (req, res) => {
  try {
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1").get() || {
      id: 1,
      opening_cash: 15000,
      opening_milk_chiller: 120,
      shift_type: 'morning',
      cashier_name: 'Muhammad Bilal'
    };

    const intakeStats = db.prepare(`
      SELECT 
        COALESCE(SUM(quantity_litres), 0) as total_litres,
        COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity_litres ELSE 0 END), 0) as buffalo_litres,
        COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity_litres ELSE 0 END), 0) as cow_litres,
        COALESCE(SUM(total_amount), 0) as total_cost
      FROM milk_procurement WHERE entry_date = ?
    `).get(todayStr);

    const counterStats = db.prepare(`
      SELECT 
        COALESCE(SUM(si.quantity), 0) as total_litres,
        COALESCE(SUM(CASE WHEN si.product_id = 1 THEN si.quantity ELSE 0 END), 0) as buffalo_litres,
        COALESCE(SUM(CASE WHEN si.product_id = 2 THEN si.quantity ELSE 0 END), 0) as cow_litres,
        COALESCE(SUM(si.total_price), 0) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.is_voided = 0 AND date(s.created_at, 'localtime') = ? AND si.unit = 'Litre'
    `).get(todayStr);

    const subStats = db.prepare(`
      SELECT 
        COALESCE(SUM(delivered_litres), 0) as total_litres,
        COALESCE(SUM(total_charge), 0) as total_billed
      FROM subscription_daily_logs WHERE log_date = ?
    `).get(todayStr);

    const processStats = db.prepare(`
      SELECT 
        COALESCE(SUM(source_litres), 0) as total_converted,
        COALESCE(SUM(spoilage_litres), 0) as total_spoilage
      FROM processing_batches WHERE batch_date = ?
    `).get(todayStr);

    const currentStock = db.prepare(`
      SELECT code, name_en, stock FROM products WHERE code IN ('GM-01', 'GM-02')
    `).all();

    const openingChiller = activeShift.opening_milk_chiller;
    const totalInflow = openingChiller + intakeStats.total_litres;
    const totalOutflow = counterStats.total_litres + subStats.total_litres + processStats.total_converted + processStats.total_spoilage;
    const expectedClosingChiller = Number((totalInflow - totalOutflow).toFixed(2));

    const salesSummary = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method != 'Cash' THEN total_amount ELSE 0 END), 0) as digital_sales,
        COALESCE(SUM(total_amount), 0) as total_sales
      FROM sales WHERE is_voided = 0 AND date(created_at, 'localtime') = ?
    `).get(todayStr);

    const payoutsSummary = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total_cash_payouts
      FROM milk_procurement WHERE entry_date = ? AND payment_status = 'cash_paid'
    `).get(todayStr);

    const expectedDrawerCash = Number((activeShift.opening_cash + salesSummary.cash_sales - payoutsSummary.total_cash_payouts).toFixed(2));

    res.json({
      date: todayStr,
      shift: activeShift,
      milkBalancing: {
        openingChiller,
        intakeTotal: intakeStats.total_litres,
        intakeBuffalo: intakeStats.buffalo_litres,
        intakeCow: intakeStats.cow_litres,
        counterSold: counterStats.total_litres,
        subscriptionsDelivered: subStats.total_litres,
        byProductsProcessed: processStats.total_converted,
        spoilageLoss: processStats.total_spoilage,
        totalInflow,
        totalOutflow,
        expectedClosingChiller,
        currentStock
      },
      cashBalancing: {
        openingCash: activeShift.opening_cash,
        cashSales: salesSummary.cash_sales,
        digitalSales: salesSummary.digital_sales,
        totalSales: salesSummary.total_sales,
        gawalaCashPayouts: payoutsSummary.total_cash_payouts,
        expectedDrawerCash
      }
    });
  } catch (error) {
    console.error('Error generating reconciliation today:', error);
    res.status(500).json({ error: 'Failed to generate reconciliation' });
  }
});

// Fallback catch-all for SPA in Express 5
app.use((req, res) => {
  const indexHtml = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.json({
      message: 'Gujjar Milk API running. Start the client dev server or build the frontend with `npm run build`.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🥛 Gujjar Milk (گجر ملک شاپ) Backend Server`);
  console.log(`⚡ Running at: http://localhost:${PORT}`);
  console.log(`🚀 API Base:   http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
