import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

// v30.5.1 repair pass: the primary migration deliberately runs after the
// older v30.5.0 source migration. Keep this pass small and idempotent so CI
// catches malformed generated source before TypeScript/build.
edit('server.ts', source => {
  const declaration = '        const privateRoute = isPrivateStorefrontPath(req.path);\n';
  const first = source.indexOf(declaration);
  if (first < 0) throw new Error('v30.5.1 repair: privateRoute declaration missing');
  let second = source.indexOf(declaration, first + declaration.length);
  while (second >= 0) {
    source = source.slice(0, second) + source.slice(second + declaration.length);
    second = source.indexOf(declaration, first + declaration.length);
  }
  if (!source.includes('        const exists = privateRoute ? true : await seoPathExists(req.path);')) {
    throw new Error('v30.5.1 repair: private route SEO bypass missing');
  }
  return source;
});

edit('src/server/ssr-store-context.tsx', source => {
  if (source.includes('\n$1\n')) {
    const addToGarage = `\n  const addToGarage = (car: any) => {\n    const newCar = { ...car, id: car.id || \`garage-\${Date.now()}\`, addedAt: car.addedAt || new Date().toISOString() };\n    setGarage(current => [newCar, ...current.filter(item => !(item.modelId === newCar.modelId && item.year === newCar.year))]);\n    setSelectedVehicle(newCar);\n  };\n`;
    source = source.replace('\n$1\n', addToGarage);
  }
  if (!source.includes('  const addToGarage = (car: any) => {')) {
    throw new Error('v30.5.1 repair: addToGarage helper missing');
  }
  if (!source.includes('  const removeFromGarage = (id: string) => {')) {
    throw new Error('v30.5.1 repair: removeFromGarage helper missing');
  }
  if (source.includes('\n$1\n')) {
    throw new Error('v30.5.1 repair: unresolved regex capture marker remains');
  }
  return source;
});

console.log(`v30.5.1 repair OK${changed.length ? `; repaired ${changed.length} files` : '; no repair needed'}.`);
