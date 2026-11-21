import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Calendar, 
  Clock, 
  History, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  Receipt,
  FileText
} from 'lucide-react';
import { posApi } from '../../services/api';

export default function RegisterDayClosingModal({ branchId, tenant, user, onClose }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);

  // Open session state
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  // Close session state
  const [closingCashActual, setClosingCashActual] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closedZReport, setClosedZReport] = useState(null);

  // History state
  const [pastReports, setPastReports] = useState([]);
  const [selectedPastReport, setSelectedPastReport] = useState(null);

  useEffect(() => {
    loadCurrentSession();
  }, [branchId]);

  const loadCurrentSession = async () => {
    try {
      setLoading(true);
      const data = await posApi.getCurrentRegisterSession(branchId);
      setSessionData(data);
      if (data && data.expected_cash_in_drawer !== undefined) {
        setClosingCashActual(data.expected_cash_in_drawer.toString());
      }
    } catch (err) {
      console.error("Failed to load register session:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPastReports = async () => {
    try {
      const data = await posApi.getZReports(branchId);
      setPastReports(data || []);
    } catch (err) {
      console.error("Failed to load past Z-reports:", err);
    }
  };

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    try {
      setIsOpening(true);
      await posApi.openRegisterSession({
        opening_cash: parseFloat(openingCashInput) || 0,
        branch_id: branchId
      });
      await loadCurrentSession();
    } catch (err) {
      alert(err.message || "Failed to open register");
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseRegister = async () => {
    const countedCash = parseFloat(closingCashActual);
    if (isNaN(countedCash) || countedCash < 0) {
      alert("Please enter a valid actual cash count in drawer");
      return;
    }

    if (!window.confirm("Are you sure you want to CLOSE the cash register for today? This will generate the final Z-Report.")) {
      return;
    }

    try {
      setIsClosing(true);
      const res = await posApi.closeRegisterSession({
        closing_cash_actual: countedCash,
        notes: closingNotes,
        branch_id: branchId
      });
      setClosedZReport(res.z_report);
    } catch (err) {
      alert(err.message || "Failed to close register");
    } finally {
      setIsClosing(false);
    }
  };

  const expectedCash = sessionData?.expected_cash_in_drawer || 0;
  const actualCash = parseFloat(closingCashActual) || 0;
  const discrepancy = actualCash - expectedCash;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Daily Register Closing & Cash Drawer Z-Report
              </h3>
              <p className="text-[11px] text-slate-500">
                End-of-day register reconciliation, cash balance count, and audit reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('current')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeTab === 'current' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Register
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  loadPastReports();
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past Z-Reports
              </button>
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <span className="text-xs">Loading cash register session...</span>
            </div>
          ) : closedZReport ? (
            /* Z-Report Thermal Slip Preview */
            <div className="space-y-4 text-center animate-in zoom-in-95">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">Shift Closed & Z-Report Generated</h4>

              {/* Printable Slip Container */}
              <div className="mx-auto max-w-sm rounded-2xl border border-slate-300 bg-slate-50 p-5 text-left font-mono text-xs space-y-2.5 shadow-inner">
                <div className="text-center border-b border-dashed border-slate-300 pb-2.5 space-y-0.5">
                  <div className="font-sans font-black text-sm text-slate-900 uppercase">{tenant?.name || 'OMNIFLOW POS'}</div>
                  <div className="font-bold text-slate-600">DAILY REGISTER Z-REPORT</div>
                  <div className="text-[10px] text-slate-500">Session: {closedZReport.session_code}</div>
                  <div className="text-[10px] text-slate-500">Closed: {closedZReport.closed_at} by {closedZReport.closed_by}</div>
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Total Completed Orders:</span>
                    <span className="font-bold">{closedZReport.orders_count}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>GROSS SALES VOLUME:</span>
                    <span>৳{closedZReport.total_sales?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between text-slate-600">
                    <span>+ Cash Sales:</span>
                    <span>৳{closedZReport.total_cash_sales?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>+ bKash / MFS Sales:</span>
                    <span>৳{closedZReport.total_bkash_sales?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>+ Card / POS Sales:</span>
                    <span>৳{closedZReport.total_card_sales?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>+ Due Payments Collected:</span>
                    <span>৳{closedZReport.due_cash_collected?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Cash Refunds Given:</span>
                    <span>৳{closedZReport.cash_refunds_paid?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Opening Cash Float:</span>
                    <span>৳{closedZReport.opening_cash?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-900">
                    <span>EXPECTED IN DRAWER:</span>
                    <span>৳{closedZReport.expected_cash_in_drawer?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>ACTUAL CASH COUNT:</span>
                    <span>৳{closedZReport.closing_cash_actual?.toLocaleString()}</span>
                  </div>
                </div>

                <div className={`flex justify-between font-bold text-xs p-1.5 rounded ${
                  closedZReport.cash_discrepancy === 0
                    ? 'bg-emerald-100 text-emerald-900'
                    : closedZReport.cash_discrepancy > 0
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  <span>DISCREPANCY:</span>
                  <span>
                    {closedZReport.cash_discrepancy === 0 ? 'MATCHED (৳0)' : closedZReport.cash_discrepancy > 0 ? `+৳${closedZReport.cash_discrepancy} (Overage)` : `-৳${Math.abs(closedZReport.cash_discrepancy)} (Shortage)`}
                  </span>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-1">
                  *** END OF SHIFT AUDIT REPORT ***
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Z-Report</span>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2 text-xs font-bold text-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : activeTab === 'current' ? (
            /* Active Register Session Dashboard */
            <div className="space-y-4">
              
              {/* Financial Snapshot KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">Gross Sales</div>
                  <div className="mt-1 text-base sm:text-xl font-black text-indigo-950">
                    ৳{(sessionData?.total_sales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">{sessionData?.orders_count || 0} Invoices</div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Cash in Register</div>
                  <div className="mt-1 text-base sm:text-xl font-black text-emerald-950">
                    ৳{(sessionData?.total_cash_sales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">+৳{(sessionData?.due_cash_collected || 0)} Due Pmt</div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">bKash / MFS / Card</div>
                  <div className="mt-1 text-base sm:text-xl font-black text-blue-950">
                    ৳{((sessionData?.total_bkash_sales || 0) + (sessionData?.total_card_sales || 0)).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Digital payments</div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Expected Cash</div>
                  <div className="mt-1 text-base sm:text-xl font-black text-amber-950">
                    ৳{(sessionData?.expected_cash_in_drawer || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Opening + Cash Sales</div>
                </div>
              </div>

              {/* Day Closing Cash Counting Form */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    Cash Drawer Count & Reconciliation
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Opened at: {sessionData?.opened_at}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Expected Cash in Drawer:
                    </label>
                    <div className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700">
                      ৳{expectedCash.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Opening (৳{sessionData?.opening_cash || 0}) + Cash Sales (৳{sessionData?.total_cash_sales || 0}) + Due Recv (৳{sessionData?.due_cash_collected || 0}) - Refunds (৳{sessionData?.cash_refunds_paid || 0})
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      Actual Physical Cash Counted (৳):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={closingCashActual}
                      onChange={(e) => setClosingCashActual(e.target.value)}
                      className="w-full rounded-xl border border-indigo-300 bg-white px-3.5 py-2.5 text-xs font-mono font-black text-indigo-950 focus:border-indigo-600 focus:outline-none shadow-xs"
                      placeholder="Enter physical cash in hand..."
                    />
                    
                    {/* Discrepancy Alert */}
                    <div className={`mt-1.5 flex items-center justify-between p-2 rounded-lg text-xs font-bold ${
                      discrepancy === 0
                        ? 'bg-emerald-100 text-emerald-900'
                        : discrepancy > 0
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}>
                      <span>Discrepancy:</span>
                      <span>
                        {discrepancy === 0 ? '✓ Perfect Match (৳0)' : discrepancy > 0 ? `+৳${discrepancy.toLocaleString()} (Cash Overage)` : `-৳${Math.abs(discrepancy).toLocaleString()} (Cash Shortage)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shift / Closing Notes:</label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="e.g. 500 BDT kept for tomorrow opening change..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={handleCloseRegister}
                    disabled={isClosing}
                    className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isClosing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    <span>{isClosing ? "Closing Shift..." : "Close Register & Print Z-Report"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Past Z-Reports List */
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Archived Day-Closing Z-Reports</h4>
              {pastReports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  No previous day-closing reports recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {pastReports.map(pr => (
                    <div
                      key={pr.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{pr.session_code}</div>
                        <div className="text-[10px] text-slate-500">{pr.closed_at} • Cashier: {pr.cashier_name}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">৳{pr.total_sales?.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{pr.orders_count} Invoices</div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pr.cash_discrepancy === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pr.cash_discrepancy === 0 ? 'Matched' : `৳${pr.cash_discrepancy}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
