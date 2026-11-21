import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Truck, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  ArrowRight, 
  Package, 
  Search, 
  Printer, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { requisitionApi, tenantApi, posApi } from '../../services/api';

export default function StockTransferChallanModal({ currentBranchId, tenant, onClose }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Transfer Form State
  const [fromBranchId, setFromBranchId] = useState(currentBranchId || '');
  const [toBranchId, setToBranchId] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [matchedVariant, setMatchedVariant] = useState(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferNotes, setTransferNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingVariant, setSearchingVariant] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, bList] = await Promise.all([
        requisitionApi.getTransfers(),
        tenantApi.getBranches()
      ]);
      setTransfers(tList || []);
      setBranches(bList || []);
      if (bList && bList.length > 0) {
        if (!fromBranchId) setFromBranchId(bList[0].id);
        if (bList.length > 1) setToBranchId(bList[1].id);
      }
    } catch (err) {
      console.error("Failed to load transfer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupVariant = async (e) => {
    e.preventDefault();
    if (!variantSearch.trim()) return;
    try {
      setSearchingVariant(true);
      const res = await posApi.scanBarcode(variantSearch.trim(), fromBranchId);
      if (res && res.variant) {
        setMatchedVariant({
          id: res.variant.id,
          product_name: res.product_name,
          size: res.variant.size,
          color: res.variant.color,
          sku: res.variant.sku,
          stock: res.current_stock || 0
        });
      }
    } catch (err) {
      alert(err.message || "Product variant not found in origin showroom");
    } finally {
      setSearchingVariant(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!matchedVariant) {
      alert("Please search and select a garment variant to transfer");
      return;
    }
    if (fromBranchId === toBranchId) {
      alert("Origin and destination showrooms must be different");
      return;
    }

    try {
      setIsSubmitting(true);
      await requisitionApi.createTransfer({
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        variant_id: matchedVariant.id,
        quantity: parseInt(transferQty) || 1,
        notes: transferNotes
      });
      alert("Stock Transfer Challan created and dispatched!");
      setActiveTab('list');
      setMatchedVariant(null);
      setVariantSearch('');
      setTransferNotes('');
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to create transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveChallan = async (transferId) => {
    if (!window.confirm("Acknowledge that goods have physically arrived and add to your showroom inventory?")) return;
    try {
      await requisitionApi.receiveTransfer(transferId);
      alert("Stock received successfully!");
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to receive transfer");
    }
  };

  const handleCancelChallan = async (transferId) => {
    if (!window.confirm("Cancel this transfer and return items to origin stock?")) return;
    try {
      await requisitionApi.cancelTransfer(transferId);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel transfer");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Showroom Stock Transfer Challan (চালান ও ট্রান্সফার)
              </h3>
              <p className="text-[11px] text-slate-500">
                Inter-branch garment logistics, central warehouse dispatch, and delivery gate-pass tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('list')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transfers ({transfers.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                  activeTab === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Challan</span>
              </button>
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {activeTab === 'create' ? (
            /* New Transfer Form */
            <form onSubmit={handleCreateTransfer} className="max-w-2xl mx-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Origin Showroom (From):</label>
                  <select
                    value={fromBranchId}
                    onChange={(e) => {
                      setFromBranchId(e.target.value);
                      setMatchedVariant(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Showroom (To):</label>
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {branches.filter(b => b.id !== fromBranchId).map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Variant Search */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <label className="font-bold text-slate-700 block">Search Garment to Dispatch:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                    placeholder="Scan Barcode, SKU, or Product Name..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-900 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLookupVariant}
                    disabled={searchingVariant}
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-800"
                  >
                    {searchingVariant ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Lookup"}
                  </button>
                </div>

                {matchedVariant && (
                  <div className="mt-2 p-3 rounded-xl bg-white border border-teal-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{matchedVariant.product_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {matchedVariant.sku} • Size: {matchedVariant.size} • Color: {matchedVariant.color}
                      </div>
                    </div>
                    <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      Available Stock: {matchedVariant.stock} pcs
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transfer Quantity (Pcs):</label>
                  <input
                    type="number"
                    min="1"
                    max={matchedVariant?.stock || 9999}
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gate Pass / Driver Notes:</label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="e.g. Sent via Showroom Delivery Van (Driver: Karim)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="rounded-2xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !matchedVariant}
                  className="flex items-center gap-1.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 font-bold shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                >
                  <Truck className="h-4 w-4" />
                  <span>{isSubmitting ? "Dispatching..." : "Dispatch Transfer Challan"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Transfers List */
            <div className="space-y-3">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal-600 mb-2" />
                  <span>Loading transfer challans...</span>
                </div>
              ) : transfers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl">
                  No stock transfers found. Click "New Challan" to dispatch inventory between showrooms.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transfers.map(t => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{t.tracking_code}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'IN_TRANSIT'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-sm">
                          {t.product_name} • <span className="text-teal-700 font-black">{t.quantity} Pcs</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Building2 className="h-3 w-3" />
                            {t.from_branch_name}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Building2 className="h-3 w-3" />
                            {t.to_branch_name}
                          </span>
                          <span>•</span>
                          <span>{t.created_at}</span>
                        </div>
                        {t.notes && <div className="text-[10px] text-slate-400">Note: {t.notes}</div>}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {t.status === 'IN_TRANSIT' && (
                          <>
                            <button
                              onClick={() => handleReceiveChallan(t.id)}
                              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold shadow-xs active:scale-95"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Accept & Receive</span>
                            </button>
                            <button
                              onClick={() => handleCancelChallan(t.id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1.5 font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => window.print()}
                          title="Print Gate Pass Challan"
                          className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
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
