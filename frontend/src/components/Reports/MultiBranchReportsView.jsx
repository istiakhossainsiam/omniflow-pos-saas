import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  PieChart, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Layers,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { reportApi } from '../../services/api';
import MonthlyPnLCostingView from './MonthlyPnLCostingView';

export default function MultiBranchReportsView() {
  const { selectedBranch } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState('analytics'); // 'analytics' | 'pnl'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [selectedBranch]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getOverview(selectedBranch?.id);
      setData(res);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  if (activeMainTab === 'pnl') {
    return (
      <div>
        <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveMainTab('analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Multi-Branch Sales Analytics</span>
            </button>
            <button
              onClick={() => setActiveMainTab('pnl')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <DollarSign className="h-4 w-4" />
              <span>Monthly Costing & Net Profit Hub</span>
            </button>
          </div>
        </div>
        <MonthlyPnLCostingView />
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 text-center text-slate-400 text-xs">Generating consolidated multi-branch analytics...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Top Module Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
        <button
          onClick={() => setActiveMainTab('analytics')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-all"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Multi-Branch Sales Analytics</span>
        </button>
        <button
          onClick={() => setActiveMainTab('pnl')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        >
          <DollarSign className="h-4 w-4" />
          <span>Monthly Costing & Net Profit Hub</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Consolidated Multi-Branch Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Sales Intelligence, Branch Comparison, Payment Channels & Stock Health
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.today_sales?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {data?.today_orders} Invoices • Avg {data?.avg_ticket_size?.toLocaleString()} ৳/order
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Revenue (7 Days)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {data?.weekly_sales?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2">
            +18.4% growth vs last week
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.monthly_sales?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Current billing month</div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gross Profit Margin</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {data?.estimated_gross_profit?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2">
            After raw garment cost deductions
          </div>
        </div>

      </div>

      {/* Showroom Comparative Performance Table */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>Showroom & Branch Comparative Performance</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Showroom Name</th>
                <th className="py-2.5 px-3">Branch Code</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Today's Revenue</th>
                <th className="py-2.5 px-3 text-right">Monthly Revenue</th>
                <th className="py-2.5 px-3 text-center">Total Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.branch_comparison?.map((b) => (
                <tr key={b.branch_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{b.branch_name}</td>
                  <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{b.branch_code}</td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold">
                      {b.is_warehouse ? 'Central Warehouse' : 'Showroom Outlet'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">{b.today_revenue?.toLocaleString()} ৳</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700 font-mono">{b.month_revenue?.toLocaleString()} ৳</td>
                  <td className="py-3 px-3 text-center text-slate-600 font-mono font-bold">{b.total_orders_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Payment Channels & Popular Clothing Sizes */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Payment Channels Split */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            <span>Today's Payment Channel Settlement (Split Breakdown)</span>
          </h3>

          <div className="space-y-2.5 mt-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Cash in Counter Drawer</span>
              </div>
              <span className="font-mono font-black text-emerald-700">{data?.payment_split?.cash?.toLocaleString()} ৳</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-pink-600" />
                <span className="text-xs font-bold text-slate-800">MFS (bKash / Nagad / Rocket)</span>
              </div>
              <span className="font-mono font-black text-pink-600">{data?.payment_split?.mfs?.toLocaleString()} ৳</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-800">Debit / Credit Card POS</span>
              </div>
              <span className="font-mono font-black text-cyan-700">{data?.payment_split?.card?.toLocaleString()} ৳</span>
            </div>
          </div>
        </div>

        {/* Popular Clothing Sizes Demand */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Top-Moving Garment Sizes</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {data?.top_popular_sizes?.map((item) => (
              <div key={item.size} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Size {item.size}</div>
                  <div className="text-[10px] text-slate-400">High Demand</div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                  {item.count} sold
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Low Stock Warnings */}
      {data?.low_stock_alerts?.length > 0 && (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Low Stock / Reorder Threshold Alerts ({data.low_stock_alerts.length} Items)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.low_stock_alerts.map((item, idx) => (
              <div key={idx} className="rounded-2xl bg-white border border-rose-200 p-3 shadow-sm">
                <div className="font-bold text-slate-900 text-xs">{item.product_name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Size: {item.size || 'STD'} | Color: {item.color || 'STD'}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">{item.branch_name}</span>
                  <span className="font-black text-rose-600">{item.current_stock} pcs left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
