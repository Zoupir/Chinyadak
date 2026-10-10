import fs from 'node:fs';

const path = 'src/components/admin/AdminDashboardPro.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = source;
source = source.replace(
  "const unanswered = partRequests.filter(request => request.status === 'در حال بررسی').length;",
  "const unanswered = partRequests.filter(request => ['جدید','در حال بررسی'].includes(request.status)).length;"
);
source = source.replace(
  "req.status==='در حال بررسی'?'text-amber-700':'text-emerald-700'",
  "['جدید','در حال بررسی'].includes(req.status)?'text-amber-700':'text-emerald-700'"
);
if (!source.includes("['جدید','در حال بررسی'].includes(request.status)")) {
  throw new Error('v30.9.0 dashboard request counter repair failed');
}
if (source !== before) fs.writeFileSync(path, source);
console.log('v30.9.0 dashboard request counters:', source === before ? 'already satisfied' : 'updated');
