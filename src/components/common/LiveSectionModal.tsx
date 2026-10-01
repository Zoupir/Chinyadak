import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageSection, PageSectionItem } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadInput } from './ImageUploadInput';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Columns3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  GripVertical,
  LayoutPanelLeft,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react';

interface LiveSectionModalProps {
  pageSlug: string;
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
}

type InspectorTab = 'content' | 'layout' | 'style' | 'items';

const makeItem = (order: number): PageSectionItem => ({
  id: `item-${Date.now()}-${order}-${Math.random().toString(36).slice(2,7)}`,
  title: '',
  subtitle: '',
  content: '',
  imageUrl: '',
  link: '',
  buttonText: '',
  isVisible: true,
  order
});

const autoRepeaterSection = (section: PageSection) =>
  Boolean(section.items?.length) ||
  /promo|banner|testimonial|brand|manufacturer|service|feature|benefit|logo/i.test(section.sectionKey || '');

export const LiveSectionModal: React.FC<LiveSectionModalProps> = ({
  pageSlug,
  sectionId,
  isOpen,
  onClose
}) => {
  const {
    pages,
    products,
    categories,
    brands,
    articles,
    previewSection,
    updateSection,
    deleteSection,
    showToast
  } = useStore();

  const page = pages.find(item => item.slug === pageSlug);
  const liveSection = page?.sections.find(section => section.id === sectionId);
  const [form, setForm] = useState<PageSection | null>(null);
  const [tab, setTab] = useState<InspectorTab>('content');
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const originalRef = useRef<PageSection | null>(null);
  const activeKeyRef = useRef('');

  useEffect(() => {
    if (!isOpen || !liveSection) return;
    const key = `${pageSlug}:${sectionId}`;
    if (activeKeyRef.current === key && form) return;
    const snapshot = JSON.parse(JSON.stringify(liveSection)) as PageSection;
    originalRef.current = snapshot;
    activeKeyRef.current = key;
    setForm(snapshot);
    setTab('content');
  }, [isOpen, pageSlug, sectionId, liveSection?.id]);

  useEffect(() => {
    if (!isOpen) {
      activeKeyRef.current = '';
      originalRef.current = null;
      setForm(null);
    }
  }, [isOpen]);

  if (!isOpen || !form) return null;

  const apply = (next: PageSection) => {
    setForm(next);
    previewSection(pageSlug, next);
  };

  const patch = (partial: Partial<PageSection>) => {
    apply({ ...form, ...partial });
  };

  const sourceItems = (source: NonNullable<PageSection['contentSource']>, limit = 12): PageSectionItem[] => {
    const max = Math.max(1, Math.min(100, limit || 12));
    if (source === 'categories') {
      return categories.slice(0,max).map((item,index) => ({
        id: `source-category-${item.id}`, title:item.nameFa, subtitle:item.description || item.nameEn,
        imageUrl:item.iconUrl || item.imageUrl || '', link:`category:${item.slug}`, isVisible:true, order:index+1
      }));
    }
    if (source === 'brands') {
      return brands.slice(0,max).map((item,index) => ({
        id:`source-brand-${item.id}`, title:item.nameFa, subtitle:item.nameEn,
        imageUrl:item.logo || '', link:`car-brand:${item.slug}`, isVisible:true, order:index+1
      }));
    }
    if (source === 'products') {
      return products.slice(0,max).map((item,index) => ({
        id:`source-product-${item.id}`, title:item.nameFa, subtitle:item.shortDescription || item.oemNumber,
        imageUrl:item.images?.[0] || '', badge:item.oemNumber, link:`product:${item.slug || item.id}`, isVisible:true, order:index+1
      }));
    }
    if (source === 'articles') {
      return articles.slice(0,max).map((item,index) => ({
        id:`source-article-${item.id}`, title:item.title, subtitle:item.summary,
        imageUrl:item.imageUrl || '', link:`article:${item.slug || item.id}`, isVisible:true, order:index+1
      }));
    }
    return [...(form.items || [])];
  };

  const changeContentSource = (source: NonNullable<PageSection['contentSource']>) => {
    if (source === 'manual') {
      patch({ contentSource:'manual' });
      return;
    }
    const limit = form.contentSourceLimit || form.maxItems || 12;
    apply({ ...form, contentSource:source, contentSourceLimit:limit, items:sourceItems(source,limit) });
  };

  const ensureSlots = (count: number, base = form): PageSectionItem[] => {
    const current = [...(base.items || [])];
    if (!autoRepeaterSection(base)) return current;
    while (current.length < count) current.push(makeItem(current.length + 1));
    return current.map((item, index) => ({ ...item, order: index + 1 }));
  };

  const setColumns = (device: 'desktop' | 'tablet' | 'mobile', count: number) => {
    const key =
      device === 'desktop' ? 'desktopColumns' :
      device === 'tablet' ? 'tabletColumns' :
      'mobileColumns';
    const next: PageSection = {
      ...form,
      [key]: count,
      items: ensureSlots(Math.max(count, (form.items || []).length))
    } as PageSection;
    apply(next);
  };

  const updateItem = (id: string, partial: Partial<PageSectionItem>) => {
    apply({
      ...form,
      items: (form.items || []).map(item => item.id === id ? { ...item, ...partial } : item)
    });
  };

  const addItem = () => {
    const items = [...(form.items || []), makeItem((form.items || []).length + 1)];
    apply({ ...form, items });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const items = [...(form.items || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    apply({ ...form, items: items.map((item, order) => ({ ...item, order: order + 1 })) });
  };

  const dropItemOn = (targetId: string) => {
    if (!dragItemId || dragItemId === targetId) return;
    const items = [...(form.items || [])];
    const from = items.findIndex(item => item.id === dragItemId);
    const to = items.findIndex(item => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = items.splice(from,1);
    items.splice(to,0,moved);
    setDragItemId(null);
    apply({ ...form, items:items.map((item,index)=>({...item,order:index+1})) });
  };

  const cancel = () => {
    if (originalRef.current) previewSection(pageSlug, originalRef.current);
    onClose();
  };

  const save = () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    updateSection(pageSlug, form);
    originalRef.current = JSON.parse(JSON.stringify(form));
    onClose();
  };

  const deleteCurrent = () => {
    if (!window.confirm(`سکشن «${form.title || 'انتخاب‌شده'}» حذف شود؟`)) return;
    deleteSection(pageSlug, form.id);
    originalRef.current = null;
    onClose();
  };

  const numberField = (
    label: string,
    key: keyof PageSection,
    min: number,
    max: number,
    fallback: number
  ) => (
    <label className="block">
      <span className="block text-[10px] font-bold text-neutral-600 mb-1">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={Number((form as any)[key] ?? fallback)}
        onChange={event => patch({ [key]: Number(event.target.value) } as Partial<PageSection>)}
        className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs font-mono"
      />
    </label>
  );

  return (
    <aside className="fixed top-0 right-0 bottom-0 z-[230] w-[min(430px,94vw)] bg-white shadow-[-12px_0_40px_rgba(15,23,42,.22)] border-l border-neutral-200 flex flex-col text-right" dir="rtl">
      <header className="h-16 px-4 border-b border-neutral-200 flex items-center justify-between gap-3 shrink-0 bg-neutral-950 text-white">
        <div className="min-w-0">
          <strong className="block text-xs truncate">{form.title || 'ویرایش سکشن'}</strong>
          <span className="block mt-0.5 text-[9px] text-neutral-400 truncate">{page?.title || pageSlug} • تغییرات فوراً روی سایت دیده می‌شوند</span>
        </div>
        <button type="button" onClick={cancel} className="w-9 h-9 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20">
          <X className="w-4 h-4" />
        </button>
      </header>

      <nav className="grid grid-cols-4 border-b border-neutral-200 shrink-0 bg-white">
        {([
          ['content','محتوا',LayoutPanelLeft],
          ['layout','چیدمان',Columns3],
          ['style','استایل',SlidersHorizontal],
          ['items','آیتم‌ها',ImageIcon]
        ] as Array<[InspectorTab,string,React.ElementType]>).map(([id,label,Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`py-3 flex flex-col items-center gap-1 text-[9px] font-black border-b-2 ${tab === id ? 'border-blue-600 text-blue-700 bg-blue-50/40' : 'border-transparent text-neutral-500'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/60">
        {tab === 'content' && (
          <>
            <section className="bg-white rounded-2xl border border-blue-200 p-4 space-y-3">
              <div>
                <strong className="text-xs">منبع محتوای سکشن</strong>
                <p className="text-[9px] text-neutral-400 mt-1">می‌توانی نوع محتوای همین سکشن را عوض کنی؛ مثلاً دسته‌بندی‌ها را به برندها تبدیل کنی.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.contentSource || 'manual'}
                  onChange={e => changeContentSource(e.target.value as NonNullable<PageSection['contentSource']>)}
                  className="p-2.5 border rounded-xl bg-white text-xs"
                >
                  <option value="manual">دستی / آیتم‌های سفارشی</option>
                  <option value="categories">دسته‌بندی قطعات</option>
                  <option value="brands">برندهای خودرو</option>
                  <option value="products">محصولات</option>
                  <option value="articles">مقالات</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.contentSourceLimit || form.maxItems || 12}
                  onChange={e => {
                    const limit=Math.max(1,Math.min(100,Number(e.target.value||12)));
                    if ((form.contentSource || 'manual') === 'manual') patch({contentSourceLimit:limit});
                    else apply({...form,contentSourceLimit:limit,items:sourceItems(form.contentSource!,limit)});
                  }}
                  className="p-2.5 border rounded-xl text-xs"
                  title="تعداد آیتم از منبع"
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
              <label className="block">
                <span className="block text-[10px] font-bold mb-1">عنوان</span>
                <input value={form.title || ''} onChange={e => patch({title:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" />
              </label>
              <label className="block">
                <span className="block text-[10px] font-bold mb-1">زیرعنوان</span>
                <input value={form.subtitle || ''} onChange={e => patch({subtitle:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" />
              </label>
              <label className="block">
                <span className="block text-[10px] font-bold mb-1">Badge</span>
                <input value={form.badge || ''} onChange={e => patch({badge:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" />
              </label>
              <RichTextEditor label="متن کامل" value={form.content || ''} onChange={value => patch({content:value})} rows={5} />
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
              <ImageUploadInput
                label="تصویر / پس‌زمینه سکشن"
                value={form.imageUrl || ''}
                onChange={url => patch({imageUrl:url})}
                aspectRatio="banner"
                presetCategory="banners"
              />
              {form.imageUrl && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['side','کنار متن'],
                    ['cover','پس‌زمینه Cover'],
                    ['full','تمام تصویر'],
                    ['contain','Contain']
                  ].map(([id,label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => patch({imageMode:id as PageSection['imageMode']})}
                      className={`p-2 rounded-xl border text-[9px] font-bold ${(form.imageMode || 'side') === id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'bg-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label><span className="block text-[10px] font-bold mb-1">متن دکمه</span><input value={form.buttonText || ''} onChange={e => patch({buttonText:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
              <label><span className="block text-[10px] font-bold mb-1">لینک دکمه</span><input dir="ltr" value={form.buttonLink || ''} onChange={e => patch({buttonLink:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
            </section>
          </>
        )}

        {tab === 'layout' && (
          <>
            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
              <div>
                <strong className="text-xs">Container</strong>
                <p className="text-[9px] text-neutral-400 mt-1">Full Width، Boxed یا اندازه سفارشی برای هر دستگاه.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => patch({fullWidth:true,widthPercent:100,tabletWidthPercent:100,mobileWidthPercent:100,maxWidthPx:0,layout:'full'})} className={`p-2.5 rounded-xl border text-[9px] font-black ${form.fullWidth ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>تمام عرض</button>
                <button type="button" onClick={() => patch({fullWidth:false,widthPercent:100,tabletWidthPercent:100,mobileWidthPercent:100,maxWidthPx:1280,layout:'boxed'})} className={`p-2.5 rounded-xl border text-[9px] font-black ${!form.fullWidth && (form.maxWidthPx || 1280) === 1280 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>Boxed</button>
                <button type="button" onClick={() => patch({fullWidth:false,maxWidthPx:form.maxWidthPx || 1100})} className="p-2.5 rounded-xl border bg-white text-[9px] font-black">سفارشی</button>
              </div>

              {!form.fullWidth && (
                <div className="grid grid-cols-2 gap-3">
                  {numberField('عرض دسکتاپ %','widthPercent',20,100,100)}
                  {numberField('عرض تبلت %','tabletWidthPercent',20,100,100)}
                  {numberField('عرض موبایل %','mobileWidthPercent',20,100,100)}
                  {numberField('حداکثر عرض px','maxWidthPx',0,2400,1280)}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
              <div>
                <strong className="text-xs">Responsive Grid</strong>
                <p className="text-[9px] text-neutral-400 mt-1">با افزایش ستون دسکتاپ در سکشن‌های بنری، Slot خالی جدید هم خودکار ساخته می‌شود.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label><span className="block text-[9px] font-bold mb-1">Desktop</span><select value={form.desktopColumns || 3} onChange={e => setColumns('desktop',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                <label><span className="block text-[9px] font-bold mb-1">Tablet</span><select value={form.tabletColumns || Math.min(form.desktopColumns || 3,2)} onChange={e => setColumns('tablet',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                <label><span className="block text-[9px] font-bold mb-1">Mobile</span><select value={form.mobileColumns || 1} onChange={e => setColumns('mobile',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {numberField('فاصله آیتم‌ها','gapPx',0,100,16)}
                {numberField('حداکثر آیتم','maxItems',0,100,0)}
                {numberField('اندازه تصویر','imageSizePx',16,500,72)}
                {numberField('حداقل ارتفاع','minHeightPx',0,1200,0)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => patch({contentAlign:'right'})} className={`p-2 rounded-lg border grid place-items-center ${form.contentAlign === 'right' ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}><AlignRight className="w-4 h-4" /></button>
                <button type="button" onClick={() => patch({contentAlign:'center'})} className={`p-2 rounded-lg border grid place-items-center ${form.contentAlign === 'center' ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}><AlignCenter className="w-4 h-4" /></button>
                <button type="button" onClick={() => patch({contentAlign:'left'})} className={`p-2 rounded-lg border grid place-items-center ${form.contentAlign === 'left' ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}><AlignLeft className="w-4 h-4" /></button>
              </div>
            </section>
          </>
        )}

        {tab === 'style' && (
          <>
            <section className="bg-white rounded-2xl border border-neutral-200 p-4 grid grid-cols-2 gap-3">
              <label><span className="block text-[10px] font-bold mb-1">رنگ پس‌زمینه</span><input type="color" value={form.backgroundColor || '#ffffff'} onChange={e => patch({backgroundColor:e.target.value})} className="w-full h-11 p-1 border rounded-xl" /></label>
              <label><span className="block text-[10px] font-bold mb-1">رنگ متن</span><input type="color" value={form.textColor || '#111827'} onChange={e => patch({textColor:e.target.value})} className="w-full h-11 p-1 border rounded-xl" /></label>
              {numberField('گردی سکشن','borderRadiusPx',0,100,0)}
              {numberField('گردی کارت‌ها','itemRadiusPx',0,100,10)}
              {numberField('Padding بالا','paddingTopPx',0,250,28)}
              {numberField('Padding پایین','paddingBottomPx',0,250,28)}
              {numberField('Padding طرفین','paddingInlinePx',0,200,20)}
              {numberField('Opacity تصویر %','backgroundImageOpacity',0,100,100)}
            </section>

            <section className="bg-white rounded-2xl border border-violet-200 p-4 space-y-3">
              <div>
                <strong className="text-xs">استایل بخش داخلی / کارت‌های سکشن</strong>
                <p className="text-[9px] text-neutral-400 mt-1">این تنظیمات روی تمام آیتم‌های داخل سکشن اعمال می‌شود؛ هر آیتم پایین‌تر Override مستقل هم دارد.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه آیتم</span><input type="color" value={form.itemBackgroundColor || '#ffffff'} onChange={e=>patch({itemBackgroundColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                <label><span className="block text-[9px] font-bold mb-1">رنگ متن آیتم</span><input type="color" value={form.itemTextColor || '#111827'} onChange={e=>patch({itemTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                <label><span className="block text-[9px] font-bold mb-1">رنگ حاشیه</span><input type="color" value={form.itemBorderColor || '#e5e7eb'} onChange={e=>patch({itemBorderColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                {numberField('Padding آیتم','itemPaddingPx',0,80,12)}
                {numberField('اندازه فونت آیتم','itemFontSizePx',8,40,12)}
                {numberField('گردی تصویر آیتم','itemImageRadiusPx',0,80,8)}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <strong className="block text-xs">نمایش سکشن</strong>
                  <small className="text-[9px] text-neutral-400">مخفی‌کردن هم فوراً در Preview اعمال می‌شود.</small>
                </span>
                <button type="button" onClick={() => patch({isVisible:!form.isVisible})} className={`px-3 py-2 rounded-xl text-[9px] font-black inline-flex items-center gap-1 ${form.isVisible ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {form.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {form.isVisible ? 'فعال' : 'مخفی'}
                </button>
              </label>
            </section>
          </>
        )}

        {tab === 'items' && (
          <section className="space-y-3">
            <div className="bg-white rounded-2xl border border-neutral-200 p-3 flex items-center justify-between gap-2 sticky top-0 z-10">
              <div>
                <strong className="text-xs">آیتم‌های سکشن</strong>
                <span className="block text-[8px] text-neutral-400 mt-0.5">{(form.items || []).length.toLocaleString('fa-IR')} آیتم</span>
              </div>
              <button type="button" onClick={addItem} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> آیتم جدید</button>
            </div>

            {(form.items || []).map((item,index) => (
              <article
                key={item.id}
                draggable
                onDragStart={() => setDragItemId(item.id)}
                onDragEnd={() => setDragItemId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => dropItemOn(item.id)}
                className={`bg-white rounded-2xl border border-neutral-200 p-3 space-y-3 ${dragItemId===item.id?'opacity-40':''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[10px] inline-flex items-center gap-1"><GripVertical className="w-3.5 h-3.5 text-neutral-400" /> آیتم {index + 1}{!item.title ? ' — خالی' : ` — ${item.title}`}</strong>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={index===0} onClick={() => moveItem(index,'up')} className="px-2 py-1 rounded bg-neutral-100 text-[8px] disabled:opacity-30">↑</button>
                    <button type="button" disabled={index===(form.items||[]).length-1} onClick={() => moveItem(index,'down')} className="px-2 py-1 rounded bg-neutral-100 text-[8px] disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => apply({...form,items:(form.items||[]).filter(row=>row.id!==item.id)})} className="w-7 h-7 grid place-items-center rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input value={item.title || ''} onChange={e => updateItem(item.id,{title:e.target.value})} placeholder="عنوان" className="p-2 border rounded-lg text-[10px]" />
                  <input value={item.subtitle || ''} onChange={e => updateItem(item.id,{subtitle:e.target.value})} placeholder="زیرعنوان" className="p-2 border rounded-lg text-[10px]" />
                  <input value={item.buttonText || ''} onChange={e => updateItem(item.id,{buttonText:e.target.value})} placeholder="متن دکمه" className="p-2 border rounded-lg text-[10px]" />
                  <input dir="ltr" value={item.link || ''} onChange={e => updateItem(item.id,{link:e.target.value})} placeholder="link" className="p-2 border rounded-lg text-[10px] text-left font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label><span className="block text-[8px] font-bold mb-1">پس‌زمینه</span><input type="color" value={item.backgroundColor || form.itemBackgroundColor || '#ffffff'} onChange={e=>updateItem(item.id,{backgroundColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                  <label><span className="block text-[8px] font-bold mb-1">رنگ متن</span><input type="color" value={item.textColor || form.itemTextColor || '#111827'} onChange={e=>updateItem(item.id,{textColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                  <label><span className="block text-[8px] font-bold mb-1">فونت px</span><input type="number" min={8} max={40} value={item.fontSizePx || form.itemFontSizePx || 12} onChange={e=>updateItem(item.id,{fontSizePx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label><span className="block text-[8px] font-bold mb-1">گردی کارت</span><input type="number" min={0} max={100} value={item.borderRadiusPx ?? form.itemRadiusPx ?? 10} onChange={e=>updateItem(item.id,{borderRadiusPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                  <label><span className="block text-[8px] font-bold mb-1">Padding</span><input type="number" min={0} max={80} value={item.paddingPx ?? form.itemPaddingPx ?? 12} onChange={e=>updateItem(item.id,{paddingPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                </div>
                <ImageUploadInput label="تصویر / بنر" value={item.imageUrl || ''} onChange={url => updateItem(item.id,{imageUrl:url})} aspectRatio="banner" presetCategory="banners" />
                <textarea rows={2} value={item.content || ''} onChange={e => updateItem(item.id,{content:e.target.value})} placeholder="متن آیتم" className="w-full p-2 border rounded-lg text-[10px]" />
              </article>
            ))}

            {!(form.items || []).length && (
              <button type="button" onClick={addItem} className="w-full py-10 border-2 border-dashed rounded-2xl text-neutral-400 text-[10px] font-bold">
                <Plus className="w-5 h-5 mx-auto mb-2" /> اولین آیتم را اضافه کنید
              </button>
            )}
          </section>
        )}
      </div>

      <footer className="p-3 border-t border-neutral-200 bg-white shrink-0 grid grid-cols-[40px_1fr_1fr] gap-2">
        <button type="button" onClick={deleteCurrent} className="grid place-items-center rounded-xl bg-red-50 text-red-600" title="حذف سکشن"><Trash2 className="w-4 h-4" /></button>
        <button type="button" onClick={cancel} className="py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold">لغو و بازگردانی</button>
        <button type="button" onClick={save} className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1"><Save className="w-4 h-4" /> ذخیره</button>
      </footer>
    </aside>
  );
};
