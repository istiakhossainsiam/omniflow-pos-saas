import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../services/api';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download, 
  Zap, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Search, 
  Sliders, 
  FileText, 
  X, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Award
} from 'lucide-react';

export default function OneClickSalarySheetModal({ onClose, initialMonth }) {
  const { tenant, branches, selectedBranch } = useAuth();
  
  const now = new Date();
  const defaultMonth = initialMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [branchFilter, setBranchFilter] = useState(selectedBranch?.id || '');
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'

  // Individual Disburse Modal State
  const [selectedStaffToPay, setSelectedStaffToPay] = useState(null);
  const [payForm, setPayForm] = useState({
    payment_method: 'CASH',
    other_allowance: 0,
    advance_deduction: 0,
    notes: ''
  });
  const [submittingPay, setSubmittingPay] = useState(false);

  // Individual Pay Slip Print State
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState(null);

  // 1-Click Disburse All Confirmation Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPaymentMethod, setBatchPaymentMethod] = useState('CASH');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  useEffect(() => {
    fetchSalarySheet();
  }, [selectedMonth, branchFilter]);

  const fetchSalarySheet = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getSalarySheet(selectedMonth, branchFilter || undefined);
      setSheetData(res);
    } catch (err) {
      console.error("Failed to load salary sheet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthYear);
  };

  const formatMonthName = (my) => {
    if (!my) return '';
    const [year, month] = my.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // Open individual pay modal
  const openPayModal = (staff) => {
    setSelectedStaffToPay(staff);
    setPayForm({
      payment_method: staff.payment_method || 'CASH',
      other_allowance: staff.other_allowance || 0,
      advance_deduction: staff.advance_deduction || 0,
      notes: staff.notes || ''
    });
  };

  // Submit Individual Pay
  const handleIndividualPaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffToPay) return;

    try {
      setSubmittingPay(true);
      await reportApi.disburseSalary({
        month_year: selectedMonth,
        employee_id: selectedStaffToPay.employee_id,
        payment_method: payForm.payment_method,
        other_allowance: parseFloat(payForm.other_allowance || 0),
        advance_deduction: parseFloat(payForm.advance_deduction || 0),
        notes: payForm.notes
      });

      setSelectedStaffToPay(null);
      fetchSalarySheet();
    } catch (err) {
      console.error("Failed to disburse salary:", err);
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingPay(false);
    }
  };

  // 1-Click Disburse All Staff
  const handleBatchDisburse = async () => {
    try {
      setBatchSubmitting(true);
      const res = await reportApi.disburseSalary({
        month_year: selectedMonth,
        branch_id: branchFilter || undefined,
        disburse_all: true,
        payment_method: batchPaymentMethod
      });

      setShowBatchModal(false);
      alert(res.message || "All pending salaries have been disbursed successfully!");
      fetchSalarySheet();
    } catch (err) {
      console.error("Batch disburse failed:", err);
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!sheetData?.salary_sheet) return;
    const headers = [
      "Employee Code", "Name", "Designation", "Branch", 
      "Present Days", "Late Days", "Base Salary", 
      "Commission", "Target Bonus", "Allowances", 
      "Deductions", "Net Payable (BDT)", "Payment Status", "Payment Method"
    ];

    const rows = sheetData.salary_sheet.map(s => [
      `"${s.employee_code}"`,
      `"${s.name}"`,
      `"${s.designation}"`,
      `"${s.branch_name}"`,
      s.present_days,
      s.late_days,
      s.base_salary,
      s.sales_commission,
      s.target_bonus,
      s.other_allowance,
      s.total_deductions,
      s.net_payable,
      `"${s.payment_status}"`,
      `"${s.payment_method}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Salary_Sheet_${selectedMonth}_${tenant?.name || 'Store'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rawList = sheetData?.salary_sheet || [];
  const filteredStaff = rawList.filter(s => {
    const matchStatus = statusFilter === 'ALL' || s.payment_status === statusFilter;
    const matchSearch = searchQuery === '' || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery));
    return matchStatus && matchSearch;
  });

  const summary = sheetData?.summary || {};
  const unpaidCount = summary.unpaid_count || 0;
  const totalNetPayroll = summary.total_net_payroll || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Top Sticky Header */}
        <div className="shrink-0 bg-white border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    1-Click Monthly Salary Sheet & Payslips
                  </h1>
                  <span className="hidden sm:inline-block rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-200 uppercase">
                    Auto-Synchronized with P&L
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {tenant?.name || 'Store'} • Base Salaries, Commissions, Target Milestone Bonuses & Attendance Deductions
                </p>
              </div>
            </div>

            {/* Top Month & Action Controls */}
            <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-between lg:justify-end">
              
              {/* Branch Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">All Outlets (Consolidated)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 text-xs font-bold text-slate-700">
                <button 
                  onClick={() => handleMonthChange(-1)} 
                  className="px-2 py-1 rounded-xl hover:bg-white text-slate-600 transition-all font-black"
                  title="Previous Month"
                >
                  ←
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  />
                </div>
                <button 
                  onClick={() => handleMonthChange(1)} 
                  className="px-2 py-1 rounded-xl hover:bg-white text-slate-600 transition-all font-black"
                  title="Next Month"
                >
                  →
                </button>
              </div>

              {/* ⚡ 1-Click Disburse All Button */}
              <button
                onClick={() => setShowBatchModal(true)}
                disabled={unpaidCount === 0}
                className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-black shadow-md transition-all ${
                  unpaidCount > 0 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                title="Disburse remaining unpaid salaries in 1-Click"
              >
                <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                <span>⚡ 1-Click Disburse All ({unpaidCount})</span>
              </button>

              {/* Export & Print */}
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
                title="Export to Excel CSV"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
                title="Print Salary Sheet"
              >
                <Printer className="h-4 w-4" />
              </button>

              {/* Close Modal */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

          </div>

          {/* Executive Summary Metrics Grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {summary.total_staff_count || 0}
              </div>
              <div className="text-[10px] font-medium text-emerald-600">
                {summary.paid_count || 0} Paid • {summary.unpaid_count || 0} Unpaid
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Salaries</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
                ৳ {(summary.total_base_salaries || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Fixed Monthly Payroll</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commissions</span>
              <div className="text-lg sm:text-xl font-black text-purple-700 mt-0.5 font-mono">
                ৳ {(summary.total_commissions || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-purple-600 font-medium">Sales Incentive</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Bonuses</span>
              <div className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 font-mono">
                ৳ {(summary.total_target_bonuses || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-600 font-medium">Milestone Rewards</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deductions</span>
              <div className="text-lg sm:text-xl font-black text-rose-600 mt-0.5 font-mono">
                -৳ {(summary.total_deductions || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-500 font-medium">Late & Advance</div>
            </div>

            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Net Payroll Payout</span>
              <div className="text-lg sm:text-xl font-black text-emerald-900 mt-0.5 font-mono">
                ৳ {totalNetPayroll.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-emerald-700">
                {formatMonthName(selectedMonth)}
              </div>
            </div>

          </div>

          {/* Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, code, designation..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Filter Status:</span>
              {['ALL', 'UNPAID', 'PAID'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st} {st === 'UNPAID' ? `(${summary.unpaid_count || 0})` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Salary Sheet Scrollable Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 animate-spin mb-3">
                <RefreshCw className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-500">
                Generating 1-Click Salary Sheet for {formatMonthName(selectedMonth)}...
              </p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No staff records found matching your filters for {formatMonthName(selectedMonth)}.
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Staff / Employee</th>
                    <th className="py-3 px-3 text-center">Attendance</th>
                    <th className="py-3 px-3 text-right">Base Salary</th>
                    <th className="py-3 px-3 text-right">Sales Comm.</th>
                    <th className="py-3 px-3 text-right">Target Bonus</th>
                    <th className="py-3 px-3 text-right">Deduction</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStaff.map((staff) => {
                    const isPaid = staff.payment_status === 'PAID';

                    return (
                      <tr key={staff.employee_id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Employee Identity */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className="font-bold text-slate-700">{staff.employee_code}</span>
                            <span>•</span>
                            <span>{staff.designation}</span>
                            <span>•</span>
                            <span className="text-emerald-700">{staff.branch_name}</span>
                          </div>
                        </td>

                        {/* Attendance Summary */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <div className="text-[11px] font-bold text-slate-800">
                              <span className="text-emerald-700 font-black">{staff.present_days}</span>
                              <span className="text-slate-400">/{staff.total_working_days}d</span>
                            </div>
                            {staff.late_days > 0 && (
                              <span className="text-[9px] font-bold text-amber-600">
                                {staff.late_days} late
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3 px-3 text-right font-mono text-slate-900 font-bold">
                          ৳ {staff.base_salary.toLocaleString()}
                        </td>

                        {/* Commission */}
                        <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                          {staff.sales_commission > 0 ? `+৳ ${staff.sales_commission.toLocaleString()}` : '—'}
                        </td>

                        {/* Target Bonus */}
                        <td className="py-3 px-3 text-right font-mono">
                          {staff.target_bonus > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Award className="h-3 w-3" />
                              <span>+৳{staff.target_bonus.toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Deductions */}
                        <td className="py-3 px-3 text-right font-mono text-rose-500 font-bold">
                          {staff.total_deductions > 0 ? `-৳ ${staff.total_deductions.toLocaleString()}` : '—'}
                        </td>

                        {/* Net Payable */}
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          ৳ {staff.net_payable.toLocaleString()}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                              <AlertCircle className="h-3 w-3" />
                              <span>UNPAID</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Disburse / Pay button */}
                            {!isPaid ? (
                              <button
                                onClick={() => openPayModal(staff)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all"
                              >
                                <Zap className="h-3 w-3" />
                                <span>Pay</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openPayModal(staff)}
                                className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-all"
                                title="Edit disbursement details"
                              >
                                Edit
                              </button>
                            )}

                            {/* Print Individual Pay Slip */}
                            <button
                              onClick={() => setSelectedStaffForSlip(staff)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
                              title="Print Employee Pay Slip (বেতন রসিদ)"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>
              Disbursed salaries are automatically entered as Expense Vouchers in the <strong>P&L Costing Statement</strong>.
            </span>
          </div>
          <button
            onClick={fetchSalarySheet}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

      </div>

      {/* 1-Click Batch Disburse Confirmation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Zap className="h-6 w-6 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">⚡ 1-Click Disburse All Salaries</h3>
                <p className="text-xs text-slate-500">Batch salary payout for {formatMonthName(selectedMonth)}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex justify-between text-xs font-bold text-emerald-900">
                  <span>Pending Staff Count:</span>
                  <span>{unpaidCount} Employees</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-900 mt-2">
                  <span>Total Net Payout:</span>
                  <span className="text-sm font-black font-mono">৳ {totalNetPayroll.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Payment Channel / Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash Drawer', icon: Banknote },
                    { id: 'BANK', label: 'Bank Transfer', icon: CreditCard },
                    { id: 'BKASH', label: 'bKash / MFS', icon: Smartphone }
                  ].map(pm => {
                    const Icon = pm.icon;
                    const isSelected = batchPaymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setBatchPaymentMethod(pm.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' 
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                • This will mark all {unpaidCount} staff salaries as <strong>PAID</strong>.<br />
                • Automated expense vouchers will be logged in the tenant's financial costing ledger.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={batchSubmitting}
                  onClick={handleBatchDisburse}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {batchSubmitting ? 'Processing Batch...' : 'Confirm 1-Click Payout'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Individual Staff Pay / Adjustment Modal */}
      {selectedStaffToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Disburse Staff Salary</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStaffToPay.name} ({selectedStaffToPay.employee_code})
                </p>
              </div>
              <button
                onClick={() => setSelectedStaffToPay(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIndividualPaySubmit} className="mt-4 space-y-3">
              
              {/* Earnings Breakdown summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Salary:</span>
                  <span className="font-mono font-bold">৳ {selectedStaffToPay.base_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Sales Commission:</span>
                  <span className="font-mono">+৳ {selectedStaffToPay.sales_commission.toLocaleString()}</span>
                </div>
                {selectedStaffToPay.target_bonus > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Target Bonus:</span>
                    <span className="font-mono">+৳ {selectedStaffToPay.target_bonus.toLocaleString()}</span>
                  </div>
                )}
                {selectedStaffToPay.attendance_deduction > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold">
                    <span>Late Attendance Penalty:</span>
                    <span className="font-mono">-৳ {selectedStaffToPay.attendance_deduction.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Adjustments: Allowances & Advance Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Allowance (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payForm.other_allowance}
                    onChange={(e) => setPayForm(prev => ({ ...prev, other_allowance: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Deducted (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payForm.advance_deduction}
                    onChange={(e) => setPayForm(prev => ({ ...prev, advance_deduction: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-rose-600 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Calculated Net Preview */}
              {(() => {
                const base = selectedStaffToPay.base_salary || 0;
                const comm = selectedStaffToPay.sales_commission || 0;
                const bonus = selectedStaffToPay.target_bonus || 0;
                const attDed = selectedStaffToPay.attendance_deduction || 0;
                const allow = parseFloat(payForm.other_allowance || 0);
                const adv = parseFloat(payForm.advance_deduction || 0);
                const calcNet = Math.max(0, base + comm + bonus + allow - attDed - adv);

                return (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">Total Net Disbursable:</span>
                    <span className="text-base font-black font-mono text-emerald-900">৳ {calcNet.toLocaleString()}</span>
                  </div>
                );
              })()}

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="BANK">Bank Account Transfer</option>
                  <option value="BKASH">bKash / Nagad / MFS</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional remarks..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStaffToPay(null)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="flex items-center gap-1 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingPay ? 'Processing...' : 'Confirm & Disburse'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Individual Printable Pay Slip (বেতন রসিদ) Modal */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">Official Payslip Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedStaffForSlip(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Document */}
            <div className="border border-slate-300 rounded-2xl p-5 bg-white font-sans text-slate-900 text-xs">
              
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-black tracking-tight text-slate-900">{tenant?.name || 'OmniFlow POS Store'}</h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Showroom: {selectedStaffForSlip.branch_name} • Monthly Salary Slip (বেতন রসিদ)
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-800">
                  Month: {formatMonthName(selectedMonth)}
                </div>
              </div>

              {/* Staff Details */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-400">Employee Name:</span> <strong className="text-slate-900">{selectedStaffForSlip.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Employee Code:</span> <strong className="font-mono text-slate-900">{selectedStaffForSlip.employee_code}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Designation:</span> <strong>{selectedStaffForSlip.designation}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Working Days:</span> <strong>{selectedStaffForSlip.present_days}/{selectedStaffForSlip.total_working_days} Days</strong>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="mt-3 grid grid-cols-2 gap-4">
                
                {/* Earnings */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earnings (উপার্জন)</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Base Salary:</span>
                      <span className="font-mono">৳{selectedStaffForSlip.base_salary.toLocaleString()}</span>
                    </div>
                    {selectedStaffForSlip.sales_commission > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Sales Comm:</span>
                        <span className="font-mono">+৳{selectedStaffForSlip.sales_commission.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.target_bonus > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Target Bonus:</span>
                        <span className="font-mono">+৳{selectedStaffForSlip.target_bonus.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.other_allowance > 0 && (
                      <div className="flex justify-between">
                        <span>Allowance:</span>
                        <span className="font-mono">+৳{selectedStaffForSlip.other_allowance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deductions (কর্তন)</div>
                  <div className="space-y-1 text-[11px]">
                    {selectedStaffForSlip.attendance_deduction > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Late Penalty:</span>
                        <span className="font-mono">-৳{selectedStaffForSlip.attendance_deduction.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.advance_deduction > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Advance Paid:</span>
                        <span className="font-mono">-৳{selectedStaffForSlip.advance_deduction.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStaffForSlip.total_deductions === 0 && (
                      <div className="text-slate-400 text-[10px]">No deductions</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Net Payout Box */}
              <div className="mt-4 rounded-xl bg-slate-900 text-white p-3 flex justify-between items-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-300">Net Payable Amount</div>
                  <div className="text-[10px] text-emerald-300">Method: {selectedStaffForSlip.payment_method}</div>
                </div>
                <div className="text-base font-black font-mono text-emerald-400">
                  ৳ {selectedStaffForSlip.net_payable.toLocaleString()}
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-1">Prepared By</div>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-1">Manager / Accounts</div>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-1">Employee Signature</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
