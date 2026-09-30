import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config';
import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';
import {
  finalizePaidInventory,
  releaseExpiredReservations,
  releaseOrderReservation,
  reserveOrderInventory
} from '../inventory';
import { ensurePaymentRuntimeConfig, getPaymentAdapter, getPaymentProviderStatus } from '../payments';

interface PaymentOrderRow extends RowDataPacket {
  id: string;
  order_number: string;
  payment_method: string | null;
  payment_status: string;
  total: number | string;
  customer_snapshot: any;
  reservation_expires_at: Date | null;
}

interface PaymentTransactionRow extends RowDataPacket {
  id: number;
  order_id: string;
  provider: string;
  gateway_order_id: number | string;
  amount_toman: number | string;
  amount_rial: number | string;
  authority: string | null;
  reference_id: string | null;
  status: string;
  order_number: string;
  payment_status: string;
  total: number | string;
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

const callbackPayload = (req: any): Record<string, unknown> => ({
  ...(req.query || {}),
  ...(req.body || {})
});

const appBase = () => config.appUrl.replace(/\/$/, '');

const paymentResultUrl = (orderNumber: string, status: 'success' | 'failed' | 'review') =>
  `${appBase()}/tracking/${encodeURIComponent(orderNumber)}?payment=${status}`;

const callbackUrl = (provider: string) =>
  `${appBase()}/api/payments/callback/${encodeURIComponent(provider)}`;

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'PAYMENT_RATE_LIMIT' }
});

export const paymentsRouter = Router();

paymentsRouter.get('/providers', async (_req, res) => {
  await ensurePaymentRuntimeConfig();
  const status = getPaymentProviderStatus();
  res.json({
    providers: [
      { id: 'saman', name: 'پرداخت الکترونیک سامان (SEP)', configured: status.saman },
      { id: 'mellat', name: 'به‌پرداخت ملت (BPM)', configured: status.mellat }
    ]
  });
});

paymentsRouter.post('/start', paymentLimiter, async (req, res) => {
  const orderId = String(req.body?.orderId || '').trim();
  const requestedProvider = String(req.body?.provider || '').trim().toLowerCase();
  if (!orderId) {
    res.status(400).json({ error: 'ORDER_ID_REQUIRED' });
    return;
  }

  try {
    await ensurePaymentRuntimeConfig();
    await releaseExpiredReservations();
  } catch (error) {
    console.error('Expired reservation cleanup failed:', error);
  }

  let prepared: {
    transactionId: number;
    gatewayOrderId: number;
    orderId: string;
    orderNumber: string;
    provider: string;
    amountToman: number;
    amountRial: number;
    mobile: string;
  };

  try {
    prepared = await withTransaction(async connection => {
      const [rows] = await connection.query<PaymentOrderRow[]>(
        `SELECT id, order_number, payment_method, payment_status, total,
                customer_snapshot, reservation_expires_at
         FROM orders
         WHERE id = ?
         FOR UPDATE`,
        [orderId]
      );
      const order = rows[0];
      if (!order) throw new Error('ORDER_NOT_FOUND');
      if (order.payment_status === 'paid' || order.payment_status === 'paid_stock_review') {
        throw new Error('ORDER_ALREADY_PAID');
      }

      const provider =
        requestedProvider === 'saman' || requestedProvider === 'mellat'
          ? requestedProvider
          : String(order.payment_method || '');
      getPaymentAdapter(provider);

      if (provider !== order.payment_method) {
        await connection.execute(
          'UPDATE orders SET payment_method = ?, updated_at = NOW() WHERE id = ?',
          [provider, order.id]
        );
      }

      await reserveOrderInventory(connection, order.id);

      const amountToman = Number(order.total);
      const amountRial = amountToman * 10;
      if (!Number.isSafeInteger(amountToman) || amountToman <= 0 || !Number.isSafeInteger(amountRial)) {
        throw new Error('PAYMENT_AMOUNT_INVALID');
      }

      const customer = parseJson<any>(order.customer_snapshot, {});
      const mobile = String(customer.phone || '').trim();

      const [insert] = await connection.execute<ResultSetHeader>(
        `INSERT INTO payment_transactions
         (order_id, provider, gateway_order_id, amount_toman, amount_rial, status)
         VALUES (?, ?, NULL, ?, ?, 'created')`,
        [order.id, provider, amountToman, amountRial]
      );

      const transactionId = Number(insert.insertId);
      const gatewayOrderId = transactionId;
      await connection.execute(
        'UPDATE payment_transactions SET gateway_order_id = ? WHERE id = ?',
        [gatewayOrderId, transactionId]
      );

      return {
        transactionId,
        gatewayOrderId,
        orderId: order.id,
        orderNumber: order.order_number,
        provider,
        amountToman,
        amountRial,
        mobile
      };
    });
  } catch (error: any) {
    const code = String(error?.message || 'PAYMENT_PREPARE_FAILED').split(':')[0];
    const status =
      code === 'ORDER_NOT_FOUND' ? 404 :
      code === 'ORDER_ALREADY_PAID' ? 409 :
      code === 'PAYMENT_ALREADY_IN_PROGRESS' ? 409 :
      code === 'INSUFFICIENT_STOCK' ? 409 :
      code === 'PAYMENT_PROVIDER_NOT_CONFIGURED' ? 503 :
      code === 'PAYMENT_PROVIDER_UNSUPPORTED' ? 400 : 400;

    res.status(status).json({
      error: code,
      productId: error?.productId,
      available: error?.available
    });
    return;
  }

  try {
    const adapter = getPaymentAdapter(prepared.provider);
    const result = await adapter.start({
      gatewayOrderId: prepared.gatewayOrderId,
      orderNumber: prepared.orderNumber,
      amountToman: prepared.amountToman,
      amountRial: prepared.amountRial,
      mobile: prepared.mobile,
      callbackUrl: callbackUrl(prepared.provider),
      description: `ChinPart order ${prepared.orderNumber}`
    });

    await pool.execute(
      `UPDATE payment_transactions
       SET authority = ?, status = 'redirected', provider_response_json = ?, updated_at = NOW()
       WHERE id = ?`,
      [result.authority, JSON.stringify(result.raw ?? null), prepared.transactionId]
    );
    await pool.execute(
      `UPDATE orders
       SET payment_authority = ?, payment_status = 'initiated', updated_at = NOW()
       WHERE id = ?`,
      [result.authority, prepared.orderId]
    );

    res.json({
      orderId: prepared.orderId,
      orderNumber: prepared.orderNumber,
      provider: prepared.provider,
      redirectUrl: result.redirectUrl,
      redirectMethod: result.redirectMethod,
      fields: result.fields || {}
    });
  } catch (error) {
    console.error('Payment gateway start failed:', error);
    await pool.execute(
      `UPDATE payment_transactions
       SET status = 'start_failed',
           provider_response_json = JSON_OBJECT('error', ?),
           updated_at = NOW()
       WHERE id = ?`,
      [String((error as Error)?.message || error), prepared.transactionId]
    ).catch(() => undefined);
    await releaseOrderReservation(prepared.orderId).catch(() => undefined);

    res.status(502).json({
      error: 'PAYMENT_GATEWAY_START_FAILED',
      provider: prepared.provider
    });
  }
});

const findTransactionForCallback = async (
  provider: string,
  callback: Record<string, unknown>
): Promise<PaymentTransactionRow | undefined> => {
  if (provider === 'mellat') {
    const gatewayOrderId = Number(callback.SaleOrderId ?? callback.saleOrderId ?? 0);
    if (!gatewayOrderId) return undefined;
    const [rows] = await pool.query<PaymentTransactionRow[]>(
      `SELECT pt.*, o.order_number, o.payment_status, o.total
       FROM payment_transactions pt
       JOIN orders o ON o.id = pt.order_id
       WHERE pt.provider = 'mellat' AND pt.gateway_order_id = ?
       ORDER BY pt.id DESC
       LIMIT 1`,
      [gatewayOrderId]
    );
    return rows[0];
  }

  if (provider === 'saman') {
    const resNum = String(callback.ResNum ?? callback.resNum ?? '').trim();
    if (!resNum) return undefined;
    const [rows] = await pool.query<PaymentTransactionRow[]>(
      `SELECT pt.*, o.order_number, o.payment_status, o.total
       FROM payment_transactions pt
       JOIN orders o ON o.id = pt.order_id
       WHERE pt.provider = 'saman' AND o.order_number = ?
       ORDER BY pt.id DESC
       LIMIT 1`,
      [resNum]
    );
    return rows[0];
  }

  return undefined;
};

const handleCallback = async (req: any, res: any) => {
  const provider = String(req.params.provider || '').trim().toLowerCase();
  const callback = callbackPayload(req);

  const transaction = await findTransactionForCallback(provider, callback);
  if (!transaction) {
    res.redirect(`${appBase()}/tracking?payment=failed`);
    return;
  }

  if (
    transaction.status === 'verified' ||
    transaction.payment_status === 'paid' ||
    transaction.payment_status === 'paid_stock_review'
  ) {
    res.redirect(
      paymentResultUrl(
        transaction.order_number,
        transaction.payment_status === 'paid_stock_review' ? 'review' : 'success'
      )
    );
    return;
  }

  await pool.execute(
    `UPDATE payment_transactions
     SET callback_json = ?, status = 'callback', updated_at = NOW()
     WHERE id = ?`,
    [JSON.stringify(callback), transaction.id]
  );

  let verifyResult;
  try {
    await ensurePaymentRuntimeConfig();
    const adapter = getPaymentAdapter(provider);
    verifyResult = await adapter.verify({
      gatewayOrderId: Number(transaction.gateway_order_id),
      orderNumber: transaction.order_number,
      amountToman: Number(transaction.amount_toman),
      amountRial: Number(transaction.amount_rial),
      authority: transaction.authority,
      callback
    });
  } catch (error) {
    console.error('Payment verify communication error:', error);
    await pool.execute(
      `UPDATE payment_transactions
       SET status = 'verify_error',
           provider_response_json = JSON_OBJECT('error', ?),
           updated_at = NOW()
       WHERE id = ?`,
      [String((error as Error)?.message || error), transaction.id]
    ).catch(() => undefined);

    res.redirect(paymentResultUrl(transaction.order_number, 'failed'));
    return;
  }

  if (!verifyResult.success) {
    await pool.execute(
      `UPDATE payment_transactions
       SET status = 'failed',
           reference_id = COALESCE(?, reference_id),
           provider_response_json = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        verifyResult.referenceId || null,
        JSON.stringify(verifyResult.raw ?? {
          errorCode: verifyResult.errorCode,
          errorMessage: verifyResult.errorMessage
        }),
        transaction.id
      ]
    );
    await releaseOrderReservation(transaction.order_id).catch(error =>
      console.error('Reservation release after payment failure failed:', error)
    );
    await pool.execute(
      `UPDATE orders
       SET status = 'payment_failed',
           payment_status = 'failed',
           updated_at = NOW()
       WHERE id = ? AND payment_status NOT IN ('paid', 'paid_stock_review')`,
      [transaction.order_id]
    );

    res.redirect(paymentResultUrl(transaction.order_number, 'failed'));
    return;
  }

  let stockConflict = false;
  await withTransaction(async connection => {
    const [lockedTransactions] = await connection.query<PaymentTransactionRow[]>(
      `SELECT pt.*, o.order_number, o.payment_status, o.total
       FROM payment_transactions pt
       JOIN orders o ON o.id = pt.order_id
       WHERE pt.id = ?
       FOR UPDATE`,
      [transaction.id]
    );
    const locked = lockedTransactions[0];
    if (!locked) throw new Error('PAYMENT_TRANSACTION_NOT_FOUND');

    if (locked.status === 'verified' || locked.payment_status === 'paid') {
      return;
    }

    const finalized = await finalizePaidInventory(connection, locked.order_id);
    stockConflict = finalized.stockConflict;

    await connection.execute(
      `UPDATE payment_transactions
       SET status = 'verified',
           reference_id = ?,
           provider_response_json = ?,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        verifyResult.referenceId || null,
        JSON.stringify(verifyResult.raw ?? null),
        locked.id
      ]
    );

    await connection.execute(
      `UPDATE orders
       SET status = ?,
           payment_status = ?,
           payment_reference = ?,
           paid_at = NOW(),
           reservation_expires_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [
        stockConflict ? 'processing' : 'paid',
        stockConflict ? 'paid_stock_review' : 'paid',
        verifyResult.referenceId || null,
        locked.order_id
      ]
    );

    await connection.execute(
      `INSERT INTO audit_log
       (actor_type, actor_id, action_name, entity_type, entity_id, metadata_json)
       VALUES ('system', NULL, 'payment_verified', 'order', ?, ?)`,
      [
        locked.order_id,
        JSON.stringify({
          provider,
          transactionId: locked.id,
          referenceId: verifyResult.referenceId || null,
          stockConflict
        })
      ]
    );
  });

  res.redirect(
    paymentResultUrl(transaction.order_number, stockConflict ? 'review' : 'success')
  );
};

paymentsRouter.all('/callback/:provider', (req, res, next) => {
  void handleCallback(req, res).catch(next);
});
