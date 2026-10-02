import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} in .env`);
  }
}

const main = async () => {
  const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  const ensureColumn = async (
    tableName: string,
    columnName: string,
    definition: string
  ): Promise<void> => {
    const [rows] = await connection.query<any[]>(
      `SELECT 1
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [tableName, columnName]
    );

    if (!rows.length) {
      await connection.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
      );
    }
  };

  const ensureIndex = async (
    tableName: string,
    indexName: string,
    definition: string
  ): Promise<void> => {
    const [rows] = await connection.query<any[]>(
      `SELECT 1
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND INDEX_NAME = ?
       LIMIT 1`,
      [tableName, indexName]
    );
    if (!rows.length) {
      await connection.query(
        `ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${definition}`
      );
    }
  };

  const runMigration = async (
    migrationId: string,
    migrate: () => Promise<void>
  ): Promise<void> => {
    const [rows] = await connection.query<any[]>(
      'SELECT 1 FROM schema_migrations WHERE migration_id = ? LIMIT 1',
      [migrationId]
    );
    if (rows.length) return;
    await migrate();
    await connection.execute(
      'INSERT INTO schema_migrations (migration_id) VALUES (?)',
      [migrationId]
    );
  };

  try {
    await connection.query(schema);

    // Numbered/idempotent migrations for databases created by older releases.
    await runMigration('2026-09-products-json-reservations', async () => {
      await ensureColumn('products', 'data_json', 'JSON NULL');
      await ensureColumn('products', 'reserved_stock', 'INT NOT NULL DEFAULT 0');
      await ensureColumn('orders', 'reservation_expires_at', 'DATETIME NULL');
      await connection.query(
        `ALTER TABLE payment_transactions
         MODIFY gateway_order_id BIGINT UNSIGNED NULL`
      );
      await connection.query(
        `UPDATE products
         SET data_json = JSON_OBJECT(
           'id', id,
           'sku', sku,
           'slug', slug,
           'nameFa', name_fa,
           'nameEn', COALESCE(name_en, ''),
           'oemNumber', COALESCE(oem_number, ''),
           'partNumber', COALESCE(part_number, ''),
           'categorySlug', category_slug,
           'brandManufacturer', COALESCE(manufacturer, ''),
           'grade', COALESCE(grade, 'aftermarket'),
           'price', price,
           'discountPrice', discount_price,
           'stock', stock,
           'stockStatus', CASE
             WHEN stock <= 0 THEN 'out_of_stock'
             WHEN stock <= 3 THEN 'low_stock'
             ELSE 'in_stock'
           END,
           'images', COALESCE(images_json, JSON_ARRAY()),
           'technicalSpecs', COALESCE(specs_json, JSON_OBJECT()),
           'fitments', COALESCE(fitments_json, JSON_ARRAY()),
           'shortDescription', COALESCE(short_description, ''),
           'description', COALESCE(description, '')
         )
         WHERE data_json IS NULL`
      );
      await connection.query('ALTER TABLE products MODIFY data_json JSON NOT NULL');
    });

    await runMigration('2026-10-security-and-archive', async () => {
      await ensureColumn('admin_users', 'avatar_url', 'TEXT NULL');
      await ensureColumn('customers', 'password_initialized', 'TINYINT(1) NOT NULL DEFAULT 1');
      await ensureColumn('customers', 'session_version', 'INT UNSIGNED NOT NULL DEFAULT 1');
      await ensureColumn('admin_users', 'session_version', 'INT UNSIGNED NOT NULL DEFAULT 1');
      await ensureColumn('admin_users', 'deleted_at', 'DATETIME NULL');
      await ensureColumn('orders', 'archived_at', 'DATETIME NULL');
      await ensureIndex('orders', 'idx_orders_archived', '(archived_at)');
    });

    await runMigration('2026-10-cms-page-revision', async () => {
      await ensureColumn('site_pages', 'revision', 'INT UNSIGNED NOT NULL DEFAULT 1');
    });

  } finally {
    await connection.end();
  }

  const { bootstrapAdminIfNeeded } = await import('../src/server/bootstrap');
  const { pool } = await import('../src/server/db');
  try {
    await bootstrapAdminIfNeeded();
    console.log('Database schema and initial administrator are ready.');
  } finally {
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
