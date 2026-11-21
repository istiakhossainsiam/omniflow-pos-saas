import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, Clock, CheckCircle2, XCircle, 
  AlertCircle, FileText, Plus, Search, Filter, Printer, 
  ChevronRight, Building2, CreditCard, ShieldCheck, Briefcase, 
  ArrowUpRight, Download, Send, Edit3, X, Check, Eye, Sparkles
} from 'lucide-react';
import { hrmApi, tenantApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SpotlightCard from '../common/SpotlightCard';
import UiverseButton from '../common/UiverseButton';
import StatusBadge from '../common/StatusBadge';
import ShinyText from '../common/ShinyText';

export default function HRMSuiteView() {
  const { user, branches, selectedBranch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, employees, leaves, payroll, advances
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Overview State
  const [overview, setOverview] = useState(null);

  // 2. Employees State
  const [employees, setEmployees] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editProfileForm, setEditProfileForm] = useState({
    designation: '',
    department: 'Sales',
    base_salary: 18000,
    mobile_allowance: 1000,
    medical_allowance: 1500,
    conveyance_allowance: 1500,
    commission_rate: 2.5,
    shift: 'Morning',
    nid_number: '',
    emergency_contact: '',
    bank_name: '',
    bank_account_no: '',
    mfs_number: '',
    joining_date: '2026-01-01'
  });

  // 3. Leaves State
  const [leaves, setLeaves] = useState([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL');
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    user_id: '',
    leave_type: 'CASUAL',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [leaveReviewNotes, setLeaveReviewNotes] = useState('');

  // 4. Payroll Sheet State
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [payrollSheet, setPayrollSheet] = useState(null);
  const [disbursingItem, setDisbursingItem] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    payment_method: 'CASH',
    transaction_reference: '',
    notes: ''
  });
  const [selectedPayslipData, setSelectedPayslipData] = useState(null);

  // 5. Salary Advances State
  const [advances, setAdvances] = useState([]);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    user_id: '',
    amount: 5000,
    month_year: '2026-10',
    reason: ''
  });

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const data = await hrmApi.getOverview(selectedBranchId || undefined);
      setOverview(data);
    } catch (err) {
      console.error('HRM overview error:', err);
    }
  };

  // Load Employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await hrmApi.getEmployees(selectedBranchId || undefined, selectedDepartment || undefined);
      setEmployees(data || []);
    } catch (err) {
      console.error('HRM employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Leaves
  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await hrmApi.getLeaves(leaveStatusFilter !== 'ALL' ? leaveStatusFilter : undefined, selectedBranchId || undefined);
      setLeaves(data || []);
    } catch (err) {
      console.error('HRM leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Payroll Sheet
  const loadPayroll = async () => {
    try {
      setLoading(true);
      const data = await hrmApi.getPayrollSheet(selectedMonth, selectedBranchId || undefined);
      setPayrollSheet(data);
    } catch (err) {
      console.error('HRM payroll error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Advances
  const loadAdvances = async () => {
    try {
      setLoading(true);
      const data = await hrmApi.getAdvances(undefined, selectedMonth);
      setAdvances(data || []);
    } catch (err) {
      console.error('HRM advances error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    loadOverview();
    if (activeSubTab === 'employees') loadEmployees();
    if (activeSubTab === 'leaves') loadLeaves();
    if (activeSubTab === 'payroll') loadPayroll();
    if (activeSubTab === 'advances') loadAdvances();
  }, [activeSubTab, selectedBranchId, selectedMonth, leaveStatusFilter, selectedDepartment]);

  // Open Edit Profile Modal
  const handleOpenEditProfile = (emp) => {
    setEditingEmployee(emp);
    setEditProfileForm({
      designation: emp.designation || '',
      department: emp.department || 'Sales',
      base_salary: emp.base_salary || 18000,
      mobile_allowance: emp.mobile_allowance || 0,
      medical_allowance: emp.medical_allowance || 0,
      conveyance_allowance: emp.conveyance_allowance || 0,
      commission_rate: emp.commission_rate || 2.5,
      shift: emp.shift || 'Morning',
      nid_number: emp.nid_number || '',
      emergency_contact: emp.emergency_contact || '',
      bank_name: emp.bank_name || '',
      bank_account_no: emp.bank_account_no || '',
      mfs_number: emp.mfs_number || '',
      joining_date: emp.joining_date || '2026-01-01'
    });
  };

  // Save Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await hrmApi.updateProfile(editingEmployee.id, editProfileForm);
      setEditingEmployee(null);
      loadEmployees();
      loadOverview();
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  // Submit Leave
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      await hrmApi.applyLeave({
        user_id: leaveForm.user_id || undefined,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason
      });
      setIsApplyLeaveOpen(false);
      setLeaveForm({
        user_id: '',
        leave_type: 'CASUAL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      loadLeaves();
      loadOverview();
    } catch (err) {
      alert('Leave error: ' + err.message);
    }
  };

  // Review Leave (Approve/Reject)
  const handleReviewLeave = async (status) => {
    if (!reviewingLeave) return;
    try {
      await hrmApi.reviewLeave(reviewingLeave.id, {
        status,
        review_notes: leaveReviewNotes
      });
      setReviewingLeave(null);
      setLeaveReviewNotes('');
      loadLeaves();
      loadOverview();
    } catch (err) {
      alert('Review error: ' + err.message);
    }
  };

  // Submit Advance
  const handleSubmitAdvance = async (e) => {
    e.preventDefault();
    try {
      await hrmApi.createAdvance({
        user_id: advanceForm.user_id || undefined,
        amount: parseFloat(advanceForm.amount),
        month_year: advanceForm.month_year,
        reason: advanceForm.reason
      });
      setIsAdvanceModalOpen(false);
      loadAdvances();
      loadOverview();
    } catch (err) {
      alert('Advance error: ' + err.message);
    }
  };

  // Review Advance (Approve/Reject)
  const handleReviewAdvance = async (advanceId, status) => {
    try {
      await hrmApi.reviewAdvance(advanceId, { status });
      loadAdvances();
      loadOverview();
    } catch (err) {
      alert('Review advance error: ' + err.message);
    }
  };

  // Execute Salary Disbursement
  const handleConfirmDisbursement = async (e) => {
    e.preventDefault();
    if (!disbursingItem) return;
    try {
      await hrmApi.disbursePayroll({
        user_id: disbursingItem.user_id,
        month_year: selectedMonth,
        payment_method: disburseForm.payment_method,
        transaction_reference: disburseForm.transaction_reference,
        notes: disburseForm.notes
      });
      setDisbursingItem(null);
      loadPayroll();
      loadOverview();
    } catch (err) {
      alert('Disbursement error: ' + err.message);
    }
  };

  // Bulk Disburse All Staff
  const handleBulkDisburseAll = async () => {
    if (!window.confirm(`Are you sure you want to disburse salary for ALL ${payrollSheet?.payroll_items?.length || 0} staff members for ${selectedMonth}?`)) {
      return;
    }
    try {
      await hrmApi.disbursePayroll({
        user_id: null,
        month_year: selectedMonth,
        branch_id: selectedBranchId || undefined,
        payment_method: 'BANK',
        transaction_reference: 'BULK-SALARY-DISBURSEMENT'
      });
      loadPayroll();
      loadOverview();
      alert('All staff salaries marked as disbursed successfully!');
    } catch (err) {
      alert('Bulk disburse error: ' + err.message);
    }
  };

  // Open Payslip Modal
  const handleViewPayslip = async (userId) => {
    try {
      const data = await hrmApi.getPayslip(userId, selectedMonth);
      setSelectedPayslipData(data);
    } catch (err) {
      alert('Failed to load payslip: ' + err.message);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in pb-28 md:pb-12">
      
      {/* 1. TOP HEADER BAR (Frosted Cyber Glass) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Briefcase className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Enterprise HRM & Staff Payroll
                </h1>
                <StatusBadge status="ACTIVE" label="LIVE" pulse={true} />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Staff management, leave approvals, salary advances, monthly payroll & payslip generation.
              </p>
            </div>
          </div>

          {/* Branch Filter, Month Picker & Action Triggers */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {branches?.length > 0 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="">All Outlets & Showrooms</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-inner">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <UiverseButton
              variant="glow"
              size="sm"
              icon={Calendar}
              onClick={() => setIsApplyLeaveOpen(true)}
            >
              Apply Leave
            </UiverseButton>

            <UiverseButton
              variant="glass"
              size="sm"
              icon={DollarSign}
              onClick={() => setIsAdvanceModalOpen(true)}
            >
              Request Advance
            </UiverseButton>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Briefcase },
          { id: 'employees', label: `Staff (${employees?.length || 0})`, icon: Users },
          { id: 'leaves', label: `Leaves (${leaves?.filter(l => l.status === 'PENDING').length || 0})`, icon: Calendar },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'advances', label: `Advances (${advances?.length || 0})`, icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: HRM OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics Grid with Spotlight Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.14)" className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Staff</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {overview?.total_staff ?? '--'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>Across all branch showrooms</span>
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.14)" className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Present Today</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {overview?.present_today ?? '--'}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1">
                {overview?.late_today ?? 0} marked late today
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.14)" className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>On Approved Leave</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {overview?.on_leave_today ?? '--'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {overview?.pending_leaves_count ?? 0} pending applications
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.16)" className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Monthly Base Payroll</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-2">
                ৳{(overview?.estimated_monthly_gross_budget || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Base salary + allowances
              </div>
            </SpotlightCard>

          </div>

          {/* Quick Actions & Department Composition Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold">
                  <Briefcase className="h-4 w-4" />
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Showroom Attendance & Policy Handshake
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                OmniFlow 2FA attendance verifies staff check-ins via Manager dynamic QR or 6-digit PIN handshake. Late arrivals beyond grace period (15 mins) automatically calculate incentive deductions in the monthly payroll sheet.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <UiverseButton
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveSubTab('payroll')}
                >
                  View Monthly Payroll Sheet →
                </UiverseButton>
                <UiverseButton
                  variant="glass"
                  size="sm"
                  onClick={() => setActiveSubTab('leaves')}
                >
                  Review Leaves ({overview?.pending_leaves_count || 0})
                </UiverseButton>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Staff Salary Allowances & Banking
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Configure basic pay, mobile allowances, medical allowances, and bank/bKash accounts for automated salary disbursement and professional payslip voucher generation.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <UiverseButton
                  variant="glass"
                  size="sm"
                  onClick={() => setActiveSubTab('employees')}
                >
                  Manage Staff Profiles →
                </UiverseButton>
                <UiverseButton
                  variant="subtle"
                  size="sm"
                  onClick={() => setActiveSubTab('advances')}
                >
                  Manage Advances ({overview?.pending_advances_count || 0})
                </UiverseButton>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. TAB 2: EMPLOYEES DIRECTORY & PROFILES */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          
          {/* Search & Department Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or code..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Departments</option>
                <option value="Sales">Floor Sales</option>
                <option value="Cash Counter">Cash Counter</option>
                <option value="Warehouse">Warehouse & Stock</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>

          {/* Employees Table Container */}
          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Branch / Showroom</th>
                    <th className="py-3.5 px-4">Department & Role</th>
                    <th className="py-3.5 px-4">Shift</th>
                    <th className="py-3.5 px-4">Base Salary</th>
                    <th className="py-3.5 px-4">Allowances</th>
                    <th className="py-3.5 px-4">Total Fixed</th>
                    <th className="py-3.5 px-4">Banking / MFS</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees
                    .filter(emp => !searchEmployee || emp.full_name?.toLowerCase().includes(searchEmployee.toLowerCase()) || emp.employee_code?.toLowerCase().includes(searchEmployee.toLowerCase()))
                    .map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 font-black flex items-center justify-center border border-emerald-200 shrink-0">
                              {emp.full_name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{emp.full_name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{emp.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700 font-semibold">{emp.branch_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.branch_code}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{emp.designation}</div>
                          <div className="text-[10px] text-emerald-700 font-medium">{emp.department} ({emp.role})</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {emp.shift}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ৳{emp.base_salary?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          ৳{((emp.mobile_allowance || 0) + (emp.medical_allowance || 0) + (emp.conveyance_allowance || 0)).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-600">
                          ৳{emp.total_fixed_salary?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {emp.bank_name ? (
                            <div className="text-[11px] text-slate-700 font-medium truncate max-w-[140px]">
                              {emp.bank_name}: {emp.bank_account_no}
                            </div>
                          ) : emp.mfs_number ? (
                            <div className="text-[11px] text-emerald-700 font-mono font-semibold">
                              MFS: {emp.mfs_number}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Cash Payout</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditProfile(emp)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 transition-colors press-tactile"
                            title="Edit HRM Profile"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: LEAVE MANAGEMENT */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setLeaveStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all press-tactile ${
                    leaveStatusFilter === st
                      ? 'bg-emerald-600 text-white font-black shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <UiverseButton
              variant="glow"
              size="sm"
              icon={Plus}
              onClick={() => setIsApplyLeaveOpen(true)}
            >
              Apply for Leave
            </UiverseButton>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4">Dates</th>
                    <th className="py-3.5 px-4">Days</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Review Notes</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No leave records found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{l.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{l.employee_code} ({l.branch_name})</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                            {l.leave_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {l.start_date} to {l.end_date}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {l.days_count} day(s)
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {l.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {l.review_notes || '--'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setReviewingLeave(l);
                                setLeaveReviewNotes('Approved by management');
                              }}
                              className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-[11px] border border-emerald-200 transition-all press-tactile"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: MONTHLY PAYROLL & SALARY SHEET */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          
          {/* Top Payroll Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.12)" className="p-4 sm:p-5">
              <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Total Gross Earnings Pool</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                ৳{(payrollSheet?.total_gross_disbursement || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Base salary + allowances + commissions</div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.12)" className="p-4 sm:p-5">
              <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Total Deductions Pool</div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
                -৳{(payrollSheet?.total_deductions_pool || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Late penalties & advance repayments</div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
              <div className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Net Payable Disbursement</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                ৳{(payrollSheet?.total_net_payable_pool || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700/80 font-medium mt-1">Ready for automated salary disbursement</div>
            </SpotlightCard>

          </div>

          {/* Bulk Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-700">Payroll Period: </span>
              <span className="font-mono font-bold text-emerald-700">{selectedMonth}</span>
              <span className="text-slate-500 text-xs ml-2">({payrollSheet?.payroll_items?.length || 0} staff members)</span>
            </div>

            <UiverseButton
              variant="glow"
              size="sm"
              icon={CreditCard}
              onClick={handleBulkDisburseAll}
            >
              ⚡ Disburse All Branch Staff
            </UiverseButton>
          </div>

          {/* Detailed Payroll Table */}
          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Base Pay</th>
                    <th className="py-3.5 px-4">Allowances</th>
                    <th className="py-3.5 px-4">POS Commission</th>
                    <th className="py-3.5 px-4">Late Penalty</th>
                    <th className="py-3.5 px-4">Advance Deduct</th>
                    <th className="py-3.5 px-4">Net Salary</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollSheet?.payroll_items?.map(item => (
                    <tr key={item.user_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.employee_code} ({item.branch_name})</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ৳{item.base_salary?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ৳{item.total_allowances?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                        +৳{item.earned_commission?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        {item.attendance_deduction > 0 ? `-৳${item.attendance_deduction} (${item.late_days} Late)` : '৳0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        {item.advance_deduction > 0 ? `-৳${item.advance_deduction.toLocaleString()}` : '৳0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                        ৳{item.net_payable?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {item.payment_status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setDisbursingItem(item);
                              setDisburseForm({
                                payment_method: item.bank_name ? 'BANK' : 'CASH',
                                transaction_reference: '',
                                notes: `Monthly salary for ${selectedMonth}`
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] shadow-sm transition-all press-tactile"
                          >
                            Disburse
                          </button>
                        )}
                        <button
                          onClick={() => handleViewPayslip(item.user_id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-200/80 transition-all press-tactile inline-flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Payslip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 7. TAB 5: SALARY ADVANCES */}
      {activeSubTab === 'advances' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-700">Staff Advances & Loans for: </span>
              <span className="font-mono font-bold text-emerald-700">{selectedMonth}</span>
            </div>

            <UiverseButton
              variant="glow"
              size="sm"
              icon={Plus}
              onClick={() => setIsAdvanceModalOpen(true)}
            >
              Record Salary Advance
            </UiverseButton>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Advance Amount</th>
                    <th className="py-3.5 px-4">Deduction Month</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Approved By</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No salary advances requested for {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    advances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{a.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{a.employee_code}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                          ৳{a.amount?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {a.month_year}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {a.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            a.status === 'DEDUCTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            a.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {a.approved_by_name || '--'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {a.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewAdvance(a.id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-[10px] border border-emerald-200 transition-all press-tactile"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewAdvance(a.id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[10px] border border-rose-200 transition-all press-tactile"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: EDIT EMPLOYEE HRM PROFILE */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setEditingEmployee(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Edit3 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Staff HRM Profile</h3>
                <p className="text-xs text-slate-500">{editingEmployee.full_name} ({editingEmployee.employee_code})</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editProfileForm.designation}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={editProfileForm.department}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Sales">Floor Sales</option>
                    <option value="Cash Counter">Cash Counter</option>
                    <option value="Warehouse">Warehouse & Logistics</option>
                    <option value="Management">Management</option>
                    <option value="Accounts">Accounts & Finance</option>
                  </select>
                </div>
              </div>

              {/* Salary & Allowances Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Salary & Allowances (BDT)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Basic Salary *</label>
                    <input
                      type="number"
                      required
                      value={editProfileForm.base_salary}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, base_salary: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Mobile</label>
                    <input
                      type="number"
                      value={editProfileForm.mobile_allowance}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, mobile_allowance: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Medical</label>
                    <input
                      type="number"
                      value={editProfileForm.medical_allowance}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, medical_allowance: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Conveyance</label>
                    <input
                      type="number"
                      value={editProfileForm.conveyance_allowance}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, conveyance_allowance: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-semibold">Total Fixed Monthly Pay:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ৳{(
                      parseFloat(editProfileForm.base_salary || 0) +
                      parseFloat(editProfileForm.mobile_allowance || 0) +
                      parseFloat(editProfileForm.medical_allowance || 0) +
                      parseFloat(editProfileForm.conveyance_allowance || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Banking & MFS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank / BRAC"
                    value={editProfileForm.bank_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, bank_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Account No</label>
                  <input
                    type="text"
                    value={editProfileForm.bank_account_no}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, bank_account_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">bKash / Nagad</label>
                  <input
                    type="text"
                    value={editProfileForm.mfs_number}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, mfs_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Shift & NID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shift</label>
                  <select
                    value={editProfileForm.shift}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, shift: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                  >
                    <option value="Morning">Morning (09:30 AM - 07:30 PM)</option>
                    <option value="Evening">Evening (01:00 PM - 10:00 PM)</option>
                    <option value="General">General (10:00 AM - 08:00 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">National ID (NID)</label>
                  <input
                    type="text"
                    value={editProfileForm.nid_number}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, nid_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <UiverseButton
                  type="submit"
                  variant="glow"
                  fullWidth={true}
                  size="md"
                >
                  Save Employee HRM Profile
                </UiverseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: APPLY LEAVE */}
      {isApplyLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6">
            
            <button
              onClick={() => setIsApplyLeaveOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Calendar className="h-5 w-5" />
              </span>
              <h3 className="font-black text-base text-slate-900">Apply for Staff Leave</h3>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                <select
                  value={leaveForm.user_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, user_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  <option value="">Apply for Current User ({user?.full_name})</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Leave Type</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="ANNUAL">Annual Earned Leave (AL)</option>
                  <option value="UNPAID">Unpaid Leave (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain reason for leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <UiverseButton
                  type="submit"
                  variant="glow"
                  fullWidth={true}
                  size="md"
                >
                  Submit Leave Application
                </UiverseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: REVIEW LEAVE */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6">
            <button
              onClick={() => setReviewingLeave(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-black text-base text-slate-900 mb-2">Review Leave Application</h3>
            <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 mb-4">
              <div><strong className="text-slate-900">Applicant:</strong> {reviewingLeave.employee_name}</div>
              <div><strong className="text-slate-900">Duration:</strong> {reviewingLeave.start_date} to {reviewingLeave.end_date} ({reviewingLeave.days_count} days)</div>
              <div><strong className="text-slate-900">Reason:</strong> {reviewingLeave.reason}</div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">Manager Review Remarks</label>
              <input
                type="text"
                placeholder="Approval or rejection reason..."
                value={leaveReviewNotes}
                onChange={(e) => setLeaveReviewNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReviewLeave('APPROVED')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all press-tactile"
              >
                Approve Leave
              </button>
              <button
                onClick={() => handleReviewLeave('REJECTED')}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all press-tactile"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: RECORD SALARY ADVANCE */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6">
            <button
              onClick={() => setIsAdvanceModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="h-5 w-5" />
              </span>
              <h3 className="font-black text-base text-slate-900">Record Salary Advance</h3>
            </div>

            <form onSubmit={handleSubmitAdvance} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                <select
                  required
                  value={advanceForm.user_id}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, user_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  <option value="">Select Staff Member</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Advance Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Repayment Month *</label>
                  <input
                    type="month"
                    required
                    value={advanceForm.month_year}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, month_year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Advance</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Medical emergency or advance against festival"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <UiverseButton
                  type="submit"
                  variant="glow"
                  fullWidth={true}
                  size="md"
                >
                  Submit Salary Advance
                </UiverseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. MODAL: DISBURSE SALARY */}
      {disbursingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6">
            <button
              onClick={() => setDisbursingItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CreditCard className="h-5 w-5" />
              </span>
              <h3 className="font-black text-base text-slate-900">Disburse Salary</h3>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs mb-4">
              <div><strong className="text-slate-900">Staff:</strong> {disbursingItem.full_name} ({disbursingItem.employee_code})</div>
              <div><strong className="text-slate-900">Period:</strong> {selectedMonth}</div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Net Payable:</span>
                <span className="text-base font-black text-emerald-700 font-mono">৳{disbursingItem.net_payable?.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Disbursement Channel</label>
                <select
                  value={disburseForm.payment_method}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payment_method: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK">Bank Transfer (EFT/NPSB)</option>
                  <option value="BKASH">bKash Salary Disbursement</option>
                  <option value="NAGAD">Nagad Salary Disbursement</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  placeholder="e.g. TrxID 9K20XYZ or Bank Voucher 4401"
                  value={disburseForm.transaction_reference}
                  onChange={(e) => setDisburseForm({ ...disburseForm, transaction_reference: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <UiverseButton
                  type="submit"
                  variant="glow"
                  fullWidth={true}
                  size="md"
                >
                  Confirm Salary Disbursement (৳{disbursingItem.net_payable?.toLocaleString()})
                </UiverseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. PRINTABLE PAYSLIP MODAL */}
      {selectedPayslipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in zoom-in-95">
          <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none border border-slate-200">
            
            <button
              onClick={() => setSelectedPayslipData(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 print:hidden transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Payslip Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {selectedPayslipData.brand_name}
                </h2>
                <p className="text-xs text-slate-600 font-medium">{selectedPayslipData.brand_tagline}</p>
                <p className="text-xs text-slate-500">{selectedPayslipData.brand_address}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider">
                  Salary Pay Slip
                </span>
                <div className="font-mono text-xs text-slate-600 mt-1 font-bold">{selectedPayslipData.voucher_no}</div>
                <div className="text-[10px] text-slate-400">Month: {selectedPayslipData.month_year}</div>
              </div>
            </div>

            {/* Employee Information Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs mb-6">
              <div>
                <div><span className="text-slate-500">Employee Name:</span> <strong className="text-slate-900">{selectedPayslipData.employee.name}</strong></div>
                <div><span className="text-slate-500">Employee ID:</span> <strong className="font-mono">{selectedPayslipData.employee.code}</strong></div>
                <div><span className="text-slate-500">Designation:</span> {selectedPayslipData.employee.designation}</div>
              </div>
              <div>
                <div><span className="text-slate-500">Showroom / Branch:</span> <strong>{selectedPayslipData.employee.branch_name}</strong></div>
                <div><span className="text-slate-500">Department:</span> {selectedPayslipData.employee.department}</div>
                <div><span className="text-slate-500">Payment Via:</span> {selectedPayslipData.employee.bank_name} ({selectedPayslipData.payment_status})</div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Earnings */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-black text-xs uppercase tracking-wider text-slate-700">
                  Earnings Breakdown
                </div>
                <div className="p-3.5 divide-y divide-slate-100 text-xs">
                  {selectedPayslipData.earnings.map(e => (
                    <div key={e.label} className="py-1.5 flex justify-between">
                      <span className="text-slate-600">{e.label}</span>
                      <span className="font-mono font-bold text-slate-900">৳{e.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-black text-emerald-700 pt-3 border-t">
                    <span>Gross Earnings:</span>
                    <span className="font-mono">৳{selectedPayslipData.gross_earnings?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-black text-xs uppercase tracking-wider text-slate-700">
                  Deductions Breakdown
                </div>
                <div className="p-3.5 divide-y divide-slate-100 text-xs">
                  {selectedPayslipData.deductions.map(d => (
                    <div key={d.label} className="py-1.5 flex justify-between">
                      <span className="text-slate-600">{d.label}</span>
                      <span className="font-mono font-bold text-rose-600">৳{d.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-black text-rose-700 pt-3 border-t">
                    <span>Total Deductions:</span>
                    <span className="font-mono">-৳{selectedPayslipData.total_deductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Salary Banner */}
            <div className="bg-slate-900 text-white p-4.5 rounded-2xl flex justify-between items-center mb-8 shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400">Net Payable Remuneration</div>
                <div className="text-xs text-slate-300">Payment Mode: {selectedPayslipData.payment_method} ({selectedPayslipData.payment_status})</div>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ৳{selectedPayslipData.net_salary?.toLocaleString()}
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="border-t border-slate-400 w-40 mx-auto mb-1" />
                <span>Employee Signature</span>
              </div>
              <div>
                <div className="border-t border-slate-400 w-40 mx-auto mb-1" />
                <span>Authorized Showroom Manager</span>
              </div>
            </div>

            {/* Print Button */}
            <div className="mt-8 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 flex items-center gap-2 shadow-lg press-tactile transition-all"
              >
                <Printer className="h-4 w-4 text-emerald-400" />
                <span>Print Salary Voucher</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
