import fs from 'node:fs';

const file = 'src/components/home/MarketplaceRtlHome.tsx';
let source = fs.readFileSync(file, 'utf8');
const before = source;

if (!source.includes('data-v30109-marketplace-section-map')) {
  const needle = `  const sectionConfig = (key: string) => homeSections.find(section => section.sectionKey === key);`;
  if (!source.includes(needle)) throw new Error('v30.10.9 marketplace sectionConfig declaration missing.');
  const replacement = `  // data-v30109-marketplace-section-map: the original homepage sections predate
  // sectionKey. Keep those records editable instead of rendering a visual section
  // that the live editor cannot resolve back to its persisted CMS row.
  const legacySectionIdForKey: Record<string, string> = {
    hero: 'sec-hero',
    'featured-categories': 'sec-categories',
    manufacturers: 'sec-brands',
    'service-strip': 'sec-trust',
    articles: 'sec-articles'
  };
  const sectionForKey = (key: string) => homeSections.find(section =>
    section.sectionKey === key ||
    section.id === \`sec-\${key}\` ||
    section.id === legacySectionIdForKey[key]
  );
  const sectionConfig = (key: string) => sectionForKey(key);`;
  source = source.replace(needle, replacement);
}

const handlerNeedle = `    const section = homeSections.find(item => item.sectionKey === sectionKey);`;
if (source.includes(handlerNeedle)) {
  source = source.replace(handlerNeedle, `    const section = sectionKey ? sectionForKey(sectionKey) : undefined;`);
}

const heroNeedle = `    const section = homeSections.find(item => item.sectionKey === 'hero');`;
if (source.includes(heroNeedle)) {
  source = source.replace(heroNeedle, `    const section = sectionForKey('hero');`);
}

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.9 marketplace legacy-section mapping applied for live editing.');
} else {
  console.log('v30.10.9 marketplace legacy-section mapping already applied.');
}

for (const marker of [
  'data-v30109-marketplace-section-map',
  "articles: 'sec-articles'",
  'const sectionForKey = (key: string)',
  'const section = sectionKey ? sectionForKey(sectionKey) : undefined;'
]) {
  if (!source.includes(marker)) throw new Error(`v30.10.9 marketplace section mapping incomplete: ${marker}`);
}
if (source.includes(handlerNeedle)) throw new Error('v30.10.9 marketplace live editor still uses sectionKey-only lookup.');
