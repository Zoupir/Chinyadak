import type { CarBrand, VehicleModel } from '../types';

/** Manufacturer catalog for the product editor. Vehicle makers and part makers stay separate. */
export interface PartManufacturer {
  id: string;
  nameFa: string;
  nameEn: string;
  websiteUrl: string;
  logoUrl: string;
  group?: string;
}

export const PART_MANUFACTURERS: PartManufacturer[] = [
  { id: 'bosch', nameFa: 'بوش', nameEn: 'Bosch', websiteUrl: 'https://www.boschaftermarket.com/', logoUrl: 'https://cdn.simpleicons.org/bosch/E60000' },
  { id: 'valeo', nameFa: 'والئو', nameEn: 'Valeo', websiteUrl: 'https://www.valeo.com/en/valeo-aftermarket/', logoUrl: 'https://cdn.simpleicons.org/valeo/00854A' },
  { id: 'denso', nameFa: 'دنسو', nameEn: 'Denso', websiteUrl: 'https://www.denso.com/global/en/', logoUrl: 'https://cdn.simpleicons.org/denso/DC0000' },
  { id: 'mahle', nameFa: 'ماهله', nameEn: 'MAHLE', websiteUrl: 'https://www.mahle-aftermarket.com/', logoUrl: 'https://cdn.simpleicons.org/mahle/00549E' },
  { id: 'mann-filter', nameFa: 'مان فیلتر', nameEn: 'MANN-FILTER', websiteUrl: 'https://www.mann-filter.com/en.html', logoUrl: 'https://cdn.simpleicons.org/mannfilter/FFD500' },
  { id: 'skf', nameFa: 'اس‌کااف', nameEn: 'SKF', websiteUrl: 'https://www.skf.com/', logoUrl: 'https://cdn.simpleicons.org/skf/006CB7' },
  { id: 'ngk', nameFa: 'ان‌جی‌کی / ان‌تی‌کی', nameEn: 'NGK / NTK (Niterra)', websiteUrl: 'https://www.ngkntk.com/', logoUrl: 'https://cdn.simpleicons.org/ngk/EE1C25' },
  { id: 'brembo', nameFa: 'برمبو', nameEn: 'Brembo', websiteUrl: 'https://www.brembo.com/en', logoUrl: 'https://cdn.simpleicons.org/brembo/E30613' },
  { id: 'gates', nameFa: 'گیتس', nameEn: 'Gates', websiteUrl: 'https://www.gates.com/', logoUrl: 'https://cdn.simpleicons.org/gates/003DA6' },
  { id: 'zf', nameFa: 'زد‌اف', nameEn: 'ZF Aftermarket', websiteUrl: 'https://aftermarket.zf.com/', logoUrl: 'https://cdn.simpleicons.org/zf/0066B3' },
  { id: 'sachs', nameFa: 'زاکس', nameEn: 'SACHS', websiteUrl: 'https://aftermarket.zf.com/en/aftermarket-portal/our-brands/sachs/', logoUrl: 'https://cdn.simpleicons.org/sachs/00549E', group: 'ZF Aftermarket' },
  { id: 'trw', nameFa: 'تی‌آر‌دبلیو', nameEn: 'TRW', websiteUrl: 'https://aftermarket.zf.com/en/aftermarket-portal/our-brands/trw/', logoUrl: 'https://cdn.simpleicons.org/trw/CC0000', group: 'ZF Aftermarket' },
  { id: 'continental', nameFa: 'کانتیننتال', nameEn: 'Continental', websiteUrl: 'https://www.continental-aftermarket.com/', logoUrl: 'https://cdn.simpleicons.org/continental/FFA500' },
  { id: 'hella', nameFa: 'هلا', nameEn: 'HELLA', websiteUrl: 'https://www.hella.com/techworld/', logoUrl: 'https://cdn.simpleicons.org/hella/D40000' },
  { id: 'wahler', nameFa: 'والر', nameEn: 'WAHLER', websiteUrl: 'https://www.wahler.de/en/', logoUrl: '' },
  { id: 'chery-genuine', nameFa: 'قطعات شرکتی چری', nameEn: 'Chery Genuine', websiteUrl: 'https://www.cheryinternational.com/', logoUrl: '' },
  { id: 'mvm-genuine', nameFa: 'قطعات شرکتی ام‌وی‌ام', nameEn: 'MVM Genuine', websiteUrl: 'https://mvmco.ir/', logoUrl: '' },
  { id: 'fownix-genuine', nameFa: 'قطعات شرکتی فونیکس', nameEn: 'Fownix Genuine', websiteUrl: 'https://fownix.com/', logoUrl: '' }
];

export const REAL_VEHICLE_BRANDS: CarBrand[] = [
  {
    id: 'lucano',
    nameFa: 'لوکانو (LUCANO)',
    nameEn: 'LUCANO',
    slug: 'lucano',
    logo: 'https://www.google.com/s2/favicons?domain=lucano.ir&sz=256',
    heroImage: 'https://lucano.ir/wp-content/uploads/2025/12/lucano7-main.webp',
    description: 'خانوادهٔ خودروهای لوکانو عرضه‌شده در ایران؛ مدل‌ها و تیپ‌ها برای تطبیق قطعه باید با سال ساخت و شماره شاسی بررسی شوند.',
    country: 'چین / عرضه در ایران',
    foundedYear: 2024,
    modelsCount: 2,
    officialRepresentative: 'مکث موتور',
    popularCategorySlugs: ['engine', 'cooling', 'filters', 'brakes'],
    faq: []
  }
];

const blankSpecs = {
  engineCode: '',
  displacement: '',
  horsepower: '',
  torque: '',
  transmission: '',
  fuelConsumption: ''
};

const vehicleModel = (
  id: string,
  nameFa: string,
  nameEn: string,
  slug: string,
  imageUrl: string,
  yearFrom: number,
  bodyType: VehicleModel['bodyType'],
  description: string,
  engineSummary = 'برای انتخاب قطعه، تیپ و مشخصات پیشرانه را با مدارک خودرو یا کاتالوگ رسمی تطبیق دهید.',
  transmissionSummary = 'نوع انتقال قدرت بسته به تیپ و سال ساخت بررسی شود.'
): VehicleModel => ({
  id,
  brandId: 'lucano',
  nameFa,
  nameEn,
  slug,
  imageUrl,
  yearFrom,
  yearTo: 0,
  bodyType,
  engineSummary,
  transmissionSummary,
  description,
  specifications: { ...blankSpecs },
  commonIssues: [],
  maintenanceTips: [],
  faq: []
});

export const REAL_VEHICLE_MODELS: VehicleModel[] = [
  vehicleModel(
    'lucano-l7', 'لوکانو L7', 'LUCANO L7', 'l7',
    'https://lucano.ir/wp-content/uploads/2025/12/lucano7-main.webp',
    1403, 'شاسی‌بلند',
    'مدل L7 از خانوادهٔ لوکانو. مشخصات قطعه به تیپ، سال ساخت و شماره شاسی وابسته است؛ سازگاری را پیش از خرید تأیید کنید.',
    '۱.۶ لیتری توربوشارژ TGDI؛ جزئیات هر تیپ را با کاتالوگ خودرو تطبیق دهید.'
  ),
  vehicleModel(
    'lucano-l8', 'لوکانو L8', 'LUCANO L8', 'l8',
    'https://lucano.ir/wp-content/uploads/2026/01/l8-asli.webp',
    1404, 'شاسی‌بلند',
    'مدل L8 از خانوادهٔ لوکانو. مشخصات قطعه به تیپ، سال ساخت و شماره شاسی وابسته است؛ سازگاری را پیش از خرید تأیید کنید.'
  )
];

export const REAL_MODEL_IMAGE_OVERRIDES: Record<string, string> = {
  'chery-tiggo7-pro': 'https://www.cheryinternational.com/data/tms/website/html/images/index/hu7_oil.png',
  'chery-tiggo8-pro': 'https://www.cheryinternational.com/data/tms/website/html/images/index/hu8_oil.png'
};
