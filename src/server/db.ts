import { randomUUID } from 'crypto';
import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from './config';

export const pool: Pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export const checkDatabase = async (): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const withTransaction = async <T>(
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const value = await work(connection);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


export interface LoyaltySettingsRecord {
  enabled: boolean;
  pointsPerToman: number;
  tomanPerPoint: number;
  minimumRedeemPoints: number;
  maxRedeemPercent: number;
  signupBonusPoints: number;
  firstOrderBonusPoints: number;
}

const parseStoredJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
};

export const getLoyaltySettings = async (connection: PoolConnection): Promise<LoyaltySettingsRecord> => {
  const [rows] = await connection.query<Array<RowDataPacket & { setting_value: unknown }>>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1"
  );
  const site = parseStoredJson<Record<string, any>>(rows[0]?.setting_value, {});
  const raw = site.loyaltySettings || {};
  return {
    enabled: raw.enabled !== false,
    pointsPerToman: Math.max(0, Number(raw.pointsPerToman ?? 0.0001) || 0),
    tomanPerPoint: Math.max(1, Math.floor(Number(raw.tomanPerPoint ?? 1000) || 1000)),
    minimumRedeemPoints: Math.max(1, Math.floor(Number(raw.minimumRedeemPoints ?? 50) || 50)),
    maxRedeemPercent: Math.min(100, Math.max(0, Number(raw.maxRedeemPercent ?? 50) || 0)),
    signupBonusPoints: Math.max(0, Math.floor(Number(raw.signupBonusPoints ?? 50) || 0)),
    firstOrderBonusPoints: Math.max(0, Math.floor(Number(raw.firstOrderBonusPoints ?? 100) || 0))
  };
};

const loyaltyTierForPoints = (points: number): string =>
  points >= 3000 ? 'diamond' : points >= 1000 ? 'gold' : points >= 500 ? 'silver' : 'bronze';

export const addLoyaltyTransaction = async (
  connection: PoolConnection,
  customerId: string,
  pointsDelta: number,
  type: 'earned' | 'redeemed' | 'bonus' | 'refund',
  details: Record<string, unknown>
): Promise<{ id: string; balanceAfter: number; points: number } | null> => {
  const [rows] = await connection.query<Array<RowDataPacket & { loyalty_points: number }>>(
    'SELECT loyalty_points FROM customers WHERE id = ? FOR UPDATE', [customerId]
  );
  if (!rows[0]) return null;
  const previous = Number(rows[0].loyalty_points || 0);
  const points = pointsDelta < 0 ? Math.max(-previous, Math.trunc(pointsDelta)) : Math.trunc(pointsDelta);
  if (Math.trunc(pointsDelta) === 0) return null;
  const balanceAfter = Math.max(0, previous + points);
  const id = `loy-${randomUUID()}`;
  const data = { ...details, id, customerId, type, points, balanceAfter, date: new Date().toISOString() };
  await connection.execute(
    'INSERT INTO loyalty_transactions (id, customer_id, points, transaction_type, data_json) VALUES (?, ?, ?, ?, ?)',
    [id, customerId, points, type, JSON.stringify(data)]
  );
  await connection.execute(
    'UPDATE customers SET loyalty_points = ?, loyalty_tier = ?, updated_at = NOW() WHERE id = ?',
    [balanceAfter, loyaltyTierForPoints(balanceAfter), customerId]
  );
  return { id, balanceAfter, points };
};

export const awardPaidOrderLoyalty = async (connection: PoolConnection, orderId: string): Promise<void> => {
  const [orders] = await connection.query<Array<RowDataPacket & {
    id: string; order_number: string; customer_id: string | null; subtotal: number | string;
    discount_amount: number | string; payment_status: string;
  }>>('SELECT id, order_number, customer_id, subtotal, discount_amount, payment_status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  const order = orders[0];
  if (!order?.customer_id || !['paid', 'paid_stock_review'].includes(order.payment_status)) return;
  const settings = await getLoyaltySettings(connection);
  if (!settings.enabled) return;
  const [existing] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM loyalty_transactions WHERE customer_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.orderId')) = ? AND transaction_type IN ('earned','bonus') LIMIT 1",
    [order.customer_id, orderId]
  );
  if (existing.length) return;
  const [customerRows] = await connection.query<Array<RowDataPacket & { loyalty_points: number }>>(
    'SELECT loyalty_points FROM customers WHERE id = ? FOR UPDATE', [order.customer_id]
  );
  if (!customerRows[0]) return;
  const points = Number(customerRows[0].loyalty_points || 0);
  const multiplier = points >= 3000 ? 2 : points >= 1000 ? 1.5 : points >= 500 ? 1.25 : 1;
  const netSubtotal = Math.max(0, Number(order.subtotal) - Number(order.discount_amount));
  const basePoints = Math.floor(netSubtotal * settings.pointsPerToman);
  const earned = Math.max(1, Math.round(basePoints * multiplier));
  const [priorOrders] = await connection.query<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM orders WHERE customer_id = ? AND id <> ? AND payment_status IN ('paid','paid_stock_review')",
    [order.customer_id, orderId]
  );
  if (earned > 0) await addLoyaltyTransaction(connection, order.customer_id, earned, 'earned', {
    description: `امتیاز خرید سفارش ${order.order_number}`, orderId, orderNumber: order.order_number, reason: 'paid_order'
  });
  const firstOrderBonus = Number(priorOrders[0]?.total || 0) === 0 ? settings.firstOrderBonusPoints : 0;
  if (firstOrderBonus > 0) await addLoyaltyTransaction(connection, order.customer_id, firstOrderBonus, 'bonus', {
    description: `پاداش اولین خرید - سفارش ${order.order_number}`, orderId, orderNumber: order.order_number, reason: 'first_paid_order'
  });
};

export const refundOrderLoyalty = async (
  connection: PoolConnection, orderId: string, reverseEarnedPoints = false
): Promise<void> => {
  const [orders] = await connection.query<Array<RowDataPacket & { id: string; order_number: string; customer_id: string | null }>>(
    'SELECT id, order_number, customer_id FROM orders WHERE id = ? FOR UPDATE', [orderId]
  );
  const order = orders[0];
  if (!order?.customer_id) return;
  const types = reverseEarnedPoints ? "('redeemed','earned','bonus')" : "('redeemed')";
  const [transactions] = await connection.query<Array<RowDataPacket & { id: string; points: number; transaction_type: string }>>(
    `SELECT id, points, transaction_type FROM loyalty_transactions WHERE customer_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.orderId')) = ? AND transaction_type IN ${types}`,
    [order.customer_id, orderId]
  );
  for (const tx of transactions) {
    const [reversals] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM loyalty_transactions WHERE customer_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.reversalOf')) = ? LIMIT 1",
      [order.customer_id, tx.id]
    );
    if (reversals.length) continue;
    await addLoyaltyTransaction(connection, order.customer_id, -Number(tx.points), 'refund', {
      description: `اصلاح امتیاز سفارش ${order.order_number}`, orderId, orderNumber: order.order_number, reversalOf: tx.id,
      reason: tx.transaction_type === 'redeemed' ? 'redemption_return' : 'order_refund'
    });
  }
};

export type { RowDataPacket, ResultSetHeader };
