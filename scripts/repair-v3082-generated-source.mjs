import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

// PartRequest has its own attachment contract. Do not use a global imageUrl
// marker because many unrelated entities already contain that property.
edit('src/types/index.ts', source => {
  const requestStart = source.indexOf('export interface PartRequest {');
  if (requestStart < 0) throw new Error('v30.8.2 repair: PartRequest interface missing');
  const requestEnd = source.indexOf('\n}', requestStart);
  if (requestEnd < 0) throw new Error('v30.8.2 repair: PartRequest interface end missing');
  const requestBlock = source.slice(requestStart, requestEnd);
  if (requestBlock.includes('imageUrl?: string;') && requestBlock.includes('imageName?: string;')) return source;

  const needle = '  imageAttached?: boolean;\n';
  const at = source.indexOf(needle, requestStart);
  if (at < 0 || at > requestEnd) throw new Error('v30.8.2 repair: PartRequest image marker missing');
  const replacement = needle + '  imageUrl?: string;\n  imageName?: string;\n';
  return source.slice(0, at) + replacement + source.slice(at + needle.length);
});

// Previous migrations may reorder the StoreContext destructuring. Inject
// showToast based on the component's useStore call instead of an exact string.
edit('src/components/parts/PartRequestView.tsx', source => {
  const componentAt = source.indexOf('export const PartRequestView');
  if (componentAt < 0) throw new Error('v30.8.2 repair: PartRequestView component missing');
  const useStoreAt = source.indexOf('= useStore();', componentAt);
  if (useStoreAt < 0) throw new Error('v30.8.2 repair: PartRequestView useStore call missing');
  const lineStart = source.lastIndexOf('\n', useStoreAt) + 1;
  const lineEnd = source.indexOf('\n', useStoreAt);
  const line = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
  if (line.includes('showToast')) return source;
  if (!line.includes('submitPartRequest')) throw new Error('v30.8.2 repair: unexpected PartRequestView useStore destructure');
  const nextLine = line.replace(/\s*}\s*=\s*useStore\(\);\s*$/, ', showToast } = useStore();');
  if (nextLine === line) throw new Error('v30.8.2 repair: could not add showToast');
  return source.slice(0, lineStart) + nextLine + source.slice(lineEnd < 0 ? source.length : lineEnd);
});

console.log('v30.8.2 generated-source repair:', changed.length ? changed.join(', ') : 'already satisfied');
