import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { productApi } from '../../services/api';
import ProductImagePicker from './ProductImagePicker';

export default function MatrixCreatorModal({ categories, selectedBranch, onSuccess, onClose }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('Vogue Formal');
  const [fabric, setFabric] = useState('100% Cotton');
  const [baseCostPrice, setBaseCostPrice] = useState(850);
  const [baseSellingPrice, setBaseSellingPrice] = useState(1750);
  const [mrp, setMrp] = useState(1950);
  const [initialStock, setInitialStock] = useState(12);

  const [availableSizes, setAvailableSizes] = useState(['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44']);
  const [selectedSizes, setSelectedSizes] = useState(['M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [availableColors, setAvailableColors] = useState(['Navy Blue', 'Maroon', 'Midnight Black', 'Emerald Green', 'Crisp White', 'Olive']);
  const [selectedColors, setSelectedColors] = useState(['Navy Blue', 'Crisp White']);
  const [customColorInput, setCustomColorInput] = useState('');

  const [loading, setLoading] = useState(false);

  // Freeze background page scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, []);

  const toggleSize = (s) => {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleColor = (c) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleAddCustomSizes = (e) => {
    if (e) e.preventDefault();
    if (!customSizeInput.trim()) return;

    const newItems = customSizeInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (newItems.length === 0) return;

    setAvailableSizes(prev => {
      const combined = [...prev];
      newItems.forEach(item => {
        if (!combined.some(x => x.toLowerCase() === item.toLowerCase())) {
          combined.push(item);
        }
      });
      return combined;
    });

    setSelectedSizes(prev => {
      const combined = [...prev];
      newItems.forEach(item => {
        if (!combined.some(x => x.toLowerCase() === item.toLowerCase())) {
          combined.push(item);
        }
      });
      return combined;
    });

    setCustomSizeInput('');
  };

  const handleAddCustomColors = (e) => {
    if (e) e.preventDefault();
    if (!customColorInput.trim()) return;

    const newItems = customColorInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (newItems.length === 0) return;

    setAvailableColors(prev => {
      const combined = [...prev];
      newItems.forEach(item => {
        if (!combined.some(x => x.toLowerCase() === item.toLowerCase())) {
          combined.push(item);
        }
      });
      return combined;
    });

    setSelectedColors(prev => {
      const combined = [...prev];
      newItems.forEach(item => {
        if (!combined.some(x => x.toLowerCase() === item.toLowerCase())) {
          combined.push(item);
        }
      });
      return combined;
    });

    setCustomColorInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedSizes.length === 0 || selectedColors.length === 0) {
      alert("Please enter product name and pick at least 1 size and 1 color.");
      return;
    }

    try {
      setLoading(true);
      await productApi.generateMatrix({
        name,
        category_id: categoryId || null,
        product_type: 'CLOTHING',
        brand,
        fabric,
        image_url: imageUrl || null,
        base_cost_price: parseFloat(baseCostPrice) || 0,
        base_selling_price: parseFloat(baseSellingPrice) || 0,
        mrp: parseFloat(mrp) || 0,
        sizes: selectedSizes,
        colors: selectedColors,
        initial_stock_per_variant: parseInt(initialStock) || 10,
        branch_id: selectedBranch?.id || null
      });

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to generate matrix");
    } finally {
      setLoading(false);
    }
  };

  const generatedCount = selectedSizes.length * selectedColors.length;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">New Clothing Matrix</h3>
              <p className="text-[11px] text-slate-500 font-medium">Auto-generate SKUs, Barcodes & Stock Matrix</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 press-tactile transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Product Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Design / Product Name:</label>
              <input
                type="text"
                placeholder="e.g. Vintage Denim Washed Jacket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Brand / Collection:</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Fabric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Category:</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Fabric Composition:</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. 100% Linen"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Product Image with WebP Converter & Live Camera */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
            <ProductImagePicker
              value={imageUrl}
              onChange={setImageUrl}
              label="Clothing Design Visual (Optional)"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cost (৳):</label>
              <input
                type="number"
                value={baseCostPrice}
                onChange={(e) => setBaseCostPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Selling (৳):</label>
              <input
                type="number"
                value={baseSellingPrice}
                onChange={(e) => setBaseSellingPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-emerald-700 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tag MRP (৳):</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Size Pills & Custom Size Input */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Select / Add Sizes for Matrix:
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedSizes.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((s) => {
                const isSelected = selectedSizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Custom Size Input */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                placeholder="Type custom size (e.g. 28, 30, 32 or Free Size)..."
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSizes();
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSizes}
                disabled={!customSizeInput.trim()}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Color Pills & Custom Color Input */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Select / Add Colors for Matrix:
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedColors.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableColors.map((c) => {
                const isSelected = selectedColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                placeholder="Type custom color (e.g. Lavender, Beige, Royal Blue)..."
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomColors();
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomColors}
                disabled={!customColorInput.trim()}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Initial Stock */}
          <div>
            <label className="text-xs font-bold text-slate-700">
              Initial Stock Per Variant (Showroom: {selectedBranch?.name || 'Current'}):
            </label>
            <input
              type="number"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Summary Matrix Box */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center justify-between shadow-xs">
            <span>Matrix Output: <strong>{selectedSizes.length} Sizes × {selectedColors.length} Colors</strong></span>
            <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl">{generatedCount} Unique SKUs</span>
          </div>

        </div>

        {/* Modal Pinned Bottom Actions */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 bg-white shrink-0 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 press-tactile transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || generatedCount === 0}
            className="flex-2 rounded-2xl bg-emerald-600 py-3 px-5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 press-tactile transition-all"
          >
            {loading ? "Generating Matrix..." : `Generate ${generatedCount} SKUs Now`}
          </button>
        </div>

      </form>

    </div>
  </div>,
  document.body
);
}
