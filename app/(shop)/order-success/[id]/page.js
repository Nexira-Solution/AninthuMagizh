'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';

// Theme: #8F1538 (primary), #C58A08 (secondary), #FFF9F0 (background), #E60062 (accent), #075447 (highlight), #29211E (text)
const INK = '#29211E';          // primary text
const INK_SOFT = '#8A7A70';     // muted text (derived warm gray)
const PEACH = '#C58A08';        // accent (gold) - ring around the success icon
const PEACH_WASH = '#F6EADB';   // icon circle background (light warm tint)
const LINE = '#E8D5C4';         // borders (soft warm)
const PAPER = '#FFF9F0';        // page background
const PURPLE = '#8F1538';       // primary (heading, total, invoice button) - name kept for consistency
const SUCCESS = '#075447';      // success icon (highlight green)
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen" style={{ background: PAPER }}>
        <div className="max-w-xl mx-auto px-4 py-24 text-center text-sm" style={{ color: INK_SOFT }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>
      <div className="max-w-xl mx-auto px-5 py-20 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 mb-5"
          style={{ background: PEACH_WASH, border: `1px solid ${PEACH}`, borderRadius: '50%' }}
        >
          <CheckCircle2 size={30} strokeWidth={1.5} style={{ color: SUCCESS }} />
        </div>

        <h1 className="text-[24px] sm:text-[28px]" style={{ fontFamily: FONT_SERIF, color: PURPLE }}>
          Order placed successfully
        </h1>

        <div className="mt-6 pt-6 max-w-xs mx-auto space-y-2" style={{ borderTop: `1px solid ${LINE}` }}>
          <p className="text-sm" style={{ color: INK_SOFT }}>
            Order Number <span style={{ color: INK }}>— {order.orderNumber}</span>
          </p>
          <p className="text-sm" style={{ color: INK_SOFT }}>
            Total <span className="font-semibold" style={{ color: PURPLE }}>— {formatINR(order.total)}</span>
          </p>
        </div>

        <p className="text-xs mt-5" style={{ color: INK_SOFT }}>
          We&rsquo;ll send updates to {order.customer?.phone}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
          <Link
            href={`/invoice/${order._id}`}
            className="px-6 py-3 text-sm font-medium transition-opacity active:opacity-70"
            style={{ border: `1px solid ${PURPLE}`, color: PURPLE, background: PAPER, borderRadius: '4px' }}
          >
            View Invoice
          </Link>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-semibold transition-opacity active:opacity-80"
            style={{ background: '#C58A08', color: INK, borderRadius: '4px' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}