import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FooterColumn, FooterFeatureItem, FooterLink, FooterBadgeItem } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ExternalLink, 
  Layers, 
  Code, 
  Eye, 
  Columns, 
  Sliders, 
  HelpCircle,
  Truck,
  Clock,
  Headphones,
  Wrench,
  Zap,
  Package,
  Globe,
  CheckCircle,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const AdminFooterTab: React.FC = () => {
  const { settings, updateSettings, showToast, categories, pages } = useStore();

  // Active subtab
  const [activeSubtab, setActiveSubtab] = useState<'features' | 'about' | 'columns' | 'badges' | 'html'>('columns');

  // Form states
  const [footerAboutTitle, setFooterAboutTitle] = useState(settings.footerAboutTitle || settings.siteTitle || 'فروشگاه اینترنتی');
  const [footerAboutText, setFooterAboutText] = useState(settings.footerAboutText || '');
  const [footerCopyrightText, setFooterCopyrightText] = useState(settings.footerCopyrightText || '');
  const [footerCustomHtml, setFooterCustomHtml] = useState(settings.footerCustomHtml || '');
  const [showHtmlPreview, setShowHtmlPreview] = useState(true);

  // Features
  const [footerShowFeatures, setFooterShowFeatures] = useState(settings.footerShowFeatures !== false);
  const [features, setFeatures] = useState<FooterFeatureItem[]>(settings.footerFeatures || [
    { id: 'f1', title: 'ضمانت ۱۰۰٪ اصالت قطعه', description: 'تضمین قطعات اصلی شرکتی با هولوگرام لیزری', icon: 'ShieldCheck' },
    { id: 'f2', title: 'ارسال اکسپرس و بیمه‌شده', description: 'تهران ۲ ساعته، شهرستان‌ها با تیپاکس و پست پیشتاز', icon: 'Truck' },
    { id: 'f3', title: '۷ روز مهلت تست و مرجوعی', description: 'بازگشت بدون قید و شرط در صورت عدم تطبیق فیتمنت', icon: 'Clock' },
    { id: 'f4', title: 'مشاوره تخصصی قبل از خرید', description: 'بررسی دقیق شماره شاسی VIN توسط مهندسین فنی', icon: 'Headphones' }
  ]);

  // Columns & Links
  const footerColumnDefaults: FooterColumn[] = [
    {
      id: 'fcol-1',
      title: 'حساب کاربری',
      links: [
        { id: 'l1', title: 'داشبورد حساب من', url: 'account' },
        { id: 'l2', title: 'سفارش‌های من', url: 'account:orders' },
        { id: 'l3', title: 'گاراژ خودروهای من', url: 'account:garage' },
        { id: 'l4', title: 'پیگیری سفارش', url: 'tracking' }
      ]
    },
    {
      id: 'fcol-2',
      title: 'کاتالوگ',
      links: [
        { id: 'l5', title: 'فروشگاه قطعات', url: 'shop' },
        { id: 'l6', title: 'محصولات پرفروش', url: 'shop:bestseller' },
        { id: 'l7', title: 'سرویس دوره‌ای', url: 'shop:maintenance' }
      ]
    },
    {
      id: 'fcol-3',
      title: 'راهنما',
      links: [
        { id: 'l8', title: 'درباره ما', url: 'page:about' },
        { id: 'l9', title: 'مقالات و آموزش‌ها', url: 'blog' },
        { id: 'l10', title: 'ضمانت و بازگشت کالا', url: 'page:guarantee' },
        { id: 'l11', title: 'استعلام قطعه', url: 'part-request' }
      ]
    }
  ];
  const storedFooterColumns = settings.footerColumns || [];
  const [columns, setColumns] = useState<FooterColumn[]>(
    storedFooterColumns.length >= 3
      ? storedFooterColumns
      : [...(storedFooterColumns.length ? storedFooterColumns : footerColumnDefaults.slice(0, 2)), footerColumnDefaults[2]]
  );

  // Badges
  const [footerShowBadges, setFooterShowBadges] = useState(settings.footerShowBadges !== false);
  const [badges, setBadges] = useState<FooterBadgeItem[]>(settings.footerBadges || [
    {
      id: 'badge-enamad',
      title: 'نماد اعتماد الکترونیکی (اینماد)',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/1162/1162499.png',
      linkUrl: 'https://enamad.ir',
      htmlCode: '<div class="p-2 bg-neutral-800/80 rounded-xl text-center border border-neutral-700/60 hover:border-red-500/50 transition-colors"><div class="w-14 h-14 mx-auto flex items-center justify-center bg-white rounded-lg p-1 mb-1.5 shadow-sm"><img src="https://cdn-icons-png.flaticon.com/512/1162/1162499.png" alt="اینماد" class="w-10 h-10 object-contain" /></div><span class="text-[10px] text-neutral-300 font-bold block">اینماد ۲ ستاره</span><span class="text-[9px] text-neutral-500 block">مرکز توسعه تجارت</span></div>'
    },
    {
      id: 'badge-samandehi',
      title: 'نشان ملی ثبت رسانه‌های دیجیتال (ساماندهی)',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/924/924915.png',
      linkUrl: 'https://samandehi.ir',
      htmlCode: '<div class="p-2 bg-neutral-800/80 rounded-xl text-center border border-neutral-700/60 hover:border-red-500/50 transition-colors"><div class="w-14 h-14 mx-auto flex items-center justify-center bg-white rounded-lg p-1 mb-1.5 shadow-sm"><img src="https://cdn-icons-png.flaticon.com/512/924/924915.png" alt="ساماندهی" class="w-10 h-10 object-contain" /></div><span class="text-[10px] text-neutral-300 font-bold block">ستاد ساماندهی</span><span class="text-[9px] text-neutral-500 block">وزارت ارشاد</span></div>'
    },
    {
      id: 'badge-shaparak',
      title: 'درگاه پرداخت امن شاپرک و عضو شتاب',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/893/893081.png',
      linkUrl: '#',
      htmlCode: '<div class="p-2 bg-neutral-800/80 rounded-xl text-center border border-neutral-700/60 hover:border-red-500/50 transition-colors"><div class="w-14 h-14 mx-auto flex items-center justify-center bg-white rounded-lg p-1 mb-1.5 shadow-sm"><img src="https://cdn-icons-png.flaticon.com/512/893/893081.png" alt="شاپرک" class="w-10 h-10 object-contain" /></div><span class="text-[10px] text-emerald-400 font-bold block">پرداخت امن شاپرک</span><span class="text-[9px] text-neutral-500 block">پروتکل SSL ۲۵۶ بیتی</span></div>'
    }
  ]);

  // Modals
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');
  const [newColTitle, setNewColTitle] = useState('');

  // Link Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetColIdForLink, setTargetColIdForLink] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkType, setLinkType] = useState<'category' | 'page' | 'system' | 'custom'>('system');
  const [linkUrl, setLinkUrl] = useState('');

  // Badge Modal
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [badgeTitle, setBadgeTitle] = useState('');
  const [badgeImageUrl, setBadgeImageUrl] = useState('');
  const [badgeLinkUrl, setBadgeLinkUrl] = useState('');
  const [badgeHtmlCode, setBadgeHtmlCode] = useState('');

  // Feature Modal
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [featTitle, setFeatTitle] = useState('');
  const [featDesc, setFeatDesc] = useState('');
  const [featIcon, setFeatIcon] = useState('ShieldCheck');

  // Available icon options for features
  const featureIcons = [
    { id: 'ShieldCheck', label: 'سپر / اصالت', icon: ShieldCheck },
    { id: 'Truck', label: 'کامیون / ارسال اکسپرس', icon: Truck },
    { id: 'Clock', label: 'ساعت / مهلت تست', icon: Clock },
    { id: 'Headphones', label: 'هدفون / مشاوره تخصصی', icon: Headphones },
    { id: 'Wrench', label: 'آچار / فنی', icon: Wrench },
    { id: 'Zap', label: 'رعد / سریع', icon: Zap },
    { id: 'Package', label: 'جعبه / قطعات', icon: Package }
  ];

  // Save all to store
  const handleSaveAll = () => {
    updateSettings({
      footerAboutTitle,
      footerAboutText,
      footerCopyrightText,
      footerCustomHtml,
      footerShowFeatures,
      footerFeatures: features,
      footerColumns: columns,
      footerShowBadges,
      footerBadges: badges
    });
    showToast('تنظیمات فوتر، ستون‌ها و نمادهای اعتماد با موفقیت ذخیره گردید.');
  };

  // Feature handlers
  const handleOpenAddFeature = () => {
    setEditingFeatureId(null);
    setFeatTitle('');
    setFeatDesc('');
    setFeatIcon('ShieldCheck');
    setIsFeatureModalOpen(true);
  };

  const handleEditFeature = (f: FooterFeatureItem) => {
    setEditingFeatureId(f.id);
    setFeatTitle(f.title);
    setFeatDesc(f.description);
    setFeatIcon(f.icon || 'ShieldCheck');
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featTitle) return;
    let next: FooterFeatureItem[];
    if (editingFeatureId) {
      next = features.map(f => f.id === editingFeatureId ? { ...f, title: featTitle, description: featDesc, icon: featIcon } : f);
    } else {
      next = [...features, { id: `feat-${Date.now()}`, title: featTitle, description: featDesc, icon: featIcon }];
    }
    setFeatures(next);
    setIsFeatureModalOpen(false);
    updateSettings({ footerFeatures: next });
    showToast('ویژگی فوتر بروزرسانی شد.');
  };

  const handleDeleteFeature = (id: string) => {
    if (confirm('آیا از حذف این ویژگی اطمینان دارید؟')) {
      const next = features.filter(f => f.id !== id);
      setFeatures(next);
      updateSettings({ footerFeatures: next });
    }
  };

  // Column handlers
  const handleAddColumn = () => {
    if (!newColTitle.trim()) {
      showToast('لطفا عنوان ستون را وارد کنید.', 'error');
      return;
    }
    const newCol: FooterColumn = {
      id: `fcol-${Date.now()}`,
      title: newColTitle.trim(),
      links: []
    };
    const next = [...columns, newCol];
    setColumns(next);
    setNewColTitle('');
    updateSettings({ footerColumns: next });
    showToast('ستون جدید به فوتر افزوده شد.');
  };

  const handleDeleteColumn = (colId: string) => {
    if (confirm('آیا از حذف این ستون و تمام لینک‌های آن اطمینان دارید؟')) {
      const next = columns.filter(c => c.id !== colId);
      setColumns(next);
      updateSettings({ footerColumns: next });
      showToast('ستون حذف شد.', 'info');
    }
  };

  // Link handlers
  const handleOpenAddLink = (colId: string) => {
    setTargetColIdForLink(colId);
    setEditingLinkId(null);
    setLinkTitle('');
    setLinkType('system');
    setLinkUrl('shop');
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLink = (colId: string, link: FooterLink) => {
    setTargetColIdForLink(colId);
    setEditingLinkId(link.id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkType(link.url.startsWith('page:') ? 'page' : link.url.startsWith('category:') ? 'category' : /^https?:/i.test(link.url) ? 'custom' : 'system');
    setIsLinkModalOpen(true);
  };

  const moveColumn = (colId: string, direction: 'up' | 'down') => {
    const index = columns.findIndex(col => col.id === colId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= columns.length) return;
    const next = [...columns];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setColumns(next);
    updateSettings({ footerColumns: next });
  };

  const moveLink = (colId: string, linkId: string, direction: 'up' | 'down') => {
    const next = columns.map(col => {
      if (col.id !== colId) return col;
      const links = [...col.links];
      const index = links.findIndex(link => link.id === linkId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= links.length) return col;
      [links[index], links[targetIndex]] = [links[targetIndex], links[index]];
      return { ...col, links };
    });
    setColumns(next);
    updateSettings({ footerColumns: next });
  };

  const beginRenameColumn = (colId: string) => {
    const current = columns.find(col => col.id === colId);
    if (!current) return;
    setEditingColId(colId);
    setEditingColTitle(current.title);
  };

  const saveRenamedColumn = (colId: string) => {
    const title = editingColTitle.trim();
    if (!title) return;
    const next = columns.map(col => col.id === colId ? { ...col, title } : col);
    setColumns(next);
    updateSettings({ footerColumns: next });
    setEditingColId(null);
    setEditingColTitle('');
    showToast('عنوان ستون فوتر ویرایش شد.');
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColIdForLink || !linkTitle || !linkUrl) {
      showToast('عنوان و لینک الزامی هستند.', 'error');
      return;
    }
    const next = columns.map(col => {
      if (col.id !== targetColIdForLink) return col;
      if (editingLinkId) {
        return {
          ...col,
          links: col.links.map(link => link.id === editingLinkId ? { ...link, title: linkTitle, url: linkUrl } : link)
        };
      }
      const newLink: FooterLink = {
        id: `flink-${Date.now()}`,
        title: linkTitle,
        url: linkUrl
      };
      return { ...col, links: [...col.links, newLink] };
    });

    setColumns(next);
    setIsLinkModalOpen(false);
    updateSettings({ footerColumns: next });
    showToast(editingLinkId ? 'لینک فوتر ویرایش شد.' : 'لینک به ستون فوتر افزوده شد.');
    setEditingLinkId(null);
  };

  const handleDeleteLink = (colId: string, linkId: string) => {
    const next = columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          links: col.links.filter(l => l.id !== linkId)
        };
      }
      return col;
    });
    setColumns(next);
    updateSettings({ footerColumns: next });
    showToast('لینک حذف شد.', 'info');
  };

  // Badge handlers
  const handleOpenAddBadge = () => {
    setEditingBadgeId(null);
    setBadgeTitle('');
    setBadgeImageUrl('');
    setBadgeLinkUrl('');
    setBadgeHtmlCode('');
    setIsBadgeModalOpen(true);
  };

  const handleEditBadge = (b: FooterBadgeItem) => {
    setEditingBadgeId(b.id);
    setBadgeTitle(b.title);
    setBadgeImageUrl(b.imageUrl || '');
    setBadgeLinkUrl(b.linkUrl || '');
    setBadgeHtmlCode(b.htmlCode || '');
    setIsBadgeModalOpen(true);
  };

  const handleSaveBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeTitle) return;

    let next: FooterBadgeItem[];
    if (editingBadgeId) {
      next = badges.map(b => b.id === editingBadgeId ? {
        ...b,
        title: badgeTitle,
        imageUrl: badgeImageUrl.trim() || undefined,
        linkUrl: badgeLinkUrl.trim() || undefined,
        htmlCode: badgeHtmlCode.trim() || undefined
      } : b);
    } else {
      next = [...badges, {
        id: `badge-${Date.now()}`,
        title: badgeTitle,
        imageUrl: badgeImageUrl.trim() || undefined,
        linkUrl: badgeLinkUrl.trim() || undefined,
        htmlCode: badgeHtmlCode.trim() || undefined
      }];
    }

    setBadges(next);
    setIsBadgeModalOpen(false);
    updateSettings({ footerBadges: next });
    showToast('نماد اعتماد ذخیره شد.');
  };

  const handleDeleteBadge = (id: string) => {
    if (confirm('آیا از حذف این نماد اعتماد اطمینان دارید؟')) {
      const next = badges.filter(b => b.id !== id);
      setBadges(next);
      updateSettings({ footerBadges: next });
      showToast('نماد حذف گردید.', 'info');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      
      {/* Header and Subtab Navigation */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Columns className="w-5 h-5 text-red-600" />
            <span>مدیریت جامع فوتر، لینک‌ها و نمادهای اعتماد (اینماد و بانک)</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            ویرایش کامل متن درباره ما، ستون‌ها و لینک‌های دلخواه، ویژگی‌های تضمین خرید، اینماد و کدهای اختصاصی HTML
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>ذخیره تمامی تغییرات فوتر</span>
        </button>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3 text-xs">
        <button
          onClick={() => setActiveSubtab('columns')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubtab === 'columns'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>ستون‌ها و لینک‌های فوتر ({columns.length})</span>
        </button>

        <button
          onClick={() => setActiveSubtab('badges')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubtab === 'badges'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>اینماد و آیکون‌های بانکی ({badges.length})</span>
        </button>

        <button
          onClick={() => setActiveSubtab('features')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubtab === 'features'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>ویژگی‌های تضمین خرید ({features.length})</span>
        </button>

        <button
          onClick={() => setActiveSubtab('about')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubtab === 'about'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>متن درباره ما و کپی‌رایت</span>
        </button>

        <button
          onClick={() => setActiveSubtab('html')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubtab === 'html'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Code className="w-4 h-4 text-blue-500" />
          <span>ویرایشگر کد اختصاصی HTML</span>
        </button>
      </div>

      {/* =========================================================================
          SUBTAB 1: COLUMNS AND LINKS BUILDER
      ========================================================================= */}
      {activeSubtab === 'columns' && (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-neutral-900">افزودن ستون جدید به فوتر</h4>
              <p className="text-xs text-neutral-500 mt-0.5">می‌توانید ستون‌های دلخواه مثل «قوانین»، «تماس با ما» یا «خدمات شرکتی» ایجاد کنید.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                placeholder="عنوان ستون جدید..."
                className="p-2 border border-neutral-300 rounded-xl text-xs flex-1 sm:w-60 bg-white"
              />
              <button
                onClick={handleAddColumn}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن ستون</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.map(col => (
              <div key={col.id} className="border border-neutral-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          value={editingColTitle}
                          onChange={e => setEditingColTitle(e.target.value)}
                          className="min-w-0 flex-1 p-1.5 border border-blue-300 rounded-lg text-xs font-bold bg-white"
                          autoFocus
                        />
                        <button type="button" onClick={() => saveRenamedColumn(col.id)} className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg cursor-pointer" title="ذخیره عنوان"><Check className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => { setEditingColId(null); setEditingColTitle(''); }} className="p-1.5 bg-neutral-100 text-neutral-600 rounded-lg cursor-pointer" title="لغو"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <h5 className="font-bold text-sm text-neutral-900 truncate">{col.title}</h5>
                    )}
                    <span className="text-[11px] text-neutral-400 shrink-0">({col.links.length} لینک)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveColumn(col.id, 'up')} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg cursor-pointer" title="انتقال ستون به بالا"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveColumn(col.id, 'down')} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg cursor-pointer" title="انتقال ستون به پایین"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => beginRenameColumn(col.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer" title="ویرایش عنوان ستون"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => handleOpenAddLink(col.id)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن لینک</span>
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(col.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف ستون"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Links list in column */}
                <div className="space-y-2 text-xs">
                  {col.links.length === 0 ? (
                    <div className="text-center py-6 text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                      لینکی در این ستون وجود ندارد. روی «افزودن لینک» کلیک کنید.
                    </div>
                  ) : (
                    col.links.map((link, linkIndex) => (
                      <div key={link.id} className="flex items-center justify-between gap-2 p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100/80 transition-colors">
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-800 block">{link.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5 truncate">{link.url}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" disabled={linkIndex === 0} onClick={() => moveLink(col.id, link.id, 'up')} className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-25 rounded-md cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button type="button" disabled={linkIndex === col.links.length - 1} onClick={() => moveLink(col.id, link.id, 'down')} className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-25 rounded-md cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => handleOpenEditLink(col.id, link)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer" title="ویرایش لینک"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(col.id, link.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                            title="حذف لینک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 2: ENAMAD & BANK BADGES BUILDER
      ========================================================================= */}
      {activeSubtab === 'badges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>بخش نمادهای اعتماد الکترونیکی و لوگوهای پرداخت</span>
              </div>
              <p className="text-xs text-emerald-800/80 mt-1">
                اینجا می‌توانید لوگوی اینماد، ستاد ساماندهی، شاپرک، بانک ملت، پارسیان یا هر درگاه بانکی را به صورت تصویر یا کد HTML درج نمایید.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerShowBadges}
                  onChange={e => {
                    setFooterShowBadges(e.target.checked);
                    updateSettings({ footerShowBadges: e.target.checked });
                  }}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span>نمایش بخش نمادها در فوتر</span>
              </label>

              <button
                onClick={handleOpenAddBadge}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن نماد یا درگاه جدید</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {badges.map(b => (
              <div key={b.id} className="border border-neutral-200 rounded-2xl p-5 bg-white space-y-3 relative group shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900">{b.title}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditBadge(b)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBadge(b.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="p-4 bg-neutral-900 rounded-xl text-center flex items-center justify-center min-h-[100px]">
                  {b.htmlCode ? (
                    <div dangerouslySetInnerHTML={{ __html: b.htmlCode }} />
                  ) : b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-16 w-auto object-contain mx-auto" />
                  ) : (
                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                  )}
                </div>

                <div className="text-[11px] text-neutral-500 space-y-1">
                  {b.linkUrl && (
                    <div className="truncate">
                      <span className="text-neutral-400">لینک مقصد: </span>
                      <span className="font-mono text-neutral-700">{b.linkUrl}</span>
                    </div>
                  )}
                  {b.htmlCode && (
                    <span className="text-emerald-600 font-bold block">دارای کد اختصاصی HTML</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 3: VALUE PROPS / FEATURES
      ========================================================================= */}
      {activeSubtab === 'features' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div>
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>ویژگی‌های تضمین خرید (نوار بالای فوتر)</span>
              </div>
              <p className="text-xs text-amber-800/80 mt-1">
                تضمین اصالت، ارسال اکسپرس، مهلت تست و مشاوره‌های قبل از خرید را می‌توانید ویرایش یا حذف و اضافه کنید.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerShowFeatures}
                  onChange={e => {
                    setFooterShowFeatures(e.target.checked);
                    updateSettings({ footerShowFeatures: e.target.checked });
                  }}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span>نمایش این بخش در بالای فوتر</span>
              </label>

              <button
                onClick={handleOpenAddFeature}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن ویژگی جدید</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.id} className="border border-neutral-200 rounded-2xl p-4 bg-white space-y-3 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditFeature(f)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeature(f.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-neutral-900">{f.title}</h5>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 4: ABOUT TEXT & COPYRIGHT
      ========================================================================= */}
      {activeSubtab === 'about' && (
        <div className="space-y-6 max-w-3xl">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">عنوان ستون درباره ما در فوتر:</label>
              <input
                type="text"
                value={footerAboutTitle}
                onChange={e => setFooterAboutTitle(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
                placeholder="مثال: فروشگاه اینترنتی قطعات خودرو"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">متن توضیحات معرفی و بیوگرافی فوتر:</label>
              <textarea
                rows={4}
                value={footerAboutText}
                onChange={e => setFooterAboutText(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-xl leading-relaxed"
                placeholder="توضیحات سابقه، تامین مستقیم قطعات از چین و خطوط تولید..."
              />
            </div>

            <div className="pt-2">
              <label className="block text-neutral-700 font-bold mb-1">متن کپی‌رایت انتهای فوتر:</label>
              <input
                type="text"
                value={footerCopyrightText}
                onChange={e => setFooterCopyrightText(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
                placeholder="مثال: تمامی حقوق برای نام فروشگاه محفوظ است..."
              />
            </div>

            <button
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              ذخیره متن درباره ما و کپی‌رایت
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 5: CUSTOM HTML & SCRIPT EDITOR
      ========================================================================= */}
      {activeSubtab === 'html' && (
        <div className="space-y-6">
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <Code className="w-4 h-4 text-blue-600" />
              <span>ویرایشگر کد اختصاصی HTML / اسکریپت‌های فوتر</span>
            </h4>
            <p>
              اگر از نماد اعتماد الکترونیکی (اینماد)، ساماندهی، درگاه‌های پرداخت، یا ابزارهای چت آنلاین کدهای اختصاصی (&lt;script&gt;، &lt;iframe&gt;، &lt;a&gt;) دریافت کرده‌اید، مستقیماً اینجا قرار دهید تا در فوتر رندر شوند.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-800">کد HTML / جاوااسکریپت:</label>
                <button
                  type="button"
                  onClick={() => setFooterCustomHtml('')}
                  className="text-red-500 hover:underline text-[11px] cursor-pointer"
                >
                  پاکسازی کد
                </button>
              </div>
              <textarea
                rows={12}
                value={footerCustomHtml}
                onChange={e => setFooterCustomHtml(e.target.value)}
                placeholder="<!-- کدهای HTML دلخواه یا تگ‌های اسکریپت اینماد -->"
                className="w-full p-3 font-mono text-left bg-neutral-900 text-emerald-400 border border-neutral-800 rounded-2xl text-xs leading-relaxed focus:outline-hidden"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-800">پیش‌نمایش زنده در فوتر:</label>
                <span className="text-[10px] text-neutral-400">همانند ظاهر در تم تاریک فوتر</span>
              </div>
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl min-h-[260px] text-white flex items-center justify-center">
                {footerCustomHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: footerCustomHtml }} />
                ) : (
                  <span className="text-neutral-500 text-xs">هیچ کدی برای پیش‌نمایش وارد نشده است.</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            ذخیره کدهای HTML فوتر
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT FEATURE
      ========================================================================= */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">
                {editingFeatureId ? 'ویرایش ویژگی تضمین خرید' : 'افزودن ویژگی جدید به فوتر'}
              </h4>
              <button onClick={() => setIsFeatureModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeature} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان ویژگی *:</label>
                <input
                  type="text"
                  value={featTitle}
                  onChange={e => setFeatTitle(e.target.value)}
                  placeholder="مثال: ضمانت اصالت ۱۰۰٪ قطعه"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">توضیح کوتاه:</label>
                <input
                  type="text"
                  value={featDesc}
                  onChange={e => setFeatDesc(e.target.value)}
                  placeholder="مثال: قطعات اصلی شرکتی با هولوگرام لیزری"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">انتخاب آیکون نمایشی:</label>
                <div className="grid grid-cols-2 gap-2">
                  {featureIcons.map(item => {
                    const IconCmp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFeatIcon(item.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                          featIcon === item.id 
                            ? 'border-red-600 bg-red-50 text-red-700 font-bold' 
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <IconCmp className="w-4 h-4 text-red-600" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  ذخیره ویژگی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD LINK TO COLUMN
      ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">{editingLinkId ? 'ویرایش لینک فوتر' : 'افزودن لینک به ستون فوتر'}</h4>
              <button onClick={() => setIsLinkModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">نوع لینک:</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setLinkType('system'); setLinkUrl('shop'); }}
                    className={`py-1.5 rounded-lg font-bold transition-colors ${linkType === 'system' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    سیستمی
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLinkType('category'); if (categories[0]) { setLinkUrl(`category:${categories[0].slug}`); setLinkTitle(categories[0].nameFa); } }}
                    className={`py-1.5 rounded-lg font-bold transition-colors ${linkType === 'category' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    دسته‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLinkType('page'); if (pages[0]) { setLinkUrl(`page:${pages[0].slug}`); setLinkTitle(pages[0].title); } }}
                    className={`py-1.5 rounded-lg font-bold transition-colors ${linkType === 'page' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    برگه‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLinkType('custom'); setLinkUrl('https://'); }}
                    className={`py-1.5 rounded-lg font-bold transition-colors ${linkType === 'custom' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'}`}
                  >
                    دستی / وب
                  </button>
                </div>
              </div>

              {/* Quick Dropdowns depending on Link Type */}
              {linkType === 'category' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">انتخاب دسته‌بندی قطعات:</label>
                  <select
                    onChange={(e) => {
                      const selected = categories.find(c => c.slug === e.target.value);
                      if (selected) {
                        setLinkUrl(`category:${selected.slug}`);
                        setLinkTitle(selected.nameFa);
                      }
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>
                        {c.nameFa} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'page' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">انتخاب برگه سایت:</label>
                  <select
                    onChange={(e) => {
                      const selected = pages.find(p => p.slug === e.target.value);
                      if (selected) {
                        setLinkUrl(`page:${selected.slug}`);
                        setLinkTitle(selected.title);
                      }
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  >
                    {pages.map(p => (
                      <option key={p.id} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'system' && (
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">صفحه سیستمی پیش‌فرض:</label>
                  <select
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      const opt = e.target.options[e.target.selectedIndex];
                      if (opt) setLinkTitle(opt.text);
                    }}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  >
                    <option value="shop">فروشگاه قطعات</option>
                    <option value="shop:maintenance">قطعات مصرفی و سرویس دوره‌ای</option>
                    <option value="part-request">استعلام قطعه نایاب</option>
                    <option value="tracking">پیگیری وضعیت سفارش و مرسوله</option>
                    <option value="blog">مقالات و آموزش عیب‌یابی</option>
                    <option value="account:garage">گاراژ خودروهای من</option>
                    <option value="account">ورود یا حساب کاربری</option>
                    <option value="admin">پنل مدیریت انبار</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان نمایشی لینک در فوتر *:</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  placeholder="مثال: پیگیری سفارش و کد رهگیری"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">آدرس لینک (URL یا شناسه صفحه):</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="page:about یا https://..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  {editingLinkId ? 'ذخیره تغییرات لینک' : 'افزودن لینک'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT BADGE (ENAMAD & BANKS)
      ========================================================================= */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-black text-sm text-neutral-900">
                {editingBadgeId ? 'ویرایش نماد یا لوگوی بانکی' : 'افزودن نماد اعتماد الکترونیکی یا درگاه'}
              </h4>
              <button onClick={() => setIsBadgeModalOpen(false)} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBadge} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان نماد یا بانک *:</label>
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={e => setBadgeTitle(e.target.value)}
                  placeholder="مثال: نماد اعتماد الکترونیکی دو ستاره"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              {/* Image Upload Input */}
              <ImageUploadInput
                label="تصویر یا لوگوی نماد:"
                value={badgeImageUrl}
                onChange={url => setBadgeImageUrl(url)}
                aspectRatio="square"
                presetCategory="logos"
                placeholder="آدرس اینترنتی یا آپلود فایل لوگو..."
                helperText="لوگوی اینماد، ساماندهی یا لوگوی بانک‌های ملت، پارسیان، سامان..."
              />

              <div>
                <label className="block text-neutral-700 font-bold mb-1">لینک مقصد (اختیاری):</label>
                <input
                  type="text"
                  value={badgeLinkUrl}
                  onChange={e => setBadgeLinkUrl(e.target.value)}
                  placeholder="https://trustseal.enamad.ir/..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">کد اختصاصی HTML / اسکریپت تاییدیه (اختیاری):</label>
                <textarea
                  rows={3}
                  value={badgeHtmlCode}
                  onChange={e => setBadgeHtmlCode(e.target.value)}
                  placeholder="<a referrerpolicy='origin' target='_blank' href='...'><img src='...' /></a>"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left text-[11px]"
                  dir="ltr"
                />
                <span className="text-[10px] text-neutral-400 block mt-0.5">در صورت وارد کردن کد HTML، این کد دقیقاً در فوتر اجرا خواهد شد.</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 cursor-pointer"
                >
                  ذخیره نماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
