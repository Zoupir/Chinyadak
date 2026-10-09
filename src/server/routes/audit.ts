import { Router } from 'express';
import { getOptionalSession } from '../auth/session.js';
import { runSiteAudit } from '../audit/site-audit.js';

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const session = getOptionalSession(req);
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'admin_required' });
  }
  next();
}

router.get('/site-audit', requireAdmin, (_req, res) => {
  try {
    res.json(runSiteAudit());
  } catch (error) {
    console.error('[audit] site audit failed', error);
    res.status(500).json({ error: 'audit_failed' });
  }
});

export default router;
