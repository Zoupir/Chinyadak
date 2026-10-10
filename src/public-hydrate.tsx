import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { buildRoutePath, parseRoutePath } from './utils/navigation';
import { ensureSiteFontLoaded } from './utils/siteFont';
import { SsrStoreProvider, type PublicStorefrontBootstrap } from './server/ssr-store-context';

type PublicPayload = {
  mode?: string;
  path?: string;
  entity?: Record<string, any> | null;
  bootstrap?: PublicStorefrontBootstrap;
};

type Navigate = (view: string, param?: string) => void;

const browserNavigate: Navigate = (view, param) => {
  window.location.assign(buildRoutePath(view, param));
};

const loadRouteElement = async (pathname: string, onNavigate: Navigate): Promise<React.ReactNode> => {
  const route = parseRoutePath(pathname);
  const openVehicle = () => onNavigate('shop');
  const openCart = () => onNavigate('cart');

  if (route.view === 'home') {
    const { HomeView } = await import('./components/home/HomeView');
    return <HomeView onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'shop') {
    const { ShopView } = await import('./components/shop/ShopView');
    return <ShopView initialFilterMode={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'category') {
    const { ShopView } = await import('./components/shop/ShopView');
    return <ShopView initialCategory={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'product' && route.param) {
    const { ProductDetailView } = await import('./components/product/ProductDetailView');
    return <ProductDetailView productId={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} onOpenCartDrawer={openCart} />;
  }
  if (route.view === 'car-brand' && route.param) {
    const { BrandDetailView } = await import('./components/brand/BrandDetailView');
    return <BrandDetailView brandSlug={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'car-model' && route.param) {
    const { CarModelView } = await import('./components/vehicle/CarModelView');
    return <CarModelView modelId={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'blog') {
    const { BlogView } = await import('./components/blog/BlogView');
    return <BlogView initialCategory={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'article' && route.param) {
    const { ArticleDetailView } = await import('./components/blog/ArticleDetailView');
    return <ArticleDetailView articleId={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'page') {
    const { PageView } = await import('./components/page/PageView');
    return <PageView pageSlug={route.param || 'about'} onNavigate={onNavigate} />;
  }
  if (route.view === 'about' || route.view === 'guarantee') {
    const { PageView } = await import('./components/page/PageView');
    return <PageView pageSlug={route.view} onNavigate={onNavigate} />;
  }

  const { ShopView } = await import('./components/shop/ShopView');
  return <ShopView onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
};

const root = document.getElementById('root');
const payloadNode = document.getElementById('__YADAK_SERVER_ROUTE__');

if (root && payloadNode) {
  void (async () => {
    try {
      const payload = JSON.parse(payloadNode.textContent || '{}') as PublicPayload;
      const path = payload.path || window.location.pathname;
      const route = parseRoutePath(path);
      const navigate = browserNavigate;
      const routeElement = await loadRouteElement(path, navigate);
      ensureSiteFontLoaded(payload.bootstrap?.cms?.settings?.fontFamily || 'Vazirmatn');

      hydrateRoot(
        root,
        <SsrStoreProvider bootstrap={payload.bootstrap}>
          <div className="min-h-screen bg-[var(--site-bg)] text-[var(--text-color)] flex flex-col" dir="rtl">
            <Header
              onOpenVehicleModal={() => navigate('shop')}
              onOpenCartDrawer={() => navigate('cart')}
              onNavigate={navigate}
              currentView={route.view}
              currentParam={route.param}
              onOpenAuthModal={() => navigate('account')}
              onOpenAiSearch={() => navigate('shop')}
            />
            <main className="flex-1">{routeElement}</main>
            <Footer onNavigate={navigate} onOpenAuthModal={() => navigate('account')} />
            <MobileBottomNav
              currentView={route.view}
              onNavigate={view => navigate(view)}
              onOpenVehicleModal={() => navigate('shop')}
              onOpenCartDrawer={() => navigate('cart')}
              onOpenAuthModal={() => navigate('account')}
            />
          </div>
        </SsrStoreProvider>,
        {
          onRecoverableError(error) {
            console.warn('Public storefront hydration recovered:', error);
          }
        }
      );
      document.documentElement.dataset.contentRendering = 'server-hydrated';
      root.dataset.jsRole = 'hydration-only';
    } catch (error) {
      // The server HTML remains fully usable if hydration or a route chunk fails.
      console.error('Public storefront hydration failed:', error);
    }
  })();
}
