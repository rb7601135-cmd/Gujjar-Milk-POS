import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  User, 
  Phone, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  Download, 
  RotateCcw, 
  PauseCircle, 
  PlayCircle,
  AlertCircle,
  Tag,
  CheckCircle2,
  Sparkles,
  Milk,
  Percent,
  Calculator,
  ArrowRight,
  PackageX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playBeep, playSuccess, playWarning } from '../../utils/sound';
import { createSale } from '../../services/api';

export default function POSView({
  products,
  cart,
  setCart,
  settings,
  soundEnabled,
  lang,
  onCheckoutSuccess,
  heldCarts,
  setHeldCarts,
  searchQuery,
  setSearchQuery
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(Number(settings.default_tax_rate || 0));
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'Card', 'EasyPaisa / JazzCash'
  const [cashTendered, setCashTendered] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');
  const [packagingType, setPackagingType] = useState('none'); // 'none', 'pouch', 'bottle'
  const [mobileActiveTab, setMobileActiveTab] = useState('products'); // 'products' or 'cart' for mobile

  // Custom weight modal for decimal items
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [customWeightInput, setCustomWeightInput] = useState('1.5');

  const currency = settings.currency || 'Rs';
  const packagingFee = packagingType === 'pouch' ? 5 : (packagingType === 'bottle' ? 20 : 0);

  // Specific canonical categories requested
  const categories = [
    { id: 'All', en: 'All Items', ur: 'سب اشیاء' },
    { id: 'Fresh Milk', en: 'Fresh Milk', ur: 'تازہ دودھ' },
    { id: 'Dahi & Creams', en: 'Dahi & Creams', ur: 'دہی و ملائی' },
    { id: 'Desi Ghee', en: 'Desi Ghee & Butter', ur: 'دیسی گھی و مکھن' },
    { id: 'Lassi & Drinks', en: 'Lassi & Drinks', ur: 'لسی و مشروبات' },
    { id: 'Sweets & Kheer', en: 'Sweets & Kheer', ur: 'مٹھائیاں و کھیر' },
  ];

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ur && p.name_ur.includes(q)) ||
        p.code.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === 'percent') {
      return (subtotal * val) / 100;
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - discountAmount);
    return (taxable * (Number(taxRate) || 0)) / 100;
  }, [subtotal, discountAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount + packagingFee);
  }, [subtotal, discountAmount, taxAmount, packagingFee]);

  const changeDue = useMemo(() => {
    const tendered = Number(cashTendered) || 0;
    if (!cashTendered || tendered <= 0) return 0;
    return Math.max(0, tendered - grandTotal);
  }, [cashTendered, grandTotal]);

  // Add Item to Cart
  const handleAddToCart = (product, addQty = 1) => {
    playBeep(soundEnabled);
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: Number((Number(item.quantity) + Number(addQty)).toFixed(2)) }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            code: product.code,
            name_en: product.name_en,
            name_ur: product.name_ur,
            category: product.category,
            price: product.price,
            unit: product.unit,
            image_url: product.image_url,
            quantity: Number(addQty),
            is_decimal: product.is_decimal,
            stock: product.stock
          }
        ];
      }
    });
    setCartError('');
  };

  // Modify Quantity
  const handleUpdateQuantity = (productId, newQty) => {
    playBeep(soundEnabled);
    const qty = Number(newQty);
    if (isNaN(qty) || qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: Number(qty.toFixed(2)) } : item
      )
    );
  };

  // Remove Item
  const handleRemoveItem = (productId) => {
    playBeep(soundEnabled);
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Quick Cash Notes
  const handleQuickCash = (amount) => {
    playBeep(soundEnabled);
    if (amount === 'exact') {
      setCashTendered(String(Math.ceil(grandTotal)));
    } else {
      const current = Number(cashTendered) || 0;
      setCashTendered(String(current + amount));
    }
  };

  // Clear Cart
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear the active cart?')) {
      playWarning(soundEnabled);
      setCart([]);
      setCashTendered('');
      setDiscountValue(0);
      setCartError('');
    }
  };

  // Hold / Park Cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    playBeep(soundEnabled);
    const held = {
      id: Date.now(),
      customerName,
      customerPhone,
      cart,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldCarts((prev) => [...prev, held]);
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCashTendered('');
  };

  // Recall Held Cart
  const handleRecallCart = (heldId) => {
    playBeep(soundEnabled);
    const item = heldCarts.find((h) => h.id === heldId);
    if (!item) return;
    setCart(item.cart);
    setCustomerName(item.customerName || 'Walk-in Customer');
    setCustomerPhone(item.customerPhone || '');
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Handle Checkout / Charge
  const handleCheckout = async (directPrint = true, downloadPdfDirectly = false) => {
    if (cart.length === 0) {
      playWarning(soundEnabled);
      setCartError('Please add dairy items to the cart before checking out.');
      return;
    }

    if (grandTotal <= 0) {
      setCartError('Total bill must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setCartError('');

    try {
      const salePayload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim(),
        cashier_name: settings.cashier_name || 'Muhammad Bilal',
        items: cart.map((item) => ({
          product_id: item.product_id,
          name_en: item.name_en,
          name_ur: item.name_ur,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          total: Number((item.quantity * item.price).toFixed(2)),
        })),
        subtotal: Number(subtotal.toFixed(2)),
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        discount_amount: Number(discountAmount.toFixed(2)),
        tax_rate: Number(taxRate) || 0,
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(grandTotal.toFixed(2)),
        payment_method: paymentMethod,
        cash_paid: Number(cashTendered) || Number(grandTotal.toFixed(2)),
        change_returned: Number(changeDue.toFixed(2)),
        notes: `${packagingType !== 'none' ? `[Packaging: ${packagingType === 'pouch' ? 'Shop Pouch (+Rs 5)' : 'Plastic Bottle (+Rs 20)'}] ` : ''}${orderNotes.trim()}`.trim(),
      };

      const completedSale = await createSale(salePayload);
      playSuccess(soundEnabled);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#16A34A', '#F59E0B', '#10B981']
      });

      // Clear form
      setCart([]);
      setCashTendered('');
      setDiscountValue(0);
      setOrderNotes('');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');

      if (onCheckoutSuccess) {
        onCheckoutSuccess(completedSale, directPrint, downloadPdfDirectly);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      playWarning(soundEnabled);
      setCartError(err.message || 'Payment processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fallback SVG Dairy Image
  const defaultDairyPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23F8FAFC'%3E%3Crect width='400' height='300' fill='%23F1F5F9'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23DCFCE7'/%3E%3Cpath d='M180 110 h40 v20 h-40 z M170 130 h60 l-10 80 h-40 z' fill='%2316A34A' opacity='0.7'/%3E%3C/svg%3E";

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-[#F8FAFC]">
      
      {/* Mobile Segmented View Switcher (Only on screens < lg) */}
      <div className="lg:hidden p-2 bg-slate-100 border-b border-slate-200/90 flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileActiveTab('products')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'products'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Milk className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'ur' ? 'اشیاء' : 'Products'} ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            mobileActiveTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'بل و کیشیر' : 'Order Bill'}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-black ${
            mobileActiveTab === 'cart' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {cart.length}
          </span>
          {cart.length > 0 && (
            <span className="text-[11px] font-mono font-bold">
              • {currency} {grandTotal.toFixed(0)}
            </span>
          )}
        </button>
      </div>

      {/* LEFT/CENTER AREA: Categories & Product Catalog Grid */}
      <div className={`flex-1 flex-col h-full overflow-hidden border-r border-slate-200/80 ${
        mobileActiveTab === 'products' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Top Filter Bar: Category Pills */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playBeep(soundEnabled);
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-600/20'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <span>{cat.en}</span>
                  <span className={`text-[10px] font-urdu ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    ({cat.ur})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Active Items Count */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400 whitespace-nowrap pl-2">
            <span>{filteredProducts.length} items</span>
          </div>
        </div>

        {/* Held Carts Notification Bar if any are parked */}
        {heldCarts.length > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <PauseCircle className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="font-bold">
                {heldCarts.length} Parked Order{heldCarts.length > 1 ? 's' : ''} on Hold
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {heldCarts.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleRecallCart(h.id)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 flex items-center gap-1 transition-colors"
                >
                  <PlayCircle className="w-3 h-3 text-emerald-600" />
                  <span>{h.customerName} ({h.cart.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400">
              <PackageX className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-semibold text-sm text-slate-600">No dairy items match your filter.</p>
              <button
                type="button"
                onClick={() => {
                  if (setSearchQuery) setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-2 text-xs text-emerald-600 font-bold underline hover:text-emerald-700"
              >
                Clear search & show all items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
              {filteredProducts.map((prod) => {
                const isLowStock = prod.stock <= prod.min_stock && prod.stock > 0;
                const isOutOfStock = prod.stock <= 0;
                const inCartItem = cart.find((i) => i.product_id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer select-none card-elevation ${
                      inCartItem
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200/90 hover:border-emerald-500/40'
                    }`}
                    onClick={() => handleAddToCart(prod, 1)}
                  >
                    {/* Top Image Container */}
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-slate-100">
                      <img
                        src={prod.image_url || defaultDairyPlaceholder}
                        alt={prod.name_en}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultDairyPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Floating Stock Pill */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-2xs ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : isLowStock
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-emerald-600/90 text-white'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${prod.stock} ${prod.unit}`}
                        </span>
                      </div>

                      {/* In-Cart Active Badge */}
                      {inCartItem && (
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <span>{inCartItem.quantity} in cart</span>
                        </div>
                      )}

                      {/* Unit indicator badge bottom right */}
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs border border-slate-200/60">
                        {prod.unit}
                      </div>
                    </div>

                    {/* Card Content Area */}
                    <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {prod.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {prod.code}
                          </span>
                        </div>

                        <h3 className="font-heading font-bold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {prod.name_en}
                        </h3>
                        <p className="font-urdu text-xs text-amber-600 font-bold line-clamp-1">
                          {prod.name_ur}
                        </p>
                      </div>

                      {/* Price & Add Row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400">{currency} </span>
                          <span className="font-heading font-black text-base sm:text-lg text-emerald-600">
                            {Number(prod.price).toLocaleString()}
                          </span>
                        </div>

                        {/* One-tap "+ Add" button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(prod, 1);
                          }}
                          disabled={isOutOfStock}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-2xs ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title="Add 1 unit to cart"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>

                      {/* High-Speed Decimal Stepper Buttons for Litre/Kg products */}
                      {prod.is_decimal === 1 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 grid grid-cols-5 gap-1">
                          {[
                            { val: 0.25, label: '0.25' },
                            { val: 0.5, label: '0.5' },
                            { val: 1.0, label: '1.0' },
                            { val: 2.0, label: '2.0' },
                            { val: 5.0, label: '5.0' },
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(prod, preset.val);
                              }}
                              className="text-[9px] py-1 px-0.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200/70 rounded-lg font-bold text-slate-700 transition-colors text-center"
                              title={`Add ${preset.val} ${prod.unit}`}
                            >
                              +{preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Bottom Bar for Fast Checkout (Only visible when items exist and in products tab) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-2.5 bg-white border-t border-slate-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 flex-shrink-0 z-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMobileActiveTab('cart')}>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in bill
                </div>
                <div className="font-heading font-black text-sm text-slate-900">
                  {currency} {grandTotal.toFixed(0)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileActiveTab('cart')}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>{lang === 'ur' ? 'بل و کیشیر' : 'Review & Pay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Interactive Bill Panel */}
      <div className={`w-full lg:w-[410px] xl:w-[450px] bg-white flex-col h-full shadow-lg z-10 border-l border-slate-200/80 ${
        mobileActiveTab === 'cart' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Panel Header */}
        <div className="p-3 sm:px-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Back Button to Catalog */}
            <button
              type="button"
              onClick={() => setMobileActiveTab('products')}
              className="lg:hidden p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Return to Product Grid"
            >
              <Milk className="w-3.5 h-3.5 text-emerald-600" />
              <span>Items</span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">
                {lang === 'ur' ? 'کاؤنٹر بل و رسید' : 'Active Order Bill'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in bill
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Park / Hold Cart */}
            <button
              type="button"
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-40 transition-colors"
              title="Park / Hold bill to serve next customer"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hold</span>
            </button>

            {/* Clear Cart */}
            <button
              type="button"
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl disabled:opacity-30 transition-colors"
              title="Clear entire cart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Quick Inputs */}
        <div className="px-3.5 py-2 bg-white border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone (Optional)"
              className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-xs font-medium"
            />
          </div>
        </div>

        {/* Dairy Vessel & Packaging Charge Selector */}
        <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
            <span>{lang === 'ur' ? 'برتن یا پیکجنگ:' : 'Container & Vessel Packaging:'}</span>
            <span className="font-semibold text-emerald-700">
              {packagingType === 'none' ? (lang === 'ur' ? 'برتن اپنا ہے (0)' : 'Customer Own Vessel (Rs 0)') : (packagingType === 'pouch' ? '+Rs 5 Pouch' : '+Rs 20 Bottle')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                playBeep(soundEnabled);
                setPackagingType('none');
              }}
              className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition-all border ${
                packagingType === 'none'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'ur' ? 'برتن اپنا (0)' : 'Own Vessel'}
            </button>
            <button
              type="button"
              onClick={() => {
                playBeep(soundEnabled);
                setPackagingType('pouch');
              }}
              className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition-all border ${
                packagingType === 'pouch'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'ur' ? 'شاپر (+5)' : 'Pouch (+5)'}
            </button>
            <button
              type="button"
              onClick={() => {
                playBeep(soundEnabled);
                setPackagingType('bottle');
              }}
              className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition-all border ${
                packagingType === 'bottle'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'ur' ? 'بوتل (+20)' : 'Bottle (+20)'}
            </button>
          </div>
        </div>

        {/* Scrollable Itemized Cart List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Milk className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="font-heading font-bold text-sm text-slate-700">Bill is Empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Click dairy products from catalog to add them to this customer's bill.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemLineTotal = Number(item.price) * Number(item.quantity);

              return (
                <div
                  key={item.product_id}
                  className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-2 transition-all hover:bg-slate-50"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.image_url || defaultDairyPlaceholder}
                      alt={item.name_en}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.name_en}
                      </div>
                      <div className="font-urdu text-[11px] text-amber-600 font-semibold truncate leading-none mt-0.5">
                        {item.name_ur}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {currency} {item.price} / {item.unit}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Line Total */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Stepper with Decimal Support */}
                    <div className="flex items-center rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - (item.is_decimal ? 0.5 : 1))}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Reduce quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        step={item.is_decimal ? "0.25" : "1"}
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-12 text-center text-xs font-bold text-slate-800 bg-transparent outline-none py-1"
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + (item.is_decimal ? 0.5 : 1))}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[65px]">
                      <div className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
                        {currency} {itemLineTotal.toFixed(0)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="Remove line item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Calculations & Tender Section */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200/90 space-y-3">
          
          {/* Subtotal, Discount & Grand Total */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-800">{currency} {subtotal.toFixed(0)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span>Discount</span>
                <div className="inline-flex rounded-md border border-slate-200 text-[10px] overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-1.5 py-0.5 font-bold ${discountType === 'fixed' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                  >
                    Rs
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-1.5 py-0.5 font-bold ${discountType === 'percent' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                  >
                    %
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-right font-mono text-xs outline-none focus:border-emerald-500"
                />
                {discountAmount > 0 && (
                  <span className="font-mono text-rose-600 font-bold">(-{currency} {discountAmount.toFixed(0)})</span>
                )}
              </div>
            </div>

            {/* Grand Total Row */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-heading font-extrabold text-sm text-slate-900">GRAND TOTAL</span>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold">{currency} </span>
                <span className="font-heading font-black text-2xl text-slate-900">
                  {grandTotal.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'EasyPaisa', label: 'EasyPaisa / JazzCash', icon: Smartphone }
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    playBeep(soundEnabled);
                    setPaymentMethod(method.id);
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate max-w-[95px] text-[10px] sm:text-xs">{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Tendered & Instant Change Due Calculation */}
          {paymentMethod === 'Cash' && (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Cash Received:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={String(Math.ceil(grandTotal))}
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-mono font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Note Presets */}
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  Exact
                </button>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* Instant Change Due Calculation in Bold Green Text */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Change Due:
                </span>
                <div className="font-mono font-black text-lg sm:text-xl text-emerald-600 animate-in fade-in">
                  {currency} {changeDue.toFixed(0)}
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {cartError && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cartError}</span>
            </div>
          )}

          {/* Main Checkout Actions: Print Receipt & Download PDF */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCheckout(true, false)}
              className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Print Receipt'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCheckout(false, true)}
              className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
