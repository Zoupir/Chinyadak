import { config } from './config';
import {
  loadEntity,
  normalizeSeoText,
  type SeoEntity,
  type SeoEntityType
} from './seo/platform';

const ROOT_MARKER = '<div id="root"></div>';

const privatePrefixes = [
  '/admin',
  '/account',
  '/checkout',
  '/tracking',
  '/invoice',
  '/compare',
  '/part-request',
  '/cart',
  '/wishlist'
];

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#039;');

const cleanText = (value: unknown, max = 8000): string =>
  normalizeSeoText(value).slice(0, max);

const decodePart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

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
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

const resolveRouteEntity = async (pathname: string): Promise<SeoEntity | null> => {
  const path = normalizeRoutePath(pathname);
  const match = path.match(/^\/(product|article|category|page|brand|car-model)\/([^/]+)$/);
  if (match) {
    const typeMap: Record<string, SeoEntityType> = {
      product: 'product',
      article: 'article',
      category: 'category',
      page: 'page',
      brand: 'brand',
      'car-model': 'model'
    };
    return loadEntity(typeMap[match[1]], decodePart(match[2]));
  }

  if (path === '/about' || path === '/guarantee') {
    return loadEntity('page', path.slice(1));
  }

  return null;
};

const scalarValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'string') return value.trim();
  return '';
};

const renderRows = (rows: Array<[string, unknown]>): string => {
  const normalized = rows
    .map(([label, value]) => [label, scalarValue(value)] as const)
    .filter(([, value]) => Boolean(value));
  if (!normalized.length) return '';
  return normalized.map(([label, value]) =>
    `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  ).join('');
};

const renderTable = (title: string, rows: string, className = ''): string => {
  if (!rows) return '';
  return `
    <section class="yadak-server-section ${escapeHtml(className)}">
      <h2>${escapeHtml(title)}</h2>
      <div class="yadak-server-table-wrap">
        <table><tbody>${rows}</tbody></table>
      </div>
    </section>`;
};

const renderFitments = (entity: SeoEntity): string => {
  const fitments = Array.isArray(entity.data?.fitments) ? entity.data.fitments.slice(0, 40) : [];
  if (!fitments.length) return '';

  const body = fitments.map((item: any) => {
    const yearFrom = scalarValue(item?.yearFrom);
    const yearTo = scalarValue(item?.yearTo);
    const year = yearFrom || yearTo
      ? `${yearFrom || '—'}${yearTo && yearTo !== yearFrom ? ` تا ${yearTo}` : ''}`
      : '—';
    return `<tr>
      <td>${escapeHtml(item?.brandName || item?.brand || '')}</td>
      <td>${escapeHtml(item?.modelName || item?.model || '')}</td>
      <td>${escapeHtml(year)}</td>
      <td>${escapeHtml(item?.engine || item?.engineCode || '')}</td>
      <td>${escapeHtml(item?.transmission || '')}</td>
    </tr>`;
  }).join('');

  return `
    <section class="yadak-server-section">
      <h2>سازگاری خودرو</h2>
      <div class="yadak-server-table-wrap">
        <table>
          <thead><tr><th>برند</th><th>مدل</th><th>سال</th><th>موتور</th><th>گیربکس</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
};

const renderTechnicalSpecs = (entity: SeoEntity): string => {
  const specs = entity.data?.technicalSpecs && typeof entity.data.technicalSpecs === 'object'
    ? entity.data.technicalSpecs
    : {};
  const rows = Object.entries(specs)
    .slice(0, 80)
    .map(([label, value]) => [label, value] as [string, unknown]);
  return renderTable('مشخصات فنی', renderRows(rows));
};

const renderProduct = (entity: SeoEntity): string => {
  const data = entity.data || {};
  const image = safeImageUrl(entity.image || data?.images?.[0]);
  const shortDescription = cleanText(data.shortDescription || entity.description, 1800);
  const longDescription = cleanText(entity.content || data.description, 9000);
  const categorySlug = scalarValue(data.categorySlug);
  const price = Number(data.discountPrice ?? data.price ?? 0);
  const priceLabel = Number.isFinite(price) && price > 0
    ? new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
    : '';

  const identityRows = renderRows([
    ['SKU', data.sku],
    ['شماره OEM', data.oemNumber],
    ['شماره قطعه', data.partNumber],
    ['برند سازنده', data.brandManufacturer],
    ['شرکت سازنده قطعه', data.partManufacturerCompany],
    ['کشور مبدا', data.countryOfOrigin],
    ['گرید کیفی', data.grade],
    ['محل نصب', data.placement],
    ['وزن', data.weightKg ? `${data.weightKg} kg` : ''],
    ['ابعاد', data.dimensionsCm],
    ['گارانتی', data.warrantyMonths ? `${data.warrantyMonths} ماه` : '']
  ]);

  return `
    <main class="yadak-server-shell" data-yadak-server-route="product">
      <nav class="yadak-server-breadcrumb" aria-label="مسیر صفحه">
        <a href="/">خانه</a><span>/</span><a href="/shop">فروشگاه</a>
        ${categorySlug ? `<span>/</span><a href="/category/${encodeURIComponent(categorySlug)}">دسته‌بندی</a>` : ''}
      </nav>
      <article>
        <div class="yadak-server-product-head">
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="520" height="420" loading="eager" />` : ''}
          <div>
            <h1>${escapeHtml(entity.title)}</h1>
            ${shortDescription ? `<p class="yadak-server-lead">${escapeHtml(shortDescription)}</p>` : ''}
            ${priceLabel ? `<p class="yadak-server-price">${escapeHtml(priceLabel)}</p>` : ''}
          </div>
        </div>
        ${renderTable('اطلاعات قطعه', identityRows)}
        ${renderTechnicalSpecs(entity)}
        ${renderFitments(entity)}
        ${longDescription ? `<section class="yadak-server-section"><h2>توضیحات محصول</h2><p>${escapeHtml(longDescription)}</p></section>` : ''}
      </article>
    </main>`;
};

const renderArticle = (entity: SeoEntity): string => {
  const data = entity.data || {};
  const image = safeImageUrl(entity.image || data.imageUrl);
  const summary = cleanText(entity.description || data.summary, 1800);
  const content = cleanText(entity.content || data.content, 12000);

  return `
    <main class="yadak-server-shell" data-yadak-server-route="article">
      <nav class="yadak-server-breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a><span>/</span><a href="/blog">مجله</a></nav>
      <article>
        <h1>${escapeHtml(entity.title)}</h1>
        ${summary ? `<p class="yadak-server-lead">${escapeHtml(summary)}</p>` : ''}
        ${image ? `<img class="yadak-server-hero" src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="1100" height="620" loading="eager" />` : ''}
        ${content ? `<section class="yadak-server-section"><h2>متن مقاله</h2><p>${escapeHtml(content)}</p></section>` : ''}
      </article>
    </main>`;
};

const renderGenericEntity = (entity: SeoEntity): string => {
  const description = cleanText(entity.description, 2400);
  const content = cleanText(entity.content, 9000);
  const image = safeImageUrl(entity.image);
  return `
    <main class="yadak-server-shell" data-yadak-server-route="${escapeHtml(entity.type)}">
      <nav class="yadak-server-breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a></nav>
      <article>
        <h1>${escapeHtml(entity.title)}</h1>
        ${description ? `<p class="yadak-server-lead">${escapeHtml(description)}</p>` : ''}
        ${image ? `<img class="yadak-server-hero" src="${escapeHtml(image)}" alt="${escapeHtml(entity.title)}" width="1100" height="620" loading="eager" />` : ''}
        ${content ? `<section class="yadak-server-section"><h2>اطلاعات بیشتر</h2><p>${escapeHtml(content)}</p></section>` : ''}
      </article>
    </main>`;
};

const renderStaticRoute = (pathname: string): string => {
  const path = normalizeRoutePath(pathname);
  const map: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'فروشگاه تخصصی قطعات خودروهای چینی',
      description: 'جستجو و خرید قطعات یدکی خودروهای چینی بر اساس برند، مدل، شماره فنی و مشخصات سازگاری خودرو.'
    },
    '/shop': {
      title: 'فروشگاه و کاتالوگ قطعات',
      description: 'کاتالوگ قطعات یدکی با فیلتر خودرو، شماره OEM، شماره قطعه، برند سازنده و وضعیت موجودی.'
    },
    '/blog': {
      title: 'مجله و آموزش تخصصی خودرو',
      description: 'مقالات فنی، راهنمای نگهداری، عیب‌یابی، تشخیص قطعه و آموزش‌های تخصصی خودروهای چینی.'
    }
  };
  const item = map[path] || (path.startsWith('/shop/') ? map['/shop'] : path.startsWith('/blog/') ? map['/blog'] : null);
  if (!item) return '';
  return `
    <main class="yadak-server-shell" data-yadak-server-route="static">
      <nav class="yadak-server-breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a></nav>
      <section>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="yadak-server-lead">${escapeHtml(item.description)}</p>
        ${path !== '/shop' ? '<p><a class="yadak-server-cta" href="/shop">مشاهده فروشگاه قطعات</a></p>' : ''}
      </section>
    </main>`;
};

const shellCss = `
<style id="yadak-server-shell-style">
  .yadak-server-shell{max-width:1280px;margin:0 auto;padding:28px 20px 48px;font-family:Vazirmatn,system-ui,sans-serif;direction:rtl;color:#171717;background:#fff}
  .yadak-server-shell h1{font-size:clamp(1.6rem,3vw,2.5rem);line-height:1.5;margin:18px 0 12px;font-weight:900}
  .yadak-server-shell h2{font-size:1.2rem;line-height:1.6;margin:0 0 14px;font-weight:850}
  .yadak-server-shell p{line-height:2;margin:0 0 14px}
  .yadak-server-breadcrumb{display:flex;flex-wrap:wrap;gap:7px;align-items:center;font-size:.78rem;color:#737373;margin-bottom:14px}
  .yadak-server-breadcrumb a{color:#404040;text-decoration:none}
  .yadak-server-lead{font-size:1rem;color:#525252;max-width:900px}
  .yadak-server-price{font-size:1.25rem;font-weight:900;color:#b91c1c}
  .yadak-server-product-head{display:grid;grid-template-columns:minmax(280px,460px) 1fr;gap:28px;align-items:start}
  .yadak-server-product-head img,.yadak-server-hero{display:block;width:100%;height:auto;max-height:620px;object-fit:contain;border:1px solid #e5e5e5;border-radius:18px;background:#fff}
  .yadak-server-section{margin-top:30px;padding-top:24px;border-top:1px solid #e5e5e5}
  .yadak-server-table-wrap{width:100%;overflow-x:auto;border:1px solid #e5e5e5;border-radius:14px}
  .yadak-server-shell table{width:100%;border-collapse:collapse;min-width:560px;background:#fff}
  .yadak-server-shell th,.yadak-server-shell td{padding:11px 13px;border-bottom:1px solid #eee;text-align:right;vertical-align:top}
  .yadak-server-shell th{font-weight:800;background:#fafafa;white-space:nowrap}
  .yadak-server-cta{display:inline-block;padding:10px 16px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:800}
  @media(max-width:760px){.yadak-server-shell{padding:18px 14px 36px}.yadak-server-product-head{grid-template-columns:1fr}.yadak-server-product-head img{max-height:360px}.yadak-server-shell table{min-width:620px}}
</style>`;

const safeJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

export const renderStorefrontDocument = async (template: string, pathname: string): Promise<string> => {
  if (!template.includes(ROOT_MARKER) || isPrivatePath(pathname)) return template;

  const entity = await resolveRouteEntity(pathname);
  let body = '';
  if (entity?.type === 'product') body = renderProduct(entity);
  else if (entity?.type === 'article') body = renderArticle(entity);
  else if (entity) body = renderGenericEntity(entity);
  else body = renderStaticRoute(pathname);

  if (!body) return template;

  const payload = {
    mode: 'website',
    path: normalizeRoutePath(pathname),
    entity: entity ? {
      type: entity.type,
      id: entity.id,
      slug: entity.slug,
      title: entity.title,
      url: entity.url,
      description: entity.description,
      content: entity.content,
      image: entity.image || '',
      data: { ...entity.data, id: entity.id, slug: entity.slug }
    } : null
  };

  const routeScript = `<script id="__YADAK_SERVER_ROUTE__" type="application/json">${safeJson(payload)}</script>`;
  return template.replace(ROOT_MARKER, `<div id="root" data-render-mode="website">${shellCss}${body}</div>${routeScript}`);
};
