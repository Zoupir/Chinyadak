import fs from 'node:fs';

const path = 'src/components/layout/Footer.tsx';
let source = fs.readFileSync(path, 'utf8');

const brokenMarker = '<div className="footer-copyright-rich-shell marketplace-ref-footer-copyright-row" data-position={copyrightPosition}>';
const standardsMarker = '<div className="flex items-center gap-4 text-[11px]">';

if (source.includes(brokenMarker)) {
  const start = source.indexOf(brokenMarker);
  const end = source.indexOf(standardsMarker, start);
  if (end < 0) throw new Error('v30.5.2 repair could not find classic footer standards marker');

  const valid = `<div className="footer-copyright-rich-shell marketplace-ref-footer-copyright-row" data-position={copyrightPosition}>\n            <div className="marketplace-ref-footer-copyright" data-text-align={copyrightTextAlign} dir="rtl">\n              <div className="marketplace-ref-footer-copyright-inner">\n                {renderCopyrightMedia('before')}\n                <div className="marketplace-ref-footer-copyright-text">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`)}</div>\n                {renderCopyrightMedia('after')}\n              </div>\n            </div>\n          </div>\n          `;

  source = source.slice(0, start) + valid + source.slice(end);
  fs.writeFileSync(path, source);
  console.log('v30.5.2 classic footer repair applied.');
} else {
  console.log('v30.5.2 classic footer repair not needed.');
}
