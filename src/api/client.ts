export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

type ServerRoutePayload = {
  mode?: string;
  path?: string;
  entity?: {
    type?: string;
    id?: string;
    slug?: string;
    data?: Record<string, any>;
  } | null;
};

let cachedServerRoute: ServerRoutePayload | null | undefined;
let catalogBootstrapConsumed = false;

const getServerRoutePayload = (): ServerRoutePayload | null => {
  if (cachedServerRoute !== undefined) return cachedServerRoute;
  if (typeof document === 'undefined') {
    cachedServerRoute = null;
    return null;
  }
  const node = document.getElementById('__YADAK_SERVER_ROUTE__');
  if (!node?.textContent) {
    cachedServerRoute = null;
    return null;
  }
  try {
    cachedServerRoute = JSON.parse(node.textContent) as ServerRoutePayload;
  } catch {
    cachedServerRoute = null;
  }
  return cachedServerRoute;
};

const isInitialCatalogRequest = (url: string, options: RequestInit): boolean =>
  !catalogBootstrapConsumed &&
  (!options.method || String(options.method).toUpperCase() === 'GET') &&
  url === '/api/catalog/products?limit=48&offset=0';

const resolveRouteAwareRequest = <T>(
  url: string,
  options: RequestInit
): { url: string; immediate?: T } => {
  if (!isInitialCatalogRequest(url, options) || typeof window === 'undefined') {
    return { url };
  }

  catalogBootstrapConsumed = true;
  const payload = getServerRoutePayload();
  if (payload?.mode === 'website' && payload.entity?.type === 'product' && payload.entity.data) {
    const product = {
      ...payload.entity.data,
      id: payload.entity.id || payload.entity.data.id,
      slug: payload.entity.slug || payload.entity.data.slug
    };
    return {
      url,
      immediate: {
        products: [product],
        total: 1,
        offset: 0,
        limit: 1,
        nextOffset: 1,
        hasMore: false
      } as T
    };
  }

  const categoryMatch = window.location.pathname.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) {
    let category = categoryMatch[1];
    try { category = decodeURIComponent(category); } catch {}
    const params = new URLSearchParams({
      limit: '48',
      offset: '0',
      category
    });
    return { url: `/api/catalog/products?${params.toString()}` };
  }

  return { url };
};

export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const resolved = resolveRouteAwareRequest<T>(url, options);
  if (resolved.immediate !== undefined) return resolved.immediate;

  const response = await fetch(resolved.url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'REQUEST_FAILED');
  }
  return data as T;
};
