import fs from 'node:fs';

const file = 'src/server/ssr-store-context.tsx';
let source = fs.readFileSync(file, 'utf8');
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

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.9 generated SSR duplicate adminAuth state repaired.');
} else {
  console.log('v30.10.9 generated SSR adminAuth state already singular.');
}

const remaining = [...source.matchAll(declarationPattern)].length;
if (remaining !== 1) throw new Error(`v30.10.9 expected one adminAuth state declaration, found ${remaining}`);
if (!source.includes('const persistPublicPage = async')) throw new Error('v30.10.9 public CMS persistence missing after generated repair.');
