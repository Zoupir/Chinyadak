import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import { PageSection, PageSectionItem } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadInput } from './ImageUploadInput';
import { LinkDestinationPicker } from './LinkDestinationPicker';
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
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });
  const modalDragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
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

  useEffect(() => {
    if (!isOpen) return;
    setModalOffset({ x: 0, y: 0 });
    modalDragRef.current = null;
  }, [isOpen, pageSlug, sectionId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !form) return null;

  const onModalPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    modalDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: modalOffset.x,
      offsetY: modalOffset.y
    };
  };
  const onModalPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = modalDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const maxX = Math.max(0, window.innerWidth / 2 - 120);
    const maxY = Math.max(0, window.innerHeight / 2 - 80);
    setModalOffset({
      x: Math.max(-maxX, Math.min(maxX, drag.offsetX + event.clientX - drag.startX)),
      y: Math.max(-maxY, Math.min(maxY, drag.offsetY + event.clientY - drag.startY))
    });
  };
  const onModalPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (modalDragRef.current?.pointerId === event.pointerId) modalDragRef.current = null;
  };

  const apply = (next: PageSection) => {
    setForm(next);
    previewSection(pageSlug, next);
  };

  const patch = (partial: Partial<PageSection>) => {
    apply({ ...form, ...partial });
  };

  const contentPolicy = (() => {
    const key = form.sectionKey || '';
    if (key === 'featured-categories') return { kind:'flexible' as const, source:(form.contentSource || 'categories') as NonNullable<PageSection['contentSource']>, title:'محتوای سکشن دسته‌بندی‌ها', description:'می‌توانید دسته‌بندی‌ها یا برندهای فروشگاه را به‌صورت خودکار نمایش دهید.' };
    if (key === 'manufacturers') return { kind:'flexible' as const, source:(form.contentSource || 'brands') as NonNullable<PageSection['contentSource']>, title:'محتوای سکشن برندها', description:'می‌توانید برندها یا دسته‌بندی‌های فروشگاه را به‌صورت خودکار نمایش دهید.' };
    if (key === 'hero') return { kind:'fixed' as const, source:'sliders' as const, title:'اسلایدهای فعال مدیریت اسلایدر', description:'اسلایدهای فعال در بخش مدیریت اسلایدر نمایش داده می‌شوند.' };
    if (['featured-products','weekly-deals','maintenance-products'].includes(key)) return { kind:'fixed' as const, source:'products' as const, title:'محصولات فروشگاه', description:'این بخش از محصولات واقعی فروشگاه تغذیه می‌شود.' };
    if (key === 'articles') return { kind:'fixed' as const, source:'articles' as const, title:'مقالات', description:'این بخش از مقالات منتشرشده تغذیه می‌شود.' };
    if (/promo|banner/i.test(key)) return { kind:'flexible' as const, source:(form.contentSource || 'manual') as NonNullable<PageSection['contentSource']>, title:'محتوای بنرها', description:'بنرها را دستی ویرایش کنید یا اسلایدهای فعال مدیریت اسلایدر را به این سکشن وصل کنید.' };
    if (/testimonial|service-strip|parts-brands|shipping/i.test(key)) return { kind:'manual' as const, source:'manual' as const, title:'آیتم‌های قابل ویرایش', description:'محتوای این بخش از تنظیمات اختصاصی خودش خوانده می‌شود.' };
    return { kind:'flexible' as const, source:(form.contentSource || 'manual') as NonNullable<PageSection['contentSource']>, title:'منبع محتوا', description:'انتخاب کنید محتوای این بخش دستی باشد یا به‌صورت زنده از اطلاعات فروشگاه خوانده شود.' };
  })();

  const changeContentSource = (source: NonNullable<PageSection['contentSource']>) => {
    patch({ contentSource:source });
  };

  const isBannerSection = /promo|banner/i.test(form.sectionKey || '');
  const isDynamicSource = contentPolicy.kind === 'fixed' || (form.contentSource || contentPolicy.source) !== 'manual';

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

  const save = async () => {
    if (!form.title?.trim()) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }
    const saved = await updateSection(pageSlug, form);
    if (!saved) return;
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
        onChange={event => {
          const value = Number(event.target.value);
          patch({
            [key]: value,
            ...(key === 'widthPercent' && value >= 100 ? { maxWidthPx: 0 } : {})
          } as Partial<PageSection>);
        }}
        className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs font-mono"
      />
    </label>
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-[499] bg-neutral-950/20 backdrop-blur-[1px]" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`ویرایش ${form.title || 'سکشن'}`}
        className="fixed z-[500] left-1/2 top-1/2 w-[min(580px,96vw)] max-h-[min(92dvh,900px)] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col text-right overflow-hidden"
        style={{ transform: `translate(calc(-50% + ${modalOffset.x}px), calc(-50% + ${modalOffset.y}px))` }}
        dir="rtl"
      >
      <header
        className="h-16 px-4 border-b border-neutral-200 flex items-center justify-between gap-3 shrink-0 bg-neutral-950 text-white cursor-move select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onModalPointerDown}
        onPointerMove={onModalPointerMove}
        onPointerUp={onModalPointerUp}
        onPointerCancel={onModalPointerUp}
      >
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
          ['style','ظاهر',SlidersHorizontal],
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

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-neutral-50/60">
        {tab === 'content' && (
          isBannerSection ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[10px] leading-6 text-amber-950">
              <strong className="block text-xs mb-1">تنظیمات بنر به‌صورت مستقل مدیریت می‌شوند</strong>
              تصویر، لینک، نسبت تصویر و چینش این جایگاه را از «مدیریت ← جایگاه‌های بنر» تغییر بده. این سکشن قدیمی فقط برای سازگاری با داده‌های قبلی نگه داشته شده و ذخیرهٔ تنظیمات آن روی بنر جدید اثر نمی‌گذارد.
            </div>
          ) : (
          <>
            <section className="bg-white rounded-2xl border border-blue-200 p-4 space-y-3">
              <div>
                <strong className="text-xs">{contentPolicy.title}</strong>
                <p className="text-[9px] text-neutral-500 mt-1 leading-5">{contentPolicy.description}</p>
              </div>

              {contentPolicy.kind === 'flexible' && (
                <label className="block">
                  <span className="block text-[9px] font-bold mb-1">محتوا از کجا خوانده شود؟</span>
                  <select
                    value={form.contentSource || contentPolicy.source}
                    onChange={e => changeContentSource(e.target.value as NonNullable<PageSection['contentSource']>)}
                    className="w-full p-2.5 border rounded-xl bg-white text-xs"
                  >
                    <option value="manual">آیتم‌های دستی و قابل ویرایش</option>
                    <option value="categories">دسته‌بندی‌های قطعات فروشگاه</option>
                    <option value="brands">برندهای خودرو</option>
                    <option value="products">محصولات فروشگاه</option>
                    <option value="articles">مقالات و آموزش‌ها</option>
                    <option value="sliders">اسلایدهای فعال مدیریت اسلایدر</option>
                  </select>
                </label>
              )}

              {(contentPolicy.kind === 'fixed' || (contentPolicy.kind === 'flexible' && (form.contentSource || contentPolicy.source) !== 'manual')) && (
                <label className="block">
                  <span className="block text-[9px] font-bold mb-1">تعداد آیتمی که نمایش داده شود</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.contentSourceLimit || form.maxItems || 12}
                    onChange={e => {
                      const limit=Math.max(1,Math.min(100,Number(e.target.value||12)));
                      patch({contentSource:contentPolicy.source,contentSourceLimit:limit,maxItems:limit});
                    }}
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                  <small className="block text-[8px] text-neutral-400 mt-1">مثلاً عدد ۸ یعنی فقط ۸ مورد اول در این بخش نمایش داده شود.</small>
                </label>
              )}

              {contentPolicy.kind === 'manual' && (
                <button type="button" onClick={()=>setTab('items')} className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                  ویرایش آیتم‌های این بخش
                </button>
              )}
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
                <span className="block text-[10px] font-bold mb-1">برچسب</span>
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
              {(form.imageUrl || form.sectionKey === 'hero' || isBannerSection) && (
                <label className="block">
                  <span className="block text-[10px] font-bold mb-1">نحوه نمایش تصویر / بنر</span>
                  <select
                    value={form.imageMode || 'cover'}
                    onChange={event => patch({imageMode: event.target.value as PageSection['imageMode']})}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
                  >
                    <option value="side">کنار متن</option>
                    <option value="cover">پوشش کل کادر (با برش متناسب)</option>
                    <option value="contain">نمایش کامل بدون برش</option>
                    <option value="full">کشیده‌شدن به کل کادر</option>
                    <option value="stretch">کشیده‌شدن اجباری</option>
                    <option value="original">اندازه اصلی</option>
                    <option value="repeat">تکرار تصویر</option>
                    <option value="repeat-x">تکرار افقی</option>
                    <option value="repeat-y">تکرار عمودی</option>
                  </select>
                </label>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label><span className="block text-[10px] font-bold mb-1">متن دکمه</span><input value={form.buttonText || ''} onChange={e => patch({buttonText:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" /></label>
              <LinkDestinationPicker label="مقصد دکمه" value={form.buttonLink || ''} onChange={value=>patch({buttonLink:value})} />
            </section>
          </>
          )
        )}

        {tab === 'layout' && (
          <>
            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
              <div>
                <strong className="text-xs">کادر و عرض سکشن</strong>
                <p className="text-[9px] text-neutral-400 mt-1">تمام‌عرض، داخل کادر یا اندازه سفارشی را جداگانه برای هر دستگاه تعیین کنید.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => patch({fullWidth:true,widthPercent:100,tabletWidthPercent:100,mobileWidthPercent:100,maxWidthPx:0,layout:'full'})} className={`p-2.5 rounded-xl border text-[9px] font-black ${form.fullWidth ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>تمام عرض</button>
                <button type="button" onClick={() => patch({fullWidth:false,widthPercent:100,tabletWidthPercent:100,mobileWidthPercent:100,maxWidthPx:1280,layout:'boxed'})} className={`p-2.5 rounded-xl border text-[9px] font-black ${!form.fullWidth && (form.maxWidthPx || 1280) === 1280 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>داخل کادر</button>
                <button type="button" onClick={() => patch({fullWidth:false,maxWidthPx:form.maxWidthPx || 1100})} className="p-2.5 rounded-xl border bg-white text-[9px] font-black">سفارشی</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {numberField('عرض سکشن در دسکتاپ ٪','widthPercent',20,100,100)}
                {numberField('عرض سکشن در تبلت ٪','tabletWidthPercent',20,100,100)}
                {numberField('عرض سکشن در موبایل ٪','mobileWidthPercent',20,100,100)}
                {!form.fullWidth && numberField('حداکثر عرض px','maxWidthPx',0,2400,1280)}
              </div>
              <p className="text-[8px] text-neutral-500">عرض پیش‌فرض ۱۰۰٪ است و می‌توانید آن را برای هر دستگاه جداگانه تغییر دهید.</p>
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
              <div>
                <strong className="text-xs">شبکه واکنش‌گرا</strong>
                <p className="text-[9px] text-neutral-400 mt-1">با افزایش ستون دسکتاپ در سکشن‌های بنری، جایگاه خالی جدید هم خودکار ساخته می‌شود.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label><span className="block text-[9px] font-bold mb-1">دسکتاپ</span><select value={form.desktopColumns || 3} onChange={e => setColumns('desktop',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                <label><span className="block text-[9px] font-bold mb-1">تبلت</span><select value={form.tabletColumns || Math.min(form.desktopColumns || 3,2)} onChange={e => setColumns('tablet',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                <label><span className="block text-[9px] font-bold mb-1">موبایل</span><select value={form.mobileColumns || 1} onChange={e => setColumns('mobile',Number(e.target.value))} className="w-full p-2 border rounded-lg bg-white text-xs">{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {numberField('فاصله آیتم‌ها','gapPx',0,100,16)}
                {numberField('حداکثر آیتم','maxItems',0,100,0)}
                {numberField('اندازه پایه تصویر','imageSizePx',16,500,72)}
                {numberField('حداقل ارتفاع سکشن','minHeightPx',0,1200,0)}
                {numberField('حداقل ارتفاع آیتم','itemMinHeightPx',0,1200,0)}
                {numberField('حداقل عرض آیتم موبایل','mobileItemMinWidthPx',120,600,240)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="block text-[9px] font-bold mb-1">نمایش موبایل</span>
                  <select value={form.mobileDisplayMode || 'grid'} onChange={e=>patch({mobileDisplayMode:e.target.value as PageSection['mobileDisplayMode']})} className="w-full p-2 border rounded-lg bg-white text-xs">
                    <option value="grid">شبکه واکنش‌گرا</option>
                    <option value="scroll">پیمایش افقی</option>
                  </select>
                </label>
                <label>
                  <span className="block text-[9px] font-bold mb-1">نوع چیدمان اختصاصی</span>
                  <select value={form.layoutVariant || 'default'} onChange={e=>patch({layoutVariant:e.target.value as PageSection['layoutVariant']})} className="w-full p-2 border rounded-lg bg-white text-xs">
                    <option value="default">پیش‌فرض</option>
                    <option value="uniform">یکنواخت</option>
                    <option value="mosaic">موزاییکی</option>
                    <option value="compact">فشرده</option>
                  </select>
                </label>
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
              {numberField('فاصله داخلی بالا','paddingTopPx',0,250,28)}
              {numberField('فاصله داخلی پایین','paddingBottomPx',0,250,28)}
              {numberField('فاصله داخلی طرفین','paddingInlinePx',0,300,20)}
              {numberField('فاصله بالا از سکشن قبل','marginTopPx',0,250,0)}
              {numberField('فاصله پایین','marginBottomPx',0,250,0)}
              {numberField('اندازه عنوان سکشن','headingFontSizePx',10,80,18)}
              {numberField('اندازه زیرعنوان سکشن','subtitleFontSizePx',8,48,11)}
              {numberField('شفافیت تصویر ٪','backgroundImageOpacity',0,100,100)}
            </section>

            <section className="bg-white rounded-2xl border border-violet-200 p-4 space-y-3">
              <div>
                <strong className="text-xs">ظاهر بخش داخلی / کارت‌های سکشن</strong>
                <p className="text-[9px] text-neutral-400 mt-1">{isBannerSection ? 'این‌ها تنظیمات پایه بنرها هستند؛ هر بنر می‌تواند رنگ، اندازه، تصویر و ابعاد مستقل خودش را داشته باشد.' : 'این تنظیمات یک‌بار روی همه آیتم‌های این سکشن اعمال می‌شوند؛ لازم نیست برای ده‌ها آیتم جداگانه تکرارشان کنید.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه آیتم</span><input type="color" value={form.itemBackgroundColor || '#ffffff'} onChange={e=>patch({itemBackgroundColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                <label><span className="block text-[9px] font-bold mb-1">رنگ متن آیتم</span><input type="color" value={form.itemTextColor || '#111827'} onChange={e=>patch({itemTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                <label><span className="block text-[9px] font-bold mb-1">رنگ حاشیه</span><input type="color" value={form.itemBorderColor || '#e5e7eb'} onChange={e=>patch({itemBorderColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                {numberField('فاصله داخلی آیتم','itemPaddingPx',0,120,12)}
                {numberField('اندازه فونت عمومی آیتم','itemFontSizePx',8,60,12)}
                {numberField('اندازه عنوان آیتم','itemTitleFontSizePx',8,72,14)}
                {numberField('اندازه متن آیتم','itemContentFontSizePx',8,60,11)}
                {numberField('عرض تصویر آیتم','itemImageWidthPx',16,1200,72)}
                {numberField('ارتفاع تصویر آیتم','itemImageHeightPx',16,1200,72)}
                {numberField('گردی تصویر آیتم','itemImageRadiusPx',0,200,8)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="block text-[9px] font-bold mb-1">نحوه نمایش تصویر</span><select value={form.itemImageFit || 'contain'} onChange={e=>patch({itemImageFit:e.target.value as 'cover'|'contain'})} className="w-full p-2 border rounded-lg bg-white text-xs"><option value="contain">نمایش کامل بدون برش</option><option value="cover">پوشش کامل کادر</option></select></label>
                <label><span className="block text-[9px] font-bold mb-1">تراز متن آیتم</span><select value={form.itemTextAlign || 'right'} onChange={e=>patch({itemTextAlign:e.target.value as 'right'|'center'|'left'})} className="w-full p-2 border rounded-lg bg-white text-xs"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
              </div>
            </section>

            {form.sectionKey === 'weekly-deals' && (
              <section className="bg-white rounded-2xl border border-orange-200 p-4 space-y-3">
                <div>
                  <strong className="text-xs">تنظیمات اختصاصی پیشنهادهای هفته</strong>
                  <p className="text-[9px] text-neutral-500 mt-1">تیتر، زیرمتن، شمارنده و محل قرارگیری آن مستقل از کارت‌های محصول کنترل می‌شوند.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label><span className="block text-[9px] font-bold mb-1">رنگ عنوان</span><input type="color" value={form.dealTitleColor || '#ffffff'} onChange={e=>patch({dealTitleColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">رنگ زیرمتن</span><input type="color" value={form.dealSubtitleColor || '#fff7ed'} onChange={e=>patch({dealSubtitleColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">رنگ شمارنده</span><input type="color" value={form.dealTimerTextColor || '#b45309'} onChange={e=>patch({dealTimerTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه شمارنده</span><input type="color" value={form.dealTimerBoxBgColor || '#ffffff'} onChange={e=>patch({dealTimerBoxBgColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  {numberField('اندازه عنوان','headingFontSizePx',12,60,20)}
                  {numberField('اندازه زیرمتن','subtitleFontSizePx',8,36,11)}
                  {numberField('اندازه شمارنده','dealTimerFontSizePx',10,48,18)}
                  <label><span className="block text-[9px] font-bold mb-1">محل شمارنده</span><select value={form.dealTimerAlign || 'left'} onChange={e=>patch({dealTimerAlign:e.target.value as PageSection['dealTimerAlign']})} className="w-full p-2 border rounded-lg bg-white text-xs"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                  <label><span className="block text-[9px] font-bold mb-1">تراز عمودی محتوای سکشن</span><select value={form.dealContentVerticalAlign || 'center'} onChange={e=>patch({dealContentVerticalAlign:e.target.value as PageSection['dealContentVerticalAlign']})} className="w-full p-2 border rounded-lg bg-white text-xs"><option value="start">بالا</option><option value="center">وسط</option><option value="end">پایین</option></select></label>
                </div>
              </section>
            )}

            {form.sectionKey === 'hero' && (
              <section className="bg-white rounded-2xl border border-sky-200 p-4 space-y-3">
                <div>
                  <strong className="text-xs">کادر انتخاب خودرو روی اسلایدر</strong>
                  <p className="text-[9px] text-neutral-500 mt-1">اندازه کادر، فونت‌ها، رنگ‌ها و سمت قرارگیری را مستقل تنظیم کنید.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {numberField('عرض کادر','finderWidthPx',220,520,300)}
                  {numberField('فاصله داخلی','finderPaddingPx',8,48,18)}
                  {numberField('گردی کادر','finderRadiusPx',0,40,8)}
                  {numberField('اندازه عنوان','finderTitleFontSizePx',10,32,15)}
                  {numberField('اندازه توضیح','finderTextFontSizePx',8,24,11)}
                  {numberField('فونت برچسب فیلد','finderLabelFontSizePx',8,22,10)}
                  {numberField('فونت مقدار فیلد','finderValueFontSizePx',8,26,11)}
                  {numberField('فونت دکمه','finderButtonFontSizePx',8,24,11)}
                  <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه کادر</span><input type="color" value={form.finderBackgroundColor || '#ffffff'} onChange={e=>patch({finderBackgroundColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">رنگ متن</span><input type="color" value={form.finderTextColor || '#111827'} onChange={e=>patch({finderTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه فیلدها</span><input type="color" value={form.finderFieldBackgroundColor || '#fafafa'} onChange={e=>patch({finderFieldBackgroundColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">رنگ مقدار فیلدها</span><input type="color" value={form.finderFieldTextColor || '#222b35'} onChange={e=>patch({finderFieldTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">پس‌زمینه دکمه</span><input type="color" value={form.finderButtonBackgroundColor || '#f5a000'} onChange={e=>patch({finderButtonBackgroundColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">رنگ متن دکمه</span><input type="color" value={form.finderButtonTextColor || '#111827'} onChange={e=>patch({finderButtonTextColor:e.target.value})} className="w-full h-10 p-1 border rounded-xl" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">سمت کادر</span><select value={form.finderSide || 'left'} onChange={e=>patch({finderSide:e.target.value as PageSection['finderSide']})} className="w-full p-2 border rounded-lg bg-white text-xs"><option value="left">چپ</option><option value="right">راست</option></select></label>
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-neutral-200 p-4">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <strong className="block text-xs">نمایش سکشن</strong>
                  <small className="text-[9px] text-neutral-400">مخفی‌کردن هم فوراً در پیش‌نمایش اعمال می‌شود.</small>
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
              {!isDynamicSource && <button type="button" onClick={addItem} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> آیتم جدید</button>}
            </div>

            {(form.contentSource && form.contentSource !== 'manual' && contentPolicy.kind !== 'manual') && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-[9px] leading-5 text-amber-900">
                این سکشن محتوای زنده دارد. اطلاعات هر آیتم از منبع اصلی فروشگاه می‌آید و ظاهر همه آیتم‌ها یک‌جا از تب «ظاهر» تنظیم می‌شود؛ بنابراین برای ۵۰ محصول لازم نیست ۵۰ بار تنظیمات ظاهری تکرار شود.
              </div>
            )}

            {(!form.contentSource || form.contentSource === 'manual' || contentPolicy.kind === 'manual') && (form.items || []).map((item,index) => (
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
                  <input value={item.badge || ''} onChange={e => updateItem(item.id,{badge:e.target.value})} placeholder="برچسب" className="p-2 border rounded-lg text-[10px]" />
                  <input value={item.buttonText || ''} onChange={e => updateItem(item.id,{buttonText:e.target.value})} placeholder="متن دکمه" className="p-2 border rounded-lg text-[10px]" />
                </div>
                <LinkDestinationPicker label="مقصد این آیتم / دکمه" value={item.link || ''} onChange={value=>updateItem(item.id,{link:value})} />
                {isBannerSection ? (
                  <>
                    <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 space-y-2">
                      <strong className="block text-[9px] text-blue-800">ابعاد مستقل این بنر</strong>
                      <div className="grid grid-cols-3 gap-2">
                        <label><span className="block text-[8px] font-bold mb-1">عرض دسکتاپ ٪</span><input type="number" min={10} max={100} value={item.widthPercent ?? 100} onChange={e=>updateItem(item.id,{widthPercent:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                        <label><span className="block text-[8px] font-bold mb-1">عرض تبلت ٪</span><input type="number" min={10} max={100} value={item.tabletWidthPercent ?? item.widthPercent ?? 100} onChange={e=>updateItem(item.id,{tabletWidthPercent:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                        <label><span className="block text-[8px] font-bold mb-1">عرض موبایل ٪</span><input type="number" min={10} max={100} value={item.mobileWidthPercent ?? 100} onChange={e=>updateItem(item.id,{mobileWidthPercent:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                        <label><span className="block text-[8px] font-bold mb-1">ارتفاع دسکتاپ</span><input type="number" min={80} max={900} value={item.heightPx ?? item.minHeightPx ?? form.itemMinHeightPx ?? 178} onChange={e=>updateItem(item.id,{heightPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                        <label><span className="block text-[8px] font-bold mb-1">ارتفاع تبلت</span><input type="number" min={80} max={900} value={item.tabletHeightPx ?? item.heightPx ?? 178} onChange={e=>updateItem(item.id,{tabletHeightPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                        <label><span className="block text-[8px] font-bold mb-1">ارتفاع موبایل</span><input type="number" min={80} max={900} value={item.mobileHeightPx ?? item.tabletHeightPx ?? item.heightPx ?? 168} onChange={e=>updateItem(item.id,{mobileHeightPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <label><span className="block text-[8px] font-bold mb-1">پس‌زمینه کارت</span><input type="color" value={item.backgroundColor || form.itemBackgroundColor || '#ffffff'} onChange={e=>updateItem(item.id,{backgroundColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">رنگ عمومی متن</span><input type="color" value={item.textColor || form.itemTextColor || '#111827'} onChange={e=>updateItem(item.id,{textColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">فونت عمومی</span><input type="number" min={8} max={60} value={item.fontSizePx || form.itemFontSizePx || 12} onChange={e=>updateItem(item.id,{fontSizePx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">رنگ عنوان</span><input type="color" value={item.titleColor || item.textColor || '#ffffff'} onChange={e=>updateItem(item.id,{titleColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">رنگ زیرعنوان</span><input type="color" value={item.subtitleColor || '#e5e7eb'} onChange={e=>updateItem(item.id,{subtitleColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">رنگ دکمه</span><input type="color" value={item.buttonBgColor || '#f59e0b'} onChange={e=>updateItem(item.id,{buttonBgColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">متن دکمه</span><input type="color" value={item.buttonTextColor || '#111827'} onChange={e=>updateItem(item.id,{buttonTextColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">رنگ برچسب</span><input type="color" value={item.badgeBgColor || '#16a34a'} onChange={e=>updateItem(item.id,{badgeBgColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">متن برچسب</span><input type="color" value={item.badgeTextColor || '#ffffff'} onChange={e=>updateItem(item.id,{badgeTextColor:e.target.value})} className="w-full h-8 p-1 border rounded" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label><span className="block text-[8px] font-bold mb-1">گردی کارت</span><input type="number" min={0} max={200} value={item.borderRadiusPx ?? form.itemRadiusPx ?? 10} onChange={e=>updateItem(item.id,{borderRadiusPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">فاصله داخلی</span><input type="number" min={0} max={120} value={item.paddingPx ?? form.itemPaddingPx ?? 12} onChange={e=>updateItem(item.id,{paddingPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">عرض تصویر</span><input type="number" min={16} max={1200} value={item.imageWidthPx ?? form.itemImageWidthPx ?? form.imageSizePx ?? 72} onChange={e=>updateItem(item.id,{imageWidthPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">ارتفاع تصویر</span><input type="number" min={16} max={1200} value={item.imageHeightPx ?? form.itemImageHeightPx ?? form.imageSizePx ?? 72} onChange={e=>updateItem(item.id,{imageHeightPx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">عنوان px</span><input type="number" min={8} max={72} value={item.titleFontSizePx ?? form.itemTitleFontSizePx ?? 14} onChange={e=>updateItem(item.id,{titleFontSizePx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">متن px</span><input type="number" min={8} max={60} value={item.contentFontSizePx ?? form.itemContentFontSizePx ?? 11} onChange={e=>updateItem(item.id,{contentFontSizePx:Number(e.target.value)})} className="w-full p-1.5 border rounded text-[9px]" /></label>
                      <label><span className="block text-[8px] font-bold mb-1">نمایش تصویر</span><select value={item.imageMode || (item.imageFit==='contain'?'contain':'cover')} onChange={e=>updateItem(item.id,{imageMode:e.target.value as PageSectionItem['imageMode']})} className="w-full p-1.5 border rounded text-[9px] bg-white"><option value="cover">پوشش کامل کادر</option><option value="contain">کامل بدون برش</option><option value="stretch">کشیده تا کل کادر</option><option value="original">اندازه اصلی</option><option value="repeat">تکرار کامل</option><option value="repeat-x">تکرار افقی</option><option value="repeat-y">تکرار عمودی</option></select></label>
                      <label><span className="block text-[8px] font-bold mb-1">تراز متن</span><select value={item.textAlignment || item.textAlign || 'right'} onChange={e=>updateItem(item.id,{textAlignment:e.target.value as PageSectionItem['textAlignment']})} className="w-full p-1.5 border rounded text-[9px] bg-white"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-[9px] leading-5 text-neutral-600">
                    ظاهر این آیتم از تنظیمات مشترک تب «ظاهر» پیروی می‌کند. فقط محتوا، تصویر و لینک اینجا تغییر می‌کند.
                  </div>
                )}
                <ImageUploadInput label="تصویر / بنر" value={item.imageUrl || ''} onChange={url => updateItem(item.id,{imageUrl:url})} aspectRatio="banner" presetCategory="banners" />
                <textarea rows={2} value={item.content || ''} onChange={e => updateItem(item.id,{content:e.target.value})} placeholder="متن آیتم" className="w-full p-2 border rounded-lg text-[10px]" />
              </article>
            ))}

            {(!form.contentSource || form.contentSource === 'manual' || contentPolicy.kind === 'manual') && !(form.items || []).length && (
              <button type="button" onClick={addItem} className="w-full py-10 border-2 border-dashed rounded-2xl text-neutral-400 text-[10px] font-bold">
                <Plus className="w-5 h-5 mx-auto mb-2" /> اولین آیتم را اضافه کنید
              </button>
            )}
          </section>
        )}
      </div>

      <footer className="p-3 border-t border-neutral-200 bg-white shrink-0 flex gap-2">
        {!isBannerSection && <>
        <button type="button" onClick={deleteCurrent} className="grid place-items-center rounded-xl bg-red-50 text-red-600" title="حذف سکشن"><Trash2 className="w-4 h-4" /></button>
        </>}
        <button type="button" onClick={cancel} className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold">لغو و بازگردانی</button>
        {!isBannerSection && <button type="button" onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-1"><Save className="w-4 h-4" /> ذخیره</button>}
      </footer>
      </aside>
    </>,
    document.body
  );
};
