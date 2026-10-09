import fs from 'node:fs';

const file = 'src/server/audit/site-audit.ts';
let source = fs.readFileSync(file, 'utf8');
if (source.includes("const ENGINE_VERSION = '2.1.0';") && source.includes('productionBundleVerified')) {
  console.log('Site Auditor v2.1.0 already applied.');
  process.exit(0);
}

const replaceOnce = (before, after, label) => {
  if (!source.includes(before)) throw new Error(`Site Auditor v2.1 patch marker missing: ${label}`);
  source = source.replace(before, after);
};

replaceOnce("import fs from 'node:fs';\nimport path from 'node:path';", "import fs from 'node:fs';\nimport path from 'node:path';\nimport { createHash } from 'node:crypto';", 'crypto import');
replaceOnce("const ENGINE_VERSION = '2.0.0';", "const ENGINE_VERSION = '2.1.0';", 'engine version');
replaceOnce(
  "    pipelineScripts: number;\n    pipelineTargets: number;\n    configKeys: number;",
  "    pipelineScripts: number;\n    pipelineTargets: number;\n    pipelineStages: number;\n    confirmedOverwrites: number;\n    preparedRouteInventory: number;\n    pipelineTraceAvailable: boolean;\n    productionBundleVerified: boolean;\n    configKeys: number;",
  'coverage fields'
);
replaceOnce(
  "    .replace(/\\/+/g, '/');\n  const escaped = declared",
  "    .replace(/\\/+/g, '/');\n  if (cleanActual.startsWith('/api/') && (declared === '*' || declared === '/*')) return false;\n  const escaped = declared",
  'api wildcard guard'
);

const apiHelper = fs.readFileSync('scripts/templates/site-audit-v210-api.ts.txt', 'utf8').trimEnd();
replaceOnce(
  'function extractApiCalls(files: string[]): ApiCallRef[] {',
  `${apiHelper}\n\nfunction extractApiCalls(files: string[]): ApiCallRef[] {`,
  'bounded api helper'
);
replaceOnce('const segment = text.slice(match.index, match.index + 1800);', 'const segment = sliceCallExpression(text, match.index);', 'fetch scope');
replaceOnce('const segment = text.slice(match.index, match.index + 1600);', 'const segment = sliceCallExpression(text, match.index);', 'axios scope');

const pipelineStart = source.indexOf('function pipelineFamily(rel: string) {');
const pipelineEnd = source.indexOf('\nfunction classifyConfigLayer', pipelineStart);
if (pipelineStart < 0 || pipelineEnd < 0) throw new Error('Site Auditor v2.1 patch marker missing: pipeline block');
const pipelineBlock = fs.readFileSync('scripts/templates/site-audit-v210-pipeline.ts.txt', 'utf8').trimEnd();
source = source.slice(0, pipelineStart) + pipelineBlock + '\n' + source.slice(pipelineEnd + 1);

const configStart = source.indexOf('function normalizeConfigKey(key: string) {');
const configEnd = source.indexOf('\nfunction summaryFor', configStart);
if (configStart < 0 || configEnd < 0) throw new Error('Site Auditor v2.1 patch marker missing: config block');
const configBlock = fs.readFileSync('scripts/templates/site-audit-v210-config.ts.txt', 'utf8').trimEnd();
source = source.slice(0, configStart) + configBlock + '\n' + source.slice(configEnd + 1);

replaceOnce(
  "  const routes = buildRouteInventory(files);\n  const apiCalls = extractApiCalls(files);",
  "  const pipelineTrace = readPipelineTrace();\n  const sourceRoutes = buildRouteInventory(files);\n  const preparedRoutes = Array.isArray(pipelineTrace?.prepared?.routes)\n    ? pipelineTrace.prepared.routes.filter((route: any) => route?.method && route?.route)\n    : [];\n  const routes = preparedRoutes.length ? preparedRoutes as RouteRef[] : sourceRoutes;\n  const apiCalls = extractApiCalls(files);",
  'prepared route inventory'
);
replaceOnce(
  "  const findings: AuditFinding[] = [];\n\n  scanDuplicateServerRoutes(routes, findings);",
  "  const findings: AuditFinding[] = [];\n  const productionBundleVerified = scanProductionBundleIntegrity(pipelineTrace, findings);\n\n  scanDuplicateServerRoutes(routes, findings);",
  'production bundle integrity scan'
);
replaceOnce('  const pipeline = scanPipelineConflicts(files, findings);', '  const pipeline = scanPipelineConflicts(files, findings, pipelineTrace);', 'trace pipeline scanner');
replaceOnce(
  "      pipelineScripts: pipeline.scripts,\n      pipelineTargets: pipeline.targets,\n      configKeys: new Set(configRefs.map(ref => ref.key)).size",
  "      pipelineScripts: pipeline.scripts,\n      pipelineTargets: pipeline.targets,\n      pipelineStages: pipeline.stages,\n      confirmedOverwrites: pipeline.overwrites,\n      preparedRouteInventory: preparedRoutes.length,\n      pipelineTraceAvailable: pipeline.traced,\n      productionBundleVerified,\n      configKeys: new Set(configRefs.map(ref => ref.key)).size",
  'coverage values'
);

fs.writeFileSync(file, source, 'utf8');
console.log('Applied Site Auditor v2.1.0: bounded API contracts, prepared-route inventory, trace-backed pipeline diffs, contextual schema drift, production bundle verification.');
