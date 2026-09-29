import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageSection } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadInput } from './ImageUploadInput';
import { Edit3, X, Save, Trash2, Eye, EyeOff, Plus, ArrowUp, ArrowDown } from 'lucide-react';

interface LiveSectionModalProps {
  pageSlug: string;
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveSectionModal: React.FC<LiveSectionModalProps> = ({
  pageSlug,
  sectionId,
  isOpen,
  onClose
}) => {
  const { pages, updateSection, deleteSection, showToast } = useStore();
  const currentPage = pages.find(p => p.slug === pageSlug);
  const currentSection = currentPage?.sections.find(s => s.id === sectionId);

  const [form, setForm] = useState<PageSection | null>(null);

  useEffect(() => {
    if (currentSection) {
      setForm({ ...currentSection });
    }
  }, [currentSection, isOpen]);

  if (!isOpen || !form) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }

    updateSection(pageSlug, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">ویرایش زنده بخش: {form.title || sectionId}</h3>
              <span className="text-[10px] text-neutral-400">برگه: {currentPage?.title || pageSlug}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold mb-1">عنوان اصلی بخش *:</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 border border-neutral-300 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">برچسب بالای تیتر (Badge):</label>
              <input
                type="text"
                value={form.badge || ''}
                onChange={e => setForm({ ...form, badge: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">زیرعنوان / خلاصه:</label>
              <input
                type="text"
                value={form.subtitle || ''}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
          </div>

          <ImageUploadInput
            label="تصویر این بخش:"
            value={form.imageUrl || ''}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            aspectRatio="banner"
            presetCategory="banners"
          />

          {form.imageUrl && (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <label className="block text-neutral-800 font-bold text-xs">
                حالت نمایش تصویر در سکشن (Display Mode):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'full', label: 'تمام‌عرض (فول)', desc: 'بنر کامل سراسری' },
                  { id: 'cover', label: 'کاور پس‌زمینه', desc: 'پوشش کل سکشن' },
                  { id: 'side', label: 'کنار متن', desc: 'ستون تصویر اختصاصی' },
                  { id: 'contain', label: 'بدون برش (کادر)', desc: 'درون کادر کامل' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setForm({ ...form, imageMode: mode.id as any })}
                    className={`p-2 rounded-lg border text-right transition-all cursor-pointer ${
                      (form.imageMode || 'side') === mode.id
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <strong className="block text-[11px] font-bold">{mode.label}</strong>
                    <span className="text-[9px] text-neutral-500">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div>
              <h4 className="font-black text-sm text-neutral-900">چیدمان حرفه‌ای بخش</h4>
              <p className="text-[10px] text-neutral-500 mt-1">عرض، ستون‌بندی، فاصله، رنگ، گردی، تعداد آیتم و اندازه تصاویر را بدون کدنویسی تنظیم کنید.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label>
                <span className="block text-[10px] font-bold mb-1">نوع چیدمان</span>
                <select value={form.layout || 'boxed'} onChange={e => setForm({ ...form, layout: e.target.value as PageSection['layout'] })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                  <option value="boxed">کادر استاندارد</option>
                  <option value="full">تمام‌عرض</option>
                  <option value="grid">شبکه‌ای</option>
                  <option value="split">دو بخشی</option>
                  <option value="cards">کارت‌ها</option>
                </select>
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">ستون دسکتاپ</span>
                <select value={form.desktopColumns || 3} onChange={e => setForm({ ...form, desktopColumns: Number(e.target.value) as PageSection['desktopColumns'] })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ستون</option>)}
                </select>
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">ستون موبایل</span>
                <select value={form.mobileColumns || 1} onChange={e => setForm({ ...form, mobileColumns: Number(e.target.value) as PageSection['mobileColumns'] })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ستون</option>)}
                </select>
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">تراز محتوا</span>
                <select value={form.contentAlign || 'right'} onChange={e => setForm({ ...form, contentAlign: e.target.value as PageSection['contentAlign'] })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                  <option value="right">راست</option>
                  <option value="center">وسط</option>
                  <option value="left">چپ</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                ['widthPercent','عرض %',20,100,100],
                ['maxWidthPx','حداکثر عرض px',0,2400,1280],
                ['borderRadiusPx','گردی سکشن',0,80,12],
                ['itemRadiusPx','گردی آیتم',0,80,10],
                ['gapPx','فاصله آیتم',0,80,16],
                ['paddingTopPx','فاصله بالا',0,180,28],
                ['paddingBottomPx','فاصله پایین',0,180,28],
                ['paddingInlinePx','فاصله طرفین',0,160,20],
                ['maxItems','حداکثر آیتم',0,50,0],
                ['imageSizePx','اندازه عکس',24,320,72]
              ].map(([key,label,min,max,fallback]) => (
                <label key={String(key)}>
                  <span className="block text-[10px] font-bold mb-1">{String(label)}</span>
                  <input type="number" min={Number(min)} max={Number(max)} value={Number((form as any)[String(key)] ?? fallback)} onChange={e => setForm({ ...form, [String(key)]: Number(e.target.value) } as PageSection)} className="w-full p-2 border border-neutral-300 rounded-lg bg-white font-mono" />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                <span className="text-[10px] font-bold">تمام‌عرض</span>
                <input type="checkbox" checked={Boolean(form.fullWidth)} onChange={e => setForm({ ...form, fullWidth: e.target.checked })} />
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">رنگ پس‌زمینه</span>
                <input type="color" value={form.backgroundColor || '#ffffff'} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} className="w-full h-10 p-1 border border-neutral-300 rounded-lg bg-white" />
              </label>
              <label>
                <span className="block text-[10px] font-bold mb-1">رنگ متن</span>
                <input type="color" value={form.textColor || '#111827'} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-full h-10 p-1 border border-neutral-300 rounded-lg bg-white" />
              </label>
            </div>
          </div>

          <RichTextEditor
            label="متن و توضیحات کامل این بخش:"
            value={form.content || ''}
            onChange={(val) => setForm({ ...form, content: val })}
            rows={4}
          />

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-sm text-neutral-900">آیتم‌های داخل بخش</h4>
                <p className="text-[10px] text-neutral-500">برای بنرهای چندتایی، برندها، نظر مشتریان، کارت‌ها و مزایا.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, items: [...(form.items || []), { id: `item-${Date.now()}`, title: '', subtitle: '', content: '', imageUrl: '', link: '', buttonText: '', isVisible: true, order: (form.items || []).length + 1 }] })}
                className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> افزودن آیتم
              </button>
            </div>
            <div className="space-y-2">
              {(form.items || []).map((item, index) => (
                <div key={item.id} className="p-3 bg-white border border-neutral-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-[10px] text-neutral-600">آیتم {index + 1}</strong>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={index === 0} onClick={() => {
                        const items = [...(form.items || [])];
                        [items[index - 1], items[index]] = [items[index], items[index - 1]];
                        setForm({ ...form, items: items.map((x,i) => ({ ...x, order: i + 1 })) });
                      }} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-30 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button type="button" disabled={index === (form.items || []).length - 1} onClick={() => {
                        const items = [...(form.items || [])];
                        [items[index + 1], items[index]] = [items[index], items[index + 1]];
                        setForm({ ...form, items: items.map((x,i) => ({ ...x, order: i + 1 })) });
                      }} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-30 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setForm({ ...form, items: (form.items || []).filter((_,i) => i !== index) })} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={item.title || ''} onChange={e => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, title: e.target.value } : x) })} placeholder="عنوان" className="p-2 border rounded-lg" />
                    <input value={item.subtitle || ''} onChange={e => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, subtitle: e.target.value } : x) })} placeholder="زیرعنوان" className="p-2 border rounded-lg" />
                    <input value={item.buttonText || ''} onChange={e => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, buttonText: e.target.value } : x) })} placeholder="متن دکمه" className="p-2 border rounded-lg" />
                    <input dir="ltr" value={item.link || ''} onChange={e => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, link: e.target.value } : x) })} placeholder="لینک" className="p-2 border rounded-lg text-left" />
                  </div>
                  <ImageUploadInput
                    label="تصویر / بنر آیتم"
                    value={item.imageUrl || ''}
                    onChange={(url) => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, imageUrl: url } : x) })}
                    aspectRatio="banner"
                    presetCategory="banners"
                  />
                  <textarea rows={2} value={item.content || ''} onChange={e => setForm({ ...form, items: (form.items || []).map((x,i) => i === index ? { ...x, content: e.target.value } : x) })} placeholder="متن آیتم" className="w-full p-2 border rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">متن دکمه:</label>
              <input
                type="text"
                value={form.buttonText || ''}
                onChange={e => setForm({ ...form, buttonText: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">لینک دکمه:</label>
              <input
                type="text"
                value={form.buttonLink || ''}
                onChange={e => setForm({ ...form, buttonLink: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="text-xs font-bold text-neutral-800">وضعیت نمایش در سایت:</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, isVisible: !form.isVisible })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                form.isVisible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {form.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{form.isVisible ? 'نمایش به مشتریان (فعال)' : 'مخفی از دید عموم'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                if (confirm(`آیا از حذف کامل سکشن "${form.title || 'انتخاب شده'}" اطمینان دارید؟`)) {
                  deleteSection(pageSlug, form.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 text-xs"
              title="حذف کامل این سکشن"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف سکشن</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 flex items-center justify-center gap-1.5 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات بخش</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
