import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_SETTINGS } from '../data/mockData';
import type { CartItem, GarageCar, Product, SiteSettings } from '../types';

export type PublicStorefrontBootstrap = {
  catalog?: { products?: Product[]; total?: number; hasMore?: boolean; nextOffset?: number };
  categories?: { categories?: any[] };
  vehicles?: { brands?: any[]; models?: any[] };
  cms?: {
    articles?: any[];
    articleCategories?: any[];
    sliders?: any[];
    pages?: any[];
    settings?: Partial<SiteSettings> | null;
    paymentGateways?: any[];
  };
};

type SsrStoreValue = Record<string, any>;

const SsrStoreContext = createContext<SsrStoreValue | undefined>(undefined);
const noop = () => undefined;
const no = () => false;
const zero = () => 0;

const tierInfo = () => ({
  tier: 'bronze',
  title: 'برنزی',
  badgeClass: '',
  discountMultiplier: 1,
  minPoints: 0,
  perks: [],
  nextTier: undefined
});

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
};

export const SsrStoreProvider: React.FC<{ bootstrap?: PublicStorefrontBootstrap; children: React.ReactNode }> = ({ bootstrap = {}, children }) => {
  const products = bootstrap.catalog?.products || [];
  const categories = bootstrap.categories?.categories || [];
  const brands = bootstrap.vehicles?.brands || [];
  const models = bootstrap.vehicles?.models || [];
  const articles = bootstrap.cms?.articles || [];
  const articleCategories = bootstrap.cms?.articleCategories || [];
  const sliders = bootstrap.cms?.sliders || [];
  const pages = bootstrap.cms?.pages || [];
  const settings = { ...INITIAL_SETTINGS, ...(bootstrap.cms?.settings || {}) } as SiteSettings;
  const paymentGateways = bootstrap.cms?.paymentGateways || [];

  // Keep the initial browser state identical to the server render. Personal
  // browser state is restored only after hydration, so SSR markup never shifts.
  const [selectedVehicle, setSelectedVehicle] = useState<GarageCar | null>(null);
  const [garage, setGarage] = useState<GarageCar[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isLiveEditActive, setIsLiveEditActive] = useState(false);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    setSelectedVehicle(safeRead<GarageCar | null>('chinpart_selected_car', null));
    setGarage(safeRead<GarageCar[]>('chinpart_garage', []));
    setCart(safeRead<CartItem[]>('chinpart_cart', []));
    setWishlist(safeRead<string[]>('chinpart_wishlist', []));
  }, []);

  useEffect(() => safeWrite('chinpart_cart', cart), [cart]);
  useEffect(() => safeWrite('chinpart_wishlist', wishlist), [wishlist]);
  useEffect(() => safeWrite('chinpart_garage', garage), [garage]);
  useEffect(() => safeWrite('chinpart_selected_car', selectedVehicle), [selectedVehicle]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const baseFontSize = Math.max(12, Math.min(24, Number((settings as any).baseFontSizePx || 16)));
    root.dataset.layout = (settings as any).layoutPreset || 'classic';
    root.dataset.mobileProductColumns = String((settings as any).mobileProductColumns || 2);
    root.dataset.mobileFooterColumns = String((settings as any).mobileFooterColumns || 2);
    root.style.setProperty('--site-base-font-size', `${baseFontSize}px`);
    root.style.setProperty('--theme-radius', `${Math.max(0, Math.min(60, Number((settings as any).themeRadiusPx || 12)))}px`);
    root.style.setProperty('--primary-color', (settings as any).primaryColor || '#DC2626');
    root.style.setProperty('--primary-hover', (settings as any).primaryHover || (settings as any).primaryColor || '#b91c1c');
    root.style.setProperty('--site-bg', (settings as any).siteBgColor || '#f8fafc');
    root.style.setProperty('--card-bg', (settings as any).cardBgColor || '#ffffff');
    root.style.setProperty('--header-bg', (settings as any).headerBgColor || '#ffffff');
    root.style.setProperty('--footer-bg', (settings as any).footerBgColor || '#111827');
    root.style.setProperty('--text-color', (settings as any).textColor || '#111827');
    root.style.setProperty('--site-font', `"${(settings as any).fontFamily || 'Vazirmatn'}", system-ui, sans-serif`);
  }, [settings]);

  const addToCart = (product: Product, quantity = 1, vehicleInfo: GarageCar | null = selectedVehicle) => {
    setCart(current => {
      const index = current.findIndex(item => item.product.id === product.id);
      if (index < 0) return [...current, { product, quantity, vehicleInfo } as CartItem];
      return current.map((item, i) => i === index ? { ...item, quantity: item.quantity + quantity } : item);
    });
  };
  const removeFromCart = (productId: string) => setCart(current => current.filter(item => item.product.id !== productId));
  const updateQuantity = (productId: string, quantity: number) => setCart(current => current.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  const toggleWishlist = (productId: string) => setWishlist(current => current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId]);
  const toggleCompare = (product: Product) => setCompareList(current => current.some(item => item.id === product.id) ? current.filter(item => item.id !== product.id) : [...current, product].slice(-4));
  const addToGarage = (car: any) => setGarage(current => [...current, { ...car, id: car.id || `garage-${Date.now()}`, addedAt: car.addedAt || new Date().toISOString() }]);

  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number((item.product.discountPrice || item.product.price || 0) * item.quantity), 0);

  const base = useMemo<SsrStoreValue>(() => ({
    products,
    catalogHasMore: Boolean(bootstrap.catalog?.hasMore),
    catalogLoading: false,
    catalogOffset: Number(bootstrap.catalog?.nextOffset || products.length),
    loadCatalogPage: noop,
    brands,
    models,
    categories,
    articles,
    articleCategories,
    sliders,
    pages,
    settings,
    paymentGateways,
    apiIntegrations: {},
    customers: [],
    currentCustomer: null,
    loyaltyTransactions: [],
    adminUsers: [],
    orders: [],
    partRequests: [],
    stockAlerts: [],
    searchLogs: [],
    selectedVehicle,
    setSelectedVehicle,
    setSelectedVehicleState: setSelectedVehicle,
    clearSelectedVehicle: () => setSelectedVehicle(null),
    garage,
    addToGarage,
    removeFromGarage: (id: string) => setGarage(current => current.filter(item => item.id !== id)),
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: () => setCart([]),
    cartCount,
    cartTotal,
    wishlist,
    toggleWishlist,
    isInWishlist: (id: string) => wishlist.includes(id),
    compareList,
    toggleCompare,
    addToCompare: (product: Product) => setCompareList(current => current.some(item => item.id === product.id) ? current : [...current, product].slice(-4)),
    removeFromCompare: (id: string) => setCompareList(current => current.filter(item => item.id !== id)),
    isInCompare: (id: string) => compareList.some(item => item.id === id),
    isLiveEditActive,
    setIsLiveEditActive,
    adminAuth: { isAuthenticated: false, username: '', isMustChangePassword: false },
    toast,
    showToast: (message: string, type = 'success') => {
      setToast({ message, type });
      if (typeof window !== 'undefined') window.setTimeout(() => setToast(null), 2800);
    },
    updateSettings: noop,
    updatePage: noop,
    updateSection: noop,
    updateSlider: noop,
    customerLogout: noop,
    adminLogout: noop,
    getCustomerPoints: zero,
    getTierInfo: tierInfo,
    addLoyaltyPoints: noop,
    redeemLoyaltyPoints: no,
    calculatePointsEarned: zero,
    calculatePointsValue: zero,
    loyaltySettings: {},
    isStoreReady: true
  }), [bootstrap.catalog?.hasMore, bootstrap.catalog?.nextOffset, products, brands, models, categories, articles, articleCategories, sliders, pages, settings, paymentGateways, selectedVehicle, garage, cart, cartCount, cartTotal, wishlist, compareList, isLiveEditActive, toast]);

  const value = useMemo(() => new Proxy(base, {
    get(target, prop: string | symbol) {
      if (prop in target) return target[prop as string];
      // Public rendering should not fail when a component asks for an action
      // that is intentionally private/admin-only in this lightweight provider.
      return noop;
    }
  }), [base]);

  return <SsrStoreContext.Provider value={value}>{children}</SsrStoreContext.Provider>;
};

// Alias-compatible exports. Actual public server/client bundles redirect imports
// of context/StoreContext to this module so the original components are reused.
export const StoreProvider = SsrStoreProvider;
export const useStore = (): any => {
  const context = useContext(SsrStoreContext);
  if (!context) throw new Error('SSR_STORE_CONTEXT_MISSING');
  return context;
};
