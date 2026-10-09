import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeRichHtml } from '../src/utils/richText';

const read = (file: string) => fs.readFileSync(file, 'utf8');

const pageView = read('src/components/page/PageView.tsx');
assert.match(pageView, /import \{ RichTextContent \} from ['"]\.\.\/common\/RichTextContent['"]/);
assert.ok(pageView.includes('<RichTextContent content={section.content}'), 'Page section rich text must use RichTextContent');
assert.ok(!/\{section\.content\s*\}/.test(pageView), 'PageView must not render section.content as plain React text');

const richCss = read('src/components/common/RichTextEditor.css');
assert.ok(richCss.includes('STOREFRONT-RICH-TEXT-PARITY-v301013'), 'Storefront rich text parity CSS marker missing');
assert.match(richCss, /\.rich-text-content h2/);
assert.match(richCss, /\.rich-text-content blockquote/);
assert.match(richCss, /\.rich-text-content ul/);

const richContent = read('src/components/common/RichTextContent.tsx');
assert.ok(richContent.includes('data-rich-text-content="1"'), 'Rich text runtime audit marker missing');

const richFixture = '<p style="text-align:center"><strong><span style="color:#e63236;font-size:24px">متن تست</span></strong></p><h2 style="text-align:left"><em>عنوان</em></h2><ul><li>یک</li><li>دو</li></ul><blockquote style="text-align:justify"><u>نقل قول</u></blockquote>';
const safeFixture = sanitizeRichHtml(richFixture);
assert.match(safeFixture, /text-align:center/);
assert.match(safeFixture, /color:#e63236!important/);
assert.match(safeFixture, /font-size:24px/);
assert.match(safeFixture, /<strong>/);
assert.match(safeFixture, /<h2 style="text-align:left">/);
assert.match(safeFixture, /<ul><li>یک<\/li><li>دو<\/li><\/ul>/);
assert.match(safeFixture, /<blockquote style="text-align:justify"><u>نقل قول<\/u><\/blockquote>/);

const store = read('src/context/StoreContext.tsx');
assert.ok(store.includes('const pagesRef = useRef<SitePage[]>([])'), 'Live editor synchronized pages ref missing');
assert.ok(store.includes('pagesRef.current.find(item => item.slug === pageSlug)'), 'Live editor saves must use latest page snapshot');
assert.ok(store.includes('PAGE_PERSISTENCE_MISMATCH'), 'Page persistence round-trip comparison missing');

const cms = read('src/server/routes/cms.ts');
assert.ok(cms.includes('PAGE_PERSIST_READBACK_FAILED'), 'Page DB readback verification missing');
assert.ok(cms.includes('SETTINGS_PERSIST_READBACK_FAILED'), 'Settings DB readback verification missing');
assert.match(cms, /SELECT id, data_json FROM site_pages WHERE id = \? LIMIT 1/);

const auditor = read('src/server/audit/site-audit.ts');
assert.ok(auditor.includes("const ENGINE_VERSION = '2.2.0';"), 'Site Auditor 2.2 engine missing');
assert.ok(auditor.includes('scanRichTextAndLiveEditorContracts(files, findings);'), 'Rich/live audit scanner missing');

// Exercise the real production API/DB round-trip when the smoke suite runs against the CI server.
const base = String(process.env.TEST_BASE_URL || '').replace(/\/$/, '');
const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '');
if (base && adminPassword) {
  const adminUser = String(process.env.ADMIN_BOOTSTRAP_USER || 'admin');
  const login = await fetch(base + '/api/auth/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base, 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ username: adminUser, password: adminPassword })
  });
  assert.equal(login.status, 200, `v30.10.13 admin login failed: ${login.status} ${await login.text()}`);
  const setCookie = login.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  assert.ok(cookie.includes('='), 'v30.10.13 admin session cookie missing');

  const bundleBeforeResponse = await fetch(base + '/api/cms/bundle', { headers: { cookie } });
  assert.equal(bundleBeforeResponse.status, 200, 'v30.10.13 CMS bundle preflight failed');
  const bundleBefore = await bundleBeforeResponse.json() as any;
  const page = (bundleBefore.pages || []).find((item: any) => item?.id && Array.isArray(item?.sections) && item.sections.length);
  assert.ok(page, 'v30.10.13 requires one persisted page with a section');
  const originalPage = JSON.parse(JSON.stringify(page));
  const target = page.sections[0];
  const probeHtml = '<p style="text-align:center"><strong><span style="color:#e63236;font-size:24px">AUDIT-RICH-TEXT-ROUNDTRIP</span></strong></p>';
  const probeWidth = Number(target.widthPercent) === 73 ? 74 : 73;
  const changedPage = {
    ...page,
    sections: page.sections.map((section: any) => section.id === target.id
      ? { ...section, content: probeHtml, widthPercent: probeWidth }
      : section)
  };

  try {
    const save = await fetch(base + `/api/cms/pages/${encodeURIComponent(page.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: base, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(changedPage)
    });
    assert.equal(save.status, 200, `v30.10.13 page save failed: ${save.status} ${await save.text()}`);
    const savedPayload = await save.json() as any;
    const savedSection = savedPayload.page?.sections?.find((section: any) => section.id === target.id);
    assert.equal(savedSection?.content, probeHtml, 'Page PUT response did not read back persisted rich text');
    assert.equal(Number(savedSection?.widthPercent), probeWidth, 'Page PUT response did not read back persisted layout width');

    const verifyResponse = await fetch(base + '/api/cms/bundle', { headers: { cookie }, cache: 'no-store' });
    assert.equal(verifyResponse.status, 200, 'v30.10.13 CMS bundle verification failed');
    const verify = await verifyResponse.json() as any;
    const verifiedPage = (verify.pages || []).find((item: any) => item.id === page.id);
    const verifiedSection = verifiedPage?.sections?.find((section: any) => section.id === target.id);
    assert.equal(verifiedSection?.content, probeHtml, 'Rich text did not survive DB reload');
    assert.equal(Number(verifiedSection?.widthPercent), probeWidth, 'Live-editor layout width did not survive DB reload');
  } finally {
    const restore = await fetch(base + `/api/cms/pages/${encodeURIComponent(originalPage.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: base, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(originalPage)
    });
    assert.equal(restore.status, 200, `v30.10.13 page restore failed: ${restore.status} ${await restore.text()}`);
  }
}

console.log('v30.10.13 rich text + live editor persistence smoke passed.');
