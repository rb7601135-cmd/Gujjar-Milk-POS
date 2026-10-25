import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Printer, 
  DollarSign, 
  Save, 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck,
  Milk,
  Receipt,
  FileText
} from 'lucide-react';
import { updateSettings } from '../../services/api';
import { playSuccess } from '../../utils/sound';

export default function SettingsView({
  settings,
  onSettingsSaved,
  soundEnabled,
  setSoundEnabled,
  lang
}) {
  const [form, setForm] = useState({
    shop_name: '',
    shop_name_ur: '',
    tagline: '',
    address: '',
    phone: '',
    currency: 'Rs',
    default_tax_rate: '0',
    cashier_name: '',
    cashier_shift: '',
    footer_note: '',
    thermal_paper_size: '80mm',
    invoice_prefix: 'GM-2026-',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name || 'Gujjar Milk (گجر ملک شاپ)',
        shop_name_ur: settings.shop_name_ur || 'گجر ملک شاپ',
        tagline: settings.tagline || 'Pure & Fresh Dairy Products — 100% Khales Guarantee',
        address: settings.address || 'Shop #12, Main Dairy Market, Near Gate 4, G.T Road',
        phone: settings.phone || '+92 300 8765432 / +92 321 9876543',
        currency: settings.currency || 'Rs',
        default_tax_rate: settings.default_tax_rate || '0',
        cashier_name: settings.cashier_name || 'Muhammad Bilal',
        cashier_shift: settings.cashier_shift || 'Shift #1 (Morning/Afternoon)',
        footer_note: settings.footer_note || 'Thank you for buying pure! 100% Khales Guarantee. جزاک اللہ خیراً',
        thermal_paper_size: settings.thermal_paper_size || '80mm',
        invoice_prefix: settings.invoice_prefix || 'GM-2026-',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings(form);
      playSuccess(soundEnabled);
      setSaveSuccess(true);
      if (onSettingsSaved) onSettingsSaved(form);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 pb-24 sm:pb-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
            {lang === 'ur' ? 'دکان کی ترتیبات و سیٹنگز' : 'Settings & Receipt Configurator'}
          </h1>
          <p className="text-xs text-slate-400">
            Configure store identity, receipt header/footer, default cashier, tax rate, and thermal roll specifications.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-in fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: Store Branding & Identity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Dairy Store Branding & Identity
              </h2>
              <p className="text-[11px] text-slate-400">Printed on top of every customer receipt and invoice.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Shop Name (English)</label>
              <input
                type="text"
                name="shop_name"
                value={form.shop_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Shop Name (Urdu - اردو)</label>
              <input
                type="text"
                name="shop_name_ur"
                value={form.shop_name_ur}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-urdu font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Tagline & Pure Dairy Guarantee</label>
              <input
                type="text"
                name="tagline"
                value={form.tagline}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Numbers</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Cashier & Shift Defaults */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Cashier Terminal & Shift Configuration
              </h2>
              <p className="text-[11px] text-slate-400">Sets the active cashier on terminal and printouts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Active Cashier Name</label>
              <input
                type="text"
                name="cashier_name"
                value={form.cashier_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Active Shift Description</label>
              <input
                type="text"
                name="cashier_shift"
                value={form.cashier_shift}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Receipt & Thermal Print Setup */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Receipt Layout & Thermal Paper Specifications
              </h2>
              <p className="text-[11px] text-slate-400">Configure 80mm thermal roll format and footer notes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Paper Roll Format</label>
              <select
                name="thermal_paper_size"
                value={form.thermal_paper_size}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="80mm">Standard 80mm POS Thermal Roll (Recommended)</option>
                <option value="58mm">Compact 58mm Thermal Roll</option>
                <option value="A4">A4 Full Sheet Invoice</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                name="invoice_prefix"
                value={form.invoice_prefix}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note / Gratitude</label>
              <input
                type="text"
                name="footer_note"
                value={form.footer_note}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
