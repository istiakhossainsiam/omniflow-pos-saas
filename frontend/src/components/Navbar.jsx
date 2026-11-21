import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Store, 
  ChevronDown, 
  Sparkles,
  Sliders,
  LogOut,
  Layers,
  Crown,
  Globe,
  User,
  ShieldCheck,
  Check,
  Clock,
  Zap,
  ShoppingBag,
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, onOpenLanding, onOpenStorefront }) {
  const { user, tenant, branches, selectedBranch, switchBranch, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [dhakaTime, setDhakaTime] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOwner = user?.role === 'STORE_OWNER';
  const canSwitchOutlets = isSuperAdmin || isOwner;
  const safeBranches = branches || [];

  // Live Dhaka Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now);
      setDhakaTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Role-based main navigation tabs
  const getNavTabs = () => {
    const role = user?.role;
    if (role === 'SUPER_ADMIN') {
      return [
        { id: 'dashboard', label: 'Overview' },
        { id: 'tenants', label: 'Tenants' },
        { id: 'plans', label: 'Plans' },
        { id: 'cms', label: 'Theme & CMS' },
        { id: 'users', label: 'Users' },
        { id: 'reports', label: 'Analytics' },
      ];
    }
    if (role === 'STORE_OWNER') {
      return [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'pos', label: 'Fast POS', badge: 'F2' },
        { id: 'online-orders', label: 'Online Orders' },
        { id: 'matrix', label: 'Inventory Matrix' },
        { id: 'hrm', label: 'HRM Suite' },
        { id: 'reports', label: 'P&L Reports' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'requisitions', label: 'Requisitions' },
      ];
    }
    if (role === 'STORE_MANAGER') {
      return [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'pos', label: 'Fast POS', badge: 'F2' },
        { id: 'online-orders', label: 'Orders' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'portal', label: 'Staff' },
        { id: 'requisitions', label: 'Transfers' },
      ];
    }
    if (role === 'CASHIER') {
      return [
        { id: 'dashboard', label: 'Shift Register' },
        { id: 'pos', label: 'Fast POS Counter', badge: 'LIVE' },
        { id: 'attendance', label: 'My Attendance' },
      ];
    }
    if (role === 'SALESMAN') {
      return [
        { id: 'dashboard', label: 'Sales Targets' },
        { id: 'pos', label: 'Catalog & POS' },
        { id: 'attendance', label: 'Daily Check-In' },
      ];
    }
    if (role === 'INVENTORY_CLERK') {
      return [
        { id: 'dashboard', label: 'Warehouse' },
        { id: 'matrix', label: 'Stock Matrix' },
        { id: 'requisitions', label: 'Challan Transfers' },
      ];
    }
    return [{ id: 'dashboard', label: 'Dashboard' }];
  };

  const navTabs = getNavTabs();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs transition-colors">
      
      {/* Click outside overlay to close dropdowns */}
      {(showBranchDropdown || showUserMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => {
            setShowBranchDropdown(false);
            setShowUserMenu(false);
          }} 
        />
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        
        {/* Left: Brand Identity & Outlet Pill */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className={`relative h-9 w-9 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-md ${
              isSuperAdmin 
                ? 'bg-slate-950 ring-1 ring-white/20' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20'
            }`}>
              {isSuperAdmin ? (
                <Crown className="h-4.5 w-4.5 text-amber-400" />
              ) : (
                <Sparkles className="h-4.5 w-4.5 text-emerald-100" />
              )}
              {/* Online Pulse Dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none hidden xs:inline truncate">
                {isSuperAdmin ? 'OmniFlow Admin' : (tenant?.name || 'OmniFlow POS')}
              </span>
              <span className="text-[10px] font-medium text-slate-500 hidden sm:inline-block leading-tight mt-0.5">
                {isSuperAdmin ? 'Multi-Tenant Master Cloud' : 'Retail Cloud ERP'}
              </span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Outlet Switcher Pill */}
          {!isSuperAdmin && (
            <div className="relative z-50">
              <button 
                onClick={() => canSwitchOutlets && setShowBranchDropdown(!showBranchDropdown)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  canSwitchOutlets 
                    ? 'bg-slate-50/90 hover:bg-slate-100/90 hover:border-slate-300 text-slate-800 border-slate-200 shadow-xs cursor-pointer' 
                    : 'bg-slate-50 text-slate-600 border-slate-200/70 cursor-default'
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="truncate max-w-[100px] sm:max-w-[150px] font-semibold tracking-tight">
                  {selectedBranch?.name || 'Showroom'}
                </span>
                {canSwitchOutlets && (
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Outlet Dropdown */}
              {showBranchDropdown && canSwitchOutlets && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>Active Showrooms</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">{safeBranches.length} Outlets</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {safeBranches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          switchBranch(b.id);
                          setShowBranchDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                          selectedBranch?.id === b.id 
                            ? 'bg-emerald-50/90 text-emerald-800 font-bold border border-emerald-200/60' 
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Store className={`h-4 w-4 shrink-0 ${selectedBranch?.id === b.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div className="text-left truncate">
                            <div className="truncate leading-tight">{b.name}</div>
                            {b.location && <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{b.location}</div>}
                          </div>
                        </div>
                        {selectedBranch?.id === b.id && (
                          <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation Tabs with Sliding Pill Design */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-950 font-bold shadow-sm shadow-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold leading-none ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Dhaka Clock, Online Store & User Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* Dhaka Real-Time Clock Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/70 border border-slate-200/70 text-[11px] font-mono text-slate-600">
            <Clock className="h-3 w-3 text-emerald-600" />
            <span className="font-semibold tabular-nums">{dhakaTime || '11:30 PM'}</span>
            <span className="text-[10px] text-slate-400 font-sans">Dhaka</span>
          </div>

          {/* Storefront Button */}
          {onOpenStorefront && (
            <button
              onClick={onOpenStorefront}
              title="Open Public E-Commerce Storefront"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span>Live Store</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          )}

          {/* User Profile Pill & Dropdown */}
          <div className="relative z-50">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowBranchDropdown(false);
              }}
              className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 max-w-[100px] truncate leading-tight">
                  {user?.full_name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-500/20">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Header Profile Info */}
                <div className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                  <div className="font-extrabold text-sm text-slate-900 truncate">{user?.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{user?.email}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      {user?.role}
                    </span>
                    {selectedBranch && (
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        • {selectedBranch.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Settings Trigger */}
                {['STORE_OWNER', 'STORE_MANAGER'].includes(user?.role) && onOpenSettings && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-medium text-left"
                  >
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Showroom Settings</div>
                      <div className="text-[10px] text-slate-400">Themes, VAT BIN & Invoicing</div>
                    </div>
                  </button>
                )}

                {/* Landing page link */}
                {onOpenLanding && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenLanding();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-medium text-left"
                  >
                    <Laptop className="h-4 w-4 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Public Showcase</div>
                      <div className="text-[10px] text-slate-400">View features & plans overview</div>
                    </div>
                  </button>
                )}

                <div className="border-t border-slate-100 my-1.5" />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-bold text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Workstation</span>
                </button>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
