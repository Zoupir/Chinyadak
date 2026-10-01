import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { VehicleSelectorModal } from './components/vehicle/VehicleSelectorModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { HomeView } from './components/home/HomeView';
import { ShopView } from './components/shop/ShopView';
import { ProductDetailView } from './components/product/ProductDetailView';
import { BrandDetailView } from './components/brand/BrandDetailView';
import { CarModelView } from './components/vehicle/CarModelView';
import { CheckoutView } from './components/cart/CheckoutView';
import { OrderTrackingView } from './components/orders/OrderTrackingView';
import { AccountView } from './components/account/AccountView';
import { CompareView } from './components/compare/CompareView';
import { PartRequestView } from './components/parts/PartRequestView';
import { BlogView } from './components/blog/BlogView';
import { ArticleDetailView } from './components/blog/ArticleDetailView';
import { PageView } from './components/page/PageView';
import { AdminView } from './components/admin/AdminView';
import { InvoicePageView } from './components/orders/InvoicePageView';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';
import { AiSearchAdvisorModal } from './components/search/AiSearchAdvisorModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { buildRoutePath, parseRoutePath, parseLegacyHash } from './utils/navigation';

interface RouteState {
  view: string;
  param?: string;
}

const AppContent: React.FC = () => {
  const { toast, products, categories, models, brands, articles, settings, isStoreReady } = useStore();
  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window === 'undefined') return { view: 'home' };
    const legacy = parseLegacyHash(window.location.hash);
    return legacy || parseRoutePath(window.location.pathname);
  });
  // Increments on every explicit navigation, even when the target route is the
  // current route. This intentionally re-initializes the page when Home/logo or
  // the active menu item is clicked again.
  const [routeRevision, setRouteRevision] = useState(0);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  // Apply admin-controlled identity/theme variables to the whole storefront.
  useEffect(() => {
    if (!isStoreReady) return;
    const root = document.documentElement;
    const baseFontSize = Math.max(12, Math.min(24, Number(settings.baseFontSizePx || 16)));

    root.dataset.layout = settings.layoutPreset || 'classic';
    root.dataset.mobileProductColumns = String(settings.mobileProductColumns || 2);
    root.dataset.mobileFooterColumns = String(settings.mobileFooterColumns || 2);
    root.style.setProperty('--site-base-font-size', `${baseFontSize}px`);
    root.style.setProperty('--theme-radius', `${Math.max(0, Math.min(60, Number(settings.themeRadiusPx || 12)))}px`);
    root.style.setProperty('--primary-color', settings.primaryColor || '#DC2626');
    root.style.setProperty('--primary-hover', settings.primaryHover || settings.primaryColor || '#b91c1c');
    root.style.setProperty('--site-bg', settings.siteBgColor || '#f8fafc');
    root.style.setProperty('--card-bg', settings.cardBgColor || '#ffffff');
    root.style.setProperty('--header-bg', settings.headerBgColor || '#ffffff');
    root.style.setProperty('--footer-bg', settings.footerBgColor || '#111827');
    root.style.setProperty('--text-color', settings.textColor || '#111827');
    root.style.setProperty('--site-font', `"${settings.fontFamily || 'Vazirmatn'}", system-ui, sans-serif`);

    if (settings.faviconUrl) {
      let favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.faviconUrl;
    }
  }, [
    settings.layoutPreset,
    settings.mobileProductColumns,
    settings.mobileFooterColumns,
    settings.baseFontSizePx,
    settings.themeRadiusPx,
    settings.primaryColor,
    settings.primaryHover,
    settings.siteBgColor,
    settings.cardBgColor,
    settings.headerBgColor,
    settings.footerBgColor,
    settings.textColor,
    settings.fontFamily,
    settings.faviconUrl,
    isStoreReady
  ]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route, routeRevision]);

  // TakRank SEO Native owns browser metadata during History API navigation.
  // Initial page-load metadata is injected server-side for crawlers; this keeps
  // client-side navigation consistent with the same native SEO rules.
  useEffect(() => {
    const controller = new AbortController();

    const setMeta = (
      selector: string,
      attribute: 'name' | 'property',
      key: string,
      content: string
    ) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content || '';
    };

    const applyRuntimeMeta = async () => {
      try {
        const routePath = buildRoutePath(route.view, route.param);
        const response = await fetch(
          '/api/seo/runtime?path=' + encodeURIComponent(routePath),
          { signal: controller.signal, credentials: 'same-origin' }
        );
        if (!response.ok) return;
        const payload = await response.json();
        const meta = payload?.meta;
        if (!meta) return;

        document.title = String(meta.title || '');
        setMeta('meta[name="description"]', 'name', 'description', String(meta.description || ''));
        setMeta('meta[name="robots"]', 'name', 'robots', String(meta.robots || ''));
        setMeta('meta[property="og:title"]', 'property', 'og:title', String(meta.ogTitle || meta.title || ''));
        setMeta('meta[property="og:description"]', 'property', 'og:description', String(meta.ogDescription || meta.description || ''));
        setMeta('meta[property="og:type"]', 'property', 'og:type', String(meta.ogType || 'website'));
        setMeta('meta[property="og:url"]', 'property', 'og:url', String(meta.canonical || ''));
        setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
        setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', String(meta.twitterTitle || meta.title || ''));
        setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', String(meta.twitterDescription || meta.description || ''));

        if (meta.image) setMeta('meta[property="og:image"]', 'property', 'og:image', String(meta.image));
        if (meta.twitterImage) setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', String(meta.twitterImage));

        let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.rel = 'canonical';
          document.head.appendChild(canonical);
        }
        canonical.href = String(meta.canonical || window.location.href);

        document.head.querySelectorAll('link[data-takrank-hreflang="1"]').forEach(node => node.remove());
        for (const alternate of Array.isArray(meta.hreflang) ? meta.hreflang : []) {
          if (!alternate?.lang || !alternate?.url) continue;
          const link = document.createElement('link');
          link.rel = 'alternate';
          link.hreflang = String(alternate.lang);
          link.href = String(alternate.url);
          link.dataset.takrankHreflang = '1';
          document.head.appendChild(link);
        }

        document.head.querySelectorAll('script[data-takrank-runtime-schema="1"]').forEach(node => node.remove());
        for (const schema of Array.isArray(meta.schemas) ? meta.schemas : []) {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.dataset.takrankRuntimeSchema = '1';
          script.textContent = JSON.stringify(schema);
          document.head.appendChild(script);
        }
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.warn('TakRank SEO runtime metadata refresh failed:', error);
        }
      }
    };

    void applyRuntimeMeta();
    return () => controller.abort();
  }, [route]);

  // Normal History API routing, with one-time migration for old hash URLs.
  useEffect(() => {
    const legacy = parseLegacyHash(window.location.hash);
    if (legacy) {
      const migratedPath = buildRoutePath(legacy.view, legacy.param);
      window.history.replaceState({}, '', `${migratedPath}${window.location.search}`);
      setRoute(legacy);
    }

    const handlePopState = () => {
      setRoute(parseRoutePath(window.location.pathname));
      setRouteRevision(current => current + 1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    let canonicalParam = param;
    if (view === 'product' && param) {
      const product = products.find(item => item.id === param || item.slug === param);
      canonicalParam = product?.slug || param;
    } else if (view === 'article' && param) {
      const article = articles.find(item => item.id === param || item.slug === param);
      canonicalParam = article?.slug || param;
    } else if ((view === 'car-model' || view === 'model') && param) {
      const model = models.find(item => item.id === param || item.slug === param);
      canonicalParam = model?.slug || param;
    } else if ((view === 'car-brand' || view === 'brand') && param) {
      const brand = brands.find(item => item.id === param || item.slug === param);
      canonicalParam = brand?.slug || param;
    }

    const targetPath = buildRoutePath(view, canonicalParam);
    if (`${window.location.pathname}${window.location.search}` !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute({ view, param: canonicalParam });
    setRouteRevision(current => current + 1);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  if (!isStoreReady) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center" aria-label="در حال بارگذاری فروشگاه">
        <div className="w-full max-w-5xl px-5 animate-pulse">
          <div className="h-16 rounded-xl bg-neutral-200" />
          <div className="mt-4 h-[420px] rounded-2xl bg-neutral-200" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-xl bg-neutral-200" />)}
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Full-Screen Enterprise Admin Layout
  if (route.view === 'admin') {
    return (
      <div className="min-h-screen bg-neutral-100 font-sans selection:bg-red-600 selection:text-white">
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-red-600 border-red-700'
                : toast.type === 'info'
                ? 'bg-neutral-900 border-neutral-800'
                : 'bg-emerald-600 border-emerald-700'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <AdminView 
          onExitToStore={() => {
            handleNavigate('home');
          }} 
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
            toast.type === 'error'
              ? 'bg-red-600 border-red-700'
              : toast.type === 'info'
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-emerald-600 border-emerald-700'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 shrink-0 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
        onNavigate={handleNavigate}
        currentView={route.view}
        currentParam={route.param}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenAiSearch={() => setIsAiSearchOpen(true)}
      />

      {/* Main View Container */}
      <main key={`${route.view}:${route.param || ''}:${routeRevision}`} className="flex-1">
        {route.view === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
          />
        )}

        {route.view === 'shop' && (
          <ShopView
            initialFilterMode={route.param}
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
          />
        )}

        {route.view === 'category' && (
          <ShopView
            initialCategory={route.param}
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
          />
        )}

        {route.view === 'product' && route.param && (
          <ProductDetailView
            productId={route.param}
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
          />
        )}

        {route.view === 'car-brand' && route.param && (
          <BrandDetailView
            brandSlug={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'car-model' && route.param && (
          <CarModelView
            modelId={route.param}
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
          />
        )}

        {route.view === 'checkout' && (
          <CheckoutView
            onOrderCompleted={(orderNumber) => handleNavigate('tracking', orderNumber)}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'tracking' && (
          <OrderTrackingView
            initialOrderNumber={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'invoice' && (
          <InvoicePageView
            orderId={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'account' && (
          <AccountView
            initialTab={route.param}
            onNavigate={handleNavigate}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onOpenAuthModal={handleOpenAuthModal}
          />
        )}

        {route.view === 'compare' && (
          <CompareView
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'part-request' && (
          <PartRequestView
            initialQuery={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'blog' && (
          <BlogView
            initialCategory={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'article' && route.param && (
          <ArticleDetailView
            articleId={route.param}
            onNavigate={handleNavigate}
          />
        )}

        {route.view === 'page' && (
          <PageView
            pageSlug={route.param || 'about'}
            onNavigate={handleNavigate}
          />
        )}

        {(route.view === 'about' || route.view === 'guarantee') && (
          <PageView
            pageSlug={route.view}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer 
        onNavigate={handleNavigate} 
        onOpenAuthModal={handleOpenAuthModal} 
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={route.view}
        onNavigate={handleNavigate}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Vehicle Finder & Garage Modal */}
      <VehicleSelectorModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehicleSelected={() => {
          if (route.view === 'home') {
            handleNavigate('shop');
          }
        }}
      />

      {/* Cart Sliding Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onProceedToCheckout={() => handleNavigate('checkout')}
        onViewProduct={(id) => handleNavigate('product', id)}
      />

      {/* Customer Login and Register Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* AI & Google Search Parts Advisor Modal */}
      <AiSearchAdvisorModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
