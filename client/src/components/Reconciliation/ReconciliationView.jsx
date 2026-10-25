import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Printer, 
  DollarSign, 
  Droplets, 
  Layers, 
  ShieldCheck, 
  RefreshCw,
  X,
  FileCheck,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { 
  fetchReconciliationToday, 
  closeShift, 
  openShift 
} from '../../services/api';
import { playSound } from '../../utils/sound';

export default function ReconciliationView({ lang = 'en', settings = {} }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // User input for physical counts
  const [physicalChillerLitres, setPhysicalChillerLitres] = useState('');
  const [physicalDrawerCash, setPhysicalDrawerCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Modals
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);

  // New Shift form
  const [newShiftForm, setNewShiftForm] = useState({
    shift_type: 'evening',
    cashier_name: 'Muhammad Bilal',
    opening_cash: '15000',
    opening_milk_chiller: '120',
    notes: ''
  });

  useEffect(() => {
    loadReconciliation();
  }, []);

  async function loadReconciliation() {
    setLoading(true);
    try {
      const res = await fetchReconciliationToday();
      setData(res);
      setPhysicalChillerLitres(String(res.milkBalancing.expectedClosingChiller));
      setPhysicalDrawerCash(String(res.cashBalancing.expectedDrawerCash));
    } catch (err) {
      console.error('Error loading reconciliation:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate Variance
  const expectedChiller = data?.milkBalancing?.expectedClosingChiller || 0;
  const actualChiller = parseFloat(physicalChillerLitres) || 0;
  const milkVariance = Number((actualChiller - expectedChiller).toFixed(2)); // negative means shortage

  const expectedCash = data?.cashBalancing?.expectedDrawerCash || 0;
  const actualCash = parseFloat(physicalDrawerCash) || 0;
  const cashVariance = Number((actualCash - expectedCash).toFixed(2));

  async function handleCloseShift(e) {
    e.preventDefault();
    if (!data?.shift?.id) return;
    try {
      await closeShift({
        shift_id: data.shift.id,
        closing_cash: actualCash,
        closing_milk_chiller: actualChiller,
        notes: `Milk Variance: ${milkVariance}L | Cash Variance: Rs.${cashVariance}. ${closingNotes}`
      });
      playSound('success');
      setShowCloseModal(false);
      alert('Shift successfully closed and balance sheet archived!');
      await loadReconciliation();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleOpenNewShift(e) {
    e.preventDefault();
    try {
      await openShift(newShiftForm);
      playSound('success');
      setShowNewShiftModal(false);
      await loadReconciliation();
    } catch (err) {
      alert(err.message);
    }
  }

  function handlePrintSummary() {
    window.print();
  }

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        <p className="font-semibold text-sm">Calculating Day-End Milk Litre Balancing (دودھ کا میزان)...</p>
      </div>
    );
  }

  const { milkBalancing = {}, cashBalancing = {}, shift = {} } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Scale className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'ur' ? 'شام کی کلوزنگ و دودھ کا مکمل میزان' : 'Day-End Milk Litre Reconciliation & Shift Closing'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ur' 
              ? 'کل موصول شدہ دودھ، کاؤنٹر سیل، ہوم ڈلیوری اور بقایا چلر کا درست میزان' 
              : 'Audit total incoming milk litres against retail sales, home delivery subscriptions, and chiller leftovers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePrintSummary}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            {lang === 'ur' ? 'رپورٹ پرنٹ کریں' : 'Print Audit Sheet'}
          </button>

          {shift?.status === 'open' ? (
            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              {lang === 'ur' ? 'شفٹ بند کریں (Close Shift)' : 'Close Shift & Reconcile'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewShiftModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {lang === 'ur' ? 'نئی شفٹ شروع کریں' : 'Start New Shift'}
            </button>
          )}
        </div>
      </div>

      {/* Main Reconciliation Audit Display: Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: THE MILK LITRE BALANCE SHEET (دودھ کا میزان) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {lang === 'ur' ? 'دودھ کا میزان (Litre Balance Sheet)' : 'Milk Litres Balance Sheet'}
                </h2>
                <p className="text-xs text-slate-500">Every drop accounted for (Intake = Outflow + Chiller)</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Shift: {shift?.shift_type || 'Morning'}
            </span>
          </div>

          {/* INFLOW SECTION */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span>+ MILK INFLOW (کل آمد)</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Opening Chiller Buffer (صبح کا بچا ہوا دودھ)</span>
                <span className="font-bold text-slate-900">{milkBalancing.openingChiller.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Gawala Buffalo Intake (بھینس کی آمد)</span>
                <span className="font-bold text-slate-900">+{milkBalancing.intakeBuffalo.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Gawala Cow Intake (گائے کی آمد)</span>
                <span className="font-bold text-slate-900">+{milkBalancing.intakeCow.toFixed(1)} L</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Total Shift Milk Inflow</span>
                <span className="text-sm font-black">{milkBalancing.totalInflow.toFixed(1)} Litres</span>
              </div>
            </div>
          </div>

          {/* OUTFLOW SECTION */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span>- MILK OUTFLOW (کل اخراج و کھپت)</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Counter Retail POS Sales (کاؤنٹر پر فروخت)</span>
                <span className="font-bold text-slate-900">{milkBalancing.counterSold.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Monthly Home Deliveries (ماہانہ کارڈ سپلائی)</span>
                <span className="font-bold text-slate-900">{milkBalancing.subscriptionsDelivered.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Converted into Dahi & Sweets (دہی و کھویا پراسیس)</span>
                <span className="font-bold text-slate-900">{milkBalancing.byProductsProcessed.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Curdled / Spoilage Loss (پھٹا / ضائع شدہ دودھ)</span>
                <span className="font-bold text-slate-900">{milkBalancing.spoilageLoss.toFixed(1)} L</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-rose-800">
                <span>Total Shift Milk Outflow</span>
                <span className="text-sm font-black">{milkBalancing.totalOutflow.toFixed(1)} Litres</span>
              </div>
            </div>
          </div>

          {/* CHILLER LEFTOVER & VARIANCE VERIFICATION */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>System Expected Chiller Leftover (حساب کے مطابق باقی دودھ):</span>
              <span className="text-base font-black text-emerald-900">{expectedChiller.toFixed(1)} Litres</span>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-4">
              <label className="text-xs font-bold text-slate-800">
                {lang === 'ur' ? 'چلر میں اصل موجود دودھ (لیٹر):' : 'Actual Measured in Chiller (L):'}
              </label>
              <input
                type="number"
                step="0.5"
                value={physicalChillerLitres}
                onChange={(e) => setPhysicalChillerLitres(e.target.value)}
                className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 text-right focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-slate-600">Litre Variance (شارٹیج یا بچت):</span>
              <span className={`text-sm font-black ${
                milkVariance === 0 ? 'text-emerald-700' : (milkVariance < 0 ? 'text-rose-600' : 'text-blue-600')
              }`}>
                {milkVariance > 0 ? `+${milkVariance}` : milkVariance} Litres
                {milkVariance < 0 ? ' (کمی / Shortage)' : (milkVariance > 0 ? ' (بچت / Surplus)' : ' (بالکل درست / Exact)')}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CASH DRAWER RECONCILIATION & SHIFT STATS */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'ur' ? 'کیش دراز کا میزان (Cash Drawer Audit)' : 'Cash Drawer Balance Sheet'}
                  </h2>
                  <p className="text-xs text-slate-500">Opening cash + retail sales - payouts</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Cashier: {shift?.cashier_name || 'Muhammad Bilal'}
              </span>
            </div>

            {/* CASH INFLOW & OUTFLOW */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Opening Cash Float (صبح کا افتتاحی کیش)</span>
                <span className="font-bold text-slate-900">Rs. {cashBalancing.openingCash.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Counter Cash Sales (کاؤنٹر کی نقد فروخت)</span>
                <span className="font-bold text-emerald-700">+Rs. {cashBalancing.cashSales.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Digital Sales (JazzCash / EasyPaisa / Card)</span>
                <span className="font-bold text-blue-700">Rs. {cashBalancing.digitalSales.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Gawala Cash Paid (کسانوں کو فوری نقد ادائیگی)</span>
                <span className="font-bold text-rose-600">-Rs. {cashBalancing.gawalaCashPayouts.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Expected Physical Drawer Cash</span>
                <span className="text-base font-black text-slate-900">Rs. {expectedCash.toLocaleString()}</span>
              </div>
            </div>

            {/* PHYSICAL CASH COUNT INPUT */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-800">
                  {lang === 'ur' ? 'دراز میں گنا ہوا اصل کیش (Rs):' : 'Counted Physical Cash in Drawer (Rs):'}
                </label>
                <input
                  type="number"
                  value={physicalDrawerCash}
                  onChange={(e) => setPhysicalDrawerCash(e.target.value)}
                  className="w-36 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 text-right focus:outline-amber-600"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className="text-slate-600">Cash Discrepancy (کیش کا فرق):</span>
                <span className={`text-sm font-black ${
                  cashVariance === 0 ? 'text-emerald-700' : (cashVariance < 0 ? 'text-rose-600' : 'text-blue-600')
                }`}>
                  {cashVariance > 0 ? `+Rs. ${cashVariance.toLocaleString()}` : `Rs. ${cashVariance.toLocaleString()}`}
                  {cashVariance < 0 ? ' (شارٹ / Short)' : (cashVariance > 0 ? ' (اضافی / Excess)' : ' (بالکل برابر / Balanced)')}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM AUDIT BADGE */}
          <div className="p-4 bg-slate-100 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">Zero-Loss Dairy Guarantee:</strong> Daily milk reconciliation prevents unaccounted leakage, shrinkage, and theft between shift handovers.
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CLOSE SHIFT */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'ur' ? 'آج کی شفٹ کلوز کریں' : 'Confirm Shift Closing'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Closing Milk Chiller:</span>
                  <span className="font-bold text-slate-900">{actualChiller} Litres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Closing Drawer Cash:</span>
                  <span className="font-bold text-slate-900">Rs. {actualCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                  <span className="text-slate-700">Milk Variance:</span>
                  <span className={milkVariance < 0 ? 'text-rose-600' : 'text-emerald-700'}>{milkVariance} L</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift Handover Notes</label>
                <textarea
                  rows={3}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Handed over key to evening shift supervisor. Chiller clean and locked."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: START NEW SHIFT */}
      {showNewShiftModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'ur' ? 'نئی شفٹ کا آغاز کریں' : 'Open New Shift'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewShiftModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenNewShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift Period</label>
                <select
                  value={newShiftForm.shift_type}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, shift_type: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="evening">Evening Shift (شام کی شفٹ)</option>
                  <option value="morning">Morning Shift (صبح کی شفٹ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cashier Name</label>
                <input
                  type="text"
                  required
                  value={newShiftForm.cashier_name}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, cashier_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Cash (Rs)</label>
                  <input
                    type="number"
                    required
                    value={newShiftForm.opening_cash}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, opening_cash: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chiller Buffer (Litres)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newShiftForm.opening_milk_chiller}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, opening_milk_chiller: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={newShiftForm.notes}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, notes: e.target.value })}
                  placeholder="e.g. Evening rush starting"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewShiftModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
