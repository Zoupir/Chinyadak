import fs from 'node:fs';

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
console.log('AdminView pre-patch normalization OK.');
