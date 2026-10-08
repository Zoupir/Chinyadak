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

console.log('v30.10.1 generated-source repair:', changed.length ? changed.join(', ') : 'already satisfied');
