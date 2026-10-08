import { pool, type RowDataPacket } from './db';

export interface MediaReference {
  source: string;
  id: string;
  label?: string;
}

type ReferenceQuery = {
  source: string;
  sql: string;
};

/**
 * JSON/text columns in production can legitimately carry different utf8mb4
 * collations after years of migrations (for example utf8mb4_bin on JSON and
 * utf8mb4_uca1400_ai_ci on MariaDB text). Reference detection is an exact URL
 * lookup, so byte-wise comparison is the correct operation and avoids collation
 * coercion differences between MySQL and MariaDB.
 */
const referenceQueries: ReferenceQuery[] = [
  {
    source: 'product',
    sql: `SELECT id, name_fa AS label FROM products
          WHERE LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', CAST(data_json AS CHAR), CAST(images_json AS CHAR), COALESCE(short_description,''), COALESCE(description,'')) AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', CAST(data_json AS CHAR), CAST(images_json AS CHAR), COALESCE(short_description,''), COALESCE(description,'')) AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'article',
    sql: `SELECT id, title AS label FROM articles
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'page',
    sql: `SELECT id, title AS label FROM site_pages
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'category',
    sql: `SELECT id, name_fa AS label FROM categories
          WHERE LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', CAST(data_json AS CHAR), COALESCE(description,'')) AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', CAST(data_json AS CHAR), COALESCE(description,'')) AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'vehicle-brand',
    sql: `SELECT id, name_fa AS label FROM vehicle_brands
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'vehicle-model',
    sql: `SELECT id, name_fa AS label FROM vehicle_models
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'part-brand',
    sql: `SELECT id, name_fa AS label FROM part_brands
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'article-category',
    sql: `SELECT id, name AS label FROM article_categories
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'slider',
    sql: `SELECT id, id AS label FROM sliders
          WHERE LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(data_json AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'setting',
    sql: `SELECT setting_key AS id, setting_key AS label FROM app_settings
          WHERE LOCATE(CAST(? AS BINARY), CAST(setting_value AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(setting_value AS BINARY)) > 0
          LIMIT 25`
  },
  {
    source: 'seo-meta',
    sql: `SELECT CONCAT(entity_type, ':', entity_id) AS id, COALESCE(seo_title, CONCAT(entity_type, ':', entity_id)) AS label
          FROM seo_meta
          WHERE LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', COALESCE(og_image_url,''), COALESCE(twitter_image_url,''), COALESCE(canonical_url,''), CAST(analysis_json AS CHAR)) AS BINARY)) > 0
             OR LOCATE(CAST(? AS BINARY), CAST(CONCAT_WS(' ', COALESCE(og_image_url,''), COALESCE(twitter_image_url,''), COALESCE(canonical_url,''), CAST(analysis_json AS CHAR)) AS BINARY)) > 0
          LIMIT 25`
  }
];

/**
 * Prevent deletion of live media. Both the encoded public URL and raw upload
 * path are searched so Persian filenames and absolute URLs are handled safely.
 */
export const findMediaReferences = async (
  publicUrl: string,
  relativePath: string
): Promise<MediaReference[]> => {
  const rawPublicPath = '/uploads/' + String(relativePath || '').replace(/^\/+/, '');
  const encodedPublicPath = String(publicUrl || '');
  if (!rawPublicPath && !encodedPublicPath) return [];

  const found = new Map<string, MediaReference>();
  for (const query of referenceQueries) {
    try {
      const [rows] = await pool.query<Array<RowDataPacket & { id: string; label?: string }>>(
        query.sql,
        [rawPublicPath, encodedPublicPath]
      );
      for (const row of rows) {
        const item: MediaReference = {
          source: query.source,
          id: String(row.id),
          label: row.label ? String(row.label) : undefined
        };
        found.set(`${item.source}:${item.id}`, item);
      }
    } catch (error: any) {
      // part_brands is created by a safe migration on older installations. If a
      // legacy database has not run that migration yet, the remaining reference
      // checks must still work instead of making the media library unavailable.
      if (error?.code === 'ER_NO_SUCH_TABLE') continue;
      throw error;
    }
  }
  return [...found.values()].slice(0, 150);
};
