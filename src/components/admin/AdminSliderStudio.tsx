import React, { useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Grip,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type {
  PageSection,
  PageSectionItem,
  SliderDevice,
  SliderDeviceLayout,
  SliderElementKey,
  SliderElementPosition,
  SliderItem
} from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { LinkDestinationPicker } from '../common/LinkDestinationPicker';

type StudioMode = 'slides' | 'banners';

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
  imageMode:'cover',
  buttonBgColor:'#f59e0b',
  buttonTextColor:'#111827',
  badgeBgColor:'rgba(245,158,11,.18)',
  badgeTextColor:'#fbbf24',
  inheritTabletFromDesktop:true,
  inheritMobileFromDesktop:true,
  responsiveLayout:{
    desktop:{
      tag:{x:70,y:18,width:20},
      title:{x:58,y:29,width:34},
      subtitle:{x:60,y:51,width:32},
      button:{x:75,y:69,width:17}
    }
  }
});

const makeBannerItem=(order:number):PageSectionItem=>({
  id:`banner-${Date.now()}-${order}`,
  title:'عنوان بنر',
  subtitle:'توضیح کوتاه',
  imageUrl:'',
  imageMode:'cover',
  titleColor:'#ffffff',
  subtitleColor:'#e5e7eb',
  buttonBgColor:'#f59e0b',
  buttonTextColor:'#111827',
  badgeBgColor:'#16a34a',
  badgeTextColor:'#ffffff',
  textAlignment:'right',
  link:'shop',
  buttonText:'مشاهده',
  isVisible:true,
  order,
  inheritTabletFromDesktop:true,
  inheritMobileFromDesktop:true,
  responsiveLayout:{
    desktop:{
      title:{x:55,y:24,width:38},
      subtitle:{x:58,y:48,width:34},
      button:{x:73,y:70,width:20}
    }
  }
});

const DEFAULT_POSITIONS:Record<SliderElementKey,SliderElementPosition>={
  tag:{x:70,y:18,width:20,fontSizePx:10,wrap:'nowrap'},
  title:{x:58,y:29,width:34,fontSizePx:40,wrap:'wrap'},
  subtitle:{x:60,y:51,width:32,fontSizePx:13,wrap:'wrap'},
  button:{x:75,y:69,width:17,fontSizePx:9,wrap:'nowrap'}
};

const BANNER_DEFAULT_POSITIONS:Record<SliderElementKey,SliderElementPosition>={
  tag:{x:70,y:16,width:22,fontSizePx:10,wrap:'nowrap'},
  title:{x:55,y:24,width:38,fontSizePx:19,wrap:'wrap'},
  subtitle:{x:58,y:48,width:34,fontSizePx:10,wrap:'wrap'},
  button:{x:73,y:70,width:20,fontSizePx:9,wrap:'nowrap'}
};

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

const inherited=(owner:SliderItem|PageSectionItem,device:SliderDevice)=>
  device==='tablet'
    ? owner.inheritTabletFromDesktop!==false
    : device==='mobile'
      ? owner.inheritMobileFromDesktop!==false
      : false;

const effectiveLayout=(owner:SliderItem|PageSectionItem,device:SliderDevice):SliderDeviceLayout=>{
  const layouts=owner.responsiveLayout||{};
  if(device!=='desktop'&&inherited(owner,device)) return layouts.desktop||{};
  return layouts[device]||layouts.desktop||{};
};

const elementPosition=(
  owner:SliderItem|PageSectionItem,
  device:SliderDevice,
  key:SliderElementKey,
  defaults:Record<SliderElementKey,SliderElementPosition>=DEFAULT_POSITIONS
):SliderElementPosition=>({
  ...defaults[key],
  ...(effectiveLayout(owner,device)[key]||{})
});

export const AdminSliderStudio:React.FC=()=>{
  const {
    sliders,
    addSlider,
    updateSlider,
    deleteSlider,
    reorderSliders,
    pages,
    updateSection,
    showToast
  }=useStore();

  const ordered=useMemo(()=>[...sliders].sort((a,b)=>a.order-b.order),[sliders]);
  const homePage=pages.find(page=>page.slug==='home');
  const bannerSections=useMemo(
    ()=>[...(homePage?.sections||[])]
      .filter(section=>/promo|banner/i.test(section.sectionKey||section.id||''))
      .sort((a,b)=>a.order-b.order),
    [homePage]
  );

  const [mode,setMode]=useState<StudioMode>('slides');
  const [selectedId,setSelectedId]=useState(ordered[0]?.id||'');
  const [draft,setDraft]=useState<SliderItem|null>(ordered[0]?clone(ordered[0]):null);
  const [bannerSelection,setBannerSelection]=useState<{sectionId:string;itemId:string}|null>(null);
  const [bannerDraft,setBannerDraft]=useState<PageSectionItem|null>(null);
  const [device,setDevice]=useState<SliderDevice>('desktop');
  const [activeElement,setActiveElement]=useState<SliderElementKey>('title');
  const [dragging,setDragging]=useState<{key:SliderElementKey;offsetX:number;offsetY:number}|null>(null);
  const [resizing,setResizing]=useState<{key:SliderElementKey;startX:number;startY:number;startWidth:number;startHeight:number}|null>(null);
  const canvasRef=useRef<HTMLDivElement>(null);

  React.useEffect(()=>{
    const selected=ordered.find(item=>item.id===selectedId)||ordered[0];
    setDraft(selected?clone(selected):null);
  },[selectedId,sliders]);

  React.useEffect(()=>{
    if(mode!=='banners')return;
    if(bannerSelection){
      const section=bannerSections.find(item=>item.id===bannerSelection.sectionId);
      const item=section?.items?.find(row=>row.id===bannerSelection.itemId);
      if(item){setBannerDraft(clone(item));return;}
    }
    const section=bannerSections[0];
    const item=section?.items?.[0];
    if(section&&item){
      setBannerSelection({sectionId:section.id,itemId:item.id});
      setBannerDraft(clone(item));
    }else{
      setBannerSelection(null);
      setBannerDraft(null);
    }
  },[mode,homePage?.id,bannerSections.length]);

  const owner:SliderItem|PageSectionItem|null=mode==='slides'?draft:bannerDraft;
  const activeBannerSection=bannerSelection?bannerSections.find(section=>section.id===bannerSelection.sectionId):undefined;
  const activeDefaults=mode==='banners'?BANNER_DEFAULT_POSITIONS:DEFAULT_POSITIONS;

  const patchSlide=(partial:Partial<SliderItem>)=>setDraft(current=>current?{...current,...partial}:current);
  const patchBanner=(partial:Partial<PageSectionItem>)=>setBannerDraft(current=>current?{...current,...partial}:current);

  const patchOwner=(partial:Partial<SliderItem&PageSectionItem>)=>{
    if(mode==='slides') patchSlide(partial as Partial<SliderItem>);
    else patchBanner(partial as Partial<PageSectionItem>);
  };

  const selectBanner=(section:PageSection,item:PageSectionItem)=>{
    setBannerSelection({sectionId:section.id,itemId:item.id});
    setBannerDraft(clone(item));
  };

  const save=async()=>{
    if(mode==='slides'){
      if(!draft)return;
      updateSlider(draft);
      return;
    }
    if(!homePage||!activeBannerSection||!bannerDraft)return;
    await updateSection(homePage.slug,{
      ...activeBannerSection,
      items:(activeBannerSection.items||[]).map(item=>item.id===bannerDraft.id?bannerDraft:item)
    });
  };

  const add=()=>{
    if(mode==='slides'){
      const slide=makeSlide(ordered.length+1);
      addSlider(slide);
      setSelectedId(slide.id);
      setDraft(slide);
      return;
    }
    const section=activeBannerSection||bannerSections[0];
    if(!homePage||!section){
      showToast('ابتدا در صفحه‌ساز دیداری یک سکشن بنری بسازید.','error');
      return;
    }
    const item=makeBannerItem((section.items||[]).length+1);
    updateSection(homePage.slug,{...section,items:[...(section.items||[]),item]});
    setBannerSelection({sectionId:section.id,itemId:item.id});
    setBannerDraft(item);
  };

  const removeCurrent=()=>{
    if(mode==='slides'){
      if(!draft)return;
      if(!window.confirm('اسلاید حذف شود؟'))return;
      deleteSlider(draft.id);
      setSelectedId('');
      setDraft(null);
      return;
    }
    if(!homePage||!activeBannerSection||!bannerDraft)return;
    if(!window.confirm('این بنر حذف شود؟'))return;
    updateSection(homePage.slug,{
      ...activeBannerSection,
      items:(activeBannerSection.items||[]).filter(item=>item.id!==bannerDraft.id)
    });
    setBannerSelection(null);
    setBannerDraft(null);
  };

  const moveSlide=(id:string,dir:'up'|'down')=>{
    const list=[...ordered];
    const index=list.findIndex(item=>item.id===id);
    const target=dir==='up'?index-1:index+1;
    if(index<0||target<0||target>=list.length)return;
    [list[index],list[target]]=[list[target],list[index]];
    reorderSliders(list.map((item,order)=>({...item,order:order+1})));
  };

  const setInheritance=(checked:boolean)=>{
    if(!owner||device==='desktop')return;
    if(device==='tablet'){
      patchOwner({
        inheritTabletFromDesktop:checked,
        responsiveLayout:checked
          ? owner.responsiveLayout
          : {
              ...(owner.responsiveLayout||{}),
              tablet:clone(owner.responsiveLayout?.desktop||{})
            }
      } as any);
    }else{
      patchOwner({
        inheritMobileFromDesktop:checked,
        responsiveLayout:checked
          ? owner.responsiveLayout
          : {
              ...(owner.responsiveLayout||{}),
              mobile:clone(owner.responsiveLayout?.desktop||{})
            }
      } as any);
    }
  };

  const setElementPosition=(key:SliderElementKey,next:SliderElementPosition)=>{
    if(!owner)return;
    const directDevice=device;
    const layouts=clone(owner.responsiveLayout||{});
    if(device!=='desktop'&&inherited(owner,device)){
      layouts[device]=clone(layouts.desktop||{});
    }
    layouts[directDevice]={
      ...(layouts[directDevice]||{}),
      [key]:next
    };
    const partial:any={responsiveLayout:layouts};
    if(device==='tablet')partial.inheritTabletFromDesktop=false;
    if(device==='mobile')partial.inheritMobileFromDesktop=false;
    patchOwner(partial);
  };

  const startDrag=(event:React.PointerEvent<HTMLDivElement>,key:SliderElementKey)=>{
    if(!owner||!canvasRef.current)return;
    event.preventDefault();
    event.stopPropagation();
    const rect=canvasRef.current.getBoundingClientRect();
    const pos=elementPosition(owner,device,key,activeDefaults);
    const px=rect.left+(pos.x/100)*rect.width;
    const py=rect.top+(pos.y/100)*rect.height;
    setActiveElement(key);
    setDragging({key,offsetX:event.clientX-px,offsetY:event.clientY-py});
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const dragMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!dragging||!owner||!canvasRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const current=elementPosition(owner,device,dragging.key,activeDefaults);
    const width=clamp(Number(current.width||DEFAULT_POSITIONS[dragging.key].width||20),8,90);
    const x=clamp(((event.clientX-dragging.offsetX-rect.left)/rect.width)*100,0,100-width);
    const y=clamp(((event.clientY-dragging.offsetY-rect.top)/rect.height)*100,0,92);
    setElementPosition(dragging.key,{...current,x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),width});
  };

  const stopDrag=()=>setDragging(null);

  const startResize=(event:React.PointerEvent<HTMLSpanElement>,key:SliderElementKey)=>{
    if(!owner||!canvasRef.current)return;
    event.preventDefault();
    event.stopPropagation();
    const pos=elementPosition(owner,device,key,activeDefaults);
    const elementRect=event.currentTarget.parentElement?.getBoundingClientRect();
    const canvasRect=canvasRef.current.getBoundingClientRect();
    const measuredHeight=elementRect ? (elementRect.height/canvasRect.height)*100 : 8;
    setActiveElement(key);
    setResizing({
      key,
      startX:event.clientX,
      startY:event.clientY,
      startWidth:Number(pos.width||activeDefaults[key].width||20),
      startHeight:Number(pos.height||measuredHeight)
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizeMove=(event:React.PointerEvent<HTMLSpanElement>)=>{
    if(!resizing||!owner||!canvasRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const pos=elementPosition(owner,device,resizing.key,activeDefaults);
    const deltaWidth=((resizing.startX-event.clientX)/rect.width)*100;
    const deltaHeight=((event.clientY-resizing.startY)/rect.height)*100;
    const width=clamp(resizing.startWidth+deltaWidth,6,95);
    const height=clamp(resizing.startHeight+deltaHeight,3,80);
    setElementPosition(resizing.key,{...pos,width:Number(width.toFixed(2)),height:Number(height.toFixed(2))});
  };

  const stopResize=()=>setResizing(null);

  const positionStyle=(key:SliderElementKey):React.CSSProperties=>{
    if(!owner)return{};
    const pos=elementPosition(owner,device,key,activeDefaults);
    return{
      position:'absolute',
      left:`${pos.x}%`,
      top:`${pos.y}%`,
      width:`${pos.width||activeDefaults[key].width}%`,
      height:pos.height?`${pos.height}%`:undefined,
      fontSize:`${pos.fontSizePx||activeDefaults[key].fontSizePx||12}px`,
      whiteSpace:(pos.wrap||activeDefaults[key].wrap)==='nowrap'?'nowrap':'normal',
      overflow:pos.height?'hidden':undefined,
      zIndex:4,
      touchAction:'none',
      cursor:dragging?.key===key?'grabbing':'grab'
    };
  };

  const visibleElement=(key:SliderElementKey)=>{
    if(!owner)return false;
    if(mode==='slides'){
      if(key==='tag')return Boolean((owner as SliderItem).tag);
      if(key==='title')return Boolean(owner.title);
      if(key==='subtitle')return Boolean(owner.subtitle);
      if(key==='button')return Boolean(owner.buttonText);
    }else{
      if(key==='tag')return Boolean((owner as PageSectionItem).badge);
      if(key==='title')return Boolean(owner.title);
      if(key==='subtitle')return Boolean(owner.subtitle);
      if(key==='button')return Boolean(owner.buttonText);
    }
    return false;
  };

  const activeBannerIndex=activeBannerSection&&bannerDraft
    ? Math.max(0,(activeBannerSection.items||[]).findIndex(item=>item.id===bannerDraft.id))
    : 0;
  const bannerKey=activeBannerSection?.sectionKey || '';
  const activeBannerWidthPercent = bannerDraft
    ? device==='desktop'
      ? (bannerDraft.widthPercent ?? (bannerKey==='promo-large'&&activeBannerIndex%3===0?67:bannerKey==='promo-small'?34:bannerKey==='promo-medium'?50:100))
      : device==='tablet'
        ? (bannerDraft.tabletWidthPercent ?? bannerDraft.widthPercent ?? 100)
        : (bannerDraft.mobileWidthPercent ?? 100)
    : 100;
  const bannerPreviewBase = device==='mobile' ? 360 : device==='tablet' ? 820 : (bannerKey==='wide-banner-1' ? 1000 : 1040);
  const bannerPreviewWidth = Math.max(device==='mobile'?300:240, Math.round(bannerPreviewBase * Math.max(10,Math.min(100,activeBannerWidthPercent)) / 100));
  const width=mode==='slides'
    ? (device==='desktop'?'100%':device==='tablet'?'820px':'390px')
    : `${bannerPreviewWidth}px`;
  const previewHeight=mode==='slides'
    ? (device==='desktop'?430:device==='tablet'?430:560)
    : Math.max(150,Number(
        device==='mobile'
          ? bannerDraft?.mobileHeightPx ?? bannerDraft?.tabletHeightPx ?? bannerDraft?.heightPx
          : device==='tablet'
            ? bannerDraft?.tabletHeightPx ?? bannerDraft?.heightPx
            : bannerDraft?.heightPx
        || activeBannerSection?.itemMinHeightPx
        || (bannerKey==='wide-banner-1'?330:bannerKey==='promo-large'?220:178)
      ));

  const previewBackgroundStyle=():React.CSSProperties=>{
    if(!owner?.imageUrl) return {};
    const imageMode=owner.imageMode||'cover';
    const imageSize=imageMode==='stretch'?'100% 100%':(imageMode==='original'||imageMode.startsWith('repeat'))?'auto':imageMode;
    const imageRepeat=imageMode==='repeat'?'repeat':imageMode==='repeat-x'?'repeat-x':imageMode==='repeat-y'?'repeat-y':'no-repeat';
    if(mode==='banners'&&bannerKey==='promo-large'){
      return {
        backgroundImage:`linear-gradient(90deg, rgba(0,0,0,.24), rgba(0,0,0,.62)), url(${owner.imageUrl})`,
        backgroundSize:`100% 100%, ${imageSize}`,
        backgroundRepeat:`no-repeat, ${imageRepeat}`,
        backgroundPosition:'center, center'
      };
    }
    return {
      backgroundImage:`url(${owner.imageUrl})`,
      backgroundSize:imageSize,
      backgroundRepeat:imageRepeat,
      backgroundPosition:'center'
    };
  };

  const renderElement=(key:SliderElementKey)=>{
    if(!owner||!visibleElement(key))return null;
    const slide=mode==='slides'?owner as SliderItem:null;
    const banner=mode==='banners'?owner as PageSectionItem:null;
    const common=`absolute select-none rounded-lg ${activeElement===key?'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent':''}`;
    const handle=<span
      className="absolute -left-2 -bottom-2 w-4 h-4 rounded-sm bg-blue-500 border-2 border-white shadow cursor-sw-resize z-20"
      onPointerDown={event=>startResize(event,key)}
      onPointerMove={resizeMove}
      onPointerUp={stopResize}
      onPointerCancel={stopResize}
      title="برای تغییر اندازه بکشید"
    />;
    const alignment=slide?.textAlignment||banner?.textAlignment||'right';
    if(key==='tag'){
      return <div onPointerDown={e=>startDrag(e,key)} onPointerMove={dragMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} className={common} style={{...positionStyle(key),backgroundColor:slide?.badgeBgColor||banner?.badgeBgColor||'#16a34a',color:slide?.badgeTextColor||banner?.badgeTextColor||'#ffffff',padding:'6px 9px',fontWeight:900,textAlign:alignment}}><Grip className="inline w-3 h-3 ml-1"/>{slide?.tag||banner?.badge}{handle}</div>;
    }
    if(key==='title'){
      return <div onPointerDown={e=>startDrag(e,key)} onPointerMove={dragMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} className={common} style={{...positionStyle(key),color:slide?.titleColor||banner?.titleColor||'#fff',fontWeight:900,lineHeight:1.2,textAlign:alignment}}>{owner.title}{handle}</div>;
    }
    if(key==='subtitle'){
      return <div onPointerDown={e=>startDrag(e,key)} onPointerMove={dragMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} className={common} style={{...positionStyle(key),color:slide?.subtitleColor||banner?.subtitleColor||'#e5e7eb',lineHeight:1.9,textAlign:alignment}}>{owner.subtitle}{handle}</div>;
    }
    return <div onPointerDown={e=>startDrag(e,key)} onPointerMove={dragMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} className={common} style={{...positionStyle(key),backgroundColor:slide?.buttonBgColor||banner?.buttonBgColor||'#f59e0b',color:slide?.buttonTextColor||banner?.buttonTextColor||'#111827',padding:'10px 12px',fontWeight:900,textAlign:'center'}}>{owner.buttonText}{handle}</div>;
  };

  return (
    <div className="slider-studio -m-4 sm:-m-6 lg:-m-8 bg-[#eef1f4] min-h-[calc(100vh-128px)]">
      <div className="min-h-14 px-4 py-2 bg-neutral-950 text-white sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <strong className="text-sm">مدیریت اسلایدر اصلی</strong>
            <span className="text-[9px] text-neutral-400 mr-2">مدیریت تصاویر چرخشی و تنظیمات نمایش اسلایدر بالای سایت</span>
          </div>

        </div>

        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button onClick={()=>setDevice('desktop')} className={`p-2 rounded ${device==='desktop'?'bg-blue-600':'text-neutral-400'}`}><Monitor className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('tablet')} className={`p-2 rounded ${device==='tablet'?'bg-blue-600':'text-neutral-400'}`}><Tablet className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('mobile')} className={`p-2 rounded ${device==='mobile'?'bg-blue-600':'text-neutral-400'}`}><Smartphone className="w-4 h-4"/></button>
        </div>

        <button onClick={save} disabled={!owner} className="h-9 px-4 rounded-lg bg-emerald-600 disabled:bg-neutral-600 text-white text-[10px] font-black inline-flex gap-1 items-center"><Save className="w-3.5 h-3.5"/>ذخیره</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_350px] min-h-[calc(100vh-184px)]">
        <aside className="bg-white border-l p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3"><strong className="text-xs">{mode==='slides'?'اسلایدها':'بنرهای صفحه اصلی'}</strong><button onClick={add} className="w-8 h-8 grid place-items-center rounded-lg bg-blue-600 text-white"><Plus className="w-4 h-4"/></button></div>

          {mode==='slides'?(
            <div className="space-y-2">
              {ordered.map((slide,index)=>(
                <button key={slide.id} onClick={()=>setSelectedId(slide.id)} className={`w-full rounded-xl border overflow-hidden text-right ${draft?.id===slide.id?'border-blue-500 ring-1 ring-blue-500':'border-neutral-200'}`}>
                  <div className="h-24 relative bg-neutral-900">
                    {slide.imageUrl&&<img src={slide.imageUrl} alt="" className="w-full h-full object-cover"/>}
                    <div className="absolute inset-0 bg-black/40"/>
                    <strong className="absolute right-2 bottom-2 left-2 text-[9px] text-white line-clamp-2">{slide.title}</strong>
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px]">#{index+1}</span>
                  </div>
                  <div className="p-2 flex justify-between items-center">
                    <span className={`text-[8px] font-bold ${slide.isActive?'text-emerald-600':'text-neutral-400'}`}>{slide.isActive?'فعال':'خاموش'}</span>
                    <span className="flex">
                      <span onClick={event=>{event.stopPropagation();moveSlide(slide.id,'up')}} className="p-1"><ArrowUp className="w-3 h-3"/></span>
                      <span onClick={event=>{event.stopPropagation();moveSlide(slide.id,'down')}} className="p-1"><ArrowDown className="w-3 h-3"/></span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ):(
            <div className="space-y-4">
              {bannerSections.map(section=>(
                <div key={section.id}>
                  <strong className="block text-[9px] text-neutral-500 mb-1.5">{section.title||section.sectionKey}</strong>
                  <div className="space-y-1.5">
                    {(section.items||[]).map((item,index)=>(
                      <button key={item.id} onClick={()=>selectBanner(section,item)} className={`w-full p-2 rounded-xl border text-right flex gap-2 items-center ${bannerSelection?.sectionId===section.id&&bannerSelection?.itemId===item.id?'border-blue-500 bg-blue-50':'border-neutral-200 bg-white'}`}>
                        <div className="w-16 h-11 rounded-lg bg-neutral-100 overflow-hidden shrink-0">{item.imageUrl&&<img src={item.imageUrl} alt="" className="w-full h-full object-cover"/>}</div>
                        <div className="min-w-0"><strong className="block text-[9px] truncate">{item.title||`بنر ${index+1}`}</strong><span className="text-[8px] text-neutral-400">{section.sectionKey||section.id}</span></div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!bannerSections.length&&<div className="p-6 rounded-xl border-2 border-dashed text-center text-[9px] text-neutral-400">سکشن بنری در صفحه اصلی پیدا نشد.</div>}
            </div>
          )}
        </aside>

        <main className="p-6 overflow-auto">
          <div className="mx-auto transition-all" style={{width,maxWidth:'100%'}}>
            <div className="h-8 bg-neutral-900 rounded-t-xl flex items-center gap-1.5 px-3"><span className="w-2 h-2 rounded-full bg-red-400"/><span className="w-2 h-2 rounded-full bg-amber-400"/><span className="w-2 h-2 rounded-full bg-emerald-400"/></div>
            {owner?(
              <div
                ref={canvasRef}
                className="relative overflow-hidden bg-neutral-900 shadow-2xl"
                style={{
                  minHeight:`${previewHeight}px`,
                  backgroundColor:mode==='slides'?(draft?.bgColor||'#111827'):(bannerDraft?.backgroundColor||'#111827'),
                  ...previewBackgroundStyle()
                }}
              >
                {mode==='slides'&&draft?.gradientOverlay!==false&&(
                  <div
                    className="absolute inset-0"
                    style={{
                      background:'linear-gradient(90deg, rgba(5,12,20,.08) 0%, rgba(5,12,20,.04) 40%, rgba(5,12,20,.48) 100%)',
                      opacity:Math.max(0,Math.min(1,(draft?.overlayOpacity??60)/100))
                    }}
                  />
                )}
                {(['tag','title','subtitle','button'] as SliderElementKey[]).map(renderElement)}
                <div className="absolute bottom-2 left-2 bg-black/55 text-white rounded-lg px-2 py-1 text-[8px] pointer-events-none">عنصر را جابه‌جا کنید؛ مربع آبی گوشه برای تغییر اندازه است</div>
              </div>
            ):<div className="min-h-[430px] bg-white grid place-items-center text-xs text-neutral-400">یک مورد را انتخاب کنید.</div>}
          </div>
        </main>

        <aside className="bg-white border-r p-4 overflow-y-auto">
          {!owner?<p className="text-xs text-neutral-400">موردی انتخاب نشده.</p>:<div className="space-y-4 text-[10px]">
            <div className="flex justify-between items-center">
              <div><strong className="text-sm">{mode==='slides'?'تنظیمات اسلاید':'تنظیمات بنر'}</strong><span className="block text-[8px] text-neutral-400 mt-1">{device==='desktop'?'چیدمان دسکتاپ':device==='tablet'?'چیدمان تبلت':'چیدمان موبایل'}</span></div>
              {mode==='slides'&&draft&&<button onClick={()=>patchSlide({isActive:!draft.isActive})} className={`px-2 py-1.5 rounded-lg ${draft.isActive?'bg-emerald-50 text-emerald-700':'bg-neutral-100'}`}>{draft.isActive?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>}
            </div>

            {device!=='desktop'&&(
              <label className="flex items-center justify-between p-3 rounded-xl border bg-neutral-50">
                <span><strong className="block text-[9px]">ارث‌بری از دسکتاپ</strong><small className="text-[8px] text-neutral-400">خاموش = جانمایی مستقل برای این دستگاه</small></span>
                <input type="checkbox" checked={inherited(owner,device)} onChange={event=>setInheritance(event.target.checked)}/>
              </label>
            )}

            <label className="block"><span className="font-bold">عنوان</span><input value={owner.title||''} onChange={event=>patchOwner({title:event.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
            <label className="block"><span className="font-bold">توضیح</span><textarea rows={3} value={owner.subtitle||''} onChange={event=>patchOwner({subtitle:event.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
            <div className="grid grid-cols-2 gap-2">
              {mode==='slides'
                ? <input value={(draft as SliderItem)?.tag||''} onChange={event=>patchSlide({tag:event.target.value})} className="p-2 border rounded" placeholder="برچسب"/>
                : <input value={(bannerDraft as PageSectionItem)?.badge||''} onChange={event=>patchBanner({badge:event.target.value})} className="p-2 border rounded" placeholder="برچسب"/>
              }
              <input value={owner.buttonText||''} onChange={event=>patchOwner({buttonText:event.target.value})} className="p-2 border rounded" placeholder="متن دکمه"/>
            </div>
            <LinkDestinationPicker
              label="مقصد دکمه یا بنر"
              value={mode==='slides'?(draft as SliderItem)?.link||'':(bannerDraft as PageSectionItem)?.link||''}
              onChange={value=>mode==='slides'?patchSlide({link:value}):patchBanner({link:value})}
            />
            <ImageUploadInput label={mode==='slides'?'تصویر اسلاید':'تصویر بنر'} value={owner.imageUrl||''} onChange={url=>patchOwner({imageUrl:url})} aspectRatio="banner" presetCategory="banners"/>
            <label className="block">
              <span className="font-bold">نحوه نمایش تصویر</span>
              <select value={owner.imageMode||'cover'} onChange={event=>patchOwner({imageMode:event.target.value as any})} className="w-full mt-1 p-2.5 border rounded-lg bg-white">
                <option value="cover">پوشش کامل کادر</option>
                <option value="contain">نمایش کامل تصویر بدون برش</option>
                <option value="stretch">کشیده‌شدن تا اندازه کادر</option>
                <option value="original">اندازه اصلی تصویر</option>
                <option value="repeat">تکرار در هر دو جهت</option>
                <option value="repeat-x">تکرار افقی</option>
                <option value="repeat-y">تکرار عمودی</option>
              </select>
            </label>

            {mode==='banners'&&bannerDraft&&(
              <section className="p-3 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                <div>
                  <strong className="block text-[9px]">ابعاد مستقل این بنر</strong>
                  <p className="text-[8px] text-neutral-500 mt-1">عرض و ارتفاع این بنر برای هر دستگاه مستقل است؛ مثلاً می‌توانید یک بنر را ۷۰٪ و بنر کناری را ۳۰٪ تنظیم کنید.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="block text-[8px] font-bold mb-1">عرض در {device==='desktop'?'دسکتاپ':device==='tablet'?'تبلت':'موبایل'} ٪</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={device==='desktop'?(bannerDraft.widthPercent??100):device==='tablet'?(bannerDraft.tabletWidthPercent??bannerDraft.widthPercent??100):(bannerDraft.mobileWidthPercent??100)}
                      onChange={event=>{
                        const value=Math.max(10,Math.min(100,Number(event.target.value||100)));
                        patchBanner(device==='desktop'?{widthPercent:value}:device==='tablet'?{tabletWidthPercent:value}:{mobileWidthPercent:value});
                      }}
                      className="w-full p-2 border rounded-lg font-mono"
                    />
                  </label>
                  <label>
                    <span className="block text-[8px] font-bold mb-1">ارتفاع در {device==='desktop'?'دسکتاپ':device==='tablet'?'تبلت':'موبایل'} px</span>
                    <input
                      type="number"
                      min="80"
                      max="900"
                      value={device==='desktop'?(bannerDraft.heightPx??previewHeight):device==='tablet'?(bannerDraft.tabletHeightPx??bannerDraft.heightPx??previewHeight):(bannerDraft.mobileHeightPx??bannerDraft.tabletHeightPx??bannerDraft.heightPx??previewHeight)}
                      onChange={event=>{
                        const value=Math.max(80,Math.min(900,Number(event.target.value||178)));
                        patchBanner(device==='desktop'?{heightPx:value}:device==='tablet'?{tabletHeightPx:value}:{mobileHeightPx:value});
                      }}
                      className="w-full p-2 border rounded-lg font-mono"
                    />
                  </label>
                </div>
              </section>
            )}

            <section className="p-3 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
              <strong className="block text-[9px]">جانمایی دقیق عنصر انتخاب‌شده</strong>
              <select value={activeElement} onChange={event=>setActiveElement(event.target.value as SliderElementKey)} className="w-full p-2 border rounded-lg bg-white">
                <option value="tag">برچسب</option>
                <option value="title">عنوان</option>
                <option value="subtitle">توضیح</option>
                <option value="button">دکمه</option>
              </select>
              {(()=>{
                const pos=elementPosition(owner,device,activeElement,activeDefaults);
                return <>
                  <div className="grid grid-cols-2 gap-2">
                    <label><span className="block text-[8px] font-bold mb-1">موقعیت افقی ٪</span><input type="number" min="0" max="100" value={Number(pos.x||0)} onChange={event=>setElementPosition(activeElement,{...pos,x:Number(event.target.value)})} className="w-full p-2 border rounded-lg font-mono"/></label>
                    <label><span className="block text-[8px] font-bold mb-1">موقعیت عمودی ٪</span><input type="number" min="0" max="100" value={Number(pos.y||0)} onChange={event=>setElementPosition(activeElement,{...pos,y:Number(event.target.value)})} className="w-full p-2 border rounded-lg font-mono"/></label>
                    <label><span className="block text-[8px] font-bold mb-1">عرض ٪</span><input type="number" min="6" max="95" value={Number(pos.width||activeDefaults[activeElement].width||20)} onChange={event=>setElementPosition(activeElement,{...pos,width:Number(event.target.value)})} className="w-full p-2 border rounded-lg font-mono"/></label>
                    <label><span className="block text-[8px] font-bold mb-1">ارتفاع ٪ (اختیاری)</span><input type="number" min="0" max="80" value={Number(pos.height||0)} onChange={event=>setElementPosition(activeElement,{...pos,height:Number(event.target.value)||undefined})} className="w-full p-2 border rounded-lg font-mono"/></label>
                    <label><span className="block text-[8px] font-bold mb-1">اندازه فونت</span><input type="number" min="7" max="100" value={Number(pos.fontSizePx||activeDefaults[activeElement].fontSizePx||12)} onChange={event=>setElementPosition(activeElement,{...pos,fontSizePx:Number(event.target.value)})} className="w-full p-2 border rounded-lg font-mono"/></label>
                    <label><span className="block text-[8px] font-bold mb-1">شکستن متن</span><select value={pos.wrap||activeDefaults[activeElement].wrap||'wrap'} onChange={event=>setElementPosition(activeElement,{...pos,wrap:event.target.value as 'wrap'|'nowrap'})} className="w-full p-2 border rounded-lg bg-white"><option value="wrap">شکستن خودکار مجاز</option><option value="nowrap">همیشه یک‌خطی</option></select></label>
                  </div>
                  <p className="text-[8px] text-neutral-500">همچنین می‌توانید خود عنصر را جابه‌جا کنید و مربع آبی گوشه آن را برای تغییر اندازه بکشید.</p>
                </>;
              })()}
            </section>

            <section className="p-3 rounded-xl border space-y-3">
              <strong className="block text-[9px]">رنگ و تراز عناصر</strong>
              <div><span className="font-bold block mb-1">تراز متن</span><div className="grid grid-cols-3 gap-1"><button onClick={()=>patchOwner({textAlignment:'right'})} className={`p-2 border rounded flex justify-center ${owner.textAlignment==='right'?'bg-blue-50 border-blue-500':''}`}><AlignRight className="w-4 h-4"/></button><button onClick={()=>patchOwner({textAlignment:'center'})} className={`p-2 border rounded flex justify-center ${owner.textAlignment==='center'?'bg-blue-50 border-blue-500':''}`}><AlignCenter className="w-4 h-4"/></button><button onClick={()=>patchOwner({textAlignment:'left'})} className={`p-2 border rounded flex justify-center ${owner.textAlignment==='left'?'bg-blue-50 border-blue-500':''}`}><AlignLeft className="w-4 h-4"/></button></div></div>
              <div className="grid grid-cols-2 gap-2">
                <label><span>رنگ عنوان</span><input type="color" value={owner.titleColor||'#ffffff'} onChange={event=>patchOwner({titleColor:event.target.value})} className="w-full h-9"/></label>
                <label><span>رنگ توضیح</span><input type="color" value={owner.subtitleColor||'#e5e7eb'} onChange={event=>patchOwner({subtitleColor:event.target.value})} className="w-full h-9"/></label>
                <label><span>پس‌زمینه دکمه</span><input type="color" value={owner.buttonBgColor||'#f59e0b'} onChange={event=>patchOwner({buttonBgColor:event.target.value})} className="w-full h-9"/></label>
                <label><span>رنگ متن دکمه</span><input type="color" value={owner.buttonTextColor||'#111827'} onChange={event=>patchOwner({buttonTextColor:event.target.value})} className="w-full h-9"/></label>
                <label><span>پس‌زمینه برچسب</span><input type="color" value={owner.badgeBgColor||'#16a34a'} onChange={event=>patchOwner({badgeBgColor:event.target.value})} className="w-full h-9"/></label>
                <label><span>رنگ متن برچسب</span><input type="color" value={owner.badgeTextColor||'#ffffff'} onChange={event=>patchOwner({badgeTextColor:event.target.value})} className="w-full h-9"/></label>
              </div>
            </section>

            {mode==='slides'&&draft&&<>
              <label><span>شدت لایه تیره: {draft.overlayOpacity??60}%</span><input type="range" min="0" max="100" value={draft.overlayOpacity??60} onChange={event=>patchSlide({overlayOpacity:Number(event.target.value)})} className="w-full"/></label>
              <label className="flex items-center justify-between p-2 border rounded-lg"><span>گرادیان روی تصویر</span><input type="checkbox" checked={draft.gradientOverlay!==false} onChange={event=>patchSlide({gradientOverlay:event.target.checked})}/></label>
            </>}

            <div className="pt-3 border-t flex gap-2"><button onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black inline-flex items-center justify-center gap-1"><Save className="w-3.5 h-3.5"/>ذخیره</button><button onClick={removeCurrent} className="w-10 grid place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4"/></button></div>
          </div>}
        </aside>
      </div>
    </div>
  );
};
