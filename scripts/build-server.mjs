import esbuild from 'esbuild';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const ssrStoreContext = path.join(projectRoot, 'src/server/ssr-store-context.tsx');

const storeContextAlias = {
  name: 'public-store-context-alias',
  setup(build) {
    build.onResolve({ filter: /context\/StoreContext$/ }, () => ({ path: ssrStoreContext }));
  }
};

const shared = {
  bundle: true,
  sourcemap: false,
  logLevel: 'info',
  target: 'node22'
};

await esbuild.build({
  ...shared,
  entryPoints: ['server.ts'],
  platform: 'node',
  format: 'esm',
  outfile: 'server.js',
  packages: 'external',
  plugins: [storeContextAlias]
});

await esbuild.build({
  bundle: true,
  entryPoints: ['src/public-hydrate.tsx'],
  platform: 'browser',
  format: 'esm',
  target: ['es2022'],
  outdir: 'dist/assets',
  entryNames: 'public-hydrate',
  chunkNames: 'public-chunks/[name]-[hash]',
  assetNames: 'public-chunks/[name]-[hash]',
  splitting: true,
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  plugins: [storeContextAlias],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

const fileSha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pipelineTrace = path.join(projectRoot, 'AUDIT_PIPELINE_TRACE.json');
if (fs.existsSync(pipelineTrace)) {
  const manifest = JSON.parse(fs.readFileSync(pipelineTrace, 'utf8'));
  manifest.production = {
    generatedAt: new Date().toISOString(),
    serverBundleSha256: fileSha256(path.join(projectRoot, 'server.js')),
    distIndexSha256: fileSha256(path.join(projectRoot, 'dist/index.html'))
  };
  fs.writeFileSync(pipelineTrace, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.copyFileSync(pipelineTrace, path.join(projectRoot, 'dist/AUDIT_PIPELINE_TRACE.json'));
  console.log('Recorded production bundle hashes and copied AUDIT_PIPELINE_TRACE.json into dist.');
}
