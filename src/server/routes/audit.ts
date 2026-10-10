import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { runSiteAudit } from '../audit/site-audit';

export const auditRouter = Router();

auditRouter.get('/site-audit', requireAdminPermission('canManageSettings'), (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(runSiteAudit());
  } catch (error) {
    next(error);
  }
});
