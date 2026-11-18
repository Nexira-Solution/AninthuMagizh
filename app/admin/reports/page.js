'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  C, Card, Btn, Stat, PageHead, Table, Tabs, td, tdr, DateRange, CsvBtn, Err, Badge,
  inr, pct, api, today, fmtDate, toDay, downloadCsv
} from '@/components/admin/ui';

export default function ReportsPage() {
  const t = today();
  const [tab, setTab] = useState('sales');
  const [range, setRange] = useState({ from: t.slice(0, 8) + '01', to: t });
  return (
    <div>
      <PageHead title="Reports" sub="Daily sales from online orders and invoices, plus profit and loss" />
      <Tabs value={tab} onChange={setTab} tabs={[['sales', 'Daily sales'], ['pl', 'Profit & loss']]} />
      <div className="mb-4"><DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} /></div>
      {tab === 'sales' ? <Sales range={range} /> : <ProfitLoss range={range} />}
    </div>
  );
}

// ───────────────────────── Daily sales ─────────────────────────
function Sales({ range }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);

  const load = useCallback(async () => {
    try { setD(await api(`/api/admin/reports/sales?from=${range.from}&to=${range.to}`)); setErr(''); } catch (e) { setErr(e.message); }
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const s = d?.summary;
  const rows = (d?.daily || []).filter((r) => !onlyActive || r.orders + r.invoices > 0);
  const max = Math.max(1, ...(d?.daily || []).map((r) => r.total));
  const best = (d?.daily || []).reduce((b, r) => (r.total > (b?.total || 0) ? r : b), null);

  return (
    <div>
      <Err msg={err} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total collected" value={inr(s?.total)} sub={`${s?.count || 0} sales • ${s?.units || 0} units`} />
        <Stat label="Net sales" value={inr(s?.netSales)} sub={`after ${inr(s?.discount)} discounts`} />
        <Stat label="Gross profit" value={inr(s?.grossProfit)} tone={s?.grossProfit < 0 ? 'bad' : 'good'} sub={s?.cost ? `cost ${inr(s.cost)}` : 'set product cost prices'} />
        <Stat label="Average sale" value={inr(s?.avgOrder)} sub={best ? `best day ${fmtDate(best.date)}` : ''} />
        <Stat label="Online orders" value={s?.orders || 0} />
        <Stat label="Invoices (counter)" value={s?.invoices || 0} />
        <Stat label="Shipping collected" value={inr(s?.shipping)} />
        <Stat label="Payment pending" value={inr(s?.pending)} tone={s?.pending ? 'bad' : undefined} />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div className="text-sm font-medium mb-3">Sales per day</div>
        <div className="flex items-end gap-px overflow-x-auto" style={{ height: 120 }}>
          {(d?.daily || []).map((r) => (
            <div key={r.date} title={`${fmtDate(r.date)}: ${inr(r.total)}`} style={{ flex: '1 0 8px', maxWidth: 28, height: `${Math.max(2, (r.total / max) * 100)}%`, background: r.total ? C.PRIMARY : C.LINE, borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      </Card>

      <Card pad={false} style={{ marginBottom: 16 }}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>
          <div className="text-sm font-medium">Day by day</div>
          <div className="flex items-center gap-3">
            <label className="text-xs flex items-center gap-1.5" style={{ color: C.SOFT }}><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Hide days with no sales</label>
            <CsvBtn onClick={() => downloadCsv(`daily-sales-${range.from}_to_${range.to}.csv`,
              ['Date', 'Online orders', 'Invoices', 'Units', 'Subtotal', 'Discount', 'Shipping', 'Total', 'Cost', 'Profit'],
              (d?.daily || []).map((r) => [r.date, r.orders, r.invoices, r.units, r.subtotal, r.discount, r.shipping, r.total, r.cost, r.profit]))} />
            <a href={`/api/admin/reports/export?from=${range.from}&to=${range.to}`}><Btn variant="ghost" type="button">All transactions CSV</Btn></a>
          </div>
        </div>
        <Table head={['Date', '>Orders', '>Invoices', '>Units', '>Net sales', '>Shipping', '>Total', '>Profit']} empty={d && !rows.length ? 'No sales in this period.' : ''}>
          {rows.map((r) => {
            const list = (d.txns || []).filter((x) => x.day === r.date);
            const isOpen = open === r.date;
            return (
              <Fragment key={r.date}>
                <tr onClick={() => list.length && setOpen(isOpen ? '' : r.date)} style={{ cursor: list.length ? 'pointer' : 'default', background: isOpen ? C.WASH : undefined }}>
                  <td style={td}>{fmtDate(r.date)}</td>
                  <td style={tdr}>{r.orders}</td><td style={tdr}>{r.invoices}</td><td style={tdr}>{r.units}</td>
                  <td style={tdr}>{inr(r.subtotal - r.discount)}</td><td style={tdr}>{inr(r.shipping)}</td>
                  <td style={{ ...tdr, fontWeight: 500 }}>{inr(r.total)}</td>
                  <td style={{ ...tdr, color: r.profit < 0 ? C.PRIMARY : C.GREEN }}>{inr(r.profit)}</td>
                </tr>
                {isOpen && (
                  <tr><td colSpan={8} style={{ padding: 0, background: C.PAPER }}>
                    <div className="px-4 py-3 space-y-2">
                      {list.map((x) => (
                        <div key={x.id} className="text-xs flex flex-wrap justify-between gap-2 pb-2" style={{ borderBottom: `1px dashed ${C.LINE}` }}>
                          <div>
                            <span className="font-medium text-sm">{x.number}</span> <Badge color={x.type === 'order' ? C.PRIMARY : C.GOLD}>{x.type === 'order' ? 'Online' : 'Invoice'}</Badge>{' '}
                            <span style={{ color: C.SOFT }}>{x.customer} • {x.method.toUpperCase()} • {x.paymentStatus}</span>
                            <div style={{ color: C.SOFT }}>{x.items.map((i) => `${i.name}${i.color || i.size ? ` (${[i.color, i.size].filter(Boolean).join('/')})` : ''} x${i.qty}`).join(', ')}</div>
                          </div>
                          <div className="text-right text-sm">{inr(x.total)}<div className="text-xs" style={{ color: C.SOFT }}>{new Date(x.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div></div>
                        </div>
                      ))}
                    </div>
                  </td></tr>
                )}
              </Fragment>
            );
          })}
        </Table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card pad={false}>
          <div className="text-sm font-medium p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>Top products</div>
          <Table head={['Product', '>Qty', '>Revenue']} empty={d && !d.topProducts.length ? 'Nothing sold yet.' : ''}>
            {(d?.topProducts || []).map((p) => <tr key={p.name}><td style={td}>{p.name}</td><td style={tdr}>{p.qty}</td><td style={tdr}>{inr(p.revenue)}</td></tr>)}
          </Table>
        </Card>
        <Card pad={false}>
          <div className="text-sm font-medium p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>By payment method</div>
          <Table head={['Method', '>Sales', '>Amount']} empty={d && !d.byMethod.length ? 'No sales yet.' : ''}>
            {(d?.byMethod || []).map((m) => <tr key={m.method}><td style={td}>{m.method.toUpperCase()}</td><td style={tdr}>{m.count}</td><td style={tdr}>{inr(m.amount)}</td></tr>)}
          </Table>
        </Card>
      </div>
      <p className="text-xs mt-3" style={{ color: C.SOFT }}>
        Counts online orders (not cancelled, returned, failed or refunded) plus manual invoices from the Invoices section. Invoices made from an order are not counted twice.
      </p>
    </div>
  );
}

// ───────────────────────── Profit & loss ─────────────────────────
function ProfitLoss({ range }) {
  const [method, setMethod] = useState('cost');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setD(await api(`/api/admin/reports/profit-loss?from=${range.from}&to=${range.to}&method=${method}`)); setErr(''); } catch (e) { setErr(e.message); }
  }, [range, method]);
  useEffect(() => { load(); }, [load]);

  const Row = ({ label, value, bold, indent, tone, sub }) => (
    <div className="flex justify-between py-1.5" style={{ paddingLeft: indent ? 16 : 0, borderTop: bold ? `1px solid ${C.LINE}` : undefined, fontWeight: bold ? 500 : 400 }}>
      <span style={{ color: bold ? C.INK : C.SOFT }}>{label}{sub && <span className="text-xs"> {sub}</span>}</span>
      <span style={{ color: tone === 'bad' ? C.PRIMARY : tone === 'good' ? C.GREEN : C.INK }}>{inr(value)}</span>
    </div>
  );

  return (
    <div>
      <Err msg={err} />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex" role="group" aria-label="Cost method">
          {[['cost', 'Cost of goods sold'], ['purchases', 'Purchases in period']].map(([k, l]) => (
            <button key={k} onClick={() => setMethod(k)} className="text-xs px-3 py-2"
              style={{ border: `1px solid ${method === k ? C.PRIMARY : C.LINE}`, background: method === k ? C.PRIMARY : 'transparent', color: method === k ? C.PAPER : C.INK }}>{l}</button>
          ))}
        </div>
        <span className="text-xs" style={{ color: C.SOFT }}>{method === 'cost' ? 'Units sold × product cost price' : 'Everything you bought in this period counts as cost'}</span>
        {d && <CsvBtn onClick={() => downloadCsv(`profit-loss-${range.from}_to_${range.to}.csv`,
          ['Line', 'Amount'],
          [['Gross sales', d.revenue.subtotal], ['Discounts', -d.revenue.discount], ['Net sales', d.revenue.netSales], ['Cost of goods', d.cogs], ['Gross profit', d.grossProfit],
            ['Shipping collected', d.revenue.shipping], ...d.expenses.byCategory.map((c) => [`Expense: ${c.category}`, -c.amount]), ['Total expenses', -d.expenses.total], ['Net profit', d.netProfit]])} />}
      </div>

      {d?.missingCost && (
        <div className="text-sm px-3 py-2 mb-3" style={{ background: '#FFF3D6', color: '#7A5600', borderRadius: 4 }}>
          No cost price is set on the products you sold, so cost shows as ₹0 and profit is overstated. Add a cost price to your products (or record Purchases with “Set product cost price”), or switch to “Purchases in period”.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Net sales" value={inr(d?.revenue.netSales)} />
        <Stat label="Gross profit" value={inr(d?.grossProfit)} sub={`${pct(d?.grossMargin)} margin`} tone={d?.grossProfit < 0 ? 'bad' : 'good'} />
        <Stat label="Expenses" value={inr(d?.expenses.total)} tone="bad" />
        <Stat label={d?.netProfit < 0 ? 'Net loss' : 'Net profit'} value={inr(d?.netProfit)} sub={`${pct(d?.netMargin)} of net sales`} tone={d?.netProfit < 0 ? 'bad' : 'good'} />
      </div>

      {d && (
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <div className="text-sm font-medium mb-2">Profit &amp; loss statement</div>
            <div className="text-sm">
              <Row label="Gross sales" value={d.revenue.subtotal} sub={`(${d.revenue.orders} orders, ${d.revenue.invoices} invoices)`} />
              <Row label="Less: discounts" value={-d.revenue.discount} indent />
              <Row label="Net sales" value={d.revenue.netSales} bold />
              <Row label={method === 'cost' ? 'Less: cost of goods sold' : 'Less: purchases'} value={-d.cogs} indent />
              <Row label="Gross profit" value={d.grossProfit} bold tone={d.grossProfit < 0 ? 'bad' : 'good'} />
              <Row label="Add: shipping collected" value={d.revenue.shipping} indent />
              {d.expenses.byCategory.map((c) => <Row key={c.category} label={`Less: ${c.category}`} value={-c.amount} indent />)}
              <Row label="Total expenses" value={-d.expenses.total} bold />
              <Row label={d.netProfit < 0 ? 'Net loss' : 'Net profit'} value={d.netProfit} bold tone={d.netProfit < 0 ? 'bad' : 'good'} />
            </div>
          </Card>
          <Card>
            <div className="text-sm font-medium mb-2">Also in this period</div>
            <div className="text-sm">
              <Row label={`Purchases (${d.purchases.count} bills)`} value={d.purchases.total} />
              <Row label="Still owed to suppliers" value={d.purchases.due} tone={d.purchases.due ? 'bad' : undefined} />
            </div>
            <p className="text-xs mt-2" style={{ color: C.SOFT }}>
              Units sold: {d.revenue.units}. Purchases are stock you bought, not an expense by themselves — with “Cost of goods sold” they only hit profit when the goods are sold.
            </p>
          </Card>
        </div>
      )}

      <Card pad={false}>
        <div className="text-sm font-medium p-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>Month by month</div>
        <Table head={['Month', '>Net sales', '>Cost', '>Gross profit', '>Shipping', '>Expenses', '>Net profit']} empty={d && !d.monthly.length ? 'No data in this period.' : ''}>
          {(d?.monthly || []).map((m) => (
            <tr key={m.month}>
              <td style={td}>{new Date(m.month + '-01T00:00:00Z').toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</td>
              <td style={tdr}>{inr(m.netSales)}</td><td style={tdr}>{inr(m.cogs)}</td><td style={tdr}>{inr(m.grossProfit)}</td>
              <td style={tdr}>{inr(m.shipping)}</td><td style={tdr}>{inr(m.expenses)}</td>
              <td style={{ ...tdr, fontWeight: 500, color: m.netProfit < 0 ? C.PRIMARY : C.GREEN }}>{inr(m.netProfit)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
