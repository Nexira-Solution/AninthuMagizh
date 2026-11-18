'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Design tokens: shared with Navbar / CouponMarquee
const PRIMARY = '#8F1538';
const GOLD = '#C58A08';
const PAPER = '#FFF9F0';
const INK = '#29211E';

const SLIDE_MS = 4500;
const SWIPE_PX = 40;

export default function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Only slides that are (or are about to be) shown request their image.
  const [seen, setSeen] = useState(() => new Set([0]));
  const touchX = useRef(null);

  const count = banners?.length || 0;
  const go = (i) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!count) return;
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(index);
      next.add((index + 1) % count); // preload upcoming slide
      return next;
    });
  }, [index, count]);

  if (!count) return null;

  const autoplay = count > 1 && !reduceMotion;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  };

  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? index + 1 : index - 1);
  };

  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2.5 rounded-full transition-all duration-300 hover:brightness-95 ' +
    'sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100';

  return (
    <section
      className="group relative w-full overflow-hidden"
      style={{ background: PAPER }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        onTouchEnd(e);
        setPaused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <style>{`@keyframes bannerFill{from{width:0}to{width:100%}}`}</style>

      {/* Mobile: natural image height (nothing cropped). Desktop: fixed ratio, object-cover. */}
      <div className="relative w-full grid sm:block sm:aspect-[16/7] lg:aspect-[2.4/1]">
        {banners.map((b, i) => {
          const isActive = i === index;
          const isFirst = i === 0;
          const shouldLoad = isActive || seen.has(i);

          return (
            <Link
              key={b._id}
              href={b.link || '#'}
              className={`col-start-1 row-start-1 block w-full sm:absolute sm:inset-0 transition-opacity duration-700 ease-out ${
                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${!b.link ? 'pointer-events-none' : ''}`}
              tabIndex={isActive ? 0 : -1}
              aria-hidden={!isActive}
              aria-label={b.title || `Slide ${i + 1} of ${count}`}
              draggable={false}
            >
              {shouldLoad && (
                <img
                  src={b.image}
                  alt={b.title || 'Banner'}
                  loading={isFirst ? 'eager' : 'lazy'}
                  fetchPriority={isFirst ? 'high' : 'auto'}
                  decoding={isFirst ? 'sync' : 'async'}
                  draggable={false}
                  className="block w-full h-auto sm:absolute sm:inset-0 sm:h-full object-cover object-center select-none"
                />
              )}
            </Link>
          );
        })}

        {count > 1 && (
          <>
            {/* Soft scrim so the indicators read on any image */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-24 z-[5]"
              style={{ background: 'linear-gradient(to top, rgba(41,33,30,0.35), rgba(41,33,30,0))' }}
            />

            <button
              onClick={() => go(index - 1)}
              className={`${arrow} left-2 sm:left-5`}
              style={{ background: GOLD, color: INK, border: `1px solid ${PRIMARY}` }}
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => go(index + 1)}
              className={`${arrow} right-2 sm:right-5`}
              style={{ background: GOLD, color: INK, border: `1px solid ${PRIMARY}` }}
              aria-label="Next slide"
            >
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>

            {/* Progress indicators: the active dash fills over the slide time and advances the slide */}
            <div className="absolute bottom-1 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center z-10">
              {banners.map((_, i) => {
                const active = i === index;
                return (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className="py-3 px-[3px]"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={active}
                  >
                    <span
                      className="relative block overflow-hidden rounded-full transition-all duration-500"
                      style={{
                        height: '3px',
                        width: active ? '34px' : '12px',
                        background: 'rgba(255,249,240,0.55)',
                      }}
                    >
                      {active && (
                        <span
                          key={index}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: GOLD,
                            width: autoplay ? undefined : '100%',
                            animation: autoplay ? `bannerFill ${SLIDE_MS}ms linear forwards` : undefined,
                            animationPlayState: paused ? 'paused' : 'running',
                          }}
                          onAnimationEnd={() => go(index + 1)}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}