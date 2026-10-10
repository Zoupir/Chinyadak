import fs from 'node:fs';

const changed = [];

const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`v30.5.1 patch target missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const replaceRegexOnce = (source, regex, replacement, marker, label) => {
  if (marker && source.includes(marker)) return source;
  let count = 0;
  const result = source.replace(regex, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count !== 1) throw new Error(`v30.5.1 patch expected exactly one ${label}, got ${count}`);
  return result;
};

// ---------------------------------------------------------------------------
// Admin deep links must retain the exact target in the URL. This makes both
// the header shortcut and server-rendered floating shortcut survive a reload.
// ---------------------------------------------------------------------------
edit('src/utils/navigation.ts', source => replaceOnce(
  source,
  "  if (view === 'admin') return '/admin';",
  "  if (view === 'admin') return param ? `/admin/${encodeURIComponent(param)}` : '/admin';",
  'admin route target preservation'
));

// Nested private routes must never be converted into SEO 404s before the SPA
// gets a chance to parse their target parameter.
edit('server.ts', source => {
  if (source.includes("const exists = privateRoute ? true : await seoPathExists(req.path);")) return source;
  source = replaceOnce(
    source,
    "        const exists = await seoPathExists(req.path);\n",
    "        const privateRoute = isPrivateStorefrontPath(req.path);\n        const exists = privateRoute ? true : await seoPathExists(req.path);\n",
    'private route before SEO existence check'
  );
  source = replaceOnce(
    source,
    "\n        const privateRoute = isPrivateStorefrontPath(req.path);\n        const seoHtml = await renderSeoHtml(indexTemplate, req.path);",
    "\n        const seoHtml = await renderSeoHtml(indexTemplate, req.path);",
    'remove duplicate private route declaration'
  );
  return source;
});

// Header admin shortcut: cover every editable public entity, not only a subset.
edit('src/components/layout/Header.tsx', source => replaceOnce(
  source,
  `                  const target = currentView === 'product' ? \`product:\${currentParam || ''}\`\n                    : currentView === 'article' ? \`article:\${currentParam || ''}\`\n                    : currentView === 'category' ? \`category:\${currentParam || ''}\`\n                    : currentView === 'page' ? \`page:\${currentParam || ''}\`\n                    : currentView === 'blog' ? 'articles' : currentView;`,
  `                  const target = currentView === 'product' ? \`product:\${currentParam || ''}\`\n                    : currentView === 'article' ? \`article:\${currentParam || ''}\`\n                    : currentView === 'category' ? \`category:\${currentParam || ''}\`\n                    : currentView === 'car-brand' ? \`brand:\${currentParam || ''}\`\n                    : currentView === 'car-model' ? \`model:\${currentParam || ''}\`\n                    : currentView === 'page' ? \`page:\${currentParam || ''}\`\n                    : currentView === 'home' ? 'page:home'\n                    : currentView === 'part-request' ? 'page:part-request'\n                    : currentView === 'blog' ? 'articles' : currentView;`,
  'header edit-current-page target mapping'
));

// ---------------------------------------------------------------------------
// Public SSR storefront: use the same canonical /admin/<target> deep links.
// ---------------------------------------------------------------------------
edit('src/server/public-storefront-react.tsx', source => {
  const replacement = `const adminEditTarget = (view: string, param?: string): string => {\n  if (view === 'product') return \`product:\${param || ''}\`;\n  if (view === 'article') return \`article:\${param || ''}\`;\n  if (view === 'category') return \`category:\${param || ''}\`;\n  if (view === 'car-brand') return \`brand:\${param || ''}\`;\n  if (view === 'car-model') return \`model:\${param || ''}\`;\n  if (view === 'page') return \`page:\${param || ''}\`;\n  if (view === 'home') return 'page:home';\n  if (view === 'blog') return 'articles';\n  if (view === 'shop') return 'products';\n  return view || 'overview';\n};\n\nconst adminEditUrl = (view: string, param?: string): string =>\n  buildRoutePath('admin', adminEditTarget(view, param));\n\nconst PublicStorefrontChrome`;
  return replaceRegexOnce(
    source,
    /const adminEditUrl = \(view: string, param\?: string\): string => \{[\s\S]*?\n\};\n\nconst PublicStorefrontChrome/,
    replacement,
    "const adminEditTarget = (view: string, param?: string): string =>",
    'public admin exact edit URL helper'
  );
});

// ---------------------------------------------------------------------------
// AdminView: resolve targets from either the canonical path or legacy query
// links, then pass the exact target into each entity editor.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminView.tsx', source => {
  const resolver = `  const resolvedTarget = (() => {\n    if (initialTarget) return initialTarget;\n    if (typeof window === 'undefined') return undefined;\n    const params = new URLSearchParams(window.location.search);\n    if (params.get('product')) return \`product:\${params.get('product')}\`;\n    if (params.get('article')) return \`article:\${params.get('article')}\`;\n    if (params.get('category')) return \`category:\${params.get('category')}\`;\n    if (params.get('brand')) return \`brand:\${params.get('brand')}\`;\n    if (params.get('model')) return \`model:\${params.get('model')}\`;\n    if (params.get('page')) return \`page:\${params.get('page')}\`;\n    return params.get('tab') || undefined;\n  })();\n\n`;
  if (!source.includes('const resolvedTarget = (() => {')) {
    source = replaceOnce(source, '  // Navigation tab inside Admin\n', resolver + '  // Navigation tab inside Admin\n', 'AdminView resolved target helper');
  }

  const enhanced = `  >(() => {\n    if (typeof window !== 'undefined') {\n      const candidate = new URLSearchParams(window.location.search).get('tab') || '';\n      const allowed = new Set(['overview','cars','products','categories','menus_attrs','mega_menu','media','icons','footer','pages','articles','sliders','banners','home_layout','orders','customers','admins','gateways','sandbox','apis','theme','seo','bulk','analytics']);\n      if (allowed.has(candidate)) return candidate as any;\n    }\n    return initialTarget?.startsWith('product:') ? 'products' : initialTarget?.startsWith('article:') ? 'articles' : initialTarget?.startsWith('category:') ? 'categories' : initialTarget?.startsWith('page:') ? 'pages' : initialTarget === 'blog' ? 'articles' : 'overview';\n  });`;
  const exact = `  >(() => {\n    if (resolvedTarget?.startsWith('product:')) return 'products';\n    if (resolvedTarget?.startsWith('article:')) return 'articles';\n    if (resolvedTarget?.startsWith('category:')) return 'categories';\n    if (resolvedTarget?.startsWith('page:')) return 'pages';\n    if (resolvedTarget?.startsWith('brand:') || resolvedTarget?.startsWith('model:')) return 'cars';\n    if (resolvedTarget === 'blog') return 'articles';\n    const allowed = new Set(['overview','cars','products','categories','menus_attrs','mega_menu','media','icons','footer','pages','articles','sliders','banners','home_layout','orders','customers','admins','gateways','sandbox','apis','theme','seo','bulk','analytics']);\n    return (resolvedTarget && allowed.has(resolvedTarget) ? resolvedTarget : 'overview') as any;\n  });`;
  source = replaceOnce(source, enhanced, exact, 'AdminView exact target tab initializer');

  source = replaceOnce(
    source,
    `  useEffect(() => {\n    if (!initialTarget?.startsWith('product:')) return;\n    const targetId = initialTarget.slice('product:'.length);`,
    `  useEffect(() => {\n    if (!resolvedTarget?.startsWith('product:')) return;\n    const targetId = resolvedTarget.slice('product:'.length);`,
    'product exact editor effect'
  );
  source = source.replace('  }, [initialTarget, products]);', '  }, [resolvedTarget, products]);');

  source = replaceOnce(source, '<AdminCarsTab />', '<AdminCarsTab initialTarget={resolvedTarget} />', 'cars exact target prop');
  source = replaceOnce(
    source,
    `<AdminCategoryStudio initialCategoryId={initialTarget?.startsWith('category:') ? initialTarget.slice('category:'.length) : undefined} />`,
    `<AdminCategoryStudio initialCategoryId={resolvedTarget?.startsWith('category:') ? resolvedTarget.slice('category:'.length) : undefined} />`,
    'category exact target prop'
  );
  source = replaceOnce(
    source,
    `<AdminVisualPageBuilder initialPageId={initialTarget?.startsWith('page:') ? initialTarget.slice('page:'.length) : undefined} onNavigate={(view, param) => {\n              if (onExitToStore) onExitToStore();\n              if (onNavigate) onNavigate(view, param);\n            }} />`,
    `<AdminVisualPageBuilder initialPageId={resolvedTarget?.startsWith('page:') ? resolvedTarget.slice('page:'.length) : undefined} onNavigate={(view, param) => {\n              if (onNavigate) onNavigate(view, param);\n            }} />`,
    'page builder exact target and single navigation'
  );
  source = replaceOnce(
    source,
    `<AdminArticlesTab initialArticleId={initialTarget?.startsWith('article:') ? initialTarget.slice('article:'.length) : undefined} />`,
    `<AdminArticlesTab initialArticleId={resolvedTarget?.startsWith('article:') ? resolvedTarget.slice('article:'.length) : undefined} />`,
    'article exact target prop'
  );
  return source;
});

// Vehicle brand/model editor receives canonical path target as well as legacy query links.
edit('src/components/admin/AdminCarsTab.tsx', source => {
  source = replaceOnce(
    source,
    'export const AdminCarsTab: React.FC = () => {',
    'export const AdminCarsTab: React.FC<{ initialTarget?: string }> = ({ initialTarget }) => {',
    'AdminCars target prop'
  );
  source = replaceOnce(
    source,
    `    const brandTarget = params.get('brand');\n    const modelTarget = params.get('model');`,
    `    const brandTarget = initialTarget?.startsWith('brand:') ? initialTarget.slice('brand:'.length) : params.get('brand');\n    const modelTarget = initialTarget?.startsWith('model:') ? initialTarget.slice('model:'.length) : params.get('model');`,
    'AdminCars path target parsing'
  );
  source = source.replace('  }, [brands.length, models.length]);', '  }, [brands.length, models.length, initialTarget]);');
  return source;
});

// ---------------------------------------------------------------------------
// Vehicle deletion: deleting the active garage entry must clear the active
// filter too. Do this in both the full StoreContext and public SSR context.
// ---------------------------------------------------------------------------
edit('src/context/StoreContext.tsx', source => {
  source = replaceOnce(
    source,
    '  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(false);',
    `  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(() => {\n    if (typeof window === 'undefined') return false;\n    try { return window.sessionStorage.getItem('chinpart_live_edit') === '1'; } catch { return false; }\n  });`,
    'persisted live edit initializer'
  );
  if (!source.includes("sessionStorage.setItem('chinpart_live_edit'")) {
    source = replaceOnce(
      source,
      `  const [adminAuth, setAdminAuth] = useState<AdminAuthState>({`,
      `  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    try { window.sessionStorage.setItem('chinpart_live_edit', isLiveEditActive ? '1' : '0'); } catch { /* optional session storage */ }\n  }, [isLiveEditActive]);\n\n  const [adminAuth, setAdminAuth] = useState<AdminAuthState>({`,
      'persist live edit effect'
    );
  }
  source = replaceOnce(
    source,
    `    if (selectedVehicle?.id === id) {\n      setSelectedVehicleState(updated.length > 0 ? updated[0] : null);\n    }`,
    `    if (selectedVehicle?.id === id) {\n      setSelectedVehicleState(null);\n    }`,
    'clear active vehicle when deleted'
  );
  return source;
});

edit('src/server/ssr-store-context.tsx', source => {
  if (!source.includes("sessionStorage.getItem('chinpart_live_edit')")) {
    source = replaceOnce(
      source,
      `    setWishlist(safeRead<string[]>('chinpart_wishlist', []));\n  }, []);`,
      `    setWishlist(safeRead<string[]>('chinpart_wishlist', []));\n    try { setIsLiveEditActive(window.sessionStorage.getItem('chinpart_live_edit') === '1'); } catch { /* optional session storage */ }\n  }, []);`,
      'SSR live edit restore'
    );
  }
  if (!source.includes("sessionStorage.setItem('chinpart_live_edit'")) {
    source = replaceOnce(
      source,
      `  useEffect(() => safeWrite('chinpart_selected_car', selectedVehicle), [selectedVehicle]);`,
      `  useEffect(() => safeWrite('chinpart_selected_car', selectedVehicle), [selectedVehicle]);\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    try { window.sessionStorage.setItem('chinpart_live_edit', isLiveEditActive ? '1' : '0'); } catch { /* optional session storage */ }\n  }, [isLiveEditActive]);`,
      'SSR live edit persistence'
    );
  }
  if (!source.includes('const removeFromGarage = (id: string) => {')) {
    source = replaceRegexOnce(
      source,
      /(  const addToGarage = \(car: any\) => \{[\s\S]*?\n  \};\n)/,
      `$1\n  const removeFromGarage = (id: string) => {\n    setGarage(current => current.filter(item => item.id !== id));\n    setSelectedVehicle(current => current?.id === id ? null : current);\n  };\n`,
      'const removeFromGarage = (id: string) => {',
      'SSR complete vehicle removal helper'
    );
  }
  source = replaceOnce(
    source,
    `    removeFromGarage: (id: string) => setGarage(current => current.filter(item => item.id !== id)),`,
    `    removeFromGarage,`,
    'SSR use complete garage removal helper'
  );
  return source;
});

// ---------------------------------------------------------------------------
// Copyright output must preserve block-level alignment and inline styling.
// The previous inline renderer discarded paragraph-level styling.
// ---------------------------------------------------------------------------
edit('src/components/layout/Footer.tsx', source => {
  source = replaceOnce(
    source,
    `  const renderCopyright = (text: string) => <RichTextContent content={text} inline className="inline" />;`,
    `  const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-copyright-rich" />;`,
    'copyright block rich text renderer'
  );
  source = replaceOnce(
    source,
    `<span className="marketplace-ref-footer-copyright">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</span>`,
    `<div className="marketplace-ref-footer-copyright">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</div>`,
    'marketplace copyright block container'
  );
  source = replaceOnce(
    source,
    `          <p>\n            {settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`}\n          </p>`,
    `          <div className="footer-copyright-rich-shell">\n            {renderCopyright(settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`)}\n          </div>`,
    'classic copyright rich renderer'
  );
  return source;
});

// Permit the same safe inline typography on paragraph/block nodes because
// TipTap may attach selected color/weight directly to a paragraph.
edit('src/utils/richText.ts', source => replaceOnce(
  source,
  `  if (['SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(tagName)) {`,
  `  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(tagName)) {`,
  'safe block typography styles'
));

edit('src/index.css', source => {
  const css = `\n\n/* v30.5.1 — copyright rich-text styles must win only when the editor did not\n   provide an explicit inline value. Inline colors/sizes therefore remain authoritative. */\n.marketplace-ref-footer-copyright .footer-copyright-rich,\n.footer-copyright-rich-shell .footer-copyright-rich {\n  width: 100%;\n  max-width: 100%;\n}\n.marketplace-ref-footer-copyright .footer-copyright-rich p,\n.footer-copyright-rich-shell .footer-copyright-rich p {\n  margin: 0;\n}\n.marketplace-ref-footer-copyright .footer-copyright-rich a:not([style*="color"]),\n.footer-copyright-rich-shell .footer-copyright-rich a:not([style*="color"]) {\n  color: inherit;\n}\n.marketplace-ref-footer-copyright .footer-copyright-rich a:not([style*="font-size"]),\n.footer-copyright-rich-shell .footer-copyright-rich a:not([style*="font-size"]),\n.marketplace-ref-footer-copyright .footer-copyright-rich span:not([style*="font-size"]),\n.footer-copyright-rich-shell .footer-copyright-rich span:not([style*="font-size"]) {\n  font-size: inherit;\n}\n`;
  return source.includes('v30.5.1 — copyright rich-text styles') ? source : source + css;
});

// ---------------------------------------------------------------------------
// Regression coverage added to the production smoke suite.
// ---------------------------------------------------------------------------
edit('scripts/smoke-test.ts', source => {
  if (!source.includes("buildRoutePath } from '../src/utils/navigation'")) {
    source = replaceOnce(
      source,
      "import { markdownToSafeHtml } from '../src/utils/richText';\n",
      "import { markdownToSafeHtml } from '../src/utils/richText';\nimport { buildRoutePath } from '../src/utils/navigation';\n",
      'smoke navigation import'
    );
  }
  if (!source.includes('Admin deep link lost exact target.')) {
    source = replaceOnce(
      source,
      `  const formattedHtml = markdownToSafeHtml('<p style="text-align: right;"><span style="color: #c2410c;">سلام</span> <a href="https://example.com">پیوند</a></p>');`,
      `  assert.equal(buildRoutePath('admin', 'product:test-slug'), '/admin/product%3Atest-slug', 'Admin deep link lost exact target.');\n  const formattedHtml = markdownToSafeHtml('<p style="text-align: right; color: #e63236; font-weight: 700;"><span style="color: #c2410c;">سلام</span> <a href="https://example.com" style="color: #074493; text-decoration: none;">پیوند</a></p>');`,
      'smoke deep link and styled rich text input'
    );
    source = replaceOnce(
      source,
      `  assert.match(formattedHtml, /color:#c2410c/i, 'Rich text sanitizer dropped inline text color.');`,
      `  assert.match(formattedHtml, /color:#c2410c/i, 'Rich text sanitizer dropped inline text color.');\n  assert.match(formattedHtml, /color:#e63236/i, 'Rich text sanitizer dropped paragraph text color.');\n  assert.match(formattedHtml, /font-weight:700/i, 'Rich text sanitizer dropped paragraph font weight.');\n  assert.match(formattedHtml, /color:#074493/i, 'Rich text sanitizer dropped link color.');\n  assert.match(formattedHtml, /text-decoration:none/i, 'Rich text sanitizer dropped link decoration.');`,
      'smoke rich copyright style assertions'
    );
  }
  if (!source.includes('Nested admin deep link was not served as a private application route.')) {
    source = replaceOnce(
      source,
      `  assert(product?.id && product?.slug, 'No usable seeded product.');\n`,
      `  assert(product?.id && product?.slug, 'No usable seeded product.');\n\n  const adminDeepLink = buildRoutePath('admin', \`product:\${product.slug}\`);\n  const adminDeepResponse = await request(adminDeepLink);\n  assert.equal(adminDeepResponse.headers.get('x-yadak-render-mode'), 'application', 'Nested admin deep link was not served as a private application route.');\n  assert.equal(adminDeepResponse.headers.get('x-yadak-content-rendering'), 'client-private', 'Nested admin deep link was incorrectly server-rendered as public content.');\n`,
      'smoke nested admin route runtime assertions'
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Source-level invariants: fail CI immediately if a later edit removes one of
// the user-facing fixes before TypeScript/build even begins.
// ---------------------------------------------------------------------------
const assertions = [
  ['src/utils/navigation.ts', "param ? `/admin/${encodeURIComponent(param)}` : '/admin'"],
  ['server.ts', 'const exists = privateRoute ? true : await seoPathExists(req.path);'],
  ['src/components/layout/Header.tsx', "currentView === 'car-brand' ? `brand:${currentParam || ''}`"],
  ['src/server/public-storefront-react.tsx', 'const adminEditTarget = (view: string, param?: string): string =>'],
  ['src/components/admin/AdminView.tsx', 'const resolvedTarget = (() => {'],
  ['src/components/admin/AdminView.tsx', '<AdminCarsTab initialTarget={resolvedTarget} />'],
  ['src/components/admin/AdminCarsTab.tsx', "initialTarget?.startsWith('brand:')"],
  ['src/context/StoreContext.tsx', "sessionStorage.setItem('chinpart_live_edit'"],
  ['src/server/ssr-store-context.tsx', 'const removeFromGarage = (id: string) => {'],
  ['src/components/layout/Footer.tsx', 'className="footer-copyright-rich"'],
  ['src/index.css', 'v30.5.1 — copyright rich-text styles'],
  ['scripts/smoke-test.ts', 'Admin deep link lost exact target.']
];
for (const [path, marker] of assertions) {
  if (!fs.readFileSync(path, 'utf8').includes(marker)) {
    throw new Error(`v30.5.1 verification failed: ${path} missing ${marker}`);
  }
}

console.log(`v30.5.1 source migration OK${changed.length ? `; patched ${changed.length} files` : '; already applied'}.`);
