'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatINR } from '@/lib/utils';
import { IndianRupee, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

// Theme: #8F1538 (primary), #C58A08 (secondary), #FFF9F0 (background), #E60062 (accent), #075447 (highlight), #29211E (text)
const INK = '#29211E';          // primary text
const INK_SOFT = '#8A7A70';     // muted text (derived warm gray)
const GOLD = '#C58A08';         // accent (gold) - icons
const LINE = '#E8D5C4';         // borders / dividers (soft warm)
const PAPER = '#FFF9F0';        // card background
const PRIMARY = '#8F1538';      // chart line, key numbers
const ACCENT = '#E60062';       // errors
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

function StatCell({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 sm:p-5" style={{ background: PAPER }}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon size={13} strokeWidth={1.75} style={{ color: GOLD }} />
        <p className="text-xs" style={{ color: INK_SOFT }}>{label}</p>
      </div>
      <p className="text-[22px] sm:text-[26px] leading-none" style={{ color: INK, fontFamily: FONT_SERIF }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-2" style={{ color: INK_SOFT }}>{sub}</p>}
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="p-5" style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '2px' }}>
      <h2 className="flex items-center gap-2 text-sm mb-4" style={{ color: INK }}>
        {Icon && <Icon size={15} strokeWidth={1.75} style={{ color: GOLD }} />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/dashboard')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Request failed with status ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm" style={{ color: INK_SOFT }}>Loading dashboard…</p>;
  }

  if (error) {
    return (
      <div className="p-5" style={{ background: PAPER, border: `1px solid ${ACCENT}`, borderRadius: '2px' }}>
        <p className="text-sm font-medium mb-1" style={{ color: ACCENT }}>Failed to load dashboard</p>
        <p className="text-sm" style={{ color: INK }}>{error}</p>
        <p className="text-xs mt-2" style={{ color: INK_SOFT }}>
          If this says "Unauthorized", your admin session may have expired — try logging in again.
        </p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm" style={{ color: INK_SOFT }}>No dashboard data available.</p>;
  }

  return (
    <div>
      <h1 className="text-[24px] sm:text-[28px] mb-6" style={{ fontFamily: FONT_SERIF, color: PRIMARY }}>
        Dashboard
      </h1>

      {/* Stats: one bordered strip, cells separated by hairlines */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-6 overflow-hidden"
        style={{ background: LINE, border: `1px solid ${LINE}`, borderRadius: '2px' }}
      >
        <StatCell
          icon={IndianRupee}
          label="Today's sales"
          value={formatINR(data.today?.sales ?? 0)}
          sub={`${data.today?.orders ?? 0} orders`}
        />
        <StatCell
          icon={IndianRupee}
          label="Weekly sales"
          value={formatINR(data.week?.sales ?? 0)}
          sub={`${data.week?.orders ?? 0} orders`}
        />
        <StatCell
          icon={IndianRupee}
          label="Monthly sales"
          value={formatINR(data.month?.sales ?? 0)}
          sub={`${data.month?.orders ?? 0} orders`}
        />
        <StatCell
          icon={ShoppingCart}
          label="Pending orders"
          value={data.pendingOrders ?? 0}
          sub="Need action"
        />
      </div>

      <div className="mb-6">
        <Panel title="Sales trend (last 14 days)">
          {data.trend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: LINE }}
                  tick={{ fill: INK_SOFT }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: INK_SOFT }}
                />
                <Tooltip
                  formatter={(v) => formatINR(v)}
                  contentStyle={{
                    background: PAPER,
                    border: `1px solid ${LINE}`,
                    borderRadius: 2,
                    fontSize: 12,
                    color: INK,
                    boxShadow: 'none',
                  }}
                  labelStyle={{ color: INK_SOFT }}
                  cursor={{ stroke: LINE }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: GOLD, stroke: PAPER, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm" style={{ color: INK_SOFT }}>No trend data available.</p>
          )}
        </Panel>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Panel title="Top selling products" icon={Package}>
          {data.topProducts?.length ? (
            <ul>
              {data.topProducts.map((p, i) => (
                <li
                  key={p._id}
                  className="flex justify-between gap-3 py-2.5 text-sm"
                  style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}
                >
                  <span style={{ color: INK }}>{p.name}</span>
                  <span className="shrink-0 font-medium" style={{ color: PRIMARY }}>{p.soldCount} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: INK_SOFT }}>No product data yet.</p>
          )}
        </Panel>

        <Panel title="Low stock alert" icon={AlertTriangle}>
          {!data.lowStock || data.lowStock.length === 0 ? (
            <p className="text-sm" style={{ color: INK_SOFT }}>All good — no low stock items.</p>
          ) : (
            <ul>
              {data.lowStock.map((p, i) => (
                <li
                  key={p._id}
                  className="py-2.5 text-sm"
                  style={{ color: INK, borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}