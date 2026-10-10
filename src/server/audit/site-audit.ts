import fs from 'node:fs';
import path from 'node:path';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditStatus = 'working' | 'partial' | 'broken' | 'conflict' | 'unknown';
export type AuditCategory =
  | 'runtime'
  | 'routing'
  | 'ui'
  | 'api'
  | 'config'
  | 'source'
  | 'extension'
  | 'pipeline'
  | 'contract';

export interface AuditFinding {
  id: string;
  title: string;
  category: AuditCategory;
  severity: AuditSeverity;
  status: AuditStatus;
  summary: string;
  evidence: string[];
  likelyCause?: string;
  files?: string[];
  recommendation?: string;
}

export interface SiteAuditReport {
  engineVersion: string;
  generatedAt: string;
  coreVersion: string;
  commit: string | null;
  scannedFiles: number;
  routeInventorySize: number;
  coverage: {
    sourceFiles: number;
    routeInventory: number;
    uiApiCalls: number;
    pipelineScripts: number;
    pipelineTargets: number;
    configKeys: number;
  };
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
type ApiCallRef = { method: string; route: string; file: string; line: number; bodyKeys: string[] };
type ConfigRef = { key: string; file: string; line: number; layer: 'editor' | 'renderer' };

const ROOT = process.cwd();
const ENGINE_VERSION = '2.0.0';
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'tmp', 'var', 'uploads', 'coverage']);
const MAX_FILE_BYTES = 768 * 1024;
const MAX_FILES = 2200;
const GENERIC_CONFIG_KEYS = new Set([
  'id', 'key', 'name', 'type', 'title', 'label', 'value', 'data', 'items', 'children',
  'className', 'style', 'status', 'enabled', 'order', 'slug', 'url'
]);

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

function lineAt(text: string, index: number) {
  return text.slice(0, index).split('\n').length;
}

function walk(dir: string, out: string[]) {
  if (out.length >= MAX_FILES) return;
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
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
  } catch {
    return 'unknown';
  }
}

function getCommit() {
  try {
    const buildFile = path.join(ROOT, 'BUILD_COMMIT');
    if (fs.existsSync(buildFile)) {
      const value = fs.readFileSync(buildFile, 'utf8').trim();
      if (/^[0-9a-f]{7,40}$/i.test(value)) return value;
    }
  } catch {}

  try {
    const gitDir = path.join(ROOT, '.git');
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    if (/^[0-9a-f]{40}$/i.test(head)) return head;
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5).trim();
      const refFile = path.join(gitDir, ref);
      if (fs.existsSync(refFile)) {
        const value = fs.readFileSync(refFile, 'utf8').trim();
        if (/^[0-9a-f]{40}$/i.test(value)) return value;
      }
      const packed = readUtf8(path.join(gitDir, 'packed-refs')) || '';
      const match = packed.split('\n').find(line => line.endsWith(` ${ref}`));
      const value = match?.split(' ')[0] || '';
      if (/^[0-9a-f]{40}$/i.test(value)) return value;
    }
  } catch {}

  return null;
}

function add(findings: AuditFinding[], finding: AuditFinding) {
  if (!findings.some(item => item.id === finding.id)) findings.push(finding);
}

function joinRoute(prefix: string, route: string) {
  const value = `${prefix.replace(/\/$/, '')}/${route.replace(/^\//, '')}`.replace(/\/+/g, '/');
  return value || '/';
}

function routeMatches(actual: string, declared: string) {
  const cleanActual = actual
    .replace(/\?.*$/, '')
    .replace(/\$\{[^}]+\}/g, 'value')
    .replace(/\/+/g, '/');
  const escaped = declared
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[A-Za-z0-9_]+/g, '[^/]+')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}/?$`).test(cleanActual);
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
    routes.push({
      method: match[1].toUpperCase(),
      route: match[2],
      file: 'server.ts',
      line: lineAt(server, match.index)
    });
  }

  const routerRegex = /\b[A-Za-z0-9_]*Router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    const rel = relative(file);
    const prefix = mountBySource.get(rel);
    if (!prefix) continue;
    const text = readUtf8(file);
    if (!text) continue;
    routerRegex.lastIndex = 0;
    while ((match = routerRegex.exec(text))) {
      routes.push({
        method: match[1].toUpperCase(),
        route: joinRoute(prefix, match[2]),
        file: rel,
        line: lineAt(text, match.index)
      });
    }
  }
  return routes;
}

function extractObjectKeys(text: string) {
  const out = new Set<string>();
  const objectMatch = text.match(/\{([\s\S]{0,1400}?)\}/);
  if (!objectMatch) return out;
  const keyRegex = /(?:^|[,{\s])([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = keyRegex.exec(objectMatch[1])) && out.size < 40) out.add(match[1]);
  return out;
}

function extractApiCalls(files: string[]): ApiCallRef[] {
  const calls: ApiCallRef[] = [];
  const fetchRegex = /\b(fetch|apiFetch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const axiosRegex = /\baxios\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;

  for (const file of files) {
    const rel = relative(file);
    if (!rel.startsWith('src/') || rel.startsWith('src/server/')) continue;
    const text = readUtf8(file);
    if (!text) continue;
    let match: RegExpExecArray | null;

    fetchRegex.lastIndex = 0;
    while ((match = fetchRegex.exec(text))) {
      const route = match[2];
      if (!route.startsWith('/api/')) continue;
      const segment = text.slice(match.index, match.index + 1800);
      const method = segment.match(/\bmethod\s*:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/i)?.[1]?.toUpperCase() || 'GET';
      const bodyMatch = segment.match(/\bbody\s*:\s*JSON\.stringify\s*\(([\s\S]{0,1200}?)\)/);
      calls.push({
        method,
        route,
        file: rel,
        line: lineAt(text, match.index),
        bodyKeys: bodyMatch ? [...extractObjectKeys(bodyMatch[1])] : []
      });
    }

    axiosRegex.lastIndex = 0;
    while ((match = axiosRegex.exec(text))) {
      const route = match[2];
      if (!route.startsWith('/api/')) continue;
      const segment = text.slice(match.index, match.index + 1600);
      calls.push({
        method: match[1].toUpperCase(),
        route,
        file: rel,
        line: lineAt(text, match.index),
        bodyKeys: ['POST', 'PUT', 'PATCH'].includes(match[1].toUpperCase())
          ? [...extractObjectKeys(segment.slice(segment.indexOf(',') + 1))]
          : []
      });
    }
  }
  return calls;
}

function scanDuplicateServerRoutes(routes: RouteRef[], findings: AuditFinding[]) {
  const seen = new Map<string, RouteRef[]>();
  for (const ref of routes) {
    const key = `${ref.method} ${ref.route}`;
    const refs = seen.get(key) || [];
    refs.push(ref);
    seen.set(key, refs);
  }
  for (const [route, refs] of seen) {
    if (refs.length < 2) continue;
    add(findings, {
      id: `duplicate-route:${route}`,
      title: `تعریف تکراری Route: ${route}`,
      category: 'routing',
      severity: 'error',
      status: 'conflict',
      summary: 'یک endpoint کامل بیش از یک‌بار تعریف شده و ترتیب mount می‌تواند رفتار متفاوت ایجاد کند.',
      evidence: refs.map(ref => `${ref.file}:${ref.line}`),
      files: [...new Set(refs.map(ref => ref.file))],
      likelyCause: 'دو بخش Core مسئولیت یک endpoint یکسان را گرفته‌اند.',
      recommendation: 'مالک endpoint یکی شود یا مسیرها/متدها تفکیک شوند.'
    });
  }
}

function scanUiApiContracts(calls: ApiCallRef[], routes: RouteRef[], findings: AuditFinding[]) {
  for (const call of calls) {
    const pathMatches = routes.filter(route => routeMatches(call.route, route.route));
    if (!pathMatches.length) {
      add(findings, {
        id: `ui-api-unmatched:${call.method}:${call.route}:${call.file}:${call.line}`,
        title: `فراخوانی UI بدون endpoint منطبق: ${call.method} ${call.route}`,
        category: 'api',
        severity: 'warning',
        status: 'partial',
        summary: 'کد سمت کاربر این API را صدا می‌زند اما در inventory مسیرهای server endpoint منطبق پیدا نشد.',
        evidence: [`${call.file}:${call.line}`],
        files: [call.file],
        likelyCause: 'endpoint حذف/rename شده، UI قدیمی مانده یا مسیر در سرور به‌صورت غیرliteral ثبت شده است.',
        recommendation: 'contract فراخوانی با Route واقعی سرور تطبیق داده شود و برای endpoint دینامیک تست صریح اضافه شود.'
      });
      continue;
    }

    if (!pathMatches.some(route => route.method === call.method)) {
      add(findings, {
        id: `ui-api-method:${call.method}:${call.route}:${call.file}:${call.line}`,
        title: `عدم تطابق Method بین UI و API: ${call.route}`,
        category: 'contract',
        severity: 'error',
        status: 'conflict',
        summary: `UI از ${call.method} استفاده می‌کند اما سرور برای این مسیر متدهای ${[...new Set(pathMatches.map(r => r.method))].join(', ')} را ثبت کرده است.`,
        evidence: [
          `${call.file}:${call.line}`,
          ...pathMatches.map(route => `${route.method} ${route.route} @ ${route.file}:${route.line}`)
        ],
        files: [...new Set([call.file, ...pathMatches.map(route => route.file)])],
        likelyCause: 'قرارداد frontend/backend در یکی از refactorها از هم جدا شده است.',
        recommendation: 'Method و payload سمت UI با route رسمی سرور یکسان شود.'
      });
    }
  }
}

function requestBodyKeysForRoute(route: RouteRef) {
  const text = readUtf8(path.join(ROOT, route.file)) || '';
  if (!text) return new Set<string>();
  const marker = route.route.split('/').filter(Boolean).pop() || route.route;
  const start = Math.max(0, text.indexOf(marker) - 200);
  const segment = text.slice(start, start + 4200);
  const keys = new Set<string>();
  let match: RegExpExecArray | null;
  const dotRegex = /req\.body(?:\?\.)?\.([A-Za-z_][A-Za-z0-9_]*)/g;
  while ((match = dotRegex.exec(segment))) keys.add(match[1]);
  const destructure = segment.match(/\{([^}]{0,900})\}\s*=\s*req\.body/);
  if (destructure) {
    const keyRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
    while ((match = keyRegex.exec(destructure[1]))) {
      if (!['const', 'let', 'var'].includes(match[1])) keys.add(match[1]);
    }
  }
  return keys;
}

function scanRequestBodyContracts(calls: ApiCallRef[], routes: RouteRef[], findings: AuditFinding[]) {
  for (const call of calls) {
    if (!call.bodyKeys.length || !['POST', 'PUT', 'PATCH'].includes(call.method)) continue;
    const route = routes.find(ref => ref.method === call.method && routeMatches(call.route, ref.route));
    if (!route) continue;
    const accepted = requestBodyKeysForRoute(route);
    if (!accepted.size) continue;
    const unknown = call.bodyKeys.filter(key => !accepted.has(key));
    if (!unknown.length) continue;
    add(findings, {
      id: `body-contract:${call.method}:${call.route}:${call.file}:${call.line}`,
      title: `ریسک اختلاف payload بین UI و API: ${call.route}`,
      category: 'contract',
      severity: 'warning',
      status: 'unknown',
      summary: `UI کلیدهای ${unknown.join(', ')} را ارسال می‌کند اما استفاده‌ای از آن‌ها در handler منطبق پیدا نشد.`,
      evidence: [
        `${call.file}:${call.line}`,
        `${route.file}:${route.line}`,
        `UI keys: ${call.bodyKeys.join(', ')}`,
        `Server observed keys: ${[...accepted].join(', ')}`
      ],
      files: [call.file, route.file],
      likelyCause: 'نام فیلدها تغییر کرده یا handler از schema/helper دیگری استفاده می‌کند.',
      recommendation: 'قبل از اصلاح، schema/validator مربوط به endpoint بررسی شود؛ در صورت نبود، نام فیلد frontend و backend همسان شود.'
    });
  }
}

function scanDangerMarkers(files: string[], findings: AuditFinding[]) {
  const patterns: Array<[RegExp, string, string, AuditSeverity]> = [
    [/\bTODO\b|\bFIXME\b/g, 'نشانگر کار نیمه‌تمام', 'وجود TODO/FIXME در کد اجرایی می‌تواند نشان‌دهنده قابلیت ناقص باشد.', 'warning'],
    [/catch\s*\([^)]*\)\s*\{\s*\}/g, 'خطای بلعیده‌شده', 'یک catch خالی پیدا شد؛ خطا ممکن است در UI مخفی بماند و فقط رفتار ناقص دیده شود.', 'error']
  ];

  for (const file of files) {
    const rel = relative(file);
    if (
      rel.startsWith('scripts/') ||
      rel.startsWith('src/server/audit/') ||
      rel.startsWith('extensions/site-auditor/')
    ) continue;
    const text = readUtf8(file);
    if (!text) continue;

    for (const [regex, title, summary, severity] of patterns) {
      regex.lastIndex = 0;
      const hits: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) && hits.length < 8) hits.push(lineAt(text, match.index));
      if (!hits.length) continue;
      add(findings, {
        id: `${title}:${rel}`,
        title: `${title} در ${rel}`,
        category: 'source',
        severity,
        status: severity === 'error' ? 'partial' : 'unknown',
        summary,
        evidence: [...new Set(hits)].map(line => `${rel}:${line}`),
        files: [rel],
        recommendation: severity === 'error'
          ? 'خطا ثبت، قابل مشاهده و به نتیجه مشخص در UI تبدیل شود.'
          : 'TODO/FIXME تعیین تکلیف یا به issue/test قابل ردیابی تبدیل شود.'
      });
    }
  }
}

function scanNoOpUi(files: string[], findings: AuditFinding[]) {
  const patterns: Array<[RegExp, string, string]> = [
    [/on(?:Click|Submit|Change)\s*=\s*\{\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)?\s*=>\s*\{\s*\}\s*\}/g, 'handler خالی در UI', 'یک event handler عملاً هیچ کاری انجام نمی‌دهد.'],
    [/href\s*=\s*["']#["']/g, 'لینک placeholder در UI', 'لینکی با href="#" در سورس اجرایی باقی مانده است.']
  ];
  for (const file of files) {
    const rel = relative(file);
    if (!/\.(?:tsx|jsx)$/.test(rel) || rel.includes('/site-auditor/')) continue;
    const text = readUtf8(file);
    if (!text) continue;
    for (const [regex, title, summary] of patterns) {
      regex.lastIndex = 0;
      const lines: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) && lines.length < 8) lines.push(lineAt(text, match.index));
      if (!lines.length) continue;
      add(findings, {
        id: `noop:${title}:${rel}`,
        title: `${title} در ${rel}`,
        category: 'ui',
        severity: 'warning',
        status: 'partial',
        summary,
        evidence: [...new Set(lines)].map(line => `${rel}:${line}`),
        files: [rel],
        likelyCause: 'کنترل UI ساخته شده ولی behavior نهایی وصل نشده یا placeholder باقی مانده است.',
        recommendation: 'کنترل به action واقعی متصل یا از UI حذف شود.'
      });
    }
  }
}

function scanExtensionWiring(files: string[], findings: AuditFinding[]) {
  const runtime = readUtf8(path.join(ROOT, 'src/extensions/runtime.ts')) || '';
  if (!/registerHook|registerAdminMenu|registerSection/.test(runtime)) return;
  const corpus = files.map(file => readUtf8(file) || '').join('\n');
  for (const token of ['ExtensionSlot', 'ExtensionSectionQuickAdd', 'AdminExtensionPageHost']) {
    if (corpus.includes(token)) continue;
    add(findings, {
      id: `extension-wiring:${token}`,
      title: `اتصال ناقص Extension Platform: ${token}`,
      category: 'extension',
      severity: 'warning',
      status: 'partial',
      summary: `زیرساخت افزونه وجود دارد اما استفاده از ${token} در سورس پیدا نشد.`,
      evidence: ['src/extensions/runtime.ts'],
      files: ['src/extensions/runtime.ts'],
      recommendation: 'نقطه اتصال افزونه به UI/Core بررسی شود تا API ثبت‌شده واقعاً استفاده شود.'
    });
  }
}

function scanMissingReferencedFiles(files: string[], findings: AuditFinding[]) {
  const importRegex = /(?:from\s*|import\s*\()['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const file of files) {
    const rel = relative(file);
    if (!rel.startsWith('src/')) continue;
    const text = readUtf8(file);
    if (!text) continue;
    importRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text))) {
      const base = path.resolve(path.dirname(file), match[1]);
      const candidates = [
        base,
        ...[...SOURCE_EXTENSIONS].map(ext => `${base}${ext}`),
        ...[...SOURCE_EXTENSIONS].map(ext => path.join(base, `index${ext}`))
      ];
      if (candidates.some(candidate => fs.existsSync(candidate))) continue;
      add(findings, {
        id: `missing-import:${rel}:${match[1]}`,
        title: 'Import محلی بدون فایل مقصد',
        category: 'source',
        severity: 'error',
        status: 'broken',
        summary: `فایل ${rel} به ${match[1]} اشاره می‌کند اما مقصد در سورس پیدا نشد.`,
        evidence: [`${rel}:${lineAt(text, match.index)}`, match[1]],
        files: [rel],
        recommendation: 'import یا نام/مسیر فایل اصلاح شود.'
      });
    }
  }
}

function pipelineFamily(rel: string) {
  const name = path.basename(rel);
  if (name.startsWith('prepare-')) return 'prepare';
  if (name.startsWith('apply-')) return 'apply';
  if (name.startsWith('repair-')) return 'repair';
  return null;
}

function scanPipelineConflicts(files: string[], findings: AuditFinding[]) {
  const targetMap = new Map<string, Array<{ script: string; family: string }>>();
  const scriptSet = new Set<string>();

  for (const file of files) {
    const rel = relative(file);
    const family = pipelineFamily(rel);
    if (!family || !rel.startsWith('scripts/')) continue;
    const text = readUtf8(file);
    if (!text || !/(writeFile|copyFile|rename|replace\(|patch)/.test(text)) continue;
    scriptSet.add(rel);

    const literalRegex = /['"`]((?:src\/[^'"`\n]+|server\.ts|package\.json))['"`]/g;
    let match: RegExpExecArray | null;
    const targets = new Set<string>();
    while ((match = literalRegex.exec(text)) && targets.size < 80) {
      const target = match[1].replaceAll('\\', '/');
      if (/\.(?:ts|tsx|js|jsx|json|mjs|cjs)$/.test(target)) targets.add(target);
    }
    for (const target of targets) {
      const refs = targetMap.get(target) || [];
      refs.push({ script: rel, family });
      targetMap.set(target, refs);
    }
  }

  let emitted = 0;
  for (const [target, refs] of targetMap) {
    const families = new Set(refs.map(ref => ref.family));
    const scripts = [...new Set(refs.map(ref => ref.script))];
    if (families.size < 2 || scripts.length < 2 || emitted >= 35) continue;
    emitted += 1;
    add(findings, {
      id: `pipeline-overlap:${target}`,
      title: `چند مرحله migration یک فایل را تغییر می‌دهند: ${target}`,
      category: 'pipeline',
      severity: 'warning',
      status: 'conflict',
      summary: `${scripts.length} اسکریپت از خانواده‌های ${[...families].join(', ')} به این فایل اشاره کرده و عملیات تغییر محتوا دارند.`,
      evidence: scripts,
      files: [...scripts, target],
      likelyCause: 'migrationهای متوالی ممکن است تغییر مرحله قبل را overwrite کنند یا رفتار نسخه‌های مختلف را روی هم نگه دارند.',
      recommendation: 'ترتیب اجرای این اسکریپت‌ها و markerهای idempotency بررسی و خروجی نهایی فایل با source canonical مقایسه شود.'
    });
  }

  return { scripts: scriptSet.size, targets: targetMap.size };
}

function classifyConfigLayer(rel: string): 'editor' | 'renderer' | null {
  const name = path.basename(rel);
  if (/(Admin|Editor|Modal|Composer|Settings|Form)/i.test(name) || /\/admin\//i.test(rel)) return 'editor';
  if (/(View|Section|Card|Hero|Banner|Header|Footer)/i.test(name) && /\.(?:tsx|jsx)$/.test(rel)) return 'renderer';
  return null;
}

function extractConfigRefs(files: string[]) {
  const refs: ConfigRef[] = [];
  const accessRegex = /\b(?:config|form|draft|settings|section\.config)\??\.([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const file of files) {
    const rel = relative(file);
    if (!rel.startsWith('src/') || rel.startsWith('src/server/')) continue;
    const layer = classifyConfigLayer(rel);
    if (!layer) continue;
    const text = readUtf8(file);
    if (!text) continue;
    let match: RegExpExecArray | null;
    accessRegex.lastIndex = 0;
    while ((match = accessRegex.exec(text)) && refs.length < 8000) {
      if (GENERIC_CONFIG_KEYS.has(match[1]) || match[1].length < 4) continue;
      refs.push({ key: match[1], file: rel, line: lineAt(text, match.index), layer });
    }
  }
  return refs;
}

function normalizeConfigKey(key: string) {
  return key
    .replace(/^(container|section|banner|image|desktop|mobile|layout|content)/i, '')
    .replace(/(Value|Setting|Option)$/i, '')
    .toLowerCase();
}

function scanConfigSchemaDrift(refs: ConfigRef[], findings: AuditFinding[]) {
  const editor = new Map<string, ConfigRef[]>();
  const renderer = new Map<string, ConfigRef[]>();
  for (const ref of refs) {
    const map = ref.layer === 'editor' ? editor : renderer;
    const list = map.get(ref.key) || [];
    list.push(ref);
    map.set(ref.key, list);
  }

  const rendererKeys = [...renderer.keys()];
  let emitted = 0;
  for (const [editorKey, editorRefs] of editor) {
    if (renderer.has(editorKey)) continue;
    const normalized = normalizeConfigKey(editorKey);
    if (normalized.length < 4) continue;
    const aliases = rendererKeys.filter(key => {
      if (key === editorKey) return false;
      const other = normalizeConfigKey(key);
      return other === normalized || (other.length >= 5 && (other.includes(normalized) || normalized.includes(other)));
    });
    if (!aliases.length || emitted >= 30) continue;
    emitted += 1;
    const aliasRefs = aliases.flatMap(key => renderer.get(key) || []).slice(0, 8);
    add(findings, {
      id: `schema-drift:${editorKey}:${aliases.join('|')}`,
      title: `احتمال Schema Drift بین Editor و Renderer: ${editorKey}`,
      category: 'config',
      severity: 'warning',
      status: 'unknown',
      summary: `Editor کلید "${editorKey}" را استفاده می‌کند اما Renderer کلید مشابه ${aliases.map(k => `"${k}"`).join(', ')} را می‌خواند.`,
      evidence: [
        ...editorRefs.slice(0, 5).map(ref => `Editor ${ref.file}:${ref.line}`),
        ...aliasRefs.map(ref => `Renderer ${ref.file}:${ref.line}`)
      ],
      files: [...new Set([...editorRefs, ...aliasRefs].map(ref => ref.file))],
      likelyCause: 'نام property در یکی از لایه‌ها تغییر کرده ولی migration یا renderer/editor هم‌زمان به‌روزرسانی نشده است.',
      recommendation: 'schema ذخیره‌شده، payload API و property مصرف‌شده در renderer با هم مقایسه شوند؛ اگر alias رسمی نیست یک نام canonical انتخاب شود.'
    });
  }
}

function summaryFor(findings: AuditFinding[]) {
  return {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    conflicts: findings.filter(f => f.status === 'conflict').length,
    broken: findings.filter(f => f.status === 'broken').length,
    partial: findings.filter(f => f.status === 'partial').length
  };
}

export function runSiteAudit(): SiteAuditReport {
  const files: string[] = [];
  walk(path.join(ROOT, 'src'), files);
  for (const entry of ['server.ts', 'scripts']) {
    const target = path.join(ROOT, entry);
    if (!fs.existsSync(target)) continue;
    if (fs.statSync(target).isDirectory()) walk(target, files);
    else files.push(target);
  }

  const routes = buildRouteInventory(files);
  const apiCalls = extractApiCalls(files);
  const configRefs = extractConfigRefs(files);
  const findings: AuditFinding[] = [];

  scanDuplicateServerRoutes(routes, findings);
  scanUiApiContracts(apiCalls, routes, findings);
  scanRequestBodyContracts(apiCalls, routes, findings);
  scanDangerMarkers(files, findings);
  scanNoOpUi(files, findings);
  scanExtensionWiring(files, findings);
  scanMissingReferencedFiles(files, findings);
  const pipeline = scanPipelineConflicts(files, findings);
  scanConfigSchemaDrift(configRefs, findings);

  return {
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    coreVersion: getCoreVersion(),
    commit: getCommit(),
    scannedFiles: files.length,
    routeInventorySize: routes.length,
    coverage: {
      sourceFiles: files.length,
      routeInventory: routes.length,
      uiApiCalls: apiCalls.length,
      pipelineScripts: pipeline.scripts,
      pipelineTargets: pipeline.targets,
      configKeys: new Set(configRefs.map(ref => ref.key)).size
    },
    summary: summaryFor(findings),
    findings
  };
}
