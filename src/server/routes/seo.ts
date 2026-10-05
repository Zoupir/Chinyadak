import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAdminPermission, type AuthenticatedRequest } from '../auth';
import { pool, type RowDataPacket } from '../db';
import {
  analyzeSeoEntity,
  applyInternalLink,
  buildEntityToc,
  clearRuntimeLogs,
  deleteSeoRedirect,
  getActionCenter,
  getInternalLinkSuggestions,
  getSeoGraphState,
  getSeoSettings,
  getSeoSummary,
  getSeoWorkspace,
  isSeoEntityType,
  listKeywordMap,
  listRuntimeLogs,
  listSeo404,
  listSeoEntities,
  listSeoHistory,
  listSeoIssues,
  listSeoJobs,
  listSeoRedirects,
  loadAllEntities,
  loadEntity,
  optimizeEntityImageAlt,
  rebuildSeoKnowledgeGraph,
  readAppSetting,
  runFullSeoAudit,
  saveKeywordOwner,
  saveSeoMeta,
  saveSeoRedirect,
  setSeo404Decision,
  setSeoIssueState,
  updateSeoRedirectState,
  updateSeoSettings,
  verifySeoIssue,
  writeAppSetting,
  writeSeoHistory,
  type SeoEntityType
} from '../seo/platform';
import {
  applySeoAiPackage,
  createGscAuthUrl,
  getGscOverview,
  getGscQueryInspector,
  getSeoIntegrationSettingsForClient,
  handleGscCallback,
  inspectUrl,
  listPerformanceHistory,
  listSeoAiHistory,
  runPageSpeed,
  runSeoAi,
  submitIndexNow,
  syncGsc,
  updateSeoIntegrationSecrets
} from '../seo/integrations';

export const seoRouter = Router();

// Public, read-only runtime metadata for History API navigation in the SPA.
seoRouter.get('/runtime', async (req, res) => {
  const { getSeoMeta } = await import('../seo');
  const path = String(req.query.path || '/');
  res.json({ meta: await getSeoMeta(path) });
});

const manageSeo = requireAdminPermission('canManageSettings');
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'SEO_AI_RATE_LIMIT' }
});
const externalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'SEO_EXTERNAL_RATE_LIMIT' }
});

const actorId = (req: AuthenticatedRequest): string | undefined => req.auth?.sub;

const entityParams = (req: AuthenticatedRequest): { type: SeoEntityType; id: string } | null => {
  const type = String(req.params.type || req.body?.entityType || req.query.entityType || '');
  const id = String(req.params.id || req.body?.entityId || req.query.entityId || '').trim();
  return isSeoEntityType(type) && id ? { type, id } : null;
};

seoRouter.get('/summary', manageSeo, async (_req, res) => {
  const [summary, actionCenter, settings, integrations] = await Promise.all([
    getSeoSummary(),
    getActionCenter(),
    getSeoSettings(),
    getSeoIntegrationSettingsForClient()
  ]);
  res.json({ summary, actionCenter, settings, integrations });
});

seoRouter.get('/settings', manageSeo, async (_req, res) => {
  res.json({ settings: await getSeoSettings() });
});

seoRouter.put('/settings', manageSeo, async (req: AuthenticatedRequest, res) => {
  const before = await getSeoSettings();
  const settings = await updateSeoSettings(req.body || {});

  // The SEO wizard and the general site identity editor share one visible identity.
  const siteSettings = await readAppSetting<any>('site_settings', {});
  await writeAppSetting('site_settings', {
    ...siteSettings,
    siteTitle: settings.global.siteTitle || siteSettings.siteTitle || '',
    siteSlogan: settings.global.siteSlogan || siteSettings.siteSlogan || '',
    logoUrl: settings.identity.logoUrl || siteSettings.logoUrl || '',
    contactPhone: settings.identity.phone || siteSettings.contactPhone || '',
    supportEmail: settings.identity.email || siteSettings.supportEmail || '',
    address: settings.identity.address || siteSettings.address || ''
  });

  await writeSeoHistory(actorId(req), 'settings_update', undefined, undefined, before, settings);
  res.json({ settings });
});

seoRouter.get('/integrations', manageSeo, async (_req, res) => {
  res.json({ integrations: await getSeoIntegrationSettingsForClient() });
});

seoRouter.put('/integrations', manageSeo, async (req: AuthenticatedRequest, res) => {
  const integrations = await updateSeoIntegrationSecrets(req.body || {});
  await writeSeoHistory(actorId(req), 'integrations_update', undefined, undefined, null, { ...integrations, aiApiKey: integrations.aiApiKey ? 'configured' : '', gscClientSecret: integrations.gscClientSecret ? 'configured' : '', pageSpeedApiKey: integrations.pageSpeedApiKey ? 'configured' : '' });
  res.json({ integrations });
});

seoRouter.get('/entities', manageSeo, async (req, res) => {
  const typeRaw = String(req.query.type || '');
  const type = typeRaw && isSeoEntityType(typeRaw) ? typeRaw : undefined;
  const result = await listSeoEntities({
    type,
    q: String(req.query.q || ''),
    limit: Number(req.query.limit || 100),
    offset: Number(req.query.offset || 0)
  });
  res.json(result);
});

seoRouter.get('/entities/:type/:id', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  const workspace = await getSeoWorkspace(params.type, params.id);
  if (!workspace) {
    res.status(404).json({ error: 'SEO_ENTITY_NOT_FOUND' });
    return;
  }
  res.json(workspace);
});

seoRouter.put('/entities/:type/:id/meta', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    const meta = await saveSeoMeta(params.type, params.id, req.body || {}, actorId(req));
    res.json({ meta });
  } catch (error) {
    if ((error as Error).message === 'SEO_ENTITY_NOT_FOUND') {
      res.status(404).json({ error: 'SEO_ENTITY_NOT_FOUND' });
      return;
    }
    throw error;
  }
});

seoRouter.post('/entities/:type/:id/analyze', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  const entity = await loadEntity(params.type, params.id);
  if (!entity) {
    res.status(404).json({ error: 'SEO_ENTITY_NOT_FOUND' });
    return;
  }
  const workspace = await getSeoWorkspace(params.type, params.id);
  const analysis = await analyzeSeoEntity(entity, workspace?.meta || null);
  res.json({ analysis });
});

seoRouter.post('/entities/:type/:id/image-seo', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    res.json(await optimizeEntityImageAlt(params.type, params.id, actorId(req)));
  } catch (error) {
    const code = String((error as Error)?.message || 'IMAGE_SEO_FAILED');
    res.status(code.includes('NOT_FOUND') ? 404 : 400).json({ error: code });
  }
});

seoRouter.post('/entities/:type/:id/toc', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    res.json(await buildEntityToc(params.type, params.id, req.body?.apply === true, actorId(req)));
  } catch (error) {
    const code = String((error as Error)?.message || 'TOC_FAILED');
    res.status(code.includes('NOT_FOUND') ? 404 : 400).json({ error: code });
  }
});

seoRouter.post('/audit/run', manageSeo, async (req: AuthenticatedRequest, res) => {
  const result = await runFullSeoAudit(actorId(req), 10);
  res.json({ result });
});

seoRouter.get('/issues', manageSeo, async (req, res) => {
  const issues = await listSeoIssues({
    status: String(req.query.status || ''),
    severity: String(req.query.severity || ''),
    category: String(req.query.category || ''),
    limit: Number(req.query.limit || 100),
    offset: Number(req.query.offset || 0)
  });
  res.json({ issues });
});

seoRouter.patch('/issues/:id/state', manageSeo, async (req, res) => {
  const state = String(req.body?.state || 'open') as 'open' | 'resolved' | 'ignored' | 'snoozed';
  if (!['open','resolved','ignored','snoozed'].includes(state)) {
    res.status(400).json({ error: 'SEO_ISSUE_STATE_INVALID' });
    return;
  }
  const result = await setSeoIssueState(Number(req.params.id), state, Number(req.body?.snoozeHours || 0));
  res.json(result);
});

seoRouter.post('/issues/:id/verify', manageSeo, async (req, res) => {
  res.json(await verifySeoIssue(Number(req.params.id)));
});

seoRouter.get('/actions', manageSeo, async (_req, res) => {
  res.json({ actionCenter: await getActionCenter() });
});

seoRouter.get('/graph', manageSeo, async (_req, res) => {
  res.json({ graph: await getSeoGraphState() });
});

seoRouter.post('/graph/rebuild', manageSeo, async (req: AuthenticatedRequest, res) => {
  const before = await getSeoGraphState();
  const graph = await rebuildSeoKnowledgeGraph();
  await writeSeoHistory(actorId(req), 'graph_rebuild', undefined, undefined, before, graph);
  res.json({ graph });
});

seoRouter.get('/links/:type/:id', manageSeo, async (req: AuthenticatedRequest, res) => {
  const params = entityParams(req);
  if (!params) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  const suggestions = await getInternalLinkSuggestions(params.type, params.id, Number(req.query.limit || 5));
  res.json({ suggestions });
});

seoRouter.post('/links/apply', manageSeo, async (req: AuthenticatedRequest, res) => {
  if (!isSeoEntityType(req.body?.sourceType) || !isSeoEntityType(req.body?.targetType)) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    const result = await applyInternalLink({
      sourceType: req.body.sourceType,
      sourceId: String(req.body.sourceId || ''),
      targetType: req.body.targetType,
      targetId: String(req.body.targetId || ''),
      anchor: String(req.body.anchor || ''),
      mode: req.body.mode === 'box' ? 'box' : 'text',
      actorId: actorId(req)
    });
    res.json(result);
  } catch (error) {
    const code = String((error as Error)?.message || 'SEO_LINK_APPLY_FAILED');
    res.status(code.includes('NOT_FOUND') ? 404 : 409).json({ error: code });
  }
});

seoRouter.post('/links/undo/:historyId', manageSeo, async (req: AuthenticatedRequest, res) => {
  const { undoInternalLink } = await import('../seo/platform');
  try {
    res.json(await undoInternalLink(Number(req.params.historyId), actorId(req)));
  } catch (error) {
    res.status(404).json({ error: String((error as Error)?.message || 'SEO_HISTORY_NOT_FOUND') });
  }
});

seoRouter.get('/redirects', manageSeo, async (_req, res) => {
  res.json({ redirects: await listSeoRedirects() });
});

seoRouter.post('/redirects', manageSeo, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await saveSeoRedirect(req.body || {});
    await writeSeoHistory(actorId(req), 'redirect_save', 'redirect', undefined, null, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'SEO_REDIRECT_INVALID') });
  }
});

seoRouter.patch('/redirects/:id', manageSeo, async (req, res) => {
  res.json(await updateSeoRedirectState(Number(req.params.id), Boolean(req.body?.enabled)));
});

seoRouter.delete('/redirects/:id', manageSeo, async (req, res) => {
  res.json(await deleteSeoRedirect(Number(req.params.id)));
});

seoRouter.get('/404', manageSeo, async (req, res) => {
  res.json({ items: await listSeo404(String(req.query.includeNoise || '') === '1') });
});

seoRouter.patch('/404/:id', manageSeo, async (req, res) => {
  try {
    res.json(await setSeo404Decision(Number(req.params.id), String(req.body?.decision || 'open'), String(req.body?.note || '')));
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'SEO_404_DECISION_INVALID') });
  }
});

seoRouter.get('/keywords', manageSeo, async (_req, res) => {
  res.json({ items: await listKeywordMap() });
});

seoRouter.put('/keywords/owner', manageSeo, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await saveKeywordOwner(
      String(req.body?.query || ''),
      String(req.body?.preferredUrl || ''),
      actorId(req),
      String(req.body?.note || '')
    ));
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'SEO_KEYWORD_MAP_INVALID') });
  }
});

seoRouter.post('/ai/run', manageSeo, aiLimiter, async (req: AuthenticatedRequest, res) => {
  if (!isSeoEntityType(req.body?.entityType)) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    const result = await runSeoAi({
      entityType: req.body.entityType,
      entityId: String(req.body?.entityId || ''),
      operation: ['optimize','generate','repair'].includes(String(req.body?.operation))
        ? req.body.operation
        : 'optimize',
      draft: req.body?.draft && typeof req.body.draft === 'object' ? req.body.draft : undefined,
      instructions: String(req.body?.instructions || '').slice(0, 5000),
      actorId: actorId(req)
    });
    res.json(result);
  } catch (error) {
    res.status(502).json({ error: String((error as Error)?.message || 'SEO_AI_FAILED') });
  }
});

seoRouter.post('/ai/apply', manageSeo, async (req: AuthenticatedRequest, res) => {
  if (!isSeoEntityType(req.body?.entityType)) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  try {
    res.json(await applySeoAiPackage({
      entityType: req.body.entityType,
      entityId: String(req.body?.entityId || ''),
      package: req.body?.package || {},
      applyContent: req.body?.applyContent !== false,
      applyMeta: req.body?.applyMeta !== false,
      actorId: actorId(req)
    }));
  } catch (error) {
    res.status(409).json({ error: String((error as Error)?.message || 'SEO_AI_APPLY_FAILED') });
  }
});

seoRouter.get('/ai/history', manageSeo, async (req, res) => {
  res.json({ items: await listSeoAiHistory(Number(req.query.limit || 100)) });
});

seoRouter.get('/gsc/auth-url', manageSeo, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({ url: await createGscAuthUrl(String(actorId(req) || '')) });
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'GSC_AUTH_FAILED') });
  }
});

seoRouter.get('/gsc/callback', manageSeo, async (req: AuthenticatedRequest, res) => {
  try {
    await handleGscCallback({
      code: String(req.query.code || ''),
      state: String(req.query.state || ''),
      actorId: String(actorId(req) || '')
    });
    res.redirect('/admin?takrankSeo=gsc-connected');
  } catch (error) {
    res.redirect('/admin?takrankSeo=gsc-error&message=' + encodeURIComponent(String((error as Error)?.message || 'GSC_AUTH_FAILED')));
  }
});

seoRouter.post('/gsc/sync', manageSeo, externalLimiter, async (req, res) => {
  try {
    res.json({ result: await syncGsc(Number(req.body?.days || 28)) });
  } catch (error) {
    res.status(502).json({ error: String((error as Error)?.message || 'GSC_SYNC_FAILED') });
  }
});

seoRouter.get('/gsc/overview', manageSeo, async (req, res) => {
  res.json(await getGscOverview(Number(req.query.days || 28)));
});

seoRouter.get('/gsc/query', manageSeo, async (req, res) => {
  try {
    res.json(await getGscQueryInspector(String(req.query.q || ''), Number(req.query.days || 28)));
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'GSC_QUERY_FAILED') });
  }
});

seoRouter.post('/performance/check', manageSeo, externalLimiter, async (req, res) => {
  try {
    const strategy = req.body?.strategy === 'desktop' ? 'desktop' : 'mobile';
    res.json({ report: await runPageSpeed(String(req.body?.url || ''), strategy) });
  } catch (error) {
    res.status(502).json({ error: String((error as Error)?.message || 'PAGESPEED_FAILED') });
  }
});

seoRouter.get('/performance/history', manageSeo, async (req, res) => {
  res.json({ items: await listPerformanceHistory(Number(req.query.limit || 60)) });
});

seoRouter.post('/inspect', manageSeo, externalLimiter, async (req, res) => {
  try {
    res.json({ result: await inspectUrl(String(req.body?.url || '')) });
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'INSPECTOR_FAILED') });
  }
});

seoRouter.post('/indexnow', manageSeo, externalLimiter, async (req, res) => {
  try {
    const urls = Array.isArray(req.body?.urls) ? req.body.urls.map(String) : [];
    res.json(await submitIndexNow(urls));
  } catch (error) {
    res.status(400).json({ error: String((error as Error)?.message || 'INDEXNOW_FAILED') });
  }
});

const expectedSchemaType = (type: SeoEntityType): string =>
  type === 'product'
    ? 'Product'
    : type === 'article'
      ? 'Article'
      : type === 'category' || type === 'brand' || type === 'model'
        ? 'CollectionPage'
        : 'WebPage';

seoRouter.get('/schema/audit', manageSeo, async (_req, res) => {
  const entities = await loadAllEntities(10000);
  const issues: any[] = [];
  for (const entity of entities) {
    const workspace = await getSeoWorkspace(entity.type, entity.id);
    if (!workspace) continue;
    const actual = workspace.meta.schemaType || expectedSchemaType(entity.type);
    const expected = expectedSchemaType(entity.type);
    const mismatch =
      (entity.type === 'product' && actual !== 'Product' && actual !== 'ProductGroup') ||
      (entity.type === 'article' && !['Article','BlogPosting','TechArticle','NewsArticle'].includes(actual)) ||
      (['category','brand','model'].includes(entity.type) && actual === 'Product');
    if (mismatch) {
      issues.push({
        entityType: entity.type,
        entityId: entity.id,
        title: entity.title,
        url: entity.url,
        actual,
        expected,
        severity: 'medium',
        confidence: 'high'
      });
    }
  }
  res.json({ scanned: entities.length, issues });
});

seoRouter.post('/schema/repair', manageSeo, async (req: AuthenticatedRequest, res) => {
  if (!isSeoEntityType(req.body?.entityType)) {
    res.status(400).json({ error: 'SEO_ENTITY_INVALID' });
    return;
  }
  const entity = await loadEntity(req.body.entityType, String(req.body?.entityId || ''));
  if (!entity) {
    res.status(404).json({ error: 'SEO_ENTITY_NOT_FOUND' });
    return;
  }
  const meta = await saveSeoMeta(entity.type, entity.id, {
    schemaType: expectedSchemaType(entity.type)
  }, actorId(req));
  res.json({ meta });
});

seoRouter.get('/history', manageSeo, async (req, res) => {
  res.json({ items: await listSeoHistory(Number(req.query.limit || 250)) });
});

seoRouter.get('/jobs', manageSeo, async (req, res) => {
  res.json({ items: await listSeoJobs(Number(req.query.limit || 100)) });
});

seoRouter.get('/diagnostics/logs', manageSeo, async (req, res) => {
  res.json({ items: await listRuntimeLogs(Number(req.query.limit || 500)) });
});

seoRouter.delete('/diagnostics/logs', manageSeo, async (_req, res) => {
  res.json(await clearRuntimeLogs());
});

seoRouter.get('/health', manageSeo, async (_req, res) => {
  const tables = [
    'seo_meta','seo_issues','seo_history','seo_knowledge_nodes','seo_knowledge_edges',
    'seo_redirects','seo_404','seo_jobs','seo_gsc_daily','seo_keyword_map',
    'seo_performance_reports','seo_ai_history','seo_runtime_log'
  ];
  const [rows] = await pool.query<Array<RowDataPacket & { table_name: string }>>(
    'SELECT TABLE_NAME table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (' +
      tables.map(() => '?').join(',') + ')',
    tables
  );
  const found = new Set(rows.map(row => row.table_name));
  const settings = await getSeoSettings();
  res.json({
    ok: tables.every(table => found.has(table)),
    tables: tables.map(table => ({ table, ok: found.has(table) })),
    appUrl: process.env.APP_URL || '',
    modules: settings.modules,
    graph: await getSeoGraphState()
  });
});

seoRouter.post('/self-test', manageSeo, async (_req, res) => {
  const checks: Array<{ key: string; ok: boolean; detail: string }> = [];
  const summary = await getSeoSummary();
  checks.push({ key: 'database', ok: true, detail: 'SEO tables are queryable.' });
  checks.push({ key: 'app_url', ok: /^https?:\/\//.test(String(process.env.APP_URL || '')), detail: String(process.env.APP_URL || 'not configured') });
  const settings = await getSeoSettings();
  checks.push({ key: 'site_title', ok: Boolean(settings.global.siteTitle), detail: settings.global.siteTitle || 'empty' });
  checks.push({ key: 'graph', ok: Boolean(summary.graph?.ready), detail: summary.graph?.ready ? 'ready' : 'not built yet' });
  const integrations = await getSeoIntegrationSettingsForClient();
  checks.push({ key: 'ai', ok: Boolean(integrations.aiApiKey || process.env.GEMINI_API_KEY), detail: integrations.aiApiKey || process.env.GEMINI_API_KEY ? 'configured' : 'optional/not configured' });
  checks.push({ key: 'gsc', ok: Boolean(integrations.gscConnected), detail: integrations.gscConnected ? 'connected' : 'optional/not connected' });
  res.json({
    ok: checks.filter(check => ['database','app_url','site_title'].includes(check.key)).every(check => check.ok),
    checks,
    summary
  });
});
