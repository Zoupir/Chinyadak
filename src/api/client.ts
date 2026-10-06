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
  bootstrap?: {
    catalog?: any;
    categories?: any;
    vehicles?: any;
    cms?: any;
  };
};

let cachedServerRoute: ServerRoutePayload | null | undefined;

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

const isGet = (options: RequestInit): boolean =>
  !options.method || String(options.method).toUpperCase() === 'GET';

const cloneBootstrap = <T>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const bootstrapResponseFor = <T>(url: string, options: RequestInit): T | undefined => {
  if (!isGet(options)) return undefined;
  const payload = getServerRoutePayload();
  if (payload?.mode !== 'website' || !payload.bootstrap) return undefined;

  if (url === '/api/catalog/products?limit=48&offset=0' && payload.bootstrap.catalog) {
    return cloneBootstrap(payload.bootstrap.catalog) as T;
  }
  if (url === '/api/catalog/categories' && payload.bootstrap.categories) {
    return cloneBootstrap(payload.bootstrap.categories) as T;
  }
  if (url === '/api/vehicles' && payload.bootstrap.vehicles) {
    return cloneBootstrap(payload.bootstrap.vehicles) as T;
  }
  if (url === '/api/cms/bundle' && payload.bootstrap.cms) {
    return cloneBootstrap(payload.bootstrap.cms) as T;
  }

  if (payload.bootstrap.catalog && url.startsWith('/api/catalog/products?')) {
    try {
      const parsed = new URL(url, window.location.origin);
      const offset = Number(parsed.searchParams.get('offset') || 0);
      const category = parsed.searchParams.get('category') || '';
      const query = parsed.searchParams.get('q') || '';
      const entityCategory = payload.entity?.type === 'category' ? String(payload.entity.slug || '') : '';
      const isSameFirstPage = offset === 0 && !query && (
        (!category && (payload.path === '/' || payload.path === '/shop' || payload.path?.startsWith('/shop/'))) ||
        (category && entityCategory && category === entityCategory)
      );
      if (isSameFirstPage) return cloneBootstrap(payload.bootstrap.catalog) as T;
    } catch {
      // Fall through to the real API.
    }
  }

  if (payload.entity?.type === 'product' && payload.entity.data) {
    const prefix = '/api/catalog/products/';
    if (url.startsWith(prefix)) {
      const requested = decodeURIComponent(url.slice(prefix.length).split('?')[0] || '');
      if (requested === payload.entity.id || requested === payload.entity.slug) {
        const product = {
          ...payload.entity.data,
          id: payload.entity.id || payload.entity.data.id,
          slug: payload.entity.slug || payload.entity.data.slug
        };
        return { product } as T;
      }
    }
  }

  return undefined;
};

export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const bootstrapped = bootstrapResponseFor<T>(url, options);
  if (bootstrapped !== undefined) return bootstrapped;

  const response = await fetch(url, {
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
