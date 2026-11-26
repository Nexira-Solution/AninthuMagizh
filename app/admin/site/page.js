'use client';
// app/admin/site/page.jsx  (add "Site settings" -> /admin/site to your admin sidebar)

import { useEffect, useRef, useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { C, Card, Btn, Field, PageHead, Err, inp, api } from '@/components/admin/ui';
import { DEFAULT_COLORS, SOCIAL_KEYS, mergeSite, themeVars } from '@/lib/siteDefaults';

const COLORS = [
  ['primary', 'Primary', 'Header bars, prices, links'],
  ['secondary', 'Secondary', 'Buttons and gold details'],
  ['bg', 'Page background', ''],
  ['accent', 'Accent', 'Errors, destructive actions'],
  ['highlight', 'Highlight', 'Badges, savings'],
  ['ink', 'Main text', ''],
  ['inkSoft', 'Muted text', ''],
  ['line', 'Borders', ''],
  ['wash', 'Soft fill', ''],
];

const readAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(new Error('Could not read file'));
  r.readAsDataURL(file);
});

async function fileToLogo(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image');
  if (file.size > 3e6) throw new Error('Image is too large (max 3 MB)');
  const url = await readAsDataURL(file);
  if (file.type === 'image/svg+xml') {
    if (file.size > 150000) throw new Error('SVG is too large (max 150 KB)');
    return url;
  }
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read image')); i.src = url; });
  const scale = Math.min(1, 600 / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}

const toForm = (s) => ({
  ...s,
  phonesText: s.phones.join('\n'),
  addressText: s.addressLines.join('\n'),
  social: Object.fromEntries(SOCIAL_KEYS.map(([k]) => [k, s.socials.find((x) => x.key === k)?.href || ''])),
});

export default function SiteSettingsPage() {
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api('/api/admin/site').then((d) => setF(toForm(mergeSite(d.site)))).catch((e) => setErr(e.message));
  }, []);

  if (!f) return <div><PageHead title="Site settings" sub="Logo, store name, contact details and colours" /><Err msg={err} /></div>;

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setColor = (k, v) => setF((x) => ({ ...x, colors: { ...x.colors, [k]: v } }));
  const lines = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);

  async function pickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setErr(''); const logo = await fileToLogo(file); setF((x) => ({ ...x, logo })); } catch (x) { setErr(x.message); }
  }

  async function save() {
    setBusy(true); setErr(''); setOk('');
    try {
      const body = {
        storeName: f.storeName, brandName: f.brandName, tagline: f.tagline, logo: f.logo,
        phones: lines(f.phonesText), email: f.email, whatsapp: f.whatsapp, addressLines: lines(f.addressText),
        socials: SOCIAL_KEYS.map(([key]) => ({ key, href: f.social[key].trim() })).filter((s) => s.href),
        colors: f.colors,
      };
      const d = await api('/api/admin/site', { method: 'PUT', body });
      setF(toForm(mergeSite(d.site)));
      setOk('Saved. The storefront updates within moments.');
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  const vars = themeVars({ colors: f.colors });

  return (
    <div>
      <PageHead title="Site settings" sub="Logo, store name, contact details and colours used across the storefront">
        <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Btn>
      </PageHead>
      <Err msg={err} />
      {ok && <p className="text-sm mb-3" style={{ color: C.GREEN }}>{ok}</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-medium mb-3">Brand</div>
            <div className="flex items-center gap-4 mb-4">
              <div style={{ width: 96, height: 96, border: `1px solid ${C.LINE}`, borderRadius: 6, background: '#fff' }} className="flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.logo || '/logo.png'} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div className="flex-1">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickLogo} />
                <div className="flex gap-2 mb-2">
                  <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload logo</Btn>
                  <Btn variant="ghost" onClick={() => setF((x) => ({ ...x, logo: '/logo.png' }))}>Reset</Btn>
                </div>
                <input style={inp} placeholder="…or paste an image URL / path" value={f.logo.startsWith('data:') ? '' : f.logo} onChange={set('logo')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Store name" style={{ gridColumn: 'span 2' }}><input style={inp} value={f.storeName} onChange={set('storeName')} /></Field>
              <Field label="Brand / company line" style={{ gridColumn: 'span 2' }}><input style={inp} value={f.brandName} onChange={set('brandName')} /></Field>
              <Field label="Tagline (footer)" style={{ gridColumn: 'span 2' }}><textarea style={{ ...inp, minHeight: 60 }} value={f.tagline} onChange={set('tagline')} /></Field>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-medium mb-3">Contact</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone numbers (one per line)"><textarea style={{ ...inp, minHeight: 70 }} value={f.phonesText} onChange={set('phonesText')} /></Field>
              <Field label="Address (one line per row)"><textarea style={{ ...inp, minHeight: 70 }} value={f.addressText} onChange={set('addressText')} /></Field>
              <Field label="Email"><input style={inp} value={f.email} onChange={set('email')} /></Field>
              <Field label="WhatsApp (91XXXXXXXXXX)"><input style={inp} value={f.whatsapp} onChange={set('whatsapp')} /></Field>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-medium mb-3">Social links</div>
            <div className="grid gap-3">
              {SOCIAL_KEYS.map(([k, label]) => (
                <Field key={k} label={label}>
                  <input style={inp} placeholder="https://…" value={f.social[k]} onChange={(e) => setF((x) => ({ ...x, social: { ...x.social, [k]: e.target.value } }))} />
                </Field>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Theme colours</div>
              <Btn variant="ghost" onClick={() => setF((x) => ({ ...x, colors: { ...DEFAULT_COLORS } }))}><RotateCcw size={13} /> Reset</Btn>
            </div>
            <div className="grid gap-2.5">
              {COLORS.map(([k, label, hint]) => (
                <div key={k} className="flex items-center gap-3">
                  <input type="color" value={f.colors[k]} onChange={(e) => setColor(k, e.target.value)} style={{ width: 40, height: 34, border: `1px solid ${C.LINE}`, borderRadius: 4, padding: 2, background: '#fff' }} />
                  <div className="flex-1 text-sm">{label}{hint && <span className="block text-xs" style={{ color: C.SOFT }}>{hint}</span>}</div>
                  <input style={{ ...inp, width: 100 }} value={f.colors[k]} onChange={(e) => setColor(k, e.target.value)} maxLength={7} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-medium mb-3">Live preview</div>
            <div style={{ ...vars, border: '1px solid var(--brand-line)', background: 'var(--brand-bg)', color: 'var(--brand-ink)' }}>
              <div style={{ background: 'var(--brand-primary)', color: 'var(--brand-bg)', fontSize: 12, padding: '6px 12px' }}>Free shipping on orders above ₹999</div>
              <div className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--brand-line)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.logo || '/logo.png'} alt="" style={{ height: 40, objectFit: 'contain' }} />
                <strong style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 18 }}>{f.storeName}</strong>
              </div>
              <div className="p-4">
                <p style={{ fontSize: 12, color: 'var(--brand-ink-soft)' }}>Cotton kurti</p>
                <p style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>₹799 <span style={{ color: 'var(--brand-ink-soft)', textDecoration: 'line-through', fontWeight: 300, fontSize: 12 }}>₹999</span></p>
                <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', fontSize: 11, background: 'var(--brand-highlight)', color: 'var(--brand-bg)' }}>20% off</span>
                <div className="mt-3 flex gap-2">
                  <span style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: 'var(--brand-secondary)', color: 'var(--brand-ink)' }}>Add to cart</span>
                  <span style={{ padding: '8px 16px', fontSize: 12, background: 'var(--brand-wash)', border: '1px solid var(--brand-line)' }}>Wishlist</span>
                </div>
              </div>
              <div style={{ background: 'var(--brand-primary)', color: 'var(--brand-bg)', padding: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--brand-secondary-light)' }}>{f.storeName}</span> · {f.brandName}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}