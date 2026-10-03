import { pool, type RowDataPacket } from '../db';
import { decryptSecret } from '../crypto';

interface SettingRow extends RowDataPacket {
  setting_value: any;
}

export interface RuntimePaymentGateway {
  id: string;
  provider: string;
  name?: string;
  isActive: boolean;
  isSandbox?: boolean;
  description?: string;
  merchantId?: string;
  terminalId?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  merchantKey?: string;
  terminalKey?: string;
  endpoint?: string;
  paymentUrl?: string;
  callbackUrl?: string;
  additionalConfig?: Record<string, string>;
}

type StoredGateway = Omit<
  RuntimePaymentGateway,
  'merchantId' | 'terminalId' | 'username' | 'password' | 'apiKey' | 'merchantKey' | 'terminalKey'
> & {
  merchantIdEncrypted?: string;
  terminalIdEncrypted?: string;
  usernameEncrypted?: string;
  passwordEncrypted?: string;
  apiKeyEncrypted?: string;
  merchantKeyEncrypted?: string;
  terminalKeyEncrypted?: string;
};

let cache: RuntimePaymentGateway[] | null = null;
let loading: Promise<RuntimePaymentGateway[]> | null = null;

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const decryptOptional = (value?: string): string => {
  if (!value) return '';
  try {
    return decryptSecret(value);
  } catch (error) {
    console.error('Payment secret decrypt failed:', error);
    return '';
  }
};

const fromStored = (gateway: StoredGateway): RuntimePaymentGateway => ({
  id: String(gateway.id || gateway.provider || ''),
  provider: String(gateway.provider || ''),
  name: gateway.name,
  isActive: gateway.isActive !== false,
  isSandbox: Boolean(gateway.isSandbox),
  description: gateway.description,
  merchantId: decryptOptional(gateway.merchantIdEncrypted),
  terminalId: decryptOptional(gateway.terminalIdEncrypted),
  username: decryptOptional(gateway.usernameEncrypted),
  password: decryptOptional(gateway.passwordEncrypted),
  apiKey: decryptOptional(gateway.apiKeyEncrypted),
  merchantKey: decryptOptional(gateway.merchantKeyEncrypted),
  terminalKey: decryptOptional(gateway.terminalKeyEncrypted),
  endpoint: String(gateway.endpoint || ''),
  paymentUrl: String(gateway.paymentUrl || ''),
  callbackUrl: String(gateway.callbackUrl || ''),
  additionalConfig: gateway.additionalConfig || {}
});

export const refreshPaymentRuntimeConfig = async (): Promise<RuntimePaymentGateway[]> => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'payment_gateways_secure' LIMIT 1"
  );
  const stored = rows[0]
    ? parseJson<StoredGateway[]>(rows[0].setting_value, [])
    : [];
  cache = stored.map(fromStored);
  return cache;
};

export const ensurePaymentRuntimeConfig = async (): Promise<RuntimePaymentGateway[]> => {
  if (cache) return cache;
  if (!loading) {
    loading = refreshPaymentRuntimeConfig().finally(() => {
      loading = null;
    });
  }
  return loading;
};

export const replacePaymentRuntimeConfig = (gateways: RuntimePaymentGateway[]) => {
  cache = gateways;
};

const envFallback = (provider: string): RuntimePaymentGateway | undefined => {
  if (provider === 'saman') {
    return {
      id: 'saman',
      provider: 'saman',
      name: 'پرداخت الکترونیک سامان (SEP)',
      isActive: true,
      terminalId: String(process.env.SEP_TERMINAL_ID || '').trim(),
      endpoint: String(process.env.SEP_TOKEN_URL || '').trim(),
      paymentUrl: String(process.env.SEP_PAYMENT_URL || '').trim(),
      additionalConfig: {
        verifyUrl: String(process.env.SEP_VERIFY_URL || '').trim(),
        reverseUrl: String(process.env.SEP_REVERSE_URL || '').trim()
      }
    };
  }
  if (provider === 'mellat') {
    return {
      id: 'mellat',
      provider: 'mellat',
      name: 'به‌پرداخت ملت (BPM)',
      isActive: true,
      terminalId: String(process.env.MELLAT_TERMINAL_ID || '').trim(),
      username: String(process.env.MELLAT_USERNAME || '').trim(),
      password: String(process.env.MELLAT_PASSWORD || '').trim(),
      endpoint: String(process.env.MELLAT_WSDL_URL || '').trim(),
      paymentUrl: String(process.env.MELLAT_PAYMENT_URL || '').trim()
    };
  }
  return undefined;
};

export const getRuntimePaymentGateway = (provider: string): RuntimePaymentGateway | undefined => {
  const saved = cache?.find(item => item.provider === provider || item.id === provider);
  if (saved) return saved;
  return envFallback(provider);
};

export const paymentRuntimeConfigured = (provider: string): boolean => {
  const cfg = getRuntimePaymentGateway(provider);
  if (!cfg || cfg.isActive === false) return false;
  if (provider === 'saman') return Boolean(cfg.terminalId);
  if (provider === 'mellat') return Boolean(cfg.terminalId && cfg.username && cfg.password);
  return false;
};
