import Link from 'next/link';
import { Instagram, Facebook, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { Fraunces, Inter } from 'next/font/google';
import { formatPhone } from '@/lib/siteConfig';
import { getSiteSettings } from '@/lib/siteSettings';

const display = Fraunces({ subsets: ['latin'], weight: ['400'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-body' });

const SOCIAL_ICONS = { instagram: Instagram, facebook: Facebook, youtube: Youtube };

const EXPLORE = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'Wishlist', href: '/wishlist' },
];
const HELP = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

// Colours follow the admin theme (CSS variables from the shop layout)
const BG = 'var(--brand-primary)';
const ACCENT = 'var(--brand-secondary-light)';
const TEXT = 'var(--brand-bg)';
const TEXT_SOFT = 'color-mix(in srgb, var(--brand-bg) 75%, transparent)';
const LINE = 'color-mix(in srgb, var(--brand-bg) 20%, transparent)';
const CHIP = 'color-mix(in srgb, var(--brand-bg) 12%, transparent)';
const WA_GREEN = '#25D366'; // WhatsApp brand colour, intentionally fixed

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.105.549 4.16 1.595 5.974L0 24l6.223-1.633a11.9 11.9 0 005.822 1.485h.005c6.582 0 11.94-5.36 11.943-11.943a11.87 11.87 0 00-3.473-8.46" />
    </svg>
  );
}

function SocialRow({ whatsapp, socials, email }) {
  const base = 'flex items-center justify-center w-12 h-12 rounded-full transition-transform hover:scale-105';
  return (
    <div className="flex items-center gap-3">
      {socials.map(({ key, label, href }) => {
        const Icon = SOCIAL_ICONS[key];
        if (!Icon) return null;
        return (
          <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label} className={base} style={{ background: CHIP, color: TEXT }}>
            <Icon size={22} strokeWidth={1.8} />
          </a>
        );
      })}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className={base} style={{ background: WA_GREEN, color: '#fff' }}>
          <WhatsAppIcon size={22} />
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} aria-label="Email" className={base} style={{ background: CHIP, color: TEXT }}>
          <Mail size={22} strokeWidth={1.8} />
        </a>
      )}
    </div>
  );
}

function MobileSection({ title, children }) {
  return (
    <div className="py-7 border-t" style={{ borderColor: LINE }}>
      <h3 className={`${display.className} text-[26px] leading-tight mb-4`} style={{ color: TEXT, fontWeight: 400 }}>{title}</h3>
      {children}
    </div>
  );
}

function MobileLinks({ links }) {
  return (
    <ul className="space-y-3.5">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-[17px] hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function DesktopColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-[12px] font-medium mb-5" style={{ color: ACCENT }}>{title}</h3>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[14px] hover:opacity-70 transition-opacity" style={{ color: TEXT }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactCell({ Icon, label, children, last }) {
  return (
    <div className="flex items-start gap-4 px-8 first:pl-0 last:pr-0 py-8" style={last ? undefined : { borderRight: `1px solid ${LINE}` }}>
      <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: CHIP, color: ACCENT }}>
        <Icon size={19} strokeWidth={1.7} />
      </span>
      <div className="text-[14px] leading-relaxed" style={{ color: TEXT_SOFT }}>
        <p className="text-[12px] mb-1" style={{ color: ACCENT }}>{label}</p>
        {children}
      </div>
    </div>
  );
}

export default async function Footer() {
  const site = await getSiteSettings();
  const { storeName, brandName, tagline, whatsapp, email, socials, addressLines } = site;
  const phone = site.phones[0];
  const telHref = phone ? `tel:+91${String(phone).replace(/\D/g, '').slice(-10)}` : null;

  return (
    <footer className={`${body.className} mt-16`} style={{ background: BG }}>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div style={{ borderBottom: `1px solid ${LINE}` }}>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-3">
            <ContactCell Icon={MapPin} label="Visit us">
              {addressLines.map((l) => (<span key={l} className="block">{l}</span>))}
              <span className="block mt-1 text-[12px]">Online sales only</span>
            </ContactCell>

            <ContactCell Icon={Phone} label="Call or WhatsApp">
              {phone && <a href={telHref} className="block hover:opacity-70 transition-opacity" style={{ color: TEXT }}>{formatPhone(phone)}</a>}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="block mt-1 hover:opacity-70 transition-opacity" style={{ color: ACCENT }}>
                  Chat on WhatsApp
                </a>
              )}
            </ContactCell>

            <ContactCell Icon={Mail} label="Email us" last>
              {email && <a href={`mailto:${email}`} className="break-all hover:opacity-70 transition-opacity" style={{ color: TEXT }}>{email}</a>}
              <span className="block mt-1 text-[12px]">We reply within one working day</span>
            </ContactCell>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-12 gap-10">
          <div className="col-span-6">
            <h2 className={`${display.className} text-[44px] leading-[1.05]`} style={{ color: TEXT, fontWeight: 400 }}>{storeName}</h2>
            <p className="mt-2 text-[13px]" style={{ color: ACCENT }}>{brandName}</p>
            <p className="mt-5 text-[15px] leading-relaxed max-w-[38ch]" style={{ color: TEXT_SOFT }}>{tagline}</p>
            <div className="mt-8"><SocialRow whatsapp={whatsapp} socials={socials} email={email} /></div>
          </div>
          <div className="col-span-3"><DesktopColumn title="Explore" links={EXPLORE} /></div>
          <div className="col-span-3"><DesktopColumn title="Help" links={HELP} /></div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="md:hidden px-6 pt-12 pb-4">
        <div className="pb-8">
          <h2 className={`${display.className} text-[32px] leading-tight`} style={{ color: TEXT, fontWeight: 400 }}>{storeName}</h2>
          <p className="mt-1 text-[14px]" style={{ color: ACCENT }}>{brandName}</p>
          <p className="mt-4 text-[17px] leading-relaxed max-w-[34ch]" style={{ color: TEXT_SOFT }}>{tagline}</p>
        </div>

        <MobileSection title="Get in Touch">
          <div className="space-y-3.5 text-[17px] leading-relaxed" style={{ color: TEXT_SOFT }}>
            {addressLines.length > 0 && (
              <p className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-1.5" style={{ color: ACCENT }} />
                <span>{addressLines.map((l, i) => (<span key={l}>{l}{i < addressLines.length - 1 && <br />}</span>))}</span>
              </p>
            )}
            {phone && <p><a href={telHref} style={{ color: TEXT }}>{formatPhone(phone)}</a></p>}
            {whatsapp && <p><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>WhatsApp us</a></p>}
            {email && <p><a href={`mailto:${email}`} className="break-all" style={{ color: ACCENT }}>{email}</a></p>}
            <p className="inline-flex items-center gap-2 text-[14px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              Online sales only
            </p>
          </div>
        </MobileSection>

        <MobileSection title="Explore"><MobileLinks links={EXPLORE} /></MobileSection>
        <MobileSection title="Help"><MobileLinks links={HELP} /></MobileSection>

        <div className="pt-2 pb-4"><SocialRow whatsapp={whatsapp} socials={socials} email={email} /></div>
      </div>

      <div style={{ borderTop: `1px solid ${LINE}` }}>
        <div className="max-w-7xl mx-auto px-6 md:px-4 pt-5 pb-28 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-[12px]" style={{ color: TEXT_SOFT }}>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <a href="https://www.nexirasolution.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-75" style={{ color: TEXT_SOFT }}>
            Designed and developed by
            <span className="font-medium tracking-wide" style={{ color: ACCENT }}>Nexira Solution</span>
          </a>
        </div>
      </div>
    </footer>
  );
}