import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.15 marker missing: ${label}`); };

// 1) Make the sanitizer understand the exact CSS emitted by the WYSIWYG editor.
// The editor deliberately writes !important so storefront/theme CSS cannot erase
// authored styles. The old sanitizer accepted !important for colors only, which
// meant alignment, font weight, font size, font family and line-height were
// silently discarded before onChange fired.
{
  const file = 'src/utils/richText.ts';
  let source = read(file);
  const start = source.indexOf('const safeStyleFor = (tagName: string, rawAttrs: string): string => {');
  const end = source.indexOf('\n\nconst safeAttr =', start);
  if (start < 0 || end < 0) fail('richText safeStyleFor block');

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
    if (/^(?:normal|1(?:\\.\\d{1,2})?|2(?:\\.\\d{1,2})?|3(?:\\.0{1,2})?)$/.test(lineHeight)) {
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
    if (/^(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace)$/i.test(rawFamily)) {
      safe.push('font-family:' + rawFamily + '!important');
    }
  }

  return safe.length ? ' style="' + escapeRichText(safe.join(';')) + '"' : '';
};`;

  source = source.slice(0, start) + replacement + source.slice(end);
  if (!source.includes('RICH-TEXT-STYLE-FIDELITY-v301015')) fail('sanitizer fidelity marker');
  write(file, source);
}

// 2) Enforce one persistence format: safe HTML. Legacy Markdown remains readable,
// but as soon as a RichTextEditor opens it is normalized into HTML in form state.
// This makes Preview, HTML Source, Save and Storefront all operate on the same value.
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
    const anchor = "  const [sourceDraft, setSourceDraft] = useState(value || '');";
    if (!source.includes(anchor)) fail('RichTextEditor sourceDraft state');
    source = source.replace(anchor, `${anchor}\n  const normalizedLegacyValueRef = useRef<string>('');`);
  }

  const oldEffect = `  useEffect(() => {\n    if (activeTab !== 'source') setSourceDraft(value || '');\n  }, [value, activeTab]);`;
  const newEffect = `  // RICH-TEXT-CANONICAL-HTML-v301015\n  useEffect(() => {\n    const raw = String(value || '');\n    const normalized = markdownToSafeHtml(raw);\n    if (activeTab !== 'source') setSourceDraft(normalized);\n    if (raw && normalized !== raw && normalizedLegacyValueRef.current !== raw) {\n      normalizedLegacyValueRef.current = raw;\n      onChange(normalized);\n    }\n  }, [value, activeTab, onChange]);`;
  if (source.includes(oldEffect)) source = source.replace(oldEffect, newEffect);
  else if (!source.includes('RICH-TEXT-CANONICAL-HTML-v301015')) fail('RichTextEditor normalization effect');

  source = source.replace(
    "    const safe = sanitizeRichHtml(sourceDraft || '');",
    "    const safe = markdownToSafeHtml(sourceDraft || '');"
  );
  source = source.replace(
    "    if (tab === 'source') setSourceDraft(value || '');",
    "    if (tab === 'source') setSourceDraft(markdownToSafeHtml(value || ''));"
  );

  if (!source.includes('RICH-TEXT-CANONICAL-HTML-v301015')) fail('canonical HTML marker');
  write(file, source);
}

// 3) Make default link/bold rendering immune to theme resets. Authored inline
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

console.log('v30.10.15 rich-text canonical HTML + !important style fidelity applied.');
