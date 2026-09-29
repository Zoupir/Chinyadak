import {
  claimNextSeoJob,
  completeSeoJob,
  enqueueSeoJob,
  failSeoJob,
  getSeoSettings,
  readAppSetting,
  rebuildSeoKnowledgeGraph,
  runFullSeoAudit,
  runtimeLog
} from './platform';
import { submitIndexNow, syncGsc } from './integrations';

const due = (timestamp: string | undefined | null, hours: number): boolean => {
  if (!timestamp) return true;
  const value = new Date(timestamp).getTime();
  return !Number.isFinite(value) || Date.now() - value >= Math.max(1, hours) * 3600000;
};

export const scheduleSeoAutomation = async () => {
  const settings = await getSeoSettings();
  if (!settings.modules.automation) return { queued: [] as string[] };
  const queued: string[] = [];

  const lastAudit = await readAppSetting<any>('takrank_seo_last_audit', null);
  if (settings.modules.auditor && due(lastAudit?.finishedAt, settings.automation.auditCadenceHours)) {
    await enqueueSeoJob('scheduled_audit', { source: 'automation' });
    queued.push('scheduled_audit');
  }

  const gscState = await readAppSetting<any>('takrank_seo_gsc_sync_state', null);
  if (settings.modules.integrations && settings.gsc.property && due(gscState?.syncedAt, settings.automation.gscSyncCadenceHours)) {
    await enqueueSeoJob('gsc_sync', { days: 28, source: 'automation' });
    queued.push('gsc_sync');
  }

  return { queued };
};

export const processSeoJob = async (job: {
  id: number;
  jobType: string;
  payload: any;
  attempts: number;
}) => {
  if (job.jobType === 'graph_rebuild') {
    return rebuildSeoKnowledgeGraph();
  }
  if (job.jobType === 'scheduled_audit' || job.jobType === 'audit') {
    return runFullSeoAudit();
  }
  if (job.jobType === 'gsc_sync') {
    return syncGsc(Number(job.payload?.days || 28));
  }
  if (job.jobType === 'indexnow') {
    return submitIndexNow(Array.isArray(job.payload?.urls) ? job.payload.urls.map(String) : []);
  }
  throw new Error('SEO_JOB_TYPE_UNSUPPORTED:' + job.jobType);
};

export const processSeoQueue = async (limit = 10) => {
  const max = Math.max(1, Math.min(100, Number(limit || 10)));
  const results: any[] = [];
  for (let i = 0; i < max; i += 1) {
    const job = await claimNextSeoJob();
    if (!job) break;
    try {
      const result = await processSeoJob(job);
      await completeSeoJob(job.id);
      results.push({ id: job.id, jobType: job.jobType, status: 'completed', result });
    } catch (error) {
      await failSeoJob(job.id, job.attempts, error);
      results.push({
        id: job.id,
        jobType: job.jobType,
        status: 'failed',
        error: String((error as Error)?.message || error)
      });
      await runtimeLog('error', 'queue_job_failed', {
        id: job.id,
        jobType: job.jobType,
        attempts: job.attempts,
        error: String((error as Error)?.message || error)
      });
    }
  }
  return results;
};

export const runSeoAutomationTick = async (limit = 10) => {
  const scheduled = await scheduleSeoAutomation();
  const processed = await processSeoQueue(limit);
  return { scheduled, processed };
};
