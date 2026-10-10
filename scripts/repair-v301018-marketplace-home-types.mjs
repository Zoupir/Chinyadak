import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const writeIfChanged = (file, before, after) => {
  if (after !== before) fs.writeFileSync(file, after, 'utf8');
};
const fail = message => { throw new Error(`v30.10.18 final repair failed: ${message}`); };

// ---------------------------------------------------------------------------
// MarketplaceRtlHome: make every optional identifier safe in the PREPARED
// source. Previous checks covered Set/includes but missed navigation calls, so
// prepare:source could print "verified" immediately before tsc failed.
// ---------------------------------------------------------------------------
const homePath = 'src/components/home/MarketplaceRtlHome.tsx';
let home = read(homePath);
const homeBefore = home;

// Guard product navigation regardless of the surrounding JSX formatting.
home = home.replace(
  /onNavigate\(\s*(['"])product\1\s*,\s*product\.id\s*\)/g,
  "(product.id ? onNavigate('product', String(product.id)) : undefined)"
);
home = home.replace(
  /onNavigate\(\s*(['"])product\1\s*,\s*item\.id\s*\)/g,
  "(item.id ? onNavigate('product', String(item.id)) : undefined)"
);

// Product IDs are optional in the shared catalog type. Local de-duplication
// must never pass undefined into Set<string>.
home = home.replace(
  /if\s*\(\s*seen\.has\(\s*product\.id\s*\)\s*\)\s*return false;\s*seen\.add\(\s*product\.id\s*\);/g,
  `const productKey = String(product.id || product.sku || product.partNumber || product.oemNumber || '');
        if (!productKey || seen.has(productKey)) return false;
        seen.add(productKey);`
);
home = home.replace(/seen\.has\(\s*product\.id\s*\)/g, "seen.has(String(product.id || ''))");
home = home.replace(/seen\.add\(\s*product\.id\s*\)/g, "seen.add(String(product.id || ''))");

// v30.10.17 generated (string | undefined)[] through filter(Boolean). Normalize
// BEFORE filtering and state the resulting type explicitly.
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

// Normalize optional category slugs at all known string-only call sites.
home = home.replace(/([A-Za-z0-9_]+)\.includes\(\s*category\.slug\s*\)/g, "$1.includes(String(category.slug || ''))");
home = home.replace(/([A-Za-z0-9_]+)\.has\(\s*category\.slug\s*\)/g, "$1.has(String(category.slug || ''))");
home = home.replace(/([A-Za-z0-9_]+)\.add\(\s*category\.slug\s*\)/g, "$1.add(String(category.slug || ''))");
home = home.replace(/setFeaturedTab\(\s*category\.slug\s*\)/g, "setFeaturedTab(String(category.slug || ''))");
home = home.replace(
  /onNavigate\(\s*(['"])(?:category|shop-category)\1\s*,\s*category\.slug\s*\)/g,
  match => match.replace('category.slug', "String(category.slug || '')")
);

const unsafeHomePatterns = [
  [/onNavigate\(\s*(['"])product\1\s*,\s*product\.id\s*\)/, 'unsafe product.id navigation'],
  [/onNavigate\(\s*(['"])product\1\s*,\s*item\.id\s*\)/, 'unsafe item.id navigation'],
  [/seen\.(?:has|add)\(\s*product\.id\s*\)/, 'unsafe product.id Set usage'],
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
// LiveSectionModal: finalize legacy-key inference, deterministic browser hooks,
// and the save path structurally. Historical v30.10.16 replacements depended
// on exact whitespace/source shapes and could silently miss the current modal.
// ---------------------------------------------------------------------------
const modalPath = 'src/components/common/LiveSectionModal.tsx';
let modal = read(modalPath);
const modalBefore = modal;

// A synchronous form snapshot is required because live preview writes React
// state continuously while Save may be clicked immediately after an input event.
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

// Canonicalize apply() instead of depending on a historical exact string.
{
  const start = modal.indexOf('  const apply = (next: PageSection) => {');
  const end = start >= 0 ? modal.indexOf('\n\n  const patch =', start) : -1;
  if (start < 0 || end < 0) fail('LiveSectionModal apply() anchors missing');
  const replacement = `  const apply = (next: PageSection) => {\n    formRef.current = next;\n    setForm(next);\n    previewSection(pageSlug, next);\n  };`;
  modal = modal.slice(0, start) + replacement + modal.slice(end);
}

// Legacy system pages may still carry old IDs without sectionKey.
if (!modal.includes('LEGACY-LIVE-SECTION-KEY-v301018')) {
  const contentPolicyPattern = /const contentPolicy = \(\(\) => \{\s*const key = form\.sectionKey \|\| '';/;
  if (!contentPolicyPattern.test(modal)) fail('LiveSectionModal contentPolicy anchor missing');
  modal = modal.replace(
    contentPolicyPattern,
    `// LEGACY-LIVE-SECTION-KEY-v301018\n  const legacyLiveSectionKeyById: Record<string, string> = {\n    'sec-hero': 'hero',\n    'sec-categories': 'featured-categories',\n    'sec-brands': 'manufacturers',\n    'sec-trust': 'testimonials',\n    'sec-articles': 'articles'\n  };\n\n  const contentPolicy = (() => {\n    const key = form.sectionKey || legacyLiveSectionKeyById[form.id] || '';`
  );
}

// Canonicalize save() so it always commits the synchronous snapshot and closes
// only after the atomic DB save has been confirmed.
{
  const start = modal.indexOf('  const save = async () => {');
  const end = start >= 0 ? modal.indexOf('\n\n  const deleteCurrent =', start) : -1;
  if (start < 0 || end < 0) fail('LiveSectionModal save() anchors missing');
  const replacement = `  const save = async () => {\n    const sectionToSave = formRef.current || form;\n    if (!sectionToSave.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    const saved = await updateSection(pageSlug, sectionToSave);\n    if (!saved) return;\n    originalRef.current = JSON.parse(JSON.stringify(sectionToSave));\n    formRef.current = sectionToSave;\n    onClose();\n  };`;
  modal = modal.slice(0, start) + replacement + modal.slice(end);
}

// Deterministic browser hooks.
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
  "'sec-categories': 'featured-categories'"
];
for (const marker of requiredModalMarkers) {
  if (!modal.includes(marker)) fail(`LiveSectionModal contract missing: ${marker}`);
}
if (!modal.includes('data-section-field={String(key)}')) fail('generic numeric-field browser hook missing');
if (!modal.includes("numberField('عرض سکشن در دسکتاپ ٪','widthPercent'")) fail('widthPercent control missing');

writeIfChanged(modalPath, modalBefore, modal);

console.log('v30.10.18 final prepared-source repair: optional identifiers, typed slugs, exact live-section snapshot/save, legacy keys and browser hooks verified.');
