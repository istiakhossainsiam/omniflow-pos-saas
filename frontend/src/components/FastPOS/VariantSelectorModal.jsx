import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ShoppingCart, Layers, MapPin } from 'lucide-react';

export default function VariantSelectorModal({ product, selectedBranch, onAddToCart, onClose }) {
  if (!product) return null;

  // Group variants by Color
  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);

  const colorVariants = selectedColor 
    ? product.variants.filter(v => v.color === selectedColor)
    : product.variants;

  const [selectedVariant, setSelectedVariant] = useState(colorVariants[0] || product.variants[0]);
  const [quantity, setQuantity] = useState(1);

  const currentBranchStock = selectedVariant?.branch_stocks?.find(
    s => s.branch_id === selectedBranch?.id
  )?.quantity ?? (selectedVariant?.total_stock || 0);

  const handleSelectColor = (c) => {
    setSelectedColor(c);
    const firstMatchingVariant = product.variants.find(v => v.color === c);
    if (firstMatchingVariant) setSelectedVariant(firstMatchingVariant);
  };

  const handleConfirm = () => {
    if (!selectedVariant) return;
    onAddToCart(selectedVariant, quantity, product.name);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{product.brand || 'Retail'}</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{product.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{product.fabric ? `Fabric: ${product.fabric}` : ''}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Color Selection */}
        {colors.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-700">Select Color:</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {colors.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-slate-300 border border-slate-400" />
                    <span>{c}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size Matrix Selection */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700">Select Size:</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1.5">
            {colorVariants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vStock = v.branch_stocks?.find(s => s.branch_id === selectedBranch?.id)?.quantity ?? v.total_stock;
              const isOutOfStock = vStock <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm'
                      : isOutOfStock
                        ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-extrabold">{v.size || 'Standard'}</span>
                  <span className={`text-[10px] mt-0.5 font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-500'}`}>
                    {isOutOfStock ? 'Out of Stock' : `${vStock} in stock`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Variant SKU Breakdown */}
        {selectedVariant && (
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">SKU: <span className="font-mono text-slate-800 font-bold">{selectedVariant.sku}</span></span>
              <span className="text-slate-500">Barcode: <span className="font-mono text-emerald-700 font-bold">{selectedVariant.barcode}</span></span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>Stock in Showroom:</span>
              <span className="font-bold text-emerald-700">{currentBranchStock} pcs available</span>
            </div>
          </div>
        )}

        {/* Pricing & Quantity Stepper */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</div>
            <div className="text-xl font-black text-slate-900">
              {selectedVariant?.selling_price?.toLocaleString()} ৳
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-lg font-bold"
            >
              -
            </button>
            <span className="w-8 text-center font-extrabold text-slate-900">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleConfirm}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Add to Cart ({((selectedVariant?.selling_price || 0) * quantity).toLocaleString()} ৳)</span>
        </button>

      </div>
    </div>,
    document.body
  );
}
