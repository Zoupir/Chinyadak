import fs from 'node:fs';

const file = 'src/context/StoreContext.tsx';
let source = fs.readFileSync(file, 'utf8');
const before = source;

source = source.replace(
  "const page = pagesRef.current.find(item => item.slug === pageSlug);",
  "const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);"
);

if (!source.includes("const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);")) {
  throw new Error('v30.10.18 final runtime repair failed: live-section page fallback missing');
}

if (source !== before) fs.writeFileSync(file, source, 'utf8');
console.log('v30.10.18 final live-section runtime guard applied.');
