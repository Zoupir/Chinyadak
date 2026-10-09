import fs from 'node:fs';
import path from 'node:path';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditStatus = 'working' | 'partial' | 'broken' | 'conflict' | 'unknown';

export interface AuditFinding {
  id: string;
  title: string;
  category: 'runtime' | 'routing' | 'ui' | 'api' | 'config' | 'source' | 'extension';
  severity: AuditSeverity;
  status: AuditStatus;
  summary: string;
  evidence: string[];
  likelyCause?: string;
  files?: string[];
  recommendation?: string;
}

export interface SiteAuditReport {
  generatedAt: string;
  coreVersion: string;
  commit: string | null;
  scannedFiles: number;
  routeInventorySize: number;
  summary: {
    total: number;
    critical: number;
    errors: number;
    warnings: number;
    conflicts: number;
    broken: number;
    partial: number;
  };
  findings: AuditFinding[];
}

type RouteRef = { method: string; route: string; file: string; line: number };

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'tmp', 'var', 'uploads', 'coverage']);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 1800;

function readUtf8(file: string): string | null {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function relative(file: string) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function walk(dir: string, out: string[]) {
  if (out.length >= MAX_FILES) return;
  let entries: fs.Dirent[] = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (out.length >= MAX_FILES) break;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
}

function getCoreVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return String(pkg.version || 'unknown');
  } catch { return 'unknown'; }
}

function getCommit() {
  try {
    const file = path.join(ROOT, 'BUILD_COMMIT');
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim() || null;
  } catch {}
  return null;
}

function add(findings: AuditFinding[], finding: AuditFinding) {
  if (!findings.some(item => item.id === finding.id)) findings.push(finding);
}

function joinRoute(prefix: string, route: string) {
  const value = `${prefix.replace(/\/$/, '')}/${route.replace(/^\//, '')}`.replace(/\/+/g, '/');
  return value === '' ? '/' : value;
}

function buildRouteInventory(files: string[]): RouteRef[] {
  const serverFile = path.join(ROOT, 'server.ts');
  const server = readUtf8(serverFile) || '';
  const routerToSource = new Map<string, string>();
  const mountBySource = new Map<string, string>();
  const importRegex = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*['"]\.\/src\/server\/routes\/([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(server))) {
    const source = `src/server/routes/${match[2].replace(/\.(?:ts|js)$/, '')}.ts`;
    routerToSource.set(match[1], source);
  }
  const mountRegex = /app\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
  while ((match = mountRegex.exec(server))) {
    const source = routerToSource.get(match[2]);
    if (source) mountBySource.set(source, match[1]);
  }

  const routes: RouteRef[] = [];
  const directRegex = /\bapp\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = directRegex.exec(server))) {
    routes.push({ method: match[1].toUpperCase(), route: match[2], file: 'server.ts', line: server.slice(0, match.index).split('\n').length });
  }

  const routerRegex = /\b[A-Za-z0-9_]*Router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    const rel = relative(file);
    const prefix = mountBySource.get(rel);
    if (!prefix) continue;
    const text = readUtf8(file); if (!text) continue;
    routerRegex.lastIndex = 0;
    while ((match = routerRegex.exec(text))) {
      routes.push({
        method: match[1].toUpperCase(),
        route: joinRoute(prefix, match[2]),
        file: rel,
        line: text.slice(0, match.index).split('\n').length
      });
    }
  }
  return routes;
}

function routeMatches(actual: string, declared: string) {
  const cleanActual = actual.replace(/\?.*$/, '').replace(/\$\{[^}]+\}/g, 'value');
  const escaped = declared
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[A-Za-z0-9_]+/g, '[^/]+')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}/?$`).test(cleanActual);
}

function scanDuplicateServerRoutes(routes: RouteRef[], findings: AuditFinding[]) {
  const seen = new Map<string, RouteRef[]>();
  for (const ref of routes) {
    const key = `${ref.method} ${ref.route}`;
    const refs = seen.get(key) || [];
    refs.push(ref); seen.set(key, refs);
  }
  for (const [route, refs] of seen) {
    if (refs.length < 2) continue;
    add(findings, {
      id: `duplicate-route:${route}`,
      title: `تعریف تکراری Route: ${route}`,
      category: 'routing', severity: 'error', status: 'conflict',
      summary: 'یک endpoint کامل بیش از یک‌بار تعریف شده و ترتیب mount می‌تواند رفتار متفاوت ایجاد کند.',
      evidence: refs.map(ref => `${ref.file}:${ref.line}`),
      files: [...new Set(refs.map(ref => ref.file))],
      likelyCause: 'دو بخش Core مسئولیت یک endpoint یکسان را گرفته‌اند.',
      recommendation: 'مالک endpoint یکی شود یا مسیرها/متدها تفکیک شوند.'
    });
  }
}

function scanPotentialUiApiMismatches(files: string[], routes: RouteRef[], findings: AuditFinding[]) {
  const apiRefs = new Map<string, Set<string>>();
  const fetchRegex = /(?:fetch|apiFetch|axios\.(?:get|post|put|patch|delete))\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    const text = readUtf8(file); if (!text) continue;
    fetchRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = fetchRegex.exec(text))) {
      if (!match[1].startsWith('/api/')) continue;
      const refs = apiRefs.get(match[1]) || new Set<string>();
      refs.add(`${relative(file)}:${text.slice(0, match.index).split('\n').length}`);
      apiRefs.set(match[1], refs);
    }
  }
  for (const [api, refs] of apiRefs) {
    if (routes.some(route => routeMatches(api, route.route))) continue;
    add(findings, {
      id: `ui-api-unmatched:${api}`,
      title: `فراخوانی UI بدون endpoint منطبق: ${api}`,
      category: 'api', severity: 'warning', status: 'partial',
      summary: 'کد سمت کاربر این API را صدا می‌زند اما در inventory مسیرهای server endpoint منطبق پیدا نشد.',
      evidence: [...refs], files: [...new Set([...refs].map(ref => ref.split(':')[0]))],
      likelyCause: 'endpoint حذف یا rename شده، UI قدیمی مانده، یا مسیر به‌صورت غیرliteral/dynamic ثبت شده است.',
      recommendation: 'contract این فراخوانی با server بررسی و در صورت route دینامیک، تست صریح برای آن اضافه شود.'
    });
  }
}

function scanDangerMarkers(files: string[], findings: AuditFinding[]) {
  const patterns: Array<[RegExp, string, string, AuditSeverity]> = [
    [/TODO\b|FIXME\b/g, 'نشانگر کار نیمه‌تمام', 'وجود TODO/FIXME در کد اجرایی می‌تواند نشان‌دهنده قابلیت ناقص باشد.', 'warning'],
    [/catch\s*\([^)]*\)\s*\{\s*\}/g, 'خطای بلعیده‌شده', 'یک catch خالی پیدا شد؛ خطا ممکن است در UI مخفی بماند و فقط رفتار ناقص دیده شود.', 'error']
  ];
  for (const file of files) {
    const rel = relative(file);
    if (rel.startsWith('scripts/')) continue;
    const text = readUtf8(file); if (!text) continue;
    for (const [regex, title, summary, severity] of patterns) {
      regex.lastIndex = 0;
      const hits: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) && hits.length < 8) hits.push(text.slice(0, match.index).split('\n').length);
      if (!hits.length) continue;
      add(findings, {
        id: `${title}:${rel}`,
        title: `${title} در ${rel}`,
        category: 'source', severity, status: severity === 'error' ? 'partial' : 'unknown',
        summary, evidence: hits.map(line => `${rel}:${line}`), files: [rel],
        recommendation: severity === 'error' ? 'خطا ثبت، قابل مشاهده و به نتیجه مشخص در UI تبدیل شود.' : 'TODO/FIXME تعیین تکلیف یا به issue/test قابل ردیابی تبدیل شود.'
      });
    }
  }
}

function scanExtensionWiring(files: string[], findings: AuditFinding[]) {
  const runtime = readUtf8(path.join(ROOT, 'src/extensions/runtime.ts')) || '';
  if (!/registerHook|registerAdminMenu|registerSection/.test(runtime)) return;
  const corpus = files.map(file => readUtf8(file) || '').join('\n');
  for (const token of ['ExtensionSlot', 'ExtensionSectionQuickAdd', 'AdminExtensionPageHost']) {
    if (!corpus.includes(token)) {
      add(findings, {
        id: `extension-wiring:${token}`,
        title: `اتصال ناقص Extension Platform: ${token}`,
        category: 'extension', severity: 'warning', status: 'partial',
        summary: `زیرساخت افزونه وجود دارد اما استفاده از ${token} در سورس پیدا نشد.`,
        evidence: ['src/extensions/runtime.ts'], files: ['src/extensions/runtime.ts'],
        recommendation: 'نقطه اتصال افزونه به UI/Core بررسی شود تا API ثبت‌شده واقعاً استفاده شود.'
      });
    }
  }
}

function scanMissingReferencedFiles(files: string[], findings: AuditFinding[]) {
  const importRegex = /(?:from\s*|import\s*\()['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const file of files) {
    const rel = relative(file);
    if (!rel.startsWith('src/')) continue;
    const text = readUtf8(file); if (!text) continue;
    importRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text))) {
      const base = path.resolve(path.dirname(file), match[1]);
      const candidates = [base, ...[...SOURCE_EXTENSIONS].map(ext => `${base}${ext}`), ...[...SOURCE_EXTENSIONS].map(ext => path.join(base, `index${ext}`))];
      if (candidates.some(candidate => fs.existsSync(candidate))) continue;
      add(findings, {
        id: `missing-import:${rel}:${match[1]}`,
        title: `Import محلی بدون فایل مقصد`,
        category: 'source', severity: 'error', status: 'broken',
        summary: `فایل ${rel} به ${match[1]} اشاره می‌کند اما مقصد در سورس پیدا نشد.`,
        evidence: [`${rel}:${text.slice(0, match.index).split('\n').length}`, match[1]],
        files: [rel], recommendation: 'import یا نام/مسیر فایل اصلاح شود.'
      });
    }
  }
}

export function runSiteAudit(): SiteAuditReport {
  const files: string[] = [];
  walk(path.join(ROOT, 'src'), files);
  for (const entry of ['server.ts', 'scripts']) {
    const target = path.join(ROOT, entry);
    if (!fs.existsSync(target)) continue;
    if (fs.statSync(target).isDirectory()) walk(target, files); else files.push(target);
  }

  const routes = buildRouteInventory(files);
  const findings: AuditFinding[] = [];
  scanDuplicateServerRoutes(routes, findings);
  scanPotentialUiApiMismatches(files, routes, findings);
  scanDangerMarkers(files, findings);
  scanExtensionWiring(files, findings);
  scanMissingReferencedFiles(files, findings);

  const summary = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    conflicts: findings.filter(f => f.status === 'conflict').length,
    broken: findings.filter(f => f.status === 'broken').length,
    partial: findings.filter(f => f.status === 'partial').length
  };

  return {
    generatedAt: new Date().toISOString(),
    coreVersion: getCoreVersion(),
    commit: getCommit(),
    scannedFiles: files.length,
    routeInventorySize: routes.length,
    summary,
    findings
  };
}
