import { config } from '../config';
import { pool, type RowDataPacket } from '../db';
import { getSeoSettings, normalizeSeoText, parseJson } from './platform';
import { canonicalPublicSeoPath, STATIC_SITEMAP_PATHS } from './technical';

type SitemapDbType = 'products' | 'articles' | 'categories' | 'pages' | 'brands' | 'models';
export type PublicSitemapType = 'static' | SitemapDbType;

type SitemapRow = {
  id: string;
  slug: string;
  updatedAt: Date;
  data: Record<string, any>;
  image?: string;
  label?: string;
};

const baseUrl = () => config.appUrl.replace(/\/$/, '');
const escapeXml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const absolute = (pathname: string): string => {
  const path = canonicalPublicSeoPath(pathname);
  return baseUrl() + (path === '/' ? '' : path);
};

const safeImage = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, config.appUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

const pagePath = (slug: string): string => canonicalPublicSeoPath('/page/' + encodeURIComponent(slug));

const definitions: Record<Exclude<SitemapDbType, 'categories'>, {
  entityType: 'product' | 'article' | 'page' | 'brand' | 'model';
  table: string;
  where: string;
  prefix: string;
}> = {
  products: { entityType: 'product', table: 'products', where: "p.status = 'active'", prefix: '/product/' },
  articles: { entityType: 'article', table: 'articles', where: 'p.is_active = 1', prefix: '/article/' },
  pages: {
    entityType: 'page',
    table: 'site_pages',
    where: "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p.data_json, '$.__trashed')), 'false') <> 'true' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p.data_json, '$.isVisible')), 'true') <> 'false' AND p.slug NOT IN ('home','part-request')",
    prefix: '/page/'
  },
  brands: { entityType: 'brand', table: 'vehicle_brands', where: 'p.is_active = 1', prefix: '/brand/' },
  models: { entityType: 'model', table: 'vehicle_models', where: 'p.is_active = 1', prefix: '/car-model/' }
};

const mediaFromData = (type: SitemapDbType, data: Record<string, any>): string => {
  if (type === 'products') return safeImage(Array.isArray(data.images) ? data.images[0] : '');
  if (type === 'categories') return safeImage(data.imageUrl || data.heroImageUrl || data.iconUrl || '');
  return safeImage(data.imageUrl || data.heroImage || data.logo || '');
};

const labelFromData = (data: Record<string, any>, fallback: string): string =>
  normalizeSeoText(data.nameFa || data.title || data.name || data.slug || fallback) || fallback;

const loadCategoryRows = async (): Promise<SitemapRow[]> => {
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string; slug: string; name_fa: string; data_json: any; updated_at: Date;
  }>>('SELECT id, slug, name_fa, data_json, updated_at FROM categories WHERE is_active = 1 ORDER BY updated_at DESC');
  const [metaRows] = await pool.query<Array<RowDataPacket & { entity_id: string; robots_index: number }>>(
    "SELECT entity_id, robots_index FROM seo_meta WHERE entity_type = 'category'"
  );
  const robots = new Map(metaRows.map(row => [String(row.entity_id), Boolean(row.robots_index)]));
  const output: SitemapRow[] = [];

  const pushNested = (nodes: any[], updatedAt: Date) => {
    for (const node of nodes || []) {
      const id = String(node?.id || '').trim();
      const slug = String(node?.slug || id).trim();
      if (!id || !slug) continue;
      const metaId = 'sub:' + id;
      if (robots.get(metaId) !== false) {
        output.push({
          id: metaId,
          slug,
          updatedAt,
          data: node || {},
          image: mediaFromData('categories', node || {}),
          label: labelFromData(node || {}, slug)
        });
      }
      if (Array.isArray(node?.subcategories)) pushNested(node.subcategories, updatedAt);
    }
  };

  for (const row of rows) {
    const data = parseJson<Record<string, any>>(row.data_json, {});
    if (robots.get(String(row.id)) !== false) {
      output.push({
        id: String(row.id),
        slug: String(row.slug),
        updatedAt: new Date(row.updated_at),
        data,
        image: mediaFromData('categories', data),
        label: labelFromData(data, row.name_fa || row.slug)
      });
    }
    pushNested(Array.isArray(data.subcategories) ? data.subcategories : [], new Date(row.updated_at));
  }
  return output.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

const countDbRows = async (type: Exclude<SitemapDbType, 'categories'>): Promise<number> => {
  const definition = definitions[type];
  const [rows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    'SELECT COUNT(*) total FROM ' + definition.table +
    ' p LEFT JOIN seo_meta m ON m.entity_type = ? AND m.entity_id = p.id WHERE ' +
    definition.where + ' AND COALESCE(m.robots_index, 1) = 1',
    [definition.entityType]
  );
  return Number(rows[0]?.total || 0);
};

const loadDbRows = async (
  type: Exclude<SitemapDbType, 'categories'>,
  limit: number,
  offset: number
): Promise<SitemapRow[]> => {
  const definition = definitions[type];
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string; slug: string; updated_at: Date; data_json: any;
  }>>(
    'SELECT p.id, p.slug, p.updated_at, p.data_json FROM ' + definition.table +
    ' p LEFT JOIN seo_meta m ON m.entity_type = ? AND m.entity_id = p.id WHERE ' +
    definition.where + ' AND COALESCE(m.robots_index, 1) = 1 ORDER BY p.updated_at DESC LIMIT ' +
    Math.max(1, Math.floor(limit)) + ' OFFSET ' + Math.max(0, Math.floor(offset)),
    [definition.entityType]
  );
  return rows.map(row => {
    const data = parseJson<Record<string, any>>(row.data_json, {});
    return {
      id: String(row.id),
      slug: String(row.slug),
      updatedAt: new Date(row.updated_at),
      data,
      image: mediaFromData(type, data),
      label: labelFromData(data, row.slug)
    };
  });
};

const pathForRow = (type: SitemapDbType, row: SitemapRow): string => {
  if (type === 'pages') return pagePath(row.slug);
  if (type === 'products') return '/product/' + encodeURIComponent(row.slug);
  if (type === 'articles') return '/article/' + encodeURIComponent(row.slug);
  if (type === 'categories') return '/category/' + encodeURIComponent(row.slug);
  if (type === 'brands') return '/brand/' + encodeURIComponent(row.slug);
  return '/car-model/' + encodeURIComponent(row.slug);
};

const urlset = (items: Array<{ path: string; updatedAt?: Date; image?: string }>): string => {
  const body = items.map(item => {
    const image = item.image ? '<image:image><image:loc>' + escapeXml(item.image) + '</image:loc></image:image>' : '';
    const lastmod = item.updatedAt && !Number.isNaN(item.updatedAt.getTime())
      ? '<lastmod>' + item.updatedAt.toISOString() + '</lastmod>'
      : '';
    return '<url><loc>' + escapeXml(absolute(item.path)) + '</loc>' + lastmod + image + '</url>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' +
    body + '</urlset>';
};

export const buildPublicSitemapIndexXml = async (): Promise<string> => {
  const settings = await getSeoSettings();
  const chunkSize = Math.max(100, Math.min(5000, Number(settings.sitemap.chunkSize || 1000)));
  const items: string[] = [
    '<sitemap><loc>' + escapeXml(baseUrl() + '/sitemap-static-1.xml') + '</loc></sitemap>'
  ];
  const categoryCount = (await loadCategoryRows()).length;
  const categoryPages = Math.ceil(categoryCount / chunkSize);
  for (let page = 1; page <= categoryPages; page += 1) {
    items.push('<sitemap><loc>' + escapeXml(baseUrl() + '/sitemap-categories-' + page + '.xml') + '</loc></sitemap>');
  }
  for (const type of ['products','articles','pages','brands','models'] as const) {
    const count = await countDbRows(type);
    const pages = Math.ceil(count / chunkSize);
    for (let page = 1; page <= pages; page += 1) {
      items.push('<sitemap><loc>' + escapeXml(baseUrl() + '/sitemap-' + type + '-' + page + '.xml') + '</loc></sitemap>');
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + items.join('') + '</sitemapindex>';
};

export const buildPublicSitemapChunkXml = async (type: string, page = 1): Promise<string | null> => {
  const settings = await getSeoSettings();
  const chunkSize = Math.max(100, Math.min(5000, Number(settings.sitemap.chunkSize || 1000)));
  const safePage = Math.max(1, Math.floor(Number(page || 1)));
  if (type === 'static') {
    if (safePage !== 1) return null;
    return urlset(STATIC_SITEMAP_PATHS.map(path => ({ path })));
  }
  if (type === 'categories') {
    const categories = await loadCategoryRows();
    const offset = (safePage - 1) * chunkSize;
    if (offset >= categories.length && categories.length > 0) return null;
    const slice = categories.slice(offset, offset + chunkSize);
    return urlset(slice.map(row => ({ path: pathForRow('categories', row), updatedAt: row.updatedAt, image: settings.sitemap.includeImages ? row.image : '' })));
  }
  if (!(type in definitions)) return null;
  const dbType = type as Exclude<SitemapDbType, 'categories'>;
  const offset = (safePage - 1) * chunkSize;
  const total = await countDbRows(dbType);
  if (offset >= total && total > 0) return null;
  const rows = await loadDbRows(dbType, chunkSize, offset);
  return urlset(rows.map(row => ({ path: pathForRow(dbType, row), updatedAt: row.updatedAt, image: settings.sitemap.includeImages ? row.image : '' })));
};

export const buildPublicHtmlSitemap = async (): Promise<string> => {
  const settings = await getSeoSettings();
  if (!settings.sitemap.htmlEnabled) return '<!doctype html><meta charset="utf-8"><title>HTML Sitemap disabled</title>';
  const sections: string[] = [];
  sections.push('<section><h2>صفحات اصلی</h2><ul>' + STATIC_SITEMAP_PATHS.map(path => {
    const label = path === '/' ? 'صفحه اصلی' : path === '/shop' ? 'فروشگاه' : 'مجله';
    return '<li><a href="' + escapeXml(path) + '">' + escapeXml(label) + '</a></li>';
  }).join('') + '</ul></section>');

  const categories = await loadCategoryRows();
  sections.push('<section><h2>دسته‌بندی‌ها</h2><ul>' + categories.map(row =>
    '<li><a href="' + escapeXml(pathForRow('categories', row)) + '">' + escapeXml(row.label || row.slug) + '</a></li>'
  ).join('') + '</ul></section>');

  for (const type of ['products','articles','pages','brands','models'] as const) {
    const total = await countDbRows(type);
    const rows = await loadDbRows(type, Math.min(5000, Math.max(1, total)), 0);
    const title = type === 'products' ? 'محصولات' : type === 'articles' ? 'مقالات' : type === 'pages' ? 'صفحات' : type === 'brands' ? 'برندهای خودرو' : 'مدل‌های خودرو';
    sections.push('<section><h2>' + escapeXml(title) + '</h2><ul>' + rows.map(row =>
      '<li><a href="' + escapeXml(pathForRow(type, row)) + '">' + escapeXml(row.label || row.slug) + '</a></li>'
    ).join('') + '</ul></section>');
  }

  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="index,follow"><link rel="canonical" href="' +
    escapeXml(baseUrl() + '/sitemap.html') + '"><title>نقشه سایت | ' + escapeXml(settings.global.siteTitle) +
    '</title><style>body{font-family:system-ui;max-width:1100px;margin:auto;padding:32px;line-height:2}section{margin:24px 0}ul{columns:3}a{text-decoration:none}@media(max-width:700px){ul{columns:1}}</style></head><body><h1>نقشه سایت</h1>' +
    sections.join('') + '</body></html>';
};

export const buildPublicRobotsText = async (): Promise<string> => {
  const settings = await getSeoSettings();
  const lines = [
    'User-agent: *',
    settings.global.indexRobots ? 'Allow: /' : 'Disallow: /'
  ];
  if (settings.global.indexRobots) {
    lines.push(
      'Disallow: /admin',
      'Disallow: /account',
      'Disallow: /checkout',
      'Disallow: /tracking',
      'Disallow: /invoice',
      'Disallow: /cart',
      'Disallow: /wishlist',
      'Disallow: /compare',
      'Disallow: /part-request',
      'Disallow: /api/'
    );
  }
  if (settings.modules.sitemap) lines.push('Sitemap: ' + baseUrl() + '/sitemap.xml');
  if (settings.robots.extraRules.trim()) lines.push(settings.robots.extraRules.trim());
  return lines.join('\n');
};
