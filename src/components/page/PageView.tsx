import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageSection } from '../../types';
import { LiveSectionModal } from '../common/LiveSectionModal';
import { 
  ChevronLeft, 
  Home, 
  FileText, 
  Sparkles, 
  Edit3, 
  ArrowLeft, 
  ExternalLink,
  ShieldCheck,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  PackageOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface PageViewProps {
  pageSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const PageView: React.FC<PageViewProps> = ({ pageSlug, onNavigate }) => {
  const { 
    pages, 
    updatePage, 
    addSection, 
    deleteSection, 
    isLiveEditActive, 
    setIsLiveEditActive, 
    adminAuth,
    showToast 
  } = useStore();
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const currentPage = pages.find(p => p.slug === pageSlug);

  // If page not found
  if (!currentPage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto shadow-inner">
          <PackageOpen className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-neutral-900">برگه مورد نظر یافت نشد</h1>
          <p className="text-xs text-neutral-500">
            صفحه‌ای با شناسه «{pageSlug}» در سیستم ثبت نشده است یا ممکن است تغییر نام یافته باشد.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>بازگشت به صفحه اصلی</span>
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition-all"
          >
            مشاهده کاتالوگ قطعات
          </button>
        </div>
      </div>
    );
  }

  // Sections to render: in live edit mode, show all; otherwise only visible ones
  const sectionsToRender = currentPage.sections
    .filter(sec => isLiveEditActive || sec.isVisible)
    .sort((a, b) => a.order - b.order);

  const handleActionClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      onNavigate(link);
    }
  };

  const handleAddNewSection = () => {
    const nextOrder = (currentPage.sections.length || 0) + 1;
    const newId = `sec-${Date.now()}`;
    const newSec: PageSection = {
      id: newId,
      title: 'سکشن جدید',
      subtitle: 'عنوان فرعی و توضیح کوتاه برای معرفی این بخش',
      content: 'محتوا و توضیحات تفصیلی این سکشن را در ویرایشگر بنویسید یا عکس اختصاصی برای آن آپلود کنید.',
      badge: 'بخش ویژه',
      imageUrl: '',
      buttonText: 'مشاهده و ثبت درخواست',
      buttonLink: 'shop',
      isVisible: true,
      order: nextOrder
    };
    addSection(currentPage.slug, newSec);
    setEditingSectionId(newId);
    showToast('سکشن جدید ایجاد شد. اکنون می‌توانید مشخصات آن را ویرایش نمایید.');
  };

  const handleMoveOrder = (sectionId: string, direction: 'up' | 'down') => {
    const sorted = [...currentPage.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(s => s.id === sectionId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index + 1].order;
      sorted[index + 1].order = temp;
    }

    updatePage({
      ...currentPage,
      sections: sorted
    });
    showToast('ترتیب سکشن‌ها جابه‌جا شد.');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Live Edit Mode Sticky Notification Banner */}
      {isLiveEditActive && (
        <div className="sticky top-20 z-40 bg-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>حالت ویرایش زنده برگه فعال است: می‌توانید سکشن‌ها را جابه‌جا، ویرایش یا حذف کنید.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNewSection}
                className="px-3 py-1 bg-neutral-900 hover:bg-black rounded-lg font-bold text-white text-[11px] flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن بخش جدید</span>
              </button>
              <button
                onClick={() => setIsLiveEditActive(false)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-white text-[11px] transition-colors"
              >
                خروج از حالت ویرایش
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Hero Header */}
      <section className="bg-neutral-900 text-white py-12 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button 
              onClick={() => onNavigate('home')}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>صفحه اصلی</span>
            </button>
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-white font-semibold">{currentPage.title}</span>
          </div>

          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] bg-red-600/30 text-red-400 border border-red-500/30 font-bold px-3 py-1 rounded-full">
                مرکز اطلاعات چین‌پارت
              </span>
              <span className="text-[11px] text-neutral-400">
                آخرین به‌روزرسانی: {currentPage.updatedAt}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentPage.title}
            </h1>
            {currentPage.description && (
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed pt-1">
                {currentPage.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Page Sections Container */}
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {sectionsToRender.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 space-y-3">
            <FileText className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="font-bold text-sm text-neutral-800">هنوز سکشنی برای این برگه تعریف نشده است.</h3>
            <p className="text-xs text-neutral-500">از طریق پنل مدیریت &gt; برگه‌ها می‌توانید بخش‌های دلخواه اضافه کنید.</p>
          </div>
        ) : (
          sectionsToRender.map((section, index) => {
            const isEven = index % 2 === 0;
            const mode = section.imageMode || 'side';
            const hasImage = Boolean(section.imageUrl);

            // 1. Cover Mode: Image as background with dark gradient overlay
              if (hasImage && mode === 'cover') {
                return (
                  <div
                    key={section.id}
                    className={`relative group rounded-3xl overflow-hidden shadow-xl border transition-all ${
                      isLiveEditActive 
                        ? 'border-amber-400 ring-2 ring-amber-400/30' 
                        : 'border-neutral-800'
                    }`}
                    style={{
                      backgroundImage: `url(${section.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/85 to-neutral-900/60 pointer-events-none"></div>

                    {/* Live Section Action Toolbar */}
                    {isLiveEditActive && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-xs p-1.5 rounded-2xl shadow-xl border border-neutral-700">
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(section.id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش بخش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`آیا از حذف سکشن "${section.title}" از این برگه اطمینان دارید؟`)) {
                              deleteSection(currentPage.slug, section.id);
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="relative z-10 p-8 sm:p-12 max-w-3xl space-y-4 text-white">
                      {section.badge && (
                        <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-red-600/90 text-white border border-red-500/30 shadow-sm">
                          {section.badge}
                        </span>
                      )}
                      <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="text-sm font-semibold text-neutral-200 leading-relaxed">
                          {section.subtitle}
                        </p>
                      )}
                      {section.content && (
                        <div className="text-xs sm:text-sm text-neutral-300 leading-loose space-y-3 pt-1 whitespace-pre-line">
                          {section.content}
                        </div>
                      )}
                      {section.buttonText && (
                        <div className="pt-3">
                          <button
                            onClick={() => handleActionClick(section.buttonLink)}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>{section.buttonText}</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. Full Mode: Full-width banner image stacked above content
              if (hasImage && mode === 'full') {
                return (
                  <div 
                    key={section.id} 
                    className={`relative group bg-white rounded-3xl overflow-hidden border transition-all ${
                      isLiveEditActive 
                        ? 'border-amber-400/80 shadow-md ring-2 ring-amber-400/20' 
                        : 'border-neutral-200/80 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Live Toolbar */}
                    {isLiveEditActive && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-xs p-1.5 rounded-2xl shadow-xl border border-neutral-700">
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(section.id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش بخش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`آیا از حذف سکشن "${section.title}" از این برگه اطمینان دارید؟`)) {
                              deleteSection(currentPage.slug, section.id);
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Full Width Top Banner */}
                    <div className="w-full h-56 sm:h-72 md:h-88 overflow-hidden bg-neutral-100">
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Content under banner */}
                    <div className="p-6 sm:p-10 space-y-4">
                      {section.badge && (
                        <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                          {section.badge}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
                          {section.subtitle}
                        </p>
                      )}
                      {section.content && (
                        <div className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1 whitespace-pre-line">
                          {section.content}
                        </div>
                      )}
                      {section.buttonText && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleActionClick(section.buttonLink)}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>{section.buttonText}</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 3. Side & Contain Modes: Side-by-side layout
              return (
                <div 
                  key={section.id} 
                  className={`relative group bg-white rounded-3xl border transition-all ${
                    isLiveEditActive 
                      ? 'border-amber-400/80 shadow-md ring-2 ring-amber-400/20' 
                      : 'border-neutral-200/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Live Section Action Toolbar (Float overlay) */}
                  {isLiveEditActive && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-xs p-1.5 rounded-2xl shadow-xl border border-neutral-700">
                      {!section.isVisible && (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-500/30">
                          <EyeOff className="w-3 h-3 text-amber-400" />
                          <span>مخفی</span>
                        </span>
                      )}

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(section.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(section.id, 'down')}
                        disabled={index === sectionsToRender.length - 1}
                        className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Section */}
                      <button
                        type="button"
                        onClick={() => setEditingSectionId(section.id)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform transform active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش بخش</span>
                      </button>

                      {/* Delete Section */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`آیا از حذف سکشن "${section.title}" از این برگه اطمینان دارید؟`)) {
                            deleteSection(currentPage.slug, section.id);
                          }
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        title="حذف سکشن"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="p-6 sm:p-10">
                    <div className={`grid grid-cols-1 ${hasImage ? 'lg:grid-cols-12 gap-8 items-center' : 'gap-4'}`}>
                      
                      {/* Content Column */}
                      <div className={`space-y-4 ${hasImage ? (isEven ? 'lg:col-span-7' : 'lg:col-span-7 lg:order-2') : 'max-w-4xl'}`}>
                        {section.badge && (
                          <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                            {section.badge}
                          </span>
                        )}

                        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
                          {section.title}
                        </h2>

                        {section.subtitle && (
                          <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
                            {section.subtitle}
                          </p>
                        )}

                        {section.content && (
                          <div className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1 whitespace-pre-line">
                            {section.content}
                          </div>
                        )}

                        {section.buttonText && (
                          <div className="pt-3">
                            <button
                              onClick={() => handleActionClick(section.buttonLink)}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <span>{section.buttonText}</span>
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Image Column */}
                      {hasImage && (
                        <div className={`lg:col-span-5 ${isEven ? '' : 'lg:order-1'}`}>
                          <div className="relative rounded-2xl overflow-hidden border border-neutral-200/80 shadow-md group-hover:shadow-lg transition-shadow bg-neutral-50 flex items-center justify-center">
                            <img
                              src={section.imageUrl}
                              alt={section.title}
                              className={`w-full ${mode === 'contain' ? 'max-h-80 object-contain p-4' : 'h-64 sm:h-80 object-cover hover:scale-102 transition-transform duration-300'}`}
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
          })
        )}

        {/* Add New Section Card (when Live Edit is active) */}
        {isLiveEditActive && (
          <div className="p-8 border-2 border-dashed border-amber-400 bg-amber-50/50 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">افزودن بخش جدید به این برگه</h4>
              <p className="text-xs text-neutral-500 mt-0.5">سکشن جدید بلافاصله ایجاد شده و فرم ویرایش متن، تصویر و دکمه آن باز خواهد شد.</p>
            </div>
            <button
              type="button"
              onClick={handleAddNewSection}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2 transition-transform transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن سکشن جدید</span>
            </button>
          </div>
        )}

        {/* Bottom Trust & Contact Banner */}
        <div className="p-8 rounded-3xl bg-neutral-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="font-black text-base text-white flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <span>نیاز به راهنمایی بیشتر یا استعلام قطعه خاصی دارید؟</span>
            </h3>
            <p className="text-xs text-neutral-400">
              کارشناسان مهندسی فروش چین‌پارت آماده بررسی شماره شاسی و راهنمایی خرید قطعه متناسب با خودروی شما هستند.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('part-request')}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/30"
            >
              ثبت استعلام شماره فنی
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-colors border border-neutral-700"
            >
              مشاهده فروشگاه
            </button>
          </div>
        </div>
      </div>

      {/* Live Section Editor Modal */}
      {editingSectionId && (
        <LiveSectionModal
          pageSlug={pageSlug}
          sectionId={editingSectionId}
          isOpen={!!editingSectionId}
          onClose={() => setEditingSectionId(null)}
        />
      )}
    </div>
  );
};
