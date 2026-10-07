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

const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`v30.5.2 patch target missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const appendOnce = (source, marker, block) => source.includes(marker) ? source : source + block;

const insertAfterCopyrightEditor = (source, block) => {
  if (source.includes('data-copyright-layout-controls="1"')) return source;
  const editorMarker = 'data-rich-copyright-editor="1"';
  const start = source.indexOf(editorMarker);
  if (start < 0) throw new Error('v30.5.2 patch target missing: migrated copyright editor');
  const valueAt = source.indexOf('value={footerCopyrightText}', start);
  if (valueAt < 0) throw new Error('v30.5.2 patch target missing: copyright editor value');
  const editorEnd = source.indexOf('/>', valueAt);
  if (editorEnd < 0) throw new Error('v30.5.2 patch target missing: copyright editor close');
  const wrapperEnd = source.indexOf('</div>', editorEnd);
  if (wrapperEnd < 0) throw new Error('v30.5.2 patch target missing: copyright editor wrapper');
  const at = wrapperEnd + '</div>'.length;
  return source.slice(0, at) + '\n\n' + block + source.slice(at);
};

// Settings contract for the copyright block.
edit('src/types/index.ts', source => {
  const old = `  footerBottomAlign?: 'right' | 'center' | 'left';\n`;
  const next = `  footerBottomAlign?: 'right' | 'center' | 'left';\n  footerCopyrightPosition?: 'right' | 'center' | 'left';\n  footerCopyrightTextAlign?: 'right' | 'center' | 'left';\n  footerCopyrightImageUrl?: string;\n  footerCopyrightImageAlt?: string;\n  footerCopyrightImageWidthPx?: number;\n  footerCopyrightImagePlacement?: 'before' | 'after';\n  footerCopyrightIcon?: 'none' | 'ShieldCheck' | 'Wrench' | 'CheckCircle' | 'Package' | 'Zap';\n  footerCopyrightIconColor?: string;\n  footerCopyrightIconSizePx?: number;\n  footerCopyrightIconPlacement?: 'before' | 'after';\n`;
  return replaceOnce(source, old, next, 'copyright settings type fields');
});

// Explicit editor colors are authored content. Make them strong enough to win
// against old theme rules that use !important, while keeping the sanitizer safe.
edit('src/utils/richText.ts', source => {
  source = replaceOnce(
    source,
    `  const value = input.trim();`,
    `  const value = input.trim().replace(/\\s*!important\\s*$/i, '');`,
    'safe color important normalization'
  );
  source = replaceOnce(
    source,
    `    if (safeTextColor) safe.push('color:' + safeTextColor);`,
    `    if (safeTextColor) safe.push('color:' + safeTextColor + '!important');`,
    'explicit rich text color priority'
  );
  return source;
});

// Admin controls: block position, text alignment, image and icon.
edit('src/components/admin/AdminFooterTab.tsx', source => {
  source = replaceOnce(
    source,
    `  const [footerBottomAlign, setFooterBottomAlign] = useState<'right'|'center'|'left'>(settings.footerBottomAlign || 'center');\n`,
    `  const [footerBottomAlign, setFooterBottomAlign] = useState<'right'|'center'|'left'>(settings.footerBottomAlign || 'center');\n  const [footerCopyrightPosition, setFooterCopyrightPosition] = useState<'right'|'center'|'left'>(settings.footerCopyrightPosition || 'center');\n  const [footerCopyrightTextAlign, setFooterCopyrightTextAlign] = useState<'right'|'center'|'left'>(settings.footerCopyrightTextAlign || 'right');\n  const [footerCopyrightImageUrl, setFooterCopyrightImageUrl] = useState(settings.footerCopyrightImageUrl || '');\n  const [footerCopyrightImageAlt, setFooterCopyrightImageAlt] = useState(settings.footerCopyrightImageAlt || '');\n  const [footerCopyrightImageWidthPx, setFooterCopyrightImageWidthPx] = useState(settings.footerCopyrightImageWidthPx || 42);\n  const [footerCopyrightImagePlacement, setFooterCopyrightImagePlacement] = useState<'before'|'after'>(settings.footerCopyrightImagePlacement || 'before');\n  const [footerCopyrightIcon, setFooterCopyrightIcon] = useState<'none'|'ShieldCheck'|'Wrench'|'CheckCircle'|'Package'|'Zap'>(settings.footerCopyrightIcon || 'none');\n  const [footerCopyrightIconColor, setFooterCopyrightIconColor] = useState(settings.footerCopyrightIconColor || '#b9c0c7');\n  const [footerCopyrightIconSizePx, setFooterCopyrightIconSizePx] = useState(settings.footerCopyrightIconSizePx || 18);\n  const [footerCopyrightIconPlacement, setFooterCopyrightIconPlacement] = useState<'before'|'after'>(settings.footerCopyrightIconPlacement || 'before');\n`,
    'copyright admin state'
  );

  source = replaceOnce(
    source,
    `      footerBottomAlign,\n      footerCustomHtml,`,
    `      footerBottomAlign,\n      footerCopyrightPosition,\n      footerCopyrightTextAlign,\n      footerCopyrightImageUrl,\n      footerCopyrightImageAlt,\n      footerCopyrightImageWidthPx,\n      footerCopyrightImagePlacement,\n      footerCopyrightIcon,\n      footerCopyrightIconColor,\n      footerCopyrightIconSizePx,\n      footerCopyrightIconPlacement,\n      footerCustomHtml,`,
    'save copyright settings'
  );

  const controls = `            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-4" data-copyright-layout-controls="1">\n              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">جایگاه کپی‌رایت در عرض فوتر</span>\n                  <select value={footerCopyrightPosition} onChange={e=>setFooterCopyrightPosition(e.target.value as 'right'|'center'|'left')} className="w-full p-2.5 border rounded-xl bg-white">\n                    <option value="right">سمت راست فوتر</option>\n                    <option value="center">وسط فوتر</option>\n                    <option value="left">سمت چپ فوتر</option>\n                  </select>\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">تراز متن داخل کپی‌رایت</span>\n                  <select value={footerCopyrightTextAlign} onChange={e=>setFooterCopyrightTextAlign(e.target.value as 'right'|'center'|'left')} className="w-full p-2.5 border rounded-xl bg-white">\n                    <option value="right">راست‌چین</option>\n                    <option value="center">وسط‌چین</option>\n                    <option value="left">چپ‌چین</option>\n                  </select>\n                </label>\n              </div>\n\n              <ImageUploadInput\n                label="تصویر داخل کپی‌رایت"\n                value={footerCopyrightImageUrl}\n                onChange={setFooterCopyrightImageUrl}\n                aspectRatio="auto"\n                presetCategory="logos"\n                helperText="لوگو، نشان یا هر تصویر دلخواه را از کتابخانه رسانه انتخاب کنید."\n              />\n\n              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">متن جایگزین تصویر</span>\n                  <input value={footerCopyrightImageAlt} onChange={e=>setFooterCopyrightImageAlt(e.target.value)} className="w-full p-2.5 border rounded-xl bg-white" placeholder="مثلاً لوگوی فروشگاه" />\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">عرض تصویر (px)</span>\n                  <input type="number" min="16" max="320" value={footerCopyrightImageWidthPx} onChange={e=>setFooterCopyrightImageWidthPx(Math.max(16, Math.min(320, Number(e.target.value) || 16)))} className="w-full p-2.5 border rounded-xl bg-white" />\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">محل تصویر نسبت به متن</span>\n                  <select value={footerCopyrightImagePlacement} onChange={e=>setFooterCopyrightImagePlacement(e.target.value as 'before'|'after')} className="w-full p-2.5 border rounded-xl bg-white">\n                    <option value="before">قبل از متن</option>\n                    <option value="after">بعد از متن</option>\n                  </select>\n                </label>\n              </div>\n\n              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">آیکن داخل کپی‌رایت</span>\n                  <select value={footerCopyrightIcon} onChange={e=>setFooterCopyrightIcon(e.target.value as 'none'|'ShieldCheck'|'Wrench'|'CheckCircle'|'Package'|'Zap')} className="w-full p-2.5 border rounded-xl bg-white">\n                    <option value="none">بدون آیکن</option>\n                    <option value="ShieldCheck">سپر / اعتماد</option>\n                    <option value="Wrench">آچار</option>\n                    <option value="CheckCircle">تأیید</option>\n                    <option value="Package">بسته / قطعه</option>\n                    <option value="Zap">رعد / سرعت</option>\n                  </select>\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">رنگ آیکن</span>\n                  <input type="color" value={footerCopyrightIconColor} onChange={e=>setFooterCopyrightIconColor(e.target.value)} className="w-full h-[42px] p-1 border rounded-xl bg-white" />\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">اندازه آیکن (px)</span>\n                  <input type="number" min="12" max="64" value={footerCopyrightIconSizePx} onChange={e=>setFooterCopyrightIconSizePx(Math.max(12, Math.min(64, Number(e.target.value) || 12)))} className="w-full p-2.5 border rounded-xl bg-white" />\n                </label>\n                <label className="block">\n                  <span className="block text-[10px] font-bold mb-1">محل آیکن نسبت به متن</span>\n                  <select value={footerCopyrightIconPlacement} onChange={e=>setFooterCopyrightIconPlacement(e.target.value as 'before'|'after')} className="w-full p-2.5 border rounded-xl bg-white">\n                    <option value="before">قبل از متن</option>\n                    <option value="after">بعد از متن</option>\n                  </select>\n                </label>\n              </div>\n            </div>`;

  return insertAfterCopyrightEditor(source, controls);
});

// Storefront renderer for image/icon decoration and independent block/text alignment.
edit('src/components/layout/Footer.tsx', source => {
  const helperMarker = `  const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-copyright-rich" />;\n`;
  const helperBlock = `${helperMarker}\n  const copyrightPosition = settings.footerCopyrightPosition || 'center';\n  const copyrightTextAlign = settings.footerCopyrightTextAlign || 'right';\n  const copyrightImageWidth = Math.max(16, Math.min(320, Number(settings.footerCopyrightImageWidthPx || 42)));\n  const copyrightIconSize = Math.max(12, Math.min(64, Number(settings.footerCopyrightIconSizePx || 18)));\n\n  const renderCopyrightIcon = () => {\n    const props = {\n      className: 'marketplace-ref-footer-copyright-icon',\n      style: { width: copyrightIconSize, height: copyrightIconSize, color: settings.footerCopyrightIconColor || 'currentColor' }\n    };\n    switch (settings.footerCopyrightIcon) {\n      case 'ShieldCheck': return <ShieldCheck {...props} />;\n      case 'Wrench': return <Wrench {...props} />;\n      case 'CheckCircle': return <CheckCircle {...props} />;\n      case 'Package': return <Package {...props} />;\n      case 'Zap': return <Zap {...props} />;\n      default: return null;\n    }\n  };\n\n  const renderCopyrightMedia = (placement: 'before' | 'after') => (\n    <>\n      {settings.footerCopyrightImageUrl && (settings.footerCopyrightImagePlacement || 'before') === placement && (\n        <img\n          className="marketplace-ref-footer-copyright-image"\n          src={settings.footerCopyrightImageUrl}\n          alt={settings.footerCopyrightImageAlt || ''}\n          style={{ width: copyrightImageWidth }}\n        />\n      )}\n      {settings.footerCopyrightIcon && settings.footerCopyrightIcon !== 'none' && (settings.footerCopyrightIconPlacement || 'before') === placement && renderCopyrightIcon()}\n    </>\n  );\n`;
  if (!source.includes('const copyrightPosition = settings.footerCopyrightPosition')) {
    source = replaceOnce(source, helperMarker, helperBlock, 'copyright storefront helpers');
  }

  const oldMarketplace = `<div className="marketplace-ref-footer-copyright">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</div>`;
  const newMarketplace = `<div className="marketplace-ref-footer-copyright-row" data-position={copyrightPosition}>\n              <div className="marketplace-ref-footer-copyright" data-text-align={copyrightTextAlign} dir="rtl">\n                <div className="marketplace-ref-footer-copyright-inner">\n                  {renderCopyrightMedia('before')}\n                  <div className="marketplace-ref-footer-copyright-text">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</div>\n                  {renderCopyrightMedia('after')}\n                </div>\n              </div>\n            </div>`;
  source = replaceOnce(source, oldMarketplace, newMarketplace, 'marketplace copyright layout');

  const classicMarker = `<div className="footer-copyright-rich-shell">`;
  if (source.includes(classicMarker) && !source.includes('footer-copyright-rich-shell marketplace-ref-footer-copyright-row')) {
    const start = source.indexOf(classicMarker);
    const renderAt = source.indexOf('{renderCopyright(', start);
    const renderEnd = renderAt >= 0 ? source.indexOf(')}', renderAt) : -1;
    const close = renderEnd >= 0 ? source.indexOf('</div>', renderEnd) : -1;
    if (renderAt >= 0 && renderEnd >= 0 && close >= 0) {
      const renderExpression = source.slice(renderAt, renderEnd + 2);
      const replacement = `<div className="footer-copyright-rich-shell marketplace-ref-footer-copyright-row" data-position={copyrightPosition}>\n            <div className="marketplace-ref-footer-copyright" data-text-align={copyrightTextAlign} dir="rtl">\n              <div className="marketplace-ref-footer-copyright-inner">\n                {renderCopyrightMedia('before')}\n                <div className="marketplace-ref-footer-copyright-text">${renderExpression}</div>\n                {renderCopyrightMedia('after')}\n              </div>\n            </div>\n          </div>`;
      source = source.slice(0, start) + replacement + source.slice(close + '</div>'.length);
    }
  }
  return source;
});

// Final CSS control layer comes last so legacy forced-centering cannot win.
edit('src/index.css', source => appendOnce(source, 'v30.5.2 — copyright placement and media controls', `\n\n/* v30.5.2 — copyright placement and media controls */\n.marketplace-ref-footer-copyright-row {\n  width: 100% !important;\n  max-width: 100% !important;\n  display: flex !important;\n  direction: ltr;\n}\n.marketplace-ref-footer-copyright-row[data-position="right"] { justify-content: flex-end !important; }\n.marketplace-ref-footer-copyright-row[data-position="center"] { justify-content: center !important; }\n.marketplace-ref-footer-copyright-row[data-position="left"] { justify-content: flex-start !important; }\n.marketplace-ref-footer-copyright-row .marketplace-ref-footer-copyright {\n  width: auto !important;\n  max-width: 100% !important;\n  min-width: 0;\n  direction: rtl;\n}\n.marketplace-ref-footer-copyright-inner {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  max-width: 100%;\n}\n.marketplace-ref-footer-copyright-text { min-width: 0; max-width: 100%; }\n.marketplace-ref-footer-copyright[data-text-align="right"],\n.marketplace-ref-footer-copyright[data-text-align="right"] .footer-copyright-rich,\n.marketplace-ref-footer-copyright[data-text-align="right"] .footer-copyright-rich :is(p,h2,h3,h4,blockquote) { text-align: right !important; }\n.marketplace-ref-footer-copyright[data-text-align="center"],\n.marketplace-ref-footer-copyright[data-text-align="center"] .footer-copyright-rich,\n.marketplace-ref-footer-copyright[data-text-align="center"] .footer-copyright-rich :is(p,h2,h3,h4,blockquote) { text-align: center !important; }\n.marketplace-ref-footer-copyright[data-text-align="left"],\n.marketplace-ref-footer-copyright[data-text-align="left"] .footer-copyright-rich,\n.marketplace-ref-footer-copyright[data-text-align="left"] .footer-copyright-rich :is(p,h2,h3,h4,blockquote) { text-align: left !important; }\n.marketplace-ref-footer-copyright .footer-copyright-rich { width: auto !important; max-width: 100% !important; }\n.marketplace-ref-footer-copyright .footer-copyright-rich p { margin: 0; }\n.marketplace-ref-footer-copyright .footer-copyright-rich a:not([style*="color"]) {\n  color: inherit !important;\n  text-decoration-color: currentColor !important;\n}\n.marketplace-ref-footer-copyright-image {\n  display: block;\n  flex: 0 0 auto;\n  max-width: min(320px, 42vw);\n  max-height: 72px;\n  height: auto;\n  object-fit: contain;\n}\n.marketplace-ref-footer-copyright-icon { display: block; flex: 0 0 auto; }\n@media (max-width: 640px) {\n  .marketplace-ref-footer-copyright-inner { gap: 6px; }\n  .marketplace-ref-footer-copyright-image { max-width: 34vw; max-height: 56px; }\n}\n`));

const assertions = [
  ['src/types/index.ts', 'footerCopyrightPosition?:'],
  ['src/utils/richText.ts', "safeTextColor + '!important'"],
  ['src/components/admin/AdminFooterTab.tsx', 'data-copyright-layout-controls="1"'],
  ['src/components/admin/AdminFooterTab.tsx', 'تصویر داخل کپی‌رایت'],
  ['src/components/layout/Footer.tsx', 'marketplace-ref-footer-copyright-row'],
  ['src/components/layout/Footer.tsx', 'renderCopyrightMedia'],
  ['src/index.css', 'v30.5.2 — copyright placement and media controls']
];
for (const [path, marker] of assertions) {
  if (!fs.readFileSync(path, 'utf8').includes(marker)) {
    throw new Error(`v30.5.2 assertion failed: ${path} missing ${marker}`);
  }
}

console.log(`v30.5.2 copyright controls OK; patched ${changed.length} files.`);
