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

edit('src/components/product/ProductDetailView.tsx', source => {
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
  return source;
});

edit('src/components/product/ProductLabelBadges.tsx', source => {
  source = source.replace('const defaults: ProductLabelDefinition[] = [', 'export const DEFAULT_PRODUCT_LABELS: ProductLabelDefinition[] = [');
  source = source.replace('const source = configured === undefined ? defaults : configured;', 'const source = configured === undefined ? DEFAULT_PRODUCT_LABELS : configured;');
  if (!source.includes('export const DEFAULT_PRODUCT_LABELS')) throw new Error('v30.7.0 label defaults could not be exported.');
  return source;
});

edit('src/components/admin/AdminCommerceSettings.tsx', source => {
  if (!source.includes("DEFAULT_PRODUCT_LABELS")) {
    source = source.replace(
      "import type { DiscountCoupon, ProductLabelDefinition, QualityGrade } from '../../types';",
      "import type { DiscountCoupon, ProductLabelDefinition, QualityGrade } from '../../types';\nimport { DEFAULT_PRODUCT_LABELS } from '../product/ProductLabelBadges';"
    );
  }
  source = source.replace(
    'const [labels, setLabels] = useState<ProductLabelDefinition[]>(settings.productLabels || []);',
    'const [labels, setLabels] = useState<ProductLabelDefinition[]>(() => (settings.productLabels ?? DEFAULT_PRODUCT_LABELS).map(item => ({ ...item })));'
  );
  source = source.replace(
    'useEffect(() => { setLabels(settings.productLabels || []); setCoupons(settings.discountCoupons || []); }, [settings.productLabels, settings.discountCoupons]);',
    'useEffect(() => { setLabels((settings.productLabels ?? DEFAULT_PRODUCT_LABELS).map(item => ({ ...item }))); setCoupons(settings.discountCoupons || []); }, [settings.productLabels, settings.discountCoupons]);'
  );
  if (!source.includes('settings.productLabels ?? DEFAULT_PRODUCT_LABELS')) throw new Error('v30.7.0 admin label defaults were not wired.');
  return source;
});

edit('src/components/admin/AdminProductPromotionFields.tsx', source => {
  if (!source.includes("DEFAULT_PRODUCT_LABELS")) {
    source = source.replace(
      "import { formatToman } from '../../utils/formatters';",
      "import { formatToman } from '../../utils/formatters';\nimport { DEFAULT_PRODUCT_LABELS } from '../product/ProductLabelBadges';"
    );
  }
  source = source.replace('const labels = settings.productLabels || [];', 'const labels = settings.productLabels ?? DEFAULT_PRODUCT_LABELS;');
  if (!source.includes('settings.productLabels ?? DEFAULT_PRODUCT_LABELS')) throw new Error('v30.7.0 product label picker defaults were not wired.');
  return source;
});

edit('src/server/routes/orders.ts', source => {
  source = source.replace(
    '        const percentCap = Math.floor(subtotal * loyalty.maxRedeemPercent / 100);',
    '        const loyaltyBaseSubtotal = Math.max(0, subtotal - couponDiscountAmount);\n        const percentCap = Math.floor(loyaltyBaseSubtotal * loyalty.maxRedeemPercent / 100);'
  );
  return source;
});

console.log(changed.length ? `v30.7.0 repair applied: ${changed.join(', ')}` : 'v30.7.0 repair already satisfied.');
