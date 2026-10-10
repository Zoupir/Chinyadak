# Yadak Store Extension Platform

This directory documents the ZIP-based plugin/theme system.

## Plugin package

A plugin ZIP may contain its files at ZIP root or inside one top-level folder. It must contain `plugin.json`.

```json
{
  "schemaVersion": 1,
  "type": "plugin",
  "id": "product-badges",
  "name": "Product Badges",
  "version": "1.0.0",
  "description": "Adds storefront badges.",
  "author": "Yadak Store",
  "requiresCore": ">=30.10.8",
  "permissions": ["catalog.read"],
  "hooks": ["product.card.afterPrice"],
  "styles": ["assets/plugin.css"],
  "clientEntry": "client/index.js"
}
```

The browser entry must be an ES module. It can export either `activate` or a default function:

```js
export function activate(api, extension) {
  const unregister = api.registerHook('product.card.afterPrice', payload => {
    return { label: 'پرفروش', productId: payload.productId };
  });

  // Return/track cleanup in your own module if needed.
  console.info('Activated', extension.id);
}
```

The runtime API currently exposes:

- `registerHook(name, handler)`
- `runHook(name, payload)`
- `getLoadedExtensions()`

Core UI components will progressively expose stable hook points instead of allowing plugins to edit Core files.

## Theme package

A theme ZIP must contain `theme.json`.

```json
{
  "schemaVersion": 1,
  "type": "theme",
  "id": "clean-parts",
  "name": "Clean Parts",
  "version": "1.0.0",
  "requiresCore": ">=30.10.8",
  "styles": ["assets/theme.css"],
  "screenshot": "assets/screenshot.webp",
  "variables": {
    "primary": "#e63236",
    "navy": "#074493"
  }
}
```

Theme variables are exposed as CSS custom properties with the `--extension-` prefix, for example `primary` becomes `--extension-primary`.

## Installation

After logging in as an administrator, open:

`/admin/extensions-manager`

Upload the ZIP and select Plugin or Theme. New installs are disabled by default. Updates preserve activation state. Activating a theme automatically deactivates the previously active external theme.

## Storage and updates

Installed packages are stored under `var/extensions/`, which is ignored by Git and therefore is not removed by normal Core updates. Previous versions are moved to an internal rollback directory before replacement/removal.

## Security rules

The installer rejects:

- absolute paths and `../` traversal
- symlink entries
- encrypted ZIPs
- unsupported ZIP compression methods
- more than 300 entries
- archives larger than 20 MiB
- extracted packages larger than 64 MiB
- individual extracted files larger than 16 MiB
- missing/invalid manifests
- incompatible Core version requirements

Client plugin code is trusted code chosen by an administrator, similar to WordPress plugins. Only install packages from trusted sources.

## Current scope

Phase 1 provides package installation, activation/deactivation, update replacement, rollback, public asset loading, CSS themes, client ES-module plugins, compatibility checks, and a browser hook registry. Server-side plugin execution and database migration permissions are intentionally not enabled yet; those require a stricter permission/migration contract before production use.
