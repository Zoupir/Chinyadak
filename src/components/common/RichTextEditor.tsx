import React, { Suspense, lazy, useState } from 'react';
import { Edit3, Eye } from 'lucide-react';
import { RichTextContent } from './RichTextContent';
import './RichTextEditor.css';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
}

const RichTextComposer = lazy(() =>
  import('./RichTextComposer').then(module => ({ default: module.RichTextComposer }))
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'متن را اینجا بنویسید...',
  rows = 8,
  helperText
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  return (
    <section className="rich-text-editor" dir="rtl">
      <header className="rich-text-editor__header">
        <label className="rich-text-editor__label">{label}</label>
        <div className="rich-text-editor__tabs" role="tablist" aria-label="حالت ویرایش متن">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            onClick={() => setActiveTab('write')}
            className={activeTab === 'write' ? 'is-active' : ''}
          >
            <Edit3 aria-hidden="true" />
            نوشتن
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            className={activeTab === 'preview' ? 'is-active' : ''}
          >
            <Eye aria-hidden="true" />
            پیش‌نمایش
          </button>
        </div>
      </header>

      {activeTab === 'write' ? (
        <Suspense fallback={<div className="rich-text-editor__loading" role="status">در حال آماده‌سازی ادیتور…</div>}>
          <RichTextComposer
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
          />
        </Suspense>
      ) : (
        <div className="rich-text-editor__preview">
          <RichTextContent content={value} className="rich-text-editor__preview-content" />
          {!value && <p className="rich-text-editor__empty">پیش‌نمایشی برای نمایش وجود ندارد.</p>}
        </div>
      )}

      {helperText && <p className="rich-text-editor__helper">{helperText}</p>}
    </section>
  );
};
