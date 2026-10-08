import fs from 'node:fs';

const file = 'scripts/test-e2e.cjs';
let source = fs.readFileSync(file, 'utf8');
let changed = false;

if (!source.includes('data-v30109-live-save-e2e')) {
  const oldBlock = `      const editArticles = page.getByRole('button', { name: /ویرایش بخش مقالات/ });
      await editArticles.waitFor({ state: 'visible', timeout: 15000 });
      await editArticles.click();`;
  if (!source.includes(oldBlock)) throw new Error('v30.10.9 live-save E2E edit trigger block missing.');
  const newBlock = `      // data-v30109-live-save-e2e: both classic and marketplace themes must expose the live editor.
      const marketplaceArticles = page.locator('.marketplace-rtl-home [data-section-key="articles"]');
      if (await marketplaceArticles.count()) {
        await page.locator('.marketplace-live-edit-toolbar').waitFor({ state: 'visible', timeout: 15000 });
        await marketplaceArticles.click();
      } else {
        const editArticles = page.getByRole('button', { name: /ویرایش بخش مقالات/ });
        await editArticles.waitFor({ state: 'visible', timeout: 15000 });
        await editArticles.click();
      }`;
  source = source.replace(oldBlock, newBlock);
  changed = true;
}

if (!source.includes('data-v30109-admin-session-e2e')) {
  const needle = `      await page.evaluate(() => window.sessionStorage.setItem('chinpart_live_edit_active', '1'));
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);`;
  if (!source.includes(needle)) throw new Error('v30.10.9 E2E live-edit navigation block missing.');
  const replacement = `      // data-v30109-admin-session-e2e: prove the authenticated admin session and
      // live-edit flag survive the document navigation before testing the toolbar.
      const sessionCookieName = String(process.env.SESSION_COOKIE_NAME || 'chinpart_session');
      const cookiesBeforeLiveEdit = await context.cookies(base);
      assert.ok(cookiesBeforeLiveEdit.some(cookie => cookie.name === sessionCookieName), 'Admin login cookie was not stored in the browser context.');
      const contextMeResponse = await context.request.get(base + '/api/auth/me');
      assert.equal(contextMeResponse.status(), 200, 'Admin session is not valid through BrowserContext request storage.');
      const contextMe = await contextMeResponse.json();
      assert.equal(contextMe.role, 'admin', 'BrowserContext session is not an admin session.');

      await page.evaluate(() => window.sessionStorage.setItem('chinpart_live_edit_active', '1'));
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);
      assert.equal(await page.evaluate(() => window.sessionStorage.getItem('chinpart_live_edit_active')), '1', 'Live-edit session flag was lost during storefront navigation.');
      const browserMe = await page.evaluate(async () => {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await response.json().catch(() => null);
        return { status: response.status, data };
      });
      assert.equal(browserMe.status, 200, 'Browser storefront cannot read the authenticated admin session: ' + JSON.stringify(browserMe.data));
      assert.equal(browserMe.data?.role, 'admin', 'Browser storefront session is not recognized as admin.');`;
  source = source.replace(needle, replacement);
  changed = true;
}

if (changed) {
  fs.writeFileSync(file, source);
  console.log('v30.10.9 browser E2E now verifies theme-aware live save and admin-session continuity.');
} else {
  console.log('v30.10.9 browser live-save/admin-session regression already current.');
}
