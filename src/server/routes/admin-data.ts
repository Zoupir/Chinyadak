import { randomBytes, randomUUID } from 'crypto';
import { Router } from 'express';
import {
  hashPassword,
  requireAdminPermission,
  type AuthenticatedRequest
} from '../auth';
import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';

interface CustomerRow extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  customer_type: 'retail' | 'mechanic' | 'wholesale';
  status: 'active' | 'blocked';
  vehicle: string | null;
  address: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  password_initialized: number;
  created_at: Date;
  total_orders: number | string;
  total_spent: number | string;
}

interface AdminRow extends RowDataPacket {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  permissions_json: string | object | null;
  is_active: number;
  session_version: number;
  created_at: Date;
}

interface LoyaltyRow extends RowDataPacket {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: string;
  data_json: any;
  created_at: Date;
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const customerTypeTitle = (type: string): string =>
  type === 'wholesale'
    ? 'همکار / عمده‌فروش'
    : type === 'mechanic'
      ? 'تعمیرکار / مکانیک'
      : 'مشتری عادی';

const adminRoleTitle = (role: string): string => {
  switch (role) {
    case 'super_admin': return 'مدیر کل ارشد (Super Admin)';
    case 'content_manager': return 'مدیر محتوا و بلاگ';
    case 'order_manager': return 'مدیر فروش و فاکتورها';
    case 'inventory_manager': return 'مدیر کاتالوگ و انبار';
    default: return 'مدیر';
  }
};

const customerDto = (row: CustomerRow) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  email: row.email || undefined,
  type: row.customer_type,
  typeTitle: customerTypeTitle(row.customer_type),
  status: row.status,
  registeredAt: new Intl.DateTimeFormat('fa-IR').format(new Date(row.created_at)),
  totalOrders: Number(row.total_orders || 0),
  totalSpent: Number(row.total_spent || 0),
  vehicle: row.vehicle || '',
  address: row.address || '',
  loyaltyPoints: Number(row.loyalty_points || 0),
  loyaltyTier: row.loyalty_tier,
  loginReady: Boolean(row.password_initialized)
});

const adminDto = (row: AdminRow) => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  roleTitle: adminRoleTitle(row.role),
  avatar: row.avatar_url || undefined,
  email: row.email || undefined,
  phone: row.phone || undefined,
  isActive: Boolean(row.is_active),
  createdAt: new Intl.DateTimeFormat('fa-IR').format(new Date(row.created_at)),
  permissions: parseJson<Record<string, boolean>>(row.permissions_json, {})
});

const loyaltyDto = (row: LoyaltyRow) => ({
  ...parseJson<any>(row.data_json, {}),
  id: row.id,
  customerId: row.customer_id,
  type: row.transaction_type,
  points: Number(row.points)
});

const loyaltyTierForPoints = (points: number): string =>
  points >= 3000 ? 'diamond' : points >= 1000 ? 'gold' : points >= 500 ? 'silver' : 'bronze';

const normalizePhone = (input: unknown): string => {
  let value = String(input ?? '').replace(/\D/g, '');
  if (value.startsWith('0098')) value = '0' + value.slice(4);
  else if (value.startsWith('98')) value = '0' + value.slice(2);
  return value;
};

const requesterIsSuperAdmin = async (req: AuthenticatedRequest): Promise<boolean> => {
  if (!req.auth?.sub) return false;
  const [rows] = await pool.query<Array<RowDataPacket & { role: string }>>(
    'SELECT role FROM admin_users WHERE id = ? LIMIT 1',
    [req.auth.sub]
  );
  return rows[0]?.role === 'super_admin';
};

export const adminDataRouter = Router();

adminDataRouter.get('/customers', requireAdminPermission('canManageOrders'), async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit || 100))));
  const offset = (page - 1) * limit;
  const q = String(req.query.q || '').trim().slice(0, 120);
  const status = String(req.query.status || '').trim();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (q) {
    const like = `%${q}%`;
    clauses.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
    params.push(like, like, like, like);
  }
  if (status === 'active' || status === 'blocked') {
    clauses.push('c.status = ?');
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM customers c ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query<CustomerRow[]>(
    `SELECT
       c.id, c.first_name, c.last_name, c.phone, c.email, c.customer_type, c.status,
       c.vehicle, c.address, c.loyalty_points, c.loyalty_tier, c.password_initialized, c.created_at,
       COUNT(o.id) AS total_orders,
       COALESCE(SUM(CASE WHEN o.payment_status IN ('paid','paid_stock_review') THEN o.total ELSE 0 END), 0) AS total_spent
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     ${where}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  res.json({
    customers: rows.map(customerDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + rows.length < total
    }
  });
});

adminDataRouter.post('/customers', requireAdminPermission('canManageOrders'), async (req, res) => {
  const firstName = String(req.body?.firstName || '').trim();
  const lastName = String(req.body?.lastName || '').trim();
  const phone = normalizePhone(req.body?.phone);
  const email = String(req.body?.email || '').trim() || null;
  const type = String(req.body?.type || 'retail');
  const status = req.body?.status === 'blocked' ? 'blocked' : 'active';
  const vehicle = String(req.body?.vehicle || '').trim() || null;
  const address = String(req.body?.address || '').trim() || null;
  const initialPassword = String(req.body?.initialPassword || '');

  if (!firstName || !lastName || !/^09\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'CUSTOMER_DATA_INVALID' });
    return;
  }
  if (!['retail', 'mechanic', 'wholesale'].includes(type)) {
    res.status(400).json({ error: 'CUSTOMER_TYPE_INVALID' });
    return;
  }
  if (initialPassword && initialPassword.length < 8) {
    res.status(400).json({ error: 'CUSTOMER_INITIAL_PASSWORD_TOO_SHORT' });
    return;
  }

  const temporarySecret = initialPassword || randomBytes(32).toString('hex');
  const passwordHash = await hashPassword(temporarySecret);
  const passwordInitialized = initialPassword ? 1 : 0;
  const id = randomUUID();

  try {
    await pool.execute(
      `INSERT INTO customers
       (id, first_name, last_name, phone, password_hash, password_initialized, email, customer_type, status, vehicle, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, firstName, lastName, phone, passwordHash, passwordInitialized, email, type, status, vehicle, address]
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PHONE_ALREADY_REGISTERED' });
      return;
    }
    throw error;
  }

  const [rows] = await pool.query<CustomerRow[]>(
    `SELECT c.*, 0 AS total_orders, 0 AS total_spent
     FROM customers c WHERE c.id = ? LIMIT 1`,
    [id]
  );
  res.status(201).json({ customer: customerDto(rows[0]) });
});

adminDataRouter.put('/customers/:id', requireAdminPermission('canManageOrders'), async (req, res) => {
  const id = String(req.params.id);
  const firstName = String(req.body?.firstName || '').trim();
  const lastName = String(req.body?.lastName || '').trim();
  const phone = normalizePhone(req.body?.phone);
  const email = String(req.body?.email || '').trim() || null;
  const type = String(req.body?.type || 'retail');
  const vehicle = String(req.body?.vehicle || '').trim() || null;
  const address = String(req.body?.address || '').trim() || null;

  if (!firstName || !lastName || !/^09\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'CUSTOMER_DATA_INVALID' });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE customers
       SET first_name = ?, last_name = ?, phone = ?, email = ?, customer_type = ?,
           vehicle = ?, address = ?, updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, phone, email, type, vehicle, address, id]
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: 'CUSTOMER_NOT_FOUND' });
      return;
    }
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PHONE_ALREADY_REGISTERED' });
      return;
    }
    throw error;
  }

  const [rows] = await pool.query<CustomerRow[]>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS total_orders,
       (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.customer_id = c.id AND o.payment_status IN ('paid','paid_stock_review')) AS total_spent
     FROM customers c WHERE c.id = ? LIMIT 1`,
    [id]
  );
  res.json({ customer: customerDto(rows[0]) });
});

adminDataRouter.patch('/customers/:id/login-password', requireAdminPermission('canManageOrders'), async (req, res) => {
  const id = String(req.params.id || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'CUSTOMER_PASSWORD_TOO_SHORT' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE customers
     SET password_hash = ?,
         password_initialized = 1,
         session_version = session_version + 1,
         updated_at = NOW()
     WHERE id = ?`,
    [passwordHash, id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND' });
    return;
  }

  res.json({ id, loginReady: true });
});

adminDataRouter.patch('/customers/:id/status', requireAdminPermission('canManageOrders'), async (req, res) => {
  const [rows] = await pool.query<Array<RowDataPacket & { status: string }>>(
    'SELECT status FROM customers WHERE id = ? LIMIT 1',
    [req.params.id]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND' });
    return;
  }
  const status = rows[0].status === 'active' ? 'blocked' : 'active';
  await pool.execute(
    'UPDATE customers SET status = ?, session_version = session_version + 1, updated_at = NOW() WHERE id = ?',
    [status, req.params.id]
  );
  res.json({ id: req.params.id, status });
});

adminDataRouter.get('/loyalty', requireAdminPermission('canManageOrders'), async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(250, Math.floor(Number(req.query.limit || 150))));
  const offset = (page - 1) * limit;
  const customerId = String(req.query.customerId || '').trim();
  const where = customerId ? 'WHERE customer_id = ?' : '';
  const params: unknown[] = customerId ? [customerId] : [];

  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM loyalty_transactions ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query<LoyaltyRow[]>(
    `SELECT id, customer_id, transaction_type, points, description, order_number, balance_after, created_at
     FROM loyalty_transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  res.json({
    transactions: rows.map(loyaltyDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + rows.length < total
    }
  });
});

adminDataRouter.post('/loyalty', requireAdminPermission('canManageOrders'), async (req, res) => {
  const customerId = String(req.body?.customerId || '').trim();
  const type = String(req.body?.type || 'bonus');
  const points = Math.trunc(Number(req.body?.points || 0));
  const description = String(req.body?.description || '').trim();
  const orderNumber = req.body?.orderNumber ? String(req.body.orderNumber) : undefined;

  if (!customerId || !['earned','redeemed','bonus','refund'].includes(type) || !points) {
    res.status(400).json({ error: 'LOYALTY_DATA_INVALID' });
    return;
  }

  const result = await withTransaction(async connection => {
    const [customers] = await connection.query<Array<RowDataPacket & { loyalty_points: number }>>(
      'SELECT loyalty_points FROM customers WHERE id = ? FOR UPDATE',
      [customerId]
    );
    if (!customers[0]) throw new Error('CUSTOMER_NOT_FOUND');

    const nextBalance = Math.max(0, Number(customers[0].loyalty_points || 0) + points);
    const id = `loy-${randomUUID()}`;
    const data = {
      id,
      customerId,
      type,
      points,
      description,
      orderNumber,
      date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      balanceAfter: nextBalance
    };

    await connection.execute(
      `INSERT INTO loyalty_transactions
       (id, customer_id, points, transaction_type, data_json)
       VALUES (?, ?, ?, ?, ?)`,
      [id, customerId, points, type, JSON.stringify(data)]
    );
    await connection.execute(
      'UPDATE customers SET loyalty_points = ?, loyalty_tier = ?, updated_at = NOW() WHERE id = ?',
      [nextBalance, loyaltyTierForPoints(nextBalance), customerId]
    );
    return data;
  }).catch(error => {
    if ((error as Error).message === 'CUSTOMER_NOT_FOUND') return null;
    throw error;
  });

  if (!result) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND' });
    return;
  }
  res.status(201).json({ transaction: result });
});

adminDataRouter.get('/admins', requireAdminPermission('canManageAdmins'), async (_req, res) => {
  const [rows] = await pool.query<AdminRow[]>(
    'SELECT * FROM admin_users WHERE deleted_at IS NULL ORDER BY created_at ASC'
  );
  res.json({ admins: rows.map(adminDto) });
});

adminDataRouter.post('/admins', requireAdminPermission('canManageAdmins'), async (req: AuthenticatedRequest, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const fullName = String(req.body?.fullName || '').trim();
  const role = String(req.body?.role || 'order_manager');
  const allowedRoles = ['super_admin', 'content_manager', 'order_manager', 'inventory_manager'];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({ error: 'ADMIN_ROLE_INVALID' });
    return;
  }
  const email = String(req.body?.email || '').trim() || null;
  const phone = String(req.body?.phone || '').trim() || null;
  const avatar = String(req.body?.avatar || '').trim() || null;
  const isActive = req.body?.isActive === false ? 0 : 1;
  const permissions = req.body?.permissions && typeof req.body.permissions === 'object'
    ? req.body.permissions
    : {};

  if (!username || !fullName || password.length < 10) {
    res.status(400).json({ error: 'ADMIN_DATA_INVALID' });
    return;
  }
  if (role === 'super_admin' && !(await requesterIsSuperAdmin(req))) {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return;
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  try {
    await pool.execute(
      `INSERT INTO admin_users
       (id, username, password_hash, full_name, email, phone, avatar_url, role, permissions_json, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, username, passwordHash, fullName, email, phone, avatar, role, JSON.stringify(permissions), isActive]
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'ADMIN_USERNAME_EXISTS' });
      return;
    }
    throw error;
  }

  const [rows] = await pool.query<AdminRow[]>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id]);
  res.status(201).json({ admin: adminDto(rows[0]) });
});

adminDataRouter.put('/admins/:id', requireAdminPermission('canManageAdmins'), async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const [existingRows] = await pool.query<AdminRow[]>(
    'SELECT * FROM admin_users WHERE id = ? LIMIT 1',
    [id]
  );
  const existing = existingRows[0];
  if (!existing) {
    res.status(404).json({ error: 'ADMIN_NOT_FOUND' });
    return;
  }

  const username = String(req.body?.username || existing.username).trim().toLowerCase();
  const fullName = String(req.body?.fullName || existing.full_name).trim();
  const role = String(req.body?.role || existing.role);
  const allowedRoles = ['super_admin', 'content_manager', 'order_manager', 'inventory_manager'];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({ error: 'ADMIN_ROLE_INVALID' });
    return;
  }
  const password = String(req.body?.password || '');
  const email = String(req.body?.email || '').trim() || null;
  const phone = String(req.body?.phone || '').trim() || null;
  const avatar = String(req.body?.avatar || '').trim() || null;
  const isActive = req.body?.isActive === false ? 0 : 1;
  const permissions = req.body?.permissions && typeof req.body.permissions === 'object'
    ? req.body.permissions
    : parseJson(existing.permissions_json, {});

  if (
    (existing.role === 'super_admin' || role === 'super_admin') &&
    !(await requesterIsSuperAdmin(req))
  ) {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return;
  }

  try {
    if (password) {
      if (password.length < 10) {
        res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
        return;
      }
      const passwordHash = await hashPassword(password);
      await pool.execute(
        `UPDATE admin_users
         SET username = ?, password_hash = ?, full_name = ?, email = ?, phone = ?, avatar_url = ?,
             role = ?, permissions_json = ?, is_active = ?, session_version = session_version + 1, updated_at = NOW()
         WHERE id = ?`,
        [username, passwordHash, fullName, email, phone, avatar, role, JSON.stringify(permissions), isActive, id]
      );
    } else {
      await pool.execute(
        `UPDATE admin_users
         SET username = ?, full_name = ?, email = ?, phone = ?, avatar_url = ?,
             role = ?, permissions_json = ?, is_active = ?, session_version = session_version + 1, updated_at = NOW()
         WHERE id = ?`,
        [username, fullName, email, phone, avatar, role, JSON.stringify(permissions), isActive, id]
      );
    }
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'ADMIN_USERNAME_EXISTS' });
      return;
    }
    throw error;
  }

  const [rows] = await pool.query<AdminRow[]>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id]);
  res.json({ admin: adminDto(rows[0]) });
});

adminDataRouter.patch('/admins/:id/status', requireAdminPermission('canManageAdmins'), async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  if (id === req.auth?.sub) {
    res.status(409).json({ error: 'CANNOT_DISABLE_CURRENT_ADMIN' });
    return;
  }

  const [rows] = await pool.query<AdminRow[]>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id]);
  const target = rows[0];
  if (!target) {
    res.status(404).json({ error: 'ADMIN_NOT_FOUND' });
    return;
  }
  if (target.role === 'super_admin') {
    res.status(409).json({ error: 'SUPER_ADMIN_CANNOT_BE_DISABLED' });
    return;
  }

  const isActive = target.is_active ? 0 : 1;
  await pool.execute('UPDATE admin_users SET is_active = ?, session_version = session_version + 1, updated_at = NOW() WHERE id = ?', [isActive, id]);
  res.json({ id, isActive: Boolean(isActive) });
});

adminDataRouter.delete('/admins/:id', requireAdminPermission('canManageAdmins'), async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  if (id === req.auth?.sub) {
    res.status(409).json({ error: 'CANNOT_DELETE_CURRENT_ADMIN' });
    return;
  }

  const [rows] = await pool.query<AdminRow[]>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id]);
  const target = rows[0];
  if (!target) {
    res.status(404).json({ error: 'ADMIN_NOT_FOUND' });
    return;
  }
  if (target.role === 'super_admin') {
    res.status(409).json({ error: 'SUPER_ADMIN_CANNOT_BE_DELETED' });
    return;
  }

  await pool.execute(
    `UPDATE admin_users
     SET is_active = 0,
         session_version = session_version + 1,
         deleted_at = NOW(),
         updated_at = NOW()
     WHERE id = ?`,
    [id]
  );
  res.json({ ok: true, archived: true });
});
