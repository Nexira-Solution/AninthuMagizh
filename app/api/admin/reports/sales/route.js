export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/apiAuth';
import { parseRange, eachDay, getSalesTxns, summarizeTxns } from '@/lib/finance';

// GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
// -> summary, day-by-day table, top products, payment-method split and every transaction.
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const { from, to } = parseRange(new URL(req.url).searchParams);
  const txns = await getSalesTxns(from, to);
  const summary = summarizeTxns(txns);

  const blank = (date) => ({ date, orders: 0, invoices: 0, units: 0, subtotal: 0, discount: 0, shipping: 0, total: 0, cost: 0 });
  const days = new Map(eachDay(from, to).map((d) => [d, blank(d)]));
  const products = new Map();
  const methods = new Map();

  for (const t of txns) {
    const r = days.get(t.day) || blank(t.day);
    days.set(t.day, r);
    if (t.type === 'order') r.orders++; else r.invoices++;
    r.units += t.units; r.subtotal += t.subtotal; r.discount += t.discount;
    r.shipping += t.shipping; r.total += t.total; r.cost += t.cost;

    const key = t.method || 'other';
    const m = methods.get(key) || { method: key, count: 0, amount: 0 };
    m.count++; m.amount += t.total;
    methods.set(key, m);

    for (const i of t.items) {
      const p = products.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
      p.qty += i.qty; p.revenue += i.qty * i.price;
      products.set(i.name, p);
    }
  }

  const daily = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, profit: d.subtotal - d.discount - d.cost }));

  return NextResponse.json({
    range: { from, to },
    summary,
    daily,
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 10),
    byMethod: [...methods.values()].sort((a, b) => b.amount - a.amount),
    txns
  });
});
