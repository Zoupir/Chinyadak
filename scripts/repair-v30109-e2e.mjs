import fs from 'node:fs';

const file = 'scripts/test-e2e.cjs';
let source = fs.readFileSync(file, 'utf8');
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
  fs.writeFileSync(file, source);
  console.log('v30.10.9 browser live-save regression supports marketplace/classic themes.');
} else {
  console.log('v30.10.9 browser live-save regression already theme-aware.');
}
