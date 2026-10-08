import type {
  PageFormConfig,
  PageFormFieldConfig,
  PageSection,
  PartRequestFieldKey
} from '../types';

export const PART_REQUEST_CORE_FIELDS = new Set<PartRequestFieldKey>([
  'partName',
  'fullName',
  'phoneNumber'
]);

export const PART_REQUEST_FIELD_DEFAULTS: PageFormFieldConfig[] = [
  {
    key: 'carBrand',
    type: 'select',
    label: 'برند خودرو',
    placeholder: 'برند خودرو را انتخاب کنید',
    visible: true,
    required: false,
    width: 'third',
    order: 1
  },
  {
    key: 'carModel',
    type: 'text',
    label: 'مدل دقیق خودرو',
    placeholder: 'مثال: KMC J7، تیگو ۸ پرو، لاماری',
    visible: true,
    required: false,
    width: 'third',
    order: 2
  },
  {
    key: 'year',
    type: 'text',
    label: 'سال ساخت خودرو',
    placeholder: 'مثال: ۱۴۰۲ یا 2023',
    visible: true,
    required: false,
    width: 'third',
    order: 3
  },
  {
    key: 'partName',
    type: 'text',
    label: 'نام قطعه مورد نظر یا شرح نیاز',
    placeholder: 'مثال: کمپرسور کولر، رادار نقطه کور، قاب آینه راست...',
    visible: true,
    required: true,
    width: 'full',
    order: 4
  },
  {
    key: 'oemNumber',
    type: 'text',
    label: 'شماره فنی / OEM',
    placeholder: 'مثال: 1026040GH010',
    visible: true,
    required: false,
    width: 'half',
    order: 5
  },
  {
    key: 'vin',
    type: 'text',
    label: 'شماره شاسی VIN',
    placeholder: 'شماره شاسی درج‌شده روی کارت خودرو',
    visible: true,
    required: false,
    width: 'half',
    order: 6
  },
  {
    key: 'image',
    type: 'file',
    label: 'تصویر قطعه، قطعه معیوب یا کارت خودرو',
    placeholder: 'برای انتخاب و آپلود تصویر کلیک کنید',
    visible: true,
    required: false,
    width: 'full',
    order: 7,
    helpText: 'JPG، PNG، WEBP یا GIF تا سقف ۵ مگابایت'
  },
  {
    key: 'fullName',
    type: 'text',
    label: 'نام و نام خانوادگی متقاضی',
    placeholder: 'نام کامل',
    visible: true,
    required: true,
    width: 'half',
    order: 8
  },
  {
    key: 'phoneNumber',
    type: 'tel',
    label: 'شماره تلفن همراه',
    placeholder: '۰۹۱۲۱۲۳۴۵۶۷',
    visible: true,
    required: true,
    width: 'half',
    order: 9,
    helpText: 'اعداد فارسی و انگلیسی هر دو پذیرفته می‌شوند.'
  },
  {
    key: 'notes',
    type: 'textarea',
    label: 'توضیحات تکمیلی',
    placeholder: 'رنگ، سمت چپ/راست، نوع قطعه، توضیح خرابی یا هر نکته دیگر...',
    visible: true,
    required: false,
    width: 'full',
    order: 10
  }
];

export const DEFAULT_PART_REQUEST_FORM_CONFIG: PageFormConfig = {
  schema: 'part-request',
  fields: PART_REQUEST_FIELD_DEFAULTS,
  submitText: 'ارسال درخواست استعلام به واحد تامین',
  submittingText: 'در حال ثبت درخواست...',
  successTitle: 'درخواست استعلام شما با موفقیت ثبت شد',
  successMessage: 'درخواست شما در سیستم ثبت شد و واحد تامین آن را بررسی می‌کند. نتیجه از طریق تماس یا پیامک اطلاع داده خواهد شد.',
  errorMessage: 'ثبت درخواست انجام نشد. موارد مشخص‌شده را بررسی و دوباره تلاش کنید.',
  contactPhone: '',
  maxImageMb: 5,
  allowImages: true
};

export const normalizePartRequestFormConfig = (section?: PageSection | null): PageFormConfig => {
  const saved = section?.formConfig;
  const savedFields = new Map<PartRequestFieldKey, PageFormFieldConfig>(
    (saved?.fields || []).map(field => [field.key, field])
  );

  const fields = PART_REQUEST_FIELD_DEFAULTS.map(defaultField => {
    const stored = savedFields.get(defaultField.key);
    const merged: PageFormFieldConfig = { ...defaultField, ...(stored || {}) };
    if (PART_REQUEST_CORE_FIELDS.has(defaultField.key)) {
      merged.visible = true;
      merged.required = true;
    }
    return merged;
  }).sort((a, b) => a.order - b.order);

  return {
    ...DEFAULT_PART_REQUEST_FORM_CONFIG,
    ...(saved || {}),
    schema: 'part-request',
    fields
  };
};

export const fieldGridClass = (width: PageFormFieldConfig['width']): string => {
  if (width === 'third') return 'sm:col-span-4';
  if (width === 'half') return 'sm:col-span-6';
  return 'sm:col-span-12';
};
