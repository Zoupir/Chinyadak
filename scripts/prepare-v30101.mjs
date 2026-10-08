import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

run('scripts/prepare-v30100.mjs');
run('scripts/apply-v30101-commerce-consistency.mjs');
run('scripts/repair-v30101-generated-source.mjs');

const checks = [
  ['src/server/checkout-options.ts', 'loadCheckoutConfiguration'],
  ['src/server/inventory.ts', "inventory_state = 'reserved'"],
  ['src/server/inventory.ts', 'persistent?: boolean'],
  ['src/server/routes/orders.ts', "ordersRouter.get('/checkout-options'"],
  ['src/server/routes/orders.ts', 'reserveOrderInventory(connection, orderId, { persistent: true })'],
  ['src/server/routes/orders.ts', 'releaseOrderReservationInTransaction(connection, order.id)'],
  ['src/components/cart/CheckoutView.tsx', "'/api/orders/checkout-options'"],
  ['src/components/compare/CompareView.tsx', 'getEffectiveProductPrice(p)'],
  ['src/components/search/SearchAutocomplete.tsx', 'getEffectiveProductPrice(item)'],
  ['db/schema.sql', 'inventory_state VARCHAR(20)'],
  ['scripts/init-db.ts', "ensureColumn('orders', 'inventory_state'"]
];

const missing = checks.filter(([file, marker]) => {
  try { return !fs.readFileSync(file, 'utf8').includes(marker); }
  catch { return true; }
});

if (missing.length) {
  throw new Error('v30.10.1 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.10.1 stage 2 commerce consistency.');
