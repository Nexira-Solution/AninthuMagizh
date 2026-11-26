// app/api/admin/site/route.js
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { SITE_TAG, getSiteSettingsFresh } from '@/lib/siteSettings';
import { sanitizeSite, mergeSite } from '@/lib/siteDefaults';

// TODO: protect with the same admin check your other /api/admin routes use, e.g.
// const denied = await requireAdmin(req); if (denied) return denied;

export async function GET() {
  try {
    return NextResponse.json({ site: await getSiteSettingsFresh() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    // const denied = await requireAdmin(req); if (denied) return denied;
    const body = await req.json();
    const site = sanitizeSite(body);
    if (!site.storeName) return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    await dbConnect();
    // strict:false lets this save even if `site` is not in the Settings schema yet
    await Settings.findOneAndUpdate({ key: 'global' }, { $set: { site } }, { upsert: true, strict: false });
    revalidateTag(SITE_TAG);
    revalidatePath('/', 'layout');
    return NextResponse.json({ site: mergeSite(site) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}