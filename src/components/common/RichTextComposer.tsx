import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Unlink
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { markdownToSafeHtml, safeRichHref, sanitizeRichHtml } from '../../utils/richText';
import './RichTextEditor.css';

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

const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, active, disabled, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={event => event.preventDefault()}
    onClick={onClick}
    className={'rich-text-tool' + (active ? ' is-active' : '')}
  >
    {children}
  </button>
);

export const RichTextComposer: React.FC<RichTextComposerProps> = ({
  value,
  onChange,
  placeholder,
  rows
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialHtml = useRef(markdownToSafeHtml(value || ''));
  const lastEmittedHtml = useRef(initialHtml.current);
  const [toolbarRevision, setToolbarRevision] = useState(0);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [fontSize, setFontSize] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: 'nofollow noopener noreferrer' }
      }
    }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    FontSize,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      defaultAlignment: 'right'
    }),
    TableKit,
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: true
    })
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content: initialHtml.current,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rich-text-editor__surface',
        dir: 'rtl',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'متن فارسی'
      }
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const nextHtml = sanitizeRichHtml(updatedEditor.getHTML());
      if (nextHtml !== lastEmittedHtml.current) {
        lastEmittedHtml.current = nextHtml;
        onChangeRef.current(nextHtml);
      }
    },
    onSelectionUpdate: () => setToolbarRevision(revision => revision + 1)
  });

  useEffect(() => {
    if (!editor) return;
    const incomingHtml = markdownToSafeHtml(value || '');
    const currentHtml = sanitizeRichHtml(editor.getHTML());
    if (incomingHtml !== currentHtml) {
      editor.commands.setContent(incomingHtml, { emitUpdate: false });
      lastEmittedHtml.current = incomingHtml;
    }
  }, [editor, value]);

  useEffect(() => {
    if (linkDialogOpen) linkInputRef.current?.focus();
  }, [linkDialogOpen]);

  if (!editor) {
    return <div className="rich-text-editor__loading" role="status">در حال آماده‌سازی ادیتور…</div>;
  }

  // Read the current selection state so the toolbar reports which formatting is active.
  void toolbarRevision;
  const activeBlock = editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : editor.isActive('heading', { level: 4 }) ? 'h4'
    : editor.isActive('blockquote') ? 'quote'
    : 'paragraph';

  const openLinkDialog = () => {
    setLinkUrl(String(editor.getAttributes('link').href || ''));
    setLinkError('');
    setLinkDialogOpen(true);
  };

  const applyLink = (event: React.FormEvent) => {
    event.preventDefault();
    const href = linkUrl.trim();
    if (!href || !safeRichHref(href)) {
      setLinkError('لطفاً یک نشانی معتبر با https://، http://، tel:، mailto:، / یا # وارد کنید.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setLinkDialogOpen(false);
    setLinkError('');
  };

  const format = (block: string) => {
    if (block === 'paragraph') editor.chain().focus().setParagraph().run();
    else if (block === 'quote') editor.chain().focus().toggleBlockquote().run();
    else editor.chain().focus().toggleHeading({ level: Number(block.slice(1)) as 2 | 3 | 4 }).run();
  };

  const active = (name: string, attributes?: Record<string, unknown>) =>
    editor.isActive(name, attributes as never);

  return (
    <div className="rich-text-editor__frame">
      <div className="rich-text-toolbar" role="toolbar" aria-label="ابزارهای قالب‌بندی متن">
        <div className="rich-text-toolbar__group">
          <ToolButton title="واگرد" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 aria-hidden="true" />
          </ToolButton>
          <ToolButton title="ازنو" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <label className="rich-text-select-label" aria-label="اندازه متن">
            <span className="sr-only">اندازه متن</span>
            <select
              aria-label="اندازه متن"
              value={fontSize}
              onChange={event => {
                const selected = event.currentTarget.value;
                setFontSize(selected);
                if (selected) editor.chain().focus().setFontSize(selected).run();
              }}
            >
              <option value="">اندازه</option>
              <option value="12px">۱۲</option>
              <option value="14px">۱۴</option>
              <option value="16px">۱۶</option>
              <option value="18px">۱۸</option>
              <option value="24px">۲۴</option>
              <option value="32px">۳۲</option>
            </select>
          </label>
          <select
            className="rich-text-block-select"
            aria-label="نوع پاراگراف"
            value={activeBlock}
            onChange={event => format(event.currentTarget.value)}
          >
            <option value="paragraph">پاراگراف</option>
            <option value="h2">سرخط ۲</option>
            <option value="h3">سرخط ۳</option>
            <option value="h4">سرخط ۴</option>
            <option value="quote">نقل‌قول</option>
          </select>
        </div>

        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="پررنگ" active={active('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold aria-hidden="true" />
          </ToolButton>
          <ToolButton title="کج" active={active('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic aria-hidden="true" />
          </ToolButton>
          <ToolButton title="زیرخط" active={active('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Underline aria-hidden="true" />
          </ToolButton>
          <ToolButton title="خط‌خورده" active={active('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough aria-hidden="true" />
          </ToolButton>
          <label className="rich-text-color-picker" title="رنگ متن">
            <Palette aria-hidden="true" />
            <input
              type="color"
              aria-label="رنگ متن"
              value="#c2410c"
              onChange={event => editor.chain().focus().setColor(event.currentTarget.value).run()}
            />
          </label>
          <ToolButton title="پاک‌کردن قالب‌بندی" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Eraser aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="فهرست نشانه‌دار" active={active('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List aria-hidden="true" />
          </ToolButton>
          <ToolButton title="فهرست شماره‌دار" active={active('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered aria-hidden="true" />
          </ToolButton>
          <ToolButton title="نقل‌قول" active={active('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="راست‌چین" active={active('textAlign', { textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight aria-hidden="true" />
          </ToolButton>
          <ToolButton title="وسط‌چین" active={active('textAlign', { textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter aria-hidden="true" />
          </ToolButton>
          <ToolButton title="چپ‌چین" active={active('textAlign', { textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft aria-hidden="true" />
          </ToolButton>
          <ToolButton title="تراز دوطرفه" active={active('textAlign', { textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="rich-text-toolbar__separator" />

        <div className="rich-text-toolbar__group">
          <ToolButton title="افزودن یا ویرایش پیوند" active={active('link')} onClick={openLinkDialog}>
            <LinkIcon aria-hidden="true" />
          </ToolButton>
          <ToolButton title="حذف پیوند" disabled={!active('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink aria-hidden="true" />
          </ToolButton>
          <ToolButton title="افزودن جدول دو ستونه" onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>
            <Table aria-hidden="true" />
          </ToolButton>
        </div>

        {linkDialogOpen && (
          <form className="rich-text-link-form" onSubmit={applyLink}>
            <label htmlFor="rich-text-link-url">نشانی پیوند</label>
            <input
              id="rich-text-link-url"
              ref={linkInputRef}
              type="url"
              inputMode="url"
              value={linkUrl}
              placeholder="https://example.com"
              onChange={event => setLinkUrl(event.currentTarget.value)}
            />
            {linkError && <span className="rich-text-link-form__error" role="alert">{linkError}</span>}
            <button type="submit">ثبت پیوند</button>
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setLinkDialogOpen(false)}>انصراف</button>
          </form>
        )}
      </div>

      <EditorContent
        editor={editor}
        className="rich-text-editor__content"
        style={{ minHeight: Math.max(4, rows) * 1.8 + 'rem' }}
      />

      {active('table') && (
        <div className="rich-text-table-actions" role="group" aria-label="ابزارهای جدول">
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()}>افزودن سطر</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()}>افزودن ستون</button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()}>حذف جدول</button>
        </div>
      )}
    </div>
  );
};
