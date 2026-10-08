import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../src/server/db';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('src/App.tsx'), /const AdminView = lazy\(\(\) => import\('\.\/components\/admin\/AdminView'\)/);
assert.match(source('src/App.tsx'), /<Suspense fallback=\{<RouteLoading \/>\}>/);
assert.match(source('src/App.tsx'), /ensureSiteFontLoaded\(settings\.fontFamily/);
assert.match(source('src/public-hydrate.tsx'), /await import\('\.\/components\/product\/ProductDetailView'\)/);
assert.doesNotMatch(source('src/public-hydrate.tsx'), /import \{ ProductDetailView \} from/);
assert.match(source('scripts/build-server.mjs'), /splitting: true/);
assert.match(source('scripts/build-server.mjs'), /public-chunks\/\[name\]-\[hash\]/);
assert.match(source('src/components/search/SearchAutocomplete.tsx'), /role="combobox"/);
assert.match(source('src/components/search/SearchAutocomplete.tsx'), /aria-activedescendant/);
assert.match(source('src/components/search/SearchAutocomplete.tsx'), /event\.key === 'ArrowDown'/);
assert.match(source('src/components/search/SearchAutocomplete.tsx'), /role="listbox"/);
assert.match(source('src/components/layout/Header.tsx'), /aria-modal="true"/);
assert.match(source('src/components/layout/Header.tsx'), /aria-controls="marketplace-category-mega"/);
assert.match(source('src/components/layout/Header.tsx'), /event\.key !== 'Escape'/);
assert.match(source('src/components/product/ProductCard.tsx'), /decoding="async"/);
assert.match(source('server.ts'), /max-age=31536000, immutable/);
assert.match(source('src/index.css'), /prefers-reduced-motion: reduce/);
assert.match(source('src/index.css'), /focus-visible/);
assert.doesNotMatch(source('index.html'), /fonts\.googleapis\.com\/css2/);
assert.doesNotMatch(source('index.html'), /"@type": "AutoPartsStore"/);
assert.match(source('src/utils/siteFont.ts'), /media = 'print'/);

const distAssets = path.resolve('dist/assets');
assert.ok(fs.existsSync(distAssets), 'dist/assets is missing; production build must run before v30.10.6 smoke.');
const publicEntry = path.join(distAssets, 'public-hydrate.js');
assert.ok(fs.existsSync(publicEntry), 'route-split public-hydrate.js entry is missing.');
const publicEntryBytes = fs.statSync(publicEntry).size;
assert.ok(publicEntryBytes < 1_500_000, `public hydration entry is still too large: ${publicEntryBytes} bytes`);
const publicEntryText = fs.readFileSync(publicEntry, 'utf8');
assert.doesNotMatch(publicEntryText, /ProseMirror|RichTextComposer|AdminView/, 'admin/editor code leaked into public hydration entry.');

const publicChunkDir = path.join(distAssets, 'public-chunks');
assert.ok(fs.existsSync(publicChunkDir), 'public route chunk directory was not generated.');
const publicChunks = fs.readdirSync(publicChunkDir).filter(name => name.endsWith('.js'));
assert.ok(publicChunks.length >= 4, `expected route-level public chunks, got ${publicChunks.length}`);

const viteAppEntries = fs.readdirSync(distAssets)
  .filter(name => /^App-.*\.js$/.test(name))
  .map(name => ({ name, size: fs.statSync(path.join(distAssets, name)).size }));
assert.ok(viteAppEntries.length > 0, 'Vite App entry is missing.');
const largestAppEntry = Math.max(...viteAppEntries.map(item => item.size));
assert.ok(largestAppEntry < 1_200_000, `private application entry is still monolithic: ${largestAppEntry} bytes`);

const get = async (pathname: string, expected = 200) => {
  const response = await fetch(base + pathname);
  const text = await response.text();
  assert.equal(response.status, expected, `${pathname} returned ${response.status}`);
  return { response, text };
};

const run = async () => {
  const homepage = await get('/');
  assert.match(homepage.text, /data-react-ssr="1"/);
  assert.match(homepage.text, /<script type="module" src="\/assets\/public-hydrate\.js"><\/script>/);
  assert.doesNotMatch(homepage.text, /fonts\.googleapis\.com\/css2/);

  const publicHydrate = await get('/assets/public-hydrate.js');
  assert.ok(Number(publicHydrate.response.headers.get('content-length') || publicEntryBytes) <= publicEntryBytes + 256);

  const chunkName = publicChunks[0];
  const chunk = await get('/assets/public-chunks/' + chunkName);
  const cacheControl = chunk.response.headers.get('cache-control') || '';
  assert.match(cacheControl, /max-age=31536000/);
  assert.match(cacheControl, /immutable/);

  console.log(`v30.10.6 stage 7 smoke passed. public entry=${publicEntryBytes} bytes, App entry max=${largestAppEntry} bytes, public chunks=${publicChunks.length}.`);
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end().catch(() => undefined);
});
