import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ArrowLeft,
  BookOpen,
  Car,
  Factory,
  FileText,
  Layers,
  PackageSearch,
  Search,
  Tag,
  X
} from 'lucide-react';
import { formatToman } from '../../utils/formatters';
import { apiRequest } from '../../api/client';
import type { Product } from '../../types';

interface SearchAutocompleteProps {
  onSelectProduct: (productId: string) => void;
  onSelectModel: (modelId: string) => void;
  onSelectCategory: (categorySlug: string) => void;
  onSelectArticle: (articleId: string) => void;
  onSelectBrand?: (brandSlug: string) => void;
  onRequestPart: (query: string) => void;
}

type RankedResult =
  | { type: 'product'; score: number; item: any }
  | { type: 'model'; score: number; item: any }
  | { type: 'category'; score: number; item: any }
  | { type: 'article'; score: number; item: any }
  | { type: 'brand'; score: number; item: any };

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[إأآ]/g, 'ا')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokensOf = (value: string) => normalize(value).split(' ').filter(Boolean);

const scoreText = (query: string, value: unknown, exactBoost = 80, prefixBoost = 42, containsBoost = 18) => {
  const q = normalize(query);
  const v = normalize(value);
  if (!q || !v) return 0;
  if (v === q) return exactBoost;
  if (v.startsWith(q)) return prefixBoost;
  if (v.includes(q)) return containsBoost;
  const tokens = tokensOf(q);
  if (!tokens.length) return 0;
  const hits = tokens.filter(token => v.includes(token)).length;
  return hits === tokens.length ? Math.max(8, hits * 8) : hits * 3;
};

const flattenCategories = (categories: any[]) => {
  const rows: any[] = [];
  const walk = (nodes: any[] = [], trail: string[] = []) => {
    nodes.forEach(node => {
      rows.push({ ...node, trail });
      walk(node.subcategories || [], [...trail, node.nameFa || node.nameEn || '']);
    });
  };
  categories.forEach(root => {
    rows.push({ ...root, trail: [] });
    walk(root.subcategories || [], [root.nameFa || root.nameEn || '']);
  });
  return rows;
};

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  onSelectProduct,
  onSelectModel,
  onSelectCategory,
  onSelectArticle,
  onSelectBrand,
  onRequestPart
}) => {
  const { products, models, categories, brands, articles, logSearch } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = normalize(query);
    if (q.length < 2) {
      setRemoteProducts([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      apiRequest<{ products: Product[] }>(
        `/api/catalog/products?q=${encodeURIComponent(query.trim())}&page=1&limit=20`,
        { signal: controller.signal }
      )
        .then(result => setRemoteProducts(result.products))
        .catch(error => {
          if (!controller.signal.aborted) console.error('Remote catalog search failed:', error);
        });
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const ranked = useMemo<RankedResult[]>(() => {
    const q = normalize(query);
    if (q.length < 2) return [];

    const categoryRows = flattenCategories(categories);

    const mergedProducts = Array.from(
      new Map([...remoteProducts, ...products].map(product => [product.id, product])).values()
    );

    const productResults: RankedResult[] = mergedProducts.map(product => {
      let score = 0;
      score += scoreText(q, product.oemNumber, 160, 110, 75);
      score += scoreText(q, product.partNumber, 150, 100, 70);
      score += scoreText(q, product.sku, 140, 95, 65);
      score += scoreText(q, product.nameFa, 115, 80, 48);
      score += scoreText(q, product.nameEn, 105, 72, 42);
      score += scoreText(q, product.brandManufacturer, 75, 50, 28);
      score += scoreText(q, product.partManufacturerCompany, 75, 50, 28);
      score += scoreText(q, product.vehicleManufacturerCompany, 55, 35, 20);
      score += scoreText(q, product.shortDescription, 30, 20, 12);
      score += scoreText(q, product.description, 20, 12, 8);
      for (const fitment of product.fitments || []) {
        score += scoreText(q, fitment.brandName, 38, 26, 16);
        score += scoreText(q, fitment.modelName, 55, 35, 22);
        score += scoreText(q, fitment.engine, 40, 25, 16);
        score += scoreText(q, fitment.engineCode, 60, 40, 25);
      }
      const category = categoryRows.find(item => item.slug === product.subcategorySlug || item.slug === product.categorySlug);
      if (category) score += scoreText(q, [category.nameFa, category.nameEn, ...(category.trail || [])].join(' '), 35, 24, 14);
      return { type: 'product', score, item: product } as RankedResult;
    });

    const modelResults: RankedResult[] = models.map(model => {
      const brand = brands.find(item => item.id === model.brandId);
      let score = 0;
      score += scoreText(q, model.nameFa, 105, 72, 44);
      score += scoreText(q, model.nameEn, 100, 68, 40);
      score += scoreText(q, model.slug, 70, 45, 25);
      score += scoreText(q, model.engineSummary, 45, 28, 16);
      score += scoreText(q, model.specifications?.engineCode, 70, 45, 28);
      score += scoreText(q, brand?.nameFa, 45, 28, 18);
      score += scoreText(q, brand?.nameEn, 42, 26, 16);
      return { type: 'model', score, item: model } as RankedResult;
    });

    const categoryResults: RankedResult[] = categoryRows.map(category => {
      let score = 0;
      score += scoreText(q, category.nameFa, 90, 62, 36);
      score += scoreText(q, category.nameEn, 82, 55, 32);
      score += scoreText(q, category.slug, 55, 35, 22);
      score += scoreText(q, category.description, 24, 16, 10);
      score += scoreText(q, (category.trail || []).join(' '), 35, 22, 14);
      return { type: 'category', score, item: category } as RankedResult;
    });

    const brandResults: RankedResult[] = brands.map(brand => {
      let score = 0;
      score += scoreText(q, brand.nameFa, 95, 64, 38);
      score += scoreText(q, brand.nameEn, 90, 60, 35);
      score += scoreText(q, brand.officialRepresentative, 50, 32, 20);
      score += scoreText(q, brand.description, 22, 14, 8);
      return { type: 'brand', score, item: brand } as RankedResult;
    });

    const articleResults: RankedResult[] = articles.map(article => {
      let score = 0;
      score += scoreText(q, article.title, 85, 58, 34);
      score += scoreText(q, article.summary, 35, 24, 14);
      score += scoreText(q, article.category, 30, 20, 12);
      score += scoreText(q, article.content, 14, 10, 6);
      return { type: 'article', score, item: article } as RankedResult;
    });

    return [...productResults, ...modelResults, ...categoryResults, ...brandResults, ...articleResults]
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
  }, [query, products, remoteProducts, models, categories, brands, articles]);

  const byType = <T extends RankedResult['type']>(type: T, count: number) =>
    ranked.filter(result => result.type === type).slice(0, count) as Extract<RankedResult, {type:T}>[];

  const productResults = byType('product', 6);
  const modelResults = byType('model', 3);
  const categoryResults = byType('category', 3);
  const brandResults = byType('brand', 3);
  const articleResults = byType('article', 3);

  const totalResults = ranked.length;
  const cleanQ = normalize(query);

  const select = (result: RankedResult) => {
    logSearch(query, totalResults);
    if (result.type === 'product') onSelectProduct(result.item.id);
    if (result.type === 'model') onSelectModel(result.item.id);
    if (result.type === 'category') onSelectCategory(result.item.slug);
    if (result.type === 'article') onSelectArticle(result.item.id);
    if (result.type === 'brand') {
      if (onSelectBrand) onSelectBrand(result.item.slug);
      else onRequestPart(query);
    }
    setIsOpen(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cleanQ) return;
    logSearch(query, totalResults);
    if (ranked[0]) select(ranked[0]);
    else onRequestPart(query);
  };

  const ResultRow = ({ result }: { result: RankedResult }) => {
    const item = result.item;
    const meta =
      result.type === 'product' ? [item.oemNumber && `OEM: ${item.oemNumber}`, item.brandManufacturer].filter(Boolean).join(' • ') :
      result.type === 'model' ? item.engineSummary :
      result.type === 'category' ? [...(item.trail || []), item.nameFa].filter(Boolean).join(' ← ') :
      result.type === 'brand' ? item.officialRepresentative || item.nameEn :
      item.category;

    const image =
      result.type === 'product' ? item.images?.[0] :
      result.type === 'model' ? item.imageUrl :
      result.type === 'category' ? (item.iconUrl || item.imageUrl) :
      result.type === 'brand' ? item.logo :
      item.imageUrl;

    const Icon =
      result.type === 'product' ? PackageSearch :
      result.type === 'model' ? Car :
      result.type === 'category' ? Layers :
      result.type === 'brand' ? Factory :
      BookOpen;

    return (
      <button type="button" onClick={() => select(result)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 text-right group border border-transparent hover:border-neutral-200">
        <div className="w-11 h-11 rounded-lg border bg-white overflow-hidden grid place-items-center shrink-0">
          {image ? <img src={image} alt="" className="w-full h-full object-contain" /> : <Icon className="w-5 h-5 text-neutral-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-xs text-neutral-900 group-hover:text-red-600 truncate">
            {result.type === 'product' ? item.nameFa : result.type === 'article' ? item.title : item.nameFa}
          </strong>
          <span className="block mt-1 text-[9px] text-neutral-500 truncate">{meta}</span>
        </div>
        {result.type === 'product' && (
          <strong className="shrink-0 text-[10px] text-neutral-900">{formatToman(item.discountPrice || item.price)}</strong>
        )}
        <ArrowLeft className="w-3.5 h-3.5 text-neutral-300 group-hover:text-red-600 shrink-0" />
      </button>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} className="relative flex items-center">
        <input
          type="search"
          value={query}
          onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="نام قطعه، OEM، SKU، برند، مدل خودرو، کد موتور یا مقاله..."
          autoComplete="off"
          className="w-full h-11 md:h-12 pr-11 pl-24 text-xs md:text-sm bg-white text-neutral-900 rounded-xl border border-neutral-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/10 focus:outline-none transition-all"
        />
        <Search className="w-5 h-5 text-neutral-400 absolute right-3 pointer-events-none" />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute left-16 p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit" className="absolute left-1.5 h-8 md:h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
          <span>جستجو</span><Search className="w-3.5 h-3.5" />
        </button>
      </form>

      {isOpen && cleanQ.length > 1 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 z-[170] overflow-hidden max-h-[75vh] overflow-y-auto">
          {totalResults ? (
            <div className="p-2">
              {productResults.length > 0 && (
                <section className="mb-2">
                  <div className="px-2 py-1.5 text-[9px] font-black text-neutral-400 flex items-center gap-1"><PackageSearch className="w-3 h-3" /> محصولات</div>
                  {productResults.map(result => <ResultRow key={`p-${result.item.id}`} result={result} />)}
                </section>
              )}
              {(modelResults.length > 0 || brandResults.length > 0) && (
                <section className="mb-2 border-t pt-2">
                  <div className="px-2 py-1.5 text-[9px] font-black text-neutral-400 flex items-center gap-1"><Car className="w-3 h-3" /> خودرو و برند</div>
                  {brandResults.map(result => <ResultRow key={`b-${result.item.id}`} result={result} />)}
                  {modelResults.map(result => <ResultRow key={`m-${result.item.id}`} result={result} />)}
                </section>
              )}
              {(categoryResults.length > 0 || articleResults.length > 0) && (
                <section className="border-t pt-2">
                  <div className="px-2 py-1.5 text-[9px] font-black text-neutral-400 flex items-center gap-1"><FileText className="w-3 h-3" /> دسته‌بندی و دانشنامه</div>
                  {categoryResults.map(result => <ResultRow key={`c-${result.item.id}`} result={result} />)}
                  {articleResults.map(result => <ResultRow key={`a-${result.item.id}`} result={result} />)}
                </section>
              )}
            </div>
          ) : (
            <div className="p-7 text-center">
              <Tag className="w-7 h-7 mx-auto text-neutral-300" />
              <strong className="block mt-2 text-xs">نتیجه دقیقی پیدا نشد</strong>
              <p className="text-[9px] text-neutral-400 mt-1">می‌توانی درخواست استعلام همین عبارت را ثبت کنی.</p>
              <button type="button" onClick={() => { onRequestPart(query); setIsOpen(false); }} className="mt-3 px-4 py-2 rounded-xl bg-neutral-900 text-white text-[10px] font-bold">
                استعلام «{query}»
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
