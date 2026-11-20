import Link from 'next/link';
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react';
import { STORE_NAME, EMAIL, DEFAULT_WHATSAPP, DELIVERY_TIME, RETURN_DAYS } from '@/lib/siteConfig';

export const metadata = {
  title: `FAQ | ${STORE_NAME}`,
  description: `Answers about delivery, returns, payments and sizing at ${STORE_NAME}.`,
};

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

const GROUPS = [
  {
    title: 'Orders and delivery',
    items: [
      { q: 'How long does delivery take?', a: `Most orders arrive within ${DELIVERY_TIME}, depending on your location. You will get an update by SMS or WhatsApp when your parcel ships.` },
      { q: 'Do you deliver across India?', a: 'Yes. We ship to most pin codes across India. Enter your pin code at checkout to see if we deliver to you.' },
      { q: 'How can I track my order?', a: 'Open your account and go to My orders to see the status. You can also message us on WhatsApp with your order number.' },
      { q: 'Can I change or cancel my order?', a: 'You can change or cancel before the order is shipped. Message us on WhatsApp as soon as possible with your order number.' },
    ],
  },
  {
    title: 'Returns and exchanges',
    items: [
      { q: 'Can I return or exchange an item?', a: `Yes. If the fit or the product is not right, request a return or exchange within ${RETURN_DAYS} days of delivery, or the window shown on the product page. Items must be unworn, unwashed and have their tags.` },
      { q: 'What if I get a damaged or wrong item?', a: 'Tell us within 48 hours of delivery and send clear photos. We will replace it or refund you.' },
      { q: 'When will I get my refund?', a: 'After we receive and check the returned item, refunds go to your original payment method. COD refunds go to the bank account or UPI ID you share with us.' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { q: 'Which payment methods do you accept?', a: 'UPI, debit and credit cards, net banking, and cash on delivery on eligible pin codes. You see your options at checkout.' },
      { q: 'Is it safe to pay online?', a: 'Yes. Payments run through secure payment partners and we never store your card details.' },
      { q: 'Do you offer cash on delivery?', a: 'COD is available on eligible pin codes. Enter your pin code at checkout to check.' },
    ],
  },
  {
    title: 'Products and sizing',
    items: [
      { q: 'Are the fabrics really from Tirupur?', a: 'Yes. We source directly from manufacturers in Tirupur, India’s knitwear capital, so you get export-grade stitching without retail markup.' },
      { q: 'How do I pick the right size?', a: 'Check the size chart on each product page. If you are between sizes or unsure, message us on WhatsApp and we will help you pick.' },
      { q: 'Do you sell for both kids and ladies?', a: 'Yes. We have kids’ and ladies’ clothing. Use the categories on the home page to browse each.' },
    ],
  },
];

// FAQ structured data helps Google show these answers in search results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((g) => g.items).map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
};

export default function FaqPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || DEFAULT_WHATSAPP;

  return (
    <div style={{ background: PAPER }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header style={{ background: WASH, borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold hover:gap-2.5 transition-all" style={{ color: PRIMARY, fontFamily: FONT_SANS }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="mt-6 text-[34px] sm:text-[52px] leading-[1.05]" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
            Frequently asked questions
          </h1>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span style={{ width: 36, height: 1, background: GOLD }} />
            <span className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
          </div>
          <p className="text-[15px] leading-[1.8] font-light max-w-[56ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
            Quick answers about delivery, returns, payments and sizing.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        {GROUPS.map((g, gi) => (
          <section
            key={g.title}
            className="grid md:grid-cols-[1fr_1.9fr] gap-4 md:gap-16 py-8 first:pt-0"
            style={{ borderTop: gi === 0 ? 'none' : `1px solid ${LINE}` }}
          >
            <h2 className="text-[24px] sm:text-[30px] leading-tight md:sticky md:top-28 self-start" style={{ color: INK, fontFamily: FONT_SERIF, fontWeight: 400 }}>
              {g.title}
            </h2>
            <div style={{ borderTop: `1px solid ${LINE}` }}>
              {g.items.map((f) => (
                <details key={f.q} className="group py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
                  <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-bold [&::-webkit-details-marker]:hidden" style={{ color: INK, fontFamily: FONT_SANS }}>
                    {f.q}
                    <ChevronDown size={18} className="shrink-0 ml-4 transition-transform group-open:rotate-180" style={{ color: PRIMARY }} />
                  </summary>
                  <p className="mt-3 text-[14px] leading-[1.8] font-light max-w-[62ch]" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Still need help */}
        <div className="mt-6 p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5" style={{ background: PRIMARY, color: PAPER }}>
          <div>
            <h2 className="text-[22px] sm:text-[28px] leading-tight" style={{ fontFamily: FONT_SERIF, fontWeight: 400 }}>Still need help?</h2>
            <p className="mt-1 text-[14px] font-light" style={{ color: 'rgba(255,249,240,0.8)', fontFamily: FONT_SANS }}>Message us and we will get back to you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi! I have a question.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors hover:bg-[#FFF9F0]"
              style={{ background: GOLD, color: INK, fontFamily: FONT_SANS }}
            >
              Chat on WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 px-6 py-3 text-[12px] font-bold tracking-[2px] uppercase"
              style={{ border: `1px solid ${PAPER}`, color: PAPER, fontFamily: FONT_SANS }}
            >
              <Mail size={14} /> Email us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}