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

const replaceBetween = (source, start, end, replacement, label) => {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`v30.10.3 target missing: ${label}`);
  return source.slice(0, a) + replacement + source.slice(b);
};

edit('src/types/index.ts', source => {
  if (!source.includes('cmsRevision?: number;')) {
    source = source.replace(
      '  builderConfigVersion?: number;\n}',
      '  builderConfigVersion?: number;\n  /** Optimistic-concurrency revision for CMS/Page Builder saves. */\n  cmsRevision?: number;\n}'
    );
  }
  return source;
});

edit('src/context/StoreContext.tsx', source => {
  const signaturePairs = [
    ['  addProduct: (product: Product) => void;', '  addProduct: (product: Product) => Promise<boolean>;'],
    ['  updateProduct: (updated: Product) => void;', '  updateProduct: (updated: Product) => Promise<boolean>;'],
    ['  addArticle: (art: Article) => void;', '  addArticle: (art: Article) => Promise<boolean>;'],
    ['  updateArticle: (art: Article) => void;', '  updateArticle: (art: Article) => Promise<boolean>;'],
    ['  updatePage: (page: SitePage) => void;', '  updatePage: (page: SitePage) => Promise<boolean>;'],
    ['  addSection: (pageSlug: string, section: PageSection) => void;', '  addSection: (pageSlug: string, section: PageSection) => Promise<boolean>;'],
    ['  deleteSection: (pageSlug: string, sectionId: string) => void;', '  deleteSection: (pageSlug: string, sectionId: string) => Promise<boolean>;']
  ];
  for (const [from, to] of signaturePairs) source = source.replace(from, to);
  if (!source.includes('discardSectionPreview:')) {
    source = source.replace(
      '  previewSection: (pageSlug: string, section: PageSection) => void;\n',
      '  previewSection: (pageSlug: string, section: PageSection) => void;\n  discardSectionPreview: (pageSlug: string, sectionId: string) => void;\n'
    );
  }

  source = replaceBetween(
    source,
    '  const addProduct = (product: Product) => {',
    '\n\n  const deleteProduct = (id: string) => {',
`  const addProduct = async (product: Product): Promise<boolean> => {
    try {
      const result = await apiRequest<{ product: Product }>('/api/catalog/products', {
        method: 'POST',
        body: JSON.stringify(product)
      });
      setProducts(prev => [result.product, ...prev.filter(item => item.id !== result.product.id)]);
      try {
        await syncSeoDraft('product', result.product.id, result.product.seo);
      } catch (seoError) {
        console.error('Product SEO sync failed:', seoError);
      }
      showToast(\`قطعه \${result.product.nameFa} با موفقیت ثبت شد.\`);
      return true;
    } catch (error) {
      console.error(error);
      showToast('ثبت محصول در پایگاه داده انجام نشد.', 'error');
      return false;
    }
  };

  const updateProduct = async (updated: Product): Promise<boolean> => {
    try {
      const result = await apiRequest<{ product: Product }>(\`/api/catalog/products/\${encodeURIComponent(updated.id)}\`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      setProducts(prev => prev.map(p => p.id === result.product.id ? result.product : p));
      try {
        await syncSeoDraft('product', result.product.id, result.product.seo);
      } catch (seoError) {
        console.error('Product SEO sync failed:', seoError);
      }
      showToast(\`محصول \${result.product.nameFa} با موفقیت ویرایش شد.\`);
      return true;
    } catch (error) {
      console.error(error);
      showToast('ویرایش محصول در پایگاه داده انجام نشد.', 'error');
      return false;
    }
  };`,
    'product awaited saves'
  );

  source = replaceBetween(
    source,
    '  const addArticle = (art: Article) => {',
    '\n\n  const deleteArticle = (id: string) => {',
`  const addArticle = async (art: Article): Promise<boolean> => {
    try {
      const { article } = await apiRequest<{ article: Article }>('/api/cms/articles', {
        method: 'POST',
        body: JSON.stringify(art)
      });
      setArticles(prev => [article, ...prev.filter(item => item.id !== article.id)]);
      try {
        await syncSeoDraft('article', article.id, article.seo);
      } catch (seoError) {
        console.error('Article SEO sync failed:', seoError);
      }
      showToast(\`مقاله "\${article.title}" با موفقیت منتشر گردید.\`);
      return true;
    } catch (error) {
      console.error(error);
      showToast('انتشار مقاله انجام نشد.', 'error');
      return false;
    }
  };

  const updateArticle = async (art: Article): Promise<boolean> => {
    try {
      const { article } = await apiRequest<{ article: Article }>(\`/api/cms/articles/\${encodeURIComponent(art.id)}\`, {
        method: 'PUT',
        body: JSON.stringify(art)
      });
      setArticles(prev => prev.map(item => item.id === article.id ? article : item));
      try {
        await syncSeoDraft('article', article.id, article.seo);
      } catch (seoError) {
        console.error('Article SEO sync failed:', seoError);
      }
      showToast(\`مقاله "\${article.title}" به‌روزرسانی شد.\`);
      return true;
    } catch (error) {
      console.error(error);
      showToast('ویرایش مقاله انجام نشد.', 'error');
      return false;
    }
  };`,
    'article awaited saves'
  );

  const pageStart = '  const updatePage = (updatedPage: SitePage) => {';
  if (source.includes(pageStart)) {
    source = replaceBetween(
      source,
      pageStart,
      '\n\n  const setFontSize = ',
`  const updatePage = (updatedPage: SitePage): Promise<boolean> =>
    persistPage(updatedPage, \`برگه "\${updatedPage.title}" با موفقیت ذخیره شد.\`);

  const deletePage = (pageId: string) => {
    const target = pages.find(page => page.id === pageId);
    if (!target) return;
    if (target.isSystem) {
      showToast('برگه‌های اصلی سیستمی غیرقابل حذف هستند.', 'error');
      return;
    }

    void apiRequest<{ ok: boolean }>(\`/api/cms/pages/\${encodeURIComponent(pageId)}\`, {
      method: 'DELETE'
    }).then(() => {
      setPages(prev => prev.filter(page => page.id !== pageId));
      showToast(\`برگه "\${target.title}" با موفقیت حذف شد.\`, 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف برگه انجام نشد.', 'error');
    });
  };

  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) {
      showToast('برگه برای ذخیره پیدا نشد.', 'error');
      return false;
    }
    return persistPage({
      ...page,
      sections: page.sections.map(section => section.id === updatedSection.id ? updatedSection : section)
    }, \`بخش "\${updatedSection.title}" با موفقیت به‌روزرسانی شد.\`);
  };

  const previewSection = (pageSlug: string, sectionPreview: PageSection) => {
    setPages(prev => prev.map(page => {
      if (page.slug !== pageSlug) return page;
      const exists = page.sections.some(section => section.id === sectionPreview.id);
      return {
        ...page,
        sections: exists
          ? page.sections.map(section => section.id === sectionPreview.id ? { ...sectionPreview } : section)
          : [...page.sections, { ...sectionPreview }]
      };
    }));
  };

  const discardSectionPreview = (pageSlug: string, sectionId: string) => {
    setPages(prev => prev.map(page => page.slug === pageSlug
      ? { ...page, sections: page.sections.filter(section => section.id !== sectionId) }
      : page));
  };

  const addSection = async (pageSlug: string, newSection: PageSection): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) {
      showToast('برگه برای افزودن سکشن پیدا نشد.', 'error');
      return false;
    }
    const exists = page.sections.some(section => section.id === newSection.id);
    const sections = exists
      ? page.sections.map(section => section.id === newSection.id ? newSection : section)
      : [...page.sections, newSection];
    return persistPage({ ...page, sections }, 'بخش جدید با موفقیت اضافه شد.');
  };

  const deleteSection = async (pageSlug: string, sectionId: string): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) {
      showToast('برگه برای حذف سکشن پیدا نشد.', 'error');
      return false;
    }
    return persistPage({
      ...page,
      sections: page.sections.filter(section => section.id !== sectionId)
    }, 'بخش با موفقیت حذف شد.');
  };

  const setFontSize = `,
      'awaited page/section saves'
    );
  }

  source = source.replace(
    "      showToast('ذخیره برگه در سرور انجام نشد؛ اتصال و دسترسی مدیر را بررسی کنید.', 'error');",
    "      showToast(error instanceof ApiError && error.code === 'CMS_PAGE_REVISION_CONFLICT' ? 'این برگه هم‌زمان در جای دیگری تغییر کرده است. صفحه را تازه‌سازی کنید و تغییرات را دوباره اعمال کنید.' : 'ذخیره برگه در سرور انجام نشد؛ اتصال و دسترسی مدیر را بررسی کنید.', 'error');"
  );

  if (!source.includes('discardSectionPreview,')) {
    source = source.replace('      previewSection,\n      addSection,', '      previewSection,\n      discardSectionPreview,\n      addSection,');
  }

  return source;
});

edit('src/server/routes/cms.ts', source => {
  source = source.replace(
    "import { pool, type ResultSetHeader, type RowDataPacket } from '../db';",
    "import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';"
  );

  if (!source.includes('const normalizePageForSave')) {
    source = source.replace(
      'const asJson = (value: unknown) => JSON.stringify(value ?? null);\n',
`const asJson = (value: unknown) => JSON.stringify(value ?? null);

const normalizePageForSave = (input: any) => {
  const page = { ...input };
  page.id = String(page.id || '').trim();
  page.slug = String(page.slug || '').trim();
  page.title = String(page.title || '').trim();
  page.description = String(page.description || '');
  const seen = new Set<string>();
  page.sections = (Array.isArray(page.sections) ? page.sections : [])
    .map((section: any, index: number) => {
      const id = String(section?.id || '').trim();
      if (!id || seen.has(id)) throw Object.assign(new Error('PAGE_SECTION_ID_INVALID'), { code: 'PAGE_SECTION_ID_INVALID' });
      seen.add(id);
      return { ...section, id, order: index + 1 };
    });
  return page;
};
`
    );
  }

  source = replaceBetween(
    source,
    "cmsRouter.put('/pages/:id'",
    "\n\ncmsRouter.delete('/pages/:id'",
`cmsRouter.put('/pages/:id', requireAdminPermission('canManageSettings'), async (req, res) => {
  let page: any;
  try {
    page = normalizePageForSave({ ...req.body, id: String(req.params.id) });
  } catch (error: any) {
    res.status(400).json({ error: error?.code || 'PAGE_DATA_INVALID' });
    return;
  }
  if (!page.id || !page.slug || !page.title) {
    res.status(400).json({ error: 'PAGE_DATA_INVALID' });
    return;
  }

  try {
    const result = await withTransaction(async tx => {
      const [rows] = await tx.query<JsonRow[]>(
        'SELECT id, data_json FROM site_pages WHERE id = ? FOR UPDATE',
        [page.id]
      );
      const existing = rows[0] ? parseJson<any>(rows[0].data_json, {}) : null;
      const currentRevision = Math.max(0, Number(existing?.cmsRevision || 0));
      const incomingRevision = Math.max(0, Number(page.cmsRevision || 0));
      if (existing && incomingRevision !== currentRevision) {
        return { conflict: true, currentPage: { ...existing, id: page.id, cmsRevision: currentRevision } };
      }
      if (!existing && incomingRevision > 0) {
        return { conflict: true, currentPage: null };
      }

      const saved = {
        ...page,
        cmsRevision: currentRevision + 1,
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        await tx.execute(
          `UPDATE site_pages
           SET slug = ?, title = ?, is_system = ?, data_json = ?, updated_at = NOW()
           WHERE id = ?`,
          [saved.slug, saved.title, saved.isSystem ? 1 : 0, asJson(saved), saved.id]
        );
      } else {
        await tx.execute(
          `INSERT INTO site_pages (id, slug, title, is_system, data_json)
           VALUES (?, ?, ?, ?, ?)`,
          [saved.id, saved.slug, saved.title, saved.isSystem ? 1 : 0, asJson(saved)]
        );
      }
      return { conflict: false, page: saved };
    });

    if (result.conflict) {
      res.status(409).json({ error: 'CMS_PAGE_REVISION_CONFLICT', currentPage: result.currentPage });
      return;
    }
    res.json({ page: result.page });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PAGE_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});`,
    'revision-safe CMS page route'
  );
  return source;
});

edit('src/components/common/LiveSectionModal.tsx', source => {
  source = source.replace(
    "import React, { useEffect, useRef, useState } from 'react';",
    "import React, { useEffect, useRef, useState } from 'react';"
  );
  if (!source.includes("useEditorGuard")) {
    source = source.replace(
      "import { LinkDestinationPicker } from './LinkDestinationPicker';",
      "import { LinkDestinationPicker } from './LinkDestinationPicker';\nimport { editorSnapshot, useDialogFocusTrap, useUnsavedChangesGuard } from '../../hooks/useEditorGuard';"
    );
  }
  source = source.replace(
`interface LiveSectionModalProps {
  pageSlug: string;
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
}`,
`interface LiveSectionModalProps {
  pageSlug: string;
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'edit' | 'create';
  initialSection?: PageSection;
}`
  );
  source = source.replace(
`export const LiveSectionModal: React.FC<LiveSectionModalProps> = ({
  pageSlug,
  sectionId,
  isOpen,
  onClose
}) => {`,
`export const LiveSectionModal: React.FC<LiveSectionModalProps> = ({
  pageSlug,
  sectionId,
  isOpen,
  onClose,
  mode = 'edit',
  initialSection
}) => {`
  );
  source = source.replace(
`    previewSection,
    updateSection,
    deleteSection,
    showToast`,
`    previewSection,
    discardSectionPreview,
    updateSection,
    addSection,
    deleteSection,
    showToast`
  );
  source = source.replace(
    '  const liveSection = page?.sections.find(section => section.id === sectionId);',
    '  const liveSection = page?.sections.find(section => section.id === sectionId);\n  const sourceSection = liveSection || initialSection;'
  );
  source = source.replace(
`  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });
  const modalDragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const originalRef = useRef<PageSection | null>(null);
  const activeKeyRef = useRef('');`,
`  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalDragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const originalRef = useRef<PageSection | null>(null);
  const initialRef = useRef<PageSection | null>(null);
  const didPreviewRef = useRef(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const activeKeyRef = useRef('');`
  );
  source = source.replace(
`    if (!isOpen || !liveSection) return;
    const key = \`${'${pageSlug}:${sectionId}'}\`;
    if (activeKeyRef.current === key && form) return;
    const snapshot = JSON.parse(JSON.stringify(liveSection)) as PageSection;
    originalRef.current = snapshot;
    activeKeyRef.current = key;
    setForm(snapshot);`,
`    if (!isOpen || !sourceSection) return;
    const key = \`${'${pageSlug}:${sectionId}:${mode}'}\`;
    if (activeKeyRef.current === key && form) return;
    const snapshot = JSON.parse(JSON.stringify(sourceSection)) as PageSection;
    initialRef.current = snapshot;
    originalRef.current = mode === 'edit' ? snapshot : null;
    didPreviewRef.current = false;
    activeKeyRef.current = key;
    setForm(snapshot);`
  );
  source = source.replace(
    '  }, [isOpen, pageSlug, sectionId, liveSection?.id]);',
    '  }, [isOpen, pageSlug, sectionId, sourceSection?.id, mode]);'
  );
  source = source.replace(
`      originalRef.current = null;
      setForm(null);`,
`      originalRef.current = null;
      initialRef.current = null;
      didPreviewRef.current = false;
      setForm(null);`
  );

  const escapeEffect = `  useEffect(() => {\n    if (!isOpen) return;\n    const onKeyDown = (event: KeyboardEvent) => {\n      if (event.key === 'Escape') onClose();\n    };\n    window.addEventListener('keydown', onKeyDown);\n    return () => window.removeEventListener('keydown', onKeyDown);\n  }, [isOpen, onClose]);\n\n`;
  source = source.replace(escapeEffect, '');

  source = source.replace(
`  if (!isOpen || !form) return null;

  const onModalPointerDown`,
`  const dirty = Boolean(form && initialRef.current && editorSnapshot(form) !== editorSnapshot(initialRef.current));
  const confirmDiscard = useUnsavedChangesGuard(isOpen && dirty);
  const rollbackAndClose = () => {
    if (mode === 'create') {
      if (didPreviewRef.current) discardSectionPreview(pageSlug, sectionId);
    } else if (originalRef.current) {
      previewSection(pageSlug, originalRef.current);
    }
    onClose();
  };
  const requestClose = () => {
    if (isSaving || isDeleting) return;
    if (!confirmDiscard()) return;
    rollbackAndClose();
  };
  useDialogFocusTrap(isOpen, dialogRef, requestClose);

  if (!isOpen || !form) return null;

  const onModalPointerDown`
  );
  source = source.replace(
`  const apply = (next: PageSection) => {
    setForm(next);
    previewSection(pageSlug, next);
  };`,
`  const apply = (next: PageSection) => {
    setForm(next);
    didPreviewRef.current = true;
    previewSection(pageSlug, next);
  };`
  );
  source = source.replace(
`  const cancel = () => {
    if (originalRef.current) previewSection(pageSlug, originalRef.current);
    onClose();
  };

  const save = async () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    const saved = await updateSection(pageSlug, form);
    if (!saved) return;
    originalRef.current = JSON.parse(JSON.stringify(form));
    onClose();
  };

  const deleteCurrent = () => {
    if (!window.confirm(\`سکشن «\${form.title || 'انتخاب‌شده'}» حذف شود؟\`)) return;
    deleteSection(pageSlug, form.id);
    originalRef.current = null;
    onClose();
  };`,
`  const cancel = requestClose;

  const save = async () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = mode === 'create'
        ? await addSection(pageSlug, form)
        : await updateSection(pageSlug, form);
      if (!saved) return;
      originalRef.current = JSON.parse(JSON.stringify(form));
      initialRef.current = JSON.parse(JSON.stringify(form));
      didPreviewRef.current = false;
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCurrent = async () => {
    if (mode === 'create' || isDeleting) return;
    if (!window.confirm(\`سکشن «\${form.title || 'انتخاب‌شده'}» حذف شود؟\`)) return;
    setIsDeleting(true);
    try {
      const deleted = await deleteSection(pageSlug, form.id);
      if (!deleted) return;
      originalRef.current = null;
      initialRef.current = null;
      didPreviewRef.current = false;
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };`
  );
  source = source.replace(
    '    if ((event.target as HTMLElement).closest(\'button\')) return;',
    "    if (window.matchMedia('(max-width: 767px)').matches || (event.target as HTMLElement).closest('button')) return;"
  );
  source = source.replace(
`      <aside
        role="dialog"`,
`      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"`
  );
  source = source.replace(
    '        className="fixed z-[500] left-1/2 top-1/2 w-[min(580px,96vw)] max-h-[min(92dvh,900px)] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col text-right overflow-hidden"',
    '        className="fixed z-[500] left-1/2 top-1/2 w-[min(580px,96vw)] max-h-[min(92dvh,900px)] max-md:w-screen max-md:h-[100dvh] max-md:max-h-none max-md:rounded-none bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col text-right overflow-hidden"'
  );
  source = source.replace(
    '        style={{ transform: `translate(calc(-50% + ${modalOffset.x}px), calc(-50% + ${modalOffset.y}px))` }}',
    "        style={{ transform: window.matchMedia('(max-width: 767px)').matches ? 'translate(-50%, -50%)' : `translate(calc(-50% + ${modalOffset.x}px), calc(-50% + ${modalOffset.y}px))` }}"
  );
  source = source.replace(
`        {!isBannerSection && <>
        <button type="button" onClick={deleteCurrent} className="grid place-items-center rounded-xl bg-red-50 text-red-600" title="حذف سکشن"><Trash2 className="w-4 h-4" /></button>
        </>}
        <button type="button" onClick={cancel} className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold">لغو و بازگردانی</button>
        {!isBannerSection && <button type="button" onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1"><Save className="w-4 h-4" /> ذخیره</button>}`,
`        {!isBannerSection && mode === 'edit' && <>
        <button type="button" disabled={isDeleting || isSaving} onClick={deleteCurrent} className="grid place-items-center rounded-xl bg-red-50 text-red-600 disabled:opacity-40" title="حذف سکشن"><Trash2 className="w-4 h-4" /></button>
        </>}
        <button type="button" disabled={isDeleting || isSaving} onClick={cancel} className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold disabled:opacity-40">لغو و بازگردانی</button>
        {!isBannerSection && <button type="button" disabled={isDeleting || isSaving} onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-50"><Save className="w-4 h-4" /> {isSaving ? 'در حال ذخیره…' : mode === 'create' ? 'ایجاد سکشن' : 'ذخیره'}</button>}`
  );
  return source;
});

edit('src/components/admin/AdminPagesTab.tsx', source => {
  if (!source.includes("LiveSectionModal")) {
    source = source.replace(
      "import { ImageUploadInput } from '../common/ImageUploadInput';",
      "import { ImageUploadInput } from '../common/ImageUploadInput';\nimport { LiveSectionModal } from '../common/LiveSectionModal';"
    );
  }
  source = source.replace('  MonitorCheck\n} from \'lucide-react\';', '  MonitorCheck,\n  GripVertical\n} from \'lucide-react\';');
  if (!source.includes('dragSectionId')) {
    source = source.replace(
      "  const [editingPageMeta, setEditingPageMeta] = useState<SitePage | null>(null);",
      "  const [editingPageMeta, setEditingPageMeta] = useState<SitePage | null>(null);\n  const [dragSectionId, setDragSectionId] = useState<string | null>(null);"
    );
  }
  source = source.replace(
    '  const handleSaveSection = (e: React.FormEvent) => {',
    '  const handleSaveSection = async (e: React.FormEvent) => {'
  );
  source = source.replace(
`    if (editingSection) {
      updateSection(selectedPage.slug, sectionForm);
    } else {
      addSection(selectedPage.slug, sectionForm);
    }
    setIsSectionModalOpen(false);`,
`    const saved = editingSection
      ? await updateSection(selectedPage.slug, sectionForm)
      : await addSection(selectedPage.slug, sectionForm);
    if (saved) setIsSectionModalOpen(false);`
  );
  source = source.replace(
    '  const handleMoveOrder = (sectionId: string, direction: \'up\' | \'down\') => {',
    '  const handleMoveOrder = async (sectionId: string, direction: \'up\' | \'down\') => {'
  );
  source = source.replace(
`    updatePage({
      ...selectedPage,
      sections: sorted
    });
  };`,
`    await updatePage({
      ...selectedPage,
      sections: sorted.map((section, order) => ({ ...section, order: order + 1 }))
    });
  };

  const handleDropSection = async (targetId: string) => {
    if (!selectedPage || !dragSectionId || dragSectionId === targetId) return;
    const sorted = [...selectedPage.sections].sort((a, b) => a.order - b.order);
    const from = sorted.findIndex(section => section.id === dragSectionId);
    const to = sorted.findIndex(section => section.id === targetId);
    setDragSectionId(null);
    if (from < 0 || to < 0) return;
    const [moved] = sorted.splice(from, 1);
    sorted.splice(to, 0, moved);
    await updatePage({
      ...selectedPage,
      sections: sorted.map((section, order) => ({ ...section, order: order + 1 }))
    });
  };`
  );
  source = source.replace(
    '  const handleCreatePage = (e: React.FormEvent) => {',
    '  const handleCreatePage = async (e: React.FormEvent) => {'
  );
  source = source.replace(
`    updatePage(newPage);
    setSelectedPageId(newPage.id);
    setIsNewPageModalOpen(false);
    setNewPageForm({ title: '', slug: '', description: '', seo: undefined });`,
`    const saved = await updatePage(newPage);
    if (!saved) return;
    setSelectedPageId(newPage.id);
    setIsNewPageModalOpen(false);
    setNewPageForm({ title: '', slug: '', description: '', seo: undefined });`
  );
  source = source.replace(
    '{selectedPage.sections.sort((a, b) => a.order - b.order).map((section, idx) => (',
    '{[...selectedPage.sections].sort((a, b) => a.order - b.order).map((section, idx, sortedSections) => ('
  );
  source = source.replace(
`              <div 
                key={section.id} 
                className={\`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 \${`,
`              <div 
                key={section.id}
                draggable
                onDragStart={() => setDragSectionId(section.id)}
                onDragEnd={() => setDragSectionId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => void handleDropSection(section.id)}
                className={\`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 \${`
  );
  source = source.replace(
`                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg`,
`                <div className="flex items-start gap-3.5">
                  <GripVertical className="w-4 h-4 text-neutral-300 mt-2 cursor-grab shrink-0" aria-hidden="true" />
                  <div className="w-7 h-7 rounded-lg`
  );
  source = source.replace('disabled={idx === selectedPage.sections.length - 1}', 'disabled={idx === sortedSections.length - 1}');

  const oldModalOpen = '      {isSectionModalOpen && (';
  if (source.includes(oldModalOpen) && !source.includes('false && isSectionModalOpen')) {
    source = source.replace(oldModalOpen, '      {false && isSectionModalOpen && (');
  }
  if (!source.includes('mode={editingSection ? \'edit\' : \'create\'}')) {
    source = source.replace(
      '\n    </div>\n  );\n};',
`      {isSectionModalOpen && selectedPage && (
        <LiveSectionModal
          pageSlug={selectedPage.slug}
          sectionId={editingSection?.id || sectionForm.id}
          initialSection={editingSection ? undefined : sectionForm}
          mode={editingSection ? 'edit' : 'create'}
          isOpen={isSectionModalOpen}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingSection(null);
          }}
        />
      )}

    </div>
  );
};`
    );
  }
  return source;
});

edit('src/components/admin/AdminArticlesTab.tsx', source => {
  if (!source.includes('useEditorGuard')) {
    source = source.replace(
      "import React, { useEffect, useState } from 'react';",
      "import React, { useEffect, useRef, useState } from 'react';"
    );
    source = source.replace(
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';",
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';\nimport { editorSnapshot, useDialogFocusTrap, useUnsavedChangesGuard } from '../../hooks/useEditorGuard';"
    );
  }
  if (!source.includes('articleBaselineRef')) {
    source = source.replace(
      '  const [editingArticle, setEditingArticle] = useState<Article | null>(null);',
      '  const [editingArticle, setEditingArticle] = useState<Article | null>(null);\n  const [isArticleSaving, setIsArticleSaving] = useState(false);\n  const articleBaselineRef = useRef<string>(\'\');\n  const articleDialogRef = useRef<HTMLDivElement | null>(null);'
    );
  }
  source = source.replace(
    '      setArticleForm({ ...article });\n      setIsModalOpen(true);',
    '      setArticleForm({ ...article });\n      articleBaselineRef.current = editorSnapshot(article);\n      setIsModalOpen(true);'
  );
  source = source.replace(
    '    setArticleForm({\n      title:',
    '    const draft = {\n      title:'
  );
  source = source.replace(
    "      ]\n    });\n    setIsModalOpen(true);\n  };\n\n  const handleEdit = (art: Article) => {",
    "      ]\n    };\n    setArticleForm(draft);\n    articleBaselineRef.current = editorSnapshot(draft);\n    setIsModalOpen(true);\n  };\n\n  const handleEdit = (art: Article) => {"
  );
  source = source.replace(
`  const handleEdit = (art: Article) => {
    setEditingArticle(art);
    setArticleForm(art);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {`,
`  const handleEdit = (art: Article) => {
    setEditingArticle(art);
    setArticleForm({ ...art });
    articleBaselineRef.current = editorSnapshot(art);
    setIsModalOpen(true);
  };

  const articleDirty = isModalOpen && editorSnapshot(articleForm) !== articleBaselineRef.current;
  const confirmArticleDiscard = useUnsavedChangesGuard(articleDirty);
  const closeArticleEditor = () => {
    if (isArticleSaving || !confirmArticleDiscard()) return;
    setIsModalOpen(false);
  };
  useDialogFocusTrap(isModalOpen, articleDialogRef, closeArticleEditor);

  const handleSave = async (e: React.FormEvent) => {`
  );
  source = source.replace(
`    if (editingArticle) {
      updateArticle({
        ...editingArticle,
        ...articleForm as Article,
        category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
        categoryId: matchedCat ? matchedCat.id : articleForm.categoryId,
        slug: generatedSlug || editingArticle.slug
      });
    } else {
      const newArticle: Article = {`,
`    setIsArticleSaving(true);
    let saved = false;
    if (editingArticle) {
      saved = await updateArticle({
        ...editingArticle,
        ...articleForm as Article,
        category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
        categoryId: matchedCat ? matchedCat.id : articleForm.categoryId,
        slug: generatedSlug || editingArticle.slug
      });
    } else {
      const newArticle: Article = {`
  );
  source = source.replace(
`      addArticle(newArticle);
    }
    setIsModalOpen(false);`,
`      saved = await addArticle(newArticle);
    }
    setIsArticleSaving(false);
    if (!saved) return;
    articleBaselineRef.current = editorSnapshot(articleForm);
    setIsModalOpen(false);`
  );
  source = source.replace(
    '<div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">',
    '<div ref={articleDialogRef} tabIndex={-1} role="dialog" aria-modal="true" className="bg-white rounded-3xl max-md:rounded-none p-4 sm:p-8 max-w-3xl max-md:max-w-none w-full max-h-[90vh] max-md:h-[100dvh] max-md:max-h-none overflow-y-auto space-y-4 text-right shadow-2xl">'
  );
  source = source.replace('<button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>', '<button type="button" onClick={closeArticleEditor} className="text-neutral-400 hover:text-neutral-700">✕</button>');
  source = source.replace('onClick={() => setIsModalOpen(false)}\n                  className="flex-1 py-2.5 bg-neutral-100', 'onClick={closeArticleEditor}\n                  disabled={isArticleSaving}\n                  className="flex-1 py-2.5 bg-neutral-100');
  source = source.replace(
`                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {editingArticle ? 'ذخیره تغییرات مقاله' : 'انتشار مقاله'}
                </button>`,
`                <button
                  type="submit"
                  disabled={isArticleSaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isArticleSaving ? 'در حال ذخیره…' : editingArticle ? 'ذخیره تغییرات مقاله' : 'انتشار مقاله'}
                </button>`
  );
  return source;
});

edit('src/components/admin/AdminView.tsx', source => {
  if (!source.includes('useEditorGuard')) {
    source = source.replace(
      "import React, { useEffect, useState } from 'react';",
      "import React, { useEffect, useRef, useState } from 'react';"
    );
    source = source.replace(
      "import { AdminDashboardPro } from './AdminDashboardPro';",
      "import { AdminDashboardPro } from './AdminDashboardPro';\nimport { editorSnapshot, useDialogFocusTrap, useUnsavedChangesGuard } from '../../hooks/useEditorGuard';"
    );
  }
  if (!source.includes('productBaselineRef')) {
    source = source.replace(
      '  const [editingProduct, setEditingProduct] = useState<Product | null>(null);',
      '  const [editingProduct, setEditingProduct] = useState<Product | null>(null);\n  const [isProductSaving, setIsProductSaving] = useState(false);\n  const productBaselineRef = useRef<string>(\'\');\n  const productDialogRef = useRef<HTMLDivElement | null>(null);'
    );
  }
  source = source.replace(
    '  const handleSaveProduct = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!editingProduct) return;\n    updateProduct(editingProduct);\n    setEditingProduct(null);\n  };',
`  const productDirty = Boolean(editingProduct && editorSnapshot(editingProduct) !== productBaselineRef.current);
  const confirmProductDiscard = useUnsavedChangesGuard(productDirty);
  const closeProductEditor = () => {
    if (isProductSaving || !confirmProductDiscard()) return;
    setEditingProduct(null);
  };
  useDialogFocusTrap(Boolean(editingProduct), productDialogRef, closeProductEditor);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isProductSaving) return;
    setIsProductSaving(true);
    try {
      const saved = await updateProduct(editingProduct);
      if (!saved) return;
      productBaselineRef.current = editorSnapshot(editingProduct);
      setEditingProduct(null);
    } finally {
      setIsProductSaving(false);
    }
  };`
  );
  source = source.replace(
    '    addProduct(newProd);\n    setIsNewProductModalOpen(false);',
    '    void addProduct(newProd).then(saved => { if (saved) setIsNewProductModalOpen(false); });'
  );
  source = source.replace(
    'onClick={() => setEditingProduct(p)}',
    'onClick={() => { productBaselineRef.current = editorSnapshot(p); setEditingProduct({ ...p }); }}'
  );
  source = source.replace(
    '<div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto space-y-4 text-right shadow-2xl">',
    '<div ref={productDialogRef} tabIndex={-1} role="dialog" aria-modal="true" className="bg-white rounded-3xl max-md:rounded-none p-4 sm:p-8 max-w-5xl max-md:max-w-none w-full max-h-[calc(100vh-3rem)] max-md:h-[100dvh] max-md:max-h-none overflow-y-auto space-y-4 text-right shadow-2xl">'
  );
  source = source.replace('<button onClick={() => setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-700">✕</button>', '<button type="button" onClick={closeProductEditor} className="text-neutral-400 hover:text-neutral-700">✕</button>');
  source = source.replace('onClick={() => setEditingProduct(null)}\n                  className="flex-1 py-2.5 bg-neutral-100', 'onClick={closeProductEditor}\n                  disabled={isProductSaving}\n                  className="flex-1 py-2.5 bg-neutral-100');
  source = source.replace(
    'type="submit"\n                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"',
    'type="submit"\n                  disabled={isProductSaving}\n                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"'
  );
  source = source.replace('ذخیره تغییرات محصول', "{isProductSaving ? 'در حال ذخیره…' : 'ذخیره تغییرات محصول'}");
  return source;
});

console.log('v30.10.3 CMS/editor stability patch:', changed.length ? changed.join(', ') : 'already satisfied');
