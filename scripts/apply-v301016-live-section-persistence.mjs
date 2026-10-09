import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.16 marker missing: ${label}`); };
const replaceRange = (source, startMarker, endMarker, replacement, label) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) fail(label);
  return source.slice(0, start) + replacement + source.slice(end);
};

// ---------------------------------------------------------------------------
// 1) Section edits must not save the whole page snapshot. A live preview mutates
//    local React state continuously, while the server canonicalizes the page
//    section order. Saving the whole page therefore created avoidable revision /
//    equality conflicts. Use a dedicated atomic section endpoint instead.
// ---------------------------------------------------------------------------
{
  const file = 'src/context/StoreContext.tsx';
  let source = read(file);

  if (!source.includes('LIVE-SECTION-ATOMIC-SAVE-v301016')) {
    const replacement = `  // LIVE-SECTION-ATOMIC-SAVE-v301016\n  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {\n    const page = pagesRef.current.find(item => item.slug === pageSlug);\n    if (!page) {\n      showToast('برگه برای ذخیره پیدا نشد.', 'error');\n      return false;\n    }\n\n    try {\n      const result = await apiRequest<{ page: SitePage; section: PageSection }>(\n        \`/api/cms/pages/\${encodeURIComponent(page.id)}/sections/\${encodeURIComponent(updatedSection.id)}\`,\n        {\n          method: 'PATCH',\n          body: JSON.stringify({\n            section: updatedSection,\n            cmsRevision: Math.max(0, Number(page.cmsRevision || 0))\n          })\n        }\n      );\n\n      const storedSection = result.section || result.page?.sections?.find(section => section.id === updatedSection.id);\n      if (!storedSection) {\n        throw Object.assign(new Error('LIVE_SECTION_READBACK_MISSING'), { code: 'LIVE_SECTION_READBACK_MISSING' });\n      }\n\n      // Compare every authored property, but ignore server-owned ordering. The\n      // page endpoint may canonicalize order; a section edit must not fail just\n      // because the server owns that metadata.\n      const authoredEntries = Object.entries(updatedSection).filter(([key]) => key !== 'order');\n      const mismatches = authoredEntries.filter(([key, value]) =>\n        JSON.stringify((storedSection as any)[key]) !== JSON.stringify(value)\n      );\n      if (mismatches.length) {\n        console.error('LIVE_SECTION_PERSISTENCE_MISMATCH', {\n          sectionId: updatedSection.id,\n          keys: mismatches.map(([key]) => key),\n          expected: updatedSection,\n          stored: storedSection\n        });\n        showToast('ذخیره سکشن تأیید نشد؛ بخشی از تغییرات بعد از خواندن از پایگاه داده متفاوت بود.', 'error');\n        return false;\n      }\n\n      const savedPage = result.page;\n      setPages(prev => {\n        const exists = prev.some(item => item.id === savedPage.id);\n        const next = exists\n          ? prev.map(item => item.id === savedPage.id ? savedPage : item)\n          : [...prev, savedPage];\n        pagesRef.current = next;\n        return next;\n      });\n      showToast(\`بخش «\${storedSection.title || updatedSection.title}» با موفقیت ذخیره شد.\`);\n      return true;\n    } catch (error: any) {\n      console.error('LIVE_SECTION_SAVE_FAILED', error);\n      const code = String(error?.code || '');\n      showToast(\n        code === 'CMS_PAGE_REVISION_CONFLICT'\n          ? 'این برگه هم‌زمان تغییر کرده است. صفحه را تازه‌سازی کنید و دوباره ذخیره کنید.'\n          : 'ذخیره سکشن در پایگاه داده انجام نشد.',\n        'error'\n      );\n      return false;\n    }\n  };\n`;
    source = replaceRange(source, '  const updateSection = async', '\n  const previewSection =', replacement, 'StoreContext updateSection');
  }

  if (!source.includes('LIVE-SECTION-ATOMIC-SAVE-v301016') || !source.includes('/sections/${encodeURIComponent(updatedSection.id)}')) {
    fail('atomic section client save');
  }
  write(file, source);
}

// ---------------------------------------------------------------------------
// 2) Add a transaction-scoped endpoint that updates only one section, preserves
//    server-owned order, increments cmsRevision and returns a DB readback.
// ---------------------------------------------------------------------------
{
  const file = 'src/server/routes/cms.ts';
  let source = read(file);
  const marker = '// LIVE-SECTION-ATOMIC-ENDPOINT-v301016';
  if (!source.includes(marker)) {
    const anchor = "\ncmsRouter.delete('/pages/:id'";
    if (!source.includes(anchor)) fail('CMS delete-page anchor');
    const route = `\n${marker}\ncmsRouter.patch('/pages/:id/sections/:sectionId', requireAdminPermission('canManageSettings'), async (req, res) => {\n  const pageId = String(req.params.id || '').trim();\n  const sectionId = String(req.params.sectionId || '').trim();\n  const incomingSection = req.body?.section;\n  const incomingRevision = Math.max(0, Number(req.body?.cmsRevision || 0));\n  if (!pageId || !sectionId || !incomingSection || typeof incomingSection !== 'object') {\n    res.status(400).json({ error: 'PAGE_SECTION_DATA_INVALID' });\n    return;\n  }\n\n  try {\n    const result: any = await withTransaction(async tx => {\n      const [rows] = await tx.query<JsonRow[]>(\n        'SELECT id, data_json FROM site_pages WHERE id = ? FOR UPDATE',\n        [pageId]\n      );\n      if (!rows[0]) return { notFound: true };\n\n      const currentPage = { ...parseJson<any>(rows[0].data_json, {}), id: rows[0].id };\n      const currentRevision = Math.max(0, Number(currentPage.cmsRevision || 0));\n      if (incomingRevision !== currentRevision) {\n        return { conflict: true, currentPage };\n      }\n\n      const sections = Array.isArray(currentPage.sections) ? [...currentPage.sections] : [];\n      const index = sections.findIndex((section: any) => String(section?.id || '') === sectionId);\n      if (index < 0) return { sectionNotFound: true };\n\n      const currentSection = sections[index] || {};\n      const nextSection = {\n        ...currentSection,\n        ...incomingSection,\n        id: sectionId,\n        // Section ordering is changed only by the reorder operation, not by the\n        // inspector modal. This also prevents false persistence mismatches.\n        order: Number(currentSection.order || index + 1)\n      };\n      sections[index] = nextSection;\n\n      const savedPage = {\n        ...currentPage,\n        sections,\n        cmsRevision: currentRevision + 1,\n        updatedAt: new Date().toISOString()\n      };\n\n      await tx.execute(\n        `UPDATE site_pages\n         SET slug = ?, title = ?, is_system = ?, data_json = ?, updated_at = NOW()\n         WHERE id = ?`,\n        [savedPage.slug, savedPage.title, savedPage.isSystem ? 1 : 0, asJson(savedPage), pageId]\n      );\n\n      const [readbackRows] = await tx.query<JsonRow[]>(\n        'SELECT id, data_json FROM site_pages WHERE id = ? LIMIT 1',\n        [pageId]\n      );\n      if (!readbackRows[0]) return { readbackFailed: true };\n      const persistedPage = { ...parseJson<any>(readbackRows[0].data_json, {}), id: readbackRows[0].id };\n      const persistedSection = (Array.isArray(persistedPage.sections) ? persistedPage.sections : [])\n        .find((section: any) => String(section?.id || '') === sectionId);\n      if (!persistedSection) return { readbackFailed: true };\n      return { page: persistedPage, section: persistedSection };\n    });\n\n    if (result.notFound) {\n      res.status(404).json({ error: 'PAGE_NOT_FOUND' });\n      return;\n    }\n    if (result.sectionNotFound) {\n      res.status(404).json({ error: 'PAGE_SECTION_NOT_FOUND' });\n      return;\n    }\n    if (result.conflict) {\n      res.status(409).json({ error: 'CMS_PAGE_REVISION_CONFLICT', currentPage: result.currentPage });\n      return;\n    }\n    if (result.readbackFailed || !result.page || !result.section) {\n      res.status(500).json({ error: 'PAGE_SECTION_PERSIST_READBACK_FAILED' });\n      return;\n    }\n    res.json({ page: result.page, section: result.section });\n  } catch (error) {\n    console.error('CMS section patch failed:', error);\n    res.status(500).json({ error: 'PAGE_SECTION_SAVE_FAILED' });\n  }\n});\n`;
    source = source.replace(anchor, route + anchor);
  }
  if (!source.includes("cmsRouter.patch('/pages/:id/sections/:sectionId'") || !source.includes('PAGE_SECTION_PERSIST_READBACK_FAILED')) {
    fail('atomic section server route');
  }
  write(file, source);
}

// ---------------------------------------------------------------------------
// 3) Keep an immediate form snapshot inside the modal. Every control writes to
//    this ref before previewing, so Save cannot read a one-render-old form value.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = read(file);
  if (!source.includes('LIVE-SECTION-FORM-SNAPSHOT-v301016')) {
    const stateAnchor = '  const [form, setForm] = useState<PageSection | null>(null);';
    if (!source.includes(stateAnchor)) fail('LiveSectionModal form state');
    source = source.replace(stateAnchor, `${stateAnchor}\n  // LIVE-SECTION-FORM-SNAPSHOT-v301016\n  const formRef = useRef<PageSection | null>(null);`);

    source = source.replace(
      '    originalRef.current = snapshot;\n    activeKeyRef.current = key;\n    setForm(snapshot);',
      '    originalRef.current = snapshot;\n    formRef.current = snapshot;\n    activeKeyRef.current = key;\n    setForm(snapshot);'
    );
    source = source.replace(
      "      originalRef.current = null;\n      setForm(null);",
      "      originalRef.current = null;\n      formRef.current = null;\n      setForm(null);"
    );
    source = source.replace(
      '  const apply = (next: PageSection) => {\n    setForm(next);\n    previewSection(pageSlug, next);\n  };',
      '  const apply = (next: PageSection) => {\n    formRef.current = next;\n    setForm(next);\n    previewSection(pageSlug, next);\n  };'
    );

    // v30.9.2 owns the async save block at this point in the prepare pipeline.
    source = source.replace(
      '      const saved = await updateSection(pageSlug, form);',
      '      const sectionToSave = formRef.current || form;\n      const saved = await updateSection(pageSlug, sectionToSave);'
    );
    source = source.replace(
      '      originalRef.current = JSON.parse(JSON.stringify(form));\n      showToast(`سکشن «${form.title}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.`);',
      '      const sectionToCommit = formRef.current || form;\n      originalRef.current = JSON.parse(JSON.stringify(sectionToCommit));\n      showToast(`سکشن «${sectionToCommit.title}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.`);'
    );

    source = source.replace(
      '        role="dialog"\n        aria-modal="true"',
      '        role="dialog"\n        data-live-section-modal="1"\n        aria-modal="true"'
    );
    source = source.replace(
      '<button type="button" onClick={save} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-60">',
      '<button type="button" data-live-section-save="1" onClick={save} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-60">'
    );
  }

  if (!source.includes('LIVE-SECTION-FORM-SNAPSHOT-v301016') || !source.includes('data-live-section-save="1"')) {
    fail('modal form snapshot/save marker');
  }
  write(file, source);
}

// ---------------------------------------------------------------------------
// 4) The legacy admin page editor used to close its modal before awaiting the
//    save result. Make it obey the same persistence contract.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/admin/AdminPagesTab.tsx';
  let source = read(file);
  if (!source.includes('ADMIN-SECTION-AWAIT-SAVE-v301016')) {
    const start = source.indexOf('  const handleSaveSection = (e: React.FormEvent) => {');
    const end = source.indexOf('\n\n  const handleMoveOrder', start);
    if (start < 0 || end < 0) fail('AdminPagesTab handleSaveSection');
    const replacement = `  // ADMIN-SECTION-AWAIT-SAVE-v301016\n  const handleSaveSection = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!sectionForm.title) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n\n    const saved = editingSection\n      ? await updateSection(selectedPage.slug, sectionForm)\n      : await addSection(selectedPage.slug, sectionForm);\n    if (saved) setIsSectionModalOpen(false);\n  };`;
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  write(file, source);
}

console.log('v30.10.16 atomic live-section persistence + exact modal snapshot applied.');
