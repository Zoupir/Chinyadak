import { Router, type Response } from 'express';
import { requireAdmin, type AuthenticatedRequest } from '../auth';
import { pool, type RowDataPacket } from '../db';
import {
  clearSupportEvents,
  listSupportEvents,
  recordSupportEvent,
  safeRequestPath,
  type SupportDiagnosticKind
} from '../support-diagnostics';

interface AdminRoleRow extends RowDataPacket {
  role: string;
  is_active: number;
}

interface CountRow extends RowDataPacket {
  site_pages: number | string;
  products: number | string;
  categories: number | string;
  articles: number | string;
}

interface RecentPageRow extends RowDataPacket {
  id: string;
  slug: string;
  title: string;
  updated_at: Date;
}

const isSuperAdmin = async (req: AuthenticatedRequest): Promise<boolean> => {
  if (!req.auth?.sub) return false;
  const [rows] = await pool.query<AdminRoleRow[]>(
    'SELECT role, is_active FROM admin_users WHERE id = ? LIMIT 1',
    [req.auth.sub]
  );
  return Boolean(rows[0]?.is_active) && rows[0]?.role === 'super_admin';
};

const rejectUnlessSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<boolean> => {
  if (await isSuperAdmin(req)) return false;
  res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
  return true;
};

const clientKinds = new Set<SupportDiagnosticKind>([
  'client_error',
  'client_rejection',
  'client_fetch_error',
  'client_fetch_exception'
]);

export const supportRouter = Router();

supportRouter.post('/client-event', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const kind = String(req.body?.kind || '') as SupportDiagnosticKind;
    if (!clientKinds.has(kind)) {
      res.status(400).json({ error: 'SUPPORT_EVENT_KIND_INVALID' });
      return;
    }

    recordSupportEvent({
      kind,
      method: String(req.body?.method || '').slice(0, 20),
      path: safeRequestPath(req.body?.path),
      status: Number.isInteger(Number(req.body?.status)) ? Number(req.body?.status) : undefined,
      durationMs: Number.isFinite(Number(req.body?.durationMs)) ? Number(req.body?.durationMs) : undefined,
      message: String(req.body?.message || '').slice(0, 600)
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

supportRouter.get('/diagnostics', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (await rejectUnlessSuperAdmin(req, res)) return;

    const startedAt = Date.now();
    await pool.query('SELECT 1');
    const dbLatencyMs = Date.now() - startedAt;

    const [countRows] = await pool.query<CountRow[]>(
      `SELECT
         (SELECT COUNT(*) FROM site_pages) AS site_pages,
         (SELECT COUNT(*) FROM products) AS products,
         (SELECT COUNT(*) FROM categories) AS categories,
         (SELECT COUNT(*) FROM articles) AS articles`
    );

    const [recentPages] = await pool.query<RecentPageRow[]>(
      `SELECT id, slug, title, updated_at
       FROM site_pages
       ORDER BY updated_at DESC
       LIMIT 20`
    );

    const counts = countRows[0] || ({} as CountRow);
    const memory = process.memoryUsage();
    const requestedLimit = Number(req.query.limit || 150);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      runtime: {
        node: process.version,
        env: process.env.NODE_ENV || 'unknown',
        uptimeSeconds: Math.round(process.uptime()),
        memoryMb: {
          rss: Math.round(memory.rss / 1024 / 1024),
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024)
        }
      },
      release: {
        version: process.env.npm_package_version || null,
        sha: process.env.RELEASE_SHA || process.env.GITHUB_SHA || process.env.COMMIT_SHA || null
      },
      database: {
        ok: true,
        latencyMs: dbLatencyMs,
        counts: {
          sitePages: Number(counts.site_pages || 0),
          products: Number(counts.products || 0),
          categories: Number(counts.categories || 0),
          articles: Number(counts.articles || 0)
        }
      },
      recentPages: recentPages.map(page => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        updatedAt: new Date(page.updated_at).toISOString()
      })),
      events: listSupportEvents(Number.isFinite(requestedLimit) ? requestedLimit : 150)
    });
  } catch (error) {
    next(error);
  }
});

supportRouter.delete('/diagnostics', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (await rejectUnlessSuperAdmin(req, res)) return;
    clearSupportEvents();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
