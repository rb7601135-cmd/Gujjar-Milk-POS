import { jsPDF } from 'jspdf';

/**
 * Generates an 80mm POS thermal receipt PDF
 */
export function generateReceiptPDF(sale, settings = {}) {
  const currency = settings.currency || 'Rs';
  const shopName = settings.shop_name || 'GUJJAR MILK';
  const shopUrdu = settings.shop_name_ur || 'گجر ملک شاپ';
  const tagline = settings.tagline || 'Pure & Fresh Dairy Products — 100% Khales';
  const address = settings.address || 'Main Dairy Market, Gate #4, G.T Road';
  const phone = settings.phone || '+92 300 8765432';
  const footerNote = settings.footer_note || 'Thank you for visiting Gujjar Milk! Pure quality guaranteed.';

  // Calculate dynamic receipt height based on items count
  const items = sale.items || [];
  const baseHeight = 160;
  const itemHeight = 9;
  const totalHeight = Math.max(180, baseHeight + items.length * itemHeight);

  // 80mm thermal receipt paper width
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, totalHeight],
  });

  const pageWidth = 80;
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(shopName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(tagline, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(address, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Phone: ${phone}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Invoice & Customer Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #: ${sale.invoice_no}`, 5, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  const dateFormatted = new Date(sale.created_at || Date.now()).toLocaleString();
  doc.text(`Date: ${dateFormatted}`, 5, y);
  y += 4;
  doc.text(`Cashier: ${sale.cashier_name || 'Muhammad Bilal'}`, 5, y);
  y += 4;
  doc.text(`Customer: ${sale.customer_name || 'Walk-in Customer'}`, 5, y);
  if (sale.customer_phone) {
    y += 4;
    doc.text(`Phone: ${sale.customer_phone}`, 5, y);
  }
  y += 4;

  // Divider
  doc.line(5, y, 75, y);
  y += 5;

  // Items Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEM', 5, y);
  doc.text('QTY', 44, y, { align: 'right' });
  doc.text('RATE', 58, y, { align: 'right' });
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 2.5;
  doc.line(5, y, 75, y);
  y += 4;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item) => {
    const itemName = item.name_en || item.product_name_en || 'Dairy Item';
    // Truncate if long
    const displayName = itemName.length > 20 ? itemName.substring(0, 18) + '..' : itemName;
    const qtyStr = `${item.quantity} ${item.unit || ''}`;
    const rateStr = `${Number(item.price || item.unit_price).toFixed(0)}`;
    const lineTotalStr = `${Number(item.total || item.total_price).toFixed(0)}`;

    doc.text(displayName, 5, y);
    doc.text(qtyStr, 44, y, { align: 'right' });
    doc.text(rateStr, 58, y, { align: 'right' });
    doc.text(lineTotalStr, 75, y, { align: 'right' });
    y += 4.5;
  });

  // Divider
  doc.line(5, y, 75, y);
  y += 4.5;

  // Calculations
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', 40, y);
  doc.text(`${currency} ${Number(sale.subtotal).toFixed(0)}`, 75, y, { align: 'right' });
  y += 4;

  if (sale.discount_amount > 0) {
    doc.text('Discount:', 40, y);
    doc.text(`-${currency} ${Number(sale.discount_amount).toFixed(0)}`, 75, y, { align: 'right' });
    y += 4;
  }

  if (sale.tax_amount > 0) {
    doc.text(`Tax (${sale.tax_rate}%):`, 40, y);
    doc.text(`${currency} ${Number(sale.tax_amount).toFixed(0)}`, 75, y, { align: 'right' });
    y += 4;
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GRAND TOTAL:', 35, y);
  doc.text(`${currency} ${Number(sale.total_amount).toFixed(0)}`, 75, y, { align: 'right' });
  y += 5;

  doc.setLineDashPattern([], 0);
  doc.line(5, y, 75, y);
  y += 4.5;

  // Payment Breakdown
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode:`, 5, y);
  doc.text(`${sale.payment_method || 'Cash'}`, 75, y, { align: 'right' });
  y += 4;

  if (sale.payment_method === 'Cash' || sale.cash_paid > 0) {
    doc.text(`Cash Tendered:`, 5, y);
    doc.text(`${currency} ${Number(sale.cash_paid || sale.total_amount).toFixed(0)}`, 75, y, { align: 'right' });
    y += 4;

    doc.text(`Change Returned:`, 5, y);
    doc.text(`${currency} ${Number(sale.change_returned || 0).toFixed(0)}`, 75, y, { align: 'right' });
    y += 4.5;
  }

  // Barcode / Verification line simulation
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 5;

  // Barcode visual representation
  const barcodeY = y;
  const barcodeX = 18;
  const barcodeW = 44;
  for (let i = 0; i < 40; i++) {
    const xPos = barcodeX + (i * (barcodeW / 40));
    const isThick = (i % 3 === 0 || i % 7 === 0);
    doc.setLineWidth(isThick ? 0.6 : 0.25);
    doc.line(xPos, barcodeY, xPos, barcodeY + 6);
  }
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`* ${sale.invoice_no} *`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Footer Greeting
  doc.setFontSize(7);
  doc.text(footerNote, pageWidth / 2, y, { align: 'center', maxWidth: 70 });
  y += 4;
  doc.text('گجر ملک شاپ — خالص دودھ و دیسی ڈیری', pageWidth / 2, y, { align: 'center' });

  // Save/Download
  doc.save(`${sale.invoice_no}_thermal_receipt.pdf`);
}

/**
 * Generates a full standard A4 invoice PDF
 */
export function generateA4InvoicePDF(sale, settings = {}) {
  const currency = settings.currency || 'Rs';
  const shopName = settings.shop_name || 'GUJJAR MILK (گجر ملک شاپ)';
  const tagline = settings.tagline || 'Pure & Fresh Dairy Products — 100% Khales Guarantee';
  const address = settings.address || 'Shop #12, Main Dairy Market, Gate #4, G.T Road';
  const phone = settings.phone || '+92 300 8765432';
  const footerNote = settings.footer_note || 'Thank you for visiting Gujjar Milk! Pure quality guaranteed.';

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;

  // Top Accent Banner (Pasture Green)
  doc.setFillColor(30, 81, 40); // #1E5128
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent bar
  doc.setFillColor(229, 169, 60); // #E5A93C
  doc.rect(0, 28, pageWidth, 3, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GUJJAR MILK (گجر ملک شاپ)', 15, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Pure Dairy & Fresh Products', 15, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE', pageWidth - 15, 17, { align: 'right' });

  // Reset text color
  doc.setTextColor(31, 41, 55);

  let y = 42;

  // Shop Details & Invoice Metadata
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(tagline, 15, y);
  y += 5;
  doc.text(`Address: ${address}`, 15, y);
  y += 5;
  doc.text(`Contact: ${phone}`, 15, y);

  // Metadata block (Right side)
  const metaY = 42;
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No:`, 140, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.invoice_no}`, 170, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date & Time:`, 140, metaY + 5);
  doc.setFont('helvetica', 'normal');
  const dateFormatted = new Date(sale.created_at || Date.now()).toLocaleString();
  doc.text(`${dateFormatted}`, 170, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Cashier:`, 140, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.cashier_name || 'Muhammad Bilal'}`, 170, metaY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Mode:`, 140, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.payment_method || 'Cash'}`, 170, metaY + 15);

  y += 10;

  // Bill To Box
  doc.setFillColor(248, 246, 240);
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('BILLED TO (CUSTOMER):', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const custText = `${sale.customer_name || 'Walk-in Customer'} ${sale.customer_phone ? `(${sale.customer_phone})` : ''}`;
  doc.text(custText, 20, y + 11.5);

  y += 24;

  // Table Header
  doc.setFillColor(30, 81, 40);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('#', 20, y + 5.5);
  doc.text('ITEM DESCRIPTION', 32, y + 5.5);
  doc.text('UNIT', 105, y + 5.5);
  doc.text('QTY', 125, y + 5.5, { align: 'right' });
  doc.text('UNIT RATE', 155, y + 5.5, { align: 'right' });
  doc.text('TOTAL', pageWidth - 20, y + 5.5, { align: 'right' });

  y += 8;
  doc.setTextColor(31, 41, 55);

  // Table Rows
  const items = sale.items || [];
  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(252, 252, 250);
      doc.rect(15, y, pageWidth - 30, 7.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${index + 1}`, 20, y + 5);

    const name = item.name_en || item.product_name_en || 'Item';
    doc.text(name, 32, y + 5);
    doc.text(`${item.unit || ''}`, 105, y + 5);
    doc.text(`${item.quantity}`, 125, y + 5, { align: 'right' });
    doc.text(`${currency} ${Number(item.price || item.unit_price).toFixed(0)}`, 155, y + 5, { align: 'right' });
    doc.text(`${currency} ${Number(item.total || item.total_price).toFixed(0)}`, pageWidth - 20, y + 5, { align: 'right' });

    y += 7.5;
  });

  // Table bottom border
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Totals Box (Right aligned)
  const totalX = 130;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', totalX, y);
  doc.text(`${currency} ${Number(sale.subtotal).toFixed(0)}`, pageWidth - 20, y, { align: 'right' });
  y += 6;

  if (sale.discount_amount > 0) {
    doc.text('Discount:', totalX, y);
    doc.text(`-${currency} ${Number(sale.discount_amount).toFixed(0)}`, pageWidth - 20, y, { align: 'right' });
    y += 6;
  }

  if (sale.tax_amount > 0) {
    doc.text(`Sales Tax (${sale.tax_rate}%):`, totalX, y);
    doc.text(`${currency} ${Number(sale.tax_amount).toFixed(0)}`, pageWidth - 20, y, { align: 'right' });
    y += 6;
  }

  // Grand Total Banner
  doc.setFillColor(254, 249, 238); // warm butter gold highlight
  doc.rect(totalX - 5, y - 1, (pageWidth - 15) - (totalX - 5), 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 81, 40);
  doc.text('GRAND TOTAL:', totalX, y + 5.5);
  doc.text(`${currency} ${Number(sale.total_amount).toFixed(0)}`, pageWidth - 20, y + 5.5, { align: 'right' });
  y += 14;

  // Tendered & Change
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cash Paid: ${currency} ${Number(sale.cash_paid || sale.total_amount).toFixed(0)}`, totalX, y);
  doc.text(`Change Due: ${currency} ${Number(sale.change_returned || 0).toFixed(0)}`, pageWidth - 20, y, { align: 'right' });
  y += 18;

  // Footer notes & terms
  doc.setLineDashPattern([1, 1], 0);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text(footerNote, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Dairy items are fresh and quality certified. Please inspect milk and dairy products upon delivery.', pageWidth / 2, y, { align: 'center' });

  // Save/Download
  doc.save(`${sale.invoice_no}_A4_invoice.pdf`);
}
