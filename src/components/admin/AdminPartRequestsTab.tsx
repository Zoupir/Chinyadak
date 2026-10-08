import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Phone,
  RefreshCw,
  Search,
  Wrench
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PartRequest } from '../../types';

const STATUS_OPTIONS: PartRequest['status'][] = [
  'در حال بررسی',
  'پاسخ داده شد',
  'ناموجود در گمرک'
];

const normalized = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('fa-IR');

export const AdminPartRequestsTab: React.FC = () => {
  const {
    partRequests,
    refreshAdminEngagement,
    updatePartRequestStatus
  } = useStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PartRequest['status']>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        request.notes
      ].some(value => normalized(value).includes(needle));
    });
  }, [partRequests, query, statusFilter]);

  const waitingCount = partRequests.filter(request => request.status === 'در حال بررسی').length;
  const answeredCount = partRequests.filter(request => request.status === 'پاسخ داده شد').length;

  return (
    <section className="space-y-5" data-admin-part-requests="1">
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-neutral-900">مدیریت استعلام قطعه</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">تمام درخواست‌های ثبت‌شده مستقیماً از دیتابیس خوانده می‌شوند. این صفحه هر ۳۰ ثانیه نیز به‌صورت خودکار تازه می‌شود.</p>
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

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-neutral-50 p-4"><span className="text-[10px] text-neutral-500">کل استعلام‌ها</span><strong className="mt-1 block text-xl font-black">{partRequests.length.toLocaleString('fa-IR')}</strong></div>
          <div className="rounded-2xl bg-amber-50 p-4"><span className="text-[10px] text-amber-700">در انتظار بررسی</span><strong className="mt-1 block text-xl font-black text-amber-800">{waitingCount.toLocaleString('fa-IR')}</strong></div>
          <div className="rounded-2xl bg-emerald-50 p-4"><span className="text-[10px] text-emerald-700">پاسخ داده‌شده</span><strong className="mt-1 block text-xl font-black text-emerald-800">{answeredCount.toLocaleString('fa-IR')}</strong></div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-10 pl-3 text-xs outline-none focus:border-red-500"
              placeholder="جستجو در نام قطعه، OEM، VIN، خودرو، نام یا موبایل مشتری..."
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
          <table className="w-full min-w-[1050px] text-xs text-right">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3">تاریخ</th>
                <th className="p-3">قطعه</th>
                <th className="p-3">خودرو</th>
                <th className="p-3">متقاضی</th>
                <th className="p-3">OEM / VIN</th>
                <th className="p-3">تصویر</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(request => (
                <React.Fragment key={request.id}>
                  <tr className="align-top hover:bg-neutral-50/70">
                    <td className="p-3 whitespace-nowrap text-neutral-500"><span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{request.createdAt}</span></td>
                    <td className="p-3"><strong className="block max-w-[240px] text-neutral-900">{request.partName}</strong>{request.notes && <span className="mt-1 block max-w-[240px] truncate text-[10px] text-neutral-400">{request.notes}</span>}</td>
                    <td className="p-3"><strong>{request.carBrand} {request.carModel}</strong><span className="block mt-1 text-[10px] text-neutral-400">{request.year || 'سال نامشخص'}</span></td>
                    <td className="p-3"><strong className="block">{request.fullName}</strong><a className="mt-1 inline-flex items-center gap-1 font-mono text-blue-700" href={`tel:${request.phoneNumber}`}><Phone className="w-3.5 h-3.5" />{request.phoneNumber}</a></td>
                    <td className="p-3 font-mono text-[10px]"><span className="block">OEM: {request.oemNumber || '—'}</span><span className="block mt-1">VIN: {request.vin || '—'}</span></td>
                    <td className="p-3">
                      {request.imageUrl ? (
                        <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 font-bold">
                          <ImageIcon className="w-4 h-4" /> مشاهده <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-neutral-400">ندارد</span>}
                    </td>
                    <td className="p-3">
                      <select
                        value={request.status}
                        onChange={event => updatePartRequestStatus(request.id, event.target.value as PartRequest['status'])}
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-bold"
                      >
                        {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="p-3"><button type="button" onClick={() => setExpandedId(current => current === request.id ? null : request.id)} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[10px] font-bold">{expandedId === request.id ? 'بستن' : 'مشاهده'}</button></td>
                  </tr>
                  {expandedId === request.id && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={8} className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                          <div className="space-y-2 text-[11px] leading-6">
                            <p><strong>شناسه درخواست:</strong> <span className="font-mono">{request.id}</span></p>
                            <p><strong>شرح و توضیحات مشتری:</strong> {request.notes || 'توضیح تکمیلی ثبت نشده است.'}</p>
                            <p><strong>مشخصات خودرو:</strong> {request.carBrand} {request.carModel} — {request.year || 'سال نامشخص'}</p>
                            <p><strong>شماره فنی:</strong> {request.oemNumber || 'ثبت نشده'} &nbsp; | &nbsp; <strong>VIN:</strong> {request.vin || 'ثبت نشده'}</p>
                          </div>
                          {request.imageUrl && <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border bg-white"><img src={request.imageUrl} alt={request.imageName || request.partName} className="h-40 w-full object-contain" /></a>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="p-14 text-center text-xs text-neutral-400">استعلامی مطابق فیلتر فعلی پیدا نشد.</div>}
      </div>
    </section>
  );
};
