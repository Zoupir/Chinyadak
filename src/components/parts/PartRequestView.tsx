import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Send, Upload, CheckCircle2, Clock, Sparkles, PhoneCall } from 'lucide-react';

interface PartRequestViewProps {
  initialQuery?: string;
  onNavigate: (view: string) => void;
}

export const PartRequestView: React.FC<PartRequestViewProps> = ({ initialQuery = '', onNavigate }) => {
  const { brands, models, submitPartRequest, selectedVehicle, pages, settings } = useStore();

  const requestPage = pages.find(page => page.slug === 'part-request');
  const section = (key: string) => requestPage?.sections.find(item => item.sectionKey === key);
  const sectionVisible = (key: string) => section(key)?.isVisible !== false;
  const sectionStyle = (key: string): React.CSSProperties => {
    const item = section(key);
    if (!item) return {};
    return {
      backgroundColor: item.backgroundColor || undefined,
      color: item.textColor || undefined,
      borderRadius: item.borderRadiusPx != null ? `${item.borderRadiusPx}px` : undefined,
      paddingTop: item.paddingTopPx != null ? `${item.paddingTopPx}px` : undefined,
      paddingBottom: item.paddingBottomPx != null ? `${item.paddingBottomPx}px` : undefined,
      paddingInline: item.paddingInlinePx != null ? `${item.paddingInlinePx}px` : undefined,
      width: item.fullWidth ? '100%' : `${Math.max(20, Math.min(100, Number(item.widthPercent ?? 100)))}%`,
      maxWidth: item.fullWidth || item.maxWidthPx === 0 ? 'none' : `${Number(item.maxWidthPx || 896)}px`,
      marginInline: 'auto'
    };
  };
  const contactSection = section('request-contact');
  const contactHref = contactSection?.buttonLink?.startsWith('tel:')
    ? contactSection.buttonLink
    : `tel:${settings.contactPhone || ''}`;
  const contactLabel = contactHref.replace(/^tel:/, '') || settings.contactPhone || 'شماره تماس تنظیم نشده';

  const [carBrand, setCarBrand] = useState(selectedVehicle?.brandName || 'کی‌ام‌سی (KMC)');
  const [carModel, setCarModel] = useState(selectedVehicle?.modelName || 'KMC J7');
  const [year, setYear] = useState(selectedVehicle?.year?.toString() || '1402');
  const [partName, setPartName] = useState(initialQuery || '');
  const [oemNumber, setOemNumber] = useState('');
  const [vin, setVin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [notes, setNotes] = useState('');
  const [imageAttached, setImageAttached] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPartRequest({
      carBrand,
      carModel,
      year,
      partName,
      oemNumber,
      vin,
      phoneNumber,
      fullName,
      notes,
      imageAttached
    });
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      {sectionVisible('request-hero') && (
      <div className="text-center space-y-2" data-section-key="request-hero" style={sectionStyle('request-hero')}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{section('request-hero')?.badge || 'سفارش اختصاصی و استعلام فوری قطعات نایاب و کمیاب'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900">
          {section('request-hero')?.title || 'استعلام و واردات قطعه کمیاب خودروهای چینی'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto">
          {section('request-hero')?.subtitle || 'اگر قطعه مورد نظر شما در سایت موجود نیست، مشخصات خودرو و قطعه را ارسال کنید تا واحد تامین بررسی کند.'}
        </p>
      </div>
      )}

      {submitted ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">درخواست استعلام شما با موفقیت ثبت گردید</h2>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            اطلاعات برای دپارتمان فنی ارسال شد. کارشناسان ما حداکثر ظرف مدت ۲ ساعت کاری از طریق تماس یا پیامک نتیجه استعلام موجودی و قیمت را به شماره <strong className="font-mono">{phoneNumber}</strong> اطلاع خواهند داد.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
            >
              ثبت درخواست دیگر
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              بازگشت به فروشگاه
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs" data-section-key="request-form" style={sectionStyle('request-form')}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">برند خودرو *</label>
                  <select
                    value={carBrand}
                    onChange={e => setCarBrand(e.target.value)}
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                    required
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.nameFa}>{b.nameFa}</option>
                    ))}
                    <option value="سایر برندها">سایر برندهای چینی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">مدل دقیق خودرو *</label>
                  <input
                    type="text"
                    value={carModel}
                    onChange={e => setCarModel(e.target.value)}
                    placeholder="مثال: KMC J7، تیگو ۸ پرو، لاماری"
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">سال ساخت خودرو</label>
                  <input
                    type="text"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="مثال: 1402 یا 2023"
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">نام قطعه مورد نظر یا شرح نیاز *</label>
                <input
                  type="text"
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  placeholder="مثال: قاب آینه بغل راست کربنی، کمپرسور کولر، رادار نقطه کور..."
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">شماره فنی یا پارت‌نامبر OEM (در صورت وجود)</label>
                  <input
                    type="text"
                    value={oemNumber}
                    onChange={e => setOemNumber(e.target.value)}
                    placeholder="مثال: 1026040GH010"
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono uppercase text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">شماره شاسی خودرو VIN (۱۷ رقمی)</label>
                  <input
                    type="text"
                    value={vin}
                    onChange={e => setVin(e.target.value)}
                    placeholder="روی کارت خودرو درج شده است"
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono uppercase text-left"
                  />
                </div>
              </div>

              {/* Photo Simulation */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">تصویر قطعه یا قطعه معیوب (اختیاری):</label>
                <div 
                  onClick={() => setImageAttached(!imageAttached)}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    imageAttached 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'
                  }`}
                >
                  <Upload className={`w-6 h-6 mx-auto mb-1 ${imageAttached ? 'text-emerald-600' : 'text-neutral-400'}`} />
                  <span className="text-xs text-neutral-600 block">
                    {imageAttached ? '✓ تصویر فرضی قطعه بارگذاری شد (برای حذف کلیک کنید)' : 'برای پیوست عکس قطعه، نمونه یا کارت خودرو کلیک نمایید'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">نام و نام خانوادگی متقاضی *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="نام کامل"
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">شماره تلفن همراه جهت تماس کارشناس *</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="0912..."
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">توضیحات تکمیلی:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="هرگونه توضیحات در مورد رنگ، نوع سمت چپ یا راست، شرکتی یا وارداتی بودن..."
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Send className="w-4 h-4" />
                <span>ارسال درخواست استعلام به واحد تامین</span>
              </button>
            </form>
          </div>

          {/* Info Sidebox */}
          <div className="lg:col-span-4 space-y-4">
            {sectionVisible('request-info') && (
            <div className="bg-neutral-900 text-white rounded-3xl p-6 space-y-4 shadow-md" data-section-key="request-info" style={sectionStyle('request-info')}>
              <h3 className="font-bold text-sm flex items-center gap-2 text-red-400">
                <Clock className="w-4 h-4" />
                <span>{section('request-info')?.title || 'زمان‌بندی پاسخگویی به استعلام'}</span>
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {section('request-info')?.subtitle || 'پس از بررسی موجودی و تامین‌کننده، قیمت و زمان تحویل اعلام می‌شود.'}
              </p>

              <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs text-neutral-300">
                {(section('request-info')?.items || []).filter(item => item.isVisible !== false).map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="block">{item.title}</strong>{item.content && <small className="block text-neutral-400 mt-0.5">{item.content}</small>}</span>
                  </div>
                ))}
              </div>
            </div>
            )}

            {sectionVisible('request-contact') && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-3" data-section-key="request-contact" style={sectionStyle('request-contact')}>
              <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>{contactSection?.title || 'نیاز به استعلام تلفنی فوری دارید؟'}</span>
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {contactSection?.subtitle || 'می‌توانید مستقیماً با واحد تامین تماس بگیرید.'}
              </p>
              <a
                href={contactHref}
                className="block text-center py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                {contactSection?.buttonText || 'تماس با واحد تامین'} — {contactLabel}
              </a>
            </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
