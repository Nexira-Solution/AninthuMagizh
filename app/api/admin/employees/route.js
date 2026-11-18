export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import { requireAdmin } from '@/lib/apiAuth';

const json = (d, status = 200) => NextResponse.json(d, { status });

function pick(b) {
  return {
    name: String(b.name || '').trim(),
    phone: String(b.phone || '').trim(),
    role: String(b.role || '').trim(),
    salaryType: b.salaryType === 'daily' ? 'daily' : 'monthly',
    salary: Math.max(0, Number(b.salary) || 0),
    overtimeRate: Math.max(0, Number(b.overtimeRate) || 0),
    joinDate: b.joinDate ? new Date(b.joinDate) : null,
    isActive: b.isActive !== false,
    notes: String(b.notes || '')
  };
}

// GET /api/admin/employees?all=1  (all=1 includes inactive staff)
export const GET = requireAdmin(async (req) => {
  await dbConnect();
  const all = new URL(req.url).searchParams.get('all') === '1';
  const employees = await Employee.find(all ? {} : { isActive: true }).sort({ name: 1 }).lean();
  return json({ employees });
});

export const POST = requireAdmin(async (req) => {
  await dbConnect();
  const data = pick(await req.json().catch(() => ({})));
  if (!data.name) return json({ error: 'Employee name is required' }, 400);
  const employee = await Employee.create(data);
  return json({ employee }, 201);
});

export const PUT = requireAdmin(async (req) => {
  await dbConnect();
  const b = await req.json().catch(() => ({}));
  if (!mongoose.isValidObjectId(b.id)) return json({ error: 'Invalid employee' }, 400);
  const data = pick(b);
  if (!data.name) return json({ error: 'Employee name is required' }, 400);
  const employee = await Employee.findByIdAndUpdate(b.id, { $set: data }, { new: true }).lean();
  return employee ? json({ employee }) : json({ error: 'Employee not found' }, 404);
});

// Employees that already have attendance are only deactivated, so history is never lost.
export const DELETE = requireAdmin(async (req) => {
  await dbConnect();
  const id = new URL(req.url).searchParams.get('id');
  if (!mongoose.isValidObjectId(id)) return json({ error: 'Invalid employee' }, 400);
  const used = await Attendance.exists({ employee: id });
  if (used) {
    await Employee.updateOne({ _id: id }, { $set: { isActive: false } });
    return json({ ok: true, deactivated: true });
  }
  await Employee.deleteOne({ _id: id });
  return json({ ok: true, deleted: true });
});
