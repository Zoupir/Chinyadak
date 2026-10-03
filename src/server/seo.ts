import { config } from './config';
import { pool, type RowDataPacket } from './db';
import {
  absoluteSiteUrl,
  deriveSeoMeta,
  getSeoMetaRecord,
  getSeoSettings,
  loadEntity,
  normalizePath,
  normalizeSeoText,
  parseJson,
  type SeoEntity,
  type SeoEntityType,
  type SeoMetaRecord
} from './seo/platform';

export type RuntimeSeoMeta = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  ogType: 'website' | 'article' | 'product';
  ogTitle: string;
  ogDescription: string;
  image?: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
  hreflang: Array<{ lang: string; url: string }>;
  schemas: unknown[];
};

const baseUrl = () => config.appUrl.replace(/\/$/, '');

const escapeHtml = (value: string): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const safeAbsoluteUrl = (value: unknown): string | undefined => {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw, config.appUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
};

const applyTitleTemplate = (
  template: string,
  title: string,
  siteTitle: string,
  separator: string
): string =>
  String(template || '%title% | %site%')
    .replace(/%title%/g, title)
    .replace(/%site%/g, siteTitle)
    .replace(/%sep%/g, separator)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);

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

const isPrivatePath = (path: string): boolean =>
  privatePrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));

const entityFromPath = async (pathname: string): Promise<SeoEntity | null> => {
  const path = normalizePath(pathname).split('?')[0].replace(/\/$/, '') || '/';
  const match = path.match(/^\/(product|article|category|page|brand|car-model)\/([^/]+)$/);
  if (match) {
    const map: Record<string, SeoEntityType> = {
      product: 'product',
      article: 'article',
      category: 'category',
      page: 'page',
      brand: 'brand',
      'car-model': 'model'
    };
    let key = match[2];
    try { key = decodeURIComponent(key); } catch {}
    return loadEntity(map[match[1]], key);
  }
  if (path === '/about' || path === '/guarantee') {
    return loadEntity('page', path.slice(1));
  }
  return null;
};

const breadcrumbSchema = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteSiteUrl(item.path)
  }))
});

const identitySchemas = async (): Promise<unknown[]> => {
  const settings = await getSeoSettings();
  const identity = settings.identity;
  const name = identity.organizationName || settings.global.siteTitle;
  const type = identity.organizationType || 'Organization';
  const supported = new Set([
    'Organization','LocalBusiness','Store','AutoPartsStore','AutomotiveBusiness'
  ]);
  const schemaType = supported.has(type) ? type : 'Organization';
  const organization: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': baseUrl() + '/#organization',
    name,
    url: baseUrl()
  };
  const logo = safeAbsoluteUrl(identity.logoUrl || settings.global.ogImageUrl);
  if (logo) organization.logo = logo;
  if (identity.phone) organization.telephone = identity.phone;
  if (identity.email) organization.email = identity.email;
  if (identity.priceRange) organization.priceRange = identity.priceRange;
  if (identity.mapUrl) organization.hasMap = identity.mapUrl;
  if (identity.socialProfiles?.length) organization.sameAs = identity.socialProfiles;
  if (identity.serviceAreas?.length) {
    organization.areaServed = identity.serviceAreas.map(nameValue => ({
      '@type': 'AdministrativeArea',
      name: nameValue
    }));
  }
  if (identity.address || identity.city || identity.region || identity.country) {
    organization.address = {
      '@type': 'PostalAddress',
      streetAddress: identity.address || undefined,
      addressLocality: identity.city || undefined,
      addressRegion: identity.region || undefined,
      addressCountry: identity.country || undefined
    };
  }
  if (identity.openingHours?.length) organization.openingHours = identity.openingHours;

  return [
    organization,
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': baseUrl() + '/#website',
      name: settings.global.siteTitle,
      url: baseUrl(),
      publisher: { '@id': baseUrl() + '/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: baseUrl() + '/shop?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  ];
};

const entitySchemas = (
  entity: SeoEntity,
  meta: SeoMetaRecord,
  canonical: string
): unknown[] => {
  const schemaType = meta.schemaType || (
    entity.type === 'product' ? 'Product' :
    entity.type === 'article' ? 'Article' :
    ['category','brand','model'].includes(entity.type) ? 'CollectionPage' : 'WebPage'
  );
  const description = meta.metaDescription || entity.description || normalizeSeoText(entity.content).slice(0, 170);
  const image = safeAbsoluteUrl(meta.ogImageUrl || entity.image);
  const schemas: unknown[] = [];

  if (entity.type === 'product' && ['Product','ProductGroup'].includes(schemaType)) {
    const priceToman = Number(entity.data?.discountPrice ?? entity.data?.price ?? 0);
    const stock = Number(entity.data?.stock ?? 0);
    const product: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      '@id': canonical + '#product',
      name: entity.title,
      description,
      url: canonical,
      sku: entity.data?.sku || undefined,
      mpn: entity.data?.partNumber || undefined,
      additionalProperty: entity.data?.oemNumber ? [{ '@type': 'PropertyValue', name: 'OEM', value: entity.data.oemNumber }] : undefined,
      image: image ? [image] : undefined,
      brand: entity.data?.brandManufacturer
        ? { '@type': 'Brand', name: entity.data.brandManufacturer }
        : undefined
    };
    if (priceToman > 0) {
      product.offers = {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'IRR',
        price: priceToman * 10,
        availability: stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      };
    }
    schemas.push(product);
  } else if (entity.type === 'article') {
    const allowed = new Set(['Article','BlogPosting','TechArticle','NewsArticle']);
    const type = allowed.has(schemaType) ? schemaType : 'Article';
    schemas.push({
      '@context': 'https://schema.org',
      '@type': type,
      '@id': canonical + '#article',
      headline: entity.title,
      description,
      image: image ? [image] : undefined,
      author: entity.data?.author
        ? { '@type': 'Person', name: entity.data.author }
        : { '@id': baseUrl() + '/#organization' },
      publisher: { '@id': baseUrl() + '/#organization' },
      dateModified: entity.updatedAt.toISOString(),
      mainEntityOfPage: canonical
    });
  } else {
    const allowed = new Set(['WebPage','CollectionPage','AboutPage','ContactPage','FAQPage']);
    const type = allowed.has(schemaType)
      ? schemaType
      : ['category','brand','model'].includes(entity.type) ? 'CollectionPage' : 'WebPage';
    schemas.push({
      '@context': 'https://schema.org',
      '@type': type,
      '@id': canonical + '#webpage',
      name: entity.title,
      description,
      url: canonical,
      image: image || undefined,
      isPartOf: { '@id': baseUrl() + '/#website' }
    });
  }

  const faq = Array.isArray(entity.data?.faq) ? entity.data.faq : [];
  if (faq.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.slice(0, 30).map((item: any) => ({
        '@type': 'Question',
        name: normalizeSeoText(item?.q || '').slice(0, 300),
        acceptedAnswer: {
          '@type': 'Answer',
          text: normalizeSeoText(item?.a || '').slice(0, 3000)
        }
      })).filter((item: any) => item.name && item.acceptedAnswer.text)
    });
  }

  const crumbs: Array<{ name: string; path: string }> = [{ name: 'خانه', path: '/' }];
  if (entity.type === 'product') crumbs.push({ name: 'فروشگاه', path: '/shop' });
  if (entity.type === 'article') crumbs.push({ name: 'مجله', path: '/blog' });
  crumbs.push({ name: meta.breadcrumbTitle || entity.title, path: entity.url });
  schemas.push(breadcrumbSchema(crumbs));
  return schemas;
};

const staticMeta = async (path: string): Promise<RuntimeSeoMeta> => {
  const settings = await getSeoSettings();
  const site = settings.global.siteTitle || 'یدک استور';
  const indexAllowed = settings.global.indexRobots && !isPrivatePath(path);
  let title = settings.global.metaTitle || site;
  let description = settings.global.metaDescription || settings.global.siteSlogan || site;
  let canonical = settings.global.canonicalUrl && path === '/'
    ? settings.global.canonicalUrl
    : absoluteSiteUrl(path);
  let schemas = path === '/' ? await identitySchemas() : [];
  let image = safeAbsoluteUrl(settings.global.ogImageUrl);

  if (path === '/shop' || path.startsWith('/shop/')) {
    title = 'فروشگاه قطعات یدکی خودروهای چینی ' + settings.global.separator + ' ' + site;
    description = 'جستجو و خرید قطعات خودروهای چینی با شماره فنی، فیلتر خودرو، موجودی و مشخصات فنی.';
    canonical = absoluteSiteUrl(path);
  } else if (path === '/blog') {
    title = 'مجله و آموزش تخصصی خودروهای چینی ' + settings.global.separator + ' ' + site;
    description = 'مقالات تخصصی نگهداری، عیب‌یابی، تشخیص قطعه اصل و راهنمای قطعات خودروهای چینی.';
    canonical = absoluteSiteUrl('/blog');
    schemas = [{
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'مجله ' + site,
      url: canonical
    }];
  }

  return {
    title,
    description,
    keywords: path === '/' ? settings.global.metaKeywords : '',
    canonical: safeAbsoluteUrl(canonical) || absoluteSiteUrl(path),
    robots: indexAllowed ? 'index,follow,max-image-preview:large' : 'noindex,nofollow',
    ogType: 'website',
    ogTitle: settings.global.ogTitle || title,
    ogDescription: settings.global.ogDescription || description,
    image,
    twitterTitle: settings.global.ogTitle || title,
    twitterDescription: settings.global.ogDescription || description,
    twitterImage: image,
    hreflang: [],
    schemas
  };
};

export const getSeoMeta = async (pathname: string): Promise<RuntimeSeoMeta> => {
  const path = normalizePath(pathname).split('?')[0].replace(/\/$/, '') || '/';
  const settings = await getSeoSettings();
  const entity = await entityFromPath(path);
  if (!entity) return staticMeta(path);

  const stored = await getSeoMetaRecord(entity.type, entity.id);
  const meta = stored || deriveSeoMeta(entity);
  const site = settings.global.siteTitle || 'یدک استور';
  const template = entity.type === 'product'
    ? settings.global.productTitleTemplate
    : entity.type === 'article'
      ? settings.global.articleTitleTemplate
      : ['category','brand','model'].includes(entity.type)
        ? settings.global.categoryTitleTemplate
        : '%title% %sep% %site%';

  const title = meta.seoTitle && stored
    ? meta.seoTitle
    : applyTitleTemplate(template, entity.title, site, settings.global.separator);
  const description = meta.metaDescription || entity.description || normalizeSeoText(entity.content).slice(0, 170);
  const canonical = safeAbsoluteUrl(meta.canonicalUrl) || absoluteSiteUrl(
    (path === '/about' || path === '/guarantee') ? path : entity.url
  );
  const image = safeAbsoluteUrl(meta.ogImageUrl || entity.image || settings.global.ogImageUrl);
  const robots = meta.robotsIndex && settings.global.indexRobots
    ? (meta.robotsFollow ? 'index,follow,max-image-preview:large' : 'index,nofollow,max-image-preview:large')
    : (meta.robotsFollow ? 'noindex,follow' : 'noindex,nofollow');
  const schemas = settings.modules.schema ? entitySchemas(entity, meta, canonical) : [];
  const identity = path === '/' ? await identitySchemas() : [];

  return {
    title,
    description,
    keywords: [meta.focusKeyword, ...meta.secondaryKeywords].filter(Boolean).join(', '),
    canonical,
    robots,
    ogType: entity.type === 'product' ? 'product' : entity.type === 'article' ? 'article' : 'website',
    ogTitle: meta.ogTitle || title,
    ogDescription: meta.ogDescription || description,
    image,
    twitterTitle: meta.twitterTitle || meta.ogTitle || title,
    twitterDescription: meta.twitterDescription || meta.ogDescription || description,
    twitterImage: safeAbsoluteUrl(meta.twitterImageUrl) || image,
    hreflang: meta.hreflang,
    schemas: [...identity, ...schemas]
  };
};

const upsertTag = (html: string, matcher: RegExp, tag: string): string =>
  matcher.test(html)
    ? html.replace(matcher, tag)
    : html.replace('</head>', '  ' + tag + '\n</head>');

export const renderSeoHtml = async (template: string, pathname: string): Promise<string> => {
  const settings = await getSeoSettings();
  if (!settings.modules.meta) return template;
  const meta = await getSeoMeta(pathname);
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(meta.title) + '</title>');
  html = upsertTag(html, /<meta\s+name=["']description["'][^>]*>/i,
    '<meta name="description" content="' + escapeHtml(meta.description) + '" />');
  html = upsertTag(html, /<meta\s+name=["']robots["'][^>]*>/i,
    '<meta name="robots" content="' + escapeHtml(meta.robots) + '" />');

  if (meta.keywords) {
    html = upsertTag(html, /<meta\s+name=["']keywords["'][^>]*>/i,
      '<meta name="keywords" content="' + escapeHtml(meta.keywords) + '" />');
  }

  html = upsertTag(html, /<link\s+rel=["']canonical["'][^>]*>/i,
    '<link rel="canonical" href="' + escapeHtml(meta.canonical) + '" />');
  html = upsertTag(html, /<meta\s+property=["']og:title["'][^>]*>/i,
    '<meta property="og:title" content="' + escapeHtml(meta.ogTitle) + '" />');
  html = upsertTag(html, /<meta\s+property=["']og:description["'][^>]*>/i,
    '<meta property="og:description" content="' + escapeHtml(meta.ogDescription) + '" />');
  html = upsertTag(html, /<meta\s+property=["']og:type["'][^>]*>/i,
    '<meta property="og:type" content="' + meta.ogType + '" />');
  html = upsertTag(html, /<meta\s+property=["']og:url["'][^>]*>/i,
    '<meta property="og:url" content="' + escapeHtml(meta.canonical) + '" />');

  if (meta.image) {
    html = upsertTag(html, /<meta\s+property=["']og:image["'][^>]*>/i,
      '<meta property="og:image" content="' + escapeHtml(meta.image) + '" />');
  }

  html = upsertTag(html, /<meta\s+name=["']twitter:card["'][^>]*>/i,
    '<meta name="twitter:card" content="summary_large_image" />');
  html = upsertTag(html, /<meta\s+name=["']twitter:title["'][^>]*>/i,
    '<meta name="twitter:title" content="' + escapeHtml(meta.twitterTitle) + '" />');
  html = upsertTag(html, /<meta\s+name=["']twitter:description["'][^>]*>/i,
    '<meta name="twitter:description" content="' + escapeHtml(meta.twitterDescription) + '" />');
  if (meta.twitterImage) {
    html = upsertTag(html, /<meta\s+name=["']twitter:image["'][^>]*>/i,
      '<meta name="twitter:image" content="' + escapeHtml(meta.twitterImage) + '" />');
  }

  html = html.replace(/<link\s+rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*/gi, '');
  for (const alternate of meta.hreflang) {
    const url = safeAbsoluteUrl(alternate.url);
    const lang = String(alternate.lang || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!url || !lang) continue;
    html = html.replace('</head>',
      '  <link rel="alternate" hreflang="' + escapeHtml(lang) + '" href="' + escapeHtml(url) + '" />\n</head>');
  }

  html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  if (settings.modules.schema && meta.schemas.length) {
    const schemas = meta.schemas
      .map(schema => JSON.stringify(schema).replace(/</g, '\\u003c'))
      .map(json => '<script type="application/ld+json">' + json + '</script>')
      .join('\n');
    html = html.replace('</head>', schemas + '\n</head>');
  }

  return html;
};

type SitemapType = 'products' | 'articles' | 'categories' | 'pages' | 'brands' | 'models';

const sitemapDefinitions: Record<SitemapType, {
  entityType: SeoEntityType;
  table: string;
  where: string;
  prefix: string;
}> = {
  products: { entityType: 'product', table: 'products', where: "p.status = 'active'", prefix: '/product/' },
  articles: { entityType: 'article', table: 'articles', where: 'p.is_active = 1', prefix: '/article/' },
  categories: { entityType: 'category', table: 'categories', where: 'p.is_active = 1', prefix: '/category/' },
  pages: { entityType: 'page', table: 'site_pages', where: '1=1', prefix: '/page/' },
  brands: { entityType: 'brand', table: 'vehicle_brands', where: 'p.is_active = 1', prefix: '/brand/' },
  models: { entityType: 'model', table: 'vehicle_models', where: 'p.is_active = 1', prefix: '/car-model/' }
};

export const buildSitemapIndexXml = async (): Promise<string> => {
  const settings = await getSeoSettings();
  const chunkSize = settings.sitemap.chunkSize;
  const items: string[] = [];
  for (const [type, definition] of Object.entries(sitemapDefinitions) as Array<[SitemapType, typeof sitemapDefinitions[SitemapType]]>) {
    const [rows] = await pool.query<Array<RowDataPacket & { total: number }>>(
      'SELECT COUNT(*) total FROM ' + definition.table + ' p LEFT JOIN seo_meta m ON m.entity_type = ? AND m.entity_id = p.id WHERE ' + definition.where + ' AND COALESCE(m.robots_index, 1) = 1',
      [definition.entityType]
    );
    const count = Number(rows[0]?.total || 0);
    const pages = Math.ceil(count / chunkSize);
    for (let page = 1; page <= pages; page += 1) {
      items.push(
        '<sitemap><loc>' + escapeHtml(baseUrl() + '/sitemap-' + type + '-' + page + '.xml') + '</loc></sitemap>'
      );
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    items.join('') +
    '</sitemapindex>';
};

export const buildSitemapXml = buildSitemapIndexXml;

export const buildSitemapChunkXml = async (type: string, page = 1): Promise<string | null> => {
  const definition = sitemapDefinitions[type as SitemapType];
  if (!definition) return null;
  const settings = await getSeoSettings();
  const chunkSize = settings.sitemap.chunkSize;
  const safePage = Math.max(1, Number(page || 1));
  const offset = (safePage - 1) * chunkSize;
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string;
    slug: string;
    updated_at: Date;
    data_json: any;
  }>>(
    'SELECT p.id, p.slug, p.updated_at, p.data_json FROM ' + definition.table +
      ' p LEFT JOIN seo_meta m ON m.entity_type = ? AND m.entity_id = p.id WHERE ' +
      definition.where + ' AND COALESCE(m.robots_index, 1) = 1 ORDER BY p.updated_at DESC LIMIT ' +
      chunkSize + ' OFFSET ' + offset,
    [definition.entityType]
  );

  const urls = rows.map(row => {
    let path = definition.prefix + encodeURIComponent(row.slug);
    if (definition.entityType === 'page' && ['about','guarantee'].includes(row.slug)) path = '/' + row.slug;
    const data = parseJson<any>(row.data_json, {});
    const image = settings.sitemap.includeImages
      ? safeAbsoluteUrl(
          definition.entityType === 'product'
            ? (Array.isArray(data.images) ? data.images[0] : '')
            : data.imageUrl || data.heroImage || data.logo || ''
        )
      : undefined;
    const imageXml = image
      ? '<image:image><image:loc>' + escapeHtml(image) + '</image:loc></image:image>'
      : '';
    return '<url><loc>' + escapeHtml(absoluteSiteUrl(path)) + '</loc>' +
      '<lastmod>' + new Date(row.updated_at).toISOString() + '</lastmod>' +
      imageXml + '</url>';
  }).join('');

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' +
    urls + '</urlset>';
};

export const buildHtmlSitemap = async (): Promise<string> => {
  const settings = await getSeoSettings();
  if (!settings.sitemap.htmlEnabled) return '<!doctype html><meta charset="utf-8"><title>HTML Sitemap disabled</title>';
  const sections: string[] = [];
  for (const [type, definition] of Object.entries(sitemapDefinitions) as Array<[SitemapType, typeof sitemapDefinitions[SitemapType]]>) {
    const [rows] = await pool.query<Array<RowDataPacket & { slug: string; data_json: any }>>(
      'SELECT p.slug, p.data_json FROM ' + definition.table +
        ' p LEFT JOIN seo_meta m ON m.entity_type = ? AND m.entity_id = p.id WHERE ' +
        definition.where + ' AND COALESCE(m.robots_index, 1) = 1 ORDER BY p.updated_at DESC LIMIT 5000',
      [definition.entityType]
    );
    const links = rows.map(row => {
      const data = parseJson<any>(row.data_json, {});
      const label = normalizeSeoText(
        data.nameFa || data.title || data.name || data.slug || row.slug
      ) || row.slug;
      let path = definition.prefix + encodeURIComponent(row.slug);
      if (definition.entityType === 'page' && ['about','guarantee'].includes(row.slug)) path = '/' + row.slug;
      return '<li><a href="' + escapeHtml(path) + '">' + escapeHtml(label) + '</a></li>';
    }).join('');
    sections.push('<section><h2>' + escapeHtml(type) + '</h2><ul>' + links + '</ul></section>');
  }
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="index,follow"><title>نقشه HTML سایت | ' +
    escapeHtml(settings.global.siteTitle) +
    '</title><style>body{font-family:system-ui;max-width:1100px;margin:auto;padding:32px;line-height:2}section{margin:24px 0}ul{columns:3}a{text-decoration:none}@media(max-width:700px){ul{columns:1}}</style></head><body><h1>نقشه سایت</h1>' +
    sections.join('') + '</body></html>';
};

export const robotsText = async (): Promise<string> => {
  const settings = await getSeoSettings();
  if (!settings.modules.sitemap) {
    return ['User-agent: *', settings.global.indexRobots ? 'Allow: /' : 'Disallow: /'].join('\n');
  }
  const managed = [
    'User-agent: *',
    settings.global.indexRobots ? 'Allow: /' : 'Disallow: /',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /tracking',
    'Disallow: /invoice',
    'Disallow: /api/',
    'Sitemap: ' + baseUrl() + '/sitemap.xml'
  ];
  if (settings.robots.extraRules.trim()) managed.push(settings.robots.extraRules.trim());
  return managed.join('\n');
};
