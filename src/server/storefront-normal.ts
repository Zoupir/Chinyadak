import { renderPublicStorefront } from './public-storefront-react';

type AnyRecord = Record<string, any>;
type PublicPayload = {
  mode?: string;
  path?: string;
  entity?: AnyRecord | null;
  bootstrap?: {
    catalog?: AnyRecord;
    categories?: AnyRecord;
    vehicles?: AnyRecord;
    cms?: { settings?: AnyRecord | null; [key: string]: any };
  };
};

const ROOT_START = '<div id="root" data-server-rendered="1">';
const PAYLOAD_START = '<script id="__YADAK_SERVER_ROUTE__" type="application/json">';
const PRIVATE_PREFIXES = ['/admin','/account','/checkout','/tracking','/invoice','/compare','/part-request','/cart','/wishlist'];

export const isPrivateStorefrontPath = (pathname: string): boolean => {
  const clean = String(pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return PRIVATE_PREFIXES.some(prefix => clean === prefix || clean.startsWith(prefix + '/'));
};

const escapeAttr = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const safeColor = (value: unknown, fallback: string): string => {
  const raw = String(value ?? '').trim();
  return /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]+\)|hsl(a)?\([^)]+\)|[a-z]{3,20})$/i.test(raw) ? raw : fallback;
};

const safeFont = (value: unknown): string => String(value || 'Vazirmatn').replace(/["'<>;{}]/g, '').slice(0, 80) || 'Vazirmatn';

const toPersianDigits = (value: unknown): string => String(value ?? '').replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const parsePayload = (html: string): PublicPayload | null => {
  const start = html.indexOf(PAYLOAD_START);
  if (start < 0) return null;
  const contentStart = start + PAYLOAD_START.length;
  const end = html.indexOf('</script>', contentStart);
  if (end < 0) return null;
  try { return JSON.parse(html.slice(contentStart, end)) as PublicPayload; } catch { return null; }
};

const safePayloadJson = (value: unknown): string => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const replacePayloadScript = (html: string, payload: PublicPayload): string => {
  const start = html.indexOf(PAYLOAD_START);
  if (start < 0) return html;
  const contentStart = start + PAYLOAD_START.length;
  const end = html.indexOf('</script>', contentStart);
  if (end < 0) return html;
  return html.slice(0, contentStart) + safePayloadJson(payload) + html.slice(end);
};

const localizePublicDisplaySettings = (payload: PublicPayload): PublicPayload => {
  const bootstrap = payload.bootstrap || {};
  const cms = bootstrap.cms || {};
  const settings = cms.settings;
  if (!settings) return payload;

  const localizedSettings = { ...settings };
  for (const key of ['contactPhone', 'supportPhone', 'sellerPhone']) {
    if (typeof localizedSettings[key] === 'string' && localizedSettings[key].trim()) {
      localizedSettings[key] = toPersianDigits(localizedSettings[key]);
    }
  }

  return {
    ...payload,
    bootstrap: {
      ...bootstrap,
      cms: {
        ...cms,
        settings: localizedSettings
      }
    }
  };
};

const safeFaviconHref = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\/[^\s"'<>]+$/i.test(raw)) return raw;
  if (/^\/(?!\/)[^\s"'<>]+$/.test(raw)) return raw;
  if (/^[a-z0-9][a-z0-9/_-]*\.(?:ico|png|jpg|jpeg|webp|svg)(?:\?[^\s"'<>]*)?$/i.test(raw) && !raw.includes('..')) return '/' + raw;
  if (/^data:image\/(?:png|x-icon|vnd\.microsoft\.icon|svg\+xml);base64,[a-z0-9+/=]+$/i.test(raw)) return raw;
  return '';
};

const applyFaviconToHtml = (html: string, settings: AnyRecord): string => {
  const href = safeFaviconHref(settings.faviconUrl);
  if (!href) return html;
  const withoutOldIcons = html.replace(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*icon[^"']*["'])[^>]*>\s*/gi, '');
  const escaped = escapeAttr(href);
  const links = `<link rel="icon" href="${escaped}"><link rel="shortcut icon" href="${escaped}"><link rel="apple-touch-icon" href="${escaped}">`;
  return withoutOldIcons.replace('</head>', links + '</head>');
};

const applyThemeToHtml = (html: string, settings: AnyRecord): string => {
  const layout = String(settings.layoutPreset || 'classic').replace(/[^a-z0-9_-]/gi, '') || 'classic';
  const mobileProducts = Math.max(1, Math.min(4, Number(settings.mobileProductColumns || 2)));
  const mobileFooter = Math.max(1, Math.min(4, Number(settings.mobileFooterColumns || 2)));
  const baseFont = Math.max(12, Math.min(24, Number(settings.baseFontSizePx || 16)));
  const radius = Math.max(0, Math.min(60, Number(settings.themeRadiusPx || 12)));
  const font = safeFont(settings.fontFamily);
  const vars = [
    `--site-base-font-size:${baseFont}px`,
    `--theme-radius:${radius}px`,
    `--primary-color:${safeColor(settings.primaryColor, '#DC2626')}`,
    `--primary-hover:${safeColor(settings.primaryHover || settings.primaryColor, '#b91c1c')}`,
    `--site-bg:${safeColor(settings.siteBgColor, '#f8fafc')}`,
    `--card-bg:${safeColor(settings.cardBgColor, '#ffffff')}`,
    `--header-bg:${safeColor(settings.headerBgColor, '#ffffff')}`,
    `--footer-bg:${safeColor(settings.footerBgColor, '#111827')}`,
    `--text-color:${safeColor(settings.textColor, '#111827')}`,
    `--site-font:"${font}",system-ui,sans-serif`
  ].join(';');

  return html.replace(
    /<html lang="fa" dir="rtl"([^>]*)>/,
    `<html lang="fa" dir="rtl"$1 data-layout="${escapeAttr(layout)}" data-mobile-product-columns="${mobileProducts}" data-mobile-footer-columns="${mobileFooter}" style="${escapeAttr(vars)}">`
  );
};

export const normalizePublicStorefrontDocument = (html: string, pathname: string): string => {
  if (isPrivateStorefrontPath(pathname)) return html;
  const parsedPayload = parsePayload(html);
  if (!parsedPayload) return html;

  const rootStart = html.indexOf(ROOT_START);
  const payloadStart = html.indexOf(PAYLOAD_START);
  if (rootStart < 0 || payloadStart < 0 || payloadStart <= rootStart) return html;

  try {
    // Public display settings are localized before both SSR and hydration so the
    // server HTML and hydrated React tree remain identical with JS on or off.
    const payload = localizePublicDisplaySettings(parsedPayload);

    // Render the exact same Header/Home/Shop/Product/Footer React components
    // that historically produced the storefront. JavaScript is not needed to
    // create content or layout; it only hydrates this already-complete HTML.
    const markup = renderPublicStorefront(payload, payload.path || pathname || '/');
    const root = `<div id="root" data-server-rendered="1" data-server-authoritative="1" data-react-ssr="1" data-content-source="server">${markup}</div>`;
    let upgraded = `${html.slice(0, rootStart)}${root}${html.slice(payloadStart)}`;

    // The hydration payload must contain the same localized settings used by SSR.
    upgraded = replacePayloadScript(upgraded, payload);

    // The old semantic fallback stylesheet belongs only to the fallback DOM.
    upgraded = upgraded.replace(/<style id="yadak-server-shell-style">[\s\S]*?<\/style>/, '');
    const settings = payload.bootstrap?.cms?.settings || {};
    upgraded = applyThemeToHtml(upgraded, settings);
    upgraded = applyFaviconToHtml(upgraded, settings);

    if (!upgraded.includes('/assets/public-hydrate.js')) {
      upgraded = upgraded.replace('</body>', '<script type="module" src="/assets/public-hydrate.js"></script></body>');
    }
    return upgraded;
  } catch (error) {
    // Never turn an SSR problem into a storefront outage. The semantic HTML
    // produced by storefront-html remains the safe server-rendered fallback.
    console.error('Exact storefront SSR failed; using semantic fallback:', error);
    return html;
  }
};
