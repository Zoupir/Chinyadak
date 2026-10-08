import fs from 'node:fs';

const changed = [];
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => { fs.writeFileSync(file, value); changed.push(file); };
const edit = (file, transform) => {
  const before = read(file);
  const after = transform(before);
  if (after !== before) write(file, after);
};

const copyTemplate = (template, target) => {
  const next = read(template);
  const before = fs.existsSync(target) ? read(target) : '';
  if (before !== next) write(target, next);
};

copyTemplate('scripts/templates/v30108-rich-text-composer.tsx.txt', 'src/components/common/RichTextComposer.tsx');

edit('src/components/common/RichTextEditor.tsx', source =>
  source.replace('data-rich-editor-version="30.5.3"', 'data-rich-editor-version="30.10.8"')
);

edit('src/utils/richText.ts', source => {
  source = source.replace(
    "  'TD', 'TH', 'SPAN', 'HR', 'IMG', 'AUDIO', 'VIDEO'",
    "  'TD', 'TH', 'SPAN', 'DIV', 'HR', 'IMG', 'AUDIO', 'VIDEO'"
  );
  source = source.replace(
    "  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(tagName)) {",
    "  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'DIV', 'LI', 'TD', 'TH'].includes(tagName)) {"
  );
  source = source.replace(
    "    if (align) safe.push('text-align:' + align[1].toLowerCase());",
    "    if (align) safe.push('text-align:' + align[1].toLowerCase() + '!important');"
  );
  source = source.replace(
    "  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(tagName)) {",
    "  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'DIV', 'LI', 'TD', 'TH'].includes(tagName)) {"
  );
  source = source.replace(
    "    const decoration = style.match(/(?:^|;)\\s*text-decoration(?:-line)?\\s*:\\s*(none|underline|line-through|underline\\s+line-through|line-through\\s+underline)\\s*(?:;|$)/i);",
    "    const decoration = style.match(/(?:^|;)\\s*text-decoration(?:-line)?\\s*:\\s*(none|underline|line-through|underline\\s+line-through|line-through\\s+underline)\\s*(?:;|$)/i);\n    const fontFamily = style.match(/(?:^|;)\\s*font-family\\s*:\\s*([^;]+)/i);\n    const lineHeight = style.match(/(?:^|;)\\s*line-height\\s*:\\s*([^;]+)/i);"
  );
  source = source.replace(
    "    if (safeBackground) safe.push('background-color:' + safeBackground);",
    "    if (safeBackground) safe.push('background-color:' + safeBackground + '!important');"
  );
  source = source.replace(
    "      safe.push('font-size:' + fontSize[1].trim().toLowerCase());",
    "      safe.push('font-size:' + fontSize[1].trim().toLowerCase() + '!important');"
  );
  source = source.replace(
    "    if (fontWeight) safe.push('font-weight:' + fontWeight[1].toLowerCase());\n    if (fontStyle) safe.push('font-style:' + fontStyle[1].toLowerCase());\n    if (decoration) safe.push('text-decoration:' + decoration[1].toLowerCase().replace(/\\s+/g, ' '));",
    "    if (fontWeight) safe.push('font-weight:' + fontWeight[1].toLowerCase() + '!important');\n    if (fontStyle) safe.push('font-style:' + fontStyle[1].toLowerCase() + '!important');\n    if (decoration) safe.push('text-decoration:' + decoration[1].toLowerCase().replace(/\\s+/g, ' ') + '!important');\n    if (fontFamily) {\n      const family = fontFamily[1].trim().replace(/[\\\"']/g, '');\n      if (/^(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace)$/i.test(family)) safe.push('font-family:' + family + '!important');\n    }\n    if (lineHeight && /^(?:1(?:\\.\\d{1,2})?|2(?:\\.\\d{1,2})?|3(?:\\.0{1,2})?)$/.test(lineHeight[1].trim())) {\n      safe.push('line-height:' + lineHeight[1].trim() + '!important');\n    }"
  );
  if (!source.includes("'DIV', 'HR'")) throw new Error('v30.10.8 sanitizer DIV support missing');
  if (!source.includes('font-family:') || !source.includes('line-height:')) throw new Error('v30.10.8 sanitizer typography support missing');
  return source;
});

edit('src/components/common/RichTextEditor.css', source => {
  if (source.includes('/* v30.10.8 stable editor */')) return source;
  return source + `

/* v30.10.8 stable editor */
.stable-rich-editor .rich-text-toolbar {
  position: sticky;
  top: 0;
  z-index: 8;
}

.stable-rich-editor__surface {
  min-height: 180px;
  caret-color: #111827;
  unicode-bidi: plaintext;
}

.stable-rich-editor__surface:empty::before {
  content: attr(data-placeholder);
  color: #a3a3a3;
  pointer-events: none;
  float: right;
}

.stable-rich-editor__surface:focus {
  outline: none;
}

.rich-text-editor__surface :where(span, p, div, li, h2, h3, h4, blockquote),
.rich-text-content :where(span, p, div, li, h2, h3, h4, blockquote) {
  max-width: 100%;
}

.rich-text-content :where(h2, h3, h4, blockquote),
.rich-text-editor__surface :where(h2, h3, h4, blockquote) {
  color: inherit;
}

.rich-text-content :where(ul, ol),
.rich-text-editor__surface :where(ul, ol) {
  margin-block: .65em;
  padding-inline-start: 1.6em;
}

.rich-text-content :where(p, div, li, h2, h3, h4, blockquote)[style],
.rich-text-editor__surface :where(p, div, li, h2, h3, h4, blockquote)[style] {
  white-space: normal;
}

@media (max-width: 640px) {
  .stable-rich-editor .rich-text-toolbar {
    max-height: 180px;
    overflow-y: auto;
  }
}
`;
});

edit('src/components/admin/AdminView.tsx', source => {
  const effectPattern = /  const handledProductTargetRef = useRef\(''\);[\s\S]*?\n  \}, \[initialTarget, standaloneProductTarget, products\]\);/;
  if (!effectPattern.test(source) && !source.includes('data-v30108-product-loader')) {
    throw new Error('v30.10.8 standalone product target effect not found');
  }
  if (!source.includes('data-v30108-product-loader')) {
    source = source.replace(effectPattern, `  // data-v30108-product-loader: dedicated editor tabs must load their exact product,\n  // not rely on whichever catalog page happened to be loaded in a fresh browser tab.\n  const [standaloneProductLoading, setStandaloneProductLoading] = useState(false);\n  const [standaloneProductLoadError, setStandaloneProductLoadError] = useState('');\n  const handledProductTargetRef = useRef('');\n  useEffect(() => {\n    const targetId = standaloneProductTarget || (initialTarget?.startsWith('product:') ? initialTarget.slice('product:'.length) : '');\n    if (!targetId) {\n      handledProductTargetRef.current = '';\n      setStandaloneProductLoadError('');\n      setStandaloneProductLoading(false);\n      return;\n    }\n    if (handledProductTargetRef.current === targetId) return;\n\n    setActiveTab('products');\n    const localMatch = products.find(product => product.id === targetId || product.slug === targetId);\n    if (localMatch) {\n      handledProductTargetRef.current = targetId;\n      productBaselineRef.current = editorSnapshot(localMatch);\n      setEditingProduct({ ...localMatch });\n      setStandaloneProductLoadError('');\n      return;\n    }\n\n    if (!standaloneProductTarget) return;\n    handledProductTargetRef.current = targetId;\n    let cancelled = false;\n    setStandaloneProductLoading(true);\n    setStandaloneProductLoadError('');\n    void fetch('/api/catalog/products/' + encodeURIComponent(targetId), { credentials: 'include' })\n      .then(async response => {\n        const data = await response.json().catch(() => ({}));\n        if (!response.ok || !data?.product) throw new Error(data?.error || 'PRODUCT_NOT_FOUND');\n        return data.product as Product;\n      })\n      .then(product => {\n        if (cancelled) return;\n        productBaselineRef.current = editorSnapshot(product);\n        setEditingProduct({ ...product });\n      })\n      .catch(error => {\n        if (cancelled) return;\n        console.error('Standalone product editor load failed:', error);\n        setStandaloneProductLoadError('محصول برای ویرایش بارگذاری نشد. صفحه را دوباره باز کنید یا به فهرست محصولات برگردید.');\n      })\n      .finally(() => {\n        if (!cancelled) setStandaloneProductLoading(false);\n      });\n    return () => { cancelled = true; };\n  }, [initialTarget, standaloneProductTarget, products]);`);
  }

  const view3Marker = `  // =========================================================================\n  // VIEW 3: FULL ENTERPRISE ADMIN DASHBOARD WITH DEDICATED VERTICAL SIDEBAR`;
  if (!source.includes('data-product-editor-loading="1"')) {
    const index = source.indexOf(view3Marker);
    if (index < 0) throw new Error('v30.10.8 admin dashboard marker missing');
    const fallback = `  if (isStandaloneProductEditor && !editingProduct) {\n    return (\n      <div className=\"min-h-screen bg-neutral-50 grid place-items-center p-6\" data-product-editor-loading=\"1\" dir=\"rtl\">\n        <div className=\"w-full max-w-xl bg-white border border-neutral-200 rounded-3xl p-8 text-center shadow-sm\">\n          {standaloneProductLoading ? (\n            <>\n              <RefreshCw className=\"w-8 h-8 mx-auto text-red-600 animate-spin\" />\n              <h1 className=\"mt-4 text-lg font-black\">در حال بارگذاری محصول…</h1>\n              <p className=\"mt-2 text-xs text-neutral-500\">اطلاعات کامل محصول مستقیماً از سرور دریافت می‌شود.</p>\n            </>\n          ) : (\n            <>\n              <AlertTriangle className=\"w-8 h-8 mx-auto text-amber-500\" />\n              <h1 className=\"mt-4 text-lg font-black\">ویرایش محصول باز نشد</h1>\n              <p className=\"mt-2 text-xs text-neutral-500\">{standaloneProductLoadError || 'محصول موردنظر پیدا نشد.'}</p>\n              <button type=\"button\" onClick={() => window.location.assign('/admin')} className=\"mt-5 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold\">بازگشت به پنل مدیریت</button>\n            </>\n          )}\n        </div>\n      </div>\n    );\n  }\n\n`;
    source = source.slice(0, index) + fallback + source.slice(index);
  }

  if (!source.includes('data-v30108-product-loader') || !source.includes('data-product-editor-loading="1"')) {
    throw new Error('v30.10.8 product editor loader patch incomplete');
  }
  return source;
});

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-stable-rich-editor="30.10.8"'],
  ['src/components/common/RichTextComposer.tsx', "document.execCommand('styleWithCSS'"],
  ['src/components/common/RichTextComposer.tsx', 'onPaste={onPaste}'],
  ['src/utils/richText.ts', 'font-family:'],
  ['src/utils/richText.ts', 'line-height:'],
  ['src/components/admin/AdminView.tsx', 'data-v30108-product-loader'],
  ['src/components/admin/AdminView.tsx', 'data-product-editor-loading="1"'],
  ['src/components/common/RichTextEditor.css', 'v30.10.8 stable editor']
];
for (const [file, marker] of checks) {
  if (!read(file).includes(marker)) throw new Error(`v30.10.8 hotfix incomplete: ${file} :: ${marker}`);
}

console.log(changed.length ? `v30.10.8 editor/product hotfix applied: ${changed.join(', ')}` : 'v30.10.8 editor/product hotfix already satisfied.');
