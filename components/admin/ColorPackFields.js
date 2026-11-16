'use client';

import { Plus, Trash2 } from 'lucide-react';

// Palette (Tailwind arbitrary values, no dependency on tailwind.config.js):
//   #8F1538 primary (actions)      #C58A08 secondary (swatch ring)
//   #FFF9F0 background (inputs)    #E60062 accent (focus / destructive hover)
//   #075447 highlight (stock notes) #29211E text
//   #E5CDD3 border (derived tint)  #7A6A63 muted hint text (derived)

const inputCls =
  'border border-[#E5CDD3] bg-[#FFF9F0] text-[#29211E] rounded-lg px-2 py-1.5 text-xs ' +
  'placeholder:text-[#7A6A63]/60 focus:outline-none focus:border-[#E60062] focus:ring-1 focus:ring-[#E60062]';
const selectCls = inputCls.replace('px-2 py-1.5 text-xs', 'px-3 py-2 text-sm');
const addBtnCls =
  'text-xs flex items-center gap-1 text-[#8F1538] hover:text-[#E60062] transition-colors disabled:opacity-30 disabled:hover:text-[#8F1538]';
const trashBtnCls = 'text-[#8F1538] hover:text-[#E60062] transition-colors shrink-0';
const hintCls = 'text-[#7A6A63]';
const noteCls = 'text-[#075447]';

const emptyColorRow = { name: '', hex: '#000000', variantId: '', size: '', stock: '' };
const emptyPackRow = { size: '', price: '', originalPrice: '', stock: '' };
const emptySizeChartRow = { size: '', chest: '', waist: '', length: '' };

export default function ColorPackFields({ form, setForm, products }) {
  const baseProduct = products.find((p) => p._id === form.baseProduct);
  const variants = baseProduct?.variants || [];

  function updateColor(idx, patch) {
    setForm((f) => {
      const colors = [...f.colors];
      colors[idx] = { ...colors[idx], ...patch };
      return { ...f, colors };
    });
  }

  function addColor() {
    setForm((f) => ({ ...f, colors: [...(f.colors || []), { ...emptyColorRow }] }));
  }

  function removeColor(idx) {
    setForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== idx) }));
  }

  function pickVariant(idx, variantId) {
    const v = variants.find((v) => v._id === variantId);
    updateColor(idx, {
      variantId,
      name: v?.color || '',
      hex: v?.colorHex || '#000000',
    });
  }

  function updatePack(idx, patch) {
    setForm((f) => {
      const packOptions = [...f.packOptions];
      packOptions[idx] = { ...packOptions[idx], ...patch };
      return { ...f, packOptions };
    });
  }

  function addPack() {
    setForm((f) => ({ ...f, packOptions: [...(f.packOptions || []), { ...emptyPackRow }] }));
  }

  function removePack(idx) {
    setForm((f) => ({ ...f, packOptions: f.packOptions.filter((_, i) => i !== idx) }));
  }

  function updateSizeChartRow(idx, patch) {
    setForm((f) => {
      const sizeChart = [...(f.sizeChart || [])];
      sizeChart[idx] = { ...sizeChart[idx], ...patch };
      return { ...f, sizeChart };
    });
  }

  function addSizeChartRow() {
    setForm((f) => ({ ...f, sizeChart: [...(f.sizeChart || []), { ...emptySizeChartRow }] }));
  }

  function removeSizeChartRow(idx) {
    setForm((f) => ({ ...f, sizeChart: (f.sizeChart || []).filter((_, i) => i !== idx) }));
  }

  return (
    <div className="space-y-4 text-[#29211E]">
      {/* Base product */}
      <div>
        <p className="text-sm font-medium mb-1">Base Product</p>
        <select
          required
          className={`w-full ${selectCls}`}
          value={form.baseProduct}
          onChange={(e) => setForm({ ...form, baseProduct: e.target.value, colors: [] })}
        >
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <p className={`text-xs ${hintCls} mt-1`}>
          Changing the base product resets your color list, since colors map to its variants.
        </p>
      </div>

      {/* Colors */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">Colors</p>
          <button type="button" onClick={addColor} disabled={!form.baseProduct} className={addBtnCls}>
            <Plus size={13} /> Add Color
          </button>
        </div>

        {!form.baseProduct && (
          <p className={`text-xs ${hintCls}`}>Select a base product first to choose its color variants.</p>
        )}

        <div className="space-y-2">
          {(form.colors || []).map((c, idx) => (
            <div key={idx} className="border border-[#E5CDD3] bg-white/40 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  className={`flex-1 ${inputCls}`}
                  value={c.variantId}
                  onChange={(e) => pickVariant(idx, e.target.value)}
                >
                  <option value="">Select variant/color</option>
                  {variants.map((v) => (
                    <option key={v._id} value={v._id}>{v.color || v._id}</option>
                  ))}
                </select>
                <span
                  className="w-6 h-6 rounded-full border-2 border-[#C58A08] shrink-0"
                  style={{ backgroundColor: c.hex || '#ddd' }}
                />
                <button type="button" onClick={() => removeColor(idx)} className={trashBtnCls}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Display name"
                  className={inputCls}
                  value={c.name}
                  onChange={(e) => updateColor(idx, { name: e.target.value })}
                />
                <input
                  type="color"
                  className="border border-[#E5CDD3] bg-[#FFF9F0] rounded-lg h-8 w-full"
                  value={c.hex || '#000000'}
                  onChange={(e) => updateColor(idx, { hex: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  className={inputCls}
                  value={c.stock ?? ''}
                  onChange={(e) => updateColor(idx, { stock: e.target.value ? Number(e.target.value) : '' })}
                />
              </div>
              <p className={`text-[10px] ${noteCls}`}>
                Stock here is shown to customers alongside the base product's live variant stock for the selected size — set it to whatever this color has available for this combo.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pack options */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">Pack Options</p>
          <button type="button" onClick={addPack} className={addBtnCls}>
            <Plus size={13} /> Add Pack Option
          </button>
        </div>
        <div className="space-y-2">
          <div className={`grid grid-cols-5 gap-2 text-[10px] ${hintCls} px-0.5`}>
            <span>Qty per pack</span>
            <span>Price ₹</span>
            <span>Original ₹</span>
            <span>Stock (packs)</span>
            <span></span>
          </div>
          {(form.packOptions || []).map((p, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 items-center">
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                className={inputCls}
                value={p.size}
                onChange={(e) => updatePack(idx, { size: e.target.value ? Number(e.target.value) : '' })}
              />
              <input
                type="number"
                min="0"
                placeholder="Price"
                className={inputCls}
                value={p.price}
                onChange={(e) => updatePack(idx, { price: e.target.value ? Number(e.target.value) : '' })}
              />
              <input
                type="number"
                min="0"
                placeholder="Original"
                className={inputCls}
                value={p.originalPrice}
                onChange={(e) => updatePack(idx, { originalPrice: e.target.value ? Number(e.target.value) : '' })}
              />
              <input
                type="number"
                min="0"
                placeholder="Unlimited"
                className={inputCls}
                value={p.stock ?? ''}
                onChange={(e) => updatePack(idx, { stock: e.target.value ? Number(e.target.value) : '' })}
              />
              <button type="button" onClick={() => removePack(idx)} className={`${trashBtnCls} justify-self-start`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <p className={`text-[10px] ${noteCls} mt-1`}>
          Leave "Stock (packs)" blank for unlimited. When set to 0, that pack size shows as out of stock to customers.
        </p>
      </div>

      {/* Size chart */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">Size Chart</p>
          <button type="button" onClick={addSizeChartRow} className={addBtnCls}>
            <Plus size={13} /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {(form.sizeChart || []).length > 0 && (
            <div className={`grid grid-cols-5 gap-2 text-[10px] ${hintCls} px-0.5`}>
              <span>Size</span>
              <span>Chest</span>
              <span>Waist</span>
              <span>Length</span>
              <span></span>
            </div>
          )}
          {(form.sizeChart || []).map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 items-center">
              <input
                placeholder="M"
                className={inputCls}
                value={row.size}
                onChange={(e) => updateSizeChartRow(idx, { size: e.target.value })}
              />
              <input
                placeholder="38-40"
                className={inputCls}
                value={row.chest}
                onChange={(e) => updateSizeChartRow(idx, { chest: e.target.value })}
              />
              <input
                placeholder="32-34"
                className={inputCls}
                value={row.waist}
                onChange={(e) => updateSizeChartRow(idx, { waist: e.target.value })}
              />
              <input
                placeholder="28"
                className={inputCls}
                value={row.length}
                onChange={(e) => updateSizeChartRow(idx, { length: e.target.value })}
              />
              <button type="button" onClick={() => removeSizeChartRow(idx)} className={`${trashBtnCls} justify-self-start`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {(form.sizeChart || []).length === 0 && (
            <p className={`text-xs ${hintCls}`}>No rows yet — customers will see a generic size chart until you add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}