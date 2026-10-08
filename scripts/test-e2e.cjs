const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const apiJson = async pathname => {
  const response = await fetch(base + pathname);
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  return response.json();
};

const waitForHydration = async page => {
  await page.waitForFunction(() => document.documentElement.dataset.contentRendering === 'server-hydrated', null, { timeout: 15000 });
  const role = await page.locator('#root').getAttribute('data-js-role');
  assert.equal(role, 'hydration-only', 'public root did not enter hydration-only mode');
};

const assertNoHorizontalOverflow = async (page, label) => {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  assert.ok(metrics.documentWidth <= metrics.viewport + 1, `${label}: document horizontal overflow ${metrics.documentWidth} > ${metrics.viewport}`);
  assert.ok(metrics.bodyWidth <= metrics.viewport + 1, `${label}: body horizontal overflow ${metrics.bodyWidth} > ${metrics.viewport}`);
};

(async () => {
  const catalog = await apiJson('/api/catalog/products');
  const categoriesPayload = await apiJson('/api/catalog/categories');
  const cms = await apiJson('/api/cms/bundle');
  const product = catalog.products.find(item => item?.id && item?.slug && (item?.sku || item?.oemNumber || item?.nameFa)) || catalog.products[0];
  const category = categoriesPayload.categories.find(item => item?.slug) || categoriesPayload.categories[0];
  const article = (cms.articles || []).find(item => item?.id && item?.slug) || (cms.articles || [])[0];
  assert.ok(product?.id && product?.slug, 'E2E requires a seeded product.');
  assert.ok(category?.slug, 'E2E requires a seeded category.');
  assert.ok(article?.id || article?.slug, 'E2E requires a seeded article.');

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error));

  try {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await assertNoHorizontalOverflow(page, 'desktop home');
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');

    const combobox = page.getByRole('combobox').first();
    await combobox.waitFor({ state: 'visible', timeout: 10000 });
    const searchTerm = String(product.sku || product.oemNumber || product.nameFa).trim();
    assert.ok(searchTerm.length >= 2, 'Seeded product search term is too short.');
    await combobox.fill(searchTerm);
    const firstOption = page.getByRole('option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await combobox.press('ArrowDown');
    await page.waitForTimeout(60);
    assert.ok(await combobox.getAttribute('aria-activedescendant'), 'Keyboard search did not expose an active descendant.');
    await combobox.press('Enter');
    await page.waitForURL(url => url.pathname.startsWith('/product/'), { timeout: 15000 });
    await waitForHydration(page);
    assert.ok(await page.locator('link[rel="canonical"]').count(), 'Product page canonical link missing in browser DOM.');
    assert.ok(await page.locator('script[type="application/ld+json"]').count(), 'Product page JSON-LD missing in browser DOM.');
    await assertNoHorizontalOverflow(page, 'desktop product');

    await page.goto(base + `/category/${encodeURIComponent(category.slug)}`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    assert.ok(await page.locator('link[rel="canonical"]').count(), 'Category canonical link missing.');
    await assertNoHorizontalOverflow(page, 'desktop category');

    await page.goto(base + `/article/${encodeURIComponent(article.slug || article.id)}`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    assert.ok(await page.getByRole('heading', { level: 1 }).count(), 'Article H1 missing.');
    await assertNoHorizontalOverflow(page, 'desktop article');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await assertNoHorizontalOverflow(page, 'mobile home');

    const hamburger = page.locator('.marketplace-ref-hamburger');
    await hamburger.waitFor({ state: 'visible', timeout: 10000 });
    await hamburger.click();
    const drawer = page.getByRole('dialog', { name: 'منوی سایت' });
    await drawer.waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await hamburger.getAttribute('aria-expanded'), 'true', 'Mobile menu trigger did not expose expanded state.');
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'detached', timeout: 5000 });
    assert.equal(await hamburger.getAttribute('aria-expanded'), 'false', 'Escape did not close the mobile menu.');

    await page.setViewportSize({ width: 360, height: 800 });
    await assertNoHorizontalOverflow(page, '360px home');

    if (pageErrors.length) {
      throw new Error('Browser page errors: ' + pageErrors.map(error => error.stack || error.message || String(error)).join('\n---\n'));
    }

    console.log('Stage 8 real browser E2E passed: SSR/hydration, keyboard search, product/category/article routes, RTL responsiveness and mobile menu Escape behavior.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
