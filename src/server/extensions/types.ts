export type ExtensionKind = 'plugin' | 'theme';

export interface ExtensionManifestBase {
  schemaVersion: 1;
  type: ExtensionKind;
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  requiresCore?: string;
  permissions?: string[];
  styles?: string[];
  clientEntry?: string;
}

export interface PluginManifest extends ExtensionManifestBase {
  type: 'plugin';
  hooks?: string[];
  settingsSchema?: Record<string, unknown>;
}

export interface ThemeManifest extends ExtensionManifestBase {
  type: 'theme';
  screenshot?: string;
  layoutPreset?: string;
  variables?: Record<string, string | number>;
}

export type ExtensionManifest = PluginManifest | ThemeManifest;

export interface InstalledExtensionState {
  id: string;
  kind: ExtensionKind;
  version: string;
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
}

export interface ExtensionStateFile {
  schemaVersion: 1;
  activeThemeId: string | null;
  installed: Record<string, InstalledExtensionState>;
}

export interface InstalledExtension {
  kind: ExtensionKind;
  manifest: ExtensionManifest;
  state: InstalledExtensionState;
  compatible: boolean;
  compatibilityMessage?: string;
  rollbackAvailable: boolean;
}
