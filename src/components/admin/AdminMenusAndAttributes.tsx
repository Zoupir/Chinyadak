import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { HeaderMenuKind, MenuItem, PopularPartsBrandItem, ProductAttributeDefinition } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import {
  ArrowDown, ArrowUp, Car, Check, Edit3, Eye, EyeOff, Globe2, Layers,
  Link2, Menu, Plus, Save, Sliders, Tag, Trash2, X
} from 'lucide-react';

const defaultHeaderMenus = (legacy: MenuItem[] = []): MenuItem[] => [
  {
    id: 'header-categories',
    title: 'دسته‌بندی قطعات خودرو',
    link: 'shop',
    kind: 'categories',
    isVisible: true
  },
  {
    id: 'header-brands',
    title: 'برندهای خودرو',
    link: 'shop',
    kind: 'brands',
    isVisible: true
  },
  ...legacy.map(item => ({
    ...item,
    kind: item.kind || 'link' as HeaderMenuKind,
    isVisible: item.isVisible !== false
  }))
];

const systemOptions = [
  { link: 'home', title: 'صفحه اصلی' },
  { link: 'shop', title: 'فروشگاه قطعات' },
  { link: 'shop:maintenance', title: 'قطعات مصرفی و سرویس دوره‌ای' },
  { link: 'part-request', title: 'استعلام قطعه نایاب' },
  { link: 'tracking', title: 'پیگیری سفارش' },
  { link: 'blog', title: 'مقالات و آموزش' },
  { link: 'account:garage', title: 'گاراژ خودروهای من' },
  { link: 'account:wishlist', title: 'علاقه‌مندی‌ها' }
];

const defaultPopularPartsBrands: PopularPartsBrandItem[] = [
  { id: 'pb-bosch', title: 'BOSCH', subtitle: 'Bosch Mobility', imageUrl: 'https://www.google.com/s2/favicons?domain=bosch.com&sz=128', link: 'shop', isVisible: true },
  { id: 'pb-mahle', title: 'MAHLE', subtitle: 'Engine Components', imageUrl: 'https://www.google.com/s2/favicons?domain=mahle.com&sz=128', link: 'shop', isVisible: true },
  { id: 'pb-valeo', title: 'VALEO', subtitle: 'Clutch & Electrical', imageUrl: 'https://www.google.com/s2/favicons?domain=valeo.com&sz=128', link: 'shop', isVisible: true },
  { id: 'pb-skf', title: 'SKF', subtitle: 'Bearings', imageUrl: 'https://www.google.com/s2/favicons?domain=skf.com&sz=128', link: 'shop', isVisible: true },
  { id: 'pb-ngk', title: 'NGK', subtitle: 'Ignition', imageUrl: 'https://www.google.com/s2/favicons?domain=ngkntk.com&sz=128', link: 'shop', isVisible: true },
  { id: 'pb-castrol', title: 'Castrol', subtitle: 'Lubricants', imageUrl: 'https://www.google.com/s2/favicons?domain=castrol.com&sz=128', link: 'shop', isVisible: true }
];

export const AdminMenusAndAttributes: React.FC = () => {
  const {
    settings, updateSettings, showToast, categories, brands, pages
  } = useStore();

  const [activeSection, setActiveSection] = useState<'menus' | 'brands' | 'attributes'>('menus');
  const [menus, setMenus] = useState<MenuItem[]>(
    settings.headerMenus?.length
      ? settings.headerMenus
      : defaultHeaderMenus(settings.navigationMenus || [])
  );
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>(
    settings.productAttributes || []
  );
  const [popularBrands, setPopularBrands] = useState<PopularPartsBrandItem[]>(
    settings.popularPartsBrands?.length ? settings.popularPartsBrands : defaultPopularPartsBrands
  );

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuType, setMenuType] = useState<HeaderMenuKind>('system');
  const [menuForm, setMenuForm] = useState<MenuItem>({
    id: '',
    title: '',
    link: 'shop',
    kind: 'system',
    badge: '',
    isVisible: true,
    openInNewTab: false
  });

  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttributeDefinition | null>(null);
  const [attrForm, setAttrForm] = useState({
    nameFa: '',
    category: 'all',
    defaultValue: ''
  });

  useEffect(() => {
    const next = settings.headerMenus?.length
      ? settings.headerMenus
      : defaultHeaderMenus(settings.navigationMenus || []);
    setMenus(next);
  }, [settings.headerMenus, settings.navigationMenus]);

  useEffect(() => {
    setAttributes(settings.productAttributes || []);
  }, [settings.productAttributes]);

  useEffect(() => {
    setPopularBrands(settings.popularPartsBrands?.length ? settings.popularPartsBrands : defaultPopularPartsBrands);
  }, [settings.popularPartsBrands]);

  const visibleCount = useMemo(
    () => menus.filter(item => item.isVisible !== false).length,
    [menus]
  );

  const persistMenus = (next: MenuItem[], toast?: string) => {
    setMenus(next);
    updateSettings({ headerMenus: next });
    if (toast) showToast(toast);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= menus.length) return;
    const next = [...menus];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    persistMenus(next);
  };

  const toggleVisibility = (id: string) => {
    persistMenus(
      menus.map(item =>
        item.id === id ? { ...item, isVisible: item.isVisible === false } : item
      )
    );
  };

  const openNewMenu = (parentId?: string) => {
    setEditingMenu(null);
    setMenuType('system');
    setMenuForm({
      id: '',
      title: 'فروشگاه قطعات',
      link: 'shop',
      kind: 'system',
      badge: '',
      isVisible: true,
      openInNewTab: false,
      parentId
    });
    setIsMenuModalOpen(true);
  };

  const openEditMenu = (item: MenuItem) => {
    const kind = item.kind || (
      item.link.startsWith('category:') ? 'category' :
      item.link.startsWith('car-brand:') ? 'brand' :
      item.link.startsWith('page:') ? 'page' :
      /^https?:\/\//.test(item.link) ? 'custom' : 'system'
    );
    setEditingMenu(item);
    setMenuType(kind);
    setMenuForm({
      ...item,
      kind,
      isVisible: item.isVisible !== false,
      openInNewTab: Boolean(item.openInNewTab)
    });
    setIsMenuModalOpen(true);
  };

  const chooseMenuType = (kind: HeaderMenuKind) => {
    setMenuType(kind);
    if (kind === 'categories') {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: prev.title || 'دسته‌بندی قطعات خودرو',
        link: 'shop'
      }));
    } else if (kind === 'brands') {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: prev.title || 'برندهای خودرو',
        link: 'shop'
      }));
    } else if (kind === 'category' && categories[0]) {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: categories[0].nameFa,
        link: 'category:' + categories[0].slug
      }));
    } else if (kind === 'brand' && brands[0]) {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: brands[0].nameFa,
        link: 'car-brand:' + brands[0].slug
      }));
    } else if (kind === 'page' && pages[0]) {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: pages[0].title,
        link: 'page:' + pages[0].slug
      }));
    } else if (kind === 'custom') {
      setMenuForm(prev => ({ ...prev, kind, link: 'https://' }));
    } else if (kind === 'system') {
      setMenuForm(prev => ({
        ...prev,
        kind,
        title: 'فروشگاه قطعات',
        link: 'shop'
      }));
    }
  };

  const saveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const title = String(menuForm.title || '').trim();
    const link = String(menuForm.link || '').trim();
    if (!title || !link) {
      showToast('عنوان و مقصد منو الزامی است.', 'error');
      return;
    }

    if (
      !editingMenu &&
      (menuType === 'categories' || menuType === 'brands') &&
      menus.some(item => item.kind === menuType)
    ) {
      showToast(
        menuType === 'categories'
          ? 'منوی اصلی دسته‌بندی‌ها از قبل وجود دارد.'
          : 'منوی اصلی برندها از قبل وجود دارد.',
        'error'
      );
      return;
    }

    const item: MenuItem = {
      ...menuForm,
      id: editingMenu?.id || 'header-' + Date.now(),
      title,
      link,
      kind: menuType,
      badge: String(menuForm.badge || '').trim() || undefined,
      isVisible: menuForm.isVisible !== false,
      openInNewTab: menuType === 'custom' ? Boolean(menuForm.openInNewTab) : false
    };

    const next = editingMenu
      ? menus.map(row => row.id === editingMenu.id ? item : row)
      : [...menus, item];

    persistMenus(next, 'منوی بالای سایت ذخیره شد.');
    setIsMenuModalOpen(false);
  };

  const deleteMenu = (item: MenuItem) => {
    const childCount = menus.filter(row => row.parentId === item.id).length;
    if (!confirm(childCount
      ? `آیتم «${item.title}» و ${childCount} زیرمنوی آن حذف شود؟`
      : `آیتم «${item.title}» حذف شود؟`)) return;
    persistMenus(
      menus.filter(row => row.id !== item.id && row.parentId !== item.id),
      'آیتم منو حذف شد.'
    );
  };

  const persistPopularBrands = (next: PopularPartsBrandItem[], message = 'برندهای محبوب ذخیره شدند.') => {
    setPopularBrands(next);
    updateSettings({ popularPartsBrands: next });
    showToast(message);
  };

  const updatePopularBrand = (id: string, patch: Partial<PopularPartsBrandItem>) => {
    setPopularBrands(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const savePopularBrands = () => persistPopularBrands(popularBrands);

  const addPopularBrand = () => {
    setPopularBrands(prev => [
      ...prev,
      {
        id: 'popular-brand-' + Date.now(),
        title: 'برند جدید',
        subtitle: 'توضیح کوتاه',
        imageUrl: '',
        link: 'shop',
        isVisible: true
      }
    ]);
  };

  const orderedMenus = useMemo(() => {
    const roots = menus.filter(item => !item.parentId);
    const rows: Array<{ item: MenuItem; depth: number }> = [];
    roots.forEach(root => {
      rows.push({ item: root, depth: 0 });
      menus.filter(child => child.parentId === root.id).forEach(child => rows.push({ item: child, depth: 1 }));
    });
    menus.filter(item => item.parentId && !menus.some(parent => parent.id === item.parentId))
      .forEach(item => rows.push({ item, depth: 0 }));
    return rows;
  }, [menus]);

  const restoreDefaultMenus = () => {
    if (!confirm('چیدمان منوی بالا به حالت استاندارد برگردد؟')) return;
    const next: MenuItem[] = [
      { id: 'header-categories', title: 'دسته‌بندی قطعات خودرو', link: 'shop', kind: 'categories', isVisible: true },
      { id: 'header-brands', title: 'برندهای خودرو', link: 'shop', kind: 'brands', isVisible: true },
      { id: 'header-maintenance', title: 'سرویس دوره‌ای', link: 'shop:maintenance', kind: 'system', badge: 'سرویس', isVisible: true },
      { id: 'header-request', title: 'استعلام قطعه', link: 'part-request', kind: 'system', badge: 'فوری', isVisible: true },
      { id: 'header-blog', title: 'مقالات و آموزش', link: 'blog', kind: 'system', isVisible: true }
    ];
    persistMenus(next, 'چیدمان استاندارد منو بازیابی شد.');
  };

  const saveAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.nameFa.trim()) {
      showToast('نام ویژگی الزامی است.', 'error');
      return;
    }
    const item: ProductAttributeDefinition = {
      id: editingAttr?.id || 'attr-' + Date.now(),
      nameFa: attrForm.nameFa.trim(),
      category: attrForm.category,
      defaultValue: attrForm.defaultValue.trim() || undefined
    };
    const next = editingAttr
      ? attributes.map(row => row.id === editingAttr.id ? item : row)
      : [...attributes, item];
    setAttributes(next);
    updateSettings({ productAttributes: next });
    setIsAttrModalOpen(false);
    showToast('ویژگی فنی ذخیره شد.');
  };

  const typeLabel = (item: MenuItem) => {
    const kind = item.kind || 'link';
    const map: Record<string, string> = {
      categories: 'مگامنو دسته‌بندی‌ها',
      brands: 'منوی برندها',
      category: 'دسته‌بندی مستقیم',
      brand: 'برند مستقیم',
      page: 'برگه',
      system: 'صفحه سیستمی',
      custom: 'لینک خارجی',
      link: 'لینک'
    };
    return map[kind] || kind;
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-neutral-100 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            مدیریت کامل Header و ویژگی‌های فنی
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            عنوان، ترتیب، نمایش و مقصد همه منوهای بالای سایت—including دسته‌بندی قطعات و برندهای خودرو—از اینجا کنترل می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveSection('menus')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'menus' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Menu className="w-4 h-4" /> منوها و زیرمنوها ({visibleCount}/{menus.length})
          </button>
          <button onClick={() => setActiveSection('brands')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'brands' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Car className="w-4 h-4" /> برندهای محبوب
          </button>
          <button onClick={() => setActiveSection('attributes')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'attributes' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Tag className="w-4 h-4" /> ویژگی‌های قطعات
          </button>
        </div>
      </div>

      {activeSection === 'menus' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-black text-sm text-blue-950">Header واقعاً داینامیک است</div>
              <div className="text-[11px] text-blue-700 mt-1">
                «دسته‌بندی قطعات» و «برندهای خودرو» دیگر هاردکد نیستند؛ می‌توانید نامشان را تغییر دهید، جابه‌جا یا مخفی کنید.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={restoreDefaultMenus} className="px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-800 text-xs font-bold">
                بازیابی استاندارد
              </button>
              <button onClick={() => openNewMenu()} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> افزودن آیتم
              </button>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 overflow-hidden">
            {orderedMenus.map(({ item, depth }, index) => (
              <div key={item.id} className={`p-4 flex items-center gap-3 ${depth ? 'mr-8 border-r-4 border-blue-100' : ''} ${item.isVisible === false ? 'bg-neutral-50 opacity-60' : 'bg-white'}`}>
                <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-mono text-[10px] font-black shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-center flex-wrap">
                    <b className="text-sm text-neutral-900">{item.title}</b>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-[9px] font-bold">{typeLabel(item)}</span>
                    {item.badge && <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] font-bold">{item.badge}</span>}
                    {item.isVisible === false && <span className="text-[9px] text-neutral-500">مخفی</span>}
                    {item.parentId && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-bold">زیرمنو</span>}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    <span className="font-mono ltr inline-block">{item.link}</span>
                    {item.parentId && <span className="mr-2 text-blue-600">والد: {menus.find(x => x.id === item.parentId)?.title || 'نامشخص'}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => handleMove(index, 'down')} disabled={index === menus.length - 1} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => toggleVisibility(item.id)} className="p-2 rounded-lg hover:bg-neutral-100" title={item.isVisible === false ? 'نمایش' : 'مخفی کردن'}>
                    {item.isVisible === false ? <EyeOff className="w-4 h-4 text-neutral-500" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                  </button>
                  {!item.parentId && <button onClick={() => openNewMenu(item.id)} className="p-2 rounded-lg hover:bg-emerald-50" title="افزودن زیرمنو"><Plus className="w-4 h-4 text-emerald-600" /></button>}
                  <button onClick={() => openEditMenu(item)} className="p-2 rounded-lg hover:bg-blue-50"><Edit3 className="w-4 h-4 text-blue-600" /></button>
                  <button onClick={() => deleteMenu(item)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>
            ))}
            {!menus.length && <div className="p-10 text-center text-xs text-neutral-400">هیچ آیتمی در Header وجود ندارد.</div>}
          </div>
        </div>
      )}

      {activeSection === 'brands' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-black text-sm text-amber-950">برندهای محبوب قطعات در صفحه اصلی</div>
              <div className="text-[11px] text-amber-800 mt-1">نام، توضیح، عکس/لوگو و لینک هر برند را می‌توانید تغییر دهید. تصاویر قابل آپلود از همین پنل هستند.</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addPopularBrand} className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> افزودن برند
              </button>
              <button type="button" onClick={savePopularBrands} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-black flex items-center gap-1.5">
                <Save className="w-4 h-4" /> ذخیره تغییرات
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {popularBrands.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-neutral-200 p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm">برند #{index + 1}</b>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] flex items-center gap-1">
                      <input type="checkbox" checked={item.isVisible !== false} onChange={e => updatePopularBrand(item.id, { isVisible: e.target.checked })} />
                      نمایش
                    </label>
                    <button type="button" onClick={() => setPopularBrands(prev => prev.filter(x => x.id !== item.id))} className="p-2 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-xs">
                    <span className="font-bold block mb-1">نام برند</span>
                    <input value={item.title} onChange={e => updatePopularBrand(item.id, { title: e.target.value })} className="w-full p-2.5 border rounded-xl" />
                  </label>
                  <label className="text-xs">
                    <span className="font-bold block mb-1">توضیح کوتاه</span>
                    <input value={item.subtitle || ''} onChange={e => updatePopularBrand(item.id, { subtitle: e.target.value })} className="w-full p-2.5 border rounded-xl" />
                  </label>
                </div>

                <label className="text-xs block">
                  <span className="font-bold block mb-1">لینک مقصد</span>
                  <input value={item.link} onChange={e => updatePopularBrand(item.id, { link: e.target.value })} className="w-full p-2.5 border rounded-xl font-mono text-left" dir="ltr" />
                </label>

                <ImageUploadInput
                  label="لوگو / تصویر برند"
                  value={item.imageUrl}
                  onChange={url => updatePopularBrand(item.id, { imageUrl: url })}
                  aspectRatio="square"
                  presetCategory="logos"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'attributes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">ویژگی‌هایی که برای مشخصات فنی قطعات استفاده می‌شوند.</span>
            <button onClick={() => { setEditingAttr(null); setAttrForm({ nameFa: '', category: 'all', defaultValue: '' }); setIsAttrModalOpen(true); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" /> ویژگی جدید
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {attributes.map(attr => (
              <div key={attr.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <div className="flex-1">
                  <b className="text-xs">{attr.nameFa}</b>
                  <div className="text-[10px] text-neutral-400 mt-1">{attr.category} {attr.defaultValue ? '— ' + attr.defaultValue : ''}</div>
                </div>
                <button onClick={() => { setEditingAttr(attr); setAttrForm({ nameFa: attr.nameFa, category: attr.category, defaultValue: attr.defaultValue || '' }); setIsAttrModalOpen(true); }} className="p-2"><Edit3 className="w-4 h-4 text-blue-600" /></button>
                <button onClick={() => { if (confirm('این ویژگی حذف شود؟')) { const next = attributes.filter(x => x.id !== attr.id); setAttributes(next); updateSettings({ productAttributes: next }); } }} className="p-2"><Trash2 className="w-4 h-4 text-red-600" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h4 className="font-black">{editingMenu ? 'ویرایش آیتم Header' : 'افزودن آیتم Header'}</h4>
                <p className="text-[10px] text-neutral-500 mt-1">هر آیتم می‌تواند مگامنو، برند، دسته‌بندی، برگه، صفحه سیستمی یا لینک خارجی باشد.</p>
              </div>
              <button onClick={() => setIsMenuModalOpen(false)} className="p-2 rounded-full bg-neutral-100"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={saveMenu} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-2">نوع آیتم</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ['categories', 'مگامنو دسته‌ها', Layers],
                    ['brands', 'منوی برندها', Car],
                    ['category', 'یک دسته‌بندی', Layers],
                    ['brand', 'یک برند', Car],
                    ['page', 'برگه', Link2],
                    ['system', 'سیستمی', Menu],
                    ['custom', 'لینک خارجی', Globe2]
                  ].map(([kind, label, Icon]: any) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => chooseMenuType(kind)}
                      className={`p-3 rounded-xl border text-center font-bold ${menuType === kind ? 'border-red-500 bg-red-50 text-red-700' : 'border-neutral-200'}`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {menuType === 'category' && (
                <label className="block">
                  <span className="font-bold text-neutral-700 block mb-1">دسته‌بندی</span>
                  <select
                    value={menuForm.link.replace('category:', '')}
                    onChange={e => {
                      const item = categories.find(x => x.slug === e.target.value);
                      if (item) setMenuForm(prev => ({ ...prev, title: item.nameFa, link: 'category:' + item.slug }));
                    }}
                    className="w-full p-3 border rounded-xl"
                  >
                    {categories.map(item => <option key={item.id} value={item.slug}>{item.nameFa}</option>)}
                  </select>
                </label>
              )}

              {menuType === 'brand' && (
                <label className="block">
                  <span className="font-bold text-neutral-700 block mb-1">برند خودرو</span>
                  <select
                    value={menuForm.link.replace('car-brand:', '')}
                    onChange={e => {
                      const item = brands.find(x => x.slug === e.target.value);
                      if (item) setMenuForm(prev => ({ ...prev, title: item.nameFa, link: 'car-brand:' + item.slug }));
                    }}
                    className="w-full p-3 border rounded-xl"
                  >
                    {brands.map(item => <option key={item.id} value={item.slug}>{item.nameFa} ({item.nameEn})</option>)}
                  </select>
                </label>
              )}

              {menuType === 'page' && (
                <label className="block">
                  <span className="font-bold text-neutral-700 block mb-1">برگه</span>
                  <select
                    value={menuForm.link.replace('page:', '')}
                    onChange={e => {
                      const item = pages.find(x => x.slug === e.target.value);
                      if (item) setMenuForm(prev => ({ ...prev, title: item.title, link: 'page:' + item.slug }));
                    }}
                    className="w-full p-3 border rounded-xl"
                  >
                    {pages.map(item => <option key={item.id} value={item.slug}>{item.title}</option>)}
                  </select>
                </label>
              )}

              {menuType === 'system' && (
                <label className="block">
                  <span className="font-bold text-neutral-700 block mb-1">صفحه سیستمی</span>
                  <select
                    value={menuForm.link}
                    onChange={e => {
                      const item = systemOptions.find(x => x.link === e.target.value);
                      if (item) setMenuForm(prev => ({ ...prev, title: item.title, link: item.link }));
                    }}
                    className="w-full p-3 border rounded-xl"
                  >
                    {systemOptions.map(item => <option key={item.link} value={item.link}>{item.title}</option>)}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="font-bold text-neutral-700 block mb-1">ساختار منو / والد</span>
                <select
                  value={menuForm.parentId || ''}
                  onChange={e => setMenuForm(prev => ({ ...prev, parentId: e.target.value || undefined }))}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="">آیتم اصلی منو</option>
                  {menus
                    .filter(item => !item.parentId && item.id !== editingMenu?.id)
                    .map(item => <option key={item.id} value={item.id}>↳ زیرمنوی «{item.title}»</option>)}
                </select>
                <span className="text-[10px] text-neutral-400 mt-1 block">مثل منوی وردپرس: با انتخاب والد، این آیتم داخل Dropdown همان منو قرار می‌گیرد.</span>
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <span className="font-bold text-neutral-700 block mb-1">عنوان نمایش داده‌شده</span>
                  <input value={menuForm.title} onChange={e => setMenuForm(prev => ({ ...prev, title: e.target.value }))} className="w-full p-3 border rounded-xl" />
                </label>
                <label>
                  <span className="font-bold text-neutral-700 block mb-1">Badge اختیاری</span>
                  <input value={menuForm.badge || ''} onChange={e => setMenuForm(prev => ({ ...prev, badge: e.target.value }))} placeholder="مثلاً جدید / فوری" className="w-full p-3 border rounded-xl" />
                </label>
              </div>

              {menuType === 'custom' && (
                <label className="block">
                  <span className="font-bold text-neutral-700 block mb-1">URL</span>
                  <input dir="ltr" value={menuForm.link} onChange={e => setMenuForm(prev => ({ ...prev, link: e.target.value }))} className="w-full p-3 border rounded-xl text-left font-mono" />
                </label>
              )}

              <div className="grid sm:grid-cols-2 gap-2">
                <label className="p-3 rounded-xl border flex items-center gap-2">
                  <input type="checkbox" checked={menuForm.isVisible !== false} onChange={e => setMenuForm(prev => ({ ...prev, isVisible: e.target.checked }))} />
                  <span className="font-bold">نمایش در Header</span>
                </label>
                {menuType === 'custom' && (
                  <label className="p-3 rounded-xl border flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(menuForm.openInNewTab)} onChange={e => setMenuForm(prev => ({ ...prev, openInNewTab: e.target.checked }))} />
                    <span className="font-bold">باز شدن در تب جدید</span>
                  </label>
                )}
              </div>

              <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> ذخیره منوی Header
              </button>
            </form>
          </div>
        </div>
      )}

      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-3">
              <b>{editingAttr ? 'ویرایش ویژگی' : 'ویژگی جدید'}</b>
              <button onClick={() => setIsAttrModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveAttribute} className="space-y-3 mt-4 text-xs">
              <input value={attrForm.nameFa} onChange={e => setAttrForm({ ...attrForm, nameFa: e.target.value })} placeholder="نام ویژگی" className="w-full p-3 border rounded-xl" />
              <select value={attrForm.category} onChange={e => setAttrForm({ ...attrForm, category: e.target.value })} className="w-full p-3 border rounded-xl">
                <option value="all">همه دسته‌ها</option>
                {categories.map(item => <option key={item.id} value={item.slug}>{item.nameFa}</option>)}
              </select>
              <input value={attrForm.defaultValue} onChange={e => setAttrForm({ ...attrForm, defaultValue: e.target.value })} placeholder="مقدار پیش‌فرض" className="w-full p-3 border rounded-xl" />
              <button className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> ذخیره</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
