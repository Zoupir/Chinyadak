import fs from 'node:fs';

const path = 'src/components/product/ProductDetailView.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = source;

source = source.replace(
  "import { checkProductFitment, formatToman } from '../../utils/formatters';",
  "import { checkProductFitment, formatToman, getGradeInfo } from '../../utils/formatters';"
);

if (!source.includes('const gradeInfo = getGradeInfo(product.grade);')) {
  const marker = '  const discount = getProductDiscountInfo(product);';
  if (!source.includes(marker)) throw new Error('v30.7.0 ProductDetailView repair could not find discount marker.');
  source = source.replace(marker, `  const gradeInfo = getGradeInfo(product.grade);\n${marker}`);
}

if (!source.includes("getGradeInfo } from '../../utils/formatters'")) {
  throw new Error('v30.7.0 ProductDetailView repair could not restore getGradeInfo import.');
}

if (source !== before) fs.writeFileSync(path, source);
console.log(source === before ? 'v30.7.0 ProductDetailView repair already satisfied.' : 'v30.7.0 ProductDetailView repair applied.');
