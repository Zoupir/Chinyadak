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
// The admin session itself is HttpOnly/server-backed, but this UI-only mode was
// previously a volatile React boolean. A remount/navigation therefore reset it
// to false even though the administrator remained authenticated. Persist only
// this non-sensitive boolean in sessionStorage and clear it on admin logout.
// ---------------------------------------------------------------------------
{
  const file = 'src/context/StoreContext.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const marker = 'LIVE-EDIT-NAVIGATION-PERSISTENCE-v301017';

  if (!source.includes(marker)) {
    const statePattern = /\s*const\s*\[\s*isLiveEditActive\s*,\s*setIsLiveEditActive\s*\]\s*=\s*useState(?:<boolean>)?\s*\(\s*false\s*\)\s*;/;
    const match = source.match(statePattern);
    if (!match) throw new Error('v30.10.17 live-edit state declaration target missing');

    const to = `\n  // ${marker}\n  const LIVE_EDIT_SESSION_KEY = 'yadak-live-edit-active';\n  const [isLiveEditActive, setIsLiveEditActiveState] = useState<boolean>(false);\n\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    try {\n      if (window.sessionStorage.getItem(LIVE_EDIT_SESSION_KEY) === '1') {\n        setIsLiveEditActiveState(true);\n      }\n    } catch {\n      // sessionStorage can be unavailable in hardened/private browser modes.\n    }\n  }, []);\n\n  const setIsLiveEditActive = (active: boolean) => {\n    setIsLiveEditActiveState(active);\n    if (typeof window === 'undefined') return;\n    try {\n      if (active) window.sessionStorage.setItem(LIVE_EDIT_SESSION_KEY, '1');\n      else window.sessionStorage.removeItem(LIVE_EDIT_SESSION_KEY);\n    } catch {\n      // React state remains authoritative when browser storage is unavailable.\n    }\n  };`;
    source = source.replace(statePattern, to);

    const logoutStart = source.indexOf('  const adminLogout = async () => {');
    if (logoutStart < 0) throw new Error('v30.10.17 admin logout target missing');
    const authReset = source.indexOf('    setAdminAuth({', logoutStart);
    if (authReset < 0) throw new Error('v30.10.17 admin auth reset target missing');
    source = source.slice(0, authReset) + '    setIsLiveEditActive(false);\n' + source.slice(authReset);
  }

  if (!source.includes(marker) ||
      !source.includes("sessionStorage.setItem(LIVE_EDIT_SESSION_KEY, '1')") ||
      !source.includes('setIsLiveEditActive(false);')) {
    throw new Error('v30.10.17 live-edit navigation persistence incomplete');
  }

  fs.writeFileSync(file, source, 'utf8');
}

console.log('v30.10.17 browser contract: responsive controls observable and live-edit mode persists across storefront navigation.');
