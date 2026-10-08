import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const origin = new URL(base).origin;
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('src/context/StoreContext.tsx'), /const addProduct = async/);
assert.match(source('src/context/StoreContext.tsx'), /const updateProduct = async/);
assert.match(source('src/context/StoreContext.tsx'), /const addArticle = async/);
assert.match(source('src/context/StoreContext.tsx'), /const updateArticle = async/);
assert.match(source('src/context/StoreContext.tsx'), /discardSectionPreview/);
assert.match(source('src/components/common/LiveSectionModal.tsx'), /mode\?: 'edit' \| 'create'/);
assert.match(source('src/components/common/LiveSectionModal.tsx'), /useDialogFocusTrap/);
assert.match(source('src/components/common/LiveSectionModal.tsx'), /useUnsavedChangesGuard/);
assert.match(source('src/components/admin/AdminPagesTab.tsx'), /handleDropSection/);
assert.match(source('src/components/admin/AdminPagesTab.tsx'), /<LiveSectionModal/);
assert.match(source('src/components/admin/AdminArticlesTab.tsx'), /isArticleSaving/);
assert.match(source('src/components/admin/AdminView.tsx'), /isProductSaving/);

const headers = (cookie?: string): Record<string, string> => ({
  'content-type': 'application/json',
  origin,
  'sec-fetch-site': 'same-origin',
  ...(cookie ? { cookie } : {})
});

const json = async <T>(path: string, init: RequestInit = {}, expected = 200): Promise<{ response: Response; data: T }> => {
  const response = await fetch(base + path, init);
  const text = await response.text();
  if (response.status !== expected) throw new Error(`${init.method || 'GET'} ${path}: expected ${expected}, got ${response.status}: ${text}`);
  return { response, data: text ? JSON.parse(text) as T : {} as T };
};

const run = async () => {
  const login = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      username: process.env.ADMIN_BOOTSTRAP_USER || 'admin',
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD || ''
    })
  });
  const cookie = String(login.response.headers.get('set-cookie') || '').split(';')[0];
  assert(cookie, 'Admin session cookie missing.');

  const id = `page-stage4-${randomUUID()}`;
  const slug = `stage4-${randomUUID().slice(0, 8)}`;
  const initial = {
    id,
    slug,
    title: 'Stage 4 CMS test',
    description: 'revision test',
    isSystem: false,
    updatedAt: '',
    sections: [
      { id: `${id}-b`, title: 'B', isVisible: true, order: 99 },
      { id: `${id}-a`, title: 'A', isVisible: true, order: 12 }
    ]
  };

  const created = await json<{ page: any }>(`/api/cms/pages/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: headers(cookie), body: JSON.stringify(initial)
  });
  assert.equal(created.data.page.cmsRevision, 1);
  assert.deepEqual(created.data.page.sections.map((section: any) => section.order), [1, 2]);

  const secondDraft = {
    ...created.data.page,
    title: 'Stage 4 CMS test updated',
    sections: [...created.data.page.sections].reverse()
  };
  const updated = await json<{ page: any }>(`/api/cms/pages/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: headers(cookie), body: JSON.stringify(secondDraft)
  });
  assert.equal(updated.data.page.cmsRevision, 2);
  assert.equal(updated.data.page.title, 'Stage 4 CMS test updated');
  assert.deepEqual(updated.data.page.sections.map((section: any) => section.order), [1, 2]);

  const stale = await json<{ error: string; currentPage: any }>(`/api/cms/pages/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: headers(cookie), body: JSON.stringify({ ...created.data.page, title: 'stale write' })
  }, 409);
  assert.equal(stale.data.error, 'CMS_PAGE_REVISION_CONFLICT');
  assert.equal(stale.data.currentPage.cmsRevision, 2);

  const bundle = await json<{ pages: any[] }>('/api/cms/bundle');
  const persisted = bundle.data.pages.find(page => page.id === id);
  assert(persisted, 'Saved page missing from CMS bundle.');
  assert.equal(persisted.cmsRevision, 2);
  assert.equal(persisted.title, 'Stage 4 CMS test updated');

  await json(`/api/cms/pages/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: headers(cookie)
  });

  console.log('v30.10.3 stage 4 CMS/admin/live-editor smoke passed.');
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
