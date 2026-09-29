import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Gauge, Image as ImageIcon, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { SeoEntityDraft } from '../../types';

type EntityType = 'product' | 'article' | 'page';

interface AdminEntitySeoPanelProps {
  entityType: EntityType;
  entityId?: string;
  entityTitle: string;
  value?: SeoEntityDraft;
  images?: string[];
  onChange: (value: SeoEntityDraft) => void;
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
  schemaType: type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebPage',
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

export const AdminEntitySeoPanel: React.FC<AdminEntitySeoPanelProps> = ({
  entityType,
  entityId,
  entityTitle,
  value,
  images = [],
  onChange
}) => {
  const [expanded, setExpanded] = useState(true);
  const [busy, setBusy] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [notice, setNotice] = useState('');
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
      setScore(Number(result?.meta?.score || 0));
      setNotice('اطلاعات TakRank SEO ذخیره شد.');
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
      setNotice(`${Number(result?.changed || 0).toLocaleString('fa-IR')} تصویر داخل متن بهینه شد.`);
    } catch {
      setNotice('بهینه‌سازی ALT تصاویر داخل متن انجام نشد.');
    } finally {
      setBusy('');
    }
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
            <span className="text-[10px] text-neutral-500">متا، کلمات کلیدی، اسکیما، شبکه‌های اجتماعی، بردکرامب و سئوی تصاویر</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {score !== null && <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">{score.toLocaleString('fa-IR')}/۱۰۰</span>}
          <span className="text-xs font-bold text-neutral-500">{expanded ? 'بستن' : 'باز کردن'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-5 border-t border-emerald-100">
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
                    <strong className="block text-xs text-neutral-900">سئوی تصاویر</strong>
                    <span className="text-[9px] text-neutral-500">ALT، Title، Caption و توضیح هر تصویر به‌صورت مستقل</span>
                  </div>
                </div>
                <button type="button" onClick={() => {
                  const nextImages = { ...(seo.images || {}) };
                  images.filter(Boolean).forEach((url, index) => {
                    const current = nextImages[url] || { alt: '' };
                    nextImages[url] = {
                      ...current,
                      alt: current.alt || `${seo.focusKeyword || entityTitle}${index ? ` - ${index + 1}` : ''}`,
                      title: current.title || entityTitle
                    };
                  });
                  patch({ images: nextImages });
                }} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-bold cursor-pointer">تکمیل خودکار</button>
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
                ALT تصاویر داخل متن
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
