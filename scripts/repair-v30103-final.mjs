import fs from 'node:fs';

const changed = [];
const edit = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(file);
  }
};

const replaceFunction = (source, startNeedle, endNeedle, replacement, label) => {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0) throw new Error(`v30.10.3 final repair missing ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
};

// Keep the richer v30.9.2 authoritative save contracts. Stage 4 callers only
// require truthiness, while returning the server object lets standalone editors
// immediately refresh themselves from canonical persisted data.
edit('src/context/StoreContext.tsx', source => {
  source = source
    .replace('  addProduct: (product: Product) => Promise<boolean>;', '  addProduct: (product: Product) => Promise<Product | null>;')
    .replace('  updateProduct: (updated: Product) => Promise<boolean>;', '  updateProduct: (updated: Product) => Promise<Product | null>;')
    .replace('  addArticle: (art: Article) => Promise<boolean>;', '  addArticle: (art: Article) => Promise<Article | null>;')
    .replace('  updateArticle: (art: Article) => Promise<boolean>;', '  updateArticle: (art: Article) => Promise<Article | null>;');

  source = source
    .replace('const addProduct = async (product: Product): Promise<boolean> =>', 'const addProduct = async (product: Product): Promise<Product | null> =>')
    .replace('const updateProduct = async (updated: Product): Promise<boolean> =>', 'const updateProduct = async (updated: Product): Promise<Product | null> =>')
    .replace('const addArticle = async (art: Article): Promise<boolean> =>', 'const addArticle = async (art: Article): Promise<Article | null> =>')
    .replace('const updateArticle = async (art: Article): Promise<boolean> =>', 'const updateArticle = async (art: Article): Promise<Article | null> =>');

  const replaceReturns = (startNeedle, endNeedle, successExpression) => {
    const start = source.indexOf(startNeedle);
    const end = source.indexOf(endNeedle, start + startNeedle.length);
    if (start < 0 || end < 0) throw new Error(`v30.10.3 final repair missing return block ${startNeedle}`);
    let block = source.slice(start, end);
    block = block.replace(/\breturn true;/g, `return ${successExpression};`).replace(/\breturn false;/g, 'return null;');
    source = source.slice(0, start) + block + source.slice(end);
  };
  replaceReturns('  const addProduct = async ', '\n\n  const updateProduct = async ', 'result.product');
  replaceReturns('  const updateProduct = async ', '\n\n  const deleteProduct = ', 'result.product');
  replaceReturns('  const addArticle = async ', '\n\n  const updateArticle = async ', 'article');
  replaceReturns('  const updateArticle = async ', '\n\n  const deleteArticle = ', 'article');
  return source;
});

// Preserve the dedicated article editor route introduced in v30.9.2. The Stage
// 4 dirty-state baseline is initialized when the dedicated route loads.
edit('src/components/admin/AdminArticlesTab.tsx', source => {
  source = replaceFunction(
    source,
    '  const handleEdit = (art: Article) => {',
    '\n\n  const articleDirty = ',
`  const handleEdit = (art: Article) => {
    const url = \`/admin/article-edit/\${encodeURIComponent(art.id)}\`;
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.assign(url);
  };`,
    'article dedicated edit route'
  );

  source = replaceFunction(
    source,
    '  const handleSave = async (e: React.FormEvent) => {',
    '\n\n  const handleDelete = ',
`  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content || isArticleSaving) {
      if (!articleForm.title || !articleForm.content) showToast('عنوان و متن کامل مقاله الزامی است.', 'error');
      return;
    }
    const generatedSlug = (articleForm.slug || articleForm.title)
      .toLowerCase()
      .replace(/[^\\u0600-\\u06FFa-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const matchedCat = articleCategories.find(c => c.id === articleForm.categoryId || c.name === articleForm.category);
    setIsArticleSaving(true);
    try {
      if (editingArticle) {
        const saved = await updateArticle({
          ...editingArticle,
          ...articleForm as Article,
          category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
          categoryId: matchedCat ? matchedCat.id : articleForm.categoryId,
          slug: generatedSlug || editingArticle.slug
        });
        if (!saved) return;
        setEditingArticle(saved);
        setArticleForm({ ...saved });
        articleBaselineRef.current = editorSnapshot(saved);
        if (!standaloneEditor) setIsModalOpen(false);
        return;
      }

      const newArticle: Article = {
        id: \`art-\${Date.now()}\`,
        title: articleForm.title,
        slug: generatedSlug || \`article-\${Date.now()}\`,
        category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
        categoryId: matchedCat ? matchedCat.id : 'cat-maintenance',
        summary: articleForm.summary || '',
        content: articleForm.content,
        author: articleForm.author || 'واحد فنی چین‌پارت',
        date: new Date().toLocaleDateString('fa-IR'),
        readTimeMinutes: Number(articleForm.readTimeMinutes) || 5,
        imageUrl: articleForm.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
        relatedModelIds: articleForm.relatedModelIds || [],
        relatedProductIds: articleForm.relatedProductIds || [],
        faq: articleForm.faq || [],
        seo: articleForm.seo
      };
      const saved = await addArticle(newArticle);
      if (!saved) return;
      articleBaselineRef.current = editorSnapshot(saved);
      setIsModalOpen(false);
    } finally {
      setIsArticleSaving(false);
    }
  };`,
    'article authoritative save'
  );

  source = source.replace(
    '    setIsModalOpen(false);\n  };\n  useDialogFocusTrap(isModalOpen, articleDialogRef, closeArticleEditor);',
    "    if (standaloneEditor) window.close();\n    else setIsModalOpen(false);\n  };\n  useDialogFocusTrap(isModalOpen, articleDialogRef, closeArticleEditor);"
  );
  return source;
});

// Keep the product editor on its dedicated route after a successful save and
// update the dirty baseline from the canonical server response.
edit('src/components/admin/AdminView.tsx', source => {
  source = source.replace(
    '      setEditingProduct({ ...match });',
    '      productBaselineRef.current = editorSnapshot(match);\n      setEditingProduct({ ...match });'
  );

  source = replaceFunction(
    source,
    '  const handleSaveProduct = async (e: React.FormEvent) => {',
    '\n\n  const handleAddCategorySubmit = ',
`  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isProductSaving) return;
    setIsProductSaving(true);
    try {
      const saved = await updateProduct(editingProduct);
      if (!saved) return;
      productBaselineRef.current = editorSnapshot(saved);
      if (isStandaloneProductEditor) setEditingProduct({ ...saved });
      else setEditingProduct(null);
    } finally {
      setIsProductSaving(false);
    }
  };`,
    'product authoritative save'
  );

  source = source.replace(
    '    setEditingProduct(null);\n  };\n  useDialogFocusTrap(Boolean(editingProduct), productDialogRef, closeProductEditor);',
    "    if (isStandaloneProductEditor) window.close();\n    else setEditingProduct(null);\n  };\n  useDialogFocusTrap(Boolean(editingProduct), productDialogRef, closeProductEditor);"
  );
  return source;
});

// Make the shared live editor fully authoritative for both editing and creating
// sections. Keep v30.9.2 banner-placement synchronization intact and make the
// footer save control universal rather than hidden for banner sections.
edit('src/components/common/LiveSectionModal.tsx', source => {
  const cancelStart = source.indexOf('  const cancel = ');
  const pointerStart = source.indexOf('  const onModalPointerDown = ');
  if (cancelStart >= 0 && pointerStart > cancelStart) {
    const replacement = `  const cancel = requestClose;\n\n  const save = async () => {\n    if (!form.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    if (isSaving) return;\n    setIsSaving(true);\n    try {\n      const saved = mode === 'create'\n        ? await addSection(pageSlug, form)\n        : await updateSection(pageSlug, form);\n      if (!saved) return;\n\n      const bannerKey = BANNER_PLACEMENT_META.some(item => item.key === form.sectionKey) ? form.sectionKey : undefined;\n      if (bannerKey) {\n        const migrated = migrateLegacyBannerPlacements([form], sliders).find(item => item.key === bannerKey);\n        if (migrated) {\n          const resolved = resolveBannerPlacements(settings.bannerPlacements, page?.sections || [], sliders);\n          const nextPlacements = resolved.map(item => item.key === bannerKey\n            ? { ...item, ...migrated, key: item.key, title: item.title || migrated.title }\n            : item);\n          const settingsSaved = await updateSettings({ bannerPlacements: nextPlacements });\n          if (!settingsSaved) {\n            showToast('خود سکشن ذخیره شد اما همگام‌سازی جایگاه بنر انجام نشد.', 'error');\n            return;\n          }\n        }\n      }\n\n      originalRef.current = JSON.parse(JSON.stringify(form));\n      initialRef.current = JSON.parse(JSON.stringify(form));\n      didPreviewRef.current = false;\n      showToast(\`سکشن «\${form.title}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.\`);\n      onClose();\n    } finally {\n      setIsSaving(false);\n    }\n  };\n\n  const deleteCurrent = async () => {\n    if (mode === 'create' || isDeleting) return;\n    if (!window.confirm(\`سکشن «\${form.title || 'انتخاب‌شده'}» حذف شود؟\`)) return;\n    setIsDeleting(true);\n    try {\n      const deleted = await deleteSection(pageSlug, form.id);\n      if (!deleted) return;\n      originalRef.current = null;\n      initialRef.current = null;\n      didPreviewRef.current = false;\n      onClose();\n    } finally {\n      setIsDeleting(false);\n    }\n  };\n\n`;
    source = source.slice(0, cancelStart) + replacement + source.slice(pointerStart);
  }

  // Some generator revisions place pointer handlers before cancel/save. If so,
  // patch the individual functions instead of relying on the block above.
  if (!source.includes("mode === 'create'\n        ? await addSection")) {
    const saveStart = source.indexOf('  const save = async () => {');
    const deleteStart = source.indexOf('  const deleteCurrent = ', saveStart);
    if (saveStart < 0 || deleteStart < 0) throw new Error('v30.10.3 final repair missing live save block');
    const save = `  const save = async () => {\n    if (!form.title?.trim()) { showToast('عنوان سکشن الزامی است.', 'error'); return; }\n    if (isSaving) return;\n    setIsSaving(true);\n    try {\n      const saved = mode === 'create' ? await addSection(pageSlug, form) : await updateSection(pageSlug, form);\n      if (!saved) return;\n      const bannerKey = BANNER_PLACEMENT_META.some(item => item.key === form.sectionKey) ? form.sectionKey : undefined;\n      if (bannerKey) {\n        const migrated = migrateLegacyBannerPlacements([form], sliders).find(item => item.key === bannerKey);\n        if (migrated) {\n          const resolved = resolveBannerPlacements(settings.bannerPlacements, page?.sections || [], sliders);\n          const nextPlacements = resolved.map(item => item.key === bannerKey ? { ...item, ...migrated, key:item.key, title:item.title || migrated.title } : item);\n          if (!(await updateSettings({ bannerPlacements: nextPlacements }))) return;\n        }\n      }\n      originalRef.current = JSON.parse(JSON.stringify(form));\n      initialRef.current = JSON.parse(JSON.stringify(form));\n      didPreviewRef.current = false;\n      onClose();\n    } finally { setIsSaving(false); }\n  };\n\n`;
    source = source.slice(0, saveStart) + save + source.slice(deleteStart);
  }

  source = source.replace(
    /\{!isBannerSection && <button type="button" disabled=\{isDeleting \|\| isSaving\} onClick=\{save\}[^>]*>[^<]*<Save className="w-4 h-4" \/> \{isSaving \? 'در حال ذخیره…' : mode === 'create' \? 'ایجاد سکشن' : 'ذخیره'\}<\/button>\}/,
    `<button type="button" onClick={save} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-50"><Save className="w-4 h-4" /> {isSaving ? 'در حال ذخیره…' : mode === 'create' ? 'ایجاد سکشن' : 'ذخیره تغییرات'}</button>`
  );
  source = source.replace(
    /\{!isBannerSection && <button type="button" onClick=\{save\}[^}]+\}\s*<\/button>\}/,
    `<button type="button" onClick={save} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-50"><Save className="w-4 h-4" /> {isSaving ? 'در حال ذخیره…' : mode === 'create' ? 'ایجاد سکشن' : 'ذخیره تغییرات'}</button>`
  );

  source = source.replace(
    "window.matchMedia('(max-width: 767px)').matches ? 'translate(-50%, -50%)'",
    "(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) ? 'translate(-50%, -50%)'"
  );
  return source;
});

// Arrow ordering and drag/drop must both mutate array position before assigning
// canonical 1..N order values. Swapping only the numeric order and immediately
// renumbering the unchanged array is a no-op.
edit('src/components/admin/AdminPagesTab.tsx', source => {
  source = replaceFunction(
    source,
    "  const handleMoveOrder = async (sectionId: string, direction: 'up' | 'down') => {",
    '\n\n  const handleDropSection = ',
`  const handleMoveOrder = async (sectionId: string, direction: 'up' | 'down') => {
    if (!selectedPage) return;
    const sorted = [...selectedPage.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(section => section.id === sectionId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const [movedSection] = sorted.splice(index, 1);
    sorted.splice(targetIndex, 0, movedSection);
    await updatePage({
      ...selectedPage,
      sections: sorted.map((section, order) => ({ ...section, order: order + 1 }))
    });
  };`,
    'deterministic arrow section ordering'
  );
  return source;
});

console.log('v30.10.3 final compatibility/stability repair:', changed.length ? changed.join(', ') : 'already satisfied');
