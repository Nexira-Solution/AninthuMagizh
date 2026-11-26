'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import {
  C, Card, Btn, Field, Modal, Stat, Table, PageHead, td, tdr, DateRange, CsvBtn, Err, Badge,
  inp, inr, api, today, fmtDate, toDay, downloadCsv
} from '@/components/admin/ui';

/* ───────────────────────── Shared ───────────────────────── */

const STATUS_COLOR = { paid: C.GREEN, partial: C.GOLD, unpaid: C.PRIMARY };

/* ───────────────────────── Page (tabs) ───────────────────────── */

export default function PurchasesPage() {
  const t = today();
  const [tab, setTab] = useState('purchases');
  const [range, setRange] = useState({ from: t.slice(0, 8) + '01', to: t });

  // open the right tab from ?tab=expenses (used by the old /admin/expenses redirect)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'expenses') setTab('expenses');
  }, []);

  function switchTab(next) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'expenses') url.searchParams.set('tab', 'expenses');
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url);
  }

  const tabs = [['purchases', 'Purchases'], ['expenses', 'Expenses']];

  return (
    <div>
      <div className="flex gap-1 mb-4" style={{ borderBottom: `1px solid ${C.LINE}` }}>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => switchTab(k)}
            className="px-4 py-2 text-sm font-medium"
            style={{
              color: tab === k ? C.PRIMARY : C.SOFT,
              borderBottom: `2px solid ${tab === k ? C.PRIMARY : 'transparent'}`,
              marginBottom: -1
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'purchases'
        ? <PurchasesTab range={range} setRange={setRange} />
        : <ExpensesTab range={range} setRange={setRange} />}
    </div>
  );
}

/* ───────────────────────── Purchases tab ───────────────────────── */

const newItem = () => ({ product: '', variantId: '', name: '', color: '', size: '', qty: 1, unitCost: '' });
const blankPurchase = () => ({
  supplier: { name: '', phone: '', gstin: '' }, billNumber: '', date: today(), items: [newItem()],
  discount: 0, tax: 0, shippingFee: 0, paidAmount: '', paymentMethod: 'cash', notes: '',
  addToStock: true, updateCostPrice: true
});

function PurchasesTab({ range, setRange }) {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);
  const [pay, setPay] = useState('');
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ from: range.from, to: range.to });
      if (status) p.set('status', status);
      if (q.trim()) p.set('q', q.trim());
      setData(await api(`/api/admin/purchases?${p}`));
      setErr('');
    } catch (e) { setErr(e.message); }
  }, [range, status, q]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);

  async function openForm() {
    setForm(blankPurchase()); setErr('');
    if (!products.length) {
      try { setProducts((await api('/api/admin/products')).products || []); } catch {}
    }
  }

  const totals = useMemo(() => {
    if (!form) return {};
    const subtotal = form.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0);
    const total = Math.max(0, subtotal - (Number(form.discount) || 0) + (Number(form.tax) || 0) + (Number(form.shippingFee) || 0));
    return { subtotal, total };
  }, [form]);

  const setItem = (idx, patch) => setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  function pickProduct(idx, id) {
    const p = products.find((x) => x._id === id);
    if (!p) return setItem(idx, { product: '', variantId: '', name: '', color: '', size: '' });
    const v = p.variants?.[0];
    setItem(idx, {
      product: id, name: p.name, variantId: v?._id || '', color: v?.color || '', size: v?.sizes?.[0]?.size || '',
      unitCost: p.costPrice || ''
    });
  }
  function pickVariant(idx, vid) {
    const p = products.find((x) => x._id === form.items[idx].product);
    const v = p?.variants?.find((x) => x._id === vid);
    setItem(idx, { variantId: vid, color: v?.color || '', size: v?.sizes?.[0]?.size || '' });
  }

  async function save() {
    setBusy(true); setErr('');
    try {
      const paid = form.paidAmount === '' ? totals.total : Number(form.paidAmount);
      await api('/api/admin/purchases', { method: 'POST', body: { ...form, paidAmount: paid } });
      setForm(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function addPayment() {
    try {
      const r = await api('/api/admin/purchases', { method: 'PUT', body: { id: view._id, addPayment: Number(pay) } });
      setView(r.purchase); setPay(''); load(); setErr('');
    } catch (e) { setErr(e.message); }
  }
  async function remove(p) {
    const stock = p.items.some((i) => i.stockAdded) ? ' The stock it added will be taken back.' : '';
    if (!confirm(`Delete ${p.purchaseNumber}?${stock}`)) return;
    try { await api(`/api/admin/purchases?id=${p._id}`, { method: 'DELETE' }); setView(null); load(); } catch (e) { setErr(e.message); }
  }

  const s = data?.summary;
  const sup = (k) => (e) => setForm((f) => ({ ...f, supplier: { ...f.supplier, [k]: e.target.value } }));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHead title="Purchases" sub="Stock and material bought from suppliers, with payments and dues">
        <CsvBtn onClick={() => downloadCsv(`purchases-${range.from}_to_${range.to}.csv`,
          ['Number', 'Date', 'Supplier', 'Bill No', 'Items', 'Subtotal', 'Discount', 'Tax', 'Shipping', 'Total', 'Paid', 'Due', 'Status'],
          (data?.purchases || []).map((p) => [p.purchaseNumber, toDay(p.date), p.supplier.name, p.billNumber,
            p.items.map((i) => `${i.name} x${i.qty}`).join('; '), p.subtotal, p.discount, p.tax, p.shippingFee, p.total, p.paidAmount, p.total - p.paidAmount, p.paymentStatus]))} />
        <Btn onClick={openForm}><Plus size={15} /> New purchase</Btn>
      </PageHead>

      <div className="mb-4"><DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} /></div>
      <Err msg={!form && !view ? err : ''} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total purchased" value={inr(s?.total)} sub={`${s?.count || 0} bills • ${s?.units || 0} units`} />
        <Stat label="Paid" value={inr(s?.paid)} tone="good" />
        <Stat label="Due to suppliers" value={inr(s?.due)} tone={s?.due ? 'bad' : undefined} />
        <Stat label="Top supplier" value={s?.bySupplier?.[0]?.name || '-'} sub={s?.bySupplier?.[0] ? inr(s.bySupplier[0].amount) : ''} />
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap gap-2 p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>
          <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Search supplier, bill no, item" value={q} onChange={(e) => setQ(e.target.value)} />
          <select style={{ ...inp, width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All payments</option><option value="paid">Paid</option><option value="partial">Partly paid</option><option value="unpaid">Unpaid</option>
          </select>
        </div>
        <Table head={['Date', 'Purchase', 'Supplier', '>Total', '>Due', 'Status', '']} empty={data && !data.purchases.length ? 'No purchases in this period.' : ''}>
          {(data?.purchases || []).map((p) => (
            <tr key={p._id}>
              <td style={td}>{fmtDate(toDay(p.date))}</td>
              <td style={td}><div className="font-medium">{p.purchaseNumber}</div><div className="text-xs" style={{ color: C.SOFT }}>{p.items.length} item(s){p.billNumber ? ` • Bill ${p.billNumber}` : ''}</div></td>
              <td style={td}>{p.supplier.name}</td>
              <td style={tdr}>{inr(p.total)}</td>
              <td style={{ ...tdr, color: p.total - p.paidAmount > 0 ? C.PRIMARY : C.SOFT }}>{inr(p.total - p.paidAmount)}</td>
              <td style={td}><Badge color={STATUS_COLOR[p.paymentStatus]}>{p.paymentStatus}</Badge></td>
              <td style={tdr}>
                <button onClick={() => { setView(p); setPay(''); setErr(''); }} aria-label="View" style={{ color: C.SOFT, marginRight: 10 }}><Eye size={16} /></button>
                <button onClick={() => remove(p)} aria-label="Delete" style={{ color: C.PRIMARY }}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {view && (
        <Modal title={view.purchaseNumber} onClose={() => setView(null)} wide>
          <Err msg={err} />
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
            <div><div className="text-xs" style={{ color: C.SOFT }}>Supplier</div>{view.supplier.name}<div className="text-xs" style={{ color: C.SOFT }}>{[view.supplier.phone, view.supplier.gstin].filter(Boolean).join(' • ')}</div></div>
            <div><div className="text-xs" style={{ color: C.SOFT }}>Date / Bill no</div>{fmtDate(toDay(view.date))}{view.billNumber ? ` • ${view.billNumber}` : ''}</div>
            <div><div className="text-xs" style={{ color: C.SOFT }}>Payment</div>{view.paymentMethod.toUpperCase()} • <Badge color={STATUS_COLOR[view.paymentStatus]}>{view.paymentStatus}</Badge></div>
          </div>
          <Card pad={false}>
            <Table head={['Item', '>Qty', '>Unit cost', '>Amount']}>
              {view.items.map((i, k) => (
                <tr key={k}>
                  <td style={td}>{i.name}<div className="text-xs" style={{ color: C.SOFT }}>{[i.color, i.size].filter(Boolean).join(' / ')}{i.stockAdded ? ' • added to stock' : ''}</div></td>
                  <td style={tdr}>{i.qty}</td><td style={tdr}>{inr(i.unitCost)}</td><td style={tdr}>{inr(i.qty * i.unitCost)}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <div className="text-sm mt-3 ml-auto" style={{ maxWidth: 260 }}>
            {[['Subtotal', view.subtotal], ['Discount', -view.discount], ['Tax', view.tax], ['Shipping', view.shippingFee]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-0.5"><span style={{ color: C.SOFT }}>{l}</span><span>{inr(v)}</span></div>
            ))}
            <div className="flex justify-between py-1 font-medium" style={{ borderTop: `1px solid ${C.LINE}` }}><span>Total</span><span>{inr(view.total)}</span></div>
            <div className="flex justify-between py-0.5"><span style={{ color: C.SOFT }}>Paid</span><span style={{ color: C.GREEN }}>{inr(view.paidAmount)}</span></div>
            <div className="flex justify-between py-0.5"><span style={{ color: C.SOFT }}>Balance due</span><span style={{ color: C.PRIMARY }}>{inr(view.total - view.paidAmount)}</span></div>
          </div>
          {view.total - view.paidAmount > 0 && (
            <div className="flex gap-2 items-end mt-4">
              <Field label="Record a payment (₹)" style={{ width: 200 }}><input style={inp} type="number" min="0" value={pay} onChange={(e) => setPay(e.target.value)} /></Field>
              <Btn onClick={addPayment} disabled={!pay}>Add payment</Btn>
              <Btn variant="ghost" onClick={() => setPay(String(view.total - view.paidAmount))}>Pay full balance</Btn>
            </div>
          )}
          {view.notes && <p className="text-sm mt-3" style={{ color: C.SOFT }}>{view.notes}</p>}
        </Modal>
      )}

      {form && (
        <Modal title="New purchase" onClose={() => setForm(null)} wide>
          <Err msg={err} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Supplier name" style={{ gridColumn: 'span 2' }}><input style={inp} value={form.supplier.name} onChange={sup('name')} autoFocus /></Field>
            <Field label="Phone"><input style={inp} value={form.supplier.phone} onChange={sup('phone')} /></Field>
            <Field label="GSTIN"><input style={inp} value={form.supplier.gstin} onChange={sup('gstin')} /></Field>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={set('date')} /></Field>
            <Field label="Supplier bill no"><input style={inp} value={form.billNumber} onChange={set('billNumber')} /></Field>
          </div>

          <div className="text-sm font-medium mt-5 mb-2">Items</div>
          {form.items.map((it, idx) => {
            const p = products.find((x) => x._id === it.product);
            const v = p?.variants?.find((x) => x._id === it.variantId);
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end p-2" style={{ background: C.WHITE, border: `1px solid ${C.LINE}`, borderRadius: 4 }}>
                <div className="col-span-12 sm:col-span-4">
                  <span className="block text-xs mb-1" style={{ color: C.SOFT }}>Product</span>
                  <select style={inp} value={it.product} onChange={(e) => pickProduct(idx, e.target.value)}>
                    <option value="">Other item (raw material, packaging…)</option>
                    {products.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
                  </select>
                </div>
                {p ? (
                  <>
                    <div className="col-span-6 sm:col-span-2"><span className="block text-xs mb-1" style={{ color: C.SOFT }}>Colour</span>
                      <select style={inp} value={it.variantId} onChange={(e) => pickVariant(idx, e.target.value)}>{p.variants.map((x) => <option key={x._id} value={x._id}>{x.color || 'Default'}</option>)}</select></div>
                    <div className="col-span-6 sm:col-span-2"><span className="block text-xs mb-1" style={{ color: C.SOFT }}>Size</span>
                      <select style={inp} value={it.size} onChange={(e) => setItem(idx, { size: e.target.value })}>{(v?.sizes || []).map((s) => <option key={s.size}>{s.size}</option>)}</select></div>
                  </>
                ) : (
                  <div className="col-span-12 sm:col-span-4"><span className="block text-xs mb-1" style={{ color: C.SOFT }}>Item name</span>
                    <input style={inp} value={it.name} onChange={(e) => setItem(idx, { name: e.target.value })} /></div>
                )}
                <div className="col-span-4 sm:col-span-1"><span className="block text-xs mb-1" style={{ color: C.SOFT }}>Qty</span>
                  <input style={inp} type="number" min="1" value={it.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} /></div>
                <div className="col-span-5 sm:col-span-2"><span className="block text-xs mb-1" style={{ color: C.SOFT }}>Unit cost (₹)</span>
                  <input style={inp} type="number" min="0" value={it.unitCost} onChange={(e) => setItem(idx, { unitCost: e.target.value })} /></div>
                <div className="col-span-3 sm:col-span-1 text-right pb-2">
                  {form.items.length > 1 && <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} aria-label="Remove item" style={{ color: C.PRIMARY }}><Trash2 size={15} /></button>}
                </div>
              </div>
            );
          })}
          <Btn variant="ghost" onClick={() => setForm((f) => ({ ...f, items: [...f.items, newItem()] }))}><Plus size={14} /> Add item</Btn>

          <div className="grid sm:grid-cols-2 gap-5 mt-5">
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={form.addToStock} onChange={(e) => setForm((f) => ({ ...f, addToStock: e.target.checked }))} /><span>Add quantities to product stock<br /><span className="text-xs" style={{ color: C.SOFT }}>Only for lines linked to a product, colour and size.</span></span></label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={form.updateCostPrice} onChange={(e) => setForm((f) => ({ ...f, updateCostPrice: e.target.checked }))} /><span>Set product cost price to this unit cost<br /><span className="text-xs" style={{ color: C.SOFT }}>Feeds the profit figures in reports.</span></span></label>
              <Field label="Notes"><textarea style={{ ...inp, minHeight: 56 }} value={form.notes} onChange={set('notes')} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2 content-start">
              <Field label="Discount (₹)"><input style={inp} type="number" min="0" value={form.discount} onChange={set('discount')} /></Field>
              <Field label="Tax / GST (₹)"><input style={inp} type="number" min="0" value={form.tax} onChange={set('tax')} /></Field>
              <Field label="Freight (₹)"><input style={inp} type="number" min="0" value={form.shippingFee} onChange={set('shippingFee')} /></Field>
              <Field label="Paid via"><select style={inp} value={form.paymentMethod} onChange={set('paymentMethod')}>{['cash', 'upi', 'bank', 'card', 'credit', 'other'].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select></Field>
              <Field label="Amount paid now (₹)" style={{ gridColumn: 'span 2' }}><input style={inp} type="number" min="0" placeholder={`Blank = fully paid (${inr(totals.total)})`} value={form.paidAmount} onChange={set('paidAmount')} /></Field>
              <div className="col-span-2 flex justify-between text-sm pt-1"><span style={{ color: C.SOFT }}>Bill total</span><span className="font-medium">{inr(totals.total)}</span></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save purchase'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── Expenses tab ───────────────────────── */

const blankExpense = () => ({ title: '', category: 'Other', amount: '', date: today(), paymentMethod: 'cash', vendor: '', notes: '' });

function ExpensesTab({ range, setRange }) {
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
  const edit = (e) => { setErr(''); setForm({ ...e, date: toDay(e.date), employee: e.employee?._id || '' }); };

  const s = data?.summary;
  const max = Math.max(1, ...(s?.byCategory || []).map((c) => c.amount));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHead title="Expenses" sub="Rent, salaries, packaging, ads and every other running cost">
        <CsvBtn onClick={() => downloadCsv(`expenses-${range.from}_to_${range.to}.csv`,
          ['Date', 'Title', 'Category', 'Amount', 'Method', 'Vendor', 'Employee', 'Notes'],
          (data?.expenses || []).map((e) => [toDay(e.date), e.title, e.category, e.amount, e.paymentMethod, e.vendor, e.employee?.name || '', e.notes]))} />
        <Btn onClick={() => { setErr(''); setForm(blankExpense()); }}><Plus size={15} /> Add expense</Btn>
      </PageHead>

      <div className="mb-4"><DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} /></div>
      <Err msg={!form ? err : ''} />

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