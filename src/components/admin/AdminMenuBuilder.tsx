import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  GripVertical,
  Layers,
  Link2,
  PackageSearch,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  HeaderMenuKind,
  MenuItem,
  MenuSourceType
} from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

type LibraryTab = 'pages' | 'products' | 'categories' | 'articles' | 'brands' | 'models' | 'system' | 'custom';

interface LibraryOption {
  key: string;
  sourceType: MenuSourceType;
  sourceId: string;
  title: string;
  subtitle?: string;
  link: string;
  kind: HeaderMenuKind;
}

const systemOptions: LibraryOption[] = [
  { key: 'system-categories-root', sourceType: 'system', sourceId: 'categories-root', title: 'همه دسته‌بندی‌ها', subtitle: 'مگامنو دسته‌بندی قطعات', link: 'shop', kind: 'categories' },
  { key: 'system-brands-root', sourceType: 'system', sourceId: 'brands-root', title: 'برندهای خودرو', subtitle: 'منوی ویژه برندها', link: 'shop', kind: 'brands' },
  { key: 'system-home', sourceType: 'system', sourceId: 'home', title: 'صفحه اصلی', link: 'home', kind: 'system' },
  { key: 'system-shop', sourceType: 'system', sourceId: 'shop', title: 'فروشگاه قطعات', link: 'shop', kind: 'system' },
  { key: 'system-maintenance', sourceType: 'system', sourceId: 'maintenance', title: 'سرویس دوره‌ای', link: 'shop:maintenance', kind: 'system' },
  { key: 'system-part-request', sourceType: 'system', sourceId: 'part-request', title: 'استعلام قطعه', link: 'part-request', kind: 'system' },
  { key: 'system-blog', sourceType: 'system', sourceId: 'blog', title: 'مقالات و آموزش', link: 'blog', kind: 'system' },
  { key: 'system-tracking', sourceType: 'system', sourceId: 'tracking', title: 'پیگیری سفارش', link: 'tracking', kind: 'system' },
  { key: 'system-account', sourceType: 'system', sourceId: 'account', title: 'حساب کاربری', link: 'account', kind: 'system' },
  { key: 'system-garage', sourceType: 'system', sourceId: 'garage', title: 'گاراژ من', link: 'account:garage', kind: 'system' },
  { key: 'system-wishlist', sourceType: 'system', sourceId: 'wishlist', title: 'علاقه‌مندی‌ها', link: 'wishlist', kind: 'system' },
  { key: 'system-compare', sourceType: 'system', sourceId: 'compare', title: 'مقایسه محصولات', link: 'compare', kind: 'system' },
  { key: 'system-cart', sourceType: 'system', sourceId: 'cart', title: 'سبد خرید', link: 'cart', kind: 'system' }
];

const tabMeta: Array<{ id: LibraryTab; title: string; icon: React.ElementType }> = [
  { id: 'pages', title: 'برگه‌ها', icon: FileText },
  { id: 'products', title: 'محصولات', icon: PackageSearch },
  { id: 'categories', title: 'دسته‌بندی‌ها', icon: Layers },
  { id: 'articles', title: 'مقالات', icon: FileText },
  { id: 'brands', title: 'برند خودرو', icon: Car },
  { id: 'models', title: 'مدل خودرو', icon: Car },
  { id: 'system', title: 'صفحات سیستمی', icon: Settings2 },
  { id: 'custom', title: 'لینک دلخواه', icon: Link2 }
];

const sourceLabel = (type?: MenuSourceType) => {
  const map: Record<string, string> = {
    system: 'سیستمی',
    page: 'برگه',
    product: 'محصول',
    category: 'دسته‌بندی',
    article: 'مقاله',
    brand: 'برند خودرو',
    model: 'مدل خودرو',
    custom: 'لینک دلخواه'
  };
  return map[type || ''] || 'قدیمی';
};

export const AdminMenuBuilder: React.FC = () => {
  const {
    settings,
    updateSettings,
    showToast,
    pages,
    products,
    categories,
    articles,
    brands,
    models
  } = useStore();

  const [menus, setMenus] = useState<MenuItem[]>(settings.headerMenus || []);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('pages');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('https://');

  useEffect(() => {
    if (dirty) return;
    setMenus(settings.headerMenus || []);
  }, [settings.headerMenus, dirty]);

  const allLibraryOptions = useMemo<LibraryOption[]>(() => {
    const pageItems: LibraryOption[] = pages.map(page => ({
      key: `page-${page.id}`,
      sourceType: 'page',
      sourceId: page.id,
      title: page.title,
      subtitle: page.slug,
      link: page.slug === 'home' ? 'home' : page.slug === 'part-request' ? 'part-request' : `page:${page.slug}`,
      kind: 'page'
    }));

    const productItems: LibraryOption[] = products.map(product => ({
      key: `product-${product.id}`,
      sourceType: 'product',
      sourceId: product.id,
      title: product.nameFa,
      subtitle: [product.oemNumber, product.sku].filter(Boolean).join(' • '),
      link: `product:${product.slug || product.id}`,
      kind: 'product'
    }));

    const categoryItems: LibraryOption[] = categories.flatMap(category => {
      const root: LibraryOption = {
        key: `category-${category.id}`,
        sourceType: 'category',
        sourceId: category.id,
        title: category.nameFa,
        subtitle: 'دسته اصلی',
        link: `category:${category.slug}`,
        kind: 'category'
      };
      const children: LibraryOption[] = (category.subcategories || []).map(sub => ({
        key: `subcategory-${sub.id}`,
        sourceType: 'category',
        sourceId: `sub:${sub.id}`,
        title: sub.nameFa,
        subtitle: `زیرمجموعهٔ ${category.nameFa}`,
        link: `category:${sub.slug}`,
        kind: 'category'
      }));
      return [root, ...children];
    });

    const articleItems: LibraryOption[] = articles.map(article => ({
      key: `article-${article.id}`,
      sourceType: 'article',
      sourceId: article.id,
      title: article.title,
      subtitle: article.category,
      link: `article:${article.slug || article.id}`,
      kind: 'article'
    }));

    const brandItems: LibraryOption[] = brands.map(brand => ({
      key: `brand-${brand.id}`,
      sourceType: 'brand',
      sourceId: brand.id,
      title: brand.nameFa,
      subtitle: brand.nameEn,
      link: `car-brand:${brand.slug}`,
      kind: 'brand'
    }));

    const modelItems: LibraryOption[] = models.map(model => ({
      key: `model-${model.id}`,
      sourceType: 'model',
      sourceId: model.id,
      title: model.nameFa,
      subtitle: brands.find(brand => brand.id === model.brandId)?.nameFa || model.nameEn,
      link: `car-model:${model.slug || model.id}`,
      kind: 'model'
    }));

    return [...pageItems, ...productItems, ...categoryItems, ...articleItems, ...brandItems, ...modelItems, ...systemOptions];
  }, [pages, products, categories, articles, brands, models]);

  const libraryOptions = useMemo(() => {
    const byType = allLibraryOptions.filter(option => {
      if (activeTab === 'pages') return option.sourceType === 'page';
      if (activeTab === 'products') return option.sourceType === 'product';
      if (activeTab === 'categories') return option.sourceType === 'category';
      if (activeTab === 'articles') return option.sourceType === 'article';
      if (activeTab === 'brands') return option.sourceType === 'brand';
      if (activeTab === 'models') return option.sourceType === 'model';
      if (activeTab === 'system') return option.sourceType === 'system';
      return false;
    });

    const query = search.trim().toLowerCase();
    if (!query) return byType;
    return byType.filter(option =>
      option.title.toLowerCase().includes(query) ||
      String(option.subtitle || '').toLowerCase().includes(query)
    );
  }, [allLibraryOptions, activeTab, search]);

  const sourceMap = useMemo(() => {
    const map = new Map<string, LibraryOption>();
    allLibraryOptions.forEach(option => map.set(`${option.sourceType}:${option.sourceId}`, option));
    return map;
  }, [allLibraryOptions]);

  const childrenOf = (parentId?: string) => menus.filter(item => (item.parentId || undefined) === parentId);

  const markChanged = (next: MenuItem[]) => {
    setMenus(next);
    setDirty(true);
  };

  const saveMenu = () => {
    updateSettings({ headerMenus: menus });
    setDirty(false);
    showToast('فهرست ذخیره شد.');
  };

  const addSelected = () => {
    const options = libraryOptions.filter(option => selected.has(option.key));
    if (!options.length) {
      showToast('حداقل یک مورد را انتخاب کنید.', 'error');
      return;
    }
    const now = Date.now();
    const next = [
      ...menus,
      ...options.map((option, index): MenuItem => ({
        id: `menu-${now}-${index}`,
        title: option.title,
        originalTitle: option.title,
        link: option.link,
        kind: option.kind,
        sourceType: option.sourceType,
        sourceId: option.sourceId,
        isVisible: true,
        openInNewTab: false
      }))
    ];
    markChanged(next);
    setSelected(new Set());
    showToast(`${options.length.toLocaleString('fa-IR')} آیتم به فهرست اضافه شد.`);
  };

  const addCustom = () => {
    const title = customTitle.trim();
    const link = customUrl.trim();
    if (!title || !link) {
      showToast('عنوان و آدرس لینک را وارد کنید.', 'error');
      return;
    }
    markChanged([
      ...menus,
      {
        id: `menu-custom-${Date.now()}`,
        title,
        originalTitle: title,
        link,
        kind: 'custom',
        sourceType: 'custom',
        sourceId: `custom-${Date.now()}`,
        isVisible: true,
        openInNewTab: /^https?:\/\//i.test(link)
      }
    ]);
    setCustomTitle('');
    setCustomUrl('https://');
    showToast('لینک دلخواه به فهرست اضافه شد.');
  };

  const patchItem = (id: string, patch: Partial<MenuItem>) => {
    markChanged(menus.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const descendantsOf = (id: string): string[] => {
    const direct = menus.filter(item => item.parentId === id).map(item => item.id);
    return [...direct, ...direct.flatMap(descendantsOf)];
  };

  const deleteItem = (id: string) => {
    const target = menus.find(item => item.id === id);
    if (!target) return;
    const descendants = descendantsOf(id);
    if (!window.confirm(descendants.length
      ? `«${target.title}» و ${descendants.length.toLocaleString('fa-IR')} زیرمنوی آن حذف شود؟`
      : `«${target.title}» از فهرست حذف شود؟`)) return;
    markChanged(menus.filter(item => item.id !== id && !descendants.includes(item.id)));
    if (expanded === id) setExpanded(null);
  };

  const moveSibling = (id: string, direction: 'up' | 'down') => {
    const item = menus.find(row => row.id === id);
    if (!item) return;
    const siblings = menus.filter(row => (row.parentId || undefined) === (item.parentId || undefined));
    const siblingIndex = siblings.findIndex(row => row.id === id);
    const targetSibling = siblings[direction === 'up' ? siblingIndex - 1 : siblingIndex + 1];
    if (!targetSibling) return;

    const next = [...menus];
    const from = next.findIndex(row => row.id === id);
    const to = next.findIndex(row => row.id === targetSibling.id);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    markChanged(next);
  };

  const indentItem = (id: string) => {
    const item = menus.find(row => row.id === id);
    if (!item) return;
    const siblings = menus.filter(row => (row.parentId || undefined) === (item.parentId || undefined));
    const index = siblings.findIndex(row => row.id === id);
    const previous = siblings[index - 1];
    if (!previous) return;
    if (descendantsOf(id).includes(previous.id)) return;
    patchItem(id, { parentId: previous.id });
  };

  const outdentItem = (id: string) => {
    const item = menus.find(row => row.id === id);
    if (!item?.parentId) return;
    const parent = menus.find(row => row.id === item.parentId);
    patchItem(id, { parentId: parent?.parentId });
  };

  const handleDrop = (targetId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    if (descendantsOf(draggingId).includes(targetId)) return;

    const dragged = menus.find(item => item.id === draggingId);
    const target = menus.find(item => item.id === targetId);
    if (!dragged || !target) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const mode: 'before' | 'after' | 'inside' =
      event.altKey || event.shiftKey
        ? 'inside'
        : relativeY < rect.height * 0.45
          ? 'before'
          : relativeY > rect.height * 0.75
            ? 'after'
            : 'inside';

    const next = menus.filter(item => item.id !== draggingId);
    const updatedDragged: MenuItem = {
      ...dragged,
      parentId: mode === 'inside' ? target.id : target.parentId
    };
    const targetIndex = next.findIndex(item => item.id === targetId);
    next.splice(mode === 'before' ? targetIndex : targetIndex + 1, 0, updatedDragged);
    markChanged(next);
    setDraggingId(null);
  };

  const syncBoundTitles = () => {
    const next = menus.map(item => {
      if (!item.sourceType || !item.sourceId || item.sourceType === 'custom') return item;
      const source = sourceMap.get(`${item.sourceType}:${item.sourceId}`);
      if (!source) return item;
      const wasUnedited = !item.originalTitle || item.title === item.originalTitle;
      return {
        ...item,
        title: wasUnedited ? source.title : item.title,
        originalTitle: source.title,
        link: source.link,
        kind: source.kind
      };
    });
    markChanged(next);
    showToast('لینک‌ها و عنوان‌های ویرایش‌نشده با محتوای سایت همگام شدند.');
  };

  const resetToSaved = () => {
    setMenus(settings.headerMenus || []);
    setDirty(false);
    setExpanded(null);
    showToast('تغییرات ذخیره‌نشده کنار گذاشته شد.', 'info');
  };

  const isMissing = (item: MenuItem) => {
    if (!item.sourceType || item.sourceType === 'custom' || item.sourceType === 'system') return false;
    if (!item.sourceId) return false;
    return !sourceMap.has(`${item.sourceType}:${item.sourceId}`);
  };

  const renderItem = (item: MenuItem, depth = 0): React.ReactNode => {
    const children = childrenOf(item.id);
    const siblings = childrenOf(item.parentId);
    const siblingIndex = siblings.findIndex(row => row.id === item.id);
    const isOpen = expanded === item.id;
    const missing = isMissing(item);

    return (
      <React.Fragment key={item.id}>
        <div
          draggable
          onDragStart={() => setDraggingId(item.id)}
          onDragEnd={() => setDraggingId(null)}
          onDragOver={event => event.preventDefault()}
          onDrop={event => handleDrop(item.id, event)}
          className={`menu-builder-item ${draggingId === item.id ? 'opacity-40' : ''}`}
          style={{ marginRight: Math.min(depth, 3) * 26 }}
        >
          <div className={`rounded-xl border bg-white ${missing ? 'border-amber-300' : 'border-neutral-200'} shadow-xs`}>
            <div className="min-h-14 px-3 py-2 flex items-center gap-2">
              <button type="button" className="p-1 text-neutral-400 cursor-grab" title="برای جابه‌جایی بکشید">
                <GripVertical className="w-4 h-4" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-xs text-neutral-900">{item.title}</strong>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-[9px] font-bold">
                    {sourceLabel(item.sourceType)}
                  </span>
                  {item.megaMenu?.enabled && (
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[9px] font-bold">Mega Menu</span>
                  )}
                  {item.isVisible === false && <span className="text-[9px] text-neutral-400">مخفی</span>}
                  {missing && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700">
                      <AlertTriangle className="w-3 h-3" /> منبع حذف شده
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[9px] text-neutral-400 font-mono truncate" dir="ltr">{item.link}</div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" disabled={siblingIndex <= 0} onClick={() => moveSibling(item.id, 'up')} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-20" title="بالا"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={siblingIndex < 0 || siblingIndex >= siblings.length - 1} onClick={() => moveSibling(item.id, 'down')} className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-20" title="پایین"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={siblingIndex <= 0} onClick={() => indentItem(item.id)} className="p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-20" title="تبدیل به زیرمنو"><ChevronLeft className="w-3.5 h-3.5 text-blue-600" /></button>
                <button type="button" disabled={!item.parentId} onClick={() => outdentItem(item.id)} className="p-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-20" title="یک سطح بیرون"><ArrowRight className="w-3.5 h-3.5 text-blue-600" /></button>
                <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)} className="p-1.5 rounded-lg hover:bg-neutral-100" title="تنظیمات آیتم"><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-neutral-100 p-4 bg-neutral-50/60 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label>
                    <span className="block text-[10px] font-bold text-neutral-600 mb-1">عنوان نمایشی</span>
                    <input value={item.title} onChange={event => patchItem(item.id, { title: event.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white text-xs" />
                    {item.originalTitle && item.title !== item.originalTitle && (
                      <button type="button" onClick={() => patchItem(item.id, { title: item.originalTitle })} className="mt-1 text-[9px] text-blue-600 font-bold">بازگردانی «{item.originalTitle}»</button>
                    )}
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold text-neutral-600 mb-1">مقصد</span>
                    <input
                      value={item.link}
                      onChange={event => patchItem(item.id, { link: event.target.value, sourceType: item.sourceType === 'custom' ? 'custom' : undefined, sourceId: undefined })}
                      className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white text-xs font-mono text-left"
                      dir="ltr"
                    />
                    {item.sourceType && item.sourceType !== 'custom' && <small className="block mt-1 text-[9px] text-neutral-400">برای محتوای انتخابی، لینک به‌صورت خودکار مدیریت می‌شود. ویرایش دستی اتصال خودکار را قطع می‌کند.</small>}
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold text-neutral-600 mb-1">Badge اختیاری</span>
                    <input value={item.badge || ''} onChange={event => patchItem(item.id, { badge: event.target.value || undefined })} className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white text-xs" placeholder="مثلاً جدید" />
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold text-neutral-600 mb-1">CSS Class اختیاری</span>
                    <input value={item.cssClass || ''} onChange={event => patchItem(item.id, { cssClass: event.target.value || undefined })} className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white text-xs font-mono text-left" dir="ltr" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 text-[10px] font-bold">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={item.isVisible !== false} onChange={event => patchItem(item.id, { isVisible: event.target.checked })} />
                    نمایش در منو
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(item.openInNewTab)} onChange={event => patchItem(item.id, { openInNewTab: event.target.checked })} />
                    باز شدن در تب جدید
                  </label>
                </div>

                {!item.parentId && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 space-y-3">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span>
                        <strong className="block text-xs text-violet-950">Mega Menu</strong>
                        <small className="text-[9px] text-violet-700">فقط برای آیتم والد؛ زیرمنوها به‌صورت ستونی نمایش داده می‌شوند.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(item.megaMenu?.enabled)}
                        onChange={event => patchItem(item.id, {
                          megaMenu: {
                            ...(item.megaMenu || {}),
                            enabled: event.target.checked,
                            columns: item.megaMenu?.columns || 4,
                            width: item.megaMenu?.width || 'boxed'
                          }
                        })}
                      />
                    </label>

                    {item.megaMenu?.enabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <label>
                            <span className="block text-[10px] font-bold mb-1">تعداد ستون</span>
                            <select value={item.megaMenu.columns || 4} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, columns: Number(event.target.value) } })} className="w-full p-2 border rounded-lg bg-white text-xs">
                              {[2,3,4,5,6].map(count => <option key={count} value={count}>{count} ستون</option>)}
                            </select>
                          </label>
                          <label>
                            <span className="block text-[10px] font-bold mb-1">عرض مگامنو</span>
                            <select value={item.megaMenu.width || 'boxed'} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, width: event.target.value as 'boxed' | 'full' } })} className="w-full p-2 border rounded-lg bg-white text-xs">
                              <option value="boxed">داخل عرض سایت</option>
                              <option value="full">تمام عرض</option>
                            </select>
                          </label>
                        </div>
                        <ImageUploadInput
                          label="بنر اختیاری داخل Mega Menu"
                          value={item.megaMenu.bannerImageUrl || ''}
                          onChange={url => patchItem(item.id, { megaMenu: { ...item.megaMenu!, bannerImageUrl: url } })}
                          aspectRatio="banner"
                          presetCategory="banners"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input value={item.megaMenu.bannerTitle || ''} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, bannerTitle: event.target.value } })} className="p-2 border rounded-lg bg-white text-xs" placeholder="عنوان بنر" />
                          <input value={item.megaMenu.bannerLink || ''} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, bannerLink: event.target.value } })} className="p-2 border rounded-lg bg-white text-xs font-mono text-left" dir="ltr" placeholder="لینک بنر" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-neutral-400">برای ساخت زیرمنو، آیتم را با دکمه فلش به داخل آیتم قبلی ببرید یا روی آیتم والد Drop کنید.</span>
                  <button type="button" onClick={() => deleteItem(item.id)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold">
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {children.map(child => renderItem(child, depth + 1))}
      </React.Fragment>
    );
  };

  const roots = childrenOf(undefined);
  const invalidCount = menus.filter(isMissing).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-sm text-blue-950">فهرست اصلی سایت</h4>
            <p className="text-[11px] text-blue-700 mt-1">مثل فهرست‌های وردپرس: محتوا را از لیست انتخاب کنید، اضافه کنید و با Drag & Drop یا فلش‌ها بچینید. همین فهرست در دسکتاپ و موبایل استفاده می‌شود.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={syncBoundTitles} className="px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-800 text-xs font-bold inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> همگام‌سازی محتوا
            </button>
            {dirty && (
              <button type="button" onClick={resetToSaved} className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 text-xs font-bold">
                لغو تغییرات
              </button>
            )}
            <button type="button" onClick={saveMenu} disabled={!dirty} className="px-4 py-2 rounded-xl bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-black inline-flex items-center gap-1.5">
              <Save className="w-4 h-4" /> ذخیره فهرست
            </button>
          </div>
        </div>
        {invalidCount > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold inline-flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {invalidCount.toLocaleString('fa-IR')} آیتم به محتوایی اشاره می‌کند که دیگر وجود ندارد.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-5 items-start">
        <aside className="rounded-2xl border border-neutral-200 bg-white overflow-hidden xl:sticky xl:top-4">
          <div className="p-4 border-b border-neutral-100">
            <h5 className="font-black text-sm text-neutral-900">افزودن آیتم به فهرست</h5>
            <p className="text-[10px] text-neutral-500 mt-1">نیازی به نوشتن URL نیست؛ محتوا را انتخاب کنید.</p>
          </div>

          <div className="grid grid-cols-2 border-b border-neutral-200">
            {tabMeta.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setSearch(''); setSelected(new Set()); }}
                  className={`min-h-11 px-2 flex items-center justify-center gap-1.5 text-[10px] font-bold border-b border-l border-neutral-100 ${activeTab === tab.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.title}
                </button>
              );
            })}
          </div>

          {activeTab === 'custom' ? (
            <div className="p-4 space-y-3">
              <label>
                <span className="block text-[10px] font-bold mb-1">عنوان لینک</span>
                <input value={customTitle} onChange={event => setCustomTitle(event.target.value)} className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs" placeholder="مثلاً تماس با ما" />
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">URL یا مسیر داخلی</span>
                <input value={customUrl} onChange={event => setCustomUrl(event.target.value)} className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-mono text-left" dir="ltr" />
              </label>
              <button type="button" onClick={addCustom} className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> افزودن لینک
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input value={search} onChange={event => setSearch(event.target.value)} className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-lg text-xs" placeholder="جستجو..." />
                </div>
              </div>

              <div className="max-h-[430px] overflow-y-auto p-2">
                {libraryOptions.map(option => (
                  <label key={option.key} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={selected.has(option.key)}
                      onChange={event => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(option.key);
                        else next.delete(option.key);
                        setSelected(next);
                      }}
                    />
                    <span className="min-w-0">
                      <strong className="block text-[11px] text-neutral-800">{option.title}</strong>
                      {option.subtitle && <small className="block text-[9px] text-neutral-400 mt-0.5 truncate">{option.subtitle}</small>}
                    </span>
                  </label>
                ))}
                {!libraryOptions.length && <div className="p-8 text-center text-[10px] text-neutral-400">موردی پیدا نشد.</div>}
              </div>

              <div className="p-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(new Set(libraryOptions.map(option => option.key)))}
                  className="text-[10px] font-bold text-blue-600"
                >
                  انتخاب همه
                </button>
                <button type="button" onClick={addSelected} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> افزودن به فهرست
                </button>
              </div>
            </>
          )}
        </aside>

        <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5 min-h-[520px]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h5 className="font-black text-sm text-neutral-900">ساختار فهرست</h5>
              <p className="text-[10px] text-neutral-500 mt-1">آیتم‌ها را بکشید؛ Drop روی مرکز یک آیتم آن را زیرمنو می‌کند. برای کنترل دقیق‌تر از فلش‌های داخل هر ردیف استفاده کنید.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white border text-[10px] font-bold text-neutral-500">{menus.length.toLocaleString('fa-IR')} آیتم</span>
          </div>

          <div className="space-y-2">
            {roots.map(item => renderItem(item, 0))}
            {!roots.length && (
              <div className="min-h-[360px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-10 h-10 text-neutral-300" />
                <strong className="mt-3 text-sm text-neutral-600">فهرست خالی است</strong>
                <p className="mt-1 text-[10px] text-neutral-400">از ستون کناری برگه، محصول، دسته‌بندی یا هر محتوای دیگری را انتخاب و اضافه کنید.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
