import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardCheck, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  PackagePlus,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { requisitionApi, productApi } from '../../services/api';

export default function RequisitionsView() {
  const { user, selectedBranch } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [reqType, setReqType] = useState('STOCK_IN');
  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState('High customer demand for weekend');
  const [notification, setNotification] = useState(null);

  const isManagerOrOwner = ['STORE_OWNER', 'SUPER_ADMIN', 'STORE_MANAGER'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, prods] = await Promise.all([
        requisitionApi.list({ branch_id: selectedBranch?.id }),
        productApi.list()
      ]);
      setRequisitions(reqs);
      setProducts(prods);

      const firstVar = prods[0]?.variants[0];
      if (firstVar) setSelectedVariantId(firstVar.id);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedVariantId) return;

    try {
      await requisitionApi.create({
        variant_id: selectedVariantId,
        branch_id: selectedBranch?.id,
        req_type: reqType,
        quantity: parseInt(quantity) || 1,
        reason
      });
      setShowCreateModal(false);
      showToast("Stock request submitted to store manager!");
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReview = async (id, status) => {
    try {
      await requisitionApi.review(id, {
        status,
        review_notes: `Reviewed by ${user?.full_name}`
      });
      showToast(`Request ${status.toLowerCase()} successfully!`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const allVariants = products.flatMap(p => 
    p.variants.map(v => ({
      id: v.id,
      label: `${p.name} - Size: ${v.size || 'STD'} | Color: ${v.color || 'STD'} (${v.sku})`
    }))
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Toast */}
      {notification && (
        <div className={`fixed top-16 sm:top-20 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-4 ${
          notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Stock Shortage & Requisitions</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Floor Staff Stock Requests with Store Manager 1-Click Verification & Approval
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock Request</span>
        </button>
      </div>

      {/* Requisition Table */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Garment Item</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3">Requested By</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Manager Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading requests...</td></tr>
              ) : requisitions.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No pending stock requests found.</td></tr>
              ) : (
                requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{req.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {req.size ? `Size: ${req.size}` : ''} {req.color ? `| ${req.color}` : ''} ({req.sku})
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        req.req_type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.req_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">{req.quantity} pcs</td>
                    <td className="py-3 px-3 text-slate-700">{req.requested_by_name}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">{req.reason || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'APPROVED' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'PENDING' && isManagerOrOwner ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(req.id, 'APPROVED')}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'REJECTED')}
                            className="flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 shadow-sm"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {req.reviewed_by_name ? `By ${req.reviewed_by_name}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base">New Stock Request</h3>
            <p className="text-xs text-slate-500 mt-1">Submit request to store manager for inventory update</p>
            
            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Select Garment Variant:</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  {allVariants.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Request Type:</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="STOCK_IN">Stock Addition (+)</option>
                    <option value="STOCK_SHORTAGE">Stock Shortage (-)</option>
                    <option value="DAMAGED_GOODS">Damaged Goods (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Quantity (pcs):</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Reason / Note for Manager:</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
