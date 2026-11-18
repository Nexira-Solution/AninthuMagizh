export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Expense from '@/models/Expense';
import { requireAdmin } from '@/lib/apiAuth';
import { isDate } from '@/lib/finance';
import { STATUS, computePayroll, daysInMonth } from '@/lib/payroll';

const json = (d, status = 200) => NextResponse.json(d, { status });
const MONTH_RE = /^\d{4}-\d{2}$/;

// GET ?date=YYYY-MM-DD          -> active employees + that day's records (keyed by employee id)
// GET ?month=YYYY-MM            -> monthly sheet + payroll (gross, paid, balance) per employee
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const sp = new URL(req.url).searchParams;
  const date = sp.get('date');
  const month = sp.get('month');

  if (isDate(date)) {
    const [employees, recs] = await Promise.all([
      Employee.find({ isActive: true }).sort({ name: 1 }).lean(),
      Attendance.find({ date }).lean()
    ]);
    const records = {};
    recs.forEach((r) => { records[String(r.employee)] = r; });
    return json({ employees, records });
  }

  if (month && MONTH_RE.test(month)) {
    const days = daysInMonth(month);
    const [from, to] = [`${month}-01`, `${month}-${String(days).padStart(2, '0')}`];
    const [recs, paidRows] = await Promise.all([
      Attendance.find({ date: { $gte: from, $lte: to } }).lean(),
      Expense.find({ payrollMonth: month, employee: { $ne: null } }).select('employee amount').lean()
    ]);
    const byEmp = new Map();
    recs.forEach((r) => {
      const k = String(r.employee);
      if (!byEmp.has(k)) byEmp.set(k, []);
      byEmp.get(k).push(r);
    });
    const paidBy = new Map();
    paidRows.forEach((e) => paidBy.set(String(e.employee), (paidBy.get(String(e.employee)) || 0) + e.amount));

    // active staff + anyone who has attendance this month (e.g. left mid-month)
    const employees = await Employee.find({
      $or: [{ isActive: true }, { _id: { $in: [...byEmp.keys()] } }]
    }).sort({ name: 1 }).lean();

    const sheet = {};
    const payroll = employees.map((e) => {
      const list = byEmp.get(String(e._id)) || [];
      sheet[String(e._id)] = Object.fromEntries(list.map((r) => [r.date, { status: r.status, overtimeHours: r.overtimeHours }]));
      const p = computePayroll(e, list, month);
      const paid = paidBy.get(String(e._id)) || 0;
      return { employee: e, ...p, paid, balance: p.gross - paid };
    });
    return json({ month, days, employees, sheet, payroll });
  }

  return json({ error: 'Pass ?date=YYYY-MM-DD or ?month=YYYY-MM' }, 400);
});

// POST { date, records: [{ employee, status, checkIn, checkOut, overtimeHours, note }] }
// An empty/unknown status clears that employee's record for the day.
export const POST = requireAdmin(async (req) => {
  await dbConnect();
  const b = await req.json().catch(() => ({}));
  if (!isDate(b.date)) return json({ error: 'Invalid date' }, 400);
  if (!Array.isArray(b.records)) return json({ error: 'No records' }, 400);

  const ops = [];
  for (const r of b.records) {
    if (!mongoose.isValidObjectId(r.employee)) continue;
    const filter = { employee: r.employee, date: b.date };
    if (!STATUS[r.status]) {
      ops.push({ deleteOne: { filter } });
      continue;
    }
    ops.push({
      updateOne: {
        filter,
        update: {
          $set: {
            status: r.status,
            checkIn: String(r.checkIn || ''),
            checkOut: String(r.checkOut || ''),
            overtimeHours: Math.max(0, Number(r.overtimeHours) || 0),
            note: String(r.note || '')
          }
        },
        upsert: true
      }
    });
  }
  if (ops.length) await Attendance.bulkWrite(ops);
  return json({ ok: true, saved: ops.length });
});
