import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { HeroSection } from './HeroSection';
import { BannerSlider } from './BannerSlider';
import { ProductCard } from '../product/ProductCard';
import { LiveSectionModal } from '../common/LiveSectionModal';
import { 
  Car, 
  Layers, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  ArrowLeft, 
  ShieldCheck, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  ChevronDown,
  Filter,
  Wrench,
  Thermometer,
  Cpu,
  Disc,
  Cog,
  Zap,
  Sun,
  Edit3,
  MonitorCheck
} from 'lucide-react';
import { ARTICLES } from '../../data/mockData';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenVehicleModal }) => {
  const { 
    products, 
    brands, 
    categories, 
    selectedVehicle, 
    clearSelectedVehicle,
    pages,
    isLiveEditActive,
    setIsLiveEditActive,
    adminAuth,
    showToast
  } = useStore();

  const [activeEditingSectionId, setActiveEditingSectionId] = useState<string | null>(null);

  const homePage = pages.find(p => p.slug === 'home');
  const getSection = (secId: string) => homePage?.sections.find(s => s.id === secId);

  const heroSec = getSection('sec-hero');
  const brandsSec = getSection('sec-brands');
  const categoriesSec = getSection('sec-categories');
  const trustSec = getSection('sec-trust');
  const articlesSec = getSection('sec-articles');

  // Category Icon helper
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'cooling': return <Thermometer className="w-6 h-6 text-blue-600" />;
      case 'engine': return <Cpu className="w-6 h-6 text-red-600" />;
      case 'timing': return <Clock className="w-6 h-6 text-amber-600" />;
      case 'brakes': return <Disc className="w-6 h-6 text-red-500" />;
      case 'suspension': return <Wrench className="w-6 h-6 text-emerald-600" />;
      case 'transmission': return <Cog className="w-6 h-6 text-indigo-600" />;
      case 'turbo': return <Zap className="w-6 h-6 text-orange-500" />;
      case 'lighting': return <Sun className="w-6 h-6 text-yellow-500" />;
      default: return <Layers className="w-6 h-6 text-neutral-600" />;
    }
  };

  // Filtered products for active car
  const compatibleProducts = selectedVehicle 
    ? products.filter(p => p.fitments.some(f => 
        f.modelId === selectedVehicle.modelId || 
        f.modelId === 'all' ||
        selectedVehicle.modelName.toLowerCase().includes(f.modelName.toLowerCase())
      ))
    : products;

  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const maintenanceParts = products.filter(p => p.isMaintenancePart).slice(0, 4);
  const featuredParts = products.filter(p => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-16 pb-12">
      {/* Admin Live Section Edit Bar */}
      {adminAuth.isAuthenticated && (
        <div className="bg-neutral-900 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-neutral-800 shadow-inner sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">حالت مدیریت سایت فعال است ({adminAuth.currentUser?.fullName || adminAuth.username})</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsLiveEditActive(!isLiveEditActive);
                showToast(
                  !isLiveEditActive
                    ? 'حالت ویرایش زنده سکشن‌ها فعال شد. هم‌اکنون نشانگر ویرایش روی بخش‌های صفحه نمایش داده می‌شود.'
                    : 'حالت ویرایش زنده غیرفعال شد.',
                  'info'
                );
              }}
              className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                isLiveEditActive 
                  ? 'bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400' 
                  : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isLiveEditActive ? 'حالت ویرایش زنده سکشن‌ها: فعال' : 'فعال‌سازی ویرایش سکشن‌ها در برگه'}</span>
            </button>
            <button
              onClick={() => onNavigate('admin')}
              className="text-red-400 hover:text-red-300 font-bold hover:underline"
            >
              پنل مدیریت کامل ←
            </button>
          </div>
        </div>
      )}

      {/* 1. Hero & Instant Vehicle Finder */}
      <div className="relative group">
        {isLiveEditActive && (
          <button
            onClick={() => setActiveEditingSectionId('sec-hero')}
            className="absolute top-4 left-4 z-30 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xl border-2 border-white animate-pulse"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش این سکشن (هدر اصلی)</span>
          </button>
        )}
        <HeroSection 
          onFindParts={() => onNavigate('shop')}
          onSelectModel={(modelId) => onNavigate('car-model', modelId)}
        />
      </div>

      {/* Dynamic Promotional Sliders & Banners */}
      <BannerSlider onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        
        {/* 2. Brand Grid: "خرید بر اساس برند خودرو" */}
        <section className={`space-y-6 relative ${isLiveEditActive ? 'ring-2 ring-dashed ring-amber-400 p-4 rounded-3xl' : ''}`}>
          {isLiveEditActive && (
            <button
              onClick={() => setActiveEditingSectionId('sec-brands')}
              className="absolute -top-3 left-4 z-20 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش بخش برندها</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Car className="w-6 h-6 text-red-600" />
                <span>{brandsSec?.title || 'خرید قطعات بر اساس برند خودرو'}</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                {brandsSec?.subtitle || 'برند خودروی خود را انتخاب کنید تا به صفحه اختصاصی مدل‌ها و قطعات آن هدایت شوید'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>مشاهده همه خودروها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => onNavigate('car-brand', brand.slug)}
                className="group p-4 bg-white rounded-2xl border border-neutral-200 hover:border-red-500 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center text-neutral-800"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 p-1.5 border border-neutral-200 group-hover:scale-105 transition-transform mb-3">
                  <img 
                    src={brand.logo} 
                    alt={brand.nameFa} 
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-bold text-xs md:text-sm group-hover:text-red-600 transition-colors">
                  {brand.nameFa}
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {brand.nameEn}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Main Part Categories Grid */}
        <section className={`space-y-6 relative ${isLiveEditActive ? 'ring-2 ring-dashed ring-amber-400 p-4 rounded-3xl' : ''}`}>
          {isLiveEditActive && (
            <button
              onClick={() => setActiveEditingSectionId('sec-categories')}
              className="absolute -top-3 left-4 z-20 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش بخش دسته‌بندی‌ها</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-red-600" />
                <span>{categoriesSec?.title || 'دسته‌بندی‌های تخصصی قطعات'}</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                {categoriesSec?.subtitle || 'دسترسی سریع به سیستم‌های فنی، موتوری، برقی و جلوبندی'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>مشاهده همه دسته‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('category', cat.slug)}
                className="group p-4 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all text-right flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 group-hover:text-red-600 transition-colors mb-1">
                    {cat.nameFa}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                    {cat.subcategories?.map(s => s.nameFa).slice(0, 2).join('، ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Active Vehicle Matched Parts (If Car Selected) */}
        {selectedVehicle && (
          <section className="p-6 md:p-8 rounded-3xl bg-neutral-900 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                        فیلتر فیتمنت فعال
                      </span>
                      <span className="text-xs text-neutral-400">قطعات ۱۰۰٪ سازگار با خودروی شما:</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white mt-1">
                      {selectedVehicle.modelName} (مدل {selectedVehicle.year})
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onOpenVehicleModal}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl border border-neutral-700 transition-colors"
                  >
                    تغییر خودرو
                  </button>
                  <button
                    onClick={clearSelectedVehicle}
                    className="text-xs text-neutral-400 hover:text-white underline"
                  >
                    مشاهده بدون فیلتر
                  </button>
                </div>
              </div>

              {/* Compatible Parts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {compatibleProducts.slice(0, 4).map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onViewDetails={(id) => onNavigate('product', id)} 
                  />
                ))}
              </div>

              {compatibleProducts.length === 0 && (
                <div className="text-center py-10 bg-neutral-800/40 rounded-2xl border border-neutral-700">
                  <p className="text-sm text-neutral-400 mb-3">هنوز قطعه‌ای به طور اختصاصی برای این مدل بارگذاری نشده است.</p>
                  <button
                    onClick={() => onNavigate('part-request')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
                  >
                    استعلام قطعه این خودرو
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. Best Sellers Section (پرفروش‌ترین قطعات) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-red-600" />
                <span>پرفروش‌ترین قطعات بازار خودروهای چینی</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                قطعات دارای بیشترین تقاضا با گارانتی اصالت شرکتی
              </p>
            </div>
            <button 
              onClick={() => onNavigate('shop', 'bestseller')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestSellers.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onViewDetails={(id) => onNavigate('product', id)} 
              />
            ))}
          </div>
        </section>

        {/* 6. Periodic Maintenance Parts (فیلترها و سرویس دوره‌ای) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-red-600" />
                <span>قطعات مصرفی و سرویس دوره‌ای</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                فیلتر روغن، لنت ترمز، شمع سوزنی، ضدیخ و تسمه‌های استاندارد
              </p>
            </div>
            <button 
              onClick={() => onNavigate('shop', 'maintenance')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>مشاهده پکیج‌های سرویس</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {maintenanceParts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onViewDetails={(id) => onNavigate('product', id)} 
              />
            ))}
          </div>
        </section>

        {/* 7. Special Banner: "قطعه خود را نیافتید؟" */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-red-600 to-red-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-right">
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
              سفارش اختصاصی و واردات
            </span>
            <h3 className="text-2xl md:text-3xl font-black">
              قطعه موردنظرتان را در سایت پیدا نکردید؟
            </h3>
            <p className="text-xs md:text-sm text-red-100 max-w-xl">
              تیم بازرگانی چین‌پارت هر نوع قطعه بدنه، سنسورهای کمیاب یا متعلقات موتوری خودروهای چینی را مستقیماً بر اساس شماره شاسی (VIN) خودروی شما از کارخانه استعلام و تامین می‌کند.
            </p>
          </div>

          <button
            onClick={() => onNavigate('part-request')}
            className="px-6 py-3.5 bg-white hover:bg-neutral-100 text-red-700 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95 shrink-0 flex items-center gap-2"
          >
            <span>ثبت فرم استعلام فوری قطعه</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </section>

        {/* 8. Technical Blog & Educational Content */}
        <section className={`space-y-6 relative ${isLiveEditActive ? 'ring-2 ring-dashed ring-amber-400 p-4 rounded-3xl' : ''}`}>
          {isLiveEditActive && (
            <button
              onClick={() => setActiveEditingSectionId('sec-articles')}
              className="absolute -top-3 left-4 z-20 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش بخش مقالات</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-red-600" />
                <span>{articlesSec?.title || 'مقالات تخصصی و راهنمای نگهداری خودروهای چینی'}</span>
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                {articlesSec?.subtitle || 'آموزش‌های کاربردی رفع عیب، انتخاب روغن، علائم خرابی واترپمپ و کیت تایم'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('blog')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>مشاهده وبلاگ</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARTICLES.map((article) => (
              <div 
                key={article.id}
                onClick={() => onNavigate('article', article.id)}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-neutral-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/9 overflow-hidden bg-neutral-100 relative">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-neutral-900/80 text-white px-2 py-1 rounded-md backdrop-blur-xs">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-2">
                      <span>{article.date}</span>
                      <span>·</span>
                      <span>{article.readTimeMinutes} دقیقه مطالعه</span>
                    </div>

                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-neutral-100 flex items-center justify-between text-xs text-red-600 font-bold">
                  <span>مطالعه مقاله و مشاهده قطعات مرتبط</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section className="bg-white rounded-3xl p-8 border border-neutral-200 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-neutral-900">سؤالات متداول خریداران قطعات خودرو</h2>
            <p className="text-xs text-neutral-500">پاسخ سریع به پرتکرارترین سؤالات درباره اصالت، ارسال و ضمانت قطعات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-600" />
                چگونه مطمئن شوم قطعه با خودروی من سازگار است؟
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                با انتخاب مدل و سال خودرو از بخش «خودروی من»، سیستم فیتمنت چین‌پارت تنها قطعات سازگار را نمایش می‌دهد. همچنین می‌توانید شماره شاسی (VIN) خودرو را برای کارشناسان ما ارسال کنید تا استعلام ۱۰۰٪ نهایی انجام شود.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-600" />
                تفاوت قطعه شرکتی (Genuine) با وارداتی درجه یک چیست؟
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                قطعات شرکتی دقیقاً همان قطعه‌ای هستند که در خط تولید کارخانه کرمان موتور یا مدیران خودرو نصب شده و دارای هولوگرام رسمی می‌باشند. قطعات OEM توسط کارخانه‌های معتبر بین‌المللی (نظیر بوش یا های‌کیو) تولید می‌شوند.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-600" />
                فرایند مرجوعی کالا در صورت عدم تطبیق چگونه است؟
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                تمامی سفارش‌ها دارای ۷ روز ضمانت بازگشت وجه هستند. اگر قطعه به هر دلیلی با خودرو مطابقت نداشته باشد، بدون کسر هزینه تعویض یا مرجوع خواهد شد.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-600" />
                ارسال به شهرستان‌ها چند روز زمان می‌برد؟
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                ارسال در شهر تهران به صورت پیک فوری ۲ ساعته انجام می‌شود و سفارش‌های شهرستان‌ها با تیپاکس هوایی و پست پیشتاز ظرف ۲۴ تا ۴۸ ساعت کاری تحویل می‌گردند.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* In-Place Live Section Editor Modal */}
      {activeEditingSectionId && (
        <LiveSectionModal
          pageSlug="home"
          sectionId={activeEditingSectionId}
          isOpen={!!activeEditingSectionId}
          onClose={() => setActiveEditingSectionId(null)}
        />
      )}
    </div>
  );
};
