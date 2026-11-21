import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportApi, employeeApi, productApi, tenantApi } from '../../services/api';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  ArrowUpRight, 
  Sparkles, 
  Sliders, 
  Store, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Package, 
  Award, 
  ChevronRight, 
  RefreshCw, 
  Globe,
  Banknote,
  ArrowRight,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

import OwnerDailyDigestModal from '../Reports/OwnerDailyDigestModal';
import OneClickSalarySheetModal from '../Reports/OneClickSalarySheetModal';

export default function OwnerDashboardView({ onNavigate, onOpenSettings }) {
  const { user, tenant, branches, selectedBranch } = useAuth();
  const [report, setReport] = useState(null);
  const [salesmen, setSalesmen] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dhakaTime, setDhakaTime] = useState('');
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [showSalarySheetModal, setShowSalarySheetModal] = useState(false);

  // Live Dhaka Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);
      setDhakaTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [selectedBranch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [repData, empData, prodData] = await Promise.all([
        reportApi.getOverview(),
        employeeApi.list(),
        productApi.list()
      ]);
      setReport(repData);
      setSalesmen(empData.filter(e => e.role === 'SALESMAN'));
      setProducts(prodData);
    } catch (err) {
      console.error("Failed to load owner dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalStockValuation = products.reduce((acc, p) => {
    const pVal = (p.variants || []).reduce((vAcc, v) => {
      const totalQty = (v.stocks || []).reduce((sAcc, s) => sAcc + (s.quantity || 0), 0);
      return vAcc + (totalQty * (v.cost_price || v.selling_price || 0));
    }, 0);
    return acc + pVal;
  }, 0);

  const totalVariantsCount = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 pb-24 md:pb-12 animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Executive Command Hub
            </h1>
            <span className="rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-extrabold px-3 py-1 border border-emerald-200">
              STORE HQ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time Multi-Showroom Telemetry · Financial Margins · Staff & Stock Matrix
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDigestModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Daily Business Digest</span>
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 shadow-xs text-xs font-mono font-medium text-slate-700">
            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="tabular-nums">{dhakaTime || 'Asia/Dhaka (GMT+6)'}</span>
          </div>

          <button
            onClick={loadDashboardData}
            title="Refresh Live Metrics"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today Consolidated Sales */}
        <div className="card-luxury rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Today's Sales</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display tabular-nums">
            ৳ {(report?.today_sales || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{report?.today_orders || 0} completed invoices</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="card-luxury rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Estimated Profit</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display tabular-nums">
            ৳ {(report?.gross_profit || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-500">
            Margin: <span className="text-teal-700 font-extrabold">{report?.profit_margin_percent || 0}%</span> of gross
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="card-luxury rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Month-to-Date</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display tabular-nums">
            ৳ {(report?.monthly_sales || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Across {branches.length} active showrooms
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="card-luxury rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Stock Asset</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display tabular-nums">
            ৳ {totalStockValuation.toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            {totalVariantsCount} distinct matrix variants
          </div>
        </div>

      </div>

      {/* Main Grid: Showrooms Performance & Quick Actions */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Showroom Comparative Revenue */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Store className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-display">
                Showroom Revenue Leaderboard & Target Velocity
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
              {branches.length} Outlets Tracked
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            {(report?.branch_breakdown || branches).map((b, idx) => {
              const bSales = b.total_sales || 0;
              const maxSales = Math.max(...(report?.branch_breakdown?.map(x => x.total_sales) || [1]), 1000);
              const pct = Math.min(100, Math.round((bSales / maxSales) * 100));

              return (
                <div key={b.branch_id || b.id || idx} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 hover:bg-slate-100/90 hover:border-slate-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-extrabold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{b.branch_name || b.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">CODE: {b.branch_code || b.code}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 tabular-nums">৳ {bSales.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{b.orders_count || 0} counter orders</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Action Studio Bar & System Management */}
        <div className="space-y-5">
          
          {/* Quick Hub Panel */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              Executive Fast Actions
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('online-orders')}
                className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                      <span>Online E-Com Orders</span>
                      <span className="rounded bg-emerald-200 text-emerald-800 text-[8px] font-black px-1.5 py-0.5">LIVE</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Dispatches, Invoices & Delivery Tracking
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setShowSalarySheetModal(true)}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-purple-50/60 hover:border-purple-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                    <Banknote className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900 flex items-center gap-1.5">
                      <span>1-Click Salary Sheet</span>
                      <span className="rounded bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5">AUTO</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Staff Pay, Deductions & Printable Slips
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      Financial P&L Auditing
                    </div>
                    <div className="text-[10px] text-slate-500">
                      COGS, Payroll, Rent & Net Margin Breakdown
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('matrix')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      Matrix & Hangtag Studio
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Size-Color SKUs, Thermal Barcode & QR Print
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('hrm')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-teal-50/60 hover:border-teal-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                      HRM Suite & Rosters
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Leaves, Overtime, Shifts & Commissions
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Payment Gateway Breakdown */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Payment Channel Mix (Today)
            </h3>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-3">
                <div className="text-[10px] font-bold text-emerald-800">Cash Counter</div>
                <div className="text-xs font-black text-slate-900 mt-1 tabular-nums">
                  ৳ {(report?.today_cash || 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl bg-pink-50/80 border border-pink-100 p-3">
                <div className="text-[10px] font-bold text-pink-800">bKash / MFS</div>
                <div className="text-xs font-black text-slate-900 mt-1 tabular-nums">
                  ৳ {(report?.today_mfs || 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-3">
                <div className="text-[10px] font-bold text-blue-800">Card / POS</div>
                <div className="text-xs font-black text-slate-900 mt-1 tabular-nums">
                  ৳ {(report?.today_card || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {showDigestModal && (
        <OwnerDailyDigestModal
          branchId={selectedBranch?.id}
          tenant={tenant}
          onClose={() => setShowDigestModal(false)}
        />
      )}

      {showSalarySheetModal && (
        <OneClickSalarySheetModal
          onClose={() => setShowSalarySheetModal(false)}
        />
      )}

    </div>
  );
}
