import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  Ban, 
  FileSpreadsheet, 
  Calendar, 
  CreditCard,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Banknote,
  Milk,
  Clock,
  Sparkles
} from 'lucide-react';
import { fetchSales, voidSale, fetchReportsSummary } from '../../services/api';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { playBeep, playSuccess } from '../../utils/sound';

export default function SalesView({
  settings,
  soundEnabled,
  lang,
  onViewReceipt,
  onSalesUpdated
}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('all'); // 'today', 'yesterday', 'week', 'month', 'all'
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dailyStats, setDailyStats] = useState({
    today_revenue: 0,
    cash_in_drawer: 0,
    milk_litres_sold_today: 0,
    today_orders: 0
  });

  const currency = settings.currency || 'Rs';

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, summaryData] = await Promise.all([
        fetchSales({
          period,
          search: searchQuery,
          paymentMethod: paymentFilter,
        }),
        fetchReportsSummary().catch(() => null)
      ]);

      setSales(salesData || []);
      if (summaryData?.today) {
        setDailyStats({
          today_revenue: summaryData.today.today_revenue || 0,
          cash_in_drawer: summaryData.today.cash_in_drawer || 0,
          milk_litres_sold_today: summaryData.today.milk_litres_sold_today || 0,
          today_orders: summaryData.today.today_orders || 0
        });
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleVoidInvoice = async (sale) => {
    if (sale.is_voided) return;
    if (
      window.confirm(
        `Are you sure you want to VOID invoice ${sale.invoice_no}?\n\nThis will restore the purchased dairy quantities back into inventory stock.`
      )
    ) {
      try {
        await voidSale(sale.id);
        playBeep(soundEnabled);
        await loadData();
        if (onSalesUpdated) onSalesUpdated();
      } catch (err) {
        alert('Failed to void invoice: ' + err.message);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    playSuccess(soundEnabled);
    if (sales.length === 0) {
      alert('No sales data to export.');
      return;
    }

    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Cashier', 'Payment Method', 'Subtotal', 'Discount', 'Tax', 'Grand Total', 'Cash Paid', 'Change'];
    const rows = sales.map((s) => [
      `"${s.invoice_no}"`,
      `"${new Date(s.created_at).toLocaleString()}"`,
      `"${s.customer_name || 'Walk-in'}"`,
      `"${s.customer_phone || ''}"`,
      `"${s.cashier_name || ''}"`,
      `"${s.payment_method}"`,
      s.subtotal,
      s.discount_amount,
      s.tax_amount,
      s.total_amount,
      s.cash_paid,
      s.change_returned,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gujjar_Milk_Sales_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredVolume = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-[#F8FAFC]">
      
      {/* DAILY SUMMARY BANNER (Section 4 Requirement) */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              {lang === 'ur' ? 'سیلز آرکائیو و انوائس ریکارڈز' : 'Sales Archive & Invoices'}
            </h1>
            <p className="text-xs text-slate-400">
              Complete archive of dairy transactions, instant reprint, PDF download, and daily drawer tally.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs"
              title="Refresh Sales"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Total Sales (PKR), Cash in Drawer, and Total Milk Litres sold today */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Total Sales Today */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Sales Today
              </span>
              <div className="font-heading font-black text-2xl text-slate-900">
                {currency} {Number(dailyStats.today_revenue).toLocaleString()}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {dailyStats.today_orders} orders recorded
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Cash in Drawer Today */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Cash in Drawer
              </span>
              <div className="font-heading font-black text-2xl text-emerald-600">
                {currency} {Number(dailyStats.cash_in_drawer).toLocaleString()}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Physical drawer balance
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Total Milk Litres Sold Today */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Milk Litres Sold Today
              </span>
              <div className="font-heading font-black text-2xl text-slate-900">
                {dailyStats.milk_litres_sold_today} <span className="text-base font-bold text-slate-500">Litres</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Buffalo & Cow Milk combined
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Milk className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-2xs">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice # (e.g. GM-2026-0001) or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-all"
          />
        </form>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All History' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                period === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Bank Card</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Breakdown</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No sales records found.</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Invoice No */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.invoice_no}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div>{new Date(sale.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div>{sale.customer_name || 'Walk-in Customer'}</div>
                        {sale.customer_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{sale.customer_phone}</div>
                        )}
                      </td>

                      {/* Items Breakdown */}
                      <td className="py-3 px-4 text-slate-600 max-w-[220px]">
                        <div className="line-clamp-1 font-medium">
                          {(sale.items || []).map((it) => `${it.quantity} ${it.unit} ${it.product_name_en}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sale.items_count || (sale.items ? sale.items.length : 1)} item(s)
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {sale.payment_method}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {currency} {Number(sale.total_amount).toLocaleString()}
                      </td>

                      {/* Actions: View / Reprint, Download PDF, Void */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reprint / View Bill */}
                          <button
                            type="button"
                            onClick={() => {
                              playBeep(soundEnabled);
                              if (onViewReceipt) onViewReceipt(sale);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors"
                            title="Reprint / View Thermal Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF directly */}
                          <button
                            type="button"
                            onClick={() => {
                              playSuccess(soundEnabled);
                              generateReceiptPDF(sale, settings);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 transition-colors"
                            title="Download PDF Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Void invoice */}
                          <button
                            type="button"
                            onClick={() => handleVoidInvoice(sale)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-400 transition-colors"
                            title="Void invoice & restore inventory"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
