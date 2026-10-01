import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Columns3,
  CopyPlus,
  Eye,
  EyeOff,
  ExternalLink,
  Laptop,
  LayoutTemplate,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PageSection, PageSectionItem, SeoEntityDraft, SitePage } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { RichTextEditor } from '../common/RichTextEditor';
import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';

type Device = 'desktop' | 'tablet' | 'mobile';
type InspectorTab = 'content' | 'layout' | 'style' | 'items' | 'seo';

const defaultSection = (order:number):PageSection => ({
  id:`sec-${Date.now()}`,
  sectionKey:`custom-${Date.now()}`,
  title:'سکشن جدید',
  subtitle:'زیرعنوان سکشن',
  content:'',
  imageUrl:'',
  buttonText:'',
  buttonLink:'shop',
  isVisible:true,
  order,
  layout:'boxed',
  desktopColumns:3,
  tabletColumns:2,
  mobileColumns:1,
  fullWidth:false,
  widthPercent:100,
  tabletWidthPercent:100,
  mobileWidthPercent:100,
  maxWidthPx:1280,
  backgroundColor:'#ffffff',
  textColor:'#111827',
  borderRadiusPx:0,
  itemRadiusPx:10,
  paddingTopPx:28,
  paddingBottomPx:28,
  paddingInlinePx:20,
  gapPx:16,
  minHeightPx:0,
  contentAlign:'right',
  maxItems:0,
  imageSizePx:72,
  backgroundImageOpacity:100,
  itemAspectRatio:'auto',
  marginTopPx:0,
  marginBottomPx:0,
  itemMinHeightPx:0,
  itemImageWidthPx:72,
  itemImageHeightPx:72,
  itemImageFit:'contain',
  itemTextAlign:'right',
  mobileDisplayMode:'grid',
  mobileItemMinWidthPx:240,
  layoutVariant:'default',
  items:[]
});

export const AdminVisualPageBuilder: React.FC<{onNavigate?:(view:string,param?:string)=>void}> = ({onNavigate}) => {
  const {
    pages,
    updatePage,
    deletePage,
    addSection,
    updateSection,
    deleteSection,
    isLiveEditActive,
    setIsLiveEditActive,
    showToast
  } = useStore();

  const [pageId,setPageId] = useState(pages[0]?.id || '');
  const page = pages.find(item=>item.id===pageId) || pages[0];
  const sortedSections = useMemo(()=>[...(page?.sections||[])].sort((a,b)=>a.order-b.order),[page]);
  const [sectionId,setSectionId] = useState<string>(sortedSections[0]?.id || '');
  const selected = sortedSections.find(item=>item.id===sectionId) || sortedSections[0];
  const [draft,setDraft] = useState<PageSection | null>(selected ? {...selected} : null);
  const [device,setDevice] = useState<Device>('desktop');
  const [inspectorTab,setInspectorTab] = useState<InspectorTab>('content');
  const [seoDraft,setSeoDraft] = useState<SeoEntityDraft | undefined>(page?.seo);

  useEffect(()=>{
    if(!page) return;
    const first=[...page.sections].sort((a,b)=>a.order-b.order)[0];
    if(!page.sections.some(section=>section.id===sectionId)) setSectionId(first?.id||'');
  },[pageId,page?.sections.length]);

  useEffect(()=>{
    const next=sortedSections.find(item=>item.id===sectionId) || sortedSections[0];
    setDraft(next ? {...next,items:(next.items||[]).map(item=>({...item}))} : null);
  },[sectionId,pageId,selected?.id]);

  useEffect(()=>setSeoDraft(page?.seo),[page?.id]);

  if(!page){
    return <div className="p-10 bg-white rounded-3xl border text-center text-xs text-neutral-500">برگه‌ای وجود ندارد.</div>;
  }

  const patch=(partial:Partial<PageSection>)=>setDraft(current=>current?{...current,...partial}:current);

  const ensureRepeaterSlots=(count:number,current:PageSection|null=draft)=>{
    if(!current)return[];
    const items=[...(current.items||[])];
    const shouldGrow=items.length>0||/promo|banner|testimonial|brand|manufacturer|service|feature|benefit|logo/i.test(current.sectionKey||'');
    if(!shouldGrow)return items;
    while(items.length<count){
      items.push({
        id:`item-${Date.now()}-${items.length+1}-${Math.random().toString(36).slice(2,6)}`,
        title:'',
        subtitle:'',
        content:'',
        imageUrl:'',
        link:'shop',
        buttonText:'مشاهده',
        isVisible:true,
        order:items.length+1
      });
    }
    return items.map((item,index)=>({...item,order:index+1}));
  };

  const setDesktopColumns=(count:number)=>{
    if(!draft)return;
    setDraft({...draft,desktopColumns:count,items:ensureRepeaterSlots(count,draft)});
  };

  const saveDraft=()=>{
    if(!draft) return;
    updateSection(page.slug,draft);
    showToast('سکشن ذخیره شد.');
  };

  const addNewSection=()=>{
    const section=defaultSection((page.sections.length||0)+1);
    addSection(page.slug,section);
    setSectionId(section.id);
    setDraft(section);
    setInspectorTab('content');
  };

  const duplicateSection=()=>{
    if(!selected) return;
    const copy:PageSection={...selected,id:`sec-${Date.now()}`,sectionKey:`custom-${Date.now()}`,order:page.sections.length+1,items:(selected.items||[]).map((item,index)=>({...item,id:`item-${Date.now()}-${index}`}))};
    addSection(page.slug,copy);
    setSectionId(copy.id);
  };

  const move=(id:string,dir:'up'|'down')=>{
    const list=[...sortedSections];
    const index=list.findIndex(item=>item.id===id);
    const target=dir==='up'?index-1:index+1;
    if(index<0||target<0||target>=list.length)return;
    [list[index],list[target]]=[list[target],list[index]];
    updatePage({...page,sections:list.map((item,i)=>({...item,order:i+1}))});
  };

  const createPage=()=>{
    const title=window.prompt('نام برگه جدید:','برگه جدید')?.trim();
    if(!title)return;
    const slugInput=window.prompt('Slug انگلیسی:','new-page')?.trim().toLowerCase().replace(/\s+/g,'-');
    if(!slugInput)return;
    const newPage:SitePage={id:`page-${Date.now()}`,slug:slugInput,title,description:'',updatedAt:new Date().toLocaleDateString('fa-IR'),isSystem:false,sections:[defaultSection(1)]};
    updatePage(newPage);
    setPageId(newPage.id);
  };

  const previewWidth=device==='desktop'?'100%':device==='tablet'?'820px':'390px';
  const previewColumns=(section:PageSection)=>device==='desktop'?(section.desktopColumns||3):device==='tablet'?(section.tabletColumns||Math.min(section.desktopColumns||3,2)):(section.mobileColumns||1);
  const previewWidthPercent=(section:PageSection)=>device==='desktop'?(section.widthPercent??100):device==='tablet'?(section.tabletWidthPercent??section.widthPercent??100):(section.mobileWidthPercent??section.widthPercent??100);

  const updateItem=(id:string,partial:Partial<PageSectionItem>)=>{
    if(!draft)return;
    patch({items:(draft.items||[]).map(item=>item.id===id?{...item,...partial}:item)});
  };

  const removeItem=(id:string)=>draft&&patch({items:(draft.items||[]).filter(item=>item.id!==id)});
  const addItem=()=>{
    const items=draft?.items||[];
    patch({items:[...items,{id:`item-${Date.now()}`,title:'آیتم جدید',subtitle:'',content:'',imageUrl:'',link:'shop',buttonText:'مشاهده',isVisible:true,order:items.length+1}]});
  };

  const renderCanvasSection=(section:PageSection)=>{
    const source=section.id===draft?.id?draft:section;
    const items=(source.items||[]).filter(item=>item.isVisible!==false);
    const isSelected=source.id===selected?.id;
    const width=source.fullWidth?100:previewWidthPercent(source);
    const max=source.fullWidth||source.maxWidthPx===0?'none':`${source.maxWidthPx||1280}px`;
    return (
      <div
        key={source.id}
        onClick={()=>setSectionId(source.id)}
        className={`visual-builder-section relative cursor-pointer transition-all ${isSelected?'ring-2 ring-blue-500 ring-offset-2':'hover:ring-1 hover:ring-blue-300'} ${source.isVisible===false?'opacity-45':''}`}
        style={{
          width:`${width}%`,maxWidth:max,marginInline:'auto',
          backgroundColor:source.backgroundColor||'#fff',color:source.textColor||'#111827',
          borderRadius:`${source.borderRadiusPx||0}px`,
          paddingTop:`${Math.min(source.paddingTopPx??28,70)}px`,paddingBottom:`${Math.min(source.paddingBottomPx??28,70)}px`,
          paddingInline:`${Math.min(source.paddingInlinePx??20,60)}px`,minHeight:`${Math.min(source.minHeightPx||0,500)}px`,
          backgroundImage:source.imageUrl&&source.imageMode==='cover'?`linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url(${source.imageUrl})`:undefined,
          backgroundSize:'cover',backgroundPosition:'center',textAlign:source.contentAlign||'right'
        }}
      >
        <span className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-blue-600 text-white text-[8px] font-bold">{source.title||source.sectionKey||'سکشن'}</span>
        <div className={`flex gap-5 ${source.imageMode==='side'&&source.imageUrl?'items-center':''} ${source.imageMode==='side'&&source.imageUrl?'flex-row':''}`}>
          <div className="flex-1 min-w-0 pt-6">
            {source.badge&&<span className="inline-block px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[8px] font-bold">{source.badge}</span>}
            <h2 className="font-black text-lg mt-2">{source.title}</h2>
            {source.subtitle&&<p className="text-[10px] opacity-70 mt-1">{source.subtitle}</p>}
            {source.content&&<div className="text-[9px] leading-6 opacity-80 mt-3 line-clamp-4" dangerouslySetInnerHTML={{__html:source.content}}/>}
            {source.buttonText&&<button className="mt-3 px-3 py-2 rounded-lg bg-neutral-900 text-white text-[8px] font-bold">{source.buttonText}</button>}
          </div>
          {source.imageUrl&&source.imageMode!=='cover'&&<img src={source.imageUrl} alt="" className="max-w-[42%] max-h-40 object-contain rounded-xl"/>}
        </div>
        {items.length>0&&(
          <div className="grid mt-5" style={{gridTemplateColumns:`repeat(${previewColumns(source)},minmax(0,1fr))`,gap:`${source.gapPx??16}px`}}>
            {items.slice(0,source.maxItems&&source.maxItems>0?source.maxItems:items.length).map(item=>(
              <div key={item.id} className="p-3 rounded-xl border border-black/10 bg-white/80 text-neutral-900 min-w-0">
                {item.imageUrl&&<img src={item.imageUrl} alt="" className="w-full h-20 object-contain mb-2"/>}
                <strong className="block text-[9px] truncate">{item.title}</strong>
                {item.subtitle&&<span className="block text-[8px] text-neutral-500 mt-1 truncate">{item.subtitle}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const pagePreviewUrl =
    page.slug === 'home' ? '/' :
    page.slug === 'part-request' ? '/part-request' :
    `/page/${encodeURIComponent(page.slug)}`;

  return (
    <div className="visual-page-builder -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-128px)] bg-[#eef1f4]">
      <div className="h-14 px-3 bg-neutral-950 text-white flex items-center justify-between gap-3 sticky top-16 z-20">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-400"/>
          <select value={page.id} onChange={e=>setPageId(e.target.value)} className="h-9 min-w-44 px-2 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold">
            {pages.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button onClick={createPage} className="h-9 px-3 rounded-lg bg-neutral-800 text-[10px] font-bold inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>برگه</button>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button onClick={()=>setDevice('desktop')} className={`p-2 rounded ${device==='desktop'?'bg-blue-600':'text-neutral-400'}`} title="دسکتاپ"><Monitor className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('tablet')} className={`p-2 rounded ${device==='tablet'?'bg-blue-600':'text-neutral-400'}`} title="تبلت"><Tablet className="w-4 h-4"/></button>
          <button onClick={()=>setDevice('mobile')} className={`p-2 rounded ${device==='mobile'?'bg-blue-600':'text-neutral-400'}`} title="موبایل"><Smartphone className="w-4 h-4"/></button>
        </div>
        <div className="flex items-center gap-2">
          <a href={pagePreviewUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-neutral-800 text-[10px] font-bold inline-flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> نمایش
          </a>
          <button onClick={()=>{setIsLiveEditActive(true);onNavigate?.(page.slug==='home'?'home':page.slug==='part-request'?'part-request':'page',page.slug==='home'||page.slug==='part-request'?undefined:page.slug);}} className={`h-9 px-3 rounded-lg text-[10px] font-black ${isLiveEditActive?'bg-amber-500 text-black':'bg-neutral-800'}`}>ویرایش زنده در سایت</button>
          <button onClick={saveDraft} disabled={!draft} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[10px] font-black inline-flex items-center gap-1"><Save className="w-3.5 h-3.5"/>ذخیره</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)_330px] min-h-[calc(100vh-184px)]">
        <aside className="bg-white border-l border-neutral-200 p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <strong className="text-xs">Navigator</strong>
            <div className="flex gap-1">
              <button onClick={addNewSection} className="w-7 h-7 grid place-items-center rounded bg-blue-600 text-white"><Plus className="w-3.5 h-3.5"/></button>
              <button onClick={duplicateSection} disabled={!selected} className="w-7 h-7 grid place-items-center rounded bg-neutral-100 disabled:opacity-30"><CopyPlus className="w-3.5 h-3.5"/></button>
            </div>
          </div>
          <div className="space-y-1.5">
            {sortedSections.map((section,index)=>(
              <button key={section.id} onClick={()=>setSectionId(section.id)} className={`w-full p-2.5 rounded-lg border text-right flex items-center gap-2 ${selected?.id===section.id?'bg-blue-50 border-blue-400':'bg-white border-neutral-200'}`}>
                <div className="w-6 h-6 rounded bg-neutral-100 grid place-items-center text-[9px] font-bold">{index+1}</div>
                <div className="min-w-0 flex-1"><strong className="block text-[9px] truncate">{section.title||'بدون عنوان'}</strong><span className="text-[7px] text-neutral-400">{section.fullWidth?'Full width':`${section.widthPercent??100}% / ${section.maxWidthPx||1280}px`}</span></div>
                <div className="flex">
                  <span onClick={e=>{e.stopPropagation();move(section.id,'up')}} className="p-1"><ArrowUp className="w-3 h-3"/></span>
                  <span onClick={e=>{e.stopPropagation();move(section.id,'down')}} className="p-1"><ArrowDown className="w-3 h-3"/></span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="p-6 overflow-auto">
          <div className="mx-auto bg-white shadow-2xl transition-all duration-300 min-h-[900px] overflow-hidden" style={{width:previewWidth,maxWidth:'100%'}}>
            <div className="h-8 bg-neutral-900 flex items-center gap-1.5 px-3"><span className="w-2 h-2 bg-red-400 rounded-full"/><span className="w-2 h-2 bg-amber-400 rounded-full"/><span className="w-2 h-2 bg-emerald-400 rounded-full"/></div>
            <div className="bg-neutral-50 py-4 space-y-4 min-h-[860px]">
              {sortedSections.map(renderCanvasSection)}
              <button onClick={addNewSection} className="mx-auto w-[calc(100%-32px)] py-5 border-2 border-dashed rounded-xl text-neutral-400 text-[10px] font-bold hover:border-blue-400 hover:text-blue-600"><Plus className="w-4 h-4 mx-auto mb-1"/>افزودن سکشن</button>
            </div>
          </div>
        </main>

        <aside className="bg-white border-r border-neutral-200 overflow-y-auto">
          <div className="grid grid-cols-5 border-b sticky top-0 bg-white z-10">
            {(['content','layout','style','items','seo'] as InspectorTab[]).map(tab=><button key={tab} onClick={()=>setInspectorTab(tab)} className={`py-3 text-[8px] font-black ${inspectorTab===tab?'text-blue-600 border-b-2 border-blue-600':'text-neutral-500'}`}>{tab==='content'?'محتوا':tab==='layout'?'چیدمان':tab==='style'?'استایل':tab==='items'?'آیتم‌ها':'SEO'}</button>)}
          </div>

          {!draft ? <div className="p-6 text-xs text-neutral-400">یک سکشن را انتخاب کن.</div> : (
            <div className="p-4 space-y-4 text-[10px]">
              {inspectorTab==='content'&&<>
                <label className="block"><span className="font-bold">عنوان</span><input value={draft.title} onChange={e=>patch({title:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <label className="block"><span className="font-bold">زیرعنوان</span><input value={draft.subtitle||''} onChange={e=>patch({subtitle:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <label className="block"><span className="font-bold">Badge</span><input value={draft.badge||''} onChange={e=>patch({badge:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <RichTextEditor label="محتوا" value={draft.content||''} onChange={value=>patch({content:value})}/>
                <ImageUploadInput label="تصویر" value={draft.imageUrl||''} onChange={url=>patch({imageUrl:url})} aspectRatio="banner" presetCategory="banners"/>
                <div className="grid grid-cols-2 gap-2"><input value={draft.buttonText||''} onChange={e=>patch({buttonText:e.target.value})} className="p-2 border rounded-lg" placeholder="متن دکمه"/><input dir="ltr" value={draft.buttonLink||''} onChange={e=>patch({buttonLink:e.target.value})} className="p-2 border rounded-lg text-left" placeholder="link"/></div>
              </>}

              {inspectorTab==='layout'&&<>
                <div><span className="font-bold block mb-1">Container</span><div className="grid grid-cols-3 gap-1">
                  <button onClick={()=>patch({fullWidth:true,widthPercent:100,maxWidthPx:0})} className={`p-2 rounded border ${draft.fullWidth?'bg-blue-600 text-white':''}`}>تمام عرض</button>
                  <button onClick={()=>patch({fullWidth:false,widthPercent:100,maxWidthPx:1280})} className={`p-2 rounded border ${!draft.fullWidth&&draft.widthPercent===100&&draft.maxWidthPx===1280?'bg-blue-600 text-white':''}`}>Boxed</button>
                  <button onClick={()=>patch({fullWidth:false,maxWidthPx:draft.maxWidthPx||1100})} className="p-2 rounded border">سفارشی</button>
                </div></div>
                {!draft.fullWidth&&<>
                  <label className="block"><span>عرض دسکتاپ: {draft.widthPercent??100}%</span><input type="range" min="20" max="100" value={draft.widthPercent??100} onChange={e=>patch({widthPercent:Number(e.target.value)})} className="w-full"/></label>
                  <label className="block"><span>عرض تبلت: {draft.tabletWidthPercent??draft.widthPercent??100}%</span><input type="range" min="20" max="100" value={draft.tabletWidthPercent??draft.widthPercent??100} onChange={e=>patch({tabletWidthPercent:Number(e.target.value)})} className="w-full"/></label>
                  <label className="block"><span>عرض موبایل: {draft.mobileWidthPercent??draft.widthPercent??100}%</span><input type="range" min="20" max="100" value={draft.mobileWidthPercent??draft.widthPercent??100} onChange={e=>patch({mobileWidthPercent:Number(e.target.value)})} className="w-full"/></label>
                  <label className="block"><span>حداکثر عرض px</span><input type="number" value={draft.maxWidthPx??1280} onChange={e=>patch({maxWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                </>}
                <div className="grid grid-cols-3 gap-2">
                  <label><span>Desktop ستون</span><input type="number" min="1" max="12" value={draft.desktopColumns??3} onChange={e=>setDesktopColumns(Number(e.target.value))} className="w-full p-2 border rounded"/></label>
                  <label><span>Tablet ستون</span><input type="number" min="1" max="8" value={draft.tabletColumns??2} onChange={e=>patch({tabletColumns:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>Mobile ستون</span><input type="number" min="1" max="4" value={draft.mobileColumns??1} onChange={e=>patch({mobileColumns:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                </div>
                <div className="grid grid-cols-3 gap-1"><button onClick={()=>patch({contentAlign:'right'})} className="p-2 border rounded flex justify-center"><AlignRight className="w-4 h-4"/></button><button onClick={()=>patch({contentAlign:'center'})} className="p-2 border rounded flex justify-center"><AlignCenter className="w-4 h-4"/></button><button onClick={()=>patch({contentAlign:'left'})} className="p-2 border rounded flex justify-center"><AlignLeft className="w-4 h-4"/></button></div>
                <div className="grid grid-cols-2 gap-2">
                  <label><span>فاصله آیتم‌ها</span><input type="number" value={draft.gapPx??16} onChange={e=>patch({gapPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>حداقل ارتفاع آیتم</span><input type="number" value={draft.itemMinHeightPx??0} onChange={e=>patch({itemMinHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>حداقل عرض آیتم موبایل</span><input type="number" min="120" max="600" value={draft.mobileItemMinWidthPx??240} onChange={e=>patch({mobileItemMinWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>نمایش موبایل</span><select value={draft.mobileDisplayMode||'grid'} onChange={e=>patch({mobileDisplayMode:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="grid">Grid</option><option value="scroll">اسکرول افقی</option></select></label>
                  <label><span>چیدمان اختصاصی</span><select value={draft.layoutVariant||'default'} onChange={e=>patch({layoutVariant:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="default">پیش‌فرض</option><option value="uniform">یکنواخت</option><option value="mosaic">موزاییکی</option><option value="compact">فشرده</option></select></label>
                </div>
              </>}

              {inspectorTab==='style'&&<>
                <div className="grid grid-cols-2 gap-2"><label><span>پس‌زمینه</span><input type="color" value={draft.backgroundColor||'#ffffff'} onChange={e=>patch({backgroundColor:e.target.value})} className="w-full h-10"/></label><label><span>رنگ متن</span><input type="color" value={draft.textColor||'#111827'} onChange={e=>patch({textColor:e.target.value})} className="w-full h-10"/></label></div>
                <div className="grid grid-cols-2 gap-2"><label><span>Padding بالا</span><input type="number" value={draft.paddingTopPx??28} onChange={e=>patch({paddingTopPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label><label><span>Padding پایین</span><input type="number" value={draft.paddingBottomPx??28} onChange={e=>patch({paddingBottomPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label></div>
                <label><span>Padding افقی</span><input type="number" value={draft.paddingInlinePx??20} onChange={e=>patch({paddingInlinePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                <div className="grid grid-cols-2 gap-2">
                  <label><span>فاصله بالا</span><input type="number" value={draft.marginTopPx??0} onChange={e=>patch({marginTopPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>فاصله پایین</span><input type="number" value={draft.marginBottomPx??0} onChange={e=>patch({marginBottomPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>عنوان سکشن px</span><input type="number" value={draft.headingFontSizePx??18} onChange={e=>patch({headingFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>زیرعنوان px</span><input type="number" value={draft.subtitleFontSizePx??11} onChange={e=>patch({subtitleFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>عنوان آیتم px</span><input type="number" value={draft.itemTitleFontSizePx??14} onChange={e=>patch({itemTitleFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>متن آیتم px</span><input type="number" value={draft.itemContentFontSizePx??11} onChange={e=>patch({itemContentFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>عرض تصویر آیتم</span><input type="number" value={draft.itemImageWidthPx??draft.imageSizePx??72} onChange={e=>patch({itemImageWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>ارتفاع تصویر آیتم</span><input type="number" value={draft.itemImageHeightPx??draft.imageSizePx??72} onChange={e=>patch({itemImageHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                </div>
                <div className="grid grid-cols-2 gap-2"><label><span>گردی سکشن</span><input type="number" value={draft.borderRadiusPx??0} onChange={e=>patch({borderRadiusPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label><label><span>گردی کارت</span><input type="number" value={draft.itemRadiusPx??10} onChange={e=>patch({itemRadiusPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label></div>
                <label><span>حداقل ارتفاع</span><input type="number" value={draft.minHeightPx??0} onChange={e=>patch({minHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                <div className="grid grid-cols-2 gap-2">
                  <label><span>Fit تصویر آیتم</span><select value={draft.itemImageFit||'contain'} onChange={e=>patch({itemImageFit:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="contain">Contain</option><option value="cover">Cover</option></select></label>
                  <label><span>تراز متن آیتم</span><select value={draft.itemTextAlign||'right'} onChange={e=>patch({itemTextAlign:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                </div>
                <select value={draft.imageMode||'side'} onChange={e=>patch({imageMode:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="side">تصویر کنار محتوا</option><option value="cover">پس‌زمینه Cover</option><option value="full">تمام تصویر</option><option value="contain">Contain</option><option value="banner">Banner</option></select>
              </>}

              {inspectorTab==='items'&&<>
                <div className="flex items-center justify-between"><strong>Repeater Items</strong><button onClick={addItem} className="px-2 py-1.5 bg-blue-600 text-white rounded inline-flex gap-1 items-center"><Plus className="w-3 h-3"/>آیتم</button></div>
                <div className="space-y-3">
                  {(draft.items||[]).map((item,index)=><div key={item.id} className="p-3 rounded-xl border bg-neutral-50 space-y-2">
                    <div className="flex justify-between"><strong>آیتم {index+1}</strong><button onClick={()=>removeItem(item.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5"/></button></div>
                    <input value={item.title||''} onChange={e=>updateItem(item.id,{title:e.target.value})} className="w-full p-2 border rounded" placeholder="عنوان"/>
                    <input value={item.subtitle||''} onChange={e=>updateItem(item.id,{subtitle:e.target.value})} className="w-full p-2 border rounded" placeholder="زیرعنوان"/>
                    <ImageUploadInput value={item.imageUrl||''} onChange={url=>updateItem(item.id,{imageUrl:url})} aspectRatio="square" presetCategory="parts"/>
                    <div className="grid grid-cols-2 gap-2">
                      <label><span className="block text-[8px] mb-1">عرض تصویر</span><input type="number" value={item.imageWidthPx??draft.itemImageWidthPx??draft.imageSizePx??72} onChange={e=>updateItem(item.id,{imageWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                      <label><span className="block text-[8px] mb-1">ارتفاع تصویر</span><input type="number" value={item.imageHeightPx??draft.itemImageHeightPx??draft.imageSizePx??72} onChange={e=>updateItem(item.id,{imageHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                      <label><span className="block text-[8px] mb-1">گردی کارت</span><input type="number" value={item.borderRadiusPx??draft.itemRadiusPx??10} onChange={e=>updateItem(item.id,{borderRadiusPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                      <label><span className="block text-[8px] mb-1">فونت عنوان</span><input type="number" value={item.titleFontSizePx??draft.itemTitleFontSizePx??14} onChange={e=>updateItem(item.id,{titleFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2"><input value={item.buttonText||''} onChange={e=>updateItem(item.id,{buttonText:e.target.value})} className="p-2 border rounded" placeholder="دکمه"/><input dir="ltr" value={item.link||''} onChange={e=>updateItem(item.id,{link:e.target.value})} className="p-2 border rounded text-left" placeholder="link"/></div>
                  </div>)}
                </div>
              </>}

              {inspectorTab==='seo'&&<AdminEntitySeoPanel entityType="page" entityId={page.id} entityTitle={page.title} value={seoDraft} images={page.sections.flatMap(section=>[section.imageUrl||'',...(section.items||[]).map(item=>item.imageUrl||'')]).filter(Boolean)} onChange={setSeoDraft}/>}
              {inspectorTab==='seo'&&<button onClick={()=>updatePage({...page,seo:seoDraft})} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black">ذخیره SEO برگه</button>}

              <div className="pt-3 border-t flex gap-2">
                <button onClick={saveDraft} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black inline-flex items-center justify-center gap-1"><Save className="w-3.5 h-3.5"/>ذخیره سکشن</button>
                <button onClick={()=>patch({isVisible:!draft.isVisible})} className="w-10 grid place-items-center rounded-xl border">{draft.isVisible?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
                <button onClick={()=>{if(window.confirm('سکشن حذف شود؟')){deleteSection(page.slug,draft.id);setSectionId('');}}} className="w-10 grid place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
