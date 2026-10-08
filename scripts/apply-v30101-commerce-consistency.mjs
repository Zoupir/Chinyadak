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

// ---------------------------------------------------------------------------
// Database contract: reservation state is explicit so COD reservations can be
// persistent without abusing the online payment expiration timestamp.
// ---------------------------------------------------------------------------
edit('db/schema.sql', source => {
  if (!source.includes('inventory_state VARCHAR(20)')) {
    source = source.replace(
      '  reservation_expires_at DATETIME NULL,\n  tracking_code VARCHAR(190) NULL,',
      "  reservation_expires_at DATETIME NULL,\n  inventory_state VARCHAR(20) NOT NULL DEFAULT 'none',\n  inventory_reserved_at DATETIME NULL,\n  tracking_code VARCHAR(190) NULL,"
    );
    source = source.replace(
      '  INDEX idx_orders_status (status),\n  INDEX idx_orders_created (created_at)',
      '  INDEX idx_orders_status (status),\n  INDEX idx_orders_inventory_state (inventory_state),\n  INDEX idx_orders_created (created_at)'
    );
  }
  return source;
});

edit('scripts/init-db.ts', source => {
  if (!source.includes("ensureColumn('orders', 'inventory_state'")) {
    source = source.replace(
      "    await ensureColumn('orders', 'reservation_expires_at', 'DATETIME NULL');",
      "    await ensureColumn('orders', 'reservation_expires_at', 'DATETIME NULL');\n    await ensureColumn('orders', 'inventory_state', \"VARCHAR(20) NOT NULL DEFAULT 'none'\");\n    await ensureColumn('orders', 'inventory_reserved_at', 'DATETIME NULL');"
    );
    source = source.replace(
      "    await ensureColumn('customers', 'password_initialized', 'TINYINT(1) NOT NULL DEFAULT 1');",
      `    await ensureColumn('customers', 'password_initialized', 'TINYINT(1) NOT NULL DEFAULT 1');\n\n    await connection.query(\n      \`UPDATE orders\n       SET inventory_state = 'reserved', inventory_reserved_at = COALESCE(inventory_reserved_at, updated_at)\n       WHERE inventory_state = 'none' AND reservation_expires_at IS NOT NULL\`\n    );\n    await connection.query(\n      \`UPDATE orders\n       SET inventory_state = 'committed', inventory_reserved_at = NULL\n       WHERE inventory_state = 'none' AND payment_status IN ('paid','paid_stock_review')\`\n    );`
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Price display: every storefront/runtime surface goes through one effective
// price function. discountPrice remains only as a compatibility input there.
// ---------------------------------------------------------------------------
edit('src/components/compare/CompareView.tsx', source => {
  if (!source.includes("from '../../utils/pricing'")) {
    source = source.replace(
      "import { formatToman, getGradeInfo } from '../../utils/formatters';",
      "import { formatToman, getGradeInfo } from '../../utils/formatters';\nimport { getEffectiveProductPrice } from '../../utils/pricing';"
    );
  }
  source = source.replace(/formatToman\(p\.discountPrice \|\| p\.price\)/g, 'formatToman(getEffectiveProductPrice(p))');
  return source;
});

edit('src/components/search/SearchAutocomplete.tsx', source => {
  if (!source.includes("from '../../utils/pricing'")) {
    source = source.replace(
      "import { formatToman } from '../../utils/formatters';",
      "import { formatToman } from '../../utils/formatters';\nimport { getEffectiveProductPrice } from '../../utils/pricing';"
    );
  }
  source = source.replace(/formatToman\(item\.discountPrice \|\| item\.price\)/g, 'formatToman(getEffectiveProductPrice(item))');
  return source;
});

// ---------------------------------------------------------------------------
// Checkout UI consumes one server-authoritative shipping/payment option set.
// ---------------------------------------------------------------------------
edit('src/components/cart/CheckoutView.tsx', source => {
  source = source.replace(/,\n\s*paymentGateways\n\s*\} = useStore\(\);/, '\n  } = useStore();');

  const shippingStart = '  // Shipping Method\n';
  const paymentEnd = '  // Coupon state\n';
  const start = source.indexOf(shippingStart);
  const end = source.indexOf(paymentEnd, start);
  if (start < 0 || end < 0) throw new Error('v30.10.1 checkout option markers missing');

  const block = `  // Shipping and payment options are resolved by the server from the same\n  // configuration used when the order is validated and persisted.\n  type CheckoutShippingOption = {\n    id: string; title: string; description?: string; cost: number;\n    paymentMode: 'prepaid' | 'free' | 'collect'; estimatedDelivery: string; enabled: true;\n  };\n  type CheckoutPaymentOption = {\n    id: 'saman' | 'mellat' | 'cod'; title: string; available: boolean; configured: boolean; active: boolean;\n  };\n  const [shippingMethods, setShippingMethods] = useState<CheckoutShippingOption[]>([]);\n  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentOption[]>([]);\n  const [checkoutOptionsLoaded, setCheckoutOptionsLoaded] = useState(false);\n  const [selectedShipping, setSelectedShipping] = useState<string>('');\n  const [selectedGateway, setSelectedGateway] = useState<'saman' | 'mellat' | 'cod'>('saman');\n\n  const selectedShippingMethod = shippingMethods.find(method => method.id === selectedShipping) || shippingMethods[0];\n  const gatewayAvailability: Record<'saman' | 'mellat' | 'cod', boolean> = {\n    saman: Boolean(paymentMethods.find(method => method.id === 'saman')?.available),\n    mellat: Boolean(paymentMethods.find(method => method.id === 'mellat')?.available),\n    cod: Boolean(paymentMethods.find(method => method.id === 'cod')?.available)\n  };\n  const gatewayStatusLoaded = checkoutOptionsLoaded;\n  const hasAvailableGateway = paymentMethods.some(method => method.available);\n\n  useEffect(() => {\n    let cancelled = false;\n    apiRequest<{ shippingMethods: CheckoutShippingOption[]; paymentMethods: CheckoutPaymentOption[] }>('/api/orders/checkout-options')\n      .then(result => {\n        if (cancelled) return;\n        const shipping = Array.isArray(result.shippingMethods) ? result.shippingMethods : [];\n        const payments = Array.isArray(result.paymentMethods) ? result.paymentMethods : [];\n        setShippingMethods(shipping);\n        setPaymentMethods(payments);\n        setSelectedShipping(current => shipping.some(item => item.id === current) ? current : (shipping[0]?.id || ''));\n        setSelectedGateway(current => payments.some(item => item.id === current && item.available)\n          ? current\n          : (payments.find(item => item.available)?.id || 'saman'));\n      })\n      .catch(error => {\n        console.error('Checkout options load failed:', error);\n        if (!cancelled) { setShippingMethods([]); setPaymentMethods([]); }\n      })\n      .finally(() => { if (!cancelled) setCheckoutOptionsLoaded(true); });\n    return () => { cancelled = true; };\n  }, []);\n\n`;
  source = source.slice(0, start) + block + source.slice(end);
  return source;
});

// ---------------------------------------------------------------------------
// Server checkout: identical shipping/gateway resolver, reserved-stock-aware
// availability, canonical effective price, and persistent COD reservation.
// ---------------------------------------------------------------------------
edit('src/server/routes/orders.ts', source => {
  if (!source.includes("from '../checkout-options'")) {
    source = source.replace(
      "import { randomInt, randomUUID } from 'crypto';\n",
      "import { randomInt, randomUUID } from 'crypto';\nimport { getPublicCheckoutOptions, loadCheckoutConfiguration } from '../checkout-options';\nimport { finalizePaidInventory, releaseOrderReservationInTransaction, reserveOrderInventory } from '../inventory';\n"
    );
  }
  if (!source.includes('reserved_stock: number;')) {
    source = source.replace('  stock: number;\n  data_json: any;', '  stock: number;\n  reserved_stock: number;\n  data_json: any;');
  }
  if (!source.includes('inventory_state: string | null;')) {
    source = source.replace('  reservation_expires_at: Date | null;\n', '  reservation_expires_at: Date | null;\n  inventory_state: string | null;\n');
  }

  if (!source.includes("ordersRouter.get('/checkout-options'")) {
    source = source.replace(
      'export const ordersRouter = Router();',
      `export const ordersRouter = Router();\n\nordersRouter.get('/checkout-options', async (_req, res) => {\n  const options = await getPublicCheckoutOptions();\n  res.json(options);\n});`
    );
  }

  const configPattern = /  const \[checkoutSettingRows\][\s\S]*?\n  if \(!shipping \|\| !\['saman', 'mellat', 'cod'\]\.includes\(paymentMethod\)[\s\S]*?\n  \}\n\n  if \(!firstName/;
  if (configPattern.test(source)) {
    source = source.replace(configPattern, `  const checkout = await loadCheckoutConfiguration();\n  const siteSettings = checkout.siteSettings;\n  const shipping = checkout.shippingMethods.find(method => method.id === requestedShippingId) || null;\n  const paymentOption = checkout.paymentMethods.find(method => method.id === paymentMethod);\n\n  if (!shipping) {\n    res.status(400).json({ error: 'SHIPPING_METHOD_UNAVAILABLE' });\n    return;\n  }\n  if (!paymentOption || !paymentOption.available) {\n    res.status(400).json({ error: 'PAYMENT_METHOD_UNAVAILABLE' });\n    return;\n  }\n\n  if (!firstName`);
  } else if (!source.includes("const checkout = await loadCheckoutConfiguration();")) {
    throw new Error('v30.10.1 order checkout configuration target missing');
  }

  source = source.replace(/price, discount_price, stock, data_json/g, 'price, discount_price, stock, reserved_stock, data_json');
  source = source.replace(/if \(row\.stock < item\.quantity\) \{\n\s*res\.status\(409\)\.json\(\{\n\s*error: 'INSUFFICIENT_STOCK',\n\s*productId: row\.id,\n\s*available: row\.stock\n\s*\}\);/g,
    `const availableStock = Math.max(0, Number(row.stock) - Number(row.reserved_stock || 0));\n    if (availableStock < item.quantity) {\n      res.status(409).json({\n        error: 'INSUFFICIENT_STOCK',\n        productId: row.id,\n        available: availableStock\n      });`);

  // The v30.7 patch should already have canonicalized server pricing. Guard older baselines too.
  source = source.replace(
    'const unitPrice = Number(row.discount_price ?? row.price);',
    'const unitPrice = getEffectiveProductPrice({ ...data, price:Number(row.price), discountPrice:row.discount_price == null ? undefined : Number(row.discount_price) });'
  );

  if (!source.includes("reserveOrderInventory(connection, orderId, { persistent: true })")) {
    const marker = `            JSON.stringify({ image: item.image, grade: item.grade, vehicleInfo: item.vehicleInfo })\n          ]\n        );\n      }\n    });`;
    if (!source.includes(marker)) throw new Error('v30.10.1 order item insert marker missing');
    source = source.replace(marker, `            JSON.stringify({ image: item.image, grade: item.grade, vehicleInfo: item.vehicleInfo })\n          ]\n        );\n      }\n\n      if (paymentMethod === 'cod') {\n        await reserveOrderInventory(connection, orderId, { persistent: true });\n      }\n    });`);
  }

  // Admin status transitions must commit COD stock at delivery and release unpaid reservations on cancellation.
  source = source.replace(
    "const [lockedRows] = await connection.query<Array<RowDataPacket & { id: string; payment_status: string; payment_method: string }>>(",
    "const [lockedRows] = await connection.query<Array<RowDataPacket & { id: string; payment_status: string; payment_method: string; inventory_state: string }>>("
  );
  source = source.replace(
    "'SELECT id, payment_status, payment_method FROM orders WHERE id = ? OR order_number = ? FOR UPDATE',",
    "'SELECT id, payment_status, payment_method, inventory_state FROM orders WHERE id = ? OR order_number = ? FOR UPDATE',"
  );
  if (!source.includes('ORDER_STOCK_CONFLICT')) {
    source = source.replace(
      "    if (status === 'paid' || (status === 'delivered' && order.payment_method === 'cod')) {\n      await connection.execute(",
      "    if (status === 'paid' || (status === 'delivered' && order.payment_method === 'cod')) {\n      const inventory = await finalizePaidInventory(connection, order.id);\n      if (inventory.stockConflict) throw new Error('ORDER_STOCK_CONFLICT');\n      await connection.execute("
    );
    source = source.replace(
      "      if (status === 'cancelled' || status === 'payment_failed') {\n        const paid =",
      "      if (status === 'cancelled' || status === 'payment_failed') {\n        await releaseOrderReservationInTransaction(connection, order.id);\n        const paid ="
    );
  }

  // Deleting an unpaid COD order must not leak reserved_stock.
  if (!source.includes('releaseOrderReservationInTransaction(connection, rows[0].id);')) {
    source = source.replace(
      "    if (rows[0].payment_status === 'initiated') return 'payment_in_progress';\n    await refundOrderLoyalty(connection, rows[0].id, ['paid', 'paid_stock_review'].includes(rows[0].payment_status));",
      "    if (rows[0].payment_status === 'initiated') return 'payment_in_progress';\n    await releaseOrderReservationInTransaction(connection, rows[0].id);\n    await refundOrderLoyalty(connection, rows[0].id, ['paid', 'paid_stock_review'].includes(rows[0].payment_status));"
    );
  }
  return source;
});

console.log('v30.10.1 commerce consistency applied:', changed.length ? changed.join(', ') : 'already satisfied');
