const allowedTags = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL',
  'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
  'A', 'CODE', 'PRE', 'TABLE', 'TBODY', 'THEAD', 'TR',
  'TD', 'TH', 'SPAN', 'HR'
]);

export const escapeRichText = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const safeRichHref = (href: string): boolean =>
  /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim());

const safeColor = (input: string): string | null => {
  const value = input.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value.toLowerCase();
  if (/^(?:rgb|rgba|hsl|hsla)\(\s*[\d.%\s,+-]+\)$/i.test(value)) return value;
  if (/^(?:black|white|red|green|blue|orange|purple|gray|grey|navy|teal|maroon|olive|silver|lime|aqua|fuchsia|yellow|transparent|currentcolor)$/i.test(value)) {
    return value.toLowerCase();
  }
  return null;
};

const safeStyleFor = (tagName: string, rawAttrs: string): string => {
  const styleMatch = rawAttrs.match(/\bstyle\s*=\s*(["'])(.*?)\1/i);
  if (!styleMatch) return '';
  const style = styleMatch[2];
  const safe: string[] = [];

  if (['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(tagName)) {
    const align = style.match(/(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i);
    if (align) safe.push('text-align:' + align[1].toLowerCase());
  }

  if (tagName === 'SPAN') {
    const color = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const background = style.match(/(?:^|;)\s*background-color\s*:\s*([^;]+)/i);
    const fontSize = style.match(/(?:^|;)\s*font-size\s*:\s*([^;]+)/i);
    const safeTextColor = color && safeColor(color[1]);
    const safeBackground = background && safeColor(background[1]);
    if (safeTextColor) safe.push('color:' + safeTextColor);
    if (safeBackground) safe.push('background-color:' + safeBackground);
    if (fontSize && /^(?:[6-9]|[1-8]\d|9[0-6])(?:px|pt|rem|em|%)$/i.test(fontSize[1].trim())) {
      safe.push('font-size:' + fontSize[1].trim().toLowerCase());
    }
  }

  return safe.length ? ' style="' + escapeRichText(safe.join(';')) + '"' : '';
};

export const sanitizeRichHtml = (value: string): string => {
  let html = String(value || '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button)\b[^>]*\/?\s*>/gi, '');

  return html.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, rawName: string, rawAttrs: string) => {
    const name = rawName.toUpperCase();
    if (!allowedTags.has(name)) return '';
    const closing = /^<\//.test(tag);
    if (closing) return ['BR', 'HR'].includes(name) ? '' : '</' + name.toLowerCase() + '>';
    if (name === 'BR' || name === 'HR') return '<' + name.toLowerCase() + '>';

    if (name === 'A') {
      const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
      const href = hrefMatch?.[2] || '';
      if (!href || !safeRichHref(href)) return '<a>';
      return '<a href="' + escapeRichText(href) + '" rel="nofollow noopener noreferrer">';
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
  if (/<\/?(p|br|strong|b|em|i|u|s|del|h[1-6]|ul|ol|li|blockquote|a|code|pre|table|thead|tbody|tr|td|th|span|hr)\b/i.test(source)) {
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
