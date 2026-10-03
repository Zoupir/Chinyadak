const allowedTags = new Set(['P','BR','STRONG','B','EM','I','U','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','A','CODE','PRE','TABLE','TBODY','TR','TD','TH']);

export const escapeRichText = (value: string): string => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const safeRichHref = (href: string): boolean =>
  /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim());

export const sanitizeRichHtml = (value: string): string => {
  let html = String(value || '').replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?\s*>/gi, '');
  return html.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, rawName: string, rawAttrs: string) => {
    const name = rawName.toUpperCase();
    if (!allowedTags.has(name)) return '';
    const closing = /^<\//.test(tag);
    if (closing) return ['BR'].includes(name) ? '' : `</${name.toLowerCase()}>`;
    if (name === 'BR') return '<br>';
    if (name !== 'A') return `<${name.toLowerCase()}>`;
    const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(['"])(.*?)\1/i);
    const href = hrefMatch?.[2] || '';
    if (!href || !safeRichHref(href)) return '<a>';
    return `<a href="${escapeRichText(href)}" rel="nofollow noopener noreferrer">`;
  });
};

export const markdownToSafeHtml = (value: string): string => {
  const source = String(value || '');
  if (/<\/?(p|strong|b|em|i|u|h[1-6]|ul|ol|li|blockquote|a|code|pre)\b/i.test(source)) {
    return sanitizeRichHtml(source);
  }
  const escaped = escapeRichText(source);
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map(item => `<li>${item}</li>`).join('')}</ul>`); list = []; } };
  const inline = (line: string) => line
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) =>
      safeRichHref(href) ? `<a href="${escapeRichText(href)}" rel="nofollow noopener noreferrer">${label}</a>` : label);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) { list.push(inline(bullet[1])); continue; }
    flush();
    if (heading) out.push(`<h${Math.min(4, heading[1].length + 1)}>${inline(heading[2])}</h${Math.min(4, heading[1].length + 1)}>`);
    else if (/^>\s?/.test(line)) out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return sanitizeRichHtml(out.join(''));
};
