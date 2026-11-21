import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ScanLine, 
  Camera,
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  PauseCircle, 
  PlayCircle, 
  Percent, 
  Layers, 
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Pencil,
  RotateCcw,
  Lock,
  BookOpen,
  Truck,
  Crown,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { productApi, posApi } from '../../services/api';
import VariantSelectorModal from './VariantSelectorModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import SplitPaymentModal from './SplitPaymentModal';
import ThermalReceiptModal from './ThermalReceiptModal';
import ProductEditModal from './ProductEditModal';
import ExchangeReturnModal from './ExchangeReturnModal';
import RegisterDayClosingModal from './RegisterDayClosingModal';
import CustomerDueLedgerModal from './CustomerDueLedgerModal';
import StockTransferChallanModal from '../Requisitions/StockTransferChallanModal';
import OwnerDailyDigestModal from '../Reports/OwnerDailyDigestModal';
import SpotlightCard from '../common/SpotlightCard';
import UiverseButton from '../common/UiverseButton';
import StatusBadge from '../common/StatusBadge';

export default function FastPOSView() {
  const { tenant, selectedBranch, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  // Parked (Held) orders
  const [parkedOrders, setParkedOrders] = useState([]);
  const [showParkedDrawer, setShowParkedDrawer] = useState(false);

  // Modals
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCartItem, setEditingCartItem] = useState(null);

  // 5 New Retail Feature Modals
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showDayCloseModal, setShowDayCloseModal] = useState(false);
  const [showDueLedgerModal, setShowDueLedgerModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOwnerDigestModal, setShowOwnerDigestModal] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  useEffect(() => {
    loadData();
    loadParkedOrders();
  }, [selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        productApi.list(),
        productApi.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load POS catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadParkedOrders = async () => {
    try {
      const parked = await posApi.getParkedOrders(selectedBranch?.id);
      setParkedOrders(parked);
    } catch (err) {
      console.warn("Could not fetch parked bills:", err);
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBarcodeScan = async (scannedBarcode) => {
    try {
      const cleanCode = String(scannedBarcode).trim();
      setSearchQuery(cleanCode);

      const item = await posApi.scanBarcode(cleanCode, selectedBranch?.id);
      if (item) {
        addToCartDirect({
          id: item.variant_id,
          sku: item.sku,
          barcode: item.barcode,
          size: item.size,
          color: item.color,
          selling_price: item.selling_price,
          cost_price: item.cost_price,
          product_name: item.product_name
        }, 1, item.product_name);

        showToast(`✓ Added: ${item.product_name} (${item.size || ''}) - ৳${item.selling_price}`);
      }
    } catch (err) {
      showToast(err.message || `No item matched "${scannedBarcode}"`, 'error');
    }
  };

  const handleAddToCartFromModal = (variant, qty, productName) => {
    addToCartDirect(variant, qty, productName);
    showToast(`Added: ${productName} (${variant.size || ''})`);
  };

  const addToCartDirect = (variant, qty = 1, productName = '') => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(item => item.variant_id === variant.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += qty;
        return next;
      }
      return [
        ...prev,
        {
          variant_id: variant.id,
          product_name: productName || variant.product_name || 'Product',
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          barcode: variant.barcode,
          unit_price: variant.selling_price,
          cost_price: variant.cost_price || 0,
          quantity: qty,
          discount: 0
        }
      ];
    });
  };

  const updateQuantity = (variantId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.variant_id === variantId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const setItemDirectQuantity = (variantId, qty) => {
    const val = parseInt(qty);
    if (isNaN(val) || val <= 0) {
      removeCartItem(variantId);
    } else {
      setCartItems(prev => prev.map(it => it.variant_id === variantId ? { ...it, quantity: val } : it));
    }
  };

  const removeCartItem = (variantId) => {
    setCartItems(prev => prev.filter(item => item.variant_id !== variantId));
  };

  const updateCartItemPrice = (variantId, newPrice) => {
    const val = parseFloat(newPrice);
    if (!isNaN(val) && val >= 0) {
      setCartItems(prev => prev.map(it => it.variant_id === variantId ? { ...it, unit_price: val } : it));
    }
  };

  const updateCartItemDiscount = (variantId, disc) => {
    const val = parseFloat(disc);
    if (!isNaN(val) && val >= 0) {
      setCartItems(prev => prev.map(it => it.variant_id === variantId ? { ...it, discount: val } : it));
    }
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm("Clear all items from the current cart?")) {
      setCartItems([]);
      setDiscountAmount(0);
    }
  };

  const isVatEnabled = tenant?.settings?.is_vat_enabled !== false;
  const vatRate = isVatEnabled ? (parseFloat(tenant?.settings?.vat_percentage) || 5) : 0;
  const subtotal = cartItems.reduce((sum, it) => sum + (it.unit_price * it.quantity - it.discount), 0);
  const taxAmount = isVatEnabled ? Math.round((subtotal * vatRate) / 100) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
  const totalItemsCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  const handleParkOrder = async () => {
    if (cartItems.length === 0) return;
    try {
      const note = prompt("Enter note for held bill (e.g. Customer matching scarf):") || "Customer on floor";
      await posApi.createOrder({
        branch_id: selectedBranch?.id,
        items: cartItems.map(it => ({
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount
        })),
        discount_amount: discountAmount,
        tax_vat_amount: taxAmount,
        payments: [{ payment_method: 'CASH', amount: totalAmount }],
        is_parked: true,
        parked_note: note
      });
      clearCart();
      loadParkedOrders();
      showToast("Order held successfully!");
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResumeParked = (order) => {
    const items = order.items.map(it => ({
      variant_id: it.variant_id || it.id,
      product_name: it.product_name,
      size: it.size,
      color: it.color,
      sku: it.sku,
      barcode: it.barcode,
      unit_price: it.unit_price,
      cost_price: 0,
      quantity: it.quantity,
      discount: it.discount || 0
    }));
    setCartItems(items);
    setDiscountAmount(order.discount_amount || 0);
    setShowParkedDrawer(false);
    showToast(`Resumed: ${order.invoice_number}`);
  };

  const handleCompleteSale = async (paymentData) => {
    try {
      const orderPayload = {
        branch_id: selectedBranch?.id,
        salesman_id: paymentData.salesman_id,
        customer_phone: paymentData.customer_phone,
        customer_name: paymentData.customer_name,
        items: cartItems.map(it => ({
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
          barcode: it.barcode,
          sku: it.sku
        })),
        discount_amount: discountAmount,
        tax_vat_amount: taxAmount,
        payments: paymentData.payments,
        is_parked: false
      };

      const result = await posApi.createOrder(orderPayload);
      setCompletedOrder(result);
      setShowPaymentModal(false);
      clearCart();
      loadData();
    } catch (err) {
      alert(err.message || "Failed to complete sale");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.some(v => v.barcode.includes(searchQuery) || v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-16 sm:top-20 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-4 ${
          notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Action Bar: Search & Barcode Scan with UIverse styling */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        
        {/* Search Input with UIverse Glow Focus */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search garment, style, SKU, or type barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleBarcodeScan(searchQuery.trim());
              }
            }}
            className="w-full rounded-2xl border border-slate-200/90 bg-white/95 pl-10 pr-20 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="hidden md:inline-block text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
              Enter ↵
            </span>
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              title="Snap Tag Photo & Auto-Read (Camera OCR)"
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all shadow-xs"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Scan Button & Parked Bills Button (UIverse Tactile Buttons) */}
        <div className="flex items-center gap-2">
          <UiverseButton
            onClick={() => setShowScannerModal(true)}
            variant="glow"
            size="md"
            icon={ScanLine}
            className="flex-1 sm:flex-none shadow-emerald-600/25"
          >
            Scan Barcode
          </UiverseButton>

          <button
            onClick={() => setShowParkedDrawer(true)}
            className="relative flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <PauseCircle className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Held Bills</span>
            {parkedOrders.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                {parkedOrders.length}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Category Filter Pills & Quick Retail Workflow Actions (Touch-friendly & no-scrollbar) */}
      <div className="mt-3.5 flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 select-none ${
              selectedCategory === null
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white/90 border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 select-none ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white/90 border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Clean Tools & Workflows Dropdown */}
        <div className="relative shrink-0 z-20">
          <button
            onClick={() => setShowToolsDropdown(!showToolsDropdown)}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <span>POS Tools</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showToolsDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showToolsDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowToolsDropdown(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-40 text-xs">
                <button
                  onClick={() => { setShowExchangeModal(true); setShowToolsDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                >
                  <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  <span>Size Exchange</span>
                </button>
                <button
                  onClick={() => { setShowDayCloseModal(true); setShowToolsDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                >
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span>Day Closing (Z-Report)</span>
                </button>
                <button
                  onClick={() => { setShowDueLedgerModal(true); setShowToolsDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                >
                  <BookOpen className="h-4 w-4 text-slate-500" />
                  <span>Customer Due Khata</span>
                </button>
                <button
                  onClick={() => { setShowTransferModal(true); setShowToolsDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                >
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span>Transfer Challan</span>
                </button>
                <button
                  onClick={() => { setShowOwnerDigestModal(true); setShowToolsDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                >
                  <Crown className="h-4 w-4 text-slate-500" />
                  <span>Daily Digest</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Products Left + Cart Right on Desktop */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Product Cards Catalog (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400 text-xs">Loading catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs shadow-sm">
              No products found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((prod) => {
                const totalBranchStock = prod.variants.reduce((sum, v) => {
                  const bStock = v.branch_stocks?.find(s => s.branch_id === selectedBranch?.id)?.quantity ?? v.total_stock;
                  return sum + bStock;
                }, 0);

                const minPrice = Math.min(...prod.variants.map(v => v.selling_price));
                const maxPrice = Math.max(...prod.variants.map(v => v.selling_price));

                const isOutOfStock = totalBranchStock <= 0;
                const isLowStock = totalBranchStock > 0 && totalBranchStock <= 5;

                return (
                  <SpotlightCard
                    key={prod.id}
                    onClick={() => setActiveModalProduct(prod)}
                    spotlightColor="rgba(16, 185, 129, 0.15)"
                    borderColor="rgba(16, 185, 129, 0.3)"
                    className="group relative flex flex-col justify-between !rounded-3xl border border-slate-200/90 bg-white p-4 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-600 uppercase tracking-wider font-mono">
                          {prod.brand || 'Retail'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isOutOfStock 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : isLowStock 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isOutOfStock ? 'Sold Out' : `${totalBranchStock} in stock`}
                          </span>

                          {['STORE_OWNER', 'SUPER_ADMIN', 'STORE_MANAGER'].includes(user?.role) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduct(prod);
                              }}
                              title="Edit or Delete Product"
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="mt-2.5 text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug font-display">
                        {prod.name}
                      </h4>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {prod.variants.slice(0, 4).map(v => (
                          <span key={v.id} className="rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 font-mono">
                            {v.size || 'STD'}
                          </span>
                        ))}
                        {prod.variants.length > 4 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400 font-bold font-mono">
                            +{prod.variants.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="text-sm font-black text-slate-900 tabular-nums font-display">
                        {minPrice === maxPrice ? `৳ ${minPrice.toLocaleString()}` : `৳ ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`}
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                      </span>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Sticky Cart / Billing Panel (4 cols) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Cart Items ({totalItemsCount})</h3>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="mt-3 max-h-[340px] overflow-y-auto space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Cart is empty.<br />Scan barcode or tap a product card.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.variant_id} className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 space-y-1.5 hover:border-slate-300 transition-all">
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.product_name}</div>
                        <div className="text-[10px] text-emerald-700 font-mono font-bold">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? `| ${item.color}` : ''} • SKU: {item.sku}
                        </div>
                      </div>

                      {/* 1-Click Delete from Cart */}
                      <button
                        onClick={() => removeCartItem(item.variant_id)}
                        title="Remove from Cart"
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-xs">
                      
                      {/* Price & Discount Controls */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[10px] font-semibold">Unit ৳:</span>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateCartItemPrice(item.variant_id, e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                          title="Click to edit unit price"
                        />
                      </div>

                      {/* Quantity Stepper with Direct Input */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.variant_id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setItemDirectQuantity(item.variant_id, e.target.value)}
                          className="w-8 text-center text-xs font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-emerald-600 focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.variant_id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="font-black text-xs text-slate-900">
                        {((item.unit_price * item.quantity) - (item.discount || 0)).toLocaleString()} ৳
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Billing Summary & Discounts */}
            {cartItems.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 text-xs">
                
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{subtotal.toLocaleString()} ৳</span>
                </div>

                {/* Quick Discount Input */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Percent className="h-3.5 w-3.5 text-amber-500" />
                    <span>Discount (৳):</span>
                  </span>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    placeholder="0"
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs text-amber-600 font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {isVatEnabled && vatRate > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>VAT / Tax ({vatRate}%):</span>
                    <span className="font-semibold text-slate-700">+{taxAmount.toLocaleString()} ৳</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-black">
                  <span className="text-slate-900">Payable Total:</span>
                  <span className="text-emerald-700 text-lg">{totalAmount.toLocaleString()} ৳</span>
                </div>

                {/* Action Buttons: Hold & Pay */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleParkOrder}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <PauseCircle className="h-4 w-4 text-amber-600" />
                    <span>Hold Bill</span>
                  </button>

                  <UiverseButton
                    variant="glow"
                    size="md"
                    onClick={() => setShowPaymentModal(true)}
                    className="flex-1 py-3 px-4 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30"
                  >
                    Checkout & Pay ({totalAmount.toLocaleString()} ৳)
                  </UiverseButton>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Mobile Floating Cart Action Pill (UIverse Frosted Cyber Dock) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 left-3 right-3 z-30 block lg:hidden modal-spring-entrance">
          <div className="flex items-center justify-between rounded-3xl bg-slate-950/95 border border-white/10 p-3.5 shadow-2xl shadow-black/60 text-white backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 font-black text-xs text-white shadow-md shadow-emerald-500/30">
                {totalItemsCount}
              </span>
              <div>
                <div className="text-sm font-black text-emerald-400">{totalAmount.toLocaleString()} ৳</div>
                <div className="text-[10px] text-slate-400">Ready for Checkout</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleParkOrder}
                className="rounded-2xl bg-white/10 p-2.5 text-xs font-bold hover:bg-white/20 active:scale-95 transition-all text-amber-400"
                title="Hold Bill"
              >
                <PauseCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Pay Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parked Bills Drawer Modal */}
      {showParkedDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Held / Parked Bills ({parkedOrders.length})</h3>
              </div>
              <button onClick={() => setShowParkedDrawer(false)} className="text-slate-400 hover:text-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 max-h-[350px] overflow-y-auto space-y-2">
              {parkedOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No held bills currently.</div>
              ) : (
                parkedOrders.map((p) => (
                  <div key={p.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.invoice_number}</div>
                      <div className="text-[10px] text-amber-600 mt-0.5">Note: {p.held_note || 'Customer browsing'}</div>
                      <div className="text-xs font-black text-emerald-700 mt-1">{p.total_amount?.toLocaleString()} ৳</div>
                    </div>
                    <button
                      onClick={() => handleResumeParked(p)}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>Resume</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModalProduct && (
        <VariantSelectorModal
          product={activeModalProduct}
          selectedBranch={selectedBranch}
          onAddToCart={handleAddToCartFromModal}
          onClose={() => setActiveModalProduct(null)}
        />
      )}

      {showScannerModal && (
        <BarcodeScannerModal
          onScanSuccess={handleBarcodeScan}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {showPaymentModal && (
        <SplitPaymentModal
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeCartItem}
          onUpdateItemPrice={updateCartItemPrice}
          onUpdateItemDiscount={updateCartItemDiscount}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          subtotal={subtotal}
          totalAmount={totalAmount}
          selectedBranch={selectedBranch}
          onCompleteSale={handleCompleteSale}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {completedOrder && (
        <ThermalReceiptModal
          order={completedOrder}
          tenant={tenant}
          selectedBranch={selectedBranch}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          selectedBranch={selectedBranch}
          onSaved={() => {
            loadData();
            setEditingProduct(null);
          }}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* 5 Retail Modals */}
      {showExchangeModal && (
        <ExchangeReturnModal
          branchId={selectedBranch?.id}
          tenant={tenant}
          onClose={() => setShowExchangeModal(false)}
          onExchangeCompleted={() => loadData()}
        />
      )}

      {showDayCloseModal && (
        <RegisterDayClosingModal
          branchId={selectedBranch?.id}
          tenant={tenant}
          user={user}
          onClose={() => setShowDayCloseModal(false)}
        />
      )}

      {showDueLedgerModal && (
        <CustomerDueLedgerModal
          branchId={selectedBranch?.id}
          tenant={tenant}
          onClose={() => setShowDueLedgerModal(false)}
        />
      )}

      {showTransferModal && (
        <StockTransferChallanModal
          currentBranchId={selectedBranch?.id}
          tenant={tenant}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {showOwnerDigestModal && (
        <OwnerDailyDigestModal
          branchId={selectedBranch?.id}
          tenant={tenant}
          onClose={() => setShowOwnerDigestModal(false)}
        />
      )}

    </div>
  );
}
