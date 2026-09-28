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

  try {
    await connection.query(schema);
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
