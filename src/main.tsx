import './index.css';
import './home-layout-overrides.css';
import './responsive-header-fixes.css';
import './rich-text-storefront.css';

declare global {
  interface Window {
    __YADAK_WEBSITE_MODE__?: boolean;
    __YADAK_SUPPORT_DIAGNOSTICS_INSTALLED__?: boolean;
  }
}

const installAdminSupportDiagnostics = () => {
  if (!window.location.pathname.startsWith('/admin')) return;
  if (window.__YADAK_SUPPORT_DIAGNOSTICS_INSTALLED__) return;
  window.__YADAK_SUPPORT_DIAGNOSTICS_INSTALLED__ = true;

  const originalFetch = window.fetch.bind(window);

  const safePath = (value: unknown): string => {
    try {
      return new URL(String(value || ''), window.location.origin).pathname.slice(0, 500);
    } catch {
      return String(value || '').split('?')[0].slice(0, 500);
    }
  };

  const report = (payload: Record<string, unknown>) => {
    void originalFetch('/api/support/client-event', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => undefined);
  };

  window.addEventListener('error', event => {
    report({
      kind: 'client_error',
      path: window.location.pathname,
      message: event.message || 'Browser error'
    });
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason instanceof Error
      ? event.reason.message
      : String(event.reason || 'Unhandled promise rejection');
    report({
      kind: 'client_rejection',
      path: window.location.pathname,
      message: reason
    });
  });

  window.fetch = (async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const rawUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const path = safePath(rawUrl);
    const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const shouldTrack = path.startsWith('/api/')
      && !path.startsWith('/api/support/')
      && !path.startsWith('/api/auth/');
    const startedAt = performance.now();

    try {
      const response = await originalFetch(...args);
      if (shouldTrack && !response.ok) {
        report({
          kind: 'client_fetch_error',
          method,
          path,
          status: response.status,
          durationMs: performance.now() - startedAt,
          message: response.statusText || `HTTP ${response.status}`
        });
      }
      return response;
    } catch (error) {
      if (shouldTrack) {
        report({
          kind: 'client_fetch_exception',
          method,
          path,
          durationMs: performance.now() - startedAt,
          message: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }) as typeof window.fetch;
};

const clearLegacyAppCaches = () => {
  if (!window.__YADAK_WEBSITE_MODE__) return;

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(registrations => Promise.allSettled(registrations.map(registration => registration.unregister())))
      .catch(() => undefined);
  }

  if ('caches' in window) {
    void caches
      .keys()
      .then(keys => Promise.allSettled(
        keys
          .filter(key => /yadak|chinpart|vite|workbox|pwa/i.test(key))
          .map(key => caches.delete(key))
      ))
      .catch(() => undefined);
  }
};

const enhanceServerStorefront = (root: HTMLElement) => {
  document.documentElement.dataset.contentRendering = 'server';
  root.dataset.jsRole = 'progressive-enhancement-only';

  root.querySelectorAll<HTMLElement>('[data-yadak-slider]').forEach(slider => {
    const slides = Array.from(slider.querySelectorAll<HTMLElement>('[data-slide]'));
    const dots = Array.from(slider.querySelectorAll<HTMLButtonElement>('[data-slider-dot]'));
    if (slides.length <= 1) return;

    let current = Math.max(0, slides.findIndex(slide => !slide.hidden));
    if (current < 0) current = 0;

    const show = (index: number) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== current; });
      dots.forEach((dot, dotIndex) => {
        if (dotIndex === current) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    slider.querySelector<HTMLButtonElement>('[data-slider-prev]')?.addEventListener('click', () => show(current - 1));
    slider.querySelector<HTMLButtonElement>('[data-slider-next]')?.addEventListener('click', () => show(current + 1));
    dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.sliderDot || 0))));
    show(current);
  });
};

installAdminSupportDiagnostics();
clearLegacyAppCaches();

const root = document.getElementById('root');
if (!root) throw new Error('ROOT_NOT_FOUND');

if (root.dataset.reactSsr === '1') {
  // Exact public React markup is already complete server-side. The dedicated
  // public-hydrate bundle hydrates the same DOM without replacing it.
  document.documentElement.dataset.contentRendering = 'server';
  root.dataset.jsRole = 'awaiting-hydration';
} else if (root.dataset.serverAuthoritative === '1' || root.dataset.serverRendered === '1') {
  // Safe semantic fallback: JavaScript may enhance interaction but must never
  // replace or re-render public content.
  enhanceServerStorefront(root);
} else {
  // Private/application routes keep the React application.
  void Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./App.tsx')
  ]).then(([ReactModule, ReactDomModule, AppModule]) => {
    const { StrictMode, createElement } = ReactModule;
    const { createRoot } = ReactDomModule;
    createRoot(root).render(
      createElement(StrictMode, null, createElement(AppModule.default))
    );
  });
}
