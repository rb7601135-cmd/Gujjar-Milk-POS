import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  User, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Languages, 
  Menu, 
  Milk,
  Search,
  Command,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Navbar({
  settings,
  todayStats,
  soundEnabled,
  setSoundEnabled,
  lang,
  setLang,
  sidebarOpen,
  setSidebarOpen,
  onOpenReports,
  searchQuery,
  setSearchQuery,
  onSelectPOS
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Live active clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Global hotkey: Ctrl + K or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is already typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || e.key === '/') {
        e.preventDefault();
        if (onSelectPOS) onSelectPOS();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectPOS]);

  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });

  const formattedDate = currentTime.toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const currency = settings.currency || 'Rs';
  const todayRevenue = todayStats?.today_revenue ? Number(todayStats.today_revenue).toLocaleString() : '0';
  const todayOrders = todayStats?.today_orders || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between px-2.5 sm:px-6 py-2 sm:py-2.5 gap-1.5 sm:gap-4">
        {/* Left: Mobile Toggle & High-End Dairy Branding */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <button 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 lg:hidden"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none" onClick={onSelectPOS}>
            {/* Pure Milk Icon Badge */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 transition-transform active:scale-95 group">
              <Milk className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            </div>

            <div>
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="font-heading font-extrabold text-sm sm:text-xl tracking-tight text-slate-900 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-none">
                  {settings.shop_name?.split('(')[0]?.trim() || 'Gujjar Milk'}
                </span>
                <span className="font-urdu text-[11px] sm:text-sm font-bold text-emerald-600">
                  گجر ملک
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 -mt-0.5 hidden md:block">
                Pure & Fresh Dairy • 100% Khales Guarantee
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Quick-Search Input with Hotkey Ctrl+K (Desktop/Tablet) */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery || ''}
              onChange={(e) => {
                if (onSelectPOS) onSelectPOS();
                setSearchQuery(e.target.value);
              }}
              placeholder={lang === 'ur' ? 'اشیاء تلاش کریں (مثلاً دودھ، دیسی گھی، لسی)...' : 'Search dairy items, milk, ghee, sweets...'}
              className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/90 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 transition-all outline-none"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Mobile Search Toggle, Today Revenue Badge & Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              if (onSelectPOS) onSelectPOS();
            }}
            className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Search products"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          {/* Live Clock & Shift Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="font-mono font-bold tracking-tight text-slate-800">{formattedTime}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{formattedDate}</span>
          </div>

          {/* Cashier Shift Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700 max-w-[100px] truncate" title={settings.cashier_name || 'Muhammad Bilal'}>
              {settings.cashier_name || 'Muhammad Bilal'}
            </span>
          </div>

          {/* Today's Revenue Pill Badge */}
          <button
            type="button"
            onClick={onOpenReports}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all active:scale-95 shadow-2xs group"
            title="Click to view full daily sales analytics"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-emerald-600 leading-none">
                {lang === 'ur' ? 'آج کی سیلز' : "Today's Sales"}
              </span>
              <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                {currency} {todayRevenue}
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-amber-50 text-amber-700 border-amber-200/70 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={soundEnabled ? 'Terminal Audio Enabled' : 'Terminal Audio Muted'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Language Toggle (English / اردو) */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
            title="Switch Language: English / اردو"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-2.5 pt-1 border-t border-slate-100 bg-slate-50/90 animate-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery || ''}
              onChange={(e) => {
                if (onSelectPOS) onSelectPOS();
                setSearchQuery(e.target.value);
              }}
              placeholder={lang === 'ur' ? 'اشیاء تلاش کریں (مثلاً دودھ، دیسی گھی)...' : 'Search dairy products, milk, sweets...'}
              className="w-full pl-9 pr-8 py-2 bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
