import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeTrustedEmbedHtml } from '../src/utils/safeEmbedHtml';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const source = (file: string) => fs.readFileSync(file, 'utf8');

// Static regression guards for the high-risk security paths.
assert.match(source('src/server/routes/rich-media.ts'), /multer\.diskStorage/);
assert.doesNotMatch(source('src/server/routes/rich-media.ts'), /multer\.memoryStorage/);
assert.match(source('src/server/routes/payments.ts'), /PAYMENT_ORDER_FORBIDDEN/);
assert.match(source('src/server/routes/engagement.ts'), /part-request-files\/:token/);
assert.match(source('src/server/routes/media.ts'), /MEDIA_FILE_IN_USE/);
assert.match(source('server.ts'), /API_CROSS_SITE_MUTATION_BLOCKED/);

const sanitized = sanitizeTrustedEmbedHtml(`
  <a href="https://trustseal.enamad.ir/?id=123" onclick="alert(1)" target="_blank">
    <img src="https://trustseal.enamad.ir/logo.aspx?id=123" onerror="alert(2)" alt="نماد">
  </a>
  <script>alert(3)</script>
  <img src="javascript:alert(4)">
`);
assert.match(sanitized, /trustseal\.enamad\.ir/);
assert.doesNotMatch(sanitized, /onclick|onerror|<script|javascript:/i);
assert.match(sanitized, /rel="nofollow noopener noreferrer"/);

const payment = await fetch(`${base}/api/payments/start`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ orderId: 'security-smoke-nonexistent', provider: 'saman' })
});
assert.equal(payment.status, 401);
const paymentBody = await payment.json() as any;
assert.equal(paymentBody.error, 'PAYMENT_AUTH_REQUIRED');

const privateAttachment = await fetch(`${base}/api/engagement/part-request-files/aW52YWxpZC5qcGc`);
assert.ok([401, 403].includes(privateAttachment.status));

const mediaLibrary = await fetch(`${base}/api/media/library`);
assert.ok([401, 403].includes(mediaLibrary.status));

const crossSite = await fetch(`${base}/api/engagement/search-log`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'https://attacker.invalid',
    'sec-fetch-site': 'cross-site'
  },
  body: JSON.stringify({ query: 'تست امنیت', resultsCount: 1 })
});
assert.equal(crossSite.status, 403);
const crossSiteBody = await crossSite.json() as any;
assert.equal(crossSiteBody.error, 'API_CROSS_SITE_MUTATION_BLOCKED');

const home = await fetch(`${base}/`);
assert.ok(home.ok);
const csp = home.headers.get('content-security-policy') || '';
assert.match(csp, /default-src 'self'/);
assert.match(csp, /object-src 'none'/);

console.log('v30.10.0 stage 1 security smoke passed.');
