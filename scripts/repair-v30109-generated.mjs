import fs from 'node:fs';

const ssrFile = 'src/server/ssr-store-context.tsx';
let source = fs.readFileSync(ssrFile, 'utf8');
const before = source;

const declarationPattern = /^\s*const \[adminAuth, setAdminAuth\] = useState(?:<any>)?\([^\n]*\);\s*$/gm;
const matches = [...source.matchAll(declarationPattern)];
if (matches.length > 1) {
  const keepStart = matches[matches.length - 1].index;
  let cursor = 0;
  let next = '';
  for (const match of matches) {
    const start = match.index;
    const end = start + match[0].length;
    next += source.slice(cursor, start);
    if (start === keepStart) next += match[0];
    cursor = end;
  }
  next += source.slice(cursor);
  source = next;
}

if (!source.includes('data-v30109-live-edit-session')) {
  const pattern = /const\s*\[\s*isLiveEditActive\s*,\s*setIsLiveEditActive\s*\]\s*=\s*useState(?:<[^>]+>)?\([^;]*\);/;
  if (!pattern.test(source)) throw new Error('v30.10.9 SSR live-edit state declaration missing');
  const replacement = `// data-v30109-live-edit-session: document navigation must not turn live editing off.
  const [isLiveEditActive, setLiveEditActiveState] = useState<boolean>(false);
  const setIsLiveEditActive = (nextValue: boolean | ((previous: boolean) => boolean)) => {
    setLiveEditActiveState(previous => {
      const next = typeof nextValue === 'function' ? nextValue(previous) : nextValue;
      // A child may defensively call setIsLiveEditActive(false) during its first
      // hydrated render. Do not let a false -> false no-op erase the explicit
      // sessionStorage request before the provider restoration effect reads it.
      if (next !== previous) {
        try { window.sessionStorage.setItem('chinpart_live_edit_active', next ? '1' : '0'); } catch {}
      }
      return next;
    });
  };
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('chinpart_live_edit_active') === '1') setLiveEditActiveState(true);
    } catch {}
  }, []);`;
  source = source.replace(pattern, replacement);
}

if (source !== before) {
  fs.writeFileSync(ssrFile, source);
  console.log('v30.10.9 generated SSR auth/live-edit state repaired.');
} else {
  console.log('v30.10.9 generated SSR auth/live-edit state already valid.');
}

const remaining = [...source.matchAll(declarationPattern)].length;
if (remaining !== 1) throw new Error(`v30.10.9 expected one adminAuth state declaration, found ${remaining}`);
if (!source.includes('const persistPublicPage = async')) throw new Error('v30.10.9 public CMS persistence missing after generated repair.');
if (!source.includes('data-v30109-live-edit-session')) throw new Error('v30.10.9 SSR live-edit session persistence missing.');
if (!source.includes('if (next !== previous)')) throw new Error('v30.10.9 live-edit restoration guard missing.');

// The full admin StoreContext keeps its normal React state. The Admin Pages
// toggle writes the requested live-edit mode to sessionStorage explicitly, and
// the public SSR hydration provider above restores it after document navigation.
const pagesFile = 'src/components/admin/AdminPagesTab.tsx';
let pagesSource = fs.readFileSync(pagesFile, 'utf8');
const pagesBefore = pagesSource;
if (!pagesSource.includes('data-v30109-admin-live-edit-session')) {
  const toggleNeedle = '              setIsLiveEditActive(!isLiveEditActive);';
  if (!pagesSource.includes(toggleNeedle)) throw new Error('v30.10.9 AdminPages live-edit toggle marker missing');
  pagesSource = pagesSource.replace(
    toggleNeedle,
    `              // data-v30109-admin-live-edit-session: keep live edit enabled when navigation reloads the storefront.
              const nextLiveEdit = !isLiveEditActive;
              try { window.sessionStorage.setItem('chinpart_live_edit_active', nextLiveEdit ? '1' : '0'); } catch {}
              setIsLiveEditActive(nextLiveEdit);`
  );
}
if (pagesSource !== pagesBefore) {
  fs.writeFileSync(pagesFile, pagesSource);
  console.log('v30.10.9 admin live-edit toggle session persistence applied.');
}
if (!pagesSource.includes('data-v30109-admin-live-edit-session')) throw new Error('v30.10.9 admin live-edit session persistence missing.');
