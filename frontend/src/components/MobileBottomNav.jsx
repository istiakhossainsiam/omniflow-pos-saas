import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Layers, 
  QrCode, 
  TrendingUp, 
  ClipboardCheck, 
  BarChart3,
  LayoutDashboard,
  Crown,
  Building2,
  Users,
  DollarSign
} from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const role = user?.role;

  // Keep it to max 4-5 focused, uncluttered tabs on mobile screens
  let tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'attendance', label: 'Check-In', icon: QrCode },
  ];

  if (role === 'SUPER_ADMIN') {
    tabs = [
      { id: 'dashboard', label: 'Overview', icon: Crown },
      { id: 'tenants', label: 'Tenants', icon: Building2 },
      { id: 'plans', label: 'Plans', icon: DollarSign },
      { id: 'reports', label: 'Analytics', icon: BarChart3 },
    ];
  } else if (role === 'STORE_OWNER') {
    tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'Fast POS', icon: ShoppingCart },
      { id: 'matrix', label: 'Inventory', icon: Layers },
      { id: 'hrm', label: 'HRM', icon: Users },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];
  } else if (role === 'STORE_MANAGER') {
    tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'Fast POS', icon: ShoppingCart },
      { id: 'attendance', label: 'Attendance', icon: QrCode },
      { id: 'requisitions', label: 'Transfers', icon: ClipboardCheck },
    ];
  } else if (role === 'SALESMAN') {
    tabs = [
      { id: 'dashboard', label: 'Targets', icon: TrendingUp },
      { id: 'pos', label: 'Catalog', icon: ShoppingCart },
      { id: 'attendance', label: 'Check-In', icon: QrCode },
    ];
  } else if (role === 'CASHIER') {
    tabs = [
      { id: 'dashboard', label: 'Register', icon: LayoutDashboard },
      { id: 'pos', label: 'Fast POS', icon: ShoppingCart },
      { id: 'attendance', label: 'Check-In', icon: QrCode },
    ];
  } else if (role === 'INVENTORY_CLERK') {
    tabs = [
      { id: 'dashboard', label: 'Warehouse', icon: LayoutDashboard },
      { id: 'matrix', label: 'Inventory', icon: Layers },
      { id: 'requisitions', label: 'Requests', icon: ClipboardCheck },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 md:hidden pointer-events-none">
      <div className="mx-auto max-w-sm rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl shadow-2xl flex h-16 items-center justify-around px-2 pointer-events-auto ring-1 ring-black/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
                isActive 
                  ? 'text-emerald-700 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-emerald-100/90 shadow-xs scale-105' : 'bg-transparent'
              }`}>
                <Icon className={`h-4.5 w-4.5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none truncate max-w-[56px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
