import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};

// ---------------------------------------------------------------------------
// 1) Tiptap integration: toolbar actions must fire on the first pointer press,
//    preserve the ProseMirror selection, and never be reset by the controlled
//    React value echoing the editor's own update back into setContent().
// ---------------------------------------------------------------------------
edit('src/components/common/RichTextComposer.tsx', source => {
  if (source.includes('data-rich-composer-version="30.9.1"')) return source;

  source = source.replace(
`const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, active, disabled, children }) => (
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
);`,
`const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, active, disabled, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onPointerDown={event => {
      if (disabled) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      // Execute before browser focus leaves ProseMirror. This removes the old
      // multi-click behaviour where the first click merely restored selection.
      event.preventDefault();
      onClick();
    }}
    onClick={event => {
      // Keyboard activation has detail=0 and does not emit pointerdown.
      if (!disabled && event.detail === 0) onClick();
    }}
    className={'rich-text-tool' + (active ? ' is-active' : '')}
  >
    {children}
  </button>
);`
  );

  const refsNeedle = `  const linkInputRef = useRef<HTMLInputElement>(null);\n  const mediaInputRef = useRef<HTMLInputElement>(null);`;
  if (!source.includes(refsNeedle)) throw new Error('v30.9.1 composer refs marker missing');
  source = source.replace(refsNeedle,
`${refsNeedle}
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const internalEmissionRef = useRef<string | null>(null);`
  );

  source = source.replace(
`    onUpdate: ({ editor: updatedEditor }) => {
      const nextHtml = sanitizeRichHtml(updatedEditor.getHTML());
      if (nextHtml !== lastEmittedHtml.current) {
        lastEmittedHtml.current = nextHtml;
        onChangeRef.current(nextHtml);
      }
    },
    onSelectionUpdate: () => setToolbarRevision(revision => revision + 1),
    onTransaction: () => setToolbarRevision(revision => revision + 1)`,
`    onUpdate: ({ editor: updatedEditor }) => {
      const nextHtml = sanitizeRichHtml(updatedEditor.getHTML());
      if (nextHtml !== lastEmittedHtml.current) {
        lastEmittedHtml.current = nextHtml;
        internalEmissionRef.current = nextHtml;
        onChangeRef.current(nextHtml);
      }
    },
    onSelectionUpdate: ({ editor: updatedEditor }) => {
      const { from, to } = updatedEditor.state.selection;
      savedSelectionRef.current = { from, to };
      setToolbarRevision(revision => revision + 1);
    },
    onFocus: ({ editor: updatedEditor }) => {
      const { from, to } = updatedEditor.state.selection;
      savedSelectionRef.current = { from, to };
      setToolbarRevision(revision => revision + 1);
    },
    onTransaction: () => setToolbarRevision(revision => revision + 1)`
  );

  source = source.replace(
`  useEffect(() => {
    if (!editor) return;
    const incomingHtml = markdownToSafeHtml(value || '');
    const currentHtml = sanitizeRichHtml(editor.getHTML());
    if (incomingHtml !== currentHtml) {
      editor.commands.setContent(incomingHtml, { emitUpdate: false });
      lastEmittedHtml.current = incomingHtml;
    }
  }, [editor, value]);`,
`  useEffect(() => {
    if (!editor) return;
    const incomingHtml = markdownToSafeHtml(value || '');

    // Parent state normally echoes the HTML emitted by this editor. Treat that
    // as acknowledgement, not as an external replacement. Re-running
    // setContent() here used to destroy the active selection/format transaction.
    if (internalEmissionRef.current === incomingHtml) {
      internalEmissionRef.current = null;
      lastEmittedHtml.current = incomingHtml;
      return;
    }

    const currentHtml = sanitizeRichHtml(editor.getHTML());
    if (incomingHtml !== currentHtml) {
      editor.commands.setContent(incomingHtml, { emitUpdate: false });
      lastEmittedHtml.current = incomingHtml;
      const max = editor.state.doc.content.size;
      savedSelectionRef.current = { from: Math.min(1, max), to: Math.min(1, max) };
    }
  }, [editor, value]);`
  );

  const guardNeedle = `  void toolbarRevision;\n  const activeBlock =`;
  if (!source.includes(guardNeedle)) throw new Error('v30.9.1 composer active block marker missing');
  source = source.replace(guardNeedle,
`  void toolbarRevision;

  const rememberSelection = () => {
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  };

  const restoreSelection = () => {
    const saved = savedSelectionRef.current;
    if (!saved) return;
    const max = editor.state.doc.content.size;
    const from = Math.max(0, Math.min(saved.from, max));
    const to = Math.max(from, Math.min(saved.to, max));
    editor.commands.setTextSelection({ from, to });
  };

  const runWithSavedSelection = (command: () => void) => {
    restoreSelection();
    command();
    rememberSelection();
  };

  const activeBlock =`
  );

  source = source.replace(
`  const openLinkDialog = () => {
    setLinkUrl(String(editor.getAttributes('link').href || ''));`,
`  const openLinkDialog = () => {
    rememberSelection();
    setLinkUrl(String(editor.getAttributes('link').href || ''));`
  );
  source = source.replace(
`    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();`,
`    runWithSavedSelection(() => editor.chain().focus().extendMarkRange('link').setLink({ href }).run());`
  );
  source = source.replace(
`  const openUrlMedia = (type: UrlMediaType) => {
    setLinkDialogOpen(false);`,
`  const openUrlMedia = (type: UrlMediaType) => {
    rememberSelection();
    setLinkDialogOpen(false);`
  );
  source = source.replace(
`  const insertImage = (url: string, item?: { seo?: { alt?: string; title?: string } }) => {
    if (!safeRichSrc(url)) return;
    editor.chain().focus().insertContent({`,
`  const insertImage = (url: string, item?: { seo?: { alt?: string; title?: string } }) => {
    if (!safeRichSrc(url)) return;
    restoreSelection();
    editor.chain().focus().insertContent({`
  );
  source = source.replace(
`    editor.chain().focus().insertContent({
      type: urlMediaType === 'video' ? 'richVideo' : 'richAudio',`,
`    restoreSelection();
    editor.chain().focus().insertContent({
      type: urlMediaType === 'video' ? 'richVideo' : 'richAudio',`
  );

  source = source.replace(
`  const activeAlign = (alignment: string) => editor.isActive({ textAlign: alignment });`,
`  const activeAlign = (alignment: string) =>
    editor.isActive('paragraph', { textAlign: alignment }) ||
    editor.isActive('heading', { textAlign: alignment });`
  );

  source = source.replace(
`            <select
              aria-label="اندازه متن"
              value={fontSize}`, 
`            <select
              aria-label="اندازه متن"
              value={fontSize}
              onPointerDown={rememberSelection}`
  );
  source = source.replace(
`                if (selected) editor.chain().focus().setFontSize(selected).run();`,
`                if (selected) runWithSavedSelection(() => editor.chain().focus().setFontSize(selected).run());`
  );
  source = source.replace(
`          <select
            className="rich-text-block-select"
            aria-label="نوع پاراگراف"`,
`          <select
            className="rich-text-block-select"
            aria-label="نوع پاراگراف"
            onPointerDown={rememberSelection}`
  );
  source = source.replace(
`            <input
              type="color"
              aria-label="رنگ متن"`,
`            <input
              type="color"
              aria-label="رنگ متن"
              onPointerDown={rememberSelection}`
  );
  source = source.replace(
`                editor.chain().focus().setColor(color).run();`,
`                runWithSavedSelection(() => editor.chain().focus().setColor(color).run());`
  );

  source = source.replace(
`    <div className="rich-text-editor__frame" data-rich-media-editor="1">`,
`    <div className="rich-text-editor__frame" data-rich-media-editor="1" data-rich-composer-version="30.9.1">`
  );

  if (!source.includes('data-rich-composer-version="30.9.1"')) {
    throw new Error('v30.9.1 composer patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 2) Sanitizer: authored paragraph alignment must win over theme-level RTL
//    alignment rules. Inline !important is intentional for editor-authored style.
// ---------------------------------------------------------------------------
edit('src/utils/richText.ts', source => {
  const old = `if (align) safe.push('text-align:' + align[1].toLowerCase());`;
  const next = `if (align) safe.push('text-align:' + align[1].toLowerCase() + '!important');`;
  if (source.includes(next)) return source;
  if (!source.includes(old)) throw new Error('v30.9.1 rich text alignment marker missing');
  return source.replace(old, next);
});

// ---------------------------------------------------------------------------
// 3) Generic CMS pages: the editor saves HTML, so the storefront must render
//    RichTextContent rather than escaping it as plain React text.
// ---------------------------------------------------------------------------
edit('src/components/page/PageView.tsx', source => {
  if (!source.includes("import { RichTextContent } from '../common/RichTextContent';")) {
    const marker = "import { LiveSectionModal } from '../common/LiveSectionModal';\n";
    if (!source.includes(marker)) throw new Error('v30.9.1 PageView import marker missing');
    source = source.replace(marker, marker + "import { RichTextContent } from '../common/RichTextContent';\n");
  }

  source = source.replace(
`            {item.content && <p className="text-xs text-neutral-600 leading-relaxed mt-2 whitespace-pre-line">{item.content}</p>}`,
`            {item.content && <RichTextContent content={item.content} className="text-xs text-neutral-600 leading-relaxed mt-2" />}`
  );

  source = source.replaceAll(
`                      {section.content && (
                        <div className="text-xs sm:text-sm text-neutral-300 leading-loose space-y-3 pt-1 whitespace-pre-line">
                          {section.content}
                        </div>
                      )}`,
`                      {section.content && (
                        <RichTextContent content={section.content} className="text-xs sm:text-sm text-neutral-300 leading-loose space-y-3 pt-1" />
                      )}`
  );
  source = source.replaceAll(
`                      {section.content && (
                        <div className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1 whitespace-pre-line">
                          {section.content}
                        </div>
                      )}`,
`                      {section.content && (
                        <RichTextContent content={section.content} className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1" />
                      )}`
  );
  source = source.replaceAll(
`                        {section.content && (
                          <div className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1 whitespace-pre-line">
                            {section.content}
                          </div>
                        )}`,
`                        {section.content && (
                          <RichTextContent content={section.content} className="text-xs sm:text-sm text-neutral-600 leading-loose space-y-3 pt-1" />
                        )}`
  );

  if (!source.includes('<RichTextContent content={section.content}')) {
    throw new Error('v30.9.1 PageView rich renderer patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 4) Footer: copyright was deliberately flattened into an inline span, which
//    removed <p style="text-align:..."> and all block formatting. Render it as
//    rich block content in both marketplace and classic footer variants.
// ---------------------------------------------------------------------------
edit('src/components/layout/Footer.tsx', source => {
  source = source.replace(
`  const renderCopyright = (text: string) => <RichTextContent content={text} inline className="inline" />;`,
`  const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-rich-copyright" />;`
  );
  source = source.replace(
`            <span className="marketplace-ref-footer-copyright">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</span>`,
`            <div className="marketplace-ref-footer-copyright" data-footer-rich-text="30.9.1">{renderCopyright(settings.footerCopyrightText || \`© \${new Date().getFullYear()} تمامی حقوق محفوظ است.\`)}</div>`
  );
  source = source.replace(
`          <p>
            {settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`}
          </p>`,
`          <div className="min-w-0 flex-1" data-footer-rich-text="30.9.1">
            {renderCopyright(settings.footerCopyrightText || \`© \${new Date().toLocaleDateString('fa-IR')} \${settings.siteTitle || 'فروشگاه'}. تمامی حقوق محفوظ است.\`)}
          </div>`
  );
  if (!source.includes('data-footer-rich-text="30.9.1"')) {
    throw new Error('v30.9.1 footer rich rendering patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 5) Footer CSS: do not hard-force centered copyright with !important.
//    The footer alignment control supplies the default; authored rich text may
//    override individual paragraphs through sanitized inline styles.
// ---------------------------------------------------------------------------
edit('src/index.css', source => {
  const forced = `:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer-copyright {
  display: block;
  width: 100%;
  text-align: center !important;
}`;
  const relaxed = `:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer-copyright {
  display: block;
  width: 100%;
}`;
  if (source.includes(forced)) source = source.replaceAll(forced, relaxed);

  const marker = `:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="right"] .marketplace-ref-footer-bottom-links {
  justify-content: flex-start;
}`;
  if (source.includes(marker) && !source.includes('data-bottom-align="right"] .marketplace-ref-footer-copyright')) {
    source = source.replace(marker, `${marker}
:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="right"] .marketplace-ref-footer-copyright {
  text-align: right;
}
:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="center"] .marketplace-ref-footer-copyright {
  text-align: center;
}`);
  }
  const leftMarker = `:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="left"] .marketplace-ref-footer-bottom-links {
  justify-content: flex-end;
}`;
  if (source.includes(leftMarker) && !source.includes('data-bottom-align="left"] .marketplace-ref-footer-copyright')) {
    source = source.replace(leftMarker, `${leftMarker}
:is(html[data-layout="marketplace-rtl"], html[data-layout="atelier-rtl"]) .marketplace-ref-footer[data-bottom-align="left"] .marketplace-ref-footer-copyright {
  text-align: left;
}`);
  }

  // Atelier had a second hard-coded centre rule. Keep layout sizing, remove
  // alignment so the common footer alignment / authored paragraphs can work.
  source = source.replaceAll(
`html[data-layout="atelier-rtl"] .marketplace-ref-footer-copyright {
  display: block;
  width: 100%;
  text-align: center;
  line-height: 1.8;
}`,
`html[data-layout="atelier-rtl"] .marketplace-ref-footer-copyright {
  display: block;
  width: 100%;
  line-height: 1.8;
}`
  );

  if (!source.includes('data-bottom-align="right"] .marketplace-ref-footer-copyright')) {
    throw new Error('v30.9.1 footer alignment CSS patch incomplete');
  }
  return source;
});

// ---------------------------------------------------------------------------
// 6) Footer save: never show a success message before the API confirms that
//    settings were actually persisted.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminFooterTab.tsx', source => {
  if (source.includes('const handleSaveAll = async () =>')) return source;
  const start = source.indexOf('  const handleSaveAll = () => {');
  if (start < 0) throw new Error('v30.9.1 footer save marker missing');
  const endMarker = "    showToast('تنظیمات فوتر، ستون‌ها و نمادهای اعتماد با موفقیت ذخیره گردید.');\n  };";
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error('v30.9.1 footer save end marker missing');
  const block = source.slice(start, end + endMarker.length);
  const asyncBlock = block
    .replace('  const handleSaveAll = () => {', '  const handleSaveAll = async () => {')
    .replace('    updateSettings({', '    const saved = await updateSettings({')
    .replace(
      "    showToast('تنظیمات فوتر، ستون‌ها و نمادهای اعتماد با موفقیت ذخیره گردید.');",
      "    if (saved) showToast('تنظیمات فوتر و قالب‌بندی متن با موفقیت روی سرور ذخیره شد.');\n    else showToast('ذخیره تنظیمات فوتر روی سرور انجام نشد؛ تغییرات اعمال نشده‌اند.', 'error');"
    );
  return source.slice(0, start) + asyncBlock + source.slice(end + endMarker.length);
});

console.log('v30.9.1 rich editor/footer reliability:', changed.length ? changed.join(', ') : 'already satisfied');
