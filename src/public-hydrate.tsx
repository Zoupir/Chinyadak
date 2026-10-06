import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PublicStorefront } from './server/public-storefront-react';

const root = document.getElementById('root');
const payloadNode = document.getElementById('__YADAK_SERVER_ROUTE__');

if (root && payloadNode) {
  try {
    const payload = JSON.parse(payloadNode.textContent || '{}');
    hydrateRoot(
      root,
      <PublicStorefront payload={payload} pathname={payload.path || window.location.pathname} />,
      {
        onRecoverableError(error) {
          console.warn('Public storefront hydration recovered:', error);
        }
      }
    );
    document.documentElement.dataset.contentRendering = 'server-hydrated';
    root.dataset.jsRole = 'hydration-only';
  } catch (error) {
    // The server HTML remains fully usable if hydration fails.
    console.error('Public storefront hydration failed:', error);
  }
}
