import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Crown, 
  Send, 
  Copy, 
  Check, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Award, 
  ShoppingBag, 
  RefreshCw, 
  Smartphone,
  ExternalLink,
  Building2
} from 'lucide-react';
import { reportApi } from '../../services/api';

export default function OwnerDailyDigestModal({ branchId, tenant, onClose }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [digestData, setDigestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDigest();
  }, [selectedDate, branchId]);

  const loadDigest = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getDailyDigest(selectedDate, branchId);
      setDigestData(data);
    } catch (err) {
      console.error("Failed to load daily digest:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = async () => {
    if (digestData?.whatsapp_digest_text) {
      await navigator.clipboard.writeText(digestData.whatsapp_digest_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!digestData?.whatsapp_digest_text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(digestData.whatsapp_digest_text)}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                Owner's Nightly Business Summary & WhatsApp Digest
              </h3>
              <p className="text-[11px] text-slate-500">
                1-Click executive daily revenue, profit margin, top items, and WhatsApp briefing
              </p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Date Selector */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span>Select Performance Date:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 focus:outline-none"
              />
              <button
                onClick={loadDigest}
                disabled={loading}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
              <span>Generating executive summary...</span>
            </div>
          ) : !digestData ? (
            <div className="p-8 text-center text-slate-400 text-xs">Failed to load business digest.</div>
          ) : (
            <>
              {/* High-Level Financial Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Gross Sales</div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-emerald-950">
                    ৳{Math.round(digestData.total_sales).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">{digestData.total_orders} Orders</div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-blue-800 uppercase">Est. Gross Profit</div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-blue-950">
                    ৳{Math.round(digestData.estimated_profit).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-0.5">{digestData.profit_margin_pct}% Margin</div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-purple-800 uppercase">Avg. Basket Size</div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-purple-950">
                    ৳{Math.round(digestData.avg_ticket_size).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-purple-700 mt-0.5">Per receipt</div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-800 uppercase">Cash Collected</div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-amber-950">
                    ৳{Math.round(digestData.payment_breakdown?.cash || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">In register drawer</div>
                </div>
              </div>

              {/* Formatted WhatsApp Briefing Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-4 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Smartphone className="h-4 w-4" />
                    <span>WhatsApp Formatted Business Memo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyText}
                      className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copied!" : "Copy Text"}</span>
                    </button>
                    <button
                      onClick={handleOpenWhatsApp}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send via WhatsApp</span>
                    </button>
                  </div>
                </div>

                <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {digestData.whatsapp_digest_text}
                </pre>
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
