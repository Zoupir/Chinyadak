import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { RichTextContent } from '../common/RichTextContent';
import { sanitizeEmbedHtml } from '../../utils/sanitizeHtml';
import { QualityGrade } from '../../types';
import { Filter, Car, Layers, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

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
  const [specialMode, setSpecialMode] = useState<'all' | 'maintenance' | 'bestseller'>(
    initialFilterMode === 'maintenance'
      ? 'maintenance'
      : initialFilterMode === 'bestseller'
      ? 'bestseller'
      : 'all'
  );

  const categoryIndex = useMemo(() => {
    const rows: Array<{ node: any; parent?: any; depth: number }> = [];
    const walk = (nodes: any[] = [], parent: any = undefined, depth = 0) => {
      nodes.forEach(node => {
        rows.push({ node, parent, depth });
        walk(node.subcategories || [], node, depth + 1);
      });
    };
    categories.forEach(category => {
      rows.push({ node: category, parent: undefined, depth: 0 });
      walk(category.subcategories || [], category, 1);
    });
    return rows;
  }, [categories]);

  const activeCategoryEntry = categoryIndex.find(entry => entry.node.slug === selectedCategory);
  const activeCategoryObj: any = activeCategoryEntry?.node;
  const activeCategoryChildren: any[] = activeCategoryObj?.subcategories || [];

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
      // 0. Optional catalog shortcut filters from navigation.
      if (specialMode === 'maintenance' && !p.isMaintenancePart) return false;
      if (specialMode === 'bestseller' && !p.isBestSeller) return false;

      // 1. Category Filter
      if (
        selectedCategory !== 'all' &&
        p.categorySlug !== selectedCategory &&
        p.subcategorySlug !== selectedCategory
      ) {
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

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedManufacturer('all');
    setSelectedGrade('all');
    setOnlyInStock(false);
    setOnlyFitActiveVehicle(Boolean(selectedVehicle));
    setSpecialMode('all');
  };

  return (
    <div className="shop-view max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Category / Catalog Hero */}
      <section
        className={`shop-category-hero relative overflow-hidden border border-neutral-200 shadow-xs ${activeCategoryObj?.imageUrl ? 'has-image' : ''}`}
        style={activeCategoryObj?.imageUrl ? {
          backgroundImage: `linear-gradient(90deg, rgba(10,18,28,.88), rgba(10,18,28,.50)), url(${activeCategoryObj.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      >
        <div className="shop-category-hero-content">
          <span className="shop-category-kicker">{activeCategoryObj ? 'دسته‌بندی قطعات' : 'فروشگاه تخصصی قطعات'}</span>
          <h1>
            {activeCategoryObj?.heroTitle || (activeCategoryObj ? `قطعات ${activeCategoryObj.nameFa}` : 'فهرست کامل قطعات یدکی خودروهای چینی')}
          </h1>
          <p>
            {activeCategoryObj?.heroSubtitle || activeCategoryObj?.description || `نمایش ${filteredProducts.length.toLocaleString('fa-IR')} قطعه با امکان فیلتر بر اساس خودرو، برند و گرید کیفی.`}
          </p>
          {activeCategoryObj && (
            <div className="shop-category-hero-meta">
              <span>{filteredProducts.length.toLocaleString('fa-IR')} محصول</span>
              {activeCategoryEntry?.parent && <span>زیرمجموعه {activeCategoryEntry.parent.nameFa}</span>}
            </div>
          )}
        </div>

        <div className="shop-category-vehicle-card">
          <Car className="w-5 h-5" />
          <div>
            {selectedVehicle ? (
              <>
                <small>خودروی فعال</small>
                <strong>{selectedVehicle.modelName} ({selectedVehicle.year})</strong>
              </>
            ) : (
              <>
                <small>فیتمنت دقیق قطعات</small>
                <strong>خودروی خود را انتخاب کنید</strong>
              </>
            )}
          </div>
          <button type="button" onClick={onOpenVehicleModal}>{selectedVehicle ? 'تغییر' : 'انتخاب'}</button>
        </div>
      </section>

      {activeCategoryChildren.length > 0 && (
        <div className="shop-category-children">
          {activeCategoryChildren.map(child => (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedCategory(child.slug)}
              className={selectedCategory === child.slug ? 'active' : ''}
            >
              {child.iconUrl && <img src={child.iconUrl} alt="" />}
              <span>{child.nameFa}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="shop-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
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
              {categoryIndex.map(({ node: c, depth }) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-right p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === c.slug
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                  style={{ paddingRight: `${8 + depth * 12}px` }}
                >
                  <span>{depth > 0 ? '↳ ' : ''}{c.nameFa}</span>
                  <span className="text-[10px] opacity-75">
                    {products.filter(p => p.categorySlug === c.slug || p.subcategorySlug === c.slug).length}
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
          {specialMode !== 'all' && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
              <div>
                <strong className="text-blue-900">
                  {specialMode === 'maintenance' ? 'فیلتر فعال: قطعات مصرفی و سرویس دوره‌ای' : 'فیلتر فعال: محصولات پرفروش'}
                </strong>
                <span className="block mt-1 text-blue-700">
                  این فیلتر از لینک منو اعمال شده و هر زمان بخواهید قابل حذف است.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSpecialMode('all')}
                className="shrink-0 rounded-xl bg-white px-3 py-2 font-bold text-blue-700 border border-blue-200"
              >
                حذف فیلتر
              </button>
            </div>
          )}

          {/* Sorting Bar */}
          <div className="shop-mobile-toolbar bg-white p-3.5 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="text-neutral-500 font-semibold shrink-0">مرتب‌سازی:</span>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="sm:hidden flex-1 min-w-0 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 font-bold text-neutral-800"
                aria-label="مرتب‌سازی محصولات"
              >
                <option value="bestseller">پرفروش‌ترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="rating">بالاترین امتیاز</option>
              </select>

              <div className="hidden sm:flex flex-wrap gap-1">
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

            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden w-full sm:w-auto px-3.5 py-2.5 bg-neutral-100 rounded-xl text-neutral-800 font-bold flex items-center justify-center gap-1.5"
              aria-expanded={isMobileFilterOpen}
            >
              <Filter className="w-4 h-4 text-red-600" />
              <span>{isMobileFilterOpen ? 'بستن فیلترها' : 'فیلترها'} ({filteredProducts.length})</span>
            </button>
          </div>

          {isMobileFilterOpen && (
            <div className="lg:hidden mobile-filter-panel bg-white rounded-2xl border border-neutral-200 p-4 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-neutral-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-600" />
                  فیلتر محصولات
                </h3>
                <button type="button" onClick={resetAllFilters} className="text-[11px] font-bold text-red-600">پاک‌سازی</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 sm:col-span-1">
                  <span className="block text-[11px] font-bold text-neutral-700 mb-1">دسته‌بندی</span>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-xs">
                    <option value="all">همه دسته‌ها</option>
                    {categoryIndex.map(({ node: category, depth }) => <option key={category.id} value={category.slug}>{'— '.repeat(depth)}{category.nameFa}</option>)}
                  </select>
                </label>

                <label className="col-span-2 sm:col-span-1">
                  <span className="block text-[11px] font-bold text-neutral-700 mb-1">برند خودرو</span>
                  <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-xs">
                    <option value="all">همه برندها</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.nameFa}</option>)}
                  </select>
                </label>

                <label className="col-span-2 sm:col-span-1">
                  <span className="block text-[11px] font-bold text-neutral-700 mb-1">برند سازنده قطعه</span>
                  <select value={selectedManufacturer} onChange={e => setSelectedManufacturer(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-xs">
                    <option value="all">همه سازندگان</option>
                    {availableManufacturers.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>

                <label className="col-span-2 sm:col-span-1">
                  <span className="block text-[11px] font-bold text-neutral-700 mb-1">گرید کیفیت</span>
                  <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value as QualityGrade | 'all')} className="w-full p-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-xs">
                    <option value="all">همه گریدها</option>
                    <option value="genuine">اصلی / Genuine</option>
                    <option value="oem">OEM</option>
                    <option value="aftermarket">Aftermarket</option>
                    <option value="economy">اقتصادی</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-bold text-[11px]">
                  <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} className="w-4 h-4" />
                  فقط کالاهای موجود
                </label>
                {selectedVehicle && (
                  <label className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-bold text-[11px]">
                    <input type="checkbox" checked={onlyFitActiveVehicle} onChange={e => setOnlyFitActiveVehicle(e.target.checked)} className="w-4 h-4" />
                    فقط سازگار با خودروی من
                  </label>
                )}
              </div>

              <button type="button" onClick={() => setIsMobileFilterOpen(false)} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-black text-xs">
                نمایش {filteredProducts.length.toLocaleString('fa-IR')} محصول
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
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

      {activeCategoryObj && (activeCategoryObj.bottomDescription || activeCategoryObj.description) && (
        <section className="shop-category-seo-content">
          <div className="shop-category-seo-heading">
            <Layers className="w-5 h-5" />
            <h2>راهنمای خرید و اطلاعات {activeCategoryObj.nameFa}</h2>
          </div>
          {/<[a-z][\s\S]*>/i.test(activeCategoryObj.bottomDescription || activeCategoryObj.description || '') ? (
            <div
              className="shop-category-seo-body"
              dangerouslySetInnerHTML={{
                __html: sanitizeEmbedHtml(activeCategoryObj.bottomDescription || activeCategoryObj.description || '')
              }}
            />
          ) : (
            <RichTextContent
              value={activeCategoryObj.bottomDescription || activeCategoryObj.description || ''}
              className="shop-category-seo-body"
            />
          )}
        </section>
      )}
    </div>
  );
};
