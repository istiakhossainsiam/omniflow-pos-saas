import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, X, ChevronRight, Phone, MessageCircle, 
  Truck, ShieldCheck, ArrowRight, CheckCircle2, Clock, 
  MapPin, CreditCard, Sparkles, AlertCircle, ArrowLeft,
  Filter, Eye, Plus, Minus, Share2, Copy, Check, ExternalLink
} from 'lucide-react';
import { ecommerceApi } from '../../services/api';

export default function EcommerceStorefront({ slug, onReturnToWorkstation, user }) {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');

  // Selected Product for Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Cart State (Persisted in localStorage for visitor convenience)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('omniflow_storefront_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingZone, setShippingZone] = useState('INSIDE_DHAKA');

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('Dhaka');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [transactionRef, setTransactionRef] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Order Success Modal
  const [completedOrder, setCompletedOrder] = useState(null);

  // Live Order Tracking Modal
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('omniflow_storefront_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load Storefront Data
  const loadStore = async () => {
    try {
      setLoading(true);
      setError(null);
      // If host is custom domain or slug provided
      const currentHost = window.location.hostname;
      const data = await ecommerceApi.getStorefront(slug, currentHost);
      setStoreData(data);
    } catch (err) {
      setError(err.message || 'Failed to load online store catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, [slug]);

  const settings = storeData?.ecommerce_settings || {};
  const deliveryCharge = shippingZone === 'INSIDE_DHAKA' 
    ? (settings.delivery_inside_dhaka ?? 60) 
    : (settings.delivery_outside_dhaka ?? 120);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const isFreeDelivery = settings.free_delivery_min_order && cartSubtotal >= settings.free_delivery_min_order;
  const finalDeliveryCharge = isFreeDelivery ? 0 : deliveryCharge;
  const cartGrandTotal = cartSubtotal + finalDeliveryCharge;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    let list = [...storeData.products];

    // Category
    if (selectedCategory !== 'ALL') {
      list = list.filter(p => p.category_id === selectedCategory || p.category_name === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    // Size Filter
    if (selectedSizeFilter !== 'ALL') {
      list = list.filter(p => p.variants?.some(v => v.size === selectedSizeFilter && v.is_in_stock));
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.base_selling_price - b.base_selling_price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.base_selling_price - a.base_selling_price);
    }

    return list;
  }, [storeData?.products, selectedCategory, searchQuery, selectedSizeFilter, sortBy]);

  // Open Product Modal
  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    if (product.variants?.length > 0) {
      // Pick first in-stock variant or first variant
      const firstInStock = product.variants.find(v => v.is_in_stock) || product.variants[0];
      setSelectedVariant(firstInStock);
    } else {
      setSelectedVariant(null);
    }
  };

  // Add to Cart
  const handleAddToCart = (product, variant, qty = 1) => {
    if (!variant) return;
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.variant_id === variant.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += qty;
        return next;
      } else {
        return [...prev, {
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_url,
          variant_id: variant.id,
          size: variant.size,
          color: variant.color,
          color_code: variant.color_code,
          unit_price: variant.selling_price,
          mrp: variant.mrp,
          quantity: qty,
          barcode: variant.barcode
        }];
      }
    });
    setIsCartOpen(true);
    if (selectedProduct) setSelectedProduct(null);
  };

  // Modify Cart Item Qty
  const handleUpdateCartQty = (variantId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.variant_id === variantId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove Item
  const handleRemoveCartItem = (variantId) => {
    setCart(prev => prev.filter(item => item.variant_id !== variantId));
  };

  // WhatsApp Order Link generator
  const getWhatsAppOrderUrl = (product, variant) => {
    const phone = settings.whatsapp_number ? settings.whatsapp_number.replace(/[^0-9]/g, '') : '8801711000111';
    let text = `Hello ${storeData?.name || 'Store'}! I would like to order:\n\n`;
    if (product && variant) {
      text += `*Product:* ${product.name}\n*Size:* ${variant.size || 'Standard'}\n*Color:* ${variant.color || 'Standard'}\n*Price:* ৳${variant.selling_price}\n`;
    } else if (cart.length > 0) {
      cart.forEach((it, idx) => {
        text += `${idx + 1}. ${it.product_name} (${it.size}/${it.color}) x ${it.quantity} = ৳${it.unit_price * it.quantity}\n`;
      });
      text += `\n*Subtotal:* ৳${cartSubtotal}\n*Delivery:* ৳${finalDeliveryCharge}\n*Total:* ৳${cartGrandTotal}\n`;
    }
    text += `\nPlease confirm availability and delivery to my address.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Place Online Order
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      alert('Please fill in your Name, Phone Number, and Delivery Address');
      return;
    }
    if (cart.length === 0) {
      alert('Your shopping bag is empty');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const payload = {
        tenant_slug_or_id: storeData.slug,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_zone: shippingZone,
        delivery_charge: finalDeliveryCharge,
        payment_method: paymentMethod,
        transaction_ref: transactionRef.trim() || null,
        customer_notes: customerNotes.trim() || null,
        items: cart.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await ecommerceApi.placeOrder(payload);
      setCompletedOrder({
        ...res,
        items: [...cart],
        shippingAddress: shippingAddress.trim(),
        customerPhone: customerPhone.trim()
      });
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Order Tracking
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    try {
      setIsTrackingLoading(true);
      const res = await ecommerceApi.trackOrder(trackQuery.trim());
      setTrackedOrders(res.orders || []);
    } catch (err) {
      alert('Tracking error: ' + err.message);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-emerald-400">
            Connecting to Storefront...
          </h2>
          <p className="text-xs text-slate-400">Loading catalog, styles & showroom stock</p>
        </div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-lg font-black text-white mb-2">Storefront Unavailable</h1>
          <p className="text-xs text-slate-400 mb-6">{error || 'This store is currently not taking orders.'}</p>
          {user && onReturnToWorkstation ? (
            <button
              onClick={onReturnToWorkstation}
              className="w-full py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all"
            >
              Return to Workstation
            </button>
          ) : (
            <a
              href="/"
              className="inline-block w-full py-2.5 rounded-2xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all"
            >
              Return to Homepage
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {settings.announcement_bar && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <span>{settings.announcement_bar}</span>
        </div>
      )}

      {/* 2. MAIN HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              {storeData.name ? storeData.name.charAt(0) : 'V'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  {storeData.name}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Live Store" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px] sm:max-w-xs">
                {settings.tagline || 'Online Showroom & Boutique'}
              </p>
            </div>
          </div>

          {/* Quick Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Panjabi, Oxford Shirts, Polos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Return to POS / Workstation ONLY if internal staff/owner is logged in */}
            {user && onReturnToWorkstation && (
              <button
                onClick={onReturnToWorkstation}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-all"
                title="Return to Internal Workstation"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Workstation</span>
              </button>
            )}

            {/* Track Order Trigger */}
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 text-xs font-semibold transition-all"
            >
              <Truck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* WhatsApp Hotline */}
            {settings.whatsapp_number && (
              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-all"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Cart Floating Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Bag</span>
              {cartItemsCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-emerald-400 text-[10px] font-black">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search garments, sizes, colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </header>

      {/* 3. HERO SHOWCASE SECTION */}
      <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              <span>{settings.hero_badge || 'NEW SEASON 2026'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {settings.hero_headline || 'Timeless Elegance & Contemporary Fashion'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {settings.hero_subheadline || 'Explore handcrafted Panjabi, Royal Oxford Shirts, and Premium Polos with fast nationwide shipping across Bangladesh.'}
            </p>

            {/* Quick Benefits Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span>Inside Dhaka ৳{settings.delivery_inside_dhaka || 60}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>7-Day Return Policy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>Cash on Delivery (COD)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
              <a
                href="#collection-grid"
                className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Browse Products ({storeData.products?.length || 0})</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              {settings.whatsapp_number && (
                <a
                  href={getWhatsAppOrderUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm hover:border-emerald-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Order via WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Hero Feature Visual Banner */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-emerald-500/10 group">
              <img
                src={settings.hero_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80'}
                alt="Store Collection"
                className="w-full h-72 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              {/* Floating Pill on image */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Flagship Showroom</div>
                  <div className="text-xs font-black text-white">{storeData.name}</div>
                  <div className="text-[10px] text-slate-400">{settings.address || 'Dhanmondi, Dhaka'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    100% Cotton
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CATEGORIES & FILTER TOOLBAR */}
      <section id="collection-grid" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        
        {/* Category Carousel Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            All Items ({storeData.products?.length || 0})
          </button>
          {storeData.categories?.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Secondary Filter & Sort Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
          
          {/* Size Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Size:</span>
            {['ALL', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'].map(sz => (
              <button
                key={sz}
                onClick={() => setSelectedSizeFilter(sz)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSizeFilter === sz
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="featured">Featured Collection</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800">
            <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No garments match your filters</h3>
            <p className="text-xs text-slate-400 mb-4">Try clearing your search query or size selection.</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setSelectedSizeFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const inStockVariants = product.variants?.filter(v => v.is_in_stock) || [];
              const hasStock = inStockVariants.length > 0;
              const firstVariant = inStockVariants[0] || product.variants?.[0];
              const displayPrice = firstVariant?.selling_price || product.base_selling_price;
              const mrpPrice = firstVariant?.mrp || (displayPrice * 1.2);
              const discountPct = mrpPrice > displayPrice ? Math.round(((mrpPrice - displayPrice) / mrpPrice) * 100) : 0;

              return (
                <div
                  key={product.id}
                  className="group rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5"
                >
                  {/* Image Card Container */}
                  <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Stock Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-slate-300 border border-slate-800">
                        {product.category_name}
                      </span>
                      {discountPct > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md">
                          -{discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md ${
                        hasStock ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}>
                        {hasStock ? 'IN STOCK' : 'SOLD OUT'}
                      </span>
                    </div>

                    {/* Quick View Button on Hover */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button
                        onClick={() => handleOpenProduct(product)}
                        className="px-4 py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs shadow-2xl hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Quick View & Options</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        {product.fabric || '100% Pure Fabric'}
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {product.name}
                      </h4>
                      {product.brand && (
                        <div className="text-[11px] text-slate-400">By {product.brand}</div>
                      )}
                    </div>

                    {/* Size Pills Preview */}
                    {product.variants?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))).map(s => (
                          <span
                            key={s}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price and Action Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-emerald-400">৳{displayPrice.toLocaleString()}</span>
                          {mrpPrice > displayPrice && (
                            <span className="text-xs text-slate-500 line-through">৳{mrpPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenProduct(product)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 font-black text-xs transition-all flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Select</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. INTERACTIVE PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Product Image */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-slate-950 relative">
              <img
                src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80'}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 rounded-full bg-slate-950/90 text-emerald-400 text-[10px] font-black border border-slate-800">
                  {selectedProduct.fabric || '100% Fine Fabric'}
                </span>
              </div>
            </div>

            {/* Selection Column */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {selectedProduct.category_name}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-emerald-400">
                      ৳{(selectedVariant?.selling_price || selectedProduct.base_selling_price).toLocaleString()}
                    </span>
                    {selectedVariant?.mrp && selectedVariant.mrp > selectedVariant.selling_price && (
                      <span className="text-xs text-slate-500 line-through">৳{selectedVariant.mrp.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                {/* Available Sizes Pills */}
                {selectedProduct.variants?.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Select Size: <span className="text-emerald-400">{selectedVariant?.size || 'Standard'}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          disabled={!v.is_in_stock}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedVariant?.id === v.id
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                              : v.is_in_stock 
                                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500' 
                                : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed line-through'
                          }`}
                        >
                          {v.size || 'STD'} {v.color ? `(${v.color})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Stock Alert */}
                <div className="text-xs flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${selectedVariant?.is_in_stock ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span className="text-slate-400">
                    {selectedVariant?.is_in_stock ? `In Stock (${selectedVariant.total_stock} ready for dispatch)` : 'Sold Out for this variant'}
                  </span>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">Quantity:</span>
                  <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700">
                    <button
                      onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                      className="p-1.5 hover:text-emerald-400"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-xs font-black text-white">{modalQuantity}</span>
                    <button
                      onClick={() => setModalQuantity(q => q + 1)}
                      className="p-1.5 hover:text-emerald-400"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-2">
                <button
                  onClick={() => handleAddToCart(selectedProduct, selectedVariant, modalQuantity)}
                  disabled={!selectedVariant?.is_in_stock}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Bag (৳{((selectedVariant?.selling_price || 0) * modalQuantity).toLocaleString()})</span>
                </button>

                {settings.whatsapp_number && (
                  <a
                    href={getWhatsAppOrderUrl(selectedProduct, selectedVariant)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Order Directly on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. SLIDING SHOPPING BAG DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Your Shopping Bag ({cartItemsCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-xs">Your shopping bag is empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.variant_id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3"
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=100&q=80'}
                      alt={item.product_name}
                      className="h-14 w-14 rounded-xl object-cover bg-slate-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.product_name}</h4>
                      <div className="text-[10px] text-slate-400">
                        Size: <span className="text-slate-200 font-semibold">{item.size || 'STD'}</span>
                        {item.color ? ` | ${item.color}` : ''}
                      </div>
                      <div className="text-xs font-black text-emerald-400 mt-1">
                        ৳{item.unit_price.toLocaleString()}
                      </div>
                    </div>

                    {/* Quantity Modifier */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800">
                        <button
                          onClick={() => handleUpdateCartQty(item.variant_id, -1)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-black text-white">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQty(item.variant_id, 1)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveCartItem(item.variant_id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Calculations & Checkout CTA */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
                
                {/* Delivery Zone Switcher */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Delivery Zone:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShippingZone('INSIDE_DHAKA')}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                        shippingZone === 'INSIDE_DHAKA'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div>Inside Dhaka</div>
                      <div className="text-[10px] font-normal text-slate-400">৳{settings.delivery_inside_dhaka ?? 60} (24-48 hrs)</div>
                    </button>
                    <button
                      onClick={() => setShippingZone('OUTSIDE_DHAKA')}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                        shippingZone === 'OUTSIDE_DHAKA'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div>Outside Dhaka</div>
                      <div className="text-[10px] font-normal text-slate-400">৳{settings.delivery_outside_dhaka ?? 120} (2-4 days)</div>
                    </button>
                  </div>
                </div>

                {/* Subtotal Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-white">৳{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-emerald-400">
                      {isFreeDelivery ? 'FREE' : `৳${finalDeliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400">৳{cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Trigger Button */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout (৳{cartGrandTotal.toLocaleString()})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 8. INSTANT CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-y-auto max-h-[95vh]">
            
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <h3 className="font-black text-base text-white">Fast Courier Checkout</h3>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
              
              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House number, Road, Area, Thana, District"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'COD', label: 'Cash on Delivery', sub: 'Pay on arrival' },
                    { id: 'BKASH', label: 'bKash Send', sub: settings.bkash_number || 'Merchant' },
                    { id: 'NAGAD', label: 'Nagad Send', sub: settings.nagad_number || 'Merchant' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        paymentMethod === m.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{m.sub}</div>
                    </button>
                  ))}
                </div>

                {/* If bKash or Nagad selected, show TrxID input */}
                {(paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Please send ৳{cartGrandTotal.toLocaleString()} to {paymentMethod} number:{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        {paymentMethod === 'BKASH' ? settings.bkash_number : settings.nagad_number}
                      </span>
                    </p>
                    <input
                      type="text"
                      placeholder="Enter Transaction TrxID (e.g. 9K20XYZ88)"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Call before delivery, deliver after 3 PM"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Summary recap */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Payable:</span>
                <span className="text-base font-black text-emerald-400">৳{cartGrandTotal.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingOrder ? (
                  <span>Placing Your Order...</span>
                ) : (
                  <span>Confirm Order (৳{cartGrandTotal.toLocaleString()})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. ORDER SUCCESS CELEBRATION MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 text-center space-y-4 shadow-2xl">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Order Received Successfully!
              </span>
              <h2 className="text-lg font-black text-white mt-1">Thank You for Shopping</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your order is confirmed and will be dispatched from our showroom.
              </p>
            </div>

            {/* Invoice Pill */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-left">
                <div className="text-[10px] text-slate-400">Order Invoice Code:</div>
                <div className="font-mono font-black text-emerald-400 text-sm">{completedOrder.invoice_number}</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(completedOrder.invoice_number);
                  setCopiedInvoice(true);
                  setTimeout(() => setCopiedInvoice(false), 2000);
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                title="Copy Invoice"
              >
                {copiedInvoice ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="text-left text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div><strong className="text-white">Customer:</strong> {completedOrder.customer_name} ({completedOrder.customerPhone})</div>
              <div><strong className="text-white">Address:</strong> {completedOrder.shippingAddress}</div>
              <div><strong className="text-white">Total Amount:</strong> ৳{completedOrder.total_amount?.toLocaleString()} ({completedOrder.payment_method})</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTrackQuery(completedOrder.invoice_number);
                  setCompletedOrder(null);
                  setIsTrackingOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Track Order
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. LIVE ORDER TRACKING MODAL */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsTrackingOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-black text-base text-white">Live Order Tracking</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter your Order Invoice Number (e.g. ECO-VOGUE-20261016-0001) or Mobile Phone to track progress.
            </p>

            <form onSubmit={handleTrackSubmit} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Invoice or Phone number"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isTrackingLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all"
              >
                {isTrackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {/* Tracking Results */}
            {trackedOrders && (
              <div className="space-y-4">
                {trackedOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No matching orders found.</p>
                ) : (
                  trackedOrders.map(order => (
                    <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <div className="font-mono font-black text-emerald-400 text-sm">{order.invoice_number}</div>
                          <div className="text-[10px] text-slate-400">{order.created_at}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {order.delivery_status}
                        </span>
                      </div>

                      {/* 4-Step Visual Stepper */}
                      <div className="grid grid-cols-4 gap-1 pt-2">
                        {[
                          { key: 'PENDING', label: 'Placed' },
                          { key: 'CONFIRMED', label: 'Packed' },
                          { key: 'SHIPPED', label: 'In Courier' },
                          { key: 'DELIVERED', label: 'Delivered' }
                        ].map((step, idx) => {
                          const stepsOrder = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
                          const currentIdx = stepsOrder.indexOf(order.delivery_status);
                          const isDone = currentIdx >= idx;
                          return (
                            <div key={step.key} className="text-center">
                              <div className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                                isDone ? 'bg-emerald-400' : 'bg-slate-800'
                              }`} />
                              <span className={`text-[9px] font-bold ${
                                isDone ? 'text-emerald-400' : 'text-slate-600'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80 space-y-1">
                        <div><strong className="text-white">Shipping to:</strong> {order.shipping_address}</div>
                        <div><strong className="text-white">Total Amount:</strong> ৳{order.total_amount?.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{order.items_count} garment item(s)</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. STOREFRONT FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm">{storeData.name}</h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {settings.tagline || 'Premium Bangladesh Fashion & Retail Brand'}. Handcrafted garments made with premium cotton and modern tailoring.
            </p>
            {storeData.custom_domain && (
              <div className="text-[10px] text-emerald-400 font-mono">
                🌐 {storeData.custom_domain}
              </div>
            )}
          </div>

          <div>
            <h5 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Customer Help</h5>
            <ul className="space-y-2 text-[11px]">
              <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-emerald-400">Track Order</button></li>
              <li><span>Inside Dhaka: ৳{settings.delivery_inside_dhaka || 60} (24-48h)</span></li>
              <li><span>Outside Dhaka: ৳{settings.delivery_outside_dhaka || 120}</span></li>
              <li><span>Exchange Policy: 7 Days with Receipt</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Showroom & Hotline</h5>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings.address || 'House 42, Road 7/A, Dhanmondi, Dhaka'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>{settings.hotline_number || '+880 1711-000111'}</span>
              </li>
              {settings.whatsapp_number && (
                <li className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp: {settings.whatsapp_number}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Powered by</h5>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-white font-bold text-xs">OmniFlow POS & ERP Cloud</div>
              <div className="text-[10px] text-slate-400">Multi-Tenant E-Commerce & Retail Engine</div>
              <div className="text-[9px] text-emerald-400 font-bold pt-1">Personal Custom Domain Enabled</div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2026 {storeData.name}. All rights reserved.</div>
          <div className="flex gap-4">
            <span>Cash on Delivery</span>
            <span>bKash</span>
            <span>Nagad</span>
            <span>Debit / Credit Cards</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
