import React, { useMemo, useState } from 'react';
import { Check, Copy, Search, X } from 'lucide-react';
import { ICON_CATALOG, IconRenderer } from './IconRenderer';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, onClose, compact = false }) => {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('همه');
  const groups = useMemo(() => ['همه', ...Array.from(new Set(ICON_CATALOG.map(item => item.group)))], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICON_CATALOG.filter(item =>
      (group === 'همه' || item.group === group) &&
      (!q || item.name.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.className.includes(q))
    );
  }, [query, group]);

  return (
    <div className={`${compact ? '' : 'rounded-2xl border border-neutral-200 bg-white shadow-xl'} overflow-hidden`}>
      <div className="p-3 border-b border-neutral-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجوی آیکن یا کلاس..." className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl text-xs" />
        </div>
        {onClose && <button type="button" onClick={onClose} className="w-9 h-9 grid place-items-center rounded-xl bg-neutral-100"><X className="w-4 h-4" /></button>}
      </div>

      <div className="px-3 py-2 border-b border-neutral-100 flex gap-1.5 overflow-x-auto">
        {groups.map(item => (
          <button key={item} type="button" onClick={() => setGroup(item)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${group === item ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{item}</button>
        ))}
      </div>

      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto">
        {filtered.map(item => {
          const selected = value === item.name || value === item.className;
          return (
            <button key={item.name} type="button" onClick={() => onChange(item.name)} className={`group relative min-h-20 p-2 rounded-xl border flex flex-col items-center justify-center gap-2 text-center ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'}`}>
              {selected && <Check className="absolute top-1.5 left-1.5 w-3 h-3" />}
              <IconRenderer icon={item.name} className="w-5 h-5" />
              <span className="text-[9px] font-bold line-clamp-1">{item.label}</span>
              <span className="text-[7px] text-neutral-400 font-mono line-clamp-1" dir="ltr">{item.className}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
