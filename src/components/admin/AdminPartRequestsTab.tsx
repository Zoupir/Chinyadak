import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  MessageSquareText,
  Phone,
  RefreshCw,
  Save,
  Search,
  Wrench
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PartRequest } from '../../types';

const STATUS_OPTIONS: PartRequest['status'][] = [
  'جدید',
  'در حال بررسی',
  'قیمت اعلام شد',
  'منتظر پاسخ مشتری',
  'پاسخ داده شد',
  'تبدیل به سفارش',
  'بسته شد',
  'ناموجود',
  'ناموجود در گمرک'
];

const normalized = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('fa-IR');

interface ResponseDraft {
  status: PartRequest['status'];
  quotedPrice: string;
  currency: string;
  estimatedDelivery: string;
  responseText: string;
  adminNote: string;
}

const responseFrom = (request: PartRequest): ResponseDraft => ({
  status: request.status,
  quotedPrice: request.quotedPrice != null ? String(request.quotedPrice) : '',
  currency: request.currency || 'تومان',
  estimatedDelivery: request.estimatedDelivery || '',
  responseText: request.responseText || '',
  adminNote: request.adminNote || ''
});

export const AdminPartRequestsTab: React.FC = () => {
  const {
    partRequests,
    refreshAdminEngagement,
    updatePartRequest,
    showToast
  } = useStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PartRequest['status']>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, ResponseDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const ok = await refreshAdminEngagement();
      if (ok) setLastRefreshAt(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      if (!quiet) setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const needle = normalized(query);
    return partRequests.filter(request => {
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        request.partName,
        request.oemNumber,
        request.vin,
        request.fullName,
        request.phoneNumber,
        request.carBrand,
        request.carModel,
        request.year,
        request.notes,
        request.responseText,
        request.adminNote
      ].some(value => normalized(value).includes(needle));
    });
  }, [partRequests, query, statusFilter]);

  const newCount = partRequests.filter(request => request.status === 'جدید').length;
  const waitingCount = partRequests.filter(request => ['جدید', 'در حال بررسی'].includes(request.status)).length;
  const answeredCount = partRequests.filter(request => ['قیمت اعلام شد', 'پاسخ داده شد', 'منتظر پاسخ مشتری'].includes(request.status)).length;

  const openDetails = (request: PartRequest) => {
    setExpandedId(current => current === request.id ? null : request.id);
    setResponseDrafts(current => current[request.id] ? current : { ...current, [request.id]: responseFrom(request) });
  };

  const patchDraft = (id: string, patch: Partial<ResponseDraft>) => {
    setResponseDrafts(current => ({
      ...current,
      [id]: { ...(current[id] || responseFrom(partRequests.find(item => item.id === id)!)), ...patch }
    }));
  };

  const saveResponse = async (request: PartRequest) => {
    const draft = responseDrafts[request.id] || responseFrom(request);
    setSavingId(request.id);
    try {
      const ok = await updatePartRequest(request.id, {
        status: draft.status,
        quotedPrice: draft.quotedPrice.trim() ? Number(draft.quotedPrice.replace(/,/g, '')) : undefined,
        currency: draft.currency.trim() || 'تومان',
        estimatedDelivery: draft.estimatedDelivery.trim(),
        responseText: draft.responseText.trim(),
        adminNote: draft.adminNote.trim()
      });
      if (ok) showToast('پاسخ و اطلاعات استعلام ذخیره شد.');
    } finally {
      setSavingId(null);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} کپی شد.`, 'info');
    } catch {
      showToast('کپی خودکار انجام نشد.', 'error');
    }
  };

  return (
    <section className="space-y-5" data-admin-part-requests="1">
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-neutral-900">مرکز مدیریت استعلام قطعه</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">ثبت‌های واقعی دیتابیس، پاسخ کارشناسی، قیمت پیشنهادی، زمان تامین، یادداشت داخلی و وضعیت پیگیری در همین بخش مدیریت می‌شوند.</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تازه‌سازی از سرور
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-neutral-50 p-4"><span className="text-[10px] text-neutral-500">کل استعلام‌ها</span><strong className="mt-1 block text-xl font-black">{partRequests.length.toLocaleString('fa-IR')}</strong></div>
          <div className="rounded-2xl bg-blue-50 p-4"><span className="text-[10px] text-blue-700">جدید</span><strong className="mt-1 block text-xl font-black text-blue-800">{newCount.toLocaleString('fa-IR')}</strong></div>
          <div className="rounded-2xl bg-amber-50 p-4"><span className="text-[10px] text-amber-700">نیازمند پیگیری</span><strong className="mt-1 block text-xl font-black text-amber-800">{waitingCount.toLocaleString('fa-IR')}</strong></div>
          <div className="rounded-2xl bg-emerald-50 p-4"><span className="text-[10px] text-emerald-700">پاسخ/قیمت اعلام‌شده</span><strong className="mt-1 block text-xl font-black text-emerald-800">{answeredCount.toLocaleString('fa-IR')}</strong></div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-10 pl-3 text-xs outline-none focus:border-red-500"
              placeholder="جستجو در قطعه، OEM، VIN، خودرو، نام، موبایل، پاسخ یا یادداشت داخلی..."
            />
          </label>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as 'all' | PartRequest['status'])}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold"
          >
            <option value="all">همه وضعیت‌ها</option>
            {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        {lastRefreshAt && <p className="mt-2 text-[9px] text-neutral-400">آخرین دریافت موفق از سرور: {lastRefreshAt}</p>}
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-xs text-right">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3">تاریخ</th>
                <th className="p-3">قطعه</th>
                <th className="p-3">خودرو</th>
                <th className="p-3">متقاضی</th>
                <th className="p-3">OEM / VIN</th>
                <th className="p-3">تصویر</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(request => {
                const draft = responseDrafts[request.id] || responseFrom(request);
                return (
                  <React.Fragment key={request.id}>
                    <tr className="align-top hover:bg-neutral-50/70">
                      <td className="p-3 whitespace-nowrap text-neutral-500"><span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{request.createdAt}</span>{request.updatedAt && <span className="mt-1 block text-[9px] text-neutral-400">ویرایش: {request.updatedAt}</span>}</td>
                      <td className="p-3"><strong className="block max-w-[240px] text-neutral-900">{request.partName}</strong>{request.notes && <span className="mt-1 block max-w-[240px] truncate text-[10px] text-neutral-400">{request.notes}</span>}</td>
                      <td className="p-3"><strong>{request.carBrand || '—'} {request.carModel || ''}</strong><span className="block mt-1 text-[10px] text-neutral-400">{request.year || 'سال نامشخص'}</span></td>
                      <td className="p-3"><strong className="block">{request.fullName}</strong><div className="mt-1 flex items-center gap-1"><a className="inline-flex items-center gap-1 font-mono text-blue-700" href={`tel:${request.phoneNumber}`}><Phone className="w-3.5 h-3.5" />{request.phoneNumber}</a><button type="button" onClick={() => void copyText(request.phoneNumber, 'شماره تماس')} className="p-1 text-neutral-400 hover:text-neutral-700" title="کپی شماره"><Copy className="w-3 h-3" /></button></div></td>
                      <td className="p-3 font-mono text-[10px]"><span className="block">OEM: {request.oemNumber || '—'}</span><span className="block mt-1">VIN: {request.vin || '—'}</span></td>
                      <td className="p-3">
                        {request.imageUrl ? (
                          <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 font-bold">
                            <ImageIcon className="w-4 h-4" /> مشاهده <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-neutral-400">ندارد</span>}
                      </td>
                      <td className="p-3"><span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-black">{request.status}</span></td>
                      <td className="p-3"><button type="button" onClick={() => openDetails(request)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[10px] font-bold text-white">{expandedId === request.id ? 'بستن' : 'بررسی و پاسخ'}</button></td>
                    </tr>
                    {expandedId === request.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="p-4 sm:p-5">
                          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
                            <div className="space-y-4">
                              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-[11px] leading-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                  <p><strong>شناسه:</strong> <span className="font-mono text-[9px]">{request.id}</span></p>
                                  <p><strong>موبایل:</strong> <a href={`tel:${request.phoneNumber}`} className="font-mono text-blue-700">{request.phoneNumber}</a></p>
                                  <p><strong>خودرو:</strong> {[request.carBrand, request.carModel, request.year].filter(Boolean).join(' — ') || 'ثبت نشده'}</p>
                                  <p><strong>شماره فنی:</strong> {request.oemNumber || 'ثبت نشده'}</p>
                                  <p className="md:col-span-2"><strong>VIN:</strong> <span className="font-mono">{request.vin || 'ثبت نشده'}</span></p>
                                  <p className="md:col-span-2"><strong>توضیحات مشتری:</strong> {request.notes || 'توضیح تکمیلی ثبت نشده است.'}</p>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                                <div className="mb-3 flex items-center gap-2"><MessageSquareText className="w-4 h-4 text-blue-700" /><strong className="text-xs text-neutral-900">پاسخ و پیگیری کارشناسی</strong></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <label>
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">وضعیت</span>
                                    <select value={draft.status} onChange={event => patchDraft(request.id, { status: event.target.value as PartRequest['status'] })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-[10px]">
                                      {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                  </label>
                                  <label>
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">قیمت پیشنهادی</span>
                                    <input inputMode="numeric" value={draft.quotedPrice} onChange={event => patchDraft(request.id, { quotedPrice: event.target.value.replace(/[^0-9,]/g, '') })} placeholder="مثلاً 12500000" className="w-full rounded-xl border border-neutral-200 p-2.5 text-left font-mono text-[10px]" />
                                  </label>
                                  <label>
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">واحد</span>
                                    <input value={draft.currency} onChange={event => patchDraft(request.id, { currency: event.target.value })} className="w-full rounded-xl border border-neutral-200 p-2.5 text-[10px]" />
                                  </label>
                                  <label className="md:col-span-3">
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">زمان تقریبی تامین / تحویل</span>
                                    <input value={draft.estimatedDelivery} onChange={event => patchDraft(request.id, { estimatedDelivery: event.target.value })} placeholder="مثلاً ۷ تا ۱۰ روز کاری" className="w-full rounded-xl border border-neutral-200 p-2.5 text-[10px]" />
                                  </label>
                                  <label className="md:col-span-3">
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">متن پاسخ به مشتری</span>
                                    <textarea rows={3} value={draft.responseText} onChange={event => patchDraft(request.id, { responseText: event.target.value })} placeholder="نتیجه بررسی، موجودی، قیمت، شرایط سفارش و توضیحات قابل اعلام به مشتری..." className="w-full rounded-xl border border-neutral-200 p-2.5 text-[10px]" />
                                  </label>
                                  <label className="md:col-span-3">
                                    <span className="mb-1 block text-[9px] font-bold text-neutral-500">یادداشت داخلی ادمین</span>
                                    <textarea rows={2} value={draft.adminNote} onChange={event => patchDraft(request.id, { adminNote: event.target.value })} placeholder="نام تامین‌کننده، قیمت خرید، نکته داخلی؛ برای مشتری نمایش داده نمی‌شود." className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-2.5 text-[10px]" />
                                  </label>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <button type="button" onClick={() => void saveResponse(request)} disabled={savingId === request.id} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-50"><Save className="w-3.5 h-3.5" />{savingId === request.id ? 'در حال ذخیره...' : 'ذخیره پاسخ و وضعیت'}</button>
                                  <a href={`tel:${request.phoneNumber}`} className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[10px] font-bold text-neutral-700"><Phone className="w-3.5 h-3.5" />تماس با مشتری</a>
                                </div>
                              </div>
                            </div>

                            <div>
                              {request.imageUrl ? (
                                <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2">
                                  <img src={request.imageUrl} alt={request.imageName || request.partName} className="h-56 w-full object-contain" />
                                  <span className="mt-2 block truncate text-center text-[9px] text-neutral-500">{request.imageName || 'تصویر ارسالی مشتری'}</span>
                                </a>
                              ) : (
                                <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-white text-[10px] text-neutral-400">تصویری همراه درخواست ثبت نشده است.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="p-14 text-center text-xs text-neutral-400">استعلامی مطابق فیلتر فعلی پیدا نشد.</div>}
      </div>
    </section>
  );
};
