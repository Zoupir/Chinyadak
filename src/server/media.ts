import path from 'path';

export const uploadDirectory = (): string => {
  const configured = String(process.env.UPLOAD_DIR || 'uploads').trim();
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
};

export const maxUploadBytes = (): number => {
  const mb = Number(process.env.MAX_UPLOAD_MB || 8);
  const safeMb = Number.isFinite(mb) ? Math.max(1, Math.min(25, mb)) : 8;
  return Math.floor(safeMb * 1024 * 1024);
};
