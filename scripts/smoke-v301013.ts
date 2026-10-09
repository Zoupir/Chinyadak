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

console.log('v30.10.13 rich text + live editor persistence smoke passed.');
