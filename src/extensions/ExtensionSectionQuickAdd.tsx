import React, { useEffect, useState } from 'react';
import { Puzzle, Plus } from 'lucide-react';
import type { ExtensionSectionDefinition } from './runtime';

type Props = {
  onAdd: (definition: ExtensionSectionDefinition) => void;
};

export const ExtensionSectionQuickAdd: React.FC<Props> = ({ onAdd }) => {
  const [definitions, setDefinitions] = useState<ExtensionSectionDefinition[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const sync = () => {
      const next = window.YadakExtensions?.getSections() || [];
      setDefinitions(next);
      setSelectedId(current => current && next.some(item => item.id === current) ? current : (next[0]?.id || ''));
    };
    sync();
    window.addEventListener('yadak:extensions-ready', sync);
    window.addEventListener('yadak:extension-sections-changed', sync);
    return () => {
      window.removeEventListener('yadak:extensions-ready', sync);
      window.removeEventListener('yadak:extension-sections-changed', sync);
    };
  }, []);

  if (!definitions.length) return null;
  const selected = definitions.find(item => item.id === selectedId) || definitions[0];

  return (
    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-right">
      <div className="flex items-center gap-2 mb-3 text-blue-900">
        <Puzzle className="w-4 h-4" />
        <strong className="text-xs">سکشن‌های افزونه‌ای</strong>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={selected?.id || ''} onChange={event => setSelectedId(event.target.value)} className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs">
          {definitions.map(item => <option key={item.id} value={item.id}>{item.label}{item.category ? ` — ${item.category}` : ''}</option>)}
        </select>
        <button type="button" onClick={() => selected && onAdd(selected)} className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white inline-flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> افزودن سکشن افزونه
        </button>
      </div>
      {selected?.description && <p className="text-[10px] leading-5 text-blue-800 mt-2">{selected.description}</p>}
    </div>
  );
};
