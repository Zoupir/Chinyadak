import fs from 'node:fs';

const file = 'scripts/templates/v30108-rich-text-composer.tsx.txt';
let source = fs.readFileSync(file, 'utf8');
const before = source;

const marker = '          onKeyUp={saveSelection}\n          onMouseUp={saveSelection}';
const replacement = `          onKeyDown={event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
              const root = surfaceRef.current;
              const selection = window.getSelection();
              if (root && selection) {
                event.preventDefault();
                const range = document.createRange();
                range.selectNodeContents(root);
                selection.removeAllRanges();
                selection.addRange(range);
                savedRangeRef.current = range.cloneRange();
                lastNonCollapsedRangeRef.current = range.cloneRange();
                setSelectionRevision(revision => revision + 1);
              }
            }
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}`;

if (!source.includes('range.selectNodeContents(root);')) {
  if (!source.includes(marker)) throw new Error('v30.10.8 editor keyboard selection marker missing.');
  source = source.replace(marker, replacement);
}

if (!source.includes('range.selectNodeContents(root);') || !source.includes('lastNonCollapsedRangeRef.current = range.cloneRange();')) {
  throw new Error('v30.10.8 explicit editor Ctrl+A selection was not installed.');
}

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.8 editor Ctrl+A now selects only the editable surface and persists the range.');
} else {
  console.log('v30.10.8 editor Ctrl+A selection handling already active.');
}
