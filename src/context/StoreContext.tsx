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
  ArticleCategory,
  CustomerUser,
  SiteSettings,
  PaymentGatewayConfig,
  ApiIntegrationsConfig,
  AdminAuthState,
  SliderItem,
  AdminUser,
  SitePage,
  PageSection,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltySettings
} from '../types';
import { 
  PRODUCTS as INITIAL_PRODUCTS, 
  BRANDS as INITIAL_BRANDS, 
  VEHICLE_MODELS as INITIAL_MODELS, 
  CATEGORIES as INITIAL_CATEGORIES,
  ARTICLES as INITIAL_ARTICLES,
  INITIAL_ARTICLE_CATEGORIES,
  INITIAL_GARAGE, 
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_LOYALTY_TRANSACTIONS,
  INITIAL_SETTINGS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_API_CONFIG,
  INITIAL_SLIDERS,
  INITIAL_ADMIN_USERS,
  INITIAL_PAGES
} from '../data/mockData';
import { apiRequest, ApiError } from '../api/client';

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
  addProduct: (product: Product) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (id: string) => void;
  bulkUpdateProducts: (updates: { id: string; price?: number; stock?: number; status?: string }[]) => void;
  
  // Articles (Blog)
  articles: Article[];
  articleCategories: ArticleCategory[];
  addArticle: (art: Article) => void;
  updateArticle: (art: Article) => void;
  deleteArticle: (id: string) => void;
  addArticleCategory: (cat: ArticleCategory) => void;
  updateArticleCategory: (cat: ArticleCategory) => void;
  deleteArticleCategory: (id: string) => void;

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
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'> & { loyaltyPointsToRedeem?: number }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByTracking: (orderNumber: string, phone: string) => Promise<Order | undefined>;
  
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
  customerLogin: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  customerRegister: (data: { firstName: string; lastName: string; phone: string; password: string; type: CustomerUser['type']; vehicle?: string }) => Promise<{ success: boolean; error?: string }>;
  customerLogout: () => Promise<void>;

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
  deletePage: (pageId: string) => void;
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
  adminLogin: (user: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminChangePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;

  // Loyalty Points & Rewards Club
  loyaltyTransactions: LoyaltyTransaction[];
  getCustomerPoints: (customerId?: string) => number;
  getCustomerTransactions: (customerId?: string) => LoyaltyTransaction[];
  addLoyaltyPoints: (
    customerId: string,
    points: number,
    description: string,
    orderNumber?: string,
    type?: LoyaltyTransaction['type']
  ) => void;
  redeemLoyaltyPoints: (
    customerId: string,
    points: number,
    orderNumber?: string
  ) => boolean;
  calculatePointsEarned: (amount: number, customerId?: string) => number;
  calculatePointsValue: (points: number) => number;
  getTierInfo: (points: number) => {
    tier: LoyaltyTier;
    title: string;
    badgeClass: string;
    discountMultiplier: number;
    minPoints: number;
    perks: string[];
    nextTier?: { title: string; pointsNeeded: number; percent: number };
  };

  // Notification Toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>([]);

  const [brands, setBrands] = useState<CarBrand[]>(() => {
    const saved = localStorage.getItem('chinpart_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [models, setModels] = useState<VehicleModel[]>(() => {
    const saved = localStorage.getItem('chinpart_models');
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });

  const [categories, setCategories] = useState<Category[]>([]);

  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('chinpart_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  const [articleCategories, setArticleCategories] = useState<ArticleCategory[]>(() => {
    const saved = localStorage.getItem('chinpart_article_categories');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLE_CATEGORIES;
  });

  // Customers
  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem('chinpart_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(null);

  // Loyalty Transactions
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem('chinpart_loyalty_transactions');
    return saved ? JSON.parse(saved) : INITIAL_LOYALTY_TRANSACTIONS;
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

  // Integration secrets must never be persisted in localStorage.
  // This remains an in-memory configuration until the server-side settings API is connected.
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegrationsConfig>(INITIAL_API_CONFIG);

  // Admin authentication is server-side. No password is stored in the browser.
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

  const [adminAuth, setAdminAuth] = useState<AdminAuthState>({
    isAuthenticated: false,
    username: '',
    isMustChangePassword: false
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
  const [orders, setOrders] = useState<Order[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiRequest<{ products: Product[] }>('/api/catalog/products'),
      apiRequest<{ categories: Category[] }>('/api/catalog/categories')
    ])
      .then(([productData, categoryData]) => {
        if (cancelled) return;
        setProducts(productData.products);
        setCategories(categoryData.categories);
      })
      .catch(error => {
        console.error('Catalog load failed:', error);
        if (import.meta.env.DEV) {
          setProducts(INITIAL_PRODUCTS);
          setCategories(INITIAL_CATEGORIES);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore the HttpOnly server session without exposing credentials to JavaScript.
  useEffect(() => {
    let cancelled = false;

    apiRequest<{ role: 'customer' | 'admin'; customer?: CustomerUser; admin?: AdminUser }>('/api/auth/me')
      .then(data => {
        if (cancelled) return;
        if (data.role === 'customer' && data.customer) {
          setCurrentCustomer(data.customer);
          setCustomers(prev => {
            const exists = prev.some(item => item.id === data.customer!.id);
            return exists ? prev.map(item => item.id === data.customer!.id ? data.customer! : item) : [data.customer!, ...prev];
          });
          void apiRequest<{ orders: Order[] }>('/api/orders/mine')
            .then(result => !cancelled && setOrders(result.orders))
            .catch(error => console.error('Customer orders load failed:', error));
        } else if (data.role === 'admin' && data.admin) {
          setAdminAuth({
            isAuthenticated: true,
            username: data.admin.username,
            currentUser: data.admin,
            isMustChangePassword: false
          });
          void apiRequest<{ orders: Order[] }>('/api/orders')
            .then(result => !cancelled && setOrders(result.orders))
            .catch(error => console.error('Admin orders load failed:', error));
        }
      })
      .catch(error => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Session restore failed:', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('chinpart_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('chinpart_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('chinpart_customers', JSON.stringify(customers));
  }, [customers]);


  useEffect(() => {
    localStorage.setItem('chinpart_loyalty_transactions', JSON.stringify(loyaltyTransactions));
  }, [loyaltyTransactions]);

  useEffect(() => {
    localStorage.setItem('chinpart_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chinpart_gateways', JSON.stringify(paymentGateways));
  }, [paymentGateways]);




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
    localStorage.setItem('chinpart_part_requests', JSON.stringify(partRequests));
  }, [partRequests]);

  useEffect(() => {
    localStorage.setItem('chinpart_stock_alerts', JSON.stringify(stockAlerts));
  }, [stockAlerts]);

  useEffect(() => {
    localStorage.setItem('chinpart_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('chinpart_article_categories', JSON.stringify(articleCategories));
  }, [articleCategories]);


  useEffect(() => {
    localStorage.setItem('chinpart_search_logs', JSON.stringify(searchLogs));
  }, [searchLogs]);

  useEffect(() => {
    localStorage.setItem('chinpart_sliders', JSON.stringify(sliders));
  }, [sliders]);

  useEffect(() => {
    localStorage.setItem('chinpart_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  // Dynamic Theme Styling Application (Colors, Glow, Typography, Border Radius, Font Scale)
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.primaryColor || '#DC2626';
    root.style.setProperty('--primary-color', hex);

    // Calculate hover color (slightly darker)
    const adjustBrightness = (h: string, delta: number) => {
      let num = parseInt(h.replace('#', ''), 16);
      if (isNaN(num)) return h;
      let r = Math.min(255, Math.max(0, (num >> 16) + delta));
      let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + delta));
      let b = Math.min(255, Math.max(0, (num & 0x0000ff) + delta));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const toRgba = (h: string, alpha: number) => {
      let c = h.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (isNaN(num)) return `rgba(220, 38, 38, ${alpha})`;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const primaryHover = settings.primaryHover || adjustBrightness(hex, -25);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-light', toRgba(hex, 0.08));
    root.style.setProperty('--primary-border', toRgba(hex, 0.25));
    root.style.setProperty('--primary-dark', adjustBrightness(hex, -45));

    // Accent Glow (Red/Custom Highlight under buttons and hover states)
    const accentGlow = settings.accentGlowColor || hex;
    root.style.setProperty('--accent-glow', accentGlow);
    root.style.setProperty('--accent-glow-subtle', toRgba(accentGlow, 0.2));
    root.style.setProperty('--accent-glow-strong', toRgba(accentGlow, 0.5));

    // Dynamic Site & Card Background Themes
    const themeMode = settings.themeMode || 'dark';
    let siteBg = settings.siteBgColor;
    let cardBg = settings.cardBgColor;
    let headerBg = settings.headerBgColor;
    let footerBg = settings.footerBgColor;
    let textColor = settings.textColor;

    if (!siteBg) {
      if (themeMode === 'light') siteBg = '#f8fafc';
      else if (themeMode === 'slate') siteBg = '#0f172a';
      else if (themeMode === 'navy') siteBg = '#020617';
      else siteBg = '#0a0a0a';
    }
    if (!cardBg) {
      if (themeMode === 'light') cardBg = '#ffffff';
      else if (themeMode === 'slate') cardBg = '#1e293b';
      else if (themeMode === 'navy') cardBg = '#0f172a';
      else cardBg = '#171717';
    }
    if (!headerBg) headerBg = themeMode === 'light' ? '#ffffff' : siteBg;
    if (!footerBg) footerBg = themeMode === 'light' ? '#0f172a' : siteBg;
    if (!textColor) textColor = themeMode === 'light' ? '#0f172a' : '#f8fafc';

    root.style.setProperty('--site-bg', siteBg);
    root.style.setProperty('--card-bg', cardBg);
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--footer-bg', footerBg);
    root.style.setProperty('--text-color', textColor);

    // Typography
    const font = settings.fontFamily || 'Vazirmatn';
    root.style.setProperty('--site-font', `'${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);

    // Font Scale
    const sizeScale: Record<string, string> = {
      compact: '14px',
      normal: '16px',
      large: '17.5px',
      xlarge: '19px'
    };
    root.style.fontSize = sizeScale[settings.fontSize || 'normal'] || '16px';

    // Border Radius
    const radiusMap: Record<string, string> = {
      sharp: '0px',
      normal: '12px',
      rounded: '20px',
      full: '9999px'
    };
    const radiusVal = settings.themeRadiusPx ? `${settings.themeRadiusPx}px` : (radiusMap[settings.borderRadius || 'normal'] || '12px');
    root.style.setProperty('--theme-radius', radiusVal);

    // Global SEO Synchronization
    const effectiveTitle = settings.metaTitle || settings.siteTitle || 'چین‌پارت | قطعات یدکی خودروهای چینی';
    document.title = effectiveTitle;

    const updateOrCreateMeta = (nameAttr: string, nameValue: string, content: string) => {
      let el = document.querySelector(`meta[${nameAttr}="${nameValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameAttr, nameValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (settings.metaDescription || settings.siteSlogan) {
      updateOrCreateMeta('name', 'description', settings.metaDescription || settings.siteSlogan || '');
    }
    if (settings.metaKeywords) {
      updateOrCreateMeta('name', 'keywords', settings.metaKeywords);
    }
    if (settings.ogTitle || effectiveTitle) {
      updateOrCreateMeta('property', 'og:title', settings.ogTitle || effectiveTitle);
    }
    if (settings.ogDescription || settings.metaDescription) {
      updateOrCreateMeta('property', 'og:description', settings.ogDescription || settings.metaDescription || '');
    }
    if (settings.ogImageUrl || settings.logoUrl) {
      updateOrCreateMeta('property', 'og:image', settings.ogImageUrl || settings.logoUrl || '');
    }
  }, [
    settings.primaryColor, 
    settings.primaryHover, 
    settings.accentGlowColor, 
    settings.themeMode, 
    settings.siteBgColor, 
    settings.cardBgColor, 
    settings.headerBgColor, 
    settings.footerBgColor, 
    settings.textColor, 
    settings.fontFamily, 
    settings.fontSize, 
    settings.borderRadius, 
    settings.themeRadiusPx,
    settings.metaTitle,
    settings.metaDescription,
    settings.metaKeywords,
    settings.ogTitle,
    settings.ogDescription,
    settings.ogImageUrl,
    settings.siteTitle,
    settings.siteSlogan
  ]);

  // Article Categories Handlers
  const addArticleCategory = (cat: ArticleCategory) => {
    setArticleCategories(prev => [...prev, cat]);
    showToast(`دسته‌بندی "${cat.name}" ایجاد شد.`);
  };

  const updateArticleCategory = (cat: ArticleCategory) => {
    setArticleCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
    showToast('دسته‌بندی مقاله به‌روزرسانی شد.');
  };

  const deleteArticleCategory = (id: string) => {
    setArticleCategories(prev => prev.filter(c => c.id !== id));
    showToast('دسته‌بندی مقاله حذف شد.', 'info');
  };

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
    setPages(prev => {
      const exists = prev.some(p => p.id === updatedPage.id);
      if (exists) {
        return prev.map(p => p.id === updatedPage.id ? { ...updatedPage, updatedAt: new Date().toLocaleDateString('fa-IR') } : p);
      }
      return [...prev, { ...updatedPage, updatedAt: new Date().toLocaleDateString('fa-IR') }];
    });
    showToast(`برگه "${updatedPage.title}" با موفقیت ذخیره شد.`);
  };

  const deletePage = (pageId: string) => {
    const target = pages.find(p => p.id === pageId);
    if (!target) return;
    if (target.isSystem) {
      showToast('برگه‌های اصلی سیستمی غیرقابل حذف هستند.', 'error');
      return;
    }
    setPages(prev => prev.filter(p => p.id !== pageId));
    showToast(`برگه "${target.title}" با موفقیت حذف شد.`, 'info');
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

  // Admin authentication is handled by the server and an HttpOnly session cookie.
  const adminLogin = async (user: string, pass: string) => {
    try {
      const data = await apiRequest<{ admin: AdminUser }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass })
      });
      setAdminAuth({
        isAuthenticated: true,
        username: data.admin.username,
        currentUser: data.admin,
        isMustChangePassword: false
      });
      showToast(`خوش آمدید، ${data.admin.fullName}`);
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'ACCOUNT_BLOCKED'
          ? 'حساب کاربری این مدیر غیرفعال است.'
          : code === 'TOO_MANY_LOGIN_ATTEMPTS'
            ? 'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
            : 'نام کاربری یا رمز عبور نادرست است.';
      return { success: false, error: message };
    }
  };

  const adminChangePassword = async (oldPass: string, newPass: string) => {
    if (newPass.trim().length < 10) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۱۰ کاراکتر باشد.' };
    }
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass })
      });
      showToast('رمز عبور مدیر با موفقیت و به‌صورت امن روی سرور تغییر کرد.');
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      return {
        success: false,
        error: code === 'INVALID_CURRENT_PASSWORD'
          ? 'رمز عبور فعلی نادرست است.'
          : 'تغییر رمز عبور انجام نشد.'
      };
    }
  };

  const adminLogout = async () => {
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear the local view even if the network request fails.
    }
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
    void apiRequest<{ category: Category }>('/api/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    }).then(({ category }) => {
      setCategories(prev => [...prev, category]);
      showToast(`دسته‌بندی ${category.nameFa} افزوده شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت دسته‌بندی در سرور انجام نشد.', 'error');
    });
  };

  const updateCategory = (cat: Category) => {
    void apiRequest<{ category: Category }>(`/api/catalog/categories/${encodeURIComponent(cat.id)}`, {
      method: 'PUT',
      body: JSON.stringify(cat)
    }).then(({ category }) => {
      setCategories(prev => prev.map(item => item.id === category.id ? category : item));
      showToast(`دسته‌بندی ${category.nameFa} به‌روزرسانی شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش دسته‌بندی در سرور انجام نشد.', 'error');
    });
  };

  const deleteCategory = (catId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/catalog/categories/${encodeURIComponent(catId)}`, {
      method: 'DELETE'
    }).then(() => {
      setCategories(prev => prev.filter(item => item.id !== catId));
      showToast('دسته‌بندی حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف دسته‌بندی در سرور انجام نشد.', 'error');
    });
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

  // Customer authentication is handled by the production API.
  const customerLogin = async (phone: string, pass: string) => {
    if (!pass) {
      return { success: false, error: 'رمز عبور الزامی است.' };
    }
    try {
      const data = await apiRequest<{ customer: CustomerUser }>('/api/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pass })
      });
      setCurrentCustomer(data.customer);
      setCustomers(prev => {
        const exists = prev.some(item => item.id === data.customer.id);
        return exists ? prev.map(item => item.id === data.customer.id ? data.customer : item) : [data.customer, ...prev];
      });
      showToast(`خوش آمدید، ${data.customer.firstName} عزیز.`);
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'ACCOUNT_BLOCKED'
          ? 'حساب کاربری شما غیرفعال شده است.'
          : code === 'TOO_MANY_LOGIN_ATTEMPTS'
            ? 'تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'
            : 'شماره همراه یا رمز عبور نادرست است.';
      return { success: false, error: message };
    }
  };

  const customerRegister = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    type: CustomerUser['type'];
    vehicle?: string;
  }) => {
    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' };
    }
    try {
      const response = await apiRequest<{ customer: CustomerUser }>('/api/auth/customer/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setCurrentCustomer(response.customer);
      setCustomers(prev => [response.customer, ...prev.filter(item => item.id !== response.customer.id)]);
      showToast('ثبت‌نام با موفقیت انجام شد.');
      return { success: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      const message =
        code === 'PHONE_ALREADY_REGISTERED'
          ? 'این شماره همراه قبلاً ثبت شده است.'
          : code === 'PASSWORD_TOO_SHORT'
            ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
            : 'ثبت‌نام انجام نشد. اطلاعات را بررسی کنید.';
      return { success: false, error: message };
    }
  };

  const customerLogout = async () => {
    try {
      await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local logout must still complete.
    }
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
    void apiRequest<{ product: Product }>('/api/catalog/products', {
      method: 'POST',
      body: JSON.stringify(product)
    }).then(result => {
      setProducts(prev => [result.product, ...prev]);
      showToast(`قطعه ${result.product.nameFa} با موفقیت ثبت شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ثبت محصول در پایگاه داده انجام نشد.', 'error');
    });
  };

  const updateProduct = (updated: Product) => {
    void apiRequest<{ product: Product }>(`/api/catalog/products/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    }).then(result => {
      setProducts(prev => prev.map(p => p.id === result.product.id ? result.product : p));
      showToast(`محصول ${result.product.nameFa} با موفقیت ویرایش شد.`);
    }).catch(error => {
      console.error(error);
      showToast('ویرایش محصول در پایگاه داده انجام نشد.', 'error');
    });
  };

  const deleteProduct = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/catalog/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(() => {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('محصول از پایگاه داده حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف محصول در سرور انجام نشد.', 'error');
    });
  };

  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {
    void apiRequest<{ ok: boolean }>('/api/catalog/products/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    }).then(() => {
      setProducts(prev => prev.map(p => {
        const target = updates.find(u => u.id === p.id);
        if (!target) return p;
        const stock = target.stock !== undefined ? target.stock : p.stock;
        return {
          ...p,
          price: target.price !== undefined ? target.price : p.price,
          stock,
          stockStatus: stock <= 0 ? 'out_of_stock' : stock <= 3 ? 'low_stock' : 'in_stock'
        };
      }));
      showToast(`${updates.length} محصول با موفقیت به‌روزرسانی گروهی شدند.`);
    }).catch(error => {
      console.error(error);
      showToast('به‌روزرسانی گروهی محصولات انجام نشد.', 'error');
    });
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

  // Loyalty Point Helpers
  const getTierInfo = (points: number) => {
    if (points >= 3000) {
      return {
        tier: 'diamond' as LoyaltyTier,
        title: 'مشتری VIP الماس',
        badgeClass: 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/40',
        discountMultiplier: 2.0,
        minPoints: 3000,
        perks: [
          'کسب ۲ برابر امتیاز در تمامی خریدها (۲٪ بازگشت وجه)',
          'ارسال اکسپرس و بیمه‌شده کاملاً رایگان بدون سقف سفارش',
          'مشاوره فنی تلفنی اختصاصی با مهندسین ارشد خودرو',
          'اولویت ترخیص و تامین قطعات نایاب و سفارشی از گمرک'
        ]
      };
    }
    if (points >= 1000) {
      return {
        tier: 'gold' as LoyaltyTier,
        title: 'مشتری طلایی',
        badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/30 border border-amber-300/40',
        discountMultiplier: 1.5,
        minPoints: 1000,
        perks: [
          'کسب ۱.۵ برابر امتیاز در تمامی خریدها',
          'بسته‌بندی ضربه‌گیر ویژه قطعات حساس بدون هزینه اضافی',
          'اولویت آماده‌سازی و ارسال سفارش‌ها در انبار مرکزی'
        ],
        nextTier: {
          title: 'مشتری VIP الماس',
          pointsNeeded: 3000 - points,
          percent: Math.min(100, Math.round(((points - 1000) / 2000) * 100))
        }
      };
    }
    if (points >= 500) {
      return {
        tier: 'silver' as LoyaltyTier,
        title: 'مشتری نقره‌ای',
        badgeClass: 'bg-gradient-to-r from-slate-400 to-neutral-600 text-white shadow-md shadow-slate-500/20 border border-slate-300/40',
        discountMultiplier: 1.25,
        minPoints: 500,
        perks: [
          'کسب ۱.۲۵ برابر امتیاز در خریدها',
          'دسترسی زودهنگام به حراجی‌ها و جشنواره‌های فصلی'
        ],
        nextTier: {
          title: 'مشتری طلایی',
          pointsNeeded: 1000 - points,
          percent: Math.min(100, Math.round(((points - 500) / 500) * 100))
        }
      };
    }
    return {
      tier: 'bronze' as LoyaltyTier,
      title: 'مشتری برنزی',
      badgeClass: 'bg-gradient-to-r from-amber-800 to-stone-800 text-amber-100 shadow-md shadow-amber-900/20 border border-amber-700/40',
      discountMultiplier: 1.0,
      minPoints: 0,
      perks: [
        'کسب ۱ امتیاز به ازای هر ۱۰ هزار تومان خرید',
        'امکان تبدیل امتیازات به تخفیف در سبد خرید'
      ],
      nextTier: {
        title: 'مشتری نقره‌ای',
        pointsNeeded: 500 - points,
        percent: Math.min(100, Math.round((points / 500) * 100))
      }
    };
  };

  const getCustomerPoints = (customerId?: string): number => {
    const targetId = customerId || currentCustomer?.id;
    if (!targetId) return 0;
    const cust = customers.find(c => c.id === targetId || c.phone === targetId);
    if (cust && typeof cust.loyaltyPoints === 'number') {
      return cust.loyaltyPoints;
    }
    const custTx = loyaltyTransactions.filter(t => t.customerId === targetId || (cust && t.customerId === cust.id));
    if (custTx.length > 0) {
      return custTx[0].balanceAfter;
    }
    return 0;
  };

  const getCustomerTransactions = (customerId?: string): LoyaltyTransaction[] => {
    const targetId = customerId || currentCustomer?.id;
    if (!targetId) return [];
    const cust = customers.find(c => c.id === targetId || c.phone === targetId);
    return loyaltyTransactions.filter(t => t.customerId === targetId || (cust && t.customerId === cust.id));
  };

  const calculatePointsEarned = (amount: number, customerId?: string): number => {
    const rate = settings.loyaltySettings?.pointsPerToman ?? 0.0001; // 1 point per 10,000 Tomans
    const base = Math.floor(amount * rate);
    const pts = getCustomerPoints(customerId);
    const tier = getTierInfo(pts);
    return Math.max(1, Math.round(base * tier.discountMultiplier));
  };

  const calculatePointsValue = (points: number): number => {
    const valuePerPoint = settings.loyaltySettings?.tomanPerPoint ?? 1000;
    return Math.max(0, points * valuePerPoint);
  };

  const addLoyaltyPoints = (
    customerId: string,
    points: number,
    description: string,
    orderNumber?: string,
    type: LoyaltyTransaction['type'] = 'bonus'
  ) => {
    if (points <= 0) return;
    const currentPts = getCustomerPoints(customerId);
    const newBalance = currentPts + points;
    const now = new Date();
    const dateFa = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const newTx: LoyaltyTransaction = {
      id: `tx-loyalty-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      type,
      points,
      description,
      orderNumber,
      date: dateFa,
      balanceAfter: newBalance
    };

    setLoyaltyTransactions(prev => [newTx, ...prev]);

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId || c.phone === customerId) {
        const tier = getTierInfo(newBalance).tier;
        return { ...c, loyaltyPoints: newBalance, loyaltyTier: tier };
      }
      return c;
    }));

    if (currentCustomer && (currentCustomer.id === customerId || currentCustomer.phone === customerId)) {
      const tier = getTierInfo(newBalance).tier;
      setCurrentCustomer(prev => prev ? { ...prev, loyaltyPoints: newBalance, loyaltyTier: tier } : null);
    }
  };

  const redeemLoyaltyPoints = (
    customerId: string,
    points: number,
    orderNumber?: string
  ): boolean => {
    const currentPts = getCustomerPoints(customerId);
    if (points <= 0 || currentPts < points) return false;
    const newBalance = currentPts - points;
    const now = new Date();
    const dateFa = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const newTx: LoyaltyTransaction = {
      id: `tx-loyalty-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      type: 'redeemed',
      points: -points,
      description: orderNumber ? `کسر امتیاز بابت تخفیف در سفارش ${orderNumber}` : 'کسر امتیاز بابت تخفیف خرید',
      orderNumber,
      date: dateFa,
      balanceAfter: newBalance
    };

    setLoyaltyTransactions(prev => [newTx, ...prev]);

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId || c.phone === customerId) {
        const tier = getTierInfo(newBalance).tier;
        return { ...c, loyaltyPoints: newBalance, loyaltyTier: tier };
      }
      return c;
    }));

    if (currentCustomer && (currentCustomer.id === customerId || currentCustomer.phone === customerId)) {
      const tier = getTierInfo(newBalance).tier;
      setCurrentCustomer(prev => prev ? { ...prev, loyaltyPoints: newBalance, loyaltyTier: tier } : null);
    }
    return true;
  };

  // Orders
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'date'> & { loyaltyPointsToRedeem?: number }
  ): Promise<Order> => {
    const response = await apiRequest<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: orderData.customer,
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          vehicleInfo: item.vehicleInfo
        })),
        shippingMethodId: orderData.shippingMethod.id,
        paymentMethodId: orderData.paymentMethod.id
      })
    });

    setOrders(prev => [response.order, ...prev.filter(item => item.id !== response.order.id)]);
    showToast(`سفارش ${response.order.orderNumber} در سرور ثبت شد.`);
    return response.order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingCode?: string) => {
    void apiRequest<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingCode })
    }).then(({ order }) => {
      setOrders(prev => prev.map(item =>
        item.id === order.id || item.orderNumber === order.orderNumber ? order : item
      ));
      showToast(`وضعیت سفارش ${order.orderNumber} به‌روز شد.`);
    }).catch(error => {
      console.error(error);
      showToast('تغییر وضعیت سفارش روی سرور انجام نشد.', 'error');
    });
  };

  const deleteOrder = (orderId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    }).then(() => {
      setOrders(prev => prev.filter(o => o.id !== orderId && o.orderNumber !== orderId));
      showToast('سفارش حذف شد.', 'info');
    }).catch(error => {
      console.error(error);
      showToast('حذف سفارش روی سرور انجام نشد.', 'error');
    });
  };

  const getOrderById = (orderId: string) =>
    orders.find(o => o.id === orderId || o.orderNumber === orderId);

  const getOrderByTracking = async (orderNumber: string, phone: string) => {
    try {
      const response = await apiRequest<{ order: Order }>('/api/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderNumber, phone })
      });
      setOrders(prev => [response.order, ...prev.filter(item => item.id !== response.order.id)]);
      return response.order;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined;
      console.error(error);
      showToast('ارتباط با سامانه رهگیری سفارش برقرار نشد.', 'error');
      return undefined;
    }
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
      articleCategories,
      addArticle,
      updateArticle,
      deleteArticle,
      addArticleCategory,
      updateArticleCategory,
      deleteArticleCategory,
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
      deletePage,
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
      loyaltyTransactions,
      getCustomerPoints,
      getCustomerTransactions,
      addLoyaltyPoints,
      redeemLoyaltyPoints,
      calculatePointsEarned,
      calculatePointsValue,
      getTierInfo,
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
