import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { encryptSecret, maskSecret } from '../crypto';
import { pool, type RowDataPacket } from '../db';

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
