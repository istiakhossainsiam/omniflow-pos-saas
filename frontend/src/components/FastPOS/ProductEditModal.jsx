import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { productApi } from '../../services/api';
import { X, Trash2, Save, AlertTriangle, Layers, Tag, DollarSign, Package } from 'lucide-react';
import ProductImagePicker from '../InventoryMatrix/ProductImagePicker';

export default function ProductEditModal({ product, selectedBranch, onSaved, onClose }) {
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [fabric, setFabric] = useState(product?.fabric || '');
  const [imageUrl, setImageUrl] = useState(product?.image_url || null);
  const [basePrice, setBasePrice] = useState(product?.base_selling_price || 0);
  const [baseCost, setBaseCost] = useState(product?.base_cost_price || 0);
  const [variants, setVariants] = useState(product?.variants || []);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants'
  const [loading, setLoading] = useState(false);

  // Freeze background page scroll when modal is open
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, []);

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await productApi.update(product.id, {
        name,
        brand,
        fabric,
        image_url: imageUrl,
        base_selling_price: parseFloat(basePrice) || 0,
        base_cost_price: parseFloat(baseCost) || 0
      });
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to update product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = async (v, newPrice, newMrp, newStock) => {
    try {
      setLoading(true);
      await productApi.updateVariant(v.id, {
        selling_price: parseFloat(newPrice) || v.selling_price,
        mrp: parseFloat(newMrp) || v.mrp,
        stock_quantity: parseInt(newStock) !== undefined ? parseInt(newStock) : undefined,
        branch_id: selectedBranch?.id
      });
      alert("Variant updated successfully!");
      onSaved();
    } catch (err) {
      alert("Failed to update variant: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm("Are you sure you want to remove this size/color variant?")) return;
    try {
      setLoading(true);
      await productApi.deleteVariant(variantId);
      setVariants(prev => prev.filter(v => v.id !== variantId));
      onSaved();
    } catch (err) {
      alert("Failed to delete variant: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to completely delete "${product.name}" from the POS catalog?`)) return;
    try {
      setLoading(true);
      await productApi.delete(product.id);
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">Edit Product & Pricing</h3>
              <p className="text-[11px] text-slate-500 font-mono">ID: {product.id?.slice(0, 8)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 press-tactile transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-5 pt-3 flex gap-2 border-b border-slate-100 pb-2.5 shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('general')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'general' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            General & Base Price
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'variants' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Matrix Variants ({variants.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'general' ? (
            <form onSubmit={handleUpdateGeneral} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Fabric / Material</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Selling Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Cost Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    value={baseCost}
                    onChange={(e) => setBaseCost(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Visual with WebP Converter & Live Camera */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
                <ProductImagePicker
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Product Visual / Photo (Optional)"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Product</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Saving..." : "Save Product Details"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {variants.map((v) => {
                const bStock = (v.branch_stocks || []).find(s => s.branch_id === selectedBranch?.id);
                const currentQty = bStock ? bStock.quantity : (v.total_stock || 0);

                return (
                  <div key={v.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {v.size ? `SIZE: ${v.size}` : ''} {v.color ? `• ${v.color}` : ''}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        SKU: {v.sku} | Barcode: {v.barcode}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                        Stock in {selectedBranch?.name}: <span className="font-bold">{currentQty} pcs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">৳ {v.selling_price}</span>
                        {v.mrp > v.selling_price && (
                          <div className="text-[10px] text-slate-400 line-through">MRP: ৳{v.mrp}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
