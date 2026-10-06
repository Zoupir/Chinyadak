import esbuild from 'esbuild';
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
  outfile: 'dist/assets/public-hydrate.js',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  plugins: [storeContextAlias]
});
