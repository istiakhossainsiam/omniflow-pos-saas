import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  CheckCircle2, 
  UserCheck, 
  Search, 
  UserPlus, 
  Coins, 
  Wallet,
  Sparkles,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle
} from 'lucide-react';
import { employeeApi, posApi } from '../../services/api';

export default function SplitPaymentModal({ 
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemPrice,
  onUpdateItemDiscount,
  discountAmount = 0,
  taxAmount = 0,
  subtotal = 0,
  totalAmount = 0,
  selectedBranch,
  onCompleteSale, 
  onClose 
}) {
  const [employees, setEmployees] = useState([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
  const [showCartDetails, setShowCartDetails] = useState(true);

  // Customer & Loyalty State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Loyalty & Store credit redemption
  const [redeemedCredit, setRedeemedCredit] = useState(0);

  // Payment lines
  const [payments, setPayments] = useState([
    { payment_method: 'CASH', amount: totalAmount, transaction_ref: '' }
  ]);

  // Sync payments when totalAmount changes due to cart edit
  useEffect(() => {
    setPayments(prev => {
      if (prev.length === 1 && prev[0].payment_method === 'CASH') {
        return [{ payment_method: 'CASH', amount: totalAmount, transaction_ref: prev[0].transaction_ref }];
      }
      return prev;
    });
  }, [totalAmount]);

  useEffect(() => {
    async function loadStaff() {
      try {
        const staffList = await employeeApi.list(selectedBranch?.id);
        setEmployees(staffList);
        const defaultSales = staffList.find(e => e.role === 'SALESMAN') || staffList[0];
        if (defaultSales) setSelectedSalesmanId(defaultSales.id);
      } catch (err) {
        console.error("Failed to load staff list:", err);
      }
    }
    loadStaff();
  }, [selectedBranch]);

  // Customer Live Search
  useEffect(() => {
    if (!customerSearchQuery.trim() || selectedCustomer) {
      setCustomerSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCustomer(true);
        const res = await posApi.searchCustomers(customerSearchQuery.trim());
        setCustomerSuggestions(res || []);
      } catch (err) {
        console.warn("Customer search failed:", err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchQuery, selectedCustomer]);

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerSearchQuery(cust.phone);
    setCustomerSuggestions([]);
    setShowNewCustomerForm(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerData.phone.trim()) {
      alert("Please enter customer phone number.");
      return;
    }

    try {
      const created = await posApi.createCustomer(newCustomerData);
      handleSelectCustomer(created);
    } catch (err) {
      alert(err.message || "Failed to create customer profile");
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const payableWithCredit = Math.max(0, totalAmount - redeemedCredit);
  const changeDue = Math.max(0, totalPaid - payableWithCredit);
  const dueRemaining = Math.max(0, payableWithCredit - totalPaid);

  const handleUpdatePayment = (index, field, value) => {
    const next = [...payments];
    next[index][field] = value;
    setPayments(next);
  };

  const handleAddSplitMethod = (method) => {
    if (payments.some(p => p.payment_method === method)) return;
    setPayments([...payments, { payment_method: method, amount: dueRemaining, transaction_ref: '' }]);
  };

  const handleRemovePayment = (index) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleQuickCash = (amount) => {
    const cashIdx = payments.findIndex(p => p.payment_method === 'CASH');
    if (cashIdx >= 0) {
      handleUpdatePayment(cashIdx, 'amount', amount);
    } else {
      setPayments([...payments, { payment_method: 'CASH', amount, transaction_ref: '' }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Cart is empty. Please add products first.");
      return;
    }
    if (totalPaid < payableWithCredit) {
      alert(`Payment is incomplete! Remaining balance: ${dueRemaining.toLocaleString()} ৳`);
      return;
    }

    onCompleteSale({
      payments: payments.map(p => ({
        payment_method: p.payment_method,
        amount: parseFloat(p.amount) || 0,
        transaction_ref: p.transaction_ref || null
      })),
      salesman_id: selectedSalesmanId || null,
      customer_phone: selectedCustomer?.phone || customerSearchQuery.trim() || null,
      customer_name: selectedCustomer?.name || null
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 bg-white shrink-0">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Fast Checkout & Settlement</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Payment & Customer Settlement</h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 space-y-3.5">

          {/* 1. Payable Summary Bar */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-2.5 sm:p-3 text-center shadow-sm">
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Payable Total</div>
              <div className="text-sm sm:text-lg font-black text-slate-900">{totalAmount.toLocaleString()} ৳</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Total Tendered</div>
              <div className="text-sm sm:text-lg font-black text-emerald-700">{totalPaid.toLocaleString()} ৳</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">
                {totalPaid >= payableWithCredit ? 'Change Return' : 'Due Balance'}
              </div>
              <div className={`text-sm sm:text-lg font-black ${totalPaid >= payableWithCredit ? 'text-amber-600' : 'text-rose-600'}`}>
                {totalPaid >= payableWithCredit ? `${changeDue.toLocaleString()} ৳` : `${dueRemaining.toLocaleString()} ৳`}
              </div>
            </div>
          </div>

          {/* 2. Cart Items Review & Inline Edit / Remove Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div 
              onClick={() => setShowCartDetails(!showCartDetails)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Cart Items ({cartItems.length} styles • {cartItems.reduce((s, i) => s + i.quantity, 0)} pcs)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800">
                <span>{showCartDetails ? 'Hide' : 'Edit Items'}</span>
                {showCartDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>

            {showCartDetails && (
              <div className="mt-2.5 space-y-2 border-t border-slate-200/60 pt-2">
                {cartItems.length === 0 ? (
                  <div className="text-center py-4 text-xs text-rose-600 font-bold">
                    Cart is empty. Please add items to complete checkout.
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div 
                      key={item.variant_id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-sm"
                    >
                      {/* Product details */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.product_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span className="bg-slate-100 px-1 rounded font-bold text-slate-700">{item.size || 'STD'}</span>
                          {item.color && <span>• {item.color}</span>}
                          <span>• {item.unit_price} ৳</span>
                        </div>
                      </div>

                      {/* Quantity Edit Controls */}
                      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.variant_id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-100 shadow-sm active:scale-90"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        
                        <span className="w-6 text-center text-xs font-black text-slate-900 font-mono">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.variant_id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-100 shadow-sm active:scale-90"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right shrink-0 w-16">
                        <div className="text-xs font-black text-slate-900">
                          {((item.unit_price * item.quantity) - (item.discount || 0)).toLocaleString()} ৳
                        </div>
                      </div>

                      {/* 1-Click Delete / Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem && onRemoveItem(item.variant_id)}
                        title="Remove item from checkout"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. Customer Loyalty & Profile */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Customer Loyalty & Profile:</span>
              </label>
              {!selectedCustomer && !showNewCustomerForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomerForm(true);
                    setNewCustomerData({ name: '', phone: customerSearchQuery, email: '', address: '' });
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>+ Register New Customer</span>
                </button>
              )}
            </div>

            {!selectedCustomer && !showNewCustomerForm ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type customer mobile number or email (e.g. 017...)"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none shadow-sm"
                />

                {/* Suggestions Dropdown */}
                {customerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 p-1 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="flex w-full items-center justify-between p-2.5 text-left hover:bg-emerald-50/60 rounded-xl transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.phone} {c.email ? `• ${c.email}` : ''}</div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {c.loyalty_points} Points
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl bg-white border border-emerald-200 p-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{selectedCustomer.name}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      ★ {selectedCustomer.loyalty_points} Points
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedCustomer.phone} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchQuery('');
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-[11px] font-bold"
                >
                  Change
                </button>
              </div>
            ) : (
              /* Register New Customer Form Inline */
              <form onSubmit={handleCreateCustomer} className="rounded-xl bg-white border border-emerald-200 p-3 space-y-2">
                <div className="text-xs font-bold text-emerald-800">New Customer Registration</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone (017...)"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Save & Apply
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4. Assigned Salesman */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Assigned Salesman (Sales Incentive):</span>
            </label>
            <select
              value={selectedSalesmanId}
              onChange={(e) => setSelectedSalesmanId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none shadow-sm"
            >
              <option value="">-- No Specific Salesman --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code}) - {emp.role}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Split Payment Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Payment Breakdown:</label>
              <div className="flex items-center gap-1">
                {['CASH', 'BKASH', 'NAGAD', 'CARD'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleAddSplitMethod(m)}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                  >
                    +{m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 rounded-xl bg-white border border-slate-200 px-2.5 py-2 text-center text-xs font-bold text-emerald-800 font-mono shadow-sm">
                      {p.payment_method}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={p.amount}
                        onChange={(e) => handleUpdatePayment(idx, 'amount', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 font-bold focus:border-emerald-600 focus:outline-none shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
                    </div>
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Remove method"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="w-full">
                    <input
                      type="text"
                      placeholder={
                        p.payment_method === 'CASH'
                          ? 'Cash Note / Ref (Optional)'
                          : `${p.payment_method} TrxID / Card Last 4 Digits`
                      }
                      value={p.transaction_ref || ''}
                      onChange={(e) => handleUpdatePayment(idx, 'transaction_ref', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Fast Tender Cash Buttons */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Cash Tender:</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[totalAmount, 500, 1000, 2000, 3000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 shadow-sm"
                >
                  {amt.toLocaleString()} ৳
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Fixed Sticky Bottom Action Bar (Always visible on mobile) */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex gap-2 sm:gap-3 z-20 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={cartItems.length === 0 || totalPaid < payableWithCredit}
            className={`flex-2 flex items-center justify-center gap-2 rounded-2xl py-3 px-5 text-xs sm:text-sm font-bold text-white shadow-xl transition-all ${
              cartItems.length > 0 && totalPaid >= payableWithCredit
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 active:scale-98'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete Sale & Print</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
