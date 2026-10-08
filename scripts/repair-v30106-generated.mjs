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

const ensureReactImports = (source, required) => source.replace(
  /import React,\s*\{([^}]*)\}\s*from\s*['"]react['"];?/,
  (_match, imports) => {
    const names = String(imports).split(',').map(value => value.trim()).filter(Boolean);
    for (const name of required) if (!names.includes(name)) names.unshift(name);
    return `import React, { ${Array.from(new Set(names)).join(', ')} } from 'react';`;
  }
);

const lazyLiveEditor = (file, stateName, pageSlugExpression) => {
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  source = ensureReactImports(source, ['lazy', 'Suspense']);
  source = source.replace("import { LiveSectionModal } from '../common/LiveSectionModal';\n", '');
  if (!source.includes("const LiveSectionModal = lazy(() => import('../common/LiveSectionModal')")) {
    const importBoundary = source.lastIndexOf('\n\ninterface ');
    if (importBoundary < 0) throw new Error(`v30.10.6 live editor insertion point missing: ${file}`);
    source = source.slice(0, importBoundary) +
      "\n\nconst LiveSectionModal = lazy(() => import('../common/LiveSectionModal').then(module => ({ default: module.LiveSectionModal })));" +
      source.slice(importBoundary);
  }

  const plain = `      {${stateName} && (\n        <LiveSectionModal\n          pageSlug=${pageSlugExpression}\n          sectionId={${stateName}}\n          isOpen={!!${stateName}}\n          onClose={() => set${stateName === 'editingSectionId' ? 'EditingSectionId' : 'ActiveEditingSectionId'}(null)}\n        />\n      )}`;
  const wrapped = `      <Suspense fallback={null}>\n        {${stateName} && (\n          <LiveSectionModal\n            pageSlug=${pageSlugExpression}\n            sectionId={${stateName}}\n            isOpen={!!${stateName}}\n            onClose={() => set${stateName === 'editingSectionId' ? 'EditingSectionId' : 'ActiveEditingSectionId'}(null)}\n          />\n        )}\n      </Suspense>`;
  if (!source.includes(wrapped)) {
    if (!source.includes(plain)) throw new Error(`v30.10.6 live editor render block missing: ${file}`);
    source = source.replace(plain, wrapped);
  }

  if (source !== before) {
    fs.writeFileSync(file, source);
    console.log(`v30.10.6 public live editor isolated behind lazy boundary: ${file}`);
  } else {
    console.log(`v30.10.6 public live editor already lazy: ${file}`);
  }
  if (/import \{ LiveSectionModal \}/.test(source) || !source.includes("lazy(() => import('../common/LiveSectionModal')")) {
    throw new Error(`v30.10.6 public live editor isolation failed: ${file}`);
  }
};

lazyLiveEditor('src/components/home/HomeView.tsx', 'activeEditingSectionId', '"home"');
lazyLiveEditor('src/components/page/PageView.tsx', 'editingSectionId', '{pageSlug}');
