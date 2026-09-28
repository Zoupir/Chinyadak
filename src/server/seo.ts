import { config } from './config';
import { pool, type RowDataPacket } from './db';

interface ProductSeoRow extends RowDataPacket {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  sku: string;
  oem_number: string | null;
  price: number | string;
  discount_price: number | string | null;
  stock: number;
  reserved_stock: number;
  data_json: any;
  updated_at: Date;
}

interface JsonSeoRow extends RowDataPacket {
  id: string;
  slug: string;
  data_json: any;
  updated_at: Date;
}

interface PageSeoRow extends RowDataPacket {
  id: string;
  slug: string;
  title: string;
  data_json: any;
  updated_at: Date;
}

type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: 'website' | 'article' | 'product';
  image?: string;
  schemas: unknown[];
};

const baseUrl = () => config.appUrl.replace(/\/$/, '');

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const cleanText = (value: unknown, max = 170): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const absoluteUrl = (value: unknown): string | undefined => {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${baseUrl()}${raw}`;
  return undefined;
};

const canonicalFor = (path: string): string =>
  `${baseUrl()}${path === '/' ? '' : path.replace(/\/$/, '')}`;

const privatePrefixes = [
  '/admin',
  '/account',
  '/checkout',
  '/tracking',
  '/invoice',
  '/compare',
  '/part-request'
];

const defaultMeta = (pathname: string): SeoMeta => ({
  title: 'چین پارت | بازار تخصصی قطعات یدکی خودروهای چینی',
  description: 'فروشگاه تخصصی قطعات یدکی خودروهای چینی با جستجوی شماره فنی، تطبیق خودرو، تضمین اصالت و رهگیری سفارش.',
  canonical: canonicalFor(pathname),
  robots: privatePrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
    ? 'noindex,nofollow'
    : 'index,follow,max-image-preview:large',
  ogType: 'website',
  schemas: [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      name: 'چین پارت',
      url: baseUrl()
    }
  ]
});

const breadcrumbSchema = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonicalFor(item.path)
  }))
});

export const getSeoMeta = async (pathname: string): Promise<SeoMeta> => {
  const safePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const meta = defaultMeta(safePath);
  const parts = safePath.split('/').filter(Boolean).map(part => {
    try { return decodeURIComponent(part); } catch { return part; }
  });

  if (!parts.length) {
    meta.schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'چین پارت',
      url: baseUrl(),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl()}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
    return meta;
  }

  if (parts[0] === 'product' && parts[1]) {
    const key = parts.slice(1).join('/');
    const [rows] = await pool.query<ProductSeoRow[]>(
      `SELECT id, slug, name_fa, name_en, sku, oem_number, price, discount_price,
              stock, reserved_stock, data_json, updated_at
       FROM products
       WHERE status = 'active' AND (id = ? OR slug = ?)
       LIMIT 1`,
      [key, key]
    );
    const row = rows[0];
    if (!row) {
      return { ...meta, title: 'محصول پیدا نشد | چین پارت', robots: 'noindex,follow' };
    }

    const data = parseJson<any>(row.data_json, {});
    const description = cleanText(
      data.shortDescription || data.description ||
      `${row.name_fa} با شماره فنی ${row.oem_number || row.sku}؛ مشخصات، سازگاری خودرو، قیمت و موجودی.`
    );
    const activePrice = Number(row.discount_price ?? row.price);
    const available = Math.max(0, Number(row.stock) - Number(row.reserved_stock || 0));
    const image = absoluteUrl(Array.isArray(data.images) ? data.images[0] : '');
    const canonicalPath = `/product/${encodeURIComponent(row.slug)}`;

    return {
      title: `${row.name_fa} | خرید و مشخصات | چین پارت`,
      description,
      canonical: canonicalFor(canonicalPath),
      robots: 'index,follow,max-image-preview:large',
      ogType: 'product',
      image,
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: row.name_fa,
          alternateName: row.name_en || undefined,
          sku: row.sku,
          mpn: row.oem_number || undefined,
          description,
          image: image ? [image] : undefined,
          brand: data.brandManufacturer
            ? { '@type': 'Brand', name: data.brandManufacturer }
            : undefined,
          offers: {
            '@type': 'Offer',
            url: canonicalFor(canonicalPath),
            priceCurrency: 'IRR',
            price: activePrice * 10,
            availability: available > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition'
          }
        },
        breadcrumbSchema([
          { name: 'خانه', path: '/' },
          { name: 'فروشگاه', path: '/shop' },
          { name: row.name_fa, path: canonicalPath }
        ])
      ]
    };
  }

  if (parts[0] === 'category' && parts[1]) {
    const slug = parts.slice(1).join('/');
    const [rows] = await pool.query<JsonSeoRow[]>(
      'SELECT id, slug, data_json, updated_at FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1',
      [slug]
    );
    const row = rows[0];
    if (!row) return { ...meta, title: 'دسته‌بندی قطعات | چین پارت', robots: 'noindex,follow' };
    const data = parseJson<any>(row.data_json, {});
    const name = cleanText(data.nameFa || slug, 90);
    const description = cleanText(data.description || `خرید و بررسی قطعات دسته ${name} برای خودروهای چینی.`);
    const path = `/category/${encodeURIComponent(row.slug)}`;
    return {
      ...meta,
      title: `${name} | قطعات یدکی | چین پارت`,
      description,
      canonical: canonicalFor(path),
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name,
          description,
          url: canonicalFor(path)
        },
        breadcrumbSchema([
          { name: 'خانه', path: '/' },
          { name: name, path }
        ])
      ]
    };
  }

  if (parts[0] === 'article' && parts[1]) {
    const key = parts.slice(1).join('/');
    const [rows] = await pool.query<JsonSeoRow[]>(
      `SELECT id, slug, data_json, updated_at
       FROM articles
       WHERE is_active = 1 AND (id = ? OR slug = ?)
       LIMIT 1`,
      [key, key]
    );
    const row = rows[0];
    if (!row) return { ...meta, title: 'مقاله پیدا نشد | چین پارت', robots: 'noindex,follow' };
    const data = parseJson<any>(row.data_json, {});
    const title = cleanText(data.title || 'مقاله تخصصی خودرو', 120);
    const description = cleanText(data.summary || data.content || title);
    const image = absoluteUrl(data.imageUrl);
    const path = `/article/${encodeURIComponent(row.slug)}`;
    const schemas: unknown[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image: image ? [image] : undefined,
        author: data.author ? { '@type': 'Person', name: data.author } : undefined,
        dateModified: new Date(row.updated_at).toISOString(),
        mainEntityOfPage: canonicalFor(path)
      },
      breadcrumbSchema([
        { name: 'خانه', path: '/' },
        { name: 'وبلاگ', path: '/blog' },
        { name: title, path }
      ])
    ];
    if (Array.isArray(data.faq) && data.faq.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faq.slice(0, 20).map((item: any) => ({
          '@type': 'Question',
          name: cleanText(item.q, 250),
          acceptedAnswer: {
            '@type': 'Answer',
            text: cleanText(item.a, 1000)
          }
        }))
      });
    }
    return {
      title: `${title} | مجله چین پارت`,
      description,
      canonical: canonicalFor(path),
      robots: 'index,follow,max-image-preview:large',
      ogType: 'article',
      image,
      schemas
    };
  }

  if ((parts[0] === 'page' && parts[1]) || parts[0] === 'about' || parts[0] === 'guarantee') {
    const slug = parts[0] === 'page' ? parts.slice(1).join('/') : parts[0];
    const [rows] = await pool.query<PageSeoRow[]>(
      'SELECT id, slug, title, data_json, updated_at FROM site_pages WHERE slug = ? LIMIT 1',
      [slug]
    );
    const row = rows[0];
    if (row) {
      const data = parseJson<any>(row.data_json, {});
      const description = cleanText(data.description || row.title);
      const path = parts[0] === 'page'
        ? `/page/${encodeURIComponent(row.slug)}`
        : `/${encodeURIComponent(row.slug)}`;
      return {
        ...meta,
        title: `${row.title} | چین پارت`,
        description,
        canonical: canonicalFor(path),
        schemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: row.title,
            description,
            url: canonicalFor(path)
          }
        ]
      };
    }
  }

  if (parts[0] === 'blog') {
    return {
      ...meta,
      title: 'مجله و آموزش تخصصی خودروهای چینی | چین پارت',
      description: 'مقالات تخصصی نگهداری، عیب‌یابی، تشخیص قطعه اصل و راهنمای قطعات خودروهای چینی.',
      canonical: canonicalFor('/blog'),
      schemas: [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'مجله چین پارت', url: canonicalFor('/blog') }]
    };
  }

  if (parts[0] === 'shop') {
    return {
      ...meta,
      title: 'فروشگاه قطعات یدکی خودروهای چینی | چین پارت',
      description: 'جستجو و خرید قطعات خودروهای چینی با شماره فنی، فیلتر خودرو، موجودی و مشخصات فنی.',
      canonical: canonicalFor(safePath)
    };
  }

  if (parts[0] === 'brand' && parts[1]) {
    const key = parts.slice(1).join('/');
    const [rows] = await pool.query<JsonSeoRow[]>(
      `SELECT id, slug, data_json, updated_at
       FROM vehicle_brands
       WHERE is_active = 1 AND (id = ? OR slug = ?)
       LIMIT 1`,
      [key, key]
    );
    const row = rows[0];
    if (!row) return { ...meta, robots: 'noindex,follow' };
    const data = parseJson<any>(row.data_json, {});
    const label = cleanText(data.nameFa || row.slug, 80);
    const description = cleanText(data.description || `کاتالوگ قطعات یدکی و مصرفی خودروهای برند ${label}.`);
    const path = `/brand/${encodeURIComponent(row.slug)}`;
    return {
      ...meta,
      title: `قطعات خودروهای ${label} | چین پارت`,
      description,
      canonical: canonicalFor(path),
      image: absoluteUrl(data.heroImage || data.logo),
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `قطعات خودروهای ${label}`,
          description,
          url: canonicalFor(path)
        },
        breadcrumbSchema([
          { name: 'خانه', path: '/' },
          { name: label, path }
        ])
      ]
    };
  }

  if (parts[0] === 'car-model' && parts[1]) {
    const key = parts.slice(1).join('/');
    const [rows] = await pool.query<JsonSeoRow[]>(
      `SELECT id, slug, data_json, updated_at
       FROM vehicle_models
       WHERE is_active = 1 AND (id = ? OR slug = ?)
       LIMIT 1`,
      [key, key]
    );
    const row = rows[0];
    if (!row) return { ...meta, robots: 'noindex,follow' };
    const data = parseJson<any>(row.data_json, {});
    const label = cleanText(data.nameFa || row.slug, 80);
    const description = cleanText(data.description || `فهرست قطعات یدکی و مصرفی ${label} با تطبیق فنی خودرو.`);
    const path = `/car-model/${encodeURIComponent(row.slug)}`;
    return {
      ...meta,
      title: `قطعات ${label} | چین پارت`,
      description,
      canonical: canonicalFor(path),
      image: absoluteUrl(data.imageUrl),
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `قطعات ${label}`,
          description,
          url: canonicalFor(path)
        },
        breadcrumbSchema([
          { name: 'خانه', path: '/' },
          { name: label, path }
        ])
      ]
    };
  }

  return meta;
};

const upsertMeta = (
  html: string,
  matcher: RegExp,
  tag: string
): string => matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`);

export const renderSeoHtml = async (template: string, pathname: string): Promise<string> => {
  const meta = await getSeoMeta(pathname);
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  html = upsertMeta(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );
  html = upsertMeta(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`
  );
  html = upsertMeta(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
  );
  html = upsertMeta(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
  );
  html = upsertMeta(
    html,
    /<meta\s+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="${meta.ogType}" />`
  );
  html = upsertMeta(
    html,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`
  );
  if (meta.image) {
    html = upsertMeta(
      html,
      /<meta\s+property=["']og:image["'][^>]*>/i,
      `<meta property="og:image" content="${escapeHtml(meta.image)}" />`
    );
  }
  html = upsertMeta(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`
  );

  html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const schemas = meta.schemas
    .map(schema => JSON.stringify(schema).replace(/</g, '\\u003c'))
    .map(json => `<script type="application/ld+json">${json}</script>`)
    .join('\n');
  html = html.replace('</head>', `${schemas}\n</head>`);
  return html;
};

export const buildSitemapXml = async (): Promise<string> => {
  const [products, categories, articles, pages, brands, models] = await Promise.all([
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      "SELECT slug, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC"
    ),
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      'SELECT slug, updated_at FROM categories WHERE is_active = 1 ORDER BY updated_at DESC'
    ),
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      'SELECT slug, updated_at FROM articles WHERE is_active = 1 ORDER BY updated_at DESC'
    ),
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      'SELECT slug, updated_at FROM site_pages ORDER BY updated_at DESC'
    ),
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      'SELECT slug, updated_at FROM vehicle_brands WHERE is_active = 1 ORDER BY updated_at DESC'
    ),
    pool.query<Array<RowDataPacket & { slug: string; updated_at: Date }>>(
      'SELECT slug, updated_at FROM vehicle_models WHERE is_active = 1 ORDER BY updated_at DESC'
    )
  ]);

  const urls: Array<{ loc: string; lastmod?: Date; priority?: string }> = [
    { loc: '/', priority: '1.0' },
    { loc: '/shop', priority: '0.9' },
    { loc: '/blog', priority: '0.8' }
  ];

  for (const row of products[0]) urls.push({ loc: `/product/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.9' });
  for (const row of categories[0]) urls.push({ loc: `/category/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.8' });
  for (const row of articles[0]) urls.push({ loc: `/article/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.7' });
  for (const row of pages[0]) urls.push({ loc: `/page/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.5' });
  for (const row of brands[0]) urls.push({ loc: `/brand/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.8' });
  for (const row of models[0]) urls.push({ loc: `/car-model/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at, priority: '0.8' });

  const body = urls.map(item => {
    const lastmod = item.lastmod ? `<lastmod>${new Date(item.lastmod).toISOString()}</lastmod>` : '';
    return `<url><loc>${escapeHtml(canonicalFor(item.loc))}</loc>${lastmod}<priority>${item.priority || '0.5'}</priority></url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
};

export const robotsText = (): string =>
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /tracking',
    'Disallow: /invoice',
    `Sitemap: ${baseUrl()}/sitemap.xml`
  ].join('\n');
