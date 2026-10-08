import { pool, type RowDataPacket } from './db';

export interface MediaReference {
  source: string;
  id: string;
}

const referenceQueries = [
  { source: 'product', sql: 'SELECT id FROM products WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'article', sql: 'SELECT id FROM articles WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'page', sql: 'SELECT id FROM site_pages WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'category', sql: 'SELECT id FROM categories WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'brand', sql: 'SELECT id FROM vehicle_brands WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'model', sql: 'SELECT id FROM vehicle_models WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'slider', sql: 'SELECT id FROM sliders WHERE CAST(data_json AS CHAR) LIKE ? LIMIT 20' },
  { source: 'setting', sql: 'SELECT setting_key AS id FROM app_settings WHERE CAST(setting_value AS CHAR) LIKE ? LIMIT 20' }
] as const;

/**
 * Deleting a file that is still referenced turns live pages/products into
 * broken media. This check is intentionally conservative: a possible match
 * blocks deletion until the reference is removed by the administrator.
 */
export const findMediaReferences = async (
  publicUrl: string,
  relativePath: string
): Promise<MediaReference[]> => {
  const needles = [...new Set([publicUrl, relativePath].filter(Boolean))];
  if (!needles.length) return [];

  const found = new Map<string, MediaReference>();
  for (const query of referenceQueries) {
    for (const needle of needles) {
      const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
        query.sql,
        [`%${needle}%`]
      );
      for (const row of rows) {
        const item = { source: query.source, id: String(row.id) };
        found.set(`${item.source}:${item.id}`, item);
      }
    }
  }
  return [...found.values()].slice(0, 100);
};
