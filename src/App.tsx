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
import { AdminView } from './components/admin/AdminView';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface RouteState {
  view: string;
  param?: string;
}

const AppContent: React.FC = () => {
  const { toast } = useStore();
  const [route, setRoute] = useState<RouteState>({ view: 'home' });
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  // Listen for hash navigation e.g. #admin
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin') {
        setRoute({ view: 'admin' });
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      window.location.hash = '';
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
        <AdminView onExitToStore={() => {
          window.location.hash = '';
          handleNavigate('home');
        }} />
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
        onOpenAuthModal={handleOpenAuthModal}
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
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={route.view}
        onNavigate={handleNavigate}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
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
