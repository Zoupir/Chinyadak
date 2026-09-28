import { Product, GarageCar, QualityGrade } from '../types';

export const formatRial = (amount: number): string => {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
};

export const formatToman = formatRial;

export const formatPersianDigits = (num: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

export interface FitmentCheckResult {
  isCompatible: boolean;
  message: string;
  matchedFitmentNotes?: string;
}

export const checkProductFitment = (product: Product, car: GarageCar | null): FitmentCheckResult => {
  if (!car) {
    return {
      isCompatible: false,
      message: 'خودروی خود را برای بررسی دقیق سازگاری انتخاب کنید'
    };
  }

  // Check if compatible with all models
  const fitsAll = product.fitments.some(f => f.modelId === 'all');
  if (fitsAll) {
    return {
      isCompatible: true,
      message: `این قطعه برای تمامی خودروهای چینی از جمله ${car.modelName} مناسب است.`
    };
  }

  // Check direct model match
  const matched = product.fitments.find(f => {
    const modelMatches = f.modelId === car.modelId || 
      car.modelName.toLowerCase().includes(f.modelName.toLowerCase()) ||
      f.modelName.toLowerCase().includes(car.modelName.toLowerCase());
      
    if (!modelMatches) return false;

    // Check year range if available
    if (car.year && f.yearFrom && f.yearTo) {
      if (car.year < f.yearFrom || car.year > f.yearTo) {
        return false;
      }
    }
    return true;
  });

  if (matched) {
    return {
      isCompatible: true,
      message: `این قطعه ۱۰۰٪ با ${car.modelName} ${car.year ? `مدل ${car.year}` : ''} سازگار است.`,
      matchedFitmentNotes: matched.notes
    };
  }

  return {
    isCompatible: false,
    message: `سازگاری این قطعه با ${car.modelName} تأیید نشده است.`
  };
};

export const getGradeInfo = (grade: QualityGrade) => {
  switch (grade) {
    case 'genuine':
      return {
        label: 'اصلی شرکتی (Genuine)',
        shortLabel: 'شرکتی اصلی',
        bgClass: 'bg-red-50 text-red-700 border-red-200',
        badgeBg: 'bg-red-600 text-white',
        description: 'قطعه تولید شده در خط تولید رسمی کارخانه مادر همراه با هولوگرام شرکتی و بالاترین استاندارد کیفی.'
      };
    case 'oem':
      return {
        label: 'وارداتی درجه یک (OEM)',
        shortLabel: 'OEM گرید A',
        bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeBg: 'bg-blue-600 text-white',
        description: 'تولید شده توسط تامین‌کنندگان معتبر جهانی (مانند بوش، والئو، گرت یا ماندو) منطبق بر استانداردهای کارخانه.'
      };
    case 'aftermarket':
      return {
        label: 'افترمارکت استاندارد (Aftermarket)',
        shortLabel: 'افترمارکت',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-600 text-white',
        description: 'تولید شده توسط برندهای معتبر بازار یدکی با کیفیت قابل اتکا و قیمت اقتصادی‌تر.'
      };
    case 'economy':
      return {
        label: 'اقتصادی (Economy)',
        shortLabel: 'اقتصادی',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeBg: 'bg-amber-600 text-white',
        description: 'گزینه‌ای مقرون‌به‌صرفه با رعایت حداقل استانداردهای عملکردی.'
      };
  }
};
