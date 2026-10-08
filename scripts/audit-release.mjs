import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const fail = message => { throw new Error(`release audit: ${message}`); };
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const versionMatch = String(pkg.version || '').match(/^30\.10\.(\d+)$/);
if (!versionMatch || Number(versionMatch[1]) < 7) fail(`expected 30.10.7+, got ${pkg.version}`);
if (pkg.devDependencies?.autoprefixer) fail('unused autoprefixer dependency remains');
if (!/^\^?2\.4\./.test(String(pkg.dependencies?.multer || ''))) fail('multer is not on the 2.4.x release line');
if (!/^\^?0\.35\.5/.test(String(pkg.dependencies?.sharp || ''))) fail('sharp is not on the patched 0.35.5+ release line');
if (!/^\^?7\.6\.5/.test(String(pkg.overrides?.protobufjs || ''))) fail('protobufjs override is not >=7.6.5');
if (!/^\^?8\.20\.1/.test(String(pkg.overrides?.ws || ''))) fail('ws override is not >=8.20.1');

const trackedLock = execFileSync('git', ['ls-files', 'package-lock.json'], { encoding: 'utf8' }).trim();
if (trackedLock) fail('package-lock.json must remain untracked because DirectAdmin deployment intentionally installs without a lockfile');

const home = fs.readFileSync('src/components/home/HomeView.tsx', 'utf8');
const article = fs.readFileSync('src/components/blog/ArticleDetailView.tsx', 'utf8');
if (home.includes("from '../../data/mockData'")) fail('HomeView still ships static mock article data');
if (!home.includes('articles.slice(0, 3).map((article) => (')) fail('HomeView does not render CMS/store articles');
if (article.includes("from '../../data/mockData'")) fail('ArticleDetailView still ships static mock article data');
if (!article.includes('articles.find(')) fail('ArticleDetailView is not reading runtime article state');

const sourceContracts = [
  ['src/public-hydrate.tsx', "await import('./components/product/ProductDetailView')"],
  ['src/App.tsx', "const AdminView = lazy(() => import('./components/admin/AdminView')"],
  ['src/components/search/SearchAutocomplete.tsx', 'role="combobox"'],
  ['src/components/layout/Header.tsx', 'aria-modal="true"'],
  ['server.ts', 'max-age=31536000, immutable']
];
for (const [file, marker] of sourceContracts) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(marker)) fail(`${file} lost contract ${marker}`);
}

if (Number(versionMatch[1]) >= 8) {
  const composer = fs.readFileSync('src/components/common/RichTextComposer.tsx', 'utf8');
  const admin = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');
  if (!composer.includes('data-stable-rich-editor="30.10.8"')) fail('30.10.8 replacement WYSIWYG is missing');
  if (composer.includes('@tiptap/')) fail('Tiptap leaked back into the replacement editor');
  if (!admin.includes('data-v30108-product-loader')) fail('standalone product direct loader is missing');
}

if (fs.existsSync('dist/assets')) {
  const assetsDir = 'dist/assets';
  const publicEntry = path.join(assetsDir, 'public-hydrate.js');
  if (!fs.existsSync(publicEntry)) fail('public-hydrate.js missing from production build');
  const publicBytes = fs.statSync(publicEntry).size;
  if (publicBytes >= 600_000) fail(`public hydration entry regressed to ${publicBytes} bytes`);

  const appEntries = fs.readdirSync(assetsDir)
    .filter(name => /^App-.*\.js$/.test(name))
    .map(name => fs.statSync(path.join(assetsDir, name)).size);
  if (!appEntries.length) fail('Vite App entry missing from production build');
  const maxApp = Math.max(...appEntries);
  if (maxApp >= 1_200_000) fail(`private App entry regressed to ${maxApp} bytes`);

  const publicChunkDir = path.join(assetsDir, 'public-chunks');
  if (!fs.existsSync(publicChunkDir)) fail('public route chunks missing');
  const chunks = fs.readdirSync(publicChunkDir).filter(name => name.endsWith('.js'));
  if (chunks.length < 4) fail(`expected public route chunks, got ${chunks.length}`);

  console.log(`Release artifact audit OK: public=${publicBytes} bytes, App max=${maxApp} bytes, public chunks=${chunks.length}.`);
} else {
  console.log('Release source audit OK; dist artifact checks skipped because dist/assets is not present yet.');
}
