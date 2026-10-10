const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  Vazirmatn: 'Vazirmatn:wght@300;400;500;600;700;800;900',
  Alexandria: 'Alexandria:wght@300;400;500;600;700;800;900',
  Cairo: 'Cairo:wght@300;400;500;600;700;800;900',
  'Noto Sans Arabic': 'Noto+Sans+Arabic:wght@300;400;500;600;700;800;900',
  Rubik: 'Rubik:wght@300;400;500;600;700;800;900'
};

const addPreconnect = (href: string, crossOrigin = false) => {
  if (typeof document === 'undefined') return;
  const existing = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'))
    .some(link => link.href === href || link.getAttribute('href') === href);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  if (crossOrigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

/**
 * Loads only the active admin-selected webfont and does it without blocking the
 * first paint. Unknown/custom fonts intentionally fall back to the system stack.
 */
export const ensureSiteFontLoaded = (fontFamily: unknown): void => {
  if (typeof document === 'undefined') return;
  const family = String(fontFamily || 'Vazirmatn').trim();
  const googleFamily = GOOGLE_FONT_FAMILIES[family];
  if (!googleFamily) return;

  const id = `yadak-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return;

  addPreconnect('https://fonts.googleapis.com');
  addPreconnect('https://fonts.gstatic.com', true);

  const stylesheet = document.createElement('link');
  stylesheet.id = id;
  stylesheet.rel = 'stylesheet';
  stylesheet.href = `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
  stylesheet.media = 'print';
  stylesheet.onload = () => { stylesheet.media = 'all'; };
  document.head.appendChild(stylesheet);
};
