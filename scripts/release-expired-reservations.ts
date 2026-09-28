import 'dotenv/config';
import { pool } from '../src/server/db';
import { releaseExpiredReservations } from '../src/server/inventory';

const main = async () => {
  try {
    const released = await releaseExpiredReservations();
    console.log(`Released ${released} expired payment reservation(s).`);
  } finally {
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
