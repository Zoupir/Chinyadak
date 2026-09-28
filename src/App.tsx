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
import { buildRouteHash, parseRouteHash, getPageShareMeta } from './utils/navigation';

interface RouteState {
  view: string;
  param?: string;
}

const AppContent: React.FC = () => {
  const { toast, products, categories, models, brands, articles, settings } = useStore();
  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseRouteHash(window.location.hash);
    }
    return { view: 'home' };
  });
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  // Sync document title with current page / section
  useEffect(() => {
    const meta = getPageShareMeta(route.view, route.param, { products, categories, models, brands, articles });
    const siteName = settings.siteTitle?.split('|')[0]?.trim() || 'چین‌پارت';
    document.title = `${meta.title} | ${siteName}`;
  }, [route, products, categories, models, brands, articles, settings]);

  // Listen for browser hash navigation (back/forward, direct links, bookmarking)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseRouteHash(window.location.hash);
      setRoute(parsed);
    };

    // If initial hash was present on mount, make sure it matches canonical route
    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    const targetHash = buildRouteHash(view, param);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute({ view, param });
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

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
            window.location.hash = '';
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
      <main className="flex-1">
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
