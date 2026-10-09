import fs from 'node:fs';

const homePath = 'src/components/home/MarketplaceRtlHome.tsx';
let home = fs.readFileSync(homePath, 'utf8');
const homeBefore = home;

// Product IDs are optional in the shared catalog type. Navigation and local
// de-duplication must therefore never pass an undefined ID into string-only APIs.
home = home.replace(
  /onClick=\{\(\) => onNavigate\('product', product\.id\)\}/g,
  "onClick={() => { if (product.id) onNavigate('product', product.id); }}"
);

home = home.replace(
  /onClick=\{\(\) => onNavigate\('product', item\.id\)\}/g,
  "onClick={() => { if (item.id) onNavigate('product', item.id); }}"
);

home = home.replace(
  /if \(seen\.has\(product\.id\)\) return false;\s*seen\.add\(product\.id\);/g,
  `const productKey = String(product.id || product.sku || product.partNumber || product.oemNumber || '');
        if (!productKey || seen.has(productKey)) return false;
        seen.add(productKey);`
);

// v30.10.17 builds a string[] of configured slugs. category.slug is optional,
// so normalize both the default list and includes() argument explicitly.
home = home.replace(
  /categories\.slice\(0, 3\)\.map\(category => category\.slug\)\.filter\(Boolean\)/g,
  "categories.slice(0, 3).map(category => String(category.slug || '')).filter(Boolean)"
);
home = home.replace(
  /selectedFeaturedSlugs\.includes\(category\.slug\)/g,
  "selectedFeaturedSlugs.includes(String(category.slug || ''))"
);

if (home.includes('seen.has(product.id)') || home.includes('seen.add(product.id)')) {
  throw new Error('v30.10.18 MarketplaceRtlHome still contains unsafe optional product.id Set usage');
}
if (home.includes('selectedFeaturedSlugs.includes(category.slug)')) {
  throw new Error('v30.10.18 MarketplaceRtlHome still contains unsafe optional category.slug includes usage');
}

if (home !== homeBefore) fs.writeFileSync(homePath, home, 'utf8');

// Finalize deterministic browser hooks after every historical modal migration.
// Older stages used exact whitespace matches and could silently miss this field.
const modalPath = 'src/components/common/LiveSectionModal.tsx';
let modal = fs.readFileSync(modalPath, 'utf8');
const modalBefore = modal;

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

for (const marker of [
  'data-section-field="contentSourceLimit"',
  'data-section-field="desktopColumns"',
  'data-section-field="widthPercent"',
  'data-live-section-modal="1"',
  'data-live-section-save="1"'
]) {
  if (!modal.includes(marker)) throw new Error(`v30.10.18 LiveSectionModal browser contract missing: ${marker}`);
}

if (modal !== modalBefore) fs.writeFileSync(modalPath, modal, 'utf8');

console.log('v30.10.18 final prepared-source repair: marketplace optional IDs/slugs and live-editor browser hooks verified.');
