// One place for business details. Used by the footer and by the FAQ / Terms / Privacy pages.
// Edit here and every page updates.

export const STORE_NAME = 'Aninthu Magizh';
export const BRAND_NAME = 'Kids & Ladies Corner';
export const TAGLINE = 'Kids and ladies clothing from Tirupur, handpicked with love.';

export const PHONES = ['6369116002'];
export const EMAIL = 'tipsready9@gmail.com';
export const DEFAULT_WHATSAPP = '916369116002';

export const ADDRESS_LINES = [
  'Ilavarasi, Ganapathy Nagar,',
  'Rayarpalayam, Palladam,',
  'Tiruppur, Tamil Nadu - 641664',
];

// Plain data only: icons are mapped by `key` inside Footer.
export const SOCIALS = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/aninthu_magizh_manufacturer' },
];

// Policy values used in the written pages. Confirm these match how you really operate.
export const DELIVERY_TIME = '3 to 7 business days';
export const RETURN_DAYS = 7;
export const GOVERNING_CITY = 'Tiruppur';
export const POLICY_UPDATED = '20 November 2026';

// 9791368249 or 919791368249 -> +91 97913 68249
export function formatPhone(num = '') {
  const digits = String(num).replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) return num;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}