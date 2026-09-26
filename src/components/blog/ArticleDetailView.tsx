import React from 'react';
import { ARTICLES } from '../../data/mockData';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { Clock, User, ArrowRight, Share2, HelpCircle, BookOpen, Layers } from 'lucide-react';

interface ArticleDetailViewProps {
  articleId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ articleId, onNavigate }) => {
  const { products } = useStore();
  const article = ARTICLES.find(a => a.id === articleId || a.slug === articleId) || ARTICLES[0];

  const linkedProducts = products.filter(p => article.relatedProductIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => onNavigate('home')} className="hover:text-red-600">خانه</button>
        <span>/</span>
        <button onClick={() => onNavigate('blog')} className="hover:text-red-600">وبلاگ فنی</button>
        <span>/</span>
        <span className="text-neutral-900 font-bold truncate max-w-xs">{article.title}</span>
      </div>

      {/* Header Info */}
      <div className="space-y-4 text-right">
        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 text-red-700">
          {article.category}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1 border-b border-neutral-100 pb-4">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>{article.author}</span>
          </span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>زمان مطالعه: {article.readTimeMinutes} دقیقه</span>
          </span>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="rounded-3xl overflow-hidden aspect-16/9 border border-neutral-200 shadow-md">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-xs space-y-6 text-sm text-neutral-700 leading-relaxed">
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-800 font-semibold text-xs leading-relaxed">
          {article.summary}
        </div>

        <div className="space-y-4 whitespace-pre-line text-neutral-800 text-xs sm:text-sm">
          {article.content}
        </div>
      </div>

      {/* Linked Products Mentioned in Article */}
      {linkedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600" />
              <span>قطعات اورجینال مطرح شده در این مقاله:</span>
            </h3>
            <span className="text-xs text-neutral-400">تطبیق داده شده با استاندارد کارخانه</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedProducts.map(p => (
              <ProductCard key={p.id} product={p} onViewDetails={(id) => onNavigate('product', id)} />
            ))}
          </div>
        </section>
      )}

      {/* Article FAQs */}
      {article.faq && article.faq.length > 0 && (
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4">
          <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-600" />
            <span>سؤالات متداول مرتبط با این موضوع</span>
          </h3>
          <div className="space-y-3">
            {article.faq.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <h4 className="font-bold text-xs text-neutral-900">{item.q}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
