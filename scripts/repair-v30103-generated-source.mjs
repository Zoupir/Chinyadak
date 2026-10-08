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

const replaceFunction = (source, startPattern, endPattern, replacement, label) => {
  const start = source.search(startPattern);
  if (start < 0) throw new Error(`v30.10.3 repair missing ${label} start`);
  const tail = source.slice(start);
  const endMatch = tail.match(endPattern);
  if (!endMatch || endMatch.index == null) throw new Error(`v30.10.3 repair missing ${label} end`);
  const end = start + endMatch.index;
  return source.slice(0, start) + replacement + source.slice(end);
};

edit('src/context/StoreContext.tsx', source => {
  const promises = [
    ['addProduct', 'product: Product'],
    ['updateProduct', 'updated: Product'],
    ['addArticle', 'art: Article'],
    ['updateArticle', 'art: Article']
  ];
  for (const [name, params] of promises) {
    const pattern = new RegExp(`${name}: \\(${params.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\) => Promise<[^;]+>;`);
    source = source.replace(pattern, `${name}: (${params}) => Promise<boolean>;`);
  }

  if (!source.includes('const discardSectionPreview =')) {
    const marker = '  const addSection = async (pageSlug: string, newSection: PageSection): Promise<boolean> => {';
    const index = source.indexOf(marker);
    if (index < 0) throw new Error('v30.10.3 repair missing addSection insertion marker');
    const fn = `  const discardSectionPreview = (pageSlug: string, sectionId: string) => {\n    setPages(prev => prev.map(page => page.slug === pageSlug\n      ? { ...page, sections: page.sections.filter(section => section.id !== sectionId) }\n      : page));\n  };\n\n`;
    source = source.slice(0, index) + fn + source.slice(index);
  }
  return source;
});

edit('src/components/common/LiveSectionModal.tsx', source => {
  let seenSaving = false;
  source = source.split('\n').filter(line => {
    if (!line.includes('const [isSaving, setIsSaving] = useState(false);')) return true;
    if (!seenSaving) { seenSaving = true; return true; }
    return false;
  }).join('\n');
  return source;
});

edit('src/components/admin/AdminArticlesTab.tsx', source => {
  if (!source.includes('useRef')) {
    source = source.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useRef, useState } from 'react';");
  }
  if (!source.includes("from '../../hooks/useEditorGuard'")) {
    source = source.replace(
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';",
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';\nimport { editorSnapshot, useDialogFocusTrap, useUnsavedChangesGuard } from '../../hooks/useEditorGuard';"
    );
  }
  if (!source.includes('const [isArticleSaving')) {
    source = source.replace(
      '  const [editingArticle, setEditingArticle] = useState<Article | null>(null);',
      "  const [editingArticle, setEditingArticle] = useState<Article | null>(null);\n  const [isArticleSaving, setIsArticleSaving] = useState(false);\n  const articleBaselineRef = useRef<string>('');\n  const articleDialogRef = useRef<HTMLDivElement | null>(null);"
    );
  }

  source = replaceFunction(
    source,
    /  const handleOpenNew = \(\) => \{/,
    /\n\n  const handleEdit = /,
`  const handleOpenNew = () => {
    const draft: Partial<Article> = {
      title: '',
      slug: '',
      category: articleCategories[0]?.name || 'آموزش و نگهداری',
      categoryId: articleCategories[0]?.id || 'cat-maintenance',
      summary: '',
      content: '',
      author: 'تیم فنی چین‌پارت',
      readTimeMinutes: 6,
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      relatedModelIds: [models[0]?.id || 'kmc-j7'],
      relatedProductIds: [products[0]?.id || 'prod-water-pump-kmc-j7'],
      faq: [{ q: 'هر چند وقت یکبار باید این قطعه تعویض شود؟', a: 'طبق دفترچه سرویس دوره‌ای هر ۴۰ تا ۵۰ هزار کیلومتر توصیه می‌شود.' }]
    };
    setEditingArticle(null);
    setArticleForm(draft);
    articleBaselineRef.current = editorSnapshot(draft);
    setIsModalOpen(true);
  };`,
    'article new handler'
  );

  source = replaceFunction(
    source,
    /  const handleEdit = \(art: Article\) => \{/,
    /\n\n  (?:const articleDirty|const handleSave) = /,
`  const handleEdit = (art: Article) => {
    const draft = { ...art };
    setEditingArticle(art);
    setArticleForm(draft);
    articleBaselineRef.current = editorSnapshot(draft);
    setIsModalOpen(true);
  };`,
    'article edit handler'
  );

  const oldGuardStart = source.indexOf('  const articleDirty = ');
  if (oldGuardStart >= 0) {
    const saveStart = source.indexOf('  const handleSave = ', oldGuardStart);
    if (saveStart > oldGuardStart) source = source.slice(0, oldGuardStart) + source.slice(saveStart);
  }
  const saveMarker = source.indexOf('  const handleSave = ');
  if (saveMarker < 0) throw new Error('v30.10.3 repair missing article save marker');
  const guard = `  const articleDirty = isModalOpen && editorSnapshot(articleForm) !== articleBaselineRef.current;\n  const confirmArticleDiscard = useUnsavedChangesGuard(articleDirty);\n  const closeArticleEditor = () => {\n    if (isArticleSaving || !confirmArticleDiscard()) return;\n    setIsModalOpen(false);\n  };\n  useDialogFocusTrap(isModalOpen, articleDialogRef, closeArticleEditor);\n\n`;
  source = source.slice(0, saveMarker) + guard + source.slice(saveMarker);

  source = replaceFunction(
    source,
    /  const handleSave = (?:async )?\(e: React\.FormEvent\) => \{/,
    /\n\n  const handleDelete = /,
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
        saved = await addArticle(newArticle);
      }
      if (!saved) return;
      articleBaselineRef.current = editorSnapshot(articleForm);
      setIsModalOpen(false);
    } finally {
      setIsArticleSaving(false);
    }
  };`,
    'article save handler'
  );

  // Deep-link opening also establishes the clean baseline.
  source = source.replace(
    '      setArticleForm({ ...article });\n      setIsModalOpen(true);',
    '      const draft = { ...article };\n      setArticleForm(draft);\n      articleBaselineRef.current = editorSnapshot(draft);\n      setIsModalOpen(true);'
  );
  return source;
});

edit('src/components/admin/AdminView.tsx', source => {
  if (!source.includes('useRef')) {
    source = source.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useRef, useState } from 'react';");
  }
  if (!source.includes("from '../../hooks/useEditorGuard'")) {
    source = source.replace(
      "import { AdminDashboardPro } from './AdminDashboardPro';",
      "import { AdminDashboardPro } from './AdminDashboardPro';\nimport { editorSnapshot, useDialogFocusTrap, useUnsavedChangesGuard } from '../../hooks/useEditorGuard';"
    );
  }
  if (!source.includes('const [isProductSaving')) {
    source = source.replace(
      '  const [editingProduct, setEditingProduct] = useState<Product | null>(null);',
      "  const [editingProduct, setEditingProduct] = useState<Product | null>(null);\n  const [isProductSaving, setIsProductSaving] = useState(false);\n  const productBaselineRef = useRef<string>('');\n  const productDialogRef = useRef<HTMLDivElement | null>(null);"
    );
  }

  const oldGuardStart = source.indexOf('  const productDirty = ');
  if (oldGuardStart >= 0) {
    const saveStart = source.indexOf('  const handleSaveProduct = ', oldGuardStart);
    if (saveStart > oldGuardStart) source = source.slice(0, oldGuardStart) + source.slice(saveStart);
  }
  const saveMarker = source.indexOf('  const handleSaveProduct = ');
  if (saveMarker < 0) throw new Error('v30.10.3 repair missing product save marker');
  const guard = `  const productDirty = Boolean(editingProduct && editorSnapshot(editingProduct) !== productBaselineRef.current);\n  const confirmProductDiscard = useUnsavedChangesGuard(productDirty);\n  const closeProductEditor = () => {\n    if (isProductSaving || !confirmProductDiscard()) return;\n    setEditingProduct(null);\n  };\n  useDialogFocusTrap(Boolean(editingProduct), productDialogRef, closeProductEditor);\n\n`;
  source = source.slice(0, saveMarker) + guard + source.slice(saveMarker);

  source = replaceFunction(
    source,
    /  const handleSaveProduct = (?:async )?\(e: React\.FormEvent\) => \{/,
    /\n\n  const handleAddCategorySubmit = /,
`  const handleSaveProduct = async (e: React.FormEvent) => {
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
  };`,
    'product save handler'
  );

  source = source.replace(
    'onClick={() => setEditingProduct(p)}',
    'onClick={() => { productBaselineRef.current = editorSnapshot(p); setEditingProduct({ ...p }); }}'
  );
  return source;
});

edit('src/components/admin/AdminPagesTab.tsx', source => {
  // The legacy hidden modal remains in source for rollback safety; optional
  // chaining avoids strict-null errors while it is disabled.
  source = source.replace(/editingSection\.(\w+)/g, 'editingSection?.$1');
  return source;
});

console.log('v30.10.3 generated-source repair:', changed.length ? changed.join(', ') : 'already satisfied');
