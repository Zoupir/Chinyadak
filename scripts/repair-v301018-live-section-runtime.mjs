import fs from 'node:fs';

// Final runtime guard after every historical/generated source stage.
{
  const file = 'src/context/StoreContext.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;

  source = source.replace(
    "const page = pagesRef.current.find(item => item.slug === pageSlug);",
    "const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);"
  );

  if (!source.includes("const page = pagesRef.current.find(item => item.slug === pageSlug) || pages.find(item => item.slug === pageSlug);")) {
    throw new Error('v30.10.18 final runtime repair failed: live-section page fallback missing');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// Pointer activation inside the portal must not depend on the storefront's
// synthetic click-capture chain. Pointer/touch saves on pointer-up; keyboard
// activation continues to use click (detail===0), so one user action can only
// enter save() once.
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const marker = 'LIVE-SECTION-SAVE-ACTIVATION-v301018';

  if (!source.includes(marker)) {
    const pattern = /<button type="button" data-live-section-save="1" onClick=\{save\} disabled=\{isSaving\}/;
    if (!pattern.test(source)) {
      throw new Error('v30.10.18 final runtime repair failed: live-section save button anchor missing');
    }
    source = source.replace(
      pattern,
      `<button type="button" data-live-section-save="1"\n          /* ${marker} */\n          onPointerUp={event => { event.preventDefault(); void save(); }}\n          onClick={event => { if (event.detail === 0) void save(); }}\n          disabled={isSaving}`
    );
  }

  if (!source.includes(marker) ||
      !source.includes('onPointerUp={event => { event.preventDefault(); void save(); }}') ||
      !source.includes('onClick={event => { if (event.detail === 0) void save(); }}')) {
    throw new Error('v30.10.18 final runtime repair failed: deterministic save activation missing');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

console.log('v30.10.18 final live-section runtime guard + deterministic save activation applied.');
