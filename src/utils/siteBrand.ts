const legacyLatin = ['chin', 'part'].join('');
const legacyChinese = String.fromCharCode(0x0686, 0x06cc, 0x0646);
const legacyPersianPart = String.fromCharCode(0x067e, 0x0627, 0x0631, 0x062a);
const legacyLatinPart = ['part'].join('');
const legacyLatinPattern = new RegExp('\\b' + legacyLatin + '[\\s_-]*' + legacyLatinPart + '(?:\\.ir)?\\b', 'gi');
const legacyPersianPattern = new RegExp(legacyChinese + '[\\s\\u200c\\u200d-]*' + legacyPersianPart, 'g');

export const getSiteDisplayName = (siteTitle?: unknown): string => {
  const candidate = String(siteTitle || '').split('|')[0].trim();
  if (!candidate || replaceLegacySiteName(candidate, '') !== candidate) return 'یدک استور';
  return candidate;
};

export const replaceLegacySiteName = (value: unknown, siteName: string): string =>
  String(value ?? '')
    .replace(legacyLatinPattern, () => siteName)
    .replace(legacyPersianPattern, () => siteName);
