'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  C, Card, Btn, Field, Modal, Stat, PageHead, Table, td, tdr, DateRange, CsvBtn, Err, Badge,
  inp, inr, api, today, fmtDate, toDay, downloadCsv
} from '@/components/admin/ui';

const blank = () => ({ title: '', category: 'Other', amount: '', date: today(), paymentMethod: 'cash', vendor: '', notes: '' });

export default function ExpensesPage() {
  const t = today();
  const [range, setRange] = useState({ from: t.slice(0, 8) + '01', to: t });
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null); // null = closed
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ from: range.from, to: range.to });
      if (category) p.set('category', category);
      if (q.trim()) p.set('q', q.trim());
      setData(await api(`/api/admin/expenses?${p}`));
      setErr('');
    } catch (e) { setErr(e.message); }
  }, [range, category, q]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);

  async function save() {
    setBusy(true); setErr('');
    try {
      const body = { ...form, id: form._id };
      await api('/api/admin/expenses', { method: form._id ? 'PUT' : 'POST', body });
      setForm(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function remove(e) {
    if (!confirm(`Delete "${e.title}" (${inr(e.amount)})?`)) return;
    try { await api(`/api/admin/expenses?id=${e._id}`, { method: 'DELETE' }); load(); } catch (x) { setErr(x.message); }
  }
  const edit = (e) => setForm({ ...e, date: toDay(e.date), employee: e.employee?._id || '' });

  const s = data?.summary;
  const max = Math.max(1, ...(s?.byCategory || []).map((c) => c.amount));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHead title="Expenses" sub="Rent, salaries, packaging, ads and every other running cost">
        <CsvBtn onClick={() => downloadCsv(`expenses-${range.from}_to_${range.to}.csv`,
          ['Date', 'Title', 'Category', 'Amount', 'Method', 'Vendor', 'Employee', 'Notes'],
          (data?.expenses || []).map((e) => [toDay(e.date), e.title, e.category, e.amount, e.paymentMethod, e.vendor, e.employee?.name || '', e.notes]))} />
        <Btn onClick={() => setForm(blank())}><Plus size={15} /> Add expense</Btn>
      </PageHead>

      <div className="mb-4"><DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} /></div>
      <Err msg={err} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total expenses" value={inr(s?.total)} sub={`${s?.count || 0} entries`} tone="bad" />
        <Stat label="Top category" value={s?.byCategory?.[0]?.category || '-'} sub={s?.byCategory?.[0] ? inr(s.byCategory[0].amount) : ''} />
        <Stat label="Daily average" value={inr(s ? s.total / Math.max(1, Math.round((new Date(range.to) - new Date(range.from)) / 864e5) + 1) : 0)} />
        <Stat label="Biggest single" value={inr(Math.max(0, ...(data?.expenses || []).map((e) => e.amount)))} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card style={{ gridColumn: 'span 1' }}>
          <div className="text-sm font-medium mb-3">By category</div>
          {(s?.byCategory || []).map((c) => (
            <button key={c.category} onClick={() => setCategory(category === c.category ? '' : c.category)} className="block w-full text-left mb-2.5">
              <div className="flex justify-between text-xs mb-1"><span style={{ color: category === c.category ? C.PRIMARY : C.INK }}>{c.category}</span><span>{inr(c.amount)}</span></div>
              <div style={{ height: 6, background: C.WASH, borderRadius: 3 }}><div style={{ height: 6, width: `${(c.amount / max) * 100}%`, background: category === c.category ? C.PRIMARY : C.GOLD, borderRadius: 3 }} /></div>
            </button>
          ))}
          {!s?.byCategory?.length && <p className="text-sm" style={{ color: C.SOFT }}>No expenses in this period.</p>}
        </Card>

        <Card pad={false} style={{ gridColumn: 'span 2' }}>
          <div className="flex flex-wrap gap-2 p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>
            <input style={{ ...inp, flex: 1, minWidth: 160 }} placeholder="Search title, vendor, notes" value={q} onChange={(e) => setQ(e.target.value)} />
            <select style={{ ...inp, width: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {(data?.categories || []).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Table head={['Date', 'Expense', 'Category', '>Amount', '']} empty={data && !data.expenses.length ? 'No expenses match. Add one to get started.' : ''}>
            {(data?.expenses || []).map((e) => (
              <tr key={e._id}>
                <td style={td}>{fmtDate(toDay(e.date))}</td>
                <td style={td}>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs" style={{ color: C.SOFT }}>
                    {[e.vendor, e.employee?.name && `Staff: ${e.employee.name}`, e.payrollMonth && `For ${e.payrollMonth}`, e.paymentMethod.toUpperCase()].filter(Boolean).join(' • ')}
                  </div>
                </td>
                <td style={td}><Badge>{e.category}</Badge></td>
                <td style={tdr}>{inr(e.amount)}</td>
                <td style={tdr}>
                  <button onClick={() => edit(e)} aria-label="Edit" style={{ color: C.SOFT, marginRight: 10 }}><Pencil size={15} /></button>
                  <button onClick={() => remove(e)} aria-label="Delete" style={{ color: C.PRIMARY }}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      {form && (
        <Modal title={form._id ? 'Edit expense' : 'Add expense'} onClose={() => setForm(null)}>
          <Err msg={err} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" style={{ gridColumn: 'span 2' }}><input style={inp} value={form.title} onChange={set('title')} autoFocus placeholder="e.g. Shop rent - November" /></Field>
            <Field label="Category">
              <input style={inp} list="exp-cats" value={form.category} onChange={set('category')} />
              <datalist id="exp-cats">{(data?.categories || []).map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Amount (₹)"><input style={inp} type="number" min="0" value={form.amount} onChange={set('amount')} /></Field>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={set('date')} /></Field>
            <Field label="Paid via">
              <select style={inp} value={form.paymentMethod} onChange={set('paymentMethod')}>
                {['cash', 'upi', 'bank', 'card', 'other'].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="Vendor / paid to" style={{ gridColumn: 'span 2' }}><input style={inp} value={form.vendor} onChange={set('vendor')} /></Field>
            <Field label="Notes" style={{ gridColumn: 'span 2' }}><textarea style={{ ...inp, minHeight: 60 }} value={form.notes} onChange={set('notes')} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
