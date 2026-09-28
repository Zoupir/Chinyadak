import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from './config';

export const pool: Pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export const checkDatabase = async (): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const withTransaction = async <T>(
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const value = await work(connection);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export type { RowDataPacket, ResultSetHeader };
