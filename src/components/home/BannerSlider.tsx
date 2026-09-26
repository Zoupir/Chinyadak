import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { ChevronRight, ChevronLeft, Sparkles, ArrowLeft } from 'lucide-react';

interface BannerSliderProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ onNavigate }) => {
  const { sliders } = useStore();
  const activeSliders = sliders.filter(s => s.isActive).sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeSliders.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSliders.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSliders.length, isPaused]);

  if (activeSliders.length === 0) return null;

  const currentSlide = activeSliders[currentIndex] || activeSliders[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeSliders.length) % activeSliders.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSliders.length);
  };

  const handleCtaClick = () => {
    const rawLink = currentSlide.link || 'shop';
    if (rawLink.includes(':')) {
      const [view, param] = rawLink.split(':');
      onNavigate(view, param);
    } else {
      onNavigate(rawLink);
    }
  };

  return (
    <div 
      className="relative max-w-7xl mx-auto px-4 -mt-6 sm:-mt-8 z-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-950 aspect-[16/8] sm:aspect-[21/9] md:aspect-[24/9] min-h-[220px]">
        {/* Background Image with Zoom Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
        />

        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-black/30"></div>

        {/* Slide Content */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-2xl p-6 sm:p-10 md:p-14 text-right space-y-3 sm:space-y-4">
          {currentSlide.tag && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] sm:text-xs font-black shadow-lg self-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentSlide.tag}</span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
            {currentSlide.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-sm font-medium">
            {currentSlide.subtitle}
          </p>

          <div className="pt-2">
            <button
              onClick={handleCtaClick}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-red-600/30 transition-all hover:gap-3"
            >
              <span>{currentSlide.buttonText || 'مشاهده و خرید قطعات'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {activeSliders.length > 1 && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors"
              title="اسلاید قبلی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors"
              title="اسلاید بعدی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Indicators Dots */}
        {activeSliders.length > 1 && (
          <div className="absolute bottom-5 right-6 sm:right-10 z-20 flex items-center gap-1.5">
            {activeSliders.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-red-600'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`اسلاید ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
