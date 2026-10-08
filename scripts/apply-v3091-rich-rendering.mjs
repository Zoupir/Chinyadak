import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

// Sanitized author alignment is part of the content contract. It needs
// priority over global RTL/theme text-align declarations.
edit('src/utils/richText.ts', source => {
  if (source.includes("text-align:' + align[1].toLowerCase() + '!important'")) return source;
  const next = source.replace(
    /if \(align\) safe\.push\('text-align:' \+ align\[1\]\.toLowerCase\(\)\);/,
    "if (align) safe.push('text-align:' + align[1].toLowerCase() + '!important');"
  );
  if (next === source) throw new Error('v30.9.1 sanitizer alignment marker missing');
  return next;
});

// Generic CMS pages previously escaped the HTML produced by RichTextEditor.
edit('src/components/page/PageView.tsx', source => {
  if (!source.includes("import { RichTextContent } from '../common/RichTextContent';")) {
    const marker = "import { LiveSectionModal } from '../common/LiveSectionModal';\n";
    if (!source.includes(marker)) throw new Error('v30.9.1 PageView import marker missing');
    source = source.replace(marker, marker + "import { RichTextContent } from '../common/RichTextContent';\n");
  }

  source = source.replace(
    /<p className="([^"]*?)whitespace-pre-line([^"]*?)">\{item\.content\}<\/p>/g,
    (_m, a, b) => `<RichTextContent content={item.content} className="${`${a}${b}`.replace(/\s+/g, ' ').trim()}" />`
  );
  source = source.replace(
    /<div className="([^"]*?)whitespace-pre-line([^"]*?)">\s*\{section\.content\}\s*<\/div>/g,
    (_m, a, b) => `<RichTextContent content={section.content} className="${`${a}${b}`.replace(/\s+/g, ' ').trim()}" />`
  );

  if (!source.includes('<RichTextContent content={section.content}') || !source.includes('<RichTextContent content={item.content}')) {
    throw new Error('v30.9.1 PageView rich renderer patch incomplete');
  }
  return source;
});

// v30.5.2 already upgraded the generated footer to a block RichTextContent
// renderer with independent position/text-alignment controls. Keep that richer
// structure, mark it as the v30.9.1 contract, and only fall back to converting
// legacy inline/plain variants when an older installation reaches this patch.
edit('src/components/layout/Footer.tsx', source => {
  // Legacy helper fallback.
  source = source.replace(
    /const renderCopyright = \(text: string\) => <RichTextContent content=\{text\}\s+inline[^;]*;/,
    `const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-copyright-rich" />;`
  );

  // Current generated footer: preserve media/icon/position controls and add a
  // marker to every copyright rich-text container.
  source = source.replace(
    /<div className="marketplace-ref-footer-copyright"(?![^>]*data-footer-rich-text)([^>]*)>/g,
    `<div className="marketplace-ref-footer-copyright" data-footer-rich-text="30.9.1"$1>`
  );

  // Very old marketplace fallback.
  source = source.replace(
    /<span className="marketplace-ref-footer-copyright">\{renderCopyright\(([\s\S]*?)\)\}<\/span>/g,
    (_match, expression) => `<div className="marketplace-ref-footer-copyright" data-footer-rich-text="30.9.1">{renderCopyright(${expression})}</div>`
  );

  // Very old classic fallback where the copyright was rendered as plain text.
  source = source.replace(
    /<p>\s*\{settings\.footerCopyrightText \|\|[\s\S]*?\}\s*<\/p>/g,
    `<div className="min-w-0 flex-1" data-footer-rich-text="30.9.1">\n            {renderCopyright(settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`)}\n          </div>`
  );

  if (!source.includes('data-footer-rich-text="30.9.1"')) {
    throw new Error('v30.9.1 footer rich rendering marker missing');
  }
  if (/renderCopyright = .*\binline\b/.test(source)) {
    throw new Error('v30.9.1 footer still flattens rich text');
  }
  return source;
});

// The generated v30.5.2 footer has a text-alignment selector that deliberately
// uses !important. v30.9.1 makes authored paragraph alignment inline-important,
// which correctly outranks that stylesheet rule. Do not delete the footer-level
// default; just record the new cascade contract and normalize rich block width.
edit('src/index.css', source => {
  if (!source.includes('/* v30.9.1 footer rich alignment */')) {
    source += `\n\n/* v30.9.1 footer rich alignment */\n.marketplace-ref-footer-copyright .footer-copyright-rich,\n.marketplace-ref-footer-copyright .footer-rich-copyright { max-width: 100%; }\n.marketplace-ref-footer-copyright .footer-copyright-rich > :first-child,\n.marketplace-ref-footer-copyright .footer-rich-copyright > :first-child { margin-top: 0; }\n.marketplace-ref-footer-copyright .footer-copyright-rich > :last-child,\n.marketplace-ref-footer-copyright .footer-rich-copyright > :last-child { margin-bottom: 0; }\n`;
  }
  return source;
});

// Do not claim success before the backend confirms the settings write.
edit('src/components/admin/AdminFooterTab.tsx', source => {
  if (!source.includes('const handleSaveAll = async () =>')) {
    source = source.replace('  const handleSaveAll = () => {', '  const handleSaveAll = async () => {');
    source = source.replace('    updateSettings({', '    const saved = await updateSettings({');
    source = source.replace(
      /    showToast\('تنظیمات فوتر، ستون‌ها و نمادهای اعتماد با موفقیت ذخیره گردید\.'\);/,
      `    if (saved) showToast('تنظیمات فوتر و قالب‌بندی متن با موفقیت روی سرور ذخیره شد.');\n    else showToast('ذخیره تنظیمات فوتر روی سرور انجام نشد؛ تغییرات اعمال نشده‌اند.', 'error');`
    );
  }
  if (!source.includes('const handleSaveAll = async () =>') || !source.includes('const saved = await updateSettings({')) {
    throw new Error('v30.9.1 footer persistence patch incomplete');
  }
  return source;
});

console.log('v30.9.1 rich rendering/persistence:', changed.length ? changed.join(', ') : 'already satisfied');
