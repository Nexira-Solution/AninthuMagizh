import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Design tokens (same as the homepage)
const PRIMARY = '#8F1538';
const INK = '#29211E';
const INK_FAINT = '#8A7A70';
const GOLD = '#C58A08';
const LINE = '#E8D5C4';
const WASH = 'rgba(232, 213, 196, 0.35)';
const PAPER = '#FFF9F0';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

// Shared page shell for Terms and Privacy.
// sections = [{ id, title, paras?: string[], list?: string[], after?: string[] }]
export default function LegalPage({ title, intro, updated, sections }) {
  return (
    <div style={{ background: PAPER }}>
      <header style={{ background: WASH, borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold hover:gap-2.5 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="mt-6 text-[34px] sm:text-[52px] leading-[1.05]" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
            {title}
          </h1>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span style={{ width: 36, height: 1, background: GOLD }} />
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
          </div>
          <p className="text-[15px] leading-[1.8] font-light max-w-[62ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>{intro}</p>
          <p className="mt-3 text-[12px]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>Last updated: {updated}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16 grid lg:grid-cols-[240px_1fr] gap-10 lg:gap-16">
        {/* Contents: sticky on desktop, simple list on mobile */}
        <nav aria-label="On this page" className="lg:sticky lg:top-28 self-start">
          <p className="text-[13px] font-bold mb-3" style={{ color: INK, fontFamily: FONT_SANS }}>On this page</p>
          <ol className="space-y-2" style={{ borderLeft: `1px solid ${LINE}` }}>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block pl-4 text-[13.5px] leading-snug hover:opacity-70 transition-opacity" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-[68ch]">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 pb-9 mb-9" style={{ borderBottom: i === sections.length - 1 ? 'none' : `1px solid ${LINE}` }}>
              <h2 className="text-[22px] sm:text-[26px] leading-tight mb-4" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
                {i + 1}. {s.title}
              </h2>
              {s.paras?.map((p, k) => (
                <p key={k} className="text-[15px] leading-[1.9] font-light mb-3" style={{ color: INK, fontFamily: FONT_SANS }}>{p}</p>
              ))}
              {s.list && (
                <ul className="my-3 space-y-2 pl-5 list-disc marker:text-[#C58A08]">
                  {s.list.map((li, k) => (
                    <li key={k} className="text-[15px] leading-[1.8] font-light" style={{ color: INK, fontFamily: FONT_SANS }}>{li}</li>
                  ))}
                </ul>
              )}
              {s.after?.map((p, k) => (
                <p key={k} className="text-[15px] leading-[1.9] font-light mb-3" style={{ color: INK, fontFamily: FONT_SANS }}>{p}</p>
              ))}
            </section>
          ))}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-bold" style={{ fontFamily: FONT_SANS }}>
            <Link href="/faq" style={{ color: PRIMARY }}>FAQ</Link>
            <Link href="/terms" style={{ color: PRIMARY }}>Terms &amp; Conditions</Link>
            <Link href="/privacy" style={{ color: PRIMARY }}>Privacy Policy</Link>
          </div>
        </article>
      </div>
    </div>
  );
}