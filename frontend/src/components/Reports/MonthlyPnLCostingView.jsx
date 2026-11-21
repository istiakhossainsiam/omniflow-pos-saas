import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  PlusCircle, 
  Calendar, 
  Building2, 
  PieChart, 
  Trash2, 
  Search, 
  Printer, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Wallet, 
  Tag, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Percent, 
  FileText,
  X
} from 'lucide-react';
import OneClickSalarySheetModal from './OneClickSalarySheetModal';

const EXPENSE_CATEGORIES = [
  { id: 'RENT', label: 'Showroom Rent', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'UTILITIES', label: 'Electricity & Utilities', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'MARKETING', label: 'Marketing & Digital Ads', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'PACKAGING', label: 'Packaging & Bags', icon: Tag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'LOGISTICS', label: 'Transport & Courier', icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'MAINTENANCE', label: 'Repairs & Maintenance', icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'ENTERTAINMENT', label: 'Office Refreshments/Tea', icon: Users, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'MISC', label: 'Miscellaneous / Other', icon: Receipt, color: 'text-slate-600 bg-slate-50 border-slate-200' }
];

export default function MonthlyPnLCostingView() {
  const { tenant, branches, selectedBranch } = useAuth();
  
  // Current month-year state (Format: YYYY-MM)
  const now = new Date();
  const defaultMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthYear);
  const [branchFilter, setBranchFilter] = useState(selectedBranch?.id || '');
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'expenses' | 'payroll'
  const [showSalarySheetModal, setShowSalarySheetModal] = useState(false);
  
  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'RENT',
    amount: '',
    branch_id: selectedBranch?.id || '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    receipt_voucher_no: '',
    paid_to: '',
    notes: ''
  });

  // Expense List Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchPnL();
  }, [selectedMonth, branchFilter]);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getMonthlyPnL(selectedMonth, branchFilter || undefined);
      setPnlData(res);
    } catch (err) {
      console.error("Failed to fetch monthly P&L:", err);
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

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      alert("Please enter title and valid amount");
      return;
    }

    try {
      setSubmittingExpense(true);
      await reportApi.createExpense({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        branch_id: expenseForm.branch_id ? parseInt(expenseForm.branch_id) : null
      });

      setShowExpenseModal(false);
      setExpenseForm({
        title: '',
        category: 'RENT',
        amount: '',
        branch_id: selectedBranch?.id || '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        receipt_voucher_no: '',
        paid_to: '',
        notes: ''
      });

      fetchPnL();
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert("Failed to save expense voucher: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense voucher?")) return;
    try {
      await reportApi.deleteExpense(id);
      fetchPnL();
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense: " + (err.response?.data?.detail || err.message));
    }
  };

  const formatMonthName = (my) => {
    if (!my) return '';
    const [year, month] = my.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filtered expenses list
  const expensesList = pnlData?.expenses_list || [];
  const filteredExpenses = expensesList.filter(item => {
    const matchCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
    const matchSearch = expenseSearch === '' || 
      item.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (item.paid_to && item.paid_to.toLowerCase().includes(expenseSearch.toLowerCase())) ||
      (item.receipt_voucher_no && item.receipt_voucher_no.toLowerCase().includes(expenseSearch.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const isProfitable = (pnlData?.net_operating_profit || 0) >= 0;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Monthly Costing & Net Profit Hub
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                P&L Statement, Product COGS, Staff Salaries, Incentive Overhead & Operating Expenses (OPEX)
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm text-xs">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Showrooms (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm text-xs font-bold text-slate-700">
            <button 
              onClick={() => handleMonthChange(-1)} 
              className="px-2.5 py-1 rounded-xl hover:bg-slate-100 text-slate-600 transition-all font-black"
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
              className="px-2.5 py-1 rounded-xl hover:bg-slate-100 text-slate-600 transition-all font-black"
              title="Next Month"
            >
              →
            </button>
          </div>

          {/* 1-Click Salary Sheet Button */}
          <button
            onClick={() => setShowSalarySheetModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all"
          >
            <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
            <span>1-Click Salary Sheet</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Expense Voucher</span>
          </button>

          {/* Print/Refresh */}
          <button
            onClick={() => window.print()}
            className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
            title="Print P&L Statement"
          >
            <Printer className="h-4 w-4" />
          </button>

          <button
            onClick={fetchPnL}
            className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 animate-spin mb-3">
            <RefreshCw className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-slate-500">Calculating monthly profit, COGS and cost overheads for {formatMonthName(selectedMonth)}...</p>
        </div>
      ) : (
        <>
          {/* Executive P&L Scorecard Cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Net Sales Revenue */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Sales Revenue</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  ৳ {(pnlData?.net_sales_revenue || 0).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span>Gross: ৳{(pnlData?.gross_sales || 0).toLocaleString()}</span>
                  <span>•</span>
                  <span>{pnlData?.completed_orders_count || 0} Orders</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-rose-500 font-medium">
                Returns & Discounts Deducted: -৳{((pnlData?.total_discounts || 0) + (pnlData?.returns_amount || 0)).toLocaleString()}
              </div>
            </div>

            {/* Card 2: Cost of Goods Sold (COGS) */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product COGS Cost</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Tag className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  ৳ {(pnlData?.total_cogs || 0).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Gross Margin:</span>
                  <span className="font-black text-emerald-600">{pnlData?.gross_profit_margin_pct || 0}%</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Gross Profit: <span className="font-bold text-slate-800">৳{(pnlData?.gross_profit || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Card 3: Total Monthly OPEX & Payroll */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total OPEX & Payroll</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  ৳ {(pnlData?.total_operating_expenses || 0).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Staff Payroll:</span>
                  <span className="font-bold text-slate-700">৳{(pnlData?.total_payroll_cost || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Expenses Vouchers: <span className="font-bold text-slate-800">৳{(pnlData?.total_direct_expenses || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Card 4: Net Operating Profit (EBITDA) */}
            <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${
              isProfitable 
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white' 
                : 'border-rose-200 bg-gradient-to-br from-rose-500/10 via-rose-50/50 to-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  {isProfitable ? 'Net Operating Profit' : 'Net Operating Deficit / Loss'}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-2xl border ${
                  isProfitable 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                    : 'bg-rose-100 text-rose-700 border-rose-300'
                }`}>
                  {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  ৳ {(pnlData?.net_operating_profit || 0).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Net Margin:</span>
                  <span className={isProfitable ? 'text-emerald-700' : 'text-rose-600'}>
                    {pnlData?.net_profit_margin_pct || 0}%
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Break-Even Target: <span className="font-bold text-slate-700">৳{(pnlData?.break_even_sales_revenue || 0).toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-6 flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                activeSubTab === 'overview'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Full P&L Costing Statement</span>
            </button>

            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                activeSubTab === 'expenses'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Expense Vouchers Ledger ({expensesList.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('payroll')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                activeSubTab === 'payroll'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Staff Salaries & Sales Incentives</span>
            </button>
          </div>

          {/* Tab 1: Full P&L Statement Overview */}
          {activeSubTab === 'overview' && (
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Detailed P&L Financial Table */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-black text-slate-900">
                      Statement of Profit & Loss — {formatMonthName(selectedMonth)}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tenant?.name || 'Store'} Accounting
                  </span>
                </div>

                <div className="mt-4 divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  
                  {/* Revenue Section */}
                  <div className="py-2.5 bg-slate-50/50 px-3 rounded-xl font-bold text-slate-900 flex justify-between items-center">
                    <span>1. REVENUE & NET TURNOVER</span>
                    <span className="font-mono text-emerald-700 font-black">৳ {(pnlData?.net_sales_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="py-2 px-4 flex justify-between text-slate-600">
                    <span className="pl-3">Gross Retail Sales ({pnlData?.completed_orders_count || 0} completed orders)</span>
                    <span className="font-mono">৳ {(pnlData?.gross_sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="py-2 px-4 flex justify-between text-slate-500">
                    <span className="pl-3">Less: Customer Discounts & Vouchers</span>
                    <span className="font-mono text-rose-500">-৳ {(pnlData?.total_discounts || 0).toLocaleString()}</span>
                  </div>
                  <div className="py-2 px-4 flex justify-between text-slate-500">
                    <span className="pl-3">Less: Returns & Item Refunds ({pnlData?.returns_count || 0} items)</span>
                    <span className="font-mono text-rose-500">-৳ {(pnlData?.returns_amount || 0).toLocaleString()}</span>
                  </div>

                  {/* COGS Section */}
                  <div className="py-2.5 bg-slate-50/50 px-3 rounded-xl font-bold text-slate-900 flex justify-between items-center mt-3">
                    <span>2. DIRECT COST OF GOODS SOLD (COGS)</span>
                    <span className="font-mono text-amber-700 font-black">-৳ {(pnlData?.total_cogs || 0).toLocaleString()}</span>
                  </div>
                  <div className="py-2 px-4 flex justify-between text-slate-600">
                    <span className="pl-3">Direct Product Cost Price (Fabric, Stitching & Accessories)</span>
                    <span className="font-mono">৳ {(pnlData?.total_cogs || 0).toLocaleString()}</span>
                  </div>
                  <div className="py-2 px-4 flex justify-between bg-emerald-50/40 rounded-xl font-bold text-emerald-900">
                    <span className="pl-3">GROSS PROFIT (Gross Margin: {pnlData?.gross_profit_margin_pct}%)</span>
                    <span className="font-mono font-black text-emerald-700">৳ {(pnlData?.gross_profit || 0).toLocaleString()}</span>
                  </div>

                  {/* Operating Expenses (OPEX) */}
                  <div className="py-2.5 bg-slate-50/50 px-3 rounded-xl font-bold text-slate-900 flex justify-between items-center mt-3">
                    <span>3. OPERATING EXPENSES (OPEX) & OVERHEADS</span>
                    <span className="font-mono text-purple-700 font-black">-৳ {(pnlData?.total_operating_expenses || 0).toLocaleString()}</span>
                  </div>

                  {/* Expense Categories Breakdown */}
                  {EXPENSE_CATEGORIES.map(cat => {
                    const catTotal = pnlData?.category_breakdown?.[cat.id] || 0;
                    if (catTotal === 0) return null;
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.id} className="py-2 px-4 flex justify-between text-slate-600 items-center">
                        <div className="flex items-center gap-2 pl-3">
                          <CatIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cat.label}</span>
                        </div>
                        <span className="font-mono">৳ {catTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}

                  {/* Payroll Summary in P&L */}
                  <div className="py-2 px-4 flex justify-between text-slate-600">
                    <div className="flex items-center gap-2 pl-3">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Total Staff Payroll & Incentives</span>
                    </div>
                    <span className="font-mono">৳ {(pnlData?.total_payroll_cost || 0).toLocaleString()}</span>
                  </div>

                  {/* Total Costing */}
                  <div className="py-2 px-4 flex justify-between bg-slate-100/70 rounded-xl font-bold text-slate-800">
                    <span className="pl-3">TOTAL BUSINESS COSTING (COGS + OPEX)</span>
                    <span className="font-mono font-black text-slate-900">৳ {(pnlData?.total_business_costing || 0).toLocaleString()}</span>
                  </div>

                  {/* Net Operating Profit Bottom Line */}
                  <div className={`py-3 px-4 flex justify-between rounded-2xl font-black text-sm mt-3 ${
                    isProfitable 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  }`}>
                    <span>NET OPERATING PROFIT / (LOSS) — EBITDA</span>
                    <span className="font-mono text-base">৳ {(pnlData?.net_operating_profit || 0).toLocaleString()}</span>
                  </div>

                </div>
              </div>

              {/* Right 1 Col: Cost Structure & Visual Breakdown */}
              <div className="space-y-5">
                
                {/* Cost Distribution Progress Bars */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <PieChart className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Cost Overhead Allocation</span>
                  </h3>

                  <div className="space-y-3 mt-4">
                    {/* COGS Share */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Direct Product COGS</span>
                        <span>৳{(pnlData?.total_cogs || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ 
                            width: `${pnlData?.net_sales_revenue ? Math.min(100, Math.round((pnlData.total_cogs / pnlData.net_sales_revenue) * 100)) : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Payroll Share */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Staff Salaries & Bonuses</span>
                        <span>৳{(pnlData?.total_payroll_cost || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ 
                            width: `${pnlData?.net_sales_revenue ? Math.min(100, Math.round((pnlData.total_payroll_cost / pnlData.net_sales_revenue) * 100)) : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Showroom Overhead & Utilities */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Direct Store Expenses</span>
                        <span>৳{(pnlData?.total_direct_expenses || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${pnlData?.net_sales_revenue ? Math.min(100, Math.round((pnlData.total_direct_expenses / pnlData.net_sales_revenue) * 100)) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Insights Card */}
                  <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Executive Business Insights</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                      <li>• For every ৳100 sold, <strong>৳{pnlData?.gross_profit_margin_pct || 0}</strong> remains after fabric/manufacturing cost.</li>
                      <li>• Total operational break-even monthly sales required is <strong>৳{(pnlData?.break_even_sales_revenue || 0).toLocaleString()}</strong>.</li>
                      <li>• Net profit margin is currently <strong>{pnlData?.net_profit_margin_pct || 0}%</strong> of turnover.</li>
                    </ul>
                  </div>
                </div>

                {/* Quick Add Expense Action */}
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900">Record Rent, Electricity or Ad Cost</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Keep your business costing accurate by recording every showroom expense voucher promptly.
                  </p>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="mt-3.5 w-full flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Expense Voucher</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Tab 2: Expense Vouchers Ledger */}
          {activeSubTab === 'expenses' && (
            <div className="mt-5 space-y-4">
              
              {/* Category Pills & Search Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Search by title, paid to, voucher #..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="ALL">All Expense Categories</option>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>New Voucher</span>
                  </button>
                </div>
              </div>

              {/* Expense Table */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Date & Voucher #</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Title / Expense Details</th>
                        <th className="py-3 px-4">Paid To</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Amount (BDT)</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-400">
                            No expense vouchers recorded for {formatMonthName(selectedMonth)}.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp) => {
                          const catObj = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[7];
                          const CatIcon = catObj.icon;

                          return (
                            <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{exp.expense_date}</div>
                                {exp.receipt_voucher_no && (
                                  <div className="text-[10px] text-slate-400 font-mono">#{exp.receipt_voucher_no}</div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${catObj.color}`}>
                                  <CatIcon className="h-3 w-3" />
                                  <span>{catObj.label}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{exp.title}</div>
                                {exp.notes && (
                                  <div className="text-[11px] text-slate-500 line-clamp-1">{exp.notes}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {exp.paid_to || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {exp.payment_method}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                                ৳ {exp.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                  title="Delete Voucher"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Staff Salaries & Sales Incentives */}
          {activeSubTab === 'payroll' && (
            <div className="mt-5 space-y-4">
              
              {/* Payroll Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Active Sales Staff</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{pnlData?.salesmen_count || 0}</div>
                  <div className="text-[10px] text-slate-500">Salespersons in Showroom</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Base Monthly Salaries</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    ৳ {(pnlData?.total_base_salaries || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Fixed Monthly Payroll</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Sales Commissions</div>
                  <div className="mt-1 text-2xl font-black text-purple-700">
                    ৳ {(pnlData?.total_sales_commissions || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Incentive Commission Earned</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Target Bonuses</div>
                  <div className="mt-1 text-2xl font-black text-emerald-600">
                    ৳ {(pnlData?.total_target_bonuses || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Monthly Target Milestone Bonus</div>
                </div>
              </div>

              {/* Staff Breakdown Table */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900">Individual Staff Payroll & Incentive Overhead</h3>
                  </div>
                  <button
                    onClick={() => setShowSalarySheetModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <span>Open 1-Click Salary Sheet & Payslips</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Salesperson</th>
                        <th className="py-3 px-4">Role & Status</th>
                        <th className="py-3 px-4 text-right">Base Salary</th>
                        <th className="py-3 px-4 text-right">Commissions</th>
                        <th className="py-3 px-4 text-right">Target Bonus</th>
                        <th className="py-3 px-4 text-right">Total Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(pnlData?.staff_payroll_breakdown || []).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No staff payroll configured.
                          </td>
                        </tr>
                      ) : (
                        (pnlData?.staff_payroll_breakdown || []).map((staff) => (
                          <tr key={staff.employee_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{staff.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{staff.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                {staff.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              ৳ {staff.base_salary.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-purple-700 font-bold">
                              ৳ {staff.commission_earned.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                              ৳ {staff.target_bonus.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                              ৳ {staff.total_payout.toLocaleString()}
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

        </>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record Expense Voucher</h3>
                  <p className="text-xs text-slate-500">Add operational overhead for accurate profit calculation</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="mt-4 space-y-3.5">
              
              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    const isSelected = expenseForm.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setExpenseForm(prev => ({ ...prev, category: cat.id }))}
                        className={`flex items-center gap-2 p-2 rounded-2xl border text-xs font-bold text-left transition-all ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 shadow-sm' 
                            : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <CatIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title / Description *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. October Showroom Rent"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 25000"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="BKASH">bKash / MFS</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Paid To & Voucher No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid To / Recipient</label>
                  <input
                    type="text"
                    value={expenseForm.paid_to}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, paid_to: e.target.value }))}
                    placeholder="e.g. Landlord / DESCO / Vendor"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Voucher #</label>
                  <input
                    type="text"
                    value={expenseForm.receipt_voucher_no}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, receipt_voucher_no: e.target.value }))}
                    placeholder="e.g. EXP-2026-001"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Branch / Showroom</label>
                <select
                  value={expenseForm.branch_id}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, branch_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="">All / Head Office</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows="2"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes or reference..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingExpense ? 'Saving...' : 'Save Expense Voucher'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 1-Click Salary Sheet Modal */}
      {showSalarySheetModal && (
        <OneClickSalarySheetModal 
          onClose={() => {
            setShowSalarySheetModal(false);
            fetchPnL();
          }}
          initialMonth={selectedMonth}
        />
      )}

    </div>
  );
}
