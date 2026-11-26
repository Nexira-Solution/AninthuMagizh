// Pure helpers (safe to import from client AND server components).
import { STORE_NAME, BRAND_NAME, TAGLINE, PHONES, EMAIL, DEFAULT_WHATSAPP, ADDRESS_LINES, SOCIALS } from '@/lib/siteConfig';

export const DEFAULT_COLORS = {
  primary: '#8F1538',   // header bars, prices, links
  secondary: '#C58A08', // buttons, gold details
  bg: '#FFF9F0',        // page background
  accent: '#E60062',    // errors, destructive
  highlight: '#075447', // badges, savings
  ink: '#29211E',       // main text
  inkSoft: '#8A7A70',   // muted text
  line: '#E8D5C4',      // borders
  wash: '#F6EADB',      // soft fill
};

export const SOCIAL_KEYS = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube']];

const HEX = /^#[0-9a-f]{6}$/i;
const str = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

export function defaultSite() {
  return {
    storeName: STORE_NAME,
    brandName: BRAND_NAME,
    tagline: TAGLINE,
    logo: '/logo.png',
    phones: [...PHONES],
    email: EMAIL || '',
    whatsapp: DEFAULT_WHATSAPP || '',
    addressLines: [...ADDRESS_LINES],
    socials: SOCIALS.map(({ key, label, href }) => ({ key, label, href })),
    colors: { ...DEFAULT_COLORS },
  };
}

// Saved (possibly partial) settings + defaults -> complete, safe object
export function mergeSite(saved = {}) {
  const d = defaultSite();
  const colors = { ...d.colors };
  for (const k of Object.keys(colors)) if (HEX.test(saved?.colors?.[k] || '')) colors[k] = saved.colors[k];
  return {
    storeName: str(saved.storeName, d.storeName),
    brandName: str(saved.brandName, d.brandName),
    tagline: str(saved.tagline, d.tagline),
    logo: str(saved.logo, d.logo),
    phones: Array.isArray(saved.phones) ? saved.phones : d.phones,
    email: typeof saved.email === 'string' ? saved.email : d.email,
    whatsapp: typeof saved.whatsapp === 'string' ? saved.whatsapp : d.whatsapp,
    addressLines: Array.isArray(saved.addressLines) ? saved.addressLines : d.addressLines,
    socials: Array.isArray(saved.socials) ? saved.socials : d.socials,
    colors,
  };
}

// Validate whatever the admin form sends before it is stored
export function sanitizeSite(input = {}) {
  const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
  const list = (v, max) => (Array.isArray(v) ? v : []).map((x) => clean(x, max)).filter(Boolean).slice(0, 10);
  const logo = clean(input.logo, 900000);
  const okLogo = /^(\/|https?:\/\/|data:image\/(png|jpe?g|webp|svg\+xml|gif);base64,)/i.test(logo);
  const colors = {};
  for (const k of Object.keys(DEFAULT_COLORS)) colors[k] = HEX.test(input.colors?.[k] || '') ? input.colors[k] : DEFAULT_COLORS[k];
  const socials = (Array.isArray(input.socials) ? input.socials : [])
    .filter((s) => SOCIAL_KEYS.some(([k]) => k === s.key) && /^https?:\/\//i.test(s.href || ''))
    .map((s) => ({ key: s.key, label: SOCIAL_KEYS.find(([k]) => k === s.key)[1], href: clean(s.href, 300) }));
  return {
    storeName: clean(input.storeName, 80),
    brandName: clean(input.brandName, 80),
    tagline: clean(input.tagline, 240),
    logo: okLogo ? logo : '',
    phones: list(input.phones, 20),
    email: clean(input.email, 120),
    whatsapp: clean(input.whatsapp, 20).replace(/\D/g, ''),
    addressLines: list(input.addressLines, 120),
    socials,
    colors,
  };
}

/* ---------- theme ---------- */
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('');
const mix = (h, t, p) => { const a = toRgb(h), b = toRgb(t); return toHex(a.map((v, i) => v + (b[i] - v) * p)); };

export function themeVars(site) {
  const c = site.colors;
  return {
    '--brand-primary': c.primary,
    '--brand-primary-dark': mix(c.primary, '#000000', 0.23),
    '--brand-secondary': c.secondary,
    '--brand-secondary-dark': mix(c.secondary, '#000000', 0.15),
    '--brand-secondary-text': mix(c.secondary, '#000000', 0.3),
    '--brand-secondary-light': mix(c.secondary, '#ffffff', 0.35), // gold used on crimson (footer, marquee)
    '--brand-bg': c.bg,
    '--brand-accent': c.accent,
    '--brand-highlight': c.highlight,
    '--brand-ink': c.ink,
    '--brand-ink-soft': c.inkSoft,
    '--brand-line': c.line,
    '--brand-wash': c.wash,
  };
}

// CSS string for a <style> tag; overrides the defaults in globals.css
export function themeCss(site) {
  return `:root{${Object.entries(themeVars(site)).map(([k, v]) => `${k}:${v}`).join(';')}}`;
}