import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Clock, 
  Save, 
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
  MapPin,
  ArrowLeft,
  RefreshCw,
  Check,
  DollarSign,
  AlertCircle,
  Smartphone,
  Send,
  Target,
  Award,
  TrendingUp,
  Zap,
  ExternalLink,
  MessageSquare,
  Copy,
  Globe,
  ShoppingBag
} from 'lucide-react';
import { tenantApi, employeeApi, posApi, ecommerceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function RealisticBarcode({ code = "894001239841", height = 32, showText = true, className = "" }) {
  const barSequence = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 4, 2, 1, 2,
    1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 4, 1, 2, 1, 2, 3, 1, 2, 1, 1, 3,
    2, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1
  ];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="flex items-stretch justify-center bg-white px-2.5 py-1 border border-slate-300 rounded shadow-xs"
        style={{ height: `${height}px` }}
      >
        {barSequence.map((width, idx) => (
          <span
            key={idx}
            className={`${idx % 2 === 0 ? 'bg-black' : 'bg-transparent'} inline-block h-full`}
            style={{ width: `${Math.max(1, width)}px` }}
          />
        ))}
      </div>
      {showText && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-900 mt-1">
          {code}
        </span>
      )}
    </div>
  );
}

export default function StoreSettingsView({ onBack }) {
  const { tenant, branches, selectedBranch, refreshTenant } = useAuth();
  const [activeTab, setActiveTab] = useState('receipt'); // receipt, barcode, ui, showrooms, staff, attendance
  const [previewMode, setPreviewMode] = useState('receipt'); // receipt, barcode

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tenant General & Print/UI/VAT/Dimension Settings
  // Tenant General & Print/UI/VAT/Dimension Settings
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
    receipt_paper_size: '80mm', // '80mm' | '58mm' | 'a4' | 'a5' | 'custom'
    receipt_width_mm: 80,
    receipt_font_scale: 'standard', // 'compact' | 'standard' | 'large'
    barcode_brand_title: 'VOGUE FASHION',
    barcode_tagline: 'Quality Garments',
    barcode_footer_note: 'Hotline: 01711-000111',
    barcode_show_price: true,
    barcode_show_mrp: true,
    barcode_show_size_color: true,
    barcode_label_size: '38x25', // '38x25' | '50x30' | '50x50' | '100x50' | 'custom'
    barcode_width_mm: 38,
    barcode_height_mm: 25,
    barcode_bar_height: 36, // 24 | 36 | 48
    ui_background_color: '#f8fafc',
    openwa_server_url: '',
    openwa_api_key: '',
    openwa_auto_send: false,
    openwa_default_country_code: '880'
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

  // Incentives & Targets State
  const [incentivesData, setIncentivesData] = useState(null);
  const [incentivesLoading, setIncentivesLoading] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [incentiveEdits, setIncentiveEdits] = useState({});
  const [incentiveSaving, setIncentiveSaving] = useState(false);
  const [incentiveSavedToast, setIncentiveSavedToast] = useState(false);

  // WhatsApp Testing State
  const [testPhone, setTestPhone] = useState('');
  const [testMsgLoading, setTestMsgLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // E-Commerce Storefront & Custom Domain Settings
  const [ecomCustomDomain, setEcomCustomDomain] = useState('');
  const [ecomSettings, setEcomSettings] = useState({
    is_enabled: true,
    store_title: '',
    tagline: '',
    announcement_bar: '',
    hero_headline: '',
    hero_subheadline: '',
    hero_badge: 'NEW SEASON 2026',
    hero_image: '',
    whatsapp_number: '',
    hotline_number: '',
    delivery_inside_dhaka: 60,
    delivery_outside_dhaka: 120,
    free_delivery_min_order: 2000,
    bkash_number: '',
    nagad_number: '',
    facebook_url: '',
    instagram_url: '',
    address: ''
  });
  const [ecomSaving, setEcomSaving] = useState(false);
  const [ecomSaveSuccess, setEcomSaveSuccess] = useState(false);

  useEffect(() => {
    loadAllData();
    loadEcomSettings();
  }, [tenant]);

  const loadEcomSettings = async () => {
    try {
      const data = await ecommerceApi.getSettings();
      setEcomCustomDomain(data.custom_domain || '');
      if (data.ecommerce_settings) {
        setEcomSettings(prev => ({ ...prev, ...data.ecommerce_settings }));
      }
    } catch (err) {
      console.error('Failed to load e-commerce settings:', err);
    }
  };

  const handleSaveEcomSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setEcomSaving(true);
      await ecommerceApi.updateSettings({
        custom_domain: ecomCustomDomain.trim() || null,
        ecommerce_settings: ecomSettings
      });
      await refreshTenant();
      setEcomSaveSuccess(true);
      setTimeout(() => setEcomSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save e-commerce settings: ' + err.message);
    } finally {
      setEcomSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'incentives') {
      loadIncentives(selectedMonthYear);
    }
  }, [activeTab, selectedMonthYear]);

  const loadIncentives = async (month) => {
    try {
      setIncentivesLoading(true);
      const data = await employeeApi.getIncentivesOverview(month || selectedMonthYear);
      setIncentivesData(data);
      const initialEdits = {};
      (data.staff || []).forEach(s => {
        initialEdits[s.user_id] = {
          commission_rate: s.commission_rate,
          base_salary: s.base_salary,
          target_amount: s.target_amount,
          bonus_on_achieve: s.bonus_on_achieve
        };
      });
      setIncentiveEdits(initialEdits);
    } catch (err) {
      console.error("Failed to load incentives:", err);
    } finally {
      setIncentivesLoading(false);
    }
  };

  const handleIncentiveFieldChange = (userId, field, val) => {
    setIncentiveEdits(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: parseFloat(val) || 0
      }
    }));
  };

  const handleSaveIncentives = async () => {
    try {
      setIncentiveSaving(true);
      const updates = Object.entries(incentiveEdits).map(([user_id, vals]) => ({
        user_id,
        ...vals
      }));
      await employeeApi.bulkUpdateIncentives({
        month_year: selectedMonthYear,
        staff_updates: updates
      });
      setIncentiveSavedToast(true);
      setTimeout(() => setIncentiveSavedToast(false), 3000);
      await loadIncentives(selectedMonthYear);
    } catch (err) {
      alert(err.message || "Failed to save incentives");
    } finally {
      setIncentiveSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      alert("Please enter a mobile number with country code (e.g. 8801711223344)");
      return;
    }
    try {
      setTestMsgLoading(true);
      setTestResult(null);
      const res = await posApi.testWhatsAppConnection({
        server_url: settings.openwa_server_url,
        api_key: settings.openwa_api_key,
        test_phone: testPhone.trim(),
        test_message: `✅ *${settings.name || tenant?.name || 'OmniFlow POS'}*\nWhatsApp OpenWA Gateway is active & connected successfully!`
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestMsgLoading(false);
    }
  };

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
    if (e) e.preventDefault();
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

  const tabs = [
    { id: 'receipt', label: 'Receipts', icon: Receipt },
    { id: 'barcode', label: 'Hangtags', icon: BarcodeIcon },
    { id: 'ecommerce', label: '🌐 Online Store & Domain', icon: Globe },
    { id: 'incentives', label: 'Sales Incentives', icon: Target },
    { id: 'whatsapp', label: 'WhatsApp / OpenWA', icon: Smartphone },
    { id: 'ui', label: 'Theme & VAT', icon: Palette },
    { id: 'showrooms', label: `Outlets (${showroomList.length})`, icon: Building2 },
    { id: 'staff', label: `Staff (${staffList.length})`, icon: Users },
    { id: 'attendance', label: '2FA Shifts', icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-4 pb-28 md:pb-12 animate-in fade-in duration-300">
      
      {/* 1. Header Banner (Compact & Clean) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Sliders className="h-3.5 w-3.5" />
              </span>
              <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
                Store Settings & Controls
              </h1>
              <span className="hidden sm:inline rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 border border-emerald-200 truncate max-w-[140px]">
                {tenant?.name || "OmniFlow"}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">
              Thermal Receipts, Barcodes, Showrooms & Staff Policies
            </p>
          </div>
        </div>

        {/* Action button */}
        {['receipt', 'barcode', 'ui', 'attendance'].includes(activeTab) && (
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>
        )}
      </div>

      {/* 2. Zero-Overflow Responsive Tab Grid (Fits 100% on Mobile with ZERO Horizontal Scroll) */}
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'receipt' || tab.id === 'barcode') setPreviewMode(tab.id);
              }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-2xl p-2 sm:px-3 sm:py-2.5 text-center sm:text-left transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md font-bold scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] sm:text-xs font-bold truncate leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Content Area */}
      <div className="mt-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading store controls...</span>
          </div>
        ) : (
          <div>
            
            {/* ========================================================= */}
            {/* TAB 1: RECEIPT SLIP */}
            {/* ========================================================= */}
            {activeTab === 'receipt' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                {/* Left Form */}
                <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Thermal Receipt Header & Footer Customization</h3>
                    <p className="text-xs text-slate-500">Edit shop names, hotline, return policy, and thermal slip toggles</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Receipt Shop Header Name:</label>
                      <input
                        type="text"
                        value={settings.receipt_header}
                        onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="e.g. VOGUE LIFESTYLE RETAIL"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Tagline / Sub-header:</label>
                      <input
                        type="text"
                        value={settings.receipt_tagline}
                        onChange={(e) => setSettings({ ...settings, receipt_tagline: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="e.g. Premium Fashion & Apparel"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Store Showroom Address:</label>
                      <input
                        type="text"
                        value={settings.receipt_address}
                        onChange={(e) => setSettings({ ...settings, receipt_address: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="e.g. House 42, Road 7/A, Dhanmondi, Dhaka"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Receipt Phone / Helpline:</label>
                      <input
                        type="text"
                        value={settings.receipt_phone}
                        onChange={(e) => setSettings({ ...settings, receipt_phone: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. BIN: 002345678-0101"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Exchange / Return Policy Note:</label>
                    <input
                      type="text"
                      value={settings.receipt_exchange_policy}
                      onChange={(e) => setSettings({ ...settings, receipt_exchange_policy: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. *** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Footer Thank You Message:</label>
                    <textarea
                      rows={2}
                      value={settings.receipt_footer_note}
                      onChange={(e) => setSettings({ ...settings, receipt_footer_note: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. Thank you for shopping with us! Please visit again."
                    />
                  </div>

                  {/* Paper Dimensions & Layout Settings */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Thermal Paper Width & Slip Size
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {settings.receipt_paper_size || '80mm'} ({settings.receipt_width_mm || 80}mm)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: '80mm', label: '80mm Standard', desc: 'POS Counter Roll', width: 80, scale: 'standard' },
                        { id: '58mm', label: '58mm Compact', desc: 'Mini Bluetooth Roll', width: 58, scale: 'compact' },
                        { id: 'a5', label: 'A5 Voucher', desc: 'Half-Page Sheet', width: 148, scale: 'standard' },
                        { id: 'a4', label: 'A4 Tax Invoice', desc: 'Full-Page Sheet', width: 210, scale: 'large' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              receipt_paper_size: preset.id,
                              receipt_width_mm: preset.width,
                              receipt_font_scale: preset.scale
                            });
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            settings.receipt_paper_size === preset.id
                              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-black">{preset.label}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{preset.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Custom Paper Width (mm):</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            min="40"
                            max="300"
                            value={settings.receipt_width_mm || 80}
                            onChange={(e) => setSettings({
                              ...settings,
                              receipt_width_mm: parseInt(e.target.value) || 80,
                              receipt_paper_size: 'custom'
                            })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none pr-10"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">mm</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Print Typography Scale:</label>
                        <select
                          value={settings.receipt_font_scale || 'standard'}
                          onChange={(e) => setSettings({ ...settings, receipt_font_scale: e.target.value })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        >
                          <option value="compact">Compact (Dense 10pt)</option>
                          <option value="standard">Standard (Clear 12pt)</option>
                          <option value="large">Large (High-Visibility 14pt)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Preview */}
                <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 sticky top-20 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span>Live {settings.receipt_width_mm || 80}mm Receipt Preview</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                      {settings.receipt_paper_size || '80mm'}
                    </span>
                  </div>

                  <div 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-slate-900 space-y-2 shadow-inner transition-all duration-300"
                    style={{
                      maxWidth: (settings.receipt_paper_size === '58mm' || (settings.receipt_width_mm && settings.receipt_width_mm <= 60))
                        ? '280px' 
                        : (settings.receipt_paper_size === 'a5' || (settings.receipt_width_mm && settings.receipt_width_mm > 100 && settings.receipt_width_mm <= 160))
                        ? '400px'
                        : (settings.receipt_paper_size === 'a4' || (settings.receipt_width_mm && settings.receipt_width_mm > 160))
                        ? '460px'
                        : '340px',
                      fontSize: settings.receipt_font_scale === 'compact' ? '10px' : settings.receipt_font_scale === 'large' ? '12px' : '11px'
                    }}
                  >
                    <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                      <div className="font-black text-sm uppercase tracking-wide">{settings.receipt_header || 'VOGUE LIFESTYLE'}</div>
                      <div className="text-[10px] text-slate-600">{settings.receipt_tagline}</div>
                      <div className="text-[10px] text-slate-500">{settings.receipt_address}</div>
                      <div className="text-[10px] text-slate-500">{settings.receipt_phone}</div>
                      {settings.receipt_vat_no && (
                        <div className="text-[10px] font-bold text-slate-700 mt-1">{settings.receipt_vat_no}</div>
                      )}
                    </div>

                    <div className="text-[10px] space-y-0.5 py-1 text-slate-600 border-b border-dashed border-slate-300">
                      <div className="flex justify-between"><span>Inv: #INV-2026-0042</span><span>04 Oct 2026 05:30 PM</span></div>
                      {settings.receipt_show_salesman && (
                        <div className="flex justify-between"><span>Salesman: Tanvir (EMP-004)</span><span>Counter: POS-01</span></div>
                      )}
                    </div>

                    <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                      <div className="flex justify-between font-bold">
                        <span>Panjabi Premium (L / Blue)</span>
                        <span>৳ 2,450</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>1 x ৳ 2,450 (DISC: ৳ 0)</span>
                        <span>SKU: PAN-BLU-L</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-right pt-1 font-bold">
                      <div className="flex justify-between"><span>Subtotal:</span><span>৳ 2,450.00</span></div>
                      {settings.receipt_show_tax && (
                        <div className="flex justify-between text-slate-600"><span>VAT (5%):</span><span>৳ 122.50</span></div>
                      )}
                      <div className="flex justify-between text-xs font-black border-t border-dashed border-slate-400 pt-1">
                        <span>Net Payable:</span>
                        <span>৳ 2,572.50</span>
                      </div>
                    </div>

                    <div className="text-center border-t border-dashed border-slate-300 pt-3 space-y-1 text-[10px]">
                      <div className="font-bold text-slate-800">{settings.receipt_exchange_policy}</div>
                      <div className="text-slate-500">{settings.receipt_footer_note}</div>
                      {settings.receipt_show_barcode && (
                        <div className="pt-2 flex flex-col items-center">
                          <RealisticBarcode code="INV-2026-0042" height={28} showText={true} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: HANGTAG & BARCODE */}
            {/* ========================================================= */}
            {activeTab === 'barcode' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                {/* Form */}
                <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Hangtag Barcode Label Template</h3>
                    <p className="text-xs text-slate-500">Customize labels printed for clothing items and boutique hangtags</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Hangtag Brand Header Text:</label>
                    <input
                      type="text"
                      value={settings.barcode_brand_title}
                      onChange={(e) => setSettings({ ...settings, barcode_brand_title: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. VOGUE FASHION"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Sub-tagline / Quality Note:</label>
                    <input
                      type="text"
                      value={settings.barcode_tagline}
                      onChange={(e) => setSettings({ ...settings, barcode_tagline: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. Premium Cotton Collection"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Customer Care Helpline / Barcode Footer:</label>
                    <input
                      type="text"
                      value={settings.barcode_footer_note}
                      onChange={(e) => setSettings({ ...settings, barcode_footer_note: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. Customer Care: 01711-000111"
                    />
                  </div>

                  {/* Barcode Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/80">
                      <input
                        type="checkbox"
                        checked={settings.barcode_show_price}
                        onChange={(e) => setSettings({ ...settings, barcode_show_price: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-semibold">Show Selling Price</span>
                    </label>
                    <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/80">
                      <input
                        type="checkbox"
                        checked={settings.barcode_show_mrp}
                        onChange={(e) => setSettings({ ...settings, barcode_show_mrp: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-semibold">Show (Incl. VAT)</span>
                    </label>
                    <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/80">
                      <input
                        type="checkbox"
                        checked={settings.barcode_show_size_color}
                        onChange={(e) => setSettings({ ...settings, barcode_show_size_color: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-semibold">Show Size & Color</span>
                    </label>
                  </div>

                  {/* Label Dimensions & Size Settings */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Hangtag & Sticker Dimensions
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {settings.barcode_width_mm || 38}mm × {settings.barcode_height_mm || 25}mm
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: '38x25', label: '38mm × 25mm', desc: 'Standard Apparel Tag', w: 38, h: 25, barH: 30 },
                        { id: '50x30', label: '50mm × 30mm', desc: 'Medium Garment Tag', w: 50, h: 30, barH: 36 },
                        { id: '50x50', label: '50mm × 50mm', desc: 'Square Hangtag', w: 50, h: 50, barH: 42 },
                        { id: '100x50', label: '100mm × 50mm', desc: 'Large Box Sticker', w: 100, h: 50, barH: 48 },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              barcode_label_size: preset.id,
                              barcode_width_mm: preset.w,
                              barcode_height_mm: preset.h,
                              barcode_bar_height: preset.barH
                            });
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            settings.barcode_label_size === preset.id
                              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-black">{preset.label}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{preset.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Tag Width (mm):</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            min="20"
                            max="150"
                            value={settings.barcode_width_mm || 38}
                            onChange={(e) => setSettings({
                              ...settings,
                              barcode_width_mm: parseInt(e.target.value) || 38,
                              barcode_label_size: 'custom'
                            })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none pr-10"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">mm</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Tag Height (mm):</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            min="15"
                            max="150"
                            value={settings.barcode_height_mm || 25}
                            onChange={(e) => setSettings({
                              ...settings,
                              barcode_height_mm: parseInt(e.target.value) || 25,
                              barcode_label_size: 'custom'
                            })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none pr-10"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">mm</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Barcode Line Height:</label>
                        <select
                          value={settings.barcode_bar_height || 36}
                          onChange={(e) => setSettings({ ...settings, barcode_bar_height: parseInt(e.target.value) || 36 })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        >
                          <option value="24">Compact (24px)</option>
                          <option value="36">Standard (36px)</option>
                          <option value="48">Tall (48px)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Preview */}
                <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 sticky top-20 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span>Live {settings.barcode_width_mm || 38}mm × {settings.barcode_height_mm || 25}mm Hangtag</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                      {settings.barcode_width_mm || 38}x{settings.barcode_height_mm || 25}mm
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-center p-4 sm:p-6 bg-slate-100/70 rounded-2xl border border-dashed border-slate-200">
                    <div 
                      className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 shadow-md text-center font-sans space-y-1.5 transition-all duration-300"
                      style={{
                        maxWidth: (settings.barcode_width_mm && settings.barcode_width_mm >= 80)
                          ? '340px'
                          : (settings.barcode_width_mm && settings.barcode_width_mm >= 50)
                          ? '290px'
                          : '250px'
                      }}
                    >
                      <div className="font-black text-xs uppercase tracking-wider text-slate-900">
                        {settings.barcode_brand_title || 'VOGUE FASHION'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold">{settings.barcode_tagline}</div>
                      
                      <div className="text-[11px] font-bold text-slate-800">
                        Formal Cotton Shirt
                      </div>

                      {settings.barcode_show_size_color && (
                        <div className="flex items-center justify-center gap-3 text-[10px] font-mono font-bold text-slate-700 bg-slate-50 py-1 rounded border border-slate-100">
                          <span>SIZE: XL</span>
                          <span>COLOR: Navy Blue</span>
                        </div>
                      )}

                      <div className="py-1 flex flex-col items-center">
                        <RealisticBarcode 
                          code="894001239841" 
                          height={settings.barcode_bar_height || 36} 
                          showText={true} 
                        />
                      </div>

                      {settings.barcode_show_price && (
                        <div className="text-sm font-black text-emerald-800">
                          MRP: ৳ 1,850.00 {settings.barcode_show_mrp && <span className="text-[9px] font-normal text-slate-500">(Incl. VAT)</span>}
                        </div>
                      )}

                      <div className="text-[8px] text-slate-400 font-mono border-t border-slate-100 pt-1">
                        {settings.barcode_footer_note}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: THEME & VAT */}
            {/* ========================================================= */}
            {activeTab === 'ui' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Brand UI Theme & Workspace Background</h3>
                    <p className="text-xs text-slate-500">Pick an Apple-inspired theme palette or custom background</p>
                  </div>

                  {/* Preset UI Theme Palettes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Quick Palette Presets:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: 'Emerald Modern', color: '#10b981', bg: '#f8fafc' },
                        { label: 'Apple Space Gray', color: '#64748b', bg: '#f1f5f9' },
                        { label: 'Titanium Slate', color: '#0284c7', bg: '#f8fafc' },
                        { label: 'Desert Gold', color: '#d97706', bg: '#fffbeb' },
                      ].map((preset, pi) => (
                        <button
                          key={pi}
                          type="button"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              ui_background_color: preset.bg,
                            });
                          }}
                          className="flex flex-col items-center p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-center transition-all group"
                        >
                          <span className="h-5 w-5 rounded-full shadow-sm mb-1.5 border" style={{ backgroundColor: preset.color }} />
                          <span className="text-[11px] font-bold text-slate-800">{preset.label}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{preset.bg}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Background Color Custom Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-700">Custom Workstation Background Color:</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.ui_background_color || '#f8fafc'}
                        onChange={(e) => setSettings({ ...settings, ui_background_color: e.target.value })}
                        className="h-10 w-14 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                      />
                      <input
                        type="text"
                        value={settings.ui_background_color || '#f8fafc'}
                        onChange={(e) => setSettings({ ...settings, ui_background_color: e.target.value })}
                        className="w-36 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* VAT Configuration */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Government VAT & Tax Rules</h4>
                    
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.is_vat_enabled}
                        onChange={(e) => setSettings({ ...settings, is_vat_enabled: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div>
                        <div className="font-bold">Enable VAT Calculation in POS Checkouts</div>
                        <div className="text-[10px] text-slate-500">Applies automatic VAT percentage on non-exempt garments</div>
                      </div>
                    </label>

                    {settings.is_vat_enabled && (
                      <div className="w-full sm:w-64">
                        <label className="text-xs font-bold text-slate-700">Standard VAT Percentage (%):</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={settings.vat_percentage}
                            onChange={(e) => setSettings({ ...settings, vat_percentage: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Info */}
                <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Workspace Visual Scope</span>
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Themes configured here apply instantaneously across all POS terminals, cash registers, and showroom dashboards assigned to this brand.
                  </p>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-[11px] text-emerald-800">
                    <span className="font-bold">Multi-Tenant Isolation Active:</span> Your styles and receipts will never overlap with other merchant tenants on the platform.
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: SHOWROOMS & OUTLETS */}
            {/* ========================================================= */}
            {activeTab === 'showrooms' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Showrooms & Central Warehouses ({showroomList.length})</h3>
                    <p className="text-xs text-slate-500">Manage physical retail branch locations and warehouse distribution points</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBranch(null);
                      setBranchFormData({ name: '', code: '', address: '', phone: '', is_warehouse: false });
                      setShowAddBranchModal(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Showroom</span>
                  </button>
                </div>

                {/* Showrooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {showroomList.map((branch) => (
                    <div key={branch.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${branch.is_warehouse ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{branch.name}</h4>
                              <span className="text-[10px] font-mono font-bold text-slate-500">{branch.code}</span>
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${branch.is_warehouse ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {branch.is_warehouse ? 'Warehouse' : 'Showroom'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                          {branch.address && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{branch.address}</span>
                            </div>
                          )}
                          {branch.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{branch.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBranch(branch);
                            setBranchFormData({
                              name: branch.name || '',
                              code: branch.code || '',
                              address: branch.address || '',
                              phone: branch.phone || '',
                              is_warehouse: branch.is_warehouse || false
                            });
                            setShowAddBranchModal(true);
                          }}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id, branch.name)}
                          className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: STAFF ACCOUNTS */}
            {/* ========================================================= */}
            {activeTab === 'staff' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Staff Accounts & Access Controls ({staffList.length})</h3>
                    <p className="text-xs text-slate-500">Configure roles for Managers, Cashiers, Salesmen, and Warehouse Staff</p>
                  </div>
                  <button
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
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add New Staff</span>
                  </button>
                </div>

                {/* Staff List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffList.map((emp) => (
                    <div key={emp.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-800 text-xs">
                              {emp.role?.substring(0, 3)}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{emp.full_name}</h4>
                              <span className="text-[10px] font-mono font-bold text-emerald-700">{emp.employee_code}</span>
                            </div>
                          </div>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {emp.role}
                          </span>
                        </div>

                        <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                          {emp.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium pt-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Assigned: {showroomList.find(b => b.id === emp.branch_id)?.name || 'HQ Outlet'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Comm: {emp.commission_rate || 0}%</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingStaff(emp);
                              setStaffFormData({
                                full_name: emp.full_name || '',
                                email: emp.email || '',
                                phone: emp.phone || '',
                                role: emp.role || 'SALESMAN',
                                password: '',
                                branch_id: emp.branch_id || showroomList[0]?.id || '',
                                department: emp.department || 'Sales',
                                base_salary: emp.base_salary || 18000,
                                commission_rate: emp.commission_rate || 2.5,
                                manager_pin: emp.manager_pin || '1234'
                              });
                              setShowAddStaffModal(true);
                            }}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(emp.id, emp.full_name)}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 6: ATTENDANCE & 2FA */}
            {/* ========================================================= */}
            {activeTab === 'attendance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">2FA Biometric Handshake & Shift Policy</h3>
                    <p className="text-xs text-slate-500">Configure show room check-in grace period, shift times, and 2FA QR Handshake enforcement</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Official Shift Start Time (Dhaka):</label>
                      <input
                        type="time"
                        value={policy.shift_start_time}
                        onChange={(e) => setPolicy({ ...policy, shift_start_time: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Official Shift End Time (Dhaka):</label>
                      <input
                        type="time"
                        value={policy.shift_end_time}
                        onChange={(e) => setPolicy({ ...policy, shift_end_time: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Morning Grace Period (Minutes):</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={policy.grace_period_minutes}
                        onChange={(e) => setPolicy({ ...policy, grace_period_minutes: parseInt(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Staff arriving within grace minutes are marked ON TIME</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Half-Day Lateness Threshold (Minutes):</label>
                      <input
                        type="number"
                        min="15"
                        max="240"
                        value={policy.half_day_late_minutes}
                        onChange={(e) => setPolicy({ ...policy, half_day_late_minutes: parseInt(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.require_manager_handshake}
                        onChange={(e) => setPolicy({ ...policy, require_manager_handshake: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div>
                        <div className="font-bold">Enforce Dual-Device 2FA Handshake</div>
                        <div className="text-[10px] text-slate-500">Requires Showroom Manager to approve the staff check-in QR code</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Real-Time Biometric Integrity</span>
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    OmniFlow uses strict Dhaka Cloud NTP server synchronization to completely eliminate time spoofing and buddy punching.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: SALES INCENTIVES & TARGETS */}
            {/* ========================================================= */}
            {activeTab === 'incentives' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Top Control Bar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Target className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Salesperson Incentives & Monthly Targets
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure base salaries, commission %, monthly target milestones, and bonus pools for sales staff
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-600">Period:</span>
                      <input
                        type="month"
                        value={selectedMonthYear}
                        onChange={(e) => setSelectedMonthYear(e.target.value)}
                        className="bg-transparent font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => loadIncentives(selectedMonthYear)}
                      disabled={incentivesLoading}
                      className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold transition-all shadow-xs"
                      title="Reload real-time calculations"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${incentivesLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={handleSaveIncentives}
                      disabled={incentiveSaving}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {incentiveSaving ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : incentiveSavedToast ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{incentiveSaving ? 'Saving...' : incentiveSavedToast ? 'Saved All!' : 'Save Incentives'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Summary Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span>Realized Sales Volume</span>
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-lg sm:text-2xl font-black text-emerald-950">
                      ৳{(incentivesData?.total_sales_realized || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Period: {selectedMonthYear}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                      <span>Realized Commission Pool</span>
                      <Percent className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="mt-2 text-lg sm:text-2xl font-black text-blue-950">
                      ৳{(incentivesData?.total_commission_pool || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                      Based on individual %
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                      <span>Target Bonus Pool</span>
                      <Award className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 text-lg sm:text-2xl font-black text-amber-950">
                      ৳{(incentivesData?.total_bonus_pool || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                      Unlocked on 100% Target
                    </div>
                  </div>

                  <div className="rounded-3xl border border-purple-100 bg-purple-50/50 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                      <span>Staff in Calculation</span>
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="mt-2 text-lg sm:text-2xl font-black text-purple-950">
                      {incentivesData?.staff?.length || staffList.length} Active
                    </div>
                    <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                      All showroom outlets
                    </div>
                  </div>
                </div>

                {/* Staff Matrix Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 p-4 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Showroom Staff Incentive Breakdown & Target Settings
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Adjust targets and commission parameters below. Realized sales and payouts auto-calculate from completed POS orders.
                      </p>
                    </div>
                  </div>

                  {incentivesLoading ? (
                    <div className="p-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      <span className="text-xs">Computing real-time sales & commission calculations...</span>
                    </div>
                  ) : (incentivesData?.staff || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No active staff accounts found. Please add sales staff in the Staff tab first.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            <th className="py-3 px-4">Salesperson</th>
                            <th className="py-3 px-3">Base Salary (৳)</th>
                            <th className="py-3 px-3">Monthly Target (৳)</th>
                            <th className="py-3 px-3">Realized Sales (৳)</th>
                            <th className="py-3 px-3">Commission Rate</th>
                            <th className="py-3 px-3">Earned Comm. (৳)</th>
                            <th className="py-3 px-3">Target Bonus (৳)</th>
                            <th className="py-3 px-4 text-right">Net Estimated Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {(incentivesData?.staff || []).map((st) => {
                            const edit = incentiveEdits[st.user_id] || {
                              base_salary: st.base_salary,
                              target_amount: st.target_amount,
                              commission_rate: st.commission_rate,
                              bonus_on_achieve: st.bonus_on_achieve
                            };
                            const target = edit.target_amount || 0;
                            const realized = st.realized_sales || 0;
                            const achievementPct = target > 0 ? Math.min(Math.round((realized / target) * 100), 999) : 0;
                            const earnedComm = Math.round((realized * (edit.commission_rate || 0)) / 100);
                            const bonusUnlocked = target > 0 && realized >= target ? (edit.bonus_on_achieve || 0) : 0;
                            const totalPayout = (edit.base_salary || 0) + earnedComm + bonusUnlocked;

                            return (
                              <tr key={st.user_id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{st.full_name}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                    <span className="font-mono font-semibold text-emerald-700">{st.employee_code}</span>
                                    <span>•</span>
                                    <span>{st.branch_name || 'HQ Outlet'}</span>
                                  </div>
                                </td>

                                {/* Base Salary Input */}
                                <td className="py-3 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={edit.base_salary}
                                    onChange={(e) => handleIncentiveFieldChange(st.user_id, 'base_salary', e.target.value)}
                                    className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                  />
                                </td>

                                {/* Monthly Target Input */}
                                <td className="py-3 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="5000"
                                    value={edit.target_amount}
                                    onChange={(e) => handleIncentiveFieldChange(st.user_id, 'target_amount', e.target.value)}
                                    className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                  />
                                </td>

                                {/* Realized Sales with Progress */}
                                <td className="py-3 px-3">
                                  <div className="font-mono font-bold text-slate-900">
                                    ৳{realized.toLocaleString()}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          achievementPct >= 100 ? 'bg-emerald-500' : achievementPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(achievementPct, 100)}%` }}
                                      />
                                    </div>
                                    <span className={`text-[10px] font-bold ${
                                      achievementPct >= 100 ? 'text-emerald-700' : 'text-slate-500'
                                    }`}>
                                      {achievementPct}%
                                    </span>
                                    {achievementPct >= 100 && (
                                      <Award className="h-3 w-3 text-amber-500 shrink-0" />
                                    )}
                                  </div>
                                </td>

                                {/* Commission Rate Input */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={edit.commission_rate}
                                      onChange={(e) => handleIncentiveFieldChange(st.user_id, 'commission_rate', e.target.value)}
                                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                    />
                                    <span className="text-xs font-bold text-slate-500">%</span>
                                  </div>
                                </td>

                                {/* Earned Commission */}
                                <td className="py-3 px-3">
                                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                                    +৳{earnedComm.toLocaleString()}
                                  </span>
                                </td>

                                {/* Target Bonus Input */}
                                <td className="py-3 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={edit.bonus_on_achieve}
                                    onChange={(e) => handleIncentiveFieldChange(st.user_id, 'bonus_on_achieve', e.target.value)}
                                    className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                                  />
                                  {bonusUnlocked > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                                      ✓ Unlocked!
                                    </span>
                                  )}
                                </td>

                                {/* Net Payout */}
                                <td className="py-3 px-4 text-right">
                                  <div className="font-mono font-black text-slate-900 text-sm">
                                    ৳{totalPayout.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Salary + Comm + Bonus
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      💡 Tip: Commission is credited to the salesperson selected in POS billing during checkout.
                    </p>
                    <button
                      onClick={handleSaveIncentives}
                      disabled={incentiveSaving}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{incentiveSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 8: WHATSAPP & OPENWA GATEWAY */}
            {/* ========================================================= */}
            {activeTab === 'whatsapp' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                {/* Left: OpenWA Configuration */}
                <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                        <Smartphone className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        WhatsApp Receipt & OpenWA Automation Gateway
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Integrate with GitHub OpenWA (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">@open-wa/wa-automate</code>) for automated WhatsApp receipt dispatch directly to customer mobile phones.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">OpenWA Gateway Server URL:</label>
                      <input
                        type="text"
                        value={settings.openwa_server_url || ''}
                        onChange={(e) => setSettings({ ...settings, openwa_server_url: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="e.g. http://localhost:8000 or http://your-vps-ip:8000"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        The endpoint where your OpenWA microservice instance is running (e.g. /sendText or /api/send-message).
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">API Secret Key / Token (Optional):</label>
                      <input
                        type="password"
                        value={settings.openwa_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, openwa_api_key: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="Bearer token or API key for OpenWA authentication"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700">Default Country Code:</label>
                        <input
                          type="text"
                          value={settings.openwa_default_country_code || '880'}
                          onChange={(e) => setSettings({ ...settings, openwa_default_country_code: e.target.value })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                          placeholder="880"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Appended to 11-digit numbers (017... -&gt; 88017...)
                        </span>
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.openwa_auto_send || false}
                            onChange={(e) => setSettings({ ...settings, openwa_auto_send: e.target.checked })}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <div>
                            <span className="font-bold">Auto-Send on POS Checkout</span>
                            <p className="text-[10px] text-slate-500">Sends WhatsApp digital bill automatically upon completing order</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Always save settings after changing OpenWA parameters.
                      </p>
                      <button
                        onClick={handleSaveGeneral}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Saving...' : 'Save WhatsApp Gateway'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Diagnostics & OpenWA Guide */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Test Messenger Card */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                      <Send className="h-4 w-4 text-emerald-600" />
                      <span>Test Gateway Connectivity</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Send a live test ping message to verify your OpenWA server can dispatch messages.
                    </p>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Recipient WhatsApp Mobile:</label>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        placeholder="e.g. 01711223344 or 8801711223344"
                      />
                    </div>

                    <button
                      onClick={handleTestWhatsApp}
                      disabled={testMsgLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold shadow-md active:scale-98 transition-all disabled:opacity-50"
                    >
                      {testMsgLoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>{testMsgLoading ? 'Sending Test Ping...' : 'Send WhatsApp Test Ping'}</span>
                    </button>

                    {testResult && (
                      <div className={`p-3 rounded-2xl text-xs space-y-1 ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          {testResult.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                          <span>{testResult.success ? 'Message Dispatched Successfully!' : 'Dispatch Notice / Direct Link Ready'}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {testResult.message || testResult.error}
                        </p>
                        {testResult.whatsapp_link && (
                          <a
                            href={testResult.whatsapp_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline pt-1"
                          >
                            <span>Open Direct WhatsApp Chat</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* OpenWA Instructions / Quick-Start */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <span>About GitHub OpenWA Gateway</span>
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      OpenWA allows you to connect any standard WhatsApp account without paying expensive per-message API fees.
                    </p>
                    <div className="rounded-2xl bg-slate-900 text-emerald-400 p-3 font-mono text-[10px] space-y-1 overflow-x-auto">
                      <div className="text-slate-400 font-sans text-[11px]"># Quick-start OpenWA server:</div>
                      <div>npx @open-wa/wa-automate --port 8000 --popup</div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Even if your OpenWA server is offline, OmniFlow POS automatically generates instant 1-click WhatsApp links and formatted clipboard receipts for your cashiers!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: INDIVIDUAL E-COMMERCE STOREFRONT & PERSONAL DOMAIN */}
            {/* ========================================================= */}
            {activeTab === 'ecommerce' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Top Control Bar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>Individual Interactive E-Commerce Website</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Live Storefront
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Give your fashion brand an interactive online shop. Map your personal custom domain (e.g. shop.voguebd.com).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = ecomCustomDomain ? `http://${ecomCustomDomain}` : `/?store=${tenant?.slug || 'vogue'}`;
                        window.open(url, '_blank');
                      }}
                      className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Preview Live Website</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveEcomSettings}
                      disabled={ecomSaving}
                      className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {ecomSaving ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : ecomSaveSuccess ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{ecomSaving ? 'Saving...' : ecomSaveSuccess ? 'Saved All!' : 'Save Storefront Settings'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column: Custom Domain & Brand Content Form */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* 0. OmniFlow Platform Subdomain & Direct Links */}
                    <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-700" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                            OmniFlow Free Subdomain & Direct Links (ফ্রি সাবডোমেইন ও ডিরেক্ট লিঙ্ক)
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Active & Ready
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        আপনার নিজস্ব ডোমেইন না থাকলেও কোনো সমস্যা নেই! গ্রাহকরা সরাসরি আমাদের ফ্রি সাবডোমেইন এবং যেকোনো সোশ্যাল মিডিয়া বায়ো লিঙ্কে আপনার স্টোর ভিজিট ও অর্ডার করতে পারবেন:
                      </p>

                      <div className="space-y-2">
                        {/* Subdomain URL */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">Platform Subdomain:</div>
                            <div className="text-xs font-mono font-bold text-slate-900">
                              https://{tenant?.slug || 'vogue'}.omniflow.pos.bd
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://${tenant?.slug || 'vogue'}.omniflow.pos.bd`);
                              alert('Subdomain link copied to clipboard!');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {/* Direct Storefront URL */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">Direct Store Link (Social Media / Facebook Bio):</div>
                            <div className="text-xs font-mono font-bold text-emerald-700 truncate max-w-xs sm:max-w-md">
                              {(typeof window !== 'undefined' ? window.location.origin : '')}/store/{tenant?.slug || 'vogue'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const directUrl = `${window.location.origin}/store/${tenant?.slug || 'vogue'}`;
                                navigator.clipboard.writeText(directUrl);
                                alert('Direct store link copied to clipboard!');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const directUrl = `/store/${tenant?.slug || 'vogue'}`;
                                window.open(directUrl, '_blank');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Open</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 1. Custom Domain Card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Personal Custom Domain (নিজস্ব ব্র্যান্ড ডোমেইন)
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          DNS Ready
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Custom Domain / Subdomain:
                        </label>
                        <div className="flex rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-emerald-600 focus-within:bg-white">
                          <span className="px-3.5 py-2.5 text-xs text-slate-400 font-mono font-bold border-r border-slate-200 bg-slate-100">
                            https://
                          </span>
                          <input
                            type="text"
                            value={ecomCustomDomain}
                            onChange={(e) => setEcomCustomDomain(e.target.value)}
                            placeholder="shop.voguebd.com or vogueapparel.com"
                            className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          Visitors browsing this domain will directly see your exclusive branded e-commerce store.
                        </p>
                      </div>

                      {/* DNS Setup Guide Card */}
                      <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">DNS Configuration Instructions:</span>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Auto SSL Active</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Record Type:</span>
                            <span className="text-white font-bold">CNAME</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-400">Host / Name:</span>
                            <span className="text-white font-bold">shop (or @ for root domain)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target / Points to:</span>
                            <span className="text-emerald-400 font-bold">cname.omniflowpos.com</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans pt-1">
                          After updating your DNS records with your registrar (GoDaddy, Namecheap, Dianahost), DNS propagates within 5-15 minutes.
                        </p>
                      </div>
                    </div>

                    {/* 2. Storefront Visual & Hero Settings */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-emerald-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Storefront Branding & Hero Banner
                          </h4>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ecomSettings.is_enabled}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, is_enabled: e.target.checked })}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span>Store Active</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Store Title:</label>
                          <input
                            type="text"
                            value={ecomSettings.store_title}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, store_title: e.target.value })}
                            placeholder="e.g. Vogue Lifestyle Online"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Hero Season Badge:</label>
                          <input
                            type="text"
                            value={ecomSettings.hero_badge}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, hero_badge: e.target.value })}
                            placeholder="e.g. SUMMER COLLECTION 2026"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Top Announcement Bar Text:</label>
                        <input
                          type="text"
                          value={ecomSettings.announcement_bar}
                          onChange={(e) => setEcomSettings({ ...ecomSettings, announcement_bar: e.target.value })}
                          placeholder="e.g. 🔥 Free Delivery Inside Dhaka on Orders Over ৳2,000 | Cash on Delivery Available!"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Main Hero Headline:</label>
                        <input
                          type="text"
                          value={ecomSettings.hero_headline}
                          onChange={(e) => setEcomSettings({ ...ecomSettings, hero_headline: e.target.value })}
                          placeholder="e.g. Timeless Elegance & Contemporary Fashion"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Hero Subheadline / Slogan:</label>
                        <textarea
                          rows={2}
                          value={ecomSettings.hero_subheadline}
                          onChange={(e) => setEcomSettings({ ...ecomSettings, hero_subheadline: e.target.value })}
                          placeholder="Short description highlighting fabrics and style..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Hero Showcase Banner Image URL:</label>
                        <input
                          type="text"
                          value={ecomSettings.hero_image}
                          onChange={(e) => setEcomSettings({ ...ecomSettings, hero_image: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 3. Delivery Rates & Payment Gateway Numbers */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                        Courier Delivery Rates & Payment Accounts (BDT)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Inside Dhaka Fee (৳):</label>
                          <input
                            type="number"
                            value={ecomSettings.delivery_inside_dhaka}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, delivery_inside_dhaka: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Outside Dhaka Fee (৳):</label>
                          <input
                            type="number"
                            value={ecomSettings.delivery_outside_dhaka}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, delivery_outside_dhaka: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Free Delivery Over (৳):</label>
                          <input
                            type="number"
                            value={ecomSettings.free_delivery_min_order}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, free_delivery_min_order: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">bKash Send Money Number:</label>
                          <input
                            type="text"
                            value={ecomSettings.bkash_number}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, bkash_number: e.target.value })}
                            placeholder="017XXXXXXXX"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Nagad Send Money Number:</label>
                          <input
                            type="text"
                            value={ecomSettings.nagad_number}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, nagad_number: e.target.value })}
                            placeholder="018XXXXXXXX"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Order Helpline:</label>
                          <input
                            type="text"
                            value={ecomSettings.whatsapp_number}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, whatsapp_number: e.target.value })}
                            placeholder="+8801711000111"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Customer Support Hotline:</label>
                          <input
                            type="text"
                            value={ecomSettings.hotline_number}
                            onChange={(e) => setEcomSettings({ ...ecomSettings, hotline_number: e.target.value })}
                            placeholder="+8801811223344"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Live Storefront Card & QR Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-emerald-600" />
                          <span>Live Storefront Status</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Online</span>
                        </span>
                      </div>

                      <div className="rounded-2xl bg-slate-950 p-4 text-white space-y-3">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Public Storefront URL</div>
                        <div className="font-mono text-xs font-bold text-emerald-400 break-all">
                          {ecomCustomDomain ? `https://${ecomCustomDomain}` : `${window.location.origin}/?store=${tenant?.slug || 'vogue'}`}
                        </div>

                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const url = ecomCustomDomain ? `https://${ecomCustomDomain}` : `${window.location.origin}/?store=${tenant?.slug || 'vogue'}`;
                              navigator.clipboard.writeText(url);
                              alert('Storefront link copied to clipboard!');
                            }}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Link</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const url = ecomCustomDomain ? `http://${ecomCustomDomain}` : `/?store=${tenant?.slug || 'vogue'}`;
                              window.open(url, '_blank');
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open Store</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                        <div className="font-bold text-slate-800">Omnichannel Inventory Sync:</div>
                        <p className="text-[11px] leading-relaxed">
                          Whenever customers order products on your online website, stock is automatically reserved from your showroom inventory, preventing overselling across online and in-store counters!
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}


          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SHOWROOM */}
      {/* ========================================================= */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingBranch ? 'Edit Showroom / Branch' : 'Add New Showroom / Warehouse'}
            </h3>
            <form onSubmit={handleSaveBranch} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Outlet Name:</label>
                <input
                  type="text"
                  required
                  value={branchFormData.name}
                  onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="e.g. Dhanmondi Flagship Outlet"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Branch Code (Unique):</label>
                <input
                  type="text"
                  required
                  value={branchFormData.code}
                  onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="e.g. DHAKA-01"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Physical Address:</label>
                <input
                  type="text"
                  value={branchFormData.address}
                  onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="e.g. Road 7/A, Dhanmondi, Dhaka"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Contact Phone:</label>
                <input
                  type="text"
                  value={branchFormData.phone}
                  onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="e.g. 01711-223344"
                />
              </div>

              <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branchFormData.is_warehouse}
                  onChange={(e) => setBranchFormData({ ...branchFormData, is_warehouse: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="font-semibold">This location is a Central Warehouse</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT STAFF */}
      {/* ========================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingStaff ? 'Edit Staff Account' : 'Provision New Staff Member'}
            </h3>
            <form onSubmit={handleSaveStaff} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.full_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, full_name: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="e.g. Rahat Ahmed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address (Login):</label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="e.g. rahat@vogue.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Role / Position:</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="STORE_MANAGER">Showroom Manager</option>
                    <option value="CASHIER">Cashier / Billing Desk</option>
                    <option value="SALESMAN">Sales Representative</option>
                    <option value="INVENTORY_CLERK">Warehouse / Inventory Clerk</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Showroom:</label>
                  <select
                    value={staffFormData.branch_id}
                    onChange={(e) => setStaffFormData({ ...staffFormData, branch_id: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {showroomList.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingStaff && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Initial Password:</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="password123"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Commission Rate (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={staffFormData.commission_rate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Manager Security PIN (4-Digits):</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={staffFormData.manager_pin}
                    onChange={(e) => setStaffFormData({ ...staffFormData, manager_pin: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
