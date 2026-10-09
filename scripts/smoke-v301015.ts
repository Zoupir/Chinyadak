import assert from 'node:assert/strict';
import fs from 'node:fs';
import { markdownToSafeHtml, sanitizeRichHtml } from '../src/utils/richText';

const styled = sanitizeRichHtml(`
<ul>
  <li style="text-align:center !important;color:#e63236 !important;background-color:#fff3bf !important;font-size:18px !important;font-weight:700 !important;font-style:italic !important;text-decoration:underline !important;font-family:Vazirmatn !important;line-height:2.2 !important">
    <a href="/test" style="color:#e63236 !important;font-weight:700 !important">متن آزمایشی</a>
  </li>
</ul>`);

for (const token of [
  'text-align:center!important',
  'color:#e63236!important',
  'background-color:#fff3bf!important',
  'font-size:18px!important',
  'font-weight:700!important',
  'font-style:italic!important',
  'text-decoration:underline!important',
  'font-family:Vazirmatn!important',
  'line-height:2.2!important',
  'href="/test"'
]) {
  assert.ok(styled.includes(token), `sanitizer lost authored rich-text style: ${token}\n${styled}`);
}

const legacy = markdownToSafeHtml('### ویژگی‌های روغن ایده‌آل:\n- **تمام سنتتیک**\n- [لینک تست](/test)');
assert.ok(legacy.includes('<h4>ویژگی‌های روغن ایده‌آل:</h4>'));
assert.ok(legacy.includes('<ul>'));
assert.ok(legacy.includes('<strong>تمام سنتتیک</strong>'));
assert.ok(legacy.includes('href="/test"'));

const editor = fs.readFileSync('src/components/common/RichTextEditor.tsx', 'utf8');
const css = fs.readFileSync('src/components/common/RichTextEditor.css', 'utf8');
const composer = fs.readFileSync('src/components/common/RichTextComposer.tsx', 'utf8');

assert.ok(editor.includes('RICH-TEXT-CANONICAL-HTML-v301015'), 'editor does not normalize legacy Markdown into canonical HTML');
assert.ok(editor.includes('markdownToSafeHtml(sourceDraft'), 'source tab can still persist non-canonical Markdown');
assert.ok(css.includes('STOREFRONT-RICH-TEXT-FIDELITY-v301015'), 'storefront rich-text fidelity CSS missing');
assert.ok(composer.includes("block.style.setProperty('text-align', alignment, 'important')"), 'deterministic block alignment writer missing');

console.log('v30.10.15 rich-text fidelity smoke passed: alignment, color, bold, link, typography and canonical HTML are preserved.');
