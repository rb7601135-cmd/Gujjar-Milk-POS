import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Scale, 
  Clock, 
  X,
  RefreshCw,
  Archive,
  ChefHat
} from 'lucide-react';
import { 
  fetchProcessingBatches, 
  createProcessingBatch, 
  fetchProducts 
} from '../../services/api';
import { playSound } from '../../utils/sound';

export default function ProcessingView({ lang = 'en', settings = {} }) {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSpoilageModal, setShowSpoilageModal] = useState(false);

  // Conversion Form State
  const [batchForm, setBatchForm] = useState({
    source_milk_type: 'buffalo',
    source_litres: '50',
    target_product_code: 'GM-05',
    target_product_name: 'Fresh Sweet Dahi / Curd (میٹھا دہی)',
    target_quantity_produced: '48',
    target_unit: 'Kg',
    spoilage_litres: '0',
    notes: '',
    created_by: 'Ustad Kareem (Head Dairyman)'
  });

  // Target Dairy Recipe Presets
  const recipes = [
    {
      code: 'GM-05',
      name: 'Fresh Sweet Dahi / Curd (میٹھا دہی)',
      unit: 'Kg',
      yieldRatio: 0.96, // 100L milk yields ~96Kg Dahi
      desc: 'Warm incubation at 38-40°C with culture for 6-8 hours'
    },
    {
      code: 'GM-06',
      name: 'Plain Desi Dahi (سادہ دہی)',
      unit: 'Kg',
      yieldRatio: 0.95,
      desc: 'Standard setting for curry, raita, and household dining'
    },
    {
      code: 'GM-07',
      name: 'Thick Malai / Fresh Cream',
      unit: 'Kg',
      yieldRatio: 0.08, // 100L yields ~8Kg thick malai
      desc: 'Slow simmering and cooling to skim top fat layer'
    },
    {
      code: 'GM-03',
      name: 'Pure Desi Ghee 1kg (خالص دیسی گھی)',
      unit: 'Jar',
      yieldRatio: 0.05, // 100L milk yields ~5Kg ghee
      desc: 'Clarified butter produced by churning cultured curd or cream'
    },
    {
      code: 'GM-10',
      name: 'Full Cream Khoya / Mawa',
      unit: 'Kg',
      yieldRatio: 0.22, // 100L milk yields ~22Kg Khoya
      desc: 'Boiled down in open iron karahi until solids crystallize'
    },
    {
      code: 'GM-09',
      name: 'Desi Paneer / Cottage Cheese',
      unit: 'Kg',
      yieldRatio: 0.18, // 100L milk yields ~18Kg Paneer
      desc: 'Coagulated with lemon/vinegar whey separation'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [batchList, prodList] = await Promise.all([
        fetchProcessingBatches(),
        fetchProducts()
      ]);
      setBatches(batchList);
      setProducts(prodList);
    } catch (err) {
      console.error('Error loading processing batches:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRecipeSelect(recipeCode) {
    const r = recipes.find(x => x.code === recipeCode);
    if (r) {
      const srcQty = parseFloat(batchForm.source_litres) || 0;
      const expectedYield = (srcQty * r.yieldRatio).toFixed(1);
      setBatchForm(prev => ({
        ...prev,
        target_product_code: r.code,
        target_product_name: r.name,
        target_unit: r.unit,
        target_quantity_produced: String(expectedYield)
      }));
    }
  }

  function handleSourceLitresChange(litresVal) {
    const srcQty = parseFloat(litresVal) || 0;
    const r = recipes.find(x => x.code === batchForm.target_product_code);
    const expectedYield = r ? (srcQty * r.yieldRatio).toFixed(1) : (srcQty * 0.95).toFixed(1);
    setBatchForm(prev => ({
      ...prev,
      source_litres: litresVal,
      target_quantity_produced: String(expectedYield)
    }));
  }

  async function handleStartBatch(e) {
    e.preventDefault();
    if (!batchForm.source_litres || parseFloat(batchForm.source_litres) <= 0) {
      alert('Please enter valid source milk litres');
      return;
    }
    try {
      await createProcessingBatch(batchForm);
      playSound('success');
      setShowBatchModal(false);
      setShowSpoilageModal(false);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Stock of raw milk
  const buffaloStock = products.find(p => p.code === 'GM-01')?.stock || 0;
  const cowStock = products.find(p => p.code === 'GM-02')?.stock || 0;

  // Aggregate Metrics
  const totalMilkProcessed = batches.reduce((acc, b) => acc + b.source_litres, 0);
  const totalSpoilageLoss = batches.reduce((acc, b) => acc + (b.spoilage_litres || 0), 0);
  const totalDahiBatches = batches.filter(b => b.target_product_code === 'GM-05' || b.target_product_code === 'GM-06').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'ur' ? 'دودھ پراسیسنگ، دہی و بائی پروڈکٹ یونٹ' : 'Dairy Processing & By-Product Conversion'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ur' 
              ? 'کچے دودھ سے دہی جمانا، بالائی، دیسی گھی، کھویا اور پھٹے دودھ کا پنیر بنانا' 
              : 'Transform raw milk into Dahi (curd), Malai/Cream, Desi Ghee, Khoya, and salvage sour milk into Paneer.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setBatchForm(prev => ({
                ...prev,
                target_product_code: 'GM-09',
                target_product_name: 'Desi Paneer / Cottage Cheese',
                target_unit: 'Kg',
                notes: 'Curdled milk salvage batch'
              }));
              setShowSpoilageModal(true);
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {lang === 'ur' ? 'پھٹا / کھٹا دودھ پنیر لاگ' : 'Sour Milk Salvage'}
          </button>

          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ur' ? '+ نیا پراسیسنگ بیچ شروع کریں' : '+ Start Conversion Batch'}
          </button>
        </div>
      </div>

      {/* Chiller Stock & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'کچا دودھ بیلنس (چلر میں)' : 'Chiller Raw Milk Stock'}
            </span>
            <Droplets className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(buffaloStock + cowStock).toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-emerald-700 font-bold">Buffalo: {buffaloStock.toFixed(1)}L</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">Cow: {cowStock.toFixed(1)}L</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'پراسیس شدہ دودھ' : 'Total Milk Converted'}
            </span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {totalMilkProcessed.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Converted to Dahi, Malai, Ghee & Khoya
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'دہی جمانے کے بیچ' : 'Dahi (Curd) Batches'}
            </span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalDahiBatches} <span className="text-sm font-semibold text-slate-500">Batches</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Active curd fermentation pots
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'پھٹا دودھ / ضیاع' : 'Curdled / Spoilage Loss'}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {totalSpoilageLoss.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Salvaged to Paneer or drain loss
          </div>
        </div>
      </div>

      {/* Production Recipes Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ur' ? 'ڈیری پراسیسنگ ریسیپیز و معیاری پیداواری تناسب' : 'Dairy Production Matrix & Yield Ratios'}
          </h2>
          <p className="text-xs text-slate-500">Click any preset to launch a conversion batch and adjust live inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recipes.map((r) => (
            <div
              key={r.code}
              onClick={() => {
                handleRecipeSelect(r.code);
                setShowBatchModal(true);
              }}
              className="p-4 border border-slate-200/90 hover:border-emerald-500 rounded-2xl transition-all bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {r.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                    {r.code}
                  </span>
                </div>
                <span className="p-1.5 bg-white text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white rounded-xl shadow-xs transition-all">
                  <Plus className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-2.5 text-xs text-slate-600">
                {r.desc}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Std Yield:</span>
                <span className="text-slate-900 font-bold">100L $\rightarrow$ {(100 * r.yieldRatio).toFixed(1)} {r.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Production Batches Log */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'ur' ? 'پراسیسنگ بیچز کی ہسٹری' : 'Processing Batches & Production History'}
            </h2>
            <p className="text-xs text-slate-500">Recorded conversions from raw milk pool to finished inventory</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {batches.length} Batches
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading batch log...
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No processing batches logged</p>
            <p className="text-xs text-slate-400 mt-1">Start a batch to allocate raw milk for Dahi or Malai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Raw Milk Consumed</th>
                  <th className="py-2.5 px-3">Target Product</th>
                  <th className="py-2.5 px-3 text-right">Yield Produced</th>
                  <th className="py-2.5 px-3 text-right">Spoilage</th>
                  <th className="py-2.5 px-3">Head Dairyman</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {b.batch_date} {b.created_at ? b.created_at.substring(11, 16) : ''}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-slate-900 text-sm">{b.source_litres} Litres</div>
                      <span className="text-[10px] text-slate-500 capitalize">{b.source_milk_type} Milk</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{b.target_product_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{b.target_product_code}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-black text-emerald-700 text-sm">
                      {b.target_quantity_produced} {b.target_unit}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-rose-600">
                      {b.spoilage_litres > 0 ? `${b.spoilage_litres} L` : '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-semibold">
                      {b.created_by || 'Ustad Kareem'}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {b.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: START CONVERSION BATCH */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Flame className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ur' ? 'ڈیری پروسیسنگ بیچ شروع کریں' : 'Start Dairy Conversion Batch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Milk</label>
                  <select
                    value={batchForm.source_milk_type}
                    onChange={(e) => setBatchForm({ ...batchForm, source_milk_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="buffalo">Fresh Buffalo ({buffaloStock}L in stock)</option>
                    <option value="cow">Pure Cow ({cowStock}L in stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Litres to Process</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={batchForm.source_litres}
                    onChange={(e) => handleSourceLitresChange(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[20, 40, 50, 70, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSourceLitresChange(String(amt))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    {amt}L
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Product</label>
                <select
                  value={batchForm.target_product_code}
                  onChange={(e) => handleRecipeSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  {recipes.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Yield Produced</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={batchForm.target_quantity_produced}
                    onChange={(e) => setBatchForm({ ...batchForm, target_quantity_produced: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    readOnly
                    value={batchForm.target_unit}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Head Dairyman / Chef</label>
                <input
                  type="text"
                  value={batchForm.created_by}
                  onChange={(e) => setBatchForm({ ...batchForm, created_by: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Notes</label>
                <input
                  type="text"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="e.g. Set in clay matkas at 38°C"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                ⚡ <strong>Inventory Automation:</strong> This will deduct <strong>{batchForm.source_litres} Litres</strong> from Raw Milk and add <strong>{batchForm.target_quantity_produced} {batchForm.target_unit}</strong> to {batchForm.target_product_name}.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SOUR MILK SALVAGE */}
      {showSpoilageModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ur' ? 'پھٹا دودھ و پنیر ریکوری لاگ' : 'Curdled Milk & Paneer Salvage'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSpoilageModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sour / Curdled Litres</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="1"
                  value={batchForm.source_litres}
                  onChange={(e) => {
                    const l = parseFloat(e.target.value) || 0;
                    setBatchForm({
                      ...batchForm,
                      source_litres: e.target.value,
                      target_quantity_produced: String((l * 0.18).toFixed(1)),
                      spoilage_litres: String((l * 0.05).toFixed(1))
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salvaged Desi Paneer Produced (Kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={batchForm.target_quantity_produced}
                  onChange={(e) => setBatchForm({ ...batchForm, target_quantity_produced: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="e.g. Afternoon heat or generator trip"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSpoilageModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Log Salvage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
