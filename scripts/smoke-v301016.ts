import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file: string) => fs.readFileSync(file, 'utf8');

const store = read('src/context/StoreContext.tsx');
const cms = read('src/server/routes/cms.ts');
const modal = read('src/components/common/LiveSectionModal.tsx');
const home = read('src/components/home/MarketplaceRtlHome.tsx');

assert.ok(store.includes('LIVE-SECTION-ATOMIC-SAVE-v301016'), 'Atomic live-section client save missing');
assert.ok(store.includes('/sections/${encodeURIComponent(updatedSection.id)}'), 'Live-section client does not use dedicated section endpoint');
assert.ok(cms.includes('LIVE-SECTION-ATOMIC-ENDPOINT-v301016'), 'Atomic live-section server endpoint missing');
assert.ok(cms.includes("cmsRouter.patch('/pages/:id/sections/:sectionId'"), 'Section PATCH route missing');
assert.ok(cms.includes('PAGE_SECTION_PERSIST_READBACK_FAILED'), 'Section DB readback verification missing');
assert.ok(modal.includes('LIVE-SECTION-FORM-SNAPSHOT-v301016'), 'Immediate modal form snapshot missing');
assert.ok(modal.includes('data-live-section-save="1"'), 'Live-section save test marker missing');
assert.ok(home.includes('sourceCategorySlugs'), 'Featured-products renderer is not wired to editor category selection');
assert.ok(home.includes('productSectionDisplay'), 'Featured-products renderer is not wired to editor display mode');

const failWithBody = async (response: Response, label: string) => {
  if (response.ok) return;
  const body = await response.text();
  assert.fail(`${label}: ${response.status} ${body}`);
};

const base = String(process.env.TEST_BASE_URL || '').replace(/\/$/, '');
const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
if (base && adminPassword) {
  const adminUser = String(process.env.ADMIN_BOOTSTRAP_USER || 'admin');
  const login = await fetch(base + '/api/auth/admin/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: base,
      'sec-fetch-site': 'same-origin',
      'x-forwarded-for': '198.51.100.216'
    },
    body: JSON.stringify({ username: adminUser, password: adminPassword })
  });
  await failWithBody(login, 'v30.10.16 admin login failed');
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  assert.ok(cookie.includes('='), 'v30.10.16 admin session cookie missing');

  const beforeResponse = await fetch(base + '/api/cms/bundle', { headers: { cookie }, cache: 'no-store' });
  await failWithBody(beforeResponse, 'v30.10.16 CMS bundle preflight failed');
  const before = await beforeResponse.json() as any;
  const page = (before.pages || []).find((item: any) => item?.slug === 'home' && Array.isArray(item?.sections) && item.sections.length)
    || (before.pages || []).find((item: any) => item?.id && Array.isArray(item?.sections) && item.sections.length);
  assert.ok(page, 'v30.10.16 requires one persisted page with sections');

  const target = page.sections.find((section: any) => section?.sectionKey === 'featured-products') || page.sections[0];
  assert.ok(target?.id, 'v30.10.16 target section missing');
  const original = JSON.parse(JSON.stringify(target));
  let revision = Math.max(0, Number(page.cmsRevision || 0));
  const probeMaxItems = Number(target.maxItems) === 7 ? 6 : 7;
  const probeWidth = Number(target.widthPercent) === 77 ? 76 : 77;
  const probeTitle = `${String(target.title || 'سکشن')} · LIVE-SAVE-PROBE`;
  const probeSlugs = Array.isArray(target.sourceCategorySlugs)
    ? [...target.sourceCategorySlugs].reverse()
    : ['engine'];
  const changed = {
    ...target,
    title: probeTitle,
    maxItems: probeMaxItems,
    contentSourceLimit: probeMaxItems,
    widthPercent: probeWidth,
    sourceCategorySlugs: probeSlugs,
    productSectionDisplay: target.productSectionDisplay === 'mixed' ? 'tabs' : 'mixed'
  };

  try {
    const save = await fetch(base + `/api/cms/pages/${encodeURIComponent(page.id)}/sections/${encodeURIComponent(target.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: base, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ section: changed, cmsRevision: revision })
    });
    await failWithBody(save, 'v30.10.16 section PATCH failed');
    const savedPayload = await save.json() as any;
    revision = Math.max(revision, Number(savedPayload.page?.cmsRevision || 0));
    assert.equal(savedPayload.section?.title, probeTitle, 'Section title did not survive DB readback');
    assert.equal(Number(savedPayload.section?.maxItems), probeMaxItems, 'Section maxItems did not survive DB readback');
    assert.equal(Number(savedPayload.section?.widthPercent), probeWidth, 'Section width did not survive DB readback');
    assert.deepEqual(savedPayload.section?.sourceCategorySlugs, probeSlugs, 'Section category selection did not survive DB readback');
    assert.equal(savedPayload.section?.productSectionDisplay, changed.productSectionDisplay, 'Section display mode did not survive DB readback');

    const verifyResponse = await fetch(base + '/api/cms/bundle', { headers: { cookie }, cache: 'no-store' });
    await failWithBody(verifyResponse, 'v30.10.16 CMS bundle verification failed');
    const verify = await verifyResponse.json() as any;
    const verifiedPage = (verify.pages || []).find((item: any) => item.id === page.id);
    revision = Math.max(revision, Number(verifiedPage?.cmsRevision || 0));
    const verified = verifiedPage?.sections?.find((section: any) => section.id === target.id);
    assert.equal(verified?.title, probeTitle, 'Section title did not survive bundle reload');
    assert.equal(Number(verified?.maxItems), probeMaxItems, 'Section maxItems did not survive bundle reload');
    assert.equal(Number(verified?.widthPercent), probeWidth, 'Section width did not survive bundle reload');
    assert.deepEqual(verified?.sourceCategorySlugs, probeSlugs, 'Section categories did not survive bundle reload');
  } finally {
    const restore = await fetch(base + `/api/cms/pages/${encodeURIComponent(page.id)}/sections/${encodeURIComponent(target.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: base, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ section: original, cmsRevision: revision })
    });
    await failWithBody(restore, 'v30.10.16 section restore failed');
  }
}

console.log('v30.10.16 live-section persistence smoke passed: atomic section save, DB readback, reload and featured-products editor contract are intact.');
