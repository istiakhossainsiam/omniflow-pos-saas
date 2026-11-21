import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportApi, employeeApi, attendanceApi, posApi, productApi } from '../../services/api';
import { 
  Store, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles,
  RefreshCw,
  PlusCircle,
  Truck,
  ScanLine
} from 'lucide-react';

export default function ManagerDashboardView({ onNavigate }) {
  const { user, selectedBranch } = useAuth();
  const [report, setReport] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [salesmen, setSalesmen] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dhakaTime, setDhakaTime] = useState('');

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
    loadManagerData();
  }, [selectedBranch]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      const branchId = selectedBranch?.id;
      const [repData, attData, shiftData, empData, prodData] = await Promise.all([
        reportApi.getOverview(branchId),
        attendanceApi.listRecords({ branch_id: branchId }),
        posApi.getShiftSummary(branchId),
        employeeApi.list(branchId),
        productApi.list({ branch_id: branchId })
      ]);

      setReport(repData);
      setAttendanceRecords(attData);
      setShiftSummary(shiftData);
      setSalesmen(empData.filter(e => e.role === 'SALESMAN'));

      // Filter low stock items for this branch (< 5 items)
      const lowList = [];
      (prodData || []).forEach(p => {
        (p.variants || []).forEach(v => {
          const bStock = (v.stocks || []).find(s => s.branch_id === branchId);
          const qty = bStock ? bStock.quantity : 0;
          if (qty <= 3) {
            lowList.push({
              id: v.id,
              name: p.name,
              size: v.size,
              color: v.color,
              sku: v.sku,
              quantity: qty
            });
          }
        });
      });
      setLowStockProducts(lowList.slice(0, 5));

    } catch (err) {
      console.error("Failed to load manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAttendance = async (recId) => {
    try {
      await attendanceApi.verifyQueue(recId);
      loadManagerData();
    } catch (err) {
      alert("Failed to verify attendance: " + err.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Store className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Showroom Control Center
            </h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-emerald-200">
              {selectedBranch?.name || 'Showroom'} ({selectedBranch?.code || 'HQ'})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daily Target Tracking, Cashier Reconciliation, Staff 2FA Presence & Stock Management
          </p>
        </div>

        {/* Live Dhaka Time & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs font-mono font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{dhakaTime || 'Asia/Dhaka (GMT+6)'}</span>
          </div>

          <button
            onClick={loadManagerData}
            title="Refresh Live Metrics"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Showroom Sales */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Showroom Sales</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(report?.today_sales || 0).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              <span>{report?.today_orders || 0} Bills Cleared</span>
            </div>
          </div>
        </div>

        {/* Cash in Drawer */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash in Drawer</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(shiftSummary?.cash_in_drawer || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-bold text-blue-700">
              bKash/Card: ৳ {((shiftSummary?.card_collected || 0) + (shiftSummary?.mfs_collected || 0)).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Staff Attendance Present */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Staff On Duty</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {attendanceRecords.filter(r => r.check_in_time).length} / {salesmen.length + 2}
            </div>
            <div className="mt-1 text-[11px] font-bold text-purple-700">
              {attendanceRecords.filter(r => r.status === 'LATE').length} Late Today
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {lowStockProducts.length} Items Low
            </div>
            <div className="mt-1 text-[11px] font-semibold text-amber-700">
              Requisition Needed
            </div>
          </div>
        </div>

      </div>

      {/* Main Sections: Attendance Queue & Shift Invoices */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Showroom Staff Attendance & Handshake Queue */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Today Showroom Attendance</h3>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Generate 60s QR →
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {attendanceRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No staff check-ins recorded yet today.
                </div>
              ) : (
                attendanceRecords.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${rec.is_verified_by_manager ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rec.employee_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {rec.employee_code} • {rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold ${
                        rec.status === 'ON_TIME' ? 'bg-emerald-100 text-emerald-800' :
                        rec.status === 'LATE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status} {rec.late_minutes > 0 ? `(${rec.late_minutes}m)` : ''}
                      </span>

                      {!rec.is_verified_by_manager && (
                        <button
                          onClick={() => handleVerifyAttendance(rec.id)}
                          className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Open 2FA Manager Presence Terminal</span>
            </button>
          </div>
        </div>

        {/* Low Stock Warning & 1-Click Warehouse Requisition */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Low Stock Showroom Replenishment</h3>
              </div>
              <button
                onClick={() => onNavigate('requisitions')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Stock Requisitions →
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ✓ All products well-stocked in {selectedBranch?.name}.
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-amber-50/50 p-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SIZE: {p.size} • COLOR: {p.color} • SKU: {p.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700 border border-rose-200">
                        {p.quantity} Left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('requisitions')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-50 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all border border-amber-200"
            >
              <PlusCircle className="h-4 w-4 text-amber-700" />
              <span>Request Requisition from Central Warehouse</span>
            </button>
          </div>
        </div>

      </div>

      {/* Quick Launch Action Bar */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('pos')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 p-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Launch Fast POS</span>
        </button>

        <button
          onClick={() => onNavigate('portal')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <span>Sales Staff Targets</span>
        </button>

        <button
          onClick={() => onNavigate('matrix')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Layers className="h-4 w-4 text-blue-600" />
          <span>Showroom Stock & Matrix</span>
        </button>

        <button
          onClick={() => onNavigate('requisitions')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Truck className="h-4 w-4 text-amber-600" />
          <span>Stock Transfers</span>
        </button>
      </div>

    </div>
  );
}
