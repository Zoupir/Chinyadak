import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  X, 
  Car, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Coins, 
  Globe, 
  Copy, 
  Check, 
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface AiSearchAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, param?: string) => void;
  initialQuery?: string;
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: Array<{
    web?: {
      title?: string;
      uri?: string;
    };
  }>;
}

export const AiSearchAdvisorModal: React.FC<AiSearchAdvisorModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialQuery = ''
}) => {
  const { selectedVehicle, brands, showToast } = useStore();

  const [query, setQuery] = useState(initialQuery);
  const [vehicle, setVehicle] = useState(selectedVehicle ? selectedVehicle.modelName : '');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingData, setGroundingData] = useState<GroundingMetadata | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    { title: 'تسمه تایم جک S5', q: 'قیمت روز و مارک‌های اصلی تسمه تایم جک S5 و زمان تعویض استاندارد آن' },
    { title: 'لنت ترمز KMC J7', q: 'بهترین مارک لنت ترمز جلو و عقب KMC J7 و تفاوت سرامیکی با معمولی' },
    { title: 'روغن گیربکس تیگو ۷', q: 'حجم و استاندارد روغن گیربکس CVT چری تیگو ۷ و فونیکس FX' },
    { title: 'واترپمپ ام‌وی‌ام X55', q: 'نحوه تشخیص واترپمپ اصلی شرکتی مدیران خودرو برای MVM X55 Pro' }
  ];

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) {
      showToast('لطفاً عنوان قطعه یا پرسش خود را تایپ نمایید.', 'error');
      return;
    }

    setIsLoading(true);
    setResultText(null);
    setGroundingData(null);

    try {
      const res = await fetch('/api/ai/search-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          vehicle: vehicle || (selectedVehicle ? selectedVehicle.modelName : '')
        })
      });

      if (!res.ok) {
        throw new Error('خطا در برقراری ارتباط با سرویس استعلام هوشمند');
      }

      const data = await res.json();
      setResultText(data.text);
      if (data.groundingMetadata) {
        setGroundingData(data.groundingMetadata);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در جستجو', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setIsCopied(true);
    showToast('متن پاسخ در کلیپ‌بورد کپی شد.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">استعلام هوشمند قطعات با جستجوی گوگل</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Google Search Live
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                استعلام قیمت روز، کدهای فنی OEM، عیب‌یابی و بررسی اصالت در بازار خودروهای چینی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Query Form */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="مثال: قیمت و اصالت تسمه تایم جک S5 در بازار..."
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs sm:text-sm focus:border-red-600 focus:bg-white focus:outline-hidden transition-all shadow-xs"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="w-full sm:w-56 relative">
                <input
                  type="text"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  placeholder="مدل خودرو (اختیاری)"
                  className="w-full pl-9 pr-3 py-3 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs sm:text-sm focus:border-red-600 focus:bg-white focus:outline-hidden transition-all shadow-xs"
                />
                <Car className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>در حال جستجو...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>بررسی با گوگل</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-neutral-400 font-bold">پرسش‌های پرتکرار:</span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(p.q);
                    handleSearch(p.q);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-red-50 hover:text-red-700 border border-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-4 bg-neutral-50 rounded-3xl border border-neutral-200">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-neutral-800">در حال جستجوی زنده در وب و پایگاه قطعات چین‌پارت...</h4>
                <p className="text-xs text-neutral-500">
                  تحلیل قیمت‌های روز، شماره فنی OEM و تاییدیه‌های کیفی توسط هوش مصنوعی
                </p>
              </div>
            </div>
          )}

          {/* Result View */}
          {resultText && !isLoading && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-neutral-700">نتیجه کارشناسی و داده‌های وب</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'کپی شد' : 'کپی متن'}</span>
                    </button>

                    <button
                      onClick={() => handleSearch()}
                      className="p-1.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                      title="بروزرسانی جستجو"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Formatted Text Content */}
                <div className="prose prose-sm max-w-none text-neutral-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {resultText}
                </div>
              </div>

              {/* Google Search Grounding Metadata Section */}
              {groundingData && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span>منابع جستجو و پیوندهای وب گوگل (Google Grounding):</span>
                  </div>

                  {groundingData.webSearchQueries && groundingData.webSearchQueries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-neutral-500 font-medium">کوئری‌های جستجو شده:</span>
                      {groundingData.webSearchQueries.map((q, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-mono">
                          {q}
                        </span>
                      ))}
                    </div>
                  )}

                  {groundingData.groundingChunks && groundingData.groundingChunks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {groundingData.groundingChunks.map((chunk, i) => {
                        const web = chunk.web;
                        if (!web) return null;
                        return (
                          <a
                            key={i}
                            href={web.uri || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-white rounded-xl border border-neutral-200 hover:border-amber-400 flex items-center justify-between text-xs text-neutral-700 hover:text-amber-800 transition-all shadow-2xs group"
                          >
                            <span className="truncate font-medium">{web.title || web.uri}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-600 shrink-0 mr-2" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Quick Links */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>می‌توانید برای سفارش این قطعه از امتیازات باشگاه مشتریان تخفیف بگیرید.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('shop');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    مشاهده قطعات در فروشگاه
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('account', 'loyalty');
                    }}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    باشگاه مشتریان
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
