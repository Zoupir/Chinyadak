import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.13 marker missing: ${label}`); };
const replaceRange = (source, startMarker, endMarker, transform, label) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) fail(label);
  return source.slice(0, start) + transform(source.slice(start, end)) + source.slice(end);
};

// Rich text rendering + storefront parity.
{
  const file = 'src/components/page/PageView.tsx';
  let source = read(file);
  if (!source.includes("import { RichTextContent } from '../common/RichTextContent';")) {
    if (!source.includes("import { LiveSectionModal } from '../common/LiveSectionModal';")) fail('PageView import anchor');
    source = source.replace("import { LiveSectionModal } from '../common/LiveSectionModal';", "import { LiveSectionModal } from '../common/LiveSectionModal';\nimport { RichTextContent } from '../common/RichTextContent';");
  }
  source = source.replace(/\{section\.content\s*&&\s*\(\s*<div\s+className=\"([^\"]+)\">\s*\{section\.content\}\s*<\/div>\s*\)\}/g,
    (_match, className) => `{section.content && (\n                        <RichTextContent content={section.content} className=\"${className}\" />\n                      )}`);
  if (!source.includes('<RichTextContent content={section.content}')) fail('PageView RichTextContent render');
  write(file, source);
}

{
  const file = 'src/components/common/RichTextEditor.css';
  let source = read(file);
  const marker = '/* STOREFRONT-RICH-TEXT-PARITY-v301013 */';
  if (!source.includes(marker)) {
    source += `\n\n${marker}\n.rich-text-content { direction: rtl; text-align: inherit; line-height: 1.9; white-space: normal; }\n.rich-text-content p { margin: 0 0 .65em; }\n.rich-text-content h2, .rich-text-content h3, .rich-text-content h4 { margin: .8em 0 .45em; color: inherit; font-weight: 800; line-height: 1.5; }\n.rich-text-content h2 { font-size: 1.45em; }\n.rich-text-content h3 { font-size: 1.25em; }\n.rich-text-content h4 { font-size: 1.1em; }\n.rich-text-content ul, .rich-text-content ol { margin: .65em 0; padding-right: 1.6em; padding-left: 0; }\n.rich-text-content ul { list-style: disc; }\n.rich-text-content ol { list-style: decimal; }\n.rich-text-content blockquote { margin: .8em 0; border-right: 3px solid currentColor; padding: .35em .8em; background: color-mix(in srgb, currentColor 6%, transparent); }\n.rich-text-content pre { max-width: 100%; overflow-x: auto; white-space: pre-wrap; }\n`;
  }
  write(file, source);
}

{
  const file = 'src/components/common/RichTextContent.tsx';
  let source = read(file);
  if (!source.includes('data-rich-text-content="1"')) {
    source = source.replace(/<span\s*\n\s*className=\{classes\}/, '<span\n        data-rich-text-content="1"\n        dir="rtl"\n        className={classes}');
    source = source.replace(/return <div className=\{classes\} dangerouslySetInnerHTML=/, 'return <div data-rich-text-content="1" dir="rtl" className={classes} dangerouslySetInnerHTML=');
  }
  if (!source.includes('data-rich-text-content="1"')) fail('RichTextContent audit marker');
  write(file, source);
}

// Critical live-editor path: previewSection updates the synchronous snapshot, updateSection reads it, persistPage verifies DB readback.
{
  const file = 'src/context/StoreContext.tsx';
  let source = read(file);
  source = source.replace(/import React, \{([^}]+)\} from 'react';/, (_match, names) => {
    const list = names.split(',').map(value => value.trim()).filter(Boolean);
    if (!list.includes('useRef')) list.push('useRef');
    return `import React, { ${list.join(', ')} } from 'react';`;
  });

  if (!source.includes('const pagesRef = useRef<SitePage[]>([]);')) {
    const re = /(\s*const \[pages,\s*setPages\]\s*=\s*useState<SitePage\[\]>\(\[\]\);)/;
    if (!re.test(source)) fail('pages state');
    source = source.replace(re, `$1\n  const pagesRef = useRef<SitePage[]>([]);\n  useEffect(() => { pagesRef.current = pages; }, [pages]);`);
  }

  source = replaceRange(source, '  const persistPage = async', '\n  const updatePage =', block => {
    if (block.includes('PAGE_PERSISTENCE_MISMATCH')) return block;
    const setStart = block.indexOf('      setPages(prev => {');
    const syncStart = block.indexOf('      try {\n        await syncSeoDraft', setStart);
    if (setStart < 0 || syncStart < 0) fail('persistPage state update');
    const replacement = `      const expectedSections = JSON.stringify(normalized.sections || []);\n      const storedSections = JSON.stringify(saved.sections || []);\n      if (expectedSections !== storedSections) {\n        console.error('PAGE_PERSISTENCE_MISMATCH', { expected: normalized.sections, stored: saved.sections });\n        showToast('ذخیره برگه تأیید نشد؛ داده خوانده‌شده از سرور با تغییرات شما یکسان نیست.', 'error');\n        return false;\n      }\n      setPages(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        const updated = exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n        pagesRef.current = updated;\n        return updated;\n      });\n`;
    return block.slice(0, setStart) + replacement + block.slice(syncStart);
  }, 'persistPage function');

  source = replaceRange(source, '  const updateSection = async', '\n  const previewSection =', block => block.replace(/const page = pages\.find\(/, 'const page = pagesRef.current.find('), 'updateSection function');

  source = replaceRange(source, '  const previewSection =', '\n  const addSection =', _block => `  const previewSection = (pageSlug: string, sectionPreview: PageSection) => {\n    setPages(prev => {\n      const next = prev.map(page => {\n        if (page.slug !== pageSlug) return page;\n        const exists = page.sections.some(section => section.id === sectionPreview.id);\n        return { ...page, sections: exists\n          ? page.sections.map(section => section.id === sectionPreview.id ? { ...sectionPreview } : section)\n          : [...page.sections, { ...sectionPreview }] };\n      });\n      pagesRef.current = next;\n      return next;\n    });\n  };\n`, 'previewSection function');

  if (!source.includes('PAGE_PERSISTENCE_MISMATCH') || !source.includes('pagesRef.current.find(item => item.slug === pageSlug)')) fail('live editor persistence guards');
  write(file, source);
}

// Server write/readback verification.
{
  const file = 'src/server/routes/cms.ts';
  let source = read(file);
  source = replaceRange(source, "cmsRouter.put('/pages/:id'", "\ncmsRouter.delete('/pages/:id'", block => {
    if (block.includes('PAGE_PERSIST_READBACK_FAILED')) return block;
    if (!block.includes('  res.json({ page });')) fail('page route response');
    return block.replace('  res.json({ page });', `  const [savedRows] = await pool.query<JsonRow[]>(\n    'SELECT id, data_json FROM site_pages WHERE id = ? LIMIT 1',\n    [page.id]\n  );\n  if (!savedRows[0]) { res.status(500).json({ error: 'PAGE_PERSIST_READBACK_FAILED' }); return; }\n  const persistedPage = { ...parseJson<any>(savedRows[0].data_json, {}), id: savedRows[0].id };\n  res.json({ page: persistedPage });`);
  }, 'pages PUT route');

  source = replaceRange(source, "cmsRouter.patch('/settings'", "\ncmsRouter.put('/payment-gateways'", block => {
    if (block.includes('SETTINGS_PERSIST_READBACK_FAILED')) return block;
    if (!block.includes('  res.json({ settings });')) fail('settings route response');
    return block.replace('  res.json({ settings });', `  const [savedSettingRows] = await pool.query<SettingRow[]>(\n    \"SELECT setting_key, setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1\"\n  );\n  if (!savedSettingRows[0]) { res.status(500).json({ error: 'SETTINGS_PERSIST_READBACK_FAILED' }); return; }\n  const persistedSettings = parseJson<any>(savedSettingRows[0].setting_value, settings);\n  res.json({ settings: persistedSettings });`);
  }, 'settings PATCH route');
  write(file, source);
}

// Auditor contract rules. This stage owns the v2.2 baseline but must preserve newer
// engine versions when prepare:source runs repeatedly in the same working tree.
{
  const file = 'src/server/audit/site-audit.ts';
  let source = read(file);
  if (source.includes("const ENGINE_VERSION = '2.1.0';")) {
    source = source.replace("const ENGINE_VERSION = '2.1.0';", "const ENGINE_VERSION = '2.2.0';");
  }
  if (!source.includes('function scanRichTextAndLiveEditorContracts(')) {
    const helper = `\nfunction scanRichTextAndLiveEditorContracts(files: string[], findings: AuditFinding[]) {\n  const byRel = new Map(files.map(file => [relative(file), readUtf8(file) || '']));\n  const pageView = byRel.get('src/components/page/PageView.tsx') || '';\n  const richCss = readUtf8(path.join(ROOT, 'src/components/common/RichTextEditor.css')) || '';\n  const richContent = byRel.get('src/components/common/RichTextContent.tsx') || '';\n  const store = byRel.get('src/context/StoreContext.tsx') || '';\n  const cms = byRel.get('src/server/routes/cms.ts') || '';\n  if (/\\{section\\.content\\s*\\}/.test(pageView) && !pageView.includes('<RichTextContent content={section.content}')) add(findings,{id:'rich-text:page-section-rendered-as-plain-text',title:'Rich Text سکشن به‌صورت متن ساده Render می‌شود',category:'ui',severity:'error',status:'broken',summary:'HTML ادیتور در PageView به‌صورت متن ساده نمایش داده می‌شود.',evidence:['src/components/page/PageView.tsx'],recommendation:'از RichTextContent استفاده شود.'});\n  if (!richCss.includes('STOREFRONT-RICH-TEXT-PARITY-v301013')) add(findings,{id:'rich-text:storefront-css-parity-missing',title:'CSS خروجی Rich Text با ادیتور parity کامل ندارد',category:'ui',severity:'warning',status:'partial',summary:'heading/list/blockquote ممکن است در Storefront reset شوند.',evidence:['src/components/common/RichTextEditor.css'],recommendation:'قواعد .rich-text-content اضافه شوند.'});\n  if (!richContent.includes('data-rich-text-content=\"1\"')) add(findings,{id:'rich-text:runtime-probe-marker-missing',title:'Rich Text برای computed-style audit علامت‌گذاری نشده',category:'contract',severity:'warning',status:'partial',summary:'Auditor نمی‌تواند inline style را با computed style مقایسه کند.',evidence:['src/components/common/RichTextContent.tsx']});\n  if (!store.includes('pagesRef.current.find(item => item.slug === pageSlug)')) add(findings,{id:'live-editor:stale-page-snapshot',title:'Live Editor ممکن است snapshot قدیمی را ذخیره کند',category:'contract',severity:'error',status:'conflict',summary:'save path به state غیرهمگام React متکی است.',evidence:['src/context/StoreContext.tsx'],recommendation:'از snapshot همگام استفاده شود.'});\n  if (!store.includes('PAGE_PERSISTENCE_MISMATCH') || !cms.includes('PAGE_PERSIST_READBACK_FAILED')) add(findings,{id:'live-editor:persistence-roundtrip-unverified',title:'ذخیره Live Editor round-trip DB را تأیید نمی‌کند',category:'contract',severity:'error',status:'partial',summary:'پاسخ موفق PUT لزوماً برابر داده بعد از refresh نیست.',evidence:['src/context/StoreContext.tsx','src/server/routes/cms.ts'],recommendation:'write/readback DB و مقایسه payload فعال شود.'});\n}\n`;
    const anchor = '\nfunction summaryFor';
    if (!source.includes(anchor)) fail('auditor summary anchor');
    source = source.replace(anchor, helper + anchor);
  }
  source = source.replace(
    "const richCss = byRel.get('src/components/common/RichTextEditor.css') || '';",
    "const richCss = readUtf8(path.join(ROOT, 'src/components/common/RichTextEditor.css')) || '';"
  );
  if (!source.includes("const richCss = readUtf8(path.join(ROOT, 'src/components/common/RichTextEditor.css')) || '';")) fail('auditor rich text CSS probe');
  if (!source.includes('scanRichTextAndLiveEditorContracts(files, findings);')) {
    if (!source.includes('  scanDuplicateServerRoutes(routes, findings);')) fail('auditor run anchor');
    source = source.replace('  scanDuplicateServerRoutes(routes, findings);', '  scanDuplicateServerRoutes(routes, findings);\n  scanRichTextAndLiveEditorContracts(files, findings);');
  }
  const engineMatch = source.match(/const ENGINE_VERSION = ['"](2\.(\d+)(?:\.\d+)?)['"]/);
  if (!engineMatch || Number(engineMatch[2]) < 2) fail('auditor 2.2+ version');
  write(file, source);
}

console.log('v30.10.13 critical rich-text + live-editor persistence path and Site Auditor 2.2+ baseline applied.');