type HookHandler<T = unknown> = (payload: T) => unknown | Promise<unknown>;

export interface YadakExtensionApi {
  registerHook: (name: string, handler: HookHandler) => () => void;
  runHook: <T = unknown>(name: string, payload: T) => Promise<unknown[]>;
  getLoadedExtensions: () => string[];
}

declare global {
  interface Window {
    YadakExtensions?: YadakExtensionApi;
  }
}

const hooks = new Map<string, Set<HookHandler>>();
const loaded = new Set<string>();

const api: YadakExtensionApi = {
  registerHook(name, handler) {
    const key = String(name || '').trim();
    if (!key || typeof handler !== 'function') throw new Error('EXTENSION_HOOK_INVALID');
    const handlers = hooks.get(key) || new Set<HookHandler>();
    handlers.add(handler);
    hooks.set(key, handlers);
    return () => handlers.delete(handler);
  },
  async runHook(name, payload) {
    const handlers = Array.from(hooks.get(String(name || '').trim()) || []);
    return Promise.all(handlers.map(handler => Promise.resolve(handler(payload))));
  },
  getLoadedExtensions() {
    return Array.from(loaded);
  }
};

window.YadakExtensions = api;

interface PublicExtensionItem {
  id: string;
  version: string;
  styles?: string[];
  clientEntry?: string | null;
  variables?: Record<string, string | number>;
}

interface PublicExtensionState {
  activeTheme?: PublicExtensionItem | null;
  plugins?: PublicExtensionItem[];
}

const assetUrl = (kind: 'plugin' | 'theme', id: string, file: string): string =>
  `/api/extensions/assets/${kind}/${encodeURIComponent(id)}/${file.split('/').map(encodeURIComponent).join('/')}`;

const attachStyle = (kind: 'plugin' | 'theme', extension: PublicExtensionItem, file: string): void => {
  const marker = `yadak-extension-style:${kind}:${extension.id}:${file}`;
  if (document.querySelector(`link[data-extension-style="${CSS.escape(marker)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = assetUrl(kind, extension.id, file);
  link.dataset.extensionStyle = marker;
  document.head.appendChild(link);
};

const activateClient = async (kind: 'plugin' | 'theme', extension: PublicExtensionItem): Promise<void> => {
  if (!extension.clientEntry) return;
  const url = assetUrl(kind, extension.id, extension.clientEntry);
  const module = await import(/* @vite-ignore */ url);
  if (typeof module.activate === 'function') {
    await module.activate(api, {
      id: extension.id,
      version: extension.version,
      kind
    });
  } else if (typeof module.default === 'function') {
    await module.default(api, {
      id: extension.id,
      version: extension.version,
      kind
    });
  }
};

const applyThemeVariables = (theme: PublicExtensionItem): void => {
  for (const [key, value] of Object.entries(theme.variables || {})) {
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
    if (!safeKey) continue;
    document.documentElement.style.setProperty(`--extension-${safeKey}`, String(value));
  }
};

export const loadRuntimeExtensions = async (): Promise<void> => {
  const response = await fetch('/api/extensions/public', {
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (!response.ok) return;
  const state = await response.json() as PublicExtensionState;

  if (state.activeTheme) {
    const theme = state.activeTheme;
    (theme.styles || []).forEach(file => attachStyle('theme', theme, file));
    applyThemeVariables(theme);
    await activateClient('theme', theme);
    loaded.add(`theme:${theme.id}`);
    document.documentElement.dataset.extensionTheme = theme.id;
  }

  for (const plugin of state.plugins || []) {
    (plugin.styles || []).forEach(file => attachStyle('plugin', plugin, file));
    await activateClient('plugin', plugin);
    loaded.add(`plugin:${plugin.id}`);
  }
};
