import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  PhoneCall,
  Send,
  Sparkles,
  Upload
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PageFormFieldConfig, PartRequestFieldKey } from '../../types';
import {
  fieldGridClass,
  normalizePartRequestFormConfig
} from '../../config/partRequestForm';
import {
  isValidIranMobile,
  normalizeIranMobile,
  toTelHref
} from '../../utils/phone';

interface PartRequestViewProps {
  initialQuery?: string;
  onNavigate: (view: string) => void;
}

type FieldErrors = Partial<Record<PartRequestFieldKey | 'form', string>>;

const errorForServerCode = (code?: string): FieldErrors => {
  switch (code) {
    case 'PART_REQUEST_PHONE_INVALID': return { phoneNumber: 'شماره موبایل معتبر نیست. نمونه صحیح: ۰۹۱۲۱۲۳۴۵۶۷' };
    case 'PART_REQUEST_NAME_REQUIRED': return { fullName: 'نام و نام خانوادگی را وارد کنید.' };
    case 'PART_REQUEST_PART_REQUIRED': return { partName: 'نام یا شرح قطعه مورد نظر را وارد کنید.' };
    case 'REQUEST_RATE_LIMIT': return { form: 'تعداد درخواست‌های ثبت‌شده از این اتصال زیاد بوده است. کمی بعد دوباره تلاش کنید.' };
    case 'REQUEST_IMAGE_RATE_LIMIT': return { form: 'تعداد آپلودها بیش از حد مجاز بوده است. کمی بعد دوباره تلاش کنید.' };
    default: return { form: 'سرور درخواست را نپذیرفت. اطلاعات فرم را بررسی کنید و دوباره تلاش کنید.' };
  }
};

export const PartRequestView: React.FC<PartRequestViewProps> = ({ initialQuery = '', onNavigate }) => {
  const {
    brands,
    submitPartRequest,
    selectedVehicle,
    pages,
    settings,
    showToast
  } = useStore();

  const requestPage = pages.find(page => page.slug === 'part-request');
  const section = (key: string) => requestPage?.sections.find(item => item.sectionKey === key);
  const sectionVisible = (key: string) => section(key)?.isVisible !== false;
  const requestFormSection = section('request-form');
  const formConfig = useMemo(
    () => normalizePartRequestFormConfig(requestFormSection),
    [requestFormSection]
  );

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
  const configuredPhone = String(formConfig.contactPhone || '').trim();
  const legacyContactPhone = contactSection?.buttonLink?.startsWith('tel:')
    ? contactSection.buttonLink.replace(/^tel:/, '')
    : '';
  const contactPhone = configuredPhone || legacyContactPhone || settings.contactPhone || '';

  const [carBrand, setCarBrand] = useState(selectedVehicle?.brandName || brands[0]?.nameFa || '');
  const [carModel, setCarModel] = useState(selectedVehicle?.modelName || '');
  const [year, setYear] = useState(selectedVehicle?.year?.toString() || '');
  const [partName, setPartName] = useState(initialQuery || '');
  const [oemNumber, setOemNumber] = useState('');
  const [vin, setVin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const values: Record<Exclude<PartRequestFieldKey, 'image'>, string> = {
    carBrand,
    carModel,
    year,
    partName,
    oemNumber,
    vin,
    fullName,
    phoneNumber,
    notes
  };

  const visibleFields = [...formConfig.fields]
    .filter(field => field.visible !== false)
    .sort((a, b) => a.order - b.order);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    for (const field of visibleFields) {
      if (!field.required || field.key === 'image') continue;
      const value = values[field.key as Exclude<PartRequestFieldKey, 'image'>]?.trim();
      if (!value) next[field.key] = `${field.label} الزامی است.`;
    }
    if (visibleFields.some(field => field.key === 'phoneNumber')) {
      if (!isValidIranMobile(phoneNumber)) next.phoneNumber = 'شماره موبایل معتبر نیست. اعداد فارسی یا انگلیسی قابل استفاده هستند.';
    }
    return next;
  };

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    const maxMb = Math.max(1, Math.min(10, Number(formConfig.maxImageMb || 5)));
    if (file.size > maxMb * 1024 * 1024) {
      setErrors(current => ({ ...current, image: `حجم تصویر باید حداکثر ${maxMb.toLocaleString('fa-IR')} مگابایت باشد.` }));
      return;
    }
    setImageUploading(true);
    setErrors(current => ({ ...current, image: undefined, form: undefined }));
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch('/api/engagement/part-request-image', {
        method: 'POST',
        credentials: 'include',
        body
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || 'REQUEST_IMAGE_UPLOAD_FAILED'));
      setImageUrl(String(data.url || ''));
      setImageName(String(data.originalName || file.name));
      showToast('تصویر استعلام با موفقیت روی سرور ذخیره شد.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const mapped = errorForServerCode(code);
      setErrors(current => ({ ...current, image: mapped.form || 'آپلود تصویر انجام نشد.' }));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || imageUploading) return;

    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      const first = document.querySelector('[data-part-request-error="1"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const normalizedPhone = normalizeIranMobile(phoneNumber);
    setPhoneNumber(normalizedPhone);
    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await submitPartRequest({
        carBrand: carBrand.trim(),
        carModel: carModel.trim(),
        year: year.trim(),
        partName: partName.trim(),
        oemNumber: oemNumber.trim(),
        vin: vin.trim().toUpperCase(),
        phoneNumber: normalizedPhone,
        fullName: fullName.trim(),
        notes: notes.trim(),
        imageAttached: Boolean(imageUrl),
        imageUrl: imageUrl || undefined,
        imageName: imageName || undefined
      });
      if (!result.ok) {
        setErrors(errorForServerCode(result.errorCode));
        return;
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (field: PartRequestFieldKey) => errors[field]
    ? <span data-part-request-error="1" className="mt-1 block text-[10px] font-bold text-red-600">{errors[field]}</span>
    : null;

  const commonInputClass = 'w-full rounded-xl border border-neutral-300 bg-white p-3 text-xs outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100';

  const renderField = (field: PageFormFieldConfig) => {
    const label = <label className="mb-1 block text-xs font-bold text-neutral-700">{field.label}{field.required ? ' *' : ''}</label>;
    const help = field.helpText ? <small className="mt-1 block text-[9px] text-neutral-400">{field.helpText}</small> : null;

    switch (field.key) {
      case 'carBrand':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<select value={carBrand} onChange={e => setCarBrand(e.target.value)} className={commonInputClass} required={field.required}>{!carBrand && <option value="">{field.placeholder || 'انتخاب برند'}</option>}{brands.map(brand => <option key={brand.id} value={brand.nameFa}>{brand.nameFa}</option>)}<option value="سایر برندها">سایر برندها</option></select>{help}{renderError(field.key)}</div>;
      case 'carModel':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input value={carModel} onChange={e => setCarModel(e.target.value)} placeholder={field.placeholder} className={commonInputClass} required={field.required} />{help}{renderError(field.key)}</div>;
      case 'year':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input value={year} onChange={e => setYear(e.target.value)} placeholder={field.placeholder} className={commonInputClass} required={field.required} />{help}{renderError(field.key)}</div>;
      case 'partName':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input value={partName} onChange={e => setPartName(e.target.value)} placeholder={field.placeholder} className={commonInputClass} required />{help}{renderError(field.key)}</div>;
      case 'oemNumber':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input dir="ltr" value={oemNumber} onChange={e => setOemNumber(e.target.value)} placeholder={field.placeholder} className={`${commonInputClass} text-left font-mono`} required={field.required} />{help}{renderError(field.key)}</div>;
      case 'vin':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input dir="ltr" value={vin} onChange={e => setVin(e.target.value)} placeholder={field.placeholder} className={`${commonInputClass} text-left font-mono uppercase`} required={field.required} />{help}{renderError(field.key)}</div>;
      case 'image':
        if (formConfig.allowImages === false) return null;
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<label className={`block cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition ${imageUrl ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'}`}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={imageUploading} onChange={event => void handleImageChange(event.target.files?.[0])} /><Upload className={`mx-auto mb-1 h-6 w-6 ${imageUrl ? 'text-emerald-600' : 'text-neutral-400'}`} /><span className="block text-xs text-neutral-600">{imageUploading ? 'در حال آپلود...' : imageUrl ? `✓ ${imageName || 'تصویر'} ذخیره شد — برای تغییر فایل دیگری انتخاب کنید` : field.placeholder}</span></label>{imageUrl && <button type="button" onClick={() => { setImageUrl(''); setImageName(''); }} className="mt-2 text-[10px] font-bold text-red-600">حذف تصویر از درخواست</button>}{help}{renderError(field.key)}</div>;
      case 'fullName':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={field.placeholder} className={commonInputClass} required />{help}{renderError(field.key)}</div>;
      case 'phoneNumber':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<input dir="ltr" inputMode="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} onBlur={() => { if (phoneNumber.trim()) setPhoneNumber(normalizeIranMobile(phoneNumber)); }} placeholder={field.placeholder} className={`${commonInputClass} text-left font-mono`} required />{help}{renderError(field.key)}</div>;
      case 'notes':
        return <div key={field.key} className={fieldGridClass(field.width)}>{label}<textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={field.placeholder} className={commonInputClass} required={field.required} />{help}{renderError(field.key)}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10" data-part-request-form-v3090="1">
      {sectionVisible('request-hero') && (
        <div className="space-y-2 text-center" data-section-key="request-hero" style={sectionStyle('request-hero')}>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600"><Sparkles className="h-3.5 w-3.5" /><span>{section('request-hero')?.badge || 'استعلام تخصصی قطعات'}</span></div>
          <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">{section('request-hero')?.title || 'استعلام و تامین قطعه خودرو'}</h1>
          <p className="mx-auto max-w-2xl text-xs leading-6 text-neutral-500 sm:text-sm">{section('request-hero')?.subtitle || 'مشخصات قطعه و خودرو را ارسال کنید تا واحد تامین بررسی کند.'}</p>
        </div>
      )}

      {submitted ? (
        <div className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
          <h2 className="text-xl font-black text-neutral-900">{formConfig.successTitle}</h2>
          <p className="mx-auto max-w-xl text-xs leading-7 text-neutral-600">{String(formConfig.successMessage || '').replace('{phone}', normalizeIranMobile(phoneNumber))}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2"><button type="button" onClick={() => { setSubmitted(false); setPartName(''); setOemNumber(''); setVin(''); setNotes(''); setImageUrl(''); setImageName(''); }} className="rounded-xl bg-neutral-100 px-5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-200">ثبت درخواست دیگر</button><button type="button" onClick={() => onNavigate('home')} className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700">بازگشت به فروشگاه</button></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8 lg:col-span-8" data-section-key="request-form" style={sectionStyle('request-form')}>
            {errors.form && <div data-part-request-error="1" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold leading-6 text-red-700">{errors.form}<span className="mt-1 block text-[10px] font-normal text-red-500">{formConfig.errorMessage}</span></div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">{visibleFields.map(renderField)}</div>
              <button type="submit" disabled={isSubmitting || imageUploading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55"><Send className="h-4 w-4" /><span>{isSubmitting ? formConfig.submittingText : formConfig.submitText}</span></button>
            </form>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {sectionVisible('request-info') && (
              <div className="space-y-4 rounded-3xl bg-neutral-900 p-6 text-white shadow-md" data-section-key="request-info" style={sectionStyle('request-info')}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-red-400"><Clock className="h-4 w-4" /><span>{section('request-info')?.title || 'روند بررسی استعلام'}</span></h3>
                <p className="text-xs leading-6 text-neutral-300">{section('request-info')?.subtitle || 'درخواست در پنل کارشناسان ثبت و نتیجه پس از بررسی تامین اعلام می‌شود.'}</p>
                <div className="space-y-2 border-t border-neutral-800 pt-3 text-xs text-neutral-300">{(section('request-info')?.items || []).filter(item => item.isVisible !== false).map(item => <div key={item.id} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span><strong className="block">{item.title}</strong>{item.content && <small className="mt-0.5 block text-neutral-400">{item.content}</small>}</span></div>)}</div>
              </div>
            )}

            {sectionVisible('request-contact') && (
              <div className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-6" data-section-key="request-contact" style={sectionStyle('request-contact')}>
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-neutral-800"><PhoneCall className="h-4 w-4 text-red-600" /><span>{contactSection?.title || 'نیاز به استعلام تلفنی فوری دارید؟'}</span></h4>
                <p className="text-xs leading-6 text-neutral-500">{contactSection?.subtitle || 'می‌توانید مستقیماً با واحد تامین تماس بگیرید.'}</p>
                {contactPhone ? <a href={toTelHref(contactPhone)} className="block cursor-pointer rounded-xl bg-neutral-100 py-2.5 text-center text-xs font-bold text-neutral-900 transition hover:bg-neutral-200"><span>{contactSection?.buttonText || 'تماس با واحد تامین'}</span><span dir="ltr" className="mr-1 font-mono">— {contactPhone}</span></a> : <div className="rounded-xl bg-amber-50 p-3 text-center text-[10px] font-bold text-amber-800">شماره تماس این صفحه در پنل مدیریت تنظیم نشده است.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
