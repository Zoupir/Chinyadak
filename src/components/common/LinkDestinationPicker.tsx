import React, { useMemo, useState } from 'react';
import { Link2, Search, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface LinkDestinationPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

type DestinationType =
  | 'home'
  | 'shop'
  | 'page'
  | 'product'
  | 'category'
  | 'brand'
  | 'model'
  | 'article'
  | 'article-category'
  | 'custom';

interface DestinationOption {
  id: string;
  title: string;
  subtitle?: string;
  value: string;
  type: DestinationType;
}

const flattenCategories = (categories: any[]): any[] => {
  const result: any[] = [];
  const walk = (nodes: any[], depth = 0) => {
    for (const node of nodes || []) {
      result.push({ ...node, __depth: depth });
      walk(node.subcategories || [], depth + 1);
    }
  };
  walk(categories || []);
  return result;
};

const typeTitle: Record<DestinationType, string> = {
  home: 'صفحه اصلی',
  shop: 'فروشگاه',
  page: 'برگه',
  product: 'محصول',
  category: 'دسته‌بندی قطعات',
  brand: 'برند خودرو',
  model: 'مدل خودرو',
  article: 'مقاله',
  'article-category': 'دسته‌بندی مقالات',
  custom: 'لینک دلخواه'
};

export const LinkDestinationPicker: React.FC<LinkDestinationPickerProps> = ({
  label = 'مقصد لینک',
  value = '',
  onChange,
  className = ''
}) => {
  const { pages, products, categories, brands, models, articles, articleCategories } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DestinationType>('product');
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(value);

  const options = useMemo<DestinationOption[]>(() => {
    const rows: DestinationOption[] = [
      { id: 'home', title: 'صفحه اصلی', value: 'home', type: 'home' },
      { id: 'shop', title: 'فروشگاه / همه محصولات', value: 'shop', type: 'shop' }
    ];

    pages.forEach(page => rows.push({
      id: `page-${page.id}`,
      title: page.title,
      subtitle: `/${page.slug}`,
      value: `page:${page.slug}`,
      type: 'page'
    }));

    products.forEach(product => rows.push({
      id: `product-${product.id}`,
      title: product.nameFa,
      subtitle: product.oemNumber || product.sku || product.slug,
      value: `product:${product.slug || product.id}`,
      type: 'product'
    }));

    flattenCategories(categories).forEach(category => rows.push({
      id: `category-${category.id}`,
      title: `${'— '.repeat(category.__depth || 0)}${category.nameFa}`,
      subtitle: category.slug,
      value: `category:${category.slug}`,
      type: 'category'
    }));

    brands.forEach(brand => rows.push({
      id: `brand-${brand.id}`,
      title: brand.nameFa,
      subtitle: brand.nameEn,
      value: `car-brand:${brand.slug || brand.id}`,
      type: 'brand'
    }));

    models.forEach(model => rows.push({
      id: `model-${model.id}`,
      title: model.nameFa,
      subtitle: model.slug,
      value: `car-model:${model.slug || model.id}`,
      type: 'model'
    }));

    articles.forEach(article => rows.push({
      id: `article-${article.id}`,
      title: article.title,
      subtitle: article.category,
      value: `article:${article.slug || article.id}`,
      type: 'article'
    }));

    articleCategories.forEach(category => rows.push({
      id: `article-category-${category.id}`,
      title: category.name,
      subtitle: category.slug,
      value: `blog:${category.slug || category.id}`,
      type: 'article-category'
    }));

    return rows;
  }, [pages, products, categories, brands, models, articles, articleCategories]);

  const selected = useMemo(
    () => options.find(item => item.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(item => {
      if (item.type !== type) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        String(item.subtitle || '').toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    });
  }, [options, query, type]);

  const choose = (next: string) => {
    onChange(next);
    setCustom(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={className}>
      <span className="block text-[10px] font-bold text-neutral-700 mb-1">{label}</span>
      <button
        type="button"
        onClick={() => {
          setCustom(value);
          setOpen(true);
        }}
        className="w-full min-h-10 px-3 py-2 border border-neutral-300 rounded-xl bg-white text-right flex items-center justify-between gap-3 hover:border-blue-500"
      >
        <span className="min-w-0">
          <strong className="block text-[10px] truncate">
            {selected?.title || (value ? 'لینک تنظیم‌شده' : 'انتخاب مقصد')}
          </strong>
          <small className="block text-[8px] text-neutral-400 truncate mt-0.5" dir="ltr">
            {selected?.subtitle || value || 'بدون لینک'}
          </small>
        </span>
        <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[270] bg-black/60 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" dir="rtl" onClick={event => event.stopPropagation()}>
            <header className="h-16 px-5 border-b flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-black text-sm">انتخاب مقصد لینک</h3>
                <p className="text-[9px] text-neutral-500 mt-1">بدون نیاز به نوشتن آدرس یا کار با لینک‌های کدشده</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 grid place-items-center rounded-xl bg-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-4 border-b bg-neutral-50 flex flex-wrap gap-2">
              {(Object.keys(typeTitle) as DestinationType[]).map(id => (
                <button
                  type="button"
                  key={id}
                  onClick={() => { setType(id); setQuery(''); }}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black border ${type === id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}
                >
                  {typeTitle[id]}
                </button>
              ))}
            </div>

            {type === 'custom' ? (
              <div className="p-6 space-y-3">
                <label className="block">
                  <span className="block text-xs font-bold mb-2">آدرس دلخواه</span>
                  <input
                    value={custom}
                    onChange={event => setCustom(event.target.value)}
                    dir="ltr"
                    className="w-full p-3 border rounded-xl text-left font-mono text-xs"
                    placeholder="https://example.com یا tel:..."
                  />
                </label>
                <p className="text-[9px] text-neutral-500">برای لینک داخلی سایت بهتر است از گزینه‌های بالا استفاده شود تا تغییر اسلاگ یا حروف فارسی مشکلی ایجاد نکند.</p>
                <button type="button" disabled={!custom.trim()} onClick={() => choose(custom.trim())} className="px-5 py-2.5 rounded-xl bg-blue-600 disabled:bg-neutral-300 text-white text-xs font-black">
                  انتخاب این لینک
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      className="w-full h-11 pr-10 pl-3 border rounded-xl text-xs"
                      placeholder={`جستجو در ${typeTitle[type]}...`}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filtered.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => choose(item.value)}
                        className={`p-3 rounded-xl border text-right hover:border-blue-500 hover:bg-blue-50/40 ${item.value === value ? 'border-blue-600 bg-blue-50' : 'border-neutral-200'}`}
                      >
                        <strong className="block text-[10px]">{item.title}</strong>
                        {item.subtitle && <span className="block mt-1 text-[8px] text-neutral-400 truncate" dir="ltr">{item.subtitle}</span>}
                      </button>
                    ))}
                  </div>
                  {!filtered.length && <div className="py-14 text-center text-xs text-neutral-400">موردی پیدا نشد.</div>}
                </div>
              </>
            )}

            <footer className="p-3 border-t flex items-center justify-between gap-2">
              <button type="button" onClick={() => choose('')} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-[10px] font-bold">حذف لینک</button>
              <span className="text-[8px] text-neutral-400">مقصد فعلی: <b dir="ltr">{value || 'بدون لینک'}</b></span>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
