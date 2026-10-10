import fs from 'node:fs';

const changed = [];
const copyTemplate = (template, target) => {
  const next = fs.readFileSync(template, 'utf8');
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (before !== next) {
    fs.writeFileSync(target, next);
    changed.push(target);
  }
};

copyTemplate('scripts/templates/v30104-media-route.ts.txt', 'src/server/routes/media.ts');
copyTemplate('scripts/templates/v30104-rich-media-route.ts.txt', 'src/server/routes/rich-media.ts');
copyTemplate('scripts/templates/v30104-api-media.ts.txt', 'src/api/media.ts');
copyTemplate('scripts/templates/v30104-admin-media-library.tsx.txt', 'src/components/admin/AdminMediaLibrary.tsx');
copyTemplate('scripts/templates/v30104-media-picker-modal.tsx.txt', 'src/components/common/MediaPickerModal.tsx');

const edit = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(file);
  }
};

// Stage 1 created the streamed rich-media router but older production source did
// not mount it. Stage 5 makes the endpoint first-class and keeps it behind the
// same API origin/CSRF guard and media-admin authorization.
edit('server.ts', source => {
  if (!source.includes("import { richMediaRouter } from './src/server/routes/rich-media';")) {
    const marker = "import { mediaRouter } from './src/server/routes/media';";
    if (!source.includes(marker)) throw new Error('v30.10.4 server media import marker missing');
    source = source.replace(marker, marker + "\nimport { richMediaRouter } from './src/server/routes/rich-media';");
  }
  if (!source.includes("app.use('/api/rich-media', richMediaRouter);")) {
    const marker = "app.use('/api/media', mediaRouter);";
    if (!source.includes(marker)) throw new Error('v30.10.4 server media mount marker missing');
    source = source.replace(marker, marker + "\napp.use('/api/rich-media', richMediaRouter);");
  }
  return source;
});

// Keep generated responsive widths as a mutable number[] instead of a literal
// tuple-derived array; this also supports very small images without enlarging.
edit('src/server/media-library.ts', source => source.replace(
  '    const widths = VARIANT_WIDTHS.filter(width => !originalWidth || width <= originalWidth);\n    if (!widths.length && originalWidth) widths.push(Math.max(1, Math.min(320, originalWidth)) as 320);',
  '    const widths: number[] = VARIANT_WIDTHS.filter(width => !originalWidth || width <= originalWidth);\n    if (!widths.length && originalWidth) widths.push(Math.max(1, Math.min(320, originalWidth)));'
));

// Node's Buffer is typed over ArrayBufferLike in TS 7, while BlobPart requires
// an ArrayBuffer-backed view. Copy to a fresh Uint8Array for the multipart smoke.
edit('scripts/smoke-v30104.ts', source => source
  .replace("new Blob([imageBuffer], { type: 'image/png' })", "new Blob([Uint8Array.from(imageBuffer)], { type: 'image/png' })")
  .replace("new Blob([audioBytes], { type: 'audio/mpeg' })", "new Blob([Uint8Array.from(audioBytes)], { type: 'audio/mpeg' })")
);

const required = [
  ['src/server/routes/media.ts', "kindRaw"],
  ['src/server/routes/media.ts', "MEDIA_FILE_IN_USE"],
  ['src/server/routes/media.ts', "getMediaLibraryItems"],
  ['src/server/routes/rich-media.ts', 'bufferedInMemory: false'],
  ['src/server/routes/rich-media.ts', 'registerUploadedMedia'],
  ['src/api/media.ts', 'getMediaReferences'],
  ['src/components/admin/AdminMediaLibrary.tsx', 'PAGE_SIZE = 80'],
  ['src/components/admin/AdminMediaLibrary.tsx', 'uploadRichMedia'],
  ['src/components/common/MediaPickerModal.tsx', "kind: 'image'"],
  ['server.ts', "app.use('/api/rich-media', richMediaRouter);"],
  ['src/server/media-library.ts', 'generateResponsiveImageVariants'],
  ['scripts/smoke-v30104.ts', 'Uint8Array.from(imageBuffer)']
];
for (const [file, marker] of required) {
  if (!fs.readFileSync(file, 'utf8').includes(marker)) {
    throw new Error(`v30.10.4 media preparation incomplete: ${file} :: ${marker}`);
  }
}

console.log(changed.length ? `v30.10.4 media pipeline applied: ${changed.join(', ')}` : 'v30.10.4 media pipeline already satisfied.');
