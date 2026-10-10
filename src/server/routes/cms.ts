import { Router } from 'express';
import { updateSeoSettings } from '../seo/platform';
import { requireAdminPermission } from '../auth';
import { pool, type ResultSetHeader, type RowDataPacket } from '../db';

interface JsonRow extends RowDataPacket {
  id: string;
  data_json: any;
}

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: any;
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

const asJson = (value: unknown) => JSON.stringify(value ?? null);

export const cmsRouter = Router();

cmsRouter.get('/bundle', async (_req, res) => {
  const [
    [articleRows],
    [articleCategoryRows],
    [sliderRows],
    [pageRows],
    [settingRows]
  ] = await Promise.all([
    pool.query<JsonRow[]>(
      "SELECT id, data_json FROM articles WHERE is_active = 1 ORDER BY updated_at DESC"
    ),
    pool.query<JsonRow[]>(
      "SELECT id, data_json FROM article_categories ORDER BY name ASC"
    ),
    pool.query<JsonRow[]>(
      "SELECT id, data_json FROM sliders ORDER BY sort_order ASC, updated_at DESC"
    ),
    pool.query<JsonRow[]>(
      "SELECT id, data_json FROM site_pages ORDER BY is_system DESC, updated_at DESC"
    ),
    pool.query<SettingRow[]>(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('site_settings','payment_gateways')"
    )
  ]);

  const settings = new Map(
    settingRows.map(row => [row.setting_key, parseJson<any>(row.setting_value, null)])
  );

  res.json({
    articles: articleRows.filter(row => !parseJson<any>(row.data_json, {}).__trashed).map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
    articleCategories: articleCategoryRows.filter(row => !parseJson<any>(row.data_json, {}).__trashed && parseJson<any>(row.data_json, {}).isActive !== false).map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
    sliders: sliderRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
    pages: pageRows.filter(row => !parseJson<any>(row.data_json, {}).__trashed && parseJson<any>(row.data_json, {}).isVisible !== false).map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
    settings: settings.get('site_settings') || null,
    paymentGateways: settings.get('payment_gateways') || []
  });
});

cmsRouter.post('/articles', requireAdminPermission('canManageArticles'), async (req, res) => {
  const article = { ...req.body };
  article.id = String(article.id || '').trim();
  article.slug = String(article.slug || '').trim();
  article.title = String(article.title || '').trim();
  if (!article.id || !article.slug || !article.title) {
    res.status(400).json({ error: 'ARTICLE_DATA_INVALID' });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO articles (id, slug, title, category_id, data_json, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        article.id,
        article.slug,
        article.title,
        article.categoryId || null,
        asJson(article)
      ]
    );
    res.status(201).json({ article });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'ARTICLE_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});

cmsRouter.put('/articles/:id', requireAdminPermission('canManageArticles'), async (req, res) => {
  const article = { ...req.body, id: String(req.params.id) };
  article.slug = String(article.slug || '').trim();
  article.title = String(article.title || '').trim();
  if (!article.slug || !article.title) {
    res.status(400).json({ error: 'ARTICLE_DATA_INVALID' });
    return;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE articles
     SET slug = ?, title = ?, category_id = ?, data_json = ?, is_active = 1, updated_at = NOW()
     WHERE id = ?`,
    [article.slug, article.title, article.categoryId || null, asJson(article), article.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
    return;
  }
  res.json({ article });
});

cmsRouter.delete('/articles/:id', requireAdminPermission('canManageArticles'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE articles SET is_active = 0, updated_at = NOW() WHERE id = ?",
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ARTICLE_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

cmsRouter.post('/article-categories', requireAdminPermission('canManageArticles'), async (req, res) => {
  const category = { ...req.body };
  category.id = String(category.id || '').trim();
  category.slug = String(category.slug || '').trim();
  category.name = String(category.name || '').trim();
  if (!category.id || !category.slug || !category.name) {
    res.status(400).json({ error: 'ARTICLE_CATEGORY_INVALID' });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO article_categories (id, slug, name, data_json)
       VALUES (?, ?, ?, ?)`,
      [category.id, category.slug, category.name, asJson(category)]
    );
    res.status(201).json({ category });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'ARTICLE_CATEGORY_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});

cmsRouter.put('/article-categories/:id', requireAdminPermission('canManageArticles'), async (req, res) => {
  const category = { ...req.body, id: String(req.params.id) };
  category.slug = String(category.slug || '').trim();
  category.name = String(category.name || '').trim();
  if (!category.slug || !category.name) {
    res.status(400).json({ error: 'ARTICLE_CATEGORY_INVALID' });
    return;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE article_categories
     SET slug = ?, name = ?, data_json = ?, updated_at = NOW()
     WHERE id = ?`,
    [category.slug, category.name, asJson(category), category.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ARTICLE_CATEGORY_NOT_FOUND' });
    return;
  }
  res.json({ category });
});

cmsRouter.delete('/article-categories/:id', requireAdminPermission('canManageArticles'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM article_categories WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'ARTICLE_CATEGORY_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

cmsRouter.post('/sliders', requireAdminPermission('canManageSliders'), async (req, res) => {
  const slider = { ...req.body };
  slider.id = String(slider.id || '').trim();
  if (!slider.id) {
    res.status(400).json({ error: 'SLIDER_ID_REQUIRED' });
    return;
  }

  await pool.execute(
    `INSERT INTO sliders (id, sort_order, is_active, data_json)
     VALUES (?, ?, ?, ?)`,
    [
      slider.id,
      Number(slider.order || 0),
      slider.isActive === false ? 0 : 1,
      asJson(slider)
    ]
  );
  res.status(201).json({ slider });
});

cmsRouter.put('/sliders/:id', requireAdminPermission('canManageSliders'), async (req, res) => {
  const slider = { ...req.body, id: String(req.params.id) };
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE sliders
     SET sort_order = ?, is_active = ?, data_json = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      Number(slider.order || 0),
      slider.isActive === false ? 0 : 1,
      asJson(slider),
      slider.id
    ]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'SLIDER_NOT_FOUND' });
    return;
  }
  res.json({ slider });
});

cmsRouter.delete('/sliders/:id', requireAdminPermission('canManageSliders'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM sliders WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'SLIDER_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

cmsRouter.patch('/sliders/reorder', requireAdminPermission('canManageSliders'), async (req, res) => {
  const sliders = Array.isArray(req.body?.sliders) ? req.body.sliders : [];
  if (!sliders.length || sliders.length > 100) {
    res.status(400).json({ error: 'SLIDER_ORDER_INVALID' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const slider of sliders) {
      await connection.execute(
        `UPDATE sliders
         SET sort_order = ?, data_json = ?, updated_at = NOW()
         WHERE id = ?`,
        [Number(slider.order || 0), asJson(slider), String(slider.id || '')]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  res.json({ sliders });
});

cmsRouter.put('/pages/:id', requireAdminPermission('canManageSettings'), async (req, res) => {
  const page = { ...req.body, id: String(req.params.id) };
  page.slug = String(page.slug || '').trim();
  page.title = String(page.title || '').trim();
  if (!page.slug || !page.title) {
    res.status(400).json({ error: 'PAGE_DATA_INVALID' });
    return;
  }

  await pool.execute(
    `INSERT INTO site_pages (id, slug, title, is_system, data_json)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       slug = VALUES(slug),
       title = VALUES(title),
       is_system = VALUES(is_system),
       data_json = VALUES(data_json),
       updated_at = NOW()`,
    [page.id, page.slug, page.title, page.isSystem ? 1 : 0, asJson(page)]
  );
  res.json({ page });
});

cmsRouter.delete('/pages/:id', requireAdminPermission('canManageSettings'), async (req, res) => {
  const [rows] = await pool.query<Array<RowDataPacket & { is_system: number }>>(
    'SELECT is_system FROM site_pages WHERE id = ? LIMIT 1',
    [req.params.id]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'PAGE_NOT_FOUND' });
    return;
  }
  if (rows[0].is_system) {
    res.status(409).json({ error: 'SYSTEM_PAGE_CANNOT_BE_DELETED' });
    return;
  }

  await pool.execute('DELETE FROM site_pages WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

cmsRouter.patch('/settings', requireAdminPermission('canManageSettings'), async (req, res) => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1"
  );
  const current = rows[0] ? parseJson<any>(rows[0].setting_value, {}) : {};
  const settings = { ...current, ...req.body };

  await pool.execute(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('site_settings', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
    [asJson(settings)]
  );

  // Keep the site's visible identity and native TakRank SEO identity synchronized.
  // SEO-specific titles/descriptions remain independently editable in the SEO center.
  const identityPatch: any = {};
  if ('siteTitle' in req.body || 'siteSlogan' in req.body) {
    identityPatch.global = {
      ...(req.body.siteTitle !== undefined ? { siteTitle: String(settings.siteTitle || '').trim() } : {}),
      ...(req.body.siteSlogan !== undefined ? { siteSlogan: String(settings.siteSlogan || '').trim() } : {})
    };
  }
  if (
    'siteTitle' in req.body || 'logoUrl' in req.body || 'contactPhone' in req.body ||
    'supportPhone' in req.body || 'supportEmail' in req.body || 'address' in req.body
  ) {
    identityPatch.identity = {
      ...(req.body.siteTitle !== undefined ? { organizationName: String(settings.siteTitle || '').split('|')[0].trim() } : {}),
      ...(req.body.logoUrl !== undefined ? { logoUrl: String(settings.logoUrl || '') } : {}),
      ...(('contactPhone' in req.body || 'supportPhone' in req.body)
        ? { phone: String(settings.contactPhone || settings.supportPhone || '') } : {}),
      ...(req.body.supportEmail !== undefined ? { email: String(settings.supportEmail || '') } : {}),
      ...(req.body.address !== undefined ? { address: String(settings.address || '') } : {})
    };
  }
  if (Object.keys(identityPatch).length) {
    await updateSeoSettings(identityPatch);
  }

  res.json({ settings });
});

cmsRouter.put('/payment-gateways', requireAdminPermission('canManageSettings'), async (req, res) => {
  const gateways = Array.isArray(req.body?.gateways) ? req.body.gateways : [];
  const safeGateways = gateways.map((gateway: any) => ({
    ...gateway,
    merchantId: '',
    terminalId: ''
  }));

  await pool.execute(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('payment_gateways', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
    [asJson(safeGateways)]
  );
  res.json({ paymentGateways: safeGateways });
});
