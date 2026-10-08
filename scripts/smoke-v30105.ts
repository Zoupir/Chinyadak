import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../src/server/db';
import { loadEntity, getSeoSettings, writeAppSetting } from '../src/server/seo/platform';
import { normalizeHreflangEntries } from '../src/server/seo/technical';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('server.ts'), /buildPublicSitemapIndexXml/);
assert.match(source('server.ts'), /shouldRedirectToCanonicalSeoPath/);
assert.match(source('server.ts'), /sitemap-\(static\|products\|articles\|categories\|pages\|brands\|models\)/);
assert.match(source('src/server/seo.ts'), /urlTemplate: baseUrl\(\) \+ '\/shop\?q=\{search_term_string\}'/);
assert.match(source('src/server/seo.ts'), /LimitedAvailability/);
assert.match(source('src/server/seo.ts'), /datePublished: safeIsoDate/);
assert.match(source('src/server/seo.ts'), /normalizeHreflangEntries/);
assert.match(source('src/server/seo/platform.ts'), /Cross-entity diversity is intentional/);
assert.match(source('src/server/seo/public.ts'), /p\.slug NOT IN \('home','part-request'\)/);
assert.match(source('src/components/shop/ShopView.tsx'), /normalizeShopSearch/);
assert.match(source('src/components/shop/ShopView.tsx'), /query: searchQuery \|\| undefined/);

const get = async (path: string, expected = 200, redirect: RequestRedirect = 'follow') => {
  const response = await fetch(base + path, { redirect });
  const text = await response.text();
  if (response.status !== expected) throw new Error(`GET ${path}: expected ${expected}, got ${response.status}: ${text.slice(0, 500)}`);
  return { response, text };
};

const jsonData = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object') return value as Record<string, any>;
  try { return JSON.parse(String(value || '{}')); } catch { return {}; }
};

const schemasFromHtml = (html: string): any[] => Array.from(html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  .flatMap(match => {
    try {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });

const run = async () => {
  const settingsBefore = await getSeoSettings();
  await writeAppSetting('takrank_seo_settings', {
    ...settingsBefore,
    global: { ...settingsBefore.global, indexRobots: true },
    modules: { ...settingsBefore.modules, meta: true, schema: true, sitemap: true, hreflang: true }
  });

  try {
    const homeRedirect = await get('/page/home?utm_source=stage6', 308, 'manual');
    assert.equal(homeRedirect.response.headers.get('location'), '/?utm_source=stage6');
    const homeAlias = await get('/home', 308, 'manual');
    assert.equal(homeAlias.response.headers.get('location'), '/');
    const aboutAlias = await get('/page/about', 308, 'manual');
    assert.equal(aboutAlias.response.headers.get('location'), '/about');

    const missing = await get('/stage6-this-route-must-not-exist', 404);
    assert.match(missing.text, /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i);

    const robots = await get('/robots.txt');
    assert.match(robots.text, /Disallow: \/cart/);
    assert.match(robots.text, /Disallow: \/wishlist/);
    assert.match(robots.text, /Disallow: \/compare/);
    assert.match(robots.text, /Disallow: \/part-request/);
    assert.match(robots.text, new RegExp('Sitemap: ' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/sitemap\\.xml'));

    const sitemapIndex = await get('/sitemap.xml');
    assert.match(sitemapIndex.text, /sitemap-static-1\.xml/);
    assert.match(sitemapIndex.text, /sitemap-products-1\.xml/);
    assert.match(sitemapIndex.text, /sitemap-categories-1\.xml/);

    const staticMap = await get('/sitemap-static-1.xml');
    assert.ok(staticMap.text.includes(`<loc>${base}</loc>`) || staticMap.text.includes(`<loc>${base}/</loc>`));
    assert.ok(staticMap.text.includes(`<loc>${base}/shop</loc>`));
    assert.ok(staticMap.text.includes(`<loc>${base}/blog</loc>`));

    if (/sitemap-pages-1\.xml/.test(sitemapIndex.text)) {
      const pageMap = await get('/sitemap-pages-1.xml');
      assert.doesNotMatch(pageMap.text, /\/page\/home(?:<|%)/);
      assert.doesNotMatch(pageMap.text, /\/page\/part-request(?:<|%)/);
      assert.doesNotMatch(pageMap.text, /\/page\/about(?:<|%)/);
    }

    const [categoryRows] = await pool.query<Array<RowDataPacket & { data_json: any }>>(
      'SELECT data_json FROM categories WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 100'
    );
    let nestedSlug = '';
    const findNested = (nodes: any[]): string => {
      for (const node of nodes || []) {
        if (node?.slug) return String(node.slug);
        const deeper = findNested(node?.subcategories || []);
        if (deeper) return deeper;
      }
      return '';
    };
    for (const row of categoryRows) {
      nestedSlug = findNested(jsonData(row.data_json).subcategories || []);
      if (nestedSlug) break;
    }
    if (nestedSlug) {
      const categoryMap = await get('/sitemap-categories-1.xml');
      assert.ok(categoryMap.text.includes('/category/' + encodeURIComponent(nestedSlug)), `Nested category missing from sitemap: ${nestedSlug}`);
    }

    const homepage = await get('/');
    const homeSchemas = schemasFromHtml(homepage.text);
    const website = homeSchemas.find(schema => schema?.['@type'] === 'WebSite');
    assert(website, 'WebSite schema missing from homepage.');
    assert.equal(website.potentialAction?.['@type'], 'SearchAction');
    assert.equal(website.potentialAction?.target?.urlTemplate, `${base}/shop?q={search_term_string}`);

    const [productRows] = await pool.query<Array<RowDataPacket & { slug: string; data_json: any }>>(
      "SELECT slug, data_json FROM products WHERE status = 'active' ORDER BY updated_at DESC LIMIT 100"
    );
    const priced = productRows.map(row => ({ row, data: jsonData(row.data_json) })).find(item => Number(item.data.price || item.data.discountPrice || 0) > 0);
    assert(priced, 'No priced active product available for Product schema test.');
    const productPage = await get('/product/' + encodeURIComponent(String(priced!.row.slug)));
    const productSchema = schemasFromHtml(productPage.text).find(schema => ['Product','ProductGroup'].includes(schema?.['@type']));
    assert(productSchema, 'Product schema missing.');
    const regular = Math.max(0, Number(priced!.data.price || 0));
    const discount = Math.max(0, Number(priced!.data.discountPrice || 0));
    const expectedToman = discount > 0 && (regular <= 0 || discount < regular) ? discount : regular;
    assert.equal(productSchema.offers?.priceCurrency, 'IRR');
    assert.equal(Number(productSchema.offers?.price), expectedToman * 10);
    assert.ok([
      'https://schema.org/InStock',
      'https://schema.org/LimitedAvailability',
      'https://schema.org/OutOfStock'
    ].includes(productSchema.offers?.availability));
    assert.equal(productSchema.offers?.seller?.['@id'], base + '/#organization');

    const [articleRows] = await pool.query<Array<RowDataPacket & { slug: string }>>(
      'SELECT slug FROM articles WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1'
    );
    if (articleRows[0]?.slug) {
      const articlePage = await get('/article/' + encodeURIComponent(String(articleRows[0].slug)));
      const articleSchema = schemasFromHtml(articlePage.text).find(schema => ['Article','BlogPosting','TechArticle','NewsArticle'].includes(schema?.['@type']));
      assert(articleSchema, 'Article schema missing.');
      assert.ok(articleSchema.datePublished, 'Article datePublished missing.');
      assert.ok(articleSchema.dateModified, 'Article dateModified missing.');
      assert.equal(articleSchema.mainEntityOfPage?.['@type'], 'WebPage');
    }

    const homeEntity = await loadEntity('page', 'home');
    assert(homeEntity, 'Home CMS entity missing.');
    assert.equal(homeEntity!.url, '/');

    const hreflang = normalizeHreflangEntries([
      { lang: 'fa_IR', url: base + '/page/home?utm_source=x' },
      { lang: 'fa-IR', url: base + '/home' },
      { lang: 'x-default', url: base + '/page/home' },
      { lang: '<bad>', url: base + '/shop' },
      { lang: 'en', url: 'javascript:alert(1)' }
    ], base, true);
    assert.deepEqual(hreflang, [
      { lang: 'fa-IR', url: base },
      { lang: 'x-default', url: base }
    ]);

    console.log('v30.10.5 stage 6 technical SEO/URL architecture smoke passed.');
  } finally {
    await writeAppSetting('takrank_seo_settings', settingsBefore);
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end().catch(() => undefined);
});
