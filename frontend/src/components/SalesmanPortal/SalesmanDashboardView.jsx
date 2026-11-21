import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Target, 
  ShoppingBag, 
  UserCheck, 
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { employeeApi } from '../../services/api';

export default function SalesmanDashboardView() {
  const { user, selectedBranch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newTargetAmount, setNewTargetAmount] = useState(200000);
  const [newTargetItems, setNewTargetItems] = useState(50);
  const [newTargetBonus, setNewTargetBonus] = useState(5000);

  // Admin / Store Owner Salesperson Selector
  const isManagerOrOwner = user?.role === 'STORE_OWNER' || user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_MANAGER';
  const [salesStaff, setSalesStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    loadStaffAndDashboard();
  }, [user, selectedBranch]);

  const loadStaffAndDashboard = async () => {
    try {
      setLoading(true);
      if (isManagerOrOwner) {
        const staffList = await employeeApi.list(selectedBranch?.id);
        const salesmen = staffList.filter(s => s.role === 'SALESMAN' || s.role === 'CASHIER' || s.role === 'STORE_MANAGER');
        setSalesStaff(salesmen);
        const targetId = selectedStaffId && salesmen.some(s => s.id === selectedStaffId)
          ? selectedStaffId
          : (salesmen[0]?.id || user?.id);
        
        setSelectedStaffId(targetId);
        const res = await employeeApi.getSalesmanDashboard(targetId, selectedBranch?.id);
        setData(res);
        setNewTargetAmount(res.month_target);
      } else {
        const res = await employeeApi.getSalesmanDashboard(user?.id, selectedBranch?.id);
        setData(res);
        setNewTargetAmount(res.month_target);
      }
    } catch (err) {
      console.error("Failed to load salesman dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = async (staffId) => {
    setSelectedStaffId(staffId);
    try {
      setLoading(true);
      const res = await employeeApi.getSalesmanDashboard(staffId, selectedBranch?.id);
      setData(res);
      setNewTargetAmount(res.month_target);
    } catch (err) {
      console.error("Failed to switch staff dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    try {
      const targetUserId = (isManagerOrOwner && selectedStaffId) ? selectedStaffId : user.id;
      await employeeApi.setTarget({
        user_id: targetUserId,
        month_year: data?.month_year || '2026-10',
        target_amount: parseFloat(newTargetAmount) || 200000,
        target_items_count: parseInt(newTargetItems) || 50,
        bonus_on_achieve: parseFloat(newTargetBonus) || 5000
      });
      setShowTargetModal(false);
      const res = await employeeApi.getSalesmanDashboard(targetUserId, selectedBranch?.id);
      setData(res);
      alert(`Target for ${data?.salesman_name} updated to ${parseFloat(newTargetAmount).toLocaleString()} ৳!`);
    } catch (err) {
      alert(err.message || "Failed to update target");
    }
  };

  if (loading && !data) {
    return <div className="py-16 text-center text-slate-400 text-xs">Loading sales performance data...</div>;
  }

  const pct = Math.min(100, data?.achievement_percentage || 0);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Header & Salesperson Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Sales Representative Target & Commission Hub</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Viewing Target for <strong className="text-slate-900">{data?.salesman_name}</strong> ({data?.employee_code}) • {data?.branch_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Salesperson Selector for Admins / Managers */}
          {isManagerOrOwner && salesStaff.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <select
                value={selectedStaffId}
                onChange={(e) => handleSelectStaff(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {salesStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.employee_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowTargetModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Adjust / Set Target</span>
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales Attributed</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.today_sales?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{data?.today_orders_count} Invoices Served Today</span>
          </div>
        </div>

        {/* Month Sales vs Target */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Target vs Sales</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {data?.month_sales?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Target: <strong className="text-slate-800 font-bold">{data?.month_target?.toLocaleString()} ৳</strong>
          </div>
        </div>

        {/* Earned Commission */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Earned Incentive (This Month)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            +{data?.estimated_commission_earned?.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
            <Award className="h-3.5 w-3.5" />
            <span>Calculated at 2.5% Rate</span>
          </div>
        </div>

        {/* Attendance Today */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</div>
          <div className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <span>{data?.attendance_status_today}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Shift Handshake Verified</div>
        </div>

      </div>

      {/* Target Progress Bar Showcase */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <span>Target Achievement Progress ({data?.month_year})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Reach 100% to qualify for additional 5,000 ৳ performance bonus!</p>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{data?.achievement_percentage}%</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 p-0.5">
          <div 
            className="bg-emerald-600 h-full rounded-full transition-all duration-1000 shadow-sm"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 font-medium">
          <span>0 ৳</span>
          <span>50% Target</span>
          <span>{data?.month_target?.toLocaleString()} ৳ (Goal)</span>
        </div>
      </div>

      {/* Recent Attributed Invoices */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">My Recent Sales Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Invoice Number</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Sold</th>
                <th className="py-2.5 px-3 text-right">Invoice Total</th>
                <th className="py-2.5 px-3 text-right">My Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {data?.recent_sales?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No sales transactions attributed yet today.</td>
                </tr>
              ) : (
                data?.recent_sales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{sale.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600">{sale.customer_name || 'Walk-in'} ({sale.customer_phone || 'N/A'})</td>
                    <td className="py-3 px-3 text-slate-500">{sale.items?.length || 1} items</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">{sale.total_amount?.toLocaleString()} ৳</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">
                      +{(sale.total_amount * 0.025).toFixed(0)} ৳
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Setting Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base">Set Monthly Performance Target</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setting target for <strong className="text-slate-900">{data?.salesman_name}</strong> ({data?.employee_code})
            </p>
            <form onSubmit={handleUpdateTarget} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Monthly Sales Target (৳):</label>
                <input
                  type="number"
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="200000"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Target Items Count:</label>
                  <input
                    type="number"
                    value={newTargetItems}
                    onChange={(e) => setNewTargetItems(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Achieve Bonus (৳):</label>
                  <input
                    type="number"
                    value={newTargetBonus}
                    onChange={(e) => setNewTargetBonus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-emerald-700 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
