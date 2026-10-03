import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BookOpen, Clock, User, ArrowLeft, Layers, Sparkles, Filter, Wrench, ShieldCheck } from 'lucide-react';
import { BlogCatalogSidebar } from './BlogCatalogSidebar';

interface BlogViewProps {
  onNavigate: (view: string, param?: string) => void;
  initialCategory?: string;
}

export const BlogView: React.FC<BlogViewProps> = ({ onNavigate, initialCategory }) => {
  const { articles, articleCategories, categories } = useStore();

  const resolvedCategory = useMemo(() => {
    if (!initialCategory) return 'all';
    const match = articleCategories.find(c =>
      c.id === initialCategory || c.slug === initialCategory || c.name === initialCategory
    );
    return match?.id || 'all';
  }, [initialCategory, articleCategories]);

  const [selectedCategory, setSelectedCategory] = useState<string>(resolvedCategory);

  useEffect(() => {
    setSelectedCategory(resolvedCategory);
  }, [resolvedCategory]);

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.categoryId === selectedCategory || a.category === selectedCategory);

  const activeCategory = articleCategories.find(c => c.id === selectedCategory || c.name === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-6 text-right">
      <main className="lg:col-span-3 space-y-10">
      {/* Blog Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>مرجع مقالات و راهنماهای فنی خودروهای چینی</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-neutral-900">
          دانشنامه فنی، عیب‌یابی و مقالات تخصصی
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
          آموزش‌های نگهداری پیشگیرانه، راهنمای انتخاب روغن و قطعات توربو، عیب‌یابی گیربکس DCT و سیستم تعلیق
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
        <button
          onClick={() => onNavigate('blog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
          }`}
        >
          همه مقالات ({articles.length})
        </button>

        {articleCategories.map(cat => {
          const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
          const count = articles.filter(a => a.categoryId === cat.id || a.category === cat.name).length;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate('blog', cat.slug || cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Detail Banner (if selected) */}
      {activeCategory && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs bg-red-600/30 text-red-300 font-bold px-2.5 py-0.5 rounded-full border border-red-500/40">
              دسته‌بندی مقالات
            </span>
            <h2 className="text-xl sm:text-2xl font-black">{activeCategory.name}</h2>
            {activeCategory.description && (
              <p className="text-xs text-neutral-300 leading-relaxed">
                {activeCategory.description}
              </p>
            )}
          </div>
          {activeCategory.imageUrl && (
            <img 
              src={activeCategory.imageUrl} 
              alt={activeCategory.name} 
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl border border-neutral-700 shadow-md shrink-0" 
            />
          )}
        </div>
      )}

      {/* Articles Grid */}
      <div className="article-mobile-grid grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            onClick={() => onNavigate('article', article.id)}
            className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:border-red-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="aspect-16/10 overflow-hidden bg-neutral-100 relative">
                <img 
                  src={article.imageUrl}
                  alt={article.seo?.images?.[article.imageUrl]?.alt || article.title}
                  title={article.seo?.images?.[article.imageUrl]?.title || article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-neutral-900/90 text-white px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {article.category}
                </span>
              </div>

              <div className="p-3 sm:p-6 space-y-2 sm:space-y-3 text-right">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.readTimeMinutes} دقیقه مطالعه</span>
                  <span>·</span>
                  <span>{article.date}</span>
                </div>

                <h2 className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h2>

                <p className="hidden sm:block text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-6 pt-2 sm:pt-0 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-red-600">
              <span className="flex items-center gap-1.5 text-neutral-400 font-normal">
                <User className="w-3.5 h-3.5" />
                <span>{article.author}</span>
              </span>
              <span className="flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
                مطالعه کامل
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-3">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto" />
          <p className="text-sm font-bold text-neutral-700">مقاله‌ای در این دسته‌بندی یافت نشد.</p>
          <button
            onClick={() => onNavigate('blog')}
            className="text-xs text-red-600 font-bold hover:underline"
          >
            مشاهده تمام مقالات
          </button>
        </div>
      )}
      </main>
      <BlogCatalogSidebar articleCategories={articleCategories} categories={categories} onNavigate={onNavigate} />
    </div>
  );
};
