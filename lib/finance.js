import Order from '@/models/Order';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';

export const num = (v) => Number(v) || 0;

export const EXPENSE_CATEGORIES = [
  'Salary', 'Salary Advance', 'Rent', 'Electricity', 'Internet & Phone', 'Packaging',
  'Courier / Shipping', 'Marketing & Ads', 'Maintenance', 'Transport', 'Tax & Fees',
  'Software / Subscriptions', 'Food & Tea', 'Other'
];
export const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'card', 'other'];

// ───────── dates (everything is calendar-day based in IST) ─────────
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (s) => DATE_RE.test(String(s || ''));
export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const dateKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const dayStart = (s) => new Date(`${s}T00:00:00.000+05:30`);
export const dayEnd = (s) => new Date(`${s}T23:59:59.999+05:30`);
// Expenses / purchases only carry a day, so store them at noon IST (never crosses a day edge)
export const dayNoon = (s) => new Date(`${s}T12:00:00.000+05:30`);

// ?from=YYYY-MM-DD&to=YYYY-MM-DD  (defaults: 1st of this month -> today)
export function parseRange(sp) {
  const t = todayStr();
  let from = sp.get('from');
  let to = sp.get('to');
  if (!isDate(from)) from = t.slice(0, 8) + '01';
  if (!isDate(to)) to = t;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

export function eachDay(from, to, cap = 92) {
  const out = [];
  const d = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (d <= end && out.length < cap) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ───────── sales (online orders + manual invoices) ─────────
// Invoices created FROM an order are skipped on purpose: the order is already counted.
// Only manual (counter / offline) invoices add new sales.
export async function getSalesTxns(from, to) {
  const range = { $gte: dayStart(from), $lte: dayEnd(to) };
  const [orders, invoices] = await Promise.all([
    Order.find({
      createdAt: range,
      status: { $nin: ['cancelled', 'returned'] },
      paymentStatus: { $nin: ['failed', 'refunded'] }
    }).lean(),
    Invoice.find({ createdAt: range, source: 'manual', paymentStatus: { $ne: 'failed' } }).lean()
  ]);

  // Old rows have no cost snapshot -> fall back to the product's current cost price
  const need = new Set();
  [...orders, ...invoices].forEach((t) =>
    (t.items || []).forEach((i) => {
      if (i.costPrice == null && i.product && !i.isCombo) need.add(String(i.product));
    })
  );
  const prods = need.size
    ? await Product.find({ _id: { $in: [...need] } }).select('costPrice').lean()
    : [];
  const costMap = new Map(prods.map((p) => [String(p._id), num(p.costPrice)]));

  const unitCost = (i) => (i.costPrice != null ? num(i.costPrice) : costMap.get(String(i.product)) || 0);

  const mk = (t, type) => {
    const items = t.items || [];
    return {
      id: String(t._id),
      type, // 'order' (online) | 'invoice' (counter / manual)
      number: type === 'order' ? t.orderNumber : t.invoiceNumber,
      date: t.createdAt,
      day: dateKey(t.createdAt),
      customer: t.customer?.name || '',
      units: items.reduce((s, i) => s + num(i.qty), 0),
      subtotal: num(t.subtotal),
      discount: num(t.discount),
      shipping: num(t.shippingFee),
      total: num(t.total),
      cost: items.reduce((s, i) => s + unitCost(i) * num(i.qty), 0),
      method: t.paymentMethod || '',
      paymentStatus: t.paymentStatus || '',
      status: t.status || 'completed',
      items: items.map((i) => ({
        name: i.name, color: i.color || '', size: i.size || '', qty: num(i.qty), price: num(i.price)
      }))
    };
  };

  return [...orders.map((o) => mk(o, 'order')), ...invoices.map((v) => mk(v, 'invoice'))].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}

export function summarizeTxns(txns) {
  const s = {
    count: txns.length, orders: 0, invoices: 0, units: 0, subtotal: 0, discount: 0,
    shipping: 0, total: 0, cost: 0, pending: 0
  };
  for (const t of txns) {
    if (t.type === 'order') s.orders++; else s.invoices++;
    s.units += t.units; s.subtotal += t.subtotal; s.discount += t.discount;
    s.shipping += t.shipping; s.total += t.total; s.cost += t.cost;
    if (t.paymentStatus === 'pending') s.pending += t.total;
  }
  s.netSales = s.subtotal - s.discount;
  s.grossProfit = s.netSales - s.cost;
  s.avgOrder = s.count ? s.total / s.count : 0;
  return s;
}
