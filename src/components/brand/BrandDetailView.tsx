import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { Car, ShieldCheck, ArrowLeft, Layers, Wrench, HelpCircle, CheckCircle2, ChevronLeft } from 'lucide-react';

interface BrandDetailViewProps {
  brandSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const BrandDetailView: React.FC<BrandDetailViewProps> = ({ brandSlug, onNavigate }) => {
  const { brands, models, products, categories, setSelectedVehicle } = useStore();

  const brand = brands.find(b => b.slug === brandSlug || b.id === brandSlug);

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">برند خودرو یافت نشد!</h2>
        <button onClick={() => onNavigate('home')} className="text-xs text-red-600 font-bold underline">
          بازگشت به خانه
        </button>
      </div>
    );
  }

  const brandModels = models.filter(m => m.brandId === brand.id);
  const brandProducts = products.filter(p => p.fitments.some(f => f.brandId === brand.id || f.modelId === 'all'));

  return (
    <div className="space-y-12 pb-16">
      {/* Brand Hero Banner */}
      <div className="relative bg-neutral-900 text-white overflow-hidden py-12 md:py-16 border-b border-neutral-800">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={brand.heroImage}
            alt={brand.seo?.images?.[brand.heroImage]?.alt || brand.nameFa}
            title={brand.seo?.images?.[brand.heroImage]?.title || brand.nameFa}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <div className="site-breadcrumb flex items-center gap-2 text-xs text-neutral-400 mb-6">
            <button onClick={() => onNavigate('home')} className="hover:text-white">خانه</button>
            <span>/</span>
            <button onClick={() => onNavigate('shop')} className="hover:text-white">برندهای خودرو</button>
            <span>/</span>
            <span className="text-white font-bold">{brand.nameFa}</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="brand-detail-logo w-20 h-20 md:w-24 md:h-24 rounded-2xl p-2 border-2 border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={brand.logo}
                  alt={brand.seo?.images?.[brand.logo]?.alt || brand.nameFa}
                  title={brand.seo?.images?.[brand.logo]?.title || brand.nameFa}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-4xl font-black text-white">{brand.nameFa}</h1>
                  <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                    {brand.nameEn}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">{brand.description}</p>
              </div>
            </div>

            <div className="bg-neutral-800/80 border border-neutral-700 p-4 rounded-2xl text-xs space-y-1.5 shrink-0">
              <div className="flex justify-between gap-4 text-neutral-400">
                <span>نماینده و مونتاژ:</span>
                <span className="text-white font-bold">{brand.officialRepresentative}</span>
              </div>
              <div className="flex justify-between gap-4 text-neutral-400">
                <span>تعداد مدل‌ها:</span>
                <span className="text-red-400 font-bold">{brandModels.length} مدل فعال</span>
              </div>
              <div className="flex justify-between gap-4 text-neutral-400">
                <span>تضمین اصالت:</span>
                <span className="text-emerald-400 font-bold">۱۰۰٪ هولوگرام شرکتی</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Models Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-red-600" />
                <span>مدل‌های خودروی {brand.nameFa}</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                برای مشاهده تمام قطعات تخصصی فابریک، مدل خودروی خود را انتخاب کنید:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandModels.map(model => (
              <div
                key={model.id}
                onClick={() => onNavigate('car-model', model.id)}
                className="bg-white rounded-2xl border border-neutral-200 hover:border-red-500 hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/10 overflow-hidden bg-neutral-100 relative">
                    <img 
                      src={model.imageUrl} 
                      alt={model.nameFa} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-neutral-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {model.bodyType}
                    </span>
                  </div>

                  <div className="p-5 space-y-2 text-right">
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-red-600 transition-colors">
                      {model.nameFa}
                    </h3>
                    <p className="text-xs text-neutral-500">{model.engineSummary}</p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
                      <span>سال‌های ساخت: {model.yearFrom} تا {model.yearTo || 'اکنون'}</span>
                      <span>·</span>
                      <span className="font-mono">{model.specifications.engineCode}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-red-600">
                  <span>مشاهده کاتالوگ قطعات {model.nameFa}</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Parts for this Brand */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" />
                <span>پرفروش‌ترین قطعات {brand.nameFa}</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1">تامین مستقیم و با گارانتی تعویض</p>
            </div>
            <button 
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              مشاهده تمامی قطعات
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brandProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onViewDetails={(id) => onNavigate('product', id)} 
              />
            ))}
          </div>
        </section>

        {/* Brand FAQ */}
        {brand.faq && brand.faq.length > 0 && (
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-neutral-200 space-y-4">
            <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-600" />
              <span>سؤالات متداول مالکان خودروهای {brand.nameFa}</span>
            </h3>

            <div className="space-y-3">
              {brand.faq.map((item, idx) => (
                <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900">{item.q}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {brand.bottomDescription && (
          <section className="brand-seo-content bg-white rounded-3xl p-6 md:p-8 border border-neutral-200">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-neutral-900">راهنمای قطعات و خدمات {brand.nameFa}</h2>
            </div>
            <div
              className="prose prose-sm max-w-none text-neutral-600 leading-8"
              dangerouslySetInnerHTML={{ __html: brand.bottomDescription }}
            />
          </section>
        )}
      </div>
    </div>
  );
};
