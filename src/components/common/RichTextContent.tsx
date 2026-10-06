import React from 'react';
import { markdownToSafeHtml } from '../../utils/richText';
import './RichTextEditor.css';

interface RichTextContentProps {
  content?: string;
  className?: string;
  inline?: boolean;
}

const wrapResponsiveTables = (html: string): string =>
  html
    .replace(/<table\b([^>]*)>/gi, '<div class="rich-text-table-wrap" role="region" aria-label="جدول اطلاعات"><table$1>')
    .replace(/<\/table>/gi, '</table></div>');

export const RichTextContent: React.FC<RichTextContentProps> = ({
  content = '',
  className = '',
  inline = false
}) => {
  const html = markdownToSafeHtml(content);
  const classes = 'rich-text-content' + (className ? ' ' + className : '');

  if (inline) {
    return (
      <span
        className={classes}
        dangerouslySetInnerHTML={{
          __html: html.replace(/<\/?p\b[^>]*>/gi, '').replace(/<br\s*\/?\s*>/gi, ' ')
        }}
      />
    );
  }

  return <div className={classes} dangerouslySetInnerHTML={{ __html: wrapResponsiveTables(html) }} />;
};
