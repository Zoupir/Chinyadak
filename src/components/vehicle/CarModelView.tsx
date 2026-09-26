import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { 
  Car, 
  Wrench, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Layers, 
  Search, 
  AlertTriangle, 
  Clock, 
  HelpCircle,
  Cpu,
  Zap,
  Gauge,
  Sparkles
} from 'lucide-react';

interface CarModelViewProps {
  modelId: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const CarModelView: React.FC<CarModelViewProps> = ({
  modelId,
  onNavigate,
  onOpenVehicleModal
}) => {
  const { models, brands, products, categories, selectedVehicle, setSelectedVehicle, addToGarage } = useStore();
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const model = models.find(m => m.id === modelId || m.slug === modelId);

  if (!model) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">مدل خودرو یافت نشد!</h2>
        <button onClick={() => onNavigate('home')} className="text-xs text-red-600 font-bold underline">
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  const brand = brands.find(b => b.id === model.brandId);

  // Filter products compatible with this model
  const modelProducts = products.filter(p => {
    const isFit = p.fitments.some(f => 
      f.modelId === model.id || 
      f.modelId === 'all' || 
      model.nameFa.toLowerCase().includes(f.modelName.toLowerCase())
    );
    if (!isFit) return false;

    if (activeCategoryFilter !== 'all' && p.categorySlug !== activeCategoryFilter) {
      return false;
    }

    if (modelSearchQuery.trim()) {
      const q = modelSearchQuery.trim().toLowerCase();
      return p.nameFa.toLowerCase().includes(q) || 
        p.oemNumber.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const isCurrentActiveCar = selectedVehicle?.modelId === model.id;

  const handleSetAsMyCar = () => {
    const carData = {
      brandId: model.brandId,
      brandName: brand?.nameFa || model.brandId,
      modelId: model.id,
      modelName: model.nameFa,
      year: model.yearTo || 1403,
      engine: model.engineSummary,
      transmission: model.transmissionSummary,
      customLabel: `خودروی من (${model.nameFa})`,
      imageUrl: model.imageUrl
    };
    addToGarage(carData);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Model Hero Header */}
      <div className="bg-neutral-900 text-white py-10 md:py-14 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
            <button onClick={() => onNavigate('home')} className="hover:text-white">خانه</button>
            <span>/</span>
            {brand && (
              <>
                <button onClick={() => onNavigate('car-brand', brand.slug)} className="hover:text-white">
                  {brand.nameFa}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-white font-bold">{model.nameFa}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-red-600 font-bold px-2.5 py-0.5 rounded-md text-white">
                  {model.bodyType}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  مدل‌های {model.yearFrom} تا {model.yearTo || 'اکنون'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                قطعات یدکی و لوازم {model.nameFa}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                {model.description}
              </p>

              {/* Set as Active Car Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSetAsMyCar}
                  disabled={isCurrentActiveCar}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
                    isCurrentActiveCar
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>{isCurrentActiveCar ? 'خودروی فعال در سایت شماست' : 'انتخاب به عنوان «خودروی من»'}</span>
                </button>

                <button
                  onClick={() => onNavigate('part-request')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                >
                  استعلام شماره شاسی (VIN)
                </button>
              </div>
            </div>

            {/* Car Image Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden border-2 border-neutral-700 bg-neutral-800 shadow-2xl relative aspect-16/10">
                <img src={model.imageUrl} alt={model.nameFa} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Engine Technical Bar */}
          <div className="mt-8 pt-6 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">کد موتور کارخانه:</span>
              <span className="font-mono font-bold text-red-400 text-xs mt-0.5 block">{model.specifications.engineCode}</span>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">حجم موتور:</span>
              <span className="font-bold text-white text-xs mt-0.5 block">{model.specifications.displacement}</span>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">قدرت موتور:</span>
              <span className="font-bold text-white text-xs mt-0.5 block">{model.specifications.horsepower}</span>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">گشتاور:</span>
              <span className="font-bold text-white text-xs mt-0.5 block">{model.specifications.torque}</span>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">گیربکس:</span>
              <span className="font-bold text-white text-xs mt-0.5 block truncate">{model.specifications.transmission}</span>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">مصرف سوخت:</span>
              <span className="font-bold text-white text-xs mt-0.5 block">{model.specifications.fuelConsumption}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Search Inside This Car's Catalog */}
        <section className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900">
                قطعه موردنظر خود را در قطعات {model.nameFa} بیابید:
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                فیلتر بر اساس نام فارسی، کد قطعه OEM یا دسته‌بندی
              </p>
            </div>

            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={e => setModelSearchQuery(e.target.value)}
                placeholder="جستجو در قطعات این خودرو..."
                className="w-full text-xs p-3 pr-10 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {/* Quick Categories Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategoryFilter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              همه قطعات ({modelProducts.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryFilter(c.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategoryFilter === c.slug
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.nameFa}
              </button>
            ))}
          </div>

          {/* Compatible Parts List */}
          <div className="pt-4">
            {modelProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modelProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onViewDetails={(id) => onNavigate('product', id)} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                <Wrench className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h4 className="font-bold text-neutral-800 text-sm mb-1">قطعه‌ای با فیلتر انتخابی یافت نشد</h4>
                <p className="text-xs text-neutral-500 mb-4">
                  اگر قطعه مورد نظر شما در انبار ثبت نشده است، فرم استعلام قطعه را تکمیل فرمایید.
                </p>
                <button
                  onClick={() => onNavigate('part-request')}
                  className="px-5 py-2 bg-neutral-900 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  استعلام شماره پارت
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Maintenance Tips & Common Issues (Educational Value) */}
        {(model.commonIssues || model.maintenanceTips) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {model.commonIssues && (
              <div className="p-6 bg-white rounded-3xl border border-neutral-200 space-y-3">
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>نکات فنی و نقاط حساس {model.nameFa}</span>
                </h3>
                <ul className="space-y-2 text-xs text-neutral-600">
                  {model.commonIssues.map((issue, idx) => (
                    <li key={idx} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {model.maintenanceTips && (
              <div className="p-6 bg-white rounded-3xl border border-neutral-200 space-y-3">
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>توصیه‌های نگهداری و افزایش طول عمر قطعات</span>
                </h3>
                <ul className="space-y-2 text-xs text-neutral-600">
                  {model.maintenanceTips.map((tip, idx) => (
                    <li key={idx} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* FAQ for Model */}
        {model.faq && model.faq.length > 0 && (
          <section className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-600" />
              <span>سؤالات فنی پرتکرار درباره لوازم {model.nameFa}</span>
            </h3>
            <div className="space-y-3">
              {model.faq.map((item, idx) => (
                <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900">{item.q}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
