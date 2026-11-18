'use client';

import { useEffect } from 'react';
import { X, Download } from 'lucide-react';

// Same crimson / gold / cream tokens as AdminShell
export const C = {
  INK: '#29211E', SOFT: '#8A7A70', PRIMARY: '#8F1538', GOLD: '#C58A08',
  WASH: '#F6EADB', LINE: '#E8D5C4', PAPER: '#FFF9F0', GREEN: '#075447', PINK: '#E60062', WHITE: '#FFFFFF'
};

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const pct = (n) => (Number(n) || 0).toFixed(1) + '%';
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export function addDays(s, n) {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const fmtDate = (s) =>
  new Date(String(s).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const toDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export async function api(url, opts) {
  const init = opts && opts.body && typeof opts.body !== 'string'
    ? { ...opts, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts.body) }
    : opts;
  const r = await fetch(url, init);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export function downloadCsv(name, header, rows) {
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const inp = {
  width: '100%', padding: '8px 10px', fontSize: 14, color: C.INK, background: C.WHITE,
  border: `1px solid ${C.LINE}`, borderRadius: 4, outline: 'none'
};

export function Card({ children, style, pad = true }) {
  return <div style={{ background: C.WHITE, border: `1px solid ${C.LINE}`, borderRadius: 6, padding: pad ? 16 : 0, ...style }}>{children}</div>;
}

export function Btn({ variant = 'primary', style, ...p }) {
  const v = {
    primary: { background: C.PRIMARY, color: C.PAPER, border: `1px solid ${C.PRIMARY}` },
    ghost: { background: 'transparent', color: C.INK, border: `1px solid ${C.LINE}` },
    danger: { background: 'transparent', color: C.PRIMARY, border: `1px solid ${C.PRIMARY}` },
    gold: { background: C.GOLD, color: C.WHITE, border: `1px solid ${C.GOLD}` }
  }[variant];
  return (
    <button
      {...p}
      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 disabled:opacity-50"
      style={{ borderRadius: 4, cursor: p.disabled ? 'not-allowed' : 'pointer', ...v, ...style }}
    />
  );
}

export function Field({ label, children, style }) {
  return (
    <label className="block" style={style}>
      <span className="block text-xs mb-1" style={{ color: C.SOFT }}>{label}</span>
      {children}
    </label>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-medium" style={{ color: C.PRIMARY }}>{title}</h1>
        {sub && <p className="text-sm mt-0.5" style={{ color: C.SOFT }}>{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  const color = tone === 'good' ? C.GREEN : tone === 'bad' ? C.PRIMARY : C.INK;
  return (
    <Card style={{ padding: 14 }}>
      <div className="text-xs" style={{ color: C.SOFT }}>{label}</div>
      <div className="text-xl font-medium mt-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: C.SOFT }}>{sub}</div>}
    </Card>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 mb-4 overflow-x-auto" style={{ borderBottom: `1px solid ${C.LINE}` }}>
      {tabs.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className="px-4 py-2 text-sm font-medium whitespace-nowrap"
          style={{ color: value === k ? C.PRIMARY : C.SOFT, borderBottom: `2px solid ${value === k ? C.GOLD : 'transparent'}`, marginBottom: -1 }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4" style={{ background: 'rgba(41,33,30,0.5)' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full my-6" style={{ maxWidth: wide ? 860 : 520, background: C.PAPER, borderRadius: 8, border: `1px solid ${C.LINE}` }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.LINE}` }}>
          <h2 className="font-medium" style={{ color: C.PRIMARY }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: C.SOFT }}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.WASH }}>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: C.SOFT, textAlign: h.startsWith('>') ? 'right' : 'left' }}>
                {h.replace(/^>/, '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <p className="text-sm text-center py-8" style={{ color: C.SOFT }}>{empty}</p>}
    </div>
  );
}
export const td = { padding: '9px 12px', borderTop: `1px solid ${C.LINE}`, verticalAlign: 'top' };
export const tdr = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };

// from/to picker with presets
export function DateRange({ from, to, onChange }) {
  const t = today();
  const mStart = t.slice(0, 8) + '01';
  const lm = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 2, 1));
  const lmStart = lm.toISOString().slice(0, 10);
  const lmEnd = addDays(mStart, -1);
  const presets = [
    ['Today', t, t], ['Yesterday', addDays(t, -1), addDays(t, -1)], ['Last 7 days', addDays(t, -6), t],
    ['This month', mStart, t], ['Last month', lmStart, lmEnd]
  ];
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1">
        {presets.map(([l, f, e]) => {
          const on = f === from && e === to;
          return (
            <button key={l} onClick={() => onChange(f, e)} className="text-xs px-2.5 py-1.5" style={{ borderRadius: 4, border: `1px solid ${on ? C.PRIMARY : C.LINE}`, background: on ? C.PRIMARY : 'transparent', color: on ? C.PAPER : C.INK }}>{l}</button>
          );
        })}
      </div>
      <input type="date" value={from} max={to} onChange={(e) => e.target.value && onChange(e.target.value, to)} style={{ ...inp, width: 140 }} aria-label="From date" />
      <span className="text-xs pb-2" style={{ color: C.SOFT }}>to</span>
      <input type="date" value={to} min={from} onChange={(e) => e.target.value && onChange(from, e.target.value)} style={{ ...inp, width: 140 }} aria-label="To date" />
    </div>
  );
}

export function CsvBtn({ onClick }) {
  return <Btn variant="ghost" onClick={onClick}><Download size={15} /> Export CSV</Btn>;
}

export function Badge({ children, color = C.SOFT }) {
  return <span className="text-xs px-2 py-0.5" style={{ borderRadius: 999, color, border: `1px solid ${color}` }}>{children}</span>;
}

export function Err({ msg }) {
  return msg ? <div className="text-sm px-3 py-2 mb-3" style={{ color: C.PRIMARY, background: '#FBE9EE', borderRadius: 4 }}>{msg}</div> : null;
}
