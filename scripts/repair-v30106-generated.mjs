import fs from 'node:fs';

const appFile = 'src/App.tsx';
let source = fs.readFileSync(appFile, 'utf8');
const before = source;

if (/\blazy\(/.test(source) || /<Suspense\b/.test(source)) {
  source = source.replace(
    /import React,\s*\{([^}]*)\}\s*from\s*['"]react['"];?/,
    (_match, imports) => {
      const names = String(imports).split(',').map(value => value.trim()).filter(Boolean);
      for (const required of ['lazy', 'Suspense']) if (!names.includes(required)) names.unshift(required);
      return `import React, { ${Array.from(new Set(names)).join(', ')} } from 'react';`;
    }
  );
}

if (source !== before) {
  fs.writeFileSync(appFile, source);
  console.log('v30.10.6 generated App React lazy/Suspense imports repaired.');
} else {
  console.log('v30.10.6 generated App React lazy/Suspense imports already valid.');
}

if (!/import React,\s*\{[^}]*\blazy\b[^}]*\bSuspense\b|import React,\s*\{[^}]*\bSuspense\b[^}]*\blazy\b/.test(source)) {
  throw new Error('v30.10.6 generated App is missing React lazy/Suspense imports.');
}
