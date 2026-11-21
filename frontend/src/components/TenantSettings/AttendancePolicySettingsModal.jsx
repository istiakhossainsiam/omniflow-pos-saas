import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  Receipt, 
  Barcode as BarcodeIcon, 
  Palette, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Sparkles,
  Building2,
  Users,
  Plus,
  Trash2,
  Edit,
  Store,
  UserPlus,
  Percent,
  Lock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { tenantApi, employeeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AttendancePolicySettingsModal({ onClose }) {
  const { tenant, branches, selectedBranch, refreshTenant } = useAuth();
  const [activeTab, setActiveTab] = useState('receipt'); // receipt, barcode, ui, showrooms, staff, attendance
  const [previewMode, setPreviewMode] = useState('receipt'); // receipt, barcode

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tenant General & Print/UI/VAT Settings
  const [settings, setSettings] = useState({
    name: '',
    currency: 'BDT',
    theme_color: 'emerald',
    brand_subtitle: 'Exclusive Fashion & Lifestyle',
    currency_symbol: '৳',
    is_vat_enabled: true,
    vat_percentage: 5.0,
    receipt_header: 'VOGUE LIFESTYLE',
    receipt_tagline: 'Premium Fashion & Apparel Store',
    receipt_address: 'House 42, Road 7/A, Dhanmondi, Dhaka',
    receipt_phone: '+880 1811-223344',
    receipt_vat_no: 'BIN: 002345678-0101',
    receipt_exchange_policy: '*** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***',
    receipt_footer_note: 'Thank you for shopping with us! Please visit again.',
    receipt_show_salesman: true,
    receipt_show_loyalty: true,
    receipt_show_tax: true,
    receipt_show_barcode: true,
    barcode_brand_title: 'VOGUE FASHION',
    barcode_tagline: 'Quality Garments',
    barcode_footer_note: 'Hotline: 01711-000111',
    barcode_show_price: true,
    barcode_show_mrp: true,
    barcode_show_size_color: true,
    ui_background_color: '#f8fafc'
  });

  // Attendance Policy Settings
  const [policy, setPolicy] = useState({
    is_enabled: true,
    require_manager_handshake: true,
    verification_mode: "QR_OR_PIN",
    shift_start_time: "09:30",
    shift_end_time: "19:30",
    grace_period_minutes: 15,
    half_day_late_minutes: 60,
    late_penalty_type: "INCENTIVE_DEDUCTION",
    penalty_deduction_amount: 100
  });

  // Showroom / Branch State
  const [showroomList, setShowroomList] = useState([]);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    is_warehouse: false
  });

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'SALESMAN',
    password: '',
    branch_id: '',
    department: 'Sales',
    base_salary: 18000,
    commission_rate: 2.5,
    manager_pin: '1234'
  });

  useEffect(() => {
    loadAllData();
  }, [tenant]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [settingsRes, policyRes, branchesRes, staffRes] = await Promise.all([
        tenantApi.getSettings().catch(() => null),
        tenantApi.getAttendancePolicy().catch(() => null),
        tenantApi.getBranches().catch(() => []),
        employeeApi.list().catch(() => [])
      ]);

      if (settingsRes) {
        setSettings(prev => ({
          ...prev,
          name: settingsRes.tenant_name || tenant?.name || '',
          currency: settingsRes.currency || 'BDT',
          ...(settingsRes.settings || {})
        }));
      } else if (tenant) {
        setSettings(prev => ({
          ...prev,
          name: tenant.name || '',
          receipt_header: tenant.name || prev.receipt_header,
          barcode_brand_title: tenant.name || prev.barcode_brand_title,
          ...(tenant.settings || {})
        }));
      }

      if (policyRes) setPolicy(policyRes);
      if (branchesRes) setShowroomList(branchesRes);
      if (staffRes) setStaffList(staffRes);

    } catch (err) {
      console.error("Failed to load settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all([
        tenantApi.updateSettings(settings),
        tenantApi.updateAttendancePolicy(policy)
      ]);
      await refreshTenant();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Branch Handlers
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchFormData.name || !branchFormData.code) {
      alert("Please enter showroom name and code.");
      return;
    }
    try {
      if (editingBranch) {
        await tenantApi.updateBranch(editingBranch.id, branchFormData);
      } else {
        await tenantApi.createBranch(branchFormData);
      }
      await refreshTenant();
      const updated = await tenantApi.getBranches();
      setShowroomList(updated);
      setShowAddBranchModal(false);
      setEditingBranch(null);
      setBranchFormData({ name: '', code: '', address: '', phone: '', is_warehouse: false });
    } catch (err) {
      alert(err.message || "Failed to save showroom");
    }
  };

  const handleDeleteBranch = async (bId, bName) => {
    if (!window.confirm(`Are you sure you want to remove ${bName}?`)) return;
    try {
      await tenantApi.deleteBranch(bId);
      await refreshTenant();
      const updated = await tenantApi.getBranches();
      setShowroomList(updated);
    } catch (err) {
      alert(err.message || "Failed to delete branch");
    }
  };

  // Staff Handlers
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffFormData.full_name || !staffFormData.email) {
      alert("Please enter staff full name and email.");
      return;
    }
    try {
      if (editingStaff) {
        await employeeApi.update(editingStaff.id, staffFormData);
      } else {
        if (!staffFormData.password) {
          alert("Please provide a temporary password for new login account.");
          return;
        }
        await employeeApi.create(staffFormData);
      }
      const updated = await employeeApi.list();
      setStaffList(updated);
      setShowAddStaffModal(false);
      setEditingStaff(null);
      setStaffFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'SALESMAN',
        password: '',
        branch_id: showroomList[0]?.id || '',
        department: 'Sales',
        base_salary: 18000,
        commission_rate: 2.5,
        manager_pin: '1234'
      });
    } catch (err) {
      alert(err.message || "Failed to save staff account");
    }
  };

  const handleDeleteStaff = async (sId, sName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${sName}?`)) return;
    try {
      await employeeApi.delete(sId);
      const updated = await employeeApi.list();
      setStaffList(updated);
    } catch (err) {
      alert(err.message || "Failed to deactivate employee");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Tenant Admin Studio & Store Controls</h3>
              <p className="text-xs text-slate-500">Custom Receipt Templates, Barcodes, Showroom & Staff Accounts, UI Themes & VAT</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 overflow-x-auto scrollbar-none gap-1 sm:gap-2 pt-2">
          {[
            { id: 'receipt', label: 'Sales Receipt Template', icon: Receipt },
            { id: 'barcode', label: 'Barcode & Hangtag', icon: BarcodeIcon },
            { id: 'ui', label: 'Theme & VAT Config', icon: Palette },
            { id: 'showrooms', label: `Showrooms (${showroomList.length})`, icon: Building2 },
            { id: 'staff', label: `Staff Accounts (${staffList.length})`, icon: Users },
            { id: 'attendance', label: 'Attendance & 2FA', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'receipt' || tab.id === 'barcode') setPreviewMode(tab.id);
                }}
                className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading studio settings...</div>
          ) : (
            <div className="space-y-6">

              {/* TAB 1, 2, 3, 6 Form (Wrapped in Grid with Live Preview) */}
              {['receipt', 'barcode', 'ui', 'attendance'].includes(activeTab) && (
                <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  <div className="lg:col-span-7 space-y-4">

                    {/* TAB 1: RECEIPT */}
                    {activeTab === 'receipt' && (
                      <div className="space-y-3.5 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Thermal Receipt Header & Footer Customization</h4>
                            <p className="text-[11px] text-slate-500">Edit exact shop names, contact info, return policy and custom notes</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700">Receipt Shop Header Name:</label>
                            <input
                              type="text"
                              value={settings.receipt_header}
                              onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="e.g. VOGUE LIFESTYLE RETAIL"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700">Tagline / Sub-header:</label>
                            <input
                              type="text"
                              value={settings.receipt_tagline}
                              onChange={(e) => setSettings({ ...settings, receipt_tagline: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="e.g. Premium Fashion & Apparel"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700">Store Showroom Address:</label>
                            <input
                              type="text"
                              value={settings.receipt_address}
                              onChange={(e) => setSettings({ ...settings, receipt_address: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="e.g. House 42, Road 7/A, Dhanmondi, Dhaka"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700">Receipt Phone / Helpline:</label>
                            <input
                              type="text"
                              value={settings.receipt_phone}
                              onChange={(e) => setSettings({ ...settings, receipt_phone: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="e.g. +880 1811-223344"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">VAT / Tax BIN Registration No:</label>
                          <input
                            type="text"
                            value={settings.receipt_vat_no}
                            onChange={(e) => setSettings({ ...settings, receipt_vat_no: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. BIN: 002345678-0101"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Exchange / Return Policy Note:</label>
                          <input
                            type="text"
                            value={settings.receipt_exchange_policy}
                            onChange={(e) => setSettings({ ...settings, receipt_exchange_policy: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. *** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Footer Thank You Message:</label>
                          <textarea
                            rows={2}
                            value={settings.receipt_footer_note}
                            onChange={(e) => setSettings({ ...settings, receipt_footer_note: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. Thank you for shopping with us! Please visit again."
                          />
                        </div>

                        {/* Receipt Display Toggles */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.receipt_show_salesman}
                              onChange={(e) => setSettings({ ...settings, receipt_show_salesman: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show Salesman Rep</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.receipt_show_tax}
                              onChange={(e) => setSettings({ ...settings, receipt_show_tax: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show VAT / Tax Line</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.receipt_show_barcode}
                              onChange={(e) => setSettings({ ...settings, receipt_show_barcode: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show Invoice Barcode</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: BARCODE */}
                    {activeTab === 'barcode' && (
                      <div className="space-y-3.5 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Hangtag Barcode Label Template</h4>
                            <p className="text-[11px] text-slate-500">Customize labels printed for clothing items and merchandise</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Hangtag Brand Header Text:</label>
                          <input
                            type="text"
                            value={settings.barcode_brand_title}
                            onChange={(e) => setSettings({ ...settings, barcode_brand_title: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. VOGUE FASHION"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Sub-tagline / Quality Note:</label>
                          <input
                            type="text"
                            value={settings.barcode_tagline}
                            onChange={(e) => setSettings({ ...settings, barcode_tagline: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. Premium Cotton Collection"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Customer Care Hotline / Barcode Footer:</label>
                          <input
                            type="text"
                            value={settings.barcode_footer_note}
                            onChange={(e) => setSettings({ ...settings, barcode_footer_note: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. Customer Care: 01711-000111"
                          />
                        </div>

                        {/* Barcode Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.barcode_show_price}
                              onChange={(e) => setSettings({ ...settings, barcode_show_price: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show Selling Price</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.barcode_show_mrp}
                              onChange={(e) => setSettings({ ...settings, barcode_show_mrp: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show MRP / Cut Price</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.barcode_show_size_color}
                              onChange={(e) => setSettings({ ...settings, barcode_show_size_color: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold">Show Size & Color</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: UI THEME & VAT */}
                    {activeTab === 'ui' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900">Brand Identity, VAT & Color Themes</h4>
                          <p className="text-[11px] text-slate-500">Configure global tax rules, brand name and app color schemes</p>
                        </div>

                        {/* VAT / TAX CONFIGURATION SECTION */}
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-emerald-700" />
                              <span className="text-xs font-bold text-slate-900">Enable VAT / Tax on Sales Billing</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSettings({ ...settings, is_vat_enabled: !settings.is_vat_enabled })}
                              className="text-emerald-600"
                            >
                              {settings.is_vat_enabled ? (
                                <ToggleRight className="h-8 w-8 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="h-8 w-8 text-slate-400" />
                              )}
                            </button>
                          </div>

                          {settings.is_vat_enabled && (
                            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-4 animate-in fade-in">
                              <div className="text-xs text-slate-700 font-medium">
                                Standard VAT Rate (% Percentage):
                              </div>
                              <div className="relative w-32">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={settings.vat_percentage}
                                  onChange={(e) => setSettings({ ...settings, vat_percentage: parseFloat(e.target.value) || 0 })}
                                  className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">Registered Brand Name:</label>
                          <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            placeholder="e.g. Vogue Lifestyle Retail Ltd"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700">Currency Symbol:</label>
                            <input
                              type="text"
                              value={settings.currency_symbol}
                              onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="৳, $, €, Rs."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700">Currency Code:</label>
                            <input
                              type="text"
                              value={settings.currency}
                              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                              placeholder="BDT, USD, EUR"
                            />
                          </div>
                        </div>

                        {/* UI Accent Palette Selection */}
                        <div>
                          <label className="text-xs font-bold text-slate-700">Primary UI Theme Accent (Live Switch):</label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                            {[
                              { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-600', border: 'border-emerald-600' },
                              { id: 'blue', label: ' Cupertino Blue', color: 'bg-blue-600', border: 'border-blue-600' },
                              { id: 'indigo', label: 'Royal Indigo', color: 'bg-indigo-600', border: 'border-indigo-600' },
                              { id: 'violet', label: 'Velvet Purple', color: 'bg-purple-600', border: 'border-purple-600' },
                              { id: 'amber', label: ' Natural Gold', color: 'bg-amber-600', border: 'border-amber-600' },
                              { id: 'rose', label: 'Crimson Rose', color: 'bg-rose-600', border: 'border-rose-600' },
                            ].map((theme) => {
                              const isSelected = settings.theme_color === theme.id;
                              return (
                                <button
                                  key={theme.id}
                                  type="button"
                                  onClick={() => setSettings({ ...settings, theme_color: theme.id })}
                                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all ${
                                    isSelected ? `${theme.border} bg-slate-50 ring-2 ring-emerald-500/20 shadow-sm` : 'border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <span className={`h-6 w-6 rounded-full ${theme.color} shadow-sm`} />
                                  <span className="text-[10px] font-bold text-slate-700">{theme.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* App Background Color Customization */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">App Background Color & Surface Tone</h5>
                              <p className="text-[10px] text-slate-500">Customize the background wallpaper/tone for all POS terminals</p>
                            </div>
                            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                              {settings.ui_background_color || '#f8fafc'}
                            </span>
                          </div>

                          {/* Preset Background Tones */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {[
                              { id: '#f8fafc', label: 'Slate Cool', bg: 'bg-slate-50', border: 'border-slate-300' },
                              { id: '#f5f5f7', label: ' Apple Light', bg: 'bg-[#f5f5f7]', border: 'border-slate-300' },
                              { id: '#ffffff', label: 'Pure White', bg: 'bg-white', border: 'border-slate-300' },
                              { id: '#fafaf9', label: 'Warm Cream', bg: 'bg-stone-50', border: 'border-stone-300' },
                              { id: '#f0fdf4', label: 'Mint Tint', bg: 'bg-emerald-50', border: 'border-emerald-300' },
                              { id: '#0b0c0e', label: ' Space Gray', bg: 'bg-[#0b0c0e]', border: 'border-slate-700' },
                              { id: '#141312', label: ' Titanium Pro', bg: 'bg-[#141312]', border: 'border-amber-900/50' },
                              { id: '#000000', label: ' OLED Black', bg: 'bg-black', border: 'border-slate-800' },
                            ].map((tone) => {
                              const isSelected = (settings.ui_background_color || '#f8fafc') === tone.id;
                              return (
                                <button
                                  key={tone.id}
                                  type="button"
                                  onClick={() => {
                                    setSettings({ ...settings, ui_background_color: tone.id });
                                    document.body.style.backgroundColor = tone.id;
                                  }}
                                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                                    isSelected 
                                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/30 shadow-md scale-105' 
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`h-6 w-full rounded-lg ${tone.bg} border ${tone.border} shadow-inner`} />
                                  <span className="text-[9px] font-bold text-slate-700 truncate w-full">{tone.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom Hex Color Picker */}
                          <div className="flex items-center gap-2 pt-1">
                            <label className="text-xs text-slate-600 font-semibold">Custom HEX Color:</label>
                            <input
                              type="color"
                              value={settings.ui_background_color || '#f8fafc'}
                              onChange={(e) => {
                                setSettings({ ...settings, ui_background_color: e.target.value });
                                document.body.style.backgroundColor = e.target.value;
                              }}
                              className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                            />
                            <input
                              type="text"
                              value={settings.ui_background_color || '#f8fafc'}
                              onChange={(e) => {
                                setSettings({ ...settings, ui_background_color: e.target.value });
                                document.body.style.backgroundColor = e.target.value;
                              }}
                              className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                              placeholder="#f8fafc"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 6: ATTENDANCE */}
                    {activeTab === 'attendance' && (
                      <div className="space-y-3.5 animate-in fade-in">
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900">Attendance Policy & Manager Handshake Rules</h4>
                          <p className="text-[11px] text-slate-500">Configure showroom employee shifts, grace period and 2FA</p>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Enable Attendance Module</div>
                            <div className="text-[11px] text-slate-500">Track check-ins & showroom staff presence</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPolicy({ ...policy, is_enabled: !policy.is_enabled })}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            {policy.is_enabled ? (
                              <ToggleRight className="h-8 w-8 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Require Store Manager Handshake (2FA)</div>
                            <div className="text-[11px] text-slate-500">Salesman check-in must be confirmed via QR/PIN</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPolicy({ ...policy, require_manager_handshake: !policy.require_manager_handshake })}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            {policy.require_manager_handshake ? (
                              <ToggleRight className="h-8 w-8 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700">Shift Start Time (HH:MM):</label>
                            <input
                              type="time"
                              value={policy.shift_start_time}
                              onChange={(e) => setPolicy({ ...policy, shift_start_time: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700">Shift End Time (HH:MM):</label>
                            <input
                              type="time"
                              value={policy.shift_end_time}
                              onChange={(e) => setPolicy({ ...policy, shift_end_time: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700">Grace Period (Minutes):</label>
                            <input
                              type="number"
                              value={policy.grace_period_minutes}
                              onChange={(e) => setPolicy({ ...policy, grace_period_minutes: parseInt(e.target.value) || 0 })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-emerald-700 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500">Late after {policy.grace_period_minutes}m</span>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700">Half-Day Threshold (Mins):</label>
                            <input
                              type="number"
                              value={policy.half_day_late_minutes}
                              onChange={(e) => setPolicy({ ...policy, half_day_late_minutes: parseInt(e.target.value) || 0 })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500">&gt; {policy.half_day_late_minutes}m = half-day</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Live Preview Column */}
                  <div className="lg:col-span-5 bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span>Real-Time Visual Preview</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('receipt')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            previewMode === 'receipt'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('barcode')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            previewMode === 'barcode'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Barcode Tag
                        </button>
                      </div>
                    </div>

                    {/* THERMAL RECEIPT LIVE PREVIEW */}
                    {previewMode === 'receipt' ? (
                      <div className="w-full max-w-[280px] bg-white p-3.5 shadow-md border border-slate-300 font-mono text-[10px] text-slate-900 leading-tight">
                        <div className="text-center border-b border-dashed border-slate-400 pb-2">
                          <div className="font-black text-xs uppercase tracking-wider">
                            {settings.receipt_header || 'SHOP NAME'}
                          </div>
                          <div className="text-[9px] font-semibold text-slate-700 mt-0.5">
                            {settings.receipt_tagline || 'Outlet / Showroom'}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {settings.receipt_address || 'Showroom Address'}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Tel: {settings.receipt_phone || '+880 1811-000000'}
                          </div>
                          {settings.receipt_vat_no && (
                            <div className="text-[9px] font-bold text-slate-700 mt-0.5">
                              {settings.receipt_vat_no}
                            </div>
                          )}
                        </div>

                        <div className="py-1.5 border-b border-dashed border-slate-400 text-[9px] space-y-0.5">
                          <div className="flex justify-between">
                            <span>Inv: <strong>INV-DHK01-2026-001</strong></span>
                            <span>{new Date().toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cashier: Counter-1</span>
                            {settings.receipt_show_salesman && <span>Rep: Tanvir</span>}
                          </div>
                        </div>

                        <div className="py-1.5 border-b border-dashed border-slate-400 text-[9px]">
                          <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5 uppercase">
                            <span>Item</span>
                            <span>Total</span>
                          </div>
                          <div className="mt-1">
                            <div className="font-bold">Oxford Cotton Slim Shirt</div>
                            <div className="flex justify-between text-slate-600">
                              <span>Size: L | Navy • 1 x 1,850</span>
                              <span className="font-bold text-slate-900">1,850 ৳</span>
                            </div>
                          </div>
                        </div>

                        <div className="py-1.5 border-b border-dashed border-slate-400 text-[9px] space-y-0.5">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>1,850 ৳</span>
                          </div>
                          {settings.is_vat_enabled && settings.receipt_show_tax && (
                            <div className="flex justify-between">
                              <span>VAT ({settings.vat_percentage}%):</span>
                              <span>+{Math.round((1850 * settings.vat_percentage) / 100)} ৳</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
                            <span>NET PAYABLE:</span>
                            <span>
                              {(1850 + (settings.is_vat_enabled ? Math.round((1850 * settings.vat_percentage) / 100) : 0)).toLocaleString()} ৳
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 text-center text-[8px] text-slate-600 space-y-1">
                          <div className="font-bold text-slate-900">
                            {settings.receipt_exchange_policy || '*** 7 DAYS EXCHANGE ***'}
                          </div>
                          <div>{settings.receipt_footer_note || 'Thank you for shopping!'}</div>
                          {settings.receipt_show_barcode && (
                            <div className="pt-1 tracking-[2px] font-mono text-[9px] font-bold text-slate-800">
                              *INV-DHK01-2026-001*
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* BARCODE HANGTAG LIVE PREVIEW */
                      <div className="w-full max-w-[240px] bg-white p-3 rounded-2xl shadow-md border-2 border-slate-900 text-center font-sans">
                        <div className="font-black text-xs tracking-wider uppercase text-slate-900">
                          {settings.barcode_brand_title || 'BRAND'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-semibold">
                          {settings.barcode_tagline || 'Quality Garments'}
                        </div>

                        <div className="my-2 border-t border-b border-dashed border-slate-300 py-1.5">
                          <div className="text-[11px] font-extrabold text-slate-900">Premium Oxford Shirt</div>
                          {settings.barcode_show_size_color && (
                            <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                              SIZE: L • COLOR: NAVY
                            </div>
                          )}
                          <div className="text-[9px] text-slate-400 font-mono">SKU: SHT-OXF-NVY-L</div>
                        </div>

                        <div className="py-1 flex flex-col items-center justify-center">
                          <div className="flex items-center gap-[2px] h-8">
                            {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2].map((w, i) => (
                              <span key={i} className="bg-slate-900 h-full inline-block" style={{ width: `${w}px` }} />
                            ))}
                          </div>
                          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-900 mt-0.5">
                            8901001002
                          </div>
                        </div>

                        <div className="mt-1">
                          {settings.barcode_show_mrp && (
                            <div className="text-[10px] text-slate-400 line-through">MRP: 2,200 ৳</div>
                          )}
                          {settings.barcode_show_price && (
                            <div className="text-sm font-black text-slate-900">
                              Price: 1,850 ৳
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 text-[8px] text-slate-500 font-mono border-t border-slate-100 pt-1">
                          {settings.barcode_footer_note || 'Customer Care: 01711-000111'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Bottom Save Bar */}
                  <div className="lg:col-span-12 flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                    <div>
                      {saveSuccess && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl animate-in fade-in">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Customizations saved & updated live!</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Saving...' : 'Save All Customizations'}</span>
                      </button>
                    </div>
                  </div>

                </form>
              )}

              {/* TAB 4: SHOWROOMS MANAGEMENT (Create, Edit, Delete) */}
              {activeTab === 'showrooms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Showroom Outlets & Warehouse Hubs</h4>
                      <p className="text-[11px] text-slate-500">Create, edit and manage branches across all locations</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBranch(null);
                        setBranchFormData({ name: '', code: '', address: '', phone: '', is_warehouse: false });
                        setShowAddBranchModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create New Showroom</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {showroomList.map((b) => (
                      <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                              {b.code}
                            </span>
                            <span className={`text-[10px] font-bold ${b.is_warehouse ? 'text-purple-700' : 'text-emerald-700'}`}>
                              {b.is_warehouse ? 'Central Warehouse' : 'Showroom Outlet'}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm mt-2">{b.name}</h5>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            <MapPin className="inline h-3.5 w-3.5 text-slate-400 mr-1" />
                            {b.address || 'Address not configured'}
                          </div>
                          {b.phone && (
                            <div className="text-xs text-slate-500 mt-1">
                              <Phone className="inline h-3 w-3 text-slate-400 mr-1" />
                              {b.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBranch(b);
                              setBranchFormData({
                                name: b.name,
                                code: b.code,
                                address: b.address || '',
                                phone: b.phone || '',
                                is_warehouse: b.is_warehouse
                              });
                              setShowAddBranchModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit showroom"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(b.id, b.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete showroom"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: STAFF & ACCOUNTS (Add, Edit, Delete, Passwords) */}
              {activeTab === 'staff' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Showroom Staff & Employee Accounts</h4>
                      <p className="text-[11px] text-slate-500">Create login credentials, assign showroom branches and commissions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(null);
                        setStaffFormData({
                          full_name: '',
                          email: '',
                          phone: '',
                          role: 'SALESMAN',
                          password: '',
                          branch_id: showroomList[0]?.id || '',
                          department: 'Sales',
                          base_salary: 18000,
                          commission_rate: 2.5,
                          manager_pin: '1234'
                        });
                        setShowAddStaffModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add New Staff Account</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-3 px-3">Staff Name & Code</th>
                          <th className="py-3 px-3">Role</th>
                          <th className="py-3 px-3">Showroom Branch</th>
                          <th className="py-3 px-3">Contact Email/Phone</th>
                          <th className="py-3 px-3 text-right">Commission</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffList.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{st.full_name}</div>
                              <div className="text-[10px] font-mono text-emerald-700">{st.employee_code}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {st.role}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              {st.branch_name || 'Headquarters'}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <div>{st.email}</div>
                              <div className="text-[10px] text-slate-400">{st.phone || 'No mobile'}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {st.profile?.commission_rate || 2.0}%
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStaff(st);
                                    setStaffFormData({
                                      full_name: st.full_name,
                                      email: st.email,
                                      phone: st.phone || '',
                                      role: st.role,
                                      password: '',
                                      branch_id: st.branch_id || '',
                                      department: st.profile?.department || 'Sales',
                                      base_salary: st.profile?.base_salary || 18000,
                                      commission_rate: st.profile?.commission_rate || 2.5,
                                      manager_pin: '1234'
                                    });
                                    setShowAddStaffModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                  title="Edit staff"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(st.id, st.full_name)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                  title="Deactivate staff"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* MODAL: ADD / EDIT SHOWROOM BRANCH */}
        {showAddBranchModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-base">
                  {editingBranch ? 'Edit Showroom Details' : 'Create New Showroom / Branch'}
                </h4>
                <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleSaveBranch} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Showroom Name:</label>
                  <input
                    type="text"
                    required
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    placeholder="e.g. Mirpur-10 Showroom"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Showroom Code:</label>
                    <input
                      type="text"
                      required
                      value={branchFormData.code}
                      onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value })}
                      placeholder="e.g. MIR03"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contact Phone:</label>
                    <input
                      type="text"
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                      placeholder="+880 1811-000000"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Address Location:</label>
                  <input
                    type="text"
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    placeholder="e.g. Plot 4, Block D, Mirpur-10, Dhaka"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchFormData.is_warehouse}
                    onChange={(e) => setBranchFormData({ ...branchFormData, is_warehouse: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-semibold">This is a Central Storage Warehouse (Not Retail Showroom)</span>
                </label>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBranchModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    Save Showroom
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT STAFF LOGIN ACCOUNT */}
        {showAddStaffModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-base">
                  {editingStaff ? `Edit Staff Account: ${editingStaff.full_name}` : 'Create New Employee & Login Account'}
                </h4>
                <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleSaveStaff} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name:</label>
                    <input
                      type="text"
                      required
                      value={staffFormData.full_name}
                      onChange={(e) => setStaffFormData({ ...staffFormData, full_name: e.target.value })}
                      placeholder="e.g. Rakibul Islam"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Role / Designation:</label>
                    <select
                      value={staffFormData.role}
                      onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="SALESMAN">Floor Salesman (Incentive Tracked)</option>
                      <option value="CASHIER">Cashier Counter</option>
                      <option value="STORE_MANAGER">Store Manager (Handshake Approver)</option>
                      <option value="INVENTORY_CLERK">Inventory & Warehouse Clerk</option>
                      <option value="STORE_OWNER">Store Owner / HQ Executive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Login Email / Username:</label>
                    <input
                      type="email"
                      required
                      value={staffFormData.email}
                      onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                      placeholder="sales.rakib@vogue.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Mobile Phone:</label>
                    <input
                      type="tel"
                      value={staffFormData.phone}
                      onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                      placeholder="+880 1711-223344"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      {editingStaff ? 'Reset Password (Leave blank to keep):' : 'Login Password:'}
                    </label>
                    <input
                      type="password"
                      value={staffFormData.password}
                      onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Assigned Showroom:</label>
                    <select
                      value={staffFormData.branch_id}
                      onChange={(e) => setStaffFormData({ ...staffFormData, branch_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      {showroomList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Base Monthly Salary (৳):</label>
                    <input
                      type="number"
                      value={staffFormData.base_salary}
                      onChange={(e) => setStaffFormData({ ...staffFormData, base_salary: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Sales Commission Rate (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={staffFormData.commission_rate}
                      onChange={(e) => setStaffFormData({ ...staffFormData, commission_rate: parseFloat(e.target.value) || 0 })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-emerald-700 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    Save Staff Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}

