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

// Visual sections may legitimately have no heading. Never block persistence
// just because title is empty; use sectionKey only for the confirmation copy.
edit('src/components/common/LiveSectionModal.tsx', source => {
  source = source.replace(
    `  const save = async () => {\n    if (!form.title?.trim()) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n    if (isSaving) return;`,
    `  const save = async () => {\n    if (isSaving) return;`
  );
  source = source.replace(
    `showToast(\`سکشن «\${form.title}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.\`);`,
    `showToast(\`سکشن «\${form.title || form.sectionKey || 'بدون عنوان'}» ذخیره شد و بعد از بازخوانی صفحه باقی می‌ماند.\`);`
  );
  if (source.includes("عنوان سکشن الزامی است.")) {
    throw new Error('v30.9.2 final repair: live editor still blocks untitled sections');
  }
  return source;
});

// A hidden legacy discountPrice must never override the price an admin just
// edited. From v30.9.2 forward the visible discountMode/discountValue controls
// are the only discount source written by the editor.
edit('src/context/StoreContext.tsx', source => {
  const oldBlock = `    const legacyDiscountPrice = Math.max(0, Number(updated.discountPrice || 0));\n    const hadLegacyDiscount = !updated.discountMode && legacyDiscountPrice > 0 && legacyDiscountPrice < basePrice;\n    const discountMode: NonNullable<Product['discountMode']> = updated.discountMode || (hadLegacyDiscount ? 'fixed' : 'none');\n    const discountValue = discountMode === 'none'\n      ? 0\n      : hadLegacyDiscount\n        ? Math.max(0, basePrice - legacyDiscountPrice)\n        : Math.max(0, Number(updated.discountValue || 0));`;
  const newBlock = `    const discountMode: NonNullable<Product['discountMode']> = updated.discountMode || 'none';\n    const discountValue = discountMode === 'none'\n      ? 0\n      : Math.max(0, Number(updated.discountValue || 0));`;
  source = source.replace(oldBlock, newBlock);
  if (source.includes('hadLegacyDiscount')) {
    throw new Error('v30.9.2 final repair: hidden legacy discount migration still active');
  }
  return source;
});

console.log('v30.9.2 final repair:', changed.length ? changed.join(', ') : 'already satisfied');
