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

const addLiveEditSessionPersistence = input => {
  if (input.includes('data-v30109-live-edit-session')) return input;
  const pattern = /  const \[isLiveEditActive, setIsLiveEditActive\] = useState(?:<boolean>)?\(false\);/;
  if (!pattern.test(input)) throw new Error('v30.10.9 live-edit state declaration missing');
  const replacement = `  // data-v30109-live-edit-session: document navigation must not turn live editing off.\n  const [isLiveEditActive, setLiveEditActiveState] = useState<boolean>(false);\n  const setIsLiveEditActive = (nextValue: boolean | ((previous: boolean) => boolean)) => {\n    setLiveEditActiveState(previous => {\n      const next = typeof nextValue === 'function' ? nextValue(previous) : nextValue;\n      try { window.sessionStorage.setItem('chinpart_live_edit_active', next ? '1' : '0'); } catch {}\n      return next;\n    });\n  };\n  useEffect(() => {\n    try {\n      if (window.sessionStorage.getItem('chinpart_live_edit_active') === '1') setLiveEditActiveState(true);\n    } catch {}\n  }, []);`;
  return input.replace(pattern, replacement);
};

source = addLiveEditSessionPersistence(source);
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

const storeFile = 'src/context/StoreContext.tsx';
let storeSource = fs.readFileSync(storeFile, 'utf8');
const storeBefore = storeSource;
storeSource = addLiveEditSessionPersistence(storeSource);
if (storeSource !== storeBefore) {
  fs.writeFileSync(storeFile, storeSource);
  console.log('v30.10.9 StoreContext live-edit session persistence applied.');
} else {
  console.log('v30.10.9 StoreContext live-edit session persistence already valid.');
}
if (!storeSource.includes('data-v30109-live-edit-session')) throw new Error('v30.10.9 StoreContext live-edit persistence missing.');
