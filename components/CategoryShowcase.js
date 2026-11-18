import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Server component (no client JS). Switch the look with the `layout` prop:
//   'bento' - 1 big + 4 tiles mosaic, remaining categories as a pill row (default)
//   'arch'  - tall arch-shaped cards in a swipeable row
//   'grid'  - classic circles with a gold ring
const PRIMARY = '#8F1538';
const INK = '#29211E';
const INK_FAINT = '#8A7A70';
const GOLD = '#C58A08';
const LINE = '#E8D5C4';
const WASH = 'rgba(232, 213, 196, 0.35)';
const PAPER = '#FFF9F0';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const NO_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function Img({ c, className }) {
  return c.image ? (
    <img src={c.image} alt={c.name} loading="lazy" decoding="async" className={className} />
  ) : (
    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${LINE}, ${WASH})` }} />
  );
}

function Header() {
  return (
    <div className="flex items-end justify-between mb-6 sm:mb-8">
      <div>
        <h2 className="text-[24px] sm:text-[32px] leading-tight" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
          Shop by category
        </h2>
        <p className="mt-1 text-[13px] font-light" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
          Find your fit, from everyday basics to festive wear.
        </p>
      </div>
      <Link href="/products" className="shrink-0 inline-flex items-center gap-1 text-[13px] font-bold hover:gap-2 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Bento({ categories }) {
  const tiles = categories.slice(0, 5);
  const rest = categories.slice(5);
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] sm:auto-rows-[200px] gap-3 sm:gap-4">
        {tiles.map((c, i) => {
          const big = i === 0;
          return (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className={`group relative overflow-hidden ${big ? 'col-span-2 row-span-2' : ''}`}
              style={{ background: WASH }}
            >
              <Img c={c} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(41,33,30,0.7), rgba(41,33,30,0) 55%)' }} />
              <div className="absolute left-0 right-0 bottom-0 p-4 sm:p-6 flex items-end justify-between gap-3">
                <span className={`${big ? 'text-2xl sm:text-4xl' : 'text-base sm:text-xl'} leading-tight`} style={{ color: PAPER, fontFamily: FONT_SERIF }}>
                  {c.name}
                </span>
                <span
                  className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                  style={{ background: GOLD, color: INK }}
                >
                  <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className={`mt-4 sm:mt-5 flex gap-2.5 overflow-x-auto pb-1 ${NO_SCROLLBAR}`}>
          {rest.map((c) => (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className="shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white transition-colors hover:border-[#8F1538]"
              style={{ border: `1px solid ${LINE}` }}
            >
              <span className="relative w-8 h-8 rounded-full overflow-hidden" style={{ background: WASH }}>
                <Img c={c} className="absolute inset-0 w-full h-full object-cover" />
              </span>
              <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: INK, fontFamily: FONT_SANS }}>{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Arch({ categories }) {
  return (
    <div className={`flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 ${NO_SCROLLBAR}`}>
      {categories.map((c) => (
        <Link key={c._id} href={`/category/${c.slug}`} className="group shrink-0 snap-start w-[132px] sm:w-[170px] text-center">
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-t-full p-[3px] transition-colors"
            style={{ border: `1px solid ${GOLD}`, background: PAPER }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-t-full" style={{ background: WASH }}>
              <Img c={c} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <p className="mt-3 text-[15px] sm:text-[17px] leading-tight line-clamp-2" style={{ color: INK, fontFamily: FONT_SERIF }}>{c.name}</p>
          <p className="mt-1 text-[11px] font-bold group-hover:underline" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>Shop now</p>
        </Link>
      ))}
    </div>
  );
}

function Grid({ categories }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6">
      {categories.map((c) => (
        <Link key={c._id} href={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105" style={{ border: `1px solid ${GOLD}`, background: PAPER }}>
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{ background: WASH }}>
              <Img c={c} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
          <span className="mt-2 text-[10.5px] sm:text-[11px] font-bold tracking-wide leading-tight line-clamp-2 max-w-[80px]" style={{ color: INK, fontFamily: FONT_SANS }}>
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function CategoryShowcase({ categories, layout = 'bento' }) {
  if (!categories?.length) return null;
  const View = layout === 'arch' ? Arch : layout === 'grid' ? Grid : Bento;
  return (
    <section className="max-w-6xl mx-auto px-4 pt-12 pb-6">
      <Header />
      <View categories={categories} />
    </section>
  );
}