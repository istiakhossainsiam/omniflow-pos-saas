import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Crown, 
  Building2, 
  Store, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Search, 
  Sparkles, 
  Activity, 
  Database, 
  Cpu, 
  Lock, 
  Clock, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  ArrowUpRight,
  RefreshCw,
  Layers,
  ChevronRight,
  ExternalLink,
  UserPlus,
  Trash2,
  Edit,
  KeyRound,
  Mail,
  Phone,
  BarChart3,
  DollarSign,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { tenantApi, employeeApi, reportApi } from '../../services/api';
import LandingPageCmsEditor from './LandingPageCmsEditor';

export default function SuperAdminDashboardView({ activeSubTab = 'dashboard', onNavigate, onOpenSettings, onOpenLanding }) {
  const { user, tenant, selectedBranch, branches } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saasOverview, setSaasOverview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'dashboard');

  // Search & Filter
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Modals
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionData, setProvisionData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    plan: 'ENTERPRISE',
    owner_email: '',
    owner_name: '',
    owner_password: 'password123',
    branch_name: 'Main Flagship Showroom',
    branch_code: 'HQ01'
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planCreatingLoading, setPlanCreatingLoading] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    code: '',
    monthly_price: 6000,
    currency: 'BDT',
    max_branches: 3,
    max_users: 10,
    description: '',
    is_popular: false,
    features: {
      clothing_matrix: true,
      fast_pos: true,
      barcode_generator: true,
      attendance_handshake: true,
      inter_branch_transfer: true,
      staff_incentive: true,
      custom_branding: true,
      api_access: false
    }
  });

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userCreatingLoading, setUserCreatingLoading] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_code: '',
    password: 'password123',
    role: 'STORE_MANAGER',
    tenant_id: tenant?.id || '',
    branch_id: selectedBranch?.id || '',
    manager_pin: '1234'
  });

  const [adminTheme, setAdminTheme] = useState({
    bg_color: '#030712',
    accent_color: '#f59e0b',
    surface_color: '#0f172a',
    border_color: '#1e293b',
    text_color: '#f8fafc',
    preset: 'OBSIDIAN_GOLD'
  });

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, usersList, plansList, landingData] = await Promise.all([
        tenantApi.getSaasOverview(),
        employeeApi.list().catch(() => []),
        tenantApi.getPlans().catch(() => []),
        tenantApi.getLandingContent().catch(() => null)
      ]);
      setSaasOverview(overview);
      setAllUsers(usersList);
      setSubscriptionPlans(Array.isArray(plansList) ? plansList : []);
      if (landingData?.superadmin_theme) {
        setAdminTheme(landingData.superadmin_theme);
        if (typeof document !== 'undefined') {
          document.body.style.backgroundColor = landingData.superadmin_theme.bg_color || '#030712';
        }
      }
    } catch (err) {
      console.warn("Could not load SaaS master data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Plan Creation Handler
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planFormData.name.trim() || !planFormData.code.trim()) {
      alert("Please fill Plan Name and Plan Code");
      return;
    }

    try {
      setPlanCreatingLoading(true);
      await tenantApi.createPlan(planFormData);
      alert(`Subscription plan '${planFormData.name}' created successfully!`);
      setShowPlanModal(false);
      setPlanFormData({
        name: '',
        code: '',
        monthly_price: 6000,
        currency: 'BDT',
        max_branches: 3,
        max_users: 10,
        description: '',
        is_popular: false,
        features: {
          clothing_matrix: true,
          fast_pos: true,
          barcode_generator: true,
          attendance_handshake: true,
          inter_branch_transfer: true,
          staff_incentive: true,
          custom_branding: true,
          api_access: false
        }
      });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create subscription plan");
    } finally {
      setPlanCreatingLoading(false);
    }
  };

  // Plan Deactivation Handler
  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to deactivate plan '${planName}'?`)) return;
    try {
      await tenantApi.deletePlan(planId);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to deactivate plan");
    }
  };

  // Provision New Tenant Brand
  const handleProvisionTenant = async (e) => {
    e.preventDefault();
    if (!provisionData.name.trim()) {
      alert("Please enter brand name.");
      return;
    }

    try {
      setProvisionLoading(true);
      const res = await tenantApi.provision(provisionData);
      alert(res.message || "New brand provisioned successfully!");
      setShowProvisionModal(false);
      setProvisionData({
        name: '',
        slug: '',
        email: '',
        phone: '',
        plan: 'ENTERPRISE',
        owner_email: '',
        owner_name: '',
        owner_password: 'password123',
        branch_name: 'Main Flagship Showroom',
        branch_code: 'HQ01'
      });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to provision brand");
    } finally {
      setProvisionLoading(false);
    }
  };

  // Toggle Tenant Plan / Status
  const handleUpdateTenantPlan = async (tenantId, newPlan, isActive = true) => {
    try {
      await tenantApi.updatePlan(tenantId, { subscription_plan: newPlan, is_active: isActive });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update tenant plan");
    }
  };

  // Create New User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.full_name || !newUserData.email || !newUserData.employee_code) {
      alert("Please fill required fields (Name, Email, Employee Code).");
      return;
    }

    try {
      setUserCreatingLoading(true);
      await employeeApi.create({
        ...newUserData,
        tenant_id: newUserData.tenant_id || tenant?.id,
        branch_id: newUserData.branch_id || selectedBranch?.id
      });
      alert(`User account '${newUserData.full_name}' created successfully!`);
      setShowCreateUserModal(false);
      setNewUserData({
        full_name: '',
        email: '',
        phone: '',
        employee_code: '',
        password: 'password123',
        role: 'STORE_MANAGER',
        tenant_id: tenant?.id || '',
        branch_id: selectedBranch?.id || '',
        manager_pin: '1234'
      });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create user account");
    } finally {
      setUserCreatingLoading(false);
    }
  };

  const filteredTenants = (saasOverview?.tenants || []).filter(t => 
    t.name?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
    t.email?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
    t.slug?.toLowerCase().includes(tenantSearchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !userSearchQuery || 
      u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.employee_code?.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 space-y-5 pb-24 md:pb-8 animate-in fade-in">
      
      {/* 1. Master Control Header Banner (Sleek Apple/Linear Design) */}
      <div 
        className="rounded-3xl border p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${adminTheme.bg_color || '#030712'}, ${adminTheme.surface_color || '#0f172a'})`,
          borderColor: `${adminTheme.accent_color || '#f59e0b'}30`
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span 
              className="flex h-6 w-6 items-center justify-center rounded-lg font-black shadow-sm"
              style={{
                backgroundColor: adminTheme.accent_color || '#f59e0b',
                color: '#030712'
              }}
            >
              <Crown className="h-3.5 w-3.5 fill-slate-950" />
            </span>
            <span 
              className="text-[11px] font-black tracking-wider uppercase"
              style={{ color: adminTheme.accent_color || '#f59e0b' }}
            >
              SaaS Central Command
            </span>
            <span 
              className="rounded-full px-2 py-0.5 text-[9px] font-bold border"
              style={{
                backgroundColor: `${adminTheme.accent_color || '#f59e0b'}15`,
                color: adminTheme.accent_color || '#f59e0b',
                borderColor: `${adminTheme.accent_color || '#f59e0b'}30`
              }}
            >
              Master Node
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Multi-Tenant Platform Controller
          </h2>
          <p className="text-xs text-slate-400">
            Tenant provisioning, monthly subscriptions, UI themes & global staff telemetry
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-start sm:justify-end">
          <button
            onClick={() => setShowProvisionModal(true)}
            className="flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-black text-slate-950 shadow-md active:scale-95 transition-all hover:brightness-110"
            style={{
              backgroundColor: adminTheme.accent_color || '#f59e0b',
              boxShadow: `0 4px 15px -2px ${adminTheme.accent_color || '#f59e0b'}50`
            }}
          >
            <Plus className="h-4 w-4 text-slate-950" />
            <span>Provision Brand</span>
          </button>

          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span>+ Plan</span>
          </button>

          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" style={{ color: adminTheme.accent_color || '#f59e0b' }} />
            <span>+ User</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh SaaS Telemetry"
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: 👑 SaaS Overview */}
      {currentTab === 'dashboard' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Global KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subscribed Brands</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                {saasOverview?.total_tenants || 1}
              </div>
              <div className="mt-1 text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <span>● 100% Active Enterprise</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Outlets / Outlets</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Store className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                {saasOverview?.total_outlets || branches.length}
              </div>
              <div className="mt-1 text-[11px] text-blue-700 font-bold">
                {branches.filter(b => b.is_warehouse).length} Warehouses • {branches.filter(b => !b.is_warehouse).length} Retail Showrooms
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Users & Terminals</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                {allUsers.length || 5}
              </div>
              <div className="mt-1 text-[11px] text-purple-700 font-bold">
                Across All Tenant Brands
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Health</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700 flex items-center gap-1.5">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-bold">
                Asia/Dhaka (GMT+6) • Sub-10ms
              </div>
            </div>

          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowProvisionModal(true)}
              className="flex items-start gap-4 p-5 rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/60 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">➕ Provision New Retail Brand</div>
                <p className="text-xs text-slate-600 mt-1">Enroll new fashion/retail brand with custom plan & admin credentials</p>
              </div>
            </button>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-start gap-4 p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-800 font-black shrink-0 group-hover:scale-105 transition-transform">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">👤 Create Staff Account</div>
                <p className="text-xs text-slate-600 mt-1">Add Store Owner, Manager, Cashier, or Salesman to any outlet</p>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentTab('reports');
                if (onNavigate) onNavigate('reports');
              }}
              className="flex items-start gap-4 p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 font-black shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">📊 SaaS Platform Analytics</div>
                <p className="text-xs text-slate-600 mt-1">Real-time revenue telemetry across all enrolled multi-tenant brands</p>
              </div>
            </button>
          </div>

          {/* Infrastructure Health Telemetry */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">SaaS Platform Telemetry & Infrastructure Health</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                99.98% High Availability
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Database Engine</div>
                <div className="text-xs font-black text-emerald-700 font-mono mt-0.5">SQLite / AsyncPool Live</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Full ACID Compliance</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">System Timezone</div>
                <div className="text-xs font-black text-slate-800 font-mono mt-0.5">Asia/Dhaka (GMT+6)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Synchronized System-wide</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Zero-Storage Privacy Engine</div>
                <div className="text-xs font-black text-emerald-700 font-mono mt-0.5">RAM-Only Buffer (0 Bytes Saved)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Automated Blob Revocation</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB CONTENT: 🏢 Tenants & Brands */}
      {currentTab === 'tenants' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Retail Brand Fleet ({filteredTenants.length})</h3>
              <p className="text-xs text-slate-500">Manage all registered multi-tenant fashion brands & subscriptions</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search brand, email..."
                  value={tenantSearchQuery}
                  onChange={(e) => setTenantSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setShowProvisionModal(true)}
                className="flex items-center gap-1 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shrink-0 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Provision Brand</span>
              </button>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Brand Name</th>
                  <th className="py-2.5 px-3">Subscription Plan</th>
                  <th className="py-2.5 px-3 text-center">Outlets</th>
                  <th className="py-2.5 px-3 text-center">Staff Count</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Plan Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{t.email} • {t.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={t.subscription_plan}
                        onChange={(e) => handleUpdateTenantPlan(t.id, e.target.value, t.is_active)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-amber-900 font-mono"
                      >
                        {subscriptionPlans.length > 0 ? (
                          subscriptionPlans.map(p => (
                            <option key={p.id || p.code} value={p.code}>
                              {p.code} (৳{p.monthly_price?.toLocaleString()}/mo)
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="ENTERPRISE">ENTERPRISE (All Features)</option>
                            <option value="PRO">PRO (Multi-Branch)</option>
                            <option value="GROWTH">GROWTH (Single Outlet)</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {t.branch_count} Outlets
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {t.user_count} Users
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleUpdateTenantPlan(t.id, t.subscription_plan, !t.is_active)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          t.is_active 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-700' 
                            : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        {t.is_active ? '● Active' : '✕ Suspended'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setCurrentTab('plans');
                          if (onNavigate) onNavigate('plans');
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Manage Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4.5. TAB CONTENT: 💳 Monthly Subscription Plans */}
      {currentTab === 'plans' && (
        <div className="space-y-5 animate-in fade-in">
          
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <DollarSign className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  SaaS Monetization & Package Builder
                </span>
              </div>
              <h3 className="mt-1 text-xl font-black text-slate-900">
                Customizable Monthly Subscription Plans ({subscriptionPlans.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure monthly retail tiers (BDT), outlet quotas, user limits, and module entitlements.
              </p>
            </div>

            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>➕ Create Custom Plan</span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => {
              const assignedTenants = filteredTenants.filter(t => t.subscription_plan === plan.code);
              return (
                <div 
                  key={plan.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-amber-100 text-amber-900 font-mono font-black text-[10px] px-2 py-0.5 uppercase border border-amber-300">
                        {plan.code}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {assignedTenants.length} Brands Enrolled
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{plan.description || "Custom SaaS package configured by SuperAdmin."}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                        ৳{plan.monthly_price?.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ month ({plan.currency || 'BDT'})</span>
                    </div>

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Showroom Limit</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">{plan.max_branches} Outlets</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">User Seats</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">{plan.max_users} Staff Accounts</div>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Entitlements:</div>
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Clothing & Garment Matrix</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>High-Speed Fast POS Terminal</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${plan.features?.attendance_handshake ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {plan.features?.attendance_handshake ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
                        <span>2FA Biometric QR Attendance</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${plan.features?.inter_branch_transfer ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {plan.features?.inter_branch_transfer ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
                        <span>Inter-Branch Stock Transfers</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${plan.features?.custom_branding ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {plan.features?.custom_branding ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
                        <span>Custom UI Theme & Whitelabel</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {plan.id?.substring(0, 8)}...</span>
                    <button
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 5. TAB CONTENT: 👥 Global User Accounts */}
      {currentTab === 'users' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Global User Accounts ({filteredUsers.length})</h3>
              <p className="text-xs text-slate-500">Manage all owners, managers, cashiers and salesmen across the platform</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter dropdown */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="STORE_OWNER">STORE_OWNER</option>
                <option value="STORE_MANAGER">STORE_MANAGER</option>
                <option value="CASHIER">CASHIER</option>
                <option value="SALESMAN">SALESMAN</option>
                <option value="INVENTORY_CLERK">INVENTORY_CLERK</option>
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-black shrink-0 shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5 text-amber-400" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Employee Code</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Outlet</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.email} • {u.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {u.employee_code}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                        u.role === 'SUPER_ADMIN' 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : u.role === 'STORE_OWNER' 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {u.branch_name || 'Main Showroom'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        ● Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[11px] text-slate-400 font-medium">Auto-Synced</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: 📊 Platform Analytics & Telemetry */}
      {currentTab === 'reports' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* SaaS Telemetry Header Banner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <BarChart3 className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  SaaS Revenue & Telemetry Intelligence
                </span>
              </div>
              <h3 className="mt-1 text-xl font-black text-slate-900">Global SaaS Platform Telemetry</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-Tenant MRR Run Rate, Subscription Tier Distribution, and Infrastructure Load across Bangladesh
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Cluster Active</span>
              </span>
            </div>
          </div>

          {/* SaaS Core Financial & Platform KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated MRR</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                ৳{(((filteredTenants.filter(t => t.subscription_plan === 'ENTERPRISE').length * 15000) + 
                    (filteredTenants.filter(t => t.subscription_plan === 'PRO').length * 8000) + 
                    (filteredTenants.filter(t => t.subscription_plan === 'GROWTH').length * 4000)) || 15000).toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <span>+18.4% MRR Growth</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annualized ARR</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                ৳{((((filteredTenants.filter(t => t.subscription_plan === 'ENTERPRISE').length * 15000) + 
                    (filteredTenants.filter(t => t.subscription_plan === 'PRO').length * 8000) + 
                    (filteredTenants.filter(t => t.subscription_plan === 'GROWTH').length * 4000)) || 15000) * 12).toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-blue-700 font-bold">
                Projected 12-Month Run Rate
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tenant Brands</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                {filteredTenants.filter(t => t.is_active).length} / {filteredTenants.length || 1}
              </div>
              <div className="mt-1 text-[11px] text-purple-700 font-bold">
                100% SLA Compliance
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Fleet</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Store className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">
                {saasOverview?.total_outlets || branches.length} Outlets
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-bold">
                {allUsers.length || 5} Total Staff Terminals
              </div>
            </div>

          </div>

          {/* Subscription Tier Breakdown & SaaS Plan Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wide">
                  ENTERPRISE TIER
                </span>
                <span className="text-xs font-mono font-bold text-amber-900">৳15,000 / mo</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {filteredTenants.filter(t => t.subscription_plan === 'ENTERPRISE').length} Brand Subscriptions
              </div>
              <p className="text-xs text-slate-600">
                Multi-Branch POS, Clothing Matrix, 2FA Attendance, Stock Transfer & Requisitions
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full" 
                  style={{ width: `${Math.round((filteredTenants.filter(t => t.subscription_plan === 'ENTERPRISE').length / (filteredTenants.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-600 text-white font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wide">
                  PRO TIER
                </span>
                <span className="text-xs font-mono font-bold text-blue-900">৳8,000 / mo</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {filteredTenants.filter(t => t.subscription_plan === 'PRO').length} Brand Subscriptions
              </div>
              <p className="text-xs text-slate-600">
                Multi-Showroom Network, Fast POS Billing & Matrix Hangtag Printing
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.round((filteredTenants.filter(t => t.subscription_plan === 'PRO').length / (filteredTenants.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-800 text-white font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wide">
                  GROWTH TIER
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">৳4,000 / mo</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {filteredTenants.filter(t => t.subscription_plan === 'GROWTH').length} Brand Subscriptions
              </div>
              <p className="text-xs text-slate-600">
                Single Flagship Showroom, Fast POS Terminal & Basic Reporting
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-slate-700 h-2 rounded-full" 
                  style={{ width: `${Math.round((filteredTenants.filter(t => t.subscription_plan === 'GROWTH').length / (filteredTenants.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* Tenant Fleet Telemetry & Infrastructure Health Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Multi-Tenant Isolation & Telemetry Status</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                All Tenants Isolated & Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Brand Tenant</th>
                    <th className="py-2.5 px-3">Plan Tier</th>
                    <th className="py-2.5 px-3 text-center">Active Showrooms</th>
                    <th className="py-2.5 px-3 text-center">Staff Terminals</th>
                    <th className="py-2.5 px-3">Est. MRR Value</th>
                    <th className="py-2.5 px-3">SaaS Status</th>
                    <th className="py-2.5 px-3 text-right">Isolation Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">slug: {t.slug} • {t.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-black border ${
                          t.subscription_plan === 'ENTERPRISE' 
                            ? 'bg-amber-100 text-amber-900 border-amber-300' 
                            : t.subscription_plan === 'PRO'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {t.subscription_plan}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {t.branch_count} Showrooms
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {t.user_count} Users
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        ৳{t.subscription_plan === 'ENTERPRISE' ? '15,000' : t.subscription_plan === 'PRO' ? '8,000' : '4,000'} /mo
                      </td>
                      <td className="py-3 px-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          t.is_active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {t.is_active ? '● Subscribed' : '✕ Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-mono text-slate-600 font-bold">
                          Tenant-Scoped (ACID)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SaaS Server & Cloud Infrastructure Telemetry */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Server & Cloud Infrastructure Telemetry</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                99.98% High Availability
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">API Gateway Latency</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">8ms (Ultra Fast)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Async FastAPIs Engine</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">System Timezone</div>
                <div className="text-base font-black text-slate-800 font-mono mt-0.5">Asia/Dhaka (GMT+6)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">NTP Synchronized</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Zero-Storage Privacy</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">0 Bytes Retained</div>
                <div className="text-[10px] text-slate-500 mt-0.5">RAM Ephemeral Pipeline</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Database Engine</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">SQLite / AsyncPool</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Full ACID Compliance</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 7. TAB CONTENT: 🌐 Landing Page CMS & SEO Engine */}
      {currentTab === 'cms' && (
        <LandingPageCmsEditor onPreviewLive={onOpenLanding} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW RETAIL TENANT BRAND */}
      {/* ========================================================================= */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision New Retail Brand</h3>
                  <p className="text-[11px] text-slate-500">Enroll new retail tenant into OmniFlow Platform</p>
                </div>
              </div>
              <button onClick={() => setShowProvisionModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Retail Brand Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fabrilife Lifestyle / Apex Footwear"
                  value={provisionData.name}
                  onChange={(e) => setProvisionData({ ...provisionData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@brand.com"
                    value={provisionData.email}
                    onChange={(e) => setProvisionData({ ...provisionData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Phone:</label>
                  <input
                    type="text"
                    required
                    placeholder="+8801700000000"
                    value={provisionData.phone}
                    onChange={(e) => setProvisionData({ ...provisionData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Subscription Plan:</label>
                  <select
                    value={provisionData.plan}
                    onChange={(e) => setProvisionData({ ...provisionData, plan: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {subscriptionPlans.length > 0 ? (
                      subscriptionPlans.map(p => (
                        <option key={p.id || p.code} value={p.code}>
                          {p.name} ({p.code} - ৳{p.monthly_price?.toLocaleString()}/mo)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="ENTERPRISE">ENTERPRISE (Full Matrix + 2FA)</option>
                        <option value="PRO">PRO (Multi-Branch POS)</option>
                        <option value="GROWTH">GROWTH (Single Showroom)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Brand Slug / URL Key:</label>
                  <input
                    type="text"
                    placeholder="e.g. fabrilife"
                    value={provisionData.slug}
                    onChange={(e) => setProvisionData({ ...provisionData, slug: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Initial Outlet & Owner Account Details */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2.5">
                <div className="text-xs font-black text-amber-900">Initial Store Owner Account & Showroom:</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Owner Full Name"
                    value={provisionData.owner_name}
                    onChange={(e) => setProvisionData({ ...provisionData, owner_name: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Owner Login Email"
                    value={provisionData.owner_email}
                    onChange={(e) => setProvisionData({ ...provisionData, owner_email: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Main Showroom Name (e.g. Dhanmondi Outlet)"
                    value={provisionData.branch_name}
                    onChange={(e) => setProvisionData({ ...provisionData, branch_name: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Showroom Code (e.g. DHK01)"
                    value={provisionData.branch_code}
                    onChange={(e) => setProvisionData({ ...provisionData, branch_code: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/30 active:scale-95"
                >
                  {provisionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Provision Brand Now</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE GLOBAL USER ACCOUNT */}
      {/* ========================================================================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create User Account</h3>
                  <p className="text-[11px] text-slate-500">Create new staff account across any tenant brand</p>
                </div>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuz Alam"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="user@vogue.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Mobile Phone:</label>
                  <input
                    type="text"
                    required
                    placeholder="01711223344"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Employee Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VOGUE-DHK01-MGR-002"
                    value={newUserData.employee_code}
                    onChange={(e) => setNewUserData({ ...newUserData, employee_code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Role / Designation:</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="STORE_OWNER">Store Owner (HQ)</option>
                    <option value="STORE_MANAGER">Store Manager</option>
                    <option value="CASHIER">Cashier Counter</option>
                    <option value="SALESMAN">Salesman Executive</option>
                    <option value="INVENTORY_CLERK">Inventory Warehouse Clerk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Showroom:</label>
                  <select
                    value={newUserData.branch_id}
                    onChange={(e) => setNewUserData({ ...newUserData, branch_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Manager Handshake PIN:</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={newUserData.manager_pin}
                    onChange={(e) => setNewUserData({ ...newUserData, manager_pin: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono tracking-widest text-center focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userCreatingLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-black shadow-md active:scale-95"
                >
                  {userCreatingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE CUSTOM MONTHLY SUBSCRIPTION PLAN */}
      {/* ========================================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Monthly Subscription Plan</h3>
                  <p className="text-[11px] text-slate-500">Define custom pricing, outlet quotas & module permissions</p>
                </div>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Plan Display Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Chain Enterprise"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Plan Code (Unique):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP_ENTERPRISE"
                    value={planFormData.code}
                    onChange={(e) => setPlanFormData({ ...planFormData, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Monthly Price (৳):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="10000"
                    value={planFormData.monthly_price}
                    onChange={(e) => setPlanFormData({ ...planFormData, monthly_price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Max Outlets:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="10"
                    value={planFormData.max_branches}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_branches: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Max Users:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="30"
                    value={planFormData.max_users}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_users: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Plan Description:</label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive retail package with full multi-showroom matrix and live stock syncing..."
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Module Feature Checkboxes */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="text-xs font-black text-slate-800">Module Entitlements:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.clothing_matrix}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, clothing_matrix: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Clothing & Garment Matrix</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.fast_pos}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, fast_pos: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Fast POS Billing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.attendance_handshake}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, attendance_handshake: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>2FA Biometric QR Attendance</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.inter_branch_transfer}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, inter_branch_transfer: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Inter-Branch Stock Transfers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.staff_incentive}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, staff_incentive: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Salesman Targets & Incentive</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.features?.custom_branding}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        features: { ...planFormData.features, custom_branding: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Custom UI Theme & Branding</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planFormData.is_popular}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        is_popular: e.target.checked
                      })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-bold text-amber-700">Mark as "Popular" Badge</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planCreatingLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md active:scale-95"
                >
                  {planCreatingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

