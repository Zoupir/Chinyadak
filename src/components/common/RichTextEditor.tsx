import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Table, Link as LinkIcon, Quote, Eye, Edit3, Underline } from 'lucide-react';
import { markdownToSafeHtml, sanitizeRichHtml } from '../../utils/richText';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label, value, onChange, placeholder = 'متن را اینجا بنویسید...', rows = 8, helperText
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (lastValueRef.current === value) return;
    const html = markdownToSafeHtml(value || '');
    if (editorRef.current && editorRef.current.innerHTML !== html) editorRef.current.innerHTML = html;
    lastValueRef.current = value;
  }, [value]);

  const emit = () => {
    const html = sanitizeRichHtml(editorRef.current?.innerHTML || '');
    lastValueRef.current = html;
    onChange(html);
  };

  const run = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('آدرس پیوند را وارد کنید:');
    if (!url) return;
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url.trim())) {
      window.alert('آدرس پیوند باید با https://، tel:، mailto:، / یا # شروع شود.');
      return;
    }
    run('createLink', url.trim());
  };

  const toolbarButton = (title: string, icon: React.ReactNode, action: () => void) => (
    <button type="button" title={title} aria-label={title}
      onMouseDown={event => event.preventDefault()} onClick={action}
      className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
      {icon}
    </button>
  );

  const html = markdownToSafeHtml(value || '');
  return (
    <section className="rich-text-editor" dir="rtl">
      <header className="flex items-center justify-between gap-3 mb-2">
        <label className="text-xs font-bold text-neutral-700">{label}</label>
        <div className="flex p-1 rounded-lg bg-neutral-100 text-[10px]">
          <button type="button" onClick={() => setActiveTab('write')} className={`px-3 py-1.5 rounded-md ${activeTab === 'write' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}><Edit3 className="inline w-3 h-3 ml-1"/>نوشتن</button>
          <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-md ${activeTab === 'preview' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}><Eye className="inline w-3 h-3 ml-1"/>پیش‌نمایش</button>
        </div>
      </header>

      {activeTab === 'write' ? (
        <div className="border border-neutral-300 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
          <div className="bg-neutral-50 border-b border-neutral-200 p-1.5 flex flex-wrap items-center gap-1 text-neutral-700">
            {toolbarButton('پررنگ', <Bold className="w-4 h-4"/>, () => run('bold'))}
            {toolbarButton('کج', <Italic className="w-4 h-4"/>, () => run('italic'))}
            {toolbarButton('زیرخط', <Underline className="w-4 h-4"/>, () => run('underline'))}
            <span className="h-5 w-px bg-neutral-300 mx-1"/>
            {toolbarButton('عنوان ۲', <Heading2 className="w-4 h-4"/>, () => run('formatBlock', 'h2'))}
            {toolbarButton('عنوان ۳', <Heading3 className="w-4 h-4"/>, () => run('formatBlock', 'h3'))}
            {toolbarButton('فهرست نشانه‌دار', <List className="w-4 h-4"/>, () => run('insertUnorderedList'))}
            {toolbarButton('فهرست شماره‌دار', <ListOrdered className="w-4 h-4"/>, () => run('insertOrderedList'))}
            {toolbarButton('نقل‌قول', <Quote className="w-4 h-4"/>, () => run('formatBlock', 'blockquote'))}
            {toolbarButton('پیوند', <LinkIcon className="w-4 h-4"/>, addLink)}
            {toolbarButton('جدول دو ستونه', <Table className="w-4 h-4"/>, () => run('insertHTML', '<table><tbody><tr><td>عنوان</td><td>توضیح</td></tr><tr><td>مقدار</td><td>مقدار</td></tr></tbody></table>'))}
          </div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
            data-placeholder={placeholder} onInput={emit}
            className="rich-text-editable w-full overflow-y-auto p-3 outline-none leading-relaxed text-sm text-neutral-800"
            style={{ minHeight: `${Math.max(4, rows) * 1.8}rem` }}
            dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(value || '') }} />
          {helperText && <p className="px-3 pb-2 text-[10px] text-neutral-500">{helperText}</p>}
        </div>
      ) : (
        <div className="min-h-24 p-4 border border-neutral-200 rounded-xl bg-neutral-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html || '<p class="text-neutral-400">پیش‌نمایشی برای نمایش وجود ندارد.</p>' }} />
      )}
    </section>
  );
};
