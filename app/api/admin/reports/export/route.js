import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/apiAuth';
import { parseRange, getSalesTxns } from '@/lib/finance';

// GET /api/admin/reports/export?from=2026-01-01&to=2026-01-31 -> CSV download
// Includes online orders AND manual (counter) invoices, with cost and profit per row.
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const { from, to } = parseRange(new URL(req.url).searchParams);
  const txns = await getSalesTxns(from, to);

  const header = [
    'Type', 'Number', 'Date', 'Customer', 'Items', 'Units', 'Subtotal', 'Discount', 'Shipping',
    'Total', 'Cost', 'Profit (before shipping)', 'Payment Method', 'Payment Status', 'Status'
  ];
  const rows = txns.map((t) => [
    t.type === 'order' ? 'Online order' : 'Invoice',
    t.number,
    new Date(t.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    t.customer,
    t.items.map((i) => `${i.name} (${i.color}/${i.size} x${i.qty})`).join('; '),
    t.units, t.subtotal, t.discount, t.shipping, t.total, t.cost,
    t.subtotal - t.discount - t.cost,
    t.method, t.paymentStatus, t.status
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sales-report-${from}_to_${to}.csv"`
    }
  });
});
