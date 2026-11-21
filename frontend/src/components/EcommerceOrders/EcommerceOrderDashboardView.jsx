import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Printer, 
  ExternalLink, 
  MessageSquare, 
  ArrowUpRight,
  Package, 
  DollarSign, 
  ChevronRight, 
  X, 
  User, 
  Calendar,
  AlertCircle,
  Copy
} from 'lucide-react';
import { ecommerceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SpotlightCard from '../common/SpotlightCard';
import UiverseButton from '../common/UiverseButton';

export default function EcommerceOrderDashboardView() {
  const { tenant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ecommerceApi.getAdminOrders(statusFilter !== 'ALL' ? statusFilter : undefined);
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load ecommerce orders:', err);
      showToast('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await ecommerceApi.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to ${newStatus}`);
      await loadOrders();
    } catch (err) {
      alert('Failed to update order status: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getWhatsAppMessageUrl = (order) => {
    const phone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('88') ? phone : phone.startsWith('01') ? `88${phone}` : phone;
    const text = encodeURIComponent(
      `Assalamu Alaikum ${order.customer_name},\n\n` +
      `Thank you for your order with ${tenant?.name || 'our store'}!\n` +
      `📦 Order Invoice: ${order.invoice_number}\n` +
      `💵 Total Payable: ৳${(order.total_amount || 0).toLocaleString()}\n` +
      `📍 Delivery Address: ${order.shipping_address}\n` +
      `🚚 Current Status: ${order.delivery_status}\n\n` +
      `We are preparing your parcel for dispatch. Please let us know if you need any adjustments!`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.invoice_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.shipping_address || '').toLowerCase().includes(q)
    );
  });

  // KPI Metrics Calculation
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(o => o.delivery_status === 'PENDING').length;
  const confirmedCount = orders.filter(o => o.delivery_status === 'CONFIRMED').length;
  const shippedCount = orders.filter(o => o.delivery_status === 'SHIPPED').length;
  const deliveredOrders = orders.filter(o => o.delivery_status === 'DELIVERED');
  const deliveredRevenue = deliveredOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in pb-28 md:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold shadow-2xl border border-slate-800 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                E-Commerce Order Operations Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                Online Store
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live incoming customer orders, courier dispatching, phone verification & delivery status tracking.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/store/${tenant?.slug || 'vogue'}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open Public Store</span>
          </a>

          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.12)" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Review</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Awaiting phone verification
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.12)" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Confirmed & Ready</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 font-mono">
            {confirmedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Packaged for courier dispatch
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.12)" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>In Transit (Shipped)</span>
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-600 font-mono">
            {shippedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            With courier (Steadfast / Pathao)
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.14)" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Completed Delivered</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            ৳{deliveredRevenue.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            {deliveredOrders.length} Completed Orders
          </div>
        </SpotlightCard>

      </div>

      {/* 3. Filters & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {st === 'ALL' ? `All (${totalOrdersCount})` : st}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

      </div>

      {/* 4. Orders Data Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Order Invoice</th>
                <th className="py-3.5 px-4">Customer Info</th>
                <th className="py-3.5 px-4">Shipping Address</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Payable Total</th>
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 font-medium">
                    {loading ? 'Loading orders from cloud database...' : 'No online orders found matching current filter.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Invoice & Date */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-slate-900">{o.invoice_number}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{o.created_at}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600 uppercase">
                        COD
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900">{o.customer_name}</div>
                      <div className="font-mono text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{o.customer_phone}</span>
                      </div>
                    </td>

                    {/* Shipping Address */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="flex items-start gap-1 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{o.shipping_address || 'Address not provided'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        Zone: {o.shipping_zone === 'INSIDE_DHAKA' ? 'Inside Dhaka (৳60)' : 'Outside Dhaka (৳120)'}
                      </div>
                    </td>

                    {/* Items Breakdown */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="space-y-1">
                        {(o.items || []).map((it, idx) => (
                          <div key={idx} className="text-slate-800 text-[11px] flex justify-between gap-2">
                            <span className="truncate">
                              {it.product_name} <span className="text-slate-500 font-mono">({it.size || 'STD'}{it.color ? `, ${it.color}` : ''})</span>
                            </span>
                            <span className="font-bold shrink-0">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {o.customer_notes && (
                        <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 p-1 rounded border border-amber-200">
                          Note: {o.customer_notes}
                        </div>
                      )}
                    </td>

                    {/* Payable Total */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ৳{(o.total_amount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Includes ৳{o.delivery_charge || 0} delivery
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadgeClass(o.delivery_status)}`}>
                          {o.delivery_status}
                        </span>

                        <select
                          disabled={updatingOrderId === o.id}
                          value={o.delivery_status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap space-y-1">
                      <div>
                        <button
                          onClick={() => setSelectedOrderForPrint(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200/80 transition-all"
                          title="Print Courier Shipping Slip"
                        >
                          <Printer className="h-3 w-3 text-slate-500" />
                          <span>Slip</span>
                        </button>
                      </div>

                      <div>
                        <a
                          href={getWhatsAppMessageUrl(o)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-all"
                          title="Send Order Update via WhatsApp"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Printable Courier Shipping Slip & Invoice Modal */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in zoom-in-95">
          <div className="relative w-full max-w-xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none border border-slate-200">
            
            <button
              onClick={() => setSelectedOrderForPrint(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 print:hidden transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Slip Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {tenant?.name || 'OmniFlow Store'}
                </h2>
                <p className="text-xs text-slate-500">E-Commerce Delivery Dispatch Voucher</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                  {selectedOrderForPrint.invoice_number}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">{selectedOrderForPrint.created_at}</div>
              </div>
            </div>

            {/* Courier Dispatch Box (Large Font for Courier Riders) */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 space-y-2 mb-4">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Consignee / Customer Delivery Address (প্রাপকের ঠিকানা):
              </div>
              <div className="text-base font-black text-slate-900">{selectedOrderForPrint.customer_name}</div>
              <div className="text-sm font-black font-mono text-emerald-700 flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span>{selectedOrderForPrint.customer_phone}</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 leading-relaxed pt-1">
                {selectedOrderForPrint.shipping_address}
              </div>
            </div>

            {/* COD Payable Amount Banner */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white flex justify-between items-center mb-4 shadow-md">
              <div>
                <div className="text-[10px] font-extrabold uppercase text-emerald-100">
                  Cash on Delivery Collection (কুরিয়ার ক্যাশ কালেকশন):
                </div>
                <div className="text-xs text-emerald-100 font-medium">Collect cash before parcel handover</div>
              </div>
              <div className="text-2xl font-black font-mono">
                ৳{(selectedOrderForPrint.total_amount || 0).toLocaleString()}
              </div>
            </div>

            {/* Itemized Manifest */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4">
              <div className="bg-slate-100 px-3.5 py-2 font-bold text-[10px] uppercase text-slate-600 flex justify-between">
                <span>Product Manifest</span>
                <span>Qty & Price</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 text-xs">
                {(selectedOrderForPrint.items || []).map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{it.product_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono ml-1.5">({it.size || 'STD'}{it.color ? `, ${it.color}` : ''})</span>
                    </div>
                    <div className="font-mono text-slate-700">
                      {it.quantity} x ৳{(it.unit_price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="py-1.5 flex justify-between text-slate-500 text-[11px] pt-2">
                  <span>Delivery Charge ({selectedOrderForPrint.shipping_zone}):</span>
                  <span className="font-mono font-bold">৳{selectedOrderForPrint.delivery_charge || 0}</span>
                </div>
              </div>
            </div>

            {/* Print Trigger */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Dispatch Slip</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
