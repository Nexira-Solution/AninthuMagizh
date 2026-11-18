export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/apiAuth';
import { parseRange, dayStart, dayEnd, dayNoon, isDate, num } from '@/lib/finance';

const json = (d, status = 200) => NextResponse.json(d, { status });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const METHODS = ['cash', 'upi', 'bank', 'card', 'credit', 'other'];

const statusFor = (total, paid) => (paid <= 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial');

// Add (+) or remove (-) stock on a product variant/size. Respects the "common stock" mode.
async function adjustStock(productId, variantId, size, delta) {
  if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(variantId)) return false;
  const p = await Product.findById(productId).select('variants._id variants.stockMode variants.sizes.size').lean();
  const v = p?.variants?.find((x) => String(x._id) === String(variantId));
  if (!v) return false;
  const vid = new mongoose.Types.ObjectId(variantId);
  if (v.stockMode === 'common') {
    const r = await Product.updateOne({ _id: productId }, { $inc: { 'variants.$[v].commonStock': delta } }, { arrayFilters: [{ 'v._id': vid }] });
    return r.modifiedCount > 0;
  }
  if (!v.sizes?.some((s) => s.size === size)) return false;
  const r = await Product.updateOne(
    { _id: productId },
    { $inc: { 'variants.$[v].sizes.$[s].stock': delta } },
    { arrayFilters: [{ 'v._id': vid }, { 's.size': size }] }
  );
  return r.modifiedCount > 0;
}

function totals(items, b) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const discount = Math.max(0, num(b.discount));
  const tax = Math.max(0, num(b.tax));
  const shippingFee = Math.max(0, num(b.shippingFee));
  const total = Math.max(0, subtotal - discount + tax + shippingFee);
  return { subtotal, discount, tax, shippingFee, total };
}

// GET ?from=&to=&q=&status=  -> list + summary      |  GET ?id= -> one purchase
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const sp = new URL(req.url).searchParams;
  if (sp.get('id')) {
    const p = mongoose.isValidObjectId(sp.get('id')) ? await Purchase.findById(sp.get('id')).lean() : null;
    return p ? json(p) : json({ error: 'Not found' }, 404);
  }

  const { from, to } = parseRange(sp);
  const query = { date: { $gte: dayStart(from), $lte: dayEnd(to) } };
  const status = sp.get('status');
  const q = (sp.get('q') || '').trim();
  if (['paid', 'partial', 'unpaid'].includes(status)) query.paymentStatus = status;
  if (q) {
    const rx = { $regex: esc(q), $options: 'i' };
    query.$or = [{ 'supplier.name': rx }, { purchaseNumber: rx }, { billNumber: rx }, { 'items.name': rx }];
  }
  const purchases = await Purchase.find(query).sort({ date: -1, createdAt: -1 }).lean();
  const summary = purchases.reduce(
    (s, p) => {
      s.total += p.total; s.paid += p.paidAmount; s.due += Math.max(0, p.total - p.paidAmount);
      s.units += (p.items || []).reduce((n, i) => n + i.qty, 0);
      return s;
    },
    { total: 0, paid: 0, due: 0, units: 0, count: purchases.length }
  );
  const bySupplier = new Map();
  purchases.forEach((p) => bySupplier.set(p.supplier.name, (bySupplier.get(p.supplier.name) || 0) + p.total));
  summary.bySupplier = [...bySupplier.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  return json({ range: { from, to }, purchases, summary });
});

// POST { supplier:{name,phone,gstin}, billNumber, date, items:[{product,variantId,name,color,size,qty,unitCost}],
//        discount, tax, shippingFee, paidAmount, paymentMethod, notes, addToStock, updateCostPrice }
export const POST = requireAdmin(async (req) => {
  await dbConnect();
  const b = await req.json().catch(() => ({}));
  if (!String(b.supplier?.name || '').trim()) return json({ error: 'Supplier name is required' }, 400);
  if (!isDate(b.date)) return json({ error: 'Choose a valid date' }, 400);
  if (!Array.isArray(b.items) || !b.items.length) return json({ error: 'Add at least one item' }, 400);

  const items = [];
  for (const i of b.items) {
    const qty = Number(i.qty);
    const unitCost = Number(i.unitCost);
    if (!String(i.name || '').trim()) return json({ error: 'Every item needs a name' }, 400);
    if (!Number.isInteger(qty) || qty < 1) return json({ error: 'Quantity must be a whole number, 1 or more' }, 400);
    if (!(unitCost >= 0)) return json({ error: 'Invalid unit cost' }, 400);
    items.push({
      product: mongoose.isValidObjectId(i.product) ? i.product : null,
      variantId: i.variantId || '',
      name: String(i.name).trim(),
      sku: i.sku || '',
      color: i.color || '',
      size: i.size || '',
      qty,
      unitCost,
      stockAdded: false
    });
  }

  const t = totals(items, b);
  const paidAmount = Math.min(t.total, Math.max(0, num(b.paidAmount)));

  // Stock first; remember which lines were applied so a failure can roll them back.
  const applied = [];
  try {
    if (b.addToStock) {
      for (const it of items) {
        if (it.product && it.variantId) {
          const ok = await adjustStock(it.product, it.variantId, it.size, it.qty);
          if (ok) { it.stockAdded = true; applied.push(it); }
        }
      }
    }
    if (b.updateCostPrice) {
      for (const it of items) {
        if (it.product) await Product.updateOne({ _id: it.product }, { $set: { costPrice: it.unitCost } });
      }
    }
    const purchase = await Purchase.create({
      purchaseNumber: `PUR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`,
      supplier: {
        name: String(b.supplier.name).trim(),
        phone: String(b.supplier.phone || ''),
        gstin: String(b.supplier.gstin || '').toUpperCase()
      },
      billNumber: String(b.billNumber || ''),
      date: dayNoon(b.date),
      items,
      ...t,
      paidAmount,
      paymentStatus: statusFor(t.total, paidAmount),
      paymentMethod: METHODS.includes(b.paymentMethod) ? b.paymentMethod : 'cash',
      notes: String(b.notes || '')
    });
    return json({ purchase }, 201);
  } catch (e) {
    for (const it of applied) await adjustStock(it.product, it.variantId, it.size, -it.qty).catch(() => {});
    return json({ error: 'Could not save purchase: ' + e.message }, 500);
  }
});

// PUT { id, addPayment }  -> record a payment against the balance
// PUT { id, supplier, billNumber, date, notes, paymentMethod, discount, tax, shippingFee, paidAmount }
// Items are NOT editable (stock would go out of sync) - delete and re-create the purchase instead.
export const PUT = requireAdmin(async (req) => {
  await dbConnect();
  const b = await req.json().catch(() => ({}));
  const p = mongoose.isValidObjectId(b.id) ? await Purchase.findById(b.id) : null;
  if (!p) return json({ error: 'Purchase not found' }, 404);

  if (b.addPayment !== undefined) {
    const amt = Number(b.addPayment);
    if (!(amt > 0)) return json({ error: 'Enter a payment amount' }, 400);
    if (amt > p.total - p.paidAmount + 0.001) return json({ error: 'Payment is more than the balance due' }, 400);
    p.paidAmount += amt;
  } else {
    if (b.supplier?.name !== undefined) {
      if (!String(b.supplier.name).trim()) return json({ error: 'Supplier name is required' }, 400);
      p.supplier = { name: String(b.supplier.name).trim(), phone: String(b.supplier.phone || ''), gstin: String(b.supplier.gstin || '').toUpperCase() };
    }
    if (b.billNumber !== undefined) p.billNumber = String(b.billNumber);
    if (isDate(b.date)) p.date = dayNoon(b.date);
    if (b.notes !== undefined) p.notes = String(b.notes);
    if (METHODS.includes(b.paymentMethod)) p.paymentMethod = b.paymentMethod;
    const t = totals(p.items, { discount: b.discount ?? p.discount, tax: b.tax ?? p.tax, shippingFee: b.shippingFee ?? p.shippingFee });
    Object.assign(p, t);
    if (b.paidAmount !== undefined) p.paidAmount = Math.max(0, num(b.paidAmount));
  }
  p.paidAmount = Math.min(p.paidAmount, p.total);
  p.paymentStatus = statusFor(p.total, p.paidAmount);
  await p.save();
  return json({ purchase: p.toObject() });
});

// DELETE ?id=  -> removes the purchase and takes back any stock it added
export const DELETE = requireAdmin(async (req) => {
  await dbConnect();
  const id = new URL(req.url).searchParams.get('id');
  const p = mongoose.isValidObjectId(id) ? await Purchase.findById(id) : null;
  if (!p) return json({ error: 'Purchase not found' }, 404);
  for (const it of p.items) {
    if (it.stockAdded) await adjustStock(it.product, it.variantId, it.size, -it.qty).catch(() => {});
  }
  await Purchase.deleteOne({ _id: p._id });
  return json({ ok: true });
});
