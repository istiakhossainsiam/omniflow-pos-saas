import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  RotateCcw, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Printer, 
  Smartphone, 
  DollarSign, 
  CreditCard, 
  RefreshCw,
  ShoppingBag,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { posApi } from '../../services/api';

export default function ExchangeReturnModal({ branchId, tenant, onClose, onExchangeCompleted }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Return items selected: { [itemId]: { ...item, return_quantity: 1 } }
  const [returnSelection, setReturnSelection] = useState({});

  // New items added: [{ variant_id, product_name, size, color, sku, unit_price, quantity }]
  const [newItems, setNewItems] = useState([]);
  const [newScanInput, setNewScanInput] = useState('');
  const [isScanningNew, setIsScanningNew] = useState(false);

  // Adjustment config
  const [adjustmentType, setAdjustmentType] = useState('EVEN'); // CUSTOMER_PAID, CASH_REFUNDED, STORE_CREDIT, DUE_ADJUSTED, EVEN
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [exchangeNotes, setExchangeNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedExchange, setCompletedExchange] = useState(null);

  // Search orders
  const handleSearchOrder = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await posApi.lookupExchange(searchQuery.trim());
      setMatchedOrders(res || []);
      if (res && res.length === 1) {
        setSelectedOrder(res[0]);
        setReturnSelection({});
      }
    } catch (err) {
      alert(err.message || "Failed to find order");
    } finally {
      setIsSearching(false);
    }
  };

  // Select an order from matched list
  const handleSelectOrder = (ord) => {
    setSelectedOrder(ord);
    setReturnSelection({});
    setNewItems([]);
  };

  // Toggle or change quantity of return item
  const handleToggleReturnItem = (item) => {
    setReturnSelection(prev => {
      const existing = prev[item.item_id];
      if (existing) {
        const next = { ...prev };
        delete next[item.item_id];
        return next;
      } else {
        return {
          ...prev,
          [item.item_id]: {
            ...item,
            return_quantity: 1
          }
        };
      }
    });
  };

  const handleReturnQtyChange = (itemId, qty, maxQty) => {
    const validQty = Math.max(1, Math.min(parseInt(qty) || 1, maxQty));
    setReturnSelection(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        return_quantity: validQty
      }
    }));
  };

  // Scan or add new replacement item
  const handleScanNewItem = async (e) => {
    if (e) e.preventDefault();
    if (!newScanInput.trim()) return;

    try {
      setIsScanningNew(true);
      const res = await posApi.scanBarcode(newScanInput.trim(), branchId);
      if (res && res.variant) {
        const v = res.variant;
        setNewItems(prev => {
          const idx = prev.findIndex(i => i.variant_id === v.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx].quantity += 1;
            return next;
          } else {
            return [
              ...prev,
              {
                variant_id: v.id,
                product_name: res.product_name || 'Apparel Item',
                size: v.size,
                color: v.color,
                sku: v.sku,
                unit_price: v.retail_price,
                quantity: 1
              }
            ];
          }
        });
        setNewScanInput('');
      }
    } catch (err) {
      alert(err.message || "Item not found in branch inventory");
    } finally {
      setIsScanningNew(false);
    }
  };

  const handleRemoveNewItem = (index) => {
    setNewItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalReturnValue = Object.values(returnSelection).reduce((sum, itm) => {
    return sum + (itm.unit_price * itm.return_quantity);
  }, 0);

  const totalNewValue = newItems.reduce((sum, itm) => {
    return sum + (itm.unit_price * itm.quantity);
  }, 0);

  const priceDifference = totalNewValue - totalReturnValue;

  // Auto set adjustment type based on difference
  React.useEffect(() => {
    if (priceDifference > 0) {
      setAdjustmentType('CUSTOMER_PAID');
    } else if (priceDifference < 0) {
      setAdjustmentType('STORE_CREDIT');
    } else {
      setAdjustmentType('EVEN');
    }
  }, [priceDifference]);

  // Submit Exchange
  const handleExecuteExchange = async () => {
    const returnList = Object.values(returnSelection).map(i => ({
      variant_id: i.variant_id,
      product_name: i.product_name,
      size: i.size,
      color: i.color,
      quantity: i.return_quantity,
      unit_price: i.unit_price
    }));

    if (returnList.length === 0) {
      alert("Please select at least one item to return");
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        original_order_id: selectedOrder.order_id,
        return_items: returnList,
        new_items: newItems,
        adjustment_type: adjustmentType,
        adjustment_amount: Math.abs(priceDifference),
        payment_method: paymentMethod,
        notes: exchangeNotes,
        branch_id: branchId
      };

      const res = await posApi.processExchange(payload);
      setCompletedExchange(res);
      if (onExchangeCompleted) onExchangeCompleted(res);
    } catch (err) {
      alert(err.message || "Exchange failed to process");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Quick Exchange & Return Workflow
              </h3>
              <p className="text-[11px] text-slate-500">
                Restock returned garment sizes, issue replacement apparel, and calculate net price difference
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {completedExchange ? (
            /* Completed Exchange Success Slip View */
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Exchange Completed Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Exchange Slip: <span className="font-mono font-bold text-emerald-700">{completedExchange.exchange_invoice_number}</span>
                </p>
              </div>

              <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{completedExchange.customer_name} ({completedExchange.customer_phone || 'N/A'})</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Returned Goods Value:</span>
                  <span className="font-mono font-bold text-rose-700">৳{completedExchange.return_total?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>New Replacement Goods:</span>
                  <span className="font-mono font-bold text-emerald-700">৳{completedExchange.new_total?.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                  <span>Net Adjustment ({completedExchange.adjustment_type}):</span>
                  <span className="font-mono">৳{completedExchange.adjustment_amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Exchange Slip</span>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700"
                >
                  Close & Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Invoice / Customer Search */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <span>Step 1: Scan / Search Original Invoice Number or Customer Mobile</span>
                </label>
                <form onSubmit={handleSearchOrder} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. INV-202610... or 01711223344"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    <span>Lookup</span>
                  </button>
                </form>

                {/* Multiple matches selector */}
                {matchedOrders.length > 1 && !selectedOrder && (
                  <div className="mt-2 space-y-1.5 border-t border-slate-200 pt-2">
                    <span className="text-[11px] font-bold text-slate-500">Select Invoice to Exchange:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {matchedOrders.map(mo => (
                        <button
                          key={mo.order_id}
                          onClick={() => handleSelectOrder(mo)}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-amber-500 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900">{mo.invoice_number}</span>
                            <div className="text-[10px] text-slate-500">{mo.customer_name} • {mo.created_at}</div>
                          </div>
                          <span className="font-mono font-black text-emerald-700">৳{mo.total_amount}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedOrder && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  
                  {/* Left Column: Original Order Items to Return */}
                  <div className="lg:col-span-6 rounded-2xl border border-rose-200/80 bg-rose-50/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-900">
                        <ArrowDownRight className="h-4 w-4 text-rose-600" />
                        <span>Returned Items (Restocked)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        Total: ৳{totalReturnValue.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {selectedOrder.items.map(itm => {
                        const isSelected = !!returnSelection[itm.item_id];
                        const retObj = returnSelection[itm.item_id] || { return_quantity: 1 };
                        return (
                          <div
                            key={itm.item_id}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-300 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleReturnItem(itm)}
                                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 h-4 w-4 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{itm.product_name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono">{itm.sku}</span>
                                    <span>•</span>
                                    <span>Size: {itm.size || 'Free'}</span>
                                    <span>•</span>
                                    <span>Color: {itm.color || 'Std'}</span>
                                  </div>
                                </div>
                              </label>

                              <span className="font-mono font-bold text-slate-800 shrink-0">
                                ৳{itm.unit_price}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="mt-2 pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                                <span className="text-slate-600">Return Qty (Max {itm.quantity}):</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={itm.quantity}
                                  value={retObj.return_quantity}
                                  onChange={(e) => handleReturnQtyChange(itm.item_id, e.target.value, itm.quantity)}
                                  className="w-16 rounded-lg border border-rose-300 bg-white px-2 py-0.5 text-center font-bold text-rose-900 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: New Replacement Items */}
                  <div className="lg:col-span-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        <span>New Replacement Items</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Total: ৳{totalNewValue.toLocaleString()}
                      </span>
                    </div>

                    {/* Scan new product */}
                    <form onSubmit={handleScanNewItem} className="flex gap-1.5">
                      <input
                        type="text"
                        value={newScanInput}
                        onChange={(e) => setNewScanInput(e.target.value)}
                        placeholder="Scan Barcode / SKU of new item..."
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isScanningNew}
                        className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 shrink-0"
                      >
                        {isScanningNew ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                    </form>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {newItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-emerald-200 rounded-xl">
                          No new replacement items scanned yet. (Scan if customer is taking another garment).
                        </div>
                      ) : (
                        newItems.map((ni, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                            <div>
                              <div className="font-bold text-slate-900 truncate max-w-[170px]">{ni.product_name}</div>
                              <div className="text-[10px] text-slate-500">Size: {ni.size} • Qty: {ni.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">৳{(ni.unit_price * ni.quantity).toLocaleString()}</span>
                              <button
                                onClick={() => handleRemoveNewItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Step 3: Summary & Settlement Action */}
              {selectedOrder && Object.keys(returnSelection).length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div>
                      <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                        Net Price Calculation:
                      </span>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Returned Goods: <b className="text-rose-700">৳{totalReturnValue.toLocaleString()}</b> &nbsp;|&nbsp; 
                        New Goods: <b className="text-emerald-700">৳{totalNewValue.toLocaleString()}</b>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 block">Balance Difference</span>
                      <span className={`text-base sm:text-lg font-black font-mono ${
                        priceDifference > 0 ? 'text-emerald-700' : priceDifference < 0 ? 'text-rose-700' : 'text-slate-800'
                      }`}>
                        {priceDifference > 0 ? `+৳${priceDifference.toLocaleString()} (Customer Pays)` : priceDifference < 0 ? `-৳${Math.abs(priceDifference).toLocaleString()} (Store Refunds)` : '৳0 (Even Exchange)'}
                      </span>
                    </div>
                  </div>

                  {/* Settlement mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Settlement Action:</label>
                      <select
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 focus:outline-none"
                      >
                        {priceDifference > 0 && <option value="CUSTOMER_PAID">Customer Pays Difference (Cash/bKash)</option>}
                        {priceDifference < 0 && <option value="STORE_CREDIT">Issue Store Credit / Voucher</option>}
                        {priceDifference < 0 && <option value="CASH_REFUNDED">Refund Cash to Customer</option>}
                        {priceDifference < 0 && <option value="DUE_ADJUSTED">Deduct from Customer Due Ledger</option>}
                        {priceDifference === 0 && <option value="EVEN">Even Exchange (Zero Balance)</option>}
                      </select>
                    </div>

                    {adjustmentType === 'CUSTOMER_PAID' && (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-900 focus:outline-none"
                        >
                          <option value="CASH">Cash in Drawer</option>
                          <option value="BKASH">bKash MFS</option>
                          <option value="NAGAD">Nagad</option>
                          <option value="CARD">Debit / Credit Card</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={exchangeNotes}
                      onChange={(e) => setExchangeNotes(e.target.value)}
                      placeholder="Reason for exchange (e.g. Size M too tight, exchanged for L)..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={onClose}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteExchange}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 text-xs font-extrabold shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                      <span>{isProcessing ? "Processing..." : "Complete Garment Exchange"}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
