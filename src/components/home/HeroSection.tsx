import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  Truck
} from 'lucide-react';

interface HeroSectionProps {
  onFindParts: () => void;
  onSelectModel: (modelId: string) => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onFindParts, onSelectModel, onNavigate }) => {
  const { brands, models, selectedVehicle, setSelectedVehicle, addToGarage, sliders, settings } = useStore();
  const themeMode = settings?.themeMode || 'dark';
  const isLight = themeMode === 'light';
  const isSlate = themeMode === 'slate';
  const isNavy = themeMode === 'navy';

  const [selectedBrandId, setSelectedBrandId] = useState<string>(selectedVehicle?.brandId || 'kmc');
  const [selectedModelId, setSelectedModelId] = useState<string>(selectedVehicle?.modelId || 'kmc-j7');
  const [selectedYear, setSelectedYear] = useState<number>(selectedVehicle?.year || 1402);

  // Slider State
  const activeSliders = sliders.filter(s => s.isActive).sort((a, b) => a.order - b.order);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const sliderTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeSliders.length <= 1 || isSliderPaused) return;

    sliderTimerRef.current = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % activeSliders.length);
    }, 6000);

    return () => {
      if (sliderTimerRef.current) clearInterval(sliderTimerRef.current);
    };
  }, [activeSliders.length, isSliderPaused]);

  const currentSlide = activeSliders[currentSlideIndex] || activeSliders[0];

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev - 1 + activeSliders.length) % activeSliders.length);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % activeSliders.length);
  };

  const handleSlideCtaClick = () => {
    if (!onNavigate) {
      onFindParts();
      return;
    }
    const rawLink = currentSlide?.link || 'shop';
    if (rawLink.includes(':')) {
      const [view, param] = rawLink.split(':');
      onNavigate(view, param);
    } else {
      onNavigate(rawLink);
    }
  };

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

  // Supported vehicle years list (solar calendar & equivalent Gregorian)
  const availableYears = [
    { shamsi: 1404, miladi: 2025 },
    { shamsi: 1403, miladi: 2024 },
    { shamsi: 1402, miladi: 2023 },
    { shamsi: 1401, miladi: 2022 },
    { shamsi: 1400, miladi: 2021 },
    { shamsi: 1399, miladi: 2020 },
    { shamsi: 1398, miladi: 2019 },
    { shamsi: 1397, miladi: 2018 },
    { shamsi: 1396, miladi: 2017 },
    { shamsi: 1395, miladi: 2016 },
    { shamsi: 1394, miladi: 2015 },
    { shamsi: 1393, miladi: 2014 },
    { shamsi: 1392, miladi: 2013 },
    { shamsi: 1391, miladi: 2012 },
    { shamsi: 1390, miladi: 2011 },
  ];

  return (
    <div className={`relative overflow-hidden py-8 sm:py-12 border-b transition-colors ${
      isLight
        ? 'bg-gradient-to-b from-neutral-100 via-neutral-50 to-white text-neutral-900 border-neutral-200'
        : isSlate
        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border-slate-800'
        : isNavy
        ? 'bg-gradient-to-b from-slate-950 via-blue-950/60 to-slate-950 text-white border-blue-950'
        : 'bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white border-neutral-800'
    }`}>
      {/* Dynamic Background Mesh Accents */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-700/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-8">
        
        {/* =========================================================================
            INTEGRATED HERO: SLIDER + VEHICLE SELECTOR COHESIVE SHOWCASE
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Integrated Dynamic Slider (Right 7 Cols on desktop) */}
          <div 
            className="lg:col-span-7 flex flex-col justify-between"
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
          >
            <div 
              style={{ backgroundColor: currentSlide?.bgColor || '#09090b' }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 h-full min-h-[340px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10"
            >
              {/* Background Slide Image with Zoom Transition */}
              {currentSlide && (
                <div 
                  key={currentSlide.id}
                  className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
                  style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
                />
              )}

              {/* Gradient Overlays: Dynamic on/off and opacity */}
              {currentSlide?.gradientOverlay !== false && (
                <>
                  <div 
                    style={{ opacity: (currentSlide?.overlayOpacity ?? 75) / 100 }}
                    className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"
                  />
                  <div 
                    style={{ opacity: ((currentSlide?.overlayOpacity ?? 75) * 0.7) / 100 }}
                    className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-black/30"
                  />
                </>
              )}

              {/* Slide Content with dynamic alignment & colors */}
              <div 
                className={`relative z-10 space-y-4 max-w-xl ${
                  currentSlide?.textAlignment === 'center' 
                    ? 'mx-auto text-center' 
                    : currentSlide?.textAlignment === 'left' 
                    ? 'mr-auto text-left' 
                    : 'text-right'
                }`}
              >
                {currentSlide?.tag ? (
                  <div 
                    style={{
                      backgroundColor: currentSlide.badgeBgColor || undefined,
                      color: currentSlide.badgeTextColor || undefined
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg ${
                      !currentSlide.badgeBgColor ? 'bg-red-600/90 text-white' : ''
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentSlide.tag}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 text-red-400 border border-red-500/30 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>سیستم هوشمند انطباق قطعات خودروهای چینی</span>
                  </div>
                )}

                <h1 
                  style={{ color: currentSlide?.titleColor || '#ffffff' }}
                  className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight drop-shadow-md"
                >
                  {currentSlide?.title || 'تامین قطعات اورجینال خودروهای چینی'}
                </h1>

                <p 
                  style={{ color: currentSlide?.subtitleColor || '#d4d4d8' }}
                  className="text-xs sm:text-sm leading-relaxed font-normal line-clamp-3 drop-shadow-sm"
                >
                  {currentSlide?.subtitle || 'مرکز تخصصی لوازم یدکی و مصرفی کی‌ام‌سی، چری، ام‌وی‌ام، فونیکس، لاماری و چانگان با ضمانت شماره فنی OEM و ارسال اکسپرس به سراسر کشور.'}
                </p>

                <div className={`pt-2 flex flex-wrap items-center gap-3 ${
                  currentSlide?.textAlignment === 'center' ? 'justify-center' : currentSlide?.textAlignment === 'left' ? 'justify-end' : ''
                }`}>
                  <button
                    onClick={handleSlideCtaClick}
                    style={{
                      backgroundColor: currentSlide?.buttonBgColor || undefined,
                      color: currentSlide?.buttonTextColor || undefined
                    }}
                    className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-red-600/30 transition-all hover:gap-3 cursor-pointer ${
                      !currentSlide?.buttonBgColor ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                    }`}
                  >
                    <span>{currentSlide?.buttonText || 'مشاهده و خرید قطعات'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate ? onNavigate('part-request') : onFindParts()}
                    className="px-4 py-3 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    استعلام قطعه نایاب
                  </button>
                </div>
              </div>

              {/* Slider Navigation Arrows & Dots */}
              {activeSliders.length > 1 && (
                <div className="relative z-10 pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {activeSliders.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === currentSlideIndex 
                            ? 'w-6 bg-red-500' 
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`اسلاید ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevSlide}
                      className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="اسلاید قبلی"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="اسلاید بعدی"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Interactive Vehicle Finder Card (5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl h-full flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">انتخاب هوشمند خودرو</h3>
                      <p className="text-[11px] text-neutral-400">فیلتر دقیق قطعات ۱۰۰٪ سازگار</p>
                    </div>
                  </div>

                  {selectedVehicle && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                      فعال: {selectedVehicle.modelName}
                    </span>
                  )}
                </div>

                {/* Vehicle Selection Form Controls */}
                <div className="space-y-3.5">
                  {/* 1. Brand Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      ۱. برند خودرو:
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => {
                        const newBrand = e.target.value;
                        setSelectedBrandId(newBrand);
                        const firstModel = models.find(m => m.brandId === newBrand);
                        if (firstModel) setSelectedModelId(firstModel.id);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-red-500 focus:outline-hidden cursor-pointer"
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
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      ۲. مدل خودرو:
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-red-500 focus:outline-hidden cursor-pointer"
                    >
                      {currentBrandModels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nameFa} - {m.bodyType} ({m.engineSummary})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Year Selector - LIST / DROPDOWN (Not grid buttons!) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                        <span>۳. سال ساخت خودرو (شمسی / میلادی):</span>
                      </label>
                      <span className="text-[10px] text-neutral-500 font-mono">انتخاب از لیست</span>
                    </div>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-red-500 focus:outline-hidden cursor-pointer font-medium"
                    >
                      {availableYears.map(item => (
                        <option key={item.shamsi} value={item.shamsi}>
                          سال {item.shamsi} (معادل {item.miladi})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Model Spec Preview */}
                  {activeModel && (
                    <div className="p-2.5 bg-neutral-950/70 rounded-xl border border-neutral-800 flex items-center justify-between text-xs mt-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={activeModel.imageUrl} 
                          alt={activeModel.nameFa} 
                          className="w-12 h-9 object-cover rounded-md border border-neutral-700 bg-neutral-800" 
                        />
                        <div>
                          <span className="font-bold text-white block text-[11px]">{activeModel.nameFa}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">کد پیشرانه: {activeModel.specifications.engineCode}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectModel(activeModel.id)}
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        مشخصات
                        <ChevronRight className="w-3 h-3 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="button"
                onClick={handleApplyFilter}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>مشاهده قطعات سازگار با این خودرو</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>

        {/* Quick Reassurance Trust Row under the unified showcase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">ضمانت اصالت ۱۰۰٪</span>
              <span className="text-[10px] text-neutral-400">قطعات پلمپ با هولوگرام شرکتی</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">تطبیق شماره شاسی VIN</span>
              <span className="text-[10px] text-neutral-400">انطباق تضمینی قطعه با اتاق و موتور</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-300">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">ارسال سریع و اکسپرس</span>
              <span className="text-[10px] text-neutral-400">تحویل فوری تهران و سراسر کشور</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-300">
            <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">۷ روز مهلت تست فنی</span>
              <span className="text-[10px] text-neutral-400">امکان مرجوعی بدون قید و شرط</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
