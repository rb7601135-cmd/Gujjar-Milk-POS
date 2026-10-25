import React from 'react';
import { 
  Calculator, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  Milk,
  Sparkles,
  CircleDot,
  Truck,
  CalendarDays,
  Flame,
  Scale,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  settings,
  lang
}) {
  const navItems = [
    {
      id: 'pos',
      label_en: 'POS Cashier Terminal',
      label_ur: 'کاؤنٹر بلنگ و کیشیر',
      icon: Calculator,
      tag: 'Terminal',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'procurement',
      label_en: 'Gawala Milk Intake',
      label_ur: 'گوالہ و کسان دودھ وصولی',
      icon: Truck,
      tag: 'Intake',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'subscriptions',
      label_en: 'Monthly Milk Cards & Nagha',
      label_ur: 'ماہانہ دودھ کارڈ و ناغہ',
      icon: CalendarDays,
      tag: 'Khata',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'processing',
      label_en: 'Dairy Batch Processing',
      label_ur: 'دودھ پراسیسنگ و دہی',
      icon: Flame,
    },
    {
      id: 'reconciliation',
      label_en: 'Day-End Litre Balancing',
      label_ur: 'دودھ کا میزان و کلوزنگ',
      icon: Scale,
      tag: 'Audit',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'inventory',
      label_en: 'Product Catalog & Inventory',
      label_ur: 'اشیاء و انوینٹری',
      icon: Package,
    },
    {
      id: 'sales',
      label_en: 'Sales Archive & Invoices',
      label_ur: 'سیلز ہسٹری و انوائسز',
      icon: Receipt,
    },
    {
      id: 'reports',
      label_en: 'Business Analytics & Reports',
      label_ur: 'رپورٹس و تجزیات',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label_en: 'Settings & Receipt Configurator',
      label_ur: 'دکان و رسید سیٹنگز',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Modern Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 lg:top-[61px] bottom-0 left-0 z-50 w-72 sm:w-80 lg:w-68 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 shadow-2xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header (Visible only on mobile/tablet) */}
        <div className="lg:hidden p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Milk className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-sm tracking-tight text-white">
                {settings.shop_name?.split('(')[0]?.trim() || 'Gujjar Milk'}
              </div>
              <div className="text-[10px] text-emerald-400 font-urdu font-bold">
                گجر ملک شاپ
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
          <div className="px-3 pt-2 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {lang === 'ur' ? 'مین مینو و نیویگیشن' : 'Commercial Suite'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium text-xs sm:text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25 ring-1 ring-emerald-500/30'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70 group-hover:text-emerald-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={lang === 'ur' ? 'font-urdu text-sm' : 'tracking-tight'}>
                    {lang === 'ur' ? item.label_ur : item.label_en}
                  </span>
                </div>

                {item.tag && !isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                    {item.tag}
                  </span>
                )}

                {isActive && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <ChevronRight className="w-4 h-4 text-emerald-100" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Shift & Terminal Info */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ur' ? 'کاؤنٹر اسٹیٹس' : 'Terminal Status'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Active
            </span>
          </div>

          <div className="text-xs font-bold text-slate-800 truncate">
            {settings.cashier_shift || 'Shift #1 (Morning/Afternoon)'}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="font-mono">POS Terminal #01</span>
            <span className="font-semibold text-emerald-700">SQLite Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
