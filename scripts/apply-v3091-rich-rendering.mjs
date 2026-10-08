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

  // Handle the compact one-line variants too.
  source = source.replace(
    /<p className="([^"]*)">\{item\.content\}<\/p>/g,
    (m, classes) => m.includes('RichTextContent') ? m : `<RichTextContent content={item.content} className="${classes}" />`
  );

  if (!source.includes('<RichTextContent content={section.content}') || !source.includes('<RichTextContent content={item.content}')) {
    throw new Error('v30.9.1 PageView rich renderer patch incomplete');
  }
  return source;
});

// Footer copyright must remain block rich text. The former inline mode stripped
// every paragraph tag and therefore stripped paragraph alignment as well.
edit('src/components/layout/Footer.tsx', source => {
  source = source.replace(
    /const renderCopyright = \(text: string\) => <RichTextContent content=\{text\}[^;]*;/,
    `const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-rich-copyright" />;`
  );

  source = source.replace(
    /<span className="marketplace-ref-footer-copyright">\{renderCopyright\(([\s\S]*?)\)\}<\/span>/g,
    (_match, expression) => `<div className="marketplace-ref-footer-copyright" data-footer-rich-text="30.9.1">{renderCopyright(${expression})}</div>`
  );

  // Classic layout used a plain React text node, so all HTML appeared as text
  // or lost formatting. Replace only the copyright paragraph.
  source = source.replace(
    /<p>\s*\{settings\.footerCopyrightText \|\|[\s\S]*?\}\s*<\/p>/g,
    `<div className="min-w-0 flex-1" data-footer-rich-text="30.9.1">\n            {renderCopyright(settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`)}\n          </div>`
  );

  if (!source.includes('data-footer-rich-text="30.9.1"')) {
    throw new Error('v30.9.1 footer rich rendering patch incomplete');
  }
  if (/renderCopyright = .*\binline\b/.test(source)) {
    throw new Error('v30.9.1 footer still flattens rich text');
  }
  return source;
});

// Remove footer CSS that forcibly overrides authored alignment. Footer-level
// alignment remains the default, but a paragraph formatted in the editor wins.
edit('src/index.css', source => {
  source = source.replace(
    /(\.marketplace-ref-footer-copyright\s*\{[^}]*?)\s*text-align:\s*center\s*!important;([^}]*\})/g,
    '$1$2'
  );
  source = source.replace(
    /(html\[data-layout="atelier-rtl"\]\s+\.marketplace-ref-footer-copyright\s*\{[^}]*?)\s*text-align:\s*center\s*;([^}]*\})/g,
    '$1$2'
  );

  if (!source.includes('/* v30.9.1 footer rich alignment */')) {
    source += `\n\n/* v30.9.1 footer rich alignment */\n:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="right"] .marketplace-ref-footer-copyright { text-align: right; }\n:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="center"] .marketplace-ref-footer-copyright { text-align: center; }\n:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="left"] .marketplace-ref-footer-copyright { text-align: left; }\n.marketplace-ref-footer-copyright .footer-rich-copyright { width: 100%; }\n.marketplace-ref-footer-copyright .footer-rich-copyright > :first-child { margin-top: 0; }\n.marketplace-ref-footer-copyright .footer-rich-copyright > :last-child { margin-bottom: 0; }\n`;
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
