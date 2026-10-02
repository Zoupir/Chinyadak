import { pool, type RowDataPacket } from './db';

interface SettingRow extends RowDataPacket {
  setting_value: unknown;
}

export interface CommerceSettings {
  freeShippingThreshold: number;
  expressShippingFee: number;
  postShippingFee: number;
  tipaxShippingFee: number;
  enableGuestCheckout: boolean;
}

const DEFAULTS: CommerceSettings = {
  freeShippingThreshold: 5_000_000,
  expressShippingFee: 120_000,
  postShippingFee: 85_000,
  tipaxShippingFee: 110_000,
  enableGuestCheckout: true
};

const toNonNegativeInt = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : fallback;
};

const parseJson = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const getCommerceSettings = async (): Promise<CommerceSettings> => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1"
  );
  const raw = parseJson(rows[0]?.setting_value);
  return {
    freeShippingThreshold: toNonNegativeInt(raw.freeShippingThreshold, DEFAULTS.freeShippingThreshold),
    expressShippingFee: toNonNegativeInt(raw.expressShippingFee, DEFAULTS.expressShippingFee),
    postShippingFee: toNonNegativeInt(raw.postShippingFee, DEFAULTS.postShippingFee),
    tipaxShippingFee: toNonNegativeInt(raw.tipaxShippingFee, DEFAULTS.tipaxShippingFee),
    enableGuestCheckout: raw.enableGuestCheckout === undefined
      ? DEFAULTS.enableGuestCheckout
      : Boolean(raw.enableGuestCheckout)
  };
};

export const resolveShipping = (
  id: string,
  subtotal: number,
  settings: CommerceSettings
) => {
  const normalized = id === 'express' || id === 'tipax' ? id : 'post';
  const baseCost =
    normalized === 'express'
      ? settings.expressShippingFee
      : normalized === 'tipax'
        ? settings.tipaxShippingFee
        : settings.postShippingFee;

  const free =
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold;

  if (normalized === 'express') {
    return {
      id: 'express',
      title: 'پیک موتوری ۲ ساعته',
      cost: free ? 0 : baseCost,
      baseCost,
      free,
      estimatedDelivery: '۲ ساعت کاری'
    };
  }
  if (normalized === 'tipax') {
    return {
      id: 'tipax',
      title: 'تیپاکس اکسپرس',
      cost: free ? 0 : baseCost,
      baseCost,
      free,
      estimatedDelivery: '۲۴ الی ۴۸ ساعت'
    };
  }
  return {
    id: 'post',
    title: 'پست پیشتاز بیمه‌شده',
    cost: free ? 0 : baseCost,
    baseCost,
    free,
    estimatedDelivery: '۲۴ الی ۴۸ ساعت'
  };
};
