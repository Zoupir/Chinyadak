const latinDigits = (value: string) => value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
export const toPersianDigits = (value: string | number) => String(value ?? '').replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
export const toTelHref = (value: string | number) => {
  const normalized = latinDigits(String(value ?? '')).trim();
  const hasPlus = normalized.startsWith('+');
  const digits = normalized.replace(/\D/g, '');
  return digits ? `tel:${hasPlus ? '+' : ''}${digits}` : 'tel:';
}
