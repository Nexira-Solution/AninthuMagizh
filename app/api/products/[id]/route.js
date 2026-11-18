import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/apiAuth';
import { getProductPageData, getFilter } from '@/lib/products';
import { computeBasePrice } from '@/lib/pricing';
import { sanitizeFreeShipping } from '@/lib/freeShipping';
import { sanitizeOptionGroups } from '@/lib/optionGroups';
import { sanitizeDiscount } from '@/lib/discount';
import { NO_SIZE } from '@/lib/noSize';

// Updates skip schema validators, so clean each variant's stock fields here.
// - Only touches a variant that actually sends `stockMode`, so a partial update
//   that doesn't know about common stock never flips a variant back to per-size.
// - 'common' -> commonStock >= 0 and every size row's own stock is forced to 0
//   (the shared pool is the only stock that counts).
// - 'size'   -> commonStock reset to 0.
// - A no-size ("One Size") variant can never be common: it has nothing to choose.
function sanitizeVariantStock(variants) {
  if (!Array.isArray(variants)) return variants;
  return variants.map((v) => {
    if (!v || !('stockMode' in v)) return v;

    const hasRealSizes = (v.sizes || []).some((s) => s.size && s.size !== NO_SIZE);
    const isCommon = v.stockMode === 'common' && hasRealSizes;

    return {
      ...v,
      stockMode: isCommon ? 'common' : 'size',
      commonStock: isCommon ? Math.max(0, Number(v.commonStock) || 0) : 0,
      sizes: isCommon
        ? (v.sizes || []).map((s) => ({ ...s, stock: 0 }))
        : v.sizes,
    };
  });
}

// Admin read (?admin=1): always fresh, includes inactive products, and the
// category stays a plain id so the edit form can post it back safely.
// costPrice IS included here (admin only), so the edit form can show and re-save it.
const adminGet = requireAdmin(async (req, { params }) => {
  const { id } = await params;
  await dbConnect();
  const product = await Product.findOne(getFilter(id)).lean();
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(
    { product: JSON.parse(JSON.stringify(product)) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
});

export async function GET(req, ctx) {
  if (new URL(req.url).searchParams.get('admin') === '1') return adminGet(req, ctx);

  const { id } = await ctx.params; // works on Next 14 and 15

  // Same cached function the product page uses (includes the category
  // sizeChart fallback, isActive / isApproved filters, parallel queries).
  // NOTE: getProductPageData in lib/products must NOT return costPrice.
  const data = await getProductPageData(id);
  if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}

export const PUT = requireAdmin(async (req, { params }) => {
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  const current = await Product.findOne(getFilter(id)).select('_id category sku').lean();
  if (!current) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // SKU is auto-managed and permanently locked after creation.
  delete body.sku;

  // Weight is entered manually in grams; never allow negatives (updates skip schema validators)
  if ('weight' in body) body.weight = Math.max(0, Number(body.weight) || 0);

  // Cost price (₹ per piece, admin-only). Only touched when the request sends it,
  // so partial updates (e.g. the inventory page saving stock) never wipe it.
  if ('costPrice' in body) body.costPrice = Math.max(0, Number(body.costPrice) || 0);

  // Clean freeShipping / freeShippingStates (updates skip schema validators)
  sanitizeFreeShipping(body);

  // Clean discount block. Only touched when the request actually sends it, so
  // partial updates (e.g. the inventory page saving stock) never wipe it.
  sanitizeDiscount(body);

  // Clean admin-defined option groups (updates skip schema validators).
  // Only touched when the request actually sends them, so partial updates
  // (e.g. the inventory page saving stock) never wipe a product's options.
  if ('optionGroups' in body) body.optionGroups = sanitizeOptionGroups(body.optionGroups);

  if (body.variants?.length) {
    // Clean stockMode / commonStock (updates skip schema validators)
    body.variants = sanitizeVariantStock(body.variants);
    body.basePrice = computeBasePrice(body.variants);
  }

  // Persists whatever is on body (sizeChart / isReadyToShip / sleeveOptions /
  // zipOptions / optionGroups / pantOptions / shawlOptions / freeShipping /
  // freeShippingStates / discount / weight / costPrice / variants[].stockMode /
  // variants[].commonStock) as long as the schema defines them.
  const product = await Product.findOneAndUpdate(getFilter(id), body, { new: true });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  revalidateTag('products'); // storefront shows the edit immediately
  revalidatePath('/');
  revalidatePath('/discounts');
  return NextResponse.json({ product });
});

export const DELETE = requireAdmin(async (req, { params }) => {
  const { id } = await params;
  await dbConnect();
  await Product.findOneAndDelete(getFilter(id));

  revalidateTag('products');
  revalidatePath('/');
  revalidatePath('/discounts');
  return NextResponse.json({ success: true });
});