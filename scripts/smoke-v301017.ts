import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file: string) => fs.readFileSync(file, 'utf8');

const store = read('src/context/StoreContext.tsx');
const home = read('src/components/home/MarketplaceRtlHome.tsx');
const modal = read('src/components/common/LiveSectionModal.tsx');

assert.ok(store.includes('AUTHORED-SECTION-CONFIG-PRESERVED-v301017'), 'v30.10.17 authored section preservation marker missing');
const normalizeStart = store.indexOf('AUTHORED-SECTION-CONFIG-PRESERVED-v301017');
const normalizeEnd = store.indexOf('const normalizeBuilderPages', normalizeStart);
assert.ok(normalizeStart >= 0 && normalizeEnd > normalizeStart, 'v30.10.17 normalization block missing');
const normalizeBlock = store.slice(normalizeStart, normalizeEnd);
for (const forbidden of [
  'section.desktopColumns === 6',
  'section.desktopColumns === 12',
  'section.mobileColumns === 1 ? 2',
  'section.maxItems === 12',
  'section.maxItems === 24',
  'legacyDefaultWidth'
]) {
  assert.ok(!normalizeBlock.includes(forbidden), `runtime normalization still rewrites authored value: ${forbidden}`);
}
assert.ok(normalizeBlock.includes('{ ...defaultCopy, ...section }'), 'defaults must be filled before authored section values');
assert.ok(normalizeBlock.includes("Object.prototype.hasOwnProperty.call(section, 'items')"), 'explicit empty authored items must be preserved');

assert.ok(home.includes('SECTION-RENDER-CONTRACT-v301017'), 'v30.10.17 renderer contract marker missing');
assert.ok(home.includes('const sectionLimit = (key: string, fallback: number)'), 'shared section limit resolver missing');
assert.ok(home.includes('const categoryKeysFor = (selectedSlugs: string[])'), 'category descendant resolver missing');
assert.ok(home.includes('configuredFeaturedSlugs'), 'featured-product category contract missing');
assert.ok(home.includes("sectionLimit('featured-products', 8)"), 'featured-products does not consume editor item limit');
assert.ok(home.includes("sectionLimit('weekly-deals', 8)"), 'weekly-deals does not consume editor item limit');
assert.ok(home.includes("sectionLimit('maintenance-products', 8)"), 'maintenance-products does not consume editor item limit');
assert.ok(home.includes("sectionLimit('articles', 3)"), 'articles does not consume editor item limit');
assert.ok(home.includes('data-rendered-items={visibleFeaturedProducts.length}'), 'featured-products runtime observation marker missing');
assert.ok(!home.includes('featuredPool.length ? featuredPool : productStrip'), 'explicit featured category selection must not fall back to unrelated products');

assert.ok(modal.includes('LIVE-SECTION-INSPECTOR-CONTRACT-v301017'), 'v30.10.17 inspector contract marker missing');
assert.ok(modal.includes('data-section-field={String(key)}'), 'numeric inspector fields need deterministic browser hooks');
assert.ok(modal.includes('data-section-field="contentSourceLimit"'), 'content limit field browser hook missing');
assert.ok(modal.includes('if (originalRef.current) previewSection(pageSlug, originalRef.current);'), 'Escape/cancel preview restoration missing');

console.log('v30.10.17 smoke passed: authored section values survive bootstrap and renderer consumes editor configuration.');
