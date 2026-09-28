import 'dotenv/config';
import { pool } from '../src/server/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
  const attempts = Number(process.env.DB_WAIT_ATTEMPTS || 60);
  for (let i = 1; i <= attempts; i++) {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.ping();
        await connection.query('SELECT 1');
        console.log(`Database ready on attempt ${i}.`);
        return;
      } finally {
        connection.release();
      }
    } catch (error) {
      if (i === attempts) throw error;
      await sleep(2000);
    }
  }
};

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async error => {
    console.error('Database did not become ready:', error);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
