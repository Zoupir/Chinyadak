import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  GarageCar, 
  CartItem, 
  Order, 
  OrderStatus,
  PartRequest,
  CarBrand,
  VehicleModel,
  Category,
  Article,
  ArticleCategory,
  CustomerUser,
  SiteSettings,
  PaymentGatewayConfig,
  ApiIntegrationsConfig,
  AdminAuthState,
  SliderItem,
  AdminUser,
  SitePage,
  PageSection,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltySettings,
  SeoEntityDraft
} from '../types';
import { 
  PRODUCTS as INITIAL_PRODUCTS, 
  BRANDS as INITIAL_BRANDS, 
  VEHICLE_MODELS as INITIAL_MODELS, 
  CATEGORIES as INITIAL_CATEGORIES,
  ARTICLES as INITIAL_ARTICLES,
  INITIAL_ARTICLE_CATEGORIES,
  INITIAL_GARAGE, 
  INITIAL_SETTINGS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_SLIDERS,
  INITIAL_PAGES
} from '../data/mockData';
import { apiRequest, ApiError } from '../api/client';

interface SearchQueryLog {
  query: string;
  count: number;
  lastDate: string;
  resultsCount: number;
}

const EMPTY_API_INTEGRATIONS: ApiIntegrationsConfig = {
  smsProvider: 'kavenegar',
  smsApiKey: '',
  smsSenderNumber: '',
  smsNotifyOnOrder: true,
  smsNotifyOnStock: true,
  smsTrackingPattern: '',
  accountingSoftware: 'none',
  accountingApiKey: '',
  accountingAutoSyncStock: false,
  webhookUrl: '',
  webhookSecret: ''
};

const HOME_SECTION_DEFAULTS: PageSection[] = [
  { id: 'home-hero', sectionKey: 'hero', title: 'قطعات مطمئن برای خودروی شما', subtitle: 'خرید تخصصی قطعات خودروهای چینی با تضمین اصالت، فیتمنت دقیق و ارسال سریع.', badge: 'پیشنهاد ویژه قطعات خودرو', buttonText: 'مشاهده محصولات', buttonLink: 'shop', isVisible: true, order: 1, layout: 'full', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 8, itemRadiusPx: 0, gapPx: 0, fullWidth: true, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 0, marginTopPx: 12, finderWidthPx: 300, finderPaddingPx: 18, finderRadiusPx: 8, finderTitleFontSizePx: 15, finderTextFontSizePx: 11, finderLabelFontSizePx: 10, finderValueFontSizePx: 11, finderButtonFontSizePx: 11, finderBackgroundColor: '#ffffff', finderTextColor: '#111827', finderFieldBackgroundColor: '#fafafa', finderFieldTextColor: '#222b35', finderButtonBackgroundColor: '#f5a000', finderButtonTextColor: '#111827', finderSide: 'left' },
  { id: 'home-featured-categories', sectionKey: 'featured-categories', title: 'دسته‌بندی‌های ویژه', subtitle: '', isVisible: true, order: 2, layout: 'grid', desktopColumns: 9, mobileColumns: 3, borderRadiusPx: 8, itemRadiusPx: 999, gapPx: 14, maxItems: 9, imageSizePx: 68, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, paddingTopPx: 22, paddingBottomPx: 24 },
  { id: 'home-promo-small', sectionKey: 'promo-small', title: 'بنرهای کوچک صفحه اصلی', isVisible: true, order: 3, layout: 'grid', desktopColumns: 3, mobileColumns: 1, borderRadiusPx: 10, itemRadiusPx: 10, gapPx: 12, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, itemMinHeightPx: 178, items: [
    { id: 'promo-small-1', title: 'باتری و برق خودرو', subtitle: 'پیشنهاد روز', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 1, widthPercent: 34, tabletWidthPercent: 34, mobileWidthPercent: 100, heightPx: 178 },
    { id: 'promo-small-2', title: 'رینگ، جلوبندی و تعلیق', subtitle: 'محصولات منتخب', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 2, widthPercent: 33, tabletWidthPercent: 33, mobileWidthPercent: 100, heightPx: 178 },
    { id: 'promo-small-3', title: 'پیشنهادهای محدود فروشگاه', subtitle: 'فروش ویژه', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 3, widthPercent: 33, tabletWidthPercent: 33, mobileWidthPercent: 100, heightPx: 178 }
  ]},
  { id: 'home-featured-products', sectionKey: 'featured-products', title: 'محصولات ویژه', subtitle: 'محصولات منتخب، جدید و پرفروش فروشگاه', isVisible: true, order: 4, layout: 'grid', desktopColumns: 4, mobileColumns: 2, borderRadiusPx: 8, itemRadiusPx: 10, gapPx: 10, maxItems: 8, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, paddingTopPx: 28, paddingBottomPx: 30 },
  { id: 'home-wide-banner-1', sectionKey: 'wide-banner-1', title: 'بنر عریض میانی', isVisible: true, order: 5, layout: 'full', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 10, minHeightPx: 330, fullWidth: true, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 0, items: [
    { id: 'wide-banner-1-item', title: 'برای توقف مطمئن، قطعه مطمئن انتخاب کنید', subtitle: 'سیستم ترمز و ایمنی', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 1, widthPercent: 100, tabletWidthPercent: 100, mobileWidthPercent: 100, heightPx: 330, titleColor: '#ffffff', subtitleColor: '#f5a000', buttonBgColor: '#ffffff', buttonTextColor: '#111827', textAlignment: 'right' }
  ] },
  { id: 'home-manufacturers', sectionKey: 'manufacturers', title: 'برندهای خودرو', isVisible: true, order: 6, layout: 'grid', desktopColumns: 10, mobileColumns: 3, borderRadiusPx: 8, itemRadiusPx: 999, gapPx: 10, maxItems: 20, imageSizePx: 58, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, paddingTopPx: 24, paddingBottomPx: 24, items: [
    { id: 'manufacturer-kmc', title: 'KMC', imageUrl: 'https://www.google.com/s2/favicons?domain=kermanmotor.com&sz=128', link: 'car-brand:kmc', isVisible: true, order: 1 },
    { id: 'manufacturer-chery', title: 'Chery', imageUrl: 'https://www.google.com/s2/favicons?domain=cheryinternational.com&sz=128', link: 'car-brand:chery', isVisible: true, order: 2 },
    { id: 'manufacturer-mvm', title: 'MVM', imageUrl: 'https://www.google.com/s2/favicons?domain=mvmco.ir&sz=128', link: 'car-brand:mvm', isVisible: true, order: 3 },
    { id: 'manufacturer-fownix', title: 'Fownix', imageUrl: 'https://www.google.com/s2/favicons?domain=fownix.com&sz=128', link: 'car-brand:fownix', isVisible: true, order: 4 },
    { id: 'manufacturer-jac', title: 'JAC', imageUrl: 'https://www.google.com/s2/favicons?domain=jac.com.cn&sz=128', link: 'car-brand:jac', isVisible: true, order: 5 },
    { id: 'manufacturer-lamari', title: 'Lamari', imageUrl: 'https://www.google.com/s2/favicons?domain=lamari.ir&sz=128', link: 'car-brand:lamari', isVisible: true, order: 6 },
    { id: 'manufacturer-changan', title: 'Changan', imageUrl: 'https://www.google.com/s2/favicons?domain=globalchangan.com&sz=128', link: 'car-brand:changan', isVisible: true, order: 7 },
    { id: 'manufacturer-jetour', title: 'Jetour', imageUrl: 'https://www.google.com/s2/favicons?domain=jetourglobal.com&sz=128', link: 'car-brand:jetour', isVisible: true, order: 8 },
    { id: 'manufacturer-byd', title: 'BYD', imageUrl: 'https://www.google.com/s2/favicons?domain=bydglobal.com&sz=128', link: 'shop', isVisible: true, order: 9 },
    { id: 'manufacturer-geely', title: 'Geely', imageUrl: 'https://www.google.com/s2/favicons?domain=global.geely.com&sz=128', link: 'shop', isVisible: true, order: 10 },
    { id: 'manufacturer-haval', title: 'Haval', imageUrl: 'https://www.google.com/s2/favicons?domain=haval-global.com&sz=128', link: 'shop', isVisible: true, order: 11 },
    { id: 'manufacturer-gac', title: 'GAC', imageUrl: 'https://www.google.com/s2/favicons?domain=gac-motor.com&sz=128', link: 'shop', isVisible: true, order: 12 },
    { id: 'manufacturer-dongfeng', title: 'Dongfeng', imageUrl: 'https://www.google.com/s2/favicons?domain=dongfeng-global.com&sz=128', link: 'shop', isVisible: true, order: 13 },
    { id: 'manufacturer-faw', title: 'FAW', imageUrl: 'https://www.google.com/s2/favicons?domain=faw.com&sz=128', link: 'shop', isVisible: true, order: 14 },
    { id: 'manufacturer-bestune', title: 'Bestune', imageUrl: 'https://www.google.com/s2/favicons?domain=bestune-global.com&sz=128', link: 'shop', isVisible: true, order: 15 },
    { id: 'manufacturer-baic', title: 'BAIC', imageUrl: 'https://www.google.com/s2/favicons?domain=baicglobal.com&sz=128', link: 'shop', isVisible: true, order: 16 },
    { id: 'manufacturer-haima', title: 'Haima', imageUrl: 'https://www.google.com/s2/favicons?domain=haima.com&sz=128', link: 'shop', isVisible: true, order: 17 },
    { id: 'manufacturer-swm', title: 'SWM', imageUrl: 'https://www.google.com/s2/favicons?domain=swmmotors.com&sz=128', link: 'shop', isVisible: true, order: 18 },
    { id: 'manufacturer-omoda', title: 'Omoda', imageUrl: 'https://www.google.com/s2/favicons?domain=omodajaecoo.com&sz=128', link: 'shop', isVisible: true, order: 19 },
    { id: 'manufacturer-jaecoo', title: 'Jaecoo', imageUrl: 'https://www.google.com/s2/favicons?domain=omodajaecoo.com&sz=128', link: 'shop', isVisible: true, order: 20 }
  ]},
  { id: 'home-parts-brands', sectionKey: 'parts-brands', title: 'برندهای محبوب قطعات', isVisible: true, order: 7, layout: 'grid', desktopColumns: 8, mobileColumns: 2, borderRadiusPx: 8, itemRadiusPx: 4, gapPx: 7, maxItems: 16, imageSizePx: 48, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, paddingTopPx: 24, paddingBottomPx: 24 },
  { id: 'home-promo-medium', sectionKey: 'promo-medium', title: 'بنرهای متوسط', isVisible: true, order: 8, layout: 'grid', desktopColumns: 2, mobileColumns: 1, borderRadiusPx: 10, itemRadiusPx: 10, gapPx: 12, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, itemMinHeightPx: 205, items: [
    { id: 'promo-medium-1', title: 'جلوبندی، تایر و سیستم تعلیق', subtitle: 'آماده برای جاده', buttonText: 'خرید کنید', link: 'shop', isVisible: true, order: 1, widthPercent: 50, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 205 },
    { id: 'promo-medium-2', title: 'قطعات موتور و سرویس تخصصی', subtitle: 'قطعات حیاتی موتور', buttonText: 'خرید کنید', link: 'shop', isVisible: true, order: 2, widthPercent: 50, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 205 }
  ]},
  { id: 'home-weekly-deals', sectionKey: 'weekly-deals', title: 'بهترین پیشنهادهای این هفته', subtitle: 'فرصت محدود برای خرید قطعات منتخب', isVisible: true, order: 9, layout: 'grid', desktopColumns: 4, mobileColumns: 2, borderRadiusPx: 10, itemRadiusPx: 14, gapPx: 10, maxItems: 8, fullWidth: true, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 0, paddingTopPx: 28, paddingBottomPx: 34, headingFontSizePx: 20, subtitleFontSizePx: 11, dealTimerAlign: 'left', dealTimerFontSizePx: 18, dealTitleColor: '#ffffff', dealSubtitleColor: '#fff7ed', dealTimerTextColor: '#b45309', dealTimerBoxBgColor: '#ffffff', dealContentVerticalAlign: 'center' },
  { id: 'home-promo-large', sectionKey: 'promo-large', title: 'بنرهای اصلی', isVisible: true, order: 10, layout: 'grid', desktopColumns: 3, mobileColumns: 1, borderRadiusPx: 10, itemRadiusPx: 10, gapPx: 12, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, itemMinHeightPx: 220, items: [
    { id: 'promo-large-1', title: 'چراغ‌ها و قطعات بدنه با تنوع کامل', subtitle: 'روشنایی و بدنه', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 1, widthPercent: 67, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 220 },
    { id: 'promo-large-2', title: 'سرویس دوره‌ای مطمئن', subtitle: 'فیلترها', link: 'shop:maintenance', isVisible: true, order: 2, widthPercent: 33, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 220 },
    { id: 'promo-large-3', title: 'قطعات تخصصی انتقال قدرت', subtitle: 'گیربکس و روغن', link: 'shop', isVisible: true, order: 3, widthPercent: 33, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 220 },
    { id: 'promo-large-4', title: 'محصولات نگهداری و لوازم جانبی', subtitle: 'مراقبت خودرو', buttonText: 'مشاهده محصولات', link: 'shop', isVisible: true, order: 4, widthPercent: 67, tabletWidthPercent: 50, mobileWidthPercent: 100, heightPx: 220 }
  ]},
  { id: 'home-maintenance-products', sectionKey: 'maintenance-products', title: 'قطعات مصرفی و سرویس دوره‌ای', subtitle: 'انتخاب‌های سریع برای نگهداری اصولی خودرو', isVisible: false, order: 11, layout: 'grid', desktopColumns: 4, mobileColumns: 2, borderRadiusPx: 8, itemRadiusPx: 10, gapPx: 10, maxItems: 8, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280 },
  { id: 'home-testimonials', sectionKey: 'testimonials', title: 'نظر مشتریان ما', subtitle: 'تجربه خرید از فروشگاه تخصصی قطعات', isVisible: true, order: 12, layout: 'cards', desktopColumns: 4, mobileColumns: 2, borderRadiusPx: 10, itemRadiusPx: 10, gapPx: 10, fullWidth: true, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 0, paddingTopPx: 26, paddingBottomPx: 30, items: [
    { id: 'testimonial-1', title: 'خریدار قطعات موتور', content: 'اصالت قطعه دقیق بود و خیلی سریع به دستم رسید.', isVisible: true, order: 1 },
    { id: 'testimonial-2', title: 'مشتری فروشگاه', content: 'قبل از خرید شماره فنی را بررسی کردند و قطعه کاملاً مناسب بود.', isVisible: true, order: 2 },
    { id: 'testimonial-3', title: 'خریدار عمده', content: 'بسته‌بندی و پیگیری سفارش حرفه‌ای بود.', isVisible: true, order: 3 },
    { id: 'testimonial-4', title: 'تعمیرکار', content: 'برای قطعه کمیاب خیلی سریع استعلام انجام شد.', isVisible: true, order: 4 }
  ]},
  { id: 'home-shipping-banner', sectionKey: 'shipping-banner', title: 'ارسال سریع', subtitle: 'برای سفارش‌های واجد شرایط', isVisible: true, order: 13, layout: 'full', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 8, widthPercent: 92, tabletWidthPercent: 95, mobileWidthPercent: 96, maxWidthPx: 1040, minHeightPx: 112 },
  { id: 'home-articles', sectionKey: 'articles', title: 'راهنما و مقالات', subtitle: 'آموزش، نگهداری و انتخاب صحیح قطعات خودرو', buttonText: 'مشاهده همه مقالات', buttonLink: 'blog', isVisible: true, order: 14, layout: 'grid', desktopColumns: 3, mobileColumns: 2, borderRadiusPx: 8, itemRadiusPx: 8, gapPx: 10, maxItems: 3, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 1280, paddingTopPx: 28, paddingBottomPx: 30 },
  { id: 'home-service-strip', sectionKey: 'service-strip', title: 'مزایای فروشگاه', isVisible: true, order: 15, layout: 'grid', desktopColumns: 4, mobileColumns: 2, borderRadiusPx: 8, itemRadiusPx: 6, gapPx: 10, fullWidth: true, widthPercent: 95, tabletWidthPercent: 96, mobileWidthPercent: 100, maxWidthPx: 0, items: [
    { id: 'service-1', title: 'تضمین اصالت', content: 'کنترل اصالت و کیفیت قطعه', isVisible: true, order: 1 },
    { id: 'service-2', title: 'ارزش خرید', content: 'قیمت‌گذاری شفاف و رقابتی', isVisible: true, order: 2 },
    { id: 'service-3', title: 'ارسال سریع', content: 'بسته‌بندی ایمن و رهگیری سفارش', isVisible: true, order: 3 },
    { id: 'service-4', title: 'پشتیبانی تخصصی', content: 'مشاوره قبل و بعد از خرید', isVisible: true, order: 4 }
  ]}
];

const PART_REQUEST_SECTION_DEFAULTS: PageSection[] = [
  { id: 'request-hero', sectionKey: 'request-hero', title: 'استعلام و واردات قطعه کمیاب خودروهای چینی', subtitle: 'اگر قطعه مورد نظر شما در سایت موجود نیست، مشخصات خودرو و قطعه را ارسال کنید تا واحد تامین بررسی کند.', badge: 'سفارش اختصاصی و استعلام فوری', isVisible: true, order: 1, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 16, paddingTopPx: 16, paddingBottomPx: 16 },
  { id: 'request-form', sectionKey: 'request-form', title: 'فرم استعلام قطعه', subtitle: 'اطلاعات خودرو، قطعه و راه ارتباطی را وارد کنید.', isVisible: true, order: 2, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 },
  { id: 'request-info', sectionKey: 'request-info', title: 'زمان‌بندی پاسخگویی به استعلام', subtitle: 'استعلام‌های داخلی معمولاً سریع‌تر و استعلام وارداتی پس از بررسی تامین‌کننده اعلام می‌شود.', isVisible: true, order: 3, layout: 'cards', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20, items: [
    { id: 'request-info-1', title: 'تطبیق با شماره شاسی', content: 'بررسی قطعه براساس VIN و مشخصات خودرو', isVisible: true, order: 1 },
    { id: 'request-info-2', title: 'اعلام قیمت و زمان تحویل', content: 'نتیجه استعلام پس از بررسی موجودی و تامین اعلام می‌شود.', isVisible: true, order: 2 },
    { id: 'request-info-3', title: 'ارسال مطمئن', content: 'امکان ارسال به تعمیرگاه یا آدرس خریدار', isVisible: true, order: 3 }
  ]},
  { id: 'request-contact', sectionKey: 'request-contact', title: 'نیاز به استعلام تلفنی فوری دارید؟', subtitle: 'شماره تماس این بخش را از Page Builder تغییر دهید.', buttonText: 'تماس با واحد تامین', buttonLink: 'tel:02100000000', isVisible: true, order: 4, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 }
];

const upgradeLegacyHomeSection = (section: PageSection): PageSection => {
  const key = section.sectionKey;
  if (!section.contentSource) {
    const liveSource =
      key === 'featured-categories' ? 'categories' :
      key === 'manufacturers' ? 'brands' :
      ['featured-products','weekly-deals','maintenance-products'].includes(key || '') ? 'products' :
      key === 'articles' ? 'articles' :
      'manual';
    section = {
      ...section,
      contentSource: liveSource as PageSection['contentSource'],
      contentSourceLimit: section.contentSourceLimit || section.maxItems
    };
  }
  if (key === 'hero' && (!section.fullWidth || section.maxWidthPx !== 0)) {
    return {
      ...section,
      fullWidth: true,
      widthPercent: 100,
      maxWidthPx: 0,
      borderRadiusPx: 0,
      paddingInlinePx: 0
    };
  }
  if (
    key === 'maintenance-products' &&
    section.id === 'home-maintenance-products' &&
    section.title === 'قطعات مصرفی و سرویس دوره‌ای' &&
    section.order === 11 &&
    section.imageUrl == null
  ) {
    return { ...section, isVisible: false };
  }
  if (key === 'manufacturers') {
    const manufacturerDefaults = HOME_SECTION_DEFAULTS.find(item => item.sectionKey === 'manufacturers');
    const shouldUpgradeGrid = section.desktopColumns == null || section.desktopColumns === 6 || section.desktopColumns === 12;
    return {
      ...section,
      desktopColumns: shouldUpgradeGrid ? 10 : section.desktopColumns,
      mobileColumns: section.mobileColumns || 3,
      maxItems: section.maxItems === 12 || section.maxItems === 24 || section.maxItems == null ? 20 : section.maxItems,
      imageSizePx: section.imageSizePx || 58,
      gapPx: section.gapPx ?? 10,
      items: section.items?.length ? section.items : manufacturerDefaults?.items
    };
  }
  if (key === 'parts-brands' && (section.desktopColumns == null || section.desktopColumns === 4)) {
    return {
      ...section,
      desktopColumns: 8,
      mobileColumns: section.mobileColumns || 2,
      maxItems: section.maxItems || 16,
      imageSizePx: section.imageSizePx || 48,
      gapPx: section.gapPx ?? 7
    };
  }
  if (key === 'featured-categories' && (section.desktopColumns == null || section.desktopColumns === 6)) {
    return {
      ...section,
      desktopColumns: 9,
      mobileColumns: section.mobileColumns || 3,
      maxItems: section.maxItems || 9,
      imageSizePx: section.imageSizePx || 68,
      gapPx: section.gapPx ?? 14
    };
  }
  if (key === 'promo-large' && (section.desktopColumns == null || section.desktopColumns === 2)) {
    return { ...section, desktopColumns: 3, mobileColumns: section.mobileColumns || 1, itemRadiusPx: section.itemRadiusPx ?? 3 };
  }
  if (key === 'wide-banner-1' && !section.fullWidth && (section.maxWidthPx == null || section.maxWidthPx === 1280)) {
    return { ...section, fullWidth: true, widthPercent: 100, maxWidthPx: 0, borderRadiusPx: 0, minHeightPx: section.minHeightPx || 330 };
  }
  if ((key === 'weekly-deals' || key === 'testimonials' || key === 'service-strip') && !section.fullWidth && (section.maxWidthPx == null || section.maxWidthPx === 1280)) {
    return { ...section, fullWidth: true, widthPercent: 100, maxWidthPx: 0, borderRadiusPx: 0 };
  }
  if (key === 'shipping-banner' && (section.maxWidthPx == null || section.maxWidthPx === 1280)) {
    return { ...section, widthPercent: 100, maxWidthPx: 1040, minHeightPx: section.minHeightPx || 128, borderRadiusPx: section.borderRadiusPx ?? 3 };
  }
  if (key === 'articles') {
    return {
      ...section,
      mobileColumns: section.mobileColumns === 1 ? 2 : section.mobileColumns,
      maxItems: section.maxItems || 3,
      buttonText: section.buttonText ?? 'مشاهده همه مقالات',
      buttonLink: section.buttonLink ?? 'blog'
    };
  }
  return section;
};

const mergeSystemSections = (page: SitePage, defaults: PageSection[], inferredKeys: Record<string, string> = {}): SitePage => {
  const existing = (page.sections || []).map(section => upgradeLegacyHomeSection({
    ...section,
    sectionKey: section.sectionKey || inferredKeys[section.id]
  }));
  const existingKeys = new Set(existing.map(section => section.sectionKey).filter(Boolean));
  const missing = defaults
    .filter(section => !section.sectionKey || !existingKeys.has(section.sectionKey))
    .map(section => ({ ...section }));
  return { ...page, sections: [...existing, ...missing].sort((a, b) => a.order - b.order) };
};

const normalizeBuilderPages = (inputPages: SitePage[]): SitePage[] => {
  const inferredKeys: Record<string, string> = {
    'sec-hero': 'hero',
    'sec-brands': 'manufacturers',
    'sec-categories': 'featured-categories'
  };

  const mapped = inputPages.map(page => {
    if (page.slug === 'home') return mergeSystemSections(page, HOME_SECTION_DEFAULTS, inferredKeys);
    if (page.slug === 'part-request') return mergeSystemSections(page, PART_REQUEST_SECTION_DEFAULTS);
    return page;
  });

  if (!mapped.some(page => page.slug === 'part-request')) {
    mapped.push({
      id: 'page-part-request',
      slug: 'part-request',
      title: 'استعلام قطعه',
      description: 'فرم استعلام و تامین قطعات کمیاب',
      isSystem: true,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
      sections: PART_REQUEST_SECTION_DEFAULTS.map(section => ({ ...section }))
    });
  }

  return mapped;
};

const syncSeoDraft = async (
  type: 'product' | 'article' | 'page' | 'category' | 'brand' | 'model',
  id: string,
  seo?: SeoEntityDraft
): Promise<void> => {
  if (!seo || !id) return;
  const { images: _images, ...meta } = seo;
  await apiRequest(`/api/seo/entities/${type}/${encodeURIComponent(id)}/meta`, {
    method: 'PUT',
    body: JSON.stringify(meta)
  });
};

const syncCategorySeoTree = async (category: Category): Promise<void> => {
  const jobs: Array<Promise<void>> = [];
  if (category.seo) jobs.push(syncSeoDraft('category', category.id, category.seo));

  const walk = (nodes: any[] = []) => {
    for (const node of nodes) {
      if (node?.seo && node?.id) jobs.push(syncSeoDraft('category', `sub:${node.id}`, node.seo));
      if (Array.isArray(node?.subcategories)) walk(node.subcategories);
    }
  };
  walk(category.subcategories || []);
  if (jobs.length) await Promise.allSettled(jobs);
};

interface StoreContextType {
  // Catalog
  products: Product[];
  brands: CarBrand[];
  models: VehicleModel[];
  categories: Category[];
  addProduct: (product: Product) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (id: string) => void;
  bulkUpdateProducts: (updates: { id: string; price?: number; stock?: number; status?: string }[]) => void;
  
  // Articles (Blog)
  articles: Article[];
  articleCategories: ArticleCategory[];
  addArticle: (art: Article) => void;
  updateArticle: (art: Article) => void;
  deleteArticle: (id: string) => void;
  addArticleCategory: (cat: ArticleCategory) => void;
  updateArticleCategory: (cat: ArticleCategory) => void;
  deleteArticleCategory: (id: string) => void;

  // Category & Taxonomy Management
  addCategory: (cat: Category) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (catId: string) => void;

  // Brands & Models Management
  addBrand: (brand: CarBrand) => void;
  updateBrand: (brand: CarBrand) => void;
  deleteBrand: (brandId: string) => void;
  addModel: (model: VehicleModel) => void;
  updateModel: (model: VehicleModel) => void;
  deleteModel: (modelId: string) => void;

  // Active Selected Vehicle (Filter)
  selectedVehicle: GarageCar | null;
  setSelectedVehicle: (vehicle: GarageCar | null) => void;
  selectVehicleByModel: (modelId: string, year?: number) => void;
  clearSelectedVehicle: () => void;
  
  // My Garage
  garage: GarageCar[];
  addToGarage: (car: Omit<GarageCar, 'id' | 'addedAt'>) => void;
  removeFromGarage: (id: string) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, vehicleInfo?: GarageCar | null) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  
  // Compare
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  
  // Orders & Checkout
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'> & { loyaltyPointsToRedeem?: number }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByTracking: (orderNumber: string, phone: string) => Promise<Order | undefined>;
  
  // Customers (CRM)
  customers: CustomerUser[];
  addCustomer: (cust: Omit<CustomerUser, 'id' | 'registeredAt' | 'totalOrders' | 'totalSpent'>) => void;
  updateCustomer: (cust: CustomerUser) => void;
  toggleCustomerStatus: (id: string) => void;

  // Store Settings (Theme, Font, Color, Contact, Shipping)
  settings: SiteSettings;
  isStoreReady: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;

  // Payment Gateways
  paymentGateways: PaymentGatewayConfig[];
  updatePaymentGateway: (gateway: PaymentGatewayConfig) => void;
  toggleGatewayActive: (gatewayId: string) => void;

  // API Integrations (SMS, Accounting, Webhooks)
  apiIntegrations: ApiIntegrationsConfig;
  updateApiIntegrations: (config: Partial<ApiIntegrationsConfig>) => void;

  // Part Requests
  partRequests: PartRequest[];
  submitPartRequest: (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => void;
  updatePartRequestStatus: (id: string, status: 'در حال بررسی' | 'پاسخ داده شد' | 'ناموجود در گمرک') => void;
  
  // Stock Alert (Notify Me)
  stockAlerts: { productId: string; phone: string; date: string }[];
  subscribeToStockAlert: (productId: string, phone: string) => void;
  
  // Search Analytics
  searchLogs: SearchQueryLog[];
  logSearch: (query: string, resultsCount: number) => void;

  // Customer Session (CRM / Auth)
  currentCustomer: CustomerUser | null;
  customerLogin: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  customerRegister: (data: { firstName: string; lastName: string; phone: string; password: string; type: CustomerUser['type']; vehicle?: string }) => Promise<{ success: boolean; error?: string }>;
  customerLogout: () => Promise<void>;

  // Admin Sandbox Payment Simulator
  simulateAdminPayment: (
    amount: number,
    gatewayId: string,
    cardNumber: string,
    outcome: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error'
  ) => { success: boolean; trackingNumber?: string; message: string; receipt?: any };

  // Sliders & Banners
  sliders: SliderItem[];
  addSlider: (slide: SliderItem) => void;
  updateSlider: (slide: SliderItem) => void;
  deleteSlider: (id: string) => void;
  reorderSliders: (sliders: SliderItem[]) => void;

  // Multi-Admin Users & Roles Management
  adminUsers: AdminUser[];
  addAdminUser: (user: AdminUser) => void;
  updateAdminUser: (user: AdminUser) => void;
  deleteAdminUser: (id: string) => void;
  toggleAdminStatus: (id: string) => void;

  // Pages & Section Builder
  pages: SitePage[];
  updatePage: (page: SitePage) => void;
  deletePage: (pageId: string) => void;
  updateSection: (pageSlug: string, section: PageSection) => void;
  previewSection: (pageSlug: string, section: PageSection) => void;
  addSection: (pageSlug: string, section: PageSection) => void;
  deleteSection: (pageSlug: string, sectionId: string) => void;

  // Typography & Font Scale
  setFontSize: (size: 'compact' | 'normal' | 'large' | 'xlarge') => void;

  // Live Section Edit Mode for Admin
  isLiveEditActive: boolean;
  setIsLiveEditActive: (active: boolean) => void;

  // Admin Auth
  adminAuth: AdminAuthState;
  adminLogin: (user: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminChangePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;

  // Loyalty Points & Rewards Club
  loyaltyTransactions: LoyaltyTransaction[];
  getCustomerPoints: (customerId?: string) => number;
  getCustomerTransactions: (customerId?: string) => LoyaltyTransaction[];
  addLoyaltyPoints: (
    customerId: string,
    points: number,
    description: string,
    orderNumber?: string,
    type?: LoyaltyTransaction['type']
  ) => void;
  redeemLoyaltyPoints: (
    customerId: string,
    points: number,
    orderNumber?: string
  ) => boolean;
  calculatePointsEarned: (amount: number, customerId?: string) => number;
  calculatePointsValue: (points: number) => number;
  getTierInfo: (points: number) => {
    tier: LoyaltyTier;
    title: string;
    badgeClass: string;
    discountMultiplier: number;
    minPoints: number;
    perks: string[];
    nextTier?: { title: string; pointsNeeded: number; percent: number };
  };

  // Notification Toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>([]);

  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [articles, setArticles] = useState<Article[]>([]);

  const [articleCategories, setArticleCategories] = useState<ArticleCategory[]>([]);

  // Customers
  const [customers, setCustomers] = useState<CustomerUser[]>([]);

  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(null);

  // Loyalty Transactions
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);

  // Settings
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  // Prevent rendering a wrong/default template before the persisted CMS settings arrive.
  const [isStoreReady, setIsStoreReady] = useState(false);

  // Payment Gateways
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([]);

  // Secrets are loaded only after authorized admin login; the browser default is always blank.
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegrationsConfig>(EMPTY_API_INTEGRATIONS);

  // Admin authentication is server-side. No password is stored in the browser.
  // Sliders Management
  const [sliders, setSliders] = useState<SliderItem[]>([]);

  // Multi-Admin Users & Roles System
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Pages & Section Builder Management
  const [pages, setPages] = useState<SitePage[]>([]);

  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(false);

  const [adminAuth, setAdminAuth] = useState<AdminAuthState>({
    isAuthenticated: false,
    username: '',
    isMustChangePassword: false
  });

  // Selected Vehicle for active fitment filtering
  const [selectedVehicle, setSelectedVehicleState] = useState<GarageCar | null>(() => {
    const saved = localStorage.getItem('chinpart_selected_car');
    return saved ? JSON.parse(saved) : INITIAL_GARAGE[0];
  });

  // Garage
  const [garage, setGarage] = useState<GarageCar[]>(() => {
    const saved = localStorage.getItem('chinpart_garage');
    return saved ? JSON.parse(saved) : INITIAL_GARAGE;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('chinpart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('chinpart_wishlist');
    return saved ? JSON.parse(saved) : ['prod-water-pump-kmc-j7'];
  });

  // Compare List
  const [compareList, setCompareList] = useState<Product[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Server-backed engagement data
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [stockAlerts, setStockAlerts] = useState<{ productId: string; phone: string; date: string }[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchQueryLog[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const loadAdminData = async (admin: AdminUser, cancelled = false) => {
    const canOrders = admin.role === 'super_admin' || admin.permissions?.canManageOrders;
    const canAdmins = admin.role === 'super_admin' || admin.permissions?.canManageAdmins;
    const canSettings = admin.role === 'super_admin' || admin.permissions?.canManageSettings;

    const requests: Promise<void>[] = [];

    if (canOrders) {
      requests.push(
        apiRequest<{ orders: Order[] }>('/api/orders')
          .then(result => { if (!cancelled) setOrders(result.orders); })
          .catch(error => console.error('Admin orders load failed:', error))
      );
      requests.push(
        apiRequest<{ customers: CustomerUser[] }>('/api/admin-data/customers')
          .then(result => { if (!cancelled) setCustomers(result.customers); })
          .catch(error => console.error('CRM customers load failed:', error)),
        apiRequest<{ transactions: LoyaltyTransaction[] }>('/api/admin-data/loyalty')
          .then(result => { if (!cancelled) setLoyaltyTransactions(result.transactions); })
          .catch(error => console.error('Loyalty data load failed:', error)),
        apiRequest<{
          partRequests: PartRequest[];
          stockAlerts: { productId: string; phone: string; date: string }[];
          searchLogs: SearchQueryLog[];
        }>('/api/engagement/admin')
          .then(result => {
            if (cancelled) return;
            setPartRequests(result.partRequests);
            setStockAlerts(result.stockAlerts);
            setSearchLogs(result.searchLogs);
          })
          .catch(error => console.error('Engagement admin data load failed:', error))
      );
    }

    if (canAdmins) {
      requests.push(
        apiRequest<{ admins: AdminUser[] }>('/api/admin-data/admins')
          .then(result => { if (!cancelled) setAdminUsers(result.admins); })
          .catch(error => console.error('Admin users load failed:', error))
      );
    }

    if (canSettings) {
      requests.push(
        apiRequest<{ integrations: ApiIntegrationsConfig }>('/api/integrations')
          .then(result => { if (!cancelled) setApiIntegrations(result.integrations); })
          .catch(error => console.error('Integration settings load failed:', error)),
        apiRequest<{ gateways: PaymentGatewayConfig[] }>('/api/integrations/payment-gateways')
          .then(result => { if (!cancelled) setPaymentGateways(result.gateways); })
          .catch(error => console.error('Secure payment gateway settings load failed:', error))
      );
    }

    await Promise.allSettled(requests);
  };

  const loadCustomerPrivateData = async (cancelled = false) => {
    await Promise.allSettled([
      apiRequest<{ orders: Order[] }>('/api/orders/mine')
        .then(result => { if (!cancelled) setOrders(result.orders); }),
      apiRequest<{ transactions: LoyaltyTransaction[] }>('/api/auth/customer/loyalty')
        .then(result => { if (!cancelled) setLoyaltyTransactions(result.transactions); }),
      apiRequest<{ requests: PartRequest[] }>('/api/engagement/part-requests/mine')
        .then(result => { if (!cancelled) setPartRequests(result.requests); })
    ]);
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiRequest<{ products: Product[] }>('/api/catalog/products'),
      apiRequest<{ categories: Category[] }>('/api/catalog/categories'),
      apiRequest<{ brands: CarBrand[]; models: VehicleModel[] }>('/api/vehicles'),
      apiRequest<{
        articles: Article[];
        articleCategories: ArticleCategory[];
        sliders: SliderItem[];
        pages: SitePage[];
        settings: SiteSettings | null;
        paymentGateways: PaymentGatewayConfig[];
      }>('/api/cms/bundle')
    ])
      .then(([productData, categoryData, vehicleData, cmsData]) => {
        if (cancelled) return;
        setProducts(productData.products);
        setCategories(categoryData.categories);
        setBrands(vehicleData.brands);
        setModels(vehicleData.models);
        setArticles(cmsData.articles);
        setArticleCategories(cmsData.articleCategories);
        setSliders(cmsData.sliders);
        setPages(normalizeBuilderPages(cmsData.pages));
        if (cmsData.settings) setSettings({ ...INITIAL_SETTINGS, ...cmsData.settings });
        setPaymentGateways(cmsData.paymentGateways);
        setIsStoreReady(true);
      })
      .catch(error => {
        console.error('Public store data load failed:', error);
        if (import.meta.env.DEV) {
          setProducts(INITIAL_PRODUCTS);
          setCategories(INITIAL_CATEGORIES);
          setBrands(INITIAL_BRANDS);
          setModels(INITIAL_MODELS);
          setArticles(INITIAL_ARTICLES);
          setArticleCategories(INITIAL_ARTICLE_CATEGORIES);
          setSliders(INITIAL_SLIDERS);
          setPages(normalizeBuilderPages(INITIAL_PAGES));
          setSettings(INITIAL_SETTINGS);
          setPaymentGateways(INITIAL_PAYMENT_GATEWAYS);
        }
        if (!cancelled) setIsStoreReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore the HttpOnly server session without exposing credentials to JavaScript.
  useEffect(() => {
    let cancelled = false;

    apiRequest<{ role: 'customer' | 'admin'; customer?: CustomerUser; admin?: AdminUser }>('/api/auth/me')
      .then(data => {
        if (cancelled) return;
        if (data.role === 'customer' && data.customer) {
          setCurrentCustomer(data.customer);
          setCustomers(prev => {
            const exists = prev.some(item => item.id === data.customer!.id);
            return exists ? prev.map(item => item.id === data.customer!.id ? data.customer! : item) : [data.customer!, ...prev];
          });
          void loadCustomerPrivateData(cancelled);
        } else if (data.role === 'admin' && data.admin) {
          setAdminAuth({
            isAuthenticated: true,
            username: data.admin.username,
            currentUser: data.admin,
            isMustChangePassword: false
          });
          void loadAdminData(data.admin, cancelled);
        }
      })
      .catch(error => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Session restore failed:', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync state to local storage










  useEffect(() => {
    localStorage.setItem('chinpart_selected_car', JSON.stringify(selectedVehicle));
  }, [selectedVehicle]);

  useEffect(() => {
    localStorage.setItem('chinpart_garage', JSON.stringify(garage));
  }, [garage]);

  useEffect(() => {
    localStorage.setItem('chinpart_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('chinpart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);









  // Dynamic Theme Styling Application (Colors, Glow, Typography, Border Radius, Font Scale)
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.primaryColor || '#DC2626';
    root.style.setProperty('--primary-color', hex);

    // Calculate hover color (slightly darker)
    const adjustBrightness = (h: string, delta: number) => {
      let num = parseInt(h.replace('#', ''), 16);
      if (isNaN(num)) return h;
      let r = Math.min(255, Math.max(0, (num >> 16) + delta));
      let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + delta));
      let b = Math.min(255, Math.max(0, (num & 0x0000ff) + delta));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const toRgba = (h: string, alpha: number) => {
      let c = h.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (isNaN(num)) return `rgba(220, 38, 38, ${alpha})`;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const primaryHover = settings.primaryHover || adjustBrightness(hex, -25);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-light', toRgba(hex, 0.08));
    root.style.setProperty('--primary-border', toRgba(hex, 0.25));
    root.style.setProperty('--primary-dark', adjustBrightness(hex, -45));

    // Accent Glow (Red/Custom Highlight under buttons and hover states)
    const accentGlow = settings.accentGlowColor || hex;
    root.style.setProperty('--accent-glow', accentGlow);
    root.style.setProperty('--accent-glow-subtle', toRgba(accentGlow, 0.2));
    root.style.setProperty('--accent-glow-strong', toRgba(accentGlow, 0.5));

    // Dynamic Site Layout + Card/Background Themes
    const layoutPreset = settings.layoutPreset || 'classic';
    root.dataset.layout = layoutPreset;

    const themeMode = settings.themeMode || 'dark';
    let siteBg = settings.siteBgColor;
    let cardBg = settings.cardBgColor;
    let headerBg = settings.headerBgColor;
    let footerBg = settings.footerBgColor;
    let textColor = settings.textColor;

    if (!siteBg) {
      if (themeMode === 'light') siteBg = '#f8fafc';
      else if (themeMode === 'slate') siteBg = '#0f172a';
      else if (themeMode === 'navy') siteBg = '#020617';
      else siteBg = '#0a0a0a';
    }
    if (!cardBg) {
      if (themeMode === 'light') cardBg = '#ffffff';
      else if (themeMode === 'slate') cardBg = '#1e293b';
      else if (themeMode === 'navy') cardBg = '#0f172a';
      else cardBg = '#171717';
    }
    if (!headerBg) headerBg = themeMode === 'light' ? '#ffffff' : siteBg;
    if (!footerBg) footerBg = themeMode === 'light' ? '#0f172a' : siteBg;
    if (!textColor) textColor = themeMode === 'light' ? '#0f172a' : '#f8fafc';

    root.style.setProperty('--site-bg', siteBg);
    root.style.setProperty('--card-bg', cardBg);
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--footer-bg', footerBg);
    root.style.setProperty('--text-color', textColor);

    // Typography
    const font = settings.fontFamily || 'Vazirmatn';
    root.style.setProperty('--site-font', `'${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);

    // Font Scale
    const sizeScale: Record<string, string> = {
      compact: '14px',
      normal: '16px',
      large: '17.5px',
      xlarge: '19px'
    };
    root.style.fontSize = sizeScale[settings.fontSize || 'normal'] || '16px';

    // Border Radius
    const radiusMap: Record<string, string> = {
      sharp: '0px',
      normal: '12px',
      rounded: '20px',
      full: '9999px'
    };
    const radiusVal = settings.themeRadiusPx ? `${settings.themeRadiusPx}px` : (radiusMap[settings.borderRadius || 'normal'] || '12px');
    root.style.setProperty('--theme-radius', radiusVal);

    // Global SEO Synchronization
    const effectiveTitle = settings.metaTitle || settings.siteTitle || 'فروشگاه قطعات خودرو';
    document.title = effectiveTitle;

    const updateOrCreateMeta = (nameAttr: string, nameValue: string, content: string) => {
      let el = document.querySelector(`meta[${nameAttr}="${nameValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameAttr, nameValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (settings.metaDescription || settings.siteSlogan) {
      updateOrCreateMeta('name', 'description', settings.metaDescription || settings.siteSlogan || '');
    }
    if (settings.metaKeywords) {
      updateOrCreateMeta('name', 'keywords', settings.metaKeywords);
    }
    if (settings.ogTitle || effectiveTitle) {
      updateOrCreateMeta('property', 'og:title', settings.ogTitle || effectiveTitle);
    }
    if (settings.ogDescription || settings.metaDescription) {
      updateOrCreateMeta('property', 'og:description', settings.ogDescription || settings.metaDescription || '');
    }
    if (settings.ogImageUrl || settings.logoUrl) {
      updateOrCreateMeta('property', 'og:image', settings.ogImageUrl || settings.logoUrl || '');
    }
  }, [
    settings.primaryColor, 
    settings.primaryHover, 
    settings.accentGlowColor, 
    settings.themeMode,
    settings.layoutPreset,
    settings.siteBgColor, 
    settings.cardBgColor, 
    settings.headerBgColor, 
    settings.footerBgColor, 
    settings.textColor, 
    settings.fontFamily, 
    settings.fontSize, 
    settings.borderRadius, 
    settings.themeRadiusPx,
    settings.metaTitle,
    settings.metaDescription,
    settings.metaKeywords,
    settings.ogTitle,
    settings.ogDescription,
    settings.ogImageUrl,
    settings.siteTitle,
    settings.siteSlogan
  ]);

  // Article Categories Handlers
  const addArticleCategory = (cat: ArticleCategory) => {
    void apiRequest<{ category: ArticleCategory }>('/api/cms/article-categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    }).then(({ category }) => {
      setArticleCategories(prev => [...prev, category]);
      showToast(`دسته‌بندی "${category.name}" ایجاد شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت دسته‌بندی مقاله انجام نشد.', 'error');
    });
  };

  const updateArticleCategory = (cat: ArticleCategory) => {
    void apiRequest<{ category: ArticleCategory }>(`/api/cms/article-categories/${encodeURIComponent(cat.id)}`, {
      method: 'PUT',
      body: JSON.stringify(cat)
    }).then(({ category }) => {
      setArticleCategories(prev => prev.map(item => item.id === category.id ? category : item));
      showToast('دسته‌بندی مقاله به‌روزرسانی شد.');
    }).catch(error => {
      console.error(error);
      showToast('ویرایش دسته‌بندی مقاله انجام نشد.', 'error');
    });
  };

  const deleteArticleCategory = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/cms/article-categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setArticleCategories(prev => prev.filter(item => item.id !== id));
      showToast('دسته‌بندی مقاله حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف دسته‌بندی مقاله انجام نشد.', 'error');
    });
  };

  // Sliders Management
  // Sliders Management
  const addSlider = (slide: SliderItem) => {
    void apiRequest<{ slider: SliderItem }>('/api/cms/sliders', {
      method: 'POST',
      body: JSON.stringify(slide)
    }).then(({ slider }) => {
      setSliders(prev => [...prev, slider]);
      showToast(`اسلاید "${slider.title}" با موفقیت ذخیره شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت اسلاید انجام نشد.', 'error');
    });
  };

  const updateSlider = (slide: SliderItem) => {
    void apiRequest<{ slider: SliderItem }>(`/api/cms/sliders/${encodeURIComponent(slide.id)}`, {
      method: 'PUT',
      body: JSON.stringify(slide)
    }).then(({ slider }) => {
      setSliders(prev => prev.map(item => item.id === slider.id ? slider : item));
      showToast('اسلاید به‌روزرسانی شد.');
    }).catch(error => {
      console.error(error);
      showToast('ویرایش اسلاید انجام نشد.', 'error');
    });
  };

  const deleteSlider = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/cms/sliders/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setSliders(prev => prev.filter(item => item.id !== id));
      showToast('اسلاید حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف اسلاید انجام نشد.', 'error');
    });
  };

  const reorderSliders = (newSliders: SliderItem[]) => {
    void apiRequest<{ sliders: SliderItem[] }>('/api/cms/sliders/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ sliders: newSliders })
    }).then(({ sliders: saved }) => {
      setSliders(saved);
      showToast('ترتیب نمایش اسلایدها تغییر یافت.');
    }).catch(error => {
      console.error(error);
      showToast('ذخیره ترتیب اسلایدها انجام نشد.', 'error');
    });
  };

  // Multi-Admin Management
  // Multi-Admin Management
  const addAdminUser = (user: AdminUser) => {
    void apiRequest<{ admin: AdminUser }>('/api/admin-data/admins', {
      method: 'POST',
      body: JSON.stringify(user)
    }).then(({ admin }) => {
      setAdminUsers(prev => [...prev, admin]);
      showToast(`مدیر جدید "${admin.fullName}" با نقش ${admin.roleTitle} اضافه شد.`);
    }).catch(error => {
      console.error(error);
      const message = error instanceof ApiError && error.code === 'ADMIN_USERNAME_EXISTS'
        ? 'این نام کاربری قبلاً استفاده شده است.'
        : 'ثبت مدیر جدید انجام نشد.';
      showToast(message, 'error');
    });
  };

  const updateAdminUser = (user: AdminUser) => {
    void apiRequest<{ admin: AdminUser }>(`/api/admin-data/admins/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    }).then(({ admin }) => {
      setAdminUsers(prev => prev.map(item => item.id === admin.id ? admin : item));
      if (adminAuth.currentUser?.id === admin.id) {
        setAdminAuth(prev => ({ ...prev, currentUser: admin, username: admin.username }));
      }
      showToast(`اطلاعات و سطوح دسترسی مدیر "${admin.fullName}" به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش مدیر انجام نشد.', 'error');
    });
  };

  const deleteAdminUser = (id: string) => {
    const target = adminUsers.find(user => user.id === id);
    if (target?.role === 'super_admin') {
      showToast('امکان حذف مدیر ارشد کل سیستم وجود ندارد.', 'error');
      return;
    }
    void apiRequest<{ ok: boolean }>(`/api/admin-data/admins/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setAdminUsers(prev => prev.filter(user => user.id !== id));
      showToast('مدیر حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف مدیر انجام نشد.', 'error');
    });
  };

  const toggleAdminStatus = (id: string) => {
    const target = adminUsers.find(user => user.id === id);
    if (target?.role === 'super_admin') {
      showToast('امکان غیرفعال‌سازی مدیر ارشد کل سیستم وجود ندارد.', 'error');
      return;
    }

    void apiRequest<{ id: string; isActive: boolean }>(`/api/admin-data/admins/${encodeURIComponent(id)}/status`, {
      method: 'PATCH'
    }).then(result => {
      setAdminUsers(prev => prev.map(user => user.id === result.id ? { ...user, isActive: result.isActive } : user));
      showToast(`حساب کاربری مدیر ${target?.fullName || ''} ${result.isActive ? 'فعال' : 'غیرفعال'} شد.`, result.isActive ? 'success' : 'info');
    }).catch(error => {
      console.error(error);
      showToast('تغییر وضعیت مدیر انجام نشد.', 'error');
    });
  };

  // Pages & Section Builder Methods
  // Pages & Section Builder Methods

  const persistPage = (page: SitePage, successMessage: string) => {
    const normalized = { ...page, updatedAt: new Date().toLocaleDateString('fa-IR') };
    void apiRequest<{ page: SitePage }>(`/api/cms/pages/${encodeURIComponent(normalized.id)}`, {
      method: 'PUT',
      body: JSON.stringify(normalized)
    }).then(async ({ page: saved }) => {
      setPages(prev => {
        const exists = prev.some(item => item.id === saved.id);
        return exists ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved];
      });
      try {
        await syncSeoDraft('page', saved.id, saved.seo);
      } catch (seoError) {
        console.error('Page SEO sync failed:', seoError);
      }
      showToast(successMessage);
    }).catch(error => {
      console.error(error);
      showToast('ذخیره برگه در سرور انجام نشد.', 'error');
    });
  };

  const updatePage = (updatedPage: SitePage) => {
    persistPage(updatedPage, `برگه "${updatedPage.title}" با موفقیت ذخیره شد.`);
  };

  const deletePage = (pageId: string) => {
    const target = pages.find(page => page.id === pageId);
    if (!target) return;
    if (target.isSystem) {
      showToast('برگه‌های اصلی سیستمی غیرقابل حذف هستند.', 'error');
      return;
    }

    void apiRequest<{ ok: boolean }>(`/api/cms/pages/${encodeURIComponent(pageId)}`, {
      method: 'DELETE'
    }).then(() => {
      setPages(prev => prev.filter(page => page.id !== pageId));
      showToast(`برگه "${target.title}" با موفقیت حذف شد.`, 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف برگه انجام نشد.', 'error');
    });
  };

  const updateSection = (pageSlug: string, updatedSection: PageSection) => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return;
    persistPage({
      ...page,
      sections: page.sections.map(section => section.id === updatedSection.id ? updatedSection : section)
    }, `بخش "${updatedSection.title}" با موفقیت به‌روزرسانی شد.`);
  };

  const previewSection = (pageSlug: string, sectionPreview: PageSection) => {
    setPages(prev => prev.map(page => {
      if (page.slug !== pageSlug) return page;
      const exists = page.sections.some(section => section.id === sectionPreview.id);
      return {
        ...page,
        sections: exists
          ? page.sections.map(section => section.id === sectionPreview.id ? { ...sectionPreview } : section)
          : [...page.sections, { ...sectionPreview }]
      };
    }));
  };

  const addSection = (pageSlug: string, newSection: PageSection) => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return;
    persistPage({ ...page, sections: [...page.sections, newSection] }, 'بخش جدید با موفقیت اضافه شد.');
  };

  const deleteSection = (pageSlug: string, sectionId: string) => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return;
    persistPage({
      ...page,
      sections: page.sections.filter(section => section.id !== sectionId)
    }, 'بخش با موفقیت حذف شد.');
  };

  const setFontSize = (size: 'compact' | 'normal' | 'large' | 'xlarge') => {
    updateSettings({ fontSize: size });
    showToast(`اندازه فونت کل سایت به ${size === 'compact' ? 'فشرده' : size === 'large' ? 'بزرگ' : size === 'xlarge' ? 'خیلی بزرگ' : 'استاندارد'} تغییر یافت.`);
  };

  // Admin authentication is handled by the server and an HttpOnly session cookie.
  const adminLogin = async (user: string, pass: string) => {
    try {
      const data = await apiRequest<{ admin: AdminUser }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass })
      });
      setAdminAuth({
        isAuthenticated: true,
        username: data.admin.username,
        currentUser: data.admin,
        isMustChangePassword: false
      });
      await loadAdminData(data.admin);
      showToast(`خوش آمدید، ${data.admin.fullName}`);
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'ACCOUNT_BLOCKED'
          ? 'حساب کاربری این مدیر غیرفعال است.'
          : code === 'TOO_MANY_LOGIN_ATTEMPTS'
            ? 'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
            : 'نام کاربری یا رمز عبور نادرست است.';
      return { success: false, error: message };
    }
  };

  const adminChangePassword = async (oldPass: string, newPass: string) => {
    if (newPass.trim().length < 10) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۱۰ کاراکتر باشد.' };
    }
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass })
      });
      showToast('رمز عبور مدیر با موفقیت و به‌صورت امن روی سرور تغییر کرد.');
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      return {
        success: false,
        error: code === 'INVALID_CURRENT_PASSWORD'
          ? 'رمز عبور فعلی نادرست است.'
          : 'تغییر رمز عبور انجام نشد.'
      };
    }
  };

  const adminLogout = async () => {
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear the local view even if the network request fails.
    }
    setAdminAuth({
      isAuthenticated: false,
      username: '',
      isMustChangePassword: false
    });
    showToast('از حساب مدیریت خارج شدید.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    void apiRequest<{ settings: SiteSettings }>('/api/cms/settings', {
      method: 'PATCH',
      body: JSON.stringify(newSettings)
    }).then(({ settings: saved }) => {
      setSettings(saved);
      showToast('تنظیمات فروشگاه (قالب، رنگ و سیاست‌ها) با موفقیت ذخیره شد.');
    }).catch(error => {
      console.error(error);
      showToast('ذخیره تنظیمات فروشگاه انجام نشد.', 'error');
    });
  };

  const persistPaymentGateways = (gateways: PaymentGatewayConfig[], message: string) => {
    void apiRequest<{ gateways: PaymentGatewayConfig[] }>('/api/integrations/payment-gateways', {
      method: 'PUT',
      body: JSON.stringify({ gateways })
    }).then(({ gateways: saved }) => {
      setPaymentGateways(saved);
      showToast(message);
    }).catch(error => {
      console.error(error);
      const gatewayMessage =
        error instanceof ApiError && error.code === 'ENCRYPTION_KEY_NOT_CONFIGURED'
          ? 'APP_ENCRYPTION_KEY روی سرور تنظیم نشده و ذخیره امن اطلاعات درگاه ممکن نیست.'
          : 'ذخیره امن تنظیمات درگاه‌ها انجام نشد.';
      showToast(gatewayMessage, 'error');
    });
  };

  const updatePaymentGateway = (gateway: PaymentGatewayConfig) => {
    const next = paymentGateways.map(item => item.id === gateway.id ? gateway : item);
    persistPaymentGateways(next, `درگاه ${gateway.name} به‌روزرسانی شد.`);
  };

  const toggleGatewayActive = (gatewayId: string) => {
    const target = paymentGateways.find(item => item.id === gatewayId);
    if (!target) return;
    const nextActive = !target.isActive;
    const next = paymentGateways.map(item => item.id === gatewayId ? { ...item, isActive: nextActive } : item);
    persistPaymentGateways(next, `درگاه ${target.name} ${nextActive ? 'فعال' : 'غیرفعال'} شد.`);
  };

  // API Integrations
  // API Integrations
  const updateApiIntegrations = (nextConfig: Partial<ApiIntegrationsConfig>) => {
    const payload = { ...apiIntegrations, ...nextConfig };
    void apiRequest<{ integrations: ApiIntegrationsConfig }>('/api/integrations', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }).then(({ integrations }) => {
      setApiIntegrations(integrations);
      showToast('تنظیمات سرویس‌ها به‌صورت رمزنگاری‌شده روی سرور ذخیره شد.');
    }).catch(error => {
      console.error(error);
      const message =
        error instanceof ApiError && error.code === 'ENCRYPTION_KEY_NOT_CONFIGURED'
          ? 'کلید رمزنگاری APP_ENCRYPTION_KEY روی سرور تنظیم نشده است.'
          : 'ذخیره تنظیمات سرویس‌ها انجام نشد.';
      showToast(message, 'error');
    });
  };

  // Customers (CRM)
  const addCustomer = (custData: Omit<CustomerUser, 'id' | 'registeredAt' | 'totalOrders' | 'totalSpent'>) => {
    void apiRequest<{ customer: CustomerUser }>('/api/admin-data/customers', {
      method: 'POST',
      body: JSON.stringify(custData)
    }).then(({ customer }) => {
      setCustomers(prev => [customer, ...prev]);
      showToast(`مشتری ${customer.firstName} ${customer.lastName} ثبت شد.`);
    }).catch(error => {
      console.error(error);
      const message = error instanceof ApiError && error.code === 'PHONE_ALREADY_REGISTERED'
        ? 'این شماره موبایل قبلاً ثبت شده است.'
        : 'ثبت مشتری انجام نشد.';
      showToast(message, 'error');
    });
  };

  const updateCustomer = (cust: CustomerUser) => {
    void apiRequest<{ customer: CustomerUser }>(`/api/admin-data/customers/${encodeURIComponent(cust.id)}`, {
      method: 'PUT',
      body: JSON.stringify(cust)
    }).then(({ customer }) => {
      setCustomers(prev => prev.map(item => item.id === customer.id ? customer : item));
      if (currentCustomer?.id === customer.id) setCurrentCustomer(customer);
      showToast(`اطلاعات مشتری ${customer.firstName} ${customer.lastName} به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش اطلاعات مشتری انجام نشد.', 'error');
    });
  };

  const toggleCustomerStatus = (id: string) => {
    void apiRequest<{ id: string; status: 'active' | 'blocked' }>(`/api/admin-data/customers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH'
    }).then(result => {
      setCustomers(prev => prev.map(customer => customer.id === result.id ? { ...customer, status: result.status } : customer));
      showToast(`وضعیت مشتری به ${result.status === 'active' ? 'فعال' : 'مسدود'} تغییر کرد.`, 'info');
    }).catch(error => {
      console.error(error);
      showToast('تغییر وضعیت مشتری انجام نشد.', 'error');
    });
  };

  // Categories
  // Categories
  const addCategory = (cat: Category) => {
    void apiRequest<{ category: Category }>('/api/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    }).then(async ({ category }) => {
      setCategories(prev => [...prev, category]);
      try {
        await syncCategorySeoTree(category);
      } catch (seoError) {
        console.error('Category SEO sync failed:', seoError);
      }
      showToast(`دسته‌بندی ${category.nameFa} افزوده شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت دسته‌بندی در سرور انجام نشد.', 'error');
    });
  };

  const updateCategory = (cat: Category) => {
    void apiRequest<{ category: Category }>(`/api/catalog/categories/${encodeURIComponent(cat.id)}`, {
      method: 'PUT',
      body: JSON.stringify(cat)
    }).then(async ({ category }) => {
      setCategories(prev => prev.map(item => item.id === category.id ? category : item));
      try {
        await syncCategorySeoTree(category);
      } catch (seoError) {
        console.error('Category SEO sync failed:', seoError);
      }
      showToast(`دسته‌بندی ${category.nameFa} به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش دسته‌بندی در سرور انجام نشد.', 'error');
    });
  };

  const deleteCategory = (catId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/catalog/categories/${encodeURIComponent(catId)}`, {
      method: 'DELETE'
    }).then(() => {
      setCategories(prev => prev.filter(item => item.id !== catId));
      showToast('دسته‌بندی حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف دسته‌بندی در سرور انجام نشد.', 'error');
    });
  };

  // Brands & Models
  const addBrand = (brand: CarBrand) => {
    void apiRequest<{ brand: CarBrand }>('/api/vehicles/brands', {
      method: 'POST',
      body: JSON.stringify(brand)
    }).then(async ({ brand: saved }) => {
      setBrands(prev => [...prev, saved]);
      try {
        await syncSeoDraft('brand', saved.id, saved.seo);
      } catch (seoError) {
        console.error('Brand SEO sync failed:', seoError);
      }
      showToast(`برند ${saved.nameFa} اضافه شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت برند خودرو انجام نشد.', 'error');
    });
  };

  const updateBrand = (brand: CarBrand) => {
    void apiRequest<{ brand: CarBrand }>(`/api/vehicles/brands/${encodeURIComponent(brand.id)}`, {
      method: 'PUT',
      body: JSON.stringify(brand)
    }).then(async ({ brand: saved }) => {
      setBrands(prev => prev.map(item => item.id === saved.id ? saved : item));
      try {
        await syncSeoDraft('brand', saved.id, saved.seo);
      } catch (seoError) {
        console.error('Brand SEO sync failed:', seoError);
      }
      showToast(`برند ${saved.nameFa} به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش برند خودرو انجام نشد.', 'error');
    });
  };

  const deleteBrand = (brandId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/vehicles/brands/${encodeURIComponent(brandId)}`, {
      method: 'DELETE'
    }).then(() => {
      setBrands(prev => prev.filter(item => item.id !== brandId));
      setModels(prev => prev.filter(model => model.brandId !== brandId));
      showToast('برند خودرو و مدل‌های تابعه آن از سیستم حذف شدند.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف برند خودرو انجام نشد.', 'error');
    });
  };

  const addModel = (model: VehicleModel) => {
    void apiRequest<{ model: VehicleModel }>('/api/vehicles/models', {
      method: 'POST',
      body: JSON.stringify(model)
    }).then(({ model: saved }) => {
      setModels(prev => [...prev, saved]);
      showToast(`مدل ${saved.nameFa} اضافه شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت مدل خودرو انجام نشد.', 'error');
    });
  };

  const updateModel = (model: VehicleModel) => {
    void apiRequest<{ model: VehicleModel }>(`/api/vehicles/models/${encodeURIComponent(model.id)}`, {
      method: 'PUT',
      body: JSON.stringify(model)
    }).then(({ model: saved }) => {
      setModels(prev => prev.map(item => item.id === saved.id ? saved : item));
      showToast(`مدل ${saved.nameFa} به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش مدل خودرو انجام نشد.', 'error');
    });
  };

  const deleteModel = (modelId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/vehicles/models/${encodeURIComponent(modelId)}`, {
      method: 'DELETE'
    }).then(() => {
      setModels(prev => prev.filter(item => item.id !== modelId));
      showToast('مدل خودرو حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف مدل خودرو انجام نشد.', 'error');
    });
  };

  // Articles (Blog)
  const addArticle = (art: Article) => {
    void apiRequest<{ article: Article }>('/api/cms/articles', {
      method: 'POST',
      body: JSON.stringify(art)
    }).then(async ({ article }) => {
      setArticles(prev => [article, ...prev]);
      try {
        await syncSeoDraft('article', article.id, article.seo);
      } catch (seoError) {
        console.error('Article SEO sync failed:', seoError);
      }
      showToast(`مقاله "${article.title}" با موفقیت منتشر گردید.`);
    }).catch(error => {
      console.error(error);
      showToast('انتشار مقاله انجام نشد.', 'error');
    });
  };

  const updateArticle = (art: Article) => {
    void apiRequest<{ article: Article }>(`/api/cms/articles/${encodeURIComponent(art.id)}`, {
      method: 'PUT',
      body: JSON.stringify(art)
    }).then(async ({ article }) => {
      setArticles(prev => prev.map(item => item.id === article.id ? article : item));
      try {
        await syncSeoDraft('article', article.id, article.seo);
      } catch (seoError) {
        console.error('Article SEO sync failed:', seoError);
      }
      showToast(`مقاله "${article.title}" به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش مقاله انجام نشد.', 'error');
    });
  };

  const deleteArticle = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/cms/articles/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setArticles(prev => prev.filter(article => article.id !== id));
      showToast('مقاله از وبلاگ حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف مقاله انجام نشد.', 'error');
    });
  };

  // Customer authentication is handled by the production API.
  // Customer authentication is handled by the production API.
  const customerLogin = async (phone: string, pass: string) => {
    if (!pass) {
      return { success: false, error: 'رمز عبور الزامی است.' };
    }
    try {
      const data = await apiRequest<{ customer: CustomerUser }>('/api/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pass })
      });
      setCurrentCustomer(data.customer);
      setCustomers(prev => {
        const exists = prev.some(item => item.id === data.customer.id);
        return exists ? prev.map(item => item.id === data.customer.id ? data.customer : item) : [data.customer, ...prev];
      });
      await loadCustomerPrivateData();
      showToast(`خوش آمدید، ${data.customer.firstName} عزیز.`);
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'ACCOUNT_BLOCKED'
          ? 'حساب کاربری شما غیرفعال شده است.'
          : code === 'TOO_MANY_LOGIN_ATTEMPTS'
            ? 'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
            : 'شماره همراه یا رمز عبور نادرست است.';
      return { success: false, error: message };
    }
  };

  const customerRegister = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    type: CustomerUser['type'];
    vehicle?: string;
  }) => {
    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' };
    }
    try {
      const response = await apiRequest<{ customer: CustomerUser }>('/api/auth/customer/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setCurrentCustomer(response.customer);
      setCustomers(prev => [response.customer, ...prev.filter(item => item.id !== response.customer.id)]);
      await loadCustomerPrivateData();
      showToast('ثبت‌نام با موفقیت انجام شد.');
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'PHONE_ALREADY_REGISTERED'
          ? 'این شماره همراه قبلاً ثبت شده است.'
          : code === 'ACCOUNT_ACTIVATION_REQUIRED'
            ? 'این شماره قبلاً در CRM ثبت شده و برای فعال‌سازی حساب نیاز به تأیید هویت/OTP دارد.'
            : code === 'PASSWORD_TOO_SHORT'
            ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
            : 'ثبت‌نام انجام نشد. اطلاعات را بررسی کنید.';
      return { success: false, error: message };
    }
  };

  const customerLogout = async () => {
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local logout must still complete.
    }
    setCurrentCustomer(null);
    showToast('از حساب کاربری خود خارج شدید.', 'info');
  };

  // Admin Sandbox Payment Simulation
  const simulateAdminPayment = (
    amount: number,
    gatewayId: string,
    cardNumber: string,
    outcome: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error'
  ) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId) || paymentGateways[0];
    const trackingNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    const rrn = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    if (outcome === 'success') {
      return {
        success: true,
        trackingNumber,
        message: `تراکنش آزمایشی موفق روی درگاه ${gateway.name}`,
        receipt: {
          gateway: gateway.name,
          terminalId: gateway.terminalId || 'TRM-99182',
          amount,
          cardNumberMasked: cardNumber ? cardNumber.slice(0, 4) + '-****-****-' + cardNumber.slice(-4) : '6037-****-****-4592',
          trackingNumber,
          referenceNumber: rrn,
          date: new Date().toLocaleString('fa-IR'),
          status: 'تراکنش موفق شاپرک'
        }
      };
    } else if (outcome === 'insufficient_funds') {
      return {
        success: false,
        message: 'خطای شاپرک: موجودی کارت برای انجام تراکنش کافی نیست (کد ۵۱)'
      };
    } else if (outcome === 'user_cancelled') {
      return {
        success: false,
        message: 'تراکنش توسط کاربر در صفحه درگاه پرداخت لغو گردید (کد ۱۷)'
      };
    } else {
      return {
        success: false,
        message: 'خطای شبکه در اتصال به سوییچ مرکزی شاپرک (کد ۹۶)'
      };
    }
  };

  // Products
  const addProduct = (product: Product) => {
    void apiRequest<{ product: Product }>('/api/catalog/products', {
      method: 'POST',
      body: JSON.stringify(product)
    }).then(async result => {
      setProducts(prev => [result.product, ...prev]);
      try {
        await syncSeoDraft('product', result.product.id, result.product.seo);
      } catch (seoError) {
        console.error('Product SEO sync failed:', seoError);
      }
      showToast(`قطعه ${result.product.nameFa} با موفقیت ثبت شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت محصول در پایگاه داده انجام نشد.', 'error');
    });
  };

  const updateProduct = (updated: Product) => {
    void apiRequest<{ product: Product }>(`/api/catalog/products/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    }).then(async result => {
      setProducts(prev => prev.map(p => p.id === result.product.id ? result.product : p));
      try {
        await syncSeoDraft('product', result.product.id, result.product.seo);
      } catch (seoError) {
        console.error('Product SEO sync failed:', seoError);
      }
      showToast(`محصول ${result.product.nameFa} با موفقیت ویرایش شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش محصول در پایگاه داده انجام نشد.', 'error');
    });
  };

  const deleteProduct = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/catalog/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('محصول از پایگاه داده حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف محصول در سرور انجام نشد.', 'error');
    });
  };

  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {
    void apiRequest<{ ok: boolean }>('/api/catalog/products/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    }).then(() => {
      setProducts(prev => prev.map(p => {
        const target = updates.find(u => u.id === p.id);
        if (!target) return p;
        const stock = target.stock !== undefined ? target.stock : p.stock;
        return {
          ...p,
          price: target.price !== undefined ? target.price : p.price,
          stock,
          stockStatus: stock <= 0 ? 'out_of_stock' : stock <= 3 ? 'low_stock' : 'in_stock'
        };
      }));
      showToast(`${updates.length} محصول با موفقیت به‌روزرسانی گروهی شدند.`);
    }).catch(error => {
      console.error(error);
      showToast('به‌روزرسانی گروهی محصولات انجام نشد.', 'error');
    });
  };

  // Vehicle Selection
  const setSelectedVehicle = (car: GarageCar | null) => {
    setSelectedVehicleState(car);
    if (car) {
      showToast(`خودروی انتخابی شما به ${car.modelName} تغییر یافت.`);
    } else {
      showToast('فیلتر خودرو غیرفعال شد و تمامی قطعات نمایش داده می‌شوند.', 'info');
    }
  };

  const selectVehicleByModel = (modelId: string, year?: number) => {
    const model = models.find(m => m.id === modelId || m.slug === modelId);
    if (!model) return;
    const brand = brands.find(b => b.id === model.brandId);
    const newCar: GarageCar = {
      id: `temp-${Date.now()}`,
      brandId: model.brandId,
      brandName: brand?.nameFa || model.brandId,
      modelId: model.id,
      modelName: model.nameFa,
      year: year || model.yearTo || 1403,
      engine: model.engineSummary,
      transmission: model.transmissionSummary,
      customLabel: `خودروی انتخابی (${model.nameFa})`,
      imageUrl: model.imageUrl,
      addedAt: 'اکنون'
    };
    setSelectedVehicle(newCar);
  };

  const clearSelectedVehicle = () => {
    setSelectedVehicleState(null);
    showToast('فیلتر خودرو لغو شد.', 'info');
  };

  const addToGarage = (carData: Omit<GarageCar, 'id' | 'addedAt'>) => {
    const newCar: GarageCar = {
      ...carData,
      id: `gar-${Date.now()}`,
      addedAt: new Date().toLocaleDateString('fa-IR')
    };
    const updated = [newCar, ...garage];
    setGarage(updated);
    setSelectedVehicleState(newCar);
    showToast(`${newCar.modelName} به گاراژ شما اضافه و به عنوان خودروی پیش‌فرض انتخاب شد.`);
  };

  const removeFromGarage = (id: string) => {
    const updated = garage.filter(c => c.id !== id);
    setGarage(updated);
    if (selectedVehicle?.id === id) {
      setSelectedVehicleState(updated.length > 0 ? updated[0] : null);
    }
    showToast('خودرو از گاراژ شما حذف شد.', 'info');
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, vehicleInfo?: GarageCar | null) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [...prev, {
        product,
        quantity,
        selectedVehicle: vehicleInfo !== undefined ? vehicleInfo : selectedVehicle
      }];
    });
    showToast(`${product.nameFa} به سبد خرید اضافه شد.`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('کالا از سبد خرید حذف شد.', 'info');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.discountPrice || item.product.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('از لیست علاقه‌مندی‌ها حذف شد.', 'info');
        return prev.filter(id => id !== productId);
      }
      showToast('به لیست علاقه‌مندی‌ها اضافه شد.');
      return [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Compare
  const addToCompare = (product: Product): boolean => {
    if (compareList.length >= 4) {
      showToast('امکان مقایسه حداکثر ۴ محصول همزمان وجود دارد.', 'error');
      return false;
    }
    if (compareList.some(p => p.id === product.id)) {
      showToast('این قطعه قبلاً در لیست مقایسه ثبت شده است.', 'info');
      return false;
    }
    setCompareList(prev => [...prev, product]);
    showToast(`${product.nameFa} به لیست مقایسه اضافه شد.`);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
    showToast('از مقایسه حذف شد.', 'info');
  };

  const isInCompare = (productId: string) => compareList.some(p => p.id === productId);
  const clearCompare = () => setCompareList([]);

  // Loyalty Point Helpers
  const getTierInfo = (points: number) => {
    if (points >= 3000) {
      return {
        tier: 'diamond' as LoyaltyTier,
        title: 'مشتری VIP الماس',
        badgeClass: 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/40',
        discountMultiplier: 2.0,
        minPoints: 3000,
        perks: [
          'کسب ۲ برابر امتیاز در تمامی خریدها (۲٪ بازگشت وجه)',
          'ارسال اکسپرس و بیمه‌شده کاملاً رایگان بدون سقف سفارش',
          'مشاوره فنی تلفنی اختصاصی با مهندسین ارشد خودرو',
          'اولویت ترخیص و تامین قطعات نایاب و سفارشی از گمرک'
        ]
      };
    }
    if (points >= 1000) {
      return {
        tier: 'gold' as LoyaltyTier,
        title: 'مشتری طلایی',
        badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/30 border border-amber-300/40',
        discountMultiplier: 1.5,
        minPoints: 1000,
        perks: [
          'کسب ۱.۵ برابر امتیاز در تمامی خریدها',
          'بسته‌بندی ضربه‌گیر ویژه قطعات حساس بدون هزینه اضافی',
          'اولویت آماده‌سازی و ارسال سفارش‌ها در انبار مرکزی'
        ],
        nextTier: {
          title: 'مشتری VIP الماس',
          pointsNeeded: 3000 - points,
          percent: Math.min(100, Math.round(((points - 1000) / 2000) * 100))
        }
      };
    }
    if (points >= 500) {
      return {
        tier: 'silver' as LoyaltyTier,
        title: 'مشتری نقره‌ای',
        badgeClass: 'bg-gradient-to-r from-slate-400 to-neutral-600 text-white shadow-md shadow-slate-500/20 border border-slate-300/40',
        discountMultiplier: 1.25,
        minPoints: 500,
        perks: [
          'کسب ۱.۲۵ برابر امتیاز در خریدها',
          'دسترسی زودهنگام به حراجی‌ها و جشنواره‌های فصلی'
        ],
        nextTier: {
          title: 'مشتری طلایی',
          pointsNeeded: 1000 - points,
          percent: Math.min(100, Math.round(((points - 500) / 500) * 100))
        }
      };
    }
    return {
      tier: 'bronze' as LoyaltyTier,
      title: 'مشتری برنزی',
      badgeClass: 'bg-gradient-to-r from-amber-800 to-stone-800 text-amber-100 shadow-md shadow-amber-900/20 border border-amber-700/40',
      discountMultiplier: 1.0,
      minPoints: 0,
      perks: [
        'کسب ۱ امتیاز به ازای هر ۱۰ هزار تومان خرید',
        'امکان تبدیل امتیازات به تخفیف در سبد خرید'
      ],
      nextTier: {
        title: 'مشتری نقره‌ای',
        pointsNeeded: 500 - points,
        percent: Math.min(100, Math.round((points / 500) * 100))
      }
    };
  };

  const getCustomerPoints = (customerId?: string): number => {
    const targetId = customerId || currentCustomer?.id;
    if (!targetId) return 0;
    const cust = customers.find(c => c.id === targetId || c.phone === targetId);
    if (cust && typeof cust.loyaltyPoints === 'number') {
      return cust.loyaltyPoints;
    }
    const custTx = loyaltyTransactions.filter(t => t.customerId === targetId || (cust && t.customerId === cust.id));
    if (custTx.length > 0) {
      return custTx[0].balanceAfter;
    }
    return 0;
  };

  const getCustomerTransactions = (customerId?: string): LoyaltyTransaction[] => {
    const targetId = customerId || currentCustomer?.id;
    if (!targetId) return [];
    const cust = customers.find(c => c.id === targetId || c.phone === targetId);
    return loyaltyTransactions.filter(t => t.customerId === targetId || (cust && t.customerId === cust.id));
  };

  const calculatePointsEarned = (amount: number, customerId?: string): number => {
    const rate = settings.loyaltySettings?.pointsPerToman ?? 0.0001; // 1 point per 10,000 Tomans
    const base = Math.floor(amount * rate);
    const pts = getCustomerPoints(customerId);
    const tier = getTierInfo(pts);
    return Math.max(1, Math.round(base * tier.discountMultiplier));
  };

  const calculatePointsValue = (points: number): number => {
    const valuePerPoint = settings.loyaltySettings?.tomanPerPoint ?? 1000;
    return Math.max(0, points * valuePerPoint);
  };

  const addLoyaltyPoints = (
    customerId: string,
    points: number,
    description: string,
    orderNumber?: string,
    type: LoyaltyTransaction['type'] = 'bonus'
  ) => {
    if (points <= 0) return;

    void apiRequest<{ transaction: LoyaltyTransaction }>('/api/admin-data/loyalty', {
      method: 'POST',
      body: JSON.stringify({ customerId, points, description, orderNumber, type })
    }).then(({ transaction }) => {
      setLoyaltyTransactions(prev => [transaction, ...prev]);
      setCustomers(prev => prev.map(customer =>
        customer.id === customerId
          ? { ...customer, loyaltyPoints: transaction.balanceAfter, loyaltyTier: getTierInfo(transaction.balanceAfter).tier }
          : customer
      ));
      if (currentCustomer?.id === customerId) {
        setCurrentCustomer(prev => prev ? {
          ...prev,
          loyaltyPoints: transaction.balanceAfter,
          loyaltyTier: getTierInfo(transaction.balanceAfter).tier
        } : null);
      }
    }).catch(error => {
      console.error(error);
      showToast('ثبت امتیاز وفاداری انجام نشد.', 'error');
    });
  };

  const redeemLoyaltyPoints = (
    customerId: string,
    points: number,
    orderNumber?: string
  ): boolean => {
    const currentPts = getCustomerPoints(customerId);
    if (points <= 0 || currentPts < points) return false;

    void apiRequest<{ transaction: LoyaltyTransaction }>('/api/admin-data/loyalty', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        points: -points,
        description: orderNumber
          ? `کسر امتیاز بابت تخفیف در سفارش ${orderNumber}`
          : 'کسر امتیاز بابت تخفیف خرید',
        orderNumber,
        type: 'redeemed'
      })
    }).then(({ transaction }) => {
      setLoyaltyTransactions(prev => [transaction, ...prev]);
      setCustomers(prev => prev.map(customer =>
        customer.id === customerId
          ? { ...customer, loyaltyPoints: transaction.balanceAfter, loyaltyTier: getTierInfo(transaction.balanceAfter).tier }
          : customer
      ));
      if (currentCustomer?.id === customerId) {
        setCurrentCustomer(prev => prev ? {
          ...prev,
          loyaltyPoints: transaction.balanceAfter,
          loyaltyTier: getTierInfo(transaction.balanceAfter).tier
        } : null);
      }
    }).catch(error => {
      console.error(error);
      showToast('کسر امتیاز وفاداری انجام نشد.', 'error');
    });

    return true;
  };

  // Orders
  // Orders
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'date'> & { loyaltyPointsToRedeem?: number }
  ): Promise<Order> => {
    const response = await apiRequest<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: orderData.customer,
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          vehicleInfo: item.vehicleInfo
        })),
        shippingMethodId: orderData.shippingMethod.id,
        paymentMethodId: orderData.paymentMethod.id
      })
    });

    setOrders(prev => [response.order, ...prev.filter(item => item.id !== response.order.id)]);
    showToast(`سفارش ${response.order.orderNumber} در سرور ثبت شد.`);
    return response.order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingCode?: string) => {
    void apiRequest<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingCode })
    }).then(({ order }) => {
      setOrders(prev => prev.map(item =>
        item.id === order.id || item.orderNumber === order.orderNumber ? order : item
      ));
      showToast(`وضعیت سفارش ${order.orderNumber} به‌روز شد.`);
    }).catch(error => {
      console.error(error);
      showToast('تغییر وضعیت سفارش روی سرور انجام نشد.', 'error');
    });
  };

  const deleteOrder = (orderId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    }).then(() => {
      setOrders(prev => prev.filter(o => o.id !== orderId && o.orderNumber !== orderId));
      showToast('سفارش حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف سفارش روی سرور انجام نشد.', 'error');
    });
  };

  const getOrderById = (orderId: string) =>
    orders.find(o => o.id === orderId || o.orderNumber === orderId);

  const getOrderByTracking = async (orderNumber: string, phone: string) => {
    try {
      const response = await apiRequest<{ order: Order }>('/api/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderNumber, phone })
      });
      setOrders(prev => [response.order, ...prev.filter(item => item.id !== response.order.id)]);
      return response.order;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined;
      console.error(error);
      showToast('ارتباط با سامانه رهگیری سفارش برقرار نشد.', 'error');
      return undefined;
    }
  };

  // Part Requests
  const submitPartRequest = (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => {
    void apiRequest<{ request: PartRequest }>('/api/engagement/part-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    }).then(({ request }) => {
      setPartRequests(prev => [request, ...prev.filter(item => item.id !== request.id)]);
      showToast('درخواست استعلام قطعه با موفقیت ثبت شد.');
    }).catch(error => {
      console.error(error);
      showToast('ثبت درخواست استعلام انجام نشد.', 'error');
    });
  };

  const updatePartRequestStatus = (id: string, status: 'در حال بررسی' | 'پاسخ داده شد' | 'ناموجود در گمرک') => {
    void apiRequest<{ request: PartRequest }>(`/api/engagement/part-requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }).then(({ request }) => {
      setPartRequests(prev => prev.map(item => item.id === request.id ? request : item));
      showToast('وضعیت استعلام به‌روزرسانی شد.');
    }).catch(error => {
      console.error(error);
      showToast('به‌روزرسانی وضعیت استعلام انجام نشد.', 'error');
    });
  };

  // Stock Alerts
  const subscribeToStockAlert = (productId: string, phone: string) => {
    void apiRequest<{ alert: { productId: string; phone: string; date: string } }>('/api/engagement/stock-alerts', {
      method: 'POST',
      body: JSON.stringify({ productId, phone })
    }).then(({ alert }) => {
      setStockAlerts(prev => {
        const filtered = prev.filter(item => !(item.productId === alert.productId && item.phone === alert.phone));
        return [alert, ...filtered];
      });
      showToast('درخواست اطلاع‌رسانی ثبت شد.');
    }).catch(error => {
      console.error(error);
      showToast('ثبت درخواست اطلاع‌رسانی انجام نشد.', 'error');
    });
  };

  // Search Logging
  const logSearch = (query: string, resultsCount: number) => {
    if (!query.trim()) return;
    void apiRequest<{ log: SearchQueryLog }>('/api/engagement/search-log', {
      method: 'POST',
      body: JSON.stringify({ query, resultsCount })
    }).then(({ log }) => {
      setSearchLogs(prev => {
        const idx = prev.findIndex(item => item.query.toLowerCase() === log.query.toLowerCase());
        if (idx < 0) return [log, ...prev];
        const next = [...prev];
        next[idx] = log;
        return next;
      });
    }).catch(error => {
      console.error('Search log failed:', error);
    });
  };

  // Synchronize Google Font, Theme Colors, Font Size, Favicon, and Site Title to DOM
  useEffect(() => {
    if (settings?.fontFamily) {
      document.documentElement.style.setProperty(
        '--site-font',
        `'${settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
      );
    }
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
    if (settings?.fontSize) {
      const sizeMap: Record<string, string> = {
        compact: '14px',
        normal: '16px',
        large: '18px',
        xlarge: '20px'
      };
      document.documentElement.style.fontSize = sizeMap[settings.fontSize] || '16px';
    }
    if (settings?.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
    if (settings?.siteTitle) {
      document.title = `${settings.siteTitle} - ${settings.siteSlogan || 'بازار قطعات خودروهای چینی'}`;
    }
  }, [settings?.fontFamily, settings?.primaryColor, settings?.fontSize, settings?.faviconUrl, settings?.siteTitle, settings?.siteSlogan]);

  return (
    <StoreContext.Provider value={{
      products,
      brands,
      models,
      categories,
      articles,
      addProduct,
      updateProduct,
      deleteProduct,
      bulkUpdateProducts,
      articleCategories,
      addArticle,
      updateArticle,
      deleteArticle,
      addArticleCategory,
      updateArticleCategory,
      deleteArticleCategory,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrand,
      addModel,
      updateModel,
      deleteModel,
      selectedVehicle,
      setSelectedVehicle,
      selectVehicleByModel,
      clearSelectedVehicle,
      garage,
      addToGarage,
      removeFromGarage,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      wishlist,
      toggleWishlist,
      isInWishlist,
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      orders,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      getOrderById,
      getOrderByTracking,
      customers,
      currentCustomer,
      customerLogin,
      customerRegister,
      customerLogout,
      addCustomer,
      updateCustomer,
      toggleCustomerStatus,
      sliders,
      addSlider,
      updateSlider,
      deleteSlider,
      reorderSliders,
      adminUsers,
      addAdminUser,
      updateAdminUser,
      deleteAdminUser,
      toggleAdminStatus,
      pages,
      updatePage,
      deletePage,
      updateSection,
      previewSection,
      addSection,
      deleteSection,
      setFontSize,
      isLiveEditActive,
      setIsLiveEditActive,
      settings,
      isStoreReady,
      updateSettings,
      paymentGateways,
      updatePaymentGateway,
      toggleGatewayActive,
      simulateAdminPayment,
      apiIntegrations,
      updateApiIntegrations,
      partRequests,
      submitPartRequest,
      updatePartRequestStatus,
      stockAlerts,
      subscribeToStockAlert,
      searchLogs,
      logSearch,
      adminAuth,
      adminLogin,
      adminChangePassword,
      adminLogout,
      loyaltyTransactions,
      getCustomerPoints,
      getCustomerTransactions,
      addLoyaltyPoints,
      redeemLoyaltyPoints,
      calculatePointsEarned,
      calculatePointsValue,
      getTierInfo,
      toast,
      showToast
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
