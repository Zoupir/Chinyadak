import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  TRACE_MANIFEST,
  appendTraceRecord,
  buildPreparedRouteInventory,
  diffSnapshots,
  getGitCommit,
  hashMap,
  readTraceRecords,
  snapshotTrackedFiles
} from './pipeline-trace-lib.mjs';
import { buildPreparedApiInventory, buildPreparedConfigInventory } from './prepared-audit-inventory.mjs';
import { analyzePipelineReverts } from './pipeline-overwrite-analysis.mjs';

const root = process.cwd();
const commit = getGitCommit(root);
const traceDir = path.join(root, 'tmp');
const traceFile = path.join(traceDir, `.audit-pipeline-trace-${process.pid}.jsonl`);
const manifestPath = path.join(root, TRACE_MANIFEST);
fs.mkdirSync(traceDir, { recursive: true });
try { fs.rmSync(traceFile, { force: true }); } catch {}

const baseline = snapshotTrackedFiles(root);
const hookUrl = pathToFileURL(path.join(root, 'scripts/pipeline-trace-hook.mjs')).href;
const existingNodeOptions = String(process.env.NODE_OPTIONS || '').trim();
const nodeOptions = `${existingNodeOptions}${existingNodeOptions ? ' ' : ''}--import=${hookUrl}`;

const topLevelScripts = [
  { script: 'scripts/prepare-v30108.mjs', kind: 'orchestrator' },
  { script: 'scripts/prepare-extension-platform.mjs', kind: 'stage' },
  { script: 'scripts/apply-site-auditor-v210.mjs', kind: 'stage' },
  { script: 'scripts/prepare-v301013-cms-adapter.mjs', kind: 'stage' },
  { script: 'scripts/apply-v301013-richtext-live-editor-v3.mjs', kind: 'stage' },
  { script: 'scripts/repair-v301013-discard-preview.mjs', kind: 'stage' }
];

for (const item of topLevelScripts) {
  const before = snapshotTrackedFiles(root);
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [item.script], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      YADAK_PIPELINE_TRACE_FILE: traceFile,
      YADAK_PIPELINE_TRACE_DEPTH: '0'
    }
  });
  const endedAt = new Date().toISOString();
  const after = snapshotTrackedFiles(root);
  appendTraceRecord(traceFile, {
    kind: item.kind,
    script: item.script,
    family: path.basename(item.script).split('-')[0],
    depth: 0,
    startedAt,
    endedAt,
    status: result.status ?? 0,
    changes: diffSnapshots(before, after)
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const prepared = snapshotTrackedFiles(root);
const sourceDelta = diffSnapshots(baseline, prepared);
const stages = readTraceRecords(traceFile);
const { confirmedOverwrites, normalizationReverts } = analyzePipelineReverts(stages);
const changedStageCount = stages.filter(stage => stage.kind === 'stage' && stage.changes?.length).length;
const changedFiles = [...new Set(stages.flatMap(stage => (stage.changes || []).map(change => change.file)))];
const preparedRoutes = buildPreparedRouteInventory(root);
const preparedApiCalls = buildPreparedApiInventory(root);
const preparedConfigRefs = buildPreparedConfigInventory(root);
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit,
  baselineKind: 'git-checkout-before-prepare',
  canonical: { fileHashes: hashMap(baseline) },
  prepared: { fileHashes: hashMap(prepared), routes: preparedRoutes, apiCalls: preparedApiCalls, configRefs: preparedConfigRefs },
  sourceDelta,
  stages,
  confirmedOverwrites,
  normalizationReverts,
  summary: {
    executedStages: stages.filter(stage => stage.kind === 'stage').length,
    changedStages: changedStageCount,
    changedFiles: changedFiles.length,
    sourceDeltaFiles: sourceDelta.length,
    preparedRoutes: preparedRoutes.length,
    preparedApiCalls: preparedApiCalls.length,
    preparedConfigRefs: preparedConfigRefs.length,
    confirmedOverwrites: confirmedOverwrites.length,
    intentionalNormalizations: normalizationReverts.length
  }
};

let keepExisting = false;
try {
  const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (existing?.commit && existing.commit === commit && Number(existing?.summary?.sourceDeltaFiles || 0) > Number(manifest.summary.sourceDeltaFiles || 0)) keepExisting = true;
} catch {}

if (keepExisting) {
  console.log('Pipeline trace: preserved earlier canonical→prepared trace for this commit.');
} else {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Pipeline trace: ${manifest.summary.executedStages} stages, ${manifest.summary.changedFiles} changed files, ${manifest.summary.confirmedOverwrites} confirmed conflicts, ${manifest.summary.intentionalNormalizations} intentional normalization reverts; prepared inventory routes=${preparedRoutes.length}, apiCalls=${preparedApiCalls.length}, configRefs=${preparedConfigRefs.length}.`);
}
try { fs.rmSync(traceFile, { force: true }); } catch {}
