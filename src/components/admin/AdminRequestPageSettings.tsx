import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FormInput,
  MessageSquareText,
  Phone,
  Save,
  Settings2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PageFormConfig, PageFormFieldConfig, SitePage } from '../../types';
import {
  PART_REQUEST_CORE_FIELDS,
  normalizePartRequestFormConfig
} from '../../config/partRequestForm';

interface AdminRequestPageSettingsProps {
  page: SitePage;
}

type EditorTab = 'fields' | 'messages' | 'contact';

const WIDTH_LABELS: Record<PageFormFieldConfig['width'], string> = {
  full: 'تمام عرض',
  half: 'نصف عرض',
  third: 'یک‌سوم'
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const AdminRequestPageSettings: React.FC<AdminRequestPageSettingsProps> = ({ page }) => {
  const { updatePage, settings, showToast } = useStore();
  const requestSection = useMemo(
    () => page.sections.find(section => section.sectionKey === 'request-form'),
    [page]
  );
  const contactSection = useMemo(
    () => page.sections.find(section => section.sectionKey === 'request-contact'),
    [page]
  );

  const [tab, setTab] = useState<EditorTab>('fields');
  const [draft, setDraft] = useState<PageFormConfig>(() => normalizePartRequestFormConfig(requestSection));
  const [contactTitle, setContactTitle] = useState(contactSection?.title || 'نیاز به استعلام تلفنی فوری دارید؟');
  const [contactSubtitle, setContactSubtitle] = useState(contactSection?.subtitle || 'می‌توانید مستقیماً با واحد تامین تماس بگیرید.');
  const [contactButtonText, setContactButtonText] = useState(contactSection?.buttonText || 'تماس با واحد تامین');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(clone(normalizePartRequestFormConfig(requestSection)));
    setContactTitle(contactSection?.title || 'نیاز به استعلام تلفنی فوری دارید؟');
    setContactSubtitle(contactSection?.subtitle || 'می‌توانید مستقیماً با واحد تامین تماس بگیرید.');
    setContactButtonText(contactSection?.buttonText || 'تماس با واحد تامین');
    setDirty(false);
  }, [page.id, page.updatedAt, requestSection?.id, contactSection?.id]);

  if (!requestSection) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        سکشن سیستمی فرم استعلام (`request-form`) در این برگه پیدا نشد. ابتدا ساختار برگه را بازیابی کنید.
      </div>
    );
  }

  const patchDraft = (patch: Partial<PageFormConfig>) => {
    setDraft(current => ({ ...current, ...patch }));
    setDirty(true);
  };

  const updateField = (key: PageFormFieldConfig['key'], patch: Partial<PageFormFieldConfig>) => {
    patchDraft({
      fields: draft.fields.map(field => field.key === key ? { ...field, ...patch } : field)
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const fields = [...draft.fields].sort((a, b) => a.order - b.order);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    [fields[index], fields[target]] = [fields[target], fields[index]];
    patchDraft({ fields: fields.map((field, order) => ({ ...field, order: order + 1 })) });
  };

  const save = async () => {
    setSaving(true);
    try {
      const contactPhone = String(draft.contactPhone || '').trim();
      const nextSections = page.sections.map(section => {
        if (section.id === requestSection.id) {
          return { ...section, formConfig: clone(draft) };
        }
        if (contactSection && section.id === contactSection.id) {
          return {
            ...section,
            title: contactTitle,
            subtitle: contactSubtitle,
            buttonText: contactButtonText,
            buttonLink: contactPhone ? `tel:${contactPhone}` : section.buttonLink
          };
        }
        return section;
      });
      const ok = await updatePage({ ...page, sections: nextSections });
      if (ok) {
        setDirty(false);
        showToast('تنظیمات فرم استعلام و تماس صفحه ذخیره شد.');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!window.confirm('تنظیمات فرم به مقادیر استاندارد برگردد؟ متن‌های سفارشی فعلی فرم جایگزین می‌شوند.')) return;
    setDraft(clone(normalizePartRequestFormConfig({ ...requestSection, formConfig: undefined })));
    setDirty(true);
  };

  return (
    <section className="rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-5 sm:p-6 shadow-xs" data-request-form-builder="1">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-blue-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FormInput className="w-5 h-5 text-blue-700" />
            <h3 className="font-black text-sm text-neutral-900">فرم‌ساز استعلام قطعه</h3>
            {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">تغییر ذخیره‌نشده</span>}
          </div>
          <p className="mt-1 text-[10px] leading-5 text-neutral-500">
            فیلدها، عنوان‌ها، Placeholder، ترتیب، نمایش، پیام‌ها و شماره تماس این فرم مستقل از تنظیمات عمومی سایت قابل مدیریت هستند.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={resetDefaults} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50">
            بازگردانی استاندارد
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات فرم'}
          </button>
        </div>
      </div>

      <nav className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 border border-neutral-200">
        {([
          ['fields', 'فیلدهای فرم', FormInput],
          ['messages', 'دکمه و پیام‌ها', MessageSquareText],
          ['contact', 'تماس و پاسخگویی', Phone]
        ] as Array<[EditorTab, string, React.ElementType]>).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-black ${tab === id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </nav>

      {tab === 'fields' && (
        <div className="mt-4 space-y-2">
          {[...draft.fields].sort((a, b) => a.order - b.order).map((field, index) => {
            const locked = PART_REQUEST_CORE_FIELDS.has(field.key);
            return (
              <div key={field.key} className="rounded-2xl border border-neutral-200 bg-white p-3.5">
                <div className="grid grid-cols-1 xl:grid-cols-[120px_minmax(180px,1fr)_minmax(220px,1.3fr)_110px_150px] gap-3 items-end">
                  <div>
                    <span className="block text-[9px] font-bold text-neutral-400 mb-1">کلید سیستم</span>
                    <code className="block rounded-lg bg-neutral-100 px-2 py-2 text-[9px] text-neutral-600">{field.key}</code>
                  </div>
                  <label>
                    <span className="block text-[9px] font-bold text-neutral-500 mb-1">عنوان فیلد</span>
                    <input value={field.label} onChange={event => updateField(field.key, { label: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-[10px]" />
                  </label>
                  <label>
                    <span className="block text-[9px] font-bold text-neutral-500 mb-1">متن راهنما / Placeholder</span>
                    <input value={field.placeholder || ''} onChange={event => updateField(field.key, { placeholder: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-[10px]" />
                  </label>
                  <label>
                    <span className="block text-[9px] font-bold text-neutral-500 mb-1">عرض</span>
                    <select value={field.width} onChange={event => updateField(field.key, { width: event.target.value as PageFormFieldConfig['width'] })} className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-[10px]">
                      {(Object.keys(WIDTH_LABELS) as PageFormFieldConfig['width'][]).map(width => <option key={width} value={width}>{WIDTH_LABELS[width]}</option>)}
                    </select>
                  </label>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField(field.key, { visible: locked ? true : !field.visible })}
                      disabled={locked}
                      className={`w-8 h-8 grid place-items-center rounded-lg border ${field.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-50 text-neutral-400'} disabled:opacity-50`}
                      title={locked ? 'این فیلد برای ثبت استعلام ضروری است' : 'نمایش/عدم نمایش'}
                    >
                      {field.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField(field.key, { required: locked ? true : !field.required })}
                      disabled={locked || !field.visible}
                      className={`h-8 px-2 rounded-lg border text-[9px] font-black ${field.required ? 'border-red-200 bg-red-50 text-red-700' : 'border-neutral-200 text-neutral-500'} disabled:opacity-50`}
                    >
                      {field.required ? 'اجباری' : 'اختیاری'}
                    </button>
                    <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0} className="w-8 h-8 grid place-items-center rounded-lg border border-neutral-200 disabled:opacity-25"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveField(index, 'down')} disabled={index === draft.fields.length - 1} className="w-8 h-8 grid place-items-center rounded-lg border border-neutral-200 disabled:opacity-25"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <label className="mt-2 block">
                  <span className="block text-[9px] font-bold text-neutral-400 mb-1">متن راهنمای زیر فیلد (اختیاری)</span>
                  <input value={field.helpText || ''} onChange={event => updateField(field.key, { helpText: event.target.value })} className="w-full rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1.5 text-[9px]" />
                </label>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'messages' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <label>
            <span className="block text-[10px] font-black text-neutral-700 mb-1">متن دکمه ارسال</span>
            <input value={draft.submitText || ''} onChange={event => patchDraft({ submitText: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label>
            <span className="block text-[10px] font-black text-neutral-700 mb-1">متن هنگام ارسال</span>
            <input value={draft.submittingText || ''} onChange={event => patchDraft({ submittingText: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label className="md:col-span-2">
            <span className="block text-[10px] font-black text-neutral-700 mb-1">عنوان موفقیت</span>
            <input value={draft.successTitle || ''} onChange={event => patchDraft({ successTitle: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label className="md:col-span-2">
            <span className="block text-[10px] font-black text-neutral-700 mb-1">پیام موفقیت</span>
            <textarea rows={3} value={draft.successMessage || ''} onChange={event => patchDraft({ successMessage: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label className="md:col-span-2">
            <span className="block text-[10px] font-black text-neutral-700 mb-1">پیام خطای عمومی</span>
            <textarea rows={2} value={draft.errorMessage || ''} onChange={event => patchDraft({ errorMessage: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
        </div>
      )}

      {tab === 'contact' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <label>
            <span className="block text-[10px] font-black text-neutral-700 mb-1">شماره تماس اختصاصی این صفحه</span>
            <input
              dir="ltr"
              value={draft.contactPhone || ''}
              onChange={event => patchDraft({ contactPhone: event.target.value })}
              placeholder={settings.contactPhone || '0912...'}
              className="w-full rounded-xl border border-neutral-200 p-2.5 text-left font-mono text-xs"
            />
            <small className="mt-1 block text-[9px] text-neutral-400">اگر خالی باشد از شماره تماس عمومی سایت استفاده می‌شود.</small>
          </label>
          <div className="rounded-xl bg-neutral-50 p-3 text-[10px] text-neutral-600">
            <Settings2 className="mb-1 w-4 h-4 text-neutral-500" />
            شماره عمومی فعلی سایت: <strong dir="ltr" className="font-mono">{settings.contactPhone || 'تنظیم نشده'}</strong>
          </div>
          <label className="md:col-span-2">
            <span className="block text-[10px] font-black text-neutral-700 mb-1">عنوان کارت تماس</span>
            <input value={contactTitle} onChange={event => { setContactTitle(event.target.value); setDirty(true); }} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label className="md:col-span-2">
            <span className="block text-[10px] font-black text-neutral-700 mb-1">توضیح کارت تماس</span>
            <textarea rows={2} value={contactSubtitle} onChange={event => { setContactSubtitle(event.target.value); setDirty(true); }} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label>
            <span className="block text-[10px] font-black text-neutral-700 mb-1">متن دکمه تماس</span>
            <input value={contactButtonText} onChange={event => { setContactButtonText(event.target.value); setDirty(true); }} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label>
            <span className="block text-[10px] font-black text-neutral-700 mb-1">حداکثر حجم تصویر (MB)</span>
            <input type="number" min={1} max={10} value={draft.maxImageMb || 5} onChange={event => patchDraft({ maxImageMb: Math.max(1, Math.min(10, Number(event.target.value) || 5)) })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs" />
          </label>
          <label className="md:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
            <span><strong className="block text-[10px] text-neutral-800">اجازه ارسال تصویر</strong><small className="text-[9px] text-neutral-400">آپلود واقعی تصویر همراه استعلام</small></span>
            <button type="button" onClick={() => patchDraft({ allowImages: draft.allowImages === false })} className={`w-12 h-6 rounded-full p-1 transition ${draft.allowImages !== false ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${draft.allowImages !== false ? '-translate-x-6' : ''}`} />
            </button>
          </label>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[9px] leading-5 text-emerald-900">
        <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0" />
        سه فیلد «نام قطعه»، «نام متقاضی» و «شماره موبایل» برای جلوگیری از ثبت استعلام ناقص، سیستمی و اجباری هستند؛ سایر فیلدها را می‌توانید آزادانه مخفی، اختیاری و جابه‌جا کنید.
      </div>
    </section>
  );
};
