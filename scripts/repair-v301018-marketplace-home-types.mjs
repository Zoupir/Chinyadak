import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const writeIfChanged = (file, before, after) => {
  if (after !== before) fs.writeFileSync(file, after, 'utf8');
};
const fail = message => { throw new Error(`v30.10.18 final repair failed: ${message}`); };

// ---------------------------------------------------------------------------
// MarketplaceRtlHome: normalize every optional identifier at the final prepared
// source boundary. This stage runs after all historical source generators.
// ---------------------------------------------------------------------------
const homePath = 'src/components/home/MarketplaceRtlHome.tsx';
let home = read(homePath);
const homeBefore = home;

// Any product-card variable may carry an optional id. Normalize the second
// argument instead of special-casing only variables named product/item.
home = home.replace(
  /onNavigate\(\s*(['"])product\1\s*,\s*([A-Za-z_$][\w$]*)\.id\s*\)/g,
  (_match, _quote, variable) => `(${variable}.id ? onNavigate('product', String(${variable}.id)) : undefined)`
);

// Product IDs are optional in the shared catalog type. Local de-duplication
// must never pass undefined into Set<string>.
home = home.replace(
  /if\s*\(\s*seen\.has\(\s*product\.id\s*\)\s*\)\s*return false;\s*seen\.add\(\s*product\.id\s*\);/g,
  `const productKey = String(product.id || product.sku || product.partNumber || product.oemNumber || '');\n        if (!productKey || seen.has(productKey)) return false;\n        seen.add(productKey);`
);
home = home.replace(/seen\.has\(\s*product\.id\s*\)/g, "seen.has(String(product.id || ''))");
home = home.replace(/seen\.add\(\s*product\.id\s*\)/g, "seen.add(String(product.id || ''))");

// Array destructuring from split() is string | undefined under the project's
// strict TypeScript settings. goLink already rejects an empty link, but the
// compiler still needs an explicit non-undefined view value.
home = home.replace(
  /const \[view,\s*\.\.\.rest\] = link\.split\(':'\);\s*onNavigate\(view,\s*rest\.join\(':'\)\);/g,
  `const [view = '', ...rest] = link.split(':');\n      if (!view) return;\n      onNavigate(view, rest.join(':'));`
);

// v30.10.17 historically generated (string | undefined)[] through
// filter(Boolean). Normalize before filtering and make the type explicit.
home = home.replace(
  /const configuredFeaturedSlugs(?::\s*string\[\])?\s*=\s*\(featuredSection\?\.sourceCategorySlugs \|\| \[\]\)(?:\.map\(value => String\(value \|\| ''\)\))?\.filter\(Boolean\);/g,
  "const configuredFeaturedSlugs: string[] = (featuredSection?.sourceCategorySlugs || []).map(value => String(value || '')).filter(Boolean);"
);
home = home.replace(
  /const defaultFeaturedSlugs(?::\s*string\[\])?\s*=\s*categories\.slice\(0,\s*3\)\.map\(\s*category\s*=>\s*(?:String\(category\.slug \|\| ''\)|category\.slug)\s*\)\.filter\(Boolean\);/g,
  "const defaultFeaturedSlugs: string[] = categories.slice(0, 3).map(category => String(category.slug || '')).filter(Boolean);"
);
home = home.replace(
  /const selectedFeaturedSlugs(?::\s*string\[\])?\s*=\s*configuredFeaturedSlugs\.length \? configuredFeaturedSlugs : defaultFeaturedSlugs;/g,
  "const selectedFeaturedSlugs: string[] = configuredFeaturedSlugs.length ? configuredFeaturedSlugs : defaultFeaturedSlugs;"
);

// Normalize optional category slugs at known string-only APIs.
home = home.replace(/([A-Za-z0-9_$]+)\.includes\(\s*category\.slug\s*\)/g, "$1.includes(String(category.slug || ''))");
home = home.replace(/([A-Za-z0-9_$]+)\.has\(\s*category\.slug\s*\)/g, "$1.has(String(category.slug || ''))");
home = home.replace(/([A-Za-z0-9_$]+)\.add\(\s*category\.slug\s*\)/g, "$1.add(String(category.slug || ''))");
home = home.replace(/setFeaturedTab\(\s*category\.slug\s*\)/g, "setFeaturedTab(String(category.slug || ''))");
home = home.replace(
  /onNavigate\(\s*(['"])(?:category|shop-category)\1\s*,\s*category\.slug\s*\)/g,
  match => match.replace('category.slug', "String(category.slug || '')")
);

const unsafeHomePatterns = [
  [/onNavigate\(\s*(['"])product\1\s*,\s*[A-Za-z_$][\w$]*\.id\s*\)/, 'unsafe optional product navigation'],
  [/seen\.(?:has|add)\(\s*product\.id\s*\)/, 'unsafe product.id Set usage'],
  [/const \[view,\s*\.\.\.rest\] = link\.split\(':'\)/, 'unsafe goLink split destructuring'],
  [/\.(?:includes|has|add)\(\s*category\.slug\s*\)/, 'unsafe category.slug collection usage'],
  [/setFeaturedTab\(\s*category\.slug\s*\)/, 'unsafe category.slug tab usage']
];
for (const [pattern, label] of unsafeHomePatterns) {
  if (pattern.test(home)) fail(label);
}
if (!home.includes('const configuredFeaturedSlugs: string[] =') ||
    !home.includes('const defaultFeaturedSlugs: string[] =') ||
    !home.includes('const selectedFeaturedSlugs: string[] =')) {
  fail('featured slug arrays are not statically normalized to string[]');
}
writeIfChanged(homePath, homeBefore, home);

// ---------------------------------------------------------------------------
// StoreContext: canonicalize the final atomic section-save client. Live preview
// can be based on an SSR/bootstrap page revision that has become stale before
// Save is pressed. Refresh only the current revision immediately before PATCH;
// the server still enforces optimistic concurrency for any write racing after
// that refresh. A section-only PATCH preserves every other section on the page.
// ---------------------------------------------------------------------------
const storePath = 'src/context/StoreContext.tsx';
let store = read(storePath);
const storeBefore = store;
{
  const start = store.indexOf('  const updateSection = async');
  const end = start >= 0 ? store.indexOf('\n  const previewSection =', start) : -1;
  if (start < 0 || end < 0) fail('StoreContext updateSection anchors missing');
  const replacement = `  // LIVE-SECTION-ATOMIC-SAVE-v301018\n  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {\n    const page = pagesRef.current.find(item => item.slug === pageSlug);\n    if (!page) {\n      showToast('برگه برای ذخیره پیدا نشد.', 'error');\n      return false;\n    }\n\n    try {\n      // Bypass the SSR/bootstrap shortcut in apiRequest so the revision used by\n      // the atomic PATCH is the database revision at save time.\n      const freshBundle = await apiRequest<{ pages: SitePage[] }>('/api/cms/bundle?liveSectionSave=1');\n      const freshPage = (freshBundle.pages || []).find(item => item.id === page.id) || page;\n      const result = await apiRequest<{ page: SitePage; section: PageSection }>(\n        \`/api/cms/pages/\${encodeURIComponent(page.id)}/sections/\${encodeURIComponent(updatedSection.id)}\`,\n        {\n          method: 'PATCH',\n          body: JSON.stringify({\n            section: updatedSection,\n            cmsRevision: Math.max(0, Number(freshPage.cmsRevision || 0))\n          })\n        }\n      );\n\n      const storedSection = result.section || result.page?.sections?.find(section => section.id === updatedSection.id);\n      if (!storedSection) {\n        throw Object.assign(new Error('LIVE_SECTION_READBACK_MISSING'), { code: 'LIVE_SECTION_READBACK_MISSING' });\n      }\n\n      const authoredEntries = Object.entries(updatedSection)\n        .filter(([key, value]) => key !== 'order' && value !== undefined);\n      const mismatches = authoredEntries.filter(([key, value]) =>\n        JSON.stringify((storedSection as any)[key]) !== JSON.stringify(value)\n      );\n      if (mismatches.length) {\n        console.error('LIVE_SECTION_PERSISTENCE_MISMATCH', {\n          sectionId: updatedSection.id,\n          keys: mismatches.map(([key]) => key),\n          expected: updatedSection,\n          stored: storedSection\n        });\n        showToast('ذخیره سکشن تأیید نشد؛ بخشی از تغییرات بعد از خواندن از پایگاه داده متفاوت بود.', 'error');\n        return false;\n      }\n\n      const savedPage = result.page;\n      setPages(prev => {\n        const exists = prev.some(item => item.id === savedPage.id);\n        const next = exists\n          ? prev.map(item => item.id === savedPage.id ? savedPage : item)\n          : [...prev, savedPage];\n        pagesRef.current = next;\n        return next;\n      });\n      showToast(\`بخش «\${storedSection.title || updatedSection.title}» با موفقیت ذخیره شد.\`);\n      return true;\n    } catch (error: any) {\n      console.error('LIVE_SECTION_SAVE_FAILED', error);\n      const code = String(error?.code || '');\n      showToast(\n        code === 'CMS_PAGE_REVISION_CONFLICT'\n          ? 'این برگه هم‌زمان تغییر کرده است. صفحه را تازه‌سازی کنید و دوباره ذخیره کنید.'\n          : 'ذخیره سکشن در پایگاه داده انجام نشد.',\n        'error'\n      );\n      return false;\n    }\n  };`;
  store = store.slice(0, start) + replacement + store.slice(end);
}
if (!store.includes('LIVE-SECTION-ATOMIC-SAVE-v301018') ||
    !store.includes('/api/cms/bundle?liveSectionSave=1') ||
    !store.includes('cmsRevision: Math.max(0, Number(freshPage.cmsRevision || 0))')) {
  fail('fresh-revision atomic section save contract missing');
}
writeIfChanged(storePath, storeBefore, store);

// ---------------------------------------------------------------------------
// LiveSectionModal: finalize synchronous form snapshot, legacy-key inference,
// deterministic browser hooks and the save path structurally.
// ---------------------------------------------------------------------------
const modalPath = 'src/components/common/LiveSectionModal.tsx';
let modal = read(modalPath);
const modalBefore = modal;

if (!modal.includes('const formRef = useRef<PageSection | null>(null);')) {
  const stateAnchor = '  const [form, setForm] = useState<PageSection | null>(null);';
  if (!modal.includes(stateAnchor)) fail('LiveSectionModal form state anchor missing');
  modal = modal.replace(stateAnchor, `${stateAnchor}\n  // LIVE-SECTION-FORM-SNAPSHOT-v301018\n  const formRef = useRef<PageSection | null>(null);`);
}

if (!modal.includes('formRef.current = snapshot;')) {
  modal = modal.replace(
    /originalRef\.current = snapshot;\s*activeKeyRef\.current = key;\s*setForm\(snapshot\);/,
    `originalRef.current = snapshot;\n    formRef.current = snapshot;\n    activeKeyRef.current = key;\n    setForm(snapshot);`
  );
}
if (!modal.includes('formRef.current = null;')) {
  modal = modal.replace(
    /originalRef\.current = null;\s*setForm\(null\);/,
    `originalRef.current = null;\n      formRef.current = null;\n      setForm(null);`
  );
}

{
  const start = modal.indexOf('  const apply = (next: PageSection) => {');
  const end = start >= 0 ? modal.indexOf('\n\n  const patch =', start) : -1;
  if (start < 0 || end < 0) fail('LiveSectionModal apply() anchors missing');
  const replacement = `  const apply = (next: PageSection) => {\n    formRef.current = next;\n    setForm(next);\n    previewSection(pageSlug, next);\n  };`;
  modal = modal.slice(0, start) + replacement + modal.slice(end);
}

if (!modal.includes('LEGACY-LIVE-SECTION-KEY-v301018')) {
  const contentPolicyPattern = /const contentPolicy = \(\(\) => \{\s*const key = form\.sectionKey \|\| '';/;
  if (!contentPolicyPattern.test(modal)) fail('LiveSectionModal contentPolicy anchor missing');
  modal = modal.replace(
    contentPolicyPattern,
    `// LEGACY-LIVE-SECTION-KEY-v301018\n  const legacyLiveSectionKeyById: Record<string, string> = {\n    'sec-hero': 'hero',\n    'sec-categories': 'featured-categories',\n    'sec-brands': 'manufacturers',\n    'sec-trust': 'testimonials',\n    'sec-articles': 'articles'\n  };\n\n  const contentPolicy = (() => {\n    const key = form.sectionKey || legacyLiveSectionKeyById[form.id] || '';`
  );
}

// Keep the v30.9.2 banner-placement contract while using the v30.10.18 atomic
// section save and synchronous form snapshot. The final repair must not erase
// the canonical banner sync inserted by the historical migration.
{
  const start = modal.indexOf('  const save = async () => {');
  const end = start >= 0 ? modal.indexOf('\n\n  const deleteCurrent =', start) : -1;
  if (start < 0 || end < 0) fail('LiveSectionModal save() anchors missing');
  const replacement = `  const save = async () => {\n    const sectionToSave = formRef.current || form;\n    if (!sectionToSave.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    if (isSaving) return;\n    setIsSaving(true);\n    try {\n      const saved = await updateSection(pageSlug, sectionToSave);\n      if (!saved) return;\n\n      // Homepage banner rendering reads settings.bannerPlacements before the\n      // legacy page section. Keep both stores synchronized after atomic save.\n      const bannerKey = BANNER_PLACEMENT_META.some(item => item.key === sectionToSave.sectionKey)\n        ? sectionToSave.sectionKey\n        : undefined;\n      if (bannerKey) {\n        const migrated = migrateLegacyBannerPlacements([sectionToSave], sliders).find(item => item.key === bannerKey);\n        if (migrated) {\n          const resolved = resolveBannerPlacements(settings.bannerPlacements, page?.sections || [], sliders);\n          const nextPlacements = resolved.map(item => item.key === bannerKey\n            ? { ...item, ...migrated, key: item.key, title: item.title || migrated.title }\n            : item);\n          const settingsSaved = await updateSettings({ bannerPlacements: nextPlacements });\n          if (!settingsSaved) {\n            showToast('خود سکشن ذخیره شد اما همگام‌سازی جایگاه بنر انجام نشد.', 'error');\n            return;\n          }\n        }\n      }\n\n      originalRef.current = JSON.parse(JSON.stringify(sectionToSave));\n      formRef.current = sectionToSave;\n      onClose();\n    } finally {\n      setIsSaving(false);\n    }\n  };`;
  modal = modal.slice(0, start) + replacement + modal.slice(end);
}

if (!modal.includes('data-section-field={String(key)}')) {
  modal = modal.replace(/(type="number"\s*)(min=\{min\})/m, '$1data-section-field={String(key)}\n        $2');
}
if (!modal.includes('data-section-field="contentSourceLimit"')) {
  modal = modal.replace(
    /(type="number"\s*)(min=\{1\}\s*max=\{100\}\s*value=\{form\.contentSourceLimit \|\| form\.maxItems \|\| 12\})/m,
    '$1data-section-field="contentSourceLimit"\n                    $2'
  );
}
if (!modal.includes('data-live-section-modal="1"')) {
  modal = modal.replace(/role="dialog"\s*\n\s*aria-modal="true"/, 'role="dialog"\n        data-live-section-modal="1"\n        aria-modal="true"');
}
if (!modal.includes('data-live-section-save="1"')) {
  modal = modal.replace(/<button type="button"([^>]*?)onClick=\{save\}/, '<button type="button" data-live-section-save="1"$1onClick={save}');
}

const requiredModalMarkers = [
  'data-section-field="contentSourceLimit"',
  'data-section-field="desktopColumns"',
  'data-live-section-modal="1"',
  'data-live-section-save="1"',
  'const formRef = useRef<PageSection | null>(null);',
  'formRef.current = next;',
  'const sectionToSave = formRef.current || form;',
  'nextPlacements = resolved.map',
  'await updateSettings({ bannerPlacements: nextPlacements })',
  "'sec-categories': 'featured-categories'"
];
for (const marker of requiredModalMarkers) {
  if (!modal.includes(marker)) fail(`LiveSectionModal contract missing: ${marker}`);
}
if (!modal.includes('data-section-field={String(key)}')) fail('generic numeric-field browser hook missing');
if (!modal.includes("numberField('عرض سکشن در دسکتاپ ٪','widthPercent'")) fail('widthPercent control missing');

writeIfChanged(modalPath, modalBefore, modal);

console.log('v30.10.18 final prepared-source repair: strict optional identifiers, fresh-revision atomic save, canonical banner sync, exact modal snapshot, legacy keys and browser hooks verified.');
