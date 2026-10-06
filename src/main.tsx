import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './home-layout-overrides.css';
import './responsive-header-fixes.css';
import './rich-text-storefront.css';

declare global {
  interface Window {
    __YADAK_WEBSITE_MODE__?: boolean;
  }
}

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
  document.documentElement.dataset.contentRendering = 'server-first';
  root.dataset.jsRole = 'server-first-progressive-enhancement';

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

clearLegacyAppCaches();

const serverRoot = document.getElementById('root');
if (!serverRoot) throw new Error('ROOT_NOT_FOUND');

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (serverRoot.dataset.serverAuthoritative === '1' || serverRoot.dataset.serverRendered === '1') {
  // The server HTML remains the real first response and stays visible while the
  // existing storefront initializes. Once the client storefront is fully ready,
  // swap it in so the public visual design remains exactly the same as before.
  // Crawlers and no-JS clients still receive meaningful server-rendered content.
  enhanceServerStorefront(serverRoot);

  const clientRoot = document.createElement('div');
  clientRoot.id = 'yadak-client-root';
  clientRoot.hidden = true;
  serverRoot.after(clientRoot);

  createRoot(clientRoot).render(app);

  let swapped = false;
  const revealClient = () => {
    if (swapped) return;
    if (clientRoot.childElementCount === 0) return;
    if (clientRoot.querySelector('[aria-label="در حال بارگذاری فروشگاه"]')) return;

    swapped = true;
    const previousTop = window.scrollY;
    clientRoot.hidden = false;
    serverRoot.replaceWith(clientRoot);
    clientRoot.id = 'root';
    document.documentElement.dataset.contentRendering = 'server-first-enhanced';
    window.scrollTo({ top: previousTop, behavior: 'auto' });
    observer.disconnect();
  };

  const observer = new MutationObserver(revealClient);
  observer.observe(clientRoot, { subtree: true, childList: true });
  queueMicrotask(revealClient);
  window.setTimeout(revealClient, 100);
  window.setTimeout(revealClient, 1000);
  window.setTimeout(revealClient, 3000);
} else {
  createRoot(serverRoot).render(app);
}
