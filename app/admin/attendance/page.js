'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import { STATUS, STATUS_KEYS } from '@/lib/payroll';
import {
  C, Card, Btn, Field, Modal, Stat, PageHead, Table, Tabs, td, tdr, Err, Badge, CsvBtn,
  inp, inr, api, today, addDays, fmtDate, downloadCsv
} from '@/components/admin/ui';

const monthNow = () => today().slice(0, 7);
const shiftMonth = (m, n) => { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); };
const monthLabel = (m) => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function AttendancePage() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(today());
  return (
    <div>
      <PageHead title="Employee attendance" sub="Mark daily attendance, review the month and pay salaries" />
      <Tabs value={tab} onChange={setTab} tabs={[['daily', 'Daily attendance'], ['monthly', 'Monthly sheet'], ['payroll', 'Payroll'], ['staff', 'Employees']]} />
      {tab === 'daily' && <Daily date={date} setDate={setDate} />}
      {tab === 'monthly' && <Monthly onPick={(d) => { setDate(d); setTab('daily'); }} />}
      {tab === 'payroll' && <Payroll />}
      {tab === 'staff' && <Staff />}
    </div>
  );
}

// ───────────────────────── Daily ─────────────────────────
function Daily({ date, setDate }) {
  const [emps, setEmps] = useState([]);
  const [rows, setRows] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/admin/attendance?date=${date}`);
      setEmps(d.employees);
      const m = {};
      d.employees.forEach((e) => {
        const r = d.records[e._id];
        m[e._id] = { status: r?.status || '', checkIn: r?.checkIn || '', checkOut: r?.checkOut || '', overtimeHours: r?.overtimeHours || 0, note: r?.note || '' };
      });
      setRows(m); setErr(''); setMsg('');
    } catch (e) { setErr(e.message); }
  }, [date]);
  useEffect(() => { load(); }, [load]);

  const set = (id, patch) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const markAll = (status) => setRows((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, status }])));

  async function save() {
    setBusy(true); setErr(''); setMsg('');
    try {
      await api('/api/admin/attendance', { method: 'POST', body: { date, records: emps.map((e) => ({ employee: e._id, ...rows[e._id] })) } });
      setMsg('Attendance saved');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const counts = {};
  Object.values(rows).forEach((r) => { if (r.status) counts[r.status] = (counts[r.status] || 0) + 1; });
  const unmarked = emps.filter((e) => !rows[e._id]?.status).length;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <Btn variant="ghost" onClick={() => setDate(addDays(date, -1))}>←</Btn>
        <Field label="Date"><input type="date" style={{ ...inp, width: 160 }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        <Btn variant="ghost" onClick={() => setDate(addDays(date, 1))}>→</Btn>
        <Btn variant="ghost" onClick={() => setDate(today())}>Today</Btn>
        <div className="flex-1" />
        <Btn variant="ghost" onClick={() => markAll('present')}>Mark all present</Btn>
        <Btn variant="ghost" onClick={() => markAll('weekly-off')}>All weekly off</Btn>
        <Btn variant="ghost" onClick={() => markAll('holiday')}>All holiday</Btn>
        <Btn onClick={save} disabled={busy || !emps.length}><Save size={15} /> {busy ? 'Saving…' : 'Save attendance'}</Btn>
      </div>
      <Err msg={err} />
      {msg && <div className="text-sm px-3 py-2 mb-3" style={{ color: C.GREEN, background: '#E5F2EE', borderRadius: 4 }}>{msg}</div>}

      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {STATUS_KEYS.map((k) => counts[k] ? <Badge key={k} color={STATUS[k].color}>{STATUS[k].label}: {counts[k]}</Badge> : null)}
        {unmarked > 0 && <Badge>Not marked: {unmarked}</Badge>}
      </div>

      <Card pad={false}>
        <Table head={['Employee', 'Status', 'In', 'Out', '>OT hrs', 'Note']} empty={!emps.length ? 'No active employees yet. Add them in the Employees tab.' : ''}>
          {emps.map((e) => {
            const r = rows[e._id] || {};
            return (
              <tr key={e._id}>
                <td style={td}><div className="font-medium">{e.name}</div><div className="text-xs" style={{ color: C.SOFT }}>{e.role}</div></td>
                <td style={td}>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_KEYS.map((k) => {
                      const on = r.status === k;
                      return (
                        <button key={k} title={STATUS[k].label} onClick={() => set(e._id, { status: on ? '' : k })}
                          className="text-xs px-2 py-1 font-medium"
                          style={{ borderRadius: 4, border: `1px solid ${on ? STATUS[k].color : C.LINE}`, background: on ? STATUS[k].color : 'transparent', color: on ? '#fff' : C.SOFT }}>
                          {STATUS[k].short}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td style={td}><input type="time" style={{ ...inp, width: 110 }} value={r.checkIn || ''} onChange={(x) => set(e._id, { checkIn: x.target.value })} /></td>
                <td style={td}><input type="time" style={{ ...inp, width: 110 }} value={r.checkOut || ''} onChange={(x) => set(e._id, { checkOut: x.target.value })} /></td>
                <td style={td}><input type="number" min="0" step="0.5" style={{ ...inp, width: 70, textAlign: 'right' }} value={r.overtimeHours || 0} onChange={(x) => set(e._id, { overtimeHours: x.target.value })} /></td>
                <td style={td}><input style={{ ...inp, minWidth: 140 }} value={r.note || ''} onChange={(x) => set(e._id, { note: x.target.value })} /></td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <p className="text-xs mt-2" style={{ color: C.SOFT }}>
        {STATUS_KEYS.map((k) => `${STATUS[k].short} = ${STATUS[k].label}`).join('  •  ')}. Click the selected status again to clear it.
      </p>
      <p className="text-xs mt-1" style={{ color: C.SOFT }}>Viewing {fmtDate(date)}</p>
    </div>
  );
}

// ───────────────────────── Monthly sheet ─────────────────────────
function MonthNav({ month, setMonth }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Btn variant="ghost" onClick={() => setMonth(shiftMonth(month, -1))}>←</Btn>
      <div className="font-medium px-2" style={{ minWidth: 150, textAlign: 'center' }}>{monthLabel(month)}</div>
      <Btn variant="ghost" onClick={() => setMonth(shiftMonth(month, 1))}>→</Btn>
      <Btn variant="ghost" onClick={() => setMonth(monthNow())}>This month</Btn>
    </div>
  );
}

function useMonth(month) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { setD(await api(`/api/admin/attendance?month=${month}`)); setErr(''); } catch (e) { setErr(e.message); }
  }, [month]);
  useEffect(() => { load(); }, [load]);
  return { d, err, reload: load };
}

function Monthly({ onPick }) {
  const [month, setMonth] = useState(monthNow());
  const { d, err } = useMonth(month);
  const days = d ? Array.from({ length: d.days }, (_, i) => i + 1) : [];
  const dstr = (n) => `${month}-${String(n).padStart(2, '0')}`;

  return (
    <div>
      <MonthNav month={month} setMonth={setMonth} />
      <Err msg={err} />
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="text-xs" style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: C.WASH }}>
                <th className="px-3 py-2 text-left sticky left-0" style={{ background: C.WASH, minWidth: 140 }}>Employee</th>
                {days.map((n) => <th key={n} className="px-1 py-2 font-medium" style={{ minWidth: 30, color: C.SOFT }}>{n}</th>)}
                {['P', 'HD', 'A', 'L'].map((h) => <th key={h} className="px-2 py-2" style={{ color: C.SOFT }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(d?.payroll || []).map(({ employee: e, count }) => (
                <tr key={e._id}>
                  <td className="px-3 py-1.5 font-medium sticky left-0" style={{ background: C.WHITE, borderTop: `1px solid ${C.LINE}` }}>{e.name}</td>
                  {days.map((n) => {
                    const r = d.sheet[e._id]?.[dstr(n)];
                    const s = r && STATUS[r.status];
                    return (
                      <td key={n} style={{ borderTop: `1px solid ${C.LINE}`, textAlign: 'center', padding: 2 }}>
                        <button onClick={() => onPick(dstr(n))} title={s ? s.label : 'Not marked'} className="w-7 h-7 font-medium"
                          style={{ borderRadius: 4, background: s ? s.color : 'transparent', color: s ? '#fff' : C.LINE, fontSize: 10 }}>
                          {s ? s.short : '·'}
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ ...tdr, padding: '4px 8px' }}>{count.present || 0}</td>
                  <td style={{ ...tdr, padding: '4px 8px' }}>{count['half-day'] || 0}</td>
                  <td style={{ ...tdr, padding: '4px 8px' }}>{count.absent || 0}</td>
                  <td style={{ ...tdr, padding: '4px 8px' }}>{(count['paid-leave'] || 0) + (count['unpaid-leave'] || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d && !d.payroll.length && <p className="text-sm text-center py-8" style={{ color: C.SOFT }}>No employees yet.</p>}
      </Card>
      <p className="text-xs mt-2" style={{ color: C.SOFT }}>Click any cell to open that day and edit it.</p>
    </div>
  );
}

// ───────────────────────── Payroll ─────────────────────────
function Payroll() {
  const [month, setMonth] = useState(monthNow());
  const { d, err, reload } = useMonth(month);
  const [pay, setPay] = useState(null);
  const [e2, setE2] = useState('');
  const [busy, setBusy] = useState(false);

  const totals = (d?.payroll || []).reduce((s, p) => ({ gross: s.gross + p.gross, paid: s.paid + p.paid, bal: s.bal + p.balance }), { gross: 0, paid: 0, bal: 0 });

  async function save() {
    setBusy(true); setE2('');
    try {
      await api('/api/admin/expenses', {
        method: 'POST',
        body: {
          title: `${pay.kind} - ${pay.name} (${monthLabel(month)})`, category: pay.kind, amount: pay.amount, date: pay.date,
          paymentMethod: pay.method, employee: pay.employee, payrollMonth: month, notes: pay.notes
        }
      });
      setPay(null); reload();
    } catch (e) { setE2(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <MonthNav month={month} setMonth={setMonth} />
      <Err msg={err} />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Payable this month" value={inr(totals.gross)} />
        <Stat label="Paid so far" value={inr(totals.paid)} tone="good" />
        <Stat label="Balance" value={inr(totals.bal)} tone={totals.bal > 0 ? 'bad' : undefined} />
      </div>
      <div className="flex justify-end mb-2">
        <CsvBtn onClick={() => downloadCsv(`payroll-${month}.csv`,
          ['Employee', 'Type', 'Rate', 'Pay days', 'Unmarked days', 'OT hours', 'Base', 'Overtime', 'Gross', 'Paid', 'Balance'],
          (d?.payroll || []).map((p) => [p.employee.name, p.employee.salaryType, p.employee.salary, p.payDays, p.unmarked, p.overtimeHours, p.base, p.overtime, p.gross, p.paid, p.balance]))} />
      </div>
      <Card pad={false}>
        <Table head={['Employee', '>Pay days', '>OT', '>Base', '>Overtime', '>Gross', '>Paid', '>Balance', '']} empty={d && !d.payroll.length ? 'No employees yet.' : ''}>
          {(d?.payroll || []).map((p) => (
            <tr key={p.employee._id}>
              <td style={td}>
                <div className="font-medium">{p.employee.name}</div>
                <div className="text-xs" style={{ color: C.SOFT }}>{inr(p.employee.salary)} / {p.employee.salaryType === 'daily' ? 'day' : 'month'}</div>
                {p.unmarked > 0 && <div className="text-xs" style={{ color: C.GOLD }}>{p.unmarked} day(s) not marked (unpaid)</div>}
              </td>
              <td style={tdr}>{p.payDays}</td>
              <td style={tdr}>{p.overtimeHours}h</td>
              <td style={tdr}>{inr(p.base)}</td>
              <td style={tdr}>{inr(p.overtime)}</td>
              <td style={{ ...tdr, fontWeight: 500 }}>{inr(p.gross)}</td>
              <td style={{ ...tdr, color: C.GREEN }}>{inr(p.paid)}</td>
              <td style={{ ...tdr, color: p.balance > 0 ? C.PRIMARY : C.SOFT }}>{inr(p.balance)}</td>
              <td style={tdr}>
                <Btn variant="ghost" style={{ padding: '4px 8px' }} onClick={() => setPay({ employee: p.employee._id, name: p.employee.name, kind: 'Salary', amount: Math.max(0, p.balance), date: today(), method: 'cash', notes: '' })}>Pay</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <p className="text-xs mt-2" style={{ color: C.SOFT }}>
        Monthly staff: salary ÷ days in month × paid days (holidays and weekly offs are paid). Daily staff: wage × days worked. Payments you record here appear in Expenses and in Profit &amp; Loss.
      </p>

      {pay && (
        <Modal title={`Pay ${pay.name}`} onClose={() => setPay(null)}>
          <Err msg={e2} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><select style={inp} value={pay.kind} onChange={(e) => setPay({ ...pay, kind: e.target.value })}><option>Salary</option><option>Salary Advance</option></select></Field>
            <Field label="Amount (₹)"><input style={inp} type="number" min="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="Date"><input style={inp} type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
            <Field label="Paid via"><select style={inp} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{['cash', 'upi', 'bank', 'card', 'other'].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select></Field>
            <Field label="Notes" style={{ gridColumn: 'span 2' }}><input style={inp} value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Btn variant="ghost" onClick={() => setPay(null)}>Cancel</Btn><Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ───────────────────────── Employees ─────────────────────────
const blankEmp = () => ({ name: '', phone: '', role: '', salaryType: 'monthly', salary: '', overtimeRate: 0, joinDate: '', isActive: true, notes: '' });

function Staff() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setList((await api('/api/admin/employees?all=1')).employees); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true); setErr('');
    try {
      await api('/api/admin/employees', { method: form._id ? 'PUT' : 'POST', body: { ...form, id: form._id } });
      setForm(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function remove(e) {
    if (!confirm(`Remove ${e.name}? If they have attendance history they will be set inactive instead.`)) return;
    try { await api(`/api/admin/employees?id=${e._id}`, { method: 'DELETE' }); load(); } catch (x) { setErr(x.message); }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="flex justify-end mb-3"><Btn onClick={() => { setForm(blankEmp()); setErr(''); }}><Plus size={15} /> Add employee</Btn></div>
      <Err msg={!form ? err : ''} />
      <Card pad={false}>
        <Table head={['Employee', 'Pay', '>OT rate', 'Joined', 'Status', '']} empty={!list.length ? 'No employees yet. Add your first one.' : ''}>
          {list.map((e) => (
            <tr key={e._id}>
              <td style={td}><div className="font-medium">{e.name}</div><div className="text-xs" style={{ color: C.SOFT }}>{[e.role, e.phone].filter(Boolean).join(' • ')}</div></td>
              <td style={td}>{inr(e.salary)} / {e.salaryType === 'daily' ? 'day' : 'month'}</td>
              <td style={tdr}>{inr(e.overtimeRate)}/hr</td>
              <td style={td}>{e.joinDate ? fmtDate(String(e.joinDate).slice(0, 10)) : '-'}</td>
              <td style={td}><Badge color={e.isActive ? C.GREEN : C.SOFT}>{e.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td style={tdr}>
                <button onClick={() => { setForm({ ...e, joinDate: e.joinDate ? String(e.joinDate).slice(0, 10) : '' }); setErr(''); }} aria-label="Edit" style={{ color: C.SOFT, marginRight: 10 }}><Pencil size={15} /></button>
                <button onClick={() => remove(e)} aria-label="Remove" style={{ color: C.PRIMARY }}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {form && (
        <Modal title={form._id ? 'Edit employee' : 'Add employee'} onClose={() => setForm(null)}>
          <Err msg={err} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input style={inp} value={form.name} onChange={set('name')} autoFocus /></Field>
            <Field label="Role"><input style={inp} value={form.role} onChange={set('role')} placeholder="Tailor, Packing, Sales…" /></Field>
            <Field label="Phone"><input style={inp} value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Joined on"><input style={inp} type="date" value={form.joinDate} onChange={set('joinDate')} /></Field>
            <Field label="Salary type"><select style={inp} value={form.salaryType} onChange={set('salaryType')}><option value="monthly">Monthly salary</option><option value="daily">Daily wage</option></select></Field>
            <Field label={form.salaryType === 'daily' ? 'Wage per day (₹)' : 'Monthly salary (₹)'}><input style={inp} type="number" min="0" value={form.salary} onChange={set('salary')} /></Field>
            <Field label="Overtime rate (₹ / hour)"><input style={inp} type="number" min="0" value={form.overtimeRate} onChange={set('overtimeRate')} /></Field>
            <Field label="Status"><select style={inp} value={form.isActive ? '1' : '0'} onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}><option value="1">Active</option><option value="0">Inactive</option></select></Field>
            <Field label="Notes" style={{ gridColumn: 'span 2' }}><textarea style={{ ...inp, minHeight: 56 }} value={form.notes} onChange={set('notes')} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save employee'}</Btn></div>
        </Modal>
      )}
    </div>
  );
}
