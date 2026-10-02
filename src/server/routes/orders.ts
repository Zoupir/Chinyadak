import { randomInt, randomUUID } from 'crypto';
import { Router } from 'express';
import {
  authenticate,
  getOptionalSession,
  requireAdminPermission,
  type AuthenticatedRequest
} from '../auth';
import {
  pool,
  withTransaction,
  type ResultSetHeader,
  type RowDataPacket
} from '../db';
import { getCommerceSettings, resolveShipping } from '../commerce-settings';
import { issuePaymentToken } from '../payment-token';

interface ProductPriceRow extends RowDataPacket {
  id: string;
  sku: string;
  name_fa: string;
  oem_number: string | null;
  price: number | string;
  discount_price: number | string | null;
  stock: number;
  reserved_stock: number;
  data_json: any;
}

interface OrderRow extends RowDataPacket {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: string;
  customer_snapshot: any;
  shipping_snapshot: any;
  payment_method: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  total: number | string;
  payment_status: string;
  payment_reference: string | null;
  paid_at: Date | null;
  tracking_code: string | null;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
  order_id: string;
  product_id: string | null;
  sku: string | null;
  product_name: string;
  oem_number: string | null;
  unit_price: number | string;
  quantity: number;
  line_total: number | string;
  metadata_json: any;
}

const ORDER_COLUMNS = [
  'id',
  'order_number',
  'customer_id',
  'status',
  'customer_snapshot',
  'shipping_snapshot',
  'payment_method',
  'subtotal',
  'discount_amount',
  'shipping_fee',
  'total',
  'payment_status',
  'payment_reference',
  'paid_at',
  'tracking_code',
  'created_at'
].join(', ');

const ORDER_ITEM_COLUMNS = [
  'order_id',
  'product_id',
  'sku',
  'product_name',
  'oem_number',
  'unit_price',
  'quantity',
  'line_total',
  'metadata_json'
].join(', ');

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const statusTitle = (status: string): string => {
  switch (status) {
    case 'pending': return 'در انتظار پرداخت';
    case 'paid': return 'پرداخت شده';
    case 'processing': return 'در حال پردازش در انبار';
    case 'ready_to_ship': return 'آماده ارسال';
    case 'shipped': return 'ارسال شده به متصدی حمل';
    case 'delivered': return 'تحویل داده شده';
    case 'payment_failed': return 'خطای پرداخت';
    case 'cancelled': return 'لغو شده';
    default: return 'در انتظار پرداخت';
  }
};

const normalizePhone = (input: unknown): string => {
  let value = String(input ?? '').replace(/\D/g, '');
  if (value.startsWith('0098')) value = '0' + value.slice(4);
  else if (value.startsWith('98')) value = '0' + value.slice(2);
  return value;
};

const fallbackShippingSnapshot = () => ({
  id: 'post',
  title: 'پست پیشتاز بیمه‌شده',
  cost: 0,
  estimatedDelivery: '۲۴ الی ۴۸ ساعت'
});

const paymentTitle = (id: string) => {
  if (id === 'mellat') return 'به‌پرداخت بانک ملت';
  if (id === 'saman') return 'درگاه پرداخت الکترونیک سامان';
  return 'پرداخت آنلاین';
};

const createOrderNumber = (): string =>
  `CHP-${Date.now().toString().slice(-6)}-${randomInt(1000, 9999)}`;

const orderDto = (row: OrderRow, items: OrderItemRow[]) => {
  const customer = parseJson<any>(row.customer_snapshot, {});
  const shippingMethod = parseJson<any>(row.shipping_snapshot, fallbackShippingSnapshot());
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(row.created_at)),
    status: row.status,
    statusTitle: statusTitle(row.status),
    items: items.map(item => {
      const metadata = parseJson<any>(item.metadata_json, {});
      return {
        productId: item.product_id || '',
        productName: item.product_name,
        oemNumber: item.oem_number || '',
        price: Number(item.unit_price),
        quantity: item.quantity,
        image: metadata.image || '',
        grade: metadata.grade || 'aftermarket',
        vehicleInfo: metadata.vehicleInfo || undefined
      };
    }),
    customer,
    shippingMethod,
    paymentMethod: {
      id: row.payment_method || '',
      title: paymentTitle(row.payment_method || '')
    },
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    trackingPostCode: row.tracking_code || undefined,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference || undefined,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : undefined
  };
};

const fetchOrdersByWhere = async (
  whereSql: string,
  params: unknown[],
  limit = 100,
  offset = 0
) => {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  const [rows] = await pool.query<OrderRow[]>(
    `SELECT ${ORDER_COLUMNS}
     FROM orders
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, safeOffset]
  );
  if (!rows.length) return [];
  const ids = rows.map(row => row.id);
  const placeholders = ids.map(() => '?').join(',');
  const [itemRows] = await pool.query<OrderItemRow[]>(
    `SELECT ${ORDER_ITEM_COLUMNS}
     FROM order_items
     WHERE order_id IN (${placeholders})
     ORDER BY id ASC`,
    ids
  );
  const grouped = new Map<string, OrderItemRow[]>();
  for (const item of itemRows) {
    const list = grouped.get(item.order_id) || [];
    list.push(item);
    grouped.set(item.order_id, list);
  }
  return rows.map(row => orderDto(row, grouped.get(row.id) || []));
};

export const ordersRouter = Router();

ordersRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const customerInput = req.body?.customer || {};
  const firstName = String(customerInput.firstName || '').trim();
  const lastName = String(customerInput.lastName || '').trim();
  const phone = normalizePhone(customerInput.phone);
  const province = String(customerInput.province || '').trim();
  const city = String(customerInput.city || '').trim();
  const postalCode = String(customerInput.postalCode || '').trim();
  const address = String(customerInput.address || '').trim();
  const notes = String(customerInput.notes || '').trim();
  const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const shippingMethodId = String(req.body?.shippingMethodId || 'post');
  const paymentMethod = String(req.body?.paymentMethodId || 'saman');

  if (!firstName || !lastName || !/^09\d{9}$/.test(phone) || !address) {
    res.status(400).json({ error: 'ORDER_CUSTOMER_INVALID' });
    return;
  }
  if (!requestedItems.length || requestedItems.length > 100) {
    res.status(400).json({ error: 'ORDER_ITEMS_INVALID' });
    return;
  }

  const compactItems = requestedItems
    .map((item: any) => ({
      productId: String(item.productId || '').trim(),
      quantity: Math.max(1, Math.min(100, Math.floor(Number(item.quantity || 1)))),
      vehicleInfo: item.vehicleInfo ? String(item.vehicleInfo).slice(0, 255) : ''
    }))
    .filter((item: any) => item.productId);

  if (!compactItems.length) {
    res.status(400).json({ error: 'ORDER_ITEMS_INVALID' });
    return;
  }

  // Collapse duplicate product lines before stock validation and reservation.
  // This prevents two lines for the same SKU from bypassing per-line stock checks.
  const aggregatedByProduct = new Map<string, { productId: string; quantity: number; vehicleInfo: string }>();
  for (const item of compactItems) {
    const existing = aggregatedByProduct.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      if (!existing.vehicleInfo && item.vehicleInfo) existing.vehicleInfo = item.vehicleInfo;
    } else {
      aggregatedByProduct.set(item.productId, { ...item });
    }
  }
  const normalizedRequestItems = Array.from(aggregatedByProduct.values());
  if (normalizedRequestItems.some(item => item.quantity > 100)) {
    res.status(400).json({ error: 'ORDER_ITEM_QUANTITY_INVALID' });
    return;
  }

  const productIds = normalizedRequestItems.map(item => item.productId);
  const placeholders = productIds.map(() => '?').join(',');
  const [productRows] = await pool.query<ProductPriceRow[]>(
    `SELECT id, sku, name_fa, oem_number, price, discount_price, stock, reserved_stock, data_json
     FROM products
     WHERE status = 'active' AND id IN (${placeholders})`,
    productIds
  );

  if (productRows.length !== productIds.length) {
    res.status(409).json({ error: 'ORDER_PRODUCT_UNAVAILABLE' });
    return;
  }

  const productMap = new Map(productRows.map(row => [row.id, row]));
  let subtotal = 0;
  const normalizedItems: Array<{
    productId: string;
    sku: string;
    productName: string;
    oemNumber: string;
    price: number;
    quantity: number;
    image: string;
    grade: string;
    vehicleInfo?: string;
  }> = [];

  for (const item of normalizedRequestItems) {
    const row = productMap.get(item.productId)!;
    const availableStock = Math.max(0, Number(row.stock) - Number(row.reserved_stock || 0));
    if (availableStock < item.quantity) {
      res.status(409).json({
        error: 'INSUFFICIENT_STOCK',
        productId: row.id,
        available: availableStock
      });
      return;
    }

    const data = parseJson<any>(row.data_json, {});
    const unitPrice = Number(row.discount_price ?? row.price);
    subtotal += unitPrice * item.quantity;
    normalizedItems.push({
      productId: row.id,
      sku: row.sku,
      productName: row.name_fa,
      oemNumber: row.oem_number || '',
      price: unitPrice,
      quantity: item.quantity,
      image: Array.isArray(data.images) ? (data.images[0] || '') : '',
      grade: data.grade || 'aftermarket',
      vehicleInfo: item.vehicleInfo || undefined
    });
  }

  const optionalSession = await getOptionalSession(req);
  const customerId =
    optionalSession?.role === 'customer' ? optionalSession.sub : null;

  const commerceSettings = await getCommerceSettings();
  if (!customerId && !commerceSettings.enableGuestCheckout) {
    res.status(403).json({ error: 'GUEST_CHECKOUT_DISABLED' });
    return;
  }
  const shipping = resolveShipping(shippingMethodId, subtotal, commerceSettings);

  // Coupons and loyalty redemption are intentionally ignored until their
  // server-side validation modules are enabled. Never trust client totals.
  const discountAmount = 0;
  const total = Math.max(0, subtotal - discountAmount + shipping.cost);
  const orderId = randomUUID();
  const orderNumber = createOrderNumber();

  const customerSnapshot = {
    firstName,
    lastName,
    phone,
    province,
    city,
    postalCode,
    address,
    notes: notes || undefined
  };

  await withTransaction(async connection => {
    await connection.execute(
      `INSERT INTO orders
       (id, order_number, customer_id, status, customer_snapshot, shipping_snapshot,
        payment_method, subtotal, discount_amount, shipping_fee, total, payment_status)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      [
        orderId,
        orderNumber,
        customerId,
        JSON.stringify(customerSnapshot),
        JSON.stringify(shipping),
        paymentMethod,
        subtotal,
        discountAmount,
        shipping.cost,
        total
      ]
    );

    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, sku, product_name, oem_number, unit_price, quantity, line_total, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.sku,
          item.productName,
          item.oemNumber || null,
          item.price,
          item.quantity,
          item.price * item.quantity,
          JSON.stringify({
            image: item.image,
            grade: item.grade,
            vehicleInfo: item.vehicleInfo
          })
        ]
      );
    }
  });

  const created = await fetchOrdersByWhere('WHERE id = ?', [orderId]);
  res.status(201).json({
    order: created[0],
    paymentToken: issuePaymentToken(orderId, orderNumber)
  });
});

ordersRouter.post('/track', async (req, res) => {
  const orderNumber = String(req.body?.orderNumber || '').trim().toUpperCase();
  const phone = normalizePhone(req.body?.phone);
  if (!orderNumber || !/^09\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'TRACKING_DATA_INVALID' });
    return;
  }

  const orders = await fetchOrdersByWhere(
    `WHERE order_number = ?
     AND JSON_UNQUOTE(JSON_EXTRACT(customer_snapshot, '$.phone')) = ?`,
    [orderNumber, phone]
  );
  if (!orders[0]) {
    res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    return;
  }
  res.json({
    order: orders[0],
    paymentToken: issuePaymentToken(orders[0].id, orders[0].orderNumber)
  });
});

ordersRouter.get('/mine', authenticate, async (req: AuthenticatedRequest, res) => {
  if (req.auth?.role !== 'customer') {
    res.status(403).json({ error: 'CUSTOMER_REQUIRED' });
    return;
  }
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit || 50))));
  const offset = (page - 1) * limit;

  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    'SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?',
    [req.auth.sub]
  );
  const total = Number(countRows[0]?.total || 0);
  const orders = await fetchOrdersByWhere('WHERE customer_id = ?', [req.auth.sub], limit, offset);
  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + orders.length < total
    }
  });
});

ordersRouter.get('/', requireAdminPermission('canManageOrders'), async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit || 100))));
  const offset = (page - 1) * limit;

  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    'SELECT COUNT(*) AS total FROM orders WHERE archived_at IS NULL'
  );
  const total = Number(countRows[0]?.total || 0);
  const orders = await fetchOrdersByWhere('WHERE archived_at IS NULL', [], limit, offset);

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + orders.length < total
    }
  });
});

ordersRouter.patch('/:id/status', requireAdminPermission('canManageOrders'), async (req, res) => {
  const status = String(req.body?.status || '');
  const allowed = [
    'pending',
    'paid',
    'processing',
    'ready_to_ship',
    'shipped',
    'delivered',
    'payment_failed',
    'cancelled'
  ];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'ORDER_STATUS_INVALID' });
    return;
  }

  const trackingCode = req.body?.trackingCode ? String(req.body.trackingCode).trim() : null;
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE orders
     SET status = ?, tracking_code = COALESCE(?, tracking_code), updated_at = NOW()
     WHERE id = ? OR order_number = ?`,
    [status, trackingCode, req.params.id, req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    return;
  }
  const orders = await fetchOrdersByWhere('WHERE id = ? OR order_number = ?', [req.params.id, req.params.id]);
  res.json({ order: orders[0] });
});

ordersRouter.delete('/:id', requireAdminPermission('canManageOrders'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE orders
     SET archived_at = COALESCE(archived_at, NOW()), updated_at = NOW()
     WHERE id = ? OR order_number = ?`,
    [req.params.id, req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    return;
  }
  res.json({ ok: true, archived: true });
});
