import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { checkProductFitment, formatToman, getGradeInfo } from '../../utils/formatters';
import { ProductCard } from './ProductCard';
import { 
  ShoppingBag, 
  Heart, 
  ArrowRightLeft, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Car, 
  Plus, 
  Minus, 
  Share2, 
  HelpCircle, 
  ArrowRight,
  Info,
  Bell,
  Check,
  ChevronLeft,
  Wrench,
  AlertCircle,
  Phone
} from 'lucide-react';
import { ShareButton } from '../common/ShareButton';
import { RichTextContent } from '../common/RichTextContent';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
  onOpenCartDrawer: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
  onOpenVehicleModal,
  onOpenCartDrawer
}) => {
  const { 
    products, 
    selectedVehicle, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    addToCompare, 
    isInCompare,
    subscribeToStockAlert,
    showToast,
    settings
  } = useStore();

  const product = products.find(p => p.id === productId || p.slug === productId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'fitment' | 'symptoms' | 'install' | 'fake'>('specs');
  const [stockPhone, setStockPhone] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">قطعه موردنظر یافت نشد!</h2>
        <p className="text-xs text-neutral-500 mb-6">احتمال دارد این کالا حذف شده باشد یا آدرس اشتباه وارد شده باشد.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          مشاهده فهرست قطعات
        </button>
      </div>
    );
  }

  const fitment = checkProductFitment(product, selectedVehicle);
  const gradeInfo = getGradeInfo(product.grade);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  // Cross-sell & Related items
  const complementProducts = product.complementPartIds 
    ? products.filter(p => product.complementPartIds?.includes(p.id)) 
    : [];

  const relatedProductsCount = Math.max(1, Math.min(50, Number(settings.relatedProductsCount || 4)));
  const relatedProducts = products.filter(p => 
    p.id !== product.id && 
    (p.categorySlug === product.categorySlug || p.fitments.some(f => product.fitments.some(pf => pf.modelId === f.modelId)))
  ).slice(0, relatedProductsCount);

  const handleStockSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockPhone || stockPhone.length < 10) {
      showToast('شماره تلفن معتبر وارد فرمایید', 'error');
      return;
    }
    subscribeToStockAlert(product.id, stockPhone);
    setShowStockModal(false);
    setStockPhone('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Breadcrumb Navigation & Direct Share */}
      <div className="product-breadcrumb-row flex items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <nav className="site-breadcrumb flex items-center gap-2 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap">
          <button onClick={() => onNavigate('home')} className="hover:text-red-600 transition-colors">
            خانه
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('shop')} className="hover:text-red-600 transition-colors">
            فروشگاه قطعات
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('category', product.categorySlug)} className="hover:text-red-600 transition-colors">
            {product.categorySlug}
          </button>
          <span>/</span>
          <span className="text-neutral-900 font-bold truncate max-w-xs">{product.nameFa}</span>
        </nav>

        <ShareButton
          view="product"
          param={product.id}
          variant="button"
          label="اشتراک‌گذاری قطعه"
          className="shrink-0 text-xs"
        />
      </div>

      {/* Main Top Grid: Gallery & Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col (Gallery) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square bg-white rounded-3xl border border-neutral-200 overflow-hidden p-4 relative flex items-center justify-center shadow-xs">
            <img 
              src={product.images[activeImageIndex] || product.images[0]} 
              alt={product.seo?.images?.[product.images[activeImageIndex] || product.images[0]]?.alt || product.nameFa}
              title={product.seo?.images?.[product.images[activeImageIndex] || product.images[0]]?.title || product.nameFa}
              className="max-h-full max-w-full object-contain"
            />

            <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-xs ${gradeInfo.bgClass}`}>
              {gradeInfo.label}
            </span>

            {/* Quick Action Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors ${
                  isInWishlist(product.id)
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white/90 text-neutral-600 border-neutral-200 hover:bg-white'
                }`}
                title="علاقه‌مندی"
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
              </button>

              <button
                onClick={() => addToCompare(product)}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors ${
                  isInCompare(product.id)
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white/90 text-neutral-600 border-neutral-200 hover:bg-white'
                }`}
                title="مقایسه فنی"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>

              <ShareButton
                view="product"
                param={product.id}
                variant="icon"
                className="bg-white/90 text-neutral-600 border-neutral-200 hover:bg-white backdrop-blur-md"
              />
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white ${
                    activeImageIndex === idx ? 'border-red-600 ring-2 ring-red-600/20' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <img src={img} alt={product.seo?.images?.[img]?.alt || `${product.nameFa} - تصویر ${idx + 1}`} title={product.seo?.images?.[img]?.title || product.nameFa} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Packaging & Guarantee box */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2 text-neutral-600">
            <div className="flex items-center gap-2 font-bold text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>گارانتی و خدمات پس از فروش:</span>
            </div>
            <p className="leading-relaxed">
              {product.warrantyDescription} ({product.warrantyMonths} ماه ضمانت رسمی شرکتی)
            </p>
          </div>
        </div>

        {/* Right Col: Product Information & Purchase Box */}
        <div className="lg:col-span-7 space-y-6 text-right">
          
          {/* Header & Identifiers */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-neutral-500">
              <span className="font-bold text-neutral-800">{product.brandManufacturer}</span>
              <span>·</span>
              <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700" dir="ltr">OEM: {product.oemNumber}</span>
              {product.partNumber && <><span>·</span><span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700" dir="ltr">Part No: {product.partNumber}</span></>}
              {product.sku && <><span>·</span><span className="font-mono text-neutral-400" dir="ltr">SKU: {product.sku}</span></>}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 leading-snug">
              {product.nameFa}
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-1">{product.nameEn}</p>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-neutral-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-700">{product.rating} از ۵</span>
              <span className="text-xs text-neutral-400">({product.reviewsCount} دیدگاه خریداران)</span>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <div className="mt-3.5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 leading-relaxed font-medium">
                <span className="font-bold text-neutral-900 block mb-1">خلاصه کاربردی و نکات کلیدی قطعه:</span>
                <RichTextContent content={product.shortDescription} />
              </div>
            )}
          </div>

          {/* CRITICAL FEATURE: Fitment Verification Box (Master Prompt #15) */}
          <div className="p-4 sm:p-5 rounded-2xl border transition-all duration-300">
            {selectedVehicle ? (
              fitment.isCompatible ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">
                        ✅ این قطعه برای {selectedVehicle.modelName} (مدل {selectedVehicle.year}) مناسب است.
                      </h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        تطبیق فیتمنت کارخانه بررسی شد و پارت‌نامبر ۱۰۰٪ فابریک پیشرانه شما می‌باشد.
                      </p>
                      {fitment.matchedFitmentNotes && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded-lg mt-2 font-mono">
                          یادداشت سازگاری: {fitment.matchedFitmentNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={onOpenVehicleModal}
                    className="text-xs text-emerald-800 font-bold underline hover:text-emerald-950 shrink-0"
                  >
                    تغییر خودرو
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        ⚠️ سازگاری این قطعه با {selectedVehicle.modelName} تأیید نشده است.
                      </h4>
                      <p className="text-xs text-amber-700 mt-1">
                        این قطعه برای مدل یا کد موتور دیگری طراحی شده است. لطفاً پیش از ثبت سفارش، لیست خودروهای سازگار زیر را چک فرمایید.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={onOpenVehicleModal}
                    className="text-xs text-amber-800 font-bold underline hover:text-amber-950 shrink-0"
                  >
                    انتخاب خودرو دیگر
                  </button>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Car className="w-6 h-6 text-neutral-600" />
                  <div>
                    <h4 className="font-bold text-neutral-800 text-sm">خودروی خود را برای بررسی دقیق سازگاری انتخاب کنید</h4>
                    <p className="text-xs text-neutral-500">جلوگیری از خرید قطعه اشتباه با انتخاب سال و مدل</p>
                  </div>
                </div>
                <button
                  onClick={onOpenVehicleModal}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
                >
                  بررسی سازگاری
                </button>
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart Box */}
          <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-neutral-400 block mb-1">قیمت نهایی مصرف‌کننده:</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {Number(product.discountPrice || product.price) > 0 ? formatToman(product.discountPrice || product.price) : 'استعلام قیمت'}
                  </span>
                  {hasDiscount && Number(product.price) > 0 && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatToman(product.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock status badge */}
              <div className="text-left">
                {product.stockStatus === 'in_stock' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    موجود در انبار ({product.stock} عدد)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    موجودی محدود ({product.stock} عدد)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              {/* Quantity Adjuster */}
              <div className={`${Number(product.discountPrice || product.price) > 0 ? 'sm:col-span-4' : 'hidden'} flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart button */}
              {!(Number(product.discountPrice || product.price) > 0) ? (
                settings.contactWhenNoPrice !== false && settings.contactPhone ? (
                  <a href={`tel:${settings.contactPhone.replace(/[^0-9+]/g, '')}`}
                    className="sm:col-span-8 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" /><span>تماس برای استعلام قیمت {settings.contactPhone}</span>
                  </a>
                ) : <span className="sm:col-span-8 h-12 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center text-sm">قیمت ثبت نشده؛ {settings.contactPhone || 'شماره تماس در تنظیمات وارد نشده است'}</span>
              ) : (
                <button onClick={() => { addToCart(product, quantity, selectedVehicle); onOpenCartDrawer(); }}
                  className="sm:col-span-8 h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-98">
                  <ShoppingBag className="w-5 h-5" /><span>افزودن به سبد خرید</span>
                </button>
              )}
            </div>

            {/* Notify Me If Out of Stock */}
            {product.stock <= 2 && (
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">موجودی رو به اتمام است</span>
                <button
                  onClick={() => setShowStockModal(true)}
                  className="text-red-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <Bell className="w-3.5 h-3.5" />
                  اطلاع‌رسانی پیامکی شارژ مجدد
                </button>
              </div>
            )}
          </div>

          {/* Quick Specifications Highlights */}
          <div className="product-quick-specs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="product-quick-spec-card p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block text-[10px]">محل نصب:</span>
              <span className="font-bold text-neutral-800 block mt-1">{product.placement || '—'}</span>
            </div>
            <div className="product-quick-spec-card p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block text-[10px]">کشور سازنده:</span>
              <span className="font-bold text-neutral-800 block mt-1">{product.countryOfOrigin || '—'}</span>
            </div>
            <div className="product-quick-spec-card p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block text-[10px]">وزن و ابعاد:</span>
              <span className="font-bold text-neutral-800 block mt-1">{product.weightKg ? `${product.weightKg} کیلوگرم` : '—'}{product.dimensionsCm ? ` — ${product.dimensionsCm}` : ''}</span>
            </div>
            <div className="product-quick-spec-card p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-neutral-400 block text-[10px]">گرید کیفیتی:</span>
              <span className="font-bold text-neutral-800 block mt-1">{gradeInfo.shortLabel}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Cross-Sell & Complementary Products (Master Prompt #20) */}
      {complementProducts.length > 0 && (
        <section className="p-6 rounded-3xl bg-neutral-100 border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-base text-neutral-900">
                قطعات مکمل و توصیه‌شده همراه این قطعه (Cross-Sell)
              </h3>
            </div>
            <span className="text-xs text-neutral-500">برای تعویض استاندارد و عدم دوباره‌کاری پیشنهاد می‌شود:</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {complementProducts.map(comp => (
              <div 
                key={comp.id} 
                className="p-4 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <img src={comp.images[0]} alt={comp.nameFa} className="w-14 h-14 object-cover rounded-xl border" />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 line-clamp-1">{comp.nameFa}</h4>
                    <span className="text-[10px] text-neutral-400 font-mono">OEM: {comp.oemNumber}</span>
                    <div className="font-bold text-xs text-neutral-900 mt-1">
                      {formatToman(comp.discountPrice || comp.price)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(comp, 1, selectedVehicle)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  افزودن سریع
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed Technical Tabs */}
      <section className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Tab Headers */}
        <div className="product-detail-tabs flex border-b border-neutral-200 bg-neutral-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'specs' 
                ? 'border-red-600 text-red-600 bg-white' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            مشخصات فنی و پارت‌نامبر
          </button>

          <button
            onClick={() => setActiveTab('fitment')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'fitment' 
                ? 'border-red-600 text-red-600 bg-white' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>خودروهای سازگار (Fitment)</span>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-full font-mono">
              {product.fitments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('symptoms')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'symptoms' 
                ? 'border-red-600 text-red-600 bg-white' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            علائم خرابی و دوره تعویض
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'install' 
                ? 'border-red-600 text-red-600 bg-white' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            نکات مهم نصب
          </button>

          <button
            onClick={() => setActiveTab('fake')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'fake' 
                ? 'border-red-600 text-red-600 bg-white' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            تشخیص نمونه اصلی از تقلبی
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          
          {/* Tab 1: Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="prose text-xs md:text-sm text-neutral-600 leading-relaxed max-w-none">
                <RichTextContent content={product.description} />
              </div>

              <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200 text-xs">
                <div className="p-3 bg-neutral-50 font-bold text-neutral-900">
                  جدول مشخصات و پارامترهای فنی کارخانه
                </div>
                {Object.entries(product.technicalSpecs).map(([key, val]) => (
                  <div key={key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-neutral-50/50">
                    <span className="text-neutral-500 font-medium">{key}</span>
                    <span className="font-bold text-neutral-900 font-mono sm:font-sans">{val}</span>
                  </div>
                ))}
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-neutral-50/50">
                  <span className="text-neutral-500 font-medium">شماره بین‌المللی OEM:</span>
                  <span className="font-mono font-bold text-red-600">{product.oemNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Fitment Matrix Table */}
          {activeTab === 'fitment' && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-500 mb-2">
                این قطعه بر روی مدل‌ها، سال‌های ساخت و پیشرانه‌های زیر مورد تست و تایید قرار گرفته است:
              </div>

              <div className="product-fitment-table overflow-x-auto border border-neutral-200 rounded-2xl">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-700">
                    <tr>
                      <th className="p-3.5">برند خودرو</th>
                      <th className="p-3.5">مدل</th>
                      <th className="p-3.5">بازه سال ساخت</th>
                      <th className="p-3.5">نوع موتور / حجم</th>
                      <th className="p-3.5">توضیحات انطباق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {product.fitments.map((fit) => (
                      <tr key={fit.id} className="hover:bg-neutral-50/60">
                        <td className="p-3.5 font-bold text-neutral-900">{fit.brandName}</td>
                        <td className="p-3.5 font-bold text-red-600">{fit.modelName}</td>
                        <td className="p-3.5 font-mono">{fit.yearFrom} الی {fit.yearTo || 'اکنون'}</td>
                        <td className="p-3.5 text-neutral-700 font-medium">{fit.engine}</td>
                        <td className="p-3.5 text-neutral-500">{fit.notes || 'انطباق ۱۰۰٪ با اتصالات فابریک'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Symptoms of Failure */}
          {activeTab === 'symptoms' && (
            <div className="space-y-6 text-xs md:text-sm">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  دوره و زمان پیشنهادی تعویض:
                </h4>
                <p className="text-amber-800">{product.replacementInterval}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-neutral-900 text-sm">مهم‌ترین علائم هشداردهنده خرابی این قطعه:</h4>
                <div className="space-y-2">
                  {product.symptomsOfFailure.map((symptom, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-neutral-700 font-medium">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Installation Tips */}
          {activeTab === 'install' && (
            <div className="space-y-4 text-xs md:text-sm">
              <div className="text-neutral-500">
                رعایت دقیق گشتاور بستن پیچ‌ها و آماده‌سازی بستر نصب ضامن عدم خرابی و باطل نشدن گارانتی است:
              </div>
              <div className="space-y-2.5">
                {product.installationTips.map((tip, idx) => (
                  <div key={idx} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-neutral-700 leading-relaxed font-medium">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Genuine vs Fake */}
          {activeTab === 'fake' && (
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs md:text-sm leading-relaxed">
              <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                روش‌های تمایز نمونه اصلی شرکتی از اجناس تقلبی:
              </h4>
              <p className="text-neutral-700">{product.genuineVsFakeNotes}</p>
            </div>
          )}

        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-neutral-900">سایر قطعات مرتبط و پیشنهادی</h3>
            <button 
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              مشاهده فروشگاه
            </button>
          </div>

          <div className="related-products-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map(rel => (
              <ProductCard 
                key={rel.id} 
                product={rel} 
                onViewDetails={(id) => onNavigate('product', id)} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Bar on Mobile (Master Prompt #63) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-neutral-200 p-3 shadow-xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-neutral-400 block">قیمت:</span>
          <span className="text-sm font-black text-neutral-900">
            {formatToman(product.discountPrice || product.price)}
          </span>
        </div>

        <button
          onClick={() => {
            addToCart(product, 1, selectedVehicle);
            onOpenCartDrawer();
          }}
          className="h-10 px-5 bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>افزودن به سبد خرید</span>
        </button>
      </div>

      {/* Stock Notification Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 text-right">
            <h3 className="font-bold text-base text-neutral-900">اطلاع‌رسانی موجودی کالا</h3>
            <p className="text-xs text-neutral-500">
              به محض تامین مجدد قطعه «{product.nameFa}»، پیامک فوری برای شما ارسال خواهد شد.
            </p>
            <form onSubmit={handleStockSubscribe} className="space-y-3">
              <input
                type="tel"
                value={stockPhone}
                onChange={e => setStockPhone(e.target.value)}
                placeholder="شماره موبایل (مثال: 09121234567)"
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden text-left font-mono"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-2 text-xs text-neutral-600 bg-neutral-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl shadow-sm"
                >
                  ثبت شماره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
