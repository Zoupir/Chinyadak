import fs from 'node:fs';

const appFile = 'src/App.tsx';
let appSource = fs.readFileSync(appFile, 'utf8');
const appBefore = appSource;

if (/\blazy\(/.test(appSource) || /<Suspense\b/.test(appSource)) {
  appSource = appSource.replace(
    /import React,\s*\{([^}]*)\}\s*from\s*['"]react['"];?/,
    (_match, imports) => {
      const names = String(imports).split(',').map(value => value.trim()).filter(Boolean);
      for (const required of ['lazy', 'Suspense']) if (!names.includes(required)) names.unshift(required);
      return `import React, { ${Array.from(new Set(names)).join(', ')} } from 'react';`;
    }
  );
}

if (appSource !== appBefore) {
  fs.writeFileSync(appFile, appSource);
  console.log('v30.10.6 generated App React lazy/Suspense imports repaired.');
} else {
  console.log('v30.10.6 generated App React lazy/Suspense imports already valid.');
}

if (!/import React,\s*\{[^}]*\blazy\b[^}]*\bSuspense\b|import React,\s*\{[^}]*\bSuspense\b[^}]*\blazy\b/.test(appSource)) {
  throw new Error('v30.10.6 generated App is missing React lazy/Suspense imports.');
}

const headerFile = 'src/components/layout/Header.tsx';
let headerSource = fs.readFileSync(headerFile, 'utf8');
const headerBefore = headerSource;
for (const attrs of [
  'id="classic-category-mega" role="menu" aria-label="دسته‌بندی قطعات"',
  'id="classic-brands-menu" role="menu" aria-label="برندهای خودرو"'
]) {
  while (headerSource.includes(`${attrs} ${attrs}`)) {
    headerSource = headerSource.replace(`${attrs} ${attrs}`, attrs);
  }
}
if (headerSource !== headerBefore) {
  fs.writeFileSync(headerFile, headerSource);
  console.log('v30.10.6 generated Header duplicate ARIA/menu attributes removed.');
} else {
  console.log('v30.10.6 generated Header ARIA/menu attributes already idempotent.');
}

const duplicateMenuAttrs = /id="classic-(?:category-mega|brands-menu)"\s+role="menu"\s+aria-label="[^"]+"\s+id="classic-/;
if (duplicateMenuAttrs.test(headerSource)) {
  throw new Error('v30.10.6 generated Header still contains duplicate classic menu attributes.');
}
