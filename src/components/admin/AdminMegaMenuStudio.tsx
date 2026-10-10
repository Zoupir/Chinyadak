import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronDown,
  CopyPlus,
  GripVertical,
  Layers,
  LayoutGrid,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { HeaderMenuKind, MenuItem, MenuSourceType } from '../../types';
import { IconPicker } from '../common/IconPicker';
import { IconRenderer } from '../common/IconRenderer';
import { ImageUploadInput } from '../common/ImageUploadInput';

type SourceTab = 'categories' | 'products' | 'pages' | 'articles' | 'brands' | 'models';

interface SourceOption {
  key: string;
  sourceType: MenuSourceType;
  sourceId: string;
  title: string;
  subtitle?: string;
  link: string;
  kind: HeaderMenuKind;
}

const sourceTabs: Array<{id:SourceTab; title:string}> = [
  { id:'categories', title:'دسته‌بندی‌ها' },
  { id:'products', title:'محصولات' },
  { id:'pages', title:'برگه‌ها' },
  { id:'articles', title:'مقالات' },
  { id:'brands', title:'برند خودرو' },
  { id:'models', title:'مدل خودرو' }
];

export const AdminMegaMenuStudio: React.FC = () => {
  const { settings, updateSettings, showToast, categories, products, pages, articles, brands, models } = useStore();

  const initialMenus = settings.headerMenus || [];
  const [menus, setMenus] = useState<MenuItem[]>(initialMenus);
  const [activeRootId, setActiveRootId] = useState<string>(
    initialMenus.find(item => !item.parentId && (item.kind === 'categories' || item.megaMenu?.enabled))?.id ||
    initialMenus.find(item => !item.parentId)?.id ||
    ''
  );
  const [sourceTab, setSourceTab] = useState<SourceTab>('categories');
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [bundleDragging, setBundleDragging] = useState(false);
  const [draggingMenuId, setDraggingMenuId] = useState<string | null>(null);
  const [iconItemId, setIconItemId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const roots = menus.filter(item => !item.parentId && item.isVisible !== false);
  const activeRoot = menus.find(item => item.id === activeRootId);

  const sourceOptions = useMemo<SourceOption[]>(() => {
    const cat: SourceOption[] = [];
    const appendCategorySources=(nodes:any[]=[],trail:string[]=[])=>{
      nodes.forEach(node=>{
        cat.push({
          key:`category:sub:${node.id}`,sourceType:'category',sourceId:`sub:${node.id}`,title:node.nameFa,
          subtitle:trail.join(' ← '),link:`category:${node.slug}`,kind:'category'
        });
        appendCategorySources(node.subcategories||[],[...trail,node.nameFa]);
      });
    };
    categories.forEach(category=>{
      cat.push({
        key:`category:${category.id}`,sourceType:'category',sourceId:category.id,title:category.nameFa,
        subtitle:'دسته اصلی',link:`category:${category.slug}`,kind:'category'
      });
      appendCategorySources(category.subcategories||[],[category.nameFa]);
    });
    const prod: SourceOption[] = products.map(product => ({
      key:`product:${product.id}`, sourceType:'product', sourceId:product.id, title:product.nameFa,
      subtitle:[product.oemNumber,product.sku].filter(Boolean).join(' • '), link:`product:${product.slug || product.id}`, kind:'product'
    }));
    const pg: SourceOption[] = pages.map(page => ({
      key:`page:${page.id}`, sourceType:'page', sourceId:page.id, title:page.title, subtitle:page.slug,
      link:page.slug === 'home' ? 'home' : page.slug === 'part-request' ? 'part-request' : `page:${page.slug}`, kind:'page'
    }));
    const art: SourceOption[] = articles.map(article => ({
      key:`article:${article.id}`, sourceType:'article', sourceId:article.id, title:article.title, subtitle:article.category,
      link:`article:${article.slug || article.id}`, kind:'article'
    }));
    const br: SourceOption[] = brands.map(brand => ({
      key:`brand:${brand.id}`, sourceType:'brand', sourceId:brand.id, title:brand.nameFa, subtitle:brand.nameEn,
      link:`car-brand:${brand.slug}`, kind:'brand'
    }));
    const mdl: SourceOption[] = models.map(model => ({
      key:`model:${model.id}`, sourceType:'model', sourceId:model.id, title:model.nameFa,
      subtitle:brands.find(b => b.id === model.brandId)?.nameFa || model.nameEn,
      link:`car-model:${model.slug || model.id}`, kind:'model'
    }));
    const map:Record<SourceTab,SourceOption[]> = { categories:cat, products:prod, pages:pg, articles:art, brands:br, models:mdl };
    return map[sourceTab];
  }, [sourceTab,categories,products,pages,articles,brands,models]);

  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sourceOptions.filter(item => !q || item.title.toLowerCase().includes(q) || String(item.subtitle || '').toLowerCase().includes(q));
  }, [sourceOptions,query]);

  const childrenOf = (id:string) => menus.filter(item => item.parentId === id && item.isVisible !== false);
  const descendantsOf = (id:string):string[] => {
    const direct = menus.filter(item => item.parentId === id).map(item => item.id);
    return [...direct,...direct.flatMap(descendantsOf)];
  };

  const mutate = (next:MenuItem[]) => {
    setMenus(next);
    setDirty(true);
  };

  const patch = (id:string, partial:Partial<MenuItem>) => mutate(menus.map(item => item.id === id ? {...item,...partial} : item));

  const createMenuItems = (parentId:string | undefined, asColumns:boolean):MenuItem[] => {
    const picked = sourceOptions.filter(item => selectedSources.has(item.key));
    const stamp = Date.now();
    return picked.map((source,index) => ({
      id:`mega-${stamp}-${index}`,
      title:source.title,
      originalTitle:source.title,
      link:source.link,
      kind:source.kind,
      sourceType:source.sourceType,
      sourceId:source.sourceId,
      parentId,
      isVisible:true,
      megaMenu: asColumns ? undefined : undefined
    }));
  };

  const addSelectedTo = (parentId:string | undefined) => {
    if (!selectedSources.size) {
      showToast('ابتدا چند مورد را انتخاب کنید.','error');
      return;
    }
    mutate([...menus,...createMenuItems(parentId,false)]);
    setSelectedSources(new Set());
    showToast('آیتم‌های انتخاب‌شده در محل موردنظر قرار گرفتند.');
  };

  const removeItem = (id:string) => {
    const nested = descendantsOf(id);
    mutate(menus.filter(item => item.id !== id && !nested.includes(item.id)));
  };

  const moveSibling = (id:string,dir:'up'|'down') => {
    const item = menus.find(x => x.id === id);
    if(!item) return;
    const siblings = childrenOf(item.parentId || '');
    const idx = siblings.findIndex(x => x.id === id);
    const target = siblings[dir === 'up' ? idx-1 : idx+1];
    if(!target) return;
    const next=[...menus];
    const a=next.findIndex(x=>x.id===id), b=next.findIndex(x=>x.id===target.id);
    [next[a],next[b]]=[next[b],next[a]];
    mutate(next);
  };

  const dropBundle = (parentId:string | undefined) => {
    if (!bundleDragging || !selectedSources.size) return;
    addSelectedTo(parentId);
    setBundleDragging(false);
  };

  const dropExisting = (parentId:string | undefined) => {
    if (!draggingMenuId) return;
    if (parentId && (parentId === draggingMenuId || descendantsOf(draggingMenuId).includes(parentId))) return;
    patch(draggingMenuId,{parentId});
    setDraggingMenuId(null);
  };

  const addEmptyColumn = () => {
    if (!activeRoot) return;
    const stamp=Date.now();
    mutate([...menus,{
      id:`mega-column-${stamp}`,
      title:'ستون جدید',
      link:'shop',
      kind:'custom',
      sourceType:'custom',
      sourceId:`mega-column-${stamp}`,
      parentId:activeRoot.id,
      isVisible:true
    }]);
  };

  const importCategories = () => {
    if(!activeRoot) return;
    const currentChildren = childrenOf(activeRoot.id);
    if(currentChildren.length && !window.confirm('ستون‌های فعلی این مگامنو با ساختار دسته‌بندی‌های فروشگاه جایگزین شوند؟')) return;
    const nestedIds=currentChildren.flatMap(item=>[item.id,...descendantsOf(item.id)]);
    const preserved=menus.filter(item=>!nestedIds.includes(item.id));
    const stamp=Date.now();
    const generated:MenuItem[]=[];
    const appendChildren=(nodes:any[]=[],parentId:string,pathPrefix:string)=>{
      nodes.forEach((node,nodeIndex)=>{
        const nodeId=`mega-import-sub-${stamp}-${pathPrefix}-${node.id||nodeIndex}`;
        generated.push({
          id:nodeId,title:node.nameFa,originalTitle:node.nameFa,link:`category:${node.slug}`,
          kind:'category',sourceType:'category',sourceId:`sub:${node.id}`,parentId,isVisible:true,icon:node.icon
        });
        appendChildren(node.subcategories||[],nodeId,`${pathPrefix}-${node.id||nodeIndex}`);
      });
    };
    categories.forEach((category,index)=>{
      const columnId=`mega-import-${stamp}-${index}`;
      generated.push({
        id:columnId,title:category.nameFa,originalTitle:category.nameFa,link:`category:${category.slug}`,
        kind:'category',sourceType:'category',sourceId:category.id,parentId:activeRoot.id,isVisible:true,icon:category.icon
      });
      appendChildren(category.subcategories||[],columnId,String(index));
    });
    mutate([...preserved,...generated]);
    showToast('ساختار دسته‌بندی‌ها به مگامنو وارد شد.');
  };

  const save = () => {
    updateSettings({headerMenus:menus});
    setDirty(false);
    showToast('Mega Menu Studio ذخیره شد.');
  };

  const enableMega = () => {
    if(!activeRoot) return;
    patch(activeRoot.id,{
      megaMenu:{...(activeRoot.megaMenu||{}),enabled:true,columns:activeRoot.megaMenu?.columns||4,width:activeRoot.megaMenu?.width||'full'}
    });
  };

  const renderNested = (parentId:string,depth=0):React.ReactNode => {
    return childrenOf(parentId).map(item=>(
      <div key={item.id} className="mega-studio-node" style={{marginRight:depth*14}}>
        <div
          draggable
          onDragStart={()=>setDraggingMenuId(item.id)}
          onDragEnd={()=>setDraggingMenuId(null)}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault(); bundleDragging ? dropBundle(item.id) : dropExisting(item.id);}}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-neutral-200 bg-white hover:border-neutral-400"
        >
          <GripVertical className="w-3.5 h-3.5 text-neutral-400 cursor-grab"/>
          <IconRenderer icon={item.icon || item.cssClass} className="w-3.5 h-3.5 text-neutral-500"/>
          <input value={item.title} onChange={e=>patch(item.id,{title:e.target.value})} className="min-w-0 flex-1 bg-transparent text-[10px] font-bold outline-none"/>
          <button type="button" onClick={()=>setIconItemId(item.id)} className="text-[8px] text-blue-600">آیکن</button>
          <button type="button" onClick={()=>removeItem(item.id)} className="text-red-500"><X className="w-3.5 h-3.5"/></button>
        </div>
        {childrenOf(item.id).length>0 && <div className="mt-1 space-y-1 border-r pr-2">{renderNested(item.id,depth+1)}</div>}
      </div>
    ));
  };

  if(!activeRoot && roots.length===0){
    return <div className="bg-white p-10 rounded-3xl border text-center text-xs text-neutral-500">ابتدا در «فهرست‌ها و منوها» یک آیتم سطح اصلی بسازید.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-violet-600"/> Mega Menu Studio</h2>
            <p className="text-xs text-neutral-500 mt-1">انتخاب گروهی، Drag & Drop مستقیم روی ستون، ویرایش ساختار و تنظیمات مگامنو در یک محیط مستقل.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={activeRootId} onChange={e=>setActiveRootId(e.target.value)} className="h-10 px-3 border rounded-xl bg-white text-xs font-bold">
              {roots.map(root=><option key={root.id} value={root.id}>{root.title}</option>)}
            </select>
            <button type="button" onClick={save} disabled={!dirty} className="h-10 px-4 rounded-xl bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-black inline-flex items-center gap-2"><Save className="w-4 h-4"/>ذخیره</button>
          </div>
        </div>
      </div>

      {activeRoot && (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_280px] gap-4 items-start">
          <aside className="bg-white rounded-2xl border border-neutral-200 overflow-hidden xl:sticky xl:top-4">
            <div className="p-4 border-b">
              <strong className="text-sm">کتابخانه محتوا</strong>
              <p className="text-[9px] text-neutral-500 mt-1">چند مورد را تیک بزن، سپس بسته انتخاب‌شده را روی ستون مقصد Drag کن.</p>
            </div>
            <div className="grid grid-cols-2 border-b">
              {sourceTabs.map(tab=><button key={tab.id} onClick={()=>{setSourceTab(tab.id);setSelectedSources(new Set());}} className={`p-2.5 text-[9px] font-bold border-l border-b ${sourceTab===tab.id?'bg-neutral-900 text-white':'bg-white'}`}>{tab.title}</button>)}
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"/>
                <input value={query} onChange={e=>setQuery(e.target.value)} className="w-full pr-9 pl-2 py-2 border rounded-lg text-[10px]" placeholder="جستجو..."/>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button onClick={()=>setSelectedSources(new Set(filteredSources.map(x=>x.key)))} className="text-[9px] text-blue-600 font-bold">انتخاب همه</button>
                <button onClick={()=>setSelectedSources(new Set())} className="text-[9px] text-neutral-400">پاک کردن</button>
              </div>
            </div>
            <div className="max-h-[390px] overflow-y-auto px-2 pb-2">
              {filteredSources.map(item=>(
                <label key={item.key} className="flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input type="checkbox" checked={selectedSources.has(item.key)} onChange={e=>{
                    const next=new Set(selectedSources);e.target.checked?next.add(item.key):next.delete(item.key);setSelectedSources(next);
                  }}/>
                  <span className="min-w-0"><strong className="block text-[10px]">{item.title}</strong><small className="block text-[8px] text-neutral-400 truncate">{item.subtitle}</small></span>
                </label>
              ))}
            </div>
            <div className="p-3 border-t bg-neutral-50">
              <div
                draggable={selectedSources.size>0}
                onDragStart={()=>setBundleDragging(true)}
                onDragEnd={()=>setBundleDragging(false)}
                className={`p-3 rounded-xl border-2 border-dashed text-center ${selectedSources.size?'border-violet-400 bg-violet-50 cursor-grab':'border-neutral-200 text-neutral-300'}`}
              >
                <CheckSquare className="w-5 h-5 mx-auto mb-1"/>
                <strong className="block text-[10px]">{selectedSources.size.toLocaleString('fa-IR')} مورد انتخاب شده</strong>
                <small className="text-[8px]">این بسته را روی ستون مقصد بکش</small>
              </div>
            </div>
          </aside>

          <main className="bg-neutral-100 rounded-2xl border border-neutral-200 p-4 min-h-[650px]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-sm">{activeRoot.title}</h3>
                <p className="text-[9px] text-neutral-500 mt-1">هر کارت یک ستون مگامنو است. آیتم انتخاب‌شده را مستقیم روی کارت رها کن.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={importCategories} className="px-3 py-2 rounded-lg bg-amber-500 text-neutral-950 text-[9px] font-black">ورود خودکار دسته‌بندی‌ها</button>
                <button onClick={addEmptyColumn} className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-[9px] font-black inline-flex gap-1 items-center"><Plus className="w-3 h-3"/>ستون جدید</button>
              </div>
            </div>

            <div
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();bundleDragging?dropBundle(activeRoot.id):dropExisting(activeRoot.id);}}
              className="mb-4 min-h-12 grid place-items-center rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 text-violet-700 text-[9px] font-bold"
            >
              رها کردن اینجا = ساخت ستون جدید زیر «{activeRoot.title}»
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns:`repeat(${Math.max(1,Math.min(6,activeRoot.megaMenu?.columns||4))},minmax(0,1fr))`}}>
              {childrenOf(activeRoot.id).map((column,index)=>(
                <section
                  key={column.id}
                  draggable
                  onDragStart={()=>setDraggingMenuId(column.id)}
                  onDragEnd={()=>setDraggingMenuId(null)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();bundleDragging?dropBundle(column.id):dropExisting(column.id);}}
                  className="min-w-0 bg-white rounded-xl border border-neutral-200 shadow-xs p-3"
                >
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab"/>
                    <button onClick={()=>setIconItemId(column.id)} className="w-7 h-7 rounded-lg bg-neutral-100 grid place-items-center"><IconRenderer icon={column.icon||column.cssClass} className="w-4 h-4"/></button>
                    <input value={column.title} onChange={e=>patch(column.id,{title:e.target.value})} className="min-w-0 flex-1 font-black text-[10px] outline-none"/>
                    <div className="flex items-center">
                      <button onClick={()=>moveSibling(column.id,'up')}><ArrowUp className="w-3 h-3"/></button>
                      <button onClick={()=>moveSibling(column.id,'down')}><ArrowDown className="w-3 h-3"/></button>
                      <button onClick={()=>removeItem(column.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 min-h-24">
                    {renderNested(column.id)}
                    <div className="p-2 rounded-lg border border-dashed text-[8px] text-neutral-400 text-center">Drop آیتم‌ها اینجا</div>
                  </div>
                </section>
              ))}
            </div>
          </main>

          <aside className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4 xl:sticky xl:top-4">
            <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-violet-600"/><strong className="text-sm">تنظیمات مگامنو</strong></div>
            {!activeRoot.megaMenu?.enabled ? (
              <button onClick={enableMega} className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black">فعال‌سازی Mega Menu</button>
            ) : (
              <>
                <label className="block">
                  <span className="block text-[9px] font-bold mb-1">تعداد ستون نمایشی</span>
                  <select value={activeRoot.megaMenu.columns||4} onChange={e=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,columns:Number(e.target.value)}})} className="w-full p-2 border rounded-lg text-xs bg-white">
                    {[2,3,4,5,6].map(n=><option key={n} value={n}>{n} ستون</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[9px] font-bold mb-1">عرض مگامنو</span>
                  <select value={activeRoot.megaMenu.width||'full'} onChange={e=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,width:e.target.value as 'boxed'|'full'}})} className="w-full p-2 border rounded-lg text-xs bg-white">
                    <option value="full">تمام عرض</option><option value="boxed">داخل کانتینر</option>
                  </select>
                </label>
                <button onClick={()=>setIconItemId(activeRoot.id)} className="w-full py-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-2"><IconRenderer icon={activeRoot.icon||activeRoot.cssClass} className="w-4 h-4"/>انتخاب آیکن منوی اصلی</button>
                <label className="block text-xs">رنگ پس‌زمینه<input type="color" value={activeRoot.megaMenu.backgroundColor || '#ffffff'} onChange={e => patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,backgroundColor:e.target.value}})} className="block w-full h-9" /></label>
                <ImageUploadInput label="عکس یا پترن پس‌زمینه" value={activeRoot.megaMenu.backgroundImageUrl || ''} onChange={url=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,backgroundImageUrl:url}})} presetCategory="banners" />
                <select aria-label="حالت پس‌زمینه" value={activeRoot.megaMenu.backgroundMode || 'cover'} onChange={e => patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,backgroundMode:e.target.value as 'cover'|'pattern'}})} className="w-full p-2 border rounded-lg text-xs"><option value="cover">عکس تمام‌پوش</option><option value="pattern">پترن تکرارشونده</option></select>
                <ImageUploadInput label="بنر اختیاری" value={activeRoot.megaMenu.bannerImageUrl||''} onChange={url=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,bannerImageUrl:url}})} aspectRatio="banner" presetCategory="banners"/>
                <input value={activeRoot.megaMenu.bannerTitle||''} onChange={e=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,bannerTitle:e.target.value}})} className="w-full p-2 border rounded-lg text-xs" placeholder="عنوان بنر"/>
                <input dir="ltr" value={activeRoot.megaMenu.bannerLink||''} onChange={e=>patch(activeRoot.id,{megaMenu:{...activeRoot.megaMenu!,bannerLink:e.target.value}})} className="w-full p-2 border rounded-lg text-xs text-left" placeholder="لینک بنر"/>
              </>
            )}
          </aside>
        </div>
      )}

      {iconItemId && (
        <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <IconPicker
              value={menus.find(item=>item.id===iconItemId)?.icon}
              onChange={icon=>{patch(iconItemId,{icon});setIconItemId(null);}}
              onClose={()=>setIconItemId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
