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


export interface MediaLibraryItem {
  url: string;
  relativePath: string;
  filename: string;
  extension: string;
  category: string;
  year: string;
  month: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export const listMediaLibrary = async (options: { q?: string; category?: string; limit?: number; offset?: number } = {}): Promise<{ total: number; items: MediaLibraryItem[]; categories: string[] }> => {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.category) params.set('category', options.category);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));
  const response = await fetch('/api/media/library?' + params.toString(), { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new MediaUploadError(data.error || 'MEDIA_LIBRARY_FAILED', response.status);
  return data;
};

export const deleteMediaItem = async (relativePath: string): Promise<void> => {
  const response = await fetch('/api/media/library', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ relativePath })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new MediaUploadError(data.error || 'MEDIA_DELETE_FAILED', response.status);
};
