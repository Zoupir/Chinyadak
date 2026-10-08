import { pool, type RowDataPacket } from './db';
import { ensurePaymentRuntimeConfig, getPaymentProviderStatus } from './payments';

export type CheckoutPaymentId = 'saman' | 'mellat' | 'cod';

export interface CheckoutShippingMethod {
  id: string;
  title: string;
  description?: string;
  cost: number;
  paymentMode: 'prepaid' | 'free' | 'collect';
  estimatedDelivery: string;
  enabled: true;
}

export interface CheckoutPaymentMethod {
  id: CheckoutPaymentId;
  title: string;
  available: boolean;
  configured: boolean;
  active: boolean;
}

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: any;
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

const defaultShipping = (settings: any): any[] => [
  {
    id: 'post',
    title: 'پست پیشتاز بیمه‌شده',
    description: 'ارسال سراسری با پست پیشتاز',
    cost: Number(settings?.postShippingFee || 85000),
    estimatedDelivery: '۲۴ الی ۴۸ ساعت',
    enabled: true,
    paymentMode: 'prepaid'
  },
  {
    id: 'tipax',
    title: 'تیپاکس اکسپرس',
    description: 'ارسال با تیپاکس',
    cost: Number(settings?.tipaxShippingFee || 110000),
    estimatedDelivery: '۲۴ الی ۴۸ ساعت',
    enabled: true,
    paymentMode: 'prepaid'
  },
  {
    id: 'express',
    title: 'پیک موتوری',
    description: 'ارسال فوری در محدوده تحت پوشش',
    cost: Number(settings?.expressShippingFee || 120000),
    estimatedDelivery: '۲ ساعت کاری',
    enabled: true,
    paymentMode: 'prepaid'
  }
];

const normalizeShipping = (settings: any): CheckoutShippingMethod[] => {
  const source = Array.isArray(settings?.shippingMethods) && settings.shippingMethods.length
    ? settings.shippingMethods
    : defaultShipping(settings);

  const seen = new Set<string>();
  const result: CheckoutShippingMethod[] = [];
  for (const raw of source) {
    const id = String(raw?.id || '').trim().slice(0, 120);
    if (!id || seen.has(id) || raw?.enabled === false) continue;
    const paymentMode: CheckoutShippingMethod['paymentMode'] =
      raw?.paymentMode === 'free' || raw?.paymentMode === 'collect' ? raw.paymentMode : 'prepaid';
    const configuredCost = Number(raw?.cost || 0);
    result.push({
      id,
      title: String(raw?.title || id).trim().slice(0, 190),
      description: String(raw?.description || '').trim().slice(0, 500) || undefined,
      cost: paymentMode === 'prepaid' && Number.isFinite(configuredCost)
        ? Math.max(0, Math.round(configuredCost))
        : 0,
      paymentMode,
      estimatedDelivery: String(raw?.estimatedDelivery || '').trim().slice(0, 190),
      enabled: true
    });
    seen.add(id);
  }
  return result;
};

const publicGatewayAllows = (rows: any[], provider: CheckoutPaymentId): boolean => {
  const gateway = rows.find(item => String(item?.provider || item?.id || '').toLowerCase() === provider);
  if (provider === 'cod') return Boolean(gateway && gateway.isActive === true);
  // Existing installations may have credentials configured securely without a public
  // display record. In that case runtime configuration remains authoritative.
  return gateway ? gateway.isActive !== false : true;
};

export const loadCheckoutConfiguration = async () => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('site_settings','payment_gateways')"
  );
  const settings = new Map(rows.map(row => [row.setting_key, parseJson<any>(row.setting_value, {})]));
  const siteSettings = settings.get('site_settings') || {};
  const publicGateways = Array.isArray(settings.get('payment_gateways')) ? settings.get('payment_gateways') : [];

  await ensurePaymentRuntimeConfig();
  const runtime = getPaymentProviderStatus();
  const samanActive = publicGatewayAllows(publicGateways, 'saman');
  const mellatActive = publicGatewayAllows(publicGateways, 'mellat');
  const codActive = publicGatewayAllows(publicGateways, 'cod');

  const paymentMethods: CheckoutPaymentMethod[] = [
    {
      id: 'saman',
      title: 'درگاه پرداخت الکترونیک سامان',
      configured: Boolean(runtime.saman),
      active: samanActive,
      available: Boolean(runtime.saman) && samanActive
    },
    {
      id: 'mellat',
      title: 'به‌پرداخت بانک ملت',
      configured: Boolean(runtime.mellat),
      active: mellatActive,
      available: Boolean(runtime.mellat) && mellatActive
    },
    {
      id: 'cod',
      title: 'پرداخت در محل',
      configured: codActive,
      active: codActive,
      available: codActive
    }
  ];

  return {
    siteSettings,
    shippingMethods: normalizeShipping(siteSettings),
    paymentMethods
  };
};

export const getPublicCheckoutOptions = async () => {
  const { shippingMethods, paymentMethods } = await loadCheckoutConfiguration();
  return { shippingMethods, paymentMethods };
};
