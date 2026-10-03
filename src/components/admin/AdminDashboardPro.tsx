import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpLeft,
  BarChart3,
  Boxes,
  CreditCard,
  FileText,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Wrench
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatToman } from '../../utils/formatters';

interface Props {
  onNavigateTab: (tab: any) => void;
}

export const AdminDashboardPro: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    orders,
    products,
    customers,
    partRequests,
    searchLogs,
    paymentGateways,
    articles,
    pages,
    categories,
    brands,
    models,
    stockAlerts
  } = useStore();

  const stats = useMemo(() => {
    const revenue = orders
      .filter(order => !['cancelled','payment_failed'].includes(order.status))
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pending = orders.filter(order => ['pending','paid','processing','ready_to_ship'].includes(order.status)).length;
    const lowStock = products.filter(product => product.stock > 0 && product.stock <= 5).length;
    const outStock = products.filter(product => product.stock <= 0 || product.stockStatus === 'out_of_stock').length;
    const unanswered = partRequests.filter(request => request.status === 'در حال بررسی').length;
    const activeGateways = paymentGateways.filter(gateway => gateway.isActive).length;
    return { revenue, pending, lowStock, outStock, unanswered, activeGateways };
  }, [orders,products,partRequests,paymentGateways]);

  const recentOrders = [...orders].slice(0,6);
  const recentRequests = [...partRequests].slice(0,5);
  const popularSearches = useMemo(() => {
    const counts = new Map<string,number>();
    searchLogs.forEach(log => {
      const q = String((log as any).query || (log as any).term || '').trim();
      if (!q) return;
      counts.set(q,(counts.get(q)||0)+1);
    });
    return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6);
  },[searchLogs]);

  const cards = [
    { title:'فروش ثبت‌شده', value:formatToman(stats.revenue), sub:`${orders.length.toLocaleString('fa-IR')} سفارش`, icon:BarChart3, tab:'orders', tone:'emerald' },
    { title:'سفارش نیازمند اقدام', value:stats.pending.toLocaleString('fa-IR'), sub:'پرداخت‌شده / در پردازش / ارسال', icon:ShoppingBag, tab:'orders', tone:'blue' },
    { title:'کمبود موجودی', value:(stats.lowStock+stats.outStock).toLocaleString('fa-IR'), sub:`${stats.outStock.toLocaleString('fa-IR')} ناموجود`, icon:Boxes, tab:'products', tone:'amber' },
    { title:'استعلام بی‌پاسخ', value:stats.unanswered.toLocaleString('fa-IR'), sub:`${partRequests.length.toLocaleString('fa-IR')} درخواست کل`, icon:Wrench, tab:'overview', tone:'red' },
    { title:'مشتریان', value:customers.length.toLocaleString('fa-IR'), sub:'CRM ثبت‌شده', icon:Users, tab:'customers', tone:'violet' },
    { title:'درگاه فعال', value:stats.activeGateways.toLocaleString('fa-IR'), sub:'پیکربندی پرداخت', icon:CreditCard, tab:'gateways', tone:'cyan' }
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-l from-neutral-950 via-neutral-900 to-slate-900 text-white p-6 sm:p-7 overflow-hidden relative">
        <div className="absolute -left-16 -top-20 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-black"><ShieldCheck className="w-3.5 h-3.5" /> وضعیت سیستم عادی</span>
            <h2 className="mt-3 text-xl sm:text-2xl font-black">داشبورد عملیاتی فروشگاه</h2>
            <p className="mt-2 text-xs text-neutral-400 max-w-2xl leading-6">فروش، سفارش‌ها، موجودی، محتوا، SEO، درخواست قطعه و وضعیت پرداخت را از یک صفحه کنترل کن.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-[300px]">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center"><strong className="block text-lg">{products.length.toLocaleString('fa-IR')}</strong><span className="text-[8px] text-neutral-400">محصول</span></div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center"><strong className="block text-lg">{categories.length.toLocaleString('fa-IR')}</strong><span className="text-[8px] text-neutral-400">دسته مادر</span></div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center"><strong className="block text-lg">{brands.length.toLocaleString('fa-IR')}</strong><span className="text-[8px] text-neutral-400">برند خودرو</span></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon=card.icon;
          return (
            <button key={card.title} type="button" onClick={()=>onNavigateTab(card.tab)} className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs text-right hover:border-blue-300 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between"><Icon className="w-4 h-4 text-blue-600"/><ArrowUpLeft className="w-3.5 h-3.5 text-neutral-300"/></div>
              <strong className="block mt-3 text-lg font-black text-neutral-900 truncate">{card.value}</strong>
              <span className="block text-[9px] font-bold text-neutral-700 mt-1">{card.title}</span>
              <small className="block text-[8px] text-neutral-400 mt-1 truncate">{card.sub}</small>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_.8fr] gap-4">
        <section className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <header className="p-4 border-b flex items-center justify-between">
            <div><h3 className="font-black text-sm">سفارش‌های اخیر</h3><p className="text-[9px] text-neutral-400 mt-1">مواردی که احتمالاً نیاز به اقدام دارند.</p></div>
            <button onClick={()=>onNavigateTab('orders')} className="text-[9px] font-bold text-blue-600">همه سفارش‌ها</button>
          </header>
          <div className="divide-y divide-neutral-100">
            {recentOrders.map(order=>(
              <div key={order.id} className="p-3.5 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[10px]">
                <div><strong className="block text-neutral-900">{order.orderNumber}</strong><span className="text-neutral-400">{order.customer.firstName} {order.customer.lastName} • {order.customer.phone}</span></div>
                <span className="font-mono font-bold">{formatToman(order.total)}</span>
                <span className={`px-2 py-1 rounded-lg font-bold ${['cancelled','payment_failed'].includes(order.status)?'bg-red-50 text-red-700':order.status==='delivered'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{order.statusTitle}</span>
              </div>
            ))}
            {!recentOrders.length&&<div className="p-10 text-center text-[10px] text-neutral-400">هنوز سفارشی ثبت نشده است.</div>}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-4 space-y-3">
          <div><h3 className="font-black text-sm">هشدارهای عملیاتی</h3><p className="text-[9px] text-neutral-400 mt-1">مواردی که باید زودتر بررسی شوند.</p></div>
          {[
            {label:'کالاهای ناموجود',value:stats.outStock,icon:Package,tab:'products',danger:stats.outStock>0},
            {label:'موجودی ≤ ۵',value:stats.lowStock,icon:AlertTriangle,tab:'products',danger:stats.lowStock>0},
            {label:'درخواست اعلان موجودی',value:stockAlerts.length,icon:Sparkles,tab:'products',danger:stockAlerts.length>0},
            {label:'استعلام‌های در انتظار',value:stats.unanswered,icon:Wrench,tab:'overview',danger:stats.unanswered>0}
          ].map(item=>{
            const Icon=item.icon;
            return <button key={item.label} onClick={()=>onNavigateTab(item.tab)} className="w-full p-3 rounded-xl bg-neutral-50 flex items-center gap-3 text-right"><div className={`w-8 h-8 rounded-lg grid place-items-center ${item.danger?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}><Icon className="w-4 h-4"/></div><span className="flex-1 text-[10px] font-bold">{item.label}</span><strong className="text-sm">{item.value.toLocaleString('fa-IR')}</strong></button>;
          })}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white rounded-3xl border border-neutral-200 p-4">
          <h3 className="font-black text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-600"/>محتوا و SEO</h3>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={()=>onNavigateTab('articles')} className="p-3 rounded-xl bg-neutral-50 text-right"><strong className="block text-lg">{articles.length.toLocaleString('fa-IR')}</strong><span className="text-[9px] text-neutral-500">مقاله</span></button>
            <button onClick={()=>onNavigateTab('pages')} className="p-3 rounded-xl bg-neutral-50 text-right"><strong className="block text-lg">{pages.length.toLocaleString('fa-IR')}</strong><span className="text-[9px] text-neutral-500">برگه</span></button>
            <button onClick={()=>onNavigateTab('categories')} className="p-3 rounded-xl bg-neutral-50 text-right"><strong className="block text-lg">{categories.length.toLocaleString('fa-IR')}</strong><span className="text-[9px] text-neutral-500">دسته</span></button>
            <button onClick={()=>onNavigateTab('cars')} className="p-3 rounded-xl bg-neutral-50 text-right"><strong className="block text-lg">{models.length.toLocaleString('fa-IR')}</strong><span className="text-[9px] text-neutral-500">مدل خودرو</span></button>
          </div>
          <button onClick={()=>onNavigateTab('seo')} className="mt-3 w-full py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-black inline-flex items-center justify-center gap-1"><Sparkles className="w-4 h-4"/>باز کردن TakRank SEO</button>
        </section>

        <section className="bg-white rounded-3xl border border-neutral-200 p-4">
          <h3 className="font-black text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600"/>استعلام‌های اخیر</h3>
          <div className="mt-3 space-y-2">
            {recentRequests.map(req=><div key={req.id} className="p-2.5 rounded-xl bg-neutral-50"><div className="flex justify-between gap-2"><strong className="text-[9px] truncate">{req.partName}</strong><span className={`text-[8px] font-bold ${req.status==='در حال بررسی'?'text-amber-700':'text-emerald-700'}`}>{req.status}</span></div><span className="block mt-1 text-[8px] text-neutral-400">{req.carBrand} {req.carModel} • {req.phoneNumber}</span></div>)}
            {!recentRequests.length&&<p className="py-6 text-center text-[9px] text-neutral-400">درخواستی وجود ندارد.</p>}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-neutral-200 p-4">
          <h3 className="font-black text-sm flex items-center gap-2"><Search className="w-4 h-4 text-blue-600"/>جستجوهای پرتکرار</h3>
          <div className="mt-3 space-y-2">
            {popularSearches.map(([term,count],index)=><div key={term} className="flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-neutral-100 grid place-items-center text-[9px] font-black">{index+1}</span><span className="flex-1 text-[9px] font-bold truncate">{term}</span><strong className="text-[9px] text-neutral-400">{count.toLocaleString('fa-IR')}</strong></div>)}
            {!popularSearches.length&&<p className="py-6 text-center text-[9px] text-neutral-400">داده کافی برای تحلیل جستجو وجود ندارد.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
