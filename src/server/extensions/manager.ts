import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { extractZipBuffer } from './zip';
import type {
  ExtensionKind,
  ExtensionManifest,
  ExtensionStateFile,
  InstalledExtension,
  InstalledExtensionState
} from './types';

const EXTENSION_ROOT = path.resolve(process.cwd(), 'var', 'extensions');
const STATE_FILE = path.join(EXTENSION_ROOT, 'state.json');
const STAGING_ROOT = path.join(EXTENSION_ROOT, '.staging');
const ROLLBACK_ROOT = path.join(EXTENSION_ROOT, '.rollback');
const MANIFEST_FILE: Record<ExtensionKind, string> = {
  plugin: 'plugin.json',
  theme: 'theme.json'
};

const emptyState = (): ExtensionStateFile => ({
  schemaVersion: 1,
  activeThemeId: null,
  installed: {}
});

const stateKey = (kind: ExtensionKind, id: string): string => `${kind}:${id}`;

const safeId = (value: unknown): string => {
  const id = String(value ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) throw new Error('EXTENSION_ID_INVALID');
  return id;
};

const safeVersion = (value: unknown): string => {
  const version = String(value ?? '').trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('EXTENSION_VERSION_INVALID');
  return version;
};

const safeRelativeFile = (value: unknown): string => {
  const raw = String(value ?? '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!raw || raw.startsWith('/') || raw === '..' || raw.startsWith('../') || raw.includes('/../')) {
    throw new Error('EXTENSION_FILE_PATH_INVALID');
  }
  return path.posix.normalize(raw);
};

const compareVersions = (a: string, b: string): number => {
  const pa = a.split('-', 1)[0].split('.').map(Number);
  const pb = b.split('-', 1)[0].split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
};

const coreVersion = async (): Promise<string> => {
  const parsed = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf8'));
  return safeVersion(parsed.version);
};

const compatibility = async (manifest: ExtensionManifest): Promise<{ compatible: boolean; message?: string }> => {
  if (!manifest.requiresCore) return { compatible: true };
  const requirement = String(manifest.requiresCore).trim();
  const current = await coreVersion();
  const match = requirement.match(/^(>=|>|<=|<|=|\^|~)?\s*(\d+\.\d+\.\d+)$/);
  if (!match) return { compatible: false, message: `قانون نسخه هسته پشتیبانی نمی‌شود: ${requirement}` };

  const operator = match[1] || '=';
  const target = match[2];
  const cmp = compareVersions(current, target);
  let ok = false;
  if (operator === '>=') ok = cmp >= 0;
  else if (operator === '>') ok = cmp > 0;
  else if (operator === '<=') ok = cmp <= 0;
  else if (operator === '<') ok = cmp < 0;
  else if (operator === '=') ok = cmp === 0;
  else if (operator === '^') ok = current.split('.')[0] === target.split('.')[0] && cmp >= 0;
  else if (operator === '~') {
    const [cMajor, cMinor] = current.split('.');
    const [tMajor, tMinor] = target.split('.');
    ok = cMajor === tMajor && cMinor === tMinor && cmp >= 0;
  }

  return ok
    ? { compatible: true }
    : { compatible: false, message: `نیازمند Core ${requirement} است؛ نسخه فعلی ${current} است.` };
};

const readState = async (): Promise<ExtensionStateFile> => {
  await fs.mkdir(EXTENSION_ROOT, { recursive: true });
  try {
    const parsed = JSON.parse(await fs.readFile(STATE_FILE, 'utf8')) as ExtensionStateFile;
    if (parsed?.schemaVersion !== 1 || typeof parsed.installed !== 'object') return emptyState();
    return parsed;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return emptyState();
    throw error;
  }
};

const writeState = async (state: ExtensionStateFile): Promise<void> => {
  await fs.mkdir(EXTENSION_ROOT, { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await fs.rename(tmp, STATE_FILE);
};

const kindRoot = (kind: ExtensionKind): string => path.join(EXTENSION_ROOT, kind === 'plugin' ? 'plugins' : 'themes');
const extensionDir = (kind: ExtensionKind, id: string): string => path.join(kindRoot(kind), safeId(id));
const rollbackDir = (kind: ExtensionKind, id: string): string => path.join(ROLLBACK_ROOT, kind, safeId(id));

const readManifestAt = async (directory: string, expectedKind: ExtensionKind): Promise<ExtensionManifest> => {
  const manifestPath = path.join(directory, MANIFEST_FILE[expectedKind]);
  const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as ExtensionManifest;
  if (parsed?.schemaVersion !== 1) throw new Error('EXTENSION_SCHEMA_UNSUPPORTED');
  if (parsed.type !== expectedKind) throw new Error('EXTENSION_KIND_MISMATCH');
  parsed.id = safeId(parsed.id);
  parsed.version = safeVersion(parsed.version);
  parsed.name = String(parsed.name ?? '').trim();
  if (!parsed.name || parsed.name.length > 160) throw new Error('EXTENSION_NAME_INVALID');
  if (parsed.description != null) parsed.description = String(parsed.description).slice(0, 2000);
  if (parsed.author != null) parsed.author = String(parsed.author).slice(0, 190);
  if (parsed.requiresCore != null) parsed.requiresCore = String(parsed.requiresCore).slice(0, 80);
  if (parsed.styles != null) {
    if (!Array.isArray(parsed.styles) || parsed.styles.length > 20) throw new Error('EXTENSION_STYLES_INVALID');
    parsed.styles = parsed.styles.map(safeRelativeFile);
  }
  if (parsed.clientEntry != null) parsed.clientEntry = safeRelativeFile(parsed.clientEntry);
  if (parsed.permissions != null) {
    if (!Array.isArray(parsed.permissions) || parsed.permissions.length > 50) throw new Error('EXTENSION_PERMISSIONS_INVALID');
    parsed.permissions = parsed.permissions.map(item => String(item).slice(0, 120));
  }
  if (parsed.type === 'plugin' && parsed.hooks != null) {
    if (!Array.isArray(parsed.hooks) || parsed.hooks.length > 100) throw new Error('PLUGIN_HOOKS_INVALID');
    parsed.hooks = parsed.hooks.map(item => String(item).slice(0, 160));
  }
  if (parsed.type === 'theme' && parsed.screenshot != null) parsed.screenshot = safeRelativeFile(parsed.screenshot);
  return parsed;
};

const locatePackageRoot = async (staging: string, kind: ExtensionKind): Promise<string> => {
  const manifestName = MANIFEST_FILE[kind];
  const direct = path.join(staging, manifestName);
  try {
    await fs.access(direct);
    return staging;
  } catch {
    // continue
  }

  const entries = await fs.readdir(staging, { withFileTypes: true });
  const candidates: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const candidate = path.join(staging, entry.name);
    try {
      await fs.access(path.join(candidate, manifestName));
      candidates.push(candidate);
    } catch {
      // not an extension root
    }
  }
  if (candidates.length !== 1) throw new Error('EXTENSION_MANIFEST_NOT_FOUND');
  return candidates[0];
};

const hasRollback = async (kind: ExtensionKind, id: string): Promise<boolean> => {
  try {
    const items = await fs.readdir(rollbackDir(kind, id));
    return items.length > 0;
  } catch {
    return false;
  }
};

export const installExtensionZip = async (archive: Buffer, kind: ExtensionKind): Promise<InstalledExtension> => {
  if (!Buffer.isBuffer(archive) || archive.length < 22) throw new Error('EXTENSION_ARCHIVE_INVALID');
  if (archive.length > 20 * 1024 * 1024) throw new Error('EXTENSION_ARCHIVE_TOO_LARGE');

  await fs.mkdir(STAGING_ROOT, { recursive: true });
  await fs.mkdir(kindRoot(kind), { recursive: true });
  const staging = path.join(STAGING_ROOT, randomUUID());
  await fs.mkdir(staging, { recursive: true });

  try {
    await extractZipBuffer(archive, staging, {
      maxEntries: 300,
      maxTotalUncompressedBytes: 64 * 1024 * 1024,
      maxSingleFileBytes: 16 * 1024 * 1024
    });
    const packageRoot = await locatePackageRoot(staging, kind);
    const manifest = await readManifestAt(packageRoot, kind);
    const compat = await compatibility(manifest);
    if (!compat.compatible) throw new Error(`EXTENSION_INCOMPATIBLE:${compat.message}`);

    for (const relative of [...(manifest.styles || []), ...(manifest.clientEntry ? [manifest.clientEntry] : [])]) {
      await fs.access(path.join(packageRoot, ...relative.split('/')));
    }

    const target = extensionDir(kind, manifest.id);
    const state = await readState();
    const key = stateKey(kind, manifest.id);
    const previousState = state.installed[key];

    try {
      await fs.access(target);
      const backupRoot = rollbackDir(kind, manifest.id);
      await fs.mkdir(backupRoot, { recursive: true });
      const backup = path.join(backupRoot, `${Date.now()}-${previousState?.version || 'unknown'}`);
      await fs.rename(target, backup);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }

    await fs.rename(packageRoot, target);
    const now = new Date().toISOString();
    state.installed[key] = {
      id: manifest.id,
      kind,
      version: manifest.version,
      enabled: previousState?.enabled ?? false,
      installedAt: previousState?.installedAt ?? now,
      updatedAt: now
    };
    await writeState(state);

    return {
      kind,
      manifest,
      state: state.installed[key],
      compatible: true,
      rollbackAvailable: await hasRollback(kind, manifest.id)
    };
  } finally {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
  }
};

const readInstalled = async (kind: ExtensionKind, id: string, state: ExtensionStateFile): Promise<InstalledExtension | null> => {
  const key = stateKey(kind, id);
  const extState = state.installed[key];
  if (!extState) return null;
  try {
    const manifest = await readManifestAt(extensionDir(kind, id), kind);
    const compat = await compatibility(manifest);
    return {
      kind,
      manifest,
      state: extState,
      compatible: compat.compatible,
      compatibilityMessage: compat.message,
      rollbackAvailable: await hasRollback(kind, id)
    };
  } catch {
    return null;
  }
};

export const listExtensions = async (): Promise<{ plugins: InstalledExtension[]; themes: InstalledExtension[]; activeThemeId: string | null }> => {
  const state = await readState();
  const plugins: InstalledExtension[] = [];
  const themes: InstalledExtension[] = [];
  for (const extState of Object.values(state.installed)) {
    const item = await readInstalled(extState.kind, extState.id, state);
    if (!item) continue;
    (item.kind === 'plugin' ? plugins : themes).push(item);
  }
  plugins.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name, 'fa'));
  themes.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name, 'fa'));
  return { plugins, themes, activeThemeId: state.activeThemeId };
};

export const setExtensionEnabled = async (kind: ExtensionKind, id: string, enabled: boolean): Promise<void> => {
  id = safeId(id);
  const state = await readState();
  const key = stateKey(kind, id);
  const item = await readInstalled(kind, id, state);
  if (!item) throw new Error('EXTENSION_NOT_FOUND');
  if (!item.compatible && enabled) throw new Error('EXTENSION_INCOMPATIBLE');

  state.installed[key].enabled = enabled;
  state.installed[key].updatedAt = new Date().toISOString();
  if (kind === 'theme') {
    if (enabled) {
      state.activeThemeId = id;
      for (const entry of Object.values(state.installed)) {
        if (entry.kind === 'theme') entry.enabled = entry.id === id;
      }
    } else if (state.activeThemeId === id) {
      state.activeThemeId = null;
    }
  }
  await writeState(state);
};

export const removeExtension = async (kind: ExtensionKind, id: string): Promise<void> => {
  id = safeId(id);
  const state = await readState();
  const key = stateKey(kind, id);
  if (!state.installed[key]) throw new Error('EXTENSION_NOT_FOUND');
  const target = extensionDir(kind, id);
  const backupRoot = rollbackDir(kind, id);
  await fs.mkdir(backupRoot, { recursive: true });
  const backup = path.join(backupRoot, `${Date.now()}-${state.installed[key].version}-removed`);
  await fs.rename(target, backup);
  delete state.installed[key];
  if (kind === 'theme' && state.activeThemeId === id) state.activeThemeId = null;
  await writeState(state);
};

export const rollbackExtension = async (kind: ExtensionKind, id: string): Promise<void> => {
  id = safeId(id);
  const state = await readState();
  const key = stateKey(kind, id);
  const current = state.installed[key];
  if (!current) throw new Error('EXTENSION_NOT_FOUND');

  const backupRoot = rollbackDir(kind, id);
  const backups = await fs.readdir(backupRoot, { withFileTypes: true });
  const names = backups.filter(item => item.isDirectory()).map(item => item.name).sort().reverse();
  if (!names.length) throw new Error('EXTENSION_ROLLBACK_NOT_AVAILABLE');

  const target = extensionDir(kind, id);
  const currentBackup = path.join(backupRoot, `${Date.now()}-${current.version}-rollback-source`);
  await fs.rename(target, currentBackup);
  const selected = path.join(backupRoot, names[0]);
  await fs.rename(selected, target);

  const manifest = await readManifestAt(target, kind);
  current.version = manifest.version;
  current.updatedAt = new Date().toISOString();
  await writeState(state);
};

export const getPublicExtensionState = async () => {
  const { plugins, themes, activeThemeId } = await listExtensions();
  const activeTheme = themes.find(item => item.manifest.id === activeThemeId && item.state.enabled) || null;
  return {
    activeTheme: activeTheme ? {
      id: activeTheme.manifest.id,
      name: activeTheme.manifest.name,
      version: activeTheme.manifest.version,
      styles: activeTheme.manifest.styles || [],
      clientEntry: activeTheme.manifest.clientEntry || null,
      variables: activeTheme.manifest.type === 'theme' ? activeTheme.manifest.variables || {} : {}
    } : null,
    plugins: plugins.filter(item => item.state.enabled && item.compatible).map(item => ({
      id: item.manifest.id,
      name: item.manifest.name,
      version: item.manifest.version,
      styles: item.manifest.styles || [],
      clientEntry: item.manifest.clientEntry || null,
      hooks: item.manifest.type === 'plugin' ? item.manifest.hooks || [] : []
    }))
  };
};

export const resolveExtensionAsset = async (kind: ExtensionKind, id: string, relativePath: string): Promise<string> => {
  id = safeId(id);
  const relative = safeRelativeFile(relativePath);
  const state = await readState();
  const key = stateKey(kind, id);
  const ext = state.installed[key];
  if (!ext?.enabled) throw new Error('EXTENSION_NOT_ACTIVE');
  if (kind === 'theme' && state.activeThemeId !== id) throw new Error('THEME_NOT_ACTIVE');

  const root = path.resolve(extensionDir(kind, id));
  const target = path.resolve(root, ...relative.split('/'));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('EXTENSION_FILE_PATH_INVALID');
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error('EXTENSION_ASSET_NOT_FOUND');
  return target;
};
