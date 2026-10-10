import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.17 marker missing: ${label}`); };

const replaceRange = (source, startMarker, endMarker, replacement, label) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) fail(label);
  return source.slice(0, start) + replacement + source.slice(end);
};

// ---------------------------------------------------------------------------
// 1) Runtime page normalization must never reinterpret a legitimate value as an
//    old default. Previously values such as desktopColumns=6, maxItems=12,
//    mobileColumns=1, fullWidth=false and maxWidthPx=1280 could be rewritten on
//    every CMS bootstrap. That made correctly persisted editor values appear to
//    "not save" after a reload. Only fill genuinely missing properties here.
// ---------------------------------------------------------------------------
{
  const file = 'src/context/StoreContext.tsx';
  let source = read(file);
  const start = 'const upgradeLegacyHomeSection = (section: PageSection): PageSection => {';
  const end = 'const normalizeBuilderPages = (inputPages: SitePage[]): SitePage[] => {';
  const replacement = `// AUTHORED-SECTION-CONFIG-PRESERVED-v301017\nconst inferredContentSource = (key?: string): PageSection['contentSource'] =>\n  key === 'featured-categories' ? 'categories' :\n  key === 'manufacturers' ? 'brands' :\n  key === 'parts-brands' ? ('partBrands' as PageSection['contentSource']) :\n  ['featured-products','weekly-deals','maintenance-products'].includes(key || '') ? 'products' :\n  key === 'articles' ? 'articles' :\n  key === 'hero' ? 'sliders' :\n  'manual';\n\nconst upgradeLegacyHomeSection = (section: PageSection): PageSection => {\n  const defaults = HOME_SECTION_DEFAULTS.find(item => item.sectionKey && item.sectionKey === section.sectionKey);\n  const defaultCopy = defaults ? JSON.parse(JSON.stringify(defaults)) as PageSection : undefined;\n  const merged: PageSection = defaultCopy ? { ...defaultCopy, ...section } : { ...section };\n\n  // Arrays are authored data too. An explicit empty array means the merchant\n  // intentionally removed every item and must not be replaced by defaults.\n  if (Object.prototype.hasOwnProperty.call(section, 'items')) merged.items = section.items;\n\n  if (!merged.contentSource) merged.contentSource = inferredContentSource(merged.sectionKey);\n  if (merged.contentSource !== 'manual' && merged.contentSourceLimit == null && merged.maxItems != null) {\n    merged.contentSourceLimit = merged.maxItems;\n  }\n  return merged;\n};\n\nconst mergeSystemSections = (page: SitePage, defaults: PageSection[], inferredKeys: Record<string, string> = {}): SitePage => {\n  const existing = (page.sections || []).map(section => upgradeLegacyHomeSection({\n    ...section,\n    sectionKey: section.sectionKey || inferredKeys[section.id]\n  }));\n  const existingKeys = new Set(existing.map(section => section.sectionKey).filter(Boolean));\n  const missing = defaults\n    .filter(section => !section.sectionKey || !existingKeys.has(section.sectionKey))\n    .map(section => JSON.parse(JSON.stringify(section)) as PageSection);\n\n  return {\n    ...page,\n    ...(page.slug === 'home' ? { builderConfigVersion: 30117 } : {}),\n    sections: [...existing, ...missing].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))\n  };\n};\n\n`;
  if (!source.includes('AUTHORED-SECTION-CONFIG-PRESERVED-v301017')) {
    source = replaceRange(source, start, end, replacement, 'StoreContext runtime section normalization');
  }
  if (!source.includes('AUTHORED-SECTION-CONFIG-PRESERVED-v301017') || source.includes("section.desktopColumns === 6 || section.desktopColumns === 12")) {
    fail('non-destructive section normalization');
  }
  write(file, source);
}

// ---------------------------------------------------------------------------
// 2) Every control exposed by LiveSectionModal must have a renderer consumer.
//    Centralize item limits and make featured products honor the configured
//    categories (including descendants) instead of silently falling back to a
//    hard-coded pool that made category edits look ineffective.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/home/MarketplaceRtlHome.tsx';
  let source = read(file);

  if (!source.includes('SECTION-RENDER-CONTRACT-v301017')) {
    const anchor = '  const fillProducts = (preferred: typeof products, count = 8) => {';
    if (!source.includes(anchor)) fail('Marketplace product helper anchor');
    source = source.replace(anchor, `  // SECTION-RENDER-CONTRACT-v301017\n  const sectionLimit = (key: string, fallback: number) => {\n    const section = sectionConfig(key);\n    const dynamic = section?.contentSource && section.contentSource !== 'manual';\n    const raw = Number((dynamic ? section?.contentSourceLimit : undefined) ?? section?.maxItems ?? fallback);\n    return Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.min(100, Math.round(raw))) : fallback;\n  };\n\n  const categoryKeysFor = (selectedSlugs: string[]) => {\n    const requested = new Set(selectedSlugs.filter(Boolean));\n    const slugs = new Set<string>();\n    const ids = new Set<string>();\n    const walk = (nodes: any[], inherited = false) => {\n      for (const node of nodes || []) {\n        const selected = inherited || requested.has(String(node?.slug || ''));\n        if (selected) {\n          if (node?.slug) slugs.add(String(node.slug));\n          if (node?.id) ids.add(String(node.id));\n        }\n        walk(node?.subcategories || node?.children || [], selected);\n      }\n    };\n    walk(categories as any[]);\n    return { slugs, ids };\n  };\n\n${anchor}`);
  }

  source = source.replace(
    '  const productStrip = fillProducts(featured, 8);\n  const deals = fillProducts(bestSellers, 8);\n  const serviceParts = fillProducts(maintenance, 8);',
    "  const productStrip = fillProducts(featured, sectionLimit('featured-products', 8));\n  const deals = fillProducts(bestSellers, sectionLimit('weekly-deals', 8));\n  const serviceParts = fillProducts(maintenance, sectionLimit('maintenance-products', 8));"
  );

  const featuredStart = "  const featuredSection = sectionConfig('featured-products');";
  const featuredEnd = '\n\nconst handleSectionDragStart';
  if (source.includes(featuredStart)) {
    const featuredReplacement = `  const featuredSection = sectionConfig('featured-products');\n  const configuredFeaturedSlugs = (featuredSection?.sourceCategorySlugs || []).filter(Boolean);\n  const defaultFeaturedSlugs = categories.slice(0, 3).map(category => category.slug).filter(Boolean);\n  const selectedFeaturedSlugs = configuredFeaturedSlugs.length ? configuredFeaturedSlugs : defaultFeaturedSlugs;\n  const featuredCategories = categories.filter(category => selectedFeaturedSlugs.includes(category.slug));\n  const activeFeaturedSlug = featuredCategories.some(category => category.slug === featuredTab)\n    ? featuredTab\n    : (featuredCategories[0]?.slug || selectedFeaturedSlugs[0] || '');\n  const selectedKeys = categoryKeysFor(\n    featuredSection?.productSectionDisplay === 'mixed'\n      ? selectedFeaturedSlugs\n      : (activeFeaturedSlug ? [activeFeaturedSlug] : selectedFeaturedSlugs)\n  );\n  const featuredPool = configuredFeaturedSlugs.length || selectedFeaturedSlugs.length\n    ? products.filter(product =>\n        selectedKeys.slugs.has(String(product.categorySlug || '')) ||\n        selectedKeys.slugs.has(String(product.subcategorySlug || '')) ||\n        selectedKeys.ids.has(String((product as any).categoryId || ''))\n      )\n    : (featured.length ? featured : products);\n  // An explicit category selection is authoritative. Do not fall back to random\n  // products when that category currently has no products; that previously made\n  // the editor appear broken.\n  const visibleFeaturedProducts = featuredPool.slice(0, sectionLimit('featured-products', 8));`;
    source = replaceRange(source, featuredStart, featuredEnd, featuredReplacement, 'featured product renderer contract');
  } else if (!source.includes('configuredFeaturedSlugs')) {
    fail('prepared featured renderer');
  }

  // All special renderers use the same limit contract as the inspector.
  source = source.replaceAll("sectionConfig('featured-products')?.maxItems || visibleFeaturedProducts.length", "sectionLimit('featured-products', visibleFeaturedProducts.length)");
  source = source.replaceAll("sectionConfig('weekly-deals')?.maxItems || deals.length", "sectionLimit('weekly-deals', deals.length)");
  source = source.replaceAll("sectionConfig('maintenance-products')?.maxItems || serviceParts.length", "sectionLimit('maintenance-products', serviceParts.length)");
  source = source.replaceAll("sectionConfig('articles')?.maxItems || 3", "sectionLimit('articles', 3)");
  source = source.replaceAll("sectionConfig('parts-brands')?.maxItems || 12", "sectionLimit('parts-brands', 12)");

  // Manual/custom repeaters previously ignored maxItems entirely.
  const sortedReturn = `    return base\n      .filter(item => item.isVisible !== false)\n      .sort((a, b) => a.order - b.order);`;
  const sortedNext = `    const visible = base\n      .filter(item => item.isVisible !== false)\n      .sort((a, b) => a.order - b.order);\n    return visible.slice(0, sectionLimit(key, visible.length || 100));`;
  if (source.includes(sortedReturn)) source = source.replace(sortedReturn, sortedNext);

  // Runtime observability for browser regression tests and support diagnostics.
  source = source.replace(
    '<section className="marketplace-section" data-section-key="featured-products"',
    '<section className="marketplace-section" data-section-key="featured-products" data-configured-limit={sectionLimit(\'featured-products\', 8)} data-rendered-items={visibleFeaturedProducts.length}'
  );
  source = source.replace(
    '<div className="marketplace-product-grid builder-section-grid">\n          {visibleFeaturedProducts',
    '<div className="marketplace-product-grid builder-section-grid" data-section-grid="featured-products">\n          {visibleFeaturedProducts'
  );

  if (!source.includes('SECTION-RENDER-CONTRACT-v301017') || !source.includes('configuredFeaturedSlugs') || !source.includes("sectionLimit('weekly-deals'")) {
    fail('marketplace section renderer contract');
  }
  write(file, source);
}

// ---------------------------------------------------------------------------
// 3) Give the real inspector deterministic field hooks for browser tests, and
//    make Escape restore the original preview just like the visible Cancel/X.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = read(file);
  if (!source.includes('LIVE-SECTION-INSPECTOR-CONTRACT-v301017')) {
    source = source.replace(
      "  const [form, setForm] = useState<PageSection | null>(null);",
      "  const [form, setForm] = useState<PageSection | null>(null);\n  // LIVE-SECTION-INSPECTOR-CONTRACT-v301017"
    );
    source = source.replace(
      "      if (event.key === 'Escape') onClose();",
      "      if (event.key === 'Escape') {\n        if (originalRef.current) previewSection(pageSlug, originalRef.current);\n        onClose();\n      }"
    );
    source = source.replace(
      '        type="number"\n        min={min}',
      '        type="number"\n        data-section-field={String(key)}\n        min={min}'
    );
    source = source.replace(
      '                    type="number"\n                    min={1}\n                    max={100}\n                    value={form.contentSourceLimit || form.maxItems || 12}',
      '                    type="number"\n                    data-section-field="contentSourceLimit"\n                    min={1}\n                    max={100}\n                    value={form.contentSourceLimit || form.maxItems || 12}'
    );
    source = source.replace(
      '<select value={form.productSectionDisplay || \'tabs\'}',
      '<select data-section-field="productSectionDisplay" value={form.productSectionDisplay || \'tabs\'}'
    );
  }
  if (!source.includes('LIVE-SECTION-INSPECTOR-CONTRACT-v301017') || !source.includes('data-section-field={String(key)}')) {
    fail('live inspector browser hooks');
  }
  write(file, source);
}

console.log('v30.10.17 authored section config preservation + renderer contract applied.');
