import fs from 'node:fs';

const changed = [];
const edit = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(file);
  }
};

edit('src/components/cart/CheckoutView.tsx', source => {
  // The legacy provider-status effect lives after coupon state in the historical
  // baseline. Stage 2 already loads the complete option matrix from /checkout-options.
  source = source.replace(
    /\n  \/\/ Gateway availability is read from server-side configuration; credentials never reach the browser\.[\s\S]*?\n  \/\/ Loyalty previews are convenience only;/,
    '\n  // Loyalty previews are convenience only;'
  );
  if (/setGatewayAvailability|setGatewayStatusLoaded|paymentGateways\.some/.test(source)) {
    throw new Error('v30.10.1 stale checkout gateway state remains after repair');
  }
  return source;
});

edit('src/components/product/ProductDetailView.tsx', source => {
  // Later historical product-detail repairs can reintroduce the old fixed-sale
  // fallback. The purchase box must use the same effective price as cart/order.
  if (!source.includes("from '../../utils/pricing'")) {
    source = source.replace(
      "import { checkProductFitment, formatToman, getGradeInfo } from '../../utils/formatters';",
      "import { checkProductFitment, formatToman, getGradeInfo } from '../../utils/formatters';\nimport { getProductDiscountInfo } from '../../utils/pricing';"
    );
  }
  source = source.replace(
    '  const hasDiscount = product.discountPrice && product.discountPrice < product.price;',
    '  const discount = getProductDiscountInfo(product);\n  const hasDiscount = discount.active;\n  const effectivePrice = discount.effectivePrice;'
  );
  if (source.includes('const discount = getProductDiscountInfo(product);') && !source.includes('const effectivePrice = discount.effectivePrice;')) {
    source = source.replace(
      '  const discount = getProductDiscountInfo(product);',
      '  const discount = getProductDiscountInfo(product);\n  const effectivePrice = discount.effectivePrice;'
    );
  }
  source = source.replace(/Number\(product\.discountPrice \|\| product\.price\)/g, 'Number(effectivePrice)');
  source = source.replace(/formatToman\(product\.discountPrice \|\| product\.price\)/g, 'formatToman(effectivePrice)');
  if (/product\.discountPrice\s*\|\|\s*product\.price/.test(source)) {
    throw new Error('v30.10.1 product detail still bypasses effectivePrice');
  }
  return source;
});

edit('scripts/smoke-test.ts', source => {
  // The original broad smoke assumed Saman was usable even when CI had no
  // gateway credentials. Stage 2 intentionally rejects unavailable methods.
  // Enable COD through the same admin CMS contract before exercising orders.
  source = source.replace(
    "  const product = catalog.data.products.find(item => Number(item.stock || 0) > 0) || catalog.data.products[0];",
    "  const product = [...catalog.data.products].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))[0];"
  );

  if (!source.includes('stage2CheckoutBaseline')) {
    const marker = '  // Order creation is recalculated by the server and must be trackable only with phone + order number.\n';
    if (!source.includes(marker)) throw new Error('v30.10.1 legacy smoke order marker missing');
    const prelude = `  // Stage 2: payment methods shown/accepted by checkout are server-authoritative.\n  const stage2CheckoutBaseline = await json<{ paymentGateways: any[] }>('/api/cms/bundle');\n  const stage2Cod = { id: 'cod-stage2', provider: 'cod', title: 'پرداخت در محل', isActive: true };\n  await json('/api/cms/payment-gateways', {\n    method: 'PUT',\n    headers: cookieHeaders(adminCookie),\n    body: JSON.stringify({\n      gateways: [...stage2CheckoutBaseline.data.paymentGateways.filter(g => g.provider !== 'cod'), stage2Cod]\n    })\n  });\n  const stage2Options = await json<{ paymentMethods: Array<{ id: string; available: boolean }> }>('/api/orders/checkout-options');\n  assert.equal(stage2Options.data.paymentMethods.find(item => item.id === 'cod')?.available, true,\n    'COD enabled in admin was not exposed by the authoritative checkout options endpoint.');\n\n`;
    source = source.replace(marker, prelude + marker);
  }

  // There are two historical Saman order fixtures in this smoke. They are not
  // gateway-integration tests; use the explicitly enabled COD path instead.
  source = source.replace(/paymentMethodId: 'saman'/g, "paymentMethodId: 'cod'");

  if (!source.includes('Stage 2 additional COD fixture must release its reservation')) {
    const needle = `      assert.equal(Number(additional.data.order.shippingFee), expectedFee);`;
    if (!source.includes(needle)) throw new Error('v30.10.1 additional checkout smoke marker missing');
    source = source.replace(needle, `${needle}\n      // Stage 2 additional COD fixture must release its reservation immediately.\n      await json('/api/orders/' + additional.data.order.id + '/status', {\n        method: 'PATCH', headers: cookieHeaders(adminCookie), body: JSON.stringify({ status: 'cancelled' })\n      });`);
  }

  return source;
});

console.log('v30.10.1 generated-source repair:', changed.length ? changed.join(', ') : 'already satisfied');
