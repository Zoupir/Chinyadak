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

    const pagesMenu = page.getByRole('button', { name: /صفحه‌ساز دیداری|برگه‌ها و سکشن‌ها/ }).first();
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
    const title = String(homePage.title || '').trim();

    // Production Page Builder 3.0 uses a compact page picker. Prefer a native
    // combobox when present because its option value/text is deterministic.
    const comboboxes = page.getByRole('combobox');
    const comboCount = await comboboxes.count();
    for (let index = 0; index < comboCount; index += 1) {
      const combo = comboboxes.nth(index);
      if (!(await combo.isVisible().catch(() => false))) continue;
      const options = await combo.locator('option').evaluateAll(nodes => nodes.map(node => ({
        value: node.value,
        text: (node.textContent || '').trim()
      })));
      const match = options.find(option => option.value === homePage.id || option.value === 'home' || option.text === title || option.text.includes(title));
      if (match) {
        await combo.selectOption(match.value);
        await page.waitForTimeout(150);
        return;
      }
    }

    // The current production skin exposes a trigger labelled «برگه». Open it,
    // then choose the actual CMS home page by title/id rather than relying on
    // the canonical pre-build tab markup.
    const pagePickerTrigger = page.getByRole('button', { name: /^برگه$/ }).first();
    if (await pagePickerTrigger.isVisible().catch(() => false)) {
      await pagePickerTrigger.click();
      await page.waitForTimeout(150);

      const candidates = page.locator('[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], button, [data-page-id]');
      const candidateCount = await candidates.count();
      for (let index = 0; index < candidateCount; index += 1) {
        const candidate = candidates.nth(index);
        if (!(await candidate.isVisible().catch(() => false))) continue;
        const matches = await candidate.evaluate((element, expected) => {
          const text = (element.textContent || '').trim();
          const pageId = element.getAttribute('data-page-id') || element.getAttribute('data-value') || element.getAttribute('value') || '';
          return pageId === expected.id || pageId === 'home' || text === expected.title || text.includes(expected.title);
        }, { id: homePage.id, title }).catch(() => false);
        if (!matches) continue;
        await candidate.click();
        await page.waitForTimeout(150);
        return;
      }
    }

    // Last compatible path: older builds expose the page as a direct button.
    const direct = page.getByRole('button', { name: title, exact: false });
    const directCount = await direct.count();
    for (let index = 0; index < directCount; index += 1) {
      const candidate = direct.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) continue;
      await candidate.click();
      await page.waitForTimeout(150);
      return;
    }

    console.error('Page-builder comboboxes:', await page.locator('select').evaluateAll(nodes => nodes.map(node => ({
      value: node.value,
      html: node.outerHTML.slice(0, 1200)
    }))));
    console.error('Page-builder buttons:', await page.locator('button').allInnerTexts());
    console.error('Page-builder body:', (await page.locator('body').innerText()).slice(0, 6000));
    throw new Error(`Could not select CMS home page ${homePage.id} (${title}) in the production page builder.`);
  };

  const enterLiveHome = async () => {
    const pagesMenu = await ensureAdminDashboard();
    await pagesMenu.click();
    await selectHomePageBuilderTab();

    const inactiveToggle = page.getByRole('button', { name: /فعال‌سازی ویرایش زنده در سایت|ویرایش زنده در سایت/ }).first();
    const activeToggle = page.getByRole('button', { name: /حالت ویرایش زنده در سایت: فعال/ }).first();
    if (!(await activeToggle.isVisible().catch(() => false))) {
      await inactiveToggle.waitFor({ state: 'visible', timeout: 10000 });
      await inactiveToggle.click();
    }

    const section = page.locator('[data-section-key="featured-categories"]');
    if (await section.isVisible().catch(() => false)) return section;

    const viewSelectedPage = page.getByRole('button', { name: /^مشاهده در سایت$/ }).first();
    if (await viewSelectedPage.isVisible().catch(() => false)) {
      await viewSelectedPage.click();
    } else {
      const viewStore = page.getByRole('button', { name: /^مشاهده فروشگاه$/ }).first();
      await viewStore.waitFor({ state: 'visible', timeout: 8000 });
      await viewStore.click();
    }

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
