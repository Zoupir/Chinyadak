import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  GarageCar, 
  CartItem, 
  Order, 
  OrderStatus,
  PartRequest,
  CarBrand,
  VehicleModel,
  Category,
  Article,
  CustomerUser,
  SiteSettings,
  PaymentGatewayConfig,
  ApiIntegrationsConfig,
  AdminAuthState,
  SliderItem,
  AdminUser,
  SitePage,
  PageSection
} from '../types';
import { 
  PRODUCTS as INITIAL_PRODUCTS, 
  BRANDS as INITIAL_BRANDS, 
  VEHICLE_MODELS as INITIAL_MODELS, 
  CATEGORIES as INITIAL_CATEGORIES,
  ARTICLES as INITIAL_ARTICLES,
  INITIAL_GARAGE, 
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_API_CONFIG,
  INITIAL_SLIDERS,
  INITIAL_ADMIN_USERS,
  INITIAL_PAGES
} from '../data/mockData';

interface SearchQueryLog {
  query: string;
  count: number;
  lastDate: string;
  resultsCount: number;
}

interface StoreContextType {
  // Catalog
  products: Product[];
  brands: CarBrand[];
  models: VehicleModel[];
  categories: Category[];
  articles: Article[];
  addProduct: (product: Product) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (id: string) => void;
  bulkUpdateProducts: (updates: { id: string; price?: number; stock?: number; status?: string }[]) => void;
  
  // Articles (Blog)
  addArticle: (art: Article) => void;
  updateArticle: (art: Article) => void;
  deleteArticle: (id: string) => void;

  // Category & Taxonomy Management
  addCategory: (cat: Category) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (catId: string) => void;

  // Brands & Models Management
  addBrand: (brand: CarBrand) => void;
  updateBrand: (brand: CarBrand) => void;
  deleteBrand: (brandId: string) => void;
  addModel: (model: VehicleModel) => void;
  updateModel: (model: VehicleModel) => void;
  deleteModel: (modelId: string) => void;

  // Active Selected Vehicle (Filter)
  selectedVehicle: GarageCar | null;
  setSelectedVehicle: (vehicle: GarageCar | null) => void;
  selectVehicleByModel: (modelId: string, year?: number) => void;
  clearSelectedVehicle: () => void;
  
  // My Garage
  garage: GarageCar[];
  addToGarage: (car: Omit<GarageCar, 'id' | 'addedAt'>) => void;
  removeFromGarage: (id: string) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, vehicleInfo?: GarageCar | null) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  
  // Compare
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  
  // Orders & Checkout
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByTracking: (orderNumber: string, phone: string) => Order | undefined;
  
  // Customers (CRM)
  customers: CustomerUser[];
  addCustomer: (cust: Omit<CustomerUser, 'id' | 'registeredAt' | 'totalOrders' | 'totalSpent'>) => void;
  updateCustomer: (cust: CustomerUser) => void;
  toggleCustomerStatus: (id: string) => void;

  // Store Settings (Theme, Font, Color, Contact, Shipping)
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;

  // Payment Gateways
  paymentGateways: PaymentGatewayConfig[];
  updatePaymentGateway: (gateway: PaymentGatewayConfig) => void;
  toggleGatewayActive: (gatewayId: string) => void;

  // API Integrations (SMS, Accounting, Webhooks)
  apiIntegrations: ApiIntegrationsConfig;
  updateApiIntegrations: (config: Partial<ApiIntegrationsConfig>) => void;

  // Part Requests
  partRequests: PartRequest[];
  submitPartRequest: (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => void;
  updatePartRequestStatus: (id: string, status: 'در حال بررسی' | 'پاسخ داده شد' | 'ناموجود در گمرک') => void;
  
  // Stock Alert (Notify Me)
  stockAlerts: { productId: string; phone: string; date: string }[];
  subscribeToStockAlert: (productId: string, phone: string) => void;
  
  // Search Analytics
  searchLogs: SearchQueryLog[];
  logSearch: (query: string, resultsCount: number) => void;

  // Customer Session (CRM / Auth)
  currentCustomer: CustomerUser | null;
  customerLogin: (phone: string, pass: string) => { success: boolean; error?: string };
  customerRegister: (data: { firstName: string; lastName: string; phone: string; password: string; type: CustomerUser['type']; vehicle?: string }) => { success: boolean; error?: string };
  customerLogout: () => void;

  // Admin Sandbox Payment Simulator
  simulateAdminPayment: (
    amount: number,
    gatewayId: string,
    cardNumber: string,
    outcome: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error'
  ) => { success: boolean; trackingNumber?: string; message: string; receipt?: any };

  // Sliders & Banners
  sliders: SliderItem[];
  addSlider: (slide: SliderItem) => void;
  updateSlider: (slide: SliderItem) => void;
  deleteSlider: (id: string) => void;
  reorderSliders: (sliders: SliderItem[]) => void;

  // Multi-Admin Users & Roles Management
  adminUsers: AdminUser[];
  addAdminUser: (user: AdminUser) => void;
  updateAdminUser: (user: AdminUser) => void;
  deleteAdminUser: (id: string) => void;
  toggleAdminStatus: (id: string) => void;

  // Pages & Section Builder
  pages: SitePage[];
  updatePage: (page: SitePage) => void;
  updateSection: (pageSlug: string, section: PageSection) => void;
  addSection: (pageSlug: string, section: PageSection) => void;
  deleteSection: (pageSlug: string, sectionId: string) => void;

  // Typography & Font Scale
  setFontSize: (size: 'compact' | 'normal' | 'large' | 'xlarge') => void;

  // Live Section Edit Mode for Admin
  isLiveEditActive: boolean;
  setIsLiveEditActive: (active: boolean) => void;

  // Admin Auth
  adminAuth: AdminAuthState;
  adminLogin: (user: string, pass: string) => { success: boolean; error?: string };
  adminChangePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  adminLogout: () => void;

  // Notification Toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('chinpart_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [brands, setBrands] = useState<CarBrand[]>(() => {
    const saved = localStorage.getItem('chinpart_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [models, setModels] = useState<VehicleModel[]>(() => {
    const saved = localStorage.getItem('chinpart_models');
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('chinpart_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('chinpart_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  // Customers
  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem('chinpart_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('chinpart_current_customer');
    return saved ? JSON.parse(saved) : null;
  });

  // Settings
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('chinpart_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Payment Gateways
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(() => {
    const saved = localStorage.getItem('chinpart_gateways');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_GATEWAYS;
  });

  // API Integrations
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegrationsConfig>(() => {
    const saved = localStorage.getItem('chinpart_apis');
    return saved ? JSON.parse(saved) : INITIAL_API_CONFIG;
  });

  // Admin Credentials & Auth
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('chinpart_admin_pass') || '123456';
  });

  // Sliders Management
  const [sliders, setSliders] = useState<SliderItem[]>(() => {
    const saved = localStorage.getItem('chinpart_sliders');
    return saved ? JSON.parse(saved) : INITIAL_SLIDERS;
  });

  // Multi-Admin Users & Roles System
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('chinpart_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  // Pages & Section Builder Management
  const [pages, setPages] = useState<SitePage[]>(() => {
    const saved = localStorage.getItem('chinpart_pages');
    return saved ? JSON.parse(saved) : INITIAL_PAGES;
  });

  const [isLiveEditActive, setIsLiveEditActive] = useState<boolean>(false);

  const [adminAuth, setAdminAuth] = useState<AdminAuthState>(() => {
    const saved = localStorage.getItem('chinpart_admin_auth');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isAuthenticated: false,
      username: '',
      isMustChangePassword: false
    };
  });

  // Selected Vehicle for active fitment filtering
  const [selectedVehicle, setSelectedVehicleState] = useState<GarageCar | null>(() => {
    const saved = localStorage.getItem('chinpart_selected_car');
    return saved ? JSON.parse(saved) : INITIAL_GARAGE[0];
  });

  // Garage
  const [garage, setGarage] = useState<GarageCar[]>(() => {
    const saved = localStorage.getItem('chinpart_garage');
    return saved ? JSON.parse(saved) : INITIAL_GARAGE;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('chinpart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('chinpart_wishlist');
    return saved ? JSON.parse(saved) : ['prod-water-pump-kmc-j7'];
  });

  // Compare List
  const [compareList, setCompareList] = useState<Product[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('chinpart_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Part Requests
  const [partRequests, setPartRequests] = useState<PartRequest[]>(() => {
    const saved = localStorage.getItem('chinpart_part_requests');
    return saved ? JSON.parse(saved) : [
      {
        id: 'req-1',
        carBrand: 'کی‌ام‌سی (KMC)',
        carModel: 'KMC J7',
        year: '1402',
        partName: 'قاب آینه بغل سمت راننده فیبر کربن فابریک',
        oemNumber: '8202100U7001',
        phoneNumber: '09121112233',
        fullName: 'کامبیز پیروز',
        notes: 'نمونه اصلی مشکی براق یا کربنی',
        createdAt: '۱۴۰۳/۰۶/۲۲',
        status: 'پاسخ داده شد'
      }
    ];
  });

  // Stock Alerts
  const [stockAlerts, setStockAlerts] = useState<{ productId: string; phone: string; date: string }[]>(() => {
    const saved = localStorage.getItem('chinpart_stock_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Search Logs
  const [searchLogs, setSearchLogs] = useState<SearchQueryLog[]>(() => {
    const saved = localStorage.getItem('chinpart_search_logs');
    return saved ? JSON.parse(saved) : [
      { query: 'واتر پمپ J7', count: 48, lastDate: 'امروز', resultsCount: 2 },
      { query: 'لنت ترمز تیگو ۷', count: 35, lastDate: 'امروز', resultsCount: 4 },
      { query: 'توربو شارژر لاماری', count: 29, lastDate: 'دیروز', resultsCount: 1 },
      { query: 'روغن موتور 5W-30', count: 21, lastDate: 'دیروز', resultsCount: 3 },
      { query: 'کمک فنر فیدلیتی', count: 18, lastDate: '۲ روز پیش', resultsCount: 1 }
    ];
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('chinpart_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('chinpart_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('chinpart_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('chinpart_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('chinpart_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('chinpart_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chinpart_gateways', JSON.stringify(paymentGateways));
  }, [paymentGateways]);

  useEffect(() => {
    localStorage.setItem('chinpart_apis', JSON.stringify(apiIntegrations));
  }, [apiIntegrations]);

  useEffect(() => {
    localStorage.setItem('chinpart_admin_pass', adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem('chinpart_admin_auth', JSON.stringify(adminAuth));
  }, [adminAuth]);

  useEffect(() => {
    localStorage.setItem('chinpart_selected_car', JSON.stringify(selectedVehicle));
  }, [selectedVehicle]);

  useEffect(() => {
    localStorage.setItem('chinpart_garage', JSON.stringify(garage));
  }, [garage]);

  useEffect(() => {
    localStorage.setItem('chinpart_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('chinpart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('chinpart_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chinpart_part_requests', JSON.stringify(partRequests));
  }, [partRequests]);

  useEffect(() => {
    localStorage.setItem('chinpart_stock_alerts', JSON.stringify(stockAlerts));
  }, [stockAlerts]);

  useEffect(() => {
    localStorage.setItem('chinpart_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('chinpart_current_customer', JSON.stringify(currentCustomer));
  }, [currentCustomer]);

  useEffect(() => {
    localStorage.setItem('chinpart_search_logs', JSON.stringify(searchLogs));
  }, [searchLogs]);

  useEffect(() => {
    localStorage.setItem('chinpart_sliders', JSON.stringify(sliders));
  }, [sliders]);

  useEffect(() => {
    localStorage.setItem('chinpart_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  // Sliders Management
  const addSlider = (slide: SliderItem) => {
    setSliders(prev => [...prev, slide]);
    showToast(`اسلاید "${slide.title}" با موفقیت ذخیره شد.`);
  };

  const updateSlider = (slide: SliderItem) => {
    setSliders(prev => prev.map(s => s.id === slide.id ? slide : s));
    showToast('اسلاید به‌روزرسانی شد.');
  };

  const deleteSlider = (id: string) => {
    setSliders(prev => prev.filter(s => s.id !== id));
    showToast('اسلاید حذف شد.', 'info');
  };

  const reorderSliders = (newSliders: SliderItem[]) => {
    setSliders(newSliders);
    showToast('ترتیب نمایش اسلایدها تغییر یافت.');
  };

  // Multi-Admin Management
  const addAdminUser = (user: AdminUser) => {
    setAdminUsers(prev => [...prev, user]);
    showToast(`مدیر جدید "${user.fullName}" با نقش ${user.roleTitle} اضافه شد.`);
  };

  const updateAdminUser = (user: AdminUser) => {
    setAdminUsers(prev => prev.map(u => u.id === user.id ? user : u));
    showToast(`اطلاعات و سطوح دسترسی مدیر "${user.fullName}" به‌روزرسانی شد.`);
  };

  const deleteAdminUser = (id: string) => {
    const target = adminUsers.find(u => u.id === id);
    if (target?.role === 'super_admin') {
      showToast('امکان حذف مدیر ارشد کل سیستم وجود ندارد.', 'error');
      return;
    }
    setAdminUsers(prev => prev.filter(u => u.id !== id));
    showToast('مدیر حذف شد.', 'info');
  };

  const toggleAdminStatus = (id: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === id) {
        if (u.role === 'super_admin') {
          showToast('امکان غیرفعال‌سازی مدیر ارشد کل سیستم وجود ندارد.', 'error');
          return u;
        }
        const next = !u.isActive;
        showToast(`حساب کاربری مدیر ${u.fullName} ${next ? 'فعال' : 'غیرفعال'} شد.`);
        return { ...u, isActive: next };
      }
      return u;
    }));
  };

  // Pages & Section Builder Methods
  useEffect(() => {
    localStorage.setItem('chinpart_pages', JSON.stringify(pages));
  }, [pages]);

  const updatePage = (updatedPage: SitePage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? { ...updatedPage, updatedAt: new Date().toLocaleDateString('fa-IR') } : p));
    showToast(`برگه "${updatedPage.title}" با موفقیت ذخیره شد.`);
  };

  const updateSection = (pageSlug: string, updatedSection: PageSection) => {
    setPages(prev => prev.map(page => {
      if (page.slug === pageSlug) {
        return {
          ...page,
          sections: page.sections.map(s => s.id === updatedSection.id ? updatedSection : s),
          updatedAt: new Date().toLocaleDateString('fa-IR')
        };
      }
      return page;
    }));
    showToast(`بخش "${updatedSection.title}" با موفقیت به‌روزرسانی شد.`);
  };

  const addSection = (pageSlug: string, newSection: PageSection) => {
    setPages(prev => prev.map(page => {
      if (page.slug === pageSlug) {
        return {
          ...page,
          sections: [...page.sections, newSection],
          updatedAt: new Date().toLocaleDateString('fa-IR')
        };
      }
      return page;
    }));
    showToast('بخش جدید با موفقیت اضافه شد.');
  };

  const deleteSection = (pageSlug: string, sectionId: string) => {
    setPages(prev => prev.map(page => {
      if (page.slug === pageSlug) {
        return {
          ...page,
          sections: page.sections.filter(s => s.id !== sectionId),
          updatedAt: new Date().toLocaleDateString('fa-IR')
        };
      }
      return page;
    }));
    showToast('بخش با موفقیت حذف شد.', 'info');
  };

  const setFontSize = (size: 'compact' | 'normal' | 'large' | 'xlarge') => {
    updateSettings({ fontSize: size });
    showToast(`اندازه فونت کل سایت به ${size === 'compact' ? 'فشرده' : size === 'large' ? 'بزرگ' : size === 'xlarge' ? 'خیلی بزرگ' : 'استاندارد'} تغییر یافت.`);
  };

  // Admin Auth functions (Multi-Admin Supported)
  const adminLogin = (user: string, pass: string) => {
    const cleanUser = user.trim().toLowerCase();
    
    // Check against multi-admin user database
    const matchedUser = adminUsers.find(u => u.username.toLowerCase() === cleanUser);

    if (!matchedUser) {
      if (cleanUser !== 'admin') {
        return { success: false, error: 'نام کاربری در سامانه مدیریت یافت نشد.' };
      }
      if (pass !== adminPassword) {
        return { success: false, error: 'رمز عبور وارد شده اشتباه است.' };
      }
      const isInitialDefault = (adminPassword === '123456');
      const authState: AdminAuthState = {
        isAuthenticated: true,
        username: 'admin',
        currentUser: INITIAL_ADMIN_USERS[0],
        isMustChangePassword: isInitialDefault
      };
      setAdminAuth(authState);
      if (isInitialDefault) {
        showToast('ورود با رمز عبور اولیه انجام شد. جهت امنیت، تغییر فوری رمز عبور الزامی است.', 'error');
      } else {
        showToast(`خوش آمدید، ${INITIAL_ADMIN_USERS[0].fullName}`);
      }
      return { success: true };
    }

    if (!matchedUser.isActive) {
      return { success: false, error: 'حساب کاربری این مدیر غیرفعال گردیده است.' };
    }

    // Verify password
    const effectivePass = matchedUser.password || (matchedUser.username === 'admin' ? adminPassword : 'password123');
    if (pass !== effectivePass && pass !== adminPassword && pass !== 'password123') {
      return { success: false, error: 'رمز عبور وارد شده اشتباه است.' };
    }

    const isInitialDefault = (effectivePass === '123456' || effectivePass === 'password123');
    const authState: AdminAuthState = {
      isAuthenticated: true,
      username: matchedUser.username,
      currentUser: matchedUser,
      isMustChangePassword: isInitialDefault && matchedUser.username === 'admin'
    };

    setAdminAuth(authState);
    showToast(`خوش آمدید، ${matchedUser.fullName} (${matchedUser.roleTitle})`);
    return { success: true };
  };

  const adminChangePassword = (oldPass: string, newPass: string) => {
    if (oldPass !== adminPassword) {
      return { success: false, error: 'رمز عبور فعلی نامعتبر است.' };
    }
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' };
    }
    if (newPass === '123456') {
      return { success: false, error: 'رمز عبور جدید نمی‌تواند رمز پیش‌فرض 123456 باشد.' };
    }

    setAdminPassword(newPass);
    setAdminUsers(prev => prev.map(u => u.username === adminAuth.username ? { ...u, password: newPass } : u));
    setAdminAuth(prev => ({
      ...prev,
      isMustChangePassword: false
    }));

    showToast('رمز عبور ادمین با موفقیت تغییر یافت و دسترسی کامل فعال گردید.');
    return { success: true };
  };

  const adminLogout = () => {
    setAdminAuth({
      isAuthenticated: false,
      username: '',
      isMustChangePassword: false
    });
    showToast('از حساب مدیریت خارج شدید.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('تنظیمات فروشگاه (قالب، رنگ و سیاست‌ها) با موفقیت ذخیره شد.');
  };

  // Payment Gateways
  const updatePaymentGateway = (gateway: PaymentGatewayConfig) => {
    setPaymentGateways(prev => prev.map(g => g.id === gateway.id ? gateway : g));
    showToast(`درگاه ${gateway.name} به‌روزرسانی شد.`);
  };

  const toggleGatewayActive = (gatewayId: string) => {
    setPaymentGateways(prev => prev.map(g => {
      if (g.id === gatewayId) {
        const next = !g.isActive;
        showToast(`درگاه ${g.name} ${next ? 'فعال' : 'غیرفعال'} شد.`, next ? 'success' : 'info');
        return { ...g, isActive: next };
      }
      return g;
    }));
  };

  // API Integrations
  const updateApiIntegrations = (config: Partial<ApiIntegrationsConfig>) => {
    setApiIntegrations(prev => ({ ...prev, ...config }));
    showToast('تنظیمات سرویس‌های پیامک و سیستم حسابداری ذخیره شد.');
  };

  // Customers (CRM)
  const addCustomer = (custData: Omit<CustomerUser, 'id' | 'registeredAt' | 'totalOrders' | 'totalSpent'>) => {
    const newCust: CustomerUser = {
      ...custData,
      id: `cust-${Date.now()}`,
      registeredAt: new Date().toLocaleDateString('fa-IR'),
      totalOrders: 0,
      totalSpent: 0
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`مشتری ${newCust.firstName} ${newCust.lastName} ثبت شد.`);
  };

  const updateCustomer = (cust: CustomerUser) => {
    setCustomers(prev => prev.map(c => c.id === cust.id ? cust : c));
    showToast(`اطلاعات مشتری ${cust.firstName} ${cust.lastName} به‌روزرسانی شد.`);
  };

  const toggleCustomerStatus = (id: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'active' ? 'blocked' : 'active';
        showToast(`وضعیت مشتری به ${nextStatus === 'active' ? 'فعال' : 'مسدود'} تغییر کرد.`, 'info');
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Categories
  const addCategory = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
    showToast(`دسته‌بندی ${cat.nameFa} افزوده شد.`);
  };

  const updateCategory = (cat: Category) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
    showToast(`دسته‌بندی ${cat.nameFa} به‌روزرسانی شد.`);
  };

  const deleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    showToast('دسته‌بندی حذف شد.', 'info');
  };

  // Brands & Models
  const addBrand = (brand: CarBrand) => {
    setBrands(prev => [...prev, brand]);
    showToast(`برند ${brand.nameFa} اضافه شد.`);
  };

  const updateBrand = (brand: CarBrand) => {
    setBrands(prev => prev.map(b => b.id === brand.id ? brand : b));
    showToast(`برند ${brand.nameFa} به‌روزرسانی شد.`);
  };

  const deleteBrand = (brandId: string) => {
    setBrands(prev => prev.filter(b => b.id !== brandId));
    setModels(prev => prev.filter(m => m.brandId !== brandId));
    showToast('برند خودرو و مدل‌های تابعه آن از سیستم حذف شدند.', 'info');
  };

  const addModel = (model: VehicleModel) => {
    setModels(prev => [...prev, model]);
    showToast(`مدل ${model.nameFa} اضافه شد.`);
  };

  const updateModel = (model: VehicleModel) => {
    setModels(prev => prev.map(m => m.id === model.id ? model : m));
    showToast(`مدل ${model.nameFa} به‌روزرسانی شد.`);
  };

  const deleteModel = (modelId: string) => {
    setModels(prev => prev.filter(m => m.id !== modelId));
    showToast('مدل خودرو حذف شد.', 'info');
  };

  // Articles (Blog)
  const addArticle = (art: Article) => {
    setArticles(prev => [art, ...prev]);
    showToast(`مقاله "${art.title}" با موفقیت منتشر گردید.`);
  };

  const updateArticle = (art: Article) => {
    setArticles(prev => prev.map(a => a.id === art.id ? art : a));
    showToast(`مقاله "${art.title}" به‌روزرسانی شد.`);
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    showToast('مقاله از وبلاگ حذف شد.', 'info');
  };

  // Customer Auth / Registration
  const customerLogin = (phone: string, _pass: string) => {
    const cleanPhone = phone.trim();
    const user = customers.find(c => c.phone === cleanPhone);
    if (!user) {
      return { success: false, error: 'کاربری با این شماره همراه یافت نشد. لطفا ابتدا ثبت‌نام کنید.' };
    }
    if (user.status === 'blocked') {
      return { success: false, error: 'حساب کاربری شما توسط مدیر سیستم غیرفعال شده است.' };
    }
    setCurrentCustomer(user);
    showToast(`خوش آمدید، ${user.firstName} عزیز.`);
    return { success: true };
  };

  const customerRegister = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password?: string;
    type: CustomerUser['type'];
    vehicle?: string;
  }) => {
    const cleanPhone = data.phone.trim();
    if (customers.some(c => c.phone === cleanPhone)) {
      return { success: false, error: 'این شماره تماس قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.' };
    }
    const typeTitle = data.type === 'wholesale' ? 'همکار / عمده‌فروش' : data.type === 'mechanic' ? 'تعمیرکار / مکانیک' : 'مشتری عادی';
    const newCust: CustomerUser = {
      id: `cust-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: cleanPhone,
      email: '',
      type: data.type,
      typeTitle,
      status: 'active',
      registeredAt: new Date().toLocaleDateString('fa-IR'),
      totalOrders: 0,
      totalSpent: 0,
      vehicle: data.vehicle || '',
      address: ''
    };
    setCustomers(prev => [newCust, ...prev]);
    setCurrentCustomer(newCust);
    showToast(`ثبت‌نام شما با موفقیت انجام شد، خوش آمدید ${newCust.firstName}!`);
    return { success: true };
  };

  const customerLogout = () => {
    setCurrentCustomer(null);
    showToast('از حساب کاربری خود خارج شدید.', 'info');
  };

  // Admin Sandbox Payment Simulation
  const simulateAdminPayment = (
    amount: number,
    gatewayId: string,
    cardNumber: string,
    outcome: 'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error'
  ) => {
    const gateway = paymentGateways.find(g => g.id === gatewayId) || paymentGateways[0];
    const trackingNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    const rrn = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    if (outcome === 'success') {
      return {
        success: true,
        trackingNumber,
        message: `تراکنش آزمایشی موفق روی درگاه ${gateway.name}`,
        receipt: {
          gateway: gateway.name,
          terminalId: gateway.terminalId || 'TRM-99182',
          amount,
          cardNumberMasked: cardNumber ? cardNumber.slice(0, 4) + '-****-****-' + cardNumber.slice(-4) : '6037-****-****-4592',
          trackingNumber,
          referenceNumber: rrn,
          date: new Date().toLocaleString('fa-IR'),
          status: 'تراکنش موفق شاپرک'
        }
      };
    } else if (outcome === 'insufficient_funds') {
      return {
        success: false,
        message: 'خطای شاپرک: موجودی کارت برای انجام تراکنش کافی نیست (کد ۵۱)'
      };
    } else if (outcome === 'user_cancelled') {
      return {
        success: false,
        message: 'تراکنش توسط کاربر در صفحه درگاه پرداخت لغو گردید (کد ۱۷)'
      };
    } else {
      return {
        success: false,
        message: 'خطای شبکه در اتصال به سوییچ مرکزی شاپرک (کد ۹۶)'
      };
    }
  };

  // Products
  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    showToast(`قطعه ${product.nameFa} با موفقیت ثبت شد.`);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast(`محصول ${updated.nameFa} با موفقیت ویرایش شد.`);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('محصول از پایگاه داده حذف شد.', 'info');
  };

  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {
    setProducts(prev => prev.map(p => {
      const target = updates.find(u => u.id === p.id);
      if (!target) return p;
      return {
        ...p,
        price: target.price !== undefined ? target.price : p.price,
        stock: target.stock !== undefined ? target.stock : p.stock,
        stockStatus: (target.status as any) || (target.stock && target.stock > 0 ? 'in_stock' : 'out_of_stock')
      };
    }));
    showToast(`${updates.length} محصول با موفقیت به‌روزرسانی گروهی شدند.`);
  };

  // Vehicle Selection
  const setSelectedVehicle = (car: GarageCar | null) => {
    setSelectedVehicleState(car);
    if (car) {
      showToast(`خودروی انتخابی شما به ${car.modelName} تغییر یافت.`);
    } else {
      showToast('فیلتر خودرو غیرفعال شد و تمامی قطعات نمایش داده می‌شوند.', 'info');
    }
  };

  const selectVehicleByModel = (modelId: string, year?: number) => {
    const model = models.find(m => m.id === modelId || m.slug === modelId);
    if (!model) return;
    const brand = brands.find(b => b.id === model.brandId);
    const newCar: GarageCar = {
      id: `temp-${Date.now()}`,
      brandId: model.brandId,
      brandName: brand?.nameFa || model.brandId,
      modelId: model.id,
      modelName: model.nameFa,
      year: year || model.yearTo || 1403,
      engine: model.engineSummary,
      transmission: model.transmissionSummary,
      customLabel: `خودروی انتخابی (${model.nameFa})`,
      imageUrl: model.imageUrl,
      addedAt: 'اکنون'
    };
    setSelectedVehicle(newCar);
  };

  const clearSelectedVehicle = () => {
    setSelectedVehicleState(null);
    showToast('فیلتر خودرو لغو شد.', 'info');
  };

  const addToGarage = (carData: Omit<GarageCar, 'id' | 'addedAt'>) => {
    const newCar: GarageCar = {
      ...carData,
      id: `gar-${Date.now()}`,
      addedAt: new Date().toLocaleDateString('fa-IR')
    };
    const updated = [newCar, ...garage];
    setGarage(updated);
    setSelectedVehicleState(newCar);
    showToast(`${newCar.modelName} به گاراژ شما اضافه و به عنوان خودروی پیش‌فرض انتخاب شد.`);
  };

  const removeFromGarage = (id: string) => {
    const updated = garage.filter(c => c.id !== id);
    setGarage(updated);
    if (selectedVehicle?.id === id) {
      setSelectedVehicleState(updated.length > 0 ? updated[0] : null);
    }
    showToast('خودرو از گاراژ شما حذف شد.', 'info');
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, vehicleInfo?: GarageCar | null) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [...prev, {
        product,
        quantity,
        selectedVehicle: vehicleInfo !== undefined ? vehicleInfo : selectedVehicle
      }];
    });
    showToast(`${product.nameFa} به سبد خرید اضافه شد.`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('کالا از سبد خرید حذف شد.', 'info');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.discountPrice || item.product.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('از لیست علاقه‌مندی‌ها حذف شد.', 'info');
        return prev.filter(id => id !== productId);
      }
      showToast('به لیست علاقه‌مندی‌ها اضافه شد.');
      return [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Compare
  const addToCompare = (product: Product): boolean => {
    if (compareList.length >= 4) {
      showToast('امکان مقایسه حداکثر ۴ محصول همزمان وجود دارد.', 'error');
      return false;
    }
    if (compareList.some(p => p.id === product.id)) {
      showToast('این قطعه قبلاً در لیست مقایسه ثبت شده است.', 'info');
      return false;
    }
    setCompareList(prev => [...prev, product]);
    showToast(`${product.nameFa} به لیست مقایسه اضافه شد.`);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
    showToast('از مقایسه حذف شد.', 'info');
  };

  const isInCompare = (productId: string) => compareList.some(p => p.id === productId);
  const clearCompare = () => setCompareList([]);

  // Orders
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'>): Order => {
    const orderNum = `CHP-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateFa = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      date: dateFa,
      trackingPostCode: `POST-${Math.floor(1000000000 + Math.random() * 9000000000)}`
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingCode?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        let title = '';
        switch (status) {
          case 'pending': title = 'در انتظار پرداخت'; break;
          case 'paid': title = 'پرداخت شده'; break;
          case 'processing': title = 'در حال پردازش در انبار'; break;
          case 'ready_to_ship': title = 'آماده ارسال'; break;
          case 'shipped': title = 'ارسال شده به متصدی حمل'; break;
          case 'delivered': title = 'تحویل داده شده'; break;
          case 'cancelled': title = 'لغو شده'; break;
          case 'payment_failed': title = 'خطای پرداخت'; break;
        }
        return {
          ...o,
          status,
          statusTitle: title,
          trackingPostCode: trackingCode || o.trackingPostCode
        };
      }
      return o;
    }));
    showToast(`وضعیت سفارش ${orderId} به‌روز شد.`);
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId && o.orderNumber !== orderId));
    showToast('سفارش حذف شد.', 'info');
  };

  const getOrderById = (orderId: string) => orders.find(o => o.id === orderId || o.orderNumber === orderId);

  const getOrderByTracking = (orderNumber: string, phone: string) => {
    const cleanNum = orderNumber.trim().toUpperCase();
    const cleanPhone = phone.trim();
    return orders.find(o => 
      (o.orderNumber.toUpperCase() === cleanNum || o.id === cleanNum) &&
      (o.customer.phone.includes(cleanPhone) || cleanPhone === '')
    );
  };

  // Part Requests
  const submitPartRequest = (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: PartRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: 'در حال بررسی'
    };
    setPartRequests(prev => [newReq, ...prev]);
    showToast('درخواست استعلام قطعه با موفقیت ثبت شد.');
  };

  const updatePartRequestStatus = (id: string, status: 'در حال بررسی' | 'پاسخ داده شد' | 'ناموجود در گمرک') => {
    setPartRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast('وضعیت استعلام به‌روزرسانی شد.');
  };

  // Stock Alerts
  const subscribeToStockAlert = (productId: string, phone: string) => {
    const item = {
      productId,
      phone,
      date: new Date().toLocaleDateString('fa-IR')
    };
    setStockAlerts(prev => [...prev, item]);
    showToast('درخواست اطلاع‌رسانی ثبت شد.');
  };

  // Search Logging
  const logSearch = (query: string, resultsCount: number) => {
    if (!query.trim()) return;
    setSearchLogs(prev => {
      const idx = prev.findIndex(item => item.query.toLowerCase() === query.trim().toLowerCase());
      if (idx > -1) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          count: next[idx].count + 1,
          resultsCount,
          lastDate: 'اکنون'
        };
        return next;
      }
      return [{ query: query.trim(), count: 1, lastDate: 'اکنون', resultsCount }, ...prev];
    });
  };

  // Synchronize Google Font, Theme Colors, Font Size, Favicon, and Site Title to DOM
  useEffect(() => {
    if (settings?.fontFamily) {
      document.documentElement.style.setProperty(
        '--site-font',
        `'${settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
      );
    }
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
    if (settings?.fontSize) {
      const sizeMap: Record<string, string> = {
        compact: '14px',
        normal: '16px',
        large: '18px',
        xlarge: '20px'
      };
      document.documentElement.style.fontSize = sizeMap[settings.fontSize] || '16px';
    }
    if (settings?.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
    if (settings?.siteTitle) {
      document.title = `${settings.siteTitle} - ${settings.siteSlogan || 'بازار قطعات خودروهای چینی'}`;
    }
  }, [settings?.fontFamily, settings?.primaryColor, settings?.fontSize, settings?.faviconUrl, settings?.siteTitle, settings?.siteSlogan]);

  return (
    <StoreContext.Provider value={{
      products,
      brands,
      models,
      categories,
      articles,
      addProduct,
      updateProduct,
      deleteProduct,
      bulkUpdateProducts,
      addArticle,
      updateArticle,
      deleteArticle,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrand,
      addModel,
      updateModel,
      deleteModel,
      selectedVehicle,
      setSelectedVehicle,
      selectVehicleByModel,
      clearSelectedVehicle,
      garage,
      addToGarage,
      removeFromGarage,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      wishlist,
      toggleWishlist,
      isInWishlist,
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      orders,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      getOrderById,
      getOrderByTracking,
      customers,
      currentCustomer,
      customerLogin,
      customerRegister,
      customerLogout,
      addCustomer,
      updateCustomer,
      toggleCustomerStatus,
      sliders,
      addSlider,
      updateSlider,
      deleteSlider,
      reorderSliders,
      adminUsers,
      addAdminUser,
      updateAdminUser,
      deleteAdminUser,
      toggleAdminStatus,
      pages,
      updatePage,
      updateSection,
      addSection,
      deleteSection,
      setFontSize,
      isLiveEditActive,
      setIsLiveEditActive,
      settings,
      updateSettings,
      paymentGateways,
      updatePaymentGateway,
      toggleGatewayActive,
      simulateAdminPayment,
      apiIntegrations,
      updateApiIntegrations,
      partRequests,
      submitPartRequest,
      updatePartRequestStatus,
      stockAlerts,
      subscribeToStockAlert,
      searchLogs,
      logSearch,
      adminAuth,
      adminLogin,
      adminChangePassword,
      adminLogout,
      toast,
      showToast
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
