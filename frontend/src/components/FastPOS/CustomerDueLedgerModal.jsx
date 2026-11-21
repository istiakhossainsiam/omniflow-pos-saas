import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw, 
  BookOpen, 
  User, 
  Phone, 
  Clock, 
  Smartphone, 
  Printer, 
  Send, 
  History,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { posApi } from '../../services/api';

export default function CustomerDueLedgerModal({ branchId, tenant, onClose }) {
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState({ total_due_receivable: 0, total_debtors_count: 0, customers: [] });
  const [searchTerm, setSearchTerm] = useState('');

  // Selected customer for repayment
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [repayNotes, setRepayNotes] = useState('');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [repayReceipt, setRepayReceipt] = useState(null);

  // Customer history drawer
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async (search = '') => {
    try {
      setLoading(true);
      const data = await posApi.getDueLedger(search || searchTerm);
      setLedgerData(data || { total_due_receivable: 0, total_debtors_count: 0, customers: [] });
    } catch (err) {
      console.error("Failed to load due ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadLedger(searchTerm);
  };

  const handleOpenRepayModal = (cust) => {
    setSelectedCustomer(cust);
    setRepayAmount((cust.due_balance || 0).toString());
    setRepayReceipt(null);
  };

  const handleSubmitRepay = async (e) => {
    e.preventDefault();
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid repayment amount");
      return;
    }

    try {
      setIsSubmittingRepay(true);
      const res = await posApi.repayCustomerDue(selectedCustomer.id, {
        amount,
        payment_method: paymentMethod,
        notes: repayNotes,
        branch_id: branchId
      });
      setRepayReceipt(res);
      await loadLedger();
    } catch (err) {
      alert(err.message || "Failed to process repayment");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const handleViewHistory = async (cust) => {
    try {
      setHistoryCustomer(cust);
      setLoadingHistory(true);
      const history = await posApi.getCustomerDueHistory(cust.id);
      setHistoryList(history || []);
    } catch (err) {
      alert(err.message || "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendReminderWhatsApp = (cust) => {
    if (!cust.phone) return;
    const phoneClean = cust.phone.replace(/\D/g, '');
    const text = `আসসালামু আলাইকুম ${cust.name},\n${tenant?.name || 'OmniFlow Retail'} থেকে জানানো যাচ্ছে যে, আপনার বকেয়া ব্যালেন্স ৳${cust.due_balance?.toLocaleString()}।\nসুবিধাজনক সময়ে পরিশোধ করার জন্য অনুরোধ করা হলো।\nধন্যবাদ!`;
    const url = `https://wa.me/88${phoneClean.startsWith('88') ? phoneClean.slice(2) : phoneClean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Customer Due Ledger (বাকি খাতা)
              </h3>
              <p className="text-[11px] text-slate-500">
                Track credit balances, collect partial debt payments, and print money receipts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase">Total Market Due Receivable</span>
                <div className="mt-1 text-xl sm:text-2xl font-black text-amber-950">
                  ৳{(ledgerData.total_due_receivable || 0).toLocaleString()}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-200/80 text-amber-800 font-bold">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase">Customers with Outstanding Balance</span>
                <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                  {ledgerData.total_debtors_count || 0} Customers
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 font-bold">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search debtor by Customer Name, Mobile Number, or Address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800"
            >
              Filter
            </button>
          </form>

          {/* Customer Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
              <span>Loading customer ledger...</span>
            </div>
          ) : ledgerData.customers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl">
              🎉 No customer dues found! All sales are fully settled.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Lifetime Spent</th>
                      <th className="py-3 px-3 text-rose-700">Due Balance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ledgerData.customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.address || 'Dhaka'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {c.phone}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">
                          ৳{(c.total_spent || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs">
                            ৳{(c.due_balance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSendReminderWhatsApp(c)}
                              title="Send WhatsApp payment reminder"
                              className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <Smartphone className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleViewHistory(c)}
                              title="View Ledger Statement"
                              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenRepayModal(c)}
                              className="flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Collect</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Repayment Modal Popup */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
              
              {repayReceipt ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Payment Received!</h4>
                  <p className="text-xs text-slate-500">
                    Money Receipt: <span className="font-mono font-bold text-slate-900">{repayReceipt.receipt_number}</span>
                  </p>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-bold font-sans">{repayReceipt.customer_name}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Amount Collected:</span>
                      <span>৳{repayReceipt.paid_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Remaining Due:</span>
                      <span className="font-bold">৳{repayReceipt.remaining_due?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 rounded-2xl bg-slate-900 text-white px-4 py-2 text-xs font-bold"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Money Receipt</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setRepayReceipt(null);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Collect Due Debt Payment</h4>
                      <p className="text-xs text-slate-500">{selectedCustomer.name} ({selectedCustomer.phone})</p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitRepay} className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex justify-between items-center">
                      <span className="font-bold text-amber-900">Total Outstanding Balance:</span>
                      <span className="font-mono font-black text-amber-950 text-sm">৳{selectedCustomer.due_balance?.toLocaleString()}</span>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Amount (৳):</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedCustomer.due_balance}
                        required
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                      >
                        <option value="CASH">Cash in Hand</option>
                        <option value="BKASH">bKash MFS</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="CARD">Bank Card / POS</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Notes / Reference:</label>
                      <input
                        type="text"
                        value={repayNotes}
                        onChange={(e) => setRepayNotes(e.target.value)}
                        placeholder="e.g. Paid in cash at showroom..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRepay}
                        className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 font-bold shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {isSubmittingRepay ? "Saving..." : "Confirm Payment"}
                      </button>
                    </div>
                  </form>
                </>
              )}

            </div>
          </div>
        )}

        {/* Customer History Drawer */}
        {historyCustomer && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 space-y-3.5 max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{historyCustomer.name}'s Ledger Timeline</h4>
                  <span className="text-[10px] text-slate-500">All credit purchases & repayments</span>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                {loadingHistory ? (
                  <div className="p-8 text-center text-slate-400">Loading timeline...</div>
                ) : historyList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No ledger transactions found.</div>
                ) : (
                  historyList.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border ${
                        item.type === 'REPAYMENT'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.description}</span>
                        <span className={`font-mono font-black ${
                          item.type === 'REPAYMENT' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.type === 'REPAYMENT' ? `-৳${item.amount?.toLocaleString()}` : `+৳${item.due_amount?.toLocaleString()} (Due)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Ref: {item.ref_number}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setHistoryCustomer(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
