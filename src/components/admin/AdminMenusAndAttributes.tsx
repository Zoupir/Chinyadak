import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { MenuItem, ProductAttributeDefinition } from '../../types';
import { 
  Menu, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ExternalLink, 
  Layers,
  Sparkles,
  Tag,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  Globe,
  Columns
} from 'lucide-react';

export const AdminMenusAndAttributes: React.FC = () => {
  const { settings, updateSettings, showToast, categories, pages } = useStore();

  const [activeSection, setActiveSection] = useState<'menus' | 'attributes'>('menus');

  // Menus State
  const [menus, setMenus] = useState<MenuItem[]>(settings.navigationMenus || [
    { id: 'm1', title: 'صفحه اصلی', link: 'home' },
    { id: 'm2', title: 'فروشگاه قطعات', link: 'shop' },
    { id: 'm3', title: 'قطعات مصرفی و سرویس دوره‌ای', link: 'shop:maintenance', badge: 'سرویس' },
    { id: 'm4', title: 'استعلام قطعه با شماره شاسی', link: 'part-request', badge: 'فوری' },
    { id: 'm5', title: 'مقالات و آموزش تعمیرات', link: 'blog' },
    { id: 'm6', title: 'گاراژ خودروهای من', link: 'account:garage' }
  ]);

  // Selected Category for Quick-Add
  const [quickAddCatSlug, setQuickAddCatSlug] = useState<string>(categories[0]?.slug || '');

  // Attributes State
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>(settings.productAttributes || [
    { id: 'attr-1', nameFa: 'شماره فنی اصلی (OEM)', category: 'all', defaultValue: 'استاندارد کارخانه' },
    { id: 'attr-2', nameFa: 'کد و حجم پیشرانه (سی‌سی)', category: 'engine', defaultValue: '1500 Turbo' },
    { id: 'attr-3', nameFa: 'نوع گیربکس (CVT/DCT/دستی)', category: 'gearbox', defaultValue: 'اتوماتیک دوکلاچه تر' },
    { id: 'attr-4', nameFa: 'موقعیت نصب در خودرو', category: 'body_chassis', defaultValue: 'جلوبندی و سیستم تعلیق' },
    { id: 'attr-5', nameFa: 'درجه استاندارد کیفی', category: 'all', defaultValue: 'Genuine شرکتی پلمپ' }
  ]);

  // Modal State for Menu
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuType, setMenuType] = useState<'category' | 'page' | 'system' | 'custom'>('system');
  const [menuForm, setMenuForm] = useState<{ title: string; link: string; badge: string }>({
    title: '',
    link: '',
    badge: ''
  });

  // Modal State for Attribute
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttributeDefinition | null>(null);
  const [attrForm, setAttrForm] = useState<{ nameFa: string; category: string; defaultValue: string }>({
    nameFa: '',
    category: 'all',
    defaultValue: ''
  });

  // --- Handlers for Menus ---
  const handleQuickAddCategory = () => {
    if (!quickAddCatSlug) return;
    const cat = categories.find(c => c.slug === quickAddCatSlug);
    if (!cat) return;

    // Check if already in menu
    const targetLink = `category:${cat.slug}`;
    if (menus.some(m => m.link === targetLink)) {
      showToast(`دسته‌بندی «${cat.nameFa}» قبلاً در منو قرار دارد.`, 'info');
      return;
    }

    const newItem: MenuItem = {
      id: `m-cat-${Date.now()}`,
      title: cat.nameFa,
      link: targetLink,
      badge: 'دسته'
    };

    const next = [...menus, newItem];
    setMenus(next);
    updateSettings({ navigationMenus: next });
    showToast(`دسته‌بندی «${cat.nameFa}» به صورت خودکار به منوی بالای سایت افزوده شد.`);
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const next = [...menus];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    setMenus(next);
    updateSettings({ navigationMenus: next });
  };

  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuType('system');
    setMenuForm({ title: '', link: 'shop', badge: '' });
    setIsMenuModalOpen(true);
  };

  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    if (menu.link.startsWith('category:')) {
      setMenuType('category');
    } else if (menu.link.startsWith('page:')) {
      setMenuType('page');
    } else if (menu.link.startsWith('http://') || menu.link.startsWith('https://')) {
      setMenuType('custom');
    } else {
      setMenuType('system');
    }
    setMenuForm({ title: menu.title, link: menu.link, badge: menu.badge || '' });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.title || !menuForm.link) {
      showToast('عنوان و لینک منو الزامی است.', 'error');
      return;
    }

    let updatedList: MenuItem[];
    if (editingMenu) {
      updatedList = menus.map(m => m.id === editingMenu.id ? { ...m, ...menuForm } : m);
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        title: menuForm.title,
        link: menuForm.link,
        badge: menuForm.badge || undefined
      };
      updatedList = [...menus, newItem];
    }
    setMenus(updatedList);
    updateSettings({ navigationMenus: updatedList });
    setIsMenuModalOpen(false);
    showToast('منوی ناوبری با موفقیت ذخیره شد.');
  };

  const handleDeleteMenu = (id: string, title: string) => {
    if (confirm(`آیا از حذف آیتم منو "${title}" اطمینان دارید؟`)) {
      const next = menus.filter(m => m.id !== id);
      setMenus(next);
      updateSettings({ navigationMenus: next });
      showToast('آیتم منو حذف شد.', 'info');
    }
  };

  // --- Handlers for Attributes ---
  const handleOpenAddAttr = () => {
    setEditingAttr(null);
    setAttrForm({ nameFa: '', category: 'all', defaultValue: '' });
    setIsAttrModalOpen(true);
  };

  const handleEditAttr = (attr: ProductAttributeDefinition) => {
    setEditingAttr(attr);
    setAttrForm({ nameFa: attr.nameFa, category: attr.category, defaultValue: attr.defaultValue || '' });
    setIsAttrModalOpen(true);
  };

  const handleSaveAttr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.nameFa) {
      showToast('نام ویژگی فنی الزامی است.', 'error');
      return;
    }

    let updatedList: ProductAttributeDefinition[];
    if (editingAttr) {
      updatedList = attributes.map(a => a.id === editingAttr.id ? { ...a, ...attrForm } : a);
    } else {
      const newAttr: ProductAttributeDefinition = {
        id: `attr-${Date.now()}`,
        nameFa: attrForm.nameFa,
        category: attrForm.category,
        defaultValue: attrForm.defaultValue || undefined
      };
      updatedList = [...attributes, newAttr];
    }
    setAttributes(updatedList);
    updateSettings({ productAttributes: updatedList });
    setIsAttrModalOpen(false);
    showToast('ویژگی فنی با موفقیت ذخیره گردید.');
  };

  const handleDeleteAttr = (id: string, name: string) => {
    if (confirm(`آیا از حذف ویژگی فنی "${name}" اطمینان دارید؟`)) {
      const next = attributes.filter(a => a.id !== id);
      setAttributes(next);
      updateSettings({ productAttributes: next });
      showToast('ویژگی فنی حذف گردید.', 'info');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      
      {/* Top Header */}
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            <span>مدیریت منوی بالای سایت (Header) و ویژگی‌های فنی قطعات</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            امکان افزودن خودکار دسته‌بندی‌ها به منو، حذف، تعیین ترتیب و تنظیم لینک‌های دلخواه داخلی یا اینترنتی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('menus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'menus'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>منوی بالای سایت ({menus.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('attributes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'attributes'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>ویژگی‌های فنی قطعات ({attributes.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MENUS */}
      {activeSection === 'menus' && (
        <div className="space-y-6">
          
          {/* Quick Add From Categories Box */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900">افزودن خودکار دسته‌بندی به منوی بالا:</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">دسته‌بندی مورد نظر را انتخاب کنید تا با یک کلیک به عنوان آیتم ناوبری هدر افزوده شود.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={quickAddCatSlug}
                onChange={e => setQuickAddCatSlug(e.target.value)}
                className="p-2 border border-neutral-300 rounded-xl text-xs bg-white flex-1 sm:w-56 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.nameFa} ({cat.nameEn})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleQuickAddCategory}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-red-500" />
                <span>+ افزودن به منو</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-bold">لیست آیتم‌های فعال در نوار ناوبری بالای سایت (با امکان تغییر ترتیب):</span>
            <button
              onClick={handleOpenAddMenu}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آیتم جدید دستی به منو</span>
            </button>
          </div>

          {/* Menus List with Reordering */}
          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden text-xs bg-white shadow-2xs">
            {menus.map((item, index) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Order Index */}
                  <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-mono font-bold text-[11px]">
                    {index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 text-sm">{item.title}</span>
                      {item.badge && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">مسیر مقصد: #{item.link}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveMenu(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-20 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveMenu(index, 'down')}
                    disabled={index === menus.length - 1}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-20 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-neutral-200 mx-1"></div>

                  {/* Edit */}
                  <button
                    onClick={() => handleEditMenu(item)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors cursor-pointer"
                    title="ویرایش منو"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteMenu(item.id, item.title)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors cursor-pointer"
                    title="حذف منو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SECTION 2: ATTRIBUTES */}
      {activeSection === 'attributes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-bold">فیلدها و ویژگی‌های فنی جدول مشخصات قطعات:</span>
            <button
              onClick={handleOpenAddAttr}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن ویژگی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {attributes.map(attr => (
              <div key={attr.id} className="p-4 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 bg-neutral-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-xs">{attr.nameFa}</span>
                    <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-mono">
                      {attr.category}
                    </span>
                  </div>
                  {attr.defaultValue && (
                    <span className="text-[11px] text-neutral-400 block">مقدار پیش‌فرض: {attr.defaultValue}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditAttr(attr)}
                    className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteAttr(attr.id, attr.nameFa)}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: MENU ITEM (SMART PICKER & CUSTOM LINK) ================= */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">
                {editingMenu ? 'ویرایش آیتم منو' : 'افزودن آیتم حرفه‌ای به منو'}
              </h4>
              <button onClick={() => setIsMenuModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3.5 text-xs">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">نوع لینک منو:</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuType('category');
                      if (categories[0]) {
                        setMenuForm({ ...menuForm, title: categories[0].nameFa, link: `category:${categories[0].slug}` });
                      }
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${menuType === 'category' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    دسته‌بندی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuType('page');
                      if (pages[0]) {
                        setMenuForm({ ...menuForm, title: pages[0].title, link: `page:${pages[0].slug}` });
                      }
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${menuType === 'page' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    برگه‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuType('system');
                      setMenuForm({ ...menuForm, title: 'فروشگاه قطعات', link: 'shop' });
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${menuType === 'system' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    سیستمی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuType('custom');
                      setMenuForm({ ...menuForm, link: 'https://' });
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${menuType === 'custom' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    دستی / وب
                  </button>
                </div>
              </div>

              {/* Dynamic Pickers */}
              {menuType === 'category' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">انتخاب دسته‌بندی قطعات:</label>
                  <select
                    onChange={(e) => {
                      const selected = categories.find(c => c.slug === e.target.value);
                      if (selected) {
                        setMenuForm({
                          ...menuForm,
                          title: selected.nameFa,
                          link: `category:${selected.slug}`
                        });
                      }
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>
                        {c.nameFa} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {menuType === 'page' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">انتخاب برگه سایت:</label>
                  <select
                    onChange={(e) => {
                      const selected = pages.find(p => p.slug === e.target.value);
                      if (selected) {
                        setMenuForm({
                          ...menuForm,
                          title: selected.title,
                          link: `page:${selected.slug}`
                        });
                      }
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    {pages.map(p => (
                      <option key={p.id} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {menuType === 'system' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">صفحه سیستمی پیش‌فرض:</label>
                  <select
                    onChange={(e) => {
                      const link = e.target.value;
                      const opt = e.target.options[e.target.selectedIndex];
                      setMenuForm({
                        ...menuForm,
                        title: opt ? opt.text : menuForm.title,
                        link
                      });
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    <option value="shop">فروشگاه قطعات</option>
                    <option value="shop:maintenance">قطعات مصرفی و سرویس دوره‌ای</option>
                    <option value="part-request">استعلام قطعه نایاب با شاسی</option>
                    <option value="tracking">پیگیری سفارش و مرسوله</option>
                    <option value="blog">مقالات و آموزش تعمیرات</option>
                    <option value="account:garage">گاراژ خودروهای من</option>
                    <option value="account">ورود یا حساب کاربری</option>
                    <option value="admin">پنل مدیریت انبار</option>
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان نمایشی منو *:</label>
                <input
                  type="text"
                  value={menuForm.title}
                  onChange={e => setMenuForm({ ...menuForm, title: e.target.value })}
                  placeholder="مثال: قطعات مصرفی و فیلترها"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              {/* Link Target Input */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  مسیر مقصد (Link Target) *:
                </label>
                <input
                  type="text"
                  value={menuForm.link}
                  onChange={e => setMenuForm({ ...menuForm, link: e.target.value })}
                  placeholder="shop یا category:cooling یا https://..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  dir="ltr"
                  required
                />
              </div>

              {/* Badge Input */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">نشان یا برچسب ویژه (Badge اختیاری):</label>
                <input
                  type="text"
                  value={menuForm.badge}
                  onChange={e => setMenuForm({ ...menuForm, badge: e.target.value })}
                  placeholder="مثال: جدید، تخفیف، فوری، سرویس"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  ذخیره آیتم منو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ATTRIBUTE ================= */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">
                {editingAttr ? 'ویرایش ویژگی فنی' : 'افزودن ویژگی فنی جدید'}
              </h4>
              <button onClick={() => setIsAttrModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttr} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">نام ویژگی فنی *:</label>
                <input
                  type="text"
                  value={attrForm.nameFa}
                  onChange={e => setAttrForm({ ...attrForm, nameFa: e.target.value })}
                  placeholder="مثال: نوع استاندارد آلیاژ سرسیلندر"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">دسته کاربرد (Category Scope):</label>
                <select
                  value={attrForm.category}
                  onChange={e => setAttrForm({ ...attrForm, category: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                >
                  <option value="all">عمومی (همه قطعات)</option>
                  <option value="engine">موتوری و متعلقات</option>
                  <option value="gearbox">گیربکس و انتقال قدرت</option>
                  <option value="brakes">سیستم ترمز</option>
                  <option value="suspension">جلوبندی و تعلیق</option>
                  <option value="cooling">سیستم خنک‌کاری</option>
                  <option value="electrical">برق و سنسورها</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">مقدار پیش‌فرض (اختیاری):</label>
                <input
                  type="text"
                  value={attrForm.defaultValue}
                  onChange={e => setAttrForm({ ...attrForm, defaultValue: e.target.value })}
                  placeholder="مثال: استاندارد OEM کارخانه"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttrModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  ذخیره ویژگی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
