import React from 'react';
import { AlertCircle } from 'lucide-react';

interface RichTextContentProps {
  value: string;
  className?: string;
}

const isSafeHref = (href: string): boolean =>
  /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(href.trim());

const renderInline = (input: string, keyPrefix: string): React.ReactNode[] => {
  const tokens = input.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link && isSafeHref(link[2])) {
      const external = /^https?:\/\//i.test(link[2]);
      return (
        <a
          key={key}
          href={link[2]}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="underline underline-offset-2 font-semibold"
        >
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={key}>{token}</React.Fragment>;
  });
};

const tableCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());

const isTableSeparator = (line: string): boolean => {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
};

export const RichTextContent: React.FC<RichTextContentProps> = ({ value, className = '' }) => {
  const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];

  for (let index = 0; index < lines.length;) {
    const raw = lines[index];
    const line = raw.trim();

    if (!line) {
      blocks.push(<div key={`space-${index}`} className="h-2" aria-hidden="true" />);
      index += 1;
      continue;
    }

    if (
      line.startsWith('|') &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border border-neutral-200 bg-neutral-50 px-3 py-2 text-right font-bold">
                    {renderInline(cell, `th-${index}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="border border-neutral-200 px-3 py-2 align-top">
                      {renderInline(row[cellIndex] || '', `td-${index}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^(•|-|\*)\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^(•|-|\*)\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^(•|-|\*)\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="list-disc pr-5 space-y-1.5 my-3">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className="list-decimal pr-5 space-y-1.5 my-3">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${index}`} className="font-black text-base mt-5 mb-2">
          {renderInline(line.slice(4), `h3-${index}`)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${index}`} className="font-black text-lg mt-6 mb-2">
          {renderInline(line.slice(3), `h2-${index}`)}
        </h2>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('> ⚠️') || line.startsWith('> [!WARNING]')) {
      const warning = line.replace(/^>\s*(⚠️|\[!WARNING\])?\s*/, '');
      blocks.push(
        <div key={`warning-${index}`} className="my-3 flex items-start gap-2 rounded-xl border-r-4 border-amber-500 bg-amber-50 p-3 text-amber-950">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>{renderInline(warning, `warning-${index}`)}</div>
        </div>
      );
      index += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-3 border-r-4 border-neutral-300 bg-neutral-50 px-4 py-3 italic">
          {renderInline(line.slice(2), `quote-${index}`)}
        </blockquote>
      );
      index += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${index}`} className="leading-7">
        {renderInline(raw, `p-${index}`)}
      </p>
    );
    index += 1;
  }

  return <div className={className}>{blocks}</div>;
};
