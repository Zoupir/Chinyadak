import fs from 'node:fs';

const path = 'src/components/common/RichTextComposer.tsx';
let source = fs.readFileSync(path, 'utf8');
if (source.includes('data-rich-composer-version="30.9.1"')) {
  console.log('v30.9.1 editor core already satisfied.');
  process.exit(0);
}

const mustReplace = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`v30.9.1 editor core marker missing: ${label}`);
  source = next;
};

mustReplace(
  /const ToolButton: React\.FC<ToolButtonProps> = \(\{ title, onClick, active, disabled, children \}\) => \(\s*<button([\s\S]*?)onMouseDown=\{event => event\.preventDefault\(\)\}([\s\S]*?)onClick=\{onClick\}([\s\S]*?)<\/button>\s*\);/,
  (_match, before, middle, after) => `const ToolButton: React.FC<ToolButtonProps> = ({ title, onClick, active, disabled, children }) => (\n  <button${before}onPointerDown={event => {\n      if (disabled) return;\n      if (event.pointerType === 'mouse' && event.button !== 0) return;\n      event.preventDefault();\n      onClick();\n    }}${middle}onClick={event => {\n      if (!disabled && event.detail === 0) onClick();\n    }}${after}</button>\n);`,
  'ToolButton pointer handling'
);

mustReplace(
  /  const mediaInputRef = useRef<HTMLInputElement>\(null\);/,
  `  const mediaInputRef = useRef<HTMLInputElement>(null);\n  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);\n  const internalEmissionRef = useRef<string | null>(null);`,
  'selection refs'
);

mustReplace(
  /    onUpdate: \(\{ editor: updatedEditor \}\) => \{[\s\S]*?    onTransaction: \(\) => setToolbarRevision\(revision => revision \+ 1\)/,
  `    onUpdate: ({ editor: updatedEditor }) => {\n      const nextHtml = sanitizeRichHtml(updatedEditor.getHTML());\n      if (nextHtml !== lastEmittedHtml.current) {\n        lastEmittedHtml.current = nextHtml;\n        internalEmissionRef.current = nextHtml;\n        onChangeRef.current(nextHtml);\n      }\n    },\n    onSelectionUpdate: ({ editor: updatedEditor }) => {\n      const { from, to } = updatedEditor.state.selection;\n      savedSelectionRef.current = { from, to };\n      setToolbarRevision(revision => revision + 1);\n    },\n    onFocus: ({ editor: updatedEditor }) => {\n      const { from, to } = updatedEditor.state.selection;\n      savedSelectionRef.current = { from, to };\n      setToolbarRevision(revision => revision + 1);\n    },\n    onTransaction: () => setToolbarRevision(revision => revision + 1)`,
  'editor update callbacks'
);

mustReplace(
  /  useEffect\(\(\) => \{\s*if \(!editor\) return;\s*const incomingHtml = markdownToSafeHtml\(value \|\| ''\);\s*const currentHtml = sanitizeRichHtml\(editor\.getHTML\(\)\);\s*if \(incomingHtml !== currentHtml\) \{\s*editor\.commands\.setContent\(incomingHtml, \{ emitUpdate: false \}\);\s*lastEmittedHtml\.current = incomingHtml;\s*\}\s*\}, \[editor, value\]\);/,
  `  useEffect(() => {\n    if (!editor) return;\n    const incomingHtml = markdownToSafeHtml(value || '');\n\n    // Parent state echoes the HTML emitted by this same editor. Treat that as\n    // acknowledgement; calling setContent again destroys the active selection.\n    if (internalEmissionRef.current === incomingHtml) {\n      internalEmissionRef.current = null;\n      lastEmittedHtml.current = incomingHtml;\n      return;\n    }\n\n    const currentHtml = sanitizeRichHtml(editor.getHTML());\n    if (incomingHtml !== currentHtml) {\n      editor.commands.setContent(incomingHtml, { emitUpdate: false });\n      lastEmittedHtml.current = incomingHtml;\n      const max = editor.state.doc.content.size;\n      savedSelectionRef.current = { from: Math.min(1, max), to: Math.min(1, max) };\n    }\n  }, [editor, value]);`,
  'controlled value echo guard'
);

mustReplace(
  /  void toolbarRevision;\s*const activeBlock =/,
  `  void toolbarRevision;\n\n  const rememberSelection = () => {\n    const { from, to } = editor.state.selection;\n    savedSelectionRef.current = { from, to };\n  };\n\n  const restoreSelection = () => {\n    const saved = savedSelectionRef.current;\n    if (!saved) return;\n    const max = editor.state.doc.content.size;\n    const from = Math.max(0, Math.min(saved.from, max));\n    const to = Math.max(from, Math.min(saved.to, max));\n    editor.commands.setTextSelection({ from, to });\n  };\n\n  const runWithSavedSelection = (command: () => void) => {\n    restoreSelection();\n    command();\n    rememberSelection();\n  };\n\n  const activeBlock =`,
  'selection helpers'
);

mustReplace(
  /  const openLinkDialog = \(\) => \{\s*setLinkUrl/,
  `  const openLinkDialog = () => {\n    rememberSelection();\n    setLinkUrl`,
  'link selection memory'
);
source = source.replace(
  `    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();`,
  `    runWithSavedSelection(() => editor.chain().focus().extendMarkRange('link').setLink({ href }).run());`
);

mustReplace(
  /  const format = \(block: string\) => \{[\s\S]*?\n  \};\n\n  const active =/,
  `  const format = (block: string) => {\n    runWithSavedSelection(() => {\n      if (block === 'paragraph') editor.chain().focus().setParagraph().run();\n      else if (block === 'quote') editor.chain().focus().toggleBlockquote().run();\n      else editor.chain().focus().toggleHeading({ level: Number(block.slice(1)) as 2 | 3 | 4 }).run();\n    });\n  };\n\n  const active =`,
  'block format selection restore'
);

source = source.replace(
  `  const activeAlign = (alignment: string) => editor.isActive({ textAlign: alignment });`,
  `  const activeAlign = (alignment: string) =>\n    editor.isActive('paragraph', { textAlign: alignment }) ||\n    editor.isActive('heading', { textAlign: alignment });`
);

source = source.replace(
  /  const insertImage = \(url: string, item\?: \{ seo\?: \{ alt\?: string; title\?: string \} \}\) => \{\s*if \(!safeRichSrc\(url\)\) return;\s*editor\.chain\(\)\.focus\(\)\.insertContent\(/,
  `  const insertImage = (url: string, item?: { seo?: { alt?: string; title?: string } }) => {\n    if (!safeRichSrc(url)) return;\n    restoreSelection();\n    editor.chain().focus().insertContent(`
);
source = source.replace(
  /  const openUrlMedia = \(type: UrlMediaType\) => \{\s*setLinkDialogOpen/,
  `  const openUrlMedia = (type: UrlMediaType) => {\n    rememberSelection();\n    setLinkDialogOpen`
);
source = source.replace(
  /    editor\.chain\(\)\.focus\(\)\.insertContent\(\{\s*type: urlMediaType === 'video'/,
  `    restoreSelection();\n    editor.chain().focus().insertContent({\n      type: urlMediaType === 'video'`
);

source = source.replace(
  `              value={fontSize}\n              onChange=`,
  `              value={fontSize}\n              onPointerDown={rememberSelection}\n              onChange=`
);
source = source.replace(
  `                if (selected) editor.chain().focus().setFontSize(selected).run();`,
  `                if (selected) runWithSavedSelection(() => editor.chain().focus().setFontSize(selected).run());`
);
source = source.replace(
  `            aria-label="نوع پاراگراف"\n            value={activeBlock}`,
  `            aria-label="نوع پاراگراف"\n            onPointerDown={rememberSelection}\n            value={activeBlock}`
);
source = source.replace(
  `              aria-label="رنگ متن"\n              value={textColor}`,
  `              aria-label="رنگ متن"\n              onPointerDown={rememberSelection}\n              value={textColor}`
);
source = source.replace(
  `                editor.chain().focus().setColor(color).run();`,
  `                runWithSavedSelection(() => editor.chain().focus().setColor(color).run());`
);

mustReplace(
  /<div className="rich-text-editor__frame" data-rich-media-editor="1">/,
  `<div className="rich-text-editor__frame" data-rich-media-editor="1" data-rich-composer-version="30.9.1">`,
  'version marker'
);

if (!source.includes('internalEmissionRef.current === incomingHtml') || !source.includes('runWithSavedSelection')) {
  throw new Error('v30.9.1 editor core patch incomplete');
}
fs.writeFileSync(path, source);
console.log('v30.9.1 editor core applied.');
