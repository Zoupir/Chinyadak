import type { PoolConnection } from 'mysql2/promise';
import { pool, withTransaction, type RowDataPacket } from './db';

export type InventoryState = 'none' | 'reserved' | 'committed' | 'released';

interface OrderReservationRow extends RowDataPacket {
  id: string;
  payment_status: string;
  inventory_state: InventoryState | null;
  inventory_reserved_at: Date | null;
  reservation_expires_at: Date | null;
}

interface ReservedItemRow extends RowDataPacket {
  product_id: string | null;
  quantity: number;
}

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

const fetchLockedOrder = async (connection: PoolConnection, orderId: string) => {
  const [orders] = await connection.query<OrderReservationRow[]>(
    `SELECT id, payment_status, inventory_state, inventory_reserved_at, reservation_expires_at
     FROM orders WHERE id = ? FOR UPDATE`,
    [orderId]
  );
  return orders[0];
};

const releaseReservationLocked = async (
  connection: PoolConnection,
  orderId: string,
  order?: OrderReservationRow
): Promise<boolean> => {
  const current = order || await fetchLockedOrder(connection, orderId);
  if (!current || current.inventory_state !== 'reserved') return false;
  if (current.payment_status === 'paid' || current.payment_status === 'paid_stock_review') return false;

  const [items] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );

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
     SET inventory_state = 'released',
         inventory_reserved_at = NULL,
         reservation_expires_at = NULL,
         payment_status = CASE
           WHEN payment_status IN ('initiated', 'expired') THEN 'unpaid'
           ELSE payment_status
         END,
         updated_at = NOW()
     WHERE id = ?`,
    [orderId]
  );
  return true;
};

export const releaseOrderReservationInTransaction = async (
  connection: PoolConnection,
  orderId: string
): Promise<boolean> => {
  const order = await fetchLockedOrder(connection, orderId);
  return releaseReservationLocked(connection, orderId, order);
};

export const reserveOrderInventory = async (
  connection: PoolConnection,
  orderId: string,
  options: { persistent?: boolean } = {}
): Promise<Date | null> => {
  let order = await fetchLockedOrder(connection, orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.inventory_state === 'committed' || order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') {
    throw new Error('ORDER_ALREADY_PAID');
  }

  const persistent = options.persistent === true;
  const now = Date.now();

  if (order.inventory_state === 'reserved') {
    if (persistent) return null;

    if (!order.reservation_expires_at) {
      // Convert an existing persistent COD reservation into a timed online-payment
      // reservation without incrementing reserved_stock for a second time.
      const expiresAt = new Date(now + reservationMinutes() * 60_000);
      await connection.execute(
        `UPDATE orders
         SET reservation_expires_at = ?, payment_status = 'initiated', status = 'pending', updated_at = NOW()
         WHERE id = ?`,
        [expiresAt, orderId]
      );
      return expiresAt;
    }

    if (new Date(order.reservation_expires_at).getTime() > now) {
      throw new Error('PAYMENT_ALREADY_IN_PROGRESS');
    }
    await releaseReservationLocked(connection, orderId, order);
    order = (await fetchLockedOrder(connection, orderId))!;
  }

  const [items] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  if (!items.length) throw new Error('ORDER_ITEMS_MISSING');

  const lockedProducts = new Map<string, InventoryProductRow>();
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
    lockedProducts.set(product.id, product);

    const available = Number(product.stock) - Number(product.reserved_stock || 0);
    if (available < item.quantity) {
      const error = new Error('INSUFFICIENT_STOCK') as Error & { productId?: string; available?: number };
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

  const expiresAt = persistent ? null : new Date(now + reservationMinutes() * 60_000);
  await connection.execute(
    `UPDATE orders
     SET status = 'pending',
         inventory_state = 'reserved',
         inventory_reserved_at = NOW(),
         reservation_expires_at = ?,
         payment_status = CASE WHEN ? = 1 THEN payment_status ELSE 'initiated' END,
         updated_at = NOW()
     WHERE id = ?`,
    [expiresAt, persistent ? 1 : 0, orderId]
  );

  return expiresAt;
};

export const releaseOrderReservation = async (orderId: string): Promise<void> => {
  await withTransaction(async connection => {
    await releaseOrderReservationInTransaction(connection, orderId);
  });
};

export const finalizePaidInventory = async (
  connection: PoolConnection,
  orderId: string
): Promise<{ stockConflict: boolean }> => {
  const order = await fetchLockedOrder(connection, orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.inventory_state === 'committed') return { stockConflict: false };

  const [items] = await connection.query<ReservedItemRow[]>(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  if (!items.length) throw new Error('ORDER_ITEMS_MISSING');

  const products = new Map<string, InventoryProductRow>();
  let stockConflict = false;
  const hasReservation = order.inventory_state === 'reserved';

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

    if (Number(product.stock) < item.quantity) stockConflict = true;
    if (hasReservation && Number(product.reserved_stock || 0) < item.quantity) stockConflict = true;
  }

  if (stockConflict) {
    if (hasReservation) await releaseReservationLocked(connection, orderId, order);
    return { stockConflict: true };
  }

  for (const item of items) {
    if (!item.product_id) continue;
    const product = products.get(item.product_id)!;
    const newStock = Number(product.stock) - item.quantity;
    const newReserved = hasReservation
      ? Math.max(0, Number(product.reserved_stock || 0) - item.quantity)
      : Number(product.reserved_stock || 0);

    const data = parseJson<any>(product.data_json, {});
    data.stock = newStock;
    data.stockStatus = stockStatus(Math.max(0, newStock - newReserved));

    await connection.execute(
      `UPDATE products
       SET stock = ?, reserved_stock = ?, data_json = ?, updated_at = NOW()
       WHERE id = ?`,
      [newStock, newReserved, JSON.stringify(data), product.id]
    );
  }

  await connection.execute(
    `UPDATE orders
     SET inventory_state = 'committed', inventory_reserved_at = NULL,
         reservation_expires_at = NULL, updated_at = NOW()
     WHERE id = ?`,
    [orderId]
  );
  return { stockConflict: false };
};

export const releaseExpiredReservations = async (): Promise<number> => {
  const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    `SELECT id
     FROM orders
     WHERE inventory_state = 'reserved'
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at < NOW()
       AND payment_status NOT IN ('paid', 'paid_stock_review')`
  );

  let released = 0;
  for (const row of rows) {
    await withTransaction(async connection => {
      const order = await fetchLockedOrder(connection, row.id);
      if (!order || order.inventory_state !== 'reserved' || !order.reservation_expires_at) return;
      if (new Date(order.reservation_expires_at).getTime() >= Date.now()) return;
      if (order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') return;

      if (await releaseReservationLocked(connection, row.id, order)) released += 1;
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
    });
  }

  return released;
};
