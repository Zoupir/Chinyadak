const ALLOWED_TAGS = new Set(['a', 'img', 'div', 'span', 'p', 'strong', 'small', 'br']);
const VOID_TAGS = new Set(['img', 'br']);

const escapeAttr = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const safeUrl = (value: string, kind: 'href' | 'src'): string | null => {
  const input = value.trim();
  if (!input) return null;
  if (input.startsWith('/')) return input;
  try {
    const parsed = new URL(input, 'https://yadak.store');
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const sanitizeAttributes = (tag: string, raw: string): string => {
  const attrs: string[] = [];
  const attrPattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(raw))) {
    const name = match[1].toLowerCase();
    const value = String(match[2] ?? match[3] ?? match[4] ?? '');
    if (name.startsWith('on')) continue;

    if (tag === 'a' && name === 'href') {
      const url = safeUrl(value, 'href');
      if (url) attrs.push(`href="${escapeAttr(url)}"`);
      continue;
    }
    if (tag === 'img' && name === 'src') {
      const url = safeUrl(value, 'src');
      if (url) attrs.push(`src="${escapeAttr(url)}"`);
      continue;
    }
    if (tag === 'a' && name === 'target' && ['_blank', '_self'].includes(value)) {
      attrs.push(`target="${value}"`);
      continue;
    }
    if (tag === 'a' && name === 'rel') continue;
    if (tag === 'img' && ['alt', 'title', 'referrerpolicy', 'width', 'height'].includes(name)) {
      attrs.push(`${name}="${escapeAttr(value.slice(0, 500))}"`);
      continue;
    }
    if (['div', 'span', 'p', 'strong', 'small', 'a', 'img'].includes(tag) && ['class', 'id'].includes(name)) {
      const clean = value.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 200);
      if (clean) attrs.push(`${name}="${escapeAttr(clean)}"`);
    }
  }
  if (tag === 'a') attrs.push('rel="nofollow noopener noreferrer"');
  return attrs.length ? ' ' + attrs.join(' ') : '';
};

/**
 * Strict allow-list sanitizer for administrator-provided trust-badge snippets.
 * Script/style/iframe/svg/event handlers and javascript/data URLs are removed.
 */
export const sanitizeTrustedEmbedHtml = (input: unknown): string => {
  const source = String(input ?? '');
  if (!source) return '';

  return source.replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/g, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const closing = /^<\//.test(full);
    if (closing) return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
    const attrs = sanitizeAttributes(tag, rawAttrs || '');
    return `<${tag}${attrs}>`;
  });
};
