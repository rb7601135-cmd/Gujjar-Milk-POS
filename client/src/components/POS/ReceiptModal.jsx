import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Receipt,
  Sparkles,
  Milk,
  Share2,
  QrCode
} from 'lucide-react';
import { generateReceiptPDF, generateA4InvoicePDF } from '../../utils/pdfGenerator';

export default function ReceiptModal({
  isOpen,
  onClose,
  sale,
  settings,
  onNewOrder
}) {
  const [viewMode, setViewMode] = useState('thermal'); // 'thermal' or 'a4'

  if (!isOpen || !sale) return null;

  const currency = settings.currency || 'Rs';
  const items = sale.items || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (viewMode === 'a4') {
      generateA4InvoicePDF(sale, settings);
    } else {
      generateReceiptPDF(sale, settings);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900">
                  Receipt #{sale.invoice_no}
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Paid
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {new Date(sale.created_at || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector: Thermal 80mm vs A4 format */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">Format Preview:</span>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('thermal')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                viewMode === 'thermal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal (80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('a4')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                viewMode === 'a4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>
          </div>
        </div>

        {/* Receipt Slip Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100 flex justify-center">
          {/* Authentic 80mm Thermal Slip Card */}
          <div className="w-full max-w-[310px] bg-white p-5 rounded-xl shadow-md border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
            
            {/* Shop Header */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Milk className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                {settings.shop_name?.split('(')[0]?.trim() || 'GUJJAR MILK'}
              </h2>
              <div className="font-urdu text-sm font-bold text-emerald-700">
                {settings.shop_name_ur || 'گجر ملک شاپ'}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {settings.tagline || 'Pure & Fresh Dairy Products — 100% Khales Guarantee'}
              </p>
              <p className="text-[10px] text-slate-400">
                {settings.address || 'Shop #12, Main Dairy Market, G.T Road'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">
                Tel: {settings.phone || '+92 300 8765432'}
              </p>
            </div>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Invoice Metadata */}
            <div className="text-[11px] space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>Invoice No:</span>
                <span className="font-bold text-slate-900">{sale.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{new Date(sale.created_at || Date.now()).toLocaleDateString()} {new Date(sale.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashier_name || 'Muhammad Bilal'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium text-slate-900">{sale.customer_name || 'Walk-in Customer'}</span>
              </div>
              {sale.customer_phone && (
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Phone:</span>
                  <span>{sale.customer_phone}</span>
                </div>
              )}
            </div>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Items Table */}
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-dashed border-slate-400 text-slate-900 font-bold">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Rate</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1 pr-1">
                      <div className="font-medium text-slate-900 truncate max-w-[110px]">
                        {it.name_en || it.product_name_en}
                      </div>
                      <div className="font-urdu text-[10px] text-amber-600 truncate max-w-[110px]">
                        {it.name_ur || it.product_name_ur}
                      </div>
                    </td>
                    <td className="py-1 text-center whitespace-nowrap">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {Number(it.price || it.unit_price).toFixed(0)}
                    </td>
                    <td className="py-1 text-right font-mono font-bold text-slate-900">
                      {Number(it.total || it.total_price).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Financial Calculations */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{currency} {Number(sale.subtotal).toFixed(0)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono">-{currency} {Number(sale.discount_amount).toFixed(0)}</span>
                </div>
              )}
              {sale.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({sale.tax_rate}%):</span>
                  <span className="font-mono">{currency} {Number(sale.tax_amount).toFixed(0)}</span>
                </div>
              )}

              {/* Bold Grand Total in bold PKR / Rs. */}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="font-mono text-emerald-600">
                  {currency} {Number(sale.total_amount).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-300 my-2" />

            {/* Payment Details */}
            <div className="text-[10px] space-y-0.5 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900">{sale.payment_method || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span className="font-mono">{currency} {Number(sale.cash_paid || sale.total_amount).toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Change Returned:</span>
                <span className="font-mono">{currency} {Number(sale.change_returned || 0).toFixed(0)}</span>
              </div>
            </div>

            {/* Barcode & QR Code Mockup */}
            <div className="pt-2 text-center border-t border-dashed border-slate-300">
              <div className="flex justify-center items-center gap-0.5 h-6 opacity-85">
                {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,3,1,2,4,1,2].map((w, i) => (
                  <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <div className="text-[9px] tracking-widest text-slate-400 mt-1 font-mono">
                * {sale.invoice_no} *
              </div>
            </div>

            {/* Thank you note */}
            <div className="text-center text-[10px] text-slate-600 pt-1 space-y-1">
              <p className="font-medium">
                {settings.footer_note || 'Thank you for buying pure! 100% Khales Guarantee.'}
              </p>
              <p className="font-urdu font-bold text-emerald-700">
                جزاک اللہ خیراً و تشریف آوری کا شکریہ
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewOrder || onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors order-3 sm:order-1 text-center"
          >
            New Order
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
