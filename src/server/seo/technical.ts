import { config } from '../config';

const INTERNAL_SKIP_PREFIXES = ['/api/', '/uploads/', '/assets/'];

const ALIASES = new Map<string, string>([
  ['/home', '/'],
  ['/index', '/'],
  ['/index.html', '/'],
  ['/page/home', '/'],
  ['/page/about', '/about'],
  ['/page/guarantee', '/guarantee'],
  ['/page/part-request', '/part-request']
]);

export const STATIC_INDEXABLE_PATHS = new Set([
  '/',
  '/shop',
  '/shop/oem',
  '/shop/discounted',
  '/blog'
]);

export const STATIC_SITEMAP_PATHS = ['/', '/shop', '/blog'] as const;

const cleanPathname = (value: unknown): string => {
  let raw = String(value || '/').trim();
  try {
    raw = new URL(raw, config.appUrl).pathname || '/';
  } catch {
    raw = raw.split('?')[0].split('#')[0] || '/';
  }
  if (!raw.startsWith('/')) raw = '/' + raw;
  raw = raw.replace(/\/{2,}/g, '/');
  if (raw.length > 1) raw = raw.replace(/\/+$/, '');
  return raw || '/';
};

/**
 * Returns the single public pathname that should represent a route in search.
 * API/assets are intentionally left alone because this helper is also used by
 * middleware that runs before the API router.
 */
export const canonicalPublicSeoPath = (value: unknown): string => {
  const path = cleanPathname(value);
  if (INTERNAL_SKIP_PREFIXES.some(prefix => path.startsWith(prefix))) return path;
  return ALIASES.get(path) || path;
};

export const shouldRedirectToCanonicalSeoPath = (value: unknown): string | null => {
  const original = cleanPathname(value);
  if (INTERNAL_SKIP_PREFIXES.some(prefix => original.startsWith(prefix))) return null;
  const canonical = canonicalPublicSeoPath(original);
  return canonical !== original ? canonical : null;
};

const siteOrigin = (): string => {
  try { return new URL(config.appUrl).origin; }
  catch { return ''; }
};

export const canonicalizeAbsoluteSeoUrl = (value: unknown, fallbackPath = '/'): string => {
  const raw = String(value ?? '').trim();
  const fallback = canonicalPublicSeoPath(fallbackPath);
  const base = config.appUrl.replace(/\/$/, '');
  if (!raw) return base + (fallback === '/' ? '' : fallback);
  try {
    const parsed = new URL(raw, config.appUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return base + (fallback === '/' ? '' : fallback);
    }
    if (parsed.origin === siteOrigin()) {
      const path = canonicalPublicSeoPath(parsed.pathname);
      return base + (path === '/' ? '' : path);
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return base + (fallback === '/' ? '' : fallback);
  }
};

export const isIndexableStaticSeoPath = (value: unknown): boolean =>
  STATIC_INDEXABLE_PATHS.has(canonicalPublicSeoPath(value));

export type HreflangEntry = { lang: string; url: string };

export const normalizeHreflangEntries = (
  input: unknown,
  canonical: string,
  enabled = true
): HreflangEntry[] => {
  if (!enabled || !Array.isArray(input)) return [];
  const output: HreflangEntry[] = [];
  const seen = new Set<string>();
  for (const row of input) {
    const rawLang = String((row as any)?.lang || '').trim();
    const normalizedLang = rawLang.toLowerCase() === 'x-default'
      ? 'x-default'
      : rawLang.replace(/_/g, '-');
    if (!/^x-default$|^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(normalizedLang)) continue;
    const key = normalizedLang.toLowerCase();
    if (seen.has(key)) continue;
    const rawUrl = String((row as any)?.url || '').trim();
    if (!rawUrl) continue;
    let url = '';
    try {
      const parsed = new URL(rawUrl, config.appUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) continue;
      url = parsed.origin === siteOrigin()
        ? canonicalizeAbsoluteSeoUrl(parsed.toString(), canonical)
        : parsed.toString();
    } catch {
      continue;
    }
    seen.add(key);
    output.push({ lang: normalizedLang, url });
    if (output.length >= 30) break;
  }
  return output;
};
