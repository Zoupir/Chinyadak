import React, { useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SiteSettings } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { Palette, Sparkles, Check, Sun, Type, Globe, Search, Package, PhoneCall, LayoutTemplate, Download, Upload, RotateCcw } from 'lucide-react';

export const AdminThemeTab: React.FC = () => {
  const { settings, updateSettings, showToast, pages, sliders, updatePage, updateSlider } = useStore();

  const [form, setForm] = useState<SiteSettings>({ ...settings });
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'theme' | 'colors' | 'typography' | 'seo' | 'loyalty'>('identity');
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const LAYOUT_PRESETS = [
    {
      id: 'classic',
      name: 'قالب فعلی (Classic)',
      desc: 'چیدمان متعادل فعلی با کارت‌های استاندارد و Header دو ردیفه.',
      layoutPreset: 'classic' as const,
      themeMode: 'light' as const,
      siteBgColor: '#f8fafc',
      cardBgColor: '#ffffff',
      headerBgColor: '#ffffff',
      footerBgColor: '#0f172a',
      textColor: '#0f172a',
      primaryColor: '#DC2626',
      primaryHover: '#b91c1c',
      accentGlowColor: '#DC2626'
    },
    {
      id: 'catalog-pro',
      name: 'Catalog Pro',
      desc: 'فروشگاهی و فشرده؛ محصول بیشتر در هر ردیف، کارت‌های کم‌ارتفاع و Header سریع.',
      layoutPreset: 'catalog-pro' as const,
      themeMode: 'light' as const,
      siteBgColor: '#f3f4f6',
      cardBgColor: '#ffffff',
      headerBgColor: '#ffffff',
      footerBgColor: '#111827',
      textColor: '#111827',
      primaryColor: '#DC2626',
      primaryHover: '#b91c1c',
      accentGlowColor: '#DC2626'
    },
    {
      id: 'showroom',
      name: 'Showroom Luxe',
      desc: 'نمایشی و لوکس؛ فضای باز، کارت‌های بزرگ و گرد، سکشن‌های برند و خودرو با حس Showroom.',
      layoutPreset: 'showroom' as const,
      themeMode: 'light' as const,
      siteBgColor: '#f7f4ef',
      cardBgColor: '#ffffff',
      headerBgColor: '#ffffff',
      footerBgColor: '#292524',
      textColor: '#292524',
      primaryColor: '#B45309',
      primaryHover: '#92400E',
      accentGlowColor: '#D97706'
    },
    {
      id: 'marketplace-rtl',
      name: 'Marketplace RTL Pro',
      desc: 'قالب فروشگاهی کامل مطابق مرجع ارسالی: هدر چندلایه، اسلایدر عریض، انتخاب خودرو، دسته‌بندی دایره‌ای، بنرهای متعدد، ردیف‌های محصول، برندها، مقالات و فوتر فروشگاهی؛ کاملاً راست‌چین.',
      layoutPreset: 'marketplace-rtl' as const,
      themeMode: 'light' as const,
      siteBgColor: '#f5f6f7',
      cardBgColor: '#ffffff',
      headerBgColor: '#07558f',
      footerBgColor: '#111111',
      textColor: '#111827',
      primaryColor: '#f59e0b',
      primaryHover: '#d97706',
      accentGlowColor: '#f59e0b'
    }
  ];

  const applyLayoutPreset = (preset: typeof LAYOUT_PRESETS[number]) => {
    const updated: SiteSettings = {
      ...form,
      layoutPreset: preset.layoutPreset,
      themeMode: preset.themeMode,
      siteBgColor: preset.siteBgColor,
      cardBgColor: preset.cardBgColor,
      headerBgColor: preset.headerBgColor,
      footerBgColor: preset.footerBgColor,
      textColor: preset.textColor,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      accentGlowColor: preset.accentGlowColor
    };
    setForm(updated);
    updateSettings(updated);
    showToast(`قالب «${preset.name}» روی سایت فعال شد.`);
  };

  // Preset color themes
  const THEME_PRESETS = [
    {
      id: 'dark',
      name: 'دارک اسپرت (Dark Sport)',
      desc: 'تم تیره مسابقه‌ای با هایلایت قرمز و کنتراست بالا',
      siteBgColor: '#0a0a0a',
      cardBgColor: '#171717',
      headerBgColor: '#0a0a0a',
      footerBgColor: '#0a0a0a',
      textColor: '#ffffff',
      primaryColor: '#DC2626',
      primaryHover: '#b91c1c',
      accentGlowColor: '#DC2626',
      themeMode: 'dark' as const
    },
    {
      id: 'light',
      name: 'لایت مدرن (Clean Light)',
      desc: 'تم روشن و شفاف، پس‌زمینه سفید با کارت‌های ملایم',
      siteBgColor: '#f8fafc',
      cardBgColor: '#ffffff',
      headerBgColor: '#ffffff',
      footerBgColor: '#0f172a',
      textColor: '#0f172a',
      primaryColor: '#DC2626',
      primaryHover: '#b91c1c',
      accentGlowColor: '#DC2626',
      themeMode: 'light' as const
    },
    {
      id: 'slate',
      name: 'لاکچری طوسی (Luxury Slate)',
      desc: 'خاکستری تیره لوکس با المان‌های شیشه‌ای و شیک',
      siteBgColor: '#0f172a',
      cardBgColor: '#1e293b',
      headerBgColor: '#0f172a',
      footerBgColor: '#020617',
      textColor: '#f8fafc',
      primaryColor: '#059669',
      primaryHover: '#047857',
      accentGlowColor: '#10b981',
      themeMode: 'slate' as const
    },
    {
      id: 'navy',
      name: 'سورمه‌ای متالیک (Cyber Navy)',
      desc: 'آبی تیره با جلوه های‌تک، مناسب قطعات مدرن توربو',
      siteBgColor: '#020617',
      cardBgColor: '#0f172a',
      headerBgColor: '#020617',
      footerBgColor: '#020617',
      textColor: '#ffffff',
      primaryColor: '#2563EB',
      primaryHover: '#1d4ed8',
      accentGlowColor: '#3b82f6',
      themeMode: 'navy' as const
    }
  ];

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    const updated = {
      ...form,
      themeMode: preset.themeMode,
      siteBgColor: preset.siteBgColor,
      cardBgColor: preset.cardBgColor,
      headerBgColor: preset.headerBgColor,
      footerBgColor: preset.footerBgColor,
      textColor: preset.textColor,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      accentGlowColor: preset.accentGlowColor
    };
    setForm(updated);
    updateSettings(updated);
    showToast(`تم "${preset.name}" با موفقیت بر کل وب‌سایت اعمال شد.`);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(form);
    showToast('تنظیمات قالب، رنگ‌ها و سئو ذخیره و بر کل وب‌سایت اعمال شد.');
  };

  const downloadThemeBackup = () => {
    const payload = {
      format: 'yadak-store-theme-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: form,
      pages,
      sliders
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yadak-store-theme-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('نسخه پشتیبان تنظیمات قالب ساخته شد.');
  };

  const restoreThemeBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== 'yadak-store-theme-backup' || !parsed?.settings) {
        showToast('فایل پشتیبان قالب معتبر نیست.', 'error');
        return;
      }
      if (!window.confirm('تنظیمات قالب، برگه‌های Builder و اسلایدرها از این نسخه پشتیبان بازیابی شوند؟')) return;

      setForm(parsed.settings);
      updateSettings(parsed.settings);

      if (Array.isArray(parsed.pages)) {
        parsed.pages.forEach((page: any) => page?.id && updatePage(page));
      }
      if (Array.isArray(parsed.sliders)) {
        parsed.sliders.forEach((slide: any) => slide?.id && updateSlider(slide));
      }
      showToast('بازیابی قالب شروع شد و تنظیمات ذخیره شدند.');
    } catch {
      showToast('خواندن فایل پشتیبان انجام نشد.', 'error');
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    }
  };

  const resetThemeAppearance = () => {
    if (!window.confirm('ظاهر قالب به تنظیمات استاندارد Marketplace RTL برگردد؟ محصولات، سفارش‌ها و محتوای سایت حذف نمی‌شوند.')) return;
    const reset: Partial<SiteSettings> = {
      layoutPreset: 'marketplace-rtl',
      themeMode: 'light',
      siteBgColor: '#f5f6f7',
      cardBgColor: '#ffffff',
      headerBgColor: '#07558f',
      footerBgColor: '#111111',
      textColor: '#111827',
      primaryColor: '#f59e0b',
      primaryHover: '#d97706',
      accentGlowColor: '#f59e0b',
      fontFamily: 'Vazirmatn',
      fontSize: 'normal',
      baseFontSizePx: 16,
      mobileProductColumns: 2,
      mobileFooterColumns: 2,
      mobileLogoAlign: 'right',
      mobileLogoWidthPx: 118,
      borderRadius: 'normal',
      themeRadiusPx: 10,
      headerStyle: 'primary',
      containerWidth: 'normal'
    };
    const next = { ...form, ...reset };
    setForm(next);
    updateSettings(reset);
    showToast('ظاهر قالب بدون حذف محتوا ریست شد.');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              کنترل‌کننده متمرکز استایل و سئو
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-red-600" />
            <span>مدیریت پوسته، رنگ‌ها، هایلایت دکمه‌ها و سئوی سایت</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            شخصی‌سازی آنی تمام رنگ‌های وب‌سایت، پس‌زمینه‌ها، رنگ درخشش زیر دکمه‌ها و متاتگ‌های رتبه‌بندی گوگل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={event => void restoreThemeBackup(event.target.files?.[0])}
          />
          <button type="button" onClick={downloadThemeBackup} className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-[10px] font-black inline-flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> بکاپ قالب
          </button>
          <button type="button" onClick={() => restoreInputRef.current?.click()} className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-[10px] font-black inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> بازیابی
          </button>
          <button type="button" onClick={resetThemeAppearance} className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black inline-flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> ریست ظاهر قالب
          </button>
        </div>

        {/* Subtab Navigation */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('identity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'identity' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            <span>هویت سایت</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('theme')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'theme' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>پوسته‌ها و قالب</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('colors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'colors' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>رنگ‌ها و هایلایت</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('typography')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'typography' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>فونت و هندسه</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'seo' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>تنظیمات سئو (SEO)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('loyalty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'loyalty' ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>باشگاه مشتریان و امتیازات</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">

        {/* =========================================================================
            SITE IDENTITY
        ========================================================================= */}
        {activeSubTab === 'identity' && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>هویت و نام وب‌سایت</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                نام، لوگو و اطلاعاتی که در هدر، فوتر و داده‌های هویتی سئو نمایش داده می‌شوند از این بخش کنترل می‌شوند.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-neutral-700 font-bold text-xs mb-1">نام سایت *</label>
                <input
                  type="text"
                  value={form.siteTitle || ''}
                  onChange={e => setForm({ ...form, siteTitle: e.target.value })}
                  placeholder="مثال: یدک استور"
                  className="w-full p-3 border border-neutral-300 rounded-xl text-sm font-bold"
                  required
                />
                <p className="text-[10px] text-neutral-400 mt-1">این نام جایگزین نام‌های پیش‌فرض در هدر و فوتر می‌شود و با هویت TakRank SEO همگام خواهد شد.</p>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-neutral-700 font-bold text-xs mb-1">شعار یا توضیح کوتاه سایت</label>
                <input
                  type="text"
                  value={form.siteSlogan || ''}
                  onChange={e => setForm({ ...form, siteSlogan: e.target.value })}
                  className="w-full p-3 border border-neutral-300 rounded-xl text-xs"
                  placeholder="توضیح کوتاه درباره فروشگاه"
                />
              </div>

              <ImageUploadInput
                label="لوگوی سایت"
                value={form.logoUrl || ''}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
                aspectRatio="auto"
                presetCategory="logos"
                placeholder="آپلود لوگو یا آدرس تصویر"
                helperText="در هدر، فوتر و هویت ساختاریافته سایت استفاده می‌شود."
              />

              <ImageUploadInput
                label="Favicon"
                value={form.faviconUrl || ''}
                onChange={(url) => setForm({ ...form, faviconUrl: url })}
                aspectRatio="square"
                presetCategory="favicons"
                placeholder="آیکن مرورگر"
                helperText="ترجیحاً تصویر مربعی PNG یا SVG"
              />

              <div>
                <label className="block text-neutral-700 font-bold text-xs mb-1">شماره تماس اصلی</label>
                <input type="text" value={form.contactPhone || ''} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs" dir="ltr" />
              </div>
              <div>
                <label className="block text-neutral-700 font-bold text-xs mb-1">شماره پشتیبانی</label>
                <input type="text" value={form.supportPhone || ''} onChange={e => setForm({ ...form, supportPhone: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs" dir="ltr" />
              </div>
              <div>
                <label className="block text-neutral-700 font-bold text-xs mb-1">ایمیل پشتیبانی</label>
                <input type="email" value={form.supportEmail || ''} onChange={e => setForm({ ...form, supportEmail: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs" dir="ltr" />
              </div>
              <div>
                <label className="block text-neutral-700 font-bold text-xs mb-1">متن نوار اطلاع‌رسانی</label>
                <input type="text" value={form.announcementText || ''} onChange={e => setForm({ ...form, announcementText: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-neutral-700 font-bold text-xs mb-1">آدرس</label>
                <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="w-full p-3 border border-neutral-300 rounded-xl text-xs" />
              </div>
            </div>
          </div>
        )}
        
        {/* =========================================================================
            SUBTAB 1: PRESET THEMES & PALETTES
        ========================================================================= */}
        {activeSubTab === 'theme' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-violet-600" />
                  <h3 className="font-black text-base text-neutral-900">قالب‌های کامل سایت</h3>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  این گزینه فقط رنگ را تغییر نمی‌دهد؛ شکل Header، فاصله سکشن‌ها، فرم کارت‌ها و تراکم فروشگاه را عوض می‌کند.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {LAYOUT_PRESETS.map(preset => {
                  const active = (form.layoutPreset || 'classic') === preset.layoutPreset;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyLayoutPreset(preset)}
                      className={`text-right p-4 rounded-2xl border-2 transition-all ${active ? 'border-violet-600 ring-2 ring-violet-100' : 'border-neutral-200 hover:border-neutral-300'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-black text-sm text-neutral-900">{preset.name}</div>
                          <div className="text-[10px] text-neutral-500 mt-1">{preset.desc}</div>
                        </div>
                        {active && <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                      </div>

                      <div className={`h-36 border border-neutral-200 overflow-hidden bg-neutral-50 ${preset.layoutPreset === 'showroom' ? 'rounded-[24px] p-3' : preset.layoutPreset === 'catalog-pro' ? 'rounded-md p-2' : 'rounded-xl p-2.5'}`}>
                        <div className={`h-5 mb-2 ${preset.layoutPreset === 'showroom' ? 'rounded-full bg-neutral-800/90' : preset.layoutPreset === 'catalog-pro' ? 'rounded-sm bg-neutral-900' : 'rounded-lg bg-neutral-800'}`} />
                        <div className={`grid gap-2 h-[92px] ${preset.layoutPreset === 'showroom' ? 'grid-cols-2' : preset.layoutPreset === 'catalog-pro' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                          {Array.from({ length: preset.layoutPreset === 'catalog-pro' ? 4 : preset.layoutPreset === 'showroom' ? 2 : 3 }).map((_, i) => (
                            <div key={i} className={`bg-white border border-neutral-200 overflow-hidden ${preset.layoutPreset === 'showroom' ? 'rounded-2xl p-2 shadow-md' : preset.layoutPreset === 'catalog-pro' ? 'rounded-sm p-1' : 'rounded-lg p-1.5'}`}>
                              <div className={`bg-neutral-200 h-10 ${preset.layoutPreset === 'showroom' ? 'rounded-xl' : preset.layoutPreset === 'catalog-pro' ? 'rounded-sm' : 'rounded-md'}`} />
                              <div className="mt-2 h-1.5 bg-neutral-300 rounded-full" />
                              <div className="mt-1 h-1.5 w-2/3 bg-neutral-200 rounded-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>پوسته‌های آماده فروشگاه (تغییر تم از مشکی به سایر تم‌ها)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                با یک کلیک تم کلی سایت را بین تیره اسپرت، روشن، طوسی یا سورمه‌ای سوئیچ کنید
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {THEME_PRESETS.map(preset => {
                const isSelected = form.themeMode === preset.themeMode;
                return (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                      isSelected
                        ? 'border-red-600 shadow-lg ring-2 ring-red-500/20 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900">{preset.name}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500">{preset.desc}</p>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <div className="w-6 h-6 rounded-lg border shadow-xs" style={{ backgroundColor: preset.siteBgColor }} title="پس‌زمینه" />
                      <div className="w-6 h-6 rounded-lg border shadow-xs" style={{ backgroundColor: preset.cardBgColor }} title="کارت‌ها" />
                      <div className="w-6 h-6 rounded-lg border shadow-xs" style={{ backgroundColor: preset.primaryColor }} title="رنگ اصلی" />
                      <div className="w-6 h-6 rounded-lg border shadow-xs" style={{ backgroundColor: preset.accentGlowColor }} title="هایلایت دکمه‌ها" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Brand Logo & Favicon in Theme tab */}
            <div className="pt-6 border-t border-neutral-100 space-y-4">
              <h4 className="font-bold text-sm text-neutral-900">لوگوی فروشگاه و آیکون مرورگر (Favicon):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadInput
                  label="لوگوی اصلی سایت (Header & Invoice):"
                  value={form.logoUrl || ''}
                  onChange={url => setForm({ ...form, logoUrl: url })}
                  placeholder="https://..."
                  helperText="در هدر، فوتر، فاکتورهای رسمی و چاپ پیش‌فاکتور نمایش داده می‌شود."
                />
                <ImageUploadInput
                  label="آیکون برگه مرورگر (Favicon):"
                  value={form.faviconUrl || ''}
                  onChange={url => setForm({ ...form, faviconUrl: url })}
                  aspectRatio="square"
                  placeholder="https://..."
                  helperText="به‌صورت آنی در تب مرورگر و بوکمارک‌های کاربران اعمال می‌گردد."
                />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 2: GRANULAR COLOR CONTROLLER (PRIMARY, HOVER, GLOW, BACKGROUNDS)
        ========================================================================= */}
        {activeSubTab === 'colors' && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-red-600" />
                <span>کنترل متمرکز کلیه رنگ‌ها و هایلایت‌های وب‌سایت</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                تغییر رنگ دکمه‌ها، رنگ هاور، هایلایت درخشان زیر دکمه‌ها و پس‌زمینه بخش‌های مختلف
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Primary Color */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-neutral-800">رنگ سازمانی و دکمه‌های اصلی (--primary-color):</label>
                  <span className="font-mono text-xs">{form.primaryColor || '#DC2626'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor || '#DC2626'}
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.primaryColor || '#DC2626'}
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-neutral-500">دکمه‌های خرید، آیکون‌ها و لینک‌ها</span>
                </div>
              </div>

              {/* Button Hover Color */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-neutral-800">رنگ حالت نگه داشتن موس روی دکمه‌ها (--primary-hover):</label>
                  <span className="font-mono text-xs">{form.primaryHover || '#b91c1c'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryHover || '#b91c1c'}
                    onChange={e => setForm({ ...form, primaryHover: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.primaryHover || '#b91c1c'}
                    onChange={e => setForm({ ...form, primaryHover: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-neutral-500">حالت Mouse Hover دکمه‌ها</span>
                </div>
              </div>

              {/* Accent Glow Color (Red highlight under buttons, cards, hover) */}
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-xs text-red-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span>رنگ هایلایت و درخشش زیر دکمه‌ها و باکس‌ها (--accent-glow):</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-red-800">{form.accentGlowColor || '#DC2626'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentGlowColor || '#DC2626'}
                    onChange={e => setForm({ ...form, accentGlowColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.accentGlowColor || '#DC2626'}
                    onChange={e => setForm({ ...form, accentGlowColor: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-red-700 font-medium">سایه‌های قرمز زیر دکمه‌ها و فوکوس</span>
                </div>
              </div>

              {/* Site Background Color */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-neutral-800">رنگ پس‌زمینه سراسری وب‌سایت (--site-bg):</label>
                  <span className="font-mono text-xs">{form.siteBgColor || '#0a0a0a'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.siteBgColor || '#0a0a0a'}
                    onChange={e => setForm({ ...form, siteBgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.siteBgColor || '#0a0a0a'}
                    onChange={e => setForm({ ...form, siteBgColor: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-neutral-500">پس‌زمینه اصلی صفحات</span>
                </div>
              </div>

              {/* Card / Box Background */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-neutral-800">رنگ پس‌زمینه کارت‌های کالا و سکشن‌ها (--card-bg):</label>
                  <span className="font-mono text-xs">{form.cardBgColor || '#171717'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.cardBgColor || '#171717'}
                    onChange={e => setForm({ ...form, cardBgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.cardBgColor || '#171717'}
                    onChange={e => setForm({ ...form, cardBgColor: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-neutral-500">باکس قطعات و پنل‌ها</span>
                </div>
              </div>

              {/* Header Background */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-neutral-800">رنگ پس‌زمینه منوی بالای سایت (--header-bg):</label>
                  <span className="font-mono text-xs">{form.headerBgColor || '#0a0a0a'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.headerBgColor || '#0a0a0a'}
                    onChange={e => setForm({ ...form, headerBgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-neutral-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.headerBgColor || '#0a0a0a'}
                    onChange={e => setForm({ ...form, headerBgColor: e.target.value })}
                    className="w-32 p-2 border border-neutral-300 rounded-xl font-mono text-center text-xs uppercase"
                  />
                  <span className="text-[11px] text-neutral-500">هدر اصلی و مگامنو</span>
                </div>
              </div>

            </div>

            {/* Live Interactive Preview */}
            <div className="p-6 bg-neutral-900 text-white rounded-3xl border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-white">پیش‌نمایش زنده المان‌ها و هایلایت درخشان دکمه:</h4>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Primary: {form.primaryColor} | Glow: {form.accentGlowColor}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <button
                  type="button"
                  style={{
                    backgroundColor: form.primaryColor || '#DC2626',
                    boxShadow: `0 10px 25px -4px ${form.accentGlowColor || '#DC2626'}66`,
                    borderRadius: `${form.themeRadiusPx || 12}px`
                  }}
                  className="py-3 px-4 text-white font-black text-xs transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>دکمه خرید با هایلایت سفارشی</span>
                </button>

                <div 
                  style={{
                    borderRadius: `${form.themeRadiusPx || 12}px`,
                    borderColor: form.accentGlowColor || '#DC2626'
                  }}
                  className="p-3 bg-neutral-800/90 border flex items-center justify-between"
                >
                  <span className="text-[11px] font-bold text-white">نمونه کارت کالا</span>
                  <span style={{ color: form.primaryColor }} className="font-mono font-bold text-xs">
                    ۱,۴۵۰,۰۰۰ تومان
                  </span>
                </div>

                <button
                  type="button"
                  style={{
                    color: form.primaryColor || '#DC2626',
                    borderColor: form.primaryColor || '#DC2626',
                    borderRadius: `${form.themeRadiusPx || 12}px`
                  }}
                  className="py-3 px-4 border font-bold text-xs bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>استعلام تلفنی موجودی</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 3: TYPOGRAPHY, FONT SIZE & BORDER RADIUS
        ========================================================================= */}
        {activeSubTab === 'typography' && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Fonts */}
            <div className="space-y-3">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-red-600" />
                <span>فونت استاندارد وب‌سایت (Google Fonts CDN)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { id: 'Vazirmatn', label: 'وزیرمتن (پیش‌فرض)', desc: 'خوانایی عالی و مدرن' },
                  { id: 'Noto Sans Arabic', label: 'نوتو سنس', desc: 'فونت رسمی گوگل' },
                  { id: 'Rubik', label: 'روبیک اسپرت', desc: 'طراحی هندسی و جذاب' },
                  { id: 'Alexandria', label: 'الکساندریا', desc: 'خوانایی بالا در اعداد' },
                  { id: 'Cairo', label: 'قاهره', desc: 'فونت ضخیم خودرویی' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setForm({ ...form, fontFamily: f.id as any })}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      form.fontFamily === f.id
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-md ring-2 ring-red-500/30'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="block text-xs font-black">{f.label}</span>
                    <span className={`block text-[10px] mt-1 ${form.fontFamily === f.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {f.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Precise global font size */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-neutral-800">اندازه پایه فونت کل سایت</h4>
                  <p className="text-[10px] text-neutral-500 mt-1">این مقدار روی متن‌های عمومی فروشگاه، هدر، فوتر و رابط موبایل اثر می‌گذارد.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={12}
                    max={24}
                    value={form.baseFontSizePx || 16}
                    onChange={e => setForm({ ...form, baseFontSizePx: Math.max(12, Math.min(24, Number(e.target.value || 16))) })}
                    className="w-20 p-2 border border-neutral-300 rounded-lg text-center font-mono text-xs"
                  />
                  <span className="text-xs text-neutral-500">px</span>
                </div>
              </div>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={form.baseFontSizePx || 16}
                onChange={e => setForm({ ...form, baseFontSizePx: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
              <div
                className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800"
                style={{ fontSize: `${form.baseFontSizePx || 16}px` }}
              >
                پیش‌نمایش اندازه متن فروشگاه — قطعات یدکی خودروهای چینی
              </div>
            </div>

            {/* Mobile columns */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <h4 className="font-bold text-xs text-neutral-800">چیدمان موبایل</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="block text-[11px] font-bold mb-2">تعداد ستون محصولات</span>
                  <select value={form.mobileProductColumns || 2} onChange={e => setForm({ ...form, mobileProductColumns: Number(e.target.value) as 1 | 2 })} className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white">
                    <option value={1}>۱ ستون</option>
                    <option value={2}>۲ ستون</option>
                  </select>
                </label>
                <label className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="block text-[11px] font-bold mb-2">تعداد ستون فوتر</span>
                  <select value={form.mobileFooterColumns || 2} onChange={e => setForm({ ...form, mobileFooterColumns: Number(e.target.value) as 1 | 2 })} className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white">
                    <option value={1}>۱ ستون</option>
                    <option value={2}>۲ ستون</option>
                  </select>
                </label>
                <label className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="block text-[11px] font-bold mb-2">تعداد محصولات پیشنهادی</span>
                  <input type="number" min={1} max={50} value={form.relatedProductsCount || 4} onChange={e => setForm({ ...form, relatedProductsCount: Math.max(1, Math.min(50, Number(e.target.value || 4))) })} className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white text-center font-mono" />
                </label>
                <label className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <span className="block text-[11px] font-bold mb-2">جای لوگو در موبایل</span>
                  <select value={form.mobileLogoAlign || 'right'} onChange={e => setForm({ ...form, mobileLogoAlign: e.target.value as 'left'|'center'|'right' })} className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white">
                    <option value="right">راست</option>
                    <option value="center">وسط</option>
                    <option value="left">چپ</option>
                  </select>
                </label>
                <label className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 sm:col-span-2">
                  <span className="block text-[11px] font-bold mb-2">عرض لوگوی موبایل: {form.mobileLogoWidthPx || 118}px</span>
                  <input type="range" min={60} max={220} step={2} value={form.mobileLogoWidthPx || 118} onChange={e => setForm({ ...form, mobileLogoWidthPx: Number(e.target.value) })} className="w-full accent-red-600" />
                </label>
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-neutral-800">انحنای گوشه‌ها و لبه‌های قالب (--theme-radius):</h4>
                <span className="font-mono text-xs">{form.themeRadiusPx || 12} پیکسل</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={32}
                  step={2}
                  value={form.themeRadiusPx || 12}
                  onChange={e => setForm({ ...form, themeRadiusPx: Number(e.target.value) })}
                  className="w-64 accent-red-600"
                />
                <div 
                  style={{ borderRadius: `${form.themeRadiusPx || 12}px` }}
                  className="w-12 h-12 bg-red-600/30 border-2 border-red-600 flex items-center justify-center font-mono text-[10px] font-bold"
                >
                  {form.themeRadiusPx || 12}px
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 4: GLOBAL SEO SETTINGS PANEL
        ========================================================================= */}
        {activeSubTab === 'seo' && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                <span>تنظیمات جامع سئو، عناوین متا و کارت‌های اشتراک‌گذاری (SEO & OpenGraph)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                بهینه‌سازی تگ‌های گوگل برای رتبه‌بندی صدر نتایج و اشتراک‌گذاری حرفه‌ای در تلگرام، واتساپ و شبکه‌های اجتماعی
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان متای سراسری وب‌سایت (Meta Title):</label>
                <input
                  type="text"
                  value={form.metaTitle || ''}
                  onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="مثال: چین‌پارت | فروشگاه تخصصی قطعات یدکی خودروهای چینی با سیستم فیتمنت هوشمند"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">در برگه مرورگر و تیتر اول نتایج گوگل نمایش داده می‌شود.</span>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">توضیحات متای صفحه اصلی (Meta Description):</label>
                <textarea
                  rows={3}
                  value={form.metaDescription || ''}
                  onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="توضیحات ۱۶۰ کاراکتری برای ربات‌های موتور جستجوی گوگل..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">کلمات کلیدی اصلی سئو (Meta Keywords):</label>
                <input
                  type="text"
                  value={form.metaKeywords || ''}
                  onChange={e => setForm({ ...form, metaKeywords: e.target.value })}
                  placeholder="لوازم یدکی KMC J7, قطعات چری تیگو, قطعات فونیکس FX, لوازم جک S5"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">عنوان اشتراک‌گذاری اجتماعی (og:title):</label>
                  <input
                    type="text"
                    value={form.ogTitle || ''}
                    onChange={e => setForm({ ...form, ogTitle: e.target.value })}
                    placeholder="چین‌پارت پرو - مرجع قطعات خودروهای چینی"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">توضیحات شبکه‌های اجتماعی (og:description):</label>
                  <input
                    type="text"
                    value={form.ogDescription || ''}
                    onChange={e => setForm({ ...form, ogDescription: e.target.value })}
                    placeholder="تامین مستقیم قطعات اورجینال با ضمانت تطبیق فیتمنت"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <ImageUploadInput
                label="تصویر پیش‌نمایش اشتراک‌گذاری اجتماعی (OpenGraph Image - 1200x630):"
                value={form.ogImageUrl || ''}
                onChange={url => setForm({ ...form, ogImageUrl: url })}
                aspectRatio="banner"
                placeholder="https://..."
                helperText="هنگام ارسال لینک سایت در تلگرام، واتساپ یا شبکه‌های اجتماعی، این تصویر زیبا به همراه عنوان نمایش داده می‌شود."
              />
            </div>
          </div>
        )}

        {/* SUBTAB 5: LOYALTY POINT SYSTEM */}
        {activeSubTab === 'loyalty' && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>پیکربندی سیستم امتیاز وفاداری و باشگاه مشتریان</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  تنظیم نرخ کسب امتیاز به ازای هر خرید، ارزش ریالی امتیازات در تسویه، پاداش عضویت و محدودیت‌های فاکتور
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable / Disable Switch */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">فعال‌سازی سیستم امتیاز باشگاه مشتریان در فروشگاه:</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">در صورت غیرفعال بودن، امتیازدهی و باکس کسر امتیاز در سبد خرید پنهان خواهند شد.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.loyaltySettings?.enabled ?? true}
                    onChange={e => setForm({
                      ...form,
                      loyaltySettings: {
                        ...(form.loyaltySettings || {
                          enabled: true,
                          pointsPerToman: 0.0001,
                          tomanPerPoint: 1000,
                          minimumRedeemPoints: 50,
                          maxRedeemPercent: 50,
                          signupBonusPoints: 50,
                          firstOrderBonusPoints: 100
                        }),
                        enabled: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Grid Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <label className="block text-xs font-bold text-neutral-800">
                    ارزش ریالی هر ۱ امتیاز در تسویه (تومان):
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={form.loyaltySettings?.tomanPerPoint ?? 1000}
                    onChange={e => setForm({
                      ...form,
                      loyaltySettings: {
                        ...(form.loyaltySettings || {
                          enabled: true,
                          pointsPerToman: 0.0001,
                          tomanPerPoint: 1000,
                          minimumRedeemPoints: 50,
                          maxRedeemPercent: 50,
                          signupBonusPoints: 50,
                          firstOrderBonusPoints: 100
                        }),
                        tomanPerPoint: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left text-xs font-bold"
                  />
                  <span className="text-[11px] text-neutral-400 block">مثال: ۱۰۰۰ تومان (هر ۱ امتیاز = ۱,۰۰۰ تومان کسر هزینه سفارش)</span>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <label className="block text-xs font-bold text-neutral-800">
                    حداقل امتیاز مجاز برای استفاده در فاکتور:
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={form.loyaltySettings?.minimumRedeemPoints ?? 50}
                    onChange={e => setForm({
                      ...form,
                      loyaltySettings: {
                        ...(form.loyaltySettings || {
                          enabled: true,
                          pointsPerToman: 0.0001,
                          tomanPerPoint: 1000,
                          minimumRedeemPoints: 50,
                          maxRedeemPercent: 50,
                          signupBonusPoints: 50,
                          firstOrderBonusPoints: 100
                        }),
                        minimumRedeemPoints: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left text-xs font-bold"
                  />
                  <span className="text-[11px] text-neutral-400 block">مشتری تا قبل از رسیدن به این امتیاز امکان کسر در تسویه را ندارد.</span>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <label className="block text-xs font-bold text-neutral-800">
                    امتیاز هدیه خوش‌آمدگویی ثبت‌نام:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.loyaltySettings?.signupBonusPoints ?? 50}
                    onChange={e => setForm({
                      ...form,
                      loyaltySettings: {
                        ...(form.loyaltySettings || {
                          enabled: true,
                          pointsPerToman: 0.0001,
                          tomanPerPoint: 1000,
                          minimumRedeemPoints: 50,
                          maxRedeemPercent: 50,
                          signupBonusPoints: 50,
                          firstOrderBonusPoints: 100
                        }),
                        signupBonusPoints: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left text-xs font-bold"
                  />
                  <span className="text-[11px] text-neutral-400 block">امتیاز بلافاصله پس از ثبت‌نام به موجودی کاربر افزوده می‌شود.</span>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <label className="block text-xs font-bold text-neutral-800">
                    حداکثر درصد پرداخت فاکتور با امتیاز:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={form.loyaltySettings?.maxRedeemPercent ?? 50}
                    onChange={e => setForm({
                      ...form,
                      loyaltySettings: {
                        ...(form.loyaltySettings || {
                          enabled: true,
                          pointsPerToman: 0.0001,
                          tomanPerPoint: 1000,
                          minimumRedeemPoints: 50,
                          maxRedeemPercent: 50,
                          signupBonusPoints: 50,
                          firstOrderBonusPoints: 100
                        }),
                        maxRedeemPercent: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left text-xs font-bold"
                  />
                  <span className="text-[11px] text-neutral-400 block">سقف درصدی تخفیف با امتیاز از کل اقلام سفارش (مثلاً ۵۰٪).</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-white rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold">تغییرات به صورت لحظه‌ای در کل سیستم و CSS Variables ذخیره می‌شوند.</span>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره نهایی و اعمال بر کل فروشگاه</span>
          </button>
        </div>

      </form>

    </div>
  );
};
