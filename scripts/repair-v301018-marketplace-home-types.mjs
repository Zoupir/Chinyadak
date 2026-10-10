import fs from 'node:fs';

const homePath = 'src/components/home/MarketplaceRtlHome.tsx';
let home = fs.readFileSync(homePath, 'utf8');
const homeBefore = home;

// Product IDs are optional in the shared catalog type. Navigation and local
// de-duplication must therefore never pass an undefined ID into string-only APIs.
home = home.replace(
  /onClick=\{\(\) => onNavigate\(\s*'product'\s*,\s*product\.id\s*\)\}/g,
  "onClick={() => { if (product.id) onNavigate('product', product.id); }}"
);

home = home.replace(
  /onClick=\{\(\) => onNavigate\(\s*'product'\s*,\s*item\.id\s*\)\}/g,
  "onClick={() => { if (item.id) onNavigate('product', item.id); }}"
);

home = home.replace(
  /if\s*\(\s*seen\.has\(\s*product\.id\s*\)\s*\)\s*return false;\s*seen\.add\(\s*product\.id\s*\);/g,
  `const productKey = String(product.id || product.sku || product.partNumber || product.oemNumber || '');
        if (!productKey || seen.has(productKey)) return false;
        seen.add(productKey);`
);

home = home.replace(/seen\.has\(\s*product\.id\s*\)/g, "seen.has(String(product.id || ''))");
home = home.replace(/seen\.add\(\s*product\.id\s*\)/g, "seen.add(String(product.id || ''))");

// v30.10.17 can infer (string | undefined)[] from optional slug fields even
// after filter(Boolean). Normalize values BEFORE filtering so the prepared
// source is statically string[] as well as correct at runtime.
home = home.replace(
  /const configuredFeaturedSlugs = \(featuredSection\?\.sourceCategorySlugs \|\| \[\]\)\.filter\(Boolean\);/g,
  "const configuredFeaturedSlugs: string[] = (featuredSection?.sourceCategorySlugs || []).map(value => String(value || '')).filter(Boolean);"
);
home = home.replace(
  /const defaultFeaturedSlugs = categories\.slice\(0,\s*3\)\.map\(\s*category\s*=>\s*(?:String\(category\.slug \|\| ''\)|category\.slug)\s*\)\.filter\(Boolean\);/g,
  "const defaultFeaturedSlugs: string[] = categories.slice(0, 3).map(category => String(category.slug || '')).filter(Boolean);"
);
home = home.replace(
  /const selectedFeaturedSlugs = configuredFeaturedSlugs\.length \? configuredFeaturedSlugs : defaultFeaturedSlugs;/g,
  "const selectedFeaturedSlugs: string[] = configuredFeaturedSlugs.length ? configuredFeaturedSlugs : defaultFeaturedSlugs;"
);

// Normalize every optional category.slug at string-only call sites.
home = home.replace(
  /selectedFeaturedSlugs\.includes\(\s*category\.slug\s*\)/g,
  "selectedFeaturedSlugs.includes(String(category.slug || ''))"
);
home = home.replace(
  /([A-Za-z0-9_]+)\.includes\(\s*category\.slug\s*\)/g,
  "$1.includes(String(category.slug || ''))"
);
home = home.replace(
  /([A-Za-z0-9_]+)\.has\(\s*category\.slug\s*\)/g,
  "$1.has(String(category.slug || ''))"
);
home = home.replace(
  /([A-Za-z0-9_]+)\.add\(\s*category\.slug\s*\)/g,
  "$1.add(String(category.slug || ''))"
);
home = home.replace(
  /setFeaturedTab\(\s*category\.slug\s*\)/g,
  "setFeaturedTab(String(category.slug || ''))"
);

if (/seen\.has\(\s*product\.id\s*\)/.test(home) || /seen\.add\(\s*product\.id\s*\)/.test(home)) {
  throw new Error('v30.10.18 MarketplaceRtlHome still contains unsafe optional product.id Set usage');
}
if (/\.includes\(\s*category\.slug\s*\)/.test(home) || /\.has\(\s*category\.slug\s*\)/.test(home) || /\.add\(\s*category\.slug\s*\)/.test(home) || /setFeaturedTab\(\s*category\.slug\s*\)/.test(home)) {
  throw new Error('v30.10.18 MarketplaceRtlHome still contains unsafe optional category.slug string usage');
}
if (!home.includes('const configuredFeaturedSlugs: string[] =') || !home.includes('const defaultFeaturedSlugs: string[] =') || !home.includes('const selectedFeaturedSlugs: string[] =')) {
  throw new Error('v30.10.18 MarketplaceRtlHome featured slug arrays are not statically normalized to string[]');
}

if (home !== homeBefore) fs.writeFileSync(homePath, home, 'utf8');

// Finalize deterministic browser hooks after every historical modal migration.
const modalPath = 'src/components/common/LiveSectionModal.tsx';
let modal = fs.readFileSync(modalPath, 'utf8');
const modalBefore = modal;

// Legacy system pages may still store the old section IDs without sectionKey.
// The inspector must infer the modern key so content-source controls remain visible.
if (!modal.includes('LEGACY-LIVE-SECTION-KEY-v301018')) {
  modal = modal.replace(
    /const contentPolicy = \(\(\) => \{\s*const key = form\.sectionKey \|\| '';/,
    `// LEGACY-LIVE-SECTION-KEY-v301018\n  const legacyLiveSectionKeyById: Record<string, string> = {\n    'sec-hero': 'hero',\n    'sec-categories': 'featured-categories',\n    'sec-brands': 'manufacturers',\n    'sec-trust': 'testimonials',\n    'sec-articles': 'articles'\n  };\n\n  const contentPolicy = (() => {\n    const key = form.sectionKey || legacyLiveSectionKeyById[form.id] || '';`
  );
}

if (!modal.includes('data-section-field={String(key)}')) {
  modal = modal.replace(
    /(type="number"\s*)(min=\{min\})/m,
    '$1data-section-field={String(key)}\n        $2'
  );
}

if (!modal.includes('data-section-field="contentSourceLimit"')) {
  modal = modal.replace(
    /(type="number"\s*)(min=\{1\}\s*max=\{100\}\s*value=\{form\.contentSourceLimit \|\| form\.maxItems \|\| 12\})/m,
    '$1data-section-field="contentSourceLimit"\n                    $2'
  );
}

if (!modal.includes('data-live-section-modal="1"')) {
  modal = modal.replace(
    /role="dialog"\s*\n\s*aria-modal="true"/,
    'role="dialog"\n        data-live-section-modal="1"\n        aria-modal="true"'
  );
}

if (!modal.includes('data-live-section-save="1"')) {
  modal = modal.replace(
    /<button type="button"([^>]*?)onClick=\{save\}/,
    '<button type="button" data-live-section-save="1"$1onClick={save}'
  );
}

const requiredLiteralMarkers = [
  'data-section-field="contentSourceLimit"',
  'data-section-field="desktopColumns"',
  'data-live-section-modal="1"',
  'data-live-section-save="1"'
];
for (const marker of requiredLiteralMarkers) {
  if (!modal.includes(marker)) throw new Error(`v30.10.18 LiveSectionModal browser contract missing: ${marker}`);
}
if (!modal.includes('data-section-field={String(key)}')) {
  throw new Error('v30.10.18 LiveSectionModal generic numeric-field browser hook missing');
}
if (!modal.includes("numberField('عرض سکشن در دسکتاپ ٪','widthPercent'")) {
  throw new Error('v30.10.18 LiveSectionModal widthPercent control missing');
}
if (!modal.includes('LEGACY-LIVE-SECTION-KEY-v301018') || !modal.includes("'sec-categories': 'featured-categories'")) {
  throw new Error('v30.10.18 LiveSectionModal legacy section-key mapping missing');
}

if (modal !== modalBefore) fs.writeFileSync(modalPath, modal, 'utf8');

console.log('v30.10.18 final prepared-source repair: typed slug arrays, optional IDs, legacy section keys and browser hooks verified.');
