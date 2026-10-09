import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const TRACKED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'tmp', 'var', 'uploads', 'private-uploads', 'coverage']);
const MAX_FILE_BYTES = 1024 * 1024;

export const TRACE_MANIFEST = 'AUDIT_PIPELINE_TRACE.json';

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readText(file) {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function walk(dir, out, root = ROOT) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out, root);
    else if (TRACKED_EXTENSIONS.has(path.extname(entry.name))) {
      const text = readText(full);
      if (text == null) continue;
      const rel = path.relative(root, full).replaceAll('\\', '/');
      out.set(rel, { hash: sha256(text), text });
    }
  }
}

export function snapshotTrackedFiles(root = ROOT) {
  const out = new Map();
  for (const entry of ['src', 'extensions/site-auditor']) {
    const full = path.join(root, entry);
    if (fs.existsSync(full)) walk(full, out, root);
  }
  for (const entry of ['server.ts', 'package.json']) {
    const full = path.join(root, entry);
    const text = readText(full);
    if (text != null) out.set(entry, { hash: sha256(text), text });
  }
  return out;
}

function lineInventory(text) {
  const map = new Map();
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) continue;
    const hash = sha256(line);
    const current = map.get(hash) || { count: 0, sample: line.slice(0, 240) };
    current.count += 1;
    map.set(hash, current);
  }
  return map;
}

function lineDelta(beforeText, afterText) {
  const before = lineInventory(beforeText);
  const after = lineInventory(afterText);
  const addedLineHashes = [];
  const removedLineHashes = [];
  const addedSamples = [];
  const removedSamples = [];
  for (const [hash, item] of after) {
    if (item.count <= (before.get(hash)?.count || 0)) continue;
    addedLineHashes.push(hash);
    if (addedSamples.length < 12) addedSamples.push(item.sample);
  }
  for (const [hash, item] of before) {
    if (item.count <= (after.get(hash)?.count || 0)) continue;
    removedLineHashes.push(hash);
    if (removedSamples.length < 12) removedSamples.push(item.sample);
  }
  return { addedLineHashes, removedLineHashes, addedSamples, removedSamples };
}

export function diffSnapshots(before, after) {
  const changes = [];
  const files = new Set([...before.keys(), ...after.keys()]);
  for (const file of [...files].sort()) {
    const a = before.get(file);
    const b = after.get(file);
    const beforeHash = a?.hash || null;
    const afterHash = b?.hash || null;
    if (beforeHash === afterHash) continue;
    changes.push({
      file,
      beforeHash,
      afterHash,
      ...lineDelta(a?.text || '', b?.text || '')
    });
  }
  return changes;
}

export function hashMap(snapshot) {
  return Object.fromEntries([...snapshot.entries()].map(([file, value]) => [file, value.hash]));
}

export function appendTraceRecord(traceFile, record) {
  fs.mkdirSync(path.dirname(traceFile), { recursive: true });
  fs.appendFileSync(traceFile, JSON.stringify(record) + '\n', 'utf8');
}

export function readTraceRecords(traceFile) {
  try {
    return fs.readFileSync(traceFile, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

export function getGitCommit(root = ROOT) {
  try {
    const head = fs.readFileSync(path.join(root, '.git/HEAD'), 'utf8').trim();
    if (/^[0-9a-f]{40}$/i.test(head)) return head;
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5).trim();
      const refPath = path.join(root, '.git', ref);
      if (fs.existsSync(refPath)) {
        const value = fs.readFileSync(refPath, 'utf8').trim();
        if (/^[0-9a-f]{40}$/i.test(value)) return value;
      }
      const packedPath = path.join(root, '.git/packed-refs');
      if (fs.existsSync(packedPath)) {
        const row = fs.readFileSync(packedPath, 'utf8').split(/\r?\n/).find(line => line.endsWith(` ${ref}`));
        const value = row?.split(' ')[0] || '';
        if (/^[0-9a-f]{40}$/i.test(value)) return value;
      }
    }
  } catch {}
  return null;
}

function joinRoute(prefix, route) {
  return `${prefix.replace(/\/$/, '')}/${route.replace(/^\//, '')}`.replace(/\/+/g, '/') || '/';
}

export function buildPreparedRouteInventory(root = ROOT) {
  const server = readText(path.join(root, 'server.ts')) || '';
  const routerToSource = new Map();
  const mountByRouter = new Map();
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/src\/server\/routes\/([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(server))) {
    const source = `src/server/routes/${match[2].replace(/\.(?:ts|js)$/, '')}.ts`;
    for (const part of match[1].split(',')) {
      const clean = part.trim();
      if (!clean) continue;
      const aliasMatch = clean.match(/^([A-Za-z0-9_$]+)(?:\s+as\s+([A-Za-z0-9_$]+))?$/);
      if (aliasMatch) routerToSource.set(aliasMatch[2] || aliasMatch[1], source);
    }
  }
  const mountRegex = /app\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)/g;
  while ((match = mountRegex.exec(server))) mountByRouter.set(match[2], match[1]);

  const routes = [];
  const directRegex = /\bapp\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = directRegex.exec(server))) {
    routes.push({ method: match[1].toUpperCase(), route: match[2], file: 'server.ts', line: server.slice(0, match.index).split('\n').length });
  }

  for (const [router, source] of routerToSource) {
    const prefix = mountByRouter.get(router);
    if (!prefix) continue;
    const text = readText(path.join(root, source)) || '';
    if (!text) continue;
    const routerRegex = new RegExp(`\\b${router.replace(/[$]/g, '\\$&')}\\.(get|post|put|patch|delete)\\s*\\(\\s*['\"\`]([^'\"\`]+)['\"\`]`, 'g');
    while ((match = routerRegex.exec(text))) {
      routes.push({ method: match[1].toUpperCase(), route: joinRoute(prefix, match[2]), file: source, line: text.slice(0, match.index).split('\n').length });
    }
  }

  return routes;
}

export function detectConfirmedOverwrites(stages) {
  const overwrites = [];
  const addedByFile = new Map();
  const historyByFile = new Map();
  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    if (stage.kind !== 'stage' || !Array.isArray(stage.changes)) continue;
    for (const change of stage.changes) {
      const added = addedByFile.get(change.file) || new Map();
      for (const removedHash of change.removedLineHashes || []) {
        const previous = added.get(removedHash);
        if (previous && previous.script !== stage.script) {
          overwrites.push({
            type: 'line-removed',
            file: change.file,
            introducedBy: previous.script,
            overwrittenBy: stage.script,
            lineHash: removedHash,
            sample: previous.sample || '',
            stageIndex: index
          });
          added.delete(removedHash);
        }
      }
      for (let i = 0; i < (change.addedLineHashes || []).length; i += 1) {
        const hash = change.addedLineHashes[i];
        added.set(hash, { script: stage.script, sample: change.addedSamples?.[i] || '' });
      }
      addedByFile.set(change.file, added);

      const history = historyByFile.get(change.file) || [];
      const reverted = history.find(item => item.beforeHash && item.beforeHash === change.afterHash && item.script !== stage.script);
      if (reverted) {
        overwrites.push({
          type: 'exact-revert',
          file: change.file,
          introducedBy: reverted.script,
          overwrittenBy: stage.script,
          beforeHash: change.beforeHash,
          afterHash: change.afterHash,
          stageIndex: index
        });
      }
      history.push({ script: stage.script, beforeHash: change.beforeHash, afterHash: change.afterHash });
      historyByFile.set(change.file, history);
    }
  }
  const seen = new Set();
  return overwrites.filter(item => {
    const key = `${item.type}:${item.file}:${item.introducedBy}:${item.overwrittenBy}:${item.lineHash || item.afterHash || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
