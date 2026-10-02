import { createHash, randomUUID } from 'crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate, requireAdminPermission, type AuthenticatedRequest } from '../auth';
import { pool, type RowDataPacket } from '../db';

interface JsonRow extends RowDataPacket {
  id: string;
  status: string;
  data_json: any;
  created_at: Date;
}

interface StockAlertRow extends RowDataPacket {
  product_id: string;
  phone: string;
  created_at: Date;
}

interface SearchRow extends RowDataPacket {
  query_text: string;
  search_count: number | string;
  last_results_count: number | string;
  last_searched_at: Date;
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

const normalizePhone = (input: unknown): string => {
  let value = String(input ?? '').replace(/\D/g, '');
  if (value.startsWith('0098')) value = '0' + value.slice(4);
  else if (value.startsWith('98')) value = '0' + value.slice(2);
  return value;
};

const normalizeSearch = (input: unknown): string =>
  String(input ?? '')
    .normalize('NFKC')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim();

const toFaDate = (date: Date): string =>
  new Intl.DateTimeFormat('fa-IR').format(new Date(date));

const partRequestDto = (row: JsonRow) => ({
  ...parseJson<any>(row.data_json, {}),
  id: row.id,
  status: row.status,
  createdAt: toFaDate(row.created_at)
});

const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'REQUEST_RATE_LIMIT' }
});

const stockAlertLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'STOCK_ALERT_RATE_LIMIT' }
});

const searchLogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'SEARCH_LOG_RATE_LIMIT' }
});

export const engagementRouter = Router();

engagementRouter.post('/part-requests', publicSubmitLimiter, async (req, res) => {
  const phoneNumber = normalizePhone(req.body?.phoneNumber);
  const fullName = String(req.body?.fullName || '').trim().slice(0, 160);
  const partName = String(req.body?.partName || '').trim().slice(0, 255);
  const carBrand = String(req.body?.carBrand || '').trim().slice(0, 160);
  const carModel = String(req.body?.carModel || '').trim().slice(0, 160);
  const year = String(req.body?.year || '').trim().slice(0, 20);
  const oemNumber = String(req.body?.oemNumber || '').trim().slice(0, 100);
  const vin = String(req.body?.vin || '').trim().slice(0, 80);
  const notes = String(req.body?.notes || '').trim().slice(0, 2000);
  const imageAttached = Boolean(req.body?.imageAttached);

  if (!/^09\d{9}$/.test(phoneNumber) || !fullName || !partName || !carBrand || !carModel) {
    res.status(400).json({ error: 'PART_REQUEST_INVALID' });
    return;
  }

  const id = randomUUID();
  const data = {
    id,
    carBrand,
    carModel,
    year,
    partName,
    oemNumber: oemNumber || undefined,
    vin: vin || undefined,
    phoneNumber,
    fullName,
    notes,
    imageAttached,
    status: 'در حال بررسی'
  };

  await pool.execute(
    `INSERT INTO part_requests (id, status, data_json)
     VALUES (?, 'در حال بررسی', ?)`,
    [id, JSON.stringify(data)]
  );

  const [rows] = await pool.query<JsonRow[]>(
    'SELECT id, status, data_json, created_at FROM part_requests WHERE id = ? LIMIT 1',
    [id]
  );

  res.status(201).json({ request: partRequestDto(rows[0]) });
});

engagementRouter.get('/part-requests/mine', authenticate, async (req: AuthenticatedRequest, res) => {
  if (req.auth?.role !== 'customer' || !req.auth.phone) {
    res.status(403).json({ error: 'CUSTOMER_REQUIRED' });
    return;
  }

  const [rows] = await pool.query<JsonRow[]>(
    `SELECT id, status, data_json, created_at
     FROM part_requests
     WHERE JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.phoneNumber')) = ?
     ORDER BY created_at DESC
     LIMIT 500`,
    [req.auth.phone]
  );

  res.json({ requests: rows.map(partRequestDto) });
});

engagementRouter.get('/admin', requireAdminPermission('canManageOrders'), async (_req, res) => {
  const [[partRows], [stockRows], [searchRows]] = await Promise.all([
    pool.query<JsonRow[]>(
      'SELECT id, status, data_json, created_at FROM part_requests ORDER BY created_at DESC LIMIT 5000'
    ),
    pool.query<StockAlertRow[]>(
      'SELECT product_id, phone, created_at FROM stock_alerts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5000'
    ),
    pool.query<SearchRow[]>(
      'SELECT query_text, search_count, last_results_count, last_searched_at FROM search_queries ORDER BY search_count DESC, last_searched_at DESC LIMIT 1000'
    )
  ]);

  res.json({
    partRequests: partRows.map(partRequestDto),
    stockAlerts: stockRows.map(row => ({
      productId: row.product_id,
      phone: row.phone,
      date: toFaDate(row.created_at)
    })),
    searchLogs: searchRows.map(row => ({
      query: row.query_text,
      count: Number(row.search_count || 0),
      lastDate: toFaDate(row.last_searched_at),
      resultsCount: Number(row.last_results_count || 0)
    }))
  });
});

engagementRouter.patch(
  '/part-requests/:id/status',
  requireAdminPermission('canManageOrders'),
  async (req, res) => {
    const status = String(req.body?.status || '');
    const allowed = ['در حال بررسی', 'پاسخ داده شد', 'ناموجود در گمرک'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'PART_REQUEST_STATUS_INVALID' });
      return;
    }

    const [rows] = await pool.query<JsonRow[]>(
      'SELECT id, status, data_json, created_at FROM part_requests WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    const current = rows[0];
    if (!current) {
      res.status(404).json({ error: 'PART_REQUEST_NOT_FOUND' });
      return;
    }

    const data = {
      ...parseJson<any>(current.data_json, {}),
      status
    };
    await pool.execute(
      'UPDATE part_requests SET status = ?, data_json = ?, updated_at = NOW() WHERE id = ?',
      [status, JSON.stringify(data), req.params.id]
    );

    res.json({
      request: {
        ...partRequestDto(current),
        ...data,
        status
      }
    });
  }
);

engagementRouter.post('/stock-alerts', stockAlertLimiter, async (req, res) => {
  const productId = String(req.body?.productId || '').trim();
  const phone = normalizePhone(req.body?.phone);

  if (!productId || !/^09\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'STOCK_ALERT_INVALID' });
    return;
  }

  const [products] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM products WHERE id = ? AND status = 'active' LIMIT 1",
    [productId]
  );
  if (!products[0]) {
    res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    return;
  }

  await pool.execute(
    `INSERT INTO stock_alerts (product_id, phone, is_active)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE is_active = 1, notified_at = NULL`,
    [productId, phone]
  );

  res.status(201).json({
    alert: {
      productId,
      phone,
      date: toFaDate(new Date())
    }
  });
});

engagementRouter.post('/search-log', searchLogLimiter, async (req, res) => {
  const query = normalizeSearch(req.body?.query);
  const resultsCount = Math.max(0, Math.min(100000, Math.trunc(Number(req.body?.resultsCount || 0))));

  if (query.length < 2 || query.length > 255) {
    res.status(400).json({ error: 'SEARCH_QUERY_INVALID' });
    return;
  }

  const queryKey = createHash('sha256').update(query.toLocaleLowerCase('fa-IR')).digest('hex');
  await pool.execute(
    `INSERT INTO search_queries
      (query_key, query_text, search_count, last_results_count, last_searched_at)
     VALUES (?, ?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE
       query_text = VALUES(query_text),
       search_count = search_count + 1,
       last_results_count = VALUES(last_results_count),
       last_searched_at = NOW()`,
    [queryKey, query, resultsCount]
  );

  const [rows] = await pool.query<SearchRow[]>(
    `SELECT query_text, search_count, last_results_count, last_searched_at
     FROM search_queries WHERE query_key = ? LIMIT 1`,
    [queryKey]
  );

  const row = rows[0];
  res.json({
    log: {
      query: row.query_text,
      count: Number(row.search_count || 0),
      lastDate: 'اکنون',
      resultsCount: Number(row.last_results_count || 0)
    }
  });
});
