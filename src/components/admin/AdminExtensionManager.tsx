import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArchiveRestore,
  CheckCircle2,
  Download,
  Package,
  Palette,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle
} from 'lucide-react';

interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  requiresCore?: string;
  permissions?: string[];
  hooks?: string[];
}

interface InstalledExtension {
  manifest: ExtensionManifest;
  state: { enabled: boolean; installedAt?: string; updatedAt?: string };
  compatible: boolean;
  compatibilityMessage?: string;
  rollbackAvailable?: boolean;
}

interface ExtensionListResponse {
  coreVersion: string;
  plugins: InstalledExtension[];
  themes: InstalledExtension[];
  activeThemeId: string | null;
}

type Kind = 'plugin' | 'theme';

type AdminExtensionManagerProps = {
  initialKind?: Kind;
};

const readJson = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const AdminExtensionManager: React.FC<AdminExtensionManagerProps> = ({ initialKind = 'plugin' }) => {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [data, setData] = useState<ExtensionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setKind(initialKind), [initialKind]);

  const request = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    const body = await readJson(response);
    if (!response.ok) throw new Error(body.detail || body.error || `HTTP ${response.status}`);
    return body;
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await request('/api/extensions');
      setData(result as ExtensionListResponse);
    } catch (error) {
      setNotice({ text: `خواندن افزونه‌ها و قالب‌ها انجام نشد: ${error instanceof Error ? error.message : String(error)}`, error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const items = useMemo(() => {
    if (!data) return [];
    return kind === 'plugin' ? data.plugins : data.themes;
  }, [data, kind]);

  const runAction = async (action: 'activate' | 'deactivate' | 'rollback' | 'delete', item: InstalledExtension) => {
    const id = item.manifest.id;
    if (action === 'delete' && !window.confirm(`«${item.manifest.name}» حذف شود؟ نسخه فعلی برای Rollback نگهداری می‌شود.`)) return;
    if (action === 'rollback' && !window.confirm(`نسخه قبلی «${item.manifest.name}» بازیابی شود؟`)) return;

    const key = `${action}:${kind}:${id}`;
    setBusyKey(key);
    setNotice(null);
    try {
      const base = `/api/extensions/${kind}/${encodeURIComponent(id)}`;
      await request(action === 'delete' ? base : `${base}/${action}`, { method: action === 'delete' ? 'DELETE' : 'POST' });
      setNotice({ text: action === 'activate' ? 'فعال‌سازی انجام شد.' : action === 'deactivate' ? 'افزونه/قالب غیرفعال شد.' : action === 'rollback' ? 'نسخه قبلی بازیابی شد.' : 'بسته حذف شد.' });
      await load();
      if (action === 'activate' || action === 'deactivate' || action === 'rollback') {
        window.dispatchEvent(new CustomEvent('yadak:extensions-changed'));
      }
    } catch (error) {
      setNotice({ text: `عملیات انجام نشد: ${error instanceof Error ? error.message : String(error)}`, error: true });
    } finally {
      setBusyKey('');
    }
  };

  const install = async (event: React.FormEvent) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice({ text: 'ابتدا فایل ZIP را انتخاب کنید.', error: true });
      return;
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setNotice({ text: 'فقط فایل ZIP قابل نصب است.', error: true });
      return;
    }

    setBusyKey('install');
    setNotice(null);
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);

    try {
      await request('/api/extensions/install', { method: 'POST', body: form });
      if (fileRef.current) fileRef.current.value = '';
      setNotice({ text: `${kind === 'plugin' ? 'افزونه' : 'قالب'} با موفقیت نصب شد. اکنون می‌توانید آن را فعال کنید.` });
      await load();
    } catch (error) {
      setNotice({ text: `نصب انجام نشد: ${error instanceof Error ? error.message : String(error)}`, error: true });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700" />
            افزونه‌ها و قالب‌های نصبی
          </h2>
          <p className="text-xs text-neutral-500 mt-1">نصب ZIP، فعال‌سازی، بروزرسانی، حذف و Rollback بدون تغییر مستقیم Core.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 bg-white border rounded-xl px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Core: <b className="font-mono text-neutral-800">{data?.coreVersion || '...'}</b></span>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="inline-flex p-1 bg-neutral-100 rounded-xl w-fit">
            <button type="button" onClick={() => setKind('plugin')} className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 ${kind === 'plugin' ? 'bg-white text-blue-700 shadow-sm' : 'text-neutral-500'}`}>
              <Package className="w-4 h-4" /> افزونه‌ها
            </button>
            <button type="button" onClick={() => setKind('theme')} className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 ${kind === 'theme' ? 'bg-white text-blue-700 shadow-sm' : 'text-neutral-500'}`}>
              <Palette className="w-4 h-4" /> قالب‌ها
            </button>
          </div>

          <form onSubmit={install} className="lg:mr-auto flex flex-col sm:flex-row gap-2 sm:items-center">
            <input ref={fileRef} type="file" accept=".zip,application/zip" className="text-xs border border-neutral-300 rounded-xl p-2 bg-white max-w-full" />
            <button type="submit" disabled={busyKey === 'install'} className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2">
              {busyKey === 'install' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              نصب ZIP
            </button>
          </form>
        </div>

        {notice && (
          <div className={`m-4 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${notice.error ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
            {notice.error ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {notice.text}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />در حال خواندن بسته‌ها...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-500">هنوز {kind === 'plugin' ? 'افزونه' : 'قالب'}ی نصب نشده است.</div>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 p-4 bg-neutral-50/60">
            {items.map(item => {
              const active = kind === 'theme' ? data?.activeThemeId === item.manifest.id : item.state.enabled;
              return (
                <article key={`${kind}:${item.manifest.id}`} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-neutral-900 truncate">{item.manifest.name}</h3>
                      <div className="text-[11px] text-neutral-500 mt-1 font-mono break-all">{item.manifest.id} · v{item.manifest.version}</div>
                      {item.manifest.author && <div className="text-[11px] text-neutral-400 mt-1">سازنده: {item.manifest.author}</div>}
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{active ? 'فعال' : 'غیرفعال'}</span>
                  </div>

                  {item.manifest.description && <p className="text-xs leading-6 text-neutral-600">{item.manifest.description}</p>}

                  <div className={`rounded-xl px-3 py-2 text-[11px] ${item.compatible ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {item.compatible ? '✓ سازگار با نسخه فعلی Core' : `✕ ${item.compatibilityMessage || 'با نسخه فعلی Core سازگار نیست'}`}
                  </div>

                  {!!item.manifest.hooks?.length && <div className="text-[10px] text-neutral-500"><b>Hookها:</b> {item.manifest.hooks.join('، ')}</div>}
                  {!!item.manifest.permissions?.length && <div className="text-[10px] text-neutral-500"><b>مجوزهای اعلام‌شده:</b> {item.manifest.permissions.join('، ')}</div>}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    {active ? (
                      <button type="button" disabled={busyKey !== ''} onClick={() => void runAction('deactivate', item)} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-[11px] font-black disabled:opacity-50">غیرفعال</button>
                    ) : (
                      <button type="button" disabled={!item.compatible || busyKey !== ''} onClick={() => void runAction('activate', item)} className="px-3 py-2 rounded-xl bg-blue-700 text-white text-[11px] font-black disabled:opacity-40">فعال‌سازی</button>
                    )}
                    {item.rollbackAvailable && (
                      <button type="button" disabled={busyKey !== ''} onClick={() => void runAction('rollback', item)} className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black flex items-center gap-1.5 disabled:opacity-50"><ArchiveRestore className="w-3.5 h-3.5" /> Rollback</button>
                    )}
                    <button type="button" disabled={busyKey !== ''} onClick={() => void runAction('delete', item)} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-[11px] font-black flex items-center gap-1.5 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> حذف</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 text-[10px] leading-5 text-neutral-500 flex items-start gap-2">
          <Download className="w-4 h-4 shrink-0 mt-0.5" />
          <span>فقط ZIPهای مورد اعتماد را نصب کنید. Installer مسیرها، symlink، تعداد فایل، حجم استخراج‌شده و manifest را قبل از نصب بررسی می‌کند.</span>
        </div>
      </div>
    </div>
  );
};
