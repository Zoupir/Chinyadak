const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
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

    const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
    if (adminPassword) {
      const adminUser = String(process.env.ADMIN_BOOTSTRAP_USER || 'admin');
      const login = await context.request.post(base + '/api/auth/admin/login', {
        data: { username: adminUser, password: adminPassword },
        headers: { origin: base, 'sec-fetch-site': 'same-origin' }
      });
      assert.equal(login.status(), 200, `Admin E2E login failed: ${login.status()} ${await login.text()}`);

      // The core-owned source audit endpoint must be permission protected and return a structured report.
      const auditResponse = await context.request.get(base + '/api/audit/site-audit');
      assert.equal(auditResponse.status(), 200, `Site audit API failed: ${auditResponse.status()} ${await auditResponse.text()}`);
      const auditReport = await auditResponse.json();
      assert.ok(Number(auditReport.scannedFiles) > 0, 'Site audit did not scan source files.');
      assert.ok(Number(auditReport.routeInventorySize) > 0, 'Site audit did not build a route inventory.');
      assert.ok(Array.isArray(auditReport.findings), 'Site audit findings are not an array.');

      // Install the real first-party auditor ZIP through the same extension API used by production.
      execFileSync(process.execPath, ['scripts/build-site-auditor.mjs'], { cwd: process.cwd(), stdio: 'pipe' });
      const auditorManifest = JSON.parse(fs.readFileSync('extensions/site-auditor/plugin.json', 'utf8'));
      const auditorVersion = String(auditorManifest.version || '').trim();
      assert.match(auditorVersion, /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/, 'Site Auditor manifest version is invalid.');
      const auditorZipName = `site-auditor-${auditorVersion}.zip`;
      const auditorZip = fs.readFileSync(`tmp/${auditorZipName}`);
      const installAuditor = await context.request.post(base + '/api/extensions/install', {
        multipart: {
          kind: 'plugin',
          file: { name: auditorZipName, mimeType: 'application/zip', buffer: auditorZip }
        },
        headers: { origin: base, 'sec-fetch-site': 'same-origin' }
      });
      assert.equal(installAuditor.status(), 201, `Site Auditor install failed: ${installAuditor.status()} ${await installAuditor.text()}`);
      const activateAuditor = await context.request.post(base + '/api/extensions/plugin/site-auditor/activate', {
        headers: { origin: base, 'sec-fetch-site': 'same-origin' }
      });
      assert.equal(activateAuditor.status(), 200, `Site Auditor activation failed: ${activateAuditor.status()} ${await activateAuditor.text()}`);

      // Extension manager must be reachable from the normal admin sidebar; no manual URL entry.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
      const extensionMenu = page.getByRole('button', { name: /افزونه‌ها و قالب‌های نصبی/ });
      await extensionMenu.waitFor({ state: 'visible', timeout: 15000 });
      await extensionMenu.click();
      await page.getByRole('heading', { name: 'افزونه‌ها و قالب‌های نصبی' }).waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await page.getByRole('button', { name: 'افزونه‌ها' }).count(), 'Integrated plugin tab is missing.');
      assert.ok(await page.getByRole('button', { name: 'قالب‌ها' }).count(), 'Integrated theme tab is missing.');
      assert.ok(await page.locator('input[type="file"][accept*="zip"]').count(), 'Integrated ZIP installer input is missing.');

      // The installed plugin must register its own admin menu and render a real audit report.
      await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
      const auditorMenu = page.getByRole('button', { name: /ممیزی و تشخیص تداخل/ });
      await auditorMenu.waitFor({ state: 'visible', timeout: 15000 });
      await auditorMenu.click();
      await page.getByRole('heading', { name: 'ممیزی جامع سایت' }).waitFor({ state: 'visible', timeout: 15000 });
      assert.ok(await page.getByText('کل موارد').count(), 'Auditor summary cards did not render.');
      assert.ok(await page.getByRole('button', { name: 'خروجی JSON' }).count(), 'Auditor JSON export action is missing.');
      assert.ok(await page.getByRole('button', { name: 'گزارش متنی' }).count(), 'Auditor text export action is missing.');

      await page.goto(base + `/admin/product-edit/${encodeURIComponent(product.id)}`, { waitUntil: 'domcontentloaded' });
      const productEditor = page.locator('[data-product-editor-page="1"]');
      await productEditor.waitFor({ state: 'visible', timeout: 15000 });
      assert.equal(await page.locator('[data-product-editor-loading="1"]').count(), 0, 'Standalone product editor remained on loading/error shell.');

      const stableEditor = page.locator('[data-stable-rich-editor="30.10.8"]').first();
      await stableEditor.waitFor({ state: 'visible', timeout: 10000 });
      const surface = stableEditor.locator('.stable-rich-editor__surface');
      assert.equal(await surface.getAttribute('dir'), 'rtl', 'Persian editor surface is not RTL.');

      await surface.fill('سلام دنیا');
      await surface.press('End');
      await surface.press('Backspace');
      assert.equal((await surface.innerText()).trim(), 'سلام دنی', 'Backspace/caret behavior is broken in Persian text.');
      await surface.type('ا');
      assert.equal((await surface.innerText()).trim(), 'سلام دنیا', 'Persian typing order/caret restoration is broken.');

      await page.keyboard.press('Control+A');
      await stableEditor.getByRole('button', { name: 'پررنگ' }).click();
      const color = stableEditor.locator('input[type="color"]').first();
      await color.fill('#d11a2a');
      let editorHtml = await surface.evaluate(node => node.innerHTML);
      assert.match(editorHtml, /(font-weight\s*:\s*700|<b\b|<strong\b)/i, 'Replacement editor did not apply bold formatting to selected text.');
      assert.match(editorHtml, /color\s*:\s*(?:rgb\(209,\s*26,\s*42\)|#d11a2a)/i, 'Replacement editor did not apply selected text color.');

      await page.keyboard.press('Control+A');
      await stableEditor.getByLabel('نوع پاراگراف').selectOption('h2');
      editorHtml = await surface.evaluate(node => node.innerHTML);
      assert.match(editorHtml, /<h2\b/i, 'Heading control did not convert the selected paragraph to H2.');
      await page.keyboard.press('Control+A');
      await stableEditor.getByRole('button', { name: 'وسط‌چین' }).click();
      editorHtml = await surface.evaluate(node => node.innerHTML);
      assert.match(editorHtml, /text-align\s*:\s*center/i, 'Alignment control did not apply center alignment.');

      assert.ok(await stableEditor.getByRole('button', { name: 'راست‌چین' }).count(), 'Replacement editor alignment toolbar missing.');
      assert.ok(await stableEditor.getByLabel('اندازه متن').count(), 'Replacement editor font-size control missing.');
    }

    if (pageErrors.length) {
      throw new Error('Browser page errors: ' + pageErrors.map(error => error.stack || error.message || String(error)).join('\n---\n'));
    }

    console.log('Real browser E2E passed: storefront routes, responsive menus, extension manager, Site Auditor install/activation/report, product editor and Persian rich-text behavior.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
