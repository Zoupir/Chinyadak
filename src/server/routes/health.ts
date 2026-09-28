import { Router } from 'express';
import { checkDatabase } from '../db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await checkDatabase();
    res.json({
      ok: true,
      service: 'chinpart',
      database: 'connected',
      time: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      ok: false,
      service: 'chinpart',
      database: 'unavailable'
    });
  }
});
