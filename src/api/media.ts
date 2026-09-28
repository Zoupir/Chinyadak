export class MediaUploadError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export const uploadImage = async (
  file: File,
  category = 'general'
): Promise<{ url: string; mime: string; size: number; originalName: string }> => {
  const form = new FormData();
  form.append('image', file);
  form.append('category', category);

  const response = await fetch('/api/media/image', {
    method: 'POST',
    credentials: 'include',
    body: form
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new MediaUploadError(data.error || 'MEDIA_UPLOAD_FAILED', response.status);
  }

  return data;
};
