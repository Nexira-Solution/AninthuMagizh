'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart, cartKey, formatSelections } from '@/components/CartContext';
import { formatINR } from '@/lib/utils';
import { Trash2, ShoppingBag } from 'lucide-react';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const PRIMARY = '#8F1538';     // headings, prices
const SECONDARY = '#C58A08';   // buttons and premium details
const BG = '#FFF9F0';          // page background
const HIGHLIGHT = '#075447';   // offer badge text
const INK = '#29211E';         // main text
const INK_SOFT = '#8A7A70';    // muted text
const WASH = '#F6EADB';        // light warm fill (image placeholder, badge)
const LINE = '#E8D5C4';        // soft borders
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <div className="max-w-md mx-auto px-5 py-24 text-center">
          <ShoppingBag size={28} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: PRIMARY, opacity: 0.5 }} />
          <p className="text-[15px] mb-1" style={{ color: INK, fontFamily: FONT_SERIF }}>Your cart is empty</p>
          <p className="text-sm mb-7" style={{ color: INK_SOFT }}>Add something beautiful from our collection.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-semibold transition-colors bg-[#C58A08] hover:bg-[#A87306]"
            style={{ color: INK, borderRadius: '4px' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <h1 className="text-[24px] sm:text-[28px] mb-8" style={{ fontFamily: FONT_SERIF, color: PRIMARY }}>
          Your Cart
        </h1>

        <div className="space-y-0">
          {items.map((item, idx) => {
            const key = cartKey(item);
            const selText = formatSelections(item);
            const legacy = [item.sleeveType, item.zipType].filter(Boolean).join(' · ');
            const details = [selText, legacy].filter(Boolean).join(' · ');
            return (
              <div
                key={key}
                className="flex gap-4 py-5"
                style={{ borderTop: idx === 0 ? `1px solid ${LINE}` : 'none', borderBottom: `1px solid ${LINE}` }}
              >
                {/* Product image */}
                <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden" style={{ background: WASH, borderRadius: '3px' }}>
                  <Image src={item.image || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-1" style={{ color: INK }}>{item.name}</p>
                  <p className="text-xs mt-1" style={{ color: INK_SOFT }}>
                    Color: {item.color} &nbsp;·&nbsp; Size: {item.size}
                  </p>
                  {details && (
                    <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>{details}</p>
                  )}
                  {item.isCombo && item.pieces > 1 && (
                    <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                      {item.pieces} pieces{item.qty > 1 ? ` each · ${item.qty * item.pieces} total` : ''}
                    </p>
                  )}
                  <p className="text-sm mt-1.5" style={{ color: PRIMARY }}>
                    {formatINR(item.price)}
                    {item.priceSource === 'discount' && (
                      <span
                        className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5"
                        style={{ background: WASH, color: HIGHLIGHT, borderRadius: '2px' }}
                      >
                        Offer price
                      </span>
                    )}
                  </p>

                  {/* Qty controls + remove */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center" style={{ border: `1px solid ${LINE}`, borderRadius: '3px' }}>
                      <button
                        onClick={() => updateQty(key, item.qty - 1)}
                        className="px-2.5 py-1 text-sm transition-opacity active:opacity-60"
                        style={{ color: INK }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm" style={{ color: INK, borderLeft: `1px solid ${LINE}`, borderRight: `1px solid ${LINE}` }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(key, item.qty + 1)}
                        className="px-2.5 py-1 text-sm transition-opacity active:opacity-60"
                        style={{ color: INK }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(key)}
                      className="transition-colors hover:text-[#E60062] active:opacity-60"
                      style={{ color: INK_SOFT }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <p className="text-sm shrink-0 self-start pt-0.5" style={{ color: INK }}>
                  {formatINR(item.price * item.qty)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Subtotal card */}
        <div className="flex items-center justify-between pt-6 mt-2">
          <span className="text-sm" style={{ color: INK_SOFT }}>Subtotal</span>
          <span className="text-lg" style={{ color: PRIMARY, fontFamily: FONT_SERIF }}>{formatINR(subtotal)}</span>
        </div>

        {/* Checkout CTA */}
        <Link
          href="/checkout"
          className="block w-full text-center mt-6 py-3.5 text-sm font-semibold transition-colors bg-[#C58A08] hover:bg-[#A87306]"
          style={{ color: INK, borderRadius: '4px' }}
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}