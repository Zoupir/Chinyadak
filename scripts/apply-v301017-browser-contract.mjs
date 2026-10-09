import fs from 'node:fs';

const file = 'src/components/common/LiveSectionModal.tsx';
let source = fs.readFileSync(file, 'utf8');

const patchSelect = (valueExpr, field) => {
  const from = `<select value={${valueExpr}}`;
  const to = `<select data-section-field="${field}" value={${valueExpr}}`;
  if (!source.includes(to)) {
    if (!source.includes(from)) throw new Error(`v30.10.17 browser hook target missing: ${field}`);
    source = source.replace(from, to);
  }
};

patchSelect('form.desktopColumns || 3', 'desktopColumns');
patchSelect('form.tabletColumns || Math.min(form.desktopColumns || 3,2)', 'tabletColumns');
patchSelect('form.mobileColumns || 1', 'mobileColumns');

if (!source.includes('data-section-field="desktopColumns"') ||
    !source.includes('data-section-field="tabletColumns"') ||
    !source.includes('data-section-field="mobileColumns"')) {
  throw new Error('v30.10.17 responsive column browser hooks incomplete');
}

fs.writeFileSync(file, source, 'utf8');
console.log('v30.10.17 browser contract: responsive section controls are observable.');
