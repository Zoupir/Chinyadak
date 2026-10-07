import fs from 'node:fs';

// Normalize AdminView to the exact shape expected by the main v30.5.0
// migration; post-v3050-adminview restores the richer initialTarget fallback.
{
  const path = 'src/components/admin/AdminView.tsx';
  let source = fs.readFileSync(path, 'utf8');

  const canonical = `  >(() => {\n    if (typeof window === 'undefined') return 'overview';\n    const candidate = new URLSearchParams(window.location.search).get('tab') || '';\n    const allowed = new Set(['overview','cars','products','categories','menus_attrs','footer','pages','articles','sliders','orders','customers','admins','gateways','sandbox','apis','theme','bulk','analytics']);\n    return (allowed.has(candidate) ? candidate : 'overview') as any;\n  });`;

  const enhanced = `  >(() => {\n    if (typeof window !== 'undefined') {\n      const candidate = new URLSearchParams(window.location.search).get('tab') || '';\n      const allowed = new Set(['overview','cars','products','categories','menus_attrs','mega_menu','media','icons','footer','pages','articles','sliders','banners','home_layout','orders','customers','admins','gateways','sandbox','apis','theme','seo','bulk','analytics']);\n      if (allowed.has(candidate)) return candidate as any;\n    }\n    return initialTarget?.startsWith('product:') ? 'products' : initialTarget?.startsWith('article:') ? 'articles' : initialTarget?.startsWith('category:') ? 'categories' : initialTarget?.startsWith('page:') ? 'pages' : initialTarget === 'blog' ? 'articles' : 'overview';\n  });`;

  if (source.includes(enhanced)) {
    source = source.replace(enhanced, canonical);
  } else if (!source.includes(canonical)) {
    const legacy = `  >(initialTarget?.startsWith('product:') ? 'products' : initialTarget?.startsWith('article:') ? 'articles' : initialTarget?.startsWith('category:') ? 'categories' : initialTarget?.startsWith('page:') ? 'pages' : initialTarget === 'blog' ? 'articles' : 'overview');`;
    if (!source.includes(legacy)) throw new Error('Unable to normalize AdminView activeTab initializer for v30.5.0 patch');
    source = source.replace(legacy, canonical);
  }

  fs.writeFileSync(path, source);
}

// AdminFooterTab already had a RichTextEditor in the current branch, but its
// markup predates the exact migration marker. Normalize it so the main patch
// recognizes the feature as already migrated instead of treating it as a
// missing plain-text input.
{
  const path = 'src/components/admin/AdminFooterTab.tsx';
  let source = fs.readFileSync(path, 'utf8');
  const canonical = `            <div className="pt-2" data-rich-copyright-editor="1">\n              <RichTextEditor\n                label="متن کپی‌رایت انتهای فوتر"\n                value={footerCopyrightText}\n                onChange={setFooterCopyrightText}\n                rows={4}\n                placeholder="متن کپی‌رایت را بنویسید؛ رنگ، لینک، ضخامت، زیرخط و چینش قابل تنظیم است..."\n                helperText="استایل و رنگ انتخاب‌شده دقیقاً در فوتر فروشگاه نمایش داده می‌شود."\n              />\n            </div>\n`;

  if (!source.includes(canonical)) {
    const current = `            <div className="pt-2">\n              <label className="block text-neutral-700 font-bold mb-1">متن کپی‌رایت انتهای فوتر:</label>\n              <RichTextEditor label="کپی‌رایت فوتر" value={footerCopyrightText} onChange={setFooterCopyrightText} rows={2}\n                placeholder="© ۲۰۲۶ تمامی حقوق محفوظ است. برای درج پیوند از دکمهٔ پیوند استفاده کنید." />\n            </div>\n`;
    if (!source.includes(current)) throw new Error('Unable to normalize AdminFooter copyright editor for v30.5.0 patch');
    source = source.replace(current, canonical);
  }
  fs.writeFileSync(path, source);
}

console.log('v30.5.0 pre-patch normalization OK.');
