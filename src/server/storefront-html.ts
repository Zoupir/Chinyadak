import { config } from './config';
import { pool, type RowDataPacket } from './db';
import {
  loadEntity,
  normalizeSeoText,
  type SeoEntity,
  type SeoEntityType
} from './seo/platform';

const ROOT_MARKER = '<div id="root"></div>';
const privatePrefixes = ['/admin','/account','/checkout','/tracking','/invoice','/compare','/part-request','/cart','/wishlist'];

interface JsonRow extends RowDataPacket { id: string; data_json: any; }
interface ProductRow extends JsonRow { stock: number; reserved_stock: number; }
interface SettingRow extends RowDataPacket { setting_key: string; setting_value: any; }

type CatalogBootstrap = {
  products: any[];
  total: number;
  offset: number;
  limit: number;
  nextOffset: number;
  hasMore: boolean;
};

type StorefrontBootstrap = {
  catalog: CatalogBootstrap;
  categories: { categories: any[] };
  vehicles: { brands: any[]; models: any[] };
  cms: {
    articles: any[];
    articleCategories: any[];
    sliders: any[];
    pages: any[];
    settings: any | null;
    paymentGateways: any[];
  };
};

const queryRows = async <T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> => {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
};

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/'/g, '&#039;');

const safeJson = (value: unknown): string => JSON.stringify(value)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const cleanText = (value: unknown, max = 8000): string => normalizeSeoText(value).slice(0, max);

const sanitizeRichHtml = (value: unknown, max = 60000): string => {
  let html = String(value ?? '').slice(0, max);
  if (!html.trim()) return '';
  return html
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
};

const decodePart = (value: string): string => { try { return decodeURIComponent(value); } catch { return value; } };
const normalizeRoutePath = (pathname: string): string => {
  const path = String(pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return path.startsWith('/') ? path : '/' + path;
};
const isPrivatePath = (pathname: string): boolean => {
  const path = normalizeRoutePath(pathname);
  return privatePrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
};

const safeImageUrl = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, config.appUrl);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch { return ''; }
};

const resolveRouteEntity = async (pathname: string): Promise<SeoEntity | null> => {
  const path = normalizeRoutePath(pathname);
  const match = path.match(/^\/(product|article|category|page|brand|car-model)\/([^/]+)$/);
  if (match) {
    const typeMap: Record<string, SeoEntityType> = {
      product: 'product', article: 'article', category: 'category', page: 'page', brand: 'brand', 'car-model': 'model'
    };
    return loadEntity(typeMap[match[1]], decodePart(match[2]));
  }
  if (path === '/about' || path === '/guarantee') return loadEntity('page', path.slice(1));
  return null;
};

const productDto = (row: ProductRow): any => {
  const data = parseJson<any>(row.data_json, {});
  const availableStock = Math.max(0, Number(row.stock || 0) - Number(row.reserved_stock || 0));
  return { ...data, id: row.id, stock: availableStock,
    stockStatus: availableStock <= 0 ? 'out_of_stock' : availableStock <= 3 ? 'low_stock' : 'in_stock' };
};

const queryLatestProducts = async (limit: number): Promise<{ products: any[]; total: number }> => {
  const [countRows, rows] = await Promise.all([
    queryRows<Array<RowDataPacket & { total: number }>>("SELECT COUNT(*) AS total FROM products WHERE status = 'active'"),
    queryRows<ProductRow[]>("SELECT id, stock, reserved_stock, data_json FROM products WHERE status = 'active' ORDER BY updated_at DESC LIMIT ?", [limit])
  ]);
  return { products: rows.map(productDto), total: Number(countRows[0]?.total || 0) };
};

const queryCategoryProducts = async (slug: string, limit: number): Promise<{ products: any[]; total: number }> => {
  const where = "status = 'active' AND (category_slug = ? OR JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.subcategorySlug')) = ?)";
  const args = [slug, slug];
  const [countRows, rows] = await Promise.all([
    queryRows<Array<RowDataPacket & { total: number }>>(`SELECT COUNT(*) AS total FROM products WHERE ${where}`, args),
    queryRows<ProductRow[]>(`SELECT id, stock, reserved_stock, data_json FROM products WHERE ${where} ORDER BY updated_at DESC LIMIT ?`, [...args, limit])
  ]);
  return { products: rows.map(productDto), total: Number(countRows[0]?.total || 0) };
};

const querySingleProductWithRelated = async (entity: SeoEntity): Promise<any[]> => {
  const exactRows = await queryRows<ProductRow[]>(
    "SELECT id, stock, reserved_stock, data_json FROM products WHERE status = 'active' AND id = ? LIMIT 1", [entity.id]
  );
  const exact = exactRows[0] ? productDto(exactRows[0]) : { ...entity.data, id: entity.id, slug: entity.slug };
  const categorySlug = String(exact.categorySlug || '').trim();
  if (!categorySlug) return [exact];
  const relatedRows = await queryRows<ProductRow[]>(
    "SELECT id, stock, reserved_stock, data_json FROM products WHERE status = 'active' AND category_slug = ? AND id <> ? ORDER BY updated_at DESC LIMIT 12",
    [categorySlug, entity.id]
  );
  return [exact, ...relatedRows.map(productDto)];
};

const queryEntityProducts = async (entity: SeoEntity, limit = 48): Promise<any[]> => {
  const jsonPath = entity.type === 'brand' ? '$.vehicleBrandIds' : '$.vehicleModelIds';
  const rows = await queryRows<ProductRow[]>(
    `SELECT id, stock, reserved_stock, data_json FROM products
     WHERE status = 'active'
       AND JSON_CONTAINS(COALESCE(JSON_EXTRACT(data_json, '${jsonPath}'), JSON_ARRAY()), JSON_QUOTE(?)) = 1
     ORDER BY updated_at DESC LIMIT ?`,
    [entity.id, limit]
  );
  return rows.map(productDto);
};

const queryArticles = async (limit: number, exactId?: string): Promise<any[]> => {
  const rows = await queryRows<JsonRow[]>(
    'SELECT id, data_json FROM articles WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ?', [limit]
  );
  const articles = rows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })).filter(item => !item.__trashed);
  if (!exactId || articles.some(item => item.id === exactId)) return articles;
  const exactRows = await queryRows<JsonRow[]>('SELECT id, data_json FROM articles WHERE is_active = 1 AND id = ? LIMIT 1', [exactId]);
  if (!exactRows[0]) return articles;
  const exact = { ...parseJson<any>(exactRows[0].data_json, {}), id: exactRows[0].id };
  return [exact, ...articles.filter(item => item.id !== exact.id)];
};

const buildStorefrontBootstrap = async (pathname: string, entity: SeoEntity | null): Promise<StorefrontBootstrap> => {
  const path = normalizeRoutePath(pathname);
  const isHome = path === '/';
  const isBlog = path === '/blog' || path.startsWith('/blog/');
  const isArticle = entity?.type === 'article';

  const commonPromise = Promise.all([
    queryRows<JsonRow[]>('SELECT id, data_json FROM categories WHERE is_active = 1 AND parent_id IS NULL ORDER BY sort_order ASC, name_fa ASC'),
    queryRows<JsonRow[]>('SELECT id, data_json FROM vehicle_brands WHERE is_active = 1 ORDER BY name_fa ASC'),
    queryRows<JsonRow[]>('SELECT id, data_json FROM vehicle_models WHERE is_active = 1 ORDER BY name_fa ASC'),
    queryRows<JsonRow[]>('SELECT id, data_json FROM article_categories ORDER BY name ASC'),
    queryRows<JsonRow[]>('SELECT id, data_json FROM site_pages ORDER BY is_system DESC, updated_at DESC'),
    queryRows<SettingRow[]>("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('site_settings','payment_gateways')")
  ]);

  let catalogPromise: Promise<{ products: any[]; total: number }>;
  if (entity?.type === 'product') {
    catalogPromise = querySingleProductWithRelated(entity).then(products => ({ products, total: products.length }));
  } else if (entity?.type === 'category') {
    catalogPromise = queryCategoryProducts(entity.slug, 48);
  } else if (entity?.type === 'brand' || entity?.type === 'model') {
    catalogPromise = queryEntityProducts(entity, 48).then(products => ({ products, total: products.length }));
  } else if (isHome || path === '/shop' || path.startsWith('/shop/')) {
    catalogPromise = queryLatestProducts(48);
  } else {
    catalogPromise = queryLatestProducts(16);
  }

  const articleLimit = isBlog ? 48 : isArticle ? 12 : isHome ? 8 : 4;
  const articlePromise = queryArticles(articleLimit, isArticle ? entity?.id : undefined);
  const sliderPromise: Promise<JsonRow[]> = isHome
    ? queryRows<JsonRow[]>('SELECT id, data_json FROM sliders WHERE is_active = 1 ORDER BY sort_order ASC, updated_at DESC')
    : Promise.resolve([]);

  const [common, catalog, articles, sliderRows] = await Promise.all([commonPromise, catalogPromise, articlePromise, sliderPromise]);
  const [categoryRows, brandRows, modelRows, articleCategoryRows, pageRows, settingRows] = common;
  const settingsMap = new Map(settingRows.map(row => [row.setting_key, parseJson<any>(row.setting_value, null)]));

  const categories = categoryRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));
  const brands = brandRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));
  const models = modelRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));
  const articleCategories = articleCategoryRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }))
    .filter(item => !item.__trashed && item.isActive !== false);
  const pages = pageRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }))
    .filter(item => !item.__trashed && item.isVisible !== false);
  const limit = catalog.products.length;
  const pageable = path === '/' || path === '/shop' || path.startsWith('/shop/') || entity?.type === 'category';

  return {
    catalog: { products: catalog.products, total: catalog.total, offset: 0, limit, nextOffset: limit, hasMore: pageable && catalog.total > limit },
    categories: { categories },
    vehicles: { brands, models },
    cms: {
      articles,
      articleCategories,
      sliders: sliderRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
      pages,
      settings: settingsMap.get('site_settings') || null,
      paymentGateways: settingsMap.get('payment_gateways') || []
    }
  };
};

const scalarValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return typeof value === 'string' ? value.trim() : '';
};

const renderRows = (rows: Array<[string, unknown]>): string => rows
  .map(([label, value]) => [label, scalarValue(value)] as const)
  .filter(([, value]) => Boolean(value))
  .map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');

const renderTable = (title: string, rows: string): string => rows
  ? `<section class="ys-section"><h2>${escapeHtml(title)}</h2><div class="ys-table-wrap"><table><tbody>${rows}</tbody></table></div></section>` : '';

const renderProductCard = (product: any): string => {
  const image = safeImageUrl(product?.images?.[0]);
  const slug = String(product?.slug || product?.id || '');
  const title = String(product?.nameFa || product?.nameEn || 'قطعه خودرو');
  const price = Number(product?.discountPrice ?? product?.price ?? 0);
  const priceLabel = Number.isFinite(price) && price > 0 ? `${new Intl.NumberFormat('fa-IR').format(price)} تومان` : 'استعلام قیمت';
  return `<article class="ys-card"><a href="/product/${encodeURIComponent(slug)}">
    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="320" height="240" loading="lazy" />` : '<div class="ys-card-placeholder" aria-hidden="true"></div>'}
    <h3>${escapeHtml(title)}</h3>${product?.oemNumber ? `<p>OEM: ${escapeHtml(product.oemNumber)}</p>` : ''}<strong>${escapeHtml(priceLabel)}</strong>
  </a></article>`;
};

const renderProductGrid = (products: any[], title = 'محصولات'): string => products.length
  ? `<section class="ys-section"><h2>${escapeHtml(title)}</h2><div class="ys-grid">${products.map(renderProductCard).join('')}</div></section>` : '';

const renderArticleCard = (article: any): string => {
  const image = safeImageUrl(article?.imageUrl);
  const slug = String(article?.slug || article?.id || '');
  const title = String(article?.title || 'مقاله');
  return `<article class="ys-card ys-article-card"><a href="/article/${encodeURIComponent(slug)}">
    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="420" height="260" loading="lazy" />` : ''}
    <h3>${escapeHtml(title)}</h3>${article?.summary ? `<p>${escapeHtml(cleanText(article.summary, 180))}</p>` : ''}
  </a></article>`;
};
const renderArticleGrid = (articles: any[], title = 'آخرین مقالات'): string => articles.length
  ? `<section class="ys-section"><h2>${escapeHtml(title)}</h2><div class="ys-grid ys-article-grid">${articles.map(renderArticleCard).join('')}</div></section>` : '';

const renderFitments = (entity: SeoEntity): string => {
  const fitments = Array.isArray(entity.data?.fitments) ? entity.data.fitments.slice(0, 80) : [];
  if (!fitments.length) return '';
  const body = fitments.map((item: any) => {
    const from = scalarValue(item?.yearFrom); const to = scalarValue(item?.yearTo);
    const year = from || to ? `${from || '—'}${to && to !== from ? ` تا ${to}` : ''}` : '—';
    return `<tr><td>${escapeHtml(item?.brandName || item?.brand || '')}</td><td>${escapeHtml(item?.modelName || item?.model || '')}</td><td>${escapeHtml(year)}</td><td>${escapeHtml(item?.engine || item?.engineCode || '')}</td><td>${escapeHtml(item?.transmission || '')}</td></tr>`;
  }).join('');
  return `<section class="ys-section"><h2>راهنمای سازگاری خودرو (Fitment)</h2><div class="ys-table-wrap"><table><thead><tr><th>برند</th><th>مدل</th><th>سال</th><th>موتور</th><th>گیربکس</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
};

const renderTechnicalSpecs = (entity: SeoEntity): string => {
  const specs = entity.data?.technicalSpecs && typeof entity.data.technicalSpecs === 'object' ? entity.data.technicalSpecs : {};
  return renderTable('مشخصات فنی', renderRows(Object.entries(specs).slice(0, 100) as Array<[string, unknown]>));
};

const renderProduct = (entity: SeoEntity, bootstrap: StorefrontBootstrap): string => {
  const product = bootstrap.catalog.products.find(item => item.id === entity.id) || { ...entity.data, id: entity.id };
  const image = safeImageUrl(entity.image || product?.images?.[0]);
  const shortDescription = sanitizeRichHtml(product.shortDescription || entity.description, 12000);
  const longDescription = sanitizeRichHtml(entity.content || product.description, 60000);
  const price = Number(product.discountPrice ?? product.price ?? 0);
  const priceLabel = Number.isFinite(price) && price > 0 ? `${new Intl.NumberFormat('fa-IR').format(price)} تومان` : '';
  const identityRows = renderRows([
    ['SKU', product.sku], ['شماره OEM', product.oemNumber], ['شماره قطعه', product.partNumber], ['برند سازنده', product.brandManufacturer],
    ['شرکت سازنده قطعه', product.partManufacturerCompany], ['کشور مبدا', product.countryOfOrigin], ['گرید کیفی', product.grade],
    ['محل نصب', product.placement], ['وزن', product.weightKg ? `${product.weightKg} kg` : ''], ['ابعاد', product.dimensionsCm],
    ['گارانتی', product.warrantyMonths ? `${product.warrantyMonths} ماه` : '']
  ]);
  const related = bootstrap.catalog.products.filter(item => item.id !== entity.id).slice(0, 12);
  return `<main class="ys-main" data-yadak-server-route="product"><nav class="ys-breadcrumb"><a href="/">خانه</a><span>/</span><a href="/shop">فروشگاه</a></nav><article>
    <div class="ys-product-head">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="520" height="420" loading="eager" />` : ''}
    <div><h1>${escapeHtml(entity.title)}</h1>${shortDescription ? `<div class="ys-rich ys-lead">${shortDescription}</div>` : ''}${priceLabel ? `<p class="ys-price">${escapeHtml(priceLabel)}</p>` : ''}</div></div>
    ${renderTable('اطلاعات قطعه', identityRows)}${renderTechnicalSpecs(entity)}${renderFitments(entity)}
    ${longDescription ? `<section class="ys-section ys-rich"><h2>توضیحات محصول</h2>${longDescription}</section>` : ''}${renderProductGrid(related, 'محصولات مرتبط')}
  </article></main>`;
};

const renderArticle = (entity: SeoEntity): string => {
  const data = entity.data || {};
  const image = safeImageUrl(entity.image || data.imageUrl);
  const summary = sanitizeRichHtml(entity.description || data.summary, 12000);
  const content = sanitizeRichHtml(entity.content || data.content, 80000);
  return `<main class="ys-main" data-yadak-server-route="article"><nav class="ys-breadcrumb"><a href="/">خانه</a><span>/</span><a href="/blog">مجله</a></nav><article>
    <h1>${escapeHtml(entity.title)}</h1>${summary ? `<div class="ys-rich ys-lead">${summary}</div>` : ''}
    ${image ? `<img class="ys-hero" src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="1100" height="620" loading="eager" />` : ''}
    ${content ? `<section class="ys-section ys-rich">${content}</section>` : ''}</article></main>`;
};

const renderGenericEntity = (entity: SeoEntity, bootstrap: StorefrontBootstrap): string => {
  const description = sanitizeRichHtml(entity.description, 16000);
  const content = sanitizeRichHtml(entity.content, 60000);
  const image = safeImageUrl(entity.image);
  const productTitle = entity.type === 'category' ? 'محصولات این دسته' : entity.type === 'brand' ? 'قطعات این برند' : entity.type === 'model' ? 'قطعات سازگار' : '';
  return `<main class="ys-main" data-yadak-server-route="${escapeHtml(entity.type)}"><nav class="ys-breadcrumb"><a href="/">خانه</a></nav><article>
    <h1>${escapeHtml(entity.title)}</h1>${description ? `<div class="ys-rich ys-lead">${description}</div>` : ''}
    ${image ? `<img class="ys-hero" src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="1100" height="620" loading="eager" />` : ''}
    ${productTitle ? renderProductGrid(bootstrap.catalog.products, productTitle) : ''}${content ? `<section class="ys-section ys-rich">${content}</section>` : ''}</article></main>`;
};

const renderStaticRoute = (pathname: string, bootstrap: StorefrontBootstrap): string => {
  const path = normalizeRoutePath(pathname);
  if (path === '/') return `<main class="ys-main" data-yadak-server-route="home"><section class="ys-hero-copy"><h1>فروشگاه تخصصی قطعات خودروهای چینی</h1><p class="ys-lead">جستجو و خرید قطعات بر اساس برند، مدل، شماره فنی و سازگاری دقیق خودرو.</p><a class="ys-cta" href="/shop">مشاهده فروشگاه</a></section>${renderProductGrid(bootstrap.catalog.products.slice(0, 24), 'محصولات جدید و منتخب')}${renderArticleGrid(bootstrap.cms.articles, 'آخرین مقالات تخصصی')}</main>`;
  if (path === '/shop' || path.startsWith('/shop/')) return `<main class="ys-main" data-yadak-server-route="shop"><h1>فروشگاه و کاتالوگ قطعات</h1><p class="ys-lead">قطعات را بر اساس شماره OEM، مدل خودرو، برند سازنده و وضعیت موجودی بررسی کنید.</p>${renderProductGrid(bootstrap.catalog.products, 'محصولات')}</main>`;
  if (path === '/blog' || path.startsWith('/blog/')) return `<main class="ys-main" data-yadak-server-route="blog"><h1>مجله و آموزش تخصصی خودرو</h1><p class="ys-lead">مقالات فنی، نگهداری، عیب‌یابی و راهنمای قطعات خودروهای چینی.</p>${renderArticleGrid(bootstrap.cms.articles, 'مقالات')}</main>`;
  return '';
};

const renderHeader = (bootstrap: StorefrontBootstrap): string => {
  const settings = bootstrap.cms.settings || {}; const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  const logo = safeImageUrl(settings.logoUrl); const cats = bootstrap.categories.categories.slice(0, 8);
  return `<header class="ys-header"><div class="ys-header-inner"><a class="ys-brand" href="/">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(title)}" width="150" height="52" />` : `<strong>${escapeHtml(title)}</strong>`}</a><nav aria-label="منوی اصلی"><a href="/shop">فروشگاه</a>${cats.map(cat => `<a href="/category/${encodeURIComponent(String(cat.slug || cat.id))}">${escapeHtml(cat.nameFa || cat.nameEn || '')}</a>`).join('')}<a href="/blog">مجله</a></nav></div></header>`;
};
const renderFooter = (bootstrap: StorefrontBootstrap): string => {
  const settings = bootstrap.cms.settings || {}; const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  return `<footer class="ys-footer"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(settings.siteSlogan || 'فروشگاه تخصصی قطعات خودرو')}</p></div><nav><a href="/shop">فروشگاه</a><a href="/blog">مجله</a><a href="/about">درباره ما</a><a href="/guarantee">ضمانت و اصالت</a></nav></footer>`;
};

const shellCss = `<style id="yadak-server-shell-style">
#root[data-server-rendered="1"]{min-height:100vh;background:#f8fafc;color:#171717;font-family:Vazirmatn,system-ui,sans-serif;direction:rtl}.ys-header{background:#fff;border-bottom:1px solid #e5e7eb}.ys-header-inner{max-width:1280px;margin:auto;padding:12px 20px;display:flex;align-items:center;gap:24px}.ys-brand{display:flex;align-items:center;text-decoration:none;color:#111827;font-size:1.2rem;white-space:nowrap}.ys-brand img{max-height:52px;width:auto;object-fit:contain}.ys-header nav{display:flex;align-items:center;gap:14px;overflow:auto;white-space:nowrap;scrollbar-width:none}.ys-header nav::-webkit-scrollbar{display:none}.ys-header nav a{font-size:.8rem;color:#374151;text-decoration:none;font-weight:700}.ys-main{max-width:1280px;margin:0 auto;padding:28px 20px 56px}.ys-main h1{font-size:clamp(1.55rem,3vw,2.45rem);line-height:1.55;margin:12px 0 14px;font-weight:900}.ys-main h2{font-size:1.22rem;line-height:1.7;margin:0 0 15px;font-weight:900}.ys-main h3{font-size:.94rem;line-height:1.7;margin:10px 0 6px}.ys-lead{font-size:1rem;color:#525252;line-height:2;max-width:940px}.ys-breadcrumb{display:flex;flex-wrap:wrap;gap:7px;font-size:.78rem;color:#737373;margin-bottom:14px}.ys-breadcrumb a{color:#404040;text-decoration:none}.ys-hero-copy{padding:34px;border-radius:18px;background:#fff;border:1px solid #e5e7eb}.ys-cta{display:inline-block;margin-top:8px;padding:11px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:850}.ys-product-head{display:grid;grid-template-columns:minmax(280px,460px) 1fr;gap:30px;align-items:start}.ys-product-head>img,.ys-hero{display:block;width:100%;height:auto;max-height:620px;object-fit:contain;border:1px solid #e5e7eb;border-radius:18px;background:#fff}.ys-price{font-size:1.25rem;font-weight:900;color:#b91c1c}.ys-section{margin-top:30px;padding-top:24px;border-top:1px solid #e5e7eb}.ys-rich{line-height:2}.ys-rich h2,.ys-rich h3,.ys-rich h4{margin:24px 0 10px}.ys-rich ul,.ys-rich ol{padding-right:24px;margin:12px 0}.ys-rich blockquote{border-right:4px solid #d1d5db;margin:18px 0;padding:8px 16px;background:#f9fafb}.ys-rich a{color:#1d4ed8}.ys-rich img{max-width:100%;height:auto}.ys-table-wrap{width:100%;overflow-x:auto;border:1px solid #e5e7eb;border-radius:14px;background:#fff}.ys-main table{width:100%;border-collapse:collapse;min-width:560px}.ys-main th,.ys-main td{padding:11px 13px;border-bottom:1px solid #eee;text-align:right;vertical-align:top}.ys-main th{font-weight:850;background:#fafafa;white-space:nowrap}.ys-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.ys-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;min-width:0}.ys-card>a{display:block;padding:12px;text-decoration:none;color:#171717;height:100%}.ys-card img,.ys-card-placeholder{width:100%;aspect-ratio:4/3;object-fit:contain;border-radius:10px;background:#f8fafc}.ys-card p{font-size:.75rem;color:#737373;line-height:1.7}.ys-card strong{font-size:.86rem}.ys-article-card img{aspect-ratio:16/9;object-fit:cover}.ys-article-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.ys-footer{border-top:1px solid #e5e7eb;background:#111827;color:#fff;padding:30px max(20px,calc((100vw - 1240px)/2));display:flex;justify-content:space-between;gap:24px}.ys-footer p{color:#d1d5db;font-size:.82rem}.ys-footer nav{display:flex;gap:16px;flex-wrap:wrap}.ys-footer a{color:#e5e7eb;text-decoration:none;font-size:.8rem}@media(max-width:900px){.ys-header-inner{display:block}.ys-header nav{margin-top:10px}.ys-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ys-article-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ys-product-head{grid-template-columns:1fr}.ys-footer{display:block}.ys-footer nav{margin-top:18px}}@media(max-width:560px){.ys-main{padding:20px 14px 46px}.ys-hero-copy{padding:22px 18px}.ys-grid{gap:9px}.ys-card>a{padding:9px}.ys-article-grid{grid-template-columns:1fr}.ys-footer{padding:26px 16px}}
</style>`;

export const renderStorefrontDocument = async (template: string, pathname: string): Promise<string> => {
  const path = normalizeRoutePath(pathname);
  if (isPrivatePath(path)) return template;
  const entity = await resolveRouteEntity(path);
  const bootstrap = await buildStorefrontBootstrap(path, entity);
  let main = '';
  if (entity?.type === 'product') main = renderProduct(entity, bootstrap);
  else if (entity?.type === 'article') main = renderArticle(entity);
  else if (entity) main = renderGenericEntity(entity, bootstrap);
  else main = renderStaticRoute(path, bootstrap);
  if (!main) return template;
  const payload = { mode: 'website', path, entity: entity ? { type: entity.type, id: entity.id, slug: entity.slug, data: entity.data } : null, bootstrap };
  const root = `<div id="root" data-server-rendered="1">${renderHeader(bootstrap)}${main}${renderFooter(bootstrap)}</div>`;
  const dataScript = `<script id="__YADAK_SERVER_ROUTE__" type="application/json">${safeJson(payload)}</script>`;
  return template.replace(ROOT_MARKER, `${shellCss}${root}${dataScript}`)
    .replace('<html lang="fa" dir="rtl"', '<html lang="fa" dir="rtl" data-render-mode="website"');
};
