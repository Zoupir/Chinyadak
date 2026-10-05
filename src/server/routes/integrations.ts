import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { encryptSecret, maskSecret, decryptSecret } from '../crypto';
import { replacePaymentRuntimeConfig, ensurePaymentRuntimeConfig, getRuntimePaymentGateway, type RuntimePaymentGateway } from '../payments/runtime-config';
import { pool, type RowDataPacket } from '../db';
import { config } from '../config';
import { sepAdapter } from '../payments/sep';
import { mellatAdapter } from '../payments/mellat';

interface SettingRow extends RowDataPacket {
  setting_value: any;
}

type StoredIntegrations = {
  smsProvider: 'kavenegar' | 'melipayamak' | 'ghasedak';
  smsApiKeyEncrypted: string;
  smsSenderNumber: string;
  smsNotifyOnOrder: boolean;
  smsNotifyOnStock: boolean;
  smsTrackingPattern: string;
  accountingSoftware: 'none' | 'sepidar' | 'heloo' | 'taraznegar';
  accountingApiKeyEncrypted: string;
  accountingAutoSyncStock: boolean;
  webhookUrl: string;
  webhookSecretEncrypted: string;
};

const MASK = '••••••••';

const defaults = (): StoredIntegrations => ({
  smsProvider: 'kavenegar',
  smsApiKeyEncrypted: '',
  smsSenderNumber: '',
  smsNotifyOnOrder: true,
  smsNotifyOnStock: true,
  smsTrackingPattern: '',
  accountingSoftware: 'none',
  accountingApiKeyEncrypted: '',
  accountingAutoSyncStock: false,
  webhookUrl: '',
  webhookSecretEncrypted: ''
});

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const readStored = async (): Promise<StoredIntegrations> => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'api_integrations_secure' LIMIT 1"
  );
  if (!rows[0]) return defaults();
  return {
    ...defaults(),
    ...parseJson<Partial<StoredIntegrations>>(rows[0].setting_value, {})
  };
};

const toClient = (stored: StoredIntegrations) => ({
  smsProvider: stored.smsProvider,
  smsApiKey: maskSecret(stored.smsApiKeyEncrypted),
  smsSenderNumber: stored.smsSenderNumber,
  smsNotifyOnOrder: stored.smsNotifyOnOrder,
  smsNotifyOnStock: stored.smsNotifyOnStock,
  smsTrackingPattern: stored.smsTrackingPattern,
  accountingSoftware: stored.accountingSoftware,
  accountingApiKey: maskSecret(stored.accountingApiKeyEncrypted),
  accountingAutoSyncStock: stored.accountingAutoSyncStock,
  webhookUrl: stored.webhookUrl,
  webhookSecret: maskSecret(stored.webhookSecretEncrypted)
});

const secretUpdate = (incoming: unknown, currentEncrypted: string): string => {
  const value = String(incoming ?? '').trim();
  if (!value || value === MASK || /^•+$/.test(value)) return currentEncrypted;
  return encryptSecret(value);
};

export const integrationsRouter = Router();

integrationsRouter.get(
  '/',
  requireAdminPermission('canManageSettings'),
  async (_req, res) => {
    const stored = await readStored();
    res.json({ integrations: toClient(stored) });
  }
);

integrationsRouter.put(
  '/',
  requireAdminPermission('canManageSettings'),
  async (req, res) => {
    const current = await readStored();

    const smsProvider = String(req.body?.smsProvider || current.smsProvider);
    const accountingSoftware = String(req.body?.accountingSoftware || current.accountingSoftware);
    if (!['kavenegar', 'melipayamak', 'ghasedak'].includes(smsProvider)) {
      res.status(400).json({ error: 'SMS_PROVIDER_INVALID' });
      return;
    }
    if (!['none', 'sepidar', 'heloo', 'taraznegar'].includes(accountingSoftware)) {
      res.status(400).json({ error: 'ACCOUNTING_PROVIDER_INVALID' });
      return;
    }

    const webhookUrl = String(req.body?.webhookUrl ?? current.webhookUrl).trim();
    if (webhookUrl) {
      try {
        const parsed = new URL(webhookUrl);
        if (
          parsed.protocol !== 'https:' &&
          !(process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:')
        ) {
          throw new Error('HTTPS_REQUIRED');
        }
      } catch {
        res.status(400).json({ error: 'WEBHOOK_URL_INVALID' });
        return;
      }
    }

    let stored: StoredIntegrations;
    try {
      stored = {
        smsProvider: smsProvider as StoredIntegrations['smsProvider'],
        smsApiKeyEncrypted: secretUpdate(req.body?.smsApiKey, current.smsApiKeyEncrypted),
        smsSenderNumber: String(req.body?.smsSenderNumber ?? current.smsSenderNumber).trim().slice(0, 50),
        smsNotifyOnOrder: Boolean(req.body?.smsNotifyOnOrder),
        smsNotifyOnStock: Boolean(req.body?.smsNotifyOnStock),
        smsTrackingPattern: String(req.body?.smsTrackingPattern ?? current.smsTrackingPattern).trim().slice(0, 190),
        accountingSoftware: accountingSoftware as StoredIntegrations['accountingSoftware'],
        accountingApiKeyEncrypted: secretUpdate(req.body?.accountingApiKey, current.accountingApiKeyEncrypted),
        accountingAutoSyncStock: Boolean(req.body?.accountingAutoSyncStock),
        webhookUrl,
        webhookSecretEncrypted: secretUpdate(req.body?.webhookSecret, current.webhookSecretEncrypted)
      };
    } catch (error) {
      if (String((error as Error)?.message || '').includes('APP_ENCRYPTION_KEY')) {
        res.status(503).json({ error: 'ENCRYPTION_KEY_NOT_CONFIGURED' });
        return;
      }
      throw error;
    }

    await pool.execute(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES ('api_integrations_secure', ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         updated_at = NOW()`,
      [JSON.stringify(stored)]
    );

    res.json({ integrations: toClient(stored) });
  }
);


type StoredPaymentGateway = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  isSandbox: boolean;
  description: string;
  merchantIdEncrypted: string;
  terminalIdEncrypted: string;
  usernameEncrypted: string;
  passwordEncrypted: string;
  apiKeyEncrypted: string;
  merchantKeyEncrypted: string;
  terminalKeyEncrypted: string;
  endpoint: string;
  paymentUrl: string;
  callbackUrl: string;
  additionalConfig: Record<string, string>;
};

const paymentSecret = (incoming: unknown, currentEncrypted = ''): string => {
  const value = String(incoming ?? '').trim();
  if (!value || value === MASK || /^•+$/.test(value)) return currentEncrypted;
  return encryptSecret(value);
};

const paymentToClient = (gateway: StoredPaymentGateway) => ({
  id: gateway.id,
  name: gateway.name,
  provider: gateway.provider,
  isActive: gateway.isActive,
  isSandbox: gateway.isSandbox,
  description: gateway.description,
  merchantId: maskSecret(gateway.merchantIdEncrypted),
  terminalId: maskSecret(gateway.terminalIdEncrypted),
  username: maskSecret(gateway.usernameEncrypted),
  password: maskSecret(gateway.passwordEncrypted),
  apiKey: maskSecret(gateway.apiKeyEncrypted),
  merchantKey: maskSecret(gateway.merchantKeyEncrypted),
  terminalKey: maskSecret(gateway.terminalKeyEncrypted),
  endpoint: gateway.endpoint,
  paymentUrl: gateway.paymentUrl,
  callbackUrl: gateway.callbackUrl,
  additionalConfig: gateway.additionalConfig || {}
});

const paymentToRuntime = (gateway: StoredPaymentGateway): RuntimePaymentGateway => {
  const decode = (payload: string) => {
    if (!payload) return '';
    try { return decryptSecret(payload); } catch { return ''; }
  };
  return {
    id: gateway.id,
    name: gateway.name,
    provider: gateway.provider,
    isActive: gateway.isActive,
    isSandbox: gateway.isSandbox,
    description: gateway.description,
    merchantId: decode(gateway.merchantIdEncrypted),
    terminalId: decode(gateway.terminalIdEncrypted),
    username: decode(gateway.usernameEncrypted),
    password: decode(gateway.passwordEncrypted),
    apiKey: decode(gateway.apiKeyEncrypted),
    merchantKey: decode(gateway.merchantKeyEncrypted),
    terminalKey: decode(gateway.terminalKeyEncrypted),
    endpoint: gateway.endpoint,
    paymentUrl: gateway.paymentUrl,
    callbackUrl: gateway.callbackUrl,
    additionalConfig: gateway.additionalConfig || {}
  };
};

const readPaymentGateways = async (): Promise<StoredPaymentGateway[]> => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'payment_gateways_secure' LIMIT 1"
  );
  if (rows[0]) {
    return parseJson<StoredPaymentGateway[]>(rows[0].setting_value, []);
  }

  const [legacyRows] = await pool.query<SettingRow[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'payment_gateways' LIMIT 1"
  );
  const legacy = legacyRows[0] ? parseJson<any[]>(legacyRows[0].setting_value, []) : [];
  return legacy.map(item => ({
    id: String(item.id || item.provider || ''),
    name: String(item.name || ''),
    provider: String(item.provider || item.id || ''),
    isActive: item.isActive !== false,
    isSandbox: Boolean(item.isSandbox),
    description: String(item.description || ''),
    merchantIdEncrypted: '',
    terminalIdEncrypted: '',
    usernameEncrypted: '',
    passwordEncrypted: '',
    apiKeyEncrypted: '',
    merchantKeyEncrypted: '',
    terminalKeyEncrypted: '',
    endpoint: String(item.endpoint || ''),
    paymentUrl: String(item.paymentUrl || ''),
    callbackUrl: String(item.callbackUrl || ''),
    additionalConfig: typeof item.additionalConfig === 'object' && item.additionalConfig ? item.additionalConfig : {}
  }));
};

integrationsRouter.get(
  '/payment-gateways',
  requireAdminPermission('canManageSettings'),
  async (_req, res) => {
    const gateways = await readPaymentGateways();
    res.json({ gateways: gateways.map(paymentToClient) });
  }
);

integrationsRouter.put(
  '/payment-gateways',
  requireAdminPermission('canManageSettings'),
  async (req, res) => {
    const incoming = Array.isArray(req.body?.gateways) ? req.body.gateways : [];
    if (!incoming.length || incoming.length > 30) {
      res.status(400).json({ error: 'PAYMENT_GATEWAYS_INVALID' });
      return;
    }

    const current = await readPaymentGateways();
    const byId = new Map(current.map(item => [item.id, item]));

    let stored: StoredPaymentGateway[];
    try {
      stored = incoming.map((item: any) => {
        const id = String(item.id || item.provider || '').trim().slice(0, 80);
        const provider = String(item.provider || id).trim().toLowerCase().slice(0, 50);
        if (!id || !provider) throw new Error('PAYMENT_GATEWAY_ID_INVALID');
        const previous = byId.get(id);
        const additionalConfig = typeof item.additionalConfig === 'object' && item.additionalConfig
          ? Object.fromEntries(
              Object.entries(item.additionalConfig)
                .slice(0, 30)
                .map(([key, value]) => [String(key).slice(0, 80), String(value ?? '').slice(0, 1000)])
            )
          : (previous?.additionalConfig || {});

        return {
          id,
          name: String(item.name || previous?.name || id).trim().slice(0, 160),
          provider,
          isActive: item.isActive !== false,
          isSandbox: Boolean(item.isSandbox),
          description: String(item.description ?? previous?.description ?? '').trim().slice(0, 2000),
          merchantIdEncrypted: paymentSecret(item.merchantId, previous?.merchantIdEncrypted),
          terminalIdEncrypted: paymentSecret(item.terminalId, previous?.terminalIdEncrypted),
          usernameEncrypted: paymentSecret(item.username, previous?.usernameEncrypted),
          passwordEncrypted: paymentSecret(item.password, previous?.passwordEncrypted),
          apiKeyEncrypted: paymentSecret(item.apiKey, previous?.apiKeyEncrypted),
          merchantKeyEncrypted: paymentSecret(item.merchantKey, previous?.merchantKeyEncrypted),
          terminalKeyEncrypted: paymentSecret(item.terminalKey, previous?.terminalKeyEncrypted),
          endpoint: String(item.endpoint ?? previous?.endpoint ?? '').trim().slice(0, 1500),
          paymentUrl: String(item.paymentUrl ?? previous?.paymentUrl ?? '').trim().slice(0, 1500),
          callbackUrl: String(item.callbackUrl ?? previous?.callbackUrl ?? '').trim().slice(0, 1500),
          additionalConfig
        };
      });
    } catch (error) {
      const message = String((error as Error)?.message || '');
      if (message.includes('APP_ENCRYPTION_KEY')) {
        res.status(503).json({ error: 'ENCRYPTION_KEY_NOT_CONFIGURED' });
        return;
      }
      res.status(400).json({ error: message || 'PAYMENT_GATEWAYS_INVALID' });
      return;
    }

    await pool.execute(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES ('payment_gateways_secure', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [JSON.stringify(stored)]
    );

    // Public bundle intentionally receives only non-secret presentation fields.
    const publicGateways = stored.map(item => ({
      id: item.id,
      name: item.name,
      provider: item.provider,
      isActive: item.isActive,
      isSandbox: item.isSandbox,
      description: item.description,
      merchantId: '',
      terminalId: ''
    }));
    await pool.execute(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES ('payment_gateways', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [JSON.stringify(publicGateways)]
    );

    replacePaymentRuntimeConfig(stored.map(paymentToRuntime));
    res.json({ gateways: stored.map(paymentToClient) });
  }
);

 
integrationsRouter.post(
  '/payment-gateways/test',
  requireAdminPermission('canManageSettings'),
  async (req, res) => {
    const provider = String(req.body?.provider || '').trim().toLowerCase();
    if (provider !== 'saman' && provider !== 'mellat') {
      res.status(400).json({ error: 'PAYMENT_PROVIDER_UNSUPPORTED' });
      return;
    }

    await ensurePaymentRuntimeConfig();
    const gateway = getRuntimePaymentGateway(provider);
    if (gateway?.isSandbox && (!gateway.endpoint || !gateway.paymentUrl)) {
      res.status(400).json({ error: 'PAYMENT_SANDBOX_ENDPOINT_REQUIRED' });
      return;
    }
    const configured = provider === 'saman'
      ? Boolean(gateway?.terminalId)
      : Boolean(gateway?.terminalId && gateway?.username && gateway?.password);
    if (!configured) {
      res.status(400).json({ error: 'PAYMENT_PROVIDER_NOT_CONFIGURED' });
      return;
    }

    try {
      const adapter = provider === 'saman' ? sepAdapter : mellatAdapter;
      const testId = Math.floor(Date.now() / 1000);
      await adapter.start({
        gatewayOrderId: testId,
        orderNumber: 'CONNECTION-TEST-' + Date.now(),
        amountToman: 10000,
        amountRial: 100000,
        mobile: '',
        callbackUrl: gateway?.callbackUrl || config.appUrl.replace(/\/$/, '') + '/api/payments/callback/' + provider,
        description: 'Connection test. No customer order.'
      });

      res.json({
        ok: true,
        message: 'درگاه درخواست آزمایشی را پذیرفت. نشست پرداخت ساخته شد، اما مشتری به بانک منتقل نشد و سفارشی ثبت نشد.'
      });
    } catch (error) {
      console.error('Payment gateway connection test failed:', provider, String((error as Error)?.message || 'unknown error'));
      res.status(502).json({ error: 'PAYMENT_GATEWAY_TEST_FAILED' });
    }
  }
);
