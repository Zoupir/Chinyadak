import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const key = (): Buffer => {
  const secret = String(process.env.APP_ENCRYPTION_KEY || '').trim();
  if (secret.length < 32) {
    throw new Error('APP_ENCRYPTION_KEY must be at least 32 characters.');
  }
  return createHash('sha256').update(secret, 'utf8').digest();
};

export const encryptSecret = (plaintext: string): string => {
  if (!plaintext) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
};

export const decryptSecret = (payload: string): string => {
  if (!payload) return '';
  const [version, ivText, tagText, ciphertextText] = payload.split('.');
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) {
    throw new Error('INVALID_ENCRYPTED_SECRET');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(ivText, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, 'base64url')),
    decipher.final()
  ]).toString('utf8');
};

export const maskSecret = (encryptedValue: string | undefined | null): string =>
  encryptedValue ? '••••••••' : '';
