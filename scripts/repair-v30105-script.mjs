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

// Historical preparation can render the Express regex with different escaping.
// Replace the route declaration by meaning rather than by escaped source text.
const serverFile = 'server.ts';
const serverBefore = fs.readFileSync(serverFile, 'utf8');
const lines = serverBefore.split('\n');
const routeIndex = lines.findIndex(line =>
  line.includes('app.get(') && line.includes('sitemap-') && line.includes('.xml') && line.includes('req, res, next')
);
if (routeIndex >= 0) {
  lines[routeIndex] = "app.get(/^\\/sitemap-(static|products|articles|categories|pages|brands|models)-(\\d+)\\.xml$/, async (req, res, next) => {";
}
const serverAfter = lines.join('\n');
if (serverAfter !== serverBefore) {
  fs.writeFileSync(serverFile, serverAfter);
  console.log('v30.10.5 sitemap route matcher normalized.');
} else if (serverAfter.includes('sitemap-(static|products|articles|categories|pages|brands|models)')) {
  console.log('v30.10.5 sitemap route matcher already normalized.');
} else {
  throw new Error('v30.10.5 sitemap route declaration not found before SEO transform.');
}
