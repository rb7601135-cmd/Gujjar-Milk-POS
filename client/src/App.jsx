import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import POSView from './components/POS/POSView';
import InventoryView from './components/Inventory/InventoryView';
import SalesView from './components/Sales/SalesView';
import ReportsView from './components/Reports/ReportsView';
import SettingsView from './components/Settings/SettingsView';
import ProcurementView from './components/Procurement/ProcurementView';
import SubscriptionsView from './components/Subscriptions/SubscriptionsView';
import ProcessingView from './components/Processing/ProcessingView';
import ReconciliationView from './components/Reconciliation/ReconciliationView';
import ReceiptModal from './components/POS/ReceiptModal';
import { fetchSettings, fetchProducts, fetchReportsSummary } from './services/api';
import { DEFAULT_PRODUCTS } from './services/defaultData';
import { generateReceiptPDF } from './utils/pdfGenerator';
import { Calculator, Truck, CalendarDays, Receipt, Menu } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [heldCarts, setHeldCarts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [settings, setSettings] = useState({
    shop_name: 'Gujjar Milk (گجر ملک شاپ)',
    shop_name_ur: 'گجر ملک شاپ',
    tagline: 'Pure & Fresh Dairy Products — 100% Khales Guarantee',
    address: 'Shop #12, Main Dairy Market, Near Gate 4, G.T Road',
    phone: '+92 300 8765432 / +92 321 9876543',
    currency: 'Rs',
    default_tax_rate: '0',
    cashier_name: 'Muhammad Bilal',
    cashier_shift: 'Shift #1 (Morning/Afternoon)',
    footer_note: 'Thank you for buying pure! 100% Khales Guarantee. جزاک اللہ خیراً',
    thermal_paper_size: '80mm',
    invoice_prefix: 'GM-2026-',
  });

  const [todayStats, setTodayStats] = useState({
    today_revenue: 0,
    today_orders: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('gm_sound') !== 'false';
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem('gm_lang') || 'en';
  });

  // Receipt Modal State
  const [receiptModalSale, setReceiptModalSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Persistence of sound and language
  useEffect(() => {
    localStorage.setItem('gm_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('gm_lang', lang);
  }, [lang]);

  // Load Settings, Products, and Summary Stats
  const loadInitialData = useCallback(async () => {
    try {
      const [settingsData, productsData, summaryData] = await Promise.all([
        fetchSettings().catch(() => null),
        fetchProducts().catch(() => []),
        fetchReportsSummary().catch(() => null),
      ]);

      if (settingsData && Object.keys(settingsData).length > 0) {
        setSettings((prev) => ({ ...prev, ...settingsData }));
      }
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
      if (summaryData?.today) {
        setTodayStats(summaryData.today);
      }
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh products list
  const handleRefreshProducts = async () => {
    try {
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error('Failed to refresh products:', err);
    }
  };

  // Refresh summary stats
  const handleRefreshStats = async () => {
    try {
      const summary = await fetchReportsSummary();
      if (summary?.today) {
        setTodayStats(summary.today);
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // Handle Checkout Completion
  const handleCheckoutSuccess = (completedSale, directPrint = true, downloadPdfDirectly = false) => {
    // 1. Refresh products stock and today's sales badge
    handleRefreshProducts();
    handleRefreshStats();

    // 2. Open Receipt Modal for visual verification and print
    setReceiptModalSale(completedSale);
    setIsReceiptOpen(true);

    // 3. If direct download was clicked
    if (downloadPdfDirectly) {
      generateReceiptPDF(completedSale, settings);
    }

    // 4. If direct print was requested
    if (directPrint && !downloadPdfDirectly) {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  // View Receipt from Sales Archive
  const handleViewReceipt = (sale) => {
    setReceiptModalSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        todayStats={todayStats}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        lang={lang}
        setLang={setLang}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenReports={() => setActiveTab('reports')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectPOS={() => setActiveTab('pos')}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          settings={settings}
          lang={lang}
        />

        {/* View Routing */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] pb-16 lg:pb-0">
          {activeTab === 'pos' && (
            <POSView
              products={products}
              cart={cart}
              setCart={setCart}
              settings={settings}
              soundEnabled={soundEnabled}
              lang={lang}
              onCheckoutSuccess={handleCheckoutSuccess}
              heldCarts={heldCarts}
              setHeldCarts={setHeldCarts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeTab === 'procurement' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <ProcurementView lang={lang} settings={settings} />
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <SubscriptionsView lang={lang} settings={settings} />
            </div>
          )}

          {activeTab === 'processing' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <ProcessingView lang={lang} settings={settings} />
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <ReconciliationView lang={lang} settings={settings} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              onRefreshProducts={handleRefreshProducts}
              settings={settings}
              soundEnabled={soundEnabled}
              lang={lang}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              settings={settings}
              soundEnabled={soundEnabled}
              lang={lang}
              onViewReceipt={handleViewReceipt}
              onSalesUpdated={() => {
                handleRefreshProducts();
                handleRefreshStats();
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              settings={settings}
              lang={lang}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsSaved={(newSettings) => setSettings(newSettings)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              lang={lang}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for high-speed one-hand cashier access) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all relative ${
            activeTab === 'pos' ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Calculator className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'ur' ? 'کاؤنٹر' : 'POS'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('procurement')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'procurement' ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'ur' ? 'گوالہ' : 'Intake'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'subscriptions' ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'ur' ? 'کارڈز' : 'Cards'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'sales' ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'ur' ? 'سیلز' : 'Sales'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-800 transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {lang === 'ur' ? 'مینو' : 'More'}
          </span>
        </button>
      </nav>

      {/* Receipt Modal (Thermal slip preview, A4 preview, direct print, PDF download) */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={receiptModalSale}
        settings={settings}
        onNewOrder={() => {
          setIsReceiptOpen(false);
          setActiveTab('pos');
        }}
      />

      {/* Hidden Print Container specifically targeted by @media print in index.css */}
      {receiptModalSale && (
        <div id="thermal-print-area" className="hidden">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {settings.shop_name?.split('(')[0]?.trim() || 'GUJJAR MILK'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Noto Nastaliq Urdu' }}>
              {settings.shop_name_ur || 'گجر ملک شاپ'}
            </div>
            <div style={{ fontSize: '9px' }}>{settings.tagline}</div>
            <div style={{ fontSize: '9px' }}>{settings.address}</div>
            <div style={{ fontSize: '9px' }}>Tel: {settings.phone}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontSize: '10px' }}>
            <div><strong>Invoice:</strong> {receiptModalSale.invoice_no}</div>
            <div><strong>Date:</strong> {new Date(receiptModalSale.created_at || Date.now()).toLocaleString()}</div>
            <div><strong>Cashier:</strong> {receiptModalSale.cashier_name || 'Muhammad Bilal'}</div>
            <div><strong>Customer:</strong> {receiptModalSale.customer_name || 'Walk-in'}</div>
            {receiptModalSale.customer_phone && <div><strong>Phone:</strong> {receiptModalSale.customer_phone}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <table style={{ width: '100%', fontSize: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000' }}>
                <th style={{ paddingBottom: '3px' }}>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(receiptModalSale.items || []).map((it, i) => (
                <tr key={i}>
                  <td style={{ padding: '2px 0' }}>
                    <div>{it.name_en || it.product_name_en}</div>
                    <div style={{ fontSize: '8px', color: '#555' }}>{it.name_ur || it.product_name_ur}</div>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{it.quantity} {it.unit}</td>
                  <td style={{ textAlign: 'right' }}>{Number(it.price || it.unit_price).toFixed(0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(it.total || it.total_price).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{settings.currency || 'Rs'} {Number(receiptModalSale.subtotal).toFixed(0)}</span>
            </div>
            {receiptModalSale.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>-{settings.currency || 'Rs'} {Number(receiptModalSale.discount_amount).toFixed(0)}</span>
              </div>
            )}
            {receiptModalSale.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax ({receiptModalSale.tax_rate}%):</span>
                <span>{settings.currency || 'Rs'} {Number(receiptModalSale.tax_amount).toFixed(0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px', marginTop: '3px' }}>
              <span>TOTAL:</span>
              <span>{settings.currency || 'Rs'} {Number(receiptModalSale.total_amount).toFixed(0)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontSize: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Payment Mode:</span>
              <span><strong>{receiptModalSale.payment_method || 'Cash'}</strong></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tendered:</span>
              <span>{settings.currency || 'Rs'} {Number(receiptModalSale.cash_paid || receiptModalSale.total_amount).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Change Returned:</span>
              <span>{settings.currency || 'Rs'} {Number(receiptModalSale.change_returned || 0).toFixed(0)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0 3px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '9px' }}>
            <div>{settings.footer_note || 'Thank you for buying pure! 100% Khales Guarantee.'}</div>
            <div style={{ fontFamily: 'Noto Nastaliq Urdu', marginTop: '2px', fontWeight: 'bold' }}>
              خالص دودھ، دیسی گھی، تازہ دہی و روایتی مٹھائیاں
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
