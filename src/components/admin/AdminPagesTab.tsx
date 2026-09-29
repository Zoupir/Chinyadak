import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SitePage, PageSection } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  FileText, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  LayoutTemplate,
  MonitorCheck
} from 'lucide-react';

interface AdminPagesTabProps {
  onNavigate?: (view: string, param?: string) => void;
}

export const AdminPagesTab: React.FC<AdminPagesTabProps> = ({ onNavigate }) => {
  const { 
    pages, 
    updatePage, 
    deletePage,
    updateSection, 
    addSection, 
    deleteSection, 
    isLiveEditActive, 
    setIsLiveEditActive,
    showToast 
  } = useStore();

  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page-home');
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState<boolean>(false);

  // New Page Form
  const [newPageForm, setNewPageForm] = useState<{ title: string; slug: string; description: string }>({
    title: '',
    slug: '',
    description: ''
  });

  // Section Form
  const [sectionForm, setSectionForm] = useState<PageSection>({
    id: '',
    sectionKey: '',
    title: '',
    subtitle: '',
    content: '',
    badge: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    isVisible: true,
    order: 1,
    layout: 'boxed',
    desktopColumns: 3,
    mobileColumns: 1,
    fullWidth: false,
    backgroundColor: '#ffffff',
    textColor: '#111827',
    borderRadiusPx: 12,
    itemRadiusPx: 10,
    paddingTopPx: 28,
    paddingBottomPx: 28,
    paddingInlinePx: 20,
    gapPx: 16,
    minHeightPx: 0,
    contentAlign: 'right',
    items: []
  });

  const selectedPage = pages.find(p => p.id === selectedPageId) || pages[0];

  const handleOpenEditSection = (section: PageSection) => {
    setEditingSection(section);
    setSectionForm({ ...section });
    setIsSectionModalOpen(true);
  };

  const handleOpenNewSection = () => {
    if (!selectedPage) return;
    const nextOrder = selectedPage.sections.length + 1;
    const newSec: PageSection = {
      id: `sec-${Date.now()}`,
      sectionKey: `custom-${Date.now()}`,
      title: '',
      subtitle: '',
      content: '',
      badge: '',
      imageUrl: '',
      buttonText: '',
      buttonLink: 'shop',
      isVisible: true,
      order: nextOrder,
      layout: 'boxed',
      desktopColumns: 3,
      mobileColumns: 1,
      fullWidth: false,
      backgroundColor: '#ffffff',
      textColor: '#111827',
      borderRadiusPx: 12,
      itemRadiusPx: 10,
      paddingTopPx: 28,
      paddingBottomPx: 28,
      paddingInlinePx: 20,
      gapPx: 16,
      minHeightPx: 0,
      contentAlign: 'right',
      items: []
    };
    setEditingSection(null);
    setSectionForm(newSec);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.title) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }

    if (editingSection) {
      updateSection(selectedPage.slug, sectionForm);
    } else {
      addSection(selectedPage.slug, sectionForm);
    }
    setIsSectionModalOpen(false);
  };

  const handleMoveOrder = (sectionId: string, direction: 'up' | 'down') => {
    if (!selectedPage) return;
    const sorted = [...selectedPage.sections].sort((a, b) => a.order - b.order);
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
      ...selectedPage,
      sections: sorted
    });
  };

  const handleToggleVisibility = (section: PageSection) => {
    updateSection(selectedPage.slug, {
      ...section,
      isVisible: !section.isVisible
    });
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageForm.title || !newPageForm.slug) {
      showToast('عنوان و آدرس یکتای برگه (Slug) الزامی است.', 'error');
      return;
    }

    const cleanSlug = newPageForm.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = pages.find(p => p.slug === cleanSlug);
    if (existing) {
      showToast('برگه‌ای با این آدرس از قبل وجود دارد.', 'error');
      return;
    }

    const newPage: SitePage = {
      id: `page-${Date.now()}`,
      slug: cleanSlug,
      title: newPageForm.title,
      description: newPageForm.description,
      isSystem: false,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          title: newPageForm.title,
          subtitle: newPageForm.description,
          content: 'محتوای سکشن را از طریق ویرایشگر وارد کنید.',
          isVisible: true,
          order: 1
        }
      ]
    };

    updatePage(newPage);
    setSelectedPageId(newPage.id);
    setIsNewPageModalOpen(false);
    setNewPageForm({ title: '', slug: '', description: '' });
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6 text-right">
      {/* Header and Live Edit Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black text-neutral-900">مدیریت برگه‌ها و سکشن‌ها (Page Builder)</h2>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              ویرایشگر زنده
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            ویرایش مستقیم متون، بنرها، تصاویر و سکشن‌های صفحه اصلی، درباره ما و سایر صفحات سایت با امکان کلیک و ویرایش در لحظه
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Edit Mode Switch */}
          <button
            onClick={() => {
              setIsLiveEditActive(!isLiveEditActive);
              showToast(
                !isLiveEditActive 
                  ? 'حالت ویرایش زنده سکشن‌ها در فروشگاه فعال شد. هم‌اکنون می‌توانید در محیط سایت روی هر بخش کلیک کنید.'
                  : 'حالت ویرایش زنده سکشن‌ها غیرفعال شد.',
                'info'
              );
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isLiveEditActive 
                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400/30 animate-pulse' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
            title="فعال‌سازی نشانگرهای ویرایش زنده روی سکشن‌های صفحات سایت"
          >
            <MonitorCheck className="w-4 h-4" />
            <span>{isLiveEditActive ? 'حالت ویرایش زنده در سایت: فعال' : 'فعال‌سازی ویرایش زنده در سایت'}</span>
          </button>

          <button
            onClick={() => setIsNewPageModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>برگه جدید</span>
          </button>
        </div>
      </div>

      {/* Pages Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-100">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setSelectedPageId(page.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedPageId === page.id
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{page.title}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedPageId === page.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              {page.sections.length} سکشن
            </span>
          </button>
        ))}
      </div>

      {/* Selected Page Details & Sections List */}
      {selectedPage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-neutral-900">{selectedPage.title}</span>
                <span className="text-[10px] font-mono text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                  slug: /{selectedPage.slug}
                </span>
                {selectedPage.isSystem && (
                  <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-2 py-0.5 rounded-md">
                    برگه سیستمی
                  </span>
                )}
              </div>
              {selectedPage.description && (
                <p className="text-xs text-neutral-500 mt-1">{selectedPage.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPage.slug === 'home') {
                      onNavigate('home');
                    } else {
                      onNavigate('page', selectedPage.slug);
                    }
                  }}
                  className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="مشاهده ظاهر زنده برگه در فروشگاه"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="hidden sm:inline">مشاهده در سایت</span>
                </button>
              )}

              {!selectedPage.isSystem && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`آیا از حذف برگه «${selectedPage.title}» مطمئن هستید؟ تمام سکشن‌های آن حذف خواهند شد.`)) {
                      deletePage(selectedPage.id);
                      setSelectedPageId(pages[0]?.id || 'page-home');
                    }
                  }}
                  className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  title="حذف کامل این برگه"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">حذف برگه</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenNewSection}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سکشن</span>
              </button>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-3">
            {selectedPage.sections.sort((a, b) => a.order - b.order).map((section, idx) => (
              <div 
                key={section.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  section.isVisible 
                    ? 'border-neutral-200 bg-white hover:border-neutral-300' 
                    : 'border-neutral-200/60 bg-neutral-50/60 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-600 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {section.order}
                  </div>

                  {section.imageUrl && (
                    <img 
                      src={section.imageUrl} 
                      alt={section.title} 
                      className="w-14 h-14 object-cover rounded-xl border border-neutral-200 shrink-0" 
                    />
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-neutral-900">{section.title || 'سکشن بدون عنوان'}</h4>
                      {section.badge && (
                        <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-100">
                          {section.badge}
                        </span>
                      )}
                      {!section.isVisible && (
                        <span className="text-[10px] bg-neutral-200 text-neutral-600 font-bold px-1.5 py-0.2 rounded-md">
                          مخفی در سایت
                        </span>
                      )}
                    </div>
                    {section.subtitle && (
                      <p className="text-xs text-neutral-500 line-clamp-1">{section.subtitle}</p>
                    )}
                    {section.content && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2">{section.content}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleMoveOrder(section.id, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-30"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(section.id, 'down')}
                    disabled={idx === selectedPage.sections.length - 1}
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-30"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(section)}
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                    title={section.isVisible ? 'مخفی‌سازی' : 'نمایش'}
                  >
                    {section.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف سکشن "${section.title}" اطمینان دارید؟`)) {
                        deleteSection(selectedPage.slug, section.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="حذف سکشن"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT OR ADD SECTION (WITH RICH EDITOR & IMAGE UPLOAD)
      ========================================================================= */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-red-600" />
                <span>{editingSection ? `ویرایش سکشن: ${editingSection.title}` : 'افزودن سکشن جدید'}</span>
              </h3>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">عنوان اصلی سکشن *:</label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                    placeholder="مثال: قطعه درست برای خودروی شما"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">برچسب / بج بالای تیتر:</label>
                  <input
                    type="text"
                    value={sectionForm.badge || ''}
                    onChange={e => setSectionForm({ ...sectionForm, badge: e.target.value })}
                    placeholder="مثال: سیستم هوشمند فیتمنت"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">زیرعنوان / توضیح کوتاه:</label>
                <input
                  type="text"
                  value={sectionForm.subtitle || ''}
                  onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  placeholder="توضیح کوتاه ۱ یا ۲ خطی..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Image Upload Input */}
              <ImageUploadInput
                label="تصویر یا پس‌زمینه سکشن:"
                value={sectionForm.imageUrl || ''}
                onChange={(url) => setSectionForm({ ...sectionForm, imageUrl: url })}
                aspectRatio="banner"
                presetCategory="banners"
                placeholder="آدرس اینترنتی تصویر یا آپلود فایل مستقیم..."
                helperText="تصویر با کیفیت در ابعاد استاندارد برای نمایش در این بخش"
              />

              {sectionForm.imageUrl && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <label className="block text-neutral-800 font-bold text-xs">
                    حالت نمایش تصویر در سکشن (Display Mode):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'full', label: 'تمام‌عرض (فول)', desc: 'بنر کامل سراسری' },
                      { id: 'cover', label: 'کاور پس‌زمینه', desc: 'پوشش کل سکشن با لایه تاریک' },
                      { id: 'side', label: 'کنار متن', desc: 'ستون تصویر در کنار متن' },
                      { id: 'contain', label: 'بدون برش (کادر)', desc: 'درون کادر بدون برش' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSectionForm({ ...sectionForm, imageMode: mode.id as any })}
                        className={`p-2 rounded-lg border text-right transition-all cursor-pointer ${
                          (sectionForm.imageMode || 'side') === mode.id
                            ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <strong className="block text-[11px] font-bold">{mode.label}</strong>
                        <span className="text-[9px] text-neutral-500">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout Builder */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div>
                  <h4 className="font-black text-sm text-neutral-900">چیدمان و ابعاد سکشن</h4>
                  <p className="text-[10px] text-neutral-500 mt-1">مشابه یک Section Builder، عرض، ستون‌ها، فاصله‌ها، رنگ و گردی این بخش را مستقل تنظیم کنید.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label>
                    <span className="block text-[10px] font-bold mb-1">نوع چیدمان</span>
                    <select value={sectionForm.layout || 'boxed'} onChange={e => setSectionForm({ ...sectionForm, layout: e.target.value as PageSection['layout'] })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                      <option value="boxed">کادر استاندارد</option>
                      <option value="full">تمام‌عرض</option>
                      <option value="grid">شبکه‌ای</option>
                      <option value="split">دو بخشی</option>
                      <option value="cards">کارت‌ها</option>
                    </select>
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold mb-1">ستون دسکتاپ</span>
                    <select value={sectionForm.desktopColumns || 3} onChange={e => setSectionForm({ ...sectionForm, desktopColumns: Number(e.target.value) as any })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ستون</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold mb-1">ستون موبایل</span>
                    <select value={sectionForm.mobileColumns || 1} onChange={e => setSectionForm({ ...sectionForm, mobileColumns: Number(e.target.value) as 1 | 2 })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                      <option value={1}>۱ ستون</option>
                      <option value={2}>۲ ستون</option>
                    </select>
                  </label>
                  <label>
                    <span className="block text-[10px] font-bold mb-1">تراز محتوا</span>
                    <select value={sectionForm.contentAlign || 'right'} onChange={e => setSectionForm({ ...sectionForm, contentAlign: e.target.value as any })} className="w-full p-2 border border-neutral-300 rounded-lg bg-white">
                      <option value="right">راست</option>
                      <option value="center">وسط</option>
                      <option value="left">چپ</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['borderRadiusPx', 'گردی سکشن', 0, 60],
                    ['itemRadiusPx', 'گردی آیتم‌ها', 0, 60],
                    ['gapPx', 'فاصله آیتم‌ها', 0, 60],
                    ['minHeightPx', 'حداقل ارتفاع', 0, 900],
                    ['paddingTopPx', 'فاصله بالا', 0, 160],
                    ['paddingBottomPx', 'فاصله پایین', 0, 160],
                    ['paddingInlinePx', 'فاصله طرفین', 0, 120]
                  ].map(([key, label, min, max]) => (
                    <label key={String(key)}>
                      <span className="block text-[10px] font-bold mb-1">{String(label)} (px)</span>
                      <input
                        type="number"
                        min={Number(min)}
                        max={Number(max)}
                        value={Number((sectionForm as any)[String(key)] || 0)}
                        onChange={e => setSectionForm({ ...sectionForm, [String(key)]: Number(e.target.value) } as PageSection)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-white font-mono"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-neutral-200">
                    <span className="font-bold text-[11px]">تمام‌عرض بدون محدودیت کانتینر</span>
                    <input type="checkbox" checked={sectionForm.fullWidth === true} onChange={e => setSectionForm({ ...sectionForm, fullWidth: e.target.checked })} className="w-4 h-4" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className="block text-[10px] font-bold mb-1">رنگ پس‌زمینه</span>
                      <input type="color" value={sectionForm.backgroundColor || '#ffffff'} onChange={e => setSectionForm({ ...sectionForm, backgroundColor: e.target.value })} className="w-full h-10 p-1 border border-neutral-300 rounded-lg bg-white" />
                    </label>
                    <label>
                      <span className="block text-[10px] font-bold mb-1">رنگ متن</span>
                      <input type="color" value={sectionForm.textColor || '#111827'} onChange={e => setSectionForm({ ...sectionForm, textColor: e.target.value })} className="w-full h-10 p-1 border border-neutral-300 rounded-lg bg-white" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Rich Content Editor */}
              <RichTextEditor
                label="متن کامل و محتوای تشریحی سکشن (ویرایشگر پیشرفته):"
                value={sectionForm.content || ''}
                onChange={(val) => setSectionForm({ ...sectionForm, content: val })}
                rows={5}
                placeholder="توضیحات تکمیلی، مشخصات، ویژگی‌ها و راهنماها..."
              />

              {/* Repeatable items */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm text-neutral-900">آیتم‌های داخل سکشن</h4>
                    <p className="text-[10px] text-neutral-500 mt-1">برای نظرات مشتریان، بنرهای چندتایی، مزایا، کارت‌ها و هر محتوای تکرارشونده.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = [...(sectionForm.items || [])];
                      items.push({ id: `item-${Date.now()}`, title: '', subtitle: '', content: '', imageUrl: '', link: '', buttonText: '', isVisible: true, order: items.length + 1 });
                      setSectionForm({ ...sectionForm, items });
                    }}
                    className="px-3 py-2 bg-neutral-900 text-white rounded-xl font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن آیتم
                  </button>
                </div>

                {(sectionForm.items || []).length === 0 && (
                  <div className="p-4 border border-dashed border-neutral-300 rounded-xl text-center text-[10px] text-neutral-500">هنوز آیتمی اضافه نشده است.</div>
                )}

                <div className="space-y-3">
                  {(sectionForm.items || []).map((item, itemIndex) => (
                    <div key={item.id} className="p-3 bg-white rounded-xl border border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-[11px]">آیتم {itemIndex + 1}</strong>
                        <button
                          type="button"
                          onClick={() => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).filter(x => x.id !== item.id) })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف آیتم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={item.title || ''} onChange={e => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).map(x => x.id === item.id ? { ...x, title: e.target.value } : x) })} placeholder="عنوان / نام مشتری" className="p-2 border border-neutral-300 rounded-lg" />
                        <input value={item.subtitle || ''} onChange={e => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).map(x => x.id === item.id ? { ...x, subtitle: e.target.value } : x) })} placeholder="زیرعنوان / نقش مشتری" className="p-2 border border-neutral-300 rounded-lg" />
                        <input value={item.imageUrl || ''} onChange={e => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).map(x => x.id === item.id ? { ...x, imageUrl: e.target.value } : x) })} placeholder="آدرس تصویر (اختیاری)" className="p-2 border border-neutral-300 rounded-lg text-left" dir="ltr" />
                        <input value={item.link || ''} onChange={e => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).map(x => x.id === item.id ? { ...x, link: e.target.value } : x) })} placeholder="لینک مقصد (اختیاری)" className="p-2 border border-neutral-300 rounded-lg text-left" dir="ltr" />
                      </div>
                      <textarea value={item.content || ''} onChange={e => setSectionForm({ ...sectionForm, items: (sectionForm.items || []).map(x => x.id === item.id ? { ...x, content: e.target.value } : x) })} rows={2} placeholder="متن آیتم / متن نظر مشتری / توضیح بنر" className="w-full p-2 border border-neutral-300 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">متن دکمه اکشن (CTA):</label>
                  <input
                    type="text"
                    value={sectionForm.buttonText || ''}
                    onChange={e => setSectionForm({ ...sectionForm, buttonText: e.target.value })}
                    placeholder="مثال: خرید قطعات سازگار"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">لینک یا مقصد دکمه:</label>
                  <input
                    type="text"
                    value={sectionForm.buttonLink || ''}
                    onChange={e => setSectionForm({ ...sectionForm, buttonLink: e.target.value })}
                    placeholder="shop یا part-request یا https://..."
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="section-visible-check"
                  checked={sectionForm.isVisible}
                  onChange={e => setSectionForm({ ...sectionForm, isVisible: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-neutral-300"
                />
                <label htmlFor="section-visible-check" className="font-bold text-neutral-800 cursor-pointer">
                  نمایش فعال این سکشن در سایت
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ذخیره سکشن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE NEW PAGE
      ========================================================================= */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">ایجاد برگه اختصاصی جدید</h3>
              <button onClick={() => setIsNewPageModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان برگه *:</label>
                <input
                  type="text"
                  value={newPageForm.title}
                  onChange={e => setNewPageForm({ ...newPageForm, title: e.target.value })}
                  placeholder="مثال: سوالات متداول مشتریان (FAQ)"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">شناسه یکتای آدرس برگه (Slug) *:</label>
                <input
                  type="text"
                  value={newPageForm.slug}
                  onChange={e => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                  placeholder="faq یا terms یا services"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">توضیحات برگه (اختیاری):</label>
                <textarea
                  rows={2}
                  value={newPageForm.description}
                  onChange={e => setNewPageForm({ ...newPageForm, description: e.target.value })}
                  placeholder="توضیح هدف این برگه برای موتورهای جستجو..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewPageModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ایجاد برگه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
