import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search, X, ChevronRight, FileText, Car, Layers, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatToman } from '../../utils/formatters';

interface SearchAutocompleteProps {
  onSelectProduct: (productId: string) => void;
  onSelectModel: (modelId: string) => void;
  onSelectCategory: (categorySlug: string) => void;
  onSelectArticle: (articleId: string) => void;
  onRequestPart: (query: string) => void;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  onSelectProduct,
  onSelectModel,
  onSelectCategory,
  onSelectArticle,
  onRequestPart
}) => {
  const { products, models, categories, logSearch } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQ = query.trim().toLowerCase();

  // Filter items
  const matchingProducts = cleanQ ? products.filter(p => 
    p.nameFa.toLowerCase().includes(cleanQ) ||
    p.nameEn.toLowerCase().includes(cleanQ) ||
    p.oemNumber.toLowerCase().includes(cleanQ) ||
    p.partNumber.toLowerCase().includes(cleanQ) ||
    p.sku.toLowerCase().includes(cleanQ) ||
    p.brandManufacturer.toLowerCase().includes(cleanQ) ||
    p.fitments.some(f => f.modelName.toLowerCase().includes(cleanQ) || f.engine.toLowerCase().includes(cleanQ))
  ).slice(0, 5) : [];

  const matchingModels = cleanQ ? models.filter(m => 
    m.nameFa.toLowerCase().includes(cleanQ) ||
    m.nameEn.toLowerCase().includes(cleanQ) ||
    m.slug.toLowerCase().includes(cleanQ) ||
    m.specifications.engineCode.toLowerCase().includes(cleanQ)
  ).slice(0, 3) : [];

  const matchingCategories = cleanQ ? categories.filter(c =>
    c.nameFa.toLowerCase().includes(cleanQ) ||
    c.nameEn.toLowerCase().includes(cleanQ) ||
    c.subcategories?.some(sub => sub.nameFa.toLowerCase().includes(cleanQ))
  ).slice(0, 3) : [];

  const totalResults = matchingProducts.length + matchingModels.length + matchingCategories.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanQ) return;
    logSearch(cleanQ, totalResults);
    if (matchingProducts.length > 0) {
      onSelectProduct(matchingProducts[0].id);
      setIsOpen(false);
    } else if (matchingModels.length > 0) {
      onSelectModel(matchingModels[0].id);
      setIsOpen(false);
    } else {
      onRequestPart(query);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="جستجوی نام قطعه، کد فنی، شماره OEM، برند خودرو (مثلاً: واتر پمپ J7، 1026040)"
          className="w-full h-11 md:h-12 pr-11 pl-24 text-xs md:text-sm bg-neutral-100 focus:bg-white text-neutral-900 rounded-xl border border-neutral-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/10 focus:outline-hidden transition-all shadow-xs"
        />
        <Search className="w-5 h-5 text-neutral-400 absolute right-3 pointer-events-none" />
        
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute left-16 p-1 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="absolute left-1.5 h-8 md:h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
        >
          <span>بیاب</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </form>

      {/* Popover Dropdown */}
      {isOpen && cleanQ.length > 1 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden divide-y divide-neutral-100 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {totalResults > 0 ? (
            <>
              {/* Models Section */}
              {matchingModels.length > 0 && (
                <div className="p-3 bg-neutral-50/60">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-2">
                    <Car className="w-3.5 h-3.5 text-neutral-600" />
                    <span>خودروهای مطابق:</span>
                  </div>
                  <div className="space-y-1">
                    {matchingModels.map(model => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          logSearch(query, totalResults);
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all text-right group"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={model.imageUrl} alt={model.nameFa} className="w-10 h-7 object-cover rounded-md border" />
                          <div>
                            <p className="text-xs font-bold text-neutral-900 group-hover:text-red-600">{model.nameFa}</p>
                            <p className="text-[10px] text-neutral-500">{model.engineSummary}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                          مشاهده قطعات
                          <ArrowLeft className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {matchingProducts.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-2">
                    <Layers className="w-3.5 h-3.5 text-red-600" />
                    <span>قطعات یدکی پیدا شده:</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          logSearch(query, totalResults);
                          onSelectProduct(product.id);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition-all text-right group border border-transparent hover:border-neutral-200"
                      >
                        <div className="flex items-center gap-3">
                          <img src={product.images[0]} alt={product.nameFa} className="w-12 h-12 object-cover rounded-lg border bg-neutral-100" />
                          <div>
                            <p className="text-xs font-bold text-neutral-900 group-hover:text-red-600 line-clamp-1">
                              {product.nameFa}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                              <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded-sm">OEM: {product.oemNumber}</span>
                              <span>·</span>
                              <span>{product.brandManufacturer}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left shrink-0 mr-2">
                          <div className="text-xs font-bold text-neutral-900">
                            {formatToman(product.discountPrice || product.price)}
                          </div>
                          {product.stockStatus === 'in_stock' ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">موجود در انبار</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-semibold">موجودی محدود</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {matchingCategories.length > 0 && (
                <div className="p-3 bg-neutral-50/50">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 px-2">
                    دسته‌بندی‌های مرتبط:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.slug);
                          setIsOpen(false);
                        }}
                        className="text-xs px-3 py-1 bg-white hover:bg-red-50 text-neutral-700 hover:text-red-600 border border-neutral-200 rounded-lg transition-colors font-medium"
                      >
                        {cat.nameFa}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Search Not Found State */
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">
                قطعه‌ای با عبارت «{query}» پیدا نشد!
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
                نگران نباشید؛ اگر قطعه موردنظر شما در فروشگاه موجود نیست، می‌توانید مشخصات خودرو و پارت‌نامبر را ارسال نمایید تا در کمتر از ۲ ساعت از انبار مرکزی یا گمرک استعلام شود.
              </p>
              <button
                type="button"
                onClick={() => {
                  onRequestPart(query);
                  setIsOpen(false);
                }}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>ثبت درخواست استعلام قطعه نایاب</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
