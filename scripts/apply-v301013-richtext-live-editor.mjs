import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const replaceRequired = (content, before, after, label) => {
  if (!content.includes(before)) throw new Error(`v30.10.13 marker missing: ${label}`);
  return content.replace(before, after);
};

// 1) Render every PageView rich-text section through the shared safe renderer.
{
  const file = 'src/components/page/PageView.tsx';
  let source = read(file);
  if (!source.includes("import { RichTextContent } from '../common/RichTextContent';")) {
    source = replaceRequired(
      source,
      "import { LiveSectionModal } from '../common/LiveSectionModal';",
      "import { LiveSectionModal } from '../common/LiveSectionModal';\nimport { RichTextContent } from '../common/RichTextContent';",
      'PageView rich renderer import'
    );
  }

  let replacements = 0;
  source = source.replace(
    /\{section\.content && \(\s*<div className=\"([^\"]+)\">\s*\{section\.content\}\s*<\/div>\s*\)\}/g,
    (_match, className) => {
      replacements += 1;
      return `{section.content && (\n                        <RichTextContent content={section.content} className=\"${className}\" />\n                      )}`;
    }
  );
  if (!source.includes('<RichTextContent content={section.content}')) {
    throw new Error('v30.10.13 PageView rich-text renderer patch did not apply');
  }
  write(file, source);
  console.log(`v30.10.13 PageView rich-text renderers ready (${replacements || 'already'} replacements).`);
}

// 2) Give rendered storefront rich text the same structural typography as the editor.
{
  const file = 'src/components/common/RichTextEditor.css';
  let source = read(file);
  const marker = '/* STOREFRONT-RICH-TEXT-PARITY-v301013 */';
  if (!source.includes(marker)) {
    source += `\n\n${marker}\n.rich-text-content {\n  direction: rtl;\n  text-align: inherit;\n  line-height: 1.9;\n  white-space: normal;\n}\n\n.rich-text-content p {\n  margin: 0 0 .65em;\n}\n\n.rich-text-content h2,\n.rich-text-content h3,\n.rich-text-content h4 {\n  margin: .8em 0 .45em;\n  color: inherit;\n  font-weight: 800;\n  line-height: 1.5;\n}\n\n.rich-text-content h2 { font-size: 1.45em; }\n.rich-text-content h3 { font-size: 1.25em; }\n.rich-text-content h4 { font-size: 1.1em; }\n\n.rich-text-content ul,\n.rich-text-content ol {\n  margin: .65em 0;\n  padding-right: 1.6em;\n  padding-left: 0;\n}\n\n.rich-text-content ul { list-style: disc; }\n.rich-text-content ol { list-style: decimal; }\n\n.rich-text-content blockquote {\n  margin: .8em 0;\n  border-right: 3px solid currentColor;\n  padding: .35em .8em;\n  background: color-mix(in srgb, currentColor 6%, transparent);\n}\n\n.rich-text-content pre {\n  max-width: 100%;\n  overflow-x: auto;\n  white-space: pre-wrap;\n}\n\n.rich-text-content [style*=\"text-align\"] {\n  /* Inline author alignment is intentionally left authoritative. */\n}\n`;
    write(file, source);
  }
}

// 3) Mark all rich-text render roots so Site Auditor can compare requested inline styles with computed browser styles.
{
  const file = 'src/components/common/RichTextContent.tsx';
  let source = read(file);
  if (!source.includes('data-rich-text-content="1"')) {
    source = replaceRequired(
      source,
      '      <span\n        className={classes}',
      '      <span\n        data-rich-text-content="1"\n        dir="rtl"\n        className={classes}',
      'inline rich content marker'
    );
    source = replaceRequired(
      source,
      '  return <div className={classes} dangerouslySetInnerHTML={{ __html: wrapResponsiveTables(html) }} />;',
      '  return <div data-rich-text-content="1" dir="rtl" className={classes} dangerouslySetInnerHTML={{ __html: wrapResponsiveTables(html) }} />;',
      'block rich content marker'
    );
    write(file, source);
  }
}

// 4) Eliminate stale-state races in the live page builder and verify persistence round-trip.
{
  const file = 'src/context/StoreContext.tsx';
  let source = read(file);
  source = source.replace(
    "import React, { createContext, useContext, useState, useEffect } from 'react';",
    "import React, { createContext, useContext, useState, useEffect, useRef } from 'react';"
  );

  if (!source.includes('const pagesRef = useRef<SitePage[]>([]);')) {
    source = replaceRequired(
      source,
      '  const [pages, setPages] = useState<SitePage[]>([]);\n\n  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(false);',
      '  const [pages, setPages] = useState<SitePage[]>([]);\n  const pagesRef = useRef<SitePage[]>([]);\n  useEffect(() => { pagesRef.current = pages; }, [pages]);\n\n  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(false);',
      'pages ref'
    );
  }

  if (!source.includes('PAGE_PERSISTENCE_MISMATCH')) {
    source = replaceRequired(
      source,
      `      setPages(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        return exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n      });`,
      `      const expectedSections = JSON.stringify(normalized.sections || []);\n      const storedSections = JSON.stringify(saved.sections || []);\n      if (expectedSections !== storedSections) {\n        console.error('PAGE_PERSISTENCE_MISMATCH', { expected: normalized.sections, stored: saved.sections });\n        showToast('ذخیره برگه تأیید نشد؛ داده خوانده‌شده از سرور با تغییرات شما یکسان نیست.', 'error');\n        return false;\n      }\n      setPages(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        const next = exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n        pagesRef.current = next;\n        return next;\n      });`,
      'page persistence verification'
    );
  }

  source = source.replace(
    `  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {\n    const page = pages.find(item => item.slug === pageSlug);`,
    `  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {\n    const page = pagesRef.current.find(item => item.slug === pageSlug);`
  );

  source = source.replace(
    `  const previewSection = (pageSlug: string, sectionPreview: PageSection) => {\n    setPages(prev => prev.map(page => {\n      if (page.slug !== pageSlug) return page;\n      const exists = page.sections.some(section => section.id === sectionPreview.id);\n      return {\n        ...page,\n        sections: exists\n          ? page.sections.map(section => section.id === sectionPreview.id ? { ...sectionPreview } : section)\n          : [...page.sections, { ...sectionPreview }]\n      };\n    }));\n  };`,
    `  const previewSection = (pageSlug: string, sectionPreview: PageSection) => {\n    setPages(prev => {\n      const next = prev.map(page => {\n        if (page.slug !== pageSlug) return page;\n        const exists = page.sections.some(section => section.id === sectionPreview.id);\n        return {\n          ...page,\n          sections: exists\n            ? page.sections.map(section => section.id === sectionPreview.id ? { ...sectionPreview } : section)\n            : [...page.sections, { ...sectionPreview }]\n        };\n      });\n      pagesRef.current = next;\n      return next;\n    });\n  };`
  );

  source = source.replace(
    `  const addSection = (pageSlug: string, newSection: PageSection) => {\n    const page = pages.find(item => item.slug === pageSlug);`,
    `  const addSection = (pageSlug: string, newSection: PageSection) => {\n    const page = pagesRef.current.find(item => item.slug === pageSlug);`
  );
  source = source.replace(
    `  const deleteSection = (pageSlug: string, sectionId: string) => {\n    const page = pages.find(item => item.slug === pageSlug);`,
    `  const deleteSection = (pageSlug: string, sectionId: string) => {\n    const page = pagesRef.current.find(item => item.slug === pageSlug);`
  );

  if (!source.includes('pagesRef.current.find(item => item.slug === pageSlug)')) {
    throw new Error('v30.10.13 live editor page ref patch did not apply');
  }
  write(file, source);
}

// 5) Return the actual DB row after page/settings writes instead of echoing request payloads.
{
  const file = 'src/server/routes/cms.ts';
  let source = read(file);
  if (!source.includes("PAGE_PERSIST_READBACK_FAILED")) {
    source = replaceRequired(
      source,
      `  await pool.execute(\n    \`INSERT INTO site_pages (id, slug, title, is_system, data_json)\n     VALUES (?, ?, ?, ?, ?)\n     ON DUPLICATE KEY UPDATE\n       slug = VALUES(slug),\n       title = VALUES(title),\n       is_system = VALUES(is_system),\n       data_json = VALUES(data_json),\n       updated_at = NOW()\`,\n    [page.id, page.slug, page.title, page.isSystem ? 1 : 0, asJson(page)]\n  );\n  res.json({ page });`,
      `  await pool.execute(\n    \`INSERT INTO site_pages (id, slug, title, is_system, data_json)\n     VALUES (?, ?, ?, ?, ?)\n     ON DUPLICATE KEY UPDATE\n       slug = VALUES(slug),\n       title = VALUES(title),\n       is_system = VALUES(is_system),\n       data_json = VALUES(data_json),\n       updated_at = NOW()\`,\n    [page.id, page.slug, page.title, page.isSystem ? 1 : 0, asJson(page)]\n  );\n  const [savedRows] = await pool.query<JsonRow[]>(\n    'SELECT id, data_json FROM site_pages WHERE id = ? LIMIT 1',\n    [page.id]\n  );\n  if (!savedRows[0]) {\n    res.status(500).json({ error: 'PAGE_PERSIST_READBACK_FAILED' });\n    return;\n  }\n  const persistedPage = { ...parseJson<any>(savedRows[0].data_json, {}), id: savedRows[0].id };\n  res.json({ page: persistedPage });`,
      'page DB readback'
    );
  }

  if (!source.includes("SETTINGS_PERSIST_READBACK_FAILED")) {
    source = replaceRequired(
      source,
      `  res.json({ settings });\n});\n\ncmsRouter.put('/payment-gateways'`,
      `  const [savedSettingRows] = await pool.query<SettingRow[]>(\n    \"SELECT setting_key, setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1\"\n  );\n  if (!savedSettingRows[0]) {\n    res.status(500).json({ error: 'SETTINGS_PERSIST_READBACK_FAILED' });\n    return;\n  }\n  const persistedSettings = parseJson<any>(savedSettingRows[0].setting_value, settings);\n  res.json({ settings: persistedSettings });\n});\n\ncmsRouter.put('/payment-gateways'`,
      'settings DB readback'
    );
  }
  write(file, source);
}

// 6) Site Auditor v2.2: verify these contracts in prepared source.
{
  const file = 'src/server/audit/site-audit.ts';
  let source = read(file);
  source = source.replace("const ENGINE_VERSION = '2.1.0';", "const ENGINE_VERSION = '2.2.0';");
  const marker = 'function scanRichTextAndLiveEditorContracts(files: string[], findings: AuditFinding[]) {';
  if (!source.includes(marker)) {
    const helper = `\nfunction scanRichTextAndLiveEditorContracts(files: string[], findings: AuditFinding[]) {\n  const byRel = new Map(files.map(file => [relative(file), readUtf8(file) || '']));\n  const pageView = byRel.get('src/components/page/PageView.tsx') || '';\n  const richCss = byRel.get('src/components/common/RichTextEditor.css') || '';\n  const richContent = byRel.get('src/components/common/RichTextContent.tsx') || '';\n  const store = byRel.get('src/context/StoreContext.tsx') || '';\n  const cms = byRel.get('src/server/routes/cms.ts') || '';\n\n  if (/\\{section\\.content\\}/.test(pageView) && !pageView.includes('<RichTextContent content={section.content}')) {\n    add(findings, {\n      id: 'rich-text:page-section-rendered-as-plain-text',\n      title: 'Rich Text سکشن به‌صورت متن ساده Render می‌شود',\n      category: 'ui', severity: 'error', status: 'broken',\n      summary: 'Editor HTML امن تولید می‌کند اما PageView آن را با interpolation ساده React نمایش می‌دهد؛ در نتیجه alignment، رنگ، اندازه، heading و markها اجرا نمی‌شوند.',\n      evidence: ['src/components/page/PageView.tsx'],\n      files: ['src/components/page/PageView.tsx','src/components/common/RichTextContent.tsx'],\n      likelyCause: 'Renderer مشترک RichTextContent در مسیر Page Builder استفاده نشده است.',\n      recommendation: 'section.content فقط از RichTextContent عبور داده شود.'\n    });\n  }\n  if (!richCss.includes('STOREFRONT-RICH-TEXT-PARITY-v301013')) {\n    add(findings, {\n      id: 'rich-text:storefront-css-parity-missing',\n      title: 'CSS خروجی Rich Text با ادیتور parity کامل ندارد',\n      category: 'ui', severity: 'warning', status: 'partial',\n      summary: 'ساختار heading/list/blockquote در Storefront ممکن است با ظاهر ادیتور یکسان نباشد.',\n      evidence: ['src/components/common/RichTextEditor.css'],\n      files: ['src/components/common/RichTextEditor.css'],\n      recommendation: 'قواعد structural typography برای .rich-text-content تعریف شوند و inline author styles override نشوند.'\n    });\n  }\n  if (!richContent.includes('data-rich-text-content=\"1\"')) {\n    add(findings, {\n      id: 'rich-text:runtime-probe-marker-missing',\n      title: 'Rich Text برای ممیزی computed-style قابل شناسایی نیست',\n      category: 'contract', severity: 'warning', status: 'partial',\n      summary: 'Auditor نمی‌تواند requested style را با computed style مرورگر تطبیق دهد.',\n      evidence: ['src/components/common/RichTextContent.tsx'],\n      files: ['src/components/common/RichTextContent.tsx'],\n      recommendation: 'render root با data-rich-text-content علامت‌گذاری شود.'\n    });\n  }\n  if (!store.includes('pagesRef.current.find(item => item.slug === pageSlug)')) {\n    add(findings, {\n      id: 'live-editor:stale-page-snapshot',\n      title: 'Live Editor ممکن است snapshot قدیمی صفحه را ذخیره کند',\n      category: 'contract', severity: 'error', status: 'conflict',\n      summary: 'preview و save از state غیرهمگام React استفاده می‌کنند و در تغییرات سریع امکان ذخیره snapshot قدیمی وجود دارد.',\n      evidence: ['src/context/StoreContext.tsx'],\n      files: ['src/context/StoreContext.tsx'],\n      likelyCause: 'save path به state closure متکی است، نه آخرین snapshot همگام.',\n      recommendation: 'builder mutationها از pagesRef همگام استفاده کنند.'\n    });\n  }\n  if (!store.includes('PAGE_PERSISTENCE_MISMATCH') || !cms.includes('PAGE_PERSIST_READBACK_FAILED')) {\n    add(findings, {\n      id: 'live-editor:persistence-roundtrip-unverified',\n      title: 'ذخیره Live Editor round-trip واقعی DB را تأیید نمی‌کند',\n      category: 'contract', severity: 'error', status: 'partial',\n      summary: 'موفقیت PUT به‌تنهایی اثبات نمی‌کند داده‌ای که بعد از refresh خوانده می‌شود با payload یکسان است.',\n      evidence: ['src/context/StoreContext.tsx','src/server/routes/cms.ts'],\n      files: ['src/context/StoreContext.tsx','src/server/routes/cms.ts'],\n      recommendation: 'پس از write همان row از DB خوانده و با sectionهای ارسالی مقایسه شود.'\n    });\n  }\n}\n`;
    const anchor = '\nfunction summaryFor';
    if (!source.includes(anchor)) throw new Error('v30.10.13 auditor summary anchor missing');
    source = source.replace(anchor, `${helper}${anchor}`);
  }
  if (!source.includes('scanRichTextAndLiveEditorContracts(files, findings);')) {
    source = replaceRequired(
      source,
      '  scanDuplicateServerRoutes(routes, findings);',
      '  scanDuplicateServerRoutes(routes, findings);\n  scanRichTextAndLiveEditorContracts(files, findings);',
      'auditor rich/live scanner call'
    );
  }
  write(file, source);
}

console.log('v30.10.13 rich-text rendering, storefront style parity, live-editor stale-state protection, DB readback verification and Auditor v2.2 applied.');
