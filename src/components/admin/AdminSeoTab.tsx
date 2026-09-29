import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpLeft, BarChart3, Bot, BrainCircuit, Check,
  CheckCircle2, ChevronLeft, CircleGauge, Code2, ExternalLink, FileSearch,
  FileText, Gauge, GitBranch, Globe2, تاریخچه, KeyRound, Link2, ListChecks,
  Loader2, Network, RefreshCw, Route, Save, Search, Settings2, ShieldCheck,
  Sparkles, Trash2, WandSparkles, XCircle, Zap
} from 'lucide-react';

type SeoTab =
  | 'wizard' | 'dashboard' | 'content' | 'audit' | 'links' | 'schema'
  | 'indexing' | 'redirects' | 'gsc' | 'performance' | 'ai'
  | 'settings' | 'diagnostics';

const api = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `HTTP_${response.status}`);
  }
  return payload as T;
};

const fmt = (value: any) => Number(value || 0).toLocaleString('fa-IR');
const pct = (value: any) => (Number(value || 0) * (Number(value || 0) <= 1 ? 100 : 1)).toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + '%';

const Field: React.FC<{
  label: string;
  value: any;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
  textarea?: boolean;
}> = ({ label, value, onChange, type = 'text', dir = 'rtl', placeholder, textarea }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-bold text-neutral-600">{label}</span>
    {textarea ? (
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={4}
        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-white focus:outline-none focus:border-red-500"
      />
    ) : (
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-white focus:outline-none focus:border-red-500"
      />
    )}
  </label>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  desc?: string;
}> = ({ label, checked, onChange, desc }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-right"
  >
    <div>
      <div className="text-xs font-bold text-neutral-800">{label}</div>
      {desc && <div className="text-[10px] text-neutral-500 mt-0.5">{desc}</div>}
    </div>
    <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${checked ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? '-translate-x-5' : ''}`} />
    </span>
  </button>
);

const Card: React.FC<React.PropsWithChildren<{ title?: string; className?: string }>> = ({ title, className = '', children }) => (
  <div className={`bg-white rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-6 ${className}`}>
    {title && <h3 className="font-black text-sm text-neutral-900 mb-4">{title}</h3>}
    {children}
  </div>
);

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const safe = Math.max(0, Math.min(100, Number(score || 0)));
  const tone = safe >= 80 ? 'text-emerald-600' : safe >= 55 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="relative w-24 h-24 rounded-full border-[9px] border-neutral-100 flex items-center justify-center bg-white">
      <div className={`text-2xl font-black ${tone}`}>{safe}</div>
      <span className="absolute bottom-2 text-[9px] text-neutral-400">از ۱۰۰</span>
    </div>
  );
};

const errorFa = (error: unknown): string => {
  const code = String((error as Error)?.message || error || '');
  const map: Record<string, string> = {
    AI_API_KEY_NOT_CONFIGURED: 'کلید API هوش مصنوعی تنظیم نشده است.',
    GSC_CLIENT_ID_NOT_CONFIGURED: 'Client ID سرچ کنسول تنظیم نشده است.',
    GSC_NOT_CONNECTED: 'Search Console هنوز متصل نشده است.',
    GSC_PROPERTY_NOT_CONFIGURED: 'Property سرچ کنسول انتخاب نشده است.',
    INDEXNOW_DISABLED: 'IndexNow غیرفعال است.',
    SEO_LINK_RELATION_NOT_VALID: 'رابطه لینک از نظر گراف معنایی معتبر نیست.',
    SEO_LINK_NO_SAFE_PARAGRAPH: 'محل امنی برای درج خودکار لینک پیدا نشد.'
  };
  return map[code] || code || 'خطای ناشناخته';
};

export const AdminSeoTab: React.FC = () => {
  const [tab, setTab] = useState<SeoTab>('wizard');
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [actionCenter, setActionCenter] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any>(null);

  const [entityType, setEntityType] = useState('product');
  const [entityQuery, setEntityQuery] = useState('');
  const [entities, setEntities] = useState<any[]>([]);
  const [entityTotal, setEntityTotal] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [metaForm, setMetaForm] = useState<any>(null);
  const [linkSuggestions, setLinkSuggestions] = useState<any[]>([]);
  const [keywordMap, setKeywordMap] = useState<any[]>([]);
  const [keywordOwnerForm, setKeywordOwnerForm] = useState({ query: '', preferredUrl: '', note: '' });
  const [aiPackage, setAiPackage] = useState<any>(null);
  const [aiInstructions, setAiInstructions] = useState('');

  const [issues, setIssues] = useState<any[]>([]);
  const [schemaIssues, setSchemaIssues] = useState<any[]>([]);
  const [redirects, setRedirects] = useState<any[]>([]);
  const [redirectForm, setRedirectForm] = useState({ source: '', target: '', matchType: 'exact', statusCode: 301 });
  const [errors404, setErrors404] = useState<any[]>([]);
  const [gsc, setGsc] = useState<any>(null);
  const [gscQuery, setGscQuery] = useState('');
  const [gscInspector, setGscInspector] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [performanceUrl, setPerformanceUrl] = useState(window.location.origin);
  const [performanceStrategy, setPerformanceStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [inspectUrl, setInspectUrl] = useState(window.location.origin);
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [history, setتاریخچه] = useState<any[]>([]);
  const [health, setسلامت سیستم] = useState<any>(null);
  const [selfTest, setSelfTest] = useState<any>(null);

  const flash = (text: string, type: 'ok' | 'error' = 'ok') => {
    setNotice({ text, type });
    window.setTimeout(() => setNotice(null), 4500);
  };

  const run = async <T,>(key: string, fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(key);
    try {
      const result = await fn();
      if (success) flash(success);
      return result;
    } catch (error) {
      flash(errorFa(error), 'error');
      return undefined;
    } finally {
      setBusy('');
    }
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api<any>('/api/seo/summary');
      setSummary(data.summary);
      setActionCenter(data.actionCenter);
      setSettings(data.settings);
      setIntegrations(data.integrations);
    } catch (error) {
      flash(errorFa(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    const params = new URLSearchParams({ type: entityType, q: entityQuery, limit: '100' });
    const data = await api<any>('/api/seo/entities?' + params.toString());
    setEntities(data.items || []);
    setEntityTotal(Number(data.total || 0));
  };

  const openEntity = async (item: any) => {
    setSelectedEntity(item);
    const data = await api<any>(`/api/seo/entities/${item.type}/${encodeURIComponent(item.id)}`);
    setWorkspace(data);
    setMetaForm(data.meta);
    const links = await api<any>(`/api/seo/links/${item.type}/${encodeURIComponent(item.id)}?limit=10`).catch(() => ({ suggestions: [] }));
    setLinkSuggestions(links.suggestions || []);
  };

  useEffect(() => { void loadOverview(); }, []);
  useEffect(() => {
    if (['content', 'links', 'ai'].includes(tab)) void loadEntities().catch(error => flash(errorFa(error), 'error'));
  }, [tab, entityType]);

  const tabs = [
    { id: 'wizard', label: 'ویزارد راه‌اندازی', icon: WandSparkles },
    { id: 'dashboard', label: 'داشبورد', icon: BarChart3 },
    { id: 'content', label: 'سئوی محتوا', icon: FileText },
    { id: 'audit', label: 'پایش و مرکز اقدامات', icon: ListChecks },
    { id: 'links', label: 'لینک‌سازی داخلی', icon: Network },
    { id: 'schema', label: 'داده‌های ساختاریافته', icon: Code2 },
    { id: 'indexing', label: 'ایندکس و نقشه سایت', icon: Globe2 },
    { id: 'redirects', label: 'ریدایرکت و خطاهای ۴۰۴', icon: Route },
    { id: 'gsc', label: 'سرچ کنسول گوگل', icon: Search },
    { id: 'performance', label: 'سرعت و بررسی فنی', icon: Gauge },
    { id: 'ai', label: 'استودیوی هوش مصنوعی', icon: Bot },
    { id: 'settings', label: 'تنظیمات پیشرفته', icon: Settings2 },
    { id: 'diagnostics', label: 'عیب‌یابی و لاگ‌ها', icon: Activity }
  ] as const;

  const saveSettings = async () => {
    const data = await run('save-settings', () => api<any>('/api/seo/settings', {
      method: 'PUT', body: JSON.stringify(settings)
    }), 'تنظیمات TakRank SEO ذخیره شد.');
    if (data) setSettings(data.settings);
  };

  const saveIntegrations = async () => {
    const data = await run('save-integrations', () => api<any>('/api/seo/integrations', {
      method: 'PUT', body: JSON.stringify(integrations)
    }), 'اتصال‌ها و کلیدهای امن ذخیره شدند.');
    if (data) setIntegrations(data.integrations);
  };

  const saveMeta = async () => {
    if (!selectedEntity || !metaForm) return;
    const data = await run('save-meta', () => api<any>(
      `/api/seo/entities/${selectedEntity.type}/${encodeURIComponent(selectedEntity.id)}/meta`,
      { method: 'PUT', body: JSON.stringify(metaForm) }
    ), 'تنظیمات سئوی این URL ذخیره شد.');
    if (data) {
      setMetaForm(data.meta);
      setWorkspace((prev: any) => prev ? { ...prev, meta: data.meta, analysis: data.meta.analysis } : prev);
    }
  };

  const doAudit = async () => {
    await run('audit', () => api('/api/seo/audit/run', { method: 'POST', body: '{}' }), 'Audit کامل شد.');
    const [issueData, actionData] = await Promise.all([
      api<any>('/api/seo/issues?status=open&limit=250'),
      api<any>('/api/seo/actions')
    ]);
    setIssues(issueData.issues || []);
    setActionCenter(actionData.actionCenter);
    await loadOverview();
  };

  const loadAudit = async () => {
    const [issueData, actionData] = await Promise.all([
      api<any>('/api/seo/issues?status=open&limit=250'),
      api<any>('/api/seo/actions')
    ]);
    setIssues(issueData.issues || []);
    setActionCenter(actionData.actionCenter);
  };

  const buildGraph = async () => {
    const data = await run('graph', () => api<any>('/api/seo/graph/rebuild', { method: 'POST', body: '{}' }), 'گراف معنایی بازسازی شد.');
    if (data) setSummary((prev: any) => ({ ...prev, graph: data.graph, graphگرهs: data.graph.nodes }));
    if (selectedEntity) await openEntity(selectedEntity);
  };

  const runAi = async (operation: 'optimize' | 'generate' | 'repair') => {
    if (!selectedEntity) {
      flash('ابتدا یک محصول، مقاله یا برگه را انتخاب کنید.', 'error');
      return;
    }
    const data = await run('ai', () => api<any>('/api/seo/ai/run', {
      method: 'POST',
      body: JSON.stringify({
        entityType: selectedEntity.type,
        entityId: selectedEntity.id,
        operation,
        instructions: aiInstructions
      })
    }));
    if (data) {
      setAiPackage(data.package);
      flash('خروجی AI آماده بررسی است.');
    }
  };

  const applyAi = async () => {
    if (!selectedEntity || !aiPackage) return;
    const data = await run('ai-apply', () => api<any>('/api/seo/ai/apply', {
      method: 'POST',
      body: JSON.stringify({
        entityType: selectedEntity.type,
        entityId: selectedEntity.id,
        package: aiPackage,
        applyContent: true,
        applyMeta: true
      })
    }), 'بسته AI روی محتوا و SEO اعمال شد.');
    if (data) await openEntity(selectedEntity);
  };

  const loadTabData = async (nextTab: SeoTab) => {
    setTab(nextTab);
    try {
      if (nextTab === 'audit') await loadAudit();
      if (nextTab === 'links') {
        const data = await api<any>('/api/seo/keywords');
        setKeywordMap(data.items || []);
      }
      if (nextTab === 'schema') {
        const data = await api<any>('/api/seo/schema/audit');
        setSchemaIssues(data.issues || []);
      }
      if (nextTab === 'redirects') {
        const [r, e] = await Promise.all([api<any>('/api/seo/redirects'), api<any>('/api/seo/404')]);
        setRedirects(r.redirects || []);
        setErrors404(e.items || []);
      }
      if (nextTab === 'gsc') setGsc(await api<any>('/api/seo/gsc/overview?days=28'));
      if (nextTab === 'performance') setPerformance((await api<any>('/api/seo/performance/history?limit=60')).items || []);
      if (nextTab === 'diagnostics') {
        const [h, j, l, hist] = await Promise.all([
          api<any>('/api/seo/health'),
          api<any>('/api/seo/jobs?limit=100'),
          api<any>('/api/seo/diagnostics/logs?limit=300'),
          api<any>('/api/seo/history?limit=200')
        ]);
        setسلامت سیستم(h); setJobs(j.items || []); setLogs(l.items || []); setتاریخچه(hist.items || []);
      }
    } catch (error) {
      flash(errorFa(error), 'error');
    }
  };

  const entityTypeLabels: Record<string, string> = {
    product: 'محصولات', article: 'مقالات', category: 'دسته‌بندی‌ها',
    page: 'برگه‌ها', brand: 'برند خودرو', model: 'مدل خودرو'
  };

  const serpTitle = metaForm?.seoTitle || workspace?.entity?.title || '';
  const serpDesc = metaForm?.metaDescription || workspace?.entity?.description || '';

  if (loading || !settings) {
    return <div className="min-h-80 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-3xl bg-neutral-950 text-white p-5 sm:p-7 overflow-hidden relative">
        <div className="absolute -left-16 -top-16 w-56 h-56 bg-red-600/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-400 text-xs font-black mb-2">
              <Sparkles className="w-4 h-4" />
              تک‌رنک سئو — موتور بومی سایت
            </div>
            <h2 className="text-xl sm:text-2xl font-black">مرکز سئو و رشد ارگانیک</h2>
            <p className="text-xs text-neutral-400 mt-2 max-w-2xl">
              مدیریت یکپارچه سئوی محتوا، گراف معنایی، لینک‌سازی، داده‌های ساختاریافته، سرچ کنسول، سرعت، هوش مصنوعی و ایندکسینگ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void doAudit()} disabled={!!busy} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black flex items-center gap-2 disabled:opacity-50">
              {busy === 'audit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
              پایش کامل سئو
            </button>
            <button onClick={() => void buildGraph()} disabled={!!busy} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-2 disabled:opacity-50">
              <Network className="w-4 h-4" />
              بازسازی گراف معنایی
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${notice.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {notice.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl p-2 flex gap-1.5 overflow-x-auto">
        {tabs.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => void loadTabData(item.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors ${tab === item.id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'wizard' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-neutral-900">ویزارد حرفه‌ای راه‌اندازی تک‌رنک سئو</h3>
                <p className="text-[11px] text-neutral-500 mt-1">پنج مرحله اصلی برای هویت، ایندکس، محتوای سئو، اتصال‌های گوگل و اتوماسیون.</p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['هویت سایت', 'ایندکس و ساختار', 'محتوا و اسکیما', 'اتصال‌های گوگل', 'هوش مصنوعی و اتوماسیون'].map((label, index) => {
                  const step = index + 1;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setWizardStep(step)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-[10px] font-black border ${wizardStep === step ? 'bg-red-600 border-red-600 text-white' : step < wizardStep ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}
                    >
                      {step.toLocaleString('fa-IR')}. {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {wizardStep === 1 && (
            <Card title="مرحله ۱ — هویت سایت و کسب‌وکار">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="نام سایت" value={settings.global.siteTitle} onChange={v => setSettings({ ...settings, global: { ...settings.global, siteTitle: v }, identity: { ...settings.identity, organizationName: v } })} />
                <Field label="شعار سایت" value={settings.global.siteSlogan} onChange={v => setSettings({ ...settings, global: { ...settings.global, siteSlogan: v } })} />
                <Field label="نام کسب‌وکار / سازمان" value={settings.identity.organizationName} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, organizationName: v } })} />
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-600">نوع کسب‌وکار برای اسکیما</span>
                  <select value={settings.identity.organizationType} onChange={e => setSettings({ ...settings, identity: { ...settings.identity, organizationType: e.target.value } })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-white">
                    <option value="AutoPartsStore">فروشگاه قطعات خودرو</option>
                    <option value="AutomotiveBusiness">کسب‌وکار خودرویی</option>
                    <option value="Store">فروشگاه</option>
                    <option value="LocalBusiness">کسب‌وکار محلی</option>
                    <option value="Organization">سازمان</option>
                  </select>
                </label>
                <Field label="آدرس لوگو" dir="ltr" value={settings.identity.logoUrl} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, logoUrl: v } })} />
                <Field label="تلفن" dir="ltr" value={settings.identity.phone} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, phone: v } })} />
                <Field label="ایمیل" dir="ltr" value={settings.identity.email} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, email: v } })} />
                <Field label="شهر" value={settings.identity.city} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, city: v } })} />
                <Field label="استان" value={settings.identity.region} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, region: v } })} />
                <Field label="کشور" value={settings.identity.country} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, country: v } })} />
                <div className="md:col-span-2"><Field textarea label="آدرس کامل" value={settings.identity.address} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, address: v } })} /></div>
              </div>
            </Card>
          )}

          {wizardStep === 2 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="مرحله ۲ — ایندکس و نقشه سایت">
                <div className="space-y-2">
                  <Toggle label="اجازه ایندکس سایت" checked={Boolean(settings.global.indexRobots)} onChange={v => setSettings({ ...settings, global: { ...settings.global, indexRobots: v } })} />
                  <Toggle label="نقشه سایت XML" checked={Boolean(settings.modules.sitemap)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, sitemap: v } })} />
                  <Toggle label="درج تصاویر در نقشه سایت" checked={Boolean(settings.sitemap.includeImages)} onChange={v => setSettings({ ...settings, sitemap: { ...settings.sitemap, includeImages: v } })} />
                  <Toggle label="نقشه سایت HTML" checked={Boolean(settings.sitemap.htmlEnabled)} onChange={v => setSettings({ ...settings, sitemap: { ...settings.sitemap, htmlEnabled: v } })} />
                  <Toggle label="IndexNow" checked={Boolean(settings.indexNow.enabled)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, indexNow: v }, indexNow: { ...settings.indexNow, enabled: v } })} desc="برای اطلاع سریع موتورهای جستجو پس از تغییر صفحات." />
                </div>
              </Card>
              <Card title="ساختار و لینک‌سازی">
                <div className="space-y-2">
                  <Toggle label="مدیریت متا" checked={Boolean(settings.modules.meta)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, meta: v } })} />
                  <Toggle label="بردکرامب" checked={Boolean(settings.modules.breadcrumbs)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, breadcrumbs: v } })} />
                  <Toggle label="لینک‌سازی داخلی معنایی" checked={Boolean(settings.modules.internalLinks)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, internalLinks: v } })} />
                  <Toggle label="پایش خطاهای ۴۰۴" checked={Boolean(settings.modules.monitor404)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, monitor404: v } })} />
                  <Toggle label="مدیریت ریدایرکت‌ها" checked={Boolean(settings.modules.redirects)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, redirects: v } })} />
                </div>
              </Card>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="مرحله ۳ — محتوا و امتیازدهی">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="حداقل کلمات مقاله" type="number" value={settings.scoring.articleMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, articleMinimumWords: Number(v) } })} />
                  <Field label="حداقل کلمات محصول" type="number" value={settings.scoring.productMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, productMinimumWords: Number(v) } })} />
                  <Field label="حداقل کلمات برگه" type="number" value={settings.scoring.pageMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, pageMinimumWords: Number(v) } })} />
                  <Field label="حداقل تراکم کلمه کلیدی ٪" type="number" value={settings.scoring.densityMin} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, densityMin: Number(v) } })} />
                </div>
                <div className="space-y-2 mt-4">
                  <Toggle label="فهرست مطالب خودکار" checked={Boolean(settings.toc.enabled)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, toc: v }, toc: { ...settings.toc, enabled: v } })} />
                  <Toggle label="سئوی تصاویر" checked={Boolean(settings.modules.imageSeo)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, imageSeo: v } })} />
                </div>
              </Card>
              <Card title="داده‌های ساختاریافته">
                <div className="space-y-2">
                  <Toggle label="اسکیما فعال باشد" checked={Boolean(settings.modules.schema)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, schema: v } })} desc="محصول، مقاله، FAQ، بردکرامب، سازمان و صفحات سایت." />
                  <Toggle label="hreflang" checked={Boolean(settings.modules.hreflang)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, hreflang: v } })} />
                  <Toggle label="پایش خودکار سئو" checked={Boolean(settings.modules.auditor)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, auditor: v } })} />
                  <Field label="عنوان متای صفحه اصلی" value={settings.global.metaTitle} onChange={v => setSettings({ ...settings, global: { ...settings.global, metaTitle: v } })} />
                  <Field textarea label="توضیحات متای صفحه اصلی" value={settings.global.metaDescription} onChange={v => setSettings({ ...settings, global: { ...settings.global, metaDescription: v } })} />
                </div>
              </Card>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="مرحله ۴ — سرچ کنسول گوگل">
                <div className="space-y-3">
                  <Field label="شناسه کاربری OAuth گوگل" dir="ltr" value={integrations.gscClientId} onChange={v => setIntegrations({ ...integrations, gscClientId: v })} />
                  <Field label="کلید محرمانه OAuth گوگل" type="password" dir="ltr" value={integrations.gscClientSecret} onChange={v => setIntegrations({ ...integrations, gscClientSecret: v })} />
                  <Field label="Property سرچ کنسول" dir="ltr" value={integrations.gscProperty} onChange={v => setIntegrations({ ...integrations, gscProperty: v })} placeholder="sc-domain:example.com" />
                  <div className={`p-3 rounded-xl text-xs font-bold ${integrations.gscConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {integrations.gscConnected ? 'اتصال سرچ کنسول فعال است.' : 'پس از ذخیره اطلاعات OAuth، از تب سرچ کنسول اتصال را تکمیل کنید.'}
                  </div>
                </div>
              </Card>
              <Card title="بررسی سرعت و سلامت فنی">
                <div className="space-y-3">
                  <Field label="کلید API سرویس PageSpeed" type="password" dir="ltr" value={integrations.pageSpeedApiKey} onChange={v => setIntegrations({ ...integrations, pageSpeedApiKey: v })} />
                  <Toggle label="ماژول سرعت فعال باشد" checked={Boolean(settings.modules.performance)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, performance: v } })} />
                  <Toggle label="بازرسی فنی URL فعال باشد" checked={Boolean(settings.modules.inspector)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, inspector: v } })} />
                </div>
              </Card>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="مرحله ۵ — هوش مصنوعی سئو">
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-600">ارائه‌دهنده هوش مصنوعی</span>
                    <select value={integrations.aiProvider} onChange={e => setIntegrations({ ...integrations, aiProvider: e.target.value })} className="w-full p-3 border rounded-xl text-xs">
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </label>
                  <Field label="مدل هوش مصنوعی" dir="ltr" value={integrations.aiModel} onChange={v => setIntegrations({ ...integrations, aiModel: v })} />
                  <Field label="کلید API هوش مصنوعی" type="password" dir="ltr" value={integrations.aiApiKey} onChange={v => setIntegrations({ ...integrations, aiApiKey: v })} />
                  <Field label="تعداد کلمات هدف" type="number" value={settings.ai.requestedWords} onChange={v => setSettings({ ...settings, ai: { ...settings.ai, requestedWords: Number(v) } })} />
                </div>
              </Card>
              <Card title="اتوماسیون و پایش">
                <div className="space-y-3">
                  <Toggle label="اتوماسیون سئو فعال باشد" checked={Boolean(settings.modules.automation)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, automation: v } })} />
                  <Field label="فاصله پایش کامل (ساعت)" type="number" value={settings.automation.auditCadenceHours} onChange={v => setSettings({ ...settings, automation: { ...settings.automation, auditCadenceHours: Number(v) } })} />
                  <Field label="فاصله همگام‌سازی سرچ کنسول (ساعت)" type="number" value={settings.automation.gscSyncCadenceHours} onChange={v => setSettings({ ...settings, automation: { ...settings.automation, gscSyncCadenceHours: Number(v) } })} />
                  <Toggle label="ثبت لاگ زمان اجرا" checked={Boolean(settings.runtimeLogging)} onChange={v => setSettings({ ...settings, runtimeLogging: v })} />
                </div>
              </Card>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(step => Math.max(1, step - 1))}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-black disabled:opacity-40"
            >
              مرحله قبل
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { void saveSettings(); void saveIntegrations(); }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs font-black"
              >
                ذخیره
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveSettings();
                  void saveIntegrations();
                  if (wizardStep < 5) setWizardStep(step => Math.min(5, step + 1));
                  else flash('ویزارد سئو ذخیره شد. اکنون می‌توانید پایش کامل را اجرا کنید.');
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black"
              >
                {wizardStep < 5 ? 'ذخیره و ادامه' : 'پایان و ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['میانگین امتیاز', summary?.averageScore || 0, CircleGauge, 'text-blue-600'],
              ['مشکلات باز', summary?.openIssues || 0, AlertTriangle, 'text-red-600'],
              ['نودهای Graph', summary?.graphگرهs || 0, Network, 'text-violet-600'],
              ['404 حل‌نشده', summary?.unresolved404 || 0, FileSearch, 'text-amber-600']
            ].map(([label, value, Icon, tone]: any) => (
              <Card key={label} className="!p-4">
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${tone}`} />
                  <span className="text-2xl font-black">{fmt(value)}</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-2">{label}</div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card title="وضعیت گراف معنایی">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span>وضعیت</span><b className={summary?.graph?.ready ? 'text-emerald-600' : 'text-amber-600'}>{summary?.graph?.ready ? 'آماده' : 'نیاز به ساخت'}</b></div>
                <div className="flex justify-between"><span>گره</span><b>{fmt(summary?.graph?.nodes)}</b></div>
                <div className="flex justify-between"><span>ارتباط</span><b>{fmt(summary?.graph?.edges)}</b></div>
                <div className="flex justify-between"><span>حداقل امتیاز پیشنهاد</span><b>{summary?.graph?.minimumCandidateScore || 62}</b></div>
                {summary?.graph?.stale && <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">Graph بعد از تغییرات محتوا نیاز به بازسازی دارد.</div>}
              </div>
            </Card>

            <Card title="مرکز اقدامات">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-red-50"><b className="text-red-700 text-xl">{fmt(actionCenter?.high)}</b><div className="text-[10px] text-red-600">High</div></div>
                <div className="p-3 rounded-xl bg-amber-50"><b className="text-amber-700 text-xl">{fmt(actionCenter?.medium)}</b><div className="text-[10px] text-amber-600">Medium</div></div>
                <div className="p-3 rounded-xl bg-neutral-50"><b className="text-neutral-700 text-xl">{fmt(actionCenter?.low)}</b><div className="text-[10px] text-neutral-500">Low</div></div>
                <div className="p-3 rounded-xl bg-blue-50"><b className="text-blue-700 text-xl">{fmt(summary?.redirects)}</b><div className="text-[10px] text-blue-600">Redirect فعال</div></div>
              </div>
            </Card>

            <Card title="آخرین پایش">
              {summary?.lastAudit ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>URL بررسی‌شده</span><b>{fmt(summary.lastAudit.scanned)}</b></div>
                  <div className="flex justify-between"><span>Issue شناسایی‌شده</span><b>{fmt(summary.lastAudit.issuesDetected)}</b></div>
                  <div className="text-[10px] text-neutral-400 ltr text-left">{summary.lastAudit.finishedAt}</div>
                </div>
              ) : <div className="text-xs text-neutral-500">هنوز پایش کامل اجرا نشده است.</div>}
            </Card>
          </div>

          <Card title="اولویت‌های فعلی">
            <div className="space-y-2">
              {(actionCenter?.items || []).slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${item.severity === 'high' || item.severity === 'critical' ? 'text-red-600' : item.severity === 'medium' ? 'text-amber-600' : 'text-neutral-400'}`} />
                  <div className="flex-1">
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10px] text-neutral-500 mt-1">{item.action || item.details}</div>
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-400">{item.severity}</span>
                </div>
              ))}
              {!actionCenter?.items?.length && <div className="text-xs text-neutral-500">Action باز مهمی وجود ندارد.</div>}
            </div>
          </Card>
        </div>
      )}

      {['content', 'links', 'ai'].includes(tab) && (
        <div className="grid lg:grid-cols-[330px_1fr] gap-4">
          <Card className="!p-4 h-fit">
            <div className="flex gap-2 mb-3">
              <select value={entityType} onChange={e => setEntityType(e.target.value)} className="p-2.5 border border-neutral-300 rounded-xl text-xs w-32">
                {Object.entries(entityTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-neutral-400" />
                <input
                  value={entityQuery}
                  onChange={e => setEntityQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void loadEntities()}
                  placeholder="جستجو..."
                  className="w-full py-2.5 pr-8 pl-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>
              <button onClick={() => void loadEntities()} className="p-2.5 bg-neutral-900 text-white rounded-xl"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="text-[10px] text-neutral-400 mb-2">{fmt(entityTotal)} مورد</div>
            <div className="max-h-[650px] overflow-y-auto space-y-1">
              {entities.map(item => (
                <button
                  key={item.type + ':' + item.id}
                  onClick={() => void openEntity(item)}
                  className={`w-full text-right p-3 rounded-xl border transition-colors ${selectedEntity?.id === item.id && selectedEntity?.type === item.type ? 'border-red-500 bg-red-50' : 'border-transparent hover:bg-neutral-50'}`}
                >
                  <div className="text-xs font-bold line-clamp-2">{item.title}</div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-neutral-400">
                    <span className="font-mono ltr truncate max-w-40">{item.url}</span>
                    <span className={`font-black ${Number(item.seo?.score || 0) >= 80 ? 'text-emerald-600' : Number(item.seo?.score || 0) >= 55 ? 'text-amber-600' : 'text-red-600'}`}>{item.seo?.score || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {!workspace && <Card><div className="py-20 text-center text-sm text-neutral-400">یک مورد را از ستون کناری انتخاب کنید.</div></Card>}

            {workspace && tab === 'content' && (
              <>
                <Card>
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    <ScoreRing score={workspace.analysis?.score || 0} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base">{workspace.entity.title}</h3>
                      <div className="text-[10px] text-neutral-400 font-mono ltr text-left mt-1">{workspace.entity.url}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                        <div className="p-2.5 rounded-xl bg-neutral-50 text-center"><b>{fmt(workspace.analysis?.wordCount)}</b><div className="text-[9px] text-neutral-400">کلمه</div></div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 text-center"><b>{workspace.analysis?.keywordDensity || 0}%</b><div className="text-[9px] text-neutral-400">تراکم</div></div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 text-center"><b>{fmt(workspace.analysis?.internalLinks)}</b><div className="text-[9px] text-neutral-400">لینک داخلی</div></div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 text-center"><b>{fmt(workspace.analysis?.imageCount)}</b><div className="text-[9px] text-neutral-400">تصویر / بدون ALT: {fmt(workspace.analysis?.missingImageAlt)}</div></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Workspace سئوی این URL">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="SEO Title" value={metaForm?.seoTitle} onChange={v => setMetaForm({ ...metaForm, seoTitle: v })} />
                    <Field label="Focus Keyword" value={metaForm?.focusKeyword} onChange={v => setMetaForm({ ...metaForm, focusKeyword: v })} />
                    <div className="md:col-span-2"><Field textarea label="Meta Description" value={metaForm?.metaDescription} onChange={v => setMetaForm({ ...metaForm, metaDescription: v })} /></div>
                    <Field label="Secondary Keywords (با , جدا کنید)" value={(metaForm?.secondaryKeywords || []).join(', ')} onChange={v => setMetaForm({ ...metaForm, secondaryKeywords: v.split(',').map((x: string) => x.trim()).filter(Boolean) })} />
                    <Field label="Canonical URL" dir="ltr" value={metaForm?.canonicalUrl} onChange={v => setMetaForm({ ...metaForm, canonicalUrl: v })} />
                    <Field label="OpenGraph Title" value={metaForm?.ogTitle} onChange={v => setMetaForm({ ...metaForm, ogTitle: v })} />
                    <Field label="OpenGraph Image" dir="ltr" value={metaForm?.ogImageUrl} onChange={v => setMetaForm({ ...metaForm, ogImageUrl: v })} />
                    <Field label="Breadcrumb Title" value={metaForm?.breadcrumbTitle} onChange={v => setMetaForm({ ...metaForm, breadcrumbTitle: v })} />
                    <label className="space-y-1.5"><span className="text-[11px] font-bold text-neutral-600">Schema Type</span><select value={metaForm?.schemaType || ''} onChange={e => setMetaForm({ ...metaForm, schemaType: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs">
                      {['Product','ProductGroup','Article','BlogPosting','TechArticle','NewsArticle','WebPage','CollectionPage','AboutPage','ContactPage','FAQPage'].map(x => <option key={x}>{x}</option>)}
                    </select></label>
                    <div className="grid grid-cols-1 gap-2">
                      <Toggle label="Index" checked={metaForm?.robotsIndex !== false} onChange={v => setMetaForm({ ...metaForm, robotsIndex: v })} />
                      <Toggle label="Follow" checked={metaForm?.robotsFollow !== false} onChange={v => setMetaForm({ ...metaForm, robotsFollow: v })} />
                      <Toggle label="Cornerstone" checked={Boolean(metaForm?.cornerstone)} onChange={v => setMetaForm({ ...metaForm, cornerstone: v })} />
                    </div>
                    <div className="md:col-span-2">
                      <Field
                        textarea
                        label="Hreflang — هر خط به شکل fa=https://... یا en=https://..."
                        dir="ltr"
                        value={(metaForm?.hreflang || []).map((row: any) => row.lang + '=' + row.url).join('\n')}
                        onChange={v => setMetaForm({
                          ...metaForm,
                          hreflang: v.split('\n').map(line => {
                            const i = line.indexOf('=');
                            return i > 0 ? { lang: line.slice(0, i).trim(), url: line.slice(i + 1).trim() } : null;
                          }).filter(Boolean)
                        })}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button onClick={() => void saveMeta()} disabled={busy === 'save-meta'} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black flex items-center gap-2">
                      {busy === 'save-meta' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} ذخیره و تحلیل مجدد
                    </button>
                    {['article','product'].includes(selectedEntity?.type) && (
                      <>
                        <button
                          onClick={() => void run('image-seo', () => api(
                            `/api/seo/entities/${selectedEntity.type}/${encodeURIComponent(selectedEntity.id)}/image-seo`,
                            { method: 'POST', body: '{}' }
                          ), 'ALT تصاویر فاقد متن بهینه شد.').then(() => openEntity(selectedEntity))}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                        >
                          <FileSearch className="w-4 h-4" /> Image SEO / ALT
                        </button>
                        <button
                          onClick={() => void run('toc', () => api(
                            `/api/seo/entities/${selectedEntity.type}/${encodeURIComponent(selectedEntity.id)}/toc`,
                            { method: 'POST', body: JSON.stringify({ apply: true }) }
                          ), 'فهرست مطالب هوشمند درج شد.').then(() => openEntity(selectedEntity))}
                          className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                        >
                          <ListChecks className="w-4 h-4" /> ساخت TOC
                        </button>
                      </>
                    )}
                  </div>
                </Card>

                <Card title="پیش‌نمایش نتیجه گوگل">
                  <div className="max-w-2xl ltr text-left">
                    <div className="text-sm text-neutral-700">{window.location.host} › ...</div>
                    <div className="text-xl text-blue-700 mt-1 truncate">{serpTitle}</div>
                    <div className="text-sm text-neutral-600 mt-1 line-clamp-2">{serpDesc}</div>
                  </div>
                </Card>

                <Card title="تحلیل قابل توضیح">
                  <div className="space-y-2">
                    {(workspace.analysis?.checks || []).map((check: any) => (
                      <div key={check.key} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center p-3 rounded-xl bg-neutral-50">
                        <div className={`text-xs font-black ${check.status === 'good' ? 'text-emerald-600' : check.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>{check.score}/{check.max}</div>
                        <div><div className="text-xs font-bold">{check.label}</div><div className="text-[10px] text-neutral-500">{check.detail}</div></div>
                        {check.status === 'good' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {workspace && tab === 'links' && (
              <>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-base">پیشنهادهای لینک داخلی</h3>
                      <p className="text-[10px] text-neutral-500 mt-1">فقط روابط Graph با امتیاز حداقل ۶۲ نمایش داده می‌شوند.</p>
                    </div>
                    <button onClick={() => void buildGraph()} className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Graph</button>
                  </div>
                </Card>
                <div className="space-y-2">
                  {linkSuggestions.map(item => (
                    <Card key={item.targetType + ':' + item.targetId} className="!p-4">
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="flex-1">
                          <div className="text-xs font-black">{item.title}</div>
                          <div className="text-[10px] text-neutral-400 font-mono ltr text-left">{item.url}</div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-700 text-[9px] font-bold">{item.targetType}</span>
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold">Score {item.score}</span>
                            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-bold">{item.confidence}</span>
                          </div>
                          {!!item.reasons?.length && <div className="text-[10px] text-neutral-500 mt-2">{item.reasons.join(' • ')}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => void run('link-text', () => api('/api/seo/links/apply', { method: 'POST', body: JSON.stringify({ sourceType: selectedEntity.type, sourceId: selectedEntity.id, targetType: item.targetType, targetId: item.targetId, anchor: item.anchor, mode: 'text' }) }), 'لینک متنی درج شد.').then(() => openEntity(selectedEntity))} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold">درج متنی</button>
                          <button onClick={() => void run('link-box', () => api('/api/seo/links/apply', { method: 'POST', body: JSON.stringify({ sourceType: selectedEntity.type, sourceId: selectedEntity.id, targetType: item.targetType, targetId: item.targetId, anchor: item.anchor, mode: 'box' }) }), 'باکس لینک درج شد.').then(() => openEntity(selectedEntity))} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-[10px] font-bold">باکس رنگی</button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {!linkSuggestions.length && <Card><div className="text-xs text-neutral-500">پیشنهاد معتبر وجود ندارد؛ Graph را بازسازی کنید یا Focus Keyword/محتوا را دقیق‌تر کنید.</div></Card>}
                </div>

                <Card title="Keyword → URL Map">
                  <p className="text-[10px] text-neutral-500 mb-3">
                    مالک اصلی یک عبارت را مشخص کنید تا Cannibalization و پیشنهاد لینک داخلی URL اشتباه نسازند.
                  </p>
                  <div className="grid md:grid-cols-[1fr_1.3fr_1fr_auto] gap-2">
                    <input
                      value={keywordOwnerForm.query}
                      onChange={e => setKeywordOwnerForm({ ...keywordOwnerForm, query: e.target.value })}
                      placeholder="کلمه کلیدی"
                      className="p-2.5 border border-neutral-300 rounded-xl text-xs"
                    />
                    <input
                      dir="ltr"
                      value={keywordOwnerForm.preferredUrl}
                      onChange={e => setKeywordOwnerForm({ ...keywordOwnerForm, preferredUrl: e.target.value })}
                      placeholder="/product/..."
                      className="p-2.5 border border-neutral-300 rounded-xl text-xs"
                    />
                    <input
                      value={keywordOwnerForm.note}
                      onChange={e => setKeywordOwnerForm({ ...keywordOwnerForm, note: e.target.value })}
                      placeholder="یادداشت"
                      className="p-2.5 border border-neutral-300 rounded-xl text-xs"
                    />
                    <button
                      onClick={() => void run('keyword-owner', () => api('/api/seo/keywords/owner', {
                        method: 'PUT',
                        body: JSON.stringify(keywordOwnerForm)
                      }), 'مالک عبارت ذخیره شد.').then(async () => {
                        const data = await api<any>('/api/seo/keywords');
                        setKeywordMap(data.items || []);
                      })}
                      className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold"
                    >
                      ذخیره
                    </button>
                  </div>
                  {workspace?.meta?.focusKeyword && (
                    <button
                      onClick={() => setKeywordOwnerForm({
                        query: workspace.meta.focusKeyword,
                        preferredUrl: workspace.entity.url,
                        note: 'مالک URL از Workspace'
                      })}
                      className="mt-2 text-[10px] text-blue-700 font-bold"
                    >
                      استفاده از Focus Keyword همین صفحه
                    </button>
                  )}
                  <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-neutral-100">
                    {keywordMap.map(row => (
                      <div key={row.id} className="grid md:grid-cols-[1fr_1.5fr_1fr] gap-2 py-2 text-[10px]">
                        <b>{row.query}</b>
                        <span className="font-mono ltr text-left truncate">{row.preferredUrl}</span>
                        <span className="text-neutral-500">{row.note || row.ownerSource}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {workspace && tab === 'ai' && (
              <>
                <Card title="AI SEO Studio">
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-neutral-50"><div className="text-[9px] text-neutral-400">Provider</div><b className="text-xs uppercase">{integrations?.aiProvider}</b></div>
                    <div className="p-3 rounded-xl bg-neutral-50"><div className="text-[9px] text-neutral-400">Model</div><b className="text-xs">{integrations?.aiModel}</b></div>
                    <div className="p-3 rounded-xl bg-neutral-50"><div className="text-[9px] text-neutral-400">API Key</div><b className={`text-xs ${integrations?.aiApiKey ? 'text-emerald-600' : 'text-red-600'}`}>{integrations?.aiApiKey ? 'تنظیم شده' : 'تنظیم نشده'}</b></div>
                  </div>
                  <Field textarea label="دستور اختصاصی این اجرا" value={aiInstructions} onChange={setAiInstructions} placeholder="مثلاً: تمرکز روی شماره فنی، علائم خرابی و تطبیق خودرو؛ هیچ ادعای بدون منبع نساز." />
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => void runAi('optimize')} disabled={busy === 'ai'} className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black flex items-center gap-2"><WandSparkles className="w-4 h-4" /> بهینه‌سازی</button>
                    <button onClick={() => void runAi('generate')} disabled={busy === 'ai'} className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> تولید کامل</button>
                    <button onClick={() => void runAi('repair')} disabled={busy === 'ai'} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Repair</button>
                  </div>
                </Card>
                {aiPackage && (
                  <Card title="خروجی آماده بررسی">
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <Field label="SEO Title" value={aiPackage.seoTitle} onChange={v => setAiPackage({ ...aiPackage, seoTitle: v })} />
                        <Field label="Primary Keyword" value={aiPackage.primaryKeyword} onChange={v => setAiPackage({ ...aiPackage, primaryKeyword: v })} />
                      </div>
                      <Field textarea label="Meta Description" value={aiPackage.metaDescription} onChange={v => setAiPackage({ ...aiPackage, metaDescription: v })} />
                      <Field textarea label="Short Description" value={aiPackage.shortDescription} onChange={v => setAiPackage({ ...aiPackage, shortDescription: v })} />
                      <div>
                        <div className="text-[11px] font-bold text-neutral-600 mb-1.5">محتوای HTML تولیدشده</div>
                        <textarea dir="rtl" rows={14} value={aiPackage.contentHtml || ''} onChange={e => setAiPackage({ ...aiPackage, contentHtml: e.target.value })} className="w-full p-3 border border-neutral-300 rounded-xl text-xs font-mono" />
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-[10px]">
                        لینک‌های داخلی فقط از URLهای مجاز گراف معنایی پذیرفته می‌شوند. AI نمی‌تواند URL داخلی جعلی بسازد.
                      </div>
                      <button onClick={() => void applyAi()} disabled={busy === 'ai-apply'} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2"><Check className="w-4 h-4" /> تأیید و اعمال روی سایت</button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {['critical','high','medium','low'].map(level => (
              <Card key={level} className="!p-4"><div className="text-[10px] uppercase text-neutral-400">{level}</div><div className="text-2xl font-black">{fmt(actionCenter?.[level])}</div></Card>
            ))}
          </div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-black text-sm">Issues باز</h3><p className="text-[10px] text-neutral-500">قابل Ignore، Snooze، Resolve و Verify</p></div>
              <button onClick={() => void doAudit()} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">اجرای Audit</button>
            </div>
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.id} className="p-3 border border-neutral-200 rounded-xl flex flex-col lg:flex-row gap-3 lg:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${issue.severity === 'high' || issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-amber-500' : 'bg-neutral-400'}`} /><b className="text-xs">{issue.title}</b></div>
                    <div className="text-[10px] text-neutral-500 mt-1">{issue.details}</div>
                    <div className="text-[10px] text-blue-700 mt-1">{issue.action}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => void run('verify', () => api(`/api/seo/issues/${issue.id}/verify`, { method: 'POST', body: '{}' }), 'Issue دوباره بررسی شد.').then(loadAudit)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-bold">Verify</button>
                    <button onClick={() => void run('snooze', () => api(`/api/seo/issues/${issue.id}/state`, { method: 'PATCH', body: JSON.stringify({ state: 'snoozed', snoozeHours: 168 }) }), 'یک هفته Snooze شد.').then(loadAudit)} className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-bold">Snooze</button>
                    <button onClick={() => void run('resolve', () => api(`/api/seo/issues/${issue.id}/state`, { method: 'PATCH', body: JSON.stringify({ state: 'resolved' }) }), 'Resolve شد.').then(loadAudit)} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold">Resolve</button>
                  </div>
                </div>
              ))}
              {!issues.length && <div className="text-xs text-neutral-500 py-8 text-center">Issue بازی ثبت نشده است.</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'schema' && (
        <Card>
          <div className="flex justify-between items-center mb-4"><div><h3 className="font-black text-sm">پایش داده‌های ساختاریافته</h3><p className="text-[10px] text-neutral-500">بررسی mapping محصول، مقاله، صفحات و آرشیوها</p></div><button onClick={() => void loadTabData('schema')} className="p-2 rounded-xl bg-neutral-100"><RefreshCw className="w-4 h-4" /></button></div>
          <div className="space-y-2">
            {schemaIssues.map(item => (
              <div key={item.entityType + ':' + item.entityId} className="p-3 rounded-xl border border-neutral-200 flex items-center gap-3">
                <Code2 className="w-4 h-4 text-violet-600" />
                <div className="flex-1"><b className="text-xs">{item.title}</b><div className="text-[10px] text-neutral-500">{item.actual} → {item.expected}</div></div>
                <button onClick={() => void run('schema-fix', () => api('/api/seo/schema/repair', { method: 'POST', body: JSON.stringify({ entityType: item.entityType, entityId: item.entityId }) }), 'Schema اصلاح شد.').then(() => loadTabData('schema'))} className="px-3 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-bold">اصلاح امن</button>
              </div>
            ))}
            {!schemaIssues.length && <div className="p-8 text-center text-xs text-emerald-600 font-bold">Mapping ناسازگاری پیدا نشد.</div>}
          </div>
        </Card>
      )}

      {tab === 'indexing' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="نقشه سایت و Robots">
            <div className="space-y-3">
              <Toggle label="نقشه سایت فعال" checked={settings.modules.sitemap} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, sitemap: v } })} />
              <Toggle label="درج تصاویر در نقشه سایت" checked={settings.sitemap.includeImages} onChange={v => setSettings({ ...settings, sitemap: { ...settings.sitemap, includeImages: v } })} />
              <Toggle label="نقشه سایت HTML" checked={settings.sitemap.htmlEnabled} onChange={v => setSettings({ ...settings, sitemap: { ...settings.sitemap, htmlEnabled: v } })} />
              <Field label="اندازه هر بخش نقشه سایت" type="number" value={settings.sitemap.chunkSize} onChange={v => setSettings({ ...settings, sitemap: { ...settings.sitemap, chunkSize: Number(v) } })} />
              <Field textarea label="Robots rules اضافه" dir="ltr" value={settings.robots.extraRules} onChange={v => setSettings({ ...settings, robots: { ...settings.robots, extraRules: v } })} />
              <div className="flex gap-2 flex-wrap">
                <a target="_blank" rel="noreferrer" href="/sitemap.xml" className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-[10px] font-bold">XML Sitemap</a>
                <a target="_blank" rel="noreferrer" href="/sitemap.html" className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-800 text-[10px] font-bold">نقشه سایت HTML</a>
                <a target="_blank" rel="noreferrer" href="/robots.txt" className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-800 text-[10px] font-bold">robots.txt</a>
              </div>
            </div>
          </Card>
          <Card title="IndexNow">
            <div className="space-y-3">
              <Toggle label="IndexNow فعال" checked={settings.indexNow.enabled} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, indexNow: v }, indexNow: { ...settings.indexNow, enabled: v } })} desc="پس از فعال‌سازی Key به‌طور امن تولید می‌شود." />
              <Field label="IndexNow Key" dir="ltr" value={settings.indexNow.key} onChange={v => setSettings({ ...settings, indexNow: { ...settings.indexNow, key: v } })} />
              <button onClick={() => void run('indexnow', () => api('/api/seo/indexnow', { method: 'POST', body: JSON.stringify({ urls: [window.location.origin] }) }), 'صفحه اصلی برای IndexNow ارسال شد.')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Zap className="w-4 h-4" /> ارسال صفحه اصلی</button>
            </div>
          </Card>
          <div className="lg:col-span-2 flex justify-end"><button onClick={() => void saveSettings()} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black"><Save className="inline w-4 h-4 ml-1" /> ذخیره</button></div>
        </div>
      )}

      {tab === 'redirects' && (
        <div className="space-y-4">
          <Card title="افزودن ریدایرکت">
            <div className="grid md:grid-cols-5 gap-2">
              <input dir="ltr" value={redirectForm.source} onChange={e => setRedirectForm({ ...redirectForm, source: e.target.value })} placeholder="/old-url" className="p-3 border rounded-xl text-xs md:col-span-2" />
              <input dir="ltr" value={redirectForm.target} onChange={e => setRedirectForm({ ...redirectForm, target: e.target.value })} placeholder="/new-url" className="p-3 border rounded-xl text-xs md:col-span-2" />
              <select value={redirectForm.statusCode} onChange={e => setRedirectForm({ ...redirectForm, statusCode: Number(e.target.value) })} className="p-3 border rounded-xl text-xs">{[301,302,307,308,410].map(x => <option key={x}>{x}</option>)}</select>
            </div>
            <div className="flex gap-2 mt-2"><select value={redirectForm.matchType} onChange={e => setRedirectForm({ ...redirectForm, matchType: e.target.value })} className="p-2 border rounded-xl text-xs"><option value="exact">Exact</option><option value="regex">Regex</option></select><button onClick={() => void run('redirect-add', () => api('/api/seo/redirects', { method: 'POST', body: JSON.stringify(redirectForm) }), 'Redirect ذخیره شد.').then(() => loadTabData('redirects'))} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">ذخیره ریدایرکت</button></div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="مدیریت ریدایرکت‌ها">
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {redirects.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-50 border flex gap-2 items-center">
                    <div className="flex-1 min-w-0"><div className="font-mono text-[10px] ltr text-left truncate">{item.source}</div><div className="font-mono text-[10px] ltr text-left text-blue-600 truncate">{item.statusCode} → {item.target}</div><div className="text-[9px] text-neutral-400">Hits: {fmt(item.hits)}</div></div>
                    <button onClick={() => void run('redirect-del', () => api(`/api/seo/redirects/${item.id}`, { method: 'DELETE' })).then(() => loadTabData('redirects'))} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="404 Monitor">
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {errors404.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-50 border">
                    <div className="flex justify-between gap-2"><div className="font-mono text-[10px] ltr text-left truncate">{item.url}</div><b className="text-xs">{fmt(item.hits)}</b></div>
                    <div className="text-[9px] text-neutral-400 mt-1">{item.classification}</div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => void run('404-ignore', () => api(`/api/seo/404/${item.id}`, { method: 'PATCH', body: JSON.stringify({ decision: 'ignore' }) })).then(() => loadTabData('redirects'))} className="px-2 py-1 bg-neutral-200 rounded text-[9px]">Ignore</button>
                      <button onClick={() => void run('404-resolve', () => api(`/api/seo/404/${item.id}`, { method: 'PATCH', body: JSON.stringify({ decision: 'resolved' }) })).then(() => loadTabData('redirects'))} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px]">Resolved</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'gsc' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div><h3 className="font-black text-sm">سرچ کنسول گوگل</h3><p className="text-[10px] text-neutral-500">{integrations?.gscConnected ? 'اتصال فعال' : 'هنوز متصل نشده'}</p></div>
              <div className="flex gap-2">
                <button onClick={() => void run('gsc-auth', async () => { const data = await api<any>('/api/seo/gsc/auth-url'); window.location.href = data.url; return data; })} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">اتصال به گوگل</button>
                <button onClick={() => void run('gsc-sync', () => api('/api/seo/gsc/sync', { method: 'POST', body: JSON.stringify({ days: 28 }) }), 'GSC سینک شد.').then(async () => setGsc(await api('/api/seo/gsc/overview?days=28')))} className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold">Sync 28d</button>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="!p-4"><div className="text-[9px] text-neutral-400">Clicks</div><b className="text-xl">{fmt(gsc?.summary?.clicks)}</b></Card>
            <Card className="!p-4"><div className="text-[9px] text-neutral-400">Impressions</div><b className="text-xl">{fmt(gsc?.summary?.impressions)}</b></Card>
            <Card className="!p-4"><div className="text-[9px] text-neutral-400">CTR</div><b className="text-xl">{pct(gsc?.summary?.ctr)}</b></Card>
            <Card className="!p-4"><div className="text-[9px] text-neutral-400">Position</div><b className="text-xl">{Number(gsc?.summary?.position || 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}</b></Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="عبارت‌های جستجوی برتر">
              <div className="max-h-96 overflow-y-auto">{(gsc?.queries || []).slice(0, 50).map((row: any, i: number) => <button key={i} onClick={() => { setGscQuery(row.query); }} className="w-full grid grid-cols-[1fr_60px_70px] gap-2 p-2 text-[10px] border-b hover:bg-neutral-50 text-right"><span className="truncate">{row.query}</span><b>{fmt(row.clicks)}</b><span>{Number(row.position || 0).toFixed(1)}</span></button>)}</div>
            </Card>
            <Card title="صفحات برتر">
              <div className="max-h-96 overflow-y-auto">{(gsc?.pages || []).slice(0, 50).map((row: any, i: number) => <div key={i} className="grid grid-cols-[1fr_60px_70px] gap-2 p-2 text-[10px] border-b"><span className="font-mono ltr text-left truncate">{row.page}</span><b>{fmt(row.clicks)}</b><span>{Number(row.position || 0).toFixed(1)}</span></div>)}</div>
            </Card>
          </div>
          <Card title="Query Inspector / Cannibalization">
            <div className="flex gap-2"><input value={gscQuery} onChange={e => setGscQuery(e.target.value)} className="flex-1 p-3 border rounded-xl text-xs" placeholder="عبارت جستجو..." /><button onClick={() => void run('gsc-query', async () => { const data = await api<any>('/api/seo/gsc/query?q=' + encodeURIComponent(gscQuery) + '&days=28'); setGscInspector(data); return data; })} className="px-4 bg-red-600 text-white rounded-xl text-xs font-bold">تحلیل</button></div>
            {gscInspector && <div className="mt-4 grid md:grid-cols-2 gap-3"><div className="p-3 bg-neutral-50 rounded-xl"><b className="text-xs">صفحات فرود</b>{(gscInspector.landingPages || []).map((x: any, i: number) => <div key={i} className="text-[10px] mt-2 font-mono ltr text-left truncate">{x.page} — {x.clicks} clicks</div>)}</div><div className="p-3 bg-neutral-50 rounded-xl"><b className="text-xs">محتواهای مرتبط</b>{(gscInspector.contentMatches || []).slice(0,10).map((x: any, i: number) => <div key={i} className="text-[10px] mt-2">{x.title} — {x.occurrences}</div>)}</div></div>}
          </Card>
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-4">
          <Card title="بررسی سرعت صفحات">
            <div className="flex flex-col md:flex-row gap-2">
              <input dir="ltr" value={performanceUrl} onChange={e => setPerformanceUrl(e.target.value)} className="flex-1 p-3 border rounded-xl text-xs" />
              <select value={performanceStrategy} onChange={e => setPerformanceStrategy(e.target.value as any)} className="p-3 border rounded-xl text-xs"><option value="mobile">Mobile</option><option value="desktop">Desktop</option></select>
              <button onClick={() => void run('psi', async () => { const data = await api<any>('/api/seo/performance/check', { method: 'POST', body: JSON.stringify({ url: performanceUrl, strategy: performanceStrategy }) }); setPerformanceReport(data.report); setPerformance((await api<any>('/api/seo/performance/history?limit=60')).items || []); return data; })} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">تست واقعی</button>
            </div>
            {performanceReport && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">{Object.entries(performanceReport.categories || {}).map(([k,v]) => <div key={k} className="p-3 bg-neutral-50 rounded-xl text-center"><b className="text-xl">{String(v)}</b><div className="text-[9px] text-neutral-400">{k}</div></div>)}</div>}
            {performanceReport?.metrics && <div className="flex gap-2 flex-wrap mt-3">{Object.entries(performanceReport.metrics).map(([k,v]) => <span key={k} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px]">{k}: {String(v || '-')}</span>)}</div>}
          </Card>
          <Card title="بازرسی امن URL">
            <div className="flex gap-2"><input dir="ltr" value={inspectUrl} onChange={e => setInspectUrl(e.target.value)} className="flex-1 p-3 border rounded-xl text-xs" /><button onClick={() => void run('inspect', async () => { const data = await api<any>('/api/seo/inspect', { method: 'POST', body: JSON.stringify({ url: inspectUrl }) }); setInspectResult(data.result); return data; })} className="px-4 bg-neutral-900 text-white rounded-xl text-xs font-bold">Inspect</button></div>
            {inspectResult && <div className="grid md:grid-cols-2 gap-3 mt-4 text-[10px]"><div className="p-3 bg-neutral-50 rounded-xl space-y-1"><div>Status: <b>{inspectResult.status}</b></div><div>Title: {inspectResult.title}</div><div>Canonical: <span className="font-mono ltr">{inspectResult.canonical}</span></div><div>Robots: {inspectResult.robots}</div></div><div className="p-3 bg-neutral-50 rounded-xl space-y-1"><div>H1: {(inspectResult.h1 || []).join(' | ')}</div><div>Schema blocks: {fmt(inspectResult.schemas?.length)}</div><div>Images: {fmt(inspectResult.images?.length)}</div><div>HTML: {fmt(inspectResult.htmlBytes)} bytes</div></div></div>}
          </Card>
          <Card title="تاریخچه سرعت">
            <div className="overflow-x-auto"><table className="w-full text-[10px]"><thead><tr className="text-neutral-400"><th className="p-2 text-right">URL</th><th>Device</th><th>Score</th><th>زمان</th></tr></thead><tbody>{performance.map(item => <tr key={item.id} className="border-t"><td className="p-2 font-mono ltr text-left max-w-96 truncate">{item.url}</td><td>{item.strategy}</td><td className="font-black">{item.averageScore}</td><td>{new Date(item.createdAt).toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>
          </Card>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <Card title="هویت و سئوی عمومی سایت">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="نام سایت" value={settings.global.siteTitle} onChange={v => setSettings({ ...settings, global: { ...settings.global, siteTitle: v } })} />
              <Field label="شعار سایت" value={settings.global.siteSlogan} onChange={v => setSettings({ ...settings, global: { ...settings.global, siteSlogan: v } })} />
              <Field label="Meta Title صفحه اصلی" value={settings.global.metaTitle} onChange={v => setSettings({ ...settings, global: { ...settings.global, metaTitle: v } })} />
              <Field label="Canonical صفحه اصلی" dir="ltr" value={settings.global.canonicalUrl} onChange={v => setSettings({ ...settings, global: { ...settings.global, canonicalUrl: v } })} />
              <div className="md:col-span-2"><Field textarea label="Meta Description صفحه اصلی" value={settings.global.metaDescription} onChange={v => setSettings({ ...settings, global: { ...settings.global, metaDescription: v } })} /></div>
              <Field label="Meta Keywords" value={settings.global.metaKeywords} onChange={v => setSettings({ ...settings, global: { ...settings.global, metaKeywords: v } })} />
              <Field label="OpenGraph Image" dir="ltr" value={settings.global.ogImageUrl} onChange={v => setSettings({ ...settings, global: { ...settings.global, ogImageUrl: v } })} />
              <Field label="Product title template" value={settings.global.productTitleTemplate} onChange={v => setSettings({ ...settings, global: { ...settings.global, productTitleTemplate: v } })} />
              <Field label="Article title template" value={settings.global.articleTitleTemplate} onChange={v => setSettings({ ...settings, global: { ...settings.global, articleTitleTemplate: v } })} />
            </div>
          </Card>

          <Card title="ماژول‌ها">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(settings.modules).map(([key, value]) => <Toggle key={key} label={key} checked={Boolean(value)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, [key]: v } })} />)}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="امتیازدهی محتوا">
              <div className="grid grid-cols-2 gap-3">
                <Field label="حداقل کلمات مقاله" type="number" value={settings.scoring.articleMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, articleMinimumWords: Number(v) } })} />
                <Field label="حداقل کلمات محصول" type="number" value={settings.scoring.productMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, productMinimumWords: Number(v) } })} />
                <Field label="حداقل کلمات برگه" type="number" value={settings.scoring.pageMinimumWords} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, pageMinimumWords: Number(v) } })} />
                <Field label="حداقل تراکم %" type="number" value={settings.scoring.densityMin} onChange={v => setSettings({ ...settings, scoring: { ...settings.scoring, densityMin: Number(v) } })} />
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                <div className="text-xs font-black text-neutral-800">فهرست مطالب</div>
                <Toggle label="TOC خودکار فعال" checked={Boolean(settings.toc.enabled)} onChange={v => setSettings({ ...settings, modules: { ...settings.modules, toc: v }, toc: { ...settings.toc, enabled: v } })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="حداقل تعداد Heading" type="number" value={settings.toc.minimumHeadings} onChange={v => setSettings({ ...settings, toc: { ...settings.toc, minimumHeadings: Number(v) } })} />
                  <Field label="حداقل تعداد کلمه" type="number" value={settings.toc.minimumWords} onChange={v => setSettings({ ...settings, toc: { ...settings.toc, minimumWords: Number(v) } })} />
                </div>
                <Toggle label="TOC به‌صورت جمع‌شده" checked={Boolean(settings.toc.collapsed)} onChange={v => setSettings({ ...settings, toc: { ...settings.toc, collapsed: v } })} />
              </div>
            </Card>
            <Card title="سئوی محلی و هویت کسب‌وکار">
              <div className="grid grid-cols-2 gap-3">
                <Field label="نام سازمان" value={settings.identity.organizationName} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, organizationName: v } })} />
                <Field label="نوع" value={settings.identity.organizationType} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, organizationType: v } })} />
                <Field label="تلفن" dir="ltr" value={settings.identity.phone} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, phone: v } })} />
                <Field label="ایمیل" dir="ltr" value={settings.identity.email} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, email: v } })} />
                <Field label="شهر" value={settings.identity.city} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, city: v } })} />
                <Field label="استان" value={settings.identity.region} onChange={v => setSettings({ ...settings, identity: { ...settings.identity, region: v } })} />
              </div>
            </Card>
          </div>

          <Card title="هوش مصنوعی، سرچ کنسول و سرعت">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-1.5"><span className="text-[11px] font-bold text-neutral-600">ارائه‌دهنده هوش مصنوعی</span><select value={integrations.aiProvider} onChange={e => setIntegrations({ ...integrations, aiProvider: e.target.value })} className="w-full p-3 border rounded-xl text-xs"><option value="gemini">Gemini</option><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option></select></label>
              <Field label="مدل هوش مصنوعی" dir="ltr" value={integrations.aiModel} onChange={v => setIntegrations({ ...integrations, aiModel: v })} />
              <Field label="کلید API هوش مصنوعی" type="password" dir="ltr" value={integrations.aiApiKey} onChange={v => setIntegrations({ ...integrations, aiApiKey: v })} placeholder="کلید جدید یا ••••••••" />
              <Field label="کلید API سرعت" type="password" dir="ltr" value={integrations.pageSpeedApiKey} onChange={v => setIntegrations({ ...integrations, pageSpeedApiKey: v })} />
              <Field label="GSC Client ID" dir="ltr" value={integrations.gscClientId} onChange={v => setIntegrations({ ...integrations, gscClientId: v })} />
              <Field label="GSC Client Secret" type="password" dir="ltr" value={integrations.gscClientSecret} onChange={v => setIntegrations({ ...integrations, gscClientSecret: v })} />
              <div className="md:col-span-2"><Field label="GSC Property (مثال sc-domain:yadak.store)" dir="ltr" value={integrations.gscProperty} onChange={v => setIntegrations({ ...integrations, gscProperty: v })} /></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={() => void saveSettings()} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black">ذخیره تنظیمات سئو</button><button onClick={() => void saveIntegrations()} className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-black">ذخیره اتصال‌ها</button></div>
          </Card>
        </div>
      )}

      {tab === 'diagnostics' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card title="سلامت سیستم">
              <div className="text-xs space-y-2"><div className="flex justify-between"><span>وضعیت</span><b className={health?.ok ? 'text-emerald-600' : 'text-red-600'}>{health?.ok ? 'OK' : 'ERROR'}</b></div><div className="flex justify-between"><span>App URL</span><span className="font-mono text-[9px]">{health?.appUrl}</span></div>{(health?.tables || []).map((x: any) => <div key={x.table} className="flex justify-between text-[10px]"><span>{x.table}</span><span className={x.ok ? 'text-emerald-600' : 'text-red-600'}>{x.ok ? '✓' : '×'}</span></div>)}</div>
            </Card>
            <Card title="خودآزمایی">
              <button onClick={() => void run('self-test', async () => { const data = await api<any>('/api/seo/self-test', { method: 'POST', body: '{}' }); setSelfTest(data); return data; })} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold mb-3">اجرای خودآزمایی</button>
              {(selfTest?.checks || []).map((x: any) => <div key={x.key} className="flex gap-2 items-center text-[10px] p-2 border-b"><span className={x.ok ? 'text-emerald-600' : 'text-amber-600'}>{x.ok ? '✓' : '!'}</span><b>{x.key}</b><span className="text-neutral-500 truncate">{x.detail}</span></div>)}
            </Card>
            <Card title="صف پردازش">
              <div className="max-h-72 overflow-y-auto">{jobs.map(job => <div key={job.id} className="p-2 border-b text-[10px] flex justify-between"><span>{job.jobType}</span><b className={job.status === 'completed' ? 'text-emerald-600' : job.status === 'failed' ? 'text-red-600' : 'text-amber-600'}>{job.status}</b></div>)}</div>
            </Card>
          </div>
          <Card>
            <div className="flex justify-between items-center mb-3"><h3 className="font-black text-sm">لاگ زمان اجرا</h3><button onClick={() => void run('log-clear', () => api('/api/seo/diagnostics/logs', { method: 'DELETE' }), 'لاگ پاک شد.').then(() => setLogs([]))} className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-bold">پاک کردن</button></div>
            <div className="max-h-80 overflow-auto bg-neutral-950 text-neutral-300 rounded-2xl p-3 font-mono text-[9px] ltr text-left">{logs.map(row => <div key={row.id} className="py-1 border-b border-neutral-800"><span className="text-neutral-500">{row.createdAt}</span> <span className={row.level === 'error' ? 'text-red-400' : 'text-blue-400'}>{row.level}</span> {row.eventName} {JSON.stringify(row.context)}</div>)}</div>
          </Card>
          <Card title="تاریخچه">
            <div className="max-h-80 overflow-y-auto">{history.map(row => <div key={row.id} className="grid grid-cols-[150px_1fr_120px] gap-2 p-2 border-b text-[10px]"><span className="font-mono">{row.action}</span><span>{row.entityType || '-'} / {row.entityId || '-'}</span><span>{new Date(row.createdAt).toLocaleString('fa-IR')}</span></div>)}</div>
          </Card>
        </div>
      )}

      {tab !== 'settings' && ['indexing'].indexOf(tab) === -1 && (
        <div className="text-[9px] text-neutral-400 text-center">
          TakRank SEO Native — داده‌های SEO از دیتابیس و Backend خود yadak.store خوانده و اعمال می‌شوند.
        </div>
      )}
    </div>
  );
};
