import { randomUUID } from 'crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  authenticate,
  clearSession,
  hashPassword,
  issueSession,
  requireAdmin,
  type AuthenticatedRequest,
  verifyPassword
} from '../auth';
import { pool, type ResultSetHeader, type RowDataPacket } from '../db';

interface CustomerRow extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  password_hash: string;
  password_initialized: number;
  customer_type: 'retail' | 'mechanic' | 'wholesale';
  status: 'active' | 'blocked';
  vehicle: string | null;
  address: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  created_at: Date;
}

interface AdminRow extends RowDataPacket {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  permissions_json: string | object | null;
  is_active: number;
  created_at: Date;
}

const normalizePhone = (input: unknown): string => {
  let value = String(input ?? '').replace(/\D/g, '');
  if (value.startsWith('0098')) value = '0' + value.slice(4);
  else if (value.startsWith('98')) value = '0' + value.slice(2);
  return value;
};

const customerDto = (row: CustomerRow) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  type: row.customer_type,
  typeTitle:
    row.customer_type === 'wholesale'
      ? 'همکار / عمده‌فروش'
      : row.customer_type === 'mechanic'
        ? 'تعمیرکار / مکانیک'
        : 'مشتری عادی',
  status: row.status,
  registeredAt: row.created_at,
  totalOrders: 0,
  totalSpent: 0,
  vehicle: row.vehicle || '',
  address: row.address || '',
  loyaltyPoints: row.loyalty_points,
  loyaltyTier: row.loyalty_tier
});

const parsePermissions = (value: AdminRow['permissions_json']) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const adminDto = (row: AdminRow) => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  roleTitle: row.role === 'super_admin' ? 'مدیر کل' : 'مدیر',
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  permissions: parsePermissions(row.permissions_json)
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_LOGIN_ATTEMPTS' }
});

export const authRouter = Router();

authRouter.post('/customer/register', loginLimiter, async (req, res) => {
  const firstName = String(req.body?.firstName ?? '').trim();
  const lastName = String(req.body?.lastName ?? '').trim();
  const phone = normalizePhone(req.body?.phone);
  const password = String(req.body?.password ?? '');
  const type = String(req.body?.type ?? 'retail') as CustomerRow['customer_type'];
  const vehicle = String(req.body?.vehicle ?? '').trim();

  if (!firstName || !lastName || !/^09\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'INVALID_CUSTOMER_DATA' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
    return;
  }
  if (!['retail', 'mechanic', 'wholesale'].includes(type)) {
    res.status(400).json({ error: 'INVALID_CUSTOMER_TYPE' });
    return;
  }

  const [existing] = await pool.query<CustomerRow[]>(
    'SELECT * FROM customers WHERE phone = ? LIMIT 1',
    [phone]
  );

  const passwordHash = await hashPassword(password);
  let id: string;

  if (existing.length) {
    const current = existing[0];
    if (current.password_initialized) {
      res.status(409).json({ error: 'PHONE_ALREADY_REGISTERED' });
      return;
    }
    if (current.status !== 'active') {
      res.status(403).json({ error: 'ACCOUNT_BLOCKED' });
      return;
    }

    id = current.id;
    await pool.execute<ResultSetHeader>(
      `UPDATE customers
       SET first_name = ?, last_name = ?, password_hash = ?, password_initialized = 1,
           customer_type = ?, vehicle = COALESCE(NULLIF(?, ''), vehicle), updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, passwordHash, type, vehicle, id]
    );
  } else {
    id = randomUUID();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO customers
        (id, first_name, last_name, phone, password_hash, password_initialized, customer_type, vehicle)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, firstName, lastName, phone, passwordHash, type, vehicle || null]
    );
  }

  const [rows] = await pool.query<CustomerRow[]>(
    'SELECT * FROM customers WHERE id = ? LIMIT 1',
    [id]
  );
  const customer = rows[0];
  issueSession(res, { sub: customer.id, role: 'customer', phone: customer.phone });
  res.status(201).json({ customer: customerDto(customer) });
});

authRouter.post('/customer/login', loginLimiter, async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const password = String(req.body?.password ?? '');

  if (!/^09\d{9}$/.test(phone) || !password) {
    res.status(400).json({ error: 'INVALID_LOGIN_DATA' });
    return;
  }

  const [rows] = await pool.query<CustomerRow[]>(
    'SELECT * FROM customers WHERE phone = ? LIMIT 1',
    [phone]
  );
  const customer = rows[0];
  if (!customer || !customer.password_initialized || !(await verifyPassword(password, customer.password_hash))) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    return;
  }
  if (customer.status !== 'active') {
    res.status(403).json({ error: 'ACCOUNT_BLOCKED' });
    return;
  }

  await pool.execute('UPDATE customers SET last_login_at = NOW() WHERE id = ?', [customer.id]);
  issueSession(res, { sub: customer.id, role: 'customer', phone: customer.phone });
  res.json({ customer: customerDto(customer) });
});

authRouter.get('/customer/loyalty', authenticate, async (req: AuthenticatedRequest, res) => {
  if (req.auth?.role !== 'customer') {
    res.status(403).json({ error: 'CUSTOMER_REQUIRED' });
    return;
  }

  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string;
    customer_id: string;
    points: number;
    transaction_type: string;
    data_json: any;
  }>>(
    `SELECT id, customer_id, points, transaction_type, data_json
     FROM loyalty_transactions
     WHERE customer_id = ?
     ORDER BY created_at DESC
     LIMIT 1000`,
    [req.auth.sub]
  );

  const transactions = rows.map(row => {
    let data: any = {};
    try {
      data = typeof row.data_json === 'object' ? row.data_json : JSON.parse(String(row.data_json || '{}'));
    } catch {
      data = {};
    }
    return {
      ...data,
      id: row.id,
      customerId: row.customer_id,
      points: Number(row.points),
      type: row.transaction_type
    };
  });

  res.json({ transactions });
});

authRouter.post('/admin/login', loginLimiter, async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!username || !password) {
    res.status(400).json({ error: 'INVALID_LOGIN_DATA' });
    return;
  }

  const [rows] = await pool.query<AdminRow[]>(
    'SELECT * FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  );
  const admin = rows[0];
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    return;
  }
  if (!admin.is_active) {
    res.status(403).json({ error: 'ACCOUNT_BLOCKED' });
    return;
  }

  await pool.execute('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [admin.id]);
  issueSession(res, { sub: admin.id, role: 'admin', username: admin.username });
  res.json({ admin: adminDto(admin) });
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  if (req.auth?.role === 'customer') {
    const [rows] = await pool.query<CustomerRow[]>(
      'SELECT * FROM customers WHERE id = ? LIMIT 1',
      [req.auth.sub]
    );
    if (!rows[0] || rows[0].status !== 'active') {
      clearSession(res);
      res.status(401).json({ error: 'SESSION_USER_NOT_FOUND' });
      return;
    }
    res.json({ role: 'customer', customer: customerDto(rows[0]) });
    return;
  }

  const [rows] = await pool.query<AdminRow[]>(
    'SELECT * FROM admin_users WHERE id = ? LIMIT 1',
    [req.auth?.sub]
  );
  if (!rows[0] || !rows[0].is_active) {
    clearSession(res);
    res.status(401).json({ error: 'SESSION_USER_NOT_FOUND' });
    return;
  }
  res.json({ role: 'admin', admin: adminDto(rows[0]) });
});

authRouter.post('/admin/change-password', requireAdmin, async (req: AuthenticatedRequest, res) => {
  const currentPassword = String(req.body?.currentPassword ?? '');
  const newPassword = String(req.body?.newPassword ?? '');

  if (newPassword.length < 10) {
    res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
    return;
  }

  const [rows] = await pool.query<AdminRow[]>(
    'SELECT * FROM admin_users WHERE id = ? LIMIT 1',
    [req.auth?.sub]
  );
  const admin = rows[0];
  if (!admin || !(await verifyPassword(currentPassword, admin.password_hash))) {
    res.status(401).json({ error: 'INVALID_CURRENT_PASSWORD' });
    return;
  }

  const hash = await hashPassword(newPassword);
  await pool.execute(
    'UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [hash, admin.id]
  );
  res.json({ ok: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});
