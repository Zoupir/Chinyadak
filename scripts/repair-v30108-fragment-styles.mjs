import fs from 'node:fs';

const file = 'scripts/templates/v30108-rich-text-composer.tsx.txt';
let source = fs.readFileSync(file, 'utf8');

const applyCssStart = source.indexOf('  const applyCssStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {');
const applyInlineStart = source.indexOf('  const applyInlineStyle = (styles: Partial<CSSStyleDeclaration>) => {');
const start = applyCssStart >= 0 ? applyCssStart : applyInlineStart;
const end = source.indexOf('\n\n  const exec = (command: string, commandValue?: string) => {', start);
if (start < 0 || end < 0) throw new Error('v30.10.8 formatting helper block not found.');

const replacement = `  const applyCssStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
    const propertyNames: Record<string, string> = {
      fontWeight: 'font-weight',
      fontStyle: 'font-style',
      textDecoration: 'text-decoration',
      color: 'color',
      backgroundColor: 'background-color',
      fontSize: 'font-size',
      fontFamily: 'font-family'
    };
    for (const [key, rawValue] of Object.entries(styles)) {
      const value = String(rawValue || '').trim();
      if (!value) continue;
      element.style.setProperty(propertyNames[key] || key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), value, 'important');
    }
  };

  const applyInlineStyle = (styles: Partial<CSSStyleDeclaration>) => {
    const root = surfaceRef.current;
    if (!root || !restoreSelection(true)) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      const span = document.createElement('span');
      applyCssStyles(span, styles);
      span.appendChild(document.createTextNode('\\u200b'));
      range.insertNode(span);
      const next = document.createRange();
      next.setStart(span.firstChild || span, 1);
      next.collapse(true);
      selection.removeAllRanges();
      selection.addRange(next);
      savedRangeRef.current = next.cloneRange();
      emit();
      return;
    }

    // Extracting the selected fragment avoids invalid markup such as <span><p>…</p></span>.
    // Block nodes receive the authored style directly; naked selected text is wrapped in a span.
    const fragment = range.extractContents();
    const nodes = Array.from(fragment.childNodes);
    if (!nodes.length) return;
    for (const node of nodes) {
      if (node instanceof HTMLElement) {
        applyCssStyles(node, styles);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const span = document.createElement('span');
        applyCssStyles(span, styles);
        span.textContent = node.textContent;
        fragment.replaceChild(span, node);
        const index = nodes.indexOf(node);
        nodes[index] = span;
      }
    }

    range.insertNode(fragment);
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const next = document.createRange();
    next.setStartBefore(first);
    next.setEndAfter(last);
    selection.removeAllRanges();
    selection.addRange(next);
    savedRangeRef.current = next.cloneRange();
    lastNonCollapsedRangeRef.current = next.cloneRange();
    setSelectionRevision(revision => revision + 1);
    emit();
  };`;

source = source.slice(0, start) + replacement + source.slice(end);

const occurrences = (source.match(/const applyCssStyles =/g) || []).length;
if (occurrences !== 1) throw new Error(`v30.10.8 expected one applyCssStyles helper, found ${occurrences}.`);
if (!source.includes("element.style.setProperty(propertyNames[key]")) throw new Error('v30.10.8 important inline style writer missing.');
if (!source.includes('const fragment = range.extractContents();')) throw new Error('v30.10.8 valid fragment styling missing.');
if (source.includes('range.surroundContents(wrapper)')) throw new Error('v30.10.8 invalid block wrapper algorithm still present.');

fs.writeFileSync(file, source);
console.log('v30.10.8 WYSIWYG formatting repair is idempotent and styles valid selected fragments with explicit priority.');
