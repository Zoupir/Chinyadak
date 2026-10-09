import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = (file: string) => fs.readFileSync(file, 'utf8');

const composer = source('src/components/common/RichTextComposer.tsx');
assert.match(composer, /await import\('quill'\)/);
assert.doesNotMatch(composer, /^import Quill from 'quill';/m);
assert.match(composer, /import '\.\/quill-vendor\.css'/);
assert.match(composer, /data-quill-rich-editor="30\.10\.9"/);
assert.match(composer, /getSemanticHTML/);
assert.match(composer, /attributors\/style\/align/);
assert.match(composer, /attributors\/style\/color/);
assert.doesNotMatch(composer, /document\.execCommand/);

const admin = source('src/components/admin/AdminView.tsx');
assert.match(admin, /data-view-product-button="1"/);
assert.match(admin, /fixed inset-x-0 top-16 bottom-0/);
assert.match(admin, /window\.open\('\/product\/'/);

const live = source('src/components/common/LiveSectionModal.tsx');
assert.match(live, /data-live-section-save="1"/);
assert.doesNotMatch(live, /عنوان سکشن الزامی است/);

const publicStore = source('src/server/ssr-store-context.tsx');
assert.match(publicStore, /data-v30109-public-admin-session/);
assert.match(publicStore, /data-v30109-live-edit-session/);
assert.match(publicStore, /data-v30109-live-edit-restore-lock/);
assert.match(publicStore, /liveEditRestorePendingRef\.current && requestedLiveEditRef\.current && next === false/, 'Live-edit restore lock is missing.');
assert.match(publicStore, /data-v30109-admin-validation-unlocks-live-edit/);
assert.match(publicStore, /chinpart_live_edit_active/);
assert.match(publicStore, /fetch\('\/api\/auth\/me'/);
assert.match(publicStore, /const persistPublicPage = async/);
assert.match(publicStore, /updateSection,/);
assert.match(publicStore, /previewSection,/);
assert.doesNotMatch(publicStore, /updateSection: noop/);

const marketplace = source('src/components/home/MarketplaceRtlHome.tsx');
assert.match(marketplace, /data-v30109-marketplace-section-map/);
assert.match(marketplace, /articles:\s*'sec-articles'/);
assert.match(marketplace, /sectionKey \? sectionForKey\(sectionKey\) : undefined/);
assert.doesNotMatch(marketplace, /homeSections\.find\(item => item\.sectionKey === sectionKey\)/);

const pagesAdmin = source('src/components/admin/AdminPagesTab.tsx');
assert.match(pagesAdmin, /data-v30109-admin-live-edit-session/);
assert.match(pagesAdmin, /sessionStorage\.setItem\('chinpart_live_edit_active'/);

const pkg = JSON.parse(source('package.json'));
assert.equal(pkg.version, '30.10.9');
assert.equal(pkg.dependencies?.quill, '2.0.2');

console.log('v30.10.9 product editor, SSR-safe Quill selection and admin-to-store live-save smoke passed.');
