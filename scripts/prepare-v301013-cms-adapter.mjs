import fs from 'node:fs';

const file = 'src/server/routes/cms.ts';
let source = fs.readFileSync(file, 'utf8');

const start = source.indexOf("cmsRouter.put('/pages/:id'");
const end = source.indexOf("\ncmsRouter.delete('/pages/:id'", start);
if (start < 0 || end < 0) throw new Error('v30.10.13 CMS adapter could not locate page PUT route');

let block = source.slice(start, end);
if (!block.includes('PAGE_PERSIST_READBACK_FAILED')) {
  // v30.10.3 returns the transaction result directly. Normalize only the response
  // shape so the v30.10.13 readback stage can verify MySQL without weakening the
  // existing cmsRevision/409 optimistic-concurrency contract.
  if (block.includes('res.json({ page: result.page });')) {
    block = block.replace(
      'res.json({ page: result.page });',
      'page = result.page;\n    res.json({ page });'
    );
  }
}

source = source.slice(0, start) + block + source.slice(end);
fs.writeFileSync(file, source, 'utf8');
console.log('v30.10.13 CMS adapter preserved optimistic concurrency and normalized the page response for DB readback verification.');
