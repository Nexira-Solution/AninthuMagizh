import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import Product from '@/models/Product';
import Review from '@/models/Review';
import Combo from '@/models/Combo';
import Category from '@/models/Category';
import Settings from '@/models/Settings';
import Reel from '@/models/Reel';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryShowcase from '@/components/CategoryShowcase';
import ProductCard from '@/components/ProductCard';
import ReviewSection from '@/components/ReviewSection';
import LiveSection from '@/components/LiveSection';
import ReelsSection from '@/components/ReelsSection';

import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { toCardProduct } from '@/lib/cardProduct';
import { liveDiscountQuery } from '@/lib/discount';
import { ArrowRight, Tag, Truck, RefreshCcw, ShieldCheck, Shirt, MessageCircle } from 'lucide-react';

// ISR: regenerated at most every 10 minutes. Admin API routes call revalidatePath('/').
export const revalidate = 600;

// Design tokens (keep in sync with Navbar, CouponMarquee, CategoryShowcase)
const PRIMARY = '#8F1538';
const INK = '#29211E';
const INK_FAINT = '#8A7A70';
const GOLD = '#C58A08';
const SAVINGS = '#075447';
const LINE = '#E8D5C4';
const WASH = 'rgba(232, 213, 196, 0.35)';
const PAPER = '#FFF9F0';
const HAIRLINE = LINE;
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const NEW_LIMIT = 8;
const BEST_LIMIT = 5;
const FEATURED_LIMIT = 6;
const DISCOUNT_LIMIT = 4;
const REELS_LIMIT = 10;
const CATEGORY_LIMIT = 24;

// Optional: set NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. 919876543210) to show the WhatsApp band.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

const TRUST = [
  { Icon: Truck, title: 'Fast delivery', text: 'Across India' },
  { Icon: RefreshCcw, title: 'Easy returns', text: 'Hassle-free exchange' },
  { Icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards, COD' },
  { Icon: Shirt, title: 'Direct from Tirupur', text: 'No middlemen' },
];

const LIVE_PRODUCT = { isActive: true, isActiveSeller: true };

async function getData() {
  await dbConnect();
  const [banners, newArrivals, bestSellers, featured, discountProducts, reviews, combos, categories, reels, settings] =
    await Promise.all([
      Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      // New arrivals: newest first
      Product.find(LIVE_PRODUCT).select('-costPrice').sort({ createdAt: -1 }).limit(NEW_LIMIT).lean(),
      // Best sellers: highest sales first. Change `soldCount` to whatever your Product schema calls it
      // (e.g. salesCount, totalSold, ordersCount). If the field doesn't exist this falls back to newest.
      Product.find(LIVE_PRODUCT).select('-costPrice').sort({ soldCount: -1, createdAt: -1 }).limit(BEST_LIMIT).lean(),
      // Featured collection: products flagged isFeatured in admin
      Product.find({ ...LIVE_PRODUCT, isFeatured: true }).select('-costPrice').sort({ updatedAt: -1 }).limit(FEATURED_LIMIT).lean(),
      Product.find({ isActive: true, ...liveDiscountQuery() }).select('-costPrice').sort({ createdAt: -1 }).limit(DISCOUNT_LIMIT).lean(),
      Review.find({ isApproved: true, isFeatured: true }).populate('product', 'name').limit(10).lean(),
      Combo.find({ isActive: true }).limit(6).lean(),
      Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1, name: 1 }).limit(CATEGORY_LIMIT).lean(),
      Reel.find({ isActive: true }).sort({ createdAt: -1 }).populate('product', 'name slug').limit(REELS_LIMIT).lean(),
      Settings.findOne({ key: 'global' }).select('liveStreams').lean(),
    ]);
  return JSON.parse(
    JSON.stringify({
      banners,
      newArrivals,
      bestSellers,
      featured,
      discountProducts,
      reviews,
      combos,
      categories,
      reels,
      liveStreams: settings?.liveStreams || null,
    })
  );
}

// Left-aligned serif title with optional "view all" link (same voice as CategoryShowcase)
function SectionTitle({ title, sub, href, cta = 'View all' }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h2 className="text-[24px] sm:text-[32px] leading-tight" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
          {title}
        </h2>
        {sub && <p className="mt-1 text-[13px] font-light" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-[13px] font-bold hover:gap-2 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
          {cta} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function comboInfo(c) {
  const isColorPack = c.type === 'color-pack';
  const cheapest = isColorPack && c.packOptions?.length
    ? c.packOptions.reduce((min, p) => (p.price < min.price ? p : min), c.packOptions[0])
    : null;
  const price = isColorPack ? cheapest?.price ?? 0 : c.comboPrice;
  const original = isColorPack ? cheapest?.originalPrice ?? 0 : c.originalPrice;
  const savings = original > price ? original - price : 0;
  const pct = original > 0 ? Math.round((savings / original) * 100) : 0;
  return { isColorPack, cover: c.images?.[0] || c.image, price, original, savings, pct };
}

function ComboCard({ c, large = false }) {
  const { isColorPack, cover, price, original, savings, pct } = comboInfo(c);
  return (
    <Link
      href={`/combo/${c.slug}`}
      className={`group relative overflow-hidden bg-white transition-shadow hover:shadow-xl ${large ? 'grid md:grid-cols-2 md:col-span-2 lg:col-span-3' : ''}`}
      style={{ border: `1px solid ${HAIRLINE}` }}
    >
      <div className={`relative w-full overflow-hidden ${large ? 'aspect-[4/3] md:aspect-auto md:min-h-[360px]' : 'aspect-square'}`} style={{ background: WASH }}>
        {cover ? (
          <img src={cover} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0" style={{ background: LINE }} />
        )}
        {pct > 0 && (
          <div className="absolute top-3 left-3 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 flex items-center gap-1" style={{ color: PAPER, background: SAVINGS, fontFamily: FONT_SANS }}>
            <Tag size={10} /> {pct}% off
          </div>
        )}
        {isColorPack && (
          <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5" style={{ background: PRIMARY, color: PAPER }}>
            Color Pack
          </div>
        )}
      </div>
      <div className={large ? 'p-6 sm:p-10 flex flex-col justify-center' : 'p-3'} style={large ? undefined : { borderTop: `1px solid ${HAIRLINE}` }}>
        {large && <span className="text-[12px] font-bold mb-3" style={{ color: GOLD, fontFamily: FONT_SANS }}>Best value combo</span>}
        <p
          className={large ? 'text-2xl sm:text-4xl leading-tight' : 'text-[13px] font-bold tracking-wide line-clamp-1'}
          style={{ color: INK, fontFamily: large ? FONT_SERIF : FONT_SANS }}
        >
          {c.name}
        </p>
        <div className={`flex items-baseline gap-2 ${large ? 'mt-4' : 'mt-1.5'}`}>
          <span className={`font-bold ${large ? 'text-xl' : 'text-sm'}`} style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
            {isColorPack && 'From '}{formatINR(price)}
          </span>
          {savings > 0 && (
            <span className={`${large ? 'text-sm' : 'text-[11px]'} line-through font-light`} style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
              {formatINR(original)}
            </span>
          )}
        </div>
        {savings > 0 && (
          <p className="text-[11px] font-bold mt-1" style={{ color: SAVINGS, fontFamily: FONT_SANS }}>You save {formatINR(savings)}</p>
        )}
        {large && (
          <span className="inline-flex items-center gap-2 mt-6 text-[12px] font-bold tracking-[2px] uppercase group-hover:gap-3 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
            View combo <ArrowRight size={14} />
          </span>
        )}
      </div>
    </Link>
  );
}

const CTA = 'inline-block px-8 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors bg-[#C58A08] hover:bg-[#8F1538] text-[#29211E] hover:text-[#FFF9F0]';

// Thin gold rule + diamond, used as a quiet premium divider
function GoldRule() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span style={{ width: 36, height: 1, background: GOLD }} />
      <span className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
    </div>
  );
}

export default async function HomePage() {
  const {
    banners,
    newArrivals,
    bestSellers,
    featured: featuredRaw,
    discountProducts: plainDiscountProducts,
    reviews,
    combos: plainCombos,
    categories: plainCategories,
    reels,
    liveStreams,
  } = await getData();

  // If nothing is flagged isFeatured yet, fall back to the next-newest products so the section never looks empty
  const featured = featuredRaw?.length ? featuredRaw : newArrivals.slice(0, FEATURED_LIMIT);
  const [spotlight, ...restBest] = bestSellers;

  return (
    <div className="overflow-x-hidden" style={{ background: PAPER }}>
      <h1 className="sr-only">Tirupur Clothing Hub: premium clothing sourced directly from Tirupur</h1>

      {/* 1. Banner */}
      <BannerCarousel banners={banners} />

      {/* 2. Trust strip */}
      <section className="bg-white" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
          {TRUST.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 justify-center md:justify-start">
              <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: WASH, color: PRIMARY }}>
                <Icon size={17} strokeWidth={1.6} />
              </span>
              <div className="leading-tight">
                <p className="text-[12px] sm:text-[13px] font-bold" style={{ color: INK, fontFamily: FONT_SANS }}>{title}</p>
                <p className="text-[11px] sm:text-[12px] font-light" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Live (hidden if no links set) */}
      <LiveSection streams={liveStreams} />

      {/* 4. Categories: bento mosaic ('bento' | 'arch' | 'grid') */}
      <CategoryShowcase categories={plainCategories} layout="bento" />

      {/* 5. NEW ARRIVALS: full-bleed swipe rail with a big serif lead-in.
             Layout: heading row on top, then a horizontally scrolling strip that bleeds off the right edge. */}
      {newArrivals.length > 0 && (
        <section className="pt-16 sm:pt-20 pb-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-10">
              <div>
                <GoldRule />
                <h2 className="mt-4 text-[32px] sm:text-[48px] leading-[1.05]" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                  New arrivals
                </h2>
                <p className="mt-3 text-[14px] font-light max-w-[42ch] leading-[1.8]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
                  Just off the Tirupur looms. Swipe through this week’s newest pieces.
                </p>
              </div>
              <Link href="/products?sort=newest" className="shrink-0 inline-flex items-center gap-2 text-[13px] font-bold hover:gap-3 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
                See everything new <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {newArrivals.map((p) => (
                <div key={p._id} className="snap-start shrink-0 w-[62%] sm:w-[34%] lg:w-[23.5%]">
                  <ProductCard product={toCardProduct(p)} />
                </div>
              ))}
              <div className="shrink-0 w-[1px]" aria-hidden="true" />
            </div>
          </div>
        </section>
      )}

      {/* 6. BEST SELLERS: dark ranked showcase.
             Layout: #1 is a tall spotlight on the left, ranks 2-5 sit in a 2x2 grid on the right. */}
      {bestSellers.length > 0 && (
        <section className="my-14 sm:my-20" style={{ background: INK }}>
          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
            <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <GoldRule />
                <h2 className="mt-4 text-[32px] sm:text-[48px] leading-[1.05]" style={{ color: PAPER, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                  Best sellers
                </h2>
                <p className="mt-3 text-[14px] font-light max-w-[42ch] leading-[1.8]" style={{ color: 'rgba(255,249,240,0.65)', fontFamily: FONT_SANS }}>
                  The pieces our customers reorder the most, ranked by sales.
                </p>
              </div>
              <Link href="/products?sort=best-selling" className="hidden sm:inline-flex shrink-0 items-center gap-2 text-[13px] font-bold hover:gap-3 transition-all" style={{ color: GOLD, fontFamily: FONT_SANS }}>
                View all best sellers <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid lg:grid-cols-[1.05fr_1.4fr] gap-5 sm:gap-8">
              {/* Rank 1 spotlight */}
              {spotlight && (
                <div className="relative p-4 sm:p-6" style={{ background: PAPER, outline: `1px solid ${GOLD}`, outlineOffset: -8 }}>
                  <div className="flex items-baseline gap-3 mb-3 px-1">
                    <span className="text-[56px] sm:text-[72px] leading-none" style={{ color: GOLD, fontFamily: FONT_SERIF }}>1</span>
                    <span className="text-[12px] font-bold" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>Our top seller</span>
                  </div>
                  <ProductCard product={toCardProduct(spotlight)} />
                </div>
              )}

              {/* Ranks 2-5 */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 content-start">
                {restBest.map((p, i) => (
                  <div key={p._id} className="p-3 sm:p-4" style={{ background: PAPER }}>
                    <span className="block mb-2 text-[30px] sm:text-[38px] leading-none" style={{ color: GOLD, fontFamily: FONT_SERIF }}>
                      {i + 2}
                    </span>
                    <ProductCard product={toCardProduct(p)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 sm:hidden text-center">
              <Link href="/products?sort=best-selling" className={CTA} style={{ fontFamily: FONT_SANS }}>View all best sellers</Link>
            </div>
          </div>
        </section>
      )}

      {/* 7. Discounts: swipe rail on mobile, grid on desktop, wash background */}
      {plainDiscountProducts?.length > 0 && (
        <section className="py-16" style={{ background: WASH }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 mb-3" style={{ color: PAPER, background: SAVINGS, fontFamily: FONT_SANS }}>
                  <Tag size={11} /> Limited-time prices
                </span>
                <h2 className="text-[24px] sm:text-[32px] leading-tight" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                  Discount offers
                </h2>
              </div>
              <Link href="/discounts" className="shrink-0 inline-flex items-center gap-1 text-[13px] font-bold hover:gap-2 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {plainDiscountProducts.map((p) => (
                <div key={p._id} className="snap-start shrink-0 w-[62%] sm:w-auto">
                  <ProductCard product={toCardProduct(p, { discount: true })} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FEATURED COLLECTIONS: editorial layout.
             Layout: sticky intro panel on the left, staggered two-column product grid on the right
             (the right-hand column is dropped down so the grid reads like a magazine spread). */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-28 self-start">
              <GoldRule />
              <h2 className="mt-4 text-[32px] sm:text-[48px] leading-[1.05]" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                Featured collections
              </h2>
              <p className="mt-5 text-[14px] leading-[1.9] font-light max-w-[34ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
                Hand-picked by our team: export-grade stitching, soft cotton, and fits that last wash after wash.
              </p>
              <div className="mt-6 pl-4" style={{ borderLeft: `2px solid ${GOLD}` }}>
                <p className="text-[13px] italic leading-relaxed" style={{ color: INK, fontFamily: FONT_SERIF }}>
                  Made where India’s knitwear is made.
                </p>
              </div>
              <Link href="/products?featured=true" className={`${CTA} mt-8 hidden lg:inline-block`} style={{ fontFamily: FONT_SANS }}>
                Shop the collection
              </Link>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-6 sm:gap-y-10">
                {featured.map((p, i) => (
                  <div
                    key={p._id}
                    className={`${i % 2 === 1 ? 'mt-8 sm:mt-14' : ''} ${i % 4 === 0 ? 'p-2 sm:p-3' : ''}`}
                    style={i % 4 === 0 ? { background: '#fff', border: `1px solid ${GOLD}` } : undefined}
                  >
                    <ProductCard product={toCardProduct(p)} />
                  </div>
                ))}
              </div>
              <div className="mt-12 lg:hidden text-center">
                <Link href="/products?featured=true" className={CTA} style={{ fontFamily: FONT_SANS }}>Shop the collection</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. Combos: one hero combo, then a grid */}
      {plainCombos?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <SectionTitle title="Combo offers" sub="Buy together, save together." href="/combo" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <ComboCard c={plainCombos[0]} large />
            {plainCombos.slice(1).map((c) => (
              <ComboCard key={c._id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* 10. Reviews */}
      <ReviewSection reviews={reviews} />

      {/* 11. Reels */}
      <ReelsSection reels={reels} />

      {/* 12. WhatsApp band (only if NEXT_PUBLIC_WHATSAPP_NUMBER is set) */}
      {WHATSAPP && (
        <section style={{ background: WASH, borderTop: `1px solid ${HAIRLINE}` }}>
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div>
              <h2 className="text-xl sm:text-2xl" style={{ color: PRIMARY, fontFamily: FONT_SERIF }}>Need help choosing a size or style?</h2>
              <p className="mt-1 text-[13.5px] font-light" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>Message us on WhatsApp and we’ll help you pick.</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi! I need help with an order.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors hover:bg-[#075447]"
              style={{ background: PRIMARY, color: PAPER, fontFamily: FONT_SANS }}
            >
              <MessageCircle size={16} /> Chat with us
            </a>
          </div>
        </section>
      )}
    </div>
  );
}