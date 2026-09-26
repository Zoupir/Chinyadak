import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Article } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Clock, 
  User, 
  Sparkles, 
  Check, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const AdminArticlesTab: React.FC = () => {
  const { 
    articles, 
    addArticle, 
    updateArticle, 
    deleteArticle, 
    models, 
    products, 
    showToast 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<Partial<Article>>({
    title: '',
    slug: '',
    category: 'آموزش و نگهداری',
    summary: '',
    content: '',
    author: 'مهندس فنی چین‌پارت',
    readTimeMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    relatedModelIds: [],
    relatedProductIds: [],
    faq: []
  });

  const categories = Array.from(new Set(articles.map(a => a.category)));

  const filteredArticles = articles.filter(a => {
    const matchesCat = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
    const matchesSearch = a.title.includes(searchQuery) || a.summary.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const handleOpenNew = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      slug: '',
      category: 'آموزش و نگهداری',
      summary: '',
      content: '',
      author: 'تیم فنی چین‌پارت',
      readTimeMinutes: 6,
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      relatedModelIds: [models[0]?.id || 'kmc-j7'],
      relatedProductIds: [products[0]?.id || 'prod-water-pump-kmc-j7'],
      faq: [
        { q: 'هر چند وقت یکبار باید این قطعه تعویض شود؟', a: 'طبق دفترچه سرویس دوره‌ای هر ۴۰ تا ۵۰ هزار کیلومتر توصیه می‌شود.' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleEdit = (art: Article) => {
    setEditingArticle(art);
    setArticleForm(art);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content) {
      showToast('عنوان و متن کامل مقاله الزامی است.', 'error');
      return;
    }

    const generatedSlug = (articleForm.slug || articleForm.title)
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (editingArticle) {
      updateArticle({
        ...editingArticle,
        ...articleForm as Article,
        slug: generatedSlug || editingArticle.slug
      });
    } else {
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: articleForm.title,
        slug: generatedSlug || `article-${Date.now()}`,
        category: articleForm.category || 'آموزش و نگهداری',
        summary: articleForm.summary || '',
        content: articleForm.content,
        author: articleForm.author || 'واحد فنی چین‌پارت',
        date: new Date().toLocaleDateString('fa-IR'),
        readTimeMinutes: Number(articleForm.readTimeMinutes) || 5,
        imageUrl: articleForm.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
        relatedModelIds: articleForm.relatedModelIds || [],
        relatedProductIds: articleForm.relatedProductIds || [],
        faq: articleForm.faq || []
      };
      addArticle(newArticle);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`آیا از حذف مقاله "${title}" اطمینان دارید؟`)) {
      deleteArticle(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              مدیریت محتوای آموزشی و سئو (Blog CMS)
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            <span>مدیریت مقالات، وبلاگ و راهنماهای فنی خودرو</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            انتشار و ویرایش مقالات تخصصی، آموزش تعویض قطعات و اتصال مستقیم مقالات به محصولات مرتبط جهت افزایش فروش
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>نگارش و انتشار مقاله جدید</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-neutral-600">دسته‌بندی:</label>
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="p-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800"
          >
            <option value="all">همه دسته‌ها ({articles.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان مقاله..."
            className="pr-9 pl-3 py-2 border border-neutral-200 rounded-xl text-xs focus:border-red-600 focus:outline-hidden w-64"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(art => (
          <div 
            key={art.id}
            className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-neutral-100 overflow-hidden">
                <img 
                  src={art.imageUrl} 
                  alt={art.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                  {art.category}
                </div>
                <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{art.readTimeMinutes} دقیقه</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-black text-sm text-neutral-900 leading-snug line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{art.author}</span>
                  </span>
                  <span>{art.date}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-neutral-400 font-mono">شناسه: {art.id}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEdit(art)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>ویرایش</span>
                </button>
                <button
                  onClick={() => handleDelete(art.id, art.title)}
                  className="p-1.5 bg-white hover:bg-red-50 border border-neutral-200 text-red-600 rounded-xl transition-colors"
                  title="حذف مقاله"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL: ADD / EDIT ARTICLE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <span>{editingArticle ? 'ویرایش مقاله و راهنمای تخصصی' : 'نگارش و انتشار مقاله جدید'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان مقاله (سئو محور):</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="مثال: راهنمای کامل تعویض واترپمپ KMC J7 و علائم خرابی"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">دسته‌بندی مقاله:</label>
                  <input
                    type="text"
                    value={articleForm.category}
                    onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}
                    placeholder="آموزش و نگهداری"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نویسنده / کارشناس فنی:</label>
                  <input
                    type="text"
                    value={articleForm.author}
                    onChange={e => setArticleForm({ ...articleForm, author: e.target.value })}
                    placeholder="مهندس فنی چین‌پارت"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">زمان تخمینی مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    value={articleForm.readTimeMinutes}
                    onChange={e => setArticleForm({ ...articleForm, readTimeMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">آدرس عکس شاخص مقاله:</label>
                  <input
                    type="url"
                    value={articleForm.imageUrl}
                    onChange={e => setArticleForm({ ...articleForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  توضیحات کوتاه / خلاصه مقاله (نمایش در کارت‌های وبلاگ و سئو گوگل) *:
                </label>
                <textarea
                  rows={2}
                  value={articleForm.summary}
                  onChange={e => setArticleForm({ ...articleForm, summary: e.target.value })}
                  placeholder="خلاصه ۲-۳ خطی از نکات کلیدی، عیب‌یابی و نحوه تعویض قطعه..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <RichTextEditor
                  label="متن بلند و کامل مقاله (همراه با ویرایشگر حرفه‌ای و پیش‌نمایش زنده) *"
                  value={articleForm.content || ''}
                  onChange={val => setArticleForm({ ...articleForm, content: val })}
                  rows={8}
                  placeholder="متن کامل آموزش، علائم خرابی، دستورالعمل گام‌به‌گام و ابزارهای مورد نیاز..."
                  helperText="می‌توانید با دکمه‌های فرمت‌دهی بالا، متن را بولد، تیتربندی (H2, H3)، بالت‌دار یا جدول‌بندی کنید."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  ذخیره و انتشار مقاله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
