export type RichMediaKind = 'audio' | 'video';

export interface RichMediaUploadResult {
  url: string;
  kind: RichMediaKind;
  mime: string;
  size: number;
  originalName: string;
  relativePath: string;
}

export class RichMediaUploadError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export const uploadRichMedia = async (
  file: File,
  kind: RichMediaKind,
  category = 'editor-media'
): Promise<RichMediaUploadResult> => {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  form.append('category', category);

  const response = await fetch('/api/rich-media/upload', {
    method: 'POST',
    credentials: 'include',
    body: form
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new RichMediaUploadError(payload.error || 'RICH_MEDIA_UPLOAD_FAILED', response.status);
  return payload as RichMediaUploadResult;
};
