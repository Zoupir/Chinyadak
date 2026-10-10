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

edit('src/components/layout/Header.tsx', source => {
  const broken = `<StoreLink view="cart" onNavigate={onNavigate} className="marketplace-ref-cart" title="سبد خرید">
                <ShoppingBag className="w-4 h-4" />
                <span className="marketplace-ref-cart-label">سبد خرید</span>
                <b>{cartCount}</b>
              </StoreLink>`;
  const restored = `<button type="button" onClick={onOpenCartDrawer} className="marketplace-ref-cart" title="سبد خرید">
                <ShoppingBag className="w-4 h-4" />
                <span className="marketplace-ref-cart-label">سبد خرید</span>
                <b>{cartCount}</b>
              </button>`;

  source = source.replace(broken, restored);
  source = source.replace(
    /<StoreLink\s+view="cart"\s+onNavigate=\{onNavigate\}\s+className="marketplace-ref-cart"\s+title="سبد خرید">([\s\S]*?)<\/StoreLink>/g,
    (_match, inner) => `<button type="button" onClick={onOpenCartDrawer} className="marketplace-ref-cart" title="سبد خرید">${inner}</button>`
  );

  if (!source.includes('<StoreLink')) {
    source = source.replace("import { StoreLink } from '../common/StoreLink';\n", '');
  }
  if (!source.includes('onClick={onOpenCartDrawer} className="marketplace-ref-cart"')) {
    throw new Error('v30.8.1 header cart trigger repair failed');
  }
  return source;
});

edit('src/context/StoreContext.tsx', source => {
  const marker = 'v30.8.1 stable full-page section persistence';

  if (source.includes('/sections/${encodeURIComponent(updatedSection.id)}')) {
    const pattern = /  const updateSection = async \(pageSlug: string, updatedSection: PageSection\): Promise<boolean> => \{[\s\S]*?\n  \};\n\n  const previewSection/;
    const replacement = `  // ${marker}: keep the proven page PUT path.
  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) {
      showToast('برگه برای ذخیره پیدا نشد.', 'error');
      return false;
    }
    return persistPage({
      ...page,
      sections: page.sections.map(section => section.id === updatedSection.id ? updatedSection : section)
    }, \`بخش "\${updatedSection.title || 'بدون عنوان'}" با موفقیت به‌روزرسانی شد.\`);
  };

  const previewSection`;
    const next = source.replace(pattern, replacement);
    if (next === source) throw new Error('v30.8.1 section persistence repair target missing');
    source = next;
  } else if (!source.includes(marker)) {
    const needle = '  const updateSection = async (pageSlug: string, updatedSection: PageSection): Promise<boolean> => {';
    if (!source.includes(needle)) throw new Error('v30.8.1 stable updateSection target missing');
    source = source.replace(needle, `  // ${marker}: keep the proven page PUT path.\n${needle}`);
  }
  return source;
});

edit('src/components/common/LiveSectionModal.tsx', source => {
  const marker = 'v30.8.1: visual sections may intentionally have no title';
  if (source.includes(marker)) return source;

  const before = `  const save = async () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    const saved = await updateSection(pageSlug, form);`;
  const after = `  // ${marker}; persistence should not be blocked by an empty heading.
  const save = async () => {
    const saved = await updateSection(pageSlug, form);`;

  if (!source.includes(before)) throw new Error('v30.8.1 live-section save target missing');
  return source.replace(before, after);
});

edit('src/components/admin/AdminView.tsx', source => {
  const marker = "onNavigate?.('admin', 'products');";
  if (source.includes(marker)) return source;

  const before = `onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileSidebarOpen(false);
                      }}`;
  const after = `onClick={() => {
                        setActiveTab(item.id as any);
                        if (item.id === 'products') {
                          setEditingProduct(null);
                          onNavigate?.('admin', 'products');
                        }
                        setIsMobileSidebarOpen(false);
                      }}`;

  if (!source.includes(before)) throw new Error('v30.8.1 admin sidebar target missing');
  return source.replace(before, after);
});

console.log('v30.8.1 stability fixes:', changed.length ? changed.join(', ') : 'already satisfied');
