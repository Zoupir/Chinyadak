import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileImage,
  Folder,
  FolderOpen,
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import {
  deleteMediaItem,
  listMediaLibrary,
  MediaLibraryItem,
  updateMediaSeo,
  uploadImage
} from '../../api/media';

const formatBytes = (bytes:number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
};

const MONTH_LABELS: Record<string,string> = {
  '01':'ژانویه','02':'فوریه','03':'مارس','04':'آوریل','05':'مه','06':'ژوئن',
  '07':'ژوئیه','08':'اوت','09':'سپتامبر','10':'اکتبر','11':'نوامبر','12':'دسامبر'
};

export const AdminMediaLibrary: React.FC = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [category, setCategory] = useState('all');
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  const [copied, setCopied] = useState('');
  const [seoForm, setSeoForm] = useState({ alt:'', title:'', caption:'', description:'' });
  const [savingSeo, setSavingSeo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setBusy(true);
    try {
      const result = await listMediaLibrary({ q: query, category, year, month, limit: 1500 });
      setItems(result.items || []);
      setCategories(result.categories || []);
      setYears(result.years || []);
      setMonths(result.months || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, [category, year, month]);

  useEffect(() => {
    if (!selected) return;
    setSeoForm({
      alt: selected.seo?.alt || '',
      title: selected.seo?.title || '',
      caption: selected.seo?.caption || '',
      description: selected.seo?.description || ''
    });
  }, [selected?.relativePath]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      item.filename.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.relativePath.toLowerCase().includes(q) ||
      item.seo?.alt?.toLowerCase().includes(q) ||
      item.seo?.title?.toLowerCase().includes(q)
    );
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

  const saveSeo = async () => {
    if (!selected) return;
    setSavingSeo(true);
    try {
      const seo = await updateMediaSeo(selected.relativePath, seoForm);
      const updated = { ...selected, seo };
      setSelected(updated);
      setItems(prev => prev.map(item => item.relativePath === updated.relativePath ? updated : item));
    } finally {
      setSavingSeo(false);
    }
  };

  const copy = async (value:string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1300);
  };

  const chooseFolder = (cat:string, selectedYear='all', selectedMonth='all') => {
    setCategory(cat);
    setYear(selectedYear);
    setMonth(selectedMonth);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden min-h-[720px]">
      <div className="p-5 border-b border-neutral-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><FileImage className="w-5 h-5 text-blue-600" /> مدیریت رسانه</h2>
          <p className="text-xs text-neutral-500 mt-1">ساختار پوشه‌ای اصلی → سال → ماه، ویرایش SEO هر رسانه، آپلود گروهی و مدیریت کامل فایل‌ها.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} className="w-full h-10 pr-10 pl-3 border border-neutral-300 rounded-xl text-xs" placeholder="جستجوی نام، ALT یا عنوان..." />
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

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-h-[640px]">
        <aside className="border-l border-neutral-200 bg-neutral-50 p-3">
          <strong className="text-[11px]">پوشه‌های رسانه</strong>
          <button onClick={() => chooseFolder('all')} className={`mt-2 w-full p-2 rounded-lg text-right text-[10px] font-bold flex items-center gap-2 ${category === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-white'}`}>
            <FolderOpen className="w-4 h-4" /> همه رسانه‌ها
          </button>

          <div className="mt-2 space-y-1">
            {categories.map(cat => (
              <div key={cat}>
                <button onClick={() => chooseFolder(cat)} className={`w-full p-2 rounded-lg text-right text-[10px] font-bold flex items-center gap-2 ${category === cat && year === 'all' ? 'bg-white shadow-xs text-blue-700' : 'hover:bg-white'}`}>
                  <Folder className="w-4 h-4" /> {cat}
                </button>
                {category === cat && (
                  <div className="mr-5 mt-1 border-r border-neutral-200 pr-2 space-y-1">
                    {years.map(y => (
                      <div key={y}>
                        <button onClick={() => chooseFolder(cat,y)} className={`w-full p-1.5 rounded text-right text-[9px] font-bold ${year === y && month === 'all' ? 'bg-blue-50 text-blue-700' : 'text-neutral-600'}`}>
                          {y}
                        </button>
                        {year === y && (
                          <div className="mr-3 border-r border-neutral-200 pr-2 space-y-0.5">
                            {months.map(m => (
                              <button key={m} onClick={() => chooseFolder(cat,y,m)} className={`w-full p-1.5 rounded text-right text-[9px] ${month === m ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}>
                                {MONTH_LABELS[m] || `ماه ${m}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <strong className="text-xs">مسیر جاری: </strong>
              <span className="text-[10px] text-neutral-500 font-mono" dir="ltr">{[category !== 'all' ? category : '', year !== 'all' ? year : '', month !== 'all' ? month : ''].filter(Boolean).join('/') || 'all'}</span>
            </div>
            <span className="text-[10px] text-neutral-400">{filtered.length.toLocaleString('fa-IR')} فایل</span>
          </div>

          {busy && !items.length ? (
            <div className="py-20 text-center text-neutral-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" /> در حال دریافت رسانه‌ها...</div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(item => (
                <button key={item.relativePath} type="button" onClick={() => setSelected(item)} className="group rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 text-right hover:border-blue-400 transition-colors">
                  <div className="aspect-square bg-white overflow-hidden"><img src={item.url} alt={item.seo?.alt || item.filename} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" /></div>
                  <div className="p-2.5">
                    <strong className="block text-[9px] truncate">{item.seo?.title || item.filename}</strong>
                    <span className="text-[8px] text-neutral-400">{item.category}/{item.year}/{item.month} • {formatBytes(item.size)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden">
              {filtered.map(item => (
                <div key={item.relativePath} className="p-3 border-b last:border-0 flex items-center gap-3 hover:bg-neutral-50">
                  <img src={item.url} alt={item.seo?.alt || ''} className="w-12 h-12 object-cover rounded-lg border" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs truncate">{item.seo?.title || item.filename}</strong>
                    <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">{item.relativePath}</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">{item.category}/{item.year}/{item.month}</span>
                  <span className="text-[9px] text-neutral-500">{formatBytes(item.size)}</span>
                  <button type="button" onClick={() => setSelected(item)} className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[9px] font-bold">جزئیات و SEO</button>
                </div>
              ))}
            </div>
          )}

          {!filtered.length && !busy && (
            <div className="py-20 border-2 border-dashed rounded-3xl text-center text-neutral-400"><FileImage className="w-10 h-10 mx-auto mb-2" /><p className="text-xs font-bold">رسانه‌ای پیدا نشد.</p></div>
          )}
        </main>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-[1.1fr_.9fr]" onClick={e => e.stopPropagation()}>
            <div className="bg-neutral-100 min-h-[420px] grid place-items-center p-4">
              <img src={selected.url} alt={seoForm.alt} className="max-w-full max-h-[78vh] object-contain" />
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">جزئیات و SEO رسانه</h3>
                  <span className="text-[9px] text-neutral-400">{selected.category}/{selected.year}/{selected.month}</span>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 grid place-items-center rounded-full bg-neutral-100"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2.5 rounded-xl bg-neutral-50"><span className="text-neutral-400 block">نام فایل</span><strong className="block mt-1 break-all">{selected.filename}</strong></div>
                <div className="p-2.5 rounded-xl bg-neutral-50"><span className="text-neutral-400 block">حجم</span><strong className="block mt-1">{formatBytes(selected.size)}</strong></div>
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1">URL</label>
                <div className="flex gap-2">
                  <input readOnly value={selected.url} dir="ltr" className="min-w-0 flex-1 p-2.5 border rounded-xl text-[9px] font-mono text-left" />
                  <button onClick={() => copy(selected.url)} className="w-10 grid place-items-center rounded-xl border bg-neutral-50">{copied === selected.url ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div>
                  <strong className="text-xs text-emerald-950">SEO تصویر</strong>
                  <p className="text-[9px] text-emerald-700 mt-1">این اطلاعات مثل Media Library وردپرس روی خود رسانه ذخیره می‌شود.</p>
                </div>
                <label className="block"><span className="text-[9px] font-bold">ALT Text</span><input value={seoForm.alt} onChange={e => setSeoForm({...seoForm,alt:e.target.value})} className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-white" /></label>
                <label className="block"><span className="text-[9px] font-bold">Title</span><input value={seoForm.title} onChange={e => setSeoForm({...seoForm,title:e.target.value})} className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-white" /></label>
                <label className="block"><span className="text-[9px] font-bold">Caption</span><textarea rows={2} value={seoForm.caption} onChange={e => setSeoForm({...seoForm,caption:e.target.value})} className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-white" /></label>
                <label className="block"><span className="text-[9px] font-bold">Description</span><textarea rows={4} value={seoForm.description} onChange={e => setSeoForm({...seoForm,description:e.target.value})} className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-white" /></label>
                <button onClick={() => void saveSeo()} disabled={savingSeo} className="w-full py-2.5 rounded-xl bg-emerald-600 disabled:bg-emerald-300 text-white font-black text-xs">{savingSeo ? 'در حال ذخیره...' : 'ذخیره SEO رسانه'}</button>
              </div>

              <button onClick={() => void remove(selected)} className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 font-black text-xs inline-flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> حذف فایل از هاست</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
