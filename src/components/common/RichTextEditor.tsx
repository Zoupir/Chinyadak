import React, { useId, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  AlertCircle, 
  Table, 
  Link as LinkIcon, 
  Quote, 
  Eye, 
  Edit3,
  HelpCircle
} from 'lucide-react';
import { RichTextContent } from './RichTextContent';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'متن توضیحات کامل را اینجا بنویسید...',
  rows = 8,
  helperText
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const editorId = useId();

  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + before + defaultText + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = before + selected + after;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextVal);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const renderPreview = (text: string) => {
    if (!text.trim()) {
      return <p className="text-neutral-400 italic text-xs">هیچ متنی برای پیش‌نمایش وارد نشده است.</p>;
    }
    return (
      <RichTextContent
        value={text}
        className="space-y-2 text-xs leading-relaxed text-neutral-800 font-sans"
      />
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-neutral-700 font-bold text-xs">
          {label}
        </label>
        
        {/* Write / Preview Tab Buttons */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'write' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>ویرایشگر</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'preview' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>پیش‌نمایش زنده</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="border border-neutral-300 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
        {/* Toolbar */}
        {activeTab === 'write' && (
          <div className="bg-neutral-50 border-b border-neutral-200 p-1.5 flex flex-wrap items-center gap-1 text-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => insertText('**', '**', 'متن ضخیم')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="متن برجسته (Bold)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*', 'متن مورب')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="متن کج (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            
            <div className="h-4 w-px bg-neutral-300 mx-1"></div>

            <button
              type="button"
              onClick={() => insertText('\n## ', '\n', 'عنوان بخش دوم')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors font-bold"
              title="سرتیتر بزرگ (H2)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n### ', '\n', 'زیرعنوان')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="سرتیتر متوسط (H3)"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-neutral-300 mx-1"></div>

            <button
              type="button"
              onClick={() => insertText('\n• ', '', 'مورد اول')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="لیست بالت‌دار"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('\n1. ', '', 'مورد اول')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="لیست شماره‌دار"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('[', '](https://example.com)', 'متن لینک')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="درج لینک"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertText('\n> ⚠️ **نکته فنی:** ', '', 'حتماً هنگام تعویض از آچار ترک‌متر استفاده کنید.')}
              className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-md transition-colors flex items-center gap-1"
              title="کادر هشدار فنی"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">هشدار</span>
            </button>

            <button
              type="button"
              onClick={() => insertText('\n> ', '', 'نقل قول یا توصیه کارخانه سازنده')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors"
              title="نقل قول"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertText('\n| مشخصه فنی | مقدار استاندارد |\n|---|---|\n| گشتاور بستن | ۴۵ نیوتن‌متر |\n', '')}
              className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors flex items-center gap-1"
              title="درج جدول مشخصات"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="text-[10px]">جدول</span>
            </button>

            <div className="mr-auto text-[10px] text-neutral-400 font-mono pl-2">
              {value.length} کاراکتر
            </div>
          </div>
        )}

        {/* Text Area or Live Preview */}
        {activeTab === 'write' ? (
          <textarea
            id={editorId}
            rows={rows}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3.5 text-xs text-neutral-800 leading-relaxed outline-hidden resize-y font-sans"
          />
        ) : (
          <div className="p-4 min-h-[160px] bg-neutral-50/50 max-h-96 overflow-y-auto">
            {renderPreview(value)}
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-neutral-400 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-neutral-400 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
};
