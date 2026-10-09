import assert from 'node:assert/strict';
import fs from 'node:fs';
import { markdownToSafeHtml, sanitizeRichHtml } from '../src/utils/richText';

const authored = '<p style="text-align:center !important"><strong><span style="color:#e63236 !important;font-size:18px !important">متن تست</span></strong> <a href="/test" style="color:#074493 !important">لینک</a></p>';
const once = sanitizeRichHtml(authored);
const twice = sanitizeRichHtml(once);

assert.equal(twice, once, 'rich text sanitizer must be idempotent across save/read/render roundtrips');
for (const token of [
  'text-align:center!important',
  'color:#e63236!important',
  'font-size:18px!important',
  '<strong>',
  'href="/test"',
  'color:#074493!important'
]) {
  assert.ok(once.includes(token), `roundtrip lost rich-text token: ${token}\n${once}`);
}

const legacy = '### تیتر قدیمی\n- **متن بولد**\n- [لینک](/test)';
const canonical = markdownToSafeHtml(legacy);
assert.ok(canonical.startsWith('<h4>'), 'legacy markdown must become canonical HTML');
assert.ok(canonical.includes('<strong>متن بولد</strong>'));
assert.ok(canonical.includes('href="/test"'));
assert.equal(markdownToSafeHtml(canonical), canonical, 'canonical HTML must not regress back to markdown');

const editor = fs.readFileSync('src/components/common/RichTextEditor.tsx', 'utf8');
const util = fs.readFileSync('src/utils/richText.ts', 'utf8');
assert.ok(editor.includes('RICH-TEXT-ROUNDTRIP-v301018'), 'editor roundtrip marker missing');
assert.ok(editor.includes('markdownToSafeHtml(sourceDraft'), 'source save must persist canonical HTML');
assert.ok(editor.includes('data-rich-editor-version="30.10.18"'), 'editor version marker missing');
assert.ok(util.includes('RICH-TEXT-ROUNDTRIP-v301018'), 'sanitizer roundtrip marker missing');
assert.equal((util.match(/const stripStylePriority =/g) || []).length, 1, 'duplicate stripStylePriority helper detected');
assert.equal((util.match(/const styleValue =/g) || []).length, 1, 'duplicate styleValue helper detected');

console.log('v30.10.18 smoke passed: Rich Text save/read/preview/storefront roundtrip remains canonical and styled.');
