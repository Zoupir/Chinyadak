import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`v30.9.2 target missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

// ---------------------------------------------------------------------------
// 1) Product/article persistence must be awaitable and authoritative.
//    Product saves also migrate/clear the legacy discountPrice field so an old
//    sale price cannot continue to override a newly edited base price.
// ---------------------------------------------------------------------------
edit('src/context/StoreContext.tsx', source => {
  source = source.replace(
    '  updateProduct: (updated: Product) => void;',
    '  updateProduct: (updated: Product) => Promise<Product | null>;'
  );
  source = source.replace(
    '  updateArticle: (art: Article) => void;',
    '  updateArticle: (art: Article) => Promise<Article | null>;'
  );

  if (!source.includes('data-v3092-product-save')) {
    const productPattern = /  const updateProduct = \(updated: Product\) => \{[\s\S]*?\n  \};\n\n  const deleteProduct =/;
    if (!productPattern.test(source)) throw new Error('v30.9.2 updateProduct block not found');
    source = source.replace(productPattern, `  // data-v3092-product-save: authoritative async product persistence\n  const updateProduct = async (updated: Product): Promise<Product | null> => {\n    const basePrice = Math.max(0, Number(updated.price || 0));\n    const legacyDiscountPrice = Math.max(0, Number(updated.discountPrice || 0));\n    const hadLegacyDiscount = !updated.discountMode && legacyDiscountPrice > 0 && legacyDiscountPrice < basePrice;\n    const discountMode: NonNullable<Product['discountMode']> = updated.discountMode || (hadLegacyDiscount ? 'fixed' : 'none');\n    const discountValue = discountMode === 'none'\n      ? 0\n      : hadLegacyDiscount\n        ? Math.max(0, basePrice - legacyDiscountPrice)\n        : Math.max(0, Number(updated.discountValue || 0));\n\n    const normalized: Product = {\n      ...updated,\n      price: basePrice,\n      stock: Math.max(0, Math.round(Number(updated.stock || 0))),\n      discountMode,\n      discountValue,\n      // Explicitly clear the obsolete fixed sale price. The modern pricing\n      // fields above are now the single source of truth. Sending zero matters:\n      // omitting the property could leave the old DB value intact on merge.\n      discountPrice: 0\n    };\n\n    try {\n      const { product: saved } = await apiRequest<{ product: Product }>(\`/api/catalog/products/\${encodeURIComponent(updated.id)}\`, {\n        method: 'PUT',\n        body: JSON.stringify(normalized)\n      });\n      setProducts(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        return exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n      });\n      try {\n        await syncSeoDraft('product', saved.id, saved.seo);\n      } catch (seoError) {\n        console.error('Product SEO sync failed:', seoError);\n      }\n      showToast(\`محصول «\${saved.nameFa}» با موفقیت ذخیره شد.\`);\n      return saved;\n    } catch (error) {\n      console.error(error);\n      showToast('ذخیره تغییرات محصول روی سرور انجام نشد.', 'error');\n      return null;\n    }\n  };\n\n  const deleteProduct =`);
  }

  if (!source.includes('data-v3092-article-save')) {
    const articlePattern = /  const updateArticle = \(art: Article\) => \{[\s\S]*?\n  \};\n\n  const deleteArticle =/;
    if (!articlePattern.test(source)) throw new Error('v30.9.2 updateArticle block not found');
    source = source.replace(articlePattern, `  // data-v3092-article-save: authoritative async article persistence\n  const updateArticle = async (art: Article): Promise<Article | null> => {\n    try {\n      const { article: saved } = await apiRequest<{ article: Article }>(\`/api/cms/articles/\${encodeURIComponent(art.id)}\`, {\n        method: 'PUT',\n        body: JSON.stringify(art)\n      });\n      setArticles(prev => {\n        const exists = prev.some(item => item.id === saved.id);\n        return exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];\n      });\n      try {\n        await syncSeoDraft('article', saved.id, saved.seo);\n      } catch (seoError) {\n        console.error('Article SEO sync failed:', seoError);\n      }\n      showToast(\`مقاله «\${saved.title}» با موفقیت ذخیره شد.\`);\n      return saved;\n    } catch (error) {\n      console.error(error);\n      showToast('ذخیره تغییرات مقاله روی سرور انجام نشد.', 'error');\n      return null;\n    }\n  };\n\n  const deleteArticle =`);
  }

  if (!source.includes('Promise<Product | null>') || !source.includes('Promise<Article | null>')) {
    throw new Error('v30.9.2 async persistence contracts incomplete');
  }
  return source;
});

// Do not allow an explicit modern "none" discount to fall back to stale legacy
// discountPrice data. Legacy fallback is only for records not migrated yet.
edit('src/utils/pricing.ts', source => {
  if (!source.includes('const hasExplicitDiscountMode = product.discountMode !== undefined')) {
    source = replaceOnce(
      source,
      `  const mode = product.discountMode || 'none';`,
      `  const hasExplicitDiscountMode = product.discountMode !== undefined && product.discountMode !== null;\n  const mode = product.discountMode || 'none';`,
      'explicit discount mode guard'
    );
  }
  source = source.replace(
    `  if (legacy > 0 && legacy < basePrice) {`,
    `  if (!hasExplicitDiscountMode && legacy > 0 && legacy < basePrice) {`
  );
  if (!source.includes('!hasExplicitDiscountMode && legacy > 0')) {
    throw new Error('v30.9.2 pricing legacy guard incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 2) Product editing: open in a real browser tab/page, never re-open from stale
//    route effects after save, and keep the editor state synced to the server
//    response. Existing product: deep links remain supported.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminView.tsx', source => {
  source = source.replace(
    `import React, { useEffect, useState } from 'react';`,
    `import React, { useEffect, useRef, useState } from 'react';`
  );

  const componentNeedle = `export const AdminView: React.FC<AdminViewProps> = ({ initialTarget, onExitToStore, onNavigate }) => {\n  const {`;
  if (!source.includes('const standaloneProductTarget =')) {
    source = replaceOnce(source, componentNeedle, `export const AdminView: React.FC<AdminViewProps> = ({ initialTarget, onExitToStore, onNavigate }) => {\n  const standaloneProductTarget = initialTarget?.startsWith('product-edit/') ? initialTarget.slice('product-edit/'.length) : undefined;\n  const standaloneArticleTarget = initialTarget?.startsWith('article-edit/') ? initialTarget.slice('article-edit/'.length) : undefined;\n  const isStandaloneProductEditor = Boolean(standaloneProductTarget);\n  const isStandaloneArticleEditor = Boolean(standaloneArticleTarget);\n\n  const {`, 'AdminView standalone route state');
  }

  source = source.replace(
    `>(initialTarget?.startsWith('product:') ? 'products' : initialTarget?.startsWith('article:') ? 'articles' : initialTarget?.startsWith('category:') ? 'categories' : initialTarget?.startsWith('page:') ? 'pages' : initialTarget === 'blog' ? 'articles' : 'overview');`,
    `>(initialTarget?.startsWith('product:') || initialTarget?.startsWith('product-edit/') ? 'products' : initialTarget?.startsWith('article:') || initialTarget?.startsWith('article-edit/') ? 'articles' : initialTarget?.startsWith('category:') ? 'categories' : initialTarget?.startsWith('page:') ? 'pages' : initialTarget === 'blog' ? 'articles' : 'overview');`
  );

  const oldProductEffect = `  // Product Modals\n  const [editingProduct, setEditingProduct] = useState<Product | null>(null);\n  useEffect(() => {\n    if (!initialTarget?.startsWith('product:')) return;\n    const targetId = initialTarget.slice('product:'.length);\n    const match = products.find(product => product.id === targetId || product.slug === targetId);\n    if (match) {\n      setActiveTab('products');\n      setEditingProduct(match);\n    }\n  }, [initialTarget, products]);`;
  const newProductEffect = `  // Product editor state. Deep links are handled exactly once per target so a\n  // products[] refresh after save cannot reopen an editor with an old snapshot.\n  const [editingProduct, setEditingProduct] = useState<Product | null>(null);\n  const [isSavingProduct, setIsSavingProduct] = useState(false);\n  const handledProductTargetRef = useRef('');\n  useEffect(() => {\n    const targetId = standaloneProductTarget || (initialTarget?.startsWith('product:') ? initialTarget.slice('product:'.length) : '');\n    if (!targetId) {\n      handledProductTargetRef.current = '';\n      return;\n    }\n    if (handledProductTargetRef.current === targetId) return;\n    const match = products.find(product => product.id === targetId || product.slug === targetId);\n    if (match) {\n      handledProductTargetRef.current = targetId;\n      setActiveTab('products');\n      setEditingProduct({ ...match });\n    }\n  }, [initialTarget, standaloneProductTarget, products]);`;
  if (!source.includes('handledProductTargetRef')) {
    source = replaceOnce(source, oldProductEffect, newProductEffect, 'product editor target effect');
  }

  const oldSave = `  const handleSaveProduct = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!editingProduct) return;\n    updateProduct(editingProduct);\n    setEditingProduct(null);\n  };`;
  const newSave = `  const openProductEditor = (product: Product) => {\n    const url = \`/admin/product-edit/\${encodeURIComponent(product.id)}\`;\n    const opened = window.open(url, '_blank');\n    if (opened) opened.opener = null;\n    else window.location.assign(url);\n  };\n\n  const handleSaveProduct = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!editingProduct || isSavingProduct) return;\n    setIsSavingProduct(true);\n    try {\n      const saved = await updateProduct(editingProduct);\n      if (!saved) return;\n      if (isStandaloneProductEditor) setEditingProduct({ ...saved });\n      else setEditingProduct(null);\n    } finally {\n      setIsSavingProduct(false);\n    }\n  };`;
  if (!source.includes('const openProductEditor =')) {
    source = replaceOnce(source, oldSave, newSave, 'async product save handler');
  }

  source = source.replaceAll(
    `onClick={() => setEditingProduct(p)}`,
    `onClick={() => openProductEditor(p)}`
  );
  source = source.replace(
    `title="ویرایش مشخصات"`,
    `title="ویرایش محصول در تب جدید"`
  );

  // Hide the list in a dedicated product-edit route; the editor shell below is
  // rendered in normal document flow instead of as an overlay modal.
  source = source.replace(
    `{activeTab === 'products' && (`,
    `{activeTab === 'products' && !isStandaloneProductEditor && (`
  );

  source = source.replace(
    `<div className="fixed inset-0 z-[210] flex items-start justify-center px-3 sm:px-4 pt-4 sm:pt-8 pb-8 bg-black/60 backdrop-blur-xs overflow-y-auto">\n          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto space-y-4 text-right shadow-2xl">`,
    `<div className={isStandaloneProductEditor ? 'w-full py-4 sm:py-6' : 'fixed inset-0 z-[210] flex items-start justify-center px-3 sm:px-4 pt-4 sm:pt-8 pb-8 bg-black/60 backdrop-blur-xs overflow-y-auto'} data-product-editor-page={isStandaloneProductEditor ? '1' : undefined}>\n          <div className={isStandaloneProductEditor ? 'bg-white rounded-3xl p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-4 text-right shadow-sm border border-neutral-200' : 'bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto space-y-4 text-right shadow-2xl'}>`
  );
  source = source.replace(
    `<button onClick={() => setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-700">✕</button>`,
    `<button onClick={() => isStandaloneProductEditor ? window.close() : setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-700" title={isStandaloneProductEditor ? 'بستن تب' : 'بستن'}>✕</button>`
  );

  source = source.replace(
    `<button\n                  type="submit"\n                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer"\n                >\n                  ذخیره تغییرات\n                </button>`,
    `<button\n                  type="submit"\n                  disabled={isSavingProduct}\n                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer disabled:opacity-60"\n                >\n                  {isSavingProduct ? 'در حال ذخیره…' : 'ذخیره تغییرات'}\n                </button>`
  );

  source = source.replace(
    `<AdminArticlesTab initialArticleId={initialTarget?.startsWith('article:') ? initialTarget.slice('article:'.length) : undefined} />`,
    `<AdminArticlesTab\n              initialArticleId={standaloneArticleTarget || (initialTarget?.startsWith('article:') ? initialTarget.slice('article:'.length) : undefined)}\n              standaloneEditor={isStandaloneArticleEditor}\n            />`
  );

  if (!source.includes('data-product-editor-page={isStandaloneProductEditor') || !source.includes('openProductEditor(p)')) {
    throw new Error('v30.9.2 product standalone editor patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 3) Article editing gets the same independent-tab workflow and authoritative
//    async save. A products/articles state refresh no longer resets the form.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminArticlesTab.tsx', source => {
  source = source.replace(
    `import React, { useEffect, useState } from 'react';`,
    `import React, { useEffect, useRef, useState } from 'react';`
  );
  source = source.replace(
    `interface AdminArticlesTabProps { initialArticleId?: string; }\n\nexport const AdminArticlesTab: React.FC<AdminArticlesTabProps> = ({ initialArticleId }) => {`,
    `interface AdminArticlesTabProps { initialArticleId?: string; standaloneEditor?: boolean; }\n\nexport const AdminArticlesTab: React.FC<AdminArticlesTabProps> = ({ initialArticleId, standaloneEditor = false }) => {`
  );

  const oldEffect = `  useEffect(() => {\n    if (!initialArticleId) return;\n    const article = articles.find(item => item.id === initialArticleId || item.slug === initialArticleId);\n    if (article) {\n      setActiveSubTab('articles');\n      setEditingArticle(article);\n      setArticleForm({ ...article });\n      setIsModalOpen(true);\n    }\n  }, [initialArticleId, articles]);`;
  const newEffect = `  const handledArticleTargetRef = useRef('');\n  const [isSavingArticle, setIsSavingArticle] = useState(false);\n  useEffect(() => {\n    if (!initialArticleId) {\n      handledArticleTargetRef.current = '';\n      return;\n    }\n    if (handledArticleTargetRef.current === initialArticleId) return;\n    const article = articles.find(item => item.id === initialArticleId || item.slug === initialArticleId);\n    if (article) {\n      handledArticleTargetRef.current = initialArticleId;\n      setActiveSubTab('articles');\n      setEditingArticle(article);\n      setArticleForm({ ...article });\n      setIsModalOpen(true);\n    }\n  }, [initialArticleId, articles]);`;
  if (!source.includes('handledArticleTargetRef')) {
    source = replaceOnce(source, oldEffect, newEffect, 'article target effect');
  }

  const oldEdit = `  const handleEdit = (art: Article) => {\n    setEditingArticle(art);\n    setArticleForm(art);\n    setIsModalOpen(true);\n  };`;
  const newEdit = `  const handleEdit = (art: Article) => {\n    const url = \`/admin/article-edit/\${encodeURIComponent(art.id)}\`;\n    const opened = window.open(url, '_blank');\n    if (opened) opened.opener = null;\n    else window.location.assign(url);\n  };`;
  if (!source.includes('/admin/article-edit/')) {
    source = replaceOnce(source, oldEdit, newEdit, 'article new-tab editor');
  }

  source = source.replace(
    `  const handleSave = (e: React.FormEvent) => {`,
    `  const handleSave = async (e: React.FormEvent) => {`
  );
  source = source.replace(
    `    if (editingArticle) {\n      updateArticle({`,
    `    if (editingArticle) {\n      if (isSavingArticle) return;\n      setIsSavingArticle(true);\n      const saved = await updateArticle({`
  );
  source = source.replace(
    `        slug: generatedSlug || editingArticle.slug\n      });\n    } else {`,
    `        slug: generatedSlug || editingArticle.slug\n      });\n      setIsSavingArticle(false);\n      if (!saved) return;\n      setEditingArticle(saved);\n      setArticleForm({ ...saved });\n      if (!standaloneEditor) setIsModalOpen(false);\n      return;\n    } else {`
  );
  // Only the new-article path should close here; edited articles return above.
  source = source.replace(
    `    }\n    setIsModalOpen(false);\n  };`,
    `    }\n    setIsModalOpen(false);\n  };`
  );

  source = source.replace(
    `<div className="space-y-6 text-right">`,
    `<div className={standaloneEditor ? 'admin-standalone-article-editor space-y-6 text-right' : 'space-y-6 text-right'}>`
  );
  source = source.replace(
    `<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">\n          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">`,
    `<div data-article-editor-shell="1" className={standaloneEditor ? 'relative w-full py-2' : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs'}>\n          <div className={standaloneEditor ? 'bg-white rounded-3xl p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-4 text-right shadow-sm border border-neutral-200' : 'bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl'}>`
  );
  source = source.replace(
    `onClick={() => setIsModalOpen(false)}`,
    `onClick={() => standaloneEditor ? window.close() : setIsModalOpen(false)}`
  );

  // Add saving state to the article submit button without relying on its copy.
  source = source.replace(
    /<button\s+type="submit"\s+className="([^"]*bg-red-600[^"]*)"\s*>\s*<Check className="w-4 h-4" \/>\s*<span>\{editingArticle \? 'ذخیره تغییرات' : 'انتشار مقاله'\}<\/span>\s*<\/button>/,
    `<button type="submit" disabled={isSavingArticle} className="$1 disabled:opacity-60">\n                <Check className="w-4 h-4" />\n                <span>{isSavingArticle ? 'در حال ذخیره…' : (editingArticle ? 'ذخیره تغییرات' : 'انتشار مقاله')}</span>\n              </button>`
  );

  if (!source.includes('data-article-editor-shell="1"') || !source.includes('/admin/article-edit/')) {
    throw new Error('v30.9.2 article standalone editor patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 4) Admin sub-routes preserve their nested path. Direct URLs such as
//    /admin/product-edit/:id and /admin/article-edit/:id now round-trip through
//    History API correctly.
// ---------------------------------------------------------------------------
edit('src/utils/navigation.ts', source => {
  source = source.replace(
    `  if (view === 'admin') return '/admin';`,
    `  if (view === 'admin') return param\n    ? '/admin/' + param.split('/').filter(Boolean).map(encodeURIComponent).join('/')\n    : '/admin';`
  );
  return source;
});

// ---------------------------------------------------------------------------
// 5) Live section editor: saving was intentionally hidden for banner sections,
//    which meant preview changes disappeared after refresh. Every section now
//    has a real save button. Banner sections additionally sync their legacy
//    section/items into the canonical bannerPlacements settings used by the
//    storefront, so the saved result is actually visible.
// ---------------------------------------------------------------------------
edit('src/components/common/LiveSectionModal.tsx', source => {
  if (!source.includes("from '../../utils/bannerPlacements'")) {
    const marker = `import { LinkDestinationPicker } from './LinkDestinationPicker';\n`;
    source = replaceOnce(source, marker, marker + `import { BANNER_PLACEMENT_META, migrateLegacyBannerPlacements, resolveBannerPlacements } from '../../utils/bannerPlacements';\n`, 'banner placement imports');
  }

  source = source.replace(
    `    articles,\n    previewSection,`,
    `    articles,\n    sliders,\n    settings,\n    updateSettings,\n    previewSection,`
  );

  if (!source.includes('const [isSaving, setIsSaving]')) {
    source = source.replace(
      `  const [dragItemId, setDragItemId] = useState<string | null>(null);`,
      `  const [dragItemId, setDragItemId] = useState<string | null>(null);\n  const [isSaving, setIsSaving] = useState(false);`
    );
  }

  const oldSave = `  const save = async () => {\n    if (!form.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    const saved = await updateSection(pageSlug, form);\n    if (!saved) return;\n    originalRef.current = JSON.parse(JSON.stringify(form));\n    onClose();\n  };`;
  const newSave = `  const save = async () => {\n    if (!form.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    if (isSaving) return;\n    setIsSaving(true);\n    try {\n      const saved = await updateSection(pageSlug, form);\n      if (!saved) return;\n\n      // Homepage banner rendering reads settings.bannerPlacements before the\n      // legacy page section. Keep both stores in sync when editing live.\n      const bannerKey = BANNER_PLACEMENT_META.some(item => item.key === form.sectionKey) ? form.sectionKey : undefined;\n      if (bannerKey) {\n        const migrated = migrateLegacyBannerPlacements([form], sliders).find(item => item.key === bannerKey);\n        if (migrated) {\n          const resolved = resolveBannerPlacements(settings.bannerPlacements, page?.sections || [], sliders);\n          const nextPlacements = resolved.map(item => item.key === bannerKey\n            ? { ...item, ...migrated, key: item.key, title: item.title || migrated.title }\n            : item);\n          const settingsSaved = await updateSettings({ bannerPlacements: nextPlacements });\n          if (!settingsSaved) {\n            showToast('خود سکشن ذخیره شد اما همگام‌سازی جایگاه بنر انجام نشد.', 'error');\n            return;\n          }\n        }\n      }\n\n      originalRef.current = JSON.parse(JSON.stringify(form));\n      showToast(\`سکشن «\${form.title}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.\`);\n      onClose();\n    } finally {\n      setIsSaving(false);\n    }\n  };`;
  if (!source.includes('nextPlacements = resolved.map')) {
    source = replaceOnce(source, oldSave, newSave, 'live section save');
  }

  source = source.replace(
    `w-[min(580px,96vw)]`,
    `w-[min(900px,97vw)]`
  );
  source = source.replace(
    `<RichTextEditor label="متن کامل" value={form.content || ''} onChange={value => patch({content:value})} rows={5} />`,
    `<RichTextEditor\n                label="متن کامل سکشن"\n                value={form.content || ''}\n                onChange={value => patch({content:value})}\n                rows={8}\n                helperText="همه ابزارهای قالب‌بندی ادیتور اصلی در این بخش فعال هستند و همراه سکشن ذخیره می‌شوند."\n              />`
  );

  source = source.replace(
    `<strong className="block text-xs mb-1">تنظیمات بنر به‌صورت مستقل مدیریت می‌شوند</strong>\n              تصویر، لینک، نسبت تصویر و چینش این جایگاه را از «مدیریت ← جایگاه‌های بنر» تغییر بده. این سکشن قدیمی فقط برای سازگاری با داده‌های قبلی نگه داشته شده و ذخیرهٔ تنظیمات آن روی بنر جدید اثر نمی‌گذارد.`,
    `<strong className="block text-xs mb-1">ویرایش زنده بنر فعال است</strong>\n              متن، تصویر، لینک و چیدمان را از تب «آیتم‌ها» و «ظاهر» تغییر بده. با دکمه ذخیره، تغییرات هم در سکشن و هم در جایگاه بنر اصلی ذخیره می‌شوند.`
  );

  source = source.replace(
    `{!isBannerSection && <button type="button" onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1"><Save className="w-4 h-4" /> ذخیره</button>}`,
    `<button type="button" onClick={save} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1 disabled:opacity-60"><Save className="w-4 h-4" /> {isSaving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>`
  );

  if (!source.includes("BANNER_PLACEMENT_META.some") || !source.includes("{isSaving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}")) {
    throw new Error('v30.9.2 live section save patch incomplete');
  }
  return source;
});

// Standalone article route should display only the editor shell, not the article
// table behind it. Keep this CSS tiny and scoped to the dedicated route state.
edit('src/index.css', source => {
  if (!source.includes('/* v30.9.2 standalone admin editors */')) {
    source += `\n\n/* v30.9.2 standalone admin editors */\n.admin-standalone-article-editor > :not([data-article-editor-shell="1"]) { display: none !important; }\n.admin-standalone-article-editor [data-article-editor-shell="1"] { display: block; }\n`;
  }
  return source;
});

console.log('v30.9.2 product/article editor + live section save:', changed.length ? changed.join(', ') : 'already satisfied');
