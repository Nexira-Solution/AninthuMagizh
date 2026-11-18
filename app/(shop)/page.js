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
import { ArrowRight, Tag, Truck, RefreshCcw, ShieldCheck, Shirt, MessageCircle, ChevronDown } from 'lucide-react';

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

const FEATURED_LIMIT = 6;
const DISCOUNT_LIMIT = 4;
const REELS_LIMIT = 10;
const CATEGORY_LIMIT = 24;
const BUDGET_TILE_LIMIT = 8;

// Optional: set NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. 919876543210) to show the WhatsApp band.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

const TRUST = [
  { Icon: Truck, title: 'Fast delivery', text: 'Across India' },
  { Icon: RefreshCcw, title: 'Easy returns', text: 'Hassle-free exchange' },
  { Icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards, COD' },
  { Icon: Shirt, title: 'Direct from Tirupur', text: 'No middlemen' },
];

// Defaults for the "Shop by budget" section. They are used when the admin has not
// saved anything in Settings -> budgetSection (or leaves a field empty), so the
// page looks exactly as before until you customise it.
// Adjust hrefs to match the filter params your /products page reads.
const DEFAULT_BUDGET = {
  enabled: true,
  title: 'Shop by budget',
  sub: 'Great style at every price point.',
  tiles: [
    { label: 'Under ₹499', sub: 'Everyday basics', href: '/products?maxPrice=499' },
    { label: 'Under ₹799', sub: 'Best value picks', href: '/products?maxPrice=799' },
    { label: 'Under ₹999', sub: 'Premium for less', href: '/products?maxPrice=999' },
   
  ],
};

// Merge the admin's saved config over the defaults. Only internal links ("/...")
// are accepted for tiles, so a typo or bad value can never create an unsafe link.
function resolveBudget(cfg) {
  const text = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
  const saved = Array.isArray(cfg?.tiles)
    ? cfg.tiles
        .map((t) => ({
          label: text(t?.label, ''),
          sub: text(t?.sub, ''),
          href: text(t?.href, ''),
        }))
        .filter((t) => t.label && t.href.startsWith('/') && !t.href.startsWith('//'))
        .slice(0, BUDGET_TILE_LIMIT)
    : [];
  return {
    enabled: cfg?.enabled !== false,
    title: text(cfg?.title, DEFAULT_BUDGET.title),
    sub: cfg ? (typeof cfg.sub === 'string' ? cfg.sub.trim() : DEFAULT_BUDGET.sub) : DEFAULT_BUDGET.sub,
    tiles: saved.length ? saved : DEFAULT_BUDGET.tiles,
  };
}

const RIBBON = ['Crafted in Tirupur', 'Premium cotton', 'Everyday comfort', 'Festive favourites', 'Easy returns'];

const STATS = [
  { n: '100%', l: 'Sourced in Tirupur' },
  { n: '24/7', l: 'Live shopping streams' },
  { n: '5★', l: 'Customer-rated quality' },
];

const FAQS = [
  { q: 'How long does delivery take?', a: 'Most orders arrive within 3–7 business days depending on your location.' },
  { q: 'Can I return or exchange an item?', a: 'Yes. If the fit or product is not right, request a return or exchange within the window shown on the product page.' },
  { q: 'Do you offer cash on delivery?', a: 'COD is available on eligible pin codes. You can see your options at checkout.' },
  { q: 'Are the fabrics really from Tirupur?', a: 'Yes. We source directly from manufacturers in Tirupur, India’s knitwear capital.' },
];

async function getData() {
  await dbConnect();
  const [banners, newArrivals, discountProducts, reviews, combos, categories, reels, settings] = await Promise.all([
    Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    Product.find({ isActive: true, isActiveSeller: true }).select('-costPrice').sort({ createdAt: -1 }).limit(FEATURED_LIMIT).lean(),
    Product.find({ isActive: true, ...liveDiscountQuery() }).select('-costPrice').sort({ createdAt: -1 }).limit(DISCOUNT_LIMIT).lean(),
    Review.find({ isApproved: true, isFeatured: true }).populate('product', 'name').limit(10).lean(),
    Combo.find({ isActive: true }).limit(6).lean(),
    Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1, name: 1 }).limit(CATEGORY_LIMIT).lean(),
    Reel.find({ isActive: true }).sort({ createdAt: -1 }).populate('product', 'name slug').limit(REELS_LIMIT).lean(),
    Settings.findOne({ key: 'global' }).select('liveStreams budgetSection').lean(),
  ]);
  return JSON.parse(
    JSON.stringify({
      banners,
      newArrivals,
      discountProducts,
      reviews,
      combos,
      categories,
      reels,
      liveStreams: settings?.liveStreams || null,
      budget: resolveBudget(settings?.budgetSection),
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

export default async function HomePage() {
  const {
    banners,
    newArrivals: plainNewArrivals,
    discountProducts: plainDiscountProducts,
    reviews,
    combos: plainCombos,
    categories: plainCategories,
    reels,
    liveStreams,
    budget,
  } = await getData();

  return (
    <div className="overflow-x-hidden" style={{ background: PAPER }}>
      <h1 className="sr-only">Tirupur Clothing Hub: premium clothing sourced directly from Tirupur</h1>
      <style>{`
        @keyframes ribbonMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .ribbon-track{animation:ribbonMove 38s linear infinite}
        @media (prefers-reduced-motion: reduce){.ribbon-track{animation:none}}
      `}</style>

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

      {/* 5. Budget tiles: title, subtitle and tiles come from Settings.budgetSection */}
      {budget.enabled && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-4">
          <SectionTitle title={budget.title} sub={budget.sub} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {budget.tiles.map((b, i) => {
              const dark = i % 2 === 0;
              return (
                <Link
                  key={`${b.label}-${i}`}
                  href={b.href}
                  className="group flex flex-col justify-between p-5 sm:p-7 min-h-[130px] sm:min-h-[160px] transition-shadow hover:shadow-xl"
                  style={{ background: dark ? PRIMARY : '#fff', color: dark ? PAPER : INK, border: `1px solid ${dark ? PRIMARY : HAIRLINE}`, fontFamily: FONT_SANS }}
                >
                  <span className="text-lg sm:text-2xl" style={{ fontFamily: FONT_SERIF }}>{b.label}</span>
                  <span className="flex items-center justify-between text-[11px] sm:text-[12px] font-light">
                    {b.sub}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: dark ? GOLD : PRIMARY }} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Featured: sticky intro panel + product grid */}
      {plainNewArrivals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-14 pb-16">
          <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
            <div className="lg:sticky lg:top-28 self-start">
              <h2 className="text-[28px] sm:text-[38px] leading-[1.15]" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                Featured collection
              </h2>
              <div className="my-5 flex items-center gap-3">
                <span style={{ width: 36, height: 1, background: GOLD }} />
                <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
              </div>
              <p className="text-[14px] leading-[1.8] font-light max-w-[34ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
                Fresh arrivals from Tirupur, cut for comfort and made to last.
              </p>
              <Link href="/products" className={`${CTA} mt-7 hidden lg:inline-block`} style={{ fontFamily: FONT_SANS }}>
                Shop all
              </Link>
            </div>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {plainNewArrivals.map((p) => (
                  <ProductCard key={p._id} product={toCardProduct(p)} />
                ))}
              </div>
              <div className="mt-8 lg:hidden text-center">
                <Link href="/products" className={CTA} style={{ fontFamily: FONT_SANS }}>Shop all</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Ribbon marquee */}
      <div className="overflow-hidden py-4" style={{ background: INK }} aria-hidden="true">
        <div className="ribbon-track flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {[...RIBBON, ...RIBBON].map((w, i) => (
                <span key={`${k}-${i}`} className="flex items-center">
                  <span className="px-6 sm:px-10 text-lg sm:text-2xl italic whitespace-nowrap" style={{ color: PAPER, fontFamily: FONT_SERIF }}>{w}</span>
                  <span className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 8. Discounts: swipe rail on mobile, grid on desktop, wash background */}
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

      {/* 9. Brand story: crimson band with stats */}
      <section style={{ background: PRIMARY }}>
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="text-[28px] sm:text-[42px] leading-[1.15]" style={{ color: PAPER, fontFamily: FONT_SERIF, fontWeight: 400 }}>
              Made where India’s knitwear is made
            </h2>
            <p className="mt-5 text-[14px] sm:text-[15px] leading-[1.8] font-light max-w-[48ch]" style={{ color: 'rgba(255,249,240,0.8)', fontFamily: FONT_SANS }}>
              Tirupur Clothing Hub works directly with Tirupur manufacturers, so you get export-grade stitching and soft, breathable fabric without the retail markup.
            </p>
            <Link href="/products" className="inline-block mt-8 px-8 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors hover:bg-[#FFF9F0]" style={{ background: GOLD, color: INK, fontFamily: FONT_SANS }}>
              Explore the range
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-1">
            {STATS.map((s, i) => (
              <div key={s.l} className="py-4 md:py-6 text-center md:text-left" style={{ borderTop: i === 0 ? undefined : '1px solid rgba(255,249,240,0.2)' }}>
                <p className="text-3xl sm:text-5xl" style={{ color: GOLD, fontFamily: FONT_SERIF }}>{s.n}</p>
                <p className="mt-1 text-[11px] sm:text-[13px] font-light" style={{ color: PAPER, fontFamily: FONT_SANS }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Combos: one hero combo, then a grid */}
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

      {/* 11. Reviews */}
      <ReviewSection reviews={reviews} />

      {/* 12. Reels */}
      <ReelsSection reels={reels} />

      {/* 13. FAQ: heading left, answers right */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-[1fr_1.7fr] gap-8 md:gap-16">
        <div>
          <h2 className="text-[26px] sm:text-[34px] leading-tight" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
            Good to know
          </h2>
          <p className="mt-3 text-[14px] font-light max-w-[30ch] leading-relaxed" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
            Quick answers about delivery, returns and payments.
          </p>
        </div>
        <div style={{ borderTop: `1px solid ${HAIRLINE}` }}>
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
              <summary className="flex items-center justify-between cursor-pointer list-none text-[14px] sm:text-[15px] font-bold" style={{ color: INK, fontFamily: FONT_SANS }}>
                {f.q}
                <ChevronDown size={18} className="shrink-0 ml-4 transition-transform group-open:rotate-180" style={{ color: PRIMARY }} />
              </summary>
              <p className="mt-3 text-[13.5px] leading-[1.8] font-light max-w-[60ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 14. WhatsApp band (only if NEXT_PUBLIC_WHATSAPP_NUMBER is set) */}
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