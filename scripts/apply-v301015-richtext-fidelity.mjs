import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.18 marker missing: ${label}`); };

// Keep canonical and prepared source on the same Rich Text contract. This stage
// runs during every build, so it must not re-introduce the older sanitizer.
{
  const file = 'src/utils/richText.ts';
  let source = read(file);
  source = source.replace(
    "  'TD', 'TH', 'SPAN', 'HR', 'IMG', 'AUDIO', 'VIDEO'",
    "  'TD', 'TH', 'SPAN', 'DIV', 'HR', 'IMG', 'AUDIO', 'VIDEO'"
  );
  const safeStyleStart = source.indexOf('const safeStyleFor = (tagName: string, rawAttrs: string): string => {');
  const existingHelperStart = source.indexOf('const stripStylePriority = (value: string): string =>');
  const start = existingHelperStart >= 0 && existingHelperStart < safeStyleStart
    ? existingHelperStart
    : safeStyleStart;
  const end = source.indexOf('\n\nconst safeAttr =', safeStyleStart >= 0 ? safeStyleStart : start);
  if (start < 0 || safeStyleStart < 0 || end < 0) fail('richText safeStyleFor block');

  const replacement = `const stripStylePriority = (value: string): string =>
  String(value || '').trim().replace(/\\s*!important\\s*$/i, '').trim();

const styleValue = (style: string, property: string): string => {
  for (const declaration of String(style || '').split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const key = declaration.slice(0, colon).trim().toLowerCase();
    if (key !== property.toLowerCase()) continue;
    return stripStylePriority(declaration.slice(colon + 1));
  }
  return '';
};

// RICH-TEXT-STYLE-FIDELITY-v301015
// RICH-TEXT-ROUNDTRIP-v301018
const safeStyleFor = (tagName: string, rawAttrs: string): string => {
  const styleMatch = rawAttrs.match(/\\bstyle\\s*=\\s*(["'])(.*?)\\1/i);
  if (!styleMatch) return '';
  const style = styleMatch[2];
  const safe: string[] = [];

  const blockStyleTags = ['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'DIV', 'LI', 'UL', 'OL', 'TD', 'TH'];
  const textStyleTags = [
    'P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL',
    'DIV', 'LI', 'UL', 'OL', 'TD', 'TH', 'CODE'
  ];

  if (blockStyleTags.includes(tagName)) {
    const align = styleValue(style, 'text-align').toLowerCase();
    if (/^(left|right|center|justify)$/.test(align)) safe.push('text-align:' + align + '!important');

    const lineHeight = styleValue(style, 'line-height').toLowerCase();
    if (/^(?:normal|[1-3](?:\\.\\d{1,2})?)$/.test(lineHeight)) {
      safe.push('line-height:' + lineHeight + '!important');
    }
  }

  if (textStyleTags.includes(tagName)) {
    const textColor = safeColor(styleValue(style, 'color'));
    const background = safeColor(styleValue(style, 'background-color'));
    const fontSize = styleValue(style, 'font-size').toLowerCase();
    const fontWeight = styleValue(style, 'font-weight').toLowerCase();
    const fontStyle = styleValue(style, 'font-style').toLowerCase();
    const decoration = styleValue(style, 'text-decoration').toLowerCase().replace(/\\s+/g, ' ');
    const decorationLine = styleValue(style, 'text-decoration-line').toLowerCase().replace(/\\s+/g, ' ');
    const rawFamily = styleValue(style, 'font-family').replace(/[\\\"']/g, '').trim();

    if (textColor) safe.push('color:' + textColor + '!important');
    if (background) safe.push('background-color:' + background + '!important');
    if (/^(?:[6-9]|[1-8]\\d|9[0-6])(?:px|pt|rem|em|%)$/i.test(fontSize)) {
      safe.push('font-size:' + fontSize + '!important');
    }
    if (/^(?:normal|bold|[1-9]00)$/.test(fontWeight)) safe.push('font-weight:' + fontWeight + '!important');
    if (/^(?:normal|italic)$/.test(fontStyle)) safe.push('font-style:' + fontStyle + '!important');
    const normalizedDecoration = decoration || decorationLine;
    if (/^(?:none|underline|line-through|underline line-through|line-through underline)$/.test(normalizedDecoration)) {
      safe.push('text-decoration:' + normalizedDecoration + '!important');
    }
    if (/^(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace)(?:\\s*,\\s*(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace))*$/i.test(rawFamily)) {
      safe.push('font-family:' + rawFamily + '!important');
    }
  }

  return safe.length ? ' style="' + escapeRichText(safe.join(';')) + '"' : '';
};`;

  source = source.slice(0, start) + replacement + source.slice(end);
  if (!source.includes('RICH-TEXT-STYLE-FIDELITY-v301015')) fail('sanitizer fidelity marker');
  if (!source.includes('RICH-TEXT-ROUNDTRIP-v301018')) fail('sanitizer roundtrip marker');
  if ((source.match(/const stripStylePriority =/g) || []).length !== 1) fail('single stripStylePriority helper');
  if ((source.match(/const styleValue =/g) || []).length !== 1) fail('single styleValue helper');
  write(file, source);
}

// Enforce one persistence format: safe canonical HTML. Legacy Markdown remains
// readable but is normalized into HTML before Preview/Save/Storefront use it.
{
  const file = 'src/components/common/RichTextEditor.tsx';
  let source = read(file);
  source = source.replace(
    "import React, { Suspense, lazy, useEffect, useState } from 'react';",
    "import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';"
  );
  source = source.replace(
    "import { sanitizeRichHtml } from '../../utils/richText';",
    "import { markdownToSafeHtml } from '../../utils/richText';"
  );

  if (!source.includes('const normalizedLegacyValueRef = useRef')) {
    const plainAnchor = "  const [sourceDraft, setSourceDraft] = useState(value || '');";
    const canonicalAnchor = "  const [sourceDraft, setSourceDraft] = useState(() => markdownToSafeHtml(value || ''));";
    if (source.includes(plainAnchor)) source = source.replace(plainAnchor, `${canonicalAnchor}\n  const normalizedLegacyValueRef = useRef<string>('');`);
    else if (source.includes(canonicalAnchor)) source = source.replace(canonicalAnchor, `${canonicalAnchor}\n  const normalizedLegacyValueRef = useRef<string>('');`);
    else fail('RichTextEditor sourceDraft state');
  } else {
    source = source.replace(
      "  const [sourceDraft, setSourceDraft] = useState(value || '');",
      "  const [sourceDraft, setSourceDraft] = useState(() => markdownToSafeHtml(value || ''));"
    );
  }

  const oldEffect = `  useEffect(() => {\n    if (activeTab !== 'source') setSourceDraft(value || '');\n  }, [value, activeTab]);`;
  const canonicalEffect = `  // RICH-TEXT-CANONICAL-HTML-v301015\n  // RICH-TEXT-ROUNDTRIP-v301018\n  useEffect(() => {\n    const raw = String(value || '');\n    const normalized = markdownToSafeHtml(raw);\n    if (activeTab !== 'source') setSourceDraft(normalized);\n    if (raw && normalized !== raw && normalizedLegacyValueRef.current !== raw) {\n      normalizedLegacyValueRef.current = raw;\n      onChange(normalized);\n    }\n  }, [value, activeTab, onChange]);`;
  if (source.includes(oldEffect)) {
    source = source.replace(oldEffect, canonicalEffect);
  } else if (source.includes('// RICH-TEXT-CANONICAL-HTML-v301015') && !source.includes('RICH-TEXT-ROUNDTRIP-v301018')) {
    source = source.replace('// RICH-TEXT-CANONICAL-HTML-v301015', '// RICH-TEXT-CANONICAL-HTML-v301015\n  // RICH-TEXT-ROUNDTRIP-v301018');
  }

  source = source.replace(
    "    const safe = sanitizeRichHtml(sourceDraft || '');",
    "    const safe = markdownToSafeHtml(sourceDraft || '');"
  );
  source = source.replace(
    "    if (tab === 'source') setSourceDraft(value || '');",
    "    if (tab === 'source') setSourceDraft(markdownToSafeHtml(value || ''));"
  );
  source = source.replace(/data-rich-editor-version="[^"]+"/, 'data-rich-editor-version="30.10.18"');

  if (!source.includes('RICH-TEXT-CANONICAL-HTML-v301015')) fail('canonical HTML marker');
  if (!source.includes('RICH-TEXT-ROUNDTRIP-v301018')) fail('editor roundtrip marker');
  if (!source.includes('markdownToSafeHtml(sourceDraft')) fail('canonical source save');
  write(file, source);
}

// Make default link/bold rendering immune to theme resets. Authored inline
// colors remain stronger because inline !important wins over stylesheet rules.
{
  const file = 'src/components/common/RichTextEditor.css';
  let source = read(file);
  const marker = '/* STOREFRONT-RICH-TEXT-FIDELITY-v301015 */';
  if (!source.includes(marker)) {
    source += `\n\n${marker}\n.rich-text-content a[href] {\n  color: #c2410c !important;\n  text-decoration: underline !important;\n  text-decoration-color: currentColor !important;\n  text-underline-offset: 2px;\n}\n.rich-text-content strong,\n.rich-text-content b {\n  font-weight: 700 !important;\n}\n`;
  }
  write(file, source);
}

console.log('v30.10.18 rich-text canonical HTML + styled roundtrip contract applied.');