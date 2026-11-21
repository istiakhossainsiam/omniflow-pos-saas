import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Layers, 
  Plus, 
  Printer, 
  Search, 
  Barcode, 
  Sparkles, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  CheckSquare, 
  Square, 
  Pencil, 
  Store, 
  Globe, 
  Package, 
  X,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { productApi } from '../../services/api';
import MatrixCreatorModal from './MatrixCreatorModal';
import ProductEditModal from '../FastPOS/ProductEditModal';

export default function InventoryMatrixView() {
  const { tenant, branches = [], selectedBranch, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVariantsForPrint, setSelectedVariantsForPrint] = useState([]);
  const [labelCodeMode, setLabelCodeMode] = useState('dual'); // 'dual' | 'barcode' | 'qr'
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedShowroomFilter, setSelectedShowroomFilter] = useState('ALL'); // 'ALL' | branch_id
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [selectedBranch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        productApi.list(),
        productApi.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
      if (prods.length > 0 && !expandedProductId) {
        setExpandedProductId(prods[0].id);
      }
    } catch (err) {
      console.error("Failed to load inventory matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute stock for product based on active showroom filter
  const getProductStock = (prod, showroomId = selectedShowroomFilter) => {
    if (showroomId === 'ALL') {
      return prod.variants?.reduce((sum, v) => sum + (v.total_stock || 0), 0) || 0;
    }
    return prod.variants?.reduce((sum, v) => {
      const bStock = (v.branch_stocks || []).find(s => s.branch_id === showroomId);
      return sum + (bStock ? bStock.quantity : 0);
    }, 0) || 0;
  };

  // Helper to compute stock for a specific variant based on active showroom filter
  const getVariantStock = (v, showroomId = selectedShowroomFilter) => {
    if (showroomId === 'ALL') {
      return v.total_stock || 0;
    }
    const bStock = (v.branch_stocks || []).find(s => s.branch_id === showroomId);
    return bStock ? bStock.quantity : 0;
  };

  // Helper to compute total showroom-wise inventory across all products
  const getShowroomTotalInventory = (branchId) => {
    if (branchId === 'ALL') {
      return products.reduce((acc, p) => acc + getProductStock(p, 'ALL'), 0);
    }
    return products.reduce((acc, p) => acc + getProductStock(p, branchId), 0);
  };

  const togglePrintVariant = (v, prod) => {
    if (selectedVariantsForPrint.some(item => item.id === v.id)) {
      setSelectedVariantsForPrint(prev => prev.filter(item => item.id !== v.id));
    } else {
      setSelectedVariantsForPrint(prev => [
        ...prev, 
        { ...v, product_name: prod.name, brand: prod.brand, fabric: prod.fabric }
      ]);
    }
  };

  const handlePrintLabels = () => {
    if (selectedVariantsForPrint.length === 0) {
      alert("Please select at least 1 variant to print hangtag barcode labels.");
      return;
    }
    setShowPrintModal(true);
  };

  const filteredProducts = products.filter(p => {
    return !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase()) || v.barcode.includes(searchQuery));
  });

  const activeShowroomName = selectedShowroomFilter === 'ALL' 
    ? 'All Outlets Combined' 
    : (branches.find(b => b.id === selectedShowroomFilter)?.name || 'Selected Showroom');

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-28 md:pb-12 animate-entrance">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Clothing Matrix & Hangtag Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Size & Color Matrix Variants, Multi-Showroom Stock Tracking & Barcode Hangtag Printing
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedVariantsForPrint.length > 0 && (
            <button
              onClick={handlePrintLabels}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-emerald-600 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 press-tactile transition-all shadow-sm"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>Print {selectedVariantsForPrint.length} Hangtags</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 press-tactile transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Clothing Matrix</span>
          </button>
        </div>
      </div>

      {/* Showroom-wise Multi-Branch Inventory Filter Tabs */}
      {branches && branches.length > 0 && (
        <div className="mt-4 animate-entrance-stagger-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              <span>Filter Inventory by Showroom / Warehouse:</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Showing: <strong className="text-slate-900">{activeShowroomName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {/* All Showrooms Combined Button */}
            <button
              type="button"
              onClick={() => setSelectedShowroomFilter('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all press-tactile shrink-0 ${
                selectedShowroomFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>All Outlets</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedShowroomFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {getShowroomTotalInventory('ALL')} pcs
              </span>
            </button>

            {/* Individual Branch Buttons */}
            {branches.map((b) => {
              const bStockCount = getShowroomTotalInventory(b.id);
              const isSelected = selectedShowroomFilter === b.id;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedShowroomFilter(b.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all press-tactile shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{b.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {bStockCount} pcs
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Overview Stats Bar */}
      <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-entrance-stagger-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Design name, SKU, or Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 font-medium">
          <span className="bg-slate-100/80 px-2.5 py-1 rounded-xl font-bold text-slate-700 border border-slate-200/60">
            {filteredProducts.length} Clothing Designs
          </span>
          <span className="bg-emerald-50 px-2.5 py-1 rounded-xl font-bold text-emerald-800 border border-emerald-200/60">
            {filteredProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0)} Matrix SKUs
          </span>
        </div>
      </div>

      {/* Product List with Expandable Matrix Variants */}
      <div className="mt-4 space-y-3 animate-entrance-stagger-2">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Loading matrix products and showroom inventory...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs shadow-sm">
            <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">No Clothing Products Found</div>
            <p className="text-slate-400 mt-1">Try changing search query or click "New Clothing Matrix" to create one.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isExpanded = expandedProductId === prod.id;
            const stockInSelectedShowroom = getProductStock(prod, selectedShowroomFilter);
            const totalStockAcrossAll = getProductStock(prod, 'ALL');

            return (
              <div 
                key={prod.id} 
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md card-hover-lift transition-all"
              >
                {/* Product Header Row (Mobile & Desktop Modern Card) */}
                <div 
                  onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                  className="flex items-start sm:items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/70 gap-3 spring-smooth"
                >
                  {/* Left: Visual & Product Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="h-13 w-13 sm:h-15 sm:w-15 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0 bg-slate-50"
                      />
                    ) : (
                      <div className="flex h-13 w-13 sm:h-15 sm:w-15 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                        <Tag className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                          {prod.name}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-600 uppercase">
                          {prod.brand || 'Retail'}
                        </span>
                        {prod.image_url && (
                          <span className="rounded-full bg-emerald-100/70 text-emerald-800 font-semibold px-1.5 py-0.2 text-[8px]">
                            WEBP
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                        <span>{prod.category_name || 'Apparel'}</span>
                        <span>•</span>
                        <span>{prod.fabric || 'Cotton'}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">{prod.variants?.length || 0} Matrix SKUs</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing, Stock & Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        {prod.base_selling_price.toLocaleString()} ৳
                      </div>
                      
                      {/* Showroom-Specific Stock Tag */}
                      <div className="mt-0.5">
                        {selectedShowroomFilter === 'ALL' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Total: {totalStockAcrossAll} pcs
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            stockInSelectedShowroom > 0 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            {stockInSelectedShowroom} pcs in {branches.find(b => b.id === selectedShowroomFilter)?.code || 'Showroom'}
                          </span>
                        )}
                      </div>
                    </div>

                    {['STORE_OWNER', 'SUPER_ADMIN', 'STORE_MANAGER'].includes(user?.role) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(prod);
                        }}
                        title="Edit Product Details"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800 transition-colors press-tactile"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className={`transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Expanded Matrix Variants Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
                    
                    {/* Header bar inside expanded section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                          Matrix Breakdown ({prod.variants?.length} SKUs)
                        </span>
                        {selectedShowroomFilter !== 'ALL' && (
                          <span className="rounded-md bg-emerald-100/80 text-emerald-900 text-[10px] font-bold px-2 py-0.5">
                            Active Showroom: {activeShowroomName}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = prod.variants.every(v => selectedVariantsForPrint.some(x => x.id === v.id));
                          if (allSelected) {
                            setSelectedVariantsForPrint(prev => prev.filter(x => !prod.variants.some(v => v.id === x.id)));
                          } else {
                            const newToAdd = prod.variants.filter(v => !selectedVariantsForPrint.some(x => x.id === v.id));
                            setSelectedVariantsForPrint(prev => [
                              ...prev, 
                              ...newToAdd.map(v => ({ ...v, product_name: prod.name, brand: prod.brand, fabric: prod.fabric }))
                            ]);
                          }
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold self-start sm:self-auto hover:underline"
                      >
                        {prod.variants.every(v => selectedVariantsForPrint.some(x => x.id === v.id))
                          ? 'Deselect All Hangtags'
                          : 'Select All for Hangtag Print'}
                      </button>
                    </div>

                    {/* 1. Mobile-First Card View (Screens < 768px) */}
                    <div className="block md:hidden space-y-2">
                      {prod.variants?.map((v) => {
                        const isPrintSelected = selectedVariantsForPrint.some(item => item.id === v.id);
                        const vShowroomStock = getVariantStock(v, selectedShowroomFilter);
                        const allShowroomStocks = v.branch_stocks || [];

                        return (
                          <div 
                            key={v.id} 
                            className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => togglePrintVariant(v, prod)} 
                                  className="text-slate-400 hover:text-emerald-600 p-0.5 press-tactile"
                                >
                                  {isPrintSelected ? (
                                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Square className="h-5 w-5 text-slate-300" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded-lg bg-emerald-100/80 text-emerald-900 font-black px-2 py-0.5 text-xs">
                                      Size: {v.size || 'STD'}
                                    </span>
                                    <span className="rounded-lg bg-slate-100 text-slate-800 font-bold px-2 py-0.5 text-xs">
                                      {v.color || 'Standard'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900">{v.selling_price} ৳</span>
                                {v.mrp > v.selling_price && (
                                  <div className="text-[10px] text-slate-400 line-through">MRP: {v.mrp} ৳</div>
                                )}
                              </div>
                            </div>

                            {/* Barcode & SKU info */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100">
                              <div>SKU: <strong className="text-slate-800">{v.sku}</strong></div>
                              <div>Barcode: <strong className="text-emerald-700">{v.barcode}</strong></div>
                            </div>

                            {/* Showroom Stock Breakdown Pills */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-semibold">
                                  {selectedShowroomFilter === 'ALL' ? 'Total Combined Stock:' : `${activeShowroomName}:`}
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${
                                  vShowroomStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {vShowroomStock} pcs
                                </span>
                              </div>

                              {/* Other Outlets stock tags if viewing single showroom or multiple showrooms */}
                              {allShowroomStocks.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                  <span className="text-[10px] text-slate-400 font-bold">Outlet Breakdown:</span>
                                  {allShowroomStocks.map(s => (
                                    <span 
                                      key={s.branch_id}
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                        selectedShowroomFilter === s.branch_id 
                                          ? 'bg-emerald-600 text-white' 
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {s.branch_code}: {s.quantity}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. Desktop High-Density Table View (Screens >= 768px) */}
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase">
                            <th className="py-2.5 px-3 w-8">Print</th>
                            <th className="py-2.5 px-3">Size</th>
                            <th className="py-2.5 px-3">Color</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Barcode</th>
                            <th className="py-2.5 px-3 text-right">Cost</th>
                            <th className="py-2.5 px-3 text-right">Selling</th>
                            <th className="py-2.5 px-3 text-center">
                              {selectedShowroomFilter === 'ALL' ? 'Total Stock' : activeShowroomName}
                            </th>
                            <th className="py-2.5 px-3 text-center">Showroom Inventory Breakdown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {prod.variants?.map((v) => {
                            const isPrintSelected = selectedVariantsForPrint.some(item => item.id === v.id);
                            const vStock = getVariantStock(v, selectedShowroomFilter);
                            const allStocks = v.branch_stocks || [];

                            return (
                              <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3">
                                  <button onClick={() => togglePrintVariant(v, prod)} className="text-slate-400 hover:text-emerald-600 press-tactile">
                                    {isPrintSelected ? (
                                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                      <Square className="h-4 w-4 text-slate-300" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 font-sans font-black text-slate-900">{v.size || 'STD'}</td>
                                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">{v.color || 'Standard'}</td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">{v.sku}</td>
                                <td className="py-2.5 px-3 text-emerald-700 font-bold">{v.barcode}</td>
                                <td className="py-2.5 px-3 text-right text-slate-500">{v.cost_price} ৳</td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900">{v.selling_price} ৳</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    vStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {vStock} pcs
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-[10px] font-sans text-slate-500">
                                  {allStocks.length > 0 ? (
                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                      {allStocks.map(s => (
                                        <span 
                                          key={s.branch_id}
                                          className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                                            selectedShowroomFilter === s.branch_id 
                                              ? 'bg-emerald-600 text-white' 
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {s.branch_code}: {s.quantity}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">No stock</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Hangtag Action Bar when Items Selected */}
      {selectedVariantsForPrint.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 inset-x-0 z-40 flex justify-center p-3 pointer-events-none animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-950/90 text-white px-4 py-2.5 shadow-2xl backdrop-blur-xl border border-slate-800 pointer-events-auto">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{selectedVariantsForPrint.length} SKUs Selected</span>
            </span>

            <div className="h-4 w-[1px] bg-slate-700" />

            <button
              onClick={handlePrintLabels}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 press-tactile transition-transform"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Hangtags</span>
            </button>

            <button
              onClick={() => setSelectedVariantsForPrint([])}
              className="text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <MatrixCreatorModal
          categories={categories}
          selectedBranch={selectedBranch}
          onSuccess={loadProducts}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Hangtag Barcode Labels Print Modal & Thermal Roll Studio */}
      {showPrintModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    Hangtag & Barcode Label Studio ({selectedVariantsForPrint.length} Items)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    High-Density Code128 & Instant Phone Camera QR Scannable Format
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)} 
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 press-tactile transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Label Customizer Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              {/* Code Mode Selector */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600">Scan Type:</span>
                <select
                  value={labelCodeMode}
                  onChange={(e) => setLabelCodeMode(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="dual">Dual (Barcode + Phone QR)</option>
                  <option value="barcode">1D Barcode (Code128)</option>
                  <option value="qr">2D QR Code (Fastest Phone Scan)</option>
                </select>
              </div>

              {/* Scannability Guarantee Badge */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-xs">
                <span>✓ Mobile Camera & Gun Scan Ready</span>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              <div id="hangtag-printable-roll" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedVariantsForPrint.map((v) => (
                  <div 
                    key={v.id} 
                    className="label-page-break rounded-2xl border-2 border-black bg-white p-3 text-center shadow-sm font-sans flex flex-col justify-between"
                    style={{ minHeight: '210px' }}
                  >
                    {/* Header: Brand & Garment Subtitle */}
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-black">
                        {tenant?.settings?.barcode_brand_title || v.brand || tenant?.name || 'VOGUE EXCLUSIVE'}
                      </div>
                      <div className="text-[9px] text-slate-700 font-semibold mt-0.5">
                        {tenant?.settings?.barcode_tagline || v.fabric || 'Premium Quality'}
                      </div>

                      <div className="my-1.5 border-t border-b border-dashed border-slate-400 py-1">
                        <div className="text-[10px] font-extrabold text-black line-clamp-1">
                          {v.product_name}
                        </div>
                        {tenant?.settings?.barcode_show_size_color !== false && (
                          <div className="text-[9px] font-mono font-black text-black mt-0.5">
                            {v.size ? `SIZE: ${v.size}` : ''} {v.color ? `• ${v.color}` : ''}
                          </div>
                        )}
                        <div className="text-[8px] text-slate-600 font-mono font-bold tracking-tight">
                          SKU: {v.sku}
                        </div>
                      </div>
                    </div>

                    {/* Barcode / QR Code Graphic Display */}
                    <div>
                      <div className="py-1 flex items-center justify-center gap-2">
                        {/* 1D Barcode */}
                        {(labelCodeMode === 'dual' || labelCodeMode === 'barcode') && (
                          <div className="flex-1 flex flex-col items-center justify-center">
                            {v.barcode_base64 ? (
                              <img 
                                src={v.barcode_base64} 
                                alt={v.barcode} 
                                className="h-10 w-full object-contain mx-auto"
                                style={{ imageRendering: '-webkit-optimize-contrast' }}
                              />
                            ) : (
                              <div className="flex items-center gap-[1px] h-8 justify-center">
                                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 3, 1].map((w, i) => (
                                  <span key={i} className="bg-black h-full inline-block" style={{ width: `${w}px` }} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2D QR Code */}
                        {(labelCodeMode === 'dual' || labelCodeMode === 'qr') && (
                          <div className="shrink-0 flex items-center justify-center">
                            {v.qr_code_base64 ? (
                              <img 
                                src={v.qr_code_base64} 
                                alt={v.barcode} 
                                className="h-11 w-11 object-contain border border-slate-200 rounded p-0.5"
                                style={{ imageRendering: '-webkit-optimize-contrast' }}
                              />
                            ) : (
                              <div className="h-11 w-11 bg-slate-100 flex items-center justify-center text-[9px] font-mono font-bold">
                                QR
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Clear Numeric Code */}
                      <div className="text-[10px] font-mono font-black tracking-widest text-black mt-0.5">
                        {v.barcode}
                      </div>

                      {/* Pricing Section */}
                      <div className="mt-1">
                        {tenant?.settings?.barcode_show_mrp !== false && v.mrp > v.selling_price && (
                          <span className="text-[9px] text-slate-500 line-through mr-1 font-bold">
                            MRP: {v.mrp} ৳
                          </span>
                        )}
                        {tenant?.settings?.barcode_show_price !== false && (
                          <span className="text-xs font-black text-black">
                            ৳ {v.selling_price}
                          </span>
                        )}
                      </div>

                      {/* Footer Hotline / Note */}
                      <div className="mt-1 text-[7px] text-slate-700 font-mono border-t border-slate-300 pt-0.5 font-bold">
                        {tenant?.settings?.barcode_footer_note || `Hotline: ${tenant?.phone || '01711-000111'}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-white shrink-0 flex gap-2.5">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 press-tactile transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 press-tactile transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print All ({selectedVariantsForPrint.length}) Labels Now</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          selectedBranch={selectedBranch}
          onSaved={() => {
            loadProducts();
            setEditingProduct(null);
          }}
          onClose={() => setEditingProduct(null)}
        />
      )}

    </div>
  );
}
