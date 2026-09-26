import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category, CustomerUser, PaymentGatewayConfig, OrderStatus, AdminRole, VehicleFitment } from '../../types';
import { formatToman, getGradeInfo } from '../../utils/formatters';
import { 
  Settings, 
  Layers, 
  Search, 
  Upload, 
  Download, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  FileText,
  BarChart3,
  Bell,
  Lock, 
  LogOut, 
  Palette, 
  CreditCard, 
  Radio, 
  Users, 
  Plus, 
  Trash2, 
  Eye, 
  KeyRound, 
  ShieldAlert, 
  Send, 
  Printer, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  ExternalLink, 
  PhoneCall, 
  Car, 
  BookOpen, 
  Receipt, 
  Menu,
  X,
  ShieldCheck,
  ArrowRight,
  Wrench,
  Image as ImageIcon,
  Compass,
  FileCheck2,
  Sparkles,
  LayoutTemplate,
  Type
} from 'lucide-react';
import { AdminCarsTab } from './AdminCarsTab';
import { AdminArticlesTab } from './AdminArticlesTab';
import { AdminSandboxGateway } from './AdminSandboxGateway';
import { AdminMenusAndAttributes } from './AdminMenusAndAttributes';
import { AdminSlidersTab } from './AdminSlidersTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminPagesTab } from './AdminPagesTab';
import { InvoiceModal } from '../orders/InvoiceModal';
import { RichTextEditor } from '../common/RichTextEditor';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface AdminViewProps {
  onExitToStore?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onExitToStore }) => {
  const { 
    products, 
    addProduct,
    updateProduct, 
    deleteProduct,
    bulkUpdateProducts, 
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    brands,
    models,
    articles,
    sliders,
    pages,
    orders,
    updateOrderStatus,
    deleteOrder,
    customers,
    addCustomer,
    updateCustomer,
    toggleCustomerStatus,
    adminUsers,
    settings,
    updateSettings,
    paymentGateways,
    updatePaymentGateway,
    toggleGatewayActive,
    apiIntegrations,
    updateApiIntegrations,
    searchLogs, 
    partRequests, 
    updatePartRequestStatus,
    adminAuth,
    adminLogin,
    adminChangePassword,
    adminLogout,
    showToast 
  } = useStore();

  // Navigation tab inside Admin
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cars' | 'products' | 'categories' | 'menus_attrs' | 'pages' | 'articles' | 'sliders' | 'orders' | 'customers' | 'admins' | 'gateways' | 'sandbox' | 'apis' | 'theme' | 'bulk' | 'analytics'
  >('overview');

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Force Change Password State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePassError, setChangePassError] = useState('');

  // Product Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    nameFa: '',
    nameEn: '',
    oemNumber: '',
    partNumber: '',
    sku: '',
    brandManufacturer: 'Chery Genuine',
    categorySlug: 'engine',
    grade: 'genuine',
    price: 1500000,
    stock: 10,
    stockStatus: 'in_stock',
    countryOfOrigin: 'چین',
    warrantyMonths: 12,
    warrantyDescription: '۱۲ ماه ضمانت رسمی تعویض شرکتی',
    placement: 'موتور',
    images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80'],
    shortDescription: '',
    description: 'قطعه اصلی و فابریک کارخانه',
    technicalSpecs: {
      'نوع قطعه': 'اصلی شرکتی',
      'سیستم': 'پیشرانه و موتور'
    },
    symptomsOfFailure: ['روشن شدن چراغ چک', 'کاهش توان'],
    replacementInterval: 'هر ۵۰ هزار کیلومتر',
    installationTips: ['تعویض در نمایندگی مجاز'],
    genuineVsFakeNotes: 'دارای هولوگرام و کد رهگیری اصالت',
    fitments: [
      { id: 'fit-custom', brandId: 'kmc', brandName: 'KMC', modelId: 'kmc-j7', modelName: 'KMC J7', yearFrom: 1401, yearTo: 1404, engine: '1.5 Turbo' }
    ]
  });

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatFa, setNewCatFa] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custForm, setCustForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    type: 'retail' as CustomerUser['type'],
    vehicle: '',
    address: ''
  });

  // Official Invoice Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  // Bulk Edit Table State
  const [bulkUpdates, setBulkUpdates] = useState<Record<string, { price: number; stock: number }>>({});

  // Theme Settings Form Local State
  const [themeForm, setThemeForm] = useState(settings);

  // APIs Form Local State
  const [apiForm, setApiForm] = useState(apiIntegrations);

  // Permissions helper
  const currentUser = adminAuth.currentUser;
  const permissions = currentUser?.permissions;

  const hasAccessToTab = (tabId: string): boolean => {
    if (!currentUser || currentUser.role === 'super_admin') return true;
    if (!permissions) return true;

    switch (tabId) {
      case 'overview': return true;
      case 'products':
      case 'cars':
      case 'categories':
      case 'bulk':
        return permissions.canManageProducts || permissions.canManageVehicles;
      case 'orders':
      case 'customers':
        return permissions.canManageOrders;
      case 'articles':
      case 'pages':
        return permissions.canManageArticles || permissions.canManageSettings;
      case 'sliders':
        return permissions.canManageSliders;
      case 'menus_attrs':
      case 'theme':
      case 'gateways':
      case 'apis':
        return permissions.canManageSettings;
      case 'admins':
        return permissions.canManageAdmins;
      case 'sandbox':
        return permissions.canAccessSandbox;
      default:
        return true;
    }
  };

  // --- Handlers ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = adminLogin(loginUser, loginPass);
    if (!result.success) {
      setLoginError(result.error || 'خطا در ورود');
    }
  };

  const handleQuickDemoLogin = (username: string, pass: string) => {
    setLoginUser(username);
    setLoginPass(pass);
    const result = adminLogin(username, pass);
    if (!result.success) {
      setLoginError(result.error || 'خطا در ورود');
    }
  };

  const handleForcePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError('رمز عبور جدید با تکرار آن یکسان نیست.');
      return;
    }
    const res = adminChangePassword(currentPasswordInput, newPasswordInput);
    if (!res.success) {
      setChangePassError(res.error || 'خطا در تغییر رمز عبور');
    }
  };

  const handleBulkPriceChange = (id: string, price: number) => {
    setBulkUpdates(prev => ({
      ...prev,
      [id]: {
        price,
        stock: prev[id]?.stock ?? (products.find(p => p.id === id)?.stock || 0)
      }
    }));
  };

  const handleBulkStockChange = (id: string, stock: number) => {
    setBulkUpdates(prev => ({
      ...prev,
      [id]: {
        price: prev[id]?.price ?? (products.find(p => p.id === id)?.price || 0),
        stock
      }
    }));
  };

  const handleApplyBulkUpdates = () => {
    const updates = Object.entries(bulkUpdates).map(([id, vals]) => ({
      id,
      price: vals.price,
      stock: vals.stock
    }));

    if (updates.length === 0) {
      showToast('هیچ تغییری اعمال نشده است.', 'info');
      return;
    }

    bulkUpdateProducts(updates);
    setBulkUpdates({});
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.nameFa || !newProductForm.oemNumber) {
      showToast('نام و شماره فنی کالا الزامی است.', 'error');
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      slug: (newProductForm.oemNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      sku: newProductForm.sku || `SKU-${Date.now().toString().slice(-4)}`,
      oemNumber: (newProductForm.oemNumber || '').toUpperCase(),
      partNumber: newProductForm.partNumber || newProductForm.oemNumber || '',
      nameFa: newProductForm.nameFa || '',
      nameEn: newProductForm.nameEn || '',
      categorySlug: newProductForm.categorySlug || 'engine',
      brandManufacturer: newProductForm.brandManufacturer || 'Chery Genuine',
      grade: newProductForm.grade || 'genuine',
      price: Number(newProductForm.price) || 0,
      stock: Number(newProductForm.stock) || 0,
      stockStatus: (Number(newProductForm.stock) || 0) > 0 ? 'in_stock' : 'out_of_stock',
      images: newProductForm.images || ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80'],
      rating: 5,
      reviewsCount: 1,
      weightKg: Number(newProductForm.weightKg) || 1.5,
      dimensionsCm: newProductForm.dimensionsCm || '30x20x15',
      countryOfOrigin: newProductForm.countryOfOrigin || 'چین',
      warrantyMonths: Number(newProductForm.warrantyMonths) || 12,
      warrantyDescription: newProductForm.warrantyDescription || '۱۲ ماه ضمانت رسمی تعویض شرکتی',
      placement: newProductForm.placement || 'موتور',
      shortDescription: newProductForm.shortDescription || '',
      description: newProductForm.description || 'قطعه اصلی و فابریک کارخانه',
      technicalSpecs: newProductForm.technicalSpecs || { 'گرید': 'اصلی' },
      symptomsOfFailure: ['افت راندمان', 'صدای غیرعادی'],
      replacementInterval: 'هر ۵۰ هزار کیلومتر',
      installationTips: ['نصب توسط مکانیک مجرب'],
      genuineVsFakeNotes: 'هولوگرام شرکتی و بارکد ردیابی',
      fitments: newProductForm.fitments || [
        { id: 'fit-gen', brandId: 'kmc', brandName: 'KMC', modelId: 'kmc-j7', modelName: 'KMC J7', yearFrom: 1401, yearTo: 1404, engine: '1.5 Turbo' }
      ]
    };

    addProduct(newProd);
    setIsNewProductModalOpen(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatFa || !newCatSlug) return;
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      nameFa: newCatFa,
      nameEn: newCatEn || newCatSlug,
      slug: newCatSlug.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      icon: 'Package',
      description: newCatDesc || 'دسته‌بندی تخصصی قطعات خودرو'
    };
    addCategory(newCategory);
    setNewCatFa('');
    setNewCatEn('');
    setNewCatSlug('');
    setNewCatDesc('');
    setIsCategoryModalOpen(false);
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.firstName || !custForm.lastName || !custForm.phone) {
      showToast('لطفا فیلدهای ستاره‌دار را تکمیل نمایید.', 'error');
      return;
    }
    const typeTitles: Record<CustomerUser['type'], string> = {
      retail: 'مشتری عادی',
      mechanic: 'تعمیرکار / همکار',
      wholesale: 'عمده‌فروش'
    };
    addCustomer({
      firstName: custForm.firstName,
      lastName: custForm.lastName,
      phone: custForm.phone,
      type: custForm.type,
      typeTitle: typeTitles[custForm.type],
      status: 'active',
      vehicle: custForm.vehicle || undefined,
      address: custForm.address || undefined
    });
    setCustForm({
      firstName: '',
      lastName: '',
      phone: '',
      type: 'retail',
      vehicle: '',
      address: ''
    });
    setIsCustomerModalOpen(false);
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(themeForm);
  };

  const handleSaveApis = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiIntegrations(apiForm);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + "کد کالا,نام فارسی,شماره فنی OEM,قیمت (تومان),موجودی,دسته,گرید کیفی\n"
      + products.map(p => `"${p.sku}","${p.nameFa}","${p.oemNumber}",${p.price},${p.stock},"${p.categorySlug}","${p.grade}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chinpart_products_${new Date().toLocaleDateString('fa-IR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل اکسل کاتالوگ قطعات با موفقیت دانلود شد.');
  };

  // =========================================================================
  // VIEW 1: DEDICATED PROFESSIONAL ADMIN LOGIN PORTAL
  // =========================================================================
  if (!adminAuth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white flex flex-col justify-center items-center p-4">
        {/* Top return button */}
        <div className="w-full max-w-md flex justify-between items-center mb-6">
          <button
            onClick={onExitToStore || (() => window.location.href = '/')}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-red-500" />
            <span>بازگشت به سایت فروشگاه</span>
          </button>
          <span className="text-[11px] font-mono text-neutral-500">Security Gate v4.2</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md space-y-6 text-right">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white mx-auto shadow-xl shadow-red-600/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white pt-2">پرتال اختصاصی مدیریت سیستم</h2>
            <p className="text-xs text-neutral-400">
              ورود امن به سامانه جامع مدیریت فروشگاه چین‌پارت
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-bold mb-1.5">نام کاربری مدیر:</label>
              <input
                type="text"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="admin یا content یا orders"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left text-white"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1.5">رمز عبور امنیتی:</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>احراز هویت و ورود به کنترل پنل</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MANDATORY PASSWORD CHANGE (When using default initial password)
  // =========================================================================
  if (adminAuth.isMustChangePassword) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center p-4">
        <div className="bg-white text-neutral-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-right">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-neutral-900">تغییر اجباری رمز عبور اولیه ادمین</h2>
            <p className="text-xs text-neutral-500">
              جهت جلوگیری از نفوذ و ارتقای امنیت فروشگاه، ملزم به تغییر رمز عبور پیش‌فرض هستید.
            </p>
          </div>

          {changePassError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
              {changePassError}
            </div>
          )}

          <form onSubmit={handleForcePasswordChangeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">رمز عبور فعلی:</label>
              <input
                type="password"
                value={currentPasswordInput}
                onChange={e => setCurrentPasswordInput(e.target.value)}
                placeholder="رمز عبور فعلی خود را وارد کنید"
                className="w-full p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">رمز عبور جدید (حداقل ۶ کاراکتر):</label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={e => setNewPasswordInput(e.target.value)}
                placeholder="رمز عبور قوی جدید"
                className="w-full p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">تکرار رمز عبور جدید:</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={e => setConfirmPasswordInput(e.target.value)}
                placeholder="تکرار رمز عبور جدید"
                className="w-full p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>تغییر رمز عبور و ورود به کنترل پنل</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={adminLogout}
              className="text-xs text-neutral-400 hover:text-neutral-600 underline"
            >
              انصراف و خروج از حساب
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FULL ENTERPRISE ADMIN DASHBOARD WITH DEDICATED VERTICAL SIDEBAR
  // =========================================================================
  const navigationGroups = [
    {
      groupTitle: 'داشبورد و آمار',
      items: [
        { id: 'overview', label: 'داشبورد آماری', icon: BarChart3 }
      ]
    },
    {
      groupTitle: 'کاتالوگ و انبارداری',
      items: [
        { id: 'products', label: 'محصولات و انبار', icon: Package, count: products.length },
        { id: 'cars', label: 'خودروها و برندها', icon: Car, count: models.length },
        { id: 'categories', label: 'دسته‌بندی قطعات', icon: Layers, count: categories.length },
        { id: 'bulk', label: 'ویرایش گروهی (Bulk)', icon: Sliders }
      ]
    },
    {
      groupTitle: 'فروش و مشتریان',
      items: [
        { id: 'orders', label: 'سفارش‌ها و صدور فاکتور', icon: FileCheck2, count: orders.length },
        { id: 'customers', label: 'مشتریان و همکاران (CRM)', icon: Users, count: customers.length },
        { id: 'sandbox', label: 'درگاه آزمایشی شاپرک', icon: Receipt }
      ]
    },
    {
      groupTitle: 'محتوا و وب‌سایت',
      items: [
        { id: 'pages', label: 'برگه‌ها و سکشن‌ها (Builder)', icon: LayoutTemplate, count: pages.length },
        { id: 'articles', label: 'مقالات و آموزش‌ها', icon: BookOpen, count: articles.length },
        { id: 'sliders', label: 'اسلایدرها و بنرها', icon: Compass, count: sliders.length },
        { id: 'menus_attrs', label: 'منوها و ویژگی‌ها', icon: Menu }
      ]
    },
    {
      groupTitle: 'سیستم و امنیت',
      items: [
        { id: 'theme', label: 'قالب، لوگو و فونت گوگل', icon: Palette },
        { id: 'gateways', label: 'درگاه‌های بانکی', icon: CreditCard, count: paymentGateways.filter(g => g.isActive).length },
        { id: 'apis', label: 'وب‌سرویس‌ها و پیامک', icon: Radio },
        { id: 'admins', label: 'مدیران و دسترسی‌ها', icon: ShieldCheck, count: adminUsers.length },
        { id: 'analytics', label: 'تحلیل جستجوها', icon: Search }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      
      {/* Top Professional Admin Bar */}
      <header className="bg-neutral-900 text-white h-16 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 border-b border-neutral-800 shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
            title={isSidebarCollapsed ? 'گسترش سایدبار' : 'جمع‌کردن سایدبار'}
          >
            {isSidebarCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Brand & Portal Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black shadow-md shadow-red-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-tight">
                کنترل پنل سازمانی چین‌پارت
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-red-600/90 text-white font-bold px-2 py-0.2 rounded-full mr-2">
                ADMIN ENTERPRISE
              </span>
            </div>
          </div>
        </div>

        {/* Right Top Bar Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Preview Store Link */}
          <button
            onClick={onExitToStore || (() => window.location.href = '/')}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-neutral-700"
            title="مشاهده ظاهر فروشگاه"
          >
            <ExternalLink className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">مشاهده فروشگاه</span>
          </button>

          {/* Active Admin Identity Badge */}
          <div className="flex items-center gap-2.5 bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 rounded-xl text-xs">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
              {adminAuth.username[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <span className="font-bold text-white block text-[11px] leading-tight">
                {currentUser?.fullName || adminAuth.username}
              </span>
              <span className="text-[10px] text-neutral-400">
                {currentUser?.roleTitle || 'مدیر کل سیستم'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={adminLogout}
            className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-xl transition-colors"
            title="خروج از حساب مدیریت"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body: Vertical Sidebar + Scrollable Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* =========================================================================
            DESKTOP & MOBILE VERTICAL SIDEBAR
        ========================================================================= */}
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          />
        )}

        <aside className={`
          fixed md:static inset-y-0 right-0 z-40
          bg-neutral-900 text-neutral-300 
          border-l border-neutral-800 
          flex flex-col 
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          ${isMobileSidebarOpen ? 'translate-x-0 w-72' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between md:hidden">
            <span className="font-bold text-sm text-white">منوی مدیریت فروشگاه</span>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-bold text-neutral-500 px-3 uppercase tracking-wider block mb-1">
                    {group.groupTitle}
                  </span>
                )}
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isPermitted = hasAccessToTab(item.id);

                  if (!isPermitted) return null; // Hide if user lacks role permission

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all text-right ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isSidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.count !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isActive ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer info */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/50 text-[10px] text-neutral-500 text-center">
              <span>چین‌پارت اختصاصی خودروهای چینی</span>
            </div>
          )}
        </aside>

        {/* =========================================================================
            RIGHT MAIN CONTENT AREA
        ========================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Quick Header Actions Bar */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="font-bold text-neutral-900">کنترل پنل</span>
              <span>/</span>
              <span className="text-red-600 font-bold">
                {navigationGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'داشبورد'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                title="دانلود خروجی کامل کاتالوگ انبار"
              >
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>خروجی اکسل انبار</span>
              </button>

              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>دیتابیس پویا فعال</span>
              </span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-xs text-neutral-400 font-semibold">مجموع فروش و فاکتورها:</span>
                  <div className="text-xl font-black text-neutral-900">
                    {formatToman(orders.reduce((sum, o) => sum + o.total, 0))}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold block pt-1">
                    {orders.length} سفارش ثبت شده
                  </span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-xs text-neutral-400 font-semibold">تعداد قطعات در انبار:</span>
                  <div className="text-xl font-black text-neutral-900">
                    {products.length} کالا
                  </div>
                  <span className="text-[11px] text-neutral-500 block pt-1">
                    تطبیق با {models.length} مدل خودروی چینی
                  </span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-xs text-neutral-400 font-semibold">مشتریان ثبت‌شده (CRM):</span>
                  <div className="text-xl font-black text-neutral-900">
                    {customers.length} کاربر
                  </div>
                  <span className="text-[11px] text-blue-600 font-bold block pt-1">
                    شامل مکانیک‌ها و خریداران عمده
                  </span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-xs text-neutral-400 font-semibold">استعلام قطعات نایاب:</span>
                  <div className="text-xl font-black text-neutral-900">
                    {partRequests.length} درخواست
                  </div>
                  <span className="text-[11px] text-amber-600 font-bold block pt-1">
                    {partRequests.filter(r => r.status === 'در حال بررسی').length} در انتظار پاسخ
                  </span>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setActiveTab('orders')}
                  className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs hover:border-red-600 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-neutral-900 group-hover:text-red-600 transition-colors">
                      سفارشات اخیر و صدور فاکتور
                    </h3>
                    <FileCheck2 className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    بررسی {orders.length} فاکتور ثبت شده و چاپ فرم رسمی مالیاتی با مهر دیجیتال
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('sliders')}
                  className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs hover:border-red-600 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-neutral-900 group-hover:text-red-600 transition-colors">
                      مدیریت اسلایدرهای صفحه نخست
                    </h3>
                    <Compass className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    طراحی {sliders.length} اسلاید تبلیغاتی با بنرهای باکیفیت و لینک‌های هدف
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('admins')}
                  className="p-5 bg-white rounded-3xl border border-neutral-200 shadow-xs hover:border-red-600 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-neutral-900 group-hover:text-red-600 transition-colors">
                      مدیران و سطوح دسترسی
                    </h3>
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    تعریف مدیران مختلف (محتوا، سفارشات، انبار) با مجوزهای تفکیک‌شده
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CARS & MODELS */}
          {activeTab === 'cars' && (
            <AdminCarsTab />
          )}

          {/* TAB 3: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-600" />
                    <span>فهرست کامل قطعات و انبارداری ({products.length} کالا)</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    تعریف شماره فنی OEM، توضیحات کوتاه و بلند با ادیتور غنی، فیتمنت‌ها و موجودی
                  </p>
                </div>

                <button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن قطعه جدید به انبار</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-600">
                    <tr>
                      <th className="p-3">تصویر</th>
                      <th className="p-3">نام قطعه</th>
                      <th className="p-3">OEM / پارت</th>
                      <th className="p-3">گرید کیفی</th>
                      <th className="p-3">قیمت فعلی</th>
                      <th className="p-3">موجودی انبار</th>
                      <th className="p-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-50/50">
                        <td className="p-3">
                          <img src={p.images[0]} alt={p.nameFa} className="w-10 h-10 object-cover rounded-lg border bg-neutral-100" />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-neutral-900">{p.nameFa}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{p.nameEn}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-neutral-700">{p.oemNumber}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                            {p.grade === 'genuine' ? 'شرکتی' : p.grade === 'oem' ? 'وارداتی' : 'استاندارد'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-neutral-900 font-mono">{formatToman(p.price)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            p.stock > 5 ? 'bg-emerald-50 text-emerald-700' :
                            p.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {p.stock} عدد
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="ویرایش مشخصات"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="حذف از انبار"
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

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-600" />
                    <span>دسته‌بندی تخصصی قطعات ({categories.length} دسته‌بندی)</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    تعریف زیردسته‌ها، آیکون‌ها و ساختار تاکسونومی فروشگاه
                  </p>
                </div>

                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن دسته‌بندی جدید</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900">{cat.nameFa}</h3>
                        <span className="text-[10px] text-neutral-400 font-mono">{cat.nameEn} ({cat.slug})</span>
                      </div>

                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-500">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MENUS AND ATTRIBUTES */}
          {activeTab === 'menus_attrs' && (
            <AdminMenusAndAttributes />
          )}

          {/* TAB: PAGES & SECTION BUILDER */}
          {activeTab === 'pages' && (
            <AdminPagesTab />
          )}

          {/* TAB 6: ARTICLES (BLOG) */}
          {activeTab === 'articles' && (
            <AdminArticlesTab />
          )}

          {/* TAB 7: SLIDERS & BANNERS */}
          {activeTab === 'sliders' && (
            <AdminSlidersTab />
          )}

          {/* TAB 8: ORDERS & INVOICES */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-red-600" />
                    <span>مدیریت سفارش‌ها و صدور صورت‌حساب رسمی ({orders.length} سفارش)</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    تغییر وضعیت سفارشات، ثبت کد رهگیری پستی و چاپ فاکتور رسمی استاندارد A4
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-700">
                    <tr>
                      <th className="p-3">شماره سفارش</th>
                      <th className="p-3">خریدار</th>
                      <th className="p-3">مبلغ کل</th>
                      <th className="p-3">روش ارسال</th>
                      <th className="p-3">وضعیت فعلی</th>
                      <th className="p-3">تغییر وضعیت</th>
                      <th className="p-3 text-left">صدور فاکتور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold text-red-600">
                          {order.orderNumber}
                          <span className="block text-[10px] text-neutral-400 font-normal">{order.date}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-neutral-900">{order.customer.firstName} {order.customer.lastName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{order.customer.phone}</div>
                        </td>
                        <td className="p-3 font-bold text-neutral-900 font-mono">
                          {formatToman(order.total)}
                        </td>
                        <td className="p-3 text-neutral-600">
                          {order.shippingMethod.title}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                            'bg-neutral-200 text-neutral-700'
                          }`}>
                            {order.statusTitle}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="p-1.5 border border-neutral-300 rounded-lg text-xs font-semibold bg-white"
                          >
                            <option value="paid">پرداخت شده</option>
                            <option value="processing">در حال پردازش انبار</option>
                            <option value="ready_to_ship">آماده ارسال</option>
                            <option value="shipped">ارسال شده (با تیپاکس/پست)</option>
                            <option value="delivered">تحویل داده شد</option>
                            <option value="cancelled">لغو سفارش</option>
                          </select>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 mr-auto shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ فاکتور</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: CUSTOMERS (CRM) */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" />
                    <span>مدیریت مشتریان، تعمیرکاران همکار و عمده‌فروشان</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    تعریف گروه‌های قیمتی، پیگیری سوابق سفارشات و مسدودسازی دسترسی
                  </p>
                </div>

                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت مشتری / همکار جدید</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-700">
                    <tr>
                      <th className="p-3">نام و مشخصات</th>
                      <th className="p-3">شماره تماس</th>
                      <th className="p-3">نوع کاربری</th>
                      <th className="p-3">تعداد سفارش</th>
                      <th className="p-3">مجموع خرید</th>
                      <th className="p-3">وضعیت حساب</th>
                      <th className="p-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {customers.map(cust => (
                      <tr key={cust.id} className="hover:bg-neutral-50/50">
                        <td className="p-3">
                          <div className="font-bold text-neutral-900">{cust.firstName} {cust.lastName}</div>
                          {cust.vehicle && <div className="text-[10px] text-neutral-400">خودرو: {cust.vehicle}</div>}
                        </td>
                        <td className="p-3 font-mono text-neutral-700">{cust.phone}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cust.type === 'wholesale' ? 'bg-purple-100 text-purple-800' :
                            cust.type === 'mechanic' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {cust.typeTitle}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">{cust.totalOrders} فاکتور</td>
                        <td className="p-3 font-bold text-neutral-900 font-mono">{formatToman(cust.totalSpent)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            cust.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {cust.status === 'active' ? 'فعال' : 'مسدود'}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => toggleCustomerStatus(cust.id)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                              cust.status === 'active' 
                                ? 'bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {cust.status === 'active' ? 'مسدودسازی' : 'فعال‌سازی'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: MULTI-ADMIN USERS & PERMISSIONS */}
          {activeTab === 'admins' && (
            <AdminUsersTab />
          )}

          {/* TAB 11: GATEWAYS */}
          {activeTab === 'gateways' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <span>تنظیمات درگاه‌های بانکی شبکه شاپرک</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  فعال‌سازی، تغییر مرچنت کد، ترمینال و سوییچ درگاه‌های پرداخت متصل به شتاب
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentGateways.map(g => (
                  <div key={g.id} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-neutral-700" />
                        <h3 className="font-bold text-sm text-neutral-900">{g.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleGatewayActive(g.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          g.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {g.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                    </div>

                    <p className="text-xs text-neutral-500">{g.description}</p>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Merchant ID: {g.merchantId} {g.terminalId ? `| Terminal: ${g.terminalId}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: PAYMENT SANDBOX SIMULATOR */}
          {activeTab === 'sandbox' && (
            <AdminSandboxGateway />
          )}

          {/* TAB 13: APIS & SMS */}
          {activeTab === 'apis' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-600" />
                  <span>سرویس‌های وب‌سرویس پیامک و نرم‌افزار حسابداری</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  پیکربندی ارسال خودکار پیامک رهگیری به مشتری و اتصال به کاردکس انبارداری
                </p>
              </div>

              <form onSubmit={handleSaveApis} className="space-y-6 text-xs">
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                  <h3 className="font-bold text-sm text-neutral-900">سرویس پیامک اعتباری و خدماتی:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">سامانه پیامکی:</label>
                      <select
                        value={apiForm.smsProvider}
                        onChange={e => setApiForm({ ...apiForm, smsProvider: e.target.value as any })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl"
                      >
                        <option value="kavenegar">کاوه‌نگار (Kavenegar)</option>
                        <option value="melipayamak">ملی‌پیامک (MeliPayamak)</option>
                        <option value="ghasedak">قاصدک (Ghasedak)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">کلید API پیامک:</label>
                      <input
                        type="password"
                        value={apiForm.smsApiKey}
                        onChange={e => setApiForm({ ...apiForm, smsApiKey: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">شماره خط اختصاصی ارسال:</label>
                      <input
                        type="text"
                        value={apiForm.smsSenderNumber}
                        onChange={e => setApiForm({ ...apiForm, smsSenderNumber: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  ذخیره تنظیمات API
                </button>
              </form>
            </div>
          )}

          {/* TAB 14: THEME, GOOGLE FONTS, LOGO & FAVICON BRANDING */}
          {activeTab === 'theme' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-red-600" />
                  <span>شخصی‌سازی کامل هویت بصری، لوگو، فیوآیکن و فونت گوگل</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  تغییر لوگو، فیوآیکن مرورگر، مشخصات فاکتور رسمی و فونت‌ها به صورت آنی در کل سایت
                </p>
              </div>

              <form onSubmit={handleSaveTheme} className="space-y-6 text-xs">
                
                {/* 1. Logo & Favicon Management */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-red-600" />
                    <span>مدیریت نشان تجاری (Logo) و آیکون مرورگر (Favicon):</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Section */}
                    <ImageUploadInput
                      label="لوگو و نشان تجاری فروشگاه (Logo):"
                      value={themeForm.logoUrl || ''}
                      onChange={url => setThemeForm({ ...themeForm, logoUrl: url })}
                      presetCategory="logos"
                      aspectRatio="auto"
                      placeholder="فایل تصویر لوگو را آپلود کنید یا آدرس آن را وارد نمایید..."
                      helperText="در هدر، فوتر، فاکتورهای رسمی و پیش‌فاکتور مشتریان نمایش داده می‌شود."
                    />

                    {/* Favicon Section */}
                    <ImageUploadInput
                      label="آیکون برگه مرورگر (Favicon):"
                      value={themeForm.faviconUrl || ''}
                      onChange={url => setThemeForm({ ...themeForm, faviconUrl: url })}
                      presetCategory="favicons"
                      aspectRatio="square"
                      placeholder="فایل آیکون (PNG / ICO / SVG) را آپلود کنید..."
                      helperText="به‌صورت آنی در برگه مرورگر، نشانک‌ها و میانبرهای گوشی اعمال می‌گردد."
                    />
                  </div>
                </div>

                {/* 2. Color Scheme Picker */}
                <div className="space-y-3 pt-2">
                  <label className="block text-neutral-800 font-bold">رنگ سازمانی و دکمه‌های اصلی (Primary Accent Color):</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { name: 'قرمز مسابقه‌ای (پیش‌فرض)', hex: '#DC2626' },
                      { name: 'مشکی کربن / تیتانیوم', hex: '#0F172A' },
                      { name: 'آبی رویال اسپرت', hex: '#2563EB' },
                      { name: 'نارنجی صنعتی GT', hex: '#EA580C' },
                      { name: 'سبز پرفورمنس', hex: '#16A34A' }
                    ].map(col => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setThemeForm({ ...themeForm, primaryColor: col.hex })}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${
                          themeForm.primaryColor === col.hex
                            ? 'border-neutral-900 ring-2 ring-neutral-900/20 font-bold'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: col.hex }}></span>
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Google Font Family Picker */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-neutral-800 font-bold">تایپوگرافی و فونت‌های استاندارد گوگل (Google Fonts CDN):</label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      فراخوانی زنده از سرورهای گوگل
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { id: 'Vazirmatn', label: 'وزیرمتن (Vazirmatn)', desc: 'فونت رسمی پیش‌فرض مدرن' },
                      { id: 'Noto Sans Arabic', label: 'نوتو سنس (Noto Sans)', desc: 'فونت رسمی و جامع گوگل' },
                      { id: 'Rubik', label: 'روبیک (Rubik)', desc: 'طراحی هندسی اسپرت و پویا' },
                      { id: 'Alexandria', label: 'الکساندریا (Alexandria)', desc: 'خوانایی بالا در متن و اعداد' },
                      { id: 'Cairo', label: 'قاهره (Cairo)', desc: 'فونت صنعتی خودرویی و ضخیم' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setThemeForm({ ...themeForm, fontFamily: f.id as any })}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          themeForm.fontFamily === f.id
                            ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-md ring-2 ring-red-500/30'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="block text-xs font-black">{f.label}</span>
                        <span className={`block text-[10px] mt-1 ${themeForm.fontFamily === f.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {f.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Seller Tax & Official Invoice Information */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="font-bold text-sm text-neutral-900">مشخصات فروشنده در فاکتور رسمی مالیاتی:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">نام شخص حقیقی/حقوقی فروشنده:</label>
                      <input
                        type="text"
                        value={themeForm.sellerName || ''}
                        onChange={e => setThemeForm({ ...themeForm, sellerName: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">کد اقتصادی:</label>
                      <input
                        type="text"
                        value={themeForm.sellerEconomicCode || ''}
                        onChange={e => setThemeForm({ ...themeForm, sellerEconomicCode: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">شناسه ملی / شماره ثبت:</label>
                      <input
                        type="text"
                        value={themeForm.sellerNationalId || ''}
                        onChange={e => setThemeForm({ ...themeForm, sellerNationalId: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. General Site Texts */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="font-bold text-sm text-neutral-900">عناوین، شعار و اطلاعات تماس:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">عنوان اصلی فروشگاه:</label>
                      <input
                        type="text"
                        value={themeForm.siteTitle}
                        onChange={e => setThemeForm({ ...themeForm, siteTitle: e.target.value })}
                        className="w-full p-3 border border-neutral-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 font-semibold mb-1">شعار برند:</label>
                      <input
                        type="text"
                        value={themeForm.siteSlogan}
                        onChange={e => setThemeForm({ ...themeForm, siteSlogan: e.target.value })}
                        className="w-full p-3 border border-neutral-300 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-600 font-semibold mb-1">آدرس فیزیکی فروشگاه و انبار مرکزی:</label>
                    <textarea
                      rows={2}
                      value={themeForm.address}
                      onChange={e => setThemeForm({ ...themeForm, address: e.target.value })}
                      className="w-full p-3 border border-neutral-300 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20"
                >
                  ذخیره تمام تنظیمات برندینگ و قالب
                </button>
              </form>
            </div>
          )}

          {/* TAB 15: BULK EDIT */}
          {activeTab === 'bulk' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-red-600" />
                    <span>ویرایش سریع و دسته‌ای قیمت‌ها و موجودی کالاها</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    تغییر آنی قیمت فروش و تعداد موجودی در انبار بدون نیاز به باز کردن فرم تک تک قطعات
                  </p>
                </div>

                <button
                  onClick={handleApplyBulkUpdates}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>اعمال تغییرات دسته‌ای ({Object.keys(bulkUpdates).length})</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-700">
                    <tr>
                      <th className="p-3">نام قطعه</th>
                      <th className="p-3">شماره فنی OEM</th>
                      <th className="p-3">قیمت فعلی</th>
                      <th className="p-3 w-40">قیمت جدید (تومان)</th>
                      <th className="p-3">موجودی فعلی</th>
                      <th className="p-3 w-32">موجودی جدید</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-bold text-neutral-900">{p.nameFa}</td>
                        <td className="p-3 font-mono text-neutral-600">{p.oemNumber}</td>
                        <td className="p-3 font-mono font-bold text-neutral-900">{formatToman(p.price)}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            defaultValue={p.price}
                            onChange={e => handleBulkPriceChange(p.id, Number(e.target.value))}
                            className="w-full p-2 border border-neutral-300 rounded-lg font-mono text-xs"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold">{p.stock}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            defaultValue={p.stock}
                            onChange={e => handleBulkStockChange(p.id, Number(e.target.value))}
                            className="w-full p-2 border border-neutral-300 rounded-lg font-mono text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 16: SEARCH ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-red-600" />
                  <span>تحلیل کلمات کلیدی و جستجوهای مشتریان</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  مشاهده قطعاتی که کاربران در سایت جستجو کرده‌اند برای نیازسنجی تامین و واردات قطعات
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right divide-y divide-neutral-200">
                  <thead className="bg-neutral-50 font-bold text-neutral-700">
                    <tr>
                      <th className="p-3">عبارت جستجو شده</th>
                      <th className="p-3">تعداد دفعات</th>
                      <th className="p-3">تعداد نتایج منطبق</th>
                      <th className="p-3">وضعیت تقاضا</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {searchLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-bold text-neutral-900">{log.query}</td>
                        <td className="p-3 font-bold font-mono">{log.count} بار</td>
                        <td className="p-3 font-mono">{log.resultsCount} محصول</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.resultsCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {log.resultsCount > 0 ? 'موجود در انبار' : 'تقاضای تامین و واردات'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================================================
          OFFICIAL INVOICE MODAL
      ========================================================================= */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          settings={settings}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* =========================================================================
          MODAL: ADD NEW PRODUCT (WITH SHORT AND FULL DESCRIPTION & RICH EDITOR)
      ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">تعریف قطعه جدید در انبار</h3>
              <button onClick={() => setIsNewProductModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">نام فارسی قطعه *:</label>
                <input
                  type="text"
                  value={newProductForm.nameFa}
                  onChange={e => setNewProductForm({ ...newProductForm, nameFa: e.target.value })}
                  placeholder="مثال: رادیاتور آب موتور KMC J7 شرکتی"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">شماره فنی بین‌المللی OEM *:</label>
                  <input
                    type="text"
                    value={newProductForm.oemNumber}
                    onChange={e => setNewProductForm({ ...newProductForm, oemNumber: e.target.value })}
                    placeholder="1026040GH010"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">برند سازنده قطعه:</label>
                  <input
                    type="text"
                    value={newProductForm.brandManufacturer}
                    onChange={e => setNewProductForm({ ...newProductForm, brandManufacturer: e.target.value })}
                    placeholder="Chery Genuine / Bosch / KMC"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">دسته‌بندی قطعه:</label>
                  <select
                    value={newProductForm.categorySlug}
                    onChange={e => setNewProductForm({ ...newProductForm, categorySlug: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.nameFa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">گرید کیفی:</label>
                  <select
                    value={newProductForm.grade}
                    onChange={e => setNewProductForm({ ...newProductForm, grade: e.target.value as any })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  >
                    <option value="genuine">اصلی شرکتی (Genuine)</option>
                    <option value="oem">وارداتی درجه یک (OEM)</option>
                    <option value="aftermarket">افترمارکت استاندارد</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">قیمت فروش (تومان):</label>
                  <input
                    type="number"
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">موجودی انبار:</label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={e => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">
                  توضیحات کوتاه محصول (خلاصه ویژگی‌ها برای نمایش سریع و متای گوگل):
                </label>
                <textarea
                  rows={2}
                  value={newProductForm.shortDescription || ''}
                  onChange={e => setNewProductForm({ ...newProductForm, shortDescription: e.target.value })}
                  placeholder="خلاصه ۱ الی ۲ خطی از مزایا، کشور سازنده و مشخصه اصلی..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Rich Long Description */}
              <div>
                <RichTextEditor
                  label="توضیحات کامل و نقد و بررسی تخصصی قطعه (ویرایشگر حرفه‌ای)"
                  value={newProductForm.description || ''}
                  onChange={val => setNewProductForm({ ...newProductForm, description: val })}
                  rows={6}
                  placeholder="توضیحات کامل فنی، جنس آلیاژ، دستورالعمل نصب و سازگاری..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ثبت قطعه در انبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT PRODUCT (WITH SHORT AND FULL DESCRIPTION & RICH EDITOR)
      ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">ویرایش قطعه: {editingProduct.nameFa}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">نام فارسی قطعه:</label>
                <input
                  type="text"
                  value={editingProduct.nameFa}
                  onChange={e => setEditingProduct({ ...editingProduct, nameFa: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">کد بین‌المللی OEM:</label>
                  <input
                    type="text"
                    value={editingProduct.oemNumber}
                    onChange={e => setEditingProduct({ ...editingProduct, oemNumber: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">کد SKU انبار:</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">قیمت فروش (تومان):</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">موجودی انبار:</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">
                  توضیحات کوتاه قطعه (نمایش در کارت محصول و معرفی سریع):
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="خلاصه ۲ خطی مشخصات..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Full Rich Description */}
              <div>
                <RichTextEditor
                  label="توضیحات کامل و نقد فنی (ویرایشگر حرفه‌ای)"
                  value={editingProduct.description || ''}
                  onChange={val => setEditingProduct({ ...editingProduct, description: val })}
                  rows={6}
                  placeholder="توضیحات جامع قطعه..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW CATEGORY
      ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">افزودن دسته‌بندی قطعات جدید</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">نام فارسی دسته‌بندی *:</label>
                <input
                  type="text"
                  value={newCatFa}
                  onChange={e => setNewCatFa(e.target.value)}
                  placeholder="مثال: سیستم اگزوز و آلایندگی"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">نام انگلیسی:</label>
                  <input
                    type="text"
                    value={newCatEn}
                    onChange={e => setNewCatEn(e.target.value)}
                    placeholder="Exhaust System"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">اسلاگ (Slug) *:</label>
                  <input
                    type="text"
                    value={newCatSlug}
                    onChange={e => setNewCatSlug(e.target.value)}
                    placeholder="exhaust"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">توضیح کوتاه فنی:</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="کاتالیزور، منیفولد دود، سنسور اکسیژن..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ذخیره دسته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW CUSTOMER
      ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">ثبت مشتری یا همکار جدید</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">نام *:</label>
                  <input
                    type="text"
                    value={custForm.firstName}
                    onChange={e => setCustForm({ ...custForm, firstName: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1 font-semibold">نام خانوادگی *:</label>
                  <input
                    type="text"
                    value={custForm.lastName}
                    onChange={e => setCustForm({ ...custForm, lastName: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">شماره موبایل *:</label>
                <input
                  type="tel"
                  value={custForm.phone}
                  onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                  placeholder="0912..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">نوع حساب کاربری:</label>
                <select
                  value={custForm.type}
                  onChange={e => setCustForm({ ...custForm, type: e.target.value as any })}
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                >
                  <option value="retail">مشتری عادی</option>
                  <option value="mechanic">تعمیرکار / همکار (تخفیف ویژه همکاری)</option>
                  <option value="wholesale">عمده‌فروش قطعات (قیمت عمده)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">خودرو یا زمینه فعالیت:</label>
                <input
                  type="text"
                  value={custForm.vehicle}
                  onChange={e => setCustForm({ ...custForm, vehicle: e.target.value })}
                  placeholder="مثال: KMC J7 یا تعمیرگاه تخصصی جک و چری"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ثبت کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
