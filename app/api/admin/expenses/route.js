export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { requireAdmin } from '@/lib/apiAuth';
import { parseRange, dayStart, dayEnd, dayNoon, isDate, dateKey, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/finance';

const json = (d, status = 200) => NextResponse.json(d, { status });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function clean(b) {
  const amount = Number(b.amount);
  if (!String(b.title || '').trim()) return { error: 'Title is required' };
  if (!(amount > 0)) return { error: 'Amount must be greater than 0' };
  if (!isDate(b.date)) return { error: 'Choose a valid date' };
  return {
    data: {
      title: String(b.title).trim(),
      category: String(b.category || 'Other').trim() || 'Other',
      amount,
      date: dayNoon(b.date),
      paymentMethod: PAYMENT_METHODS.includes(b.paymentMethod) ? b.paymentMethod : 'cash',
      vendor: String(b.vendor || '').trim(),
      notes: String(b.notes || ''),
      employee: mongoose.isValidObjectId(b.employee) ? b.employee : null,
      payrollMonth: /^\d{4}-\d{2}$/.test(b.payrollMonth || '') ? b.payrollMonth : ''
    }
  };
}

// GET ?from=&to=&category=&q=  -> list + summary (total, by category, by day)
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const sp = new URL(req.url).searchParams;
  const { from, to } = parseRange(sp);
  const query = { date: { $gte: dayStart(from), $lte: dayEnd(to) } };
  const category = sp.get('category');
  const q = (sp.get('q') || '').trim();
  if (category) query.category = category;
  if (q) {
    const rx = { $regex: esc(q), $options: 'i' };
    query.$or = [{ title: rx }, { vendor: rx }, { notes: rx }];
  }

  const list = await Expense.find(query).populate('employee', 'name').sort({ date: -1, createdAt: -1 }).lean();
  const byCat = new Map();
  const byDay = new Map();
  let total = 0;
  for (const e of list) {
    total += e.amount;
    byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
    const d = dateKey(e.date);
    byDay.set(d, (byDay.get(d) || 0) + e.amount);
  }
  return json({
    range: { from, to },
    expenses: list,
    summary: {
      total,
      count: list.length,
      byCategory: [...byCat.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
      byDay: [...byDay.entries()].map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date))
    },
    categories: EXPENSE_CATEGORIES
  });
});

export const POST = requireAdmin(async (req) => {
  await dbConnect();
  const { data, error } = clean(await req.json().catch(() => ({})));
  if (error) return json({ error }, 400);
  const expense = await Expense.create(data);
  return json({ expense }, 201);
});

export const PUT = requireAdmin(async (req) => {
  await dbConnect();
  const b = await req.json().catch(() => ({}));
  if (!mongoose.isValidObjectId(b.id)) return json({ error: 'Invalid expense' }, 400);
  const { data, error } = clean(b);
  if (error) return json({ error }, 400);
  const expense = await Expense.findByIdAndUpdate(b.id, { $set: data }, { new: true }).lean();
  return expense ? json({ expense }) : json({ error: 'Expense not found' }, 404);
});

export const DELETE = requireAdmin(async (req) => {
  await dbConnect();
  const id = new URL(req.url).searchParams.get('id');
  if (!mongoose.isValidObjectId(id)) return json({ error: 'Invalid expense' }, 400);
  await Expense.deleteOne({ _id: id });
  return json({ ok: true });
});
