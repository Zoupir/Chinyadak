import { createHash, randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { decryptSecret, encryptSecret, maskSecret } from '../crypto';
import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';

export type SeoEntityType = 'product' | 'article' | 'category' | 'page' | 'brand' | 'model';
export type SeoSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SeoConfidence = 'high' | 'medium' | 'review';

export interface SeoEntity {
  type: SeoEntityType;
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  content: string;
  image?: string;
  taxonomy: string[];
  data: Record<string, any>;
  updatedAt: Date;
}

export interface SeoMetaRecord {
  entityType: SeoEntityType;
  entityId: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  schemaType: string;
  cornerstone: boolean;
  breadcrumbTitle: string;
  hreflang: Array<{ lang: string; url: string }>;
  score: number;
  analysis: SeoAnalysis | null;
}

export interface SeoAnalysisCheck {
  key: string;
  label: string;
  score: number;
  max: number;
  status: 'good' | 'warning' | 'bad';
  detail: string;
}

export interface SeoAnalysis {
  score: number;
  wordCount: number;
  keywordDensity: number;
  checks: SeoAnalysisCheck[];
  internalLinks: number;
  externalLinks: number;
  headings: number;
  imageCount: number;
  missingImageAlt: number;
}

export interface SeoSettings {
  global: {
    siteTitle: string;
    siteSlogan: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
    canonicalUrl: string;
    indexRobots: boolean;
    separator: string;
    productTitleTemplate: string;
    articleTitleTemplate: string;
    categoryTitleTemplate: string;
  };
  modules: {
    meta: boolean;
    schema: boolean;
    sitemap: boolean;
    redirects: boolean;
    monitor404: boolean;
    breadcrumbs: boolean;
    hreflang: boolean;
    internalLinks: boolean;
    auditor: boolean;
    imageSeo: boolean;
    indexNow: boolean;
    performance: boolean;
    integrations: boolean;
    automation: boolean;
    inspector: boolean;
    toc: boolean;
  };
  scoring: {
    articleMinimumWords: number;
    productMinimumWords: number;
    pageMinimumWords: number;
    densityMin: number;
    densityMax: number;
  };
  ai: {
    provider: 'gemini' | 'openai' | 'anthropic';
    model: string;
    language: string;
    tone: string;
    requestedWords: number;
    faqPolicy: 'auto' | 'always' | 'never';
    ctaPolicy: 'auto' | 'always' | 'never';
    editorialInstructions: string;
    directApply: boolean;
  };
  sitemap: {
    includeImages: boolean;
    chunkSize: number;
    htmlEnabled: boolean;
  };
  robots: {
    mode: 'managed' | 'augment';
    extraRules: string;
  };
  gsc: {
    property: string;
    clientId: string;
  };
  performance: {
    historyLimit: number;
  };
  indexNow: {
    enabled: boolean;
    key: string;
  };
  toc: {
    enabled: boolean;
    minimumHeadings: number;
    minimumWords: number;
    collapsed: boolean;
  };
  identity: {
    organizationName: string;
    organizationType: string;
    logoUrl: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    region: string;
    city: string;
    priceRange: string;
    mapUrl: string;
    socialProfiles: string[];
    serviceAreas: string[];
    openingHours: string[];
  };
  automation: {
    auditCadenceHours: number;
    gscSyncCadenceHours: number;
  };
  runtimeLogging: boolean;
}

type SeoSecretStore = {
  aiApiKeyEncrypted: string;
  gscClientSecretEncrypted: string;
  gscAccessTokenEncrypted: string;
  gscRefreshTokenEncrypted: string;
  gscAccessTokenExpiresAt: number;
  pageSpeedApiKeyEncrypted: string;
};

interface SettingRow extends RowDataPacket {
  setting_value: any;
}

interface SeoMetaRow extends RowDataPacket {
  entity_type: SeoEntityType;
  entity_id: string;
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  secondary_keywords_json: any;
  canonical_url: string | null;
  robots_index: number;
  robots_follow: number;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;
  schema_type: string | null;
  cornerstone: number;
  breadcrumb_title: string | null;
  hreflang_json: any;
  score: number;
  analysis_json: any;
}

const ENTITY_TYPES = new Set<SeoEntityType>(['product', 'article', 'category', 'page', 'brand', 'model']);

export const isSeoEntityType = (value: unknown): value is SeoEntityType =>
  ENTITY_TYPES.has(String(value) as SeoEntityType);

export const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

export const sha256 = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

export const normalizeSeoText = (value: unknown): string =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizePath = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, config.appUrl);
    return (parsed.pathname || '/') + (parsed.search || '');
  } catch {
    return raw.startsWith('/') ? raw : '/' + raw;
  }
};

export const absoluteSiteUrl = (path: string): string => {
  const base = config.appUrl.replace(/\/$/, '');
  const normalized = normalizePath(path).split('?')[0].replace(/\/$/, '');
  return base + (normalized === '/' || normalized === '' ? '' : normalized);
};

const defaultSettings = (): SeoSettings => ({
  global: {
    siteTitle: 'یدک استور',
    siteSlogan: 'فروشگاه تخصصی قطعات خودروهای چینی',
    metaTitle: 'یدک استور | فروشگاه تخصصی قطعات یدکی خودروهای چینی',
    metaDescription: 'فروشگاه تخصصی قطعات یدکی خودروهای چینی با جستجوی شماره فنی، تطبیق خودرو، مشخصات فنی و رهگیری سفارش.',
    metaKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    canonicalUrl: '',
    indexRobots: true,
    separator: '|',
    productTitleTemplate: '%title% | خرید و مشخصات | %site%',
    articleTitleTemplate: '%title% | مجله %site%',
    categoryTitleTemplate: '%title% | قطعات یدکی | %site%'
  },
  modules: {
    meta: true,
    schema: true,
    sitemap: true,
    redirects: true,
    monitor404: true,
    breadcrumbs: true,
    hreflang: true,
    internalLinks: true,
    auditor: true,
    imageSeo: true,
    indexNow: false,
    performance: true,
    integrations: true,
    automation: true,
    inspector: true,
    toc: true
  },
  scoring: {
    articleMinimumWords: 1500,
    productMinimumWords: 300,
    pageMinimumWords: 700,
    densityMin: 0.5,
    densityMax: 2.5
  },
  ai: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    language: 'fa',
    tone: 'professional',
    requestedWords: 1800,
    faqPolicy: 'auto',
    ctaPolicy: 'auto',
    editorialInstructions: '',
    directApply: false
  },
  sitemap: {
    includeImages: true,
    chunkSize: 1000,
    htmlEnabled: true
  },
  robots: {
    mode: 'managed',
    extraRules: ''
  },
  gsc: {
    property: '',
    clientId: ''
  },
  performance: {
    historyLimit: 30
  },
  indexNow: {
    enabled: false,
    key: ''
  },
  toc: {
    enabled: true,
    minimumHeadings: 3,
    minimumWords: 700,
    collapsed: false
  },
  identity: {
    organizationName: '',
    organizationType: 'AutoPartsStore',
    logoUrl: '',
    phone: '',
    email: '',
    address: '',
    country: 'IR',
    region: '',
    city: '',
    priceRange: '',
    mapUrl: '',
    socialProfiles: [],
    serviceAreas: [],
    openingHours: []
  },
  automation: {
    auditCadenceHours: 24,
    gscSyncCadenceHours: 24
  },
  runtimeLogging: false
});

const mergeSettings = (stored: any): SeoSettings => {
  const base = defaultSettings();
  const input = stored && typeof stored === 'object' ? stored : {};
  return {
    ...base,
    ...input,
    global: { ...base.global, ...(input.global || {}) },
    modules: { ...base.modules, ...(input.modules || {}) },
    scoring: { ...base.scoring, ...(input.scoring || {}) },
    ai: { ...base.ai, ...(input.ai || {}) },
    sitemap: { ...base.sitemap, ...(input.sitemap || {}) },
    robots: { ...base.robots, ...(input.robots || {}) },
    gsc: { ...base.gsc, ...(input.gsc || {}) },
    performance: { ...base.performance, ...(input.performance || {}) },
    indexNow: { ...base.indexNow, ...(input.indexNow || {}) },
    toc: { ...base.toc, ...(input.toc || {}) },
    identity: { ...base.identity, ...(input.identity || {}) },
    automation: { ...base.automation, ...(input.automation || {}) }
  };
};

export const readAppSetting = async <T>(key: string, fallback: T): Promise<T> => {
  const [rows] = await pool.query<SettingRow[]>(
    'SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1',
    [key]
  );
  return rows[0] ? parseJson<T>(rows[0].setting_value, fallback) : fallback;
};

export const writeAppSetting = async (key: string, value: unknown): Promise<void> => {
  await pool.execute(
    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()',
    [key, JSON.stringify(value)]
  );
};

export const getSeoSettings = async (): Promise<SeoSettings> => {
  const stored = await readAppSetting<any>('takrank_seo_settings', null);
  if (stored && typeof stored === 'object') return mergeSettings(stored);

  // One-time native migration from the simple SEO/site identity fields that
  // existed in Chinyadak before TakRank SEO Native was introduced.
  const legacy = await readAppSetting<any>('site_settings', {});
  const migrated = mergeSettings({
    global: {
      siteTitle: String(legacy?.siteTitle || 'فروشگاه قطعات خودرو').split('|')[0].trim(),
      siteSlogan: String(legacy?.siteSlogan || ''),
      metaTitle: String(legacy?.metaTitle || legacy?.siteTitle || ''),
      metaDescription: String(legacy?.metaDescription || ''),
      metaKeywords: String(legacy?.metaKeywords || ''),
      ogTitle: String(legacy?.ogTitle || ''),
      ogDescription: String(legacy?.ogDescription || ''),
      ogImageUrl: String(legacy?.ogImageUrl || ''),
      canonicalUrl: String(legacy?.canonicalUrl || ''),
      indexRobots: legacy?.enableIndexRobots !== false
    },
    identity: {
      organizationName: String(legacy?.siteTitle || 'فروشگاه قطعات خودرو').split('|')[0].trim(),
      logoUrl: String(legacy?.logoUrl || ''),
      phone: String(legacy?.contactPhone || legacy?.supportPhone || ''),
      email: String(legacy?.supportEmail || ''),
      address: String(legacy?.address || '')
    }
  });
  await writeAppSetting('takrank_seo_settings', migrated);
  return migrated;
};

const safeStringArray = (value: unknown, max = 100): string[] =>
  (Array.isArray(value) ? value : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .slice(0, max);

export const updateSeoSettings = async (patch: any): Promise<SeoSettings> => {
  const current = await getSeoSettings();
  const next = mergeSettings({
    ...current,
    ...patch,
    global: { ...current.global, ...(patch?.global || {}) },
    modules: { ...current.modules, ...(patch?.modules || {}) },
    scoring: { ...current.scoring, ...(patch?.scoring || {}) },
    ai: { ...current.ai, ...(patch?.ai || {}) },
    sitemap: { ...current.sitemap, ...(patch?.sitemap || {}) },
    robots: { ...current.robots, ...(patch?.robots || {}) },
    gsc: { ...current.gsc, ...(patch?.gsc || {}) },
    performance: { ...current.performance, ...(patch?.performance || {}) },
    indexNow: { ...current.indexNow, ...(patch?.indexNow || {}) },
    toc: { ...current.toc, ...(patch?.toc || {}) },
    identity: {
      ...current.identity,
      ...(patch?.identity || {}),
      socialProfiles: safeStringArray(patch?.identity?.socialProfiles ?? current.identity.socialProfiles, 30),
      serviceAreas: safeStringArray(patch?.identity?.serviceAreas ?? current.identity.serviceAreas, 100),
      openingHours: safeStringArray(patch?.identity?.openingHours ?? current.identity.openingHours, 30)
    },
    automation: { ...current.automation, ...(patch?.automation || {}) }
  });

  next.global.siteTitle = String(next.global.siteTitle || '').trim().slice(0, 190);
  next.global.siteSlogan = String(next.global.siteSlogan || '').trim().slice(0, 255);
  next.global.metaTitle = String(next.global.metaTitle || '').trim().slice(0, 255);
  next.global.metaDescription = String(next.global.metaDescription || '').trim().slice(0, 1000);
  next.global.metaKeywords = String(next.global.metaKeywords || '').trim().slice(0, 2000);
  next.global.ogTitle = String(next.global.ogTitle || '').trim().slice(0, 255);
  next.global.ogDescription = String(next.global.ogDescription || '').trim().slice(0, 1000);
  next.global.ogImageUrl = String(next.global.ogImageUrl || '').trim().slice(0, 2000);
  next.global.canonicalUrl = String(next.global.canonicalUrl || '').trim().slice(0, 2000);
  next.global.separator = String(next.global.separator || '|').trim().slice(0, 5) || '|';
  next.global.productTitleTemplate = String(next.global.productTitleTemplate || '%title% | %site%').slice(0, 255);
  next.global.articleTitleTemplate = String(next.global.articleTitleTemplate || '%title% | %site%').slice(0, 255);
  next.global.categoryTitleTemplate = String(next.global.categoryTitleTemplate || '%title% | %site%').slice(0, 255);

  next.scoring.articleMinimumWords = Math.max(100, Math.min(10000, Number(next.scoring.articleMinimumWords || 1500)));
  next.scoring.productMinimumWords = Math.max(80, Math.min(5000, Number(next.scoring.productMinimumWords || 300)));
  next.scoring.pageMinimumWords = Math.max(100, Math.min(10000, Number(next.scoring.pageMinimumWords || 700)));
  next.ai.requestedWords = Math.max(200, Math.min(10000, Number(next.ai.requestedWords || 1800)));
  next.sitemap.chunkSize = Math.max(100, Math.min(5000, Number(next.sitemap.chunkSize || 1000)));
  next.performance.historyLimit = Math.max(5, Math.min(200, Number(next.performance.historyLimit || 30)));

  if (!next.indexNow.key && next.indexNow.enabled) {
    next.indexNow.key = createHash('sha256').update(randomUUID()).digest('hex').slice(0, 32);
  }

  await writeAppSetting('takrank_seo_settings', next);
  return next;
};

const emptySecrets = (): SeoSecretStore => ({
  aiApiKeyEncrypted: '',
  gscClientSecretEncrypted: '',
  gscAccessTokenEncrypted: '',
  gscRefreshTokenEncrypted: '',
  gscAccessTokenExpiresAt: 0,
  pageSpeedApiKeyEncrypted: ''
});

export const readSeoSecrets = async (): Promise<SeoSecretStore> => ({
  ...emptySecrets(),
  ...(await readAppSetting<Partial<SeoSecretStore>>('takrank_seo_secrets', {}))
});

const secretUpdate = (value: unknown, current: string): string => {
  const text = String(value ?? '').trim();
  if (!text || text === '••••••••' || /^•+$/.test(text)) return current;
  return encryptSecret(text);
};

export const getSeoIntegrationSettingsForClient = async () => {
  const settings = await getSeoSettings();
  const secrets = await readSeoSecrets();
  return {
    aiProvider: settings.ai.provider,
    aiModel: settings.ai.model,
    aiApiKey: maskSecret(secrets.aiApiKeyEncrypted),
    gscClientId: settings.gsc.clientId,
    gscClientSecret: maskSecret(secrets.gscClientSecretEncrypted),
    gscProperty: settings.gsc.property,
    gscConnected: Boolean(secrets.gscRefreshTokenEncrypted || secrets.gscAccessTokenEncrypted),
    pageSpeedApiKey: maskSecret(secrets.pageSpeedApiKeyEncrypted)
  };
};

export const updateSeoIntegrationSecrets = async (input: any) => {
  const current = await readSeoSecrets();
  const settings = await updateSeoSettings({
    ai: {
      provider: input?.aiProvider,
      model: String(input?.aiModel || '').trim() || undefined
    },
    gsc: {
      clientId: String(input?.gscClientId || '').trim(),
      property: String(input?.gscProperty || '').trim()
    }
  });

  const next: SeoSecretStore = {
    ...current,
    aiApiKeyEncrypted: secretUpdate(input?.aiApiKey, current.aiApiKeyEncrypted),
    gscClientSecretEncrypted: secretUpdate(input?.gscClientSecret, current.gscClientSecretEncrypted),
    pageSpeedApiKeyEncrypted: secretUpdate(input?.pageSpeedApiKey, current.pageSpeedApiKeyEncrypted)
  };
  await writeAppSetting('takrank_seo_secrets', next);
  return getSeoIntegrationSettingsForClient();
};

export const getSeoSecretValues = async () => {
  const secrets = await readSeoSecrets();
  const decrypt = (value: string): string => {
    if (!value) return '';
    try { return decryptSecret(value); } catch { return ''; }
  };
  return {
    aiApiKey: decrypt(secrets.aiApiKeyEncrypted),
    gscClientSecret: decrypt(secrets.gscClientSecretEncrypted),
    gscAccessToken: decrypt(secrets.gscAccessTokenEncrypted),
    gscRefreshToken: decrypt(secrets.gscRefreshTokenEncrypted),
    gscAccessTokenExpiresAt: Number(secrets.gscAccessTokenExpiresAt || 0),
    pageSpeedApiKey: decrypt(secrets.pageSpeedApiKeyEncrypted)
  };
};

export const storeGscTokens = async (tokens: { accessToken?: string; refreshToken?: string; expiresAt?: number }) => {
  const current = await readSeoSecrets();
  const next: SeoSecretStore = {
    ...current,
    gscAccessTokenEncrypted: tokens.accessToken ? encryptSecret(tokens.accessToken) : current.gscAccessTokenEncrypted,
    gscRefreshTokenEncrypted: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : current.gscRefreshTokenEncrypted,
    gscAccessTokenExpiresAt: Number(tokens.expiresAt || current.gscAccessTokenExpiresAt || 0)
  };
  await writeAppSetting('takrank_seo_secrets', next);
};

const entityUrl = (type: SeoEntityType, slug: string): string => {
  if (type === 'product') return '/product/' + encodeURIComponent(slug);
  if (type === 'article') return '/article/' + encodeURIComponent(slug);
  if (type === 'category') return '/category/' + encodeURIComponent(slug);
  if (type === 'page') return '/page/' + encodeURIComponent(slug);
  if (type === 'brand') return '/brand/' + encodeURIComponent(slug);
  return '/car-model/' + encodeURIComponent(slug);
};

const pageContent = (data: any): string => {
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  return sections.map((section: any) => [section?.title, section?.subtitle, section?.content].filter(Boolean).join(' ')).join(' ');
};

const taxonomyOf = (type: SeoEntityType, data: any): string[] => {
  if (type === 'product') {
    return [
      data?.categorySlug,
      ...(Array.isArray(data?.vehicleBrandIds) ? data.vehicleBrandIds : []),
      ...(Array.isArray(data?.vehicleModelIds) ? data.vehicleModelIds : []),
      data?.brandManufacturer
    ].filter(Boolean).map(String);
  }
  if (type === 'article') {
    return [
      data?.category,
      data?.categoryId,
      ...(Array.isArray(data?.relatedModelIds) ? data.relatedModelIds : []),
      ...(Array.isArray(data?.relatedProductIds) ? data.relatedProductIds : [])
    ].filter(Boolean).map(String);
  }
  if (type === 'category') return [data?.parentId, data?.slug].filter(Boolean).map(String);
  if (type === 'model') return [data?.brandId].filter(Boolean).map(String);
  return [];
};

const entityFromRow = (
  type: SeoEntityType,
  row: any
): SeoEntity => {
  const data = parseJson<Record<string, any>>(row.data_json, {});
  let title = '';
  let description = '';
  let content = '';
  let image = '';

  if (type === 'product') {
    title = String(data.nameFa || row.name_fa || '');
    description = String(data.shortDescription || row.short_description || '');
    content = String(data.description || row.description || '');
    image = String(Array.isArray(data.images) ? data.images[0] || '' : '');
  } else if (type === 'article') {
    title = String(data.title || row.title || '');
    description = String(data.summary || '');
    content = String(data.content || '');
    image = String(data.imageUrl || '');
  } else if (type === 'category') {
    title = String(data.nameFa || row.name_fa || '');
    description = String(data.description || row.description || '');
    content = description;
    image = String(data.imageUrl || data.iconUrl || '');
  } else if (type === 'page') {
    title = String(data.title || row.title || '');
    description = String(data.description || '');
    content = pageContent(data);
  } else if (type === 'brand') {
    title = String(data.nameFa || row.name_fa || '');
    description = String(data.description || '');
    content = description;
    image = String(data.heroImage || data.logo || '');
  } else {
    title = String(data.nameFa || row.name_fa || '');
    description = String(data.description || '');
    content = [description, ...(Array.isArray(data.commonIssues) ? data.commonIssues : []), ...(Array.isArray(data.maintenanceTips) ? data.maintenanceTips : [])].join(' ');
    image = String(data.imageUrl || '');
  }

  return {
    type,
    id: String(row.id),
    slug: String(row.slug || data.slug || row.id),
    title: normalizeSeoText(title),
    url: entityUrl(type, String(row.slug || data.slug || row.id)),
    description: normalizeSeoText(description),
    content: String(content || ''),
    image: image || undefined,
    taxonomy: taxonomyOf(type, data),
    data,
    updatedAt: new Date(row.updated_at || Date.now())
  };
};

const nestedCategoryEntitiesFromRow = (row: any): SeoEntity[] => {
  const rootData = parseJson<Record<string, any>>(row.data_json, {});
  const updatedAt = new Date(row.updated_at || Date.now());
  const result: SeoEntity[] = [];

  const walk = (nodes: any[], ancestors: string[] = []) => {
    for (const node of nodes || []) {
      const id = String(node?.id || '').trim();
      const slug = String(node?.slug || id).trim();
      if (!id || !slug) continue;
      const title = normalizeSeoText(String(node?.nameFa || node?.nameEn || slug));
      const description = normalizeSeoText(String(node?.description || ''));
      const bottom = String(node?.bottomDescription || '');
      result.push({
        type: 'category',
        id: 'sub:' + id,
        slug,
        title,
        url: entityUrl('category', slug),
        description,
        content: [description, bottom].filter(Boolean).join(' '),
        image: String(node?.imageUrl || node?.iconUrl || '') || undefined,
        taxonomy: [...ancestors, slug].filter(Boolean),
        data: { ...node, parentRootId: String(row.id), parentRootSlug: String(row.slug || rootData.slug || '') },
        updatedAt
      });
      if (Array.isArray(node?.subcategories) && node.subcategories.length) {
        walk(node.subcategories, [...ancestors, slug]);
      }
    }
  };

  walk(Array.isArray(rootData?.subcategories) ? rootData.subcategories : [], [String(rootData?.slug || row.slug || '')].filter(Boolean));
  return result;
};

const findNestedCategoryEntity = async (key: string): Promise<SeoEntity | null> => {
  const lookup = key.startsWith('sub:') ? key : key;
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT id, slug, name_fa, description, data_json, updated_at FROM categories WHERE is_active = 1'
  );
  for (const row of rows) {
    const nested = nestedCategoryEntitiesFromRow(row);
    const match = nested.find(entity =>
      entity.id === lookup ||
      entity.id === 'sub:' + lookup ||
      entity.slug === lookup ||
      entity.data?.id === lookup
    );
    if (match) return match;
  }
  return null;
};

export const loadEntity = async (type: SeoEntityType, idOrSlug: string): Promise<SeoEntity | null> => {
  const key = String(idOrSlug || '').trim();
  if (!key) return null;
  let sql = '';
  if (type === 'product') sql = "SELECT id, slug, name_fa, short_description, description, data_json, updated_at FROM products WHERE status = 'active' AND (id = ? OR slug = ?) LIMIT 1";
  else if (type === 'article') sql = 'SELECT id, slug, title, data_json, updated_at FROM articles WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';
  else if (type === 'category') sql = 'SELECT id, slug, name_fa, description, data_json, updated_at FROM categories WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';
  else if (type === 'page') sql = 'SELECT id, slug, title, data_json, updated_at FROM site_pages WHERE id = ? OR slug = ? LIMIT 1';
  else if (type === 'brand') sql = 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';
  else sql = 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_models WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';

  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(sql, [key, key]);
  if (rows[0]) return entityFromRow(type, rows[0]);
  if (type === 'category') return findNestedCategoryEntity(key);
  return null;
};

export const loadAllEntities = async (limitPerType = 5000): Promise<SeoEntity[]> => {
  const limit = Math.max(1, Math.min(20000, Number(limitPerType || 5000)));
  const queries: Array<[SeoEntityType, string]> = [
    ['product', "SELECT id, slug, name_fa, short_description, description, data_json, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC LIMIT " + limit],
    ['article', 'SELECT id, slug, title, data_json, updated_at FROM articles WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ' + limit],
    ['category', 'SELECT id, slug, name_fa, description, data_json, updated_at FROM categories WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ' + limit],
    ['page', 'SELECT id, slug, title, data_json, updated_at FROM site_pages ORDER BY updated_at DESC LIMIT ' + limit],
    ['brand', 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_brands WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ' + limit],
    ['model', 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_models WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ' + limit]
  ];
  const results = await Promise.all(queries.map(async ([type, sql]) => {
    const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(sql);
    if (type === 'category') {
      return rows.flatMap(row => [entityFromRow(type, row), ...nestedCategoryEntitiesFromRow(row)]);
    }
    return rows.map(row => entityFromRow(type, row));
  }));
  return results.flat();
};

export const listSeoEntities = async (options: {
  type?: SeoEntityType;
  q?: string;
  limit?: number;
  offset?: number;
}) => {
  const all = await loadAllEntities(Math.max(1000, Number(options.limit || 100) + Number(options.offset || 0)));
  const q = normalizeSeoText(options.q || '').toLocaleLowerCase('fa-IR');
  const filtered = all.filter(entity => {
    if (options.type && entity.type !== options.type) return false;
    if (!q) return true;
    return [entity.title, entity.slug, entity.description, entity.content].join(' ').toLocaleLowerCase('fa-IR').includes(q);
  });
  const offset = Math.max(0, Number(options.offset || 0));
  const limit = Math.max(1, Math.min(500, Number(options.limit || 100)));
  const page = filtered.slice(offset, offset + limit);
  const keys = page.map(entity => [entity.type, entity.id] as const);
  const metas = new Map<string, SeoMetaRecord>();
  for (const [type, id] of keys) {
    const meta = await getSeoMetaRecord(type, id);
    if (meta) metas.set(type + ':' + id, meta);
  }
  return {
    total: filtered.length,
    items: page.map(entity => ({
      ...entity,
      content: undefined,
      data: undefined,
      seo: metas.get(entity.type + ':' + entity.id) || deriveSeoMeta(entity)
    }))
  };
};

const rowToMeta = (row: SeoMetaRow): SeoMetaRecord => ({
  entityType: row.entity_type,
  entityId: row.entity_id,
  seoTitle: row.seo_title || '',
  metaDescription: row.meta_description || '',
  focusKeyword: row.focus_keyword || '',
  secondaryKeywords: parseJson<string[]>(row.secondary_keywords_json, []),
  canonicalUrl: row.canonical_url || '',
  robotsIndex: Boolean(row.robots_index),
  robotsFollow: Boolean(row.robots_follow),
  ogTitle: row.og_title || '',
  ogDescription: row.og_description || '',
  ogImageUrl: row.og_image_url || '',
  twitterTitle: row.twitter_title || '',
  twitterDescription: row.twitter_description || '',
  twitterImageUrl: row.twitter_image_url || '',
  schemaType: row.schema_type || '',
  cornerstone: Boolean(row.cornerstone),
  breadcrumbTitle: row.breadcrumb_title || '',
  hreflang: parseJson<Array<{ lang: string; url: string }>>(row.hreflang_json, []),
  score: Number(row.score || 0),
  analysis: parseJson<SeoAnalysis | null>(row.analysis_json, null)
});

export const getSeoMetaRecord = async (type: SeoEntityType, id: string): Promise<SeoMetaRecord | null> => {
  const [rows] = await pool.query<SeoMetaRow[]>(
    'SELECT * FROM seo_meta WHERE entity_type = ? AND entity_id = ? LIMIT 1',
    [type, id]
  );
  return rows[0] ? rowToMeta(rows[0]) : null;
};

const defaultSchemaType = (type: SeoEntityType): string => {
  if (type === 'product') return 'Product';
  if (type === 'article') return 'Article';
  if (type === 'category' || type === 'brand' || type === 'model') return 'CollectionPage';
  return 'WebPage';
};

export const deriveSeoMeta = (entity: SeoEntity): SeoMetaRecord => ({
  entityType: entity.type,
  entityId: entity.id,
  seoTitle: entity.title,
  metaDescription: (entity.description || normalizeSeoText(entity.content)).slice(0, 165),
  focusKeyword: '',
  secondaryKeywords: [],
  canonicalUrl: absoluteSiteUrl(entity.url),
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: entity.title,
  ogDescription: (entity.description || normalizeSeoText(entity.content)).slice(0, 165),
  ogImageUrl: entity.image || '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImageUrl: '',
  schemaType: defaultSchemaType(entity.type),
  cornerstone: false,
  breadcrumbTitle: entity.title,
  hreflang: [],
  score: 0,
  analysis: null
});

const words = (text: string): string[] =>
  normalizeSeoText(text)
    .toLocaleLowerCase('fa-IR')
    .split(/[\s,،.;؛:!?؟()[\]{}"'«»/\\|\-–—]+/)
    .map(value => value.trim())
    .filter(Boolean);

const countOccurrences = (text: string, needle: string): number => {
  const hay = normalizeSeoText(text).toLocaleLowerCase('fa-IR');
  const n = normalizeSeoText(needle).toLocaleLowerCase('fa-IR');
  if (!n) return 0;
  let count = 0;
  let from = 0;
  while (from < hay.length) {
    const index = hay.indexOf(n, from);
    if (index < 0) break;
    count += 1;
    from = index + Math.max(1, n.length);
  }
  return count;
};

const extractLinks = (html: string): { internal: string[]; external: string[] } => {
  const baseOrigin = new URL(config.appUrl).origin;
  const internal: string[] = [];
  const external: string[] = [];
  const regex = /href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(String(html || '')))) {
    const raw = match[1].trim();
    try {
      const url = new URL(raw, config.appUrl);
      if (url.origin === baseOrigin) internal.push(url.pathname + url.search);
      else external.push(url.toString());
    } catch {}
  }
  return { internal: Array.from(new Set(internal)), external: Array.from(new Set(external)) };
};

const headingCount = (html: string): number => {
  const matches = String(html || '').match(/<h[2-6]\b[^>]*>/gi);
  return matches?.length || 0;
};

const imageAltStats = (entity: SeoEntity): { total: number; missingAlt: number } => {
  const html = String(entity.content || '');
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = tags.filter(tag => {
    const match = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    return !match || !normalizeSeoText(match[2]);
  }).length;
  const structuredImages = entity.type === 'product' && Array.isArray(entity.data.images)
    ? entity.data.images.length
    : entity.image ? 1 : 0;
  return {
    total: Math.max(tags.length, structuredImages),
    // Product/gallery components generate alt from the entity title at render
    // time. Missing-alt here therefore refers only to raw HTML images.
    missingAlt
  };
};

const imageCount = (entity: SeoEntity): number => imageAltStats(entity).total;

const analysisCheck = (
  key: string,
  label: string,
  score: number,
  max: number,
  detail: string
): SeoAnalysisCheck => ({
  key,
  label,
  score: Math.max(0, Math.min(max, Math.round(score))),
  max,
  status: score >= max * 0.8 ? 'good' : score >= max * 0.35 ? 'warning' : 'bad',
  detail
});

export const analyzeSeoEntity = async (
  entity: SeoEntity,
  metaInput?: SeoMetaRecord | null
): Promise<SeoAnalysis> => {
  const settings = await getSeoSettings();
  const meta = metaInput || (await getSeoMetaRecord(entity.type, entity.id)) || deriveSeoMeta(entity);
  const title = meta.seoTitle || entity.title;
  const description = meta.metaDescription || entity.description;
  const contentText = normalizeSeoText(entity.content);
  const fullText = [entity.title, entity.description, contentText].join(' ');
  const wordList = words(contentText);
  const wordCount = wordList.length;
  const keyword = meta.focusKeyword.trim();
  const keywordOccurrences = keyword ? countOccurrences(fullText, keyword) : 0;
  const keywordWords = Math.max(1, words(keyword).length);
  const density = wordCount > 0 && keyword
    ? (keywordOccurrences * keywordWords / wordCount) * 100
    : 0;
  const links = extractLinks(entity.content);
  const headings = headingCount(entity.content);
  const imageStats = imageAltStats(entity);
  const images = imageStats.total;
  const minimumWords = entity.type === 'product'
    ? settings.scoring.productMinimumWords
    : entity.type === 'article'
      ? settings.scoring.articleMinimumWords
      : settings.scoring.pageMinimumWords;

  const checks: SeoAnalysisCheck[] = [];
  checks.push(analysisCheck(
    'title_length',
    'طول عنوان سئو',
    title.length >= 30 && title.length <= 65 ? 10 : title.length >= 18 && title.length <= 80 ? 6 : 2,
    10,
    'طول فعلی: ' + title.length + ' کاراکتر'
  ));
  checks.push(analysisCheck(
    'meta_description',
    'توضیحات متا',
    description.length >= 120 && description.length <= 170 ? 10 : description.length >= 70 && description.length <= 190 ? 6 : description ? 3 : 0,
    10,
    'طول فعلی: ' + description.length + ' کاراکتر'
  ));
  checks.push(analysisCheck(
    'focus_in_title',
    'کلمه کلیدی در عنوان',
    keyword && title.toLocaleLowerCase('fa-IR').includes(keyword.toLocaleLowerCase('fa-IR')) ? 12 : 0,
    12,
    keyword ? 'کلمه کلیدی هدف: ' + keyword : 'کلمه کلیدی هدف تعیین نشده است'
  ));
  checks.push(analysisCheck(
    'focus_in_description',
    'کلمه کلیدی در توضیحات متا',
    keyword && description.toLocaleLowerCase('fa-IR').includes(keyword.toLocaleLowerCase('fa-IR')) ? 8 : 0,
    8,
    keyword ? 'بررسی حضور عبارت هدف در متا' : 'ابتدا کلمه کلیدی هدف را تعیین کنید'
  ));
  checks.push(analysisCheck(
    'content_length',
    'حجم محتوای مفید',
    25 * Math.min(wordCount / Math.max(1, minimumWords), 1),
    25,
    wordCount + ' کلمه از حداقل پیشنهادی ' + minimumWords
  ));

  let densityScore = 0;
  if (keyword && wordCount > 0) {
    if (density >= settings.scoring.densityMin && density <= settings.scoring.densityMax) densityScore = 10;
    else if (density > 0 && density < settings.scoring.densityMin) densityScore = 5;
    else if (density <= settings.scoring.densityMax * 1.5) densityScore = 4;
  }
  checks.push(analysisCheck(
    'keyword_density',
    'تراکم کلمه کلیدی',
    densityScore,
    10,
    keyword ? density.toFixed(2) + '%' : 'بدون کلمه کلیدی هدف'
  ));
  checks.push(analysisCheck(
    'headings',
    'ساختار تیترها',
    entity.type === 'product' ? 5 : headings >= 3 ? 5 : headings > 0 ? 3 : 0,
    5,
    headings + ' تیتر H2 تا H6'
  ));
  const internalScore = entity.type === 'product' && links.internal.length === 0
    ? 10
    : links.internal.length >= 2 ? 10 : links.internal.length === 1 ? 6 : 0;
  checks.push(analysisCheck(
    'internal_links',
    'لینک‌سازی داخلی',
    internalScore,
    10,
    entity.type === 'product' && links.internal.length === 0
      ? 'محصول از جریمه نبود لینک داخلی معاف است'
      : links.internal.length + ' لینک داخلی'
  ));
  checks.push(analysisCheck(
    'images',
    'تصاویر و ALT',
    images <= 0 ? 0 : imageStats.missingAlt > 0 ? 3 : 5,
    5,
    images + ' تصویر شناسایی شد' + (imageStats.missingAlt ? '؛ ' + imageStats.missingAlt + ' تصویر HTML بدون ALT' : '؛ ALT قابل قبول')
  ));
  checks.push(analysisCheck(
    'indexability',
    'Canonical و ایندکس‌پذیری',
    meta.robotsIndex && Boolean(meta.canonicalUrl || entity.url) ? 5 : meta.robotsIndex ? 3 : 0,
    5,
    meta.robotsIndex ? 'قابل ایندکس' : 'noindex'
  ));

  const score = Math.max(0, Math.min(100, checks.reduce((sum, check) => sum + check.score, 0)));
  return {
    score,
    wordCount,
    keywordDensity: Number(density.toFixed(2)),
    checks,
    internalLinks: links.internal.length,
    externalLinks: links.external.length,
    headings,
    imageCount: images,
    missingImageAlt: imageStats.missingAlt
  };
};

const sanitizeMetaInput = (entity: SeoEntity, input: any, existing?: SeoMetaRecord | null): SeoMetaRecord => {
  const base = existing || deriveSeoMeta(entity);
  const hreflang = Array.isArray(input?.hreflang)
    ? input.hreflang
        .map((row: any) => ({ lang: String(row?.lang || '').trim().slice(0, 20), url: String(row?.url || '').trim() }))
        .filter((row: any) => row.lang && /^https?:\/\//i.test(row.url))
        .slice(0, 30)
    : base.hreflang;
  return {
    ...base,
    entityType: entity.type,
    entityId: entity.id,
    seoTitle: String(input?.seoTitle ?? base.seoTitle).trim().slice(0, 255),
    metaDescription: String(input?.metaDescription ?? base.metaDescription).trim().slice(0, 1000),
    focusKeyword: String(input?.focusKeyword ?? base.focusKeyword).trim().slice(0, 255),
    secondaryKeywords: safeStringArray(input?.secondaryKeywords ?? base.secondaryKeywords, 50),
    canonicalUrl: String(input?.canonicalUrl ?? base.canonicalUrl).trim().slice(0, 2000),
    robotsIndex: input?.robotsIndex === undefined ? base.robotsIndex : Boolean(input.robotsIndex),
    robotsFollow: input?.robotsFollow === undefined ? base.robotsFollow : Boolean(input.robotsFollow),
    ogTitle: String(input?.ogTitle ?? base.ogTitle).trim().slice(0, 255),
    ogDescription: String(input?.ogDescription ?? base.ogDescription).trim().slice(0, 1000),
    ogImageUrl: String(input?.ogImageUrl ?? base.ogImageUrl).trim().slice(0, 2000),
    twitterTitle: String(input?.twitterTitle ?? base.twitterTitle).trim().slice(0, 255),
    twitterDescription: String(input?.twitterDescription ?? base.twitterDescription).trim().slice(0, 1000),
    twitterImageUrl: String(input?.twitterImageUrl ?? base.twitterImageUrl).trim().slice(0, 2000),
    schemaType: String(input?.schemaType ?? base.schemaType).trim().slice(0, 80) || defaultSchemaType(entity.type),
    cornerstone: input?.cornerstone === undefined ? base.cornerstone : Boolean(input.cornerstone),
    breadcrumbTitle: String(input?.breadcrumbTitle ?? base.breadcrumbTitle).trim().slice(0, 255),
    hreflang,
    score: base.score,
    analysis: base.analysis
  };
};

export const writeSeoHistory = async (
  actorId: string | undefined,
  action: string,
  entityType: string | undefined,
  entityId: string | undefined,
  beforeValue: unknown,
  afterValue: unknown
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO seo_history (actor_id, action, entity_type, entity_id, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)',
    [
      actorId || null,
      action,
      entityType || null,
      entityId || null,
      beforeValue == null ? null : JSON.stringify(beforeValue),
      afterValue == null ? null : JSON.stringify(afterValue)
    ]
  );
  return Number(result.insertId);
};

export const saveSeoMeta = async (
  type: SeoEntityType,
  id: string,
  input: any,
  actorId?: string
): Promise<SeoMetaRecord> => {
  const entity = await loadEntity(type, id);
  if (!entity) throw new Error('SEO_ENTITY_NOT_FOUND');
  const before = await getSeoMetaRecord(type, entity.id);
  const meta = sanitizeMetaInput(entity, input, before);
  const analysis = await analyzeSeoEntity(entity, meta);
  meta.score = analysis.score;
  meta.analysis = analysis;

  await pool.execute(
    'INSERT INTO seo_meta (entity_type, entity_id, seo_title, meta_description, focus_keyword, secondary_keywords_json, canonical_url, robots_index, robots_follow, og_title, og_description, og_image_url, twitter_title, twitter_description, twitter_image_url, schema_type, cornerstone, breadcrumb_title, hreflang_json, score, analysis_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE seo_title = VALUES(seo_title), meta_description = VALUES(meta_description), focus_keyword = VALUES(focus_keyword), secondary_keywords_json = VALUES(secondary_keywords_json), canonical_url = VALUES(canonical_url), robots_index = VALUES(robots_index), robots_follow = VALUES(robots_follow), og_title = VALUES(og_title), og_description = VALUES(og_description), og_image_url = VALUES(og_image_url), twitter_title = VALUES(twitter_title), twitter_description = VALUES(twitter_description), twitter_image_url = VALUES(twitter_image_url), schema_type = VALUES(schema_type), cornerstone = VALUES(cornerstone), breadcrumb_title = VALUES(breadcrumb_title), hreflang_json = VALUES(hreflang_json), score = VALUES(score), analysis_json = VALUES(analysis_json), updated_at = NOW()',
    [
      meta.entityType,
      meta.entityId,
      meta.seoTitle || null,
      meta.metaDescription || null,
      meta.focusKeyword || null,
      JSON.stringify(meta.secondaryKeywords),
      meta.canonicalUrl || null,
      meta.robotsIndex ? 1 : 0,
      meta.robotsFollow ? 1 : 0,
      meta.ogTitle || null,
      meta.ogDescription || null,
      meta.ogImageUrl || null,
      meta.twitterTitle || null,
      meta.twitterDescription || null,
      meta.twitterImageUrl || null,
      meta.schemaType || null,
      meta.cornerstone ? 1 : 0,
      meta.breadcrumbTitle || null,
      JSON.stringify(meta.hreflang),
      meta.score,
      JSON.stringify(meta.analysis)
    ]
  );

  await writeSeoHistory(actorId, 'seo_meta_update', type, entity.id, before, meta);
  await markSeoGraphStale('seo_meta_update');
  return meta;
};

export const getSeoWorkspace = async (type: SeoEntityType, id: string) => {
  const entity = await loadEntity(type, id);
  if (!entity) return null;
  const stored = await getSeoMetaRecord(type, entity.id);
  const meta = stored || deriveSeoMeta(entity);
  const analysis = await analyzeSeoEntity(entity, meta);
  return { entity, meta: { ...meta, score: analysis.score, analysis }, analysis };
};

const STOPWORDS = new Set([
  'برای','این','آن','های','هایش','است','هست','شد','شود','شده','کرد','کنید','با','به','از','در','و','یا','که','یک','را','روی','تا','اگر','اما','هم','هر',
  'the','and','for','with','from','this','that','are','was','were','you','your','into','our','has','have','will','not'
]);

const semanticTokens = (text: string): string[] => {
  const counts = new Map<string, number>();
  for (const token of words(text)) {
    const normalized = token.replace(/[^\p{L}\p{N}]+/gu, '');
    if (normalized.length < 3 || STOPWORDS.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([token]) => token);
};

const nodeKey = (entity: Pick<SeoEntity, 'type' | 'id'>): string => entity.type + ':' + entity.id;

const edgeScore = (
  a: { entity: SeoEntity; meta: SeoMetaRecord; tokens: Set<string> },
  b: { entity: SeoEntity; meta: SeoMetaRecord; tokens: Set<string> }
) => {
  const shared = Array.from(a.tokens).filter(token => b.tokens.has(token));
  const unionSize = new Set([...a.tokens, ...b.tokens]).size || 1;
  let score = Math.round((shared.length / unionSize) * 50);
  const reasons: string[] = [];
  const signals: Record<string, any> = { sharedTokens: shared.slice(0, 20) };

  const aFocus = normalizeSeoText(a.meta.focusKeyword).toLocaleLowerCase('fa-IR');
  const bFocus = normalizeSeoText(b.meta.focusKeyword).toLocaleLowerCase('fa-IR');
  if (aFocus && bFocus && (aFocus === bFocus || aFocus.includes(bFocus) || bFocus.includes(aFocus))) {
    score += 25;
    reasons.push('هم‌پوشانی کلمه کلیدی هدف');
  }
  const taxonomyShared = a.entity.taxonomy.filter(term => b.entity.taxonomy.includes(term));
  if (taxonomyShared.length) {
    score += Math.min(15, 5 + taxonomyShared.length * 3);
    reasons.push('زمینه دسته‌بندی/خودرو مشترک');
    signals.taxonomyShared = taxonomyShared;
  }
  const aTitle = a.entity.title.toLocaleLowerCase('fa-IR');
  const bTitle = b.entity.title.toLocaleLowerCase('fa-IR');
  if (aTitle && bTitle && (aTitle.includes(bTitle) || bTitle.includes(aTitle))) {
    score += 10;
    reasons.push('ارتباط مستقیم عنوان');
  }
  const crossArticleProduct =
    (a.entity.type === 'article' && b.entity.type === 'product') ||
    (a.entity.type === 'product' && b.entity.type === 'article');
  if (crossArticleProduct && shared.length >= 2) {
    score += 8;
    reasons.push('رابطه محتوای آموزشی و محصول');
  }

  const relatedA = [
    ...(Array.isArray(a.entity.data.relatedProductIds) ? a.entity.data.relatedProductIds : []),
    ...(Array.isArray(a.entity.data.relatedPartIds) ? a.entity.data.relatedPartIds : []),
    ...(Array.isArray(a.entity.data.complementPartIds) ? a.entity.data.complementPartIds : [])
  ].map(String);
  if (relatedA.includes(b.entity.id)) {
    score += 20;
    reasons.push('ارتباط صریح ثبت‌شده');
  }

  score = Math.min(100, score);
  return {
    score,
    confidence: (score >= 80 ? 'high' : score >= 62 ? 'medium' : 'review') as SeoConfidence,
    reasons,
    signals
  };
};

export const markSeoGraphStale = async (reason: string): Promise<void> => {
  const state = await readAppSetting<any>('takrank_seo_graph_state', {});
  await writeAppSetting('takrank_seo_graph_state', {
    ...state,
    stale: true,
    staleReason: reason,
    staleAt: new Date().toISOString()
  });
};

export const rebuildSeoKnowledgeGraph = async (): Promise<any> => {
  const entities = await loadAllEntities(12000);
  const metaRows = new Map<string, SeoMetaRecord>();
  for (const entity of entities) {
    const stored = await getSeoMetaRecord(entity.type, entity.id);
    metaRows.set(nodeKey(entity), stored || deriveSeoMeta(entity));
  }

  const profiles = entities.map(entity => {
    const meta = metaRows.get(nodeKey(entity)) as SeoMetaRecord;
    const text = [entity.title, entity.description, entity.content, meta.focusKeyword, ...meta.secondaryKeywords, ...entity.taxonomy].join(' ');
    return { entity, meta, tokens: new Set(semanticTokens(text)) };
  });

  const buildId = randomUUID();
  const tokenIndex = new Map<string, number[]>();
  profiles.forEach((profile, index) => {
    for (const token of profile.tokens) {
      const bucket = tokenIndex.get(token) || [];
      if (bucket.length < 120) bucket.push(index);
      tokenIndex.set(token, bucket);
    }
  });

  const pairKeys = new Set<string>();
  for (const indexes of tokenIndex.values()) {
    if (indexes.length > 80) continue;
    for (let i = 0; i < indexes.length; i += 1) {
      for (let j = i + 1; j < indexes.length; j += 1) {
        const a = Math.min(indexes[i], indexes[j]);
        const b = Math.max(indexes[i], indexes[j]);
        pairKeys.add(a + ':' + b);
      }
    }
  }

  let edgeCount = 0;
  await withTransaction(async connection => {
    await connection.query('DELETE FROM seo_knowledge_edges');
    await connection.query('DELETE FROM seo_knowledge_nodes');

    for (const profile of profiles) {
      const links = extractLinks(profile.entity.content);
      const headings = String(profile.entity.content || '').match(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi) || [];
      await connection.execute(
        'INSERT INTO seo_knowledge_nodes (entity_key, entity_type, entity_id, url_hash, url, title, seo_title, meta_description, focus_keyword, secondary_keywords_json, headings_json, taxonomy_json, tokens_json, entity_phrases_json, facts_json, flags_json, content_text, content_sample, internal_links_json, external_links_json, gsc_queries_json, content_hash, build_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nodeKey(profile.entity),
          profile.entity.type,
          profile.entity.id,
          sha256(profile.entity.url),
          profile.entity.url,
          profile.entity.title,
          profile.meta.seoTitle || null,
          profile.meta.metaDescription || null,
          profile.meta.focusKeyword || null,
          JSON.stringify(profile.meta.secondaryKeywords),
          JSON.stringify(headings.map(normalizeSeoText).slice(0, 50)),
          JSON.stringify(profile.entity.taxonomy),
          JSON.stringify(Array.from(profile.tokens)),
          JSON.stringify([profile.entity.title, profile.meta.focusKeyword, ...profile.meta.secondaryKeywords].filter(Boolean)),
          JSON.stringify({ description: profile.entity.description, updatedAt: profile.entity.updatedAt.toISOString() }),
          JSON.stringify({ cornerstone: profile.meta.cornerstone, schemaType: profile.meta.schemaType }),
          normalizeSeoText(profile.entity.content),
          normalizeSeoText(profile.entity.content).slice(0, 1200),
          JSON.stringify(links.internal),
          JSON.stringify(links.external),
          JSON.stringify([]),
          sha256([profile.entity.title, profile.entity.description, profile.entity.content].join('|')),
          buildId
        ]
      );
    }

    for (const pair of pairKeys) {
      const [aIndex, bIndex] = pair.split(':').map(Number);
      const a = profiles[aIndex];
      const b = profiles[bIndex];
      if (!a || !b) continue;
      const relation = edgeScore(a, b);
      if (relation.score < 50) continue;
      for (const [source, target] of [[a, b], [b, a]] as const) {
        await connection.execute(
          'INSERT INTO seo_knowledge_edges (source_key, target_key, relation, score, confidence, reasons_json, signals_json, build_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            nodeKey(source.entity),
            nodeKey(target.entity),
            source.entity.type === target.entity.type ? 'contextual' : 'cross_type',
            relation.score,
            relation.confidence,
            JSON.stringify(relation.reasons),
            JSON.stringify(relation.signals),
            buildId
          ]
        );
        edgeCount += 1;
      }
    }
  });

  const state = {
    ready: true,
    stale: false,
    buildId,
    builtAt: new Date().toISOString(),
    nodes: profiles.length,
    edges: edgeCount,
    minimumCandidateScore: 62
  };
  await writeAppSetting('takrank_seo_graph_state', state);
  await runtimeLog('info', 'graph_rebuilt', state);
  return state;
};

export const getSeoGraphState = async () =>
  readAppSetting<any>('takrank_seo_graph_state', { ready: false, stale: true, nodes: 0, edges: 0 });

interface LinkSuggestionRow extends RowDataPacket {
  score: number;
  confidence: SeoConfidence;
  relation: string;
  reasons_json: any;
  signals_json: any;
  entity_type: SeoEntityType;
  entity_id: string;
  url: string;
  title: string;
  focus_keyword: string | null;
  seo_title: string | null;
}

export const getInternalLinkSuggestions = async (
  sourceType: SeoEntityType,
  sourceId: string,
  limit = 5
) => {
  const key = sourceType + ':' + sourceId;
  const [rows] = await pool.query<LinkSuggestionRow[]>(
    'SELECT e.score, e.confidence, e.relation, e.reasons_json, e.signals_json, n.entity_type, n.entity_id, n.url, n.title, n.focus_keyword, n.seo_title FROM seo_knowledge_edges e JOIN seo_knowledge_nodes n ON n.entity_key = e.target_key WHERE e.source_key = ? AND e.score >= 62 ORDER BY e.score DESC LIMIT 50',
    [key]
  );
  const candidates = rows.map(row => ({
    targetType: row.entity_type,
    targetId: row.entity_id,
    url: row.url,
    title: row.seo_title || row.title,
    anchor: row.focus_keyword || row.title,
    score: Number(row.score),
    confidence: row.confidence,
    relation: row.relation,
    reasons: parseJson<string[]>(row.reasons_json, []),
    signals: parseJson<any>(row.signals_json, {})
  }));

  const wanted = Math.max(1, Math.min(10, Number(limit || 5)));
  let result = candidates.slice(0, wanted);
  if (sourceType !== 'product') {
    const productCandidates = candidates.filter(item => item.targetType === 'product').slice(0, 2);
    if (productCandidates.length >= 2) {
      const ids = new Set(result.map(item => item.targetType + ':' + item.targetId));
      for (const product of productCandidates) {
        const id = product.targetType + ':' + product.targetId;
        if (ids.has(id)) continue;
        const replaceIndex = result.map((item, index) => ({ item, index }))
          .filter(pair => pair.item.targetType !== 'product')
          .sort((a, b) => a.item.score - b.item.score)[0]?.index;
        if (replaceIndex !== undefined) result[replaceIndex] = product;
      }
      result = result.sort((a, b) => b.score - a.score);
    }
  }
  return result.slice(0, wanted);
};

const updateEntityMainContent = async (entity: SeoEntity, html: string): Promise<void> => {
  if (entity.type === 'article') {
    const next = { ...entity.data, content: html };
    await pool.execute(
      'UPDATE articles SET data_json = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(next), entity.id]
    );
    return;
  }
  if (entity.type === 'product') {
    const next = { ...entity.data, description: html };
    await pool.execute(
      'UPDATE products SET description = ?, data_json = ?, updated_at = NOW() WHERE id = ?',
      [html, JSON.stringify(next), entity.id]
    );
    return;
  }
  throw new Error('SEO_LINK_APPLY_UNSUPPORTED_ENTITY');
};

const escapeHtmlAttribute = (value: string): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const optimizeEntityImageAlt = async (
  type: SeoEntityType,
  id: string,
  actorId?: string
) => {
  const entity = await loadEntity(type, id);
  if (!entity) throw new Error('SEO_ENTITY_NOT_FOUND');
  if (!['article', 'product'].includes(entity.type)) throw new Error('IMAGE_SEO_ENTITY_UNSUPPORTED');

  const meta = (await getSeoMetaRecord(entity.type, entity.id)) || deriveSeoMeta(entity);
  const baseAlt = normalizeSeoText(meta.focusKeyword || entity.title).slice(0, 180) || 'تصویر';
  const before = String(entity.content || '');
  let changed = 0;
  let sequence = 0;

  const after = before.replace(/<img\b[^>]*>/gi, tag => {
    sequence += 1;
    const current = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    if (current && normalizeSeoText(current[2])) return tag;
    const alt = escapeHtmlAttribute(baseAlt + (sequence > 1 ? ' - ' + sequence : ''));
    changed += 1;
    if (current) {
      return tag.replace(/\balt\s*=\s*(["'])(.*?)\1/i, 'alt="' + alt + '"');
    }
    return tag.replace(/\s*\/>$/, ' alt="' + alt + '" />').replace(/\s*>$/, ' alt="' + alt + '">');
  });

  if (changed > 0) {
    await updateEntityMainContent(entity, after);
    await writeSeoHistory(actorId, 'image_alt_optimize', entity.type, entity.id, { content: before }, { content: after, changed });
    await markSeoGraphStale('image_alt_optimize');
  }
  return { ok: true, changed, content: after };
};

const headingSlug = (text: string, index: number): string => {
  const normalized = normalizeSeoText(text)
    .toLocaleLowerCase('fa-IR')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || 'section-' + (index + 1);
};

export const buildEntityToc = async (
  type: SeoEntityType,
  id: string,
  apply = false,
  actorId?: string
) => {
  const entity = await loadEntity(type, id);
  if (!entity) throw new Error('SEO_ENTITY_NOT_FOUND');
  if (!['article', 'product'].includes(entity.type)) throw new Error('TOC_ENTITY_UNSUPPORTED');

  const settings = await getSeoSettings();
  if (!settings.modules.toc || !settings.toc.enabled) throw new Error('TOC_DISABLED');

  const before = String(entity.content || '');
  const withoutOldToc = before.replace(/<nav\b[^>]*data-takrank-toc=["']1["'][^>]*>[\s\S]*?<\/nav>\s*/gi, '');
  const headingMatches = Array.from(withoutOldToc.matchAll(/<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi));
  const wordCount = words(withoutOldToc).length;

  if (headingMatches.length < Number(settings.toc.minimumHeadings || 3)) {
    throw new Error('TOC_NOT_ENOUGH_HEADINGS');
  }
  if (wordCount < Number(settings.toc.minimumWords || 700)) {
    throw new Error('TOC_CONTENT_TOO_SHORT');
  }

  const used = new Set<string>();
  const items: Array<{ level: number; id: string; title: string }> = [];
  let rebuilt = '';
  let cursor = 0;

  headingMatches.forEach((match, index) => {
    const start = match.index ?? 0;
    rebuilt += withoutOldToc.slice(cursor, start);
    const level = Number(match[1]);
    const attrs = String(match[2] || '');
    const title = normalizeSeoText(match[3]);
    const existingId = attrs.match(/\bid\s*=\s*(["'])(.*?)\1/i)?.[2];
    let headingId = existingId || headingSlug(title, index);
    let suffix = 2;
    while (used.has(headingId)) headingId = headingSlug(title, index) + '-' + suffix++;
    used.add(headingId);
    const nextAttrs = existingId ? attrs : attrs + ' id="' + escapeHtmlAttribute(headingId) + '"';
    rebuilt += '<h' + level + nextAttrs + '>' + match[3] + '</h' + level + '>';
    cursor = start + match[0].length;
    items.push({ level, id: headingId, title });
  });
  rebuilt += withoutOldToc.slice(cursor);

  const links = items.map(item =>
    '<li data-level="' + item.level + '" style="margin-right:' + Math.max(0, item.level - 2) * 14 + 'px">' +
      '<a href="#' + escapeHtmlAttribute(item.id) + '">' + escapeHtmlAttribute(item.title) + '</a></li>'
  ).join('');

  const body = settings.toc.collapsed
    ? '<details><summary>فهرست مطالب</summary><ol>' + links + '</ol></details>'
    : '<div><strong>فهرست مطالب</strong><ol>' + links + '</ol></div>';
  const tocHtml = '<nav data-takrank-toc="1" aria-label="فهرست مطالب">' + body + '</nav>';
  const firstHeadingIndex = rebuilt.search(/<h[2-4]\b/i);
  const finalHtml = firstHeadingIndex >= 0
    ? rebuilt.slice(0, firstHeadingIndex) + tocHtml + rebuilt.slice(firstHeadingIndex)
    : tocHtml + rebuilt;

  if (apply) {
    await updateEntityMainContent(entity, finalHtml);
    await writeSeoHistory(actorId, 'toc_apply', entity.type, entity.id, { content: before }, { content: finalHtml, items });
    await markSeoGraphStale('toc_apply');
  }

  return { ok: true, applied: apply, items, tocHtml, content: finalHtml };
};

const sanitizeAnchor = (value: string): string =>
  normalizeSeoText(value).replace(/[<>]/g, '').slice(0, 180);

export const applyInternalLink = async (options: {
  sourceType: SeoEntityType;
  sourceId: string;
  targetType: SeoEntityType;
  targetId: string;
  anchor?: string;
  mode?: 'text' | 'box';
  actorId?: string;
}) => {
  const source = await loadEntity(options.sourceType, options.sourceId);
  const target = await loadEntity(options.targetType, options.targetId);
  if (!source || !target) throw new Error('SEO_LINK_ENTITY_NOT_FOUND');

  const suggestions = await getInternalLinkSuggestions(source.type, source.id, 50);
  const valid = suggestions.find(item => item.targetType === target.type && item.targetId === target.id);
  if (!valid || valid.score < 62) throw new Error('SEO_LINK_RELATION_NOT_VALID');

  const before = String(source.content || '');
  const anchor = sanitizeAnchor(options.anchor || valid.anchor || target.title);
  const href = target.url;
  const link = '<a href="' + href + '" target="_blank" rel="noopener">' + anchor + '</a>';
  let after = before;

  if ((options.mode || 'text') === 'box') {
    const paragraphs = Array.from(before.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi));
    if (!paragraphs.length) throw new Error('SEO_LINK_NO_SAFE_PARAGRAPH');
    const existingBoxes = (before.match(/data-takrank-link-box/gi) || []).length;
    const safeIndex = Math.min(paragraphs.length - 1, Math.max(0, existingBoxes * 2 + 1));
    const selected = paragraphs[safeIndex];
    if (!selected || selected.index === undefined) throw new Error('SEO_LINK_NO_SAFE_PARAGRAPH');
    const insertAt = selected.index + selected[0].length;
    const box = '<div data-takrank-link-box="1" style="border:1px solid #dbeafe;background:#eff6ff;padding:14px 16px;border-radius:14px;margin:18px 0"><strong>مطالعه مرتبط: </strong>' + link + '</div>';
    after = before.slice(0, insertAt) + box + before.slice(insertAt);
  } else {
    const paragraphs = Array.from(before.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi));
    if (!paragraphs.length) throw new Error('SEO_LINK_NO_SAFE_PARAGRAPH');
    const selected = paragraphs[Math.min(1, paragraphs.length - 1)];
    if (!selected || selected.index === undefined) throw new Error('SEO_LINK_NO_SAFE_PARAGRAPH');
    const insertAt = selected.index + selected[0].length;
    after = before.slice(0, insertAt) + '<p><strong>پیشنهاد مرتبط: </strong>' + link + '</p>' + before.slice(insertAt);
  }

  await updateEntityMainContent(source, after);
  const historyId = await writeSeoHistory(
    options.actorId,
    'internal_link_apply',
    source.type,
    source.id,
    { content: before },
    { content: after, targetType: target.type, targetId: target.id, href, anchor }
  );
  await markSeoGraphStale('internal_link_apply');
  return { ok: true, historyId, content: after };
};

export const undoInternalLink = async (historyId: number, actorId?: string) => {
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: number;
    entity_type: SeoEntityType;
    entity_id: string;
    before_json: any;
    after_json: any;
  }>>(
    "SELECT id, entity_type, entity_id, before_json, after_json FROM seo_history WHERE id = ? AND action = 'internal_link_apply' LIMIT 1",
    [historyId]
  );
  const row = rows[0];
  if (!row) throw new Error('SEO_HISTORY_NOT_FOUND');
  const entity = await loadEntity(row.entity_type, row.entity_id);
  if (!entity) throw new Error('SEO_ENTITY_NOT_FOUND');
  const before = parseJson<any>(row.before_json, {});
  if (typeof before.content !== 'string') throw new Error('SEO_HISTORY_INVALID');
  const current = entity.content;
  await updateEntityMainContent(entity, before.content);
  await writeSeoHistory(actorId, 'internal_link_undo', entity.type, entity.id, { content: current }, { content: before.content, sourceHistoryId: historyId });
  await markSeoGraphStale('internal_link_undo');
  return { ok: true };
};

const severityRank = (severity: SeoSeverity): number =>
  severity === 'critical' ? 4 : severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;

export const upsertSeoIssue = async (issue: {
  issueKey: string;
  entityType?: SeoEntityType;
  entityId?: string;
  url?: string;
  category?: string;
  severity: SeoSeverity;
  confidence?: SeoConfidence;
  title: string;
  details?: string;
  evidence?: any;
  action?: string;
}) => {
  await pool.execute(
    'INSERT INTO seo_issues (issue_key, entity_type, entity_id, url, category, severity, confidence, title, details, evidence_json, action_text, status, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'open\', NOW(), NOW()) ON DUPLICATE KEY UPDATE entity_type = VALUES(entity_type), entity_id = VALUES(entity_id), url = VALUES(url), category = VALUES(category), severity = VALUES(severity), confidence = VALUES(confidence), title = VALUES(title), details = VALUES(details), evidence_json = VALUES(evidence_json), action_text = VALUES(action_text), last_seen = NOW(), status = CASE WHEN status = \'resolved\' THEN \'open\' ELSE status END, resolved_at = NULL',
    [
      issue.issueKey,
      issue.entityType || null,
      issue.entityId || null,
      issue.url || null,
      issue.category || 'content',
      issue.severity,
      issue.confidence || 'medium',
      issue.title,
      issue.details || null,
      issue.evidence == null ? null : JSON.stringify(issue.evidence),
      issue.action || null
    ]
  );
};

export const runFullSeoAudit = async (actorId?: string) => {
  const startedAt = new Date();
  const settings = await getSeoSettings();
  const entities = await loadAllEntities(12000);
  let issueCount = 0;
  const focusOwners = new Map<string, SeoEntity[]>();

  for (const entity of entities) {
    const stored = await getSeoMetaRecord(entity.type, entity.id);
    const meta = stored || deriveSeoMeta(entity);
    const analysis = await analyzeSeoEntity(entity, meta);

    if (stored) {
      await pool.execute(
        'UPDATE seo_meta SET score = ?, analysis_json = ?, updated_at = NOW() WHERE entity_type = ? AND entity_id = ?',
        [analysis.score, JSON.stringify(analysis), entity.type, entity.id]
      );
    }

    if (analysis.score < 55) {
      await upsertSeoIssue({
        issueKey: 'score:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'content',
        severity: analysis.score < 30 ? 'high' : 'medium',
        confidence: 'high',
        title: 'امتیاز سئوی پایین: ' + entity.title,
        details: 'امتیاز فعلی ' + analysis.score + ' از 100 است.',
        evidence: analysis,
        action: 'موارد قرمز تحلیل محتوا و متادیتا را اصلاح کنید.'
      });
      issueCount += 1;
    }

    if (!meta.focusKeyword) {
      await upsertSeoIssue({
        issueKey: 'focus_missing:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'keyword',
        severity: entity.type === 'product' || entity.type === 'article' ? 'medium' : 'low',
        confidence: 'high',
        title: 'کلمه کلیدی هدف تعیین نشده',
        details: entity.title,
        action: 'یک عبارت اصلی متناسب با قصد جستجوی این URL تعیین کنید.'
      });
      issueCount += 1;
    } else {
      const key = meta.focusKeyword.toLocaleLowerCase('fa-IR').trim();
      const owners = focusOwners.get(key) || [];
      owners.push(entity);
      focusOwners.set(key, owners);
    }

    if (analysis.imageCount === 0 && (entity.type === 'product' || entity.type === 'article')) {
      await upsertSeoIssue({
        issueKey: 'image_missing:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'image',
        severity: 'medium',
        confidence: 'high',
        title: 'تصویر اصلی یا محتوایی وجود ندارد',
        details: entity.title,
        action: 'حداقل یک تصویر مرتبط با ALT توصیفی اضافه کنید.'
      });
      issueCount += 1;
    }

    if (analysis.missingImageAlt > 0 && (entity.type === 'product' || entity.type === 'article')) {
      await upsertSeoIssue({
        issueKey: 'image_alt_missing:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'image',
        severity: 'medium',
        confidence: 'high',
        title: 'تصاویر HTML بدون ALT توصیفی',
        details: analysis.missingImageAlt + ' تصویر داخل محتوا ALT مناسب ندارد.',
        evidence: { missingAlt: analysis.missingImageAlt, imageCount: analysis.imageCount },
        action: 'از ابزار Image SEO برای تکمیل فقط ALTهای خالی استفاده کنید؛ ALTهای موجود بازنویسی نمی‌شوند.'
      });
      issueCount += 1;
    }

    if (
      settings.modules.toc &&
      settings.toc.enabled &&
      entity.type === 'article' &&
      analysis.wordCount >= settings.toc.minimumWords &&
      analysis.headings >= settings.toc.minimumHeadings &&
      !/data-takrank-toc=["']1["']/i.test(String(entity.content || ''))
    ) {
      await upsertSeoIssue({
        issueKey: 'toc_missing:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'content',
        severity: 'low',
        confidence: 'high',
        title: 'مقاله طولانی بدون فهرست مطالب',
        details: analysis.wordCount + ' کلمه و ' + analysis.headings + ' تیتر شناسایی شد.',
        action: 'TOC هوشمند را از Workspace همین مقاله ایجاد کنید.'
      });
      issueCount += 1;
    }

    if (!meta.robotsIndex) {
      await upsertSeoIssue({
        issueKey: 'noindex:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'technical',
        severity: meta.cornerstone ? 'high' : 'low',
        confidence: 'high',
        title: 'URL روی noindex قرار دارد',
        details: entity.title,
        action: meta.cornerstone ? 'برای محتوای Cornerstone وضعیت ایندکس را فوراً بررسی کنید.' : 'در صورت عمدی بودن، این مورد را ببندید.'
      });
      issueCount += 1;
    }

    if (meta.schemaType === 'Product' && entity.type !== 'product') {
      await upsertSeoIssue({
        issueKey: 'schema_mismatch:' + entity.type + ':' + entity.id,
        entityType: entity.type,
        entityId: entity.id,
        url: entity.url,
        category: 'schema',
        severity: 'medium',
        confidence: 'high',
        title: 'نوع Schema با نوع محتوا همخوان نیست',
        details: 'Schema فعلی Product است اما این موجودیت محصول نیست.',
        action: 'نوع Schema را به Article، WebPage یا CollectionPage متناسب با محتوا تغییر دهید.'
      });
      issueCount += 1;
    }
  }

  for (const [keyword, owners] of focusOwners.entries()) {
    if (owners.length < 2) continue;
    const allProducts = owners.every(entity => entity.type === 'product');
    const severity: SeoSeverity = allProducts ? 'low' : owners.length >= 3 ? 'high' : 'medium';
    const fingerprint = sha256(owners.map(item => item.type + ':' + item.id).sort().join('|'));
    await upsertSeoIssue({
      issueKey: 'keyword_overlap:' + sha256(keyword).slice(0, 24),
      category: 'cannibalization',
      severity,
      confidence: allProducts ? 'review' : 'medium',
      title: 'هم‌پوشانی عبارت هدف: ' + keyword,
      details: owners.length + ' URL روی یک عبارت هدف تنظیم شده‌اند.',
      evidence: {
        keyword,
        fingerprint,
        urls: owners.map(item => ({ type: item.type, id: item.id, title: item.title, url: item.url }))
      },
      action: allProducts
        ? 'اگر محصولات واقعاً متفاوت هستند آن‌ها را جدا نگه دارید؛ صرف اشتراک عبارت دلیل ادغام یا ریدایرکت نیست.'
        : 'قصد جستجو و URL مالک عبارت را بررسی و در Keyword Map تثبیت کنید.'
    });
    issueCount += 1;
  }

  const startedSql = startedAt.toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    "UPDATE seo_issues SET status = 'resolved', resolved_at = NOW() WHERE status = 'open' AND last_seen < ?",
    [startedSql]
  );

  const graphState = await getSeoGraphState();
  if (!graphState.ready || graphState.stale) {
    await enqueueSeoJob('graph_rebuild', { reason: 'audit' });
  }

  const summary = {
    scanned: entities.length,
    issuesDetected: issueCount,
    finishedAt: new Date().toISOString()
  };
  await writeSeoHistory(actorId, 'full_audit', undefined, undefined, null, summary);
  await writeAppSetting('takrank_seo_last_audit', summary);
  await runtimeLog('info', 'audit_complete', summary);
  return summary;
};

export const listSeoIssues = async (options: {
  status?: string;
  severity?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) => {
  const clauses: string[] = ['1=1'];
  const params: any[] = [];
  if (options.status) { clauses.push('status = ?'); params.push(options.status); }
  if (options.severity) { clauses.push('severity = ?'); params.push(options.severity); }
  if (options.category) { clauses.push('category = ?'); params.push(options.category); }
  const limit = Math.max(1, Math.min(500, Number(options.limit || 100)));
  const offset = Math.max(0, Number(options.offset || 0));
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_issues WHERE ' + clauses.join(' AND ') + " ORDER BY FIELD(severity,'critical','high','medium','low'), last_seen DESC LIMIT " + limit + ' OFFSET ' + offset,
    params
  );
  return rows.map(row => ({
    id: Number(row.id),
    issueKey: row.issue_key,
    entityType: row.entity_type,
    entityId: row.entity_id,
    url: row.url,
    category: row.category,
    severity: row.severity,
    confidence: row.confidence,
    title: row.title,
    details: row.details,
    evidence: parseJson(row.evidence_json, null),
    action: row.action_text,
    status: row.status,
    snoozeUntil: row.snooze_until,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    resolvedAt: row.resolved_at
  }));
};

export const setSeoIssueState = async (
  id: number,
  state: 'open' | 'resolved' | 'ignored' | 'snoozed',
  snoozeHours = 0
) => {
  const snoozeUntil = state === 'snoozed' && snoozeHours > 0
    ? new Date(Date.now() + Math.min(24 * 365, snoozeHours) * 3600000)
    : null;
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE seo_issues SET status = ?, snooze_until = ?, resolved_at = ?, last_seen = NOW() WHERE id = ?',
    [state, snoozeUntil, state === 'resolved' ? new Date() : null, id]
  );
  if (!result.affectedRows) throw new Error('SEO_ISSUE_NOT_FOUND');
  return { ok: true };
};

export const verifySeoIssue = async (id: number) => {
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_issues WHERE id = ? LIMIT 1',
    [id]
  );
  const issue = rows[0];
  if (!issue) throw new Error('SEO_ISSUE_NOT_FOUND');
  if (!issue.entity_type || !issue.entity_id || !isSeoEntityType(issue.entity_type)) {
    return { resolved: false, message: 'این مورد برای تأیید مجدد نیاز به اجرای Audit دارد.' };
  }
  const workspace = await getSeoWorkspace(issue.entity_type, issue.entity_id);
  if (!workspace) {
    await setSeoIssueState(id, 'resolved');
    return { resolved: true, message: 'موجودیت دیگر وجود ندارد.' };
  }
  const stillLow = String(issue.issue_key).startsWith('score:') && workspace.analysis.score < 55;
  const focusMissing = String(issue.issue_key).startsWith('focus_missing:') && !workspace.meta.focusKeyword;
  const imageMissing = String(issue.issue_key).startsWith('image_missing:') && workspace.analysis.imageCount === 0;
  const imageAltMissing = String(issue.issue_key).startsWith('image_alt_missing:') && workspace.analysis.missingImageAlt > 0;
  const tocMissing = String(issue.issue_key).startsWith('toc_missing:') && !/data-takrank-toc=["']1["']/i.test(String(workspace.entity.content || ''));
  const noindex = String(issue.issue_key).startsWith('noindex:') && !workspace.meta.robotsIndex;
  const stillOpen = stillLow || focusMissing || imageMissing || imageAltMissing || tocMissing || noindex;
  if (!stillOpen) await setSeoIssueState(id, 'resolved');
  return { resolved: !stillOpen, analysis: workspace.analysis };
};

export const getActionCenter = async () => {
  const issues = await listSeoIssues({ status: 'open', limit: 250 });
  const now = Date.now();
  const active = issues.filter((issue: any) => !issue.snoozeUntil || new Date(issue.snoozeUntil).getTime() <= now);
  const sorted = [...active].sort((a: any, b: any) => {
    const severity = severityRank(b.severity) - severityRank(a.severity);
    if (severity) return severity;
    const confidence = (b.confidence === 'high' ? 3 : b.confidence === 'medium' ? 2 : 1) -
      (a.confidence === 'high' ? 3 : a.confidence === 'medium' ? 2 : 1);
    return confidence;
  });
  return {
    total: sorted.length,
    critical: sorted.filter((item: any) => item.severity === 'critical').length,
    high: sorted.filter((item: any) => item.severity === 'high').length,
    medium: sorted.filter((item: any) => item.severity === 'medium').length,
    low: sorted.filter((item: any) => item.severity === 'low').length,
    items: sorted.slice(0, 100)
  };
};

const redirectPatternIsSafe = (pattern: string): boolean => {
  if (!pattern || pattern.length > 220) return false;
  if (/\([^)]*[+*][^)]*\)[+*{]/.test(pattern)) return false;
  if (/\.{2,}\*/.test(pattern)) return false;
  try { new RegExp(pattern); return true; } catch { return false; }
};

export const listSeoRedirects = async () => {
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_redirects ORDER BY updated_at DESC LIMIT 5000'
  );
  return rows.map(row => ({
    id: Number(row.id),
    source: row.source,
    target: row.target || '',
    matchType: row.match_type,
    statusCode: Number(row.status_code),
    hits: Number(row.hits),
    lastHit: row.last_hit,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at
  }));
};

export const saveSeoRedirect = async (input: any) => {
  const source = String(input?.source || '').trim();
  const target = String(input?.target || '').trim();
  const matchType = input?.matchType === 'regex' ? 'regex' : 'exact';
  const statusCode = [301, 302, 307, 308, 410].includes(Number(input?.statusCode)) ? Number(input.statusCode) : 301;
  if (!source || (statusCode !== 410 && !target)) throw new Error('SEO_REDIRECT_INVALID');
  if (matchType === 'regex' && !redirectPatternIsSafe(source)) throw new Error('SEO_REDIRECT_REGEX_UNSAFE');
  const normalizedSource = matchType === 'exact' ? normalizePath(source) : source;
  const normalizedTarget = statusCode === 410 ? '' : target;
  if (statusCode !== 410 && normalizePath(normalizedTarget) === normalizePath(normalizedSource)) {
    throw new Error('SEO_REDIRECT_LOOP');
  }
  const key = sha256(normalizedSource);
  await pool.execute(
    'INSERT INTO seo_redirects (source, source_key, target, match_type, status_code, enabled) VALUES (?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE target = VALUES(target), status_code = VALUES(status_code), enabled = 1, updated_at = NOW()',
    [normalizedSource, key, normalizedTarget || null, matchType, statusCode]
  );
  return { ok: true };
};

export const updateSeoRedirectState = async (id: number, enabled: boolean) => {
  await pool.execute('UPDATE seo_redirects SET enabled = ?, updated_at = NOW() WHERE id = ?', [enabled ? 1 : 0, id]);
  return { ok: true };
};

export const deleteSeoRedirect = async (id: number) => {
  await pool.execute('DELETE FROM seo_redirects WHERE id = ?', [id]);
  return { ok: true };
};

export const seoRedirectMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { next(); return; }
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) { next(); return; }
    const settings = await getSeoSettings();
    if (!settings.modules.redirects) { next(); return; }
    const source = normalizePath(req.originalUrl || req.url);
    const key = sha256(source);
    const [exactRows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
      "SELECT * FROM seo_redirects WHERE enabled = 1 AND match_type = 'exact' AND source_key = ? LIMIT 1",
      [key]
    );
    let rule = exactRows[0];
    let destination = rule?.target || '';

    if (!rule) {
      const [regexRows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
        "SELECT * FROM seo_redirects WHERE enabled = 1 AND match_type = 'regex' ORDER BY id ASC LIMIT 200"
      );
      for (const candidate of regexRows) {
        if (!redirectPatternIsSafe(String(candidate.source))) continue;
        const regex = new RegExp(String(candidate.source));
        if (regex.test(source)) {
          rule = candidate;
          destination = source.replace(regex, String(candidate.target || ''));
          break;
        }
      }
    }

    if (!rule) { next(); return; }
    void pool.execute('UPDATE seo_redirects SET hits = hits + 1, last_hit = NOW() WHERE id = ?', [rule.id]).catch(() => undefined);
    const statusCode = Number(rule.status_code || 301);
    if (statusCode === 410) {
      res.status(410).send('Gone');
      return;
    }
    const finalTarget = /^https?:\/\//i.test(destination)
      ? destination
      : normalizePath(destination);
    res.redirect(statusCode, finalTarget);
  } catch (error) {
    next(error);
  }
};

const classify404 = (url: string, userAgent: string): string => {
  const value = (url + ' ' + userAgent).toLowerCase();
  if (/wp-admin|wp-login|xmlrpc|\.env|phpmyadmin|\.git|cgi-bin/.test(value)) return 'scanner_noise';
  if (/\.(css|js|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf)(\?|$)/.test(value)) return 'missing_asset';
  if (/bot|crawler|spider|scanner/.test(value)) return 'bot_request';
  return 'content_candidate';
};

export const recordSeo404 = async (req: Request): Promise<void> => {
  const settings = await getSeoSettings();
  if (!settings.modules.monitor404) return;
  const url = normalizePath(req.originalUrl || req.url);
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) return;
  const ua = String(req.headers['user-agent'] || '').slice(0, 255);
  const referrer = String(req.headers.referer || req.headers.referrer || '').slice(0, 2000);
  const classification = classify404(url, ua);
  await pool.execute(
    'INSERT INTO seo_404 (url_hash, url, referrer, user_agent, hits, first_seen, last_seen, classification) VALUES (?, ?, ?, ?, 1, NOW(), NOW(), ?) ON DUPLICATE KEY UPDATE hits = hits + 1, last_seen = NOW(), referrer = VALUES(referrer), user_agent = VALUES(user_agent), classification = VALUES(classification)',
    [sha256(url), url, referrer || null, ua || null, classification]
  );
};

export const listSeo404 = async (includeNoise = false) => {
  const clauses = includeNoise ? '1=1' : "classification NOT IN ('scanner_noise','bot_request')";
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_404 WHERE ' + clauses + ' ORDER BY resolved ASC, hits DESC, last_seen DESC LIMIT 5000'
  );
  return rows.map(row => ({
    id: Number(row.id),
    url: row.url,
    referrer: row.referrer,
    hits: Number(row.hits),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    resolved: Boolean(row.resolved),
    decision: row.decision,
    decisionNote: row.decision_note,
    classification: row.classification
  }));
};

export const setSeo404Decision = async (id: number, decision: string, note = '') => {
  const allowed = ['open', 'ignore', 'noise', 'restore', 'redirect', 'resolved'];
  if (!allowed.includes(decision)) throw new Error('SEO_404_DECISION_INVALID');
  await pool.execute(
    'UPDATE seo_404 SET decision = ?, decision_note = ?, resolved = ?, last_seen = last_seen WHERE id = ?',
    [decision, String(note || '').slice(0, 2000), ['ignore', 'noise', 'resolved'].includes(decision) ? 1 : 0, id]
  );
  return { ok: true };
};

export const saveKeywordOwner = async (query: string, preferredUrl: string, actorId?: string, note = '') => {
  const normalizedQuery = normalizeSeoText(query).toLocaleLowerCase('fa-IR');
  if (!normalizedQuery || !preferredUrl) throw new Error('SEO_KEYWORD_MAP_INVALID');
  await pool.execute(
    'INSERT INTO seo_keyword_map (query_hash, query_text, preferred_url, preferred_url_hash, owner_source, locked, note, updated_by) VALUES (?, ?, ?, ?, \'manual\', 1, ?, ?) ON DUPLICATE KEY UPDATE query_text = VALUES(query_text), preferred_url = VALUES(preferred_url), preferred_url_hash = VALUES(preferred_url_hash), note = VALUES(note), updated_by = VALUES(updated_by), updated_at = NOW()',
    [sha256(normalizedQuery), normalizedQuery, preferredUrl, sha256(preferredUrl), String(note || '').slice(0, 2000) || null, actorId || null]
  );
  return { ok: true };
};

export const listKeywordMap = async () => {
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_keyword_map ORDER BY updated_at DESC LIMIT 5000'
  );
  return rows.map(row => ({
    id: Number(row.id),
    query: row.query_text,
    preferredUrl: row.preferred_url,
    ownerSource: row.owner_source,
    locked: Boolean(row.locked),
    note: row.note,
    updatedAt: row.updated_at
  }));
};

export const enqueueSeoJob = async (jobType: string, payload: any = {}) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO seo_jobs (job_type, payload_json, status, attempts, available_at) VALUES (?, ?, \'queued\', 0, NOW())',
    [String(jobType).slice(0, 80), JSON.stringify(payload || {})]
  );
  return Number(result.insertId);
};

export const listSeoJobs = async (limit = 100) => {
  const safeLimit = Math.max(1, Math.min(500, Number(limit || 100)));
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_jobs ORDER BY id DESC LIMIT ' + safeLimit
  );
  return rows.map(row => ({
    id: Number(row.id),
    jobType: row.job_type,
    payload: parseJson(row.payload_json, {}),
    status: row.status,
    attempts: Number(row.attempts),
    availableAt: row.available_at,
    lockedAt: row.locked_at,
    lastError: row.last_error,
    createdAt: row.created_at
  }));
};

export const claimNextSeoJob = async () => {
  return withTransaction(async connection => {
    const [rows] = await connection.query<Array<RowDataPacket & Record<string, any>>>(
      "SELECT * FROM seo_jobs WHERE status = 'queued' AND available_at <= NOW() AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 20 MINUTE)) ORDER BY id ASC LIMIT 1 FOR UPDATE"
    );
    const row = rows[0];
    if (!row) return null;
    await connection.execute(
      "UPDATE seo_jobs SET status = 'running', locked_at = NOW(), attempts = attempts + 1, updated_at = NOW() WHERE id = ?",
      [row.id]
    );
    return {
      id: Number(row.id),
      jobType: String(row.job_type),
      payload: parseJson<any>(row.payload_json, {}),
      attempts: Number(row.attempts || 0) + 1
    };
  });
};

export const completeSeoJob = async (id: number) => {
  await pool.execute(
    "UPDATE seo_jobs SET status = 'completed', locked_at = NULL, last_error = NULL, updated_at = NOW() WHERE id = ?",
    [id]
  );
};

export const failSeoJob = async (id: number, attempts: number, error: unknown) => {
  const retry = attempts < 5;
  await pool.execute(
    "UPDATE seo_jobs SET status = ?, locked_at = NULL, last_error = ?, available_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), updated_at = NOW() WHERE id = ?",
    [retry ? 'queued' : 'failed', String((error as Error)?.message || error).slice(0, 2000), Math.min(60, Math.pow(2, attempts)), id]
  );
};

export const runtimeLog = async (level: string, eventName: string, context: any = {}) => {
  try {
    const settings = await getSeoSettings();
    if (!settings.runtimeLogging && level !== 'error') return;
    const scrubbed = JSON.parse(JSON.stringify(context || {}, (key, value) => {
      if (/password|secret|token|api.?key|cookie|authorization/i.test(key)) return '[REDACTED]';
      return typeof value === 'string' && value.length > 4000 ? value.slice(0, 4000) : value;
    }));
    await pool.execute(
      'INSERT INTO seo_runtime_log (level, event_name, context_json) VALUES (?, ?, ?)',
      [String(level).slice(0, 20), String(eventName).slice(0, 100), JSON.stringify(scrubbed)]
    );
  } catch {}
};

export const listRuntimeLogs = async (limit = 500) => {
  const safeLimit = Math.max(1, Math.min(5000, Number(limit || 500)));
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_runtime_log ORDER BY id DESC LIMIT ' + safeLimit
  );
  return rows.map(row => ({
    id: Number(row.id),
    level: row.level,
    eventName: row.event_name,
    context: parseJson(row.context_json, {}),
    createdAt: row.created_at
  }));
};

export const clearRuntimeLogs = async () => {
  await pool.execute('DELETE FROM seo_runtime_log');
  return { ok: true };
};

export const listSeoHistory = async (limit = 250) => {
  const safeLimit = Math.max(1, Math.min(2000, Number(limit || 250)));
  const [rows] = await pool.query<Array<RowDataPacket & Record<string, any>>>(
    'SELECT * FROM seo_history ORDER BY id DESC LIMIT ' + safeLimit
  );
  return rows.map(row => ({
    id: Number(row.id),
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    before: parseJson(row.before_json, null),
    after: parseJson(row.after_json, null),
    createdAt: row.created_at
  }));
};

export const getSeoSummary = async () => {
  const [metaRows, issueRows, redirectRows, errorRows, nodeRows, jobRows] = await Promise.all([
    pool.query<Array<RowDataPacket & { total: number; avg_score: number }>>('SELECT COUNT(*) AS total, COALESCE(AVG(score),0) AS avg_score FROM seo_meta'),
    pool.query<Array<RowDataPacket & { total: number }>>("SELECT COUNT(*) AS total FROM seo_issues WHERE status = 'open'"),
    pool.query<Array<RowDataPacket & { total: number }>>('SELECT COUNT(*) AS total FROM seo_redirects WHERE enabled = 1'),
    pool.query<Array<RowDataPacket & { total: number }>>('SELECT COUNT(*) AS total FROM seo_404 WHERE resolved = 0'),
    pool.query<Array<RowDataPacket & { total: number }>>('SELECT COUNT(*) AS total FROM seo_knowledge_nodes'),
    pool.query<Array<RowDataPacket & { total: number }>>("SELECT COUNT(*) AS total FROM seo_jobs WHERE status IN ('queued','running')")
  ]);
  const lastAudit = await readAppSetting<any>('takrank_seo_last_audit', null);
  const graph = await getSeoGraphState();
  return {
    optimizedEntities: Number(metaRows[0][0]?.total || 0),
    averageScore: Math.round(Number(metaRows[0][0]?.avg_score || 0)),
    openIssues: Number(issueRows[0][0]?.total || 0),
    redirects: Number(redirectRows[0][0]?.total || 0),
    unresolved404: Number(errorRows[0][0]?.total || 0),
    graphNodes: Number(nodeRows[0][0]?.total || 0),
    queuedJobs: Number(jobRows[0][0]?.total || 0),
    graph,
    lastAudit
  };
};

export const seoPathExists = async (pathname: string): Promise<boolean> => {
  const path = normalizePath(pathname).split('?')[0].replace(/\/$/, '') || '/';
  const staticPaths = new Set([
    '/', '/shop', '/blog', '/about', '/guarantee', '/contact', '/admin', '/account',
    '/checkout', '/tracking', '/compare', '/part-request', '/cart', '/wishlist'
  ]);
  if (staticPaths.has(path)) return true;
  if (/^\/shop\/[^/]+$/.test(path)) return true;
  if (/^\/account\/[^/]+$/.test(path)) return true;
  if (/^\/tracking\/[^/]+$/.test(path)) return true;
  if (/^\/invoice\/[^/]+$/.test(path)) return true;
  if (/^\/part-request\/[^/]+$/.test(path)) return true;
  const match = path.match(/^\/(product|article|category|page|brand|car-model)\/([^/]+)$/);
  if (!match) return false;
  const typeMap: Record<string, SeoEntityType> = {
    product: 'product',
    article: 'article',
    category: 'category',
    page: 'page',
    brand: 'brand',
    'car-model': 'model'
  };
  let key = match[2];
  try { key = decodeURIComponent(key); } catch {}
  return Boolean(await loadEntity(typeMap[match[1]], key));
};
