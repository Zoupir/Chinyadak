import React from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Headphones, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronLeft,
  Edit3,
  ExternalLink,
  Zap,
  CheckCircle,
  Package
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { FooterBadgeItem, FooterFeatureItem } from '../../types';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuthModal }) => {
  const { brands, categories, settings, adminAuth } = useStore();

  const handleLinkClick = (url: string) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      window.location.href = url;
      return;
    }
    if (url === 'auth:login' || url === 'login') {
      onOpenAuthModal?.('login');
      return;
    }
    if (url === 'auth:register' || url === 'register') {
      onOpenAuthModal?.('register');
      return;
    }
    if (url.includes(':')) {
      const [view, param] = url.split(':');
      onNavigate(view, param);
    } else {
      onNavigate(url);
    }
  };

  const getFeatureIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'shieldcheck':
      case 'shield':
        return <ShieldCheck className="w-6 h-6" />;
      case 'truck':
        return <Truck className="w-6 h-6" />;
      case 'clock':
        return <Clock className="w-6 h-6" />;
      case 'headphones':
      case 'support':
        return <Headphones className="w-6 h-6" />;
      case 'wrench':
        return <Wrench className="w-6 h-6" />;
      case 'zap':
        return <Zap className="w-6 h-6" />;
      case 'package':
        return <Package className="w-6 h-6" />;
      default:
        return <ShieldCheck className="w-6 h-6" />;
    }
  };

  const features: FooterFeatureItem[] = settings.footerFeatures || [
    { id: 'f1', title: 'ضمانت ۱۰۰٪ اصالت قطعه', description: 'تضمین قطعات اصلی شرکتی با هولوگرام لیزری', icon: 'ShieldCheck' },
    { id: 'f2', title: 'ارسال اکسپرس و بیمه‌شده', description: 'تهران ۲ ساعته، شهرستان‌ها با تیپاکس و پست پیشتاز', icon: 'Truck' },
    { id: 'f3', title: '۷ روز مهلت تست و مرجوعی', description: 'بازگشت بدون قید و شرط در صورت عدم تطبیق فیتمنت', icon: 'Clock' },
    { id: 'f4', title: 'مشاوره تخصصی قبل از خرید', description: 'بررسی دقیق شماره شاسی VIN توسط مهندسین فنی', icon: 'Headphones' }
  ];

  const baseColumns = settings.footerColumns || [
    {
      id: 'fcol-1',
      title: 'حساب کاربری',
      links: [
        { id: 'l1', title: 'داشبورد حساب من', url: 'account' },
        { id: 'l2', title: 'سفارش‌های من', url: 'account:orders' },
        { id: 'l3', title: 'گاراژ خودروهای من', url: 'account:garage' },
        { id: 'l4', title: 'پیگیری سفارش', url: 'tracking' }
      ]
    },
    {
      id: 'fcol-2',
      title: 'کاتالوگ',
      links: [
        { id: 'l5', title: 'فروشگاه قطعات', url: 'shop' },
        { id: 'l6', title: 'خرید بر اساس خودرو', url: 'shop' },
        { id: 'l7', title: 'محصولات پرفروش', url: 'shop:bestseller' },
        { id: 'l8', title: 'سرویس دوره‌ای', url: 'shop:maintenance' }
      ]
    },
    {
      id: 'fcol-3',
      title: 'راهنما',
      links: [
        { id: 'l9', title: 'درباره ما', url: 'page:about' },
        { id: 'l10', title: 'مقالات و آموزش‌ها', url: 'blog' },
        { id: 'l11', title: 'ضمانت و بازگشت کالا', url: 'page:guarantee' },
        { id: 'l12', title: 'استعلام قطعه', url: 'part-request' }
      ]
    }
  ];

  const columns = baseColumns.length >= 3
    ? baseColumns
    : [
        ...baseColumns,
        {
          id: 'fcol-mobex-help',
          title: 'راهنما',
          links: [
            { id: 'l-mobex-1', title: 'درباره ما', url: 'page:about' },
            { id: 'l-mobex-2', title: 'مقالات و آموزش‌ها', url: 'blog' },
            { id: 'l-mobex-3', title: 'ضمانت و بازگشت کالا', url: 'page:guarantee' },
            { id: 'l-mobex-4', title: 'استعلام قطعه', url: 'part-request' }
          ]
        }
      ];

  const badges: FooterBadgeItem[] = settings.footerBadges || [];
  const bottomLinks = settings.footerBottomLinks || [
    { id: 'footer-bottom-terms', title: 'قوانین', url: 'page:terms' },
    { id: 'footer-bottom-privacy', title: 'حریم خصوصی', url: 'page:privacy' },
    { id: 'footer-bottom-payment', title: 'پرداخت امن', url: 'page:payment' }
  ];

  if (settings.layoutPreset === 'marketplace-rtl' || settings.layoutPreset === 'atelier-rtl') {
    const footerRows = (value?: number) => value && value > 0 ? `repeat(${value}, minmax(0, auto))` : 'none';
    const footerStyle = {
      ['--footer-cols-desktop' as any]: settings.footerGridColumnsDesktop || 5,
      ['--footer-cols-tablet' as any]: settings.footerGridColumnsTablet || 2,
      ['--footer-cols-mobile' as any]: settings.footerGridColumnsMobile || 2,
      ['--footer-rows-desktop' as any]: footerRows(settings.footerGridRowsDesktop || 1),
      ['--footer-rows-tablet' as any]: footerRows(settings.footerGridRowsTablet),
      ['--footer-rows-mobile' as any]: footerRows(settings.footerGridRowsMobile),
      ['--footer-logo-width' as any]: `${settings.footerLogoWidthPx || 160}px`,
      ['--footer-heading-size' as any]: `${settings.footerHeadingFontSizePx || 14}px`,
      ['--footer-text-size' as any]: `${settings.footerTextFontSizePx || 12}px`,
      ['--footer-padding-top' as any]: `${settings.footerPaddingTopPx ?? 42}px`,
      ['--footer-padding-bottom' as any]: `${settings.footerPaddingBottomPx ?? 34}px`,
      ['--footer-bg' as any]: settings.footerBgColor || '#111111',
      ['--footer-text' as any]: settings.footerTextColor || '#b9c0c7',
      ['--footer-heading' as any]: settings.footerHeadingColor || '#ffffff'
    } as React.CSSProperties;
    const footerLogo = settings.footerLogoUrl || '';

    return (
      <footer className="marketplace-ref-footer" dir="rtl" style={footerStyle} data-bottom-align={settings.footerBottomAlign || 'center'}>
        <div className="marketplace-ref-footer-main marketplace-ref-container">
          <div className="marketplace-ref-footer-about">
            <button type="button" className="marketplace-ref-footer-logo" onClick={() => onNavigate('home')}>
              {footerLogo ? (
                <img src={footerLogo} alt={settings.siteTitle} />
              ) : (
                <span>{settings.footerAboutTitle || settings.siteTitle || 'فروشگاه'}</span>
              )}
            </button>
            <p>{settings.footerAboutText || 'فروشگاه تخصصی قطعات یدکی خودرو با تمرکز بر اصالت، تطبیق دقیق قطعه و ارسال مطمئن.'}</p>
            <div className="marketplace-ref-newsletter">
              <input type="email" placeholder={settings.footerNewsletterPlaceholder || 'ایمیل خود را وارد کنید'} aria-label="ایمیل خبرنامه" />
              <button type="button" aria-label="عضویت در خبرنامه">←</button>
            </div>
          </div>

          {columns.map(column => (
            <div key={column.id} className="marketplace-ref-footer-col">
              <h4>{column.title}</h4>
              {column.links.map(link => (
                <button key={link.id} type="button" onClick={() => handleLinkClick(link.url)}>{link.title}</button>
              ))}
            </div>
          ))}

          <div className="marketplace-ref-footer-contact">
            <h4>{settings.footerContactTitle || 'ارتباط با ما'}</h4>
            {settings.address && <p><MapPin className="w-4 h-4" /><span>{settings.address}</span></p>}
            {settings.contactPhone && <a href={`tel:${settings.contactPhone}`}><Phone className="w-4 h-4" /><span>{settings.contactPhone}</span></a>}
            {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}><Mail className="w-4 h-4" /><span>{settings.supportEmail}</span></a>}
            <small>{settings.footerContactSubtitle || 'پشتیبانی و مشاوره تخصصی پیش از خرید'}</small>
          </div>
        </div>

        <div className="marketplace-ref-footer-bottom">
          <div className="marketplace-ref-container">
            <span className="marketplace-ref-footer-copyright">{settings.footerCopyrightText || `© ${new Date().getFullYear()} تمامی حقوق محفوظ است.`}</span>
            <div className="marketplace-ref-footer-bottom-links">
              {bottomLinks.map(link => (
                <button key={link.id} type="button" onClick={() => handleLinkClick(link.url)}>{link.title}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20 pt-16 pb-24 md:pb-12 border-t-4 border-red-600 relative">
      
      {/* Admin Fast Edit Shortcut Bar */}
      {adminAuth.isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-neutral-800/90 border border-amber-500/40 rounded-2xl p-3 px-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>حالت ویرایش فوتر فعال است: تمام اجزا، لینک‌ها، نمادها و اینماد از پنل قابل ویرایش‌اند.</span>
            </div>
            <button
              onClick={() => onNavigate('admin', 'footer')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <span>تنظیمات فوتر و نمادها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        
        {/* =========================================================================
            1. CORE VALUE PROPS / FEATURES (EDITABLE, ADDABLE, REMOVABLE)
        ========================================================================= */}
        {settings.footerShowFeatures !== false && features.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(features.length, 4)} gap-6 pb-12 border-b border-neutral-800`}>
            {features.map((feat) => (
              <div 
                key={feat.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 shadow-inner">
                  {getFeatureIcon(feat.icon)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
            2. MAIN FOOTER CONTENT & COLUMNS
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-b border-neutral-800 text-xs">
          
          {/* Col 1: About & Contact Info (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteTitle} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                  <Wrench className="w-5 h-5" />
                </div>
              )}
              <span className="font-black text-lg text-white">
                {settings.footerAboutTitle || settings.siteTitle || 'فروشگاه'}
              </span>
            </div>

            <p className="text-neutral-400 leading-relaxed text-xs text-justify">
              {settings.footerAboutText || 'مرجع تخصصی قطعات یدکی و لوازم فابریک خودروهای چینی با تضمین اصالت و سلامت فیزیکی قطعه.'}
            </p>

            <div className="space-y-2.5 text-neutral-400 pt-2 border-t border-neutral-800/80">
              {settings.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <span>تلفن تماس: <a href={`tel:${settings.contactPhone}`} className="text-white hover:text-red-400 font-mono font-bold mr-1">{settings.contactPhone}</a></span>
                </div>
              )}
              {settings.supportEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500 shrink-0" />
                  <span>ایمیل پشتیبانی: <a href={`mailto:${settings.supportEmail}`} className="text-white hover:text-red-400 font-mono mr-1">{settings.supportEmail}</a></span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Car Brands (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-neutral-800 inline-block">
              برندهای خودرو
            </h4>
            <ul className="space-y-2 text-neutral-400">
              {brands.slice(0, 6).map(b => (
                <li key={b.id}>
                  <button 
                    onClick={() => onNavigate('car-brand', b.slug)}
                    className="hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer text-right group"
                  >
                    <ChevronLeft className="w-3 h-3 text-neutral-600 group-hover:text-red-500 group-hover:-translate-x-0.5 transition-all" />
                    <span>لوازم یدکی {b.nameFa}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Main Categories (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-white text-sm pb-1 border-b border-neutral-800 inline-block">
              دسته‌بندی‌های قطعات
            </h4>
            <ul className="space-y-2 text-neutral-400">
              {categories.slice(0, 6).map(c => (
                <li key={c.id}>
                  <button 
                    onClick={() => onNavigate('category', c.slug)}
                    className="hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer text-right group"
                  >
                    <ChevronLeft className="w-3 h-3 text-neutral-600 group-hover:text-red-500 group-hover:-translate-x-0.5 transition-all" />
                    <span>{c.nameFa}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Columns from SiteSettings (4 cols total) */}
          {columns.map(col => (
            <div key={col.id} className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-white text-sm pb-1 border-b border-neutral-800 inline-block">
                {col.title}
              </h4>
              <ul className="space-y-2 text-neutral-400">
                {col.links.map(link => (
                  <li key={link.id}>
                    <button 
                      onClick={() => handleLinkClick(link.url)}
                      className="hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer text-right group"
                    >
                      <ChevronLeft className="w-3 h-3 text-neutral-600 group-hover:text-red-500 group-hover:-translate-x-0.5 transition-all" />
                      <span>{link.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* =========================================================================
            3. ENAMAD, ELECTRONIC TRUST & BANKING BADGES SECTION
        ========================================================================= */}
        {settings.footerShowBadges !== false && (
          <div className="py-8 border-b border-neutral-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="text-center md:text-right space-y-1">
                <h4 className="font-black text-sm text-white flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>مجوزها، نمادهای اعتماد و درگاه‌های پرداخت امن</span>
                </h4>
                <p className="text-xs text-neutral-400">
                  کلیه تراکنش‌های این سامانه توسط پروتکل SSL رمزنگاری شده و زیر نظر مراجع نظارتی انجام می‌پذیرد.
                </p>
              </div>

              {/* Badges List & Custom HTML Embeds */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {badges.map(b => (
                  <div key={b.id} className="transition-transform hover:-translate-y-1">
                    {b.htmlCode ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: b.htmlCode }} 
                        className="cursor-pointer"
                        onClick={() => {
                          if (b.linkUrl && b.linkUrl !== '#') {
                            window.open(b.linkUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      />
                    ) : (
                      <a
                        href={b.linkUrl || '#'}
                        target={b.linkUrl && b.linkUrl !== '#' ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="block p-3 bg-neutral-800/80 hover:bg-neutral-800 rounded-2xl border border-neutral-700 hover:border-red-500/60 transition-all text-center group"
                        title={b.title}
                      >
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title} className="h-14 w-auto object-contain mx-auto" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-neutral-700/60 flex items-center justify-center text-white">
                            <ShieldCheck className="w-7 h-7 text-emerald-400" />
                          </div>
                        )}
                        <span className="block text-[10px] font-bold text-neutral-300 mt-1.5 group-hover:text-white">
                          {b.title}
                        </span>
                      </a>
                    )}
                  </div>
                ))}

                {/* Additional Custom Raw HTML Embed (if configured by admin) */}
                {settings.footerCustomHtml && (
                  <div 
                    dangerouslySetInnerHTML={{ __html: settings.footerCustomHtml }} 
                    className="footer-custom-html-block"
                  />
                )}
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            4. BOTTOM COPYRIGHT & STANDARDS
        ========================================================================= */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>
            {settings.footerCopyrightText || `© ${new Date().toLocaleDateString('fa-IR')} ${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.`}
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>پایگاه داده قطعات OEM فعال</span>
            </span>
            <span>·</span>
            <span>ارسال با ضمانت بیمه مرسوله</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
