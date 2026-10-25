import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ArrowUpRight, 
  Layers, 
  Check, 
  X,
  Milk,
  Boxes,
  PlusCircle,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, updateStock } from '../../services/api';
import { playBeep, playSuccess } from '../../utils/sound';

export default function InventoryView({
  products,
  onRefreshProducts,
  settings,
  soundEnabled,
  lang
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    code: '',
    name_en: '',
    name_ur: '',
    category: 'Fresh Milk',
    price: '',
    unit: 'Litre',
    stock: '',
    min_stock: '10',
    is_decimal: 1,
    icon: '🥛',
    image_url: '',
  });

  const currency = settings.currency || 'Rs';

  const categories = [
    'All',
    'Fresh Milk',
    'Dahi & Creams',
    'Desi Ghee',
    'Lassi & Drinks',
    'Sweets & Kheer',
  ];

  const units = ['Litre', 'Kg', '250g', '500g Jar', '1 Kg Jar', 'Jar', 'Glass', 'Cup', 'Piece', 'Pc', 'Pack', '500ml'];

  // Filtered Products
  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name_en.toLowerCase().includes(q) ||
      (p.name_ur && p.name_ur.includes(q)) ||
      p.code.toLowerCase().includes(q);
    const matchesLow = showLowStockOnly ? p.stock <= p.min_stock : true;
    return matchesCat && matchesSearch && matchesLow;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    playBeep(soundEnabled);
    setFormData({
      code: '',
      name_en: '',
      name_ur: '',
      category: 'Fresh Milk',
      price: '',
      unit: 'Litre',
      stock: '50',
      min_stock: '10',
      is_decimal: 1,
      icon: '🥛',
      image_url: '',
    });
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    playBeep(soundEnabled);
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name_en: product.name_en,
      name_ur: product.name_ur,
      category: product.category,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      min_stock: product.min_stock,
      is_decimal: product.is_decimal,
      icon: product.icon || '🥛',
      image_url: product.image_url || '',
    });
    setErrorMsg('');
  };

  // Handle Save (Add or Edit)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.name_en || !formData.price || !formData.unit) {
      setErrorMsg('Product name, price, and unit are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          min_stock: Number(formData.min_stock),
        });
      } else {
        await createProduct({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock) || 0,
          min_stock: Number(formData.min_stock) || 5,
        });
      }

      playSuccess(soundEnabled);
      setIsAddModalOpen(false);
      setEditingProduct(null);
      if (onRefreshProducts) onRefreshProducts();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Restock
  const handleApplyRestock = async () => {
    if (!quickRestockProduct) return;
    const delta = Number(restockAmount);
    if (isNaN(delta) || delta === 0) return;

    try {
      await updateStock(quickRestockProduct.id, { delta });
      playSuccess(soundEnabled);
      setQuickRestockProduct(null);
      setRestockAmount('20');
      if (onRefreshProducts) onRefreshProducts();
    } catch (err) {
      alert('Failed to update stock: ' + err.message);
    }
  };

  // Handle Archive / Delete
  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to archive "${product.name_en}"?`)) {
      try {
        await deleteProduct(product.id);
        playBeep(soundEnabled);
        if (onRefreshProducts) onRefreshProducts();
      } catch (err) {
        alert('Failed to archive: ' + err.message);
      }
    }
  };

  const defaultDairyPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23F8FAFC'%3E%3Crect width='400' height='300' fill='%23F1F5F9'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23DCFCE7'/%3E%3Cpath d='M180 110 h40 v20 h-40 z M170 130 h60 l-10 80 h-40 z' fill='%2316A34A' opacity='0.7'/%3E%3C/svg%3E";

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-[#F8FAFC]">
      
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
            {lang === 'ur' ? 'اشیاء و انوینٹری کیٹلاگ' : 'Product Catalog & Inventory'}
          </h1>
          <p className="text-xs text-slate-400">
            Manage dairy items, price rates, stock levels, units, and high-resolution product imagery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Low Stock Toggle */}
        <button
          type="button"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            showLowStockOnly
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item & Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Rate</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Decimal Support</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <Milk className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No items found.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((prod) => {
                    const isLow = prod.stock <= prod.min_stock && prod.stock > 0;
                    const isOut = prod.stock <= 0;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Item & Image Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image_url || defaultDairyPlaceholder}
                              alt={prod.name_en}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultDairyPlaceholder;
                              }}
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {prod.name_en}
                              </div>
                              <div className="font-urdu text-xs text-amber-600 font-bold leading-none mt-0.5">
                                {prod.name_ur}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {prod.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {prod.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-black text-sm text-slate-900">
                            {currency} {Number(prod.price).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">per {prod.unit}</div>
                        </td>

                        {/* Stock & Quick Restock */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {prod.stock} {prod.unit}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setQuickRestockProduct(prod);
                                setRestockAmount('20');
                              }}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                              title="Restock units"
                            >
                              +Restock
                            </button>
                          </div>
                        </td>

                        {/* Decimal Support */}
                        <td className="py-3 px-4 text-slate-500">
                          {prod.is_decimal === 1 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Yes (0.5, 1.5...)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Whole Units Only</span>
                          )}
                        </td>

                        {/* Actions: Edit, Delete */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
                              title="Archive item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                {editingProduct ? 'Edit Dairy Product' : 'Add New Dairy Item'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="GM-XX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-medium"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">English Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Fresh Buffalo Milk"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urdu Name (اردو نام)</label>
                <input
                  type="text"
                  value={formData.name_ur}
                  onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                  placeholder="مثلاً خالص بھینس کا دودھ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-urdu font-bold"
                />
              </div>

              {/* Image URL with live preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL (Unsplash or Direct Link)</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 text-[11px] font-mono"
                />
                {formData.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultDairyPlaceholder;
                      }}
                    />
                    <span className="text-[10px] text-slate-400">Live Image Preview</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ({currency}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="220"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-medium"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Alert Stock</label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_decimal === 1}
                    onChange={(e) => setFormData({ ...formData, is_decimal: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700">Support Decimal Weights (e.g. 0.5, 1.5, 2.25)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {quickRestockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-4 sm:p-5 border border-slate-200 space-y-3">
            <h3 className="font-heading font-extrabold text-base text-slate-900">
              Restock {quickRestockProduct.name_en}
            </h3>
            <p className="text-xs text-slate-500">
              Current Stock: <span className="font-bold text-slate-800">{quickRestockProduct.stock} {quickRestockProduct.unit}</span>
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Quantity to Add</label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-1.5">
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRestockAmount(String(amt))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickRestockProduct(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRestock}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
