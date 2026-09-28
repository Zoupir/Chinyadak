import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { Product, QualityGrade } from '../../types';
import { 
  Filter, 
  X, 
  Car, 
  Layers, 
  Check, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { formatToman } from '../../utils/formatters';

interface ShopViewProps {
  initialCategory?: string;
  initialFilterMode?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  initialCategory,
  initialFilterMode,
  onNavigate,
  onOpenVehicleModal
}) => {
  const { products, categories, brands, models, selectedVehicle, clearSelectedVehicle } = useStore();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<QualityGrade | 'all'>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyFitActiveVehicle, setOnlyFitActiveVehicle] = useState<boolean>(Boolean(selectedVehicle));
  const [sortBy, setSortBy] = useState<'bestseller' | 'price_asc' | 'price_desc' | 'rating'>('bestseller');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available unique manufacturer brands
  const availableManufacturers = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brandManufacturer) set.add(p.brandManufacturer);
    });
    return Array.from(set);
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) {
        return false;
      }

      // 2. Brand (Car Manufacturer) Filter
      if (selectedBrand !== 'all') {
        const hasBrandFitment = p.fitments.some(f => f.brandId === selectedBrand || f.modelId === 'all');
        if (!hasBrandFitment) return false;
      }

      // 3. Part Manufacturer Company Filter
      if (selectedManufacturer !== 'all' && p.brandManufacturer !== selectedManufacturer) {
        return false;
      }

      // 4. Quality Grade Filter
      if (selectedGrade !== 'all' && p.grade !== selectedGrade) {
        return false;
      }

      // 5. In Stock Filter
      if (onlyInStock && p.stockStatus === 'out_of_stock') {
        return false;
      }

      // 6. Active Vehicle Filter
      if (onlyFitActiveVehicle && selectedVehicle) {
        const fits = p.fitments.some(f => 
          f.modelId === selectedVehicle.modelId || 
          f.modelId === 'all' || 
          selectedVehicle.modelName.toLowerCase().includes(f.modelName.toLowerCase())
        );
        if (!fits) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      }
      if (sortBy === 'price_desc') {
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      // default: bestseller
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [products, selectedCategory, selectedBrand, selectedManufacturer, selectedGrade, onlyInStock, onlyFitActiveVehicle, selectedVehicle, sortBy]);

  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedManufacturer('all');
    setSelectedGrade('all');
    setOnlyInStock(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Catalog Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900">
            {activeCategoryObj ? `قطعات ${activeCategoryObj.nameFa}` : 'فهرست کامل قطعات یدکی خودروهای چینی'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            نمایش {filteredProducts.length} قطعه با تضمین اصالت و گارانتی بازگشت وجه ۷ روزه
          </p>
        </div>

        {/* Selected Car Notice Banner */}
        <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div className="text-right text-xs">
            {selectedVehicle ? (
              <>
                <span className="text-neutral-500 block text-[10px]">فیلتر بر اساس خودروی انتخابی:</span>
                <span className="font-bold text-neutral-900">{selectedVehicle.modelName} ({selectedVehicle.year})</span>
              </>
            ) : (
              <>
                <span className="text-neutral-500 block text-[10px]">هیچ خودرویی انتخاب نشده است</span>
                <span className="font-bold text-red-600 cursor-pointer" onClick={onOpenVehicleModal}>
                  انتخاب خودرو جهت فیلتر هوشمند
                </span>
              </>
            )}
          </div>

          {selectedVehicle ? (
            <button
              onClick={onOpenVehicleModal}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              تغییر
            </button>
          ) : (
            <button
              onClick={onOpenVehicleModal}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              انتخاب
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl border border-neutral-200 p-6 space-y-6 shadow-xs sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-red-600" />
              <span>فیلترهای پیشرفته</span>
            </h3>
            <button
              onClick={resetAllFilters}
              className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
            >
              پاک‌سازی همه
            </button>
          </div>

          {/* Active Vehicle Toggle */}
          {selectedVehicle && (
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-900">
                <input
                  type="checkbox"
                  checked={onlyFitActiveVehicle}
                  onChange={e => setOnlyFitActiveVehicle(e.target.checked)}
                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>فقط قطعات سازگار با {selectedVehicle.modelName}</span>
              </label>
            </div>
          )}

          {/* Category Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-neutral-800">دسته‌بندی قطعات:</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-right p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>همه دسته‌ها</span>
                <span className="text-[10px] opacity-75">{products.length}</span>
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-right p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === c.slug
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <span>{c.nameFa}</span>
                  <span className="text-[10px] opacity-75">
                    {products.filter(p => p.categorySlug === c.slug).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 pt-4 border-t border-neutral-100">
            <h4 className="font-bold text-xs text-neutral-800">برند خودرو:</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`text-center p-2 rounded-lg text-xs transition-colors font-semibold ${
                  selectedBrand === 'all' ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100 bg-neutral-50'
                }`}
              >
                همه برندها
              </button>
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b.id)}
                  className={`text-center p-2 rounded-lg text-xs transition-colors font-semibold ${
                    selectedBrand === b.id ? 'bg-red-600 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100 bg-neutral-50'
                  }`}
                >
                  {b.nameFa}
                </button>
              ))}
            </div>
          </div>

          {/* Manufacturer Company / Brand Filter */}
          <div className="space-y-2 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-neutral-800">شرکت / برند سازنده قطعه:</h4>
              {selectedManufacturer !== 'all' && (
                <button
                  onClick={() => setSelectedManufacturer('all')}
                  className="text-[10px] text-red-600 hover:underline font-bold"
                >
                  حذف فیلتر
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              <button
                onClick={() => setSelectedManufacturer('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedManufacturer === 'all'
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                همه شرکت‌ها
              </button>
              {availableManufacturers.map(mfg => (
                <button
                  key={mfg}
                  onClick={() => setSelectedManufacturer(mfg)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedManufacturer === mfg
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {mfg}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Grade Filter */}
          <div className="space-y-2 pt-4 border-t border-neutral-100">
            <h4 className="font-bold text-xs text-neutral-800">گرید کیفی قطعه:</h4>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'همه گریدها' },
                { id: 'genuine', label: 'اصلی شرکتی (Genuine)' },
                { id: 'oem', label: 'وارداتی درجه یک (OEM)' },
                { id: 'aftermarket', label: 'افترمارکت استاندارد' }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id as any)}
                  className={`w-full text-right p-2 rounded-lg text-xs transition-colors ${
                    selectedGrade === g.id ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Only */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={e => setOnlyInStock(e.target.checked)}
                className="rounded border-neutral-300 text-red-600 focus:ring-red-500 w-4 h-4"
              />
              <span>فقط کالاهای موجود در انبار</span>
            </label>
          </div>
        </aside>

        {/* Product Grid & Sorting Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Sorting Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-500 font-semibold">مرتب‌سازی:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'bestseller', label: 'پرفروش‌ترین' },
                  { id: 'price_asc', label: 'ارزان‌ترین' },
                  { id: 'price_desc', label: 'گران‌ترین' },
                  { id: 'rating', label: 'بالاترین امتیاز' }
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                      sortBy === sort.id
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden px-3.5 py-1.5 bg-neutral-100 rounded-xl text-neutral-800 font-bold flex items-center gap-1.5"
            >
              <Filter className="w-4 h-4 text-red-600" />
              <span>فیلترها ({filteredProducts.length})</span>
            </button>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onViewDetails={(id) => onNavigate('product', id)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base">هیچ قطعه‌ای مطابق با فیلترهای انتخابی یافت نشد!</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                می‌توانید فیلترها را حذف کنید، یا شماره شاسی و نام قطعه موردنیاز خود را ارسال کنید تا کارشناسان ما مستقیماً استعلام نمایند.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
                >
                  حذف همه فیلترها
                </button>
                <button
                  onClick={() => onNavigate('part-request')}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت استعلام قطعه نایاب
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
