'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Save, Search, X, ChevronDown, ChevronRight } from 'lucide-react';

// Edit-key suffix for a common-stock variant (one shared pool, no size)
const COMMON = '__common';

const isCommon = (v) => v?.stockMode === 'common';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | out | low | in
  const [collapsed, setCollapsed] = useState({}); // parentId -> bool

  // --- Image zoom modal state ---
  const [zoomImage, setZoomImage] = useState(null); // { src, alt } | null

  async function load() {
    setLoading(true);
    try {
      // admin-only endpoint: returns ALL products (active + inactive), never cached
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  // Close zoom modal on Escape
  useEffect(() => {
    if (!zoomImage) return;
    function onKey(e) {
      if (e.key === 'Escape') setZoomImage(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomImage]);

  // sizeKey = the size name, or COMMON for a common-stock variant's shared pool
  function editKey(productId, variantId, sizeKey) {
    return `${productId}-${variantId}-${sizeKey}`;
  }

  function setStock(productId, variantId, sizeKey, value) {
    setEdits((e) => ({ ...e, [editKey(productId, variantId, sizeKey)]: value }));
  }

  // Saves one row. For a common-stock row it writes variant.commonStock,
  // otherwise the stock of that one size. stockMode / commonStock always travel
  // with the variant so the server never resets a common variant to per-size.
  async function saveRow(product, variant, row) {
    const sizeKey = row.common ? COMMON : row.s.size;
    const key = editKey(product._id, variant._id, sizeKey);
    const newStock = edits[key];
    if (newStock === undefined) return;
    const n = Math.max(0, Number(newStock) || 0);

    const updatedVariants = (product.variants || []).map((v) => {
      if (v._id !== variant._id) return v;
      if (row.common) {
        return { ...v, stockMode: 'common', commonStock: n };
      }
      return {
        ...v,
        stockMode: v.stockMode === 'common' ? 'common' : 'size',
        commonStock: v.commonStock || 0,
        sizes: (v.sizes || []).map((s) => (s.size === row.s.size ? { ...s, stock: n } : s)),
      };
    });

    const res = await fetch(`/api/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants: updatedVariants }),
    });
    if (res.ok) {
      toast.success('Stock updated');
      setEdits((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
      load();
    } else toast.error('Failed to update stock');
  }

  function catId(c) {
    return c?._id || c;
  }
  function parentId(c) {
    return c?.parent?._id || c?.parent || null;
  }

  // Best available image for a variant, falling back to the product image
  function variantImage(product, variant) {
    return variant?.images?.[0] || product?.images?.[0] || null;
  }

  // Every stock number a variant holds: one pool (common) or one per size
  function variantStockValues(v) {
    if (isCommon(v)) return [Number(v.commonStock) || 0];
    return (v.sizes || []).map((s) => Number(s.stock) || 0);
  }

  function matchesStockFilter(stock) {
    const n = Number(stock) || 0;
    if (stockFilter === 'out') return n <= 0;
    if (stockFilter === 'low') return n > 0 && n <= 5;
    if (stockFilter === 'in') return n > 5;
    return true;
  }

  const catMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [categories]);

  // --- Search + category + stock filter ---
  const filteredProducts = useMemo(() => {
    let list = [...products];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      list = list.filter((p) => {
        const pCatId = catId(p.category);
        if (pCatId === categoryFilter) return true;
        // also match if selected filter is a parent category and product belongs to a child of it
        const pCat = catMap[pCatId];
        return parentId(pCat) === categoryFilter;
      });
    }

    if (stockFilter !== 'all') {
      list = list.filter((p) => {
        const values = (p.variants || []).flatMap(variantStockValues);
        if (values.length === 0) return stockFilter === 'out'; // no variants = out of stock
        return values.some((n) => matchesStockFilter(n));
      });
    }

    return list;
  }, [products, search, categoryFilter, stockFilter, catMap]);

  // --- Category product counts (for summary cards, based on ALL products) ---
  const categoryCounts = useMemo(() => {
    const direct = {};
    categories.forEach((c) => {
      direct[c._id] = 0;
    });
    products.forEach((p) => {
      const cid = catId(p.category);
      if (direct[cid] !== undefined) direct[cid] += 1;
    });
    const total = { ...direct };
    categories.forEach((c) => {
      const pid = parentId(c);
      if (pid && total[pid] !== undefined) total[pid] += direct[c._id] || 0;
    });
    return { direct, total };
  }, [categories, products]);

  // Units in stock for a product, including in-progress edits.
  // A common-stock variant counts its pool ONCE (never summed per size).
  function productStock(p) {
    return (p.variants || []).reduce((sum, v) => {
      if (isCommon(v)) {
        const key = editKey(p._id, v._id, COMMON);
        const val = edits[key] !== undefined ? Number(edits[key]) : v.commonStock;
        return sum + (Number(val) || 0);
      }
      return (
        sum +
        (v.sizes || []).reduce((s, sz) => {
          const key = editKey(p._id, v._id, sz.size);
          const val = edits[key] !== undefined ? Number(edits[key]) : sz.stock;
          return s + (Number(val) || 0);
        }, 0)
      );
    }, 0);
  }

  // --- Group filtered products by parent category -> child category ---
  const grouped = useMemo(() => {
    const parents = categories.filter((c) => !c.parent);

    const result = parents
      .map((parent) => {
        const children = categories.filter((c) => parentId(c) === parent._id);

        const childGroups = children
          .map((child) => ({
            category: child,
            products: filteredProducts.filter((p) => catId(p.category) === child._id),
          }))
          .filter((g) => g.products.length > 0);

        const directProducts = filteredProducts.filter((p) => catId(p.category) === parent._id);

        return { parent, directProducts, childGroups };
      })
      .filter((g) => g.directProducts.length > 0 || g.childGroups.length > 0);

    // Products whose category is missing/unknown must still be shown
    const knownIds = new Set(categories.map((c) => c._id));
    const orphans = filteredProducts.filter((p) => !knownIds.has(catId(p.category)));
    if (orphans.length > 0) {
      result.push({
        parent: { _id: '__uncategorized', name: 'Uncategorized' },
        directProducts: orphans,
        childGroups: [],
        isUncategorizedGroup: true,
      });
    }

    return result;
  }, [categories, filteredProducts]);

  function toggleCollapse(id) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  // NOTE: a render function (not an inner component) so inputs keep focus while typing
  function renderStockTable(list) {
    const rows = list.flatMap((p) => {
      const variants = p.variants || [];
      const hasSizes = variants.some((v) => (v.sizes || []).length > 0 || isCommon(v));

      // product with no variants/sizes -> one placeholder row (still shows image)
      if (!hasSizes) {
        return [{ key: `${p._id}-empty`, p, v: null, s: null, common: false }];
      }

      return variants.flatMap((v) => {
        // Common stock: ONE row per variant, editing the shared pool
        if (isCommon(v)) {
          return [
            {
              key: editKey(p._id, v._id, COMMON),
              p,
              v,
              s: { size: null, stock: Number(v.commonStock) || 0, sku: '' },
              common: true,
            },
          ];
        }
        // Per-size stock: one row per size
        return (v.sizes || []).map((s) => ({
          key: editKey(p._id, v._id, s.size),
          p,
          v,
          s,
          common: false,
        }));
      });
    });

    const visibleRows =
      stockFilter === 'all'
        ? rows
        : rows.filter(({ s }) => matchesStockFilter(s ? s.stock : 0));

    return (
      <table className="w-full text-sm mb-2">
        <thead>
          <tr className="text-left border-b border-brand-ink/10 text-brand-ink/40 text-xs">
            <th className="p-2">Image</th>
            <th className="p-2">Product</th>
            <th className="p-2">Product SKU</th>
            <th className="p-2">Color</th>
            <th className="p-2">Size</th>
            <th className="p-2">Size SKU</th>
            <th className="p-2">Stock</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const { key, p, v, s, common } = row;
            const value = s ? (edits[key] !== undefined ? edits[key] : s.stock) : 0;
            const outOfStock = !s || Number(value) <= 0;
            const img = variantImage(p, v);
            const alt = `${p.name}${v?.color ? ` - ${v.color}` : ''}`;
            const sizeKey = common ? COMMON : s?.size;

            return (
              <tr
                key={key}
                className={`border-b border-brand-ink/5 ${outOfStock ? 'bg-red-50/60' : ''}`}
              >
                <td className="p-2">
                  {img ? (
                    <button
                      type="button"
                      onClick={() => setZoomImage({ src: img, alt })}
                      className="relative block w-12 h-12 rounded-lg overflow-hidden border border-brand-ink/10 hover:opacity-80 transition-opacity"
                      title="Click to zoom"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={alt}
                        className={`w-full h-full object-cover ${outOfStock ? 'grayscale opacity-70' : ''}`}
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-brand-ink/5 flex items-center justify-center text-[10px] text-brand-ink/30">
                      No image
                    </div>
                  )}
                </td>

                <td className="p-2">
                  <Link
                    href={`/product/${p.slug || p._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-magenta hover:underline"
                  >
                    {p.name}
                  </Link>
                  {outOfStock && (
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                      Out of stock
                    </span>
                  )}
                  {p.isActive === false && (
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="p-2 text-xs text-brand-ink/50">{p.sku || '—'}</td>
                <td className="p-2">{v?.color || '—'}</td>
                <td className="p-2">
                  {common ? (
                    <div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-ink/10 text-brand-ink/70">
                        Common stock
                      </span>
                      <p className="text-xs text-brand-ink/50 mt-1">
                        {(v.sizes || []).map((sz) => sz.size).join(', ') || 'No sizes'}
                      </p>
                    </div>
                  ) : (
                    s?.size || '—'
                  )}
                </td>
                <td className="p-2 text-xs text-brand-ink/50">{common ? '—' : s?.sku || '—'}</td>
                <td className="p-2">
                  {s ? (
                    <input
                      type="number"
                      min="0"
                      className={`w-20 border rounded-lg px-2 py-1 text-sm ${
                        Number(value) <= 5 ? 'border-brand-magenta text-brand-magenta' : ''
                      }`}
                      value={value}
                      onChange={(e) => setStock(p._id, v._id, sizeKey, e.target.value)}
                    />
                  ) : (
                    <span className="text-xs text-brand-ink/40">No variants</span>
                  )}
                </td>
                <td className="p-2">
                  {s && (
                    <button
                      onClick={() => saveRow(p, v, row)}
                      className="text-brand-magenta"
                      title={common ? 'Save common stock' : 'Save stock'}
                    >
                      <Save size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-magenta mb-5">Inventory</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-brand-ink/10 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-ink/40"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-brand-ink/10 outline-none"
        >
          <option value="all">All Categories</option>
          {categories
            .filter((c) => !c.parent)
            .map((parent) => (
              <optgroup key={parent._id} label={parent.name}>
                <option value={parent._id}>{parent.name} (all)</option>
                {categories
                  .filter((c) => parentId(c) === parent._id)
                  .map((child) => (
                    <option key={child._id} value={child._id}>
                      — {child.name}
                    </option>
                  ))}
              </optgroup>
            ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-brand-ink/10 outline-none"
        >
          <option value="all">All stock levels</option>
          <option value="out">Out of stock</option>
          <option value="low">Low stock (≤ 5)</option>
          <option value="in">In stock</option>
        </select>
      </div>

      {/* Category summary cards */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories
            .filter((c) => !c.parent)
            .map((parent) => (
              <div
                key={parent._id}
                className="px-3 py-2 rounded-lg text-xs border border-brand-ink/10 bg-white"
              >
                <span className="font-semibold text-brand-magenta">{parent.name}</span>
                <span className="text-brand-ink/50">
                  {' '}
                  — {categoryCounts.total[parent._id] || 0} products
                </span>
              </div>
            ))}
        </div>
      )}

      {loading ? (
        <p className="text-brand-ink/50">Loading...</p>
      ) : grouped.length === 0 ? (
        <p className="text-center text-brand-ink/40 py-10">No products match your filters.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ parent, directProducts, childGroups, isUncategorizedGroup }) => {
            const isCollapsed = collapsed[parent._id];
            const parentStock =
              directProducts.reduce((sum, p) => sum + productStock(p), 0) +
              childGroups.reduce(
                (sum, g) => sum + g.products.reduce((s, p) => s + productStock(p), 0),
                0
              );
            const parentProductCount =
              directProducts.length + childGroups.reduce((sum, g) => sum + g.products.length, 0);

            return (
              <div key={parent._id} className="card-soft">
                <button
                  onClick={() => toggleCollapse(parent._id)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <span className="flex items-center gap-2 font-display font-bold text-brand-magenta">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    {parent.name}
                  </span>
                  <span className="text-xs text-brand-ink/50">
                    {parentProductCount} products &middot; {parentStock} units in stock
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="px-3 pb-3">
                    {directProducts.length > 0 && (
                      <div className="mb-3">
                        {!isUncategorizedGroup && (
                          <p className="text-xs font-semibold text-brand-ink/40 mb-1">
                            Uncategorized within {parent.name}
                          </p>
                        )}
                        {renderStockTable(directProducts)}
                      </div>
                    )}

                    {childGroups.map(({ category, products: childProducts }) => {
                      const childStock = childProducts.reduce((s, p) => s + productStock(p), 0);
                      return (
                        <div key={category._id} className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-brand-ink/70">
                              {category.name}
                            </p>
                            <p className="text-xs text-brand-ink/40">
                              {childProducts.length} products &middot; {childStock} units in stock
                            </p>
                          </div>
                          {renderStockTable(childProducts)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image zoom modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage.src}
            alt={zoomImage.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}