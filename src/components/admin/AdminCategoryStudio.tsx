import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Save,
  Search,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Category, CategoryChild, SeoEntityDraft } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { IconPicker } from '../common/IconPicker';
import { IconRenderer, iconClassFor } from '../common/IconRenderer';
import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';

type NodeRef = {
  rootId: string;
  nodeId: string;
  depth: number;
  isRoot: boolean;
};

const cloneCategory = <T,>(value:T):T => JSON.parse(JSON.stringify(value));

const findChild = (nodes:CategoryChild[] = [], id:string):CategoryChild | null => {
  for(const node of nodes){
    if(node.id===id) return node;
    const nested=findChild(node.subcategories||[],id);
    if(nested) return nested;
  }
  return null;
};

const updateChild = (nodes:CategoryChild[] = [], id:string, updater:(node:CategoryChild)=>CategoryChild):CategoryChild[] =>
  nodes.map(node=>node.id===id?updater(node):{...node,subcategories:updateChild(node.subcategories||[],id,updater)});

const removeChild = (nodes:CategoryChild[] = [], id:string):CategoryChild[] =>
  nodes.filter(node=>node.id!==id).map(node=>({...node,subcategories:removeChild(node.subcategories||[],id)}));

const appendChild = (nodes:CategoryChild[] = [], parentId:string, child:CategoryChild):CategoryChild[] =>
  nodes.map(node=>node.id===parentId?{...node,subcategories:[...(node.subcategories||[]),child]}:{...node,subcategories:appendChild(node.subcategories||[],parentId,child)});

const descendants = (node:CategoryChild):string[] => [
  ...(node.subcategories||[]).map(x=>x.id),
  ...(node.subcategories||[]).flatMap(descendants)
];

export const AdminCategoryStudio:React.FC = ()=>{
  const {categories,addCategory,updateCategory,deleteCategory,showToast}=useStore();
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<NodeRef|null>(categories[0]?{rootId:categories[0].id,nodeId:categories[0].id,depth:0,isRoot:true}:null);
  const [draftRoot,setDraftRoot]=useState<Category|null>(categories[0]?cloneCategory(categories[0]):null);
  const [openIds,setOpenIds]=useState<Set<string>>(new Set(categories.map(c=>c.id)));
  const [iconPickerOpen,setIconPickerOpen]=useState(false);
  const [dragging,setDragging]=useState<NodeRef|null>(null);

  const root=selected?categories.find(c=>c.id===selected.rootId):undefined;
  const workingRoot=selected&&draftRoot?.id===selected.rootId?draftRoot:(root?cloneCategory(root):null);
  const selectedNode=useMemo(()=>{
    if(!selected||!workingRoot)return null;
    return selected.isRoot?workingRoot:findChild(workingRoot.subcategories||[],selected.nodeId);
  },[selected,workingRoot]);

  const selectNode=(ref:NodeRef)=>{
    if (draftRoot?.id === ref.rootId) {
      setSelected(ref);
      return;
    }
    const nextRoot=categories.find(c=>c.id===ref.rootId);
    setSelected(ref);
    setDraftRoot(nextRoot?cloneCategory(nextRoot):null);
  };

  const patchSelected=(partial:Partial<Category & CategoryChild>)=>{
    if(!selected||!draftRoot)return;
    if(selected.isRoot){
      setDraftRoot({...draftRoot,...partial} as Category);
    }else{
      setDraftRoot({...draftRoot,subcategories:updateChild(draftRoot.subcategories||[],selected.nodeId,node=>({...node,...partial}))});
    }
  };

  const save=()=>{
    if(!draftRoot)return;
    updateCategory(draftRoot);
    showToast('ساختار درختی دسته‌بندی ذخیره شد.');
  };

  const addRoot=()=>{
    const stamp=Date.now();
    const cat:Category={id:`cat-${stamp}`,nameFa:'دسته‌بندی جدید',nameEn:'New Category',slug:`category-${stamp}`,icon:'Layers',description:'',subcategories:[]};
    addCategory(cat);
    setSelected({rootId:cat.id,nodeId:cat.id,depth:0,isRoot:true});
    setDraftRoot(cat);
  };

  const addChild=(parent:NodeRef)=>{
    const stamp=Date.now();
    const child:CategoryChild={id:`sub-${stamp}`,nameFa:'زیر‌دسته جدید',nameEn:'New Subcategory',slug:`subcategory-${stamp}`,icon:'FolderTree',description:'',subcategories:[]};
    const current=categories.find(c=>c.id===parent.rootId);
    const base=draftRoot?.id===parent.rootId?draftRoot:(current?cloneCategory(current):null);
    if(!base)return;
    const next=parent.isRoot?{...base,subcategories:[...(base.subcategories||[]),child]}:{...base,subcategories:appendChild(base.subcategories||[],parent.nodeId,child)};
    setDraftRoot(next);
    setSelected({rootId:parent.rootId,nodeId:child.id,depth:parent.depth+1,isRoot:false});
    setOpenIds(prev=>new Set(prev).add(parent.nodeId));
  };

  const deleteSelected=()=>{
    if(!selected)return;
    if(selected.isRoot){
      const cat=categories.find(c=>c.id===selected.rootId);
      if(!cat||!window.confirm(`دسته «${cat.nameFa}» و تمام زیرشاخه‌هایش حذف شود؟`))return;
      deleteCategory(cat.id);
      const next=categories.find(c=>c.id!==cat.id);
      setSelected(next?{rootId:next.id,nodeId:next.id,depth:0,isRoot:true}:null);
      setDraftRoot(next?cloneCategory(next):null);
      return;
    }
    if(!draftRoot||!window.confirm('این زیر‌دسته و تمام زیرشاخه‌های آن حذف شود؟'))return;
    const next={...draftRoot,subcategories:removeChild(draftRoot.subcategories||[],selected.nodeId)};
    setDraftRoot(next);
    setSelected({rootId:draftRoot.id,nodeId:draftRoot.id,depth:0,isRoot:true});
  };

  const moveDraggedInto=(target:NodeRef)=>{
    if(!dragging||dragging.rootId!==target.rootId||dragging.isRoot||!draftRoot)return;
    const node=findChild(draftRoot.subcategories||[],dragging.nodeId);
    if(!node||dragging.nodeId===target.nodeId||descendants(node).includes(target.nodeId))return;
    let subs=removeChild(draftRoot.subcategories||[],dragging.nodeId);
    subs=target.isRoot?[...subs,node]:appendChild(subs,target.nodeId,node);
    setDraftRoot({...draftRoot,subcategories:subs});
    setSelected({...dragging,depth:target.depth+1});
    setDragging(null);
  };

  const renderTree=(nodes:CategoryChild[],rootId:string,depth:number):React.ReactNode=>nodes.map(node=>{
    const open=openIds.has(node.id);
    const has=(node.subcategories||[]).length>0;
    const ref:NodeRef={rootId,nodeId:node.id,depth,isRoot:false};
    const active=selected?.nodeId===node.id;
    return <div key={node.id}>
      <div
        draggable
        onDragStart={()=>setDragging(ref)}
        onDragEnd={()=>setDragging(null)}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();moveDraggedInto(ref);}}
        className={`group min-h-10 px-2 rounded-lg flex items-center gap-2 ${active?'bg-blue-50 text-blue-700':'hover:bg-neutral-50'}`}
        style={{marginRight:depth*14}}
      >
        <GripVertical className="w-3.5 h-3.5 text-neutral-300 cursor-grab"/>
        <button onClick={()=>has&&setOpenIds(prev=>{const n=new Set(prev);open?n.delete(node.id):n.add(node.id);return n;})} className="w-5 h-5 grid place-items-center">{has?(open?<ChevronDown className="w-3.5 h-3.5"/>:<ChevronLeft className="w-3.5 h-3.5"/>):<span/>}</button>
        <button onClick={()=>selectNode(ref)} className="min-w-0 flex-1 text-right flex items-center gap-2">
          <IconRenderer icon={node.icon} className="w-4 h-4"/>
          <span className="truncate text-[10px] font-bold">{node.nameFa}</span>
          <small className="text-[8px] text-neutral-400">/{node.slug}</small>
        </button>
        <a
          href={`/category/${encodeURIComponent(node.slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e=>e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded bg-emerald-50 text-emerald-700"
          title="نمایش مستقیم دسته"
        ><ExternalLink className="w-3 h-3"/></a>
        <button onClick={()=>addChild(ref)} className="opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded bg-blue-50 text-blue-600"><Plus className="w-3 h-3"/></button>
      </div>
      {has&&open&&renderTree(node.subcategories||[],rootId,depth+1)}
    </div>;
  });

  const categoryMatches=(node:any,q:string):boolean=>{
    if(node.nameFa?.includes(q)||String(node.nameEn||'').toLowerCase().includes(q.toLowerCase())||String(node.slug||'').toLowerCase().includes(q.toLowerCase()))return true;
    return (node.subcategories||[]).some((child:any)=>categoryMatches(child,q));
  };
  const filteredRoots=categories.filter(c=>!query.trim()||categoryMatches(c,query.trim()));
  const entityId=selected?.isRoot?selected.nodeId:`sub:${selected?.nodeId||''}`;
  const seoValue=(selectedNode as any)?.seo as SeoEntityDraft|undefined;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-4 items-start">
      <aside className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden xl:sticky xl:top-4">
        <div className="p-4 border-b flex items-center justify-between">
          <div><h2 className="font-black text-sm flex items-center gap-2"><FolderTree className="w-4 h-4 text-blue-600"/>درخت دسته‌بندی قطعات</h2><p className="text-[9px] text-neutral-500 mt-1">سطح زیرشاخه محدود نیست.</p></div>
          <button onClick={addRoot} className="w-8 h-8 grid place-items-center rounded-lg bg-blue-600 text-white"><Plus className="w-4 h-4"/></button>
        </div>
        <div className="p-3 border-b relative"><Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full pr-9 pl-2 py-2 border rounded-lg text-xs" placeholder="جستجو..."/></div>
        <div className="p-2 max-h-[calc(100vh-240px)] overflow-y-auto">
          {filteredRoots.map(cat=>{
            const active=selected?.nodeId===cat.id;
            const open=openIds.has(cat.id);
            const has=(cat.subcategories||[]).length>0;
            const ref:NodeRef={rootId:cat.id,nodeId:cat.id,depth:0,isRoot:true};
            const display=draftRoot?.id===cat.id?draftRoot:cat;
            return <div key={cat.id}>
              <div
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();if(draftRoot?.id===cat.id)moveDraggedInto(ref);}}
                className={`group min-h-11 px-2 rounded-lg flex items-center gap-2 ${active?'bg-neutral-900 text-white':'hover:bg-neutral-50'}`}
              >
                <button onClick={()=>has&&setOpenIds(prev=>{const n=new Set(prev);open?n.delete(cat.id):n.add(cat.id);return n;})} className="w-5 h-5 grid place-items-center">{has?(open?<ChevronDown className="w-3.5 h-3.5"/>:<ChevronLeft className="w-3.5 h-3.5"/>):null}</button>
                <button onClick={()=>selectNode(ref)} className="min-w-0 flex-1 text-right flex items-center gap-2"><IconRenderer icon={display.icon} className="w-4 h-4"/><strong className="truncate text-[10px]">{display.nameFa}</strong></button>
                <a
                  href={`/category/${encodeURIComponent(display.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 grid place-items-center rounded bg-emerald-50 text-emerald-700"
                  title="نمایش مستقیم دسته"
                ><ExternalLink className="w-3 h-3"/></a>
                <button onClick={()=>addChild(ref)} className="w-6 h-6 grid place-items-center rounded bg-blue-500 text-white"><Plus className="w-3 h-3"/></button>
              </div>
              {has&&open&&renderTree((display.subcategories||[]) as CategoryChild[],cat.id,1)}
            </div>;
          })}
        </div>
      </aside>

      <main className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {!selectedNode||!selected||!draftRoot?<div className="p-16 text-center text-xs text-neutral-400">یک دسته را انتخاب کن.</div>:<>
          <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-base">{selectedNode.nameFa}</h2>
              <p className="text-[9px] text-neutral-400 mt-1">سطح {selected.depth+1} • /category/{selectedNode.slug}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/category/${encodeURIComponent(selectedNode.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 grid place-items-center rounded-xl bg-emerald-50 text-emerald-700"
                title="نمایش مستقیم در صفحه جدید"
              ><ExternalLink className="w-4 h-4"/></a>
              <button onClick={()=>addChild(selected)} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold inline-flex gap-1 items-center"><Plus className="w-3.5 h-3.5"/>زیر‌دسته</button>
              <button onClick={deleteSelected} className="w-9 h-9 grid place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4"/></button>
              <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black inline-flex gap-1 items-center"><Save className="w-3.5 h-3.5"/>ذخیره درخت و SEO</button>
            </div>
          </div>

          <div className="p-5 grid lg:grid-cols-2 gap-5">
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label><span className="block text-[10px] font-bold mb-1">نام فارسی</span><input value={selectedNode.nameFa} onChange={e=>patchSelected({nameFa:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs"/></label>
                <label><span className="block text-[10px] font-bold mb-1">نام انگلیسی</span><input dir="ltr" value={selectedNode.nameEn} onChange={e=>patchSelected({nameEn:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-left"/></label>
              </div>
              <label><span className="block text-[10px] font-bold mb-1">Slug</span><input dir="ltr" value={selectedNode.slug} onChange={e=>patchSelected({slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono"/></label>
              <label><span className="block text-[10px] font-bold mb-1">توضیح بالای دسته</span><textarea rows={4} value={(selectedNode as any).description||''} onChange={e=>patchSelected({description:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs"/></label>
              <label><span className="block text-[10px] font-bold mb-1">توضیح کامل پایین صفحه</span><textarea rows={6} value={(selectedNode as any).bottomDescription||''} onChange={e=>patchSelected({bottomDescription:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" placeholder="متن سئویی و راهنمای خرید که پایین لیست محصولات نمایش داده می‌شود."/></label>
            </section>

            <section className="space-y-4">
              <ImageUploadInput label="تصویر عریض نوار دسته‌بندی (Hero)" value={(selectedNode as any).heroImageUrl||''} onChange={url=>patchSelected({heroImageUrl:url})} aspectRatio="banner" presetCategory="banners"/>
              <ImageUploadInput label="آیکن کنار نام دسته‌بندی" value={(selectedNode as any).iconUrl||(selectedNode as any).imageUrl||''} onChange={url=>patchSelected({iconUrl:url})} aspectRatio="square" presetCategory="categories"/>
              <button onClick={()=>setIconPickerOpen(true)} className="w-full p-3 rounded-xl border flex items-center justify-between">
                <span className="flex items-center gap-2"><IconRenderer icon={(selectedNode as any).icon} className="w-5 h-5"/><strong className="text-xs">آیکن دسته‌بندی</strong></span>
                <span className="text-[9px] text-blue-600">{iconClassFor((selectedNode as any).icon)||'انتخاب'}</span>
              </button>
              {selected.isRoot&&<>
                <label><span className="block text-[10px] font-bold mb-1">عنوان Hero</span><input value={(selectedNode as Category).heroTitle||''} onChange={e=>patchSelected({heroTitle:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs"/></label>
                <label><span className="block text-[10px] font-bold mb-1">زیرعنوان Hero</span><input value={(selectedNode as Category).heroSubtitle||''} onChange={e=>patchSelected({heroSubtitle:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs"/></label>
              </>}
            </section>
          </div>

          <div className="p-5 border-t bg-emerald-50/20">
            <AdminEntitySeoPanel
              entityType="category"
              entityId={entityId}
              entityTitle={selectedNode.nameFa}
              value={seoValue}
              images={[(selectedNode as any).heroImageUrl||'',(selectedNode as any).iconUrl||''].filter(Boolean)}
              onChange={seo=>patchSelected({seo})}
            />
          </div>
        </>}
      </main>

      {iconPickerOpen&&selectedNode&&(
        <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <IconPicker value={(selectedNode as any).icon} onChange={icon=>{patchSelected({icon});setIconPickerOpen(false);}} onClose={()=>setIconPickerOpen(false)}/>
          </div>
        </div>
      )}
    </div>
  );
};
