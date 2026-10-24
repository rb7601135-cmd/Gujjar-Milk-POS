import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  MapPin, 
  DollarSign, 
  ArrowDownRight, 
  Calendar, 
  FileText, 
  Printer, 
  X,
  RefreshCw,
  Droplets,
  Award
} from 'lucide-react';
import { 
  fetchSuppliers, 
  saveSupplier, 
  fetchProcurement, 
  recordProcurement, 
  recordSupplierPayout, 
  fetchSupplierLedger,
  fetchCurrentShift
} from '../../services/api';
import { playSound } from '../../utils/sound';

export default function ProcurementView({ lang = 'en', settings = {} }) {
  const [suppliers, setSuppliers] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState(null);
  const [activeShiftFilter, setActiveShiftFilter] = useState('morning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    supplier_id: '',
    shift_type: 'morning',
    milk_type: 'buffalo',
    quantity_litres: '',
    fat_percentage: '6.5',
    lactometer_reading: '28.0',
    rate_per_litre: '185',
    payment_status: 'credit_khata',
    notes: ''
  });

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    type: 'cash_payout',
    amount: '',
    description: ''
  });

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    id: null,
    name: '',
    phone: '',
    village_area: '',
    milk_type: 'buffalo',
    default_rate: '180',
    rate_type: 'fixed',
    current_balance: '0'
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, activeShiftFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [supList, procList, shiftRes] = await Promise.all([
        fetchSuppliers(),
        fetchProcurement({ date: selectedDate, shift_type: activeShiftFilter }),
        fetchCurrentShift()
      ]);
      setSuppliers(supList);
      setProcurements(procList);
      setShiftData(shiftRes);
      if (supList.length > 0 && !intakeForm.supplier_id) {
        setIntakeForm(prev => ({ 
          ...prev, 
          supplier_id: supList[0].id,
          rate_per_litre: supList[0].default_rate,
          milk_type: supList[0].milk_type
        }));
      }
    } catch (err) {
      console.error('Error loading procurement data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSupplierSelect(supId) {
    const s = suppliers.find(x => x.id === parseInt(supId, 10));
    if (s) {
      setIntakeForm(prev => ({
        ...prev,
        supplier_id: s.id,
        milk_type: s.milk_type,
        rate_per_litre: String(s.default_rate),
        fat_percentage: s.milk_type === 'cow' ? '4.2' : '6.5'
      }));
    }
  }

  // Auto-calculate rate based on Fat % if selected
  function handleFatChange(fatVal) {
    const fat = parseFloat(fatVal) || 0;
    const sup = suppliers.find(x => x.id === parseInt(intakeForm.supplier_id, 10));
    if (sup && sup.rate_type === 'fat_based') {
      // Benchmark: 6.0% fat = default rate
      const baseRate = sup.default_rate;
      const calculatedRate = Math.round((baseRate * (fat / 6.0)) * 10) / 10;
      setIntakeForm(prev => ({ ...prev, fat_percentage: fatVal, rate_per_litre: String(calculatedRate) }));
    } else {
      setIntakeForm(prev => ({ ...prev, fat_percentage: fatVal }));
    }
  }

  async function handleRecordIntake(e) {
    e.preventDefault();
    if (!intakeForm.quantity_litres || parseFloat(intakeForm.quantity_litres) <= 0) {
      alert('Please enter valid milk litres');
      return;
    }
    try {
      await recordProcurement({
        ...intakeForm,
        shift_type: activeShiftFilter
      });
      playSound('success');
      setShowIntakeModal(false);
      setIntakeForm(prev => ({
        ...prev,
        quantity_litres: '',
        notes: ''
      }));
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveSupplier(e) {
    e.preventDefault();
    try {
      await saveSupplier(supplierForm);
      playSound('success');
      setShowSupplierModal(false);
      setSupplierForm({
        id: null,
        name: '',
        phone: '',
        village_area: '',
        milk_type: 'buffalo',
        default_rate: '180',
        rate_type: 'fixed',
        current_balance: '0'
      });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRecordPayout(e) {
    e.preventDefault();
    if (!payoutForm.amount || parseFloat(payoutForm.amount) <= 0) {
      alert('Please enter valid payout amount');
      return;
    }
    try {
      await recordSupplierPayout(selectedSupplier.id, payoutForm);
      playSound('success');
      setShowPayoutModal(false);
      setPayoutForm({ type: 'cash_payout', amount: '', description: '' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Calculate Metrics
  const totalLitresReceived = procurements.reduce((acc, p) => acc + p.quantity_litres, 0);
  const totalBuffaloLitres = procurements.filter(p => p.milk_type === 'buffalo').reduce((acc, p) => acc + p.quantity_litres, 0);
  const totalCowLitres = procurements.filter(p => p.milk_type === 'cow').reduce((acc, p) => acc + p.quantity_litres, 0);
  const totalPayableCost = procurements.reduce((acc, p) => acc + p.total_amount, 0);
  const totalGawalaPayableBalance = suppliers.reduce((acc, s) => acc + (s.current_balance > 0 ? s.current_balance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Shift Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'ur' ? 'گوالہ و کسان دودھ وصولی ڈیسک' : 'Gawala & Farmer Milk Procurement'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ur' 
              ? 'صبح اور شام کے دودھ کی مقدار، فیٹ ٹیسٹ اور کسان کھاتہ کا انتظام' 
              : 'Record shift-wise milk can arrivals, Fat % / LR quality testing, and supplier ledgers.'}
          </p>
        </div>

        {/* Shift and Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveShiftFilter('morning')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeShiftFilter === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {lang === 'ur' ? 'صبح کی شفٹ (Morning)' : 'Morning Shift'}
            </button>
            <button
              type="button"
              onClick={() => setActiveShiftFilter('evening')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeShiftFilter === 'evening'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {lang === 'ur' ? 'شام کی شفٹ (Evening)' : 'Evening Shift'}
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />

          <button
            type="button"
            onClick={() => setShowIntakeModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ur' ? '+ دودھ کی وصولی درج کریں' : '+ Record Milk Intake'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'کل وصول شدہ دودھ' : 'Shift Total Milk'}
            </span>
            <Droplets className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalLitresReceived.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-emerald-700 font-bold">🥛 Buffalo: {totalBuffaloLitres.toFixed(1)}L</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">🐄 Cow: {totalCowLitres.toFixed(1)}L</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'شفٹ خریداری لاگت' : 'Shift Purchase Cost'}
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rs. {totalPayableCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg Rate: Rs. {totalLitresReceived > 0 ? (totalPayableCost / totalLitresReceived).toFixed(1) : '0'}/L
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'گوالہ کل واجب الادا' : 'Gawala Ledger Balance'}
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            Rs. {totalGawalaPayableBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {suppliers.length} active farmers / dairy suppliers
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'ایکٹو سپلائرز' : 'Active Gawalas'}
            </span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {suppliers.length} <span className="text-sm font-semibold text-slate-500">Farmers</span>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowSupplierModal(true)}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              + {lang === 'ur' ? 'نیا گوالہ رجسٹر کریں' : 'Register New Farmer'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Shift Milk Intake Register + Supplier Khata Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shift Intake Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ur' ? 'آج کی دودھ وصولی شیٹ' : 'Shift Milk Intake Log'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeShiftFilter === 'morning' ? 'Morning (صبح) Deliveries' : 'Evening (شام) Deliveries'} — {selectedDate}
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              {procurements.length} {lang === 'ur' ? 'آمدیں' : 'Intakes'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading procurement data...
            </div>
          ) : procurements.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No milk intake recorded for this shift</p>
              <p className="text-xs text-slate-400 mt-1">Tap "+ Record Milk Intake" to enter farmer deliveries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Gawala / Farmer</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Qty (L)</th>
                    <th className="py-2.5 px-3 text-right">Fat % / LR</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {procurements.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.supplier_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{p.supplier_code}</span> • <span>{p.village_area}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          p.milk_type === 'buffalo' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.milk_type === 'buffalo' ? 'Buffalo بھینس' : 'Cow گائے'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                        {p.quantity_litres} L
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600">
                        {p.fat_percentage > 0 ? `${p.fat_percentage}%` : '—'} / {p.lactometer_reading > 0 ? p.lactometer_reading : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        Rs. {p.rate_per_litre}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                        Rs. {p.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          p.payment_status === 'credit_khata'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.payment_status === 'credit_khata' ? 'کھاتہ (Credit)' : 'نقد ادا (Cash)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Farmer Khata Ledger Quick Cards */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {lang === 'ur' ? 'گوالہ کھاتہ و بیلنس' : 'Farmer Ledgers & Balances'}
                </h2>
                <p className="text-xs text-slate-500">Direct advance and payout settlements</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 border border-slate-200/90 rounded-xl hover:border-emerald-300 transition-all bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {s.name}
                        <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {s.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.village_area || 'Main Farm Area'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.current_balance >= 0 ? 'Payable' : 'Advance'}
                      </div>
                      <div className={`text-base font-black ${
                        s.current_balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        Rs. {Math.abs(s.current_balance).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Rate: <strong className="text-slate-800">Rs. {s.default_rate}/L</strong> ({s.rate_type === 'fat_based' ? 'Fat %' : 'Fixed'})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupplier(s);
                        setShowPayoutModal(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-500 text-slate-800 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      {lang === 'ur' ? 'ادائیگی / پیشگی' : 'Pay / Advance'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: RECORD MILK INTAKE */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {lang === 'ur' ? 'دودھ کی آمد درج کریں' : 'Record Shift Milk Intake'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeShiftFilter === 'morning' ? 'Morning Shift (صبح)' : 'Evening Shift (شام)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordIntake} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'گوالہ / فارمر منتخب کریں' : 'Select Gawala / Supplier'}
                </label>
                <select
                  value={intakeForm.supplier_id}
                  onChange={(e) => handleSupplierSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-emerald-500"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — Balance: Rs. {s.current_balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'دودھ کی قسم' : 'Milk Type'}
                  </label>
                  <select
                    value={intakeForm.milk_type}
                    onChange={(e) => setIntakeForm({ ...intakeForm, milk_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="buffalo">Fresh Buffalo (بھینس)</option>
                    <option value="cow">Pure Cow (گائے)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'مقدار (لیٹر)' : 'Quantity (Litres)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={intakeForm.quantity_litres}
                    onChange={(e) => setIntakeForm({ ...intakeForm, quantity_litres: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              {/* Quick Litre Chips */}
              <div className="flex gap-2">
                {[20, 40, 50, 80, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setIntakeForm({ ...intakeForm, quantity_litres: String(amt) })}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    +{amt}L
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'فیٹ فیصد (Fat %)' : 'Fat Percentage (Fat %)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={intakeForm.fat_percentage}
                    onChange={(e) => handleFatChange(e.target.value)}
                    placeholder="e.g. 6.5"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'لیکٹو میٹر (LR Reading)' : 'Lactometer Reading (LR)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={intakeForm.lactometer_reading}
                    onChange={(e) => setIntakeForm({ ...intakeForm, lactometer_reading: e.target.value })}
                    placeholder="e.g. 28.0"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'نرخ فی لیٹر (Rs)' : 'Rate Per Litre (Rs)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={intakeForm.rate_per_litre}
                    onChange={(e) => setIntakeForm({ ...intakeForm, rate_per_litre: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ur' ? 'طریقہ ادائیگی' : 'Payment Status'}
                  </label>
                  <select
                    value={intakeForm.payment_status}
                    onChange={(e) => setIntakeForm({ ...intakeForm, payment_status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="credit_khata">Add to Farmer Khata (کھاتہ ادھار)</option>
                    <option value="cash_paid">Immediate Cash Paid (فوری نقد)</option>
                  </select>
                </div>
              </div>

              {/* Calculated Total Bar */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">
                  {lang === 'ur' ? 'کل قابل ادا رقم:' : 'Total Payable Amount:'}
                </span>
                <span className="text-lg font-black text-emerald-900">
                  Rs. {((parseFloat(intakeForm.quantity_litres) || 0) * (parseFloat(intakeForm.rate_per_litre) || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ur' ? 'وصولی محفوظ کریں' : 'Save Milk Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW GAWALA / SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {lang === 'ur' ? 'نیا گوالہ / فارمر رجسٹر کریں' : 'Register New Farmer / Gawala'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farmer / Gawala Name</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Chaudhry Aslam Gawala"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Farm Area</label>
                  <input
                    type="text"
                    value={supplierForm.village_area}
                    onChange={(e) => setSupplierForm({ ...supplierForm, village_area: e.target.value })}
                    placeholder="e.g. Phoolnagar"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Milk Specialty</label>
                  <select
                    value={supplierForm.milk_type}
                    onChange={(e) => setSupplierForm({ ...supplierForm, milk_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="buffalo">Buffalo (بھینس)</option>
                    <option value="cow">Cow (گائے)</option>
                    <option value="mixed">Mixed Dairy (مکس)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pricing Model</label>
                  <select
                    value={supplierForm.rate_type}
                    onChange={(e) => setSupplierForm({ ...supplierForm, rate_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="fixed">Fixed Rate per Litre</option>
                    <option value="fat_based">Fat % Tiered Formula</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Base Rate (Rs)</label>
                  <input
                    type="number"
                    required
                    value={supplierForm.default_rate}
                    onChange={(e) => setSupplierForm({ ...supplierForm, default_rate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Advance / Balance</label>
                  <input
                    type="number"
                    value={supplierForm.current_balance}
                    onChange={(e) => setSupplierForm({ ...supplierForm, current_balance: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Register Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYOUT / ADVANCE TO GAWALA */}
      {showPayoutModal && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedSupplier.name}</h3>
                <p className="text-xs text-slate-500">Current Balance: Rs. {selectedSupplier.current_balance.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={payoutForm.type}
                  onChange={(e) => setPayoutForm({ ...payoutForm, type: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="cash_payout">Cash Payout (واجب الادا رقم کی ادائیگی)</option>
                  <option value="advance_payment">Advance Payment (پیشگی رقم کا ادھار)</option>
                  <option value="feed_purchase">Cattle Feed Deduction (کھل / چوکر کٹوتی)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={payoutForm.description}
                  onChange={(e) => setPayoutForm({ ...payoutForm, description: e.target.value })}
                  placeholder="e.g. Weekly settlement or 2 sacks feed"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
