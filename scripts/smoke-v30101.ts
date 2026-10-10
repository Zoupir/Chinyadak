import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { pool, withTransaction, type RowDataPacket } from '../src/server/db';
import { getEffectiveProductPrice } from '../src/utils/pricing';
import { getPublicCheckoutOptions } from '../src/server/checkout-options';
import { finalizePaidInventory, releaseOrderReservationInTransaction, reserveOrderInventory } from '../src/server/inventory';

const source = (file: string) => fs.readFileSync(file, 'utf8');
const parseJson = (value: any, fallback: any = {}) => {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(String(value || '')); } catch { return fallback; }
};

const insertTestOrder = async (orderId: string, productId: string, unitPrice: number) => {
  await pool.execute(
    `INSERT INTO orders
      (id, order_number, status, customer_snapshot, shipping_snapshot, payment_method,
       subtotal, discount_amount, shipping_fee, total, payment_status, inventory_state)
     VALUES (?, ?, 'pending', ?, ?, 'cod', ?, 0, 0, ?, 'unpaid', 'none')`,
    [orderId, `CI-S2-${orderId.slice(0, 8)}`, JSON.stringify({ firstName: 'CI', lastName: 'Stage2', phone: '09120000000' }), JSON.stringify({ id: 'ci', title: 'CI', cost: 0 }), unitPrice, unitPrice]
  );
  await pool.execute(
    `INSERT INTO order_items
      (order_id, product_id, sku, product_name, unit_price, quantity, line_total, metadata_json)
     VALUES (?, ?, 'CI-S2', 'Stage 2 test product', ?, 1, ?, ?)`,
    [orderId, productId, unitPrice, unitPrice, JSON.stringify({ source: 'stage2-smoke' })]
  );
};

const run = async () => {
  const now = Date.now();
  assert.equal(getEffectiveProductPrice({
    price: 1_000_000,
    discountPrice: 950_000,
    discountMode: 'percent',
    discountValue: 20,
    discountStartsAt: new Date(now - 60_000).toISOString(),
    discountEndsAt: new Date(now + 60_000).toISOString()
  } as any, now), 800_000);

  const runtimeFiles = [
    'src/context/StoreContext.tsx',
    'src/components/cart/CartDrawer.tsx',
    'src/components/cart/CartView.tsx',
    'src/components/cart/CheckoutView.tsx',
    'src/components/compare/CompareView.tsx',
    'src/components/search/SearchAutocomplete.tsx',
    'src/components/product/ProductCard.tsx',
    'src/components/product/ProductDetailView.tsx'
  ];
  for (const file of runtimeFiles) {
    assert.doesNotMatch(source(file), /discountPrice\s*\|\|\s*[^;\n)]+/, `${file} still bypasses effectivePrice.`);
  }
  assert.match(source('src/components/compare/CompareView.tsx'), /getEffectiveProductPrice\(p\)/);
  assert.match(source('src/components/search/SearchAutocomplete.tsx'), /getEffectiveProductPrice\(item\)/);
  assert.match(source('src/components/cart/CheckoutView.tsx'), /\/api\/orders\/checkout-options/);
  assert.match(source('src/server/routes/orders.ts'), /reserveOrderInventory\(connection, orderId, \{ persistent: true \}\)/);
  assert.doesNotMatch(source('src/server/routes/orders.ts'), /discount_price\s*\?\?\s*row\.price/);

  const options = await getPublicCheckoutOptions();
  assert(options.shippingMethods.length > 0, 'No server-authoritative shipping methods returned.');
  assert.deepEqual(options.paymentMethods.map(item => item.id), ['saman', 'mellat', 'cod']);
  assert(options.paymentMethods.every(item => typeof item.available === 'boolean'));

  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string; stock: number; reserved_stock: number; data_json: any;
  }>>(
    "SELECT id, stock, reserved_stock, data_json FROM products WHERE status='active' AND (stock-reserved_stock) >= 3 ORDER BY stock DESC LIMIT 1"
  );
  const product = rows[0];
  assert(product, 'Stage 2 smoke needs a product with at least 3 available units.');
  const baselineStock = Number(product.stock);
  const baselineReserved = Number(product.reserved_stock || 0);

  const firstOrderId = randomUUID();
  await insertTestOrder(firstOrderId, product.id, 800_000);
  await withTransaction(async connection => {
    await reserveOrderInventory(connection, firstOrderId, { persistent: true });
  });

  const [reservedRows] = await pool.query<Array<RowDataPacket & { stock: number; reserved_stock: number }>>(
    'SELECT stock, reserved_stock FROM products WHERE id=?', [product.id]
  );
  assert.equal(Number(reservedRows[0].stock), baselineStock, 'Persistent COD reservation consumed physical stock too early.');
  assert.equal(Number(reservedRows[0].reserved_stock), baselineReserved + 1, 'Persistent COD reservation was not recorded.');

  const [firstStateRows] = await pool.query<Array<RowDataPacket & { inventory_state: string; reservation_expires_at: Date | null }>>(
    'SELECT inventory_state, reservation_expires_at FROM orders WHERE id=?', [firstOrderId]
  );
  assert.equal(firstStateRows[0].inventory_state, 'reserved');
  assert.equal(firstStateRows[0].reservation_expires_at, null);

  await withTransaction(async connection => {
    await releaseOrderReservationInTransaction(connection, firstOrderId);
  });
  const [releasedRows] = await pool.query<Array<RowDataPacket & { stock: number; reserved_stock: number }>>(
    'SELECT stock, reserved_stock FROM products WHERE id=?', [product.id]
  );
  assert.equal(Number(releasedRows[0].stock), baselineStock);
  assert.equal(Number(releasedRows[0].reserved_stock), baselineReserved, 'Released COD order leaked reserved stock.');

  const secondOrderId = randomUUID();
  await insertTestOrder(secondOrderId, product.id, 800_000);
  await withTransaction(async connection => {
    await reserveOrderInventory(connection, secondOrderId, { persistent: true });
    const result = await finalizePaidInventory(connection, secondOrderId);
    assert.equal(result.stockConflict, false);
    await connection.execute("UPDATE orders SET payment_status='paid', status='delivered' WHERE id=?", [secondOrderId]);
  });

  const [committedRows] = await pool.query<Array<RowDataPacket & { stock: number; reserved_stock: number }>>(
    'SELECT stock, reserved_stock FROM products WHERE id=?', [product.id]
  );
  assert.equal(Number(committedRows[0].stock), baselineStock - 1, 'COD delivery did not commit stock exactly once.');
  assert.equal(Number(committedRows[0].reserved_stock), baselineReserved, 'Committed COD reservation was not cleared.');
  const [secondStateRows] = await pool.query<Array<RowDataPacket & { inventory_state: string }>>(
    'SELECT inventory_state FROM orders WHERE id=?', [secondOrderId]
  );
  assert.equal(secondStateRows[0].inventory_state, 'committed');

  await pool.execute('DELETE FROM orders WHERE id IN (?, ?)', [firstOrderId, secondOrderId]);
  const original = parseJson(product.data_json, {});
  original.stock = baselineStock;
  original.stockStatus = baselineStock - baselineReserved <= 0 ? 'out_of_stock' : baselineStock - baselineReserved <= 3 ? 'low_stock' : 'in_stock';
  await pool.execute('UPDATE products SET stock=?, reserved_stock=?, data_json=? WHERE id=?', [baselineStock, baselineReserved, JSON.stringify(original), product.id]);

  console.log('v30.10.1 stage 2 commerce/COD smoke passed.');
};

run()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await pool.end().catch(() => undefined); });
