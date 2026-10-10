import React from 'react';
import { renderToString } from 'react-dom/server';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { HomeView } from '../components/home/HomeView';
import { ShopView } from '../components/shop/ShopView';
import { ProductDetailView } from '../components/product/ProductDetailView';
import { BrandDetailView } from '../components/brand/BrandDetailView';
import { CarModelView } from '../components/vehicle/CarModelView';
import { BlogView } from '../components/blog/BlogView';
import { ArticleDetailView } from '../components/blog/ArticleDetailView';
import { PageView } from '../components/page/PageView';
import { buildRoutePath, parseRoutePath } from '../utils/navigation';
import { SsrStoreProvider, type PublicStorefrontBootstrap } from './ssr-store-context';

type PublicPayload = {
  mode?: string;
  path?: string;
  entity?: Record<string, any> | null;
  bootstrap?: PublicStorefrontBootstrap;
};

type Navigate = (view: string, param?: string) => void;

const browserNavigate: Navigate = (view, param) => {
  if (typeof window === 'undefined') return;
  window.location.assign(buildRoutePath(view, param));
};

const PublicRouteView: React.FC<{ pathname: string; onNavigate: Navigate }> = ({ pathname, onNavigate }) => {
  const route = parseRoutePath(pathname);
  const openVehicle = () => onNavigate('shop');
  const openCart = () => onNavigate('cart');

  if (route.view === 'home') {
    return <HomeView onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'shop') {
    return <ShopView initialFilterMode={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'category') {
    return <ShopView initialCategory={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'product' && route.param) {
    return <ProductDetailView productId={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} onOpenCartDrawer={openCart} />;
  }
  if (route.view === 'car-brand' && route.param) {
    return <BrandDetailView brandSlug={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'car-model' && route.param) {
    return <CarModelView modelId={route.param} onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
  }
  if (route.view === 'blog') {
    return <BlogView initialCategory={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'article' && route.param) {
    return <ArticleDetailView articleId={route.param} onNavigate={onNavigate} />;
  }
  if (route.view === 'page') {
    return <PageView pageSlug={route.param || 'about'} onNavigate={onNavigate} />;
  }
  if (route.view === 'about' || route.view === 'guarantee') {
    return <PageView pageSlug={route.view} onNavigate={onNavigate} />;
  }

  return <ShopView onNavigate={onNavigate} onOpenVehicleModal={openVehicle} />;
};

export const PublicStorefront: React.FC<{ payload: PublicPayload; pathname?: string }> = ({ payload, pathname }) => {
  const path = pathname || payload.path || '/';
  const route = parseRoutePath(path);
  const navigate = browserNavigate;
  return (
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
        <main className="flex-1">
          <PublicRouteView pathname={path} onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} onOpenAuthModal={() => navigate('account')} />
        <MobileBottomNav
          currentView={route.view}
          onNavigate={view => navigate(view)}
          onOpenVehicleModal={() => navigate('shop')}
          onOpenCartDrawer={() => navigate('cart')}
          onOpenAuthModal={() => navigate('account')}
        />
      </div>
    </SsrStoreProvider>
  );
};

export const renderPublicStorefront = (payload: PublicPayload, pathname: string): string =>
  renderToString(<PublicStorefront payload={payload} pathname={pathname} />);
