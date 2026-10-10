import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const GENERIC_CONFIG_KEYS = new Set([
  'id', 'key', 'name', 'type', 'title', 'label', 'value', 'data', 'items', 'children',
  'className', 'style', 'status', 'enabled', 'order', 'slug', 'url'
]);

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function walk(dir, root, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (['node_modules', 'dist', 'tmp', 'var', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, out);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push({ full, rel: path.relative(root, full).replaceAll('\\', '/') });
    }
  }
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function sliceCallExpression(text, start, maxChars = 5000) {
  const open = text.indexOf('(', start);
  if (open < 0) return text.slice(start, start + maxChars);
  let depth = 0;
  let quote = '';
  let escaped = false;
  const limit = Math.min(text.length, start + maxChars);
  for (let index = open; index < limit; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return text.slice(start, limit);
}

function extractObjectKeys(text) {
  const out = new Set();
  const objectMatch = text.match(/\{([\s\S]{0,1400}?)\}/);
  if (!objectMatch) return out;
  const keyRegex = /(?:^|[,{\s])([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let match;
  while ((match = keyRegex.exec(objectMatch[1])) && out.size < 40) out.add(match[1]);
  return [...out];
}

export function buildPreparedApiInventory(root = process.cwd()) {
  const files = [];
  walk(path.join(root, 'src'), root, files);
  const calls = [];
  const fetchRegex = /\b(fetch|apiFetch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const axiosRegex = /\baxios\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;

  for (const { full, rel } of files) {
    if (rel.startsWith('src/server/')) continue;
    const text = readText(full);
    if (!text) continue;
    let match;
    fetchRegex.lastIndex = 0;
    while ((match = fetchRegex.exec(text))) {
      const route = match[2];
      if (!route.startsWith('/api/')) continue;
      const segment = sliceCallExpression(text, match.index);
      const method = segment.match(/\bmethod\s*:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/i)?.[1]?.toUpperCase() || 'GET';
      const bodyMatch = segment.match(/\bbody\s*:\s*JSON\.stringify\s*\(([\s\S]{0,1200}?)\)/);
      calls.push({ method, route, file: rel, line: lineAt(text, match.index), bodyKeys: bodyMatch ? extractObjectKeys(bodyMatch[1]) : [] });
    }

    axiosRegex.lastIndex = 0;
    while ((match = axiosRegex.exec(text))) {
      const route = match[2];
      if (!route.startsWith('/api/')) continue;
      const segment = sliceCallExpression(text, match.index);
      calls.push({
        method: match[1].toUpperCase(),
        route,
        file: rel,
        line: lineAt(text, match.index),
        bodyKeys: ['POST', 'PUT', 'PATCH'].includes(match[1].toUpperCase())
          ? extractObjectKeys(segment.slice(segment.indexOf(',') + 1))
          : []
      });
    }
  }
  return calls;
}

function classifyConfigLayer(rel) {
  const name = path.basename(rel);
  if (/(Admin|Editor|Modal|Composer|Settings|Form)/i.test(name) || /\/admin\//i.test(rel)) return 'editor';
  if (/(View|Section|Card|Hero|Banner|Header|Footer)/i.test(name) && /\.(?:tsx|jsx)$/.test(rel)) return 'renderer';
  return null;
}

export function buildPreparedConfigInventory(root = process.cwd()) {
  const files = [];
  walk(path.join(root, 'src'), root, files);
  const refs = [];
  const accessRegex = /\b(?:config|form|draft|settings|section\.config)\??\.([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const { full, rel } of files) {
    if (rel.startsWith('src/server/')) continue;
    const layer = classifyConfigLayer(rel);
    if (!layer) continue;
    const text = readText(full);
    if (!text) continue;
    let match;
    accessRegex.lastIndex = 0;
    while ((match = accessRegex.exec(text)) && refs.length < 8000) {
      if (GENERIC_CONFIG_KEYS.has(match[1]) || match[1].length < 4) continue;
      refs.push({ key: match[1], file: rel, line: lineAt(text, match.index), layer });
    }
  }
  return refs;
}
