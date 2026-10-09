import fs from 'node:fs';

const path = 'src/components/home/MarketplaceRtlHome.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = source;

source = source.replace(
  /onClick=\{\(\) => onNavigate\('product', product\.id\)\}/g,
  "onClick={() => { if (product.id) onNavigate('product', product.id); }}"
);

source = source.replace(
  /onClick=\{\(\) => onNavigate\('product', item\.id\)\}/g,
  "onClick={() => { if (item.id) onNavigate('product', item.id); }}"
);

if (source !== before) {
  fs.writeFileSync(path, source, 'utf8');
  console.log('v30.10.18 MarketplaceRtlHome optional-id type repair applied.');
} else {
  console.log('v30.10.18 MarketplaceRtlHome optional-id type repair already satisfied.');
}
