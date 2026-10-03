import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { BannerCreative, BannerPlacementConfig, BannerPlacementKey } from '../../types';
import { BANNER_PLACEMENT_META, createBannerCreative, resolveBannerPlacements } from '../../utils/bannerPlacements';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { LinkDestinationPicker } from '../common/LinkDestinationPicker';

const BANNER_ITEM_DRAG_TYPE = 'application/x-chinyadak-banner-item';

const ASPECT_RATIOS = [
  ['16 / 4', 'عریض ۴:۱'], ['16 / 5', 'عریض ۳.۲:۱'], ['16 / 7', 'افقی ۱۶:۷'],
  ['16 / 9', 'واید ۱۶:۹'], ['4 / 3', 'چهار به سه'], ['1 / 1', 'مربع']
] as const;

export const AdminBannerPlacements: React.FC = () => {
  const { settings, pages, sliders, updateSettings, showToast } = useStore();
  const homePage = pages.find(page => page.slug === 'home');
  const stored = useMemo(
    () => resolveBannerPlacements(settings.bannerPlacements, homePage?.sections || [], sliders),
    [settings.bannerPlacements, homePage?.sections, sliders]
  );
  const [draft, setDraft] = useState<BannerPlacementConfig[]>(stored);
  const [selectedKey, setSelectedKey] = useState<BannerPlacementKey>('wide-banner-1');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(stored);
  }, [stored, dirty]);

  const selected = draft.find(placement => placement.key === selectedKey) || draft[0];
  const patchPlacement = (patch: Partial<BannerPlacementConfig>) => {
    setDirty(true);
    setDraft(current => current.map(placement => placement.key === selectedKey ? { ...placement, ...patch } : placement));
  };
  const patchItem = (id: string, patch: Partial<BannerCreative>) => {
    if (!selected) return;
    patchPlacement({ items: selected.items.map(item => item.id === id ? { ...item, ...patch } : item) });
  };
  const addItem = () => {
    if (!selected) return;
    patchPlacement({ items: [...selected.items, createBannerCreative(selected.items.length + 1)] });
  };
  const removeItem = (id: string) => {
    if (!selected) return;
    patchPlacement({ items: selected.items.filter(item => item.id !== id).map((item, index) => ({ ...item, order: index + 1 })) });
  };
  const reorderItems = (fromId: string, toId: string) => {
    if (!selected || fromId === toId) return;
    const items = [...selected.items].sort((a, b) => a.order - b.order);
    const from = items.findIndex(item => item.id === fromId);
    const to = items.findIndex(item => item.id === toId);
    if (from < 0 || to < 0) return;
    const [dragged] = items.splice(from, 1);
    items.splice(to, 0, dragged);
    patchPlacement({ items: items.map((item, index) => ({ ...item, order: index + 1 })) });
  };

  const reorderContent = (from: 'badge' | 'title' | 'subtitle' | 'button', to: 'badge' | 'title' | 'subtitle' | 'button', id: string) => {
    const item = selected?.items.find(row => row.id === id);
    const current = item?.contentOrder?.length ? [...item.contentOrder] : ['badge','title','subtitle','button'] as Array<'badge' | 'title' | 'subtitle' | 'button'>;
    const fromIndex = current.indexOf(from);
    const toIndex = current.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    const [entry] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, entry);
    patchItem(id, { contentOrder: current });
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    if (!selected) return;
    const items = [...selected.items].sort((a, b) => a.order - b.order);
    const from = items.findIndex(item => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;
    [items[from], items[to]] = [items[to], items[from]];
    patchPlacement({ items: items.map((item, index) => ({ ...item, order: index + 1 })) });
  };

  const save = async () => {
    if (draft.some(placement => placement.items.some(item => item.isVisible && !item.desktopImageUrl.trim()))) {
      showToast('برای هر بنر فعال، تصویر دسکتاپ انتخاب کنید یا آن بنر را غیرفعال کنید.', 'error');
      return;
    }
    setSaving(true);
    const ok = await updateSettings({ bannerPlacements: draft });
    setSaving(false);
    if (ok) setDirty(false);
  };

  if (!selected) return null;
  const tabFor = (meta: typeof BANNER_PLACEMENT_META[number]) => {
    const current = draft.find(item => item.key === meta.key);
    return { meta, current };
  };

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-3xl bg-neutral-950 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-blue-300 font-black">مدیریت مستقل بنرها</span>
          <h2 className="mt-1 text-xl font-black">جایگاه‌های بنر صفحهٔ اصلی</h2>
          <p className="mt-2 text-xs text-neutral-300 leading-6">هر جایگاه، تصویرها، ابعاد نمایشی و چینش مخصوص خودش را دارد. تغییرات پس از ذخیره در سایت اعمال می‌شوند.</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 text-white text-xs font-black inline-flex items-center justify-center gap-2 shrink-0">
          <Save className="w-4 h-4" />{saving ? 'در حال ذخیره...' : dirty ? 'ذخیره بنرها' : 'تغییری برای ذخیره نیست'}
        </button>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {BANNER_PLACEMENT_META.map(meta => {
          const { current } = tabFor(meta);
          const active = selectedKey === meta.key;
          return <button type="button" key={meta.key} onClick={() => setSelectedKey(meta.key)} className={`p-3 sm:p-4 rounded-2xl border text-right transition ${active ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-neutral-200 bg-white hover:border-neutral-400'}`}>
            <span className="flex items-center justify-between gap-2"><strong className="text-xs font-black">{meta.title}</strong>{current?.isVisible ? <Eye className="w-4 h-4 text-emerald-600"/> : <EyeOff className="w-4 h-4 text-neutral-400"/>}</span>
            <small className="block mt-2 text-[9px] text-neutral-500">{(current?.items || []).length.toLocaleString('fa-IR')} بنر • {meta.desktopAspectRatio}</small>
          </button>;
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
        <section className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-5 space-y-4">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div><h3 className="text-sm font-black">{selected.title}</h3><p className="text-[9px] text-neutral-400 mt-1">تصویر، مقصد کلیک و متن هر بنر را جداگانه تنظیم کن.</p></div>
            <button type="button" onClick={addItem} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black inline-flex items-center gap-1 shrink-0"><Plus className="w-3.5 h-3.5"/>افزودن بنر</button>
          </header>
          {!selected.items.length && <div className="p-10 border-2 border-dashed rounded-2xl text-center text-xs text-neutral-400">برای این جایگاه هنوز بنری تعریف نشده است.</div>}
          <div className="space-y-4">
            {[...selected.items].sort((a,b)=>a.order-b.order).map((item,index) => (
              <article key={item.id}
                onDragOver={event => { if (event.dataTransfer.types.includes(BANNER_ITEM_DRAG_TYPE)) event.preventDefault(); }}
                onDrop={event => {
                  if (!event.dataTransfer.types.includes(BANNER_ITEM_DRAG_TYPE)) return;
                  event.preventDefault();
                  event.stopPropagation();
                  reorderItems(event.dataTransfer.getData(BANNER_ITEM_DRAG_TYPE), item.id);
                }}
                className="rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="p-3 bg-neutral-50 border-b flex items-center gap-2">
                  <span
                    draggable
                    onDragStart={event => {
                      event.stopPropagation();
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData(BANNER_ITEM_DRAG_TYPE, item.id);
                    }}
                    title="برای جابه‌جایی بنر بکشید"
                    aria-label="جابه‌جایی بنر"
                    className="cursor-grab active:cursor-grabbing touch-none text-neutral-500"
                  ><GripVertical className="w-4 h-4" /></span>
                  <strong className="text-[10px] flex-1">بنر {index + 1}</strong>
                  <button type="button" title="انتقال به بالا" onClick={() => moveItem(item.id,-1)} className="w-8 h-8 rounded-lg bg-white border grid place-items-center"><ArrowUp className="w-3.5 h-3.5"/></button>
                  <button type="button" title="انتقال به پایین" onClick={() => moveItem(item.id,1)} className="w-8 h-8 rounded-lg bg-white border grid place-items-center"><ArrowDown className="w-3.5 h-3.5"/></button>
                  <button type="button" onClick={() => patchItem(item.id,{isVisible:!item.isVisible})} className={`w-8 h-8 rounded-lg grid place-items-center ${item.isVisible?'bg-emerald-50 text-emerald-700':'bg-neutral-200 text-neutral-500'}`}>{item.isVisible?<Eye className="w-3.5 h-3.5"/>:<EyeOff className="w-3.5 h-3.5"/>}</button>
                  <button type="button" title="حذف بنر" onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-700 grid place-items-center"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
                <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <ImageUploadInput label="تصویر دسکتاپ" value={item.desktopImageUrl} onChange={url=>patchItem(item.id,{desktopImageUrl:url})} aspectRatio="banner" presetCategory="banners" helperText="این تصویر در تبلت و دسکتاپ استفاده می‌شود." />
                    <ImageUploadInput label="تصویر موبایل (اختیاری)" value={item.mobileImageUrl || ''} onChange={url=>patchItem(item.id,{mobileImageUrl:url})} aspectRatio="video" presetCategory="banners" helperText="اگر خالی باشد، تصویر دسکتاپ با برش متناسب نمایش داده می‌شود." />
                  </div>
                  <div className="space-y-3">
                    <label className="block"><span className="block text-[10px] font-bold mb-1">عنوان داخلی / ALT</span><input value={item.title} onChange={e=>patchItem(item.id,{title:e.target.value,alt:item.alt===item.title?e.target.value:item.alt})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
                    <label className="block"><span className="block text-[10px] font-bold mb-1">متن جایگزین تصویر</span><input value={item.alt} onChange={e=>patchItem(item.id,{alt:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
                    <label className="block"><span className="block text-[10px] font-bold mb-1">متن کوتاه روی بنر (اختیاری)</span><input value={item.subtitle || ''} onChange={e=>patchItem(item.id,{subtitle:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
                    <label className="block"><span className="block text-[10px] font-bold mb-1">متن دکمه (اختیاری)</span><input value={item.buttonText || ''} onChange={e=>patchItem(item.id,{buttonText:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
                    <LinkDestinationPicker label="مقصد کلیک بنر" value={item.link} onChange={value=>patchItem(item.id,{link:value})} />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="block text-[9px] font-bold mb-1">تناسب تصویر</span><select value={item.imageFit} onChange={e=>patchItem(item.id,{imageFit:e.target.value as BannerCreative['imageFit']})} className="w-full p-2 border rounded-lg bg-white text-[10px]"><option value="cover">پوشش کادر با برش متناسب</option><option value="contain">نمایش کامل بدون برش</option></select></label>
                      <label className="block"><span className="block text-[9px] font-bold mb-1">تیرگی لایهٔ متن</span><input type="range" min="0" max="80" value={item.overlayOpacity} onChange={e=>patchItem(item.id,{overlayOpacity:Number(e.target.value)})} className="w-full mt-2"/></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="block text-[9px] font-bold mb-1">رنگ عنوان</span><input type="color" value={item.titleColor || '#ffffff'} onChange={e=>patchItem(item.id,{titleColor:e.target.value})} className="w-full h-9 p-1 border rounded-lg" /></label>
                      <label className="block"><span className="block text-[9px] font-bold mb-1">رنگ زیرعنوان</span><input type="color" value={item.subtitleColor || '#ffffff'} onChange={e=>patchItem(item.id,{subtitleColor:e.target.value})} className="w-full h-9 p-1 border rounded-lg" /></label>
                      <label className="block col-span-2"><span className="block text-[9px] font-bold mb-1">موقعیت متن</span><select value={item.textAlignment} onChange={e=>patchItem(item.id,{textAlignment:e.target.value as BannerCreative['textAlignment']})} className="w-full p-2 border rounded-lg bg-white text-[10px]"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                    </div>
                    <div className="rounded-xl border border-dashed border-neutral-300 p-3">
                      <strong className="text-[9px] block mb-2">ترتیب المان‌ها را بکشید و جابه‌جا کنید</strong>
                      <div className="flex flex-wrap gap-1.5">
                        {(['badge','title','subtitle','button'] as const).map((key, i) => {
                          const labels = { badge: 'نشان', title: 'عنوان', subtitle: 'زیرعنوان', button: 'دکمه' };
                          return <span key={key} draggable onDragStart={event => event.dataTransfer.setData('text/plain', key)}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => { event.preventDefault(); reorderContent(event.dataTransfer.getData('text/plain') as typeof key, key, item.id); }}
                            className="cursor-grab rounded-lg border bg-white px-2 py-1 text-[9px] font-bold">{i + 1}. {labels[key]}</span>;
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block col-span-2"><span className="block text-[9px] font-bold mb-1">موقعیت عمودی متن</span><select value={item.contentPosition || 'bottom'} onChange={e=>patchItem(item.id,{contentPosition:e.target.value as BannerCreative['contentPosition']})} className="w-full p-2 border rounded-lg bg-white text-[10px]"><option value="top">بالا</option><option value="center">وسط</option><option value="bottom">پایین</option></select></label>
                      <label className="block"><span className="block text-[9px] font-bold mb-1">اندازه عنوان: {item.titleFontSize || 28}px</span><input type="range" min="12" max="64" value={item.titleFontSize || 28} onChange={e=>patchItem(item.id,{titleFontSize:Number(e.target.value)})} className="w-full" /></label>
                      <label className="block"><span className="block text-[9px] font-bold mb-1">اندازه زیرعنوان: {item.subtitleFontSize || 14}px</span><input type="range" min="10" max="36" value={item.subtitleFontSize || 14} onChange={e=>patchItem(item.id,{subtitleFontSize:Number(e.target.value)})} className="w-full" /></label>

                    </div>
                    <div className="rounded-xl overflow-hidden border bg-neutral-100" style={{aspectRatio:selected.desktopAspectRatio}}>
                      {item.desktopImageUrl ? <div className="relative h-full w-full"><img src={item.desktopImageUrl} alt={item.alt} className="w-full h-full" style={{objectFit:item.imageFit}}/><div className="absolute inset-0 flex flex-col p-3" style={{justifyContent:item.contentPosition === 'top' ? 'flex-start' : item.contentPosition === 'center' ? 'center' : 'flex-end',background:`linear-gradient(0deg,rgba(0,0,0,${item.overlayOpacity/100}),transparent 78%)`,textAlign:item.textAlignment}}><strong className="text-xs" style={{color:item.titleColor || '#fff',fontSize:item.titleFontSize || 28}}>{item.title || 'پیش‌نمایش بنر'}</strong>{item.subtitle&&<span className="text-[9px] mt-1" style={{color:item.subtitleColor || '#fff',fontSize:item.subtitleFontSize || 14}}>{item.subtitle}</span>}</div></div> : <div className="h-full grid place-items-center text-[10px] text-neutral-400">انتخاب تصویر برای پیش‌نمایش</div>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-white rounded-3xl border border-neutral-200 p-4 space-y-4">
          <div><h3 className="text-sm font-black">تنظیمات همین جایگاه</h3><p className="text-[9px] text-neutral-400 mt-1">این گزینه‌ها فقط روی «{selected.title}» اثر دارند.</p></div>
          <button type="button" onClick={() => patchPlacement({isVisible:!selected.isVisible})} className={`w-full py-2.5 rounded-xl font-black text-xs ${selected.isVisible?'bg-emerald-50 text-emerald-700':'bg-neutral-100 text-neutral-500'}`}>{selected.isVisible?'جایگاه فعال است':'جایگاه غیرفعال است'} — تغییر وضعیت</button>
          <label className="block"><span className="block text-[10px] font-bold mb-1">عرض جایگاه</span><select value={selected.widthMode} onChange={e=>patchPlacement({widthMode:e.target.value as BannerPlacementConfig['widthMode']})} className="w-full p-2.5 border rounded-xl bg-white text-xs"><option value="full">تمام عرض (۱۰۰٪)</option><option value="container">داخل عرض محتوای سایت</option></select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="block text-[10px] font-bold mb-1">نسبت دسکتاپ</span><select value={selected.desktopAspectRatio} onChange={e=>patchPlacement({desktopAspectRatio:e.target.value})} className="w-full p-2 border rounded-xl bg-white text-[10px]">{ASPECT_RATIOS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block"><span className="block text-[10px] font-bold mb-1">نسبت موبایل</span><select value={selected.mobileAspectRatio} onChange={e=>patchPlacement({mobileAspectRatio:e.target.value})} className="w-full p-2 border rounded-xl bg-white text-[10px]">{ASPECT_RATIOS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="block text-[10px] font-bold mb-1">تعداد ستون دسکتاپ</span><select value={selected.desktopColumns} onChange={e=>patchPlacement({desktopColumns:Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-white text-xs">{[1,2,3,4].map(n=><option key={n} value={n}>{n} ستون</option>)}</select></label>
            <label className="block"><span className="block text-[10px] font-bold mb-1">تعداد ستون موبایل</span><select value={selected.mobileColumns} onChange={e=>patchPlacement({mobileColumns:Number(e.target.value)})} className="w-full p-2 border rounded-xl bg-white text-xs">{[1,2].map(n=><option key={n} value={n}>{n} ستون</option>)}</select></label>
          </div>
          <label className="block"><span className="block text-[10px] font-bold mb-1">فاصله بین بنرها: {selected.gapPx} پیکسل</span><input type="range" min="0" max="32" value={selected.gapPx} onChange={e=>patchPlacement({gapPx:Number(e.target.value)})} className="w-full"/></label>
          <div className="p-3 rounded-xl bg-blue-50 text-[9px] leading-5 text-blue-900">تصویرها با نسبت جایگاه و حالت «پوشش» یا «نمایش کامل» رندر می‌شوند؛ حالت کشیدن تصویر غیرفعال است تا عکس دفرمه نشود.</div>
        </aside>
      </div>
    </div>
  );
};
