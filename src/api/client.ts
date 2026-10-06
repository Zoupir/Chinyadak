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
    catalog?: unknown;
    categories?: unknown;
    vehicles?: unknown;
    cms?: unknown;
  };
};

let cachedServerRoute: ServerRoutePayload | null | undefined;
const consumedBootstrapKeys = new Set<string>();

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

const consumeBootstrap = <T>(key: string, value: unknown): T | undefined => {
  if (value === undefined || consumedBootstrapKeys.has(key)) return undefined;
  consumedBootstrapKeys.add(key);
  return value as T;
};

const bootstrapResponseFor = <T>(url: string, options: RequestInit): T | undefined => {
  if (!isGet(options)) return undefined;
  const payload = getServerRoutePayload();
  if (payload?.mode !== 'website' || !payload.bootstrap) return undefined;

  if (url === '/api/catalog/products?limit=48&offset=0') {
    return consumeBootstrap<T>('catalog', payload.bootstrap.catalog);
  }
  if (url === '/api/catalog/categories') {
    return consumeBootstrap<T>('categories', payload.bootstrap.categories);
  }
  if (url === '/api/vehicles') {
    return consumeBootstrap<T>('vehicles', payload.bootstrap.vehicles);
  }
  if (url === '/api/cms/bundle') {
    return consumeBootstrap<T>('cms', payload.bootstrap.cms);
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
        return consumeBootstrap<T>('entity-product', { product });
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
