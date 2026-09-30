import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileImage,
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { deleteMediaItem, listMediaLibrary, MediaLibraryItem, uploadImage } from '../../api/media';

const formatBytes = (bytes:number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
};

export const AdminMediaLibrary: React.FC = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  const [copied, setCopied] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setBusy(true);
    try {
      const result = await listMediaLibrary({ q: query, category, limit: 800 });
      setItems(result.items || []);
      setCategories(result.categories || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, [category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.filename.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.relativePath.toLowerCase().includes(q));
  }, [items, query]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        await uploadImage(file, category === 'all' ? 'general' : category);
      }
      await load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (item:MediaLibraryItem) => {
    if (!window.confirm(`رسانه «${item.filename}» حذف شود؟ این کار فایل را از هاست حذف می‌کند.`)) return;
    await deleteMediaItem(item.relativePath);
    if (selected?.relativePath === item.relativePath) setSelected(null);
    await load();
  };

  const copy = async (value:string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1300);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-neutral-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><FileImage className="w-5 h-5 text-blue-600" /> مدیریت رسانه</h2>
          <p className="text-xs text-neutral-500 mt-1">تمام تصاویر آپلودشده روی هاست؛ جستجو، فیلتر، آپلود گروهی، مشاهده جزئیات، کپی URL و حذف.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 px-3 border border-neutral-300 rounded-xl bg-white text-xs">
            <option value="all">همه پوشه‌ها</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="relative min-w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} className="w-full h-10 pr-10 pl-3 border border-neutral-300 rounded-xl text-xs" placeholder="جستجوی نام فایل..." />
          </div>
          <button type="button" onClick={() => void load()} className="h-10 px-3 border rounded-xl bg-neutral-50 text-neutral-700"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>
          <div className="flex rounded-xl border overflow-hidden">
            <button type="button" onClick={() => setView('grid')} className={`h-10 px-3 ${view === 'grid' ? 'bg-neutral-900 text-white' : 'bg-white'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button type="button" onClick={() => setView('list')} className={`h-10 px-3 ${view === 'list' ? 'bg-neutral-900 text-white' : 'bg-white'}`}><List className="w-4 h-4" /></button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && void uploadFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-black inline-flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            آپلود گروهی
          </button>
        </div>
      </div>

      <div className="p-6">
        {busy && !items.length ? (
          <div className="py-20 text-center text-neutral-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" /> در حال دریافت رسانه‌ها...</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map(item => (
              <button key={item.relativePath} type="button" onClick={() => setSelected(item)} className="group rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 text-right hover:border-blue-400 transition-colors">
                <div className="aspect-square bg-white overflow-hidden">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                </div>
                <div className="p-2.5">
                  <strong className="block text-[9px] truncate">{item.filename}</strong>
                  <span className="text-[8px] text-neutral-400">{item.category} • {formatBytes(item.size)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border rounded-2xl overflow-hidden">
            {filtered.map(item => (
              <div key={item.relativePath} className="p-3 border-b last:border-0 flex items-center gap-3 hover:bg-neutral-50">
                <img src={item.url} alt="" className="w-12 h-12 object-cover rounded-lg border" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs truncate">{item.filename}</strong>
                  <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">{item.relativePath}</span>
                </div>
                <span className="text-[9px] text-neutral-500">{item.category}</span>
                <span className="text-[9px] text-neutral-500">{formatBytes(item.size)}</span>
                <button type="button" onClick={() => setSelected(item)} className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[9px] font-bold">جزئیات</button>
              </div>
            ))}
          </div>
        )}

        {!filtered.length && !busy && (
          <div className="py-20 border-2 border-dashed rounded-3xl text-center text-neutral-400">
            <FileImage className="w-10 h-10 mx-auto mb-2" />
            <p className="text-xs font-bold">رسانه‌ای پیدا نشد.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-[1.2fr_.8fr]" onClick={e => e.stopPropagation()}>
            <div className="bg-neutral-100 min-h-[360px] grid place-items-center p-4">
              <img src={selected.url} alt={selected.filename} className="max-w-full max-h-[70vh] object-contain" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm">جزئیات رسانه</h3>
                <button onClick={() => setSelected(null)} className="w-8 h-8 grid place-items-center rounded-full bg-neutral-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2 text-[10px]">
                <div><span className="text-neutral-400">نام فایل:</span><strong className="block mt-1 break-all">{selected.filename}</strong></div>
                <div><span className="text-neutral-400">پوشه:</span><strong className="block mt-1">{selected.category}</strong></div>
                <div><span className="text-neutral-400">حجم:</span><strong className="block mt-1">{formatBytes(selected.size)}</strong></div>
                <div><span className="text-neutral-400">آخرین تغییر:</span><strong className="block mt-1" dir="ltr">{new Date(selected.modifiedAt).toLocaleString('fa-IR')}</strong></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1">URL</label>
                <div className="flex gap-2">
                  <input readOnly value={selected.url} dir="ltr" className="min-w-0 flex-1 p-2.5 border rounded-xl text-[9px] font-mono text-left" />
                  <button onClick={() => copy(selected.url)} className="w-10 grid place-items-center rounded-xl border bg-neutral-50">{copied === selected.url ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>
              <button onClick={() => void remove(selected)} className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 font-black text-xs inline-flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> حذف فایل از هاست</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
