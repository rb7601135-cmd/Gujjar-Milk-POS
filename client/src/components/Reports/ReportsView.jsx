import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight,
  Milk,
  Award,
  RefreshCw,
  Banknote,
  Package
} from 'lucide-react';
import { fetchReportsSummary } from '../../services/api';

export default function ReportsView({
  settings,
  lang,
  onNavigateToInventory
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = settings.currency || 'Rs';

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await fetchReportsSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load reports summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-61px)] bg-[#F8FAFC]">
        <div className="text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="font-semibold text-sm">Calculating Dairy Analytics & Daily Summary...</p>
        </div>
      </div>
    );
  }

  const {
    today = {},
    yesterday = {},
    allTime = {},
    paymentMethods = [],
    topItems = [],
    last7DaysTrend = [],
    hourlyStats = [],
    lowStockCount = 0,
  } = summary || {};

  // Find max daily revenue for chart scaling
  const maxDayRevenue = Math.max(1, ...(last7DaysTrend || []).map((d) => d.daily_revenue));
  const totalPaymentVol = (paymentMethods || []).reduce((acc, p) => acc + p.total, 0);

  const defaultDairyPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23F8FAFC'%3E%3Crect width='400' height='300' fill='%23F1F5F9'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23DCFCE7'/%3E%3Cpath d='M180 110 h40 v20 h-40 z M170 130 h60 l-10 80 h-40 z' fill='%2316A34A' opacity='0.7'/%3E%3C/svg%3E";

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            {lang === 'ur' ? 'ڈیلی سیلز رپورٹس و تجزیات' : 'Business Analytics & Reports'}
          </h1>
          <p className="text-xs text-slate-400">
            Live revenue breakdown, milk litres dispatched, drawer cash, and best-selling dairy specialties.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSummary}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden card-elevation">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
            {currency} {Number(today?.today_revenue || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1 font-bold">
            <span>{today?.today_orders || 0} bills completed today</span>
          </div>
        </div>

        {/* Card 2: Cash in Drawer */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden card-elevation">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Cash in Drawer</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-600">
            {currency} {Number(today?.cash_in_drawer || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            Cash tender in register
          </div>
        </div>

        {/* Card 3: Milk Litres Sold Today */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden card-elevation">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Milk Litres Sold</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Milk className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
            {today?.milk_litres_sold_today || 0} <span className="text-base font-semibold text-slate-500">Ltr</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            Buffalo & Cow milk volume
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden card-elevation">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Average Bill (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
            {currency} {Number(today?.today_aov || 0).toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            Per transaction average
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: 7-Day Chart & Top Dairy Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">
                Daily Revenue Trend (Last 7 Days)
              </h2>
              <p className="text-xs text-slate-400">Day-by-day sales volume and order numbers.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <BarChart3 className="w-4 h-4" />
              <span>Live Chart</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {(last7DaysTrend || []).map((day, idx) => {
              const heightPct = Math.max(12, Math.round((day.daily_revenue / maxDayRevenue) * 100));
              const dateObj = new Date(day.sale_date);
              const label = dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric' });

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded-md shadow-md text-center pointer-events-none whitespace-nowrap mb-1">
                    <div>{currency} {Number(day.daily_revenue).toLocaleString()}</div>
                    <div className="text-slate-300 font-normal">{day.orders_count} bills</div>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[42px] bg-emerald-600 group-hover:bg-emerald-700 rounded-t-xl transition-all relative overflow-hidden shadow-xs"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Day Label */}
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Peak Day: {currency} {Number(maxDayRevenue).toLocaleString()}</span>
            <span>Total Orders (All Time): {Number(allTime?.total_orders || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Right 1 Col: Payment Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Payment Channels
            </h2>
            <p className="text-xs text-slate-400">Distribution across Cash, EasyPaisa, Card.</p>
          </div>

          <div className="space-y-3 pt-2">
            {(paymentMethods || []).map((method, idx) => {
              const pct = totalPaymentVol > 0 ? Math.round((method.total / totalPaymentVol) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{method.payment_method}</span>
                    <span className="font-mono text-slate-500">
                      {currency} {Number(method.total).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        method.payment_method === 'Cash'
                          ? 'bg-emerald-600'
                          : method.payment_method === 'Card'
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low Stock Callout */}
          {lowStockCount > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-bold">{lowStockCount} items low on stock!</span>
              </div>
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="font-bold text-emerald-700 underline text-[11px]"
              >
                Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Best-Selling Dairy Items */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Top Best-Selling Dairy Specialties
            </h2>
            <p className="text-xs text-slate-400">Ranked by cumulative revenue and quantity dispatched.</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {(topItems || []).map((item, idx) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-3 transition-colors hover:bg-slate-50"
            >
              <div className="relative">
                <img
                  src={item.image_url || defaultDairyPlaceholder}
                  alt={item.name_en}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultDairyPlaceholder;
                  }}
                />
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {item.name_en}
                </div>
                <div className="font-urdu text-[11px] text-amber-600 font-bold truncate">
                  {item.name_ur}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  <span className="font-bold text-emerald-600">{item.total_qty} {item.unit}</span> • {currency} {Number(item.total_sales).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
