import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { posApi, attendanceApi } from '../../services/api';
import { 
  ShoppingBag, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Printer, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  FileText,
  UserCheck,
  Sparkles,
  Search
} from 'lucide-react';
import ThermalReceiptModal from '../FastPOS/ThermalReceiptModal';

export default function CashierDashboardView({ onNavigate }) {
  const { user, selectedBranch } = useAuth();
  const [shiftData, setShiftData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dhakaTime, setDhakaTime] = useState('');
  const [reprintOrder, setReprintOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    loadCashierData();
  }, [selectedBranch]);

  const loadCashierData = async () => {
    try {
      setLoading(true);
      const [shift, att] = await Promise.all([
        posApi.getShiftSummary(selectedBranch?.id),
        attendanceApi.getStatus()
      ]);
      setShiftData(shift);
      setAttendanceStatus(att);
    } catch (err) {
      console.error("Failed to load cashier shift data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = (shiftData?.recent_invoices || []).filter(inv => {
    return !searchQuery || 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_phone?.includes(searchQuery);
  });

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cashier Terminal Command
            </h1>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-blue-200">
              CASHIER SHIFT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cash Drawer Reconciliation, Today's Invoices & Fast POS Billing Terminal
          </p>
        </div>

        {/* Live Dhaka Time & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs font-mono font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{dhakaTime || 'Asia/Dhaka (GMT+6)'}</span>
          </div>

          <button
            onClick={loadCashierData}
            title="Refresh Shift Data"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Action Hero: Launch Fast POS Button */}
      <div className="mt-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-xl shadow-emerald-600/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Active Cashier Register Ready</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Cashier: <span className="font-bold text-white">{user?.full_name}</span> ({user?.employee_code}) • {selectedBranch?.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('pos')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-emerald-800 shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
        >
          <span>OPEN FAST POS TERMINAL</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards: Shift Balance Breakdown */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Cash in Drawer */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash in Drawer</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(shiftData?.cash_in_drawer || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-700">
              Physical Cash Collection
            </div>
          </div>
        </div>

        {/* bKash / Nagad / MFS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">bKash / Nagad</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-pink-50 text-pink-700 border border-pink-100">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(shiftData?.mfs_collected || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-pink-700">
              Digital Mobile Wallets
            </div>
          </div>
        </div>

        {/* Card Payments */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Card / POS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(shiftData?.card_collected || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-blue-700">
              Visa / Mastercard / Amex
            </div>
          </div>
        </div>

        {/* Total Shift Sales */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Total</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ৳ {(shiftData?.today_total_sales || 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-bold text-purple-700">
              {shiftData?.today_invoices_count || 0} Bills Cleared Today
            </div>
          </div>
        </div>

      </div>

      {/* Shift Invoices List with 1-Click Thermal Reprint */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Today's Invoices ({filteredInvoices.length})
            </h3>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No transactions recorded for this shift yet. Click "Open Fast POS Terminal" above to bill.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Total (৳)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.customer_phone || 'Walk-in'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">
                      {inv.items_count} items
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {(inv.payment_methods || []).map((m, idx) => (
                          <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      ৳ {inv.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setReprintOrder({
                          id: inv.id,
                          invoice_number: inv.invoice_number,
                          customer_name: inv.customer_name,
                          customer_phone: inv.customer_phone,
                          total_amount: inv.total_amount,
                          paid_amount: inv.total_amount,
                          change_due: 0,
                          created_at: inv.created_at,
                          items: []
                        })}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm"
                      >
                        <Printer className="h-3 w-3 text-emerald-600" />
                        <span>Reprint</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Thermal Receipt Reprint Modal */}
      {reprintOrder && (
        <ThermalReceiptModal
          order={reprintOrder}
          onClose={() => setReprintOrder(null)}
        />
      )}

    </div>
  );
}
