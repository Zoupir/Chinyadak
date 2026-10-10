import fs from 'node:fs';

const fail = message => { throw new Error(`v30.10.18 final runtime repair failed: ${message}`); };

// ---------------------------------------------------------------------------
// Normal SPA/admin StoreContext: keep the synchronous preview snapshot fallback.
// ---------------------------------------------------------------------------
{
  const file = 'src/context/StoreContext.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;

  source = source.replace(
    "const page = pagesRef.current.find(item => item.slug === pageSlug);",
    "const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);"
  );

  if (!source.includes("const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);")) {
    fail('normal StoreContext live-section page fallback missing');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// ---------------------------------------------------------------------------
// Public hydration uses src/server/ssr-store-context.tsx through an esbuild
// alias. That provider historically exposed updateSection/previewSection as
// no-ops, so the live editor looked functional but Save could never issue a
// network request. Give the hydrated provider the same atomic persistence path
// used by the normal StoreContext while preserving SSR-safe initial markup.
// ---------------------------------------------------------------------------
{
  const file = 'src/server/ssr-store-context.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;

  if (!source.includes('SSR-LIVE-SECTION-PERSISTENCE-v301018')) {
    const pagesConst = "  const pages = bootstrap.cms?.pages || [];";
    const settingsConst = "  const settings = { ...INITIAL_SETTINGS, ...(bootstrap.cms?.settings || {}) } as SiteSettings;";
    if (!source.includes(pagesConst) || !source.includes(settingsConst)) {
      fail('SSR provider pages/settings anchors missing');
    }
    source = source.replace(
      pagesConst,
      "  // SSR-LIVE-SECTION-PERSISTENCE-v301018\n  const [pages, setPages] = useState<any[]>(bootstrap.cms?.pages || []);"
    );
    source = source.replace(
      settingsConst,
      "  const [settings, setSettings] = useState<SiteSettings>({ ...INITIAL_SETTINGS, ...(bootstrap.cms?.settings || {}) } as SiteSettings);"
    );

    const insertionAnchor = '  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);';
    if (!source.includes(insertionAnchor)) fail('SSR provider action insertion anchor missing');
    const actions = `  const previewSection = (pageSlug: string, sectionPreview: any) => {\n    setPages(current => current.map(page => {\n      if (page.slug !== pageSlug) return page;\n      const sections = Array.isArray(page.sections) ? page.sections : [];\n      const exists = sections.some((section: any) => section.id === sectionPreview.id);\n      return {\n        ...page,\n        sections: exists\n          ? sections.map((section: any) => section.id === sectionPreview.id ? { ...sectionPreview } : section)\n          : [...sections, { ...sectionPreview }]\n      };\n    }));\n  };\n\n  const updateSection = async (pageSlug: string, updatedSection: any): Promise<boolean> => {\n    const page = pages.find(item => item.slug === pageSlug);\n    if (!page) {\n      setToast({ message: 'برگه برای ذخیره پیدا نشد.', type: 'error' });\n      return false;\n    }\n    try {\n      const freshBundle = await apiRequest<any>('/api/cms/bundle?liveSectionSave=1');\n      const freshPage = (freshBundle?.pages || []).find((item: any) => item.id === page.id) || page;\n      const result = await apiRequest<any>(\n        \`/api/cms/pages/\${encodeURIComponent(page.id)}/sections/\${encodeURIComponent(updatedSection.id)}\`,\n        {\n          method: 'PATCH',\n          body: JSON.stringify({\n            section: updatedSection,\n            cmsRevision: Math.max(0, Number(freshPage.cmsRevision || 0))\n          })\n        }\n      );\n      const storedSection = result?.section || result?.page?.sections?.find((section: any) => section.id === updatedSection.id);\n      if (!storedSection || !result?.page) throw new Error('SSR_LIVE_SECTION_READBACK_MISSING');\n      const mismatches = Object.entries(updatedSection)\n        .filter(([key, value]) => key !== 'order' && value !== undefined)\n        .filter(([key, value]) => JSON.stringify(storedSection[key]) !== JSON.stringify(value));\n      if (mismatches.length) throw new Error('SSR_LIVE_SECTION_PERSISTENCE_MISMATCH:' + mismatches.map(([key]) => key).join(','));\n      setPages(current => {\n        const exists = current.some(item => item.id === result.page.id);\n        return exists\n          ? current.map(item => item.id === result.page.id ? result.page : item)\n          : [...current, result.page];\n      });\n      setToast({ message: \`بخش «\${storedSection.title || updatedSection.title || ''}» با موفقیت ذخیره شد.\`, type: 'success' });\n      return true;\n    } catch (error) {\n      console.error('SSR_LIVE_SECTION_SAVE_FAILED', error);\n      setToast({ message: 'ذخیره سکشن در پایگاه داده انجام نشد.', type: 'error' });\n      return false;\n    }\n  };\n\n  const updateSettings = async (partial: Partial<SiteSettings>): Promise<boolean> => {\n    try {\n      const result = await apiRequest<any>('/api/cms/settings', {\n        method: 'PATCH',\n        body: JSON.stringify(partial)\n      });\n      const saved = (result?.settings || partial) as Partial<SiteSettings>;\n      setSettings(current => ({ ...current, ...saved } as SiteSettings));\n      return true;\n    } catch (error) {\n      console.error('SSR_SETTINGS_SAVE_FAILED', error);\n      setToast({ message: 'ذخیره تنظیمات سایت انجام نشد.', type: 'error' });\n      return false;\n    }\n  };\n\n`;
    source = source.replace(insertionAnchor, actions + insertionAnchor);

    source = source.replace('    updateSettings: noop,', '    updateSettings,');
    source = source.replace('    updateSection: noop,', '    updateSection,\n    previewSection,');
  }

  const required = [
    'SSR-LIVE-SECTION-PERSISTENCE-v301018',
    'const [pages, setPages] = useState<any[]>',
    'const [settings, setSettings] = useState<SiteSettings>',
    "apiRequest<any>('/api/cms/bundle?liveSectionSave=1')",
    "method: 'PATCH'",
    'updateSettings,',
    'updateSection,',
    'previewSection,'
  ];
  for (const marker of required) if (!source.includes(marker)) fail(`SSR provider contract missing: ${marker}`);
  if (source.includes('updateSection: noop') || source.includes('updateSettings: noop')) {
    fail('SSR provider still exposes live-editor persistence no-ops');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// ---------------------------------------------------------------------------
// Keep the ordinary click activation expected by the existing regression
// contract. The save failure was the aliased public provider, not pointer events.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;

  source = source.replace(
    /<button type="button" data-live-section-save="1"\s*\/\* LIVE-SECTION-SAVE-ACTIVATION-v301018 \*\/\s*onPointerUp=\{event => \{ event\.preventDefault\(\); void save\(\); \}\}\s*onClick=\{event => \{ if \(event\.detail === 0\) void save\(\); \}\}\s*disabled=\{isSaving\}/m,
    '<button type="button" data-live-section-save="1" onClick={save} disabled={isSaving}'
  );

  if (!source.includes('data-live-section-save="1" onClick={save} disabled={isSaving}')) {
    fail('ordinary live-section save activation missing');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

console.log('v30.10.18 final live-section runtime: normal + public hydration persistence paths verified.');
