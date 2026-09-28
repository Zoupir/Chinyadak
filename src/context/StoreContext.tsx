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
    clearCart();
    showToast(`سفارش ${response.order.orderNumber} در سرور ثبت شد.`);
    return response.order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, trackingCode?: string) => {
    void apiRequest<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingCode })
    })
      .then(({ order }) => {
        setOrders(prev => prev.map(item =>
          item.id === order.id || item.orderNumber === order.orderNumber ? order : item
        ));
        showToast(`وضعیت سفارش ${order.orderNumber} به‌روز شد.`);
      })
      .catch(error => {
        console.error(error);
        showToast('تغییر وضعیت سفارش روی سرور انجام نشد.', 'error');
      });
  };

  const deleteOrder = (orderId: string) => {
    void apiRequest<{ ok: boolean }>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    })
      .then(() => {
        setOrders(prev => prev.filter(o => o.id !== orderId && o.orderNumber !== orderId));
        showToast('سفارش حذف شد.', 'info');
      })
      .catch(error => {
        console.error(error);
        showToast('حذف سفارش روی سرور انجام نشد.', 'error');
      });
  };

  const getOrderById = (orderId: string) =>
    orders.find(o => o.id === orderId || o.orderNumber === orderId);

  const getOrderByTracking = (orderNumber: string, phone: string) => {
    const cleanNum = orderNumber.trim().toUpperCase();
    const cleanPhone = phone.trim();
    return orders.find(o =>
      cleanPhone.length >= 10 &&
      (o.orderNumber.toUpperCase() === cleanNum || o.id === cleanNum) &&
      o.customer.phone === cleanPhone
    );
  };

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
  const addProduct = (product: Product) => {
    void apiRequest<{ product: Product }>('/api/catalog/products', {
      method: 'POST',
      body: JSON.stringify(product)
    })
      .then(result => {
        setProducts(prev => [result.product, ...prev]);
        showToast(`قطعه ${result.product.nameFa} با موفقیت ثبت شد.`);
      })
      .catch(error => {
        console.error(error);
        showToast('ثبت محصول در پایگاه داده انجام نشد.', 'error');
      });
  };

  const updateProduct = (updated: Product) => {
    void apiRequest<{ product: Product }>(`/api/catalog/products/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    })
      .then(result => {
        setProducts(prev => prev.map(p => p.id === result.product.id ? result.product : p));
        showToast(`محصول ${result.product.nameFa} با موفقیت ویرایش شد.`);
      })
      .catch(error => {
        console.error(error);
        showToast('ویرایش محصول در پایگاه داده انجام نشد.', 'error');
      });
  };

  const deleteProduct = (id: string) => {
    void apiRequest<{ ok: boolean }>(`/api/catalog/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
      .then(() => {
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast('محصول از پایگاه داده حذف شد.', 'info');
      })
      .catch(error => {
        console.error(error);
        showToast('حذف محصول در سرور انجام نشد.', 'error');
      });
  };

  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {
    void apiRequest<{ ok: boolean }>('/api/catalog/products/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    })
      .then(() => {
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
      })
      .catch(error => {
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
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'> & { loyaltyPointsToRedeem?: number }): Order => {
    const orderNum = `CHP-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateFa = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const pointsToRedeem = orderData.loyaltyPointsToRedeem || 0;
    const customerPhone = orderData.customer.phone;

    // Identify customer ID (from current logged-in customer or existing customer matching phone)
    let customerId = currentCustomer?.id;
    if (!customerId) {
      const matched = customers.find(c => c.phone === customerPhone);
      if (matched) {
        customerId = matched.id;
      }
    }

    let discountFromPoints = 0;
    if (pointsToRedeem > 0 && customerId) {
      discountFromPoints = calculatePointsValue(pointsToRedeem);
      redeemLoyaltyPoints(customerId, pointsToRedeem, orderNum);
    }

    // Calculate points earned from this purchase
    const effectiveTotal = Math.max(0, orderData.subtotal - (orderData.discountAmount || 0) - discountFromPoints);
    const pointsEarned = calculatePointsEarned(effectiveTotal, customerId);

    // Credit newly earned points
    if (pointsEarned > 0 && customerId) {
      addLoyaltyPoints(
        customerId,
        pointsEarned,
        `امتیاز خرید فاکتور ${orderNum}`,
        orderNum,
        'earned'
      );
    }

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      date: dateFa,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: pointsToRedeem,
      loyaltyDiscountAmount: discountFromPoints,
      trackingPostCode: `POST-${Math.floor(1000000000 + Math.random() * 9000000000)}`
    };

    // Update customer total orders & spent
    if (customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId || c.phone === customerPhone) {
          return {
            ...c,
            totalOrders: (c.totalOrders || 0) + 1,
            totalSpent: (c.totalSpent || 0) + newOrder.total
          };
        }
        return c;
      }));

      if (currentCustomer && (currentCustomer.id === customerId || currentCustomer.phone === customerPhone)) {
        setCurrentCustomer(prev => prev ? {
          ...prev,
          totalOrders: (prev.totalOrders || 0) + 1,
          totalSpent: (prev.totalSpent || 0) + newOrder.total
        } : null);
      }
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    if (pointsEarned > 0) {
      showToast(`سفارش ${orderNum} با موفقیت ثبت شد و ${pointsEarned} امتیاز وفاداری به حساب شما افزوده گردید!`);
    }

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
      cleanPhone.length >= 10 &&
      (o.orderNumber.toUpperCase() === cleanNum || o.id === cleanNum) &&
      o.customer.phone === cleanPhone
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
