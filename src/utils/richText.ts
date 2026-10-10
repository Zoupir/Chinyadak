const allowedTags = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL',
  'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
  'A', 'CODE', 'PRE', 'TABLE', 'TBODY', 'THEAD', 'TR',
  'TD', 'TH', 'SPAN', 'DIV', 'HR', 'IMG', 'AUDIO', 'VIDEO'
]);

export const escapeRichText = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const safeRichHref = (href: string): boolean =>
  /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim());

export const safeRichSrc = (src: string): boolean =>
  /^(https?:\/\/|\/)/i.test(src.trim());

const safeColor = (input: string): string | null => {
  const value = String(input || '').trim().replace(/\s*!important\s*$/i, '');
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value.toLowerCase();
  if (/^(?:rgb|rgba|hsl|hsla)\(\s*[\d.%\s,+-]+\)$/i.test(value)) return value;
  if (/^(?:black|white|red|green|blue|orange|purple|gray|grey|navy|teal|maroon|olive|silver|lime|aqua|fuchsia|yellow|transparent|currentcolor)$/i.test(value)) {
    return value.toLowerCase();
  }
  return null;
};

const stripStylePriority = (value: string): string =>
  String(value || '').trim().replace(/\s*!important\s*$/i, '').trim();

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

// Compatibility sentinel for the historical v30.5.1/v30.5.2 source migrators.
//   if (['SPAN', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(tagName)) {
//   const value = input.trim().replace(/\s*!important\s*$/i, '');
// RICH-TEXT-STYLE-FIDELITY-v301015
// RICH-TEXT-ROUNDTRIP-v301018
const safeStyleFor = (tagName: string, rawAttrs: string): string => {
  const styleMatch = rawAttrs.match(/\bstyle\s*=\s*(["'])(.*?)\1/i);
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
    if (/^(?:normal|[1-3](?:\.\d{1,2})?)$/.test(lineHeight)) {
      safe.push('line-height:' + lineHeight + '!important');
    }
  }

  if (textStyleTags.includes(tagName)) {
    const textColor = safeColor(styleValue(style, 'color'));
    const background = safeColor(styleValue(style, 'background-color'));
    const fontSize = styleValue(style, 'font-size').toLowerCase();
    const fontWeight = styleValue(style, 'font-weight').toLowerCase();
    const fontStyle = styleValue(style, 'font-style').toLowerCase();
    const decoration = styleValue(style, 'text-decoration').toLowerCase().replace(/\s+/g, ' ');
    const decorationLine = styleValue(style, 'text-decoration-line').toLowerCase().replace(/\s+/g, ' ');
    const rawFamily = styleValue(style, 'font-family').replace(/[\"']/g, '').trim();

    if (textColor) safe.push('color:' + textColor + '!important');
    if (background) safe.push('background-color:' + background + '!important');
    if (/^(?:[6-9]|[1-8]\d|9[0-6])(?:px|pt|rem|em|%)$/i.test(fontSize)) {
      safe.push('font-size:' + fontSize + '!important');
    }
    if (/^(?:normal|bold|[1-9]00)$/.test(fontWeight)) safe.push('font-weight:' + fontWeight + '!important');
    if (/^(?:normal|italic)$/.test(fontStyle)) safe.push('font-style:' + fontStyle + '!important');
    const normalizedDecoration = decoration || decorationLine;
    if (/^(?:none|underline|line-through|underline line-through|line-through underline)$/.test(normalizedDecoration)) {
      safe.push('text-decoration:' + normalizedDecoration + '!important');
    }
    if (/^(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace)(?:\s*,\s*(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace))*$/i.test(rawFamily)) {
      safe.push('font-family:' + rawFamily + '!important');
    }
  }

  return safe.length ? ' style="' + escapeRichText(safe.join(';')) + '"' : '';
};

const safeAttr = (rawAttrs: string, name: string): string => {
  const quoted = rawAttrs.match(new RegExp('\\b' + name + '\\s*=\\s*(["\\\'])(.*?)\\1', 'i'));
  if (quoted?.[2]) return quoted[2];
  const bare = rawAttrs.match(new RegExp('\\b' + name + '\\s*=\\s*([^\\s>]+)', 'i'));
  return bare?.[1] || '';
};

export const sanitizeRichHtml = (value: string): string => {
  let html = String(value || '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button)\b[^>]*\/?\s*>/gi, '');

  return html.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, rawName: string, rawAttrs: string) => {
    const name = rawName.toUpperCase();
    if (!allowedTags.has(name)) return '';
    const closing = /^<\//.test(tag);
    if (closing) return ['BR', 'HR', 'IMG'].includes(name) ? '' : '</' + name.toLowerCase() + '>';
    if (name === 'BR' || name === 'HR') return '<' + name.toLowerCase() + '>';

    if (name === 'A') {
      const href = safeAttr(rawAttrs, 'href');
      const targetBlank = /\btarget\s*=\s*(["'])_blank\1/i.test(rawAttrs);
      const safeStyle = safeStyleFor(name, rawAttrs);
      if (!href || !safeRichHref(href)) return '<a' + safeStyle + '>';
      return '<a href="' + escapeRichText(href) + '"' + (targetBlank ? ' target="_blank"' : '') + ' rel="nofollow noopener noreferrer"' + safeStyle + '>';
    }

    if (name === 'IMG') {
      const src = safeAttr(rawAttrs, 'src');
      if (!src || !safeRichSrc(src)) return '';
      const alt = safeAttr(rawAttrs, 'alt');
      const title = safeAttr(rawAttrs, 'title');
      return '<img src="' + escapeRichText(src) + '" alt="' + escapeRichText(alt) + '"' + (title ? ' title="' + escapeRichText(title) + '"' : '') + ' loading="lazy">';
    }

    if (name === 'AUDIO') {
      const src = safeAttr(rawAttrs, 'src');
      if (!src || !safeRichSrc(src)) return '<audio controls preload="metadata">';
      return '<audio src="' + escapeRichText(src) + '" controls preload="metadata">';
    }

    if (name === 'VIDEO') {
      const src = safeAttr(rawAttrs, 'src');
      const poster = safeAttr(rawAttrs, 'poster');
      const posterAttr = poster && safeRichSrc(poster) ? ' poster="' + escapeRichText(poster) + '"' : '';
      if (!src || !safeRichSrc(src)) return '<video controls preload="metadata" playsinline' + posterAttr + '>';
      return '<video src="' + escapeRichText(src) + '" controls preload="metadata" playsinline' + posterAttr + '>';
    }

    if (name === 'TD' || name === 'TH') {
      const spans: string[] = [];
      for (const attr of ['colspan', 'rowspan']) {
        const match = attr === 'colspan'
          ? rawAttrs.match(/\bcolspan\s*=\s*["']?(\d{1,2})/i)
          : rawAttrs.match(/\browspan\s*=\s*["']?(\d{1,2})/i);
        const number = Number(match?.[1] || 1);
        if (number >= 1 && number <= 20) spans.push(attr + '="' + number + '"');
      }
      return '<' + name.toLowerCase() + (spans.length ? ' ' + spans.join(' ') : '') + safeStyleFor(name, rawAttrs) + '>';
    }

    return '<' + name.toLowerCase() + safeStyleFor(name, rawAttrs) + '>';
  });
};

export const markdownToSafeHtml = (value: string): string => {
  const source = String(value || '');
  if (/<\/?(p|br|strong|b|em|i|u|s|del|h[1-6]|ul|ol|li|blockquote|a|code|pre|table|thead|tbody|tr|td|th|span|div|hr|img|audio|video)\b/i.test(source)) {
    return sanitizeRichHtml(source);
  }

  const escaped = escapeRichText(source);
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (!list.length) return;
    out.push('<ul>' + list.map(item => '<li>' + item + '</li>').join('') + '</ul>');
    list = [];
  };

  const inline = (line: string) => line
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) =>
      safeRichHref(href) ? '<a href="' + escapeRichText(href) + '" rel="nofollow noopener noreferrer">' + label + '</a>' : label);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      list.push(inline(bullet[1]));
      continue;
    }
    flush();
    if (heading) {
      const level = Math.min(4, heading[1].length + 1);
      out.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>');
    } else if (/^>\s?/.test(line)) {
      out.push('<blockquote>' + inline(line.replace(/^>\s?/, '')) + '</blockquote>');
    } else {
      out.push('<p>' + inline(line) + '</p>');
    }
  }

  flush();
  return sanitizeRichHtml(out.join(''));
};

export const normalizeRichTextForPersistence = (value: string): string =>
  markdownToSafeHtml(String(value || ''));

// Historical v30.5.2 migrator idempotence marker. Keep this exact text outside
// the sanitizer block so earlier source migrations cannot rewrite it away.
//     if (safeTextColor) safe.push('color:' + safeTextColor + '!important');
