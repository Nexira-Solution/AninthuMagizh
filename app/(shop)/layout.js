// app/(shop)/layout.js
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getNavCategories } from '@/lib/navCategories';
import { getSiteSettings } from '@/lib/siteSettings';
import { themeCss } from '@/lib/siteDefaults';

export async function generateMetadata() {
  const site = await getSiteSettings();
  return {
    title: { default: site.storeName, template: `%s | ${site.storeName}` },
    description: site.tagline,
    icons: { icon: site.logo },
  };
}

export default async function ShopLayout({ children }) {
  // Both are cached on the server; the admin "Site settings" save clears the site cache
  const [categories, site] = await Promise.all([getNavCategories(), getSiteSettings()]);

  return (
    <>
      {/* Admin-chosen colours override the defaults in globals.css */}
      <style dangerouslySetInnerHTML={{ __html: themeCss(site) }} />
      <Navbar categories={categories} site={site} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <WhatsAppButton phone={site.whatsapp || '916369116002'} />
    </>
  );
}