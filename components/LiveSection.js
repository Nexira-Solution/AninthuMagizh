'use client';

import { useState } from 'react';
import { getYouTubeId } from '@/lib/youtube';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const PRIMARY = '#8F1538';     // crimson: heading, active tab, status text
const INK = '#29211E';         // text
const INK_FAINT = '#7A6A63';   // muted secondary text (derived from text)
const GOLD = '#C58A08';        // secondary: underline on the active tab
const LINE = '#E5CDD3';        // soft borders (derived tint of primary)
const PAPER = '#FFF9F0';       // background
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const TABS = [
  { key: 'yesterday', label: 'Yesterday', hint: 'Watch the replay' },
  { key: 'today', label: 'Today', hint: 'Live now' },
  { key: 'tomorrow', label: 'Tomorrow', hint: 'Coming up' },
];

export default function LiveSection({ streams }) {
  const slots = TABS.map((t) => ({
    ...t,
    title: streams?.[t.key]?.title || '',
    id: getYouTubeId(streams?.[t.key]?.url),
  }));

  const hasAny = slots.some((s) => s.id);

  // Default to Today, else the first day that has a link.
  // Hooks must run before any early return.
  const initial = slots.find((s) => s.key === 'today' && s.id)?.key || slots.find((s) => s.id)?.key || 'today';
  const [active, setActive] = useState(initial);

  // Hide the whole section if the admin hasn't added any link
  if (!hasAny) return null;

  const current = slots.find((s) => s.key === active);

  return (
    <section className="max-w-4xl mx-auto px-4 py-14">
      <h2
        className="text-xl sm:text-2xl font-bold tracking-[3px] uppercase mb-6 text-center"
        style={{ color: PRIMARY, fontFamily: FONT_SANS }}
      >
        Watch Live
      </h2>

      <div className="flex justify-center gap-2 mb-5">
        {slots.map((s) => {
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              type="button"
              disabled={!s.id}
              onClick={() => setActive(s.key)}
              className="px-4 py-2 text-[12px] font-bold tracking-[2px] uppercase transition-colors disabled:opacity-40"
              style={{
                fontFamily: FONT_SANS,
                background: isActive ? PRIMARY : PAPER,
                color: isActive ? PAPER : INK,
                border: `1px solid ${isActive ? PRIMARY : LINE}`,
                // gold underline marks the selected day
                boxShadow: isActive ? `inset 0 -3px 0 ${GOLD}` : 'none',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {current?.id ? (
        <div>
          <div className="relative w-full aspect-video overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
            <iframe
              key={current.id}
              src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
              title={current.title || `${current.label} live`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          <p className="mt-3 text-center text-sm" style={{ fontFamily: FONT_SANS, color: INK }}>
            <span className="font-bold" style={{ color: PRIMARY }}>{current.hint}</span>
            {current.title && <span style={{ color: INK_FAINT }}> · {current.title}</span>}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
          Nothing scheduled.
        </p>
      )}
    </section>
  );
}