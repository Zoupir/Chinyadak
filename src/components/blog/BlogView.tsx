import React from 'react';
import { ARTICLES } from '../../data/mockData';
import { Article } from '../../types';
import { BookOpen, Clock, User, ArrowLeft, Layers, Sparkles } from 'lucide-react';

interface BlogViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Blog Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>مرجع مقالات و راهنماهای فنی خودروهای چینی</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-neutral-900">
          دانشنامه فنی و عیب‌یابی خودروهای چینی
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
          آموزش‌های نگهداری پیشگیرانه، انتخاب روانکارهای مناسب پیشرانه‌های توربو GDI، تشخیص علائم خرابی واترپمپ، زنجیر تایم و جلوبندی
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ARTICLES.map((article) => (
          <article
            key={article.id}
            onClick={() => onNavigate('article', article.id)}
            className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:border-red-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="aspect-16/10 overflow-hidden bg-neutral-100 relative">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-neutral-900/90 text-white px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {article.category}
                </span>
              </div>

              <div className="p-6 space-y-3 text-right">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.readTimeMinutes} دقیقه مطالعه</span>
                  <span>·</span>
                  <span>{article.date}</span>
                </div>

                <h2 className="font-bold text-base text-neutral-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h2>

                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-red-600">
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
    </div>
  );
};
