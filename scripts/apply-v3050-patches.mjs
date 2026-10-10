import fs from 'node:fs';

const changed = [];

const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`v30.5.0 patch target missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const replaceRegexOnce = (source, regex, replacement, marker, label) => {
  if (marker && source.includes(marker)) return source;
  let count = 0;
  const result = source.replace(regex, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count !== 1) throw new Error(`v30.5.0 patch expected exactly one ${label}, got ${count}`);
  return result;
};

// ---------------------------------------------------------------------------
// Public SSR store: restore authenticated admin session after hydration and
// make adding a vehicle also activate it, matching the main StoreContext.
// ---------------------------------------------------------------------------
edit('src/server/ssr-store-context.tsx', source => {
  source = replaceOnce(
    source,
    "import type { CartItem, GarageCar, Product, SiteSettings } from '../types';\n",
    "import type { CartItem, GarageCar, Product, SiteSettings } from '../types';\nimport { apiRequest } from '../api/client';\n",
    'SSR apiRequest import'
  );
  source = replaceOnce(
    source,
    "  const [isLiveEditActive, setIsLiveEditActive] = useState(false);\n  const [toast, setToast] = useState<any>(null);\n",
    "  const [isLiveEditActive, setIsLiveEditActive] = useState(false);\n  const [toast, setToast] = useState<any>(null);\n  const [adminAuth, setAdminAuth] = useState<any>({ isAuthenticated: false, username: '', isMustChangePassword: false });\n",
    'SSR admin state'
  );
  source = replaceOnce(
    source,
    "  useEffect(() => {\n    setSelectedVehicle(safeRead<GarageCar | null>('chinpart_selected_car', null));\n    setGarage(safeRead<GarageCar[]>('chinpart_garage', []));\n    setCart(safeRead<CartItem[]>('chinpart_cart', []));\n    setWishlist(safeRead<string[]>('chinpart_wishlist', []));\n  }, []);\n",
    "  useEffect(() => {\n    setSelectedVehicle(safeRead<GarageCar | null>('chinpart_selected_car', null));\n    setGarage(safeRead<GarageCar[]>('chinpart_garage', []));\n    setCart(safeRead<CartItem[]>('chinpart_cart', []));\n    setWishlist(safeRead<string[]>('chinpart_wishlist', []));\n  }, []);\n\n  // Public SSR starts logged-out to keep server/client markup identical. After\n  // hydration, restore the HttpOnly admin session so admin-only edit controls\n  // reappear without leaking credentials into the server bootstrap payload.\n  useEffect(() => {\n    let cancelled = false;\n    void apiRequest<any>('/api/auth/me')\n      .then(session => {\n        if (cancelled || session?.role !== 'admin' || !session?.admin) return;\n        setAdminAuth({\n          isAuthenticated: true,\n          username: session.admin.username || '',\n          currentUser: session.admin,\n          isMustChangePassword: false\n        });\n      })\n      .catch(() => undefined);\n    return () => { cancelled = true; };\n  }, []);\n",
    'SSR auth restore effect'
  );
  source = replaceOnce(
    source,
    "  const addToGarage = (car: any) => setGarage(current => [...current, { ...car, id: car.id || `garage-${Date.now()}`, addedAt: car.addedAt || new Date().toISOString() }]);\n",
    "  const addToGarage = (car: any) => {\n    const newCar = { ...car, id: car.id || `garage-${Date.now()}`, addedAt: car.addedAt || new Date().toISOString() };\n    setGarage(current => [newCar, ...current.filter(item => !(item.modelId === newCar.modelId && item.year === newCar.year))]);\n    setSelectedVehicle(newCar);\n  };\n",
    'SSR addToGarage activates vehicle'
  );
  source = replaceOnce(
    source,
    "    adminAuth: { isAuthenticated: false, username: '', isMustChangePassword: false },\n",
    "    adminAuth,\n",
    'SSR adminAuth value'
  );
  source = replaceOnce(
    source,
    "    adminLogout: noop,\n",
    "    adminLogout: () => setAdminAuth({ isAuthenticated: false, username: '', isMustChangePassword: false }),\n",
    'SSR admin logout'
  );
  source = replaceOnce(
    source,
    "paymentGateways, selectedVehicle, garage, cart, cartCount, cartTotal, wishlist, compareList, isLiveEditActive, toast]);",
    "paymentGateways, selectedVehicle, garage, cart, cartCount, cartTotal, wishlist, compareList, isLiveEditActive, toast, adminAuth]);",
    'SSR adminAuth dependency'
  );
  return source;
});

// ---------------------------------------------------------------------------
// Public storefront: real vehicle modal + authenticated edit-current-page
// shortcut. The modal is closed during SSR, so JS-off markup remains stable.
// ---------------------------------------------------------------------------
edit('src/server/public-storefront-react.tsx', source => {
  source = replaceOnce(source, "import React from 'react';\n", "import React, { useState } from 'react';\n", 'public React useState');
  source = replaceOnce(
    source,
    "import { PageView } from '../components/page/PageView';\n",
    "import { PageView } from '../components/page/PageView';\nimport { VehicleSelectorModal } from '../components/vehicle/VehicleSelectorModal';\n",
    'vehicle modal import'
  );
  source = replaceOnce(
    source,
    "import { SsrStoreProvider, type PublicStorefrontBootstrap } from './ssr-store-context';\n",
    "import { SsrStoreProvider, useStore, type PublicStorefrontBootstrap } from './ssr-store-context';\n",
    'public useStore import'
  );
  source = replaceOnce(
    source,
    "const PublicRouteView: React.FC<{ pathname: string; onNavigate: Navigate }> = ({ pathname, onNavigate }) => {\n  const route = parseRoutePath(pathname);\n  const openVehicle = () => onNavigate('shop');\n",
    "const PublicRouteView: React.FC<{ pathname: string; onNavigate: Navigate; onOpenVehicleModal: () => void }> = ({ pathname, onNavigate, onOpenVehicleModal }) => {\n  const route = parseRoutePath(pathname);\n  const openVehicle = onOpenVehicleModal;\n",
    'route vehicle modal callback'
  );

  const oldStorefront = `export const PublicStorefront: React.FC<{ payload: PublicPayload; pathname?: string }> = ({ payload, pathname }) => {\n  const path = pathname || payload.path || '/';\n  const route = parseRoutePath(path);\n  const navigate = browserNavigate;\n  return (\n    <SsrStoreProvider bootstrap={payload.bootstrap}>\n      <div className="min-h-screen bg-[var(--site-bg)] text-[var(--text-color)] flex flex-col" dir="rtl">\n        <Header\n          onOpenVehicleModal={() => navigate('shop')}\n          onOpenCartDrawer={() => navigate('cart')}\n          onNavigate={navigate}\n          currentView={route.view}\n          currentParam={route.param}\n          onOpenAuthModal={() => navigate('account')}\n          onOpenAiSearch={() => navigate('shop')}\n        />\n        <main className="flex-1">\n          <PublicRouteView pathname={path} onNavigate={navigate} />\n        </main>\n        <Footer onNavigate={navigate} onOpenAuthModal={() => navigate('account')} />\n        <MobileBottomNav\n          currentView={route.view}\n          onNavigate={view => navigate(view)}\n          onOpenVehicleModal={() => navigate('shop')}\n          onOpenCartDrawer={() => navigate('cart')}\n          onOpenAuthModal={() => navigate('account')}\n        />\n      </div>\n    </SsrStoreProvider>\n  );\n};`;

  const newStorefront = `const adminEditUrl = (view: string, param?: string): string => {\n  const query = new URLSearchParams();\n  if (view === 'car-brand') { query.set('tab', 'cars'); query.set('sub', 'brands'); if (param) query.set('brand', param); }\n  else if (view === 'car-model') { query.set('tab', 'cars'); query.set('sub', 'models'); if (param) query.set('model', param); }\n  else if (view === 'product' || view === 'shop') { query.set('tab', 'products'); if (param) query.set('product', param); }\n  else if (view === 'category') { query.set('tab', 'categories'); if (param) query.set('category', param); }\n  else if (view === 'article' || view === 'blog') { query.set('tab', 'articles'); if (param) query.set('article', param); }\n  else if (view === 'home') { query.set('tab', 'pages'); query.set('page', 'home'); }\n  else { query.set('tab', 'pages'); if (param) query.set('page', param); else if (view) query.set('page', view); }\n  return '/admin?' + query.toString();\n};\n\nconst PublicStorefrontChrome: React.FC<{ payload: PublicPayload; path: string }> = ({ payload, path }) => {\n  const route = parseRoutePath(path);\n  const navigate = browserNavigate;\n  const { adminAuth } = useStore();\n  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);\n  const openVehicle = () => setIsVehicleModalOpen(true);\n\n  return (\n    <>\n      <div className="min-h-screen bg-[var(--site-bg)] text-[var(--text-color)] flex flex-col" dir="rtl">\n        <Header\n          onOpenVehicleModal={openVehicle}\n          onOpenCartDrawer={() => navigate('cart')}\n          onNavigate={navigate}\n          currentView={route.view}\n          currentParam={route.param}\n          onOpenAuthModal={() => navigate('account')}\n          onOpenAiSearch={() => navigate('shop')}\n        />\n        <main className="flex-1">\n          <PublicRouteView pathname={path} onNavigate={navigate} onOpenVehicleModal={openVehicle} />\n        </main>\n        <Footer onNavigate={navigate} onOpenAuthModal={() => navigate('account')} />\n        <MobileBottomNav\n          currentView={route.view}\n          onNavigate={view => navigate(view)}\n          onOpenVehicleModal={openVehicle}\n          onOpenCartDrawer={() => navigate('cart')}\n          onOpenAuthModal={() => navigate('account')}\n        />\n      </div>\n      <VehicleSelectorModal\n        isOpen={isVehicleModalOpen}\n        onClose={() => setIsVehicleModalOpen(false)}\n        onVehicleSelected={() => setIsVehicleModalOpen(false)}\n      />\n      {adminAuth?.isAuthenticated && (\n        <a\n          href={adminEditUrl(route.view, route.param)}\n          className="fixed left-4 bottom-24 md:bottom-5 z-[190] inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-neutral-950 shadow-xl hover:bg-amber-400"\n          data-admin-edit-current-page="1"\n        >\n          ویرایش همین صفحه\n        </a>\n      )}\n    </>\n  );\n};\n\nexport const PublicStorefront: React.FC<{ payload: PublicPayload; pathname?: string }> = ({ payload, pathname }) => {\n  const path = pathname || payload.path || '/';\n  return (\n    <SsrStoreProvider bootstrap={payload.bootstrap}>\n      <PublicStorefrontChrome payload={payload} path={path} />\n    </SsrStoreProvider>\n  );\n};`;
  source = replaceOnce(source, oldStorefront, newStorefront, 'public storefront chrome');
  return source;
});

// ---------------------------------------------------------------------------
// Admin deep-linking: /admin?tab=... opens the relevant editor section.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminView.tsx', source => {
  source = replaceOnce(
    source,
    "  >('overview');",
    "  >(() => {\n    if (typeof window === 'undefined') return 'overview';\n    const candidate = new URLSearchParams(window.location.search).get('tab') || '';\n    const allowed = new Set(['overview','cars','products','categories','menus_attrs','footer','pages','articles','sliders','orders','customers','admins','gateways','sandbox','apis','theme','bulk','analytics']);\n    return (allowed.has(candidate) ? candidate : 'overview') as any;\n  });",
    'AdminView query tab initializer'
  );
  return source;
});

// ---------------------------------------------------------------------------
// Brand admin: FAQ editing + deep-link opening for exact brand/model.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminCarsTab.tsx', source => {
  source = replaceOnce(source, "import React, { useState } from 'react';", "import React, { useEffect, useState } from 'react';", 'AdminCars useEffect');
  source = replaceOnce(
    source,
    "    bottomDescription: '',\n    seo: undefined\n",
    "    bottomDescription: '',\n    faq: [],\n    seo: undefined\n",
    'brand form faq default'
  );
  source = replaceOnce(
    source,
    "      bottomDescription: '',\n      seo: undefined\n",
    "      bottomDescription: '',\n      faq: [],\n      seo: undefined\n",
    'new brand faq default'
  );
  source = replaceOnce(source, "        faq: []\n      };", "        faq: brandForm.faq || []\n      };", 'persist new brand FAQ');

  const bottomBlock = `              <div>\n                <label className="block text-neutral-700 font-bold mb-1">محتوای کامل پایین صفحه برند:</label>\n                <textarea\n                  rows={6}\n                  value={brandForm.bottomDescription || ''}\n                  onChange={e => setBrandForm({ ...brandForm, bottomDescription: e.target.value })}\n                  placeholder="راهنمای خرید، توضیحات تخصصی و محتوای سئویی که بعد از محصولات نمایش داده می‌شود..."\n                  className="w-full p-2.5 border border-neutral-300 rounded-xl"\n                />\n              </div>\n`;
  const bottomPlusFaq = bottomBlock + `\n              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">\n                <div className="flex items-center justify-between gap-3">\n                  <div>\n                    <label className="block text-neutral-800 font-black">سؤالات متداول صفحه برند</label>\n                    <p className="text-[10px] text-neutral-500 mt-1">این بخش بعد از «راهنمای قطعات و خدمات» در پایین صفحه برند نمایش داده می‌شود.</p>\n                  </div>\n                  <button\n                    type="button"\n                    onClick={() => setBrandForm({ ...brandForm, faq: [...(brandForm.faq || []), { q: '', a: '' }] })}\n                    className="px-3 py-2 rounded-xl bg-neutral-900 text-white font-bold flex items-center gap-1"\n                  >\n                    <Plus className="w-3.5 h-3.5" /> افزودن سؤال\n                  </button>\n                </div>\n                {(brandForm.faq || []).length === 0 && (\n                  <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-[10px] text-neutral-500">هنوز سؤال متداولی برای این برند ثبت نشده است.</div>\n                )}\n                {(brandForm.faq || []).map((faq, index) => (\n                  <div key={index} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">\n                    <div className="flex gap-2 items-start">\n                      <input\n                        value={faq.q}\n                        onChange={e => setBrandForm({ ...brandForm, faq: (brandForm.faq || []).map((item, i) => i === index ? { ...item, q: e.target.value } : item) })}\n                        placeholder="سؤال متداول"\n                        className="flex-1 p-2.5 border border-neutral-300 rounded-xl font-bold"\n                      />\n                      <button\n                        type="button"\n                        onClick={() => setBrandForm({ ...brandForm, faq: (brandForm.faq || []).filter((_, i) => i !== index) })}\n                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"\n                        title="حذف سؤال"\n                      >\n                        <Trash2 className="w-4 h-4" />\n                      </button>\n                    </div>\n                    <textarea\n                      rows={3}\n                      value={faq.a}\n                      onChange={e => setBrandForm({ ...brandForm, faq: (brandForm.faq || []).map((item, i) => i === index ? { ...item, a: e.target.value } : item) })}\n                      placeholder="پاسخ سؤال"\n                      className="w-full p-2.5 border border-neutral-300 rounded-xl"\n                    />\n                  </div>\n                ))}\n              </div>\n`;
  source = replaceOnce(source, bottomBlock, bottomPlusFaq, 'brand FAQ editor');

  const deleteModelBlock = `  const handleDeleteModel = (id: string, name: string) => {\n    if (confirm(\`آیا از حذف مدل خودرو "\${name}" از سیستم اطمینان دارید؟\`)) {\n      deleteModel(id);\n    }\n  };\n`;
  const deepLinkEffect = deleteModelBlock + `\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    const params = new URLSearchParams(window.location.search);\n    const brandTarget = params.get('brand');\n    const modelTarget = params.get('model');\n    if (brandTarget) {\n      setActiveSubTab('brands');\n      const target = brands.find(item => item.id === brandTarget || item.slug === brandTarget);\n      if (target && editingBrand?.id !== target.id) handleEditBrand(target);\n      return;\n    }\n    if (modelTarget) {\n      setActiveSubTab('models');\n      const target = models.find(item => item.id === modelTarget || item.slug === modelTarget);\n      if (target && editingModel?.id !== target.id) handleEditModel(target);\n    }\n  // Deep-link target is intentionally evaluated when vehicle data first arrives.\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [brands.length, models.length]);\n`;
  source = replaceOnce(source, deleteModelBlock, deepLinkEffect, 'AdminCars exact deep link');
  return source;
});

// ---------------------------------------------------------------------------
// Brand page: guide first, FAQ after it as requested.
// ---------------------------------------------------------------------------
edit('src/components/brand/BrandDetailView.tsx', source => {
  if (source.includes('data-brand-faq-after-guide="1"')) return source;
  const regex = /(        \{\/\* Brand FAQ \*\/\}[\s\S]*?        \)\}\n\n)(        \{brand\.bottomDescription && \([\s\S]*?        \)\}\n)/;
  const match = source.match(regex);
  if (!match) throw new Error('v30.5.0 patch target missing: brand FAQ/guide order');
  const faq = match[1].replace('{/* Brand FAQ */}', '{/* Brand FAQ */}<span data-brand-faq-after-guide="1" className="hidden" />');
  return source.replace(regex, match[2] + '\n' + faq);
});

// ---------------------------------------------------------------------------
// Footer copyright editor becomes rich text, so colors/links/styles survive.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminFooterTab.tsx', source => {
  const oldField = `            <div className="pt-2">\n              <label className="block text-neutral-700 font-bold mb-1">متن کپی‌رایت انتهای فوتر:</label>\n              <input\n                type="text"\n                value={footerCopyrightText}\n                onChange={e => setFooterCopyrightText(e.target.value)}\n                className="w-full p-2.5 border border-neutral-300 rounded-xl"\n                placeholder="مثال: تمامی حقوق برای چین‌پارت محفوظ است..."\n              />\n            </div>\n`;
  const newField = `            <div className="pt-2" data-rich-copyright-editor="1">\n              <RichTextEditor\n                label="متن کپی‌رایت انتهای فوتر"\n                value={footerCopyrightText}\n                onChange={setFooterCopyrightText}\n                rows={4}\n                placeholder="متن کپی‌رایت را بنویسید؛ رنگ، لینک، ضخامت، زیرخط و چینش قابل تنظیم است..."\n                helperText="استایل و رنگ انتخاب‌شده دقیقاً در فوتر فروشگاه نمایش داده می‌شود."\n              />\n            </div>\n`;
  return replaceOnce(source, oldField, newField, 'rich copyright editor');
});

// ---------------------------------------------------------------------------
// Admin pages deep-link to the requested system page.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminPagesTab.tsx', source => {
  source = replaceOnce(source, "import React, { useState } from 'react';", "import React, { useEffect, useState } from 'react';", 'AdminPages useEffect');
  source = replaceOnce(
    source,
    "  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page-home');\n",
    "  const requestedPageSlug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') : null;\n  const [selectedPageId, setSelectedPageId] = useState<string>(() => pages.find(page => page.slug === requestedPageSlug)?.id || pages[0]?.id || 'page-home');\n  useEffect(() => {\n    if (!requestedPageSlug) return;\n    const target = pages.find(page => page.slug === requestedPageSlug);\n    if (target) setSelectedPageId(target.id);\n  }, [pages, requestedPageSlug]);\n",
    'AdminPages exact page deep link'
  );
  return source;
});

// ---------------------------------------------------------------------------
// Part request system page: every visible string/form field is backed by an
// editable page-builder section/item, including success state.
// ---------------------------------------------------------------------------
edit('src/context/StoreContext.tsx', source => {
  const oldFormDefault = "  { id: 'request-form', sectionKey: 'request-form', title: 'فرم استعلام قطعه', subtitle: 'اطلاعات خودرو، قطعه و راه ارتباطی را وارد کنید.', isVisible: true, order: 2, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 },";
  const newFormDefault = `  { id: 'request-form', sectionKey: 'request-form', title: 'فرم استعلام قطعه', subtitle: 'اطلاعات خودرو، قطعه و راه ارتباطی را وارد کنید.', isVisible: true, order: 2, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20, items: [\n    { id: 'field-brand', title: 'برند خودرو *', content: 'انتخاب برند خودرو', isVisible: true, order: 1 },\n    { id: 'field-model', title: 'مدل دقیق خودرو *', content: 'مثال: KMC J7، تیگو ۸ پرو، لاماری', isVisible: true, order: 2 },\n    { id: 'field-year', title: 'سال ساخت خودرو', content: 'مثال: ۱۴۰۲ یا ۲۰۲۳', isVisible: true, order: 3 },\n    { id: 'field-part', title: 'نام قطعه مورد نظر یا شرح نیاز *', content: 'مثال: قاب آینه بغل راست، کمپرسور کولر، رادار نقطه کور...', isVisible: true, order: 4 },\n    { id: 'field-oem', title: 'شماره فنی یا پارت‌نامبر OEM (در صورت وجود)', content: 'مثال: 1026040GH010', isVisible: true, order: 5 },\n    { id: 'field-vin', title: 'شماره شاسی خودرو VIN (۱۷ رقمی)', content: 'روی کارت خودرو درج شده است', isVisible: true, order: 6 },\n    { id: 'field-image', title: 'تصویر قطعه یا قطعه معیوب (اختیاری)', content: 'برای پیوست عکس قطعه، نمونه یا کارت خودرو کلیک نمایید', subtitle: '✓ تصویر قطعه بارگذاری شد (برای حذف کلیک کنید)', isVisible: true, order: 7 },\n    { id: 'field-name', title: 'نام و نام خانوادگی متقاضی *', content: 'نام کامل', isVisible: true, order: 8 },\n    { id: 'field-phone', title: 'شماره تلفن همراه جهت تماس کارشناس *', content: '۰۹۱۲...', isVisible: true, order: 9 },\n    { id: 'field-notes', title: 'توضیحات تکمیلی', content: 'هرگونه توضیح درباره رنگ، سمت چپ یا راست، شرکتی یا وارداتی بودن...', isVisible: true, order: 10 },\n    { id: 'field-submit', title: 'ارسال درخواست استعلام به واحد تامین', isVisible: true, order: 11 }\n  ] },`;
  source = replaceOnce(source, oldFormDefault, newFormDefault, 'part request form defaults');
  source = replaceOnce(
    source,
    "  { id: 'request-contact', sectionKey: 'request-contact', title: 'نیاز به استعلام تلفنی فوری دارید؟', subtitle: 'شماره تماس این بخش را از Page Builder تغییر دهید.', buttonText: 'تماس با واحد تامین', buttonLink: 'tel:02100000000', isVisible: true, order: 4, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 }\n];",
    "  { id: 'request-contact', sectionKey: 'request-contact', title: 'نیاز به استعلام تلفنی فوری دارید؟', subtitle: 'شماره تماس این بخش را از Page Builder تغییر دهید.', buttonText: 'تماس با واحد تامین', buttonLink: 'tel:02100000000', isVisible: true, order: 4, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 },\n  { id: 'request-success', sectionKey: 'request-success', title: 'درخواست استعلام شما با موفقیت ثبت گردید', subtitle: 'اطلاعات برای واحد فنی ارسال شد و نتیجه از طریق تماس یا پیامک اعلام خواهد شد.', buttonText: 'ثبت درخواست دیگر', buttonLink: 'بازگشت به فروشگاه', isVisible: true, order: 5, layout: 'boxed', desktopColumns: 1, mobileColumns: 1, borderRadiusPx: 20 }\n];",
    'part request success default'
  );
  source = replaceOnce(
    source,
    "    if (page.slug === 'part-request') return mergeSystemSections(page, PART_REQUEST_SECTION_DEFAULTS);",
    `    if (page.slug === 'part-request') {\n      const merged = mergeSystemSections(page, PART_REQUEST_SECTION_DEFAULTS);\n      return {\n        ...merged,\n        sections: merged.sections.map(section => {\n          const defaults = PART_REQUEST_SECTION_DEFAULTS.find(item => item.sectionKey === section.sectionKey);\n          if (!defaults) return section;\n          const existingItems = section.items || [];\n          const existingIds = new Set(existingItems.map(item => item.id));\n          const missingItems = (defaults.items || []).filter(item => !existingIds.has(item.id));\n          return { ...defaults, ...section, items: [...existingItems, ...missingItems] };\n        })\n      };\n    }`,
    'part request default item merge'
  );
  return source;
});

edit('src/components/parts/PartRequestView.tsx', source => {
  source = replaceOnce(
    source,
    "  const { brands, models, submitPartRequest, selectedVehicle, pages, settings } = useStore();",
    "  const { brands, models, submitPartRequest, selectedVehicle, pages, settings, adminAuth } = useStore();",
    'part request adminAuth'
  );
  source = replaceOnce(
    source,
    "  const requestPage = pages.find(page => page.slug === 'part-request');\n  const section = (key: string) => requestPage?.sections.find(item => item.sectionKey === key);\n",
    "  const requestPage = pages.find(page => page.slug === 'part-request');\n  const section = (key: string) => requestPage?.sections.find(item => item.sectionKey === key);\n  const formSection = section('request-form');\n  const successSection = section('request-success');\n  const formItem = (id: string) => formSection?.items?.find(item => item.id === id);\n  const fieldTitle = (id: string, fallback: string) => formItem(id)?.title || fallback;\n  const fieldPlaceholder = (id: string, fallback: string) => formItem(id)?.content || fallback;\n",
    'part request editable helpers'
  );
  source = replaceOnce(
    source,
    "    if (!item) return {};\n    return {",
    "    if (!item) return {};\n    if (item.isVisible === false) return { display: 'none' };\n    return {",
    'part request hidden section style'
  );
  source = replaceOnce(
    source,
    "    <div className=\"max-w-4xl mx-auto px-4 py-10 space-y-8\">\n      {/* Header */}",
    "    <div className=\"max-w-4xl mx-auto px-4 py-10 space-y-8\">\n      {adminAuth?.isAuthenticated && (\n        <div className=\"flex justify-end\">\n          <a href=\"/admin?tab=pages&page=part-request\" className=\"inline-flex items-center rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-neutral-950 shadow-md hover:bg-amber-400\">ویرایش همین صفحه</a>\n        </div>\n      )}\n      {/* Header */}",
    'part request admin edit shortcut'
  );
  source = replaceOnce(
    source,
    "          <h2 className=\"text-xl font-black text-neutral-900\">درخواست استعلام شما با موفقیت ثبت گردید</h2>\n          <p className=\"text-xs text-neutral-600 max-w-md mx-auto leading-relaxed\">\n            اطلاعات برای دپارتمان فنی ارسال شد. کارشناسان ما حداکثر ظرف مدت ۲ ساعت کاری از طریق تماس یا پیامک نتیجه استعلام موجودی و قیمت را به شماره <strong className=\"font-mono\">{phoneNumber}</strong> اطلاع خواهند داد.\n          </p>",
    "          <h2 className=\"text-xl font-black text-neutral-900\">{successSection?.title || 'درخواست استعلام شما با موفقیت ثبت گردید'}</h2>\n          <p className=\"text-xs text-neutral-600 max-w-md mx-auto leading-relaxed\">\n            {successSection?.subtitle || 'اطلاعات برای واحد فنی ارسال شد و نتیجه از طریق تماس یا پیامک اعلام خواهد شد.'} <strong className=\"font-mono\">{phoneNumber}</strong>\n          </p>",
    'part request success copy'
  );
  source = replaceOnce(source, "              ثبت درخواست دیگر", "              {successSection?.buttonText || 'ثبت درخواست دیگر'}", 'success reset button');
  source = replaceOnce(source, "              بازگشت به فروشگاه", "              {successSection?.buttonLink || 'بازگشت به فروشگاه'}", 'success home button');
  source = replaceOnce(
    source,
    "            <form onSubmit={handleSubmit} className=\"space-y-4\">",
    "            <form onSubmit={handleSubmit} className=\"space-y-4\">\n              {(formSection?.title || formSection?.subtitle) && (\n                <div className=\"pb-2\">\n                  {formSection?.title && <h2 className=\"text-base font-black text-neutral-900\">{formSection.title}</h2>}\n                  {formSection?.subtitle && <p className=\"text-xs text-neutral-500 mt-1\">{formSection.subtitle}</p>}\n                </div>\n              )}",
    'part request form heading'
  );

  const replacements = [
    ['برند خودرو *', "{fieldTitle('field-brand', 'برند خودرو *')}"],
    ['مدل دقیق خودرو *', "{fieldTitle('field-model', 'مدل دقیق خودرو *')}"],
    ['placeholder=\"مثال: KMC J7، تیگو ۸ پرو، لاماری\"', "placeholder={fieldPlaceholder('field-model', 'مثال: KMC J7، تیگو ۸ پرو، لاماری')}"],
    ['سال ساخت خودرو', "{fieldTitle('field-year', 'سال ساخت خودرو')}"],
    ['placeholder=\"مثال: 1402 یا 2023\"', "placeholder={fieldPlaceholder('field-year', 'مثال: ۱۴۰۲ یا ۲۰۲۳')}"],
    ['نام قطعه مورد نظر یا شرح نیاز *', "{fieldTitle('field-part', 'نام قطعه مورد نظر یا شرح نیاز *')}"],
    ['placeholder=\"مثال: قاب آینه بغل راست کربنی، کمپرسور کولر، رادار نقطه کور...\"', "placeholder={fieldPlaceholder('field-part', 'مثال: قاب آینه بغل راست، کمپرسور کولر، رادار نقطه کور...')}"],
    ['شماره فنی یا پارت‌نامبر OEM (در صورت وجود)', "{fieldTitle('field-oem', 'شماره فنی یا پارت‌نامبر OEM (در صورت وجود)')}"],
    ['placeholder=\"مثال: 1026040GH010\"', "placeholder={fieldPlaceholder('field-oem', 'مثال: 1026040GH010')}"],
    ['شماره شاسی خودرو VIN (۱۷ رقمی)', "{fieldTitle('field-vin', 'شماره شاسی خودرو VIN (۱۷ رقمی)')}"],
    ['placeholder=\"روی کارت خودرو درج شده است\"', "placeholder={fieldPlaceholder('field-vin', 'روی کارت خودرو درج شده است')}"],
    ['تصویر قطعه یا قطعه معیوب (اختیاری):', "{fieldTitle('field-image', 'تصویر قطعه یا قطعه معیوب (اختیاری)')}"],
    ["{imageAttached ? '✓ تصویر فرضی قطعه بارگذاری شد (برای حذف کلیک کنید)' : 'برای پیوست عکس قطعه، نمونه یا کارت خودرو کلیک نمایید'}", "{imageAttached ? (formItem('field-image')?.subtitle || '✓ تصویر قطعه بارگذاری شد (برای حذف کلیک کنید)') : fieldPlaceholder('field-image', 'برای پیوست عکس قطعه، نمونه یا کارت خودرو کلیک نمایید')}"],
    ['نام و نام خانوادگی متقاضی *', "{fieldTitle('field-name', 'نام و نام خانوادگی متقاضی *')}"],
    ['placeholder=\"نام کامل\"', "placeholder={fieldPlaceholder('field-name', 'نام کامل')}"],
    ['شماره تلفن همراه جهت تماس کارشناس *', "{fieldTitle('field-phone', 'شماره تلفن همراه جهت تماس کارشناس *')}"],
    ['placeholder=\"0912...\"', "placeholder={fieldPlaceholder('field-phone', '۰۹۱۲...')}"],
    ['توضیحات تکمیلی:', "{fieldTitle('field-notes', 'توضیحات تکمیلی')}"],
    ['placeholder=\"هرگونه توضیحات در مورد رنگ، نوع سمت چپ یا راست، شرکتی یا وارداتی بودن...\"', "placeholder={fieldPlaceholder('field-notes', 'هرگونه توضیح درباره رنگ، سمت چپ یا راست، شرکتی یا وارداتی بودن...')}"],
    ['<span>ارسال درخواست استعلام به واحد تامین</span>', "<span>{fieldTitle('field-submit', 'ارسال درخواست استعلام به واحد تامین')}</span>"]
  ];
  for (const [before, after] of replacements) source = replaceOnce(source, before, after, `part request field: ${before.slice(0, 24)}`);
  return source;
});

// ---------------------------------------------------------------------------
// Verify the expected user-facing fixes exist after the source migration.
// ---------------------------------------------------------------------------
const assertions = [
  ['src/server/public-storefront-react.tsx', 'data-admin-edit-current-page="1"'],
  ['src/server/public-storefront-react.tsx', '<VehicleSelectorModal'],
  ['src/server/ssr-store-context.tsx', "apiRequest<any>('/api/auth/me')"],
  ['src/components/admin/AdminFooterTab.tsx', 'data-rich-copyright-editor="1"'],
  ['src/components/admin/AdminCarsTab.tsx', 'سؤالات متداول صفحه برند'],
  ['src/components/brand/BrandDetailView.tsx', 'data-brand-faq-after-guide="1"'],
  ['src/components/parts/PartRequestView.tsx', "fieldTitle('field-submit'"],
  ['src/context/StoreContext.tsx', "sectionKey: 'request-success'"]
];
for (const [path, marker] of assertions) {
  if (!fs.readFileSync(path, 'utf8').includes(marker)) throw new Error(`v30.5.0 verification failed: ${path} missing ${marker}`);
}

console.log(`v30.5.0 source migration OK${changed.length ? `; patched ${changed.length} files` : '; already applied'}.`);
