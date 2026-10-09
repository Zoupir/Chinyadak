import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eraser, Highlighter,
  ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Music2, Palette, Quote,
  Redo2, Strikethrough, Table, Underline, Undo2, Unlink, Video
} from 'lucide-react';
import {
  escapeRichText,
  markdownToSafeHtml,
  safeRichHref,
  safeRichSrc,
  sanitizeRichHtml
} from '../../utils/richText';
import { MediaPickerModal } from './MediaPickerModal';
import './RichTextEditor.css';
import './RichTextEditorEnhancements.css';

interface RichTextComposerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  rows: number;
}

interface ToolButtonProps {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

type UrlMediaType = 'audio' | 'video';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];
const FONT_FAMILIES = [
  { value: '', label: 'فونت سایت' },
  { value: 'Vazirmatn', label: 'وزیرمتن' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Arial', label: 'Arial' },
  { value: 'sans-serif', label: 'Sans' }
];

const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, active, disabled, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onPointerDown={event => {
      event.preventDefault();
      if (event.button === 0) onClick();
    }}
    onMouseDown={event => event.preventDefault()}
    onClick={event => {
      if (event.detail === 0) onClick();
    }}
    className={'rich-text-tool' + (active ? ' is-active' : '')}
  >
    {children}
  </button>
);

const closestBlock = (node: Node | null, root: HTMLElement | null): HTMLElement | null => {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLElement && /^(P|H2|H3|H4|BLOCKQUOTE|LI|DIV|TD|TH)$/.test(current.tagName)) return current;
    current = current.parentNode;
  }
  return root;
};

const normalizedEditorHtml = (root: HTMLElement): string => {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-editor-placeholder]').forEach(node => node.removeAttribute('data-editor-placeholder'));
  return clone.innerHTML;
};

export const RichTextComposer: React.FC<RichTextComposerProps> = ({ value, onChange, placeholder, rows }) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastNonCollapsedRangeRef = useRef<Range | null>(null);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef(markdownToSafeHtml(value || ''));
  const [selectionRevision, setSelectionRevision] = useState(0);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [urlMediaType, setUrlMediaType] = useState<UrlMediaType | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [textColor, setTextColor] = useState('#c2410c');
  const [highlightColor, setHighlightColor] = useState('#fff3bf');
  const [fontSize, setFontSize] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [lineHeight, setLineHeight] = useState('');

  onChangeRef.current = onChange;

  const emit = () => {
    const root = surfaceRef.current;
    if (!root) return;
    const safe = sanitizeRichHtml(normalizedEditorHtml(root));
    if (safe === lastEmittedRef.current) return;
    lastEmittedRef.current = safe;
    onChangeRef.current(safe);
  };

  const saveSelection = () => {
    const root = surfaceRef.current;
    const selection = window.getSelection();
    if (!root || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const snapshot = range.cloneRange();
    savedRangeRef.current = snapshot;
    if (!snapshot.collapsed) lastNonCollapsedRangeRef.current = snapshot.cloneRange();
    setSelectionRevision(revision => revision + 1);
  };

  const restoreSelection = (preferNonCollapsed = false) => {
    const root = surfaceRef.current;
    if (!root) return false;
    const saved = savedRangeRef.current;
    const preferred = preferNonCollapsed && (!saved || saved.collapsed)
      ? lastNonCollapsedRangeRef.current
      : saved;
    if (!preferred) return false;
    root.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection) return false;
    try {
      selection.removeAllRanges();
      selection.addRange(preferred.cloneRange());
      return true;
    } catch {
      return false;
    }
  };

  const applyCssStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
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
      span.appendChild(document.createTextNode('\u200b'));
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
  };

  const exec = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, commandValue);
    saveSelection();
    emit();
  };

  const execFontSize = (size: string) => {
    if (!size) return;
    setFontSize(size);
    applyInlineStyle({ fontSize: size });
  };

  const execFontFamily = (family: string) => {
    if (!family) return;
    setFontFamily(family);
    applyInlineStyle({ fontFamily: family });
  };

  const applyBlockStyle = (property: 'lineHeight', nextValue: string) => {
    if (!nextValue) return;
    restoreSelection(true);
    const selection = window.getSelection();
    const root = surfaceRef.current;
    const block = closestBlock(selection?.anchorNode || null, root);
    if (block && block !== root) block.style[property] = nextValue;
    setLineHeight(nextValue);
    emit();
  };

  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emit();
  };

  useEffect(() => {
    const root = surfaceRef.current;
    if (!root) return;
    const incoming = markdownToSafeHtml(value || '');
    const current = sanitizeRichHtml(normalizedEditorHtml(root));
    if (incoming === lastEmittedRef.current || incoming === current) return;
    root.innerHTML = incoming;
    lastEmittedRef.current = incoming;
  }, [value]);

  useEffect(() => {
    const handler = () => saveSelection();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  useEffect(() => {
    const root = surfaceRef.current;
    if (!root || root.innerHTML) return;
    const initial = markdownToSafeHtml(value || '');
    root.innerHTML = initial;
    lastEmittedRef.current = initial;
  }, []);

  void selectionRevision;
  const commandActive = (command: string) => {
    try { return Boolean(document.queryCommandState(command)); } catch { return false; }
  };
  const blockValue = (() => {
    try { return String(document.queryCommandValue('formatBlock') || '').replace(/[<>]/g, '').toLowerCase(); }
    catch { return ''; }
  })();

  const openLink = () => {
    saveSelection();
    const selection = window.getSelection();
    const node = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
    setLinkUrl(node?.closest('a')?.getAttribute('href') || '');
    setLinkError('');
    setLinkDialogOpen(true);
    setUrlMediaType(null);
  };

  const applyLink = (event: React.FormEvent) => {
    event.preventDefault();
    const href = linkUrl.trim();
    if (!href || !safeRichHref(href)) {
      setLinkError('نشانی معتبر با https://، http://، tel:، mailto:، / یا # وارد کنید.');
      return;
    }
    exec('createLink', href);
    setLinkDialogOpen(false);
  };

  const insertImage = (url: string, item?: { seo?: { alt?: string; title?: string } }) => {
    if (!safeRichSrc(url)) return;
    const alt = escapeRichText(item?.seo?.alt || '');
    const title = item?.seo?.title ? ` title="${escapeRichText(item.seo.title)}"` : '';
    insertHtml(`<img src="${escapeRichText(url)}" alt="${alt}"${title} loading="lazy">`);
    setImagePickerOpen(false);
  };

  const insertUrlMedia = (event: React.FormEvent) => {
    event.preventDefault();
    const src = mediaUrl.trim();
    if (!src || !safeRichSrc(src)) {
      setMediaError('آدرس فایل باید با https://، http:// یا / شروع شود.');
      return;
    }
    if (urlMediaType === 'video') insertHtml(`<video src="${escapeRichText(src)}" controls preload="metadata" playsinline></video>`);
    else insertHtml(`<audio src="${escapeRichText(src)}" controls preload="metadata"></audio>`);
    setUrlMediaType(null);
    setMediaUrl('');
    setMediaError('');
  };

  const insertTable = () => {
    const rowsHtml = Array.from({ length: 3 }, (_, rowIndex) =>
      '<tr>' + Array.from({ length: 3 }, (_, colIndex) =>
        `<${rowIndex === 0 ? 'th' : 'td'}>${rowIndex === 0 ? `ستون ${colIndex + 1}` : '&nbsp;'}</${rowIndex === 0 ? 'th' : 'td'}>`
      ).join('') + '</tr>'
    ).join('');
    const firstRowEnd = rowsHtml.indexOf('</tr>') + 5;
    insertHtml(`<table><thead>${rowsHtml.slice(0, firstRowEnd)}</thead><tbody>${rowsHtml.slice(firstRowEnd)}</tbody></table><p><br></p>`);
  };

  const blockFormat = (nextValue: string) => {
    restoreSelection(true);
    document.execCommand('formatBlock', false, nextValue === 'paragraph' ? 'p' : nextValue);
    saveSelection();
    emit();
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    if (html) insertHtml(sanitizeRichHtml(html));
    else insertHtml(escapeRichText(event.clipboardData.getData('text/plain')).replace(/\r?\n/g, '<br>'));
  };

  return (
    <div className="rich-text-editor__frame stable-rich-editor" data-stable-rich-editor="30.10.8">
      <div className="rich-text-toolbar" role="toolbar" aria-label="ابزارهای قالب‌بندی متن" onPointerDownCapture={saveSelection}>
        <div className="rich-text-toolbar__group">
          <ToolButton title="واگرد" onClick={() => exec('undo')}><Undo2 aria-hidden="true" /></ToolButton>
          <ToolButton title="ازنو" onClick={() => exec('redo')}><Redo2 aria-hidden="true" /></ToolButton>
        </div>
        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <select className="rich-text-block-select" aria-label="نوع پاراگراف" value={['h2','h3','h4','blockquote'].includes(blockValue) ? blockValue : 'paragraph'} onChange={event => blockFormat(event.currentTarget.value)}>
            <option value="paragraph">پاراگراف</option>
            <option value="h2">تیتر ۲</option>
            <option value="h3">تیتر ۳</option>
            <option value="h4">تیتر ۴</option>
            <option value="blockquote">نقل‌قول</option>
          </select>
          <select className="rich-text-block-select" aria-label="اندازه متن" value={fontSize} onChange={event => execFontSize(event.currentTarget.value)}>
            <option value="">اندازه</option>
            {FONT_SIZES.map(size => <option key={size} value={size}>{size.replace('px', '')}</option>)}
          </select>
          <select className="rich-text-block-select" aria-label="فونت" value={fontFamily} onChange={event => execFontFamily(event.currentTarget.value)}>
            {FONT_FAMILIES.map(font => <option key={font.value || 'site'} value={font.value}>{font.label}</option>)}
          </select>
          <select className="rich-text-block-select" aria-label="فاصله خطوط" value={lineHeight} onChange={event => applyBlockStyle('lineHeight', event.currentTarget.value)}>
            <option value="">فاصله خط</option>
            <option value="1.4">۱٫۴</option><option value="1.7">۱٫۷</option><option value="1.9">۱٫۹</option><option value="2.2">۲٫۲</option><option value="2.5">۲٫۵</option>
          </select>
        </div>
        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="پررنگ" active={commandActive('bold')} onClick={() => applyInlineStyle({ fontWeight: '700' })}><Bold aria-hidden="true" /></ToolButton>
          <ToolButton title="کج" active={commandActive('italic')} onClick={() => applyInlineStyle({ fontStyle: 'italic' })}><Italic aria-hidden="true" /></ToolButton>
          <ToolButton title="زیرخط" active={commandActive('underline')} onClick={() => applyInlineStyle({ textDecoration: 'underline' })}><Underline aria-hidden="true" /></ToolButton>
          <ToolButton title="خط‌خورده" active={commandActive('strikeThrough')} onClick={() => applyInlineStyle({ textDecoration: 'line-through' })}><Strikethrough aria-hidden="true" /></ToolButton>
          <label className="rich-text-color-picker" title="رنگ متن"><Palette aria-hidden="true" style={{ color: textColor }} /><input type="color" value={textColor} aria-label="رنگ متن" onChange={event => { setTextColor(event.currentTarget.value); applyInlineStyle({ color: event.currentTarget.value }); }} /></label>
          <label className="rich-text-color-picker" title="رنگ پس‌زمینه متن"><Highlighter aria-hidden="true" style={{ color: highlightColor }} /><input type="color" value={highlightColor} aria-label="رنگ پس‌زمینه متن" onChange={event => { setHighlightColor(event.currentTarget.value); applyInlineStyle({ backgroundColor: event.currentTarget.value }); }} /></label>
          <ToolButton title="پاک‌کردن قالب‌بندی" onClick={() => { exec('removeFormat'); blockFormat('paragraph'); }}><Eraser aria-hidden="true" /></ToolButton>
        </div>
        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="فهرست نشانه‌دار" active={commandActive('insertUnorderedList')} onClick={() => exec('insertUnorderedList')}><List aria-hidden="true" /></ToolButton>
          <ToolButton title="فهرست شماره‌دار" active={commandActive('insertOrderedList')} onClick={() => exec('insertOrderedList')}><ListOrdered aria-hidden="true" /></ToolButton>
          <ToolButton title="نقل‌قول" onClick={() => blockFormat('blockquote')}><Quote aria-hidden="true" /></ToolButton>
        </div>
        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="راست‌چین" onClick={() => exec('justifyRight')}><AlignRight aria-hidden="true" /></ToolButton>
          <ToolButton title="وسط‌چین" onClick={() => exec('justifyCenter')}><AlignCenter aria-hidden="true" /></ToolButton>
          <ToolButton title="چپ‌چین" onClick={() => exec('justifyLeft')}><AlignLeft aria-hidden="true" /></ToolButton>
          <ToolButton title="تراز دوطرفه" onClick={() => exec('justifyFull')}><AlignJustify aria-hidden="true" /></ToolButton>
        </div>
        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="لینک" onClick={openLink}><LinkIcon aria-hidden="true" /></ToolButton>
          <ToolButton title="حذف لینک" onClick={() => exec('unlink')}><Unlink aria-hidden="true" /></ToolButton>
          <ToolButton title="تصویر" onClick={() => { saveSelection(); setImagePickerOpen(true); }}><ImagePlus aria-hidden="true" /></ToolButton>
          <ToolButton title="صوت" onClick={() => { saveSelection(); setUrlMediaType('audio'); setMediaError(''); }}><Music2 aria-hidden="true" /></ToolButton>
          <ToolButton title="ویدئو" onClick={() => { saveSelection(); setUrlMediaType('video'); setMediaError(''); }}><Video aria-hidden="true" /></ToolButton>
          <ToolButton title="جدول ۳×۳" onClick={insertTable}><Table aria-hidden="true" /></ToolButton>
        </div>
      </div>

      {linkDialogOpen && (
        <form className="rich-text-link-form" onSubmit={applyLink}>
          <label>آدرس لینک</label>
          <input autoFocus value={linkUrl} onChange={event => setLinkUrl(event.currentTarget.value)} placeholder="https://... یا /product/..." />
          <button type="submit">اعمال لینک</button>
          <button type="button" onClick={() => setLinkDialogOpen(false)}>لغو</button>
          {linkError && <span className="rich-text-link-form__error">{linkError}</span>}
        </form>
      )}

      {urlMediaType && (
        <form className="rich-text-media-form" onSubmit={insertUrlMedia}>
          <label>آدرس فایل {urlMediaType === 'video' ? 'ویدئو' : 'صوتی'}</label>
          <input autoFocus value={mediaUrl} onChange={event => setMediaUrl(event.currentTarget.value)} placeholder="https://..." />
          <button type="submit">درج</button>
          <button type="button" onClick={() => setUrlMediaType(null)}>لغو</button>
          {mediaError && <span className="rich-text-media-form__error">{mediaError}</span>}
        </form>
      )}

      <div className="rich-text-editor__content" style={{ minHeight: Math.max(150, rows * 24) }}>
        <div
          ref={surfaceRef}
          className="rich-text-editor__surface stable-rich-editor__surface"
          dir="rtl"
          role="textbox"
          aria-multiline="true"
          aria-label="ویرایش متن فارسی"
          data-placeholder={placeholder}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={emit}
          onBlur={() => { saveSelection(); emit(); }}
          onKeyDown={event => {
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
          onMouseUp={saveSelection}
          onPaste={onPaste}
        />
      </div>

      <MediaPickerModal
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={insertImage}
        title="انتخاب تصویر برای متن"
        category="editor-media"
      />
    </div>
  );
};
