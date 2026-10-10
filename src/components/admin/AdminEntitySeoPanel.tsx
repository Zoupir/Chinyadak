import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Gauge, Image as ImageIcon, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { SeoEntityDraft } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { markdownToSafeHtml } from '../../utils/richText';
import { updateMediaSeo, type MediaSeoMeta } from '../../api/media';

type EntityType = 'product' | 'article' | 'page' | 'category' | 'brand' | 'model';

interface AdminEntitySeoPanelProps {
  entityType: EntityType;
  entityId?: string;
  entityTitle: string;
  value?: SeoEntityDraft;
  images?: string[];
  onChange: (value: SeoEntityDraft) => void;
  contentDraft?: { description?: string; content?: string; data?: Record<string, any> };
  onAiContent?: (pkg: any, seo: SeoEntityDraft) => void;
}

const defaultSeo = (type: EntityType, title: string): SeoEntityDraft => ({
  seoTitle: title || '',
  metaDescription: '',
  focusKeyword: '',
  secondaryKeywords: [],
  canonicalUrl: '',
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImageUrl: '',
  schemaType: type === 'product' ? 'Product' : type === 'article' ? 'Article' : ['category','brand','model'].includes(type) ? 'CollectionPage' : 'WebPage',
  cornerstone: false,
  breadcrumbTitle: '',
  hreflang: [],
  images: {}
});

const api = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'SEO_REQUEST_FAILED');
  return payload;
};

const localMediaRelativePath = (url: string): string => {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const marker = '/uploads/';
    const index = pathname.indexOf(marker);
    if (index < 0) return '';
    return decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    const clean = String(url || '').split(/[?#]/)[0];
    const index = clean.indexOf('/uploads/');
    return index >= 0 ? decodeURIComponent(clean.slice(index + '/uploads/'.length)) : '';
  }
};

const syncMediaSeoMap = async (
  imageMap: NonNullable<SeoEntityDraft['images']>
): Promise<number> => {
  const tasks = Object.entries(imageMap || {}).flatMap(([url, meta]) => {
    const relativePath = localMediaRelativePath(url);
    if (!relativePath) return [];
    const payload: Partial<MediaSeoMeta> = {
      alt: String(meta?.alt || ''),
      title: String(meta?.title || ''),
      caption: String(meta?.caption || ''),
      description: String(meta?.description || '')
    };
    return [updateMediaSeo(relativePath, payload)];
  });
  if (!tasks.length) return 0;
  const results = await Promise.allSettled(tasks);
  return results.filter(result => result.status === 'fulfilled').length;
};

const enrichAiDraftData = (data?: Record<string, any>): Record<string, any> => {
  const source = data && typeof data === 'object' ? data : {};
  const {
    description: _description,
    content: _content,
    shortDescription: _shortDescription,
    summary: _summary,
    seo: _seo,
    technicalSpecs: rawTechnicalSpecs,
    ...adminFields
  } = source;
  const technicalSpecs = rawTechnicalSpecs && typeof rawTechnicalSpecs === 'object' && !Array.isArray(rawTechnicalSpecs)
    ? rawTechnicalSpecs
    : {};
  return {
    ...source,
    technicalSpecs: {
      ...technicalSpecs,
      __allAdminFields: adminFields
    }
  };
};

const AI_FORMAT_INSTRUCTIONS = [
  'از تمام اطلاعات ثبت‌شده در پنل ادمین که در زمینه داده شده استفاده کن؛ فیلدهای boolean/تیک‌ها، دسته‌بندی، خودروهای سازگار، سازندگان، مشخصات فنی، وضعیت‌ها و روابط را نادیده نگیر.',
  'هیچ مشخصه‌ای را که در داده ادمین وجود ندارد اختراع نکن.',
  'contentHtml را HTML معنایی و تمیز بنویس و برای ساختار متن از h2، h3، p، ul/ol، strong استفاده کن.',
  'مشخصات فنی کلید/مقدار را در صورت کافی بودن داده به جدول HTML با table/thead/tbody/tr/th/td تبدیل کن.',
  'اطلاعات Fitment و سازگاری خودرو را در صورت وجود داده به جدول HTML با ستون‌های برند، مدل، سال، موتور و گیربکس تبدیل کن.',
  'shortDescription را کوتاه اما قابل استایل نگه دار؛ برای تأکید می‌توانی از Markdown ساده مانند **متن مهم** استفاده کنی.',
  'برای تصویر نیز ALT، Title، Caption و Description دقیق و غیرتکراری بر اساس همین محصول/مقاله ارائه کن.'
].join('\n');

export const AdminEntitySeoPanel: React.FC<AdminEntitySeoPanelProps> = ({
  entityType,
  entityId,
  entityTitle,
  value,
  images = [],
  onChange,
  contentDraft,
  onAiContent
}) => {
  const [expanded, setExpanded] = useState(true);
  const [busy, setBusy] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiPreview, setAiPreview] = useState<any>(null);
  const seo = useMemo(() => ({ ...defaultSeo(entityType, entityTitle), ...(value || {}), images: value?.images || {} }), [entityType, entityTitle, value]);

  const patch = (next: Partial<SeoEntityDraft>) => onChange({ ...seo, ...next });
  const setImageField = (url: string, field: 'alt' | 'title' | 'caption' | 'description', nextValue: string) => {
    const current = seo.images?.[url] || { alt: '' };
    patch({
      images: {
        ...(seo.images || {}),
        [url]: { ...current, [field]: nextValue }
      }
    });
  };

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    setBusy('load');
    api(`/api/seo/entities/${entityType}/${encodeURIComponent(entityId)}`)
      .then(workspace => {
        if (cancelled) return;
        const currentImages = value?.images || {};
        const loaded = workspace?.meta || {};
        onChange({ ...seo, ...loaded, images: currentImages });
        setScore(Number(workspace?.analysis?.score ?? workspace?.meta?.score ?? 0));
        setAnalysis(workspace?.analysis || workspace?.meta?.analysis || null);
      })
      .catch(() => {
        if (!cancelled) setNotice('اطلاعات سئوی ذخیره‌شده قابل دریافت نبود؛ مقادیر داخل همین فرم همچنان قابل ویرایش است.');
      })
      .finally(() => {
        if (!cancelled) setBusy('');
      });
    return () => { cancelled = true; };
    // Existing entity metadata is loaded once whenever the entity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const generateAi = async (operation: 'generate' | 'optimize') => {
    setBusy('ai'); setNotice(''); setAiPreview(null);
    try {
      const result = await api('/api/seo/ai/run', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId: entityId || '',
          operation,
          instructions: [AI_FORMAT_INSTRUCTIONS, aiInstructions].filter(Boolean).join('\n\n'),
          draft: {
            title: entityTitle,
            ...contentDraft,
            data: enrichAiDraftData(contentDraft?.data)
          }
        })
      });
      const pkg = result.package || {};
      setAiPreview({
        ...pkg,
        shortDescription: markdownToSafeHtml(pkg.shortDescription || '')
      });
      setNotice('خروجی تولید شد؛ همه فیلدهای ثبت‌شده ادمین در زمینه AI قرار گرفتند. پس از بررسی، آن را در فرم اعمال و محتوا را ذخیره کنید.');
    } catch (error) { setNotice('تولید محتوا انجام نشد: ' + String((error as Error).message)); }
    finally { setBusy(''); }
  };

  const applyAiToForm = async () => {
    if (!aiPreview || !onAiContent) return;
    const normalizedShort = markdownToSafeHtml(aiPreview.shortDescription || '');
    const generatedImage = aiPreview.image || {};
    const nextImages = { ...(seo.images || {}) };
    images.filter(Boolean).forEach((url, index) => {
      const current = nextImages[url] || { alt: '' };
      const suffix = index ? ` - ${index + 1}` : '';
      nextImages[url] = {
        ...current,
        alt: String(generatedImage.alt || current.alt || `${aiPreview.primaryKeyword || seo.focusKeyword || entityTitle}${suffix}`).trim(),
        title: String(generatedImage.title || current.title || entityTitle).trim(),
        caption: String(generatedImage.caption || current.caption || '').trim(),
        description: String(generatedImage.description || current.description || '').trim()
      };
    });
    const nextSeo: SeoEntityDraft = {
      ...seo,
      seoTitle: aiPreview.seoTitle,
      metaDescription: aiPreview.metaDescription,
      focusKeyword: aiPreview.primaryKeyword,
      secondaryKeywords: aiPreview.secondaryKeywords || [],
      schemaType: aiPreview.schemaType || seo.schemaType,
      images: nextImages
    };
    onAiContent({ ...aiPreview, shortDescription: normalizedShort }, nextSeo);
    const synced = await syncMediaSeoMap(nextImages).catch(() => 0);
    setAiPreview(null);
    setNotice(`محتوا و سئو در فرم قرار گرفت؛ متادیتای ${synced.toLocaleString('fa-IR')} رسانه محلی نیز همگام شد. برای ثبت نهایی، محتوا را ذخیره کنید.`);
  };

  const saveMetaNow = async () => {
    if (!entityId) {
      setNotice('سئو همراه با ذخیره این محتوا ثبت خواهد شد.');
      return;
    }
    setBusy('save');
    try {
      const { images: _images, ...meta } = seo;
      const result = await api(`/api/seo/entities/${entityType}/${encodeURIComponent(entityId)}/meta`, {
        method: 'PUT',
        body: JSON.stringify(meta)
      });
      const synced = await syncMediaSeoMap(seo.images || {}).catch(() => 0);
      setScore(Number(result?.meta?.score || 0));
      setNotice(`اطلاعات TakRank SEO ذخیره شد و ${synced.toLocaleString('fa-IR')} رسانه محلی همگام شد.`);
    } catch {
      setNotice('ذخیره مستقیم سئو انجام نشد. با ذخیره محصول/مقاله/برگه دوباره ثبت می‌شود.');
    } finally {
      setBusy('');
    }
  };

  const analyze = async () => {
    if (!entityId) {
      setNotice('پس از اولین ذخیره محتوا، تحلیل کامل امتیاز سئو فعال می‌شود.');
      return;
    }
    setBusy('analyze');
    try {
      const result = await api(`/api/seo/entities/${entityType}/${encodeURIComponent(entityId)}/analyze`, {
        method: 'POST',
        body: '{}'
      });
      setScore(Number(result?.analysis?.score || 0));
      setAnalysis(result?.analysis || null);
      setNotice(`تحلیل انجام شد؛ امتیاز فعلی ${Number(result?.analysis?.score || 0).toLocaleString('fa-IR')} از ۱۰۰ است.`);
    } catch {
      setNotice('تحلیل سئو انجام نشد.');
    } finally {
      setBusy('');
    }
  };

  const optimizeContentImages = async () => {
    if (!entityId || entityType === 'page') {
      setNotice(entityType === 'page' ? 'سئوی تصاویر برگه از بخش تصاویر همین پنل مدیریت می‌شود.' : 'ابتدا محتوا را ذخیره کنید.');
      return;
    }
    setBusy('image');
    try {
      const result = await api(`/api/seo/entities/${entityType}/${encodeURIComponent(entityId)}/image-seo`, {
        method: 'POST',
        body: '{}'
      });
      const synced = await syncMediaSeoMap(seo.images || {}).catch(() => 0);
      setNotice(`${Number(result?.changed || 0).toLocaleString('fa-IR')} تصویر داخل متن بهینه شد و متادیتای ${synced.toLocaleString('fa-IR')} رسانه گالری همگام شد.`);
    } catch {
      setNotice('بهینه‌سازی ALT تصاویر داخل متن انجام نشد.');
    } finally {
      setBusy('');
    }
  };

  const autoFillImageSeo = async () => {
    const nextImages = { ...(seo.images || {}) };
    images.filter(Boolean).forEach((url, index) => {
      const current = nextImages[url] || { alt: '' };
      nextImages[url] = {
        ...current,
        alt: current.alt || `${seo.focusKeyword || entityTitle}${index ? ` - ${index + 1}` : ''}`,
        title: current.title || entityTitle,
        caption: current.caption || '',
        description: current.description || seo.metaDescription || entityTitle
      };
    });
    patch({ images: nextImages });
    const synced = await syncMediaSeoMap(nextImages).catch(() => 0);
    setNotice(`متادیتای تصویر تکمیل شد؛ ${synced.toLocaleString('fa-IR')} رسانه محلی نیز در کتابخانه رسانه به‌روزرسانی شد.`);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer bg-white/80 hover:bg-white"
      >
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          <div>
            <strong className="block text-sm text-neutral-900">TakRank SEO این محتوا</strong>
            <span className="text-[10px] text-neutral-500">متا، کلمات کلیدی، اسکیما، شبکه‌های اجتماعی، بردکرامب، رسانه و سئوی تصاویر</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {score !== null && <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">{score.toLocaleString('fa-IR')}/۱۰۰</span>}
          <span className="text-xs font-bold text-neutral-500">{expanded ? 'بستن' : 'باز کردن'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-5 border-t border-emerald-100">
          {onAiContent && <div className="p-4 bg-white border rounded-xl space-y-3">
            <strong className="text-sm">تولید و ویرایش محتوا با هوش مصنوعی</strong>
            <p className="text-[10px] text-neutral-500 leading-relaxed">تمام فیلدهای محصول/مقاله که در ادمین ثبت شده‌اند، شامل مشخصات فنی، فیتمنت، سازندگان، دسته‌ها، روابط و گزینه‌های فعال، به AI داده می‌شوند. جداول مشخصات و سازگاری نیز به‌صورت خودکار درخواست می‌شوند.</p>
            <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} placeholder="دستور تکمیلی، کلمه کلیدی یا نکته معتبر محصول/مقاله" className="w-full p-3 border rounded-xl text-xs" />
            <div className="flex gap-2"><button type="button" disabled={!!busy} onClick={() => void generateAi('generate')} className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs">تولید محتوا و سئو</button><button type="button" disabled={!!busy} onClick={() => void generateAi('optimize')} className="px-3 py-2 bg-blue-700 text-white rounded-lg text-xs">ویرایش و بهینه‌سازی</button></div>
            {busy === 'ai' && <p className="text-xs">در حال دریافت پاسخ سرویس هوش مصنوعی…</p>}
            {aiPreview && <div className="space-y-3">
              <input aria-label="عنوان سئوی پیشنهادی" value={aiPreview.seoTitle || ''} onChange={e => setAiPreview({ ...aiPreview, seoTitle: e.target.value })} className="w-full p-2 border rounded-lg" />
              <textarea aria-label="توضیحات متای پیشنهادی" value={aiPreview.metaDescription || ''} onChange={e => setAiPreview({ ...aiPreview, metaDescription: e.target.value })} className="w-full p-2 border rounded-lg" />
              <RichTextEditor
                label="توضیحات کوتاه پیشنهادی"
                value={aiPreview.shortDescription || ''}
                onChange={next => setAiPreview({ ...aiPreview, shortDescription: next })}
                rows={4}
                placeholder="خلاصه حرفه‌ای محصول/مقاله..."
              />
              <RichTextEditor
                label="محتوای کامل پیشنهادی"
                value={aiPreview.contentHtml || ''}
                onChange={next => setAiPreview({ ...aiPreview, contentHtml: next })}
                rows={10}
                placeholder="محتوای ساختاریافته همراه تیتر، لیست و جدول..."
              />
              <button type="button" onClick={() => void applyAiToForm()} className="px-3 py-2 bg-emerald-700 text-white rounded-lg text-xs">اعمال در فرم برای ذخیره</button>
            </div>}
          </div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2">
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">عنوان سئو</span>
              <input value={seo.seoTitle || ''} onChange={e => patch({ seoTitle: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white" placeholder={entityTitle} />
              <span className="block mt-1 text-[9px] text-neutral-400">{(seo.seoTitle || '').length.toLocaleString('fa-IR')} کاراکتر</span>
            </label>

            <label className="sm:col-span-2">
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">توضیحات متا</span>
              <textarea rows={3} value={seo.metaDescription || ''} onChange={e => patch({ metaDescription: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white" placeholder="توضیح دقیق برای نتیجه جستجوی گوگل..." />
              <span className="block mt-1 text-[9px] text-neutral-400">{(seo.metaDescription || '').length.toLocaleString('fa-IR')} کاراکتر</span>
            </label>

            <label>
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">کلمه کلیدی اصلی</span>
              <input value={seo.focusKeyword || ''} onChange={e => patch({ focusKeyword: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white" />
            </label>
            <label>
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">کلمات کلیدی فرعی</span>
              <input
                value={(seo.secondaryKeywords || []).join('، ')}
                onChange={e => patch({ secondaryKeywords: e.target.value.split(/[،,]/).map(x => x.trim()).filter(Boolean) })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                placeholder="کلمه ۱، کلمه ۲، کلمه ۳"
              />
            </label>

            <label>
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">عنوان بردکرامب</span>
              <input value={seo.breadcrumbTitle || ''} onChange={e => patch({ breadcrumbTitle: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white" />
            </label>
            <label>
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">Canonical URL</span>
              <input dir="ltr" value={seo.canonicalUrl || ''} onChange={e => patch({ canonicalUrl: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-left" />
            </label>

            <label>
              <span className="block text-[11px] font-bold text-neutral-700 mb-1">نوع Schema</span>
              <select value={seo.schemaType || ''} onChange={e => patch({ schemaType: e.target.value })} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white">
                {entityType === 'product' && <option value="Product">Product / محصول</option>}
                {entityType === 'article' && <><option value="Article">Article / مقاله</option><option value="NewsArticle">NewsArticle</option><option value="HowTo">HowTo</option></>}
                {entityType === 'page' && <><option value="WebPage">WebPage / برگه</option><option value="AboutPage">AboutPage</option><option value="ContactPage">ContactPage</option><option value="FAQPage">FAQPage</option></>}
                {['category','brand','model'].includes(entityType) && <><option value="CollectionPage">CollectionPage / صفحه آرشیو</option><option value="WebPage">WebPage</option></>}
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={seo.robotsIndex !== false} onChange={e => patch({ robotsIndex: e.target.checked })} />
                <span className="text-[10px] font-bold">Index</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={seo.robotsFollow !== false} onChange={e => patch({ robotsFollow: e.target.checked })} />
                <span className="text-[10px] font-bold">Follow</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={Boolean(seo.cornerstone)} onChange={e => patch({ cornerstone: e.target.checked })} />
                <span className="text-[10px] font-bold">محتوای پایه</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <strong className="text-xs text-neutral-900">شبکه‌های اجتماعی</strong>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={seo.ogTitle || ''} onChange={e => patch({ ogTitle: e.target.value })} placeholder="عنوان Open Graph" className="p-2.5 border border-neutral-300 rounded-xl" />
              <input dir="ltr" value={seo.ogImageUrl || ''} onChange={e => patch({ ogImageUrl: e.target.value })} placeholder="تصویر Open Graph" className="p-2.5 border border-neutral-300 rounded-xl text-left" />
              <textarea rows={2} value={seo.ogDescription || ''} onChange={e => patch({ ogDescription: e.target.value })} placeholder="توضیحات Open Graph" className="sm:col-span-2 p-2.5 border border-neutral-300 rounded-xl" />
            </div>
          </div>

          {images.filter(Boolean).length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-600" />
                  <div>
                    <strong className="block text-xs text-neutral-900">سئوی تصاویر و رسانه</strong>
                    <span className="text-[9px] text-neutral-500">ALT، Title، Caption و توضیح هر تصویر؛ برای فایل‌های محلی با کتابخانه رسانه هم همگام می‌شود.</span>
                  </div>
                </div>
                <button type="button" onClick={() => void autoFillImageSeo()} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-bold cursor-pointer">تکمیل و همگام‌سازی</button>
              </div>

              <div className="space-y-3">
                {images.filter(Boolean).map((url, index) => {
                  const imageSeo = seo.images?.[url] || { alt: '' };
                  return (
                    <div key={url + index} className="grid grid-cols-[64px_1fr] gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-white border border-neutral-200" />
                      <div className="grid sm:grid-cols-2 gap-2 min-w-0">
                        <input value={imageSeo.alt || ''} onChange={e => setImageField(url, 'alt', e.target.value)} placeholder="ALT تصویر" className="p-2 border border-neutral-300 rounded-lg min-w-0" />
                        <input value={imageSeo.title || ''} onChange={e => setImageField(url, 'title', e.target.value)} placeholder="Title تصویر" className="p-2 border border-neutral-300 rounded-lg min-w-0" />
                        <input value={imageSeo.caption || ''} onChange={e => setImageField(url, 'caption', e.target.value)} placeholder="Caption / کپشن" className="p-2 border border-neutral-300 rounded-lg min-w-0" />
                        <input value={imageSeo.description || ''} onChange={e => setImageField(url, 'description', e.target.value)} placeholder="توضیح تصویر" className="p-2 border border-neutral-300 rounded-lg min-w-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis?.checks?.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <strong className="block text-xs text-neutral-900">تحلیل کامل TakRank SEO</strong>
                  <span className="text-[9px] text-neutral-500">
                    {Number(analysis.wordCount || 0).toLocaleString('fa-IR')} کلمه • تراکم {Number(analysis.keywordDensity || 0).toLocaleString('fa-IR')}٪ • {Number(analysis.internalLinks || 0).toLocaleString('fa-IR')} لینک داخلی
                  </span>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-black ${Number(analysis.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-700' : Number(analysis.score || 0) >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {Number(analysis.score || 0).toLocaleString('fa-IR')}/۱۰۰
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {analysis.checks.map((check: any) => (
                  <div key={check.key} className={`p-2.5 rounded-xl border ${check.status === 'good' ? 'bg-emerald-50 border-emerald-100' : check.status === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[10px] text-neutral-800">{check.label}</strong>
                      <span className="text-[9px] font-black">{Number(check.score || 0).toLocaleString('fa-IR')}/{Number(check.max || 0).toLocaleString('fa-IR')}</span>
                    </div>
                    <p className="text-[9px] text-neutral-500 mt-1 leading-relaxed">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notice && <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold">{notice}</div>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveMetaNow} disabled={Boolean(busy)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              ذخیره سئو
            </button>
            <button type="button" onClick={analyze} disabled={Boolean(busy)} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <Gauge className="w-3.5 h-3.5" />
              تحلیل و امتیازدهی
            </button>
            {(entityType === 'product' || entityType === 'article') && (
              <button type="button" onClick={optimizeContentImages} disabled={Boolean(busy)} className="px-4 py-2 bg-violet-100 text-violet-800 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                <ShieldCheck className="w-3.5 h-3.5" />
                سئوی تصاویر متن + رسانه
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
