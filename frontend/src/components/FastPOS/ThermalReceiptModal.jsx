import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, CheckCircle, Sparkles, Smartphone, Send, Copy, Check, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
import { posApi } from '../../services/api';

export default function ThermalReceiptModal({ order, tenant, selectedBranch, onClose }) {
  if (!order) return null;

  const [whatsappPhone, setWhatsappPhone] = useState(order.customer_phone || '');
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waStatus, setWaStatus] = useState(null); // { success: bool, message: str, link: str }
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      alert("Please enter customer's WhatsApp mobile number (e.g. 01711000111)");
      return;
    }

    try {
      setIsSendingWa(true);
      setWaStatus(null);
      const res = await posApi.sendWhatsAppBill(order.id, whatsappPhone.trim());
      
      if (res.openwa_dispatched) {
        setWaStatus({
          success: true,
          mode: 'openwa',
          message: 'Bill dispatched automatically via GitHub OpenWA Gateway!',
          link: res.whatsapp_link
        });
      } else {
        setWaStatus({
          success: true,
          mode: 'direct',
          message: 'Opening WhatsApp with formatted digital bill...',
          link: res.whatsapp_link
        });
        // Open WhatsApp web or app directly in new window
        window.open(res.whatsapp_link, '_blank');
      }
    } catch (err) {
      console.error("WhatsApp dispatch error:", err);
      // Fallback to manual direct link
      const fallbackUrl = `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🧾 *${tenant?.name || 'INVOICE'}*\nInvoice #: ${order.invoice_number}\nTotal: ৳${order.total_amount}`)}`;
      setWaStatus({
        success: false,
        mode: 'fallback',
        message: err.message || 'Direct WhatsApp Link Generated',
        link: fallbackUrl
      });
      window.open(fallbackUrl, '_blank');
    } finally {
      setIsSendingWa(false);
    }
  };

  const handleCopyTextBill = async () => {
    try {
      const res = await posApi.sendWhatsAppBill(order.id, whatsappPhone.trim());
      if (res.formatted_text) {
        await navigator.clipboard.writeText(res.formatted_text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      // Simple fallback text
      const text = `🧾 ${tenant?.name || 'RECEIPT'}\nInvoice: ${order.invoice_number}\nTotal: ৳${order.total_amount}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">Sale Completed!</h3>
              <span className="text-[11px] text-emerald-700 font-mono font-bold">{order.invoice_number}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 press-tactile transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content: WhatsApp Dispatch Bar + Printable Thermal Receipt */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5">
          
          {/* WhatsApp Instant Bill Bar */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Customer WhatsApp Digital Bill (OpenWA)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                ⚡ Instant SMS/WA
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="tel"
                placeholder="e.g. 01711223344 or 8801811..."
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none shadow-xs"
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isSendingWa}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSendingWa ? "Sending..." : "Send Bill"}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyTextBill}
                className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
                title="Copy formatted WhatsApp text receipt"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            {waStatus && (
              <div className={`flex items-center justify-between p-2 rounded-xl text-[11px] font-bold ${
                waStatus.success ? 'bg-emerald-100/90 text-emerald-900' : 'bg-amber-100/90 text-amber-900'
              }`}>
                <span>{waStatus.message}</span>
                {waStatus.link && (
                  <a
                    href={waStatus.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-800 underline hover:text-emerald-950 font-bold"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Printable Thermal Receipt Preview Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 text-slate-900 font-mono text-xs shadow-inner">
            <div id="thermal-receipt-printable" className="w-full bg-white p-3 sm:p-4 rounded-xl border border-slate-200/60 shadow-xs">
              
              {/* Store Branding */}
              <div className="text-center border-b border-dashed border-slate-400 pb-3">
                <div className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900">
                  {tenant?.settings?.receipt_header || tenant?.name || "VOGUE LIFESTYLE"}
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                  {tenant?.settings?.receipt_tagline || selectedBranch?.name || "Showroom"}
                </div>
                <div className="text-[10px] text-slate-600">
                  {tenant?.settings?.receipt_address || selectedBranch?.address || ""}
                </div>
                <div className="text-[10px] text-slate-600">
                  Tel: {tenant?.settings?.receipt_phone || selectedBranch?.phone || tenant?.phone || "+8801811223344"}
                </div>
                {tenant?.settings?.receipt_vat_no && (
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                    {tenant.settings.receipt_vat_no}
                  </div>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Invoice: <strong>{order.invoice_number}</strong></span>
                  <span>Date: {new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier: {order.cashier_name}</span>
                  <span>Time: {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {tenant?.settings?.receipt_show_salesman !== false && order.salesman_name && (
                  <div className="flex justify-between">
                    <span>Sales Rep: <strong>{order.salesman_name}</strong></span>
                  </div>
                )}
                {whatsappPhone && (
                  <div className="flex justify-between">
                    <span>Customer: {order.customer_name || 'Walk-in'} ({whatsappPhone})</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[10px] uppercase pb-1 border-b border-slate-300">
                  <span className="w-1/2">Item</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Total</span>
                </div>
                
                <div className="divide-y divide-slate-100 mt-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-1 text-[10px]">
                      <div className="font-bold text-slate-900">{item.product_name}</div>
                      <div className="flex justify-between text-slate-600">
                        <span>{item.size ? `Size: ${item.size}` : ''} {item.color ? `| ${item.color}` : ''}</span>
                        <span>{item.quantity} × ৳{item.unit_price}</span>
                        <span className="font-bold text-slate-900">৳{item.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>৳{order.subtotal?.toLocaleString()}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>-৳{order.discount_amount?.toLocaleString()}</span>
                  </div>
                )}
                {tenant?.settings?.receipt_show_tax !== false && order.tax_vat_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT / Tax (5%):</span>
                    <span>+৳{order.tax_vat_amount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                  <span>NET PAYABLE:</span>
                  <span>৳{order.total_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>Paid Amount:</span>
                  <span>৳{order.paid_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-700 font-bold">
                  <span>Change Return:</span>
                  <span>৳{order.change_due?.toLocaleString()}</span>
                </div>
              </div>

              {/* Exchange Policy & Custom Notes */}
              <div className="pt-2 text-center text-[9px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-900">
                  {tenant?.settings?.receipt_exchange_policy || "*** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***"}
                </div>
                <div>
                  {tenant?.settings?.receipt_footer_note || `Thank you for shopping with ${tenant?.name || 'us'}!`}
                </div>
                
                {tenant?.settings?.receipt_show_barcode !== false && (
                  <div className="pt-2 flex flex-col items-center justify-center">
                    <div className="tracking-[3px] font-mono text-[10px] font-bold text-slate-900">
                      *{order.invoice_number}*
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-white shrink-0 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 press-tactile transition-all"
          >
            Done (New Bill)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 press-tactile transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
