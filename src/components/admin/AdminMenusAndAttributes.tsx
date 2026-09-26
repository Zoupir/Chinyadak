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
  Tag
} from 'lucide-react';

export const AdminMenusAndAttributes: React.FC = () => {
  const { settings, updateSettings, showToast } = useStore();

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
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({ title: '', link: 'shop', badge: '' });
    setIsMenuModalOpen(true);
  };

  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
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
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            <span>مدیریت منوهای ناوبری و ویژگی‌های فنی قطعات</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            سفارشی‌سازی کامل منوی هدر سایت و ویژگی‌های فنی جدول مشخصات قطعات خودرو
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('menus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'menus'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>منوهای سایت ({menus.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('attributes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-bold">آیتم‌های منوی افقی بالای سایت:</span>
            <button
              onClick={handleOpenAddMenu}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آیتم جدید به منو</span>
            </button>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden text-xs">
            {menus.map((item, index) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-mono font-bold text-[11px]">
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
                    <span className="text-[11px] text-neutral-400 font-mono">مسیر مقصد: #{item.link}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditMenu(item)}
                    className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors"
                    title="ویرایش منو"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(item.id, item.title)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
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
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
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
                    className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteAttr(attr.id, attr.nameFa)}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: MENU ITEM ================= */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">
                {editingMenu ? 'ویرایش آیتم منو' : 'افزودن آیتم به منو'}
              </h4>
              <button onClick={() => setIsMenuModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان نمایشی منو:</label>
                <input
                  type="text"
                  value={menuForm.title}
                  onChange={e => setMenuForm({ ...menuForm, title: e.target.value })}
                  placeholder="مثال: قطعات مصرفی و فیلترها"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">لینک یا شناسه صفحه (Link Target):</label>
                <input
                  type="text"
                  value={menuForm.link}
                  onChange={e => setMenuForm({ ...menuForm, link: e.target.value })}
                  placeholder="shop یا blog یا part-request"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">نشان یا برچسب ویژه (Badge اختیاری):</label>
                <input
                  type="text"
                  value={menuForm.badge}
                  onChange={e => setMenuForm({ ...menuForm, badge: e.target.value })}
                  placeholder="مثال: جدید، تخفیف، فوری"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md"
                >
                  ذخیره آیتم
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
              <button onClick={() => setIsAttrModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttr} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">نام فارسی ویژگی:</label>
                <input
                  type="text"
                  value={attrForm.nameFa}
                  onChange={e => setAttrForm({ ...attrForm, nameFa: e.target.value })}
                  placeholder="مثال: نوع آلیاژ رادیاتور"
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
                  <option value="all">عمومی (تمام قطعات)</option>
                  <option value="engine">سیستم موتور و خنک‌کننده</option>
                  <option value="gearbox">گیربکس و انتقال قدرت</option>
                  <option value="body_chassis">بدنه و جلوبندی</option>
                  <option value="brake">ترمز و ایمنی</option>
                  <option value="electrical">برقی و الکترونیک</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">مقدار پیش‌فرض یا نمونه:</label>
                <input
                  type="text"
                  value={attrForm.defaultValue}
                  onChange={e => setAttrForm({ ...attrForm, defaultValue: e.target.value })}
                  placeholder="مثال: آلومینیوم دوجداره تقویت شده"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttrModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md"
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
