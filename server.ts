import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs/promises';
import { authRouter } from './src/server/routes/auth';
import { healthRouter } from './src/server/routes/health';
import { catalogRouter } from './src/server/routes/catalog';
import { ordersRouter } from './src/server/routes/orders';
import { paymentsRouter } from './src/server/routes/payments';
import { cmsRouter } from './src/server/routes/cms';
import { adminDataRouter } from './src/server/routes/admin-data';
import { mediaRouter } from './src/server/routes/media';
import { integrationsRouter } from './src/server/routes/integrations';
import { vehiclesRouter } from './src/server/routes/vehicles';
import { engagementRouter } from './src/server/routes/engagement';
import { bulkRouter } from './src/server/routes/bulk';
import { seoRouter } from './src/server/routes/seo';
import { uploadDirectory } from './src/server/media';
import { checkDatabase } from './src/server/db';
import { config } from './src/server/config';
import { renderStorefrontDocument } from './src/server/storefront-html';
import { isPrivateStorefrontPath, normalizePublicStorefrontDocument } from './src/server/storefront-normal';
import {
  buildHtmlSitemap,
  buildSitemapChunkXml,
  buildSitemapXml,
  renderSeoHtml,
  robotsText
} from './src/server/seo';
import {
  getSeoSettings,
  recordSeo404,
  seoPathExists,
  seoRedirectMiddleware
} from './src/server/seo/platform';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(uploadDirectory(), {
  maxAge: '7d',
  etag: true,
  fallthrough: false
}));

app.get('/robots.txt', async (_req, res, next) => {
  try {
    res.type('text/plain').send(await robotsText());
  } catch (error) {
    next(error);
  }
});

app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const xml = await buildSitemapXml();
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

app.get(/^\/sitemap-(products|articles|categories|pages|brands|models)-(\d+)\.xml$/, async (req, res, next) => {
  try {
    const xml = await buildSitemapChunkXml(String(req.params[0]), Number(req.params[1]));
    if (!xml) {
      res.status(404).type('text/plain').send('Sitemap not found');
      return;
    }
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

app.get('/sitemap.html', async (_req, res, next) => {
  try {
    res.type('html').send(await buildHtmlSitemap());
  } catch (error) {
    next(error);
  }
});

app.get(/^\/([a-f0-9]{16,64})\.txt$/i, async (req, res, next) => {
  try {
    const settings = await getSeoSettings();
    const key = String(req.params[0] || '');
    if (!settings.modules.indexNow || !settings.indexNow.enabled || key !== settings.indexNow.key) {
      next();
      return;
    }
    res.type('text/plain').send(settings.indexNow.key);
  } catch (error) {
    next(error);
  }
});

app.use(seoRedirectMiddleware);

app.use('/api/health', healthRouter);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
app.use('/api', apiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/cms', cmsRouter);
app.use('/api/admin-data', adminDataRouter);
app.use('/api/media', mediaRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/engagement', engagementRouter);
app.use('/api/seo', seoRouter);
app.use('/api/bulk', bulkRouter);

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'AI_RATE_LIMIT' }
});

app.post('/api/ai/search-advisor', aiLimiter, async (req, res) => {
  const query = String(req.body?.query ?? '').trim();
  const vehicle = String(req.body?.vehicle ?? '').trim();
  const partCategory = String(req.body?.partCategory ?? '').trim();

  if (query.length < 2 || query.length > 500) {
    res.status(400).json({ error: 'INVALID_QUERY' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({
      error: 'AI_NOT_CONFIGURED',
      message: 'سرویس هوش مصنوعی روی سرور پیکربندی نشده است.'
    });
    return;
  }

  const prompt = `شما مشاور فنی قطعات یدکی خودروهای چینی در ایران هستید.
پرسش کاربر:
"${query}"
${vehicle ? `خودروی مربوطه: ${vehicle}` : ''}
${partCategory ? `دسته‌بندی قطعه: ${partCategory}` : ''}

قواعد پاسخ:
- فقط اطلاعاتی را قطعی بیان کن که از داده‌های معتبر یا نتایج جستجو پشتیبانی می‌شوند.
- شماره فنی، قیمت، موجودی یا ادعای اصالت را حدس نزن.
- در صورت نبود اطلاعات کافی، صریحاً عدم قطعیت را اعلام کن.
- پاسخ را فارسی، کوتاه و ساختاریافته ارائه کن.
- برای ادعاهای به‌روز از جستجوی گوگل استفاده کن.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      res.status(502).json({ error: 'AI_EMPTY_RESPONSE' });
      return;
    }

    res.json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      isFallback: false
    });
  } catch (error) {
    console.error('AI advisor error:', error);
    res.status(502).json({
      error: 'AI_PROVIDER_ERROR',
      message: 'در حال حاضر دریافت پاسخ معتبر از سرویس هوش مصنوعی ممکن نیست.'
    });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API_ROUTE_NOT_FOUND' });
});

async function startServer() {
  await checkDatabase();

  if (config.nodeEnv === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexTemplate = await fs.readFile(path.join(distPath, 'index.html'), 'utf8');

    app.use(express.static(distPath, {
      maxAge: '1h',
      etag: true,
      index: false
    }));

    app.get('*', async (req, res, next) => {
      try {
        const exists = await seoPathExists(req.path);
        if (!exists) {
          await recordSeo404(req).catch(() => undefined);
          if (/\.[a-z0-9]{2,8}$/i.test(req.path)) {
            res.status(404).type('text/plain').send('Not Found');
            return;
          }
          res.status(404);
        }

        const privateRoute = isPrivateStorefrontPath(req.path);
        const seoHtml = await renderSeoHtml(indexTemplate, req.path);
        const storefrontHtml = await renderStorefrontDocument(seoHtml, req.path);
        const html = normalizePublicStorefrontDocument(storefrontHtml, req.path);

        if (privateRoute) {
          res.setHeader('X-Yadak-Render-Mode', 'application');
          res.setHeader('X-Yadak-Content-Rendering', 'client-private');
          res.setHeader('Cache-Control', 'private, no-store');
        } else {
          res.setHeader('X-Yadak-Render-Mode', 'website');
          res.setHeader('X-Yadak-Content-Rendering', 'server');
          res.setHeader('X-Yadak-Navigation-Mode', 'document');
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
        res.type('html').send(html);
      } catch (error) {
        next(error);
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  });

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Yadak Store server running on port ${config.port} (${config.nodeEnv})`);
  });
}

startServer().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
