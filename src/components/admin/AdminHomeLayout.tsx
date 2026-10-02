import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getHomeLayoutBlocks, resolveHomeLayoutOrder } from '../../utils/homeLayout';
import type { HomeLayoutBlock } from '../../utils/homeLayout';

export const AdminHomeLayout: React.FC = () => {
  const { settings, pages, updateSettings } = useStore();
  const sections = pages.find(page => page.slug === 'home')?.sections || [];
  const blocks = useMemo(() => getHomeLayoutBlocks(sections), [sections]);
  const storedOrder = useMemo(() => resolveHomeLayoutOrder(settings.homeLayoutOrder, sections), [settings.homeLayoutOrder, sections]);
  const [draft, setDraft] = useState(storedOrder);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) setDraft(storedOrder);
  }, [storedOrder, dirty]);

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    setDraft(current => {
      const next = [...current];
      const fromIndex = next.indexOf(from);
      const toIndex = next.indexOf(to);
      if (fromIndex < 0 || toIndex < 0) return current;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, from);
      return next;
    });
    setDirty(true);
  };

  const move = (key: string, direction: -1 | 1) => {
    const index = draft.indexOf(key);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= draft.length) return;
    reorder(key, draft[nextIndex]);
  };

  const save = async () => {
    setSaving(true);
    const ok = await updateSettings({ homeLayoutOrder: draft });
    setSaving(false);
    if (ok) setDirty(false);
  };

  const blockByKey = new Map(blocks.map(block => [block.key, block]));
  const orderedBlocks = draft.map(key => blockByKey.get(key)).filter((block): block is HomeLayoutBlock => Boolean(block));

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-3xl bg-neutral-950 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-blue-300 font-black">چیدمان دیداری صفحهٔ اصلی</span>
          <h2 className="mt-1 text-xl font-black">جابه‌جایی سکشن‌ها و بنرها</h2>
          <p className="mt-2 text-xs text-neutral-300 leading-6">دستگیرهٔ هر ردیف را با موس بکش و در جای تازه رها کن. ترتیب فهرست، ترتیب نمایش صفحه از بالا به پایین است. اسلایدر اصلی و همهٔ جایگاه‌های بنر هم در همین چیدمان هستند.</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 text-white text-xs font-black inline-flex items-center justify-center gap-2 shrink-0">
          <Save className="w-4 h-4" />{saving ? 'در حال ذخیره...' : dirty ? 'ذخیره چیدمان' : 'چیدمان ذخیره شده'}
        </button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <section className="bg-white rounded-3xl border border-neutral-200 p-3 sm:p-5 space-y-2">
          {orderedBlocks.map((block, index) => (
            <article
              key={block.key}
              draggable
              onDragStart={event => { setDraggedKey(block.key); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', block.key); }}
              onDragEnd={() => setDraggedKey(null)}
              onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); const from = event.dataTransfer.getData('text/plain') || draggedKey; if (from) reorder(from, block.key); setDraggedKey(null); }}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${draggedKey === block.key ? 'opacity-40 border-blue-400' : 'border-neutral-200 hover:border-blue-300'}`}
            >
              <button type="button" aria-label="گرفتن و جابه‌جایی" title="با موس بکشید" className="cursor-grab active:cursor-grabbing text-neutral-400">
                <GripVertical className="w-5 h-5" />
              </button>
              <span className="w-8 h-8 shrink-0 rounded-lg bg-neutral-100 text-neutral-600 grid place-items-center text-xs font-black">{(index + 1).toLocaleString('fa-IR')}</span>
              <span className="flex-1 min-w-0">
                <strong className="block text-xs font-black truncate">{block.title}</strong>
                <small className="block mt-1 text-[9px] text-neutral-400">{block.kind === 'slider' ? 'اسلایدر' : block.kind === 'banner' ? 'جایگاه بنر مستقل' : 'سکشن صفحه'}</small>
              </span>
              <button type="button" onClick={() => move(block.key, -1)} disabled={index === 0} title="بالا" className="w-8 h-8 rounded-lg border bg-white disabled:opacity-30 grid place-items-center"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(block.key, 1)} disabled={index === orderedBlocks.length - 1} title="پایین" className="w-8 h-8 rounded-lg border bg-white disabled:opacity-30 grid place-items-center"><ArrowDown className="w-4 h-4" /></button>
            </article>
          ))}
        </section>
        <aside className="bg-blue-50 border border-blue-100 rounded-3xl p-5 text-xs text-blue-950 leading-7">
          <strong className="block text-sm mb-2">راهنمای چیدمان</strong>
          <p>ردیف‌ها را با دستگیره بکشید و جابه‌جا کنید؛ روی گوشی از دکمه‌های بالا و پایین استفاده کنید.</p>
          <p className="mt-2">ترتیب تازه پس از فشردن «ذخیره چیدمان» برای همهٔ بازدیدکنندگان نمایش داده می‌شود.</p>
        </aside>
      </div>
    </div>
  );
};
