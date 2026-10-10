import fs from 'node:fs';

const path = 'src/components/admin/AdminView.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = source;

if (!/\bFactory\b[\s\S]*from 'lucide-react'/.test(source)) {
  source = source.replace('  Car, \n  BookOpen,', '  Car,\n  Factory,\n  BookOpen,');
}

if (!/\n\s*partBrands,\n\s*models,/.test(source)) {
  source = source.replace('    brands,\n    models,', '    brands,\n    partBrands,\n    models,');
}

source = source.replaceAll(
  '                brands={brands}\n                models={models}',
  '                brands={brands}\n                partBrands={partBrands}\n                models={models}'
);
source = source.replaceAll(
  '                brands={brands}\r\n                models={models}',
  '                brands={brands}\r\n                partBrands={partBrands}\r\n                models={models}'
);

if (!source.includes("import { AdminPartBrandsTab } from './AdminPartBrandsTab';")) {
  source = source.replace("import { AdminCarsTab } from './AdminCarsTab';", "import { AdminCarsTab } from './AdminCarsTab';\nimport { AdminPartBrandsTab } from './AdminPartBrandsTab';");
}

if (!source.includes('partBrands={partBrands}')) {
  throw new Error('v30.6.0 AdminView repair could not wire partBrands into ProductClassificationFields.');
}
if (!source.includes('    partBrands,\n    models,')) {
  throw new Error('v30.6.0 AdminView repair could not expose partBrands from StoreContext.');
}
if (!source.includes('  Factory,')) {
  throw new Error('v30.6.0 AdminView repair could not import Factory icon.');
}

if (source !== before) fs.writeFileSync(path, source);
console.log(source === before ? 'v30.6.0 AdminView repair already satisfied.' : 'v30.6.0 AdminView repair applied.');
