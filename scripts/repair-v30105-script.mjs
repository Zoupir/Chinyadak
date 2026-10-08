import fs from 'node:fs';

const file = 'scripts/apply-v30105-seo.mjs';
let source = fs.readFileSync(file, 'utf8');
const before = source;

// The transform itself contains JSX template literals inside JavaScript template
// strings. Escape those delimiters/interpolations before Node parses the
// transform. This repair is intentionally idempotent and runs before apply.
source = source
  .replaceAll('`قطعات ${activeCategoryObj.nameFa}`', '\\`قطعات \\${activeCategoryObj.nameFa}\\`')
  .replaceAll('`نتایج جستجو برای «${searchQuery}»`', '\\`نتایج جستجو برای «\\${searchQuery}»\\`');

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.5 transform template literals repaired.');
} else {
  console.log('v30.10.5 transform template literals already safe.');
}

// Stage-5 server source uses a regex literal. Patch the semantic token directly
// rather than relying on escaping details inside the transform's string literal.
const serverFile = 'server.ts';
const serverBefore = fs.readFileSync(serverFile, 'utf8');
const serverAfter = serverBefore.replace(
  'sitemap-(products|articles|categories|pages|brands|models)',
  'sitemap-(static|products|articles|categories|pages|brands|models)'
);
if (serverAfter !== serverBefore) {
  fs.writeFileSync(serverFile, serverAfter);
  console.log('v30.10.5 sitemap route matcher normalized.');
} else {
  console.log('v30.10.5 sitemap route matcher already normalized.');
}
