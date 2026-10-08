import fs from 'node:fs';

const changed = [];
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => { fs.writeFileSync(file, value); changed.push(file); };
const edit = (file, transform) => {
  const before = read(file);
  const after = transform(before);
  if (after !== before) write(file, after);
};
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const index = source.indexOf(from);
  if (index < 0) throw new Error(`v30.10.6 marker missing: ${label}`);
  return source.slice(0, index) + to + source.slice(index + from.length);
};

edit('src/App.tsx', source => {
  source = source.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { lazy, Suspense, useState, useEffect } from 'react';"
  );

  for (const line of [
    "import { VehicleSelectorModal } from './components/vehicle/VehicleSelectorModal';\n",
    "import { CartDrawer } from './components/cart/CartDrawer';\n",
    "import { HomeView } from './components/home/HomeView';\n",
    "import { ShopView } from './components/shop/ShopView';\n",
    "import { ProductDetailView } from './components/product/ProductDetailView';\n",
    "import { BrandDetailView } from './components/brand/BrandDetailView';\n",
    "import { CarModelView } from './components/vehicle/CarModelView';\n",
    "import { CheckoutView } from './components/cart/CheckoutView';\n",
    "import { OrderTrackingView } from './components/orders/OrderTrackingView';\n",
    "import { AccountView } from './components/account/AccountView';\n",
    "import { CompareView } from './components/compare/CompareView';\n",
    "import { PartRequestView } from './components/parts/PartRequestView';\n",
    "import { BlogView } from './components/blog/BlogView';\n",
    "import { ArticleDetailView } from './components/blog/ArticleDetailView';\n",
    "import { PageView } from './components/page/PageView';\n",
    "import { AdminView } from './components/admin/AdminView';\n",
    "import { InvoicePageView } from './components/orders/InvoicePageView';\n",
    "import { CustomerAuthModal } from './components/auth/CustomerAuthModal';\n",
    "import { AiSearchAdvisorModal } from './components/search/AiSearchAdvisorModal';\n"
  ]) source = source.replace(line, '');

  source = replaceOnce(
    source,
    "import { getSiteDisplayName, replaceLegacySiteName } from './utils/siteBrand';",
    "import { getSiteDisplayName, replaceLegacySiteName } from './utils/siteBrand';\nimport { ensureSiteFontLoaded } from './utils/siteFont';",
    'App site font import'
  );

  const lazyBlock = `
const HomeView = lazy(() => import('./components/home/HomeView').then(module => ({ default: module.HomeView })));
const ShopView = lazy(() => import('./components/shop/ShopView').then(module => ({ default: module.ShopView })));
const ProductDetailView = lazy(() => import('./components/product/ProductDetailView').then(module => ({ default: module.ProductDetailView })));
const BrandDetailView = lazy(() => import('./components/brand/BrandDetailView').then(module => ({ default: module.BrandDetailView })));
const CarModelView = lazy(() => import('./components/vehicle/CarModelView').then(module => ({ default: module.CarModelView })));
const CheckoutView = lazy(() => import('./components/cart/CheckoutView').then(module => ({ default: module.CheckoutView })));
const OrderTrackingView = lazy(() => import('./components/orders/OrderTrackingView').then(module => ({ default: module.OrderTrackingView })));
const InvoicePageView = lazy(() => import('./components/orders/InvoicePageView').then(module => ({ default: module.InvoicePageView })));
const AccountView = lazy(() => import('./components/account/AccountView').then(module => ({ default: module.AccountView })));
const CompareView = lazy(() => import('./components/compare/CompareView').then(module => ({ default: module.CompareView })));
const PartRequestView = lazy(() => import('./components/parts/PartRequestView').then(module => ({ default: module.PartRequestView })));
const BlogView = lazy(() => import('./components/blog/BlogView').then(module => ({ default: module.BlogView })));
const ArticleDetailView = lazy(() => import('./components/blog/ArticleDetailView').then(module => ({ default: module.ArticleDetailView })));
const PageView = lazy(() => import('./components/page/PageView').then(module => ({ default: module.PageView })));
const AdminView = lazy(() => import('./components/admin/AdminView').then(module => ({ default: module.AdminView })));
const VehicleSelectorModal = lazy(() => import('./components/vehicle/VehicleSelectorModal').then(module => ({ default: module.VehicleSelectorModal })));
const CartDrawer = lazy(() => import('./components/cart/CartDrawer').then(module => ({ default: module.CartDrawer })));
const CustomerAuthModal = lazy(() => import('./components/auth/CustomerAuthModal').then(module => ({ default: module.CustomerAuthModal })));
const AiSearchAdvisorModal = lazy(() => import('./components/search/AiSearchAdvisorModal').then(module => ({ default: module.AiSearchAdvisorModal })));

const RouteLoading: React.FC = () => (
  <div className="min-h-[45vh] grid place-items-center px-5" role="status" aria-live="polite" aria-label="در حال بارگذاری بخش">
    <div className="w-full max-w-5xl animate-pulse" aria-hidden="true">
      <div className="h-10 w-2/5 rounded-xl bg-neutral-200" />
      <div className="mt-5 h-64 rounded-2xl bg-neutral-200" />
    </div>
  </div>
);
`;
  if (!source.includes("const HomeView = lazy(() => import('./components/home/HomeView')")) {
    const marker = "interface RouteState {";
    const index = source.indexOf(marker);
    if (index < 0) throw new Error('v30.10.6 marker missing: App lazy insertion');
    source = source.slice(0, index) + lazyBlock + '\n' + source.slice(index);
  }

  if (!source.includes('ensureSiteFontLoaded(settings.fontFamily')) {
    source = replaceOnce(
      source,
      "  // Scroll to top on navigation\n",
      "  useEffect(() => {\n    if (!isStoreReady) return;\n    ensureSiteFontLoaded(settings.fontFamily || 'Vazirmatn');\n  }, [isStoreReady, settings.fontFamily]);\n\n  // Scroll to top on navigation\n",
      'App font effect'
    );
  }

  source = replaceOnce(
    source,
    `        <AdminView
          initialTarget={route.param}
          onExitToStore={() => {
            handleNavigate('home');
          }} 
          onNavigate={handleNavigate}
        />`,
    `        <Suspense fallback={<RouteLoading />}>
          <AdminView
            initialTarget={route.param}
            onExitToStore={() => {
              handleNavigate('home');
            }}
            onNavigate={handleNavigate}
          />
        </Suspense>`,
    'Admin lazy boundary'
  );

  source = replaceOnce(
    source,
    `      <main key={\`${'${route.view}'}:${'${route.param || \'\'}'}:${'${routeRevision}'}\`} className="flex-1">`,
    `      <main key={\`${'${route.view}'}:${'${route.param || \'\'}'}:${'${routeRevision}'}\`} className="flex-1">\n        <Suspense fallback={<RouteLoading />}>`,
    'Route lazy boundary start'
  );
  source = replaceOnce(
    source,
    `        {(route.view === 'about' || route.view === 'guarantee') && (
          <PageView
            pageSlug={route.view}
            onNavigate={handleNavigate}
          />
        )}
      </main>`,
    `        {(route.view === 'about' || route.view === 'guarantee') && (
          <PageView
            pageSlug={route.view}
            onNavigate={handleNavigate}
          />
        )}
        </Suspense>
      </main>`,
    'Route lazy boundary end'
  );

  source = replaceOnce(
    source,
    `      {/* Vehicle Finder & Garage Modal */}
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
      />`,
    `      <Suspense fallback={null}>
        {isVehicleModalOpen && (
          <VehicleSelectorModal
            isOpen
            onClose={() => setIsVehicleModalOpen(false)}
            onVehicleSelected={() => {
              if (route.view === 'home') handleNavigate('shop');
            }}
          />
        )}
        {isCartDrawerOpen && (
          <CartDrawer
            isOpen
            onClose={() => setIsCartDrawerOpen(false)}
            onProceedToCheckout={() => handleNavigate('checkout')}
            onViewProduct={(id) => handleNavigate('product', id)}
          />
        )}
        {isAuthModalOpen && (
          <CustomerAuthModal
            isOpen
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
          />
        )}
        {isAiSearchOpen && (
          <AiSearchAdvisorModal
            isOpen
            onClose={() => setIsAiSearchOpen(false)}
            onNavigate={handleNavigate}
          />
        )}
      </Suspense>`,
    'Deferred modal chunks'
  );
  return source;
});

edit('src/components/search/SearchAutocomplete.tsx', source => {
  if (!source.includes('const resultDomId =')) {
    source = replaceOnce(
      source,
      `const flattenCategories = (categories: any[]) => {`,
      `const resultDomId = (result: RankedResult) => 'global-search-option-' + result.type + '-' + String(result.item?.id || result.item?.slug || 'result').replace(/[^a-zA-Z0-9_-]/g, '-');

const flattenCategories = (categories: any[]) => {`,
      'Search option id helper'
    );
  }

  source = replaceOnce(
    source,
    `  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);`,
    `  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);`,
    'Search active index'
  );

  if (!source.includes('setActiveIndex(-1);\n  }, [query]);')) {
    source = replaceOnce(
      source,
      `  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {`,
      `  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {`,
      'Search reset selection'
    );
  }

  source = replaceOnce(
    source,
    `  const totalResults = ranked.length;
  const cleanQ = normalize(query);`,
    `  const visibleResults: RankedResult[] = [
    ...productResults,
    ...modelResults,
    ...categoryResults,
    ...brandResults,
    ...articleResults
  ];
  const totalResults = ranked.length;
  const cleanQ = normalize(query);
  const activeResult = activeIndex >= 0 ? visibleResults[activeIndex] : undefined;`,
    'Search visible keyboard order'
  );

  source = replaceOnce(
    source,
    `    setIsOpen(false);
  };

  const submit = (event: React.FormEvent) => {`,
    `    setIsOpen(false);
    setActiveIndex(-1);
  };

  const submit = (event: React.FormEvent) => {`,
    'Search selection reset'
  );

  source = replaceOnce(
    source,
    `    logSearch(query, totalResults);
    if (ranked[0]) select(ranked[0]);
    else onRequestPart(query);`,
    `    logSearch(query, totalResults);
    if (activeResult) select(activeResult);
    else if (visibleResults[0]) select(visibleResults[0]);
    else onRequestPart(query);`,
    'Search submit active option'
  );

  source = replaceOnce(
    source,
    `  const ResultRow = ({ result }: { result: RankedResult }) => {
    const item = result.item;`,
    `  const ResultRow = ({ result }: { result: RankedResult }) => {
    const item = result.item;
    const optionIndex = visibleResults.findIndex(candidate => candidate.type === result.type && candidate.item?.id === result.item?.id);
    const optionId = resultDomId(result);`,
    'Search row keyboard index'
  );

  source = replaceOnce(
    source,
    `<button type="button" onClick={() => select(result)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 text-right group border border-transparent hover:border-neutral-200">`,
    `<button
        id={optionId}
        type="button"
        role="option"
        aria-selected={activeIndex === optionIndex}
        onMouseEnter={() => setActiveIndex(optionIndex)}
        onFocus={() => setActiveIndex(optionIndex)}
        onClick={() => select(result)}
        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 text-right group border border-transparent hover:border-neutral-200 aria-selected:bg-neutral-100 aria-selected:border-neutral-300"
      >`,
    'Search result option semantics'
  );

  source = replaceOnce(
    source,
    `        <input
          type="search"
          value={query}`,
    `        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && cleanQ.length > 1}
          aria-controls="global-search-listbox"
          aria-activedescendant={activeResult ? resultDomId(activeResult) : undefined}
          value={query}`,
    'Search combobox semantics'
  );

  source = replaceOnce(
    source,
    `          onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}`, 
    `          onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsOpen(false);
              setActiveIndex(-1);
              return;
            }
            if (!visibleResults.length) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex(current => current < 0 ? 0 : (current + 1) % visibleResults.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex(current => current < 0 ? visibleResults.length - 1 : (current - 1 + visibleResults.length) % visibleResults.length);
            } else if (event.key === 'Enter' && activeResult) {
              event.preventDefault();
              select(activeResult);
            }
          }`,
    'Search keyboard navigation'
  );

  source = replaceOnce(
    source,
    `<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 z-[170] overflow-hidden max-h-[75vh] overflow-y-auto">`,
    `<div id="global-search-listbox" role="listbox" aria-label="نتایج جستجو" className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-neutral-200 z-[170] overflow-hidden max-h-[75vh] overflow-y-auto">`,
    'Search listbox semantics'
  );
  return source;
});

edit('src/components/layout/Header.tsx', source => {
  source = replaceOnce(
    source,
    `  useEffect(() => {
    return () => {
      if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
      if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
    };
  }, []);`,
    `  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsMegaMenuOpen(false);
      setIsBrandsMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsMarketplaceMobileOpen(false);
      setMarketplaceOpenMenuId(null);
      setMarketplaceMobileOpenIds(new Set());
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
      if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
    };
  }, []);`,
    'Header escape accessibility'
  );

  source = replaceOnce(
    source,
    `              onClick={() => setIsMegaMenuOpen(prev => !prev)}
              aria-expanded={isMegaMenuOpen}`, 
    `              onClick={() => setIsMegaMenuOpen(prev => !prev)}
              aria-expanded={isMegaMenuOpen}
              aria-haspopup="menu"
              aria-controls="marketplace-category-mega"`,
    'Marketplace category aria'
  );

  source = replaceOnce(
    source,
    `        {isMegaMenuOpen && (
          <div style={megaBackground(categoriesRoot)} className={\`marketplace-ref-category-mega ${'${categoriesRoot?.megaMenu?.width === \'boxed\' ? \'is-boxed\' : \'is-full\'}'}\`}>`,
    `        {isMegaMenuOpen && (
          <div id="marketplace-category-mega" role="menu" aria-label="دسته‌بندی قطعات" style={megaBackground(categoriesRoot)} className={\`marketplace-ref-category-mega ${'${categoriesRoot?.megaMenu?.width === \'boxed\' ? \'is-boxed\' : \'is-full\'}'}\`}>`,
    'Marketplace mega role'
  );

  source = replaceOnce(
    source,
    `                      <button
                        type="button"
                        onClick={() => children.length ? setMarketplaceOpenMenuId(current => current === item.id ? null : item.id) : handleMenuClick(item)}
                      >`,
    `                      <button
                        type="button"
                        aria-haspopup={children.length ? 'menu' : undefined}
                        aria-expanded={children.length ? marketplaceOpenMenuId === item.id : undefined}
                        aria-controls={children.length ? \`desktop-menu-${'${item.id}'}\` : undefined}
                        onFocus={() => children.length && setMarketplaceOpenMenuId(item.id)}
                        onClick={() => children.length ? setMarketplaceOpenMenuId(current => current === item.id ? null : item.id) : handleMenuClick(item)}
                      >`,
    'Desktop nav aria controls'
  );

  source = source.replace(
    `<div className="marketplace-ref-submenu">\n                              {renderDesktopSubmenuTree(item.id)}\n                            </div>`,
    `<div id={\`desktop-menu-${'${item.id}'}\`} role="menu" className="marketplace-ref-submenu">\n                              {renderDesktopSubmenuTree(item.id)}\n                            </div>`
  );

  source = replaceOnce(
    source,
    `<div className="marketplace-ref-mobile-drawer">`,
    `<div className="marketplace-ref-mobile-drawer" role="dialog" aria-modal="true" aria-label="منوی سایت">`,
    'Mobile drawer dialog semantics'
  );

  source = source.replace(
    `<button type="button" className={marketplaceMobileTab === 'menu' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('menu')}>`,
    `<button type="button" role="tab" aria-selected={marketplaceMobileTab === 'menu'} aria-controls="mobile-menu-panel" tabIndex={marketplaceMobileTab === 'menu' ? 0 : -1} className={marketplaceMobileTab === 'menu' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('menu')}>`
  );
  source = source.replace(
    `<button type="button" className={marketplaceMobileTab === 'categories' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('categories')}>`,
    `<button type="button" role="tab" aria-selected={marketplaceMobileTab === 'categories'} aria-controls="mobile-categories-panel" tabIndex={marketplaceMobileTab === 'categories' ? 0 : -1} className={marketplaceMobileTab === 'categories' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('categories')}>`
  );
  source = source.replace(
    `<button type="button" className={marketplaceMobileTab === 'vehicle' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('vehicle')}>`,
    `<button type="button" role="tab" aria-selected={marketplaceMobileTab === 'vehicle'} aria-controls="mobile-vehicle-panel" tabIndex={marketplaceMobileTab === 'vehicle' ? 0 : -1} className={marketplaceMobileTab === 'vehicle' ? 'active' : ''} onClick={() => setMarketplaceMobileTab('vehicle')}>`
  );
  source = source.replace(
    `<div className="marketplace-ref-mobile-categories marketplace-ref-mobile-categories-tab">`,
    `<div id="mobile-categories-panel" role="tabpanel" className="marketplace-ref-mobile-categories marketplace-ref-mobile-categories-tab">`
  );
  source = source.replace(
    `<div className="marketplace-ref-mobile-links">`,
    `<div id="mobile-menu-panel" role="tabpanel" className="marketplace-ref-mobile-links">`
  );
  source = source.replace(
    `<div className="marketplace-ref-mobile-vehicle">`,
    `<div id="mobile-vehicle-panel" role="tabpanel" className="marketplace-ref-mobile-vehicle">`
  );

  source = replaceOnce(
    source,
    `                      className={\`py-3 px-3.5 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${'${\n                        isMegaMenuOpen ? \'text-red-600 bg-white shadow-xs font-bold\' : \'text-neutral-800 hover:text-red-600\'\n                      }'}\`}
                    >`,
    `                      className={\`py-3 px-3.5 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${'${\n                        isMegaMenuOpen ? \'text-red-600 bg-white shadow-xs font-bold\' : \'text-neutral-800 hover:text-red-600\'\n                      }'}\`}
                      aria-haspopup="menu"
                      aria-expanded={isMegaMenuOpen}
                      aria-controls="classic-category-mega"
                    >`,
    'Classic category aria trigger'
  );

  source = source.replace(
    `className="header-categories-mega absolute top-full right-0 w-[820px]`,
    `id="classic-category-mega" role="menu" aria-label="دسته‌بندی قطعات" className="header-categories-mega absolute top-full right-0 w-[820px]`
  );

  source = replaceOnce(
    source,
    `                      className={\`py-3 px-3 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${'${\n                        isBrandsMenuOpen ? \'text-red-600 bg-white shadow-xs font-bold\' : \'text-neutral-700 hover:text-red-600\'\n                      }'}\`}
                    >`,
    `                      className={\`py-3 px-3 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${'${\n                        isBrandsMenuOpen ? \'text-red-600 bg-white shadow-xs font-bold\' : \'text-neutral-700 hover:text-red-600\'\n                      }'}\`}
                      aria-haspopup="menu"
                      aria-expanded={isBrandsMenuOpen}
                      aria-controls="classic-brands-menu"
                    >`,
    'Classic brands aria trigger'
  );
  source = source.replace(
    `className="header-brands-menu absolute top-full right-0 w-72`,
    `id="classic-brands-menu" role="menu" aria-label="برندهای خودرو" className="header-brands-menu absolute top-full right-0 w-72`
  );
  return source;
});

edit('src/components/product/ProductCard.tsx', source => {
  source = source.replace(
    `            title="افزودن به علاقه‌مندی‌ها"\n          >`,
    `            title="افزودن به علاقه‌مندی‌ها"\n            aria-label="افزودن به علاقه‌مندی‌ها"\n          >`
  );
  source = source.replace(
    `            title="افزودن به مقایسه"\n          >`,
    `            title="افزودن به مقایسه"\n            aria-label="افزودن به مقایسه"\n          >`
  );
  source = replaceOnce(
    source,
    `            className="w-full h-full object-cover"
            loading="lazy"`,
    `            className="w-full h-full object-cover"
            width="640"
            height="480"
            loading="lazy"
            decoding="async"`,
    'Product card image dimensions'
  );
  return source;
});

edit('server.ts', source => {
  source = replaceOnce(
    source,
    `    app.use(express.static(distPath, {
      maxAge: '1h',
      etag: true,
      index: false
    }));`,
    `    app.use(express.static(distPath, {
      maxAge: '1h',
      etag: true,
      index: false,
      setHeaders(res, filePath) {
        const normalized = filePath.replace(/\\\\/g, '/');
        if (/\\/assets\\/(?:public-chunks\\/|.*-[A-Za-z0-9_-]{8,}\\.(?:js|css|woff2?|png|jpe?g|webp|svg)$)/.test(normalized)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));`,
    'Immutable hashed asset cache'
  );
  return source;
});

edit('src/index.css', source => {
  if (source.includes('/* v30.10.6 accessibility/performance */')) return source;
  return source + `

/* v30.10.6 accessibility/performance */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--primary-color, #dc2626);
  outline-offset: 2px;
}

[role="listbox"] [role="option"][aria-selected="true"] {
  scroll-margin-block: 8px;
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within { scroll-behavior: auto !important; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
});

const required = [
  ['src/App.tsx', "const AdminView = lazy(() => import('./components/admin/AdminView')"],
  ['src/App.tsx', 'ensureSiteFontLoaded(settings.fontFamily'],
  ['src/App.tsx', '<Suspense fallback={<RouteLoading />}'],
  ['src/components/search/SearchAutocomplete.tsx', 'role="combobox"'],
  ['src/components/search/SearchAutocomplete.tsx', "event.key === 'ArrowDown'"],
  ['src/components/search/SearchAutocomplete.tsx', 'role="listbox"'],
  ['src/components/layout/Header.tsx', 'marketplace-category-mega'],
  ['src/components/layout/Header.tsx', 'aria-modal="true"'],
  ['src/components/layout/Header.tsx', "event.key !== 'Escape'"],
  ['src/components/product/ProductCard.tsx', 'decoding="async"'],
  ['server.ts', 'max-age=31536000, immutable'],
  ['src/index.css', 'v30.10.6 accessibility/performance']
];
for (const [file, marker] of required) {
  if (!read(file).includes(marker)) throw new Error(`v30.10.6 performance preparation incomplete: ${file} :: ${marker}`);
}

console.log(changed.length
  ? `v30.10.6 stage 7 performance/UX/accessibility applied: ${changed.join(', ')}`
  : 'v30.10.6 stage 7 performance/UX/accessibility already satisfied.');
