import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeRichHtml } from '../src/utils/richText';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('src/components/admin/AdminView.tsx'), /data-v30108-product-loader/);
assert.match(source('src/components/admin/AdminView.tsx'), /fetch\('\/api\/catalog\/products\/' \+ encodeURIComponent\(targetId\)/);
assert.match(source('src/components/admin/AdminView.tsx'), /data-product-editor-loading="1"/);
const composer = source('src/components/common/RichTextComposer.tsx');
const legacyStableEditor = /data-stable-rich-editor="30\.10\.8"/.test(composer);
const quillEditor = /data-quill-rich-editor="30\.10\.9"/.test(composer);
assert.ok(legacyStableEditor || quillEditor, 'Expected the 30.10.8 replacement editor or its 30.10.9 Quill successor.');
if (legacyStableEditor) {
  assert.match(composer, /document\.execCommand\('styleWithCSS'/);
  assert.match(composer, /onPaste=\{onPaste\}/);
} else {
  assert.match(composer, /from 'quill'/);
  assert.match(composer, /getSemanticHTML/);
  assert.doesNotMatch(composer, /document\.execCommand/);
}
assert.doesNotMatch(composer, /@tiptap\//);

const styled = sanitizeRichHtml('<p style="color:#ff0000;background-color:#fff3bf;font-size:24px;font-weight:bold;font-style:italic;text-decoration:underline;text-align:center;font-family:Vazirmatn;line-height:2">متن تست</p>');
for (const marker of [
  'color:#ff0000!important',
  'background-color:#fff3bf!important',
  'font-size:24px!important',
  'font-weight:bold!important',
  'font-style:italic!important',
  'text-decoration:underline!important',
  'text-align:center!important',
  'font-family:Vazirmatn!important',
  'line-height:2!important'
]) assert.ok(styled.includes(marker), `Rich text sanitizer lost explicit style: ${marker}\n${styled}`);

const json = async <T>(path: string): Promise<T> => {
  const response = await fetch(base + path);
  const text = await response.text();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return JSON.parse(text) as T;
};

const run = async () => {
  const catalog = await json<{ products: any[]; total: number }>('/api/catalog/products?limit=1&offset=0');
  assert.ok(catalog.products[0]?.id, 'No active product available for standalone editor loader test.');
  const id = String(catalog.products[0].id);
  const direct = await json<{ product: any }>('/api/catalog/products/' + encodeURIComponent(id));
  assert.equal(String(direct.product.id), id, 'Direct product endpoint did not return requested product.');
  assert.ok(direct.product.nameFa, 'Direct product payload is incomplete.');
  console.log('v30.10.8 product-editor regression passed with current rich editor implementation.');
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
