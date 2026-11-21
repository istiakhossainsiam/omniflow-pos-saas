import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productApi, requisitionApi } from '../../services/api';
import { 
  Layers, 
  Package, 
  Printer, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Clock, 
  RefreshCw, 
  Sparkles,
  Barcode,
  ArrowRight
} from 'lucide-react';
import InventoryMatrixView from '../InventoryMatrix/InventoryMatrixView';

export default function InventoryDashboardView({ onNavigate }) {
  const { user, selectedBranch } = useAuth();
  const [products, setProducts] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dhakaTime, setDhakaTime] = useState('');

  // Live Dhaka Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);
      setDhakaTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [selectedBranch]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [prods, reqs] = await Promise.all([
        productApi.list(),
        requisitionApi.list()
      ]);
      setProducts(prods);
      setRequisitions(reqs);
    } catch (err) {
      console.error("Failed to load inventory dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
  const pendingRequisitions = requisitions.filter(r => r.status === 'PENDING');

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Warehouse & Inventory Matrix Hub
            </h1>
            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-amber-200">
              INVENTORY CLERK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Size/Color Variants, Barcode & QR Label Batch Studio, Stock Requisitions Fulfillment
          </p>
        </div>

        {/* Live Dhaka Time & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs font-mono font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{dhakaTime || 'Asia/Dhaka (GMT+6)'}</span>
          </div>

          <button
            onClick={loadInventoryData}
            title="Refresh Inventory Data"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Products */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Products</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {products.length}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-700">
              {totalVariants} Size-Color SKUs
            </div>
          </div>
        </div>

        {/* Pending Requisitions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Requisitions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {pendingRequisitions.length} Pending
            </div>
            <div className="mt-1 text-[11px] font-semibold text-amber-700">
              Awaiting Dispatch
            </div>
          </div>
        </div>

        {/* Barcode & Label Ready */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Label Generator</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
              <Barcode className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              Ready
            </div>
            <div className="mt-1 text-[11px] font-semibold text-blue-700">
              Code128 & QR Studio
            </div>
          </div>
        </div>

        {/* Stock Location */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Warehouse</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-black text-slate-900 truncate">
              {selectedBranch?.name}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-purple-700 font-mono">
              {selectedBranch?.code}
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Matrix & Hangtag Studio */}
      <div className="mt-5">
        <InventoryMatrixView />
      </div>

    </div>
  );
}
