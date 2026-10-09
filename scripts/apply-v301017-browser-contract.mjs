import fs from 'node:fs';

// ---------------------------------------------------------------------------
// Browser-observable inspector controls.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(file, 'utf8');

  const patchSelect = (valueExpr, field) => {
    const from = `<select value={${valueExpr}}`;
    const to = `<select data-section-field="${field}" value={${valueExpr}}`;
    if (!source.includes(to)) {
      if (!source.includes(from)) throw new Error(`v30.10.17 browser hook target missing: ${field}`);
      source = source.replace(from, to);
    }
  };

  patchSelect('form.desktopColumns || 3', 'desktopColumns');
  patchSelect('form.tabletColumns || Math.min(form.desktopColumns || 3,2)', 'tabletColumns');
  patchSelect('form.mobileColumns || 1', 'mobileColumns');

  if (!source.includes('data-section-field="desktopColumns"') ||
      !source.includes('data-section-field="tabletColumns"') ||
      !source.includes('data-section-field="mobileColumns"')) {
    throw new Error('v30.10.17 responsive column browser hooks incomplete');
  }

  fs.writeFileSync(file, source, 'utf8');
}

// ---------------------------------------------------------------------------
// Live-edit mode must survive the admin -> storefront navigation boundary.
// Do not rewrite the StoreContext state declaration: historical migrations can
// legitimately change its exact source shape before this stage. Instead use a
// one-shot navigation handoff. The visual builder records a non-sensitive
// pending flag synchronously before navigation; a remounted StoreProvider
// consumes it once and restores the existing setter. In a pure SPA transition
// the React setter already stays true and the timeout removes the unused flag.
// ---------------------------------------------------------------------------
{
  const builderFile = 'src/components/admin/AdminVisualPageBuilder.tsx';
  let builder = fs.readFileSync(builderFile, 'utf8');
  const builderMarker = 'LIVE-EDIT-NAVIGATION-HANDOFF-v301017';

  if (!builder.includes(builderMarker)) {
    const target = `          onClick={() => {\n            setIsLiveEditActive(true);`;
    if (!builder.includes(target)) throw new Error('v30.10.17 visual-builder live navigation target missing');
    builder = builder.replace(
      target,
      `          onClick={() => {\n            // ${builderMarker}\n            try {\n              window.sessionStorage.setItem('yadak-live-edit-pending', '1');\n              window.setTimeout(() => window.sessionStorage.removeItem('yadak-live-edit-pending'), 2000);\n            } catch {\n              // The ordinary React state path still works when storage is unavailable.\n            }\n            setIsLiveEditActive(true);`
    );
  }

  if (!builder.includes(builderMarker) || !builder.includes("sessionStorage.setItem('yadak-live-edit-pending', '1')")) {
    throw new Error('v30.10.17 visual-builder live navigation handoff incomplete');
  }
  fs.writeFileSync(builderFile, builder, 'utf8');

  const storeFile = 'src/context/StoreContext.tsx';
  let store = fs.readFileSync(storeFile, 'utf8');
  const storeMarker = 'LIVE-EDIT-NAVIGATION-RECOVERY-v301017';

  if (!store.includes(storeMarker)) {
    const anchor = '  const adminLogout = async () => {';
    const at = store.indexOf(anchor);
    if (at < 0) throw new Error('v30.10.17 admin logout anchor missing for live-edit recovery');
    const recovery = `  // ${storeMarker}\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    try {\n      if (window.sessionStorage.getItem('yadak-live-edit-pending') === '1') {\n        window.sessionStorage.removeItem('yadak-live-edit-pending');\n        setIsLiveEditActive(true);\n      }\n    } catch {\n      // Ignore storage errors; normal in-memory state remains available.\n    }\n  }, []);\n\n`;
    store = store.slice(0, at) + recovery + store.slice(at);
  }

  if (!store.includes(storeMarker) || !store.includes("sessionStorage.getItem('yadak-live-edit-pending') === '1'")) {
    throw new Error('v30.10.17 live-edit navigation recovery incomplete');
  }
  fs.writeFileSync(storeFile, store, 'utf8');
}

console.log('v30.10.17 browser contract: responsive controls observable and live-edit navigation survives SPA/remount boundaries.');
