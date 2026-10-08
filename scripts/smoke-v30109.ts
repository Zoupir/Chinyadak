import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = (file: string) => fs.readFileSync(file, 'utf8');

const composer = source('src/components/common/RichTextComposer.tsx');
assert.match(composer, /from 'quill'/);
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
assert.match(publicStore, /fetch\('\/api\/auth\/me'/);
assert.match(publicStore, /const persistPublicPage = async/);
assert.match(publicStore, /updateSection,/);
assert.match(publicStore, /previewSection,/);
assert.doesNotMatch(publicStore, /updateSection: noop/);

const pkg = JSON.parse(source('package.json'));
assert.equal(pkg.version, '30.10.9');
assert.ok(pkg.dependencies?.quill);

console.log('v30.10.9 product editor, Quill selection and live-save smoke passed.');
