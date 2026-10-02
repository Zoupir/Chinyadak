import type { PoolConnection } from 'mysql2/promise';
import { pool, withTransaction, type RowDataPacket } from './db';

interface OrderReservationRow extends RowDataPacket {
  id: string;
  payment_status: string;
  reservation_expires_at: Date | null;
}

interface ReservedItemRow extends RowDataPacket {
  product_id: string | null;
  quantity: number;
}

const aggregateReservedItems = (items: ReservedItemRow[]): ReservedItemRow[] => {
  const totals = new Map<string, number>();
  let missingQuantity = 0;

  for (const item of items) {
    const quantity = Math.max(0, Math.floor(Number(item.quantity || 0)));
    if (!quantity) continue;
    if (!item.product_id) {
      missingQuantity += quantity;
      continue;
    }
    totals.set(item.product_id, (totals.get(item.product_id) || 0) + quantity);
  }

  const aggregated = Array.from(totals, ([product_id, quantity]) => ({
    product_id,
    quantity
  })) as ReservedItemRow[];

  if (missingQuantity > 0) {
    aggregated.push({ product_id: null, quantity: missingQuantity } as ReservedItemRow);
  }
  return aggregated;
};

interface InventoryProductRow extends RowDataPacket {
  id: string;
  stock: number;
  reserved_stock: number;
  data_json: any;
}

const reservationMinutes = (): number => {
  const value = Number(process.env.PAYMENT_RESERVATION_MINUTES || 30);
  if (!Number.isFinite(value)) return 30;
  return Math.max(5, Math.min(120, Math.floor(value)));
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const stockStatus = (stock: number): string =>
  stock <= 0 ? 'out_of_stock' : stock <= 3 ? 'low_stock' : 'in_stock';

const releaseReservationLocked = async (
  connection: PoolConnection,
  orderId: string
): Promise<void> => {
  const [rawItems] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  const items = aggregateReservedItems(rawItems);

  for (const item of items) {
    if (!item.product_id) continue;
    await connection.execute(
      `UPDATE products
       SET reserved_stock = GREATEST(0, reserved_stock - ?), updated_at = NOW()
       WHERE id = ?`,
      [item.quantity, item.product_id]
    );
  }

  await connection.execute(
    `UPDATE orders
     SET reservation_expires_at = NULL,
         payment_status = CASE
           WHEN payment_status IN ('initiated', 'expired') THEN 'unpaid'
           ELSE payment_status
         END,
         updated_at = NOW()
     WHERE id = ?`,
    [orderId]
  );
};

export const reserveOrderInventory = async (
  connection: PoolConnection,
  orderId: string
): Promise<Date> => {
  const [orders] = await connection.query<OrderReservationRow[]>(
    `SELECT id, payment_status, reservation_expires_at
     FROM orders
     WHERE id = ?
     FOR UPDATE`,
    [orderId]
  );
  const order = orders[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') {
    throw new Error('ORDER_ALREADY_PAID');
  }

  const now = Date.now();
  if (order.reservation_expires_at) {
    const expiresAt = new Date(order.reservation_expires_at).getTime();
    if (expiresAt > now) {
      throw new Error('PAYMENT_ALREADY_IN_PROGRESS');
    }
    await releaseReservationLocked(connection, orderId);
  }

  const [rawItems] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  const items = aggregateReservedItems(rawItems);
  if (!items.length) throw new Error('ORDER_ITEMS_MISSING');

  for (const item of items) {
    if (!item.product_id) throw new Error('ORDER_PRODUCT_UNAVAILABLE');
    const [products] = await connection.query<InventoryProductRow[]>(
      `SELECT id, stock, reserved_stock, data_json
       FROM products
       WHERE id = ? AND status = 'active'
       FOR UPDATE`,
      [item.product_id]
    );
    const product = products[0];
    if (!product) throw new Error('ORDER_PRODUCT_UNAVAILABLE');

    const available = Number(product.stock) - Number(product.reserved_stock || 0);
    if (available < item.quantity) {
      const error = new Error('INSUFFICIENT_STOCK') as Error & {
        productId?: string;
        available?: number;
      };
      error.productId = product.id;
      error.available = Math.max(0, available);
      throw error;
    }
  }

  for (const item of items) {
    if (!item.product_id) continue;
    await connection.execute(
      `UPDATE products
       SET reserved_stock = reserved_stock + ?, updated_at = NOW()
       WHERE id = ?`,
      [item.quantity, item.product_id]
    );
  }

  const expiresAt = new Date(Date.now() + reservationMinutes() * 60_000);
  await connection.execute(
    `UPDATE orders
     SET status = 'pending',
         reservation_expires_at = ?,
         payment_status = 'initiated',
         updated_at = NOW()
     WHERE id = ?`,
    [expiresAt, orderId]
  );

  return expiresAt;
};

export const releaseOrderReservation = async (orderId: string): Promise<void> => {
  await withTransaction(async connection => {
    const [orders] = await connection.query<OrderReservationRow[]>(
      'SELECT id, payment_status, reservation_expires_at FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    const order = orders[0];
    if (!order?.reservation_expires_at) return;
    if (order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') return;
    await releaseReservationLocked(connection, orderId);
  });
};

export const finalizePaidInventory = async (
  connection: PoolConnection,
  orderId: string
): Promise<{ stockConflict: boolean }> => {
  const [orders] = await connection.query<OrderReservationRow[]>(
    'SELECT id, payment_status, reservation_expires_at FROM orders WHERE id = ? FOR UPDATE',
    [orderId]
  );
  const order = orders[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.payment_status === 'paid') return { stockConflict: false };
  if (order.payment_status === 'paid_stock_review') return { stockConflict: true };

  const [rawItems] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  const items = aggregateReservedItems(rawItems);

  const products = new Map<string, InventoryProductRow>();
  let stockConflict = false;

  for (const item of items) {
    if (!item.product_id) {
      stockConflict = true;
      continue;
    }
    const [rows] = await connection.query<InventoryProductRow[]>(
      'SELECT id, stock, reserved_stock, data_json FROM products WHERE id = ? FOR UPDATE',
      [item.product_id]
    );
    const product = rows[0];
    if (!product) {
      stockConflict = true;
      continue;
    }
    products.set(product.id, product);

    const hasReservation = Boolean(order.reservation_expires_at);
    if (Number(product.stock) < item.quantity) {
      stockConflict = true;
    }
    if (hasReservation && Number(product.reserved_stock || 0) < item.quantity) {
      stockConflict = true;
    }
  }

  if (stockConflict) {
    if (order.reservation_expires_at) {
      for (const item of items) {
        if (!item.product_id) continue;
        await connection.execute(
          `UPDATE products
           SET reserved_stock = GREATEST(0, reserved_stock - ?), updated_at = NOW()
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }
    }
    return { stockConflict: true };
  }

  for (const item of items) {
    if (!item.product_id) continue;
    const product = products.get(item.product_id)!;
    const newStock = Number(product.stock) - item.quantity;
    const newReserved = order.reservation_expires_at
      ? Math.max(0, Number(product.reserved_stock || 0) - item.quantity)
      : Number(product.reserved_stock || 0);

    const data = parseJson<any>(product.data_json, {});
    data.stock = newStock;
    data.stockStatus = stockStatus(newStock);

    await connection.execute(
      `UPDATE products
       SET stock = ?,
           reserved_stock = ?,
           data_json = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newStock, newReserved, JSON.stringify(data), product.id]
    );
  }

  return { stockConflict: false };
};

export const releaseExpiredReservations = async (): Promise<number> => {
  const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    `SELECT id
     FROM orders
     WHERE reservation_expires_at IS NOT NULL
       AND reservation_expires_at < NOW()
       AND payment_status NOT IN ('paid', 'paid_stock_review')`
  );

  let released = 0;
  for (const row of rows) {
    await withTransaction(async connection => {
      const [locked] = await connection.query<OrderReservationRow[]>(
        'SELECT id, payment_status, reservation_expires_at FROM orders WHERE id = ? FOR UPDATE',
        [row.id]
      );
      const order = locked[0];
      if (!order?.reservation_expires_at) return;
      if (new Date(order.reservation_expires_at).getTime() >= Date.now()) return;
      if (order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') return;

      await releaseReservationLocked(connection, row.id);
      await connection.execute(
        `UPDATE payment_transactions
         SET status = CASE
           WHEN status IN ('created', 'redirected', 'callback') THEN 'expired'
           ELSE status
         END,
         updated_at = NOW()
         WHERE order_id = ?`,
        [row.id]
      );
      released += 1;
    });
  }

  return released;
};
