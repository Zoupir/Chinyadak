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

const readPreparedText = rel => {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return ''; }
};

const buildPreparedContracts = () => {
  const pageView = readPreparedText('src/components/page/PageView.tsx');
  const richCss = readPreparedText('src/components/common/RichTextEditor.css');
  const richContent = readPreparedText('src/components/common/RichTextContent.tsx');
  const richUtil = readPreparedText('src/utils/richText.ts');
  const richEditor = readPreparedText('src/components/common/RichTextEditor.tsx');
  const store = readPreparedText('src/context/StoreContext.tsx');
  const cms = readPreparedText('src/server/routes/cms.ts');
  const footer = readPreparedText('src/components/layout/Footer.tsx');
  const liveModal = readPreparedText('src/components/common/LiveSectionModal.tsx');
  return {
    richTextPageRenderer: pageView.includes('<RichTextContent content={section.content}'),
    richTextCssParity: richCss.includes('STOREFRONT-RICH-TEXT-PARITY-v301013'),
    richTextRuntimeProbe: richContent.includes('data-rich-text-content="1"'),
    richTextPrioritySanitizer: richUtil.includes('RICH-TEXT-STYLE-FIDELITY-v301015'),
    richTextCanonicalHtml: richEditor.includes('RICH-TEXT-CANONICAL-HTML-v301015'),
    liveEditorSynchronousSnapshot: store.includes('pagesRef.current.find(item => item.slug === pageSlug)'),
    liveEditorPersistenceRoundtrip: store.includes('PAGE_PERSISTENCE_MISMATCH') && cms.includes('PAGE_PERSIST_READBACK_FAILED'),
    liveEditorAtomicSectionSave: store.includes('LIVE-SECTION-ATOMIC-SAVE-v301016') && cms.includes('LIVE-SECTION-ATOMIC-ENDPOINT-v301016'),
    liveEditorImmediateFormSnapshot: liveModal.includes('LIVE-SECTION-FORM-SNAPSHOT-v301016'),
    footerMobileColumnsContract: footer.includes('settings.mobileFooterColumns || settings.footerGridColumnsMobile || 2')
  };
};

const baseline = snapshotTrackedFiles(root);
const hookUrl = pathToFileURL(path.join(root, 'scripts/pipeline-trace-hook.mjs')).href;
const existingNodeOptions = String(process.env.NODE_OPTIONS || '').trim();
const nodeOptions = `${existingNodeOptions}${existingNodeOptions ? ' ' : ''}--import=${hookUrl}`;

const topLevelScripts = [
  { script: 'scripts/prepare-v30108.mjs', kind: 'orchestrator' },
  { script: 'scripts/prepare-extension-platform.mjs', kind: 'stage' },
  { script: 'scripts/prepare-site-auditor-v210-idempotent.mjs', kind: 'stage' },
  { script: 'scripts/prepare-v301013-cms-adapter.mjs', kind: 'stage' },
  { script: 'scripts/apply-v301013-richtext-live-editor-v3.mjs', kind: 'stage' },
  { script: 'scripts/repair-v301013-discard-preview.mjs', kind: 'stage' },
  { script: 'scripts/apply-v301014-auditor-contracts.mjs', kind: 'stage' },
  { script: 'scripts/apply-v301015-richtext-fidelity.mjs', kind: 'stage' },
  { script: 'scripts/apply-v301016-live-section-persistence.mjs', kind: 'stage' }
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
const preparedContracts = buildPreparedContracts();
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit,
  baselineKind: 'git-checkout-before-prepare',
  canonical: { fileHashes: hashMap(baseline) },
  prepared: { fileHashes: hashMap(prepared), routes: preparedRoutes, apiCalls: preparedApiCalls, configRefs: preparedConfigRefs, contracts: preparedContracts },
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
    preparedRuntimeContracts: Object.keys(preparedContracts).length,
    healthyPreparedRuntimeContracts: Object.values(preparedContracts).filter(Boolean).length,
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
  console.log(`Pipeline trace: ${manifest.summary.executedStages} stages, ${manifest.summary.changedFiles} changed files, ${manifest.summary.confirmedOverwrites} confirmed conflicts, ${manifest.summary.intentionalNormalizations} intentional normalization reverts; prepared inventory routes=${preparedRoutes.length}, apiCalls=${preparedApiCalls.length}, configRefs=${preparedConfigRefs.length}, contracts=${manifest.summary.healthyPreparedRuntimeContracts}/${manifest.summary.preparedRuntimeContracts}.`);
}
try { fs.rmSync(traceFile, { force: true }); } catch {}
