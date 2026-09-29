import 'dotenv/config';
import { checkDatabase } from '../src/server/db';
import { runSeoAutomationTick } from '../src/server/seo/worker';

const main = async () => {
  await checkDatabase();
  const limit = Number(process.argv[2] || 10);
  const result = await runSeoAutomationTick(limit);
  console.log(JSON.stringify(result, null, 2));
};

main().catch(error => {
  console.error('TakRank SEO worker failed:', error);
  process.exit(1);
});
