type HookHandler<T = unknown> = (payload: T) => unknown | Promise<unknown>;

export interface ExtensionAdminMenuItem {
  id: string;
  label: string;
  order?: number;
  capability?: string;
  render?: (container: HTMLElement, context?: Record<string, unknown>) => void | (() => void) | Promise<void | (() => void)>;
}

export interface ExtensionSectionDefinition {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  defaultConfig?: Record<string, unknown>;
}

export interface YadakExtensionApi {
  registerHook: (name: string, handler: HookHandler) => () => void;
  runHook: <T = unknown>(name: string, payload: T) => Promise<unknown[]>;
  registerAdminMenu: (item: ExtensionAdminMenuItem) => () => void;
  getAdminMenus: () => ExtensionAdminMenuItem[];
  registerSection: (definition: ExtensionSectionDefinition) => () => void;
  getSections: () => ExtensionSectionDefinition[];
  getLoadedExtensions: () => string[];
}

declare global {
  interface Window {
    YadakExtensions?: YadakExtensionApi;
  }
}

const hooks = new Map<string, Set<HookHandler>>();
const loaded = new Set<string>();
const adminMenus = new Map<string, ExtensionAdminMenuItem>();
const sections = new Map<string, ExtensionSectionDefinition>();

const emit = (name: string, detail?: unknown) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const api: YadakExtensionApi = {
  registerHook(name, handler) {
    const key = String(name || '').trim();
    if (!key || typeof handler !== 'function') throw new Error('EXTENSION_HOOK_INVALID');
    const handlers = hooks.get(key) || new Set<HookHandler>();
    handlers.add(handler);
    hooks.set(key, handlers);
    emit('yadak:extension-hooks-changed', { name: key });
    return () => {
      handlers.delete(handler);
      if (!handlers.size) hooks.delete(key);
      emit('yadak:extension-hooks-changed', { name: key });
    };
  },
  async runHook(name, payload) {
    const handlers = Array.from(hooks.get(String(name || '').trim()) || []);
    const results: unknown[] = [];
    for (const handler of handlers) {
      try {
        results.push(await Promise.resolve(handler(payload)));
      } catch (error) {
        console.error(`Extension hook handler failed: ${name}`, error);
        results.push(undefined);
      }
    }
    return results;
  },
  registerAdminMenu(item) {
    const id = String(item?.id || '').trim();
    const label = String(item?.label || '').trim();
    if (!id || !label || !/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(id)) throw new Error('EXTENSION_ADMIN_MENU_INVALID');
    const normalized: ExtensionAdminMenuItem = {
      ...item,
      id,
      label,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : 100
    };
    adminMenus.set(id, normalized);
    emit('yadak:extension-admin-menu-changed', { id });
    return () => {
      adminMenus.delete(id);
      emit('yadak:extension-admin-menu-changed', { id });
    };
  },
  getAdminMenus() {
    return Array.from(adminMenus.values()).sort((a, b) => Number(a.order || 100) - Number(b.order || 100));
  },
  registerSection(definition) {
    const id = String(definition?.id || '').trim();
    const label = String(definition?.label || '').trim();
    if (!id || !label || !/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(id)) throw new Error('EXTENSION_SECTION_INVALID');
    const normalized = { ...definition, id, label };
    sections.set(id, normalized);
    emit('yadak:extension-sections-changed', { id });
    return () => {
      sections.delete(id);
      emit('yadak:extension-sections-changed', { id });
    };
  },
  getSections() {
    return Array.from(sections.values());
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

  emit('yadak:extensions-ready', {
    loaded: api.getLoadedExtensions(),
    adminMenus: api.getAdminMenus(),
    sections: api.getSections()
  });
  await api.runHook('app.ready', { path: window.location.pathname });
};
