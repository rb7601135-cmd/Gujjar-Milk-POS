import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  UserCheck, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  FileText, 
  DollarSign, 
  MessageSquare, 
  Search, 
  AlertCircle, 
  X,
  RefreshCw,
  Droplets,
  CalendarDays
} from 'lucide-react';
import { 
  fetchCustomers, 
  saveCustomer, 
  fetchDailySubscriptions, 
  markSubscriptionDelivery, 
  fetchCustomerStatement, 
  recordCustomerPayment 
} from '../../services/api';
import { playSound } from '../../utils/sound';

export default function SubscriptionsView({ lang = 'en', settings = {} }) {
  const [customers, setCustomers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statementData, setStatementData] = useState(null);

  // Forms
  const [customerForm, setCustomerForm] = useState({
    id: null,
    account_no: '',
    name: '',
    phone: '',
    address: '',
    morning_quota_litres: '2.0',
    evening_quota_litres: '1.0',
    milk_type: 'buffalo',
    custom_rate: '220',
    current_balance: '0'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: 'Cash payment received for monthly milk bill'
  });

  useEffect(() => {
    loadRoster();
  }, [selectedDate, selectedShift]);

  async function loadRoster() {
    setLoading(true);
    try {
      const [custList, rosterRes] = await Promise.all([
        fetchCustomers(),
        fetchDailySubscriptions({ date: selectedDate, shift_type: selectedShift })
      ]);
      setCustomers(custList);
      setRoster(rosterRes.roster || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDelivery(item, isNagha, extraLitres = 0) {
    try {
      const finalDelivered = isNagha ? 0 : item.scheduled_litres + extraLitres;
      await markSubscriptionDelivery({
        customer_id: item.customer_id,
        log_date: selectedDate,
        shift_type: selectedShift,
        delivered_litres: finalDelivered,
        is_nagha: isNagha ? 1 : 0,
        extra_litres: extraLitres,
        notes: isNagha ? 'Skip / Nagha marked by cashier' : (extraLitres > 0 ? `Extra ${extraLitres}L delivered` : 'Delivered on time')
      });
      playSound(isNagha ? 'warning' : 'success');
      await loadRoster();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleOpenStatement(cust) {
    setSelectedCustomer(cust);
    try {
      const stmt = await fetchCustomerStatement(cust.id);
      setStatementData(stmt);
      setShowStatementModal(true);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveCustomer(e) {
    e.preventDefault();
    try {
      await saveCustomer(customerForm);
      playSound('success');
      setShowAddModal(false);
      setCustomerForm({
        id: null,
        account_no: '',
        name: '',
        phone: '',
        address: '',
        morning_quota_litres: '2.0',
        evening_quota_litres: '1.0',
        milk_type: 'buffalo',
        custom_rate: '220',
        current_balance: '0'
      });
      await loadRoster();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter valid payment amount');
      return;
    }
    try {
      await recordCustomerPayment(selectedCustomer.id, paymentForm);
      playSound('success');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', description: '' });
      await loadRoster();
    } catch (err) {
      alert(err.message);
    }
  }

  // Filtered Roster
  const filteredRoster = roster.filter(r => 
    r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.account_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  // Summary Metrics
  const totalScheduledToday = roster.reduce((acc, r) => acc + (r.scheduled_litres || 0), 0);
  const totalDeliveredToday = roster.reduce((acc, r) => acc + (r.is_nagha ? 0 : r.delivered_litres || 0), 0);
  const totalNaghasToday = roster.filter(r => r.is_nagha === 1).length;
  const totalReceivableBalance = customers.reduce((acc, c) => acc + (c.current_balance > 0 ? c.current_balance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'ur' ? 'ماہانہ گاہک دودھ کارڈ و ناغہ رجسٹر' : 'Monthly Milk Cards & Daily Nagha Register'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ur' 
              ? 'گھروں کی روزانہ دودھ سپلائی، ناغہ / چھٹی شیٹ اور واٹس ایپ ماہانہ بلنگ' 
              : 'Manage regular household milk quotas, daily delivery attendance, nagha tracking, and WhatsApp statements.'}
          </p>
        </div>

        {/* Shift and Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedShift('morning')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedShift === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {lang === 'ur' ? 'صبح سپلائی (Morning)' : 'Morning Delivery'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift('evening')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedShift === 'evening'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {lang === 'ur' ? 'شام سپلائی (Evening)' : 'Evening Delivery'}
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
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ur' ? '+ نیا دودھ کارڈ بنائیں' : '+ New Customer Card'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'شیڈول شدہ کوٹہ' : 'Shift Target Quota'}
            </span>
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalScheduledToday.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {customers.length} subscribed households
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'آج سپلائی شدہ' : 'Delivered Today'}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {totalDeliveredToday.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Litres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {Math.round((totalDeliveredToday / (totalScheduledToday || 1)) * 100)}% quota fulfilled
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'ناغہ / چھٹیاں' : 'Nagha / Skips Today'}
            </span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {totalNaghasToday} <span className="text-sm font-semibold text-slate-500">Cards</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Auto-deducted from monthly bill
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ur' ? 'ماہانہ واجب الوصول ادھار' : 'Total Customer Udhar'}
            </span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            Rs. {totalReceivableBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Receivable across all active accounts
          </div>
        </div>
      </div>

      {/* Main Delivery Roster & Quick Action Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'ur' ? 'روزانہ سپلائی و ناغہ حاضری شیٹ' : 'Daily Attendance & Nagha Roster'}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedShift === 'morning' ? 'Morning Shift (صبح)' : 'Evening Shift (شام)'} — {selectedDate}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or card #..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading subscription roster...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Add monthly milk cards using the "+ New Customer Card" button.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Card & Customer</th>
                  <th className="py-2.5 px-3">Delivery Address</th>
                  <th className="py-2.5 px-3 text-center">Quota (L)</th>
                  <th className="py-2.5 px-3 text-center">Status Today</th>
                  <th className="py-2.5 px-3 text-right">Today Charge</th>
                  <th className="py-2.5 px-3 text-center">1-Tap Actions</th>
                  <th className="py-2.5 px-3 text-right">Ledger / WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRoster.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {item.customer_name}
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded border border-blue-200">
                          {item.account_no}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{item.address || 'In-store daily pickup'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.milk_type === 'buffalo' ? 'Buffalo (بھینس)' : 'Cow (گائے)'} @ Rs. {item.custom_rate}/L
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-slate-900 text-sm">
                        {item.scheduled_litres} L
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.is_nagha ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {lang === 'ur' ? 'ناغہ (Skip)' : 'Nagha (Skip)'}
                        </span>
                      ) : item.extra_litres > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Delivered ({item.delivered_litres}L +{item.extra_litres}L Extra)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {lang === 'ur' ? 'وصول (Delivered)' : 'Delivered'} ({item.delivered_litres}L)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      Rs. {item.total_charge.toLocaleString()}
                    </td>

                    {/* Quick 1-Tap Toggle Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleMarkDelivery(item, false, 0)}
                          title="Mark Standard Delivery"
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            !item.is_nagha && item.extra_litres === 0
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ✓ OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkDelivery(item, true, 0)}
                          title="Mark Nagha / Skip"
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            item.is_nagha
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {lang === 'ur' ? 'ناغہ' : 'Nagha'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkDelivery(item, false, 1.0)}
                          title="Add 1 Extra Litre"
                          className="px-2 py-1 bg-white text-amber-700 hover:bg-amber-50 rounded-lg text-[11px] font-bold transition-all"
                        >
                          +1L
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenStatement(item)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 border border-emerald-200"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT CUSTOMER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ur' ? 'نیا ماہانہ دودھ کارڈ جاری کریں' : 'Register Monthly Milk Card'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="e.g. Dr. Imran Farooq"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account / Card No</label>
                  <input
                    type="text"
                    value={customerForm.account_no}
                    onChange={(e) => setCustomerForm({ ...customerForm, account_no: e.target.value })}
                    placeholder="Auto (e.g. MK-106)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Home Delivery Address</label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="e.g. House 42-B, Model Town, Lahore"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Morning Quota (Litres)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={customerForm.morning_quota_litres}
                    onChange={(e) => setCustomerForm({ ...customerForm, morning_quota_litres: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Evening Quota (Litres)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={customerForm.evening_quota_litres}
                    onChange={(e) => setCustomerForm({ ...customerForm, evening_quota_litres: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Milk Preference</label>
                  <select
                    value={customerForm.milk_type}
                    onChange={(e) => setCustomerForm({ ...customerForm, milk_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="buffalo">Fresh Buffalo (بھینس)</option>
                    <option value="cow">Pure Cow (گائے)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agreed Rate per Litre (Rs)</label>
                  <input
                    type="number"
                    required
                    value={customerForm.custom_rate}
                    onChange={(e) => setCustomerForm({ ...customerForm, custom_rate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Previous Udhar / Advance Balance (Rs)</label>
                <input
                  type="number"
                  value={customerForm.current_balance}
                  onChange={(e) => setCustomerForm({ ...customerForm, current_balance: e.target.value })}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Create Milk Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-CLICK WHATSAPP STATEMENT & MONTHLY BILL */}
      {showStatementModal && statementData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{statementData.customer.name}</span>
                  <span className="text-xs bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
                    {statementData.customer.account_no}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Monthly Statement & WhatsApp Invoice</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatementModal(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Metric Tiles */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Milk</div>
                <div className="text-lg font-black text-slate-900">
                  {statementData.summary.totalLitres.toFixed(1)} <span className="text-xs font-normal">L</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Naghas</div>
                <div className="text-lg font-black text-amber-600">
                  {statementData.summary.totalNaghas} <span className="text-xs font-normal">days</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-[10px] font-bold uppercase text-emerald-800">Net Balance</div>
                <div className="text-lg font-black text-emerald-900">
                  Rs. {statementData.summary.currentBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* WhatsApp Text Preview Box */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>WhatsApp Message Preview:</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Ready to send</span>
              </label>
              <textarea
                readOnly
                rows={7}
                value={statementData.whatsappText}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 resize-none leading-relaxed"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowStatementModal(false);
                  setShowPaymentModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                {lang === 'ur' ? 'بل کی وصولی درج کریں' : 'Record Bill Payment'}
              </button>

              <a
                href={statementData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'ur' ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD CUSTOMER PAYMENT */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.customer_name || selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Udhar Recovery / Monthly Payment</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (Rs)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
