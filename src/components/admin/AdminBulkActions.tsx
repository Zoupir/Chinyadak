import React, { useEffect, useState } from 'react';
const groups: Record<string, string> = { navigation:'لینک‌های ناوبری', parts_brands:'برندهای قطعات', products:'محصولات', categories:'دسته‌های قطعات', articles:'مقالات', article_categories:'دسته‌های مقاله', pages:'برگه‌ها', sliders:'اسلایدرها', brands:'برندهای خودرو', models:'مدل‌های خودرو', customers:'مشتریان', admins:'مدیران', orders:'سفارش‌ها', menus:'منوها', shipping:'روش‌های ارسال', gateways:'روش‌های پرداخت', banners:'بنرها' };
const request = async (url: string, options: RequestInit = {}) => {
 const response = await fetch(url, { credentials:'same-origin', ...options, headers: { 'content-type':'application/json', ...options.headers } });
 const data = await response.json(); if (!response.ok) throw Error(data.error || `HTTP_${response.status}`); return data;
};
const errors: Record<string,string> = { BULK_PROTECTED_RECORD:'برگه‌های سیستمی و حساب مدیر فعلی قابل حذف یا غیرفعال‌کردن نیستند.', BRAND_HAS_MODELS:'ابتدا مدل‌های وابسته به این برند را جابه‌جا یا حذف کنید.', CUSTOMER_HAS_ORDERS:'مشتری دارای سفارش است؛ به جای حذف، غیرفعال کنید.', PRODUCT_HAS_ACTIVE_RESERVATIONS:'محصول رزرو فعال پرداخت دارد.', RESTORE_REQUIRED:'ابتدا مورد را از زباله‌دان بازیابی کنید.', PAYMENT_IN_PROGRESS:'سفارش پرداخت در حال انجام دارد.' };
export function AdminBulkActions({ section }: { section: string }) {
 const initial = groups[section] ? section : section === 'cars' ? 'brands' : section === 'mega_menu' || section === 'menus_attrs' ? 'menus' : section === 'theme' ? 'shipping' : 'products';
 const [open,setOpen]=useState(false), [kind,setKind]=useState(initial), [q,setQ]=useState(''), [trash,setTrash]=useState(false), [offset,setOffset]=useState(0), [items,setItems]=useState<any[]>([]), [total,setTotal]=useState(0), [ids,setIds]=useState<string[]>([]), [busy,setBusy]=useState(false), [notice,setNotice]=useState('');
 useEffect(()=>{setKind(initial);setOpen(false);setIds([]);setOffset(0);setQ('');},[section]);
 const load=async()=>{ const data=await request(`/api/bulk/${kind}?q=${encodeURIComponent(q)}&trash=${trash?1:0}&offset=${offset}`);setItems(data.items);setTotal(data.total); };
 useEffect(()=>{if(open) void load().catch(e=>setNotice(e.message));},[open,kind,q,trash,offset]);
 const toggle=(id:string)=>setIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
 const apply=async(action:string)=>{
  if(!ids.length)return;
  if(['delete','trash'].includes(action)&&!window.confirm(`${action==='delete'?'حذف دائمی':'انتقال به زباله‌دان'} ${ids.length} مورد انتخاب‌شده؟`))return;
  setBusy(true);setNotice('');
  try{const result=await request(`/api/bulk/${kind}`,{method:'POST',body:JSON.stringify({ids,action})});setNotice(`${result.changed} مورد تغییر کرد. برای نمایش نتیجه در فهرست اصلی، صفحه را تازه کنید.`);setIds([]);await load();}
  catch(e){setNotice(errors[(e as Error).message]||(e as Error).message);}finally{setBusy(false);}
 };
 return <div className="mb-5 border rounded-2xl bg-white p-3">
  <button type="button" onClick={()=>setOpen(!open)} className="text-sm font-bold text-blue-800">{open?'بستن':'باز کردن'} اقدام‌های دسته‌جمعی و زباله‌دان</button>
  {open&&<div className="space-y-3 mt-3">
   <div className="flex flex-wrap gap-2"><select value={kind} onChange={e=>{setKind(e.target.value);setOffset(0);setIds([]);setTrash(false);}} className="border rounded-lg p-2">{Object.entries(groups).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select><input placeholder="جستجو در فهرست" value={q} onChange={e=>{setQ(e.target.value);setOffset(0);setIds([]);}} className="border rounded-lg p-2"/>{kind!=='orders'&&<label className="p-2"><input type="checkbox" checked={trash} onChange={e=>{setTrash(e.target.checked);setIds([]);setOffset(0);}}/> زباله‌دان</label>}</div>
   <div className="flex flex-wrap gap-2 items-center"><label><input type="checkbox" checked={items.length>0&&items.every(x=>ids.includes(x.id))} onChange={e=>setIds(e.target.checked?[...new Set([...ids,...items.map(x=>x.id)])]:ids.filter(id=>!items.some(x=>x.id===id)))}/> انتخاب این صفحه</label><span className="text-xs">{ids.length} انتخاب از {total} مورد</span>
   {(trash?['restore','delete']:kind==='orders'?['deactivate','delete']:['activate','deactivate','trash','delete']).map(action=><button type="button" key={action} disabled={busy||!ids.length} onClick={()=>void apply(action)} className="px-3 py-2 border rounded-lg text-xs disabled:opacity-40">{{activate:'فعال‌سازی',deactivate:kind==='orders'?'لغو سفارش':'غیرفعال‌سازی',trash:'زباله‌دان',restore:'بازیابی',delete:'حذف دائمی'}[action]}</button>)}
   </div>
   {notice&&<p className="text-sm p-3 bg-blue-50 rounded-lg">{notice}</p>}
   <div className="max-h-80 overflow-y-auto divide-y border rounded-xl">{items.map(item=><label key={item.id} className="flex gap-3 p-3 text-sm cursor-pointer"><input type="checkbox" checked={ids.includes(item.id)} onChange={()=>toggle(item.id)}/><span>{item.title||item.id}</span></label>)}</div>
   <div className="flex gap-3 items-center text-xs"><button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-100))}>صفحه قبل</button><span>{Math.floor(offset/100)+1}</span><button disabled={offset+100>=total} onClick={()=>setOffset(offset+100)}>صفحه بعد</button><button onClick={()=>window.location.reload()}>تازه‌سازی فهرست اصلی</button></div>
  </div>}
 </div>;
}
