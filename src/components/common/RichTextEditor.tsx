import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Code2, Edit3, Eye } from 'lucide-react';
import { RichTextContent } from './RichTextContent';
import { sanitizeRichHtml } from '../../utils/richText';
import './RichTextEditor.css';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
}

type EditorTab = 'write' | 'preview' | 'source';

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
  const [activeTab, setActiveTab] = useState<EditorTab>('write');
  const [sourceDraft, setSourceDraft] = useState(value || '');

  useEffect(() => {
    if (activeTab !== 'source') setSourceDraft(value || '');
  }, [value, activeTab]);

  const commitSource = () => {
    const safe = sanitizeRichHtml(sourceDraft || '');
    setSourceDraft(safe);
    if (safe !== value) onChange(safe);
    return safe;
  };

  const switchTab = (tab: EditorTab) => {
    if (tab === activeTab) return;
    if (activeTab === 'source') commitSource();
    if (tab === 'source') setSourceDraft(value || '');
    setActiveTab(tab);
  };

  return (
    <section className="rich-text-editor" dir="rtl" data-rich-editor-version="30.5.3">
      <header className="rich-text-editor__header">
        <label className="rich-text-editor__label">{label}</label>
        <div className="rich-text-editor__tabs" role="tablist" aria-label="حالت ویرایش متن">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            onClick={() => switchTab('write')}
            className={activeTab === 'write' ? 'is-active' : ''}
          >
            <Edit3 aria-hidden="true" />
            نوشتن
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => switchTab('preview')}
            className={activeTab === 'preview' ? 'is-active' : ''}
          >
            <Eye aria-hidden="true" />
            پیش‌نمایش
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'source'}
            onClick={() => switchTab('source')}
            className={activeTab === 'source' ? 'is-active' : ''}
          >
            <Code2 aria-hidden="true" />
            سورس HTML
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
      ) : activeTab === 'preview' ? (
        <div className="rich-text-editor__preview">
          <RichTextContent content={value} className="rich-text-editor__preview-content" />
          {!value && <p className="rich-text-editor__empty">پیش‌نمایشی برای نمایش وجود ندارد.</p>}
        </div>
      ) : (
        <div className="rich-text-editor__source-wrap" dir="ltr">
          <div className="rich-text-editor__source-head">
            <strong>HTML امن این محتوا</strong>
            <span>اسکریپت، iframe و کدهای ناامن هنگام خروج از این حالت حذف می‌شوند.</span>
          </div>
          <textarea
            className="rich-text-editor__source"
            value={sourceDraft}
            onChange={event => setSourceDraft(event.currentTarget.value)}
            onBlur={commitSource}
            spellCheck={false}
            rows={Math.max(8, rows + 2)}
            aria-label="کد HTML محتوا"
          />
        </div>
      )}

      {helperText && <p className="rich-text-editor__helper">{helperText}</p>}
    </section>
  );
};
