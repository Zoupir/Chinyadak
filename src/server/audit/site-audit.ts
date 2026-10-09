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

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'tmp', 'var', 'uploads', 'coverage']);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 1600;

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

function scanDuplicateServerRoutes(files: string[], findings: AuditFinding[]) {
  const seen = new Map<string, Array<{ file: string; line: number }>>();
  const routeRegex = /\b(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    const text = readUtf8(file); if (!text) continue;
    let match: RegExpExecArray | null;
    while ((match = routeRegex.exec(text))) {
      const key = `${match[1].toUpperCase()} ${match[2]}`;
      const line = text.slice(0, match.index).split('\n').length;
      const arr = seen.get(key) || [];
      arr.push({ file: relative(file), line });
      seen.set(key, arr);
    }
  }
  for (const [route, refs] of seen) {
    if (refs.length < 2) continue;
    add(findings, {
      id: `duplicate-route:${route}`,
      title: `تعریف تکراری Route: ${route}`,
      category: 'routing', severity: 'error', status: 'conflict',
      summary: 'یک مسیر سرور بیش از یک‌بار تعریف شده و ترتیب mount می‌تواند باعث رفتار متفاوت یا غیرقابل‌پیش‌بینی شود.',
      evidence: refs.map(ref => `${ref.file}:${ref.line}`),
      files: [...new Set(refs.map(ref => ref.file))],
      likelyCause: 'Route یا middleware مشابه در چند ماژول ثبت شده است.',
      recommendation: 'یک مالک واحد برای route تعیین و تعریف‌های تکراری حذف یا با prefix مجزا ثبت شوند.'
    });
  }
}

function scanPotentialUiApiMismatches(files: string[], findings: AuditFinding[]) {
  const apiRefs = new Map<string, Set<string>>();
  const serverRoutes = new Set<string>();
  const routeRegex = /\b(?:app|router)\.(?:get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const fetchRegex = /(?:fetch|apiFetch|axios\.(?:get|post|put|patch|delete))\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    const text = readUtf8(file); if (!text) continue;
    let m: RegExpExecArray | null;
    while ((m = routeRegex.exec(text))) if (m[1].startsWith('/api/')) serverRoutes.add(m[1]);
    while ((m = fetchRegex.exec(text))) {
      if (!m[1].startsWith('/api/')) continue;
      const refs = apiRefs.get(m[1]) || new Set<string>();
      refs.add(relative(file)); apiRefs.set(m[1], refs);
    }
  }
  for (const [api, refs] of apiRefs) {
    const normalized = api.replace(/\?.*$/, '');
    const probable = [...serverRoutes].some(route => normalized === route || normalized.startsWith(`${route}/`) || route.includes(':'));
    if (probable) continue;
    add(findings, {
      id: `ui-api-unmatched:${api}`,
      title: `فراخوانی UI بدون Route واضح: ${api}`,
      category: 'api', severity: 'warning', status: 'partial',
      summary: 'کد کاربری این API را فراخوانی می‌کند اما در اسکن routeهای سرور، تعریف مستقیم و واضحی برای آن پیدا نشد.',
      evidence: [...refs], files: [...refs],
      likelyCause: 'ممکن است endpoint حذف/تغییرنام شده باشد، از router دینامیک استفاده شود، یا UI هنوز به مسیر قدیمی اشاره کند.',
      recommendation: 'endpoint واقعی و پاسخ آن با UI تطبیق داده شود و در صورت مسیر دینامیک، به allowlist ممیزی اضافه شود.'
    });
  }
}

function scanDangerMarkers(files: string[], findings: AuditFinding[]) {
  const patterns: Array<[RegExp, string, string, AuditSeverity]> = [
    [/TODO\b|FIXME\b/g, 'نشانگر کار نیمه‌تمام', 'وجود TODO/FIXME در کد اجرایی می‌تواند نشان‌دهنده قابلیت ناقص باشد.', 'warning'],
    [/catch\s*\([^)]*\)\s*\{\s*\}/g, 'خطای بلعیده‌شده', 'یک catch خالی پیدا شد؛ خطا ممکن است در UI مخفی بماند و فقط رفتار ناقص دیده شود.', 'error'],
    [/console\.error\s*\(/g, 'مسیر خطای runtime', 'مسیر صریح console.error وجود دارد؛ باید با telemetry/diagnostics و UI خطا هم‌راستا باشد.', 'info'],
  ];
  for (const file of files) {
    const text = readUtf8(file); if (!text) continue;
    for (const [regex, title, summary, severity] of patterns) {
      regex.lastIndex = 0;
      const hits: number[] = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) && hits.length < 8) hits.push(text.slice(0, m.index).split('\n').length);
      if (!hits.length) continue;
      add(findings, {
        id: `${title}:${relative(file)}`,
        title: `${title} در ${relative(file)}`,
        category: 'source', severity, status: severity === 'error' ? 'partial' : 'unknown',
        summary, evidence: hits.map(line => `${relative(file)}:${line}`), files: [relative(file)],
        recommendation: severity === 'error' ? 'خطا ثبت، قابل مشاهده و به یک نتیجه مشخص در UI تبدیل شود.' : undefined
      });
    }
  }
}

function scanExtensionWiring(files: string[], findings: AuditFinding[]) {
  const runtime = readUtf8(path.join(ROOT, 'src/extensions/runtime.ts')) || '';
  const declared = [...runtime.matchAll(/registerHook|runHook|registerAdminMenu|registerSection/g)].map(m => m[0]);
  if (!declared.length) return;
  const corpus = files.map(file => readUtf8(file) || '').join('\n');
  for (const token of ['ExtensionSlot', 'ExtensionSectionQuickAdd', 'AdminExtensionPageHost']) {
    if (!corpus.includes(token)) {
      add(findings, {
        id: `extension-wiring:${token}`,
        title: `اتصال ناقص Extension Platform: ${token}`,
        category: 'extension', severity: 'warning', status: 'partial',
        summary: `زیرساخت افزونه وجود دارد اما استفاده از ${token} در سورس پیدا نشد.`,
        evidence: ['src/extensions/runtime.ts'], files: ['src/extensions/runtime.ts'],
        recommendation: 'نقطه اتصال افزونه به UI/Core بررسی شود تا API ثبت‌شده واقعاً در محصول استفاده شود.'
      });
    }
  }
}

export function runSiteAudit(): SiteAuditReport {
  const files: string[] = [];
  walk(path.join(ROOT, 'src'), files);
  for (const entry of ['server.ts', 'scripts']) {
    const target = path.join(ROOT, entry);
    if (fs.existsSync(target)) {
      if (fs.statSync(target).isDirectory()) walk(target, files);
      else files.push(target);
    }
  }

  const findings: AuditFinding[] = [];
  scanDuplicateServerRoutes(files, findings);
  scanPotentialUiApiMismatches(files, findings);
  scanDangerMarkers(files, findings);
  scanExtensionWiring(files, findings);

  const summary = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    conflicts: findings.filter(f => f.status === 'conflict').length,
    broken: findings.filter(f => f.status === 'broken').length,
    partial: findings.filter(f => f.status === 'partial').length,
  };

  return { generatedAt: new Date().toISOString(), coreVersion: getCoreVersion(), commit: getCommit(), summary, findings };
}
