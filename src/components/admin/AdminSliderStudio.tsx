import React, { useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { SliderItem } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

type Device='desktop'|'tablet'|'mobile';

const makeSlide=(order:number):SliderItem=>({
  id:`slide-${Date.now()}`,
  title:'عنوان اصلی اسلاید',
  subtitle:'توضیح کوتاه و جذاب برای این اسلاید',
  tag:'پیشنهاد ویژه',
  imageUrl:'',
  link:'shop',
  buttonText:'مشاهده محصولات',
  isActive:true,
  order,
  gradientOverlay:true,
  overlayOpacity:60,
  textAlignment:'right',
  titleColor:'#ffffff',
  subtitleColor:'#e5e7eb',
  bgColor:'#111827',
  buttonBgColor:'#f59e0b',
  buttonTextColor:'#111827',
  badgeBgColor:'rgba(245,158,11,.18)',
  badgeTextColor:'#fbbf24'
});

export const AdminSliderStudio:React.FC=()=>{
  const {sliders,addSlider,updateSlider,deleteSlider,reorderSliders,showToast}=useStore();
  const ordered=useMemo(()=>[...sliders].sort((a,b)=>a.order-b.order),[sliders]);
  const [selectedId,setSelectedId]=useState(ordered[0]?.id||'');
  const selected=ordered.find(s=>s.id===selectedId)||ordered[0];
  const [draft,setDraft]=useState<SliderItem|null>(selected?{...selected}:null);
  const [device,setDevice]=useState<Device>('desktop');

  React.useEffect(()=>{const s=ordered.find(x=>x.id===selectedId)||ordered[0];setDraft(s?{...s}:null);},[selectedId,sliders.length]);

  const patch=(partial:Partial<SliderItem>)=>setDraft(current=>current?{...current,...partial}:current);

  const save=()=>{
    if(!draft)return;
    updateSlider(draft);
    showToast('اسلاید ذخیره شد.');
  };

  const add=()=>{
    const s=makeSlide(ordered.length+1);
    addSlider(s);setSelectedId(s.id);setDraft(s);
  };

  const move=(id:string,dir:'up'|'down')=>{
    const list=[...ordered];const i=list.findIndex(x=>x.id===id);const j=dir==='up'?i-1:i+1;
    if(i<0||j<0||j>=list.length)return;
    [list[i],list[j]]=[list[j],list[i]];
    reorderSliders(list.map((x,index)=>({...x,order:index+1})));
  };

  const width=device==='desktop'?'100%':device==='tablet'?'820px':'390px';
  const previewHeight=device==='desktop'?430:device==='tablet'?390:520;

  return (
    <div className="slider-studio -m-4 sm:-m-6 lg:-m-8 bg-[#eef1f4] min-h-[calc(100vh-128px)]">
      <div className="h-14 px-4 bg-neutral-950 text-white sticky top-16 z-20 flex items-center justify-between gap-3">
        <div>
          <strong className="text-sm">Slider & Banner Studio</strong>
          <span className="text-[9px] text-neutral-400 mr-2">ویرایش بصری اسلایدهای Hero</span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button onClick={()=>setDevice('desktop')} className={`p-2 rounded ${device==='desktop'?'bg-blue-600':'text-neutral-400'}`}><Monitor className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('tablet')} className={`p-2 rounded ${device==='tablet'?'bg-blue-600':'text-neutral-400'}`}><Tablet className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('mobile')} className={`p-2 rounded ${device==='mobile'?'bg-blue-600':'text-neutral-400'}`}><Smartphone className="w-4 h-4"/></button>
        </div>
        <button onClick={save} disabled={!draft} className="h-9 px-4 rounded-lg bg-emerald-600 disabled:bg-neutral-600 text-white text-[10px] font-black inline-flex gap-1 items-center"><Save className="w-3.5 h-3.5"/>ذخیره</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_340px] min-h-[calc(100vh-184px)]">
        <aside className="bg-white border-l p-3">
          <div className="flex items-center justify-between mb-3"><strong className="text-xs">اسلایدها</strong><button onClick={add} className="w-8 h-8 grid place-items-center rounded-lg bg-blue-600 text-white"><Plus className="w-4 h-4"/></button></div>
          <div className="space-y-2">
            {ordered.map((slide,index)=>(
              <button key={slide.id} onClick={()=>setSelectedId(slide.id)} className={`w-full rounded-xl border overflow-hidden text-right ${selected?.id===slide.id?'border-blue-500 ring-1 ring-blue-500':'border-neutral-200'}`}>
                <div className="h-24 relative bg-neutral-900">
                  {slide.imageUrl&&<img src={slide.imageUrl} alt="" className="w-full h-full object-cover"/>}
                  <div className="absolute inset-0 bg-black/40"/>
                  <strong className="absolute right-2 bottom-2 left-2 text-[9px] text-white line-clamp-2">{slide.title}</strong>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px]">#{index+1}</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span className={`text-[8px] font-bold ${slide.isActive?'text-emerald-600':'text-neutral-400'}`}>{slide.isActive?'فعال':'خاموش'}</span>
                  <span className="flex">
                    <span onClick={e=>{e.stopPropagation();move(slide.id,'up')}} className="p-1"><ArrowUp className="w-3 h-3"/></span>
                    <span onClick={e=>{e.stopPropagation();move(slide.id,'down')}} className="p-1"><ArrowDown className="w-3 h-3"/></span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="p-6 overflow-auto">
          <div className="mx-auto transition-all" style={{width,maxWidth:'100%'}}>
            <div className="h-8 bg-neutral-900 rounded-t-xl flex items-center gap-1.5 px-3"><span className="w-2 h-2 rounded-full bg-red-400"/><span className="w-2 h-2 rounded-full bg-amber-400"/><span className="w-2 h-2 rounded-full bg-emerald-400"/></div>
            {draft?(
              <div
                className="relative overflow-hidden bg-neutral-900 shadow-2xl"
                style={{
                  minHeight:`${previewHeight}px`,
                  backgroundColor:draft.bgColor||'#111827',
                  backgroundImage:draft.imageUrl?`url(${draft.imageUrl})`:undefined,
                  backgroundSize:'cover',
                  backgroundPosition:'center'
                }}
              >
                {draft.gradientOverlay!==false&&<div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-black/5" style={{opacity:Math.max(.15,(draft.overlayOpacity??60)/100)}}/>}
                <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-center ${draft.textAlignment==='center'?'items-center text-center':draft.textAlignment==='left'?'items-end text-left':'items-start text-right'}`}>
                  {draft.tag&&<span className="px-2 py-1 rounded text-[9px] font-black" style={{backgroundColor:draft.badgeBgColor,color:draft.badgeTextColor}}>{draft.tag}</span>}
                  <h2 className="mt-3 text-3xl md:text-5xl font-black max-w-2xl leading-tight" style={{color:draft.titleColor}}>{draft.title}</h2>
                  <p className="mt-3 max-w-xl text-xs md:text-sm leading-7" style={{color:draft.subtitleColor}}>{draft.subtitle}</p>
                  <button className="mt-5 px-4 py-2.5 rounded text-xs font-black" style={{backgroundColor:draft.buttonBgColor,color:draft.buttonTextColor}}>{draft.buttonText}</button>
                </div>
              </div>
            ):<div className="min-h-[430px] bg-white grid place-items-center text-xs text-neutral-400">یک اسلاید بساز.</div>}
          </div>
        </main>

        <aside className="bg-white border-r p-4 overflow-y-auto">
          {!draft?<p className="text-xs text-neutral-400">اسلایدی انتخاب نشده.</p>:<div className="space-y-4 text-[10px]">
            <div className="flex justify-between items-center"><strong className="text-sm">تنظیمات اسلاید</strong><button onClick={()=>patch({isActive:!draft.isActive})} className={`px-2 py-1.5 rounded-lg ${draft.isActive?'bg-emerald-50 text-emerald-700':'bg-neutral-100'}`}>{draft.isActive?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button></div>
            <label className="block"><span className="font-bold">عنوان</span><input value={draft.title} onChange={e=>patch({title:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
            <label className="block"><span className="font-bold">توضیح</span><textarea rows={3} value={draft.subtitle} onChange={e=>patch({subtitle:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
            <div className="grid grid-cols-2 gap-2"><input value={draft.tag||''} onChange={e=>patch({tag:e.target.value})} className="p-2 border rounded" placeholder="Badge"/><input value={draft.buttonText} onChange={e=>patch({buttonText:e.target.value})} className="p-2 border rounded" placeholder="CTA"/></div>
            <input dir="ltr" value={draft.link} onChange={e=>patch({link:e.target.value})} className="w-full p-2 border rounded text-left" placeholder="link"/>
            <ImageUploadInput label="تصویر اسلاید" value={draft.imageUrl} onChange={url=>patch({imageUrl:url})} aspectRatio="banner" presetCategory="banners"/>
            <div><span className="font-bold block mb-1">تراز متن</span><div className="grid grid-cols-3 gap-1"><button onClick={()=>patch({textAlignment:'right'})} className={`p-2 border rounded flex justify-center ${draft.textAlignment==='right'?'bg-blue-50 border-blue-500':''}`}><AlignRight className="w-4 h-4"/></button><button onClick={()=>patch({textAlignment:'center'})} className={`p-2 border rounded flex justify-center ${draft.textAlignment==='center'?'bg-blue-50 border-blue-500':''}`}><AlignCenter className="w-4 h-4"/></button><button onClick={()=>patch({textAlignment:'left'})} className={`p-2 border rounded flex justify-center ${draft.textAlignment==='left'?'bg-blue-50 border-blue-500':''}`}><AlignLeft className="w-4 h-4"/></button></div></div>
            <label><span>شدت Overlay: {draft.overlayOpacity??60}%</span><input type="range" min="0" max="100" value={draft.overlayOpacity??60} onChange={e=>patch({overlayOpacity:Number(e.target.value)})} className="w-full"/></label>
            <label className="flex items-center justify-between p-2 border rounded-lg"><span>گرادیان روی تصویر</span><input type="checkbox" checked={draft.gradientOverlay!==false} onChange={e=>patch({gradientOverlay:e.target.checked})}/></label>
            <div className="grid grid-cols-2 gap-2">
              <label><span>عنوان</span><input type="color" value={draft.titleColor||'#ffffff'} onChange={e=>patch({titleColor:e.target.value})} className="w-full h-9"/></label>
              <label><span>توضیح</span><input type="color" value={draft.subtitleColor||'#e5e7eb'} onChange={e=>patch({subtitleColor:e.target.value})} className="w-full h-9"/></label>
              <label><span>دکمه</span><input type="color" value={draft.buttonBgColor||'#f59e0b'} onChange={e=>patch({buttonBgColor:e.target.value})} className="w-full h-9"/></label>
              <label><span>متن دکمه</span><input type="color" value={draft.buttonTextColor||'#111827'} onChange={e=>patch({buttonTextColor:e.target.value})} className="w-full h-9"/></label>
            </div>
            <div className="pt-3 border-t flex gap-2"><button onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black inline-flex items-center justify-center gap-1"><Save className="w-3.5 h-3.5"/>ذخیره</button><button onClick={()=>{if(window.confirm('اسلاید حذف شود؟')){deleteSlider(draft.id);setSelectedId('');setDraft(null);}}} className="w-10 grid place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4"/></button></div>
          </div>}
        </aside>
      </div>
    </div>
  );
};
