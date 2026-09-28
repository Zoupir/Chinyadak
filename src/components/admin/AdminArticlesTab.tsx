import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Article, ArticleCategory } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { ImageUploadInput } from '../common/ImageUploadInput';
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
  BookOpen,
  Layers,
  FolderPlus,
  Image as ImageIcon,
  Tag,
  Wrench,
  ShieldCheck,
  Car,
  AlertTriangle
} from 'lucide-react';

export const AdminArticlesTab: React.FC = () => {
  const { 
    articles, 
    articleCategories,
    addArticle, 
    updateArticle, 
    deleteArticle,
    addArticleCategory,
    updateArticleCategory,
    deleteArticleCategory,
    models, 
    products, 
    showToast 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'categories'>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Article Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<Partial<Article>>({
    title: '',
    slug: '',
    category: articleCategories[0]?.name || 'آموزش و نگهداری',
    categoryId: articleCategories[0]?.id || 'cat-maintenance',
    summary: '',
    content: '',
    author: 'مهندس فنی چین‌پارت',
    readTimeMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    relatedModelIds: [],
    relatedProductIds: [],
    faq: []
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ArticleCategory | null>(null);
  const [catForm, setCatForm] = useState<Partial<ArticleCategory>>({
    name: '',
    slug: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    icon: 'Wrench'
  });

  const filteredArticles = articles.filter(a => {
    const matchesCat = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
    const matchesSearch = a.title.includes(searchQuery) || a.summary.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  // Article handlers
  const handleOpenNew = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      slug: '',
      category: articleCategories[0]?.name || 'آموزش و نگهداری',
      categoryId: articleCategories[0]?.id || 'cat-maintenance',
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

    const matchedCat = articleCategories.find(c => c.id === articleForm.categoryId || c.name === articleForm.category);

    if (editingArticle) {
      updateArticle({
        ...editingArticle,
        ...articleForm as Article,
        category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
        categoryId: matchedCat ? matchedCat.id : articleForm.categoryId,
        slug: generatedSlug || editingArticle.slug
      });
    } else {
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: articleForm.title,
        slug: generatedSlug || `article-${Date.now()}`,
        category: matchedCat ? matchedCat.name : (articleForm.category || 'آموزش و نگهداری'),
        categoryId: matchedCat ? matchedCat.id : 'cat-maintenance',
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

  // Category handlers
  const handleOpenNewCategory = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      icon: 'Wrench'
    });
    setIsCatModalOpen(true);
  };

  const handleEditCategory = (cat: ArticleCategory) => {
    setEditingCat(cat);
    setCatForm(cat);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) {
      showToast('نام دسته‌بندی الزامی است.', 'error');
      return;
    }

    const generatedSlug = (catForm.slug || catForm.name)
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (editingCat) {
      updateArticleCategory({
        ...editingCat,
        name: catForm.name,
        slug: generatedSlug || editingCat.slug,
        description: catForm.description || '',
        imageUrl: catForm.imageUrl,
        icon: catForm.icon || 'Wrench'
      });
    } else {
      const newCat: ArticleCategory = {
        id: `acat-${Date.now()}`,
        name: catForm.name,
        slug: generatedSlug || `category-${Date.now()}`,
        description: catForm.description || '',
        imageUrl: catForm.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
        icon: catForm.icon || 'Wrench',
        articleCount: 0
      };
      addArticleCategory(newCat);
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`آیا از حذف دسته‌بندی مقالات "${name}" اطمینان دارید؟`)) {
      deleteArticleCategory(id);
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Banner with Subtab Switcher */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              مدیریت محتوای آموزشی و سئو (Blog CMS)
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            <span>مدیریت مقالات، وبلاگ و دسته‌بندی‌های تخصصی</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            امکان تعریف دسته‌بندی مقالات همراه با عکس و متن حرفه‌ای، نگارش مقالات تخصصی و اتصال مقالات به محصولات فروشگاه
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'articles'
                ? 'bg-white text-neutral-900 shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>مقالات و آموزش‌ها ({articles.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'categories'
                ? 'bg-white text-neutral-900 shadow-md'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-red-600" />
            <span>دسته‌بندی‌های مقالات ({articleCategories.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: ARTICLES LIST & MANAGEMENT
      ========================================================================= */}
      {activeSubTab === 'articles' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="جستجو در عنوان یا متن مقاله..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9 pl-4 py-2 border border-neutral-200 rounded-xl text-xs w-64 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="py-2 px-3 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-red-500"
              >
                <option value="all">تمامی دسته‌ها</option>
                {articleCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenNew}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>نگارش مقاله جدید</span>
            </button>
          </div>

          {/* Articles Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200">
                  <th className="p-3 w-16 text-center">تصویر</th>
                  <th className="p-3">عنوان مقاله و خلاصه</th>
                  <th className="p-3">دسته‌بندی</th>
                  <th className="p-3">نویسنده و تاریخ</th>
                  <th className="p-3 text-center">زمان مطالعه</th>
                  <th className="p-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredArticles.map(art => (
                  <tr key={art.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3 text-center">
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="w-12 h-10 object-cover rounded-lg border border-neutral-200 mx-auto" 
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-neutral-900 max-w-md line-clamp-1">{art.title}</div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{art.summary}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {art.category}
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">
                      <div className="font-medium text-neutral-800">{art.author}</div>
                      <div className="text-neutral-400 font-mono mt-0.5">{art.date}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-neutral-600">
                      {art.readTimeMinutes} دقیقه
                    </td>
                    <td className="p-3 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(art)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ویرایش مقاله"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id, art.title)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف مقاله"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ARTICLE CATEGORIES MANAGEMENT
      ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600" />
                <span>دسته‌بندی‌های وبلاگ و دانشنامه ({articleCategories.length} دسته)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                تعریف دسته‌بندی‌های محتوایی همراه با عکس شاخص، متن حرفه‌ای و نامک اختصاصی جهت تقویت سئو
              </p>
            </div>

            <button
              onClick={handleOpenNewCategory}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer self-start"
            >
              <FolderPlus className="w-4 h-4" />
              <span>افزودن دسته‌بندی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articleCategories.map(cat => {
              const countInCat = articles.filter(a => a.category === cat.name || a.categoryId === cat.id).length;
              return (
                <div 
                  key={cat.id} 
                  className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cat.imageUrl ? (
                        <img 
                          src={cat.imageUrl} 
                          alt={cat.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-neutral-200 bg-white shrink-0" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                          <Layers className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-sm text-neutral-900">{cat.name}</h4>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">slug: {cat.slug}</div>
                        <span className="inline-block mt-1 text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                          {countInCat} مقاله ثبت‌شده
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="ویرایش دسته‌بندی"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-neutral-600 leading-relaxed pt-1 border-t border-neutral-100">
                      {cat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT ARTICLE CATEGORY
      ========================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {editingCat ? `ویرایش دسته: ${editingCat.name}` : 'افزودن دسته‌بندی جدید مقالات'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">عنوان دسته‌بندی مقالات *:</label>
                <input
                  type="text"
                  value={catForm.name || ''}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="مثال: آموزش و نگهداری تخصصی"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">نامک انگلیسی (Slug برای URL):</label>
                <input
                  type="text"
                  value={catForm.slug || ''}
                  onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="maintenance-guide"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                />
              </div>

              {/* Category Image */}
              <ImageUploadInput
                label="عکس شاخص دسته‌بندی (همراه با پیش‌نمایش و آپلود):"
                value={catForm.imageUrl || ''}
                onChange={url => setCatForm({ ...catForm, imageUrl: url })}
                placeholder="https://..."
                helperText="تصویر مرتبط و باکیفیت برای نمایش در صفحه دانشنامه و هدر دسته‌بندی"
              />

              {/* Professional Description */}
              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">
                  توضیحات جامع و متن حرفه‌ای دسته‌بندی:
                </label>
                <textarea
                  rows={3}
                  value={catForm.description || ''}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="توضیحاتی در مورد موضوع این دسته مقالات، استانداردهای کارخانه‌ای و کاربرد برای کاربران..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  ذخیره دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT ARTICLE
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {editingArticle ? `ویرایش مقاله: ${editingArticle.title}` : 'نگارش و انتشار مقاله تخصصی'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">عنوان کامل مقاله *:</label>
                <input
                  type="text"
                  value={articleForm.title || ''}
                  onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="مثال: راهنمای گام به گام تعویض تسمه تایم جک S5 موتور ۱۵۰۰"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">دسته‌بندی مقاله *:</label>
                  <select
                    value={articleForm.categoryId || ''}
                    onChange={e => {
                      const selCat = articleCategories.find(c => c.id === e.target.value);
                      setArticleForm({
                        ...articleForm,
                        categoryId: e.target.value,
                        category: selCat ? selCat.name : articleForm.category
                      });
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    {articleCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">نویسنده / کارشناس:</label>
                  <input
                    type="text"
                    value={articleForm.author || ''}
                    onChange={e => setArticleForm({ ...articleForm, author: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">زمان تقریبی مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    value={articleForm.readTimeMinutes || 5}
                    onChange={e => setArticleForm({ ...articleForm, readTimeMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <ImageUploadInput
                label="تصویر شاخص و بنر بالای مقاله (همراه با پیش‌نمایش و آپلود):"
                value={articleForm.imageUrl || ''}
                onChange={url => setArticleForm({ ...articleForm, imageUrl: url })}
                placeholder="https://..."
              />

              {/* Summary */}
              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">چکیده و خلاصه مقاله (Meta Description):</label>
                <textarea
                  rows={2}
                  value={articleForm.summary || ''}
                  onChange={e => setArticleForm({ ...articleForm, summary: e.target.value })}
                  placeholder="خلاصه ۲ خطی برای پیش‌نمایش در کارت‌ها و نتایج جستجوی گوگل..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Rich Content */}
              <div>
                <RichTextEditor
                  label="متن کامل و تخصصی مقاله (ویرایشگر پیشرفته)"
                  value={articleForm.content || ''}
                  onChange={val => setArticleForm({ ...articleForm, content: val })}
                  rows={8}
                  placeholder="متن کامل مقاله همراه با زیرعنوان‌ها، نکات ایمنی و دستورالعمل‌های فنی..."
                />
              </div>

              {/* Associated Cars and Products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">خودروی مرتبط اصلی:</label>
                  <select
                    value={articleForm.relatedModelIds?.[0] || ''}
                    onChange={e => setArticleForm({ ...articleForm, relatedModelIds: [e.target.value] })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.nameFa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">قطعه یا کالای مرتبط برای خرید:</label>
                  <select
                    value={articleForm.relatedProductIds?.[0] || ''}
                    onChange={e => setArticleForm({ ...articleForm, relatedProductIds: [e.target.value] })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nameFa}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {editingArticle ? 'ذخیره تغییرات مقاله' : 'انتشار مقاله'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
