'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ListTree, ShoppingCart, Boxes, Image as ImageIcon, Sparkles, BellRing,ShoppingBag,Wallet,CalendarCheck,
  Clapperboard, Star, Ticket, Layers, FileBarChart, Settings as SettingsIcon, Menu, X, LogOut, Percent,
  Receipt
} from 'lucide-react';

// Design tokens: same crimson / gold / cream system as the rest of the site.
// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const INK = '#29211E';        // main text
const INK_SOFT = '#8A7A70';   // muted warm gray for secondary text
const PRIMARY = '#8F1538';    // crimson: brand name, active nav item
const GOLD = '#C58A08';       // active item accent
const WASH = '#F6EADB';       // hover fill (light warm tint)
const LINE = '#E8D5C4';       // soft warm borders
const PAPER = '#FFF9F0';      // cream background

const NAV = [
  { href: '/admin',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/products',   label: 'Products',        icon: Package },
  { href: '/admin/discounts',  label: 'Discounts',       icon: Percent },
  { href: '/admin/categories', label: 'Categories',      icon: ListTree },
  { href: '/admin/orders',     label: 'Orders',          icon: ShoppingCart },
  { href: '/admin/invoices',   label: 'Invoices',        icon: Receipt },
  { href: '/admin/purchases',  label: 'Purchases',       icon: ShoppingBag },
  // { href: '/admin/expenses',   label: 'Expenses',        icon: Wallet },
  { href: '/admin/attendance', label: 'Attendance',      icon: CalendarCheck },
  { href: '/admin/inventory',  label: 'Inventory',       icon: Boxes },
  { href: '/admin/notify',     label: 'Notify Requests', icon: BellRing },
  { href: '/admin/banners',    label: 'Banners',         icon: ImageIcon },
  { href: '/admin/reports',    label: 'Sales & Profit',  icon: FileBarChart },
  { href: '/admin/settings',   label: 'Settings',        icon: SettingsIcon },
];

export default function AdminShell({ admin, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex" style={{ background: PAPER }}>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(41,33,30,0.45)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-50 inset-y-0 left-0 w-64 transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: PAPER,
          borderRight: `1px solid ${LINE}`,
        }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${LINE}` }}
        >
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-base" style={{ color: PRIMARY }}>
              Aninthu Magizh
            </span>
            <span
              className="text-[10px] tracking-widest uppercase mt-0.5"
              style={{ color: INK_SOFT }}
            >
              Admin Panel
            </span>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            style={{ color: INK_SOFT }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-65px)]">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderRadius: '4px',
                  background: active ? PRIMARY : 'transparent',
                  color: active ? PAPER : INK_SOFT,
                  // thin gold bar on the active item
                  boxShadow: active ? `inset 3px 0 0 ${GOLD}` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = WASH;
                    e.currentTarget.style.color = INK;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = INK_SOFT;
                  }
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-3" style={{ height: '1px', background: LINE }} />

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium w-full transition-colors"
            style={{ borderRadius: '4px', color: INK_SOFT }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = WASH;
              e.currentTarget.style.color = INK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = INK_SOFT;
            }}
          >
            <LogOut size={17} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{
            background: PAPER,
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <button onClick={() => setOpen(true)} style={{ color: INK }} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="font-medium text-base" style={{ color: PRIMARY }}>
            Aninthu Magizh Admin
          </span>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl" style={{ color: INK }}>{children}</main>
      </div>
    </div>
  );
}