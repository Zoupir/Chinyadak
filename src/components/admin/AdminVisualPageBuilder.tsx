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
import { LinkDestinationPicker } from '../common/LinkDestinationPicker';
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
  const contentPolicyFor = (section: PageSection) => {
    const key = section.sectionKey || '';
    if (key === 'featured-categories') return { kind:'flexible' as const, source:(section.contentSource || 'categories') as NonNullable<PageSection['contentSource']>, title:'محتوای سکشن دسته‌بندی‌ها' };
    if (key === 'manufacturers') return { kind:'flexible' as const, source:(section.contentSource || 'brands') as NonNullable<PageSection['contentSource']>, title:'محتوای سکشن برندها' };
    if (key === 'hero') return { kind:'fixed' as const, source:'sliders' as const, title:'اسلایدهای فعال مدیریت اسلایدر' };
    if (['featured-products','weekly-deals','maintenance-products'].includes(key)) return { kind:'fixed' as const, source:'products' as const, title:'محصولات فروشگاه' };
    if (key === 'articles') return { kind:'fixed' as const, source:'articles' as const, title:'مقالات و آموزش‌ها' };
    if (/promo|banner/i.test(key)) return { kind:'flexible' as const, source:(section.contentSource || 'manual') as NonNullable<PageSection['contentSource']>, title:'محتوای بنرها' };
    if (/testimonial|service-strip|parts-brands|shipping/i.test(key)) return { kind:'manual' as const, source:'manual' as const, title:'آیتم‌های دستی و قابل ویرایش' };
    return { kind:'flexible' as const, source:(section.contentSource || 'manual') as NonNullable<PageSection['contentSource']>, title:'منبع محتوا' };
  };


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

  const saveDraft=async()=>{
    if(!draft) return;
    await updateSection(page.slug,draft);
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
  const isBannerSection=(section:PageSection)=>/promo|banner/i.test(section.sectionKey||'');
  const isDynamicSection=(section:PageSection)=>Boolean(section.contentSource&&section.contentSource!=='manual');

  const updateItem=(id:string,partial:Partial<PageSectionItem>)=>{
    if(!draft)return;
    patch({items:(draft.items||[]).map(item=>item.id===id?{...item,...partial}:item)});
  };

  const removeItem=(id:string)=>draft&&patch({items:(draft.items||[]).filter(item=>item.id!==id)});
  const moveItem=(id:string,dir:'up'|'down')=>{
    if(!draft)return;
    const items=[...(draft.items||[])].sort((a,b)=>a.order-b.order);
    const index=items.findIndex(item=>item.id===id);
    const target=dir==='up'?index-1:index+1;
    if(index<0||target<0||target>=items.length)return;
    [items[index],items[target]]=[items[target],items[index]];
    patch({items:items.map((item,i)=>({...item,order:i+1}))});
  };
  const addItem=()=>{
    const items=draft?.items||[];
    patch({items:[...items,{id:`item-${Date.now()}`,title:'آیتم جدید',subtitle:'',content:'',imageUrl:'',link:'shop',buttonText:'مشاهده',isVisible:true,order:items.length+1}]});
  };

  const renderCanvasSection=(section:PageSection)=>{
    const source=section.id===draft?.id?draft:section;
    const items=(source.items||[]).filter(item=>item.isVisible!==false);
    const isSelected=source.id===selected?.id;
    const width=previewWidthPercent(source);
    const max=source.fullWidth||source.maxWidthPx===0?'none':`${source.maxWidthPx||1280}px`;
    return (
      <div
        key={source.id}
        onClick={()=>setSectionId(source.id)}
        className={`visual-builder-section relative cursor-pointer transition-all ${isSelected?'ring-2 ring-blue-500 ring-offset-2':'hover:ring-1 hover:ring-blue-300'} ${source.isVisible===false?'opacity-45':''}`}
        style={{
          width:`${width}%`,maxWidth:max,marginInline:'auto',
          marginTop:`${source.marginTopPx??0}px`,marginBottom:`${source.marginBottomPx??0}px`,
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
            <h2 className="font-black mt-2" style={{fontSize:`${source.headingFontSizePx??18}px`}}>{source.title}</h2>
            {source.subtitle&&<p className="opacity-70 mt-1" style={{fontSize:`${source.subtitleFontSizePx??10}px`}}>{source.subtitle}</p>}
            {source.content&&<div className="text-[9px] leading-6 opacity-80 mt-3 line-clamp-4" dangerouslySetInnerHTML={{__html:source.content}}/>}
            {source.buttonText&&<button className="mt-3 px-3 py-2 rounded-lg bg-neutral-900 text-white text-[8px] font-bold">{source.buttonText}</button>}
          </div>
          {source.imageUrl&&source.imageMode!=='cover'&&<img src={source.imageUrl} alt="" className="max-w-[42%] max-h-40 object-contain rounded-xl"/>}
        </div>
        {items.length>0&&(
          <div
            className="grid mt-5"
            style={{
              display: device==='mobile' && source.mobileDisplayMode==='scroll' ? 'flex' : 'grid',
              overflowX: device==='mobile' && source.mobileDisplayMode==='scroll' ? 'auto' : undefined,
              gridTemplateColumns:device==='mobile' && source.mobileDisplayMode==='scroll' ? undefined : isBannerSection(source) ? 'repeat(100,minmax(0,1fr))' : `repeat(${previewColumns(source)},minmax(0,1fr))`,
              gap:`${source.gapPx??16}px`
            }}
          >
            {items.slice(0,source.maxItems&&source.maxItems>0?source.maxItems:items.length).map(item=>(
              <div
                key={item.id}
                className="border min-w-0"
                style={{
                  flex:device==='mobile' && source.mobileDisplayMode==='scroll' ? `0 0 ${source.mobileItemMinWidthPx??240}px` : undefined,
                  gridColumn:isBannerSection(source) ? `span ${Math.max(1,Math.min(100,Math.round((device==='desktop'?item.widthPercent:device==='tablet'?(item.tabletWidthPercent??item.widthPercent):item.mobileWidthPercent)??100)))}` : undefined,
                  backgroundColor:(isBannerSection(source)?item.backgroundColor:undefined)||source.itemBackgroundColor||'rgba(255,255,255,.82)',
                  color:(isBannerSection(source)?item.textColor:undefined)||source.itemTextColor||'#111827',
                  borderColor:(isBannerSection(source)?item.borderColor:undefined)||source.itemBorderColor||'rgba(0,0,0,.1)',
                  borderRadius:`${(isBannerSection(source)?item.borderRadiusPx:undefined)??source.itemRadiusPx??10}px`,
                  padding:`${(isBannerSection(source)?item.paddingPx:undefined)??source.itemPaddingPx??12}px`,
                  minHeight:isBannerSection(source)
                    ? `${device==='desktop'?(item.heightPx??source.itemMinHeightPx??0):device==='tablet'?(item.tabletHeightPx??item.heightPx??source.itemMinHeightPx??0):(item.mobileHeightPx??item.tabletHeightPx??item.heightPx??source.itemMinHeightPx??0)}px`
                    : `${source.itemMinHeightPx??0}px`,
                  textAlign:(isBannerSection(source)?item.textAlignment||item.textAlign:undefined)||source.itemTextAlign||'right'
                }}
              >
                {item.imageUrl&&<img
                  src={item.imageUrl}
                  alt=""
                  className="mb-2 max-w-full"
                  style={{
                    width:`${(isBannerSection(source)?item.imageWidthPx:undefined)??source.itemImageWidthPx??source.imageSizePx??72}px`,
                    height:`${(isBannerSection(source)?item.imageHeightPx:undefined)??source.itemImageHeightPx??source.imageSizePx??72}px`,
                    objectFit:(isBannerSection(source)?item.imageFit:undefined)||source.itemImageFit||'contain',
                    borderRadius:`${(isBannerSection(source)?item.imageRadiusPx:undefined)??source.itemImageRadiusPx??0}px`
                  }}
                />}
                <strong className="block truncate" style={{fontSize:`${(isBannerSection(source)?item.titleFontSizePx:undefined)??source.itemTitleFontSizePx??12}px`}}>{item.title}</strong>
                {item.subtitle&&<span className="block text-neutral-500 mt-1 truncate" style={{fontSize:`${(isBannerSection(source)?item.contentFontSizePx:undefined)??source.itemContentFontSizePx??9}px`}}>{item.subtitle}</span>}
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
            <strong className="text-xs">ساختار صفحه</strong>
            <div className="flex gap-1">
              <button onClick={addNewSection} className="w-7 h-7 grid place-items-center rounded bg-blue-600 text-white"><Plus className="w-3.5 h-3.5"/></button>
              <button onClick={duplicateSection} disabled={!selected} className="w-7 h-7 grid place-items-center rounded bg-neutral-100 disabled:opacity-30"><CopyPlus className="w-3.5 h-3.5"/></button>
            </div>
          </div>
          <div className="space-y-1.5">
            {sortedSections.map((section,index)=>(
              <button key={section.id} onClick={()=>setSectionId(section.id)} className={`w-full p-2.5 rounded-lg border text-right flex items-center gap-2 ${selected?.id===section.id?'bg-blue-50 border-blue-400':'bg-white border-neutral-200'}`}>
                <div className="w-6 h-6 rounded bg-neutral-100 grid place-items-center text-[9px] font-bold">{index+1}</div>
                <div className="min-w-0 flex-1"><strong className="block text-[9px] truncate">{section.title||'بدون عنوان'}</strong><span className="text-[7px] text-neutral-400">{section.fullWidth?'تمام عرض':`${section.widthPercent??100}% / ${section.maxWidthPx||1280}px`}</span></div>
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
            {(['content','layout','style','items','seo'] as InspectorTab[]).map(tab=><button key={tab} onClick={()=>setInspectorTab(tab)} className={`py-3 text-[8px] font-black ${inspectorTab===tab?'text-blue-600 border-b-2 border-blue-600':'text-neutral-500'}`}>{tab==='content'?'محتوا':tab==='layout'?'چیدمان':tab==='style'?'ظاهر':tab==='items'?'آیتم‌ها':'سئو'}</button>)}
          </div>

          {!draft ? <div className="p-6 text-xs text-neutral-400">یک سکشن را انتخاب کن.</div> : (
            <div className="p-4 space-y-4 text-[10px]">
              {inspectorTab==='content'&&<>
                {(()=>{
                  const policy=contentPolicyFor(draft);
                  return <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                    <strong className="block text-[10px]">{policy.title}</strong>
                    {policy.kind==='manual' ? (
                      <div className="space-y-2">
                        <p className="text-[8px] text-neutral-500 leading-5">محتوای این سکشن از آیتم‌های قابل ویرایش ساخته می‌شود. برای تغییر هر کارت، بنر یا نظر مشتری از تب «آیتم‌ها» استفاده کنید.</p>
                        <button type="button" onClick={()=>setInspectorTab('items')} className="w-full py-2 rounded-lg bg-blue-600 text-white text-[9px] font-black">رفتن به آیتم‌ها</button>
                      </div>
                    ) : policy.kind==='fixed' ? (
                      <div className="grid grid-cols-[1fr_100px] gap-2 items-end">
                        <p className="text-[8px] text-neutral-500 leading-5">این سکشن به‌صورت زنده از اطلاعات واقعی فروشگاه خوانده می‌شود.</p>
                        <label><span className="block text-[8px] mb-1">تعداد نمایش</span><input type="number" min="1" max="100" value={draft.contentSourceLimit||draft.maxItems||12} onChange={e=>patch({contentSource:policy.source,contentSourceLimit:Number(e.target.value),maxItems:Number(e.target.value)})} className="w-full p-2 border rounded-lg"/></label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_100px] gap-2">
                        <select value={draft.contentSource||policy.source} onChange={e=>patch({contentSource:e.target.value as PageSection['contentSource']})} className="w-full p-2 border rounded-lg bg-white">
                          <option value="manual">آیتم‌های دستی</option>
                          <option value="categories">دسته‌بندی‌های قطعات</option>
                          <option value="brands">برندهای خودرو</option>
                          <option value="products">محصولات</option>
                          <option value="articles">مقالات</option>
                        </select>
                        <input type="number" min="1" max="100" value={draft.contentSourceLimit||draft.maxItems||12} onChange={e=>patch({contentSourceLimit:Number(e.target.value),maxItems:Number(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                      </div>
                    )}
                  </div>;
                })()}
                <label className="block"><span className="font-bold">عنوان</span><input value={draft.title} onChange={e=>patch({title:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <label className="block"><span className="font-bold">زیرعنوان</span><input value={draft.subtitle||''} onChange={e=>patch({subtitle:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <label className="block"><span className="font-bold">برچسب</span><input value={draft.badge||''} onChange={e=>patch({badge:e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg"/></label>
                <RichTextEditor label="محتوا" value={draft.content||''} onChange={value=>patch({content:value})}/>
                <ImageUploadInput label="تصویر" value={draft.imageUrl||''} onChange={url=>patch({imageUrl:url})} aspectRatio="banner" presetCategory="banners"/>
                <input value={draft.buttonText||''} onChange={e=>patch({buttonText:e.target.value})} className="w-full p-2 border rounded-lg" placeholder="متن دکمه"/>
                <LinkDestinationPicker label="مقصد دکمه" value={draft.buttonLink||''} onChange={value=>patch({buttonLink:value})} />
              </>}

              {inspectorTab==='layout'&&<>
                <div><span className="font-bold block mb-1">کادر و عرض سکشن</span><div className="grid grid-cols-3 gap-1">
                  <button onClick={()=>patch({fullWidth:true,widthPercent:95,tabletWidthPercent:96,mobileWidthPercent:100,maxWidthPx:0})} className={`p-2 rounded border ${draft.fullWidth?'bg-blue-600 text-white':''}`}>تمام عرض</button>
                  <button onClick={()=>patch({fullWidth:false,widthPercent:100,maxWidthPx:1280})} className={`p-2 rounded border ${!draft.fullWidth&&draft.widthPercent===100&&draft.maxWidthPx===1280?'bg-blue-600 text-white':''}`}>داخل کادر</button>
                  <button onClick={()=>patch({fullWidth:false,maxWidthPx:draft.maxWidthPx||1100})} className="p-2 rounded border">سفارشی</button>
                </div></div>
                <>
                  <label className="block"><span>عرض دسکتاپ: {draft.widthPercent??(draft.fullWidth?95:100)}%</span><input type="range" min="20" max="100" value={draft.widthPercent??(draft.fullWidth?95:100)} onChange={e=>patch({widthPercent:Number(e.target.value)})} className="w-full"/></label>
                  <label className="block"><span>عرض تبلت: {draft.tabletWidthPercent??draft.widthPercent??(draft.fullWidth?96:100)}%</span><input type="range" min="20" max="100" value={draft.tabletWidthPercent??draft.widthPercent??(draft.fullWidth?96:100)} onChange={e=>patch({tabletWidthPercent:Number(e.target.value)})} className="w-full"/></label>
                  <label className="block"><span>عرض موبایل: {draft.mobileWidthPercent??draft.widthPercent??100}%</span><input type="range" min="20" max="100" value={draft.mobileWidthPercent??draft.widthPercent??100} onChange={e=>patch({mobileWidthPercent:Number(e.target.value)})} className="w-full"/></label>
                  {!draft.fullWidth&&<label className="block"><span>حداکثر عرض px</span><input type="number" value={draft.maxWidthPx??1280} onChange={e=>patch({maxWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>}
                  <p className="col-span-2 text-[8px] text-neutral-500">در حالت تمام عرض هم درصد واقعی قابل کنترل است؛ مقدار پیشنهادی دسکتاپ ۹۵٪ است.</p>
                </>
                <div className="grid grid-cols-3 gap-2">
                  <label><span>ستون دسکتاپ</span><input type="number" min="1" max="12" value={draft.desktopColumns??3} onChange={e=>setDesktopColumns(Number(e.target.value))} className="w-full p-2 border rounded"/></label>
                  <label><span>ستون تبلت</span><input type="number" min="1" max="8" value={draft.tabletColumns??2} onChange={e=>patch({tabletColumns:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>ستون موبایل</span><input type="number" min="1" max="4" value={draft.mobileColumns??1} onChange={e=>patch({mobileColumns:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                </div>
                <div className="grid grid-cols-3 gap-1"><button onClick={()=>patch({contentAlign:'right'})} className="p-2 border rounded flex justify-center"><AlignRight className="w-4 h-4"/></button><button onClick={()=>patch({contentAlign:'center'})} className="p-2 border rounded flex justify-center"><AlignCenter className="w-4 h-4"/></button><button onClick={()=>patch({contentAlign:'left'})} className="p-2 border rounded flex justify-center"><AlignLeft className="w-4 h-4"/></button></div>
                <div className="grid grid-cols-2 gap-2">
                  <label><span>فاصله آیتم‌ها</span><input type="number" value={draft.gapPx??16} onChange={e=>patch({gapPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>حداکثر آیتم قابل نمایش</span><input type="number" min="0" max="100" value={draft.maxItems??0} onChange={e=>patch({maxItems:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>اندازه پایه تصویر</span><input type="number" min="16" max="1200" value={draft.imageSizePx??72} onChange={e=>patch({imageSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>شفافیت تصویر ٪</span><input type="number" min="0" max="100" value={draft.backgroundImageOpacity??100} onChange={e=>patch({backgroundImageOpacity:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>حداقل ارتفاع آیتم</span><input type="number" value={draft.itemMinHeightPx??0} onChange={e=>patch({itemMinHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>حداقل عرض آیتم موبایل</span><input type="number" min="120" max="600" value={draft.mobileItemMinWidthPx??240} onChange={e=>patch({mobileItemMinWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                  <label><span>نمایش موبایل</span><select value={draft.mobileDisplayMode||'grid'} onChange={e=>patch({mobileDisplayMode:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="grid">شبکه</option><option value="scroll">پیمایش افقی</option></select></label>
                  <label><span>چیدمان اختصاصی</span><select value={draft.layoutVariant||'default'} onChange={e=>patch({layoutVariant:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="default">پیش‌فرض</option><option value="uniform">یکنواخت</option><option value="mosaic">موزاییکی</option><option value="compact">فشرده</option></select></label>
                </div>
              </>}

              {inspectorTab==='style'&&<>
                <div className="grid grid-cols-2 gap-2"><label><span>پس‌زمینه</span><input type="color" value={draft.backgroundColor||'#ffffff'} onChange={e=>patch({backgroundColor:e.target.value})} className="w-full h-10"/></label><label><span>رنگ متن</span><input type="color" value={draft.textColor||'#111827'} onChange={e=>patch({textColor:e.target.value})} className="w-full h-10"/></label></div>
                <div className="grid grid-cols-2 gap-2"><label><span>فاصله داخلی بالا</span><input type="number" value={draft.paddingTopPx??28} onChange={e=>patch({paddingTopPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label><label><span>فاصله داخلی پایین</span><input type="number" value={draft.paddingBottomPx??28} onChange={e=>patch({paddingBottomPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label></div>
                <label><span>فاصله داخلی افقی</span><input type="number" value={draft.paddingInlinePx??20} onChange={e=>patch({paddingInlinePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
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
                  <label><span>نحوه نمایش تصویر آیتم</span><select value={draft.itemImageFit||'contain'} onChange={e=>patch({itemImageFit:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="contain">نمایش کامل بدون برش</option><option value="cover">پوشش کامل کادر</option></select></label>
                  <label><span>تراز متن آیتم</span><select value={draft.itemTextAlign||'right'} onChange={e=>patch({itemTextAlign:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                </div>
                <select value={draft.imageMode||'side'} onChange={e=>patch({imageMode:e.target.value as any})} className="w-full p-2 border rounded bg-white"><option value="side">تصویر کنار محتوا</option><option value="cover">پوشش کامل پس‌زمینه</option><option value="full">تمام تصویر</option><option value="contain">نمایش کامل بدون برش</option><option value="banner">بنری</option></select>
              </>}

              {inspectorTab==='items'&&<>
                <div className="flex items-center justify-between"><strong>{isDynamicSection(draft)?'آیتم‌های منبع زنده':'آیتم‌های سکشن'}</strong>{!isDynamicSection(draft)&&<button onClick={addItem} className="px-2 py-1.5 bg-blue-600 text-white rounded inline-flex gap-1 items-center"><Plus className="w-3 h-3"/>آیتم</button>}</div>
                {isDynamicSection(draft)&&<div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-[9px] leading-5">ظاهر همه آیتم‌های این سکشن یک‌جا از تب «ظاهر» کنترل می‌شود و نیاز به تنظیم تک‌تک آیتم‌ها نیست.</div>}
                <div className="space-y-3">
                  {!isDynamicSection(draft)&&(draft.items||[]).map((item,index)=><div key={item.id} className="p-3 rounded-xl border bg-neutral-50 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <strong>آیتم {index+1}</strong>
                      <div className="flex items-center gap-1">
                        <button onClick={()=>moveItem(item.id,'up')} disabled={index===0} className="p-1 border rounded disabled:opacity-30" title="بالا"><ArrowUp className="w-3 h-3"/></button>
                        <button onClick={()=>moveItem(item.id,'down')} disabled={index===(draft.items||[]).length-1} className="p-1 border rounded disabled:opacity-30" title="پایین"><ArrowDown className="w-3 h-3"/></button>
                        <button onClick={()=>updateItem(item.id,{isVisible:item.isVisible===false?true:false})} className="p-1 border rounded" title="نمایش/مخفی">{item.isVisible===false?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                        <button onClick={()=>removeItem(item.id)} className="p-1 text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <input value={item.title||''} onChange={e=>updateItem(item.id,{title:e.target.value})} className="w-full p-2 border rounded" placeholder="عنوان"/>
                    <input value={item.subtitle||''} onChange={e=>updateItem(item.id,{subtitle:e.target.value})} className="w-full p-2 border rounded" placeholder="زیرعنوان"/>
                    <input value={item.badge||''} onChange={e=>updateItem(item.id,{badge:e.target.value})} className="w-full p-2 border rounded" placeholder="برچسب"/>
                    <textarea rows={3} value={item.content||''} onChange={e=>updateItem(item.id,{content:e.target.value})} className="w-full p-2 border rounded" placeholder="متن / توضیحات آیتم"/>
                    <ImageUploadInput value={item.imageUrl||''} onChange={url=>updateItem(item.id,{imageUrl:url})} aspectRatio="square" presetCategory="parts"/>
                    {isBannerSection(draft)?<>
                      <div className="grid grid-cols-2 gap-2">
                        <label><span className="block text-[8px] mb-1">عرض بنر دسکتاپ ٪</span><input type="number" min="10" max="100" value={item.widthPercent??100} onChange={e=>updateItem(item.id,{widthPercent:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">ارتفاع بنر دسکتاپ</span><input type="number" min="80" max="900" value={item.heightPx??draft.itemMinHeightPx??178} onChange={e=>updateItem(item.id,{heightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">عرض تبلت ٪</span><input type="number" min="10" max="100" value={item.tabletWidthPercent??item.widthPercent??100} onChange={e=>updateItem(item.id,{tabletWidthPercent:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">ارتفاع تبلت</span><input type="number" min="80" max="900" value={item.tabletHeightPx??item.heightPx??178} onChange={e=>updateItem(item.id,{tabletHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">عرض موبایل ٪</span><input type="number" min="10" max="100" value={item.mobileWidthPercent??100} onChange={e=>updateItem(item.id,{mobileWidthPercent:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">ارتفاع موبایل</span><input type="number" min="80" max="900" value={item.mobileHeightPx??item.tabletHeightPx??item.heightPx??168} onChange={e=>updateItem(item.id,{mobileHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">عرض تصویر</span><input type="number" value={item.imageWidthPx??draft.itemImageWidthPx??draft.imageSizePx??72} onChange={e=>updateItem(item.id,{imageWidthPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">ارتفاع تصویر</span><input type="number" value={item.imageHeightPx??draft.itemImageHeightPx??draft.imageSizePx??72} onChange={e=>updateItem(item.id,{imageHeightPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">گردی کارت</span><input type="number" value={item.borderRadiusPx??draft.itemRadiusPx??10} onChange={e=>updateItem(item.id,{borderRadiusPx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                        <label><span className="block text-[8px] mb-1">فونت عنوان</span><input type="number" value={item.titleFontSizePx??draft.itemTitleFontSizePx??14} onChange={e=>updateItem(item.id,{titleFontSizePx:Number(e.target.value)})} className="w-full p-2 border rounded"/></label>
                      </div>
                    </>:<div className="p-2 rounded-lg bg-neutral-100 text-[8px] text-neutral-500">ظاهر این آیتم از تنظیمات مشترک سکشن در تب «ظاهر» پیروی می‌کند.</div>}
                    <input value={item.buttonText||''} onChange={e=>updateItem(item.id,{buttonText:e.target.value})} className="w-full p-2 border rounded" placeholder="متن دکمه"/>
                    <LinkDestinationPicker label="مقصد آیتم / دکمه" value={item.link||''} onChange={value=>updateItem(item.id,{link:value})} />
                    {isBannerSection(draft)&&<div className="grid grid-cols-2 gap-2">
                      <label><span className="block text-[8px] mb-1">نمایش تصویر</span><select value={item.imageMode||(item.imageFit==='contain'?'contain':'cover')} onChange={e=>updateItem(item.id,{imageMode:e.target.value as PageSectionItem['imageMode']})} className="w-full p-2 border rounded bg-white"><option value="cover">پوشش کامل کادر</option><option value="contain">کامل بدون برش</option><option value="stretch">کشیده تا کل کادر</option><option value="original">اندازه اصلی</option><option value="repeat">تکرار کامل</option><option value="repeat-x">تکرار افقی</option><option value="repeat-y">تکرار عمودی</option></select></label>
                      <label><span className="block text-[8px] mb-1">تراز متن</span><select value={item.textAlignment||item.textAlign||'right'} onChange={e=>updateItem(item.id,{textAlignment:e.target.value as PageSectionItem['textAlignment']})} className="w-full p-2 border rounded bg-white"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label>
                    </div>}
                  </div>)}
                </div>
              </>}

              {inspectorTab==='seo'&&<AdminEntitySeoPanel entityType="page" entityId={page.id} entityTitle={page.title} value={seoDraft} images={page.sections.flatMap(section=>[section.imageUrl||'',...(section.items||[]).map(item=>item.imageUrl||'')]).filter(Boolean)} onChange={setSeoDraft}/>}
              {inspectorTab==='seo'&&<button onClick={()=>updatePage({...page,seo:seoDraft})} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black">ذخیره سئوی برگه</button>}

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
