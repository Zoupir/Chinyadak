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

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

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

clearLegacyAppCaches();

const serverRoot = document.getElementById('root');
if (!serverRoot) throw new Error('ROOT_NOT_FOUND');

if (serverRoot.dataset.serverRendered === '1') {
  // Keep the server-rendered storefront visible while React initializes.
  // The React tree is mounted off-screen and swaps in only after persisted
  // store data has been restored. This prevents the SPA loading skeleton from
  // replacing real HTML and preserves a classic website first paint.
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
