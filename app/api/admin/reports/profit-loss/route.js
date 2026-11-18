export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Expense from '@/models/Expense';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/apiAuth';
import { parseRange, dayStart, dayEnd, dateKey, getSalesTxns, summarizeTxns } from '@/lib/finance';

// GET /api/admin/reports/profit-loss?from=&to=&method=cost|purchases
//   method=cost       COGS = units sold x product cost price (accrual - recommended)
//   method=purchases  COGS = everything bought in the period (simple cash view)
//
//   Net sales      = sum(subtotal) - discounts          (online orders + manual invoices)
//   Gross profit   = Net sales - COGS
//   Net profit     = Gross profit + shipping collected - operating expenses
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const sp = new URL(req.url).searchParams;
  const { from, to } = parseRange(sp);
  const method = sp.get('method') === 'purchases' ? 'purchases' : 'cost';
  const range = { $gte: dayStart(from), $lte: dayEnd(to) };

  const [txns, expenses, purchases] = await Promise.all([
    getSalesTxns(from, to),
    Expense.find({ date: range }).lean(),
    Purchase.find({ date: range }).lean()
  ]);

  const s = summarizeTxns(txns);
  const purchaseTotal = purchases.reduce((a, p) => a + p.total, 0);
  const purchaseDue = purchases.reduce((a, p) => a + Math.max(0, p.total - p.paidAmount), 0);
  const cogs = method === 'purchases' ? purchaseTotal : s.cost;

  const cat = new Map();
  let totalExpenses = 0;
  expenses.forEach((e) => { totalExpenses += e.amount; cat.set(e.category, (cat.get(e.category) || 0) + e.amount); });

  const grossProfit = s.netSales - cogs;
  const netProfit = grossProfit + s.shipping - totalExpenses;

  // month-by-month trend
  const months = new Map();
  const m = (k) => {
    if (!months.has(k)) months.set(k, { month: k, netSales: 0, shipping: 0, cogs: 0, expenses: 0 });
    return months.get(k);
  };
  txns.forEach((t) => {
    const r = m(t.day.slice(0, 7));
    r.netSales += t.subtotal - t.discount; r.shipping += t.shipping;
    if (method === 'cost') r.cogs += t.cost;
  });
  if (method === 'purchases') purchases.forEach((p) => { m(dateKey(p.date).slice(0, 7)).cogs += p.total; });
  expenses.forEach((e) => { m(dateKey(e.date).slice(0, 7)).expenses += e.amount; });
  const monthly = [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ ...r, grossProfit: r.netSales - r.cogs, netProfit: r.netSales - r.cogs + r.shipping - r.expenses }));

  return NextResponse.json({
    range: { from, to },
    method,
    revenue: { subtotal: s.subtotal, discount: s.discount, netSales: s.netSales, shipping: s.shipping, orders: s.orders, invoices: s.invoices, units: s.units },
    cogs,
    grossProfit,
    grossMargin: s.netSales ? (grossProfit / s.netSales) * 100 : 0,
    expenses: {
      total: totalExpenses,
      byCategory: [...cat.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
    },
    netProfit,
    netMargin: s.netSales ? (netProfit / s.netSales) * 100 : 0,
    purchases: { total: purchaseTotal, due: purchaseDue, count: purchases.length },
    missingCost: method === 'cost' && s.netSales > 0 && s.cost === 0,
    monthly
  });
});
