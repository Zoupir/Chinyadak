import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const v3051Checks = [
  ['src/utils/navigation.ts', "if (view === 'admin') return param ? `/admin/${encodeURIComponent(param)}` : '/admin';"],
  ['src/components/admin/AdminView.tsx', 'const resolvedTarget = (() => {'],
  ['src/components/layout/Footer.tsx', 'className="footer-copyright-rich"'],
  ['src/server/ssr-store-context.tsx', 'const removeFromGarage = (id: string) => {']
];

const v3052Checks = [
  ['src/types/index.ts', 'footerCopyrightPosition?:'],
  ['src/components/admin/AdminFooterTab.tsx', 'جایگاه کپی‌رایت در عرض فوتر'],
  ['src/components/layout/Footer.tsx', 'marketplace-ref-footer-copyright-row'],
  ['src/index.css', 'v30.5.2 — copyright placement and media controls']
];

const v3053Checks = [
  ['src/components/common/RichTextEditor.tsx', 'data-rich-editor-version="30.5.3"'],
  ['src/components/common/RichTextComposer.tsx', "name: 'richAudio'"],
  ['src/utils/richText.ts', "'IMG', 'AUDIO', 'VIDEO'"],
  ['src/components/common/RichTextEditorEnhancements.css', 'v30.5.3 — rich editor source/media and bold-color fidelity']
];

const v3060Checks = [
  ['src/types/index.ts', 'export interface PartBrand {'],
  ['src/context/StoreContext.tsx', 'const [partBrands, setPartBrands]'],
  ['src/components/admin/ProductClassificationFields.tsx', 'برندهای سازنده قطعه'],
  ['src/components/admin/AdminView.tsx', "id: 'part_brands'"],
  ['src/App.tsx', '<PartBrandDetailView'],
  ['src/server/public-storefront-react.tsx', '<PartBrandDetailView'],
  ['src/server/storefront-html.ts', "entity.type === 'part_brand'"],
  ['src/server/seo/platform.ts', "type === 'part_brand'"],
  ['src/server/seo.ts', "'part-brands': { entityType: 'part_brand'"],
  ['src/components/common/RichTextComposer.tsx', "name: 'richEmbed'"],
  ['src/utils/richText.ts', 'export const safeRichEmbedSrc'],
  ['server.ts', "app.use('/api/rich-media', richMediaRouter)"]
];

const v3070Checks = [
  ['src/types/index.ts', 'export interface ProductLabelDefinition {'],
  ['src/utils/pricing.ts', 'export const getEffectiveProductPrice'],
  ['src/components/admin/AdminCommerceSettings.tsx', 'مدیریت لیبل‌ها و کدهای تخفیف'],
  ['src/components/product/ProductLabelBadges.tsx', 'resolveProductLabels'],
  ['src/components/common/LiveSectionModal.tsx', 'دسته‌بندی‌های محصولات این سکشن'],
  ['src/components/home/MarketplaceRtlHome.tsx', "source === 'partBrands'"],
  ['src/components/vehicle/CarModelView.tsx', '--car-mobile-cols'],
  ['src/components/common/RichTextComposer.tsx', 'colorSelectionRef'],
  ['src/server/routes/orders.ts', "ordersRouter.post('/coupon/validate'"],
  ['src/components/cart/CheckoutView.tsx', 'appliedCouponCode'],
  ['src/components/product/ProductDetailView.tsx', 'const gradeInfo = getGradeInfo(product.grade);']
];

const v3071Checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-rich-direct-upload="1"']
];

const v3080Checks = [
  ['src/components/cart/CartView.tsx', 'data-dedicated-cart-page="1"'],
  ['src/components/common/StoreLink.tsx', 'buildRoutePath'],
  ['src/components/admin/AdminProductContentFields.tsx', 'data-product-service-content-editor="1"'],
  ['src/components/product/ProductDiscountCountdown.tsx', 'data-product-discount-countdown="1"'],
  ['src/components/admin/AdminMediaLibrary.tsx', 'آپلود تصویر / صدا / ویدئو'],
  ['src/server/routes/media.ts', "mediaType: 'image' | 'audio' | 'video';"],
  ['src/server/routes/cms.ts', "cmsRouter.put('/pages/:id/sections/:sectionId'"],
  ['src/App.tsx', "route.view === 'cart'"],
  ['src/utils/navigation.ts', "if (view === 'cart') return '/cart';"]
];

const v3081Checks = [
  ['src/components/layout/Header.tsx', 'onClick={onOpenCartDrawer} className="marketplace-ref-cart"'],
  ['src/context/StoreContext.tsx', 'v30.8.1 stable full-page section persistence'],
  ['src/components/common/LiveSectionModal.tsx', 'v30.8.1: visual sections may intentionally have no title'],
  ['src/components/admin/AdminView.tsx', "onNavigate?.('admin', 'products');"]
];

const hasChecks = checks => checks.every(([path, marker]) => {
  try { return fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return false; }
});

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

if (hasChecks(v3052Checks) && hasChecks(v3053Checks) && hasChecks(v3060Checks) && hasChecks(v3070Checks) && hasChecks(v3071Checks) && hasChecks(v3080Checks)) {
  run('scripts/repair-v3052-footer.mjs');
  run('scripts/repair-v3060-admin.mjs');
  run('scripts/repair-v3070-product-detail.mjs');
  run('scripts/repair-v3071-rich-media-upload-ui.mjs');
  run('scripts/apply-v3080-cart-navigation.mjs');
  run('scripts/apply-v3080-product-media-sections.mjs');
  run('scripts/repair-v3080-rich-product-media.mjs');
  run('scripts/apply-v3081-stability-fixes.mjs');
  if (!hasChecks(v3081Checks)) throw new Error('Source preparation did not reach v30.8.1 stability markers.');
  console.log('Source preparation already at v30.8.1; verified.');
  process.exit(0);
}

if (!hasChecks(v3051Checks)) {
  for (const script of [
    'scripts/pre-v3050-adminview.mjs',
    'scripts/apply-v3050-patches.mjs',
    'scripts/post-v3050-adminview.mjs',
    'scripts/apply-v3051-patches.mjs',
    'scripts/repair-v3051-generated-source.mjs'
  ]) run(script);
} else {
  run('scripts/repair-v3051-generated-source.mjs');
}

if (!hasChecks(v3051Checks)) throw new Error('Source preparation did not reach v30.5.1 prerequisite markers.');

if (!hasChecks(v3052Checks)) run('scripts/apply-v3052-footer-copyright.mjs');
run('scripts/repair-v3052-footer.mjs');
if (!hasChecks(v3052Checks)) throw new Error('Source preparation did not reach v30.5.2 markers.');
if (!hasChecks(v3053Checks)) throw new Error('Source preparation did not reach v30.5.3 rich-editor markers.');

if (!hasChecks(v3060Checks)) run('scripts/apply-v3060-part-brands-media.mjs');
run('scripts/repair-v3060-admin.mjs');
if (!hasChecks(v3060Checks)) throw new Error('Source preparation did not reach v30.6.0 part-brand/media markers.');

if (!hasChecks(v3070Checks)) {
  run('scripts/apply-v3070-commerce.mjs');
  run('scripts/apply-v3070-storefront-cms.mjs');
  run('scripts/apply-v3070-checkout.mjs');
  run('scripts/repair-v3070-product-detail.mjs');
}
if (!hasChecks(v3070Checks)) throw new Error('Source preparation did not reach v30.7.0 commerce/CMS markers.');

run('scripts/repair-v3071-rich-media-upload-ui.mjs');
if (!hasChecks(v3071Checks)) throw new Error('Source preparation did not reach v30.7.1 rich-media upload UI marker.');

run('scripts/apply-v3080-cart-navigation.mjs');
run('scripts/apply-v3080-product-media-sections.mjs');
run('scripts/repair-v3080-rich-product-media.mjs');
if (!hasChecks(v3080Checks)) throw new Error('Source preparation did not reach v30.8.0 cart/product/media/section markers.');

run('scripts/apply-v3081-stability-fixes.mjs');
if (!hasChecks(v3081Checks)) throw new Error('Source preparation did not reach v30.8.1 stability markers.');
console.log('Source preparation completed at v30.8.1.');
