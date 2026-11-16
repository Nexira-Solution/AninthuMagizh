import './globals.css';
import { Playfair_Display, Poppins } from 'next/font/google';
import { unstable_cache } from 'next/cache';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/components/CartContext';
import { WishlistProvider } from '@/components/WhishlistContext';
// import BottomNav from '@/components/BottomNav';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
  display: 'swap',
});

const body = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const SITE_NAME = 'Aninthu Magizh';
// TODO: replace the fallback with your real domain (or set NEXT_PUBLIC_SITE_URL in your env)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aninthumagizh.in').replace(/\/+$/, '');
const DEFAULT_TITLE = 'Aninthu Magizh | Women Kurtis, Nighties & Innerwear Online';
const DEFAULT_DESCRIPTION =
  'Shop women’s kurtis, nighties, innerwear and trending ethnic wear online at Aninthu Magizh. Quality fabrics, latest designs, easy returns and fast delivery across India.';

// Theme: #8F1538 (primary), #C58A08 (secondary), #FFF9F0 (background), #E60062 (accent), #075447 (highlight), #29211E (text)
const BG = '#FFF9F0';
const INK = '#29211E';
const LINE = '#E8D5C4';
const HIGHLIGHT = '#075447';
const ACCENT = '#E60062';

// Cached for 1 hour. Call revalidateTag('settings') after saving settings in admin.
const getSeoSettings = unstable_cache(
  async () => {
    try {
      await dbConnect();
      const s = await Settings.findOne({ key: 'global' })
        .select('seoTitle seoDescription')
        .lean();
      return s
        ? { seoTitle: s.seoTitle || null, seoDescription: s.seoDescription || null }
        : null;
    } catch {
      return null;
    }
  },
  ['global-seo-settings'],
  { revalidate: 3600, tags: ['settings'] }
);

export async function generateMetadata() {
  const settings = await getSeoSettings();

  const title = settings?.seoTitle || DEFAULT_TITLE;
  const description = settings?.seoDescription || DEFAULT_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    generator: 'Next.js',
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'shopping',
    keywords: [
      'women kurtis online',
      'kurtis for women',
      'nighties online',
      'night dress for women',
      'innerwear online',
      'ethnic wear for women',
      'Aninthu Magizh',
      'women fashion India',
    ],
    // NOTE: do NOT set `alternates.canonical` here. A layout-level canonical
    // would point every page at the homepage. Set it per page in each
    // page's generateMetadata (e.g. alternates: { canonical: `/product/${slug}` }).
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      url: SITE_URL,
      // Add /app/opengraph-image.jpg (1200x630) and Next will wire it up automatically
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    // Add after verifying in Google Search Console / Bing Webmaster
    // verification: { google: 'YOUR_GOOGLE_CODE', other: { 'msvalidate.01': 'YOUR_BING_CODE' } },
    icons: {
      icon: '/favicon.ico',
      // apple: '/apple-touch-icon.png',
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BG,
};

// Site-wide structured data: Organization + WebSite (enables sitelinks / brand knowledge panel)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`, // make sure this file exists in /public
      // sameAs: ['https://www.instagram.com/...', 'https://www.facebook.com/...'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
      // Keep only if you have a /search?q= page
      // potentialAction: {
      //   '@type': 'SearchAction',
      //   target: `${SITE_URL}/search?q={search_term_string}`,
      //   'query-input': 'required name=search_term_string',
      // },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      {/* background comes from globals.css (cream) */}
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <script
          type="application/ld+json"
          // Escape "<" so the JSON can never break out of the script tag
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />

        <CartProvider>
          <WishlistProvider>
            {children}

            {/* spacer so page content isn't hidden behind the fixed mobile nav */}
            <div className="md:hidden h-16" />

            {/* <BottomNav /> */}
          </WishlistProvider>
        </CartProvider>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              background: BG,
              color: INK,
              border: `1px solid ${LINE}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: {
              iconTheme: { primary: HIGHLIGHT, secondary: BG },
            },
            error: {
              iconTheme: { primary: ACCENT, secondary: BG },
            },
          }}
        />
      </body>
    </html>
  );
}