import fs from 'node:fs';

const file = 'src/context/StoreContext.tsx';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes('const discardSectionPreview =')) {
  const anchor = '  const addSection =';
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error('v30.10.13 repair could not locate addSection');
  const fn = `  const discardSectionPreview = (pageSlug: string, sectionId: string) => {\n    setPages(prev => {\n      const next = prev.map(page => page.slug === pageSlug\n        ? { ...page, sections: page.sections.filter(section => section.id !== sectionId) }\n        : page);\n      pagesRef.current = next;\n      return next;\n    });\n  };\n\n`;
  source = source.slice(0, index) + fn + source.slice(index);
}

fs.writeFileSync(file, source, 'utf8');
console.log('v30.10.13 discardSectionPreview restored and synchronized with pagesRef.');
