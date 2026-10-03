import React from 'react';
import { markdownToSafeHtml } from '../../utils/richText';

interface RichTextContentProps {
  content?: string;
  className?: string;
  inline?: boolean;
}

export const RichTextContent: React.FC<RichTextContentProps> = ({ content = '', className = '', inline = false }) => {
  const html = markdownToSafeHtml(content);
  if (inline) return <span className={className} dangerouslySetInnerHTML={{ __html: html.replace(/<\/?p>/gi, '').replace(/<br\s*\/?\s*>/gi, ' ') }} />;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};
