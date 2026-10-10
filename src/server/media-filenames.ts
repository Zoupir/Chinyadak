import path from 'node:path';

const mojibakeMarkers = /[ÃÂØÙ]/u;
const persianArabicLetters = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;
const dangerousDirectionMarks = /[\u202A-\u202E\u2066-\u2069]/u;

const markerCount = (value: string): number => (value.match(/[ÃÂØÙ]/gu) || []).length;

/** Repair browser UTF-8 multipart names that Busboy exposed as ISO-8859-1. */
export const decodeMultipartFilename = (value: unknown): string => {
  const raw = String(value ?? '');
  if (!raw) return '';
  const isLatin1ByteString = Array.from(raw).every(character => (character.codePointAt(0) ?? 0) <= 0xff);

  if (isLatin1ByteString && mojibakeMarkers.test(raw)) {
    try {
      const repaired = Buffer.from(raw, 'latin1').toString('utf8');
      if (
        repaired &&
        !repaired.includes('\uFFFD') &&
        persianArabicLetters.test(repaired) &&
        markerCount(repaired) < markerCount(raw)
      ) {
        return repaired.normalize('NFC');
      }
    } catch {
      // Preserve the received value; filename validation below will reject unsafe content.
    }
  }

  return raw.normalize('NFC');
};

export const normalizeUploadedImageFilename = (
  originalName: unknown,
  detectedExtension: 'jpg' | 'png' | 'webp' | 'gif'
): string | null => {
  const filename = decodeMultipartFilename(originalName).trim();
  if (!filename || filename.length > 240) return null;
  if (/[\u0000-\u001f\u007f]/u.test(filename) || dangerousDirectionMarks.test(filename)) return null;
  if (filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') return null;

  const extension = path.extname(filename).slice(1).toLowerCase();
  const acceptedExtensions = detectedExtension === 'jpg' ? ['jpg', 'jpeg'] : [detectedExtension];
  return acceptedExtensions.includes(extension) ? filename : null;
};

/** Encode each URL path segment while leaving the separators intact. */
export const encodeUploadPath = (relativePath: string): string =>
  String(relativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

export const publicUploadUrl = (relativePath: string): string =>
  '/uploads/' + encodeUploadPath(String(relativePath || '').replace(/^\/+/, ''));
