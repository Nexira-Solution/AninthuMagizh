// Server-only: reads the site settings saved from the admin panel.
import { unstable_cache } from 'next/cache';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { mergeSite } from '@/lib/siteDefaults';

export const SITE_TAG = 'site-settings';

async function readRaw() {
  await dbConnect();
  const doc = await Settings.findOne({ key: 'global' }).select('site').lean();
  return JSON.parse(JSON.stringify(doc?.site || {}));
}

const cached = unstable_cache(readRaw, ['site-settings-v1'], { tags: [SITE_TAG], revalidate: 3600 });

// Used by layouts / pages / footer (cached; cleared when admin saves)
export async function getSiteSettings() {
  try { return mergeSite(await cached()); } catch { return mergeSite({}); }
}

// Used by the admin editor (always fresh)
export async function getSiteSettingsFresh() {
  return mergeSite(await readRaw());
}