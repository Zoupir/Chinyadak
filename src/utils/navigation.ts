import { Product, Category, CarModel, CarBrand, Article } from '../types';

export interface RouteState {
  view: string;
  param?: string;
}

/**
 * Builds the canonical hash fragment for any view and parameter
 */
export const buildRouteHash = (view: string, param?: string): string => {
  if (!view || view === 'home') return '#/';
  if (view === 'admin') return '#/admin';
  if (view === 'shop') return param ? `#/shop/${encodeURIComponent(param)}` : '#/shop';
  if (view === 'category') return `#/category/${encodeURIComponent(param || 'all')}`;
  if (view === 'product') return `#/product/${encodeURIComponent(param || '')}`;
  if (view === 'car-brand' || view === 'brand') return `#/brand/${encodeURIComponent(param || '')}`;
  if (view === 'car-model' || view === 'model') return `#/car-model/${encodeURIComponent(param || '')}`;
  if (view === 'account') return param ? `#/account/${encodeURIComponent(param)}` : '#/account';
  if (view === 'tracking') return param ? `#/tracking/${encodeURIComponent(param)}` : '#/tracking';
  if (view === 'invoice') return `#/invoice/${encodeURIComponent(param || '')}`;
  if (view === 'compare') return '#/compare';
  if (view === 'part-request') return param ? `#/part-request/${encodeURIComponent(param)}` : '#/part-request';
  if (view === 'blog') return '#/blog';
  if (view === 'article') return `#/article/${encodeURIComponent(param || '')}`;
  if (view === 'page') return `#/page/${encodeURIComponent(param || 'about')}`;
  if (view === 'about') return '#/about';
  if (view === 'guarantee') return '#/guarantee';
  if (view === 'checkout') return '#/checkout';
  
  return param ? `#/${view}/${encodeURIComponent(param)}` : `#/${view}`;
};

/**
 * Parses the current hash fragment into view and param
 */
export const parseRouteHash = (rawHash: string): RouteState => {
  let cleaned = rawHash.replace(/^#\/?/, '').trim();
  if (!cleaned || cleaned === '/') {
    return { view: 'home' };
  }

  // Support legacy format e.g. #product=123 or #admin
  if (cleaned.includes('=')) {
    const [viewKey, paramVal] = cleaned.split('=');
    return {
      view: viewKey === 'brand' ? 'car-brand' : viewKey === 'model' ? 'car-model' : viewKey,
      param: paramVal ? decodeURIComponent(paramVal) : undefined
    };
  }

  const parts = cleaned.split('/').filter(Boolean);
  const rawView = parts[0] || 'home';
  const rawParam = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : undefined;

  let view = rawView;
  if (view === 'brand') view = 'car-brand';
  if (view === 'model') view = 'car-model';

  return {
    view,
    param: rawParam
  };
};

/**
 * Returns full absolute URL for sharing
 */
export const getFullShareUrl = (view: string, param?: string): string => {
  const hash = buildRouteHash(view, param);
  if (typeof window === 'undefined') return hash;
  
  const origin = window.location.origin || '';
  const pathname = window.location.pathname || '';
  return `${origin}${pathname}${hash}`;
};

/**
 * Cross-browser clipboard copy with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};

export interface PageShareMeta {
  title: string;
  subtitle: string;
  categoryLabel: string;
  shareText: string;
}

/**
 * Helper to generate descriptive Persian metadata for any section
 */
export const getPageShareMeta = (
  view: string,
  param?: string,
  data?: {
    products?: Product[];
    categories?: Category[];
    models?: CarModel[];
    brands?: CarBrand[];
    articles?: Article[];
  }
): PageShareMeta => {
  switch (view) {
    case 'home':
      return {
        title: 'صفحه اصلی فروشگاه قطعات خودرو',
        subtitle: 'فروشگاه تخصصی لوازم یدکی و قطعات اورجینال خودروهای چینی',
        categoryLabel: 'صفحه اصلی',
        shareText: 'فروشگاه تخصصی لوازم یدکی و قطعات اورجینال خودروهای چینی با ضمانت اصالت و ارسال سریع'
      };

    case 'product': {
      const prod = data?.products?.find(p => p.id === param);
      const title = prod ? prod.nameFa : 'مشاهده قطعه خودرو';
      const brand = prod ? `برند ${prod.brandManufacturer} (کد OEM: ${prod.oemNumber})` : '';
      return {
        title,
        subtitle: brand || 'مشخصات فنی، تطبیق فیتمنت و قیمت قطعه',
        categoryLabel: 'صفحه محصول',
        shareText: `مشاهده مشخصات فنی و استعلام قیمت قطعه «${title}» در فروشگاه قطعات:`
      };
    }

    case 'category': {
      const cat = data?.categories?.find(c => c.slug === param);
      const title = cat ? `دسته‌بندی ${cat.nameFa}` : `دسته‌بندی ${param || ''}`;
      return {
        title,
        subtitle: cat?.descriptionFa || 'فهرست و مقایسه تمامی قطعات این گروه',
        categoryLabel: 'دسته‌بندی قطعات',
        shareText: `فهرست کامل قطعات گروه «${title}» همراه با فیلتر اصالت و سازگاری:`
      };
    }

    case 'car-model': {
      const model = data?.models?.find(m => m.id === param || m.slug === param);
      const title = model ? `قطعات یدکی خودرو ${model.nameFa}` : 'قطعات خودرو';
      return {
        title,
        subtitle: model ? `تمامی لوازم موتوری، جلوبندی، بدنه و برقی ${model.nameFa}` : 'فهرست قطعات این مدل',
        categoryLabel: 'مدل خودرو',
        shareText: `مشاهده تمامی لوازم یدکی و قطعات مصرفی فابریک خودرو «${title}»:`
      };
    }

    case 'car-brand': {
      const brand = data?.brands?.find(b => b.id === param || b.slug === param);
      const title = brand ? `لوازم یدکی خودروهای ${brand.nameFa}` : 'برند خودرو';
      return {
        title,
        subtitle: brand ? `تامین مستقیم قطعات کارخانه‌ای ${brand.nameFa} (${brand.country})` : 'فهرست قطعات برند',
        categoryLabel: 'برند خودرو',
        shareText: `آرشیو قطعات و مشخصات خودروهای برند «${title}»:`
      };
    }

    case 'account': {
      const tabNames: Record<string, { title: string; subtitle: string }> = {
        garage: { title: 'گاراژ من و خودروهای ذخیره شده', subtitle: 'مدیریت و فیلتر قطعات براساس خودروهای شخصی' },
        orders: { title: 'تاریخچه سفارش‌ها و فاکتورها', subtitle: 'پیگیری وضعیت سفارش‌های ثبت شده مشتری' },
        loyalty: { title: 'باشگاه مشتریان و امتیازهای ویژه', subtitle: 'مشاهده امتیازها، تخفیف‌ها و هدایای وفاداری' },
        wishlist: { title: 'لیست علاقه‌مندی‌های قطعات', subtitle: 'قطعات نشان‌شده برای خرید آینده' },
        requests: { title: 'درخواست‌های استعلام قطعات نایاب', subtitle: 'پیگیری پاسخ کارشناسان به سفارش‌های اختصاصی' },
        profile: { title: 'مشخصات حساب و نشانی‌های تحویل', subtitle: 'اطلاعات کاربری و مکان دریافت سفارش' }
      };
      const currentTab = tabNames[param || 'garage'] || tabNames.garage;
      return {
        title: currentTab.title,
        subtitle: currentTab.subtitle,
        categoryLabel: 'بخش کاربری',
        shareText: `لینک دسترسی مستقیم به بخش «${currentTab.title}» در پنل کاربری:`
      };
    }

    case 'shop': {
      let sub = 'جستجو در آرشیو کامل قطعات خودروهای چینی با امکان فیلتر هوشمند';
      let title = 'فروشگاه و کاتالوگ قطعات';
      if (param === 'oem') {
        title = 'قطعات خط تولید کارخانه (OEM)';
        sub = 'لوازم یدکی فابریک اصل کارخانه سازنده خودرو';
      } else if (param === 'discounted') {
        title = 'قطعات دارای تخفیف و جشنواره فروش';
        sub = 'بهترین قیمت‌ها با تخفیف ویژه روی قطعات پرمصرف';
      }
      return {
        title,
        subtitle: sub,
        categoryLabel: 'فروشگاه',
        shareText: `مشاهده کاتالوگ و محصولات «${title}»:`
      };
    }

    case 'tracking': {
      return {
        title: param ? `رهگیری سفارش شماره ${param}` : 'سامانه پیگیری وضعیت سفارش',
        subtitle: 'استعلام لحظه‌ای بسته‌بندی، کد پستی و زمان ارسال مرسوله',
        categoryLabel: 'رهگیری سفارش',
        shareText: param
          ? `پیگیری مستقیم وضعیت سفارش مرسوله شماره ${param}:`
          : 'سامانه استعلام و رهگیری لحظه‌ای سفارش‌های قطعات یدکی:'
      };
    }

    case 'invoice': {
      return {
        title: param ? `فاکتور رسمی سفارش ${param}` : 'فاکتور الکترونیک سفارش',
        subtitle: 'مشاهده جزئیات اقلام، مبالغ، مالیات و مشخصات خرید',
        categoryLabel: 'فاکتور سفارش',
        shareText: `مشاهده فاکتور الکترونیکی سفارش ${param || ''}:`
      };
    }

    case 'compare':
      return {
        title: 'میز مقایسه مشخصات فنی قطعات',
        subtitle: 'مقایسه کنار هم ابعاد، گرید کیفی، گارانتی و پارت‌نامبر قطعات',
        categoryLabel: 'ابزار مقایسه',
        shareText: 'مقایسه تخصصی و مشخصات فنی قطعات خودرو در فروشگاه:'
      };

    case 'part-request':
      return {
        title: 'ثبت استعلام قطعات نایاب و سفارشی',
        subtitle: 'درخواست مستقیم تامین قطعات خاص از خطوط تولید و انبار مرکزی',
        categoryLabel: 'استعلام قطعه',
        shareText: 'فرم مستقیم استعلام و سفارش قطعات نایاب و کمیاب خودرو:'
      };

    case 'blog':
      return {
        title: 'وبلاگ و مقالات آموزشی مکانیک خودرو',
        subtitle: 'راهنمای علائم خرابی، تعویض به موقع و تشخیص قطعات تقلبی از اصل',
        categoryLabel: 'مجله آموزشی',
        shareText: 'مقالات و آموزش‌های تخصصی نگهداری و عیب‌یابی خودروهای چینی:'
      };

    case 'article': {
      const art = data?.articles?.find(a => a.id === param);
      return {
        title: art ? art.title : 'مقاله تخصصی خودرو',
        subtitle: art ? art.excerpt : 'راهنمای تخصصی عیب‌یابی و مراقبت از خودرو',
        categoryLabel: 'مقاله مجله',
        shareText: `مطالعه مقاله «${art ? art.title : 'تخصصی خودرو'}»:`
      };
    }

    case 'admin':
      return {
        title: 'پنل مدیریت فروشگاه',
        subtitle: 'مدیریت موجودی کالاها، سفارش‌ها و باشگاه وفاداری',
        categoryLabel: 'پنل مدیریت',
        shareText: 'دسترسی سریع به پنل مدیریت فروشگاه'
      };

    default:
      return {
        title: 'فروشگاه تخصصی قطعات خودرو',
        subtitle: 'تامین و توزیع مستقیم قطعات فابریک و باکیفیت',
        categoryLabel: 'فروشگاه',
        shareText: 'فروشگاه تخصصی لوازم یدکی و قطعات اورجینال خودرو:'
      };
  }
};
