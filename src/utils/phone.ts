export const toLatinDigits = (value: string | number): string => String(value ?? '')
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

export const toPersianDigits = (value: string | number) => String(value ?? '')
  .replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

/**
 * Normalize Iranian mobile numbers entered with Persian/Arabic/Latin digits.
 * Accepted examples: 09121234567, ۰۹۱۲۱۲۳۴۵۶۷, +989121234567, 00989121234567.
 */
export const normalizeIranMobile = (value: string | number): string => {
  let normalized = toLatinDigits(value).trim().replace(/[\s\-().]/g, '');
  if (normalized.startsWith('+')) normalized = normalized.slice(1);
  normalized = normalized.replace(/\D/g, '');
  if (normalized.startsWith('0098')) normalized = normalized.slice(2);
  if (normalized.startsWith('98') && normalized.length === 12) normalized = `0${normalized.slice(2)}`;
  if (normalized.startsWith('9') && normalized.length === 10) normalized = `0${normalized}`;
  return normalized;
};

export const isValidIranMobile = (value: string | number): boolean =>
  /^09\d{9}$/.test(normalizeIranMobile(value));

export const toTelHref = (value: string | number) => {
  const normalized = toLatinDigits(value).trim();
  const hasPlus = normalized.startsWith('+');
  const digits = normalized.replace(/\D/g, '');
  return digits ? `tel:${hasPlus ? '+' : ''}${digits}` : 'tel:';
};
