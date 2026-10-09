import fs from 'fs/promises';
import path from 'path';
import assert from 'assert/strict';
import {
  getPublicExtensionState,
  installExtensionZip,
  listExtensions,
  removeExtension,
  rollbackExtension,
  setExtensionEnabled
} from '../src/server/extensions/manager';
import { readZipEntries } from '../src/server/extensions/zip';

const u16 = (n: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };

const makeStoredZip = (files: Record<string, string>): Buffer => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const [name, value] of Object.entries(files)) {
    const filename = Buffer.from(name, 'utf8');
    const data = Buffer.from(value, 'utf8');
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0x800), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(filename.length), u16(0), filename, data
    ]);
    locals.push(local);

    centrals.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x800), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(filename.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), filename
    ]));
    offset += local.length;
  }

  const central = Buffer.concat(centrals);
  const body = Buffer.concat(locals);
  const eocd = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(centrals.length), u16(centrals.length),
    u32(central.length), u32(body.length), u16(0)
  ]);
  return Buffer.concat([body, central, eocd]);
};

const pluginZip = (version: string) => makeStoredZip({
  'demo-plugin/plugin.json': JSON.stringify({
    schemaVersion: 1,
    type: 'plugin',
    id: 'smoke-demo-plugin',
    name: 'Smoke Demo Plugin',
    version,
    requiresCore: '>=30.10.8',
    styles: ['assets/demo.css'],
    clientEntry: 'client/index.js',
    hooks: ['product.card.afterPrice']
  }),
  'demo-plugin/assets/demo.css': '.smoke-demo{display:block}',
  'demo-plugin/client/index.js': 'export function activate(api){ api.registerHook("product.card.afterPrice", () => "ok"); }'
});

const main = async () => {
  const root = path.resolve(process.cwd(), 'var', 'extensions');
  await fs.rm(root, { recursive: true, force: true });

  try {
    const entries = readZipEntries(pluginZip('1.0.0'));
    assert.equal(entries.length, 3);

    const installed = await installExtensionZip(pluginZip('1.0.0'), 'plugin');
    assert.equal(installed.manifest.id, 'smoke-demo-plugin');
    assert.equal(installed.state.enabled, false);

    await setExtensionEnabled('plugin', 'smoke-demo-plugin', true);
    let publicState = await getPublicExtensionState();
    assert.equal(publicState.plugins.length, 1);
    assert.equal(publicState.plugins[0].version, '1.0.0');

    const updated = await installExtensionZip(pluginZip('1.1.0'), 'plugin');
    assert.equal(updated.manifest.version, '1.1.0');
    assert.equal(updated.state.enabled, true);
    assert.equal(updated.rollbackAvailable, true);

    await rollbackExtension('plugin', 'smoke-demo-plugin');
    const listed = await listExtensions();
    assert.equal(listed.plugins[0].manifest.version, '1.0.0');

    await removeExtension('plugin', 'smoke-demo-plugin');
    publicState = await getPublicExtensionState();
    assert.equal(publicState.plugins.length, 0);

    const traversal = makeStoredZip({ '../escape.txt': 'bad' });
    assert.throws(() => readZipEntries(traversal), /ZIP_PATH_TRAVERSAL|ZIP_PATH_INVALID/);

    console.log('Extension platform smoke test passed.');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
