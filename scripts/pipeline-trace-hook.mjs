import childProcess from 'node:child_process';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { appendTraceRecord, diffSnapshots, snapshotTrackedFiles } from './pipeline-trace-lib.mjs';

const originalSpawnSync = childProcess.spawnSync;
const traceFile = process.env.YADAK_PIPELINE_TRACE_FILE || '';
const currentDepth = Number(process.env.YADAK_PIPELINE_TRACE_DEPTH || 0);

function scriptFromArgs(command, args) {
  if (!Array.isArray(args) || !args.length) return null;
  const commandBase = path.basename(String(command || '')).toLowerCase();
  if (command !== process.execPath && !/^node(?:\.exe)?$/.test(commandBase)) return null;
  const candidate = String(args[0] || '').replaceAll('\\', '/');
  if (!candidate.startsWith('scripts/')) return null;
  return candidate;
}

function isTraceStage(script) {
  const name = path.basename(script);
  return /^(?:apply-|repair-|pre-|post-|normalize-)/.test(name);
}

childProcess.spawnSync = function tracedSpawnSync(command, args, options = {}) {
  const script = scriptFromArgs(command, args);
  if (!script || !traceFile) return originalSpawnSync.call(childProcess, command, args, options);

  const env = {
    ...process.env,
    ...(options?.env || {}),
    YADAK_PIPELINE_TRACE_DEPTH: String(currentDepth + 1)
  };
  const nextOptions = { ...options, env };

  if (!isTraceStage(script)) return originalSpawnSync.call(childProcess, command, args, nextOptions);

  const before = snapshotTrackedFiles();
  const startedAt = new Date().toISOString();
  const result = originalSpawnSync.call(childProcess, command, args, nextOptions);
  const endedAt = new Date().toISOString();
  const after = snapshotTrackedFiles();
  appendTraceRecord(traceFile, {
    kind: 'stage',
    script,
    family: path.basename(script).split('-')[0],
    depth: currentDepth + 1,
    startedAt,
    endedAt,
    status: result?.status ?? 0,
    changes: diffSnapshots(before, after)
  });
  return result;
};

syncBuiltinESMExports();
