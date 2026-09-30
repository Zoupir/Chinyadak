import React, { useMemo, useState } from 'react';
import { Check, Copy, Search, Shapes } from 'lucide-react';
import { ICON_CATALOG, IconRenderer } from '../common/IconRenderer';

export const AdminIconLibrary: React.FC = () => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');
  const groups = useMemo(() => Array.from(new Set(ICON_CATALOG.map(item => item.group))), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICON_CATALOG.filter(item => !q || item.name.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.className.includes(q));
  }, [query]);

  const copy = async (value:string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><Shapes className="w-5 h-5 text-violet-600" /> کتابخانه آیکن‌ها</h2>
          <p className="text-xs text-neutral-500 mt-1">آیکن را مستقیم در تنظیمات منو انتخاب کن یا کلاس آن مثل <code className="font-mono">icon-car</code> را کپی کن.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو بین آیکن‌ها..." className="w-full pr-10 pl-3 py-2.5 border rounded-xl text-xs" />
        </div>
      </div>

      <div className="p-6 space-y-8">
        {groups.map(group => {
          const items = filtered.filter(item => item.group === group);
          if (!items.length) return null;
          return (
            <section key={group}>
              <h3 className="font-black text-sm mb-3">{group}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2">
                {items.map(item => (
                  <div key={item.name} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col items-center text-center gap-2">
                    <IconRenderer icon={item.name} className="w-6 h-6" />
                    <strong className="text-[10px]">{item.label}</strong>
                    <button type="button" onClick={() => copy(item.className)} className="w-full py-1.5 rounded-lg bg-white border text-[8px] font-mono flex items-center justify-center gap-1" dir="ltr">
                      {copied === item.className ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {item.className}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
