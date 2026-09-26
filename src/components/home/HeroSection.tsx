import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CarBrand, VehicleModel } from '../../types';
import { 
  Car, 
  Search, 
  ShieldCheck, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface HeroSectionProps {
  onFindParts: () => void;
  onSelectModel: (modelId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onFindParts, onSelectModel }) => {
  const { brands, models, selectedVehicle, setSelectedVehicle, addToGarage } = useStore();

  const [selectedBrandId, setSelectedBrandId] = useState<string>(selectedVehicle?.brandId || 'kmc');
  const [selectedModelId, setSelectedModelId] = useState<string>(selectedVehicle?.modelId || 'kmc-j7');
  const [selectedYear, setSelectedYear] = useState<number>(selectedVehicle?.year || 1402);

  const currentBrandModels = models.filter(m => m.brandId === selectedBrandId);
  const activeModel = models.find(m => m.id === selectedModelId);

  const handleApplyFilter = () => {
    if (!activeModel) return;
    const brand = brands.find(b => b.id === selectedBrandId);
    const carData = {
      brandId: selectedBrandId,
      brandName: brand?.nameFa || selectedBrandId,
      modelId: activeModel.id,
      modelName: activeModel.nameFa,
      year: selectedYear,
      engine: activeModel.engineSummary,
      transmission: activeModel.transmissionSummary,
      customLabel: `خودروی من (${activeModel.nameFa})`,
      imageUrl: activeModel.imageUrl
    };
    addToGarage(carData);
    onFindParts();
  };

  return (
    <div className="relative bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 text-white overflow-hidden py-12 md:py-16 border-b border-neutral-800">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Right Text Column */}
          <div className="lg:col-span-6 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سیستم هوشمند فیتمنت و سازگاری قطعات خودروهای چینی</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              قطعه درست برای <span className="text-red-500 underline decoration-red-600/40">خودروی شما</span>
            </h1>

            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-xl">
              تخصصی‌ترین مرکز تامین لوازم یدکی، موتوری، گیربکس و جلوبندی خودروهای KMC, Chery, MVM, Fownix, Lamari و Changan با تضمین شماره فنی OEM و انطباق کامل.
            </p>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ضمانت اصالت شرکتی</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تطبیق فنی شاسی و پارت</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ارسال فوری سرتاسر ایران</span>
              </div>
            </div>
          </div>

          {/* Left Column: Interactive Vehicle Finder Card */}
          <div className="lg:col-span-6">
            <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-5 border-b border-neutral-700 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">انتخاب سریع قطعات بر اساس خودرو</h3>
                    <p className="text-xs text-neutral-400">خودرو را مشخص کنید تا قطعات نامربوط فیلتر شوند</p>
                  </div>
                </div>

                {selectedVehicle && (
                  <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                    فعال: {selectedVehicle.modelName}
                  </span>
                )}
              </div>

              {/* Selector Controls */}
              <div className="space-y-4">
                {/* 1. Brand Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">۱. برند خودرو:</label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      const newBrand = e.target.value;
                      setSelectedBrandId(newBrand);
                      const firstModel = models.find(m => m.brandId === newBrand);
                      if (firstModel) setSelectedModelId(firstModel.id);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-hidden cursor-pointer"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nameFa} ({b.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Model Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">۲. مدل خودرو:</label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-hidden cursor-pointer"
                  >
                    {currentBrandModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nameFa} - {m.bodyType} ({m.engineSummary})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Year Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">۳. سال ساخت:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1404, 1403, 1402, 1401].map(year => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setSelectedYear(year)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          selectedYear === year
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Model Spec Preview */}
                {activeModel && (
                  <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={activeModel.imageUrl} 
                        alt={activeModel.nameFa} 
                        className="w-12 h-9 object-cover rounded-md border border-neutral-700" 
                      />
                      <div>
                        <span className="font-bold text-white block">{activeModel.nameFa}</span>
                        <span className="text-[11px] text-neutral-400 font-mono">Engine: {activeModel.specifications.engineCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectModel(activeModel.id)}
                      className="text-xs text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      صفحه مشخصات خودرو
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-4"
                >
                  <Search className="w-4 h-4" />
                  <span>مشاهده قطعات سازگار با این خودرو</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
