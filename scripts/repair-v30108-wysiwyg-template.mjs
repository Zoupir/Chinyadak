import fs from 'node:fs';

const file = 'scripts/templates/v30108-rich-text-composer.tsx.txt';
let source = fs.readFileSync(file, 'utf8');
const before = source;

if (!source.includes('const lastNonCollapsedRangeRef =')) {
  source = source.replace(
    '  const savedRangeRef = useRef<Range | null>(null);',
    '  const savedRangeRef = useRef<Range | null>(null);\n  const lastNonCollapsedRangeRef = useRef<Range | null>(null);'
  );
}

const oldSaveSelection = `  const saveSelection = () => {\n    const root = surfaceRef.current;\n    const selection = window.getSelection();\n    if (!root || !selection?.rangeCount) return;\n    const range = selection.getRangeAt(0);\n    if (!root.contains(range.commonAncestorContainer)) return;\n    savedRangeRef.current = range.cloneRange();\n    setSelectionRevision(revision => revision + 1);\n  };`;
const newSaveSelection = `  const saveSelection = () => {\n    const root = surfaceRef.current;\n    const selection = window.getSelection();\n    if (!root || !selection?.rangeCount) return;\n    const range = selection.getRangeAt(0);\n    if (!root.contains(range.commonAncestorContainer)) return;\n    const snapshot = range.cloneRange();\n    savedRangeRef.current = snapshot;\n    if (!snapshot.collapsed) lastNonCollapsedRangeRef.current = snapshot.cloneRange();\n    setSelectionRevision(revision => revision + 1);\n  };`;
if (source.includes(oldSaveSelection)) source = source.replace(oldSaveSelection, newSaveSelection);

const oldRestoreSelection = `  const restoreSelection = () => {\n    const root = surfaceRef.current;\n    if (!root) return false;\n    root.focus({ preventScroll: true });\n    const range = savedRangeRef.current;\n    const selection = window.getSelection();\n    if (!range || !selection) return false;\n    try {\n      selection.removeAllRanges();\n      selection.addRange(range);\n      return true;\n    } catch {\n      return false;\n    }\n  };`;
const newRestoreSelection = `  const restoreSelection = (preferNonCollapsed = false) => {\n    const root = surfaceRef.current;\n    if (!root) return false;\n    const saved = savedRangeRef.current;\n    const preferred = preferNonCollapsed && (!saved || saved.collapsed)\n      ? lastNonCollapsedRangeRef.current\n      : saved;\n    if (!preferred) return false;\n    root.focus({ preventScroll: true });\n    const selection = window.getSelection();\n    if (!selection) return false;\n    try {\n      selection.removeAllRanges();\n      selection.addRange(preferred.cloneRange());\n      return true;\n    } catch {\n      return false;\n    }\n  };`;
if (source.includes(oldRestoreSelection)) source = source.replace(oldRestoreSelection, newRestoreSelection);

if (!source.includes('const applyInlineStyle =')) {
  const marker = `  const exec = (command: string, commandValue?: string) => {\n    restoreSelection();`;
  const index = source.indexOf(marker);
  if (index < 0) throw new Error('v30.10.8 WYSIWYG exec insertion marker missing.');
  const helper = `  const applyInlineStyle = (styles: Partial<CSSStyleDeclaration>) => {\n    const root = surfaceRef.current;\n    if (!root || !restoreSelection(true)) return;\n    const selection = window.getSelection();\n    if (!selection?.rangeCount) return;\n    const range = selection.getRangeAt(0);\n    if (!root.contains(range.commonAncestorContainer)) return;\n\n    if (range.collapsed) {\n      const span = document.createElement('span');\n      Object.assign(span.style, styles);\n      span.appendChild(document.createTextNode('\\u200b'));\n      range.insertNode(span);\n      const next = document.createRange();\n      next.setStart(span.firstChild || span, 1);\n      next.collapse(true);\n      selection.removeAllRanges();\n      selection.addRange(next);\n      savedRangeRef.current = next.cloneRange();\n      emit();\n      return;\n    }\n\n    const wrapper = document.createElement('span');\n    Object.assign(wrapper.style, styles);\n    try {\n      range.surroundContents(wrapper);\n    } catch {\n      const fragment = range.extractContents();\n      wrapper.appendChild(fragment);\n      range.insertNode(wrapper);\n    }\n    const next = document.createRange();\n    next.selectNodeContents(wrapper);\n    selection.removeAllRanges();\n    selection.addRange(next);\n    savedRangeRef.current = next.cloneRange();\n    lastNonCollapsedRangeRef.current = next.cloneRange();\n    setSelectionRevision(revision => revision + 1);\n    emit();\n  };\n\n`;
  source = source.slice(0, index) + helper + source.slice(index);
} else {
  source = source.replace(
    '    if (!root || !restoreSelection()) return;\n    const selection = window.getSelection();',
    '    if (!root || !restoreSelection(true)) return;\n    const selection = window.getSelection();'
  );
  const postStyleNeedle = `    savedRangeRef.current = next.cloneRange();\n    setSelectionRevision(revision => revision + 1);\n    emit();\n  };`;
  const postStyleReplacement = `    savedRangeRef.current = next.cloneRange();\n    lastNonCollapsedRangeRef.current = next.cloneRange();\n    setSelectionRevision(revision => revision + 1);\n    emit();\n  };`;
  if (source.includes(postStyleNeedle)) source = source.replace(postStyleNeedle, postStyleReplacement);
}

const oldFontSize = `  const execFontSize = (size: string) => {\n    if (!size) return;\n    restoreSelection();\n    document.execCommand('styleWithCSS', false, 'false');\n    document.execCommand('fontSize', false, '7');\n    const root = surfaceRef.current;\n    if (root) convertFontTags(root, size);\n    document.execCommand('styleWithCSS', false, 'true');\n    setFontSize(size);\n    saveSelection();\n    emit();\n  };`;
const newFontSize = `  const execFontSize = (size: string) => {\n    if (!size) return;\n    setFontSize(size);\n    applyInlineStyle({ fontSize: size });\n  };`;
if (source.includes(oldFontSize)) source = source.replace(oldFontSize, newFontSize);

const oldFontFamily = `  const execFontFamily = (family: string) => {\n    if (!family) return;\n    restoreSelection();\n    document.execCommand('styleWithCSS', false, 'false');\n    document.execCommand('fontName', false, family);\n    const root = surfaceRef.current;\n    if (root) convertFontTags(root, undefined, family);\n    document.execCommand('styleWithCSS', false, 'true');\n    setFontFamily(family);\n    saveSelection();\n    emit();\n  };`;
const newFontFamily = `  const execFontFamily = (family: string) => {\n    if (!family) return;\n    setFontFamily(family);\n    applyInlineStyle({ fontFamily: family });\n  };`;
if (source.includes(oldFontFamily)) source = source.replace(oldFontFamily, newFontFamily);

source = source
  .replace(`onClick={() => exec('bold')}`, `onClick={() => applyInlineStyle({ fontWeight: '700' })}`)
  .replace(`onClick={() => exec('italic')}`, `onClick={() => applyInlineStyle({ fontStyle: 'italic' })}`)
  .replace(`onClick={() => exec('underline')}`, `onClick={() => applyInlineStyle({ textDecoration: 'underline' })}`)
  .replace(`onClick={() => exec('strikeThrough')}`, `onClick={() => applyInlineStyle({ textDecoration: 'line-through' })}`)
  .replace(`setTextColor(event.currentTarget.value); exec('foreColor', event.currentTarget.value);`, `setTextColor(event.currentTarget.value); applyInlineStyle({ color: event.currentTarget.value });`)
  .replace(`setHighlightColor(event.currentTarget.value); exec('hiliteColor', event.currentTarget.value);`, `setHighlightColor(event.currentTarget.value); applyInlineStyle({ backgroundColor: event.currentTarget.value });`);

const toolbarNeedle = '<div className="rich-text-toolbar" role="toolbar" aria-label="ابزارهای قالب‌بندی متن">';
const toolbarReplacement = '<div className="rich-text-toolbar" role="toolbar" aria-label="ابزارهای قالب‌بندی متن" onPointerDownCapture={saveSelection}>';
if (source.includes(toolbarNeedle)) source = source.replace(toolbarNeedle, toolbarReplacement);

if (!source.includes('const applyInlineStyle =')) throw new Error('v30.10.8 deterministic inline style helper missing.');
if (!source.includes('const lastNonCollapsedRangeRef =')) throw new Error('v30.10.8 non-collapsed selection memory missing.');
if (!source.includes('restoreSelection(true)')) throw new Error('v30.10.8 inline formatting does not prefer selected text.');
if (!source.includes('onPointerDownCapture={saveSelection}')) throw new Error('v30.10.8 toolbar selection capture missing.');
if (!source.includes("applyInlineStyle({ fontWeight: '700' })")) throw new Error('v30.10.8 bold range style wiring missing.');
if (!source.includes('applyInlineStyle({ color: event.currentTarget.value })')) throw new Error('v30.10.8 color range style wiring missing.');

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.8 WYSIWYG template upgraded with persistent Range selection styling.');
} else {
  console.log('v30.10.8 WYSIWYG template persistent Range styling already active.');
}
