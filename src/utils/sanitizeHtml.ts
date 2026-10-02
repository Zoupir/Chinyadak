const ALLOWED_TAGS = new Set([
  'a',
  'img',
  'div',
  'span',
  'p',
  'strong',
  'b',
  'em',
  'i',
  'small',
  'br'
]);

const GLOBAL_ATTRIBUTES = new Set(['class', 'title', 'dir', 'lang']);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'referrerpolicy', 'aria-label']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding', 'referrerpolicy']),
  div: new Set(['aria-label']),
  span: new Set(['aria-label'])
};

const isSafeUrl = (value: string, allowDataImage = false): boolean => {
  const normalized = value.trim();
  if (!normalized) return true;
  if (normalized.startsWith('/') || normalized.startsWith('#')) return true;
  if (/^(https?:|mailto:|tel:)/i.test(normalized)) return true;
  if (allowDataImage && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(normalized)) return true;
  return false;
};

/**
 * Sanitizes administrator-provided trust-badge/footer embed markup.
 *
 * This intentionally supports the small subset of HTML needed by common trust
 * seals (anchors + images + simple wrappers) while stripping scripts, event
 * handlers, inline CSS, iframes and unsafe URL schemes.
 */
export const sanitizeEmbedHtml = (html: string): string => {
  if (!html || typeof document === 'undefined') return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  const sanitizeNode = (node: Node): void => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = element.parentNode;
      if (!parent) return;
      while (element.firstChild) parent.insertBefore(element.firstChild, element);
      parent.removeChild(element);
      return;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const allowed = GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[tag]?.has(name);
      if (!allowed || name.startsWith('on')) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'href' && !isSafeUrl(attr.value)) {
        element.removeAttribute(attr.name);
      }
      if (name === 'src' && !isSafeUrl(attr.value, true)) {
        element.removeAttribute(attr.name);
      }
    }

    if (tag === 'a') {
      const anchor = element as HTMLAnchorElement;
      if (anchor.target === '_blank') {
        anchor.rel = 'noopener noreferrer';
      }
    }

    for (const child of Array.from(element.childNodes)) {
      sanitizeNode(child);
    }
  };

  for (const child of Array.from(template.content.childNodes)) {
    sanitizeNode(child);
  }

  return template.innerHTML;
};
