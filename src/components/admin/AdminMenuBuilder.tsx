import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Car,
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
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { HeaderMenuKind, MenuItem, MenuSourceType } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { IconPicker } from '../common/IconPicker';
import { IconRenderer, iconClassFor } from '../common/IconRenderer';

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

interface FlatTreeRow {
  item: MenuItem;
  depth: number;
}

const systemOptions: LibraryOption[] = [
  { key: 'system-categories-root', sourceType: 'system', sourceId: 'categories-root', title: 'همه دسته‌بندی‌ها', subtitle: 'ریشه مگامنو دسته‌بندی قطعات', link: 'shop', kind: 'categories' },
  { key: 'system-brands-root', sourceType: 'system', sourceId: 'brands-root', title: 'برندهای خودرو', subtitle: 'ریشه منوی برندها', link: 'shop', kind: 'brands' },
  { key: 'system-home', sourceType: 'system', sourceId: 'home', title: 'صفحه اصلی', link: 'home', kind: 'system' },
  { key: 'system-shop', sourceType: 'system', sourceId: 'shop', title: 'فروشگاه قطعات', link: 'shop', kind: 'system' },
  { key: 'system-maintenance', sourceType: 'system', sourceId: 'maintenance', title: 'سرویس دوره‌ای', link: 'shop:maintenance', kind: 'system' },
  { key: 'system-part-request', sourceType: 'system', sourceId: 'part-request', title: 'استعلام قطعه', link: 'part-request', kind: 'system' },
  { key: 'system-blog', sourceType: 'system', sourceId: 'blog', title: 'مقالات و آموزش', link: 'blog', kind: 'system' },
  { key: 'system-tracking', sourceType: 'system', sourceId: 'tracking', title: 'پیگیری سفارش', link: 'tracking', kind: 'system' },
  { key: 'system-account', sourceType: 'system', sourceId: 'account', title: 'حساب کاربری', link: 'account', kind: 'system' },
  { key: 'system-garage', sourceType: 'system', sourceId: 'garage', title: 'گاراژ من', link: 'account:garage', kind: 'system' },
  { key: 'system-wishlist', sourceType: 'system', sourceId: 'wishlist', title: 'علاقه‌مندی‌ها', link: 'wishlist', kind: 'system' },
  { key: 'system-compare', sourceType: 'system', sourceId: 'compare', title: 'مقایسه محصولات', link: 'compare', kind: 'system' }
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
    brand: 'برند',
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
  const [openSettings, setOpenSettings] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [insertParentId, setInsertParentId] = useState<string | undefined>(undefined);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('https://');
  const [iconPickerItemId, setIconPickerItemId] = useState<string | null>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  const megaMigrationDoneRef = useRef(false);

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

  const childrenOf = (parentId?: string) =>
    menus.filter(item => (item.parentId || undefined) === parentId);

  const collectDescendantIds = (items: MenuItem[], id: string): string[] => {
    const direct = items.filter(item => item.parentId === id).map(item => item.id);
    return [...direct, ...direct.flatMap(childId => collectDescendantIds(items, childId))];
  };

  const buildCategoryMegaTree = (baseMenus: MenuItem[]): MenuItem[] => {
    const existingRoot = baseMenus.find(item => !item.parentId && item.kind === 'categories');
    const rootId = existingRoot?.id || 'header-categories';
    const root: MenuItem = {
      ...(existingRoot || {}),
      id: rootId,
      title: existingRoot?.title || 'همه دسته‌بندی‌ها',
      originalTitle: existingRoot?.originalTitle || existingRoot?.title || 'همه دسته‌بندی‌ها',
      link: existingRoot?.link || 'shop',
      kind: 'categories',
      sourceType: 'system',
      sourceId: 'categories-root',
      isVisible: existingRoot?.isVisible !== false,
      megaMenu: {
        ...(existingRoot?.megaMenu || {}),
        enabled: true,
        columns: existingRoot?.megaMenu?.columns || 4,
        width: existingRoot?.megaMenu?.width || 'full'
      }
    };

    const descendantIds = existingRoot ? collectDescendantIds(baseMenus, rootId) : [];
    const preserved = baseMenus
      .filter(item => item.id !== rootId && !descendantIds.includes(item.id));

    const rootIndex = existingRoot
      ? Math.max(0, baseMenus.findIndex(item => item.id === rootId))
      : 0;

    const categoryNodes: MenuItem[] = [];
    categories.forEach(category => {
      const categoryId = `mega-category-${category.id}`;
      categoryNodes.push({
        id: categoryId,
        title: category.nameFa,
        originalTitle: category.nameFa,
        link: `category:${category.slug}`,
        kind: 'category',
        sourceType: 'category',
        sourceId: category.id,
        parentId: rootId,
        isVisible: true
      });

      (category.subcategories || []).forEach(sub => {
        categoryNodes.push({
          id: `mega-subcategory-${category.id}-${sub.id}`,
          title: sub.nameFa,
          originalTitle: sub.nameFa,
          link: `category:${sub.slug}`,
          kind: 'category',
          sourceType: 'category',
          sourceId: `sub:${sub.id}`,
          parentId: categoryId,
          isVisible: true
        });
      });
    });

    const next = [...preserved];
    next.splice(Math.min(rootIndex, next.length), 0, root);
    return [...next, ...categoryNodes];
  };

  const descendantsOf = (id: string): string[] => {
    const direct = menus.filter(item => item.parentId === id).map(item => item.id);
    return [...direct, ...direct.flatMap(descendantsOf)];
  };

  const flattenTree = (parentId?: string, depth = 0): FlatTreeRow[] =>
    childrenOf(parentId).flatMap(item => [
      { item, depth },
      ...flattenTree(item.id, depth + 1)
    ]);

  const flatTree = flattenTree();

  const markChanged = (next: MenuItem[]) => {
    setMenus(next);
    setDirty(true);
  };

  useEffect(() => {
    if (megaMigrationDoneRef.current || dirty || categories.length === 0) return;

    const current = settings.headerMenus || [];
    const categoryRoot = current.find(item => !item.parentId && item.kind === 'categories');
    const hasEditableCategoryTree = Boolean(
      categoryRoot &&
      (
        categoryRoot.sourceId === 'categories-root' ||
        current.some(item => item.parentId === categoryRoot.id)
      )
    );

    megaMigrationDoneRef.current = true;
    if (hasEditableCategoryTree) return;

    const next = buildCategoryMegaTree(current);
    const nextRoot = next.find(item => !item.parentId && item.kind === 'categories');
    setMenus(next);
    setDirty(true);
    setInsertParentId(nextRoot?.id);
    if (nextRoot) {
      setOpenSettings(prev => new Set(prev).add(nextRoot.id));
    }
    showToast('مگامنوی فعلی دسته‌بندی‌ها وارد Tree Editor شد. حالا همان ستون‌ها و زیرمنوها را مستقیم ویرایش و سپس ذخیره کنید.', 'info');
  }, [categories.length, dirty, settings.headerMenus]);

  const rebuildCategoryMegaFromCatalog = () => {
    const categoryRoot = menus.find(item => !item.parentId && item.kind === 'categories');
    const childCount = categoryRoot ? collectDescendantIds(menus, categoryRoot.id).length : 0;
    if (childCount > 0 && !window.confirm('ساختار فعلی مگامنوی دسته‌بندی‌ها از روی دسته‌بندی‌های سایت بازسازی شود؟ ویرایش‌های دستی داخل همین شاخه جایگزین می‌شوند.')) {
      return;
    }

    const next = buildCategoryMegaTree(menus);
    const nextRoot = next.find(item => !item.parentId && item.kind === 'categories');
    markChanged(next);
    setInsertParentId(nextRoot?.id);
    if (nextRoot) setOpenSettings(prev => new Set(prev).add(nextRoot.id));
    showToast('تمام ستون‌ها و زیرمنوهای مگامنوی دسته‌بندی‌ها داخل درخت قابل ویرایش شدند.');
  };

  const patchItem = (id: string, patch: Partial<MenuItem>) => {
    markChanged(menus.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const toggleSettings = (id: string) => {
    setOpenSettings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveMenu = () => {
    updateSettings({ headerMenus: menus });
    setDirty(false);
    showToast('ساختار کامل فهرست ذخیره شد.');
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
        parentId: insertParentId,
        isVisible: true,
        openInNewTab: false
      }))
    ];
    markChanged(next);
    setSelected(new Set());
    showToast(
      insertParentId
        ? `${options.length.toLocaleString('fa-IR')} آیتم به‌عنوان زیرمنو اضافه شد.`
        : `${options.length.toLocaleString('fa-IR')} آیتم به سطح اصلی اضافه شد.`
    );
  };

  const addCustom = () => {
    const title = customTitle.trim();
    const link = customUrl.trim();
    if (!title || !link) {
      showToast('عنوان و آدرس لینک را وارد کنید.', 'error');
      return;
    }
    const stamp = Date.now();
    const item: MenuItem = {
      id: `menu-custom-${stamp}`,
      title,
      originalTitle: title,
      link,
      kind: 'custom',
      sourceType: 'custom',
      sourceId: `custom-${stamp}`,
      parentId: insertParentId,
      isVisible: true,
      openInNewTab: /^https?:\/\//i.test(link)
    };
    markChanged([...menus, item]);
    setCustomTitle('');
    setCustomUrl('https://');
    setOpenSettings(prev => new Set(prev).add(item.id));
    showToast(insertParentId ? 'زیرمنوی دلخواه اضافه شد.' : 'لینک دلخواه اضافه شد.');
  };

  const chooseAsParent = (id?: string) => {
    setInsertParentId(id);
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(id ? 'مقصد افزودن روی این آیتم تنظیم شد.' : 'آیتم‌های جدید به سطح اصلی اضافه می‌شوند.', 'info');
  };

  const deleteItem = (id: string) => {
    const target = menus.find(item => item.id === id);
    if (!target) return;
    const descendants = descendantsOf(id);
    if (!window.confirm(descendants.length
      ? `«${target.title}» و ${descendants.length.toLocaleString('fa-IR')} زیرمنوی آن حذف شود؟`
      : `«${target.title}» حذف شود؟`)) return;
    markChanged(menus.filter(item => item.id !== id && !descendants.includes(item.id)));
    if (insertParentId === id || descendants.includes(insertParentId || '')) setInsertParentId(undefined);
  };

  const moveSibling = (id: string, direction: 'up' | 'down') => {
    const item = menus.find(row => row.id === id);
    if (!item) return;
    const siblings = childrenOf(item.parentId);
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
    const siblings = childrenOf(item.parentId);
    const index = siblings.findIndex(row => row.id === id);
    const previous = siblings[index - 1];
    if (!previous || descendantsOf(id).includes(previous.id)) return;
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
    if (!draggingId || draggingId === targetId || descendantsOf(draggingId).includes(targetId)) return;

    const dragged = menus.find(item => item.id === draggingId);
    const target = menus.find(item => item.id === targetId);
    if (!dragged || !target) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const mode: 'before' | 'inside' | 'after' =
      y < rect.height * 0.30 ? 'before' : y > rect.height * 0.70 ? 'after' : 'inside';

    const next = menus.filter(item => item.id !== draggingId);
    const updated: MenuItem = {
      ...dragged,
      parentId: mode === 'inside' ? target.id : target.parentId
    };

    const targetIndex = next.findIndex(item => item.id === targetId);
    next.splice(mode === 'before' ? targetIndex : targetIndex + 1, 0, updated);
    markChanged(next);
    setDraggingId(null);
  };

  const dropToRoot = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggingId) return;
    if (!menus.some(item => item.id === draggingId)) return;
    const next = menus.map(item => item.id === draggingId ? { ...item, parentId: undefined } : item);
    markChanged(next);
    setDraggingId(null);
  };

  const syncBoundTitles = () => {
    const next = menus.map(item => {
      if (item.sourceType === 'custom') return item;
      const source = item.sourceType && item.sourceId
        ? sourceMap.get(`${item.sourceType}:${item.sourceId}`)
        : allLibraryOptions.find(option => option.link === item.link);
      if (!source) return item;
      const titleWasAutomatic = !item.originalTitle || item.title === item.originalTitle || !item.sourceType;
      return {
        ...item,
        title: titleWasAutomatic ? source.title : item.title,
        originalTitle: source.title,
        link: source.link,
        kind: source.kind,
        sourceType: source.sourceType,
        sourceId: source.sourceId
      };
    });
    markChanged(next);
    showToast('فهرست با محتوای واقعی سایت همگام شد.');
  };

  const resetToSaved = () => {
    setMenus(settings.headerMenus || []);
    setDirty(false);
    setInsertParentId(undefined);
    setOpenSettings(new Set());
    showToast('تغییرات ذخیره‌نشده کنار گذاشته شد.', 'info');
  };

  const isMissing = (item: MenuItem) => {
    if (!item.sourceType || item.sourceType === 'custom' || item.sourceType === 'system') return false;
    if (!item.sourceId) return false;
    return !sourceMap.has(`${item.sourceType}:${item.sourceId}`);
  };

  const renderNode = (item: MenuItem, depth = 0): React.ReactNode => {
    const children = childrenOf(item.id);
    const siblings = childrenOf(item.parentId);
    const siblingIndex = siblings.findIndex(row => row.id === item.id);
    const settingsOpen = openSettings.has(item.id);
    const missing = isMissing(item);

    return (
      <div key={item.id} className="menu-tree-node-wrap" data-depth={depth}>
        <div
          className={`menu-tree-node ${draggingId === item.id ? 'is-dragging' : ''} ${insertParentId === item.id ? 'is-add-target' : ''} ${missing ? 'is-missing' : ''}`}
          draggable
          onDragStart={() => setDraggingId(item.id)}
          onDragEnd={() => setDraggingId(null)}
          onDragOver={event => event.preventDefault()}
          onDrop={event => handleDrop(item.id, event)}
        >
          <div className="menu-tree-node-main">
            <button type="button" className="menu-tree-grip" title="بکشید و جابه‌جا کنید">
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="menu-tree-level" title={`سطح ${depth + 1}`}>
              {depth + 1}
            </div>

            <div className="menu-tree-title-wrap">
              <input
                value={item.title}
                onChange={event => patchItem(item.id, { title: event.target.value })}
                className="menu-tree-title-input"
                aria-label="عنوان آیتم منو"
              />
              <div className="menu-tree-meta">
                <span>{sourceLabel(item.sourceType)}</span>
                {children.length > 0 && <span>{children.length.toLocaleString('fa-IR')} زیرمنو</span>}
                {item.kind === 'categories' && <span className="category-mega">مگامنوی «همه دسته‌بندی‌ها»</span>}
                {item.megaMenu?.enabled && <span className="mega">Mega Menu</span>}
                {item.isVisible === false && <span>مخفی</span>}
                {missing && <span className="missing"><AlertTriangle className="w-3 h-3" /> منبع حذف شده</span>}
              </div>
            </div>

            <div className="menu-tree-actions">
              <button type="button" onClick={() => chooseAsParent(item.id)} className={insertParentId === item.id ? 'active' : ''} title="افزودن زیرمنو">
                <Plus className="w-3.5 h-3.5" /><span>زیرمنو</span>
              </button>
              <button type="button" disabled={siblingIndex <= 0} onClick={() => moveSibling(item.id, 'up')} title="بالا"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button type="button" disabled={siblingIndex >= siblings.length - 1} onClick={() => moveSibling(item.id, 'down')} title="پایین"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button type="button" disabled={siblingIndex <= 0} onClick={() => indentItem(item.id)} title="یک سطح داخل"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button type="button" disabled={!item.parentId} onClick={() => outdentItem(item.id)} title="یک سطح بیرون"><ArrowRight className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => toggleSettings(item.id)} className={settingsOpen ? 'active' : ''} title="تنظیمات">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => deleteItem(item.id)} className="danger" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {settingsOpen && (
            <div className="menu-tree-settings">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <label>
                  <span>مقصد</span>
                  <input
                    value={item.link}
                    dir="ltr"
                    onChange={event => patchItem(item.id, {
                      link: event.target.value,
                      sourceType: item.sourceType === 'custom' ? 'custom' : undefined,
                      sourceId: undefined
                    })}
                  />
                </label>
                <label>
                  <span>Badge</span>
                  <input value={item.badge || ''} onChange={event => patchItem(item.id, { badge: event.target.value || undefined })} />
                </label>
                <label>
                  <span>CSS Class</span>
                  <input dir="ltr" value={item.cssClass || ''} onChange={event => patchItem(item.id, { cssClass: event.target.value || undefined })} />
                </label>
                <label>
                  <span>آیکن اختیاری</span>
                  <button type="button" onClick={() => setIconPickerItemId(item.id)} className="w-full min-h-9 px-2.5 border border-neutral-300 rounded-lg bg-white flex items-center justify-between gap-2 text-[10px]">
                    <span className="flex items-center gap-2">
                      <IconRenderer icon={item.icon || item.cssClass} className="w-4 h-4" />
                      {item.icon ? (iconClassFor(item.icon) || item.icon) : 'انتخاب آیکن'}
                    </span>
                    <span className="text-blue-600 font-bold">کتابخانه</span>
                  </button>
                </label>
              </div>

              <div className="menu-tree-checks">
                <label><input type="checkbox" checked={item.isVisible !== false} onChange={event => patchItem(item.id, { isVisible: event.target.checked })} /> نمایش</label>
                <label><input type="checkbox" checked={Boolean(item.openInNewTab)} onChange={event => patchItem(item.id, { openInNewTab: event.target.checked })} /> تب جدید</label>
                {item.originalTitle && item.title !== item.originalTitle && (
                  <button type="button" onClick={() => patchItem(item.id, { title: item.originalTitle })}>بازگردانی عنوان اصلی</button>
                )}
              </div>

              {!item.parentId && (
                <div className="menu-tree-mega">
                  <label className="menu-tree-mega-toggle">
                    <span>
                      <strong>Mega Menu</strong>
                      <small>فقط برای آیتم سطح اصلی. تمام زیرشاخه‌های این نود به‌صورت recursive نمایش داده می‌شوند.</small>
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
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label>
                          <span>تعداد ستون</span>
                          <select
                            value={item.megaMenu.columns || 4}
                            onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, columns: Number(event.target.value) } })}
                          >
                            {[2,3,4,5,6].map(count => <option key={count} value={count}>{count} ستون</option>)}
                          </select>
                        </label>
                        <label>
                          <span>عرض</span>
                          <select
                            value={item.megaMenu.width || 'boxed'}
                            onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, width: event.target.value as 'boxed' | 'full' } })}
                          >
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
                        <input value={item.megaMenu.bannerTitle || ''} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, bannerTitle: event.target.value } })} placeholder="عنوان بنر" />
                        <input dir="ltr" value={item.megaMenu.bannerLink || ''} onChange={event => patchItem(item.id, { megaMenu: { ...item.megaMenu!, bannerLink: event.target.value } })} placeholder="لینک بنر" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {children.length > 0 && (
          <div className="menu-tree-children">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const roots = childrenOf(undefined);
  const invalidCount = menus.filter(isMissing).length;
  const activeParent = insertParentId ? menus.find(item => item.id === insertParentId) : undefined;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-sm text-blue-950">فهرست اصلی سایت — Tree Editor</h4>
            <p className="text-[11px] text-blue-700 mt-1">
              تمام ساختار منو در همین صفحه دیده و ویرایش می‌شود. مگامنوی «همه دسته‌بندی‌ها» هم دقیقاً در همین درخت قرار دارد؛ هر ستون و هر لینک داخل آن یک نود قابل ویرایش است.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={rebuildCategoryMegaFromCatalog} className="px-3 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-black inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> ویرایش مگامنوی دسته‌بندی‌ها
            </button>
            <button type="button" onClick={syncBoundTitles} className="px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-800 text-xs font-bold inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> همگام‌سازی
            </button>
            {dirty && <button type="button" onClick={resetToSaved} className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-bold">لغو تغییرات</button>}
            <button type="button" onClick={saveMenu} disabled={!dirty} className="px-4 py-2 rounded-xl bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-black inline-flex items-center gap-1.5">
              <Save className="w-4 h-4" /> ذخیره فهرست
            </button>
          </div>
        </div>
        {invalidCount > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold inline-flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {invalidCount.toLocaleString('fa-IR')} آیتم به محتوایی اشاره می‌کند که حذف شده است.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-5 items-start">
        <aside ref={libraryRef} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden xl:sticky xl:top-4">
          <div className="p-4 border-b border-neutral-100">
            <h5 className="font-black text-sm text-neutral-900">افزودن به فهرست</h5>
            <p className="text-[10px] text-neutral-500 mt-1">محصول، صفحه، دسته یا هر محتوایی را انتخاب کن؛ لینک خودکار ساخته می‌شود.</p>
          </div>

          <div className="p-3 border-b border-neutral-100 bg-neutral-50">
            <label className="block text-[10px] font-bold text-neutral-600 mb-1">محل افزودن</label>
            <select
              value={insertParentId || ''}
              onChange={event => setInsertParentId(event.target.value || undefined)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white text-xs"
            >
              <option value="">سطح اصلی منو</option>
              {flatTree.map(({ item, depth }) => (
                <option key={item.id} value={item.id}>{'— '.repeat(depth + 1)}زیرِ {item.title}</option>
              ))}
            </select>
            {activeParent && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[9px]">
                <span className="text-blue-700 font-bold">آیتم جدید زیر «{activeParent.title}» می‌رود.</span>
                <button type="button" onClick={() => setInsertParentId(undefined)} className="text-neutral-500">سطح اصلی</button>
              </div>
            )}
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
                <span className="block text-[10px] font-bold mb-1">عنوان</span>
                <input value={customTitle} onChange={event => setCustomTitle(event.target.value)} className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs" />
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">URL یا مسیر داخلی</span>
                <input value={customUrl} onChange={event => setCustomUrl(event.target.value)} className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-mono text-left" dir="ltr" />
              </label>
              <button type="button" onClick={addCustom} className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-black inline-flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> افزودن
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
                <button type="button" onClick={() => setSelected(new Set(libraryOptions.map(option => option.key)))} className="text-[10px] font-bold text-blue-600">انتخاب همه</button>
                <button type="button" onClick={addSelected} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> افزودن
                </button>
              </div>
            </>
          )}
        </aside>

        <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5 min-h-[560px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h5 className="font-black text-sm text-neutral-900">نمودار درختی فهرست</h5>
              <p className="text-[10px] text-neutral-500 mt-1">
                Drop روی وسط یک نود = زیرمنو؛ بالای نود = قبل از آن؛ پایین نود = بعد از آن. عمق نامحدود است.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white border text-[10px] font-bold text-neutral-500">{menus.length.toLocaleString('fa-IR')} آیتم</span>
              <button type="button" onClick={() => chooseAsParent(undefined)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold ${!insertParentId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                افزودن به سطح اصلی
              </button>
            </div>
          </div>

          <div
            className="menu-tree-root-drop"
            onDragOver={event => event.preventDefault()}
            onDrop={dropToRoot}
          >
            رها کردن اینجا = انتقال به سطح اصلی
          </div>

          <div className="menu-tree-root">
            {roots.map(item => renderNode(item, 0))}
            {!roots.length && (
              <div className="min-h-[360px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-10 h-10 text-neutral-300" />
                <strong className="mt-3 text-sm text-neutral-600">فهرست خالی است</strong>
                <p className="mt-1 text-[10px] text-neutral-400">از ستون کناری محتوا را انتخاب و اضافه کن.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      {iconPickerItemId && (
        <div className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <IconPicker
              value={menus.find(item => item.id === iconPickerItemId)?.icon}
              onChange={(iconName) => {
                patchItem(iconPickerItemId, { icon: iconName });
                setIconPickerItemId(null);
              }}
              onClose={() => setIconPickerItemId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
