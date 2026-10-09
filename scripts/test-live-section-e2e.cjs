const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const adminUser = String(process.env.ADMIN_BOOTSTRAP_USER || 'admin');
const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');

const waitForHydration = async page => {
  await page.waitForFunction(() => document.documentElement.dataset.contentRendering === 'server-hydrated', null, { timeout: 15000 });
  const role = await page.locator('#root').getAttribute('data-js-role');
  assert.equal(role, 'hydration-only', 'public root did not enter hydration-only mode');
};

(async () => {
  if (!adminPassword) {
    console.log('Live section browser regression skipped: ADMIN_BOOTSTRAP_PASSWORD is not configured.');
    return;
  }

  const bootstrapCmsResponse = await fetch(base + '/api/cms/bundle');
  assert.equal(bootstrapCmsResponse.status, 200, `CMS bootstrap failed: ${bootstrapCmsResponse.status}`);
  const bootstrapCms = await bootstrapCmsResponse.json();
  const homePage = (bootstrapCms.pages || []).find(page => page?.slug === 'home');
  assert.ok(homePage?.id, 'Live section E2E requires the home CMS page.');

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error));

  const ensureAdminDashboard = async () => {
    await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });

    // StoreProvider restores the HttpOnly admin session asynchronously. Give it a
    // deterministic signal instead of assuming the first AdminView render is ready.
    const pagesMenu = page.getByRole('button', { name: /برگه‌ها و سکشن‌ها/ }).first();
    const loginButton = page.getByRole('button', { name: /احراز هویت و ورود به کنترل پنل/ }).first();

    try {
      await Promise.race([
        pagesMenu.waitFor({ state: 'visible', timeout: 15000 }),
        loginButton.waitFor({ state: 'visible', timeout: 15000 })
      ]);
    } catch (error) {
      console.error('Admin buttons after session restore:', await page.locator('button').allInnerTexts());
      console.error('Admin body after session restore:', (await page.locator('body').innerText()).slice(0, 4000));
      throw error;
    }

    if (await loginButton.isVisible().catch(() => false)) {
      const loginForm = loginButton.locator('xpath=ancestor::form');
      const fields = loginForm.locator('input');
      await fields.nth(0).fill(adminUser);
      await fields.nth(1).fill(adminPassword);
      await loginButton.click();
      await pagesMenu.waitFor({ state: 'visible', timeout: 15000 });
    }
    return pagesMenu;
  };

  const selectHomePageBuilderTab = async () => {
    const slug = page.getByText('slug: /home', { exact: true });
    if (await slug.isVisible().catch(() => false)) return;

    const candidates = page.locator('button').filter({ hasText: String(homePage.title || 'صفحه اصلی') });
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      if (!(await candidate.isVisible())) continue;
      await candidate.click();
      if (await slug.isVisible().catch(() => false)) break;
    }
    await slug.waitFor({ state: 'visible', timeout: 10000 });
  };

  const enterLiveHome = async () => {
    const pagesMenu = await ensureAdminDashboard();
    await pagesMenu.click();
    await page.getByRole('heading', { name: /مدیریت برگه‌ها و سکشن‌ها/ }).waitFor({ state: 'visible', timeout: 10000 });
    await selectHomePageBuilderTab();

    const liveToggle = page.getByRole('button', { name: /ویرایش زنده در سایت/ }).first();
    await liveToggle.waitFor({ state: 'visible', timeout: 10000 });
    await liveToggle.click();

    const viewSite = page.getByRole('button', { name: /مشاهده در سایت/ }).first();
    await viewSite.waitFor({ state: 'visible', timeout: 10000 });
    await viewSite.click();

    const section = page.locator('[data-section-key="featured-categories"]');
    await section.waitFor({ state: 'visible', timeout: 15000 });
    return section;
  };

  const openFeaturedCategoriesEditor = async () => {
    const section = page.locator('[data-section-key="featured-categories"]');
    await section.waitFor({ state: 'visible', timeout: 10000 });
    await section.click({ position: { x: 24, y: 24 } });
    const modal = page.locator('[data-live-section-modal="1"]');
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    return modal;
  };

  try {
    const login = await context.request.post(base + '/api/auth/admin/login', {
      data: { username: adminUser, password: adminPassword },
      headers: { origin: base, 'sec-fetch-site': 'same-origin' }
    });
    assert.equal(login.status(), 200, `Admin live-section E2E login failed: ${login.status()} ${await login.text()}`);

    await enterLiveHome();
    let modal = await openFeaturedCategoriesEditor();

    const limit = modal.locator('[data-section-field="contentSourceLimit"]');
    await limit.waitFor({ state: 'visible', timeout: 5000 });
    await limit.fill('2');

    await modal.getByRole('button', { name: /چیدمان/ }).click();
    const desktopColumns = modal.locator('[data-section-field="desktopColumns"]');
    const widthPercent = modal.locator('[data-section-field="widthPercent"]');
    await desktopColumns.waitFor({ state: 'visible', timeout: 5000 });
    await desktopColumns.selectOption('6');
    await widthPercent.fill('73');

    await modal.locator('[data-live-section-save="1"]').click();
    await modal.waitFor({ state: 'detached', timeout: 12000 });

    let renderedSection = page.locator('[data-section-key="featured-categories"]');
    await renderedSection.waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await renderedSection.evaluate(element => element.style.width), '73%', 'live preview did not consume widthPercent=73');
    assert.equal(
      (await renderedSection.evaluate(element => element.style.getPropertyValue('--builder-cols'))).trim(),
      '6',
      'live preview did not consume desktopColumns=6'
    );
    assert.equal(await renderedSection.locator('.marketplace-round-list > button').count(), 2, 'live preview did not consume contentSourceLimit=2');

    const savedCmsResponse = await context.request.get(base + '/api/cms/bundle');
    assert.equal(savedCmsResponse.status(), 200, `CMS readback failed: ${savedCmsResponse.status()}`);
    const savedCms = await savedCmsResponse.json();
    const savedHome = (savedCms.pages || []).find(item => item?.slug === 'home');
    const savedSection = savedHome?.sections?.find(section => section?.sectionKey === 'featured-categories');
    assert.ok(savedSection, 'saved featured-categories section missing from CMS readback');
    assert.equal(Number(savedSection.contentSourceLimit), 2, 'DB readback lost contentSourceLimit=2');
    assert.equal(Number(savedSection.maxItems), 2, 'DB readback lost maxItems=2');
    assert.equal(Number(savedSection.desktopColumns), 6, 'DB readback lost desktopColumns=6');
    assert.equal(Number(savedSection.widthPercent), 73, 'DB readback lost widthPercent=73');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    renderedSection = page.locator('[data-section-key="featured-categories"]');
    await renderedSection.waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await renderedSection.evaluate(element => element.style.width), '73%', 'public reload lost widthPercent=73');
    assert.equal(
      (await renderedSection.evaluate(element => element.style.getPropertyValue('--builder-cols'))).trim(),
      '6',
      'public reload lost desktopColumns=6'
    );
    assert.equal(await renderedSection.locator('.marketplace-round-list > button').count(), 2, 'public reload lost contentSourceLimit=2');

    await enterLiveHome();
    modal = await openFeaturedCategoriesEditor();
    assert.equal(await modal.locator('[data-section-field="contentSourceLimit"]').inputValue(), '2', 'editor reload lost contentSourceLimit=2');
    await modal.getByRole('button', { name: /چیدمان/ }).click();
    assert.equal(await modal.locator('[data-section-field="desktopColumns"]').inputValue(), '6', 'editor reload rewrote desktopColumns=6');
    assert.equal(await modal.locator('[data-section-field="widthPercent"]').inputValue(), '73', 'editor reload lost widthPercent=73');
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'detached', timeout: 5000 });

    if (pageErrors.length) {
      throw new Error('Live section browser errors: ' + pageErrors.map(error => error.stack || error.message || String(error)).join('\n---\n'));
    }

    console.log('Live section E2E passed: modal edit -> live renderer -> DB readback -> public reload -> admin reload preserved exact section configuration.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
