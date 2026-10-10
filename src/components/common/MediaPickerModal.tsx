import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  FileImage,
  Folder,
  FolderOpen,
  Loader2,
  Search,
  Pencil,
  Upload,
  X
} from 'lucide-react';
import {
  listMediaLibrary,
  MediaLibraryItem,
  MediaUploadError,
  uploadImage,
  updateMediaSeo,
  MediaSeoMeta
} from '../../api/media';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaLibraryItem) => void;
  category?: string;
  initialUrl?: string;
  title?: string;
  allowUrl?: boolean;
}

type Tab = 'library' | 'upload' | 'url';

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  category = 'general',
  initialUrl = '',
  title = 'انتخاب رسانه',
  allowUrl = true
}) => {
  const [tab, setTab] = useState<Tab>('library');
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingSeoPath, setPendingSeoPath] = useState('');
  const [seoDraft, setSeoDraft] = useState<MediaSeoMeta>({ alt: '', title: '', caption: '', description: '' });
  const [savingSeo, setSavingSeo] = useState(false);
  const [editingSeo, setEditingSeo] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const autoSelectedUrlRef = useRef('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await listMediaLibrary({
        category: filterCategory,
        year: filterYear,
        month: filterMonth,
        limit: 1200
      });
      setItems(result.items || []);
      setCategories(result.categories || []);
      setYears(result.years || []);
      setMonths(result.months || []);
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof Error ? error.message : 'دریافت فهرست رسانه‌ها انجام نشد.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void load();
  }, [isOpen, filterCategory, filterYear, filterMonth]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setQuery('');
      setUploadError('');
      setDirectUrl('');
      setPendingSeoPath('');
      setEditingSeo(false);
      setMetadataError('');
      autoSelectedUrlRef.current = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !initialUrl) return;
    setTab('library');
    setFilterCategory('all');
    setFilterYear('all');
    setFilterMonth('all');
  }, [isOpen, initialUrl]);

  useEffect(() => {
    if (!isOpen || !initialUrl || !items.length || autoSelectedUrlRef.current === initialUrl) return;
    const normalize = (value: string) => {
      try {
        const parsed = new URL(value, window.location.origin);
        return parsed.origin === window.location.origin ? parsed.pathname : value;
      } catch {
        return value;
      }
    };
    const path = normalize(initialUrl);
    const match = items.find(item => normalize(item.url) === path);
    if (match) {
      setSelected(match);
      autoSelectedUrlRef.current = initialUrl;
    }
  }, [isOpen, initialUrl, items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      item.filename.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.seo?.alt?.toLowerCase().includes(q) ||
      item.seo?.title?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setUploadError('');
    try {
      const uploadedUrls: string[] = [];
      for (const file of list) uploadedUrls.push((await uploadImage(file, category)).url);
      const refreshed = await listMediaLibrary({ category, limit: 1200 });
      setItems(refreshed.items || []);
      setCategories(refreshed.categories || []);
      setYears(refreshed.years || []);
      setMonths(refreshed.months || []);
      setFilterCategory(category);
      setFilterYear('all');
      setFilterMonth('all');
      if (list.length === 1) {
        const item = refreshed.items.find(media => media.url === uploadedUrls[0]);
        if (item) {
          setSelected(item);
          setPendingSeoPath(item.relativePath);
          setSeoDraft({ alt: item.seo?.alt || '', title: item.seo?.title || '', caption: item.seo?.caption || '', description: item.seo?.description || '' });
          setTab('upload');
          return;
        }
      }
      setSelected(null);
      setPendingSeoPath('');
      setTab('library');
    } catch (error) {
      setUploadError(
        error instanceof MediaUploadError
          ? error.code === 'MEDIA_FILENAME_EXISTS'
            ? 'فایلی دقیقاً با همین نام در پوشه همین ماه وجود دارد. چون نام فایل نباید تغییر کند، ابتدا فایل قبلی را حذف کنید یا نام فایل را خودتان قبل از آپلود تغییر دهید.'
            : error.code === 'MEDIA_FILENAME_INVALID_OR_EXTENSION_MISMATCH'
              ? 'نام فایل یا پسوند آن معتبر نیست. نام فارسی و فاصله مجاز است؛ فقط مسیر و کاراکترهای کنترلی مجاز نیستند.'
              : `آپلود انجام نشد: ${error.code}`
          : 'آپلود رسانه انجام نشد.'
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const saveUploadedSeoAndSelect = async () => {
    if (!selected || selected.relativePath !== pendingSeoPath) return;
    setSavingSeo(true);
    setUploadError('');
    try {
      const seo = await updateMediaSeo(selected.relativePath, seoDraft);
      const updated = { ...selected, seo };
      setSelected(updated);
      setItems(current => current.map(item => item.relativePath === updated.relativePath ? updated : item));
      onSelect(updated.url, updated);
      onClose();
    } catch (error) {
      setUploadError(error instanceof MediaUploadError ? `ذخیره اطلاعات رسانه ناموفق بود: ${error.code}` : 'ذخیره اطلاعات سئو ناموفق بود.');
    } finally {
      setSavingSeo(false);
    }
  };
  const useUploadedWithoutSeo = () => {
    if (!selected || selected.relativePath !== pendingSeoPath) return;
    onSelect(selected.url, selected);
    onClose();
  };

  const openSelectedSeoEditor = () => {
    if (!selected) return;
    setSeoDraft({ alt: selected.seo?.alt || '', title: selected.seo?.title || '', caption: selected.seo?.caption || '', description: selected.seo?.description || '' });
    setMetadataError('');
    setEditingSeo(true);
  };

  const saveSelectedSeo = async () => {
    if (!selected) return;
    setSavingSeo(true);
    setMetadataError('');
    try {
      const seo = await updateMediaSeo(selected.relativePath, seoDraft);
      const updated = { ...selected, seo };
      setSelected(updated);
      setItems(current => current.map(item => item.relativePath === updated.relativePath ? updated : item));
      setEditingSeo(false);
    } catch (error) {
      setMetadataError(error instanceof MediaUploadError ? 'ذخیره اطلاعات رسانه ناموفق بود: ' + error.code : 'ذخیره اطلاعات رسانه ناموفق بود.');
    } finally {
      setSavingSeo(false);
    }
  };
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-sm p-1 sm:p-3 lg:p-6 flex items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-[calc(100vw-0.5rem)] sm:w-[96vw] max-w-[1440px] h-[calc(100dvh-0.5rem)] sm:h-[88dvh] max-h-[820px] min-h-0 bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={event => event.stopPropagation()}>
        <header className="min-h-14 sm:h-16 px-3 sm:px-6 py-2 sm:py-0 border-b border-neutral-200 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div>
            <h2 className="font-black text-base">{title}</h2>
            <p className="text-[10px] text-neutral-500 mt-0.5">کتابخانه رسانه، آپلود جدید یا لینک مستقیم</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 grid place-items-center rounded-xl bg-neutral-100 hover:bg-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-2 sm:px-6 border-b border-neutral-200 flex items-center gap-1 shrink-0 overflow-x-auto">
          {([
            ['library', 'کتابخانه رسانه'],
            ['upload', 'بارگذاری فایل جدید'],
            ...(allowUrl ? [['url', 'لینک مستقیم']] : [])
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-bold border-b-2 whitespace-nowrap ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-neutral-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'library' && (
          <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[210px_minmax(0,1fr)_270px]">
            <aside className="border-l border-neutral-200 bg-neutral-50 p-3 overflow-y-auto hidden lg:block">
              <strong className="text-[11px]">پوشه‌ها</strong>
              <button type="button" onClick={() => { setFilterCategory('all'); setFilterYear('all'); setFilterMonth('all'); }} className={`mt-2 w-full p-2 rounded-lg text-right text-[10px] font-bold flex items-center gap-2 ${filterCategory === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-white'}`}>
                <FolderOpen className="w-4 h-4" /> همه رسانه‌ها
              </button>
              <div className="mt-2 space-y-1">
                {categories.map(cat => (
                  <div key={cat}>
                    <button
                      type="button"
                      onClick={() => { setFilterCategory(cat); setFilterYear('all'); setFilterMonth('all'); }}
                      className={`w-full p-2 rounded-lg text-right text-[10px] font-bold flex items-center gap-2 ${filterCategory === cat && filterYear === 'all' ? 'bg-white shadow-xs text-blue-700' : 'hover:bg-white'}`}
                    >
                      <Folder className="w-4 h-4" /> {cat}
                    </button>
                    {filterCategory === cat && (
                      <div className="mr-5 mt-1 border-r border-neutral-200 pr-2 space-y-1">
                        {years.map(year => (
                          <div key={year}>
                            <button
                              type="button"
                              onClick={() => { setFilterYear(year); setFilterMonth('all'); }}
                              className={`w-full p-1.5 rounded text-right text-[9px] font-bold ${filterYear === year && filterMonth === 'all' ? 'bg-blue-50 text-blue-700' : 'text-neutral-600'}`}
                            >
                              {year}
                            </button>
                            {filterYear === year && (
                              <div className="mr-3 border-r border-neutral-200 pr-2">
                                {months.map(month => (
                                  <button
                                    key={month}
                                    type="button"
                                    onClick={() => setFilterMonth(month)}
                                    className={`block w-full p-1.5 rounded text-right text-[9px] ${filterMonth === month ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}
                                  >
                                    ماه {month}
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

            <main className="min-w-0 min-h-0 flex flex-col">
              <div className="p-3 border-b border-neutral-200 flex flex-wrap items-center gap-2 shrink-0">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input value={query} onChange={e => setQuery(e.target.value)} className="w-full h-10 pr-10 pl-3 border border-neutral-300 rounded-xl text-xs" placeholder="جستجو در نام فایل، ALT یا عنوان..." />
                </div>
                <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterYear('all'); setFilterMonth('all'); }} className="lg:hidden h-10 px-2 border rounded-xl bg-white text-[10px]">
                  <option value="all">همه پوشه‌ها</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <span className="text-[10px] text-neutral-400">{visible.length.toLocaleString('fa-IR')} رسانه</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                  <div className="h-full grid place-items-center text-neutral-400 text-xs">
                    <div className="text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-2" />در حال بارگذاری...</div>
                  </div>
                ) : visible.length ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-5 gap-2">
                    {visible.map(item => (
                      <button
                        key={item.relativePath}
                        type="button"
                        onClick={() => setSelected(item)}
                        className={`relative rounded-xl border overflow-hidden bg-neutral-50 text-right ${selected?.relativePath === item.relativePath ? 'border-blue-600 ring-2 ring-blue-100' : 'border-neutral-200 hover:border-neutral-400'}`}
                      >
                        {selected?.relativePath === item.relativePath && <span className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-blue-600 text-white grid place-items-center"><Check className="w-3 h-3" /></span>}
                        <div className="aspect-square bg-neutral-50 p-2"><img src={item.url} alt={item.seo?.alt || item.filename} className="w-full h-full object-contain" /></div>
                        <div className="p-2"><strong className="block text-[8px] truncate">{item.seo?.title || item.filename}</strong><span className="block text-[7px] text-neutral-400 truncate">{item.category}/{item.year}/{item.month}</span></div>
                      </button>
                    ))}
                  </div>
                ) : loadError ? (
                  <div className="h-full grid place-items-center text-center text-xs text-red-700">
                    <div><FileImage className="w-8 h-8 mx-auto mb-2" /><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 px-4 py-2 rounded-lg bg-red-50 font-bold">تلاش دوباره</button></div>
                  </div>
                ) : (
                  <div className="h-full grid place-items-center text-neutral-400 text-xs"><div className="text-center"><FileImage className="w-8 h-8 mx-auto mb-2" />رسانه‌ای در این فهرست پیدا نشد.</div></div>
                )}
              </div>
              {selected && (
                <div className="2xl:hidden p-3 border-t border-neutral-200 flex flex-wrap items-center gap-2 bg-white shrink-0">
                  <img src={selected.url} alt={selected.seo?.alt || ''} className="w-12 h-12 rounded-lg object-contain p-1 border" />
                  <span className="flex-1 min-w-[100px] text-[10px] font-bold truncate">{selected.seo?.title || selected.filename}</span>
                  <button type="button" onClick={openSelectedSeoEditor} className="px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-[10px] font-bold shrink-0 inline-flex items-center gap-1"><Pencil className="w-3 h-3" />ویرایش اطلاعات</button>
                  <button type="button" onClick={() => { onSelect(selected.url, selected); onClose(); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black shrink-0">انتخاب</button>
                </div>
              )}
            </main>

            <aside className="border-r border-neutral-200 p-4 overflow-y-auto bg-white hidden 2xl:block">
              {selected ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-xl border bg-neutral-50 overflow-hidden grid place-items-center">
                    <img src={selected.url} alt={selected.seo?.alt || ''} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-[10px] space-y-1">
                    <strong className="block break-all">{selected.seo?.title || selected.filename}</strong>
                    <span className="text-neutral-400 block">{selected.category}/{selected.year}/{selected.month}</span>
                    <span className="text-neutral-500 block">ALT: {selected.seo?.alt || 'تنظیم نشده'}</span>
                    {selected.seo?.caption && <span className="text-neutral-500 block line-clamp-2">توضیح کوتاه: {selected.seo.caption}</span>}
                    {selected.seo?.description && <span className="text-neutral-500 block line-clamp-3">توضیح کامل: {selected.seo.description}</span>}
                  </div>
                  <button type="button" onClick={openSelectedSeoEditor} className="w-full py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-bold inline-flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" />ویرایش اطلاعات رسانه</button>
                  <button type="button" onClick={() => { onSelect(selected.url, selected); onClose(); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black">استفاده از این رسانه</button>
                </div>
              ) : (
                <div className="h-full grid place-items-center text-center text-[10px] text-neutral-400">یک تصویر را انتخاب کنید.</div>
              )}
            </aside>
          </div>
        )}

        {tab === 'upload' && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-10 grid place-items-center">
            {pendingSeoPath && selected?.relativePath === pendingSeoPath ? (
              <div className="w-full max-w-4xl space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="w-20 h-20 shrink-0 rounded-xl border bg-white p-1 grid place-items-center"><img src={selected.url} alt={seoDraft.alt} className="max-w-full max-h-full object-contain" /></div>
                  <div className="min-w-0"><strong className="block text-xs">تصویر بارگذاری شد — اطلاعات رسانه را همین‌جا وارد کنید</strong><span className="block mt-1 text-[10px] text-neutral-500 truncate">{selected.filename}</span><p className="mt-1 text-[9px] text-neutral-500">این اطلاعات برای همین فایل در کتابخانه رسانه ذخیره می‌شود.</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-[10px] font-bold">متن جایگزین تصویر (ALT)<input value={seoDraft.alt} onChange={e => setSeoDraft(current => ({ ...current, alt: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                  <label className="block text-[10px] font-bold">عنوان تصویر<input value={seoDraft.title} onChange={e => setSeoDraft(current => ({ ...current, title: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                  <label className="block text-[10px] font-bold">توضیح کوتاه<textarea rows={2} value={seoDraft.caption} onChange={e => setSeoDraft(current => ({ ...current, caption: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                  <label className="block text-[10px] font-bold">توضیح کامل تصویر<textarea rows={2} value={seoDraft.description} onChange={e => setSeoDraft(current => ({ ...current, description: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                </div>
                {uploadError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold">{uploadError}</div>}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="button" disabled={savingSeo} onClick={() => void saveUploadedSeoAndSelect()} className="flex-1 py-3 rounded-xl bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-black">{savingSeo ? 'در حال ذخیره...' : 'ذخیره سئو و استفاده از تصویر'}</button>
                  <button type="button" disabled={savingSeo} onClick={useUploadedWithoutSeo} className="px-4 py-3 rounded-xl border text-neutral-600 text-xs font-bold disabled:opacity-50">استفاده بدون تغییر سئو</button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-3xl">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && void uploadFiles(e.target.files)} />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); void uploadFiles(e.dataTransfer.files); }}
                  className="w-full min-h-[min(320px,45dvh)] border-2 border-dashed border-neutral-300 hover:border-blue-500 rounded-3xl bg-neutral-50 flex flex-col items-center justify-center gap-4 text-neutral-600 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-12 h-12 animate-spin text-blue-600" /> : <Upload className="w-12 h-12 text-blue-600" />}
                  <div><strong className="block text-base">فایل‌ها را اینجا رها کنید یا کلیک کنید</strong><span className="block text-xs text-neutral-400 mt-2">فایل جدید خودکار در {category}/سال/ماه ذخیره می‌شود.</span></div>
                </button>
                {uploadError && <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold">{uploadError}</div>}
              </div>
            )}
          </div>
        )}

        {tab === 'url' && allowUrl && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-10 grid place-items-center">
            <div className="w-full max-w-xl space-y-3">
              <label className="text-xs font-bold">آدرس مستقیم تصویر</label>
              <input dir="ltr" value={directUrl} onChange={e => setDirectUrl(e.target.value)} className="w-full p-3 border rounded-xl text-left font-mono text-xs" placeholder="https://..." />
              <button type="button" disabled={!directUrl.trim()} onClick={() => { onSelect(directUrl.trim()); onClose(); }} className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-neutral-300 text-white text-xs font-black">استفاده از لینک</button>
            </div>
          </div>
        )}
      </div>

        {editingSeo && selected && (
          <div className="fixed inset-0 z-[100001] bg-black/65 backdrop-blur-sm p-3 flex items-center justify-center" onClick={() => setEditingSeo(false)}>
            <section role="dialog" aria-modal="true" aria-label="ویرایش اطلاعات تصویر" className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl space-y-4" onClick={event => event.stopPropagation()}>
              <div className="flex items-start gap-3">
                <img src={selected.url} alt={selected.seo?.alt || ''} className="w-16 h-16 rounded-xl border bg-neutral-50 object-contain p-1" />
                <div className="flex-1 min-w-0"><h3 className="font-black text-sm">اطلاعات رسانه</h3><p className="text-[10px] text-neutral-500 mt-1 truncate">{selected.filename}</p><p className="text-[9px] text-neutral-400 mt-1">این اطلاعات به همین فایل متصل است و در همهٔ فرم‌های سایت قابل استفاده خواهد بود.</p></div>
                <button type="button" onClick={() => setEditingSeo(false)} className="w-8 h-8 rounded-full bg-neutral-100 grid place-items-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-[10px] font-bold">متن جایگزین تصویر (ALT)<input value={seoDraft.alt} onChange={e => setSeoDraft(current => ({ ...current, alt: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                <label className="block text-[10px] font-bold">عنوان رسانه<input value={seoDraft.title} onChange={e => setSeoDraft(current => ({ ...current, title: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                <label className="block text-[10px] font-bold">توضیح کوتاه<textarea rows={3} value={seoDraft.caption} onChange={e => setSeoDraft(current => ({ ...current, caption: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
                <label className="block text-[10px] font-bold">توضیح کامل<textarea rows={4} value={seoDraft.description} onChange={e => setSeoDraft(current => ({ ...current, description: e.target.value }))} className="w-full mt-1 p-2.5 border rounded-xl text-xs font-normal" /></label>
              </div>
              {metadataError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold">{metadataError}</div>}
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveSelectedSeo()} disabled={savingSeo} className="flex-1 py-3 rounded-xl bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-black">{savingSeo ? 'در حال ذخیره...' : 'ذخیره اطلاعات رسانه'}</button>
                <button type="button" onClick={() => setEditingSeo(false)} disabled={savingSeo} className="px-4 py-3 rounded-xl border text-neutral-700 text-xs font-bold">انصراف</button>
              </div>
            </section>
          </div>
        )}
    </div>,
    document.body
  );
};
