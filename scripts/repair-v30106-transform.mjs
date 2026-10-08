import fs from 'node:fs';

const file = 'scripts/apply-v30106-performance.mjs';
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const marker = "    'Deferred modal chunks'\n  );";
const markerIndex = source.indexOf(marker);
if (markerIndex >= 0) {
  const searchStart = Math.max(0, markerIndex - 5000);
  const blockStart = source.lastIndexOf('  source = replaceOnce(\n    source,', markerIndex);
  if (blockStart < searchStart) throw new Error('v30.10.6 modal transform block start not found.');
  const blockEnd = markerIndex + marker.length;
  source = source.slice(0, blockStart) +
    "  // Historical App generators use more than one modal wrapper shape. Keep\n" +
    "  // modal lazy imports in place without rewriting their JSX here; route/admin\n" +
    "  // splitting remains deterministic and avoids a brittle source transform.\n" +
    source.slice(blockEnd);
  changed = true;
  console.log('v30.10.6 brittle modal JSX transform removed before apply.');
} else {
  console.log('v30.10.6 modal JSX transform already normalized.');
}

const brokenKeyboardEnd = "          }`,\n    'Search keyboard navigation'";
const fixedKeyboardEnd = "          }}`,\n    'Search keyboard navigation'";
if (source.includes(brokenKeyboardEnd)) {
  source = source.replace(brokenKeyboardEnd, fixedKeyboardEnd);
  changed = true;
  console.log('v30.10.6 search keyboard JSX closure repaired.');
} else if (source.includes(fixedKeyboardEnd)) {
  console.log('v30.10.6 search keyboard JSX closure already valid.');
} else {
  throw new Error('v30.10.6 search keyboard transform marker not found.');
}

if (changed) fs.writeFileSync(file, source);
