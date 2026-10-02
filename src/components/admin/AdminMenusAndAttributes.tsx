import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PopularPartsBrandItem, ProductAttributeDefinition } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { AdminMenuBuilder } from './AdminMenuBuilder';
import { Car, Check, Edit3, Menu, Plus, Save, Sliders, Tag, Trash2, X } from 'lucide-react';

const defaultPopularPartsBrands: PopularPartsBrandItem[] = [
  { id: 'pb-bosch', title: 'BOSCH', subtitle: 'قطعات برقی و موتوری', imageUrl: '', link: 'shop', isVisible: true },
  { id: 'pb-mahle', title: 'MAHLE', subtitle: 'قطعات موتور', imageUrl: '', link: 'shop', isVisible: true },
  { id: 'pb-valeo', title: 'VALEO', subtitle: 'کلاچ و برق خودرو', imageUrl: '', link: 'shop', isVisible: true },
  { id: 'pb-skf', title: 'SKF', subtitle: 'بلبرینگ و متعلقات', imageUrl: '', link: 'shop', isVisible: true },
  { id: 'pb-ngk', title: 'NGK', subtitle: 'سیستم جرقه و شمع', imageUrl: '', link: 'shop', isVisible: true },
  { id: 'pb-castrol', title: 'Castrol', subtitle: 'روان‌کارها', imageUrl: '', link: 'shop', isVisible: true }
];

export const AdminMenusAndAttributes: React.FC = () => {
  const {
    settings, updateSettings, showToast, categories
  } = useStore();

  const [activeSection, setActiveSection] = useState<'menus' | 'brands' | 'attributes'>('menus');
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>(
    settings.productAttributes || []
  );
  const [popularBrands, setPopularBrands] = useState<PopularPartsBrandItem[]>(
    settings.popularPartsBrands?.length ? settings.popularPartsBrands : defaultPopularPartsBrands
  );

  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttributeDefinition | null>(null);
  const [attrForm, setAttrForm] = useState({
    nameFa: '',
    category: 'all',
    defaultValue: ''
  });

  useEffect(() => {
    setAttributes(settings.productAttributes || []);
  }, [settings.productAttributes]);

  useEffect(() => {
    setPopularBrands(settings.popularPartsBrands?.length ? settings.popularPartsBrands : defaultPopularPartsBrands);
  }, [settings.popularPartsBrands]);

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

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-neutral-100 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            فهرست‌ها، برندها و ویژگی‌های فروشگاه
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            فهرست سایت را مثل وردپرس بسازید؛ محتوا را انتخاب کنید و بدون نوشتن لینک در منو قرار دهید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveSection('menus')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'menus' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Menu className="w-4 h-4" /> فهرست اصلی
          </button>
          <button onClick={() => setActiveSection('brands')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'brands' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Car className="w-4 h-4" /> برندهای محبوب
          </button>
          <button onClick={() => setActiveSection('attributes')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeSection === 'attributes' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <Tag className="w-4 h-4" /> ویژگی‌های قطعات
          </button>
        </div>
      </div>

      {activeSection === 'menus' && <AdminMenuBuilder />}

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
